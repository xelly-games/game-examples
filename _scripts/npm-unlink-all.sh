#!/usr/bin/env bash

set -ex

pushd breakout && npm unlink @xelly/xelly.js --no-save && popd
pushd chemi && npm unlink @xelly/xelly.js --no-save && popd
pushd debug && npm unlink @xelly/xelly.js --no-save && popd
pushd fifteen && npm unlink @xelly/xelly.js --no-save && popd
pushd fireworks && npm unlink @xelly/xelly.js --no-save && popd
pushd flappy && npm unlink @xelly/xelly.js --no-save && popd
pushd golf-solitaire && npm unlink @xelly/xelly.js --no-save && popd
pushd hangman && npm unlink @xelly/xelly.js --no-save && popd
pushd hello-world && npm unlink @xelly/xelly.js --no-save && popd
pushd poker-solitaire && npm unlink @xelly/xelly.js --no-save && popd
pushd running && npm unlink @xelly/xelly.js --no-save && popd
pushd spelly && npm unlink @xelly/xelly.js --no-save && popd
pushd sudoku && npm unlink @xelly/xelly.js --no-save && popd
pushd word-zap && npm unlink @xelly/xelly.js --no-save && popd
