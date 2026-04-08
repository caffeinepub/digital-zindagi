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

interface EnemyState {
  id: string;
  type: "hound" | "demon";
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
}

let enemyIdCounter = 0;

function randomSpawnPosition(): THREE.Vector3 {
  const angle = Math.random() * Math.PI * 2;
  const dist = 18 + Math.random() * 4;
  return new THREE.Vector3(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
}

export const EnemyManager = forwardRef<EnemyRef[], EnemyManagerProps>(
  function EnemyManager({ heroPosition, onEnemiesUpdate }, _ref) {
    const enemies = useRef<EnemyState[]>([]);
    const meshes = useRef<Map<string, THREE.Group>>(new Map());
    const spawnTimer = useRef(0);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const initialized = useRef(false);

    function createEnemy(type: "hound" | "demon"): EnemyState {
      return {
        id: `enemy-${++enemyIdCounter}`,
        type,
        position: randomSpawnPosition(),
        hp: type === "hound" ? 80 : 60,
        maxHp: type === "hound" ? 80 : 60,
        behaviorState: "chase",
        attackTimer: 0,
        fadeOut: 0,
        isDead: false,
        velocity: new THREE.Vector3(),
        orbitAngle: Math.random() * Math.PI * 2,
        projectiles: [],
      };
    }

    function spawnInitialEnemies() {
      const count = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const type = Math.random() < 0.5 ? "hound" : "demon";
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
              store.addScore(e.type === "hound" ? 200 : 150);
              store.addCoins(e.type === "hound" ? 3 : 2);
              SFX.enemyDie(store.volume);
            }
          },
        }));
    }

    useFrame((state, delta) => {
      const store = useGameStore.getState();
      if (store.gamePhase !== "playing") return;

      sceneRef.current = state.scene;

      if (!initialized.current) {
        initialized.current = true;
        spawnInitialEnemies();
      }

      const heroPos = heroPosition.current;

      // Spawn wave
      spawnTimer.current -= delta;
      if (spawnTimer.current <= 0) {
        spawnTimer.current = 10;
        const newType = Math.random() < 0.5 ? "hound" : "demon";
        enemies.current.push(createEnemy(newType));
      }

      for (const e of enemies.current) {
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
        } else if (dist <= (e.type === "hound" ? 2 : 6)) {
          e.behaviorState = "attack";
        } else {
          e.behaviorState = "chase";
        }

        if (e.type === "hound") {
          updateHound(e, heroPos, delta, store);
        } else {
          updateDemon(e, heroPos, delta, state.scene, store);
        }

        // Update mesh position
        const mesh = meshes.current.get(e.id);
        if (mesh) {
          mesh.position.copy(e.position);
          if (e.type === "hound") {
            mesh.lookAt(heroPos.clone().setY(0));
          }
        }
      }

      // Update projectiles
      for (const e of enemies.current) {
        if (e.type === "demon") {
          for (let i = e.projectiles.length - 1; i >= 0; i--) {
            const p = e.projectiles[i];
            p.mesh.position.addScaledVector(p.vel, delta);
            p.life -= delta;
            const distToHero = p.mesh.position.distanceTo(
              heroPos.clone().setY(p.mesh.position.y),
            );
            if (distToHero < 0.8) {
              store.damageHero(15);
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

    function updateHound(
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
      } else if (e.behaviorState === "chase" || e.behaviorState === "attack") {
        if (dist > 2) {
          const toward = heroPos
            .clone()
            .sub(e.position)
            .normalize()
            .multiplyScalar(8 * delta);
          e.position.add(toward);
        }
        e.attackTimer -= delta;
        if (dist <= 2.5 && e.attackTimer <= 0) {
          e.attackTimer = 1.5;
          store.damageHero(20);
          SFX.houndBite(store.volume);
          SFX.heroHit(store.volume * 0.6);
        }
      }
      e.position.x = Math.max(-21, Math.min(21, e.position.x));
      e.position.z = Math.max(-21, Math.min(21, e.position.z));
    }

    function updateDemon(
      e: EnemyState,
      heroPos: THREE.Vector3,
      delta: number,
      scene: THREE.Scene,
      store: ReturnType<typeof useGameStore.getState>,
    ) {
      // Orbit around hero at ~6m
      if (e.behaviorState === "retreat") {
        const away = e.position
          .clone()
          .sub(heroPos)
          .normalize()
          .multiplyScalar(4 * delta);
        e.position.add(away);
      } else {
        const orbitRadius = 6;
        e.orbitAngle += delta * 0.8;
        const targetX = heroPos.x + Math.cos(e.orbitAngle) * orbitRadius;
        const targetZ = heroPos.z + Math.sin(e.orbitAngle) * orbitRadius;
        e.position.x += (targetX - e.position.x) * 3 * delta;
        e.position.z += (targetZ - e.position.z) * 3 * delta;
        e.position.y = 0.5 + Math.sin(e.orbitAngle * 2) * 0.2; // hover

        e.attackTimer -= delta;
        if (e.attackTimer <= 0) {
          e.attackTimer = 2.0;
          spawnDemonProjectile(e, heroPos, scene);
          SFX.demonShoot(store.volume);
        }
      }
    }

    function spawnDemonProjectile(
      e: EnemyState,
      heroPos: THREE.Vector3,
      scene: THREE.Scene,
    ) {
      const geo = new THREE.SphereGeometry(0.14, 6, 6);
      const mat = new THREE.MeshStandardMaterial({
        color: "#cc0000",
        emissive: "#ff2200",
        emissiveIntensity: 3,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(e.position).add(new THREE.Vector3(0, 0.8, 0));
      const dir = heroPos
        .clone()
        .add(new THREE.Vector3(0, 0.9, 0))
        .sub(mesh.position)
        .normalize();
      scene.add(mesh);
      e.projectiles.push({ mesh, vel: dir.multiplyScalar(10), life: 2.5 });
    }

    // Render enemy meshes
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
          />
        ))}
      </group>
    );
  },
);

function EnemyMesh({
  enemy,
  onRef,
}: {
  enemy: EnemyState;
  onRef: (g: THREE.Group | null) => void;
}) {
  const hpFrac = Math.max(0, enemy.hp / enemy.maxHp);

  if (enemy.type === "hound") {
    return (
      <group
        ref={onRef}
        position={[enemy.position.x, enemy.position.y, enemy.position.z]}
      >
        {/* Main body */}
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[2, 1, 0.5]} />
          <meshStandardMaterial
            color="#3a0808"
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>
        {/* 3 heads */}
        {([-0.6, 0, 0.6] as number[]).map((x) => (
          <group key={x} position={[x, 1.1, 0.3]}>
            <mesh castShadow>
              <sphereGeometry args={[0.22, 8, 8]} />
              <meshStandardMaterial color="#2a0404" roughness={0.7} />
            </mesh>
            {/* Eyes */}
            <mesh position={[0.1, 0.05, 0.2]}>
              <sphereGeometry args={[0.04, 6, 6]} />
              <meshStandardMaterial
                color="#ff2200"
                emissive="#ff2200"
                emissiveIntensity={5}
              />
            </mesh>
            <mesh position={[-0.1, 0.05, 0.2]}>
              <sphereGeometry args={[0.04, 6, 6]} />
              <meshStandardMaterial
                color="#ff2200"
                emissive="#ff2200"
                emissiveIntensity={5}
              />
            </mesh>
          </group>
        ))}
        {/* Legs */}
        {([-0.6, -0.2, 0.2, 0.6] as number[]).map((x) => (
          <mesh key={x} position={[x, 0, 0]} rotation={[0.1, 0, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.06, 0.5, 6]} />
            <meshStandardMaterial color="#2a0606" roughness={0.9} />
          </mesh>
        ))}
        {/* HP bar */}
        <group position={[0, 1.8, 0]}>
          <mesh>
            <planeGeometry args={[1.0, 0.1]} />
            <meshBasicMaterial color="#330000" />
          </mesh>
          <mesh position={[(hpFrac - 1) * 0.5, 0, 0.001]}>
            <planeGeometry args={[1.0 * hpFrac, 0.08]} />
            <meshBasicMaterial color="#ff3300" />
          </mesh>
        </group>
        {/* Red glow */}
        <pointLight
          color="#ff2200"
          intensity={0.8}
          distance={5}
          position={[0, 0.5, 0]}
        />
      </group>
    );
  }

  // Demon
  return (
    <group ref={onRef} position={[enemy.position.x, 0.5, enemy.position.z]}>
      {/* Body capsule */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <capsuleGeometry args={[0.25, 0.7, 6, 12]} />
        <meshStandardMaterial color="#1a0828" roughness={0.7} metalness={0.2} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <sphereGeometry args={[0.22, 10, 10]} />
        <meshStandardMaterial color="#220a38" roughness={0.6} />
      </mesh>
      {/* Wings */}
      <mesh position={[-0.7, 1.0, -0.1]} rotation={[0.2, 0.1, -0.3]} castShadow>
        <planeGeometry args={[1.0, 0.8]} />
        <meshStandardMaterial
          color="#330055"
          side={THREE.DoubleSide}
          transparent
          opacity={0.85}
        />
      </mesh>
      <mesh position={[0.7, 1.0, -0.1]} rotation={[0.2, -0.1, 0.3]} castShadow>
        <planeGeometry args={[1.0, 0.8]} />
        <meshStandardMaterial
          color="#330055"
          side={THREE.DoubleSide}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.08, 1.65, 0.2]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial
          color="#ff00ff"
          emissive="#ff00ff"
          emissiveIntensity={5}
        />
      </mesh>
      <mesh position={[-0.08, 1.65, 0.2]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial
          color="#ff00ff"
          emissive="#ff00ff"
          emissiveIntensity={5}
        />
      </mesh>
      {/* HP bar */}
      <group position={[0, 2.1, 0]}>
        <mesh>
          <planeGeometry args={[0.8, 0.09]} />
          <meshBasicMaterial color="#220033" />
        </mesh>
        <mesh position={[(hpFrac - 1) * 0.4, 0, 0.001]}>
          <planeGeometry args={[0.8 * hpFrac, 0.07]} />
          <meshBasicMaterial color="#bb22ff" />
        </mesh>
      </group>
      <pointLight
        color="#8800ff"
        intensity={0.6}
        distance={4}
        position={[0, 0.8, 0]}
      />
    </group>
  );
}
