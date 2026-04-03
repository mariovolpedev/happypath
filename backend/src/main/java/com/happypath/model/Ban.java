package com.happypath.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "bans")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Ban {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issued_by_id", nullable = false)
    private User issuedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BanDuration duration;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Builder.Default
    private boolean active = true;

    /** Null se permanente */
    private LocalDateTime expiresAt;

    @CreationTimestamp
    private LocalDateTime createdAt;

    /** Per i ban contestati — decisione finale dell'admin */
    private String adminDecision;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "decided_by_id")
    private User decidedBy;
}
