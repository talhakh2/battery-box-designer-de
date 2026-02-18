import { Canvas, useThree } from '@react-three/fiber'
import {
  Billboard,
  Bounds,
  Environment,
  Line,
  OrbitControls,
  RoundedBox,
  Text,
  useBounds,
  useTexture,
} from '@react-three/drei'
import { Edges } from '@react-three/drei'
import * as THREE from 'three'
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'

// Unit direction for standard view: front-right, slightly elevated
const STANDARD_DIR = new THREE.Vector3(2.8, 1.8, 3.0).normalize()

function BoundsResetHelper({ helperRef }) {
  const bounds               = useBounds()
  const { camera, controls } = useThree()

  useImperativeHandle(helperRef, () => ({
    resetToStandardView() {
      const target = controls ? controls.target.clone() : new THREE.Vector3()
      const dist   = camera.position.distanceTo(target)
      camera.position.copy(STANDARD_DIR.clone().multiplyScalar(Math.max(dist, 3)))
      camera.lookAt(target)
      if (controls) { controls.target.copy(target); controls.update() }
      bounds.refresh().fit()
    },
  }))

  return null
}

function mmToSceneUnits(mm) { return mm / 100 }

/* ══════════════════════════════════════════════════════════════
   BATTERY CELL
   ══════════════════════════════════════════════════════════════ */

function Terminal({ cellW, cellL }) {
  const collarR = Math.min(cellW, cellL) * 0.16
  const nutR    = collarR * 0.72
  const studR   = nutR   * 0.38
  const collarH = 0.018
  const nutH    = 0.028
  const studH   = 0.014
  return (
    <group>
      <mesh castShadow>
        <cylinderGeometry args={[collarR, collarR, collarH, 32]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.22} metalness={0.88} />
      </mesh>
      <mesh castShadow position={[0, (collarH + nutH) / 2, 0]}>
        <cylinderGeometry args={[nutR, nutR, nutH, 6]} />
        <meshStandardMaterial color="#64748b" roughness={0.18} metalness={0.92} />
      </mesh>
      <mesh position={[0, collarH + nutH + studH / 2, 0]}>
        <cylinderGeometry args={[studR, studR, studH, 16]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.15} metalness={0.95} />
      </mesh>
    </group>
  )
}

function VentCap({ cellW, cellL, capColor, dotColor }) {
  const capR = Math.min(cellW, cellL) * 0.12
  const capH = 0.026
  const dotR = capR * 0.28
  const dotH = 0.008
  return (
    <group>
      <mesh castShadow>
        <cylinderGeometry args={[capR, capR * 1.08, capH, 32]} />
        <meshStandardMaterial color={capColor} roughness={0.35} metalness={0.3} />
      </mesh>
      <mesh position={[0, capH / 2 + dotH / 2, 0]}>
        <cylinderGeometry args={[dotR, dotR, dotH, 16]} />
        <meshStandardMaterial color={dotColor} roughness={0.1} metalness={0.5}
          emissive={dotColor} emissiveIntensity={0.3} />
      </mesh>
    </group>
  )
}

function BatteryCell({ size, index, cellMake }) {
  const [cw, ch, cl] = size
  const topY  = ch / 2
  const tOffX = cw * 0.27

  // ── Colors based on Cell Make ──
  const isHOP      = cellMake === 'HOP'
  const bodyColor  = isHOP ? '#052e16' : '#0f172a'
  const bodyEmissive = isHOP ? '#14532d' : '#1e293b'
  const topColor   = isHOP ? '#166534' : '#1e293b'
  const capColor   = isHOP ? '#f0fdf4' : '#f1f5f9'
  const dotColor   = isHOP ? '#4ade80' : '#94a3b8'
  const edgeColor  = isHOP ? '#4ade80' : '#475569'

  return (
    <group>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[cw, ch, cl]} />
        <meshStandardMaterial color={bodyColor} emissive={bodyEmissive} emissiveIntensity={0.6} roughness={0.4} metalness={0.05} />
      </mesh>
      <mesh position={[0, topY - 0.003, 0]}>
        <boxGeometry args={[cw * 0.96, 0.006, cl * 0.96]} />
        <meshStandardMaterial color={topColor} emissive={topColor} emissiveIntensity={0.3} roughness={0.3} metalness={0.05} />
      </mesh>
      <mesh>
        <boxGeometry args={[cw, ch, cl]} />
        <Edges color={edgeColor} threshold={10} />
      </mesh>
      <group position={[-tOffX, topY, 0]}><Terminal cellW={cw} cellL={cl} /></group>
      <group position={[ tOffX, topY, 0]}><Terminal cellW={cw} cellL={cl} /></group>
      <group position={[0, topY, 0]}>
        <VentCap cellW={cw} cellL={cl} capColor={capColor} dotColor={dotColor} />
      </group>
      <Billboard follow position={[0, topY + 0.2, 0]}>
        <RoundedBox args={[0.26, 0.18, 0.02]} radius={0.04} smoothness={4}>
          <meshBasicMaterial color="#0f172a" depthTest={false} />
        </RoundedBox>
        <Text position={[0, 0, 0.02]} fontSize={0.1} color="#ffffff"
          depthTest={false} renderOrder={15}>
          {index + 1}
        </Text>
      </Billboard>
    </group>
  )
}

/* ── Grid of cells — bottom-anchored ───────────────────────── */
function CellGrid({ w, h1, h2, maxH, l, rows, cols, cellHeightScene, cellMake }) {
  const effectiveH = Math.min(h1, h2)

  const cells = useMemo(() => {
    const gap   = 0.022
    const cellW = (w - gap * (cols + 1)) / cols
    const cellL = (l - gap * (rows + 1)) / rows
    const cellH = Math.min(Math.max(0.08, cellHeightScene), effectiveH - gap * 2)
    const startX = -w / 2 + gap + cellW / 2
    const startZ = -l / 2 + gap + cellL / 2
    const y      = -maxH / 2 + cellH / 2 + gap   // bottom-anchored

    const result = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        result.push({
          key:      `${r}-${c}`,
          position: [startX + c * (cellW + gap), y, startZ + r * (cellL + gap)],
          size:     [Math.max(0.06, cellW), cellH, Math.max(0.06, cellL)],
          index:    r * cols + c,
        })
      }
    }
    return result
  }, [w, effectiveH, maxH, l, rows, cols, cellHeightScene])

  return (
    <group>
      {cells.map(cell => (
        <group key={cell.key} position={cell.position}>
          <BatteryCell size={cell.size} index={cell.index} cellMake={cellMake} />
        </group>
      ))}
    </group>
  )
}

/* ══════════════════════════════════════════════════════════════
   DIMENSION GUIDES
   ══════════════════════════════════════════════════════════════ */
const DIM_W  = { line: '#3b82f6', bg: '#1d4ed8', text: '#ffffff' }
const DIM_L  = { line: '#22c55e', bg: '#15803d', text: '#ffffff' }
const DIM_H  = { line: '#f97316', bg: '#c2410c', text: '#ffffff' }
const DIM_H2 = { line: '#a855f7', bg: '#7e22ce', text: '#ffffff' }

function DimLabel({ position, text, scheme, scale = 1 }) {
  const pillW = (text.length * 0.076 + 0.22) * scale
  const pillH = 0.30 * scale
  return (
    <Billboard follow position={position}>
      <RoundedBox args={[pillW, pillH, 0.01 * scale]} radius={0.07 * scale} smoothness={4}>
        <meshBasicMaterial color={scheme.bg} depthTest={false} transparent opacity={0.95} />
      </RoundedBox>
      <Text position={[0, 0, 0.02 * scale]} fontSize={0.155 * scale} fontWeight="bold"
        color={scheme.text} anchorX="center" anchorY="middle"
        depthTest={false} depthWrite={false} renderOrder={2001}>
        {text}
      </Text>
    </Billboard>
  )
}

function ArrowTip({ position, rotX = 0, rotZ = 0, color, scale = 1 }) {
  return (
    <mesh position={position} rotation={[rotX, 0, rotZ]} scale={[scale, scale, scale]}>
      <coneGeometry args={[0.034, 0.10, 8]} />
      <meshBasicMaterial color={color} depthTest={false} />
    </mesh>
  )
}

function DimensionGuides({ w, h1, h2, maxH, l, lengthMm, widthMm, h1Mm, h2Mm }) {
  const maxDim = Math.max(w, maxH, l)
  const s      = maxDim / 3.5
  const gap    = maxDim * 0.09
  const lOff   = maxDim * 0.11

  const b   = -maxH / 2       // bottom Y
  const t1  = b + h1          // top of long walls
  const t2  = b + h2          // top of short walls

  // Width (blue): top of short walls, front face
  const wY  = t2 + gap
  const wZ  = l / 2 + gap

  // Length (green): top of long walls, right side
  const lX  = w / 2 + gap
  const lY  = t1 + gap * 0.5

  // Height 1 (orange): left side, back face (z = +l/2)
  const hX1 = -w / 2 - gap
  const hZ1 =  l / 2 + gap

  // Height 2 (purple): left side, OPPOSITE front face (z = -l/2)
  const hX2 = -w / 2 - gap
  const hZ2 = -(l / 2 + gap)
  const showH2 = Math.abs(h1Mm - h2Mm) > 0.5

  const lp = { depthTest: false, lineWidth: 2.5 }
  const ep = { depthTest: false, lineWidth: 1.2 }

  return (
    <group>
      {/* ══ Width (blue) ══ */}
      <Line points={[[-w/2, t2, l/2], [-w/2, wY, wZ]]} color={DIM_W.line} {...ep} />
      <Line points={[[ w/2, t2, l/2], [ w/2, wY, wZ]]} color={DIM_W.line} {...ep} />
      <Line points={[[-w/2, wY, wZ], [w/2, wY, wZ]]} color={DIM_W.line} {...lp} />
      <ArrowTip position={[-w/2, wY, wZ]} rotZ={-Math.PI/2} color={DIM_W.line} scale={s} />
      <ArrowTip position={[ w/2, wY, wZ]} rotZ={ Math.PI/2} color={DIM_W.line} scale={s} />
      <DimLabel position={[0, wY + lOff, wZ]} text={`W: ${widthMm} mm`} scheme={DIM_W} scale={s} />

      {/* ══ Length (green) ══ */}
      <Line points={[[w/2, t1, -l/2], [lX, lY, -l/2]]} color={DIM_L.line} {...ep} />
      <Line points={[[w/2, t1,  l/2], [lX, lY,  l/2]]} color={DIM_L.line} {...ep} />
      <Line points={[[lX, lY, -l/2], [lX, lY, l/2]]} color={DIM_L.line} {...lp} />
      <ArrowTip position={[lX, lY, -l/2]} rotX={ Math.PI/2} color={DIM_L.line} scale={s} />
      <ArrowTip position={[lX, lY,  l/2]} rotX={-Math.PI/2} color={DIM_L.line} scale={s} />
      <DimLabel position={[lX + lOff, lY, 0]} text={`L: ${lengthMm} mm`} scheme={DIM_L} scale={s} />

      {/* ══ H1 (orange) — back face, left side ══ */}
      <Line points={[[-w/2, b,  l/2], [hX1, b,  hZ1]]} color={DIM_H.line} {...ep} />
      <Line points={[[-w/2, t1, l/2], [hX1, t1, hZ1]]} color={DIM_H.line} {...ep} />
      <Line points={[[hX1, b, hZ1], [hX1, t1, hZ1]]} color={DIM_H.line} {...lp} />
      <ArrowTip position={[hX1, b,  hZ1]} rotX={0} rotZ={0}       color={DIM_H.line} scale={s} />
      <ArrowTip position={[hX1, t1, hZ1]} rotX={0} rotZ={Math.PI} color={DIM_H.line} scale={s} />
      <DimLabel position={[hX1 - lOff, b + h1/2, hZ1]}
        text={showH2 ? `H1: ${h1Mm} mm` : `H: ${h1Mm} mm`}
        scheme={DIM_H} scale={s} />

      {/* ══ H2 (purple) — OPPOSITE front face, left side ══ */}
      {showH2 && (
        <>
          <Line points={[[-w/2, b,  -l/2], [hX2, b,  hZ2]]} color={DIM_H2.line} {...ep} />
          <Line points={[[-w/2, t2, -l/2], [hX2, t2, hZ2]]} color={DIM_H2.line} {...ep} />
          <Line points={[[hX2, b, hZ2], [hX2, t2, hZ2]]} color={DIM_H2.line} {...lp} />
          <ArrowTip position={[hX2, b,  hZ2]} rotX={0} rotZ={0}       color={DIM_H2.line} scale={s} />
          <ArrowTip position={[hX2, t2, hZ2]} rotX={0} rotZ={Math.PI} color={DIM_H2.line} scale={s} />
          <DimLabel position={[hX2 - lOff, b + h2/2, hZ2]}
            text={`H2: ${h2Mm} mm`} scheme={DIM_H2} scale={s} />
        </>
      )}
    </group>
  )
}

/* ══════════════════════════════════════════════════════════════
   SIDE HOLES  (on the short / width-face walls, z = ±l/2)
   ══════════════════════════════════════════════════════════════ */
function SideHoles({ w, h2, maxH, l, holeCount, holeDiameterMm }) {
  const holeR  = mmToSceneUnits(holeDiameterMm) / 2
  const margin = mmToSceneUnits(20)          // 20 mm from top edge
  const topY   = -maxH / 2 + h2             // top of short walls
  const holeY  = topY - holeR - margin

  // 1 hole → centre, 2 holes → symmetric at ±w/4
  const xs = holeCount === 1 ? [0] : [-w / 4, w / 4]

  return (
    <group>
      {[-l / 2, l / 2].map(z =>
        xs.map(x => (
          <group key={`${x}-${z}`}>
            {/* Metal collar */}
            <mesh position={[x, holeY, z]} rotation={[Math.PI / 2, 0, 0]} renderOrder={5}>
              <cylinderGeometry args={[holeR + mmToSceneUnits(6), holeR + mmToSceneUnits(6), 0.006, 32]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.2} metalness={0.85} depthTest={false} />
            </mesh>
            {/* Dark hole opening */}
            <mesh position={[x, holeY, z]} rotation={[Math.PI / 2, 0, 0]} renderOrder={6}>
              <cylinderGeometry args={[holeR, holeR, 0.025, 32]} />
              <meshBasicMaterial color="#0a0a0a" depthTest={false} />
            </mesh>
          </group>
        ))
      )}
    </group>
  )
}

/* ══════════════════════════════════════════════════════════════
   LOGO DECAL
   ══════════════════════════════════════════════════════════════ */
function FaceLogo({ faceW, faceH, xPos, rotY, centerY }) {
  const texture = useTexture('/logo2.jpeg')
  const imgW    = texture.image?.naturalWidth  || texture.image?.width  || 300
  const imgH    = texture.image?.naturalHeight || texture.image?.height || 100
  const aspect  = imgW / imgH
  const logoW   = faceW * 0.50
  const logoH   = logoW / aspect
  // Absolute Y position: top of this wall minus inset
  const yPos    = centerY + faceH / 2 - logoH / 2 - faceH * 0.04

  return (
    <mesh position={[xPos, yPos, 0]} rotation={[0, rotY, 0]} renderOrder={10}>
      <planeGeometry args={[logoW, logoH]} />
      <meshBasicMaterial map={texture} transparent depthTest={false} toneMapped={false} />
    </mesh>
  )
}

/* ══════════════════════════════════════════════════════════════
   BOX SHELL  — long walls at h1, short walls at h2, both
   share the same bottom at y = -maxH/2
   ══════════════════════════════════════════════════════════════ */
function BlackBox({ w, h1, h2, maxH, l, color, holeCount, holeDiameterMm }) {
  const mat   = <meshStandardMaterial color={color} roughness={0.25} metalness={0.15} side={THREE.DoubleSide} />
  const t     = 0.008
  const off   = t / 2 + 0.002

  const longY  = -maxH / 2 + h1 / 2   // center Y of long walls  (x = ±w/2)
  const shortY = -maxH / 2 + h2 / 2   // center Y of short walls (z = ±l/2)

  return (
    <group>
      {/* Bottom */}
      <mesh position={[0, -maxH / 2, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, l, t]} />{mat}
      </mesh>

      {/* Front short wall (z = -l/2) */}
      <mesh position={[0, shortY, -l / 2]} castShadow receiveShadow>
        <boxGeometry args={[w, h2, t]} />{mat}
      </mesh>
      {/* Back short wall (z = +l/2) */}
      <mesh position={[0, shortY, l / 2]} castShadow receiveShadow>
        <boxGeometry args={[w, h2, t]} />{mat}
      </mesh>

      {/* Left long wall (x = -w/2) */}
      <mesh position={[-w / 2, longY, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[l, h1, t]} />{mat}
      </mesh>
      <FaceLogo faceW={l} faceH={h1} xPos={-w / 2 - off} rotY={-Math.PI / 2} centerY={longY} />

      {/* Right long wall (x = +w/2) */}
      <mesh position={[w / 2, longY, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[l, h1, t]} />{mat}
      </mesh>
      <FaceLogo faceW={l} faceH={h1} xPos={w / 2 + off} rotY={Math.PI / 2} centerY={longY} />

      {/* Side holes */}
      {holeCount > 0 && (
        <SideHoles w={w} h2={h2} maxH={maxH} l={l}
          holeCount={holeCount} holeDiameterMm={holeDiameterMm} />
      )}
    </group>
  )
}

/* ── Custom wireframe (handles h1 ≠ h2) ──────────────────── */
function BoxWireframe({ w, h1, h2, maxH, l }) {
  const b   = -maxH / 2
  const t1  = b + h1
  const t2  = b + h2
  const lp  = { color: '#000000', lineWidth: 2.5, depthTest: true }

  return (
    <group>
      {/* Bottom rectangle */}
      <Line points={[[-w/2, b, -l/2], [ w/2, b, -l/2]]} {...lp} />
      <Line points={[[ w/2, b, -l/2], [ w/2, b,  l/2]]} {...lp} />
      <Line points={[[ w/2, b,  l/2], [-w/2, b,  l/2]]} {...lp} />
      <Line points={[[-w/2, b,  l/2], [-w/2, b, -l/2]]} {...lp} />

      {/* 4 vertical corner edges — full height of the taller wall */}
      <Line points={[[-w/2, b, -l/2], [-w/2, Math.max(t1,t2), -l/2]]} {...lp} />
      <Line points={[[ w/2, b, -l/2], [ w/2, Math.max(t1,t2), -l/2]]} {...lp} />
      <Line points={[[ w/2, b,  l/2], [ w/2, Math.max(t1,t2),  l/2]]} {...lp} />
      <Line points={[[-w/2, b,  l/2], [-w/2, Math.max(t1,t2),  l/2]]} {...lp} />

      {/* Long wall top edges (at y=t1, along Z) */}
      <Line points={[[-w/2, t1, -l/2], [-w/2, t1, l/2]]} {...lp} />
      <Line points={[[ w/2, t1, -l/2], [ w/2, t1, l/2]]} {...lp} />

      {/* Short wall top edges (at y=t2, along X) */}
      <Line points={[[-w/2, t2, -l/2], [w/2, t2, -l/2]]} {...lp} />
      <Line points={[[-w/2, t2,  l/2], [w/2, t2,  l/2]]} {...lp} />
    </group>
  )
}

/* ══════════════════════════════════════════════════════════════
   BOX MODEL
   ══════════════════════════════════════════════════════════════ */
function BoxModel({
  lengthMm, widthMm, h1Mm, h2Mm, cellHeightMm,
  rows, columns, boxColor, cellMake, holeCount, holeDiameterMm,
}) {
  const w    = mmToSceneUnits(widthMm)
  const h1   = mmToSceneUnits(h1Mm)
  const h2   = mmToSceneUnits(h2Mm)
  const maxH = Math.max(h1, h2)
  const l    = mmToSceneUnits(lengthMm)

  return (
    <group>
      <BlackBox
        w={w} h1={h1} h2={h2} maxH={maxH} l={l}
        color={boxColor} holeCount={holeCount} holeDiameterMm={holeDiameterMm}
      />
      <BoxWireframe w={w} h1={h1} h2={h2} maxH={maxH} l={l} />
      <CellGrid
        w={w} h1={h1} h2={h2} maxH={maxH} l={l}
        rows={rows} cols={columns}
        cellHeightScene={cellHeightMm / 100}
        cellMake={cellMake}
      />
      <DimensionGuides
        w={w} h1={h1} h2={h2} maxH={maxH} l={l}
        lengthMm={lengthMm} widthMm={widthMm}
        h1Mm={h1Mm} h2Mm={h2Mm}
      />
    </group>
  )
}

/* ══════════════════════════════════════════════════════════════
   CANVAS EXPORT
   ══════════════════════════════════════════════════════════════ */
export const BoxScene = forwardRef(function BoxScene(
  {
    lengthMm, widthMm, h1Mm, h2Mm, cellHeightMm,
    rows, columns, boxColor = '#0f172a',
    cellMake = 'TAB', holeCount = 0, holeDiameterMm = 50,
  },
  ref
) {
  const helperRef = useRef()

  useImperativeHandle(ref, () => ({
    resetToStandardView() { helperRef.current?.resetToStandardView() },
  }))

  const initCam = STANDARD_DIR.clone().multiplyScalar(6).toArray()

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      camera={{ position: initCam, fov: 45, near: 0.01, far: 200 }}
    >
      <color attach="background" args={['#f8fafc']} />
      <ambientLight intensity={0.75} />
      <directionalLight position={[5, 10, 4]} intensity={1.5} castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <directionalLight position={[-4, 3, -3]} intensity={0.45} />
      <directionalLight position={[0, -3, 0]}  intensity={0.15} />

      <Bounds fit clip margin={1.6}>
        <BoxModel
          lengthMm={lengthMm} widthMm={widthMm}
          h1Mm={h1Mm} h2Mm={h2Mm}
          cellHeightMm={cellHeightMm}
          rows={rows} columns={columns}
          boxColor={boxColor}
          cellMake={cellMake}
          holeCount={holeCount}
          holeDiameterMm={holeDiameterMm}
        />
        <BoundsResetHelper helperRef={helperRef} />
      </Bounds>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <shadowMaterial transparent opacity={0.12} />
      </mesh>

      <OrbitControls makeDefault enablePan enableRotate enableZoom dampingFactor={0.08} />
      <Environment preset="studio" />
    </Canvas>
  )
})
