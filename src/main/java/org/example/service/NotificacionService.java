package org.example.service;

import org.example.model.Notificacion;
import org.example.repository.NotificacionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificacionService {

    private final NotificacionRepository notificacionRepository;

    public NotificacionService(NotificacionRepository notificacionRepository) {
        this.notificacionRepository = notificacionRepository;
    }

    public List<Notificacion> getNotificacionesByUsuarioId(Long idUsuario) {
        // Ordena por fecha de creación descendente para mostrar las más recientes primero
        return notificacionRepository.findByIdUsuarioOrderByFechaCreacionDesc(idUsuario);
    }

    public Notificacion crearNotificacion(Notificacion notificacion) {
        return notificacionRepository.save(notificacion);
    }

    /**
     * Marca una notificación como leída.
     * @param idNotificacion El ID de la notificación a marcar.
     * @param authenticatedUserId El ID del usuario que está intentando marcarla como leída.
     * @return La notificación actualizada.
     * @throws RuntimeException si la notificación no se encuentra.
     * @throws SecurityException si el usuario autenticado no es el propietario de la notificación.
     */
    @Transactional
    public Notificacion marcarLeida(Long idNotificacion, Long authenticatedUserId) {
        Notificacion notificacion = notificacionRepository.findById(idNotificacion)
                .orElseThrow(() -> new RuntimeException("Notificación no encontrada con ID: " + idNotificacion));

        // Validación de seguridad: Asegurarse de que el usuario autenticado es el propietario de la notificación
        if (!notificacion.getIdUsuario().equals(authenticatedUserId)) {
            throw new SecurityException("No tienes permiso para marcar esta notificación como leída.");
        }

        notificacion.setLeida(true); // Marcar como leída
        return notificacionRepository.save(notificacion);
    }

}