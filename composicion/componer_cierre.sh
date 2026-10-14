#!/bin/sh
# Usage: componer_cierre.sh cierre_bg.mp4 baile_alpha.mov presentacion_completa.mp4 salida_cierre.mp4 salida_final.mp4
# cierre_bg.mp4: render of titulos/cierre.html (9 s). baile_alpha.mov: Kling motion-control
# dance (960x960, 30 fps) matted with matte.py (MIN_HOLE 150, PROTECT_Y 340).
# The dancer has the same size and place as the walking man (scale 484 px, feet at y=1040),
# fades in at 0.3 s and holds the last frame until the end.
# LOGO1/LOGO2 (optional env): matted logo intros (960x540 ProRes with alpha) shown small,
# side by side under "Tramo" from 2.5 s; LOGO1 holds frame 60 (the smile), LOGO2 frame 66
# (just before its own fade-out).
# Audio is added afterwards by sonido.py.
set -e
SIZE=${SIZE:-484}; X=${X:-15}; Y=${Y:-590}
LOGO1=${LOGO1:-logos/logo_sonrisa_a.mov}; LOGO2=${LOGO2:-logos/intro-crs-sag_a.mov}
ffmpeg -v error -y -i "$1" -i "$2" -i "$LOGO1" -i "$LOGO2" -filter_complex "
[1:v]fps=24,scale=${SIZE}:${SIZE}:flags=lanczos,format=yuva444p,tpad=start_duration=0.3:start_mode=add:color=black@0,tpad=stop_mode=clone:stop_duration=2,fade=t=in:st=0.3:d=0.4:alpha=1[d];
[2:v]trim=end_frame=61,setpts=PTS-STARTPTS,crop=606:150:177:187,scale=-2:96:flags=lanczos,format=yuva444p,tpad=start_duration=2.5:start_mode=add:color=black@0,tpad=stop_mode=clone:stop_duration=9[l1];
[3:v]trim=end_frame=67,setpts=PTS-STARTPTS,crop=364:388:321:80,scale=-2:210:flags=lanczos,format=yuva444p,tpad=start_duration=2.5:start_mode=add:color=black@0,tpad=stop_mode=clone:stop_duration=9[l2];
[0:v][l1]overlay=x=862:y=812:format=auto[b1];
[b1][l2]overlay=x=1290:y=755:format=auto[b2];
[b2][d]overlay=x=${X}:y=${Y}:format=auto,format=yuv420p[v]" \
 -map "[v]" -t 9 -r 24 -c:v libx264 -crf 18 -preset slow -movflags +faststart "$4"
ffmpeg -v error -y -i "$3" -i "$4" -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0,format=yuv420p[v]" \
 -map "[v]" -c:v libx264 -crf 18 -preset slow -movflags +faststart "$5"
