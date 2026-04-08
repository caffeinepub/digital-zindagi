import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { createDZLogoTexture, createTextTexture } from "../utils/faceTexture";

/** Cracked concrete ground plane */
export function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color="#1a1a16" roughness={0.95} metalness={0.05} />
    </mesh>
  );
}

/** Scattered debris chunks */
export function Debris() {
  const pieces = useMemo(() => {
    const arr: {
      id: string;
      pos: [number, number, number];
      rot: [number, number, number];
      scale: [number, number, number];
    }[] = [];
    const positions: [number, number, number][] = [
      [-8, 0.2, -5],
      [6, 0.15, -3],
      [-4, 0.25, 3],
      [10, 0.1, 1],
      [-12, 0.3, -2],
      [3, 0.2, -8],
      [-6, 0.15, 6],
      [9, 0.2, 5],
      [-3, 0.1, -12],
      [14, 0.25, -6],
      [-9, 0.3, 8],
      [2, 0.2, 10],
    ];
    for (let i = 0; i < positions.length; i++) {
      const p = positions[i];
      arr.push({
        id: `debris-${i}`,
        pos: p,
        rot: [
          Math.random() * 0.5,
          Math.random() * Math.PI,
          Math.random() * 0.3,
        ],
        scale: [
          0.5 + Math.random() * 1.5,
          0.2 + Math.random() * 0.4,
          0.4 + Math.random() * 1.2,
        ],
      });
    }
    return arr;
  }, []);

  return (
    <group>
      {pieces.map((p) => (
        <mesh
          key={p.id}
          position={p.pos}
          rotation={p.rot}
          receiveShadow
          castShadow
        >
          <boxGeometry args={p.scale} />
          <meshStandardMaterial color="#2a2a25" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/** Human skeletons scattered on ground */
export function Skeletons() {
  const positions: [number, number, number][] = [
    [-7, 0, -9],
    [5, 0, -11],
    [-13, 0, 3],
    [11, 0, -4],
    [-4, 0, 11],
    [8, 0, 8],
  ];
  const rotations = [0.3, -0.8, 1.2, -0.4, 0.6, -1.1];

  const skeletonData = positions.map((pos, i) => ({
    pos,
    rotY: rotations[i],
    id: `skel-${i}`,
  }));
  return (
    <group>
      {skeletonData.map((s) => (
        <SkeletonMesh key={s.id} position={s.pos} rotationY={s.rotY} />
      ))}
    </group>
  );
}

function SkeletonMesh({
  position,
  rotationY,
}: { position: [number, number, number]; rotationY: number }) {
  const mat = <meshStandardMaterial color="#d4c9a8" roughness={0.8} />;
  return (
    <group position={position} rotation={[0, rotationY, 0.15]}>
      {/* Skull */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <sphereGeometry args={[0.12, 8, 8]} />
        {mat}
      </mesh>
      {/* Ribcage */}
      <mesh position={[0, -0.05, 0]} castShadow>
        <boxGeometry args={[0.24, 0.3, 0.12]} />
        {mat}
      </mesh>
      {/* Arms */}
      <mesh position={[-0.25, -0.05, 0]} rotation={[0, 0, 0.4]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.35, 6]} />
        {mat}
      </mesh>
      <mesh position={[0.25, -0.05, 0]} rotation={[0, 0, -0.4]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.35, 6]} />
        {mat}
      </mesh>
      {/* Legs */}
      <mesh position={[-0.1, -0.4, 0]} rotation={[0.1, 0, 0.1]} castShadow>
        <cylinderGeometry args={[0.035, 0.03, 0.4, 6]} />
        {mat}
      </mesh>
      <mesh position={[0.1, -0.4, 0]} rotation={[0.1, 0, -0.1]} castShadow>
        <cylinderGeometry args={[0.035, 0.03, 0.4, 6]} />
        {mat}
      </mesh>
    </group>
  );
}

/** Burning vehicle wrecks with animated fire lights */
export function BurningVehicles() {
  return (
    <group>
      <BurningVehicle position={[-14, 0, -6]} rotationY={0.4} />
      <BurningVehicle position={[12, 0, -8]} rotationY={-0.7} />
      <BurningVehicle position={[-5, 0, -16]} rotationY={1.1} />
    </group>
  );
}

function BurningVehicle({
  position,
  rotationY,
}: { position: [number, number, number]; rotationY: number }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const t = useRef(Math.random() * Math.PI * 2);

  useFrame((_, delta) => {
    t.current += delta * 8;
    if (lightRef.current) {
      lightRef.current.intensity =
        2.5 + Math.sin(t.current) * 1.2 + Math.sin(t.current * 2.3) * 0.5;
    }
  });

  return (
    <group position={position} rotation={[0, rotationY, 0.08]}>
      {/* Chassis */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[3.5, 0.8, 1.8]} />
        <meshStandardMaterial color="#1a1208" roughness={0.9} metalness={0.4} />
      </mesh>
      {/* Cabin */}
      <mesh position={[0.2, 1.1, 0]} castShadow>
        <boxGeometry args={[1.8, 0.7, 1.6]} />
        <meshStandardMaterial color="#0d0a04" roughness={0.9} metalness={0.3} />
      </mesh>
      {/* Wheels (flat on ground) */}
      {([-1.2, 1.2] as number[]).map((x) =>
        ([-0.95, 0.95] as number[]).map((z) => (
          <mesh
            key={`${x}-${z}`}
            position={[x, 0.3, z]}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
          >
            <cylinderGeometry args={[0.3, 0.3, 0.2, 8]} />
            <meshStandardMaterial color="#111" roughness={0.95} />
          </mesh>
        )),
      )}
      {/* Fire light */}
      <pointLight
        ref={lightRef}
        position={[0, 1.5, 0]}
        color="#ff6020"
        intensity={3}
        distance={12}
        castShadow
      />
      {/* Fire particles (simple emissive spheres) */}
      <FireParticles />
    </group>
  );
}

const FIRE_PARTICLE_IDS = [
  "fp0",
  "fp1",
  "fp2",
  "fp3",
  "fp4",
  "fp5",
  "fp6",
  "fp7",
];

function FireParticles() {
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const times = useRef(
    Array.from({ length: 8 }, () => Math.random() * Math.PI * 2),
  );

  useFrame((_, delta) => {
    times.current = times.current.map((t, i) => {
      const next = t + delta * (2 + i * 0.3);
      const m = meshes.current[i];
      if (m) {
        m.position.y = 1.2 + Math.sin(next) * 0.4 + i * 0.15;
        m.position.x = Math.cos(next * 0.7 + i) * 0.3;
        m.position.z = Math.sin(next * 0.5 + i) * 0.2;
        const scale = 0.06 + Math.abs(Math.sin(next)) * 0.08;
        m.scale.setScalar(scale);
        if (m.material instanceof THREE.MeshStandardMaterial) {
          m.material.emissiveIntensity = 2 + Math.sin(next * 3) * 1;
        }
      }
      return next;
    });
  });

  return (
    <group>
      {FIRE_PARTICLE_IDS.map((id, i) => (
        <mesh
          key={id}
          ref={(el) => {
            meshes.current[i] = el;
          }}
          position={[0, 1.2 + i * 0.1, 0]}
        >
          <sphereGeometry args={[0.1, 4, 4]} />
          <meshStandardMaterial
            color="#ff4400"
            emissive="#ff6600"
            emissiveIntensity={3}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Arena walls — back building facade with DZ logo */
export function BuildingWall() {
  const logoTexture = useMemo(() => createDZLogoTexture(), []);
  const hindiTexture = useMemo(
    () =>
      createTextTexture("डिजिटल ज़िंदगी स्टोर", {
        width: 768,
        height: 160,
        bgColor: "rgba(5,15,8,0.98)",
        textColor: "#f0c040",
        fontSize: 64,
      }),
    [],
  );

  return (
    <group>
      {/* Main back wall */}
      <mesh position={[0, 8, -22]} receiveShadow>
        <boxGeometry args={[50, 16, 1]} />
        <meshStandardMaterial color="#0d1008" roughness={0.95} />
      </mesh>
      {/* Side walls */}
      <mesh position={[-22, 8, -5]} receiveShadow>
        <boxGeometry args={[1, 16, 35]} />
        <meshStandardMaterial color="#0a0d08" roughness={0.95} />
      </mesh>
      <mesh position={[22, 8, -5]} receiveShadow>
        <boxGeometry args={[1, 16, 35]} />
        <meshStandardMaterial color="#0a0d08" roughness={0.95} />
      </mesh>
      {/* DZ Logo billboard */}
      <mesh position={[0, 10, -21.4]}>
        <planeGeometry args={[12, 6]} />
        <meshStandardMaterial
          map={logoTexture}
          emissiveMap={logoTexture}
          emissive="#ffffff"
          emissiveIntensity={0.8}
          roughness={0.3}
        />
      </mesh>
      {/* DZ Logo glow light */}
      <pointLight
        position={[0, 10, -20]}
        color="#00ff88"
        intensity={2}
        distance={15}
      />
      <pointLight
        position={[-2, 9, -20]}
        color="#ff6600"
        intensity={1.5}
        distance={10}
      />
      {/* Hindi signboard */}
      <mesh position={[0, 5.5, -21.4]}>
        <planeGeometry args={[9, 2]} />
        <meshStandardMaterial
          map={hindiTexture}
          emissiveMap={hindiTexture}
          emissive="#ffffff"
          emissiveIntensity={0.6}
          roughness={0.4}
        />
      </mesh>
      {/* Building damage cracks via boxes */}
      <mesh position={[-8, 6, -21.5]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.15, 4, 0.1]} />
        <meshStandardMaterial color="#050604" roughness={1} />
      </mesh>
      <mesh position={[6, 9, -21.5]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[0.1, 3, 0.1]} />
        <meshStandardMaterial color="#050604" roughness={1} />
      </mesh>
    </group>
  );
}

/** Scene lighting */
export function SceneLighting() {
  const fireRef1 = useRef<THREE.PointLight>(null);
  const fireRef2 = useRef<THREE.PointLight>(null);
  const t = useRef(0);

  useFrame((_, delta) => {
    t.current += delta * 5;
    if (fireRef1.current) {
      fireRef1.current.intensity = 1.5 + Math.sin(t.current * 1.3) * 0.8;
    }
    if (fireRef2.current) {
      fireRef2.current.intensity = 1.2 + Math.sin(t.current * 0.9 + 1.5) * 0.7;
    }
  });

  return (
    <>
      <ambientLight intensity={0.08} color="#0a2010" />
      <directionalLight
        position={[5, 15, 8]}
        intensity={0.4}
        color="#203818"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight
        ref={fireRef1}
        position={[-14, 3, -6]}
        color="#ff5010"
        intensity={2}
        distance={18}
      />
      <pointLight
        ref={fireRef2}
        position={[12, 3, -8]}
        color="#ff4808"
        intensity={2}
        distance={18}
      />
      <pointLight
        position={[0, 2, 2]}
        color="#102808"
        intensity={0.8}
        distance={20}
      />
      <fog attach="fog" args={["#020503", 15, 45]} />
    </>
  );
}
