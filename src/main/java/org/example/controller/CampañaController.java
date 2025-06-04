package org.example.controller;

import org.example.model.Campaña;
import org.example.service.CampañaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; // Para seguridad a nivel de método
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController // Marca esta clase como un controlador REST
@RequestMapping("/api/campanas") // Ruta base para todos los endpoints de campañas
public class CampañaController {

    private final CampañaService campañaService;

    // Inyección de dependencias del servicio de campañas
    public CampañaController(CampañaService campañaService) {
        this.campañaService = campañaService;
    }

    @GetMapping // Maneja solicitudes GET a /api/campanas
    @PreAuthorize("hasAnyRole('ADMIN', 'VOLUNTARIO')") // Permite acceso a ADMIN y VOLUNTARIO
    public ResponseEntity<List<Campaña>> getAllCampanas() {
        List<Campaña> campanas = campañaService.getAllCampanas();
        return ResponseEntity.ok(campanas); // Devuelve 200 OK con la lista de campañas
    }

    @GetMapping("/{id}") // Maneja solicitudes GET a /api/campanas/{id}
    @PreAuthorize("hasAnyRole('ADMIN', 'VOLUNTARIO')")
    public ResponseEntity<Campaña> getCampañaById(@PathVariable Long id) {
        return campañaService.getCampañaById(id)
                .map(ResponseEntity::ok) // Si encuentra la campaña, devuelve 200 OK
                .orElse(ResponseEntity.notFound().build()); // Si no la encuentra, devuelve 404 Not Found
    }

    @PostMapping // Maneja solicitudes POST a /api/campanas
    @PreAuthorize("hasRole('ADMIN')") // Solo permite acceso a ADMIN
    public ResponseEntity<Campaña> createCampaña(@RequestBody Campaña campaña) {
        Campaña newCampaña = campañaService.createCampaña(campaña);
        return ResponseEntity.status(HttpStatus.CREATED).body(newCampaña); // Devuelve 201 Created con la nueva campaña
    }

    @PutMapping("/{id}") // Maneja solicitudes PUT a /api/campanas/{id}
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Campaña> updateCampaña(@PathVariable Long id, @RequestBody Campaña campaña) {
        try {
            Campaña updatedCampaña = campañaService.updateCampaña(id, campaña);
            return ResponseEntity.ok(updatedCampaña); // Devuelve 200 OK con la campaña actualizada
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build(); // Devuelve 404 Not Found si no existe
        }
    }

    @DeleteMapping("/{id}") // Maneja solicitudes DELETE a /api/campanas/{id}
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCampaña(@PathVariable Long id) {
        try {
            campañaService.deleteCampaña(id);
            return ResponseEntity.noContent().build(); // Devuelve 204 No Content si se elimina exitosamente
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build(); // Devuelve 404 Not Found si no existe
        }
    }
}