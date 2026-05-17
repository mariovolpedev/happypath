package com.happypath.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id")
    private User actor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    /** ID del content coinvolto (se applicabile) */
    @Column(name = "target_content_id")
    private Long targetContentId;

    /** ID del commento coinvolto (se applicabile, es. COMMENT / COMMENT_REACTION) */
    @Column(name = "target_comment_id")
    private Long targetCommentId;

    @Builder.Default
    private boolean read = false;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
