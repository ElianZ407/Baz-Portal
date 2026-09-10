import React, { useState, useEffect } from 'react';
import { X, Save, Truck, Layers, FileSpreadsheet } from 'lucide-react';
import { useFleet } from '../context/FleetContext';
import { LINEAS_TRANSPORTE, TURNOS } from '../data/initialFleetData';

export const UnitModal = () => {
  const { isModalOpen, setIsModalOpen, selectedUnit, saveUnit } = useFleet();

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
    sucursalOrigen: 'CEDIS BAZ',
    destino: '',
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
        linea: selectedUnit.linea || 'LTI - VHS',
        numCarga: selectedUnit.numCarga || ''
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
        sucursalOrigen: 'CEDIS BAZ',
        destino: '',
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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
      <div className="modal-content" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <FileSpreadsheet size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px', color: 'var(--accent-cyan)' }} />
            {selectedUnit ? `Editar Viaje / Unidad ECO ${selectedUnit.economico}` : 'Registrar Nuevo Embarque / Unidad'}
          </h3>
          <button className="modal-close" onClick={() => setIsModalOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
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
                <label>Bloque</label>
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
                  placeholder="Ej: MX-001-A"
                  value={formData.placas}
                  onChange={handleChange}
                />
              </div>

              {/* Capacidad Unidad */}
              <div className="form-group">
                <label>Cap. Unidad</label>
                <select 
                  name="capUnidad" 
                  className="form-control"
                  value={formData.capUnidad}
                  onChange={handleChange}
                >
                  <option value={18}>18</option>
                  <option value={40}>40 (Madrina)</option>
                  <option value={50}>50</option>
                </select>
              </div>

              {/* Línea de Transporte */}
              <div className="form-group">
                <label>Línea</label>
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

              {/* # Sucursal */}
              <div className="form-group">
                <label># Sucursal</label>
                <input 
                  type="text"
                  name="numSucursal"
                  className="form-control"
                  placeholder="Ej: 4660, 5173..."
                  value={formData.numSucursal}
                  onChange={handleChange}
                />
              </div>

              {/* Destino / Sucursal */}
              <div className="form-group">
                <label>Sucursal Destino</label>
                <input 
                  type="text"
                  name="destino"
                  className="form-control"
                  placeholder="Ej: EKT COMALCALCO"
                  value={formData.destino}
                  onChange={handleChange}
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
                <label>Observaciones / Novedades</label>
                <textarea 
                  name="observaciones"
                  rows="2"
                  className="form-control"
                  placeholder="Notas sobre auditoría, sellos o incidencias..."
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
