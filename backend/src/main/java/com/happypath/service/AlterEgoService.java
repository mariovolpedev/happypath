package com.happypath.service;

import com.happypath.dto.request.AlterEgoRequest;
import com.happypath.dto.response.AlterEgoResponse;
import com.happypath.exception.HappyPathException;
import com.happypath.model.*;
import com.happypath.repository.AlterEgoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AlterEgoService {

    private final AlterEgoRepository alterEgoRepository;
    private final UserService userService;

    @Transactional
    public AlterEgoResponse create(AlterEgoRequest req, User owner) {
        if (!owner.isVerified())
            throw new HappyPathException(
                    "Solo gli utenti verificati possono creare Alter Ego",
                    HttpStatus.FORBIDDEN);
        AlterEgo ae = alterEgoRepository.save(AlterEgo.builder()
                .name(req.name())
                .description(req.description())
                .avatarUrl(req.avatarUrl())
                .owner(owner)
                .build());
        return toResponse(ae);
    }

    public List<AlterEgoResponse> getMyAlterEgos(User owner) {
        return alterEgoRepository.findByOwnerAndActiveTrue(owner)
                .stream().map(this::toResponse).toList();
    }

    /** Restituisce il DTO pubblico di un alter ego attivo. */
    public AlterEgoResponse getById(Long id) {
        return toResponse(findById(id));
    }

    /** Restituisce l'entità alter ego attiva, o lancia 404. */
    public AlterEgo findById(Long id) {
        return alterEgoRepository.findById(id)
                .filter(AlterEgo::isActive)
                .orElseThrow(() ->
                        new HappyPathException("Alter Ego non trovato", HttpStatus.NOT_FOUND));
    }

    @Transactional
    public void delete(Long id, User owner) {
        AlterEgo ae = alterEgoRepository.findById(id)
                .orElseThrow(() ->
                        new HappyPathException("Alter Ego non trovato", HttpStatus.NOT_FOUND));
        if (!ae.getOwner().getId().equals(owner.getId())
                && owner.getRole() != UserRole.ADMIN)
            throw new HappyPathException("Non autorizzato", HttpStatus.FORBIDDEN);
        ae.setActive(false);
        alterEgoRepository.save(ae);
    }

    /**
     * Valida e restituisce l'alter ego per l'utente corrente.
     *
     * @param alterEgoId  null  → agisce come se stesso (ritorna null)
     *                    value → deve essere un AE posseduto dall'utente
     */
    public AlterEgo resolveForUser(Long alterEgoId, User user) {
        if (alterEgoId == null) return null;
        AlterEgo ae = findById(alterEgoId);
        if (!ae.getOwner().getId().equals(user.getId()))
            throw new HappyPathException(
                    "Non sei il proprietario di questo Alter Ego",
                    HttpStatus.FORBIDDEN);
        return ae;
    }

    public AlterEgoResponse toResponse(AlterEgo ae) {
        return new AlterEgoResponse(
                ae.getId(),
                ae.getName(),
                ae.getDescription(),
                ae.getAvatarUrl(),
                userService.toSummary(ae.getOwner()),
                ae.getCreatedAt());
    }
}
