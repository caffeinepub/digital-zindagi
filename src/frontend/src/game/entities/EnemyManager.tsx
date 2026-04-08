import { useFrame } from "@react-three/fiber";
import { forwardRef, useRef } from "react";
import * as THREE from "three";
import { useGameStore } from "../stores/gameStore";
import { SFX } from "../utils/audioEngine";

export interface EnemyRef {
  id: string;
  position: THREE.Vector3;
  applyDamage: (dmg: number) => void;
}

interface EnemyManagerProps {
  heroPosition: React.MutableRefObject<THREE.Vector3>;
  onEnemiesUpdate: (refs: EnemyRef[]) => void;
}

// Extended type to include new HD monster variants
type EnemyType = "triHound" | "alienDemon";

interface EnemyState {
  id: string;
  type: EnemyType;
  position: THREE.Vector3;
  hp: number;
  maxHp: number;
  behaviorState: "chase" | "attack" | "retreat";
  attackTimer: number;
  fadeOut: number;
  isDead: boolean;
  velocity: THREE.Vector3;
  orbitAngle: number;
  projectiles: Array<{ mesh: THREE.Mesh; vel: THREE.Vector3; life: number }>;
  // animation state
  animPhase: number;
  // pounce state for triHound
  pounceTimer: number;
  isPouncing: boolean;
}

let enemyIdCounter = 0;

/** Wave tracking */
let waveNumber = 0;

function randomSpawnPosition(): THREE.Vector3 {
  const angle = Math.random() * Math.PI * 2;
  const dist = 18 + Math.random() * 4;
  return new THREE.Vector3(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
}

function createEnemy(type: EnemyType): EnemyState {
  const hpMap: Record<EnemyType, number> = {
    triHound: 135, // +15% vs base 120
    alienDemon: 144, // +20% vs base 120
  };
  const hp = hpMap[type];
  return {
    id: `enemy-${++enemyIdCounter}`,
    type,
    position: randomSpawnPosition(),
    hp,
    maxHp: hp,
    behaviorState: "chase",
    attackTimer: 0,
    fadeOut: 0,
    isDead: false,
    velocity: new THREE.Vector3(),
    orbitAngle: Math.random() * Math.PI * 2,
    projectiles: [],
    animPhase: Math.random() * Math.PI * 2,
    pounceTimer: 2 + Math.random() * 2,
    isPouncing: false,
  };
}

/** Determine spawn types based on wave */
function getWaveSpawnTypes(wave: number): EnemyType[] {
  const isBonus = wave % 3 === 0;
  const baseCount = 3 + Math.floor(wave * 0.7);
  const bonusCount = isBonus ? 2 : 0;
  const total = baseCount + bonusCount;
  const types: EnemyType[] = [];
  for (let i = 0; i < total; i++) {
    if (wave <= 2) {
      types.push("triHound");
    } else {
      // Wave 3+: mix triHound + alienDemon (increasing demon ratio)
      const demonChance = Math.min(0.6, 0.2 + wave * 0.05);
      types.push(Math.random() < demonChance ? "alienDemon" : "triHound");
    }
  }
  return types;
}

export const EnemyManager = forwardRef<EnemyRef[], EnemyManagerProps>(
  function EnemyManager({ heroPosition, onEnemiesUpdate }, _ref) {
    const enemies = useRef<EnemyState[]>([]);
    const meshes = useRef<Map<string, THREE.Group>>(new Map());
    const spawnTimer = useRef(8);
    const initialized = useRef(false);
    const wingRefs = useRef<
      Map<string, [THREE.Mesh | null, THREE.Mesh | null]>
    >(new Map());

    function spawnInitialEnemies() {
      waveNumber = 1;
      const types = getWaveSpawnTypes(waveNumber);
      for (const type of types) {
        enemies.current.push(createEnemy(type));
      }
    }

    function buildEnemyRefs(): EnemyRef[] {
      return enemies.current
        .filter((e) => !e.isDead)
        .map((e) => ({
          id: e.id,
          position: e.position.clone(),
          applyDamage: (dmg: number) => {
            e.hp -= dmg;
            if (e.hp <= 0 && !e.isDead) {
              e.isDead = true;
              e.fadeOut = 1.0;
              const store = useGameStore.getState();
              const scoreAmt = e.type === "triHound" ? 250 : 300;
              const coinAmt = e.type === "triHound" ? 4 : 5;
              store.addScore(scoreAmt);
              store.addCoins(coinAmt);
              SFX.enemyDie(store.volume);
            }
          },
        }));
    }

    useFrame((state, delta) => {
      const store = useGameStore.getState();
      if (store.gamePhase !== "playing") return;

      if (!initialized.current) {
        initialized.current = true;
        spawnInitialEnemies();
      }

      const heroPos = heroPosition.current;

      // Wave spawn timer
      spawnTimer.current -= delta;
      if (spawnTimer.current <= 0) {
        waveNumber += 1;
        spawnTimer.current = 12;
        const types = getWaveSpawnTypes(waveNumber);
        // Spawn gradually — add 1-2 enemies per tick
        const spawnCount = Math.min(2, types.length);
        for (let i = 0; i < spawnCount; i++) {
          enemies.current.push(createEnemy(types[i]));
        }
        SFX.waveStart(store.volume * 0.5);
      }

      for (const e of enemies.current) {
        e.animPhase += delta * 3;

        if (e.isDead) {
          e.fadeOut -= delta * 1.5;
          const mesh = meshes.current.get(e.id);
          if (mesh) {
            const s = Math.max(0, e.fadeOut);
            mesh.scale.setScalar(s);
          }
          continue;
        }

        const dist = e.position.distanceTo(heroPos);

        // AI state machine
        if (e.hp < e.maxHp * 0.3) {
          e.behaviorState = "retreat";
        } else if (dist <= (e.type === "triHound" ? 2.5 : 7)) {
          e.behaviorState = "attack";
        } else {
          e.behaviorState = "chase";
        }

        if (e.type === "triHound") {
          updateTriHound(e, heroPos, delta, store);
        } else {
          updateAlienDemon(e, heroPos, delta, state.scene, store);
        }

        // Animate alien demon wings
        if (e.type === "alienDemon") {
          const wings = wingRefs.current.get(e.id);
          if (wings) {
            const wScale = 0.8 + Math.abs(Math.sin(e.animPhase * 2)) * 0.4;
            if (wings[0]) wings[0].scale.y = wScale;
            if (wings[1]) wings[1].scale.y = wScale;
          }
        }

        // Update mesh position
        const mesh = meshes.current.get(e.id);
        if (mesh) {
          mesh.position.copy(e.position);
          if (e.type === "triHound") {
            mesh.lookAt(heroPos.clone().setY(e.position.y));
          } else {
            // Alien demon faces hero
            const dir = heroPos.clone().sub(e.position).setY(0).normalize();
            if (dir.length() > 0.01) {
              mesh.rotation.y = Math.atan2(dir.x, dir.z);
            }
          }
        }
      }

      // Update alien demon projectiles
      for (const e of enemies.current) {
        if (e.type === "alienDemon") {
          for (let i = e.projectiles.length - 1; i >= 0; i--) {
            const p = e.projectiles[i];
            p.mesh.position.addScaledVector(p.vel, delta);
            p.life -= delta;
            const distToHero = p.mesh.position.distanceTo(
              heroPos.clone().setY(p.mesh.position.y),
            );
            if (distToHero < 0.8) {
              store.damageHero(12);
              SFX.heroHit(store.volume);
              state.scene.remove(p.mesh);
              e.projectiles.splice(i, 1);
            } else if (p.life <= 0) {
              state.scene.remove(p.mesh);
              e.projectiles.splice(i, 1);
            }
          }
        }
      }

      // Clean up dead enemies
      enemies.current = enemies.current.filter(
        (e) => !e.isDead || e.fadeOut > 0,
      );

      onEnemiesUpdate(buildEnemyRefs());
    });

    function updateTriHound(
      e: EnemyState,
      heroPos: THREE.Vector3,
      delta: number,
      store: ReturnType<typeof useGameStore.getState>,
    ) {
      const dist = e.position.distanceTo(heroPos);

      if (e.behaviorState === "retreat") {
        const away = e.position
          .clone()
          .sub(heroPos)
          .normalize()
          .multiplyScalar(5 * delta);
        e.position.add(away);
        return;
      }

      // Pounce mechanic
      e.pounceTimer -= delta;
      if (e.pounceTimer <= 0 && dist < 6 && dist > 2.5) {
        e.pounceTimer = 3 + Math.random() * 2;
        e.isPouncing = true;
      }
      if (e.isPouncing) {
        const lunge = heroPos
          .clone()
          .sub(e.position)
          .normalize()
          .multiplyScalar(14 * delta);
        e.position.add(lunge);
        if (dist < 2) e.isPouncing = false;
      } else {
        // Standard chase
        if (dist > 2.2) {
          const toward = heroPos
            .clone()
            .sub(e.position)
            .normalize()
            .multiplyScalar(7 * delta);
          e.position.add(toward);
        }
      }

      e.attackTimer -= delta;
      if (dist <= 2.8 && e.attackTimer <= 0) {
        e.attackTimer = 1.4;
        store.damageHero(18); // upgraded damage
        SFX.houndBite(store.volume);
        SFX.heroHit(store.volume * 0.6);
      }

      // Keep in bounds
      e.position.x = Math.max(-22, Math.min(22, e.position.x));
      e.position.z = Math.max(-22, Math.min(22, e.position.z));
      e.position.y = 0;
    }

    function updateAlienDemon(
      e: EnemyState,
      heroPos: THREE.Vector3,
      delta: number,
      scene: THREE.Scene,
      store: ReturnType<typeof useGameStore.getState>,
    ) {
      const alienSpeed = 1.1; // +20% vs base demon

      if (e.behaviorState === "retreat") {
        const away = e.position
          .clone()
          .sub(heroPos)
          .normalize()
          .multiplyScalar(5 * delta);
        e.position.add(away);
        return;
      }

      // Orbit around hero at ~7m
      const orbitRadius = 7;
      e.orbitAngle += delta * 0.9 * alienSpeed;
      const targetX = heroPos.x + Math.cos(e.orbitAngle) * orbitRadius;
      const targetZ = heroPos.z + Math.sin(e.orbitAngle) * orbitRadius;
      e.position.x += (targetX - e.position.x) * 3.5 * delta;
      e.position.z += (targetZ - e.position.z) * 3.5 * delta;
      // Hover — alien floats higher than base demon
      e.position.y = 0.8 + Math.sin(e.animPhase * 0.7) * 0.35;

      e.attackTimer -= delta;
      if (e.attackTimer <= 0) {
        e.attackTimer = 1.6; // slightly faster than base demon
        spawnAlienProjectile(e, heroPos, scene);
        SFX.demonShoot(store.volume);
      }
    }

    function spawnAlienProjectile(
      e: EnemyState,
      heroPos: THREE.Vector3,
      scene: THREE.Scene,
    ) {
      // Cyan glowing orb — alien signature
      const geo = new THREE.SphereGeometry(0.22, 8, 8);
      const mat = new THREE.MeshStandardMaterial({
        color: "#00ccff",
        emissive: "#00ffff",
        emissiveIntensity: 4,
        transparent: true,
        opacity: 0.9,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(e.position).add(new THREE.Vector3(0, 0.6, 0));
      const dir = heroPos
        .clone()
        .add(new THREE.Vector3(0, 0.9, 0))
        .sub(mesh.position)
        .normalize();
      // Add a point light to the projectile for visual effect
      const light = new THREE.PointLight("#00ffff", 2, 5);
      mesh.add(light);
      scene.add(mesh);
      e.projectiles.push({ mesh, vel: dir.multiplyScalar(11), life: 3.0 });
    }

    // ─── Render ────────────────────────────────────────────────────────────────

    return (
      <group>
        {enemies.current.map((e) => (
          <EnemyMesh
            key={e.id}
            enemy={e}
            onRef={(g) => {
              if (g) meshes.current.set(e.id, g);
              else meshes.current.delete(e.id);
            }}
            onWingRef={(left, right) => {
              if (left || right) {
                wingRefs.current.set(e.id, [left, right]);
              } else {
                wingRefs.current.delete(e.id);
              }
            }}
          />
        ))}
      </group>
    );
  },
);

// ─── Three-Headed Hound Mesh ──────────────────────────────────────────────────

function TriHoundMesh({ hpFrac }: { hpFrac: number }) {
  const bodyMat = (
    <meshStandardMaterial color="#2d1b00" roughness={0.8} metalness={0.05} />
  );
  const eyeMat = (
    <meshStandardMaterial
      color="#ff2200"
      emissive="#ff2200"
      emissiveIntensity={5}
    />
  );
  const fangMat = <meshStandardMaterial color="#e8ddc0" roughness={0.5} />;

  return (
    <group>
      {/* Main body — larger than standard */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[1.4, 0.8, 2.2]} />
        {bodyMat}
      </mesh>
      {/* Muscular shoulder hump */}
      <mesh position={[0, 0.85, 0.5]} castShadow>
        <boxGeometry args={[1.0, 0.5, 0.8]} />
        {bodyMat}
      </mesh>

      {/* 3 Heads: center, left, right */}
      {(
        [
          { id: "hc", x: 0, z: 1.2 },
          { id: "hl", x: -0.55, z: 0.9 },
          { id: "hr", x: 0.55, z: 0.9 },
        ] as { id: string; x: number; z: number }[]
      ).map(({ id, x, z }) => (
        <group key={id} position={[x, 0.85, z]}>
          {/* Head */}
          <mesh castShadow>
            <sphereGeometry args={[0.32, 10, 8]} />
            {bodyMat}
          </mesh>
          {/* Snout */}
          <mesh position={[0, -0.08, 0.26]} castShadow>
            <boxGeometry args={[0.22, 0.18, 0.3]} />
            {bodyMat}
          </mesh>
          {/* Left eye */}
          <mesh position={[-0.13, 0.07, 0.28]}>
            <sphereGeometry args={[0.07, 6, 6]} />
            {eyeMat}
          </mesh>
          {/* Right eye */}
          <mesh position={[0.13, 0.07, 0.28]}>
            <sphereGeometry args={[0.07, 6, 6]} />
            {eyeMat}
          </mesh>
          {/* Fangs */}
          <mesh position={[-0.07, -0.16, 0.3]} rotation={[0.3, 0, 0.1]}>
            <coneGeometry args={[0.04, 0.18, 5]} />
            {fangMat}
          </mesh>
          <mesh position={[0.07, -0.16, 0.3]} rotation={[0.3, 0, -0.1]}>
            <coneGeometry args={[0.04, 0.18, 5]} />
            {fangMat}
          </mesh>
          {/* Neck connector */}
          <mesh position={[0, -0.35, -0.2]} rotation={[0.3, 0, 0]}>
            <cylinderGeometry args={[0.15, 0.2, 0.5, 8]} />
            {bodyMat}
          </mesh>
        </group>
      ))}

      {/* 4 Muscular legs */}
      {(
        [
          { id: "lfl", x: -0.45, z: 0.7 },
          { id: "lfr", x: 0.45, z: 0.7 },
          { id: "lbl", x: -0.45, z: -0.7 },
          { id: "lbr", x: 0.45, z: -0.7 },
        ] as { id: string; x: number; z: number }[]
      ).map(({ id, x, z }) => (
        <mesh key={id} position={[x, 0.05, z]} castShadow>
          <capsuleGeometry args={[0.14, 0.6, 4, 8]} />
          {bodyMat}
        </mesh>
      ))}

      {/* Tail */}
      <mesh position={[0, 0.5, -1.2]} rotation={[-0.5, 0, 0.1]}>
        <cylinderGeometry args={[0.07, 0.04, 0.8, 6]} />
        {bodyMat}
      </mesh>

      {/* Red glow */}
      <pointLight
        color="#ff2200"
        intensity={1.0}
        distance={6}
        position={[0, 0.6, 0]}
      />

      {/* HP bar */}
      <group position={[0, 2.2, 0]}>
        <mesh>
          <planeGeometry args={[1.2, 0.1]} />
          <meshBasicMaterial color="#330000" />
        </mesh>
        <mesh position={[(hpFrac - 1) * 0.6, 0, 0.001]}>
          <planeGeometry args={[1.2 * hpFrac, 0.08]} />
          <meshBasicMaterial color="#ff3300" />
        </mesh>
      </group>
    </group>
  );
}

// ─── Alien Demon Mesh ─────────────────────────────────────────────────────────

function AlienDemonMesh({
  hpFrac,
  onWingRef,
}: {
  hpFrac: number;
  onWingRef: (left: THREE.Mesh | null, right: THREE.Mesh | null) => void;
}) {
  const leftWingRef = useRef<THREE.Mesh>(null);
  const rightWingRef = useRef<THREE.Mesh>(null);

  // Forward wing refs on mount
  const setWingRefs = (l: THREE.Mesh | null, r: THREE.Mesh | null) => {
    leftWingRef.current = l;
    rightWingRef.current = r;
    onWingRef(l, r);
  };

  const bodyMat = (
    <meshStandardMaterial
      color="#4b0082"
      emissive="#7b00ff"
      emissiveIntensity={0.5}
      roughness={0.6}
      metalness={0.1}
    />
  );
  const eyeMat = (
    <meshStandardMaterial
      color="#00ffff"
      emissive="#00ffff"
      emissiveIntensity={6}
    />
  );
  const wingMat = (
    <meshStandardMaterial
      color="#330055"
      emissive="#5500aa"
      emissiveIntensity={0.4}
      side={THREE.DoubleSide}
      transparent
      opacity={0.82}
    />
  );

  return (
    <group>
      {/* Slim tall body */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <capsuleGeometry args={[0.42, 1.4, 6, 12]} />
        {bodyMat}
      </mesh>

      {/* Large elongated alien head */}
      <mesh position={[0, 1.85, 0]} scale={[1, 1.5, 1]} castShadow>
        <sphereGeometry args={[0.52, 14, 10]} />
        {bodyMat}
      </mesh>

      {/* Cyan glowing eyes */}
      <mesh position={[-0.16, 1.95, 0.4]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        {eyeMat}
      </mesh>
      <mesh position={[0.16, 1.95, 0.4]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        {eyeMat}
      </mesh>

      {/* Antenna left */}
      <mesh position={[-0.18, 2.5, 0]} rotation={[0, 0, -0.2]}>
        <cylinderGeometry args={[0.025, 0.015, 0.5, 5]} />
        {bodyMat}
      </mesh>
      <mesh position={[-0.26, 2.76, 0]}>
        <sphereGeometry args={[0.055, 6, 6]} />
        <meshStandardMaterial
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={4}
        />
      </mesh>
      {/* Antenna right */}
      <mesh position={[0.18, 2.5, 0]} rotation={[0, 0, 0.2]}>
        <cylinderGeometry args={[0.025, 0.015, 0.5, 5]} />
        {bodyMat}
      </mesh>
      <mesh position={[0.26, 2.76, 0]}>
        <sphereGeometry args={[0.055, 6, 6]} />
        <meshStandardMaterial
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={4}
        />
      </mesh>

      {/* Wings — animated via wingRefs */}
      <mesh
        ref={(el) => setWingRefs(el, rightWingRef.current)}
        position={[-1.4, 1.1, -0.15]}
        rotation={[0.15, 0.15, -0.5]}
        castShadow
      >
        <planeGeometry args={[2.4, 1.5]} />
        {wingMat}
      </mesh>
      <mesh
        ref={(el) => setWingRefs(leftWingRef.current, el)}
        position={[1.4, 1.1, -0.15]}
        rotation={[0.15, -0.15, 0.5]}
        castShadow
      >
        <planeGeometry args={[2.4, 1.5]} />
        {wingMat}
      </mesh>

      {/* Claw-hands */}
      <mesh position={[-0.6, 0.6, 0.4]} rotation={[0.3, 0, -0.4]}>
        <capsuleGeometry args={[0.1, 0.4, 4, 6]} />
        {bodyMat}
      </mesh>
      <mesh position={[0.6, 0.6, 0.4]} rotation={[0.3, 0, 0.4]}>
        <capsuleGeometry args={[0.1, 0.4, 4, 6]} />
        {bodyMat}
      </mesh>

      {/* Cyan body glow */}
      <pointLight
        color="#7700ff"
        intensity={0.8}
        distance={5}
        position={[0, 1, 0]}
      />

      {/* HP bar */}
      <group position={[0, 3.0, 0]}>
        <mesh>
          <planeGeometry args={[1.1, 0.1]} />
          <meshBasicMaterial color="#220033" />
        </mesh>
        <mesh position={[(hpFrac - 1) * 0.55, 0, 0.001]}>
          <planeGeometry args={[1.1 * hpFrac, 0.08]} />
          <meshBasicMaterial color="#aa00ff" />
        </mesh>
      </group>
    </group>
  );
}

// ─── Combined Enemy Mesh ──────────────────────────────────────────────────────

function EnemyMesh({
  enemy,
  onRef,
  onWingRef,
}: {
  enemy: EnemyState;
  onRef: (g: THREE.Group | null) => void;
  onWingRef: (left: THREE.Mesh | null, right: THREE.Mesh | null) => void;
}) {
  const hpFrac = Math.max(0, enemy.hp / enemy.maxHp);

  if (enemy.type === "triHound") {
    return (
      <group
        ref={onRef}
        position={[enemy.position.x, enemy.position.y, enemy.position.z]}
      >
        <TriHoundMesh hpFrac={hpFrac} />
      </group>
    );
  }

  // Alien Demon
  return (
    <group
      ref={onRef}
      position={[enemy.position.x, enemy.position.y, enemy.position.z]}
    >
      <AlienDemonMesh hpFrac={hpFrac} onWingRef={onWingRef} />
    </group>
  );
}
