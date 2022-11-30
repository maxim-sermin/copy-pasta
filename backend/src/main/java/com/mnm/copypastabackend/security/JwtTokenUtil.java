package com.mnm.copypastabackend.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletResponse;

import com.mnm.copypastabackend.CustomBasePathJsonSerializer;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class JwtTokenUtil {

    private static final org.slf4j.Logger logger = LoggerFactory.getLogger(JwtTokenUtil.class);

    @Value("${web-security.jwt.secret}")
    private String secret;

    @Value("${web-security.jwt.expire-time-minutes}")
    private int expireTimeMinutes;

    @Value("${web-security.jwt.refresh-expire-days}")
    private int refreshExpireTimeDays;

    @Value("${web-security.backend-url}")
    private String backendUrl;

    public Optional<String> getSubjectFromToken(String token) {
        Claims allClaimsFromToken = getAllClaimsFromToken(token);
        if (allClaimsFromToken == null) {
            return Optional.empty();
        } else {
            String subject = allClaimsFromToken.getSubject();
            if (subject == null) {
                return Optional.empty();
            }
            return Optional.of(subject);
        }
    }

    public Optional<Date> getExpirationDateFromToken(String token) {
        Claims allClaimsFromToken = getAllClaimsFromToken(token);
        if (allClaimsFromToken == null) {
            return Optional.empty();
        } else {
            return Optional.of(allClaimsFromToken.getExpiration());
        }
    }

    //for retrieving any information from token we will need the secret key
    private Claims getAllClaimsFromToken(String token) {
        if (!StringUtils.hasText(token)) {
            return null;
        }

        try {
            return Jwts.parserBuilder().setSigningKey(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8))).build().parseClaimsJws(token).getBody();
        } catch (ExpiredJwtException e) {
            logger.info("Got request with expired JWT");
        } catch (MalformedJwtException e) {
            logger.warn("Got request with malformed JWT (probably from another application, should only happen on localhost)");
        } catch (Exception e) {
            logger.error("Could not parse JWT", e);
        }
        return null;
    }

    public boolean isTokenExpired(String token) {
        Optional<Date> expiration = getExpirationDateFromToken(token);
        return expiration.map(date -> date.before(new Date())).orElse(true);
    }

    private String generateToken(String subject, Map<String, Object> payload, boolean isRefreshToken) {
        return Jwts.builder().setSubject(subject).setExpiration(new Date(
                System.currentTimeMillis() + getExpireSeconds(isRefreshToken) * 1000L))
                .signWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)), SignatureAlgorithm.HS256)
                .compact();
    }

    private int getExpireSeconds(boolean isRefreshToken) {
        return isRefreshToken ? refreshExpireTimeDays * 24 * 60 * 60  : expireTimeMinutes * 60 ;
    }

    private Cookie getCookie(String subject, boolean isRefreshToken) {
        Map<String, Object> jwtPayload = new HashMap<>();
        // todo claims go here
        Cookie cookie = new Cookie(isRefreshToken ? "REFRESH" : "SESSIONID", subject == null ? "" : generateToken(subject, jwtPayload, isRefreshToken));
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setMaxAge(getExpireSeconds(isRefreshToken));
        if (isRefreshToken) {
            cookie.setPath(backendUrl != null ? CustomBasePathJsonSerializer.basePath + "/refresh" : "/refresh");
        }
        return cookie;
    }

    public void addAccessAndRefreshCookie(HttpServletResponse res, String subject) {
        res.addCookie(getCookie(subject, false));
        res.addCookie(getCookie(subject, true));
    }
}
