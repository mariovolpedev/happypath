package com.happypath.mapper;

import com.happypath.dto.response.UserProfile;
import com.happypath.dto.response.UserSummary;
import com.happypath.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * MapStruct mapper for User entity -> DTO conversions.
 *
 * Spring component: inject with @Autowired / constructor injection wherever needed.
 * The generated implementation replaces the manual UserSummary.from(User) factory
 * and the inline toProfile() helper in UserService, centralising all field mapping
 * in one auditable, compile-time-checked place.
 *
 * componentModel = "spring"  -> MapStruct generates a @Component class,
 *                               picked up by Spring's IoC container automatically.
 */
@Mapper(componentModel = "spring")
public interface UserMapper {

    /**
     * Maps a User entity to UserSummary (lightweight DTO used in auth responses
     * and list endpoints).
     */
    UserSummary toSummary(User user);

    /**
     * Maps a User entity to UserProfile (full public profile DTO).
     *
     * The social counters (followersCount, followingCount) and relation flags
     * (isFollowedByMe, isBlockedByMe) cannot be derived from the entity alone
     * and must be set by the caller after mapping.
     *
     * Example:
     * <pre>
     *   UserProfile profile = userMapper.toProfile(target);
     *   // overlay computed fields
     *   profile = new UserProfile(
     *       profile.id(), profile.username(), profile.displayName(),
     *       profile.bio(), profile.avatarUrl(), profile.profileColor(),
     *       profile.role(), profile.verified(),
     *       followersCount, followingCount, isFollowed, isBlocked,
     *       profile.createdAt());
     * </pre>
     *
     * Defaults social counters to 0 and flags to false; callers override these.
     */
    @Mapping(target = "followersCount",  constant = "0L")
    @Mapping(target = "followingCount",  constant = "0L")
    @Mapping(target = "isFollowedByMe",  constant = "false")
    @Mapping(target = "isBlockedByMe",   constant = "false")
    UserProfile toProfile(User user);
}
