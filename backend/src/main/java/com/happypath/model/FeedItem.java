package com.happypath.model;

/**
 * Enum dei tipi di elemento che possono apparire nel feed personalizzato.
 */
public enum FeedItem {
    CONTENT,        // nuovo contenuto pubblicato da un collegamento o su un tema seguito
    COMMENT,        // commento di un collegamento su un contenuto
    REACTION,       // reazione di un collegamento su un contenuto
    FOLLOW_EVENT    // un collegamento ha iniziato a seguire qualcuno
}
