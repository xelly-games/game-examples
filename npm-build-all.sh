#!/usr/bin/env bash

set -ex

pushd breakout && npm run build && popd
pushd chemi && npm run build && popd
pushd debug && npm run build && popd
pushd fifteen && npm run build && popd
pushd fireworks && npm run build && popd
pushd flappy && npm run build && popd
pushd golf-solitaire && npm run build && popd
pushd hangman && npm run build && popd
pushd hello-world && npm run build && popd
pushd poker-solitaire && npm run build && popd
pushd running && npm run build && popd
pushd spelly && npm run build && popd
pushd sudoku && npm run build && popd
pushd word-zap && npm run build && popd
