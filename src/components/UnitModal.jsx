import React, { useState, useEffect } from 'react';
import { X, Save, Truck, Layers, FileSpreadsheet, AlertTriangle, CheckCircle2, MapPin, Wrench, Trash2 } from 'lucide-react';
import { useFleet } from '../context/FleetContext';
import { LINEAS_TRANSPORTE, TURNOS, BLOQUES } from '../data/initialFleetData';
import { SUCURSALES_MAESTRAS, buscarSucursal, validarRestriccionesViaje } from '../data/sucursalesData';
import { FLOTA_TOTAL, buscarUnidadPorEco, OPERADORES_ACTIVOS } from '../data/flotaMaestraData';
import { SucursalSelector } from './SucursalSelector';
import { UnidadSelector } from './UnidadSelector';

export const UnitModal = () => {
  const { isModalOpen, setIsModalOpen, selectedUnit, saveUnit, deleteUnit, showConfirm, activeArea } = useFleet();
  const isPatioMode = activeArea === 'patio';

  const [formData, setFormData] = useState({
    noViaje: '',
    economico: '',
    bloque: 1,
    placas: '',
    capUnidad: 50,
    linea: 'LTI - VHS',
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
    estatusPlaneacion: 'PENDIENTE',
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
        linea: selectedUnit.linea || 'LTI - VHS',
        numCarga: selectedUnit.numCarga || '',
        closter: selectedUnit.closter || '',
        fl: selectedUnit.fl || 'LOCAL',
        capMax: selectedUnit.capMax || '',
        estatusPlaneacion: selectedUnit.estatusPlaneacion || 'PENDIENTE'
      });
    } else {
      setFormData({
        noViaje: '',
        economico: '',
        bloque: 1,
        placas: '',
        capUnidad: 50,
        linea: 'LTI - VHS',
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
        estatusPlaneacion: 'PENDIENTE',
        estatusSupervisor: 'Pendiente',
        observaciones: ''
      });
    }
  }, [selectedUnit, isModalOpen]);

  // Selección inteligente desde el catálogo de unidades
  const handleSelectUnidad = (unidad) => {
    setFormData(prev => ({
      ...prev,
      economico: unidad.eco,
      placas: unidad.placas,
      capUnidad: unidad.capUnidad || prev.capUnidad,
      tipo: unidad.tipo || prev.tipo,
      linea: unidad.linea || prev.linea,
      operador: selectedUnit?.operador || '', // No mostrar operador si la unidad solo está en patio sin estar programada en planeación
      estatusPatio: unidad.estatusPatio || (unidad.estatus === 'TALLER' ? 'Taller' : (prev.estatusPatio || 'Disponible'))
    }));
  };

  // Selección inteligente desde el catálogo de sucursales
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

  // Manejo de cambios estándar para inputs de texto
  const handleChange = (e) => {
    const { name, value } = e.target;
    let updated = { ...formData, [name]: value };

    // Si el usuario cambia el estatus de planeación
    if (name === 'estatusPlaneacion') {
      if (value === 'EN CASETA') {
        updated.estatusPatio = 'Cargado';
        if (updated.estatusSupervisor === 'Pendiente' || !updated.estatusSupervisor) {
          updated.estatusSupervisor = 'En Ruta';
        }
      } else if (value === 'COLOCADO') {
        updated.estatusPatio = 'Colocado p/ Carga';
        updated.estatusSupervisor = 'Pendiente';
      } else if (value === 'PENDIENTE') {
        updated.estatusPatio = 'Disponible';
        updated.estatusSupervisor = 'Pendiente';
      }
    }

    setFormData(updated);
  };

  // Validaciones operativas según matriz de CD Villahermosa y padrón de flota
  const targetIdOrName = formData.numSucursal || formData.destino;
  const warnings = targetIdOrName ? validarRestriccionesViaje([targetIdOrName], Number(formData.capUnidad)) : [];
  const sucursalInfo = targetIdOrName ? buscarSucursal(targetIdOrName) : null;
  const flotaInfo = buscarUnidadPorEco(formData.economico);

  const isTallerUnit = formData.estatusPatio === 'Taller' || flotaInfo?.estatus === 'TALLER';
  const isBlockedForPlaneacion = !isPatioMode && isTallerUnit;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.economico) {
      alert('Por favor seleccione o ingrese el número económico de la unidad');
      return;
    }

    if (isBlockedForPlaneacion) {
      alert('La unidad seleccionada se encuentra en Taller Mecánico y no puede ser programada en Planeación.');
      return;
    }

    const payload = isPatioMode ? {
      ...formData,
      operador: '',
      idOperador: '',
      estatusPlaneacion: formData.estatusPlaneacion || 'PENDIENTE',
      estatusSupervisor: formData.estatusSupervisor || 'Pendiente'
    } : formData;

    saveUnit(payload);
    setIsModalOpen(false);
  };

  if (!isModalOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
      <div className="modal-content" style={{ maxWidth: '780px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>
              {isPatioMode ? (
                <Truck size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px', color: '#10b981' }} />
              ) : (
                <FileSpreadsheet size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px', color: 'var(--accent-cyan)' }} />
              )}
              {isPatioMode 
                ? (selectedUnit ? `Gestionar Unidad en Patio ECO ${selectedUnit.economico}` : 'Registrar Nueva Unidad en Patio')
                : (selectedUnit ? `Editar Viaje / Unidad ECO ${selectedUnit.economico}` : 'Registrar Nuevo Embarque / Unidad')
              }
            </h3>
            <p style={{ margin: 0, fontSize: '0.78rem', color: isPatioMode ? '#34d399' : 'var(--text-muted)' }}>
              {isPatioMode 
                ? 'Control vehicular en CD Villahermosa — Registro exclusivo de la unidad física (sin operador)' 
                : 'Programación de embarques, operador, ruta y carga'}
            </p>
          </div>
          <button className="modal-close" onClick={() => setIsModalOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Datalist solo para operadores */}
        <datalist id="operadores-list">
          {OPERADORES_ACTIVOS.map(op => (
            <option key={op} value={op} />
          ))}
        </datalist>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Alerta de Unidad Bloqueada si está en Taller y estamos en Planeación */}
            {isBlockedForPlaneacion && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                borderLeft: '4px solid #ef4444',
                color: '#fca5a5',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.25rem',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem'
              }}>
                <Wrench size={18} color="#ef4444" style={{ flexShrink: 0 }} />
                <div>
                  <strong style={{ display: 'block', color: '#fff', marginBottom: '0.2rem' }}>
                    ⛔ UNIDAD EN TALLER MECÁNICO (NO PROGRAMABLE):
                  </strong>
                  La unidad <strong>ECO {formData.economico}</strong> está en <strong>Taller Mecánico</strong>. No puede ser programada en Planeación hasta que esté disponible en Patio.
                </div>
              </div>
            )}

            {/* Alerta si la unidad tiene estatus especial en la flota */}
            {flotaInfo && flotaInfo.estatus !== 'ACTIVO' && !isBlockedForPlaneacion && (
              <div style={{
                background: flotaInfo.estatus === 'TALLER' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                border: `1px solid ${flotaInfo.estatus === 'TALLER' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                borderLeft: `4px solid ${flotaInfo.estatus === 'TALLER' ? '#ef4444' : '#f59e0b'}`,
                color: flotaInfo.estatus === 'TALLER' ? '#fca5a5' : '#fde68a',
                padding: '0.65rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.25rem',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem'
              }}>
                {flotaInfo.estatus === 'TALLER' ? <Wrench size={17} /> : <AlertTriangle size={17} />}
                <div>
                  <strong>Aviso del Padrón de Flota:</strong> La unidad <strong>ECO {flotaInfo.eco} ({flotaInfo.placas})</strong> está registrada como: <strong>{flotaInfo.estatus}</strong>.
                </div>
              </div>
            )}

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

            {isPatioMode ? (
              <div className="form-grid">
                {/* ECO Unidad con Selector Inteligente y Completo */}
                <div className="form-group full-width">
                  <label>ECO Unidad (Padrón Oficial - {FLOTA_TOTAL.length} Unidades) *</label>
                  <UnidadSelector 
                    value={formData.economico}
                    onSelect={handleSelectUnidad}
                    mode="patio"
                  />
                </div>

                {/* Placas */}
                <div className="form-group">
                  <label>Placas</label>
                  <input 
                    type="text"
                    name="placas"
                    className="form-control"
                    placeholder="Ej: GT3465C, 11FA5G..."
                    value={formData.placas}
                    onChange={handleChange}
                  />
                </div>

                {/* Capacidad Unidad */}
                <div className="form-group">
                  <label>Capacidad Unidad (m³)</label>
                  <select 
                    name="capUnidad" 
                    className="form-control"
                    value={formData.capUnidad}
                    onChange={handleChange}
                  >
                    <option value={18}>18 m³ (Camioneta / Rabón Chico)</option>
                    <option value={40}>40 m³ (Madrina Mediana)</option>
                    <option value={50}>50 m³ (Madrina Estándar / Rango Medio)</option>
                    <option value={70}>70 m³ (Intercedis / Trailer)</option>
                    <option value={90}>90 m³ (Caja Seca Sencilla)</option>
                    <option value={110}>110 m³ (Full Tráiler)</option>
                  </select>
                </div>

                {/* Tipo de Unidad */}
                <div className="form-group">
                  <label>Tipo de Vehículo</label>
                  <select 
                    name="tipo" 
                    className="form-control"
                    value={formData.tipo}
                    onChange={handleChange}
                  >
                    <option value="Camioneta">Camioneta (18 m³)</option>
                    <option value="Rango Medio">Rango Medio (50 m³)</option>
                    <option value="Madrina / Rango Medio">Madrina / Rango Medio</option>
                    <option value="Sencillo">Sencillo (90 m³)</option>
                    <option value="Tracto / Sencillo">Tracto / Sencillo</option>
                    <option value="Tracto / Full">Tracto / Full (110 m³)</option>
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

                {/* Estatus Patio */}
                <div className="form-group">
                  <label>Estatus en Patio (En CD) *</label>
                  <select 
                    name="estatusPatio" 
                    className="form-control"
                    value={formData.estatusPatio}
                    onChange={handleChange}
                    style={{ fontWeight: 700 }}
                  >
                    <option value="Disponible">🟢 Disponible en Patio</option>
                    <option value="Colocado p/ Carga">🟡 Colocado p/ Carga</option>
                    <option value="Cargado">🔵 Cargado</option>
                    <option value="Taller">🔴 Taller / Mtto</option>
                  </select>
                </div>

                {/* Cajón / Rampa en Patio */}
                <div className="form-group">
                  <label>Cajón / Rampa / Cortina en Patio</label>
                  <input 
                    type="text"
                    name="cortina"
                    className="form-control"
                    placeholder="Ej: Cajón 04, Rampa 18, Taller 1..."
                    value={formData.cortina}
                    onChange={handleChange}
                  />
                </div>

                {/* Observaciones de Unidad */}
                <div className="form-group full-width">
                  <label>Observaciones del Vehículo / Condición Física</label>
                  <textarea 
                    name="observaciones"
                    rows="2"
                    className="form-control"
                    placeholder="Ej: Unidad revisada, tanque lleno, mantenimiento de frenos, lista para carga..."
                    value={formData.observaciones}
                    onChange={handleChange}
                  ></textarea>
                </div>
              </div>
            ) : (
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

                {/* Bloque */}
                <div className="form-group">
                  <label>Bloque de Salida</label>
                  <select 
                    name="bloque" 
                    className="form-control"
                    value={formData.bloque}
                    onChange={handleChange}
                  >
                    {BLOQUES.map(b => (
                      <option key={b} value={b}>Bloque {b}</option>
                    ))}
                  </select>
                </div>

                {/* ECO Unidad con Selector Inteligente y Completo */}
                <div className="form-group full-width">
                  <label>ECO Unidad (Unidades en Patio — Solo Disponibles y Taller) *</label>
                  <UnidadSelector 
                    value={formData.economico}
                    onSelect={handleSelectUnidad}
                    mode="planeacion"
                  />
                </div>

                {/* Placas (Auto-completadas) */}
                <div className="form-group">
                  <label>Placas</label>
                  <input 
                    type="text"
                    name="placas"
                    className="form-control"
                    placeholder="Ej: GT3465C, 11FA5G..."
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
                    <option value={50}>50 (Madrina Estándar / Rango Medio)</option>
                    <option value={70}>70 (Intercedis / Trailer)</option>
                    <option value={90}>90 (Caja Seca Sencilla)</option>
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
                <div className="form-group">
                  <label>Nombre del Operador</label>
                  <input 
                    type="text"
                    name="operador"
                    list="operadores-list"
                    className="form-control"
                    placeholder="Ej: ANTONIO PEREZ PALMA..."
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
                    placeholder="Ej: CS00390172"
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

                {/* Selector Inteligente de Sucursal Destino (Siempre muestra todas) */}
                <div className="form-group full-width">
                  <label>Sucursal Destino (Catálogo CD Villahermosa - {SUCURSALES_MAESTRAS.length} Tiendas)</label>
                  <SucursalSelector 
                    value={formData.numSucursal || formData.destino}
                    onSelect={handleSelectSucursal}
                  />
                </div>

                {/* Clóster Logístico (Auto) */}
                <div className="form-group">
                  <label>Clóster Logístico (Matriz)</label>
                  <input 
                    type="text"
                    name="closter"
                    className="form-control"
                    placeholder="Ej: CLUSTER COMALCALCO, V-1..."
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

                {/* Estatus Planeación (Oficial Excel) */}
                <div className="form-group full-width">
                  <label>Estatus Planeación (Oficial)</label>
                  <select 
                    name="estatusPlaneacion" 
                    className="form-control"
                    value={formData.estatusPlaneacion || 'PENDIENTE'}
                    onChange={handleChange}
                    style={
                      formData.estatusPlaneacion === 'EN CASETA' 
                        ? { background: '#fef08a', color: '#713f12', fontWeight: 800, borderColor: '#eab308' } 
                        : formData.estatusPlaneacion === 'COLOCADO'
                        ? { borderColor: '#06b6d4', color: '#22d3ee' }
                        : {}
                    }
                  >
                    <option value="PENDIENTE">PENDIENTE</option>
                    <option value="COLOCADO">COLOCADO</option>
                    <option value="EN CASETA">EN CASETA</option>
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
            )}
          </div>

          <div className="modal-footer">
            {selectedUnit && (
              <button 
                type="button" 
                className="btn btn-secondary"
                style={{ 
                  marginRight: 'auto', 
                  color: '#f87171', 
                  borderColor: 'rgba(239, 68, 68, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
                onClick={() => {
                  showConfirm({
                    title: `¿Eliminar ${isPatioMode ? 'unidad' : 'viaje / unidad'} ECO ${selectedUnit.economico}?`,
                    message: 'Esta unidad será retirada de planeación, patio y de los tableros operativos.',
                    unit: selectedUnit,
                    confirmText: 'Sí, eliminar',
                    confirmType: 'danger',
                    onConfirm: () => {
                      deleteUnit(selectedUnit.id);
                      setIsModalOpen(false);
                    }
                  });
                }}
              >
                <Trash2 size={15} />
                <span>Eliminar {isPatioMode ? 'Unidad' : 'Viaje'}</span>
              </button>
            )}
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isBlockedForPlaneacion}
              style={isBlockedForPlaneacion ? { opacity: 0.5, cursor: 'not-allowed', background: '#334155', borderColor: '#475569' } : {}}
            >
              <Save size={16} />
              <span>{isPatioMode ? 'Guardar Unidad en Patio' : isBlockedForPlaneacion ? 'Bloqueada por Taller' : 'Guardar Viaje'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
