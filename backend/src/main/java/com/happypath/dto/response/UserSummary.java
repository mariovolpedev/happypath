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
) {}
