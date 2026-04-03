package com.happypath.dto.response;

import java.time.LocalDateTime;

public record MessageResponse(
        Long id,
        UserSummary sender,
        UserSummary recipient,
        String text,
        boolean readByRecipient,
        LocalDateTime sentAt
) {}
