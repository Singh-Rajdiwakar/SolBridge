"use client";

import { Suspense, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { cn } from "@/utils/cn";

type NetworkNode = {
  position: [number, number, number];
  scale: number;
};

const nodes: NetworkNode[] = [
  { position: [-2.6, 1.65, 0], scale: 0.9 },
  { position: [-1.55, 0.45, 0], scale: 1 },
  { position: [-0.45, 1.9, 0], scale: 0.8 },
  { position: [0.85, 0.5, 0], scale: 0.92 },
  { position: [2.05, 1.35, 0], scale: 0.75 },
  { position: [-2.15, -1.05, 0], scale: 0.82 },
  { position: [-0.9, -1.75, 0], scale: 1.1 },
  { position: [0.55, -1.1, 0], scale: 0.78 },
  { position: [2.15, -0.4, 0], scale: 0.88 },
  { position: [0.02, 0.08, 0], scale: 1.25 },
];

function BackgroundNetwork() {
  const groupRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);

  const lineGeometry = useMemo(() => {
    const positions: number[] = [];
    const links: Array<[number, number]> = [
      [0, 1],
      [1, 2],
      [2, 9],
      [9, 3],
      [3, 4],
      [1, 5],
      [5, 6],
      [6, 9],
      [9, 7],
      [7, 8],
      [3, 8],
      [1, 9],
      [0, 9],
      [6, 7],
      [2, 3],
    ];

    links.forEach(([from, to]) => {
      positions.push(...nodes[from].position, ...nodes[to].position);
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.08) * 0.14;
      groupRef.current.rotation.y = Math.cos(state.clock.elapsedTime * 0.06) * 0.12;
    }

    if (pulseRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.25) * 0.18;
      pulseRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={groupRef}>
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial color="#4cc9ff" transparent opacity={0.18} />
      </lineSegments>

      {nodes.map((node, index) => (
        <mesh key={`${node.position.join("-")}-${index}`} position={node.position} scale={node.scale}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial
            color={index % 2 === 0 ? "#3b82f6" : "#22d3ee"}
            emissive={index % 2 === 0 ? "#3b82f6" : "#22d3ee"}
            emissiveIntensity={0.85}
            roughness={0.18}
            metalness={0.4}
          />
        </mesh>
      ))}

      <mesh ref={pulseRef} position={[0, 0, -0.2]}>
        <ringGeometry args={[0.28, 0.34, 64]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.36} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export function WalletUltraBackground({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <motion.div
        className="absolute -left-40 top-[-12%] h-[26rem] w-[26rem] rounded-full bg-blue-500/12 blur-[150px]"
        animate={{ x: [0, 36, -12, 0], y: [0, -18, 12, 0] }}
        transition={{ duration: 18, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[-10%] top-[8%] h-[24rem] w-[24rem] rounded-full bg-cyan-400/10 blur-[150px]"
        animate={{ x: [0, -28, 16, 0], y: [0, 18, -12, 0] }}
        transition={{ duration: 16, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.14),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(34,211,238,0.12),transparent_24%),linear-gradient(180deg,rgba(4,9,20,0.3),rgba(4,9,20,0.74))]" />
      <div className="absolute inset-0 hidden lg:block opacity-90">
        <Canvas camera={{ position: [0, 0, 6], fov: 46 }} gl={{ alpha: true, antialias: true }} dpr={[1, 1.5]}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.7} />
            <pointLight position={[2, 2, 4]} intensity={12} color="#3b82f6" />
            <pointLight position={[-3, -2, 3]} intensity={8} color="#22d3ee" />
            <BackgroundNetwork />
          </Suspense>
        </Canvas>
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,22,0.1),rgba(5,8,22,0.55)_45%,rgba(5,8,22,0.88))]" />
    </div>
  );
}
