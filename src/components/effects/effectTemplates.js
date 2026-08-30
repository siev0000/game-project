// Exported function names are used directly as template names in the editor.
// Add another exported factory function here to make it appear automatically.
export function slash () {
  return [
    { type: 'slash' },
    { type: 'ring', size: 220, thickness: 3, color: '#4dceff', startFrame: 2 }
  ]
}

export function thunderSlash () {
  return [
    { type: 'lightning', anchor: 'path', fitPath: true, color: '#8f7cff', thickness: 9 },
    { type: 'slash', color: '#ffffff', startFrame: 2 },
    { type: 'particles', color: '#bcaaff', startFrame: 2 },
    { type: 'shockwave', color: '#8cdfff', size: 80, grow: 220, startFrame: 3 }
  ]
}

export function laser () {
  return [
    { type: 'beam', anchor: 'path', fitPath: true, color: '#ff6bda', thickness: 16 },
    { type: 'ring', anchor: 'origin', color: '#ffe2fa', size: 100, thickness: 5, endFrame: 3 }
  ]
}

export function explosion () {
  return [
    { type: 'shockwave', color: '#ffbf58', size: 40, grow: 350 },
    { type: 'particles', color: '#ffec9c', size: 260, particleCount: 28 },
    { type: 'ring', color: '#ff714e', size: 80, grow: 190, thickness: 8 }
  ]
}
