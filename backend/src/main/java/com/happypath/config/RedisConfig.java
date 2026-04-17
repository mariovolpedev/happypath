package com.happypath.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.Map;

/**
 * Configurazione Redis con TTL differenziati per cache name.
 *
 * Cache attive e relative politiche:
 *
 *   content-single   → TTL 10 min  — singolo contenuto per ID
 *                       Evict su update/delete/changePublisher
 *
 *   themes-all       → TTL 60 min  — lista completa temi (quasi statica)
 *                       Evict su create/follow/unfollow tema
 *
 *   themes-presets   → TTL 60 min  — solo temi preset (immutabili in pratica)
 *
 *   user-profile     → TTL  5 min  — profilo pubblico utente
 *                       Evict su updateProfile, follow, unfollow
 *
 *   search-results   → TTL  2 min  — risultati di ricerca testuale
 *                       Breve TTL: i contenuti cambiano frequentemente
 *
 * NON cachati (motivazione esplicita):
 *   - feed (home/global)      → personalizzato per utente, altamente dinamico
 *   - notifiche               → devono essere sempre fresche (real-time)
 *   - messaggi privati        → privacy + real-time
 *   - alter ego personali     → dati mutabili legati all'utente autenticato
 *   - moderazione / report    → richiede dati sempre aggiornati
 *   - autenticazione / JWT    → dati sensibili, non cachare mai
 */
@Configuration
@EnableCaching
public class RedisConfig {

    /** Nomi delle cache — usati come costanti nei @Cacheable/@CacheEvict */
    public static final String CACHE_CONTENT_SINGLE  = "content-single";
    public static final String CACHE_THEMES_ALL      = "themes-all";
    public static final String CACHE_THEMES_PRESETS  = "themes-presets";
    public static final String CACHE_USER_PROFILE    = "user-profile";
    public static final String CACHE_SEARCH_RESULTS  = "search-results";

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory factory) {
        ObjectMapper om = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
                .activateDefaultTyping(
                        LaissezFaireSubTypeValidator.instance,
                        ObjectMapper.DefaultTyping.NON_FINAL,
                        JsonTypeInfo.As.PROPERTY);

        GenericJackson2JsonRedisSerializer jsonSerializer =
                new GenericJackson2JsonRedisSerializer(om);

        RedisCacheConfiguration base = RedisCacheConfiguration.defaultCacheConfig()
                .serializeKeysWith(
                        RedisSerializationContext.SerializationPair
                                .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair
                                .fromSerializer(jsonSerializer))
                .disableCachingNullValues();

        Map<String, RedisCacheConfiguration> configs = Map.of(
                CACHE_CONTENT_SINGLE, base.entryTtl(Duration.ofMinutes(10)),
                CACHE_THEMES_ALL,     base.entryTtl(Duration.ofMinutes(60)),
                CACHE_THEMES_PRESETS, base.entryTtl(Duration.ofMinutes(60)),
                CACHE_USER_PROFILE,   base.entryTtl(Duration.ofMinutes(5)),
                CACHE_SEARCH_RESULTS, base.entryTtl(Duration.ofMinutes(2))
        );

        return RedisCacheManager.builder(factory)
                .cacheDefaults(base.entryTtl(Duration.ofMinutes(10)))
                .withInitialCacheConfigurations(configs)
                .build();
    }
}
