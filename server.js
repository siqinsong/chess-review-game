const http = require("node:http");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { WebSocketServer } = require("ws");

const HOST = "0.0.0.0";
const PORT = Number(process.env.PORT || 4173);
const ROOT = __dirname;
const FILES = "abcdefgh";
const PIECE_VALUES = { p: 100, n: 320, b: 335, r: 500, q: 900, k: 0 };
const DIFFICULTIES = {
  beginner: { depth: 1, noise: 90, reviewDepth: 1 },
  intermediate: { depth: 2, noise: 28, reviewDepth: 2 },
  expert: { depth: 3, noise: 0, reviewDepth: 2 },
};
const PIECE_SQUARE = {
  p: [[0,0,0,0,0,0,0,0],[5,10,10,-20,-20,10,10,5],[5,-5,-10,0,0,-10,-5,5],[0,0,0,20,20,0,0,0],[5,5,10,25,25,10,5,5],[10,10,20,30,30,20,10,10],[50,50,50,50,50,50,50,50],[0,0,0,0,0,0,0,0]],
  n: [[-50,-40,-30,-30,-30,-30,-40,-50],[-40,-20,0,0,0,0,-20,-40],[-30,0,10,15,15,10,0,-30],[-30,5,15,20,20,15,5,-30],[-30,0,15,20,20,15,0,-30],[-30,5,10,15,15,10,5,-30],[-40,-20,0,5,5,0,-20,-40],[-50,-40,-30,-30,-30,-30,-40,-50]],
  b: [[-20,-10,-10,-10,-10,-10,-10,-20],[-10,0,0,0,0,0,0,-10],[-10,0,5,10,10,5,0,-10],[-10,5,5,10,10,5,5,-10],[-10,0,10,10,10,10,0,-10],[-10,10,10,10,10,10,10,-10],[-10,5,0,0,0,0,5,-10],[-20,-10,-10,-10,-10,-10,-10,-20]],
  r: [[0,0,0,5,5,0,0,0],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[5,10,10,10,10,10,10,5],[0,0,0,0,0,0,0,0]],
  q: [[-20,-10,-10,-5,-5,-10,-10,-20],[-10,0,0,0,0,0,0,-10],[-10,0,5,5,5,5,0,-10],[-5,0,5,5,5,5,0,-5],[0,0,5,5,5,5,0,-5],[-10,5,5,5,5,5,0,-10],[-10,0,5,0,0,0,0,-10],[-20,-10,-10,-5,-5,-10,-10,-20]],
  k: [[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-20,-30,-30,-40,-40,-30,-30,-20],[-10,-20,-20,-20,-20,-20,-20,-10],[20,20,0,0,0,0,20,20],[20,30,10,0,0,10,30,20]],
};
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".command": "text/plain; charset=utf-8",
};

const rooms = new Map();

function getServerOrigins(port) {
  const interfaces = os.networkInterfaces();
  const lanOrigins = [];
  for (const entries of Object.values(interfaces)) {
    for (const entry of entries || []) {
      if (entry.family !== "IPv4" || entry.internal) continue;
      lanOrigins.push(`http://${entry.address}:${port}`);
    }
  }
  return {
    origin: `http://127.0.0.1:${port}`,
    lanOrigins: [...new Set(lanOrigins)],
  };
}

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
    castling: { w: { kingSide: true, queenSide: true }, b: { kingSide: true, queenSide: true } },
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
  return { game: createInitialGame(), hasStarted: false, difficulty: "intermediate" };
}

function cloneGame(game) {
  return {
    ...game,
    board: game.board.map((row) => [...row]),
    castling: { w: { ...game.castling.w }, b: { ...game.castling.b } },
    enPassant: game.enPassant ? { ...game.enPassant } : null,
    history: [...game.history],
  };
}

function inBounds(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }
function colorOf(piece) { return piece ? piece[0] : null; }
function typeOf(piece) { return piece ? piece[1] : null; }
function enemy(color) { return color === "w" ? "b" : "w"; }
function algebraicSquare(row, col) { return `${FILES[col]}${8 - row}`; }
function mirrorRow(row) { return 7 - row; }
function cloneBoard(board) { return board.map((row) => [...row]); }

function evaluateBoard(board) {
  let score = 0;
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = board[row][col];
      if (!piece) continue;
      const color = colorOf(piece);
      const type = typeOf(piece);
      score += (color === "w" ? 1 : -1) * (PIECE_VALUES[type] + PIECE_SQUARE[type][color === "w" ? row : mirrorRow(row)][col]);
    }
  }
  return score;
}

function findKing(board, color) {
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) if (board[row][col] === `${color}k`) return { row, col };
  }
  return null;
}

function isSquareAttacked(board, row, col, byColor) {
  const pawnDir = byColor === "w" ? -1 : 1;
  for (const dc of [-1, 1]) {
    const pr = row - pawnDir;
    const pc = col + dc;
    if (inBounds(pr, pc) && board[pr][pc] === `${byColor}p`) return true;
  }
  const knightDeltas = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
  for (const [dr, dc] of knightDeltas) {
    const nr = row + dr;
    const nc = col + dc;
    if (inBounds(nr, nc) && board[nr][nc] === `${byColor}n`) return true;
  }
  const sliders = [
    { dirs: [[1,0],[-1,0],[0,1],[0,-1]], pieces: ["r","q"] },
    { dirs: [[1,1],[1,-1],[-1,1],[-1,-1]], pieces: ["b","q"] },
  ];
  for (const { dirs, pieces } of sliders) {
    for (const [dr, dc] of dirs) {
      let nr = row + dr;
      let nc = col + dc;
      while (inBounds(nr, nc)) {
        const piece = board[nr][nc];
        if (piece) {
          if (colorOf(piece) === byColor && pieces.includes(typeOf(piece))) return true;
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
      if (inBounds(nr, nc) && board[nr][nc] === `${byColor}k`) return true;
    }
  }
  return false;
}

function isInCheck(game, color) {
  const king = findKing(game.board, color);
  return king ? isSquareAttacked(game.board, king.row, king.col, enemy(color)) : false;
}

function applyMoveToGame(game, move, evaluateState = true) {
  const next = cloneGame(game);
  const piece = next.board[move.from.row][move.from.col];
  const movingColor = colorOf(piece);
  const movingType = typeOf(piece);
  const targetPiece = move.isEnPassant ? next.board[move.from.row][move.to.col] : next.board[move.to.row][move.to.col];
  next.board[move.from.row][move.from.col] = null;
  if (move.isEnPassant) next.board[move.from.row][move.to.col] = null;
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
  if (movingType === "k") next.castling[movingColor] = { kingSide: false, queenSide: false };
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
  next.enPassant = movingType === "p" && Math.abs(move.to.row - move.from.row) === 2 ? { row: (move.to.row + move.from.row) / 2, col: move.from.col } : null;
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
      moves.push({ from: { row, col }, to: { row: oneStep, col }, promotionNeeded: oneStep === promotionRow, autoQueen: oneStep === promotionRow });
      const twoStep = row + dir * 2;
      if (row === startRow && !game.board[twoStep][col]) moves.push({ from: { row, col }, to: { row: twoStep, col } });
    }
    for (const dc of [-1, 1]) {
      const tr = row + dir;
      const tc = col + dc;
      if (!inBounds(tr, tc)) continue;
      const target = game.board[tr][tc];
      if (target && colorOf(target) !== color) moves.push({ from: { row, col }, to: { row: tr, col: tc }, promotionNeeded: tr === promotionRow, autoQueen: tr === promotionRow });
      if (game.enPassant && game.enPassant.row === tr && game.enPassant.col === tc) moves.push({ from: { row, col }, to: { row: tr, col: tc }, isEnPassant: true });
    }
  }
  if (type === "n") {
    for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
      const nr = row + dr;
      const nc = col + dc;
      if (!inBounds(nr, nc)) continue;
      const target = game.board[nr][nc];
      if (!target || colorOf(target) !== color) moves.push({ from: { row, col }, to: { row: nr, col: nc } });
    }
  }
  if (["b", "r", "q"].includes(type)) {
    const dirs = [];
    if (["b", "q"].includes(type)) dirs.push([1,1],[1,-1],[-1,1],[-1,-1]);
    if (["r", "q"].includes(type)) dirs.push([1,0],[-1,0],[0,1],[0,-1]);
    for (const [dr, dc] of dirs) {
      let nr = row + dr;
      let nc = col + dc;
      while (inBounds(nr, nc)) {
        const target = game.board[nr][nc];
        if (!target) moves.push({ from: { row, col }, to: { row: nr, col: nc } });
        else {
          if (colorOf(target) !== color) moves.push({ from: { row, col }, to: { row: nr, col: nc } });
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
        if (!target || colorOf(target) !== color) moves.push({ from: { row, col }, to: { row: nr, col: nc } });
      }
    }
    if (!isSquareAttacked(game.board, row, col, enemy(color))) {
      const rights = game.castling[color];
      const homeRow = color === "w" ? 7 : 0;
      if (rights.kingSide && game.board[homeRow][7] === `${color}r` && !game.board[homeRow][5] && !game.board[homeRow][6] && !isSquareAttacked(game.board, homeRow, 5, enemy(color)) && !isSquareAttacked(game.board, homeRow, 6, enemy(color))) moves.push({ from: { row, col }, to: { row: homeRow, col: 6 }, isCastle: true });
      if (rights.queenSide && game.board[homeRow][0] === `${color}r` && !game.board[homeRow][1] && !game.board[homeRow][2] && !game.board[homeRow][3] && !isSquareAttacked(game.board, homeRow, 2, enemy(color)) && !isSquareAttacked(game.board, homeRow, 3, enemy(color))) moves.push({ from: { row, col }, to: { row: homeRow, col: 2 }, isCastle: true });
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
        if (!isInCheck(next, color)) moves.push(move);
      }
    }
  }
  return moves;
}

function scoreMoveHeuristic(game, move) {
  const moving = game.board[move.from.row][move.from.col];
  const target = move.isEnPassant ? `${enemy(colorOf(moving))}p` : game.board[move.to.row][move.to.col];
  let score = 0;
  if (target) score += 10 * PIECE_VALUES[typeOf(target)] - PIECE_VALUES[typeOf(moving)];
  if (move.promotionNeeded || move.promotion) score += 800;
  if (move.isCastle) score += 50;
  const centerDistance = Math.abs(3.5 - move.to.row) + Math.abs(3.5 - move.to.col);
  return score + 10 - centerDistance * 2;
}

function minimax(game, depth, alpha, beta, maximizingColor) {
  if (depth === 0 || game.status !== "playing") {
    if (game.status === "checkmate") return game.winner === "w" ? 999999 : -999999;
    if (game.status === "stalemate" || game.status === "draw") return 0;
    return evaluateBoard(game.board);
  }
  const moves = generateLegalMoves(game, game.turn).sort((a, b) => scoreMoveHeuristic(game, b) - scoreMoveHeuristic(game, a));
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
  return minimax(next, Math.max(0, depth - 1), -Infinity, Infinity, "w");
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
    if (game.turn === "w" ? score > bestScore : score < bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  if (noise > 0) {
    const sorted = [...moveScores].sort((a, b) => game.turn === "w" ? b.score - a.score : a.score - b.score);
    const shortlist = sorted.filter((entry, index) => index === 0 || Math.abs(entry.score - sorted[0].score) <= noise);
    const pick = shortlist[Math.floor(Math.random() * shortlist.length)];
    return { move: pick.move, score: pick.score, bestMove: sorted[0].move, bestScore: sorted[0].score };
  }
  return { move: bestMove, score: bestScore, bestMove, bestScore };
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

function moveToNotation(game, move) {
  const piece = game.board[move.from.row][move.from.col];
  const type = typeOf(piece);
  if (move.isCastle) return move.to.col === 6 ? "O-O" : "O-O-O";
  const capture = move.isEnPassant || game.board[move.to.row][move.to.col];
  const sourceFile = type === "p" && capture ? FILES[move.from.col] : "";
  const target = algebraicSquare(move.to.row, move.to.col);
  const promotionType = move.promotion || (move.autoQueen ? "q" : null);
  const promotion = promotionType ? `=${promotionType.toUpperCase()}` : "";
  const next = applyMoveToGame(game, move);
  const suffix = next.status === "checkmate" ? "#" : next.reason === "将军" ? "+" : "";
  return `${type === "p" ? "" : type.toUpperCase()}${sourceFile}${capture ? "x" : ""}${target}${promotion}${suffix}`;
}

function boardToFen(board, turn, castling, enPassant) {
  const rows = board.map((row) => {
    let empty = 0;
    let out = "";
    for (const piece of row) {
      if (!piece) empty += 1;
      else {
        if (empty) out += empty;
        empty = 0;
        out += piece[0] === "w" ? piece[1].toUpperCase() : piece[1];
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
    castling: { w: { ...game.castling.w }, b: { ...game.castling.b } },
    enPassant: game.enPassant ? { ...game.enPassant } : null,
    fen: boardToFen(game.board, game.turn, game.castling, game.enPassant),
    status: game.status,
    winner: game.winner,
    reason: game.reason,
  };
}

function recordMove(gameBefore, move, side, choiceData, playedScore, gameAfter, difficultyLabel = "中级") {
  const bestScore = choiceData.bestScore;
  const swing = side === "w" ? bestScore - playedScore : playedScore - bestScore;
  const bestReferenceMove = choiceData.bestMove || choiceData.move;
  const resolvedMove = { ...move, promotion: move.promotion || (move.autoQueen ? "q" : undefined) };
  return {
    ply: gameBefore.livePly + 1,
    side,
    difficulty: difficultyLabel,
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
    reviewText: side === "b"
      ? `AI 选择 ${moveToNotation(gameBefore, resolvedMove)}，当前难度为${difficultyLabel}。`
      : `你走出 ${moveToNotation(gameBefore, resolvedMove)}，局面评估从最佳线偏离 ${Math.max(0, swing).toFixed(0)} 分，判定为${classifySwing(swing, side)}。`,
    snapshot: snapshot(gameAfter),
  };
}

function applyAiMoveToMatch(gameState) {
  const difficultyKey = gameState.difficulty || "intermediate";
  const config = DIFFICULTIES[difficultyKey] || DIFFICULTIES.intermediate;
  const gameBefore = cloneGame(gameState.game);
  if (gameBefore.turn !== "b" || gameBefore.status !== "playing") return gameState;
  const choice = findBestMove(gameBefore, config.depth, config.noise);
  if (!choice) return gameState;
  const resolvedMove = { ...choice.move, promotion: choice.move.promotion || (choice.move.autoQueen ? "q" : undefined) };
  const playedScore = evaluateMoveChoice(gameBefore, resolvedMove, config.reviewDepth);
  const next = applyMoveToGame(gameBefore, resolvedMove);
  next.livePly = gameBefore.livePly + 1;
  const entry = recordMove(gameBefore, resolvedMove, "b", choice, playedScore, next, difficultyKey === "beginner" ? "初级" : difficultyKey === "expert" ? "高级" : "中级");
  next.history = [...gameBefore.history, entry];
  return { ...gameState, game: next, hasStarted: true };
}

function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return rooms.has(code) ? makeCode() : code;
}

function send(ws, payload) {
  if (ws.readyState === 1) ws.send(JSON.stringify(payload));
}

function roomPayload(room, ws) {
  return {
    type: "room_sync",
    roomCode: room.code,
    roomType: room.roomType,
    playerColor: ws.playerColor || null,
    players: { w: Boolean(room.players.w), b: Boolean(room.players.b) },
    gameState: room.gameState,
  };
}

function broadcastRoom(room) {
  for (const client of room.clients) send(client, roomPayload(room, client));
}

function attachClientToRoom(ws, room, color) {
  ws.roomCode = room.code;
  ws.playerColor = color;
  room.clients.add(ws);
  room.players[color] = ws;
}

function createRoom(ws, payload) {
  const code = makeCode();
  const roomType = payload.roomType === "remote-ai" ? "remote-ai" : "remote";
  const room = {
    code,
    roomType,
    clients: new Set(),
    players: { w: null, b: roomType === "remote-ai" ? { ai: true } : null },
    gameState: payload.gameState || createInitialRemoteMatchState(),
  };
  if (roomType === "remote-ai") room.gameState.hasStarted = true;
  rooms.set(code, room);
  attachClientToRoom(ws, room, "w");
  broadcastRoom(room);
}

function joinRoom(ws, code) {
  const room = rooms.get(code);
  if (!room) return send(ws, { type: "error", message: "房间不存在。" });
  if (room.roomType === "remote-ai") return send(ws, { type: "error", message: "远程人机房不支持第二位玩家加入。" });
  if (room.players.w && room.players.b) return send(ws, { type: "error", message: "房间已满。" });
  attachClientToRoom(ws, room, room.players.w ? "b" : "w");
  if (room.players.w && room.players.b && !room.gameState.hasStarted && room.gameState.game.history.length === 0) {
    room.gameState = { ...room.gameState, game: createInitialGame(), hasStarted: true };
  }
  broadcastRoom(room);
}

function submitState(ws, payload) {
  const room = rooms.get(payload.roomCode);
  if (!room || ws.roomCode !== payload.roomCode || !ws.playerColor) return;
  room.gameState = deepClone(payload.gameState);
  if (room.roomType === "remote-ai" && room.gameState.game.turn === "b" && room.gameState.game.status === "playing") {
    room.gameState = applyAiMoveToMatch(room.gameState);
  }
  broadcastRoom(room);
}

function restartRoom(ws, payload) {
  const room = rooms.get(payload.roomCode);
  if (!room || ws.roomCode !== payload.roomCode) return;
  room.gameState = {
    game: createInitialGame(),
    hasStarted: room.roomType === "remote-ai" ? true : Boolean(room.players.w && room.players.b),
    difficulty: room.gameState.difficulty || "intermediate",
  };
  broadcastRoom(room);
}

function removeClient(ws) {
  const room = ws.roomCode ? rooms.get(ws.roomCode) : null;
  if (!room) return;
  room.clients.delete(ws);
  if (ws.playerColor && room.players[ws.playerColor] === ws) room.players[ws.playerColor] = room.roomType === "remote-ai" && ws.playerColor === "b" ? { ai: true } : null;
  if (room.clients.size === 0) {
    rooms.delete(room.code);
    return;
  }
  broadcastRoom(room);
}

const server = http.createServer((req, res) => {
  const pathname = req.url === "/" ? "/index.html" : req.url.split("?")[0];
  if (pathname === "/api/server-info") {
    const payload = getServerOrigins(PORT);
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    res.end(JSON.stringify(payload));
    return;
  }
  const normalized = path.normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const resolvedPath = path.join(ROOT, normalized);
  const safePath = resolvedPath.startsWith(ROOT) ? resolvedPath : path.join(ROOT, "index.html");
  const finalPath = fs.existsSync(safePath) && fs.statSync(safePath).isFile() ? safePath : path.join(ROOT, "index.html");
  fs.readFile(finalPath, (error, data) => {
    if (error) {
      res.writeHead(500);
      res.end("Server error");
      return;
    }
    res.writeHead(200, { "Content-Type": MIME_TYPES[path.extname(finalPath)] || "application/octet-stream" });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server });
wss.on("connection", (ws) => {
  ws.on("message", (raw) => {
    let payload;
    try {
      payload = JSON.parse(raw.toString());
    } catch {
      return send(ws, { type: "error", message: "消息格式错误。" });
    }
    if (payload.type === "create_room") createRoom(ws, payload);
    if (payload.type === "join_room") joinRoom(ws, String(payload.roomCode || "").toUpperCase());
    if (payload.type === "submit_state") submitState(ws, payload);
    if (payload.type === "restart_room") restartRoom(ws, payload);
  });
  ws.on("close", () => removeClient(ws));
});

server.listen(PORT, HOST, () => {
  const info = getServerOrigins(PORT);
  console.log(`Chess Studio server listening on ${info.origin}`);
  if (info.lanOrigins.length) {
    console.log("Available on your local network:");
    for (const origin of info.lanOrigins) {
      console.log(`  ${origin}`);
    }
  }
});
