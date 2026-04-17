package com.happypath.model;

public enum FeedSortStrategy {
    /** Ordine pesato: recency + tipo + leggera randomizzazione */
    SMART,
    /** Solo data decrescente */
    RECENT,
    /** Casuale puro */
    RANDOM
}
