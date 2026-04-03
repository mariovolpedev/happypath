package com.happypath.config;

import com.happypath.security.JwtAuthFilter;
import com.happypath.security.HappyPathUserDetailsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@Slf4j
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final HappyPathUserDetailsService userDetailsService;

    @Value("${happypath.cors.allowed-origins:*}")
    private String allowedOrigins;

    /**
     * CorsFilter con la massima priorit�: viene eseguito PRIMA di Spring Security.
     * Gestisce i preflight OPTIONS e aggiunge gli header CORS a ogni risposta.
     * Senza @Order(Ordered.HIGHEST_PRECEDENCE) il filtro viene applicato DOPO
     * Spring Security, che nel frattempo ha gi� restituito 403.
     */
    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    public CorsFilter corsFilter() {
        var config = new CorsConfiguration();
        config.setAllowCredentials(true);

        // In sviluppo accettiamo qualsiasi origine localhost;
        // in produzione impostare HAPPYPATH_CORS_ALLOWED_ORIGINS con i domini reali
        for (String origin : allowedOrigins.split(",")) {
            config.addAllowedOriginPattern(origin.trim());
        }
        // Fallback: se la variabile non copre l'origine corrente, aggiungiamo i pattern comuni
        config.addAllowedOriginPattern("http://localhost:[*]");
        config.addAllowedOriginPattern("http://127.0.0.1:[*]");

        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization", "Content-Type"));
        config.setMaxAge(3600L);

        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        log.info("Security Filter Chain");
        return http
                // Delega CORS al bean CorsFilter registrato sopra
                .cors(cors -> cors.configure(http))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        .requestMatchers("/auth/**").permitAll()

                        .requestMatchers(HttpMethod.GET, "/contents/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/themes/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/users/search").permitAll()
                        .requestMatchers(HttpMethod.GET, "/users/*/profile").permitAll()
                        .requestMatchers(HttpMethod.GET, "/users/*/contents").permitAll()

                        .requestMatchers(
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**"
                        ).permitAll()

                        .requestMatchers("/h2-console/**").permitAll()
                        .requestMatchers("/error").permitAll()

                        .requestMatchers("/moderation/**").hasAnyRole("MODERATOR", "ADMIN")
                        .requestMatchers("/admin/**").hasRole("ADMIN")

                        .anyRequest().authenticated()
                )
                .headers(h -> h.frameOptions(f -> f.sameOrigin()))
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        var provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
