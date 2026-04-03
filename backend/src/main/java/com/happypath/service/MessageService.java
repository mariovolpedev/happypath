package com.happypath.service;

import com.happypath.dto.request.MessageRequest;
import com.happypath.dto.response.MessageResponse;
import com.happypath.model.DirectMessage;
import com.happypath.model.User;
import com.happypath.repository.DirectMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final DirectMessageRepository messageRepository;
    private final UserService userService;

    @Transactional
    public MessageResponse send(MessageRequest req, User sender) {
        User recipient = userService.findById(req.recipientId());
        DirectMessage msg = messageRepository.save(DirectMessage.builder()
                .sender(sender).recipient(recipient).text(req.text()).build());
        return toResponse(msg);
    }

    public Page<MessageResponse> getConversation(Long userId, Long otherId, Pageable pageable) {
        return messageRepository.findConversation(userId, otherId, pageable).map(this::toResponse);
    }

    @Transactional
    public void markAsRead(Long senderId, Long recipientId) {
        // Aggiorna tutti i messaggi non letti in questa conversazione
        messageRepository.findConversation(senderId, recipientId, Pageable.unpaged())
                .stream()
                .filter(m -> m.getSender().getId().equals(senderId) && !m.isReadByRecipient())
                .forEach(m -> { m.setReadByRecipient(true); messageRepository.save(m); });
    }

    private MessageResponse toResponse(DirectMessage m) {
        return new MessageResponse(m.getId(), userService.toSummary(m.getSender()),
                userService.toSummary(m.getRecipient()), m.getText(), m.isReadByRecipient(), m.getSentAt());
    }
}
