#!/bin/sh
# Usage: componer_opening.sh opening_bg.mp4 man_loop.mov anciano_4_escenarios_titulos.mp4 salida_opening.mp4 salida_completa.mp4
# opening_bg.mp4: render of titulos/opening.html (18 s, 24 fps) with the motion-cards engine.
# man_loop.mov: first 144 frames (one 6 s walk cycle) of the man's alpha matte.
# The opening lasts DUR s (default 22); the walk cycle (6 s) starts at an offset so the
# opening ends on a cycle boundary and the man continues seamlessly into the main animation.
set -e
DUR=${DUR:-22}; OFF=$(python3 -c "print((-$DUR)%6)")
ffmpeg -v error -y -i "$1" -stream_loop -1 -i "$2" -filter_complex \
 "[1:v]trim=start=$OFF,setpts=PTS-STARTPTS,scale=-2:432:flags=lanczos[man];[0:v][man]overlay=x=127:y=615:format=auto:shortest=1,format=yuv420p[v]" \
 -map "[v]" -t $DUR -r 24 -c:v libx264 -crf 18 -preset slow -movflags +faststart "$4"
ffmpeg -v error -y -i "$4" -i "$3" -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0,format=yuv420p[v]" \
 -map "[v]" -c:v libx264 -crf 18 -preset slow -movflags +faststart "$5"
