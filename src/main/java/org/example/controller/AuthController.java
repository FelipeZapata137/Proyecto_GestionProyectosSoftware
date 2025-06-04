package org.example.controller;

import org.example.dto.LoginRequest; // Importar el DTO para la solicitud de login
import org.example.dto.LoginResponse; // Importar el DTO para la respuesta de login
import org.example.dto.RegistroRequest;
import org.example.model.Usuario; // Importar la entidad Usuario
import org.example.service.AuthService;
import org.example.repository.UsuarioRepository; // Necesario para cargar el usuario en el login
import org.example.util.JwtUtil; // Importar la utilidad JWT
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final AuthenticationManager authenticationManager; // Inyectar AuthenticationManager
    private final JwtUtil jwtUtil; // Inyectar JwtUtil
    private final UsuarioRepository usuarioRepository; // Inyectar UsuarioRepository para obtener detalles del usuario

    // Constructor para inyección de dependencias
    public AuthController(AuthService authService, AuthenticationManager authenticationManager, JwtUtil jwtUtil, UsuarioRepository usuarioRepository) {
        this.authService = authService;
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.usuarioRepository = usuarioRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<String> registerUser(@RequestBody RegistroRequest registroRequest) {
        try {
            authService.register(registroRequest);
            return ResponseEntity.ok("Usuario registrado exitosamente.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/login") // Nuevo endpoint para el inicio de sesión con JWT
    public ResponseEntity<?> createAuthenticationToken(@RequestBody LoginRequest loginRequest) throws Exception {
        try {
            // Autenticar al usuario usando AuthenticationManager
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
            );

            // Si la autenticación es exitosa, cargar los detalles completos del usuario
            final UserDetails userDetails = (UserDetails) authentication.getPrincipal(); // Obtener UserDetails del objeto Authentication

            // Generar el token JWT
            final String jwt = jwtUtil.generateToken(userDetails);

            // Obtener la entidad Usuario completa de la base de datos para construir la respuesta
            // Esto es necesario para obtener todos los campos del DTO LoginResponse
            Usuario usuario = usuarioRepository.findByNombreUsuario(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado después de autenticación."));

            // Devolver el token JWT y los datos del usuario en la respuesta
            return ResponseEntity.ok(new LoginResponse(jwt, usuario));

        } catch (BadCredentialsException e) {
            // Credenciales inválidas
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Credenciales inválidas.");
        } catch (Exception e) {
            // Otros errores durante el proceso de autenticación/generación de token
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error durante el inicio de sesión: " + e.getMessage());
        }
    }
}
