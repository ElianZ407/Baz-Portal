import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  BookOpen, 
  X, 
  ArrowRight, 
  Truck, 
  CalendarClock, 
  Radio, 
  Tv, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  Layers, 
  Maximize,
  RefreshCw,
  Search,
  ExternalLink,
  Flame,
  RotateCcw
} from 'lucide-react';

export const ManualAyudaModal = ({ isOpenExternal, onCloseExternal }) => {
  const [isOpenInternal, setIsOpenInternal] = useState(false);
  const [activeTab, setActiveTab] = useState('flujo'); // 'flujo' | 'areas' | 'faq'

  const isOpen = isOpenExternal !== undefined ? isOpenExternal : isOpenInternal;
  const setIsOpen = onCloseExternal !== undefined ? onCloseExternal : setIsOpenInternal;

  const handleClose = () => {
    if (onCloseExternal) {
      onCloseExternal();
    } else {
      setIsOpenInternal(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Botón Flotante de Ayuda en Esquina Inferior Derecha */}
      <button 
        className="floating-help-btn"
        onClick={() => setIsOpenInternal(true)}
        title="Manual de Usuario y Flujo Operativo"
        aria-label="Abrir manual de ayuda"
      >
        <div className="help-btn-pulse"></div>
        <BookOpen size={18} className="help-icon" />
        <span className="help-btn-text">Ayuda & Flujo</span>
      </button>

      {/* Modal / Panel de Ayuda y Flujo Operativo */}
      {isOpen && (
        <div 
          className="modal-overlay help-modal-overlay"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="help-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="help-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="help-badge-icon">
                  <BookOpen size={22} color="var(--accent-cyan)" />
                </div>
                <div>
                  <h2>Manual de Usuario y Flujo Operativo</h2>
                  <p>Plataforma Integral de Control y Despacho BAZ Entregas CD Villahermosa</p>
                </div>
              </div>
              <button 
                className="modal-close" 
                onClick={handleClose}
                title="Cerrar (Esc)"
              >
                <X size={20} />
              </button>
            </div>

            {/* Pestañas de Navegación del Manual */}
            <div className="help-nav-tabs">
              <button 
                className={`help-nav-btn ${activeTab === 'flujo' ? 'active' : ''}`}
                onClick={() => setActiveTab('flujo')}
              >
                <Layers size={16} />
                <span>1. Flujo Operativo Ideal</span>
              </button>
              <button 
                className={`help-nav-btn ${activeTab === 'areas' ? 'active' : ''}`}
                onClick={() => setActiveTab('areas')}
              >
                <Truck size={16} />
                <span>2. Guía por Pantallas</span>
              </button>
              <button 
                className={`help-nav-btn ${activeTab === 'faq' ? 'active' : ''}`}
                onClick={() => setActiveTab('faq')}
              >
                <ShieldCheck size={16} />
                <span>3. Preguntas & Buenas Prácticas</span>
              </button>
            </div>

            {/* Contenido según pestaña */}
            <div className="help-modal-body">
              {/* TAB 1: FLUJO OPERATIVO */}
              {activeTab === 'flujo' && (
                <div className="help-section animate-fadeIn">
                  <div className="help-intro-box">
                    <p>
                      El sistema BAZ Entregas sincroniza en tiempo real el ciclo de vida completo de cada viaje: 
                      desde que la unidad ingresa a patio en CEDIS, pasa por rampa de carga, sale por caseta a ruta, 
                      descarga en sucursal y retorna vacía.
                    </p>
                  </div>

                  <div className="flow-steps-grid">
                    {/* Paso 1 */}
                    <div className="flow-step-card">
                      <div className="flow-step-number">1</div>
                      <div className="flow-step-header">
                        <Truck size={18} color="var(--status-green-text)" />
                        <h4>Patio (En CD)</h4>
                      </div>
                      <p className="flow-step-desc">
                        La unidad ingresa limpia al CEDIS y se registra como <strong>Disponible</strong> en patio (o en <strong>Taller</strong> si requiere mantenimiento).
                      </p>
                      <div className="flow-step-status">
                        <span className="status-badge status-disponible">DISPONIBLE</span>
                      </div>
                    </div>

                    <div className="flow-arrow"><ArrowRight size={20} /></div>

                    {/* Paso 2 */}
                    <div className="flow-step-card">
                      <div className="flow-step-number">2</div>
                      <div className="flow-step-header">
                        <CalendarClock size={18} color="var(--accent-cyan)" />
                        <h4>Planeación (Asignación)</h4>
                      </div>
                      <p className="flow-step-desc">
                        Planeación programa el viaje: asigna bloque (1-19), cortina de carga, operador y sucursal destino. La unidad pasa a cortina para estiba.
                      </p>
                      <div className="flow-step-status">
                        <span className="status-badge status-pendiente">PENDIENTE</span>
                        <ArrowRight size={14} style={{ margin: '0 4px', color: 'var(--text-muted)' }} />
                        <span className="status-badge status-colocado">COLOCADO</span>
                      </div>
                    </div>

                    <div className="flow-arrow"><ArrowRight size={20} /></div>

                    {/* Paso 3 */}
                    <div className="flow-step-card">
                      <div className="flow-step-number">3</div>
                      <div className="flow-step-header">
                        <Flame size={18} color="#facc15" />
                        <h4>Caseta & Despacho</h4>
                      </div>
                      <p className="flow-step-desc">
                        Concluida la carga y sellada la caja, la unidad se traslada a caseta para entrega de remisión e inspección de salida.
                      </p>
                      <div className="flow-step-status">
                        <span className="status-badge status-encaseta">EN CASETA</span>
                      </div>
                    </div>

                    <div className="flow-arrow"><ArrowRight size={20} /></div>

                    {/* Paso 4 */}
                    <div className="flow-step-card">
                      <div className="flow-step-number">4</div>
                      <div className="flow-step-header">
                        <Radio size={18} color="var(--accent-cyan)" />
                        <h4>Supervisor (En Ruta & Tienda)</h4>
                      </div>
                      <p className="flow-step-desc">
                        Supervisor monitorea la unidad por GPS/reportes. Conforme avanza, actualiza su estatus con un solo clic.
                      </p>
                      <div className="flow-step-status-stack">
                        <span className="status-badge status-en-ruta">En Ruta</span>
                        <span className="status-badge status-espera-descarga">Espera Descarga</span>
                        <span className="status-badge status-descargando">Descargando</span>
                      </div>
                    </div>

                    <div className="flow-arrow"><ArrowRight size={20} /></div>

                    {/* Paso 5 */}
                    <div className="flow-step-card">
                      <div className="flow-step-number">5</div>
                      <div className="flow-step-header">
                        <RefreshCw size={18} color="#c084fc" />
                        <h4>Retorno & Cierre</h4>
                      </div>
                      <p className="flow-step-desc">
                        Al terminar de descargar en tienda, la unidad inicia <strong>Retorno</strong> hacia CEDIS Villahermosa. Al llegar, vuelve a <strong>Disponible</strong> para un nuevo viaje.
                      </p>
                      <div className="flow-step-status">
                        <span className="status-badge status-retorno">Retorno</span>
                        <ArrowRight size={14} style={{ margin: '0 4px', color: 'var(--text-muted)' }} />
                        <span className="status-badge status-disponible">Disponible</span>
                      </div>
                    </div>
                  </div>

                  <div className="help-tip-card">
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <CheckCircle2 size={20} color="#34d399" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong>Sincronización en Vivo Instantánea:</strong>
                        <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                          No necesitas recargar la página. Cuando Supervisor o Planeación cambian un estatus, 
                          el Tablero TV y el módulo de Patio se actualizan en milisegundos en todas las pantallas abiertas.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: GUÍA POR PANTALLAS */}
              {activeTab === 'areas' && (
                <div className="help-section animate-fadeIn">
                  <div className="area-guide-grid">
                    {/* Patio */}
                    <div className="area-guide-card">
                      <div className="area-guide-header">
                        <Truck size={20} color="var(--accent-cyan)" />
                        <h3>1. Módulo de Patio (Control en CEDIS)</h3>
                      </div>
                      <p>Tablero tipo Kanban con 4 columnas operativas para organizar la flota dentro del patio:</p>
                      <ul>
                        <li><strong>Disponible:</strong> Unidades listas con tanque lleno para ser asignadas a viajes.</li>
                        <li><strong>Colocado p/ Carga:</strong> Unidades en rampa esperando que montacargas termine de cargar.</li>
                        <li><strong>Cargado:</strong> Carga lista y asegurada para inspección y salida.</li>
                        <li><strong>Taller / Mtto:</strong> Unidades fuera de servicio por fallas mecánicas o preventivos.</li>
                      </ul>
                      <div className="guide-action-tip">
                        <em>Tip:</em> Haz clic en los botones <code>Disp.</code>, <code>Carga</code> o <code>Cargado</code> en cada tarjeta para transferirla suavemente de columna.
                      </div>
                    </div>

                    {/* Planeación */}
                    <div className="area-guide-card">
                      <div className="area-guide-header">
                        <CalendarClock size={20} color="#facc15" />
                        <h3>2. Módulo de Planeación (Despacho y Cargas)</h3>
                      </div>
                      <p>Matriz oficial de viajes diarios de CD Villahermosa:</p>
                      <ul>
                        <li><strong>Estatus Oficiales:</strong> <code>PENDIENTE</code>, <code>COLOCADO</code> y <code>EN CASETA</code> (con código de color idéntico a las hojas maestras).</li>
                        <li><strong>Bloques del 1 al 19:</strong> Filtra rápidamente las olas de salida de todo el día.</li>
                        <li><strong>Restricciones Inteligentes:</strong> Valida si una unidad excede la capacidad de la sucursal o si una camioneta local intenta salir a una ruta foránea.</li>
                        <li><strong>Acción rápida:</strong> Botones <em>Colocar</em>, <em>A Caseta</em> y <em>Despachar</em> con un clic.</li>
                      </ul>
                    </div>

                    {/* Supervisor */}
                    <div className="area-guide-card">
                      <div className="area-guide-header">
                        <Radio size={20} color="#38bdf8" />
                        <h3>3. Módulo de Supervisor (Tránsito & Sucursales)</h3>
                      </div>
                      <p>Seguimiento continuo de unidades fuera de CEDIS con actualización rápida satelital:</p>
                      <ul>
                        <li><strong>En Ruta:</strong> La unidad va viajando por carretera hacia la tienda.</li>
                        <li><strong>Espera Descarga:</strong> La unidad ya llegó a la tienda y está esperando turno de rampa.</li>
                        <li><strong>Descargando:</strong> Maniobra activa de descarga en sucursal.</li>
                        <li><strong>Retrasado / Alerta:</strong> Permite ingresar motivo de demora (tráfico, falla mecánica, etc.) y genera alerta visual en la TV.</li>
                        <li><strong>Retorno:</strong> La unidad va regresando vacía hacia CEDIS Villahermosa.</li>
                      </ul>
                    </div>

                    {/* Tablero TV */}
                    <div className="area-guide-card">
                      <div className="area-guide-header">
                        <Tv size={20} color="#10b981" />
                        <h3>4. Pantalla TV (Sala de Monitoreo & Jefaturas)</h3>
                      </div>
                      <p>Diseñada para pantallas grandes panorámicas de 55" a 85" en centros de control:</p>
                      <ul>
                        <li><strong>4 KPIs Automáticos:</strong> Total Viajes, En Tránsito, En Sucursal / Rampa y Retrasadas con Alerta.</li>
                        <li><strong>Filtrado interactivo por KPI:</strong> Haz clic en cualquier tarjeta de KPI para filtrar la tabla al instante.</li>
                        <li><strong>Modo Pantalla Completa:</strong> Usa el botón <Maximize size={14} style={{ display: 'inline' }} /> en el encabezado para ocultar barras del navegador.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: FAQ & BUENAS PRÁCTICAS */}
              {activeTab === 'faq' && (
                <div className="help-section animate-fadeIn">
                  <div className="faq-list">
                    <div className="faq-item">
                      <h4>¿Cómo agregar un nuevo viaje o unidad?</h4>
                      <p>
                        Haz clic en el botón azul <strong>"+ Nueva Unidad / Viaje"</strong> en la parte superior derecha. 
                        El sistema incluye selectores inteligentes con los <strong>45 vehículos oficiales</strong> (placas y operador automático) 
                        y las <strong>más de 80 sucursales maestras</strong> con sus clósteres y restricciones ya cargadas.
                      </p>
                    </div>

                    <div className="faq-item">
                      <h4>¿Cómo funciona la sincronización entre computadoras o pantallas?</h4>
                      <p>
                        La plataforma utiliza sincronización bidireccional inmediata (BroadcastChannel y almacenamiento local persistente). 
                        Cualquier persona que actualice el estatus de un operador en su laptop verá el cambio reflejado al mismo tiempo 
                        en la pantalla de TV de la sala de monitoreo sin tocar el teclado.
                      </p>
                    </div>

                    <div className="faq-item">
                      <h4>¿Qué significan los colores de los estatus?</h4>
                      <div className="status-legend-grid">
                        <div className="legend-row">
                          <span className="status-badge status-encaseta">EN CASETA</span>
                          <span>Unidad en caseta de salida lista para iniciar ruta (Color amarillo oficial).</span>
                        </div>
                        <div className="legend-row">
                          <span className="status-badge status-colocado">COLOCADO</span>
                          <span>Unidad acomodada en cortina de carga (Color cyan brillante).</span>
                        </div>
                        <div className="legend-row">
                          <span className="status-badge status-pendiente">PENDIENTE</span>
                          <span>Viaje planeado en espera de asignación de rampa o mercancía.</span>
                        </div>
                        <div className="legend-row">
                          <span className="status-badge status-retrasado">Retrasado</span>
                          <span>Alerta de demora operativa en tránsito o descarga (Resaltado en rojo preventivo).</span>
                        </div>
                        <div className="legend-row">
                          <span className="status-badge status-en-ruta">En Ruta</span>
                          <span>Unidad navegando activamente en ruta hacia tienda.</span>
                        </div>
                      </div>
                    </div>

                    <div className="faq-item">
                      <h4>¿Cómo restablecer los datos originales de prueba?</h4>
                      <p>
                        En la esquina superior derecha encontrarás el botón <RotateCcw size={14} style={{ display: 'inline' }} /> (Restablecer). 
                        Al pulsarlo, se mostrará el modal de confirmación y podrás restaurar en cualquier momento las 
                        unidades representativas con todos los estatus activos.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="help-modal-footer">
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Versión Plataforma: <strong>v2.4 Oficial BAZ Entregas</strong> • CD Villahermosa
              </div>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleClose}
              >
                ¡Entendido, volver a la aplicación!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
