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
 * FIX: usato DefaultTyping.EVERYTHING + As.WRAPPER_ARRAY invece di
 * NON_FINAL + PROPERTY.
 *
 * Il problema con NON_FINAL + PROPERTY era che Jackson serializzava i
 * List<ThemeResponse> con il type-id come primo campo dell'oggetto (PROPERTY),
 * ma al momento della deserializzazione l'array-root causava:
 *   "need String, Number of Boolean value that contains type id"
 * perché il deserializzatore cercava un campo stringa "@class" ma trovava
 * l'inizio di un array JSON.
 *
 * Con WRAPPER_ARRAY il type-id viene scritto come primo elemento dell'array:
 *   ["com.happypath.dto.response.ThemeResponse", { ...fields... }]
 * e i List<T> vengono avvolti allo stesso modo, risolvendo l'ambiguità.
 *
 * Cache attive:
 *   content-single   → TTL 10 min  — singolo contenuto per ID
 *   themes-all       → TTL 60 min  — lista completa temi
 *   themes-presets   → TTL 60 min  — solo temi preset
 *   user-profile     → TTL  5 min  — profilo pubblico utente
 *   search-results   → TTL  2 min  — risultati di ricerca testuale
 *
 * NON cachati:
 *   feed, notifiche, messaggi privati, alter ego, moderazione, auth/JWT
 */
@Configuration
@EnableCaching
public class RedisConfig {

    public static final String CACHE_CONTENT_SINGLE  = "content-single";
    public static final String CACHE_THEMES_ALL      = "themes-all";
    public static final String CACHE_THEMES_PRESETS  = "themes-presets";
    public static final String CACHE_USER_PROFILE    = "user-profile";
    public static final String CACHE_SEARCH_RESULTS  = "search-results";

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory factory) {
        /*
         * ObjectMapper dedicato alla serializzazione Redis.
         * NON riusare il bean ObjectMapper di Spring MVC: le opzioni di
         * default typing interferirebbero con la serializzazione HTTP JSON.
         *
         * DefaultTyping.EVERYTHING  → include type info anche per tipi final
         *                             (String, Boolean, Integer inclusi nelle DTO)
         * As.WRAPPER_ARRAY          → ["fully.qualified.ClassName", { ...payload... }]
         *                             compatibile con array/collection root.
         */
        ObjectMapper redisObjectMapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
                .activateDefaultTyping(
                        LaissezFaireSubTypeValidator.instance,
                        ObjectMapper.DefaultTyping.EVERYTHING,
                        JsonTypeInfo.As.WRAPPER_ARRAY);

        GenericJackson2JsonRedisSerializer jsonSerializer =
                new GenericJackson2JsonRedisSerializer(redisObjectMapper);

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
