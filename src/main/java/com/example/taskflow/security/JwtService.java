package com.example.taskflow.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.JwsHeader;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;

@Service
public class JwtService {

    private static final String SECRET = "day-la-secret-tam-thoi-toi-thieu-256-bit-se-doi-o-level-5";
    private static final long EXPIRATION_MS = 15; // 15 phút

    private static final SecretKey secretKey = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));

    // generate token from username
    public String generateToken(String username) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiry = now.plusMinutes(EXPIRATION_MS);

        return Jwts
                .builder()
                .subject(username)
                .issuedAt(Date.from(now.atZone(ZoneId.systemDefault()).toInstant()))
                .expiration(Date.from(expiry.atZone(ZoneId.systemDefault()).toInstant()))
                .signWith(secretKey)
                .compact();
    }

    // get username from token
    public String extractUsername(String token) {
        return parseClaims(token).getPayload().getSubject();
    }

    // parse token to get data (header, payload, signature)
    public Jws<Claims> parseClaims(String token) {
        return Jwts
                .parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token);
    }

    //
    public boolean isValidToken(String token, String username) {
        try {
            Claims claims = parseClaims(token).getPayload();
            return claims.getSubject().equals(username) && claims.getExpiration().after(new Date());
        } catch (Exception e) {
            return false;
        }
    }
}