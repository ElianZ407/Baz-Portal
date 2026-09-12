import React, { useState, useEffect } from 'react';
import { X, Save, Truck, Layers, FileSpreadsheet, AlertTriangle, CheckCircle2, MapPin } from 'lucide-react';
import { useFleet } from '../context/FleetContext';
import { LINEAS_TRANSPORTE, TURNOS } from '../data/initialFleetData';
import { SUCURSALES_MAESTRAS, buscarSucursal, validarRestriccionesViaje } from '../data/sucursalesData';

export const UnitModal = () => {
  const { isModalOpen, setIsModalOpen, selectedUnit, saveUnit } = useFleet();

  const [formData, setFormData] = useState({
    noViaje: '',
    economico: '',
    bloque: 1,
    placas: '',
    capUnidad: 50,
    linea: 'LINEA 1 - VHS',
    tipo: 'Sencillo',
    operador: '',
    turno: 'M1',
    cortina: '51',
    numCarga: 'CS-0039-101',
    numSucursal: '',
    sucursalOrigen: 'CEDIS VILLAHERMOSA',
    destino: '',
    closter: '',
    fl: 'LOCAL',
    capMax: '',
    fecha: '2026-09-10',
    horaSalida: '08:00 AM',
    tiempoEstimadoHrs: 3.0,
    eta: '11:00 AM',
    estatusPatio: 'Disponible',
    estatusPlaneacion: 'Pendiente',
    estatusSupervisor: 'Pendiente',
    observaciones: ''
  });

  useEffect(() => {
    if (selectedUnit) {
      setFormData({
        ...selectedUnit,
        noViaje: selectedUnit.noViaje || '',
        bloque: selectedUnit.bloque || 1,
        placas: selectedUnit.placas || '',
        capUnidad: selectedUnit.capUnidad || 50,
        linea: selectedUnit.linea || 'LINEA 1 - VHS',
        numCarga: selectedUnit.numCarga || '',
        closter: selectedUnit.closter || '',
        fl: selectedUnit.fl || 'LOCAL',
        capMax: selectedUnit.capMax || ''
      });
    } else {
      setFormData({
        noViaje: '',
        economico: '',
        bloque: 1,
        placas: '',
        capUnidad: 50,
        linea: 'LINEA 1 - VHS',
        tipo: 'Sencillo',
        operador: '',
        turno: 'M1',
        cortina: '',
        numCarga: '',
        numSucursal: '',
        sucursalOrigen: 'CEDIS VILLAHERMOSA',
        destino: '',
        closter: '',
        fl: 'LOCAL',
        capMax: '',
        fecha: '2026-09-10',
        horaSalida: '08:00 AM',
        tiempoEstimadoHrs: 3.0,
        eta: '11:00 AM',
        estatusPatio: 'Disponible',
        estatusPlaneacion: 'Pendiente',
        estatusSupervisor: 'Pendiente',
        observaciones: ''
      });
    }
  }, [selectedUnit, isModalOpen]);

  // Manejo de cambios con auto-completado de sucursal desde matriz CD Villahermosa
  const handleChange = (e) => {
    const { name, value } = e.target;
    let updated = { ...formData, [name]: value };

    // Si el usuario cambia el número de sucursal
    if (name === 'numSucursal') {
      const match = buscarSucursal(value);
      if (match) {
        updated.destino = match.nombre;
        updated.closter = match.closter;
        updated.fl = match.fl;
        updated.capMax = match.capMax;
      }
    }

    // Si el usuario cambia el nombre de destino
    if (name === 'destino') {
      const match = buscarSucursal(value);
      if (match) {
        updated.numSucursal = match.id;
        updated.closter = match.closter;
        updated.fl = match.fl;
        updated.capMax = match.capMax;
      }
    }

    setFormData(updated);
  };

  const handleSelectSucursal = (sucursal) => {
    setFormData(prev => ({
      ...prev,
      numSucursal: sucursal.id,
      destino: sucursal.nombre,
      closter: sucursal.closter,
      fl: sucursal.fl,
      capMax: sucursal.capMax
    }));
  };

  // Validaciones operativas según matriz de CD Villahermosa
  const targetIdOrName = formData.numSucursal || formData.destino;
  const warnings = targetIdOrName ? validarRestriccionesViaje([targetIdOrName], Number(formData.capUnidad)) : [];
  const sucursalInfo = targetIdOrName ? buscarSucursal(targetIdOrName) : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.economico) {
      alert('Por favor ingrese el número económico de la unidad');
      return;
    }

    saveUnit(formData);
    setIsModalOpen(false);
  };

  if (!isModalOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
      <div className="modal-content" style={{ maxWidth: '740px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <FileSpreadsheet size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px', color: 'var(--accent-cyan)' }} />
            {selectedUnit ? `Editar Viaje / Unidad ECO ${selectedUnit.economico}` : 'Registrar Nuevo Embarque / Unidad'}
          </h3>
          <button className="modal-close" onClick={() => setIsModalOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Datalists para autocompletado rápido */}
        <datalist id="sucursales-ids-list">
          {SUCURSALES_MAESTRAS.map(s => (
            <option key={s.id} value={s.id}>
              {s.nombre} — {s.closter} ({s.fl})
            </option>
          ))}
        </datalist>

        <datalist id="sucursales-names-list">
          {SUCURSALES_MAESTRAS.map(s => (
            <option key={s.id} value={s.nombre}>
              ID: {s.id} — {s.closter} ({s.fl})
            </option>
          ))}
        </datalist>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Alertas de Restricción Operativa en Vivo */}
            {warnings.length > 0 && (
              <div className="alert-restriction-box" style={{ marginBottom: '1.25rem' }}>
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ display: 'block', marginBottom: '0.2rem', color: '#fff' }}>
                    Alerta de Restricción Operativa (Matriz CD Villahermosa):
                  </strong>
                  {warnings.map((w, idx) => (
                    <div key={idx}>{w}</div>
                  ))}
                </div>
              </div>
            )}

            {sucursalInfo && sucursalInfo.restriccion && warnings.length === 0 && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                borderLeft: '4px solid #f59e0b',
                color: '#fde68a',
                padding: '0.6rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.25rem',
                fontSize: '0.8rem',
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center'
              }}>
                <AlertTriangle size={16} color="#fbbf24" />
                <span><strong>Regla de Sucursal:</strong> {sucursalInfo.restriccion}</span>
              </div>
            )}

            <div className="form-grid">
              {/* No. Viaje */}
              <div className="form-group">
                <label>No. de Viaje</label>
                <input 
                  type="number"
                  name="noViaje"
                  className="form-control"
                  placeholder="Ej: 1, 2, 3..."
                  value={formData.noViaje}
                  onChange={handleChange}
                />
              </div>

              {/* Económico */}
              <div className="form-group">
                <label>ECO Unidad *</label>
                <input 
                  type="text"
                  name="economico"
                  className="form-control"
                  placeholder="Ej: 3353, 4135, C3..."
                  required
                  value={formData.economico}
                  onChange={handleChange}
                />
              </div>

              {/* Bloque */}
              <div className="form-group">
                <label>Bloque de Salida</label>
                <select 
                  name="bloque" 
                  className="form-control"
                  value={formData.bloque}
                  onChange={handleChange}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(b => (
                    <option key={b} value={b}>Bloque {b}</option>
                  ))}
                </select>
              </div>

              {/* Placas */}
              <div className="form-group">
                <label>Placas</label>
                <input 
                  type="text"
                  name="placas"
                  className="form-control"
                  placeholder="Ej: MX-3353-A"
                  value={formData.placas}
                  onChange={handleChange}
                />
              </div>

              {/* Capacidad Unidad */}
              <div className="form-group">
                <label>Capacidad Unidad (Motos / Vol.)</label>
                <select 
                  name="capUnidad" 
                  className="form-control"
                  value={formData.capUnidad}
                  onChange={handleChange}
                >
                  <option value={18}>18 (Camioneta / Rabón Chico)</option>
                  <option value={40}>40 (Madrina Mediana)</option>
                  <option value={50}>50 (Madrina Estándar / Remolque)</option>
                  <option value={70}>70 (Intercedis / Trailer)</option>
                  <option value={90}>90 (Madrina Grande)</option>
                  <option value={110}>110 (Full Tráiler)</option>
                </select>
              </div>

              {/* Línea de Transporte */}
              <div className="form-group">
                <label>Línea de Transporte</label>
                <select 
                  name="linea" 
                  className="form-control"
                  value={formData.linea}
                  onChange={handleChange}
                >
                  {LINEAS_TRANSPORTE.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              {/* Operador */}
              <div className="form-group full-width">
                <label>Nombre del Operador</label>
                <input 
                  type="text"
                  name="operador"
                  className="form-control"
                  placeholder="Ej: OPERADOR 101"
                  value={formData.operador}
                  onChange={handleChange}
                />
              </div>

              {/* # Carga */}
              <div className="form-group">
                <label># Carga (Folio)</label>
                <input 
                  type="text"
                  name="numCarga"
                  className="form-control"
                  placeholder="Ej: CS-0039-101"
                  value={formData.numCarga}
                  onChange={handleChange}
                />
              </div>

              {/* Cortinas */}
              <div className="form-group">
                <label>Cortina(s) de Embarque</label>
                <input 
                  type="text"
                  name="cortina"
                  className="form-control"
                  placeholder="Ej: 51, 18, 52..."
                  value={formData.cortina}
                  onChange={handleChange}
                />
              </div>

              {/* # Sucursal con Autocomplete */}
              <div className="form-group">
                <label># Sucursal (ID Matriz)</label>
                <input 
                  type="text"
                  name="numSucursal"
                  list="sucursales-ids-list"
                  className="form-control"
                  placeholder="Ej: 4860, 6018, 9464..."
                  value={formData.numSucursal}
                  onChange={handleChange}
                />
              </div>

              {/* Destino / Sucursal con Autocomplete */}
              <div className="form-group">
                <label>Sucursal Destino</label>
                <input 
                  type="text"
                  name="destino"
                  list="sucursales-names-list"
                  className="form-control"
                  placeholder="Ej: MEGA COMALCALCO..."
                  value={formData.destino}
                  onChange={handleChange}
                />
              </div>

              {/* Clóster Logístico (Auto) */}
              <div className="form-group">
                <label>Clóster Logístico (Matriz)</label>
                <input 
                  type="text"
                  name="closter"
                  className="form-control"
                  placeholder="Ej: CLUSTER COMALCALCO, V-1, CH-5..."
                  value={formData.closter || ''}
                  onChange={handleChange}
                />
              </div>

              {/* Tipo F / L */}
              <div className="form-group">
                <label>Clasificación (F / L)</label>
                <select 
                  name="fl" 
                  className="form-control"
                  value={formData.fl || 'LOCAL'}
                  onChange={handleChange}
                >
                  <option value="LOCAL">LOCAL (Tabasco / Zonas de corta distancia)</option>
                  <option value="FORANEO">FORÁNEO (Chiapas, Oaxaca, Península, Veracruz)</option>
                </select>
              </div>

              {/* Hora de Salida */}
              <div className="form-group">
                <label>Hora de Salida Prog.</label>
                <input 
                  type="text"
                  name="horaSalida"
                  className="form-control"
                  placeholder="06:00 AM"
                  value={formData.horaSalida}
                  onChange={handleChange}
                />
              </div>

              {/* ETA */}
              <div className="form-group">
                <label>Llegada Estimada (ETA)</label>
                <input 
                  type="text"
                  name="eta"
                  className="form-control"
                  placeholder="08:30 AM"
                  value={formData.eta}
                  onChange={handleChange}
                />
              </div>

              {/* Estatus Patio */}
              <div className="form-group">
                <label>Estatus Patio (En CD)</label>
                <select 
                  name="estatusPatio" 
                  className="form-control"
                  value={formData.estatusPatio}
                  onChange={handleChange}
                >
                  <option value="Disponible">Disponible</option>
                  <option value="Colocado p/ Carga">Colocado p/ Carga</option>
                  <option value="Cargado">Cargado</option>
                  <option value="Taller">Taller / Mtto</option>
                </select>
              </div>

              {/* Estatus Supervisor */}
              <div className="form-group">
                <label>Estatus Supervisor (Ruta)</label>
                <select 
                  name="estatusSupervisor" 
                  className="form-control"
                  value={formData.estatusSupervisor}
                  onChange={handleChange}
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="En Ruta">En Ruta</option>
                  <option value="Espera Descarga">Espera Descarga</option>
                  <option value="Descargando">Descargando</option>
                  <option value="Retorno">Retorno</option>
                  <option value="Retrasado">Retrasado / Alerta</option>
                  <option value="Completado">Completado</option>
                </select>
              </div>

              {/* Observaciones */}
              <div className="form-group full-width">
                <label>Observaciones / Restricciones Adicionales</label>
                <textarea 
                  name="observaciones"
                  rows="2"
                  className="form-control"
                  placeholder="Notas sobre auditoría, sellos, rampas o novedades..."
                  value={formData.observaciones}
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} />
              <span>Guardar Viaje</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
