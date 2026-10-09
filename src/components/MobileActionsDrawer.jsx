import React, { useRef } from 'react';
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
  Users, 
  X,
  Sliders,
  Check,
  ChevronLeft
} from 'lucide-react';

export default function MobileActionsDrawer({
  isOpen = false,
  onClose,
  mode = 'design', // 'design' | 'scratch' | 'animation'
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
  onReturnToBench,
  currentPlayName = ''
}) {
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);

  const totalSteps = actions.length;
  const currentStepNum = activeStep === -1 ? totalSteps : activeStep + 1;
  const currentAction = activeStep >= 0 && activeStep < totalSteps ? actions[activeStep] : null;

  // Swipe left inside drawer to close
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
    if (deltaX < -45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      onClose?.();
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="mobile-actions-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Slide-out Drawer from Left */}
      <aside 
        className={`mobile-actions-drawer ${isOpen ? 'mobile-open' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-label="Panel de Acciones Móvil"
      >
        {/* Drawer Header */}
        <div className="mobile-actions-header">
          <div className="mobile-actions-header-title">
            <Sliders size={18} className="text-orange" />
            <div className="title-text-wrap">
              <span className="drawer-main-title">Acciones & Pizarra</span>
              <span className="drawer-sub-title">
                {mode === 'design' ? 'Modo Jugada' : mode === 'animation' ? 'Modo Animación' : 'Modo Scratch'}
              </span>
            </div>
          </div>

          <button 
            className="drawer-close-btn"
            onClick={onClose}
            title="Cerrar y volver a la cancha"
          >
            <ChevronLeft size={16} />
            <span>Cancha</span>
          </button>
        </div>

        {/* Current Play Indicator */}
        <div className="mobile-play-badge-row">
          <span className="pulse-dot" />
          <span className="play-badge-label">Jugada activa:</span>
          <span className="play-badge-name" title={currentPlayName}>
            {currentPlayName || 'Pizarra Libre'}
          </span>
        </div>

        {/* Scrollable Content */}
        <div className="mobile-actions-content">
          {/* =========================================
              MODO SELECTOR TABS (4 PRINCIPALES)
              ========================================= */}
          <div className="mobile-section-group">
            <span className="mobile-section-title">Modo de Pizarra</span>
            <div className="mobile-mode-selector-grid">
              <button
                className={`mobile-mode-card ${mode === 'design' ? 'active' : ''}`}
                onClick={() => {
                  onPause?.();
                  onModeChange?.('design');
                }}
              >
                <div className="mode-card-icon-wrap icon-design">
                  <Compass size={18} />
                </div>
                <div className="mode-card-info">
                  <span className="mode-card-name">Jugada</span>
                  <span className="mode-card-desc">Diseño estructurado</span>
                </div>
                {mode === 'design' && <span className="mode-active-dot" />}
              </button>

              <button
                className={`mobile-mode-card ${mode === 'scratch' ? 'active' : ''}`}
                onClick={() => {
                  onPause?.();
                  onModeChange?.('scratch');
                }}
              >
                <div className="mode-card-icon-wrap icon-scratch">
                  <Pencil size={18} />
                </div>
                <div className="mode-card-info">
                  <span className="mode-card-name">Scratch</span>
                  <span className="mode-card-desc">Pizarra libre rápida</span>
                </div>
                {mode === 'scratch' && <span className="mode-active-dot" />}
              </button>

              <button
                className={`mobile-mode-card ${mode === 'animation' ? 'active' : ''}`}
                onClick={() => {
                  onModeChange?.('animation');
                }}
              >
                <div className="mode-card-icon-wrap icon-play">
                  <Play size={18} />
                </div>
                <div className="mode-card-info">
                  <span className="mode-card-name">Reproducir</span>
                  <span className="mode-card-desc">{totalSteps} {totalSteps === 1 ? 'paso' : 'pasos'}</span>
                </div>
                {totalSteps > 0 && <span className="mobile-step-counter-pill">{totalSteps}</span>}
              </button>

              <button
                className="mobile-mode-card save-mode-card"
                onClick={() => {
                  onOpenSaveModal?.();
                  onClose?.();
                }}
              >
                <div className="mode-card-icon-wrap icon-save">
                  <Save size={18} />
                </div>
                <div className="mode-card-info">
                  <span className="mode-card-name">Guardar</span>
                  <span className="mode-card-desc">En biblioteca</span>
                </div>
              </button>
            </div>
          </div>

          {/* =========================================
              CONTEXTUAL TOOLS ACCORDING TO ACTIVE MODE
              ========================================= */}

          {/* 1. MODO JUGADA (DESIGN) */}
          {mode === 'design' && (
            <div className="mobile-section-group">
              <span className="mobile-section-title">Herramientas de Jugada</span>

              {/* Submode Switcher: Inicio vs Trazar */}
              <div className="mobile-submode-pill-box">
                <button
                  className={`mobile-submode-pill ${designTool === 'setup' ? 'active' : ''}`}
                  onClick={() => onDesignToolChange?.('setup')}
                >
                  <span className="pill-icon">📍</span>
                  <div className="pill-text-col">
                    <span className="pill-title">Inicio (Ubicar)</span>
                    <span className="pill-desc">Acomodar sin trazar flechas</span>
                  </div>
                  {designTool === 'setup' && <Check size={14} className="pill-check" />}
                </button>

                <button
                  className={`mobile-submode-pill ${designTool === 'draw' ? 'active' : ''}`}
                  onClick={() => onDesignToolChange?.('draw')}
                >
                  <span className="pill-icon">✏️</span>
                  <div className="pill-text-col">
                    <span className="pill-title">Trazar (Acciones)</span>
                    <span className="pill-desc">Crear cortes, pases y tiros</span>
                  </div>
                  {designTool === 'draw' && <Check size={14} className="pill-check" />}
                </button>
              </div>

              {/* Action buttons */}
              <div className="mobile-action-buttons-list">
                {/* Asignar Balón */}
                <button
                  className={`mobile-action-row-btn ${isAssigningBall ? 'active-ball' : ''}`}
                  onClick={() => {
                    onToggleAssignBall?.();
                    onClose?.();
                  }}
                >
                  <div className="btn-icon-wrap ball-icon-wrap">🏀</div>
                  <div className="btn-label-wrap">
                    <span className="btn-primary-label">
                      {isAssigningBall ? 'Cancelar Asignación' : 'Asignar Balón'}
                    </span>
                    <span className="btn-secondary-label">Toca a un jugador en cancha</span>
                  </div>
                </button>

                {/* Deshacer */}
                <button
                  className="mobile-action-row-btn"
                  onClick={onUndoLastAction}
                  disabled={totalSteps === 0}
                >
                  <div className="btn-icon-wrap">
                    <Undo2 size={16} />
                  </div>
                  <div className="btn-label-wrap">
                    <span className="btn-primary-label">Deshacer Última Acción</span>
                    <span className="btn-secondary-label">Borra el último movimiento o pase</span>
                  </div>
                </button>

                {/* Limpiar Trazos */}
                <button
                  className="mobile-action-row-btn danger-btn"
                  onClick={onClearActions}
                  disabled={totalSteps === 0}
                >
                  <div className="btn-icon-wrap danger-icon">
                    <RotateCcw size={16} />
                  </div>
                  <div className="btn-label-wrap">
                    <span className="btn-primary-label">Limpiar Todos los Trazos</span>
                    <span className="btn-secondary-label">Reinicia la jugada a la formación inicial</span>
                  </div>
                </button>

                {/* Iniciar Nueva Jugada */}
                <button
                  className="mobile-action-row-btn"
                  onClick={() => {
                    onNewPlay?.();
                    onClose?.();
                  }}
                >
                  <div className="btn-icon-wrap">
                    <Plus size={16} />
                  </div>
                  <div className="btn-label-wrap">
                    <span className="btn-primary-label">Nueva Jugada desde Cero</span>
                    <span className="btn-secondary-label">Pizarra en blanco</span>
                  </div>
                </button>

                {/* Mis Jugadas / Biblioteca */}
                <button
                  className="mobile-action-row-btn highlight-btn"
                  onClick={() => {
                    onOpenPlaybookModal?.();
                    onClose?.();
                  }}
                >
                  <div className="btn-icon-wrap highlight-icon">
                    <FolderOpen size={16} />
                  </div>
                  <div className="btn-label-wrap">
                    <span className="btn-primary-label">Mis Jugadas Guardadas</span>
                    <span className="btn-secondary-label">Abrir biblioteca y cargar tácticas</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* 2. MODO ANIMACIÓN (REPRODUCIR) */}
          {mode === 'animation' && (
            <div className="mobile-section-group">
              <span className="mobile-section-title">Controles de Reproducción</span>

              {/* Step info card */}
              <div className="mobile-animation-status-card">
                <div className="status-header">
                  <span className="status-step-title">
                    Paso {totalSteps === 0 ? 0 : currentStepNum} de {totalSteps}
                  </span>
                  <span className="status-tag">
                    {totalSteps === 0 
                      ? 'Sin acciones' 
                      : activeStep === -1 
                      ? 'Inicio' 
                      : activeStep === totalSteps - 1 
                      ? 'Final' 
                      : 'En curso'}
                  </span>
                </div>
                <p className="status-description">
                  {currentAction ? currentAction.description : (totalSteps === 0 ? 'Traza movimientos primero en modo Jugada' : 'Formación inicial')}
                </p>

                {/* Progress bar / Scrubber dots */}
                <div className="mobile-scrubber-row">
                  {Array.from({ length: totalSteps }).map((_, i) => (
                    <button
                      key={i}
                      className={`mobile-scrubber-dot ${i <= activeStep ? 'filled' : ''} ${i === activeStep ? 'current' : ''}`}
                      onClick={() => onStepForward ? onGoToEnd : null}
                      title={`Ir a paso ${i + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Playback Transport Buttons */}
              <div className="mobile-transport-cluster">
                {/* Reset to Start */}
                <button
                  className="transport-circle-btn"
                  onClick={onResetToStart}
                  title="Reiniciar a formación inicial"
                >
                  <RotateCcw size={16} />
                </button>

                {/* Step Back (-1) */}
                <button
                  className="transport-circle-btn"
                  onClick={onStepBack}
                  disabled={activeStep <= 0}
                  title="Paso Anterior"
                >
                  <SkipBack size={18} />
                </button>

                {/* Main Play / Pause Button */}
                <button
                  className={`transport-circle-btn play-main ${isPlaying ? 'playing' : ''}`}
                  onClick={() => {
                    if (isPlaying) {
                      onPause?.();
                    } else {
                      onPlay?.();
                    }
                  }}
                  disabled={totalSteps === 0}
                  title={isPlaying ? "Pausar animación" : "Reproducir animación"}
                >
                  {isPlaying ? <Pause size={22} /> : <Play size={22} style={{ marginLeft: 3 }} />}
                </button>

                {/* Step Forward (+1) */}
                <button
                  className="transport-circle-btn"
                  onClick={onStepForward}
                  disabled={activeStep >= totalSteps - 1}
                  title="Paso Siguiente"
                >
                  <SkipForward size={18} />
                </button>
              </div>

              {/* Playback Speed selector */}
              <div className="mobile-speed-box">
                <span className="speed-box-label">Velocidad:</span>
                <div className="speed-pills-row">
                  {[0.5, 1, 1.5].map((speed) => (
                    <button
                      key={speed}
                      className={`speed-pill-btn ${playbackSpeed === speed ? 'active' : ''}`}
                      onClick={() => onChangeSpeed?.(speed)}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Open Playbook button */}
              <div className="mobile-action-buttons-list" style={{ marginTop: '0.75rem' }}>
                <button
                  className="mobile-action-row-btn highlight-btn"
                  onClick={() => {
                    onOpenPlaybookModal?.();
                    onClose?.();
                  }}
                >
                  <div className="btn-icon-wrap highlight-icon">
                    <FolderOpen size={16} />
                  </div>
                  <div className="btn-label-wrap">
                    <span className="btn-primary-label">Cargar Otra Jugada</span>
                    <span className="btn-secondary-label">Abrir biblioteca de tácticas</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* 3. MODO SCRATCH (PIZARRA RÁPIDA) */}
          {mode === 'scratch' && (
            <div className="mobile-section-group">
              <span className="mobile-section-title">Herramientas Scratch</span>

              <div className="mobile-action-buttons-list">
                {/* Borrador */}
                <button
                  className={`mobile-action-row-btn ${isEraserActive ? 'active-ball' : ''}`}
                  onClick={() => {
                    onToggleEraser?.();
                    onClose?.();
                  }}
                >
                  <div className="btn-icon-wrap">
                    <Eraser size={16} />
                  </div>
                  <div className="btn-label-wrap">
                    <span className="btn-primary-label">
                      {isEraserActive ? 'Desactivar Borrador' : 'Activar Borrador'}
                    </span>
                    <span className="btn-secondary-label">Pasa el dedo sobre un vector para borrarlo</span>
                  </div>
                </button>

                {/* Borrar Trazos */}
                <button
                  className="mobile-action-row-btn"
                  onClick={onClearDrawings}
                  disabled={totalSteps === 0}
                >
                  <div className="btn-icon-wrap">
                    <Trash2 size={16} />
                  </div>
                  <div className="btn-label-wrap">
                    <span className="btn-primary-label">Borrar Trazos Dibujados</span>
                    <span className="btn-secondary-label">Limpia vectores sin tocar jugadores</span>
                  </div>
                </button>

                {/* A la Banca */}
                <button
                  className="mobile-action-row-btn danger-btn"
                  onClick={onReturnToBench}
                >
                  <div className="btn-icon-wrap danger-icon">
                    <Users size={16} />
                  </div>
                  <div className="btn-label-wrap">
                    <span className="btn-primary-label">Regresar Equipo al Banco</span>
                    <span className="btn-secondary-label">Despeja la cancha completamente</span>
                  </div>
                </button>

                {/* Deshacer */}
                <button
                  className="mobile-action-row-btn"
                  onClick={onUndoLastAction}
                  disabled={totalSteps === 0}
                >
                  <div className="btn-icon-wrap">
                    <Undo2 size={16} />
                  </div>
                  <div className="btn-label-wrap">
                    <span className="btn-primary-label">Deshacer Última Acción</span>
                    <span className="btn-secondary-label">Borra el último movimiento o pase</span>
                  </div>
                </button>

                {/* Playbook */}
                <button
                  className="mobile-action-row-btn highlight-btn"
                  onClick={() => {
                    onOpenPlaybookModal?.();
                    onClose?.();
                  }}
                >
                  <div className="btn-icon-wrap highlight-icon">
                    <FolderOpen size={16} />
                  </div>
                  <div className="btn-label-wrap">
                    <span className="btn-primary-label">Mis Jugadas Guardadas</span>
                    <span className="btn-secondary-label">Biblioteca de tácticas</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="mobile-actions-footer">
          <button 
            className="mobile-actions-return-btn"
            onClick={onClose}
          >
            <span>✓ Volver a la Cancha</span>
          </button>
        </div>
      </aside>
    </>
  );
}
