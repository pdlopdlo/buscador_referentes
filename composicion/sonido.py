# Sound design for presentacion_final (65.5 s): places SFX pieces (sfx/Sx_yy.wav,
# cut from the user's SFX01-04 packs) on the animation's event times, mixes them
# under the dance music and muxes the result.
# usage: python3 sonido.py presentacion_final_sin_audio.mp4 baile_musica.mp3 salida.mp4
import subprocess, sys
VIDEO, MUSIC, OUT = sys.argv[1:4]
D = 65.5
OP, MAIN, CL = 0.0, 22.0, 56.5   # section starts in the final cut
PEAK = {'S1_00':-5.1,'S1_01':-4.2,'S1_02':-4.9,'S1_03':-3.2,'S1_04':-4.8,'S1_05':-5.5,'S1_06':-5.4,
        'S2_00':-0.2,'S2_01':-4.5,'S2_02':-0.1,'S2_03':-0.2,'S2_04':-0.9,'S3_00':-2.9,'S3_01':-13.3,
        'S3_04':0.0,'S3_06':-1.6,'S3_07':-3.7,'S4_00':0.0,'S4_01':-18.6,'S4_02':0.0,'S4_03':-3.9}
# (time in final cut, sound, target peak dBFS)
E = []
add = lambda t, s, db: E.append((round(t, 3), s, db))
# ---- Opening ----
add(OP+0.0,  'S4_00', -9)            # long riser, peaks (~2.0 s) as "2026" lands
for i in range(4): add(OP+1.9+i*0.12, 'S2_03', -20)   # icon tiles pop in
add(OP+2.3,  'S2_01', -18)           # chip
add(OP+5.65, 'S1_02', -12)           # hero shrinks into header (whoosh, peak ~6.2)
add(OP+6.9,  'S2_02', -18)           # card A lands
add(OP+9.15, 'S3_01', -16)           # highlight sweep sparkle
for i in range(3): add(OP+9.5+i*0.16, 'S2_03', -21)   # estamento chips
add(OP+11.5, 'S2_02', -18)           # card B lands
for i in range(8): add(OP+11.95+i*0.17, 'S1_04', -24) # count-up ticks
add(OP+13.35,'S1_00', -13)           # 33 reached: chime
add(OP+14.5, 'S2_02', -18)           # card C lands
for i in range(4): add(OP+14.9+i*0.35, 'S2_01', -18)  # 4 sections cascade
add(OP+20.45,'S4_01', -16)           # outro air whoosh
# ---- Main: 4 scenes ----
add(MAIN+0.05,'S1_03', -15)          # title band builds in
for t, chime in [(7.09,'S3_00'),(12.24,'S3_07'),(18.46,'S1_00')]:
    add(MAIN+t-0.6, 'S1_05', -15)    # whoosh into the new section
    add(MAIN+t+0.15,chime, -14)      # title "press" chime
add(MAIN+26.65,'S1_02', -11)         # curtain slides over the man
add(MAIN+30.0, 'S1_03', -13)         # curtain moves on
# ---- Closing ----
add(CL+0.25, 'S2_00', -8)            # bass thump as the dancer appears
add(CL+1.85, 'S3_06', -12)           # "I" badge lands
add(CL+2.0,  'S4_03', -12)           # confetti burst 1
for i in range(3): add(CL+2.3+i*0.15, 'S2_03', -22)   # tiles pop
add(CL+5.6,  'S3_04', -16)           # confetti burst 2
E.sort()

cmd = ['ffmpeg','-v','error','-y','-i',VIDEO,'-i',MUSIC]
for _, s, _ in E: cmd += ['-i', f'sfx/{s}.wav']
fc = []
for k, (t, s, db) in enumerate(E):
    ms = int(t*1000)
    fc.append(f'[{k+2}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume={db-PEAK[s]:.1f}dB,adelay={ms}|{ms}[s{k}]')
fc.append(f'[1:a]aformat=sample_rates=48000:channel_layouts=stereo,afade=t=out:st=6.7:d=0.5,adelay={int((CL+0.3)*1000)}|{int((CL+0.3)*1000)}[mus]')
fc.append(''.join(f'[s{k}]' for k in range(len(E))) + f'[mus]amix=inputs={len(E)+1}:normalize=0:duration=longest,'
          f'alimiter=limit=0.89,apad=whole_dur={D}[a]')
cmd += ['-filter_complex', ';'.join(fc), '-map','0:v','-map','[a]','-c:v','copy','-c:a','aac','-b:a','192k',
        '-t', str(D), '-movflags','+faststart', OUT]
subprocess.run(cmd, check=True)
print(f'{len(E)} SFX events placed')
