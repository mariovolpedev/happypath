package com.happypath.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

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

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(length = 100)
    private String displayName;

    /** Dati anagrafici raccolti in fase di registrazione — usati per il confronto 1:1 in fase di verifica identità */
    @Column(length = 80)
    private String firstName;

    @Column(length = 80)
    private String lastName;

    private LocalDate birthDate;

    @Column(length = 100)
    private String birthPlace;

    /** M / F */
    @Column(length = 1)
    private String gender;

    @Column(length = 300)
    private String bio;

    private String avatarUrl;

    /**
     * Colore personalizzato del profilo (es. "#22c55e").
     * Usato come accent color nella pagina profilo dell'utente.
     */
    @Column(length = 7)
    private String profileColor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private UserRole role = UserRole.USER;

    /** Spunta blu — identità verificata tramite documento d'identità */
    @Builder.Default
    private boolean verified = false;

    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
