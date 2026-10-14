#!/bin/sh
# Usage: componer_cierre.sh cierre_bg.mp4 baile_alpha.mov presentacion_completa.mp4 salida_cierre.mp4 salida_final.mp4 [musica.mp3]
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
# Music while he dances (optional 6th arg): starts when the dancer appears (0.3 s), fades out at the end of the track.
if [ -n "$6" ]; then
  ffmpeg -v error -y -i "$4" -i "$6" -filter_complex "[1:a]afade=t=out:st=6.7:d=0.5,adelay=300|300,apad=whole_dur=9[a]" \
   -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -t 9 -movflags +faststart "$4.tmp.mp4" && mv "$4.tmp.mp4" "$4"
  D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$5"); OFF=$(python3 -c "print(int(($D-9+0.3)*1000))")
  ffmpeg -v error -y -i "$5" -i "$6" -filter_complex "[1:a]afade=t=out:st=6.7:d=0.5,adelay=$OFF|$OFF,apad=whole_dur=$D[a]" \
   -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -t "$D" -movflags +faststart "$5.tmp.mp4" && mv "$5.tmp.mp4" "$5"
fi
