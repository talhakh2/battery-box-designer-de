import { useEffect } from 'react'

export function Toast({ message, type = 'success', duration = 3000, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  return (
    <div className={`toast toast-${type}`}>
      <div className="toastContent">
        <span className="toastIcon">
          {type === 'success' && '✓'}
          {type === 'error' && '✕'}
          {type === 'info' && 'ℹ'}
        </span>
        <span className="toastMessage">{message}</span>
      </div>
    </div>
  )
}

export function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="toastContainer">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  )
}
