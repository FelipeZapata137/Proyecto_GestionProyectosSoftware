package org.example.dto;

import lombok.Data;         // Para generar automáticamente getters, setters, toString, equals y hashCode
import lombok.NoArgsConstructor; // Para generar un constructor sin argumentos (necesario para la deserialización)
import lombok.AllArgsConstructor; // Para generar un constructor con todos los argumentos (útil para inicialización)

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReporteResumenDTO {
    private long totalCampanas;
    private long campanasActivas;
    private long campanasFinalizadas; // Añadido para un reporte más completo
    private long campanasPlanificadas; // Añadido para un reporte más completo
    private long totalUsuarios;
    private long totalVoluntarios;
}