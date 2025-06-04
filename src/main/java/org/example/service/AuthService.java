package org.example.service;

import org.example.dto.RegistroRequest;
import org.example.model.Usuario;
import org.example.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder; // Importa PasswordEncoder
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder; // Inyección de PasswordEncoder

    public AuthService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Usuario register(RegistroRequest request) {
        if (usuarioRepository.findByNombreUsuario(request.getNombreUsuario()).isPresent()) { // Error: private access
            throw new RuntimeException("El nombre de usuario ya existe.");
        }
        if (usuarioRepository.findByEmail(request.getEmail()).isPresent()) { // Error: private access
            throw new RuntimeException("El email ya está registrado.");
        }

        Usuario nuevoUsuario = new Usuario();
        nuevoUsuario.setNombreUsuario(request.getNombreUsuario()); // Error: private access
        nuevoUsuario.setContrasena(passwordEncoder.encode(request.getContrasena())); // Error: private access, cannot resolve encode
        nuevoUsuario.setNombre(request.getNombre()); // Error: private access
        nuevoUsuario.setApellido(request.getApellido()); // Error: private access
        nuevoUsuario.setEmail(request.getEmail()); // Error: private access
        nuevoUsuario.setTelefono(request.getTelefono()); // Error: private access
        nuevoUsuario.setRol("VOLUNTARIO"); // Error: cannot resolve symbol 'rol'
        nuevoUsuario.setActivo(true);

        return usuarioRepository.save(nuevoUsuario);
    }

    // Método de autenticación (suponiendo que es el que da los errores)
    public Usuario autenticar(String nombreUsuario, String contrasena) {
        Usuario usuario = usuarioRepository.findByNombreUsuario(nombreUsuario)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado."));

        if (!passwordEncoder.matches(contrasena, usuario.getContrasena())) { // Error: cannot resolve matches
            throw new RuntimeException("Credenciales inválidas.");
        }
        return usuario;
    }
}