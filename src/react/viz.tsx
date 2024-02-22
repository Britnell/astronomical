import {
  useEffect,
  useRef,
  type MouseEventHandler,
  useLayoutEffect,
} from "react";
import type { SampleT } from "./player";

export function SampleWave({
  sample,
  wave,
  buffer,
}: {
  sample: SampleT;
  wave: number[] | null;
  buffer: AudioBuffer;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    if (!canvasRef.current) return;
    const parent = canvasRef.current.parentElement?.getBoundingClientRect();
    if (!parent) return;
    canvasRef.current.width = parent?.width;
    canvasRef.current.height = parent?.height;
  }, [wave]);

  useEffect(() => {
    if (!wave) return;
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // draf from wavepos - x
    const perc = sample.begin / buffer.duration;
    const samplepos = Math.floor(perc * wave.length);
    const W = canvasRef.current.width;
    const H = canvasRef.current.height;
    const chunkSize = 10;

    // begin drawing
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#000";
    ctx.beginPath();

    for (let x = 0; x < W; x++) {
      const from = samplepos + x * chunkSize;
      const slice = wave.slice(from, from + chunkSize);
      const max = findmax(slice);
      const y = H * (1 - max * 1.0);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [wave, sample]);

  if (!wave)
    return (
      <div>
        <p>Loading...</p>
      </div>
    );

  return (
    <canvas
      ref={canvasRef}
      className=" border border-[#87a2c7] bg-[#87a2c7] "
      width="100"
      height="100"
      // onClick={canvasClick}
    />
  );
}

export function Wave({
  buffer,
  wave,
  onclick,
}: {
  buffer: AudioBuffer;
  wave: number[];
  onclick: (t: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const canvasClick: MouseEventHandler<HTMLCanvasElement> = (ev) => {
    // if (!edit) return;
    const cvs = ev.target as HTMLCanvasElement;
    const perc = ev.clientX / cvs.getBoundingClientRect().width;
    const val = perc * (buffer?.duration ?? 0);
    onclick(val);
  };

  useLayoutEffect(() => {
    if (!canvasRef.current) return;
    canvasRef.current.width = window.innerWidth - 48;
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (!wave) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // p
    const LEN = wave?.length;
    const W = canvasRef.current.width;
    const H = canvasRef.current.height;
    const chunkSize = LEN / W;

    // begin drawing
    ctx.clearRect(0, 0, W, H);
    let last = 0;
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgb(0 0 0)";
    ctx.beginPath();

    for (let x = 1; x < W; x++) {
      const to = Math.floor(chunkSize * x);
      const slice = wave.slice(last, to);

      const max = findmax(slice);
      const y = H * (1 - max * 1.0);
      last = to + 1;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [wave]);

  return (
    <canvas
      ref={canvasRef}
      className=" border border-[var(--fg)] bg-[var(--fg)] "
      width="800"
      height="120"
      onClick={canvasClick}
    />
  );
}

export const findmax = (arr: Float32Array | number[]) => {
  let max = 0;
  arr.forEach((v) => {
    const x = Math.abs(v);
    if (x > max) max = x;
  });
  return max;
};
