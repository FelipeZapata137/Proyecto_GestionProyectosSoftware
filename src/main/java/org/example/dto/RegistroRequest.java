package org.example.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data // Esta anotación de Lombok genera automáticamente los getters y setters
@NoArgsConstructor
@AllArgsConstructor
public class RegistroRequest {
    private String nombreUsuario;
    private String contrasena;
    private String nombre;
    private String apellido;
    private String email;
    private String telefono;
}