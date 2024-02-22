import { useEffect, useRef, useState } from "react";
import type { SamplesT } from "./player";
import { SampleWave, Wave, findmax } from "./viz";
import { audioContext, loadSource } from "./loader";

const keybounce: { [id: string]: boolean } = {};

export default function Song({
  bufferId,
  buffer,
  callback,
  removeBuffer,
  samples,
  edit,
}: {
  bufferId: string;
  edit: string;
  buffer: AudioBuffer;
  callback: (type: string, val: any) => void;
  samples: SamplesT;
  removeBuffer: (id: string) => void;
}) {
  const [wavebuffer, setWavebuffer] = useState<number[] | null>(null);
  const sources = useRef<{ [id: string]: AudioBufferSourceNode | null }>({});
  const speed = 1.0;

  useEffect(() => {
    // calc wavebuffer for viz
    const audioData = buffer.getChannelData(0);
    const chunkSize = buffer.sampleRate / 1000;
    const chunks = audioData.length / chunkSize;
    let last = 0;

    const wave = [];
    for (let x = 1; x < chunks; x++) {
      const to = Math.floor(chunkSize * x);
      const slice = audioData.slice(last, to);
      const max = findmax(slice);
      wave.push(max);
      last = to + 1;
    }

    setWavebuffer(wave);
  }, [buffer]);

  useEffect(() => {
    // listen to keys & play samples
    const keydown = (ev: KeyboardEvent) => {
      const key = ev.key;

      if (ev.repeat) return;
      if (ev.ctrlKey) return; // avoid ctrl + f
      if (keybounce[key]) return; // key being held

      const sample = samples[key];
      if (!sample?.active) return; // not a sample key
      if (sample.bufferid !== bufferId) return; // not for this sample
      // load & play
      // const source = loadSource(buffer, speed);
      sources.current[key]?.start(audioContext.currentTime, samples[key].begin);
      keybounce[key] = true;
    };

    const keyup = ({ key }: KeyboardEvent) => {
      const sample = samples[key];
      if (!sample?.active) return;
      if (sample.bufferid !== bufferId) return;
      // stop
      sources.current[key]?.stop();
      // load next
      const source = loadSource(buffer, speed);
      sources.current[key] = source;
      keybounce[key] = false;
    };

    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);

    return () => {
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
    };
  }, [samples, buffer]);

  return (
    <div className="song px-8 my-40">
      <div>
        {wavebuffer ? (
          <Wave
            buffer={buffer}
            wave={wavebuffer}
            onclick={(t) => callback("seek", t)}
          />
        ) : (
          <p>Loading...</p>
        )}
      </div>

      <div className=" py-3 flex items-center justify-between">
        <h2 className=" text-lg">{bufferId}</h2>

        <label>
          Add key :
          <input
            type="text"
            className=" w-[100px] py-1 px-2  border border-black"
            onChange={({ target }) => {
              callback("addkey", {
                key: target.value,
                song: bufferId,
              });
              target.value = "";
            }}
            placeholder="add key"
          />
        </label>

        <button onClick={() => removeBuffer(bufferId)}>remove</button>
      </div>

      <div className=" my-8 px-8 flex flex-col gap-3 ">
        {Object.values(samples).map((sample) => {
          const { key, begin, active, bufferid: songid } = sample;
          if (!active) return null;
          if (bufferId !== songid) return null;
          const editing = edit === key;
          return (
            <div className=" flex gap-3" key={key}>
              <div
                className={
                  " w-[180px] h-36 p-3 flex flex-col gap-2 " +
                  (editing ? " bg-blue-300" : " bg-[var(--b2)]")
                }
              >
                <div className=" flex items-end justify-between">
                  <h2 className=" text-2xl">{key}</h2>
                  <p>{begin.toPrecision(4)}s</p>
                </div>
                <button
                  onClick={() => callback("editkey", key)}
                  className=" grow  w-full bg-black bg-opacity-10 hover:bg-opacity-15 "
                >
                  {editing ? "done" : "edit"}
                </button>
                <div className="x">
                  <button onClick={() => ({ type: "delete", val: key })}>
                    x
                  </button>
                </div>
              </div>
              <div className=" grow ">
                <SampleWave sample={sample} wave={wavebuffer} buffer={buffer} />
              </div>
            </div>
          );
        })}
      </div>
      <div></div>
    </div>
  );
}
