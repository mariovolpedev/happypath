package com.happypath.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * Impostazioni personalizzate del feed per un utente.
 * Permette di abilitare/disabilitare singoli tipi di elementi
 * e di scegliere la strategia di ordinamento.
 */
@Entity
@Table(name = "feed_settings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FeedSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    /** Mostra contenuti pubblicati da collegamenti / temi seguiti */
    @Builder.Default
    @Column(nullable = false)
    private boolean showContents = true;

    /** Mostra commenti effettuati dai collegamenti */
    @Builder.Default
    @Column(nullable = false)
    private boolean showComments = true;

    /** Mostra reazioni effettuate dai collegamenti */
    @Builder.Default
    @Column(nullable = false)
    private boolean showReactions = true;

    /** Mostra eventi di follow (es. "Mario ha iniziato a seguire Giulia") */
    @Builder.Default
    @Column(nullable = false)
    private boolean showFollowEvents = true;

    /**
     * Strategia di ordinamento del feed.
     * SMART   = ordine pesato (recency + tipo + randomizzazione)
     * RECENT  = solo per data decrescente
     * RANDOM  = casuale puro (utile per scoperta)
     */
    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false, length = 20)
    private FeedSortStrategy sortStrategy = FeedSortStrategy.SMART;
}
