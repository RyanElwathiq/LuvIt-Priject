#!/usr/bin/env python
"""
Extract evenly-distributed WebP frames from a video for an Apple-style
scroll-driven image sequence, plus a manifest.json describing them.

Self-contained: uses the static ffmpeg binary bundled with the
`imageio-ffmpeg` pip package, so no system ffmpeg / PATH setup is needed.

Usage (defaults match this project):
    py extract_frames.py
    py extract_frames.py --input hero.mp4 --frames 120 --width 1080 --quality 80
"""

import argparse
import json
import os
import re
import subprocess
import sys

try:
    import imageio_ffmpeg
except ImportError:
    sys.exit("Missing dependency. Run:  py -m pip install imageio-ffmpeg")

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


def probe(input_path):
    """Return (duration_seconds, fps, total_frames) by decoding the stream once."""
    # `-f null -` decodes the whole video (fast for a short clip) and reports
    # the exact final frame count; duration and fps come from the header lines.
    proc = subprocess.run(
        [FFMPEG, "-i", input_path, "-map", "0:v:0", "-f", "null", "-"],
        capture_output=True, text=True,
    )
    log = proc.stderr

    dur = None
    m = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)", log)
    if m:
        h, mi, s = m.groups()
        dur = int(h) * 3600 + int(mi) * 60 + float(s)

    fps = None
    m = re.search(r"(\d+(?:\.\d+)?)\s*fps", log)
    if m:
        fps = float(m.group(1))

    total = None
    matches = re.findall(r"frame=\s*(\d+)", log)
    if matches:
        total = int(matches[-1])

    if not (dur and fps and total):
        sys.exit(
            "Could not probe video metadata.\n"
            f"duration={dur} fps={fps} total_frames={total}\n"
            "ffmpeg output:\n" + log[-1500:]
        )
    return dur, fps, total


def even_indices(total, n):
    """n frame indices evenly spread across [0, total-1], inclusive of both ends."""
    n = min(n, total)
    if n == 1:
        return [0]
    return [round(i * (total - 1) / (n - 1)) for i in range(n)]


def extract(input_path, out_dir, indices, fps, width, quality):
    os.makedirs(out_dir, exist_ok=True)
    pad = max(4, len(str(len(indices) - 1)))
    frames = []
    dims = None

    for i, idx in enumerate(indices):
        ts = idx / fps
        name = f"frame_{i:0{pad}d}.webp"
        out_path = os.path.join(out_dir, name)
        cmd = [
            FFMPEG, "-y",
            "-ss", f"{ts:.6f}",          # accurate input seek (decodes to exact frame)
            "-i", input_path,
            "-frames:v", "1",
            "-vf", f"scale={width}:-2",   # lock width, keep aspect (height even)
            "-c:v", "libwebp",
            "-quality", str(quality),
            "-compression_level", "6",
            "-preset", "picture",
            out_path,
        ]
        r = subprocess.run(cmd, capture_output=True, text=True)
        if r.returncode != 0 or not os.path.exists(out_path):
            sys.exit(f"Frame {i} (t={ts:.3f}s) failed:\n{r.stderr[-800:]}")

        if dims is None:
            dims = _read_webp_size(out_path)

        frames.append({
            "index": i,
            "file": name,
            "source_frame": idx,
            "timestamp": round(ts, 4),
            "bytes": os.path.getsize(out_path),
        })
        print(f"\r  {i + 1}/{len(indices)}  {name}", end="", flush=True)

    print()
    return frames, dims


def _read_webp_size(path):
    """Parse width/height from a WebP header (VP8/VP8L/VP8X) without Pillow."""
    with open(path, "rb") as f:
        data = f.read(40)
    fmt = data[12:16]
    try:
        if fmt == b"VP8 ":
            w = (data[26] | (data[27] << 8)) & 0x3FFF
            h = (data[28] | (data[29] << 8)) & 0x3FFF
            return w, h
        if fmt == b"VP8L":
            b = data[21:25]
            bits = int.from_bytes(b, "little")
            return (bits & 0x3FFF) + 1, ((bits >> 14) & 0x3FFF) + 1
        if fmt == b"VP8X":
            w = (data[24] | (data[25] << 8) | (data[26] << 16)) + 1
            h = (data[27] | (data[28] << 8) | (data[29] << 16)) + 1
            return w, h
    except Exception:
        pass
    return None, None


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--input", default="hero.mp4")
    p.add_argument("--out", default="frames")
    p.add_argument("--frames", type=int, default=120)
    p.add_argument("--width", type=int, default=1080)
    p.add_argument("--quality", type=int, default=80, help="WebP quality 0-100")
    args = p.parse_args()

    if not os.path.exists(args.input):
        sys.exit(f"Input not found: {args.input}")

    print(f"ffmpeg:  {FFMPEG}")
    print(f"input:   {args.input}")
    dur, fps, total = probe(args.input)
    print(f"probed:  {dur:.2f}s, {fps:g} fps, {total} source frames")

    indices = even_indices(total, args.frames)
    print(f"extract: {len(indices)} frames @ {args.width}px width, WebP q{args.quality}\n")

    frames, dims = extract(args.input, args.out, indices, fps, args.width, args.quality)

    total_bytes = sum(f["bytes"] for f in frames)
    manifest = {
        "source": os.path.basename(args.input),
        "source_duration": round(dur, 3),
        "source_fps": fps,
        "source_frames": total,
        "frame_count": len(frames),
        "width": dims[0],
        "height": dims[1],
        "format": "webp",
        "quality": args.quality,
        "filename_pattern": "frame_%0{}d.webp".format(max(4, len(str(len(frames) - 1)))),
        "total_bytes": total_bytes,
        "frames": frames,
    }
    manifest_path = os.path.join(args.out, "manifest.json")
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    print(f"\nDone.")
    print(f"  frames:   {len(frames)}  ({dims[0]}x{dims[1]})")
    print(f"  total:    {total_bytes / 1024:.0f} KB  (avg {total_bytes / len(frames) / 1024:.1f} KB/frame)")
    print(f"  output:   {os.path.abspath(args.out)}")
    print(f"  manifest: {manifest_path}")


if __name__ == "__main__":
    main()
