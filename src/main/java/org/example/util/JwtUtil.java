package org.example.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Clase de utilidad para la generación y validación de JSON Web Tokens (JWT).
 */
@Component
public class JwtUtil {

    // La clave secreta para firmar los JWTs, inyectada desde application.properties
    @Value("${jwt.secret}")
    private String secret;

    // Tiempo de validez del token en milisegundos (ej. 24 horas)
    @Value("${jwt.expiration}")
    private long expiration;

    /**
     * Extrae el nombre de usuario (subject) del token JWT. */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Extrae la fecha de expiración del token JWT. */
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /**
     * Extrae un 'claim' específico del token JWT utilizando una función de resolución. */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Extrae todos los 'claims' (cuerpo) del token JWT. */
    private Claims extractAllClaims(String token) {
        return Jwts
                .parserBuilder()
                .setSigningKey(getSignKey()) // Establece la clave de firma
                .build()
                .parseClaimsJws(token) // Parsea el token
                .getBody(); // Obtiene el cuerpo (claims)
    }

    /**
     * Verifica si el token JWT ha expirado. */
    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    /**
     * Genera un token JWT para un usuario dado. */
    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        // Puedes añadir claims personalizados aquí, por ejemplo, roles del usuario
        claims.put("role", userDetails.getAuthorities().iterator().next().getAuthority()); // Asume un solo rol principal
        return createToken(claims, userDetails.getUsername());
    }

    /** Crea el token JWT con los claims, el sujeto y las fechas de emisión y expiración.*/

    private String createToken(Map<String, Object> claims, String userName) {
        return Jwts.builder()
                .setClaims(claims) // Añade los claims
                .setSubject(userName) // Establece el sujeto (nombre de usuario)
                .setIssuedAt(new Date(System.currentTimeMillis())) // Fecha de emisión
                .setExpiration(new Date(System.currentTimeMillis() + expiration)) // Fecha de expiración
                .signWith(getSignKey(), SignatureAlgorithm.HS256) // Firma el token con la clave secreta y algoritmo HS256
                .compact(); // Compacta el token a su representación final
    }

    private Key getSignKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secret); // Decodifica la clave de base64
        return Keys.hmacShaKeyFor(keyBytes); // Genera la clave HMAC SHA
    }

    public Boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }
}
