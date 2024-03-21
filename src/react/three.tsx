import { useState, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Mesh } from "three";
import { CameraControls, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// https://docs.pmnd.rs/react-three-fiber/advanced/scaling-performance
// https://threejs.org/docs/#api/en/objects/InstancedMesh

// https://github.com/onion2k/r3f-by-example/tree/develop/examples/geometry/instanced-cubes
// https://codesandbox.io/s/instances-forked-cnsjh3?file=%2Fsrc%2FApp.js

function App() {
  const [page, setPage] = useState("hello");

  return (
    <>
      <Canvas
        style={{ position: "absolute", zIndex: 0 }}
        camera={{ position: [6, 4, 0] }}
        // camera={{ position: [1, 1, 0] }}
      >
        <Wave />
        {/* <Shapes /> */}
        {/* <Breath /> */}
        {/* <Ray /> */}
        <OrbitControls />
        <CameraControls />
      </Canvas>
      <Filler />
    </>
  );
}
function Wave() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight color="white" intensity={0.6} position={[3, 8, 5]} />
      <Boxes />
    </>
  );
}

const Shapes = () => {
  const box = useRef<Mesh>(null);
  const plane = useRef<Mesh>(null);

  useFrame(() => {
    if (!box.current) return;
    box.current.rotation.x += 0.01;
    box.current.rotation.y += 0.01;

    if (!plane.current) return;
    plane.current.rotation.x += 0.01;
    plane.current.rotation.y += 0.01;
  });

  return (
    <>
      <mesh ref={box} position={[2, 0, 0]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="blue" />
      </mesh>
      <mesh position={[-2, 0, 0]}>
        <sphereGeometry args={[0.8, 32, 16]} />
        <meshStandardMaterial color="blue" />
      </mesh>
      <mesh ref={plane} rotation={[1, 1, 0]}>
        <meshBasicMaterial color="blue" />
        {/* <meshNormalMaterial /> */}
        <planeGeometry args={[1, 1, 1]} />
      </mesh>
    </>
  );
};

const start = Math.random();

function Boxes({ N = 1000, temp = new THREE.Object3D() }) {
  const ref = useRef<THREE.InstancedMesh>(null);

  useFrame(({ clock }) => {
    // Set positions
    let a = 0;
    for (let i = 0; i < N; i++) {
      const x = Math.cos(a) * (i * 0.01);
      const y = Math.sin(a) * (i * 0.01);
      const z = Math.sin(clock.elapsedTime + i * 0.016) * 0.6;
      a += Math.PI * ((start + clock.elapsedTime * 0.00003) % 1);
      // a += Math.PI * 1.21091283081203;
      temp.position.set(x, z, y);
      const f = -a + Math.PI * 1;
      const w = Math.sin(clock.elapsedTime + i * 0.016 - Math.PI * 0.3) * 0.3;
      temp.rotation.set(w, f, w);
      temp.updateMatrix();
      ref.current?.setMatrixAt(i, temp.matrix);
    }
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[null as any, null as any, N]}>
      <boxGeometry args={[0.2, 0.05, 0.05]} />
      <meshPhongMaterial color="red" />
      {/* <meshBasicMaterial color="hotpink" /> */}
      {/* <meshStandardMaterial color="blue" /> */}
      {/* <meshNormalMaterial /> */}
    </instancedMesh>
  );
}

function Ray({ N = 30, temp = new THREE.Object3D() }) {
  const ref = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    for (let a = 0; a < N; a++) {
      const ang = (a / N) * Math.PI * 2;
      const x = Math.cos(ang);
      const y = Math.sin(ang);

      temp.position.set(x, 0, y);

      temp.rotation.set(0, -ang, 0);

      temp.updateMatrix();
      ref.current?.setMatrixAt(a, temp.matrix);
    }
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight color="white" intensity={0.99} position={[3, 8, 5]} />
      <instancedMesh
        ref={ref}
        args={[null as any, null as any, N]}
        position={[0, -2, 0]}
      >
        <boxGeometry args={[10, 0.01, 0.01]} />
        <meshStandardMaterial color="blue" />
      </instancedMesh>
    </>
  );
}

const Filler = () => (
  <>
    <h1>Fibrous</h1>
    {Array(1)
      .fill(0)
      .map((x) => (
        <p>
          Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sint nulla
          ab vel illo laborum hic doloremque, facere, autem odio corporis atque.
          Provident quae quos vel, repellat soluta aliquam aliquid. Quod.
        </p>
      ))}
  </>
);

function Breath({}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const period = clock.elapsedTime % 11;
    const b = period < 5.5 ? period : 11 - period;

    // ref.current?.s
    // console.log(b);
  });
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight color="white" intensity={0.99} position={[3, 8, 5]} />

      <mesh ref={ref}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color="blue" />
        {/* <meshNormalMaterial /> */}
      </mesh>
    </>
  );
}

export default App;
