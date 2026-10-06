import React, { useState } from 'react';
import { Layers, X, Check, Bookmark } from 'lucide-react';

export default function SaveFormationModal({
  isOpen,
  onClose,
  courtPlayers = [],
  onSaveFormation
}) {
  const [formationName, setFormationName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formationName.trim()) return;
    onSaveFormation(formationName.trim());
    setFormationName('');
    onClose();
  };

  const playerNumbers = courtPlayers.map(p => `#${p.number}`).join(', ');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container save-formation-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Layers className="text-orange" size={20} />
            <div>
              <h2 className="modal-title">Guardar Disposición Inicial</h2>
              <p className="modal-subtitle">Guarda la ubicación actual de los jugadores en la cancha</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="save-play-form">
          <div className="formation-court-preview-box">
            <span className="preview-label">Jugadores en Cancha ({courtPlayers.length}):</span>
            <span className="preview-numbers">{playerNumbers || 'Ninguno'}</span>
            <p className="preview-hint">
              💡 La posición exacta en la que están ubicados estos jugadores en la cancha quedará grabada como una disposición rápida reutilizable.
            </p>
          </div>

          <div className="form-group">
            <label>Nombre de la Disposición *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej: Cuernos 1-4 abierto, Pick Central 1-3-1, Caja 1-2-2..."
              value={formationName}
              onChange={(e) => setFormationName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={!formationName.trim() || courtPlayers.length === 0}
            >
              <Check size={16} />
              <span>Guardar Disposición</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
