#!/bin/sh
# Usage: componer_opening.sh opening_bg.mp4 man_loop.mov anciano_4_escenarios_titulos.mp4 salida_opening.mp4 salida_completa.mp4
# opening_bg.mp4: render of titulos/opening.html (18 s, 24 fps) with the motion-cards engine.
# man_loop.mov: first 144 frames (one 6 s walk cycle) of the man's alpha matte.
# 18 s = 3 cycles, so the man continues seamlessly into the main animation.
set -e
ffmpeg -v error -y -i "$1" -stream_loop -1 -i "$2" -filter_complex \
 "[1:v]scale=-2:432:flags=lanczos[man];[0:v][man]overlay=x=127:y=615:format=auto:shortest=1,format=yuv420p[v]" \
 -map "[v]" -t 18 -r 24 -c:v libx264 -crf 18 -preset slow -movflags +faststart "$4"
ffmpeg -v error -y -i "$4" -i "$3" -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0,format=yuv420p[v]" \
 -map "[v]" -c:v libx264 -crf 18 -preset slow -movflags +faststart "$5"
