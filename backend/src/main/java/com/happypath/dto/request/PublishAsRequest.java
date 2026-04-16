package com.happypath.dto.request;

/**
 * DTO per PATCH /contents/{id}/publisher.
 * alterEgoId = null  → pubblica col profilo reale
 * alterEgoId = <id>  → pubblica con l'alter ego specificato
 */
public record PublishAsRequest(Long alterEgoId) {}
