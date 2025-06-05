package org.example.controller;

import org.example.model.Notificacion;
import org.example.model.Usuario;
import org.example.repository.UsuarioRepository;
import org.example.service.NotificacionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notificaciones")
public class NotificacionController {

    private final NotificacionService notificacionService;
    private final UsuarioRepository usuarioRepository;

    public NotificacionController(NotificacionService notificacionService, UsuarioRepository usuarioRepository) {
        this.notificacionService = notificacionService;
        this.usuarioRepository = usuarioRepository;
    }

    /**
     * Métod auxiliar para obtener el ID del usuario autenticado del contexto de seguridad.
     * @return El ID del usuario autenticado.
     * @throws RuntimeException si el usuario no está autenticado o no se encuentra en la base de datos.
     */
    private Long getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("Usuario no autenticado.");
        }
        String username = authentication.getName();
        Usuario usuario = usuarioRepository.findByNombreUsuario(username)
                .orElseThrow(() -> new RuntimeException("Usuario autenticado no encontrado en la base de datos."));
        return usuario.getId();
    }

    /**
     * Obtiene todas las notificaciones para un usuario específico.
     * Requiere que el usuario autenticado sea ADMIN o el propio usuario.
     * @param idUsuario El ID del usuario cuyas notificaciones se desean obtener.
     * @return Una lista de notificaciones.
     */
    @GetMapping("/usuario/{idUsuario}")
    @PreAuthorize("hasAnyRole('ADMIN', 'VOLUNTARIO')") // Simplificado: la lógica de comparación de ID se maneja en el cuerpo
    public ResponseEntity<List<Notificacion>> getNotificacionesByUsuarioId(@PathVariable Long idUsuario) {
        try {
            // Si el usuario es VOLUNTARIO, asegurar que solo pide sus propias notificaciones
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            boolean isVoluntario = authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_VOLUNTARIO"));

            if (isVoluntario) {
                Long authenticatedUserId = getAuthenticatedUserId();
                if (!authenticatedUserId.equals(idUsuario)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).build(); // Un voluntario no puede ver notificaciones de otro
                }
            }
            List<Notificacion> notificaciones = notificacionService.getNotificacionesByUsuarioId(idUsuario);
            return ResponseEntity.ok(notificaciones);
        } catch (RuntimeException e) {
            System.err.println("Error al obtener notificaciones: " + e.getMessage()); // Log para depuración
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Marca una notificación como leída.
     * Requiere que el usuario autenticado sea ADMIN o el propietario de la notificación.
     * @param id El ID de la notificación a marcar.
     * @return La notificación actualizada.
     */
    @PutMapping("/{id}/marcar-leida")
    @PreAuthorize("hasAnyRole('ADMIN', 'VOLUNTARIO')")
    public ResponseEntity<Notificacion> marcarNotificacionLeida(@PathVariable Long id) {
        try {
            Long authenticatedUserId = getAuthenticatedUserId();
            Notificacion updatedNotificacion = notificacionService.marcarLeida(id, authenticatedUserId);
            return ResponseEntity.ok(updatedNotificacion);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (RuntimeException e) {
            System.err.println("Error al marcar notificación como leída: " + e.getMessage()); // Log para depuración
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
}
