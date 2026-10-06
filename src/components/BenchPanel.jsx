import React, { useState } from 'react';
import { 
  UserPlus, 
  UserMinus, 
  Plus,
  Trash2,
  Settings,
  Check,
  X,
  Layers,
  RotateCcw,
  Eye
} from 'lucide-react';

export default function BenchPanel({
  roster,
  courtPlayers,
  formations = [],
  currentFormationId,
  isAssigningBall,
  designTool = 'setup',
  onDesignToolChange,
  isMobileOpen = false,
  onCloseMobile,
  onAssignBall,
  onAddPlayerToCourt,
  onRemovePlayerFromCourt,
  onApplyFormation,
  onOpenSaveFormationModal,
  onDeleteCustomFormation,
  onClearCourt
}) {
  const onCourtCount = courtPlayers.length;
  const isCourtFull = onCourtCount >= 5;
  const [isManagingFormations, setIsManagingFormations] = useState(false);

  return (
    <>
      {/* Mobile Backdrop when drawer is open */}
      {isMobileOpen && (
        <div 
          className="bench-drawer-backdrop" 
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside className={`bench-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Bottom Sheet Handle for touch drag */}
        <div className="bottom-sheet-handle mobile-only" onClick={onCloseMobile}>
          <span className="handle-bar" />
        </div>

        {/* Mobile-only Drawer Header */}
        <div className="mobile-drawer-header">
          <div className="drawer-title-group">
            <span className="drawer-title">Plantel & Disposiciones</span>
            <span className="drawer-badge">{onCourtCount} de 5 en cancha</span>
          </div>
          <button 
            className="drawer-close-btn" 
            onClick={onCloseMobile}
            title="Cerrar y ver cancha completa"
          >
            <Eye size={14} />
            <span>Ver Cancha</span>
          </button>
        </div>

        {/* ========================================================
            DISPOSICIONES / FORMACIONES TÁCTICAS (PRESETS & CUSTOM)
            ======================================================== */}
        <div className="formations-control-section">
          <div className="formations-header-row">
            <div className="formations-title-wrap">
              <Layers size={14} className="text-orange" />
              <span className="formations-title">Disposiciones</span>
            </div>

            <div className="formations-header-actions">
              <button
                className="formation-action-icon-btn highlight"
                title="Guardar ubicación actual de cancha como nueva disposición"
                onClick={() => {
                  onDesignToolChange?.('setup');
                  onOpenSaveFormationModal();
                }}
                disabled={courtPlayers.length === 0}
              >
                <Plus size={14} />
                <span>+ Guardar</span>
              </button>

              <button
                className={`formation-action-icon-btn ${isManagingFormations ? 'active' : ''}`}
                title="Gestionar / Eliminar disposiciones personalizadas"
                onClick={() => {
                  setIsManagingFormations(prev => !prev);
                }}
              >
                <Settings size={13} />
              </button>
            </div>
          </div>

          {/* Manage Formations Box */}
          {isManagingFormations && (
            <div className="formation-manager-box">
              <div className="manager-title-row">
                <span className="manager-title">Mis Disposiciones</span>
                <button
                  className="manager-close-btn"
                  onClick={() => setIsManagingFormations(false)}
                >
                  <X size={13} />
                </button>
              </div>
              <div className="manager-list">
                {formations.filter(f => f.isCustom).length === 0 ? (
                  <p className="manager-empty">No has creado disposiciones personalizadas aún. Ubica a los jugadores en la cancha y pulsa <strong>"+ Guardar"</strong>.</p>
                ) : (
                  formations.filter(f => f.isCustom).map((form) => (
                    <div key={form.id} className="manager-item">
                      <span className="manager-item-name">{form.name}</span>
                      <button
                        className="manager-del-btn"
                        title="Eliminar disposición"
                        onClick={() => onDeleteCustomFormation(form.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Formations Quick Pills Carousel */}
          <div className="formations-pills-row">
            {formations.map((form) => {
              const isActive = currentFormationId === form.id;
              return (
                <button
                  key={form.id}
                  className={`formation-pill ${isActive ? 'active' : ''} ${form.isCustom ? 'custom' : ''}`}
                  onClick={() => {
                    onApplyFormation(form.id);
                  }}
                  title={form.name}
                >
                  <span>{form.name}</span>
                  {form.isCustom && <span className="custom-star">★</span>}
                </button>
              );
            })}
          </div>

          {/* Quick Clear Court Action */}
          <div className="bench-sub-actions">
            <button 
              className="bench-clear-btn"
              title="Quitar todos los jugadores de la cancha"
              onClick={onClearCourt}
              disabled={onCourtCount === 0}
            >
              <RotateCcw size={12} />
              <span>Limpiar Cancha ({onCourtCount})</span>
            </button>
          </div>
        </div>

        {/* ========================================================
            ROSTER LIST STRICTLY PLAYERS #4 TO #18
            ======================================================== */}
        <div className="bench-roster-scroll">
          <div className="bench-roster-grid">
            {roster.map((player) => {
              const onCourt = courtPlayers.some((p) => p.number === player.number);
              const playerOnCourtObj = courtPlayers.find((p) => p.number === player.number);
              const hasBall = playerOnCourtObj ? playerOnCourtObj.hasBall : false;

              return (
                <div
                  key={player.number}
                  className={`bench-player-card ${onCourt ? 'active-court' : ''} ${hasBall ? 'has-ball' : ''} ${isAssigningBall && onCourt ? 'assign-target' : ''}`}
                  onClick={() => {
                    if (isAssigningBall && onCourt) {
                      onAssignBall(player.number);
                      return;
                    }
                    if (onCourt) {
                      onRemovePlayerFromCourt(player.number);
                    } else {
                      if (!isCourtFull) {
                        onAddPlayerToCourt(player.number);
                      }
                    }
                  }}
                >
                  <div className="player-number-circle">
                    <span className="number-val">#{player.number}</span>
                    {hasBall && <span className="mini-ball">🏀</span>}
                  </div>

                  <div className="player-meta">
                    <div className="player-name-row">
                      <span className="player-role">{player.position}</span>
                      <span className="player-tag">{player.name}</span>
                    </div>
                    <span className="player-status-label">
                      {onCourt ? (isAssigningBall ? '👉 Toca para dar balón' : 'En Cancha') : 'En Banco'}
                    </span>
                  </div>

                  <div className="player-action-icon">
                    {onCourt ? (
                      <UserMinus size={16} className="text-danger" title="Enviar al banco" />
                    ) : (
                      <UserPlus size={16} className={isCourtFull ? 'text-disabled' : 'text-blue'} title="Poner en cancha" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Close & Return to Court Button for Mobile */}
        <div className="mobile-drawer-footer">
          <button className="mobile-done-btn" onClick={onCloseMobile}>
            <span>✓ Listo (Ver Pizarra Completa)</span>
          </button>
        </div>
      </aside>
    </>
  );
}
