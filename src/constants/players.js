// Lista reglamentaria FIBA de dorsales (del 4 al 18)
export const INITIAL_ROSTER = [
  { id: 4, number: 4, name: "Base", position: "PG", active: false },
  { id: 5, number: 5, name: "Escolta", position: "SG", active: false },
  { id: 6, number: 6, name: "Alero", position: "SF", active: false },
  { id: 7, number: 7, name: "Ala-Pívot", position: "PF", active: false },
  { id: 8, number: 8, name: "Pívot", position: "C", active: false },
  { id: 9, number: 9, name: "Suplente 1", position: "G", active: false },
  { id: 10, number: 10, name: "Suplente 2", position: "G", active: false },
  { id: 11, number: 11, name: "Suplente 3", position: "F", active: false },
  { id: 12, number: 12, name: "Suplente 4", position: "F", active: false },
  { id: 13, number: 13, name: "Suplente 5", position: "C", active: false },
  { id: 14, number: 14, name: "Mateo", position: "SG", active: false },
  { id: 15, number: 15, name: "Lautaro", position: "PG", active: false },
  { id: 16, number: 16, name: "Suplente 8", position: "F", active: false },
  { id: 17, number: 17, name: "Suplente 9", position: "PF", active: false },
  { id: 18, number: 18, name: "Suplente 10", position: "C", active: false },
];

// Formaciones iniciales recomendadas (en % de ancho y alto de cancha)
export const DEFAULT_FORMATIONS_LIST = [
  {
    id: "half_court_horns",
    name: "Cuernos (1-4)",
    courtType: "half",
    players: [
      { number: 4, x: 50, y: 78, hasBall: true },   // Base en cabecera
      { number: 5, x: 22, y: 65, hasBall: false },  // Escolta en 45 izq
      { number: 6, x: 78, y: 65, hasBall: false },  // Alero en 45 der
      { number: 7, x: 38, y: 46, hasBall: false },  // Cuerno izq (tiros libres)
      { number: 8, x: 62, y: 46, hasBall: false },  // Cuerno der (tiros libres)
    ]
  },
  {
    id: "half_court_spread",
    name: "5 Abiertos",
    courtType: "half",
    players: [
      { number: 4, x: 50, y: 82, hasBall: true },
      { number: 5, x: 16, y: 55, hasBall: false },
      { number: 6, x: 84, y: 55, hasBall: false },
      { number: 7, x: 18, y: 22, hasBall: false },
      { number: 8, x: 82, y: 22, hasBall: false },
    ]
  },
  {
    id: "half_court_box",
    name: "Caja (1-2-2)",
    courtType: "half",
    players: [
      { number: 4, x: 50, y: 80, hasBall: true },
      { number: 5, x: 25, y: 55, hasBall: false },
      { number: 6, x: 75, y: 55, hasBall: false },
      { number: 7, x: 28, y: 25, hasBall: false },
      { number: 8, x: 72, y: 25, hasBall: false },
    ]
  },
  {
    id: "full_court_press_break",
    name: "Salida Presión (Todo Campo)",
    courtType: "full",
    players: [
      { number: 4, x: 50, y: 92, hasBall: true },
      { number: 5, x: 20, y: 82, hasBall: false },
      { number: 6, x: 80, y: 82, hasBall: false },
      { number: 7, x: 50, y: 65, hasBall: false },
      { number: 8, x: 30, y: 35, hasBall: false },
    ]
  }
];

export const DEFAULT_FORMATIONS = {
  half_court_horns: DEFAULT_FORMATIONS_LIST[0].players,
  half_court_spread: DEFAULT_FORMATIONS_LIST[1].players,
  half_court_box: DEFAULT_FORMATIONS_LIST[2].players,
  full_court_press_break: DEFAULT_FORMATIONS_LIST[3].players
};


// Jugadas precargadas de ejemplo con secuencias de acciones
export const SAMPLE_PLAYS = [
  {
    id: "play_pick_and_roll",
    name: "Pick & Roll Central (1-4)",
    category: "Ataque Perimetral",
    courtType: "half",
    description: "Bloqueo directo del pívot #8 al base #4, pase en caída al corte hacia el aro.",
    initialPlayers: [
      { number: 4, x: 50, y: 78, hasBall: true },
      { number: 5, x: 22, y: 65, hasBall: false },
      { number: 6, x: 78, y: 65, hasBall: false },
      { number: 7, x: 34, y: 35, hasBall: false },
      { number: 8, x: 60, y: 46, hasBall: false },
    ],
    actions: [
      {
        id: "act_1",
        type: "move",
        playerId: 8,
        hasBall: false,
        from: { x: 60, y: 46 },
        to: { x: 54, y: 73 },
        description: "#8 Sube a poner bloqueo directo en cabecera para #4"
      },
      {
        id: "act_2",
        type: "move",
        playerId: 4,
        hasBall: true,
        from: { x: 50, y: 78 },
        to: { x: 68, y: 62 },
        description: "#4 Dribla hacia el lado derecho aprovechando el bloqueo"
      },
      {
        id: "act_3",
        type: "move",
        playerId: 8,
        hasBall: false,
        from: { x: 54, y: 73 },
        to: { x: 52, y: 28 },
        description: "#8 Gira y cae en roll hacia la canasta"
      },
      {
        id: "act_4",
        type: "pass",
        fromPlayerId: 4,
        toPlayerId: 8,
        from: { x: 68, y: 62 },
        to: { x: 52, y: 28 },
        description: "Pase picado de #4 hacia #8 en la zona para bandeja/tiro fácil"
      }
    ]
  },
  {
    id: "play_horns_flare",
    name: "Salida Cuernos y Flare",
    category: "Tiro Exterior",
    courtType: "half",
    description: "Bloqueo indirecto ciego para tiro liberado de tres puntos.",
    initialPlayers: [
      { number: 4, x: 50, y: 80, hasBall: true },
      { number: 5, x: 18, y: 60, hasBall: false },
      { number: 6, x: 82, y: 60, hasBall: false },
      { number: 7, x: 38, y: 45, hasBall: false },
      { number: 8, x: 62, y: 45, hasBall: false },
    ],
    actions: [
      {
        id: "act_1",
        type: "pass",
        fromPlayerId: 4,
        toPlayerId: 7,
        from: { x: 50, y: 80 },
        to: { x: 38, y: 45 },
        description: "#4 Pasa al poste alto #7"
      },
      {
        id: "act_2",
        type: "move",
        playerId: 4,
        hasBall: false,
        from: { x: 50, y: 80 },
        to: { x: 68, y: 55 },
        description: "#4 Pone bloqueo flare para el tirador #6"
      },
      {
        id: "act_3",
        type: "move",
        playerId: 6,
        hasBall: false,
        from: { x: 82, y: 60 },
        to: { x: 74, y: 78 },
        description: "#6 Sale al perímetro en el ala exterior"
      },
      {
        id: "act_4",
        type: "pass",
        fromPlayerId: 7,
        toPlayerId: 6,
        from: { x: 38, y: 45 },
        to: { x: 74, y: 78 },
        description: "Pase cruzado de #7 a #6 para lanzamiento de 3 puntos"
      }
    ]
  }
];
