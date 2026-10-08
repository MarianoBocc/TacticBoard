import React, { useState, useEffect } from 'react';
import { Pencil, X, Check } from 'lucide-react';

export default function EditPlayerModal({
  isOpen,
  onClose,
  player, // { number, name, position, isOpponent }
  onSavePlayer
}) {
  const [playerName, setPlayerName] = useState('');
  const [position, setPosition] = useState('PG');

  useEffect(() => {
    if (player) {
      setPlayerName(player.name || '');
      setPosition(player.position || 'PG');
    }
  }, [player, isOpen]);

  if (!isOpen || !player) return null;

  const isOpponent = Boolean(player.isOpponent);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSavePlayer(
      player.number,
      {
        name: playerName.trim(),
        position
      },
      isOpponent
    );
    onClose();
  };

  const positions = [
    { code: 'PG', label: 'Base' },
    { code: 'SG', label: 'Escolta' },
    { code: 'SF', label: 'Alero' },
    { code: 'PF', label: 'Ala-Pívot' },
    { code: 'C', label: 'Pívot' }
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container edit-player-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className={`edit-player-avatar-badge ${isOpponent ? 'opponent' : 'team'}`}>
              <span>#{player.number}</span>
            </div>
            <div>
              <h2 className="modal-title">
                {isOpponent ? `Rival #${player.number}` : `Jugador #${player.number}`}
              </h2>
              <p className="modal-subtitle">
                {isOpponent 
                  ? 'Asignar nombre o referencia al defensor rival' 
                  : 'Asignar o sobreescribir el nombre para esta camiseta'}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="save-play-form">
          <div className="form-group">
            <label>Nombre del Jugador</label>
            <input
              type="text"
              className="form-input"
              placeholder={isOpponent ? "Ej: Marca personal, Presión, Defensor 1..." : "Ej: Manu Ginóbili, Facu, Curry, Mateo..."}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              autoFocus
              maxLength={24}
            />
            <span className="field-hint">
              💡 Este nombre quedará asignado al dorsal #{player.number} y se mostrará en la cancha y en la banca.
            </span>
          </div>

          {!isOpponent && (
            <div className="form-group">
              <label>Posición Táctica</label>
              <div className="position-chips-row">
                {positions.map((pos) => (
                  <button
                    key={pos.code}
                    type="button"
                    className={`position-chip-btn ${position === pos.code ? 'active' : ''}`}
                    onClick={() => setPosition(pos.code)}
                  >
                    <span className="pos-code">{pos.code}</span>
                    <span className="pos-label">{pos.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              <Check size={16} />
              <span>Guardar Nombre</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
