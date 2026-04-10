package com.happypath.service;

import com.happypath.dto.request.MessageRequest;
import com.happypath.dto.response.ConversationSummary;
import com.happypath.dto.response.MessageResponse;
import com.happypath.dto.response.MessageResponse.ContentSummary;
import com.happypath.exception.HappyPathException;
import com.happypath.model.Content;
import com.happypath.model.DirectMessage;
import com.happypath.model.User;
import com.happypath.repository.ContentRepository;
import com.happypath.repository.DirectMessageRepository;
import com.happypath.repository.FollowRepository;
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
    private final UserService userService;
    private final FollowRepository followRepository;
    private final ContentRepository contentRepository;

    // -----------------------------------------------------------------------
    // Send
    // -----------------------------------------------------------------------

    @Transactional
    public MessageResponse send(MessageRequest req, User sender) {
        User recipient = userService.findById(req.recipientId());

        // Both parties must be verified
        if (!sender.isVerified()) {
            throw new HappyPathException(
                    "Solo gli utenti verificati possono inviare messaggi privati",
                    HttpStatus.FORBIDDEN);
        }
        if (!recipient.isVerified()) {
            throw new HappyPathException(
                    "Puoi inviare messaggi solo ad utenti verificati",
                    HttpStatus.FORBIDDEN);
        }

        // They must follow each other (mutual connection)
        boolean senderFollowsRecipient = followRepository.existsByFollowerAndFollowed(sender, recipient);
        boolean recipientFollowsSender = followRepository.existsByFollowerAndFollowed(recipient, sender);
        if (!senderFollowsRecipient || !recipientFollowsSender) {
            throw new HappyPathException(
                    "Puoi inviare messaggi solo a utenti con cui sei collegato (follow reciproco)",
                    HttpStatus.FORBIDDEN);
        }

        // Validate optional attachment IDs
        if (req.attachedContentId() != null) {
            contentRepository.findById(req.attachedContentId())
                    .orElseThrow(() -> new HappyPathException("Contenuto allegato non trovato", HttpStatus.NOT_FOUND));
        }
        if (req.attachedUserId() != null) {
            userService.findById(req.attachedUserId()); // throws if not found
        }

        DirectMessage msg = messageRepository.save(
                DirectMessage.builder()
                        .sender(sender)
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
        ContentSummary contentSummary = null;
        if (m.getAttachedContentId() != null) {
            contentSummary = contentRepository.findById(m.getAttachedContentId())
                    .map(this::toContentSummary)
                    .orElse(null);
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
                userService.toSummary(m.getRecipient()),
                m.getText(),
                m.isReadByRecipient(),
                m.getSentAt(),
                contentSummary,
                attachedUser);
    }

    private ContentSummary toContentSummary(Content c) {
        return new ContentSummary(
                c.getId(),
                c.getTitle(),
                c.getBody() != null && c.getBody().length() > 120
                        ? c.getBody().substring(0, 120) + "…"
                        : c.getBody(),
                c.getMediaUrl(),
                userService.toSummary(c.getAuthor()),
                c.getTheme() != null ? c.getTheme().getName() : null,
                c.getTheme() != null ? c.getTheme().getIconEmoji() : null);
    }
}
