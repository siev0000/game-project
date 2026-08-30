import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = path.join(root, 'src', 'data', 'exploration')
const masterPath = path.join(dataDir, 'areaMaster.json')
const draftsPath = path.join(dataDir, 'areaMapDrafts.json')
const statesPath = path.join(dataDir, 'areaStateDefaults.json')

const terrainAreas = [
  {
    terrainType: 'grassland',
    name: '風渡りの草原',
    description: '背の低い草と緩やかな丘が続く、見通しのよい外界草原。',
    width: 4200,
    lighting: 'warm_daylight',
    weather: 'gentle_wind',
    hazards: []
  },
  {
    terrainType: 'forest',
    name: '翠影の森',
    description: '巨木と倒木が進路を区切る、薄暗く湿った森林地帯。',
    width: 4600,
    lighting: 'filtered_forest_light',
    weather: 'leaf_fall',
    hazards: ['dense_vegetation']
  },
  {
    terrainType: 'wetland',
    name: '霧沈みの湿地',
    description: '浅瀬とぬかるみ、発光植物が点在する霧深い湿地。',
    width: 4000,
    lighting: 'mist_diffused_light',
    weather: 'low_fog',
    hazards: ['mud', 'shallow_water']
  },
  {
    terrainType: 'coast',
    name: '白波の海岸',
    description: '砂浜から岩礁と海食洞へ続く、波風の強い沿岸地帯。',
    width: 4400,
    lighting: 'coastal_daylight',
    weather: 'sea_breeze',
    hazards: ['high_tide']
  },
  {
    terrainType: 'desert',
    name: '赤砂の荒野',
    description: '赤い砂丘と風化した岩柱が続く乾燥した荒野。',
    width: 4800,
    lighting: 'harsh_sunlight',
    weather: 'dry_wind',
    hazards: ['heat', 'sand_gust']
  },
  {
    terrainType: 'snowfield',
    name: '銀霜の雪原',
    description: '積雪と凍結した足場が広がる、吹雪に閉ざされた雪原。',
    width: 4200,
    lighting: 'cold_overcast',
    weather: 'light_blizzard',
    hazards: ['cold', 'slippery_ice']
  },
  {
    terrainType: 'mountain',
    name: '天穿つ山道',
    description: '急斜面と狭い尾根を登る、高低差の大きな山岳路。',
    width: 4600,
    lighting: 'highland_daylight',
    weather: 'strong_wind',
    hazards: ['falling_rocks', 'cliff']
  },
  {
    terrainType: 'canyon',
    name: '裂石の渓谷',
    description: '断崖と谷底を古い橋で渡る、岩壁に囲まれた渓谷。',
    width: 4500,
    lighting: 'canyon_shadow',
    weather: 'updraft',
    hazards: ['cliff', 'unstable_bridge']
  },
  {
    terrainType: 'cave',
    name: '陽差す洞窟',
    description: '地表の光と植物が一部に残る、浅層の自然洞窟。',
    width: 3600,
    lighting: 'cave_entrance_light',
    weather: 'none',
    hazards: ['falling_stone']
  },
  {
    terrainType: 'underground_cave',
    name: '深層地下洞',
    description: '地底湖と発光鉱物だけが周囲を照らす閉鎖的な地下洞窟。',
    width: 4000,
    lighting: 'bioluminescent_dark',
    weather: 'none',
    hazards: ['deep_water', 'cave_in']
  },
  {
    terrainType: 'volcanic',
    name: '灰炎の火山帯',
    description: '溶岩流と噴気孔が絶えず地形を変える危険な火山地帯。',
    width: 4200,
    lighting: 'volcanic_glow',
    weather: 'ash_fall',
    hazards: ['lava', 'toxic_gas', 'heat']
  },
  {
    terrainType: 'ruins',
    name: '忘れられた遺跡',
    description: '自然に埋もれた旧文明の建造物と地下構造が残る遺跡。',
    width: 4400,
    lighting: 'ruin_twilight',
    weather: 'still_air',
    hazards: ['ancient_trap', 'collapse']
  }
]

const terrainCatalog = JSON.parse(await fs.readFile(path.join(dataDir, 'terrainTypes.json'), 'utf8'))
const terrainTypeIds = new Set(terrainCatalog.terrainTypes.map(terrain => terrain.id))
for (const terrain of terrainAreas) {
  if (!terrainTypeIds.has(terrain.terrainType)) {
    throw new Error(`Unknown terrain type: ${terrain.terrainType}`)
  }
}

const makeArea = terrain => ({
  id: `exterior_${terrain.terrainType}`,
  name: terrain.name,
  description: terrain.description,
  areaKind: 'field',
  layer: 'exterior',
  districtId: 'exterior_prototype',
  scene: `areas/exterior/${terrain.terrainType}`,
  map: `maps/exterior/${terrain.terrainType}`,
  bgm: `exterior_${terrain.terrainType}`,
  width: terrain.width,
  horizontalLoop: false,
  mapUiTheme: 'fantasy',
  terrainType: terrain.terrainType,
  defaultSpawn: 'entrance_main',
  spawns: [
    { id: 'entrance_main', label: '探索開始地点', x: 180, y: 0 }
  ],
  exits: [],
  enemyFormations: [`exterior_${terrain.terrainType}_roaming`],
  environment: {
    lighting: terrain.lighting,
    weather: terrain.weather,
    hazards: terrain.hazards,
    cameraMode: 'side_scroll'
  },
  backgrounds: [
    `exterior_${terrain.terrainType}_far`,
    `exterior_${terrain.terrainType}_mid`,
    `exterior_${terrain.terrainType}_foreground`
  ],
  requiredEventFlags: []
})

const terrainEffects = {
  grassland: ['wind'],
  forest: ['leaves', 'magic_motes'],
  wetland: ['mist', 'glow_spores'],
  coast: ['wind', 'sea_spray'],
  desert: ['dust', 'wind'],
  snowfield: ['snow', 'wind'],
  mountain: ['wind'],
  canyon: ['dust', 'wind'],
  cave: ['cave_dust'],
  underground_cave: ['glow_spores', 'cave_dust'],
  volcanic: ['ash', 'embers'],
  ruins: ['magic_motes', 'cave_dust']
}

const makeMap = (area, index) => ({
  height: 720,
  groundY: 570,
  backgroundLayers: {
    far: { assetId: `exterior_${area.terrainType}_far`, parallax: 0.2, visible: true },
    mid: { assetId: `exterior_${area.terrainType}_mid`, parallax: 0.5, visible: true },
    foreground: { assetId: `exterior_${area.terrainType}_foreground`, parallax: 1.15, visible: true }
  },
  playerPresentation: {
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
  },
  environmentEffects: terrainEffects[area.terrainType] ?? [],
  collisionZones: [],
  terrainSegments: [],
  verticalTransports: [],
  minimap: {
    mode: 'auto',
    fogOfWar: true,
    showPlacements: true,
    showEvents: true,
    regionNotes: '',
    segments: []
  },
  platforms: [
    {
      id: `${area.terrainType}_ledge_a`,
      x: 620 + (index % 3) * 90,
      y: 438 - (index % 2) * 34,
      width: 520
    },
    {
      id: `${area.terrainType}_ledge_b`,
      x: Math.round(area.width * 0.52),
      y: 410 + (index % 3) * 18,
      width: 460 + (index % 2) * 120
    }
  ],
  tileLayers: [
    {
      id: 'ground_detail',
      name: '地面装飾',
      tileSize: 64,
      visible: true,
      tiles: [
        {
          id: `${area.terrainType}_tile_01`,
          assetId: `tile_${area.terrainType}_ground_top_01`,
          x: 1024 + index * 24,
          y: 506,
          collision: false
        }
      ]
    }
  ],
  placements: [
    {
      id: `${area.terrainType}_npc_01`,
      type: 'npc',
      label: '仮NPC',
      assetId: 'placeholder_npc',
      x: Math.round(area.width * 0.28),
      y: 570,
      width: 42,
      height: 66,
      requiredEventFlags: []
    },
    {
      id: `${area.terrainType}_enemy_01`,
      type: 'enemy',
      label: '仮敵グループ',
      assetId: 'placeholder_enemy',
      x: Math.round(area.width * 0.48),
      y: 570,
      width: 52,
      height: 66,
      requiredEventFlags: []
    },
    {
      id: `${area.terrainType}_treasure_01`,
      type: 'treasure',
      label: '仮宝箱',
      assetId: 'placeholder_treasure',
      x: Math.round(area.width * 0.64),
      y: 570,
      width: 48,
      height: 36,
      requiredEventFlags: []
    },
    {
      id: `${area.terrainType}_save_01`,
      type: 'save_point',
      label: '仮セーブポイント',
      assetId: 'placeholder_save_point',
      x: Math.round(area.width * 0.82),
      y: 570,
      width: 44,
      height: 72,
      requiredEventFlags: []
    }
  ],
  eventPoints: [
    {
      id: `${area.id}_landmark`,
      label: `${area.name}の仮ランドマーク`,
      x: Math.round(area.width * 0.72)
    }
  ],
  speechLines: [
    `${area.name}へ出た。`,
    area.description,
    '現在はファンタジーUIと仮地形を確認するための試作エリアだ。'
  ]
})

const makeState = () => ({
  openedDoors: [],
  defeatedEnemies: [],
  collectedItems: [],
  repairedFacilities: [],
  rescuedNpcs: [],
  alarmState: 'normal',
  clearedBoss: false,
  unlockedExits: []
})

const master = JSON.parse(await fs.readFile(masterPath, 'utf8'))
const drafts = JSON.parse(await fs.readFile(draftsPath, 'utf8'))
const states = JSON.parse(await fs.readFile(statesPath, 'utf8'))
const oldExteriorAreaIds = new Set(
  master.areas.filter(area => area.layer === 'exterior').map(area => area.id)
)
const exteriorAreas = terrainAreas.map(makeArea)
const exteriorAreaIds = exteriorAreas.map(area => area.id)

master.districts = [
  ...master.districts.filter(district => district.layer !== 'exterior'),
  {
    id: 'exterior_prototype',
    name: '外界・地形試作区',
    layer: 'exterior',
    description: 'ファンタジーUIと外界地形の見え方を確認するための仮エリア群。',
    areaIds: exteriorAreaIds
  }
]
master.areas = [
  ...master.areas.filter(area => area.layer !== 'exterior'),
  ...exteriorAreas
]

for (const areaId of oldExteriorAreaIds) {
  delete drafts.maps[areaId]
  delete states.areaStates[areaId]
}
for (const [index, area] of exteriorAreas.entries()) {
  drafts.maps[area.id] = makeMap(area, index)
  states.areaStates[area.id] = makeState()
}

await fs.writeFile(masterPath, `${JSON.stringify(master, null, 2)}\n`, 'utf8')
await fs.writeFile(draftsPath, `${JSON.stringify(drafts, null, 2)}\n`, 'utf8')
await fs.writeFile(statesPath, `${JSON.stringify(states, null, 2)}\n`, 'utf8')

console.log({
  district: 'exterior_prototype',
  areas: exteriorAreas.length,
  mapUiTheme: 'fantasy',
  exits: exteriorAreas.reduce((count, area) => count + area.exits.length, 0)
})
