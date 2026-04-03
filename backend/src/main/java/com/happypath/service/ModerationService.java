package com.happypath.service;

import com.happypath.exception.HappyPathException;
import com.happypath.model.*;
import com.happypath.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ModerationService {

    private final ContentRepository contentRepository;
    private final BanRepository banRepository;
    private final WarningRepository warningRepository;
    private final UserRepository userRepository;

    @Transactional
    public void censorContent(Long contentId, String note, User moderator) {
        Content content = contentRepository.findById(contentId)
                .orElseThrow(() -> new HappyPathException("Contenuto non trovato", HttpStatus.NOT_FOUND));
        content.setStatus(ContentStatus.CENSORED);
        content.setModerationNote(note);
        contentRepository.save(content);
    }

    @Transactional
    public void deleteContent(Long contentId, String note, User moderator) {
        Content content = contentRepository.findById(contentId)
                .orElseThrow(() -> new HappyPathException("Contenuto non trovato", HttpStatus.NOT_FOUND));
        content.setStatus(ContentStatus.DELETED);
        content.setModerationNote(note);
        contentRepository.save(content);
    }

    @Transactional
    public void warnUser(Long userId, String reason, Long relatedContentId, User moderator) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new HappyPathException("Utente non trovato", HttpStatus.NOT_FOUND));
        warningRepository.save(Warning.builder()
                .user(user).issuedBy(moderator).reason(reason)
                .relatedContentId(relatedContentId).build());
    }

    @Transactional
    public void banUser(Long userId, BanDuration duration, String reason, User moderator) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new HappyPathException("Utente non trovato", HttpStatus.NOT_FOUND));

        LocalDateTime expiresAt = switch (duration) {
            case SHORT -> LocalDateTime.now().plusDays(1);
            case MEDIUM -> LocalDateTime.now().plusDays(7);
            case LONG -> LocalDateTime.now().plusDays(30);
            case PERMANENT -> null;
        };

        banRepository.save(Ban.builder()
                .user(user).issuedBy(moderator).duration(duration)
                .reason(reason).expiresAt(expiresAt).build());

        if (duration == BanDuration.PERMANENT) {
            user.setActive(false);
            userRepository.save(user);
        }
    }

    @Transactional
    public void liftBan(Long banId, String adminDecision, User admin) {
        Ban ban = banRepository.findById(banId)
                .orElseThrow(() -> new HappyPathException("Ban non trovato", HttpStatus.NOT_FOUND));
        ban.setActive(false);
        ban.setAdminDecision(adminDecision);
        ban.setDecidedBy(admin);
        banRepository.save(ban);
        // Riattiva l'account se era disattivato
        User user = ban.getUser();
        if (!user.isActive()) {
            user.setActive(true);
            userRepository.save(user);
        }
    }
}
