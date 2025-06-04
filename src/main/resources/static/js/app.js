// URL base de la API de tu backend Spring Boot
const API_BASE_URL = 'http://localhost:8080/api';
// Variable global para almacenar los datos del usuario autenticado
let usuarioActual = null;

// --- Funciones de Utilidad ---

/**
 * Muestra una sección específica de la interfaz de usuario y oculta todas las demás.
 * @param {string} idSeccion - El ID de la sección HTML a mostrar.
 */
function mostrarSeccion(idSeccion) {
    // Oculta todas las secciones dentro del elemento 'main'
    document.querySelectorAll('main section').forEach(seccion => {
        seccion.style.display = 'none';
    });
    // Muestra la sección con el ID especificado
    document.getElementById(idSeccion).style.display = 'block';
}

/**
 * Actualiza la visibilidad de los elementos de navegación según el estado de autenticación
 * y el rol del usuario.
 */
function actualizarNavegacion() {
    // Obtener referencias a todos los elementos de navegación
    const navIniciarSesion = document.getElementById('nav-login');
    const navRegistrarse = document.getElementById('nav-register');
    const navMiPerfil = document.getElementById('nav-profile');
    const navCampanas = document.getElementById('nav-campaigns');
    const navGestionCampanasAdmin = document.getElementById('nav-admin-campaigns');
    const navVoluntariosAdmin = document.getElementById('nav-volunteers');
    const navReportesAdmin = document.getElementById('nav-reports-admin'); // ID corregido
    const navCalendario = document.getElementById('nav-calendar');
    const navNotificaciones = document.getElementById('nav-notifications');
    const navCerrarSesion = document.getElementById('nav-logout');
    const infoUsuarioSpan = document.getElementById('user-info'); // Para mostrar el nombre de usuario

    if (usuarioActual) {
        // Usuario autenticado: Ocultar opciones de no logeado, mostrar opciones de logeado
        navIniciarSesion.style.display = 'none';
        navRegistrarse.style.display = 'none';

        navMiPerfil.style.display = 'block';
        navCampanas.style.display = 'block';
        navCalendario.style.display = 'block';
        navNotificaciones.style.display = 'block';
        navCerrarSesion.style.display = 'block';
        infoUsuarioSpan.textContent = `Bienvenido, ${usuarioActual.nombreUsuario}`;

        // Opciones específicas para el rol de ADMINISTRADOR
        if (usuarioActual.rol === 'ADMIN') {
            navGestionCampanasAdmin.style.display = 'block';
            navVoluntariosAdmin.style.display = 'block';
            navReportesAdmin.style.display = 'block'; // Mostrar opción de reportes para Admin
        } else {
            // Ocultar opciones de admin para otros roles
            navGestionCampanasAdmin.style.display = 'none';
            navVoluntariosAdmin.style.display = 'none';
            navReportesAdmin.style.display = 'none';
        }
    } else {
        // Usuario no autenticado: Mostrar opciones de no logeado, ocultar todas las demás
        navIniciarSesion.style.display = 'block';
        navRegistrarse.style.display = 'block';

        navMiPerfil.style.display = 'none';
        navCampanas.style.display = 'none';
        navGestionCampanasAdmin.style.display = 'none';
        navVoluntariosAdmin.style.display = 'none';
        navReportesAdmin.style.display = 'none';
        navCalendario.style.display = 'none';
        navNotificaciones.style.display = 'none';
        navCerrarSesion.style.display = 'none';
        infoUsuarioSpan.textContent = ''; // Limpiar información de usuario
        mostrarIniciarSesion(); // Por defecto, si no hay usuario, mostrar la sección de login
    }
}

/**
 * Muestra un mensaje de retroalimentación al usuario en un elemento HTML específico.
 * @param {string} idElemento - El ID del elemento HTML donde se mostrará el mensaje.
 * @param {string} mensaje - El texto del mensaje a mostrar.
 * @param {boolean} esError - True si el mensaje es un error (para aplicar estilos de error).
 */
function mostrarMensaje(idElemento, mensaje, esError = false) {
    const elemento = document.getElementById(idElemento);
    if (!elemento) {
        console.error(`Elemento con ID '${idElemento}' no encontrado para mostrar mensaje.`);
        return;
    }
    elemento.textContent = mensaje; // Establecer el texto del mensaje
    elemento.className = esError ? 'message error' : 'message success'; // Aplicar clase CSS para estilo
    elemento.style.display = 'block'; // Asegurarse de que el mensaje sea visible
    // Opcional: ocultar el mensaje después de X segundos (descomentar si se desea)
    // setTimeout(() => { elemento.style.display = 'none'; }, 5000);
}

/**
 * Oculta un mensaje de retroalimentación en un elemento HTML específico.
 * @param {string} idElemento - El ID del elemento HTML cuyo mensaje se ocultará.
 */
function ocultarMensajes(idElemento) {
    const elemento = document.getElementById(idElemento);
    if (elemento) {
        elemento.textContent = ''; // Limpiar el texto
        elemento.style.display = 'none'; // Ocultar el elemento
    }
}

/**
 * Muestra un modal (elemento con display: none por defecto).
 * @param {string} idModal - El ID del modal a mostrar.
 */
function mostrarModal(idModal) {
    document.getElementById(idModal).style.display = 'block';
}

/**
 * Cierra un modal y limpia los mensajes asociados.
 * @param {string} idModal - El ID del modal a cerrar.
 */
function cerrarModal(idModal) {
    document.getElementById(idModal).style.display = 'none';
    // Limpiar mensajes específicos de modales al cerrarlos
    ocultarMensajes('modal-action-message');
    ocultarMensajes('campaign-form-message');
}

// --- Autenticación y Estado de la Sesión ---

/**
 * Función auxiliar para manejar el éxito del login, guardando el token y actualizando la UI.
 * @param {object} userData - Los datos del usuario (incluyendo el token JWT si aplica).
 */
function handleLoginSuccess(userData) {
    // Si el backend devuelve un token JWT, guárdalo
    if (userData.jwtToken) {
        localStorage.setItem('jwtToken', userData.jwtToken);
    }
    // Guarda los datos del usuario (sin el token si no quieres que esté en usuarioActual)
    usuarioActual = { ...userData }; // Copia los datos del usuario
    delete usuarioActual.jwtToken; // Elimina el token del objeto usuarioActual si lo tenía

    actualizarNavegacion();
    // Redirigir al perfil o a la sección principal tras un login exitoso
    mostrarPerfil(); // O podrías mostrarCampanas()
    // Limpiar los parámetros de la URL una vez procesados
    history.replaceState({}, document.title, window.location.pathname);
}

/**
 * Verifica el estado de autenticación del usuario al cargar la página o después de acciones de login/logout.
 * Realiza una petición a un endpoint protegido para obtener los datos del usuario autenticado.
 */
async function verificarEstadoAutenticacion() {
    try {
        ocultarMensajes('login-message'); // Limpiar mensajes de login previos

        // Verificar si hay parámetros de URL de Spring Security (ej. ?error o ?logout)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('error')) {
            mostrarMensaje('login-message', 'Credenciales inválidas. Por favor, inténtalo de nuevo.', true);
        } else if (urlParams.has('logout')) {
            mostrarMensaje('login-message', 'Has cerrado sesión exitosamente.', false);
        }

        // Si usas JWT y lo tienes en localStorage, verifica si es válido
        const token = localStorage.getItem('jwtToken');
        if (token) {
            // Realizar una petición a un endpoint protegido (ej. /api/usuarios/me)
            // para obtener los datos del usuario autenticado y validar el token.
            const respuesta = await fetch(`${API_BASE_URL}/usuarios/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (respuesta.ok) {
                // Token válido y usuario autenticado: obtener sus detalles y actualizar la UI
                const userData = await respuesta.json();
                handleLoginSuccess({ ...userData, jwtToken: token }); // Re-añadir token si lo necesitas en handleLoginSuccess
            } else {
                // Token inválido o expirado: limpiar token y estado, mostrar login
                localStorage.removeItem('jwtToken'); // Eliminar token inválido
                usuarioActual = null;
                actualizarNavegacion();
                mostrarIniciarSesion();
            }
        } else {
            // No hay token en localStorage: no autenticado
            usuarioActual = null;
            actualizarNavegacion();
            mostrarIniciarSesion();
        }
    } catch (error) {
        console.error("Error al verificar estado de autenticación:", error);
        localStorage.removeItem('jwtToken'); // En caso de error de red, limpiar token por si acaso
        usuarioActual = null;
        actualizarNavegacion();
        mostrarMensaje('login-message', 'Error de conexión con el servidor. Inténtalo más tarde.', true);
        mostrarIniciarSesion();
    }
}

/**
 * Maneja el proceso de inicio de sesión.
 * Envía las credenciales al backend y guarda el token JWT si la autenticación es exitosa.
 * @param {Event} evento - El evento de envío del formulario.
 */
async function iniciarSesion(evento) {
    console.log("DEBUG: Función iniciarSesion ha sido llamada."); // <--- ¡ESTA ES LA LÍNEA CLAVE!
    evento.preventDefault(); // Prevenir el envío por defecto del formulario HTML
    const formulario = document.getElementById('login-form');
    const datosFormulario = new FormData(formulario);
    const credenciales = Object.fromEntries(datosFormulario.entries());

    ocultarMensajes('login-message'); // Limpiar mensaje previo

    try {
        // Realizar la petición POST al endpoint de login de tu backend
        // Asume que tu backend tiene un endpoint como /api/auth/login que devuelve un JWT
        const respuesta = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credenciales)
        });

        // Intentar parsear la respuesta JSON, incluso si es un error, por si el backend envía un mensaje
        const datos = await respuesta.json().catch(() => ({ message: respuesta.statusText || 'Error desconocido' }));

        if (respuesta.ok) { // Código de estado 200-299
            // Si el login es exitoso, los datos deberían contener el token JWT y la información del usuario
            handleLoginSuccess(datos); // Llama a la función para guardar token y actualizar UI
            mostrarMensaje('login-message', '¡Inicio de sesión exitoso!', false);
        } else { // Código de estado 4xx o 5xx
            // Si el backend envía un mensaje de error en el JSON, usarlo
            mostrarMensaje('login-message', datos.message || 'Credenciales inválidas. Inténtalo de nuevo.', true);
        }
    } catch (error) {
        // Manejo de errores de red o JSON inválido
        mostrarMensaje('login-message', `Error de red: ${error.message}. Verifica tu conexión o el servidor.`, true);
    }
}

/**
 * Maneja el proceso de registro de nuevos usuarios.
 * @param {Event} evento - El evento de envío del formulario.
 */
async function registrar(evento) {
    evento.preventDefault(); // Prevenir el envío por defecto del formulario HTML
    const formulario = document.getElementById('register-form');
    const datosFormulario = new FormData(formulario);
    const datosUsuario = Object.fromEntries(datosFormulario.entries());

    // Asignar rol por defecto (los registros desde aquí siempre son voluntarios)
    datosUsuario.rol = 'VOLUNTARIO';

    // Validar que la contraseña no esté vacía
    if (!datosUsuario.contrasena || datosUsuario.contrasena.trim() === '') {
        mostrarMensaje('register-message', 'La contraseña no puede estar vacía.', true);
        return;
    }

    ocultarMensajes('register-message'); // Limpiar mensaje previo

    try {
        const respuesta = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosUsuario)
        });

        // Intentar parsear la respuesta JSON, incluso si es un error, por si el backend envía un mensaje
        const datos = await respuesta.json().catch(() => ({ mensaje: respuesta.statusText || 'Error desconocido' }));

        if (respuesta.ok) { // Código de estado 200-299
            mostrarMensaje('register-message', '¡Registro exitoso! Ahora puedes iniciar sesión.', false);
            formulario.reset(); // Limpiar el formulario después del éxito
            mostrarIniciarSesion(); // Redirigir al usuario a la sección de login
        } else { // Código de estado 4xx o 5xx
            // Si el backend envía un mensaje de error en el JSON, usarlo
            mostrarMensaje('register-message', datos.mensaje || 'Error en el registro. Inténtalo de nuevo.', true);
        }
    } catch (error) {
        // Manejo de errores de red o JSON inválido
        mostrarMensaje('register-message', `Error de red: ${error.message}. Verifica tu conexión o el servidor.`, true);
        console.error("Error al registrar:", error);
    }
}

/**
 * Maneja el proceso de cierre de sesión.
 * Realiza un POST a la URL de logout de Spring Security.
 */
async function cerrarSesion() {
    try {
        // Si usas JWT, deberías eliminarlo de localStorage
        localStorage.removeItem('jwtToken');

        // Spring Security espera un POST a /logout para invalidar la sesión
        // Si usas JWT puro, este endpoint puede no ser necesario o tener otra lógica.
        const respuesta = await fetch('/logout', {
            method: 'POST',
            // Es buena práctica incluir el token CSRF si lo tienes habilitado en Spring Security
            // headers: { 'X-CSRF-TOKEN': obtenerCsrfToken() } // Implementar obtenerCsrfToken si es necesario
        });

        if (respuesta.ok) {
            // Logout exitoso, limpiar estado del frontend
            usuarioActual = null;
            actualizarNavegacion();
            // Redirigir para que Spring Security complete el proceso y limpie la sesión del navegador
            window.location.href = '/?logout';
        } else {
            console.error("Error al cerrar sesión:", respuesta.status, respuesta.statusText);
            // Usar mostrarMensaje o un modal personalizado en lugar de alert()
            alert('Error al cerrar sesión. Por favor, inténtalo de nuevo.');
        }
    } catch (error) {
        console.error("Error de red al cerrar sesión:", error);
        alert('Error de conexión al intentar cerrar sesión. Inténtalo más tarde.');
    }
}

// --- Vistas de Navegación ---

function mostrarIniciarSesion() {
    mostrarSeccion('login-section');
    ocultarMensajes('login-message');
}

function mostrarRegistrarse() {
    mostrarSeccion('register-section');
    ocultarMensajes('register-message');
    document.getElementById('register-form').reset(); // Limpiar formulario al mostrar
}

// --- Perfil de Usuario ---

/**
 * Muestra la sección del perfil del usuario y rellena el formulario con los datos del usuario actual.
 */
async function mostrarPerfil() {
    if (!usuarioActual) { mostrarIniciarSesion(); return; }
    mostrarSeccion('profile-section');
    // Rellenar formulario de perfil con los datos del usuario actual
    document.getElementById('profile-id').value = usuarioActual.id;
    document.getElementById('profile-username').value = usuarioActual.nombreUsuario;
    document.getElementById('profile-nombre').value = usuarioActual.nombre;
    document.getElementById('profile-apellido').value = usuarioActual.apellido;
    document.getElementById('profile-email').value = usuarioActual.email;
    document.getElementById('profile-telefono').value = usuarioActual.telefono || ''; // Manejar valor nulo
    document.getElementById('profile-rol').value = usuarioActual.rol;
    document.getElementById('profile-calificacion').value = usuarioActual.calificacion !== undefined ? usuarioActual.calificacion.toFixed(1) : 'N/A';
    document.getElementById('profile-activo').checked = usuarioActual.activo;

    // Limpiar mensajes y formulario de cambio de contraseña al mostrar el perfil
    ocultarMensajes('profile-message');
    ocultarMensajes('change-password-message');
    document.getElementById('change-password-form').reset();
}

/**
 * Actualiza la información del perfil del usuario.
 * @param {Event} evento - El evento de envío del formulario.
 */
async function actualizarPerfil(evento) {
    evento.preventDefault();
    if (!usuarioActual) { mostrarIniciarSesion(); return; }

    const datosPerfil = {
        id: usuarioActual.id,
        nombreUsuario: usuarioActual.nombreUsuario, // No se permite cambiar desde el frontend
        nombre: document.getElementById('profile-nombre').value.trim(),
        apellido: document.getElementById('profile-apellido').value.trim(),
        email: document.getElementById('profile-email').value.trim(),
        telefono: document.getElementById('profile-telefono').value.trim(),
        rol: usuarioActual.rol, // No se permite cambiar desde el frontend
        calificacion: usuarioActual.calificacion, // No se permite cambiar desde el frontend
        activo: usuarioActual.activo // No se permite cambiar desde el frontend
    };
    ocultarMensajes('profile-message');

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/usuarios/${usuarioActual.id}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(datosPerfil)
        });

        const datos = await respuesta.json().catch(() => ({ mensaje: respuesta.statusText || 'Error desconocido' }));

        if (respuesta.ok) {
            usuarioActual = datos; // Actualizar el objeto de usuario actual con los datos modificados del backend
            mostrarMensaje('profile-message', '¡Perfil actualizado exitosamente!', false);
            actualizarNavegacion(); // Para actualizar el nombre de usuario si se muestra en la navegación
            mostrarPerfil(); // Re-renderizar perfil con los nuevos datos (útil para campos disabled)
        } else {
            mostrarMensaje('profile-message', datos.mensaje || 'Error al actualizar el perfil.', true);
        }
    } catch (error) {
        mostrarMensaje('profile-message', `Error de red: ${error.message}`, true);
        console.error("Error al actualizar perfil:", error);
    }
}

/**
 * Cambia la contraseña del usuario.
 * @param {Event} evento - El evento de envío del formulario.
 */
async function cambiarContrasena(evento) {
    evento.preventDefault();
    if (!usuarioActual) { mostrarIniciarSesion(); return; }

    const contrasenaActual = document.getElementById('current-password').value;
    const nuevaContrasena = document.getElementById('new-password').value;
    const confirmarNuevaContrasena = document.getElementById('confirm-new-password').value;
    ocultarMensajes('change-password-message');

    if (nuevaContrasena !== confirmarNuevaContrasena) {
        mostrarMensaje('change-password-message', 'Las nuevas contraseñas no coinciden.', true);
        return;
    }
    if (nuevaContrasena.trim() === '' || contrasenaActual.trim() === '') {
        mostrarMensaje('change-password-message', 'Las contraseñas no pueden estar vacías.', true);
        return;
    }

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/auth/change-password`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                userId: usuarioActual.id, // ID del usuario logeado
                currentPassword: contrasenaActual,
                newPassword: nuevaContrasena
            })
        });

        const datos = await respuesta.json().catch(() => ({ mensaje: 'Respuesta inválida del servidor.' }));

        if (respuesta.ok) {
            mostrarMensaje('change-password-message', '¡Contraseña cambiada exitosamente!', false);
            document.getElementById('change-password-form').reset(); // Limpiar el formulario
        } else {
            mostrarMensaje('change-password-message', datos.mensaje || 'Error al cambiar la contraseña. Verifica tu contraseña actual.', true);
        }
    } catch (error) {
        mostrarMensaje('change-password-message', `Error de red: ${error.message}`, true);
        console.error("Error al cambiar contraseña:", error);
    }
}

// --- Campañas (para Voluntarios) ---

/**
 * Muestra la sección de campañas disponibles para voluntarios.
 * Carga las campañas desde el backend y las muestra en cards.
 */
async function mostrarCampanas() {
    if (!usuarioActual) { mostrarIniciarSesion(); return; }
    mostrarSeccion('campaigns-section');
    const listaCampanas = document.getElementById('campaigns-list');
    ocultarMensajes('campaigns-message');
    listaCampanas.innerHTML = '<p>Cargando campañas...</p>'; // Mensaje de carga inicial

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/campanas`, { headers });
        const datos = await respuesta.json().catch(() => ({ mensaje: 'Respuesta inválida del servidor al cargar campañas.' }));

        if (respuesta.ok) {
            if (datos.length === 0) {
                listaCampanas.innerHTML = '<p>No hay campañas disponibles en este momento.</p>';
            } else {
                listaCampanas.innerHTML = ''; // Limpiar contenido previo
                datos.forEach(campana => {
                    const divCampana = document.createElement('div');
                    divCampana.className = 'card'; // Clase CSS para el estilo de la tarjeta
                    divCampana.innerHTML = `
                        <h3>${campana.nombre}</h3>
                        <p>${campana.descripcion ? campana.descripcion.substring(0, 100) + '...' : 'Sin descripción'}</p>
                        <p><strong>Ubicación:</strong> ${campana.ubicacion}</p>
                        <p><strong>Fecha:</strong> ${campana.fechaInicio} al ${campana.fechaFin}</p>
                        <p><strong>Estado:</strong> ${campana.estado}</p>
                        <button onclick="mostrarDetallesCampana('${campana.id}', false)">Ver Detalles</button>
                    `;
                    listaCampanas.appendChild(divCampana);
                });
            }
        } else {
            mostrarMensaje('campaigns-message', datos.mensaje || 'Error al cargar campañas.', true);
        }
    } catch (error) {
        mostrarMensaje('campaigns-message', `Error de red: ${error.message}`, true);
        console.error("Error al cargar campañas:", error);
    }
}

/**
 * Muestra los detalles de una campaña en un modal.
 * @param {string} idCampana - El ID de la campaña a mostrar.
 * @param {boolean} esContextoAdmin - Indica si la vista se abre desde el contexto de administración.
 */
async function mostrarDetallesCampana(idCampana, esContextoAdmin) {
    if (!usuarioActual) { mostrarIniciarSesion(); return; }
    const modal = document.getElementById('campaign-details-modal');
    const titulo = document.getElementById('modal-campaign-title');
    const descripcion = document.getElementById('modal-campaign-description');
    const ubicacion = document.getElementById('modal-campaign-ubicacion');
    const fechaInicio = document.getElementById('modal-campaign-fechaInicio');
    const fechaFin = document.getElementById('modal-campaign-fechaFin');
    const estado = document.getElementById('modal-campaign-estado');
    const divEvidencias = document.getElementById('modal-campaign-evidences');
    const botonAccion = document.getElementById('modal-campaign-action-button');
    ocultarMensajes('modal-action-message'); // Limpiar mensaje previo

    // Limpiar y resetear el contenido del modal
    titulo.textContent = 'Cargando...';
    descripcion.textContent = '';
    ubicacion.textContent = '';
    fechaInicio.textContent = '';
    fechaFin.textContent = '';
    estado.textContent = '';
    divEvidencias.innerHTML = '';
    botonAccion.style.display = 'none';

    mostrarModal('campaign-details-modal'); // Mostrar el modal

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/campanas/${idCampana}`, { headers });
        const campana = await respuesta.json().catch(() => ({ mensaje: 'Respuesta inválida del servidor al cargar detalles de campaña.' }));

        if (respuesta.ok) {
            // Rellenar el modal con los datos de la campaña
            titulo.textContent = campana.nombre;
            descripcion.textContent = campana.descripcion;
            ubicacion.textContent = campana.ubicacion;
            fechaInicio.textContent = campana.fechaInicio; // Asume que el formato es legible
            fechaFin.textContent = campana.fechaFin;     // Asume que el formato es legible
            estado.textContent = campana.estado;

            // Placeholder para evidencias (si se implementa en el futuro)
            divEvidencias.innerHTML = '<p>No hay evidencias para esta campaña.</p>';

            // Lógica para el botón de inscripción/anulación (solo para voluntarios y fuera del contexto admin)
            if (!esContextoAdmin && usuarioActual.rol === 'VOLUNTARIO') {
                const respuestaInscripcion = await fetch(`${API_BASE_URL}/campanas/${campana.id}/inscrito/${usuarioActual.id}`);
                let estaInscrito = false;
                if (respuestaInscripcion.ok) {
                    estaInscrito = await respuestaInscripcion.json();
                } else {
                    console.warn(`No se pudo verificar la inscripción para campaña ${campana.id}:`, respuestaInscripcion.status);
                }

                botonAccion.style.display = 'block';
                if (estaInscrito) {
                    botonAccion.textContent = 'Anular Inscripción';
                    botonAccion.onclick = () => anularInscripcion(campana.id);
                } else {
                    botonAccion.textContent = 'Inscribirse';
                    botonAccion.onclick = () => inscribirseCampana(campana.id);
                }
            } else {
                botonAccion.style.display = 'none'; // No mostrar el botón para admin o si no es voluntario
            }
        } else {
            mostrarMensaje('modal-action-message', campana.mensaje || 'Error al cargar detalles de la campaña.', true);
        }
    } catch (error) {
        mostrarMensaje('modal-action-message', `Error de red: ${error.message}`, true);
        console.error("Error al mostrar detalles de campaña:", error);
    }
}

/**
 * Inscribe al usuario actual (voluntario) en una campaña.
 * @param {string} idCampana - El ID de la campaña.
 */
async function inscribirseCampana(idCampana) {
    if (!usuarioActual || usuarioActual.rol !== 'VOLUNTARIO') {
        mostrarMensaje('modal-action-message', 'Debes ser un voluntario para inscribirte.', true);
        return;
    }
    mostrarMensaje('modal-action-message', 'Inscribiendo...');

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/campanas/${idCampana}/inscribir/${usuarioActual.id}`, {
            method: 'POST',
            headers: headers
        });

        const datos = await respuesta.json().catch(() => ({ mensaje: respuesta.statusText || 'Respuesta inválida del servidor.' }));

        if (respuesta.ok) {
            mostrarMensaje('modal-action-message', '¡Inscripción exitosa!', false);
            // Actualizar el botón a "Anular Inscripción"
            const botonAccion = document.getElementById('modal-campaign-action-button');
            botonAccion.textContent = 'Anular Inscripción';
            botonAccion.onclick = () => anularInscripcion(campana.id);
            // Recargar la lista de campañas si la sección está visible
            if (document.getElementById('campaigns-section').style.display === 'block') {
                mostrarCampanas();
            }
        } else {
            mostrarMensaje('modal-action-message', datos.mensaje || 'Error al inscribirse.', true);
        }
    } catch (error) {
        mostrarMensaje('modal-action-message', `Error de red: ${error.message}`, true);
        console.error("Error al inscribirse en campaña:", error);
    }
}

/**
 * Anula la inscripción del usuario actual (voluntario) en una campaña.
 * @param {string} idCampana - El ID de la campaña.
 */
async function anularInscripcion(idCampana) {
    if (!usuarioActual || usuarioActual.rol !== 'VOLUNTARIO') {
        mostrarMensaje('modal-action-message', 'Debes ser un voluntario para anular inscripción.', true);
        return;
    }
    mostrarMensaje('modal-action-message', 'Anulando inscripción...');

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/campanas/${idCampana}/anular/${usuarioActual.id}`, {
            method: 'DELETE',
            headers: headers
        });

        const datos = await respuesta.json().catch(() => ({ mensaje: respuesta.statusText || 'Respuesta inválida del servidor.' }));

        if (respuesta.ok) {
            mostrarMensaje('modal-action-message', '¡Inscripción anulada exitosamente!', false);
            // Actualizar el botón a "Inscribirse"
            const botonAccion = document.getElementById('modal-campaign-action-button');
            botonAccion.textContent = 'Inscribirse';
            botonAccion.onclick = () => inscribirseCampana(idCampana);
            // Recargar la lista de campañas si la sección está visible
            if (document.getElementById('campaigns-section').style.display === 'block') {
                mostrarCampanas();
            }
        } else {
            mostrarMensaje('modal-action-message', datos.mensaje || 'Error al anular inscripción.', true);
        }
    } catch (error) {
        mostrarMensaje('modal-action-message', `Error de red: ${error.message}`, true);
        console.error("Error al anular inscripción:", error);
    }
}


// --- Gestión de Campañas (para Administradores) ---

/**
 * Muestra la sección de gestión de campañas para administradores.
 * Carga todas las campañas desde el backend y las muestra con opciones de edición/eliminación.
 */
async function mostrarGestionCampanasAdmin() {
    if (!usuarioActual || usuarioActual.rol !== 'ADMIN') { mostrarIniciarSesion(); return; }
    mostrarSeccion('admin-campaigns-section');
    const listaCampanas = document.getElementById('admin-campaigns-list');
    ocultarMensajes('admin-campaigns-message');
    listaCampanas.innerHTML = '<p>Cargando campañas para administración...</p>';

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/campanas`, { headers }); // Asume que un admin puede ver todas las campañas
        const datos = await respuesta.json().catch(() => ({ mensaje: 'Respuesta inválida del servidor al cargar campañas para admin.' }));

        if (respuesta.ok) {
            if (datos.length === 0) {
                listaCampanas.innerHTML = '<p>No hay campañas para gestionar.</p>';
            } else {
                listaCampanas.innerHTML = '';
                datos.forEach(campana => {
                    const divCampana = document.createElement('div');
                    divCampana.className = 'card'; // Clase CSS para el estilo de la tarjeta
                    divCampana.innerHTML = `
                        <h3>${campana.nombre}</h3>
                        <p>${campana.descripcion ? campana.descripcion.substring(0, 100) + '...' : 'Sin descripción'}</p>
                        <p><strong>Ubicación:</strong> ${campana.ubicacion}</p>
                        <p><strong>Fecha:</strong> ${campana.fechaInicio} al ${campana.fechaFin}</p>
                        <p><strong>Estado:</strong> ${campana.estado}</p>
                        <button onclick="editarCampana('${campana.id}')">Editar</button>
                        <button onclick="eliminarCampana('${campana.id}')" class="delete-button">Eliminar</button>
                    `;
                    listaCampanas.appendChild(divCampana);
                });
            }
        } else {
            mostrarMensaje('admin-campaigns-message', datos.mensaje || 'Error al cargar campañas para admin.', true);
        }
    } catch (error) {
        mostrarMensaje('admin-campaigns-message', `Error de red: ${error.message}`, true);
        console.error("Error al cargar campañas para admin:", error);
    }
}

/**
 * Muestra el formulario modal para crear una nueva campaña.
 * Resetea el formulario y configura el botón para la acción de creación.
 */
function mostrarFormularioCrearCampana() {
    const formulario = document.getElementById('campaign-admin-form');
    formulario.reset(); // Limpiar el formulario
    document.getElementById('campaign-form-title').textContent = 'Crear Nueva Campaña';
    document.getElementById('campaign-form-submit-button').textContent = 'Crear Campaña';
    document.getElementById('campaign-form-submit-button').onclick = crearCampana; // Asignar la función de creación
    document.getElementById('campaign-form-submit-button').dataset.mode = 'create'; // Establecer el modo
    document.getElementById('admin-campaign-id').value = ''; // Asegurar que no hay ID (para creación)
    document.getElementById('admin-campaign-estado').value = 'PLANIFICADA'; // Establecer estado por defecto
    ocultarMensajes('campaign-form-message');
    mostrarModal('campaign-form-modal');
}

/**
 * Función auxiliar para formatear una fecha de 'YYYY-MM-DD' (del input date) a 'DD/MM/YYYY' (para el backend).
 * @param {string} dateString - La fecha en formato 'YYYY-MM-DD'.
 * @returns {string|null} La fecha formateada o null si es inválida.
 */
function formatDateToDDMMYYYY(dateString) {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

/**
 * Función auxiliar para formatear una fecha de 'DD/MM/YYYY' (del backend) a 'YYYY-MM-DD' (para el input date).
 * También maneja el caso en que la fecha ya esté en```javascript
// app.js
// Archivo JavaScript principal para la aplicación de Gestión de Campañas de Limpieza

// URL base de la API de tu backend Spring Boot
const API_BASE_URL = 'http://localhost:8080/api';
// Variable global para almacenar los datos del usuario autenticado
let usuarioActual = null;

// --- Funciones de Utilidad ---

/**
 * Muestra una sección específica de la interfaz de usuario y oculta todas las demás.
 * @param {string} idSeccion - El ID de la sección HTML a mostrar.
 */
function mostrarSeccion(idSeccion) {
    // Oculta todas las secciones dentro del elemento 'main'
    document.querySelectorAll('main section').forEach(seccion => {
        seccion.style.display = 'none';
    });
    // Muestra la sección con el ID especificado
    document.getElementById(idSeccion).style.display = 'block';
}

/**
 * Actualiza la visibilidad de los elementos de navegación según el estado de autenticación
 * y el rol del usuario.
 */
function actualizarNavegacion() {
    // Obtener referencias a todos los elementos de navegación
    const navIniciarSesion = document.getElementById('nav-login');
    const navRegistrarse = document.getElementById('nav-register');
    const navMiPerfil = document.getElementById('nav-profile');
    const navCampanas = document.getElementById('nav-campaigns');
    const navGestionCampanasAdmin = document.getElementById('nav-admin-campaigns');
    const navVoluntariosAdmin = document.getElementById('nav-volunteers');
    const navReportesAdmin = document.getElementById('nav-reports-admin'); // ID corregido
    const navCalendario = document.getElementById('nav-calendar');
    const navNotificaciones = document.getElementById('nav-notifications');
    const navCerrarSesion = document.getElementById('nav-logout');
    const infoUsuarioSpan = document.getElementById('user-info'); // Para mostrar el nombre de usuario

    if (usuarioActual) {
        // Usuario autenticado: Ocultar opciones de no logeado, mostrar opciones de logeado
        navIniciarSesion.style.display = 'none';
        navRegistrarse.style.display = 'none';

        navMiPerfil.style.display = 'block';
        navCampanas.style.display = 'block';
        navCalendario.style.display = 'block';
        navNotificaciones.style.display = 'block';
        navCerrarSesion.style.display = 'block';
        infoUsuarioSpan.textContent = `Bienvenido, ${usuarioActual.nombreUsuario}`;

        // Opciones específicas para el rol de ADMINISTRADOR
        if (usuarioActual.rol === 'ADMIN') {
            navGestionCampanasAdmin.style.display = 'block';
            navVoluntariosAdmin.style.display = 'block';
            navReportesAdmin.style.display = 'block'; // Mostrar opción de reportes para Admin
        } else {
            // Ocultar opciones de admin para otros roles
            navGestionCampanasAdmin.style.display = 'none';
            navVoluntariosAdmin.style.display = 'none';
            navReportesAdmin.style.display = 'none';
        }
    } else {
        // Usuario no autenticado: Mostrar opciones de no logeado, ocultar todas las demás
        navIniciarSesion.style.display = 'block';
        navRegistrarse.style.display = 'block';

        navMiPerfil.style.display = 'none';
        navCampanas.style.display = 'none';
        navGestionCampanasAdmin.style.display = 'none';
        navVoluntariosAdmin.style.display = 'none';
        navReportesAdmin.style.display = 'none';
        navCalendario.style.display = 'none';
        navNotificaciones.style.display = 'none';
        navCerrarSesion.style.display = 'none';
        infoUsuarioSpan.textContent = ''; // Limpiar información de usuario
        mostrarIniciarSesion(); // Por defecto, si no hay usuario, mostrar la sección de login
    }
}

/**
 * Muestra un mensaje de retroalimentación al usuario en un elemento HTML específico.
 * @param {string} idElemento - El ID del elemento HTML donde se mostrará el mensaje.
 * @param {string} mensaje - El texto del mensaje a mostrar.
 * @param {boolean} esError - True si el mensaje es un error (para aplicar estilos de error).
 */
function mostrarMensaje(idElemento, mensaje, esError = false) {
    const elemento = document.getElementById(idElemento);
    if (!elemento) {
        console.error(`Elemento con ID '${idElemento}' no encontrado para mostrar mensaje.`);
        return;
    }
    elemento.textContent = mensaje; // Establecer el texto del mensaje
    elemento.className = esError ? 'message error' : 'message success'; // Aplicar clase CSS para estilo
    elemento.style.display = 'block'; // Asegurarse de que el mensaje sea visible
    // Opcional: ocultar el mensaje después de X segundos (descomentar si se desea)
    // setTimeout(() => { elemento.style.display = 'none'; }, 5000);
}

/**
 * Oculta un mensaje de retroalimentación en un elemento HTML específico.
 * @param {string} idElemento - El ID del elemento HTML cuyo mensaje se ocultará.
 */
function ocultarMensajes(idElemento) {
    const elemento = document.getElementById(idElemento);
    if (elemento) {
        elemento.textContent = ''; // Limpiar el texto
        elemento.style.display = 'none'; // Ocultar el elemento
    }
}

/**
 * Muestra un modal (elemento con display: none por defecto).
 * @param {string} idModal - El ID del modal a mostrar.
 */
function mostrarModal(idModal) {
    document.getElementById(idModal).style.display = 'block';
}

/**
 * Cierra un modal y limpia los mensajes asociados.
 * @param {string} idModal - El ID del modal a cerrar.
 */
function cerrarModal(idModal) {
    document.getElementById(idModal).style.display = 'none';
    // Limpiar mensajes específicos de modales al cerrarlos
    ocultarMensajes('modal-action-message');
    ocultarMensajes('campaign-form-message');
}

// --- Autenticación y Estado de la Sesión ---

/**
 * Función auxiliar para manejar el éxito del login, guardando el token y actualizando la UI.
 * @param {object} userData - Los datos del usuario (incluyendo el token JWT si aplica).
 */
function handleLoginSuccess(userData) {
    // Si el backend devuelve un token JWT, guárdalo
    if (userData.jwtToken) {
        localStorage.setItem('jwtToken', userData.jwtToken);
    }
    // Guarda los datos del usuario (sin el token si no quieres que esté en usuarioActual)
    usuarioActual = { ...userData }; // Copia los datos del usuario
    delete usuarioActual.jwtToken; // Elimina el token del objeto usuarioActual si lo tenía

    actualizarNavegacion();
    // Redirigir al perfil o a la sección principal tras un login exitoso
    mostrarPerfil(); // O podrías mostrarCampanas()
    // Limpiar los parámetros de la URL una vez procesados
    history.replaceState({}, document.title, window.location.pathname);
}

/**
 * Verifica el estado de autenticación del usuario al cargar la página o después de acciones de login/logout.
 * Realiza una petición a un endpoint protegido para obtener los datos del usuario autenticado.
 */
async function verificarEstadoAutenticacion() {
    try {
        ocultarMensajes('login-message'); // Limpiar mensajes de login previos

        // Verificar si hay parámetros de URL de Spring Security (ej. ?error o ?logout)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('error')) {
            mostrarMensaje('login-message', 'Credenciales inválidas. Por favor, inténtalo de nuevo.', true);
        } else if (urlParams.has('logout')) {
            mostrarMensaje('login-message', 'Has cerrado sesión exitosamente.', false);
        }

        // Si usas JWT y lo tienes en localStorage, verifica si es válido
        const token = localStorage.getItem('jwtToken');
        if (token) {
            // Realizar una petición a un endpoint protegido (ej. /api/usuarios/me)
            // para obtener los datos del usuario autenticado y validar el token.
            const respuesta = await fetch(`${API_BASE_URL}/usuarios/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (respuesta.ok) {
                // Token válido y usuario autenticado: obtener sus detalles y actualizar la UI
                const userData = await respuesta.json();
                handleLoginSuccess({ ...userData, jwtToken: token }); // Re-añadir token si lo necesitas en handleLoginSuccess
            } else {
                // Token inválido o expirado: limpiar token y estado, mostrar login
                localStorage.removeItem('jwtToken'); // Eliminar token inválido
                usuarioActual = null;
                actualizarNavegacion();
                mostrarIniciarSesion();
            }
        } else {
            // No hay token en localStorage: no autenticado
            usuarioActual = null;
            actualizarNavegacion();
            mostrarIniciarSesion();
        }
    } catch (error) {
        console.error("Error al verificar estado de autenticación:", error);
        localStorage.removeItem('jwtToken'); // En caso de error de red, limpiar token por si acaso
        usuarioActual = null;
        actualizarNavegacion();
        mostrarMensaje('login-message', 'Error de conexión con el servidor. Inténtalo más tarde.', true);
        mostrarIniciarSesion();
    }
}

/**
 * Maneja el proceso de inicio de sesión.
 * Envía las credenciales al backend y guarda el token JWT si la autenticación es exitosa.
 * @param {Event} evento - El evento de envío del formulario.
 */
async function iniciarSesion(evento) {
    evento.preventDefault(); // Prevenir el envío por defecto del formulario HTML
    const formulario = document.getElementById('login-form');
    const datosFormulario = new FormData(formulario);
    const credenciales = Object.fromEntries(datosFormulario.entries());

    ocultarMensajes('login-message'); // Limpiar mensaje previo

    try {
        // Realizar la petición POST al endpoint de login de tu backend
        // Asume que tu backend tiene un endpoint como /api/auth/login que devuelve un JWT
        const respuesta = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credenciales)
        });

        // Intentar parsear la respuesta JSON, incluso si es un error, por si el backend envía un mensaje
        const datos = await respuesta.json().catch(() => ({ message: respuesta.statusText || 'Error desconocido' }));

        if (respuesta.ok) { // Código de estado 200-299
            // Si el login es exitoso, los datos deberían contener el token JWT y la información del usuario
            handleLoginSuccess(datos); // Llama a la función para guardar token y actualizar UI
            mostrarMensaje('login-message', '¡Inicio de sesión exitoso!', false);
        } else { // Código de estado 4xx o 5xx
            // Si el backend envía un mensaje de error en el JSON, usarlo
            mostrarMensaje('login-message', datos.message || 'Credenciales inválidas. Inténtalo de nuevo.', true);
        }
    } catch (error) {
        // Manejo de errores de red o JSON inválido
        mostrarMensaje('login-message', `Error de red: ${error.message}. Verifica tu conexión o el servidor.`, true);
    }
}


/**
 * Maneja el proceso de registro de nuevos usuarios.
 * @param {Event} evento - El evento de envío del formulario.
 */
async function registrar(evento) {
    evento.preventDefault(); // Prevenir el envío por defecto del formulario HTML
    const formulario = document.getElementById('register-form');
    const datosFormulario = new FormData(formulario);
    const datosUsuario = Object.fromEntries(datosFormulario.entries());

    // Asignar rol por defecto (los registros desde aquí siempre son voluntarios)
    datosUsuario.rol = 'VOLUNTARIO';

    // Validar que la contraseña no esté vacía
    if (!datosUsuario.contrasena || datosUsuario.contrasena.trim() === '') {
        mostrarMensaje('register-message', 'La contraseña no puede estar vacía.', true);
        return;
    }

    ocultarMensajes('register-message'); // Limpiar mensaje previo

    try {
        const respuesta = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosUsuario)
        });

        // Intentar parsear la respuesta JSON, incluso si es un error, por si el backend envía un mensaje
        const datos = await respuesta.json().catch(() => ({ mensaje: respuesta.statusText || 'Error desconocido' }));

        if (respuesta.ok) { // Código de estado 200-299
            mostrarMensaje('register-message', '¡Registro exitoso! Ahora puedes iniciar sesión.', false);
            formulario.reset(); // Limpiar el formulario después del éxito
            mostrarIniciarSesion(); // Redirigir al usuario a la sección de login
        } else { // Código de estado 4xx o 5xx
            // Si el backend envía un mensaje de error en el JSON, usarlo
            mostrarMensaje('register-message', datos.mensaje || 'Error en el registro. Inténtalo de nuevo.', true);
        }
    } catch (error) {
        // Manejo de errores de red o JSON inválido
        mostrarMensaje('register-message', `Error de red: ${error.message}. Verifica tu conexión o el servidor.`, true);
        console.error("Error al registrar:", error);
    }
}

/**
 * Maneja el proceso de cierre de sesión.
 * Realiza un POST a la URL de logout de Spring Security.
 */
async function cerrarSesion() {
    try {
        // Si usas JWT, deberías eliminarlo de localStorage
        localStorage.removeItem('jwtToken');

        // Spring Security espera un POST a /logout para invalidar la sesión
        // Si usas JWT puro, este endpoint puede no ser necesario o tener otra lógica.
        const respuesta = await fetch('/logout', {
            method: 'POST',
            // Es buena práctica incluir el token CSRF si lo tienes habilitado en Spring Security
            // headers: { 'X-CSRF-TOKEN': obtenerCsrfToken() } // Implementar obtenerCsrfToken si es necesario
        });

        if (respuesta.ok) {
            // Logout exitoso, limpiar estado del frontend
            usuarioActual = null;
            actualizarNavegacion();
            // Redirigir para que Spring Security complete el proceso y limpie la sesión del navegador
            window.location.href = '/?logout';
        } else {
            console.error("Error al cerrar sesión:", respuesta.status, respuesta.statusText);
            // Usar mostrarMensaje o un modal personalizado en lugar de alert()
            alert('Error al cerrar sesión. Por favor, inténtalo de nuevo.');
        }
    } catch (error) {
        console.error("Error de red al cerrar sesión:", error);
        alert('Error de conexión al intentar cerrar sesión. Inténtalo más tarde.');
    }
}

// --- Vistas de Navegación ---

function mostrarIniciarSesion() {
    mostrarSeccion('login-section');
    ocultarMensajes('login-message');
}

function mostrarRegistrarse() {
    mostrarSeccion('register-section');
    ocultarMensajes('register-message');
    document.getElementById('register-form').reset(); // Limpiar formulario al mostrar
}

// --- Perfil de Usuario ---

/**
 * Muestra la sección del perfil del usuario y rellena el formulario con los datos del usuario actual.
 */
async function mostrarPerfil() {
    if (!usuarioActual) { mostrarIniciarSesion(); return; }
    mostrarSeccion('profile-section');
    // Rellenar formulario de perfil con los datos del usuario actual
    document.getElementById('profile-id').value = usuarioActual.id;
    document.getElementById('profile-username').value = usuarioActual.nombreUsuario;
    document.getElementById('profile-nombre').value = usuarioActual.nombre;
    document.getElementById('profile-apellido').value = usuarioActual.apellido;
    document.getElementById('profile-email').value = usuarioActual.email;
    document.getElementById('profile-telefono').value = usuarioActual.telefono || ''; // Manejar valor nulo
    document.getElementById('profile-rol').value = usuarioActual.rol;
    document.getElementById('profile-calificacion').value = usuarioActual.calificacion !== undefined ? usuarioActual.calificacion.toFixed(1) : 'N/A';
    document.getElementById('profile-activo').checked = usuarioActual.activo;

    // Limpiar mensajes y formulario de cambio de contraseña al mostrar el perfil
    ocultarMensajes('profile-message');
    ocultarMensajes('change-password-message');
    document.getElementById('change-password-form').reset();
}

/**
 * Actualiza la información del perfil del usuario.
 * @param {Event} evento - El evento de envío del formulario.
 */
async function actualizarPerfil(evento) {
    evento.preventDefault();
    if (!usuarioActual) { mostrarIniciarSesion(); return; }

    const datosPerfil = {
        id: usuarioActual.id,
        nombreUsuario: usuarioActual.nombreUsuario, // No se permite cambiar desde el frontend
        nombre: document.getElementById('profile-nombre').value.trim(),
        apellido: document.getElementById('profile-apellido').value.trim(),
        email: document.getElementById('profile-email').value.trim(),
        telefono: document.getElementById('profile-telefono').value.trim(),
        rol: usuarioActual.rol, // No se permite cambiar desde el frontend
        calificacion: usuarioActual.calificacion, // No se permite cambiar desde el frontend
        activo: usuarioActual.activo // No se permite cambiar desde el frontend
    };
    ocultarMensajes('profile-message');

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/usuarios/${usuarioActual.id}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(datosPerfil)
        });

        const datos = await respuesta.json().catch(() => ({ mensaje: respuesta.statusText || 'Error desconocido' }));

        if (respuesta.ok) {
            usuarioActual = datos; // Actualizar el objeto de usuario actual con los datos modificados del backend
            mostrarMensaje('profile-message', '¡Perfil actualizado exitosamente!', false);
            actualizarNavegacion(); // Para actualizar el nombre de usuario si se muestra en la navegación
            mostrarPerfil(); // Re-renderizar perfil con los nuevos datos (útil para campos disabled)
        } else {
            mostrarMensaje('profile-message', datos.mensaje || 'Error al actualizar el perfil.', true);
        }
    } catch (error) {
        mostrarMensaje('profile-message', `Error de red: ${error.message}`, true);
        console.error("Error al actualizar perfil:", error);
    }
}

/**
 * Cambia la contraseña del usuario.
 * @param {Event} evento - El evento de envío del formulario.
 */
async function cambiarContrasena(evento) {
    evento.preventDefault();
    if (!usuarioActual) { mostrarIniciarSesion(); return; }

    const contrasenaActual = document.getElementById('current-password').value;
    const nuevaContrasena = document.getElementById('new-password').value;
    const confirmarNuevaContrasena = document.getElementById('confirm-new-password').value;
    ocultarMensajes('change-password-message');

    if (nuevaContrasena !== confirmarNuevaContrasena) {
        mostrarMensaje('change-password-message', 'Las nuevas contraseñas no coinciden.', true);
        return;
    }
    if (nuevaContrasena.trim() === '' || contrasenaActual.trim() === '') {
        mostrarMensaje('change-password-message', 'Las contraseñas no pueden estar vacías.', true);
        return;
    }

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/auth/change-password`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                userId: usuarioActual.id, // ID del usuario logeado
                currentPassword: contrasenaActual,
                newPassword: nuevaContrasena
            })
        });

        const datos = await respuesta.json().catch(() => ({ mensaje: 'Respuesta inválida del servidor.' }));

        if (respuesta.ok) {
            mostrarMensaje('change-password-message', '¡Contraseña cambiada exitosamente!', false);
            document.getElementById('change-password-form').reset(); // Limpiar el formulario
        } else {
            mostrarMensaje('change-password-message', datos.mensaje || 'Error al cambiar la contraseña. Verifica tu contraseña actual.', true);
        }
    } catch (error) {
        mostrarMensaje('change-password-message', `Error de red: ${error.message}`, true);
        console.error("Error al cambiar contraseña:", error);
    }
}

// --- Campañas (para Voluntarios) ---

/**
 * Muestra la sección de campañas disponibles para voluntarios.
 * Carga las campañas desde el backend y las muestra en cards.
 */
async function mostrarCampanas() {
    if (!usuarioActual) { mostrarIniciarSesion(); return; }
    mostrarSeccion('campaigns-section');
    const listaCampanas = document.getElementById('campaigns-list');
    ocultarMensajes('campaigns-message');
    listaCampanas.innerHTML = '<p>Cargando campañas...</p>'; // Mensaje de carga inicial

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/campanas`, { headers });
        const datos = await respuesta.json().catch(() => ({ mensaje: 'Respuesta inválida del servidor al cargar campañas.' }));

        if (respuesta.ok) {
            if (datos.length === 0) {
                listaCampanas.innerHTML = '<p>No hay campañas disponibles en este momento.</p>';
            } else {
                listaCampanas.innerHTML = ''; // Limpiar contenido previo
                datos.forEach(campana => {
                    const divCampana = document.createElement('div');
                    divCampana.className = 'card'; // Clase CSS para el estilo de la tarjeta
                    divCampana.innerHTML = `
                        <h3>${campana.nombre}</h3>
                        <p>${campana.descripcion ? campana.descripcion.substring(0, 100) + '...' : 'Sin descripción'}</p>
                        <p><strong>Ubicación:</strong> ${campana.ubicacion}</p>
                        <p><strong>Fecha:</strong> ${campana.fechaInicio} al ${campana.fechaFin}</p>
                        <p><strong>Estado:</strong> ${campana.estado}</p>
                        <button onclick="mostrarDetallesCampana('${campana.id}', false)">Ver Detalles</button>
                    `;
                    listaCampanas.appendChild(divCampana);
                });
            }
        } else {
            mostrarMensaje('campaigns-message', datos.mensaje || 'Error al cargar campañas.', true);
        }
    } catch (error) {
        mostrarMensaje('campaigns-message', `Error de red: ${error.message}`, true);
        console.error("Error al cargar campañas:", error);
    }
}

/**
 * Muestra los detalles de una campaña en un modal.
 * @param {string} idCampana - El ID de la campaña a mostrar.
 * @param {boolean} esContextoAdmin - Indica si la vista se abre desde el contexto de administración.
 */
async function mostrarDetallesCampana(idCampana, esContextoAdmin) {
    if (!usuarioActual) { mostrarIniciarSesion(); return; }
    const modal = document.getElementById('campaign-details-modal');
    const titulo = document.getElementById('modal-campaign-title');
    const descripcion = document.getElementById('modal-campaign-description');
    const ubicacion = document.getElementById('modal-campaign-ubicacion');
    const fechaInicio = document.getElementById('modal-campaign-fechaInicio');
    const fechaFin = document.getElementById('modal-campaign-fechaFin');
    const estado = document.getElementById('modal-campaign-estado');
    const divEvidencias = document.getElementById('modal-campaign-evidences');
    const botonAccion = document.getElementById('modal-campaign-action-button');
    ocultarMensajes('modal-action-message'); // Limpiar mensaje previo

    // Limpiar y resetear el contenido del modal
    titulo.textContent = 'Cargando...';
    descripcion.textContent = '';
    ubicacion.textContent = '';
    fechaInicio.textContent = '';
    fechaFin.textContent = '';
    estado.textContent = '';
    divEvidencias.innerHTML = '';
    botonAccion.style.display = 'none';

    mostrarModal('campaign-details-modal'); // Mostrar el modal

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/campanas/${idCampana}`, { headers });
        const campana = await respuesta.json().catch(() => ({ mensaje: 'Respuesta inválida del servidor al cargar detalles de campaña.' }));

        if (respuesta.ok) {
            // Rellenar el modal con los datos de la campaña
            titulo.textContent = campana.nombre;
            descripcion.textContent = campana.descripcion;
            ubicacion.textContent = campana.ubicacion;
            fechaInicio.textContent = campana.fechaInicio; // Asume que el formato es legible
            fechaFin.textContent = campana.fechaFin;     // Asume que el formato es legible
            estado.textContent = campana.estado;

            // Placeholder para evidencias (si se implementa en el futuro)
            divEvidencias.innerHTML = '<p>No hay evidencias para esta campaña.</p>';

            // Lógica para el botón de inscripción/anulación (solo para voluntarios y fuera del contexto admin)
            if (!esContextoAdmin && usuarioActual.rol === 'VOLUNTARIO') {
                const respuestaInscripcion = await fetch(`${API_BASE_URL}/campanas/${campana.id}/inscrito/${usuarioActual.id}`);
                let estaInscrito = false;
                if (respuestaInscripcion.ok) {
                    estaInscrito = await respuestaInscripcion.json();
                } else {
                    console.warn(`No se pudo verificar la inscripción para campaña ${campana.id}:`, respuestaInscripcion.status);
                }

                botonAccion.style.display = 'block';
                if (estaInscrito) {
                    botonAccion.textContent = 'Anular Inscripción';
                    botonAccion.onclick = () => anularInscripcion(campana.id);
                } else {
                    botonAccion.textContent = 'Inscribirse';
                    botonAccion.onclick = () => inscribirseCampana(campana.id);
                }
            } else {
                botonAccion.style.display = 'none'; // No mostrar el botón para admin o si no es voluntario
            }
        } else {
            mostrarMensaje('modal-action-message', campana.mensaje || 'Error al cargar detalles de la campaña.', true);
        }
    } catch (error) {
        mostrarMensaje('modal-action-message', `Error de red: ${error.message}`, true);
        console.error("Error al mostrar detalles de campaña:", error);
    }
}

/**
 * Inscribe al usuario actual (voluntario) en una campaña.
 * @param {string} idCampana - El ID de la campaña.
 */
async function inscribirseCampana(idCampana) {
    if (!usuarioActual || usuarioActual.rol !== 'VOLUNTARIO') {
        mostrarMensaje('modal-action-message', 'Debes ser un voluntario para inscribirte.', true);
        return;
    }
    mostrarMensaje('modal-action-message', 'Inscribiendo...');

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/campanas/${idCampana}/inscribir/${usuarioActual.id}`, {
            method: 'POST',
            headers: headers
        });

        const datos = await respuesta.json().catch(() => ({ mensaje: respuesta.statusText || 'Respuesta inválida del servidor.' }));

        if (respuesta.ok) {
            mostrarMensaje('modal-action-message', '¡Inscripción exitosa!', false);
            // Actualizar el botón a "Anular Inscripción"
            const botonAccion = document.getElementById('modal-campaign-action-button');
            botonAccion.textContent = 'Anular Inscripción';
            botonAccion.onclick = () => anularInscripcion(campana.id);
            // Recargar la lista de campañas si la sección está visible
            if (document.getElementById('campaigns-section').style.display === 'block') {
                mostrarCampanas();
            }
        } else {
            mostrarMensaje('modal-action-message', datos.mensaje || 'Error al inscribirse.', true);
        }
    } catch (error) {
        mostrarMensaje('modal-action-message', `Error de red: ${error.message}`, true);
        console.error("Error al inscribirse en campaña:", error);
    }
}

/**
 * Anula la inscripción del usuario actual (voluntario) en una campaña.
 * @param {string} idCampana - El ID de la campaña.
 */
async function anularInscripcion(idCampana) {
    if (!usuarioActual || usuarioActual.rol !== 'VOLUNTARIO') {
        mostrarMensaje('modal-action-message', 'Debes ser un voluntario para anular inscripción.', true);
        return;
    }
    mostrarMensaje('modal-action-message', 'Anulando inscripción...');

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/campanas/${idCampana}/anular/${usuarioActual.id}`, {
            method: 'DELETE',
            headers: headers
        });

        const datos = await respuesta.json().catch(() => ({ mensaje: respuesta.statusText || 'Respuesta inválida del servidor.' }));

        if (respuesta.ok) {
            mostrarMensaje('modal-action-message', '¡Inscripción anulada exitosamente!', false);
            // Actualizar el botón a "Inscribirse"
            const botonAccion = document.getElementById('modal-campaign-action-button');
            botonAccion.textContent = 'Inscribirse';
            botonAccion.onclick = () => inscribirseCampana(idCampana);
            // Recargar la lista de campañas si la sección está visible
            if (document.getElementById('campaigns-section').style.display === 'block') {
                mostrarCampanas();
            }
        } else {
            mostrarMensaje('modal-action-message', datos.mensaje || 'Error al anular inscripción.', true);
        }
    } catch (error) {
        mostrarMensaje('modal-action-message', `Error de red: ${error.message}`, true);
        console.error("Error al anular inscripción:", error);
    }
}


// --- Gestión de Campañas (para Administradores) ---

/**
 * Muestra la sección de gestión de campañas para administradores.
 * Carga todas las campañas desde el backend y las muestra con opciones de edición/eliminación.
 */
async function mostrarGestionCampanasAdmin() {
    if (!usuarioActual || usuarioActual.rol !== 'ADMIN') { mostrarIniciarSesion(); return; }
    mostrarSeccion('admin-campaigns-section');
    const listaCampanas = document.getElementById('admin-campaigns-list');
    ocultarMensajes('admin-campaigns-message');
    listaCampanas.innerHTML = '<p>Cargando campañas para administración...</p>';

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/campanas`, { headers }); // Asume que un admin puede ver todas las campañas
        const datos = await respuesta.json().catch(() => ({ mensaje: 'Respuesta inválida del servidor al cargar campañas para admin.' }));

        if (respuesta.ok) {
            if (datos.length === 0) {
                listaCampanas.innerHTML = '<p>No hay campañas para gestionar.</p>';
            } else {
                listaCampanas.innerHTML = '';
                datos.forEach(campana => {
                    const divCampana = document.createElement('div');
                    divCampana.className = 'card'; // Clase CSS para el estilo de la tarjeta
                    divCampana.innerHTML = `
                        <h3>${campana.nombre}</h3>
                        <p>${campana.descripcion ? campana.descripcion.substring(0, 100) + '...' : 'Sin descripción'}</p>
                        <p><strong>Ubicación:</strong> ${campana.ubicacion}</p>
                        <p><strong>Fecha:</strong> ${campana.fechaInicio} al ${campana.fechaFin}</p>
                        <p><strong>Estado:</strong> ${campana.estado}</p>
                        <button onclick="editarCampana('${campana.id}')">Editar</button>
                        <button onclick="eliminarCampana('${campana.id}')" class="delete-button">Eliminar</button>
                    `;
                    listaCampanas.appendChild(divCampana);
                });
            }
        } else {
            mostrarMensaje('admin-campaigns-message', datos.mensaje || 'Error al cargar campañas para admin.', true);
        }
    } catch (error) {
        mostrarMensaje('admin-campaigns-message', `Error de red: ${error.message}`, true);
        console.error("Error al cargar campañas para admin:", error);
    }
}

/**
 * Muestra el formulario modal para crear una nueva campaña.
 * Resetea el formulario y configura el botón para la acción de creación.
 */
function mostrarFormularioCrearCampana() {
    const formulario = document.getElementById('campaign-admin-form');
    formulario.reset(); // Limpiar el formulario
    document.getElementById('campaign-form-title').textContent = 'Crear Nueva Campaña';
    document.getElementById('campaign-form-submit-button').textContent = 'Crear Campaña';
    document.getElementById('campaign-form-submit-button').onclick = crearCampana; // Asignar la función de creación
    document.getElementById('campaign-form-submit-button').dataset.mode = 'create'; // Establecer el modo
    document.getElementById('admin-campaign-id').value = ''; // Asegurar que no hay ID (para creación)
    document.getElementById('admin-campaign-estado').value = 'PLANIFICADA'; // Establecer estado por defecto
    ocultarMensajes('campaign-form-message');
    mostrarModal('campaign-form-modal');
}

/**
 * Función auxiliar para formatear una fecha de 'YYYY-MM-DD' (del input date) a 'DD/MM/YYYY' (para el backend).
 * @param {string} dateString - La fecha en formato 'YYYY-MM-DD'.
 * @returns {string|null} La fecha formateada o null si es inválida.
 */
function formatDateToDDMMYYYY(dateString) {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

/**
 * Función auxiliar para formatear una fecha de 'DD/MM/YYYY' (del backend) a 'YYYY-MM-DD' (para el input date).
 * También maneja el caso en que la fecha ya esté en```javascript
// app.js
// Archivo JavaScript principal para la aplicación de Gestión de Campañas de Limpieza

// URL base de la API de tu backend Spring Boot
const API_BASE_URL = 'http://localhost:8080/api';
// Variable global para almacenar los datos del usuario autenticado
let usuarioActual = null;

// --- Funciones de Utilidad ---

/**
 * Muestra una sección específica de la interfaz de usuario y oculta todas las demás.
 * @param {string} idSeccion - El ID de la sección HTML a mostrar.
 */
function mostrarSeccion(idSeccion) {
    // Oculta todas las secciones dentro del elemento 'main'
    document.querySelectorAll('main section').forEach(seccion => {
        seccion.style.display = 'none';
    });
    // Muestra la sección con el ID especificado
    document.getElementById(idSeccion).style.display = 'block';
}

/**
 * Actualiza la visibilidad de los elementos de navegación según el estado de autenticación
 * y el rol del usuario.
 */
function actualizarNavegacion() {
    // Obtener referencias a todos los elementos de navegación
    const navIniciarSesion = document.getElementById('nav-login');
    const navRegistrarse = document.getElementById('nav-register');
    const navMiPerfil = document.getElementById('nav-profile');
    const navCampanas = document.getElementById('nav-campaigns');
    const navGestionCampanasAdmin = document.getElementById('nav-admin-campaigns');
    const navVoluntariosAdmin = document.getElementById('nav-volunteers');
    const navReportesAdmin = document.getElementById('nav-reports-admin'); // ID corregido
    const navCalendario = document.getElementById('nav-calendar');
    const navNotificaciones = document.getElementById('nav-notifications');
    const navCerrarSesion = document.getElementById('nav-logout');
    const infoUsuarioSpan = document.getElementById('user-info'); // Para mostrar el nombre de usuario

    if (usuarioActual) {
        // Usuario autenticado: Ocultar opciones de no logeado, mostrar opciones de logeado
        navIniciarSesion.style.display = 'none';
        navRegistrarse.style.display = 'none';

        navMiPerfil.style.display = 'block';
        navCampanas.style.display = 'block';
        navCalendario.style.display = 'block';
        navNotificaciones.style.display = 'block';
        navCerrarSesion.style.display = 'block';
        infoUsuarioSpan.textContent = `Bienvenido, ${usuarioActual.nombreUsuario}`;

        // Opciones específicas para el rol de ADMINISTRADOR
        if (usuarioActual.rol === 'ADMIN') {
            navGestionCampanasAdmin.style.display = 'block';
            navVoluntariosAdmin.style.display = 'block';
            navReportesAdmin.style.display = 'block'; // Mostrar opción de reportes para Admin
        } else {
            // Ocultar opciones de admin para otros roles
            navGestionCampanasAdmin.style.display = 'none';
            navVoluntariosAdmin.style.display = 'none';
            navReportesAdmin.style.display = 'none';
        }
    } else {
        // Usuario no autenticado: Mostrar opciones de no logeado, ocultar todas las demás
        navIniciarSesion.style.display = 'block';
        navRegistrarse.style.display = 'block';

        navMiPerfil.style.display = 'none';
        navCampanas.style.display = 'none';
        navGestionCampanasAdmin.style.display = 'none';
        navVoluntariosAdmin.style.display = 'none';
        navReportesAdmin.style.display = 'none';
        navCalendario.style.display = 'none';
        navNotificaciones.style.display = 'none';
        navCerrarSesion.style.display = 'none';
        infoUsuarioSpan.textContent = ''; // Limpiar información de usuario
        mostrarIniciarSesion(); // Por defecto, si no hay usuario, mostrar la sección de login
    }
}

/**
 * Muestra un mensaje de retroalimentación al usuario en un elemento HTML específico.
 * @param {string} idElemento - El ID del elemento HTML donde se mostrará el mensaje.
 * @param {string} mensaje - El texto del mensaje a mostrar.
 * @param {boolean} esError - True si el mensaje es un error (para aplicar estilos de error).
 */
function mostrarMensaje(idElemento, mensaje, esError = false) {
    const elemento = document.getElementById(idElemento);
    if (!elemento) {
        console.error(`Elemento con ID '${idElemento}' no encontrado para mostrar mensaje.`);
        return;
    }
    elemento.textContent = mensaje; // Establecer el texto del mensaje
    elemento.className = esError ? 'message error' : 'message success'; // Aplicar clase CSS para estilo
    elemento.style.display = 'block'; // Asegurarse de que el mensaje sea visible
    // Opcional: ocultar el mensaje después de X segundos (descomentar si se desea)
    // setTimeout(() => { elemento.style.display = 'none'; }, 5000);
}

/**
 * Oculta un mensaje de retroalimentación en un elemento HTML específico.
 * @param {string} idElemento - El ID del elemento HTML cuyo mensaje se ocultará.
 */
function ocultarMensajes(idElemento) {
    const elemento = document.getElementById(idElemento);
    if (elemento) {
        elemento.textContent = ''; // Limpiar el texto
        elemento.style.display = 'none'; // Ocultar el elemento
    }
}

/**
 * Muestra un modal (elemento con display: none por defecto).
 * @param {string} idModal - El ID del modal a mostrar.
 */
function mostrarModal(idModal) {
    document.getElementById(idModal).style.display = 'block';
}

/**
 * Cierra un modal y limpia los mensajes asociados.
 * @param {string} idModal - El ID del modal a cerrar.
 */
function cerrarModal(idModal) {
    document.getElementById(idModal).style.display = 'none';
    // Limpiar mensajes específicos de modales al cerrarlos
    ocultarMensajes('modal-action-message');
    ocultarMensajes('campaign-form-message');
}

// --- Autenticación y Estado de la Sesión ---

/**
 * Función auxiliar para manejar el éxito del login, guardando el token y actualizando la UI.
 * @param {object} userData - Los datos del usuario (incluyendo el token JWT si aplica).
 */
function handleLoginSuccess(userData) {
    // Si el backend devuelve un token JWT, guárdalo
    if (userData.jwtToken) {
        localStorage.setItem('jwtToken', userData.jwtToken);
    }
    // Guarda los datos del usuario (sin el token si no quieres que esté en usuarioActual)
    usuarioActual = { ...userData }; // Copia los datos del usuario
    delete usuarioActual.jwtToken; // Elimina el token del objeto usuarioActual si lo tenía

    actualizarNavegacion();
    // Redirigir al perfil o a la sección principal tras un login exitoso
    mostrarPerfil(); // O podrías mostrarCampanas()
    // Limpiar los parámetros de la URL una vez procesados
    history.replaceState({}, document.title, window.location.pathname);
}

/**
 * Verifica el estado de autenticación del usuario al cargar la página o después de acciones de login/logout.
 * Realiza una petición a un endpoint protegido para obtener los datos del usuario autenticado.
 */
async function verificarEstadoAutenticacion() {
    try {
        ocultarMensajes('login-message'); // Limpiar mensajes de login previos

        // Verificar si hay parámetros de URL de Spring Security (ej. ?error o ?logout)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('error')) {
            mostrarMensaje('login-message', 'Credenciales inválidas. Por favor, inténtalo de nuevo.', true);
        } else if (urlParams.has('logout')) {
            mostrarMensaje('login-message', 'Has cerrado sesión exitosamente.', false);
        }

        // Si usas JWT y lo tienes en localStorage, verifica si es válido
        const token = localStorage.getItem('jwtToken');
        if (token) {
            // Realizar una petición a un endpoint protegido (ej. /api/usuarios/me)
            // para obtener los datos del usuario autenticado y validar el token.
            const respuesta = await fetch(`${API_BASE_URL}/usuarios/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (respuesta.ok) {
                // Token válido y usuario autenticado: obtener sus detalles y actualizar la UI
                const userData = await respuesta.json();
                handleLoginSuccess({ ...userData, jwtToken: token }); // Re-añadir token si lo necesitas en handleLoginSuccess
            } else {
                // Token inválido o expirado: limpiar token y estado, mostrar login
                localStorage.removeItem('jwtToken'); // Eliminar token inválido
                usuarioActual = null;
                actualizarNavegacion();
                mostrarIniciarSesion();
            }
        } else {
            // No hay token en localStorage: no autenticado
            usuarioActual = null;
            actualizarNavegacion();
            mostrarIniciarSesion();
        }
    } catch (error) {
        console.error("Error al verificar estado de autenticación:", error);
        localStorage.removeItem('jwtToken'); // En caso de error de red, limpiar token por si acaso
        usuarioActual = null;
        actualizarNavegacion();
        mostrarMensaje('login-message', 'Error de conexión con el servidor. Inténtalo más tarde.', true);
        mostrarIniciarSesion();
    }
}

/**
 * Maneja el proceso de inicio de sesión.
 * Envía las credenciales al backend y guarda el token JWT si la autenticación es exitosa.
 * @param {Event} evento - El evento de envío del formulario.
 */
async function iniciarSesion(evento) {
    evento.preventDefault(); // Prevenir el envío por defecto del formulario HTML
    const formulario = document.getElementById('login-form');
    const datosFormulario = new FormData(formulario);
    const credenciales = Object.fromEntries(datosFormulario.entries());

    ocultarMensajes('login-message'); // Limpiar mensaje previo

    try {
        // Realizar la petición POST al endpoint de login de tu backend
        // Asume que tu backend tiene un endpoint como /api/auth/login que devuelve un JWT
        const respuesta = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credenciales)
        });

        // Intentar parsear la respuesta JSON, incluso si es un error, por si el backend envía un mensaje
        const datos = await respuesta.json().catch(() => ({ message: respuesta.statusText || 'Error desconocido' }));

        if (respuesta.ok) { // Código de estado 200-299
            // Si el login es exitoso, los datos deberían contener el token JWT y la información del usuario
            handleLoginSuccess(datos); // Llama a la función para guardar token y actualizar UI
            mostrarMensaje('login-message', '¡Inicio de sesión exitoso!', false);
        } else { // Código de estado 4xx o 5xx
            // Si el backend envía un mensaje de error en el JSON, usarlo
            mostrarMensaje('login-message', datos.message || 'Credenciales inválidas. Inténtalo de nuevo.', true);
        }
    } catch (error) {
        // Manejo de errores de red o JSON inválido
        mostrarMensaje('login-message', `Error de red: ${error.message}. Verifica tu conexión o el servidor.`, true);
    }
}


/**
 * Maneja el proceso de registro de nuevos usuarios.
 * @param {Event} evento - El evento de envío del formulario.
 */
async function registrar(evento) {
    evento.preventDefault(); // Prevenir el envío por defecto del formulario HTML
    const formulario = document.getElementById('register-form');
    const datosFormulario = new FormData(formulario);
    const datosUsuario = Object.fromEntries(datosFormulario.entries());

    // Asignar rol por defecto (los registros desde aquí siempre son voluntarios)
    datosUsuario.rol = 'VOLUNTARIO';

    // Validar que la contraseña no esté vacía
    if (!datosUsuario.contrasena || datosUsuario.contrasena.trim() === '') {
        mostrarMensaje('register-message', 'La contraseña no puede estar vacía.', true);
        return;
    }

    ocultarMensajes('register-message'); // Limpiar mensaje previo

    try {
        const respuesta = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosUsuario)
        });

        // Intentar parsear la respuesta JSON, incluso si es un error, por si el backend envía un mensaje
        const datos = await respuesta.json().catch(() => ({ mensaje: respuesta.statusText || 'Error desconocido' }));

        if (respuesta.ok) { // Código de estado 200-299
            mostrarMensaje('register-message', '¡Registro exitoso! Ahora puedes iniciar sesión.', false);
            formulario.reset(); // Limpiar el formulario después del éxito
            mostrarIniciarSesion(); // Redirigir al usuario a la sección de login
        } else { // Código de estado 4xx o 5xx
            // Si el backend envía un mensaje de error en el JSON, usarlo
            mostrarMensaje('register-message', datos.mensaje || 'Error en el registro. Inténtalo de nuevo.', true);
        }
    } catch (error) {
        // Manejo de errores de red o JSON inválido
        mostrarMensaje('register-message', `Error de red: ${error.message}. Verifica tu conexión o el servidor.`, true);
        console.error("Error al registrar:", error);
    }
}

/**
 * Maneja el proceso de cierre de sesión.
 * Realiza un POST a la URL de logout de Spring Security.
 */
async function cerrarSesion() {
    try {
        // Si usas JWT, deberías eliminarlo de localStorage
        localStorage.removeItem('jwtToken');

        // Spring Security espera un POST a /logout para invalidar la sesión
        // Si usas JWT puro, este endpoint puede no ser necesario o tener otra lógica.
        const respuesta = await fetch('/logout', {
            method: 'POST',
            // Es buena práctica incluir el token CSRF si lo tienes habilitado en Spring Security
            // headers: { 'X-CSRF-TOKEN': obtenerCsrfToken() } // Implementar obtenerCsrfToken si es necesario
        });

        if (respuesta.ok) {
            // Logout exitoso, limpiar estado del frontend
            usuarioActual = null;
            actualizarNavegacion();
            // Redirigir para que Spring Security complete el proceso y limpie la sesión del navegador
            window.location.href = '/?logout';
        } else {
            console.error("Error al cerrar sesión:", respuesta.status, respuesta.statusText);
            // Usar mostrarMensaje o un modal personalizado en lugar de alert()
            alert('Error al cerrar sesión. Por favor, inténtalo de nuevo.');
        }
    } catch (error) {
        console.error("Error de red al cerrar sesión:", error);
        alert('Error de conexión al intentar cerrar sesión. Inténtalo más tarde.');
    }
}

// --- Vistas de Navegación ---

function mostrarIniciarSesion() {
    mostrarSeccion('login-section');
    ocultarMensajes('login-message');
}

function mostrarRegistrarse() {
    mostrarSeccion('register-section');
    ocultarMensajes('register-message');
    document.getElementById('register-form').reset(); // Limpiar formulario al mostrar
}

// --- Perfil de Usuario ---

/**
 * Muestra la sección del perfil del usuario y rellena el formulario con los datos del usuario actual.
 */
async function mostrarPerfil() {
    if (!usuarioActual) { mostrarIniciarSesion(); return; }
    mostrarSeccion('profile-section');
    // Rellenar formulario de perfil con los datos del usuario actual
    document.getElementById('profile-id').value = usuarioActual.id;
    document.getElementById('profile-username').value = usuarioActual.nombreUsuario;
    document.getElementById('profile-nombre').value = usuarioActual.nombre;
    document.getElementById('profile-apellido').value = usuarioActual.apellido;
    document.getElementById('profile-email').value = usuarioActual.email;
    document.getElementById('profile-telefono').value = usuarioActual.telefono || ''; // Manejar valor nulo
    document.getElementById('profile-rol').value = usuarioActual.rol;
    document.getElementById('profile-calificacion').value = usuarioActual.calificacion !== undefined ? usuarioActual.calificacion.toFixed(1) : 'N/A';
    document.getElementById('profile-activo').checked = usuarioActual.activo;

    // Limpiar mensajes y formulario de cambio de contraseña al mostrar el perfil
    ocultarMensajes('profile-message');
    ocultarMensajes('change-password-message');
    document.getElementById('change-password-form').reset();
}

/**
 * Actualiza la información del perfil del usuario.
 * @param {Event} evento - El evento de envío del formulario.
 */
async function actualizarPerfil(evento) {
    evento.preventDefault();
    if (!usuarioActual) { mostrarIniciarSesion(); return; }

    const datosPerfil = {
        id: usuarioActual.id,
        nombreUsuario: usuarioActual.nombreUsuario, // No se permite cambiar desde el frontend
        nombre: document.getElementById('profile-nombre').value.trim(),
        apellido: document.getElementById('profile-apellido').value.trim(),
        email: document.getElementById('profile-email').value.trim(),
        telefono: document.getElementById('profile-telefono').value.trim(),
        rol: usuarioActual.rol, // No se permite cambiar desde el frontend
        calificacion: usuarioActual.calificacion, // No se permite cambiar desde el frontend
        activo: usuarioActual.activo // No se permite cambiar desde el frontend
    };
    ocultarMensajes('profile-message');

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/usuarios/${usuarioActual.id}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(datosPerfil)
        });

        const datos = await respuesta.json().catch(() => ({ mensaje: respuesta.statusText || 'Error desconocido' }));

        if (respuesta.ok) {
            usuarioActual = datos; // Actualizar el objeto de usuario actual con los datos modificados del backend
            mostrarMensaje('profile-message', '¡Perfil actualizado exitosamente!', false);
            actualizarNavegacion(); // Para actualizar el nombre de usuario si se muestra en la navegación
            mostrarPerfil(); // Re-renderizar perfil con los nuevos datos (útil para campos disabled)
        } else {
            mostrarMensaje('profile-message', datos.mensaje || 'Error al actualizar el perfil.', true);
        }
    } catch (error) {
        mostrarMensaje('profile-message', `Error de red: ${error.message}`, true);
        console.error("Error al actualizar perfil:", error);
    }
}

/**
 * Cambia la contraseña del usuario.
 * @param {Event} evento - El evento de envío del formulario.
 */
async function cambiarContrasena(evento) {
    evento.preventDefault();
    if (!usuarioActual) { mostrarIniciarSesion(); return; }

    const contrasenaActual = document.getElementById('current-password').value;
    const nuevaContrasena = document.getElementById('new-password').value;
    const confirmarNuevaContrasena = document.getElementById('confirm-new-password').value;
    ocultarMensajes('change-password-message');

    if (nuevaContrasena !== confirmarNuevaContrasena) {
        mostrarMensaje('change-password-message', 'Las nuevas contraseñas no coinciden.', true);
        return;
    }
    if (nuevaContrasena.trim() === '' || contrasenaActual.trim() === '') {
        mostrarMensaje('change-password-message', 'Las contraseñas no pueden estar vacías.', true);
        return;
    }

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/auth/change-password`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                userId: usuarioActual.id, // ID del usuario logeado
                currentPassword: contrasenaActual,
                newPassword: nuevaContrasena
            })
        });

        const datos = await respuesta.json().catch(() => ({ mensaje: 'Respuesta inválida del servidor.' }));

        if (respuesta.ok) {
            mostrarMensaje('change-password-message', '¡Contraseña cambiada exitosamente!', false);
            document.getElementById('change-password-form').reset(); // Limpiar el formulario
        } else {
            mostrarMensaje('change-password-message', datos.mensaje || 'Error al cambiar la contraseña. Verifica tu contraseña actual.', true);
        }
    } catch (error) {
        mostrarMensaje('change-password-message', `Error de red: ${error.message}`, true);
        console.error("Error al cambiar contraseña:", error);
    }
}

// --- Campañas (para Voluntarios) ---

/**
 * Muestra la sección de campañas disponibles para voluntarios.
 * Carga las campañas desde el backend y las muestra en cards.
 */
async function mostrarCampanas() {
    if (!usuarioActual) { mostrarIniciarSesion(); return; }
    mostrarSeccion('campaigns-section');
    const listaCampanas = document.getElementById('campaigns-list');
    ocultarMensajes('campaigns-message');
    listaCampanas.innerHTML = '<p>Cargando campañas...</p>'; // Mensaje de carga inicial

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/campanas`, { headers });
        const datos = await respuesta.json().catch(() => ({ mensaje: 'Respuesta inválida del servidor al cargar campañas.' }));

        if (respuesta.ok) {
            if (datos.length === 0) {
                listaCampanas.innerHTML = '<p>No hay campañas disponibles en este momento.</p>';
            } else {
                listaCampanas.innerHTML = ''; // Limpiar contenido previo
                datos.forEach(campana => {
                    const divCampana = document.createElement('div');
                    divCampana.className = 'card'; // Clase CSS para el estilo de la tarjeta
                    divCampana.innerHTML = `
                        <h3>${campana.nombre}</h3>
                        <p>${campana.descripcion ? campana.descripcion.substring(0, 100) + '...' : 'Sin descripción'}</p>
                        <p><strong>Ubicación:</strong> ${campana.ubicacion}</p>
                        <p><strong>Fecha:</strong> ${campana.fechaInicio} al ${campana.fechaFin}</p>
                        <p><strong>Estado:</strong> ${campana.estado}</p>
                        <button onclick="mostrarDetallesCampana('${campana.id}', false)">Ver Detalles</button>
                    `;
                    listaCampanas.appendChild(divCampana);
                });
            }
        } else {
            mostrarMensaje('campaigns-message', datos.mensaje || 'Error al cargar campañas.', true);
        }
    } catch (error) {
        mostrarMensaje('campaigns-message', `Error de red: ${error.message}`, true);
        console.error("Error al cargar campañas:", error);
    }
}

/**
 * Muestra los detalles de una campaña en un modal.
 * @param {string} idCampana - El ID de la campaña a mostrar.
 * @param {boolean} esContextoAdmin - Indica si la vista se abre desde el contexto de administración.
 */
async function mostrarDetallesCampana(idCampana, esContextoAdmin) {
    if (!usuarioActual) { mostrarIniciarSesion(); return; }
    const modal = document.getElementById('campaign-details-modal');
    const titulo = document.getElementById('modal-campaign-title');
    const descripcion = document.getElementById('modal-campaign-description');
    const ubicacion = document.getElementById('modal-campaign-ubicacion');
    const fechaInicio = document.getElementById('modal-campaign-fechaInicio');
    const fechaFin = document.getElementById('modal-campaign-fechaFin');
    const estado = document.getElementById('modal-campaign-estado');
    const divEvidencias = document.getElementById('modal-campaign-evidences');
    const botonAccion = document.getElementById('modal-campaign-action-button');
    ocultarMensajes('modal-action-message'); // Limpiar mensaje previo

    // Limpiar y resetear el contenido del modal
    titulo.textContent = 'Cargando...';
    descripcion.textContent = '';
    ubicacion.textContent = '';
    fechaInicio.textContent = '';
    fechaFin.textContent = '';
    estado.textContent = '';
    divEvidencias.innerHTML = '';
    botonAccion.style.display = 'none';

    mostrarModal('campaign-details-modal'); // Mostrar el modal

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/campanas/${idCampana}`, { headers });
        const campana = await respuesta.json().catch(() => ({ mensaje: 'Respuesta inválida del servidor al cargar detalles de campaña.' }));

        if (respuesta.ok) {
            // Rellenar el modal con los datos de la campaña
            titulo.textContent = campana.nombre;
            descripcion.textContent = campana.descripcion;
            ubicacion.textContent = campana.ubicacion;
            fechaInicio.textContent = campana.fechaInicio; // Asume que el formato es legible
            fechaFin.textContent = campana.fechaFin;     // Asume que el formato es legible
            estado.textContent = campana.estado;

            // Placeholder para evidencias (si se implementa en el futuro)
            divEvidencias.innerHTML = '<p>No hay evidencias para esta campaña.</p>';

            // Lógica para el botón de inscripción/anulación (solo para voluntarios y fuera del contexto admin)
            if (!esContextoAdmin && usuarioActual.rol === 'VOLUNTARIO') {
                const respuestaInscripcion = await fetch(`${API_BASE_URL}/campanas/${campana.id}/inscrito/${usuarioActual.id}`);
                let estaInscrito = false;
                if (respuestaInscripcion.ok) {
                    estaInscrito = await respuestaInscripcion.json();
                } else {
                    console.warn(`No se pudo verificar la inscripción para campaña ${campana.id}:`, respuestaInscripcion.status);
                }

                botonAccion.style.display = 'block';
                if (estaInscrito) {
                    botonAccion.textContent = 'Anular Inscripción';
                    botonAccion.onclick = () => anularInscripcion(campana.id);
                } else {
                    botonAccion.textContent = 'Inscribirse';
                    botonAccion.onclick = () => inscribirseCampana(campana.id);
                }
            } else {
                botonAccion.style.display = 'none'; // No mostrar el botón para admin o si no es voluntario
            }
        } else {
            mostrarMensaje('modal-action-message', campana.mensaje || 'Error al cargar detalles de la campaña.', true);
        }
    } catch (error) {
        mostrarMensaje('modal-action-message', `Error de red: ${error.message}`, true);
        console.error("Error al mostrar detalles de campaña:", error);
    }
}

/**
 * Inscribe al usuario actual (voluntario) en una campaña.
 * @param {string} idCampana - El ID de la campaña.
 */
async function inscribirseCampana(idCampana) {
    if (!usuarioActual || usuarioActual.rol !== 'VOLUNTARIO') {
        mostrarMensaje('modal-action-message', 'Debes ser un voluntario para inscribirte.', true);
        return;
    }
    mostrarMensaje('modal-action-message', 'Inscribiendo...');

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/campanas/${idCampana}/inscribir/${usuarioActual.id}`, {
            method: 'POST',
            headers: headers
        });

        const datos = await respuesta.json().catch(() => ({ mensaje: respuesta.statusText || 'Respuesta inválida del servidor.' }));

        if (respuesta.ok) {
            mostrarMensaje('modal-action-message', '¡Inscripción exitosa!', false);
            // Actualizar el botón a "Anular Inscripción"
            const botonAccion = document.getElementById('modal-campaign-action-button');
            botonAccion.textContent = 'Anular Inscripción';
            botonAccion.onclick = () => anularInscripcion(campana.id);
            // Recargar la lista de campañas si la sección está visible
            if (document.getElementById('campaigns-section').style.display === 'block') {
                mostrarCampanas();
            }
        } else {
            mostrarMensaje('modal-action-message', datos.mensaje || 'Error al inscribirse.', true);
        }
    } catch (error) {
        mostrarMensaje('modal-action-message', `Error de red: ${error.message}`, true);
        console.error("Error al inscribirse en campaña:", error);
    }
}

/**
 * Anula la inscripción del usuario actual (voluntario) en una campaña.
 * @param {string} idCampana - El ID de la campaña.
 */
async function anularInscripcion(idCampana) {
    if (!usuarioActual || usuarioActual.rol !== 'VOLUNTARIO') {
        mostrarMensaje('modal-action-message', 'Debes ser un voluntario para anular inscripción.', true);
        return;
    }
    mostrarMensaje('modal-action-message', 'Anulando inscripción...');

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/campanas/${idCampana}/anular/${usuarioActual.id}`, {
            method: 'DELETE',
            headers: headers
        });

        const datos = await respuesta.json().catch(() => ({ mensaje: respuesta.statusText || 'Respuesta inválida del servidor.' }));

        if (respuesta.ok) {
            mostrarMensaje('modal-action-message', '¡Inscripción anulada exitosamente!', false);
            // Actualizar el botón a "Inscribirse"
            const botonAccion = document.getElementById('modal-campaign-action-button');
            botonAccion.textContent = 'Inscribirse';
            botonAccion.onclick = () => inscribirseCampana(idCampana);
            // Recargar la lista de campañas si la sección está visible
            if (document.getElementById('campaigns-section').style.display === 'block') {
                mostrarCampanas();
            }
        } else {
            mostrarMensaje('modal-action-message', datos.mensaje || 'Error al anular inscripción.', true);
        }
    } catch (error) {
        mostrarMensaje('modal-action-message', `Error de red: ${error.message}`, true);
        console.error("Error al anular inscripción:", error);
    }
}


// --- Gestión de Campañas (para Administradores) ---

/**
 * Muestra la sección de gestión de campañas para administradores.
 * Carga todas las campañas desde el backend y las muestra con opciones de edición/eliminación.
 */
async function mostrarGestionCampanasAdmin() {
    if (!usuarioActual || usuarioActual.rol !== 'ADMIN') { mostrarIniciarSesion(); return; }
    mostrarSeccion('admin-campaigns-section');
    const listaCampanas = document.getElementById('admin-campaigns-list');
    ocultarMensajes('admin-campaigns-message');
    listaCampanas.innerHTML = '<p>Cargando campañas para administración...</p>';

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/campanas`, { headers }); // Asume que un admin puede ver todas las campañas
        const datos = await respuesta.json().catch(() => ({ mensaje: 'Respuesta inválida del servidor al cargar campañas para admin.' }));

        if (respuesta.ok) {
            if (datos.length === 0) {
                listaCampanas.innerHTML = '<p>No hay campañas para gestionar.</p>';
            } else {
                listaCampanas.innerHTML = '';
                datos.forEach(campana => {
                    const divCampana = document.createElement('div');
                    divCampana.className = 'card'; // Clase CSS para el estilo de la tarjeta
                    divCampana.innerHTML = `
                        <h3>${campana.nombre}</h3>
                        <p>${campana.descripcion ? campana.descripcion.substring(0, 100) + '...' : 'Sin descripción'}</p>
                        <p><strong>Ubicación:</strong> ${campana.ubicacion}</p>
                        <p><strong>Fecha:</strong> ${campana.fechaInicio} al ${campana.fechaFin}</p>
                        <p><strong>Estado:</strong> ${campana.estado}</p>
                        <button onclick="editarCampana('${campana.id}')">Editar</button>
                        <button onclick="eliminarCampana('${campana.id}')" class="delete-button">Eliminar</button>
                    `;
                    listaCampanas.appendChild(divCampana);
                });
            }
        } else {
            mostrarMensaje('admin-campaigns-message', datos.mensaje || 'Error al cargar campañas para admin.', true);
        }
    } catch (error) {
        mostrarMensaje('admin-campaigns-message', `Error de red: ${error.message}`, true);
        console.error("Error al cargar campañas para admin:", error);
    }
}

/**
 * Muestra el formulario modal para crear una nueva campaña.
 * Resetea el formulario y configura el botón para la acción de creación.
 */
function mostrarFormularioCrearCampana() {
    const formulario = document.getElementById('campaign-admin-form');
    formulario.reset(); // Limpiar el formulario
    document.getElementById('campaign-form-title').textContent = 'Crear Nueva Campaña';
    document.getElementById('campaign-form-submit-button').textContent = 'Crear Campaña';
    document.getElementById('campaign-form-submit-button').onclick = crearCampana; // Asignar la función de creación
    document.getElementById('campaign-form-submit-button').dataset.mode = 'create'; // Establecer el modo
    document.getElementById('admin-campaign-id').value = ''; // Asegurar que no hay ID (para creación)
    document.getElementById('admin-campaign-estado').value = 'PLANIFICADA'; // Establecer estado por defecto
    ocultarMensajes('campaign-form-message');
    mostrarModal('campaign-form-modal');
}

/**
 * Función auxiliar para formatear una fecha de 'YYYY-MM-DD' (del input date) a 'DD/MM/YYYY' (para el backend).
 * @param {string} dateString - La fecha en formato 'YYYY-MM-DD'.
 * @returns {string|null} La fecha formateada o null si es inválida.
 */
function formatDateToDDMMYYYY(dateString) {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

/**
 * Función auxiliar para formatear una fecha de 'DD/MM/YYYY' (del backend) a 'YYYY-MM-DD' (para el input date).
 * También maneja el caso en que la fecha ya esté en```javascript
// app.js
// Archivo JavaScript principal para la aplicación de Gestión de Campañas de Limpieza

// URL base de la API de tu backend Spring Boot
const API_BASE_URL = 'http://localhost:8080/api';
// Variable global para almacenar los datos del usuario autenticado
let usuarioActual = null;

// --- Funciones de Utilidad ---

/**
 * Muestra una sección específica de la interfaz de usuario y oculta todas las demás.
 * @param {string} idSeccion - El ID de la sección HTML a mostrar.
 */
function mostrarSeccion(idSeccion) {
    // Oculta todas las secciones dentro del elemento 'main'
    document.querySelectorAll('main section').forEach(seccion => {
        seccion.style.display = 'none';
    });
    // Muestra la sección con el ID especificado
    document.getElementById(idSeccion).style.display = 'block';
}

/**
 * Actualiza la visibilidad de los elementos de navegación según el estado de autenticación
 * y el rol del usuario.
 */
function actualizarNavegacion() {
    // Obtener referencias a todos los elementos de navegación
    const navIniciarSesion = document.getElementById('nav-login');
    const navRegistrarse = document.getElementById('nav-register');
    const navMiPerfil = document.getElementById('nav-profile');
    const navCampanas = document.getElementById('nav-campaigns');
    const navGestionCampanasAdmin = document.getElementById('nav-admin-campaigns');
    const navVoluntariosAdmin = document.getElementById('nav-volunteers');
    const navReportesAdmin = document.getElementById('nav-reports-admin'); // ID corregido
    const navCalendario = document.getElementById('nav-calendar');
    const navNotificaciones = document.getElementById('nav-notifications');
    const navCerrarSesion = document.getElementById('nav-logout');
    const infoUsuarioSpan = document.getElementById('user-info'); // Para mostrar el nombre de usuario

    if (usuarioActual) {
        // Usuario autenticado: Ocultar opciones de no logeado, mostrar opciones de logeado
        navIniciarSesion.style.display = 'none';
        navRegistrarse.style.display = 'none';

        navMiPerfil.style.display = 'block';
        navCampanas.style.display = 'block';
        navCalendario.style.display = 'block';
        navNotificaciones.style.display = 'block';
        navCerrarSesion.style.display = 'block';
        infoUsuarioSpan.textContent = `Bienvenido, ${usuarioActual.nombreUsuario}`;

        // Opciones específicas para el rol de ADMINISTRADOR
        if (usuarioActual.rol === 'ADMIN') {
            navGestionCampanasAdmin.style.display = 'block';
            navVoluntariosAdmin.style.display = 'block';
            navReportesAdmin.style.display = 'block'; // Mostrar opción de reportes para Admin
        } else {
            // Ocultar opciones de admin para otros roles
            navGestionCampanasAdmin.style.display = 'none';
            navVoluntariosAdmin.style.display = 'none';
            navReportesAdmin.style.display = 'none';
        }
    } else {
        // Usuario no autenticado: Mostrar opciones de no logeado, ocultar todas las demás
        navIniciarSesion.style.display = 'block';
        navRegistrarse.style.display = 'block';

        navMiPerfil.style.display = 'none';
        navCampanas.style.display = 'none';
        navGestionCampanasAdmin.style.display = 'none';
        navVoluntariosAdmin.style.display = 'none';
        navReportesAdmin.style.display = 'none';
        navCalendario.style.display = 'none';
        navNotificaciones.style.display = 'none';
        navCerrarSesion.style.display = 'none';
        infoUsuarioSpan.textContent = ''; // Limpiar información de usuario
        mostrarIniciarSesion(); // Por defecto, si no hay usuario, mostrar la sección de login
    }
}

/**
 * Muestra un mensaje de retroalimentación al usuario en un elemento HTML específico.
 * @param {string} idElemento - El ID del elemento HTML donde se mostrará el mensaje.
 * @param {string} mensaje - El texto del mensaje a mostrar.
 * @param {boolean} esError - True si el mensaje es un error (para aplicar estilos de error).
 */
function mostrarMensaje(idElemento, mensaje, esError = false) {
    const elemento = document.getElementById(idElemento);
    if (!elemento) {
        console.error(`Elemento con ID '${idElemento}' no encontrado para mostrar mensaje.`);
        return;
    }
    elemento.textContent = mensaje; // Establecer el texto del mensaje
    elemento.className = esError ? 'message error' : 'message success'; // Aplicar clase CSS para estilo
    elemento.style.display = 'block'; // Asegurarse de que el mensaje sea visible
    // Opcional: ocultar el mensaje después de X segundos (descomentar si se desea)
    // setTimeout(() => { elemento.style.display = 'none'; }, 5000);
}

/**
 * Oculta un mensaje de retroalimentación en un elemento HTML específico.
 * @param {string} idElemento - El ID del elemento HTML cuyo mensaje se ocultará.
 */
function ocultarMensajes(idElemento) {
    const elemento = document.getElementById(idElemento);
    if (elemento) {
        elemento.textContent = ''; // Limpiar el texto
        elemento.style.display = 'none'; // Ocultar el elemento
    }
}

/**
 * Muestra un modal (elemento con display: none por defecto).
 * @param {string} idModal - El ID del modal a mostrar.
 */
function mostrarModal(idModal) {
    document.getElementById(idModal).style.display = 'block';
}

/**
 * Cierra un modal y limpia los mensajes asociados.
 * @param {string} idModal - El ID del modal a cerrar.
 */
function cerrarModal(idModal) {
    document.getElementById(idModal).style.display = 'none';
    // Limpiar mensajes específicos de modales al cerrarlos
    ocultarMensajes('modal-action-message');
    ocultarMensajes('campaign-form-message');
}

// --- Autenticación y Estado de la Sesión ---

/**
 * Función auxiliar para manejar el éxito del login, guardando el token y actualizando la UI.
 * @param {object} userData - Los datos del usuario (incluyendo el token JWT si aplica).
 */
function handleLoginSuccess(userData) {
    // Si el backend devuelve un token JWT, guárdalo
    if (userData.jwtToken) {
        localStorage.setItem('jwtToken', userData.jwtToken);
    }
    // Guarda los datos del usuario (sin el token si no quieres que esté en usuarioActual)
    usuarioActual = { ...userData }; // Copia los datos del usuario
    delete usuarioActual.jwtToken; // Elimina el token del objeto usuarioActual si lo tenía

    actualizarNavegacion();
    // Redirigir al perfil o a la sección principal tras un login exitoso
    mostrarPerfil(); // O podrías mostrarCampanas()
    // Limpiar los parámetros de la URL una vez procesados
    history.replaceState({}, document.title, window.location.pathname);
}

/**
 * Verifica el estado de autenticación del usuario al cargar la página o después de acciones de login/logout.
 * Realiza una petición a un endpoint protegido para obtener los datos del usuario autenticado.
 */
async function verificarEstadoAutenticacion() {
    try {
        ocultarMensajes('login-message'); // Limpiar mensajes de login previos

        // Verificar si hay parámetros de URL de Spring Security (ej. ?error o ?logout)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('error')) {
            mostrarMensaje('login-message', 'Credenciales inválidas. Por favor, inténtalo de nuevo.', true);
        } else if (urlParams.has('logout')) {
            mostrarMensaje('login-message', 'Has cerrado sesión exitosamente.', false);
        }

        // Si usas JWT y lo tienes en localStorage, verifica si es válido
        const token = localStorage.getItem('jwtToken');
        if (token) {
            // Realizar una petición a un endpoint protegido (ej. /api/usuarios/me)
            // para obtener los datos del usuario autenticado y validar el token.
            const respuesta = await fetch(`${API_BASE_URL}/usuarios/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (respuesta.ok) {
                // Token válido y usuario autenticado: obtener sus detalles y actualizar la UI
                const userData = await respuesta.json();
                handleLoginSuccess({ ...userData, jwtToken: token }); // Re-añadir token si lo necesitas en handleLoginSuccess
            } else {
                // Token inválido o expirado: limpiar token y estado, mostrar login
                localStorage.removeItem('jwtToken'); // Eliminar token inválido
                usuarioActual = null;
                actualizarNavegacion();
                mostrarIniciarSesion();
            }
        } else {
            // No hay token en localStorage: no autenticado
            usuarioActual = null;
            actualizarNavegacion();
            mostrarIniciarSesion();
        }
    } catch (error) {
        console.error("Error al verificar estado de autenticación:", error);
        localStorage.removeItem('jwtToken'); // En caso de error de red, limpiar token por si acaso
        usuarioActual = null;
        actualizarNavegacion();
        mostrarMensaje('login-message', 'Error de conexión con el servidor. Inténtalo más tarde.', true);
        mostrarIniciarSesion();
    }
}

/**
 * Maneja el proceso de inicio de sesión.
 * Envía las credenciales al backend y guarda el token JWT si la autenticación es exitosa.
 * @param {Event} evento - El evento de envío del formulario.
 */
async function iniciarSesion(evento) {
    evento.preventDefault(); // Prevenir el envío por defecto del formulario HTML
    const formulario = document.getElementById('login-form');
    const datosFormulario = new FormData(formulario);
    const credenciales = Object.fromEntries(datosFormulario.entries());

    ocultarMensajes('login-message'); // Limpiar mensaje previo

    try {
        // Realizar la petición POST al endpoint de login de tu backend
        // Asume que tu backend tiene un endpoint como /api/auth/login que devuelve un JWT
        const respuesta = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credenciales)
        });

        // Intentar parsear la respuesta JSON, incluso si es un error, por si el backend envía un mensaje
        const datos = await respuesta.json().catch(() => ({ message: respuesta.statusText || 'Error desconocido' }));

        if (respuesta.ok) { // Código de estado 200-299
            // Si el login es exitoso, los datos deberían contener el token JWT y la información del usuario
            handleLoginSuccess(datos); // Llama a la función para guardar token y actualizar UI
            mostrarMensaje('login-message', '¡Inicio de sesión exitoso!', false);
        } else { // Código de estado 4xx o 5xx
            // Si el backend envía un mensaje de error en el JSON, usarlo
            mostrarMensaje('login-message', datos.message || 'Credenciales inválidas. Inténtalo de nuevo.', true);
        }
    } catch (error) {
        // Manejo de errores de red o JSON inválido
        mostrarMensaje('login-message', `Error de red: ${error.message}. Verifica tu conexión o el servidor.`, true);
    }
}


/**
 * Maneja el proceso de registro de nuevos usuarios.
 * @param {Event} evento - El evento de envío del formulario.
 */
async function registrar(evento) {
    evento.preventDefault(); // Prevenir el envío por defecto del formulario HTML
    const formulario = document.getElementById('register-form');
    const datosFormulario = new FormData(formulario);
    const datosUsuario = Object.fromEntries(datosFormulario.entries());

    // Asignar rol por defecto (los registros desde aquí siempre son voluntarios)
    datosUsuario.rol = 'VOLUNTARIO';

    // Validar que la contraseña no esté vacía
    if (!datosUsuario.contrasena || datosUsuario.contrasena.trim() === '') {
        mostrarMensaje('register-message', 'La contraseña no puede estar vacía.', true);
        return;
    }

    ocultarMensajes('register-message'); // Limpiar mensaje previo

    try {
        const respuesta = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosUsuario)
        });

        // Intentar parsear la respuesta JSON, incluso si es un error, por si el backend envía un mensaje
        const datos = await respuesta.json().catch(() => ({ mensaje: respuesta.statusText || 'Error desconocido' }));

        if (respuesta.ok) { // Código de estado 200-299
            mostrarMensaje('register-message', '¡Registro exitoso! Ahora puedes iniciar sesión.', false);
            formulario.reset(); // Limpiar el formulario después del éxito
            mostrarIniciarSesion(); // Redirigir al usuario a la sección de login
        } else { // Código de estado 4xx o 5xx
            // Si el backend envía un mensaje de error en el JSON, usarlo
            mostrarMensaje('register-message', datos.mensaje || 'Error en el registro. Inténtalo de nuevo.', true);
        }
    } catch (error) {
        // Manejo de errores de red o JSON inválido
        mostrarMensaje('register-message', `Error de red: ${error.message}. Verifica tu conexión o el servidor.`, true);
        console.error("Error al registrar:", error);
    }
}

/**
 * Maneja el proceso de cierre de sesión.
 * Realiza un POST a la URL de logout de Spring Security.
 */
async function cerrarSesion() {
    try {
        // Si usas JWT, deberías eliminarlo de localStorage
        localStorage.removeItem('jwtToken');

        // Spring Security espera un POST a /logout para invalidar la sesión
        // Si usas JWT puro, este endpoint puede no ser necesario o tener otra lógica.
        const respuesta = await fetch('/logout', {
            method: 'POST',
            // Es buena práctica incluir el token CSRF si lo tienes habilitado en Spring Security
            // headers: { 'X-CSRF-TOKEN': obtenerCsrfToken() } // Implementar obtenerCsrfToken si es necesario
        });

        if (respuesta.ok) {
            // Logout exitoso, limpiar estado del frontend
            usuarioActual = null;
            actualizarNavegacion();
            // Redirigir para que Spring Security complete el proceso y limpie la sesión del navegador
            window.location.href = '/?logout';
        } else {
            console.error("Error al cerrar sesión:", respuesta.status, respuesta.statusText);
            // Usar mostrarMensaje o un modal personalizado en lugar de alert()
            alert('Error al cerrar sesión. Por favor, inténtalo de nuevo.');
        }
    } catch (error) {
        console.error("Error de red al cerrar sesión:", error);
        alert('Error de conexión al intentar cerrar sesión. Inténtalo más tarde.');
    }
}

// --- Vistas de Navegación ---

function mostrarIniciarSesion() {
    mostrarSeccion('login-section');
    ocultarMensajes('login-message');
}

function mostrarRegistrarse() {
    mostrarSeccion('register-section');
    ocultarMensajes('register-message');
    document.getElementById('register-form').reset(); // Limpiar formulario al mostrar
}

// --- Perfil de Usuario ---

/**
 * Muestra la sección del perfil del usuario y rellena el formulario con los datos del usuario actual.
 */
async function mostrarPerfil() {
    if (!usuarioActual) { mostrarIniciarSesion(); return; }
    mostrarSeccion('profile-section');
    // Rellenar formulario de perfil con los datos del usuario actual
    document.getElementById('profile-id').value = usuarioActual.id;
    document.getElementById('profile-username').value = usuarioActual.nombreUsuario;
    document.getElementById('profile-nombre').value = usuarioActual.nombre;
    document.getElementById('profile-apellido').value = usuarioActual.apellido;
    document.getElementById('profile-email').value = usuarioActual.email;
    document.getElementById('profile-telefono').value = usuarioActual.telefono || ''; // Manejar valor nulo
    document.getElementById('profile-rol').value = usuarioActual.rol;
    document.getElementById('profile-calificacion').value = usuarioActual.calificacion !== undefined ? usuarioActual.calificacion.toFixed(1) : 'N/A';
    document.getElementById('profile-activo').checked = usuarioActual.activo;

    // Limpiar mensajes y formulario de cambio de contraseña al mostrar el perfil
    ocultarMensajes('profile-message');
    ocultarMensajes('change-password-message');
    document.getElementById('change-password-form').reset();
}

/**
 * Actualiza la información del perfil del usuario.
 * @param {Event} evento - El evento de envío del formulario.
 */
async function actualizarPerfil(evento) {
    evento.preventDefault();
    if (!usuarioActual) { mostrarIniciarSesion(); return; }

    const datosPerfil = {
        id: usuarioActual.id,
        nombreUsuario: usuarioActual.nombreUsuario, // No se permite cambiar desde el frontend
        nombre: document.getElementById('profile-nombre').value.trim(),
        apellido: document.getElementById('profile-apellido').value.trim(),
        email: document.getElementById('profile-email').value.trim(),
        telefono: document.getElementById('profile-telefono').value.trim(),
        rol: usuarioActual.rol, // No se permite cambiar desde el frontend
        calificacion: usuarioActual.calificacion, // No se permite cambiar desde el frontend
        activo: usuarioActual.activo // No se permite cambiar desde el frontend
    };
    ocultarMensajes('profile-message');

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/usuarios/${usuarioActual.id}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(datosPerfil)
        });

        const datos = await respuesta.json().catch(() => ({ mensaje: respuesta.statusText || 'Error desconocido' }));

        if (respuesta.ok) {
            usuarioActual = datos; // Actualizar el objeto de usuario actual con los datos modificados del backend
            mostrarMensaje('profile-message', '¡Perfil actualizado exitosamente!', false);
            actualizarNavegacion(); // Para actualizar el nombre de usuario si se muestra en la navegación
            mostrarPerfil(); // Re-renderizar perfil con los nuevos datos (útil para campos disabled)
        } else {
            mostrarMensaje('profile-message', datos.mensaje || 'Error al actualizar el perfil.', true);
        }
    } catch (error) {
        mostrarMensaje('profile-message', `Error de red: ${error.message}`, true);
        console.error("Error al actualizar perfil:", error);
    }
}

/**
 * Cambia la contraseña del usuario.
 * @param {Event} evento - El evento de envío del formulario.
 */
async function cambiarContrasena(evento) {
    evento.preventDefault();
    if (!usuarioActual) { mostrarIniciarSesion(); return; }

    const contrasenaActual = document.getElementById('current-password').value;
    const nuevaContrasena = document.getElementById('new-password').value;
    const confirmarNuevaContrasena = document.getElementById('confirm-new-password').value;
    ocultarMensajes('change-password-message');

    if (nuevaContrasena !== confirmarNuevaContrasena) {
        mostrarMensaje('change-password-message', 'Las nuevas contraseñas no coinciden.', true);
        return;
    }
    if (nuevaContrasena.trim() === '' || contrasenaActual.trim() === '') {
        mostrarMensaje('change-password-message', 'Las contraseñas no pueden estar vacías.', true);
        return;
    }

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/auth/change-password`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                userId: usuarioActual.id, // ID del usuario logeado
                currentPassword: contrasenaActual,
                newPassword: nuevaContrasena
            })
        });

        const datos = await respuesta.json().catch(() => ({ mensaje: 'Respuesta inválida del servidor.' }));

        if (respuesta.ok) {
            mostrarMensaje('change-password-message', '¡Contraseña cambiada exitosamente!', false);
            document.getElementById('change-password-form').reset(); // Limpiar el formulario
        } else {
            mostrarMensaje('change-password-message', datos.mensaje || 'Error al cambiar la contraseña. Verifica tu contraseña actual.', true);
        }
    } catch (error) {
        mostrarMensaje('change-password-message', `Error de red: ${error.message}`, true);
        console.error("Error al cambiar contraseña:", error);
    }
}

// --- Campañas (para Voluntarios) ---

/**
 * Muestra la sección de campañas disponibles para voluntarios.
 * Carga las campañas desde el backend y las muestra en cards.
 */
async function mostrarCampanas() {
    if (!usuarioActual) { mostrarIniciarSesion(); return; }
    mostrarSeccion('campaigns-section');
    const listaCampanas = document.getElementById('campaigns-list');
    ocultarMensajes('campaigns-message');
    listaCampanas.innerHTML = '<p>Cargando campañas...</p>'; // Mensaje de carga inicial

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/campanas`, { headers });
        const datos = await respuesta.json().catch(() => ({ mensaje: 'Respuesta inválida del servidor al cargar campañas.' }));

        if (respuesta.ok) {
            if (datos.length === 0) {
                listaCampanas.innerHTML = '<p>No hay campañas disponibles en este momento.</p>';
            } else {
                listaCampanas.innerHTML = ''; // Limpiar contenido previo
                datos.forEach(campana => {
                    const divCampana = document.createElement('div');
                    divCampana.className = 'card'; // Clase CSS para el estilo de la tarjeta
                    divCampana.innerHTML = `
                        <h3>${campana.nombre}</h3>
                        <p>${campana.descripcion ? campana.descripcion.substring(0, 100) + '...' : 'Sin descripción'}</p>
                        <p><strong>Ubicación:</strong> ${campana.ubicacion}</p>
                        <p><strong>Fecha:</strong> ${campana.fechaInicio} al ${campana.fechaFin}</p>
                        <p><strong>Estado:</strong> ${campana.estado}</p>
                        <button onclick="mostrarDetallesCampana('${campana.id}', false)">Ver Detalles</button>
                    `;
                    listaCampanas.appendChild(divCampana);
                });
            }
        } else {
            mostrarMensaje('campaigns-message', datos.mensaje || 'Error al cargar campañas.', true);
        }
    } catch (error) {
        mostrarMensaje('campaigns-message', `Error de red: ${error.message}`, true);
        console.error("Error al cargar campañas:", error);
    }
}

/**
 * Muestra los detalles de una campaña en un modal.
 * @param {string} idCampana - El ID de la campaña a mostrar.
 * @param {boolean} esContextoAdmin - Indica si la vista se abre desde el contexto de administración.
 */
async function mostrarDetallesCampana(idCampana, esContextoAdmin) {
    if (!usuarioActual) { mostrarIniciarSesion(); return; }
    const modal = document.getElementById('campaign-details-modal');
    const titulo = document.getElementById('modal-campaign-title');
    const descripcion = document.getElementById('modal-campaign-description');
    const ubicacion = document.getElementById('modal-campaign-ubicacion');
    const fechaInicio = document.getElementById('modal-campaign-fechaInicio');
    const fechaFin = document.getElementById('modal-campaign-fechaFin');
    const estado = document.getElementById('modal-campaign-estado');
    const divEvidencias = document.getElementById('modal-campaign-evidences');
    const botonAccion = document.getElementById('modal-campaign-action-button');
    ocultarMensajes('modal-action-message'); // Limpiar mensaje previo

    // Limpiar y resetear el contenido del modal
    titulo.textContent = 'Cargando...';
    descripcion.textContent = '';
    ubicacion.textContent = '';
    fechaInicio.textContent = '';
    fechaFin.textContent = '';
    estado.textContent = '';
    divEvidencias.innerHTML = '';
    botonAccion.style.display = 'none';

    mostrarModal('campaign-details-modal'); // Mostrar el modal

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/campanas/${idCampana}`, { headers });
        const campana = await respuesta.json().catch(() => ({ mensaje: 'Respuesta inválida del servidor al cargar detalles de campaña.' }));

        if (respuesta.ok) {
            // Rellenar el modal con los datos de la campaña
            titulo.textContent = campana.nombre;
            descripcion.textContent = campana.descripcion;
            ubicacion.textContent = campana.ubicacion;
            fechaInicio.textContent = campana.fechaInicio; // Asume que el formato es legible
            fechaFin.textContent = campana.fechaFin;     // Asume que el formato es legible
            estado.textContent = campana.estado;

            // Placeholder para evidencias (si se implementa en el futuro)
            divEvidencias.innerHTML = '<p>No hay evidencias para esta campaña.</p>';

            // Lógica para el botón de inscripción/anulación (solo para voluntarios y fuera del contexto admin)
            if (!esContextoAdmin && usuarioActual.rol === 'VOLUNTARIO') {
                const respuestaInscripcion = await fetch(`${API_BASE_URL}/campanas/${campana.id}/inscrito/${usuarioActual.id}`);
                let estaInscrito = false;
                if (respuestaInscripcion.ok) {
                    estaInscrito = await respuestaInscripcion.json();
                } else {
                    console.warn(`No se pudo verificar la inscripción para campaña ${campana.id}:`, respuestaInscripcion.status);
                }

                botonAccion.style.display = 'block';
                if (estaInscrito) {
                    botonAccion.textContent = 'Anular Inscripción';
                    botonAccion.onclick = () => anularInscripcion(campana.id);
                } else {
                    botonAccion.textContent = 'Inscribirse';
                    botonAccion.onclick = () => inscribirseCampana(campana.id);
                }
            } else {
                botonAccion.style.display = 'none'; // No mostrar el botón para admin o si no es voluntario
            }
        } else {
            mostrarMensaje('modal-action-message', campana.mensaje || 'Error al cargar detalles de la campaña.', true);
        }
    } catch (error) {
        mostrarMensaje('modal-action-message', `Error de red: ${error.message}`, true);
        console.error("Error al mostrar detalles de campaña:", error);
    }
}

/**
 * Inscribe al usuario actual (voluntario) en una campaña.
 * @param {string} idCampana - El ID de la campaña.
 */
async function inscribirseCampana(idCampana) {
    if (!usuarioActual || usuarioActual.rol !== 'VOLUNTARIO') {
        mostrarMensaje('modal-action-message', 'Debes ser un voluntario para inscribirte.', true);
        return;
    }
    mostrarMensaje('modal-action-message', 'Inscribiendo...');

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/campanas/${idCampana}/inscribir/${usuarioActual.id}`, {
            method: 'POST',
            headers: headers
        });

        const datos = await respuesta.json().catch(() => ({ mensaje: respuesta.statusText || 'Respuesta inválida del servidor.' }));

        if (respuesta.ok) {
            mostrarMensaje('modal-action-message', '¡Inscripción exitosa!', false);
            // Actualizar el botón a "Anular Inscripción"
            const botonAccion = document.getElementById('modal-campaign-action-button');
            botonAccion.textContent = 'Anular Inscripción';
            botonAccion.onclick = () => anularInscripcion(campana.id);
            // Recargar la lista de campañas si la sección está visible
            if (document.getElementById('campaigns-section').style.display === 'block') {
                mostrarCampanas();
            }
        } else {
            mostrarMensaje('modal-action-message', datos.mensaje || 'Error al inscribirse.', true);
        }
    } catch (error) {
        mostrarMensaje('modal-action-message', `Error de red: ${error.message}`, true);
        console.error("Error al inscribirse en campaña:", error);
    }
}

/**
 * Anula la inscripción del usuario actual (voluntario) en una campaña.
 * @param {string} idCampana - El ID de la campaña.
 */
async function anularInscripcion(idCampana) {
    if (!usuarioActual || usuarioActual.rol !== 'VOLUNTARIO') {
        mostrarMensaje('modal-action-message', 'Debes ser un voluntario para anular inscripción.', true);
        return;
    }
    mostrarMensaje('modal-action-message', 'Anulando inscripción...');

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/campanas/${idCampana}/anular/${usuarioActual.id}`, {
            method: 'DELETE',
            headers: headers
        });

        const datos = await respuesta.json().catch(() => ({ mensaje: respuesta.statusText || 'Respuesta inválida del servidor.' }));

        if (respuesta.ok) {
            mostrarMensaje('modal-action-message', '¡Inscripción anulada exitosamente!', false);
            // Actualizar el botón a "Inscribirse"
            const botonAccion = document.getElementById('modal-campaign-action-button');
            botonAccion.textContent = 'Inscribirse';
            botonAccion.onclick = () => inscribirseCampana(idCampana);
            // Recargar la lista de campañas si la sección está visible
            if (document.getElementById('campaigns-section').style.display === 'block') {
                mostrarCampanas();
            }
        } else {
            mostrarMensaje('modal-action-message', datos.mensaje || 'Error al anular inscripción.', true);
        }
    } catch (error) {
        mostrarMensaje('modal-action-message', `Error de red: ${error.message}`, true);
        console.error("Error al anular inscripción:", error);
    }
}


// --- Gestión de Campañas (para Administradores) ---

/**
 * Muestra la sección de gestión de campañas para administradores.
 * Carga todas las campañas desde el backend y las muestra con opciones de edición/eliminación.
 */
async function mostrarGestionCampanasAdmin() {
    if (!usuarioActual || usuarioActual.rol !== 'ADMIN') { mostrarIniciarSesion(); return; }
    mostrarSeccion('admin-campaigns-section');
    const listaCampanas = document.getElementById('admin-campaigns-list');
    ocultarMensajes('admin-campaigns-message');
    listaCampanas.innerHTML = '<p>Cargando campañas para administración...</p>';

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/campanas`, { headers }); // Asume que un admin puede ver todas las campañas
        const datos = await respuesta.json().catch(() => ({ mensaje: 'Respuesta inválida del servidor al cargar campañas para admin.' }));

        if (respuesta.ok) {
            if (datos.length === 0) {
                listaCampanas.innerHTML = '<p>No hay campañas para gestionar.</p>';
            } else {
                listaCampanas.innerHTML = '';
                datos.forEach(campana => {
                    const divCampana = document.createElement('div');
                    divCampana.className = 'card'; // Clase CSS para el estilo de la tarjeta
                    divCampana.innerHTML = `
                        <h3>${campana.nombre}</h3>
                        <p>${campana.descripcion ? campana.descripcion.substring(0, 100) + '...' : 'Sin descripción'}</p>
                        <p><strong>Ubicación:</strong> ${campana.ubicacion}</p>
                        <p><strong>Fecha:</strong> ${campana.fechaInicio} al ${campana.fechaFin}</p>
                        <p><strong>Estado:</strong> ${campana.estado}</p>
                        <button onclick="editarCampana('${campana.id}')">Editar</button>
                        <button onclick="eliminarCampana('${campana.id}')" class="delete-button">Eliminar</button>
                    `;
                    listaCampanas.appendChild(divCampana);
                });
            }
        } else {
            mostrarMensaje('admin-campaigns-message', datos.mensaje || 'Error al cargar campañas para admin.', true);
        }
    } catch (error) {
        mostrarMensaje('admin-campaigns-message', `Error de red: ${error.message}`, true);
        console.error("Error al cargar campañas para admin:", error);
    }
}

/**
 * Muestra el formulario modal para crear una nueva campaña.
 * Resetea el formulario y configura el botón para la acción de creación.
 */
function mostrarFormularioCrearCampana() {
    const formulario = document.getElementById('campaign-admin-form');
    formulario.reset(); // Limpiar el formulario
    document.getElementById('campaign-form-title').textContent = 'Crear Nueva Campaña';
    document.getElementById('campaign-form-submit-button').textContent = 'Crear Campaña';
    document.getElementById('campaign-form-submit-button').onclick = crearCampana; // Asignar la función de creación
    document.getElementById('campaign-form-submit-button').dataset.mode = 'create'; // Establecer el modo
    document.getElementById('admin-campaign-id').value = ''; // Asegurar que no hay ID (para creación)
    document.getElementById('admin-campaign-estado').value = 'PLANIFICADA'; // Establecer estado por defecto
    ocultarMensajes('campaign-form-message');
    mostrarModal('campaign-form-modal');
}

/**
 * Función auxiliar para formatear una fecha de 'YYYY-MM-DD' (del input date) a 'DD/MM/YYYY' (para el backend).
 * @param {string} dateString - La fecha en formato 'YYYY-MM-DD'.
 * @returns {string|null} La fecha formateada o null si es inválida.
 */
function formatDateToDDMMYYYY(dateString) {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

/**
 * Función auxiliar para formatear una fecha de 'DD/MM/YYYY' (del backend) a 'YYYY-MM-DD' (para el input date).
 * También maneja el caso en que la fecha ya esté en```javascript
// app.js
// Archivo JavaScript principal para la aplicación de Gestión de Campañas de Limpieza

// URL base de la API de tu backend Spring Boot
const API_BASE_URL = 'http://localhost:8080/api';
// Variable global para almacenar los datos del usuario autenticado
let usuarioActual = null;

// --- Funciones de Utilidad ---

/**
 * Muestra una sección específica de la interfaz de usuario y oculta todas las demás.
 * @param {string} idSeccion - El ID de la sección HTML a mostrar.
 */
function mostrarSeccion(idSeccion) {
    // Oculta todas las secciones dentro del elemento 'main'
    document.querySelectorAll('main section').forEach(seccion => {
        seccion.style.display = 'none';
    });
    // Muestra la sección con el ID especificado
    document.getElementById(idSeccion).style.display = 'block';
}

/**
 * Actualiza la visibilidad de los elementos de navegación según el estado de autenticación
 * y el rol del usuario.
 */
function actualizarNavegacion() {
    // Obtener referencias a todos los elementos de navegación
    const navIniciarSesion = document.getElementById('nav-login');
    const navRegistrarse = document.getElementById('nav-register');
    const navMiPerfil = document.getElementById('nav-profile');
    const navCampanas = document.getElementById('nav-campaigns');
    const navGestionCampanasAdmin = document.getElementById('nav-admin-campaigns');
    const navVoluntariosAdmin = document.getElementById('nav-volunteers');
    const navReportesAdmin = document.getElementById('nav-reports-admin'); // ID corregido
    const navCalendario = document.getElementById('nav-calendar');
    const navNotificaciones = document.getElementById('nav-notifications');
    const navCerrarSesion = document.getElementById('nav-logout');
    const infoUsuarioSpan = document.getElementById('user-info'); // Para mostrar el nombre de usuario

    if (usuarioActual) {
        // Usuario autenticado: Ocultar opciones de no logeado, mostrar opciones de logeado
        navIniciarSesion.style.display = 'none';
        navRegistrarse.style.display = 'none';

        navMiPerfil.style.display = 'block';
        navCampanas.style.display = 'block';
        navCalendario.style.display = 'block';
        navNotificaciones.style.display = 'block';
        navCerrarSesion.style.display = 'block';
        infoUsuarioSpan.textContent = `Bienvenido, ${usuarioActual.nombreUsuario}`;

        // Opciones específicas para el rol de ADMINISTRADOR
        if (usuarioActual.rol === 'ADMIN') {
            navGestionCampanasAdmin.style.display = 'block';
            navVoluntariosAdmin.style.display = 'block';
            navReportesAdmin.style.display = 'block'; // Mostrar opción de reportes para Admin
        } else {
            // Ocultar opciones de admin para otros roles
            navGestionCampanasAdmin.style.display = 'none';
            navVoluntariosAdmin.style.display = 'none';
            navReportesAdmin.style.display = 'none';
        }
    } else {
        // Usuario no autenticado: Mostrar opciones de no logeado, ocultar todas las demás
        navIniciarSesion.style.display = 'block';
        navRegistrarse.style.display = 'block';

        navMiPerfil.style.display = 'none';
        navCampanas.style.display = 'none';
        navGestionCampanasAdmin.style.display = 'none';
        navVoluntariosAdmin.style.display = 'none';
        navReportesAdmin.style.display = 'none';
        navCalendario.style.display = 'none';
        navNotificaciones.style.display = 'none';
        navCerrarSesion.style.display = 'none';
        infoUsuarioSpan.textContent = ''; // Limpiar información de usuario
        mostrarIniciarSesion(); // Por defecto, si no hay usuario, mostrar la sección de login
    }
}

/**
 * Muestra un mensaje de retroalimentación al usuario en un elemento HTML específico.
 * @param {string} idElemento - El ID del elemento HTML donde se mostrará el mensaje.
 * @param {string} mensaje - El texto del mensaje a mostrar.
 * @param {boolean} esError - True si el mensaje es un error (para aplicar estilos de error).
 */
function mostrarMensaje(idElemento, mensaje, esError = false) {
    const elemento = document.getElementById(idElemento);
    if (!elemento) {
        console.error(`Elemento con ID '${idElemento}' no encontrado para mostrar mensaje.`);
        return;
    }
    elemento.textContent = mensaje; // Establecer el texto del mensaje
    elemento.className = esError ? 'message error' : 'message success'; // Aplicar clase CSS para estilo
    elemento.style.display = 'block'; // Asegurarse de que el mensaje sea visible
    // Opcional: ocultar el mensaje después de X segundos (descomentar si se desea)
    // setTimeout(() => { elemento.style.display = 'none'; }, 5000);
}

/**
 * Oculta un mensaje de retroalimentación en un elemento HTML específico.
 * @param {string} idElemento - El ID del elemento HTML cuyo mensaje se ocultará.
 */
function ocultarMensajes(idElemento) {
    const elemento = document.getElementById(idElemento);
    if (elemento) {
        elemento.textContent = ''; // Limpiar el texto
        elemento.style.display = 'none'; // Ocultar el elemento
    }
}

/**
 * Muestra un modal (elemento con display: none por defecto).
 * @param {string} idModal - El ID del modal a mostrar.
 */
function mostrarModal(idModal) {
    document.getElementById(idModal).style.display = 'block';
}

/**
 * Cierra un modal y limpia los mensajes asociados.
 * @param {string} idModal - El ID del modal a cerrar.
 */
function cerrarModal(idModal) {
    document.getElementById(idModal).style.display = 'none';
    // Limpiar mensajes específicos de modales al cerrarlos
    ocultarMensajes('modal-action-message');
    ocultarMensajes('campaign-form-message');
}

// --- Autenticación y Estado de la Sesión ---

/**
 * Función auxiliar para manejar el éxito del login, guardando el token y actualizando la UI.
 * @param {object} userData - Los datos del usuario (incluyendo el token JWT si aplica).
 */
function handleLoginSuccess(userData) {
    // Si el backend devuelve un token JWT, guárdalo
    if (userData.jwtToken) {
        localStorage.setItem('jwtToken', userData.jwtToken);
    }
    // Guarda los datos del usuario (sin el token si no quieres que esté en usuarioActual)
    usuarioActual = { ...userData }; // Copia los datos del usuario
    delete usuarioActual.jwtToken; // Elimina el token del objeto usuarioActual si lo tenía

    actualizarNavegacion();
    // Redirigir al perfil o a la sección principal tras un login exitoso
    mostrarPerfil(); // O podrías mostrarCampanas()
    // Limpiar los parámetros de la URL una vez procesados
    history.replaceState({}, document.title, window.location.pathname);
}

/**
 * Verifica el estado de autenticación del usuario al cargar la página o después de acciones de login/logout.
 * Realiza una petición a un endpoint protegido para obtener los datos del usuario autenticado.
 */
async function verificarEstadoAutenticacion() {
    try {
        ocultarMensajes('login-message'); // Limpiar mensajes de login previos

        // Verificar si hay parámetros de URL de Spring Security (ej. ?error o ?logout)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('error')) {
            mostrarMensaje('login-message', 'Credenciales inválidas. Por favor, inténtalo de nuevo.', true);
        } else if (urlParams.has('logout')) {
            mostrarMensaje('login-message', 'Has cerrado sesión exitosamente.', false);
        }

        // Si usas JWT y lo tienes en localStorage, verifica si es válido
        const token = localStorage.getItem('jwtToken');
        if (token) {
            // Realizar una petición a un endpoint protegido (ej. /api/usuarios/me)
            // para obtener los datos del usuario autenticado y validar el token.
            const respuesta = await fetch(`${API_BASE_URL}/usuarios/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (respuesta.ok) {
                // Token válido y usuario autenticado: obtener sus detalles y actualizar la UI
                const userData = await respuesta.json();
                handleLoginSuccess({ ...userData, jwtToken: token }); // Re-añadir token si lo necesitas en handleLoginSuccess
            } else {
                // Token inválido o expirado: limpiar token y estado, mostrar login
                localStorage.removeItem('jwtToken'); // Eliminar token inválido
                usuarioActual = null;
                actualizarNavegacion();
                mostrarIniciarSesion();
            }
        } else {
            // No hay token en localStorage: no autenticado
            usuarioActual = null;
            actualizarNavegacion();
            mostrarIniciarSesion();
        }
    } catch (error) {
        console.error("Error al verificar estado de autenticación:", error);
        localStorage.removeItem('jwtToken'); // En caso de error de red, limpiar token por si acaso
        usuarioActual = null;
        actualizarNavegacion();
        mostrarMensaje('login-message', 'Error de conexión con el servidor. Inténtalo más tarde.', true);
        mostrarIniciarSesion();
    }
}

/**
 * Maneja el proceso de inicio de sesión.
 * Envía las credenciales al backend y guarda el token JWT si la autenticación es exitosa.
 * @param {Event} evento - El evento de envío del formulario.
 */
async function iniciarSesion(evento) {
    evento.preventDefault(); // Prevenir el envío por defecto del formulario HTML
    const formulario = document.getElementById('login-form');
    const datosFormulario = new FormData(formulario);
    const credenciales = Object.fromEntries(datosFormulario.entries());

    ocultarMensajes('login-message'); // Limpiar mensaje previo

    try {
        // Realizar la petición POST al endpoint de login de tu backend
        // Asume que tu backend tiene un endpoint como /api/auth/login que devuelve un JWT
        const respuesta = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credenciales)
        });

        // Intentar parsear la respuesta JSON, incluso si es un error, por si el backend envía un mensaje
        const datos = await respuesta.json().catch(() => ({ message: respuesta.statusText || 'Error desconocido' }));

        if (respuesta.ok) { // Código de estado 200-299
            // Si el login es exitoso, los datos deberían contener el token JWT y la información del usuario
            handleLoginSuccess(datos); // Llama a la función para guardar token y actualizar UI
            mostrarMensaje('login-message', '¡Inicio de sesión exitoso!', false);
        } else { // Código de estado 4xx o 5xx
            // Si el backend envía un mensaje de error en el JSON, usarlo
            mostrarMensaje('login-message', datos.message || 'Credenciales inválidas. Inténtalo de nuevo.', true);
        }
    } catch (error) {
        // Manejo de errores de red o JSON inválido
        mostrarMensaje('login-message', `Error de red: ${error.message}. Verifica tu conexión o el servidor.`, true);
    }
}


/**
 * Maneja el proceso de registro de nuevos usuarios.
 * @param {Event} evento - El evento de envío del formulario.
 */
async function registrar(evento) {
    evento.preventDefault(); // Prevenir el envío por defecto del formulario HTML
    const formulario = document.getElementById('register-form');
    const datosFormulario = new FormData(formulario);
    const datosUsuario = Object.fromEntries(datosFormulario.entries());

    // Asignar rol por defecto (los registros desde aquí siempre son voluntarios)
    datosUsuario.rol = 'VOLUNTARIO';

    // Validar que la contraseña no esté vacía
    if (!datosUsuario.contrasena || datosUsuario.contrasena.trim() === '') {
        mostrarMensaje('register-message', 'La contraseña no puede estar vacía.', true);
        return;
    }

    ocultarMensajes('register-message'); // Limpiar mensaje previo

    try {
        const respuesta = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosUsuario)
        });

        // Intentar parsear la respuesta JSON, incluso si es un error, por si el backend envía un mensaje
        const datos = await respuesta.json().catch(() => ({ mensaje: respuesta.statusText || 'Error desconocido' }));

        if (respuesta.ok) { // Código de estado 200-299
            mostrarMensaje('register-message', '¡Registro exitoso! Ahora puedes iniciar sesión.', false);
            formulario.reset(); // Limpiar el formulario después del éxito
            mostrarIniciarSesion(); // Redirigir al usuario a la sección de login
        } else { // Código de estado 4xx o 5xx
            // Si el backend envía un mensaje de error en el JSON, usarlo
            mostrarMensaje('register-message', datos.mensaje || 'Error en el registro. Inténtalo de nuevo.', true);
        }
    } catch (error) {
        // Manejo de errores de red o JSON inválido
        mostrarMensaje('register-message', `Error de red: ${error.message}. Verifica tu conexión o el servidor.`, true);
        console.error("Error al registrar:", error);
    }
}

/**
 * Maneja el proceso de cierre de sesión.
 * Realiza un POST a la URL de logout de Spring Security.
 */
async function cerrarSesion() {
    try {
        // Si usas JWT, deberías eliminarlo de localStorage
        localStorage.removeItem('jwtToken');

        // Spring Security espera un POST a /logout para invalidar la sesión
        // Si usas JWT puro, este endpoint puede no ser necesario o tener otra lógica.
        const respuesta = await fetch('/logout', {
            method: 'POST',
            // Es buena práctica incluir el token CSRF si lo tienes habilitado en Spring Security
            // headers: { 'X-CSRF-TOKEN': obtenerCsrfToken() } // Implementar obtenerCsrfToken si es necesario
        });

        if (respuesta.ok) {
            // Logout exitoso, limpiar estado del frontend
            usuarioActual = null;
            actualizarNavegacion();
            // Redirigir para que Spring Security complete el proceso y limpie la sesión del navegador
            window.location.href = '/?logout';
        } else {
            console.error("Error al cerrar sesión:", respuesta.status, respuesta.statusText);
            // Usar mostrarMensaje o un modal personalizado en lugar de alert()
            alert('Error al cerrar sesión. Por favor, inténtalo de nuevo.');
        }
    } catch (error) {
        console.error("Error de red al cerrar sesión:", error);
        alert('Error de conexión al intentar cerrar sesión. Inténtalo más tarde.');
    }
}

// --- Vistas de Navegación ---

function mostrarIniciarSesion() {
    mostrarSeccion('login-section');
    ocultarMensajes('login-message');
}

function mostrarRegistrarse() {
    mostrarSeccion('register-section');
    ocultarMensajes('register-message');
    document.getElementById('register-form').reset(); // Limpiar formulario al mostrar
}

// --- Perfil de Usuario ---

/**
 * Muestra la sección del perfil del usuario y rellena el formulario con los datos del usuario actual.
 */
async function mostrarPerfil() {
    if (!usuarioActual) { mostrarIniciarSesion(); return; }
    mostrarSeccion('profile-section');
    // Rellenar formulario de perfil con los datos del usuario actual
    document.getElementById('profile-id').value = usuarioActual.id;
    document.getElementById('profile-username').value = usuarioActual.nombreUsuario;
    document.getElementById('profile-nombre').value = usuarioActual.nombre;
    document.getElementById('profile-apellido').value = usuarioActual.apellido;
    document.getElementById('profile-email').value = usuarioActual.email;
    document.getElementById('profile-telefono').value = usuarioActual.telefono || ''; // Manejar valor nulo
    document.getElementById('profile-rol').value = usuarioActual.rol;
    document.getElementById('profile-calificacion').value = usuarioActual.calificacion !== undefined ? usuarioActual.calificacion.toFixed(1) : 'N/A';
    document.getElementById('profile-activo').checked = usuarioActual.activo;

    // Limpiar mensajes y formulario de cambio de contraseña al mostrar el perfil
    ocultarMensajes('profile-message');
    ocultarMensajes('change-password-message');
    document.getElementById('change-password-form').reset();
}

/**
 * Actualiza la información del perfil del usuario.
 * @param {Event} evento - El evento de envío del formulario.
 */
async function actualizarPerfil(evento) {
    evento.preventDefault();
    if (!usuarioActual) { mostrarIniciarSesion(); return; }

    const datosPerfil = {
        id: usuarioActual.id,
        nombreUsuario: usuarioActual.nombreUsuario, // No se permite cambiar desde el frontend
        nombre: document.getElementById('profile-nombre').value.trim(),
        apellido: document.getElementById('profile-apellido').value.trim(),
        email: document.getElementById('profile-email').value.trim(),
        telefono: document.getElementById('profile-telefono').value.trim(),
        rol: usuarioActual.rol, // No se permite cambiar desde el frontend
        calificacion: usuarioActual.calificacion, // No se permite cambiar desde el frontend
        activo: usuarioActual.activo // No se permite cambiar desde el frontend
    };
    ocultarMensajes('profile-message');

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/usuarios/${usuarioActual.id}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(datosPerfil)
        });

        const datos = await respuesta.json().catch(() => ({ mensaje: respuesta.statusText || 'Error desconocido' }));

        if (respuesta.ok) {
            usuarioActual = datos; // Actualizar el objeto de usuario actual con los datos modificados del backend
            mostrarMensaje('profile-message', '¡Perfil actualizado exitosamente!', false);
            actualizarNavegacion(); // Para actualizar el nombre de usuario si se muestra en la navegación
            mostrarPerfil(); // Re-renderizar perfil con los nuevos datos (útil para campos disabled)
        } else {
            mostrarMensaje('profile-message', datos.mensaje || 'Error al actualizar el perfil.', true);
        }
    } catch (error) {
        mostrarMensaje('profile-message', `Error de red: ${error.message}`, true);
        console.error("Error al actualizar perfil:", error);
    }
}

/**
 * Cambia la contraseña del usuario.
 * @param {Event} evento - El evento de envío del formulario.
 */
async function cambiarContrasena(evento) {
    evento.preventDefault();
    if (!usuarioActual) { mostrarIniciarSesion(); return; }

    const contrasenaActual = document.getElementById('current-password').value;
    const nuevaContrasena = document.getElementById('new-password').value;
    const confirmarNuevaContrasena = document.getElementById('confirm-new-password').value;
    ocultarMensajes('change-password-message');

    if (nuevaContrasena !== confirmarNuevaContrasena) {
        mostrarMensaje('change-password-message', 'Las nuevas contraseñas no coinciden.', true);
        return;
    }
    if (nuevaContrasena.trim() === '' || contrasenaActual.trim() === '') {
        mostrarMensaje('change-password-message', 'Las contraseñas no pueden estar vacías.', true);
        return;
    }

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/auth/change-password`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                userId: usuarioActual.id, // ID del usuario logeado
                currentPassword: contrasenaActual,
                newPassword: nuevaContrasena
            })
        });

        const datos = await respuesta.json().catch(() => ({ mensaje: 'Respuesta inválida del servidor.' }));

        if (respuesta.ok) {
            mostrarMensaje('change-password-message', '¡Contraseña cambiada exitosamente!', false);
            document.getElementById('change-password-form').reset(); // Limpiar el formulario
        } else {
            mostrarMensaje('change-password-message', datos.mensaje || 'Error al cambiar la contraseña. Verifica tu contraseña actual.', true);
        }
    } catch (error) {
        mostrarMensaje('change-password-message', `Error de red: ${error.message}`, true);
        console.error("Error al cambiar contraseña:", error);
    }
}

// --- Campañas (para Voluntarios) ---

/**
 * Muestra la sección de campañas disponibles para voluntarios.
 * Carga las campañas desde el backend y las muestra en cards.
 */
async function mostrarCampanas() {
    if (!usuarioActual) { mostrarIniciarSesion(); return; }
    mostrarSeccion('campaigns-section');
    const listaCampanas = document.getElementById('campaigns-list');
    ocultarMensajes('campaigns-message');
    listaCampanas.innerHTML = '<p>Cargando campañas...</p>'; // Mensaje de carga inicial

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/campanas`, { headers });
        const datos = await respuesta.json().catch(() => ({ mensaje: 'Respuesta inválida del servidor al cargar campañas.' }));

        if (respuesta.ok) {
            if (datos.length === 0) {
                listaCampanas.innerHTML = '<p>No hay campañas disponibles en este momento.</p>';
            } else {
                listaCampanas.innerHTML = ''; // Limpiar contenido previo
                datos.forEach(campana => {
                    const divCampana = document.createElement('div');
                    divCampana.className = 'card'; // Clase CSS para el estilo de la tarjeta
                    divCampana.innerHTML = `
                        <h3>${campana.nombre}</h3>
                        <p>${campana.descripcion ? campana.descripcion.substring(0, 100) + '...' : 'Sin descripción'}</p>
                        <p><strong>Ubicación:</strong> ${campana.ubicacion}</p>
                        <p><strong>Fecha:</strong> ${campana.fechaInicio} al ${campana.fechaFin}</p>
                        <p><strong>Estado:</strong> ${campana.estado}</p>
                        <button onclick="mostrarDetallesCampana('${campana.id}', false)">Ver Detalles</button>
                    `;
                    listaCampanas.appendChild(divCampana);
                });
            }
        } else {
            mostrarMensaje('campaigns-message', datos.mensaje || 'Error al cargar campañas.', true);
        }
    } catch (error) {
        mostrarMensaje('campaigns-message', `Error de red: ${error.message}`, true);
        console.error("Error al cargar campañas:", error);
    }
}

/**
 * Muestra los detalles de una campaña en un modal.
 * @param {string} idCampana - El ID de la campaña a mostrar.
 * @param {boolean} esContextoAdmin - Indica si la vista se abre desde el contexto de administración.
 */
async function mostrarDetallesCampana(idCampana, esContextoAdmin) {
    if (!usuarioActual) { mostrarIniciarSesion(); return; }
    const modal = document.getElementById('campaign-details-modal');
    const titulo = document.getElementById('modal-campaign-title');
    const descripcion = document.getElementById('modal-campaign-description');
    const ubicacion = document.getElementById('modal-campaign-ubicacion');
    const fechaInicio = document.getElementById('modal-campaign-fechaInicio');
    const fechaFin = document.getElementById('modal-campaign-fechaFin');
    const estado = document.getElementById('modal-campaign-estado');
    const divEvidencias = document.getElementById('modal-campaign-evidences');
    const botonAccion = document.getElementById('modal-campaign-action-button');
    ocultarMensajes('modal-action-message'); // Limpiar mensaje previo

    // Limpiar y resetear el contenido del modal
    titulo.textContent = 'Cargando...';
    descripcion.textContent = '';
    ubicacion.textContent = '';
    fechaInicio.textContent = '';
    fechaFin.textContent = '';
    estado.textContent = '';
    divEvidencias.innerHTML = '';
    botonAccion.style.display = 'none';

    mostrarModal('campaign-details-modal'); // Mostrar el modal

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/campanas/${idCampana}`, { headers });
        const campana = await respuesta.json().catch(() => ({ mensaje: 'Respuesta inválida del servidor al cargar detalles de campaña.' }));

        if (respuesta.ok) {
            // Rellenar el modal con los datos de la campaña
            titulo.textContent = campana.nombre;
            descripcion.textContent = campana.descripcion;
            ubicacion.textContent = campana.ubicacion;
            fechaInicio.textContent = campana.fechaInicio; // Asume que el formato es legible
            fechaFin.textContent = campana.fechaFin;     // Asume que el formato es legible
            estado.textContent = campana.estado;

            // Placeholder para evidencias (si se implementa en el futuro)
            divEvidencias.innerHTML = '<p>No hay evidencias para esta campaña.</p>';

            // Lógica para el botón de inscripción/anulación (solo para voluntarios y fuera del contexto admin)
            if (!esContextoAdmin && usuarioActual.rol === 'VOLUNTARIO') {
                const respuestaInscripcion = await fetch(`${API_BASE_URL}/campanas/${campana.id}/inscrito/${usuarioActual.id}`);
                let estaInscrito = false;
                if (respuestaInscripcion.ok) {
                    estaInscrito = await respuestaInscripcion.json();
                } else {
                    console.warn(`No se pudo verificar la inscripción para campaña ${campana.id}:`, respuestaInscripcion.status);
                }

                botonAccion.style.display = 'block';
                if (estaInscrito) {
                    botonAccion.textContent = 'Anular Inscripción';
                    botonAccion.onclick = () => anularInscripcion(campana.id);
                } else {
                    botonAccion.textContent = 'Inscribirse';
                    botonAccion.onclick = () => inscribirseCampana(campana.id);
                }
            } else {
                botonAccion.style.display = 'none'; // No mostrar el botón para admin o si no es voluntario
            }
        } else {
            mostrarMensaje('modal-action-message', campana.mensaje || 'Error al cargar detalles de la campaña.', true);
        }
    } catch (error) {
        mostrarMensaje('modal-action-message', `Error de red: ${error.message}`, true);
        console.error("Error al mostrar detalles de campaña:", error);
    }
}

/**
 * Inscribe al usuario actual (voluntario) en una campaña.
 * @param {string} idCampana - El ID de la campaña.
 */
async function inscribirseCampana(idCampana) {
    if (!usuarioActual || usuarioActual.rol !== 'VOLUNTARIO') {
        mostrarMensaje('modal-action-message', 'Debes ser un voluntario para inscribirte.', true);
        return;
    }
    mostrarMensaje('modal-action-message', 'Inscribiendo...');

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/campanas/${idCampana}/inscribir/${usuarioActual.id}`, {
            method: 'POST',
            headers: headers
        });

        const datos = await respuesta.json().catch(() => ({ mensaje: respuesta.statusText || 'Respuesta inválida del servidor.' }));

        if (respuesta.ok) {
            mostrarMensaje('modal-action-message', '¡Inscripción exitosa!', false);
            // Actualizar el botón a "Anular Inscripción"
            const botonAccion = document.getElementById('modal-campaign-action-button');
            botonAccion.textContent = 'Anular Inscripción';
            botonAccion.onclick = () => anularInscripcion(campana.id);
            // Recargar la lista de campañas si la sección está visible
            if (document.getElementById('campaigns-section').style.display === 'block') {
                mostrarCampanas();
            }
        } else {
            mostrarMensaje('modal-action-message', datos.mensaje || 'Error al inscribirse.', true);
        }
    } catch (error) {
        mostrarMensaje('modal-action-message', `Error de red: ${error.message}`, true);
        console.error("Error al inscribirse en campaña:", error);
    }
}

/**
 * Anula la inscripción del usuario actual (voluntario) en una campaña.
 * @param {string} idCampana - El ID de la campaña.
 */
async function anularInscripcion(idCampana) {
    if (!usuarioActual || usuarioActual.rol !== 'VOLUNTARIO') {
        mostrarMensaje('modal-action-message', 'Debes ser un voluntario para anular inscripción.', true);
        return;
    }
    mostrarMensaje('modal-action-message', 'Anulando inscripción...');

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/campanas/${idCampana}/anular/${usuarioActual.id}`, {
            method: 'DELETE',
            headers: headers
        });

        const datos = await respuesta.json().catch(() => ({ mensaje: respuesta.statusText || 'Respuesta inválida del servidor.' }));

        if (respuesta.ok) {
            mostrarMensaje('modal-action-message', '¡Inscripción anulada exitosamente!', false);
            // Actualizar el botón a "Inscribirse"
            const botonAccion = document.getElementById('modal-campaign-action-button');
            botonAccion.textContent = 'Inscribirse';
            botonAccion.onclick = () => inscribirseCampana(idCampana);
            // Recargar la lista de campañas si la sección está visible
            if (document.getElementById('campaigns-section').style.display === 'block') {
                mostrarCampanas();
            }
        } else {
            mostrarMensaje('modal-action-message', datos.mensaje || 'Error al anular inscripción.', true);
        }
    } catch (error) {
        mostrarMensaje('modal-action-message', `Error de red: ${error.message}`, true);
        console.error("Error al anular inscripción:", error);
    }
}


// --- Gestión de Campañas (para Administradores) ---

/**
 * Muestra la sección de gestión de campañas para administradores.
 * Carga todas las campañas desde el backend y las muestra con opciones de edición/eliminación.
 */
async function mostrarGestionCampanasAdmin() {
    if (!usuarioActual || usuarioActual.rol !== 'ADMIN') { mostrarIniciarSesion(); return; }
    mostrarSeccion('admin-campaigns-section');
    const listaCampanas = document.getElementById('admin-campaigns-list');
    ocultarMensajes('admin-campaigns-message');
    listaCampanas.innerHTML = '<p>Cargando campañas para administración...</p>';

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/campanas`, { headers }); // Asume que un admin puede ver todas las campañas
        const datos = await respuesta.json().catch(() => ({ mensaje: 'Respuesta inválida del servidor al cargar campañas para admin.' }));

        if (respuesta.ok) {
            if (datos.length === 0) {
                listaCampanas.innerHTML = '<p>No hay campañas para gestionar.</p>';
            } else {
                listaCampanas.innerHTML = '';
                datos.forEach(campana => {
                    const divCampana = document.createElement('div');
                    divCampana.className = 'card'; // Clase CSS para el estilo de la tarjeta
                    divCampana.innerHTML = `
                        <h3>${campana.nombre}</h3>
                        <p>${campana.descripcion ? campana.descripcion.substring(0, 100) + '...' : 'Sin descripción'}</p>
                        <p><strong>Ubicación:</strong> ${campana.ubicacion}</p>
                        <p><strong>Fecha:</strong> ${campana.fechaInicio} al ${campana.fechaFin}</p>
                        <p><strong>Estado:</strong> ${campana.estado}</p>
                        <button onclick="editarCampana('${campana.id}')">Editar</button>
                        <button onclick="eliminarCampana('${campana.id}')" class="delete-button">Eliminar</button>
                    `;
                    listaCampanas.appendChild(divCampana);
                });
            }
        } else {
            mostrarMensaje('admin-campaigns-message', datos.mensaje || 'Error al cargar campañas para admin.', true);
        }
    } catch (error) {
        mostrarMensaje('admin-campaigns-message', `Error de red: ${error.message}`, true);
        console.error("Error al cargar campañas para admin:", error);
    }
}

/**
 * Muestra el formulario modal para crear una nueva campaña.
 * Resetea el formulario y configura el botón para la acción de creación.
 */
function mostrarFormularioCrearCampana() {
    const formulario = document.getElementById('campaign-admin-form');
    formulario.reset(); // Limpiar el formulario
    document.getElementById('campaign-form-title').textContent = 'Crear Nueva Campaña';
    document.getElementById('campaign-form-submit-button').textContent = 'Crear Campaña';
    document.getElementById('campaign-form-submit-button').onclick = crearCampana; // Asignar la función de creación
    document.getElementById('campaign-form-submit-button').dataset.mode = 'create'; // Establecer el modo
    document.getElementById('admin-campaign-id').value = ''; // Asegurar que no hay ID (para creación)
    document.getElementById('admin-campaign-estado').value = 'PLANIFICADA'; // Establecer estado por defecto
    ocultarMensajes('campaign-form-message');
    mostrarModal('campaign-form-modal');
}

/**
 * Función auxiliar para formatear una fecha de 'YYYY-MM-DD' (del input date) a 'DD/MM/YYYY' (para el backend).
 * @param {string} dateString - La fecha en formato 'YYYY-MM-DD'.
 * @returns {string|null} La fecha formateada o null si es inválida.
 */
function formatDateToDDMMYYYY(dateString) {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

/**
 * Función auxiliar para formatear una fecha de 'DD/MM/YYYY' (del backend) a 'YYYY-MM-DD' (para el input date).
 * También maneja el caso en que la fecha ya esté en```javascript
// app.js
// Archivo JavaScript principal para la aplicación de Gestión de Campañas de Limpieza

// URL base de la API de tu backend Spring Boot
const API_BASE_URL = 'http://localhost:8080/api';
// Variable global para almacenar los datos del usuario autenticado
let usuarioActual = null;

// --- Funciones de Utilidad ---

/**
 * Muestra una sección específica de la interfaz de usuario y oculta todas las demás.
 * @param {string} idSeccion - El ID de la sección HTML a mostrar.
 */
function mostrarSeccion(idSeccion) {
    // Oculta todas las secciones dentro del elemento 'main'
    document.querySelectorAll('main section').forEach(seccion => {
        seccion.style.display = 'none';
    });
    // Muestra la sección con el ID especificado
    document.getElementById(idSeccion).style.display = 'block';
}

/**
 * Actualiza la visibilidad de los elementos de navegación según el estado de autenticación
 * y el rol del usuario.
 */
function actualizarNavegacion() {
    // Obtener referencias a todos los elementos de navegación
    const navIniciarSesion = document.getElementById('nav-login');
    const navRegistrarse = document.getElementById('nav-register');
    const navMiPerfil = document.getElementById('nav-profile');
    const navCampanas = document.getElementById('nav-campaigns');
    const navGestionCampanasAdmin = document.getElementById('nav-admin-campaigns');
    const navVoluntariosAdmin = document.getElementById('nav-volunteers');
    const navReportesAdmin = document.getElementById('nav-reports-admin'); // ID corregido
    const navCalendario = document.getElementById('nav-calendar');
    const navNotificaciones = document.getElementById('nav-notifications');
    const navCerrarSesion = document.getElementById('nav-logout');
    const infoUsuarioSpan = document.getElementById('user-info'); // Para mostrar el nombre de usuario

    if (usuarioActual) {
        // Usuario autenticado: Ocultar opciones de no logeado, mostrar opciones de logeado
        navIniciarSesion.style.display = 'none';
        navRegistrarse.style.display = 'none';

        navMiPerfil.style.display = 'block';
        navCampanas.style.display = 'block';
        navCalendario.style.display = 'block';
        navNotificaciones.style.display = 'block';
        navCerrarSesion.style.display = 'block';
        infoUsuarioSpan.textContent = `Bienvenido, ${usuarioActual.nombreUsuario}`;

        // Opciones específicas para el rol de ADMINISTRADOR
        if (usuarioActual.rol === 'ADMIN') {
            navGestionCampanasAdmin.style.display = 'block';
            navVoluntariosAdmin.style.display = 'block';
            navReportesAdmin.style.display = 'block'; // Mostrar opción de reportes para Admin
        } else {
            // Ocultar opciones de admin para otros roles
            navGestionCampanasAdmin.style.display = 'none';
            navVoluntariosAdmin.style.display = 'none';
            navReportesAdmin.style.display = 'none';
        }
    } else {
        // Usuario no autenticado: Mostrar opciones de no logeado, ocultar todas las demás
        navIniciarSesion.style.display = 'block';
        navRegistrarse.style.display = 'block';

        navMiPerfil.style.display = 'none';
        navCampanas.style.display = 'none';
        navGestionCampanasAdmin.style.display = 'none';
        navVoluntariosAdmin.style.display = 'none';
        navReportesAdmin.style.display = 'none';
        navCalendario.style.display = 'none';
        navNotificaciones.style.display = 'none';
        navCerrarSesion.style.display = 'none';
        infoUsuarioSpan.textContent = ''; // Limpiar información de usuario
        mostrarIniciarSesion(); // Por defecto, si no hay usuario, mostrar la sección de login
    }
}

/**
 * Muestra un mensaje de retroalimentación al usuario en un elemento HTML específico.
 * @param {string} idElemento - El ID del elemento HTML donde se mostrará el mensaje.
 * @param {string} mensaje - El texto del mensaje a mostrar.
 * @param {boolean} esError - True si el mensaje es un error (para aplicar estilos de error).
 */
function mostrarMensaje(idElemento, mensaje, esError = false) {
    const elemento = document.getElementById(idElemento);
    if (!elemento) {
        console.error(`Elemento con ID '${idElemento}' no encontrado para mostrar mensaje.`);
        return;
    }
    elemento.textContent = mensaje; // Establecer el texto del mensaje
    elemento.className = esError ? 'message error' : 'message success'; // Aplicar clase CSS para estilo
    elemento.style.display = 'block'; // Asegurarse de que el mensaje sea visible
    // Opcional: ocultar el mensaje después de X segundos (descomentar si se desea)
    // setTimeout(() => { elemento.style.display = 'none'; }, 5000);
}

/**
 * Oculta un mensaje de retroalimentación en un elemento HTML específico.
 * @param {string} idElemento - El ID del elemento HTML cuyo mensaje se ocultará.
 */
function ocultarMensajes(idElemento) {
    const elemento = document.getElementById(idElemento);
    if (elemento) {
        elemento.textContent = ''; // Limpiar el texto
        elemento.style.display = 'none'; // Ocultar el elemento
    }
}

/**
 * Muestra un modal (elemento con display: none por defecto).
 * @param {string} idModal - El ID del modal a mostrar.
 */
function mostrarModal(idModal) {
    document.getElementById(idModal).style.display = 'block';
}

/**
 * Cierra un modal y limpia los mensajes asociados.
 * @param {string} idModal - El ID del modal a cerrar.
 */
function cerrarModal(idModal) {
    document.getElementById(idModal).style.display = 'none';
    // Limpiar mensajes específicos de modales al cerrarlos
    ocultarMensajes('modal-action-message');
    ocultarMensajes('campaign-form-message');
}

// --- Autenticación y Estado de la Sesión ---

/**
 * Función auxiliar para manejar el éxito del login, guardando el token y actualizando la UI.
 * @param {object} userData - Los datos del usuario (incluyendo el token JWT si aplica).
 */
function handleLoginSuccess(userData) {
    // Si el backend devuelve un token JWT, guárdalo
    if (userData.jwtToken) {
        localStorage.setItem('jwtToken', userData.jwtToken);
    }
    // Guarda los datos del usuario (sin el token si no quieres que esté en usuarioActual)
    usuarioActual = { ...userData }; // Copia los datos del usuario
    delete usuarioActual.jwtToken; // Elimina el token del objeto usuarioActual si lo tenía

    actualizarNavegacion();
    // Redirigir al perfil o a la sección principal tras un login exitoso
    mostrarPerfil(); // O podrías mostrarCampanas()
    // Limpiar los parámetros de la URL una vez procesados
    history.replaceState({}, document.title, window.location.pathname);
}

/**
 * Verifica el estado de autenticación del usuario al cargar la página o después de acciones de login/logout.
 * Realiza una petición a un endpoint protegido para obtener los datos del usuario autenticado.
 */
async function verificarEstadoAutenticacion() {
    try {
        ocultarMensajes('login-message'); // Limpiar mensajes de login previos

        // Verificar si hay parámetros de URL de Spring Security (ej. ?error o ?logout)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('error')) {
            mostrarMensaje('login-message', 'Credenciales inválidas. Por favor, inténtalo de nuevo.', true);
        } else if (urlParams.has('logout')) {
            mostrarMensaje('login-message', 'Has cerrado sesión exitosamente.', false);
        }

        // Si usas JWT y lo tienes en localStorage, verifica si es válido
        const token = localStorage.getItem('jwtToken');
        if (token) {
            // Realizar una petición a un endpoint protegido (ej. /api/usuarios/me)
            // para obtener los datos del usuario autenticado y validar el token.
            const respuesta = await fetch(`${API_BASE_URL}/usuarios/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (respuesta.ok) {
                // Token válido y usuario autenticado: obtener sus detalles y actualizar la UI
                const userData = await respuesta.json();
                handleLoginSuccess({ ...userData, jwtToken: token }); // Re-añadir token si lo necesitas en handleLoginSuccess
            } else {
                // Token inválido o expirado: limpiar token y estado, mostrar login
                localStorage.removeItem('jwtToken'); // Eliminar token inválido
                usuarioActual = null;
                actualizarNavegacion();
                mostrarIniciarSesion();
            }
        } else {
            // No hay token en localStorage: no autenticado
            usuarioActual = null;
            actualizarNavegacion();
            mostrarIniciarSesion();
        }
    } catch (error) {
        console.error("Error al verificar estado de autenticación:", error);
        localStorage.removeItem('jwtToken'); // En caso de error de red, limpiar token por si acaso
        usuarioActual = null;
        actualizarNavegacion();
        mostrarMensaje('login-message', 'Error de conexión con el servidor. Inténtalo más tarde.', true);
        mostrarIniciarSesion();
    }
}

/**
 * Maneja el proceso de inicio de sesión.
 * Envía las credenciales al backend y guarda el token JWT si la autenticación es exitosa.
 * @param {Event} evento - El evento de envío del formulario.
 */
async function iniciarSesion(evento) {
    evento.preventDefault(); // Prevenir el envío por defecto del formulario HTML
    const formulario = document.getElementById('login-form');
    const datosFormulario = new FormData(formulario);
    const credenciales = Object.fromEntries(datosFormulario.entries());

    ocultarMensajes('login-message'); // Limpiar mensaje previo

    try {
        // Realizar la petición POST al endpoint de login de tu backend
        // Asume que tu backend tiene un endpoint como /api/auth/login que devuelve un JWT
        const respuesta = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credenciales)
        });

        // Intentar parsear la respuesta JSON, incluso si es un error, por si el backend envía un mensaje
        const datos = await respuesta.json().catch(() => ({ message: respuesta.statusText || 'Error desconocido' }));

        if (respuesta.ok) { // Código de estado 200-299
            // Si el login es exitoso, los datos deberían contener el token JWT y la información del usuario
            handleLoginSuccess(datos); // Llama a la función para guardar token y actualizar UI
            mostrarMensaje('login-message', '¡Inicio de sesión exitoso!', false);
        } else { // Código de estado 4xx o 5xx
            // Si el backend envía un mensaje de error en el JSON, usarlo
            mostrarMensaje('login-message', datos.message || 'Credenciales inválidas. Inténtalo de nuevo.', true);
        }
    } catch (error) {
        // Manejo de errores de red o JSON inválido
        mostrarMensaje('login-message', `Error de red: ${error.message}. Verifica tu conexión o el servidor.`, true);
    }
}


/**
 * Maneja el proceso de registro de nuevos usuarios.
 * @param {Event} evento - El evento de envío del formulario.
 */
async function registrar(evento) {
    evento.preventDefault(); // Prevenir el envío por defecto del formulario HTML
    const formulario = document.getElementById('register-form');
    const datosFormulario = new FormData(formulario);
    const datosUsuario = Object.fromEntries(datosFormulario.entries());

    // Asignar rol por defecto (los registros desde aquí siempre son voluntarios)
    datosUsuario.rol = 'VOLUNTARIO';

    // Validar que la contraseña no esté vacía
    if (!datosUsuario.contrasena || datosUsuario.contrasena.trim() === '') {
        mostrarMensaje('register-message', 'La contraseña no puede estar vacía.', true);
        return;
    }

    ocultarMensajes('register-message'); // Limpiar mensaje previo

    try {
        const respuesta = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosUsuario)
        });

        // Intentar parsear la respuesta JSON, incluso si es un error, por si el backend envía un mensaje
        const datos = await respuesta.json().catch(() => ({ mensaje: respuesta.statusText || 'Error desconocido' }));

        if (respuesta.ok) { // Código de estado 200-299
            mostrarMensaje('register-message', '¡Registro exitoso! Ahora puedes iniciar sesión.', false);
            formulario.reset(); // Limpiar el formulario después del éxito
            mostrarIniciarSesion(); // Redirigir al usuario a la sección de login
        } else { // Código de estado 4xx o 5xx
            // Si el backend envía un mensaje de error en el JSON, usarlo
            mostrarMensaje('register-message', datos.mensaje || 'Error en el registro. Inténtalo de nuevo.', true);
        }
    } catch (error) {
        // Manejo de errores de red o JSON inválido
        mostrarMensaje('register-message', `Error de red: ${error.message}. Verifica tu conexión o el servidor.`, true);
        console.error("Error al registrar:", error);
    }
}

/**
 * Maneja el proceso de cierre de sesión.
 * Realiza un POST a la URL de logout de Spring Security.
 */
async function cerrarSesion() {
    try {
        // Si usas JWT, deberías eliminarlo de localStorage
        localStorage.removeItem('jwtToken');

        // Spring Security espera un POST a /logout para invalidar la sesión
        // Si usas JWT puro, este endpoint puede no ser necesario o tener otra lógica.
        const respuesta = await fetch('/logout', {
            method: 'POST',
            // Es buena práctica incluir el token CSRF si lo tienes habilitado en Spring Security
            // headers: { 'X-CSRF-TOKEN': obtenerCsrfToken() } // Implementar obtenerCsrfToken si es necesario
        });

        if (respuesta.ok) {
            // Logout exitoso, limpiar estado del frontend
            usuarioActual = null;
            actualizarNavegacion();
            // Redirigir para que Spring Security complete el proceso y limpie la sesión del navegador
            window.location.href = '/?logout';
        } else {
            console.error("Error al cerrar sesión:", respuesta.status, respuesta.statusText);
            // Usar mostrarMensaje o un modal personalizado en lugar de alert()
            alert('Error al cerrar sesión. Por favor, inténtalo de nuevo.');
        }
    } catch (error) {
        console.error("Error de red al cerrar sesión:", error);
        alert('Error de conexión al intentar cerrar sesión. Inténtalo más tarde.');
    }
}

// --- Vistas de Navegación ---

function mostrarIniciarSesion() {
    mostrarSeccion('login-section');
    ocultarMensajes('login-message');
}

function mostrarRegistrarse() {
    mostrarSeccion('register-section');
    ocultarMensajes('register-message');
    document.getElementById('register-form').reset(); // Limpiar formulario al mostrar
}

// --- Perfil de Usuario ---

/**
 * Muestra la sección del perfil del usuario y rellena el formulario con los datos del usuario actual.
 */
async function mostrarPerfil() {
    if (!usuarioActual) { mostrarIniciarSesion(); return; }
    mostrarSeccion('profile-section');
    // Rellenar formulario de perfil con los datos del usuario actual
    document.getElementById('profile-id').value = usuarioActual.id;
    document.getElementById('profile-username').value = usuarioActual.nombreUsuario;
    document.getElementById('profile-nombre').value = usuarioActual.nombre;
    document.getElementById('profile-apellido').value = usuarioActual.apellido;
    document.getElementById('profile-email').value = usuarioActual.email;
    document.getElementById('profile-telefono').value = usuarioActual.telefono || ''; // Manejar valor nulo
    document.getElementById('profile-rol').value = usuarioActual.rol;
    document.getElementById('profile-calificacion').value = usuarioActual.calificacion !== undefined ? usuarioActual.calificacion.toFixed(1) : 'N/A';
    document.getElementById('profile-activo').checked = usuarioActual.activo;

    // Limpiar mensajes y formulario de cambio de contraseña al mostrar el perfil
    ocultarMensajes('profile-message');
    ocultarMensajes('change-password-message');
    document.getElementById('change-password-form').reset();
}

/**
 * Actualiza la información del perfil del usuario.
 * @param {Event} evento - El evento de envío del formulario.
 */
async function actualizarPerfil(evento) {
    evento.preventDefault();
    if (!usuarioActual) { mostrarIniciarSesion(); return; }

    const datosPerfil = {
        id: usuarioActual.id,
        nombreUsuario: usuarioActual.nombreUsuario, // No se permite cambiar desde el frontend
        nombre: document.getElementById('profile-nombre').value.trim(),
        apellido: document.getElementById('profile-apellido').value.trim(),
        email: document.getElementById('profile-email').value.trim(),
        telefono: document.getElementById('profile-telefono').value.trim(),
        rol: usuarioActual.rol, // No se permite cambiar desde el frontend
        calificacion: usuarioActual.calificacion, // No se permite cambiar desde el frontend
        activo: usuarioActual.activo // No se permite cambiar desde el frontend
    };
    ocultarMensajes('profile-message');

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/usuarios/${usuarioActual.id}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(datosPerfil)
        });

        const datos = await respuesta.json().catch(() => ({ mensaje: respuesta.statusText || 'Error desconocido' }));

        if (respuesta.ok) {
            usuarioActual = datos; // Actualizar el objeto de usuario actual con los datos modificados del backend
            mostrarMensaje('profile-message', '¡Perfil actualizado exitosamente!', false);
            actualizarNavegacion(); // Para actualizar el nombre de usuario si se muestra en la navegación
            mostrarPerfil(); // Re-renderizar perfil con los nuevos datos (útil para campos disabled)
        } else {
            mostrarMensaje('profile-message', datos.mensaje || 'Error al actualizar el perfil.', true);
        }
    } catch (error) {
        mostrarMensaje('profile-message', `Error de red: ${error.message}`, true);
        console.error("Error al actualizar perfil:", error);
    }
}

/**
 * Cambia la contraseña del usuario.
 * @param {Event} evento - El evento de envío del formulario.
 */
async function cambiarContrasena(evento) {
    evento.preventDefault();
    if (!usuarioActual) { mostrarIniciarSesion(); return; }

    const contrasenaActual = document.getElementById('current-password').value;
    const nuevaContrasena = document.getElementById('new-password').value;
    const confirmarNuevaContrasena = document.getElementById('confirm-new-password').value;
    ocultarMensajes('change-password-message');

    if (nuevaContrasena !== confirmarNuevaContrasena) {
        mostrarMensaje('change-password-message', 'Las nuevas contraseñas no coinciden.', true);
        return;
    }
    if (nuevaContrasena.trim() === '' || contrasenaActual.trim() === '') {
        mostrarMensaje('change-password-message', 'Las contraseñas no pueden estar vacías.', true);
        return;
    }

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/auth/change-password`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                userId: usuarioActual.id, // ID del usuario logeado
                currentPassword: contrasenaActual,
                newPassword: nuevaContrasena
            })
        });

        const datos = await respuesta.json().catch(() => ({ mensaje: 'Respuesta inválida del servidor.' }));

        if (respuesta.ok) {
            mostrarMensaje('change-password-message', '¡Contraseña cambiada exitosamente!', false);
            document.getElementById('change-password-form').reset(); // Limpiar el formulario
        } else {
            mostrarMensaje('change-password-message', datos.mensaje || 'Error al cambiar la contraseña. Verifica tu contraseña actual.', true);
        }
    } catch (error) {
        mostrarMensaje('change-password-message', `Error de red: ${error.message}`, true);
        console.error("Error al cambiar contraseña:", error);
    }
}

// --- Campañas (para Voluntarios) ---

/**
 * Muestra la sección de campañas disponibles para voluntarios.
 * Carga las campañas desde el backend y las muestra en cards.
 */
async function mostrarCampanas() {
    if (!usuarioActual) { mostrarIniciarSesion(); return; }
    mostrarSeccion('campaigns-section');
    const listaCampanas = document.getElementById('campaigns-list');
    ocultarMensajes('campaigns-message');
    listaCampanas.innerHTML = '<p>Cargando campañas...</p>'; // Mensaje de carga inicial

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/campanas`, { headers });
        const datos = await respuesta.json().catch(() => ({ mensaje: 'Respuesta inválida del servidor al cargar campañas.' }));

        if (respuesta.ok) {
            if (datos.length === 0) {
                listaCampanas.innerHTML = '<p>No hay campañas disponibles en este momento.</p>';
            } else {
                listaCampanas.innerHTML = ''; // Limpiar contenido previo
                datos.forEach(campana => {
                    const divCampana = document.createElement('div');
                    divCampana.className = 'card'; // Clase CSS para el estilo de la tarjeta
                    divCampana.innerHTML = `
                        <h3>${campana.nombre}</h3>
                        <p>${campana.descripcion ? campana.descripcion.substring(0, 100) + '...' : 'Sin descripción'}</p>
                        <p><strong>Ubicación:</strong> ${campana.ubicacion}</p>
                        <p><strong>Fecha:</strong> ${campana.fechaInicio} al ${campana.fechaFin}</p>
                        <p><strong>Estado:</strong> ${campana.estado}</p>
                        <button onclick="mostrarDetallesCampana('${campana.id}', false)">Ver Detalles</button>
                    `;
                    listaCampanas.appendChild(divCampana);
                });
            }
        } else {
            mostrarMensaje('campaigns-message', datos.mensaje || 'Error al cargar campañas.', true);
        }
    } catch (error) {
        mostrarMensaje('campaigns-message', `Error de red: ${error.message}`, true);
        console.error("Error al cargar campañas:", error);
    }
}

/**
 * Muestra los detalles de una campaña en un modal.
 * @param {string} idCampana - El ID de la campaña a mostrar.
 * @param {boolean} esContextoAdmin - Indica si la vista se abre desde el contexto de administración.
 */
async function mostrarDetallesCampana(idCampana, esContextoAdmin) {
    if (!usuarioActual) { mostrarIniciarSesion(); return; }
    const modal = document.getElementById('campaign-details-modal');
    const titulo = document.getElementById('modal-campaign-title');
    const descripcion = document.getElementById('modal-campaign-description');
    const ubicacion = document.getElementById('modal-campaign-ubicacion');
    const fechaInicio = document.getElementById('modal-campaign-fechaInicio');
    const fechaFin = document.getElementById('modal-campaign-fechaFin');
    const estado = document.getElementById('modal-campaign-estado');
    const divEvidencias = document.getElementById('modal-campaign-evidences');
    const botonAccion = document.getElementById('modal-campaign-action-button');
    ocultarMensajes('modal-action-message'); // Limpiar mensaje previo

    // Limpiar y resetear el contenido del modal
    titulo.textContent = 'Cargando...';
    descripcion.textContent = '';
    ubicacion.textContent = '';
    fechaInicio.textContent = '';
    fechaFin.textContent = '';
    estado.textContent = '';
    divEvidencias.innerHTML = '';
    botonAccion.style.display = 'none';

    mostrarModal('campaign-details-modal'); // Mostrar el modal

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/campanas/${idCampana}`, { headers });
        const campana = await respuesta.json().catch(() => ({ mensaje: 'Respuesta inválida del servidor al cargar detalles de campaña.' }));

        if (respuesta.ok) {
            // Rellenar el modal con los datos de la campaña
            titulo.textContent = campana.nombre;
            descripcion.textContent = campana.descripcion;
            ubicacion.textContent = campana.ubicacion;
            fechaInicio.textContent = campana.fechaInicio; // Asume que el formato es legible
            fechaFin.textContent = campana.fechaFin;     // Asume que el formato es legible
            estado.textContent = campana.estado;

            // Placeholder para evidencias (si se implementa en el futuro)
            divEvidencias.innerHTML = '<p>No hay evidencias para esta campaña.</p>';

            // Lógica para el botón de inscripción/anulación (solo para voluntarios y fuera del contexto admin)
            if (!esContextoAdmin && usuarioActual.rol === 'VOLUNTARIO') {
                const respuestaInscripcion = await fetch(`${API_BASE_URL}/campanas/${campana.id}/inscrito/${usuarioActual.id}`);
                let estaInscrito = false;
                if (respuestaInscripcion.ok) {
                    estaInscrito = await respuestaInscripcion.json();
                } else {
                    console.warn(`No se pudo verificar la inscripción para campaña ${campana.id}:`, respuestaInscripcion.status);
                }

                botonAccion.style.display = 'block';
                if (estaInscrito) {
                    botonAccion.textContent = 'Anular Inscripción';
                    botonAccion.onclick = () => anularInscripcion(campana.id);
                } else {
                    botonAccion.textContent = 'Inscribirse';
                    botonAccion.onclick = () => inscribirseCampana(campana.id);
                }
            } else {
                botonAccion.style.display = 'none'; // No mostrar el botón para admin o si no es voluntario
            }
        } else {
            mostrarMensaje('modal-action-message', campana.mensaje || 'Error al cargar detalles de la campaña.', true);
        }
    } catch (error) {
        mostrarMensaje('modal-action-message', `Error de red: ${error.message}`, true);
        console.error("Error al mostrar detalles de campaña:", error);
    }
}

/**
 * Inscribe al usuario actual (voluntario) en una campaña.
 * @param {string} idCampana - El ID de la campaña.
 */
async function inscribirseCampana(idCampana) {
    if (!usuarioActual || usuarioActual.rol !== 'VOLUNTARIO') {
        mostrarMensaje('modal-action-message', 'Debes ser un voluntario para inscribirte.', true);
        return;
    }
    mostrarMensaje('modal-action-message', 'Inscribiendo...');

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/campanas/${idCampana}/inscribir/${usuarioActual.id}`, {
            method: 'POST',
            headers: headers
        });

        const datos = await respuesta.json().catch(() => ({ mensaje: respuesta.statusText || 'Respuesta inválida del servidor.' }));

        if (respuesta.ok) {
            mostrarMensaje('modal-action-message', '¡Inscripción exitosa!', false);
            // Actualizar el botón a "Anular Inscripción"
            const botonAccion = document.getElementById('modal-campaign-action-button');
            botonAccion.textContent = 'Anular Inscripción';
            botonAccion.onclick = () => anularInscripcion(campana.id);
            // Recargar la lista de campañas si la sección está visible
            if (document.getElementById('campaigns-section').style.display === 'block') {
                mostrarCampanas();
            }
        } else {
            mostrarMensaje('modal-action-message', datos.mensaje || 'Error al inscribirse.', true);
        }
    } catch (error) {
        mostrarMensaje('modal-action-message', `Error de red: ${error.message}`, true);
        console.error("Error al inscribirse en campaña:", error);
    }
}

/**
 * Anula la inscripción del usuario actual (voluntario) en una campaña.
 * @param {string} idCampana - El ID de la campaña.
 */
async function anularInscripcion(idCampana) {
    if (!usuarioActual || usuarioActual.rol !== 'VOLUNTARIO') {
        mostrarMensaje('modal-action-message', 'Debes ser un voluntario para anular inscripción.', true);
        return;
    }
    mostrarMensaje('modal-action-message', 'Anulando inscripción...');

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/campanas/${idCampana}/anular/${usuarioActual.id}`, {
            method: 'DELETE',
            headers: headers
        });

        const datos = await respuesta.json().catch(() => ({ mensaje: respuesta.statusText || 'Respuesta inválida del servidor.' }));

        if (respuesta.ok) {
            mostrarMensaje('modal-action-message', '¡Inscripción anulada exitosamente!', false);
            // Actualizar el botón a "Inscribirse"
            const botonAccion = document.getElementById('modal-campaign-action-button');
            botonAccion.textContent = 'Inscribirse';
            botonAccion.onclick = () => inscribirseCampana(idCampana);
            // Recargar la lista de campañas si la sección está visible
            if (document.getElementById('campaigns-section').style.display === 'block') {
                mostrarCampanas();
            }
        } else {
            mostrarMensaje('modal-action-message', datos.mensaje || 'Error al anular inscripción.', true);
        }
    } catch (error) {
        mostrarMensaje('modal-action-message', `Error de red: ${error.message}`, true);
        console.error("Error al anular inscripción:", error);
    }
}


// --- Gestión de Campañas (para Administradores) ---

/**
 * Muestra la sección de gestión de campañas para administradores.
 * Carga todas las campañas desde el backend y las muestra con opciones de edición/eliminación.
 */
async function mostrarGestionCampanasAdmin() {
    if (!usuarioActual || usuarioActual.rol !== 'ADMIN') { mostrarIniciarSesion(); return; }
    mostrarSeccion('admin-campaigns-section');
    const listaCampanas = document.getElementById('admin-campaigns-list');
    ocultarMensajes('admin-campaigns-message');
    listaCampanas.innerHTML = '<p>Cargando campañas para administración...</p>';

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/campanas`, { headers }); // Asume que un admin puede ver todas las campañas
        const datos = await respuesta.json().catch(() => ({ mensaje: 'Respuesta inválida del servidor al cargar campañas para admin.' }));

        if (respuesta.ok) {
            if (datos.length === 0) {
                listaCampanas.innerHTML = '<p>No hay campañas para gestionar.</p>';
            } else {
                listaCampanas.innerHTML = '';
                datos.forEach(campana => {
                    const divCampana = document.createElement('div');
                    divCampana.className = 'card'; // Clase CSS para el estilo de la tarjeta
                    divCampana.innerHTML = `
                        <h3>${campana.nombre}</h3>
                        <p>${campana.descripcion ? campana.descripcion.substring(0, 100) + '...' : 'Sin descripción'}</p>
                        <p><strong>Ubicación:</strong> ${campana.ubicacion}</p>
                        <p><strong>Fecha:</strong> ${campana.fechaInicio} al ${campana.fechaFin}</p>
                        <p><strong>Estado:</strong> ${campana.estado}</p>
                        <button onclick="editarCampana('${campana.id}')">Editar</button>
                        <button onclick="eliminarCampana('${campana.id}')" class="delete-button">Eliminar</button>
                    `;
                    listaCampanas.appendChild(divCampana);
                });
            }
        } else {
            mostrarMensaje('admin-campaigns-message', datos.mensaje || 'Error al cargar campañas para admin.', true);
        }
    } catch (error) {
        mostrarMensaje('admin-campaigns-message', `Error de red: ${error.message}`, true);
        console.error("Error al cargar campañas para admin:", error);
    }
}

/**
 * Muestra el formulario modal para crear una nueva campaña.
 * Resetea el formulario y configura el botón para la acción de creación.
 */
function mostrarFormularioCrearCampana() {
    const formulario = document.getElementById('campaign-admin-form');
    formulario.reset(); // Limpiar el formulario
    document.getElementById('campaign-form-title').textContent = 'Crear Nueva Campaña';
    document.getElementById('campaign-form-submit-button').textContent = 'Crear Campaña';
    document.getElementById('campaign-form-submit-button').onclick = crearCampana; // Asignar la función de creación
    document.getElementById('campaign-form-submit-button').dataset.mode = 'create'; // Establecer el modo
    document.getElementById('admin-campaign-id').value = ''; // Asegurar que no hay ID (para creación)
    document.getElementById('admin-campaign-estado').value = 'PLANIFICADA'; // Establecer estado por defecto
    ocultarMensajes('campaign-form-message');
    mostrarModal('campaign-form-modal');
}

/**
 * Función auxiliar para formatear una fecha de 'YYYY-MM-DD' (del input date) a 'DD/MM/YYYY' (para el backend).
 * @param {string} dateString - La fecha en formato 'YYYY-MM-DD'.
 * @returns {string|null} La fecha formateada o null si es inválida.
 */
function formatDateToDDMMYYYY(dateString) {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

/**
 * Función auxiliar para formatear una fecha de 'DD/MM/YYYY' (del backend) a 'YYYY-MM-DD' (para el input date).
 * También maneja el caso en que la fecha ya esté en```javascript
// app.js
// Archivo JavaScript principal para la aplicación de Gestión de Campañas de Limpieza

// URL base de la API de tu backend Spring Boot
const API_BASE_URL = 'http://localhost:8080/api';
// Variable global para almacenar los datos del usuario autenticado
let usuarioActual = null;

// --- Funciones de Utilidad ---

/**
 * Muestra una sección específica de la interfaz de usuario y oculta todas las demás.
 * @param {string} idSeccion - El ID de la sección HTML a mostrar.
 */
function mostrarSeccion(idSeccion) {
    // Oculta todas las secciones dentro del elemento 'main'
    document.querySelectorAll('main section').forEach(seccion => {
        seccion.style.display = 'none';
    });
    // Muestra la sección con el ID especificado
    document.getElementById(idSeccion).style.display = 'block';
}

/**
 * Actualiza la visibilidad de los elementos de navegación según el estado de autenticación
 * y el rol del usuario.
 */
function actualizarNavegacion() {
    // Obtener referencias a todos los elementos de navegación
    const navIniciarSesion = document.getElementById('nav-login');
    const navRegistrarse = document.getElementById('nav-register');
    const navMiPerfil = document.getElementById('nav-profile');
    const navCampanas = document.getElementById('nav-campaigns');
    const navGestionCampanasAdmin = document.getElementById('nav-admin-campaigns');
    const navVoluntariosAdmin = document.getElementById('nav-volunteers');
    const navReportesAdmin = document.getElementById('nav-reports-admin'); // ID corregido
    const navCalendario = document.getElementById('nav-calendar');
    const navNotificaciones = document.getElementById('nav-notifications');
    const navCerrarSesion = document.getElementById('nav-logout');
    const infoUsuarioSpan = document.getElementById('user-info'); // Para mostrar el nombre de usuario

    if (usuarioActual) {
        // Usuario autenticado: Ocultar opciones de no logeado, mostrar opciones de logeado
        navIniciarSesion.style.display = 'none';
        navRegistrarse.style.display = 'none';

        navMiPerfil.style.display = 'block';
        navCampanas.style.display = 'block';
        navCalendario.style.display = 'block';
        navNotificaciones.style.display = 'block';
        navCerrarSesion.style.display = 'block';
        infoUsuarioSpan.textContent = `Bienvenido, ${usuarioActual.nombreUsuario}`;

        // Opciones específicas para el rol de ADMINISTRADOR
        if (usuarioActual.rol === 'ADMIN') {
            navGestionCampanasAdmin.style.display = 'block';
            navVoluntariosAdmin.style.display = 'block';
            navReportesAdmin.style.display = 'block'; // Mostrar opción de reportes para Admin
        } else {
            // Ocultar opciones de admin para otros roles
            navGestionCampanasAdmin.style.display = 'none';
            navVoluntariosAdmin.style.display = 'none';
            navReportesAdmin.style.display = 'none';
        }
    } else {
        // Usuario no autenticado: Mostrar opciones de no logeado, ocultar todas las demás
        navIniciarSesion.style.display = 'block';
        navRegistrarse.style.display = 'block';

        navMiPerfil.style.display = 'none';
        navCampanas.style.display = 'none';
        navGestionCampanasAdmin.style.display = 'none';
        navVoluntariosAdmin.style.display = 'none';
        navReportesAdmin.style.display = 'none';
        navCalendario.style.display = 'none';
        navNotificaciones.style.display = 'none';
        navCerrarSesion.style.display = 'none';
        infoUsuarioSpan.textContent = ''; // Limpiar información de usuario
        mostrarIniciarSesion(); // Por defecto, si no hay usuario, mostrar la sección de login
    }
}

/**
 * Muestra un mensaje de retroalimentación al usuario en un elemento HTML específico.
 * @param {string} idElemento - El ID del elemento HTML donde se mostrará el mensaje.
 * @param {string} mensaje - El texto del mensaje a mostrar.
 * @param {boolean} esError - True si el mensaje es un error (para aplicar estilos de error).
 */
function mostrarMensaje(idElemento, mensaje, esError = false) {
    const elemento = document.getElementById(idElemento);
    if (!elemento) {
        console.error(`Elemento con ID '${idElemento}' no encontrado para mostrar mensaje.`);
        return;
    }
    elemento.textContent = mensaje; // Establecer el texto del mensaje
    elemento.className = esError ? 'message error' : 'message success'; // Aplicar clase CSS para estilo
    elemento.style.display = 'block'; // Asegurarse de que el mensaje sea visible
    // Opcional: ocultar el mensaje después de X segundos (descomentar si se desea)
    // setTimeout(() => { elemento.style.display = 'none'; }, 5000);
}

/**
 * Oculta un mensaje de retroalimentación en un elemento HTML específico.
 * @param {string} idElemento - El ID del elemento HTML cuyo mensaje se ocultará.
 */
function ocultarMensajes(idElemento) {
    const elemento = document.getElementById(idElemento);
    if (elemento) {
        elemento.textContent = ''; // Limpiar el texto
        elemento.style.display = 'none'; // Ocultar el elemento
    }
}

/**
 * Muestra un modal (elemento con display: none por defecto).
 * @param {string} idModal - El ID del modal a mostrar.
 */
function mostrarModal(idModal) {
    document.getElementById(idModal).style.display = 'block';
}

/**
 * Cierra un modal y limpia los mensajes asociados.
 * @param {string} idModal - El ID del modal a cerrar.
 */
function cerrarModal(idModal) {
    document.getElementById(idModal).style.display = 'none';
    // Limpiar mensajes específicos de modales al cerrarlos
    ocultarMensajes('modal-action-message');
    ocultarMensajes('campaign-form-message');
}

// --- Autenticación y Estado de la Sesión ---

/**
 * Función auxiliar para manejar el éxito del login, guardando el token y actualizando la UI.
 * @param {object} userData - Los datos del usuario (incluyendo el token JWT si aplica).
 */
function handleLoginSuccess(userData) {
    // Si el backend devuelve un token JWT, guárdalo
    if (userData.jwtToken) {
        localStorage.setItem('jwtToken', userData.jwtToken);
    }
    // Guarda los datos del usuario (sin el token si no quieres que esté en usuarioActual)
    usuarioActual = { ...userData }; // Copia los datos del usuario
    delete usuarioActual.jwtToken; // Elimina el token del objeto usuarioActual si lo tenía

    actualizarNavegacion();
    // Redirigir al perfil o a la sección principal tras un login exitoso
    mostrarPerfil(); // O podrías mostrarCampanas()
    // Limpiar los parámetros de la URL una vez procesados
    history.replaceState({}, document.title, window.location.pathname);
}

/**
 * Verifica el estado de autenticación del usuario al cargar la página o después de acciones de login/logout.
 * Realiza una petición a un endpoint protegido para obtener los datos del usuario autenticado.
 */
async function verificarEstadoAutenticacion() {
    try {
        ocultarMensajes('login-message'); // Limpiar mensajes de login previos

        // Verificar si hay parámetros de URL de Spring Security (ej. ?error o ?logout)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('error')) {
            mostrarMensaje('login-message', 'Credenciales inválidas. Por favor, inténtalo de nuevo.', true);
        } else if (urlParams.has('logout')) {
            mostrarMensaje('login-message', 'Has cerrado sesión exitosamente.', false);
        }

        // Si usas JWT y lo tienes en localStorage, verifica si es válido
        const token = localStorage.getItem('jwtToken');
        if (token) {
            // Realizar una petición a un endpoint protegido (ej. /api/usuarios/me)
            // para obtener los datos del usuario autenticado y validar el token.
            const respuesta = await fetch(`${API_BASE_URL}/usuarios/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (respuesta.ok) {
                // Token válido y usuario autenticado: obtener sus detalles y actualizar la UI
                const userData = await respuesta.json();
                handleLoginSuccess({ ...userData, jwtToken: token }); // Re-añadir token si lo necesitas en handleLoginSuccess
            } else {
                // Token inválido o expirado: limpiar token y estado, mostrar login
                localStorage.removeItem('jwtToken'); // Eliminar token inválido
                usuarioActual = null;
                actualizarNavegacion();
                mostrarIniciarSesion();
            }
        } else {
            // No hay token en localStorage: no autenticado
            usuarioActual = null;
            actualizarNavegacion();
            mostrarIniciarSesion();
        }
    } catch (error) {
        console.error("Error al verificar estado de autenticación:", error);
        localStorage.removeItem('jwtToken'); // En caso de error de red, limpiar token por si acaso
        usuarioActual = null;
        actualizarNavegacion();
        mostrarMensaje('login-message', 'Error de conexión con el servidor. Inténtalo más tarde.', true);
        mostrarIniciarSesion();
    }
}

/**
 * Maneja el proceso de inicio de sesión.
 * Envía las credenciales al backend y guarda el token JWT si la autenticación es exitosa.
 * @param {Event} evento - El evento de envío del formulario.
 */
async function iniciarSesion(evento) {
    evento.preventDefault(); // Prevenir el envío por defecto del formulario HTML
    const formulario = document.getElementById('login-form');
    const datosFormulario = new FormData(formulario);
    const credenciales = Object.fromEntries(datosFormulario.entries());

    ocultarMensajes('login-message'); // Limpiar mensaje previo

    try {
        // Realizar la petición POST al endpoint de login de tu backend
        // Asume que tu backend tiene un endpoint como /api/auth/login que devuelve un JWT
        const respuesta = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credenciales)
        });

        // Intentar parsear la respuesta JSON, incluso si es un error, por si el backend envía un mensaje
        const datos = await respuesta.json().catch(() => ({ message: respuesta.statusText || 'Error desconocido' }));

        if (respuesta.ok) { // Código de estado 200-299
            // Si el login es exitoso, los datos deberían contener el token JWT y la información del usuario
            handleLoginSuccess(datos); // Llama a la función para guardar token y actualizar UI
            mostrarMensaje('login-message', '¡Inicio de sesión exitoso!', false);
        } else { // Código de estado 4xx o 5xx
            // Si el backend envía un mensaje de error en el JSON, usarlo
            mostrarMensaje('login-message', datos.message || 'Credenciales inválidas. Inténtalo de nuevo.', true);
        }
    } catch (error) {
        // Manejo de errores de red o JSON inválido
        mostrarMensaje('login-message', `Error de red: ${error.message}. Verifica tu conexión o el servidor.`, true);
    }
}


/**
 * Maneja el proceso de registro de nuevos usuarios.
 * @param {Event} evento - El evento de envío del formulario.
 */
async function registrar(evento) {
    evento.preventDefault(); // Prevenir el envío por defecto del formulario HTML
    const formulario = document.getElementById('register-form');
    const datosFormulario = new FormData(formulario);
    const datosUsuario = Object.fromEntries(datosFormulario.entries());

    // Asignar rol por defecto (los registros desde aquí siempre son voluntarios)
    datosUsuario.rol = 'VOLUNTARIO';

    // Validar que la contraseña no esté vacía
    if (!datosUsuario.contrasena || datosUsuario.contrasena.trim() === '') {
        mostrarMensaje('register-message', 'La contraseña no puede estar vacía.', true);
        return;
    }

    ocultarMensajes('register-message'); // Limpiar mensaje previo

    try {
        const respuesta = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosUsuario)
        });

        // Intentar parsear la respuesta JSON, incluso si es un error, por si el backend envía un mensaje
        const datos = await respuesta.json().catch(() => ({ mensaje: respuesta.statusText || 'Error desconocido' }));

        if (respuesta.ok) { // Código de estado 200-299
            mostrarMensaje('register-message', '¡Registro exitoso! Ahora puedes iniciar sesión.', false);
            formulario.reset(); // Limpiar el formulario después del éxito
            mostrarIniciarSesion(); // Redirigir al usuario a la sección de login
        } else { // Código de estado 4xx o 5xx
            // Si el backend envía un mensaje de error en el JSON, usarlo
            mostrarMensaje('register-message', datos.mensaje || 'Error en el registro. Inténtalo de nuevo.', true);
        }
    } catch (error) {
        // Manejo de errores de red o JSON inválido
        mostrarMensaje('register-message', `Error de red: ${error.message}. Verifica tu conexión o el servidor.`, true);
        console.error("Error al registrar:", error);
    }
}

/**
 * Maneja el proceso de cierre de sesión.
 * Realiza un POST a la URL de logout de Spring Security.
 */
async function cerrarSesion() {
    try {
        // Si usas JWT, deberías eliminarlo de localStorage
        localStorage.removeItem('jwtToken');

        // Spring Security espera un POST a /logout para invalidar la sesión
        // Si usas JWT puro, este endpoint puede no ser necesario o tener otra lógica.
        const respuesta = await fetch('/logout', {
            method: 'POST',
            // Es buena práctica incluir el token CSRF si lo tienes habilitado en Spring Security
            // headers: { 'X-CSRF-TOKEN': obtenerCsrfToken() } // Implementar obtenerCsrfToken si es necesario
        });

        if (respuesta.ok) {
            // Logout exitoso, limpiar estado del frontend
            usuarioActual = null;
            actualizarNavegacion();
            // Redirigir para que Spring Security complete el proceso y limpie la sesión del navegador
            window.location.href = '/?logout';
        } else {
            console.error("Error al cerrar sesión:", respuesta.status, respuesta.statusText);
            // Usar mostrarMensaje o un modal personalizado en lugar de alert()
            alert('Error al cerrar sesión. Por favor, inténtalo de nuevo.');
        }
    } catch (error) {
        console.error("Error de red al cerrar sesión:", error);
        alert('Error de conexión al intentar cerrar sesión. Inténtalo más tarde.');
    }
}

// --- Vistas de Navegación ---

function mostrarIniciarSesion() {
    mostrarSeccion('login-section');
    ocultarMensajes('login-message');
}

function mostrarRegistrarse() {
    mostrarSeccion('register-section');
    ocultarMensajes('register-message');
    document.getElementById('register-form').reset(); // Limpiar formulario al mostrar
}

// --- Perfil de Usuario ---

/**
 * Muestra la sección del perfil del usuario y rellena el formulario con los datos del usuario actual.
 */
async function mostrarPerfil() {
    if (!usuarioActual) { mostrarIniciarSesion(); return; }
    mostrarSeccion('profile-section');
    // Rellenar formulario de perfil con los datos del usuario actual
    document.getElementById('profile-id').value = usuarioActual.id;
    document.getElementById('profile-username').value = usuarioActual.nombreUsuario;
    document.getElementById('profile-nombre').value = usuarioActual.nombre;
    document.getElementById('profile-apellido').value = usuarioActual.apellido;
    document.getElementById('profile-email').value = usuarioActual.email;
    document.getElementById('profile-telefono').value = usuarioActual.telefono || ''; // Manejar valor nulo
    document.getElementById('profile-rol').value = usuarioActual.rol;
    document.getElementById('profile-calificacion').value = usuarioActual.calificacion !== undefined ? usuarioActual.calificacion.toFixed(1) : 'N/A';
    document.getElementById('profile-activo').checked = usuarioActual.activo;

    // Limpiar mensajes y formulario de cambio de contraseña al mostrar el perfil
    ocultarMensajes('profile-message');
    ocultarMensajes('change-password-message');
    document.getElementById('change-password-form').reset();
}

/**
 * Actualiza la información del perfil del usuario.
 * @param {Event} evento - El evento de envío del formulario.
 */
async function actualizarPerfil(evento) {
    evento.preventDefault();
    if (!usuarioActual) { mostrarIniciarSesion(); return; }

    const datosPerfil = {
        id: usuarioActual.id,
        nombreUsuario: usuarioActual.nombreUsuario, // No se permite cambiar desde el frontend
        nombre: document.getElementById('profile-nombre').value.trim(),
        apellido: document.getElementById('profile-apellido').value.trim(),
        email: document.getElementById('profile-email').value.trim(),
        telefono: document.getElementById('profile-telefono').value.trim(),
        rol: usuarioActual.rol, // No se permite cambiar desde el frontend
        calificacion: usuarioActual.calificacion, // No se permite cambiar desde el frontend
        activo: usuarioActual.activo // No se permite cambiar desde el frontend
    };
    ocultarMensajes('profile-message');

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/usuarios/${usuarioActual.id}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(datosPerfil)
        });

        const datos = await respuesta.json().catch(() => ({ mensaje: respuesta.statusText || 'Error desconocido' }));

        if (respuesta.ok) {
            usuarioActual = datos; // Actualizar el objeto de usuario actual con los datos modificados del backend
            mostrarMensaje('profile-message', '¡Perfil actualizado exitosamente!', false);
            actualizarNavegacion(); // Para actualizar el nombre de usuario si se muestra en la navegación
            mostrarPerfil(); // Re-renderizar perfil con los nuevos datos (útil para campos disabled)
        } else {
            mostrarMensaje('profile-message', datos.mensaje || 'Error al actualizar el perfil.', true);
        }
    } catch (error) {
        mostrarMensaje('profile-message', `Error de red: ${error.message}`, true);
        console.error("Error al actualizar perfil:", error);
    }
}

/**
 * Cambia la contraseña del usuario.
 * @param {Event} evento - El evento de envío del formulario.
 */
async function cambiarContrasena(evento) {
    evento.preventDefault();
    if (!usuarioActual) { mostrarIniciarSesion(); return; }

    const contrasenaActual = document.getElementById('current-password').value;
    const nuevaContrasena = document.getElementById('new-password').value;
    const confirmarNuevaContrasena = document.getElementById('confirm-new-password').value;
    ocultarMensajes('change-password-message');

    if (nuevaContrasena !== confirmarNuevaContrasena) {
        mostrarMensaje('change-password-message', 'Las nuevas contraseñas no coinciden.', true);
        return;
    }
    if (nuevaContrasena.trim() === '' || contrasenaActual.trim() === '') {
        mostrarMensaje('change-password-message', 'Las contraseñas no pueden estar vacías.', true);
        return;
    }

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/auth/change-password`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                userId: usuarioActual.id, // ID del usuario logeado
                currentPassword: contrasenaActual,
                newPassword: nuevaContrasena
            })
        });

        const datos = await respuesta.json().catch(() => ({ mensaje: 'Respuesta inválida del servidor.' }));

        if (respuesta.ok) {
            mostrarMensaje('change-password-message', '¡Contraseña cambiada exitosamente!', false);
            document.getElementById('change-password-form').reset(); // Limpiar el formulario
        } else {
            mostrarMensaje('change-password-message', datos.mensaje || 'Error al cambiar la contraseña. Verifica tu contraseña actual.', true);
        }
    } catch (error) {
        mostrarMensaje('change-password-message', `Error de red: ${error.message}`, true);
        console.error("Error al cambiar contraseña:", error);
    }
}

// --- Campañas (para Voluntarios) ---

/**
 * Muestra la sección de campañas disponibles para voluntarios.
 * Carga las campañas desde el backend y las muestra en cards.
 */
async function mostrarCampanas() {
    if (!usuarioActual) { mostrarIniciarSesion(); return; }
    mostrarSeccion('campaigns-section');
    const listaCampanas = document.getElementById('campaigns-list');
    ocultarMensajes('campaigns-message');
    listaCampanas.innerHTML = '<p>Cargando campañas...</p>'; // Mensaje de carga inicial

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/campanas`, { headers });
        const datos = await respuesta.json().catch(() => ({ mensaje: 'Respuesta inválida del servidor al cargar campañas.' }));

        if (respuesta.ok) {
            if (datos.length === 0) {
                listaCampanas.innerHTML = '<p>No hay campañas disponibles en este momento.</p>';
            } else {
                listaCampanas.innerHTML = ''; // Limpiar contenido previo
                datos.forEach(campana => {
                    const divCampana = document.createElement('div');
                    divCampana.className = 'card'; // Clase CSS para el estilo de la tarjeta
                    divCampana.innerHTML = `
                        <h3>${campana.nombre}</h3>
                        <p>${campana.descripcion ? campana.descripcion.substring(0, 100) + '...' : 'Sin descripción'}</p>
                        <p><strong>Ubicación:</strong> ${campana.ubicacion}</p>
                        <p><strong>Fecha:</strong> ${campana.fechaInicio} al ${campana.fechaFin}</p>
                        <p><strong>Estado:</strong> ${campana.estado}</p>
                        <button onclick="mostrarDetallesCampana('${campana.id}', false)">Ver Detalles</button>
                    `;
                    listaCampanas.appendChild(divCampana);
                });
            }
        } else {
            mostrarMensaje('campaigns-message', datos.mensaje || 'Error al cargar campañas.', true);
        }
    } catch (error) {
        mostrarMensaje('campaigns-message', `Error de red: ${error.message}`, true);
        console.error("Error al cargar campañas:", error);
    }
}

/**
 * Muestra los detalles de una campaña en un modal.
 * @param {string} idCampana - El ID de la campaña a mostrar.
 * @param {boolean} esContextoAdmin - Indica si la vista se abre desde el contexto de administración.
 */
async function mostrarDetallesCampana(idCampana, esContextoAdmin) {
    if (!usuarioActual) { mostrarIniciarSesion(); return; }
    const modal = document.getElementById('campaign-details-modal');
    const titulo = document.getElementById('modal-campaign-title');
    const descripcion = document.getElementById('modal-campaign-description');
    const ubicacion = document.getElementById('modal-campaign-ubicacion');
    const fechaInicio = document.getElementById('modal-campaign-fechaInicio');
    const fechaFin = document.getElementById('modal-campaign-fechaFin');
    const estado = document.getElementById('modal-campaign-estado');
    const divEvidencias = document.getElementById('modal-campaign-evidences');
    const botonAccion = document.getElementById('modal-campaign-action-button');
    ocultarMensajes('modal-action-message'); // Limpiar mensaje previo

    // Limpiar y resetear el contenido del modal
    titulo.textContent = 'Cargando...';
    descripcion.textContent = '';
    ubicacion.textContent = '';
    fechaInicio.textContent = '';
    fechaFin.textContent = '';
    estado.textContent = '';
    divEvidencias.innerHTML = '';
    botonAccion.style.display = 'none';

    mostrarModal('campaign-details-modal'); // Mostrar el modal

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/campanas/${idCampana}`, { headers });
        const campana = await respuesta.json().catch(() => ({ mensaje: 'Respuesta inválida del servidor al cargar detalles de campaña.' }));

        if (respuesta.ok) {
            // Rellenar el modal con los datos de la campaña
            titulo.textContent = campana.nombre;
            descripcion.textContent = campana.descripcion;
            ubicacion.textContent = campana.ubicacion;
            fechaInicio.textContent = campana.fechaInicio; // Asume que el formato es legible
            fechaFin.textContent = campana.fechaFin;     // Asume que el formato es legible
            estado.textContent = campana.estado;

            // Placeholder para evidencias (si se implementa en el futuro)
            divEvidencias.innerHTML = '<p>No hay evidencias para esta campaña.</p>';

            // Lógica para el botón de inscripción/anulación (solo para voluntarios y fuera del contexto admin)
            if (!esContextoAdmin && usuarioActual.rol === 'VOLUNTARIO') {
                const respuestaInscripcion = await fetch(`${API_BASE_URL}/campanas/${campana.id}/inscrito/${usuarioActual.id}`);
                let estaInscrito = false;
                if (respuestaInscripcion.ok) {
                    estaInscrito = await respuestaInscripcion.json();
                } else {
                    console.warn(`No se pudo verificar la inscripción para campaña ${campana.id}:`, respuestaInscripcion.status);
                }

                botonAccion.style.display = 'block';
                if (estaInscrito) {
                    botonAccion.textContent = 'Anular Inscripción';
                    botonAccion.onclick = () => anularInscripcion(campana.id);
                } else {
                    botonAccion.textContent = 'Inscribirse';
                    botonAccion.onclick = () => inscribirseCampana(campana.id);
                }
            } else {
                botonAccion.style.display = 'none'; // No mostrar el botón para admin o si no es voluntario
            }
        } else {
            mostrarMensaje('modal-action-message', campana.mensaje || 'Error al cargar detalles de la campaña.', true);
        }
    } catch (error) {
        mostrarMensaje('modal-action-message', `Error de red: ${error.message}`, true);
        console.error("Error al mostrar detalles de campaña:", error);
    }
}

/**
 * Inscribe al usuario actual (voluntario) en una campaña.
 * @param {string} idCampana - El ID de la campaña.
 */
async function inscribirseCampana(idCampana) {
    if (!usuarioActual || usuarioActual.rol !== 'VOLUNTARIO') {
        mostrarMensaje('modal-action-message', 'Debes ser un voluntario para inscribirte.', true);
        return;
    }
    mostrarMensaje('modal-action-message', 'Inscribiendo...');

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/campanas/${idCampana}/inscribir/${usuarioActual.id}`, {
            method: 'POST',
            headers: headers
        });

        const datos = await respuesta.json().catch(() => ({ mensaje: respuesta.statusText || 'Respuesta inválida del servidor.' }));

        if (respuesta.ok) {
            mostrarMensaje('modal-action-message', '¡Inscripción exitosa!', false);
            // Actualizar el botón a "Anular Inscripción"
            const botonAccion = document.getElementById('modal-campaign-action-button');
            botonAccion.textContent = 'Anular Inscripción';
            botonAccion.onclick = () => anularInscripcion(campana.id);
            // Recargar la lista de campañas si la sección está visible
            if (document.getElementById('campaigns-section').style.display === 'block') {
                mostrarCampanas();
            }
        } else {
            mostrarMensaje('modal-action-message', datos.mensaje || 'Error al inscribirse.', true);
        }
    } catch (error) {
        mostrarMensaje('modal-action-message', `Error de red: ${error.message}`, true);
        console.error("Error al inscribirse en campaña:", error);
    }
}

/**
 * Anula la inscripción del usuario actual (voluntario) en una campaña.
 * @param {string} idCampana - El ID de la campaña.
 */
async function anularInscripcion(idCampana) {
    if (!usuarioActual || usuarioActual.rol !== 'VOLUNTARIO') {
        mostrarMensaje('modal-action-message', 'Debes ser un voluntario para anular inscripción.', true);
        return;
    }
    mostrarMensaje('modal-action-message', 'Anulando inscripción...');

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/campanas/${idCampana}/anular/${usuarioActual.id}`, {
            method: 'DELETE',
            headers: headers
        });

        const datos = await respuesta.json().catch(() => ({ mensaje: respuesta.statusText || 'Respuesta inválida del servidor.' }));

        if (respuesta.ok) {
            mostrarMensaje('modal-action-message', '¡Inscripción anulada exitosamente!', false);
            // Actualizar el botón a "Inscribirse"
            const botonAccion = document.getElementById('modal-campaign-action-button');
            botonAccion.textContent = 'Inscribirse';
            botonAccion.onclick = () => inscribirseCampana(idCampana);
            // Recargar la lista de campañas si la sección está visible
            if (document.getElementById('campaigns-section').style.display === 'block') {
                mostrarCampanas();
            }
        } else {
            mostrarMensaje('modal-action-message', datos.mensaje || 'Error al anular inscripción.', true);
        }
    } catch (error) {
        mostrarMensaje('modal-action-message', `Error de red: ${error.message}`, true);
        console.error("Error al anular inscripción:", error);
    }
}


// --- Gestión de Campañas (para Administradores) ---

/**
 * Muestra la sección de gestión de campañas para administradores.
 * Carga todas las campañas desde el backend y las muestra con opciones de edición/eliminación.
 */
async function mostrarGestionCampanasAdmin() {
    if (!usuarioActual || usuarioActual.rol !== 'ADMIN') { mostrarIniciarSesion(); return; }
    mostrarSeccion('admin-campaigns-section');
    const listaCampanas = document.getElementById('admin-campaigns-list');
    ocultarMensajes('admin-campaigns-message');
    listaCampanas.innerHTML = '<p>Cargando campañas para administración...</p>';

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/campanas`, { headers }); // Asume que un admin puede ver todas las campañas
        const datos = await respuesta.json().catch(() => ({ mensaje: 'Respuesta inválida del servidor al cargar campañas para admin.' }));

        if (respuesta.ok) {
            if (datos.length === 0) {
                listaCampanas.innerHTML = '<p>No hay campañas para gestionar.</p>';
            } else {
                listaCampanas.innerHTML = '';
                datos.forEach(campana => {
                    const divCampana = document.createElement('div');
                    divCampana.className = 'card'; // Clase CSS para el estilo de la tarjeta
                    divCampana.innerHTML = `
                        <h3>${campana.nombre}</h3>
                        <p>${campana.descripcion ? campana.descripcion.substring(0, 100) + '...' : 'Sin descripción'}</p>
                        <p><strong>Ubicación:</strong> ${campana.ubicacion}</p>
                        <p><strong>Fecha:</strong> ${campana.fechaInicio} al ${campana.fechaFin}</p>
                        <p><strong>Estado:</strong> ${campana.estado}</p>
                        <button onclick="editarCampana('${campana.id}')">Editar</button>
                        <button onclick="eliminarCampana('${campana.id}')" class="delete-button">Eliminar</button>
                    `;
                    listaCampanas.appendChild(divCampana);
                });
            }
        } else {
            mostrarMensaje('admin-campaigns-message', datos.mensaje || 'Error al cargar campañas para admin.', true);
        }
    } catch (error) {
        mostrarMensaje('admin-campaigns-message', `Error de red: ${error.message}`, true);
        console.error("Error al cargar campañas para admin:", error);
    }
}

/**
 * Muestra el formulario modal para crear una nueva campaña.
 * Resetea el formulario y configura el botón para la acción de creación.
 */
function mostrarFormularioCrearCampana() {
    const formulario = document.getElementById('campaign-admin-form');
    formulario.reset(); // Limpiar el formulario
    document.getElementById('campaign-form-title').textContent = 'Crear Nueva Campaña';
    document.getElementById('campaign-form-submit-button').textContent = 'Crear Campaña';
    document.getElementById('campaign-form-submit-button').onclick = crearCampana; // Asignar la función de creación
    document.getElementById('campaign-form-submit-button').dataset.mode = 'create'; // Establecer el modo
    document.getElementById('admin-campaign-id').value = ''; // Asegurar que no hay ID (para creación)
    document.getElementById('admin-campaign-estado').value = 'PLANIFICADA'; // Establecer estado por defecto
    ocultarMensajes('campaign-form-message');
    mostrarModal('campaign-form-modal');
}

/**
 * Función auxiliar para formatear una fecha de 'YYYY-MM-DD' (del input date) a 'DD/MM/YYYY' (para el backend).
 * @param {string} dateString - La fecha en formato 'YYYY-MM-DD'.
 * @returns {string|null} La fecha formateada o null si es inválida.
 */
function formatDateToDDMMYYYY(dateString) {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

/**
 * Función auxiliar para formatear una fecha de 'DD/MM/YYYY' (del backend) a 'YYYY-MM-DD' (para el input date).
 * También maneja el caso en que la fecha ya esté en```javascript
// app.js
// Archivo JavaScript principal para la aplicación de Gestión de Campañas de Limpieza

// URL base de la API de tu backend Spring Boot
const API_BASE_URL = 'http://localhost:8080/api';
// Variable global para almacenar los datos del usuario autenticado
let usuarioActual = null;

// --- Funciones de Utilidad ---

/**
 * Muestra una sección específica de la interfaz de usuario y oculta todas las demás.
 * @param {string} idSeccion - El ID de la sección HTML a mostrar.
 */
function mostrarSeccion(idSeccion) {
    // Oculta todas las secciones dentro del elemento 'main'
    document.querySelectorAll('main section').forEach(seccion => {
        seccion.style.display = 'none';
    });
    // Muestra la sección con el ID especificado
    document.getElementById(idSeccion).style.display = 'block';
}

/**
 * Actualiza la visibilidad de los elementos de navegación según el estado de autenticación
 * y el rol del usuario.
 */
function actualizarNavegacion() {
    // Obtener referencias a todos los elementos de navegación
    const navIniciarSesion = document.getElementById('nav-login');
    const navRegistrarse = document.getElementById('nav-register');
    const navMiPerfil = document.getElementById('nav-profile');
    const navCampanas = document.getElementById('nav-campaigns');
    const navGestionCampanasAdmin = document.getElementById('nav-admin-campaigns');
    const navVoluntariosAdmin = document.getElementById('nav-volunteers');
    const navReportesAdmin = document.getElementById('nav-reports-admin'); // ID corregido
    const navCalendario = document.getElementById('nav-calendar');
    const navNotificaciones = document.getElementById('nav-notifications');
    const navCerrarSesion = document.getElementById('nav-logout');
    const infoUsuarioSpan = document.getElementById('user-info'); // Para mostrar el nombre de usuario

    if (usuarioActual) {
        // Usuario autenticado: Ocultar opciones de no logeado, mostrar opciones de logeado
        navIniciarSesion.style.display = 'none';
        navRegistrarse.style.display = 'none';

        navMiPerfil.style.display = 'block';
        navCampanas.style.display = 'block';
        navCalendario.style.display = 'block';
        navNotificaciones.style.display = 'block';
        navCerrarSesion.style.display = 'block';
        infoUsuarioSpan.textContent = `Bienvenido, ${usuarioActual.nombreUsuario}`;

        // Opciones específicas para el rol de ADMINISTRADOR
        if (usuarioActual.rol === 'ADMIN') {
            navGestionCampanasAdmin.style.display = 'block';
            navVoluntariosAdmin.style.display = 'block';
            navReportesAdmin.style.display = 'block'; // Mostrar opción de reportes para Admin
        } else {
            // Ocultar opciones de admin para otros roles
            navGestionCampanasAdmin.style.display = 'none';
            navVoluntariosAdmin.style.display = 'none';
            navReportesAdmin.style.display = 'none';
        }
    } else {
        // Usuario no autenticado: Mostrar opciones de no logeado, ocultar todas las demás
        navIniciarSesion.style.display = 'block';
        navRegistrarse.style.display = 'block';

        navMiPerfil.style.display = 'none';
        navCampanas.style.display = 'none';
        navGestionCampanasAdmin.style.display = 'none';
        navVoluntariosAdmin.style.display = 'none';
        navReportesAdmin.style.display = 'none';
        navCalendario.style.display = 'none';
        navNotificaciones.style.display = 'none';
        navCerrarSesion.style.display = 'none';
        infoUsuarioSpan.textContent = ''; // Limpiar información de usuario
        mostrarIniciarSesion(); // Por defecto, si no hay usuario, mostrar la sección de login
    }
}

/**
 * Muestra un mensaje de retroalimentación al usuario en un elemento HTML específico.
 * @param {string} idElemento - El ID del elemento HTML donde se mostrará el mensaje.
 * @param {string} mensaje - El texto del mensaje a mostrar.
 * @param {boolean} esError - True si el mensaje es un error (para aplicar estilos de error).
 */
function mostrarMensaje(idElemento, mensaje, esError = false) {
    const elemento = document.getElementById(idElemento);
    if (!elemento) {
        console.error(`Elemento con ID '${idElemento}' no encontrado para mostrar mensaje.`);
        return;
    }
    elemento.textContent = mensaje; // Establecer el texto del mensaje
    elemento.className = esError ? 'message error' : 'message success'; // Aplicar clase CSS para estilo
    elemento.style.display = 'block'; // Asegurarse de que el mensaje sea visible
    // Opcional: ocultar el mensaje después de X segundos (descomentar si se desea)
    // setTimeout(() => { elemento.style.display = 'none'; }, 5000);
}

/**
 * Oculta un mensaje de retroalimentación en un elemento HTML específico.
 * @param {string} idElemento - El ID del elemento HTML cuyo mensaje se ocultará.
 */
function ocultarMensajes(idElemento) {
    const elemento = document.getElementById(idElemento);
    if (elemento) {
        elemento.textContent = ''; // Limpiar el texto
        elemento.style.display = 'none'; // Ocultar el elemento
    }
}

/**
 * Muestra un modal (elemento con display: none por defecto).
 * @param {string} idModal - El ID del modal a mostrar.
 */
function mostrarModal(idModal) {
    document.getElementById(idModal).style.display = 'block';
}

/**
 * Cierra un modal y limpia los mensajes asociados.
 * @param {string} idModal - El ID del modal a cerrar.
 */
function cerrarModal(idModal) {
    document.getElementById(idModal).style.display = 'none';
    // Limpiar mensajes específicos de modales al cerrarlos
    ocultarMensajes('modal-action-message');
    ocultarMensajes('campaign-form-message');
}

// --- Autenticación y Estado de la Sesión ---

/**
 * Función auxiliar para manejar el éxito del login, guardando el token y actualizando la UI.
 * @param {object} userData - Los datos del usuario (incluyendo el token JWT si aplica).
 */
function handleLoginSuccess(userData) {
    // Si el backend devuelve un token JWT, guárdalo
    if (userData.jwtToken) {
        localStorage.setItem('jwtToken', userData.jwtToken);
    }
    // Guarda los datos del usuario (sin el token si no quieres que esté en usuarioActual)
    usuarioActual = { ...userData }; // Copia los datos del usuario
    delete usuarioActual.jwtToken; // Elimina el token del objeto usuarioActual si lo tenía

    actualizarNavegacion();
    // Redirigir al perfil o a la sección principal tras un login exitoso
    mostrarPerfil(); // O podrías mostrarCampanas()
    // Limpiar los parámetros de la URL una vez procesados
    history.replaceState({}, document.title, window.location.pathname);
}

/**
 * Verifica el estado de autenticación del usuario al cargar la página o después de acciones de login/logout.
 * Realiza una petición a un endpoint protegido para obtener los datos del usuario autenticado.
 */
async function verificarEstadoAutenticacion() {
    try {
        ocultarMensajes('login-message'); // Limpiar mensajes de login previos

        // Verificar si hay parámetros de URL de Spring Security (ej. ?error o ?logout)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('error')) {
            mostrarMensaje('login-message', 'Credenciales inválidas. Por favor, inténtalo de nuevo.', true);
        } else if (urlParams.has('logout')) {
            mostrarMensaje('login-message', 'Has cerrado sesión exitosamente.', false);
        }

        // Si usas JWT y lo tienes en localStorage, verifica si es válido
        const token = localStorage.getItem('jwtToken');
        if (token) {
            // Realizar una petición a un endpoint protegido (ej. /api/usuarios/me)
            // para obtener los datos del usuario autenticado y validar el token.
            const respuesta = await fetch(`${API_BASE_URL}/usuarios/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (respuesta.ok) {
                // Token válido y usuario autenticado: obtener sus detalles y actualizar la UI
                const userData = await respuesta.json();
                handleLoginSuccess({ ...userData, jwtToken: token }); // Re-añadir token si lo necesitas en handleLoginSuccess
            } else {
                // Token inválido o expirado: limpiar token y estado, mostrar login
                localStorage.removeItem('jwtToken'); // Eliminar token inválido
                usuarioActual = null;
                actualizarNavegacion();
                mostrarIniciarSesion();
            }
        } else {
            // No hay token en localStorage: no autenticado
            usuarioActual = null;
            actualizarNavegacion();
            mostrarIniciarSesion();
        }
    } catch (error) {
        console.error("Error al verificar estado de autenticación:", error);
        localStorage.removeItem('jwtToken'); // En caso de error de red, limpiar token por si acaso
        usuarioActual = null;
        actualizarNavegacion();
        mostrarMensaje('login-message', 'Error de conexión con el servidor. Inténtalo más tarde.', true);
        mostrarIniciarSesion();
    }
}

/**
 * Maneja el proceso de inicio de sesión.
 * Envía las credenciales al backend y guarda el token JWT si la autenticación es exitosa.
 * @param {Event} evento - El evento de envío del formulario.
 */
async function iniciarSesion(evento) {
    evento.preventDefault(); // Prevenir el envío por defecto del formulario HTML
    const formulario = document.getElementById('login-form');
    const datosFormulario = new FormData(formulario);
    const credenciales = Object.fromEntries(datosFormulario.entries());

    ocultarMensajes('login-message'); // Limpiar mensaje previo

    try {
        // Realizar la petición POST al endpoint de login de tu backend
        // Asume que tu backend tiene un endpoint como /api/auth/login que devuelve un JWT
        const respuesta = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credenciales)
        });

        // Intentar parsear la respuesta JSON, incluso si es un error, por si el backend envía un mensaje
        const datos = await respuesta.json().catch(() => ({ message: respuesta.statusText || 'Error desconocido' }));

        if (respuesta.ok) { // Código de estado 200-299
            // Si el login es exitoso, los datos deberían contener el token JWT y la información del usuario
            handleLoginSuccess(datos); // Llama a la función para guardar token y actualizar UI
            mostrarMensaje('login-message', '¡Inicio de sesión exitoso!', false);
        } else { // Código de estado 4xx o 5xx
            // Si el backend envía un mensaje de error en el JSON, usarlo
            mostrarMensaje('login-message', datos.message || 'Credenciales inválidas. Inténtalo de nuevo.', true);
        }
    } catch (error) {
        // Manejo de errores de red o JSON inválido
        mostrarMensaje('login-message', `Error de red: ${error.message}. Verifica tu conexión o el servidor.`, true);
    }
}


/**
 * Maneja el proceso de registro de nuevos usuarios.
 * @param {Event} evento - El evento de envío del formulario.
 */
async function registrar(evento) {
    evento.preventDefault(); // Prevenir el envío por defecto del formulario HTML
    const formulario = document.getElementById('register-form');
    const datosFormulario = new FormData(formulario);
    const datosUsuario = Object.fromEntries(datosFormulario.entries());

    // Asignar rol por defecto (los registros desde aquí siempre son voluntarios)
    datosUsuario.rol = 'VOLUNTARIO';

    // Validar que la contraseña no esté vacía
    if (!datosUsuario.contrasena || datosUsuario.contrasena.trim() === '') {
        mostrarMensaje('register-message', 'La contraseña no puede estar vacía.', true);
        return;
    }

    ocultarMensajes('register-message'); // Limpiar mensaje previo

    try {
        const respuesta = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosUsuario)
        });

        // Intentar parsear la respuesta JSON, incluso si es un error, por si el backend envía un mensaje
        const datos = await respuesta.json().catch(() => ({ mensaje: respuesta.statusText || 'Error desconocido' }));

        if (respuesta.ok) { // Código de estado 200-299
            mostrarMensaje('register-message', '¡Registro exitoso! Ahora puedes iniciar sesión.', false);
            formulario.reset(); // Limpiar el formulario después del éxito
            mostrarIniciarSesion(); // Redirigir al usuario a la sección de login
        } else { // Código de estado 4xx o 5xx
            // Si el backend envía un mensaje de error en el JSON, usarlo
            mostrarMensaje('register-message', datos.mensaje || 'Error en el registro. Inténtalo de nuevo.', true);
        }
    } catch (error) {
        // Manejo de errores de red o JSON inválido
        mostrarMensaje('register-message', `Error de red: ${error.message}. Verifica tu conexión o el servidor.`, true);
        console.error("Error al registrar:", error);
    }
}

/**
 * Maneja el proceso de cierre de sesión.
 * Realiza un POST a la URL de logout de Spring Security.
 */
async function cerrarSesion() {
    try {
        // Si usas JWT, deberías eliminarlo de localStorage
        localStorage.removeItem('jwtToken');

        // Spring Security espera un POST a /logout para invalidar la sesión
        // Si usas JWT puro, este endpoint puede no ser necesario o tener otra lógica.
        const respuesta = await fetch('/logout', {
            method: 'POST',
            // Es buena práctica incluir el token CSRF si lo tienes habilitado en Spring Security
            // headers: { 'X-CSRF-TOKEN': obtenerCsrfToken() } // Implementar obtenerCsrfToken si es necesario
        });

        if (respuesta.ok) {
            // Logout exitoso, limpiar estado del frontend
            usuarioActual = null;
            actualizarNavegacion();
            // Redirigir para que Spring Security complete el proceso y limpie la sesión del navegador
            window.location.href = '/?logout';
        } else {
            console.error("Error al cerrar sesión:", respuesta.status, respuesta.statusText);
            // Usar mostrarMensaje o un modal personalizado en lugar de alert()
            alert('Error al cerrar sesión. Por favor, inténtalo de nuevo.');
        }
    } catch (error) {
        console.error("Error de red al cerrar sesión:", error);
        alert('Error de conexión al intentar cerrar sesión. Inténtalo más tarde.');
    }
}

// --- Vistas de Navegación ---

function mostrarIniciarSesion() {
    mostrarSeccion('login-section');
    ocultarMensajes('login-message');
}

function mostrarRegistrarse() {
    mostrarSeccion('register-section');
    ocultarMensajes('register-message');
    document.getElementById('register-form').reset(); // Limpiar formulario al mostrar
}

// --- Perfil de Usuario ---

/**
 * Muestra la sección del perfil del usuario y rellena el formulario con los datos del usuario actual.
 */
async function mostrarPerfil() {
    if (!usuarioActual) { mostrarIniciarSesion(); return; }
    mostrarSeccion('profile-section');
    // Rellenar formulario de perfil con los datos del usuario actual
    document.getElementById('profile-id').value = usuarioActual.id;
    document.getElementById('profile-username').value = usuarioActual.nombreUsuario;
    document.getElementById('profile-nombre').value = usuarioActual.nombre;
    document.getElementById('profile-apellido').value = usuarioActual.apellido;
    document.getElementById('profile-email').value = usuarioActual.email;
    document.getElementById('profile-telefono').value = usuarioActual.telefono || ''; // Manejar valor nulo
    document.getElementById('profile-rol').value = usuarioActual.rol;
    document.getElementById('profile-calificacion').value = usuarioActual.calificacion !== undefined ? usuarioActual.calificacion.toFixed(1) : 'N/A';
    document.getElementById('profile-activo').checked = usuarioActual.activo;

    // Limpiar mensajes y formulario de cambio de contraseña al mostrar el perfil
    ocultarMensajes('profile-message');
    ocultarMensajes('change-password-message');
    document.getElementById('change-password-form').reset();
}

/**
 * Actualiza la información del perfil del usuario.
 * @param {Event} evento - El evento de envío del formulario.
 */
async function actualizarPerfil(evento) {
    evento.preventDefault();
    if (!usuarioActual) { mostrarIniciarSesion(); return; }

    const datosPerfil = {
        id: usuarioActual.id,
        nombreUsuario: usuarioActual.nombreUsuario, // No se permite cambiar desde el frontend
        nombre: document.getElementById('profile-nombre').value.trim(),
        apellido: document.getElementById('profile-apellido').value.trim(),
        email: document.getElementById('profile-email').value.trim(),
        telefono: document.getElementById('profile-telefono').value.trim(),
        rol: usuarioActual.rol, // No se permite cambiar desde el front