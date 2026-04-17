package com.happypath.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Rappresenta il follow di un utente verso un tema.
 * Un utente può seguire uno o più temi; i contenuti di quei temi
 * appariranno nel feed personalizzato.
 */
@Entity
@Table(name = "theme_follows", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "theme_id"})
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ThemeFollow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "theme_id", nullable = false)
    private Theme theme;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
