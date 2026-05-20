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
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.Map;

/**
 * Configurazione Redis: CacheManager con TTL differenziati + RedisTemplate<String,Object>
 * per eviction manuale delle chiavi di cache in UserService.
 *
 * Cache attive:
 *   content-single   → TTL 10 min
 *   themes-all       → TTL 60 min
 *   themes-presets   → TTL 60 min
 *   user-profile     → TTL  5 min
 *   search-results   → TTL  2 min
 */
@Configuration
@EnableCaching
public class RedisConfig {

    public static final String CACHE_CONTENT_SINGLE  = "content-single";
    public static final String CACHE_THEMES_ALL      = "themes-all";
    public static final String CACHE_THEMES_PRESETS  = "themes-presets";
    public static final String CACHE_USER_PROFILE    = "user-profile";
    public static final String CACHE_SEARCH_RESULTS  = "search-results";

    /**
     * ObjectMapper dedicato a Redis (NON condiviso con Spring MVC).
     * Estratto come metodo privato per riutilizzarlo in entrambi i bean.
     */
    private ObjectMapper redisObjectMapper() {
        return new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
                .activateDefaultTyping(
                        LaissezFaireSubTypeValidator.instance,
                        ObjectMapper.DefaultTyping.EVERYTHING,
                        JsonTypeInfo.As.WRAPPER_ARRAY);
    }

    /**
     * RedisTemplate<String, Object> usato da UserService per l'eviction
     * manuale delle chiavi di cache tramite pattern matching (KEYS command).
     *
     * Serializzazione:
     *  - Chiave : StringRedisSerializer  (leggibile, compatibile con le chiavi
     *             generate da RedisCacheManager)
     *  - Valore : GenericJackson2JsonRedisSerializer (stesso mapper del CacheManager)
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);

        StringRedisSerializer stringSerializer = new StringRedisSerializer();
        GenericJackson2JsonRedisSerializer jsonSerializer =
                new GenericJackson2JsonRedisSerializer(redisObjectMapper());

        template.setKeySerializer(stringSerializer);
        template.setHashKeySerializer(stringSerializer);
        template.setValueSerializer(jsonSerializer);
        template.setHashValueSerializer(jsonSerializer);
        template.afterPropertiesSet();
        return template;
    }

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory factory) {
        GenericJackson2JsonRedisSerializer jsonSerializer =
                new GenericJackson2JsonRedisSerializer(redisObjectMapper());

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
