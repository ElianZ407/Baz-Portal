# BAZ Entregas — Sistema de Control y Monitoreo de Flota

Plataforma web integral para la coordinación, asignación y seguimiento en tiempo real de unidades de transporte logístico.

---

## 🚚 Módulos del Sistema

1. **Patio (Operación en Centro de Distribución):**
   - Control físico de unidades en patio: *Disponible*, *Colocado p/ Carga*, *Cargado* y *Taller / Mantenimiento*.
   - Clasificación por tipo de unidad (*Sencillos* y *Tractos*).

2. **Planeación de Embarques:**
   - Asignación de viajes, bloques de salida, operadores, folios de carga y cortinas de embarque.
   - Soporte para rutas consolidadas y entregas multipunto.
   - Despacho directo hacia ruta.

3. **Supervisor (Monitoreo Fuera de CD):**
   - Seguimiento del ciclo de viaje: *En Ruta (Tránsito)*, *Espera Descarga*, *Descargando*, *Retorno*, *Retrasado / Alerta* y *Completado*.
   - Cálculo automático de ETA y bitácora de novedades en carretera.

4. **Tablero TV en Vivo (Sala de Control):**
   - Vista panorámica de alto contraste diseñada para proyección continua en pantallas grandes y monitores de sala de tráfico.
   - 4 tarjetas KPI en tiempo real:
     * Unidades Registradas
     * En Tránsito
     * En Sucursal / Rampa
     * Retrasadas / Alerta

---

## 🛠️ Tecnologías Utilizadas

- **Frontend:** React 19 + Vite
- **Estilos:** Vanilla CSS moderno (*Glassmorphism, Dark Theme*)
- **Iconografía:** Lucide React
- **Persistencia:** Almacenamiento local persistente con preparación para sincronización con base de datos en tiempo real (Supabase / PostgreSQL).

---

## 🚀 Instalación y Ejecución

```bash
# Instalar dependencias
npm install

# Iniciar servidor local
npm run dev

# Generar versión de producción
npm run build
```
