package org.example.controller;

import org.example.model.Campaña;
import org.example.model.Usuario;
import org.example.repository.UsuarioRepository;
import org.example.service.CampañaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/campanas")
public class CampañaController {

    private final CampañaService campañaService;
    private final UsuarioRepository usuarioRepository;

    public CampañaController(CampañaService campañaService, UsuarioRepository usuarioRepository) {
        this.campañaService = campañaService;
        this.usuarioRepository = usuarioRepository;
    }

    private Long getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("Usuario no autenticado.");
        }
        // El principal en este punto es un objeto UserDetails (Spring Security User)
        String username = authentication.getName(); // Obtener el nombre de usuario
        Usuario usuario = usuarioRepository.findByNombreUsuario(username)
                .orElseThrow(() -> new RuntimeException("Usuario autenticado no encontrado en la base de datos."));
        return usuario.getId();
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'VOLUNTARIO')")
    public ResponseEntity<List<Campaña>> getAllCampanas() {
        List<Campaña> campanas = campañaService.getAllCampanas();
        return ResponseEntity.ok(campanas);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'VOLUNTARIO')")
    public ResponseEntity<Campaña> getCampañaById(@PathVariable Long id) {
        return campañaService.getCampañaById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Campaña> createCampaña(@RequestBody Campaña campaña) {
        Long adminId = getAuthenticatedUserId();
        Campaña newCampaña = campañaService.createCampaña(campaña, adminId);
        return ResponseEntity.status(HttpStatus.CREATED).body(newCampaña);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Campaña> updateCampaña(@PathVariable Long id, @RequestBody Campaña campaña) {
        try {
            Long adminId = getAuthenticatedUserId();
            Campaña updatedCampaña = campañaService.updateCampaña(id, campaña, adminId);
            return ResponseEntity.ok(updatedCampaña);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCampaña(@PathVariable Long id) {
        try {
            Long adminId = getAuthenticatedUserId();
            campañaService.deleteCampaña(id, adminId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("/eventos")
    @PreAuthorize("hasAnyRole('ADMIN', 'VOLUNTARIO')")
    public ResponseEntity<List<Campaña>> getCampanaEventos() {
        List<Campaña> eventos = campañaService.getAllCampanas();
        return ResponseEntity.ok(eventos);
    }

    // NUEVOS ENDPOINTS PARA INSCRIPCIONES

    /**
     * Endpoint para inscribir un voluntario a una campaña.
     * Requiere que el usuario esté autenticado y tenga el rol 'VOLUNTARIO'.
     * La validación de que el idVoluntario coincida con el usuario autenticado se hace dentro del método.
     * @param idCampaña ID de la campaña.
     * @param idVoluntario ID del voluntario.
     * @return ResponseEntity con estado 200 OK si la inscripción es exitosa, 400 Bad Request si ya está inscrito, 403 Forbidden si el ID no coincide, 404 Not Found si no existe campaña/voluntario.
     */
    @PostMapping("/{idCampaña}/inscribir/{idVoluntario}")
    @PreAuthorize("hasRole('VOLUNTARIO')") // Solo verifica el rol. La coincidencia de ID se valida en el método.
    public ResponseEntity<String> inscribirVoluntario(@PathVariable Long idCampaña, @PathVariable Long idVoluntario) {
        try {
            // Validar que el idVoluntario del path coincida con el usuario autenticado
            Long authenticatedUserId = getAuthenticatedUserId();
            if (!authenticatedUserId.equals(idVoluntario)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tienes permiso para inscribir a otro usuario.");
            }

            boolean inscrito = campañaService.inscribirVoluntario(idCampaña, idVoluntario);
            if (inscrito) {
                return ResponseEntity.ok("Voluntario inscrito exitosamente.");
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("El voluntario ya está inscrito en esta campaña.");
            }
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    /**
     * Endpoint para anular la inscripción de un voluntario de una campaña.
     * Requiere que el usuario esté autenticado y tenga el rol 'VOLUNTARIO'.
     * La validación de que el idVoluntario coincida con el usuario autenticado se hace dentro del método.
     * @param idCampaña ID de la campaña.
     * @param idVoluntario ID del voluntario.
     * @return ResponseEntity con estado 200 OK si la anulación es exitosa, 400 Bad Request si no estaba inscrito, 403 Forbidden si el ID no coincide, 404 Not Found si no existe campaña/voluntario.
     */
    @DeleteMapping("/{idCampaña}/anular/{idVoluntario}")
    @PreAuthorize("hasRole('VOLUNTARIO')") // Solo verifica el rol. La coincidencia de ID se valida en el método.
    public ResponseEntity<String> anularInscripcion(@PathVariable Long idCampaña, @PathVariable Long idVoluntario) {
        try {
            Long authenticatedUserId = getAuthenticatedUserId();
            if (!authenticatedUserId.equals(idVoluntario)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tienes permiso para anular la inscripción de otro usuario.");
            }

            boolean anulado = campañaService.anularInscripcion(idCampaña, idVoluntario);
            if (anulado) {
                return ResponseEntity.ok("Inscripción anulada exitosamente.");
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("El voluntario no estaba inscrito en esta campaña.");
            }
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    /**
     * Endpoint para verificar si un voluntario está inscrito en una campaña.
     * @param idCampaña ID de la campaña.
     * @param idVoluntario ID del voluntario.
     * @return ResponseEntity con true/false si está inscrito, 403 Forbidden si el ID no coincide (para voluntario), 404 Not Found si no existe campaña/voluntario.
     */
    @GetMapping("/{idCampaña}/inscrito/{idVoluntario}")
    @PreAuthorize("hasAnyRole('ADMIN', 'VOLUNTARIO')") // Admin puede verificar. Voluntario verifica su propia inscripción.
    public ResponseEntity<Boolean> isVoluntarioInscrito(@PathVariable Long idCampaña, @PathVariable Long idVoluntario) {
        try {
            // Si el usuario es voluntario, debe verificar su propia inscripción
            // Aquí obtenemos el rol del principal
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            boolean isVoluntario = authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_VOLUNTARIO"));

            if (isVoluntario) {
                Long authenticatedUserId = getAuthenticatedUserId();
                if (!authenticatedUserId.equals(idVoluntario)) {
                    // Si un voluntario intenta verificar la inscripción de otro, se deniega.
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(false);
                }
            }

            boolean inscrito = campañaService.isVoluntarioInscrito(idCampaña, idVoluntario);
            return ResponseEntity.ok(inscrito);
        } catch (RuntimeException e) {
            // Logear el error para depuración
            System.err.println("Error al verificar inscripción: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(false);
        }
    }
}
