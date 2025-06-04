package org.example.controller;

import org.example.dto.ReporteResumenDTO;
import org.example.service.ReportesService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reportes")
public class ReportesController {

    private final ReportesService reportesService;

    public ReportesController(ReportesService reportesService) {
        this.reportesService = reportesService;
    }

    @GetMapping("/resumen")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ReporteResumenDTO> getResumenReporte() {
        ReporteResumenDTO resumen = reportesService.generarResumenReporte();
        return ResponseEntity.ok(resumen);
    }
}