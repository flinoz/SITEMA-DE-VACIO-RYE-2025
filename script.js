let personal = JSON.parse(localStorage.getItem("personal")) || [
  { nombre: "JESUS LAGUNES", descanso: "Sábado" },
  { nombre: "ISAAC SOLANO", descanso: "Viernes" },
  { nombre: "CARLOS CHIMAL", descanso: "Lunes" },
  { nombre: "DAVID PEÑA", descanso: "Jueves" },
  { nombre: "MIGUEL HERNANDEZ", descanso: "Martes" },
  { nombre: "FELIPE LINO", descanso: "Miércoles" },
  { nombre: "ASIGNAR PERSONAL", descanso: "Domingo" },
];

let editIndex = null;
let historial = JSON.parse(localStorage.getItem("historial")) || [];

const form = document.getElementById("form-personal");
const nombreInput = document.getElementById("nombre");
const descansoInput = document.getElementById("descanso");
const listaPersonal = document.getElementById("lista-personal");
const historialContainer = document.getElementById("historial");

// 1. SISTEMA DE NOTIFICACIONES
let notificationTimeout;
function mostrarNotificacion(mensaje, tipo = 'info') {
  let notif = document.getElementById('notificacion');
  if (!notif) {
    notif = document.createElement('div');
    notif.id = 'notificacion';
    notif.style.position = 'fixed';
    notif.style.top = '0px';
    notif.style.left = '50%';
    notif.style.transform = 'translateX(-50%)';
    notif.style.padding = '18px 32px';
    notif.style.borderRadius = '0 0 12px 12px';
    notif.style.fontWeight = 'bold';
    notif.style.zIndex = '99999';
    notif.style.color = '#fff';
    notif.style.fontSize = '1.2em';
    notif.style.boxShadow = '0 4px 16px rgba(0,0,0,0.18)';
    notif.style.display = 'flex';
    notif.style.alignItems = 'center';
    notif.style.gap = '12px';
    document.body.appendChild(notif);
  }
  let icon = '';
  if (tipo === 'error') icon = '❌';
  else if (tipo === 'success') icon = '✅';
  else icon = 'ℹ️';
  notif.style.background = tipo === 'error' ? '#e74c3c' : (tipo === 'success' ? '#1abc9c' : '#2980b9');
  notif.innerHTML = `<span style='font-size:1.5em;'>${icon}</span> <span>${mensaje}</span>`;
  notif.style.display = 'flex';
  clearTimeout(notificationTimeout);
  notificationTimeout = setTimeout(() => {
    notif.style.display = 'none';
  }, tipo === 'success' ? 6000 : 3000);
}

function guardarDatos() {
  localStorage.setItem("personal", JSON.stringify(personal));
  localStorage.setItem("historial", JSON.stringify(historial));
}

function renderPersonal() {
  listaPersonal.innerHTML = "";
  personal.forEach((p, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${p.nombre} - Descansa: ${p.descanso}</span>
      <button class="edit" onclick="editar(${i})">✏️</button>
      <button class="delete" onclick="eliminar(${i})">🗑️</button>
    `;
    listaPersonal.appendChild(li);
  });
}

function editar(index) {
  editIndex = index;
  nombreInput.value = personal[index].nombre;
  descansoInput.value = personal[index].descanso;
}

function eliminar(index) {
  personal.splice(index, 1);
  guardarDatos();
  renderPersonal();
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const nombre = nombreInput.value.trim();
  const descanso = descansoInput.value;
  if (!nombre || !descanso) return;

  if (editIndex !== null) {
    personal[editIndex] = { nombre, descanso };
    editIndex = null;
  } else {
    personal.push({ nombre, descanso });
  }

  guardarDatos();
  renderPersonal();
  form.reset();
});

// Mostrar el mes actual en el título del historial
function mostrarMesActual() {
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const mes = new Date().getMonth();
  const spanMes = document.getElementById('mes-actual');
  if (spanMes) spanMes.textContent = meses[mes];
}
mostrarMesActual();

document.getElementById("asignar-vacio").addEventListener("click", () => {
  // Validar fechas antes de asignar
  const fechaInicio = document.getElementById('fecha-inicio').value;
  const fechaFin = document.getElementById('fecha-fin').value;
  if (!fechaInicio || !fechaFin) {
    mostrarNotificacion('Debes ingresar la fecha de inicio y fin de la semana.', 'error');
    return;
  }
  // Validar que no se repitan las fechas de semana
  const semana = `${fechaInicio} a ${fechaFin}`;
  const yaExiste = historial.some(h => h.semana === semana);
  if (yaExiste) {
    mostrarNotificacion('Ya existe una asignación para esa semana. Las fechas no pueden repetirse.', 'error');
    return;
  }
  const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  const asignados = {};
  const disponibles = [...personal];
  let diasSinAsignar = [];
  dias.forEach(dia => {
    const candidatos = disponibles.filter(p => p.descanso.toLowerCase() !== dia.toLowerCase());
    if (candidatos.length === 0) {
      asignados[dia] = asignados[dia] || "No asignado";
      diasSinAsignar.push(dia);
      return;
    }
    const elegido = candidatos[Math.floor(Math.random() * candidatos.length)];
    asignados[dia] = elegido.nombre;
    const idx = disponibles.findIndex(p => p.nombre === elegido.nombre);
    if (idx !== -1) disponibles.splice(idx, 1);
  });
  // Guardar en historial
  historial.push({ semana, asignados });
  guardarDatos();
  mostrarHistorial();
  // Solo notificar error si algún día (excepto domingo) quedó sin asignar
  const diasSinAsignarFiltrado = diasSinAsignar.filter(d => d !== "Domingo");
  if (diasSinAsignarFiltrado.length > 0) {
    mostrarNotificacion(`No se pudo asignar: ${diasSinAsignarFiltrado.join(', ')}`, 'error');
  } else {
    mostrarNotificacion('Semana generada exitosamente', 'success');
  }
});

function reasignar(dia) {
  const nuevo = prompt(`¿Quién realizará el vacío el día ${dia}?`);
  if (!nuevo) return;
  // Ya no se actualiza listaAsignaciones
  const semanaActual = historial[historial.length - 1];
  if (semanaActual) {
    semanaActual.asignados[dia] = nuevo;
    guardarDatos();
    mostrarHistorial();
    mostrarNotificacion(`Asignación de ${dia} actualizada`, 'success');
  }
}

function mostrarHistorial() {
  historialContainer.innerHTML = "";
  const mesActual = new Date().getMonth();
  const historialFiltrado = historial.filter(h => {
    if (!h.semana) return false;
    const fechaInicio = h.semana.split(' a ')[0];
    const fechaObj = new Date(fechaInicio);
    return fechaObj.getMonth() === mesActual;
  });
  if (historialFiltrado.length === 0) {
    historialContainer.innerHTML = '<p style="color: #888;">No hay historial para este mes.</p>';
    return;
  }
  const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  const tabla = document.createElement('table');
  tabla.style.width = '100%';
  tabla.style.borderCollapse = 'collapse';
  tabla.innerHTML = `
    <thead>
      <tr style="background:#2980b9;color:#fff;">
        <th style="padding:8px;border:1px solid #ccc;">Semana</th>
        <th style="padding:8px;border:1px solid #ccc;">Asignaciones</th>
        <th style="padding:8px;border:1px solid #ccc;">Acciones</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  historialFiltrado.forEach((h, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="padding:8px;border:1px solid #ccc;"><strong>${h.semana}</strong></td>
      <td style="padding:8px;border:1px solid #ccc;">${dias.map(dia => `<div><b>${dia}:</b> ${h.asignados[dia] || "No asignado"}</div>`).join('')}</td>
      <td style="padding:8px;border:1px solid #ccc;">
        <button onclick="editarHistorial(${idx})" style="margin-right:5px;">✏️ Editar</button>
        <button onclick="eliminarHistorial(${idx})">🗑️ Eliminar</button>
      </td>
    `;
    tabla.querySelector('tbody').appendChild(tr);
  });
  historialContainer.appendChild(tabla);
}

// Mejorar edición profesional con modal
if (!document.getElementById('modal-editar-historial')) {
  const modal = document.createElement('div');
  modal.id = 'modal-editar-historial';
  modal.style.display = 'none';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100vw';
  modal.style.height = '100vh';
  modal.style.background = 'rgba(0,0,0,0.4)';
  modal.style.zIndex = '100000';
  modal.style.justifyContent = 'center';
  modal.style.alignItems = 'center';
  modal.innerHTML = `
    <div style="background:#fff;padding:32px 24px;border-radius:12px;min-width:320px;max-width:90vw;box-shadow:0 4px 24px rgba(0,0,0,0.18);position:relative;">
      <h3 style="margin-top:0;">Editar asignaciones de la semana</h3>
      <form id="form-editar-historial"></form>
      <div style="text-align:right;margin-top:18px;">
        <button type="button" id="cerrar-modal-editar" style="background:#e74c3c;color:#fff;padding:8px 18px;border:none;border-radius:6px;">Cancelar</button>
        <button type="submit" id="guardar-modal-editar" style="background:#1abc9c;color:#fff;padding:8px 18px;border:none;border-radius:6px;margin-left:8px;">Guardar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}
window.editarHistorial = function(idx) {
  const mesActual = new Date().getMonth();
  const historialFiltrado = historial.filter(h => {
    if (!h.semana) return false;
    const fechaInicio = h.semana.split(' a ')[0];
    const fechaObj = new Date(fechaInicio);
    return fechaObj.getMonth() === mesActual;
  });
  const h = historialFiltrado[idx];
  if (!h) return;
  const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  const modal = document.getElementById('modal-editar-historial');
  const form = modal.querySelector('#form-editar-historial');
  form.innerHTML = dias.map(dia => `
    <label style='display:block;margin-bottom:8px;'>
      <b>${dia}:</b>
      <input type='text' name='${dia}' value='${h.asignados[dia] || "No asignado"}' style='margin-left:8px;padding:4px 8px;border-radius:4px;border:1px solid #ccc;width:70%;'>
    </label>
  `).join('');
  modal.style.display = 'flex';
  // Cerrar modal
  modal.querySelector('#cerrar-modal-editar').onclick = () => {
    modal.style.display = 'none';
  };
  // Guardar cambios
  modal.querySelector('#guardar-modal-editar').onclick = (e) => {
    e.preventDefault();
    dias.forEach(dia => {
      const valor = form.querySelector(`[name='${dia}']`).value.trim();
      h.asignados[dia] = valor || "No asignado";
    });
    guardarDatos();
    mostrarHistorial();
    mostrarNotificacion('Historial actualizado', 'success');
    modal.style.display = 'none';
  };
};
// Función para eliminar historial
window.eliminarHistorial = function(idx) {
  if (confirm('¿Seguro que deseas eliminar esta semana del historial?')) {
    const mesActual = new Date().getMonth();
    const historialFiltrado = historial.filter(h => {
      if (!h.semana) return false;
      const fechaInicio = h.semana.split(' a ')[0];
      const fechaObj = new Date(fechaInicio);
      return fechaObj.getMonth() === mesActual;
    });
    const h = historialFiltrado[idx];
    const indexReal = historial.indexOf(h);
    if (indexReal !== -1) {
      historial.splice(indexReal, 1);
      guardarDatos();
      mostrarHistorial();
      mostrarNotificacion('Semana eliminada del historial', 'success');
    }
  }
}

// LOGIN LOGIC
window.addEventListener('DOMContentLoaded', function() {
  const overlay = document.getElementById('login-overlay');
  const form = document.getElementById('login-form');
  const usuarioInput = document.getElementById('login-usuario');
  const passwordInput = document.getElementById('login-password');
  const errorDiv = document.getElementById('login-error');
  const btnLogout = document.getElementById('btn-logout');
  const usuarioActivo = document.getElementById('usuario-activo');
  if (!overlay || !form) return;
  document.body.style.overflow = 'hidden';
  document.body.classList.add('login-active');
  form.onsubmit = function(e) {
    e.preventDefault();
    const usuario = usuarioInput.value.trim();
    const password = passwordInput.value;
    if (usuario === 'Admin2025' && password === 'RYE2025') {
      overlay.style.display = 'none';
      document.body.style.overflow = '';
      errorDiv.style.display = 'none';
      usuarioInput.value = '';
      passwordInput.value = '';
      mostrarNotificacion('¡Bienvenido! Has iniciado sesión correctamente.', 'success');
      if (btnLogout) btnLogout.style.display = 'block';
      if (usuarioActivo) {
        usuarioActivo.textContent = `Usuario: ${usuario}`;
        usuarioActivo.style.display = 'inline-block';
      }
      document.body.classList.remove('login-active');
    } else {
      errorDiv.textContent = 'Usuario o contraseña incorrectos';
      errorDiv.style.display = 'block';
      passwordInput.value = '';
      passwordInput.focus();
    }
  };
  overlay.style.display = 'flex';
  if (btnLogout) {
    btnLogout.onclick = function() {
      overlay.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      btnLogout.style.display = 'none';
      if (usuarioActivo) usuarioActivo.style.display = 'none';
      setTimeout(() => {
        mostrarNotificacion('Sesión cerrada correctamente.', 'success');
        const notif = document.getElementById('notificacion');
        if (notif) notif.style.zIndex = '300000';
      }, 100);
      document.body.classList.add('login-active');
    };
  }
});

// Inicial
renderPersonal();
mostrarHistorial();
