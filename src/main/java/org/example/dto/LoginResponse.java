package org.example.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.example.model.Usuario;

/**
 * DTO (Data Transfer Object) para la respuesta de inicio de sesión.
 * Contiene el token JWT y la información del usuario autenticado. */
@Data // Genera getters, setters, toString, equals, hashCode
@NoArgsConstructor // Genera un constructor sin argumentos
@AllArgsConstructor // Genera un constructor con todos los argumentos
public class LoginResponse {
    private String jwtToken;
    private Long id;
    private String nombreUsuario;
    private String nombre;
    private String apellido;
    private String email;
    private String telefono;
    private String rol;
    private double calificacion; // Corregido a double para coincidir con Usuario.java
    private boolean activo; // Corregido a boolean para coincidir con Usuario.java

    // Constructor que toma un Usuario y un token JWT para construir la respuesta
    public LoginResponse(String jwtToken, Usuario usuario) {
        this.jwtToken = jwtToken;
        this.id = usuario.getId();
        this.nombreUsuario = usuario.getNombreUsuario();
        this.nombre = usuario.getNombre();
        this.apellido = usuario.getApellido();
        this.email = usuario.getEmail();
        this.telefono = usuario.getTelefono();
        this.rol = usuario.getRol();
        this.calificacion = usuario.getCalificacion();
        this.activo = usuario.isActivo();
    }
}
