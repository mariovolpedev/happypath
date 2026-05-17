package com.happypath.dto.response;

import com.happypath.model.UserRole;

/**
 * DTO restituito nell'AuthResponse e in tutte le API che espongono
 * dati base dell'utente. Il campo tutorialCompleted serve al FE
 * per decidere se mostrare il tutorial al primo accesso.
 */
public record UserSummary(
        Long id,
        String username,
        String displayName,
        String avatarUrl,
        UserRole role,
        boolean verified,
        boolean tutorialCompleted
) {
    /**
     * Factory statica di convenienza: costruisce un UserSummary da un'entità User.
     * Centralizza la mappatura evitando duplicazioni nei service.
     */
    public static UserSummary from(com.happypath.model.User u) {
        return new UserSummary(
                u.getId(),
                u.getUsername(),
                u.getDisplayName(),
                u.getAvatarUrl(),
                u.getRole(),
                u.isVerified(),
                u.isTutorialCompleted()
        );
    }
}
