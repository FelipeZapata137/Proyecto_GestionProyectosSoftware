package org.example.service;

import org.example.model.Campaña;
import org.example.model.Notificacion; // Importar Notificacion
import org.example.repository.CampañaRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime; // Importar LocalDateTime
import java.util.List;
import java.util.Optional;

@Service
public class CampañaService {

    private final CampañaRepository campañaRepository;
    private final NotificacionService notificacionService; // Inyectar NotificacionService

    // Constructor para inyección de dependencias
    public CampañaService(CampañaRepository campañaRepository, NotificacionService notificacionService) {
        this.campañaRepository = campañaRepository;
        this.notificacionService = notificacionService; // Asignar NotificacionService
    }

    public List<Campaña> getAllCampanas() {
        return campañaRepository.findAll();
    }

    public Optional<Campaña> getCampañaById(Long id) {
        return campañaRepository.findById(id);
    }

    // Modificado para recibir el ID del usuario que crea la campaña
    public Campaña createCampaña(Campaña campaña, Long userId) {
        Campaña newCampaña = campañaRepository.save(campaña);

        // Crear una notificación para el administrador que creó la campaña
        Notificacion notificacion = new Notificacion();
        notificacion.setIdUsuario(userId); // El ID del usuario que creó la campaña
        notificacion.setTitulo("Nueva Campaña Creada");
        notificacion.setMensaje("Se ha creado una nueva campaña: " + newCampaña.getNombre() + " en " + newCampaña.getUbicacion() + ".");
        notificacion.setFechaCreacion(LocalDateTime.now());
        notificacion.setLeida(false);
        notificacionService.crearNotificacion(notificacion); // Guardar la notificación

        return newCampaña;
    }

    // Modificado para recibir el ID del usuario que actualiza la campaña
    public Campaña updateCampaña(Long id, Campaña campañaDetails, Long userId) {
        Campaña campaña = campañaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Campaña no encontrada con ID: " + id));

        // Guardar el estado anterior para la notificación
        String oldEstado = campaña.getEstado();

        campaña.setNombre(campañaDetails.getNombre());
        campaña.setDescripcion(campañaDetails.getDescripcion());
        campaña.setUbicacion(campañaDetails.getUbicacion());
        campaña.setFechaInicio(campañaDetails.getFechaInicio());
        campaña.setFechaFin(campañaDetails.getFechaFin());
        campaña.setEstado(campañaDetails.getEstado());

        Campaña updatedCampaña = campañaRepository.save(campaña);

        // Crear una notificación para el administrador que actualizó la campaña
        Notificacion notificacion = new Notificacion();
        notificacion.setIdUsuario(userId); // El ID del usuario que actualizó la campaña
        notificacion.setTitulo("Campaña Actualizada");
        notificacion.setMensaje("La campaña '" + updatedCampaña.getNombre() + "' ha sido actualizada. Estado anterior: " + oldEstado + ", Nuevo estado: " + updatedCampaña.getEstado() + ".");
        notificacion.setFechaCreacion(LocalDateTime.now());
        notificacion.setLeida(false);
        notificacionService.crearNotificacion(notificacion); // Guardar la notificación

        return updatedCampaña;
    }

    // Modificado para recibir el ID del usuario que elimina la campaña
    public void deleteCampaña(Long id, Long userId) {
        Campaña campañaToDelete = campañaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Campaña no encontrada con ID: " + id));

        campañaRepository.deleteById(id);

        // Crear una notificación para el administrador que eliminó la campaña
        Notificacion notificacion = new Notificacion();
        notificacion.setIdUsuario(userId); // El ID del usuario que eliminó la campaña
        notificacion.setTitulo("Campaña Eliminada");
        notificacion.setMensaje("La campaña '" + campañaToDelete.getNombre() + "' ha sido eliminada.");
        notificacion.setFechaCreacion(LocalDateTime.now());
        notificacion.setLeida(false);
        notificacionService.crearNotificacion(notificacion); // Guardar la notificación
    }
}
