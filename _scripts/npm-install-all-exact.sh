#!/usr/bin/env bash

set -ex

XELLY_JS_VERSION="2.0.3"

pushd breakout && npm install "@xelly/xelly.js@${XELLY_JS_VERSION}" --save-exact && popd
pushd chemi && npm install "@xelly/xelly.js@${XELLY_JS_VERSION}" --save-exact && popd
pushd debug && npm install "@xelly/xelly.js@${XELLY_JS_VERSION}" --save-exact && popd
pushd fifteen && npm install "@xelly/xelly.js@${XELLY_JS_VERSION}" --save-exact && popd
pushd fireworks && npm install "@xelly/xelly.js@${XELLY_JS_VERSION}" --save-exact && popd
pushd flappy && npm install "@xelly/xelly.js@${XELLY_JS_VERSION}" --save-exact && popd
pushd golf-solitaire && npm install "@xelly/xelly.js@${XELLY_JS_VERSION}" --save-exact && popd
pushd hangman && npm install "@xelly/xelly.js@${XELLY_JS_VERSION}" --save-exact && popd
pushd hello-world && npm install "@xelly/xelly.js@${XELLY_JS_VERSION}" --save-exact && popd
pushd poker-solitaire && npm install "@xelly/xelly.js@${XELLY_JS_VERSION}" --save-exact && popd
pushd running && npm install "@xelly/xelly.js@${XELLY_JS_VERSION}" --save-exact && popd
pushd spelly && npm install "@xelly/xelly.js@${XELLY_JS_VERSION}" --save-exact && popd
pushd sudoku && npm install "@xelly/xelly.js@${XELLY_JS_VERSION}" --save-exact && popd
pushd word-zap && npm install "@xelly/xelly.js@${XELLY_JS_VERSION}" --save-exact && popd
