// Load an image file, downscale it and return a JPEG data URL suitable for embedding in the PDF.

const MAX_SIDE = 1600

export function isImageFile(file) {
  if (!file) return false
  if (file.type && file.type.startsWith('image/')) return true
  return /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(file.name || '')
}

export async function fileToPhoto(file) {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = () => reject(new Error('Unsupported image'))
      img.src = url
    })
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight))
    const w = Math.max(1, Math.round(img.naturalWidth * scale))
    const h = Math.max(1, Math.round(img.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(img, 0, 0, w, h)
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: file.name || 'photo.jpg',
      dataUrl: canvas.toDataURL('image/jpeg', 0.85),
      width: w,
      height: h,
      caption: '',
    }
  } finally {
    URL.revokeObjectURL(url)
  }
}
