package com.happypath.service;

import com.happypath.dto.request.VerificationRequestDto;
import com.happypath.dto.response.VerificationRequestResponse;
import com.happypath.model.User;
import com.happypath.model.VerificationRequest;
import com.happypath.model.VerificationRequestStatus;
import com.happypath.repository.UserRepository;
import com.happypath.repository.VerificationRequestRepository;
import com.happypath.util.CodiceFiscaleValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class VerificationRequestService {

    private final VerificationRequestRepository verificationRepo;
    private final UserRepository userRepository;

    /** Invia una nuova richiesta di verifica */
    @Transactional
    public VerificationRequestResponse submit(User user, VerificationRequestDto dto) {
        if (user.isVerified()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Sei già verificato.");
        }
        if (verificationRepo.existsByUserAndStatus(user, VerificationRequestStatus.PENDING)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Hai già una richiesta di verifica in attesa di revisione.");
        }

        // Validazione formato codice fiscale (con messaggi granulari)
        CodiceFiscaleValidator.FormatResult formatResult =
            CodiceFiscaleValidator.validateFormat(dto.fiscalCode());

        if (formatResult == CodiceFiscaleValidator.FormatResult.INVALID_CHARSET) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                "Il codice fiscale non è formalmente valido: controlla lunghezza (deve essere 16 caratteri) e che contenga solo lettere e numeri ammessi.");
        }
        if (formatResult == CodiceFiscaleValidator.FormatResult.INVALID_CIN) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                "Il carattere di controllo del codice fiscale (l'ultimo carattere) non è corretto. Verifica di aver inserito il codice fiscale esattamente come riportato sul documento.");
        }

        // Controllo coerenza dati anagrafici con quelli forniti in fase di registrazione
        assertConsistencyWithRegistration(user, dto);

        // Controllo incrociato CF con dati anagrafici
        if (!CodiceFiscaleValidator.isCoherent(
                dto.fiscalCode(),
                dto.lastName(),
                dto.firstName(),
                dto.birthDate(),
                dto.gender())) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                "Il codice fiscale non è coerente con i dati anagrafici forniti. Verifica nome, cognome, data di nascita e genere.");
        }

        var request = VerificationRequest.builder()
                .user(user)
                .firstName(dto.firstName().trim())
                .lastName(dto.lastName().trim())
                .birthDate(dto.birthDate())
                .birthPlace(dto.birthPlace().trim())
                .gender(dto.gender().toUpperCase())
                .fiscalCode(dto.fiscalCode().toUpperCase())
                .status(VerificationRequestStatus.PENDING)
                .build();

        return VerificationRequestResponse.from(verificationRepo.save(request));
    }

    /** Restituisce l'ultima richiesta dell'utente (qualunque stato) */
    public Optional<VerificationRequestResponse> getMyLatest(User user) {
        return verificationRepo.findTopByUserOrderByCreatedAtDesc(user)
                .map(VerificationRequestResponse::from);
    }

    /** Lista delle richieste PENDING per i moderatori */
    public Page<VerificationRequestResponse> getPending(Pageable pageable) {
        return verificationRepo
                .findByStatusOrderByCreatedAtAsc(VerificationRequestStatus.PENDING, pageable)
                .map(VerificationRequestResponse::from);
    }

    /** Approva una richiesta: imposta verified=true sull'utente */
    @Transactional
    public VerificationRequestResponse approve(Long requestId, User reviewer, String note) {
        var req = findOrThrow(requestId);
        assertPending(req);
        req.setStatus(VerificationRequestStatus.APPROVED);
        req.setReviewedBy(reviewer);
        req.setReviewedAt(LocalDateTime.now());
        req.setReviewNote(note);

        User target = req.getUser();
        target.setVerified(true);
        userRepository.save(target);

        return VerificationRequestResponse.from(verificationRepo.save(req));
    }

    /** Rifiuta una richiesta con motivazione */
    @Transactional
    public VerificationRequestResponse reject(Long requestId, User reviewer, String note) {
        var req = findOrThrow(requestId);
        assertPending(req);
        req.setStatus(VerificationRequestStatus.REJECTED);
        req.setReviewedBy(reviewer);
        req.setReviewedAt(LocalDateTime.now());
        req.setReviewNote(note);
        return VerificationRequestResponse.from(verificationRepo.save(req));
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    /**
     * Verifica che i dati anagrafici forniti per la verifica siano coerenti
     * con quelli indicati dall'utente in fase di registrazione.
     *
     * Controlla:
     *  - birthDate: deve coincidere esattamente
     *  - nome completo (firstName + lastName): deve corrispondere al displayName
     *    registrato, confrontando in modo normalizzato (lowercase, senza accenti,
     *    spazi multipli collassati)
     */
    private void assertConsistencyWithRegistration(User user, VerificationRequestDto dto) {
        if (user.getBirthDate() == null || !user.getBirthDate().equals(dto.birthDate())) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "La data di nascita fornita per la verifica non coincide con quella indicata in fase di registrazione.");
        }

        String registeredDisplayName = normalizeName(user.getDisplayName());
        String verificationFullName  = normalizeName(dto.firstName() + " " + dto.lastName());

        if (!registeredDisplayName.equals(verificationFullName)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "I dati anagrafici forniti per la verifica non sono coerenti con il nome visualizzato indicato in fase di registrazione.");
        }
    }

    /**
     * Normalizza una stringa per il confronto dei nomi:
     * trim, rimozione diacritici (NFD), lowercase, collasso spazi multipli.
     */
    private String normalizeName(String value) {
        if (value == null) {
            return "";
        }
        String normalized = Normalizer.normalize(value.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase();
        return normalized.replaceAll("\\s+", " ");
    }

    private VerificationRequest findOrThrow(Long id) {
        return verificationRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Richiesta di verifica non trovata."));
    }

    private void assertPending(VerificationRequest req) {
        if (req.getStatus() != VerificationRequestStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La richiesta è già stata processata.");
        }
    }
}
