package com.happypath.dto.response;

import com.happypath.model.ReactionType;
import java.time.LocalDateTime;

/**
 * Singola reazione su un commento — usata nel dettaglio della lista reazioni.
 */
public record CommentReactionResponse(
        Long id,
        ReactionType type,
        UserSummary user,
        AlterEgoResponse alterEgo,
        LocalDateTime createdAt
) {}
