const positiveInteger = (value, fallback = 1, maximum = 64) => {
  const parsed = Math.round(Number(value))
  return Math.max(1, Math.min(maximum, Number.isFinite(parsed) ? parsed : fallback))
}

export const spriteSheetGrid = animation => {
  const legacyFrames = positiveInteger(animation?.frames, 1)
  const hasGrid = animation?.columns != null || animation?.rows != null
  const columns = positiveInteger(animation?.columns, hasGrid ? 1 : legacyFrames)
  const rows = positiveInteger(animation?.rows, 1)
  return { columns, rows, frames: columns * rows }
}

const defaultFrameOrder = frames => Array.from({ length: frames }, (_, index) => index + 1)

export const spriteSheetFrameOrder = animation => {
  const { frames } = spriteSheetGrid(animation)
  const source = Array.isArray(animation?.frameOrder)
    ? animation.frameOrder
    : typeof animation?.frameOrder === 'string'
      ? animation.frameOrder.split(/[,\s]+/)
      : []
  const order = source
    .map(value => Math.round(Number(value)))
    .filter(value => Number.isFinite(value) && value >= 1 && value <= frames)
  return order.length ? order : defaultFrameOrder(frames)
}

export const normalizeSpriteSheetAnimation = animation => {
  const previousFrames = positiveInteger(animation?.frames, 1)
  const previousOrder = spriteSheetFrameOrder({ ...animation, columns: previousFrames, rows: 1 })
  const hadCustomOrder = previousOrder.length !== previousFrames
    || previousOrder.some((frame, index) => frame !== index + 1)
  const grid = spriteSheetGrid(animation)
  animation.columns = grid.columns
  animation.rows = grid.rows
  animation.frames = grid.frames
  animation.frameOrder = hadCustomOrder
    ? spriteSheetFrameOrder(animation)
    : defaultFrameOrder(grid.frames)
  return animation
}

export const spriteSheetSourceFrame = (animation, sequenceFrame = 0) => {
  const order = spriteSheetFrameOrder(animation)
  const index = ((Math.floor(Number(sequenceFrame) || 0) % order.length) + order.length) % order.length
  return order[index] - 1
}

export const spriteSheetFrameStyle = (animation, frame = 0) => {
  if (!animation?.imageSource) return {}
  const { columns, rows } = spriteSheetGrid(animation)
  const index = spriteSheetSourceFrame(animation, frame)
  const column = index % columns
  const row = Math.floor(index / columns)
  const x = columns === 1 ? 50 : column / (columns - 1) * 100
  const y = rows === 1 ? 50 : row / (rows - 1) * 100
  return {
    backgroundImage: `url("${animation.imageSource.replaceAll('"', '\\"')}")`,
    backgroundSize: `${columns * 100}% ${rows * 100}%`,
    backgroundPosition: `${x}% ${y}%`,
    backgroundRepeat: 'no-repeat'
  }
}
