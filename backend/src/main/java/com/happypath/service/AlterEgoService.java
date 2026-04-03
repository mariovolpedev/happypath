package com.happypath.service;

import com.happypath.dto.request.AlterEgoRequest;
import com.happypath.dto.response.AlterEgoResponse;
import com.happypath.exception.HappyPathException;
import com.happypath.model.AlterEgo;
import com.happypath.model.User;
import com.happypath.model.UserRole;
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
            throw new HappyPathException("Solo gli utenti verificati possono creare Alter Ego", HttpStatus.FORBIDDEN);
        AlterEgo ae = alterEgoRepository.save(AlterEgo.builder()
                .name(req.name()).description(req.description())
                .avatarUrl(req.avatarUrl()).owner(owner).build());
        return toResponse(ae);
    }

    public List<AlterEgoResponse> getMyAlterEgos(User owner) {
        return alterEgoRepository.findByOwnerAndActiveTrue(owner).stream().map(this::toResponse).toList();
    }

    @Transactional
    public void delete(Long id, User owner) {
        AlterEgo ae = alterEgoRepository.findById(id)
                .orElseThrow(() -> new HappyPathException("Alter Ego non trovato", HttpStatus.NOT_FOUND));
        if (!ae.getOwner().getId().equals(owner.getId()) && owner.getRole() != UserRole.ADMIN)
            throw new HappyPathException("Non autorizzato", HttpStatus.FORBIDDEN);
        ae.setActive(false);
        alterEgoRepository.save(ae);
    }

    private AlterEgoResponse toResponse(AlterEgo ae) {
        return new AlterEgoResponse(ae.getId(), ae.getName(), ae.getDescription(),
                ae.getAvatarUrl(), userService.toSummary(ae.getOwner()));
    }
}
