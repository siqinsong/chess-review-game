#!/bin/zsh

cd "/Users/songsiqin/chess-review-game" || exit 1

PORT=4173
URL="http://127.0.0.1:${PORT}"

open "${URL}"
node server.js
