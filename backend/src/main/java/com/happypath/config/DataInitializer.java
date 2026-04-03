package com.happypath.config;

import com.happypath.model.*;
import com.happypath.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    @Bean
    CommandLineRunner initData(
            UserRepository userRepo,
            ThemeRepository themeRepo,
            PasswordEncoder encoder) {

        return args -> {
            // Temi di default
            if (themeRepo.count() == 0) {
                themeRepo.save(Theme.builder().name("Motivazionale").description("Contenuti che ispirano e motivano").iconEmoji("✨").build());
                themeRepo.save(Theme.builder().name("Divertente").description("Umorismo e leggerezza").iconEmoji("😄").build());
                themeRepo.save(Theme.builder().name("Animali").description("I nostri amici a quattro zampe e non solo").iconEmoji("🐾").build());
                themeRepo.save(Theme.builder().name("Natura").description("Paesaggi, piante e meraviglie naturali").iconEmoji("🌿").build());
                themeRepo.save(Theme.builder().name("Arte").description("Pittura, musica, fotografia e creatività").iconEmoji("🎨").build());
                themeRepo.save(Theme.builder().name("Cucina").description("Ricette, piatti e passione per il cibo").iconEmoji("🍽️").build());
                themeRepo.save(Theme.builder().name("Sport").description("Attività fisiche e risultati sportivi").iconEmoji("⚽").build());
                themeRepo.save(Theme.builder().name("Famiglia").description("Momenti con i propri cari").iconEmoji("👨‍👩‍👧").build());
                themeRepo.save(Theme.builder().name("Viaggi").description("Scoperte e avventure in giro per il mondo").iconEmoji("✈️").build());
                themeRepo.save(Theme.builder().name("Benessere").description("Mindfulness, yoga e stile di vita sano").iconEmoji("🧘").build());
                log.info("✅ Temi di default creati");
            }

            // Utente admin di default
            if (!userRepo.existsByUsername("admin")) {
                userRepo.save(User.builder()
                        .username("admin")
                        .email("admin@happypath.app")
                        .passwordHash(encoder.encode("Admin1234!"))
                        .displayName("Administrator")
                        .role(UserRole.ADMIN)
                        .verified(true)
                        .build());
                log.info("✅ Utente admin creato (username: admin, password: Admin1234!)");
            }

            // Moderatore di default
            if (!userRepo.existsByUsername("moderator")) {
                userRepo.save(User.builder()
                        .username("moderator")
                        .email("moderator@happypath.app")
                        .passwordHash(encoder.encode("Mod1234!"))
                        .displayName("Moderatore")
                        .role(UserRole.MODERATOR)
                        .verified(true)
                        .build());
                log.info("✅ Utente moderatore creato (username: moderator, password: Mod1234!)");
            }
        };
    }
}
