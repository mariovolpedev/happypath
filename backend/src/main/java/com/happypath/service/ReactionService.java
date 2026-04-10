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

    private final ReactionRepository reactionRepository;
    private final ContentService contentService;
    private final NotificationService notificationService;

    @Transactional
    public void react(Long contentId, ReactionType type, User user) {
        Content content = contentService.findById(contentId);
        if (content.getStatus() != ContentStatus.ACTIVE)
            throw new HappyPathException("Contenuto non disponibile", HttpStatus.BAD_REQUEST);

        boolean isNew = reactionRepository.findByUserAndContent(user, content).isEmpty();
        reactionRepository.findByUserAndContent(user, content).ifPresent(reaction -> {
                reactionRepository.delete(reaction);
                reactionRepository.flush();
        });
        reactionRepository.save(Reaction.builder().user(user).content(content).type(type).build());

        if (isNew) {
            notificationService.notifyReaction(user, content);
        }
    }

    @Transactional
    public void removeReaction(Long contentId, User user) {
        Content content = contentService.findById(contentId);
        reactionRepository.findByUserAndContent(user, content)
                .ifPresent(reactionRepository::delete);
    }
}
