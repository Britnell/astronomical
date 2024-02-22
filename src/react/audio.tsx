import { useEffect, useRef, useState, type MouseEventHandler } from "react";

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

const loadAudioBuffer = (uri: string) =>
  fetch(uri)
    .then((res) => res.arrayBuffer())
    .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
    .catch((e) => console.error(e));

const loadSource = (buffer: AudioBuffer | void, speed: number = 1.0) => {
  if (!buffer) return null;
  const t = 0;
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = speed;
  source.connect(audioContext.destination);

  return source;
};

const keybounce: { [id: string]: boolean } = {};

type SampleT = {
  key: string;
  begin: number;
  active: boolean;
};
type SamplesT = {
  [id: string]: SampleT;
};

let db: IDBDatabase;

const req = indexedDB.open("web-sampler", 1);
req.onsuccess = () => {
  db = req.result;
};

const dbWrite = (key: string, x: any) => {
  const tx = db.transaction(["files"], "readwrite");
  const files = tx.objectStore("files");
  files.put(x, key);
};

function storeFileInIndexedDB(blob: Blob, filename: string) {
  const openDBRequest = indexedDB.open("web-sampler", 1);
  const key = "samples-cache";

  openDBRequest.onerror = function (ev) {
    console.error("Error opening database:", ev.error);
  };

  openDBRequest.onupgradeneeded = function (ev) {
    const db = openDBRequest.result;
    console.log(" upgrade -> create");
    db.createObjectStore(key, {
      keyPath: "filename",
    });
  };

  openDBRequest.onsuccess = function (ev) {
    const db = openDBRequest.result;
    const transaction = db.transaction([key], "readwrite");

    transaction.onerror = function (ev) {
      console.error("Error adding file to database:", ev.error);
    };

    const objectStore = transaction.objectStore(key);

    console.log("upl", blob);

    // const blob = new Blob([arrayBuffer], { type: file.type });
    const addRequest = objectStore.add({ filename, fileData: blob });
    addRequest.onsuccess = function () {
      console.log('File "' + filename + '" successfully added to IndexedDB');
    };
  };
}
export default function Sound() {
  const [file, setfile] = useState("/sound1.mp3");
  const [buffer, setBuffer] = useState<AudioBuffer>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sources = useRef<{ [id: string]: AudioBufferSourceNode | null }>({});
  const [edit, setEdit] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1.0);
  const [pos, setpos] = useState<number | null>(null);
  const [modal, setModal] = useState<{ type: string; val: any } | null>(null);
  const [samples, setSamples] = useLocalStorageState<SamplesT>("samples", {
    g: { key: "g", begin: 0, active: true },
  });
  const modalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    loadAudioBuffer(file).then((buf) => buf && setBuffer(buf));
  }, [file]);

  useEffect(() => {
    const keydown = (ev: KeyboardEvent) => {
      const key = ev.key;

      // arrow keys
      if (key.includes("Arrow") && edit) {
        let x = 0;
        if (key === "ArrowUp") x = 0.01;
        if (key === "ArrowDown") x = -0.01;
        if (key === "ArrowLeft") x = -0.1;
        if (key === "ArrowRight") x = 0.1;
        const sample = samples[edit];
        setSamples((s: SamplesT) => ({
          ...s,
          [edit]: {
            ...sample,
            begin: limit(sample.begin + x, 0, buffer?.duration ?? 0),
          },
        }));
      }

      //   play sample
      if (keybounce[key]) return;
      if (ev.ctrlKey) return;
      if (samples[key]?.active) {
        const source = loadSource(buffer, speed);
        source?.start(audioContext.currentTime, samples[key].begin);
        sources.current[key] = source;
        keybounce[key] = true;
      }
    };
    const keyup = ({ key }: KeyboardEvent) => {
      const sample = samples[key];
      if (!sample?.active) return;
      keybounce[key] = false;
      sources.current[key]?.stop();
    };

    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);

    return () => {
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
    };
  }, [buffer, samples, edit, speed]);

  useEffect(() => {
    // draw audio wave
    if (!canvasRef.current) return;
    if (!buffer) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const audioData = buffer.getChannelData(0);
    canvasRef.current.width = window.innerWidth - 48;
    const LEN = buffer?.length;
    const W = canvasRef.current.width;
    const H = canvasRef.current.height;
    const chunks = LEN / W;

    ctx.clearRect(0, 0, W, H);
    let last = 0;
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgb(0 0 0)";
    ctx.beginPath();

    const findmax = (arr: Float32Array) => {
      let max = 0;
      arr.forEach((v) => {
        const x = Math.abs(v);
        if (x > max) max = x;
      });
      return max;
    };

    for (let x = 1; x < audioData.length; x++) {
      const to = Math.floor(chunks * x);
      const slice = audioData.slice(last, to);
      const max = findmax(slice);
      const y = H * max * 1.0;
      last = to + 1;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    // ctx.lineTo(W, H / 2);
    ctx.stroke();
  }, [buffer]);

  useEffect(() => {
    if (!modalRef.current) return;

    if (!modal) modalRef.current?.close();
    else modalRef.current?.showModal();
  }, [modal]);

  const canvasClick: MouseEventHandler<HTMLCanvasElement> = (ev) => {
    if (!edit) return;
    const cvs = ev.target as HTMLCanvasElement;
    const perc = ev.clientX / cvs.getBoundingClientRect().width;
    // setBegin(perc * (buffer?.duration ?? 1));
    const val = perc * (buffer?.duration ?? 0);

    setSamples((s: SamplesT) => ({
      ...s,
      [edit]: { key: edit, begin: val, active: true },
    }));
  };

  const addKey = (key: string) => {
    if (samples[key].active) return;

    setSamples((s: SamplesT) => ({
      ...s,
      [key]: {
        key,
        begin: 0,
        active: true,
      },
    }));
  };

  const removeSample = (key: string) => {
    if (!samples[key]) return;

    console.log("de ", key);
    setSamples((s: SamplesT) => ({
      ...s,
      [key]: {
        ...s[key],
        active: false,
      },
    }));
  };

  return (
    <div>
      <h2>AUDIO</h2>
      <p>{file}</p>
      <div>
        <canvas
          ref={canvasRef}
          className=" border border-gray-400"
          width="800"
          height="120"
          onClick={canvasClick}
        />
      </div>
      <div className=" my-8 px-8 grid grid-cols-[repeat(auto-fit,160px)] gap-3 ">
        {Object.values(samples as SamplesT).map(({ key, begin, active }) => {
          if (!active) return null;

          return (
            <div
              className={
                " p-3 aspect-square " +
                (edit === key ? " bg-blue-300" : " bg-gray-300")
              }
              key={key}
            >
              <h2 className=" text-2xl">{key}</h2>
              <p>{begin.toPrecision(3)}s</p>
              <div className="x">
                <button
                  onClick={() => setEdit(edit === key ? null : key)}
                  className=" px-2 py-1 "
                >
                  edit
                </button>
              </div>
              <div className="x">
                <button onClick={() => setModal({ type: "delete", val: key })}>
                  x
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <dialog
        ref={modalRef}
        onClick={(ev) => {
          const isonModal = ev.target === ev.currentTarget;
          if (!isonModal) return;
          setModal(null);
        }}
      >
        {modal?.type === "delete" && (
          <div className=" p-4 ">
            <h2>DELETE</h2>
            <p>Delete this sample?</p>
            <div className=" grid grid-cols-2 gap-3 ">
              <button className=" bg-gray-300" onClick={() => setModal(null)}>
                cancel
              </button>
              <button
                className=" bg-blue-300"
                onClick={() => {
                  removeSample(modal.val);
                  setModal(null);
                }}
              >
                Yep
              </button>
            </div>
          </div>
        )}
      </dialog>
      <div>
        <label htmlFor="">Speed {speed}x</label>
        <div className="x">
          <input
            type="range"
            className=" w-[300px] "
            value={speed}
            onInput={(ev) =>
              setSpeed(parseFloat((ev.target as HTMLInputElement).value))
            }
            min="0.5"
            max="2"
            step="0.01"
          />
        </div>
      </div>
      <div>
        <label>
          Add key :
          <input
            type="text"
            className=" w-[100px]  h-14  border border-black"
            onChange={({ target }) => {
              addKey(target.value);
              target.value = "";
            }}
            placeholder="add key"
          />
        </label>
      </div>
      <p>Edit : {edit}</p>
      <p></p>
    </div>
  );
}

const limit = (x: number, min: number, max: number) => {
  if (x < min) return min;
  if (x > max) return max;
  return x;
};

function useLocalStorageState<T>(key: string, initial: object) {
  const [state, setState] = useState<T>(() => {
    try {
      const str = localStorage.getItem(key);
      if (!str) return initial;
      return JSON.parse(str);
    } catch (e) {
      return initial;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [state]);

  return [state, setState] as const;
}
