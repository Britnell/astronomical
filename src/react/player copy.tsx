import {
  useEffect,
  useRef,
  useState,
  type MouseEventHandler,
  useLayoutEffect,
} from "react";

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// https://gemini.google.com/app/30a568fc0ff64024 offload audio decode into worker
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

const DB_NAME = "web-sampler";
const STORE_NAME = "samples-cache";

async function samplesDbWrite(blob: Blob, filename: string) {
  return new Promise((resolve, reject) => {
    const openDBRequest = indexedDB.open(DB_NAME, 1);
    openDBRequest.onerror = (ev) => {
      reject({ error: "opening db ", ev });
    };

    openDBRequest.onupgradeneeded = function (ev) {
      const db = openDBRequest.result;
      console.log("upgrade");

      db.createObjectStore(STORE_NAME);
    };

    openDBRequest.onsuccess = () => {
      const db = openDBRequest.result;
      const transaction = db.transaction([STORE_NAME], "readwrite");

      transaction.onerror = (ev) => {
        reject({ error: "transaction error ", ev });
      };

      const objectStore = transaction.objectStore(STORE_NAME);

      const addRequest = objectStore.put(blob, filename);
      addRequest.onsuccess = () => {
        resolve({ success: true });
      };
      addRequest.onerror = (ev) => {
        reject({ error: "req error ", ev });
      };
    };
  });
}

function samplesDbReadAll(): Promise<{ [key: string]: Blob }> {
  return new Promise((resolve, reject) => {
    const openReq = indexedDB.open(DB_NAME, 1);
    openReq.onsuccess = async () => {
      const db = openReq.result;
      const transaction = db.transaction([STORE_NAME], "readonly");
      const objectStore = transaction.objectStore(STORE_NAME);

      const cursorReq = objectStore.openCursor(); // Use a cursor for large datasets

      cursorReq.onerror = (ev) => {
        reject(" cursor error ", ev);
      };

      const samples: { [key: string]: any } = {};

      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (cursor) {
          if (typeof cursor.key === "string")
            samples[cursor.key] = cursor.value;
          cursor.continue();
          return;
        }
        resolve(samples);
      };
    };
  });
}

export default function Loader() {
  const [buffers, setBuffers] = useState<{ [name: string]: AudioBuffer }>({});

  const readFile = (file: File | undefined) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      // Load buffer
      const arrayBuffer = ev.target?.result as ArrayBuffer;
      const buffer = await audioContext.decodeAudioData(arrayBuffer);
      setBuffers((s) => ({ ...s, [file.name]: buffer }));

      // store in db
      const blob = new Blob([file], { type: file.type });
      await samplesDbWrite(blob, file.name).catch((err) => console.error(err));
    };
    reader.readAsArrayBuffer(file);
  };

  useEffect(() => {
    const load = async () => {
      const blobs = await samplesDbReadAll().catch((e) => {
        console.log(e);
        return;
      });
      if (!blobs) return;

      const srcs: { [k: string]: AudioBuffer } = {};
      await Promise.all(
        Object.entries(blobs).map(async ([name, blob]) => {
          // load array from blob
          const arrayBuffer = await blob.arrayBuffer();
          const buffer = await audioContext.decodeAudioData(arrayBuffer);
          srcs[name] = buffer;
        })
      );
      setBuffers(srcs);
    };
    load();
  }, []);

  console.log("buffers", buffers);

  return (
    <div>
      <header>
        <h1>Sampler</h1>
      </header>
      <section>
        <h2>Add source files</h2>
        <label className=" flex  gap-6">
          <span className=" ">Use local file :</span>
          <input
            type="file"
            accept="audio/mp3"
            onChange={(ev) => {
              const ip = ev.target as HTMLInputElement;
              readFile(ip.files?.[0]);
            }}
          />
        </label>
        <label>
          <span className="x">Use url :</span>
          <input type="text" name="url" />
        </label>
      </section>
      <main>
        {Object.entries(buffers).map(([name, buffer]) => (
          <Song key={name} name={name} buffer={buffer} />
        ))}
        {/* <button onClick={() => {}}>click</button> */}
      </main>
    </div>
  );
}

function Song({ name, buffer }: { name: string; buffer: AudioBuffer }) {
  const [wavebuffer, setWavebuffer] = useState<number[] | null>(null);

  useEffect(() => {
    // calc wavebuffer for viz
    const audioData = buffer.getChannelData(0);
    const chunkSize = buffer.sampleRate / 100;
    const chunks = audioData.length / chunkSize;
    let last = 0;

    const wave = [];
    for (let x = 1; x < chunks; x++) {
      const to = Math.floor(chunks * x);
      const slice = audioData.slice(last, to);
      last = to + 1;
      const max = findmax(slice);
      wave.push(max);
    }
    setWavebuffer(wave);
  }, [buffer]);

  return (
    <div className="song">
      <h2>{name}</h2>
      <div>
        {wavebuffer ? (
          <Wave buffer={buffer} wave={wavebuffer} />
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </div>
  );
}

const findmax = (arr: Float32Array | number[]) => {
  let max = 0;
  arr.forEach((v) => {
    const x = Math.abs(v);
    if (x > max) max = x;
  });
  return max;
};

function Wave({ buffer, wave }: { buffer: AudioBuffer; wave: number[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const canvasClick: MouseEventHandler<HTMLCanvasElement> = (ev) => {
    // if (!edit) return;
    const cvs = ev.target as HTMLCanvasElement;
    const perc = ev.clientX / cvs.getBoundingClientRect().width;
    // const val = perc * (buffer?.duration ?? 0);
  };

  useLayoutEffect(() => {
    if (!canvasRef.current) return;
    canvasRef.current.width = window.innerWidth - 48;
  }, []);

  useEffect(() => {
    // draw audio wave
    if (!canvasRef.current) return;
    if (!wave) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const LEN = wave?.length;
    const W = canvasRef.current.width;
    const H = canvasRef.current.height;
    const chunks = LEN / W;

    ctx.clearRect(0, 0, W, H);
    let last = 0;
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgb(0 0 0)";
    ctx.beginPath();

    for (let x = 1; x < W; x++) {
      const to = Math.floor(chunks * x);
      const slice = wave.slice(last, to);

      const max = findmax(slice);
      const y = H * max * 1.0;
      last = to + 1;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    // ctx.lineTo(W, H / 2);
    ctx.stroke();
  }, [wave]);

  return (
    <canvas
      ref={canvasRef}
      className=" border border-gray-400"
      width="800"
      height="120"
      onClick={canvasClick}
    />
  );
}

function Sound() {
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
