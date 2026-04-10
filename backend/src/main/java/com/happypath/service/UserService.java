package com.happypath.service;

import com.happypath.dto.request.UpdateProfileRequest;
import com.happypath.dto.response.UserProfile;
import com.happypath.dto.response.UserSummary;
import com.happypath.exception.HappyPathException;
import com.happypath.model.Follow;
import com.happypath.model.User;
import com.happypath.repository.FollowRepository;
import com.happypath.repository.UserRepository;
import lombok.RequiredArgsConstructor;
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

    public User findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new HappyPathException("Utente non trovato", HttpStatus.NOT_FOUND));
    }

    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new HappyPathException("Utente non trovato", HttpStatus.NOT_FOUND));
    }

    public UserProfile getProfile(String username, User currentUser) {
        User target = findByUsername(username);
        boolean isFollowed = currentUser != null && followRepository.existsByFollowerAndFollowed(currentUser, target);
        long followers = followRepository.countByFollowed(target);
        long following = followRepository.countByFollower(target);
        return toProfile(target, followers, following, isFollowed);
    }

    @Transactional
    public UserProfile updateProfile(User user, UpdateProfileRequest req) {
        if (req.displayName() != null) user.setDisplayName(req.displayName());
        if (req.bio() != null) user.setBio(req.bio());
        if (req.avatarUrl() != null) user.setAvatarUrl(req.avatarUrl());
        user = userRepository.save(user);
        return getProfile(user.getUsername(), user);
    }

    @Transactional
    public void follow(User follower, Long targetId) {
        User target = findById(targetId);
        if (follower.getId().equals(targetId))
            throw new HappyPathException("Non puoi seguire te stesso", HttpStatus.BAD_REQUEST);
        if (followRepository.existsByFollowerAndFollowed(follower, target))
            throw new HappyPathException("Segui già questo utente", HttpStatus.CONFLICT);
        followRepository.save(Follow.builder().follower(follower).followed(target).build());
        notificationService.notifyFollow(follower, target);
    }

    @Transactional
    public void unfollow(User follower, Long targetId) {
        User target = findById(targetId);
        Follow follow = followRepository.findByFollowerAndFollowed(follower, target)
                .orElseThrow(() -> new HappyPathException("Non segui questo utente", HttpStatus.BAD_REQUEST));
        followRepository.delete(follow);
    }

    public List<UserSummary> search(String query) {
        return userRepository.searchByUsernameOrDisplayName(query).stream()
                .map(u -> new UserSummary(u.getId(), u.getUsername(), u.getDisplayName(), u.getAvatarUrl(), u.getRole(), u.isVerified()))
                .toList();
    }

    public UserSummary toSummary(User u) {
        return new UserSummary(u.getId(), u.getUsername(), u.getDisplayName(), u.getAvatarUrl(), u.getRole(), u.isVerified());
    }

    private UserProfile toProfile(User target, long followers, long following, boolean isFollowed) {
        return new UserProfile(
                target.getId(), target.getUsername(), target.getDisplayName(),
                target.getBio(), target.getAvatarUrl(), target.getProfileColor(),
                target.getRole(), target.isVerified(),
                followers, following, isFollowed, target.getCreatedAt());
    }
}
