package com.happypath.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "reactions", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "content_id"})
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Reaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Alter ego come cui è stata data la reazione (null = come se stesso) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "alter_ego_id")
    private AlterEgo alterEgo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "content_id", nullable = false)
    private Content content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReactionType type;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
