package com.happypath.dto.response;

/**
 * Risposta restituita dopo un upload di media su MinIO.
 *
 * @param url       URL pubblico del file caricato
 * @param objectKey chiave S3 (utile al client per future operazioni di delete)
 * @param mimeType  tipo MIME rilevato
 * @param sizeBytes dimensione in byte
 */
public record MediaUploadResponse(
        String url,
        String objectKey,
        String mimeType,
        long   sizeBytes
) {}
