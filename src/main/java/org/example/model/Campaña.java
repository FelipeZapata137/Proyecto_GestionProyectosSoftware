package org.example.model;

import jakarta.persistence.*;
import lombok.Data; // Importación para @Data
import lombok.NoArgsConstructor; // Importación para @NoArgsConstructor
import lombok.AllArgsConstructor; // Importación para @AllArgsConstructor
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "campanas")
@Data // Anotación de Lombok para generar getters, setters, toString, equals y hashCode
@NoArgsConstructor // Anotación de Lombok para generar un constructor sin argumentos
@AllArgsConstructor // Anotación de Lombok para generar un constructor con todos los argumentos
public class Campaña {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(length = 500)
    private String descripcion;

    @Column(nullable = false, length = 200)
    private String ubicacion;

    @Column(name = "fecha_inicio", nullable = false)
    @JsonFormat(pattern = "dd/MM/yyyy")
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin", nullable = false)
    @JsonFormat(pattern = "dd/MM/yyyy")
    private LocalDate fechaFin;

    @Enumerated(EnumType.STRING) // Guarda el nombre del enum como String en la BD (ej. "ACTIVA")
    @Column(nullable = false, length = 50)
    private EstadoCampaña estado; // Usa el Enum definido

    @JsonIgnore // Evita que la relación bidireccional cause un bucle infinito en la serialización JSON
    @ManyToMany(fetch = FetchType.LAZY) // Añadido fetch = FetchType.LAZY para evitar carga innecesaria
    @JoinTable(
            name = "campana_voluntarios",
            joinColumns = @JoinColumn(name = "campana_id"),
            inverseJoinColumns = @JoinColumn(name = "voluntario_id")
    )
    private Set<Usuario> voluntariosInscritos = new HashSet<>();
}