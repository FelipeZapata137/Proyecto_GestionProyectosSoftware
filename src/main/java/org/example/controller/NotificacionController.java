package org.example.controller;

import org.example.model.Notificacion;
import org.example.service.NotificacionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notificaciones")
public class NotificacionController {

    private final NotificacionService notificacionService;

    @Autowired
    public NotificacionController(NotificacionService notificacionService) {
        this.notificacionService = notificacionService;
    }

    @GetMapping("/usuario/{userId}")
    public ResponseEntity<List<Notificacion>> getNotificationsByUserId(@PathVariable Long userId) {
        List<Notificacion> notifications = notificacionService.getNotificacionesByUserId(userId);
        return ResponseEntity.ok(notifications);
    }

    @PostMapping
    // @PreAuthorize("hasRole('ADMIN')") // Descomentar si solo los ADMIN pueden crear notificaciones programáticamente
    public ResponseEntity<Notificacion> createNotificacion(@RequestBody Notificacion notificacion) {
        Notificacion newNotificacion = notificacionService.crearNotificacion(notificacion);
        return ResponseEntity.status(HttpStatus.CREATED).body(newNotificacion);
    }

    @PutMapping("/marcarLeida/{id}")
    public ResponseEntity<Void> marcarNotificacionComoLeida(@PathVariable Long id) {
        boolean marcado = notificacionService.marcarComoLeida(id);
        if (marcado) {
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}