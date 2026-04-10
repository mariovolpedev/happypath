package com.happypath.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "direct_messages")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DirectMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String text;

    @Builder.Default
    private boolean readByRecipient = false;

    /**
     * Optional: ID of a Content the user is sharing inside the message.
     * The full ContentResponse is resolved at query time by the service.
     */
    @Column(name = "attached_content_id")
    private Long attachedContentId;

    /**
     * Optional: ID of a User profile being shared in the message.
     */
    @Column(name = "attached_user_id")
    private Long attachedUserId;

    @CreationTimestamp
    private LocalDateTime sentAt;
}
