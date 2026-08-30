const locationAssetUrls = import.meta.glob(
  '../assets/images/locations/**/*.{avif,gif,jpeg,jpg,png,svg,webp}',
  { eager: true, query: '?url', import: 'default' }
)

const normalizedLocationUrls = Object.fromEntries(Object.entries(locationAssetUrls).map(([key, value]) => [
  key.replace('../assets/images/', ''),
  value
]))

export const mapAssetSource = assetId => {
  if (!assetId) return ''
  if (/^(?:https?:|data:|blob:|\/)/.test(assetId)) return assetId
  return normalizedLocationUrls[assetId]
    ?? `/api/local/image-assets/file?path=${encodeURIComponent(assetId)}`
}

export const croppedMapPartStyle = (part, displayWidth, displayHeight) => {
  const rect = part?.sourceRect
  const source = part?.sourceSize
  if (!part?.imageAssetId || !rect || !source || !rect.width || !rect.height) return {}
  const width = Math.max(1, Number(displayWidth) || rect.width)
  const height = Math.max(1, Number(displayHeight) || rect.height)
  return {
    backgroundImage: `url("${mapAssetSource(part.imageAssetId).replaceAll('"', '\\"')}")`,
    backgroundSize: `${source.width / rect.width * width}px ${source.height / rect.height * height}px`,
    backgroundPosition: `${-rect.x / rect.width * width}px ${-rect.y / rect.height * height}px`,
    backgroundOrigin: 'border-box',
    backgroundClip: 'border-box',
    backgroundRepeat: 'no-repeat'
  }
}

export const backgroundGradientStyle = gradient => {
  const value = gradient ?? {}
  const top = value.top || '#07141a'
  const right = value.right || '#102f3a'
  const bottom = value.bottom || '#02080c'
  const left = value.left || '#163744'
  return {
    background: `conic-gradient(from 0deg at 50% 50%, ${top} 0deg, ${right} 90deg, ${bottom} 180deg, ${left} 270deg, ${top} 360deg)`
  }
}
