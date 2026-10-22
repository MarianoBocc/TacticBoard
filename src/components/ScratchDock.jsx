import React from 'react';
import { Eraser, Trash2, Users, Shield, Pencil, MapPin, Zap } from 'lucide-react';

export default function ScratchDock({
  courtType = 'half', // 'half' | 'full'
  roster = [],
  courtPlayers = [],
  opponentPlayers = [],
  freeBallPos = null,
  selectedItem = null, // { type: 'player', number: number } | { type: 'opponent', number: number } | { type: 'ball' } | null
  onSelectItem,
  onDeployOpponents,
  isEraserActive = false,
  onToggleEraser,
  onClearDrawings,
  onReturnToBench,
  designTool = 'setup', // 'setup' (Ubicar) | 'draw' (Trazar)
  onDesignToolChange,
  actionsCount = 0,
  currentPhase = 1,
  onNextPhase
}) {
  const onCourtNumbers = new Set(courtPlayers.map(p => p.number));
  const onCourtOpponents = new Set(opponentPlayers.map(o => o.number));
  const hasBallCarrier = courtPlayers.some(p => p.hasBall) || opponentPlayers.some(o => o.hasBall);
  const isBallOnCourt = hasBallCarrier || freeBallPos !== null;

  const opponentNumbers = [1, 2, 3, 4, 5];

  return (
    <aside 
      className={`scratch-dock ${courtType === 'full' ? 'dock-right' : 'dock-bottom'}`}
      aria-label="Paleta de herramientas Scratch"
    >
      {/* ========================================================
          ACCIONES TÁCTICAS PRINCIPALES (MÁS GRANDES Y ACCESIBLES)
          ======================================================== */}
      <div className="scratch-actions-group">
        {/* Selector de Modo: Trazar vs Ubicar */}
        <div className="scratch-mode-toggle-group">
          <button
            type="button"
            className={`mode-switch-btn ${designTool === 'draw' ? 'active-draw-mode' : ''}`}
            onClick={() => onDesignToolChange?.('draw')}
            title="Modo Trazar: al arrastrar jugadores se dibujan flechas de corte, drible o tiro"
          >
            <Pencil size={18} />
            <span className="scratch-btn-label">Trazar</span>
          </button>

          <button
            type="button"
            className={`mode-switch-btn ${designTool === 'setup' ? 'active-setup-mode' : ''}`}
            onClick={() => onDesignToolChange?.('setup')}
            title="Modo Ubicar: mueve y coloca a los jugadores libremente sin dibujar flechas"
          >
            <MapPin size={18} />
            <span className="scratch-btn-label">Ubicar</span>
          </button>
        </div>

        {/* Botón de Fase en Modo Trazar */}
        {designTool === 'draw' && (
          <button
            type="button"
            className="scratch-tool-btn phase-step-btn"
            onClick={onNextPhase}
            title={`Fase táctica ${currentPhase}: las acciones se ejecutan simultáneamente. Toca para avanzar a la Siguiente Fase`}
          >
            <Zap size={18} />
            <span className="scratch-btn-label">Fase {currentPhase}</span>
            <span className="scratch-phase-plus">+</span>
          </button>
        )}

        {/* Botón Borrador táctil */}
        <button
          type="button"
          className={`scratch-tool-btn eraser-btn ${isEraserActive ? 'active-eraser' : ''}`}
          onClick={onToggleEraser}
          title={isEraserActive ? "Desactivar borrador" : "Borrador táctil: pasa el dedo sobre un trazo para eliminarlo"}
        >
          <Eraser size={18} />
          <span className="scratch-btn-label">{isEraserActive ? 'Borrando' : 'Borrador'}</span>
        </button>

        {/* Botón Eliminar / Limpiar trazos */}
        <button
          type="button"
          className="scratch-tool-btn clear-btn"
          onClick={onClearDrawings}
          title="Eliminar todos los trazos dibujados sin mover a los jugadores"
          disabled={actionsCount === 0}
        >
          <Trash2 size={18} />
          <span className="scratch-btn-label">Eliminar</span>
          {actionsCount > 0 && <span className="scratch-action-count">{actionsCount}</span>}
        </button>

        {/* Botón A la Banca */}
        <button
          type="button"
          className="scratch-tool-btn bench-btn"
          onClick={onReturnToBench}
          title="Regresar todo el equipo al banco y despejar la cancha"
          disabled={courtPlayers.length === 0 && opponentPlayers.length === 0 && freeBallPos === null}
        >
          <Users size={18} />
          <span className="scratch-btn-label">Banca</span>
        </button>
      </div>

      <div className="scratch-divider" />

      {/* ========================================================
          GRILLA DE NÚMEROS Y FICHAS (UBICADA MÁS ABAJO)
          ======================================================== */}
      <div className="scratch-chips-area">
        {/* 5 RIVALES DEFENSIVOS ROJOS (#1 AL #5) */}
        <div className="scratch-opponents-group">
          <div className="scratch-group-header">
            <span className="opponents-group-title">Rival</span>
            {onDeployOpponents && (
              <button
                type="button"
                className="deploy-opponents-btn"
                onClick={onDeployOpponents}
                title={opponentPlayers.length === 5 ? "Reubicar 5 rivales en formación" : "Desplegar 5 rivales en la cancha"}
              >
                <Shield size={13} />
                <span>{opponentPlayers.length === 5 ? '5✓' : '+5'}</span>
              </button>
            )}
          </div>
          <div className="scratch-opponents-list">
            {opponentNumbers.map((num) => {
              const isPlaced = onCourtOpponents.has(num);
              const isSelected = selectedItem?.type === 'opponent' && selectedItem?.number === num;
              const oppOnCourt = opponentPlayers.find(o => o.number === num);
              const hasBall = oppOnCourt?.hasBall;

              return (
                <button
                  type="button"
                  key={`opp-${num}`}
                  className={`scratch-item-chip opponent-chip ${isSelected ? 'selected' : ''} ${
                    isPlaced ? 'placed-court' : ''
                  } ${hasBall ? 'has-ball' : ''}`}
                  onClick={() => {
                    if (isSelected) {
                      onSelectItem(null);
                    } else {
                      onSelectItem({ type: 'opponent', number: num });
                    }
                  }}
                  title={
                    isSelected
                      ? `Rival #${num} seleccionado: toca en la cancha para colocarlo`
                      : isPlaced
                      ? `Rival #${num} en cancha: toca para moverlo`
                      : `Colocar Rival #${num} en la cancha`
                  }
                >
                  <span className="chip-number">{num}</span>
                  {hasBall && <span className="chip-mini-ball">🏀</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="scratch-sub-divider" />

        {/* BALÓN SUELTO (🏀) */}
        <div className="scratch-ball-section">
          <button
            type="button"
            className={`scratch-item-chip ball-chip ${
              selectedItem?.type === 'ball' ? 'selected' : ''
            } ${isBallOnCourt ? 'placed-court' : ''}`}
            onClick={() => {
              if (selectedItem?.type === 'ball') {
                onSelectItem(null);
              } else {
                onSelectItem({ type: 'ball' });
              }
            }}
            title={
              selectedItem?.type === 'ball'
                ? "Balón seleccionado: toca en la cancha o sobre un jugador para ubicarlo"
                : "Seleccionar balón para colocarlo en la cancha o entregarlo a un jugador"
            }
          >
            <span className="ball-emoji-icon">🏀</span>
          </button>
        </div>

        <div className="scratch-sub-divider" />

        {/* FICHAS DEL EQUIPO VERDE (#4 AL #19) */}
        <div className="scratch-numbers-scroll">
          <div className="scratch-numbers-list">
            {roster.map((player) => {
              const isPlaced = onCourtNumbers.has(player.number);
              const isSelected = selectedItem?.type === 'player' && selectedItem?.number === player.number;
              const playerOnCourt = courtPlayers.find(p => p.number === player.number);
              const hasBall = playerOnCourt?.hasBall;

              return (
                <button
                  type="button"
                  key={player.number}
                  className={`scratch-item-chip player-chip ${isSelected ? 'selected' : ''} ${
                    isPlaced ? 'placed-court' : ''
                  } ${hasBall ? 'has-ball' : ''}`}
                  onClick={() => {
                    if (isSelected) {
                      onSelectItem(null);
                    } else {
                      onSelectItem({ type: 'player', number: player.number });
                    }
                  }}
                  title={
                    isSelected
                      ? `#${player.number} (${player.name || 'Sin nombre'}) seleccionado: toca en la cancha para ubicarlo`
                      : isPlaced
                      ? `#${player.number} (${player.name || 'Sin nombre'}) (En cancha) - Toca para reubicarlo`
                      : `#${player.number} (${player.name || 'Sin nombre'}) (En banco) - Toca para colocarlo`
                  }
                >
                  <span className="chip-number">{player.number}</span>
                  {hasBall && <span className="chip-mini-ball">🏀</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
