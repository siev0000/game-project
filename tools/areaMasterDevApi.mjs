import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const sendJson = (res, status, payload) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

const readBody = req => new Promise((resolve, reject) => {
  let body = ''
  req.setEncoding('utf8')
  req.on('data', chunk => {
    body += chunk
    if (body.length > 1024 * 1024) {
      reject(new Error('リクエストが大きすぎます'))
      req.destroy()
    }
  })
  req.on('end', () => resolve(body))
  req.on('error', reject)
})

const imageAssetExtensions = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp'])

const collectImageAssets = async (directory, rootDirectory) => {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async entry => {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) return collectImageAssets(entryPath, rootDirectory)
    if (!entry.isFile() || !imageAssetExtensions.has(path.extname(entry.name).toLowerCase())) return []
    const relativePath = path.relative(rootDirectory, entryPath).split(path.sep).join('/')
    return [{
      id: relativePath,
      name: path.basename(entry.name, path.extname(entry.name)),
      extension: path.extname(entry.name).slice(1).toUpperCase(),
      directory: path.dirname(relativePath) === '.' ? 'images' : path.dirname(relativePath),
      source: `/api/local/image-assets/file?path=${encodeURIComponent(relativePath)}`
    }]
  }))
  return nested.flat().sort((left, right) => left.id.localeCompare(right.id, 'ja'))
}

const resolveImageAssetPath = (rootDirectory, requestedPath) => {
  if (!requestedPath || typeof requestedPath !== 'string') return null
  const candidate = path.resolve(rootDirectory, requestedPath)
  const relative = path.relative(rootDirectory, candidate)
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return null
  return candidate
}

const imageContentType = filePath => ({
  '.avif': 'image/avif', '.gif': 'image/gif', '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp'
}[path.extname(filePath).toLowerCase()] || 'application/octet-stream')

const duplicateIds = items => {
  const ids = items.map(item => item.id)
  return new Set(ids).size !== ids.length
}

const validateMapPartLibrary = library => {
  if (!library || !Array.isArray(library.parts) || duplicateIds(library.parts)) {
    throw new Error('素材・部品ライブラリが配列でないか、部品IDが重複しています')
  }
  const categories = new Set(['floor', 'wall', 'pipe', 'platform', 'decoration'])
  const placementModes = new Set(['grid', 'free'])
  const renderLayers = new Set(['background', 'behindPlayer', 'frontPlayer', 'foreground'])
  for (const part of library.parts) {
    const rect = part?.sourceRect
    const source = part?.sourceSize
    if (!part?.id || !part.name || !part.imageAssetId || !categories.has(part.category)
      || !placementModes.has(part.placementMode) || !renderLayers.has(part.defaultRenderLayer)
      || !rect || !source || !Number.isFinite(rect.x) || !Number.isFinite(rect.y)
      || !Number.isFinite(rect.width) || !Number.isFinite(rect.height)
      || !Number.isFinite(source.width) || !Number.isFinite(source.height)
      || rect.width < 1 || rect.height < 1 || rect.x < 0 || rect.y < 0
      || rect.x + rect.width > source.width || rect.y + rect.height > source.height) {
      throw new Error(`${part?.id || 'unknown'}: 素材・部品設定が不正です`)
    }
  }
}

const validateMaster = (master, flagIds, terrainTypeIds) => {
  if (!Array.isArray(master.districts) || !Array.isArray(master.areas)) {
    throw new Error('districts または areas が配列ではありません')
  }

  const areaIds = new Set(master.areas.map(area => area.id))
  if (areaIds.size !== master.areas.length) throw new Error('エリアIDが重複しています')

  for (const area of master.areas) {
    if (!area.id || !area.name || !area.scene || !area.map || !area.bgm) {
      throw new Error(`${area.id || 'unknown'}: 必須の基本情報が不足しています`)
    }
    if (!Number.isFinite(area.width) || area.width < 640 || area.width > 50000) {
      throw new Error(`${area.id}: 横幅は640〜50000pxで指定してください`)
    }
    if (typeof area.horizontalLoop !== 'boolean') {
      throw new Error(`${area.id}: 横方向ループ設定はtrue/falseで指定してください`)
    }
    if (!['route', 'facility', 'field'].includes(area.areaKind)) {
      throw new Error(`${area.id}: エリア種別が不正です`)
    }
    if (!['electronic_sf', 'fantasy'].includes(area.mapUiTheme)) {
      throw new Error(`${area.id}: マップUIテーマが不正です`)
    }
    if (!terrainTypeIds.has(area.terrainType)) {
      throw new Error(`${area.id}: 地形ID ${area.terrainType || '(未設定)'} が存在しません`)
    }
    if (!Array.isArray(area.spawns) || !area.spawns.length || duplicateIds(area.spawns)) {
      throw new Error(`${area.id}: 出現地点がないか、IDが重複しています`)
    }
    if (!area.spawns.some(spawn => spawn.id === area.defaultSpawn)) {
      throw new Error(`${area.id}: 初期出現位置が存在しません`)
    }
    if (!Array.isArray(area.exits) || duplicateIds(area.exits)) {
      throw new Error(`${area.id}: 出口IDが重複しています`)
    }
    for (const exit of area.exits) {
      const destination = master.areas.find(candidate => candidate.id === exit.destinationArea)
      if (!destination) throw new Error(`${area.id}/${exit.id}: 移動先エリアが存在しません`)
      if (!destination.spawns.some(spawn => spawn.id === exit.destinationSpawn)) {
        throw new Error(`${area.id}/${exit.id}: 移動先の出現地点が存在しません`)
      }
      for (const flag of exit.requiredEventFlags || []) {
        if (!flagIds.has(flag)) throw new Error(`${area.id}/${exit.id}: イベントフラグ ${flag} が存在しません`)
      }
    }
    for (const flag of area.requiredEventFlags || []) {
      if (!flagIds.has(flag)) throw new Error(`${area.id}: イベントフラグ ${flag} が存在しません`)
    }
  }
}

const validateCharacterLibrary = (library, dialogueSettings) => {
  if (!Array.isArray(library?.characters) || duplicateIds(library.characters)) {
    throw new Error('characters が配列ではないか、キャラクターIDが重複しています')
  }
  for (const character of library.characters) {
    if (!character.id || !character.name || !['player', 'npc'].includes(character.kind)) {
      throw new Error('キャラクターID、表示名、種別が不足しています')
    }
    if (!Object.hasOwn(dialogueSettings?.typeProfiles || {}, String(character.messageType))) {
      throw new Error(`${character.id}: メッセージタイプ ${character.messageType || '(未設定)'} が不正です`)
    }
    for (const key of ['displayWidth', 'displayHeight', 'hitboxWidth', 'hitboxHeight']) {
      if (!Number.isFinite(character[key]) || character[key] <= 0) throw new Error(`${character.id}: ${key} が不正です`)
    }
    if (!character.animations || typeof character.animations !== 'object') throw new Error(`${character.id}: アニメーション設定が不足しています`)
    for (const state of ['idle', 'walk', 'jump', 'fall', 'talk']) {
      const animation = character.animations[state]
      const columns = animation?.columns ?? animation?.frames
      const rows = animation?.rows ?? 1
      if (!animation || typeof animation.imageSource !== 'string' || !Number.isFinite(animation.frames)
        || animation.frames < 1 || !Number.isFinite(columns) || columns < 1
        || !Number.isFinite(rows) || rows < 1
        || (animation.columns != null && animation.rows != null && animation.frames !== columns * rows)
        || !Number.isFinite(animation.fps) || animation.fps < 1) {
        throw new Error(`${character.id}: ${state}アニメーション設定が不正です`)
      }
    }
    const portrait = character.portrait
    const portraitEmotionIds = ['default', 'joy', 'anger', 'sorrow', 'fun', 'surprise', 'confusion', 'tense', 'serious']
    if (portrait != null && (typeof portrait !== 'object'
      || !portrait.images || typeof portrait.images !== 'object'
      || portraitEmotionIds.some(emotion => typeof portrait.images[emotion] !== 'string')
      || !Number.isFinite(portrait.offsetX)
      || !Number.isFinite(portrait.offsetY)
      || !Number.isFinite(portrait.scale))) {
      throw new Error(`${character.id}: 会話用ポートレート設定が不正です`)
    }
  }
}

const validateDialogueMessageSettings = (settings, characterLibrary, dialogueEvents) => {
  if (!settings || typeof settings !== 'object' || !settings.typeProfiles || typeof settings.typeProfiles !== 'object') {
    throw new Error('typeProfiles を含む会話メッセージ設定が必要です')
  }
  const typeIds = new Set(Object.keys(settings.typeProfiles))
  if (!typeIds.size) throw new Error('会話メッセージTYPEを1件以上設定してください')
  for (const [typeId, profile] of Object.entries(settings.typeProfiles)) {
    if (!profile || typeof profile !== 'object' || !profile.default || typeof profile.default !== 'object' || !profile.emotions || typeof profile.emotions !== 'object') {
      throw new Error(`TYPE-${typeId}: 基本設定または感情設定が不正です`)
    }
  }
  validateCharacterLibrary(characterLibrary, settings)
  validateDialogueEvents(dialogueEvents, characterLibrary, settings)
}

const validateDialogueEvents = (library, characterLibrary, dialogueSettings) => {
  if (!Array.isArray(library?.events) || duplicateIds(library.events)) {
    throw new Error('events が配列ではないか、会話イベントIDが重複しています')
  }
  const characterIds = new Set((characterLibrary?.characters || []).map(character => character.id))
  const typeIds = new Set(Object.keys(dialogueSettings?.typeProfiles || {}))
  const statuses = new Set(['draft', 'review', 'confirmed'])
  const emotions = new Set(['default', 'joy', 'anger', 'sorrow', 'fun', 'surprise', 'confusion', 'tense', 'serious'])
  for (const event of library.events) {
    if (!event.id || !event.name || !statuses.has(event.status) || !Array.isArray(event.entries) || duplicateIds(event.entries)) {
      throw new Error(`${event.id || 'unknown'}: 会話イベントの基本情報または発言IDが不正です`)
    }
    for (const entry of event.entries) {
      if (!entry.id || typeof entry.message !== 'string' || !entry.message.trim()) {
        throw new Error(`${event.id}: 発言IDまたは本文が不足しています`)
      }
      if (entry.speakerId && !characterIds.has(entry.speakerId)) {
        throw new Error(`${event.id}/${entry.id}: キャラクターID ${entry.speakerId} が存在しません`)
      }
      const speaker = (characterLibrary?.characters || []).find(character => character.id === entry.speakerId)
      if (speaker?.messageType != null && String(entry.type) !== String(speaker.messageType)) {
        throw new Error(`${event.id}/${entry.id}: メッセージタイプがキャラクター設定と一致しません`)
      }
      if (!typeIds.has(String(entry.type))) {
        throw new Error(`${event.id}/${entry.id}: メッセージTYPE ${entry.type} が存在しません`)
      }
      if (!emotions.has(entry.emotion)) {
        throw new Error(`${event.id}/${entry.id}: 感情 ${entry.emotion} が不正です`)
      }
      if (entry.displayMode != null && !['plain', 'portrait'].includes(entry.displayMode)) {
        throw new Error(`${event.id}/${entry.id}: 会話表示 ${entry.displayMode} が不正です`)
      }
      if (entry.portraitEffect != null && !['none', 'noise', 'monitor'].includes(entry.portraitEffect)) {
        throw new Error(`${event.id}/${entry.id}: 顔エフェクト ${entry.portraitEffect} が不正です`)
      }
    }
  }
}

const validateMapDraft = (area, draft, catalog, characterLibrary, mapPartLibrary = { parts: [] }) => {
  if (!draft || !Number.isFinite(draft.height) || draft.height < 320 || draft.height > 2160) {
    throw new Error(`${area.id}: マップ高さは320〜2160pxで指定してください`)
  }
  if (!Number.isFinite(draft.groundY) || draft.groundY < 0 || draft.groundY > draft.height) {
    throw new Error(`${area.id}: 地面Yがマップ範囲外です`)
  }

  const boundedItems = [
    ['足場', draft.platforms ?? []],
    ['配置物', draft.placements ?? []]
  ]
  for (const [label, items] of boundedItems) {
    if (!Array.isArray(items) || duplicateIds(items)) {
      throw new Error(`${area.id}: ${label}IDが重複しているか、配列ではありません`)
    }
    for (const item of items) {
      if (!item.id || !Number.isFinite(item.x) || !Number.isFinite(item.y)) {
        throw new Error(`${area.id}: ${label}のIDまたは座標が不足しています`)
      }
      if (item.x < 0 || item.x > area.width || item.y < 0 || item.y > draft.height) {
        throw new Error(`${area.id}/${item.id}: ${label}の座標がマップ範囲外です`)
      }
    }
  }

  const placementTypeIds = new Set(catalog.placementTypes.map(item => item.id))
  for (const placement of draft.placements ?? []) {
    if (!placementTypeIds.has(placement.type)) {
      throw new Error(`${area.id}/${placement.id}: 配置種別 ${placement.type || '(未設定)'} が存在しません`)
    }
    if (placement.type === 'npc') {
      const npcIds = new Set(characterLibrary.characters.filter(character => character.kind === 'npc').map(character => character.id))
      if (!npcIds.has(placement.characterId ?? 'placeholder_npc')) {
        throw new Error(`${area.id}/${placement.id}: NPCキャラクターIDがキャラクターライブラリに存在しません`)
      }
    }
  }

  if (!Array.isArray(draft.collisionZones) || duplicateIds(draft.collisionZones)) {
    throw new Error(`${area.id}: 当たり判定IDが重複しているか、配列ではありません`)
  }
  for (const zone of draft.collisionZones) {
    if (!zone.id || !Number.isFinite(zone.x) || !Number.isFinite(zone.y)
      || !Number.isFinite(zone.width) || !Number.isFinite(zone.height)) {
      throw new Error(`${area.id}: 当たり判定の必須情報が不足しています`)
    }
    if (zone.x < 0 || zone.x + zone.width > area.width
      || zone.y < 0 || zone.y + zone.height > draft.height) {
      throw new Error(`${area.id}/${zone.id}: 当たり判定がマップ範囲外です`)
    }
  }

  if (!Array.isArray(draft.terrainSegments ?? []) || duplicateIds(draft.terrainSegments ?? [])) {
    throw new Error(`${area.id}: 地形区間IDが重複しているか、配列ではありません`)
  }
  const terrainSegmentTypes = new Set(['flat', 'step', 'slope', 'stairs'])
  for (const segment of draft.terrainSegments ?? []) {
    if (!segment.id || !terrainSegmentTypes.has(segment.type)
      || !Number.isFinite(segment.x) || !Number.isFinite(segment.width)
      || !Number.isFinite(segment.startY) || !Number.isFinite(segment.endY)) {
      throw new Error(`${area.id}: 地形区間の必須情報が不足しています`)
    }
    if (segment.x < 0 || segment.x + segment.width > area.width
      || segment.startY < 0 || segment.startY > draft.height
      || segment.endY < 0 || segment.endY > draft.height) {
      throw new Error(`${area.id}/${segment.id}: 地形区間がマップ範囲外です`)
    }
  }

  if (!Array.isArray(draft.verticalTransports ?? []) || duplicateIds(draft.verticalTransports ?? [])) {
    throw new Error(`${area.id}: 昇降設備IDが重複しているか、配列ではありません`)
  }
  const transportTypes = new Set(['ladder', 'elevator'])
  for (const transport of draft.verticalTransports ?? []) {
    if (!transport.id || !transportTypes.has(transport.type)
      || !Number.isFinite(transport.x) || !Number.isFinite(transport.width)
      || !Number.isFinite(transport.topY) || !Number.isFinite(transport.bottomY)
      || !Number.isFinite(transport.speed)) {
      throw new Error(`${area.id}: 昇降設備の必須情報が不足しています`)
    }
    if (transport.x < 0 || transport.x + transport.width > area.width
      || transport.topY < 0 || transport.topY > draft.height
      || transport.bottomY < 0 || transport.bottomY > draft.height) {
      throw new Error(`${area.id}/${transport.id}: 昇降設備がマップ範囲外です`)
    }
  }

  if (!Array.isArray(draft.tileLayers) || duplicateIds(draft.tileLayers)) {
    throw new Error(`${area.id}: タイルレイヤーIDが重複しているか、配列ではありません`)
  }
  for (const layer of draft.tileLayers) {
    if (!Array.isArray(layer.tiles) || duplicateIds(layer.tiles)) {
      throw new Error(`${area.id}/${layer.id}: タイルIDが重複しているか、配列ではありません`)
    }
    for (const tile of layer.tiles) {
      if (!tile.id || (!tile.assetId && !tile.imageSource) || !Number.isFinite(tile.x) || !Number.isFinite(tile.y)) {
        throw new Error(`${area.id}/${layer.id}: タイルの必須情報が不足しています`)
      }
      if (tile.x < 0 || tile.x > area.width || tile.y < 0 || tile.y > draft.height) {
        throw new Error(`${area.id}/${layer.id}/${tile.id}: タイル座標がマップ範囲外です`)
      }
    }
  }

  if (!Array.isArray(draft.mapParts ?? []) || duplicateIds(draft.mapParts ?? [])) {
    throw new Error(`${area.id}: 素材・部品配置IDが重複しているか、配列ではありません`)
  }
  const partIds = new Set(mapPartLibrary.parts.map(part => part.id))
  const renderLayers = new Set(['background', 'behindPlayer', 'frontPlayer', 'foreground'])
  for (const part of draft.mapParts ?? []) {
    if (!part?.id || !partIds.has(part.partId) || !renderLayers.has(part.renderLayer)
      || !Number.isFinite(part.x) || !Number.isFinite(part.y)
      || !Number.isFinite(part.width) || !Number.isFinite(part.height)
      || part.width < 1 || part.height < 1 || part.x < 0 || part.y < 0
      || part.x + part.width > area.width || part.y + part.height > draft.height) {
      throw new Error(`${area.id}/${part?.id || 'unknown'}: 素材・部品配置が不正です`)
    }
  }

  const playerIds = new Set(characterLibrary.characters.filter(character => character.kind === 'player').map(character => character.id))
  const playerCharacterId = draft.playerPresentation?.characterId ?? draft.playerPresentation?.characterAssetId
  if (!playerIds.has(playerCharacterId)) {
    throw new Error(`${area.id}: プレイヤーキャラクターIDがキャラクターライブラリに存在しません`)
  }
  const effectIds = new Set(catalog.environmentEffects.map(item => item.id))
  if (!Array.isArray(draft.environmentEffects)
    || draft.environmentEffects.some(effectId => !effectIds.has(effectId))) {
    throw new Error(`${area.id}: 環境演出IDが素材カタログに存在しません`)
  }
  if (!draft.backgroundLayers || typeof draft.backgroundLayers !== 'object'
    || !['far', 'mid', 'foreground'].every(layer => draft.backgroundLayers[layer])) {
    throw new Error(`${area.id}: 背景レイヤー設定が不足しています`)
  }
  const gradient = draft.backgroundGradient
  if (!gradient || !['top', 'right', 'bottom', 'left'].every(side => /^#[0-9a-f]{6}$/i.test(gradient[side] ?? ''))) {
    throw new Error(`${area.id}: 最奥背景の4方向色が不足しています`)
  }
  if (!Array.isArray(draft.backgroundImages) || duplicateIds(draft.backgroundImages)) {
    throw new Error(`${area.id}: 背景画像レイヤーが配列でないかIDが重複しています`)
  }
  if (!Array.isArray(draft.speechLines)) {
    throw new Error(`${area.id}: セリフ設定が配列ではありません`)
  }
  if (!draft.minimap || !['auto', 'custom'].includes(draft.minimap.mode)) {
    throw new Error(`${area.id}: ミニマップ設定が不足しています`)
  }
  if (!Array.isArray(draft.minimap.segments) || duplicateIds(draft.minimap.segments)) {
    throw new Error(`${area.id}: ミニマップ区画IDが重複しているか、配列ではありません`)
  }
  for (const segment of draft.minimap.segments) {
    if (!segment.id || !Number.isFinite(segment.startX) || !Number.isFinite(segment.endX)
      || segment.startX < 0 || segment.endX > area.width || segment.startX >= segment.endX) {
      throw new Error(`${area.id}/${segment.id || 'minimap'}: ミニマップ区画の範囲が不正です`)
    }
  }
}

const validateAreaState = (areaId, state) => {
  const arrayKeys = [
    'openedDoors', 'defeatedEnemies', 'collectedItems',
    'repairedFacilities', 'rescuedNpcs', 'unlockedExits'
  ]
  for (const key of arrayKeys) {
    if (!Array.isArray(state?.[key]) || new Set(state[key]).size !== state[key].length) {
      throw new Error(`${areaId}: ${key} が配列でないか、値が重複しています`)
    }
  }
  if (!['normal', 'alert', 'emergency'].includes(state.alarmState)) {
    throw new Error(`${areaId}: 警報状態が不正です`)
  }
  if (typeof state.clearedBoss !== 'boolean') {
    throw new Error(`${areaId}: ボス撃破状態はtrue/falseで指定してください`)
  }
}

const validateBattleFormationLayout = layout => {
  const pointKeys = [
    'enemyOuterTop', 'enemyOuterBottom', 'centerTop',
    'centerBottom', 'allyOuterTop', 'allyOuterBottom'
  ]
  if (!layout || layout.version !== 1 || !layout.field) {
    throw new Error('配置面JSONのversionまたはfieldが不正です')
  }
  for (const key of pointKeys) {
    const point = layout.field[key]
    if (!Number.isFinite(point?.x) || !Number.isFinite(point?.y)
      || point.x < 0 || point.x > 100 || point.y < 0 || point.y > 100) {
      throw new Error(`${key}はX/Yとも0～100で指定してください`)
    }
  }
  for (const key of ['columnBreaks', 'rowBreaks']) {
    const values = layout[key]
    if (!Array.isArray(values) || values.length !== 2
      || values.some(value => !Number.isFinite(value) || value <= 0 || value >= 1)
      || values[0] >= values[1]) {
      throw new Error(`${key}は0～1の昇順2件で指定してください`)
    }
  }
  if (!Number.isFinite(layout.style?.lineWidth)
    || layout.style.lineWidth < 0.25 || layout.style.lineWidth > 4) {
    throw new Error('style.lineWidthは0.25～4pxで指定してください')
  }
}

const validateBattleFormationUnits = placements => {
  if (!placements || placements.version !== 1 || !placements.baseline || !placements.enemy || !placements.ally) {
    throw new Error('キャラ配置JSONのversionまたはbaseline/enemy/allyが不正です')
  }
  if (!Number.isFinite(placements.baseline.offsetX) || placements.baseline.offsetX < -300 || placements.baseline.offsetX > 300
    || !Number.isFinite(placements.baseline.offsetY) || placements.baseline.offsetY < -200 || placements.baseline.offsetY > 200) {
    throw new Error('共通位置Xは-300～300、Yは-200～200で指定してください')
  }
  for (const side of ['enemy', 'ally']) {
    const allowedColumns = side === 'enemy' ? ['back', 'middle', 'front'] : ['front', 'middle', 'back']
    for (const [id, placement] of Object.entries(placements[side])) {
      if (!allowedColumns.includes(placement?.column)
        || !Number.isInteger(placement?.row) || placement.row < 0 || placement.row > 2
        || !Number.isFinite(placement?.offsetX) || placement.offsetX < -300 || placement.offsetX > 300
        || !Number.isFinite(placement?.offsetY) || placement.offsetY < -200 || placement.offsetY > 200) {
        throw new Error(`${side}:${id}の列・行・X/Y微調整が不正です`)
      }
    }
  }
}

export const areaMasterDevApi = () => {
  const locallySavedUntil = new Map()
  const normalizePath = filePath => path.resolve(filePath).split(path.sep).join('/')
  const suppressNextLocalSaveReload = filePath => {
    locallySavedUntil.set(normalizePath(filePath), Date.now() + 3000)
  }

  return {
    name: 'local-area-master-api',
    apply: 'serve',
    handleHotUpdate(context) {
      const normalizedPath = normalizePath(context.file)
      const suppressedUntil = locallySavedUntil.get(normalizedPath)
      if (suppressedUntil) {
        locallySavedUntil.delete(normalizedPath)
        if (suppressedUntil >= Date.now()) return []
      }
      if (normalizedPath.endsWith('/src/data/battle/battleFormationLayout.json')
        || normalizedPath.endsWith('/src/data/battle/battleFormationUnits.json')) return []
    },
    configureServer(server) {
    const root = server.config.root || process.cwd()
    const masterPath = path.resolve(root, 'src/data/exploration/areaMaster.json')
    const backupPath = path.join(os.tmpdir(), 'game-project-areaMaster.json.bak')
    const flagsPath = path.resolve(root, 'src/data/exploration/eventFlags.json')
    const terrainTypesPath = path.resolve(root, 'src/data/exploration/terrainTypes.json')
    const mapDraftsPath = path.resolve(root, 'src/data/exploration/areaMapDrafts.json')
    const mapPartLibraryPath = path.resolve(root, 'src/data/exploration/mapPartLibrary.json')
    const assetCatalogPath = path.resolve(root, 'src/data/exploration/explorationAssetCatalog.json')
    const characterLibraryPath = path.resolve(root, 'src/data/exploration/characterLibrary.json')
    const dialogueEventsPath = path.resolve(root, 'src/data/exploration/dialogueEvents.json')
    const dialogueSettingsPath = path.resolve(root, 'data/dialogueMessageSettings.json')
    const battleFormationLayoutPath = path.resolve(root, 'src/data/battle/battleFormationLayout.json')
    const battleFormationUnitsPath = path.resolve(root, 'src/data/battle/battleFormationUnits.json')
    const imageAssetsPath = path.resolve(root, 'src/assets/images')
    const mapDraftsBackupPath = path.join(os.tmpdir(), 'game-project-areaMapDrafts.json.bak')
    const mapPartLibraryBackupPath = path.join(os.tmpdir(), 'game-project-mapPartLibrary.json.bak')
    const areaStatesPath = path.resolve(root, 'src/data/exploration/areaStateDefaults.json')
    const areaStatesBackupPath = path.join(os.tmpdir(), 'game-project-areaStateDefaults.json.bak')
    const characterLibraryBackupPath = path.join(os.tmpdir(), 'game-project-characterLibrary.json.bak')
    const dialogueEventsBackupPath = path.join(os.tmpdir(), 'game-project-dialogueEvents.json.bak')
    const dialogueSettingsBackupPath = path.join(os.tmpdir(), 'game-project-dialogueMessageSettings.json.bak')
    const battleFormationLayoutBackupPath = path.join(os.tmpdir(), 'game-project-battleFormationLayout.json.bak')
    const battleFormationUnitsBackupPath = path.join(os.tmpdir(), 'game-project-battleFormationUnits.json.bak')

    server.middlewares.use('/api/local/image-assets', async (req, res, next) => {
      if (req.method !== 'GET') return next()
      try {
        const requestUrl = new URL(req.url, 'http://local')
        if (requestUrl.pathname === '/file') {
          const assetPath = resolveImageAssetPath(imageAssetsPath, requestUrl.searchParams.get('path'))
          if (!assetPath || !imageAssetExtensions.has(path.extname(assetPath).toLowerCase())) {
            return sendJson(res, 400, { error: '画像パスが不正です' })
          }
          const stat = await fs.stat(assetPath)
          if (!stat.isFile()) return sendJson(res, 404, { error: '画像が見つかりません' })
          res.statusCode = 200
          res.setHeader('Content-Type', imageContentType(assetPath))
          res.setHeader('Cache-Control', 'no-store')
          res.end(await fs.readFile(assetPath))
          return
        }
        if (requestUrl.pathname !== '/' && requestUrl.pathname !== '') return next()
        return sendJson(res, 200, { root: 'src/assets/images', assets: await collectImageAssets(imageAssetsPath, imageAssetsPath) })
      } catch (error) {
        console.error('[image-assets]', error)
        return sendJson(res, 400, { error: error.message || '画像一覧の読み込みに失敗しました' })
      }
    })

    server.middlewares.use('/api/local/character-library', async (req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'PUT') return next()
      try {
        const library = JSON.parse(await fs.readFile(characterLibraryPath, 'utf8'))
        if (req.method === 'GET') return sendJson(res, 200, library)
        const body = JSON.parse(await readBody(req))
        const nextLibrary = JSON.parse(JSON.stringify(body?.library))
        const dialogueSettings = JSON.parse(await fs.readFile(dialogueSettingsPath, 'utf8'))
        validateCharacterLibrary(nextLibrary, dialogueSettings)
        const tempPath = `${characterLibraryPath}.${process.pid}.tmp`
        await fs.copyFile(characterLibraryPath, characterLibraryBackupPath)
        await fs.writeFile(tempPath, `${JSON.stringify(nextLibrary, null, 2)}\n`, 'utf8')
        await fs.rename(tempPath, characterLibraryPath)
        return sendJson(res, 200, nextLibrary)
      } catch (error) {
        console.error('[character-library]', error)
        return sendJson(res, 400, { error: error.message || 'characterLibrary.jsonの保存に失敗しました' })
      }
    })

    server.middlewares.use('/api/local/dialogue-events', async (req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'PUT') return next()
      try {
        const library = JSON.parse(await fs.readFile(dialogueEventsPath, 'utf8'))
        if (req.method === 'GET') return sendJson(res, 200, library)
        const body = JSON.parse(await readBody(req))
        const nextLibrary = JSON.parse(JSON.stringify(body?.library))
        const characterLibrary = JSON.parse(await fs.readFile(characterLibraryPath, 'utf8'))
        const dialogueSettings = JSON.parse(await fs.readFile(dialogueSettingsPath, 'utf8'))
        validateDialogueEvents(nextLibrary, characterLibrary, dialogueSettings)
        const tempPath = `${dialogueEventsPath}.${process.pid}.tmp`
        await fs.copyFile(dialogueEventsPath, dialogueEventsBackupPath)
        await fs.writeFile(tempPath, `${JSON.stringify(nextLibrary, null, 2)}\n`, 'utf8')
        await fs.rename(tempPath, dialogueEventsPath)
        return sendJson(res, 200, nextLibrary)
      } catch (error) {
        console.error('[dialogue-events]', error)
        return sendJson(res, 400, { error: error.message || 'dialogueEvents.jsonの保存に失敗しました' })
      }
    })

    server.middlewares.use('/api/local/dialogue-message-settings', async (req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'PUT') return next()
      try {
        const settings = JSON.parse(await fs.readFile(dialogueSettingsPath, 'utf8'))
        if (req.method === 'GET') return sendJson(res, 200, settings)
        const body = JSON.parse(await readBody(req))
        const nextSettings = JSON.parse(JSON.stringify(body?.settings))
        const characterLibrary = JSON.parse(await fs.readFile(characterLibraryPath, 'utf8'))
        const dialogueEvents = JSON.parse(await fs.readFile(dialogueEventsPath, 'utf8'))
        validateDialogueMessageSettings(nextSettings, characterLibrary, dialogueEvents)
        const tempPath = `${dialogueSettingsPath}.${process.pid}.tmp`
        await fs.copyFile(dialogueSettingsPath, dialogueSettingsBackupPath)
        await fs.writeFile(tempPath, `${JSON.stringify(nextSettings, null, 2)}\n`, 'utf8')
        await fs.rename(tempPath, dialogueSettingsPath)
        return sendJson(res, 200, nextSettings)
      } catch (error) {
        console.error('[dialogue-message-settings]', error)
        return sendJson(res, 400, { error: error.message || 'dialogueMessageSettings.jsonの保存に失敗しました' })
      }
    })

    server.middlewares.use('/api/local/battle-formation-layout', async (req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'PUT') return next()
      try {
        const layout = JSON.parse(await fs.readFile(battleFormationLayoutPath, 'utf8'))
        if (req.method === 'GET') return sendJson(res, 200, layout)
        const body = JSON.parse(await readBody(req))
        const nextLayout = JSON.parse(JSON.stringify(body?.layout))
        validateBattleFormationLayout(nextLayout)
        const validateOnly = new URL(req.url, 'http://local').searchParams.get('validateOnly') === '1'
        if (validateOnly) return sendJson(res, 200, nextLayout)
        const tempPath = `${battleFormationLayoutPath}.${process.pid}.tmp`
        await fs.copyFile(battleFormationLayoutPath, battleFormationLayoutBackupPath)
        await fs.writeFile(tempPath, `${JSON.stringify(nextLayout, null, 2)}\n`, 'utf8')
        await fs.rename(tempPath, battleFormationLayoutPath)
        return sendJson(res, 200, nextLayout)
      } catch (error) {
        console.error('[battle-formation-layout]', error)
        return sendJson(res, 400, { error: error.message || 'battleFormationLayout.jsonの保存に失敗しました' })
      }
    })

    server.middlewares.use('/api/local/battle-formation-units', async (req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'PUT') return next()
      try {
        const placements = JSON.parse(await fs.readFile(battleFormationUnitsPath, 'utf8'))
        if (req.method === 'GET') return sendJson(res, 200, placements)
        const body = JSON.parse(await readBody(req))
        const nextPlacements = JSON.parse(JSON.stringify(body?.placements))
        validateBattleFormationUnits(nextPlacements)
        const validateOnly = new URL(req.url, 'http://local').searchParams.get('validateOnly') === '1'
        if (validateOnly) return sendJson(res, 200, nextPlacements)
        const tempPath = `${battleFormationUnitsPath}.${process.pid}.tmp`
        await fs.copyFile(battleFormationUnitsPath, battleFormationUnitsBackupPath)
        await fs.writeFile(tempPath, `${JSON.stringify(nextPlacements, null, 2)}\n`, 'utf8')
        await fs.rename(tempPath, battleFormationUnitsPath)
        return sendJson(res, 200, nextPlacements)
      } catch (error) {
        console.error('[battle-formation-units]', error)
        return sendJson(res, 400, { error: error.message || 'battleFormationUnits.jsonの保存に失敗しました' })
      }
    })

    server.middlewares.use('/api/local/area-master', async (req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'PUT') return next()

      try {
        const source = await fs.readFile(masterPath, 'utf8')
        const master = JSON.parse(source)

        if (req.method === 'GET') {
          return sendJson(res, 200, master)
        }

        const body = JSON.parse(await readBody(req))
        const area = body?.area
        const index = master.areas.findIndex(candidate => candidate.id === area?.id)
        if (index < 0) return sendJson(res, 404, { error: '保存対象のエリアIDが見つかりません' })

        const nextMaster = JSON.parse(JSON.stringify(master))
        nextMaster.areas[index] = JSON.parse(JSON.stringify(area))
        nextMaster.areas[index].id = master.areas[index].id

        const flagMaster = JSON.parse(await fs.readFile(flagsPath, 'utf8'))
        const terrainTypeMaster = JSON.parse(await fs.readFile(terrainTypesPath, 'utf8'))
        validateMaster(
          nextMaster,
          new Set(flagMaster.flags.map(flag => flag.id)),
          new Set(terrainTypeMaster.terrainTypes.map(terrain => terrain.id))
        )

        const tempPath = `${masterPath}.${process.pid}.tmp`
        await fs.copyFile(masterPath, backupPath)
        await fs.writeFile(tempPath, `${JSON.stringify(nextMaster, null, 2)}\n`, 'utf8')
        suppressNextLocalSaveReload(masterPath)
        await fs.rename(tempPath, masterPath)
        return sendJson(res, 200, nextMaster)
      } catch (error) {
        console.error('[area-master]', error)
        return sendJson(res, 400, { error: error.message || 'areaMaster.jsonの保存に失敗しました' })
      }
    })

    server.middlewares.use('/api/local/area-map-draft', async (req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'PUT') return next()

      try {
        const drafts = JSON.parse(await fs.readFile(mapDraftsPath, 'utf8'))
        if (req.method === 'GET') return sendJson(res, 200, drafts)

        const body = JSON.parse(await readBody(req))
        const areaId = body?.areaId
        if (!drafts.maps?.[areaId]) {
          return sendJson(res, 404, { error: '保存対象のマップIDが見つかりません' })
        }

        const master = JSON.parse(await fs.readFile(masterPath, 'utf8'))
        const area = master.areas.find(candidate => candidate.id === areaId)
        if (!area) return sendJson(res, 404, { error: '対応するエリアIDが見つかりません' })

        const catalog = JSON.parse(await fs.readFile(assetCatalogPath, 'utf8'))
        const characterLibrary = JSON.parse(await fs.readFile(characterLibraryPath, 'utf8'))
        const dialogueSettings = JSON.parse(await fs.readFile(dialogueSettingsPath, 'utf8'))
        validateCharacterLibrary(characterLibrary, dialogueSettings)
        const mapDraft = JSON.parse(JSON.stringify(body?.mapDraft))
        const mapPartLibrary = JSON.parse(await fs.readFile(mapPartLibraryPath, 'utf8'))
        validateMapDraft(area, mapDraft, catalog, characterLibrary, mapPartLibrary)

        const nextDrafts = JSON.parse(JSON.stringify(drafts))
        nextDrafts.maps[areaId] = mapDraft
        const tempPath = `${mapDraftsPath}.${process.pid}.tmp`
        await fs.copyFile(mapDraftsPath, mapDraftsBackupPath)
        await fs.writeFile(tempPath, `${JSON.stringify(nextDrafts, null, 2)}\n`, 'utf8')
        suppressNextLocalSaveReload(mapDraftsPath)
        await fs.rename(tempPath, mapDraftsPath)
        return sendJson(res, 200, nextDrafts)
      } catch (error) {
        console.error('[area-map-draft]', error)
        return sendJson(res, 400, { error: error.message || 'areaMapDrafts.jsonの保存に失敗しました' })
      }
    })

    server.middlewares.use('/api/local/map-part-library', async (req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'PUT') return next()
      try {
        const library = JSON.parse(await fs.readFile(mapPartLibraryPath, 'utf8'))
        if (req.method === 'GET') return sendJson(res, 200, library)
        const body = JSON.parse(await readBody(req))
        const nextLibrary = JSON.parse(JSON.stringify(body?.library))
        validateMapPartLibrary(nextLibrary)
        const tempPath = `${mapPartLibraryPath}.${process.pid}.tmp`
        await fs.copyFile(mapPartLibraryPath, mapPartLibraryBackupPath)
        await fs.writeFile(tempPath, `${JSON.stringify(nextLibrary, null, 2)}\n`, 'utf8')
        suppressNextLocalSaveReload(mapPartLibraryPath)
        await fs.rename(tempPath, mapPartLibraryPath)
        return sendJson(res, 200, nextLibrary)
      } catch (error) {
        console.error('[map-part-library]', error)
        return sendJson(res, 400, { error: error.message || 'mapPartLibrary.jsonの保存に失敗しました' })
      }
    })

    server.middlewares.use('/api/local/area-state', async (req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'PUT') return next()

      try {
        const states = JSON.parse(await fs.readFile(areaStatesPath, 'utf8'))
        if (req.method === 'GET') return sendJson(res, 200, states)

        const body = JSON.parse(await readBody(req))
        const areaId = body?.areaId
        if (!states.areaStates?.[areaId]) {
          return sendJson(res, 404, { error: '保存対象のエリア状態IDが見つかりません' })
        }
        const areaState = JSON.parse(JSON.stringify(body?.areaState))
        validateAreaState(areaId, areaState)

        const nextStates = JSON.parse(JSON.stringify(states))
        nextStates.areaStates[areaId] = areaState
        const tempPath = `${areaStatesPath}.${process.pid}.tmp`
        await fs.copyFile(areaStatesPath, areaStatesBackupPath)
        await fs.writeFile(tempPath, `${JSON.stringify(nextStates, null, 2)}\n`, 'utf8')
        suppressNextLocalSaveReload(areaStatesPath)
        await fs.rename(tempPath, areaStatesPath)
        return sendJson(res, 200, nextStates)
      } catch (error) {
        console.error('[area-state]', error)
        return sendJson(res, 400, { error: error.message || 'areaStateDefaults.jsonの保存に失敗しました' })
      }
    })

    server.middlewares.use('/api/local/area-bundle', async (req, res, next) => {
      if (req.method !== 'POST') return next()

      try {
        const body = JSON.parse(await readBody(req))
        const area = JSON.parse(JSON.stringify(body?.area))
        const mapDraft = JSON.parse(JSON.stringify(body?.mapDraft))
        const areaState = JSON.parse(JSON.stringify(body?.areaState))
        const master = JSON.parse(await fs.readFile(masterPath, 'utf8'))
        const drafts = JSON.parse(await fs.readFile(mapDraftsPath, 'utf8'))
        const states = JSON.parse(await fs.readFile(areaStatesPath, 'utf8'))

        if (!area?.id || master.areas.some(candidate => candidate.id === area.id)) {
          return sendJson(res, 409, { error: 'エリアIDが未設定か、すでに存在します' })
        }
        const district = master.districts.find(candidate => candidate.id === area.districtId)
        if (!district) return sendJson(res, 400, { error: '追加先の地区が存在しません' })

        const nextMaster = JSON.parse(JSON.stringify(master))
        nextMaster.areas.push(area)
        nextMaster.districts.find(candidate => candidate.id === area.districtId).areaIds.push(area.id)
        const flagMaster = JSON.parse(await fs.readFile(flagsPath, 'utf8'))
        const terrainTypeMaster = JSON.parse(await fs.readFile(terrainTypesPath, 'utf8'))
        validateMaster(
          nextMaster,
          new Set(flagMaster.flags.map(flag => flag.id)),
          new Set(terrainTypeMaster.terrainTypes.map(terrain => terrain.id))
        )
        const catalog = JSON.parse(await fs.readFile(assetCatalogPath, 'utf8'))
        const characterLibrary = JSON.parse(await fs.readFile(characterLibraryPath, 'utf8'))
        const dialogueSettings = JSON.parse(await fs.readFile(dialogueSettingsPath, 'utf8'))
        validateCharacterLibrary(characterLibrary, dialogueSettings)
        const mapPartLibrary = JSON.parse(await fs.readFile(mapPartLibraryPath, 'utf8'))
        validateMapDraft(area, mapDraft, catalog, characterLibrary, mapPartLibrary)
        validateAreaState(area.id, areaState)

        const nextDrafts = JSON.parse(JSON.stringify(drafts))
        nextDrafts.maps[area.id] = mapDraft
        const nextStates = JSON.parse(JSON.stringify(states))
        nextStates.areaStates[area.id] = areaState

        const masterTemp = `${masterPath}.${process.pid}.tmp`
        const draftsTemp = `${mapDraftsPath}.${process.pid}.tmp`
        const statesTemp = `${areaStatesPath}.${process.pid}.tmp`
        await Promise.all([
          fs.writeFile(masterTemp, `${JSON.stringify(nextMaster, null, 2)}\n`, 'utf8'),
          fs.writeFile(draftsTemp, `${JSON.stringify(nextDrafts, null, 2)}\n`, 'utf8'),
          fs.writeFile(statesTemp, `${JSON.stringify(nextStates, null, 2)}\n`, 'utf8'),
          fs.copyFile(masterPath, backupPath),
          fs.copyFile(mapDraftsPath, mapDraftsBackupPath),
          fs.copyFile(areaStatesPath, areaStatesBackupPath)
        ])
        suppressNextLocalSaveReload(masterPath)
        suppressNextLocalSaveReload(mapDraftsPath)
        suppressNextLocalSaveReload(areaStatesPath)
        await fs.rename(masterTemp, masterPath)
        await fs.rename(draftsTemp, mapDraftsPath)
        await fs.rename(statesTemp, areaStatesPath)
        return sendJson(res, 201, { master: nextMaster, drafts: nextDrafts, states: nextStates })
      } catch (error) {
        console.error('[area-bundle]', error)
        return sendJson(res, 400, { error: error.message || '新しいエリアの作成に失敗しました' })
      }
    })
    }
  }
}
