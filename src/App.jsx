import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { 
  INITIAL_ROSTER, 
  DEFAULT_FORMATIONS, 
  DEFAULT_FORMATIONS_LIST, 
  SAMPLE_PLAYS 
} from './constants/players';

import TopBar from './components/TopBar';
import Court from './components/Court';
import BenchPanel from './components/BenchPanel';
import ControlsBar from './components/ControlsBar';
import PlaybookModal from './components/PlaybookModal';
import SaveFormationModal from './components/SaveFormationModal';
import ScratchDock from './components/ScratchDock';

const STORAGE_KEY = 'tacticapp_saved_plays_v1';
const FORMATIONS_STORAGE_KEY = 'tacticapp_custom_formations_v1';

export default function App() {
  // Court appearance
  const [courtType, setCourtType] = useState('half'); // 'half' | 'full'
  const [theme, setTheme] = useState('parquet'); // 'parquet' | 'slate'

  // Scratch Mode states
  const [freeBallPos, setFreeBallPos] = useState(null); // { x: number, y: number } | null
  const [selectedScratchItem, setSelectedScratchItem] = useState(null); // { type: 'player', number } | { type: 'opponent', number } | { type: 'ball' } | null
  const [isEraserActive, setIsEraserActive] = useState(false);
  const [opponentPlayers, setOpponentPlayers] = useState([]); // [{ id, number, x, y, hasBall }]

  // Current play metadata
  const [currentPlayName, setCurrentPlayName] = useState('Pick & Roll Central (1-4)');
  const [currentPlayDesc, setCurrentPlayDesc] = useState('');

  // Initial formation snapshot (for animation resets)
  const [initialPlayers, setInitialPlayers] = useState(() => {
    return JSON.parse(JSON.stringify(DEFAULT_FORMATIONS.half_court_horns));
  });

  // Current court players [{ number, x, y, hasBall }] (max 5)
  const [courtPlayers, setCourtPlayers] = useState(() => {
    return JSON.parse(JSON.stringify(DEFAULT_FORMATIONS.half_court_horns));
  });

  // Discrete sequence of tactical actions
  const [actions, setActions] = useState(() => {
    return JSON.parse(JSON.stringify(SAMPLE_PLAYS[0].actions));
  });

  // Mode: 'design' (interactive board & recording) | 'animation' (playback & stepper)
  const [mode, setMode] = useState('design');

  // Animation & Stepper state
  // activeStep: -1 = display final state / full diagram; >= 0 = step index
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Ball assignment tool toggle
  const [isAssigningBall, setIsAssigningBall] = useState(false);

  // In design mode: 'setup' (place players freely to define initial disposition, no vector arrows)
  // vs 'draw' (drag players to record movement vectors, double click to pass)
  const [designTool, setDesignTool] = useState(() => {
    return SAMPLE_PLAYS[0].actions.length === 0 ? 'setup' : 'draw';
  });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('load'); // 'save' | 'load'
  const [isSaveFormationModalOpen, setIsSaveFormationModalOpen] = useState(false);

  // Mobile drawer state for Bench/Formations
  const [isMobileBenchOpen, setIsMobileBenchOpen] = useState(false);

  // Saved plays in memory (persisted in localStorage)
  const [savedPlays, setSavedPlays] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (err) {
      console.error("Error reading localStorage:", err);
    }
    // Default to sample plays
    return SAMPLE_PLAYS.map(p => ({ ...p, isPreset: true }));
  });

  // Custom formations created by coach
  const [customFormations, setCustomFormations] = useState(() => {
    try {
      const stored = localStorage.getItem(FORMATIONS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (err) {
      console.error("Error reading custom formations:", err);
    }
    return [];
  });

  const [currentFormationId, setCurrentFormationId] = useState('half_court_horns');

  // Sync custom formations with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(FORMATIONS_STORAGE_KEY, JSON.stringify(customFormations));
    } catch (err) {
      console.error("Error saving custom formations:", err);
    }
  }, [customFormations]);

  const allFormations = [...DEFAULT_FORMATIONS_LIST, ...customFormations];

  // Sync savedPlays with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPlays));
    } catch (err) {
      console.error("Error saving to localStorage:", err);
    }
  }, [savedPlays]);

  // Compute player positions given initial formation and actions up to step
  const computePlayersAtStep = useCallback((basePlayers, actionList, step) => {
    const players = JSON.parse(JSON.stringify(basePlayers));
    if (step < 0) return players;

    const limit = Math.min(step, actionList.length - 1);
    for (let i = 0; i <= limit; i++) {
      const act = actionList[i];
      if (!act) continue;

      if (act.type === 'move') {
        const p = players.find(item => item.number === act.playerId);
        if (p) {
          p.x = act.to.x;
          p.y = act.to.y;
          p.hasBall = act.hasBall;
        }
      } else if (act.type === 'pass') {
        const fromP = players.find(item => item.number === act.fromPlayerId);
        const toP = players.find(item => item.number === act.toPlayerId);
        if (fromP) fromP.hasBall = false;
        if (toP) toP.hasBall = true;
      } else if (act.type === 'shot') {
        const p = players.find(item => item.number === act.playerId);
        if (p) p.hasBall = false;
      }
    }

    return players;
  }, []);

  // Update court players when activeStep or actions change during animation mode
  useEffect(() => {
    if (mode === 'animation') {
      if (activeStep === -1) {
        // Initial setup
        setCourtPlayers(JSON.parse(JSON.stringify(initialPlayers)));
      } else {
        const steppedPlayers = computePlayersAtStep(initialPlayers, actions, activeStep);
        setCourtPlayers(steppedPlayers);
      }
    }
  }, [mode, activeStep, actions, initialPlayers, computePlayersAtStep]);

  // Auto-play timer loop
  useEffect(() => {
    let timer = null;
    if (isPlaying && mode === 'animation') {
      const intervalMs = Math.round(1400 / playbackSpeed);

      timer = setInterval(() => {
        setActiveStep(prev => {
          if (prev >= actions.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, mode, actions.length, playbackSpeed]);

  // ==========================================
  // PLAYMAKING ACTIONS & VECTOR RECORDING
  // ==========================================

  // Switch between 'setup' (Posición Inicial / Acomodar) and 'draw' (Trazar Jugada)
  const handleDesignToolChange = (newTool) => {
    setDesignTool(newTool);
    if (newTool === 'setup') {
      // In setup mode, place players back to starting coordinates so coach can adjust them
      setCourtPlayers(JSON.parse(JSON.stringify(initialPlayers)));
    } else {
      // In draw mode, if actions exist, place players at the state corresponding to the actions
      if (actions.length > 0) {
        const targetStep = activeStep === -1 ? actions.length - 1 : activeStep;
        const live = computePlayersAtStep(initialPlayers, actions, targetStep);
        setCourtPlayers(live);
      }
    }
  };

  // Coach moves a player on the court
  const handlePlayerMove = (playerNumber, fromCoords, toCoords, hadBall) => {
    if (mode === 'animation') return;

    if (designTool === 'setup') {
      // SETUP MODE: Freely place players for initial disposition - NO ARROWS / VECTORS CREATED
      setCourtPlayers(prev => prev.map(p => {
        if (p.number === playerNumber) {
          return { ...p, x: toCoords.x, y: toCoords.y };
        }
        return p;
      }));

      setInitialPlayers(prev => prev.map(p => {
        if (p.number === playerNumber) {
          return { ...p, x: toCoords.x, y: toCoords.y };
        }
        return p;
      }));

      // If user repositions starting base, clear any old play vectors to avoid detached arrows
      if (actions.length > 0) {
        setActions([]);
      }
      return;
    }

    // DRAW MODE:
    // Check if movement is directed towards the opponent's hoop (Tiro al aro)
    // ONLY players with the ball in possession can shoot at the basket!
    const isHalfCourt = courtType === 'half';
    const topHoop = isHalfCourt ? { x: 50, y: 13.9 } : { x: 50, y: 6.4 };
    const distToTopHoop = Math.hypot(toCoords.x - topHoop.x, toCoords.y - topHoop.y);
    const bottomHoop = { x: 50, y: 93.6 };
    const distToBottomHoop = isHalfCourt ? 999 : Math.hypot(toCoords.x - bottomHoop.x, toCoords.y - bottomHoop.y);

    const isNearHoop = distToTopHoop <= (isHalfCourt ? 16 : 12) || distToBottomHoop <= 12;

    if (isNearHoop && hadBall) {
      // SHOT AT THE BASKET (TIRO AL ARO) - EXCLUSIVE FOR BALL CARRIER
      const targetHoop = distToTopHoop <= distToBottomHoop ? topHoop : bottomHoop;
      const newAction = {
        id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        type: 'shot',
        playerId: playerNumber,
        hasBall: true,
        from: fromCoords,
        to: targetHoop,
        description: `#${playerNumber} Tiro al aro`
      };

      setActions(prev => [...prev, newAction]);

      // Shooter shoots from fromCoords, ball flies to the hoop
      setCourtPlayers(prev => prev.map(p => {
        if (p.number === playerNumber) {
          return { ...p, x: fromCoords.x, y: fromCoords.y, hasBall: false };
        }
        return p;
      }));
      return;
    }

    // Standard Movement vector (Dribble if with ball, cut/screen if without ball)
    const newAction = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: 'move',
      playerId: playerNumber,
      hasBall: hadBall,
      from: fromCoords,
      to: toCoords,
      description: hadBall 
        ? `#${playerNumber} Dribla con balón` 
        : `#${playerNumber} Corta / se desmarca sin balón`
    };

    setActions(prev => [...prev, newAction]);

    // Update player live position
    setCourtPlayers(prev => prev.map(p => {
      if (p.number === playerNumber) {
        return { ...p, x: toCoords.x, y: toCoords.y };
      }
      return p;
    }));
  };

  // Coach double clicks a teammate to execute a PASS
  const handlePlayerPass = (fromNumber, toNumber) => {
    if (mode === 'animation') return;

    // In setup mode, double-click just reassigns initial ball possession (no pass vector)
    if (designTool === 'setup') {
      handleAssignBall(toNumber);
      return;
    }

    const fromP = courtPlayers.find(p => p.number === fromNumber);
    const toP = courtPlayers.find(p => p.number === toNumber);

    if (!fromP || !toP) return;

    const newPassAction = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: 'pass',
      fromPlayerId: fromNumber,
      toPlayerId: toNumber,
      from: { x: fromP.x, y: fromP.y },
      to: { x: toP.x, y: toP.y },
      description: `Pase de #${fromNumber} a #${toNumber}`
    };

    setActions(prev => [...prev, newPassAction]);

    // Transfer ball possession
    setCourtPlayers(prev => prev.map(p => {
      if (p.number === fromNumber) return { ...p, hasBall: false };
      if (p.number === toNumber) return { ...p, hasBall: true };
      return p;
    }));
  };

  // Assign ball to a specific player
  const handleAssignBall = (playerNumber) => {
    setCourtPlayers(prev => prev.map(p => ({
      ...p,
      hasBall: p.number === playerNumber
    })));
    // Also sync initialPlayers so starting formation remembers who holds the ball
    setInitialPlayers(prev => prev.map(p => ({
      ...p,
      hasBall: p.number === playerNumber
    })));
    setIsAssigningBall(false);
  };

  // ==========================================
  // ROSTER & BENCH MANAGEMENT (#4 to #18)
  // ==========================================

  const handleAddPlayerToCourt = (playerNumber) => {
    if (courtPlayers.length >= 5) return;
    if (courtPlayers.some(p => p.number === playerNumber)) return;

    // Available default spots
    const defaultSpots = [
      { x: 50, y: 75 },
      { x: 25, y: 60 },
      { x: 75, y: 60 },
      { x: 35, y: 35 },
      { x: 65, y: 35 }
    ];

    const currentPositions = courtPlayers.map(p => ({ x: p.x, y: p.y }));
    const freeSpot = defaultSpots.find(spot => 
      !currentPositions.some(cp => Math.hypot(cp.x - spot.x, cp.y - spot.y) < 10)
    ) || { x: 50, y: 50 };

    const newPlayer = {
      number: playerNumber,
      x: freeSpot.x,
      y: freeSpot.y,
      hasBall: courtPlayers.length === 0 // First player receives ball automatically
    };

    const updated = [...courtPlayers, newPlayer];
    setCourtPlayers(updated);
    setInitialPlayers(JSON.parse(JSON.stringify(updated)));
  };

  const handleRemovePlayerFromCourt = (playerNumber) => {
    const playerToRemove = courtPlayers.find(p => p.number === playerNumber);
    const updated = courtPlayers.filter(p => p.number !== playerNumber);

    // If player had ball, give it to first remaining player
    if (playerToRemove && playerToRemove.hasBall && updated.length > 0) {
      updated[0].hasBall = true;
    }

    setCourtPlayers(updated);
    setInitialPlayers(JSON.parse(JSON.stringify(updated)));
  };

  const handleApplyFormation = (formationId) => {
    const formation = allFormations.find(f => f.id === formationId);
    if (!formation) return;

    if (formation.courtType && formation.courtType !== courtType) {
      setCourtType(formation.courtType);
    }

    const newPlayers = JSON.parse(JSON.stringify(formation.players));
    setCourtPlayers(newPlayers);
    setInitialPlayers(JSON.parse(JSON.stringify(newPlayers)));
    setCurrentFormationId(formationId);
    setActions([]);
    setActiveStep(-1);
    setIsPlaying(false);
    setDesignTool('setup'); // Ready to freely arrange positions if desired!
  };

  const handleSaveCurrentAsFormation = (name) => {
    if (courtPlayers.length === 0) return;

    const newFormation = {
      id: `custom_${Date.now()}`,
      name: name,
      courtType: courtType,
      isCustom: true,
      players: JSON.parse(JSON.stringify(courtPlayers))
    };

    setCustomFormations(prev => [...prev, newFormation]);
    setCurrentFormationId(newFormation.id);
    setInitialPlayers(JSON.parse(JSON.stringify(courtPlayers)));
  };

  const handleDeleteCustomFormation = (formationId) => {
    setCustomFormations(prev => prev.filter(f => f.id !== formationId));
    if (currentFormationId === formationId) {
      setCurrentFormationId('half_court_horns');
    }
  };

  const handleClearCourt = () => {
    setCourtPlayers([]);
    setInitialPlayers([]);
    setActions([]);
    setActiveStep(-1);
    setIsPlaying(false);
  };

  // ==========================================
  // PLAYBOOK SAVE & LOAD
  // ==========================================

  const handleSavePlay = ({ name, description, category }) => {
    const newPlay = {
      id: `play_${Date.now()}`,
      name,
      description,
      category,
      courtType,
      initialPlayers: JSON.parse(JSON.stringify(initialPlayers)),
      actions: JSON.parse(JSON.stringify(actions)),
      createdAt: new Date().toISOString()
    };

    setSavedPlays(prev => [newPlay, ...prev]);
    setCurrentPlayName(name);
    setCurrentPlayDesc(description);
  };

  const handleLoadPlay = (play) => {
    setCurrentPlayName(play.name);
    setCurrentPlayDesc(play.description);
    if (play.courtType) setCourtType(play.courtType);

    setInitialPlayers(JSON.parse(JSON.stringify(play.initialPlayers)));
    setCourtPlayers(JSON.parse(JSON.stringify(play.initialPlayers)));
    setActions(JSON.parse(JSON.stringify(play.actions || [])));
    
    // Switch directly to animation mode for coach presentation
    setMode('animation');
    setActiveStep(-1);
    setIsPlaying(false);
  };

  const handleDeletePlay = (playId) => {
    setSavedPlays(prev => prev.filter(p => p.id !== playId));
  };

  const handleNewPlay = () => {
    setCurrentPlayName('Nueva Jugada');
    setCurrentPlayDesc('');
    const defaultPlayers = JSON.parse(JSON.stringify(DEFAULT_FORMATIONS.half_court_horns));
    setCourtPlayers(defaultPlayers);
    setInitialPlayers(JSON.parse(JSON.stringify(defaultPlayers)));
    setActions([]);
    setActiveStep(-1);
    setIsPlaying(false);
    setMode('design');
    setDesignTool('setup'); // Start in setup mode so coach places players freely
  };

  // ==========================================
  // STEPPER CONTROLS (+1 / -1 / RESET / PLAY)
  // ==========================================

  const handleStepBack = () => {
    setIsPlaying(false);
    setActiveStep(prev => Math.max(-1, prev - 1));
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    setActiveStep(prev => Math.min(actions.length - 1, prev + 1));
  };

  const handleResetToStart = () => {
    setIsPlaying(false);
    setActiveStep(-1);
  };

  const handleGoToEnd = () => {
    setIsPlaying(false);
    setActiveStep(actions.length - 1);
  };

  const handleUndoLastAction = () => {
    if (actions.length === 0) return;
    const newActions = actions.slice(0, -1);
    setActions(newActions);

    // Recompute player positions to the previous state
    const stepped = computePlayersAtStep(initialPlayers, newActions, newActions.length - 1);
    setCourtPlayers(stepped);
  };

  const handleClearActions = () => {
    setActions([]);
    setCourtPlayers(JSON.parse(JSON.stringify(initialPlayers)));
    setActiveStep(-1);
    setIsPlaying(false);
  };

  // ==========================================
  // SCRATCH MODE HANDLERS
  // ==========================================

  // Scratch Mode click-to-place on court
  const handleCourtClick = (pctCoords) => {
    if (!selectedScratchItem) return;

    if (selectedScratchItem.type === 'player') {
      const playerNum = selectedScratchItem.number;
      setCourtPlayers(prev => {
        const exists = prev.some(p => p.number === playerNum);
        if (exists) {
          // Reposition existing player
          return prev.map(p => p.number === playerNum ? { ...p, x: pctCoords.x, y: pctCoords.y } : p);
        } else {
          // Add player if under 5 on court
          if (prev.length >= 5) {
            // Replace oldest player
            return [...prev.slice(1), { number: playerNum, x: pctCoords.x, y: pctCoords.y, hasBall: false }];
          }
          return [...prev, { number: playerNum, x: pctCoords.x, y: pctCoords.y, hasBall: false }];
        }
      });
      setSelectedScratchItem(null);
    } else if (selectedScratchItem.type === 'opponent') {
      const oppNum = selectedScratchItem.number;
      setOpponentPlayers(prev => {
        const exists = prev.some(o => o.number === oppNum);
        if (exists) {
          return prev.map(o => o.number === oppNum ? { ...o, x: pctCoords.x, y: pctCoords.y } : o);
        } else {
          return [...prev, { id: oppNum, number: oppNum, x: pctCoords.x, y: pctCoords.y, hasBall: false }];
        }
      });
      setSelectedScratchItem(null);
    } else if (selectedScratchItem.type === 'ball') {
      // Check if placed on or near an opponent
      const targetOpp = opponentPlayers.find(o => Math.hypot(o.x - pctCoords.x, o.y - pctCoords.y) < 7);
      // Check if placed on or near our player
      const targetPlayer = courtPlayers.find(p => Math.hypot(p.x - pctCoords.x, p.y - pctCoords.y) < 7);

      if (targetOpp) {
        setOpponentPlayers(prev => prev.map(o => ({ ...o, hasBall: o.id === targetOpp.id })));
        setCourtPlayers(prev => prev.map(p => ({ ...p, hasBall: false })));
        setFreeBallPos(null);
      } else if (targetPlayer) {
        setCourtPlayers(prev => prev.map(p => ({ ...p, hasBall: p.number === targetPlayer.number })));
        setOpponentPlayers(prev => prev.map(o => ({ ...o, hasBall: false })));
        setFreeBallPos(null);
      } else {
        // Freestanding ball on court (loose ball)
        setCourtPlayers(prev => prev.map(p => ({ ...p, hasBall: false })));
        setOpponentPlayers(prev => prev.map(o => ({ ...o, hasBall: false })));
        setFreeBallPos({ x: pctCoords.x, y: pctCoords.y });
      }
      setSelectedScratchItem(null);
    }
  };

  // Move an opponent player
  const handleOpponentMove = (oppId, toCoords) => {
    setOpponentPlayers(prev => prev.map(o => o.id === oppId ? { ...o, x: toCoords.x, y: toCoords.y } : o));
  };

  // Deploy 5 opponents in standard defensive positioning
  const handleDeployOpponents = () => {
    const isHalf = courtType === 'half';
    const standardOpponents = [
      { id: 1, number: 1, x: 44, y: isHalf ? 35 : 28, hasBall: false },
      { id: 2, number: 2, x: 56, y: isHalf ? 35 : 28, hasBall: false },
      { id: 3, number: 3, x: 26, y: isHalf ? 22 : 18, hasBall: false },
      { id: 4, number: 4, x: 74, y: isHalf ? 22 : 18, hasBall: false },
      { id: 5, number: 5, x: 50, y: isHalf ? 18 : 14, hasBall: false }
    ];
    setOpponentPlayers(standardOpponents);
  };

  // Freestanding ball dragged on court (pass simulation)
  const handleFreeBallMove = (fromCoords, toCoords) => {
    // Check if passed to an opponent
    const targetOpp = opponentPlayers.find(o => Math.hypot(o.x - toCoords.x, o.y - toCoords.y) < 7);
    // Check if passed to our player
    const targetPlayer = courtPlayers.find(p => Math.hypot(p.x - toCoords.x, p.y - toCoords.y) < 7);

    if (targetOpp) {
      const newAction = {
        id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        type: 'pass',
        playerId: null,
        hasBall: true,
        from: fromCoords,
        to: { x: targetOpp.x, y: targetOpp.y },
        description: `Balón interceptado / posesión Rival #${targetOpp.number}`
      };
      setActions(prev => [...prev, newAction]);
      setOpponentPlayers(prev => prev.map(o => ({ ...o, hasBall: o.id === targetOpp.id })));
      setCourtPlayers(prev => prev.map(p => ({ ...p, hasBall: false })));
      setFreeBallPos(null);
    } else if (targetPlayer) {
      const newAction = {
        id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        type: 'pass',
        playerId: null,
        hasBall: true,
        from: fromCoords,
        to: { x: targetPlayer.x, y: targetPlayer.y },
        description: `Pase a #${targetPlayer.number}`
      };
      setActions(prev => [...prev, newAction]);
      setCourtPlayers(prev => prev.map(p => ({ ...p, hasBall: p.number === targetPlayer.number })));
      setOpponentPlayers(prev => prev.map(o => ({ ...o, hasBall: false })));
      setFreeBallPos(null);
    } else {
      // Ball passed to open space / loose ball
      const newAction = {
        id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        type: 'pass',
        playerId: null,
        hasBall: true,
        from: fromCoords,
        to: toCoords,
        description: `Balón a espacio libre`
      };
      setActions(prev => [...prev, newAction]);
      setFreeBallPos(toCoords);
    }
  };

  // Clear all drawings on court (vectors)
  const handleClearDrawings = () => {
    setActions([]);
  };

  // Return whole team and opponents to bench
  const handleReturnToBench = () => {
    setCourtPlayers([]);
    setOpponentPlayers([]);
    setFreeBallPos(null);
    setActions([]);
    setSelectedScratchItem(null);
  };

  // Delete a single action (eraser)
  const handleDeleteAction = (actionId) => {
    setActions(prev => prev.filter(a => a.id !== actionId));
  };

  return (
    <div className="tactic-app-root">
      {/* Top Header Bar */}
      <TopBar
        courtType={courtType}
        onToggleCourtType={() => setCourtType(prev => prev === 'half' ? 'full' : 'half')}
        theme={theme}
        onToggleTheme={() => setTheme(prev => prev === 'parquet' ? 'slate' : 'parquet')}
        currentPlayName={currentPlayName}
        isRecording={mode === 'design' || mode === 'scratch'}
        onToggleMobileBench={() => setIsMobileBenchOpen(prev => !prev)}
        isMobileBenchOpen={isMobileBenchOpen}
        courtPlayersCount={courtPlayers.length}
      />

      {/* Main Tactical Arena */}
      <div className={`main-stage ${isMobileBenchOpen ? 'sheet-open' : ''}`}>
        {/* Court Canvas - Expands to 100% on mobile */}
        <main className={`court-container-area ${mode === 'scratch' ? 'scratch-mode-active' : ''} ${courtType === 'full' ? 'layout-dock-right' : 'layout-dock-bottom'}`}>
          <Court
            courtType={courtType}
            theme={theme}
            courtPlayers={courtPlayers}
            opponentPlayers={opponentPlayers}
            actions={actions}
            activeStep={mode === 'animation' ? activeStep : -1}
            isPlaying={isPlaying}
            mode={mode}
            designTool={designTool}
            onDesignToolChange={handleDesignToolChange}
            isAssigningBall={isAssigningBall}
            onAssignBall={handleAssignBall}
            onPlayerMove={handlePlayerMove}
            onPlayerPass={handlePlayerPass}
            onOpponentMove={handleOpponentMove}
            onRemovePlayer={handleRemovePlayerFromCourt}
            onSaveFormation={() => setIsSaveFormationModalOpen(true)}
            onSavePlay={() => {
              setModalType('save');
              setIsModalOpen(true);
            }}
            freeBallPos={freeBallPos}
            onFreeBallMove={handleFreeBallMove}
            selectedScratchItem={selectedScratchItem}
            onCourtClick={handleCourtClick}
            isEraserActive={isEraserActive}
            onDeleteAction={handleDeleteAction}
          />

          {/* Paleta Scratch: Abajo en Media Cancha, a la Derecha en Cancha Completa */}
          {mode === 'scratch' && (
            <ScratchDock
              courtType={courtType}
              roster={INITIAL_ROSTER}
              courtPlayers={courtPlayers}
              opponentPlayers={opponentPlayers}
              freeBallPos={freeBallPos}
              selectedItem={selectedScratchItem}
              onSelectItem={setSelectedScratchItem}
              onDeployOpponents={handleDeployOpponents}
              isEraserActive={isEraserActive}
              onToggleEraser={() => setIsEraserActive(prev => !prev)}
              onClearDrawings={handleClearDrawings}
              onReturnToBench={handleReturnToBench}
            />
          )}
        </main>

        {/* Bench Sidebar (Collapsible Drawer on Mobile) */}
        <BenchPanel
          roster={INITIAL_ROSTER}
          courtPlayers={courtPlayers}
          formations={allFormations}
          currentFormationId={currentFormationId}
          isAssigningBall={isAssigningBall}
          designTool={designTool}
          onDesignToolChange={handleDesignToolChange}
          isMobileOpen={isMobileBenchOpen}
          onCloseMobile={() => setIsMobileBenchOpen(false)}
          onAssignBall={handleAssignBall}
          onAddPlayerToCourt={handleAddPlayerToCourt}
          onRemovePlayerFromCourt={handleRemovePlayerFromCourt}
          onApplyFormation={handleApplyFormation}
          onOpenSaveFormationModal={() => setIsSaveFormationModalOpen(true)}
          onSaveCurrentAsFormation={handleSaveCurrentAsFormation}
          onDeleteCustomFormation={handleDeleteCustomFormation}
          onClearCourt={handleClearCourt}
        />
      </div>

      {/* Bottom Controls Bar for Tablet Thumbs */}
      <ControlsBar
        mode={mode}
        onModeChange={(newMode) => {
          setMode(newMode);
          if (newMode === 'animation') {
            setActiveStep(-1); // Start at initial positions
          } else {
            // When going back to design, place players at the final state
            const finalPlayers = computePlayersAtStep(initialPlayers, actions, actions.length - 1);
            setCourtPlayers(finalPlayers);
          }
        }}
        designTool={designTool}
        onDesignToolChange={handleDesignToolChange}
        actions={actions}
        activeStep={activeStep}
        isPlaying={isPlaying}
        playbackSpeed={playbackSpeed}
        isAssigningBall={isAssigningBall}
        onToggleAssignBall={() => setIsAssigningBall(prev => !prev)}
        onPlay={() => {
          if (activeStep >= actions.length - 1) {
            setActiveStep(-1); // Reset to start if already at the end
          }
          setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
        onStepBack={handleStepBack}
        onStepForward={handleStepForward}
        onResetToStart={handleResetToStart}
        onGoToEnd={handleGoToEnd}
        onChangeSpeed={(speed) => setPlaybackSpeed(speed)}
        onUndoLastAction={handleUndoLastAction}
        onClearActions={handleClearActions}
        onOpenSaveModal={() => {
          setModalType('save');
          setIsModalOpen(true);
        }}
        onOpenPlaybookModal={() => {
          setModalType('load');
          setIsModalOpen(true);
        }}
        onNewPlay={handleNewPlay}
        isEraserActive={isEraserActive}
        onToggleEraser={() => setIsEraserActive(prev => !prev)}
        onClearDrawings={handleClearDrawings}
        onReturnToBench={handleReturnToBench}
      />

      {/* Playbook Save/Load Modal */}
      <PlaybookModal
        isOpen={isModalOpen}
        modalType={modalType}
        onClose={() => setIsModalOpen(false)}
        savedPlays={savedPlays}
        onSavePlay={handleSavePlay}
        onLoadPlay={handleLoadPlay}
        onDeletePlay={handleDeletePlay}
        currentActionsCount={actions.length}
      />

      {/* Save Custom Formation Modal */}
      <SaveFormationModal
        isOpen={isSaveFormationModalOpen}
        onClose={() => setIsSaveFormationModalOpen(false)}
        courtPlayers={courtPlayers}
        onSaveFormation={handleSaveCurrentAsFormation}
      />
    </div>
  );
}
