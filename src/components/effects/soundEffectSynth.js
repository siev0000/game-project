const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0))

export const SOUND_SYNTH_PRESETS = Object.freeze([
  { id: 'element-fire', category: 'elemental', label: '炎', waveform: 'triangle', startFrequency: 210, endFrequency: 55, durationMs: 780, attackMs: 12, oscillatorMix: 18, noiseMix: 95, bodyMix: 46, transientMix: 38, filterCutoff: 3600, resonance: 2, distortion: 24, modulationRate: 8, modulationDepth: 32, echoMs: 95, echoMix: 18 },
  { id: 'element-ice', category: 'elemental', label: '氷', waveform: 'triangle', startFrequency: 1450, endFrequency: 340, durationMs: 620, attackMs: 4, oscillatorMix: 42, noiseMix: 48, bodyMix: 25, transientMix: 46, filterCutoff: 8200, resonance: 9, distortion: 5, modulationRate: 6, modulationDepth: 14, echoMs: 210, echoMix: 32 },
  { id: 'element-lightning', category: 'elemental', label: '雷', waveform: 'sawtooth', startFrequency: 1800, endFrequency: 45, durationMs: 360, attackMs: 1, oscillatorMix: 32, noiseMix: 94, bodyMix: 55, transientMix: 90, filterCutoff: 6800, resonance: 3, distortion: 42, modulationRate: 29, modulationDepth: 62, echoMs: 70, echoMix: 18 },
  { id: 'element-acid', category: 'elemental', label: '酸', waveform: 'triangle', startFrequency: 240, endFrequency: 70, durationMs: 920, attackMs: 18, oscillatorMix: 24, noiseMix: 78, bodyMix: 42, transientMix: 24, filterCutoff: 2800, resonance: 8, distortion: 22, modulationRate: 5, modulationDepth: 54, echoMs: 135, echoMix: 24 },
  { id: 'element-sonic', category: 'elemental', label: '音波', waveform: 'sine', startFrequency: 170, endFrequency: 760, durationMs: 700, attackMs: 8, oscillatorMix: 70, noiseMix: 22, bodyMix: 58, transientMix: 18, filterCutoff: 9200, resonance: 13, distortion: 4, modulationRate: 10, modulationDepth: 38, echoMs: 190, echoMix: 34 },
  { id: 'element-dark', category: 'elemental', label: '闇', waveform: 'triangle', startFrequency: 82, endFrequency: 24, durationMs: 1180, attackMs: 65, oscillatorMix: 48, noiseMix: 60, bodyMix: 85, transientMix: 36, filterCutoff: 1250, resonance: 5, distortion: 34, modulationRate: 3, modulationDepth: 44, echoMs: 310, echoMix: 44 },
  { id: 'element-light', category: 'elemental', label: '光', waveform: 'sine', startFrequency: 680, endFrequency: 1480, durationMs: 580, attackMs: 10, oscillatorMix: 55, noiseMix: 30, bodyMix: 32, transientMix: 24, filterCutoff: 11200, resonance: 7, distortion: 2, modulationRate: 12, modulationDepth: 16, echoMs: 250, echoMix: 38 },
  { id: 'weapon-slash', category: 'weapon', label: '斬撃', waveform: 'triangle', startFrequency: 510, endFrequency: 65, durationMs: 300, attackMs: 1, oscillatorMix: 8, noiseMix: 95, bodyMix: 28, transientMix: 72, metalMix: 45, metalFrequency: 2300, metalDecayMs: 380, metalDissonance: 45, filterCutoff: 6500, resonance: 2, distortion: 14, modulationRate: 0, modulationDepth: 0, echoMs: 45, echoMix: 8 },
  { id: 'weapon-pierce', category: 'weapon', label: '刺突', waveform: 'triangle', startFrequency: 1250, endFrequency: 180, durationMs: 210, attackMs: 1, oscillatorMix: 12, noiseMix: 80, bodyMix: 20, transientMix: 88, metalMix: 62, metalFrequency: 2800, metalDecayMs: 300, metalDissonance: 38, filterCutoff: 7800, resonance: 4, distortion: 12, modulationRate: 0, modulationDepth: 0, echoMs: 35, echoMix: 6 },
  { id: 'weapon-impact', category: 'weapon', label: '打撃', waveform: 'sine', startFrequency: 125, endFrequency: 32, durationMs: 460, attackMs: 1, oscillatorMix: 18, noiseMix: 90, bodyMix: 92, transientMix: 100, metalMix: 25, metalFrequency: 900, metalDecayMs: 550, metalDissonance: 68, filterCutoff: 2100, resonance: 1, distortion: 38, modulationRate: 0, modulationDepth: 0, echoMs: 90, echoMix: 12 },
  { id: 'weapon-bow', category: 'weapon', label: '弓', waveform: 'triangle', startFrequency: 290, endFrequency: 82, durationMs: 520, attackMs: 1, oscillatorMix: 25, noiseMix: 72, bodyMix: 35, transientMix: 70, filterCutoff: 4800, resonance: 5, distortion: 8, modulationRate: 18, modulationDepth: 25, echoMs: 150, echoMix: 18 },
  { id: 'weapon-gunshot', category: 'weapon', label: '銃撃', waveform: 'triangle', startFrequency: 380, endFrequency: 38, durationMs: 330, attackMs: 1, oscillatorMix: 15, noiseMix: 100, bodyMix: 80, transientMix: 100, filterCutoff: 4400, resonance: 1, distortion: 46, modulationRate: 0, modulationDepth: 0, echoMs: 75, echoMix: 10 },
  { id: 'weapon-metal-clang', category: 'weapon', label: '金属音', waveform: 'sine', startFrequency: 2100, endFrequency: 1450, durationMs: 180, attackMs: 0, oscillatorMix: 8, noiseMix: 18, bodyMix: 4, transientMix: 72, metalMix: 92, metalFrequency: 1850, metalDecayMs: 720, metalDissonance: 58, filterCutoff: 14800, resonance: 4, distortion: 5, modulationRate: 0, modulationDepth: 0, echoMs: 85, echoMix: 12 },
  { id: 'laser', category: 'electronic', label: 'レーザー', waveform: 'sawtooth', startFrequency: 1400, endFrequency: 110, durationMs: 260, attackMs: 4, oscillatorMix: 90, noiseMix: 8, filterCutoff: 7600, resonance: 2, distortion: 18 },
  { id: 'ui-confirm', category: 'electronic', label: '決定音', waveform: 'sine', startFrequency: 720, endFrequency: 1280, durationMs: 130, attackMs: 3, oscillatorMix: 100, noiseMix: 0, filterCutoff: 10000, resonance: 1, distortion: 0 },
  { id: 'charge', category: 'electronic', label: '充填音', waveform: 'triangle', startFrequency: 180, endFrequency: 1180, durationMs: 620, attackMs: 55, oscillatorMix: 92, noiseMix: 10, filterCutoff: 6400, resonance: 5, distortion: 8 },
  { id: 'alarm', category: 'electronic', label: '警告音', waveform: 'square', startFrequency: 760, endFrequency: 620, durationMs: 420, attackMs: 8, oscillatorMix: 82, noiseMix: 4, filterCutoff: 5200, resonance: 2, distortion: 12 },
  { id: 'slash', category: 'physical', label: '斬撃', waveform: 'triangle', startFrequency: 520, endFrequency: 90, durationMs: 230, attackMs: 2, oscillatorMix: 18, noiseMix: 88, filterCutoff: 7200, resonance: 3, distortion: 24 },
  { id: 'impact', category: 'physical', label: '打撃', waveform: 'sine', startFrequency: 150, endFrequency: 42, durationMs: 310, attackMs: 2, oscillatorMix: 64, noiseMix: 58, filterCutoff: 2600, resonance: 1, distortion: 48 },
  { id: 'shot', category: 'physical', label: '射撃', waveform: 'square', startFrequency: 420, endFrequency: 65, durationMs: 190, attackMs: 1, oscillatorMix: 42, noiseMix: 78, filterCutoff: 4800, resonance: 2, distortion: 58 },
  { id: 'explosion', category: 'physical', label: '爆発', waveform: 'sine', startFrequency: 105, endFrequency: 28, durationMs: 820, attackMs: 3, oscillatorMix: 56, noiseMix: 92, filterCutoff: 1900, resonance: 1, distortion: 66 },
  { id: 'energy-slash', category: 'hybrid', label: '光刃', waveform: 'sawtooth', startFrequency: 980, endFrequency: 75, durationMs: 340, attackMs: 3, oscillatorMix: 68, noiseMix: 55, filterCutoff: 6800, resonance: 5, distortion: 34 },
  { id: 'energy-impact', category: 'hybrid', label: '魔導衝撃', waveform: 'triangle', startFrequency: 360, endFrequency: 38, durationMs: 520, attackMs: 4, oscillatorMix: 76, noiseMix: 66, filterCutoff: 4200, resonance: 7, distortion: 45 }
])

export const DEFAULT_SOUND_SYNTH = Object.freeze({
  ...SOUND_SYNTH_PRESETS[0],
  volume: 70
})

export const normalizeSoundSynth = (raw = {}) => ({
  id: String(raw.id || 'custom'),
  category: ['elemental', 'weapon', 'electronic', 'physical', 'hybrid'].includes(raw.category) ? raw.category : 'elemental',
  label: String(raw.label || 'カスタムSE'),
  waveform: ['sine', 'square', 'sawtooth', 'triangle'].includes(raw.waveform) ? raw.waveform : 'sine',
  startFrequency: clamp(raw.startFrequency ?? 800, 30, 8000),
  endFrequency: clamp(raw.endFrequency ?? 120, 20, 8000),
  durationMs: clamp(raw.durationMs ?? 300, 50, 2000),
  attackMs: clamp(raw.attackMs ?? 4, 0, 500),
  oscillatorMix: clamp(raw.oscillatorMix ?? 80, 0, 100),
  noiseMix: clamp(raw.noiseMix ?? 20, 0, 100),
  bodyMix: clamp(raw.bodyMix ?? 0, 0, 100),
  transientMix: clamp(raw.transientMix ?? 0, 0, 100),
  metalMix: clamp(raw.metalMix ?? 0, 0, 100),
  metalFrequency: clamp(raw.metalFrequency ?? 1600, 200, 8000),
  metalDecayMs: clamp(raw.metalDecayMs ?? 500, 30, 2000),
  metalDissonance: clamp(raw.metalDissonance ?? 50, 0, 100),
  filterCutoff: clamp(raw.filterCutoff ?? 6000, 200, 16000),
  resonance: clamp(raw.resonance ?? 2, 0, 20),
  distortion: clamp(raw.distortion ?? 0, 0, 100),
  modulationRate: clamp(raw.modulationRate ?? 0, 0, 50),
  modulationDepth: clamp(raw.modulationDepth ?? 0, 0, 100),
  echoMs: clamp(raw.echoMs ?? 0, 0, 500),
  echoMix: clamp(raw.echoMix ?? 0, 0, 80),
  volume: clamp(raw.volume ?? 70, 0, 100)
})

let audioContext = null

const getAudioContext = () => {
  if (audioContext) return audioContext
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return null
  audioContext = new AudioContextClass()
  return audioContext
}

const createDistortionCurve = (amount) => {
  const samples = 1024
  const curve = new Float32Array(samples)
  const drive = 1 + amount * 0.8
  for (let index = 0; index < samples; index += 1) {
    const x = index * 2 / samples - 1
    curve[index] = Math.tanh(x * drive)
  }
  return curve
}

export const playSynthSE = (rawSettings, options = {}) => {
  const context = getAudioContext()
  if (!context) return null
  if (context.state === 'suspended') void context.resume()

  const settings = normalizeSoundSynth(rawSettings)
  const now = context.currentTime + 0.01
  const duration = settings.durationMs / 1000
  const attack = Math.min(duration * 0.8, settings.attackMs / 1000)
  const externalVolume = clamp(options.volume ?? 1, 0, 1)

  const output = context.createGain()
  output.gain.setValueAtTime(settings.volume / 100 * externalVolume * 0.7, now)
  output.connect(context.destination)

  const envelope = context.createGain()
  envelope.gain.setValueAtTime(0.0001, now)
  envelope.gain.linearRampToValueAtTime(1, now + Math.max(0.002, attack))
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration)

  const filter = context.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(settings.filterCutoff, now)
  filter.Q.setValueAtTime(settings.resonance, now)

  const distortion = context.createWaveShaper()
  distortion.curve = createDistortionCurve(settings.distortion)
  distortion.oversample = '2x'
  envelope.connect(filter)
  filter.connect(distortion)
  distortion.connect(output)

  if (settings.echoMix > 0 && settings.echoMs > 0) {
    const delay = context.createDelay(1)
    const wet = context.createGain()
    const feedback = context.createGain()
    delay.delayTime.setValueAtTime(settings.echoMs / 1000, now)
    wet.gain.setValueAtTime(settings.echoMix / 100, now)
    feedback.gain.setValueAtTime(Math.min(0.6, settings.echoMix / 150), now)
    distortion.connect(delay)
    delay.connect(wet)
    wet.connect(output)
    delay.connect(feedback)
    feedback.connect(delay)
  }

  const sources = []
  if (settings.oscillatorMix > 0) {
    const oscillator = context.createOscillator()
    const oscillatorGain = context.createGain()
    oscillator.type = settings.waveform
    oscillator.frequency.setValueAtTime(settings.startFrequency, now)
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, settings.endFrequency), now + duration)
    const oscillatorLevel = settings.oscillatorMix / 100
    const modulationDepth = settings.modulationDepth / 100
    oscillatorGain.gain.setValueAtTime(oscillatorLevel * (1 - modulationDepth * 0.5), now)
    oscillator.connect(oscillatorGain)
    oscillatorGain.connect(envelope)
    if (settings.modulationRate > 0 && settings.modulationDepth > 0) {
      const modulation = context.createOscillator()
      const modulationGain = context.createGain()
      modulation.frequency.setValueAtTime(settings.modulationRate, now)
      modulationGain.gain.setValueAtTime(oscillatorLevel * modulationDepth * 0.5, now)
      modulation.connect(modulationGain)
      modulationGain.connect(oscillatorGain.gain)
      modulation.start(now)
      modulation.stop(now + duration + 0.02)
      sources.push(modulation)
    }
    oscillator.start(now)
    oscillator.stop(now + duration + 0.02)
    sources.push(oscillator)
  }

  if (settings.bodyMix > 0) {
    const body = context.createOscillator()
    const bodyGain = context.createGain()
    body.type = 'sine'
    body.frequency.setValueAtTime(Math.max(30, settings.startFrequency * 0.45), now)
    body.frequency.exponentialRampToValueAtTime(Math.max(20, settings.endFrequency * 0.55), now + duration)
    bodyGain.gain.setValueAtTime(settings.bodyMix / 100 * 0.8, now)
    body.connect(bodyGain)
    bodyGain.connect(envelope)
    body.start(now)
    body.stop(now + duration + 0.02)
    sources.push(body)
  }

  if (settings.noiseMix > 0) {
    const frameCount = Math.max(1, Math.ceil(context.sampleRate * duration))
    const buffer = context.createBuffer(1, frameCount, context.sampleRate)
    const channel = buffer.getChannelData(0)
    for (let index = 0; index < frameCount; index += 1) {
      const decay = 1 - index / frameCount
      channel[index] = (Math.random() * 2 - 1) * (0.35 + decay * 0.65)
    }
    const noise = context.createBufferSource()
    const noiseGain = context.createGain()
    noise.buffer = buffer
    noiseGain.gain.setValueAtTime(settings.noiseMix / 100, now)
    noise.connect(noiseGain)
    noiseGain.connect(envelope)
    noise.start(now)
    noise.stop(now + duration + 0.02)
    sources.push(noise)
  }

  if (settings.transientMix > 0) {
    const transientDuration = Math.min(duration, 0.14)
    const frameCount = Math.max(1, Math.ceil(context.sampleRate * transientDuration))
    const buffer = context.createBuffer(1, frameCount, context.sampleRate)
    const channel = buffer.getChannelData(0)
    for (let index = 0; index < frameCount; index += 1) {
      channel[index] = Math.random() * 2 - 1
    }
    const transient = context.createBufferSource()
    const transientGain = context.createGain()
    transient.buffer = buffer
    transientGain.gain.setValueAtTime(Math.max(0.0001, settings.transientMix / 100), now)
    transientGain.gain.exponentialRampToValueAtTime(0.0001, now + transientDuration)
    transient.connect(transientGain)
    transientGain.connect(filter)
    transient.start(now)
    transient.stop(now + transientDuration + 0.02)
    sources.push(transient)
  }

  if (settings.metalMix > 0) {
    const dissonance = settings.metalDissonance / 100
    const ratios = [1, 2 + dissonance * 0.76, 3 + dissonance * 2.4, 4 + dissonance * 3.1]
    const levels = [1, 0.58, 0.32, 0.2]
    const metalDuration = settings.metalDecayMs / 1000
    const maxFrequency = context.sampleRate * 0.45

    ratios.forEach((ratio, index) => {
      const resonator = context.createOscillator()
      const resonatorGain = context.createGain()
      resonator.type = 'sine'
      resonator.frequency.setValueAtTime(Math.min(maxFrequency, settings.metalFrequency * ratio), now)
      resonatorGain.gain.setValueAtTime(Math.max(0.0001, settings.metalMix / 100 * levels[index]), now)
      resonatorGain.gain.exponentialRampToValueAtTime(0.0001, now + metalDuration * (1 - index * 0.08))
      resonator.connect(resonatorGain)
      resonatorGain.connect(filter)
      resonator.start(now)
      resonator.stop(now + metalDuration + 0.02)
      sources.push(resonator)
    })
  }

  let stopped = false
  const cleanup = () => {
    if (stopped) return
    stopped = true
    sources.forEach(source => {
      try { source.stop() } catch { /* Already stopped. */ }
    })
    output.disconnect()
  }
  const echoTailMs = settings.echoMix > 0 ? settings.echoMs * 6 : 0
  const sourceDurationMs = Math.max(settings.durationMs, settings.metalMix > 0 ? settings.metalDecayMs : 0)
  const cleanupTimer = setTimeout(cleanup, sourceDurationMs + echoTailMs + 100)

  return {
    stop: () => {
      clearTimeout(cleanupTimer)
      cleanup()
    }
  }
}
