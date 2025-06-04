package org.example.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * DTO (Data Transfer Object) para la solicitud de inicio de sesión.
 * Contiene el nombre de usuario y la contraseña enviados desde el frontend. */
@Data // Genera getters, setters, toString, equals, hashCode
@NoArgsConstructor // Genera un constructor sin argumentos
@AllArgsConstructor // Genera un constructor con todos los argumentos
public class LoginRequest {
    private String username;
    private String password;
}
