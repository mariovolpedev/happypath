package com.happypath.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "comment_reactions", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "comment_id"})
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CommentReaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Alter ego con cui è stata data la reazione (null = come se stesso) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "alter_ego_id")
    private AlterEgo alterEgo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comment_id", nullable = false)
    private Comment comment;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReactionType type;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
