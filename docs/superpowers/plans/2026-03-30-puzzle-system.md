# Puzzle 系统优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Puzzle 题库从 app.js 抽离到独立的 puzzles.js，扩充至 24 道题（含 difficulty/theme 字段），并在 Puzzle 模式下提供弹窗式题目选择器（难度×主题双维度筛选）。

**Architecture:** puzzles.js 作为独立脚本在 app.js 前加载，暴露全局 PUZZLES 数组；index.html 新增弹窗 HTML；app.js 删除内联题库，新增筛选状态与弹窗渲染逻辑；styles.css 补充弹窗与卡片样式。核心棋局逻辑不动。

**Tech Stack:** 原生 HTML/CSS/JS，无额外依赖，兼容直接用浏览器打开和 node server.js 两种方式。

---

## File Map

| 文件 | 操作 | 说明 |
|------|------|------|
| `puzzles.js` | 新建 | 24 道题数据，全局 `PUZZLES` |
| `index.html` | 修改 | 引入 puzzles.js；添加弹窗 HTML；button id 改名 |
| `app.js` | 修改 | 删除内联 PUZZLES；改 nextPuzzleBtn→selectPuzzleBtn；加筛选+弹窗逻辑 |
| `styles.css` | 修改 | 弹窗、卡片、筛选器 pill 样式 |

---

### Task 1: 新建 puzzles.js — 迁移现有 6 道题并补充字段

**Files:**
- Create: `puzzles.js`

- [ ] **Step 1: 创建 puzzles.js，迁移现有 6 道题，补充 difficulty 和 theme 字段**

```js
// puzzles.js
// 全局变量，在 app.js 之前加载
const PUZZLES = [
  {
    id: "italian-initiative",
    title: "意大利开局的先手主动权",
    difficulty: "intermediate",
    theme: "opening",
    description: "白方先走。王都已安置好，适合从轻子活跃度和中央张力继续推演。",
    board: [
      ["br", null, "bb", "bq", null, "br", "bk", null],
      ["bp", "bp", null, null, "bb", "bp", "bp", "bp"],
      [null, null, "bn", "bp", null, "bn", null, null],
      [null, null, "bp", null, "wp", null, null, null],
      [null, null, "wb", null, null, null, null, null],
      [null, null, "wn", null, null, "wn", null, null],
      ["wp", "wp", "wp", null, "wq", "wp", "wp", "wp"],
      ["wr", null, null, null, "wr", null, "wk", null],
    ],
    turn: "w",
    castling: { w: { kingSide: false, queenSide: false }, b: { kingSide: false, queenSide: false } },
    enPassant: null,
    halfmove: 2,
    fullmove: 11,
  },
  {
    id: "minor-piece-squeeze",
    title: "双马与象的空间压制",
    difficulty: "intermediate",
    theme: "middlegame",
    description: "黑方先走。双方子力完整度较高，适合练习如何在拥挤局面中找出突破点。",
    board: [
      ["br", null, null, "bq", null, "br", "bk", null],
      ["bp", "bp", null, "bb", null, "bp", "bp", "bp"],
      [null, null, "bp", "bp", "bn", "bn", null, null],
      [null, null, null, null, "bp", null, null, null],
      [null, null, "wp", "wp", "wp", null, null, null],
      [null, null, "wn", "wb", null, "wn", null, null],
      ["wp", "wp", null, null, "wq", "wp", "wp", "wp"],
      ["wr", null, null, null, "wr", null, "wk", null],
    ],
    turn: "b",
    castling: { w: { kingSide: false, queenSide: false }, b: { kingSide: false, queenSide: false } },
    enPassant: null,
    halfmove: 0,
    fullmove: 18,
  },
  {
    id: "queen-endgame-race",
    title: "后残局抢先手",
    difficulty: "intermediate",
    theme: "endgame",
    description: "白方先走。双方都保留一枚后和若干兵，适合练习将军、兑后与通路兵竞速。",
    board: [
      [null, null, null, null, null, null, "bk", null],
      [null, null, null, null, null, "bp", null, "bp"],
      [null, null, null, null, "bp", null, "bp", null],
      [null, null, null, "bp", null, null, null, null],
      [null, null, "wp", null, "wp", null, null, null],
      [null, null, null, null, null, "wp", "wp", null],
      [null, null, null, "wq", null, null, null, "wp"],
      [null, null, null, null, null, null, "wk", null],
    ],
    turn: "w",
    castling: { w: { kingSide: false, queenSide: false }, b: { kingSide: false, queenSide: false } },
    enPassant: null,
    halfmove: 1,
    fullmove: 35,
  },
  {
    id: "rook-endgame-active-king",
    title: "车残局中的王的激活",
    difficulty: "intermediate",
    theme: "endgame",
    description: "黑方先走。双方各有一车，关键在于王的站位和兵形弱点的利用。",
    board: [
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, "br", null, "bk", null],
      [null, null, null, "bp", null, "bp", null, "bp"],
      [null, null, null, null, "bp", null, "bp", null],
      [null, null, null, "wp", null, null, null, null],
      [null, null, null, null, "wk", "wp", null, "wp"],
      [null, null, null, null, "wr", null, null, null],
      [null, null, null, null, null, null, null, null],
    ],
    turn: "b",
    castling: { w: { kingSide: false, queenSide: false }, b: { kingSide: false, queenSide: false } },
    enPassant: null,
    halfmove: 4,
    fullmove: 42,
  },
  {
    id: "passed-pawn-race",
    title: "通路兵竞速",
    difficulty: "beginner",
    theme: "endgame",
    description: "白方先走。残局兵形非常直接，适合练习计算谁先升变以及何时该用王拦截。",
    board: [
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, "bk", null],
      [null, null, null, null, null, "bp", null, null],
      [null, null, null, null, "bp", null, null, null],
      [null, null, null, "wp", null, null, null, null],
      [null, null, null, null, null, null, "wk", null],
      [null, null, null, null, null, null, null, "wp"],
      [null, null, null, null, null, null, null, null],
    ],
    turn: "w",
    castling: { w: { kingSide: false, queenSide: false }, b: { kingSide: false, queenSide: false } },
    enPassant: null,
    halfmove: 0,
    fullmove: 51,
  },
  {
    id: "opposite-colored-bishops",
    title: "异色象残局",
    difficulty: "expert",
    theme: "endgame",
    description: "黑方先走。异色象让和棋资源很多，但也容易漏看兵翼的切入点。",
    board: [
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, "bk", null, null],
      [null, null, null, "bp", null, null, null, null],
      [null, null, null, null, "bb", null, "bp", null],
      [null, null, "wb", null, null, null, null, null],
      [null, null, null, "wp", null, "wk", null, null],
      [null, null, null, null, null, null, "wp", null],
      [null, null, null, null, null, null, null, null],
    ],
    turn: "b",
    castling: { w: { kingSide: false, queenSide: false }, b: { kingSide: false, queenSide: false } },
    enPassant: null,
    halfmove: 7,
    fullmove: 46,
  },

  // ── 新增题目 ──────────────────────────────────────────────

  // 残局·初级 ×2 (已有1道 passed-pawn-race)
  {
    id: "king-pawn-endgame",
    title: "王兵残局关键格",
    difficulty: "beginner",
    theme: "endgame",
    description: "白方先走。白王需占据关键格才能护送兵升变，练习王兵对王基础原理。",
    board: [
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, "bk", null, null, null],
      [null, null, null, null, "wp", null, null, null],
      [null, null, null, null, "wk", null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
    ],
    turn: "w",
    castling: { w: { kingSide: false, queenSide: false }, b: { kingSide: false, queenSide: false } },
    enPassant: null,
    halfmove: 0,
    fullmove: 1,
  },
  {
    id: "rook-vs-king-mating",
    title: "车王将杀练习",
    difficulty: "beginner",
    theme: "endgame",
    description: "白方先走。用车和王将死对方，练习最基础的车王将杀模式。",
    board: [
      [null, null, null, null, null, null, null, "bk"],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, "wk", null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      ["wr", null, null, null, null, null, null, null],
    ],
    turn: "w",
    castling: { w: { kingSide: false, queenSide: false }, b: { kingSide: false, queenSide: false } },
    enPassant: null,
    halfmove: 0,
    fullmove: 1,
  },

  // 残局·中级 ×2 (已有 rook-endgame-active-king, queen-endgame-race)
  {
    id: "bishop-pawn-endgame",
    title: "象兵残局的突破",
    difficulty: "intermediate",
    theme: "endgame",
    description: "白方先走。象兵残局中如何利用兵形优势和象的活跃性赢得对局。",
    board: [
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, "bk", null],
      [null, null, null, null, null, "bp", "bp", null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, "wp", "wp", null, null],
      [null, null, null, null, null, null, "wk", null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, "wb", null, null, null, null],
    ],
    turn: "w",
    castling: { w: { kingSide: false, queenSide: false }, b: { kingSide: false, queenSide: false } },
    enPassant: null,
    halfmove: 0,
    fullmove: 30,
  },
  {
    id: "knight-endgame-fortress",
    title: "马残局碉堡防守",
    difficulty: "intermediate",
    theme: "endgame",
    description: "黑方先走。马残局中如何用碉堡策略守住和棋。",
    board: [
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, "bk", null, null],
      [null, null, null, null, null, null, "bp", null],
      [null, null, null, null, null, "wp", "wk", null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, "wn", null, null, null],
    ],
    turn: "b",
    castling: { w: { kingSide: false, queenSide: false }, b: { kingSide: false, queenSide: false } },
    enPassant: null,
    halfmove: 0,
    fullmove: 45,
  },

  // 残局·高级 ×2 (已有 opposite-colored-bishops)
  {
    id: "rook-pawn-endgame-zugzwang",
    title: "车兵残局必败局面",
    difficulty: "expert",
    theme: "endgame",
    description: "白方先走。车兵对车，利用必走困境强制推进通路兵升变。",
    board: [
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, "bk", null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, "wp", null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, "wk", null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, "wr", null, null, "br"],
    ],
    turn: "w",
    castling: { w: { kingSide: false, queenSide: false }, b: { kingSide: false, queenSide: false } },
    enPassant: null,
    halfmove: 0,
    fullmove: 55,
  },

  // 中局·初级 ×2
  {
    id: "open-file-pressure",
    title: "开放线的压力",
    difficulty: "beginner",
    theme: "middlegame",
    description: "白方先走。利用 d 线开放优势，将车移入强力位置施压。",
    board: [
      ["br", null, "bb", "bq", "bk", null, null, "br"],
      ["bp", "bp", "bp", null, null, "bp", "bp", "bp"],
      [null, null, "bn", null, "bp", "bn", null, null],
      [null, null, "bb", null, null, null, null, null],
      [null, null, "wb", null, "wp", null, null, null],
      [null, null, "wn", null, null, "wn", null, null],
      ["wp", "wp", "wp", null, null, "wp", "wp", "wp"],
      ["wr", null, null, "wq", "wk", "wb", null, "wr"],
    ],
    turn: "w",
    castling: { w: { kingSide: true, queenSide: false }, b: { kingSide: true, queenSide: false } },
    enPassant: null,
    halfmove: 0,
    fullmove: 12,
  },
  {
    id: "pin-exploitation",
    title: "钉子战术利用",
    difficulty: "beginner",
    theme: "middlegame",
    description: "白方先走。利用象对马的钉子，找到赢取子力的简单战术。",
    board: [
      ["br", null, "bb", "bq", "bk", "bb", null, "br"],
      ["bp", "bp", "bp", null, "bp", "bp", "bp", "bp"],
      [null, null, "bn", "bp", null, "bn", null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, "wb", null, "wp", null, null, null],
      [null, null, null, null, null, "wn", null, null],
      ["wp", "wp", "wp", "wp", null, "wp", "wp", "wp"],
      ["wr", "wn", "wb", "wq", "wk", null, null, "wr"],
    ],
    turn: "w",
    castling: { w: { kingSide: true, queenSide: true }, b: { kingSide: true, queenSide: true } },
    enPassant: null,
    halfmove: 0,
    fullmove: 7,
  },

  // 中局·中级 ×1 (已有 minor-piece-squeeze)
  {
    id: "bishop-pair-advantage",
    title: "双象优势的利用",
    difficulty: "intermediate",
    theme: "middlegame",
    description: "白方先走。在半开放局面中如何最大化双象的优势，进行长期战略压制。",
    board: [
      ["br", null, null, "bq", "bk", null, null, "br"],
      ["bp", null, "bp", null, "bp", "bp", "bp", "bp"],
      [null, "bp", null, "bp", null, "bn", null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, "wp", null, null, null],
      [null, null, null, "wp", null, "wb", null, null],
      ["wp", "wp", "wp", null, null, "wp", "wp", "wp"],
      ["wr", null, null, "wq", "wk", "wb", null, "wr"],
    ],
    turn: "w",
    castling: { w: { kingSide: true, queenSide: false }, b: { kingSide: true, queenSide: false } },
    enPassant: null,
    halfmove: 0,
    fullmove: 15,
  },
  {
    id: "queenside-attack",
    title: "后翼进攻推进",
    difficulty: "intermediate",
    theme: "middlegame",
    description: "黑方先走。白方在王翼易位，黑方应在后翼展开反击获得主动权。",
    board: [
      [null, null, "bk", null, null, "br", null, "br"],
      ["bp", null, "bp", null, null, "bp", "bp", null],
      [null, "bp", null, null, "bp", "bn", null, "bp"],
      [null, null, null, "bp", null, null, null, null],
      [null, null, null, "wp", "wp", null, null, null],
      [null, null, "wn", null, null, "wn", "wp", null],
      ["wp", "wp", null, null, null, "wp", null, "wp"],
      [null, null, "wk", "wr", null, null, null, "wr"],
    ],
    turn: "b",
    castling: { w: { kingSide: false, queenSide: false }, b: { kingSide: false, queenSide: false } },
    enPassant: null,
    halfmove: 0,
    fullmove: 20,
  },

  // 中局·高级 ×2
  {
    id: "piece-sacrifice-attack",
    title: "子力牺牲的王翼攻击",
    difficulty: "expert",
    theme: "middlegame",
    description: "白方先走。在对方王翼发动子力牺牲，计算出将杀路线。",
    board: [
      ["br", null, null, null, "bk", null, null, "br"],
      ["bp", "bp", null, null, null, "bp", "bp", "bp"],
      [null, null, "bp", null, "bp", "bn", null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, "wb", null, "wp", null, null, null],
      [null, null, "wn", null, null, "wn", "wp", null],
      ["wp", "wp", "wp", null, null, "wp", null, "wp"],
      ["wr", null, null, null, "wk", null, null, "wr"],
    ],
    turn: "w",
    castling: { w: { kingSide: true, queenSide: false }, b: { kingSide: false, queenSide: false } },
    enPassant: null,
    halfmove: 0,
    fullmove: 22,
  },
  {
    id: "prophylaxis-defense",
    title: "预防性防守思路",
    difficulty: "expert",
    theme: "middlegame",
    description: "黑方先走。白方有潜在的进攻威胁，找出最佳预防着法阻止对方计划。",
    board: [
      [null, null, "bk", null, null, "br", null, null],
      ["bp", null, "bp", "bb", null, "bp", "bp", "bp"],
      [null, "bp", null, null, "bp", "bn", null, null],
      [null, null, null, "bp", null, null, null, null],
      [null, null, null, "wp", "wp", null, null, null],
      [null, "wn", "wb", null, null, "wn", null, null],
      ["wp", "wp", null, null, null, "wp", "wp", "wp"],
      [null, null, "wk", "wr", null, null, null, "wr"],
    ],
    turn: "b",
    castling: { w: { kingSide: false, queenSide: false }, b: { kingSide: false, queenSide: false } },
    enPassant: null,
    halfmove: 0,
    fullmove: 19,
  },

  // 战术·初级 ×2
  {
    id: "fork-tactic-basic",
    title: "马的双重叉击",
    difficulty: "beginner",
    theme: "tactic",
    description: "白方先走。用马一步叉击对方王和车，赢取材料优势。",
    board: [
      [null, null, null, null, "bk", null, null, "br"],
      ["bp", "bp", "bp", null, null, "bp", "bp", "bp"],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, "wn", null, null, null, null, null],
      ["wp", "wp", "wp", null, null, "wp", "wp", "wp"],
      [null, null, null, null, "wk", null, null, null],
    ],
    turn: "w",
    castling: { w: { kingSide: false, queenSide: false }, b: { kingSide: false, queenSide: false } },
    enPassant: null,
    halfmove: 0,
    fullmove: 25,
  },
  {
    id: "back-rank-mate",
    title: "底线将杀",
    difficulty: "beginner",
    theme: "tactic",
    description: "白方先走。对方底线防守不足，利用车实施底线将杀。",
    board: [
      [null, null, null, null, null, "br", "bk", null],
      ["bp", "bp", null, null, null, "bp", "bp", "bp"],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      ["wp", "wp", null, null, null, "wp", "wp", "wp"],
      [null, null, null, null, null, "wr", "wk", null],
    ],
    turn: "w",
    castling: { w: { kingSide: false, queenSide: false }, b: { kingSide: false, queenSide: false } },
    enPassant: null,
    halfmove: 0,
    fullmove: 30,
  },

  // 战术·中级 ×3
  {
    id: "discovered-attack",
    title: "闪击战术",
    difficulty: "intermediate",
    theme: "tactic",
    description: "白方先走。移动一枚棋子，露出后面的闪击，同时产生双重威胁。",
    board: [
      [null, null, null, null, "bk", null, null, "br"],
      ["bp", "bp", null, null, null, "bp", "bp", "bp"],
      [null, null, null, "bq", null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, "wn", null, null, null],
      [null, null, null, null, null, null, null, null],
      ["wp", "wp", null, null, null, "wp", "wp", "wp"],
      [null, null, null, "wq", "wk", null, null, "wr"],
    ],
    turn: "w",
    castling: { w: { kingSide: false, queenSide: false }, b: { kingSide: false, queenSide: false } },
    enPassant: null,
    halfmove: 0,
    fullmove: 18,
  },
  {
    id: "skewer-tactic",
    title: "穿刺战术",
    difficulty: "intermediate",
    theme: "tactic",
    description: "白方先走。对方王在象的射线上，将军后赢取王后面的车。",
    board: [
      [null, null, null, null, "bk", null, null, null],
      ["bp", "bp", null, null, null, "bp", "bp", "bp"],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, "br"],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      ["wp", "wp", null, null, null, "wp", "wp", "wp"],
      [null, null, null, null, "wk", null, "wb", null],
    ],
    turn: "w",
    castling: { w: { kingSide: false, queenSide: false }, b: { kingSide: false, queenSide: false } },
    enPassant: null,
    halfmove: 0,
    fullmove: 28,
  },
  {
    id: "deflection-tactic",
    title: "诱离战术",
    difficulty: "intermediate",
    theme: "tactic",
    description: "白方先走。用牺牲诱离对方防守子力，然后实施将杀。",
    board: [
      [null, null, null, null, "bk", null, null, null],
      ["bp", "bp", null, "bq", null, "bp", null, "bp"],
      [null, null, "bp", null, null, null, "bp", null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, "wn", null, null, null, null, null],
      ["wp", "wp", null, null, "wq", "wp", null, "wp"],
      [null, null, null, null, "wk", null, null, "wr"],
    ],
    turn: "w",
    castling: { w: { kingSide: false, queenSide: false }, b: { kingSide: false, queenSide: false } },
    enPassant: null,
    halfmove: 0,
    fullmove: 22,
  },

  // 战术·高级 ×2
  {
    id: "interference-tactic",
    title: "干扰战术",
    difficulty: "expert",
    theme: "tactic",
    description: "白方先走。将一枚棋子插入对方子力联系的关键格，打破防守协调。",
    board: [
      [null, null, null, null, "bk", null, null, null],
      ["bp", "bp", null, null, "bq", "bp", null, "bp"],
      [null, null, "bp", null, null, null, "bp", null],
      [null, null, null, null, "br", null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, "wn", null, null, "wb", null, null],
      ["wp", "wp", null, null, null, "wp", null, "wp"],
      [null, null, null, "wr", "wk", null, null, "wr"],
    ],
    turn: "w",
    castling: { w: { kingSide: false, queenSide: false }, b: { kingSide: false, queenSide: false } },
    enPassant: null,
    halfmove: 0,
    fullmove: 24,
  },
  {
    id: "zwischenzug",
    title: "间隔着法",
    difficulty: "expert",
    theme: "tactic",
    description: "白方先走。在对方期望的交换序列中插入一步意想不到的着法，获得材料优势。",
    board: [
      [null, null, null, "br", "bk", null, null, "br"],
      ["bp", "bp", null, null, null, "bp", "bp", "bp"],
      [null, null, "bp", null, null, "bn", null, null],
      [null, null, null, "bp", null, null, null, null],
      [null, null, null, "wp", "wp", null, null, null],
      [null, null, "wn", null, null, "wb", null, null],
      ["wp", "wp", null, null, null, "wp", "wp", "wp"],
      ["wr", null, null, "wq", "wk", null, null, "wr"],
    ],
    turn: "w",
    castling: { w: { kingSide: true, queenSide: false }, b: { kingSide: false, queenSide: false } },
    enPassant: null,
    halfmove: 0,
    fullmove: 17,
  },

  // 开局·初级 ×1 (已有 italian-initiative)
  {
    id: "sicilian-defense-setup",
    title: "西西里防御的反击",
    difficulty: "beginner",
    theme: "opening",
    description: "黑方先走。西西里防御典型阵型，找出后翼反击的最佳次序。",
    board: [
      ["br", null, "bb", "bq", "bk", "bb", "bn", "br"],
      ["bp", null, "bp", "bp", null, "bp", "bp", "bp"],
      [null, "bp", "bn", null, null, null, null, null],
      [null, null, null, null, "bp", null, null, null],
      [null, null, null, null, "wp", null, null, null],
      [null, null, "wn", null, null, "wn", null, null],
      ["wp", "wp", "wp", "wp", null, "wp", "wp", "wp"],
      ["wr", "wb", "wb", "wq", "wk", null, null, "wr"],
    ],
    turn: "b",
    castling: { w: { kingSide: true, queenSide: true }, b: { kingSide: true, queenSide: true } },
    enPassant: null,
    halfmove: 0,
    fullmove: 6,
  },

  // 开局·中级 ×1
  {
    id: "queens-gambit-middlegame",
    title: "后翼弃兵中局",
    difficulty: "intermediate",
    theme: "opening",
    description: "白方先走。后翼弃兵接受变例进入中局，如何利用中心优势获得主动权。",
    board: [
      ["br", null, "bb", "bq", "bk", "bb", null, "br"],
      ["bp", "bp", null, null, "bp", "bp", "bp", "bp"],
      [null, null, "bn", null, null, "bn", null, null],
      [null, null, "bp", null, null, null, null, null],
      [null, null, null, null, "wp", null, null, null],
      [null, null, "wn", null, null, "wn", null, null],
      ["wp", "wp", "wp", "wp", null, "wp", "wp", "wp"],
      ["wr", "wb", null, "wq", "wk", "wb", null, "wr"],
    ],
    turn: "w",
    castling: { w: { kingSide: true, queenSide: true }, b: { kingSide: true, queenSide: true } },
    enPassant: null,
    halfmove: 0,
    fullmove: 8,
  },
];
```

- [ ] **Step 2: 验证文件存在**

```bash
ls -la /path/to/chess-review-game/puzzles.js
```
Expected: 文件存在，大小 > 5KB

- [ ] **Step 3: 在浏览器控制台确认题目数量**

打开 index.html（或 node server.js 后访问），在控制台执行：
```js
// 此时 puzzles.js 尚未引入，先手动验证数量
// 等 Task 2 引入后再验证
```

- [ ] **Step 4: Commit**

```bash
cd chess-review-game
git add puzzles.js
git commit -m "feat: add puzzles.js with 24 puzzles (difficulty + theme fields)"
```

---

### Task 2: 修改 index.html — 引入 puzzles.js 并添加弹窗 HTML

**Files:**
- Modify: `index.html`

- [ ] **Step 1: 在 `<script src="./app.js">` 之前添加 puzzles.js 引入**

在 `index.html` 第 160 行 `<script src="./app.js"></script>` 前插入：
```html
    <script src="./puzzles.js"></script>
    <script src="./app.js"></script>
```

- [ ] **Step 2: 将"换一题"按钮 id 改为 select-puzzle-btn，文字改为"选题"**

找到：
```html
<button id="next-puzzle-btn" class="ghost">换一题</button>
```
改为：
```html
<button id="select-puzzle-btn" class="ghost">选题</button>
```

- [ ] **Step 3: 在 promotion-modal 之后添加题目选择弹窗 HTML**

在 `</body>` 前，promotion-modal 之后添加：
```html
    <div id="puzzle-select-modal" class="puzzle-modal hidden" aria-hidden="true">
      <div class="puzzle-modal-card">
        <div class="puzzle-modal-head">
          <h3>选择题目</h3>
          <button id="puzzle-modal-close" class="puzzle-modal-close" aria-label="关闭">×</button>
        </div>
        <div class="puzzle-filters">
          <div class="filter-row">
            <span class="filter-label">难度</span>
            <div class="filter-pills" id="difficulty-filter">
              <button class="pill active" data-value="">全部</button>
              <button class="pill" data-value="beginner">初级</button>
              <button class="pill" data-value="intermediate">中级</button>
              <button class="pill" data-value="expert">高级</button>
            </div>
          </div>
          <div class="filter-row">
            <span class="filter-label">主题</span>
            <div class="filter-pills" id="theme-filter">
              <button class="pill active" data-value="">全部</button>
              <button class="pill" data-value="endgame">残局</button>
              <button class="pill" data-value="middlegame">中局</button>
              <button class="pill" data-value="tactic">战术</button>
              <button class="pill" data-value="opening">开局</button>
            </div>
          </div>
        </div>
        <div id="puzzle-grid" class="puzzle-grid"></div>
        <p id="puzzle-empty" class="puzzle-empty hidden">暂无符合条件的题目</p>
      </div>
    </div>
```

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add puzzle select modal HTML and load puzzles.js"
```

---

### Task 3: 修改 app.js — 删除内联题库，改按钮引用，加筛选+弹窗逻辑

**Files:**
- Modify: `app.js`

- [ ] **Step 1: 删除 app.js 中第 118-239 行的内联 PUZZLES 数组**

找到并删除从 `const PUZZLES = [` 到对应 `];` 的全部内容（约 118-239 行）。puzzles.js 已在前面加载，PUZZLES 为全局变量，无需重新声明。

- [ ] **Step 2: 将 nextPuzzleBtn 引用改为 selectPuzzleBtn**

找到：
```js
const nextPuzzleBtn = document.getElementById("next-puzzle-btn");
```
改为：
```js
const selectPuzzleBtn = document.getElementById("select-puzzle-btn");
```

找到所有 `nextPuzzleBtn` 的使用处，全部改为 `selectPuzzleBtn`。（搜索全文，通常在事件绑定处。）

- [ ] **Step 3: 在 DOM 引用声明区域末尾添加弹窗元素引用**

在 `const guidePanel = ...` 之后添加：
```js
const puzzleSelectModal = document.getElementById("puzzle-select-modal");
const puzzleModalClose = document.getElementById("puzzle-modal-close");
const puzzleGrid = document.getElementById("puzzle-grid");
const puzzleEmpty = document.getElementById("puzzle-empty");
const difficultyFilterEl = document.getElementById("difficulty-filter");
const themeFilterEl = document.getElementById("theme-filter");
```

- [ ] **Step 4: 添加筛选状态对象**

在 `const state = {` 之前添加：
```js
const puzzleFilter = { difficulty: "", theme: "" };
```

- [ ] **Step 5: 添加弹窗渲染函数**

在 `pickRandomPuzzle` 函数之后添加：
```js
function openPuzzleModal() {
  renderPuzzleGrid();
  puzzleSelectModal.classList.remove("hidden");
  puzzleSelectModal.setAttribute("aria-hidden", "false");
}

function closePuzzleModal() {
  puzzleSelectModal.classList.add("hidden");
  puzzleSelectModal.setAttribute("aria-hidden", "true");
}

function renderPuzzleGrid() {
  const filtered = PUZZLES.filter((p) => {
    const diffOk = !puzzleFilter.difficulty || p.difficulty === puzzleFilter.difficulty;
    const themeOk = !puzzleFilter.theme || p.theme === puzzleFilter.theme;
    return diffOk && themeOk;
  });

  if (filtered.length === 0) {
    puzzleGrid.innerHTML = "";
    puzzleEmpty.classList.remove("hidden");
    return;
  }
  puzzleEmpty.classList.add("hidden");

  const diffLabels = { beginner: "初级", intermediate: "中级", expert: "高级" };
  const themeLabels = { endgame: "残局", middlegame: "中局", tactic: "战术", opening: "开局" };
  const currentId = state.puzzle?.currentId ?? "";

  puzzleGrid.innerHTML = filtered
    .map(
      (p) => `
    <button class="puzzle-card${p.id === currentId ? " current" : ""}" data-id="${p.id}">
      <span class="puzzle-card-title">${p.title}</span>
      <span class="puzzle-card-meta">${themeLabels[p.theme] ?? p.theme} · ${diffLabels[p.difficulty] ?? p.difficulty}</span>
    </button>`,
    )
    .join("");

  puzzleGrid.querySelectorAll(".puzzle-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      const puzzle = PUZZLES.find((p) => p.id === btn.dataset.id);
      if (puzzle) {
        applyPuzzle(puzzle, false);
        closePuzzleModal();
      }
    });
  });
}

function setPill(container, value) {
  container.querySelectorAll(".pill").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.value === value);
  });
}
```

- [ ] **Step 6: 替换 selectPuzzleBtn 的事件绑定，添加弹窗关闭和筛选器事件**

找到原来 `nextPuzzleBtn.addEventListener` 的事件绑定（通常是随机切换题目），改为：
```js
selectPuzzleBtn.addEventListener("click", openPuzzleModal);

puzzleModalClose.addEventListener("click", closePuzzleModal);

puzzleSelectModal.addEventListener("click", (e) => {
  if (e.target === puzzleSelectModal) closePuzzleModal();
});

difficultyFilterEl.addEventListener("click", (e) => {
  const pill = e.target.closest(".pill");
  if (!pill) return;
  puzzleFilter.difficulty = pill.dataset.value;
  setPill(difficultyFilterEl, puzzleFilter.difficulty);
  renderPuzzleGrid();
});

themeFilterEl.addEventListener("click", (e) => {
  const pill = e.target.closest(".pill");
  if (!pill) return;
  puzzleFilter.theme = pill.dataset.value;
  setPill(themeFilterEl, puzzleFilter.theme);
  renderPuzzleGrid();
});
```

- [ ] **Step 7: 确认 app.js 中没有剩余的 nextPuzzleBtn 引用**

```bash
grep -n "nextPuzzleBtn" chess-review-game/app.js
```
Expected: 无输出

- [ ] **Step 8: Commit**

```bash
git add app.js
git commit -m "feat: wire puzzle select modal with difficulty/theme filters"
```

---

### Task 4: 修改 styles.css — 添加弹窗与卡片样式

**Files:**
- Modify: `styles.css`

- [ ] **Step 1: 在 styles.css 末尾添加弹窗样式**

```css
/* ── Puzzle Select Modal ─────────────────────────────── */
.puzzle-modal {
  position: fixed;
  inset: 0;
  background: rgba(29, 36, 48, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  backdrop-filter: blur(4px);
}

.puzzle-modal.hidden {
  display: none;
}

.puzzle-modal-card {
  background: var(--panel-strong);
  border-radius: 20px;
  box-shadow: var(--shadow);
  width: min(680px, calc(100vw - 32px));
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.puzzle-modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 12px;
  border-bottom: 1px solid rgba(188, 138, 66, 0.18);
}

.puzzle-modal-head h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--ink);
}

.puzzle-modal-close {
  background: none;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  color: var(--muted);
  line-height: 1;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.15s;
}

.puzzle-modal-close:hover {
  background: rgba(188, 138, 66, 0.12);
  color: var(--ink);
}

/* ── Filters ─────────────────────────────────────────── */
.puzzle-filters {
  padding: 14px 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-bottom: 1px solid rgba(188, 138, 66, 0.12);
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-label {
  font-size: 0.78rem;
  color: var(--muted);
  min-width: 32px;
  letter-spacing: 0.04em;
}

.filter-pills {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.pill {
  padding: 4px 12px;
  border-radius: 99px;
  border: 1.5px solid rgba(188, 138, 66, 0.3);
  background: transparent;
  color: var(--muted);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s;
}

.pill:hover {
  border-color: var(--gold);
  color: var(--ink);
}

.pill.active {
  background: var(--gold);
  border-color: var(--gold);
  color: #fff;
  font-weight: 600;
}

/* ── Puzzle Grid ─────────────────────────────────────── */
.puzzle-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 10px;
  padding: 16px 24px 20px;
  overflow-y: auto;
}

.puzzle-card {
  background: var(--panel);
  border: 1.5px solid rgba(188, 138, 66, 0.2);
  border-radius: 12px;
  padding: 12px 14px;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.puzzle-card:hover {
  border-color: var(--gold);
  background: var(--panel-strong);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(188, 138, 66, 0.15);
}

.puzzle-card.current {
  border-color: var(--accent);
  background: rgba(29, 107, 88, 0.08);
}

.puzzle-card-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ink);
  line-height: 1.3;
}

.puzzle-card-meta {
  font-size: 0.75rem;
  color: var(--muted);
}

.puzzle-empty {
  padding: 24px;
  text-align: center;
  color: var(--muted);
  font-size: 0.9rem;
}

.puzzle-empty.hidden {
  display: none;
}
```

- [ ] **Step 2: Commit**

```bash
git add styles.css
git commit -m "feat: add puzzle select modal and card styles"
```

---

### Task 5: 验收测试

**Files:**
- Read: `index.html`、`app.js`、`puzzles.js`

- [ ] **Step 1: 启动服务**

```bash
cd chess-review-game
node server.js
```
Expected: 服务在 4173 端口启动

- [ ] **Step 2: 验证题目数量**

浏览器控制台：
```js
PUZZLES.length
```
Expected: `24`

- [ ] **Step 3: 验证弹窗打开**

1. 选择"Puzzle 续下"模式
2. 点击"开始游戏"
3. 点击"选题"按钮
Expected: 弹窗出现，显示题目卡片网格

- [ ] **Step 4: 验证筛选功能**

在弹窗中：
1. 点击难度"初级" → 卡片列表只显示 `difficulty: "beginner"` 的题目（应为 8 道）
2. 再点击主题"残局" → 仅显示初级残局（应为 3 道）
3. 点击难度"全部" → 显示所有残局题（应为 8 道）
4. 点击主题"全部"、难度"全部" → 显示全部 24 道

- [ ] **Step 5: 验证空状态**

在弹窗中选择"高级"+"开局" → 显示"暂无符合条件的题目"

- [ ] **Step 6: 验证加载题目**

点击任意一道题目卡片 → 弹窗关闭，棋盘加载对应局面，starter-text 显示对应题目标题

- [ ] **Step 7: 验证当前题高亮**

加载一道题后，再次打开弹窗 → 对应卡片有绿色高亮边框

- [ ] **Step 8: 验证其他模式不受影响**

切换到"人机对战"模式，点击"开始游戏"，走一步棋 → 正常落子，无 JS 错误

- [ ] **Step 9: 最终 Commit（如有遗漏修复）**

```bash
git add -A
git commit -m "fix: puzzle system acceptance fixes"
```
