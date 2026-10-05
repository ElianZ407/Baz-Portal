# AGENTS.md

## Overview

**BAZ Entregas** — sistema de control y monitoreo de flota para el Centro de
Distribución Villahermosa. SPA en React con backend en Supabase, más una vista
de TV para proyección continua en la sala de control.

Stack: React 19.2 + Vite 7, `react-router-dom` 7, `@supabase/supabase-js`,
`lucide-react` para iconos, oxlint para lint. CSS plano (sin Tailwind ni
CSS-in-JS) centralizado en `src/index.css`.

## Comandos

```bash
npm run dev      # servidor de desarrollo
npm run build    # build de producción
npm run lint     # oxlint sobre src/
```

**No hay framework de tests.** No ejecutes `npm test`. La verificación es
`npm run lint` + `npm run build`, más scripts node ad-hoc para las reglas de
`src/utils/`.

El lint por defecto es **demasiado permisivo**: el config no activa `no-undef`,
así que un import mal escrito NO lo detecta. Antes de dar por bueno un cambio:

```bash
npx oxlint -D all -A no-unused-vars -A no-unused-expressions src/
```

## Mapa de archivos

| Ruta | Responsabilidad |
| --- | --- |
| `src/main.jsx` | Punto de entrada y router |
| `src/context/FleetContext.jsx` | Estado global: catálogo + viajes + localStorage + Realtime |
| `src/lib/supabaseClient.js` | Fetch de tablas y mapeo de filas a unidades |
| `src/utils/fleetUtils.js` | Reglas de negocio puras (estatus, disponibilidad, mañana) |
| `src/components/PatioView.jsx` | Control físico en CEDIS |
| `src/components/PlaneacionView.jsx` | Asignación de viajes y operadores |
| `src/components/SupervisorView.jsx` | Monitoreo en ruta |
| `src/components/TvDashboardView.jsx` | Tablero de sala de control |
| `src/components/UnitModal.jsx` | Alta y edición de unidad (el más grande) |
| `src/index.css` | Tokens de diseño y estilos globales |
| `src/data/` | **Ignorado por git** |

## Reglas de dominio

- **Unidad:** `eco` (interno de 5 dígitos), `capacidad` en m³, `tipo`,
  `teléfono`, `operador`.
- **`capUnidad` se deriva de `capacidad`, nunca se hardcodea.** Capacidad 18 =>
  camioneta, 50 => rango medio (rabón), 90/110 => tracto.
- **Valores reales de `flota_maestra.tipo`:** `Camioneta`, `Rango Medio`,
  `Tracto / Full`, `Tracto / Sencillo`, `Madrina / Rango Medio`.
- **LOCAL regresa el mismo día. FORANEO puede pernoctar**, y es el único que
  cuenta para el KPI "Disponibles Mañana". Las camionetas nunca cuentan.
- **Viaje:** `completado = 'S/N'`. Un viaje activo es asignado y no completado.
  Ciclo: Pendiente -> Cargado -> En Ruta -> (Espera Descarga / Descargando /
  Retorno / Retrasado) -> Completado.
- **Patio:** Disponible, Colocado p/ Carga, Cargado, Taller, No Disponible.

## Convenciones

- JavaScript plano, sin TypeScript.
- Dominio, UI y commits **en español**. Mantenlo así.
- Sin módulos CSS; se estiliza desde `src/index.css` con variables.
- Iconos únicamente de `lucide-react`.
- **No escribas comentarios en el código.**
- No agregues dependencias nuevas sin necesidad real.

## Trampas

1. **`.env` tiene las claves `VITE_SUPABASE_*` DUPLICADAS.** Vite gana la
   última. Si agregas una clave, reemplaza *todas* las ocurrencias.
2. **`.env` contiene credenciales reales.** Está ignorado por git: nunca lo
   commitees.
3. **`.env.example` está borrado del working tree**, pero `README.md` todavía
   lo referencia y `.gitignore` lo exceptúa (`!.env.example`). Si lo restauras,
   solo con placeholders, nunca con credenciales reales.
4. **El `README.md` está desactualizado:** describe 4 KPIs en la TV, pero ya hay
   un quinto (Disponibles Mañana) y filtros por estatus.
5. **`src/components/SatelliteBackground.jsx` (66 lineas) es codigo muerto** —
   solo se referencia a si mismo; `App.jsx` importa `RoutesBackground`. Lo
   mismo con `src/App.css` (158 lineas), que no lo importa nadie.
6. **`fl` es el campo LOCAL/FORANEO de la SUCURSAL destino**, no del viaje. Se
   copia a la fila del viaje (`viajes_diarios.fl`) y se lee con
   `unit.fl === 'FORANEO'`, comparacion exacta y sin acentos. `mapDbToUnit` lo
   degrada a `'LOCAL'` si viene vacio.
7. **Node no puede importar `src/utils/` tal cual** por los imports sin
   extension. Para probarlos, copia a una carpeta temporal renombrando a
   `.mjs`; no los importes directo.
8. `src/data/`, `scratch/` y `*.sql` estan ignorados por git.

## Git y deploy

- `main` es producción: se pushea directo y Vercel redespliega solo.
- Remote: `git@github.com:ElianZ407/Baz-Portal.git`
- Commits en español e imperativo: `Corrige...`, `Rediseña...`, `Proyecta...`
- `vercel.json` ya resuelve el fallback SPA (todas las rutas -> `/`).
- No incluyas cambios ajenos al trabajo en curso: revisa `git status` y stagea
  solo lo tuyo.
