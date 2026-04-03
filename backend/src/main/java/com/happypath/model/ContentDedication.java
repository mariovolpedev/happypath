package com.happypath.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/** "[Mario] ha dedicato [nomecontenuto] a [Celeste]" */
@Entity
@Table(name = "content_dedications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ContentDedication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "content_id", nullable = false)
    private Content content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dedicated_to_id", nullable = false)
    private User dedicatedTo;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
