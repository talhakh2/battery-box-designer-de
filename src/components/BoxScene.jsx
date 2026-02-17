import { Canvas } from '@react-three/fiber'
import { Bounds, Edges, Environment, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useMemo } from 'react'

function mmToSceneUnits(mm) {
  // 1 unit = 100mm keeps typical dims comfortable in view
  return mm / 100
}

function CellGrid({ w, h, l, rows, cols }) {
  const cells = useMemo(() => {
    const margin = 0.03 // scene units
    const cellW = w / cols
    const cellL = l / rows
    const cellH = Math.max(0.05, h * 0.85)

    const startX = -w / 2 + cellW / 2
    const startZ = -l / 2 + cellL / 2
    const y = -h / 2 + cellH / 2 + margin

    const result = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = startX + c * cellW
        const z = startZ + r * cellL
        const i = r * cols + c
        const color = i % 2 === 0 ? '#22c55e' : '#06b6d4'
        result.push({
          key: `${r}-${c}`,
          position: [x, y, z],
          size: [Math.max(0.05, cellW - margin), cellH, Math.max(0.05, cellL - margin)],
          color,
        })
      }
    }
    return result
  }, [w, h, l, rows, cols])

  return (
    <group>
      {cells.map((cell) => (
        <mesh key={cell.key} position={cell.position} castShadow receiveShadow>
          <boxGeometry args={cell.size} />
          <meshStandardMaterial color={cell.color} roughness={0.55} metalness={0.05} />
        </mesh>
      ))}
    </group>
  )
}

function BoxModel({ lengthMm, widthMm, heightMm, rows, columns }) {
  const w = mmToSceneUnits(widthMm)
  const h = mmToSceneUnits(heightMm)
  const l = mmToSceneUnits(lengthMm)

  const boxGeo = useMemo(() => new THREE.BoxGeometry(w, h, l), [w, h, l])
  const outlineColor = '#1f2937'

  return (
    <group>
      {/* Outer box */}
      <mesh geometry={boxGeo} castShadow receiveShadow>
        <meshStandardMaterial color="#4f46e5" transparent opacity={0.14} roughness={0.45} metalness={0.05} />
        <Edges color={outlineColor} />
      </mesh>

      {/* Cells inside */}
      <CellGrid w={w} h={h} l={l} rows={rows} cols={columns} />
    </group>
  )
}

export function BoxScene({ lengthMm, widthMm, heightMm, rows, columns }) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      camera={{ position: [2.7, 2.2, 2.7], fov: 45, near: 0.1, far: 100 }}
    >
      <color attach="background" args={['#f8fafc']} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 7, 4]} intensity={1.2} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />

      <Bounds fit clip observe margin={1.35}>
        <BoxModel lengthMm={lengthMm} widthMm={widthMm} heightMm={heightMm} rows={rows} columns={columns} />
      </Bounds>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.4, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <shadowMaterial transparent opacity={0.18} />
      </mesh>

      <OrbitControls makeDefault enablePan enableRotate enableZoom dampingFactor={0.08} />
      <Environment preset="city" />
    </Canvas>
  )
}

