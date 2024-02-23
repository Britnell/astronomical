import { useEffect, useRef, useState, type ReactNode } from "react";
import type { BufferState } from "./loader";
import Song from "./song";

export default function Player({
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
  const [modal, setModal] = useState<{ type: string; val: string } | null>({
    type: "",
    val: "",
  });

  useEffect(() => {
    const keypress = (ev: KeyboardEvent) => {
      const key = ev.key;
      if (!edit) return;
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
      case "seek":
        // seek sample to pos
        break;
      case "delete":
        //
        setModal({
          type: "deletekey",
          val: arg,
        });
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

  const removeKey = (key: string) => {
    const smpl = samples[key];
    setSamples((s) => ({ ...s, [key]: { ...smpl, active: false } }));
  };

  const closeModal = () => setModal(null);

  return (
    <main>
      <Modal isOpen={modal?.type === "deletekey"}>
        {
          <div className="asd">
            <p>Remove sample key {modal?.val}</p>
            <div className="flex gap-2">
              <button className=" bg-gray-300" onClick={closeModal}>
                cancel
              </button>
              <button
                className=" bg-gray-300"
                onClick={() => {
                  modal?.val && removeKey(modal?.val);
                  closeModal();
                }}
              >
                Remove
              </button>
            </div>
          </div>
        }
      </Modal>
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

const Modal = ({
  children,
  isOpen,
}: {
  children: ReactNode;
  isOpen: boolean;
}) => {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (isOpen) ref.current.showModal();
    else ref.current.close();
  }, [isOpen]);
  return <dialog ref={ref}>{children}</dialog>;
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

const limit = (x: number, min: number, max: number) => {
  if (x < min) return min;
  if (x > max) return max;
  return x;
};

export type SamplesT = {
  [id: string]: SampleT;
};

export type SampleT = {
  key: string;
  begin: number;
  active: boolean;
  bufferid: string;
};
