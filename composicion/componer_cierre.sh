#!/bin/sh
# Usage: componer_cierre.sh cierre_bg.mp4 baile_alpha.mov presentacion_completa.mp4 salida_cierre.mp4 salida_final.mp4
# cierre_bg.mp4: render of titulos/cierre.html (9 s). baile_alpha.mov: Kling motion-control
# dance (960x960, 30 fps) matted with matte.py (MIN_HOLE 150, PROTECT_Y 340).
# The dancer fades in at 0.3 s and holds the last frame until the end.
# Dancer size/position: SIZE (square px), X, Y (top-left); defaults keep the feet on the floor shadow.
set -e
SIZE=${SIZE:-560}; X=${X:-150}; Y=${Y:-484}
ffmpeg -v error -y -i "$1" -i "$2" -filter_complex "
[1:v]fps=24,scale=${SIZE}:${SIZE}:flags=lanczos,format=yuva444p,tpad=start_duration=0.3:start_mode=add:color=black@0,tpad=stop_mode=clone:stop_duration=2,fade=t=in:st=0.3:d=0.4:alpha=1[d];
[0:v][d]overlay=x=${X}:y=${Y}:format=auto:shortest=1,format=yuv420p[v]" \
 -map "[v]" -t 9 -r 24 -c:v libx264 -crf 18 -preset slow -movflags +faststart "$4"
ffmpeg -v error -y -i "$3" -i "$4" -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0,format=yuv420p[v]" \
 -map "[v]" -c:v libx264 -crf 18 -preset slow -movflags +faststart "$5"
