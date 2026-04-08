import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import { GameScene } from "./GameScene";
import { useGameStore } from "./stores/gameStore";
import { resumeAudio } from "./utils/audioEngine";

interface GameCanvasProps {
  keys: React.MutableRefObject<Set<string>>;
  joystick: React.MutableRefObject<{ x: number; y: number }>;
}

export function GameCanvas({ keys, joystick }: GameCanvasProps) {
  const { gamePhase } = useGameStore();

  useEffect(() => {
    resumeAudio();
  }, []);

  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          alpha: false,
        }}
        style={{ background: "#020503" }}
        onPointerDown={() => resumeAudio()}
      >
        <Suspense fallback={null}>
          {gamePhase !== "start" && (
            <GameScene keys={keys} joystick={joystick} />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
