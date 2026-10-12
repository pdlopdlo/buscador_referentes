#!/bin/sh
# Usage: componer.sh anciano_caminando.mp4 salida.mp4
# 1) Recorta la zona blanca del vídeo vertical y genera alpha (matte.py).
# 2) Compone 1920x1080 sobre blanco: señales (senales.png) de derecha a
#    izquierda por detrás del anciano, que permanece fijo.
set -e
D=$(dirname "$0"); V="$1"; OUT="$2"
ffmpeg -v error -y -i "$V" -vf crop=720:900:260:600 -f rawvideo -pix_fmt rgb24 - \
 | python3 -I "$D/matte.py" 720 900 60 230 \
 | ffmpeg -v error -y -f rawvideo -pix_fmt rgba -s 720x900 -r 24 -i - \
   -c:v prores_ks -profile:v 4444 -pix_fmt yuva444p10le anciano_alpha.mov
ffmpeg -v error -y -f lavfi -i color=c=white:s=1920x1080:r=24 -loop 1 -framerate 24 -i "$D/senales.png" \
 -i anciano_alpha.mov -i "$V" -filter_complex "
[2:v]scale=-2:432:flags=lanczos[man];
[0:v][1:v]overlay=x='1120-306*t':y=600:shortest=1[bg];
[bg][man]overlay=x=127:y=615:shortest=1:format=auto,format=yuv420p[v]" \
 -map "[v]" -map 3:a? -c:v libx264 -crf 18 -preset slow -c:a aac -b:a 160k -shortest -movflags +faststart "$OUT"
