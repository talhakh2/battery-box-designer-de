import { Canvas, useThree } from '@react-three/fiber'
import {
  Billboard,
  Bounds,
  Edges,
  Environment,
  Line,
  OrbitControls,
  RoundedBox,
  Text,
  useBounds,
  useTexture,
} from '@react-three/drei'
import * as THREE from 'three'
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'

// Unit direction for standard view: front-left, slightly elevated
const STANDARD_DIR = new THREE.Vector3(-2.8, 1.8, 3.0).normalize()

/** Lives inside <Bounds> — uses useBounds() to do a proper fit after
 *  pointing the camera at the standard angle. */
function BoundsResetHelper({ helperRef }) {
  const bounds             = useBounds()
  const { camera, controls } = useThree()

  useImperativeHandle(helperRef, () => ({
    resetToStandardView() {
      // Current orbit distance (keep scale, just change angle)
      const target = controls ? controls.target.clone() : new THREE.Vector3()
      const dist   = camera.position.distanceTo(target)
      // Aim from standard direction
      camera.position.copy(
        STANDARD_DIR.clone().multiplyScalar(Math.max(dist, 3))
      )
      camera.lookAt(target)
      if (controls) { controls.target.copy(target); controls.update() }
      // Re-fit so Bounds picks the right zoom for this angle
      bounds.refresh().fit()
    },
  }))

  return null
}

function mmToSceneUnits(mm) {
  return mm / 100
}

/* ═══════════════════════════════════════════════════════════════
   3-D BATTERY CELL MODEL
   Replicates the real cell top-view:
     • silver rectangular body
     • two hex-bolt terminals (left & right)
     • central round vent cap with indicator dot
   ═══════════════════════════════════════════════════════════════ */

/** Hex-bolt terminal: collar disc + hex nut + stud */
function Terminal({ x, cellW, cellL }) {
  const collarR = Math.min(cellW, cellL) * 0.16
  const nutR    = collarR * 0.72
  const studR   = nutR * 0.38
  const collarH = 0.018
  const nutH    = 0.028
  const studH   = 0.014

  return (
    <group position={[x, 0, 0]}>
      {/* Collar — flat wide disc */}
      <mesh castShadow>
        <cylinderGeometry args={[collarR, collarR, collarH, 32]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.22} metalness={0.88} />
      </mesh>
      {/* Hex nut */}
      <mesh castShadow position={[0, (collarH + nutH) / 2, 0]}>
        <cylinderGeometry args={[nutR, nutR, nutH, 6]} />
        <meshStandardMaterial color="#64748b" roughness={0.18} metalness={0.92} />
      </mesh>
      {/* Stud on top of nut */}
      <mesh position={[0, (collarH + nutH) + studH / 2, 0]}>
        <cylinderGeometry args={[studR, studR, studH, 16]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.15} metalness={0.95} />
      </mesh>
    </group>
  )
}

/** Central vent cap: round black cap + small indicator light */
function VentCap({ cellW, cellL }) {
  const capR   = Math.min(cellW, cellL) * 0.12
  const capH   = 0.026
  const dotR   = capR * 0.28
  const dotH   = 0.008

  return (
    <group position={[0, 0, 0]}>
      {/* Black cap body */}
      <mesh castShadow>
        <cylinderGeometry args={[capR, capR * 1.08, capH, 32]} />
        <meshStandardMaterial color="#1e293b" roughness={0.35} metalness={0.3} />
      </mesh>
      {/* Small indicator dot (white/silver) */}
      <mesh position={[0, capH / 2 + dotH / 2, 0]}>
        <cylinderGeometry args={[dotR, dotR, dotH, 16]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.1} metalness={0.5} emissive="#cbd5e1" emissiveIntensity={0.3} />
      </mesh>
    </group>
  )
}

/** Full single cell — body + terminals + vent */
function BatteryCell({ size, index }) {
  const [cw, ch, cl] = size

  // Elevate terminals / vent to sit on the top face
  const topY = ch / 2

  // Terminal X offset — place them symmetrically, like in the photo
  const tOffX = cw * 0.27

  return (
    <group>
      {/* ── Cell body ── silver-grey aluminium casing */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[cw, ch, cl]} />
        <meshStandardMaterial color="#b0b8c4" roughness={0.28} metalness={0.55} />
      </mesh>

      {/* Thin top face highlight (slightly lighter plate) */}
      <mesh position={[0, topY - 0.003, 0]}>
        <boxGeometry args={[cw * 0.96, 0.006, cl * 0.96]} />
        <meshStandardMaterial color="#d1d9e0" roughness={0.2} metalness={0.6} />
      </mesh>

      {/* Dark edge outline */}
      <mesh>
        <boxGeometry args={[cw, ch, cl]} />
        <Edges color="#334155" threshold={10} />
      </mesh>

      {/* ── Left terminal (positive) ── */}
      <group position={[-tOffX, topY, 0]}>
        <Terminal x={0} cellW={cw} cellL={cl} />
      </group>

      {/* ── Right terminal (negative) ── */}
      <group position={[tOffX, topY, 0]}>
        <Terminal x={0} cellW={cw} cellL={cl} />
      </group>

      {/* ── Centre vent cap ── */}
      <group position={[0, topY, 0]}>
        <VentCap cellW={cw} cellL={cl} />
      </group>

      {/* ── Cell number badge ── */}
      <Billboard follow position={[0, topY + 0.2, 0]}>
        <RoundedBox args={[0.26, 0.18, 0.02]} radius={0.04} smoothness={4}>
          <meshBasicMaterial color="#0f172a" depthTest={false} />
        </RoundedBox>
        <Text
          position={[0, 0, 0.02]}
          fontSize={0.1}
          color="#ffffff"
          depthTest={false}
          renderOrder={15}
        >
          {index + 1}
        </Text>
      </Billboard>
    </group>
  )
}

/* ── Grid of cells ───────────────────────────────────────────── */
function CellGrid({ w, h, l, rows, cols, cellHeightScene }) {
  const cells = useMemo(() => {
    const gap   = 0.022
    const cellW = (w - gap * (cols + 1)) / cols
    const cellL = (l - gap * (rows + 1)) / rows
    // Use exact cell height clamped to fit inside the box (leave gap at top)
    const cellH = Math.min(Math.max(0.08, cellHeightScene), h - gap * 2)
    const startX = -w / 2 + gap + cellW / 2
    const startZ = -l / 2 + gap + cellL / 2
    const y      = -h / 2 + cellH / 2 + gap

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
  }, [w, h, l, rows, cols])

  return (
    <group>
      {cells.map((cell) => (
        <group key={cell.key} position={cell.position}>
          <BatteryCell size={cell.size} index={cell.index} />
        </group>
      ))}
    </group>
  )
}

/* ── Always-visible dimension label pill ────────────────────── */
function DimLabel({ position, text, accentColor }) {
  const bgW = Math.min(2.8, Math.max(1.2, text.length * 0.138))
  return (
    <Billboard follow>
      <group position={position}>
        <RoundedBox args={[bgW, 0.32, 0.05]} radius={0.09} smoothness={6}>
          <meshBasicMaterial color={accentColor} depthTest={false} depthWrite={false} />
        </RoundedBox>
        <Text
          position={[0, 0, 0.05]}
          fontSize={0.17}
          color="#ffffff"
          outlineWidth={0.012}
          outlineColor={accentColor}
          outlineOpacity={0.5}
          depthTest={false}
          depthWrite={false}
          renderOrder={2001}
        >
          {text}
        </Text>
      </group>
    </Billboard>
  )
}

function Tick({ a, b, color }) {
  return <Line points={[a, b]} color={color} lineWidth={2.5} depthTest={false} />
}

function DimensionGuides({ w, h, l, lengthMm, widthMm, heightMm }) {
  const pad  = 0.38
  const tk   = 0.09
  const yTop   =  h / 2 + pad
  const yBot   = -h / 2 - pad
  const xRight =  w / 2 + pad
  const xLeft  = -w / 2 - pad
  const zFront = -l / 2 - pad
  const zBack  =  l / 2 + pad
  const wColor = '#f97316'
  const lColor = '#8b5cf6'
  const hColor = '#22c55e'
  const lp     = { depthTest: false, lineWidth: 2.8 }

  return (
    <group>
      {/* Width */}
      <Line points={[[-w / 2, yTop, zFront], [w / 2, yTop, zFront]]} color={wColor} {...lp} />
      <Tick a={[-w / 2, yTop - tk, zFront]} b={[-w / 2, yTop + tk, zFront]} color={wColor} />
      <Tick a={[ w / 2, yTop - tk, zFront]} b={[ w / 2, yTop + tk, zFront]} color={wColor} />
      <DimLabel position={[0, yTop + 0.24, zFront]} text={`W  ${widthMm} mm`} accentColor={wColor} />

      {/* Length */}
      <Line points={[[xLeft, yBot, -l / 2], [xLeft, yBot, l / 2]]} color={lColor} {...lp} />
      <Tick a={[xLeft - tk, yBot, -l / 2]} b={[xLeft + tk, yBot, -l / 2]} color={lColor} />
      <Tick a={[xLeft - tk, yBot,  l / 2]} b={[xLeft + tk, yBot,  l / 2]} color={lColor} />
      <DimLabel position={[xLeft, yBot - 0.24, 0]} text={`L  ${lengthMm} mm`} accentColor={lColor} />

      {/* Box Height */}
      <Line points={[[xRight, -h / 2, zBack], [xRight, h / 2, zBack]]} color={hColor} {...lp} />
      <Tick a={[xRight - tk, -h / 2, zBack]} b={[xRight + tk, -h / 2, zBack]} color={hColor} />
      <Tick a={[xRight - tk,  h / 2, zBack]} b={[xRight + tk,  h / 2, zBack]} color={hColor} />
      <DimLabel position={[xRight + 0.05, 0, zBack]} text={`H  ${heightMm} mm`} accentColor={hColor} />

      {/* Cell Height guide removed — shown in spec sheet instead */}
    </group>
  )
}

/** Logo decal — centred on a face, preserves image aspect ratio.
 *  xPos / rotY control which length-side face it appears on. */
function FaceLogo({ faceW, faceH, xPos, rotY }) {
  const texture = useTexture('/logo2.jpeg')

  const imgW  = texture.image?.naturalWidth  || texture.image?.width  || 300
  const imgH  = texture.image?.naturalHeight || texture.image?.height || 100
  const aspect = imgW / imgH

  // Logo fills ~50 % of the long face width, height derived from aspect
  const logoW = faceW * 0.50
  const logoH = logoW / aspect

  // Top-middle: flush to the top edge with a small inset
  const yPos = faceH / 2 - logoH / 2 - faceH * 0.04

  return (
    <mesh position={[xPos, yPos, 0]} rotation={[0, rotY, 0]} renderOrder={10}>
      <planeGeometry args={[logoW, logoH]} />
      <meshBasicMaterial map={texture} transparent depthTest={false} toneMapped={false} />
    </mesh>
  )
}

/** Solid box — 5 faces (no top lid) so cells are visible from above */
function BlackBox({ w, h, l, color }) {
  const mat = <meshStandardMaterial color={color} roughness={0.25} metalness={0.15} side={THREE.DoubleSide} />
  const t   = 0.008                // panel thickness
  const off = t / 2 + 0.002       // logo sits just outside the panel surface

  return (
    <group>
      {/* Bottom */}
      <mesh position={[0, -h / 2, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, l, t]} />{mat}
      </mesh>

      {/* Front face (z = -l/2) — narrow width face, no logo */}
      <mesh position={[0, 0, -l / 2]} castShadow receiveShadow>
        <boxGeometry args={[w, h, t]} />{mat}
      </mesh>

      {/* Back face (z = +l/2) — narrow width face, no logo */}
      <mesh position={[0, 0, l / 2]} castShadow receiveShadow>
        <boxGeometry args={[w, h, t]} />{mat}
      </mesh>

      {/* Left face (x = -w/2) — LONG length side — logo facing outward (-X) */}
      <mesh position={[-w / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[l, h, t]} />{mat}
      </mesh>
      <FaceLogo faceW={l} faceH={h} xPos={-w / 2 - off} rotY={-Math.PI / 2} />

      {/* Right face (x = +w/2) — LONG length side — logo facing outward (+X) */}
      <mesh position={[w / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[l, h, t]} />{mat}
      </mesh>
      <FaceLogo faceW={l} faceH={h} xPos={w / 2 + off} rotY={Math.PI / 2} />
    </group>
  )
}

/* ── Outer box shell ─────────────────────────────────────────── */
function BoxModel({ lengthMm, widthMm, heightMm, cellHeightMm, rows, columns, boxColor }) {
  const w = mmToSceneUnits(widthMm)
  const h = mmToSceneUnits(heightMm)
  const l = mmToSceneUnits(lengthMm)
  const boxGeo = useMemo(() => new THREE.BoxGeometry(w, h, l), [w, h, l])

  return (
    <group>
      {/* 5-sided solid shell (top open) */}
      <BlackBox w={w} h={h} l={l} color={boxColor} />
      {/* Bold wireframe edges */}
      <mesh geometry={boxGeo}>
        <meshBasicMaterial transparent opacity={0} />
        <Edges color="#000000" threshold={15} lineWidth={2.5} />
      </mesh>

      <CellGrid w={w} h={h} l={l} rows={rows} cols={columns} cellHeightScene={cellHeightMm / 100} />

      <DimensionGuides
        w={w} h={h} l={l}
        lengthMm={lengthMm} widthMm={widthMm} heightMm={heightMm}
      />
    </group>
  )
}

/* ── Canvas ──────────────────────────────────────────────────── */
export const BoxScene = forwardRef(function BoxScene(
  { lengthMm, widthMm, heightMm, cellHeightMm, rows, columns, boxColor = '#0f172a' },
  ref
) {
  // helperRef is forwarded into BoundsResetHelper which lives inside Canvas
  const helperRef = useRef()

  // Forward the helper's method to the parent ref
  useImperativeHandle(ref, () => ({
    resetToStandardView() {
      helperRef.current?.resetToStandardView()
    },
  }))

  // Initial camera placed along the standard direction so Bounds fits correctly
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
      <directionalLight
        position={[5, 10, 4]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-4, 3, -3]} intensity={0.45} />
      <directionalLight position={[0, -3, 0]}  intensity={0.15} />

      <Bounds fit clip observe margin={1.6}>
        <BoxModel
          lengthMm={lengthMm}
          widthMm={widthMm}
          heightMm={heightMm}
          cellHeightMm={cellHeightMm}
          rows={rows}
          columns={columns}
          boxColor={boxColor}
        />
        {/* Must be inside <Bounds> to access useBounds() */}
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
