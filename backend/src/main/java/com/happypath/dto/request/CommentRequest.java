package com.happypath.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CommentRequest(
        @NotBlank @Size(max = 1000) String text,
        Long parentId,
        Long alterEgoId   // opzionale: se presente, il commento viene pubblicato come alter ego
) {}
