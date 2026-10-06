import React, { useState } from 'react';
import { 
  X, 
  Play, 
  Trash2, 
  Bookmark, 
  FileText, 
  Sparkles, 
  Layers, 
  Check, 
  Download,
  AlertCircle
} from 'lucide-react';

export default function PlaybookModal({
  isOpen,
  modalType, // 'save' | 'load'
  onClose,
  savedPlays,
  onSavePlay,
  onLoadPlay,
  onDeletePlay,
  currentActionsCount = 0
}) {
  const [playName, setPlayName] = useState('');
  const [playDescription, setPlayDescription] = useState('');
  const [playCategory, setPlayCategory] = useState('Ataque');

  if (!isOpen) return null;

  const handleSaveSubmit = (e) => {
    e.preventDefault();
    if (!playName.trim()) return;

    onSavePlay({
      name: playName.trim(),
      description: playDescription.trim() || 'Jugada táctica personalizada',
      category: playCategory
    });

    setPlayName('');
    setPlayDescription('');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Bookmark className="text-orange" size={22} />
            <div>
              <h2 className="modal-title">
                {modalType === 'save' ? 'Guardar Jugada en Memoria' : 'Biblioteca de Jugadas'}
              </h2>
              <p className="modal-subtitle">
                {modalType === 'save' 
                  ? 'Guarda la secuencia táctica con sus vectores para reproducirla luego'
                  : 'Selecciona una jugada para animar y mostrar a los jugadores'}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        {modalType === 'save' ? (
          <form onSubmit={handleSaveSubmit} className="save-play-form">
            <div className="form-group">
              <label>Nombre de la Jugada *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: Pick & Roll Central, Salida Fondo..."
                value={playName}
                onChange={(e) => setPlayName(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label>Categoría Táctica</label>
              <select
                className="form-input"
                value={playCategory}
                onChange={(e) => setPlayCategory(e.target.value)}
              >
                <option value="Ataque">Ataque Posicional</option>
                <option value="Contraataque">Transición Ofensiva / Contraataque</option>
                <option value="Fondo / Lateral">Saque de Fondo o Lateral</option>
                <option value="Defensa">Ajuste Defensivo</option>
                <option value="Tiro Libre">Rebote / Tiro Libre</option>
              </select>
            </div>

            <div className="form-group">
              <label>Descripción / Claves para el equipo</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Ej: El pívot bloquea ciego en cabecera, base lee la caída y pasa con pique picado..."
                value={playDescription}
                onChange={(e) => setPlayDescription(e.target.value)}
              />
            </div>

            <div className="save-summary-card">
              <AlertCircle size={16} className="text-orange" />
              <span>Se guardarán <strong>{currentActionsCount} acciones</strong> (movimientos y pases) con la formación actual.</span>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={!playName.trim()}>
                <Bookmark size={16} />
                <span>Guardar Jugada</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="load-play-list-wrap">
            <div className="plays-grid">
              {savedPlays.map((play) => (
                <div key={play.id} className="play-card">
                  <div className="play-card-head">
                    <span className="play-category-badge">{play.category || 'Táctica'}</span>
                    <span className="play-steps-badge">{play.actions ? play.actions.length : 0} acciones</span>
                  </div>

                  <h3 className="play-card-title">{play.name}</h3>
                  <p className="play-card-desc">{play.description}</p>

                  <div className="play-card-footer">
                    <button
                      className="btn-play-load"
                      onClick={() => {
                        onLoadPlay(play);
                        onClose();
                      }}
                    >
                      <Play size={14} />
                      <span>Cargar & Animar</span>
                    </button>

                    {!play.isPreset && (
                      <button
                        className="btn-delete"
                        title="Eliminar de la memoria"
                        onClick={() => onDeletePlay(play.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {savedPlays.length === 0 && (
              <div className="empty-plays">
                <FileText size={40} className="text-muted" />
                <p>No tienes jugadas grabadas aún. Crea una dibujando en la pizarra y presiona "Grabar Jugada".</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
