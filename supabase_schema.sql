-- ====================================================================
-- BAZ ENTREGAS — CD VILLAHERMOSA (LOGÍSTICA Y MONITOREO DE EMBARQUES)
-- ESQUEMA COMPLETO DE BASE DE DATOS SUPABASE (REAL-TIME ACTIVADO)
-- ====================================================================
-- Ejecuta este script completo en el SQL Editor de tu proyecto en Supabase.
-- Incluye:
-- 1. Tabla 'viajes_diarios' (Monitoreo en vivo de viajes diarios con Realtime)
-- 2. Tabla 'flota_maestra' (Las 45 unidades oficiales, placas, capacidades y operadores)
-- 3. Tabla 'sucursales_maestras' (Las 80+ tiendas de Tabasco, Veracruz, Chiapas, Oaxaca, Península)
-- 4. Políticas de Seguridad Permisivas (RLS) para lectura y escritura desde la app
-- 5. Publicación en Realtime de Postgres habilitada
-- ====================================================================

-- 1. CREACIÓN DE TABLAS

-- TABLA: viajes_diarios (operaciones del día)
CREATE TABLE IF NOT EXISTS public.viajes_diarios (
    id TEXT PRIMARY KEY,
    no_viaje TEXT,
    economico TEXT,
    bloque INTEGER DEFAULT 1,
    placas TEXT,
    cap_unidad NUMERIC,
    linea TEXT DEFAULT 'LTI - VHS',
    tipo TEXT,
    operador TEXT,
    id_operador TEXT,
    turno TEXT DEFAULT 'M1',
    cortina TEXT,
    num_carga TEXT,
    num_sucursal TEXT,
    sucursal_origen TEXT DEFAULT 'CEDIS VILLAHERMOSA',
    destino TEXT,
    closter TEXT,
    fl TEXT DEFAULT 'LOCAL',
    cap_max TEXT,
    fecha TEXT,
    hora_salida TEXT,
    tiempo_estimado_hrs NUMERIC,
    eta TEXT,
    estatus_patio TEXT DEFAULT 'Disponible',
    estatus_planeacion TEXT DEFAULT 'PENDIENTE',
    estatus_supervisor TEXT DEFAULT 'Pendiente',
    observaciones TEXT,
    actualizado_en TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: flota_maestra (catálogo centralizado de unidades y operadores)
CREATE TABLE IF NOT EXISTS public.flota_maestra (
    eco TEXT PRIMARY KEY,
    placas TEXT,
    id_operador TEXT,
    operador TEXT,
    tipo TEXT,
    cap_unidad INTEGER,
    estatus TEXT,
    linea TEXT DEFAULT 'LTI - VHS',
    caja1 TEXT,
    dolly TEXT,
    caja2 TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: sucursales_maestras (directorio oficial de tiendas y restricciones)
CREATE TABLE IF NOT EXISTS public.sucursales_maestras (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    closter TEXT,
    sec INTEGER,
    region TEXT,
    formato TEXT,
    fl TEXT,
    cap_max TEXT,
    restriccion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. HABILITACIÓN DE SEGURIDAD (ROW LEVEL SECURITY)
ALTER TABLE public.viajes_diarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flota_maestra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sucursales_maestras ENABLE ROW LEVEL SECURITY;

-- Políticas para acceso anónimo (App Web de Monitoreo)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Permitir todo en viajes_diarios" ON public.viajes_diarios;
    DROP POLICY IF EXISTS "Permitir lectura en flota_maestra" ON public.flota_maestra;
    DROP POLICY IF EXISTS "Permitir lectura en sucursales_maestras" ON public.sucursales_maestras;
    DROP POLICY IF EXISTS "Permitir todo en flota_maestra" ON public.flota_maestra;
    DROP POLICY IF EXISTS "Permitir todo en sucursales_maestras" ON public.sucursales_maestras;
END $$;

CREATE POLICY "Permitir todo en viajes_diarios"
    ON public.viajes_diarios FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Permitir todo en flota_maestra"
    ON public.flota_maestra FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Permitir todo en sucursales_maestras"
    ON public.sucursales_maestras FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 3. ACTIVAR TIEMPO REAL (REALTIME) EN viajes_diarios
-- Esto permite que cualquier cambio en una PC se refleje inmediatamente en TV y teléfonos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'viajes_diarios'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.viajes_diarios;
    END IF;
END $$;

-- 4. POBLACIÓN DE DATOS MAESTROS (UPSERT PARA NO DUPLICAR)

-- FLOTA: Camionetas, Rango Medio y Quintas
INSERT INTO public.flota_maestra (eco, placas, id_operador, operador, tipo, cap_unidad, estatus, linea, caja1, dolly, caja2) VALUES
  ('3114', 'A726AF', '1108583', 'OMAR BROCA RODRIGUEZ', 'Camioneta', 18, 'PRESTAMO JALPA', 'LTI - VHS', NULL, NULL, NULL),
  ('3153', 'CV4372F', '1061741', 'JUAN BACHO IZQUIERDO', 'Camioneta', 18, 'TALLER', 'LTI - VHS', NULL, NULL, NULL),
  ('3237', 'LE17349', '1198687', 'NESTOR ANDRES HERNANDEZ PEREZ', 'Camioneta', 18, 'ACTIVO', 'LTI - VHS', NULL, NULL, NULL),
  ('3251', 'LE17373', '', 'VACANTE', 'Camioneta', 18, 'CORRALON SAT', 'LTI - VHS', NULL, NULL, NULL),
  ('3271', 'CV4378F', '1123995', 'MARTIN CRUZ GARCIA', 'Camioneta', 18, 'ACTIVO', 'LTI - VHS', NULL, NULL, NULL),
  ('3272', 'CV4379F', '1232975', 'ALEJANDRO RAMON DE LA CRUZ', 'Camioneta', 18, 'PRESTAMO PALENQUE', 'LTI - VHS', NULL, NULL, NULL),
  ('3317', 'CV4387F', '1231603', 'JUAN PABLO FIGUEROA HERNANDEZ', 'Camioneta', 18, 'TALLER', 'LTI - VHS', NULL, NULL, NULL),
  ('3333', 'CV4390F', '1089423', 'LUIS ALFONSO LAZARO MAY', 'Camioneta', 18, 'TALLER', 'LTI - VHS', NULL, NULL, NULL),
  ('3393', 'GT3465C', '1129366', 'ANTONIO PEREZ PALMA', 'Camioneta', 18, 'ACTIVO', 'LTI - VHS', NULL, NULL, NULL),
  ('3401', 'RU5464B', '1080046', 'ISAI GARCIA VALENCIA', 'Camioneta', 18, 'ACTIVO', 'LTI - VHS', NULL, NULL, NULL),
  ('3416', 'CV4392F', '1132509', 'NATANAEL JIMENEZ GONZALEZ', 'Camioneta', 18, 'TALLER', 'LTI - VHS', NULL, NULL, NULL),
  ('3426', 'RU5466B', '1231758', 'MARTIN FRANCISCO CHAN MENDOZA', 'Camioneta', 18, 'ACTIVO', 'LTI - VHS', NULL, NULL, NULL),
  ('3444', 'RU5465B', '1089382', 'VICTOR MANUEL RAMIREZ CORREA', 'Camioneta', 18, 'TALLER', 'LTI - VHS', NULL, NULL, NULL),
  ('3471', 'CV4395F', '1192390', 'JESUS CRUZ PEREZ', 'Camioneta', 18, 'ACTIVO', 'LTI - VHS', NULL, NULL, NULL),
  ('3483', 'LE38945', '1091656', 'ARMANDO GARCIA ARIAS', 'Camioneta', 18, 'ACTIVO', 'LTI - VHS', NULL, NULL, NULL),
  ('3488', 'CF54367', '1080439', 'JORGE AREVALO JIMENEZ', 'Camioneta', 18, 'ACTIVO', 'LTI - VHS', NULL, NULL, NULL),
  ('3496', 'LE39123', '1079708', 'JOSE JESUS MAY SALVADOR', 'Camioneta', 18, 'TALLER', 'LTI - VHS', NULL, NULL, NULL),
  ('3800', 'KP3798A', '', 'BAJA', 'Camioneta', 18, 'BAJA', 'LTI - VHS', NULL, NULL, NULL),
  ('4029', '975FF4', '1080001', 'SANTIAGO ALEJANDRO PEREZ MORALES', 'Rango Medio', 50, 'ACTIVO', 'LTI - VHS', NULL, NULL, NULL),
  ('4039', '976FF4', '1080002', 'RODIVER CASTILLO RODRIGUEZ', 'Rango Medio', 50, 'ACTIVO', 'LTI - VHS', NULL, NULL, NULL),
  ('4049', '981FF4', '', 'VACANTE', 'Rango Medio', 50, 'TALLER', 'LTI - VHS', NULL, NULL, NULL),
  ('4069', '175FF5', '1080003', 'JUAN CARLOS GARCIA GARCIA', 'Rango Medio', 50, 'ACTIVO', 'LTI - VHS', NULL, NULL, NULL),
  ('4071', '174FF5', '1080004', 'ROGELIO HERNANDEZ PEREZ', 'Rango Medio', 50, 'ACTIVO', 'LTI - VHS', NULL, NULL, NULL),
  ('4100', '21FA4G', '1080005', 'VICTOR MANUEL CORDOVA OSORIO', 'Rango Medio', 50, 'ACTIVO', 'LTI - VHS', NULL, NULL, NULL),
  ('4104', '43FA7G', '1080006', 'CARLOS HIPOLITO BAUTISTA', 'Madrina / Rango Medio', 40, 'ACTIVO', 'LTI - VHS - MADRINA', NULL, NULL, NULL),
  ('4108', '67FA7G', '1080007', 'VICENTE HERNANDEZ DE LA CRUZ', 'Rango Medio', 50, 'ACTIVO', 'LTI - VHS', NULL, NULL, NULL),
  ('4109', '68FA7G', '', 'VACANTE', 'Rango Medio', 50, 'TALLER', 'LTI - VHS', NULL, NULL, NULL),
  ('4115', '57FA7G', '1080008', 'CRESCENCIO BETANCOURT CHABLE', 'Rango Medio', 50, 'ACTIVO', 'LTI - VHS', NULL, NULL, NULL),
  ('4117', '48FA7G', '1080009', 'LUIS ENRIQUE GOMEZ GOVEA', 'Rango Medio', 50, 'ACTIVO', 'LTI - VHS', NULL, NULL, NULL),
  ('4118', '97FA4G', '1080010', 'ELIN BRAYAN FIGUEROA FERNANDEZ', 'Rango Medio', 50, 'ACTIVO', 'LTI - VHS', NULL, NULL, NULL),
  ('4125', '05FA5G', '1080011', 'EDGAR BENITO CRUZ CASTILLO', 'Rango Medio', 50, 'ACTIVO', 'LTI - VHS', NULL, NULL, NULL),
  ('4134', '03FA5G', '1080012', 'ROGER IZQUIERDO HERNANDEZ', 'Rango Medio', 50, 'ACTIVO', 'LTI - VHS', NULL, NULL, NULL),
  ('4135', '11FA5G', '1080013', 'ANDERSON LUISAO HERNANDEZ GARCIA', 'Rango Medio', 50, 'ACTIVO', 'LTI - VHS', NULL, NULL, NULL),
  ('4139', '12FA5G', '1080014', 'RODOLFO ANTONIO EVIA VELAZQUEZ', 'Rango Medio', 50, 'ACTIVO', 'LTI - VHS', NULL, NULL, NULL),
  ('4142', '10FA5G', '1080015', 'LUIS ENRIQUE LEON BAUTISTA', 'Rango Medio', 50, 'ACTIVO', 'LTI - VHS', NULL, NULL, NULL),
  ('4157', '90FA4G', '1080016', 'NABOPOLASSAR RAMOS PERALTA', 'Rango Medio', 50, 'ACTIVO', 'LTI - VHS', NULL, NULL, NULL),
  ('4160', '41FA4J', '1080017', 'URIEL SILVA PEREZ', 'Rango Medio', 50, 'ACTIVO', 'LTI - VHS', NULL, NULL, NULL),
  ('4174', '06FA6H', '1080018', 'JUAN CARLOS ROJAS CASANOVA', 'Rango Medio', 50, 'ACTIVO', 'LTI - VHS', NULL, NULL, NULL),
  ('4177', '87FA3W', '1080019', 'ABNER JOVAN HERNANDEZ FUENTES', 'Rango Medio', 50, 'ACTIVO', 'LTI - VHS', NULL, NULL, NULL),
  ('4179', '45FA4J', '1080020', 'CRISTOBAL RIOS SANCHEZ', 'Rango Medio', 50, 'ACTIVO', 'LTI - VHS', NULL, NULL, NULL),
  ('4192', '89FA4G', '1080021', 'LUIS ALBERHT DOMINGUEZ LOPEZ', 'Rango Medio', 50, 'ACTIVO', 'LTI - VHS', NULL, NULL, NULL),
  ('4193', '92FA4G', '1080022', 'ATILANO RODRIGUEZ MENDEZ', 'Rango Medio', 50, 'ACTIVO', 'LTI - VHS', NULL, NULL, NULL),
  ('4198', '94FA4G', '1080023', 'JULIO CESAR PEREZ PEREZ', 'Rango Medio', 50, 'ACTIVO', 'LTI - VHS', NULL, NULL, NULL),
  ('5009', '55FA6N', '1090001', 'LUIS DIAZ CHABLE', 'Tracto / Full', 110, 'ACTIVO', 'LTI - VHS', '', '', ''),
  ('5013', '020FD8', '', 'VACANTE', 'Tracto / Full', 110, 'ACTIVO', 'LTI - VHS', '', '', ''),
  ('5026', '28FA8W', '1090002', 'CONCEPCION ARIAS VELAZQUEZ', 'Tracto / Full', 110, 'ACTIVO', 'LTI - VHS', '2018', 'D20', '2029'),
  ('5035', '73FA3F', '1090003', 'ADRIAN IZQUIERDO ZAVALA', 'Tracto / Full', 110, 'ACTIVO', 'LTI - VHS', '2037', 'D06', '2038'),
  ('5036', '74FA3F', '1090004', 'JACINTO HERNANDEZ ANTONIO', 'Tracto / Sencillo', 90, 'ACTIVO', 'LTI - VHS', '2045', 'N/A', '2046'),
  ('5052', '55FA7H', '1090005', 'ANDRES PULIDO LEYVA', 'Tracto / Full', 110, 'ACTIVO', 'LTI - VHS', '2021', 'D10', '2025'),
  ('5053', '52FA7H', '1090006', 'OMAR PEDRAZA SANTIAGO', 'Tracto / Full', 110, 'ACTIVO', 'LTI - VHS', '2012', 'D11', '2016'),
  ('5054', '85FA9H', '1090007', 'SEBASTIAN GONGORA JIMENEZ', 'Tracto / Full', 110, 'ACTIVO', 'LTI - VHS', '2023', 'D12', '2002'),
  ('5066', '26FA4K', '1090008', 'REMEDIO BADAL GARCIA', 'Tracto / Full', 110, 'ACTIVO', 'LTI - VHS', '', '', ''),
  ('5068', '02FA7K', '1090009', 'JAVIER SANTOS CALIZ', 'Tracto / Full', 110, 'ACTIVO', 'LTI - VHS', '', '', ''),
  ('5069', '99FA6K', '1090010', 'CALEB DAMIAN DE LA CRUZ', 'Tracto / Full', 110, 'ACTIVO', 'LTI - VHS', '', '', ''),
  ('5070', '04FA7K', '1090011', 'ERNESTO HERNANDEZ FELIX', 'Tracto / Full', 110, 'ACTIVO', 'LTI - VHS', '', '', ''),
  ('5075', '09FA7K', '1090012', 'LUIS ALFREDO LOPEZ CHABLE', 'Tracto / Full', 110, 'ACTIVO', 'LTI - VHS', '', '', '')
ON CONFLICT (eco) DO UPDATE SET
  placas = EXCLUDED.placas,
  id_operador = EXCLUDED.id_operador,
  operador = EXCLUDED.operador,
  tipo = EXCLUDED.tipo,
  cap_unidad = EXCLUDED.cap_unidad,
  estatus = EXCLUDED.estatus,
  linea = EXCLUDED.linea;

-- SUCURSALES MAESTRAS
INSERT INTO public.sucursales_maestras (id, nombre, closter, sec, region, formato, fl, cap_max, restriccion) VALUES
  ('6208', 'EKT VILLAHERMOSA 2 MADERO', 'HUB-VHSA', 1, 'TABASCO', 'EKT', 'LOCAL', '18', 'HUB LOCAL'),
  ('6018', 'EKT LA VENTA TABASCO', 'TAB-1', 1, 'TABASCO', 'EKT', 'LOCAL', 'Madrina / 50', NULL),
  ('203', 'BAJAJ VILLAHERMOSA', 'HUB-VHSA', 2, 'TABASCO', 'ITK', 'LOCAL', '18', NULL),
  ('1988', 'HONDA VILLAHERMOSA', 'HUB-VHSA', 3, 'TABASCO', 'ITK', 'LOCAL', '18', NULL),
  ('2206', 'EKT VILLAHERMOSA PLAZA CRYSTAL', 'HUB-VHSA', 4, 'TABASCO', 'EKT', 'LOCAL', '18', NULL),
  ('4750', 'MEGA VILLAHERMOSA', 'HUB-VHSA', 21, 'TABASCO', 'MEGA', 'LOCAL', '18', NULL),
  ('7414', 'MEGA MACUSPANA', 'CLUSTER MACUSPANA', 22, 'TABASCO', 'MEGA', 'LOCAL', '18, 50', 'TRASPALEO'),
  ('8267', 'EKT MACUSPANA', 'CLUSTER MACUSPANA', 23, 'TABASCO', 'EKT', 'LOCAL', '18, 50', NULL),
  ('6542', 'EKT TEAPA', 'CLUSTER TEAPA', 25, 'TABASCO', 'EKT', 'LOCAL', '18', NULL),
  ('4720', 'DAZ PP JALAPA TABASCO', 'CLUSTER TEAPA', 28, 'TABASCO', 'DAZ', 'LOCAL', '18', NULL),
  ('4860', 'MEGA COMALCALCO', 'CLUSTER COMALCALCO', 29, 'TABASCO', 'MEGA', 'LOCAL', '18', NULL),
  ('6460', 'ELEKTRA MOTOS COMALCALCO', 'CLUSTER COMALCALCO', 31, 'TABASCO', 'EKTM', 'LOCAL', '18', NULL),
  ('9912', 'DIST PROP ITALIKA COMALCALCO', 'CLUSTER COMALCALCO', 32, 'TABASCO', 'ITK', 'LOCAL', '18', NULL),
  ('5173', 'EKT CUNDUACAN', 'CLUSTER CUNDUACAN', 33, 'TABASCO', 'EKT', 'LOCAL', '18', NULL),
  ('4489', 'DIST PROP ITALIKA CUNDUACAN', 'CLUSTER CUNDUACAN', 35, 'TABASCO', 'ITK', 'LOCAL', '18', NULL),
  ('2968', 'SYR CARDENAS', 'CLUSTER CARDENAS', 34, 'TABASCO', 'SYR', 'LOCAL', '18', NULL),
  ('191', 'EKT CARDENAS BANDALA', 'CLUSTER CARDENAS', 36, 'TABASCO', 'EKT', 'LOCAL', '18', NULL),
  ('2590', 'MEGA CARDENAS', 'CLUSTER CARDENAS', 37, 'TABASCO', 'MEGA', 'LOCAL', '18', NULL),
  ('9757', 'MEGA JALPA DE MENDEZ', 'CLUSTER JALPA', 41, 'TABASCO', 'MEGA', 'LOCAL', '18', NULL),
  ('5771', 'DAZ PP NACAJUCA TABASCO', 'CLUSTER JALPA', 40, 'TABASCO', 'DAZ', 'LOCAL', '18', NULL),
  ('192', 'EKT COMALCALCO JUAREZ', 'CLUSTER COMALCALCO', 44, 'TABASCO', 'EKT', 'LOCAL', '18', NULL),
  ('2963', 'SYR COMALCALCO', 'CLUSTER COMALCALCO', 45, 'TABASCO', 'SYR', 'LOCAL', '18', NULL),
  ('6025', 'EKT FRONTERA TABASCO', 'CLUSTER FRONTERA', 48, 'TABASCO', 'EKT', 'LOCAL', '18', NULL),
  ('5061', 'DAZ PP FRONTERA MADERO', 'CLUSTER FRONTERA', 49, 'TABASCO', 'DAZ', 'LOCAL', '18', NULL),
  ('6381', 'EKT PARAISO TABASCO', 'HUB-VHSA', 54, 'TABASCO', 'EKT', 'LOCAL', '18', NULL),
  ('7540', 'MEGA HUIMANGUILLO', 'CLUSTER HUIMANGUILLO', 55, 'TABASCO', 'MEGA', 'LOCAL', '18', NULL),
  ('2190', 'DIST PROP ITALIKA HUIMANGUILLO', 'CLUSTER HUIMANGUILLO', 56, 'TABASCO', 'ITK', 'LOCAL', '18', NULL),
  ('3259', 'Ekt Motos Tecolutilla', 'CLUSTER COMALCALCO', 85, 'TABASCO', 'EKTM', 'LOCAL', '18', NULL),
  ('2944', 'Ekt Motos Teapa', 'CLUSTER TEAPA', 86, 'TABASCO', 'EKTM', 'LOCAL', '18', NULL),
  ('6015', 'EKT AGUA DULCE', 'V-1', 2, 'VERACRUZ', 'EKT', 'LOCAL', 'Kangoo / 18 / 40 / 50', NULL),
  ('8981', 'EKT DAZ AGUADULCE VERACRUZ', 'V-1', 3, 'VERACRUZ', 'DAZ', 'LOCAL', 'Kangoo / 18', NULL),
  ('1294', 'EKT LAS CHOAPAS', 'V-1', 5, 'VERACRUZ', 'EKT', 'FORANEO', 'Kangoo / 18 / 40 / 50', NULL),
  ('1865', 'DISTRIBUIDOR SAYULA DE ALEMANIA', 'V-2', 1, 'VERACRUZ', 'ITK', 'FORANEO', 'Kangoo / 18 / 40 / 50', 'ZONA VERACRUZ'),
  ('2588', 'DISTRIBUIDOR ITALIKA SAYULA DE ALEMAN', 'V-2', 2, 'VERACRUZ', 'ITK', 'FORANEO', 'Kangoo / 18 / 40 / 50', 'ZONA VERACRUZ'),
  ('942', 'DISTRIBUIDOR ITALIKA ACAYUCAN', 'V-2', 3, 'VERACRUZ', 'ITK', 'FORANEO', 'Madrina / 18 / 50', NULL),
  ('3001', 'Ekt Motos Acayucan', 'V-2', 4, 'VERACRUZ', 'EKTM', 'FORANEO', 'Kangoo / 18 / 40 / 50', NULL),
  ('7809', 'EKT ACAYUCAN VERACRUZ', 'V-2', 5, 'VERACRUZ', 'EKT', 'FORANEO', 'Kangoo / 18 / 40 / 50', NULL),
  ('9685', 'MEGA ELEKTRA PLAZA FLORIDA', 'V-2', 6, 'VERACRUZ', 'MEGA', 'FORANEO', 'Kangoo / 18 / 40 / 50', NULL),
  ('3422', 'APA DEK TEXISTEPEC VERACRUZ', 'V-2', 7, 'VERACRUZ', 'APA', 'FORANEO', 'Kangoo / 18 / 40 / 50', NULL),
  ('2804', 'EKT COATZACOALCOS2 JUAREZ', 'V-3', 1, 'VERACRUZ', 'EKT', 'LOCAL', 'Kangoo / 18 / 40 / 50', NULL),
  ('3156', 'SYR COATZACOALCOS', 'V-3', 2, 'VERACRUZ', 'SYR', 'LOCAL', 'Kangoo / 18 / 40 / 50', NULL),
  ('6703', 'EKT MEGA COATZACOALCOS', 'V-3', 3, 'VERACRUZ', 'MEGA', 'LOCAL', 'Kangoo / 18 / 40 / 50', NULL),
  ('9180', 'DAZ PALMA SOLA', 'V-3', 3, 'VERACRUZ', 'DAZ', 'LOCAL', 'Kangoo / 18 / 40 / 50', NULL),
  ('209', 'EKT COATZACOALCOS UNIVERSIDAD', 'V-3', 4, 'VERACRUZ', 'EKT', 'LOCAL', 'Kangoo / 18 / 40 / 50', NULL),
  ('9391', 'EKT MOTOS COATZACOALCOS 2 JUAR', 'V-3', 5, 'VERACRUZ', 'EKTM', 'LOCAL', 'Kangoo / 18 / 40 / 50', NULL),
  ('8511', 'DAZ NANCHITAL VERACRUZ', 'V-3', 8, 'VERACRUZ', 'DAZ', 'LOCAL', 'Kangoo / 18 / 40 / 50', NULL),
  ('9855', 'DAZ FCO I MADERO CATEMACO', 'V-4', 1, 'VERACRUZ', 'DAZ', 'FORANEO', 'Kangoo / 18', 'ZONA VERACRUZ'),
  ('8673', 'DAZ SANTIAGO TUXTLA', 'V-4', 2, 'VERACRUZ', 'DAZ', 'FORANEO', 'Kangoo / 18', 'ZONA VERACRUZ'),
  ('927', 'DISTRIBUIDOR ITALIKA SAN ANDRES TUXTLA', 'V-4', 4, 'VERACRUZ', 'ITK', 'FORANEO', 'Kangoo / 18', 'ZONA VERACRUZ'),
  ('8372', 'MI EKT SAN ANDRES TUXTLA', 'V-4', 8, 'VERACRUZ', 'MINI', 'FORANEO', 'Kangoo / 18', 'ZONA VERACRUZ'),
  ('1606', 'EKT MOTOS SAN ANDRÉS TUXTLA', 'V-4', 6, 'VERACRUZ', 'EKTM', 'FORANEO', 'Kangoo / 18', 'ZONA VERACRUZ'),
  ('5678', 'EKT MEGA SAN ANDRES TUXTLA', 'V-4', 7, 'VERACRUZ', 'MEGA', 'FORANEO', 'Kangoo / 18', 'ZONA VERACRUZ'),
  ('2971', 'SYR MINATITLAN', 'V-5', 11, 'VERACRUZ', 'SYR', 'LOCAL', 'Kangoo / 18 / 40 / 50', 'SOLO ENVIAR CON 2971-2707-190-5512-7269'),
  ('190', 'EKT MINATITLAN HIDALGO', 'V-5', 10, 'VERACRUZ', 'EKT', 'LOCAL', 'Madrina / 18 / 50', 'SOLO ENVIAR CON 2971-2707-190-5512-7269'),
  ('2707', 'EKT MINATITLAN', 'V-5', 12, 'VERACRUZ', 'EKT', 'LOCAL', 'Kangoo / 18 / 40 / 50', 'SOLO ENVIAR CON 2971-2707-190-5512-7269'),
  ('5512', 'ITK DISTRIBUIDOR MINATITLAN', 'V-5', 9, 'VERACRUZ', 'ITK', 'LOCAL', 'Kangoo / 18 / 40 / 50', 'SOLO ENVIAR CON 2971-2707-190-5512-7269'),
  ('7269', 'DISTRIBUIDOR ITALIKA MINATITLAN', 'V-5', 13, 'VERACRUZ', 'ITK', 'LOCAL', 'Kangoo / 18 / 40 / 50', 'SOLO ENVIAR CON 2971-2707-190-5512-7269'),
  ('9966', 'MEGA ELEKTRA TRANSISMICA JALTI', 'V-5', 18, 'VERACRUZ', 'MEGA', 'LOCAL', 'Kangoo / 18 / 40 / 50', NULL),
  ('8689', 'DAZ COSOLEACAQUE', 'V-5', 16, 'VERACRUZ', 'DAZ', 'LOCAL', 'Kangoo / 18 / 40 / 50', NULL),
  ('7203', 'CHEDRAUI SAN CRISTOBAL', 'CAT-CH-1', 1, 'CHIAPAS', 'CE', 'FORANEO', 'Kangoo / 18 / 40 / 50', 'ZONA CHIAPAS'),
  ('1265', 'APA BOCHIL', 'HUB-TUX', 1, 'CHIAPAS', 'APA', 'FORANEO', 'Kangoo / 18 / 40 / 50', NULL),
  ('9464', 'EKT MEGA V CARRANZA CHIAPAS', 'CH-5', 1, 'CHIAPAS', 'MEGA', 'FORANEO', '50 / 90', 'NO ENVIAR CON 2057-143-449'),
  ('8651', 'EKT ARRIAGA', 'CH-10', 1, 'CHIAPAS', 'EKT', 'FORANEO', '50 / 90', NULL),
  ('2486', 'DISTRIBUIDOR ITALIKA HUIXTLA', 'CH-8', 1, 'CHIAPAS', 'ITK', 'FORANEO', 'Madrina / 50 / 90', NULL),
  ('4689', 'PRESTA PRENDA SAN C DE LAS CASAS 2', 'CAT-CH-1', 2, 'CHIAPAS', 'PP', 'FORANEO', 'Kangoo / 18 / 40 / 50', 'ZONA CHIAPAS'),
  ('2077', 'EKT CHIAPAS OCOSINGO', 'CH-6', 2, 'CHIAPAS', 'EKT', 'FORANEO', 'Kangoo / 18 / 50', 'SE ENVIA DIRECTO'),
  ('8999', 'DAZ SIMOJOVEL', 'HUB-TUX', 2, 'CHIAPAS', 'DAZ', 'FORANEO', 'Kangoo / 18 / 40 / 50', NULL),
  ('419', 'DISTRIBUIDOR ITALIKA TONALA CHIAPAS', 'CH-10', 2, 'CHIAPAS', 'ITK', 'FORANEO', 'Madrina / 18 / 50 / 90', 'ZONA CHIAPAS'),
  ('1258', 'EKT HUIXTLA2 AV CENTRAL', 'CH-8', 2, 'CHIAPAS', 'EKT', 'FORANEO', 'Madrina / 50 / 90', NULL),
  ('1656', 'EKT SAN CRISTOBAL DE LAS CASAS', 'CH-4', 7, 'CHIAPAS', 'EKT', 'FORANEO', 'Madrina / 50 / 90 / 110', 'ZONA CHIAPAS'),
  ('2969', 'EKT COMITAN', 'CH-5', 11, 'CHIAPAS', 'EKT', 'FORANEO', 'Madrina / 50 / 90', 'ZONA CHIAPAS'),
  ('1492', 'EKT TAPACHULA', 'CH-7', 14, 'CHIAPAS', 'EKT', 'FORANEO', 'Madrina / 50 / 90 / 110', NULL),
  ('9661', 'EKT TUXTLA GUTIERREZ CENTRO', 'HUB-TUX', 18, 'CHIAPAS', 'EKT', 'FORANEO', 'Madrina / 50 / 90 / 110', NULL),
  ('6134', 'EKT CHAPA DE CORZO', 'HUB-TUX', 25, 'CHIAPAS', 'EKT', 'FORANEO', 'Madrina / 50 / 90 / 110', 'NO ENVIAR CON 6240-3049-4158-7548'),
  ('3049', 'EKT VILLA FLORES', 'CH-11', 32, 'CHIAPAS', 'EKT', 'FORANEO', 'Madrina / 50 / 90 / 110', 'NO ENVIAR CON 6240-6134'),
  ('6240', 'EKT CINTALAPA', 'CH-2', 39, 'CHIAPAS', 'EKT', 'FORANEO', 'Madrina / 50 / 90', NULL),
  ('8396', 'EKT JUCHITAN 2', 'OAX-2', 1, 'OAXACA', 'EKT', 'FORANEO', 'Kangoo / 18 / 40 / 50', 'NO ENVIAR CON 3803-8403-9684'),
  ('6305', 'EKT MEGA JUCHITAN', 'OAX-2', 2, 'OAXACA', 'MEGA', 'FORANEO', 'Kangoo / 18 / 40 / 50', 'NO ENVIAR CON 3803-8403-9684'),
  ('4774', 'MI EKT CD.IXTEPEC', 'OAX-2', 1, 'OAXACA', 'MINI', 'FORANEO', 'Kangoo / 18 / 40 / 50', NULL),
  ('1750', 'DAZ IXTEPEC', 'OAX-2', 2, 'OAXACA', 'DAZ', 'FORANEO', 'Kangoo / 18 / 40 / 50', NULL),
  ('1978', 'HONDA HUATULCO', 'CAT-OAX-1', 1, 'OAXACA', 'ITK', 'FORANEO', 'Madrina / 18 / 50', 'ZONA OAXACA'),
  ('7306', 'CHEDRAUI HUATULCO', 'CAT-OAX-1', 2, 'OAXACA', 'CE', 'FORANEO', 'Kangoo / 18 / 40 / 50', 'ZONA OAXACA'),
  ('7710', 'EKT MOTOS HUATULCO', 'OAX-4', 3, 'OAXACA', 'EKTM', 'FORANEO', 'Madrina / 18 / 50', 'ZONA OAXACA'),
  ('2207', 'EKT OAXACA HUATULCO TANGOLUNDA', 'OAX-4', 4, 'OAXACA', 'EKT', 'FORANEO', 'Kangoo / 18 / 40 / 50', 'ZONA OAXACA'),
  ('9684', 'MEGA ISTMO SALINA CRUZ', 'OAX-1', 7, 'OAXACA', 'MEGA', 'FORANEO', 'Kangoo / 18 / 40 / 50', NULL),
  ('8403', 'EKT SALINA CRUZ', 'OAX-1', 9, 'OAXACA', 'EKT', 'FORANEO', 'Kangoo / 18 / 40 / 50', NULL),
  ('6204', 'DAZ MATIAS ROMERO', 'OAX-5', 10, 'OAXACA', 'DAZ', 'FORANEO', 'Kangoo / 18 / 40 / 50', NULL),
  ('4239', 'EKT MEGA MATIAS ROMERO', 'OAX-5', 13, 'OAXACA', 'MEGA', 'FORANEO', 'Kangoo / 18 / 40 / 50', NULL),
  ('6431', 'EKT MEGA PUERTO ESCONDIDO', 'OAX-3', 16, 'OAXACA', 'MEGA', 'FORANEO', 'Kangoo / 18 / 40 / 50', 'ZONA OAXACA'),
  ('5067', 'HONDA PUERTO ESCONDIDO', 'CAT-OAX-1', 12, 'OAXACA', 'ITK', 'FORANEO', 'Kangoo / 18 / 40 / 50', 'ZONA OAXACA'),
  ('2242', 'INTER CEDIS CANCUN', 'INTERCEDIS', 1, 'QUINTANA ROO', 'INTERCEDIS', 'FORANEO', '70/110', NULL),
  ('4022', 'INTERCEDIS MÉRIDA', 'MDA-01', 1, 'YUCATAN', 'INTERCEDIS', 'FORANEO', 'Kangoo / 40 / 50 / 90 / 110', NULL),
  ('6040', 'INTER CEDIS TEPOZOTLÁN', 'INTERCEDIS', 1, 'EDO MEX', 'INTERCEDIS', 'FORANEO', '70/110', NULL),
  ('196', 'EKT CAMPECHE ALAMEDA', 'INTERCEDIS', 4, 'CAMPECHE', 'EKT', 'FORANEO', '70/110', 'SE ENVIA CON INTER CEDIS MÉRIDA'),
  ('6398', 'MEGA ELEKTRA AVIACIÓN', 'CAM-1', 50, 'CAMPECHE', 'MEGA', 'FORANEO', '50, 90', NULL),
  ('6761', 'EKT MEGA CD DEL CARMEN', 'CAM-1', 58, 'CAMPECHE', 'MEGA', 'FORANEO', 'Madrina / 18 / 50', 'SOLO ENVIAR CON 1449, 197, 6761'),
  ('197', 'EKT CD DEL CARMEN CENTRO', 'CAM-1', 59, 'CAMPECHE', 'EKT', 'FORANEO', 'Madrina / 18 / 50', 'SOLO ENVIAR CON 1449, 197, 6761'),
  ('1449', 'EKT CD DEL CARMEN', 'CAM-1', 60, 'CAMPECHE', 'EKT', 'FORANEO', 'Madrina / 18 / 50', 'SOLO ENVIAR CON 1449, 197, 6761'),
  ('2209', 'EKT CAMPECHE ESCARCEGA', 'CLUSTER ESCARCEGA', 79, 'CAMPECHE', 'EKT', 'FORANEO', '50, 90', NULL)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  closter = EXCLUDED.closter,
  sec = EXCLUDED.sec,
  region = EXCLUDED.region,
  formato = EXCLUDED.formato,
  fl = EXCLUDED.fl,
  cap_max = EXCLUDED.cap_max,
  restriccion = EXCLUDED.restriccion;

-- VIAJES DIARIOS INICIALES (CONFIGURACIÓN DEMO REPRESENTATIVA)
INSERT INTO public.viajes_diarios (id, no_viaje, economico, bloque, placas, cap_unidad, linea, tipo, operador, id_operador, turno, cortina, num_carga, num_sucursal, sucursal_origen, destino, closter, fl, cap_max, fecha, hora_salida, tiempo_estimado_hrs, eta, estatus_patio, estatus_planeacion, estatus_supervisor, observaciones, actualizado_en) VALUES
  ('baz-unit-3393', 'V-001', '3393', 1, 'GT3465C', 18, 'LTI - VHS', 'Camioneta', 'ANTONIO PEREZ PALMA', '1129366', 'M1', '51', 'CS00390172', '4860', 'CEDIS VILLAHERMOSA', 'MEGA COMALCALCO', 'CLUSTER COMALCALCO', 'LOCAL', '18 m³', '2026-09-12', '07:30', 2, '09:30', 'Cargado', 'EN CASETA', 'En Ruta', 'En ruta sobre carretera Cárdenas-Comalcalco sin novedades', '07:35'),
  ('baz-unit-4135', 'V-002', '4135', 2, '11FA5G', 50, 'LTI - VHS', 'Rango Medio', 'ANDERSON LUISAO HERNANDEZ GARCIA', '1080013', 'M1', '18', 'CS00390170', '5173', 'CEDIS VILLAHERMOSA', 'EKT CUNDUACAN', 'CLUSTER CUNDUACAN', 'LOCAL', '50 m³', '2026-09-12', '09:00', 1.5, '10:30', 'Colocado p/ Carga', 'COLOCADO', 'Pendiente', 'Unidad colocada en rampa 18, montacargas cargando tarimas', '08:15'),
  ('baz-unit-3401', 'V-003', '3401', 3, 'RU5464B', 18, 'LTI - VHS', 'Camioneta', 'ISAI GARCIA VALENCIA', '1080046', 'M2', '22', 'CS00390175', '9757', 'CEDIS VILLAHERMOSA', 'MEGA JALPA DE MENDEZ', 'CLUSTER JALPA', 'LOCAL', '18 m³', '2026-09-12', '11:00', 2, '13:00', 'Disponible', 'PENDIENTE', 'Pendiente', 'Viaje programado para bloque 3, en espera de armado de carga', '08:45'),
  ('baz-unit-4069', 'V-004', '4069', 2, '175FF5', 50, 'LTI - VHS', 'Rango Medio', 'JUAN CARLOS GARCIA GARCIA', '1080003', 'M1', '21', 'CS00390166', '9685', 'CEDIS VILLAHERMOSA', 'MEGA ELEKTRA PLAZA FLORIDA', 'V-2', 'FORANEO', '50 m³', '2026-09-12', '06:00', 4.5, '10:30', 'Cargado', 'EN CASETA', 'Espera Descarga', 'Arribó a tienda 10:15, en espera de liberación de rampa', '10:18'),
  ('baz-unit-4160', 'V-005', '4160', 2, '41FA4J', 50, 'LTI - VHS', 'Rango Medio', 'URIEL SILVA PEREZ', '1080017', 'M1', '19', 'CS00390165', '2971', 'CEDIS VILLAHERMOSA', 'SYR MINATITLAN', 'V-5', 'LOCAL', '50 m³', '2026-09-12', '06:30', 3.5, '10:00', 'Cargado', 'EN CASETA', 'Descargando', 'Descarga al 60%, recibiendo línea blanca y electrónica', '10:25'),
  ('baz-unit-5035', 'V-006', '5035', 1, '73FA3F', 110, 'LTI - VHS', 'Tracto / Full', 'ADRIAN IZQUIERDO ZAVALA', '1090003', 'M1', '16', 'CS00390186', '1656', 'CEDIS VILLAHERMOSA', 'EKT SAN CRISTOBAL DE LAS CASAS', 'CH-4', 'FORANEO', '110 m³', '2026-09-12', '05:00', 5, '12:00', 'Cargado', 'EN CASETA', 'Retrasado', 'Avanzando a baja velocidad con reporte a mesa de control cada 30 min', '09:40'),
  ('baz-unit-5026', 'V-007', '5026', 1, '28FA8W', 110, 'LTI - VHS', 'Tracto / Full', 'CONCEPCION ARIAS VELAZQUEZ', '1090002', 'M1', '15', 'CS00390185', '4022', 'INTERCEDIS MÉRIDA', 'CEDIS VILLAHERMOSA (Retorno)', 'MDA-01', 'FORANEO', '110 m³', '2026-09-12', '07:00', 6.5, '13:30', 'Disponible', 'EN CASETA', 'Retorno', 'Descarga concluida en Mérida, retornando vacío a CEDIS Villahermosa', '10:10'),
  ('baz-unit-3237', '', '3237', 1, 'LE17349', 18, 'LTI - VHS', 'Camioneta', 'NESTOR ANDRES HERNANDEZ PEREZ', '1198687', 'M1', 'Cajón 04', '', '', 'CEDIS VILLAHERMOSA', 'Disponible en Patio', 'LOCAL TABASCO', 'LOCAL', '18 m³', '2026-09-12', '', 0, '', 'Disponible', 'PENDIENTE', 'Pendiente', 'Unidad revisada con tanque lleno, lista para asignación de ruta', '08:00'),
  ('baz-unit-3153', '', '3153', 1, 'CV4372F', 18, 'LTI - VHS', 'Camioneta', 'JUAN BACHO IZQUIERDO', '1061741', 'M1', 'Taller 1', '', '', 'CEDIS VILLAHERMOSA', 'Taller Mecánico CEDIS', 'CEDIS', 'LOCAL', '18 m³', '2026-09-12', '', 0, '', 'Taller', 'PENDIENTE', 'No Disponible', 'Mantenimiento correctivo de frenos y revisión de suspensión', '07:00')
ON CONFLICT (id) DO NOTHING;
