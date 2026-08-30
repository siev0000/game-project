import Phaser from 'phaser'

const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0))
const numberOr = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}
const tint = (value) => {
  const raw = String(value || '').replace('#', '')
  return /^[0-9a-f]{6}$/i.test(raw) ? Number.parseInt(raw, 16) : 0xffffff
}

const MOTION_FIELDS = Object.freeze(['x', 'y', 'size', 'length', 'thickness', 'rotation', 'alpha'])
const easing = (name, value) => {
  const t = clamp(value, 0, 1)
  if (name === 'easeIn') return t * t
  if (name === 'easeOut') return 1 - (1 - t) * (1 - t)
  if (name === 'easeInOut') return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
  return t
}

export const resolveEffectLayerFrame = (layer, frame) => {
  const keys = Array.isArray(layer?.keyframes)
    ? layer.keyframes.filter(key => Number.isFinite(Number(key?.frame))).slice().sort((a, b) => Number(a.frame) - Number(b.frame))
    : []
  if (!keys.length) return layer
  const currentFrame = numberOr(frame, 0)
  const previous = [...keys].reverse().find(key => Number(key.frame) <= currentFrame) || keys[0]
  const next = keys.find(key => Number(key.frame) >= currentFrame) || keys[keys.length - 1]
  const span = Number(next.frame) - Number(previous.frame)
  const progress = span > 0 ? easing(previous.easing, (currentFrame - Number(previous.frame)) / span) : 0
  const resolved = { ...layer }
  MOTION_FIELDS.forEach(field => {
    const from = numberOr(previous[field], numberOr(layer[field], 0))
    const to = numberOr(next[field], from)
    resolved[field] = from + (to - from) * progress
  })
  return resolved
}

// This JSON renderer is shared by the editor and Phaser game scenes.
export class EffectRenderer {
  constructor (scene) {
    if (!scene?.add?.graphics) throw new TypeError('Phaser.Scene を指定してください。')
    this.scene = scene
    this.graphics = []
    this.timer = null
  }

  stop () {
    this.timer?.remove(false)
    this.timer = null
    this.graphics.forEach(item => item.destroy())
    this.graphics = []
  }

  destroy () { this.stop(); this.scene = null }

  renderFrame (effect, frame, options = {}) {
    this.stop()
    const origin = options.origin || { x: options.x || 0, y: options.y || 0 }
    const target = options.target || origin
    const layers = Array.isArray(effect?.layers) ? effect.layers : []
    this.graphics = layers.map(layer => this.drawLayer(layer, frame, origin, target)).filter(Boolean)
  }

  play (effect, { x = 0, y = 0, origin: rawOrigin, target: rawTarget, loop = false, onComplete } = {}) {
    this.stop()
    const origin = rawOrigin || { x, y }
    const target = rawTarget || origin
    const fps = clamp(effect?.fps, 1, 60) || 12
    const count = Math.max(1, Math.floor(Number(effect?.frameCount) || 1))
    const layers = Array.isArray(effect?.layers) ? effect.layers : []
    let frame = 0
    const draw = () => {
      this.graphics.forEach(item => item.destroy())
      this.graphics = layers.map(layer => this.drawLayer(layer, frame, origin, target)).filter(Boolean)
    }
    draw()
    this.timer = this.scene.time.addEvent({ delay: 1000 / fps, repeat: loop ? -1 : count - 1, callback: () => {
      frame += 1
      if (frame >= count) {
        if (!loop) { this.stop(); onComplete?.(); return }
        frame = 0
      }
      draw()
    } })
  }

  drawLayer (layer, frame, origin, target) {
    const start = Math.max(0, Math.floor(Number(layer.startFrame) || 0))
    const end = Math.max(start, Math.floor(Number(layer.endFrame) || start))
    if (frame < start || frame > end) return null
    const progress = end === start ? 1 : (frame - start) / (end - start)
    const keyframed = Array.isArray(layer.keyframes) && layer.keyframes.length > 0
    const current = resolveEffectLayerFrame(layer, frame)
    const dx = (Number(target?.x) || 0) - (Number(origin?.x) || 0)
    const dy = (Number(target?.y) || 0) - (Number(origin?.y) || 0)
    const pathAngle = Math.atan2(dy, dx)
    const pathLength = Math.hypot(dx, dy)
    const anchor = current.anchor === 'target' ? 1 : current.anchor === 'origin' ? 0 : clamp(current.pathPosition ?? 0.5, 0, 1)
    const offsetX = numberOr(current.x) + (keyframed ? 0 : numberOr(current.moveX) * progress)
    const offsetY = numberOr(current.y) + (keyframed ? 0 : numberOr(current.moveY) * progress)
    const x = (Number(origin?.x) || 0) + dx * anchor + Math.cos(pathAngle) * offsetX - Math.sin(pathAngle) * offsetY
    const y = (Number(origin?.y) || 0) + dy * anchor + Math.sin(pathAngle) * offsetX + Math.cos(pathAngle) * offsetY
    const size = Math.max(1, numberOr(current.size, 100) * (keyframed ? 1 : 1 + numberOr(current.grow) * progress / 100))
    const alpha = clamp(numberOr(current.alpha, 100) / 100 * (keyframed ? 1 : 1 - numberOr(current.fadeOut) * progress / 100), 0, 1)
    const angle = (current.followPath === false ? 0 : pathAngle) + Phaser.Math.DegToRad(numberOr(current.rotation) + (keyframed ? 0 : numberOr(current.rotateBy) * progress))
    const width = Math.max(1, numberOr(current.thickness, 4))
    const g = this.scene.add.graphics().lineStyle(width, tint(current.color), alpha).fillStyle(tint(current.color), alpha * 0.35)
    if (current.type === 'ring' || current.type === 'shockwave') g.strokeCircle(x, y, size / 2)
    else if (current.type === 'beam') {
      const length = current.fitPath ? Math.max(1, pathLength) : Math.max(1, numberOr(current.length, size * 2))
      g.lineBetween(x - Math.cos(angle) * length / 2, y - Math.sin(angle) * length / 2, x + Math.cos(angle) * length / 2, y + Math.sin(angle) * length / 2)
    } else if (current.type === 'lightning') {
      const length = current.fitPath ? Math.max(1, pathLength) : Math.max(1, numberOr(current.length, size * 2)); const bends = clamp(current.branches || 4, 1, 12)
      const points = [{ x: -length / 2, y: 0 }]
      for (let i = 1; i < bends; i += 1) points.push({ x: -length / 2 + length * i / bends, y: (Math.random() - .5) * numberOr(current.jitter, 24) })
      points.push({ x: length / 2, y: 0 }); g.beginPath()
      points.forEach((point, i) => { const px = x + point.x * Math.cos(angle) - point.y * Math.sin(angle); const py = y + point.x * Math.sin(angle) + point.y * Math.cos(angle); if (i) g.lineTo(px, py); else g.moveTo(px, py) }); g.strokePath()
    } else if (current.type === 'particles') {
      const total = clamp(current.particleCount || 12, 1, 60)
      for (let i = 0; i < total; i += 1) { const a = i / total * Math.PI * 2 + angle; const distance = size * progress * (0.2 + (i % 4) / 8); g.fillCircle(x + Math.cos(a) * distance, y + Math.sin(a) * distance, Math.max(1, width / 2)) }
    } else {
      const length = Math.max(1, numberOr(current.length, size * 1.6))
      g.arc(x, y, size / 2, angle - .7, angle + .7, false).strokePath(); g.lineBetween(x, y, x + Math.cos(angle) * length / 2, y + Math.sin(angle) * length / 2)
    }
    return g
  }
}

export default EffectRenderer
