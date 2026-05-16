package com.happypath.dto.response;

/**
 * Singola reazione esposta all'interno di {@link ContentResponse#reactions()}.
 * Contiene i dati minimi per renderizzare il pannello "Chi ha reagito".
 *
 * @param userId    ID dell'utente che ha reagito
 * @param type      nome del tipo di reazione (es. "LOVE", "FIRE")
 * @param user      sommario pubblico dell'utente
 * @param alterEgo  alter ego con cui è stata espressa la reazione, null se come sé stesso
 */
public record ReactionEntryResponse(
        Long userId,
        String type,
        UserSummary user,
        AlterEgoResponse alterEgo
) {}
