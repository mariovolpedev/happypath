package com.happypath.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "themes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Theme {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 80)
    private String name;

    @Column(length = 200)
    private String description;

    private String iconEmoji;

    /**
     * Se true, il tema fa parte dei predefiniti di sistema e non può essere eliminato.
     * I temi predefiniti vengono caricati via data.sql al primo avvio.
     */
    @Builder.Default
    @Column(nullable = false)
    private boolean preset = false;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
