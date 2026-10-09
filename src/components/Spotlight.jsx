// Card wrapper whose hover glow follows the pointer (CSS reads --mx / --my).
// With `tilt`, the card also leans toward the pointer in 3D (CSS reads --tilt-x / --tilt-y).
export default function Spotlight({ as: Tag = 'div', className = '', tilt = false, children, onPointerMove, onPointerLeave, ...rest }) {
  const handleMove = (event) => {
    const el = event.currentTarget
    const rect = el.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    el.style.setProperty('--mx', `${x}px`)
    el.style.setProperty('--my', `${y}px`)
    if (tilt) {
      el.style.setProperty('--tilt-x', `${((0.5 - y / rect.height) * 6).toFixed(2)}deg`)
      el.style.setProperty('--tilt-y', `${((x / rect.width - 0.5) * 7).toFixed(2)}deg`)
    }
    onPointerMove?.(event)
  }

  const handleLeave = (event) => {
    if (tilt) {
      event.currentTarget.style.setProperty('--tilt-x', '0deg')
      event.currentTarget.style.setProperty('--tilt-y', '0deg')
    }
    onPointerLeave?.(event)
  }

  return (
    <Tag
      className={`card spotlight${tilt ? ' tilt' : ''}${className ? ` ${className}` : ''}`}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      {...rest}
    >
      {children}
    </Tag>
  )
}
