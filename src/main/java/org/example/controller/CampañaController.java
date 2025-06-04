package org.example.controller;

import org.example.model.Campaña;
import org.example.model.Usuario; // Importar Usuario
import org.example.repository.UsuarioRepository; // Importar UsuarioRepository
import org.example.service.CampañaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication; // Importar Authentication
import org.springframework.security.core.context.SecurityContextHolder; // Importar SecurityContextHolder
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/campanas")
public class CampañaController {

    private final CampañaService campañaService;
    private final UsuarioRepository usuarioRepository; // Inyectar UsuarioRepository

    // Inyección de dependencias del servicio de campañas y del repositorio de usuarios
    public CampañaController(CampañaService campañaService, UsuarioRepository usuarioRepository) {
        this.campañaService = campañaService;
        this.usuarioRepository = usuarioRepository;
    }

    // Método auxiliar para obtener el ID del usuario autenticado
    private Long getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("Usuario no autenticado.");
        }
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
        Long userId = getAuthenticatedUserId(); // Obtener el ID del usuario autenticado
        Campaña newCampaña = campañaService.createCampaña(campaña, userId); // Pasar userId al servicio
        return ResponseEntity.status(HttpStatus.CREATED).body(newCampaña);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Campaña> updateCampaña(@PathVariable Long id, @RequestBody Campaña campaña) {
        try {
            Long userId = getAuthenticatedUserId(); // Obtener el ID del usuario autenticado
            Campaña updatedCampaña = campañaService.updateCampaña(id, campaña, userId); // Pasar userId al servicio
            return ResponseEntity.ok(updatedCampaña);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCampaña(@PathVariable Long id) {
        try {
            Long userId = getAuthenticatedUserId(); // Obtener el ID del usuario autenticado
            campañaService.deleteCampaña(id, userId); // Pasar userId al servicio
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    // Nuevo endpoint para el calendario, ya que el frontend lo busca en /api/campanas/eventos
    // Asumimos que este endpoint devuelve una lista de campañas en un formato apto para el calendario
    // Este endpoint debería ser accesible por cualquier usuario autenticado
    @GetMapping("/eventos")
    @PreAuthorize("hasAnyRole('ADMIN', 'VOLUNTARIO')") // Asegura que solo usuarios autenticados puedan acceder
    public ResponseEntity<List<Campaña>> getCampanaEventos() {
        // Aquí puedes devolver todas las campañas o solo las relevantes para el calendario
        List<Campaña> eventos = campañaService.getAllCampanas(); // Usamos getAllCampanas por simplicidad
        return ResponseEntity.ok(eventos);
    }
}
