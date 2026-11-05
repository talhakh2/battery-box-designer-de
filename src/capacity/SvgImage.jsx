import { useMemo } from 'react'
import { svgUrl } from './charts'

export function SvgImage({ svg, alt, className }) {
  const src = useMemo(() => svgUrl(svg), [svg])
  return <img className={className} src={src} alt={alt} />
}
