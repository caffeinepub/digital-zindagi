import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { type WeaponType, useGameStore } from "../stores/gameStore";
import { SFX } from "../utils/audioEngine";
import { createFaceTexture } from "../utils/faceTexture";

interface HeroProps {
  onPositionChange: (pos: THREE.Vector3) => void;
  keys: React.MutableRefObject<Set<string>>;
  joystick: React.MutableRefObject<{ x: number; y: number }>;
}

/** Per-weapon attack cooldown in seconds */
const WEAPON_COOLDOWN: Record<WeaponType, number> = {
  rifle: 1.2,
  shotgun: 2.0,
  plasma: 1.5,
};

/** Per-weapon damage multiplier */
const WEAPON_DAMAGE: Record<WeaponType, number> = {
  rifle: 20,
  shotgun: 30,
  plasma: 25,
};

export function Hero({ onPositionChange, keys, joystick }: HeroProps) {
  const { heroHP, heroMaxHP, heroFace, currentWeapon } = useGameStore();
  const groupRef = useRef<THREE.Group>(null);
  const weaponGroupRef = useRef<THREE.Group>(null);
  const weaponRef = useRef<THREE.Mesh>(null);
  const velocity = useRef(new THREE.Vector3());
  const position = useRef(new THREE.Vector3(0, 0, 3));
  const [faceTexture, setFaceTexture] = useState<THREE.CanvasTexture | null>(
    null,
  );
  const attackCooldown = useRef(0);
  const isAttacking = useRef(false);
  const attackTime = useRef(0);

  // Load face texture
  useEffect(() => {
    if (heroFace) {
      createFaceTexture(heroFace, (tex) => setFaceTexture(tex));
    } else {
      createFaceTexture("", (tex) => setFaceTexture(tex));
    }
  }, [heroFace]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const store = useGameStore.getState();
    if (store.gamePhase !== "playing") return;

    // Input
    const ks = keys.current;
    const joy = joystick.current;
    let dx = joy.x;
    let dz = joy.y;
    if (ks.has("KeyW") || ks.has("ArrowUp")) dz -= 1;
    if (ks.has("KeyS") || ks.has("ArrowDown")) dz += 1;
    if (ks.has("KeyA") || ks.has("ArrowLeft")) dx -= 1;
    if (ks.has("KeyD") || ks.has("ArrowRight")) dx += 1;

    // Normalize diagonal
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len > 1) {
      dx /= len;
      dz /= len;
    }

    const speed = 5;
    velocity.current.x = dx * speed;
    velocity.current.z = dz * speed;

    // Move
    position.current.x += velocity.current.x * delta;
    position.current.z += velocity.current.z * delta;

    // Clamp to arena
    position.current.x = Math.max(-20, Math.min(20, position.current.x));
    position.current.z = Math.max(-20, Math.min(20, position.current.z));

    groupRef.current.position.copy(position.current);
    groupRef.current.position.y = 0;

    // Face movement direction
    if (len > 0.01) {
      const angle = Math.atan2(dx, dz);
      groupRef.current.rotation.y = angle;
    }

    // Attack key (Space) — weapon-specific cooldown
    const weapon = store.currentWeapon;
    const cd = WEAPON_COOLDOWN[weapon];
    attackCooldown.current -= delta;
    if (ks.has("Space") && attackCooldown.current <= 0) {
      isAttacking.current = true;
      attackCooldown.current = cd;
      attackTime.current = 0;
      SFX.heroAttack(store.volume);
      // Notify HUD cooldown bar
      window.dispatchEvent(new Event("dz_hero_attack"));
      // Store damage in localStorage for GameScene enemy system to read
      localStorage.setItem("dz_weapon_dmg", String(WEAPON_DAMAGE[weapon]));
    }

    // Attack animation
    if (isAttacking.current && weaponRef.current) {
      attackTime.current += delta;
      const t = attackTime.current / 0.3;
      weaponRef.current.rotation.x = -Math.PI / 2 + t * Math.PI;
      if (attackTime.current >= 0.3) {
        isAttacking.current = false;
        weaponRef.current.rotation.x = 0;
      }
    }

    // Notify position
    onPositionChange(position.current.clone());
  });

  const hpFraction = heroHP / heroMaxHP;

  return (
    <group ref={groupRef} position={[0, 0, 3]}>
      {/* Body capsule */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <capsuleGeometry args={[0.3, 1.0, 8, 16]} />
        <meshStandardMaterial color="#1a4a2a" roughness={0.7} metalness={0.2} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.85, 0]} castShadow>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshStandardMaterial
          map={faceTexture ?? undefined}
          color={faceTexture ? "#ffffff" : "#c8a070"}
          roughness={0.6}
        />
      </mesh>
      {/* Helmet rim */}
      <mesh position={[0, 1.95, 0]}>
        <torusGeometry args={[0.29, 0.04, 8, 16]} />
        <meshStandardMaterial color="#1a4a1a" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Armor plates */}
      <mesh position={[0, 1.1, 0.28]} castShadow>
        <boxGeometry args={[0.5, 0.4, 0.08]} />
        <meshStandardMaterial color="#0d3018" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* ── Weapon (changes based on currentWeapon) ── */}
      <group ref={weaponGroupRef} position={[0.4, 1.2, 0]}>
        {currentWeapon === "rifle" && (
          <mesh ref={weaponRef} castShadow rotation={[0, 0, 0.3]}>
            <boxGeometry args={[0.08, 0.08, 0.7]} />
            <meshStandardMaterial
              color="#2a2a2a"
              metalness={0.85}
              roughness={0.2}
            />
          </mesh>
        )}

        {currentWeapon === "shotgun" && (
          <group ref={weaponRef}>
            {/* Barrel */}
            <mesh castShadow rotation={[0, 0, 0.25]}>
              <boxGeometry args={[0.12, 0.12, 0.5]} />
              <meshStandardMaterial
                color="#3a2010"
                metalness={0.6}
                roughness={0.4}
              />
            </mesh>
            {/* Pump handle */}
            <mesh position={[0, -0.1, 0.05]} castShadow>
              <boxGeometry args={[0.08, 0.06, 0.18]} />
              <meshStandardMaterial
                color="#5a3020"
                metalness={0.3}
                roughness={0.7}
              />
            </mesh>
          </group>
        )}

        {currentWeapon === "plasma" && (
          <group ref={weaponRef}>
            {/* Orb body */}
            <mesh castShadow>
              <sphereGeometry args={[0.15, 12, 12]} />
              <meshStandardMaterial
                color="#001a33"
                metalness={0.9}
                roughness={0.1}
                emissive="#0088cc"
                emissiveIntensity={1.5}
              />
            </mesh>
            {/* Energy core */}
            <mesh>
              <sphereGeometry args={[0.08, 8, 8]} />
              <meshStandardMaterial
                color="#00c8ff"
                emissive="#00c8ff"
                emissiveIntensity={4}
              />
            </mesh>
            <pointLight color="#00c8ff" intensity={2} distance={5} />
          </group>
        )}

        {/* Legacy staff tip glow (default fallback for undefined weapon states) */}
        {!["rifle", "shotgun", "plasma"].includes(currentWeapon) && (
          <>
            <mesh rotation={[0, 0, 0.3]} castShadow ref={weaponRef}>
              <cylinderGeometry args={[0.04, 0.04, 1.4, 8]} />
              <meshStandardMaterial
                color="#1a5a30"
                metalness={0.7}
                roughness={0.3}
              />
            </mesh>
            <mesh position={[0.35, 0.7, 0]}>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshStandardMaterial
                color="#00ff88"
                emissive="#00ff88"
                emissiveIntensity={3}
              />
            </mesh>
            <pointLight
              position={[0.35, 0.7, 0]}
              color="#00ff88"
              intensity={1.5}
              distance={4}
            />
          </>
        )}
      </group>

      {/* HP bar (3D plane above head) */}
      <group position={[0, 2.5, 0]}>
        <mesh>
          <planeGeometry args={[0.8, 0.1]} />
          <meshBasicMaterial color="#330000" />
        </mesh>
        <mesh position={[(hpFraction - 1) * 0.4, 0, 0.001]}>
          <planeGeometry args={[0.8 * hpFraction, 0.08]} />
          <meshBasicMaterial
            color={
              hpFraction > 0.5
                ? "#00ff44"
                : hpFraction > 0.25
                  ? "#ffaa00"
                  : "#ff2200"
            }
          />
        </mesh>
      </group>
    </group>
  );
}
