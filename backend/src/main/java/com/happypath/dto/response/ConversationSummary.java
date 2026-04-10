package com.happypath.dto.response;

import java.time.LocalDateTime;

/**
 * One entry in the conversations list / inbox.
 */
public record ConversationSummary(
        /** The other participant in the conversation. */
        UserSummary partner,
        /** Text preview of the latest message. */
        String lastMessageText,
        /** Sender of the latest message. */
        UserSummary lastMessageSender,
        LocalDateTime lastMessageAt,
        /** How many messages the current user has not yet read from this partner. */
        long unreadCount
) {}
