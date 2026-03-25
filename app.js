const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const difficultySelect = document.getElementById("difficulty-select");
const modeSelect = document.getElementById("mode-select");
const restartBtn = document.getElementById("restart-btn");
const undoBtn = document.getElementById("undo-btn");
const resumeLiveBtn = document.getElementById("resume-live-btn");
const startBtn = document.getElementById("start-btn");
const starterText = document.getElementById("starter-text");
const remotePanel = document.getElementById("remote-panel");
const remoteStatusText = document.getElementById("remote-status-text");
const remoteRoleText = document.getElementById("remote-role-text");
const remoteRoomText = document.getElementById("remote-room-text");
const remoteHelpText = document.getElementById("remote-help-text");
const remoteRoomTypeSelect = document.getElementById("remote-room-type-select");
const roomCodeInput = document.getElementById("room-code-input");
const createRoomBtn = document.getElementById("create-room-btn");
const joinRoomBtn = document.getElementById("join-room-btn");
const copyRoomBtn = document.getElementById("copy-room-btn");
const statusText = document.getElementById("status-text");
const resultText = document.getElementById("result-text");
const reviewModeText = document.getElementById("review-mode-text");
const insightText = document.getElementById("insight-text");
const metricsGrid = document.getElementById("metrics-grid");
const moveList = document.getElementById("move-list");
const reviewSummary = document.getElementById("review-summary");
const promotionModal = document.getElementById("promotion-modal");
const guidePanel = document.getElementById("guide-panel");

const FILES = "abcdefgh";
const PIECE_VALUES = { p: 100, n: 320, b: 335, r: 500, q: 900, k: 0 };
const PIECE_LABELS = {
  wp: "♙",
  wn: "♘",
  wb: "♗",
  wr: "♖",
  wq: "♕",
  wk: "♔",
  bp: "♟",
  bn: "♞",
  bb: "♝",
  br: "♜",
  bq: "♛",
  bk: "♚",
};

const PIECE_SQUARE = {
  p: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [5, 10, 10, -20, -20, 10, 10, 5],
    [5, -5, -10, 0, 0, -10, -5, 5],
    [0, 0, 0, 20, 20, 0, 0, 0],
    [5, 5, 10, 25, 25, 10, 5, 5],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  n: [
    [-50, -40, -30, -30, -30, -30, -40, -50],
    [-40, -20, 0, 0, 0, 0, -20, -40],
    [-30, 0, 10, 15, 15, 10, 0, -30],
    [-30, 5, 15, 20, 20, 15, 5, -30],
    [-30, 0, 15, 20, 20, 15, 0, -30],
    [-30, 5, 10, 15, 15, 10, 5, -30],
    [-40, -20, 0, 5, 5, 0, -20, -40],
    [-50, -40, -30, -30, -30, -30, -40, -50],
  ],
  b: [
    [-20, -10, -10, -10, -10, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 10, 10, 5, 0, -10],
    [-10, 5, 5, 10, 10, 5, 5, -10],
    [-10, 0, 10, 10, 10, 10, 0, -10],
    [-10, 10, 10, 10, 10, 10, 10, -10],
    [-10, 5, 0, 0, 0, 0, 5, -10],
    [-20, -10, -10, -10, -10, -10, -10, -20],
  ],
  r: [
    [0, 0, 0, 5, 5, 0, 0, 0],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [5, 10, 10, 10, 10, 10, 10, 5],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  q: [
    [-20, -10, -10, -5, -5, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 5, 5, 5, 0, -10],
    [-5, 0, 5, 5, 5, 5, 0, -5],
    [0, 0, 5, 5, 5, 5, 0, -5],
    [-10, 5, 5, 5, 5, 5, 0, -10],
    [-10, 0, 5, 0, 0, 0, 0, -10],
    [-20, -10, -10, -5, -5, -10, -10, -20],
  ],
  k: [
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-20, -30, -30, -40, -40, -30, -30, -20],
    [-10, -20, -20, -20, -20, -20, -20, -10],
    [20, 20, 0, 0, 0, 0, 20, 20],
    [20, 30, 10, 0, 0, 10, 30, 20],
  ],
};

const DIFFICULTIES = {
  beginner: { label: "初级", depth: 1, noise: 90, reviewDepth: 1 },
  intermediate: { label: "中级", depth: 2, noise: 28, reviewDepth: 2 },
  expert: { label: "高级", depth: 3, noise: 0, reviewDepth: 2 },
};

const state = {
  game: null,
  selected: null,
  legalTargets: [],
  reviewIndex: null,
  pendingPromotion: null,
  aiThinking: false,
  difficulty: "intermediate",
  mode: "ai",
  hasStarted: false,
  remote: {
    socket: null,
    status: "未连接",
    roomCode: "",
    roomType: "remote",
    playerColor: null,
    players: { w: false, b: false },
    error: "",
  },
};

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createInitialGame() {
  return {
    board: [
      ["br", "bn", "bb", "bq", "bk", "bb", "bn", "br"],
      ["bp", "bp", "bp", "bp", "bp", "bp", "bp", "bp"],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      ["wp", "wp", "wp", "wp", "wp", "wp", "wp", "wp"],
      ["wr", "wn", "wb", "wq", "wk", "wb", "wn", "wr"],
    ],
    turn: "w",
    castling: {
      w: { kingSide: true, queenSide: true },
      b: { kingSide: true, queenSide: true },
    },
    enPassant: null,
    halfmove: 0,
    fullmove: 1,
    status: "playing",
    winner: null,
    reason: null,
    history: [],
    livePly: 0,
    previewBoard: null,
  };
}

function createInitialRemoteMatchState() {
  return {
    game: createInitialGame(),
    hasStarted: false,
    difficulty: state.difficulty,
  };
}

function cloneGame(game) {
  return {
    ...game,
    board: game.board.map((row) => [...row]),
    castling: {
      w: { ...game.castling.w },
      b: { ...game.castling.b },
    },
    enPassant: game.enPassant ? { ...game.enPassant } : null,
    history: [...game.history],
  };
}

function inBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function colorOf(piece) {
  return piece ? piece[0] : null;
}

function typeOf(piece) {
  return piece ? piece[1] : null;
}

function enemy(color) {
  return color === "w" ? "b" : "w";
}

function algebraicSquare(row, col) {
  return `${FILES[col]}${8 - row}`;
}

function cloneBoard(board) {
  return board.map((row) => [...row]);
}

function mirrorRow(row) {
  return 7 - row;
}

function evaluateBoard(board) {
  let score = 0;
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = board[row][col];
      if (!piece) continue;
      const color = colorOf(piece);
      const type = typeOf(piece);
      const base = PIECE_VALUES[type];
      const pstRow = color === "w" ? row : mirrorRow(row);
      const pst = PIECE_SQUARE[type][pstRow][col];
      score += (color === "w" ? 1 : -1) * (base + pst);
    }
  }
  return score;
}

function findKing(board, color) {
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      if (board[row][col] === `${color}k`) {
        return { row, col };
      }
    }
  }
  return null;
}

function isSquareAttacked(board, row, col, byColor) {
  const pawnDir = byColor === "w" ? -1 : 1;
  for (const dc of [-1, 1]) {
    const pr = row - pawnDir;
    const pc = col + dc;
    if (inBounds(pr, pc) && board[pr][pc] === `${byColor}p`) {
      return true;
    }
  }

  const knightDeltas = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1],
  ];
  for (const [dr, dc] of knightDeltas) {
    const nr = row + dr;
    const nc = col + dc;
    if (inBounds(nr, nc) && board[nr][nc] === `${byColor}n`) {
      return true;
    }
  }

  const sliders = [
    { dirs: [[1, 0], [-1, 0], [0, 1], [0, -1]], pieces: ["r", "q"] },
    { dirs: [[1, 1], [1, -1], [-1, 1], [-1, -1]], pieces: ["b", "q"] },
  ];
  for (const { dirs, pieces } of sliders) {
    for (const [dr, dc] of dirs) {
      let nr = row + dr;
      let nc = col + dc;
      while (inBounds(nr, nc)) {
        const piece = board[nr][nc];
        if (piece) {
          if (colorOf(piece) === byColor && pieces.includes(typeOf(piece))) {
            return true;
          }
          break;
        }
        nr += dr;
        nc += dc;
      }
    }
  }

  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (!dr && !dc) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (inBounds(nr, nc) && board[nr][nc] === `${byColor}k`) {
        return true;
      }
    }
  }

  return false;
}

function isInCheck(game, color) {
  const king = findKing(game.board, color);
  if (!king) return false;
  return isSquareAttacked(game.board, king.row, king.col, enemy(color));
}

function applyMoveToGame(game, move, evaluateState = true) {
  const next = cloneGame(game);
  const piece = next.board[move.from.row][move.from.col];
  const movingColor = colorOf(piece);
  const movingType = typeOf(piece);
  const targetPiece = move.isEnPassant
    ? next.board[move.from.row][move.to.col]
    : next.board[move.to.row][move.to.col];

  next.board[move.from.row][move.from.col] = null;

  if (move.isEnPassant) {
    next.board[move.from.row][move.to.col] = null;
  }

  if (move.isCastle) {
    if (move.to.col === 6) {
      next.board[move.to.row][5] = next.board[move.to.row][7];
      next.board[move.to.row][7] = null;
    } else {
      next.board[move.to.row][3] = next.board[move.to.row][0];
      next.board[move.to.row][0] = null;
    }
  }

  const promotedType = move.promotion || (move.autoQueen ? "q" : null);
  next.board[move.to.row][move.to.col] = promotedType ? `${movingColor}${promotedType}` : piece;

  if (movingType === "k") {
    next.castling[movingColor].kingSide = false;
    next.castling[movingColor].queenSide = false;
  }
  if (movingType === "r") {
    if (move.from.row === 7 && move.from.col === 0) next.castling.w.queenSide = false;
    if (move.from.row === 7 && move.from.col === 7) next.castling.w.kingSide = false;
    if (move.from.row === 0 && move.from.col === 0) next.castling.b.queenSide = false;
    if (move.from.row === 0 && move.from.col === 7) next.castling.b.kingSide = false;
  }
  if (targetPiece && typeOf(targetPiece) === "r") {
    if (move.to.row === 7 && move.to.col === 0) next.castling.w.queenSide = false;
    if (move.to.row === 7 && move.to.col === 7) next.castling.w.kingSide = false;
    if (move.to.row === 0 && move.to.col === 0) next.castling.b.queenSide = false;
    if (move.to.row === 0 && move.to.col === 7) next.castling.b.kingSide = false;
  }

  if (movingType === "p" && Math.abs(move.to.row - move.from.row) === 2) {
    next.enPassant = { row: (move.to.row + move.from.row) / 2, col: move.from.col };
  } else {
    next.enPassant = null;
  }

  next.halfmove = movingType === "p" || targetPiece ? 0 : next.halfmove + 1;
  if (movingColor === "b") next.fullmove += 1;
  next.turn = enemy(movingColor);

  if (!evaluateState) {
    next.status = "playing";
    next.winner = null;
    next.reason = null;
    return next;
  }

  const opponentMoves = generateLegalMoves(next, next.turn);
  const opponentInCheck = isInCheck(next, next.turn);
  if (opponentMoves.length === 0) {
    next.status = opponentInCheck ? "checkmate" : "stalemate";
    next.winner = opponentInCheck ? movingColor : null;
    next.reason = opponentInCheck ? "将死" : "逼和";
  } else if (next.halfmove >= 100) {
    next.status = "draw";
    next.reason = "五十回合规则";
  } else {
    next.status = "playing";
    next.winner = null;
    next.reason = opponentInCheck ? "将军" : null;
  }

  return next;
}

function generatePseudoMoves(game, row, col) {
  const piece = game.board[row][col];
  if (!piece) return [];
  const color = colorOf(piece);
  const type = typeOf(piece);
  const moves = [];

  if (type === "p") {
    const dir = color === "w" ? -1 : 1;
    const startRow = color === "w" ? 6 : 1;
    const promotionRow = color === "w" ? 0 : 7;
    const oneStep = row + dir;
    if (inBounds(oneStep, col) && !game.board[oneStep][col]) {
      moves.push({
        from: { row, col },
        to: { row: oneStep, col },
        promotionNeeded: oneStep === promotionRow,
        autoQueen: oneStep === promotionRow,
      });
      const twoStep = row + dir * 2;
      if (row === startRow && !game.board[twoStep][col]) {
        moves.push({ from: { row, col }, to: { row: twoStep, col } });
      }
    }
    for (const dc of [-1, 1]) {
      const tr = row + dir;
      const tc = col + dc;
      if (!inBounds(tr, tc)) continue;
      const target = game.board[tr][tc];
      if (target && colorOf(target) !== color) {
        moves.push({
          from: { row, col },
          to: { row: tr, col: tc },
          promotionNeeded: tr === promotionRow,
          autoQueen: tr === promotionRow,
        });
      }
      if (game.enPassant && game.enPassant.row === tr && game.enPassant.col === tc) {
        moves.push({
          from: { row, col },
          to: { row: tr, col: tc },
          isEnPassant: true,
        });
      }
    }
  }

  if (type === "n") {
    const deltas = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1],
    ];
    for (const [dr, dc] of deltas) {
      const nr = row + dr;
      const nc = col + dc;
      if (!inBounds(nr, nc)) continue;
      const target = game.board[nr][nc];
      if (!target || colorOf(target) !== color) {
        moves.push({ from: { row, col }, to: { row: nr, col: nc } });
      }
    }
  }

  if (["b", "r", "q"].includes(type)) {
    const dirs = [];
    if (["b", "q"].includes(type)) dirs.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
    if (["r", "q"].includes(type)) dirs.push([1, 0], [-1, 0], [0, 1], [0, -1]);
    for (const [dr, dc] of dirs) {
      let nr = row + dr;
      let nc = col + dc;
      while (inBounds(nr, nc)) {
        const target = game.board[nr][nc];
        if (!target) {
          moves.push({ from: { row, col }, to: { row: nr, col: nc } });
        } else {
          if (colorOf(target) !== color) {
            moves.push({ from: { row, col }, to: { row: nr, col: nc } });
          }
          break;
        }
        nr += dr;
        nc += dc;
      }
    }
  }

  if (type === "k") {
    for (let dr = -1; dr <= 1; dr += 1) {
      for (let dc = -1; dc <= 1; dc += 1) {
        if (!dr && !dc) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (!inBounds(nr, nc)) continue;
        const target = game.board[nr][nc];
        if (!target || colorOf(target) !== color) {
          moves.push({ from: { row, col }, to: { row: nr, col: nc } });
        }
      }
    }
    if (!isSquareAttacked(game.board, row, col, enemy(color))) {
      const rights = game.castling[color];
      const homeRow = color === "w" ? 7 : 0;
      if (
        rights.kingSide &&
        game.board[homeRow][7] === `${color}r` &&
        !game.board[homeRow][5] &&
        !game.board[homeRow][6] &&
        !isSquareAttacked(game.board, homeRow, 5, enemy(color)) &&
        !isSquareAttacked(game.board, homeRow, 6, enemy(color))
      ) {
        moves.push({
          from: { row, col },
          to: { row: homeRow, col: 6 },
          isCastle: true,
        });
      }
      if (
        rights.queenSide &&
        game.board[homeRow][0] === `${color}r` &&
        !game.board[homeRow][1] &&
        !game.board[homeRow][2] &&
        !game.board[homeRow][3] &&
        !isSquareAttacked(game.board, homeRow, 2, enemy(color)) &&
        !isSquareAttacked(game.board, homeRow, 3, enemy(color))
      ) {
        moves.push({
          from: { row, col },
          to: { row: homeRow, col: 2 },
          isCastle: true,
        });
      }
    }
  }

  return moves;
}

function generateLegalMoves(game, color = game.turn) {
  const moves = [];
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = game.board[row][col];
      if (!piece || colorOf(piece) !== color) continue;
      for (const move of generatePseudoMoves(game, row, col)) {
        const next = applyMoveToGame(game, move, false);
        if (!isInCheck(next, color)) {
          moves.push(move);
        }
      }
    }
  }
  return moves;
}

function scoreMoveHeuristic(game, move) {
  const moving = game.board[move.from.row][move.from.col];
  const target = move.isEnPassant
    ? `${enemy(colorOf(moving))}p`
    : game.board[move.to.row][move.to.col];
  let score = 0;
  if (target) score += 10 * PIECE_VALUES[typeOf(target)] - PIECE_VALUES[typeOf(moving)];
  if (move.promotionNeeded || move.promotion) score += 800;
  if (move.isCastle) score += 50;
  const centerDistance = Math.abs(3.5 - move.to.row) + Math.abs(3.5 - move.to.col);
  score += 10 - centerDistance * 2;
  return score;
}

function minimax(game, depth, alpha, beta, maximizingColor) {
  if (depth === 0 || game.status !== "playing") {
    if (game.status === "checkmate") {
      return game.winner === "w" ? 999999 : -999999;
    }
    if (game.status === "stalemate" || game.status === "draw") {
      return 0;
    }
    return evaluateBoard(game.board);
  }

  const moves = generateLegalMoves(game, game.turn).sort(
    (a, b) => scoreMoveHeuristic(game, b) - scoreMoveHeuristic(game, a),
  );

  if (game.turn === maximizingColor) {
    let value = -Infinity;
    for (const move of moves) {
      value = Math.max(value, minimax(applyMoveToGame(game, move), depth - 1, alpha, beta, maximizingColor));
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
    }
    return value;
  }

  let value = Infinity;
  for (const move of moves) {
    value = Math.min(value, minimax(applyMoveToGame(game, move), depth - 1, alpha, beta, maximizingColor));
    beta = Math.min(beta, value);
    if (beta <= alpha) break;
  }
  return value;
}

function evaluateMoveChoice(game, move, depth) {
  const next = applyMoveToGame(game, move);
  const score = minimax(next, Math.max(0, depth - 1), -Infinity, Infinity, "w");
  return score;
}

function findBestMove(game, depth, noise = 0) {
  const moves = generateLegalMoves(game, game.turn);
  if (!moves.length) return null;

  let bestMove = moves[0];
  let bestScore = game.turn === "w" ? -Infinity : Infinity;
  const moveScores = [];

  for (const move of moves) {
    const score = evaluateMoveChoice(game, move, depth);
    moveScores.push({ move, score });
    if (game.turn === "w") {
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    } else if (score < bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  if (noise > 0) {
    const sorted = [...moveScores].sort((a, b) =>
      game.turn === "w" ? b.score - a.score : a.score - b.score,
    );
    const shortlist = sorted.filter((entry, index) => {
      if (index === 0) return true;
      return Math.abs(entry.score - sorted[0].score) <= noise;
    });
    const pick = shortlist[Math.floor(Math.random() * shortlist.length)];
    return {
      move: pick.move,
      score: pick.score,
      bestMove: sorted[0].move,
      bestScore: sorted[0].score,
      all: moveScores,
    };
  }

  return { move: bestMove, score: bestScore, bestMove, bestScore, all: moveScores };
}

function classifySwing(swing, color) {
  const perspectiveSwing = color === "w" ? swing : -swing;
  const loss = Math.max(0, perspectiveSwing);
  if (loss < 30) return "最佳/近似最佳";
  if (loss < 90) return "好棋";
  if (loss < 180) return "轻微失准";
  if (loss < 320) return "失误";
  return "致命失误";
}

function formatEval(score) {
  if (Math.abs(score) > 900000) return score > 0 ? "白方将杀" : "黑方将杀";
  const pawns = (score / 100).toFixed(1);
  return `${score >= 0 ? "+" : ""}${pawns}`;
}

function moveToNotation(game, move) {
  const piece = game.board[move.from.row][move.from.col];
  const type = typeOf(piece);
  if (move.isCastle) return move.to.col === 6 ? "O-O" : "O-O-O";
  const capture = move.isEnPassant || game.board[move.to.row][move.to.col];
  const piecePrefix = type === "p" ? "" : type.toUpperCase();
  const sourceFile = type === "p" && capture ? FILES[move.from.col] : "";
  const target = algebraicSquare(move.to.row, move.to.col);
  const promotionType = move.promotion || (move.autoQueen ? "q" : null);
  const promotion = promotionType ? `=${promotionType.toUpperCase()}` : "";
  const next = applyMoveToGame(game, move);
  const suffix = next.status === "checkmate" ? "#" : next.reason === "将军" ? "+" : "";
  return `${piecePrefix}${sourceFile}${capture ? "x" : ""}${target}${promotion}${suffix}`;
}

function boardToFen(board, turn, castling, enPassant) {
  const rows = board.map((row) => {
    let empty = 0;
    let out = "";
    for (const piece of row) {
      if (!piece) {
        empty += 1;
      } else {
        if (empty) out += empty;
        empty = 0;
        const symbol = piece[1];
        out += piece[0] === "w" ? symbol.toUpperCase() : symbol;
      }
    }
    if (empty) out += empty;
    return out;
  });
  let castle = "";
  if (castling.w.kingSide) castle += "K";
  if (castling.w.queenSide) castle += "Q";
  if (castling.b.kingSide) castle += "k";
  if (castling.b.queenSide) castle += "q";
  return `${rows.join("/")} ${turn} ${castle || "-"} ${enPassant ? algebraicSquare(enPassant.row, enPassant.col) : "-"} 0 1`;
}

function snapshot(game) {
  return {
    board: cloneBoard(game.board),
    turn: game.turn,
    castling: {
      w: { ...game.castling.w },
      b: { ...game.castling.b },
    },
    enPassant: game.enPassant ? { ...game.enPassant } : null,
    fen: boardToFen(game.board, game.turn, game.castling, game.enPassant),
    status: game.status,
    winner: game.winner,
    reason: game.reason,
  };
}

function recordMove(gameBefore, move, side, choiceData, playedScore, gameAfter) {
  const bestScore = choiceData.bestScore;
  const swing = side === "w" ? bestScore - playedScore : playedScore - bestScore;
  const bestReferenceMove = choiceData.bestMove || choiceData.move;
  const resolvedMove = { ...move, promotion: move.promotion || (move.autoQueen ? "q" : undefined) };
  return {
    ply: gameBefore.livePly + 1,
    side,
    difficulty: state.difficulty,
    notation: moveToNotation(gameBefore, resolvedMove),
    from: algebraicSquare(move.from.row, move.from.col),
    to: algebraicSquare(move.to.row, move.to.col),
    fenBefore: boardToFen(gameBefore.board, gameBefore.turn, gameBefore.castling, gameBefore.enPassant),
    fenAfter: boardToFen(gameAfter.board, gameAfter.turn, gameAfter.castling, gameAfter.enPassant),
    bestEval: bestScore,
    playedEval: playedScore,
    swing,
    quality: classifySwing(swing, side),
    bestMove: moveToNotation(gameBefore, bestReferenceMove),
    isCheck: gameAfter.reason === "将军",
    resultingStatus: gameAfter.status,
    reviewText:
      state.mode === "ai" && side === "b"
        ? `AI 选择 ${moveToNotation(gameBefore, resolvedMove)}，当前难度为${DIFFICULTIES[state.difficulty].label}。`
        : side === "w"
        ? `你走出 ${moveToNotation(gameBefore, resolvedMove)}，局面评估从最佳线偏离 ${Math.max(0, swing).toFixed(0)} 分，判定为${classifySwing(swing, side)}。`
        : `黑方走出 ${moveToNotation(gameBefore, resolvedMove)}，局面评估偏离最佳线 ${Math.max(0, swing).toFixed(0)} 分，判定为${classifySwing(swing, side)}。`,
    snapshot: snapshot(gameAfter),
  };
}

function createMetrics() {
  const playerMoves = state.game.history.filter((item) => item.side === "w");
  const aiMoves = state.game.history.filter((item) => item.side === "b");
  const severe = playerMoves.filter((item) => item.quality === "致命失误").length;
  const inaccuracies = playerMoves.filter((item) => item.quality === "轻微失准").length;
  const mistakes = playerMoves.filter((item) => item.quality === "失误").length;
  const stable = aiMoves.length ? formatEval(aiMoves.at(-1).playedEval) : formatEval(evaluateBoard(state.game.board));
  return [
    { label: "你的致命失误", value: String(severe) },
    { label: "你的失误", value: String(mistakes + inaccuracies) },
    { label: "当前评估", value: stable },
    { label: "已走回合", value: String(Math.ceil(state.game.history.length / 2)) },
  ];
}

function currentSideLabel() {
  return state.game.turn === "w" ? "白方" : "黑方";
}

function updateMetrics() {
  metricsGrid.innerHTML = "";
  for (const item of createMetrics()) {
    const card = document.createElement("div");
    card.className = "metric";
    card.innerHTML = `<span>${item.label}</span><strong>${item.value}</strong>`;
    metricsGrid.appendChild(card);
  }
}

function buildReviewSummary() {
  const playerMoves = state.game.history.filter((item) => item.side === "w");
  if (!playerMoves.length) {
    reviewSummary.innerHTML = "<p>还没有形成可复盘数据。</p>";
    return;
  }

  const sorted = [...playerMoves].sort((a, b) => Math.max(0, b.swing) - Math.max(0, a.swing));
  const biggest = sorted[0];
  const best = [...playerMoves].filter((item) => item.quality === "最佳/近似最佳").length;
  const summary = [];
  summary.push(`<p>你的 ${playerMoves.length} 步里有 ${best} 步保持在最佳线附近。</p>`);
  if (biggest) {
    summary.push(
      `<p>最大转折出现在第 ${Math.ceil(biggest.ply / 2)} 回合的 <strong>${biggest.notation}</strong>，相较最佳着法 <strong>${biggest.bestMove}</strong> 偏离 ${Math.max(0, biggest.swing).toFixed(0)} 分。</p>`,
    );
  }
  const tags = sorted.slice(0, 3).map(
    (item) =>
      `<span class="review-pill">第 ${Math.ceil(item.ply / 2)} 回合 ${item.notation} · ${item.quality}</span>`,
  );
  reviewSummary.innerHTML = `${summary.join("")}${tags.join("")}`;
}

function updateMoveList() {
  moveList.innerHTML = "";
  state.game.history.forEach((item, index) => {
    const li = document.createElement("li");
    li.dataset.index = String(index);
    li.className = state.reviewIndex === index ? "active" : "";
    li.innerHTML = `<strong>${Math.ceil(item.ply / 2)}${item.side === "w" ? "." : "..."} ${item.notation}</strong> ${item.quality} · 评估 ${formatEval(item.playedEval)}`;
    li.addEventListener("click", () => {
      state.reviewIndex = index;
      state.game.previewBoard = cloneBoard(item.snapshot.board);
      state.selected = null;
      state.legalTargets = [];
      updateUI();
    });
    moveList.appendChild(li);
  });
}

function describeStatus() {
  const game = state.game;
  if (!state.hasStarted) {
    if (state.mode === "remote") {
      if (state.remote.roomType === "remote-ai") {
        return state.remote.roomCode ? "远程人机房已建立，白方先走" : "等待创建远程人机房";
      }
      return state.remote.players.w && state.remote.players.b ? "双方已就绪，等待同步开局" : "等待双方加入房间";
    }
    return state.mode === "ai" ? "等待开始，人机模式由白方先走" : "等待开始，双人轮流落子";
  }
  if (state.mode === "remote" && state.remote.roomType !== "remote-ai" && (!state.remote.players.w || !state.remote.players.b)) return "对手未连接";
  if (game.status === "checkmate") {
    if (state.mode === "ai") return game.winner === "w" ? "你将死了 AI" : "AI 将死了你";
    return game.winner === "w" ? "白方将死" : "黑方将死";
  }
  if (game.status === "stalemate") return "和棋：逼和";
  if (game.status === "draw") return `和棋：${game.reason}`;
  if (state.aiThinking) return "AI 思考中";
  return state.mode === "ai" && game.turn === "b" ? "AI 行棋" : `${currentSideLabel()}行棋`;
}

function describeResult() {
  const game = state.game;
  if (game.status === "playing") return "进行中";
  if (game.status === "checkmate") return game.winner === "w" ? "白方胜" : "黑方胜";
  if (game.status === "stalemate" || game.status === "draw") return "和棋";
  return "进行中";
}

function getDisplayedBoard() {
  if (state.reviewIndex !== null && state.game.history[state.reviewIndex]) {
    return state.game.history[state.reviewIndex].snapshot.board;
  }
  return state.game.board;
}

function updateInsightText() {
  if (state.reviewIndex !== null && state.game.history[state.reviewIndex]) {
    const item = state.game.history[state.reviewIndex];
    insightText.textContent = `${item.reviewText} 最佳着法候选是 ${item.bestMove}，该步记录前局面 FEN：${item.fenBefore}`;
    return;
  }
  if (state.game.history.length) {
    const last = state.game.history.at(-1);
    insightText.textContent = last.reviewText;
    return;
  }
  if (!state.hasStarted) {
    insightText.textContent =
      state.mode === "ai"
        ? "当前是人机模式。点击“开始游戏”后，你执白先走，AI 会在你每一步之后自动应手。"
        : state.mode === "local"
          ? "当前是双人模式。点击“开始游戏”后，双方轮流在同一棋盘上点击走子，系统同样会记录并复盘每一步。"
          : "当前是远程联机模式。你可以创建远程双人房，或者直接创建远程人机房，在另一台设备上继续和 AI 对战。";
    return;
  }
  insightText.textContent =
    "选择白方棋子开始对局。系统会在你每一步之后自动记录最佳着法与分数波动，赛后生成复盘结论。";
}

function updateUI() {
  statusText.textContent = describeStatus();
  resultText.textContent = describeResult();
  reviewModeText.textContent =
    state.reviewIndex === null ? "实时对局" : `复盘第 ${Math.ceil(state.game.history[state.reviewIndex].ply / 2)} 回合`;
  resumeLiveBtn.disabled = state.reviewIndex === null;
  starterText.textContent = state.hasStarted
    ? state.mode === "ai"
      ? "对局已开始，你执白，AI 执黑"
      : state.mode === "local"
        ? "对局已开始，白黑双方轮流点击走子"
        : "联机对局已开始，双方共享同一棋盘与复盘"
    : state.mode === "remote"
      ? state.remote.roomType === "remote-ai"
        ? "创建远程人机房后会立刻开局，你执白对阵服务端 AI"
        : "先创建或加入房间，双方到齐后自动开局"
      : "点击“开始游戏”后落子";
  startBtn.textContent =
    state.mode === "remote"
      ? state.hasStarted
        ? "重新开始联机对局"
        : "等待房间就绪"
      : state.hasStarted
        ? "重新开始当前模式"
        : "开始游戏";
  startBtn.disabled =
    state.mode === "remote" &&
    (
      !state.remote.roomCode ||
      (state.remote.roomType === "remote"
        ? (!state.remote.players.w || !state.remote.players.b)
        : !state.remote.players.w)
    );
  guidePanel.style.display = state.hasStarted || state.mode === "remote" ? "none" : "block";
  remotePanel.style.display = state.mode === "remote" ? "block" : "none";
  difficultySelect.disabled = state.mode === "local" || state.mode === "remote";
  undoBtn.disabled = state.mode === "remote";
  remoteStatusText.textContent = state.remote.status;
  remoteRoleText.textContent =
    state.remote.playerColor === "w" ? "白方" : state.remote.playerColor === "b" ? "黑方" : state.remote.roomType === "remote-ai" ? "白方" : "未分配";
  remoteRoomText.textContent = state.remote.roomCode || "-";
  remoteHelpText.textContent =
    state.remote.error ||
    (state.remote.roomType === "remote-ai"
      ? "远程人机房会在创建后立刻开局，服务端 AI 自动执黑。"
      : "创建房间后，把链接发给对方；双方连接后会自动开局。");
  updateInsightText();
  updateMetrics();
  updateMoveList();
  buildReviewSummary();
  drawBoard();
}

function squareFromEvent(event) {
  const rect = canvas.getBoundingClientRect();
  const scale = canvas.width / rect.width;
  const x = (event.clientX - rect.left) * scale;
  const y = (event.clientY - rect.top) * scale;
  const squareSize = canvas.width / 8;
  return {
    row: Math.floor(y / squareSize),
    col: Math.floor(x / squareSize),
  };
}

function drawBoard() {
  const board = getDisplayedBoard();
  const squareSize = canvas.width / 8;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const isLight = (row + col) % 2 === 0;
      ctx.fillStyle = isLight ? "#f1d7a8" : "#8d6b4f";
      ctx.fillRect(col * squareSize, row * squareSize, squareSize, squareSize);

      if (state.reviewIndex === null && state.selected && state.selected.row === row && state.selected.col === col) {
        ctx.fillStyle = "rgba(29,107,88,0.5)";
        ctx.fillRect(col * squareSize, row * squareSize, squareSize, squareSize);
      }

      const kingPiece = board[row][col];
      if (kingPiece && typeOf(kingPiece) === "k") {
        const checked =
          state.reviewIndex === null
            ? isSquareAttacked(board, row, col, enemy(colorOf(kingPiece))) && isInCheck(state.game, colorOf(kingPiece))
            : isSquareAttacked(board, row, col, enemy(colorOf(kingPiece)));
        if (checked) {
          ctx.fillStyle = "rgba(188,138,66,0.55)";
          ctx.fillRect(col * squareSize, row * squareSize, squareSize, squareSize);
        }
      }
    }
  }

  if (state.reviewIndex === null) {
    state.legalTargets.forEach((move) => {
      const x = move.to.col * squareSize + squareSize / 2;
      const y = move.to.row * squareSize + squareSize / 2;
      const target = state.game.board[move.to.row][move.to.col];
      ctx.beginPath();
      ctx.fillStyle = target || move.isEnPassant ? "rgba(143,58,43,0.65)" : "rgba(29,107,88,0.32)";
      ctx.arc(x, y, target || move.isEnPassant ? squareSize * 0.22 : squareSize * 0.12, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  ctx.font = `${squareSize * 0.74}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = board[row][col];
      if (!piece) continue;
      const x = col * squareSize + squareSize / 2;
      const y = row * squareSize + squareSize / 2 + 3;
      ctx.fillStyle = piece[0] === "w" ? "#fffdf8" : "#1c1b1c";
      ctx.strokeStyle = piece[0] === "w" ? "#604d35" : "#f6ead4";
      ctx.lineWidth = 2;
      ctx.strokeText(PIECE_LABELS[piece], x, y);
      ctx.fillText(PIECE_LABELS[piece], x, y);
    }
  }

  ctx.font = "16px sans-serif";
  ctx.textAlign = "left";
  for (let i = 0; i < 8; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? "#6d6557" : "#f6e7c5";
    ctx.fillText(FILES[i], i * squareSize + 8, canvas.height - 8);
    ctx.fillText(String(8 - i), 6, i * squareSize + 18);
  }
}

function choosePromotion(move) {
  return new Promise((resolve) => {
    state.pendingPromotion = { move, resolve };
    promotionModal.classList.remove("hidden");
    promotionModal.setAttribute("aria-hidden", "false");
  });
}

async function executeMove(move, side, choiceDataOverride = null, skipAi = false) {
  const gameBefore = cloneGame(state.game);
  let resolvedMove = { ...move };
  if (move.promotionNeeded && !move.promotion) {
    if (side === "w") {
      const promotion = await choosePromotion(move);
      resolvedMove = { ...move, promotion };
    } else {
      resolvedMove = { ...move, promotion: "q" };
    }
  }

  const reviewDepth = DIFFICULTIES[state.difficulty].reviewDepth;
  const choiceData = choiceDataOverride || findBestMove(gameBefore, reviewDepth, 0);
  const playedScore = evaluateMoveChoice(gameBefore, resolvedMove, reviewDepth);
  const next = applyMoveToGame(gameBefore, resolvedMove);
  next.livePly = gameBefore.livePly + 1;
  const entry = recordMove(gameBefore, resolvedMove, side, choiceData, playedScore, next);
  next.history = [...gameBefore.history, entry];

  state.game = next;
  state.selected = null;
  state.legalTargets = [];
  state.reviewIndex = null;
  updateUI();

  if (state.mode === "remote") {
    sendSocketMessage({
      type: "submit_state",
      roomCode: state.remote.roomCode,
      gameState: {
        game: deepClone(state.game),
        hasStarted: state.hasStarted,
        difficulty: state.difficulty,
      },
    });
  }

  if (!skipAi && state.mode === "ai" && next.status === "playing" && next.turn === "b") {
    window.setTimeout(playAiTurn, 140);
  }
}

async function playAiTurn() {
  if (!state.hasStarted || state.mode !== "ai" || state.aiThinking || state.game.turn !== "b" || state.game.status !== "playing") return;
  state.aiThinking = true;
  updateUI();
  const config = DIFFICULTIES[state.difficulty];
  const choice = findBestMove(state.game, config.depth, config.noise);
  state.aiThinking = false;
  if (!choice) {
    updateUI();
    return;
  }
  await executeMove(choice.move, "b", choice, true);
}

async function handleBoardClick(event) {
  if (state.reviewIndex !== null || !state.hasStarted || state.aiThinking || state.game.status !== "playing") {
    return;
  }
  if (state.mode === "ai" && state.game.turn !== "w") {
    return;
  }
  if (state.mode === "remote" && state.remote.playerColor !== state.game.turn) {
    return;
  }

  const { row, col } = squareFromEvent(event);
  const piece = state.game.board[row][col];
  const selectedMove = state.legalTargets.find((move) => move.to.row === row && move.to.col === col);

  if (selectedMove) {
    await executeMove(selectedMove, state.game.turn);
    return;
  }

  if (piece && colorOf(piece) === state.game.turn) {
    state.selected = { row, col };
    state.legalTargets = generateLegalMoves(state.game, state.game.turn).filter(
      (move) => move.from.row === row && move.from.col === col,
    );
  } else {
    state.selected = null;
    state.legalTargets = [];
  }
  updateUI();
}

function resetGame() {
  state.game = createInitialGame();
  state.selected = null;
  state.legalTargets = [];
  state.reviewIndex = null;
  state.pendingPromotion = null;
  state.aiThinking = false;
  state.hasStarted = false;
  updateUI();
}

function startGame() {
  if (state.mode === "remote") {
    if (state.remote.roomCode && state.remote.players.w && state.remote.players.b) {
      sendSocketMessage({ type: "restart_room", roomCode: state.remote.roomCode });
    }
    return;
  }
  resetGame();
  state.hasStarted = true;
  updateUI();
}

function restoreSnapshot(entryHistory) {
  if (!entryHistory.length) {
    state.game = createInitialGame();
    return;
  }
  const snap = entryHistory.at(-1).snapshot;
  state.game = {
    ...createInitialGame(),
    board: cloneBoard(snap.board),
    turn: snap.turn,
    castling: {
      w: { ...snap.castling.w },
      b: { ...snap.castling.b },
    },
    enPassant: snap.enPassant ? { ...snap.enPassant } : null,
    status: snap.status,
    winner: snap.winner,
    reason: snap.reason,
    history: entryHistory,
    livePly: entryHistory.length,
  };
}

function getSocketUrl() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}`;
}

function applyRemoteRoomState(payload) {
  state.remote.roomCode = payload.roomCode || state.remote.roomCode;
  state.remote.roomType = payload.roomType || state.remote.roomType;
  state.remote.playerColor = payload.playerColor || state.remote.playerColor;
  state.remote.players = payload.players || state.remote.players;
  state.remote.status =
    payload.roomType === "remote-ai"
      ? "远程人机房已连接"
      : payload.players?.w && payload.players?.b
        ? "房间已满，双方在线"
        : "等待对手加入";
  state.remote.error = "";
  if (payload.gameState) {
    state.game = deepClone(payload.gameState.game);
    state.hasStarted = Boolean(payload.gameState.hasStarted);
    if (payload.gameState.difficulty) state.difficulty = payload.gameState.difficulty;
  }
  state.selected = null;
  state.legalTargets = [];
  state.reviewIndex = null;
  roomCodeInput.value = state.remote.roomCode || roomCodeInput.value;
  updateUI();
}

function resetRemoteState() {
  if (state.remote.socket) {
    state.remote.socket.onclose = null;
    state.remote.socket.close();
  }
  state.remote = {
    socket: null,
    status: "未连接",
    roomCode: "",
    roomType: "remote",
    playerColor: null,
    players: { w: false, b: false },
    error: "",
  };
}

function openSocket() {
  if (state.remote.socket && state.remote.socket.readyState === WebSocket.OPEN) {
    return Promise.resolve(state.remote.socket);
  }
  if (state.remote.socket && state.remote.socket.readyState === WebSocket.CONNECTING) {
    return new Promise((resolve, reject) => {
      state.remote.socket.addEventListener("open", () => resolve(state.remote.socket), { once: true });
      state.remote.socket.addEventListener("error", reject, { once: true });
    });
  }

  state.remote.status = "连接中";
  updateUI();
  const socket = new WebSocket(getSocketUrl());
  state.remote.socket = socket;

  socket.addEventListener("message", (event) => {
    const payload = JSON.parse(event.data);
    if (payload.type === "room_sync") {
      applyRemoteRoomState(payload);
    } else if (payload.type === "error") {
      state.remote.error = payload.message;
      state.remote.status = "连接异常";
      updateUI();
    }
  });

  socket.addEventListener("close", () => {
    state.remote.socket = null;
    state.remote.status = "已断开";
    updateUI();
  });

  socket.addEventListener("error", () => {
    state.remote.error = "联机连接失败，请确认你是通过 `node server.js` 打开的页面。";
    state.remote.status = "连接失败";
    updateUI();
  });

  return new Promise((resolve, reject) => {
    socket.addEventListener("open", () => resolve(socket), { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
}

async function sendSocketMessage(message) {
  const socket = await openSocket();
  socket.send(JSON.stringify(message));
}

async function createRoom() {
  state.remote.error = "";
  await sendSocketMessage({
    type: "create_room",
    roomType: remoteRoomTypeSelect.value,
    gameState: createInitialRemoteMatchState(),
  });
}

async function joinRoom() {
  const roomCode = roomCodeInput.value.trim().toUpperCase();
  if (!roomCode) {
    state.remote.error = "先输入房间码。";
    updateUI();
    return;
  }
  state.remote.error = "";
  await sendSocketMessage({
    type: "join_room",
    roomCode,
  });
}

async function copyInviteLink() {
  if (!state.remote.roomCode) {
    state.remote.error = "先创建或加入一个房间。";
    updateUI();
    return;
  }
  const url = new URL(window.location.href);
  url.searchParams.set("mode", "remote");
  url.searchParams.set("room", state.remote.roomCode);
  url.searchParams.set("roomType", state.remote.roomType);
  await navigator.clipboard.writeText(url.toString());
  state.remote.error = "邀请链接已复制。";
  updateUI();
}

async function autoJoinFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode");
  const room = params.get("room");
  const roomType = params.get("roomType");
  if (mode === "remote") {
    state.mode = "remote";
    modeSelect.value = "remote";
    updateUI();
  }
  if (roomType === "remote-ai" || roomType === "remote") {
    remoteRoomTypeSelect.value = roomType;
    state.remote.roomType = roomType;
  }
  if (room) {
    roomCodeInput.value = room.toUpperCase();
    await joinRoom();
  }
}

function installPromotionHandlers() {
  promotionModal.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      if (!state.pendingPromotion) return;
      const { resolve } = state.pendingPromotion;
      state.pendingPromotion = null;
      promotionModal.classList.add("hidden");
      promotionModal.setAttribute("aria-hidden", "true");
      resolve(button.dataset.piece);
    });
  });
}

restartBtn.addEventListener("click", resetGame);
undoBtn.addEventListener("click", () => {
  if (!state.game.history.length || state.aiThinking) return;
  const rollback = state.mode === "local" ? 1 : state.game.turn === "b" ? 1 : 2;
  const history = state.game.history.slice(0, Math.max(0, state.game.history.length - rollback));
  restoreSnapshot(history);
  state.reviewIndex = null;
  state.selected = null;
  state.legalTargets = [];
  updateUI();
});
startBtn.addEventListener("click", startGame);
createRoomBtn.addEventListener("click", createRoom);
joinRoomBtn.addEventListener("click", joinRoom);
copyRoomBtn.addEventListener("click", copyInviteLink);
resumeLiveBtn.addEventListener("click", () => {
  state.reviewIndex = null;
  updateUI();
});
difficultySelect.addEventListener("change", (event) => {
  state.difficulty = event.target.value;
  updateUI();
});
modeSelect.addEventListener("change", (event) => {
  if (state.mode === "remote" && event.target.value !== "remote") resetRemoteState();
  state.mode = event.target.value;
  resetGame();
});
canvas.addEventListener("click", handleBoardClick);
installPromotionHandlers();

window.render_game_to_text = () => {
  const board = getDisplayedBoard();
  const payload = {
    coordinateSystem: "origin at top-left, rows increase downward, cols increase rightward",
    turn: state.game.turn,
    status: state.game.status,
    winner: state.game.winner,
    mode: state.mode,
    hasStarted: state.hasStarted,
    remote: {
      roomCode: state.remote.roomCode,
      roomType: state.remote.roomType,
      playerColor: state.remote.playerColor,
      players: state.remote.players,
      status: state.remote.status,
    },
    selected: state.selected,
    reviewIndex: state.reviewIndex,
    board,
    lastMove: state.game.history.at(-1)
      ? {
          notation: state.game.history.at(-1).notation,
          quality: state.game.history.at(-1).quality,
          eval: state.game.history.at(-1).playedEval,
        }
      : null,
  };
  return JSON.stringify(payload);
};

window.advanceTime = () => {
  updateUI();
};

resetGame();
autoJoinFromUrl();
