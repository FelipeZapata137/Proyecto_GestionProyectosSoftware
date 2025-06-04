package org.example.service;

import org.example.controller.UsuarioController;
import org.example.model.Campaña;
import org.example.repository.CampañaRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CampañaService {

    private final CampañaRepository campañaRepository;

    public CampañaService(CampañaRepository campañaRepository) {
        this.campañaRepository = campañaRepository;
    }

    public List<Campaña> getAllCampanas() {
        return campañaRepository.findAll();
    }

    public Optional<Campaña> getCampañaById(Long id) {
        return campañaRepository.findById(id);
    }

    public Campaña createCampaña(Campaña campaña) {
        return campañaRepository.save(campaña);
    }

    public Campaña updateCampaña(Long id, Campaña campañaDetails) {
        Campaña campaña = campañaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Campaña no encontrada con ID: " + id));

        campaña.setNombre(campañaDetails.getNombre());
        campaña.setDescripcion(campañaDetails.getDescripcion());
        campaña.setUbicacion(campañaDetails.getUbicacion());
        campaña.setFechaInicio(campañaDetails.getFechaInicio());
        campaña.setFechaFin(campañaDetails.getFechaFin());
        campaña.setEstado(campañaDetails.getEstado());

        return campañaRepository.save(campaña);
    }

    public void deleteCampaña(Long id) {
        if (!campañaRepository.existsById(id)) {
            throw new RuntimeException("Campaña no encontrada con ID: " + id);
        }
        campañaRepository.deleteById(id);
    }
}