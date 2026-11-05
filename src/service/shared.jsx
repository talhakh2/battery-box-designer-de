// Pieces shared by the Battery and Charger service reports.
import { useLayoutEffect, useRef, useState } from 'react'
import { Spinner } from '../components/Spinner'
import { fileToPhoto, isImageFile } from './photos'
import { ENGINEER_NAME } from './readings'

export const MAX_PHOTOS = 12
export const REPORT_W = 794 // px, ≈ A4 width at 96 dpi

export function Field({ label, children, wide }) {
  return (
    <label className={`field${wide ? ' srWide' : ''}`}>
      <span>{label}</span>
      {children}
    </label>
  )
}

export function ScaledPreview({ children }) {
  const outerRef = useRef(null)
  const innerRef = useRef(null)
  const [scale, setScale] = useState(1)
  const [height, setHeight] = useState(0)

  useLayoutEffect(() => {
    const outer = outerRef.current
    const inner = innerRef.current
    if (!outer || !inner) return
    const update = () => {
      // Hidden tabs report 0 width; keep the last good scale.
      if (!outer.clientWidth) return
      const s = Math.min(1, outer.clientWidth / REPORT_W)
      setScale(s)
      setHeight(inner.offsetHeight * s)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(outer)
    ro.observe(inner)
    return () => ro.disconnect()
  }, [])

  return (
    <div className="srPreviewOuter" ref={outerRef} style={{ height: height || undefined }}>
      <div className="srPreviewInner" data-pdf-scaler ref={innerRef} style={{ width: REPORT_W, transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  )
}

/** Photo attach panel: camera + browse, images only. */
export function PhotosPanel({ photos, setPhotos, addToast, className = '' }) {
  const cameraRef = useRef(null)
  const browseRef = useRef(null)
  const [busy, setBusy] = useState(false)

  const addFiles = async (fileList) => {
    const files = [...(fileList || [])]
    if (!files.length) return
    const images = files.filter(isImageFile)
    if (images.length < files.length) addToast('Only image files can be attached', 'error', 3500)
    const room = MAX_PHOTOS - photos.length
    if (room <= 0) { addToast(`Maximum ${MAX_PHOTOS} photos`, 'error'); return }
    setBusy(true)
    const added = []
    for (const f of images.slice(0, room)) {
      try { added.push(await fileToPhoto(f)) } catch { addToast(`Could not read ${f.name}`, 'error') }
    }
    if (images.length > room) addToast(`Only ${room} more photo(s) allowed`, 'info')
    setPhotos(p => [...p, ...added])
    setBusy(false)
  }

  const onPick = (e) => { addFiles(e.target.files); e.target.value = '' }
  const full = photos.length >= MAX_PHOTOS

  return (
    <section className={`panel ${className}`}>
      <h2 className="panelTitle">Attached Photos</h2>
      <div className="formSection">
        <div className="srPhotoActions">
          <button type="button" className="primaryBtn" onClick={() => cameraRef.current?.click()} disabled={busy || full}>📷 Take Photo</button>
          <button type="button" className="secondary" onClick={() => browseRef.current?.click()} disabled={busy || full}>🖼 Browse Images</button>
          {busy && <Spinner size="sm" />}
          <span className="hint">{photos.length}/{MAX_PHOTOS} · images only · shown in the PDF under &quot;Attached Photos&quot;</span>
        </div>
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={onPick} />
        <input ref={browseRef} type="file" accept="image/*" multiple hidden onChange={onPick} />
        {photos.length > 0 && (
          <div className="srPhotoGrid">
            {photos.map((p, i) => (
              <div className="srPhotoCard" key={p.id}>
                <div className="srPhotoThumb"><img src={p.dataUrl} alt={`Photo ${i + 1}`} /></div>
                <div className="srPhotoMeta">
                  <strong>Photo {i + 1}</strong>
                  <input
                    value={p.caption}
                    placeholder="Caption (optional)"
                    onChange={(e) => setPhotos(ps => ps.map(x => (x.id === p.id ? { ...x, caption: e.target.value } : x)))}
                  />
                </div>
                <button type="button" className="srPhotoRemove" onClick={() => setPhotos(ps => ps.filter(x => x.id !== p.id))} aria-label={`Remove photo ${i + 1}`}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

/** Technician / Engineer selector + "Verified by" toggle. */
export function SignOffPanel({
  role, signature, techName, setTechName, techNameRef,
  verified, verifiedAt, onChooseRole, onToggleVerify, className = '',
}) {
  const isEngineer = role === 'engineer'
  return (
    <section className={`panel ${className}`}>
      <h2 className="panelTitle">Inspected &amp; Verified By</h2>
      <div className="form">
        <section className="formSection">
          <div className="fieldGroupLabel">Inspected By</div>
          <div className="segmentedGroup">
            {[
              { id: 'technician', label: 'Technician' },
              { id: 'engineer', label: 'Engineer', lock: !signature },
            ].map(o => (
              <label key={o.id} className={`segmentedOption${role === o.id ? ' selected' : ''}`}>
                <input type="radio" checked={role === o.id} onChange={() => onChooseRole(o.id)} />
                <span className="segmentedLabel">{o.label}{o.lock ? ' 🔒' : ''}</span>
              </label>
            ))}
          </div>
          {isEngineer ? (
            <div className="srEngineerBadge">✓ {ENGINEER_NAME}</div>
          ) : (
            <Field label="Technician Name">
              <input ref={techNameRef} value={techName} onChange={(e) => setTechName(e.target.value)} placeholder="Name shown on the report" />
            </Field>
          )}
        </section>

        <section className="formSection">
          <div className="fieldGroupLabel">Verification</div>
          <button type="button" className={`srVerify${verified ? ' on' : ''}`} onClick={onToggleVerify} aria-pressed={verified}>
            <span className="srVerifyBox">{verified ? '✓' : ''}</span>
            <span className="srVerifyText">
              <strong>Verified by {ENGINEER_NAME}</strong>
              <small>{verified ? `Verified on ${verifiedAt} — signature added to the report` : 'Password required. Adds his signature to the bottom of the report.'}</small>
            </span>
            {!verified && <span aria-hidden="true">🔒</span>}
          </button>
        </section>
      </div>
    </section>
  )
}

function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

/** PDF: photos section, one block per row of two so a photo is never split across pages. */
export function ReportPhotos({ photos, heading }) {
  return chunk(photos, 2).map((row, ri) => (
    <div data-pdf-block data-pdf-photo className="rpBlock" key={row[0].id}>
      {ri === 0 && <div className="rpSectionBar">{heading}</div>}
      <div className="rpPhotoRow">
        {row.map((p, pi) => (
          <figure className="rpPhoto" key={p.id}>
            <div className="rpPhotoFrame">
              <img src={p.dataUrl} alt={p.caption || `Photo ${ri * 2 + pi + 1}`} />
            </div>
            <figcaption>
              <strong>Photo {ri * 2 + pi + 1}</strong>{p.caption ? ` — ${p.caption}` : ''}
            </figcaption>
          </figure>
        ))}
        {row.length === 1 && <div className="rpPhoto rpPhotoEmpty" />}
      </div>
    </div>
  ))
}

/** PDF: inspector + verification boxes and company footer. */
export function ReportSignOff({ role, techName, verified, verifiedAt, signatureSrc, designation, dateText }) {
  const inspector = role === 'engineer' ? ENGINEER_NAME : (techName || '').trim()
  const inspectorRole = role === 'engineer' ? 'Engineer' : 'Technician'
  return (
    <div data-pdf-block className="rpBlock">
      <div className="rpSign">
        <div className="rpSignBox">
          <div className="rpSignLabel">{inspectorRole}&apos;s Name &amp; Signature</div>
          <div className="rpSignName">{inspector || ' '}</div>
          <div className="rpSignRole">{inspector ? (designation || inspectorRole) : ''}{dateText ? ` · ${dateText}` : ''}</div>
          <div className="rpSignLine" />
          <div className="rpSignHint">Signature</div>
        </div>
        <div className={`rpSignBox rpVerifyBox${verified ? ' isVerified' : ''}`}>
          <div className="rpSignLabel">Verified By</div>
          {verified ? (
            <>
              <div className="rpVerifiedBadge">✓ Verified</div>
              {signatureSrc && <img className="rpSignature" src={signatureSrc} alt="Signature of Engr. Abdullah Farooq" />}
              <div className="rpSignLine" />
              <div className="rpSignName">{ENGINEER_NAME}</div>
              <div className="rpSignRole">Verified on {verifiedAt}</div>
            </>
          ) : (
            <>
              <div className="rpSignName rpPending">{ENGINEER_NAME}</div>
              <div className="rpSignRole">Pending verification</div>
            </>
          )}
        </div>
      </div>

      <div className="pdfFooterNote">
        <div className="pdfFooterRow">
          <div className="pdfFooterLeft">
            <span className="pdfFooterBadge">Field Service Toolkit</span>
            <span className="pdfFooterAddress">Battery &amp; Charger Field Service</span>
          </div>
          <div className="pdfFooterRight">
            <span className="pdfFooterUrl">For personal convenience only — not an authorized document</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Report preview on demand. The document is always rendered off-screen (that copy is
 * what the PDF is made from); the visible preview opens in a dialog only when asked.
 */
export function PreviewSection({ title = 'Report Preview', reportRef, document, downloadBtn, className = '' }) {
  const [open, setOpen] = useState(false)
  return (
    <section className={`panel ${className}`}>
      <h2 className="panelTitle">{title}</h2>
      <div className="srPreviewCta">
        <button type="button" className="secondary" onClick={() => setOpen(true)}>👁 Preview Report</button>
        {downloadBtn}
      </div>

      <div className="srOffscreen" data-pdf-offscreen aria-hidden="true">
        <div ref={reportRef}>{document}</div>
      </div>

      {open && (
        <div className="srModalBackdrop srPreviewModal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="srPreviewSheet">
            <div className="srPreviewHead">
              <strong>{title}</strong>
              <div className="srPreviewHeadActions">
                {downloadBtn}
                <button type="button" className="secondary" onClick={() => setOpen(false)}>Close</button>
              </div>
            </div>
            <div className="srPreviewBody">
              <ScaledPreview>{document}</ScaledPreview>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
