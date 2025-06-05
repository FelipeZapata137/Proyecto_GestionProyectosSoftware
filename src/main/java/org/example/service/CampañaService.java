package org.example.service;

import org.example.model.Campaña;
import org.example.model.Notificacion;
import org.example.model.Usuario;
import org.example.repository.CampañaRepository;
import org.example.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class CampañaService {

    private final CampañaRepository campañaRepository;
    private final NotificacionService notificacionService;
    private final UsuarioRepository usuarioRepository;

    public CampañaService(CampañaRepository campañaRepository, NotificacionService notificacionService, UsuarioRepository usuarioRepository) {
        this.campañaRepository = campañaRepository;
        this.notificacionService = notificacionService;
        this.usuarioRepository = usuarioRepository;
    }

    public List<Campaña> getAllCampanas() {
        return campañaRepository.findAll();
    }

    public Optional<Campaña> getCampañaById(Long id) {
        return campañaRepository.findById(id);
    }

    @Transactional // Asegura que la operación sea atómica (todas las notificaciones o ninguna)
    public Campaña createCampaña(Campaña campaña, Long adminId) {
        Campaña newCampaña = campañaRepository.save(campaña);

        // 1. Notificación para el administrador que creó la campaña
        Notificacion adminNotificacion = new Notificacion();
        adminNotificacion.setIdUsuario(adminId);
        adminNotificacion.setTitulo("Campaña Creada");
        adminNotificacion.setMensaje("Has creado la campaña: " + newCampaña.getNombre() + " en " + newCampaña.getUbicacion() + ".");
        adminNotificacion.setFechaCreacion(LocalDateTime.now());
        adminNotificacion.setLeida(false);
        notificacionService.crearNotificacion(adminNotificacion);

        // 2. Notificación para TODOS los voluntarios sobre la nueva campaña
        List<Usuario> voluntarios = usuarioRepository.findByRol("VOLUNTARIO");
        for (Usuario voluntario : voluntarios) {
            Notificacion voluntarioNotificacion = new Notificacion();
            voluntarioNotificacion.setIdUsuario(voluntario.getId());
            voluntarioNotificacion.setTitulo("¡Nueva Campaña Disponible!");
            voluntarioNotificacion.setMensaje("Se ha publicado una nueva campaña: '" + newCampaña.getNombre() + "' en '" + newCampaña.getUbicacion() + "'. ¡Inscríbete!");
            voluntarioNotificacion.setFechaCreacion(LocalDateTime.now());
            voluntarioNotificacion.setLeida(false);
            notificacionService.crearNotificacion(voluntarioNotificacion);
        }

        return newCampaña;
    }

    @Transactional
    public Campaña updateCampaña(Long id, Campaña campañaDetails, Long adminId) {
        Campaña campaña = campañaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Campaña no encontrada con ID: " + id));

        String oldEstado = campaña.getEstado().name();

        campaña.setNombre(campañaDetails.getNombre());
        campaña.setDescripcion(campañaDetails.getDescripcion());
        campaña.setUbicacion(campañaDetails.getUbicacion());
        campaña.setFechaInicio(campañaDetails.getFechaInicio());
        campaña.setFechaFin(campañaDetails.getFechaFin());
        campaña.setEstado(campañaDetails.getEstado());

        Campaña updatedCampaña = campañaRepository.save(campaña);

        // Notificación para el administrador que actualizó la campaña
        Notificacion adminNotificacion = new Notificacion();
        adminNotificacion.setIdUsuario(adminId);
        adminNotificacion.setTitulo("Campaña Actualizada");
        adminNotificacion.setMensaje("La campaña '" + updatedCampaña.getNombre() + "' ha sido actualizada. Estado anterior: " + oldEstado + ", Nuevo estado: " + updatedCampaña.getEstado().name() + ".");
        adminNotificacion.setFechaCreacion(LocalDateTime.now());
        adminNotificacion.setLeida(false);
        notificacionService.crearNotificacion(adminNotificacion);

        // Notificación para los voluntarios INSCRITOS si la campaña se actualiza
        Set<Usuario> voluntariosInscritos = updatedCampaña.getVoluntariosInscritos();
        for (Usuario voluntario : voluntariosInscritos) {
            Notificacion voluntarioNotificacion = new Notificacion();
            voluntarioNotificacion.setIdUsuario(voluntario.getId());
            voluntarioNotificacion.setTitulo("Actualización de Campaña: " + updatedCampaña.getNombre());
            voluntarioNotificacion.setMensaje("¡Importante! La campaña '" + updatedCampaña.getNombre() + "' ha sido actualizada. Nuevo estado: " + updatedCampaña.getEstado().name() + ".");
            voluntarioNotificacion.setFechaCreacion(LocalDateTime.now());
            voluntarioNotificacion.setLeida(false);
            notificacionService.crearNotificacion(voluntarioNotificacion);
        }

        return updatedCampaña;
    }

    @Transactional
    public void deleteCampaña(Long id, Long adminId) {
        Campaña campañaToDelete = campañaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Campaña no encontrada con ID: " + id));

        // Notificar a los voluntarios INSCRITOS antes de eliminar la campaña
        Set<Usuario> voluntariosInscritos = campañaToDelete.getVoluntariosInscritos();
        for (Usuario voluntario : voluntariosInscritos) {
            Notificacion voluntarioNotificacion = new Notificacion();
            voluntarioNotificacion.setIdUsuario(voluntario.getId());
            voluntarioNotificacion.setTitulo("Campaña Eliminada: " + campañaToDelete.getNombre());
            voluntarioNotificacion.setMensaje("La campaña '" + campañaToDelete.getNombre() + "' en la que estabas inscrito ha sido eliminada.");
            voluntarioNotificacion.setFechaCreacion(LocalDateTime.now());
            voluntarioNotificacion.setLeida(false);
            notificacionService.crearNotificacion(voluntarioNotificacion);
        }

        campañaRepository.deleteById(id);

        // Notificación para el administrador que eliminó la campaña
        Notificacion adminNotificacion = new Notificacion();
        adminNotificacion.setIdUsuario(adminId);
        adminNotificacion.setTitulo("Campaña Eliminada");
        adminNotificacion.setMensaje("Has eliminado la campaña: '" + campañaToDelete.getNombre() + "'.");
        adminNotificacion.setFechaCreacion(LocalDateTime.now());
        adminNotificacion.setLeida(false);
        notificacionService.crearNotificacion(adminNotificacion);
    }

    /**
     * Inscribe un voluntario a una campaña.*/
    @Transactional
    public boolean inscribirVoluntario(Long idCampaña, Long idVoluntario) {
        Campaña campaña = campañaRepository.findById(idCampaña)
                .orElseThrow(() -> new RuntimeException("Campaña no encontrada con ID: " + idCampaña));
        Usuario voluntario = usuarioRepository.findById(idVoluntario)
                .orElseThrow(() -> new RuntimeException("Voluntario no encontrado con ID: " + idVoluntario));

        if (campaña.getVoluntariosInscritos().add(voluntario)) { // Si se añade (no estaba ya)
            campañaRepository.save(campaña);

            // Notificación para el voluntario sobre su inscripción
            Notificacion voluntarioNotificacion = new Notificacion();
            voluntarioNotificacion.setIdUsuario(idVoluntario);
            voluntarioNotificacion.setTitulo("¡Inscripción Exitosa!");
            voluntarioNotificacion.setMensaje("Te has inscrito exitosamente en la campaña: '" + campaña.getNombre() + "'.");
            voluntarioNotificacion.setFechaCreacion(LocalDateTime.now());
            voluntarioNotificacion.setLeida(false);
            notificacionService.crearNotificacion(voluntarioNotificacion);

            return true;
        }
        return false; // Ya estaba inscrito
    }

    /**
     * Anula la inscripción de un voluntario de una campaña. */
    @Transactional
    public boolean anularInscripcion(Long idCampaña, Long idVoluntario) {
        Campaña campaña = campañaRepository.findById(idCampaña)
                .orElseThrow(() -> new RuntimeException("Campaña no encontrada con ID: " + idCampaña));
        Usuario voluntario = usuarioRepository.findById(idVoluntario)
                .orElseThrow(() -> new RuntimeException("Voluntario no encontrado con ID: " + idVoluntario));

        if (campaña.getVoluntariosInscritos().remove(voluntario)) { // Si se elimina (estaba)
            campañaRepository.save(campaña);

            // Notificación para el voluntario sobre su anulación
            Notificacion voluntarioNotificacion = new Notificacion();
            voluntarioNotificacion.setIdUsuario(idVoluntario);
            voluntarioNotificacion.setTitulo("Inscripción Anulada");
            voluntarioNotificacion.setMensaje("Has anulado tu inscripción en la campaña: '" + campaña.getNombre() + "'.");
            voluntarioNotificacion.setFechaCreacion(LocalDateTime.now());
            voluntarioNotificacion.setLeida(false);
            notificacionService.crearNotificacion(voluntarioNotificacion);

            return true;
        }
        return false; // No estaba inscrito
    }

    /**
     * Verifica si un voluntario está inscrito en una campaña. */

    public boolean isVoluntarioInscrito(Long idCampaña, Long idVoluntario) {
        return campañaRepository.findById(idCampaña)
                .map(campana -> campana.getVoluntariosInscritos().stream()
                        .anyMatch(voluntario -> voluntario.getId().equals(idVoluntario)))
                .orElse(false);
    }
}
