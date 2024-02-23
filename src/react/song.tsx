import { useEffect, useRef, useState } from "react";
import { useLocalStorageState, type SamplesT } from "./player";
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
  const [speed, setSpeed] = useLocalStorageState(`speed-${bufferId}`, "1.0");

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
      // play
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
      const s = parseFloat(speed);
      const source = loadSource(buffer, isNaN(s) ? 1.0 : s);
      sources.current[key] = source;
      keybounce[key] = false;
    };

    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);

    return () => {
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
    };
  }, [samples, buffer, speed]);

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
            className=" w-[100px] py-1 px-2  border border-[var(--b2)] bg-transparent  "
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

        {/* remove sample modal */}
        <button onClick={() => removeBuffer(bufferId)}>remove</button>
      </div>

      <div>
        <div>
          <label htmlFor="speed">Sample Speed :</label>
          <span>x {speed}</span>
        </div>
        <input
          id="speed"
          name="speed"
          type="range"
          min="0.5"
          max="2"
          step="0.02"
          className="w-full max-w-[400px]"
          value={speed}
          onChange={({ target }) => setSpeed(target.value)}
        />
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
                  " w-[180px] p-3 flex flex-col gap-2  bg-[var(--b2)]"
                  // + (editing ? " bg-blue-300" : " ")
                }
              >
                <div className=" flex items-end justify-between">
                  <h2 className=" text-3xl">{key}</h2>
                  <p>{begin.toPrecision(4)}s</p>
                </div>
                <button
                  onClick={() => callback("editkey", key)}
                  className={
                    " w-full py-1  " +
                    (editing
                      ? " bg-[#0ff] bg-opacity-50 "
                      : " bg-black bg-opacity-10 hover:bg-opacity-15")
                  }
                >
                  {editing ? "done" : "edit"}
                </button>
                <button
                  onClick={() => callback("copykey", key)}
                  className=" w-full py-1 bg-black bg-opacity-10 hover:bg-opacity-15 "
                >
                  copy
                </button>

                <div className="x">
                  <button
                    onClick={() => callback("delete", key)}
                    className=" px-2 py-1"
                  >
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
