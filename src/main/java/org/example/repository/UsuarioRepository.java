package org.example.repository;

import org.example.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    // Encuentra un usuario por su nombre de usuario.
    Optional<Usuario> findByNombreUsuario(String nombreUsuario);

    // Encuentra una lista de usuarios por su rol (ej. "ADMIN", "VOLUNTARIO").
    List<Usuario> findByRol(String rol);

    // Encuentra un usuario por su dirección de email.
    Optional<Usuario> findByEmail(String email);

    // --- Métodos añadidos para Reportes y validación de existencia ---

    // Verifica si un nombre de usuario ya existe en la base de datos.
    // Utilizado comúnmente en el proceso de registro para evitar duplicados.
    boolean existsByNombreUsuario(String nombreUsuario);

    // Verifica si una dirección de email ya existe en la base de datos.
    // Utilizado comúnmente en el proceso de registro para evitar duplicados.
    boolean existsByEmail(String email);

    // Cuenta el número de usuarios que tienen un rol específico.
    // Este métod es crucial para tus reportes, por ejemplo, para contar el total de voluntarios.
    long countByRol(String rol); // Esta es la función que te faltaba y que ReportesService buscaba
}