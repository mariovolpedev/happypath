package com.happypath.service;

import com.happypath.dto.request.MessageRequest;
import com.happypath.dto.response.ConversationSummary;
import com.happypath.dto.response.MessageResponse;
import com.happypath.exception.HappyPathException;
import com.happypath.model.*;
import com.happypath.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final DirectMessageRepository messageRepository;
    private final UserService             userService;
    private final AlterEgoService         alterEgoService;
    private final ContentService          contentService;
    private final BlockRepository         blockRepository;

    @Transactional
    public MessageResponse send(MessageRequest req, User sender) {
        User recipient = userService.findById(req.recipientId());

        if (!sender.isVerified() || !recipient.isVerified())
            throw new HappyPathException(
                    "Entrambi gli utenti devono essere verificati per scambiarsi messaggi",
                    HttpStatus.FORBIDDEN);

        if (blockRepository.existsByBlockerIdAndBlockedId(sender.getId(), recipient.getId()) ||
            blockRepository.existsByBlockerIdAndBlockedId(recipient.getId(), sender.getId()))
            throw new HappyPathException(
                    "Non puoi inviare messaggi a questo utente", HttpStatus.FORBIDDEN);

        AlterEgo senderAe = alterEgoService.resolveForUser(req.senderAlterEgoId(), sender);

        DirectMessage msg = messageRepository.save(DirectMessage.builder()
                .sender(sender)
                .senderAlterEgo(senderAe)
                .recipient(recipient)
                .text(req.text())
                .attachedContentId(req.attachedContentId())
                .attachedUserId(req.attachedUserId())
                .build());

        return toResponse(msg);
    }

    // -----------------------------------------------------------------------
    // Read conversation
    // -----------------------------------------------------------------------

    public Page<MessageResponse> getConversation(Long userId, Long otherId, Pageable pageable) {
        return messageRepository.findConversation(userId, otherId, pageable)
                .map(this::toResponse);
    }

    // -----------------------------------------------------------------------
    // Conversations list (inbox)
    // -----------------------------------------------------------------------

    public List<ConversationSummary> getConversations(User user) {
        List<DirectMessage> latestMessages =
                messageRepository.findLatestMessagePerConversation(user.getId());

        return latestMessages.stream().map(m -> {
            // Determine who the "other" participant is
            User partner = m.getSender().getId().equals(user.getId())
                    ? m.getRecipient()
                    : m.getSender();

            long unread = messageRepository
                    .countBySenderIdAndRecipientIdAndReadByRecipientFalse(
                            partner.getId(), user.getId());

            return new ConversationSummary(
                    userService.toSummary(partner),
                    m.getText(),
                    userService.toSummary(m.getSender()),
                    m.getSentAt(),
                    unread);
        }).collect(Collectors.toList());
    }

    // -----------------------------------------------------------------------
    // Mark as read
    // -----------------------------------------------------------------------

    @Transactional
    public void markConversationAsRead(Long currentUserId, Long partnerId) {
        messageRepository.findConversation(partnerId, currentUserId, Pageable.unpaged())
                .stream()
                .filter(m -> m.getRecipient().getId().equals(currentUserId)
                        && !m.isReadByRecipient())
                .forEach(m -> {
                    m.setReadByRecipient(true);
                    messageRepository.save(m);
                });
    }

    // -----------------------------------------------------------------------
    // Unread count
    // -----------------------------------------------------------------------

    public long countUnread(Long userId) {
        return messageRepository.countUnreadForUser(userId);
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private MessageResponse toResponse(DirectMessage m) {
        MessageResponse.ContentSummary attachedContent = null;
        if (m.getAttachedContentId() != null) {
            try {
                Content c = contentService.findById(m.getAttachedContentId());
                attachedContent = new MessageResponse.ContentSummary(
                        c.getId(), c.getTitle(), c.getBody(), c.getMediaUrl(),
                        userService.toSummary(c.getAuthor()),
                        c.getTheme() != null ? c.getTheme().getName() : null,
                        c.getTheme() != null ? c.getTheme().getIconEmoji() : null);
            } catch (Exception ignored) {}
        }

        com.happypath.dto.response.UserSummary attachedUser = null;
        if (m.getAttachedUserId() != null) {
            try {
                attachedUser = userService.toSummary(userService.findById(m.getAttachedUserId()));
            } catch (Exception ignored) {}
        }

        return new MessageResponse(
                m.getId(),
                userService.toSummary(m.getSender()),
                m.getSenderAlterEgo() != null
                        ? alterEgoService.toResponse(m.getSenderAlterEgo()) : null,
                userService.toSummary(m.getRecipient()),
                m.getText(),
                m.isReadByRecipient(),
                m.getSentAt(),
                attachedContent,
                attachedUser);
    }
}
