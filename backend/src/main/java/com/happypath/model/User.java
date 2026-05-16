package com.happypath.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users", uniqueConstraints = {
        @UniqueConstraint(columnNames = "username"),
        @UniqueConstraint(columnNames = "email")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(length = 80)
    private String displayName;

    @Column(length = 80)
    private String firstName;

    @Column(length = 80)
    private String lastName;

    private LocalDate birthDate;

    @Column(length = 100)
    private String birthPlace;

    @Column(length = 1)
    private String gender;

    @Column(length = 300)
    private String bio;

    private String avatarUrl;

    @Pattern(regexp = "^#([A-Fa-f0-9]{6})$", message = "Il colore deve essere in formato HEX (#RRGGBB)")
    @Column(length = 7)
    private String profileColor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private UserRole role = UserRole.USER;

    @Column(nullable = false)
    @Builder.Default
    private boolean verified = false;

    /**
     * Indica se l'account è attivo (non bannato/sospeso).
     * Usato da HappyPathUserDetails e ModerationService.
     */
    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    /**
     * Indica se l'utente ha già completato (o saltato) il tutorial
     * al primo accesso. Impostato a true tramite POST /users/me/tutorial-completed.
     */
    @Column(nullable = false)
    @Builder.Default
    private boolean tutorialCompleted = false;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
