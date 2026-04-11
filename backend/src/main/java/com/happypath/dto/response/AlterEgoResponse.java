package com.happypath.dto.response;

public record AlterEgoResponse(
        Long id,
        String name,
        String description,
        String avatarUrl,
        UserSummary owner,
        boolean verified          // ← aggiunto per la feature di verifica Alter Ego
) {
    /** Costruttore di compatibilità per il codice esistente che non passa verified */
    public AlterEgoResponse(Long id, String name, String description,
                             String avatarUrl, UserSummary owner) {
        this(id, name, description, avatarUrl, owner, false);
    }
}
