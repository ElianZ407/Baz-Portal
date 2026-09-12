// Catálogo Maestro de Sucursales, Clústeres y Restricciones Logísticas
// Extraído de la Matriz Operativa de CD Villahermosa (BAZ Entregas)

export const SUCURSALES_MAESTRAS = [
  // TABASCO / CLÚSTERES LOCALES
  { id: "6208", nombre: "EKT VILLAHERMOSA 2 MADERO", closter: "HUB-VHSA", sec: 1, region: "TABASCO", formato: "EKT", fl: "LOCAL", capMax: "18", restriccion: "HUB LOCAL" },
  { id: "6018", nombre: "EKT LA VENTA TABASCO", closter: "TAB-1", sec: 1, region: "TABASCO", formato: "EKT", fl: "LOCAL", capMax: "Madrina / 50", restriccion: null },
  { id: "203", nombre: "BAJAJ VILLAHERMOSA", closter: "HUB-VHSA", sec: 2, region: "TABASCO", formato: "ITK", fl: "LOCAL", capMax: "18", restriccion: null },
  { id: "1988", nombre: "HONDA VILLAHERMOSA", closter: "HUB-VHSA", sec: 3, region: "TABASCO", formato: "ITK", fl: "LOCAL", capMax: "18", restriccion: null },
  { id: "2206", nombre: "EKT VILLAHERMOSA PLAZA CRYSTAL", closter: "HUB-VHSA", sec: 4, region: "TABASCO", formato: "EKT", fl: "LOCAL", capMax: "18", restriccion: null },
  { id: "4750", nombre: "MEGA VILLAHERMOSA", closter: "HUB-VHSA", sec: 21, region: "TABASCO", formato: "MEGA", fl: "LOCAL", capMax: "18", restriccion: null },
  { id: "7414", nombre: "MEGA MACUSPANA", closter: "CLUSTER MACUSPANA", sec: 22, region: "TABASCO", formato: "MEGA", fl: "LOCAL", capMax: "18, 50", restriccion: "TRASPALEO" },
  { id: "8267", nombre: "EKT MACUSPANA", closter: "CLUSTER MACUSPANA", sec: 23, region: "TABASCO", formato: "EKT", fl: "LOCAL", capMax: "18, 50", restriccion: null },
  { id: "6542", nombre: "EKT TEAPA", closter: "CLUSTER TEAPA", sec: 25, region: "TABASCO", formato: "EKT", fl: "LOCAL", capMax: "18", restriccion: null },
  { id: "4720", nombre: "DAZ PP JALAPA TABASCO", closter: "CLUSTER TEAPA", sec: 28, region: "TABASCO", formato: "DAZ", fl: "LOCAL", capMax: "18", restriccion: null },
  { id: "4860", nombre: "MEGA COMALCALCO", closter: "CLUSTER COMALCALCO", sec: 29, region: "TABASCO", formato: "MEGA", fl: "LOCAL", capMax: "18", restriccion: null },
  { id: "6460", nombre: "ELEKTRA MOTOS COMALCALCO", closter: "CLUSTER COMALCALCO", sec: 31, region: "TABASCO", formato: "EKTM", fl: "LOCAL", capMax: "18", restriccion: null },
  { id: "9912", nombre: "DIST PROP ITALIKA COMALCALCO", closter: "CLUSTER COMALCALCO", sec: 32, region: "TABASCO", formato: "ITK", fl: "LOCAL", capMax: "18", restriccion: null },
  { id: "5173", nombre: "EKT CUNDUACAN", closter: "CLUSTER CUNDUACAN", sec: 33, region: "TABASCO", formato: "EKT", fl: "LOCAL", capMax: "18", restriccion: null },
  { id: "4489", nombre: "DIST PROP ITALIKA CUNDUACAN", closter: "CLUSTER CUNDUACAN", sec: 35, region: "TABASCO", formato: "ITK", fl: "LOCAL", capMax: "18", restriccion: null },
  { id: "2968", nombre: "SYR CARDENAS", closter: "CLUSTER CARDENAS", sec: 34, region: "TABASCO", formato: "SYR", fl: "LOCAL", capMax: "18", restriccion: null },
  { id: "191", nombre: "EKT CARDENAS BANDALA", closter: "CLUSTER CARDENAS", sec: 36, region: "TABASCO", formato: "EKT", fl: "LOCAL", capMax: "18", restriccion: null },
  { id: "2590", nombre: "MEGA CARDENAS", closter: "CLUSTER CARDENAS", sec: 37, region: "TABASCO", formato: "MEGA", fl: "LOCAL", capMax: "18", restriccion: null },
  { id: "9757", nombre: "MEGA JALPA DE MENDEZ", closter: "CLUSTER JALPA", sec: 41, region: "TABASCO", formato: "MEGA", fl: "LOCAL", capMax: "18", restriccion: null },
  { id: "5771", nombre: "DAZ PP NACAJUCA TABASCO", closter: "CLUSTER JALPA", sec: 40, region: "TABASCO", formato: "DAZ", fl: "LOCAL", capMax: "18", restriccion: null },
  { id: "192", nombre: "EKT COMALCALCO JUAREZ", closter: "CLUSTER COMALCALCO", sec: 44, region: "TABASCO", formato: "EKT", fl: "LOCAL", capMax: "18", restriccion: null },
  { id: "2963", nombre: "SYR COMALCALCO", closter: "CLUSTER COMALCALCO", sec: 45, region: "TABASCO", formato: "SYR", fl: "LOCAL", capMax: "18", restriccion: null },
  { id: "6025", nombre: "EKT FRONTERA TABASCO", closter: "CLUSTER FRONTERA", sec: 48, region: "TABASCO", formato: "EKT", fl: "LOCAL", capMax: "18", restriccion: null },
  { id: "5061", nombre: "DAZ PP FRONTERA MADERO", closter: "CLUSTER FRONTERA", sec: 49, region: "TABASCO", formato: "DAZ", fl: "LOCAL", capMax: "18", restriccion: null },
  { id: "6381", nombre: "EKT PARAISO TABASCO", closter: "HUB-VHSA", sec: 54, region: "TABASCO", formato: "EKT", fl: "LOCAL", capMax: "18", restriccion: null },
  { id: "7540", nombre: "MEGA HUIMANGUILLO", closter: "CLUSTER HUIMANGUILLO", sec: 55, region: "TABASCO", formato: "MEGA", fl: "LOCAL", capMax: "18", restriccion: null },
  { id: "2190", nombre: "DIST PROP ITALIKA HUIMANGUILLO", closter: "CLUSTER HUIMANGUILLO", sec: 56, region: "TABASCO", formato: "ITK", fl: "LOCAL", capMax: "18", restriccion: null },
  { id: "3259", nombre: "Ekt Motos Tecolutilla", closter: "CLUSTER COMALCALCO", sec: 85, region: "TABASCO", formato: "EKTM", fl: "LOCAL", capMax: "18", restriccion: null },
  { id: "2944", nombre: "Ekt Motos Teapa", closter: "CLUSTER TEAPA", sec: 86, region: "TABASCO", formato: "EKTM", fl: "LOCAL", capMax: "18", restriccion: null },

  // VERACRUZ (ZONAS V-1 A V-5)
  { id: "6015", nombre: "EKT AGUA DULCE", closter: "V-1", sec: 2, region: "VERACRUZ", formato: "EKT", fl: "LOCAL", capMax: "Kangoo / 18 / 40 / 50", restriccion: null },
  { id: "8981", nombre: "EKT DAZ AGUADULCE VERACRUZ", closter: "V-1", sec: 3, region: "VERACRUZ", formato: "DAZ", fl: "LOCAL", capMax: "Kangoo / 18", restriccion: null },
  { id: "1294", nombre: "EKT LAS CHOAPAS", closter: "V-1", sec: 5, region: "VERACRUZ", formato: "EKT", fl: "FORANEO", capMax: "Kangoo / 18 / 40 / 50", restriccion: null },
  { id: "1865", nombre: "DISTRIBUIDOR SAYULA DE ALEMANIA", closter: "V-2", sec: 1, region: "VERACRUZ", formato: "ITK", fl: "FORANEO", capMax: "Kangoo / 18 / 40 / 50", restriccion: "ZONA VERACRUZ" },
  { id: "2588", nombre: "DISTRIBUIDOR ITALIKA SAYULA DE ALEMAN", closter: "V-2", sec: 2, region: "VERACRUZ", formato: "ITK", fl: "FORANEO", capMax: "Kangoo / 18 / 40 / 50", restriccion: "ZONA VERACRUZ" },
  { id: "942", nombre: "DISTRIBUIDOR ITALIKA ACAYUCAN", closter: "V-2", sec: 3, region: "VERACRUZ", formato: "ITK", fl: "FORANEO", capMax: "Madrina / 18 / 50", restriccion: null },
  { id: "3001", nombre: "Ekt Motos Acayucan", closter: "V-2", sec: 4, region: "VERACRUZ", formato: "EKTM", fl: "FORANEO", capMax: "Kangoo / 18 / 40 / 50", restriccion: null },
  { id: "7809", nombre: "EKT ACAYUCAN VERACRUZ", closter: "V-2", sec: 5, region: "VERACRUZ", formato: "EKT", fl: "FORANEO", capMax: "Kangoo / 18 / 40 / 50", restriccion: null },
  { id: "9685", nombre: "MEGA ELEKTRA PLAZA FLORIDA", closter: "V-2", sec: 6, region: "VERACRUZ", formato: "MEGA", fl: "FORANEO", capMax: "Kangoo / 18 / 40 / 50", restriccion: null },
  { id: "3422", nombre: "APA DEK TEXISTEPEC VERACRUZ", closter: "V-2", sec: 7, region: "VERACRUZ", formato: "APA", fl: "FORANEO", capMax: "Kangoo / 18 / 40 / 50", restriccion: null },
  { id: "2804", nombre: "EKT COATZACOALCOS2 JUAREZ", closter: "V-3", sec: 1, region: "VERACRUZ", formato: "EKT", fl: "LOCAL", capMax: "Kangoo / 18 / 40 / 50", restriccion: null },
  { id: "3156", nombre: "SYR COATZACOALCOS", closter: "V-3", sec: 2, region: "VERACRUZ", formato: "SYR", fl: "LOCAL", capMax: "Kangoo / 18 / 40 / 50", restriccion: null },
  { id: "6703", nombre: "EKT MEGA COATZACOALCOS", closter: "V-3", sec: 3, region: "VERACRUZ", formato: "MEGA", fl: "LOCAL", capMax: "Kangoo / 18 / 40 / 50", restriccion: null },
  { id: "9180", nombre: "DAZ PALMA SOLA", closter: "V-3", sec: 3, region: "VERACRUZ", formato: "DAZ", fl: "LOCAL", capMax: "Kangoo / 18 / 40 / 50", restriccion: null },
  { id: "209", nombre: "EKT COATZACOALCOS UNIVERSIDAD", closter: "V-3", sec: 4, region: "VERACRUZ", formato: "EKT", fl: "LOCAL", capMax: "Kangoo / 18 / 40 / 50", restriccion: null },
  { id: "9391", nombre: "EKT MOTOS COATZACOALCOS 2 JUAR", closter: "V-3", sec: 5, region: "VERACRUZ", formato: "EKTM", fl: "LOCAL", capMax: "Kangoo / 18 / 40 / 50", restriccion: null },
  { id: "8511", nombre: "DAZ NANCHITAL VERACRUZ", closter: "V-3", sec: 8, region: "VERACRUZ", formato: "DAZ", fl: "LOCAL", capMax: "Kangoo / 18 / 40 / 50", restriccion: null },
  { id: "9855", nombre: "DAZ FCO I MADERO CATEMACO", closter: "V-4", sec: 1, region: "VERACRUZ", formato: "DAZ", fl: "FORANEO", capMax: "Kangoo / 18", restriccion: "ZONA VERACRUZ" },
  { id: "8673", nombre: "DAZ SANTIAGO TUXTLA", closter: "V-4", sec: 2, region: "VERACRUZ", formato: "DAZ", fl: "FORANEO", capMax: "Kangoo / 18", restriccion: "ZONA VERACRUZ" },
  { id: "927", nombre: "DISTRIBUIDOR ITALIKA SAN ANDRES TUXTLA", closter: "V-4", sec: 4, region: "VERACRUZ", formato: "ITK", fl: "FORANEO", capMax: "Kangoo / 18", restriccion: "ZONA VERACRUZ" },
  { id: "8372", nombre: "MI EKT SAN ANDRES TUXTLA", closter: "V-4", sec: 8, region: "VERACRUZ", formato: "MINI", fl: "FORANEO", capMax: "Kangoo / 18", restriccion: "ZONA VERACRUZ" },
  { id: "1606", nombre: "EKT MOTOS SAN ANDRÉS TUXTLA", closter: "V-4", sec: 6, region: "VERACRUZ", formato: "EKTM", fl: "FORANEO", capMax: "Kangoo / 18", restriccion: "ZONA VERACRUZ" },
  { id: "5678", nombre: "EKT MEGA SAN ANDRES TUXTLA", closter: "V-4", sec: 7, region: "VERACRUZ", formato: "MEGA", fl: "FORANEO", capMax: "Kangoo / 18", restriccion: "ZONA VERACRUZ" },
  { id: "2971", nombre: "SYR MINATITLAN", closter: "V-5", sec: 11, region: "VERACRUZ", formato: "SYR", fl: "LOCAL", capMax: "Kangoo / 18 / 40 / 50", restriccion: "SOLO ENVIAR CON 2971-2707-190-5512-7269" },
  { id: "190", nombre: "EKT MINATITLAN HIDALGO", closter: "V-5", sec: 10, region: "VERACRUZ", formato: "EKT", fl: "LOCAL", capMax: "Madrina / 18 / 50", restriccion: "SOLO ENVIAR CON 2971-2707-190-5512-7269" },
  { id: "2707", nombre: "EKT MINATITLAN", closter: "V-5", sec: 12, region: "VERACRUZ", formato: "EKT", fl: "LOCAL", capMax: "Kangoo / 18 / 40 / 50", restriccion: "SOLO ENVIAR CON 2971-2707-190-5512-7269" },
  { id: "5512", nombre: "ITK DISTRIBUIDOR MINATITLAN", closter: "V-5", sec: 9, region: "VERACRUZ", formato: "ITK", fl: "LOCAL", capMax: "Kangoo / 18 / 40 / 50", restriccion: "SOLO ENVIAR CON 2971-2707-190-5512-7269" },
  { id: "7269", nombre: "DISTRIBUIDOR ITALIKA MINATITLAN", closter: "V-5", sec: 13, region: "VERACRUZ", formato: "ITK", fl: "LOCAL", capMax: "Kangoo / 18 / 40 / 50", restriccion: "SOLO ENVIAR CON 2971-2707-190-5512-7269" },
  { id: "9966", nombre: "MEGA ELEKTRA TRANSISMICA JALTI", closter: "V-5", sec: 18, region: "VERACRUZ", formato: "MEGA", fl: "LOCAL", capMax: "Kangoo / 18 / 40 / 50", restriccion: null },
  { id: "8689", nombre: "DAZ COSOLEACAQUE", closter: "V-5", sec: 16, region: "VERACRUZ", formato: "DAZ", fl: "LOCAL", capMax: "Kangoo / 18 / 40 / 50", restriccion: null },

  // CHIAPAS (ZONAS CH-1 A CH-12, HUB-TUX)
  { id: "7203", nombre: "CHEDRAUI SAN CRISTOBAL", closter: "CAT-CH-1", sec: 1, region: "CHIAPAS", formato: "CE", fl: "FORANEO", capMax: "Kangoo / 18 / 40 / 50", restriccion: "ZONA CHIAPAS" },
  { id: "1265", nombre: "APA BOCHIL", closter: "HUB-TUX", sec: 1, region: "CHIAPAS", formato: "APA", fl: "FORANEO", capMax: "Kangoo / 18 / 40 / 50", restriccion: null },
  { id: "9464", nombre: "EKT MEGA V CARRANZA CHIAPAS", closter: "CH-5", sec: 1, region: "CHIAPAS", formato: "MEGA", fl: "FORANEO", capMax: "50 / 90", restriccion: "NO ENVIAR CON 2057-143-449" },
  { id: "8651", nombre: "EKT ARRIAGA", closter: "CH-10", sec: 1, region: "CHIAPAS", formato: "EKT", fl: "FORANEO", capMax: "50 / 90", restriccion: null },
  { id: "2486", nombre: "DISTRIBUIDOR ITALIKA HUIXTLA", closter: "CH-8", sec: 1, region: "CHIAPAS", formato: "ITK", fl: "FORANEO", capMax: "Madrina / 50 / 90", restriccion: null },
  { id: "4689", nombre: "PRESTA PRENDA SAN C DE LAS CASAS 2", closter: "CAT-CH-1", sec: 2, region: "CHIAPAS", formato: "PP", fl: "FORANEO", capMax: "Kangoo / 18 / 40 / 50", restriccion: "ZONA CHIAPAS" },
  { id: "2077", nombre: "EKT CHIAPAS OCOSINGO", closter: "CH-6", sec: 2, region: "CHIAPAS", formato: "EKT", fl: "FORANEO", capMax: "Kangoo / 18 / 50", restriccion: "SE ENVIA DIRECTO" },
  { id: "8999", nombre: "DAZ SIMOJOVEL", closter: "HUB-TUX", sec: 2, region: "CHIAPAS", formato: "DAZ", fl: "FORANEO", capMax: "Kangoo / 18 / 40 / 50", restriccion: null },
  { id: "419", nombre: "DISTRIBUIDOR ITALIKA TONALA CHIAPAS", closter: "CH-10", sec: 2, region: "CHIAPAS", formato: "ITK", fl: "FORANEO", capMax: "Madrina / 18 / 50 / 90", restriccion: "ZONA CHIAPAS" },
  { id: "1258", nombre: "EKT HUIXTLA2 AV CENTRAL", closter: "CH-8", sec: 2, region: "CHIAPAS", formato: "EKT", fl: "FORANEO", capMax: "Madrina / 50 / 90", restriccion: null },
  { id: "1656", nombre: "EKT SAN CRISTOBAL DE LAS CASAS", closter: "CH-4", sec: 7, region: "CHIAPAS", formato: "EKT", fl: "FORANEO", capMax: "Madrina / 50 / 90 / 110", restriccion: "ZONA CHIAPAS" },
  { id: "2969", nombre: "EKT COMITAN", closter: "CH-5", sec: 11, region: "CHIAPAS", formato: "EKT", fl: "FORANEO", capMax: "Madrina / 50 / 90", restriccion: "ZONA CHIAPAS" },
  { id: "1492", nombre: "EKT TAPACHULA", closter: "CH-7", sec: 14, region: "CHIAPAS", formato: "EKT", fl: "FORANEO", capMax: "Madrina / 50 / 90 / 110", restriccion: null },
  { id: "9661", nombre: "EKT TUXTLA GUTIERREZ CENTRO", closter: "HUB-TUX", sec: 18, region: "CHIAPAS", formato: "EKT", fl: "FORANEO", capMax: "Madrina / 50 / 90 / 110", restriccion: null },
  { id: "6134", nombre: "EKT CHAPA DE CORZO", closter: "HUB-TUX", sec: 25, region: "CHIAPAS", formato: "EKT", fl: "FORANEO", capMax: "Madrina / 50 / 90 / 110", restriccion: "NO ENVIAR CON 6240-3049-4158-7548" },
  { id: "3049", nombre: "EKT VILLA FLORES", closter: "CH-11", sec: 32, region: "CHIAPAS", formato: "EKT", fl: "FORANEO", capMax: "Madrina / 50 / 90 / 110", restriccion: "NO ENVIAR CON 6240-6134" },
  { id: "6240", nombre: "EKT CINTALAPA", closter: "CH-2", sec: 39, region: "CHIAPAS", formato: "EKT", fl: "FORANEO", capMax: "Madrina / 50 / 90", restriccion: null },

  // OAXACA (ZONAS OAX-1 A OAX-5)
  { id: "8396", nombre: "EKT JUCHITAN 2", closter: "OAX-2", sec: 1, region: "OAXACA", formato: "EKT", fl: "FORANEO", capMax: "Kangoo / 18 / 40 / 50", restriccion: "NO ENVIAR CON 3803-8403-9684" },
  { id: "6305", nombre: "EKT MEGA JUCHITAN", closter: "OAX-2", sec: 2, region: "OAXACA", formato: "MEGA", fl: "FORANEO", capMax: "Kangoo / 18 / 40 / 50", restriccion: "NO ENVIAR CON 3803-8403-9684" },
  { id: "4774", nombre: "MI EKT CD.IXTEPEC", closter: "OAX-2", sec: 1, region: "OAXACA", formato: "MINI", fl: "FORANEO", capMax: "Kangoo / 18 / 40 / 50", restriccion: null },
  { id: "1750", nombre: "DAZ IXTEPEC", closter: "OAX-2", sec: 2, region: "OAXACA", formato: "DAZ", fl: "FORANEO", capMax: "Kangoo / 18 / 40 / 50", restriccion: null },
  { id: "1978", nombre: "HONDA HUATULCO", closter: "CAT-OAX-1", sec: 1, region: "OAXACA", formato: "ITK", fl: "FORANEO", capMax: "Madrina / 18 / 50", restriccion: "ZONA OAXACA" },
  { id: "7306", nombre: "CHEDRAUI HUATULCO", closter: "CAT-OAX-1", sec: 2, region: "OAXACA", formato: "CE", fl: "FORANEO", capMax: "Kangoo / 18 / 40 / 50", restriccion: "ZONA OAXACA" },
  { id: "7710", nombre: "EKT MOTOS HUATULCO", closter: "OAX-4", sec: 3, region: "OAXACA", formato: "EKTM", fl: "FORANEO", capMax: "Madrina / 18 / 50", restriccion: "ZONA OAXACA" },
  { id: "2207", nombre: "EKT OAXACA HUATULCO TANGOLUNDA", closter: "OAX-4", sec: 4, region: "OAXACA", formato: "EKT", fl: "FORANEO", capMax: "Kangoo / 18 / 40 / 50", restriccion: "ZONA OAXACA" },
  { id: "9684", nombre: "MEGA ISTMO SALINA CRUZ", closter: "OAX-1", sec: 7, region: "OAXACA", formato: "MEGA", fl: "FORANEO", capMax: "Kangoo / 18 / 40 / 50", restriccion: null },
  { id: "8403", nombre: "EKT SALINA CRUZ", closter: "OAX-1", sec: 9, region: "OAXACA", formato: "EKT", fl: "FORANEO", capMax: "Kangoo / 18 / 40 / 50", restriccion: null },
  { id: "6204", nombre: "DAZ MATIAS ROMERO", closter: "OAX-5", sec: 10, region: "OAXACA", formato: "DAZ", fl: "FORANEO", capMax: "Kangoo / 18 / 40 / 50", restriccion: null },
  { id: "4239", nombre: "EKT MEGA MATIAS ROMERO", closter: "OAX-5", sec: 13, region: "OAXACA", formato: "MEGA", fl: "FORANEO", capMax: "Kangoo / 18 / 40 / 50", restriccion: null },
  { id: "6431", nombre: "EKT MEGA PUERTO ESCONDIDO", closter: "OAX-3", sec: 16, region: "OAXACA", formato: "MEGA", fl: "FORANEO", capMax: "Kangoo / 18 / 40 / 50", restriccion: "ZONA OAXACA" },
  { id: "5067", nombre: "HONDA PUERTO ESCONDIDO", closter: "CAT-OAX-1", sec: 12, region: "OAXACA", formato: "ITK", fl: "FORANEO", capMax: "Kangoo / 18 / 40 / 50", restriccion: "ZONA OAXACA" },

  // INTERCEDIS Y PENÍNSULA
  { id: "2242", nombre: "INTER CEDIS CANCUN", closter: "INTERCEDIS", sec: 1, region: "QUINTANA ROO", formato: "INTERCEDIS", fl: "FORANEO", capMax: "70/110", restriccion: null },
  { id: "4022", nombre: "INTERCEDIS MÉRIDA", closter: "MDA-01", sec: 1, region: "YUCATAN", formato: "INTERCEDIS", fl: "FORANEO", capMax: "Kangoo / 40 / 50 / 90 / 110", restriccion: null },
  { id: "6040", nombre: "INTER CEDIS TEPOZOTLÁN", closter: "INTERCEDIS", sec: 1, region: "EDO MEX", formato: "INTERCEDIS", fl: "FORANEO", capMax: "70/110", restriccion: null },
  { id: "196", nombre: "EKT CAMPECHE ALAMEDA", closter: "INTERCEDIS", sec: 4, region: "CAMPECHE", formato: "EKT", fl: "FORANEO", capMax: "70/110", restriccion: "SE ENVIA CON INTER CEDIS MÉRIDA" },
  { id: "6398", nombre: "MEGA ELEKTRA AVIACIÓN", closter: "CAM-1", sec: 50, region: "CAMPECHE", formato: "MEGA", fl: "FORANEO", capMax: "50, 90", restriccion: null },
  { id: "6761", nombre: "EKT MEGA CD DEL CARMEN", closter: "CAM-1", sec: 58, region: "CAMPECHE", formato: "MEGA", fl: "FORANEO", capMax: "Madrina / 18 / 50", restriccion: "SOLO ENVIAR CON 1449, 197, 6761" },
  { id: "197", nombre: "EKT CD DEL CARMEN CENTRO", closter: "CAM-1", sec: 59, region: "CAMPECHE", formato: "EKT", fl: "FORANEO", capMax: "Madrina / 18 / 50", restriccion: "SOLO ENVIAR CON 1449, 197, 6761" },
  { id: "1449", nombre: "EKT CD DEL CARMEN", closter: "CAM-1", sec: 60, region: "CAMPECHE", formato: "EKT", fl: "FORANEO", capMax: "Madrina / 18 / 50", restriccion: "SOLO ENVIAR CON 1449, 197, 6761" },
  { id: "2209", nombre: "EKT CAMPECHE ESCARCEGA", closter: "CLUSTER ESCARCEGA", sec: 79, region: "CAMPECHE", formato: "EKT", fl: "FORANEO", capMax: "50, 90", restriccion: null }
];

// Función para buscar una sucursal por ID o nombre
export const buscarSucursal = (query) => {
  if (!query) return null;
  const q = String(query).toLowerCase().trim();
  return SUCURSALES_MAESTRAS.find(s => 
    s.id === q || 
    s.nombre.toLowerCase().includes(q)
  );
};

// Validador de Restricciones Operativas
export const validarRestriccionesViaje = (sucursalesList, capUnidad) => {
  const alertas = [];
  const sucursales = sucursalesList
    .map(item => typeof item === 'string' ? buscarSucursal(item) : buscarSucursal(item.id || item.num))
    .filter(Boolean);

  // 1. Validar Capacidad Máxima Vehicular
  sucursales.forEach(s => {
    if (s.capMax === "18" || s.capMax === "Kangoo / 18") {
      if (capUnidad > 18) {
        alertas.push(`Sucursal ${s.id} (${s.nombre}) tiene restricción de acceso: Solo admite unidades Kangoo / 18 (Cap. asignada: ${capUnidad})`);
      }
    }
  });

  // 2. Validar Restricciones de Incompatibilidad
  const ids = sucursales.map(s => s.id);
  
  if (ids.includes("9464") && ids.some(id => ["2057", "143", "449"].includes(id))) {
    alertas.push("Restricción en Carranza: Sucursal 9464 NO debe enviarse combinada con 2057, 143 o 449");
  }

  if (ids.some(id => ["8396", "6305"].includes(id)) && ids.some(id => ["3803", "8403", "9684"].includes(id))) {
    alertas.push("Restricción en Juchitán: No debe enviarse combinada con 3803, 8403 o 9684");
  }

  if (ids.includes("6134") && ids.some(id => ["6240", "3049", "4158", "7548"].includes(id))) {
    alertas.push("Restricción en Chiapa de Corzo (6134): No enviar con 6240, 3049, 4158 o 7548");
  }

  if (ids.includes("3049") && ids.some(id => ["6240", "6134"].includes(id))) {
    alertas.push("Restricción en Villaflores (3049): No enviar con 6240 o 6134");
  }

  return alertas;
};
