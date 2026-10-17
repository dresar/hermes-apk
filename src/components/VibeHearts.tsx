import React, { useEffect, useRef, useState, useCallback } from 'react'

export interface VibeReactionEvent {
  kind: string
}

export interface VibeHeartsProps {
  text?: string
  reaction?: VibeReactionEvent | null
  trigger?: number | boolean
  onComplete?: () => void
  className?: string
}

interface HeartParticle {
  x: number
  y: number
  vx: number
  vy: number
  swayFreq: number
  swayAmp: number
  swayPhase: number
  pixelSize: number
  alpha: number
  decay: number
  color: string
}

const HEART_BITMAP = [
  [0, 1, 1, 0, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 0, 0],
  [0, 0, 0, 1, 0, 0, 0],
]

const HEART_COLORS = [
  '#ff6347',
  '#ff7b63',
  '#ff4d4d',
  '#ff2e63',
  '#ffa07a',
  '#ff8570',
]

const PRAISE_TRIGGERS = [
  'good bot',
  'thank you',
  'thanks',
  'nice job',
  'great job',
  'good job',
  '<3',
  '❤️',
  'love',
  'awesome bot',
  'well done',
  'terima kasih',
  'mantap',
]

export const VibeHearts: React.FC<VibeHeartsProps> = ({
  text,
  reaction,
  trigger,
  onComplete,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const particlesRef = useRef<HeartParticle[]>([])
  const animationFrameRef = useRef<number | null>(null)
  const [isActive, setIsActive] = useState(false)
  const lastProcessedTextRef = useRef<string>('')
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

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

  const spawnBurst = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio || 1
    const width = canvas.width / dpr
    const height = canvas.height / dpr

    const count = prefersReducedMotion ? 4 : 20
    const newParticles: HeartParticle[] = []

    for (let i = 0; i < count; i++) {
      const color = HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)]
      const pixelSize = Math.floor(Math.random() * 2) + 2
      const spawnX = width * 0.5 + (Math.random() - 0.5) * (width * 0.4)
      const spawnY = height * 0.85 + (Math.random() - 0.5) * (height * 0.1)

      newParticles.push({
        x: spawnX,
        y: spawnY,
        vx: (Math.random() - 0.5) * 1.2,
        vy: prefersReducedMotion ? 0 : -(Math.random() * 2.2 + 1.2),
        swayFreq: Math.random() * 0.005 + 0.003,
        swayAmp: Math.random() * 25 + 10,
        swayPhase: Math.random() * Math.PI * 2,
        pixelSize,
        alpha: 1,
        decay: Math.random() * 0.009 + 0.007,
        color,
      })
    }

    particlesRef.current = [...particlesRef.current, ...newParticles]
    setIsActive(true)
  }, [prefersReducedMotion])

  useEffect(() => {
    if (!text) return
    const normalized = text.toLowerCase()
    if (normalized === lastProcessedTextRef.current) return
    lastProcessedTextRef.current = normalized

    const hasPraise = PRAISE_TRIGGERS.some((kw) => normalized.includes(kw))
    if (hasPraise) {
      spawnBurst()
    }
  }, [text, spawnBurst])

  useEffect(() => {
    if (reaction && reaction.kind === 'hearts') {
      spawnBurst()
    }
  }, [reaction, spawnBurst])

  useEffect(() => {
    if (trigger) {
      spawnBurst()
    }
  }, [trigger, spawnBurst])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleResize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const dpr = window.devicePixelRatio || 1
      const rect = parent.getBoundingClientRect()
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!isActive) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let lastTime = performance.now()

    const animate = (now: number) => {
      const dt = Math.min(now - lastTime, 34)
      lastTime = now

      const dpr = window.devicePixelRatio || 1
      const width = canvas.width / dpr
      const height = canvas.height / dpr

      ctx.save()
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, width, height)

      const activeParticles: HeartParticle[] = []

      for (let i = 0; i < particlesRef.current.length; i++) {
        const p = particlesRef.current[i]

        p.alpha -= p.decay * (dt / 16.6)
        if (p.alpha <= 0) continue

        if (!prefersReducedMotion) {
          p.y += p.vy * (dt / 16.6)
          p.x += p.vx * (dt / 16.6) + Math.sin(now * p.swayFreq + p.swayPhase) * 0.4
        }

        ctx.save()
        ctx.globalAlpha = Math.max(0, p.alpha)
        ctx.fillStyle = p.color

        for (let r = 0; r < HEART_BITMAP.length; r++) {
          const row = HEART_BITMAP[r]
          for (let c = 0; c < row.length; c++) {
            if (row[c] === 1) {
              const px = Math.round(p.x + (c - 3.5) * p.pixelSize)
              const py = Math.round(p.y + (r - 3) * p.pixelSize)
              ctx.fillRect(px, py, p.pixelSize, p.pixelSize)
            }
          }
        }

        ctx.restore()
        activeParticles.push(p)
      }

      ctx.restore()
      particlesRef.current = activeParticles

      if (activeParticles.length > 0) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        setIsActive(false)
        if (onComplete) {
          onComplete()
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isActive, prefersReducedMotion, onComplete])

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 z-40 h-full w-full ${className}`}
      aria-hidden="true"
    />
  )
}

export default VibeHearts
