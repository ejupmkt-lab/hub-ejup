#!/bin/bash
# Monta a vinheta de A Sala: 6 clipes Kling + logo A, trilha Ziv Moran "Shades" (37,5 s até o fim), 1920x1080, 24 fps, 13 s.
set -e
FF=${FF:-ffmpeg}
cd "$(dirname "$0")"
G="scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1,eq=saturation=0.88:contrast=1.04,colorbalance=bs=0.04:bm=0.02,noise=alls=7:allf=t,vignette=PI/5,format=yuv420p"
$FF -y -v error \
 -i clipes/c2.mp4 -i clipes/c3-still.mp4 -i clipes/c4.mp4 -i clipes/c5.mp4 -i clipes/c6.mp4 -i clipes/c7.mp4 \
 -loop 1 -t 3.0 -framerate 24 -i ../logo/a-sala-logo-a.png \
 -ss 37.5 -t 13.0 -i ../trilha/ziv-moran-shades.wav \
 -filter_complex "
 [0:v]trim=0.3:1.9,setpts=PTS-STARTPTS,$G,fade=in:0:8[v2];
 [1:v]trim=0:1.6,setpts=PTS-STARTPTS,$G[v3];
 [2:v]trim=0.4:2.0,setpts=PTS-STARTPTS,$G[v4];
 [3:v]trim=0.6:2.2,setpts=PTS-STARTPTS,$G[v5];
 [4:v]trim=0.5:2.1,setpts=PTS-STARTPTS,$G[v6];
 [5:v]trim=0:2.0,setpts=PTS-STARTPTS,$G,fade=out:st=1.7:d=0.3[v7];
 [6:v]format=yuv420p,noise=alls=5:allf=t,fade=in:st=0.1:d=0.8,fade=out:st=2.5:d=0.5,format=yuv420p[fim];
 [7:a]afade=t=in:d=0.3,afade=t=out:st=12.2:d=0.8[a];
 [v2][v3][v4][v5][v6][v7][fim]concat=n=7:v=1:a=0[v]" \
 -map "[v]" -map "[a]" -shortest -c:v libx264 -preset slow -crf 19 -r 24 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart ../a-sala-vinheta-v2-fullhd.mp4
echo ok
