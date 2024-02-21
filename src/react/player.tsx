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

  const callbacks = (type: string, arg: any) => {
    if (type === "delete") {
      // rmv in state
      const _buffers = { ...buffers };
      delete _buffers[arg];
      setBuffers(_buffers);
      // rmv in local storage
      samplesDbRemove(arg);
    }
  };

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
          <Song key={name} name={name} buffer={buffer} callback={callbacks} />
        ))}
        {/* <button onClick={() => {}}>click</button> */}
      </main>
    </div>
  );
}

function Song({
  name,
  buffer,
  callback,
}: {
  name: string;
  buffer: AudioBuffer;
  callback: (type: string, val: any) => void;
}) {
  const [wavebuffer, setWavebuffer] = useState<number[] | null>(null);

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

  return (
    <div className="song px-8 my-20">
      <div className=" flex justify-between">
        <h2 className=" mb-3">{name}</h2>
        <button onClick={() => callback("delete", name)}>remove</button>
      </div>
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
        console.log(ev);
        reject("transaction error ");
      };

      const objectStore = transaction.objectStore(STORE_NAME);
      resolve(objectStore);
    };

    req.onerror = (ev) => {
      console.log(ev);
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
      console.log(ev);

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
      console.log(ev);
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
      console.log(ev);
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
