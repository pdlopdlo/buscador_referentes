#!/bin/sh
# Usage: componer_clip.sh anciano_alpha.mov anciano_caminando.mp4 clip.mp4 salida.mp4
# Same animation as componer.sh, but a video clip slides behind the man
# (right to left, leaving frame at the end) instead of the sign image.
# anciano_alpha.mov is the matte produced by the first step of componer.sh.
set -e
ffmpeg -v error -y -f lavfi -i color=c=white:s=1920x1080:r=24 -stream_loop -1 -i "$3" -i "$1" -i "$2" -filter_complex "
[1:v]scale=-2:450:flags=lanczos,setsar=1,fps=24[clip];
[2:v]scale=-2:432:flags=lanczos[man];
[0:v][clip]overlay=x='1120-235*t':y=600:eof_action=pass[bg];
[bg][man]overlay=x=127:y=615:shortest=1:format=auto,format=yuv420p[v]" \
 -map "[v]" -map 3:a? -c:v libx264 -crf 18 -preset slow -c:a aac -b:a 160k -t 6.208 -movflags +faststart "$4"
