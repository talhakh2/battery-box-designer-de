import { useEffect, useMemo, useRef, useState } from 'react'
import { Spinner } from '../components/Spinner'
import { CATEGORIES, PARTS, PARTS_BY_ID } from '../parts/catalog'
import { PartsDocument } from '../parts/PartsDocument'
import { WhatsAppDialog } from '../parts/WhatsAppDialog'
import { exportReportPdf } from '../service/pdfExport'
import { todayIso } from '../service/readings'
import { Field, PhotosPanel, PreviewSection } from '../service/shared'

const DRAFT_KEY = 'de_parts_issue_draft_v1'

const EMPTY_FORM = {
  docRef: '', woNo: '', woDate: '', customer: '', batteryType: '', serialNo: '',
  invoiceNo: '', doNo: '', preparedBy: '',
  inventoryIncharge: '', deliveryDate: '', driverName: '', receivedBy: '',
}

const SIZES = ['25 MM', '35 MM', '50 MM', '70 MM', '95 MM']

function loadDraft() {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null')
    if (!d) return null
    const qty = Object.fromEntries(Object.entries(d.qty || {}).filter(([id, q]) => PARTS_BY_ID[id] && q > 0))
    return { form: { ...EMPTY_FORM, ...d.form }, qty, extras: Array.isArray(d.extras) ? d.extras : [] }
  } catch {
    return null
  }
}

function newExtra() {
  return { id: `x-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, desc: '', partNo: '', qty: 1 }
}

function Stepper({ value, onChange, big }) {
  return (
    <div className={`ptStepper${big ? ' big' : ''}`}>
      <button type="button" onClick={() => onChange(value - 1)} aria-label="Decrease quantity">−</button>
      <input
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          const n = Number.parseInt(e.target.value.replace(/\D/g, ''), 10)
          onChange(Number.isFinite(n) ? n : 0)
        }}
        onFocus={(e) => e.target.select()}
        aria-label="Quantity"
      />
      <button type="button" onClick={() => onChange(value + 1)} aria-label="Increase quantity">+</button>
    </div>
  )
}

export function PartsIssue({ addToast }) {
  const draft = useMemo(loadDraft, [])
  const [form, setForm] = useState(() => draft?.form ?? { ...EMPTY_FORM, woDate: todayIso() })
  const [qty, setQty] = useState(() => draft?.qty ?? {})
  const [extras, setExtras] = useState(() => draft?.extras ?? [])
  const [photos, setPhotos] = useState([])
  const [cat, setCat] = useState('icc')
  const [size, setSize] = useState('all')
  const [search, setSearch] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [sharePdf, setSharePdf] = useState(null) // { blob, filename } after download
  const reportRef = useRef(null)
  const selectedRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, qty, extras })) } catch { /* ignore */ }
    }, 400)
    return () => clearTimeout(t)
  }, [form, qty, extras])

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const setPartQty = (id, n) => {
    setQty(q => {
      const next = { ...q }
      const v = Math.max(0, Math.min(9999, n || 0))
      if (v === 0) delete next[id]
      else next[id] = v
      return next
    })
  }

  const setExtra = (id, patch) => setExtras(xs => xs.map(x => (x.id === id ? { ...x, ...patch } : x)))

  // ── What's visible in the picker ──
  const q = search.trim().toLowerCase()
  const visible = useMemo(() => {
    if (q) {
      return PARTS.filter(p => p.desc.toLowerCase().includes(q) || p.partNo.toLowerCase().includes(q) || (p.group || '').toLowerCase().includes(q))
    }
    return PARTS.filter(p => p.category === cat && (size === 'all' || p.group === size))
  }, [q, cat, size])

  const visibleGroups = useMemo(() => {
    const out = []
    for (const p of visible) {
      const label = q
        ? `${CATEGORIES.find(c => c.id === p.category).label}${p.group ? ` · ${p.group}` : ''}`
        : (p.group || '')
      let g = out[out.length - 1]
      if (!g || g.label !== label) { g = { label, items: [] }; out.push(g) }
      g.items.push(p)
    }
    return out
  }, [visible, q])

  const sizesForCat = useMemo(
    () => SIZES.filter(s => PARTS.some(p => p.category === cat && p.group === s)),
    [cat],
  )

  // ── Selected summary ──
  const selectedByCat = useMemo(() => {
    const counts = {}
    for (const id of Object.keys(qty)) {
      const c = PARTS_BY_ID[id]?.category
      if (c) counts[c] = (counts[c] || 0) + 1
    }
    return counts
  }, [qty])

  const cleanExtras = extras.filter(x => x.desc.trim() && x.qty > 0)

  const reportGroups = useMemo(() => {
    const groups = CATEGORIES.map(c => ({
      id: c.id,
      label: c.label,
      short: c.short,
      items: PARTS.filter(p => p.category === c.id && qty[p.id] > 0)
        .map(p => ({ key: p.id, desc: p.desc, partNo: p.partNo, group: p.group, qty: qty[p.id] })),
    })).filter(g => g.items.length)
    if (cleanExtras.length) {
      groups.push({
        id: 'extra', label: 'Additional Items', short: 'Additional',
        items: cleanExtras.map(x => ({ key: x.id, desc: x.desc.trim(), partNo: x.partNo.trim(), group: null, qty: x.qty })),
      })
    }
    return groups
  }, [qty, cleanExtras])

  const totalLines = reportGroups.reduce((a, g) => a + g.items.length, 0)
  const totalQty = reportGroups.reduce((a, g) => a + g.items.reduce((s, i) => s + i.qty, 0), 0)

  const onDownload = async () => {
    if (!totalLines) { addToast('Select at least one part first', 'error', 3500); return }
    if (!reportRef.current) return
    const safe = (s) => String(s || '').trim().replaceAll(/[^\w-]+/g, '_')
    const filename = ['PartsIssue', safe(form.docRef || form.woNo), safe(form.customer), form.woDate || todayIso()]
      .filter(Boolean).join('_').slice(0, 100) + '.pdf'
    setIsExporting(true)
    await new Promise(r => setTimeout(r, 60))
    try {
      const out = await exportReportPdf(reportRef.current, filename, {
        footerLeft: `Parts Issue Form${form.docRef ? ` · DE-PIF-REF ${form.docRef}` : ''}`,
      })
      setSharePdf(out)
    } catch (err) {
      console.error(err)
      addToast('Failed to generate PDF', 'error', 4000)
    } finally {
      setIsExporting(false)
    }
  }

  const newForm = () => {
    if (!window.confirm('Start a new parts issue form? All fields, selected parts and photos will be cleared.')) return
    setForm({ ...EMPTY_FORM, woDate: todayIso() })
    setQty({})
    setExtras([])
    setPhotos([])
  }

  const clearParts = () => {
    if (!window.confirm('Remove all selected parts?')) return
    setQty({})
    setExtras([])
  }

  const downloadBtn = (
    <button type="button" className="primaryBtn" onClick={onDownload} disabled={isExporting}>
      {isExporting ? <><Spinner size="sm" /><span>Generating PDF…</span></> : 'Download PDF'}
    </button>
  )

  return (
    <>
      <div className="tabToolbar">
        <div>
          <div className="tabToolbarTitle">Parts Issue Form</div>
          <div className="tabToolbarSub">Tap the parts you need, set quantities — only selected parts go into the PDF.</div>
        </div>
        <div className="topActions">
          <button type="button" className="secondary" onClick={newForm}>New Form</button>
          {downloadBtn}
        </div>
      </div>

      <main className="srLayout ptLayout">
        <div className="srMain">
          {/* ── Header details ── */}
          <section className="panel ptO1">
            <h2 className="panelTitle">Form Details</h2>
            <div className="form">
              <section className="formSection">
                <div className="fieldGroupLabel">Work Order</div>
                <div className="srGrid srGrid3">
                  <Field label="DE-PIF-REF (Document Ref)"><input value={form.docRef} onChange={set('docRef')} placeholder="e.g. PIF-2026-0311" /></Field>
                  <Field label="Work Order No."><input value={form.woNo} onChange={set('woNo')} /></Field>
                  <Field label="Work Order Date"><input type="date" value={form.woDate} onChange={set('woDate')} /></Field>
                  <Field label="Customer Name" wide><input value={form.customer} onChange={set('customer')} placeholder="Customer / site name" /></Field>
                  <Field label="Battery / Charger Type"><input value={form.batteryType} onChange={set('batteryType')} placeholder="e.g. 48V 5PzS625" /></Field>
                  <Field label="Serial Number"><input value={form.serialNo} onChange={set('serialNo')} /></Field>
                </div>
              </section>
              <section className="formSection">
                <div className="fieldGroupLabel">Invoice &amp; Preparation</div>
                <div className="srGrid srGrid3">
                  <Field label="Invoice No."><input value={form.invoiceNo} onChange={set('invoiceNo')} /></Field>
                  <Field label="D.O. No."><input value={form.doNo} onChange={set('doNo')} /></Field>
                  <Field label="Prepared By (Name)"><input value={form.preparedBy} onChange={set('preparedBy')} /></Field>
                </div>
              </section>
            </div>
          </section>

          {/* ── Part picker ── */}
          <section className="panel ptO2">
            <h2 className="panelTitle">Select Parts</h2>
            <div className="ptSearch">
              <span aria-hidden="true">🔍</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or part number, e.g. 50/120, vent cup, 6105…"
                aria-label="Search parts"
              />
              {search && <button type="button" className="ptClear" onClick={() => setSearch('')} aria-label="Clear search">×</button>}
            </div>

            {!q && (
              <>
                <div className="ptCats" role="tablist" aria-label="Part categories">
                  {CATEGORIES.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      role="tab"
                      aria-selected={cat === c.id}
                      className={`ptCat${cat === c.id ? ' active' : ''}`}
                      onClick={() => { setCat(c.id); setSize('all') }}
                    >
                      <span className="ptCatIcon" aria-hidden="true">{c.icon}</span>
                      <span>{c.short}</span>
                      {selectedByCat[c.id] > 0 && <span className="ptCatBadge">{selectedByCat[c.id]}</span>}
                    </button>
                  ))}
                  <button
                    type="button"
                    role="tab"
                    aria-selected={cat === 'extra'}
                    className={`ptCat${cat === 'extra' ? ' active' : ''}`}
                    onClick={() => setCat('extra')}
                  >
                    <span className="ptCatIcon" aria-hidden="true">➕</span>
                    <span>Additional</span>
                    {cleanExtras.length > 0 && <span className="ptCatBadge">{cleanExtras.length}</span>}
                  </button>
                </div>

                {sizesForCat.length > 1 && cat !== 'extra' && (
                  <div className="ptSizes">
                    <span>Size</span>
                    {['all', ...sizesForCat].map(s => (
                      <button key={s} type="button" className={`presetBtn${size === s ? ' active' : ''}`} onClick={() => setSize(s)}>
                        {s === 'all' ? 'All' : s}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {!q && cat === 'extra' ? (
              <div className="ptExtras">
                <div className="srCellHelp">Add any item that isn&apos;t on the list. It prints under &quot;Additional Items&quot;.</div>
                {extras.map((x, i) => (
                  <div className="ptExtraRow" key={x.id}>
                    <span className="ptExtraNo">{i + 1}</span>
                    <input value={x.desc} placeholder="Description" onChange={(e) => setExtra(x.id, { desc: e.target.value })} aria-label={`Additional item ${i + 1} description`} />
                    <input value={x.partNo} placeholder="Part No. (optional)" onChange={(e) => setExtra(x.id, { partNo: e.target.value })} aria-label={`Additional item ${i + 1} part number`} />
                    <Stepper value={x.qty} onChange={(n) => setExtra(x.id, { qty: Math.max(1, Math.min(9999, n)) })} />
                    <button type="button" className="ptRemove" onClick={() => setExtras(xs => xs.filter(e => e.id !== x.id))} aria-label={`Remove additional item ${i + 1}`}>×</button>
                  </div>
                ))}
                <button type="button" className="secondary" onClick={() => setExtras(xs => [...xs, newExtra()])}>+ Add Item</button>
              </div>
            ) : (
              <>
                {q && <div className="srCellHelp">{visible.length} result{visible.length === 1 ? '' : 's'} for “{search.trim()}”</div>}
                {visibleGroups.map(g => (
                  <div key={g.label || 'all'} className="ptGroup">
                    {g.label && <div className="ptGroupTitle">{g.label}</div>}
                    <div className="ptGrid">
                      {g.items.map(p => {
                        const n = qty[p.id] || 0
                        return (
                          <div key={p.id} className={`ptCard${n ? ' on' : ''}`}>
                            <button type="button" className="ptCardMain" onClick={() => setPartQty(p.id, n ? n : 1)}>
                              <span className="ptDesc">{p.desc}</span>
                              <span className="ptNo">{p.partNo}</span>
                            </button>
                            {n ? (
                              <Stepper big value={n} onChange={(v) => setPartQty(p.id, v)} />
                            ) : (
                              <button type="button" className="ptAdd" onClick={() => setPartQty(p.id, 1)}>+ Add</button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
                {visible.length === 0 && <div className="altEmpty">No parts match. Try another word or add it under Additional.</div>}
              </>
            )}
          </section>

          <PhotosPanel className="ptO4" photos={photos} setPhotos={setPhotos} addToast={addToast} />

          {/* ── Delivery ── */}
          <section className="panel ptO5">
            <h2 className="panelTitle">Final Review &amp; Delivery</h2>
            <div className="formSection">
              <div className="srGrid">
                <Field label="Name (Inventory Incharge)"><input value={form.inventoryIncharge} onChange={set('inventoryIncharge')} /></Field>
                <Field label="Delivery Date"><input type="date" value={form.deliveryDate} onChange={set('deliveryDate')} /></Field>
                <Field label="Delivered By (Driver Name)"><input value={form.driverName} onChange={set('driverName')} placeholder="Driver's name" /></Field>
                <Field label="Received By (Customer, optional)"><input value={form.receivedBy} onChange={set('receivedBy')} /></Field>
              </div>
            </div>
          </section>

          <PreviewSection
            className="ptO6"
            title="Form Preview"
            reportRef={reportRef}
            downloadBtn={downloadBtn}
            document={(
            <PartsDocument form={form} groups={reportGroups} totalLines={totalLines} totalQty={totalQty} photos={photos} />
            )}
          />
        </div>

        {/* ── Selected parts sidebar ── */}
        <aside className="srSide ptO3" id="partsSelected" ref={selectedRef}>
          <section className="panel">
            <h2 className="panelTitle">Selected Parts</h2>
            <div className="ptTotals">
              <div><strong>{totalLines}</strong><span>items</span></div>
              <div><strong>{totalQty}</strong><span>total qty</span></div>
            </div>
            {totalLines === 0 ? (
              <div className="ptEmpty">Nothing selected yet. Tap a part to add it.</div>
            ) : (
              <div className="ptSelList">
                {reportGroups.map(g => (
                  <div key={g.id}>
                    <div className="ptSelCat">{g.label}</div>
                    {g.items.map(it => (
                      <div className="ptSelRow" key={it.key}>
                        <div className="ptSelText">
                          <strong>{it.desc}</strong>
                          <span>{it.partNo}{it.group ? ` · ${it.group}` : ''}</span>
                        </div>
                        {g.id === 'extra' ? (
                          <span className="ptSelQty">× {it.qty}</span>
                        ) : (
                          <Stepper value={it.qty} onChange={(v) => setPartQty(it.key, v)} />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
            {totalLines > 0 && (
              <button type="button" className="secondary ptClearAll" onClick={clearParts}>Clear all</button>
            )}
          </section>
          <section className="panel srSideActions">{downloadBtn}</section>
        </aside>
      </main>

      {sharePdf && (
        <WhatsAppDialog
          file={sharePdf}
          shareText={`Parts Issue Form${form.docRef ? ` ${form.docRef}` : ''}${form.customer ? ` — ${form.customer}` : ''}`}
          onClose={() => setSharePdf(null)}
        />
      )}

      {/* Mobile: always-visible count + jump to the selected list */}
      <div className="ptMobileBar">
        <span><strong>{totalLines}</strong> items · qty <strong>{totalQty}</strong></span>
        <button type="button" className="secondary" onClick={() => selectedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Review</button>
        {downloadBtn}
      </div>
    </>
  )
}
