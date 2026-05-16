package com.happypath.controller;

import com.happypath.dto.response.MediaUploadResponse;
import com.happypath.service.MediaStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * Controller dedicato all'upload e alla gestione dei media (immagini e video).
 *
 * Endpoint:
 *   POST   /api/media/upload          – carica un file su MinIO
 *   DELETE /api/media/{objectKey:.+}  – elimina un file da MinIO
 *
 * Il campo {@code mediaUrl} restituito può essere inserito direttamente
 * nella {@code ContentRequest} per creare un contenuto con il media allegato.
 *
 * Flusso di upload con creazione contenuto in due step:
 *   1. POST /api/media/upload          → ottieni mediaUrl
 *   2. POST /api/contents  (JSON body con mediaUrl)
 *
 * Flusso alternativo in un unico step (multipart):
 *   POST /api/contents/with-media      (vedi ContentController)
 */
@Tag(name = "Media", description = "Upload e gestione di immagini e video tramite MinIO")
@RestController
@RequestMapping("/media")
@RequiredArgsConstructor
public class MediaController {

    private final MediaStorageService mediaStorageService;

    /**
     * Carica un'immagine o un video su MinIO.
     *
     * @param file      file da caricare (multipart/form-data, campo "file")
     * @param subfolder sotto-cartella nel bucket: "images" o "videos" (default: "images")
     */
    @Operation(summary = "Carica un'immagine o un video su MinIO")
    @PreAuthorize("isAuthenticated()")
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MediaUploadResponse> upload(
            @RequestPart("file") MultipartFile file,
            @RequestParam(defaultValue = "images") String subfolder) {

        // Normalizza: accetta solo "images" o "videos"
        String folder = subfolder.equalsIgnoreCase("videos") ? "videos" : "images";

        String url = mediaStorageService.upload(file, folder);

        // Estrai la object key dall'URL per restituirla al client
        String objectKey = extractObjectKey(url);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                new MediaUploadResponse(url, objectKey,
                        file.getContentType(), file.getSize()));
    }

    /**
     * Elimina un file precedentemente caricato su MinIO.
     *
     * @param objectKey chiave S3 del file (es. "images/uuid.jpg")
     *                  Nota: il path-variable usa la regex {@code :.+} per
     *                  consentire slash nella chiave.
     */
    @Operation(summary = "Elimina un media da MinIO")
    @PreAuthorize("isAuthenticated()")
    @DeleteMapping("/{objectKey:.+}")
    public ResponseEntity<Void> delete(@PathVariable String objectKey) {
        mediaStorageService.delete(objectKey);
        return ResponseEntity.noContent().build();
    }

    // -------------------------------------------------------------------------

    private String extractObjectKey(String fullUrl) {
        // fullUrl: http://localhost:9000/happypath-media/images/uuid.jpg
        // objectKey: images/uuid.jpg
        int bucketIdx = fullUrl.indexOf("/happypath-media/");
        if (bucketIdx == -1) return fullUrl;
        return fullUrl.substring(bucketIdx + "/happypath-media/".length());
    }
}
