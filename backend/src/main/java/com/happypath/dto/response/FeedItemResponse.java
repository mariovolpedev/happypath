package com.happypath.dto.response;

import com.happypath.model.FeedItem;

import java.time.LocalDateTime;

/**
 * Elemento generico del feed.
 * Il campo {@code type} discrimina il tipo di notizia;
 * in base al tipo, solo alcuni degli altri campi sono valorizzati.
 *
 * <ul>
 *   <li>CONTENT       → content valorizzato</li>
 *   <li>COMMENT       → content + comment + actor valorizzati</li>
 *   <li>REACTION      → content + reactionType + actor valorizzati</li>
 *   <li>FOLLOW_EVENT  → actor + targetUser valorizzati</li>
 * </ul>
 */
public record FeedItemResponse(
        FeedItem type,
        UserSummary actor,
        ContentResponse content,
        CommentResponse comment,
        String reactionType,
        UserSummary targetUser,
        LocalDateTime eventAt,
        double score
) {}
