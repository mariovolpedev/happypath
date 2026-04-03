package com.happypath.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "warnings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Warning {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issued_by_id", nullable = false)
    private User issuedBy;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    /** Contenuto/commento che ha causato l'ammonizione */
    private Long relatedContentId;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
