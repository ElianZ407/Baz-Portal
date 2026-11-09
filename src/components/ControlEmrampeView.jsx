import React, { useState, useMemo } from 'react';
import { 
  Warehouse, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle2, 
  Edit3, 
  Trash2, 
  X, 
  Save, 
  ArrowRight,
  User
} from 'lucide-react';
import { useFleet } from '../context/FleetContext';
import { CATALOGO_RAMPAS, detectarZonaRampa } from '../constants/fleetConstants';
import { OperadorSelector } from './OperadorSelector';

export const ControlEmrampeView = () => {
  const { 
    units, 
    saveUnit, 
    deleteUnit, 
    catalogoFlota, 
    showConfirm
  } = useFleet();

  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState(null);
  const [zonaRampa, setZonaRampa] = useState('embarque');

  const [patieroActivo, setPatieroActivo] = useState(() => {
    try {
      return localStorage.getItem('baz_patiero_activo') || '';
    } catch {
      return '';
    }
  });

  const [formData, setFormData] = useState({
    economico: '',
    numCarga: '',
    operador: '',
    cortina: '',
    destino: '',
    horaEmrampe: '',
    horaDesemrampe: '',
    patiero: patieroActivo
  });

  const guardarPatieroActivo = (nombre) => {
    const limpio = String(nombre || '').trim();
    setPatieroActivo(limpio);
    try {
      if (limpio) {
        localStorage.setItem('baz_patiero_activo', limpio);
      } else {
        localStorage.removeItem('baz_patiero_activo');
      }
    } catch {}
  };

  const getHoraActual = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const openNewModal = () => {
    setEditingUnitId(null);
    setZonaRampa('embarque');
    setFormData({
      economico: '',
      numCarga: '',
      operador: '',
      cortina: '',
      destino: '',
      horaEmrampe: getHoraActual(),
      horaDesemrampe: '',
      patiero: patieroActivo || ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (unit) => {
    setEditingUnitId(unit.id);
    const detectada = detectarZonaRampa(unit.cortina);
    setZonaRampa(detectada || 'embarque');
    setFormData({
      economico: unit.economico || '',
      numCarga: unit.numCarga || '',
      operador: unit.operador || '',
      cortina: unit.cortina || '',
      destino: unit.destino || '',
      horaEmrampe: unit.horaEmrampe || '',
      horaDesemrampe: unit.horaDesemrampe || '',
      patiero: unit.patiero || patieroActivo || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUnitId(null);
  };

  const handleEcoChange = (ecoValor) => {
    const cleanEco = String(ecoValor).trim();
    const existingActive = units.find(u => String(u.economico).trim() === cleanEco);
    const fromMaster = (catalogoFlota || []).find(f => String(f.eco).trim() === cleanEco);

    setFormData(prev => ({
      ...prev,
      economico: cleanEco,
      operador: prev.operador || existingActive?.operador || fromMaster?.operador || '',
      destino: prev.destino || existingActive?.destino || '',
      numCarga: prev.numCarga || existingActive?.numCarga || '',
      cortina: prev.cortina || existingActive?.cortina || ''
    }));
  };

  const handleSaveForm = (e) => {
    e.preventDefault();
    if (!formData.economico) return;

    let targetUnit = editingUnitId ? units.find(u => u.id === editingUnitId) : null;
    if (!targetUnit) {
      targetUnit = units.find(u => String(u.economico).trim() === String(formData.economico).trim());
    }

    const nowStr = getHoraActual();
    const horaEmr = formData.horaEmrampe ? String(formData.horaEmrampe).trim() : '';
    const horaDes = formData.horaDesemrampe ? String(formData.horaDesemrampe).trim() : '';

    let estatusPatio = 'Disponible';
    let estatusPlaneacion = 'PENDIENTE';

    if (horaDes) {
      estatusPatio = 'Cargado';
      estatusPlaneacion = 'CARGADO';
    } else if (horaEmr) {
      estatusPatio = 'Colocado p/ Carga';
      estatusPlaneacion = 'COLOCADO';
    }

    const payload = {
      ...(targetUnit || {}),
      id: targetUnit?.id || `emrampe-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      economico: String(formData.economico).trim(),
      numCarga: String(formData.numCarga || '').trim(),
      operador: String(formData.operador || '').trim(),
      cortina: String(formData.cortina || '').trim(),
      destino: String(formData.destino || '').trim(),
      horaEmrampe: horaEmr,
      horaDesemrampe: horaDes,
      patiero: String(formData.patiero || patieroActivo || '').trim(),
      estatusPatio: targetUnit?.estatusPatio === 'Taller' ? 'Taller' : estatusPatio,
      estatusPlaneacion: estatusPlaneacion,
      actualizadoEn: nowStr
    };

    if (payload.patiero) {
      guardarPatieroActivo(payload.patiero);
    }

    saveUnit(payload);
    closeModal();
  };

  const handleQuickEmrampar = (unit) => {
    const hora = getHoraActual();
    saveUnit({
      ...unit,
      horaEmrampe: hora,
      patiero: unit.patiero || patieroActivo || 'Patio',
      estatusPatio: 'Colocado p/ Carga',
      estatusPlaneacion: 'COLOCADO',
      actualizadoEn: hora
    });
  };

  const handleQuickDesemrampar = (unit) => {
    const hora = getHoraActual();
    saveUnit({
      ...unit,
      horaDesemrampe: hora,
      estatusPatio: 'Cargado',
      estatusPlaneacion: 'CARGADO',
      actualizadoEn: hora
    });
  };

  const emrampeUnits = useMemo(() => {
    return units.filter(u => {
      const tieneEco = Boolean(String(u.economico || '').trim());
      const tieneRampaOEmrampe = Boolean(u.cortina || u.horaEmrampe || u.horaDesemrampe || u.numCarga);
      return tieneEco && tieneRampaOEmrampe;
    });
  }, [units]);

  const kpis = useMemo(() => {
    let enRampa = 0;
    let desemrampadas = 0;
    let pendientes = 0;

    emrampeUnits.forEach(u => {
      if (u.horaDesemrampe) {
        desemrampadas++;
      } else if (u.horaEmrampe) {
        enRampa++;
      } else {
        pendientes++;
      }
    });

    return {
      total: emrampeUnits.length,
      enRampa,
      desemrampadas,
      pendientes
    };
  }, [emrampeUnits]);

  const filteredUnits = useMemo(() => {
    const q = search.trim().toLowerCase();

    return emrampeUnits.filter(u => {
      if (filterTab === 'EN_RAMPA' && (!u.horaEmrampe || u.horaDesemrampe)) return false;
      if (filterTab === 'DESEMRAMPADAS' && !u.horaDesemrampe) return false;
      if (filterTab === 'PENDIENTES' && Boolean(u.horaEmrampe)) return false;

      if (!q) return true;

      const eco = String(u.economico || '').toLowerCase();
      const carga = String(u.numCarga || '').toLowerCase();
      const op = String(u.operador || '').toLowerCase();
      const rampa = String(u.cortina || '').toLowerCase();
      const dest = String(u.destino || '').toLowerCase();
      const pat = String(u.patiero || '').toLowerCase();
      const zona = (detectarZonaRampa(u.cortina) || '').toLowerCase();

      return eco.includes(q) || carga.includes(q) || op.includes(q) || rampa.includes(q) || dest.includes(q) || pat.includes(q) || zona.includes(q);
    });
  }, [emrampeUnits, filterTab, search]);

  const renderRampaBadge = (cortina) => {
    if (!cortina) {
      return <span className="rampa-pill rampa-pill-empty">Sin Rampa</span>;
    }
    const zona = detectarZonaRampa(cortina);
    const etiquetaZona = zona === 'recibo' ? 'RECIBO' : zona === 'embarque' ? 'EMBARQUE' : zona === 'ds' ? 'DS' : '';
    const claseZona = zona ? `rampa-pill-${zona}` : 'rampa-pill-default';

    return (
      <span className={`rampa-pill ${claseZona}`} title={etiquetaZona ? `Zona ${etiquetaZona}: ${cortina}` : `Rampa ${cortina}`}>
        {etiquetaZona && <span className="rampa-zona-tag">{etiquetaZona}</span>}
        <span className="rampa-num-val">{cortina}</span>
      </span>
    );
  };

  return (
    <div className="emrampe-container">
      <div className="emrampe-top-action-bar">
        <div className="emrampe-search-box">
          <Search size={18} className="emrampe-search-icon" />
          <input 
            type="text" 
            placeholder="Buscar por unidad, rampa, operador, destino..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="emrampe-search-input"
          />
          {search && (
            <button className="emrampe-search-clear" onClick={() => setSearch('')}>
              <X size={15} />
            </button>
          )}
        </div>

        <button 
          type="button" 
          className="btn-emrampe-primary btn-top-add-emrampe"
          onClick={openNewModal}
          title="Registrar nuevo emrampe en patio"
        >
          <Plus size={18} />
          <span>+ Registrar Emrampe</span>
        </button>
      </div>

      <div className="emrampe-kpi-grid">
        <div 
          className={`emrampe-kpi-card ${filterTab === 'ALL' ? 'active' : ''}`}
          onClick={() => setFilterTab('ALL')}
        >
          <div className="emrampe-kpi-num">{kpis.total}</div>
          <div className="emrampe-kpi-lbl">Total Registros</div>
        </div>

        <div 
          className={`emrampe-kpi-card kpi-en-rampa ${filterTab === 'EN_RAMPA' ? 'active' : ''}`}
          onClick={() => setFilterTab('EN_RAMPA')}
        >
          <div className="emrampe-kpi-num">{kpis.enRampa}</div>
          <div className="emrampe-kpi-lbl">En Rampa Ahora</div>
        </div>

        <div 
          className={`emrampe-kpi-card kpi-pendientes ${filterTab === 'PENDIENTES' ? 'active' : ''}`}
          onClick={() => setFilterTab('PENDIENTES')}
        >
          <div className="emrampe-kpi-num">{kpis.pendientes}</div>
          <div className="emrampe-kpi-lbl">Por Emrampar</div>
        </div>

        <div 
          className={`emrampe-kpi-card kpi-desemrampadas ${filterTab === 'DESEMRAMPADAS' ? 'active' : ''}`}
          onClick={() => setFilterTab('DESEMRAMPADAS')}
        >
          <div className="emrampe-kpi-num">{kpis.desemrampadas}</div>
          <div className="emrampe-kpi-lbl">Desemrampadas</div>
        </div>
      </div>

      <div className="emrampe-toolbar">
        <div className="emrampe-filter-pills">
          <button 
            type="button" 
            className={`filter-pill ${filterTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterTab('ALL')}
          >
            Todas ({kpis.total})
          </button>
          <button 
            type="button" 
            className={`filter-pill ${filterTab === 'EN_RAMPA' ? 'active' : ''}`}
            onClick={() => setFilterTab('EN_RAMPA')}
          >
            En Rampa ({kpis.enRampa})
          </button>
          <button 
            type="button" 
            className={`filter-pill ${filterTab === 'PENDIENTES' ? 'active' : ''}`}
            onClick={() => setFilterTab('PENDIENTES')}
          >
            Pendientes ({kpis.pendientes})
          </button>
          <button 
            type="button" 
            className={`filter-pill ${filterTab === 'DESEMRAMPADAS' ? 'active' : ''}`}
            onClick={() => setFilterTab('DESEMRAMPADAS')}
          >
            Desemrampadas ({kpis.desemrampadas})
          </button>
        </div>
      </div>

      <div className="emrampe-table-wrapper desktop-only">
        <table className="emrampe-table">
          <thead>
            <tr>
              <th>UNIDAD</th>
              <th>NUM DE CARGA</th>
              <th>OPERADOR</th>
              <th>RAMPA</th>
              <th>DESTINO</th>
              <th>HORA DE EMRAMPE</th>
              <th>HORA DE DESEMRAMPE</th>
              <th>PATIO (PATIERO)</th>
              <th style={{ textAlign: 'center' }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {filteredUnits.length === 0 ? (
              <tr>
                <td colSpan="9" className="emrampe-empty-cell">
                  <Warehouse size={32} style={{ opacity: 0.35, marginBottom: '0.5rem' }} />
                  <div>No se encontraron registros de emrampe con los filtros actuales.</div>
                  <button type="button" className="btn-emrampe-link" onClick={openNewModal}>
                    + Registrar primer emrampe
                  </button>
                </td>
              </tr>
            ) : (
              filteredUnits.map((u) => {
                const isEnRampa = Boolean(u.horaEmrampe && !u.horaDesemrampe);
                const isDesemrampada = Boolean(u.horaDesemrampe);

                return (
                  <tr key={u.id} className={isEnRampa ? 'row-en-rampa' : isDesemrampada ? 'row-desemrampada' : ''}>
                    <td>
                      <span className="eco-pill-emrampe">
                        ECO {u.economico}
                      </span>
                    </td>
                    <td>
                      <span className="emrampe-carga-text">
                        {u.numCarga || '—'}
                      </span>
                    </td>
                    <td>
                      <span className="emrampe-operador-text">
                        {u.operador || 'Sin asignar'}
                      </span>
                    </td>
                    <td>
                      {renderRampaBadge(u.cortina)}
                    </td>
                    <td>
                      <span className="emrampe-destino-text">
                        {u.destino || 'Sin definir'}
                      </span>
                    </td>
                    <td>
                      {u.horaEmrampe ? (
                        <span className="hora-emrampe-badge">
                          <Clock size={13} />
                          {u.horaEmrampe}
                        </span>
                      ) : (
                        <button 
                          type="button" 
                          className="btn-quick-emrampe"
                          onClick={() => handleQuickEmrampar(u)}
                          title="Fijar hora actual como emrampe"
                        >
                          Emrampar
                        </button>
                      )}
                    </td>
                    <td>
                      {u.horaDesemrampe ? (
                        <span className="hora-desemrampe-badge">
                          <CheckCircle2 size={13} />
                          {u.horaDesemrampe}
                        </span>
                      ) : u.horaEmrampe ? (
                        <button 
                          type="button" 
                          className="btn-quick-desemrampe"
                          onClick={() => handleQuickDesemrampar(u)}
                          title="Fijar hora actual como desemrampe"
                        >
                          Desemrampar
                        </button>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>—</span>
                      )}
                    </td>
                    <td>
                      <span className="patiero-text">
                        {u.patiero || '—'}
                      </span>
                    </td>
                    <td>
                      <div className="emrampe-row-actions">
                        <button 
                          type="button" 
                          className="btn-icon-action"
                          onClick={() => openEditModal(u)}
                          title="Editar información"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button 
                          type="button" 
                          className="btn-icon-action btn-icon-delete"
                          onClick={() => {
                            showConfirm({
                              title: `¿Eliminar registro ECO ${u.economico}?`,
                              message: 'Esta acción removerá el registro de emrampe.',
                              confirmText: 'Sí, eliminar',
                              confirmType: 'danger',
                              onConfirm: () => deleteUnit(u.id)
                            });
                          }}
                          title="Eliminar registro"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="emrampe-cards-list mobile-only">
        {filteredUnits.length === 0 ? (
          <div className="emrampe-empty-mobile">
            <Warehouse size={40} style={{ opacity: 0.35, marginBottom: '0.5rem' }} />
            <p>No hay registros de emrampe para mostrar.</p>
            <button type="button" className="btn-emrampe-primary" onClick={openNewModal} style={{ marginTop: '0.75rem' }}>
              <Plus size={16} />
              <span>Nuevo Emrampe</span>
            </button>
          </div>
        ) : (
          filteredUnits.map((u) => {
            const isEnRampa = Boolean(u.horaEmrampe && !u.horaDesemrampe);
            const isDesemrampada = Boolean(u.horaDesemrampe);

            return (
              <div 
                key={u.id} 
                className={`emrampe-mobile-card ${isEnRampa ? 'card-en-rampa' : isDesemrampada ? 'card-desemrampada' : ''}`}
              >
                <div className="card-top-row">
                  <div className="card-eco-wrap">
                    <span className="eco-pill-emrampe">ECO {u.economico}</span>
                    {renderRampaBadge(u.cortina)}
                  </div>
                  <div className="card-status-indicator">
                    {isDesemrampada ? (
                      <span className="status-tag tag-desemrampada">DESEMRAMPADA</span>
                    ) : isEnRampa ? (
                      <span className="status-tag tag-en-rampa">EN RAMPA</span>
                    ) : (
                      <span className="status-tag tag-pendiente">PENDIENTE</span>
                    )}
                  </div>
                </div>

                <div className="card-details-grid">
                  <div className="card-detail-item">
                    <span className="card-detail-lbl">Carga:</span>
                    <span className="card-detail-val">{u.numCarga || '—'}</span>
                  </div>

                  <div className="card-detail-item">
                    <span className="card-detail-lbl">Destino:</span>
                    <span className="card-detail-val">{u.destino || 'Sin definir'}</span>
                  </div>

                  <div className="card-detail-item full-width">
                    <span className="card-detail-lbl">Operador:</span>
                    <span className="card-detail-val">{u.operador || 'Sin asignar'}</span>
                  </div>
                </div>

                <div className="card-horas-strip">
                  <div className="card-hora-col">
                    <span className="hora-lbl">Emrampe</span>
                    {u.horaEmrampe ? (
                      <span className="hora-val-badge">
                        <Clock size={13} />
                        {u.horaEmrampe}
                      </span>
                    ) : (
                      <button 
                        type="button" 
                        className="btn-card-emrampar"
                        onClick={() => handleQuickEmrampar(u)}
                      >
                        Emrampar
                      </button>
                    )}
                  </div>

                  <div className="card-hora-divider">
                    <ArrowRight size={14} color="#64748b" />
                  </div>

                  <div className="card-hora-col">
                    <span className="hora-lbl">Desemrampe</span>
                    {u.horaDesemrampe ? (
                      <span className="hora-val-badge badge-desemrampe">
                        <CheckCircle2 size={13} />
                        {u.horaDesemrampe}
                      </span>
                    ) : u.horaEmrampe ? (
                      <button 
                        type="button" 
                        className="btn-card-desemrampar"
                        onClick={() => handleQuickDesemrampar(u)}
                      >
                        Desemrampar
                      </button>
                    ) : (
                      <span style={{ color: '#64748b', fontSize: '0.85rem' }}>—</span>
                    )}
                  </div>
                </div>

                <div className="card-footer-strip">
                  <div className="card-patiero-info">
                    <User size={13} color="#38bdf8" />
                    <span>Patio: <strong>{u.patiero || '—'}</strong></span>
                  </div>

                  <div className="card-actions">
                    <button 
                      type="button" 
                      className="btn-card-action"
                      onClick={() => openEditModal(u)}
                      title="Editar"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button 
                      type="button" 
                      className="btn-card-action btn-card-delete"
                      onClick={() => {
                        showConfirm({
                          title: `¿Eliminar ECO ${u.economico}?`,
                          message: 'Se removerá el registro de emrampe.',
                          confirmText: 'Sí, eliminar',
                          confirmType: 'danger',
                          onConfirm: () => deleteUnit(u.id)
                        });
                      }}
                      title="Eliminar"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <div className="emrampe-modal-overlay" onClick={closeModal}>
          <div className="emrampe-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="emrampe-modal-header">
              <div className="modal-title-wrap">
                <Warehouse size={20} color="var(--accent-cyan)" />
                <h3>{editingUnitId ? 'Editar Emrampe' : 'Nuevo Emrampe'}</h3>
              </div>
              <div className="modal-header-actions-right">
                <button 
                  type="submit" 
                  form="form-emrampe" 
                  className="btn-modal-header-save"
                  title="Guardar registro de emrampe"
                >
                  <Save size={15} />
                  <span>Guardar</span>
                </button>
                <button type="button" className="btn-modal-close" onClick={closeModal} title="Cerrar">
                  <X size={18} />
                </button>
              </div>
            </div>

            <form id="form-emrampe" onSubmit={handleSaveForm} className="emrampe-modal-form">
              <div className="form-group-emrampe">
                <label>Número de Unidad (ECO) *</label>
                <input 
                  type="text" 
                  placeholder="Ej. 5054"
                  required
                  value={formData.economico}
                  onChange={(e) => handleEcoChange(e.target.value)}
                  className="emrampe-input"
                  autoFocus={!editingUnitId}
                />
              </div>

              <div className="form-row-2">
                <div className="form-group-emrampe">
                  <label>Num de Carga</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Carga 1, 95123..."
                    value={formData.numCarga}
                    onChange={(e) => setFormData({ ...formData, numCarga: e.target.value })}
                    className="emrampe-input"
                  />
                </div>

                <div className="form-group-emrampe">
                  <label>Destino</label>
                  <input 
                    type="text" 
                    placeholder="Ej. San Cristóbal, Cárdenas, BDR Santa Ana..."
                    value={formData.destino}
                    onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                    className="emrampe-input"
                  />
                </div>
              </div>

              <div className="form-group-emrampe">
                <label>Operador Asignado</label>
                <OperadorSelector 
                  value={formData.operador}
                  onChange={(nombre) => setFormData(prev => ({ ...prev, operador: nombre }))}
                  placeholder="Buscar operador por nombre..."
                />
              </div>

              <div className="form-group-emrampe rampa-section-card">
                <div className="rampa-header-flex">
                  <label style={{ margin: 0, fontWeight: 800 }}>Rampa / Cortina</label>
                  {formData.cortina && (
                    <span className="selected-rampa-preview">
                      Seleccionada: <strong style={{ color: '#fff' }}>{formData.cortina}</strong>
                      {detectarZonaRampa(formData.cortina) && (
                        <span className={`preview-zona-tag preview-zona-${detectarZonaRampa(formData.cortina)}`}>
                          {detectarZonaRampa(formData.cortina).toUpperCase()}
                        </span>
                      )}
                    </span>
                  )}
                </div>

                <div className="rampa-input-with-clear">
                  <input 
                    type="text" 
                    placeholder="Selecciona abajo o escribe rampa..."
                    value={formData.cortina}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ ...formData, cortina: val });
                      const autoZona = detectarZonaRampa(val);
                      if (autoZona) setZonaRampa(autoZona);
                    }}
                    className="emrampe-input"
                  />
                  {formData.cortina && (
                    <button 
                      type="button" 
                      className="btn-clear-rampa" 
                      onClick={() => setFormData({ ...formData, cortina: '' })}
                      title="Quitar rampa"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <div className="rampa-zonas-tabs">
                  <button 
                    type="button"
                    className={`rampa-zona-btn zona-recibo ${zonaRampa === 'recibo' ? 'active' : ''}`}
                    onClick={() => setZonaRampa('recibo')}
                  >
                    <span className="zona-badge-dot dot-recibo"></span>
                    Recibo (1-16 / R1-R6)
                  </button>

                  <button 
                    type="button"
                    className={`rampa-zona-btn zona-embarque ${zonaRampa === 'embarque' ? 'active' : ''}`}
                    onClick={() => setZonaRampa('embarque')}
                  >
                    <span className="zona-badge-dot dot-embarque"></span>
                    Embarque (17-32 / S1-S6)
                  </button>

                  <button 
                    type="button"
                    className={`rampa-zona-btn zona-ds ${zonaRampa === 'ds' ? 'active' : ''}`}
                    onClick={() => setZonaRampa('ds')}
                  >
                    <span className="zona-badge-dot dot-ds"></span>
                    DS (1, 2, 3)
                  </button>
                </div>

                <div className="rampa-pills-container">
                  {zonaRampa === 'recibo' && (
                    <>
                      <div className="rampa-subgroup-label">Cortinas Numéricas (1 al 16):</div>
                      <div className="rampa-pills-grid">
                        {CATALOGO_RAMPAS.recibo.numericas.map(r => (
                          <button 
                            key={r}
                            type="button" 
                            className={`rampa-pill-btn pill-recibo ${formData.cortina === r ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, cortina: r })}
                          >
                            {r}
                          </button>
                        ))}
                      </div>

                      <div className="rampa-subgroup-label" style={{ marginTop: '0.45rem' }}>Especiales Recibo (R1 a R6):</div>
                      <div className="rampa-pills-grid rampa-pills-esp">
                        {CATALOGO_RAMPAS.recibo.especiales.map(r => (
                          <button 
                            key={r}
                            type="button" 
                            className={`rampa-pill-btn pill-recibo-esp ${formData.cortina === r ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, cortina: r })}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {zonaRampa === 'embarque' && (
                    <>
                      <div className="rampa-subgroup-label">Cortinas Embarque (17 al 32):</div>
                      <div className="rampa-pills-grid">
                        {CATALOGO_RAMPAS.embarque.numericas.map(r => (
                          <button 
                            key={r}
                            type="button" 
                            className={`rampa-pill-btn pill-embarque ${formData.cortina === r ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, cortina: r })}
                          >
                            {r}
                          </button>
                        ))}
                      </div>

                      <div className="rampa-subgroup-label" style={{ marginTop: '0.45rem' }}>Especiales Embarque (S1 a S6):</div>
                      <div className="rampa-pills-grid rampa-pills-esp">
                        {CATALOGO_RAMPAS.embarque.especiales.map(r => (
                          <button 
                            key={r}
                            type="button" 
                            className={`rampa-pill-btn pill-embarque-esp ${formData.cortina === r ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, cortina: r })}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {zonaRampa === 'ds' && (
                    <>
                      <div className="rampa-subgroup-label">Rampas DS (Descarga / Especial):</div>
                      <div className="rampa-pills-grid rampa-pills-ds">
                        {CATALOGO_RAMPAS.ds.especiales.map(r => (
                          <button 
                            key={r}
                            type="button" 
                            className={`rampa-pill-btn pill-ds ${formData.cortina === r ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, cortina: r })}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group-emrampe">
                  <div className="label-with-action">
                    <label>Hora de Emrampe</label>
                    <button 
                      type="button" 
                      className="btn-set-now"
                      onClick={() => setFormData({ ...formData, horaEmrampe: getHoraActual() })}
                    >
                      Ahora
                    </button>
                  </div>
                  <input 
                    type="time" 
                    value={formData.horaEmrampe}
                    onChange={(e) => setFormData({ ...formData, horaEmrampe: e.target.value })}
                    className="emrampe-input"
                  />
                </div>

                <div className="form-group-emrampe">
                  <div className="label-with-action">
                    <label>Hora de Desemrampe</label>
                    <button 
                      type="button" 
                      className="btn-set-now"
                      onClick={() => setFormData({ ...formData, horaDesemrampe: getHoraActual() })}
                    >
                      Ahora
                    </button>
                  </div>
                  <input 
                    type="time" 
                    value={formData.horaDesemrampe}
                    onChange={(e) => setFormData({ ...formData, horaDesemrampe: e.target.value })}
                    className="emrampe-input"
                  />
                </div>
              </div>

              <div className="form-group-emrampe">
                <label>Patio (Nombre del Patiero)</label>
                <input 
                  type="text" 
                  placeholder="Nombre de la persona encargada en patio..."
                  value={formData.patiero}
                  onChange={(e) => setFormData({ ...formData, patiero: e.target.value })}
                  className="emrampe-input"
                />
              </div>

              <div className="emrampe-modal-footer">
                <button type="button" className="btn-emrampe-cancel" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-emrampe-submit">
                  <Save size={16} />
                  <span>Guardar Emrampe</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
