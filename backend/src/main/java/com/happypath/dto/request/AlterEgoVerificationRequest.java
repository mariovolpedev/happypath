package com.happypath.dto.request;

import com.happypath.model.AlterEgo;
import com.happypath.model.AlterEgoVerificationStatus;
import com.happypath.model.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Richiesta di verifica identità per un Alter Ego.
 * L'utente fornisce i dati anagrafici e il codice fiscale;
 * moderatori/admin incrociano i dati e approvano o rifiutano.
 */
@Entity
@Table(name = "alter_ego_verification_requests")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AlterEgoVerificationRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "alter_ego_id", nullable = false)
    private AlterEgo alterEgo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    // ── Dati anagrafici ──────────────────────────────────────────────────────
    @Column(nullable = false, length = 100)
    private String firstName;

    @Column(nullable = false, length = 100)
    private String lastName;

    @Column(nullable = false)
    private LocalDate birthDate;

    @Column(nullable = false, length = 100)
    private String birthPlace;

    /** Codice fiscale italiano (16 caratteri) */
    @Column(nullable = false, length = 16)
    private String codiceFiscale;

    // ── Stato ────────────────────────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AlterEgoVerificationStatus status = AlterEgoVerificationStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id")
    private User reviewer;

    @Column(columnDefinition = "TEXT")
    private String reviewNote;

    @CreationTimestamp
    private LocalDateTime createdAt;

    private LocalDateTime reviewedAt;
}
