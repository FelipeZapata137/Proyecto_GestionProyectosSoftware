package org.example.controller;

import org.example.model.Usuario;
import org.example.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // DTO para la respuesta del usuario (recomendado para no exponer la contraseña)
    // Se puede mover a un paquete 'dto' para reutilizarlo en AuthController
    public static class UsuarioDTO {
        private Long id;
        private String nombreUsuario;
        private String nombre;
        private String apellido;
        private String email;
        private String telefono;
        private String rol;
        private double calificacion;
        private boolean activo;

        public UsuarioDTO(Usuario usuario) {
            this.id = usuario.getId();
            this.nombreUsuario = usuario.getNombreUsuario();
            this.nombre = usuario.getNombre();
            this.apellido = usuario.getApellido();
            this.email = usuario.getEmail();
            this.telefono = usuario.getTelefono();
            this.rol = usuario.getRol();
            this.calificacion = usuario.getCalificacion();
            this.activo = usuario.isActivo();
        }

        // Getters
        public Long getId() { return id; }
        public String getNombreUsuario() { return nombreUsuario; }
        public String getNombre() { return nombre; }
        public String getApellido() { return apellido; }
        public String getEmail() { return email; }
        public String getTelefono() { return telefono; }
        public String getRol() { return rol; }
        public double getCalificacion() { return calificacion; }
        public boolean isActivo() { return activo; }
    }


    // Endpoint para obtener el usuario autenticado (usado por el frontend)
    @GetMapping("/me")
    public ResponseEntity<UsuarioDTO> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        // El nombre de usuario de UserDetails es el nombre de usuario de tu entidad Usuario
        return usuarioRepository.findByNombreUsuario(userDetails.getUsername())
                .map(UsuarioDTO::new) // Convierte la entidad a DTO
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    // Endpoint para obtener todos los usuarios (solo ADMIN)
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')") // Requiere rol ADMIN
    public ResponseEntity<List<UsuarioDTO>> getAllUsuarios() {
        List<UsuarioDTO> usuarios = usuarioRepository.findAll().stream()
                .map(UsuarioDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(usuarios);
    }

    // Endpoint para obtener usuarios por rol (solo ADMIN)
    @GetMapping("/rol/{rol}")
    @PreAuthorize("hasRole('ADMIN')") // Requiere rol ADMIN
    public ResponseEntity<List<UsuarioDTO>> getUsuariosByRol(@PathVariable String rol) {
        List<UsuarioDTO> usuarios = usuarioRepository.findByRol(rol).stream()
                .map(UsuarioDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(usuarios);
    }

    // Endpoint para obtener un usuario por ID (solo ADMIN)
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')") // Requiere rol ADMIN
    public ResponseEntity<UsuarioDTO> getUsuarioById(@PathVariable Long id) {
        return usuarioRepository.findById(id)
                .map(UsuarioDTO::new)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Endpoint para actualizar un usuario (solo ADMIN o el propio usuario si es su perfil)
    @PutMapping("/{id}")
    public ResponseEntity<UsuarioDTO> updateUsuario(@PathVariable Long id, @RequestBody Usuario updatedUsuario) {
        // Obtenemos el usuario autenticado
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName(); // Nombre de usuario del que está logeado

        // Buscamos el usuario existente en la DB
        Optional<Usuario> existingUserOptional = usuarioRepository.findById(id);
        if (existingUserOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Usuario existingUser = existingUserOptional.get();

        // Verificar si el usuario autenticado es ADMIN o es el propio usuario que está actualizando su perfil
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isSelfUpdate = existingUser.getNombreUsuario().equals(currentUsername);

        if (!isAdmin && !isSelfUpdate) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build(); // No tiene permisos
        }

        // Actualizar solo los campos permitidos desde el frontend
        existingUser.setNombre(updatedUsuario.getNombre());
        existingUser.setApellido(updatedUsuario.getApellido());
        existingUser.setEmail(updatedUsuario.getEmail());
        existingUser.setTelefono(updatedUsuario.getTelefono());

        // Si es ADMIN, puede actualizar el estado 'activo' de cualquier usuario
        if (isAdmin) {
            existingUser.setActivo(updatedUsuario.isActivo());
        }

        // Guardar los cambios
        Usuario savedUsuario = usuarioRepository.save(existingUser);
        return ResponseEntity.ok(new UsuarioDTO(savedUsuario));
    }


    // Endpoint para cambiar la contraseña (para el propio usuario)
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> passwordChangeRequest,
                                            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String currentPassword = passwordChangeRequest.get("currentPassword");
        String newPassword = passwordChangeRequest.get("newPassword");
        Long userId = Long.valueOf(passwordChangeRequest.get("userId")); // El ID del usuario del frontend

        // Asegurarse de que el usuario autenticado sea el mismo que el del userId
        Usuario usuario = usuarioRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado con ID: " + userId));

        if (!usuario.getNombreUsuario().equals(userDetails.getUsername())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("mensaje", "No tienes permiso para cambiar la contraseña de este usuario."));
        }

        // Verificar la contraseña actual
        if (!passwordEncoder.matches(currentPassword, usuario.getContrasena())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("mensaje", "La contraseña actual es incorrecta."));
        }

        // Cifrar y guardar la nueva contraseña
        usuario.setContrasena(passwordEncoder.encode(newPassword));
        usuarioRepository.save(usuario);

        return ResponseEntity.ok(Map.of("mensaje", "Contraseña cambiada exitosamente."));
    }

    // Endpoint para eliminar un usuario (solo ADMIN)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')") // Requiere rol ADMIN
    public ResponseEntity<Void> deleteUsuario(@PathVariable Long id) {
        if (!usuarioRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        usuarioRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}