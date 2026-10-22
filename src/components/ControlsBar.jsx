import React from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  RotateCcw, 
  Undo2, 
  Save, 
  FolderOpen, 
  Compass, 
  Plus,
  Pencil,
  Eraser,
  Trash2,
  Users
} from 'lucide-react';

export default function ControlsBar({
  mode, // 'design' | 'scratch' | 'animation'
  onModeChange,
  designTool = 'setup',
  onDesignToolChange,
  actions = [],
  activeStep = -1,
  currentPhase = 1,
  totalPhases = 0,
  onNextPhase,
  isPlaying = false,
  playbackSpeed = 1,
  isAssigningBall = false,
  onToggleAssignBall,
  onPlay,
  onPause,
  onStepBack,
  onStepForward,
  onResetToStart,
  onGoToEnd,
  onChangeSpeed,
  onUndoLastAction,
  onClearActions,
  onOpenSaveModal,
  onOpenPlaybookModal,
  onNewPlay,
  // Scratch mode props
  isEraserActive = false,
  onToggleEraser,
  onClearDrawings,
  onReturnToBench
}) {
  const totalSteps = actions.length;

  const uniquePhases = React.useMemo(() => {
    if (actions.length === 0) return [];
    const set = new Set(actions.map(a => a.phase || 1));
    return Array.from(set).sort((a, b) => a - b);
  }, [actions]);

  const effectiveTotalPhases = totalPhases || uniquePhases.length;
  const actionsInCurrentPhase = actions.filter(a => (a.phase || 1) === currentPhase);

  // Active phase in animation
  const activePhaseNum = activeStep >= 0 && activeStep < uniquePhases.length
    ? uniquePhases[activeStep]
    : (activeStep + 1);

  const activePhaseActions = actions.filter(a => (a.phase || 1) === activePhaseNum);
  const activePhaseDesc = activePhaseActions.map(a => a.description).join(' • ');

  return (
    <footer className="controls-bar">
      {/* Mode Switcher Tabs */}
      <div className="mode-toggle-group">
        <button
          className={`mode-tab-btn ${mode === 'design' ? 'active' : ''}`}
          onClick={() => {
            onPause?.();
            onModeChange('design');
          }}
          title="Modo diseño de jugada estructurada"
        >
          <Compass size={15} />
          <span className="desktop-only">Jugada</span>
        </button>

        {/* MODO SCRATCH: Pizarra rápida clásica */}
        <button
          className={`mode-tab-btn scratch-mode-btn ${mode === 'scratch' ? 'active' : ''}`}
          onClick={() => {
            onPause?.();
            onModeChange('scratch');
          }}
          title="Modo Scratch: Pizarra clásica rápida con paleta de números y balón"
        >
          <Pencil size={15} />
          <span className="desktop-only">Scratch</span>
        </button>

        {/* Solo símbolo de Play con contador de pasos (sin texto 'Animar') */}
        <button
          className={`mode-tab-btn ${mode === 'animation' ? 'active' : ''}`}
          onClick={() => {
            onModeChange('animation');
          }}
          title="Reproducir animación de la jugada"
        >
          <Play size={15} />
          {totalSteps > 0 && <span className="action-badge">{totalSteps}</span>}
        </button>

        {/* Botón de Guardar con ícono de disquete junto a Play */}
        <button
          className="mode-tab-btn save-quick-icon-btn"
          onClick={onOpenSaveModal}
          title="Guardar Jugada en Memoria"
        >
          <Save size={15} />
        </button>
      </div>

      {/* Main Contextual Controls */}
      <div className="contextual-controls">
        {mode === 'scratch' ? (
          /* SCRATCH MODE TOOLS */
          <div className="design-toolbar scratch-toolbar">
            {/* Tool Mode: Trazar vs Ubicar */}
            <div className="design-submode-group">
              <button
                type="button"
                className={`tool-submode-btn ${designTool === 'draw' ? 'active-draw' : ''}`}
                onClick={() => onDesignToolChange?.('draw')}
                title="Modo Trazar: al arrastrar jugadores se dibujan flechas tácticas"
              >
                <span>✏️</span>
                <span>Trazar</span>
              </button>
              <button
                type="button"
                className={`tool-submode-btn ${designTool === 'setup' ? 'active-setup' : ''}`}
                onClick={() => onDesignToolChange?.('setup')}
                title="Modo Ubicar: mueve y coloca a los jugadores libremente sin flechas"
              >
                <span>📍</span>
                <span>Ubicar</span>
              </button>
            </div>

            {/* Phase indicator in Scratch Draw Mode */}
            {designTool === 'draw' && (
              <div className="phase-control-cluster">
                <span className="phase-badge-pill" title="Fase táctica: todas las acciones que traces en esta fase se ejecutan en paralelo">
                  <span className="phase-dot-live" />
                  <span>Fase {currentPhase}</span>
                  <span className="phase-count-sub">({actionsInCurrentPhase.length} sim.)</span>
                </span>
                <button
                  type="button"
                  className="phase-advance-btn"
                  onClick={onNextPhase}
                  title="Avanzar a la Siguiente Fase"
                >
                  <Plus size={14} />
                  <span className="desktop-only">+ Fase</span>
                </button>
              </div>
            )}

            <div className="toolbar-divider" />

            {/* Toggle Borrador */}
            <button
              className={`tool-btn ${isEraserActive ? 'active-eraser-btn' : ''}`}
              onClick={onToggleEraser}
              title="Activar borrador para borrar trazos con el dedo"
            >
              <Eraser size={15} />
              <span>Borrador</span>
            </button>

            {/* Limpiar todos los dibujos/trazos */}
            <button
              className="tool-btn"
              onClick={onClearDrawings}
              title="Borrar todos los trazos y vectores de la cancha"
              disabled={totalSteps === 0}
            >
              <Trash2 size={15} />
              <span>Borrar Trazos</span>
            </button>

            {/* Regresar equipo a la banca */}
            <button
              className="tool-btn"
              onClick={onReturnToBench}
              title="Regresar todo el equipo al banco y despejar la cancha"
            >
              <Users size={15} />
              <span>A la Banca</span>
            </button>

            <div className="toolbar-divider" />

            {/* Undo last action */}
            <button
              className="tool-btn"
              onClick={onUndoLastAction}
              disabled={totalSteps === 0}
              title="Deshacer último movimiento o pase"
            >
              <Undo2 size={15} />
              <span className="desktop-only">Deshacer</span>
            </button>

            {/* Playbook / Guardadas */}
            <button
              className="tool-btn"
              onClick={onOpenPlaybookModal}
              title="Abrir biblioteca de jugadas guardadas"
            >
              <FolderOpen size={15} />
              <span className="desktop-only">Jugadas</span>
            </button>
          </div>
        ) : mode === 'design' ? (
          /* DESIGN MODE TOOLS */
          <div className="design-toolbar">
            {/* Tool Mode: Inicio vs Trazar */}
            <div className="design-submode-group">
              <button
                className={`tool-submode-btn ${designTool === 'setup' ? 'active-setup' : ''}`}
                onClick={() => onDesignToolChange?.('setup')}
                title="Ubica a los jugadores en su posición inicial"
              >
                <span>📍</span>
                <span>Inicio</span>
              </button>
              <button
                className={`tool-submode-btn ${designTool === 'draw' ? 'active-draw' : ''}`}
                onClick={() => onDesignToolChange?.('draw')}
                title="Trazar desplazamientos y pases"
              >
                <span>✏️</span>
                <span>Trazar</span>
              </button>
            </div>

            {/* Phase indicator in Playmaking Draw Mode */}
            {designTool === 'draw' && (
              <div className="phase-control-cluster">
                <span className="phase-badge-pill" title="Fase táctica: todas las acciones que traces en esta fase se reproducen al mismo tiempo">
                  <span className="phase-dot-live" />
                  <span>Fase {currentPhase}</span>
                  <span className="phase-count-sub">({actionsInCurrentPhase.length} sim.)</span>
                </span>
                <button
                  type="button"
                  className="phase-advance-btn"
                  onClick={onNextPhase}
                  title="Avanzar a Siguiente Fase (las acciones siguientes se reproducirán después)"
                >
                  <Plus size={14} />
                  <span className="desktop-only">Siguiente Fase</span>
                </button>
              </div>
            )}

            <div className="toolbar-divider desktop-only" />

            {/* Assign Ball Toggle */}
            <button
              className={`tool-btn ${isAssigningBall ? 'active-ball-assign' : ''}`}
              onClick={onToggleAssignBall}
              title="Toca para asignar el balón a un jugador"
            >
              <span className="ball-emoji">🏀</span>
              <span className="desktop-only">{isAssigningBall ? 'Cancel' : 'Balón'}</span>
            </button>

            {/* Undo last action */}
            <button
              className="tool-btn"
              onClick={onUndoLastAction}
              disabled={totalSteps === 0}
              title="Deshacer último movimiento o pase"
            >
              <Undo2 size={15} />
              <span className="desktop-only">Deshacer</span>
            </button>

            {/* Clear vectors / actions */}
            <button
              className="tool-btn danger"
              onClick={onClearActions}
              disabled={totalSteps === 0}
              title="Borrar todos los vectores trazados"
            >
              <RotateCcw size={15} />
              <span className="desktop-only">Limpiar</span>
            </button>

            <div className="toolbar-divider desktop-only" />

            {/* Nueva jugada */}
            <button
              className="tool-btn"
              onClick={onNewPlay}
              title="Iniciar una nueva pizarra desde cero"
            >
              <Plus size={15} />
              <span className="desktop-only">Nueva</span>
            </button>

            {/* Open playbook */}
            <button
              className="tool-btn secondary"
              onClick={onOpenPlaybookModal}
              title="Abrir biblioteca de jugadas guardadas"
            >
              <FolderOpen size={15} />
              <span className="desktop-only">Mis Jugadas</span>
              <span className="mobile-only">Jugadas</span>
            </button>
          </div>
        ) : (
          /* ANIMATION / STEPPER CONTROLS */
          <div className="animation-toolbar">
            {/* Step Controls */}
            <div className="stepper-cluster">
              {/* Reset to Start */}
              <button
                className="step-circle-btn"
                onClick={onResetToStart}
                title="Reiniciar a formación inicial"
              >
                <RotateCcw size={15} />
              </button>

              {/* Step Backward (-1 Phase) */}
              <button
                className="step-circle-btn"
                onClick={onStepBack}
                disabled={activeStep <= -1}
                title="Fase Anterior"
              >
                <SkipBack size={16} />
              </button>

              {/* Play / Pause Primary Button */}
              <button
                className={`step-circle-btn play-main ${isPlaying ? 'playing' : ''}`}
                onClick={isPlaying ? onPause : onPlay}
                disabled={effectiveTotalPhases === 0}
                title={isPlaying ? "Pausar animación" : "Iniciar animación completa"}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: 2 }} />}
              </button>

              {/* Step Forward (+1 Phase) */}
              <button
                className="step-circle-btn"
                onClick={onStepForward}
                disabled={activeStep >= effectiveTotalPhases - 1}
                title="Fase Siguiente"
              >
                <SkipForward size={16} />
              </button>
            </div>

            {/* Current Phase Tracker & Description */}
            <div className="step-info-display desktop-only">
              <div className="step-indicator-text">
                <span className="step-num">
                  {effectiveTotalPhases === 0 
                    ? 'Sin fases' 
                    : activeStep === -1 
                    ? 'Inicio' 
                    : `Fase ${activeStep + 1} de ${effectiveTotalPhases}`}
                </span>
                <span className="step-desc" title={activePhaseDesc}>
                  {effectiveTotalPhases === 0 
                    ? 'No hay acciones' 
                    : activeStep === -1 
                    ? 'Formación inicial (antes de jugar)' 
                    : `${activePhaseActions.length} acción(es) simultánea(s): ${activePhaseDesc || 'Movimientos paralelos'}`}
                </span>
              </div>

              {/* Mini scrubber dots for phases */}
              <div className="step-dots">
                {Array.from({ length: effectiveTotalPhases }).map((_, i) => (
                  <span
                    key={i}
                    className={`step-dot ${i <= activeStep ? 'filled' : ''} ${i === activeStep ? 'current' : ''}`}
                    title={`Fase ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Playback Speed selector */}
            <div className="speed-selector desktop-only">
              {[0.5, 1, 1.5].map((speed) => (
                <button
                  key={speed}
                  className={`speed-pill ${playbackSpeed === speed ? 'active' : ''}`}
                  onClick={() => onChangeSpeed(speed)}
                >
                  {speed}x
                </button>
              ))}
            </div>

            {/* Open Playbook */}
            <button
              className="tool-btn secondary"
              onClick={onOpenPlaybookModal}
              title="Cargar otra jugada"
            >
              <FolderOpen size={15} />
              <span className="desktop-only">Jugadas</span>
            </button>
          </div>
        )}
      </div>
    </footer>
  );
}
