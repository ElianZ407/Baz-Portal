import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  Download, 
  RefreshCw, 
  X, 
  Layers, 
  Calendar, 
  Truck, 
  Users, 
  Check, 
  AlertTriangle,
  Search 
} from 'lucide-react';
import { useFleet } from '../context/FleetContext';
import { parsePlanningFile, downloadPlanningTemplate } from '../utils/planningImportUtils';

export const ImportarPlaneacionModal = () => {
  const { 
    isImportModalOpen, 
    setIsImportModalOpen, 
    importViajesPlaneacion, 
    catalogoFlota, 
    catalogoSucursales,
    showAlert
  } = useFleet();

  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);
  const [importMode, setImportMode] = useState('replace'); // 'replace' | 'merge'
  const [previewSearch, setPreviewSearch] = useState('');
  const fileInputRef = useRef(null);

  if (!isImportModalOpen) return null;

  const handleClose = () => {
    setParsedData(null);
    setCurrentFile(null);
    setErrorMessage('');
    setPreviewSearch('');
    setIsProcessing(false);
    setIsImportModalOpen(false);
  };

  const handleFileProcess = async (file, preferredSheet = null) => {
    if (!file) return;

    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      setErrorMessage('Formato no soportado. Por favor sube un archivo Excel (.xlsx, .xls) o CSV.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage('');
      setCurrentFile(file);
      // Por defecto lee la hoja 26 o la hoja especificada por el usuario
      const result = await parsePlanningFile(file, catalogoFlota, catalogoSucursales, preferredSheet);
      setParsedData({
        ...result,
        fileInfo: {
          name: file.name,
          sizeKb: Math.round(file.size / 1024)
        }
      });
    } catch (err) {
      console.error('Error parseando archivo de planeación:', err);
      setErrorMessage(err.message || 'Error al procesar el archivo. Verifica el formato e intenta nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSwitchSheet = async (newSheetIndex) => {
    if (!currentFile) return;
    await handleFileProcess(currentFile, newSheetIndex);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleConfirmImport = async () => {
    if (!parsedData || !parsedData.units || parsedData.units.length === 0) return;

    try {
      setIsProcessing(true);
      const success = await importViajesPlaneacion(parsedData.units, importMode);
      if (success) {
        handleClose();
        showAlert({
          title: '¡Planeación Importada con Éxito!',
          message: `Se importaron correctamente ${parsedData.units.length} viajes al tablero de planeación.\n\nEstatus: ${importMode === 'replace' ? 'Se reemplazó el plan activo.' : 'Se combinaron con los viajes existentes.'}`,
          confirmType: 'success'
        });
      }
    } catch (err) {
      console.error('Error al guardar la importación:', err);
      setErrorMessage('Hubo un problema al guardar los datos en la base de datos.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Métricas calculadas del archivo subido
  const totalSecondaryStops = parsedData?.units?.reduce((acc, u) => acc + (u.destinosSecundarios?.length || 0), 0) || 0;
  const totalOperadores = parsedData?.units?.filter(u => u.operador && u.operador.trim()).length || 0;
  const totalEnCaseta = parsedData?.units?.filter(u => u.estatusPlaneacion === 'CARGADO' || u.estatusPatio === 'Cargado').length || 0;
  const totalColocados = parsedData?.units?.filter(u => u.estatusPlaneacion === 'COLOCADO').length || 0;
  const totalPendientes = parsedData?.units?.filter(u => (u.estatusPlaneacion || 'PENDIENTE') === 'PENDIENTE').length || 0;

  // Filtrado en vivo de la tabla de previsualización
  const filteredUnits = (parsedData?.units || []).filter(u => {
    if (!previewSearch.trim()) return true;
    const q = previewSearch.toLowerCase().trim();
    return (
      String(u.economico || '').toLowerCase().includes(q) ||
      String(u.noViaje || '').toLowerCase().includes(q) ||
      String(u.operador || '').toLowerCase().includes(q) ||
      String(u.destino || '').toLowerCase().includes(q) ||
      String(u.numCarga || '').toLowerCase().includes(q) ||
      String(u.cortina || '').toLowerCase().includes(q) ||
      String(u.numSucursal || '').toLowerCase().includes(q) ||
      String(u.bloque || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: parsedData ? '980px' : '640px', 
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          backgroundColor: '#0a0f1d',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)'
        }}
      >
        {/* Cabecera del Modal */}
        <div style={{
          padding: '1.25rem 1.6rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(10, 15, 29, 0) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399'
            }}>
              <UploadCloud size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>
                Subir Archivo de Planeación de Embarques
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                Carga la programación diaria desde tu archivo Excel oficial BAZ o CSV
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={downloadPlanningTemplate}
              style={{
                fontSize: '0.78rem',
                padding: '0.45rem 0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                borderColor: 'rgba(56, 189, 248, 0.35)',
                color: '#38bdf8'
              }}
              title="Descargar plantilla Excel oficial vacía con las 24 columnas"
            >
              <Download size={14} />
              <span>Descargar Plantilla</span>
            </button>

            <button 
              type="button"
              className="close-btn"
              onClick={handleClose}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Cuerpo del Modal con Scroll */}
        <div style={{ padding: '1.5rem 1.6rem', overflowY: 'auto', flex: 1 }}>
          {errorMessage && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '8px',
              padding: '0.85rem 1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              color: '#fca5a5',
              fontSize: '0.85rem'
            }}>
              <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#ef4444' }} />
              <div>
                <strong style={{ color: '#fff', display: 'block', marginBottom: '0.15rem' }}>Aviso de Validación</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {!parsedData ? (
            /* ZONA DE CARGA DE ARCHIVO */
            <div>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: dragActive ? '2px dashed #10b981' : '2px dashed rgba(255, 255, 255, 0.18)',
                  borderRadius: '14px',
                  padding: '3rem 2rem',
                  textAlign: 'center',
                  background: dragActive ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileInputChange}
                  style={{ display: 'none' }}
                />

                {isProcessing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem' }}>
                    <RefreshCw size={36} className="spin-animation" color="#34d399" />
                    <p style={{ fontWeight: 700, color: '#fff', fontSize: '1rem', margin: 0 }}>
                      Analizando archivo y detectando columnas...
                    </p>
                    <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                      Revisando operadores, tiendas, cargas y paradas consolidadas
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#34d399'
                    }}>
                      <FileSpreadsheet size={32} />
                    </div>

                    <div>
                      <p style={{ fontWeight: 800, color: '#fff', fontSize: '1.1rem', margin: '0 0 0.35rem 0' }}>
                        Arrastra aquí tu archivo de planeación o haz clic para explorar
                      </p>
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
                        Formatos soportados: <strong>Excel (.xlsx, .xls)</strong> y <strong>CSV (.csv)</strong>
                      </p>
                    </div>

                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      marginTop: '0.6rem',
                      flexWrap: 'wrap',
                      justifyContent: 'center'
                    }}>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: '#cbd5e1', fontSize: '0.75rem' }}>
                        24 Columnas Oficiales BAZ
                      </span>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: '#cbd5e1', fontSize: '0.75rem' }}>
                        Detección Automática de Paradas
                      </span>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: '#cbd5e1', fontSize: '0.75rem' }}>
                        Sincronización en la Nube
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Guía rápida de columnas soportadas */}
              <div style={{ marginTop: '1.5rem', background: '#0d1527', borderRadius: '10px', padding: '1rem 1.25rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                  <CheckCircle2 size={16} color="#34d399" />
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#fff' }}>
                    Columnas oficiales que se procesan automáticamente:
                  </span>
                </div>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                  gap: '0.45rem', 
                  fontSize: '0.76rem',
                  color: '#94a3b8' 
                }}>
                  <div>• NO. VIAJE / ECO UNIDAD</div>
                  <div>• BLOQUES / PLACAS / CAP</div>
                  <div>• LINEA / OPERADOR / FECHA</div>
                  <div>• # CARGA / # SUC / SUCURSAL</div>
                  <div>• CORTINA / ESTATUS</div>
                  <div>• PLAN COLOCACIÓN / REAL</div>
                  <div>• FIN CARGA / CASETA</div>
                  <div>• FOLIO ENVÍO / SELLOS</div>
                  <div>• MOTOS / REMOLQUE / MTRS</div>
                </div>
              </div>
            </div>
          ) : (
            /* VISTA PREVIA DE DATOS PARSEADOS */
            <div>
              {/* Tarjetas de Resumen Rápido */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                gap: '0.75rem', 
                marginBottom: '1.25rem' 
              }}>
                <div style={{ background: '#101b30', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.35)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#34d399', fontSize: '0.75rem', fontWeight: 700 }}>
                    <Truck size={14} />
                    <span>VIAJES DETECTADOS</span>
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                    {parsedData.totalViajes}
                  </div>
                </div>

                <div style={{ background: '#101b30', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8', fontSize: '0.75rem', fontWeight: 700 }}>
                    <Layers size={14} />
                    <span>PARADAS CONSOLIDADAS</span>
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                    {totalSecondaryStops}
                  </div>
                </div>

                <div style={{ background: '#101b30', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(192, 132, 252, 0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#c084fc', fontSize: '0.75rem', fontWeight: 700 }}>
                    <Users size={14} />
                    <span>OPERADORES</span>
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                    {totalOperadores}
                  </div>
                </div>

                <div style={{ background: '#101b30', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(250, 204, 21, 0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#facc15', fontSize: '0.75rem', fontWeight: 700 }}>
                    <Calendar size={14} />
                    <span>FECHA DETECTADA</span>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginTop: '0.45rem', fontFamily: 'var(--font-mono)' }}>
                    {parsedData.fechaDetectada || 'Hoy'}
                  </div>
                </div>

                <div style={{ background: '#101b30', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(148, 163, 184, 0.3)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                    ESTATUS DETECTADOS
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <span>🟡 <strong>{totalEnCaseta}</strong> en Caseta</span>
                    <span>🔵 <strong>{totalColocados}</strong> Colocados</span>
                    <span>⚪ <strong>{totalPendientes}</strong> Pendientes</span>
                  </div>
                </div>
              </div>

              {/* Selector de Hoja / Día del Mes (para libros multi-hoja con 26 días) */}
              {parsedData.hojasDisponibles && parsedData.hojasDisponibles.length > 1 && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(16, 185, 129, 0.08))',
                  border: '1px solid rgba(6, 182, 212, 0.4)',
                  borderRadius: '10px',
                  padding: '0.85rem 1.25rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.85rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'rgba(6, 182, 212, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#22d3ee'
                    }}>
                      <Layers size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                        <span>Pestaña Activa: <strong style={{ color: '#22d3ee' }}>Pestaña {parsedData.nombreHoja} ({parsedData.nombreHoja === '26' ? 'Día 26' : `Día ${parsedData.nombreHoja}`})</strong></span>
                        {(parsedData.nombreHoja === '26' || parseInt(parsedData.nombreHoja, 10) === 26) && (
                          <span style={{
                            background: '#10b981',
                            color: '#fff',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px'
                          }}>
                            ✓ DÍA 26 (SELECCIONADA)
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        El libro contiene {parsedData.hojasDisponibles.length} pestañas diarias ({parsedData.hojasDisponibles.map(h => h.name).join(', ')}). Puedes cambiar de día aquí:
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700 }}>
                      Cambiar Día / Pestaña:
                    </label>
                    <select
                      value={parsedData.nombreHoja}
                      onChange={(e) => handleSwitchSheet(e.target.value)}
                      disabled={isProcessing}
                      style={{
                        background: '#070c17',
                        border: '1.5px solid #06b6d4',
                        color: '#fff',
                        padding: '0.45rem 0.85rem',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        outline: 'none',
                        boxShadow: '0 0 10px rgba(6, 182, 212, 0.25)'
                      }}
                    >
                      {parsedData.hojasDisponibles.map(sh => (
                        <option key={sh.id || sh.name} value={sh.name}>
                          Pestaña {sh.name} ({sh.displayName}) {sh.isToday ? '★ [DÍA 26 - ACTIVA]' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Selector de Modo de Importación */}
              <div style={{
                background: '#0d1527',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '1rem 1.25rem',
                marginBottom: '1.25rem'
              }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', display: 'block', marginBottom: '0.6rem' }}>
                  ¿Cómo deseas aplicar esta planeación?
                </span>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <label 
                    style={{
                      flex: 1,
                      minWidth: '240px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      background: importMode === 'replace' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                      border: importMode === 'replace' ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    <input 
                      type="radio" 
                      name="importMode" 
                      value="replace" 
                      checked={importMode === 'replace'} 
                      onChange={() => setImportMode('replace')}
                      style={{ marginTop: '3px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.88rem' }}>
                        Reemplazar plan activo de hoy (Recomendado)
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Vacia el tablero actual y carga exactamente los {parsedData.totalViajes} viajes del archivo.
                      </div>
                    </div>
                  </label>

                  <label 
                    style={{
                      flex: 1,
                      minWidth: '240px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      background: importMode === 'merge' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                      border: importMode === 'merge' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    <input 
                      type="radio" 
                      name="importMode" 
                      value="merge" 
                      checked={importMode === 'merge'} 
                      onChange={() => setImportMode('merge')}
                      style={{ marginTop: '3px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.88rem' }}>
                        Agregar / Fusionar al plan existente
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Mantiene las unidades actuales y actualiza o suma las unidades del archivo.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Tabla de Previsualización */}
              <div style={{ 
                marginBottom: '0.75rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.6rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#fff' }}>
                    Viajes Leídos ({parsedData.totalViajes}):
                  </span>
                  {parsedData.nombreHoja && (
                    <span style={{
                      background: 'rgba(6, 182, 212, 0.15)',
                      color: '#22d3ee',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      border: '1px solid rgba(6, 182, 212, 0.3)'
                    }}>
                      Hoja: {parsedData.nombreHoja}
                    </span>
                  )}
                  {previewSearch && (
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      (Mostrando {filteredUnits.length} de {parsedData.totalViajes})
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ position: 'relative', width: '220px' }}>
                    <Search size={13} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      placeholder="Buscar en el archivo..."
                      value={previewSearch}
                      onChange={(e) => setPreviewSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.35rem 0.6rem 0.35rem 1.8rem',
                        background: '#070c17',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '0.76rem'
                      }}
                    />
                  </div>

                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Archivo: <strong>{parsedData.fileInfo.name}</strong> ({parsedData.fileInfo.sizeKb} KB)
                  </span>
                </div>
              </div>

              <div style={{
                maxHeight: '320px',
                overflowY: 'auto',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                background: '#0d1527'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                  <thead>
                    <tr style={{ background: '#101b30', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', textAlign: 'left', position: 'sticky', top: 0, zIndex: 1 }}>
                      <th style={{ padding: '0.5rem 0.6rem' }}>VIAJE</th>
                      <th style={{ padding: '0.5rem 0.6rem' }}>ECO</th>
                      <th style={{ padding: '0.5rem 0.6rem' }}>BLQ</th>
                      <th style={{ padding: '0.5rem 0.6rem' }}>CAP</th>
                      <th style={{ padding: '0.5rem 0.6rem' }}>OPERADOR</th>
                      <th style={{ padding: '0.5rem 0.6rem' }}>CARGA</th>
                      <th style={{ padding: '0.5rem 0.6rem' }}>SUCURSAL / DESTINO</th>
                      <th style={{ padding: '0.5rem 0.6rem' }}>CORTINA</th>
                      <th style={{ padding: '0.5rem 0.6rem' }}>PLAN COLOC.</th>
                      <th style={{ padding: '0.5rem 0.6rem' }}>MTRS</th>
                      <th style={{ padding: '0.5rem 0.6rem' }}>ESTATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUnits.length === 0 ? (
                      <tr>
                        <td colSpan="11" style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8' }}>
                          No se encontraron viajes que coincidan con &quot;{previewSearch}&quot;
                        </td>
                      </tr>
                    ) : (
                      filteredUnits.map((u, idx) => (
                        <tr key={u.id || idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '0.45rem 0.6rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>
                            {u.noViaje || '—'}
                          </td>
                          <td style={{ padding: '0.45rem 0.6rem', fontWeight: 700, color: u.economico ? '#fff' : '#fbbf24' }}>
                            {u.economico ? u.economico : (
                              <span style={{ fontSize: '0.68rem', color: '#94a3b8', border: '1px dashed rgba(148, 163, 184, 0.4)', padding: '0.1rem 0.35rem', borderRadius: '3px' }}>
                                POR ASIGNAR
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '0.45rem 0.6rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                            {u.bloque}
                          </td>
                          <td style={{ padding: '0.45rem 0.6rem', color: '#cbd5e1', fontFamily: 'var(--font-mono)' }}>
                            {u.capUnidad}
                          </td>
                          <td style={{ padding: '0.45rem 0.6rem', color: '#fff', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {u.operador || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.72rem' }}>Por Asignar</span>}
                          </td>
                          <td style={{ padding: '0.45rem 0.6rem', fontFamily: 'var(--font-mono)', color: '#cbd5e1' }}>
                            {u.numCarga || '—'}
                          </td>
                          <td style={{ padding: '0.45rem 0.6rem', color: '#f1f5f9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span style={{ fontWeight: 600 }}>{u.destino || 'Sin Destino'}</span>
                              {u.destinosSecundarios && u.destinosSecundarios.length > 0 && (
                                <span style={{
                                  background: 'rgba(56, 189, 248, 0.2)',
                                  color: '#38bdf8',
                                  padding: '0.1rem 0.35rem',
                                  borderRadius: '4px',
                                  fontSize: '0.68rem',
                                  fontWeight: 700
                                }}>
                                  +{u.destinosSecundarios.length}
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '0.45rem 0.6rem', color: '#e2e8f0', fontFamily: 'var(--font-mono)' }}>
                            {u.cortina || '—'}
                          </td>
                          <td style={{ padding: '0.45rem 0.6rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                            {u.horaColocacion || '—'}
                          </td>
                          <td style={{ padding: '0.45rem 0.6rem', color: '#cbd5e1', fontFamily: 'var(--font-mono)' }}>
                            {u.mtrs || '—'}
                          </td>
                          <td style={{ padding: '0.45rem 0.6rem' }}>
                            <span style={{
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              background: u.estatusPlaneacion === 'CARGADO' ? 'rgba(234, 179, 8, 0.2)' : u.estatusPlaneacion === 'COLOCADO' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                              color: u.estatusPlaneacion === 'CARGADO' ? '#facc15' : u.estatusPlaneacion === 'COLOCADO' ? '#22d3ee' : '#cbd5e1'
                            }}>
                              {u.estatusPlaneacion === 'CARGADO' ? 'EN CASETA' : u.estatusPlaneacion}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Pie del Modal con Acciones */}
        <div style={{
          padding: '1rem 1.6rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: '#0d1527',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          <div>
            {parsedData && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setParsedData(null);
                  setErrorMessage('');
                }}
                style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
                disabled={isProcessing}
              >
                Subir Otro Archivo
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={isProcessing}
            >
              Cancelar
            </button>

            {parsedData && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmImport}
                disabled={isProcessing}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  borderColor: '#10b981',
                  color: '#fff',
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 1.25rem'
                }}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw size={16} className="spin-animation" />
                    <span>Guardando en la Base de Datos...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Confirmar e Importar {parsedData.totalViajes} Viajes</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
