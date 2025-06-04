package org.example;

import org.example.model.Usuario;
import org.example.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class Main {

    public static void main(String[] args) {
        SpringApplication.run(Main.class, args);
    }

    @Bean
    public CommandLineRunner initData(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // Crear un usuario ADMIN si no existe
            if (usuarioRepository.findByNombreUsuario("admin").isEmpty()) {
                Usuario admin = new Usuario();
                admin.setNombreUsuario("admin");
                admin.setContrasena(passwordEncoder.encode("admin123")); // Contraseña segura
                admin.setNombre("Administrador");
                admin.setApellido("Sistema");
                admin.setEmail("admin@example.com");
                admin.setTelefono("123456789");
                admin.setRol("ADMIN"); // Rol de administrador
                admin.setActivo(true);
                admin.setCalificacion(5.0);
                usuarioRepository.save(admin);
                System.out.println("Usuario 'admin' creado.");
            }

            // Crear un usuario VOLUNTARIO si no existe
            if (usuarioRepository.findByNombreUsuario("voluntario1").isEmpty()) {
                Usuario voluntario = new Usuario();
                voluntario.setNombreUsuario("voluntario1");
                voluntario.setContrasena(passwordEncoder.encode("vol123")); // Contraseña segura
                voluntario.setNombre("Voluntario");
                voluntario.setApellido("Uno");
                voluntario.setEmail("voluntario1@example.com");
                voluntario.setTelefono("987654321");
                voluntario.setRol("VOLUNTARIO"); // Rol de voluntario
                voluntario.setActivo(true);
                voluntario.setCalificacion(4.5);
                usuarioRepository.save(voluntario);
                System.out.println("Usuario 'voluntario1' creado.");
            }
        };
    }
}