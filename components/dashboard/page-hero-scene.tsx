"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Line, RoundedBox, Sparkles } from "@react-three/drei";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";

import type { PageHeroVariant } from "./page-hero-visual";

type Triple = [number, number, number];

type ScenePalette = {
  primary: string;
  secondary: string;
  tertiary: string;
  warning: string;
  neutral: string;
  speed: number;
  sparkles: string;
};

const PALETTES: Record<PageHeroVariant, ScenePalette> = {
  dashboard: { primary: "#f2c94c", secondary: "#22d3ee", tertiary: "#fff6db", warning: "#fb7185", neutral: "#dad6cf", speed: 0.42, sparkles: "#f8e3a0" },
  admin: { primary: "#f2c94c", secondary: "#c89b2c", tertiary: "#fff6db", warning: "#fb7185", neutral: "#d4d0c8", speed: 0.32, sparkles: "#f4d573" },
  wallet: { primary: "#f2c94c", secondary: "#22d3ee", tertiary: "#fff6db", warning: "#fb7185", neutral: "#d8d5cf", speed: 0.24, sparkles: "#f7e5ab" },
  markets: { primary: "#f2c94c", secondary: "#22d3ee", tertiary: "#fef4d0", warning: "#fb7185", neutral: "#dad6cf", speed: 0.55, sparkles: "#f2c94c" },
  trading: { primary: "#f2c94c", secondary: "#22d3ee", tertiary: "#fef4d0", warning: "#ef4444", neutral: "#dcd9d1", speed: 0.82, sparkles: "#f7d86b" },
  transfer: { primary: "#f2c94c", secondary: "#22d3ee", tertiary: "#fff6db", warning: "#fb7185", neutral: "#d8d5cf", speed: 0.5, sparkles: "#d7f9ff" },
  stake: { primary: "#f2c94c", secondary: "#fff6db", tertiary: "#22d3ee", warning: "#fb7185", neutral: "#dad6cf", speed: 0.22, sparkles: "#f8e3a0" },
  pools: { primary: "#f2c94c", secondary: "#22d3ee", tertiary: "#fff6db", warning: "#fb7185", neutral: "#d9d5cd", speed: 0.42, sparkles: "#d7f9ff" },
  borrow: { primary: "#f2c94c", secondary: "#22d3ee", tertiary: "#fff6db", warning: "#fb7185", neutral: "#ddd7cc", speed: 0.28, sparkles: "#f8d873" },
  governance: { primary: "#f2c94c", secondary: "#22d3ee", tertiary: "#fff6db", warning: "#fb7185", neutral: "#dad5cb", speed: 0.26, sparkles: "#f4d573" },
  treasury: { primary: "#f2c94c", secondary: "#fff6db", tertiary: "#22d3ee", warning: "#fb7185", neutral: "#dcd6cb", speed: 0.18, sparkles: "#f7e5ab" },
  tokens: { primary: "#f2c94c", secondary: "#22d3ee", tertiary: "#fff6db", warning: "#fb7185", neutral: "#dad5cc", speed: 0.36, sparkles: "#f2c94c" },
  nfts: { primary: "#f2c94c", secondary: "#22d3ee", tertiary: "#fff6db", warning: "#fb7185", neutral: "#dad6cf", speed: 0.34, sparkles: "#d7f9ff" },
  swap: { primary: "#f2c94c", secondary: "#22d3ee", tertiary: "#fff6db", warning: "#fb7185", neutral: "#d7d3cd", speed: 0.44, sparkles: "#f4d573" },
  analytics: { primary: "#f2c94c", secondary: "#22d3ee", tertiary: "#fff6db", warning: "#fb7185", neutral: "#ddd9d1", speed: 0.34, sparkles: "#d7f9ff" },
  assistant: { primary: "#f2c94c", secondary: "#22d3ee", tertiary: "#d7f9ff", warning: "#fb7185", neutral: "#dfdbd4", speed: 0.3, sparkles: "#22d3ee" },
  strategy: { primary: "#f2c94c", secondary: "#22d3ee", tertiary: "#fff6db", warning: "#fb7185", neutral: "#dad5cc", speed: 0.3, sparkles: "#f8e3a0" },
  tax: { primary: "#f2c94c", secondary: "#22d3ee", tertiary: "#fff6db", warning: "#fb7185", neutral: "#dad6cf", speed: 0.2, sparkles: "#f4d573" },
  risk: { primary: "#f2c94c", secondary: "#ef4444", tertiary: "#fff6db", warning: "#fb7185", neutral: "#dad6cf", speed: 0.36, sparkles: "#fb7185" },
  social: { primary: "#f2c94c", secondary: "#22d3ee", tertiary: "#fff6db", warning: "#fb7185", neutral: "#ddd8d0", speed: 0.32, sparkles: "#22d3ee" },
  security: { primary: "#f2c94c", secondary: "#22d3ee", tertiary: "#fff6db", warning: "#fb7185", neutral: "#dad7d0", speed: 0.26, sparkles: "#d7f9ff" },
  network: { primary: "#f2c94c", secondary: "#22d3ee", tertiary: "#d7f9ff", warning: "#fb7185", neutral: "#dcd8d0", speed: 0.42, sparkles: "#22d3ee" },
  explorer: { primary: "#f2c94c", secondary: "#22d3ee", tertiary: "#fff6db", warning: "#fb7185", neutral: "#ded8cf", speed: 0.52, sparkles: "#d7f9ff" },
  devtools: { primary: "#f2c94c", secondary: "#22d3ee", tertiary: "#fff6db", warning: "#fb7185", neutral: "#ddd9d2", speed: 0.34, sparkles: "#f2c94c" },
  portfolio: { primary: "#f2c94c", secondary: "#22d3ee", tertiary: "#fff6db", warning: "#fb7185", neutral: "#dfdbd2", speed: 0.28, sparkles: "#f8e3a0" },
  settings: { primary: "#f2c94c", secondary: "#22d3ee", tertiary: "#fff6db", warning: "#fb7185", neutral: "#dad6cf", speed: 0.18, sparkles: "#f4d573" },
  generic: { primary: "#f2c94c", secondary: "#22d3ee", tertiary: "#fff6db", warning: "#fb7185", neutral: "#ddd9d2", speed: 0.28, sparkles: "#f8e3a0" },
};

function SceneLights({ palette, intensity = 1 }: { palette: ScenePalette; intensity?: number }) {
  return (
    <>
      <ambientLight intensity={0.65 * intensity} />
      <directionalLight position={[3.2, 4, 4.6]} intensity={2.6 * intensity} color={palette.tertiary} />
      <pointLight position={[-4.2, 2.4, 2.8]} intensity={18 * intensity} distance={14} color={palette.secondary} />
      <pointLight position={[4, -1.6, 2.2]} intensity={20 * intensity} distance={14} color={palette.primary} />
      <spotLight position={[0, 5.5, 4.6]} angle={0.42} penumbra={1} intensity={24 * intensity} color="#fff7e0" />
    </>
  );
}

function OrbitRing({
  radius,
  tube = 0.035,
  color,
  opacity = 0.46,
  speed = 0.24,
  rotation = [0, 0, 0],
}: {
  radius: number;
  tube?: number;
  color: string;
  opacity?: number;
  speed?: number;
  rotation?: Triple;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.z = rotation[2] + state.clock.elapsedTime * speed;
    }
  });

  return (
    <mesh ref={ref} rotation={rotation}>
      <torusGeometry args={[radius, tube, 18, 160]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} />
    </mesh>
  );
}

function GlowSphere({
  color,
  position = [0, 0, 0],
  radius = 0.62,
  emissiveIntensity = 0.4,
}: {
  color: string;
  position?: Triple;
  radius?: number;
  emissiveIntensity?: number;
}) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[radius, 40, 40]} />
      <meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} roughness={0.14} metalness={0.42} clearcoat={1} clearcoatRoughness={0.08} />
    </mesh>
  );
}

function SoftBar({
  position,
  size,
  color,
}: {
  position: Triple;
  size: Triple;
  color: string;
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} metalness={0.62} roughness={0.28} />
    </mesh>
  );
}

function WalletVaultVisual({ palette, reducedMotion }: { palette: ScenePalette; reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) {
      return;
    }

    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = reducedMotion ? 0.18 : Math.sin(t * 0.28) * 0.18 + 0.32;
    groupRef.current.rotation.x = reducedMotion ? 0.12 : Math.cos(t * 0.24) * 0.05 + 0.12;
    groupRef.current.position.y = reducedMotion ? 0 : Math.sin(t * 0.42) * 0.08;
  });

  return (
    <group ref={groupRef}>
      <RoundedBox args={[2.5, 1.54, 0.78]} radius={0.22} smoothness={6} rotation={[0.12, 0.24, -0.08]}>
        <meshPhysicalMaterial color="#121416" metalness={0.96} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />
      </RoundedBox>
      <RoundedBox args={[1.28, 0.88, 0.18]} radius={0.16} smoothness={8} position={[0, 0, 0.42]}>
        <meshPhysicalMaterial color={palette.primary} emissive={palette.primary} emissiveIntensity={0.34} metalness={0.66} roughness={0.2} clearcoat={1} />
      </RoundedBox>
      <GlowSphere color={palette.tertiary} position={[0, 0, 0.6]} radius={0.22} emissiveIntensity={0.65} />
      <SoftBar position={[-1.46, 0, 0.12]} size={[0.18, 0.78, 0.18]} color={palette.secondary} />
      <SoftBar position={[1.46, 0, 0.12]} size={[0.18, 0.78, 0.18]} color={palette.primary} />
      <OrbitRing radius={1.7} tube={0.028} color={palette.secondary} opacity={0.24} speed={0.22} rotation={[0.92, 0.3, 0.18]} />
      <Line points={[[-1.35, -0.92, 0.22], [-0.22, -0.18, 0.78], [1.24, 0.88, 0.22]]} color={palette.primary} transparent opacity={0.56} lineWidth={1.2} />
    </group>
  );
}

function MarketsPulseVisual({ palette, reducedMotion }: { palette: ScenePalette; reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) {
      return;
    }

    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = reducedMotion ? -0.22 : -0.26 + Math.sin(t * 0.44) * 0.18;
    groupRef.current.rotation.x = 0.12;
    groupRef.current.position.y = reducedMotion ? 0 : Math.sin(t * 0.84) * 0.06;
  });

  return (
    <group ref={groupRef}>
      {[
        { position: [-1.4, -0.22, -0.42] as Triple, radius: 0.46, color: palette.secondary },
        { position: [0, 0.18, 0.08] as Triple, radius: 0.7, color: palette.primary },
        { position: [1.42, -0.04, -0.34] as Triple, radius: 0.54, color: palette.tertiary },
      ].map((coin) => (
        <mesh key={coin.position.join("-")} position={coin.position} rotation={[Math.PI / 2.4, 0.34, 0]}>
          <cylinderGeometry args={[coin.radius, coin.radius, 0.18, 48]} />
          <meshPhysicalMaterial color={coin.color} emissive={coin.color} emissiveIntensity={0.24} metalness={0.9} roughness={0.18} clearcoat={1} />
        </mesh>
      ))}
      {[
        [-1.74, -0.92, -1.1, 0.48],
        [-0.96, -1.02, -0.78, 0.84],
        [0.22, -0.98, -1.04, 1.28],
        [1.14, -0.92, -0.88, 0.98],
      ].map(([x, y, z, h]) => (
        <SoftBar key={`${x}-${z}`} position={[x as number, (y as number) + (h as number) / 2, z as number]} size={[0.24, h as number, 0.24]} color={palette.primary} />
      ))}
      <Line points={[[-2.05, -0.62, -0.88], [-1.2, -0.22, -0.54], [-0.32, 0.48, -0.08], [0.54, 0.14, 0.12], [1.32, 0.64, -0.2], [2.02, 0.92, 0.08]]} color={palette.primary} transparent opacity={0.84} lineWidth={1.5} />
    </group>
  );
}

function TradingSignalVisual({ palette, reducedMotion }: { palette: ScenePalette; reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) {
      return;
    }

    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = reducedMotion ? 0.24 : 0.2 + t * 0.22;
    groupRef.current.rotation.x = 0.18 + Math.sin(t * 0.55) * 0.06;
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0.2, 0.52, 0.16]} rotation={[0.34, 0.42, 0]}>
        <octahedronGeometry args={[0.8, 0]} />
        <meshPhysicalMaterial color={palette.primary} emissive={palette.primary} emissiveIntensity={0.32} metalness={0.82} roughness={0.18} clearcoat={1} />
      </mesh>
      {[
        [-1.44, -0.56, -0.82, 1.3, palette.secondary],
        [-0.74, -0.52, -0.28, 0.92, palette.primary],
        [0.04, -0.5, -0.56, 1.62, palette.tertiary],
        [0.86, -0.54, -0.18, 1.1, palette.primary],
        [1.58, -0.5, -0.72, 1.48, palette.secondary],
      ].map(([x, y, z, height, color]) => (
        <group key={`${x}-${z}`} position={[x as number, (y as number) + (height as number) / 2, z as number]}>
          <mesh>
            <boxGeometry args={[0.12, height as number, 0.12]} />
            <meshStandardMaterial color="#d8d5cf" emissive="#d8d5cf" emissiveIntensity={0.12} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.34, Math.max(0.34, (height as number) * 0.38), 0.34]} />
            <meshStandardMaterial color={color as string} emissive={color as string} emissiveIntensity={0.26} metalness={0.72} roughness={0.24} />
          </mesh>
        </group>
      ))}
      <Line points={[[-1.92, -0.2, 0.48], [-1.1, 0.1, 0.22], [-0.34, 0.72, 0.1], [0.24, 0.28, 0.42], [0.92, 0.94, 0.18], [1.9, 0.52, 0.48]]} color={palette.secondary} transparent opacity={0.62} lineWidth={1.3} />
    </group>
  );
}

function TransferFlowVisual({ palette, reducedMotion }: { palette: ScenePalette; reducedMotion: boolean }) {
  const particleRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.8, -0.34, -0.12),
        new THREE.Vector3(-0.6, 0.92, 0.54),
        new THREE.Vector3(0.66, -0.56, 0.22),
        new THREE.Vector3(1.86, 0.28, -0.06),
      ]),
    [],
  );
  const points = useMemo(() => curve.getPoints(80).map((point) => point.toArray() as Triple), [curve]);

  useFrame((state) => {
    if (particleRef.current) {
      const progress = ((state.clock.elapsedTime * (reducedMotion ? 0.08 : 0.2)) % 1 + 1) % 1;
      particleRef.current.position.copy(curve.getPointAt(progress));
    }

    if (groupRef.current) {
      groupRef.current.rotation.y = 0.12 + Math.sin(state.clock.elapsedTime * 0.22) * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      <GlowSphere color={palette.secondary} position={[-1.9, -0.34, -0.08]} radius={0.38} emissiveIntensity={0.45} />
      <GlowSphere color={palette.primary} position={[1.92, 0.28, 0.02]} radius={0.44} emissiveIntensity={0.52} />
      <Line points={points} color={palette.primary} transparent opacity={0.84} lineWidth={1.55} />
      <Line points={points} color={palette.secondary} transparent opacity={0.22} lineWidth={3.2} />
      <mesh ref={particleRef}>
        <sphereGeometry args={[0.14, 24, 24]} />
        <meshBasicMaterial color={palette.tertiary} />
      </mesh>
    </group>
  );
}

function StakeYieldVisual({ palette, reducedMotion }: { palette: ScenePalette; reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) {
      return;
    }

    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = reducedMotion ? 0.28 : t * 0.12 + 0.18;
    groupRef.current.position.y = reducedMotion ? 0 : Math.sin(t * 0.24) * 0.06;
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, -0.12, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 2.28, 28]} />
        <meshStandardMaterial color={palette.primary} emissive={palette.primary} emissiveIntensity={0.18} metalness={0.5} roughness={0.28} />
      </mesh>
      <GlowSphere color={palette.primary} position={[0, 0.2, 0.14]} radius={0.46} emissiveIntensity={0.45} />
      <OrbitRing radius={1.12} tube={0.03} color={palette.primary} opacity={0.42} speed={0.14} rotation={[0.9, 0.28, 0]} />
      <OrbitRing radius={1.42} tube={0.025} color={palette.secondary} opacity={0.2} speed={-0.12} rotation={[1.34, 0, 0.4]} />
      <OrbitRing radius={1.72} tube={0.02} color={palette.tertiary} opacity={0.18} speed={0.18} rotation={[0.22, 0.8, 0.4]} />
      {[0.92, 1.28, 1.64].map((y) => (
        <mesh key={y} position={[0, y, 0.08]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshBasicMaterial color={palette.tertiary} />
        </mesh>
      ))}
    </group>
  );
}

function LiquidityOrbitVisual({ palette, reducedMotion }: { palette: ScenePalette; reducedMotion: boolean }) {
  const leftRef = useRef<THREE.Mesh>(null);
  const rightRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (leftRef.current) {
      leftRef.current.position.y = -0.1 + Math.sin(t * (reducedMotion ? 0.18 : 0.48)) * 0.18;
    }

    if (rightRef.current) {
      rightRef.current.position.y = 0.14 + Math.sin(t * (reducedMotion ? 0.18 : 0.48) + Math.PI) * 0.18;
    }

    if (groupRef.current) {
      groupRef.current.rotation.y = reducedMotion ? -0.2 : -0.18 + Math.sin(t * 0.18) * 0.12;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={leftRef} position={[-1.18, -0.08, 0]}>
        <sphereGeometry args={[0.62, 34, 34]} />
        <meshPhysicalMaterial color={palette.secondary} emissive={palette.secondary} emissiveIntensity={0.26} metalness={0.52} roughness={0.22} clearcoat={1} />
      </mesh>
      <mesh ref={rightRef} position={[1.18, 0.12, 0.12]}>
        <sphereGeometry args={[0.68, 34, 34]} />
        <meshPhysicalMaterial color={palette.primary} emissive={palette.primary} emissiveIntensity={0.24} metalness={0.6} roughness={0.18} clearcoat={1} />
      </mesh>
      <Line points={[[-1.18, -0.08, 0], [-0.2, 0.66, 0.42], [0.54, -0.22, 0.16], [1.18, 0.12, 0.12]]} color={palette.primary} transparent opacity={0.68} lineWidth={1.3} />
      <Line points={[[-1.18, -0.08, 0], [-0.44, -0.84, -0.18], [0.3, 0.38, -0.06], [1.18, 0.12, 0.12]]} color={palette.secondary} transparent opacity={0.5} lineWidth={1.3} />
      <OrbitRing radius={1.86} tube={0.024} color={palette.tertiary} opacity={0.16} speed={0.1} rotation={[0.42, 0.3, 0.2]} />
    </group>
  );
}

function BorrowBalanceVisual({ palette, reducedMotion }: { palette: ScenePalette; reducedMotion: boolean }) {
  const beamRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (beamRef.current) {
      beamRef.current.rotation.z = reducedMotion ? -0.08 : Math.sin(state.clock.elapsedTime * 0.28) * 0.08 - 0.06;
    }
  });

  return (
    <group>
      <mesh position={[0, -0.48, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 1.7, 24]} />
        <meshStandardMaterial color={palette.neutral} metalness={0.7} roughness={0.24} />
      </mesh>
      <mesh position={[0, -1.32, 0]}>
        <cylinderGeometry args={[0.92, 1.18, 0.14, 36]} />
        <meshStandardMaterial color="#15181b" metalness={0.72} roughness={0.36} />
      </mesh>
      <group ref={beamRef} position={[0, 0.2, 0]}>
        <mesh>
          <boxGeometry args={[3.3, 0.12, 0.14]} />
          <meshStandardMaterial color={palette.primary} emissive={palette.primary} emissiveIntensity={0.18} metalness={0.74} roughness={0.2} />
        </mesh>
        <mesh position={[-1.18, -0.44, 0]}>
          <sphereGeometry args={[0.54, 30, 30]} />
          <meshPhysicalMaterial color={palette.secondary} emissive={palette.secondary} emissiveIntensity={0.18} metalness={0.48} roughness={0.22} />
        </mesh>
        <mesh position={[1.22, 0.34, 0]}>
          <sphereGeometry args={[0.72, 30, 30]} />
          <meshPhysicalMaterial color={palette.primary} emissive={palette.primary} emissiveIntensity={0.24} metalness={0.64} roughness={0.2} />
        </mesh>
      </group>
      <OrbitRing radius={1.62} tube={0.02} color={palette.tertiary} opacity={0.16} speed={0.08} rotation={[1.08, 0.22, 0.08]} />
    </group>
  );
}

function GovernanceNodeVisual({ palette, reducedMotion }: { palette: ScenePalette; reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const nodes = [
    [-1.36, 0.74, -0.12],
    [1.38, 0.62, 0.06],
    [1.04, -0.98, 0.14],
    [-1.1, -1.04, -0.04],
  ] as Triple[];

  useFrame((state) => {
    if (!groupRef.current) {
      return;
    }

    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = reducedMotion ? 0.3 : t * 0.14;
    groupRef.current.rotation.x = 0.14 + Math.sin(t * 0.18) * 0.04;
  });

  return (
    <group ref={groupRef}>
      <mesh rotation={[0.42, 0.6, 0]}>
        <dodecahedronGeometry args={[0.78, 0]} />
        <meshPhysicalMaterial color={palette.primary} emissive={palette.primary} emissiveIntensity={0.3} metalness={0.7} roughness={0.18} clearcoat={1} />
      </mesh>
      {nodes.map((position, index) => (
        <mesh key={position.join("-")} position={position}>
          <sphereGeometry args={[index === 1 ? 0.26 : 0.2, 24, 24]} />
          <meshPhysicalMaterial color={index % 2 === 0 ? palette.secondary : palette.tertiary} emissive={index % 2 === 0 ? palette.secondary : palette.primary} emissiveIntensity={0.24} metalness={0.46} roughness={0.22} />
        </mesh>
      ))}
      {nodes.map((node) => (
        <Line key={`line-${node.join("-")}`} points={[[0, 0, 0], node]} color={palette.primary} transparent opacity={0.34} lineWidth={1.1} />
      ))}
    </group>
  );
}

function TreasuryReserveVisual({ palette, reducedMotion }: { palette: ScenePalette; reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = reducedMotion ? 0.18 : 0.14 + Math.sin(state.clock.elapsedTime * 0.16) * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      {[
        [-1.1, -0.36, -0.42, 1.08],
        [0, -0.18, 0.1, 1.52],
        [1.08, -0.26, -0.18, 1.28],
      ].map(([x, y, z, height], index) => (
        <RoundedBox key={`${x}-${height}`} args={[0.82, height as number, 0.82]} radius={0.12} smoothness={6} position={[x as number, (y as number) + (height as number) / 2 - 0.62, z as number]}>
          <meshPhysicalMaterial color={index === 1 ? palette.primary : "#1a1c1f"} emissive={index === 1 ? palette.primary : palette.secondary} emissiveIntensity={index === 1 ? 0.24 : 0.1} metalness={0.84} roughness={0.18} clearcoat={1} />
        </RoundedBox>
      ))}
      <OrbitRing radius={1.86} tube={0.024} color={palette.tertiary} opacity={0.18} speed={0.06} rotation={[0.82, 0.28, 0.12]} />
    </group>
  );
}

function TokenMintVisual({ palette, reducedMotion }: { palette: ScenePalette; reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) {
      return;
    }

    groupRef.current.rotation.y = reducedMotion ? 0.28 : state.clock.elapsedTime * 0.18;
    groupRef.current.rotation.x = 0.18;
  });

  return (
    <group ref={groupRef}>
      {[0, 0.18, 0.36, 0.54].map((offset, index) => (
        <mesh key={offset} position={[0, -0.6 + offset, 0]}>
          <cylinderGeometry args={[0.94, 0.94, 0.12, 52]} />
          <meshPhysicalMaterial color={index % 2 === 0 ? palette.primary : palette.tertiary} emissive={palette.primary} emissiveIntensity={0.14} metalness={0.88} roughness={0.16} clearcoat={1} />
        </mesh>
      ))}
      <mesh position={[0, 0.72, 0]}>
        <torusKnotGeometry args={[0.38, 0.1, 120, 18]} />
        <meshPhysicalMaterial color={palette.secondary} emissive={palette.secondary} emissiveIntensity={0.22} metalness={0.64} roughness={0.22} />
      </mesh>
      <OrbitRing radius={1.46} tube={0.02} color={palette.primary} opacity={0.28} speed={0.14} rotation={[1.08, 0.22, 0.42]} />
    </group>
  );
}

function NFTVisual({ palette, reducedMotion }: { palette: ScenePalette; reducedMotion: boolean }) {
  const frameRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!frameRef.current) {
      return;
    }

    const t = state.clock.elapsedTime;
    frameRef.current.rotation.y = reducedMotion ? -0.18 : -0.16 + Math.sin(t * 0.26) * 0.12;
    frameRef.current.rotation.x = 0.12 + Math.cos(t * 0.22) * 0.04;
    frameRef.current.position.y = reducedMotion ? 0 : Math.sin(t * 0.44) * 0.08;
  });

  return (
    <group ref={frameRef}>
      <RoundedBox args={[1.84, 2.3, 0.22]} radius={0.22} smoothness={8}>
        <meshPhysicalMaterial color="#121416" metalness={0.92} roughness={0.2} clearcoat={1} />
      </RoundedBox>
      <RoundedBox args={[1.44, 1.9, 0.08]} radius={0.18} smoothness={8} position={[0, 0, 0.12]}>
        <meshPhysicalMaterial color={palette.secondary} emissive={palette.secondary} emissiveIntensity={0.18} metalness={0.28} roughness={0.08} transparent opacity={0.42} />
      </RoundedBox>
      <mesh position={[0, 0.04, 0.34]} rotation={[0.18, 0.42, 0.08]}>
        <octahedronGeometry args={[0.52, 0]} />
        <meshPhysicalMaterial color={palette.primary} emissive={palette.primary} emissiveIntensity={0.34} metalness={0.7} roughness={0.14} clearcoat={1} />
      </mesh>
    </group>
  );
}

function SwapExchangeVisual({ palette, reducedMotion }: { palette: ScenePalette; reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime;
      groupRef.current.rotation.y = reducedMotion ? 0.24 : 0.16 + Math.sin(t * 0.32) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      <GlowSphere color={palette.primary} position={[-1.1, 0.18, 0]} radius={0.54} emissiveIntensity={0.42} />
      <GlowSphere color={palette.secondary} position={[1.12, -0.14, 0.1]} radius={0.5} emissiveIntensity={0.42} />
      <OrbitRing radius={1.52} tube={0.032} color={palette.primary} opacity={0.28} speed={0.16} rotation={[0.6, 0.26, 0.2]} />
      <OrbitRing radius={1.18} tube={0.026} color={palette.secondary} opacity={0.28} speed={-0.18} rotation={[2.2, 0.22, -0.2]} />
      <Line points={[[-1.1, 0.18, 0], [-0.2, 0.82, 0.22], [0.62, -0.58, 0.14], [1.12, -0.14, 0.1]]} color={palette.tertiary} transparent opacity={0.44} lineWidth={1.2} />
    </group>
  );
}

function AnalyticsCoreVisual({ palette, reducedMotion }: { palette: ScenePalette; reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) {
      return;
    }

    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = reducedMotion ? 0.2 : t * 0.14;
    groupRef.current.rotation.x = 0.18 + Math.sin(t * 0.16) * 0.05;
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <icosahedronGeometry args={[0.92, 2]} />
        <meshPhysicalMaterial color={palette.primary} emissive={palette.primary} emissiveIntensity={0.22} metalness={0.82} roughness={0.22} clearcoat={1} />
      </mesh>
      {[
        [-1.72, -0.88, -0.88, 0.84],
        [-1.1, -0.92, -0.48, 1.18],
        [-0.44, -0.96, -0.2, 1.52],
        [0.24, -0.9, -0.42, 1.08],
        [0.92, -0.86, -0.78, 1.34],
        [1.54, -0.82, -0.34, 0.96],
      ].map(([x, y, z, h], index) => (
        <SoftBar key={`${x}-${h}`} position={[x as number, (y as number) + (h as number) / 2, z as number]} size={[0.22, h as number, 0.22]} color={index % 2 === 0 ? palette.secondary : palette.primary} />
      ))}
      <Line points={[[-1.92, -0.12, 0.62], [-1.2, 0.24, 0.2], [-0.38, 0.86, 0.4], [0.4, 0.34, 0.16], [1.16, 0.92, 0.28], [1.92, 0.58, 0.44]]} color={palette.secondary} transparent opacity={0.54} lineWidth={1.2} />
      <OrbitRing radius={1.58} tube={0.02} color={palette.tertiary} opacity={0.18} speed={0.14} rotation={[1.08, 0.12, 0.28]} />
    </group>
  );
}

function AssistantCoreVisual({ palette, reducedMotion }: { palette: ScenePalette; reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const nodes = [
    [-1.38, 0.64, -0.06],
    [1.42, 0.78, 0.02],
    [0.96, -1.02, 0.1],
    [-0.96, -0.92, -0.08],
    [0.08, 1.32, 0.18],
  ] as Triple[];

  useFrame((state) => {
    if (!groupRef.current) {
      return;
    }

    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = reducedMotion ? 0.3 : t * 0.12;
    groupRef.current.rotation.x = 0.16 + Math.sin(t * 0.24) * 0.05;
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <dodecahedronGeometry args={[0.76, 0]} />
        <meshPhysicalMaterial color={palette.secondary} emissive={palette.secondary} emissiveIntensity={0.2} metalness={0.5} roughness={0.1} clearcoat={1} />
      </mesh>
      <mesh rotation={[0.2, 0.54, 0]}>
        <torusKnotGeometry args={[1.06, 0.05, 140, 24]} />
        <meshBasicMaterial color={palette.primary} transparent opacity={0.4} />
      </mesh>
      {nodes.map((node, index) => (
        <mesh key={node.join("-")} position={node}>
          <sphereGeometry args={[index === 4 ? 0.26 : 0.18, 24, 24]} />
          <meshPhysicalMaterial color={index % 2 === 0 ? palette.primary : palette.tertiary} emissive={index % 2 === 0 ? palette.primary : palette.secondary} emissiveIntensity={0.24} metalness={0.42} roughness={0.18} />
        </mesh>
      ))}
      {nodes.map((node) => (
        <Line key={`assistant-${node.join("-")}`} points={[[0, 0, 0], node]} color={palette.tertiary} transparent opacity={0.28} lineWidth={1} />
      ))}
    </group>
  );
}

function StrategyMatrixVisual({ palette, reducedMotion }: { palette: ScenePalette; reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) {
      return;
    }

    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = reducedMotion ? 0.16 : 0.12 + Math.sin(t * 0.22) * 0.08;
    groupRef.current.rotation.x = 0.26;
  });

  return (
    <group ref={groupRef}>
      <OrbitRing radius={1.86} tube={0.05} color={palette.primary} opacity={0.22} speed={0.12} rotation={[0.9, 0.22, 0]} />
      <OrbitRing radius={1.28} tube={0.04} color={palette.secondary} opacity={0.28} speed={-0.14} rotation={[1.3, 0, 0.4]} />
      <OrbitRing radius={0.76} tube={0.03} color={palette.tertiary} opacity={0.22} speed={0.2} rotation={[0.4, 0.5, 0.4]} />
      <SoftBar position={[-1.22, 0, 0.34]} size={[0.22, 0.22, 0.22]} color={palette.primary} />
      <SoftBar position={[0.04, 1.18, -0.14]} size={[0.22, 0.22, 0.22]} color={palette.secondary} />
      <SoftBar position={[1.12, -0.64, 0.26]} size={[0.22, 0.22, 0.22]} color={palette.tertiary} />
      <GlowSphere color={palette.primary} radius={0.28} emissiveIntensity={0.5} />
    </group>
  );
}

function TaxLedgerVisual({ palette, reducedMotion }: { palette: ScenePalette; reducedMotion: boolean }) {
  const sheetRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!sheetRef.current) {
      return;
    }

    sheetRef.current.rotation.y = reducedMotion ? -0.18 : -0.16 + Math.sin(state.clock.elapsedTime * 0.18) * 0.08;
    sheetRef.current.position.y = reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.32) * 0.06;
  });

  return (
    <group ref={sheetRef}>
      <RoundedBox args={[1.72, 2.18, 0.12]} radius={0.16} smoothness={8} position={[-0.52, 0.04, -0.02]} rotation={[0.06, -0.26, 0.04]}>
        <meshPhysicalMaterial color="#16181b" metalness={0.64} roughness={0.22} clearcoat={1} />
      </RoundedBox>
      <RoundedBox args={[1.42, 1.82, 0.06]} radius={0.12} smoothness={8} position={[-0.5, 0.04, 0.12]} rotation={[0.06, -0.26, 0.04]}>
        <meshStandardMaterial color={palette.tertiary} emissive={palette.primary} emissiveIntensity={0.06} />
      </RoundedBox>
      <mesh position={[0.96, -0.22, 0.24]} rotation={[Math.PI / 2.4, 0.44, 0]}>
        <cylinderGeometry args={[0.54, 0.54, 0.14, 40]} />
        <meshPhysicalMaterial color={palette.primary} emissive={palette.primary} emissiveIntensity={0.24} metalness={0.86} roughness={0.16} clearcoat={1} />
      </mesh>
      <Line points={[[-0.92, 0.54, 0.18], [-0.2, 0.54, 0.18], [0.36, 0.54, 0.18]]} color={palette.primary} transparent opacity={0.46} lineWidth={1.2} />
      <Line points={[[-0.92, 0.18, 0.18], [-0.34, 0.18, 0.18], [0.18, 0.18, 0.18]]} color={palette.neutral} transparent opacity={0.34} lineWidth={1.2} />
      <Line points={[[-0.92, -0.18, 0.18], [-0.48, -0.18, 0.18], [0.08, -0.18, 0.18]]} color={palette.neutral} transparent opacity={0.28} lineWidth={1.2} />
    </group>
  );
}

function RiskFieldVisual({ palette, reducedMotion }: { palette: ScenePalette; reducedMotion: boolean }) {
  const riskRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (riskRef.current) {
      const t = state.clock.elapsedTime;
      riskRef.current.rotation.y = reducedMotion ? 0.28 : t * 0.22;
      riskRef.current.rotation.x = reducedMotion ? 0.18 : 0.18 + Math.sin(t * 0.6) * 0.1;
      riskRef.current.scale.setScalar(reducedMotion ? 1 : 1 + Math.sin(t * 0.72) * 0.05);
    }

    if (haloRef.current) {
      haloRef.current.rotation.z = state.clock.elapsedTime * 0.28;
    }
  });

  return (
    <group>
      <mesh ref={riskRef}>
        <icosahedronGeometry args={[0.94, 2]} />
        <meshBasicMaterial color={palette.warning} wireframe transparent opacity={0.78} />
      </mesh>
      <mesh ref={haloRef} rotation={[0.82, 0.32, 0]}>
        <torusGeometry args={[1.58, 0.032, 16, 180]} />
        <meshBasicMaterial color={palette.primary} transparent opacity={0.34} />
      </mesh>
      <Line points={[[-1.62, 0.72, 0.14], [-0.84, -0.38, -0.08], [0.18, 0.82, 0.2], [1.22, -0.62, 0.02], [1.84, 0.42, 0.12]]} color={palette.warning} transparent opacity={0.46} lineWidth={1.35} />
    </group>
  );
}

function SocialCloudVisual({ palette, reducedMotion }: { palette: ScenePalette; reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const nodes = [
    [-1.56, 0.72, -0.18],
    [-0.48, 1.08, 0.22],
    [0.72, 0.78, -0.06],
    [1.44, 0.06, 0.08],
    [0.52, -1.06, 0.18],
    [-0.88, -0.82, -0.08],
  ] as Triple[];

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = reducedMotion ? -0.22 : -0.18 + Math.sin(state.clock.elapsedTime * 0.18) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {nodes.map((node, index) => (
        <mesh key={node.join("-")} position={node}>
          <sphereGeometry args={[index === 1 ? 0.26 : 0.18, 20, 20]} />
          <meshPhysicalMaterial color={index % 2 === 0 ? palette.secondary : palette.primary} emissive={index % 2 === 0 ? palette.secondary : palette.primary} emissiveIntensity={0.18} metalness={0.34} roughness={0.2} />
        </mesh>
      ))}
      {nodes.map((node, index) => {
        const next = nodes[(index + 1) % nodes.length];

        return <Line key={`social-${node.join("-")}`} points={[node, next]} color={index % 2 === 0 ? palette.primary : palette.secondary} transparent opacity={0.24} lineWidth={1.05} />;
      })}
      <GlowSphere color={palette.tertiary} radius={0.22} emissiveIntensity={0.32} />
    </group>
  );
}

function SecurityShieldVisual({ palette, reducedMotion }: { palette: ScenePalette; reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) {
      return;
    }

    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = reducedMotion ? 0.2 : t * 0.12;
    groupRef.current.rotation.x = 0.12 + Math.sin(t * 0.16) * 0.04;
  });

  return (
    <group ref={groupRef}>
      <mesh rotation={[0.2, 0.3, 0]}>
        <octahedronGeometry args={[0.92, 0]} />
        <meshPhysicalMaterial color={palette.primary} emissive={palette.primary} emissiveIntensity={0.24} metalness={0.84} roughness={0.18} clearcoat={1} />
      </mesh>
      <OrbitRing radius={1.24} tube={0.032} color={palette.secondary} opacity={0.24} speed={0.14} rotation={[1.06, 0.28, 0.14]} />
      <OrbitRing radius={1.62} tube={0.02} color={palette.tertiary} opacity={0.18} speed={-0.1} rotation={[0.34, 0.82, 0.18]} />
      <Line points={[[-1.12, 0.28, 0.04], [0, 1.36, 0.12], [1.1, 0.28, 0.04]]} color={palette.secondary} transparent opacity={0.34} lineWidth={1.15} />
    </group>
  );
}

function NetworkGlobeVisual({ palette, reducedMotion }: { palette: ScenePalette; reducedMotion: boolean }) {
  const globeRef = useRef<THREE.Group>(null);
  const nodes = [
    [-0.92, 0.96, 0.16],
    [1.02, 0.74, 0.34],
    [1.14, -0.56, -0.24],
    [-0.36, -1.12, 0.12],
    [-1.2, -0.18, -0.36],
  ] as Triple[];

  useFrame((state) => {
    if (!globeRef.current) {
      return;
    }

    globeRef.current.rotation.y = reducedMotion ? 0.42 : state.clock.elapsedTime * 0.18;
    globeRef.current.rotation.x = 0.22;
  });

  return (
    <group ref={globeRef}>
      <mesh>
        <sphereGeometry args={[1.22, 28, 28]} />
        <meshBasicMaterial color={palette.primary} wireframe transparent opacity={0.26} />
      </mesh>
      <OrbitRing radius={1.46} tube={0.022} color={palette.secondary} opacity={0.26} speed={0.16} rotation={[1.16, 0.3, 0]} />
      <OrbitRing radius={1.46} tube={0.018} color={palette.tertiary} opacity={0.16} speed={-0.12} rotation={[0.24, 1.1, 0.34]} />
      {nodes.map((node) => (
        <mesh key={node.join("-")} position={node}>
          <sphereGeometry args={[0.13, 18, 18]} />
          <meshBasicMaterial color={palette.secondary} />
        </mesh>
      ))}
      {nodes.map((node, index) => (
        <Line key={`net-${node.join("-")}`} points={[node, nodes[(index + 2) % nodes.length]]} color={palette.primary} transparent opacity={0.2} lineWidth={1} />
      ))}
    </group>
  );
}

function ExplorerTraceVisual({ palette, reducedMotion }: { palette: ScenePalette; reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.96, -0.84, 0),
        new THREE.Vector3(-1.02, 0.12, 0.12),
        new THREE.Vector3(-0.16, -0.4, 0.22),
        new THREE.Vector3(0.72, 0.84, 0.1),
        new THREE.Vector3(1.84, 0.18, 0),
      ]),
    [],
  );
  const points = useMemo(() => curve.getPoints(72).map((point) => point.toArray() as Triple), [curve]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = reducedMotion ? 0.08 : Math.sin(state.clock.elapsedTime * 0.14) * 0.08;
    }

    if (pulseRef.current) {
      const progress = ((state.clock.elapsedTime * (reducedMotion ? 0.06 : 0.18)) % 1 + 1) % 1;
      pulseRef.current.position.copy(curve.getPointAt(progress));
    }
  });

  return (
    <group ref={groupRef}>
      <Line points={points} color={palette.primary} transparent opacity={0.82} lineWidth={1.45} />
      <Line points={points} color={palette.secondary} transparent opacity={0.18} lineWidth={3.1} />
      {points.filter((_, index) => index % 18 === 0).map((point) => (
        <mesh key={point.join("-")} position={point}>
          <sphereGeometry args={[0.12, 18, 18]} />
          <meshBasicMaterial color={palette.primary} />
        </mesh>
      ))}
      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.14, 18, 18]} />
        <meshBasicMaterial color={palette.secondary} />
      </mesh>
      <OrbitRing radius={1.22} tube={0.02} color={palette.tertiary} opacity={0.14} speed={0.12} rotation={[1.2, 0.22, 0.3]} />
    </group>
  );
}

function DevtoolsVisual({ palette, reducedMotion }: { palette: ScenePalette; reducedMotion: boolean }) {
  const latticeRef = useRef<THREE.Group>(null);
  const blocks = [
    [-1.18, 0.52, 0.24],
    [0.04, -0.08, 0.72],
    [1.18, 0.54, -0.12],
    [0.16, -1.04, -0.34],
  ] as Triple[];

  useFrame((state) => {
    if (!latticeRef.current) {
      return;
    }

    latticeRef.current.rotation.y = reducedMotion ? 0.24 : state.clock.elapsedTime * 0.16;
    latticeRef.current.rotation.x = 0.16 + Math.sin(state.clock.elapsedTime * 0.2) * 0.04;
  });

  return (
    <group ref={latticeRef}>
      {blocks.map((position, index) => (
        <RoundedBox key={position.join("-")} args={[0.56, 0.56, 0.56]} radius={0.08} smoothness={6} position={position}>
          <meshPhysicalMaterial color={index % 2 === 0 ? palette.primary : palette.secondary} emissive={index % 2 === 0 ? palette.primary : palette.secondary} emissiveIntensity={0.18} metalness={0.8} roughness={0.18} />
        </RoundedBox>
      ))}
      <Line points={[blocks[0], blocks[1], blocks[2]]} color={palette.tertiary} transparent opacity={0.32} lineWidth={1.05} />
      <Line points={[blocks[1], blocks[3], blocks[0]]} color={palette.primary} transparent opacity={0.28} lineWidth={1.05} />
      <OrbitRing radius={1.72} tube={0.02} color={palette.secondary} opacity={0.16} speed={0.12} rotation={[0.7, 0.26, 0]} />
    </group>
  );
}

function PortfolioOrbitVisual({ palette, reducedMotion }: { palette: ScenePalette; reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) {
      return;
    }

    groupRef.current.rotation.y = reducedMotion ? 0.22 : state.clock.elapsedTime * 0.12;
    groupRef.current.rotation.x = 0.12;
  });

  return (
    <group ref={groupRef}>
      <GlowSphere color={palette.primary} radius={0.58} emissiveIntensity={0.42} />
      {[
        { pos: [-1.22, 0.44, 0.2] as Triple, color: palette.secondary, size: 0.24 },
        { pos: [1.16, 0.68, -0.12] as Triple, color: palette.tertiary, size: 0.2 },
        { pos: [0.92, -1, 0.1] as Triple, color: palette.primary, size: 0.26 },
        { pos: [-1.02, -0.8, -0.16] as Triple, color: palette.secondary, size: 0.18 },
      ].map((token) => (
        <mesh key={token.pos.join("-")} position={token.pos}>
          <sphereGeometry args={[token.size, 20, 20]} />
          <meshPhysicalMaterial color={token.color} emissive={token.color} emissiveIntensity={0.22} metalness={0.48} roughness={0.18} />
        </mesh>
      ))}
      <OrbitRing radius={1.26} tube={0.026} color={palette.primary} opacity={0.22} speed={0.14} rotation={[1.02, 0.26, 0.1]} />
      <OrbitRing radius={1.76} tube={0.02} color={palette.secondary} opacity={0.18} speed={-0.12} rotation={[0.34, 0.92, 0.22]} />
    </group>
  );
}

function SettingsVisual({ palette, reducedMotion }: { palette: ScenePalette; reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = reducedMotion ? 0.16 : state.clock.elapsedTime * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      <OrbitRing radius={0.84} tube={0.12} color={palette.primary} opacity={0.24} speed={0.08} rotation={[0.2, 0.42, 0]} />
      <OrbitRing radius={1.38} tube={0.028} color={palette.secondary} opacity={0.2} speed={-0.12} rotation={[1.18, 0.2, 0.24]} />
      <SoftBar position={[-1.42, 0.84, 0.12]} size={[0.96, 0.12, 0.12]} color={palette.neutral} />
      <GlowSphere color={palette.secondary} position={[-1.1, 0.84, 0.18]} radius={0.18} emissiveIntensity={0.32} />
      <SoftBar position={[1.38, -0.54, -0.08]} size={[1.18, 0.12, 0.12]} color={palette.neutral} />
      <GlowSphere color={palette.primary} position={[1.72, -0.54, 0]} radius={0.22} emissiveIntensity={0.36} />
    </group>
  );
}

function DashboardVisual({ palette, reducedMotion }: { palette: ScenePalette; reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) {
      return;
    }

    groupRef.current.rotation.y = reducedMotion ? 0.18 : state.clock.elapsedTime * 0.12;
    groupRef.current.rotation.x = 0.12;
  });

  return (
    <group ref={groupRef}>
      <RoundedBox args={[1.14, 1.14, 1.14]} radius={0.18} smoothness={6}>
        <meshPhysicalMaterial color={palette.primary} emissive={palette.primary} emissiveIntensity={0.22} metalness={0.82} roughness={0.16} clearcoat={1} />
      </RoundedBox>
      {[
        [-1.64, 0.92, 0.06],
        [1.62, 0.72, -0.12],
        [1.16, -1.08, 0.18],
        [-1.22, -0.92, -0.18],
      ].map((position, index) => (
        <RoundedBox key={position.join("-")} args={[0.62, 0.42, 0.14]} radius={0.08} smoothness={6} position={position as Triple}>
          <meshPhysicalMaterial color={index % 2 === 0 ? palette.secondary : palette.tertiary} emissive={index % 2 === 0 ? palette.secondary : palette.primary} emissiveIntensity={0.12} metalness={0.6} roughness={0.22} />
        </RoundedBox>
      ))}
      <OrbitRing radius={1.86} tube={0.022} color={palette.secondary} opacity={0.16} speed={0.12} rotation={[0.74, 0.26, 0]} />
    </group>
  );
}

function AdminVisual({ palette, reducedMotion }: { palette: ScenePalette; reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) {
      return;
    }

    groupRef.current.rotation.y = reducedMotion ? 0.22 : state.clock.elapsedTime * 0.1;
    groupRef.current.rotation.x = 0.08;
  });

  return (
    <group ref={groupRef}>
      <RoundedBox args={[1.16, 1.16, 1.16]} radius={0.12} smoothness={6}>
        <meshPhysicalMaterial color="#141618" metalness={0.92} roughness={0.18} clearcoat={1} />
      </RoundedBox>
      <SoftBar position={[0, 0, 0.72]} size={[2.58, 0.08, 0.08]} color={palette.primary} />
      <SoftBar position={[0, 0, 0.72]} size={[0.08, 2.4, 0.08]} color={palette.secondary} />
      <GlowSphere color={palette.primary} radius={0.34} emissiveIntensity={0.4} />
      <OrbitRing radius={1.62} tube={0.022} color={palette.tertiary} opacity={0.18} speed={0.1} rotation={[0.92, 0.22, 0.22]} />
    </group>
  );
}

function GenericVisual({ palette, reducedMotion }: { palette: ScenePalette; reducedMotion: boolean }) {
  const knotRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!knotRef.current) {
      return;
    }

    knotRef.current.rotation.y = reducedMotion ? 0.22 : state.clock.elapsedTime * 0.16;
    knotRef.current.rotation.x = 0.24;
  });

  return (
    <group>
      <mesh ref={knotRef}>
        <torusKnotGeometry args={[0.82, 0.22, 180, 24]} />
        <meshPhysicalMaterial color={palette.primary} emissive={palette.primary} emissiveIntensity={0.22} metalness={0.78} roughness={0.2} clearcoat={1} />
      </mesh>
      <OrbitRing radius={1.62} tube={0.02} color={palette.secondary} opacity={0.16} speed={0.12} rotation={[0.84, 0.28, 0.18]} />
    </group>
  );
}

function VariantContent({ variant, palette, reducedMotion }: { variant: PageHeroVariant; palette: ScenePalette; reducedMotion: boolean }) {
  switch (variant) {
    case "wallet":
      return <WalletVaultVisual palette={palette} reducedMotion={reducedMotion} />;
    case "markets":
      return <MarketsPulseVisual palette={palette} reducedMotion={reducedMotion} />;
    case "trading":
      return <TradingSignalVisual palette={palette} reducedMotion={reducedMotion} />;
    case "transfer":
      return <TransferFlowVisual palette={palette} reducedMotion={reducedMotion} />;
    case "stake":
      return <StakeYieldVisual palette={palette} reducedMotion={reducedMotion} />;
    case "pools":
      return <LiquidityOrbitVisual palette={palette} reducedMotion={reducedMotion} />;
    case "borrow":
      return <BorrowBalanceVisual palette={palette} reducedMotion={reducedMotion} />;
    case "governance":
      return <GovernanceNodeVisual palette={palette} reducedMotion={reducedMotion} />;
    case "treasury":
      return <TreasuryReserveVisual palette={palette} reducedMotion={reducedMotion} />;
    case "tokens":
      return <TokenMintVisual palette={palette} reducedMotion={reducedMotion} />;
    case "nfts":
      return <NFTVisual palette={palette} reducedMotion={reducedMotion} />;
    case "swap":
      return <SwapExchangeVisual palette={palette} reducedMotion={reducedMotion} />;
    case "analytics":
      return <AnalyticsCoreVisual palette={palette} reducedMotion={reducedMotion} />;
    case "assistant":
      return <AssistantCoreVisual palette={palette} reducedMotion={reducedMotion} />;
    case "strategy":
      return <StrategyMatrixVisual palette={palette} reducedMotion={reducedMotion} />;
    case "tax":
      return <TaxLedgerVisual palette={palette} reducedMotion={reducedMotion} />;
    case "risk":
      return <RiskFieldVisual palette={palette} reducedMotion={reducedMotion} />;
    case "social":
      return <SocialCloudVisual palette={palette} reducedMotion={reducedMotion} />;
    case "security":
      return <SecurityShieldVisual palette={palette} reducedMotion={reducedMotion} />;
    case "network":
      return <NetworkGlobeVisual palette={palette} reducedMotion={reducedMotion} />;
    case "explorer":
      return <ExplorerTraceVisual palette={palette} reducedMotion={reducedMotion} />;
    case "devtools":
      return <DevtoolsVisual palette={palette} reducedMotion={reducedMotion} />;
    case "portfolio":
      return <PortfolioOrbitVisual palette={palette} reducedMotion={reducedMotion} />;
    case "settings":
      return <SettingsVisual palette={palette} reducedMotion={reducedMotion} />;
    case "dashboard":
      return <DashboardVisual palette={palette} reducedMotion={reducedMotion} />;
    case "admin":
      return <AdminVisual palette={palette} reducedMotion={reducedMotion} />;
    default:
      return <GenericVisual palette={palette} reducedMotion={reducedMotion} />;
  }
}

function SceneWorld({ variant, reducedMotion }: { variant: PageHeroVariant; reducedMotion: boolean }) {
  const palette = PALETTES[variant] ?? PALETTES.generic;

  return (
    <>
      <color attach="background" args={["#0a0b0d"]} />
      <fog attach="fog" args={["#080909", 6, 11]} />
      <SceneLights palette={palette} intensity={variant === "trading" ? 1.1 : 1} />
      <Float speed={reducedMotion ? 0 : Math.max(0.8, palette.speed * 2.4)} rotationIntensity={reducedMotion ? 0 : 0.18} floatIntensity={reducedMotion ? 0 : 0.22}>
        <VariantContent variant={variant} palette={palette} reducedMotion={reducedMotion} />
      </Float>
      <Sparkles count={variant === "trading" ? 44 : 36} scale={[6, 3.6, 3]} size={2.4} speed={reducedMotion ? 0 : Math.max(0.18, palette.speed)} opacity={0.48} color={palette.sparkles} />
    </>
  );
}

export function PageHeroScene({ variant }: { variant: PageHeroVariant }) {
  const reducedMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 overflow-hidden rounded-[1.8rem]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_46%_46%,rgba(242,201,76,0.15),transparent_32%),radial-gradient(circle_at_78%_22%,rgba(34,211,238,0.08),transparent_18%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(0,0,0,0.18))]" />
      <Canvas camera={{ position: [0, 0, 5.2], fov: 34 }} dpr={[1, 1.6]} gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}>
        <Suspense fallback={null}>
          <SceneWorld variant={variant} reducedMotion={Boolean(reducedMotion)} />
        </Suspense>
      </Canvas>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-[linear-gradient(180deg,transparent,rgba(7,8,9,0.42))]" />
    </div>
  );
}
