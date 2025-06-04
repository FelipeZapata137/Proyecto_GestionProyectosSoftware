package org.example.repository;

import org.example.model.Notificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {

    // Métod para encontrar notificaciones por el ID del usuario
    List<Notificacion> findByIdUsuarioOrderByFechaCreacionDesc(Long idUsuario);

    // Métod opcional para encontrar notificaciones no leídas por el ID del usuario
    List<Notificacion> findByIdUsuarioAndLeidaFalseOrderByFechaCreacionDesc(Long idUsuario);
}