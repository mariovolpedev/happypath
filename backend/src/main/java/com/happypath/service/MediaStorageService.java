package com.happypath.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.io.IOException;
import java.time.Duration;
import java.util.Set;
import java.util.UUID;

/**
 * Gestisce upload, download (presigned URL) ed eliminazione di file
 * su MinIO tramite l'SDK AWS S3 v2.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MediaStorageService {

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"
    );
    private static final Set<String> ALLOWED_VIDEO_TYPES = Set.of(
            "video/mp4", "video/webm", "video/ogg", "video/quicktime"
    );
    private static final long MAX_IMAGE_BYTES = 20L * 1024 * 1024;  // 20 MB
    private static final long MAX_VIDEO_BYTES = 100L * 1024 * 1024; // 100 MB

    private final S3Client    s3Client;
    private final S3Presigner s3Presigner;

    @Value("${minio.bucket}")
    private String bucket;

    @Value("${minio.public-url}")
    private String publicUrl;

    // -------------------------------------------------------------------------
    // Upload
    // -------------------------------------------------------------------------

    /**
     * Carica un file su MinIO e restituisce l'URL pubblico.
     *
     * @param file       il file ricevuto dal client (MultipartFile)
     * @param subfolder  cartella logica all'interno del bucket (es. "images", "videos")
     * @return URL pubblico del file caricato
     */
    public String upload(MultipartFile file, String subfolder) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File non può essere vuoto");
        }

        String detectedMime = detectMimeType(file);
        validateFile(file, detectedMime);

        String objectKey = buildObjectKey(subfolder, file.getOriginalFilename());

        try {
            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(objectKey)
                    .contentType(detectedMime)
                    .contentLength(file.getSize())
                    .build();

            s3Client.putObject(putRequest,
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

            log.info("File caricato su MinIO: bucket={} key={}", bucket, objectKey);
            return buildPublicUrl(objectKey);

        } catch (IOException e) {
            throw new RuntimeException("Errore durante la lettura del file", e);
        } catch (S3Exception e) {
            log.error("Errore MinIO durante l'upload: {}", e.getMessage());
            throw new RuntimeException("Errore durante l'upload su MinIO", e);
        }
    }

    // -------------------------------------------------------------------------
    // Delete
    // -------------------------------------------------------------------------

    /**
     * Elimina un oggetto dal bucket.
     *
     * @param objectKey chiave S3 dell'oggetto (es. "images/uuid-filename.jpg")
     */
    public void delete(String objectKey) {
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(objectKey)
                    .build());
            log.info("File eliminato da MinIO: bucket={} key={}", bucket, objectKey);
        } catch (S3Exception e) {
            log.error("Errore MinIO durante la cancellazione: {}", e.getMessage());
            throw new RuntimeException("Errore durante la cancellazione da MinIO", e);
        }
    }

    // -------------------------------------------------------------------------
    // Presigned URL (opzionale – utile per accesso privato)
    // -------------------------------------------------------------------------

    /**
     * Genera un presigned URL valido per {@code durationMinutes} minuti.
     */
    public String generatePresignedUrl(String objectKey, int durationMinutes) {
        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(durationMinutes))
                .getObjectRequest(r -> r.bucket(bucket).key(objectKey))
                .build();
        return s3Presigner.presignGetObject(presignRequest).url().toString();
    }

    // -------------------------------------------------------------------------
    // Helpers privati
    // -------------------------------------------------------------------------

    private String detectMimeType(MultipartFile file) {
        Tika tika = new Tika();
        try {
            return tika.detect(file.getInputStream());
        } catch (IOException e) {
            // fallback al content-type dichiarato dal client
            return file.getContentType() != null ? file.getContentType() : "application/octet-stream";
        }
    }

    private void validateFile(MultipartFile file, String mimeType) {
        boolean isImage = ALLOWED_IMAGE_TYPES.contains(mimeType);
        boolean isVideo = ALLOWED_VIDEO_TYPES.contains(mimeType);

        if (!isImage && !isVideo) {
            throw new IllegalArgumentException(
                    "Tipo di file non supportato: " + mimeType +
                    ". Sono ammessi: immagini (JPEG, PNG, GIF, WebP, AVIF) e video (MP4, WebM, OGG, MOV)");
        }

        long maxBytes = isImage ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
        if (file.getSize() > maxBytes) {
            throw new IllegalArgumentException(
                    "File troppo grande. Massimo consentito: " + (maxBytes / 1024 / 1024) + " MB");
        }
    }

    private String buildObjectKey(String subfolder, String originalFilename) {
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf('.'));
        }
        return subfolder + "/" + UUID.randomUUID() + extension;
    }

    private String buildPublicUrl(String objectKey) {
        // es: http://localhost:9000/happypath-media/images/uuid.jpg
        return publicUrl + "/" + bucket + "/" + objectKey;
    }
}
