package com.happypath.model;

import jakarta.persistence.*;
import lombok.*;

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
}
