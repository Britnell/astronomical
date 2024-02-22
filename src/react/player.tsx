import {
  useEffect,
  useRef,
  useState,
  type MouseEventHandler,
  useLayoutEffect,
} from "react";

const keybounce: { [id: string]: boolean } = {};

export default function Loader() {
  const [buffers, setBuffers] = useState<BufferState>({});

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
    // load files from db
    const load = async () => {
      const blobs = await samplesDbReadAll().catch((e) => {
        console.error(e);
        return;
      });
      if (!blobs) return;

      const srcs: BufferState = {};
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

  const removeBuffer = (bufferid: string) => {
    const _buffers = { ...buffers };
    delete _buffers[bufferid];
    setBuffers(_buffers);
    // rmv in local storage
    samplesDbRemove(bufferid);
  };

  return (
    <div>
      <header>
        <h1>Sampler</h1>
        <h2>Add source files</h2>
        <div className=" grid grid-cols-2 gap-10">
          <label className=" flex  gap-6">
            <span className=" ">load local file :</span>
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
            <span className="x">load from url :</span>
            <input type="text" name="url" className=" border border-black" />
          </label>
        </div>
      </header>
      <Player buffers={buffers} removeBuffer={removeBuffer} />
    </div>
  );
}

function Player({
  buffers,
  removeBuffer,
}: {
  buffers: BufferState;
  removeBuffer: (id: string) => void;
}) {
  const [edit, setEdit] = useState("");
  const [samples, setSamples] = useLocalStorageState<SamplesT>(
    "sample-keys",
    {}
  );

  useEffect(() => {
    const keypress = (ev: KeyboardEvent) => {
      const key = ev.key;
      if (!key.startsWith("Arrow")) return;
      ev.preventDefault();

      const sample = samples[edit];
      if (!sample?.active) return;

      const fine = ev.shiftKey ? 0.5 : 1;
      // const ctrl = ev.ctrlKey;
      const keyVals: { [k: string]: number } = {
        ArrowUp: 0.01,
        ArrowDown: -0.01,
        ArrowLeft: -0.1,
        ArrowRight: 0.1,
      };
      if (!keyVals[key]) return;
      const x = keyVals[key] * fine;
      setSamples((s) => ({
        ...s,
        [edit]: {
          ...sample,
          begin: limit(sample.begin + x, 0, buffers[sample.bufferid].duration),
        },
      }));
    };
    window.addEventListener("keydown", keypress);
    return () => window.removeEventListener("keydown", keypress);
  }, [samples, edit]);

  const callbacks = (type: string, arg: any) => {
    switch (type) {
      case "addkey":
        const { key, song } = arg;
        // TODO check if key assigned
        if (samples[key]?.active) return;
        setSamples((s) => ({
          ...s,
          [key]: {
            key,
            bufferid: song,
            begin: 0,
            active: true,
          },
        }));
        break;
      case "editkey":
        if (!samples[arg]?.active) return;
        if (edit === arg) setEdit("");
        else setEdit(arg);
        break;
      default:
        console.log("=>", type, arg);
    }
  };

  const removeSample = (id: string) => {
    // remove keys
    const _samples = { ...samples };
    Object.values(_samples).forEach((sample) => {
      if (sample.bufferid === id) sample.active = false;
    });
    setSamples(_samples);
    // rmv buffer
    removeBuffer(id);
  };

  return (
    <main>
      {Object.entries(buffers).map(([name, buffer]) => (
        <Song
          key={name}
          bufferId={name}
          edit={edit}
          buffer={buffer}
          callback={callbacks}
          samples={samples}
          removeBuffer={removeSample}
        />
      ))}
      {/* <button onClick={() => {}}>click</button> */}
    </main>
  );
}

function Song({
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
    const chunkSize = buffer.sampleRate / 100;
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
    <div className="song px-8 my-20">
      <div>
        {wavebuffer ? (
          <Wave
            buffer={buffer}
            wave={wavebuffer}
            onclick={(t) => {
              console.log(" seek ", t);
            }}
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

      <div className=" my-8 px-8 grid grid-cols-[repeat(auto-fit,160px)] gap-3 ">
        {Object.values(samples).map(
          ({ key, begin, active, bufferid: songid }) => {
            if (!active) return null;
            if (bufferId !== songid) return null;
            const editing = edit === key;
            return (
              <div
                className={
                  " p-3 aspect-square " +
                  (editing ? " bg-blue-300" : " bg-gray-300")
                }
                key={key}
              >
                <h2 className=" text-2xl">{key}</h2>
                <p>{begin.toPrecision(4)}s</p>
                <div className="x">
                  <button
                    onClick={() => callback("editkey", key)}
                    className=" px-2 py-4 w-full bg-black bg-opacity-10 hover:bg-opacity-15 "
                  >
                    {editing ? "done" : "edit"}
                  </button>
                </div>
                <div className="x">
                  <button onClick={() => ({ type: "delete", val: key })}>
                    x
                  </button>
                </div>
              </div>
            );
          }
        )}
      </div>
      <div></div>
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

function Wave({
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
      const y = H * max * 1.0;
      last = to + 1;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
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

// ================================

const DB_NAME = "web-sampler";
const STORE_NAME = "samples-cache";

async function getDbStore(): Promise<IDBObjectStore | string> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);

    req.onupgradeneeded = () => {
      const db = req.result;
      db.createObjectStore(STORE_NAME);
    };

    req.onsuccess = async () => {
      const db = req.result;
      const transaction = db.transaction([STORE_NAME], "readwrite");
      transaction.onerror = (ev) => {
        console.error(ev);
        reject("transaction error ");
      };

      const objectStore = transaction.objectStore(STORE_NAME);
      resolve(objectStore);
    };

    req.onerror = (ev) => {
      console.error(ev);
      reject("db req error ");
    };
  });
}

function samplesDbWrite(blob: Blob, filename: string) {
  return new Promise(async (resolve, reject) => {
    const objectStore = await getDbStore();
    if (typeof objectStore === "string") {
      reject(objectStore);
      return;
    }
    const req = objectStore.put(blob, filename);
    req.onsuccess = () => {
      resolve({ success: true });
    };
    req.onerror = (ev) => {
      console.error(ev);
      reject("req error ");
    };
  });
}

function samplesDbRemove(filename: string) {
  return new Promise(async (resolve, reject) => {
    const objectStore = await getDbStore();
    if (typeof objectStore === "string") {
      reject(objectStore);
      return;
    }
    const req = objectStore.delete(filename);
    req.onsuccess = () => {
      resolve({ success: true });
    };
    req.onerror = (ev) => {
      console.error(ev);
      reject("req error ");
    };
  });
}

function samplesDbReadAll(): Promise<{ [key: string]: Blob }> {
  return new Promise(async (resolve, reject) => {
    const objectStore = await getDbStore();
    if (typeof objectStore === "string") {
      reject(objectStore);
      return;
    }

    const req = objectStore.openCursor(); // Use a cursor for large datasets

    req.onerror = (ev) => {
      console.error(ev);
      reject(" cursor error ");
    };

    const samples: { [key: string]: any } = {};

    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        if (typeof cursor.key === "string") {
          samples[cursor.key] = cursor.value;
        }
        cursor.continue();
        return;
      }
      resolve(samples);
    };
  });
}

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

const loadSource = (buffer: AudioBuffer | void, speed: number = 1.0) => {
  if (!buffer) return null;
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = speed;
  source.connect(audioContext.destination);
  return source;
};

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

type SampleT = {
  key: string;
  begin: number;
  active: boolean;
  bufferid: string;
};

type SamplesT = {
  [id: string]: {
    key: string;
    begin: number;
    active: boolean;
    bufferid: string;
  };
};

type BufferState = { [name: string]: AudioBuffer };

const limit = (x: number, min: number, max: number) => {
  if (x < min) return min;
  if (x > max) return max;
  return x;
};
