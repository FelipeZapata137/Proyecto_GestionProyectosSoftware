package org.example.config;

import org.example.filter.JwtRequestFilter; // Importar el filtro JWT
import org.example.model.Usuario; // Importar la entidad Usuario
import org.example.repository.UsuarioRepository; // Importar el repositorio de Usuario
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
import java.util.List; // Importar List

@Configuration // Marca esta clase como una fuente de definiciones de beans
@EnableWebSecurity // Habilita la configuración de seguridad web de Spring
@EnableMethodSecurity // Habilita la seguridad a nivel de método con anotaciones como @PreAuthorize
public class WebSecurityConfig { // Cambiado el nombre de la clase a WebSecurityConfig

    private final UsuarioRepository usuarioRepository;
    // ¡CORRECCIÓN CLAVE: Eliminado 'private final JwtRequestFilter jwtRequestFilter;' del constructor!

    // Constructor para inyección de dependencias (solo UsuarioRepository ahora)
    public WebSecurityConfig(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    /**
     * Configura la cadena de filtros de seguridad HTTP.
     * Define qué rutas son públicas, cuáles requieren autenticación y cuáles requieren roles específicos.
     * @param http Objeto HttpSecurity para configurar la seguridad.
     * @param jwtRequestFilter El filtro JWT, inyectado directamente aquí por Spring.
     * @return La cadena de filtros de seguridad configurada.
     * @throws Exception Si ocurre un error durante la configuración.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtRequestFilter jwtRequestFilter) throws Exception {
        http
                // Deshabilitar CSRF (Cross-Site Request Forgery) para APIs RESTful que usan JWT.
                .csrf(AbstractHttpConfigurer::disable)
                // Habilitar y configurar CORS (Cross-Origin Resource Sharing) para permitir
                // solicitudes desde tu frontend que se ejecuta en un origen diferente (ej. localhost:8080).
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // Configurar las reglas de autorización para las solicitudes HTTP
                .authorizeHttpRequests(authorize -> authorize
                        // Rutas públicas que no requieren autenticación (permitAll())
                        // Esto incluye la página principal, archivos estáticos (CSS, JS, imágenes)
                        // y los endpoints de autenticación (login y registro).
                        .requestMatchers("/", "/index.html", "/css/**", "/js/**", "/webjars/**", "/assets/**", "/images/**").permitAll()
                        .requestMatchers("/api/auth/**").permitAll() // Permitir acceso a todos los endpoints bajo /api/auth/ (login, register, etc.)
                        .requestMatchers("/h2-console/**").permitAll() // Permitir acceso a la consola H2 (útil para desarrollo)

                        // Rutas que requieren autenticación para CUALQUIER usuario (authenticated())
                        // Esto incluye el endpoint de eventos del calendario y la mayoría de los recursos principales.
                        .requestMatchers("/api/campanas/eventos").authenticated() // El calendario requiere que el usuario esté logeado
                        .requestMatchers("/api/campanas/**").authenticated() // Todas las demás rutas de campañas
                        .requestMatchers("/api/notificaciones/**").authenticated() // Todas las rutas de notificaciones
                        .requestMatchers("/api/perfil/**").authenticated() // Perfil de usuario
                        .requestMatchers("/api/auth/change-password").authenticated() // Cambio de contraseña
                        .requestMatchers("/api/usuarios/me").authenticated() // Obtener datos del usuario autenticado

                        // Rutas que requieren un rol específico (hasRole('ADMIN'))
                        // Estos endpoints solo son accesibles por usuarios con el rol 'ADMIN'.
                        .requestMatchers("/api/usuarios/**").hasRole("ADMIN") // Gestión de usuarios (CRUD)
                        .requestMatchers("/api/reportes/**").hasRole("ADMIN") // Generación de reportes

                        // Cualquier otra solicitud no especificada anteriormente requiere autenticación
                        .anyRequest().authenticated()
                )
                // Deshabilitar el formulario de login y logout por defecto de Spring Security,
                // ya que estamos usando autenticación basada en JWT (stateless).
                .formLogin(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                // Configurar la gestión de sesiones como STATELESS.
                // Esto significa que el servidor no mantendrá un estado de sesión para el usuario.
                // Cada petición autenticada debe incluir el token JWT.
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                );

        // Añadir el filtro JWT personalizado antes del filtro de autenticación de usuario/contraseña de Spring Security.
        // Esto asegura que el token se valide en cada petición antes de que Spring Security intente autenticar con credenciales.
        http.addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);

        // Configuración para permitir iframes (necesario para que la consola H2 funcione dentro de un iframe).
        http.headers(headers -> headers.frameOptions(frameOptions -> frameOptions.disable()));

        return http.build(); // Construye y devuelve la cadena de filtros de seguridad
    }

    /**
     * Define el bean para el codificador de contraseñas (BCrypt es el recomendado).
     * @return Una instancia de BCryptPasswordEncoder.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Define el bean para el servicio de detalles de usuario.
     * Carga los detalles del usuario desde el repositorio. */
    @Bean
    public UserDetailsService userDetailsService() {
        return username -> usuarioRepository.findByNombreUsuario(username)
                .map(Usuario::toUserDetails) // Convierte tu entidad Usuario a UserDetails
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + username));
    }

    /**
     * Define el bean para el proveedor de autenticación DAO.
     * Utiliza el UserDetailsService y PasswordEncoder definidos. */
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService());
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    /**
     * Expone el AuthenticationManager para que pueda ser inyectado y usado */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    /**
     * Configuración de CORS (Cross-Origin Resource Sharing).
     * Define qué orígenes, métodos y encabezados están permitidos para las solicitudes de origen cruzado. */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Orígenes permitidos (donde se ejecuta tu frontend).
        // Es CRÍTICO que esta URL coincida con la URL de tu frontend.
        configuration.setAllowedOrigins(List.of("http://localhost:8080")); // O la URL de tu frontend
        // Métodos HTTP permitidos (GET, POST, PUT, DELETE, OPTIONS para preflight requests).
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        // Encabezados permitidos (permitir todos los encabezados, incluyendo Authorization).
        configuration.setAllowedHeaders(List.of("*"));
        // Permitir el envío de credenciales (cookies, encabezados de autorización).
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // Aplicar esta configuración CORS a todas las rutas (/**).
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
