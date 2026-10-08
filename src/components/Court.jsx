import React, { useRef, useState, useCallback } from 'react';

export default function Court({
  courtType = 'half', // 'half' | 'full'
  theme = 'parquet', // 'parquet' | 'slate'
  courtPlayers = [],
  opponentPlayers = [],
  roster = [],
  actions = [],
  activeStep = -1,
  isPlaying = false,
  mode = 'design',
  designTool = 'setup',
  onDesignToolChange,
  isAssigningBall = false,
  onAssignBall,
  onPlayerMove,
  onPlayerPass,
  onOpponentMove,
  onRemovePlayer,
  onSaveFormation,
  onSavePlay,
  freeBallPos = null,
  onFreeBallMove,
  selectedScratchItem = null,
  onCourtClick,
  isEraserActive = false,
  onDeleteAction
}) {
  const containerRef = useRef(null);
  const [draggingPlayer, setDraggingPlayer] = useState(null);
  const [dragOrigin, setDragOrigin] = useState(null);
  const [livePos, setLivePos] = useState(null);

  // Opponent drag state (5 red defenders)
  const [draggingOpponent, setDraggingOpponent] = useState(null);
  const [opponentDragOrigin, setOpponentDragOrigin] = useState(null);

  // Free ball drag state (scratch mode)
  const [draggingFreeBall, setDraggingFreeBall] = useState(false);
  const [freeBallDragOrigin, setFreeBallDragOrigin] = useState(null);
  const [freeBallLivePos, setFreeBallLivePos] = useState(null);
  const isPointerDownRef = useRef(false);
  const pointerStartPosRef = useRef({ x: 0, y: 0, time: 0 });
  
  // Custom double tap tracker for tablets
  const lastTapRef = useRef({ time: 0, playerNumber: null });

  // ViewBox dimensions:
  // Half-court: 1000 x 900
  // Full-court (VERTICAL): 1000 x 1800 (15m width x 28m length - standard coaching clipboard)
  const courtWidth = 1000;
  const courtHeight = courtType === 'half' ? 900 : 1800;

  // Convert percentage (0-100) to SVG coordinates
  const pctToSvg = useCallback((xPct, yPct) => {
    return {
      x: (xPct / 100) * courtWidth,
      y: (yPct / 100) * courtHeight
    };
  }, [courtWidth, courtHeight]);

  // Convert client pointer event coordinates to percentage (0-100)
  const clientToPct = useCallback((clientX, clientY) => {
    if (!containerRef.current) return { x: 50, y: 50 };
    const rect = containerRef.current.getBoundingClientRect();
    const clampedX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const clampedY = Math.max(0, Math.min(rect.height, clientY - rect.top));

    return {
      x: Math.round(((clampedX / rect.width) * 100) * 10) / 10,
      y: Math.round(((clampedY / rect.height) * 100) * 10) / 10
    };
  }, []);

  // Handle double click / double tap for passing
  const handlePlayerInteraction = (playerNumber, e) => {
    // If we're in ball assign mode, just assign ball
    if (isAssigningBall) {
      onAssignBall(playerNumber);
      return;
    }

    const now = Date.now();
    const lastTap = lastTapRef.current;

    // Check if double tap on the same player within 360ms
    if (lastTap.playerNumber === playerNumber && (now - lastTap.time) < 360) {
      if (designTool === 'setup') {
        // In setup mode, double tap directly assigns the ball to this player!
        onAssignBall?.(playerNumber);
        lastTapRef.current = { time: 0, playerNumber: null };
        return;
      }
      // Find current ball carrier
      const ballCarrier = courtPlayers.find(p => p.hasBall);
      if (ballCarrier && ballCarrier.number !== playerNumber) {
        onPlayerPass(ballCarrier.number, playerNumber);
      }
      lastTapRef.current = { time: 0, playerNumber: null };
      return;
    }

    lastTapRef.current = { time: now, playerNumber };
  };

  // Helper to calculate distance from a point to a line segment (for eraser tool)
  const distToSegment = (p, v, w) => {
    const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = v.x + t * (w.x - v.x);
    const projY = v.y + t * (w.y - v.y);
    return Math.hypot(p.x - projX, p.y - projY);
  };

  // Check and erase any vectors intersected by the pointer
  const checkEraserIntersect = (clientX, clientY) => {
    if (!isEraserActive || !onDeleteAction) return;
    const pt = clientToPct(clientX, clientY);
    const hit = visibleActions.find(act => distToSegment(pt, act.from, act.to) < 5.5);
    if (hit) {
      onDeleteAction(hit.id);
    }
  };

  // Court background pointer down
  const handleCourtPointerDown = (e) => {
    isPointerDownRef.current = true;
    pointerStartPosRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };

    if (isEraserActive) {
      checkEraserIntersect(e.clientX, e.clientY);
    }
  };

  // Drag start for freestanding ball (Scratch mode)
  const handleFreeBallPointerDown = (e) => {
    if (isPlaying || isEraserActive) return;
    e.stopPropagation();
    e.target.setPointerCapture?.(e.pointerId);
    setDraggingFreeBall(true);
    setFreeBallDragOrigin({ x: freeBallPos.x, y: freeBallPos.y });
    setFreeBallLivePos({ x: freeBallPos.x, y: freeBallPos.y });
  };

  // Drag start for opponent player (red defender)
  const handleOpponentPointerDown = (opp, e) => {
    if (isPlaying || isEraserActive) return;
    e.stopPropagation();

    e.target.setPointerCapture?.(e.pointerId);
    setDraggingOpponent(opp.id);
    setOpponentDragOrigin({ x: opp.x, y: opp.y });
    setLivePos({ x: opp.x, y: opp.y });
  };

  // Drag start
  const handlePointerDown = (player, e) => {
    if (isPlaying || isEraserActive) return;
    
    // Check for double click interaction
    handlePlayerInteraction(player.number, e);

    if (isAssigningBall) return;

    e.target.setPointerCapture?.(e.pointerId);
    setDraggingPlayer(player.number);
    setDragOrigin({ x: player.x, y: player.y });
    setLivePos({ x: player.x, y: player.y });
  };

  // Drag move & eraser swipe
  const handlePointerMove = (e) => {
    if (isEraserActive && isPointerDownRef.current) {
      checkEraserIntersect(e.clientX, e.clientY);
      return;
    }

    if (draggingFreeBall) {
      const newPct = clientToPct(e.clientX, e.clientY);
      setFreeBallLivePos(newPct);
      return;
    }

    if (draggingOpponent) {
      const newPct = clientToPct(e.clientX, e.clientY);
      setLivePos(newPct);
      return;
    }

    if (!draggingPlayer) return;
    const newPct = clientToPct(e.clientX, e.clientY);
    setLivePos(newPct);
  };

  // Drag end & click detection
  const handlePointerUp = (e) => {
    const isClick = Date.now() - pointerStartPosRef.current.time < 320 &&
      Math.hypot(e.clientX - pointerStartPosRef.current.x, e.clientY - pointerStartPosRef.current.y) < 7;

    isPointerDownRef.current = false;

    // Free ball drag end
    if (draggingFreeBall && freeBallDragOrigin && freeBallLivePos) {
      const dx = freeBallLivePos.x - freeBallDragOrigin.x;
      const dy = freeBallLivePos.y - freeBallDragOrigin.y;
      const distance = Math.hypot(dx, dy);

      if (distance >= 1.5 && onFreeBallMove) {
        onFreeBallMove(freeBallDragOrigin, freeBallLivePos);
      }
      setDraggingFreeBall(false);
      setFreeBallDragOrigin(null);
      setFreeBallLivePos(null);
      return;
    }

    // Opponent drag end
    if (draggingOpponent && opponentDragOrigin && livePos) {
      const dx = livePos.x - opponentDragOrigin.x;
      const dy = livePos.y - opponentDragOrigin.y;
      const distance = Math.hypot(dx, dy);

      if (distance >= 1.5 && onOpponentMove) {
        onOpponentMove(draggingOpponent, livePos);
      }
      setDraggingOpponent(null);
      setOpponentDragOrigin(null);
      setLivePos(null);
      return;
    }

    // Player drag end
    if (draggingPlayer && dragOrigin && livePos) {
      const dx = livePos.x - dragOrigin.x;
      const dy = livePos.y - dragOrigin.y;
      const distance = Math.hypot(dx, dy);

      if (distance >= 1.5) {
        const movedPlayer = courtPlayers.find(p => p.number === draggingPlayer);
        if (movedPlayer) {
          onPlayerMove(draggingPlayer, dragOrigin, livePos, movedPlayer.hasBall);
        }
      }
    }

    setDraggingPlayer(null);
    setDragOrigin(null);
    setLivePos(null);

    // If coach clicked on court with an item selected in Scratch mode
    if (isClick && selectedScratchItem && onCourtClick && !isEraserActive) {
      const pct = clientToPct(e.clientX, e.clientY);
      onCourtClick(pct);
    }
  };

  // Visible actions up to activeStep (or all if activeStep is -1)
  // When in setup mode, vectors are hidden so the coach has a pristine court to place players!
  const visibleActions = designTool === 'setup' && mode !== 'scratch'
    ? [] 
    : (activeStep === -1 ? actions : actions.slice(0, activeStep + 1));

  // Find who currently has the ball
  const ballCarrier = courtPlayers.find(p => p.hasBall);

  return (
    <div 
      className={`court-wrapper ${theme}-theme ${courtType === 'full' ? 'full-court-vertical' : 'half-court-view'} ${isEraserActive ? 'eraser-mode-active' : ''}`}
      ref={containerRef}
      onPointerDown={handleCourtPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ cursor: isEraserActive ? 'crosshair' : selectedScratchItem ? 'cell' : 'default' }}
    >
      <svg
        className="court-svg"
        viewBox={`0 0 ${courtWidth} ${courtHeight}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Bold Arrow markers with dark contrast border for maximum visibility */}
          <marker
            id="arrow-pass"
            viewBox="0 0 12 12"
            refX="10"
            refY="6"
            markerWidth="9"
            markerHeight="9"
            orient="auto-start-reverse"
          >
            <path d="M 1 2 L 11 6 L 1 10 z" fill="#ff6600" stroke="#000000" strokeWidth="1.2" />
          </marker>

          <marker
            id="arrow-with-ball"
            viewBox="0 0 12 12"
            refX="10"
            refY="6"
            markerWidth="9"
            markerHeight="9"
            orient="auto-start-reverse"
          >
            <path d="M 1 2 L 11 6 L 1 10 z" fill="#00e5ff" stroke="#000000" strokeWidth="1.2" />
          </marker>

          <marker
            id="arrow-without-ball"
            viewBox="0 0 12 12"
            refX="10"
            refY="6"
            markerWidth="9"
            markerHeight="9"
            orient="auto-start-reverse"
          >
            <path d="M 1 2 L 11 6 L 1 10 z" fill="#ffffff" stroke="#000000" strokeWidth="1.2" />
          </marker>

          <marker
            id="arrow-shot"
            viewBox="0 0 12 12"
            refX="10"
            refY="6"
            markerWidth="9"
            markerHeight="9"
            orient="auto-start-reverse"
          >
            <path d="M 1 2 L 11 6 L 1 10 z" fill="#22c55e" stroke="#000000" strokeWidth="1.2" />
          </marker>

          {/* Gradients for court styling */}
          <radialGradient id="parquetGradient" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#dcb37e" />
            <stop offset="70%" stopColor="#c4975f" />
            <stop offset="100%" stopColor="#a97c45" />
          </radialGradient>

          <radialGradient id="slateGradient" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="70%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#090d16" />
          </radialGradient>

          {/* Pass Vector Glow Filter */}
          <filter id="passGlow" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#ff6600" floodOpacity="0.9" />
          </filter>

          {/* Shot Vector Glow Filter */}
          <filter id="shotGlow" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#22c55e" floodOpacity="0.9" />
          </filter>

          <filter id="ballCarrierGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#ff8800" floodOpacity="0.9" />
          </filter>
        </defs>

        {/* =========================================
            COURT FLOOR & FIBA BASKETBALL MARKINGS
            ========================================= */}
        <rect
          x="0"
          y="0"
          width={courtWidth}
          height={courtHeight}
          fill={theme === 'parquet' ? "url(#parquetGradient)" : "url(#slateGradient)"}
          rx="12"
        />

        {/* Court Boundary Lines */}
        <rect
          x="40"
          y="40"
          width={courtWidth - 80}
          height={courtHeight - 80}
          fill="none"
          stroke="rgba(255, 255, 255, 0.9)"
          strokeWidth="4"
        />

        {courtType === 'half' ? (
          /* =====================================
             HALF COURT CONFIGURATION (FIBA standard)
             ===================================== */
          <g className="half-court-markings">
            {/* Half Court Line */}
            <line
              x1="40"
              y1="820"
              x2="960"
              y2="820"
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth="4"
            />

            {/* Half Court Center Circle */}
            <path
              d="M 380 820 A 120 120 0 0 1 620 820"
              fill="none"
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth="4"
            />

            {/* The Key / Restricted Lane (Paint area) */}
            <rect
              x="360"
              y="40"
              width="280"
              height="380"
              fill={theme === 'parquet' ? "rgba(160, 114, 62, 0.35)" : "rgba(30, 41, 59, 0.45)"}
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth="4"
            />

            {/* Free Throw Circle - Solid half */}
            <path
              d="M 360 420 A 140 140 0 0 0 640 420"
              fill="none"
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth="4"
            />
            {/* Free Throw Circle - Dashed half */}
            <path
              d="M 360 420 A 140 140 0 0 1 640 420"
              fill="none"
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth="3"
              strokeDasharray="12 10"
            />

            {/* 3-Point Line (6.75m FIBA) */}
            <path
              d="M 120 40 L 120 180 A 380 380 0 0 0 880 180 L 880 40"
              fill="none"
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth="4"
            />

            {/* Restricted Area No-Charge Arc */}
            <path
              d="M 440 135 A 60 60 0 0 0 560 135"
              fill="none"
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth="3"
            />

            {/* Backboard & Rim */}
            <line
              x1="450"
              y1="100"
              x2="550"
              y2="100"
              stroke="#ffffff"
              strokeWidth="6"
            />
            {/* Hoop Rim */}
            <circle
              cx="500"
              cy="125"
              r="22"
              fill="none"
              stroke="#ff5500"
              strokeWidth="5"
            />
            {/* Net connection */}
            <line x1="500" y1="100" x2="500" y2="103" stroke="#ffffff" strokeWidth="4" />
          </g>
        ) : (
          /* ========================================================
             FULL COURT VERTICAL CONFIGURATION (Coaching Clipboard)
             Top basket at top, Bottom basket at bottom, Center at y=900
             ======================================================== */
          <g className="full-court-vertical-markings">
            {/* Half-court center line across width */}
            <line
              x1="40"
              y1="900"
              x2="960"
              y2="900"
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth="4"
            />
            {/* Center circle */}
            <circle
              cx="500"
              cy="900"
              r="130"
              fill="none"
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth="4"
            />

            {/* ---------- TOP BASKET HALF ---------- */}
            {/* Top Key / Paint */}
            <rect
              x="360"
              y="40"
              width="280"
              height="380"
              fill={theme === 'parquet' ? "rgba(160, 114, 62, 0.35)" : "rgba(30, 41, 59, 0.45)"}
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth="4"
            />
            {/* Top Free Throw Circle (solid court side, dashed paint side) */}
            <path
              d="M 360 420 A 140 140 0 0 0 640 420"
              fill="none"
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth="4"
            />
            <path
              d="M 360 420 A 140 140 0 0 1 640 420"
              fill="none"
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth="3"
              strokeDasharray="12 10"
            />
            {/* Top 3-Point Line */}
            <path
              d="M 120 40 L 120 180 A 380 380 0 0 0 880 180 L 880 40"
              fill="none"
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth="4"
            />
            {/* Top Restricted Area */}
            <path
              d="M 440 125 A 60 60 0 0 0 560 125"
              fill="none"
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth="3"
            />
            {/* Top Backboard & Rim */}
            <line x1="450" y1="90" x2="550" y2="90" stroke="#ffffff" strokeWidth="6" />
            <circle cx="500" cy="115" r="22" fill="none" stroke="#ff5500" strokeWidth="5" />
            <line x1="500" y1="90" x2="500" y2="93" stroke="#ffffff" strokeWidth="4" />

            {/* ---------- BOTTOM BASKET HALF ---------- */}
            {/* Bottom Key / Paint */}
            <rect
              x="360"
              y="1380"
              width="280"
              height="380"
              fill={theme === 'parquet' ? "rgba(160, 114, 62, 0.35)" : "rgba(30, 41, 59, 0.45)"}
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth="4"
            />
            {/* Bottom Free Throw Circle (solid court side, dashed paint side) */}
            <path
              d="M 360 1380 A 140 140 0 0 1 640 1380"
              fill="none"
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth="4"
            />
            <path
              d="M 360 1380 A 140 140 0 0 0 640 1380"
              fill="none"
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth="3"
              strokeDasharray="12 10"
            />
            {/* Bottom 3-Point Line */}
            <path
              d="M 120 1760 L 120 1620 A 380 380 0 0 1 880 1620 L 880 1760"
              fill="none"
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth="4"
            />
            {/* Bottom Restricted Area */}
            <path
              d="M 440 1675 A 60 60 0 0 1 560 1675"
              fill="none"
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth="3"
            />
            {/* Bottom Backboard & Rim */}
            <line x1="450" y1="1710" x2="550" y2="1710" stroke="#ffffff" strokeWidth="6" />
            <circle cx="500" cy="1685" r="22" fill="none" stroke="#ff5500" strokeWidth="5" />
            <line x1="500" y1="1710" x2="500" y2="1707" stroke="#ffffff" strokeWidth="4" />
          </g>
        )}

        {/* =========================================
            TACTICAL ACTION VECTORS (SUPER HIGH CONTRAST)
            1. Player without ball: WHITE DOTTED vector + dark outline
            2. Player with ball: ELECTRIC CYAN SOLID vector + dark outline
            3. Ball pass: NEON ORANGE vector + glowing drop-shadow
            ========================================= */}
        <g className="action-vectors">
          {visibleActions.map((action, idx) => {
            const startSvg = pctToSvg(action.from.x, action.from.y);
            const endSvg = pctToSvg(action.to.x, action.to.y);

            // Calculate angle to offset arrowhead from player circle center
            const dx = endSvg.x - startSvg.x;
            const dy = endSvg.y - startSvg.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // If distance is too small, skip
            if (dist < 10) return null;

            // Offset endpoint slightly backwards so arrow lands just outside player radius (~42px)
            const targetOffset = 48;
            const adjustedEndX = endSvg.x - (dx / dist) * targetOffset;
            const adjustedEndY = endSvg.y - (dy / dist) * targetOffset;

            if (action.type === 'pass') {
              // PASS VECTOR (VIBRANT NEON ORANGE WITH HIGH CONTRAST)
              return (
                <g 
                  key={action.id || `pass-${idx}`} 
                  className="pass-vector-group"
                  onClick={(e) => {
                    if (isEraserActive) {
                      e.stopPropagation();
                      onDeleteAction?.(action.id);
                    }
                  }}
                  style={{ cursor: isEraserActive ? 'crosshair' : 'default' }}
                >
                  {/* Invisible wide hit area for finger swipe & tap eraser */}
                  <line
                    x1={startSvg.x}
                    y1={startSvg.y}
                    x2={adjustedEndX}
                    y2={adjustedEndY}
                    stroke="transparent"
                    strokeWidth="38"
                    pointerEvents="all"
                  />
                  {/* Subtle wide glow underline */}
                  <line
                    x1={startSvg.x}
                    y1={startSvg.y}
                    x2={adjustedEndX}
                    y2={adjustedEndY}
                    stroke="rgba(255, 102, 0, 0.4)"
                    strokeWidth="15"
                    strokeLinecap="round"
                    pointerEvents="none"
                  />
                  {/* Dark contrast backline */}
                  <line
                    x1={startSvg.x}
                    y1={startSvg.y}
                    x2={adjustedEndX}
                    y2={adjustedEndY}
                    stroke="rgba(0, 0, 0, 0.85)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    pointerEvents="none"
                  />
                  {/* Main orange trajectory line with arrow */}
                  <line
                    x1={startSvg.x}
                    y1={startSvg.y}
                    x2={adjustedEndX}
                    y2={adjustedEndY}
                    stroke="#ff6600"
                    strokeWidth="6"
                    strokeLinecap="round"
                    markerEnd="url(#arrow-pass)"
                    filter="url(#passGlow)"
                    pointerEvents="none"
                  />
                  {/* Pass sequence number badge */}
                  <circle
                    cx={(startSvg.x + endSvg.x) / 2}
                    cy={(startSvg.y + endSvg.y) / 2}
                    r="14"
                    fill="#ff6600"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    filter="drop-shadow(0 2px 5px rgba(0,0,0,0.8))"
                    pointerEvents="all"
                  />
                  <text
                    x={(startSvg.x + endSvg.x) / 2}
                    y={(startSvg.y + endSvg.y) / 2 + 5}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="13"
                    fontWeight="800"
                    fontFamily="var(--font-display)"
                    pointerEvents="none"
                  >
                    {idx + 1}
                  </text>
                </g>
              );
            } else if (action.type === 'shot') {
              // SHOT VECTOR (TIRO AL ARO - EMERALD GREEN ARC WITH TARGET BASKET ICON)
              return (
                <g 
                  key={action.id || `shot-${idx}`} 
                  className="shot-vector-group"
                  onClick={(e) => {
                    if (isEraserActive) {
                      e.stopPropagation();
                      onDeleteAction?.(action.id);
                    }
                  }}
                  style={{ cursor: isEraserActive ? 'crosshair' : 'default' }}
                >
                  {/* Invisible wide hit area for finger swipe & tap eraser */}
                  <line
                    x1={startSvg.x}
                    y1={startSvg.y}
                    x2={endSvg.x}
                    y2={endSvg.y}
                    stroke="transparent"
                    strokeWidth="38"
                    pointerEvents="all"
                  />
                  {/* Subtle wide glow underline */}
                  <line
                    x1={startSvg.x}
                    y1={startSvg.y}
                    x2={endSvg.x}
                    y2={endSvg.y}
                    stroke="rgba(34, 197, 94, 0.4)"
                    strokeWidth="16"
                    strokeLinecap="round"
                    pointerEvents="none"
                  />
                  {/* Dark contrast backline */}
                  <line
                    x1={startSvg.x}
                    y1={startSvg.y}
                    x2={endSvg.x}
                    y2={endSvg.y}
                    stroke="rgba(0, 0, 0, 0.9)"
                    strokeWidth="11"
                    strokeDasharray="14 8"
                    strokeLinecap="round"
                    pointerEvents="none"
                  />
                  {/* Main Shot Trajectory Line */}
                  <line
                    x1={startSvg.x}
                    y1={startSvg.y}
                    x2={endSvg.x}
                    y2={endSvg.y}
                    stroke="#22c55e"
                    strokeWidth="6"
                    strokeDasharray="14 8"
                    strokeLinecap="round"
                    markerEnd="url(#arrow-shot)"
                    filter="url(#shotGlow)"
                    pointerEvents="none"
                  />
                  {/* Basketball icon right at the target basket */}
                  <g transform={`translate(${endSvg.x}, ${endSvg.y})`} pointerEvents="all">
                    <circle r="14" fill="#ff7700" stroke="#ffffff" strokeWidth="2.5" filter="drop-shadow(0 2px 6px rgba(0,0,0,0.8))" />
                    <text textAnchor="middle" dy="4.5" fontSize="13" pointerEvents="none">🏀</text>
                  </g>
                  {/* Step order badge on trajectory */}
                  <circle
                    cx={(startSvg.x + endSvg.x) / 2}
                    cy={(startSvg.y + endSvg.y) / 2}
                    r="14"
                    fill="#15803d"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    filter="drop-shadow(0 2px 5px rgba(0,0,0,0.8))"
                    pointerEvents="all"
                  />
                  <text
                    x={(startSvg.x + endSvg.x) / 2}
                    y={(startSvg.y + endSvg.y) / 2 + 5}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="12"
                    fontWeight="800"
                    fontFamily="var(--font-display)"
                    pointerEvents="none"
                  >
                    🎯{idx + 1}
                  </text>
                </g>
              );
            } else {
              // MOVEMENT VECTOR
              const hasBall = action.hasBall;
              return (
                <g 
                  key={action.id || `move-${idx}`} 
                  className="move-vector-group"
                  onClick={(e) => {
                    if (isEraserActive) {
                      e.stopPropagation();
                      onDeleteAction?.(action.id);
                    }
                  }}
                  style={{ cursor: isEraserActive ? 'crosshair' : 'default' }}
                >
                  {/* Invisible wide hit area for finger swipe & tap eraser */}
                  <line
                    x1={startSvg.x}
                    y1={startSvg.y}
                    x2={adjustedEndX}
                    y2={adjustedEndY}
                    stroke="transparent"
                    strokeWidth="38"
                    pointerEvents="all"
                  />
                  {/* High contrast dark backing line */}
                  <line
                    x1={startSvg.x}
                    y1={startSvg.y}
                    x2={adjustedEndX}
                    y2={adjustedEndY}
                    stroke="rgba(0, 0, 0, 0.85)"
                    strokeWidth={hasBall ? "11" : "9.5"}
                    strokeDasharray={hasBall ? "none" : "12 8"}
                    strokeLinecap="round"
                    pointerEvents="none"
                  />
                  {/* Main movement line: Electric cyan if with ball, pure white if without ball */}
                  <line
                    x1={startSvg.x}
                    y1={startSvg.y}
                    x2={adjustedEndX}
                    y2={adjustedEndY}
                    stroke={hasBall ? "#00e5ff" : "#ffffff"}
                    strokeWidth={hasBall ? "6.5" : "5.5"}
                    strokeDasharray={hasBall ? "none" : "12 8"}
                    strokeLinecap="round"
                    markerEnd={hasBall ? "url(#arrow-with-ball)" : "url(#arrow-without-ball)"}
                    pointerEvents="none"
                  />
                  {/* Action order badge */}
                  <circle
                    cx={(startSvg.x + endSvg.x) / 2}
                    cy={(startSvg.y + endSvg.y) / 2}
                    r="13"
                    fill={hasBall ? "#0284c7" : "#334155"}
                    stroke="#ffffff"
                    strokeWidth="2"
                    filter="drop-shadow(0 2px 5px rgba(0,0,0,0.8))"
                    pointerEvents="all"
                  />
                  <text
                    x={(startSvg.x + endSvg.x) / 2}
                    y={(startSvg.y + endSvg.y) / 2 + 4.5}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="12"
                    fontWeight="800"
                    fontFamily="var(--font-display)"
                    pointerEvents="none"
                  >
                    {idx + 1}
                  </text>
                </g>
              );
            }
          })}

          {/* Live Drag Vector preview while coach is actively dragging */}
          {draggingPlayer && dragOrigin && livePos && (
            <g className="live-drag-vector">
              {(() => {
                const startSvg = pctToSvg(dragOrigin.x, dragOrigin.y);
                const endSvg = pctToSvg(livePos.x, livePos.y);
                const playerObj = courtPlayers.find(p => p.number === draggingPlayer);
                const hasBall = playerObj ? playerObj.hasBall : false;

                return (
                  <g>
                    <line
                      x1={startSvg.x}
                      y1={startSvg.y}
                      x2={endSvg.x}
                      y2={endSvg.y}
                      stroke="rgba(0, 0, 0, 0.7)"
                      strokeWidth={hasBall ? "9" : "7.5"}
                      strokeDasharray={hasBall ? "none" : "10 7"}
                      strokeLinecap="round"
                    />
                    <line
                      x1={startSvg.x}
                      y1={startSvg.y}
                      x2={endSvg.x}
                      y2={endSvg.y}
                      stroke={hasBall ? "#00e5ff" : "#ffffff"}
                      strokeWidth={hasBall ? "5.5" : "4.5"}
                      strokeDasharray={hasBall ? "none" : "10 7"}
                      strokeLinecap="round"
                      opacity="0.9"
                    />
                  </g>
                );
              })()}
            </g>
          )}

          {/* Live Free Ball Drag Vector preview (Scratch Mode pass simulation) */}
          {draggingFreeBall && freeBallDragOrigin && freeBallLivePos && (
            <g className="live-drag-vector free-ball-live-vector">
              {(() => {
                const startSvg = pctToSvg(freeBallDragOrigin.x, freeBallDragOrigin.y);
                const endSvg = pctToSvg(freeBallLivePos.x, freeBallLivePos.y);
                return (
                  <g>
                    <line
                      x1={startSvg.x}
                      y1={startSvg.y}
                      x2={endSvg.x}
                      y2={endSvg.y}
                      stroke="rgba(0, 0, 0, 0.75)"
                      strokeWidth="9"
                      strokeLinecap="round"
                    />
                    <line
                      x1={startSvg.x}
                      y1={startSvg.y}
                      x2={endSvg.x}
                      y2={endSvg.y}
                      stroke="#ff6600"
                      strokeWidth="5.5"
                      strokeLinecap="round"
                      markerEnd="url(#arrow-pass)"
                      opacity="0.9"
                    />
                  </g>
                );
              })()}
            </g>
          )}
        </g>

        {/* =========================================
            PLAYER BADGES ON COURT (#4 to #18)
            ========================================= */}
        <g className="court-players">
          {courtPlayers.map((player) => {
            const isBeingDragged = draggingPlayer === player.number;
            const currentCoords = isBeingDragged && livePos ? livePos : { x: player.x, y: player.y };
            const svgPos = pctToSvg(currentCoords.x, currentCoords.y);
            const isCarrier = player.hasBall;
            const rosterPlayer = roster.find(r => r.number === player.number);
            const playerName = player.name || rosterPlayer?.name;

            return (
              <g
                key={player.number}
                className={`player-svg-node ${isCarrier ? 'carrier' : ''} ${isBeingDragged ? 'dragging' : ''}`}
                transform={`translate(${svgPos.x}, ${svgPos.y})`}
                onPointerDown={(e) => handlePointerDown(player, e)}
                onClick={(e) => {
                  if (isAssigningBall) {
                    e.stopPropagation();
                    onAssignBall(player.number);
                  }
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  const carrier = courtPlayers.find(p => p.hasBall);
                  if (carrier && carrier.number !== player.number) {
                    onPlayerPass(carrier.number, player.number);
                  }
                }}
                style={{ cursor: isAssigningBall ? 'pointer' : 'grab' }}
              >
                {/* Touch hit area for easier finger manipulation on tablets */}
                <circle r="56" fill="transparent" pointerEvents="all" />

                {/* Glow ring if ball carrier */}
                {isCarrier && (
                  <circle
                    r="52"
                    fill="none"
                    stroke="#ff7700"
                    strokeWidth="4.5"
                    strokeDasharray="9 5"
                    className="ball-carrier-ring"
                  />
                )}

                {/* Outer shadow / touch highlight */}
                <circle
                  r="46"
                  fill="rgba(0, 0, 0, 0.65)"
                  filter="drop-shadow(0 6px 12px rgba(0,0,0,0.8))"
                />

                {/* Player Jersey Circle - Emerald Green Theme (Larger & Bolder) */}
                <circle
                  r="42"
                  fill={isCarrier ? "#064e3b" : "#15803d"}
                  stroke={isCarrier ? "#ff7700" : "#4ade80"}
                  strokeWidth={isCarrier ? "4.5" : "4"}
                  className="player-token-body"
                />

                {/* Player Number (#4 to #18) - Bigger and High-Contrast Legible */}
                <text
                  textAnchor="middle"
                  dy="12"
                  fill="#ffffff"
                  fontSize="34"
                  fontWeight="900"
                  fontFamily="var(--font-display)"
                  pointerEvents="none"
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.95))' }}
                >
                  {player.number}
                </text>

                {/* Player Name Badge under token */}
                {playerName && (
                  <g transform="translate(0, 54)" className="player-name-badge">
                    <rect
                      x={-Math.min(55, Math.max(26, playerName.length * 4.6 + 9))}
                      y="-9"
                      width={Math.min(110, Math.max(52, playerName.length * 9.2 + 18))}
                      height="18"
                      rx="6"
                      fill="rgba(10, 15, 29, 0.94)"
                      stroke={isCarrier ? "#ff7700" : "rgba(74, 222, 128, 0.65)"}
                      strokeWidth="1.2"
                      filter="drop-shadow(0 2px 4px rgba(0,0,0,0.85))"
                    />
                    <text
                      textAnchor="middle"
                      dy="4"
                      fill="#ffffff"
                      fontSize="12"
                      fontWeight="700"
                      fontFamily="var(--font-display)"
                      pointerEvents="none"
                    >
                      {playerName.length > 11 ? `${playerName.slice(0, 10)}…` : playerName}
                    </text>
                  </g>
                )}

                {/* Mini Ball Indicator icon attached to token */}
                {isCarrier && (
                  <g transform="translate(26, -28)" className="mini-ball-indicator">
                    <circle r="18" fill="#ff7700" stroke="#ffffff" strokeWidth="2.5" filter="drop-shadow(0 2px 5px rgba(0,0,0,0.7))" />
                    <text
                      textAnchor="middle"
                      dy="6"
                      fontSize="17"
                      pointerEvents="none"
                    >
                      🏀
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* =========================================
            OPPONENT TEAM DEFENDERS (5 RED TOKENS #1 to #5)
            ========================================= */}
        <g className="court-opponents">
          {opponentPlayers.map((opp) => {
            const isBeingDragged = draggingOpponent === opp.id;
            const currentCoords = isBeingDragged && livePos ? livePos : { x: opp.x, y: opp.y };
            const svgPos = pctToSvg(currentCoords.x, currentCoords.y);
            const oppHasBall = opp.hasBall;
            const oppName = opp.name;

            return (
              <g
                key={`opp-${opp.id}`}
                className={`player-svg-node opponent-node ${oppHasBall ? 'carrier' : ''} ${isBeingDragged ? 'dragging' : ''}`}
                transform={`translate(${svgPos.x}, ${svgPos.y})`}
                onPointerDown={(e) => handleOpponentPointerDown(opp, e)}
                style={{ cursor: isEraserActive ? 'crosshair' : 'grab' }}
              >
                {/* Touch hit area */}
                <circle r="56" fill="transparent" pointerEvents="all" />

                {/* Glow ring if opponent has ball */}
                {oppHasBall && (
                  <circle
                    r="52"
                    fill="none"
                    stroke="#ff7700"
                    strokeWidth="4.5"
                    strokeDasharray="9 5"
                    className="ball-carrier-ring"
                  />
                )}

                {/* Outer shadow */}
                <circle
                  r="46"
                  fill="rgba(0, 0, 0, 0.65)"
                  filter="drop-shadow(0 6px 12px rgba(0,0,0,0.8))"
                />

                {/* Opponent Jersey Circle - Ferrari Red Theme */}
                <circle
                  r="42"
                  fill={oppHasBall ? "#7f1d1d" : "#dc2626"}
                  stroke={oppHasBall ? "#ff7700" : "#fca5a5"}
                  strokeWidth={oppHasBall ? "4.5" : "4"}
                  className="opponent-token-body"
                />

                {/* Opponent Number (1 to 5) */}
                <text
                  textAnchor="middle"
                  dy="12"
                  fill="#ffffff"
                  fontSize="34"
                  fontWeight="900"
                  fontFamily="var(--font-display)"
                  pointerEvents="none"
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.95))' }}
                >
                  {opp.number}
                </text>

                {/* Opponent Name Badge */}
                {oppName && (
                  <g transform="translate(0, 54)" className="player-name-badge">
                    <rect
                      x={-Math.min(55, Math.max(26, oppName.length * 4.6 + 9))}
                      y="-9"
                      width={Math.min(110, Math.max(52, oppName.length * 9.2 + 18))}
                      height="18"
                      rx="6"
                      fill="rgba(10, 15, 29, 0.94)"
                      stroke="rgba(248, 113, 113, 0.65)"
                      strokeWidth="1.2"
                      filter="drop-shadow(0 2px 4px rgba(0,0,0,0.85))"
                    />
                    <text
                      textAnchor="middle"
                      dy="4"
                      fill="#ffffff"
                      fontSize="12"
                      fontWeight="700"
                      fontFamily="var(--font-display)"
                      pointerEvents="none"
                    >
                      {oppName.length > 11 ? `${oppName.slice(0, 10)}…` : oppName}
                    </text>
                  </g>
                )}

                {/* Mini Ball Indicator icon if opponent has ball */}
                {oppHasBall && (
                  <g transform="translate(26, -28)" className="mini-ball-indicator">
                    <circle r="18" fill="#ff7700" stroke="#ffffff" strokeWidth="2.5" filter="drop-shadow(0 2px 5px rgba(0,0,0,0.7))" />
                    <text
                      textAnchor="middle"
                      dy="6"
                      fontSize="17"
                      pointerEvents="none"
                    >
                      🏀
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* =========================================
            FREESTANDING BALL (LOOSE BALL / OPPONENT)
            ========================================= */}
        {freeBallPos && (
          <g
            className={`free-ball-node ${draggingFreeBall ? 'dragging' : ''}`}
            transform={`translate(${pctToSvg(
              draggingFreeBall && freeBallLivePos ? freeBallLivePos.x : freeBallPos.x,
              draggingFreeBall && freeBallLivePos ? freeBallLivePos.y : freeBallPos.y
            ).x}, ${pctToSvg(
              draggingFreeBall && freeBallLivePos ? freeBallLivePos.x : freeBallPos.x,
              draggingFreeBall && freeBallLivePos ? freeBallLivePos.y : freeBallPos.y
            ).y})`}
            onPointerDown={handleFreeBallPointerDown}
            style={{ cursor: isEraserActive ? 'crosshair' : 'grab' }}
          >
            {/* Touch target */}
            <circle r="52" fill="transparent" pointerEvents="all" />
            {/* Pulsing ring to make loose ball clearly noticeable */}
            <circle r="34" fill="none" stroke="#ff7700" strokeWidth="3" strokeDasharray="7 5" opacity="0.85" />
            {/* Drop shadow */}
            <circle r="28" fill="rgba(0, 0, 0, 0.7)" filter="drop-shadow(0 6px 14px rgba(0,0,0,0.85))" />
            {/* Basketball badge */}
            <circle r="25" fill="#ff7700" stroke="#ffffff" strokeWidth="3.5" />
            <text textAnchor="middle" dy="8" fontSize="24" pointerEvents="none">🏀</text>
          </g>
        )}
      </svg>

      {/* Floating Tactical Overlay on Court (Clean, zero clutter) */}
      <div className="court-overlay-hud">
        {mode === 'scratch' ? (
          <div className="hud-pill-group">
            {isEraserActive ? (
              <div className="hud-pill pulse-red">
                <span>🧹 Borrador activo: pasa el dedo sobre un trazo para borrarlo</span>
              </div>
            ) : selectedScratchItem ? (
              <div className="hud-pill pulse-orange">
                <span>
                  {selectedScratchItem.type === 'ball'
                    ? "🏀 Toca en la cancha o sobre un jugador para ubicar el balón"
                    : selectedScratchItem.type === 'opponent'
                    ? `🔴 Toca en la cancha para colocar al Rival #${selectedScratchItem.number}`
                    : `📍 Toca en la cancha para colocar al jugador #${selectedScratchItem.number}`}
                </span>
              </div>
            ) : null}
          </div>
        ) : isAssigningBall ? (
          <div className="hud-pill pulse-orange">
            <span>🏀 Toca a un jugador para entregarle el balón</span>
          </div>
        ) : mode === 'design' ? (
          <div className="hud-pill-group">
            {designTool === 'setup' ? (
              onSaveFormation && courtPlayers.length > 0 && (
                <button 
                  className="hud-formation-btn highlight-save"
                  onClick={onSaveFormation}
                  title="Guardar la ubicación actual de los jugadores como una Disposición inicial"
                >
                  <span>💾 Guardar Disposición</span>
                </button>
              )
            ) : (
              onSavePlay && actions.length > 0 && (
                <button 
                  className="hud-formation-btn highlight-save"
                  onClick={onSavePlay}
                  title="Guardar esta jugada con sus acciones en tu biblioteca"
                >
                  <span>💾 Guardar Jugada ({actions.length})</span>
                </button>
              )
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
