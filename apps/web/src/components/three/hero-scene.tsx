'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Environment,
  Float,
  Lightformer,
  MeshTransmissionMaterial,
  Sparkles,
} from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import * as THREE from 'three';

const SERVICE_ORBS = [
  { label: 'Web', color: '#60a5fa', radius: 3.4, speed: 0.16, phase: 0.0, tilt: 0.12 },
  { label: 'Mobile', color: '#a78bfa', radius: 3.9, speed: 0.12, phase: 1.1, tilt: -0.2 },
  { label: 'Desktop', color: '#67e8f9', radius: 4.4, speed: 0.09, phase: 2.2, tilt: 0.3 },
  { label: 'AI', color: '#c4b5fd', radius: 3.6, speed: 0.14, phase: 3.4, tilt: -0.1 },
  { label: 'Cloud', color: '#7dd3fc', radius: 4.8, speed: 0.07, phase: 4.5, tilt: 0.18 },
  { label: 'Automation', color: '#818cf8', radius: 4.1, speed: 0.11, phase: 5.5, tilt: -0.28 },
] as const;

/** The Vesion core: a slowly breathing glass crystal. */
function CrystalCore() {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const t = clock.elapsedTime;
    mesh.current.rotation.x = t * 0.08;
    mesh.current.rotation.y = t * 0.12;
    const breathe = 1 + Math.sin(t * 0.7) * 0.02;
    mesh.current.scale.setScalar(breathe);
  });

  return (
    <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.6}>
      <mesh ref={mesh}>
        <icosahedronGeometry args={[1.5, 0]} />
        <MeshTransmissionMaterial
          samples={6}
          thickness={1.4}
          roughness={0.12}
          transmission={1}
          ior={1.45}
          chromaticAberration={0.35}
          anisotropicBlur={0.4}
          distortion={0.2}
          distortionScale={0.4}
          temporalDistortion={0.1}
          color="#c7d6ff"
          attenuationColor="#8ba6ff"
          attenuationDistance={2.5}
        />
      </mesh>
      {/* Inner light source gives the crystal life */}
      <mesh scale={0.45}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color="#a5b4fc" toneMapped={false} />
      </mesh>
      <pointLight intensity={6} distance={7} color="#8b9dff" />
    </Float>
  );
}

/** A single orbiting glass sphere representing one service. */
function ServiceOrb({ orb }: { orb: (typeof SERVICE_ORBS)[number] }) {
  const group = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.elapsedTime * orb.speed + orb.phase;
    group.current.position.set(
      Math.cos(t) * orb.radius,
      Math.sin(t * 1.3) * 0.7 + Math.sin(orb.phase) * 0.4,
      Math.sin(t) * orb.radius * (0.72 + orb.tilt),
    );
  });

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[0.34, 48, 48]} />
        <meshPhysicalMaterial
          transmission={0.92}
          thickness={0.6}
          roughness={0.08}
          ior={1.4}
          color={orb.color}
          emissive={orb.color}
          emissiveIntensity={0.12}
          envMapIntensity={1.2}
        />
      </mesh>
      <mesh scale={0.12}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color={orb.color} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Camera reacts subtly to pointer position. */
function CameraRig() {
  const { camera, pointer } = useThree();
  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    target.set(pointer.x * 0.7, pointer.y * 0.45 + 0.1, 9);
    camera.position.lerp(target, 0.035);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

function SceneContents() {
  return (
    <>
      <color attach="background" args={['#060916']} />
      <fog attach="fog" args={['#060916', 12, 26]} />
      <ambientLight intensity={0.35} />

      <CrystalCore />
      {SERVICE_ORBS.map((orb) => (
        <ServiceOrb key={orb.label} orb={orb} />
      ))}

      {/* Drifting dust — restrained, no cheesy stars */}
      <Sparkles count={90} scale={[16, 9, 12]} size={1.6} speed={0.25} opacity={0.35} color="#9db4ff" />
      <Sparkles count={40} scale={[10, 6, 8]} size={2.4} speed={0.15} opacity={0.25} color="#67e8f9" />

      {/* Locally generated environment for glass reflections (no network fetch) */}
      <Environment resolution={256}>
        <Lightformer intensity={2.2} position={[6, 4, 6]} scale={[8, 4, 1]} color="#6d7cff" />
        <Lightformer intensity={1.4} position={[-7, -2, -4]} scale={[6, 6, 1]} color="#38bdf8" />
        <Lightformer intensity={1.1} position={[0, 6, -8]} scale={[10, 3, 1]} color="#a78bfa" />
      </Environment>

      <EffectComposer multisampling={0}>
        <Bloom intensity={0.55} luminanceThreshold={0.75} mipmapBlur radius={0.7} />
      </EffectComposer>

      <CameraRig />
    </>
  );
}

/**
 * Cinematic hero scene: glass crystal core with orbiting service spheres.
 * Rendered client-side only; the parent supplies a static gradient fallback
 * for reduced-motion users and while the canvas loads.
 */
export default function HeroScene() {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.2, 9], fov: 42 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      aria-hidden="true"
      className="!absolute !inset-0"
    >
      <SceneContents />
    </Canvas>
  );
}
