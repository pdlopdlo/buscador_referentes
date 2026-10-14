#!/bin/sh
# Usage: componer_titulos.sh anciano_4_escenarios.mp4 titulos_alpha.mov salida.mp4
# Overlays the neumorphic title band (1920x560 ProRes 4444 with alpha,
# rendered from titulos/titulos.html) on top of the 4-scene animation.
# Render the band with the motion-cards engine:
#   NODE_PATH=$(npm root -g) node <motion-cards>/engine/render.js titulos/titulos.html titulos_alpha.mov 24
set -e
ffmpeg -v error -y -i "$1" -i "$2" -filter_complex \
 "[0:v][1:v]overlay=0:0:format=auto:eof_action=pass,format=yuv420p[v]" \
 -map "[v]" -c:v libx264 -crf 18 -preset slow -movflags +faststart "$3"
