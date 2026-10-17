import React, { useEffect, useRef, useState } from 'react'

export type PetAnimationState =
  | 'idle'
  | 'running-right'
  | 'running-left'
  | 'waving'
  | 'jumping'
  | 'failed'
  | 'waiting'
  | 'running'
  | 'review'
  | 'thinking'
  | 'executing'
  | 'approval_required'
  | 'success'
  | 'error'

export interface PetSpriteProps {
  slug?: string
  name?: string
  spritesheetUrl?: string
  state?: PetAnimationState
  scale?: number
  className?: string
  onClick?: () => void
}

const STATE_ROW_MAP: Record<PetAnimationState, number> = {
  idle: 0,
  'running-right': 1,
  'running-left': 2,
  waving: 3,
  jumping: 4,
  failed: 5,
  waiting: 6,
  running: 7,
  review: 8,
  thinking: 8,
  executing: 7,
  approval_required: 6,
  success: 4,
  error: 5,
}

const CELL_WIDTH = 192
const CELL_HEIGHT = 208
const FRAMES_PER_ROW = 6
const CYCLE_DURATION_MS = 1100
const FRAME_DURATION_MS = CYCLE_DURATION_MS / FRAMES_PER_ROW

export const PetSprite: React.FC<PetSpriteProps> = ({
  slug = 'hermes-fox',
  name = 'Hermes Fox',
  spritesheetUrl,
  state = 'idle',
  scale = 0.33,
  className = '',
  onClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  const resolvedUrl =
    spritesheetUrl ||
    ['https:', '', 'petdex.dev', 'sprites', `${slug}.webp`].join('/')

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = resolvedUrl
    imageRef.current = img

    let isMounted = true

    img.onload = () => {
      if (isMounted) {
        setImageLoaded(true)
      }
    }

    img.onerror = () => {
      if (isMounted) {
        setImageLoaded(false)
      }
    }

    return () => {
      isMounted = false
    }
  }, [resolvedUrl])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const displayWidth = Math.round(CELL_WIDTH * scale)
    const displayHeight = Math.round(CELL_HEIGHT * scale)

    canvas.width = Math.round(displayWidth * dpr)
    canvas.height = Math.round(displayHeight * dpr)
    canvas.style.width = `${displayWidth}px`
    canvas.style.height = `${displayHeight}px`

    const row = STATE_ROW_MAP[state] ?? 0
    let animationFrameId: number
    const startTime = performance.now()

    const render = (now: number) => {
      ctx.save()
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, displayWidth, displayHeight)
      ctx.imageSmoothingEnabled = false

      let frameIndex = 0
      if (!prefersReducedMotion) {
        const elapsed = (now - startTime) % CYCLE_DURATION_MS
        frameIndex = Math.floor(elapsed / FRAME_DURATION_MS) % FRAMES_PER_ROW
      }

      const img = imageRef.current
      if (imageLoaded && img && img.naturalWidth > 0) {
        const sx = frameIndex * CELL_WIDTH
        const sy = row * CELL_HEIGHT
        ctx.drawImage(
          img,
          sx,
          sy,
          CELL_WIDTH,
          CELL_HEIGHT,
          0,
          0,
          displayWidth,
          displayHeight,
        )
      } else {
        const grad = ctx.createLinearGradient(0, 0, displayWidth, displayHeight)
        grad.addColorStop(0, '#1a1c20')
        grad.addColorStop(1, '#121316')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, displayWidth, displayHeight)

        ctx.fillStyle = '#ff6347'
        const cx = displayWidth / 2
        const cy = displayHeight / 2
        const mascotSize = Math.min(displayWidth, displayHeight) * 0.45

        ctx.beginPath()
        ctx.arc(cx, cy - mascotSize * 0.1, mascotSize * 0.5, 0, Math.PI * 2)
        ctx.fill()

        ctx.beginPath()
        ctx.moveTo(cx - mascotSize * 0.5, cy - mascotSize * 0.4)
        ctx.lineTo(cx - mascotSize * 0.2, cy - mascotSize * 0.9)
        ctx.lineTo(cx - mascotSize * 0.05, cy - mascotSize * 0.4)
        ctx.closePath()
        ctx.fill()

        ctx.beginPath()
        ctx.moveTo(cx + mascotSize * 0.5, cy - mascotSize * 0.4)
        ctx.lineTo(cx + mascotSize * 0.2, cy - mascotSize * 0.9)
        ctx.lineTo(cx + mascotSize * 0.05, cy - mascotSize * 0.4)
        ctx.closePath()
        ctx.fill()

        ctx.fillStyle = '#090a0b'
        ctx.beginPath()
        ctx.arc(cx - mascotSize * 0.2, cy - mascotSize * 0.1, mascotSize * 0.08, 0, Math.PI * 2)
        ctx.arc(cx + mascotSize * 0.2, cy - mascotSize * 0.1, mascotSize * 0.08, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.restore()

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render)
      }
    }

    if (prefersReducedMotion) {
      render(startTime)
    } else {
      animationFrameId = requestAnimationFrame(render)
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [state, scale, imageLoaded, prefersReducedMotion])

  const buttonClass = onClick
    ? 'cursor-pointer hover:opacity-90 active:scale-95 transition-transform'
    : ''

  return (
    <div
      className={`relative inline-flex items-center justify-center min-w-[44px] min-h-[44px] ${buttonClass} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `Open pet gallery, currently ${name}` : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`Pet companion ${name}, currently ${state}`}
        className="block"
      />
    </div>
  )
}

export default PetSprite
