import areaMaster from './areaMaster.json'
import areaStateDefaults from './areaStateDefaults.json'
import eventFlagMaster from './eventFlags.json'
import terrainTypeMaster from './terrainTypes.json'

const clone = value => JSON.parse(JSON.stringify(value))

export const districts = areaMaster.districts
export const areas = areaMaster.areas
export const eventFlags = eventFlagMaster.flags
export const terrainTypes = terrainTypeMaster.terrainTypes

export const getTerrainTypeById = terrainTypeId => (
  clone(terrainTypes.find(candidate => candidate.id === terrainTypeId) ?? null)
)

export const getAreaById = areaId => (
  clone(areas.find(candidate => candidate.id === areaId) ?? null)
)

export const getAreaState = (areaId, savedAreaStates = {}) => ({
  ...clone(areaStateDefaults.areaStates[areaId] ?? {}),
  ...clone(savedAreaStates[areaId] ?? {})
})

export const resolveAreaLoad = ({
  areaId,
  spawnId,
  savedAreaStates = {},
  activeEventFlags = {}
}) => {
  const area = getAreaById(areaId)
  if (!area) return null

  const resolvedSpawnId = spawnId || area.defaultSpawn
  const spawn = area.spawns.find(item => item.id === resolvedSpawnId)
    ?? area.spawns.find(item => item.id === area.defaultSpawn)
    ?? null

  return {
    area,
    map: area.map,
    scene: area.scene,
    spawn,
    state: getAreaState(areaId, savedAreaStates),
    activeEventFlags: clone(activeEventFlags)
  }
}
