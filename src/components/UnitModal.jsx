import React, { useState, useEffect } from 'react';
import { X, Save, Truck, Layers, FileSpreadsheet, AlertTriangle, CheckCircle2, MapPin, Wrench, Trash2, Plus, Package } from 'lucide-react';
import { useFleet } from '../context/FleetContext';
import { LINEAS_TRANSPORTE, TURNOS, BLOQUES, SUCURSALES_MAESTRAS, FLOTA_TOTAL, OPERADORES_ACTIVOS } from '../constants/fleetConstants';
import { buscarSucursal, validarRestriccionesViaje, buscarUnidadPorEco, buscarIdOperadorPorNombre, buscarOperadorPorEco, checkTieneViajeYOperador } from '../utils/fleetUtils';
import { SucursalSelector } from './SucursalSelector';
import { UnidadSelector } from './UnidadSelector';
import { OperadorSelector } from './OperadorSelector';
import { CustomSelect } from './CustomSelect';

export const UnitModal = () => {
  const { isModalOpen, setIsModalOpen, selectedUnit, saveUnit, deleteUnit, showConfirm, showAlert, activeArea, catalogoFlota, catalogoSucursales } = useFleet();
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
    idOperador: '',
    turno: 'M1',
    cortina: '51',
    numCarga: 'CS-0039-101',
    numSucursal: '',
    sucursalOrigen: 'CEDIS VILLAHERMOSA',
    destino: '',
    destinosSecundarios: [],
    closter: '',
    fl: 'LOCAL',
    capMax: '',
    fecha: new Date().toISOString().split('T')[0],
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
      const resolvedId = selectedUnit.idOperador || 
        (selectedUnit.operador ? buscarIdOperadorPorNombre(selectedUnit.operador) : (selectedUnit.economico ? buscarOperadorPorEco(selectedUnit.economico)?.idOperador : '')) || '';
      
      const secDestinos = Array.isArray(selectedUnit.destinosSecundarios)
        ? selectedUnit.destinosSecundarios
        : (typeof selectedUnit.destinosSecundarios === 'string' && selectedUnit.destinosSecundarios.startsWith('[')
            ? JSON.parse(selectedUnit.destinosSecundarios)
            : []);

      setFormData({
        ...selectedUnit,
        noViaje: selectedUnit.noViaje || '',
        bloque: Number(selectedUnit.bloque) || 1,
        capUnidad: Number(selectedUnit.capUnidad) || 18,
        linea: selectedUnit.linea || 'LTI - VHS',
        tipo: selectedUnit.tipo || 'Camioneta',
        operador: selectedUnit.operador || '',
        idOperador: selectedUnit.idOperador || '',
        turno: selectedUnit.turno || 'M1',
        cortina: selectedUnit.cortina || '',
        numCarga: selectedUnit.numCarga || '',
        numSucursal: selectedUnit.numSucursal || '',
        sucursalOrigen: selectedUnit.sucursalOrigen || 'CEDIS VILLAHERMOSA',
        destino: (selectedUnit.destino || '').replace(/\s*\(Retorno\)/gi, '').trim(),
        destinosSecundarios: secDestinos,
        closter: selectedUnit.closter || '',
        fl: selectedUnit.fl || 'LOCAL',
        capMax: selectedUnit.capMax || '',
        fecha: selectedUnit.fecha || new Date().toISOString().split('T')[0],
        horaSalida: selectedUnit.horaSalida || '',
        tiempoEstimadoHrs: Number(selectedUnit.tiempoEstimadoHrs) || 0,
        eta: selectedUnit.eta || '',
        estatusPatio: selectedUnit.estatusPatio || 'Disponible',
        estatusPlaneacion: selectedUnit.estatusPlaneacion || 'PENDIENTE',
        estatusSupervisor: selectedUnit.estatusSupervisor || 'Pendiente',
        observaciones: selectedUnit.observaciones || ''
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
        idOperador: '',
        turno: 'M1',
        cortina: '',
        numCarga: '',
        numSucursal: '',
        sucursalOrigen: 'CEDIS VILLAHERMOSA',
        destino: '',
        destinosSecundarios: [],
        closter: '',
        fl: 'LOCAL',
        capMax: '',
        fecha: new Date().toISOString().split('T')[0],
        horaSalida: '',
        tiempoEstimadoHrs: 0,
        eta: '',
        estatusPatio: 'Disponible',
        estatusPlaneacion: 'PENDIENTE',
        estatusSupervisor: 'Pendiente',
        observaciones: ''
      });
    }
  }, [selectedUnit, isModalOpen]);

  // Selección inteligente de sucursal desde el selector custom
  const handleSelectSucursal = (sucursal) => {
    if (!sucursal) return;
    setFormData(prev => ({
      ...prev,
      numSucursal: sucursal.id,
      destino: sucursal.nombre,
      closter: sucursal.closter,
      fl: sucursal.fl || 'LOCAL',
      capMax: sucursal.capMax || ''
    }));
  };

  // Manejo de paradas secundarias (múltiples entregas / destinos en un solo viaje)
  const handleAddParada = () => {
    setFormData(prev => ({
      ...prev,
      destinosSecundarios: [
        ...(prev.destinosSecundarios || []),
        {
          id: `parada-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          numSucursal: '',
          destino: '',
          closter: '',
          numCarga: '',
          esVtex: false,
          folioVtex: '',
          cortina: prev.cortina || ''
        }
      ]
    }));
  };

  const handleAddVtex = () => {
    setFormData(prev => ({
      ...prev,
      destinosSecundarios: [
        ...(prev.destinosSecundarios || []),
        {
          id: `vtex-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          numSucursal: prev.numSucursal || '',
          destino: 'VTEX',
          closter: '',
          numCarga: '',
          esVtex: true,
          folioVtex: '',
          cortina: prev.cortina || ''
        }
      ]
    }));
  };

  const handleUpdateParada = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      destinosSecundarios: (prev.destinosSecundarios || []).map(p => {
        if (p.id !== id) return p;
        return { ...p, [field]: value };
      })
    }));
  };

  const handleSelectSucursalParada = (id, sucursal) => {
    if (!sucursal) return;
    setFormData(prev => ({
      ...prev,
      destinosSecundarios: (prev.destinosSecundarios || []).map(p => {
        if (p.id !== id) return p;
        return {
          ...p,
          numSucursal: sucursal.id,
          destino: sucursal.nombre,
          closter: sucursal.closter || '',
          fl: sucursal.fl || 'LOCAL'
        };
      })
    }));
  };

  const handleRemoveParada = (id) => {
    setFormData(prev => ({
      ...prev,
      destinosSecundarios: (prev.destinosSecundarios || []).filter(p => p.id !== id)
    }));
  };

  // Selección inteligente de unidad desde el padrón
  const handleSelectUnidad = (unidad) => {
    if (!unidad || !unidad.eco) {
      setFormData(prev => ({
        ...prev,
        economico: '',
        placas: ''
      }));
      return;
    }
    setFormData(prev => ({
      ...prev,
      economico: unidad.eco,
      placas: unidad.placas || '',
      tipo: unidad.tipo || prev.tipo,
      capUnidad: Number(unidad.capUnidad || prev.capUnidad),
      linea: unidad.linea || prev.linea,
      estatusPatio: unidad.estatusPatio || prev.estatusPatio || 'Disponible',
      operador: isPatioMode ? '' : (prev.operador || unidad.operador || ''),
      idOperador: isPatioMode ? '' : (prev.idOperador || unidad.idOperador || '')
    }));
  };

  // Manejo de cambios estándar para inputs de texto
  const handleChange = (e) => {
    const { name, value } = e.target;
    let updated = { ...formData, [name]: value };

    // Si el usuario cambia el estatus de planeación
    if (name === 'estatusPlaneacion') {
      if (value === 'CARGADO') {
        updated.estatusPatio = 'Cargado';
        if (['Pendiente', 'No Disponible', 'En Espera', ''].includes(updated.estatusSupervisor) || !updated.estatusSupervisor) {
          updated.estatusSupervisor = 'Cargado';
        }
      } else if (value === 'COLOCADO') {
        updated.estatusPatio = 'Colocado p/ Carga';
        if (updated.estatusSupervisor === 'No Disponible') {
          updated.estatusSupervisor = 'Pendiente';
        }
      } else if (value === 'PENDIENTE') {
        updated.estatusPatio = 'Disponible';
        if (updated.estatusSupervisor === 'No Disponible') {
          updated.estatusSupervisor = 'Pendiente';
        }
      }
    }

    setFormData(updated);
  };

  // Validaciones operativas según matriz de CD Villahermosa y padrón de flota
  const targetIdOrName = formData.numSucursal || formData.destino;
  const warnings = targetIdOrName ? validarRestriccionesViaje([targetIdOrName], Number(formData.capUnidad), catalogoSucursales) : [];
  const sucursalInfo = targetIdOrName ? buscarSucursal(targetIdOrName, catalogoSucursales) : null;
  const flotaInfo = formData.economico ? buscarUnidadPorEco(formData.economico, catalogoFlota) : null;

  const isTallerUnit = formData.estatusPatio === 'Taller' || flotaInfo?.estatus === 'TALLER';
  const isBlockedForPlaneacion = !isPatioMode && isTallerUnit;

  const handleSubmit = (e) => {
    e.preventDefault();

    // Solo en Patio es obligatorio el número económico (porque Patio registra vehículos físicos)
    if (isPatioMode && !formData.economico) {
      showAlert({
        title: 'Dato Requerido en Patio',
        message: 'Por favor seleccione o ingrese el número económico de la unidad para registrar en Patio.',
        confirmType: 'warning',
        confirmText: 'Entendido'
      });
      return;
    }

    if (formData.economico && isBlockedForPlaneacion) {
      showAlert({
        title: 'Unidad en Taller Mecánico',
        message: `La unidad ECO ${formData.economico} se encuentra en Taller Mecánico y no puede ser programada en Planeación.`,
        unit: formData,
        confirmType: 'danger',
        confirmText: 'Entendido'
      });
      return;
    }

    // Validación oficial: no se puede colocar ni poner en caseta (CARGADO) si falta viaje, operador o destino
    if (!isPatioMode && (formData.estatusPlaneacion === 'COLOCADO' || formData.estatusPlaneacion === 'CARGADO')) {
      const { valid, hasViaje, hasOperador, hasDestino } = checkTieneViajeYOperador(formData);
      if (!valid) {
        const faltantes = [];
        if (!hasViaje) faltantes.push('Número de Viaje');
        if (!hasOperador) faltantes.push('Operador Asignado');
        if (!hasDestino) faltantes.push('Destino / Sucursal Asignada');
        
        showAlert({
          title: 'Validación Operativa — BAZ Entregas',
          message: `Para registrar la unidad con estatus ${formData.estatusPlaneacion === 'COLOCADO' ? 'COLOCADO (En Cortina)' : 'CARGADO (En Caseta)'}, es obligatorio registrar:\n\n• ${faltantes.join('\n• ')}\n\nPor favor asigne estos datos antes de guardar.`,
          unit: formData,
          confirmType: 'warning',
          confirmText: 'Entendido'
        });
        return;
      }
    }

    const resolvedIdOp = formData.idOperador || (formData.operador ? buscarIdOperadorPorNombre(formData.operador, catalogoFlota) : (formData.economico ? buscarOperadorPorEco(formData.economico, catalogoFlota)?.idOperador : '')) || '';

    const payload = isPatioMode ? {
      ...formData,
      operador: '',
      idOperador: '',
      estatusPlaneacion: formData.estatusPlaneacion || 'PENDIENTE',
      estatusSupervisor: formData.estatusPatio === 'Taller' ? 'No Disponible' : (formData.estatusSupervisor || 'Pendiente')
    } : {
      ...formData,
      idOperador: resolvedIdOp,
      estatusSupervisor: (formData.estatusPlaneacion === 'CARGADO' && (formData.estatusSupervisor === 'No Disponible' || !formData.estatusSupervisor || formData.estatusSupervisor === 'Pendiente'))
        ? 'Cargado'
        : (formData.estatusSupervisor || 'Pendiente')
    };

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
                ? (selectedUnit ? `Gestionar Unidad en Patio ECO ${selectedUnit.economico || 'S/N'}` : 'Registrar Nueva Unidad en Patio')
                : (selectedUnit 
                    ? (selectedUnit.economico ? `Editar Viaje / Unidad ECO ${selectedUnit.economico}` : `Editar Viaje ${selectedUnit.noViaje ? `#${selectedUnit.noViaje}` : ''}`) 
                    : 'Registrar Nuevo Embarque / Viaje')
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

        {/* datalist eliminado — reemplazado por OperadorSelector */}

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
                  <CustomSelect
                    value={formData.capUnidad}
                    onChange={v => setFormData(prev => ({ ...prev, capUnidad: Number(v) }))}
                    options={[
                      { value: 18,  label: '18 m³', sub: 'Camioneta / Rabón Chico' },
                      { value: 40,  label: '40 m³', sub: 'Madrina Mediana' },
                      { value: 50,  label: '50 m³', sub: 'Madrina Estándar / Rango Medio' },
                      { value: 70,  label: '70 m³', sub: 'Intercedis / Trailer' },
                      { value: 90,  label: '90 m³', sub: 'Caja Seca Sencilla' },
                      { value: 110, label: '110 m³', sub: 'Full Tráiler' },
                    ]}
                  />
                </div>

                {/* Tipo de Unidad */}
                <div className="form-group">
                  <label>Tipo de Vehículo</label>
                  <CustomSelect
                    value={formData.tipo}
                    onChange={v => setFormData(prev => ({ ...prev, tipo: v }))}
                    options={[
                      { value: 'Camioneta',           label: 'Camioneta',           sub: '18 m³' },
                      { value: 'Rango Medio',         label: 'Rango Medio',         sub: '50 m³' },
                      { value: 'Madrina / Rango Medio', label: 'Madrina / Rango Medio' },
                      { value: 'Sencillo',            label: 'Sencillo',            sub: '90 m³' },
                      { value: 'Tracto / Sencillo',   label: 'Tracto / Sencillo' },
                      { value: 'Tracto / Full',       label: 'Tracto / Full',       sub: '110 m³' },
                    ]}
                  />
                </div>

                {/* Línea de Transporte */}
                <div className="form-group">
                  <label>Línea de Transporte</label>
                  <CustomSelect
                    value={formData.linea}
                    onChange={v => setFormData(prev => ({ ...prev, linea: v }))}
                    options={LINEAS_TRANSPORTE.map(l => ({ value: l, label: l }))}
                  />
                </div>

                {/* Estatus Patio */}
                <div className="form-group">
                  <label>Estatus en Patio (En CD) *</label>
                  <CustomSelect
                    value={formData.estatusPatio}
                    onChange={v => setFormData(prev => ({ ...prev, estatusPatio: v }))}
                    options={[
                      { value: 'Disponible',       label: '🟢 Disponible en Patio' },
                      { value: 'Colocado p/ Carga', label: '🟡 Colocado p/ Carga' },
                      { value: 'Cargado',          label: '🔵 Cargado' },
                      { value: 'Taller',           label: '🔴 Taller / Mtto' },
                    ]}
                  />
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
                  <CustomSelect
                    value={formData.bloque}
                    onChange={v => setFormData(prev => ({ ...prev, bloque: Number(v) }))}
                    options={BLOQUES.map(b => ({ value: b, label: `Bloque ${b}` }))}
                  />
                </div>

                {/* ECO Unidad con Selector Inteligente y Completo */}
                <div className="form-group full-width">
                  <label>ECO Unidad <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'none', fontWeight: 500 }}>(Opcional — Puedes dejarlo por asignar si aún no defines el vehículo)</span></label>
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
                  <CustomSelect
                    value={formData.capUnidad}
                    onChange={v => setFormData(prev => ({ ...prev, capUnidad: Number(v) }))}
                    options={[
                      { value: 18,  label: '18',  sub: 'Camioneta / Rabón Chico' },
                      { value: 40,  label: '40',  sub: 'Madrina Mediana' },
                      { value: 50,  label: '50',  sub: 'Madrina Estándar / Rango Medio' },
                      { value: 70,  label: '70',  sub: 'Intercedis / Trailer' },
                      { value: 90,  label: '90',  sub: 'Caja Seca Sencilla' },
                      { value: 110, label: '110', sub: 'Full Tráiler' },
                    ]}
                  />
                </div>

                {/* Línea de Transporte */}
                <div className="form-group">
                  <label>Línea de Transporte</label>
                  <CustomSelect
                    value={formData.linea}
                    onChange={v => setFormData(prev => ({ ...prev, linea: v }))}
                    options={LINEAS_TRANSPORTE.map(l => ({ value: l, label: l }))}
                  />
                </div>

                {/* Operador */}
                <div className="form-group">
                  <label>Nombre del Operador</label>
                  <OperadorSelector
                    value={formData.operador}
                    onChange={(nombre, idOp) => {
                      const autoId = idOp || buscarIdOperadorPorNombre(nombre);
                      setFormData(prev => ({ 
                        ...prev, 
                        operador: nombre,
                        idOperador: autoId !== undefined && autoId !== '' ? autoId : (buscarIdOperadorPorNombre(nombre) || prev.idOperador)
                      }));
                    }}
                  />
                </div>

                {/* ID / Nómina del Operador */}
                <div className="form-group">
                  <label>ID / Nómina del Operador</label>
                  <input 
                    type="text"
                    name="idOperador"
                    className="form-control"
                    placeholder="Ej: 1080014, 1129366..."
                    value={formData.idOperador || ''}
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
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Destino Principal (#1) — Catálogo CD Villahermosa ({SUCURSALES_MAESTRAS.length} Tiendas)</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)' }}>Primer punto de entrega</span>
                  </label>
                  <SucursalSelector 
                    value={formData.numSucursal || formData.destino}
                    onSelect={handleSelectSucursal}
                  />
                </div>

                {/* GESTIÓN DE VARIAS ENTREGAS / VIAJES EN UNO (MULTITRIP / PARADAS / VTEX) */}
                <div className="form-group full-width" style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '10px',
                  padding: '1rem',
                  marginTop: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.85rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Layers size={16} color="var(--accent-cyan)" />
                        <strong style={{ color: '#fff', fontSize: '0.9rem' }}>
                          Ruta Multiparada: Varias Entregas en este Viaje
                        </strong>
                        <span style={{ 
                          fontSize: '0.72rem', 
                          background: 'rgba(56, 189, 248, 0.15)', 
                          color: '#38bdf8', 
                          padding: '0.15rem 0.5rem', 
                          borderRadius: '4px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700
                        }}>
                          {1 + (formData.destinosSecundarios?.length || 0)} Entregas totales
                        </span>
                      </div>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Agrega sucursales secundarias o paquetes VTEX que se entregarán en la misma unidad y ruta.
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleAddParada}
                        style={{
                          fontSize: '0.76rem',
                          padding: '0.35rem 0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          borderColor: 'rgba(56, 189, 248, 0.4)',
                          color: '#38bdf8'
                        }}
                      >
                        <Plus size={13} />
                        <span>+ Agregar Sucursal</span>
                      </button>

                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleAddVtex}
                        style={{
                          fontSize: '0.76rem',
                          padding: '0.35rem 0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          background: 'rgba(250, 204, 21, 0.12)',
                          borderColor: 'rgba(250, 204, 21, 0.4)',
                          color: '#facc15'
                        }}
                      >
                        <Package size={13} />
                        <span>+ Agregar VTEX</span>
                      </button>
                    </div>
                  </div>

                  {/* LISTADO DE PARADAS SECUNDARIAS */}
                  {formData.destinosSecundarios && formData.destinosSecundarios.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {formData.destinosSecundarios.map((parada, pIdx) => (
                        <div 
                          key={parada.id || pIdx}
                          style={{
                            background: parada.esVtex ? 'rgba(250, 204, 21, 0.08)' : 'rgba(30, 41, 59, 0.6)',
                            border: parada.esVtex ? '1px solid rgba(250, 204, 21, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '8px',
                            padding: '0.75rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                              <span style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                fontFamily: 'var(--font-mono)',
                                background: parada.esVtex ? '#facc15' : 'rgba(56, 189, 248, 0.2)',
                                color: parada.esVtex ? '#000' : '#38bdf8',
                                padding: '0.1rem 0.45rem',
                                borderRadius: '4px'
                              }}>
                                {parada.esVtex ? '📦 ENTREGA VTEX' : `📍 PARADA #${pIdx + 2}`}
                              </span>
                              {parada.numSucursal && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                                  #{parada.numSucursal}
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveParada(parada.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#f87171',
                                cursor: 'pointer',
                                padding: '0.2rem',
                                display: 'flex',
                                alignItems: 'center',
                                borderRadius: '4px'
                              }}
                              title="Eliminar esta entrega del viaje"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          {parada.esVtex ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                              <div>
                                <label style={{ fontSize: '0.7rem', color: '#facc15', marginBottom: '0.2rem', display: 'block' }}>
                                  Folio de Pedido VTEX *
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="Ej: 45781356, 45781398..."
                                  value={parada.folioVtex || ''}
                                  onChange={(e) => handleUpdateParada(parada.id, 'folioVtex', e.target.value)}
                                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}
                                />
                              </div>

                              <div>
                                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.2rem', display: 'block' }}>
                                  Sucursal Asignada (S-####)
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="Ej: 1258, 2078..."
                                  value={parada.numSucursal || ''}
                                  onChange={(e) => handleUpdateParada(parada.id, 'numSucursal', e.target.value)}
                                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}
                                />
                              </div>

                              <div style={{ paddingTop: '1rem', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#facc15', whiteSpace: 'nowrap' }}>
                                ➜ VTEX: {parada.folioVtex || '...'} (S-{parada.numSucursal || '...'})
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem' }}>
                              <div>
                                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.2rem', display: 'block' }}>
                                  Sucursal / Destino Adicional
                                </label>
                                <SucursalSelector
                                  value={parada.numSucursal || parada.destino}
                                  onSelect={(suc) => handleSelectSucursalParada(parada.id, suc)}
                                />
                              </div>

                              <div>
                                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.2rem', display: 'block' }}>
                                  # Carga (Opcional)
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder={formData.numCarga || 'CS0038...'}
                                  value={parada.numCarga || ''}
                                  onChange={(e) => handleUpdateParada(parada.id, 'numCarga', e.target.value)}
                                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.6rem' }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      padding: '0.85rem',
                      background: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '6px',
                      border: '1px dashed rgba(255, 255, 255, 0.1)',
                      color: 'var(--text-muted)',
                      fontSize: '0.78rem'
                    }}>
                      Este viaje solo tiene 1 destino. Haz clic en <strong>+ Agregar Sucursal</strong> o <strong>+ Agregar VTEX</strong> si la misma unidad lleva varias entregas.
                    </div>
                  )}
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
                  <CustomSelect
                    value={formData.fl || 'LOCAL'}
                    onChange={v => setFormData(prev => ({ ...prev, fl: v }))}
                    options={[
                      { value: 'LOCAL',   label: 'LOCAL',   sub: 'Tabasco / Zonas de corta distancia' },
                      { value: 'FORANEO', label: 'FORÁNEO', sub: 'Chiapas, Oaxaca, Península, Veracruz' },
                    ]}
                  />
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
                  <CustomSelect
                    value={formData.estatusPlaneacion || 'PENDIENTE'}
                    onChange={v => {
                      const e = { target: { name: 'estatusPlaneacion', value: v } };
                      handleChange(e);
                    }}
                    options={[
                      { value: 'PENDIENTE', label: 'PENDIENTE', color: '#94a3b8' },
                      { value: 'COLOCADO',  label: 'COLOCADO',  color: '#22d3ee' },
                      { value: 'CARGADO',   label: 'CARGADO',   color: '#facc15' },
                    ]}
                  />
                  {!isPatioMode && (formData.estatusPlaneacion === 'COLOCADO' || formData.estatusPlaneacion === 'CARGADO') && !checkTieneViajeYOperador(formData).valid && (
                    <div style={{
                      marginTop: '0.45rem',
                      fontSize: '0.73rem',
                      color: '#fbbf24',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: 'rgba(251, 191, 36, 0.1)',
                      padding: '0.4rem 0.65rem',
                      borderRadius: '4px',
                      border: '1px solid rgba(251, 191, 36, 0.3)'
                    }}>
                      <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                      <span>Requiere No. de Viaje, Operador y Destino para poder colocar o poner en caseta.</span>
                    </div>
                  )}
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
