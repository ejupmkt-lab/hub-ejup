#!/usr/bin/env python3
"""Squad capability: pull a YouTube transcript (auto-captions ok).
Usage: python fetch_youtube_transcript.py <video_id_or_url> [out.txt]
Requires: pip install --user youtube-transcript-api
The plain timedtext GET is gated by YouTube (returns empty); this lib works.
"""
import sys, re
def vid(s):
    m=re.search(r'(?:v=|youtu\.be/|/watch\?.*v=)([A-Za-z0-9_-]{11})', s)
    return m.group(1) if m else s
def main():
    if len(sys.argv)<2: print("need video id/url"); sys.exit(1)
    v=vid(sys.argv[1]); out=sys.argv[2] if len(sys.argv)>2 else "transcript.txt"
    from youtube_transcript_api import YouTubeTranscriptApi
    try:
        api=YouTubeTranscriptApi(); data=api.fetch(v, languages=["pt","pt-BR","en"]); segs=[s.text for s in data]
    except Exception:
        data=YouTubeTranscriptApi.get_transcript(v, languages=["pt","pt-BR","en"]); segs=[s["text"] for s in data]
    full=re.sub(r"\s+"," "," ".join(segs)).strip()
    open(out,"w",encoding="utf-8").write(full)
    print(f"OK {v}: {len(full)} chars / {len(full.split())} words -> {out}")
if __name__=="__main__": main()
