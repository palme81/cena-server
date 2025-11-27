// Historial de palabras usadas en la sesión actual
let usedKeywords = [];

// Reinicia el historial (puedes llamar a esta función al iniciar una nueva sesión)
function resetUsedKeywords() {
  usedKeywords = [];
}

// Obtiene una palabra secreta minimizando repeticiones
function generateKeyword() {
  const keywords = Object.keys(KEYWORD_POOL);
  const unusedKeywords = keywords.filter(k => !usedKeywords.includes(k));
  let selected;
  if (unusedKeywords.length > 0) {
    selected = unusedKeywords[Math.floor(Math.random() * unusedKeywords.length)];
  } else {
    // Si todas han sido usadas, reinicia historial y selecciona aleatoriamente
    usedKeywords = [];
    selected = keywords[Math.floor(Math.random() * keywords.length)];
  }
  usedKeywords.push(selected);
  return selected;
}
// Definición de roles
const ROLES = {
  ASESINO: 'ASESINO',
  SABOTEADOR: 'SABOTEADOR',
  INVITADO: 'INVITADO',
  PROTECTOR: 'PROTECTOR',
  MEDICO: 'MEDICO',
  DETECTIVE: 'DETECTIVE',
  LADRON: 'LADRON',
  SABIO: 'SABIO',
  VIDENTE: 'VIDENTE',
  DIPLOMATICO: 'DIPLOMATICO',
  SOMBRA: 'SOMBRA'
};

// Fases del juego
const GAME_PHASES = {
  INTRO: 'INTRO',
  SETUP: 'SETUP',
  ROLE_REVEAL_SPLASH: 'ROLE_REVEAL_SPLASH',
  ROLE_REVEAL: 'ROLE_REVEAL',
  DAY: 'DAY',
  LEADER_VOTE: 'LEADER_VOTE',
  WORD_GUESS: 'WORD_GUESS',
  ELIMINATION_VOTE: 'ELIMINATION_VOTE',
  NIGHT: 'NIGHT',
  GAME_OVER: 'GAME_OVER'
};

// Información de roles
const ROLE_INFO = {
  [ROLES.SOMBRA]: {
    name: 'Sombra',
  symbol: '☁',
    description: 'Has sido eliminado y ahora eres una triste Sombra. Perdiste tus habilidades. Pero tu bando no cambió.',
    team: 'NEUTRAL',
    ability: 'En el debate debes decir a todos cual es tu fragmento. Sigue ayudando a tú bando.',
    color: '#666'
  },
  [ROLES.ASESINO]: {
    name: 'Infiltrado',
  symbol: '☠',
    description: '¡Ya sabes que te ha tocado!. Tu objetivo es eliminar a todos los invitados sin ser descubierto.',
    team: 'MALVADO',
    ability: 'Si pasas dos noches seguidas sin asesinar, la tercera noche podrás reclutar a un jugador como Saboteador (una vez por partida). Si eres líder y se acierta la palabra, los MALVADOS ganan inmediatamente. ',
    color: '#8B0000'
  },
  [ROLES.SABOTEADOR]: {
    name: 'Saboteador',
  symbol: '☭',
    description: 'Has sido convertido por el Infiltrado. Ahora perteneces al bando del MAL.',
    team: 'MALVADO', 
    ability: 'Ahora perteneces al bando del MAL. Puedes denegarle su Fragmento a otro jugador. CUIDADO! Si eres líder y se acierta la Palabra Secreta, mueres.',
    color: '#8B0000'
  },
  [ROLES.INVITADO]: {
    name: 'Invitado',
  symbol: '⚵',
    description: 'Eres un invitado normal en esta misteriosa cena. Durante el día recibes fragmentos de la Palabra Secreta. Colabora para descubrir la verdad.',
    team: 'PUEBLO',
      ability: 'Sin habilidad nocturna. Durante el día recibes fragmentos de la Palabra Secreta para ayudar a adivinarla.',
    color: '#e94560'
  },
  [ROLES.PROTECTOR]: {
    name: 'Protector',
    symbol: '🛡',
    description: 'Tu deber es salvaguardar a los inocentes del peligro que acecha en las sombras.',
    team: 'PUEBLO',
    ability: 'Cuando se adivina la palabra secreta: Esa noche proteges a un jugador de ser asesinado.',
    color: '#e94560'
  },
  [ROLES.MEDICO]: {
    name: 'Médico',
    symbol: '⚕',
    description: 'Posees el conocimiento para devolver la vida a quien la ha perdido.',
    team: 'PUEBLO',
    ability: 'Si eres Líder y aciertas la Palabra Secreta: Una vez por partida eliges a un jugador muerto para devolverlo a la vida.',
    color: '#e94560'
  },
  [ROLES.DETECTIVE]: {
    name: 'Detective',
  symbol: '⚲',
    description: 'Tu ojo entrenado puede discernir las verdaderas intenciones de los presentes.',
    team: 'PUEBLO',
    ability: 'Si eres Líder y aciertas la Palabra Secreta: Una vez por partida conoces el bando (Pueblo/Malvado) del jugador que elijas.',
    color: '#e94560'
  },
  [ROLES.LADRON]: {
    name: 'Ladrón',
  symbol: '⚙',
    description: 'Eres hábil en el arte de apropiarte de lo que no te pertenece, incluso habilidades.',
    team: 'PUEBLO',
    ability: 'Si eres Líder y aciertas la Palabra Secreta: Una vez por partida robas el rol y la habilidad de otro jugador. No funciona con el Infiltrado.</p>Al robar la habilidad su uso se reinicia',
    color: '#e94560'
  },
  [ROLES.SABIO]: {
    name: 'Sabio',
  symbol: '✦',
    description: 'Tu sabiduría y experiencia te otorgan mayor influencia en las decisiones.',
    team: 'PUEBLO',
    ability: 'Si eres Líder y aciertas la Palabra Secreta: En todas las votaciones del siguiente día, tienes que votar dos veces (Puede ser a diferentes personas).',
    color: '#e94560'
  },
  [ROLES.VIDENTE]: {
    name: 'Vidente',
    symbol: '👁',
    description: 'Puedes ver más allá de las apariencias.',
    team: 'PUEBLO',
    ability: 'Cuando se acierte la Palabra Secreta, en sueños, sabrás el rol del último jugador muerto. Si además fuiste líder, conocerás la palabra secreta el próximo día.',
    color: '#e94560'
  },
  [ROLES.DIPLOMATICO]: {
    name: 'Diplomático',
  symbol: '✒',
    description: 'Tu carisma y habilidad política te permiten influir en las decisiones del grupo.',
    team: 'PUEBLO',
    ability: 'Si eres Líder y aciertas la Palabra Secreta: Eliges al líder del siguiente día, ya no hay votación.',
    color: '#e94560'
  }
};

// Pool de palabras clave y sus fragmentos asociados
const KEYWORD_POOL = {
  AVIÓN: ['volar', 'cielo', 'alas', 'piloto', 'viaje', 'aeropuerto', 'ventana', 'motor', 'pasajero', 'despegue', 'aterrizaje', 'turbina', 'maleta', 'asiento', 'puerta'],
  PUERTA: ['entrada', 'cerradura', 'llave', 'casa', 'abrir', 'cerrar', 'paso', 'madera', 'manija', 'bisagra', 'ventana', 'seguridad', 'acceso', 'salida', 'entrada'],
  HOGAR: ['familia', 'casa', 'calidez', 'descanso', 'protección', 'techo', 'comida', 'dormitorio', 'muebles', 'seguridad', 'juntos', 'amor', 'chimenea', 'propio', 'ambiente'],
  CARRETERA: ['asfalto', 'viaje', 'coches', 'curvas', 'velocidad', 'destino', 'pavimento', 'conducir', 'señales', 'peatón', 'paisaje', 'km', 'camino', 'líneas', 'dirección'],
  LIBERTAD: ['derechos', 'elección', 'sinlímites', 'pensamiento', 'expresión', 'independencia', 'prisión', 'volar', 'autonomía', 'respeto', 'romper', 'cadenas', 'decidir', 'justicia', 'opresión'],
  ARTE: ['creatividad', 'pintura', 'escultura', 'música', 'expresión', 'belleza', 'emoción', 'artista', 'galería', 'estilo', 'lienzo', 'cultura', 'obra', 'interpretación', 'museo'],
  RELÁMPAGO: ['trueno', 'tormenta', 'cielo', 'descarga', 'electricidad', 'rayo', 'luz', 'brillo', 'nube', 'rápido', 'peligro', 'fenómeno', 'azul', 'estruendo', 'naturaleza'],
  RELOJ: ['tiempo', 'horas', 'muñeca', 'minutos', 'segundos', 'circular', 'tictac', 'agujas', 'digital', 'puntualidad', 'alarma', 'fecha', 'medir', 'mecanismo', 'pulsera'],
  JARDÍN: ['flores', 'plantas', 'verde', 'naturaleza', 'regar', 'césped', 'macetas', 'herramientas', 'pasto', 'árboles', 'tierra', 'belleza', 'trabajo', 'exterior', 'paz'],
  ESPEJO: ['reflejo', 'cristal', 'imagen', 'persona', 'verme', 'limpio', 'baño', 'pared', 'vanidad', 'plata', 'claro', 'superficie', 'marco', 'observar', 'identidad'],
  DESIERTO: ['arena', 'sol', 'calor', 'sequía', 'soledad', 'cactus', 'oasis', 'camello', 'dunas', 'extensión', 'seco', 'vida', 'supervivencia', 'caliente', 'paisaje'],
  ROBOT: ['máquina', 'inteligencia', 'artificial', 'metal', 'programación', 'futuro', 'trabajo', 'autómata', 'cables', 'tecnología', 'humanoides', 'circuito', 'tarea', 'ensamblaje', 'electrónica'],
  INVIERNO: ['frío', 'nieve', 'hielo', 'bufanda', 'guantes', 'chaqueta', 'diciembre', 'temperatura', 'copos', 'congelado', 'blanco', 'navidad', 'estación', 'días', 'cortos'],
  GUITARRA: ['cuerdas', 'música', 'madera', 'acordes', 'tocar', 'instrumento', 'sonido', 'púas', 'canción', 'melodía', 'concierto', 'clásica', 'eléctrica', 'afinación', 'canción'],
  ESTRELLA: ['cielo', 'noche', 'brillo', 'espacio', 'universo', 'gigante', 'gas', 'luz', 'caliente', 'distancia', 'constelación', 'sol', 'astronomía', 'lejos', 'pequeña'],
  AMISTAD: ['amigo', 'confianza', 'lealtad', 'apoyo', 'risas', 'compartir', 'unión', 'compañía', 'sincero', 'ayuda', 'persona', 'valorar', 'relación', 'cuidado', 'siempre'],
  PERIÓDICO: ['noticias', 'papel', 'información', 'leer', 'artículo', 'titulares', 'editor', 'sucesos', 'prensa', 'actualidad', 'crónica', 'diario', 'tinta', 'escribir', 'mañana'],
  HELADO: ['frío', 'dulce', 'verano', 'cuchara', 'sabores', 'bola', 'crema', 'postre', 'cucurucho', 'derretir', 'vainilla', 'azúcar', 'refrescante', 'leche', 'tentación'],
  MATEMÁTICAS: ['números', 'cálculo', 'fórmulas', 'problemas', 'lógica', 'geometría', 'sumar', 'restar', 'ciencias', 'álgebra', 'ecuación', 'resolver', 'difícil', 'operaciones', 'precisión'],
  OCÉANO: ['agua', 'profundo', 'salado', 'ballenas', 'olas', 'inmenso', 'azul', 'marino', 'planeta', 'submarino', 'pescado', 'corriente', 'misterio', 'costa', 'horizonte'],
  FANTASMA: ['miedo', 'espíritu', 'aparición', 'transparente', 'noche', 'leyenda', 'sábana', 'casa', 'muerto', 'historia', 'cadenas', 'invisible', 'escalofrío', 'susurro', 'aterrador'],
  ANILLO: ['joya', 'dedo', 'oro', 'plata', 'diamante', 'matrimonio', 'compromiso', 'circular', 'brillo', 'mano', 'regalo', 'metal', 'accesorio', 'valioso', 'boda'],
  PINTURA: ['color', 'brocha', 'lienzo', 'óleo', 'acrílico', 'mural', 'dibujo', 'cuadro', 'pigmento', 'taller', 'mezclar', 'boceto', 'marco', 'expresar', 'textura'],
  CHOCOLATE: ['cacao', 'dulce', 'marrón', 'derretido', 'postre', 'tableta', 'amargo', 'suizo', 'leche', 'placer', 'mordisco', 'pasta', 'bombón', 'sabor', 'antojo'],
  BICICLETA: ['ruedas', 'pedalear', 'cadena', 'manillar', 'sillín', 'ciclismo', 'casco', 'freno', 'aire', 'ejercicio', 'transporte', 'dos', 'velocidad', 'montaña', 'paseo'],
  SILLA: ['sentarse', 'mueble', 'patas', 'respaldo', 'madera', 'cocina', 'oficina', 'descansar', 'cómodo', 'mesa', 'reposabrazos', 'diseño', 'giratoria', 'asiento', 'espacio'],
  SOL: ['calor', 'luz', 'amarillo', 'estrella', 'planeta', 'día', 'energía', 'verano', 'brillar', 'rayos', 'sistema', 'quemar', 'cielo', 'vida', 'distancia'],
  VIAJE: ['destino', 'maletas', 'explorar', 'mapa', 'aventura', 'turismo', 'descubrir', 'avión', 'tren', 'alojamiento', 'pasaporte', 'cultura', 'fotografías', 'ida', 'vuelta'],
  VINO: ['uva', 'bebida', 'tinto', 'blanco', 'copa', 'tostada', 'alcohol', 'bodega', 'tierra', 'cosecha', 'cena', 'sabor', 'botella', 'envejecer', 'fruta'],
  ESCULTURA: ['piedra', 'forma', 'cincel', 'artista', 'estatua', 'volumen', 'figura', 'mármol', 'arcilla', 'bronce', 'talla', 'obra', 'modelar', 'tridimensional', 'museo'],
  PUENTE: ['río', 'unir', 'estructura', 'ingeniería', 'cruzar', 'metal', 'hormigón', 'tráfico', 'colgar', 'arco', 'altura', 'vehículos', 'agua', 'opuesto', 'camino'],
  VERDAD: ['sincero', 'realidad', 'mentira', 'hechos', 'demostrar', 'justicia', 'creer', 'existencia', 'transparencia', 'ocultar', 'evidencia', 'cierto', 'honestidad', 'juicio', 'única'],
  DESAYUNO: ['mañana', 'café', 'pan', 'leche', 'tostadas', 'comer', 'primero', 'cereales', 'zumo', 'energía', 'mesa', 'hambre', 'mermelada', 'empezar', 'día'],
  MONTAÑA: ['cima', 'escalar', 'roca', 'nieve', 'altura', 'aire', 'senderismo', 'paisaje', 'naturaleza', 'frío', 'subir', 'pico', 'verde', 'caminos', 'vista'],
  TELARAÑA: ['araña', 'hilo', 'capturar', 'insectos', 'pegar', 'fina', 'esquina', 'cazar', 'seda', 'red', 'pegajosa', 'limpiar', 'ocho', 'patas', 'tejido'],
  PARAGUAS: ['lluvia', 'proteger', 'abrir', 'cerrar', 'gotas', 'tela', 'mojado', 'mango', 'plegar', 'nublado', 'agua', 'accesorio', 'refugio', 'varillas', 'guardar'],
  SAL: ['sabor', 'cocina', 'blanco', 'mar', 'cristal', 'alimento', 'condimento', 'yodo', 'cloruro', 'conservar', 'mineral', 'exceso', 'arena', 'gusto', 'esencial'],
  MUSEO: ['cultura', 'historia', 'exposición', 'arte', 'visitar', 'silencio', 'pasillos', 'obras', 'guía', 'antiguo', 'colección', 'público', 'aprender', 'entradas', 'salas'],
  ESCALERA: ['subir', 'bajar', 'peldaños', 'alturas', 'madera', 'pasos', 'vertical', 'mano', 'emergencia', 'piso', 'estructura', 'caracol', 'construcción', 'apoyar', 'medida'],
  ZAPATO: ['pie', 'caminar', 'calzado', 'suela', 'cordones', 'piel', 'moda', 'protección', 'vestir', 'deporte', 'elegante', 'tacón', 'nuevo', 'par', 'tienda'],
  CÁRCEL: ['rejas', 'prisión', 'celda', 'encerrar', 'castigo', 'criminal', 'guardia', 'escape', 'muro', 'ley', 'pena', 'justicia', 'preso', 'libertad', 'condena'],
  FIESTA: ['celebración', 'música', 'bailar', 'alegría', 'gente', 'cumpleaños', 'bebida', 'disfraz', 'noche', 'amigos', 'evento', 'decoración', 'reunión', 'diversión', 'ruido'],
  CARTA: ['escribir', 'papel', 'correo', 'sobre', 'mensaje', 'tinta', 'remitente', 'destinatario', 'buzón', 'sello', 'texto', 'mano', 'leer', 'antiguo', 'comunicar'],
  MICRÓFONO: ['voz', 'sonar', 'amplificar', 'escenario', 'cantar', 'grabación', 'cable', 'música', 'discurso', 'sonido', 'conectar', 'podio', 'prueba', 'boca', 'entrevista'],
  TIJERAS: ['cortar', 'cuchillas', 'papel', 'dedos', 'mango', 'metal', 'afilado', 'peluquería', 'ropa', 'diseño', 'herramienta', 'precisión', 'círculos', 'abrir', 'manualidad'],
  ENERGÍA: ['fuerza', 'movimiento', 'electricidad', 'solar', 'potencia', 'trabajo', 'transformar', 'ejercicio', 'cuerpo', 'calor', 'combustible', 'ahorrar', 'vitalidad', 'fuente', 'gastar'],
  AVENTURA: ['emoción', 'riesgo', 'explorar', 'descubrir', 'desafío', 'viaje', 'peligro', 'naturaleza', 'valiente', 'historia', 'misterio', 'incógnita', 'experiencia', 'superar', 'nuevo'],
  CEREZA: ['rojo', 'fruta', 'dulce', 'pequeña', 'verano', 'postre', 'árbol', 'hueso', 'verde', 'comer', 'jugosa', 'pareja', 'tentación', 'recoger', 'decoración'],
  CUEVA: ['oscuridad', 'roca', 'subterráneo', 'estacto', 'murciélago', 'humedad', 'profundo', 'explorar', 'frío', 'piedras', 'antiguo', 'secreto', 'formación', 'estrecho', 'interior'],
  PIEL: ['cuerpo', 'tacto', 'órgano', 'suave', 'proteger', 'cubrir', 'tacto', 'color', 'arrugas', 'sol', 'cuidar', 'humana', 'sensible', 'dermatología', 'sentir'],
  TECHO: ['cubrir', 'casa', 'lluvia', 'proteger', 'alto', 'estructura', 'tejas', 'ático', 'interior', 'seguridad', 'vigas', 'aislamiento', 'goteras', 'cielo', 'plano'],
  SECRETO: ['oculto', 'guardar', 'silencio', 'confianza', 'misterio', 'nadie', 'saber', 'revelar', 'promesa', 'íntimo', 'privado', 'esconder', 'importante', 'reservado', 'historia'],
  CASA: ['paredes', 'habitaciones', 'vivir', 'ladrillos', 'ventanas', 'familia', 'hogar', 'puerta', 'techo', 'construcción', 'muebles', 'residencia', 'propiedad', 'suelo', 'dirección'],
  HUEVO: ['cáscara', 'gallina', 'yema', 'clara', 'cocinar', 'desayuno', 'frágil', 'proteína', 'nido', 'redondo', 'freír', 'sancochado', 'chocar', 'blanco', 'alimento'],
  VERANO: ['calor', 'sol', 'playa', 'vacaciones', 'julio', 'agosto', 'piscina', 'bañador', 'helado', 'viajes', 'caluroso', 'bronceado', 'estación', 'días', 'largos'],
  GATO: ['felino', 'maullar', 'bigotes', 'dormir', 'independiente', 'cazar', 'pelo', 'cola', 'doméstico', 'ronronear', 'ágil', 'patas', 'mascota', 'rasguño', 'caja'],
  POESÍA: ['versos', 'estrofas', 'sentimientos', 'rimas', 'escribir', 'lírico', 'emoción', 'metáfora', 'poeta', 'lectura', 'arte', 'bello', 'lenguaje', 'expresar', 'sensibilidad'],
  PERFUME: ['aroma', 'oler', 'frasco', 'esencia', 'fragancia', 'flores', 'cuerpo', 'vaporizador', 'lujoso', 'regalo', 'alcohol', 'gotas', 'olor', 'aplicar', 'cuidado'],
  LLAVE: ['abrir', 'cerrar', 'puerta', 'metal', 'seguridad', 'candado', 'bolsillo', 'olvidar', 'copia', 'manojo', 'insertar', 'girar', 'cilindro', 'propiedad', 'acceso'],
  AZÚCAR: ['dulce', 'blanco', 'café', 'cristales', 'sacarina', 'postre', 'caña', 'dieta', 'energía', 'añadir', 'cuchara', 'glaseado', 'alimento', 'disolver', 'refresco'],
  CINE: ['película', 'pantalla', 'butacas', 'oscuridad', 'proyector', 'actores', 'palomitas', 'director', 'sonido', 'estreno', 'boleto', 'butaca', 'acción', 'drama', 'ver'],
  JUEGO: ['diversión', 'reglas', 'ganar', 'perder', 'niños', 'equipo', 'tablero', 'competencia', 'jugar', 'dados', 'estrategia', 'cartas', 'ocio', 'pasar', 'tiempo'],
  RADIO: ['emisora', 'música', 'noticias', 'antena', 'escuchar', 'voz', 'frecuencia', 'altavoz', 'sintonizar', 'programa', 'onda', 'antiguo', 'comunicación', 'coche', 'locutor'],
  FLOR: ['pétalos', 'colores', 'planta', 'jardín', 'aroma', 'primavera', 'regalo', 'tallo', 'polen', 'bella', 'rosa', 'naturaleza', 'ramo', 'semilla', 'vida'],
  TELAR: ['hilos', 'tejer', 'manualidad', 'lana', 'máquina', 'diseño', 'ropa', 'artesanal', 'patrón', 'trama', 'urdimbre', 'textil', 'fibra', 'colores', 'crear'],
  SUEÑO: ['dormir', 'noche', 'descanso', 'imágenes', 'recordar', 'realidad', 'deseo', 'ojos', 'cabeza', 'cama', 'despertar', 'ilusión', 'profundo', 'mente', 'visualizar'],
  MESA: ['madera', 'comer', 'reunión', 'patas', 'platos', 'trabajar', 'superficie', 'oficina', 'sentarse', 'redonda', 'cubierta', 'mueble', 'mantel', 'centro', 'apoyar'],
  LLUVIA: ['agua', 'gotas', 'cielo', 'mojado', 'paraguas', 'tormenta', 'nubes', 'chubasco', 'caer', 'cristal', 'frescor', 'ruido', 'tierra', 'húmedo', 'regar'],
  ESPADAS: ['metal', 'lucha', 'arma', 'filo', 'caballero', 'batalla', 'medieval', 'empuñadura', 'guerra', 'héroe', 'corte', 'defender', 'hoja', 'antigua', 'combate'],
  FOTO: ['cámara', 'imagen', 'recuerdo', 'papel', 'digital', 'álbum', 'capturar', 'marco', 'posar', 'sonrisa', 'momento', 'revelado', 'blanco', 'negro', 'visual'],
  PULSAR: ['dedo', 'botón', 'presionar', 'encender', 'teclado', 'tocar', 'rápidamente', 'móvil', 'activar', 'interruptor', 'mano', 'hacer', 'click', 'acción', 'responder'],
  CLIMA: ['temperatura', 'tiempo', 'sol', 'lluvia', 'meteorología', 'cambio', 'viento', 'pronóstico', 'nubes', 'calor', 'frío', 'ambiente', 'humedad', 'estaciones', 'atmosfera'],
  BARCO: ['mar', 'navegar', 'agua', 'capitán', 'viaje', 'puerto', 'vela', 'cubierta', 'océano', 'flotar', 'embarcación', 'motor', 'tripulación', 'grande', 'hundirse'],
  BALANZA: ['pesar', 'kilos', 'medida', 'equilibrar', 'gramos', 'comprar', 'justicia', 'peso', 'platos', 'comparar', 'objeto', 'digital', 'cuerpo', 'precisión', 'tienda'],
  VUELO: ['avión', 'cielo', 'volar', 'alas', 'aeropuerto', 'altitud', 'piloto', 'despegar', 'viajar', 'turbulencia', 'aire', 'aeronave', 'pasajero', 'duración', 'embarcar'],
  TECLA: ['piano', 'ordenador', 'pulsar', 'escribir', 'música', 'blanco', 'negro', 'instrumento', 'letra', 'número', 'mecanografía', 'teclado', 'sonido', 'dedo', 'tocar'],
  CRISTAL: ['transparente', 'romper', 'vidrio', 'ventana', 'delicado', 'líquido', 'copa', 'material', 'espejo', 'limpiar', 'brillante', 'sólido', 'translucido', 'puerta', 'arena'],
  PLUMA: ['ave', 'volar', 'ligero', 'escribir', 'tinta', 'caer', 'suave', 'nido', 'ala', 'adorno', 'blanco', 'pájaro', 'mojar', 'cuerpo', 'antigua'],
  CORAZÓN: ['amor', 'latir', 'sangre', 'cuerpo', 'órgano', 'sentimiento', 'fuerte', 'vida', 'bombeo', 'emoción', 'rojo', 'médico', 'pulso', 'sentir', 'símbolo'],
  COLUMNA: ['soporte', 'vertical', 'edificio', 'estructura', 'periódico', 'fila', 'texto', 'orden', 'piedra', 'fuerte', 'cuerpo', 'sostener', 'base', 'pilar', 'alto'],
  DIENTE: ['boca', 'masticar', 'blanco', 'comer', 'cepillo', 'dolor', 'caries', 'dentista', 'sonrisa', 'hueso', 'mandíbula', 'leche', 'limpiar', 'molar', 'fuerte'],
  FÁBRICA: ['máquinas', 'producción', 'trabajo', 'productos', 'obreros', 'industria', 'ruido', 'chimenea', 'cadena', 'montaje', 'grande', 'almacén', 'materiales', 'generar', 'manufactura'],
  TECNOLOGÍA: ['innovación', 'digital', 'ciencia', 'futuro', 'máquinas', 'desarrollo', 'ordenador', 'internet', 'inventos', 'electrónica', 'aplicación', 'conexión', 'moderno', 'software', 'creación'],
  HOSPITALIDAD: ['bienvenida', 'amabilidad', 'invitado', 'recibir', 'casa', 'servicio', 'generosidad', 'atención', 'agradable', 'anfitrión', 'comodidad', 'ofrecer', 'calidez', 'compartir', 'viajero'],
  GIMNASIO: ['ejercicio', 'mancuernas', 'máquinas', 'entrenamiento', 'músculos', 'salud', 'pesas', 'sudor', 'rutina', 'deporte', 'fuerza', 'cuerpo', 'cinta', 'monitor', 'inscripción'],
  VACACIONES: ['descanso', 'viaje', 'libre', 'disfrutar', 'relax', 'playa', 'montaña', 'sol', 'hotel', 'tiempo', 'escapada', 'aventura', 'familia', 'desconectar', 'verano'],
  PERIODISTA: ['noticias', 'escribir', 'prensa', 'reportaje', 'entrevista', 'información', 'verdad', 'actualidad', 'medio', 'diario', 'radio', 'televisión', 'investigar', 'cámara', 'comunicar'],
  PESCADO: ['mar', 'comer', 'agua', 'aleta', 'escamas', 'océano', 'red', 'capturar', 'cocina', 'nutrición', 'pez', 'salado', 'blanco', 'fresco', 'anzuelo'],
  ESCRITORIO: ['trabajar', 'ordenador', 'mesa', 'silla', 'oficina', 'papeles', 'libros', 'orden', 'estudio', 'cajones', 'lámpara', 'escribir', 'espacio', 'tarea', 'documentos'],
  HUMEDAD: ['agua', 'ambiente', 'mojado', 'aire', 'condensación', 'pared', 'vapor', 'clima', 'fresco', 'frío', 'muffa', 'sensación', 'líquido', 'absorber', 'saturación'],
  VOLCÁN: ['lava', 'fuego', 'erupción', 'montaña', 'ceniza', 'cráter', 'humo', 'magma', 'activo', 'caliente', 'peligro', 'roca', 'geología', 'alto', 'naturaleza'],
  ALMOHADA: ['dormir', 'cabeza', 'cama', 'suave', 'descanso', 'noche', 'plumas', 'cómodo', 'sueño', 'textil', 'apoyar', 'espuma', 'blanco', 'cuerpo', 'reposar'],
  COMUNICACIÓN: ['hablar', 'mensaje', 'entender', 'informar', 'lenguaje', 'diálogo', 'medio', 'compartir', 'transmitir', 'escuchar', 'teléfono', 'conversar', 'ideas', 'palabras', 'conexión'],
  CIENCIA: ['experimento', 'investigación', 'laboratorio', 'conocimiento', 'fórmulas', 'descubrimiento', 'química', 'física', 'biología', 'método', 'teoría', 'datos', 'prueba', 'científico', 'aprender'],
  DESPEDIDA: ['adiós', 'marcha', 'abrazo', 'viaje', 'separación', 'emoción', 'tristeza', 'último', 'momento', 'decir', 'recuerdo', 'tiempo', 'punto', 'partida', 'volver'],
  ARQUITECTO: ['diseño', 'planos', 'edificio', 'construcción', 'dibujo', 'espacio', 'estructura', 'medida', 'materiales', 'obra', 'proyecto', 'casa', 'forma', 'técnico', 'crear'],
  LLANURA: ['tierra', 'plano', 'campo', 'horizonte', 'extensión', 'cultivos', 'verde', 'paisaje', 'suelo', 'granja', 'viento', 'abierto', 'geografía', 'amplio', 'terreno'],
  TELÉGRAFO: ['mensaje', 'código', 'morse', 'antiguo', 'comunicación', 'eléctrico', 'distancia', 'cables', 'punto', 'línea', 'texto', 'rápido', 'señal', 'informar', 'histórico'],
  HELICÓPTERO: ['volar', 'hélice', 'aire', 'rotor', 'emergencia', 'cielo', 'vertical', 'máquina', 'piloto', 'cámara', 'ruido', 'despegar', 'avión', 'lento', 'pequeño'],
  VELOCIDAD: ['rápido', 'movimiento', 'tiempo', 'coches', 'correr', 'metros', 'segundo', 'acelerar', 'medir', 'límite', 'frenar', 'deporte', 'rapidez', 'distancia', 'alta'],
  PAZ: ['calma', 'silencio', 'guerra', 'tranquilidad', 'armonía', 'mundo', 'relajación', 'ausencia', 'conflicto', 'espiritual', 'acuerdo', 'blanco', 'descanso', 'serenidad', 'interior'],
  CUMPLEAÑOS: ['pastel', 'celebración', 'años', 'regalos', 'fiesta', 'velas', 'amigos', 'alegría', 'día', 'especial', 'reunión', 'canción', 'fecha', 'invitados', 'globos'],
  FANTASÍA: ['imaginación', 'sueño', 'magia', 'irreal', 'cuento', 'personajes', 'aventura', 'creación', 'mente', 'literatura', 'misterio', 'dragones', 'princesas', 'mundo', 'irreal'],
  DEDO: ['mano', 'uña', 'tocar', 'anillo', 'pulgar', 'contar', 'pie', 'apuntar', 'pequeño', 'articulación', 'guante', 'anular', 'movimiento', 'extremidad', 'sensible'],
  ESQUÍ: ['nieve', 'montaña', 'deporte', 'tabla', 'invierno', 'frío', 'descender', 'pista', 'bastones', 'velocidad', 'casco', 'blanco', 'deslizar', 'ejercicio', 'vacaciones'],
  MASCARILLA: ['cubrir', 'boca', 'nariz', 'protección', 'virus', 'tela', 'sanitario', 'respirar', 'obligatoria', 'cara', 'higiene', 'prevención', 'contagio', 'cuerpo', 'social'],
  ESENCIA: ['aroma', 'naturaleza', 'concentrado', 'olor', 'perfume', 'extracción', 'pura', 'significado', 'vital', 'fragancia', 'flores', 'misterio', 'íntimo', 'espíritu', 'sustancia'],
  BRÚJULA: ['norte', 'dirección', 'navegar', 'imán', 'orientación', 'aguja', 'metal', 'mapa', 'viaje', 'campamento', 'ruta', 'indicar', 'guía', 'polo', 'magnético'],
  PLASTILINA: ['moldear', 'arcilla', 'jugar', 'colores', 'manos', 'niños', 'suave', 'crear', 'figuras', 'escultura', 'masa', 'divertido', 'apretar', 'forma', 'material'],
  FIEBRE: ['caliente', 'enfermedad', 'temperatura', 'cuerpo', 'termómetro', 'sudor', 'frío', 'medir', 'malestar', 'cabeza', 'infección', 'síntoma', 'médico', 'descansar', 'alta'],
  DEUDA: ['dinero', 'pagar', 'prestar', 'banco', 'intereses', 'económico', 'obligación', 'préstamo', 'saldo', 'impago', 'cantidad', 'crédito', 'recibir', 'ahorro', 'pendiente'],
  CÁSCARA: ['cubrir', 'fruta', 'huevo', 'proteger', 'exterior', 'romper', 'duro', 'delgado', 'plátano', 'pelar', 'piel', 'naranja', 'desecho', 'animal', 'comida'],
  ESTUDIANTE: ['aprender', 'escuela', 'clases', 'libros', 'examen', 'universidad', 'profesor', 'tarea', 'conocimiento', 'estudiar', 'alumno', 'futuro', 'educación', 'mochila', 'carrera'],
  ENTRENADOR: ['deporte', 'equipo', 'dirigir', 'enseñar', 'táctica', 'ganar', 'fuerza', 'competición', 'ejercicio', 'motivar', 'plan', 'atleta', 'juego', 'técnica', 'estrategia'],
  RECUERDO: ['memoria', 'pasado', 'momento', 'guardar', 'fotografía', 'nostalgia', 'revivir', 'mente', 'olvidar', 'historia', 'objeto', 'pensamiento', 'persona', 'viaje', 'sentimiento'],
  TIGRE: ['felino', 'rayas', 'naranja', 'selva', 'cazar', 'salvaje', 'grande', 'fuerte', 'animal', 'rugido', 'peligro', 'garras', 'rápido', 'asiático', 'depredador'],
  ORDEN: ['organizar', 'reglas', 'estructura', 'limpieza', 'paz', 'método', 'lógico', 'sistema', 'instrucciones', 'obedecer', 'control', 'colocar', 'disciplina', 'armonía', 'espacio'],
  REUNIÓN: ['gente', 'encontrarse', 'hablar', 'trabajo', 'agenda', 'mesa', 'acuerdo', 'discusión', 'decisiones', 'hora', 'lugar', 'juntos', 'grupo', 'evento', 'planificar'],
  VOTO: ['elección', 'elegir', 'derecho', 'papel', 'urna', 'candidato', 'gobierno', 'secreto', 'ciudadano', 'opinión', 'democracia', 'decisión', 'participación', 'contar', 'política'],
  SIRENA: ['mar', 'canto', 'pez', 'mujer', 'cola', 'leyenda', 'misterio', 'peligro', 'océano', 'bella', 'agua', 'mitología', 'barcos', 'encanto', 'debajo'],
  TEMPESTAD: ['tormenta', 'lluvia', 'viento', 'fuerte', 'relámpago', 'trueno', 'miedo', 'mar', 'cielo', 'peligro', 'natural', 'nubes', 'oscuridad', 'violento', 'fenómeno'],
  GOL: ['fútbol', 'portería', 'anotar', 'celebración', 'balón', 'punto', 'partido', 'ganar', 'red', 'equipo', 'chutar', 'alegría', 'marcador', 'final', 'jugador'],
  ARCO: ['flecha', 'curva', 'lanzar', 'madera', 'arma', 'cazar', 'antiguo', 'deporte', 'disparar', 'cuerda', 'apuntar', 'objetivo', 'arquitectura', 'puente', 'forma'],
  PASAPORTE: ['viaje', 'documento', 'identidad', 'país', 'frontera', 'sello', 'control', 'autoridad', 'internacional', 'foto', 'visa', 'nombre', 'ciudadanía', 'legal', 'mover'],
  REPOSTERÍA: ['pasteles', 'dulce', 'horno', 'azúcar', 'harina', 'cocina', 'crema', 'decoración', 'bizcocho', 'mantequilla', 'receta', 'postre', 'chef', 'probar', 'vainilla'],
  INSECTO: ['pequeño', 'alas', 'patas', 'volar', 'bicho', 'antena', 'naturaleza', 'verde', 'picar', 'seis', 'cuerpo', 'molesto', 'jardín', 'animal', 'entomología'],
  BALLET: ['danza', 'música', 'puntas', 'escenario', 'bailarín', 'elegancia', 'clásico', 'tutú', 'pirueta', 'movimiento', 'teatro', 'gracia', 'coreografía', 'expresión', 'arte'],
  TIENDA: ['comprar', 'productos', 'vender', 'dependiente', 'dinero', 'escaparate', 'ropa', 'cliente', 'establecimiento', 'negocio', 'abrir', 'caja', 'pago', 'mercancía', 'local'],
  ANIMAL: ['vivo', 'naturaleza', 'salvaje', 'doméstico', 'mamífero', 'respirar', 'cuerpo', 'comer', 'reino', 'moverse', 'especie', 'zoo', 'mascota', 'cuatro', 'patas'],
  AVISPA: ['volar', 'picar', 'negro', 'amarillo', 'insecto', 'veneno', 'agresiva', 'dolor', 'molesto', 'verano', 'nido', 'aguijón', 'abeja', 'pequeño', 'cuerpo'],
  CEREAL: ['desayuno', 'leche', 'grano', 'trigo', 'avena', 'comer', 'campo', 'cultivo', 'saludable', 'alimento', 'fibra', 'copos', 'energía', 'tazón', 'plantación'],
  VENTANA: ['cristal', 'abrir', 'cerrar', 'vista', 'luz', 'aire', 'marco', 'casa', 'mirar', 'calle', 'transparente', 'lluvia', 'sol', 'cortinas', 'claro'],
  REGLA: ['medir', 'línea', 'matemáticas', 'escuela', 'recta', 'plástico', 'ley', 'norma', 'seguir', 'escritorio', 'milímetros', 'dibujar', 'precisión', 'cumplir', 'instrumento'],
  FÓSIL: ['antiguo', 'piedra', 'millones', 'hueso', 'tierra', 'excavar', 'prueba', 'historia', 'animal', 'muerto', 'geología', 'paleontología', 'huella', 'prehistoria', 'descubrimiento'],
  CANCIÓN: ['música', 'letra', 'cantar', 'ritmo', 'voz', 'melodía', 'artista', 'escuchar', 'radio', 'favorita', 'estrofas', 'coro', 'pop', 'emoción', 'disco'],
  MALETA: ['viaje', 'ropa', 'empacar', 'vacaciones', 'aeropuerto', 'ruedas', 'equipaje', 'viajar', 'cerrar', 'peso', 'avión', 'abrir', 'guardar', 'grande', 'vaciar'],
  HISTORIA: ['pasado', 'contar', 'eventos', 'aprender', 'libros', 'antiguo', 'fechas', 'cultura', 'memoria', 'siglo', 'época', 'escritura', 'suceso', 'maestro', 'tiempo'],
  BOTELLA: ['líquido', 'cristal', 'agua', 'tapa', 'beber', 'plástico', 'vidrio', 'contenedor', 'llenar', 'vaciar', 'refresco', 'cilindro', 'vino', 'almacenar', 'cerrar'],
  ALUMNO: ['aprender', 'profesor', 'estudiante', 'escuela', 'clase', 'estudiar', 'examen', 'tarea', 'conocimiento', 'educación', 'pupitre', 'escuchar', 'leer', 'joven', 'carrera'],
  DIRECCIÓN: ['calle', 'número', 'mapa', 'lugar', 'buscar', 'destino', 'casa', 'postal', 'norte', 'sur', 'camino', 'girar', 'derecha', 'izquierda', 'enviar'],
  CARPINTERO: ['madera', 'trabajar', 'sierra', 'muebles', 'martillo', 'construir', 'herramientas', 'clavo', 'medir', 'oficio', 'banco', 'diseñar', 'cortar', 'profesional', 'taller'],
  ESPECIAS: ['sabor', 'cocina', 'picar', 'aroma', 'comida', 'salado', 'dulce', 'condimento', 'curry', 'pimienta', 'picante', 'mezclar', 'seco', 'origen', 'natural'],
  DRAMA: ['teatro', 'emoción', 'película', 'tristeza', 'conflicto', 'actuar', 'tensión', 'argumento', 'escenario', 'literatura', 'sentimientos', 'personajes', 'tragedia', 'llorar', 'fuerte'],
  SILENCIO: ['ruido', 'callado', 'noche', 'paz', 'escuchar', 'secreto', 'tranquilidad', 'hablar', 'ausencia', 'meditación', 'bosque', 'momento', 'profundo', 'íntimo', 'espacio'],
  MEDALLA: ['premio', 'ganar', 'oro', 'plata', 'bronce', 'competición', 'cuello', 'honor', 'deporte', 'logro', 'reconocimiento', 'forma', 'circular', 'cinta', 'celebración'],
  POZO: ['agua', 'profundo', 'excavar', 'cubo', 'tierra', 'rústico', 'beber', 'cisterna', 'misterio', 'sacar', 'redondo', 'antiguo', 'fondo', 'peligro', 'humedad'],
  CALOR: ['sol', 'temperatura', 'verano', 'fuego', 'quemar', 'cuerpo', 'ambiente', 'alto', 'sudor', 'sensación', 'energía', 'cocina', 'radiación', 'sofocante', 'ondas'],
  ESPONJA: ['agua', 'absorber', 'limpiar', 'baño', 'suave', 'poroso', 'ducha', 'espuma', 'mojado', 'mar', 'fregadero', 'sacar', 'jabón', 'apretar', 'flexible'],
  FRENTE: ['cabeza', 'cara', 'adelante', 'guerra', 'lucha', 'línea', 'opuesto', 'arrugas', 'soldados', 'ejército', 'batalla', 'lado', 'superior', 'brazo', 'mandar'],
  NIEBLA: ['nubes', 'baja', 'humedad', 'visibilidad', 'frío', 'misterio', 'densa', 'blanca', 'cielo', 'carretera', 'mañana', 'cubrir', 'difícil', 'peligro', 'sensación'],
  ABOGADO: ['ley', 'justicia', 'tribunal', 'defender', 'cliente', 'juez', 'documentos', 'juicio', 'legal', 'derechos', 'estudiar', 'argumento', 'código', 'sentencia', 'profesión'],
  TELEVISOR: ['pantalla', 'ver', 'programa', 'noticias', 'control', 'mando', 'cine', 'imagen', 'sonido', 'salón', 'antena', 'series', 'encender', 'grande', 'entretenimiento'],
  BALÓN: ['fútbol', 'juego', 'redondo', 'patear', 'botar', 'deporte', 'inflar', 'cuero', 'golpear', 'aire', 'cancha', 'equipo', 'portería', 'correr', 'partido'],
  LENGUAJE: ['palabras', 'hablar', 'comunicación', 'idioma', 'escritura', 'frases', 'gramática', 'expresión', 'significado', 'aprender', 'humano', 'voz', 'boca', 'transmitir', 'símbolos'],
  PULMÓN: ['respirar', 'aire', 'cuerpo', 'órgano', 'oxígeno', 'tórax', 'vida', 'enfermedad', 'inhalar', 'exhalar', 'derecho', 'izquierdo', 'biología', 'fumar', 'sistema'],
  DESPEDIR: ['trabajo', 'echar', 'adiós', 'empleo', 'salir', 'contrato', 'finalizar', 'decisión', 'jefe', 'personal', 'abandono', 'empresa', 'cesar', 'causa', 'tristeza'],
  CÁMARA: ['fotografía', 'objetivo', 'flash', 'capturar', 'imagen', 'lente', 'disparar', 'recuerdo', 'digital', 'enfoque', 'vídeo', 'apertura', 'luz', 'obturador', 'álbum'],
  AGUA: ['beber', 'líquido', 'transparente', 'sed', 'río', 'lluvia', 'hielo', 'vapor', 'hidratación', 'vida', 'mojado', 'océano', 'gotas', 'refresco', 'ducha'],
  ESCUELA: ['aprender', 'profesor', 'alumno', 'clase', 'pizarra', 'libreta', 'estudiar', 'recreo', 'conocimiento', 'exámenes', 'mochila', 'compañeros', 'matemáticas', 'lectura', 'horario'],
  TELÉFONO: ['llamar', 'móvil', 'pantalla', 'comunicación', 'mensaje', 'batería', 'aplicaciones', 'internet', 'contacto', 'vibración', 'auriculares', 'hablar', 'redes', 'desbloquear', 'cargador'],
  DINERO: ['billetes', 'monedas', 'comprar', 'riqueza', 'ahorrar', 'gastar', 'sueldo', 'banco', 'economía', 'pago', 'valor', 'trabajo', 'interés', 'inversión', 'deuda'],
  FUEGO: ['quemar', 'calor', 'llamas', 'humo', 'cenizas', 'rojo', 'chispa', 'caliente', 'incendio', 'cocinar', 'hoguera', 'oxígeno', 'extintor', 'luz', 'peligro'],
  PERRO: ['mascota', 'ladrido', 'cola', 'jugar', 'fiel', 'correr', 'paseo', 'doméstico', 'hueso', 'peludo', 'amo', 'guardián', 'patas', 'olfato', 'cachorro'],
  TEATRO: ['escenario', 'obra', 'actores', 'público', 'aplausos', 'guion', 'telón', 'personaje', 'representación', 'butaca', 'maquillaje', 'drama', 'comedia', 'diálogo', 'vestuario'],
  CEREBRO: ['pensar', 'mente', 'neuronas', 'memoria', 'órgano', 'inteligencia', 'ideas', 'cabeza', 'lógica', 'aprendizaje', 'sentimientos', 'recuerdos', 'sistema', 'decisiones', 'concentración'],
  CAFÉ: ['bebida', 'caliente', 'grano', 'desayuno', 'taza', 'aroma', 'energía', 'negro', 'leche', 'despertar', 'amargo', 'cafeína', 'barra', 'termo', 'espresso'],
  PLANETA: ['espacio', 'tierra', 'girar', 'órbita', 'sol', 'universo', 'satélite', 'grande', 'astronomía', 'cielo', 'gas', 'roca', 'estrella', 'vida', 'gravedad'],
  ALGODÓN: ['suave', 'tela', 'blanco', 'planta', 'ropa', 'fibra', 'camisa', 'natural', 'hilo', 'recoger', 'campo', 'cómodo', 'textil', 'semilla', 'cultivo'],
  SILBAR: ['boca', 'sonido', 'labios', 'aire', 'melodía', 'canción', 'juego', 'agudo', 'hacer', 'ruido', 'gente', 'llamar', 'pájaros', 'burbujas', 'tono'],
  MERCADO: ['comprar', 'vender', 'gente', 'productos', 'puesto', 'fruta', 'dinero', 'negocio', 'abierto', 'calle', 'alimentos', 'oferta', 'demanda', 'tienda', 'bullicio'],
  DIETA: ['comer', 'adelgazar', 'salud', 'régimen', 'alimentos', 'restricción', 'control', 'nutrición', 'peso', 'doctor', 'cambio', 'fuerza', 'cuerpo', 'calorías', 'plan'],
  MONEDA: ['dinero', 'metal', 'redonda', 'pago', 'valor', 'cambio', 'colección', 'pequeña', 'bolsillo', 'euro', 'cobre', 'plata', 'oro', 'cuenta', 'comprar'],
  BICHO: ['insecto', 'pequeño', 'cuerpo', 'picar', 'patas', 'volar', 'animal', 'molesto', 'jardín', 'gusano', 'rastrar', 'verano', 'seis', 'vida', 'verde'],
  PUERTA: ['abrir', 'cerrar', 'entrada', 'madera', 'casa', 'llave', 'seguridad', 'paso', 'metal', 'manilla', 'muro', 'salir', 'entrar', 'espacio', 'acceso'],
  MISTERIO: ['secreto', 'desconocido', 'investigar', 'resolver', 'incógnita', 'intriga', 'oscuridad', 'oculto', 'curiosidad', 'extraño', 'sospecha', 'historia', 'miedo', 'verdad', 'enigma'],
  CÁMARA: ['fotografía', 'objetivo', 'flash', 'capturar', 'imagen', 'lente', 'disparar', 'recuerdo', 'digital', 'enfoque', 'vídeo', 'apertura', 'luz', 'obturador', 'álbum'],
  AGUA: ['beber', 'líquido', 'transparente', 'sed', 'río', 'lluvia', 'hielo', 'vapor', 'hidratación', 'vida', 'mojado', 'océano', 'gotas', 'refresco', 'ducha'],
  ESCUELA: ['aprender', 'profesor', 'alumno', 'clase', 'pizarra', 'libreta', 'estudiar', 'recreo', 'conocimiento', 'exámenes', 'mochila', 'compañeros', 'matemáticas', 'lectura', 'horario'],
  TELÉFONO: ['llamar', 'móvil', 'pantalla', 'comunicación', 'mensaje', 'batería', 'aplicaciones', 'internet', 'contacto', 'vibración', 'auriculares', 'hablar', 'redes', 'desbloquear', 'cargador'],
  DINERO: ['billetes', 'monedas', 'comprar', 'riqueza', 'ahorrar', 'gastar', 'sueldo', 'banco', 'economía', 'pago', 'valor', 'trabajo', 'interés', 'inversión', 'deuda'],
  FUEGO: ['quemar', 'calor', 'llamas', 'humo', 'cenizas', 'rojo', 'chispa', 'caliente', 'incendio', 'cocinar', 'hoguera', 'oxígeno', 'extintor', 'luz', 'peligro'],
  PERRO: ['mascota', 'ladrido', 'cola', 'jugar', 'fiel', 'correr', 'paseo', 'doméstico', 'hueso', 'peludo', 'amo', 'guardián', 'patas', 'olfato', 'cachorro'],
  TEATRO: ['escenario', 'obra', 'actores', 'público', 'aplausos', 'guion', 'telón', 'personaje', 'representación', 'butaca', 'maquillaje', 'drama', 'comedia', 'diálogo', 'vestuario'],
  CEREBRO: ['pensar', 'mente', 'neuronas', 'memoria', 'órgano', 'inteligencia', 'ideas', 'cabeza', 'lógica', 'aprendizaje', 'sentimientos', 'recuerdos', 'sistema', 'decisiones', 'concentración'],
  CAFÉ: ['bebida', 'caliente', 'grano', 'desayuno', 'taza', 'aroma', 'energía', 'negro', 'leche', 'despertar', 'amargo', 'cafeína', 'barra', 'termo', 'espresso'],
  HOGAR: ['familia', 'casa', 'calidez', 'descanso', 'protección', 'techo', 'comida', 'dormitorio', 'muebles', 'seguridad', 'juntos', 'amor', 'chimenea', 'propio', 'ambiente'],
  CARRETERA: ['asfalto', 'viaje', 'coches', 'curvas', 'velocidad', 'destino', 'pavimento', 'conducir', 'señales', 'peatón', 'paisaje', 'km', 'camino', 'líneas', 'dirección'],
  LIBERTAD: ['derechos', 'elección', 'sinlímites', 'pensamiento', 'expresión', 'independencia', 'prisión', 'volar', 'autonomía', 'respeto', 'romper', 'cadenas', 'decidir', 'justicia', 'opresión'],
  ARTE: ['creatividad', 'pintura', 'escultura', 'música', 'expresión', 'belleza', 'emoción', 'artista', 'galería', 'estilo', 'lienzo', 'cultura', 'obra', 'interpretación', 'museo'],
  RELÁMPAGO: ['trueno', 'tormenta', 'cielo', 'descarga', 'electricidad', 'rayo', 'luz', 'brillo', 'nube', 'rápido', 'peligro', 'fenómeno', 'azul', 'estruendo', 'naturaleza'],
  RELOJ: ['tiempo', 'horas', 'muñeca', 'minutos', 'segundos', 'circular', 'tictac', 'agujas', 'digital', 'puntualidad', 'alarma', 'fecha', 'medir', 'mecanismo', 'pulsera'],
  JARDÍN: ['flores', 'plantas', 'verde', 'naturaleza', 'regar', 'césped', 'macetas', 'herramientas', 'pasto', 'árboles', 'tierra', 'belleza', 'trabajo', 'exterior', 'paz'],
  ESPEJO: ['reflejo', 'cristal', 'imagen', 'persona', 'verme', 'limpio', 'baño', 'pared', 'vanidad', 'plata', 'claro', 'superficie', 'marco', 'observar', 'identidad'],
  DESIERTO: ['arena', 'sol', 'calor', 'sequía', 'soledad', 'cactus', 'oasis', 'camello', 'dunas', 'extensión', 'seco', 'vida', 'supervivencia', 'caliente', 'paisaje'],
  ROBOT: ['máquina', 'inteligencia', 'artificial', 'metal', 'programación', 'futuro', 'trabajo', 'autómata', 'cables', 'tecnología', 'humanoides', 'circuito', 'tarea', 'ensamblaje', 'electrónica'],
  INVIERNO: ['frío', 'nieve', 'hielo', 'bufanda', 'guantes', 'chaqueta', 'diciembre', 'temperatura', 'copos', 'congelado', 'blanco', 'navidad', 'estación', 'días', 'cortos'],
  GUITARRA: ['cuerdas', 'música', 'madera', 'acordes', 'tocar', 'instrumento', 'sonido', 'púas', 'canción', 'melodía', 'concierto', 'clásica', 'eléctrica', 'afinación', 'canción'],
  ESTRELLA: ['cielo', 'noche', 'brillo', 'espacio', 'universo', 'gigante', 'gas', 'luz', 'caliente', 'distancia', 'constelación', 'sol', 'astronomía', 'lejos', 'pequeña'],
  AMISTAD: ['amigo', 'confianza', 'lealtad', 'apoyo', 'risas', 'compartir', 'unión', 'compañía', 'sincero', 'ayuda', 'persona', 'valorar', 'relación', 'cuidado', 'siempre'],
  PERIÓDICO: ['noticias', 'papel', 'información', 'leer', 'artículo', 'titulares', 'editor', 'sucesos', 'prensa', 'actualidad', 'crónica', 'diario', 'tinta', 'escribir', 'mañana'],
  HELADO: ['frío', 'dulce', 'verano', 'cuchara', 'sabores', 'bola', 'crema', 'postre', 'cucurucho', 'derretir', 'vainilla', 'azúcar', 'refrescante', 'leche', 'tentación'],
  MATEMÁTICAS: ['números', 'cálculo', 'fórmulas', 'problemas', 'lógica', 'geometría', 'sumar', 'restar', 'ciencias', 'álgebra', 'ecuación', 'resolver', 'difícil', 'operaciones', 'precisión'],
  OCÉANO: ['agua', 'profundo', 'salado', 'ballenas', 'olas', 'inmenso', 'azul', 'marino', 'planeta', 'submarino', 'pescado', 'corriente', 'misterio', 'costa', 'horizonte'],
  FANTASMA: ['miedo', 'espíritu', 'aparición', 'transparente', 'noche', 'leyenda', 'sábana', 'casa', 'muerto', 'historia', 'cadenas', 'invisible', 'escalofrío', 'susurro', 'aterrador'],
  ANILLO: ['joya', 'dedo', 'oro', 'plata', 'diamante', 'matrimonio', 'compromiso', 'circular', 'brillo', 'mano', 'regalo', 'metal', 'accesorio', 'valioso', 'boda'],
  PINTURA: ['color', 'brocha', 'lienzo', 'óleo', 'acrílico', 'mural', 'dibujo', 'cuadro', 'pigmento', 'taller', 'mezclar', 'boceto', 'marco', 'expresar', 'textura'],
  CHOCOLATE: ['cacao', 'dulce', 'marrón', 'derretido', 'postre', 'tableta', 'amargo', 'suizo', 'leche', 'placer', 'mordisco', 'pasta', 'bombón', 'sabor', 'antojo'],
  BICICLETA: ['ruedas', 'pedalear', 'cadena', 'manillar', 'sillín', 'ciclismo', 'casco', 'freno', 'aire', 'ejercicio', 'transporte', 'dos', 'velocidad', 'montaña', 'paseo'],
  SILLA: ['sentarse', 'mueble', 'patas', 'respaldo', 'madera', 'cocina', 'oficina', 'descansar', 'cómodo', 'mesa', 'reposabrazos', 'diseño', 'giratoria', 'asiento', 'espacio'],
  SOL: ['calor', 'luz', 'amarillo', 'estrella', 'planeta', 'día', 'energía', 'verano', 'brillar', 'rayos', 'sistema', 'quemar', 'cielo', 'vida', 'distancia'],
  VIAJE: ['destino', 'maletas', 'explorar', 'mapa', 'aventura', 'turismo', 'descubrir', 'avión', 'tren', 'alojamiento', 'pasaporte', 'cultura', 'fotografías', 'ida', 'vuelta'],
  VINO: ['uva', 'bebida', 'tinto', 'blanco', 'copa', 'tostada', 'alcohol', 'bodega', 'tierra', 'cosecha', 'cena', 'sabor', 'botella', 'envejecer', 'fruta'],
  ESCULTURA: ['piedra', 'forma', 'cincel', 'artista', 'estatua', 'volumen', 'figura', 'mármol', 'arcilla', 'bronce', 'talla', 'obra', 'modelar', 'tridimensional', 'museo'],
  VERDAD: ['sincero', 'realidad', 'mentira', 'hechos', 'demostrar', 'justicia', 'creer', 'existencia', 'transparencia', 'ocultar', 'evidencia', 'cierto', 'honestidad', 'juicio', 'única'],
  DESAYUNO: ['mañana', 'café', 'pan', 'leche', 'tostadas', 'comer', 'primero', 'cereales', 'zumo', 'energía', 'mesa', 'hambre', 'mermelada', 'empezar', 'día'],
  MONTAÑA: ['cima', 'escalar', 'roca', 'nieve', 'altura', 'aire', 'senderismo', 'paisaje', 'naturaleza', 'frío', 'subir', 'pico', 'verde', 'caminos', 'vista'],
  TELARAÑA: ['araña', 'hilo', 'capturar', 'insectos', 'pegar', 'fina', 'esquina', 'cazar', 'seda', 'red', 'pegajosa', 'limpiar', 'ocho', 'patas', 'tejido'],
  PARAGUAS: ['lluvia', 'proteger', 'abrir', 'cerrar', 'gotas', 'tela', 'mojado', 'mango', 'plegar', 'nublado', 'agua', 'accesorio', 'refugio', 'varillas', 'guardar'],
  SAL: ['sabor', 'cocina', 'blanco', 'mar', 'cristal', 'alimento', 'condimento', 'yodo', 'cloruro', 'conservar', 'mineral', 'exceso', 'arena', 'gusto', 'esencial'],
  MUSEO: ['cultura', 'historia', 'exposición', 'arte', 'visitar', 'silencio', 'pasillos', 'obras', 'guía', 'antiguo', 'colección', 'público', 'aprender', 'entradas', 'salas'],
  ESCALERA: ['subir', 'bajar', 'peldaños', 'alturas', 'madera', 'pasos', 'vertical', 'mano', 'emergencia', 'piso', 'estructura', 'caracol', 'construcción', 'apoyar', 'medida'],
  ZAPATO: ['pie', 'caminar', 'calzado', 'suela', 'cordones', 'piel', 'moda', 'protección', 'vestir', 'deporte', 'elegante', 'tacón', 'nuevo', 'par', 'tienda'],
  CÁRCEL: ['rejas', 'prisión', 'celda', 'encerrar', 'castigo', 'criminal', 'guardia', 'escape', 'muro', 'ley', 'pena', 'justicia', 'preso', 'libertad', 'condena'],
  FIESTA: ['celebración', 'música', 'bailar', 'alegría', 'gente', 'cumpleaños', 'bebida', 'disfraz', 'noche', 'amigos', 'evento', 'decoración', 'reunión', 'diversión', 'ruido'],
  CARTA: ['escribir', 'papel', 'correo', 'sobre', 'mensaje', 'tinta', 'remitente', 'destinatario', 'buzón', 'sello', 'texto', 'mano', 'leer', 'antiguo', 'comunicar'],
  MICRÓFONO: ['voz', 'sonar', 'amplificar', 'escenario', 'cantar', 'grabación', 'cable', 'música', 'discurso', 'sonido', 'conectar', 'podio', 'prueba', 'boca', 'entrevista'],
  TIJERAS: ['cortar', 'cuchillas', 'papel', 'dedos', 'mango', 'metal', 'afilado', 'peluquería', 'ropa', 'diseño', 'herramienta', 'precisión', 'círculos', 'abrir', 'manualidad'],
  ENERGÍA: ['fuerza', 'movimiento', 'electricidad', 'solar', 'potencia', 'trabajo', 'transformar', 'ejercicio', 'cuerpo', 'calor', 'combustible', 'ahorrar', 'vitalidad', 'fuente', 'gastar'],
  AVENTURA: ['emoción', 'riesgo', 'explorar', 'descubrir', 'desafío', 'viaje', 'peligro', 'naturaleza', 'valiente', 'historia', 'misterio', 'incógnita', 'experiencia', 'superar', 'nuevo'],
  CEREZA: ['rojo', 'fruta', 'dulce', 'pequeña', 'verano', 'postre', 'árbol', 'hueso', 'verde', 'comer', 'jugosa', 'pareja', 'tentación', 'recoger', 'decoración'],
  CUEVA: ['oscuridad', 'roca', 'subterráneo', 'estacto', 'murciélago', 'humedad', 'profundo', 'explorar', 'frío', 'piedras', 'antiguo', 'secreto', 'formación', 'estrecho', 'interior'],
  PIEL: ['cuerpo', 'tacto', 'órgano', 'suave', 'proteger', 'cubrir', 'tacto', 'color', 'arrugas', 'sol', 'cuidar', 'humana', 'sensible', 'dermatología', 'sentir'],
  TECHO: ['cubrir', 'casa', 'lluvia', 'proteger', 'alto', 'estructura', 'tejas', 'ático', 'interior', 'seguridad', 'vigas', 'aislamiento', 'goteras', 'cielo', 'plano'],
  SECRETO: ['oculto', 'guardar', 'silencio', 'confianza', 'misterio', 'nadie', 'saber', 'revelar', 'promesa', 'íntimo', 'privado', 'esconder', 'importante', 'reservado', 'historia'],
  MÉDICO: ['curar', 'hospital', 'enfermedad', 'paciente', 'diagnóstico', 'estetoscopio', 'salud', 'receta', 'cirugía', 'consultorio', 'tratamiento', 'emergencia', 'cuerpo', 'cuidado', 'medicamento'],
  PLAYA: ['arena', 'mar', 'sol', 'olas', 'verano', 'vacaciones', 'sombrilla', 'bikini', 'tostarse', 'palmera', 'gafas', 'horizonte', 'agua', 'relajación', 'conchas'],
  ÁRBOL: ['hojas', 'ramas', 'tronco', 'raíces', 'bosque', 'naturaleza', 'sombra', 'fruto', 'oxígeno', 'madera', 'verde', 'crecimiento', 'altura', 'plantar', 'nido'],
  MÚSICA: ['sonido', 'ritmo', 'melodía', 'canción', 'instrumentos', 'bailar', 'armonía', 'voz', 'concierto', 'emoción', 'escuchar', 'auriculares', 'género', 'artista', 'creatividad'],
  ORDENADOR: ['pantalla', 'teclado', 'ratón', 'internet', 'software', 'procesador', 'información', 'datos', 'código', 'digital', 'memoria', 'archivo', 'navegar', 'electricidad', 'programa'],
  FÚTBOL: ['balón', 'portería', 'equipo', 'gol', 'jugador', 'cancha', 'árbitro', 'partido', 'hincha', 'correr', 'deporte', 'entrenador', 'táctica', 'penalti', 'liga'],
  CIUDAD: ['edificios', 'calles', 'tráfico', 'gente', 'luces', 'rascacielos', 'metro', 'contaminación', 'alcalde', 'parque', 'negocios', 'ruido', 'acera', 'asfalto', 'multitud'],
  TIEMPO: ['horas', 'minutos', 'segundos', 'reloj', 'pasado', 'futuro', 'calendario', 'prisa', 'duración', 'puntualidad', 'día', 'noche', 'esperar', 'momento', 'eterno'],
  ELEFANTE: ['trompa', 'grande', 'orejas', 'África', 'gris', 'paquidermo', 'sabana', 'colmillos', 'manada', 'herbívoro', 'memoria', 'pesar', 'fuerte', 'lento', 'animal'],
  PASTEL: ['dulce', 'cumpleaños', 'horno', 'azúcar', 'harina', 'chocolate', 'crema', 'velas', 'postre', 'repostería', 'cortar', 'celebración', 'receta', 'vainilla', 'comer'],
  BIBLIOTECA: ['libros', 'leer', 'silencio', 'estanterías', 'conocimiento', 'préstamo', 'cultura', 'documentos', 'investigación', 'ordenador', 'mesa', 'estudiar', 'bibliotecario', 'ficción', 'historia'],
};

// Generar palabra clave aleatoria

// Generar fragmentos para cada jugador
const generateFragments = (keyword, players) => {
  const fragments = {};
  const availableFragments = [...KEYWORD_POOL[keyword]];
  
  players.forEach(player => {
    if (player.role === ROLES.ASESINO && player.isAlive) {
      // El asesino vivo no recibe fragmento
      fragments[player.id] = null;
    } else {
      // Los demás reciben fragmentos aleatorios
      if (availableFragments.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableFragments.length);
        fragments[player.id] = availableFragments.splice(randomIndex, 1)[0];
      } else {
        // Si se agotan los fragmentos, usar uno aleatorio del pool original
        const originalFragments = KEYWORD_POOL[keyword];
        fragments[player.id] = originalFragments[Math.floor(Math.random() * originalFragments.length)];
      }
    }
  });
  
  return fragments;
};

// Calcular el ganador de una votación
const calculateVoteWinner = (votes, players) => {
  const aliveIds = players.filter(p => p.isAlive).map(p => p.id);
  const voteCounts = {};

  Object.values(votes).forEach(vote => {
    if (aliveIds.includes(vote)) {
      voteCounts[vote] = (voteCounts[vote] || 0) + 1;
    }
  });

  // Encontrar el más votado
  let maxVotes = 0;
  let winners = [];

  Object.entries(voteCounts).forEach(([playerId, count]) => {
    if (count > maxVotes) {
      maxVotes = count;
      winners = [playerId];
    } else if (count === maxVotes) {
      winners.push(playerId);
    }
  });

  // En caso de empate, no se elimina a nadie
  if (winners.length > 1) {
    return null;
  }

  return winners[0] || null;
};

// Verificar si un jugador puede usar su habilidad
// Verificar si un jugador puede usar su habilidad
const canUseAbility = (player, abilityUsages, thiefInfo = null) => {
  if (!player.abilities) return false;

  // Si es ladrón y ha robado una habilidad, usa su propio contador de usos
  if (thiefInfo && thiefInfo.stolenAbility) {
    // El contador de usos del ladrón es abilityUsages[player.id]
    const usedByThief = abilityUsages[player.id] || 0;
    const maxUses = thiefInfo.stolenAbility.uses;
    return maxUses === -1 || usedByThief < maxUses;
  }

  const used = abilityUsages[player.id] || 0;
  const maxUses = player.abilities.uses;
  return maxUses === -1 || used < maxUses;
};

// Obtener jugadores vivos
const getAlivePlayers = (players) => {
  return players.filter(p => p.isAlive);
};

// Obtener jugadores muertos
const getDeadPlayers = (players) => {
  return players.filter(p => p.isDead);
};

// Verificar si el juego ha terminado
const checkGameEnd = (players) => {
  const alive = getAlivePlayers(players);
  const aliveEvil = alive.filter(p => p.role === ROLES.ASESINO || p.role === ROLES.SABOTEADOR);
  const aliveGood = alive.filter(p => p.role !== ROLES.ASESINO && p.role !== ROLES.SABOTEADOR);
  
  // Los invitados ganan si no quedan malvados
  if (aliveEvil.length === 0) {
    return { gameOver: true, winner: 'INVITADOS' };
  }
  
  // Los malvados ganan si igualan o superan a los buenos
  if (aliveEvil.length >= aliveGood.length) {
    return { gameOver: true, winner: 'MALVADOS' };
  }
  
  return { gameOver: false, winner: null };
};

// Formatear tiempo para el timer
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Obtener el nombre de la fase actual
const getPhaseName = (phase) => {
  const phaseNames = {
    [GAME_PHASES.INTRO]: 'Introducción',
    [GAME_PHASES.SETUP]: 'Preparación',
    [GAME_PHASES.ROLE_REVEAL]: 'Revelación de Roles',
    [GAME_PHASES.DAY]: 'Debate Diurno', 
    [GAME_PHASES.LEADER_VOTE]: 'Votación de Líder',
    [GAME_PHASES.WORD_GUESS]: 'Adivinanza de Palabra',
    [GAME_PHASES.ELIMINATION_VOTE]: 'Votación de Eliminación',
    [GAME_PHASES.NIGHT]: 'Acciones Nocturnas',
    [GAME_PHASES.GAME_OVER]: 'Fin del Juego'
  };
  
  return phaseNames[phase] || 'Fase Desconocida';
};
module.exports = { resetUsedKeywords, generateKeyword, ROLES, GAME_PHASES, ROLE_INFO, generateFragments, calculateVoteWinner, canUseAbility, getAlivePlayers, getDeadPlayers, checkGameEnd, formatTime, getPhaseName };
