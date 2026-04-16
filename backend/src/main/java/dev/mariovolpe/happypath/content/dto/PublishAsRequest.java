package dev.mariovolpe.happypath.content.dto;

/**
 * DTO per l'endpoint PATCH /contents/{id}/publisher.
 * alterEgoId = null → pubblica col profilo reale
 * alterEgoId = <id> → pubblica con l'alter ego specificato
 */
public record PublishAsRequest(Long alterEgoId) {}
