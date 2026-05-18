package com.happypath.service;

import com.happypath.config.RedisConfig;
import com.happypath.dto.request.UpdateProfileRequest;
import com.happypath.dto.response.UserProfile;
import com.happypath.dto.response.UserSummary;
import com.happypath.exception.HappyPathException;
import com.happypath.mapper.UserMapper;
import com.happypath.model.Follow;
import com.happypath.model.User;
import com.happypath.repository.BlockRepository;
import com.happypath.repository.FollowRepository;
import com.happypath.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository        userRepository;
    private final FollowRepository      followRepository;
    private final NotificationService   notificationService;
    private final BlockRepository       blockRepository;
    private final UserMapper            userMapper;
    /**
     * Used for precise cache invalidation: evict only the keys that reference
     * the two users involved in a follow/unfollow operation, rather than
     * wiping the entire user-profile cache with allEntries = true.
     */
    private final RedisTemplate<String, Object> redisTemplate;

    // ---------------------------------------------------------------
    // Finders
    // ---------------------------------------------------------------

    public User findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new HappyPathException("Utente non trovato", HttpStatus.NOT_FOUND));
    }

    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new HappyPathException("Utente non trovato", HttpStatus.NOT_FOUND));
    }

    /** Persiste direttamente un'entità User già modificata. */
    @Transactional
    public User save(User user) {
        return userRepository.save(user);
    }

    /**
     * Converts a User entity to UserSummary via MapStruct.
     * Exposed publicly so controllers (e.g. UserController.completeTutorial)
     * can obtain a summary after a save without needing direct mapper injection.
     */
    public UserSummary toSummary(User user) {
        return userMapper.toSummary(user);
    }

    // ---------------------------------------------------------------
    // Profile
    // ---------------------------------------------------------------

    @Cacheable(
            value = RedisConfig.CACHE_USER_PROFILE,
            key = "#username + ':' + (#currentUser != null ? #currentUser.id : 'anon')")
    public UserProfile getProfile(String username, User currentUser) {
        User target = findByUsername(username);
        boolean isFollowed = currentUser != null
                && followRepository.existsByFollowerAndFollowed(currentUser, target);
        boolean isBlocked  = currentUser != null
                && blockRepository.existsByBlockerIdAndBlockedId(currentUser.getId(), target.getId());
        long followers = followRepository.countByFollowed(target);
        long following  = followRepository.countByFollower(target);
        return toProfile(target, followers, following, isFollowed, isBlocked);
    }

    /**
     * Updates a user's profile fields and evicts ONLY the affected user's
     * cache entries (all viewer variants) rather than clearing the whole cache.
     */
    @Transactional
    public UserProfile updateProfile(User user, UpdateProfileRequest req) {
        if (req.displayName()  != null) user.setDisplayName(req.displayName());
        if (req.bio()          != null) user.setBio(req.bio());
        if (req.avatarUrl()    != null) user.setAvatarUrl(req.avatarUrl());
        if (req.profileColor() != null) user.setProfileColor(req.profileColor());
        user = userRepository.save(user);
        evictUserProfileKeys(user.getUsername());
        return getProfile(user.getUsername(), user);
    }

    // ---------------------------------------------------------------
    // Follow / Unfollow
    // ---------------------------------------------------------------

    @Transactional
    public void follow(User follower, Long targetId) {
        User target = findById(targetId);
        if (follower.getId().equals(targetId))
            throw new HappyPathException("Non puoi seguire te stesso", HttpStatus.BAD_REQUEST);

        if (blockRepository.existsByBlockerIdAndBlockedId(target.getId(), follower.getId())
                || blockRepository.existsByBlockerIdAndBlockedId(follower.getId(), target.getId()))
            throw new HappyPathException("Non è possibile seguire questo utente", HttpStatus.FORBIDDEN);

        if (followRepository.existsByFollowerAndFollowed(follower, target))
            throw new HappyPathException("Segui già questo utente", HttpStatus.CONFLICT);

        followRepository.save(Follow.builder().follower(follower).followed(target).build());
        notificationService.notifyFollow(follower, target);

        // Precise invalidation: only the two affected users' profile variants
        evictUserProfileKeys(follower.getUsername());
        evictUserProfileKeys(target.getUsername());
    }

    @Transactional
    public void unfollow(User follower, Long targetId) {
        User target = findById(targetId);
        Follow follow = followRepository.findByFollowerAndFollowed(follower, target)
                .orElseThrow(() -> new HappyPathException("Non segui questo utente", HttpStatus.BAD_REQUEST));
        followRepository.delete(follow);

        evictUserProfileKeys(follower.getUsername());
        evictUserProfileKeys(target.getUsername());
    }

    /**
     * Rimuove un seguace: l'utente con id followerId smette di seguire `owner`.
     */
    @Transactional
    public void removeFollower(User owner, Long followerId) {
        User follower = findById(followerId);
        Follow follow = followRepository.findByFollowerAndFollowed(follower, owner)
                .orElseThrow(() -> new HappyPathException("Questo utente non ti segue", HttpStatus.BAD_REQUEST));
        followRepository.delete(follow);

        evictUserProfileKeys(owner.getUsername());
        evictUserProfileKeys(follower.getUsername());
    }

    // ---------------------------------------------------------------
    // Lists
    // ---------------------------------------------------------------

    public List<UserSummary> getFollowers(User user) {
        return followRepository.findByFollowed(user).stream()
                .map(f -> userMapper.toSummary(f.getFollower()))
                .toList();
    }

    public List<UserSummary> getFollowing(User user) {
        return followRepository.findByFollower(user).stream()
                .map(f -> userMapper.toSummary(f.getFollowed()))
                .toList();
    }

    public List<UserSummary> getFollowersByUsername(String username) {
        User user = findByUsername(username);
        return followRepository.findByFollowed(user).stream()
                .map(f -> userMapper.toSummary(f.getFollower()))
                .toList();
    }

    public List<UserSummary> getFollowingByUsername(String username) {
        User user = findByUsername(username);
        return followRepository.findByFollower(user).stream()
                .map(f -> userMapper.toSummary(f.getFollowed()))
                .toList();
    }

    public List<UserSummary> search(String query) {
        return userRepository.searchByUsernameOrDisplayName(query).stream()
                .map(userMapper::toSummary)
                .toList();
    }

    // ---------------------------------------------------------------
    // Private helpers
    // ---------------------------------------------------------------

    /**
     * Evicts ALL cache entries for a given username regardless of the viewer.
     * The cache key pattern is  "user-profile::username:*"
     * (Spring prefixes the cache name and appends the SpEL key).
     */
    private void evictUserProfileKeys(String username) {
        String pattern = RedisConfig.CACHE_USER_PROFILE + "::" + username + ":*";
        Set<String> keys = redisTemplate.keys(pattern);
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }

    private UserProfile toProfile(User target, long followers, long following,
                                  boolean isFollowed, boolean isBlocked) {
        UserProfile base = userMapper.toProfile(target);
        // Overlay the computed social counters and relation flags
        return new UserProfile(
                base.id(), base.username(), base.displayName(),
                base.bio(), base.avatarUrl(), base.profileColor(),
                base.role(), base.verified(),
                followers, following, isFollowed, isBlocked,
                base.createdAt());
    }
}
