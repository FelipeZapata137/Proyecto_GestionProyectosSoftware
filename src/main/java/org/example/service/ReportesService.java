package org.example.service;

import org.example.dto.ReporteResumenDTO;
import org.example.model.EstadoCampaña;
import org.example.repository.CampañaRepository;
import org.example.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

@Service
public class ReportesService {

    private final CampañaRepository campañaRepository;
    private final UsuarioRepository usuarioRepository;

    @Autowired
    public ReportesService(CampañaRepository campañaRepository, UsuarioRepository usuarioRepository) {
        this.campañaRepository = campañaRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public ReporteResumenDTO generarResumenReporte() {
        long totalCampanas = campañaRepository.count();
        // CORRECCIÓN: Pasar los valores del ENUM directamente
        long campanasActivas = campañaRepository.countByEstado(EstadoCampaña.ACTIVA);
        long campanasPlanificadas = campañaRepository.countByEstado(EstadoCampaña.PLANIFICADA);
        long campanasFinalizadas = campañaRepository.countByEstado(EstadoCampaña.FINALIZADA);

        long totalUsuarios = usuarioRepository.count();
        long totalVoluntarios = usuarioRepository.countByRol("VOLUNTARIO");

        ReporteResumenDTO resumen = new ReporteResumenDTO();
        resumen.setTotalCampanas(totalCampanas);
        resumen.setCampanasActivas(campanasActivas);
        resumen.setCampanasPlanificadas(campanasPlanificadas);
        resumen.setCampanasFinalizadas(campanasFinalizadas);
        resumen.setTotalUsuarios(totalUsuarios);
        resumen.setTotalVoluntarios(totalVoluntarios);

        return resumen;
    }
}