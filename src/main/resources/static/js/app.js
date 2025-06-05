const API_BASE_URL = 'http://localhost:8080/api';
// Variable global para almacenar los datos del usuario autenticado
let usuarioActual = null;

// --- Funciones de Utilidad ---

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
    const navReportesAdmin = document.getElementById('nav-reports-admin');
    const navCalendario = document.getElementById('nav-calendar');
    const navNotificaciones = document.getElementById('nav-notifications');
    const navCerrarSesion = document.getElementById('nav-logout');
    const infoUsuarioSpan = document.getElementById('user-info');

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
            navReportesAdmin.style.display = 'block';
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
        infoUsuarioSpan.textContent = '';
        mostrarIniciarSesion();
    }
}

function mostrarMensaje(idElemento, mensaje, esError = false) {
    const elemento = document.getElementById(idElemento);
    if (!elemento) {
        console.error(`Elemento con ID '${idElemento}' no encontrado para mostrar mensaje.`);
        return;
    }
    elemento.textContent = mensaje;
    elemento.className = esError ? 'message error' : 'message success';
    elemento.style.display = 'block';
}

/**
 * Oculta un mensaje de retroalimentación en un elemento HTML específico.
 * @param {string} idElemento - El ID del elemento HTML cuyo mensaje se ocultará.
 */
function ocultarMensajes(idElemento) {
    const elemento = document.getElementById(idElemento);
    if (elemento) {
        elemento.textContent = '';
        elemento.style.display = 'none';
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
    ocultarMensajes('modal-action-message');
    ocultarMensajes('campaign-form-message');
}

// --- Autenticación y Estado de la Sesión ---

function handleLoginSuccess(userData) {
    if (userData.jwtToken) {
        localStorage.setItem('jwtToken', userData.jwtToken);
    }
    usuarioActual = { ...userData };
    delete usuarioActual.jwtToken;

    actualizarNavegacion();
    mostrarPerfil();
    history.replaceState({}, document.title, window.location.pathname);
}

async function verificarEstadoAutenticacion() {
    try {
        ocultarMensajes('login-message');

        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('error')) {
            mostrarMensaje('login-message', 'Credenciales inválidas. Por favor, inténtalo de nuevo.', true);
        } else if (urlParams.has('logout')) {
            mostrarMensaje('login-message', 'Has cerrado sesión exitosamente.', false);
        }

        const token = localStorage.getItem('jwtToken');
        if (token) {
            const respuesta = await fetch(`${API_BASE_URL}/usuarios/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (respuesta.ok) {
                const userData = await respuesta.json();
                handleLoginSuccess({ ...userData, jwtToken: token });
            } else {
                localStorage.removeItem('jwtToken');
                usuarioActual = null;
                actualizarNavegacion();
                mostrarIniciarSesion();
            }
        } else {
            usuarioActual = null;
            actualizarNavegacion();
            mostrarIniciarSesion();
        }
    } catch (error) {
        console.error("Error al verificar estado de autenticación:", error);
        localStorage.removeItem('jwtToken');
        usuarioActual = null;
        actualizarNavegacion();
        mostrarMensaje('login-message', 'Error de conexión con el servidor. Inténtalo más tarde.', true);
        mostrarIniciarSesion();
    }
}

async function iniciarSesion(evento) {
    console.log("DEBUG: Función iniciarSesion ha sido llamada.");
    evento.preventDefault();
    const formulario = document.getElementById('login-form');
    const datosFormulario = new FormData(formulario);
    const credenciales = Object.fromEntries(datosFormulario.entries());

    ocultarMensajes('login-message');

    try {
        const respuesta = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credenciales)
        });

        const datos = await respuesta.json().catch(() => ({ message: respuesta.statusText || 'Error desconocido' }));

        if (respuesta.ok) {
            handleLoginSuccess(datos);
            mostrarMensaje('login-message', '¡Inicio de sesión exitoso!', false);
        } else {
            mostrarMensaje('login-message', datos.message || 'Credenciales inválidas. Inténtalo de nuevo.', true);
        }
    } catch (error) {
        mostrarMensaje('login-message', `Error de red: ${error.message}. Verifica tu conexión o el servidor.`, true);
    }
}

async function registrar(evento) {
    evento.preventDefault();
    const formulario = document.getElementById('register-form');
    const datosFormulario = new FormData(formulario);
    const datosUsuario = Object.fromEntries(datosFormulario.entries());

    datosUsuario.rol = 'VOLUNTARIO';

    if (!datosUsuario.contrasena || datosUsuario.contrasena.trim() === '') {
        mostrarMensaje('register-message', 'La contraseña no puede estar vacía.', true);
        return;
    }

    ocultarMensajes('register-message');

    try {
        const respuesta = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosUsuario)
        });

        const datos = await respuesta.json().catch(() => ({ mensaje: respuesta.statusText || 'Error desconocido' }));

        if (respuesta.ok) {
            mostrarMensaje('register-message', '¡Registro exitoso! Ahora puedes iniciar sesión.', false);
            formulario.reset();
            mostrarIniciarSesion();
        } else {
            mostrarMensaje('register-message', datos.mensaje || 'Error en el registro. Inténtalo de nuevo.', true);
        }
    } catch (error) {
        mostrarMensaje('register-message', `Error de red: ${error.message}. Verifica tu conexión o el servidor.`, true);
        console.error("Error al registrar:", error);
    }
}

async function cerrarSesion() {
    try {
        localStorage.removeItem('jwtToken');
        usuarioActual = null;
        actualizarNavegacion();
        window.location.href = '/?logout';
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
        mostrarMensaje('login-message', 'Error al cerrar sesión. Por favor, inténtalo de nuevo.', true);
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
    document.getElementById('register-form').reset();
}

// --- Perfil de Usuario ---

async function mostrarPerfil() {
    if (!usuarioActual) { mostrarIniciarSesion(); return; }
    mostrarSeccion('profile-section');
    document.getElementById('profile-id').value = usuarioActual.id;
    document.getElementById('profile-username').value = usuarioActual.nombreUsuario;
    document.getElementById('profile-nombre').value = usuarioActual.nombre;
    document.getElementById('profile-apellido').value = usuarioActual.apellido;
    document.getElementById('profile-email').value = usuarioActual.email;
    document.getElementById('profile-telefono').value = usuarioActual.telefono || '';
    document.getElementById('profile-rol').value = usuarioActual.rol;
    document.getElementById('profile-calificacion').value = usuarioActual.calificacion !== undefined ? usuarioActual.calificacion.toFixed(1) : 'N/A';
    document.getElementById('profile-activo').checked = usuarioActual.activo;

    ocultarMensajes('profile-message');
    ocultarMensajes('change-password-message');
    document.getElementById('change-password-form').reset();
}

async function actualizarPerfil(evento) {
    evento.preventDefault();
    if (!usuarioActual) { mostrarIniciarSesion(); return; }

    const datosPerfil = {
        id: usuarioActual.id,
        nombreUsuario: usuarioActual.nombreUsuario,
        nombre: document.getElementById('profile-nombre').value.trim(),
        apellido: document.getElementById('profile-apellido').value.trim(),
        email: document.getElementById('profile-email').value.trim(),
        telefono: document.getElementById('profile-telefono').value.trim(),
        rol: usuarioActual.rol,
        calificacion: usuarioActual.calificacion,
        activo: usuarioActual.activo
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
            usuarioActual = datos;
            mostrarMensaje('profile-message', '¡Perfil actualizado exitosamente!', false);
            actualizarNavegacion();
            mostrarPerfil();
        } else {
            mostrarMensaje('profile-message', datos.mensaje || 'Error al actualizar el perfil.', true);
        }
    } catch (error) {
        mostrarMensaje('profile-message', `Error de red: ${error.message}`, true);
        console.error("Error al actualizar perfil:", error);
    }
}

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
                userId: usuarioActual.id,
                currentPassword: contrasenaActual,
                newPassword: nuevaContrasena
            })
        });

        const datos = await respuesta.json().catch(() => ({ mensaje: 'Respuesta inválida del servidor.' }));

        if (respuesta.ok) {
            mostrarMensaje('change-password-message', '¡Contraseña cambiada exitosamente!', false);
            document.getElementById('change-password-form').reset();
        } else {
            mostrarMensaje('change-password-message', datos.mensaje || 'Error al cambiar la contraseña. Verifica tu contraseña actual.', true);
        }
    } catch (error) {
        mostrarMensaje('change-password-message', `Error de red: ${error.message}`, true);
        console.error("Error al cambiar contraseña:", error);
    }
}

// --- Campañas (para Voluntarios) ---

async function mostrarCampanas() {
    if (!usuarioActual) { mostrarIniciarSesion(); return; }
    mostrarSeccion('campaigns-section');
    const listaCampanas = document.getElementById('campaigns-list');
    ocultarMensajes('campaigns-message');
    listaCampanas.innerHTML = '<p>Cargando campañas...</p>';

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
                listaCampanas.innerHTML = '';
                datos.forEach(campana => {
                    const divCampana = document.createElement('div');
                    divCampana.className = 'card';
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
    ocultarMensajes('modal-action-message');

    titulo.textContent = 'Cargando...';
    descripcion.textContent = '';
    ubicacion.textContent = '';
    fechaInicio.textContent = '';
    fechaFin.textContent = '';
    estado.textContent = '';
    divEvidencias.innerHTML = '';
    botonAccion.style.display = 'none';

    mostrarModal('campaign-details-modal');

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/campanas/${idCampana}`, { headers });
        const campana = await respuesta.json().catch(() => ({ mensaje: 'Respuesta inválida del servidor al cargar detalles de campaña.' }));

        if (respuesta.ok) {
            titulo.textContent = campana.nombre;
            descripcion.textContent = campana.descripcion;
            ubicacion.textContent = campana.ubicacion;
            fechaInicio.textContent = campana.fechaInicio;
            fechaFin.textContent = campana.fechaFin;
            estado.textContent = campana.estado;

            divEvidencias.innerHTML = '<p>No hay evidencias para esta campaña.</p>';

            if (!esContextoAdmin && usuarioActual.rol === 'VOLUNTARIO') {
                const respuestaInscripcion = await fetch(`${API_BASE_URL}/campanas/${campana.id}/inscrito/${usuarioActual.id}`, { headers }); // Añadir headers para la verificación
                let estaInscrito = false;
                if (respuestaInscripcion.ok) {
                    estaInscrito = await respuestaInscripcion.json();
                } else {
                    console.warn(`No se pudo verificar la inscripción para campaña ${campana.id}:`, respuestaInscripcion.status);
                    estaInscrito = false;
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
                botonAccion.style.display = 'none';
            }
        } else {
            mostrarMensaje('modal-action-message', campana.mensaje || 'Error al cargar detalles de la campaña.', true);
        }
    } catch (error) {
        mostrarMensaje('modal-action-message', `Error de red: ${error.message}`, true);
        console.error("Error al mostrar detalles de campaña:", error);
    }
}

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
            const botonAccion = document.getElementById('modal-campaign-action-button');
            botonAccion.textContent = 'Anular Inscripción';
            botonAccion.onclick = () => anularInscripcion(idCampana);
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
            const botonAccion = document.getElementById('modal-campaign-action-button');
            botonAccion.textContent = 'Inscribirse';
            botonAccion.onclick = () => inscribirseCampana(idCampana);
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

        const respuesta = await fetch(`${API_BASE_URL}/campanas`, { headers });
        const datos = await respuesta.json().catch(() => ({ mensaje: 'Respuesta inválida del servidor al cargar campañas para admin.' }));

        if (respuesta.ok) {
            if (datos.length === 0) {
                listaCampanas.innerHTML = '<p>No hay campañas para gestionar.</p>';
            } else {
                listaCampanas.innerHTML = '';
                datos.forEach(campana => {
                    const divCampana = document.createElement('div');
                    divCampana.className = 'card';
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
    console.log("DEBUG: Función mostrarFormularioCrearCampana ha sido llamada.");
    const formulario = document.getElementById('campaign-admin-form');
    formulario.reset();
    document.getElementById('campaign-form-title').textContent = 'Crear Nueva Campaña';
    document.getElementById('campaign-form-submit-button').textContent = 'Crear Campaña';
    document.getElementById('campaign-form-submit-button').dataset.mode = 'create';
    document.getElementById('admin-campaign-id').value = '';
    document.getElementById('admin-campaign-estado').value = 'PLANIFICADA';
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
 * También maneja el caso en que la fecha ya esté en 'YYYY-MM-DD' (si se carga de un input).
 * @param {string} dateString - La fecha en formato 'DD/MM/YYYY' o 'YYYY-MM-DD'.
 * @returns {string|null} La fecha formateada a 'YYYY-MM-DD' o null si es inválida.
 */
function formatDateToYYYYMMDD(dateString) {
    if (!dateString) return null;
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateString;
    }
    const parts = dateString.split('/');
    if (parts.length === 3) {
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return null;
}

async function manejarEnvioCampana(evento) {
    console.log("DEBUG: Función manejarEnvioCampana ha sido llamada.");
    evento.preventDefault();
    if (!usuarioActual || usuarioActual.rol !== 'ADMIN') {
        mostrarMensaje('campaign-form-message', 'No tienes permisos para realizar esta acción.', true);
        return;
    }

    const formulario = document.getElementById('campaign-admin-form');
    const idCampana = document.getElementById('admin-campaign-id').value;
    const modo = document.getElementById('campaign-form-submit-button').dataset.mode;

    const datosCampana = {
        nombre: document.getElementById('admin-campaign-nombre').value.trim(),
        descripcion: document.getElementById('admin-campaign-descripcion').value.trim(),
        ubicacion: document.getElementById('admin-campaign-ubicacion').value.trim(),
        fechaInicio: formatDateToDDMMYYYY(document.getElementById('admin-campaign-fechaInicio').value),
        fechaFin: formatDateToDDMMYYYY(document.getElementById('admin-campaign-fechaFin').value),
        estado: document.getElementById('admin-campaign-estado').value
    };

    ocultarMensajes('campaign-form-message');

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        let respuesta;
        if (modo === 'create') {
            respuesta = await fetch(`${API_BASE_URL}/campanas`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(datosCampana)
            });
        } else if (modo === 'edit') {
            respuesta = await fetch(`${API_BASE_URL}/campanas/${idCampana}`, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify(datosCampana)
            });
        } else {
            mostrarMensaje('campaign-form-message', 'Modo de operación desconocido.', true);
            return;
        }

        const datos = await respuesta.json().catch(() => ({ mensaje: respuesta.statusText || 'Respuesta inválida del servidor.' }));

        if (respuesta.ok) {
            mostrarMensaje('campaign-form-message', `Campaña ${modo === 'create' ? 'creada' : 'actualizada'} exitosamente!`, false);
            formulario.reset();
            cerrarModal('campaign-form-modal');
            mostrarGestionCampanasAdmin();
        } else {
            mostrarMensaje('campaign-form-message', datos.mensaje || `Error al ${modo === 'create' ? 'crear' : 'actualizar'} la campaña.`, true);
        }
    } catch (error) {
        mostrarMensaje('campaign-form-message', `Error de red: ${error.message}`, true);
        console.error(`Error al ${modo === 'create' ? 'crear' : 'actualizar'} campaña:`, error);
    }
}

async function editarCampana(idCampana) {
    if (!usuarioActual || usuarioActual.rol !== 'ADMIN') { mostrarIniciarSesion(); return; }
    ocultarMensajes('campaign-form-message');
    const formulario = document.getElementById('campaign-admin-form');
    formulario.reset();
    document.getElementById('campaign-form-title').textContent = 'Editar Campaña';
    document.getElementById('campaign-form-submit-button').textContent = 'Guardar Cambios';
    document.getElementById('campaign-form-submit-button').dataset.mode = 'edit';
    document.getElementById('admin-campaign-id').value = idCampana;
    mostrarModal('campaign-form-modal');

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/campanas/${idCampana}`, { headers });
        const campana = await respuesta.json().catch(() => ({ mensaje: 'Respuesta inválida del servidor al cargar campaña para edición.' }));

        if (respuesta.ok) {
            document.getElementById('admin-campaign-nombre').value = campana.nombre;
            document.getElementById('admin-campaign-descripcion').value = campana.descripcion;
            document.getElementById('admin-campaign-ubicacion').value = campana.ubicacion;
            document.getElementById('admin-campaign-fechaInicio').value = formatDateToYYYYMMDD(campana.fechaInicio);
            document.getElementById('admin-campaign-fechaFin').value = formatDateToYYYYMMDD(campana.fechaFin);
            document.getElementById('admin-campaign-estado').value = campana.estado;
        } else {
            mostrarMensaje('campaign-form-message', campana.mensaje || 'Error al cargar la campaña para edición.', true);
            cerrarModal('campaign-form-modal');
        }
    } catch (error) {
        mostrarMensaje('campaign-form-message', `Error de red: ${error.message}`, true);
        console.error("Error al cargar campaña para edición:", error);
        cerrarModal('campaign-form-modal');
    }
}

/**
 * Elimina una campaña.*/
async function eliminarCampana(idCampana) {
    if (!usuarioActual || usuarioActual.rol !== 'ADMIN') {
        mostrarMensaje('admin-campaigns-message', 'No tienes permisos para eliminar campañas.', true);
        return;
    }

    if (!confirm('¿Estás seguro de que deseas eliminar esta campaña?')) {
        return;
    }

    ocultarMensajes('admin-campaigns-message');
    try {
        const token = localStorage.getItem('jwtToken');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/campanas/${idCampana}`, {
            method: 'DELETE',
            headers: headers
        });

        if (respuesta.ok) {
            mostrarMensaje('admin-campaigns-message', 'Campaña eliminada exitosamente.', false);
            mostrarGestionCampanasAdmin();
        } else {
            const datos = await respuesta.json().catch(() => ({ mensaje: respuesta.statusText || 'Error desconocido' }));
            mostrarMensaje('admin-campaigns-message', datos.mensaje || 'Error al eliminar la campaña.', true);
        }
    } catch (error) {
        mostrarMensaje('admin-campaigns-message', `Error de red: ${error.message}`, true);
        console.error("Error al eliminar campaña:", error);
    }
}


// --- Gestión de Voluntarios (para Administradores) ---

async function mostrarVoluntarios() {
    if (!usuarioActual || usuarioActual.rol !== 'ADMIN') { mostrarIniciarSesion(); return; }
    mostrarSeccion('admin-volunteers-section');
    const listaVoluntarios = document.getElementById('volunteers-list');
    ocultarMensajes('volunteers-message');
    listaVoluntarios.innerHTML = '<p>Cargando voluntarios...</p>';

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/usuarios?rol=VOLUNTARIO`, { headers });
        const datos = await respuesta.json().catch(() => ({ mensaje: 'Respuesta inválida del servidor al cargar voluntarios.' }));

        if (respuesta.ok) {
            if (datos.length === 0) {
                listaVoluntarios.innerHTML = '<p>No hay voluntarios registrados.</p>';
            } else {
                listaVoluntarios.innerHTML = '';
                datos.forEach(voluntario => {
                    const divVoluntario = document.createElement('div');
                    divVoluntario.className = 'card';
                    divVoluntario.innerHTML = `
                        <h3>${voluntario.nombre} ${voluntario.apellido} (${voluntario.nombreUsuario})</h3>
                        <p>Email: ${voluntario.email}</p>
                        <p>Teléfono: ${voluntario.telefono || 'N/A'}</p>
                        <p>Calificación: ${voluntario.calificacion !== undefined ? voluntario.calificacion.toFixed(1) : 'N/A'}</p>
                        <p>Activo: ${voluntario.activo ? 'Sí' : 'No'}</p>
                        <button onclick="toggleEstadoVoluntario('${voluntario.id}', ${voluntario.activo})">
                            ${voluntario.activo ? 'Desactivar' : 'Activar'}
                        </button>
                    `;
                    listaVoluntarios.appendChild(divVoluntario);
                });
            }
        } else {
            mostrarMensaje('volunteers-message', datos.mensaje || 'Error al cargar voluntarios.', true);
        }
    } catch (error) {
        mostrarMensaje('volunteers-message', `Error de red: ${error.message}`, true);
        console.error("Error al cargar voluntarios:", error);
    }
}

async function toggleEstadoVoluntario(idVoluntario, estadoActual) {
    if (!usuarioActual || usuarioActual.rol !== 'ADMIN') {
        mostrarMensaje('volunteers-message', 'No tienes permisos para cambiar el estado de voluntarios.', true);
        return;
    }

    const nuevoEstado = !estadoActual;
    const mensajeConfirmacion = nuevoEstado ? '¿Estás seguro de que deseas ACTIVAR este voluntario?' : '¿Estás seguro de que deseas DESACTIVAR este voluntario?';

    if (!confirm(mensajeConfirmacion)) {
        return;
    }

    ocultarMensajes('volunteers-message');
    try {
        const token = localStorage.getItem('jwtToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/usuarios/${idVoluntario}/estado`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify({ activo: nuevoEstado })
        });

        if (respuesta.ok) {
            mostrarMensaje('volunteers-message', `Voluntario ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente.`, false);
            mostrarVoluntarios();
        } else {
            const datos = await respuesta.json().catch(() => ({ mensaje: respuesta.statusText || 'Error desconocido' }));
            mostrarMensaje('volunteers-message', datos.mensaje || 'Error al cambiar el estado del voluntario.', true);
        }
    } catch (error) {
        mostrarMensaje('volunteers-message', `Error de red: ${error.message}`, true);
        console.error("Error al cambiar estado de voluntario:", error);
    }
}

// --- Reportes (para Administradores) ---

async function mostrarReportesAdmin() {
    if (!usuarioActual || usuarioActual.rol !== 'ADMIN') { mostrarIniciarSesion(); return; }
    mostrarSeccion('reports-section');
    const loadingMessage = document.getElementById('reports-admin-loading');
    const errorMessage = document.getElementById('reports-admin-error');
    const reportsContent = document.getElementById('reports-content');

    loadingMessage.style.display = 'block';
    errorMessage.style.display = 'none';
    reportsContent.style.display = 'none';

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/reportes/resumen`, { headers });
        const datos = await respuesta.json().catch(() => ({ mensaje: 'Respuesta inválida del servidor al cargar reportes.' }));

        loadingMessage.style.display = 'none';

        if (respuesta.ok) {
            document.getElementById('total-campanas').textContent = datos.totalCampanas;
            document.getElementById('campanas-activas').textContent = datos.campanasActivas;
            document.getElementById('campanas-planificadas').textContent = datos.campanasPlanificadas;
            document.getElementById('campanas-finalizadas').textContent = datos.campanasFinalizadas;
            document.getElementById('campanas-canceladas').textContent = datos.campanasCanceladas !== undefined ? datos.campanasCanceladas : 'N/A';
            document.getElementById('total-usuarios').textContent = datos.totalUsuarios;
            document.getElementById('total-voluntarios').textContent = datos.totalVoluntarios;
            reportsContent.style.display = 'block';
        } else {
            errorMessage.textContent = datos.mensaje || 'Error al cargar los reportes.';
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        loadingMessage.style.display = 'none';
        errorMessage.textContent = `Error de red: ${error.message}.`;
        errorMessage.style.display = 'block';
        console.error("Error al cargar reportes:", error);
    }
}

// --- Calendario ---

let calendar;

async function mostrarCalendario() {
    if (!usuarioActual) { mostrarIniciarSesion(); return; }
    mostrarSeccion('calendar-section');
    const calendarEl = document.getElementById('fullcalendar-container');
    ocultarMensajes('calendar-message');

    if (calendar) {
        calendar.destroy();
    }

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/campanas/eventos`, { headers });
        const datos = await respuesta.json().catch(() => {
            console.error("Error al parsear JSON de eventos de calendario.");
            mostrarMensaje('calendar-message', 'Respuesta inválida del servidor al cargar eventos de calendario.', true);
            return [];
        });

        if (respuesta.ok) {
            const formattedEvents = datos.map(evento => ({
                id: evento.id,
                title: evento.nombre,
                start: formatDateToYYYYMMDD(evento.fechaInicio),
                end: formatDateToYYYYMMDD(evento.fechaFin),
                extendedProps: {
                    descripcion: evento.descripcion,
                    ubicacion: evento.ubicacion,
                    estado: evento.estado
                },
                color: getColorForEstado(evento.estado)
            }));

            calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                locale: 'es',
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                },
                events: formattedEvents,
                eventClick: function(info) {
                    const event = info.event;
                    let details = `
                        <strong>Campaña:</strong> ${event.title}<br>
                        <strong>Descripción:</strong> ${event.extendedProps.descripcion || 'N/A'}<br>
                        <strong>Ubicación:</strong> ${event.extendedProps.ubicacion || 'N/A'}<br>
                        <strong>Estado:</strong> ${event.extendedProps.estado || 'N/A'}<br>
                        <strong>Inicio:</strong> ${event.start ? event.start.toLocaleDateString('es-ES') : 'N/A'}<br>
                        <strong>Fin:</strong> ${event.end ? event.end.toLocaleDateString('es-ES') : 'N/A'}
                    `;

                    console.log("Detalles del evento:", details);
                },
                dateClick: function(info) {
                }
            });
            calendar.render();
        } else {
            mostrarMensaje('calendar-message', datos.mensaje || 'Error al cargar eventos del calendario.', true);
        }
    } catch (error) {
        mostrarMensaje('calendar-message', `Error de red: ${error.message}`, true);
        console.error("Error al cargar calendario:", error);
    }
}

function getColorForEstado(estado) {
    switch (estado) {
        case 'PLANIFICADA':
            return '#3498db'; // Azul
        case 'ACTIVA':
            return '#2ecc71'; // Verde
        case 'FINALIZADA':
            return '#95a5a6'; // Gris
        case 'CANCELADA':
            return '#e74c3c'; // Rojo
        default:
            return '#f39c12'; // Naranja (para estados desconocidos)
    }
}

// --- Notificaciones ---

async function mostrarNotificaciones() {
    if (!usuarioActual) { mostrarIniciarSesion(); return; }
    mostrarSeccion('notifications-section');
    const listaNotificaciones = document.getElementById('notifications-list');
    ocultarMensajes('notifications-message');
    listaNotificaciones.innerHTML = '<p>Cargando notificaciones...</p>';

    try {
        const token = localStorage.getItem('jwtToken');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/notificaciones/usuario/${usuarioActual.id}`, { headers });
        const datos = await respuesta.json().catch(() => ({ mensaje: 'Respuesta inválida del servidor al cargar notificaciones.' }));

        if (respuesta.ok) {
            if (datos.length === 0) {
                listaNotificaciones.innerHTML = '<p>No tienes notificaciones nuevas.</p>';
            } else {
                listaNotificaciones.innerHTML = '';
                datos.forEach(notificacion => {
                    const divNotificacion = document.createElement('div');
                    divNotificacion.className = 'card notification-card';
                    divNotificacion.innerHTML = `
                        <h4>${notificacion.titulo}</h4>
                        <p>${notificacion.mensaje}</p>
                        <small>Fecha: ${new Date(notificacion.fechaCreacion).toLocaleDateString()} ${new Date(notificacion.fechaCreacion).toLocaleTimeString()}</small>
                        <p>Leída: ${notificacion.leida ? 'Sí' : 'No'}</p>
                        ${!notificacion.leida ? `<button onclick="marcarNotificacionLeida('${notificacion.id}')">Marcar como Leída</button>` : ''}
                    `;
                    listaNotificaciones.appendChild(divNotificacion);
                });
            }
        } else {
            mostrarMensaje('notifications-message', datos.mensaje || 'Error al cargar notificaciones.', true);
        }
    } catch (error) {
        mostrarMensaje('notifications-message', `Error de red: ${error.message}`, true);
        console.error("Error al cargar notificaciones:", error);
    }
}

async function marcarNotificacionLeida(idNotificacion) {
    if (!usuarioActual) { mostrarIniciarSesion(); return; }
    ocultarMensajes('notifications-message');
    try {
        const token = localStorage.getItem('jwtToken');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const respuesta = await fetch(`${API_BASE_URL}/notificaciones/${idNotificacion}/marcar-leida`, {
            method: 'PUT',
            headers: headers
        });

        if (respuesta.ok) {
            mostrarMensaje('notifications-message', 'Notificación marcada como leída.', false);
            mostrarNotificaciones();
        } else {
            const datos = await respuesta.json().catch(() => ({ mensaje: respuesta.statusText || 'Error desconocido' }));
            mostrarMensaje('notifications-message', datos.mensaje || 'Error al marcar notificación como leída.', true);
        }
    } catch (error) {
        mostrarMensaje('notifications-message', `Error de red: ${error.message}`, true);
        console.error("Error al marcar notificación como leída:", error);
    }
}


// --- Inicialización de la Aplicación ---

// Se ejecuta cuando el DOM está completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    verificarEstadoAutenticacion();
});
