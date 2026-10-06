import React from 'react';
import { Eraser, Trash2, Users, Shield } from 'lucide-react';

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
  onReturnToBench
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
      {/* Quick Action Tools: Borrador, Limpiar Trazos, A la Banca */}
      <div className="scratch-actions-group">
        <button
          className={`scratch-tool-btn eraser-btn ${isEraserActive ? 'active-eraser' : ''}`}
          onClick={onToggleEraser}
          title={isEraserActive ? "Desactivar borrador" : "Borrador: pasa el dedo sobre un vector para borrarlo"}
        >
          <Eraser size={16} />
          <span className="scratch-btn-label">Borrador</span>
        </button>

        <button
          className="scratch-tool-btn"
          onClick={onClearDrawings}
          title="Borrar todos los trazos y vectores de la cancha"
        >
          <Trash2 size={15} />
          <span className="scratch-btn-label">Trazos</span>
        </button>

        <button
          className="scratch-tool-btn"
          onClick={onReturnToBench}
          title="Regresar todo el equipo al banco y limpiar la cancha"
          disabled={courtPlayers.length === 0 && opponentPlayers.length === 0 && freeBallPos === null}
        >
          <Users size={15} />
          <span className="scratch-btn-label">Banca</span>
        </button>
      </div>

      <div className="scratch-divider" />

      {/* 5 RED OPPONENT DEFENDERS (#1 TO #5) */}
      <div className="scratch-opponents-group">
        <div className="scratch-group-header">
          <span className="opponents-group-title">Rival</span>
          {onDeployOpponents && (
            <button
              className="deploy-opponents-btn"
              onClick={onDeployOpponents}
              title={opponentPlayers.length === 5 ? "Reubicar 5 rivales en formación" : "Desplegar 5 rivales en la cancha"}
            >
              <Shield size={12} />
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

      <div className="scratch-divider" />

      {/* Ball Item Chip */}
      <div className="scratch-ball-section">
        <button
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

      <div className="scratch-divider" />

      {/* Numbers Palette: Our Green Team (#4 through #18) */}
      <div className="scratch-numbers-scroll">
        <div className="scratch-numbers-list">
          {roster.map((player) => {
            const isPlaced = onCourtNumbers.has(player.number);
            const isSelected = selectedItem?.type === 'player' && selectedItem?.number === player.number;
            const playerOnCourt = courtPlayers.find(p => p.number === player.number);
            const hasBall = playerOnCourt?.hasBall;

            return (
              <button
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
                    ? `#${player.number} seleccionado: toca en la cancha para ubicarlo`
                    : isPlaced
                    ? `#${player.number} (En cancha) - Toca para reubicarlo con un clic`
                    : `#${player.number} (En banco) - Toca y luego haz clic en la cancha para colocarlo`
                }
              >
                <span className="chip-number">{player.number}</span>
                {hasBall && <span className="chip-mini-ball">🏀</span>}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
