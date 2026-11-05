import { useState } from 'react'

export const WHATSAPP_LINK = 'https://wa.me/message/5QHO2C57OYLUJ1'
export const WHATSAPP_RECEIVER = 'Abdullah Farooq'

/** Shown after the PDF downloads: share the file to WhatsApp, or open the chat with Abdullah Farooq. */
export function WhatsAppDialog({ file, shareText, onClose }) {
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const pdfFile = file ? new File([file.blob], file.filename, { type: 'application/pdf' }) : null
  const canShareFile = !!(pdfFile && navigator.canShare && navigator.canShare({ files: [pdfFile] }))

  const shareFile = async () => {
    setBusy(true)
    setNote('')
    try {
      await navigator.share({ files: [pdfFile], title: file.filename, text: shareText })
      onClose()
    } catch (err) {
      if (err?.name !== 'AbortError') setNote('Could not open sharing. Use "Open WhatsApp chat" and attach the PDF.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="srModalBackdrop" role="dialog" aria-modal="true" aria-labelledby="waTitle" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="srModal waModal">
        <div className="waDone">✓ PDF downloaded</div>
        <div className="waFile">{file?.filename}</div>
        <div className="srModalTitle" id="waTitle">Do you want to send it on WhatsApp?</div>
        <div className="waReceiver">
          <span className="waAvatar" aria-hidden="true">AF</span>
          <div>
            <small>Receiver Name</small>
            <strong>{WHATSAPP_RECEIVER}</strong>
          </div>
        </div>

        {canShareFile && (
          <button type="button" className="waBtn" onClick={shareFile} disabled={busy}>
            📤 Send PDF on WhatsApp
          </button>
        )}
        <a className={`waBtn${canShareFile ? ' waAlt' : ''}`} href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
          💬 Open WhatsApp chat — click here
        </a>
        <div className="srModalMsg waHint">
          {canShareFile
            ? <>“Send PDF” lets you pick WhatsApp → <b>{WHATSAPP_RECEIVER}</b> and attaches the file. Or open his chat and attach the downloaded PDF with 📎.</>
            : <>The chat with <b>{WHATSAPP_RECEIVER}</b> opens in WhatsApp. Tap 📎 and attach the downloaded PDF.</>}
        </div>
        {note && <div className="loginError">{note}</div>}
        <div className="srModalActions">
          <button type="button" className="secondary" onClick={onClose}>No, thanks</button>
        </div>
      </div>
    </div>
  )
}
