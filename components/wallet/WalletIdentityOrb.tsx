"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles as DreiSparkles } from "@react-three/drei";
import * as THREE from "three";

const statusMap = {
  normal: { color: "#3b82f6", accent: "#22d3ee", label: "Stable" },
  success: { color: "#22c55e", accent: "#7dd3fc", label: "Verified" },
  warning: { color: "#f59e0b", accent: "#facc15", label: "Watch" },
  danger: { color: "#ef4444", accent: "#fb7185", label: "Risk" },
} as const;

type OrbStatus = keyof typeof statusMap;

function OrbScene({ status }: { status: OrbStatus }) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const tone = useMemo(() => statusMap[status], [status]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.24;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.18) * 0.16;
    }

    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.4;
    }
  });

  return (
    <Float speed={1.4} floatIntensity={0.3} rotationIntensity={0.16}>
      <group ref={groupRef}>
        <mesh>
          <icosahedronGeometry args={[1.1, 12]} />
          <meshPhysicalMaterial
            color={tone.color}
            emissive={tone.color}
            emissiveIntensity={0.35}
            roughness={0.08}
            metalness={0.22}
            clearcoat={1}
            transparent
            opacity={0.96}
          />
        </mesh>
        <mesh ref={ringRef} rotation={[0.9, 0, 0]}>
          <torusGeometry args={[1.6, 0.03, 24, 160]} />
          <meshBasicMaterial color={tone.accent} transparent opacity={0.72} />
        </mesh>
        <mesh rotation={[-0.4, 0.5, 0.3]}>
          <torusGeometry args={[1.95, 0.012, 16, 120]} />
          <meshBasicMaterial color="#dbeafe" transparent opacity={0.28} />
        </mesh>
        <DreiSparkles count={30} size={2.2} scale={[4, 4, 2]} color={tone.accent} speed={0.3} opacity={0.65} />
      </group>
    </Float>
  );
}

export function WalletIdentityOrb({ status = "normal" }: { status?: OrbStatus }) {
  const tone = statusMap[status];

  return (
    <div className="relative h-[18rem] overflow-hidden rounded-lg border border-cyan-400/16 bg-[radial-gradient(circle_at_50%_35%,rgba(59,130,246,0.2),transparent_32%),linear-gradient(180deg,rgba(17,27,49,0.88),rgba(8,14,28,0.92))]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.1),transparent_48%)]" />
      <div className="absolute left-4 top-4 z-10 rounded-md border border-white/10 bg-black/20 px-3 py-2">
        <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Identity Orb</div>
        <div className="mt-1 text-sm font-semibold text-white">{tone.label} State</div>
      </div>
      <Canvas camera={{ position: [0, 0, 4.3], fov: 42 }} gl={{ alpha: true, antialias: true }} dpr={[1, 1.5]}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.65} />
          <pointLight position={[2.6, 2.6, 3.2]} intensity={15} color={tone.color} />
          <pointLight position={[-2.4, -1.2, 2]} intensity={10} color={tone.accent} />
          <OrbScene status={status} />
        </Suspense>
      </Canvas>
    </div>
  );
}
