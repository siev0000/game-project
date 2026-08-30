import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const draftsPath = path.join(root, 'src/data/exploration/areaMapDrafts.json')
const masterPath = path.join(root, 'src/data/exploration/areaMaster.json')
const drafts = JSON.parse(await fs.readFile(draftsPath, 'utf8'))
const master = JSON.parse(await fs.readFile(masterPath, 'utf8'))
const areaById = new Map(master.areas.map(area => [area.id, area]))

for (const [areaId, draft] of Object.entries(drafts.maps)) {
  const area = areaById.get(areaId)
  if (!area) continue
  draft.backgroundLayers ??= {}
  for (const [index, layer] of ['far', 'mid', 'foreground'].entries()) {
    draft.backgroundLayers[layer] ??= {
      assetId: area.backgrounds?.[index] ?? '',
      parallax: layer === 'far' ? 0.2 : layer === 'mid' ? 0.5 : 1.15,
      visible: true
    }
  }
  draft.playerPresentation ??= {
    characterAssetId: 'placeholder_player',
    displayWidth: 42,
    displayHeight: 66,
    footOffsetX: 0,
    footOffsetY: 0,
    hitboxWidth: 26,
    hitboxHeight: 58,
    maxStepUp: 48,
    maxStepDown: 72,
    jumpHeight: 66,
    flightEnabled: false,
    flightSpeed: 260
  }
  draft.playerPresentation.maxStepUp ??= 48
  draft.playerPresentation.maxStepDown ??= 72
  draft.playerPresentation.jumpHeight ??= draft.playerPresentation.displayHeight ?? 66
  draft.playerPresentation.flightEnabled ??= false
  draft.playerPresentation.flightSpeed ??= 260
  draft.environmentEffects ??= []
  draft.tileLayers ??= []
  draft.placements ??= []
  draft.collisionZones ??= []
  draft.terrainSegments ??= []
  draft.verticalTransports ??= []
  draft.minimap ??= {
    mode: 'auto',
    fogOfWar: true,
    showPlacements: true,
    showEvents: true,
    regionNotes: '',
    segments: []
  }
  draft.minimap.segments ??= []
}

await fs.writeFile(draftsPath, `${JSON.stringify(drafts, null, 2)}\n`, 'utf8')
console.log(JSON.stringify({ maps: Object.keys(drafts.maps).length, schema: 'map-editor-v2' }, null, 2))
