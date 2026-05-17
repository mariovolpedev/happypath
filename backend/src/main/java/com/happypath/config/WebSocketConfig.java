package com.happypath.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * STOMP-over-WebSocket configuration for real-time notifications.
 *
 * Clients connect to:  ws://host/api/ws  (or wss:// in production)
 * Subscribe to topics:
 *   /user/queue/notifications  → personal notification stream (server -> client)
 *
 * Message flow:
 *   1. Server calls  messagingTemplate.convertAndSendToUser(username, "/queue/notifications", payload)
 *   2. Spring routes it to the connected session for that user via the user-destination prefix.
 *
 * The simple in-memory broker is sufficient for a single-node deployment.
 * For multi-node / horizontal scaling, replace it with a full STOMP broker
 * (e.g. RabbitMQ) using enableStompBrokerRelay().
 *
 * JWT authentication for WebSocket connections is handled by
 * {@link WebSocketSecurityConfig}: the token is expected as a query parameter
 * (?token=...) or in the STOMP CONNECT frame headers.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Simple in-memory broker handles subscriptions to /queue and /topic
        registry.enableSimpleBroker("/queue", "/topic");
        // Prefix for messages routed to @MessageMapping methods
        registry.setApplicationDestinationPrefixes("/app");
        // Prefix used by convertAndSendToUser() to route to a specific user
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry
                .addEndpoint("/ws")
                .setAllowedOriginPatterns("*")   // CORS for WS handshake; tighten in prod
                .withSockJS();                   // SockJS fallback for browsers without native WS
    }
}
