import React from 'react';
import { 
  Maximize2, 
  Layers, 
  Palette, 
  Users
} from 'lucide-react';

export default function TopBar({
  courtType,
  onToggleCourtType,
  theme,
  onToggleTheme,
  currentPlayName,
  isRecording,
  onToggleMobileBench,
  isMobileBenchOpen,
  courtPlayersCount = 0
}) {
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  return (
    <header className="topbar">
      {/* App Brand */}
      <div className="topbar-brand">
        <div className="brand-logo-icon">
          <span className="basketball-emblem">🏀</span>
        </div>
        <div className="brand-text-col">
          <div className="brand-title-row">
            <h1 className="brand-title">TacticApp</h1>
            <span className="brand-tag desktop-only">FIBA</span>
          </div>
          <p className="brand-subtitle desktop-only">Pizarra Táctica</p>
        </div>
      </div>

      {/* Active Play Banner (Desktop/Tablet) */}
      <div className="current-play-banner desktop-only">
        <span className="pulse-dot" />
        <span className="play-name-text">
          {currentPlayName ? currentPlayName : 'Pizarra Libre'}
        </span>
      </div>

      {/* Actions */}
      <div className="topbar-actions">
        {/* Mobile Toggle Button for Bench Drawer */}
        <button
          className={`topbar-btn mobile-bench-btn ${isMobileBenchOpen ? 'active' : ''}`}
          onClick={onToggleMobileBench}
          title="Abrir Plantel de Jugadores y Disposiciones"
        >
          <Users size={16} />
          <span className="bench-btn-text">Plantel</span>
          <span className="mobile-bench-pill">{courtPlayersCount}/5</span>
        </button>

        {/* Court Half / Full toggle */}
        <button
          className="topbar-btn"
          onClick={onToggleCourtType}
          title="Alternar entre Media Cancha y Cancha Completa"
        >
          <Layers size={15} />
          <span className="desktop-only">{courtType === 'half' ? 'Media Cancha' : 'Cancha Entera'}</span>
          <span className="mobile-only">{courtType === 'half' ? 'Media' : 'Entera'}</span>
        </button>

        {/* Theme Parquet / Slate */}
        <button
          className="topbar-btn icon-btn"
          onClick={onToggleTheme}
          title="Alternar apariencia de cancha (Parquet / Slate)"
        >
          <Palette size={15} />
        </button>

        {/* Fullscreen for Tablet / Mobile */}
        <button
          className="topbar-btn icon-only desktop-only"
          onClick={toggleFullscreen}
          title="Pantalla Completa"
        >
          <Maximize2 size={16} />
        </button>
      </div>
    </header>
  );
}
