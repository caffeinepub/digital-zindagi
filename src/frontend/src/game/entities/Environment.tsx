import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { createDZLogoTexture, createTextTexture } from "../utils/faceTexture";

// ─── Ground ─────────────────────────────────────────────────────────────────

export function Ground() {
  const scorch = useMemo(() => {
    const arr: { pos: [number, number, number]; rot: number; r: number }[] = [];
    const positions: [number, number, number][] = [
      [-6, 0.01, -4],
      [8, 0.01, 2],
      [-12, 0.01, 6],
      [4, 0.01, -10],
      [14, 0.01, -3],
      [-3, 0.01, 9],
      [0, 0.01, 0],
      [-9, 0.01, -8],
    ];
    for (const pos of positions) {
      arr.push({
        pos,
        rot: Math.random() * Math.PI,
        r: 1.2 + Math.random() * 2,
      });
    }
    return arr;
  }, []);

  return (
    <group>
      {/* Base concrete */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#0d0a05" roughness={0.95} metalness={0} />
      </mesh>
      {/* Scorch marks */}
      {scorch.map((s) => (
        <mesh
          key={`scorch-${s.pos[0]}-${s.pos[2]}`}
          position={s.pos}
          rotation={[-Math.PI / 2, s.rot, 0]}
        >
          <circleGeometry args={[s.r, 12]} />
          <meshBasicMaterial color="#0a0808" transparent opacity={0.75} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Debris ──────────────────────────────────────────────────────────────────

export function Debris() {
  const pieces = useMemo(() => {
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
      [0, 0.2, -14],
      [-16, 0.15, 4],
      [16, 0.2, -10],
    ];
    return positions.map((pos, i) => ({
      id: `debris-${i}`,
      pos,
      rot: [
        Math.random() * 0.5,
        Math.random() * Math.PI,
        Math.random() * 0.3,
      ] as [number, number, number],
      scale: [
        0.4 + Math.random() * 1.8,
        0.15 + Math.random() * 0.5,
        0.3 + Math.random() * 1.4,
      ] as [number, number, number],
    }));
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
          <meshStandardMaterial color="#222220" roughness={0.9} />
        </mesh>
      ))}
      {/* Pipe debris */}
      {[
        { id: "pa", x: -10, idx: 0 },
        { id: "pb", x: 7, idx: 1 },
        { id: "pc", x: -15, idx: 2 },
        { id: "pd", x: 13, idx: 3 },
      ].map(({ id, x, idx }) => (
        <mesh
          key={id}
          position={[x, 0.15, -7 + idx * 3]}
          rotation={[0, idx * 0.7, 0.15]}
        >
          <cylinderGeometry args={[0.12, 0.1, 2.5, 8]} />
          <meshStandardMaterial
            color="#1a1814"
            roughness={0.85}
            metalness={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── HD Skeletons ────────────────────────────────────────────────────────────

export function Skeletons() {
  const data = useMemo(() => {
    const positions: [number, number, number][] = [
      [-7, 0, -9],
      [5, 0, -11],
      [-13, 0, 3],
      [11, 0, -4],
      [-4, 0, 11],
      [8, 0, 8],
      [-16, 0, -7],
      [16, 0, 5],
      // Extra skeletons for 10 total
      [0, 0, -14],
      [-9, 0, 13],
    ];
    const rotY = [0.3, -0.8, 1.2, -0.4, 0.6, -1.1, 0.9, -0.3, 1.6, -1.4];
    const tiltZ = [
      0.1, -0.15, 0.2, -0.05, 0.15, -0.2, 0.08, -0.12, 0.25, -0.18,
    ];
    return positions.map((pos, i) => ({
      pos,
      rotY: rotY[i],
      tiltZ: tiltZ[i],
      id: `skel-${i}`,
    }));
  }, []);

  return (
    <group>
      {data.map((s) => (
        <SkeletonMesh
          key={s.id}
          position={s.pos}
          rotationY={s.rotY}
          tiltZ={s.tiltZ}
        />
      ))}
    </group>
  );
}

function SkeletonMesh({
  position,
  rotationY,
  tiltZ,
}: { position: [number, number, number]; rotationY: number; tiltZ: number }) {
  const mat = (
    <meshStandardMaterial
      color="#c8bda0"
      roughness={0.7}
      emissive="#302820"
      emissiveIntensity={0.15}
    />
  );
  return (
    <group position={position} rotation={[0, rotationY, tiltZ]}>
      {/* Skull */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <sphereGeometry args={[0.14, 10, 8]} />
        {mat}
      </mesh>
      {/* Jaw */}
      <mesh position={[0, 0.26, 0.06]} castShadow>
        <boxGeometry args={[0.16, 0.08, 0.14]} />
        {mat}
      </mesh>
      {/* Spine */}
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 0.45, 6]} />
        {mat}
      </mesh>
      {/* Ribcage */}
      <mesh position={[0, 0.06, 0]} castShadow>
        <boxGeometry args={[0.28, 0.32, 0.14]} />
        {mat}
      </mesh>
      {/* Pelvis */}
      <mesh position={[0, -0.18, 0]} castShadow>
        <boxGeometry args={[0.22, 0.1, 0.1]} />
        {mat}
      </mesh>
      {/* Left arm */}
      <mesh position={[-0.28, 0.08, 0]} rotation={[0, 0, 0.5]} castShadow>
        <capsuleGeometry args={[0.03, 0.28, 4, 6]} />
        {mat}
      </mesh>
      {/* Right arm */}
      <mesh position={[0.28, 0.08, 0]} rotation={[0, 0, -0.5]} castShadow>
        <capsuleGeometry args={[0.03, 0.28, 4, 6]} />
        {mat}
      </mesh>
      {/* Left leg */}
      <mesh position={[-0.08, -0.42, 0]} rotation={[0.1, 0, 0.1]} castShadow>
        <capsuleGeometry args={[0.04, 0.32, 4, 6]} />
        {mat}
      </mesh>
      {/* Right leg */}
      <mesh position={[0.08, -0.42, 0]} rotation={[0.1, 0, -0.1]} castShadow>
        <capsuleGeometry args={[0.04, 0.32, 4, 6]} />
        {mat}
      </mesh>
    </group>
  );
}

// ─── HD Burning Vehicles ─────────────────────────────────────────────────────

export function BurningVehicles() {
  return (
    <group>
      <BurningVehicle position={[-14, 0, -6]} rotationY={0.4} />
      <BurningVehicle position={[12, 0, -8]} rotationY={-0.7} />
      <BurningVehicle position={[-5, 0, -16]} rotationY={1.1} />
      <BurningVehicle position={[18, 0, -4]} rotationY={-0.3} />
      {/* 5th vehicle */}
      <BurningVehicle position={[-18, 0, 2]} rotationY={0.85} />
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
        3 + Math.sin(t.current) * 1.4 + Math.sin(t.current * 2.3) * 0.6;
    }
  });

  return (
    <group position={position} rotation={[0, rotationY, 0.08]}>
      {/* Body */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[3.2, 0.9, 1.5]} />
        <meshStandardMaterial color="#1a1208" roughness={0.9} metalness={0.4} />
      </mesh>
      {/* Cabin */}
      <mesh position={[0.2, 1.15, 0]} castShadow>
        <boxGeometry args={[1.7, 0.75, 1.3]} />
        <meshStandardMaterial color="#0d0a04" roughness={0.9} metalness={0.3} />
      </mesh>
      {/* Hood */}
      <mesh position={[-0.9, 0.95, 0]} castShadow>
        <boxGeometry args={[0.9, 0.15, 1.4]} />
        <meshStandardMaterial color="#130f06" roughness={0.9} metalness={0.4} />
      </mesh>
      {/* Wheel stumps */}
      {([-1.1, 1.1] as number[]).map((x) =>
        ([-0.8, 0.8] as number[]).map((z) => (
          <mesh
            key={`${x}-${z}`}
            position={[x, 0.28, z]}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
          >
            <cylinderGeometry args={[0.32, 0.32, 0.22, 10]} />
            <meshStandardMaterial color="#111010" roughness={0.97} />
          </mesh>
        )),
      )}
      {/* Fire light */}
      <pointLight
        ref={lightRef}
        position={[0, 1.8, 0]}
        color="#ff5500"
        intensity={3}
        distance={14}
        castShadow
      />
      {/* Debris around wreck */}
      {[
        { id: "wa", p: [-0.8, 0.08, 1.4] as [number, number, number], r: 0 },
        { id: "wb", p: [1.4, 0.06, 0.6] as [number, number, number], r: 1 },
        { id: "wc", p: [-1.2, 0.07, -1.2] as [number, number, number], r: 2 },
      ].map(({ id, p, r }) => (
        <mesh key={id} position={p} rotation={[0, r, 0]}>
          <boxGeometry args={[0.4, 0.12, 0.3]} />
          <meshStandardMaterial color="#1a1410" roughness={0.9} />
        </mesh>
      ))}
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
  "fp8",
  "fp9",
];

function FireParticles() {
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const times = useRef(
    Array.from({ length: 10 }, () => Math.random() * Math.PI * 2),
  );

  useFrame((_, delta) => {
    times.current = times.current.map((t, i) => {
      const next = t + delta * (2 + i * 0.25);
      const m = meshes.current[i];
      if (m) {
        m.position.y = 1.3 + Math.sin(next) * 0.5 + i * 0.12;
        m.position.x = Math.cos(next * 0.7 + i) * 0.35;
        m.position.z = Math.sin(next * 0.5 + i) * 0.25;
        const scale = 0.05 + Math.abs(Math.sin(next)) * 0.1;
        m.scale.setScalar(scale);
        if (m.material instanceof THREE.MeshStandardMaterial) {
          m.material.emissiveIntensity = 2.5 + Math.sin(next * 3) * 1.2;
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
          position={[0, 1.3 + i * 0.1, 0]}
        >
          <sphereGeometry args={[0.12, 5, 5]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? "#ff4400" : "#ffaa00"}
            emissive="#ff6600"
            emissiveIntensity={3}
            transparent
            opacity={0.88}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Background City Ruins ───────────────────────────────────────────────────

interface CityBuilding {
  id: string;
  pos: [number, number, number];
  size: [number, number, number];
  color: string;
}

export function CityRuins() {
  const buildings = useMemo<CityBuilding[]>(
    () => [
      { id: "cb0", pos: [-60, 18, -110], size: [10, 36, 8], color: "#180808" },
      { id: "cb1", pos: [-40, 22, -100], size: [8, 44, 7], color: "#140606" },
      { id: "cb2", pos: [-20, 14, -120], size: [12, 28, 9], color: "#1a0a0a" },
      { id: "cb3", pos: [0, 25, -130], size: [10, 50, 8], color: "#100505" },
      { id: "cb4", pos: [20, 16, -115], size: [9, 32, 7], color: "#160808" },
      { id: "cb5", pos: [40, 20, -105], size: [11, 40, 8], color: "#130606" },
      { id: "cb6", pos: [60, 12, -95], size: [8, 24, 6], color: "#1c0c0c" },
      { id: "cb7", pos: [-80, 17, -120], size: [10, 34, 7], color: "#120606" },
    ],
    [],
  );

  const lightRefs = useRef<(THREE.PointLight | null)[]>([]);
  const tOffsets = useMemo(
    () => buildings.map(() => Math.random() * Math.PI * 2),
    [buildings],
  );
  const t = useRef(0);

  useFrame((_, delta) => {
    t.current += delta;
    for (let i = 0; i < lightRefs.current.length; i++) {
      const l = lightRefs.current[i];
      if (l) {
        const phase = t.current * 3 + tOffsets[i];
        l.intensity = 0.5 + Math.abs(Math.sin(phase)) * 1.5;
      }
    }
  });

  return (
    <group>
      {buildings.map((b) => {
        const bIdx = Number(b.id.replace("cb", ""));
        return (
          <group key={b.id} position={b.pos}>
            {/* Main building silhouette */}
            <mesh castShadow>
              <boxGeometry args={b.size} />
              <meshStandardMaterial
                color={b.color}
                emissive="#ff2200"
                emissiveIntensity={0.25}
                roughness={0.95}
              />
            </mesh>
            {/* Broken top section */}
            <mesh
              position={[b.size[0] * 0.2, b.size[1] * 0.55, 0]}
              rotation={[0, 0, 0.15]}
            >
              <boxGeometry
                args={[b.size[0] * 0.6, b.size[1] * 0.1, b.size[2] * 0.7]}
              />
              <meshStandardMaterial color={b.color} roughness={0.98} />
            </mesh>
            {/* Window glow strips */}
            <mesh position={[0, b.size[1] * 0.1, b.size[2] * 0.51]}>
              <planeGeometry args={[b.size[0] * 0.7, b.size[1] * 0.6]} />
              <meshStandardMaterial
                color="#ff2200"
                emissive="#ff3300"
                emissiveIntensity={0.4}
                transparent
                opacity={0.15}
              />
            </mesh>
            {/* Flickering fire light at base */}
            <pointLight
              ref={(el) => {
                lightRefs.current[bIdx] = el;
              }}
              position={[0, -b.size[1] * 0.3, b.size[2] * 0.6]}
              color="#ff4400"
              intensity={1.0}
              distance={40}
            />
          </group>
        );
      })}

      {/* Smoke particles above city */}
      <SmokeParticles />
      <EmberParticles />
    </group>
  );
}

// 80 smoke spheres drifting upward
const SMOKE_COUNT = 80;
const SMOKE_IDS = Array.from({ length: SMOKE_COUNT }, (_, i) => `smoke-${i}`);
function SmokeParticles() {
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const initData = useMemo(() => {
    return Array.from({ length: SMOKE_COUNT }, () => ({
      x: (Math.random() - 0.5) * 160,
      y: 10 + Math.random() * 40,
      z: -90 - Math.random() * 60,
      speed: 0.012 + Math.random() * 0.014,
    }));
  }, []);

  useFrame(() => {
    for (let i = 0; i < SMOKE_COUNT; i++) {
      const m = meshes.current[i];
      if (!m) continue;
      initData[i].y += initData[i].speed;
      if (initData[i].y > 60) {
        initData[i].y = 5 + Math.random() * 10;
        initData[i].x = (Math.random() - 0.5) * 160;
      }
      m.position.set(initData[i].x, initData[i].y, initData[i].z);
    }
  });

  return (
    <group>
      {SMOKE_IDS.map((id, i) => (
        <mesh
          key={id}
          ref={(el) => {
            meshes.current[i] = el;
          }}
          position={[initData[i].x, initData[i].y, initData[i].z]}
        >
          <sphereGeometry args={[0.6 + Math.random() * 0.8, 5, 5]} />
          <meshBasicMaterial
            color="#1a1818"
            transparent
            opacity={0.3 + Math.random() * 0.15}
          />
        </mesh>
      ))}
    </group>
  );
}

// 50 ember particles rising faster
const EMBER_COUNT = 50;
const EMBER_IDS = Array.from({ length: EMBER_COUNT }, (_, i) => `ember-${i}`);
function EmberParticles() {
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const initData = useMemo(() => {
    return Array.from({ length: EMBER_COUNT }, () => ({
      x: (Math.random() - 0.5) * 120,
      y: 2 + Math.random() * 30,
      z: -80 - Math.random() * 50,
      speedY: 0.035 + Math.random() * 0.04,
      driftX: (Math.random() - 0.5) * 0.008,
      driftZ: (Math.random() - 0.5) * 0.006,
    }));
  }, []);

  useFrame(() => {
    for (let i = 0; i < EMBER_COUNT; i++) {
      const m = meshes.current[i];
      if (!m) continue;
      initData[i].y += initData[i].speedY;
      initData[i].x += initData[i].driftX;
      initData[i].z += initData[i].driftZ;
      if (initData[i].y > 50) {
        initData[i].y = 1 + Math.random() * 5;
        initData[i].x = (Math.random() - 0.5) * 120;
        initData[i].z = -80 - Math.random() * 50;
      }
      m.position.set(initData[i].x, initData[i].y, initData[i].z);
    }
  });

  return (
    <group>
      {EMBER_IDS.map((id, i) => (
        <mesh
          key={id}
          ref={(el) => {
            meshes.current[i] = el;
          }}
          position={[initData[i].x, initData[i].y, initData[i].z]}
        >
          <sphereGeometry args={[0.08, 4, 4]} />
          <meshStandardMaterial
            color="#ff4400"
            emissive="#ff6600"
            emissiveIntensity={4}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Giant Flaming DZ Logo ────────────────────────────────────────────────────

export function GiantDZLogo() {
  const groupRef = useRef<THREE.Group>(null);
  const goldLightRef1 = useRef<THREE.PointLight>(null);
  const goldLightRef2 = useRef<THREE.PointLight>(null);
  const t = useRef(0);

  useFrame((_, delta) => {
    t.current += delta;
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t.current * 0.3) * 0.06;
      // Slow bob
      groupRef.current.position.y = 30 + Math.sin(t.current * 0.5) * 0.8;
    }
    // Flickering gold lights
    if (goldLightRef1.current) {
      goldLightRef1.current.intensity = 4 + Math.sin(t.current * 4.7) * 1.5;
    }
    if (goldLightRef2.current) {
      goldLightRef2.current.intensity = 4 + Math.sin(t.current * 3.1 + 1) * 1.5;
    }
  });

  const mat = (
    <meshStandardMaterial
      color="#cc8800"
      emissive="#ffd700"
      emissiveIntensity={2.2}
      roughness={0.2}
      metalness={0.8}
    />
  );

  // "D" letter constructed from boxes
  // "Z" letter constructed from boxes
  return (
    <group ref={groupRef} position={[0, 30, -65]} scale={1.6}>
      {/* ── D letter (left) ── */}
      <group position={[-5, 0, 0]}>
        {/* vertical bar */}
        <mesh position={[-2, 0, 0]} castShadow>
          <boxGeometry args={[1.2, 10, 1]} />
          {mat}
        </mesh>
        {/* top horizontal */}
        <mesh position={[0.6, 4.2, 0]} castShadow>
          <boxGeometry args={[3.6, 1.2, 1]} />
          {mat}
        </mesh>
        {/* bottom horizontal */}
        <mesh position={[0.6, -4.2, 0]} castShadow>
          <boxGeometry args={[3.6, 1.2, 1]} />
          {mat}
        </mesh>
        {/* right curve top */}
        <mesh position={[2.4, 2, 0]} rotation={[0, 0, 0.4]} castShadow>
          <boxGeometry args={[1.0, 3.5, 1]} />
          {mat}
        </mesh>
        {/* right curve bottom */}
        <mesh position={[2.4, -2, 0]} rotation={[0, 0, -0.4]} castShadow>
          <boxGeometry args={[1.0, 3.5, 1]} />
          {mat}
        </mesh>
      </group>

      {/* ── Z letter (right) ── */}
      <group position={[5, 0, 0]}>
        {/* top bar */}
        <mesh position={[0, 4.2, 0]} castShadow>
          <boxGeometry args={[7, 1.2, 1]} />
          {mat}
        </mesh>
        {/* bottom bar */}
        <mesh position={[0, -4.2, 0]} castShadow>
          <boxGeometry args={[7, 1.2, 1]} />
          {mat}
        </mesh>
        {/* diagonal */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, -0.55]} castShadow>
          <boxGeometry args={[1.1, 10.5, 1]} />
          {mat}
        </mesh>
      </group>

      {/* Gold dramatic lights */}
      <pointLight
        ref={goldLightRef1}
        position={[-6, 2, 3]}
        color="#ffd700"
        intensity={5}
        distance={50}
      />
      <pointLight
        ref={goldLightRef2}
        position={[6, -2, 3]}
        color="#ff8800"
        intensity={5}
        distance={50}
      />

      {/* Fire emitters on logo */}
      <LogoFireParticles />
    </group>
  );
}

const LOGO_FIRE_IDS = [
  "lf0",
  "lf1",
  "lf2",
  "lf3",
  "lf4",
  "lf5",
  "lf6",
  "lf7",
  "lf8",
  "lf9",
  "lf10",
  "lf11",
];
function LogoFireParticles() {
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const times = useRef(
    Array.from({ length: 12 }, () => Math.random() * Math.PI * 2),
  );
  const xOffsets = useMemo(
    () => Array.from({ length: 12 }, (_, i) => (i - 6) * 1.2),
    [],
  );

  useFrame((_, delta) => {
    times.current = times.current.map((t, i) => {
      const next = t + delta * (1.5 + i * 0.2);
      const m = meshes.current[i];
      if (m) {
        m.position.y = 5 + (next % (Math.PI * 2)) * 0.8;
        m.position.x = xOffsets[i] + Math.sin(next * 0.6) * 0.4;
        const s = 0.12 + Math.abs(Math.sin(next)) * 0.18;
        m.scale.setScalar(s);
        if (m.material instanceof THREE.MeshStandardMaterial) {
          m.material.emissiveIntensity = 3 + Math.sin(next * 5) * 1.5;
        }
        // Reset when too high
        if (m.position.y > 10) {
          m.position.y = 4.5;
        }
      }
      return next;
    });
  });

  return (
    <group>
      {LOGO_FIRE_IDS.map((id, i) => (
        <mesh
          key={id}
          ref={(el) => {
            meshes.current[i] = el;
          }}
          position={[xOffsets[i], 5, 0]}
        >
          <sphereGeometry args={[0.18, 5, 5]} />
          <meshStandardMaterial
            color={
              i % 3 === 0 ? "#ff2200" : i % 3 === 1 ? "#ff8800" : "#ffdd00"
            }
            emissive={i % 3 === 0 ? "#ff4400" : "#ffaa00"}
            emissiveIntensity={4}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Building Wall ────────────────────────────────────────────────────────────

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
      <mesh position={[0, 10, -22]} receiveShadow>
        <boxGeometry args={[55, 20, 1]} />
        <meshStandardMaterial
          color="#0d1008"
          roughness={0.95}
          emissive="#100505"
          emissiveIntensity={0.3}
        />
      </mesh>
      {/* Side walls */}
      <mesh position={[-24, 10, -5]} receiveShadow>
        <boxGeometry args={[1, 20, 38]} />
        <meshStandardMaterial color="#0a0d08" roughness={0.95} />
      </mesh>
      <mesh position={[24, 10, -5]} receiveShadow>
        <boxGeometry args={[1, 20, 38]} />
        <meshStandardMaterial color="#0a0d08" roughness={0.95} />
      </mesh>
      {/* DZ Logo billboard */}
      <mesh position={[0, 12, -21.4]}>
        <planeGeometry args={[14, 7]} />
        <meshStandardMaterial
          map={logoTexture}
          emissiveMap={logoTexture}
          emissive="#ffffff"
          emissiveIntensity={0.9}
          roughness={0.3}
        />
      </mesh>
      {/* Logo glow lights */}
      <pointLight
        position={[0, 12, -20]}
        color="#00ff88"
        intensity={2.5}
        distance={18}
      />
      <pointLight
        position={[-2, 11, -20]}
        color="#ff6600"
        intensity={2}
        distance={12}
      />
      {/* Hindi signboard */}
      <mesh position={[0, 6, -21.4]}>
        <planeGeometry args={[10, 2.2]} />
        <meshStandardMaterial
          map={hindiTexture}
          emissiveMap={hindiTexture}
          emissive="#ffffff"
          emissiveIntensity={0.65}
          roughness={0.4}
        />
      </mesh>
      {/* Building damage cracks */}
      <mesh position={[-9, 7, -21.5]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.15, 5, 0.1]} />
        <meshStandardMaterial color="#050604" roughness={1} />
      </mesh>
      <mesh position={[7, 10, -21.5]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[0.1, 4, 0.1]} />
        <meshStandardMaterial color="#050604" roughness={1} />
      </mesh>
      {/* Window holes — glowing orange from inside */}
      {[
        { id: "wn0", x: -16, row: 0 },
        { id: "wn1", x: -8, row: 1 },
        { id: "wn2", x: 8, row: 0 },
        { id: "wn3", x: 16, row: 1 },
      ].map(({ id, x, row }) => (
        <group key={id} position={[x, 6 + row * 4, -21.3]}>
          <mesh>
            <planeGeometry args={[1.8, 2.2]} />
            <meshStandardMaterial
              color="#ff4400"
              emissive="#ff3300"
              emissiveIntensity={1.2}
              transparent
              opacity={0.7}
            />
          </mesh>
          <pointLight color="#ff4400" intensity={1.5} distance={8} />
        </group>
      ))}
    </group>
  );
}

// ─── Scene Lighting ───────────────────────────────────────────────────────────

export function SceneLighting() {
  const fireRef1 = useRef<THREE.PointLight>(null);
  const fireRef2 = useRef<THREE.PointLight>(null);
  const fireRef3 = useRef<THREE.PointLight>(null);
  const t = useRef(0);

  useFrame((_, delta) => {
    t.current += delta * 5;
    if (fireRef1.current)
      fireRef1.current.intensity = 1.8 + Math.sin(t.current * 1.3) * 0.9;
    if (fireRef2.current)
      fireRef2.current.intensity = 1.5 + Math.sin(t.current * 0.9 + 1.5) * 0.8;
    if (fireRef3.current)
      fireRef3.current.intensity = 1.2 + Math.sin(t.current * 1.7 + 0.8) * 0.6;
  });

  return (
    <>
      {/* Very dark ambient */}
      <ambientLight intensity={0.25} color="#1a0000" />
      {/* Fire-orange directional with shadow */}
      <directionalLight
        position={[10, 20, 5]}
        intensity={1.2}
        color="#ff4400"
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      {/* Hemisphere — fire sky / dark ground */}
      <hemisphereLight args={["#ff2200", "#000000", 0.4]} />
      {/* Fire lights from vehicles */}
      <pointLight
        ref={fireRef1}
        position={[-14, 4, -6]}
        color="#ff3300"
        intensity={3}
        distance={20}
      />
      <pointLight
        ref={fireRef2}
        position={[12, 4, -8]}
        color="#ff3300"
        intensity={3}
        distance={20}
      />
      {/* Back wall fire */}
      <pointLight
        ref={fireRef3}
        position={[0, 5, -18]}
        color="#ff3300"
        intensity={1.5}
        distance={18}
      />
      {/* Two dramatic red-orange logo glow lights */}
      <pointLight
        position={[-8, 28, -60]}
        color="#ff3300"
        intensity={3}
        distance={55}
      />
      <pointLight
        position={[8, 28, -60]}
        color="#ff3300"
        intensity={3}
        distance={55}
      />
      {/* Blue hero area fill */}
      <pointLight
        position={[0, 10, 0]}
        color="#0033ff"
        intensity={0.6}
        distance={25}
      />
      {/* Left/right scattered fire */}
      <pointLight
        position={[-20, 5, -20]}
        color="#ff2200"
        intensity={1.2}
        distance={22}
      />
      <pointLight
        position={[20, 5, -30]}
        color="#ff6600"
        intensity={1.2}
        distance={22}
      />
      {/* Near-ground warm fill */}
      <pointLight
        position={[0, 2, 2]}
        color="#ff1500"
        intensity={0.5}
        distance={15}
      />
      <fog attach="fog" args={["#0a0202", 18, 70]} />
    </>
  );
}
