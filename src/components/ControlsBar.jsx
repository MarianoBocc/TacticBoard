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
  const currentStepNum = activeStep === -1 ? totalSteps : activeStep + 1;
  const currentAction = activeStep >= 0 && activeStep < totalSteps ? actions[activeStep] : null;

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

              {/* Step Backward (-1) */}
              <button
                className="step-circle-btn"
                onClick={onStepBack}
                disabled={activeStep <= 0}
                title="Paso Anterior (-1 acción)"
              >
                <SkipBack size={16} />
              </button>

              {/* Play / Pause Primary Button */}
              <button
                className={`step-circle-btn play-main ${isPlaying ? 'playing' : ''}`}
                onClick={isPlaying ? onPause : onPlay}
                disabled={totalSteps === 0}
                title={isPlaying ? "Pausar animación" : "Iniciar animación completa"}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: 2 }} />}
              </button>

              {/* Step Forward (+1) */}
              <button
                className="step-circle-btn"
                onClick={onStepForward}
                disabled={activeStep >= totalSteps - 1}
                title="Paso Siguiente (+1 acción)"
              >
                <SkipForward size={16} />
              </button>
            </div>

            {/* Current Step Tracker & Description */}
            <div className="step-info-display desktop-only">
              <div className="step-indicator-text">
                <span className="step-num">Paso {totalSteps === 0 ? 0 : currentStepNum} de {totalSteps}</span>
                <span className="step-desc">
                  {currentAction ? currentAction.description : (totalSteps === 0 ? 'No hay acciones' : 'Formación inicial')}
                </span>
              </div>

              {/* Mini scrubber dots */}
              <div className="step-dots">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <span
                    key={i}
                    className={`step-dot ${i <= activeStep ? 'filled' : ''} ${i === activeStep ? 'current' : ''}`}
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
