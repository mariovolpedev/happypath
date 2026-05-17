package com.happypath.dto.request;

import com.happypath.model.ReactionType;
import jakarta.validation.constraints.NotNull;

public record CommentReactionRequest(
        @NotNull ReactionType type,
        Long alterEgoId   // opzionale: se presente, reagisce come alter ego
) {}
