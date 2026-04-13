package com.happypath.service;

import com.happypath.exception.HappyPathException;
import com.happypath.model.*;
import com.happypath.repository.ReactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReactionService {

    private final ReactionRepository  reactionRepository;
    private final ContentService      contentService;
    private final AlterEgoService     alterEgoService;
    private final NotificationService notificationService;

    /**
     * @param alterEgoId  null → reagisce come utente, altrimenti come alter ego
     */
    @Transactional
    public void react(Long contentId, ReactionType type, User user, Long alterEgoId) {
        Content content = contentService.findById(contentId);
        if (content.getStatus() != ContentStatus.ACTIVE)
            throw new HappyPathException("Contenuto non disponibile", HttpStatus.BAD_REQUEST);

        AlterEgo alterEgo = alterEgoService.resolveForUser(alterEgoId, user);

        boolean isNew = reactionRepository.findByUserAndContent(user, content).isEmpty();

        reactionRepository.findByUserAndContent(user, content).ifPresent(existing -> {
            reactionRepository.delete(existing);
            reactionRepository.flush();
        });

        reactionRepository.save(Reaction.builder()
                .user(user)
                .alterEgo(alterEgo)
                .content(content)
                .type(type)
                .build());

        if (isNew) notificationService.notifyReaction(user, content);
    }

    @Transactional
    public void removeReaction(Long contentId, User user) {
        Content content = contentService.findById(contentId);
        reactionRepository.findByUserAndContent(user, content)
                .ifPresent(reactionRepository::delete);
    }
}
