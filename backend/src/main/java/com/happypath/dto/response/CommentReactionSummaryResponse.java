package com.happypath.dto.response;

import com.happypath.model.ReactionType;
import java.util.Map;

/**
 * Riepilogo delle reazioni su un commento:
 * - conteggio totale
 * - breakdown per tipo
 * - tipo scelto dall'utente corrente (null se non ha reagito)
 */
public record CommentReactionSummaryResponse(
        long total,
        Map<ReactionType, Long> counts,
        ReactionType myReaction
) {}
