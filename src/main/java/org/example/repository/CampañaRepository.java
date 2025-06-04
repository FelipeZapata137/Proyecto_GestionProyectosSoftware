package org.example.repository;

import org.example.model.Campaña;
import org.example.model.EstadoCampaña; // ¡Importar el enum!
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CampañaRepository extends JpaRepository<Campaña, Long> {
    List<Campaña> findByEstado(EstadoCampaña estado); // Cambiado de String a EstadoCampaña
    List<Campaña> findByUbicacionContainingIgnoreCase(String ubicacion);

    // Métod para contar campañas por estado: Ahora recibe el ENUM directamente
    long countByEstado(EstadoCampaña estado); // Cambiado de String a EstadoCampaña
}