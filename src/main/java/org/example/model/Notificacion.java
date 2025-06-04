package org.example.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Data; // Para getters y setters
import lombok.NoArgsConstructor; // ¡¡¡Para el constructor por defecto!!!
import lombok.AllArgsConstructor; // Opcional, para un constructor con todos los argumentos

@Entity
@Table(name = "notificaciones")
@Data // Genera getters, setters, toString, equals, hashCode
@NoArgsConstructor // ¡¡¡Genera el constructor por defecto sin argumentos!!!
@AllArgsConstructor // Opcional, genera un constructor con todos los argumentos
public class Notificacion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long idUsuario;
    private String titulo;
    private String mensaje;
    private LocalDateTime fechaCreacion;
    private boolean leida;
}