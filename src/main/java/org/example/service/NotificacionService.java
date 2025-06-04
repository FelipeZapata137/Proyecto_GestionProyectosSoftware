package org.example.service;

import org.example.model.Notificacion;
import org.example.repository.NotificacionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class NotificacionService {

    private final NotificacionRepository notificacionRepository;

    @Autowired
    public NotificacionService(NotificacionRepository notificacionRepository) {
        this.notificacionRepository = notificacionRepository;
    }

    public List<Notificacion> getNotificacionesByUserId(Long idUsuario) {
        // Ordena por fecha de creación descendente para ver las más nuevas primero
        return notificacionRepository.findByIdUsuarioOrderByFechaCreacionDesc(idUsuario);
    }

    public Notificacion crearNotificacion(Notificacion notificacion) {
        // Establecer la fecha de creación si no está ya establecida
        if (notificacion.getFechaCreacion() == null) {
            notificacion.setFechaCreacion(LocalDateTime.now());
        }
        // Las nuevas notificaciones generalmente no están leídas
        notificacion.setLeida(false);
        return notificacionRepository.save(notificacion);
    }

    public boolean marcarComoLeida(Long idNotificacion) {
        Optional<Notificacion> optionalNotificacion = notificacionRepository.findById(idNotificacion);
        if (optionalNotificacion.isPresent()) {
            Notificacion notificacion = optionalNotificacion.get();
            notificacion.setLeida(true);
            notificacionRepository.save(notificacion);
            return true;
        }
        return false;
    }
}