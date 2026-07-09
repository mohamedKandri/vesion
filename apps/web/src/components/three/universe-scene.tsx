'use client';

import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Line, Lightformer, MeshTransmissionMaterial, Sparkles } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import * as THREE from 'three';

export interface Planet {
  id: string;
  label: string;
  color: string;
  angle: number;
  radius: number;
  y: number;
}

export const PLANETS: Planet[] = [
  { id: 'web', label: 'Websites', color: '#60a5fa', angle: 0, radius: 5.6, y: 0.4 },
  { id: 'mobile', label: 'Mobile', color: '#a78bfa', angle: 1.05, radius: 6.4, y: -0.5 },
  { id: 'ai', label: 'AI', color: '#c4b5fd', angle: 2.1, radius: 5.2, y: 0.8 },
  { id: 'desktop', label: 'Desktop', color: '#67e8f9', angle: 3.15, radius: 6.8, y: -0.2 },
  { id: 'cloud', label: 'Cloud', color: '#7dd3fc', angle: 4.2, radius: 5.9, y: 0.6 },
  { id: 'automation', label: 'Automation', color: '#818cf8', angle: 5.25, radius: 6.2, y: -0.7 },
];

function planetPosition(planet: Planet, t: number): THREE.Vector3 {
  const angle = planet.angle + t * 0.03;
  return new THREE.Vector3(
    Math.cos(angle) * planet.radius,
    planet.y + Math.sin(t * 0.4 + planet.angle) * 0.15,
    Math.sin(angle) * planet.radius * 0.65,
  );
}

/** Identity decorations per planet — floating windows, phones, nodes, etc. */
function PlanetIdentity({ planet }: { planet: Planet }) {
  const spin = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (spin.current) spin.current.rotation.y = clock.elapsedTime * 0.4 + planet.angle;
  });

  const nodePositions = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2;
        return new THREE.Vector3(Math.cos(a) * 0.85, Math.sin(a * 2) * 0.25, Math.sin(a) * 0.85);
      }),
    [],
  );

  switch (planet.id) {
    case 'web':
    case 'desktop': {
      const size: [number, number, number] =
        planet.id === 'web' ? [0.55, 0.38, 0.03] : [0.62, 0.42, 0.03];
      return (
        <group ref={spin}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[Math.cos((i / 3) * Math.PI * 2) * 0.9, i * 0.18 - 0.18, Math.sin((i / 3) * Math.PI * 2) * 0.9]}>
              <boxGeometry args={size} />
              <meshPhysicalMaterial
                color={planet.color}
                transmission={0.5}
                roughness={0.2}
                emissive={planet.color}
                emissiveIntensity={0.25}
              />
            </mesh>
          ))}
        </group>
      );
    }
    case 'mobile':
      return (
        <group ref={spin}>
          {[0, 1].map((i) => (
            <mesh key={i} position={[i === 0 ? 0.85 : -0.85, i === 0 ? 0.1 : -0.1, 0]} rotation={[0, 0, i === 0 ? 0.15 : -0.15]}>
              <boxGeometry args={[0.2, 0.42, 0.03]} />
              <meshPhysicalMaterial
                color={planet.color}
                transmission={0.5}
                roughness={0.2}
                emissive={planet.color}
                emissiveIntensity={0.3}
              />
            </mesh>
          ))}
        </group>
      );
    case 'ai':
      return (
        <Sparkles count={40} scale={1.9} size={2.2} speed={0.4} color={planet.color} opacity={0.8} />
      );
    case 'cloud':
      return (
        <group ref={spin}>
          {[-0.22, 0, 0.22].map((y, i) => (
            <mesh key={i} position={[0.9, y, 0]}>
              <boxGeometry args={[0.4, 0.14, 0.28]} />
              <meshPhysicalMaterial
                color={planet.color}
                transmission={0.4}
                roughness={0.25}
                emissive={planet.color}
                emissiveIntensity={0.25}
              />
            </mesh>
          ))}
        </group>
      );
    case 'automation':
      return (
        <group ref={spin}>
          {nodePositions.map((pos, i) => (
            <mesh key={i} position={pos}>
              <sphereGeometry args={[0.07, 16, 16]} />
              <meshBasicMaterial color={planet.color} toneMapped={false} />
            </mesh>
          ))}
          <Line
            points={[...nodePositions, nodePositions[0]]}
            color={planet.color}
            lineWidth={1}
            transparent
            opacity={0.5}
          />
        </group>
      );
    default:
      return null;
  }
}

function PlanetMesh({
  planet,
  focused,
  onSelect,
}: {
  planet: Planet;
  focused: string | null;
  onSelect: (id: string) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const isFocused = focused === planet.id;
  const dimmed = focused !== null && !isFocused;

  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.position.copy(planetPosition(planet, clock.elapsedTime));
    const targetScale = isFocused ? 1.35 : hovered && !focused ? 1.18 : 1;
    group.current.scale.lerp(new THREE.Vector3().setScalar(targetScale), 0.08);
  });

  return (
    <group
      ref={group}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(planet.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = '';
      }}
    >
      <mesh>
        <sphereGeometry args={[0.62, 48, 48]} />
        <meshPhysicalMaterial
          transmission={0.85}
          thickness={0.8}
          roughness={0.12}
          ior={1.4}
          color={planet.color}
          emissive={planet.color}
          emissiveIntensity={dimmed ? 0.04 : hovered || isFocused ? 0.45 : 0.15}
          opacity={dimmed ? 0.35 : 1}
          transparent
        />
      </mesh>
      <PlanetIdentity planet={planet} />
      <pointLight intensity={hovered || isFocused ? 2.4 : 0.8} distance={3.5} color={planet.color} />
    </group>
  );
}

/** Smoothly flies the camera between the overview and a focused planet. */
function UniverseCamera({ focused }: { focused: string | null }) {
  const position = useMemo(() => new THREE.Vector3(), []);
  const lookAt = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ camera, clock, pointer }) => {
    const planet = PLANETS.find((p) => p.id === focused);
    if (planet) {
      const target = planetPosition(planet, clock.elapsedTime);
      position.set(target.x * 0.72, target.y + 0.6, target.z * 0.72 + 3.4);
      lookAt.copy(target);
    } else {
      position.set(pointer.x * 1.2, 3.4 + pointer.y * 0.8, 13);
      lookAt.set(0, 0, 0);
    }
    camera.position.lerp(position, 0.045);
    camera.lookAt(lookAt);
  });
  return null;
}

function UniverseContents({
  focused,
  onSelect,
}: {
  focused: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <>
      <color attach="background" args={['#060916']} />
      <fog attach="fog" args={['#060916', 16, 34]} />
      <ambientLight intensity={0.3} />

      {/* Central Vesion crystal */}
      <mesh onClick={() => onSelect(null)}>
        <icosahedronGeometry args={[1.1, 0]} />
        <MeshTransmissionMaterial
          samples={4}
          thickness={1.2}
          roughness={0.12}
          transmission={1}
          ior={1.45}
          chromaticAberration={0.3}
          color="#c7d6ff"
        />
      </mesh>
      <pointLight intensity={5} distance={9} color="#8b9dff" />

      {/* Orbit rings */}
      {[5.4, 6.1, 6.9].map((r) => (
        <mesh key={r} rotation={[-Math.PI / 2.6, 0, 0]}>
          <torusGeometry args={[r, 0.004, 8, 128]} />
          <meshBasicMaterial color="#3b4a8f" transparent opacity={0.35} />
        </mesh>
      ))}

      {PLANETS.map((planet) => (
        <PlanetMesh key={planet.id} planet={planet} focused={focused} onSelect={(id) => onSelect(id)} />
      ))}

      <Sparkles count={120} scale={[24, 12, 18]} size={1.4} speed={0.2} opacity={0.3} color="#9db4ff" />

      <Environment resolution={128}>
        <Lightformer intensity={1.8} position={[8, 5, 6]} scale={[8, 4, 1]} color="#6d7cff" />
        <Lightformer intensity={1.2} position={[-8, -3, -5]} scale={[6, 6, 1]} color="#38bdf8" />
      </Environment>

      <EffectComposer multisampling={0}>
        <Bloom intensity={0.5} luminanceThreshold={0.7} mipmapBlur radius={0.65} />
      </EffectComposer>

      <UniverseCamera focused={focused} />
    </>
  );
}

/**
 * The Software Universe: the Vesion crystal at the center of a digital galaxy
 * of service planets. Clicking a planet flies the camera to it; clicking the
 * core (or the parent's back control) returns to the overview.
 */
export default function UniverseScene({
  focused,
  onSelect,
}: {
  focused: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 3.4, 13], fov: 45 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      onPointerMissed={() => onSelect(null)}
      className="!absolute !inset-0"
    >
      <UniverseContents focused={focused} onSelect={onSelect} />
    </Canvas>
  );
}
