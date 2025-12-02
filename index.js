// Utilidades para el reparto de roles (lógica igual que el modo normal)
const { generateKeyword, generateFragments } = require('./gameLogic');

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

const ROLE_INFO = {
  [ROLES.SOMBRA]: { team: 'NEUTRAL' },
  [ROLES.ASESINO]: { team: 'MALVADO' },
  [ROLES.SABOTEADOR]: { team: 'MALVADO' },
  [ROLES.INVITADO]: { team: 'PUEBLO' },
  [ROLES.PROTECTOR]: { team: 'PUEBLO' },
  [ROLES.MEDICO]: { team: 'PUEBLO' },
  [ROLES.DETECTIVE]: { team: 'PUEBLO' },
  [ROLES.LADRON]: { team: 'PUEBLO' },
  [ROLES.SABIO]: { team: 'PUEBLO' },
  [ROLES.VIDENTE]: { team: 'PUEBLO' },
  [ROLES.DIPLOMATICO]: { team: 'PUEBLO' }
};

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function assignRoles(numPlayers) {
  // Reparto igual que el modo normal:
  // - Siempre 1 ASESINO
  // - Siempre al menos 1 INVITADO
  // - Añadir roles con habilidades aleatorios hasta completar
  // - Sin SABOTEADOR inicial (se recluta más adelante)
  const rolesWithAbilities = [
    ROLES.PROTECTOR,
    ROLES.MEDICO,
    ROLES.DETECTIVE,
    ROLES.LADRON,
    ROLES.SABIO,
    ROLES.VIDENTE,
    ROLES.DIPLOMATICO
  ];

  const rolesToAssign = [];
  rolesToAssign.push(ROLES.ASESINO); // siempre
  rolesToAssign.push(ROLES.INVITADO); // al menos uno

  const remainingSlots = numPlayers - 2; // ya contamos asesino e invitado
  const shuffledAbilityRoles = [...rolesWithAbilities].sort(() => Math.random() - 0.5);
  const maxAbilityRoles = Math.min(remainingSlots, shuffledAbilityRoles.length);
  for (let i = 0; i < maxAbilityRoles; i++) {
    rolesToAssign.push(shuffledAbilityRoles[i]);
  }
  // Completar con invitados
  const remainingInvitados = numPlayers - rolesToAssign.length;
  for (let i = 0; i < remainingInvitados; i++) {
    rolesToAssign.push(ROLES.INVITADO);
  }

  return shuffle(rolesToAssign);
}
// Servidor básico de lobby multijugador para el juego
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Estructura de salas: { [roomId]: { players: [{ id: socketId, name }], host: socketId } }
const rooms = {};

// Mapa de reconexión: { playerId: { roomId, playerData, disconnectTime } }
const disconnectedPlayers = {};

// Tiempo máximo para reconectar (30 segundos)
const RECONNECT_TIMEOUT = 30000;

io.on('connection', (socket) => {
  console.log(`Socket conectado: ${socket.id}`);

  // Intentar reconexión
  socket.on('attemptReconnect', ({ playerId, playerName, roomId }, callback) => {
    console.log(`Intento de reconexión: playerId=${playerId}, playerName=${playerName}, roomId=${roomId}`);
    
    const disconnectedInfo = disconnectedPlayers[playerId];
    const room = rooms[roomId];

    if (!room) {
      console.log('Sala no encontrada:', roomId);
      return callback({ success: false, error: 'Sala no encontrada' });
    }

    // Estrategia de búsqueda:
    // 1. Buscar por playerName (más confiable en caso de F5)
    // 2. Buscar por playerId (para reconexiones normales)
    let playerIndex = -1;
    
    if (playerName) {
      console.log('Buscando por nombre:', playerName);
      playerIndex = room.players.findIndex(p => p.name === playerName);
    }
    
    if (playerIndex === -1 && playerId) {
      console.log('Buscando por ID:', playerId);
      playerIndex = room.players.findIndex(p => p.id === playerId);
    }
    
    if (playerIndex === -1) {
      console.log('Jugador no encontrado en la sala. Jugadores en sala:', room.players.map(p => ({ id: p.id, name: p.name })));
      return callback({ success: false, error: 'Jugador no encontrado en la sala' });
    }

    // Actualizar el socket ID del jugador
    const player = room.players[playerIndex];
    const oldSocketId = player.id;
    console.log(`Actualizando jugador ${player.name}: ${oldSocketId} -> ${socket.id}`);
    
    player.id = socket.id;
    player.connected = true;
    
    // Si era el host, actualizar
    if (room.host === oldSocketId) {
      room.host = socket.id;
      console.log('Host actualizado');
    }

    // Si era el líder actual, actualizar
    if (room.leader === oldSocketId) {
      room.leader = socket.id;
      console.log('Líder actualizado:', oldSocketId, '->', socket.id);
    }

    // Actualizar referencias en fragments si existen
    if (room.fragments && room.fragments[oldSocketId] !== undefined) {
      room.fragments[socket.id] = room.fragments[oldSocketId];
      delete room.fragments[oldSocketId];
    }
    
    // Actualizar referencias en abilityUsages si existen
    if (room.abilityUsages && room.abilityUsages[oldSocketId] !== undefined) {
      room.abilityUsages[socket.id] = room.abilityUsages[oldSocketId];
      delete room.abilityUsages[oldSocketId];
    }

    // Actualizar referencias en nextPhaseVotes si existen
    if (room.nextPhaseVotes && room.nextPhaseVotes[oldSocketId] !== undefined) {
      room.nextPhaseVotes[socket.id] = room.nextPhaseVotes[oldSocketId];
      delete room.nextPhaseVotes[oldSocketId];
    }

    // Actualizar referencias en nightActions si existen
    if (room.nightActions && room.nightActions[oldSocketId] !== undefined) {
      room.nightActions[socket.id] = room.nightActions[oldSocketId];
      delete room.nightActions[oldSocketId];
    }

    // Actualizar referencias en nightSummaryReady (Set) si existen
    if (room.nightSummaryReady && room.nightSummaryReady.has(oldSocketId)) {
      room.nightSummaryReady.delete(oldSocketId);
      room.nightSummaryReady.add(socket.id);
      console.log('nightSummaryReady actualizado para reconexión');
    }

    // Actualizar referencias en nightActionDone si existen
    if (room.nightActionDone) {
      if (room.nightActionDone instanceof Set) {
        if (room.nightActionDone.has(oldSocketId)) {
          room.nightActionDone.delete(oldSocketId);
          room.nightActionDone.add(socket.id);
        }
      } else if (room.nightActionDone[oldSocketId] !== undefined) {
        room.nightActionDone[socket.id] = room.nightActionDone[oldSocketId];
        delete room.nightActionDone[oldSocketId];
      }
    }

    // Actualizar referencias en nightReady (Set usado por nightActionDone) si existen
    if (room.nightReady && room.nightReady.has(oldSocketId)) {
      room.nightReady.delete(oldSocketId);
      room.nightReady.add(socket.id);
      console.log('nightReady actualizado para reconexión');
    }

    // Actualizar referencias en leaderVotes si existen
    if (room.leaderVotes && room.leaderVotes[oldSocketId] !== undefined) {
      room.leaderVotes[socket.id] = room.leaderVotes[oldSocketId];
      delete room.leaderVotes[oldSocketId];
      console.log('leaderVotes actualizado para reconexión');
    }

    // Unir al socket a la sala
    socket.join(roomId);

    // Limpiar de desconectados
    if (disconnectedInfo) {
      delete disconnectedPlayers[playerId];
    }

    console.log(`Reconexión exitosa: ${player.name} (${oldSocketId} -> ${socket.id})`);
    console.log(`Fase actual: ${room.currentPhase || 'lobby'}`);

    // Enviar estado completo del juego
    const response = {
      success: true,
      roomData: room,
      playerData: player,
      currentPhase: room.currentPhase || 'lobby',
      fragment: room.fragments ? room.fragments[socket.id] : null,
      role: player.role || null,
      roomId: roomId,
      leaderId: room.leader || null, // Enviar el líder actual si existe
      wordGuessResult: room.wordGuessResult || null, // Enviar resultado de word-guess si existe
      hasVotedNextPhase: room.nextPhaseVotes && room.nextPhaseVotes[oldSocketId] !== undefined // Si ya votó en next phase
    };
    
    callback(response);

    // Notificar a todos
    io.to(roomId).emit('roomUpdate', room);
    io.to(roomId).emit('playerReconnected', { playerId: socket.id, name: player.name });
  });

  // Crear sala
  socket.on('createRoom', (callback) => {
    const roomId = Math.random().toString(36).substr(2, 4).toUpperCase();
    rooms[roomId] = { 
      players: [{ id: socket.id, name: null, connected: true }], 
      host: socket.id,
      createdAt: Date.now()
    };
    socket.join(roomId);
    callback({ roomId });
    io.to(roomId).emit('roomUpdate', rooms[roomId]);
  });

  // Unirse a sala
  socket.on('joinRoom', (roomId, callback) => {
    if (rooms[roomId]) {
      rooms[roomId].players.push({ id: socket.id, name: null, connected: true });
      socket.join(roomId);
      callback({ success: true });
      io.to(roomId).emit('roomUpdate', rooms[roomId]);
    } else {
      callback({ success: false, error: 'Sala no encontrada' });
    }
  });

  // Establecer nombre de jugador
  socket.on('setPlayerName', ({ roomId, name }) => {
    if (rooms[roomId]) {
      const player = rooms[roomId].players.find(p => p.id === socket.id);
      if (player) {
        player.name = name;
        player.ready = false; // inicializar flag de listo cuando pone nombre
        io.to(roomId).emit('roomUpdate', rooms[roomId]);
      }
    }
  });

  // Salir de sala/desconexión
  
      // Expulsar jugador (solo host)
  socket.on('kickPlayer', ({ roomId, playerId }) => {
    const room = rooms[roomId];
    if (room && room.host === socket.id) {
      // Verificar que no se expulse a sí mismo
      if (playerId === room.host) return;

      // Filtrar jugador
      room.players = room.players.filter(p => p.id !== playerId);
      
      // Notificar al jugador expulsado
      io.to(playerId).emit('playerKicked');
      
      // Hacer que el socket abandone la sala
      const targetSocket = io.sockets.sockets.get(playerId);
      if (targetSocket) {
        targetSocket.leave(roomId);
      }

      // Actualizar sala
      io.to(roomId).emit('roomUpdate', room);
    }
  });

  // DEBUG: Llenar sala con bots
  socket.on('debugFillRoom', ({ roomId }) => {
    const room = rooms[roomId];
    if (room) {
      const currentCount = room.players.length;
      const targetCount = 9;
      for (let i = currentCount; i < targetCount; i++) {
        room.players.push({
          id: `bot-${Math.random().toString(36).substr(2, 9)}`,
          name: `Bot ${i + 1}`,
          isBot: true,
          ready: false
        });
      }
      io.to(roomId).emit('roomUpdate', room);
    }
  });

  // Iniciar partida: repartir roles y enviar a cada jugador
  socket.on('startGame', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;
    const players = room.players;
    const roles = assignRoles(players.length);
    
    // Asignar roles a los objetos jugador
    players.forEach((player, idx) => {
      player.role = roles[idx];
      player.initialRole = roles[idx]; // Guardar rol inicial
      player.ready = false; // reiniciar readiness en fase de rol
      player.isAlive = true;
    });
    room.roles = roles;

    // Generar palabra y fragmentos
    const keyword = generateKeyword();
    const fragments = generateFragments(keyword, players);
    room.keyword = keyword;
    room.fragments = fragments;
    
    // Inicializar usos de habilidades
    room.abilityUsages = {};
    room.assassinSkippedCount = 0;
    room.saboteurRecruited = false;
    room.currentPhase = 'role-reveal'; // Establecer fase actual

    // Enviar rol y fragmento a cada jugador
    players.forEach((player) => {
      if (player.isBot) {
        player.ready = true; // Bots listos automáticamente
      } else {
        // El Asesino recibe la palabra secreta completa, no un fragmento
        const fragmentToSend = player.role === 'ASESINO' ? keyword : (fragments[player.id] || null);
        console.log(`Sending role to ${player.name} (${player.role}): fragment=${fragmentToSend}`);
        io.to(player.id).emit('roleAssigned', { 
          role: player.role, 
          name: player.name, 
          roomId,
          fragment: fragmentToSend
        });
      }
    });
  });

  // Solicitar info de sala (para saber si soy host)
  socket.on('requestRoomInfo', ({ roomId }) => {
    if (rooms[roomId]) {
      socket.emit('roomUpdate', rooms[roomId]);
    }
  });

  // Solicitar estado de word-guess (para reconexión)
  socket.on('requestWordGuessState', ({ roomId }) => {
    const room = rooms[roomId];
    if (room && room.currentPhase === 'word-guess') {
      const response = {
        leaderId: room.leader,
        isLeader: room.leader === socket.id, // Indicar si este socket es el líder
        result: room.wordGuessResult || null,
        hasVotedNextPhase: room.nextPhaseVotes && room.nextPhaseVotes[socket.id] !== undefined
      };
      console.log('Enviando estado de word-guess:', { 
        socketId: socket.id, 
        leaderId: room.leader, 
        isLeader: response.isLeader,
        hasResult: !!response.result,
        resultContent: response.result // Log completo del resultado
      });
      socket.emit('wordGuessStateUpdate', response);
    }
  });

  // Solicitar estado de night-phase (para reconexión)
  socket.on('requestNightPhaseState', ({ roomId }) => {
    const room = rooms[roomId];
    if (room && room.currentPhase === 'night-phase') {
      // Verificar si ya realizó acción nocturna
      const hasActed = room.nightActions && room.nightActions[socket.id] !== undefined;
      
      // Verificar si ya confirmó el resumen (nightSummaryReady es un Set)
      const summaryConfirmed = room.nightSummaryReady && room.nightSummaryReady.has(socket.id);
      
      // Verificar si ya hizo clic en continuar (nightReady es un Set)
      const isReadyToAdvance = room.nightReady && room.nightReady.has(socket.id);
      
      const response = {
        hasActed,
        nightResults: room.nightResults || null,
        summaryConfirmed: summaryConfirmed || false,
        isReadyToAdvance: isReadyToAdvance || false
      };
      console.log('Enviando estado de night-phase:', response);
      socket.emit('nightPhaseStateUpdate', response);
    }
  });

  // Solicitar estado de leader-vote (para reconexión)
  socket.on('requestLeaderVoteState', ({ roomId }) => {
    const room = rooms[roomId];
    if (room && room.currentPhase === 'leader-vote') {
      // Verificar si ya votó
      const hasVoted = room.leaderVotes && room.leaderVotes[socket.id] && room.leaderVotes[socket.id].length > 0;
      
      const response = {
        hasVoted: hasVoted || false,
        voteResult: room.leaderVoteResult || null
      };
      console.log('Enviando estado de leader-vote:', response);
      socket.emit('leaderVoteStateUpdate', response);
    }
  });

  // Terminar fase de día (solo host)
  socket.on('endDayPhase', ({ roomId }) => {
    const room = rooms[roomId];
    if (room && room.host === socket.id) {
      // Verificar si ya hay un líder designado (por el Diplomático)
      if (room.leader) {
        // Saltar votación y pasar directo a WordGuess
        room.currentPhase = 'word-guess'; // Actualizar fase
        io.to(roomId).emit('wordGuessStart', { leaderId: room.leader });
        
        // Si el líder designado es un bot, adivina automáticamente
        const leader = room.players.find(p => p.id === room.leader);
        if (leader && leader.isBot) {
          setTimeout(() => {
            const word = room.keyword; // Siempre acierta
            room.wordGuessResult = {
              word,
              isCorrect: true,
              leaderId: leader.id,
              correctWord: room.keyword
            };
            io.to(roomId).emit('wordGuessResult', room.wordGuessResult);

            // Inicializar votación de siguiente fase (para bots auto-guess)
            room.nextPhaseVotes = {};
            setTimeout(() => {
               const bots = room.players.filter(p => p.isBot);
               bots.forEach(bot => {
                  const choice = Math.random() > 0.5 ? 'elimination' : 'night';
                  handleNextPhaseVote(roomId, bot.id, choice);
               });
            }, 2000);
          }, 3000);
        }
      } else {
        // Flujo normal: Votación de líder
        room.currentPhase = 'leader-vote'; // Actualizar fase
        io.to(roomId).emit('leaderVoteStart');

        // Bots votan automáticamente después de un delay
        setTimeout(() => {
          const bots = room.players.filter(p => p.isBot && p.isAlive);
          bots.forEach(bot => {
            // Voto aleatorio a cualquier jugador vivo
            const alivePlayers = room.players.filter(p => p.isAlive);
            const randomTarget = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
            
            // Simular envío de voto
            handleLeaderVote(roomId, bot.id, randomTarget.id);
          });
        }, 2000);
      }
    }
  });

  const checkGameOver = (roomId) => {
    const room = rooms[roomId];
    if (!room) return false;

    const alivePlayers = room.players.filter(p => p.isAlive);
    const malvados = alivePlayers.filter(p => ROLE_INFO[p.role]?.team === 'MALVADO');
    const buenos = alivePlayers.filter(p => ROLE_INFO[p.role]?.team === 'PUEBLO');

    // 1. Ganan los buenos: Todos los malvados muertos
    if (malvados.length === 0) {
      room.currentPhase = 'game-over'; // Actualizar fase
      io.to(roomId).emit('gameOver', {
        winner: 'PUEBLO',
        reason: 'Todos los malvados han sido eliminados.',
        players: room.players,
        day: room.day
      });
      return true;
    }

    // 2. Ganan los malvados: Igual o más malvados que buenos
    if (malvados.length >= buenos.length) {
      room.currentPhase = 'game-over'; // Actualizar fase
      io.to(roomId).emit('gameOver', {
        winner: 'MALVADOS',
        reason: 'Los malvados han igualado o superado en número a los inocentes.',
        players: room.players,
        day: room.day
      });
      return true;
    }

    return false;
  };

  // Función auxiliar para procesar votos (usada por socket y bots)
  const handleLeaderVote = (roomId, voterId, candidateId) => {
    const room = rooms[roomId];
    if (!room) return;

    // Verificar si el votante está vivo
    const voter = room.players.find(p => p.id === voterId);
    if (!voter || !voter.isAlive) return;

    // Inicializar estructura de votos si no existe
    if (!room.leaderVotes) {
      room.leaderVotes = {}; // Estructura: { voterId: [candidateId1, candidateId2] }
    }

    // Inicializar array de votos para este votante si no existe
    if (!room.leaderVotes[voterId]) {
      room.leaderVotes[voterId] = [];
    }

    // Verificar cuántos votos puede emitir
    const maxVotes = (room.doubleVotePlayer === voterId) ? 2 : 1;
    
    // Si ya votó el máximo de veces, ignorar
    if (room.leaderVotes[voterId].length >= maxVotes) return;

    // Registrar voto
    room.leaderVotes[voterId].push(candidateId);

    // Verificar si todos los vivos han completado sus votos
    const alivePlayers = room.players.filter(p => p.isAlive);
    
    // Contar cuántos jugadores han completado sus votos
    const completedVoters = alivePlayers.filter(p => {
      const votes = room.leaderVotes[p.id] || [];
      const required = (room.doubleVotePlayer === p.id) ? 2 : 1;
      return votes.length === required;
    });

    if (completedVoters.length === alivePlayers.length) {
      // Calcular ganador
      const voteCounts = {};
      
      // Iterar sobre todos los votos registrados
      Object.entries(room.leaderVotes).forEach(([voterId, candidates]) => {
        candidates.forEach(targetId => {
           voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
        });
      });

      let winnerId = null;
      let maxVotes = 0;
      let isTie = false;

      Object.entries(voteCounts).forEach(([id, count]) => {
        if (count > maxVotes) {
          maxVotes = count;
          winnerId = id;
          isTie = false;
        } else if (count === maxVotes) {
          isTie = true;
          winnerId = null;
        }
      });

      const winner = winnerId ? room.players.find(p => p.id === winnerId) : null;
      const result = {
        winner: winner ? { id: winner.id, name: winner.name } : null,
        tie: isTie,
        votes: voteCounts,
        detailedVotes: room.leaderVotes // Ahora es un mapa de arrays
      };

      // Guardar resultado en la sala
      room.leaderVoteResult = result;

      // Emitir resultado a todos
      io.to(roomId).emit('leaderVoteResult', result);

      // Si hay empate, iniciar votación de desempate (siguiente fase)
      if (isTie) {
         room.nextPhaseVotes = {};
         setTimeout(() => {
            const bots = room.players.filter(p => p.isBot);
            bots.forEach(bot => {
               const choice = Math.random() > 0.5 ? 'elimination' : 'night';
               handleNextPhaseVote(roomId, bot.id, choice);
            });
         }, 2000);
      }
    }
  };

  // Host solicita avanzar tras ver resultados de votación líder
  socket.on('proceedAfterLeaderVote', ({ roomId, action }) => {
    const room = rooms[roomId];
    if (room && room.host === socket.id && room.leaderVoteResult) {
      if (room.leaderVoteResult.tie) {
        if (action === 'night') {
          room.currentPhase = 'night-phase'; // Actualizar fase
          io.to(roomId).emit('nightPhaseStart');
          handleBotNightActions(roomId);
        } else {
          startEliminationVote(roomId);
        }
      } else {
        const leaderId = room.leaderVoteResult.winner.id;
        room.currentPhase = 'word-guess'; // Actualizar fase
        io.to(roomId).emit('wordGuessStart', { leaderId });

        // Si el líder es un bot, adivina automáticamente la palabra correcta
        const leader = room.players.find(p => p.id === leaderId);
        if (leader && leader.isBot) {
          setTimeout(() => {
            const word = room.keyword; // Siempre acierta
            room.wordGuessResult = {
              word,
              isCorrect: true,
              leaderId: leader.id,
              correctWord: room.keyword
            };
            io.to(roomId).emit('wordGuessResult', room.wordGuessResult);
          }, 3000);
        }
      }
    }
  });

  // Función para iniciar votación de eliminación (usada desde varios puntos)
  const startEliminationVote = (roomId) => {
    const room = rooms[roomId];
    if (!room) return;
    
    room.currentPhase = 'elimination-vote'; // Actualizar fase
    io.to(roomId).emit('eliminationVoteStart');

    // Bots votan automáticamente
    setTimeout(() => {
      const bots = room.players.filter(p => p.isBot && p.isAlive);
      bots.forEach(bot => {
        const alivePlayers = room.players.filter(p => p.isAlive && p.id !== bot.id);
        if (alivePlayers.length > 0) {
          const randomTarget = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
          handleEliminationVote(roomId, bot.id, randomTarget.id);
        }
      });
    }, 2000);
  };

  // Función auxiliar para procesar votos de eliminación
  const handleEliminationVote = (roomId, voterId, candidateId) => {
    const room = rooms[roomId];
    if (!room) return;

    // Verificar si el votante está vivo
    const voter = room.players.find(p => p.id === voterId);
    if (!voter || !voter.isAlive) return;

    if (!room.eliminationVotes) {
      room.eliminationVotes = {}; // Estructura: { voterId: [candidateId1, candidateId2] }
    }

    if (!room.eliminationVotes[voterId]) {
      room.eliminationVotes[voterId] = [];
    }

    // Verificar cuántos votos puede emitir
    const maxVotes = (room.doubleVotePlayer === voterId) ? 2 : 1;
    
    // Si ya votó el máximo de veces, ignorar
    if (room.eliminationVotes[voterId].length >= maxVotes) return;

    room.eliminationVotes[voterId].push(candidateId);

    const alivePlayers = room.players.filter(p => p.isAlive);
    
    // Contar cuántos jugadores han completado sus votos
    const completedVoters = alivePlayers.filter(p => {
      const votes = room.eliminationVotes[p.id] || [];
      const required = (room.doubleVotePlayer === p.id) ? 2 : 1;
      return votes.length === required;
    });

    if (completedVoters.length === alivePlayers.length) {
      // Calcular eliminado
      const voteCounts = {};
      
      Object.entries(room.eliminationVotes).forEach(([voterId, candidates]) => {
        candidates.forEach(targetId => {
           voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
        });
      });

      let eliminatedId = null;
      let maxVotes = 0;
      let isTie = false;

      Object.entries(voteCounts).forEach(([id, count]) => {
        if (count > maxVotes) {
          maxVotes = count;
          eliminatedId = id;
          isTie = false;
        } else if (count === maxVotes) {
          isTie = true;
          eliminatedId = null;
        }
      });

      const eliminated = eliminatedId ? room.players.find(p => p.id === eliminatedId) : null;
      
      // Si hay eliminado, marcarlo como muerto
      if (eliminated) {
        eliminated.isAlive = false;
        eliminated.isDead = true; // flag adicional por si acaso
        eliminated.deathNight = room.day || 1;
        room.lastDeath = { id: eliminated.id, role: eliminated.role };

        // Convertir a SOMBRA
        eliminated.previousRole = eliminated.role;
        eliminated.role = ROLES.SOMBRA;
      }

      const result = {
        eliminated: eliminated ? { id: eliminated.id, name: eliminated.name } : null,
        tie: isTie,
        votes: voteCounts,
        detailedVotes: room.eliminationVotes
      };

      room.eliminationVoteResult = result;
      io.to(roomId).emit('eliminationVoteResult', result);

      // Verificar fin del juego tras la eliminación
      if (eliminated) {
         checkGameOver(roomId);
      }
    }
  };

  // Votación de eliminación (cliente real)
  socket.on('submitEliminationVote', ({ roomId, candidateId }) => {
    handleEliminationVote(roomId, socket.id, candidateId);
  });

  // Host solicita avanzar tras ver resultados de eliminación
  socket.on('proceedAfterEliminationVote', ({ roomId }) => {
    const room = rooms[roomId];
    if (room && room.host === socket.id) {
      room.currentPhase = 'night-phase'; // Actualizar fase
      io.to(roomId).emit('nightPhaseStart');
      handleBotNightActions(roomId);
    }
  });

  // Adivinar palabra (solo líder)
  socket.on('submitWordGuess', ({ roomId, word }) => {
    const room = rooms[roomId];
    if (room) {
      const isCorrect = word.trim().toLowerCase() === room.keyword.toLowerCase();
      room.wordGuessResult = {
        word,
        isCorrect,
        leaderId: socket.id,
        correctWord: room.keyword
      };
      
      console.log('Word guess result guardado:', room.wordGuessResult);

      // Verificar victoria del Asesino
      const leader = room.players.find(p => p.id === socket.id);
      if (isCorrect && leader && leader.role === ROLES.ASESINO) {
         room.currentPhase = 'game-over'; // Actualizar fase
         io.to(roomId).emit('gameOver', { 
            winner: 'MALVADOS', 
            reason: 'El Asesino ha sido elegido Líder y ha acertado la palabra secreta.',
            players: room.players,
            day: room.day || 1
         });
      } else {
         io.to(roomId).emit('wordGuessResult', room.wordGuessResult);
         
         // Inicializar votación de siguiente fase
         room.nextPhaseVotes = {};
         
         // Bots votan aleatoriamente tras un delay
         setTimeout(() => {
            const bots = room.players.filter(p => p.isBot);
            bots.forEach(bot => {
               const choice = Math.random() > 0.5 ? 'elimination' : 'night';
               handleNextPhaseVote(roomId, bot.id, choice);
            });
         }, 2000);
      }
    }
  });

  const handleNextPhaseVote = (roomId, voterId, choice) => {
    const room = rooms[roomId];
    if (!room) return;

    if (!room.nextPhaseVotes) room.nextPhaseVotes = {};
    
    // Registrar voto (sobrescribe si ya votó, aunque el cliente lo bloquea)
    room.nextPhaseVotes[voterId] = choice;

    // Verificar si todos han votado (incluidos muertos/sombras)
    const allPlayersCount = room.players.length;
    const votesCount = Object.keys(room.nextPhaseVotes).length;

    if (votesCount >= allPlayersCount) {
       // Contar votos
       let eliminationVotes = 0;
       let nightVotes = 0;

       Object.values(room.nextPhaseVotes).forEach(v => {
          if (v === 'elimination') eliminationVotes++;
          else if (v === 'night') nightVotes++;
       });

       // Decidir ganador (Empate -> Night)
       if (eliminationVotes > nightVotes) {
          startEliminationVote(roomId);
       } else {
          // Night gana o empate
          io.to(roomId).emit('nightPhaseStart');
          handleBotNightActions(roomId);
       }
    }
  };

  socket.on('voteNextPhase', ({ roomId, choice }) => {
     handleNextPhaseVote(roomId, socket.id, choice);
  });

  socket.on('voteNextPhaseFromLeaderTie', ({ roomId, choice }) => {
     handleNextPhaseVote(roomId, socket.id, choice);
  });

  // Host avanza desde WordGuess a Elimination
  socket.on('proceedToElimination', ({ roomId }) => {
    const room = rooms[roomId];
    if (room && room.host === socket.id) {
      startEliminationVote(roomId);
    }
  });

  // Host avanza desde WordGuess a Night (Fase de Sueños)
  socket.on('proceedToNightFromWordGuess', ({ roomId }) => {
    const room = rooms[roomId];
    if (room && room.host === socket.id) {
      io.to(roomId).emit('nightPhaseStart');
      handleBotNightActions(roomId);
    }
  });

  // Votación de líder (cliente real)
  socket.on('submitLeaderVote', ({ roomId, candidateId }) => {
    handleLeaderVote(roomId, socket.id, candidateId);
  });

  // Jugador marca que ya vio su rol y está listo
  socket.on('playerReady', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.ready = true;
      const readyCount = room.players.filter(p => p.ready).length;
      io.to(roomId).emit('readyUpdate', { ready: readyCount, total: room.players.length });
      if (readyCount === room.players.length) {
        room.currentPhase = 'day-phase'; // Actualizar fase
        io.to(roomId).emit('dayPhaseStart');
      }
    }
  });

  // --- NIGHT PHASE LOGIC ---

  const handleBotNightActions = (roomId) => {
    const room = rooms[roomId];
    if (!room) return;
    
    const bots = room.players.filter(p => p.isBot && p.isAlive);
    const wordCorrect = room.wordGuessResult?.isCorrect;

    bots.forEach(bot => {
      let canAct = false;
      if (bot.role === ROLES.ASESINO) canAct = true;
      else if (wordCorrect) {
         const activeRoles = [ROLES.PROTECTOR, ROLES.MEDICO, ROLES.DETECTIVE, ROLES.LADRON, ROLES.DIPLOMATICO, ROLES.VIDENTE];
         if (activeRoles.includes(bot.role)) canAct = true;
      }

      if (canAct) {
        setTimeout(() => {
           let targetId = null;
           const otherPlayers = room.players.filter(p => p.id !== bot.id && p.isAlive);
           const deadPlayers = room.players.filter(p => !p.isAlive);
           
           if (bot.role === ROLES.MEDICO && deadPlayers.length > 0) {
              targetId = deadPlayers[Math.floor(Math.random() * deadPlayers.length)].id;
           } else if (otherPlayers.length > 0) {
              targetId = otherPlayers[Math.floor(Math.random() * otherPlayers.length)].id;
           }

           if (!room.nightActions) room.nightActions = {};
           room.nightActions[bot.id] = { actionType: 'ABILITY', targetId, role: bot.role };
           
           checkNightPhaseCompletion(roomId);
        }, 2000 + Math.random() * 2000);
      }
    });
  };

  const checkNightPhaseCompletion = (roomId) => {
    const room = rooms[roomId];
    if (!room) return;

    const alivePlayers = room.players.filter(p => p.isAlive);
    
    // Verificar si todos los jugadores vivos han confirmado (ya sea actuando o dando a continuar)
    const pendingPlayers = alivePlayers.filter(p => {
      // Si es bot, asumimos que ya actuó si tenía que hacerlo (manejado en handleBotNightActions)
      // Pero necesitamos una forma de saber si el bot "terminó".
      // Para simplificar, si es bot, no bloquea, a menos que tenga acción pendiente.
      if (p.isBot) {
         // Lógica anterior para bots:
         const wordCorrect = room.wordGuessResult?.isCorrect;
         if (p.role === ROLES.ASESINO) {
            return !room.nightActions || !room.nightActions[p.id];
         }
         if (wordCorrect) {
            const activeRoles = [ROLES.PROTECTOR, ROLES.MEDICO, ROLES.DETECTIVE, ROLES.LADRON, ROLES.DIPLOMATICO, ROLES.VIDENTE];
            if (activeRoles.includes(p.role)) {
               return !room.nightActions || !room.nightActions[p.id];
            }
         }
         return false;
      }

      // Para humanos, deben estar en el set de 'nightReady'
      if (!room.nightReady) return true;
      return !room.nightReady.has(p.id);
    });

    // Emitir estado de espera a todos
    const readyCount = alivePlayers.length - pendingPlayers.length;
    io.to(roomId).emit('nightWaitUpdate', { ready: readyCount, total: alivePlayers.length });

    if (pendingPlayers.length === 0) {
      resolveNightPhase(roomId);
    }
  };

  // Nuevo evento: Jugador confirma que terminó su turno de noche (o no tenía nada que hacer)
  socket.on('nightActionDone', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;
    
    if (!room.nightReady) {
      room.nightReady = new Set();
    }
    room.nightReady.add(socket.id);
    
    checkNightPhaseCompletion(roomId);
  });

  const resolveNightPhase = (roomId) => {
    const room = rooms[roomId];
    if (!room) return;

    const actions = room.nightActions || {};
    let deaths = [];
    let protectedId = null;
    let revivedId = null;
    let newSaboteurId = null;
    
    // Inicializar lista de saboteados
    room.sabotagedPlayerIds = [];
    
    Object.entries(actions).forEach(([pid, action]) => {
      if (action.role === ROLES.SABOTEADOR && action.targetId) {
        // Saboteador deniega fragmento
        room.sabotagedPlayerIds.push(action.targetId);
      }
    });

    Object.entries(actions).forEach(([pid, action]) => {
      if (action.role === ROLES.PROTECTOR && action.targetId) {
        // Protector solo actúa si se acertó la palabra
        if (room.wordGuessResult && room.wordGuessResult.isCorrect) {
          protectedId = action.targetId;
        }
      }
    });

    Object.entries(actions).forEach(([pid, action]) => {
      if (action.role === ROLES.ASESINO) {
        // Verificar si el Saboteador fue líder y acertó (si es así, el Asesino no puede matar)
        const saboteur = room.players.find(p => p.role === ROLES.SABOTEADOR && p.isAlive);
        let saboteurBlockedAssassin = false;
        if (saboteur && room.wordGuessResult && room.wordGuessResult.isCorrect && room.wordGuessResult.leaderId === saboteur.id) {
           saboteurBlockedAssassin = true;
        }

        if (action.actionType === 'ABILITY' && action.targetId) {
          // Asesino mata (si no está bloqueado por Saboteador suicida)
          if (!saboteurBlockedAssassin) {
             if (action.targetId !== protectedId) {
               deaths.push(action.targetId);
             }
          }
          // Resetear contador de noches sin matar
          room.assassinSkippedCount = 0;
        } else if (action.actionType === 'SKIP') {
          // Asesino salta turno
          room.assassinSkippedCount = (room.assassinSkippedCount || 0) + 1;
        } else if (action.actionType === 'CONVERT' && action.targetId) {
          // Asesino recluta saboteador (Efecto retardado al día siguiente)
          if (room.assassinSkippedCount >= 2 && !room.saboteurRecruited) {
             room.pendingSaboteurId = action.targetId;
             room.saboteurRecruited = true;
             room.assassinSkippedCount = 0;
          }
        }
      }
    });

    Object.entries(actions).forEach(([pid, action]) => {
      if (action.role === ROLES.MEDICO && action.targetId) {
        // Médico solo actúa si fue líder y acertó la palabra
        const isMedicoLeader = room.wordGuessResult && 
                               room.wordGuessResult.isCorrect && 
                               room.wordGuessResult.leaderId === pid;
        
        // Verificar usos (máximo 1)
        const uses = room.abilityUsages[pid] || 0;
        
        if (isMedicoLeader && uses < 1) {
          revivedId = action.targetId;
          // Incrementar uso
          room.abilityUsages[pid] = uses + 1;
        }
      }
    });

    // Verificar muerte inevitable del Saboteador si fue líder y acertó
    const saboteur = room.players.find(p => p.role === ROLES.SABOTEADOR && p.isAlive);
    if (saboteur && room.wordGuessResult && room.wordGuessResult.isCorrect && room.wordGuessResult.leaderId === saboteur.id) {
       if (!deaths.includes(saboteur.id)) {
          deaths.push(saboteur.id);
       }
    }

    deaths.forEach(id => {
      const p = room.players.find(pl => pl.id === id);
      if (p) {
        p.isAlive = false;
        p.isDead = true;
        p.deathNight = room.day || 1;
        room.lastDeath = { id: p.id, role: p.role };

        // Convertir a SOMBRA
        p.previousRole = p.role;
        p.role = ROLES.SOMBRA;
      }
    });

    if (revivedId) {
      const p = room.players.find(pl => pl.id === revivedId);
      if (p && !p.isAlive) {
        p.isAlive = true;
        p.isDead = false;
        // Restaurar rol anterior si existe
        if (p.previousRole) {
          p.role = p.previousRole;
          p.previousRole = null;
        }
      }
    }

    // (El reclutamiento de saboteador ahora se procesa al inicio del día siguiente)

    Object.entries(actions).forEach(([pid, action]) => {
      if (action.role === ROLES.LADRON && action.targetId) {
        const thief = room.players.find(p => p.id === pid);
        const target = room.players.find(p => p.id === action.targetId);
        
        // Verificar si el ladrón fue el líder que acertó la palabra
        const isThiefLeader = room.wordGuessResult && 
                              room.wordGuessResult.isCorrect && 
                              room.wordGuessResult.leaderId === pid;
        
        // Verificar usos (máximo 1)
        const uses = room.abilityUsages[pid] || 0;

        if (thief && target && isThiefLeader && uses < 1) {
           // Efecto retardado al día siguiente
           room.pendingThiefAction = { thiefId: pid, targetId: action.targetId };
           // Marcar como usado para que no pueda usarlo de nuevo
           room.abilityUsages[pid] = (room.abilityUsages[pid] || 0) + 1;
        }
      }
    });

    Object.entries(actions).forEach(([pid, action]) => {
      if (action.role === ROLES.DIPLOMATICO && action.targetId) {
        // Verificar si el diplomático fue el líder que acertó la palabra
        const isDiplomatLeader = room.wordGuessResult && 
                                 room.wordGuessResult.isCorrect && 
                                 room.wordGuessResult.leaderId === pid;

        if (isDiplomatLeader) {
          room.nextDayLeader = action.targetId;
        }
      }
    });

    // Lógica del SABIO: Si fue líder y acertó, tiene voto doble mañana
    room.doubleVotePlayer = null;
    if (room.wordGuessResult && room.wordGuessResult.isCorrect && room.wordGuessResult.leaderId) {
      const leader = room.players.find(p => p.id === room.wordGuessResult.leaderId);
      if (leader && leader.role === ROLES.SABIO && leader.isAlive) {
        room.doubleVotePlayer = leader.id;
      }
    }

    // Limpiar estado de 'nightReady' para la próxima noche
    room.nightReady = new Set();

    const results = {
      deaths: deaths.map(id => {
        const p = room.players.find(pl => pl.id === id);
        return { id, name: p.name, role: p.role };
      }),
      revived: revivedId,
      newSaboteur: newSaboteurId,
      sabotagedIds: room.sabotagedPlayerIds, // Enviar IDs de los saboteados
      abilityUsages: room.abilityUsages, // Enviar usos actualizados al cliente
      assassinSkippedCount: room.assassinSkippedCount,
      saboteurRecruited: room.saboteurRecruited
    };

    room.nightResults = results;
    io.to(roomId).emit('nightPhaseResults', results);
    room.nightActions = {};

    // Verificar fin del juego tras la noche (muertes)
    checkGameOver(roomId);
  };

  socket.on('submitNightAction', ({ roomId, actionType, targetId }) => {
    const room = rooms[roomId];
    if (!room) return;

    if (!room.nightActions) {
      room.nightActions = {};
    }

    const player = room.players.find(p => p.id === socket.id);
    if (!player || !player.isAlive) return;

    room.nightActions[socket.id] = { actionType, targetId, role: player.role };

    if (player.role === ROLES.DETECTIVE && targetId) {
      // Detective solo recibe feedback si fue líder y acertó la palabra
      const isDetectiveLeader = room.wordGuessResult && 
                                room.wordGuessResult.isCorrect && 
                                room.wordGuessResult.leaderId === socket.id;
      
      // Verificar usos (máximo 1)
      const uses = room.abilityUsages[socket.id] || 0;

      if (isDetectiveLeader) {
        if (uses < 1) {
          const target = room.players.find(p => p.id === targetId);
          if (target) {
            const team = ROLE_INFO[target.role]?.team || 'DESCONOCIDO';
            const teamLabel = team === 'MALVADO' ? 'MALVADO' : 'INVITADOS';
            socket.emit('nightActionFeedback', { message: `${target.name} pertenece al bando: ${teamLabel}` });
            
            // Registrar uso
            room.abilityUsages[socket.id] = uses + 1;
          }
        } else {
          socket.emit('nightActionFeedback', { message: "Ya has usado tu habilidad de investigación en esta partida." });
        }
      }
    } else if (player.role === ROLES.VIDENTE) {
       // Vidente solo recibe feedback si se acertó la palabra
       if (room.wordGuessResult && room.wordGuessResult.isCorrect) {
         if (room.lastDeath) {
           const deadPlayer = room.players.find(p => p.id === room.lastDeath.id);
           if (deadPlayer) {
              // Usamos el rol guardado en lastDeath porque el jugador ya es SOMBRA
              const roleName = room.lastDeath.role;
              const team = ROLE_INFO[roleName]?.team;
              const teamLabel = team === 'MALVADO' ? 'MALVADOS' : 'INVITADOS';
              socket.emit('nightActionFeedback', { message: `El último en morir fue ${deadPlayer.name}. Su rol era: ${roleName} (${teamLabel})` });
           }
         } else {
           socket.emit('nightActionFeedback', { message: "Nadie ha muerto aún para ser investigado." });
         }
       }
    }

    checkNightPhaseCompletion(roomId);
  });

  // Confirmación de lectura del resumen nocturno
  socket.on('ackNightSummary', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;

    if (!room.nightSummaryReady) {
      room.nightSummaryReady = new Set();
    }
    room.nightSummaryReady.add(socket.id);

    // Bots auto-ready
    room.players.filter(p => p.isBot).forEach(bot => room.nightSummaryReady.add(bot.id));

    const readyCount = room.nightSummaryReady.size;
    const totalPlayers = room.players.length;

    io.to(roomId).emit('nightSummaryUpdate', { ready: readyCount, total: totalPlayers });

    if (readyCount === totalPlayers) {
      proceedToDayLogic(roomId);
    }
  });

  const proceedToDayLogic = (roomId) => {
    const room = rooms[roomId];
    if (!room) return;

    // --- PROCESAR ACCIONES PENDIENTES (Ladrón y Saboteador) ---
    
    // 1. Reclutamiento de Saboteador
    if (room.pendingSaboteurId) {
      const p = room.players.find(pl => pl.id === room.pendingSaboteurId);
      if (p && p.isAlive) {
        p.role = ROLES.SABOTEADOR;
      }
      room.pendingSaboteurId = null;
    }

    // 2. Robo del Ladrón
    if (room.pendingThiefAction) {
      const { thiefId, targetId } = room.pendingThiefAction;
      const thief = room.players.find(p => p.id === thiefId);
      const target = room.players.find(p => p.id === targetId);

      if (thief && target && thief.isAlive) {
         // Obtener el rol objetivo (si está muerto, usar su rol anterior)
         let targetRole = target.role;
         if (!target.isAlive && target.previousRole) {
             targetRole = target.previousRole;
         }

         if (targetRole === ROLES.ASESINO) {
             // Intento fallido: Ladrón se convierte en Invitado
             thief.role = ROLES.INVITADO;
         } else {
             // Robo exitoso
             thief.role = targetRole;
             
             if (target.isAlive) {
                 target.role = ROLES.INVITADO;
             } else {
                 // Si el objetivo murió esta noche, su rol anterior (que se mostrará al revivir o investigar) pasa a ser Invitado
                 target.previousRole = ROLES.INVITADO;
                 // Actualizar también lastDeath si corresponde a este jugador para que el Vidente vea "Invitado"
                 if (room.lastDeath && room.lastDeath.id === target.id) {
                    room.lastDeath.role = ROLES.INVITADO;
                 }
             }
             
             // Resetear usos para el Ladrón (ahora con nuevo rol)
             room.abilityUsages[thiefId] = 0;
         }
      }
      room.pendingThiefAction = null;
    }

    // Verificar fin del juego tras cambios de rol (ej. Ladrón roba a Asesino, o Asesino recluta)
    if (checkGameOver(roomId)) return;

    // Verificar si el Vidente fue líder y acertó la palabra (antes de limpiar wordGuessResult)
    let videnteFoundWord = false;
    let videnteId = null;
    if (room.wordGuessResult && room.wordGuessResult.isCorrect) {
        const leader = room.players.find(p => p.id === room.wordGuessResult.leaderId);
        if (leader && leader.role === ROLES.VIDENTE && leader.isAlive) {
            videnteFoundWord = true;
            videnteId = leader.id;
        }
    }

    room.day = (room.day || 1) + 1;
    
    // Generar nueva palabra clave para el nuevo día (nunca se repite)
    room.keyword = generateKeyword();

    room.leaderVotes = {};
    room.eliminationVotes = {};
    room.wordGuessResult = null;
    room.nightResults = null;
    room.nightSummaryReady = new Set(); // Reset for next night
    
    if (room.nextDayLeader) {
      room.leader = room.nextDayLeader;
      room.nextDayLeader = null;
    } else {
      room.leader = null;
    }

    // Generar nuevos fragmentos para el nuevo día
    const fragments = generateFragments(room.keyword, room.players);
    room.fragments = fragments;

    // Enviar rol y fragmento a cada jugador (igual que en startGame)
    room.players.forEach((player) => {
      player.ready = false; // Reiniciar estado de listo
      
      // Determinar si fue saboteado
      let fragmentToSend = fragments[player.id];
      let isSabotaged = false;
      let foundSecretWord = false;
      
      // El Asesino recibe la palabra secreta completa
      if (player.role === 'ASESINO') {
         fragmentToSend = room.keyword;
      } else if (room.sabotagedPlayerIds && room.sabotagedPlayerIds.includes(player.id)) {
         fragmentToSend = null;
         isSabotaged = true;
      } else if (videnteFoundWord && player.id === videnteId) {
         // Vidente recibe la palabra secreta completa
         fragmentToSend = room.keyword;
         foundSecretWord = true;
      }

      if (player.isBot) {
        player.ready = true;
      } else {
        io.to(player.id).emit('roleAssigned', { 
          role: player.role, 
          name: player.name, 
          roomId,
          fragment: fragmentToSend,
          isSabotaged: isSabotaged,
          foundSecretWord: foundSecretWord,
          day: room.day
        });
      }
    });
    
    // Limpiar sabotaje para el próximo día
    room.sabotagedPlayerIds = [];

    // Navegar a RoleRevealPhase en lugar de DayPhase directo
    io.to(roomId).emit('gameStart', { day: room.day }); 
  };

  // Deprecated: Host manual proceed (kept for compatibility if needed, but logic moved)
  socket.on('proceedToDay', ({ roomId }) => {
     // This is now handled by ackNightSummary, but if host forces it:
     const room = rooms[roomId];
     if (room && room.host === socket.id) {
        proceedToDayLogic(roomId);
     }
  });

  // Chat
  socket.on('chatMessage', ({ roomId, message, recipientId }) => {
    const room = rooms[roomId];
    if (room) {
      const player = room.players.find(p => p.id === socket.id);
      const senderName = player ? player.name : 'Desconocido';
      
      const msgData = { 
        sender: senderName, 
        message, 
        timestamp: new Date().toISOString(), 
        senderId: socket.id,
        isPrivate: !!recipientId
      };

      if (recipientId) {
        // Private message
        io.to(recipientId).emit('chatMessage', msgData); // To recipient
        io.to(socket.id).emit('chatMessage', { ...msgData, recipientId }); // To sender
      } else {
        io.to(roomId).emit('chatMessage', msgData);
      }
    }
  });
  
  // Manejar desconexión
  socket.on('disconnect', () => {
    console.log(`Socket desconectado: ${socket.id}`);
    
    // Buscar en qué sala estaba
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      
      if (playerIndex !== -1) {
        const player = room.players[playerIndex];
        console.log(`Jugador ${player.name} (${socket.id}) desconectado de sala ${roomId}`);
        
        // Marcar como desconectado temporalmente
        player.connected = false;
        
        // Guardar info para posible reconexión
        const playerId = socket.id;
        disconnectedPlayers[playerId] = {
          roomId,
          playerData: { ...player },
          disconnectTime: Date.now()
        };
        
        // Notificar a otros jugadores
        io.to(roomId).emit('playerDisconnected', { 
          playerId: socket.id, 
          name: player.name 
        });
        
        io.to(roomId).emit('roomUpdate', room);
        
        // Programar eliminación si no reconecta
        setTimeout(() => {
          if (disconnectedPlayers[playerId]) {
            console.log(`Timeout de reconexión para ${player.name}`);
            
            // Verificar si la sala y el jugador aún existen
            const currentRoom = rooms[roomId];
            if (currentRoom) {
              const currentPlayerIndex = currentRoom.players.findIndex(p => p.id === playerId);
              
              if (currentPlayerIndex !== -1 && !currentRoom.players[currentPlayerIndex].connected) {
                // Remover jugador definitivamente
                currentRoom.players.splice(currentPlayerIndex, 1);
                
                // Si era el host, asignar nuevo host
                if (currentRoom.host === playerId && currentRoom.players.length > 0) {
                  currentRoom.host = currentRoom.players[0].id;
                  console.log(`Nuevo host asignado: ${currentRoom.players[0].name}`);
                }
                
                // Si no quedan jugadores, eliminar sala
                if (currentRoom.players.length === 0) {
                  console.log(`Sala ${roomId} eliminada (sin jugadores)`);
                  delete rooms[roomId];
                } else {
                  io.to(roomId).emit('roomUpdate', currentRoom);
                  io.to(roomId).emit('playerRemovedByTimeout', { 
                    playerId, 
                    name: player.name 
                  });
                }
              }
            }
            
            delete disconnectedPlayers[playerId];
          }
        }, RECONNECT_TIMEOUT);
        
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Servidor de lobby escuchando en puerto ${PORT}`);
});
