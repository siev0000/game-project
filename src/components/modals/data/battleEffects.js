import effectList from '@/assets/effect/320×240/effect_list.json'

const effectImageModules = import.meta.glob('/src/assets/effect/320×240/*.webp', {
  eager: true,
  import: 'default'
})

const effectImageMap = Object.fromEntries(
  Object.entries(effectImageModules).map(([filePath, fileUrl]) => {
    const fileName = filePath.split('/').pop() || ''
    return [fileName.replace(/\.webp$/i, ''), fileUrl]
  })
)

export const EFFECT_OPTIONS = Object.freeze(
  (Array.isArray(effectList) ? effectList : []).filter((name) => Boolean(effectImageMap[name]))
)

export const SPARK_EFFECT = Object.freeze({
  particleCount: 14,
  angleJitter: 9,
  minDistance: 32,
  distanceRange: 72,
  minSize: 2,
  sizeRange: 3,
  maxDelay: 70,
  lifetime: 760
})

export const ATTACK_EFFECT_TYPES = Object.freeze([
  { key: 'slash', label: '切断', effectName: '斬撃', duration: 420 },
  { key: 'pierce', label: '貫通', effectName: '刺突', duration: 480 },
  { key: 'strike', label: '打撃', effectName: '打撃連撃', duration: 540 },
  { key: 'shot', label: '射撃', effectName: '射撃3', duration: 600 },
  { key: 'bow', label: '弓', effectName: '矢2', duration: 540 },
  { key: 'fist', label: '拳', effectName: '小打撃', duration: 420 }
])

export const ATTACK_EFFECT_DIRECTIONS = Object.freeze([
  { key: 'right', label: '右', rotation: 0 },
  { key: 'left', label: '左', rotation: 180 },
  { key: 'up', label: '上', rotation: -90 },
  { key: 'down', label: '下', rotation: 90 }
])

export const getAttackEffectType = (key) => ATTACK_EFFECT_TYPES.find((type) => type.key === key) || ATTACK_EFFECT_TYPES[0]
export const getAttackEffectDirection = (key) => ATTACK_EFFECT_DIRECTIONS.find((direction) => direction.key === key) || ATTACK_EFFECT_DIRECTIONS[0]
export const getEffectSprite = (effectName, duration = 520) => ({
  source: effectImageMap[effectName] || effectImageMap[getAttackEffectType('slash').effectName],
  duration
})

const spriteSheetCache = new Map()
const SPRITE_FRAME_STEP = 120

export const loadSpriteSheet = (sprite) => {
  if (spriteSheetCache.has(sprite.source)) return spriteSheetCache.get(sprite.source)

  const sheetPromise = new Promise((resolve) => {
    const image = new Image()
    image.onload = () => {
      const axis = image.naturalWidth > image.naturalHeight ? 'x' : 'y'
      const animatedLength = axis === 'x' ? image.naturalWidth : image.naturalHeight
      resolve({
        ...sprite,
        axis,
        frames: Math.max(1, Math.floor(animatedLength / SPRITE_FRAME_STEP)),
        frameWidth: axis === 'x' ? SPRITE_FRAME_STEP : image.naturalWidth,
        frameHeight: axis === 'y' ? SPRITE_FRAME_STEP : image.naturalHeight
      })
    }
    image.onerror = () => resolve({
      ...sprite,
      axis: 'x',
      frames: 1,
      frameWidth: SPRITE_FRAME_STEP,
      frameHeight: SPRITE_FRAME_STEP
    })
    image.src = sprite.source
  })
  spriteSheetCache.set(sprite.source, sheetPromise)
  return sheetPromise
}

const clampPercent = (value) => Math.min(100, Math.max(0, value))

export const createSparkParticles = (random = Math.random) => Array.from(
  { length: SPARK_EFFECT.particleCount },
  (_, index) => ({
    id: index,
    angle: index * (360 / SPARK_EFFECT.particleCount) + (random() * 18 - SPARK_EFFECT.angleJitter),
    distance: SPARK_EFFECT.minDistance + Math.round(random() * SPARK_EFFECT.distanceRange),
    size: SPARK_EFFECT.minSize + Math.round(random() * SPARK_EFFECT.sizeRange),
    delay: Math.round(random() * SPARK_EFFECT.maxDelay)
  })
)

export const createAttackImpactPoints = ({ type, count, baseX, baseY, random = Math.random }) => {
  const hitCount = Math.max(1, Math.min(8, Number(count) || 1))

  return Array.from({ length: hitCount }, (_, index) => {
    const progress = hitCount === 1 ? 0 : index / (hitCount - 1) - 0.5
    let x = baseX
    let y = baseY

    switch (type) {
      case 'slash':
        x += progress * 14
        y -= progress * 14
        break
      case 'pierce':
        x += progress * 18
        break
      case 'strike':
        y += progress * 16
        break
      case 'shot':
        x += progress * 24
        y += Math.abs(progress) * 3
        break
      case 'bow':
        x += progress * 20
        y -= (1 - Math.abs(progress) * 2) * 8
        break
      case 'fist':
        x += (random() - 0.5) * 6
        y += (random() - 0.5) * 6
        break
    }

    return { x: clampPercent(x), y: clampPercent(y), delay: index * 120 }
  })
}
