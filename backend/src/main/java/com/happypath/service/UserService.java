package com.happypath.service;

import com.happypath.config.RedisConfig;
import com.happypath.dto.request.UpdateProfileRequest;
import com.happypath.dto.response.UserProfile;
import com.happypath.dto.response.UserSummary;
import com.happypath.exception.HappyPathException;
import com.happypath.model.Follow;
import com.happypath.model.User;
import com.happypath.repository.BlockRepository;
import com.happypath.repository.FollowRepository;
import com.happypath.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final NotificationService notificationService;
    private final BlockRepository blockRepository;

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

    @Cacheable(
            value = RedisConfig.CACHE_USER_PROFILE,
            key = "#username + ':' + (#currentUser != null ? #currentUser.id : 'anon')")
    public UserProfile getProfile(String username, User currentUser) {
        User target = findByUsername(username);
        boolean isFollowed = currentUser != null
                && followRepository.existsByFollowerAndFollowed(currentUser, target);
        boolean isBlocked = currentUser != null
                && blockRepository.existsByBlockerIdAndBlockedId(currentUser.getId(), target.getId());
        long followers = followRepository.countByFollowed(target);
        long following = followRepository.countByFollower(target);
        return toProfile(target, followers, following, isFollowed, isBlocked);
    }

    @Transactional
    @CacheEvict(value = RedisConfig.CACHE_USER_PROFILE, allEntries = true)
    public UserProfile updateProfile(User user, UpdateProfileRequest req) {
        if (req.displayName()  != null) user.setDisplayName(req.displayName());
        if (req.bio()          != null) user.setBio(req.bio());
        if (req.avatarUrl()    != null) user.setAvatarUrl(req.avatarUrl());
        if (req.profileColor() != null) user.setProfileColor(req.profileColor());
        user = userRepository.save(user);
        return getProfile(user.getUsername(), user);
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = RedisConfig.CACHE_USER_PROFILE,
                        key = "#follower.username + ':' + #follower.id"),
            @CacheEvict(value = RedisConfig.CACHE_USER_PROFILE,
                        key = "''+#targetId+':anon'")
    })
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
    }

    @Transactional
    @CacheEvict(value = RedisConfig.CACHE_USER_PROFILE, allEntries = true)
    public void unfollow(User follower, Long targetId) {
        User target = findById(targetId);
        Follow follow = followRepository.findByFollowerAndFollowed(follower, target)
                .orElseThrow(() -> new HappyPathException("Non segui questo utente", HttpStatus.BAD_REQUEST));
        followRepository.delete(follow);
    }

    /**
     * Rimuove un seguace: l'utente con id followerId smette di seguire `owner`.
     */
    @Transactional
    @CacheEvict(value = RedisConfig.CACHE_USER_PROFILE, allEntries = true)
    public void removeFollower(User owner, Long followerId) {
        User follower = findById(followerId);
        Follow follow = followRepository.findByFollowerAndFollowed(follower, owner)
                .orElseThrow(() -> new HappyPathException("Questo utente non ti segue", HttpStatus.BAD_REQUEST));
        followRepository.delete(follow);
    }

    public List<UserSummary> getFollowers(User user) {
        return followRepository.findByFollowed(user).stream()
                .map(f -> UserSummary.from(f.getFollower()))
                .toList();
    }

    public List<UserSummary> getFollowing(User user) {
        return followRepository.findByFollower(user).stream()
                .map(f -> UserSummary.from(f.getFollowed()))
                .toList();
    }

    public List<UserSummary> getFollowersByUsername(String username) {
        User user = findByUsername(username);
        return followRepository.findByFollowed(user).stream()
                .map(f -> UserSummary.from(f.getFollower()))
                .toList();
    }

    public List<UserSummary> getFollowingByUsername(String username) {
        User user = findByUsername(username);
        return followRepository.findByFollower(user).stream()
                .map(f -> UserSummary.from(f.getFollowed()))
                .toList();
    }

    public List<UserSummary> search(String query) {
        return userRepository.searchByUsernameOrDisplayName(query).stream()
                .map(UserSummary::from)
                .toList();
    }

    public UserSummary toSummary(User u) {
        return UserSummary.from(u);
    }

    private UserProfile toProfile(User target, long followers, long following,
                                  boolean isFollowed, boolean isBlocked) {
        return new UserProfile(
                target.getId(), target.getUsername(), target.getDisplayName(),
                target.getBio(), target.getAvatarUrl(), target.getProfileColor(),
                target.getRole(), target.isVerified(),
                followers, following, isFollowed, isBlocked, target.getCreatedAt());
    }
}
