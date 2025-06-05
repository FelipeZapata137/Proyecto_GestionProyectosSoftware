package org.example.repository;

import org.example.model.Notificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {
    // Métod para encontrar notificaciones por ID de usuario, ordenadas por fecha de creación descendente
    List<Notificacion> findByIdUsuarioOrderByFechaCreacionDesc(Long idUsuario);
}