package com.happypath.service;

import com.happypath.dto.request.AlterEgoVerificationRequest;
import com.happypath.dto.request.AlterEgoVerificationReviewRequest;
import com.happypath.dto.request.AlterEgoVerificationSubmitRequest;
import com.happypath.dto.response.AlterEgoResponse;
import com.happypath.dto.response.AlterEgoVerificationResponse;
import com.happypath.exception.HappyPathException;
import com.happypath.model.*;
import com.happypath.repository.AlterEgoRepository;
import com.happypath.repository.AlterEgoVerificationRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AlterEgoVerificationService {

    private final AlterEgoVerificationRequestRepository verificationRepo;
    private final AlterEgoRepository alterEgoRepository;
    private final UserService userService;

    // ── Utente: invia richiesta ───────────────────────────────────────────────

    @Transactional
    public AlterEgoVerificationResponse submitRequest(
            AlterEgoVerificationSubmitRequest req, User requester) {

        AlterEgo alterEgo = alterEgoRepository.findById(req.alterEgoId())
                .orElseThrow(() -> new HappyPathException("Alter Ego non trovato", HttpStatus.NOT_FOUND));

        if (!alterEgo.getOwner().getId().equals(requester.getId()))
            throw new HappyPathException("Non sei il proprietario di questo Alter Ego", HttpStatus.FORBIDDEN);

        if (!requester.isVerified())
            throw new HappyPathException(
                    "Solo gli utenti con identità verificata possono richiedere la verifica di un Alter Ego",
                    HttpStatus.FORBIDDEN);

        if (verificationRepo.existsByAlterEgoAndStatus(alterEgo, AlterEgoVerificationStatus.PENDING))
            throw new HappyPathException(
                    "Esiste già una richiesta di verifica in attesa per questo Alter Ego", HttpStatus.CONFLICT);

        if (alterEgo.isVerified())
            throw new HappyPathException("Questo Alter Ego è già verificato", HttpStatus.CONFLICT);

        AlterEgoVerificationRequest entity = AlterEgoVerificationRequest.builder()
                .alterEgo(alterEgo)
                .requester(requester)
                .firstName(req.firstName().toUpperCase().trim())
                .lastName(req.lastName().toUpperCase().trim())
                .birthDate(req.birthDate())
                .birthPlace(req.birthPlace().trim())
                .codiceFiscale(req.codiceFiscale().toUpperCase().trim())
                .build();

        return toResponse(verificationRepo.save(entity), false);
    }

    // ── Utente: storico richieste ─────────────────────────────────────────────

    public Page<AlterEgoVerificationResponse> getMyRequests(User user, Pageable pageable) {
        return verificationRepo.findByRequesterOrderByCreatedAtDesc(user, pageable)
                .map(r -> toResponse(r, false));
    }

    // ── Moderatore/Admin: lista pendenti ─────────────────────────────────────

    public Page<AlterEgoVerificationResponse> getPendingRequests(Pageable pageable) {
        return verificationRepo.findByStatusOrderByCreatedAtDesc(
                AlterEgoVerificationStatus.PENDING, pageable)
                .map(r -> toResponse(r, true));
    }

    // ── Moderatore/Admin: approva o rifiuta ──────────────────────────────────

    @Transactional
    public AlterEgoVerificationResponse reviewRequest(
            Long requestId, AlterEgoVerificationReviewRequest decision, User reviewer) {

        AlterEgoVerificationRequest req = verificationRepo.findById(requestId)
                .orElseThrow(() -> new HappyPathException("Richiesta non trovata", HttpStatus.NOT_FOUND));

        if (req.getStatus() != AlterEgoVerificationStatus.PENDING)
            throw new HappyPathException("Questa richiesta è già stata gestita", HttpStatus.CONFLICT);

        req.setReviewer(reviewer);
        req.setReviewNote(decision.note());
        req.setReviewedAt(LocalDateTime.now());

        if (Boolean.TRUE.equals(decision.approved())) {
            req.setStatus(AlterEgoVerificationStatus.APPROVED);
            AlterEgo ae = req.getAlterEgo();
            ae.setVerified(true);
            alterEgoRepository.save(ae);
        } else {
            req.setStatus(AlterEgoVerificationStatus.REJECTED);
        }

        return toResponse(verificationRepo.save(req), true);
    }

    // ── Mapper ───────────────────────────────────────────────────────────────

    private AlterEgoVerificationResponse toResponse(
            AlterEgoVerificationRequest r, boolean includePersonalData) {

        AlterEgo ae = r.getAlterEgo();
        AlterEgoResponse aeResp = new AlterEgoResponse(
                ae.getId(), ae.getName(), ae.getDescription(),
                ae.getAvatarUrl(), userService.toSummary(ae.getOwner()),
                ae.isVerified());

        return new AlterEgoVerificationResponse(
                r.getId(),
                aeResp,
                userService.toSummary(r.getRequester()),
                includePersonalData ? r.getFirstName()     : "***",
                includePersonalData ? r.getLastName()      : "***",
                includePersonalData ? r.getBirthDate()     : null,
                includePersonalData ? r.getBirthPlace()    : "***",
                includePersonalData ? r.getCodiceFiscale() : "***",
                r.getStatus(),
                r.getReviewer() != null ? userService.toSummary(r.getReviewer()) : null,
                r.getReviewNote(),
                r.getCreatedAt(),
                r.getReviewedAt()
        );
    }
}
