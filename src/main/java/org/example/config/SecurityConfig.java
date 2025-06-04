package org.example.config;

import org.example.filter.JwtRequestFilter;
import org.example.model.Usuario;
import org.example.repository.UsuarioRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter; // Importar para añadir el filtro JWT
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity // Habilita la seguridad a nivel de método con @PreAuthorize
public class SecurityConfig {

    private final UsuarioRepository usuarioRepository;
    // ¡ELIMINADO: private final JwtRequestFilter jwtRequestFilter; del constructor!

    // Constructor para inyección de dependencias (solo UsuarioRepository ahora)
    public SecurityConfig(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Bean
    // Inyectar JwtRequestFilter directamente en el método securityFilterChain
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtRequestFilter jwtRequestFilter) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable) // Deshabilitar CSRF (común en APIs REST con JWT)
                .cors(cors -> cors.configurationSource(corsConfigurationSource())) // Configuración CORS
                .authorizeHttpRequests(authorize -> authorize
                        // Rutas públicas que no requieren autenticación
                        .requestMatchers("/", "/index.html", "/css/**", "/js/**", "/webjars/**", "/assets/**", "/images/**").permitAll()
                        .requestMatchers("/api/auth/register").permitAll() // Permitir registro
                        .requestMatchers("/api/auth/login").permitAll()    // Permitir endpoint de login JWT
                        .requestMatchers("/h2-console/**").permitAll()     // Permitir acceso a la consola H2

                        // Rutas que requieren autenticación para TODOS los usuarios (incluidos voluntarios)
                        // Estas rutas serán protegidas por el filtro JWT
                        .requestMatchers("/api/campanas/**").authenticated()
                        .requestMatchers("/api/notificaciones/**").authenticated()
                        .requestMatchers("/api/perfil/**").authenticated()
                        .requestMatchers("/api/auth/change-password").authenticated()
                        .requestMatchers("/api/usuarios/me").authenticated() // Endpoint para obtener datos del usuario autenticado

                        // Rutas que requieren específicamente el rol de ADMIN
                        .requestMatchers("/api/usuarios/**").hasRole("ADMIN")
                        .requestMatchers("/api/reportes/**").hasRole("ADMIN")

                        .anyRequest().authenticated() // Cualquier otra petición requiere autenticación
                )
                // Deshabilitar formLogin y logout, ya que la autenticación se manejará con JWT
                // El frontend enviará credenciales a /api/auth/login y manejará el token
                .formLogin(AbstractHttpConfigurer::disable) // Deshabilitar el formulario de login de Spring Security
                .logout(AbstractHttpConfigurer::disable)    // Deshabilitar el manejo de logout de Spring Security
                .sessionManagement(session -> session
                        // Establecer la política de creación de sesiones a STATELESS
                        // Esto significa que Spring Security no creará ni usará sesiones HTTP (cookies JSESSIONID)
                        // Cada petición debe incluir el JWT para autenticarse.
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                );

        // Añadir el filtro JWT antes del filtro de autenticación de usuario/contraseña de Spring Security
        // Esto asegura que el token se valide antes de que Spring Security intente autenticar con credenciales.
        http.addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);

        // Configuración para permitir iframes (necesario para H2-console)
        http.headers(headers -> headers.frameOptions(frameOptions -> frameOptions.disable()));

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> usuarioRepository.findByNombreUsuario(username)
                .map(Usuario::toUserDetails)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + username));
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService());
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Asegúrate de que este origen sea el que usa tu frontend
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:80", "http://localhost:8080"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*")); // Permitir todos los encabezados, incluyendo Authorization
        configuration.setAllowCredentials(true); // Permitir el envío de cookies de credenciales (aunque con JWT es menos relevante)
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
