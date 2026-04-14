package com.happypath.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Richiesta di verifica identità inviata da un utente non verificato.
 * Contiene i dati anagrafici e il codice fiscale che vengono validati
 * e poi revisionati da un moderatore/admin.
 */
@Entity
@Table(name = "verification_requests",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "status"})
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class VerificationRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 80)
    private String firstName;

    @Column(nullable = false, length = 80)
    private String lastName;

    @Column(nullable = false)
    private LocalDate birthDate;

    /** Comune o paese di nascita */
    @Column(nullable = false, length = 120)
    private String birthPlace;

    /** M o F */
    @Column(nullable = false, length = 1)
    private String gender;

    @Column(nullable = false, length = 16)
    private String fiscalCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private VerificationRequestStatus status = VerificationRequestStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    private LocalDateTime reviewedAt;

    @Column(length = 500)
    private String reviewNote;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
