import './App.css'
import './service/ServiceReport.css'
import './theme.css'
import { useCallback, useState } from 'react'
import { BoxDesigner } from './tabs/BoxDesigner'
import { ServiceReport } from './tabs/ServiceReport'
import { ChargerReport } from './tabs/ChargerReport'
import { PartsIssue } from './tabs/PartsIssue'
import { ToastContainer } from './components/Toast'
import { ErrorBoundary } from './components/ErrorBoundary'
import { PasswordDialog } from './service/PasswordDialog'
import { BatteryHero } from './components/BatteryHero'
import { Disclaimer } from './components/Disclaimer'
import bcrypt from 'bcryptjs'

// bcrypt hash of the shared tab password (the password itself is not stored)
const TAB_HASH = '$2b$08$uZxlF2.0Pf2z3fQPlo0AJuTmEtf/UmTlN9Cuuy7eFI4tLbMzZYVCm'
const UNLOCK_KEY = 'de_tab_unlocked_v1'

function readUnlocked() {
  try { return JSON.parse(sessionStorage.getItem(UNLOCK_KEY) || '{}') } catch { return {} }
}

async function checkTabPassword(pw) {
  try { return await bcrypt.compare(String(pw).trim(), TAB_HASH) } catch { return false }
}

const TABS = [
  {
    id: 'designer', accent: 'orange', label: 'Battery Box Layout Designer', short: 'Box Designer', icon: '📦',
    audience: 'Only for Store Incharge / Engineer',
    desc: 'Enter box dimensions and cell layout, see the 3D box and export a spec sheet PDF.',
    Component: BoxDesigner,
  },
  {
    id: 'battery', accent: 'green', label: 'Battery Service Report', short: 'Battery Report', icon: '🔋',
    audience: 'Only for Engineers / Technicians',
    desc: 'Cell SG and voltage readings, dead cells, photos and verified PDF report.',
    Component: ServiceReport,
  },
  {
    id: 'charger', accent: 'blue', label: 'Charger Service Report', short: 'Charger Report', icon: '🔌',
    audience: 'Only for Engineers / Technicians',
    desc: 'Charger details, customer fault, assessment, replacement recommendation and photos.',
    Component: ChargerReport,
  },
  {
    id: 'parts', accent: 'purple', label: 'Parts Issue Form', short: 'Parts Issue', icon: '🧰',
    audience: 'Only for Store Incharge',
    desc: 'Tap to pick connectors, cables, material, BFS and air-mix parts with quantities, add delivery details and a photo.',
    Component: PartsIssue,
  },
]

function TabError() {
  return (
    <div className="panel" style={{ marginTop: 14 }}>
      <strong>Something went wrong in this tab.</strong>
      <div className="hint">Reload the page to try again. The other tabs still work.</div>
    </div>
  )
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

function App() {
  const [tab, setTab] = useState(null) // nothing open after login
  const [opened, setOpened] = useState({}) // tabs mounted once visited, so switching keeps work
  const [toasts, setToasts] = useState([])
  const [unlocked, setUnlocked] = useState(readUnlocked) // remembered until the browser tab is closed
  const [askFor, setAskFor] = useState(null) // tab waiting for its password

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type, duration }])
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const openTab = (id) => {
    setTab(id)
    if (id) setOpened(o => ({ ...o, [id]: true }))
    window.scrollTo({ top: 0 })
  }

  const selectTab = (id) => {
    if (id && !unlocked[id]) { setAskFor(id); return }
    openTab(id)
  }

  const onUnlock = () => {
    const id = askFor
    const next = { ...unlocked, [id]: true }
    setUnlocked(next)
    try { sessionStorage.setItem(UNLOCK_KEY, JSON.stringify(next)) } catch { /* ignore */ }
    setAskFor(null)
    openTab(id)
  }

  const asked = TABS.find(t => t.id === askFor)

  return (
    <div className="page">
      <header className="topbar">
        <button type="button" className="brand brandHome" onClick={() => selectTab(null)} title="Home">
          <img className="brandLogo" src="/af-mark.svg" alt="Abdullah Farooq — Battery Field Service" />
          <div>
            <div className="brandTitle">Abdullah Farooq · Battery Field Service</div>
            <div className="brandSub">Box designer · Service reports · Parts issue</div>
          </div>
        </button>
        <nav className="appTabs" role="tablist" aria-label="Tools">
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`appTab${tab === t.id ? ' active' : ''}`}
              onClick={() => selectTab(t.id)}
            >
              {!unlocked[t.id] && <span className="appTabLock" aria-label="locked">🔒</span>}
              <span className="appTabLong">{t.label}</span>
              <span className="appTabShort">{t.short}</span>
            </button>
          ))}
        </nav>
      </header>

      {tab === null && (
        <section className="homeHero themeBg">
          <div className="themeOrb themeOrb1" aria-hidden="true" />
          <div className="themeOrb themeOrb2" aria-hidden="true" />
          <div className="themeGrid" aria-hidden="true" />
          <div className="homeHeroText">
            <span className="loginKicker">Field Service Toolkit</span>
            <h1>{greeting()}, <span>Field Service Team</span></h1>
            <p>Pick a tool below to design a box, inspect a battery or charger, or issue parts. Everything works on your phone at site.</p>
            <div className="homeHeroStats">
              <div><strong>4</strong><span>Tools</span></div>
              <div><strong>PDF</strong><span>Reports</span></div>
              <div><strong>📱</strong><span>Mobile ready</span></div>
            </div>
          </div>
          <div className="homeHeroArt"><BatteryHero compact /></div>
        </section>
      )}

      {tab === null && (
        <section className="homeGrid">
          {TABS.map((t, i) => (
            <button key={t.id} type="button" className={`homeCard accent-${t.accent}`} style={{ animationDelay: `${i * 80}ms` }} onClick={() => selectTab(t.id)}>
              <span className="homeIcon" aria-hidden="true">{t.icon}</span>
              <span className={`homeAudience${unlocked[t.id] ? ' open' : ''}`}>{unlocked[t.id] ? '🔓' : '🔒'} {t.audience}</span>
              <span className="homeTitle">{t.label}</span>
              <span className="homeDesc">{t.desc}</span>
              <span className="homeGo">Open →</span>
            </button>
          ))}
        </section>
      )}

      {TABS.map(t => opened[t.id] && (
        <div key={t.id} hidden={tab !== t.id} className="tabPane">
          <ErrorBoundary fallback={<TabError />}><t.Component addToast={addToast} /></ErrorBoundary>
        </div>
      ))}

      {tab === null && <Disclaimer />}
      {tab !== null && (
        <footer className="appFooterNote">
          Reports generated from this tool are not authorized documents — for personal convenience only.
        </footer>
      )}

      {asked && (
        <PasswordDialog
          badge={asked.audience}
          title={asked.label}
          message="Enter the password to open this section."
          confirmLabel="Open"
          check={checkTabPassword}
          onSuccess={onUnlock}
          onCancel={() => setAskFor(null)}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

export default App
