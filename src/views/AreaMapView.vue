<template>
  <main class="map-screen" :class="[mapThemeClass, terrainClass]">
    <header class="map-header">
      <button type="button" class="back-button" @click="backToSettings">‹</button>
      <div>
        <p>SIDE-SCROLL AREA / MAP DRAFT</p>
        <h1>{{ area?.name || 'MAP NOT FOUND' }}</h1>
      </div>
      <div class="header-meta">
        <span>{{ area?.width?.toLocaleString() || 0 }} px</span>
        <code>{{ area?.id }}</code>
      </div>
    </header>

    <section v-if="area && mapDraft" class="map-body">
      <div class="map-toolbar">
        <span>{{ mapThemeLabel }} / MAP CHIP: PLACEHOLDER</span>
        <p>← → / A D で移動・Spaceでジャンプ・{{ playerPresentation.flightEnabled ? '飛行ON: ↑ ↓ / W Sで上下移動' : '梯子/EV付近で ↑ ↓ / W S' }}・Eで入口・Fで話す</p>
        <label class="runtime-character-selector">
          <span>TEST CHARACTER</span>
          <select v-model="runtimePlayerCharacterId" aria-label="テスト用プレイヤーキャラクター">
            <option v-for="character in playerCharacters" :key="character.id" :value="character.id">
              {{ character.name }} / {{ character.id }}
            </option>
          </select>
        </label>
        <label class="runtime-zoom-selector">
          <span>表示倍率</span>
          <select v-model.number="mapZoom" aria-label="マップ表示倍率">
            <option v-for="option in mapZoomOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>
        <div v-if="isFollowerLoadTestArea" class="follower-load-tools" aria-label="追従キャラ負荷テスト">
          <div class="load-meter" :class="{ warning: performanceFps < 50, critical: performanceFps < 30 }" aria-live="polite">
            <strong>{{ performanceFps }} FPS</strong>
            <span>{{ performanceFrameMs.toFixed(1) }} ms</span>
            <span>追従 {{ runtimeFollowers.length }}</span>
            <span>ボーン {{ activeBonePlayerCount }}</span>
            <span v-if="performanceHeapMb">{{ performanceHeapMb }} MB</span>
          </div>
          <button type="button" class="follower-add-button" title="追従キャラを追加" aria-label="追従キャラを追加" @click="followerPickerOpen = true">＋</button>
          <button v-if="runtimeFollowers.length" type="button" class="follower-clear-button" @click="clearFollowers">全削除</button>
        </div>
      </div>

      <div
        ref="viewport"
        class="map-viewport"
        tabindex="0"
        aria-label="横スクロール探索マップ"
        @scroll="updateCameraState"
      >
        <div
          class="map-world-zoom"
          :style="{ width: `${virtualWorldWidth * mapZoom}px`, height: `${worldRenderHeight * mapZoom}px` }"
        >
          <div
            class="map-world"
            :style="{
              width: `${virtualWorldWidth}px`,
              height: `${worldRenderHeight}px`,
              transform: `scale(${mapZoom})`,
              '--ground-top': `${mapY(mapDraft.groundY)}px`
            }"
            @click="focusViewport"
          >
          <div
            v-for="copy in worldCopies"
            :key="copy.key"
            class="world-segment"
            :style="{ left: `${copy.offset}px`, width: `${area.width}px` }"
          >
            <div class="map-base-gradient" :style="backgroundGradientStyle(mapDraft.backgroundGradient)"></div>
            <div
              v-for="(layer, index) in mapDraft.backgroundImages"
              :key="`${copy.key}-background-${layer.id}`"
              class="map-background-image"
              :data-background-layer-id="layer.id"
              :style="backgroundImageLayerStyle(layer, index)"
            ></div>
            <div
              v-for="effectId in mapDraft.environmentEffects"
              :key="`${copy.key}-effect-${effectId}`"
              class="environment-effect"
              :class="`effect-${effectId}`"
            ></div>
            <div class="scan-layer"></div>

            <div
              v-for="part in mapDraft.mapParts"
              :key="`${copy.key}-part-${part.id}`"
              class="map-part"
              :class="[`render-${part.renderLayer}`, { collision: part.collision }]"
              :data-part-id="part.partId"
              :style="runtimeMapPartStyle(part)"
              :title="`${mapPartById(part.partId)?.name || part.partId} / ${part.renderLayer}`"
            ></div>

            <template v-for="layer in mapDraft.tileLayers" :key="`${copy.key}-tiles-${layer.id}`">
              <div
                v-for="tile in layer.visible ? layer.tiles : []"
                :key="`${copy.key}-${layer.id}-${tile.id}`"
                class="map-tile"
                :class="{ collision: tile.collision }"
                :data-asset-id="tile.assetId"
                :style="tileStyle(tile, layer)"
                :title="`${tile.assetId} / ${tile.id}`"
              ></div>
            </template>
            <div
              v-for="zone in mapDraft.collisionZones"
              :key="`${copy.key}-collision-${zone.id}`"
              class="collision-zone"
              :class="`collision-${zone.collisionType}`"
              :style="collisionStyle(zone)"
              :title="`${zone.id} / ${zone.collisionType}`"
            ></div>

            <div
              v-for="platform in mapDraft.platforms"
              :key="`${copy.key}-platform-${platform.id}`"
              class="platform"
              :style="{
                left: `${platform.x}px`,
                top: `${mapY(platform.y)}px`,
                width: `${platform.width}px`
              }"
            >
              <code>{{ platform.id }}</code>
            </div>

            <button
              v-for="(exit, index) in visibleExits"
              :key="`${copy.key}-exit-${exit.id}`"
              type="button"
              class="map-marker exit-marker"
              :class="[
                `${exit.connectionType || 'exit'}-marker`,
                {
                  nearby: nearbyEntrance?.id === exit.id,
                  'edge-left': exit.connectionType === 'edge' && exit.edge === 'left',
                  'edge-right': exit.connectionType === 'edge' && exit.edge === 'right'
                }
              ]"
              :style="markerStyle(exitPosition(index, exit), mapDraft.groundY - 280)"
              @click.stop="travel(exit)"
            >
              <em class="destination-sign">移動先：{{ destinationName(exit) }}</em>
              <span>{{ connectionLabel(exit) }}</span>
              <strong>{{ exit.label }}</strong>
              <code>{{ exit.destinationArea }}</code>
            </button>

            <div
              v-for="spawn in visibleSpawns"
              :key="`${copy.key}-spawn-${spawn.id}`"
              class="map-marker spawn-marker"
              :class="{ default: spawn.id === area.defaultSpawn }"
              :style="markerStyle(spawn.x, mapDraft.groundY - 150)"
            >
              <span>SPAWN</span>
              <strong>{{ spawn.label }}</strong>
              <code>X {{ spawn.x }}</code>
            </div>

            <div
              v-for="eventPoint in mapDraft.eventPoints"
              :key="`${copy.key}-event-${eventPoint.id}`"
              class="map-marker event-marker"
              :style="markerStyle(eventPoint.x, mapDraft.groundY - 240)"
            >
              <span>EVENT</span>
              <strong>{{ eventPoint.label }}</strong>
              <code>{{ eventPoint.id }}</code>
            </div>

            <div
              v-for="placement in visiblePlacements"
              :key="`${copy.key}-placement-${placement.id}`"
              class="map-placement"
              :class="`placement-${placement.type}`"
              :data-asset-id="placement.assetId"
              :data-character-id="placement.characterId || ''"
              :style="placementStyle(placement)"
              :title="`${placement.label} / ${placement.assetId}`"
            >
              <span>{{ placementTypeShort(placement.type) }}</span>
              <strong>{{ placement.label }}</strong>
            </div>

            <div
              class="ground"
              :style="{
                top: `${mapY(mapDraft.groundY)}px`,
                height: `${worldRenderHeight - mapY(mapDraft.groundY)}px`
              }"
            ></div>
            <div
              v-for="segment in mapDraft.terrainSegments.filter(terrainNeedsCutout)"
              :key="`${copy.key}-terrain-cutout-${segment.id}`"
              class="terrain-cutout"
              :style="terrainCutoutStyle(segment)"
            ></div>
            <div
              v-for="segment in mapDraft.terrainSegments"
              :key="`${copy.key}-terrain-${segment.id}`"
              class="terrain-segment"
              :class="`terrain-segment-${segment.type}`"
              :data-asset-id="segment.assetId"
              :style="terrainSegmentStyle(segment)"
              :title="`${segment.id} / ${segment.type}`"
            >
              <span v-if="['slope', 'stairs'].includes(segment.type)" class="terrain-up-sign">
                {{ segment.direction === 'left' ? '← UP' : 'UP →' }}
              </span>
            </div>
            <div
              v-for="transport in mapDraft.verticalTransports"
              :key="`${copy.key}-transport-${transport.id}`"
              class="vertical-transport"
              :class="[`vertical-transport-${transport.type}`, { nearby: nearbyVerticalTransport?.id === transport.id }]"
              :data-asset-id="transport.assetId"
              :style="verticalTransportStyle(transport)"
              :title="`${transport.id} / ${transport.type}`"
            >
              <span v-if="transport.type === 'ladder'"></span>
              <i
                v-else
                class="elevator-cab"
                :style="elevatorCabStyle(transport)"
              >EV</i>
            </div>
            <div
              v-for="exit in area.exits.filter(item => item.connectionType !== 'edge')"
              :key="`${copy.key}-depth-road-${exit.id}`"
              class="depth-road"
              :class="exit.depthDirection === 'front' ? 'front' : 'rear'"
              :style="{ left: `${exitPosition(0, exit)}px`, top: `${mapY(mapDraft.groundY) - 3}px` }"
            >
              <span>{{ exit.depthDirection === 'front' ? '手前側' : '奥側' }}</span>
            </div>

            <div
              v-if="!hasSeamlessLoop"
              class="world-ruler"
              :style="{ top: `${mapY(mapDraft.groundY) + 34}px` }"
            >
              <span
                v-for="tick in rulerTicks"
                :key="tick"
                :style="{ left: `${tick}px` }"
              >{{ tick }}</span>
            </div>
          </div>

          <div
            v-for="follower in followerActors"
            :key="follower.id"
            class="map-follower"
            :class="{
              moving: follower.animation === 'walk',
              jumping: follower.animation === 'jump',
              falling: follower.animation === 'fall',
              left: follower.facingDirection < 0 && follower.character.mirrorLeft !== false,
              'has-bone-motion': !!follower.motionId
            }"
            :style="follower.style"
            :data-follower-id="follower.id"
            :data-animation="follower.animation"
          >
            <BoneMotionPlayer
              v-if="follower.motionId"
              class="follower-bone-motion"
              :project-id="follower.character.motionProjectId"
              :animation-id="follower.motionId"
              :width="follower.presentation.displayWidth"
              :height="follower.presentation.displayHeight"
              :title="`${follower.character.name}・追従${follower.order}`"
            />
            <span v-else class="player-body"></span>
            <small>FOLLOW {{ follower.order }}</small>
          </div>

          <button
            type="button"
            class="player"
            :class="{
              moving: moveDirection !== 0 && !isJumping,
              jumping: airborneMode === 'jump',
              falling: airborneMode === 'fall',
              flying: playerPresentation.flightEnabled,
              left: facingDirection < 0 && playerCharacter.mirrorLeft !== false,
              highlighted: playerHighlighted,
              'has-bone-motion': !!playerBoneMotionId
            }"
            :style="playerStyle"
            :data-character-asset-id="playerPresentation.characterAssetId"
            :data-animation="playerAnimation"
            aria-label="プレイヤー"
            @pointerenter="playerHighlighted = true"
            @pointerleave="playerHighlighted = false"
            @focus="playerHighlighted = true"
            @blur="playerHighlighted = false"
            @click.stop="talk"
          >
            <span
              v-if="speechVisible"
              class="speech-bubble"
              :class="speechBubbleSide"
            >{{ currentSpeech }}</span>
            <BoneMotionPlayer v-if="playerBoneMotionId" class="map-bone-motion" :project-id="playerCharacter.motionProjectId" :animation-id="playerBoneMotionId" :width="playerPresentation.displayWidth" :height="playerPresentation.displayHeight" :title="`${playerCharacter.name}・${playerAnimation}モーション`" />
            <span v-else-if="!playerGraphicSource" class="player-core"></span>
            <span v-if="!playerBoneMotionId" class="player-body" :class="{ 'has-image': playerGraphicSource }" :style="playerGraphicStyle"></span>
            <small>PLAYER</small>
          </button>
        </div>
        </div>
      </div>

      <section class="map-lower">
        <header class="minimap-heading">
          <div>
            <span>AREA OVERVIEW</span>
            <strong>ミニマップ</strong>
          </div>
          <p>クリックで表示位置を移動</p>
        </header>

        <div class="minimap" @click="jumpCamera">
          <div class="minimap-route"></div>
          <span
            v-for="segment in mapDraft.minimap.segments"
            :key="`mini-segment-${segment.id}`"
            class="mini-segment"
            :style="minimapSegmentStyle(segment)"
            :title="segment.label"
          >{{ segment.label }}</span>
          <span
            v-for="spawn in visibleSpawns"
            :key="`mini-spawn-${spawn.id}`"
            class="mini-point spawn"
            :class="{ default: spawn.id === area.defaultSpawn }"
            :style="{ left: worldPercent(spawn.x) }"
            :title="spawn.label"
          ></span>
          <span
            v-for="(exit, index) in visibleExits"
            :key="`mini-exit-${exit.id}`"
            class="mini-point exit"
            :class="exit.connectionType || 'exit'"
            :style="{ left: worldPercent(exitPosition(index, exit)) }"
            :title="exit.label"
          ></span>
          <span
            v-for="eventPoint in mapDraft.minimap.showEvents ? mapDraft.eventPoints : []"
            :key="`mini-event-${eventPoint.id}`"
            class="mini-point event"
            :style="{ left: worldPercent(eventPoint.x) }"
            :title="eventPoint.label"
          ></span>
          <span
            v-for="placement in mapDraft.minimap.showPlacements ? visiblePlacements : []"
            :key="`mini-placement-${placement.id}`"
            class="mini-point placement"
            :class="`placement-${placement.type}`"
            :style="{ left: worldPercent(placement.x) }"
            :title="placement.label"
          ></span>
          <span class="mini-player" :style="{ left: worldPercent(playerX) }"></span>
          <span class="mini-viewport" :style="minimapViewportStyle"></span>
        </div>

        <div class="minimap-legend">
          <span><i class="player-dot"></i>プレイヤー</span>
          <span><i class="spawn-dot"></i>出現地点</span>
          <span><i class="exit-dot"></i>道路端</span>
          <span><i class="entrance-dot"></i>施設入口</span>
          <span><i class="junction-dot"></i>道路分岐</span>
          <span><i class="event-dot"></i>イベント</span>
          <span><i class="placement-dot"></i>配置物</span>
        </div>

        <div class="area-data-grid">
          <article><span>BGM</span><code>{{ area.bgm }}</code></article>
          <article><span>MAP SIZE</span><strong>{{ area.width.toLocaleString() }} px</strong></article>
          <article><span>AREA TYPE</span><strong>{{ areaKindLabel }}</strong></article>
          <article><span>UI THEME</span><strong>{{ mapThemeLabel }}</strong></article>
          <article><span>TERRAIN</span><strong>{{ terrainTypeLabel }}</strong></article>
          <article><span>CONNECTION</span><strong>{{ visibleExits.length }} 接続</strong></article>
          <article><span>EVENT POINT</span><strong>{{ mapDraft.eventPoints.length }} 地点</strong></article>
          <article><span>PLACEMENT</span><strong>{{ mapDraft.placements.length }} 配置</strong></article>
          <article><span>ENVIRONMENT</span><strong>{{ mapDraft.environmentEffects.length }} 演出</strong></article>
          <article class="wide"><span>BACKGROUND</span><code>{{ area.backgrounds.join(' / ') }}</code></article>
          <article class="wide"><span>ENEMY FORMATION</span><code>{{ area.enemyFormations.join(' / ') || 'なし' }}</code></article>
        </div>
      </section>

      <footer class="map-hud">
        <div class="position-readout">
          <span>POSITION</span>
          <strong>X {{ Math.round(playerX) }} / Y {{ Math.round(playerY) }}</strong>
          <small>SPAWN: {{ activeSpawnId }}</small>
        </div>
        <div class="touch-controls">
          <button
            type="button"
            aria-label="上へ移動"
            @pointerdown="setTouchVerticalDirection(-1)"
            @pointerup="setTouchVerticalDirection(0)"
            @pointerleave="setTouchVerticalDirection(0)"
            @pointercancel="setTouchVerticalDirection(0)"
          >↑</button>
          <button
            type="button"
            aria-label="左へ移動"
            @pointerdown="setTouchDirection(-1)"
            @pointerup="setTouchDirection(0)"
            @pointerleave="setTouchDirection(0)"
            @pointercancel="setTouchDirection(0)"
          >←</button>
          <button
            type="button"
            aria-label="右へ移動"
            @pointerdown="setTouchDirection(1)"
            @pointerup="setTouchDirection(0)"
            @pointerleave="setTouchDirection(0)"
            @pointercancel="setTouchDirection(0)"
          >→</button>
          <button
            type="button"
            aria-label="下へ移動"
            @pointerdown="setTouchVerticalDirection(1)"
            @pointerup="setTouchVerticalDirection(0)"
            @pointerleave="setTouchVerticalDirection(0)"
            @pointercancel="setTouchVerticalDirection(0)"
          >↓</button>
          <button
            type="button"
            class="interact-button"
            :disabled="!nearbyEntrance"
            aria-label="入口を使用"
            @click="enterNearby"
          >E</button>
          <button
            type="button"
            class="jump-button"
            :disabled="isJumping || playerPresentation.flightEnabled"
            aria-label="ジャンプ"
            @click="startJump"
          >跳</button>
          <button
            type="button"
            class="talk-button"
            aria-label="話す"
            @click="talk"
          >話</button>
        </div>
        <div class="scene-readout">
          <span>SCENE</span>
          <code>{{ area.scene }}</code>
          <small>{{ area.map }}</small>
        </div>
      </footer>

      <dialog v-if="isFollowerLoadTestArea && followerPickerOpen" class="follower-picker" open @click.self="followerPickerOpen = false">
        <div class="follower-picker-panel">
          <header>
            <div><span>LOAD TEST</span><strong>追加キャラを選択</strong></div>
            <button type="button" aria-label="閉じる" @click="followerPickerOpen = false">×</button>
          </header>
          <div class="follower-character-list">
            <button
              v-for="character in playerCharacters"
              :key="character.id"
              type="button"
              @click="addFollower(character.id)"
            >
              <strong>{{ character.name }}</strong>
              <code>{{ character.id }}</code>
              <small>{{ character.motionProjectId ? 'ボーンモーション' : '画像／仮表示' }}</small>
            </button>
          </div>
          <p>追加上限なし。追加順に0.35秒ずつ遅れて操作キャラをトレースします。</p>
        </div>
      </dialog>
    </section>

    <section v-else class="map-error">
      <h2>マップデータを読み込めませんでした</h2>
      <button type="button" @click="router.push('/area-exploration')">エリア選択へ戻る</button>
    </section>
  </main>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BoneMotionPlayer from '@/components/motion/BoneMotionPlayer.vue'
import areaMapDrafts from '@/data/exploration/areaMapDrafts.json'
import areaStateDefaults from '@/data/exploration/areaStateDefaults.json'
import characterLibrary from '@/data/exploration/characterLibrary.json'
import bundledMapPartLibrary from '@/data/exploration/mapPartLibrary.json'
import { backgroundGradientStyle, croppedMapPartStyle, mapAssetSource } from '@/utils/explorationMapAssets.js'
import { spriteSheetFrameOrder, spriteSheetFrameStyle, spriteSheetSourceFrame } from '@/utils/spriteSheet.js'
import eventFlagMaster from '@/data/exploration/eventFlags.json'
import {
  areas as bundledAreas,
  getTerrainTypeById
} from '@/data/exploration/areaRepository.js'

const route = useRoute()
const router = useRouter()
const viewport = ref(null)
const area = ref(null)
const allAreas = ref([])
const mapDraft = ref(null)
const areaState = ref(null)
const playerX = ref(0)
const playerY = ref(0)
const jumpVelocity = ref(0)
const isJumping = ref(false)
const airborneMode = ref('')
const activeSurfaceId = ref('base_ground')
const activeTransportId = ref('')
const activeSpawnId = ref('')
const speechIndex = ref(0)
const speechVisible = ref(true)
const touchDirection = ref(0)
const keyboardDirection = ref(0)
const touchVerticalDirection = ref(0)
const keyboardVerticalDirection = ref(0)
const viewportHeight = ref(720)
const mapZoom = ref(1.5)
const mapZoomOptions = [
  { value: 1, label: '100%' },
  { value: 1.25, label: '125%' },
  { value: 1.5, label: '150%' },
  { value: 2, label: '200%' }
]
const cameraScroll = ref(0)
const cameraViewportWidth = ref(0)
const traveling = ref(false)
const seamlessLoopWraps = ref(0)
const lastLoopDirection = ref(null)
const facingDirection = ref(1)
const playerSpriteFrame = ref(0)
const runtimePlayerCharacterId = ref('')
const playerHighlighted = ref(false)
const runtimeFollowers = ref([])
const followerStates = ref([])
const followerPickerOpen = ref(false)
const performanceFps = ref(60)
const performanceFrameMs = ref(16.7)
const performanceHeapMb = ref(0)
const pressedKeys = new Set()
let frameId = 0
let previousTime = 0
let viewportObserver = null
let playerSpriteClock = 0
let playerSpriteKey = ''
let playerTraceClock = 0
let playerTrace = []
let followerSerial = 0
let performanceWindowStartedAt = 0
let performanceWindowFrames = 0
let performanceWindowDuration = 0

const moveDirection = computed(() => {
  if (touchDirection.value) return touchDirection.value
  return keyboardDirection.value
})
watch(moveDirection, direction => {
  if (direction) facingDirection.value = direction
})
const verticalDirection = computed(() => {
  if (touchVerticalDirection.value) return touchVerticalDirection.value
  return keyboardVerticalDirection.value
})
const mapUiTheme = computed(() => (
  area.value?.mapUiTheme === 'fantasy' ? 'fantasy' : 'electronic_sf'
))
const mapThemeClass = computed(() => `theme-${mapUiTheme.value.replace('_', '-')}`)
const terrainClass = computed(() => `terrain-${area.value?.terrainType ?? 'artificial'}`)
const isFollowerLoadTestArea = computed(() => area.value?.id === 'middle_terminal_concourse')
const mapThemeLabel = computed(() => (
  mapUiTheme.value === 'fantasy' ? 'FANTASY' : 'ELECTRONIC SF'
))
const terrainTypeLabel = computed(() => (
  getTerrainTypeById(area.value?.terrainType ?? 'artificial')?.name ?? '未設定'
))
const areaKindLabel = computed(() => ({
  route: '道路・通路',
  facility: '施設内部',
  field: '屋外フィールド'
}[area.value?.areaKind] ?? area.value?.areaKind ?? '未設定'))
const defaultEventFlags = Object.fromEntries(eventFlagMaster.flags.map(flag => [flag.id, flag.defaultValue]))
const placementStateArray = placement => ({
  enemy: 'defeatedEnemies', boss: 'defeatedEnemies', treasure: 'collectedItems',
  gathering: 'collectedItems', npc: 'rescuedNpcs', save_point: 'repairedFacilities',
  event: 'repairedFacilities', hazard: 'repairedFacilities', landmark: 'repairedFacilities'
}[placement.type] ?? 'repairedFacilities')
const visiblePlacements = computed(() => mapDraft.value?.placements.filter(placement => {
  const flagsSatisfied = (placement.requiredEventFlags ?? []).every(flag => defaultEventFlags[flag] === true)
  const stateKey = placement.stateKey || placement.id
  const stateApplied = areaState.value?.[placementStateArray(placement)]?.includes(stateKey)
  return flagsSatisfied && !stateApplied
}) ?? [])
const playerPresentationDefaults = {
  characterId: 'placeholder_player',
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
const rawPlayerPresentation = computed(() => ({
  ...playerPresentationDefaults,
  ...(mapDraft.value?.playerPresentation ?? {})
}))
const playerCharacters = computed(() => characterLibrary.characters.filter(character => character.kind === 'player'))
const playerCharacter = computed(() => {
  const characterId = runtimePlayerCharacterId.value
    || rawPlayerPresentation.value.characterId
    || rawPlayerPresentation.value.characterAssetId
  return playerCharacters.value.find(character => character.id === characterId)
    ?? playerCharacters.value[0]
    ?? { animations: {} }
})
const playerPresentation = computed(() => ({
  ...playerPresentationDefaults,
  ...rawPlayerPresentation.value,
  ...playerCharacter.value,
  characterId: playerCharacter.value.id ?? rawPlayerPresentation.value.characterId,
  characterAssetId: playerCharacter.value.id ?? rawPlayerPresentation.value.characterAssetId
}))
const playerMovementAnimation = computed(() => {
  if (airborneMode.value === 'fall') return 'fall'
  if (isJumping.value) return 'jump'
  return moveDirection.value ? 'walk' : 'idle'
})
const playerAnimation = computed(() => speechVisible.value ? 'talk' : playerMovementAnimation.value)
const motionIdForCharacter = (character, animation) => {
  if (!character?.motionProjectId) return ''
  const states = character.motionStates ?? {}
  const fallbackOrder = {
    talk: ['talk', 'idle'],
    fall: ['fall', 'jump', 'idle'],
    jump: ['jump', 'walk', 'idle'],
    walk: ['walk', 'idle'],
    idle: ['idle']
  }[animation] ?? ['idle']
  return fallbackOrder.map(state => states[state]).find(Boolean) || ''
}
const playerBoneMotionId = computed(() => {
  return motionIdForCharacter(playerCharacter.value, playerAnimation.value)
})
const playerAnimationDefinition = computed(() => {
  const animations = playerCharacter.value?.animations ?? {}
  const fallbackOrder = {
    talk: ['talk', 'idle'],
    fall: ['fall', 'jump', 'idle'],
    jump: ['jump', 'walk', 'idle'],
    walk: ['walk', 'idle'],
    idle: ['idle']
  }[playerAnimation.value] ?? ['idle']
  return fallbackOrder.map(state => animations[state]).find(animation => animation?.imageSource)
    ?? fallbackOrder.map(state => animations[state]).find(Boolean)
    ?? { imageSource: '', frames: 1, fps: 1 }
})
const playerGraphicSource = computed(() => playerAnimationDefinition.value.imageSource || '')
const playerGraphicStyle = computed(() => {
  const animation = playerAnimationDefinition.value
  const fps = Math.max(1, Number(animation.fps) || 1)
  if (!playerGraphicSource.value) return {}
  return spriteSheetFrameStyle(animation, playerSpriteFrame.value)
})
const segmentSurfaceAt = (segment, x) => {
  const ratio = Math.max(0, Math.min(1, (x - segment.x) / Math.max(1, segment.width)))
  return segment.startY + (segment.endY - segment.startY) * ratio
}
const matchingTerrainAt = x => [...(mapDraft.value?.terrainSegments ?? [])].reverse().filter(segment => (
  x >= segment.x && x <= segment.x + segment.width
))
const matchingWalkSurfacesAt = x => [
  ...matchingTerrainAt(x).map(segment => ({
    id: segment.id,
    kind: 'terrain',
    y: segmentSurfaceAt(segment, x)
  })),
  ...(mapDraft.value?.platforms ?? [])
    .filter(platform => platform.walkable !== false && x >= platform.x && x <= platform.x + platform.width)
    .map(platform => ({
      id: `platform:${platform.id}`,
      kind: 'platform',
      y: platform.y
    }))
]
const walkSurfaceAtSpawn = x => (
  matchingWalkSurfacesAt(x).sort((first, second) => first.y - second.y)[0]
  ?? { id: 'base_ground', kind: 'base', y: mapDraft.value?.groundY ?? 0 }
)
const nearbyVerticalTransport = computed(() => {
  const candidates = mapDraft.value?.verticalTransports.filter(transport => {
    const centerX = transport.x + transport.width / 2
    const top = Math.min(transport.topY, transport.bottomY)
    const bottom = Math.max(transport.topY, transport.bottomY)
    return Math.abs(playerX.value - centerX) <= Math.max(54, transport.width)
      && playerY.value >= top - 36 && playerY.value <= bottom + 36
  }) ?? []
  return candidates.sort((first, second) => (
    Math.abs(playerX.value - (first.x + first.width / 2))
    - Math.abs(playerX.value - (second.x + second.width / 2))
  ))[0] ?? null
})
const playerStyle = computed(() => ({
  left: `${renderPlayerX.value + (playerPresentation.value.footOffsetX ?? 0)}px`,
  top: `${mapY(playerY.value) - playerPresentation.value.displayHeight
    + (playerPresentation.value.footOffsetY ?? 0)}px`,
  width: `${playerPresentation.value.displayWidth}px`,
  height: `${playerPresentation.value.displayHeight}px`
}))
const followerConfigs = computed(() => runtimeFollowers.value)
const followerActors = computed(() => followerConfigs.value.map((config, index) => {
  const character = playerCharacters.value.find(candidate => candidate.id === config.characterId)
    ?? playerCharacter.value
  const presentation = {
    ...playerPresentationDefaults,
    ...character,
    ...(config.presentation ?? {})
  }
  const state = followerStates.value[index] ?? {
    x: playerX.value,
    y: playerY.value,
    facingDirection: facingDirection.value,
    animation: 'idle'
  }
  const renderX = state.x + (hasSeamlessLoop.value ? area.value?.width ?? 0 : 0)
  return {
    id: config.id || `follower_${index + 1}`,
    order: index + 1,
    delayMs: Math.max(0, Number(config.delayMs) || 0),
    character,
    presentation,
    x: state.x,
    y: state.y,
    facingDirection: state.facingDirection,
    animation: state.animation,
    motionId: motionIdForCharacter(character, state.animation),
    style: {
      left: `${renderX + (presentation.footOffsetX ?? 0)}px`,
      top: `${mapY(state.y) - presentation.displayHeight + (presentation.footOffsetY ?? 0)}px`,
      width: `${presentation.displayWidth}px`,
      height: `${presentation.displayHeight}px`
    }
  }
}))
const activeBonePlayerCount = computed(() => (
  (playerBoneMotionId.value ? 1 : 0)
  + followerActors.value.filter(follower => follower.motionId).length
))
const traceSnapshot = () => ({
  time: playerTraceClock,
  x: playerX.value,
  y: playerY.value,
  facingDirection: facingDirection.value,
  animation: playerMovementAnimation.value
})
const resetPlayerTrace = () => {
  playerTraceClock = 0
  const initial = traceSnapshot()
  playerTrace = [{ ...initial, time: -1 }, initial]
  followerStates.value = followerConfigs.value.map(() => ({ ...initial }))
}
const traceStateAt = targetTime => {
  if (!playerTrace.length) return traceSnapshot()
  if (targetTime <= playerTrace[0].time) return playerTrace[0]
  let low = 0
  let high = playerTrace.length - 1
  while (low < high) {
    const middle = Math.ceil((low + high) / 2)
    if (playerTrace[middle].time <= targetTime) low = middle
    else high = middle - 1
  }
  const previous = playerTrace[low]
  const next = playerTrace[Math.min(low + 1, playerTrace.length - 1)]
  const span = Math.max(0.0001, next.time - previous.time)
  const ratio = Math.max(0, Math.min(1, (targetTime - previous.time) / span))
  return {
    x: previous.x + (next.x - previous.x) * ratio,
    y: previous.y + (next.y - previous.y) * ratio,
    facingDirection: previous.facingDirection,
    animation: previous.animation
  }
}
const updateFollowerTrace = seconds => {
  playerTraceClock += seconds
  playerTrace.push(traceSnapshot())
  const maxDelaySeconds = Math.max(1, ...followerConfigs.value.map(config => config.delayMs / 1000))
  const oldestNeeded = playerTraceClock - maxDelaySeconds - 1
  while (playerTrace.length > 2 && playerTrace[1].time < oldestNeeded) playerTrace.shift()
  followerStates.value = followerConfigs.value.map(config => (
    traceStateAt(playerTraceClock - config.delayMs / 1000)
  ))
}
const addFollower = characterId => {
  followerSerial += 1
  const config = {
    id: `runtime_follower_${followerSerial}`,
    characterId,
    delayMs: (runtimeFollowers.value.length + 1) * 350
  }
  runtimeFollowers.value.push(config)
  followerStates.value.push(traceStateAt(playerTraceClock - config.delayMs / 1000))
  followerPickerOpen.value = false
  focusViewport()
}
const clearFollowers = () => {
  runtimeFollowers.value = []
  followerStates.value = []
  playerTrace = [traceSnapshot()]
}

const rulerTicks = computed(() => {
  if (!area.value) return []
  const ticks = []
  for (let x = 0; x <= area.value.width; x += 400) ticks.push(x)
  return ticks
})
const speechLines = computed(() => {
  const lines = mapDraft.value?.speechLines
  return Array.isArray(lines) && lines.length
    ? lines
    : ['移動先を確認しよう。']
})
const currentSpeech = computed(() => speechLines.value[speechIndex.value % speechLines.value.length])
const hasSeamlessLoop = computed(() => area.value?.horizontalLoop === true)
const isSeamlessLoopEdge = exit => (
  hasSeamlessLoop.value && exit?.connectionType === 'edge'
)
const visibleExits = computed(() => area.value?.exits.filter(exit => !isSeamlessLoopEdge(exit)) ?? [])
const visibleSpawns = computed(() => {
  if (!area.value) return []
  const loopSpawnIds = new Set(
    area.value.exits.filter(isSeamlessLoopEdge).map(exit => exit.destinationSpawn)
  )
  if (hasSeamlessLoop.value) {
    loopSpawnIds.add('entry_left')
    loopSpawnIds.add('entry_right')
  }
  return area.value.spawns.filter(spawn => !loopSpawnIds.has(spawn.id))
})
const virtualWorldWidth = computed(() => (
  (area.value?.width ?? 0) * (hasSeamlessLoop.value ? 3 : 1)
))
// 表示倍率はキャラだけではなく、背景・地面・部品を含むワールド全体へ同じ倍率で掛ける。
// 高さを倍率で先に割り戻すと、キャラとの相対サイズだけが変わってしまう。
const worldRenderHeight = computed(() => viewportHeight.value)
const worldCopies = computed(() => {
  if (!area.value) return []
  return hasSeamlessLoop.value
    ? [
        { key: 'previous-loop', offset: 0 },
        { key: 'current-loop', offset: area.value.width },
        { key: 'next-loop', offset: area.value.width * 2 }
      ]
    : [{ key: 'current', offset: 0 }]
})
const renderPlayerX = computed(() => (
  playerX.value + (hasSeamlessLoop.value ? area.value?.width ?? 0 : 0)
))
const logicalCameraScroll = computed(() => {
  if (!hasSeamlessLoop.value || !area.value?.width) return cameraScroll.value
  const width = area.value.width
  return ((cameraScroll.value - width) % width + width) % width
})
const minimapViewportStyle = computed(() => {
  if (!area.value?.width) return { left: '0%', width: '100%' }
  return {
    left: `${logicalCameraScroll.value / area.value.width * 100}%`,
    width: `${Math.min(100, cameraViewportWidth.value / area.value.width * 100)}%`
  }
})
const speechBubbleSide = computed(() => {
  const screenX = renderPlayerX.value - cameraScroll.value
  if (screenX < 280) return 'speech-right'
  if (screenX > cameraViewportWidth.value - 280) return 'speech-left'
  return 'speech-center'
})
const horizontalDistance = (firstX, secondX) => {
  const directDistance = Math.abs(firstX - secondX)
  if (!hasSeamlessLoop.value || !area.value?.width) return directDistance
  return Math.min(directDistance, area.value.width - directDistance)
}
const nearbyEntrance = computed(() => {
  const candidates = area.value?.exits.filter(exit => (
    exit.connectionType !== 'edge'
    && horizontalDistance(exitPosition(0, exit), playerX.value) <= 135
  )) ?? []
  return candidates.sort((a, b) => (
    horizontalDistance(exitPosition(0, a), playerX.value)
    - horizontalDistance(exitPosition(0, b), playerX.value)
  ))[0] ?? null
})

const mapY = y => {
  if (!mapDraft.value?.height) return y
  return y * (worldRenderHeight.value / mapDraft.value.height)
}
const markerStyle = (x, y) => ({ left: `${x}px`, top: `${mapY(y)}px` })
const imageBackgroundStyle = item => item.imageSource ? {
  backgroundImage: `url("${item.imageSource.replaceAll('"', '\\"')}")`,
  backgroundSize: item.imageMode === 'repeat' ? 'auto' : item.imageMode,
  backgroundRepeat: item.imageMode === 'repeat' ? 'repeat' : 'no-repeat',
  backgroundPosition: 'center'
} : {}
const backgroundLayerY = layer => {
  if (layer.verticalAnchor === 'aboveGround') return Number(mapDraft.value?.groundY || 0) - Math.max(1, Number(layer.height || mapDraft.value?.height || 1))
  if (layer.verticalAnchor === 'belowGround') return Number(mapDraft.value?.groundY || 0)
  return Number(layer.y || 0)
}
const backgroundImageLayerStyle = (layer, index) => {
  const source = layer.imageAssetId ? mapAssetSource(layer.imageAssetId) : layer.imageSource
  if (!source || layer.visible === false) return { display: 'none' }
  return {
    zIndex: 10 + Math.min(index, 19),
    opacity: layer.opacity ?? 1,
    left: `${Number(layer.x || 0)}px`,
    top: `${mapY(backgroundLayerY(layer))}px`,
    right: 'auto',
    bottom: 'auto',
    width: `${Math.max(1, Number(layer.width || area.value?.width || 1))}px`,
    height: `${mapY(Math.max(1, Number(layer.height || mapDraft.value?.height || 1)))}px`,
    backgroundImage: `url("${source.replaceAll('"', '\\"')}")`,
    backgroundSize: layer.fit === 'stretch' ? '100% 100%' : layer.fit || 'cover',
    backgroundRepeat: layer.fit === 'repeat' ? 'repeat' : 'no-repeat',
    backgroundPosition: 'center'
  }
}
const runtimeMapPartLibrary = ref(bundledMapPartLibrary)
const mapPartById = partId => runtimeMapPartLibrary.value.parts.find(part => part.id === partId) ?? null
const clampZOrder = value => Math.max(-40, Math.min(40, Math.round(Number(value) || 0)))
const objectRenderZ = item => ({ background: 40, behindPlayer: 200, frontPlayer: 400, foreground: 500 }[item.renderLayer] ?? 200) + clampZOrder(item.zOrder)
const runtimeMapPartStyle = item => {
  const part = mapPartById(item.partId)
  const width = item.width || part?.sourceRect?.width || 64
  const height = mapY(item.height || part?.sourceRect?.height || 64)
  return {
    left: `${item.x}px`, top: `${mapY(item.y)}px`, width: `${width}px`, height: `${height}px`,
    zIndex: objectRenderZ(item),
    transform: `scale(${item.flipX ? -1 : 1},${item.flipY ? -1 : 1})`,
    ...croppedMapPartStyle(part, width, height)
  }
}
const tileStyle = (tile, layer) => ({
  left: `${tile.x}px`,
  top: `${mapY(tile.y)}px`,
  width: `${layer.tileSize}px`,
  height: `${mapY(layer.tileSize)}px`,
  ...imageBackgroundStyle(tile)
})
const npcCharacterFor = placement => characterLibrary.characters.find(character => (
  character.kind === 'npc' && character.id === placement.characterId
)) ?? null
const placementStyle = placement => {
  const character = placement.type === 'npc' ? npcCharacterFor(placement) : null
  const animation = character?.animations?.idle
  return {
    left: `${placement.x}px`,
    top: `${mapY(placement.y)}px`,
    width: `${character?.displayWidth ?? placement.width ?? 42}px`,
    height: `${mapY(character?.displayHeight ?? placement.height ?? 66)}px`,
    zIndex: objectRenderZ(placement),
    ...spriteSheetFrameStyle(animation, 0)
  }
}
const collisionStyle = zone => ({
  left: `${zone.x}px`,
  top: `${mapY(zone.y)}px`,
  width: `${zone.width}px`,
  height: `${mapY(zone.height)}px`
})
const terrainClipPath = (segment, top, height) => {
  const point = (x, y) => `${x}% ${Math.max(0, (mapY(y) - mapY(top)) / Math.max(1, height) * 100)}%`
  if (segment.type !== 'stairs') {
    return `polygon(${point(0, segment.startY)},${point(100, segment.endY)},100% 100%,0 100%)`
  }
  const steps = Math.max(2, Math.min(32, segment.steps || 8))
  const points = [point(0, segment.startY)]
  for (let index = 1; index <= steps; index += 1) {
    const previousY = segment.startY + (segment.endY - segment.startY) * ((index - 1) / steps)
    const nextY = segment.startY + (segment.endY - segment.startY) * (index / steps)
    const x = index / steps * 100
    points.push(point(x, previousY), point(x, nextY))
  }
  points.push('100% 100%', '0 100%')
  return `polygon(${points.join(',')})`
}
const terrainSegmentStyle = segment => {
  const top = Math.min(segment.startY, segment.endY)
  const height = Math.max(24, worldRenderHeight.value - mapY(top))
  return {
    left: `${segment.x}px`,
    top: `${mapY(top)}px`,
    width: `${segment.width}px`,
    height: `${height}px`,
    clipPath: terrainClipPath(segment, top, height),
    ...imageBackgroundStyle(segment)
  }
}
const terrainNeedsCutout = segment => (
  segment.startY > (mapDraft.value?.groundY ?? 0)
  || segment.endY > (mapDraft.value?.groundY ?? 0)
)
const terrainCutoutStyle = segment => {
  const ground = mapDraft.value?.groundY ?? 0
  const bottom = Math.max(ground, segment.startY, segment.endY)
  const height = Math.max(1, mapY(bottom) - mapY(ground))
  const start = Math.max(0, (mapY(segment.startY) - mapY(ground)) / height * 100)
  const end = Math.max(0, (mapY(segment.endY) - mapY(ground)) / height * 100)
  return {
    left: `${segment.x}px`,
    top: `${mapY(ground)}px`,
    width: `${segment.width}px`,
    height: `${height}px`,
    clipPath: `polygon(0 0,100% 0,100% ${end}%,0 ${start}%)`
  }
}
const verticalTransportStyle = transport => ({
  left: `${transport.x}px`,
  top: `${mapY(Math.min(transport.topY, transport.bottomY))}px`,
  width: `${transport.width}px`,
  height: `${mapY(Math.abs(transport.bottomY - transport.topY))}px`,
  ...imageBackgroundStyle(transport)
})
const elevatorCabStyle = transport => {
  const top = Math.min(transport.topY, transport.bottomY)
  const cabY = activeTransportId.value === transport.id
    ? Math.max(top, Math.min(Math.max(transport.topY, transport.bottomY), playerY.value))
    : transport.bottomY
  return { top: `${mapY(cabY - top) - 10}px` }
}
const placementTypeShort = type => ({
  npc: 'NPC',
  enemy: 'ENEMY',
  boss: 'BOSS',
  treasure: 'CHEST',
  gathering: 'GATHER',
  save_point: 'SAVE',
  event: 'EVENT',
  landmark: 'LANDMARK',
  hazard: 'HAZARD'
}[type] ?? type)
const worldPercent = x => `${Math.max(0, Math.min(100, x / (area.value?.width || 1) * 100))}%`
const minimapSegmentStyle = segment => ({
  left: worldPercent(segment.startX),
  width: `${Math.max(1, (segment.endX - segment.startX) / (area.value?.width || 1) * 100)}%`
})
const exitPosition = (index, targetExit = area.value?.exits[index]) => {
  if (!area.value) return 0
  if (Number.isFinite(targetExit?.x)) return targetExit.x
  if (area.value.exits.length === 1) return area.value.width - 130
  return index === 0 ? 100 : area.value.width - 130
}
const connectionLabel = exit => ({
  edge: exit.edge === 'left' ? '← AREA EDGE' : 'AREA EDGE →',
  entrance: area.value?.areaKind === 'facility' ? 'EXIT' : 'FACILITY',
  junction: exit.depthDirection === 'front' ? 'FRONT ROUTE' : 'REAR ROUTE',
  lift: 'LIFT'
}[exit.connectionType] ?? 'EXIT')
const destinationName = exit => (
  allAreas.value.find(candidate => candidate.id === exit.destinationArea)?.name
  ?? exit.destinationArea
)

const getLatestAreas = async () => {
  try {
    const response = await fetch('/api/local/area-master')
    if (!response.ok) throw new Error('source API unavailable')
    const payload = await response.json()
    return payload.areas
  } catch {
    return bundledAreas
  }
}

const getLatestMapDrafts = async () => {
  try {
    const response = await fetch('/api/local/area-map-draft')
    if (!response.ok) throw new Error('map draft API unavailable')
    return await response.json()
  } catch {
    return areaMapDrafts
  }
}

const getLatestMapPartLibrary = async () => {
  try {
    const response = await fetch('/api/local/map-part-library')
    if (!response.ok) throw new Error('map part API unavailable')
    return await response.json()
  } catch {
    return bundledMapPartLibrary
  }
}

const getLatestAreaStates = async () => {
  try {
    const response = await fetch('/api/local/area-state')
    if (!response.ok) throw new Error('area state API unavailable')
    return await response.json()
  } catch {
    return areaStateDefaults
  }
}

const normalizeMapDraft = (draft, targetArea) => {
  if (!draft) return null
  const normalized = JSON.parse(JSON.stringify(draft))
  const backgroundLayers = normalized.backgroundLayers ?? {}
  for (const [index, layer] of ['far', 'mid', 'foreground'].entries()) {
    backgroundLayers[layer] ||= {
      assetId: targetArea.backgrounds?.[index] ?? '',
      parallax: layer === 'far' ? 0.2 : layer === 'mid' ? 0.5 : 1.15,
      visible: true
    }
    backgroundLayers[layer].imageSource ||= ''
    backgroundLayers[layer].imageMode ||= 'cover'
  }
  normalized.backgroundLayers = backgroundLayers
  normalized.backgroundGradient ||= { top: '#102c38', right: '#173f4a', bottom: '#02080c', left: '#0a2029' }
  normalized.backgroundImages ||= []
  if (!normalized.backgroundImages.length) {
    const migrated = ['far', 'mid', 'foreground'].map((layer, index) => ({
      id: `background_${index + 1}`, imageAssetId: '', imageSource: backgroundLayers[layer]?.imageSource || '',
      fit: backgroundLayers[layer]?.imageMode || 'cover', opacity: 1,
      parallax: backgroundLayers[layer]?.parallax ?? (index + 1) * .35, visible: backgroundLayers[layer]?.visible !== false
    })).filter(layer => layer.imageSource)
    if (migrated.length) normalized.backgroundImages.push(...migrated)
    else if (targetArea.locationImage) normalized.backgroundImages.push({
      id: 'background_1', imageAssetId: targetArea.locationImage, imageSource: '', fit: 'cover', opacity: 1, parallax: .35, visible: true
    })
  }
  for (const layer of normalized.backgroundImages) {
    layer.x ??= 0
    layer.y ??= 0
    layer.width ??= targetArea.width
    layer.height ??= normalized.height
    layer.verticalAnchor ||= 'free'
  }
  normalized.environmentEffects ||= []
  normalized.tileLayers ||= []
  normalized.mapParts ||= []
  for (const part of normalized.mapParts) {
    part.renderLayer ||= 'behindPlayer'
    part.zOrder ??= 0
  }
  normalized.placements ||= []
  for (const placement of normalized.placements) {
    placement.renderLayer ||= 'behindPlayer'
    placement.zOrder ??= 0
  }
  normalized.collisionZones ||= []
  normalized.terrainSegments ||= []
  for (const segment of normalized.terrainSegments) {
    segment.type ||= 'flat'
    segment.width ||= 320
    segment.startY = Number.isFinite(segment.startY) ? segment.startY : (segment.y ?? normalized.groundY)
    segment.endY = Number.isFinite(segment.endY) ? segment.endY : segment.startY
    segment.y = Math.min(segment.startY, segment.endY)
    segment.steps ||= 8
    segment.baseY = Number.isFinite(segment.baseY) ? segment.baseY : Math.max(segment.startY, segment.endY)
    segment.rise = Number.isFinite(segment.rise) ? segment.rise : Math.max(16, Math.abs(segment.endY - segment.startY))
    segment.direction ||= segment.startY >= segment.endY ? 'right' : 'left'
    segment.autoWidth = segment.autoWidth !== false
    segment.grade ||= segment.type === 'stairs' ? 2 : 3
    segment.assetId ||= ''
    segment.imageSource ||= ''
    segment.imageMode ||= 'repeat'
  }
  normalized.verticalTransports ||= []
  for (const transport of normalized.verticalTransports) {
    transport.type ||= 'ladder'
    transport.width ||= transport.type === 'elevator' ? 96 : 48
    transport.topY = Number.isFinite(transport.topY) ? transport.topY : normalized.groundY - 240
    transport.bottomY = Number.isFinite(transport.bottomY) ? transport.bottomY : normalized.groundY
    transport.y = Math.min(transport.topY, transport.bottomY)
    transport.speed ||= transport.type === 'elevator' ? 170 : 220
    transport.assetId ||= ''
    transport.imageSource ||= ''
  }
  normalized.minimap ||= {
    mode: 'auto',
    fogOfWar: true,
    showPlacements: true,
    showEvents: true,
    regionNotes: '',
    segments: []
  }
  normalized.minimap.segments ||= []
  normalized.playerPresentation ||= {
    characterId: 'placeholder_player',
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
  normalized.playerPresentation.maxStepUp ??= 48
  normalized.playerPresentation.maxStepDown ??= 72
  normalized.playerPresentation.jumpHeight ??= normalized.playerPresentation.displayHeight ?? 66
  normalized.playerPresentation.flightEnabled ??= false
  normalized.playerPresentation.flightSpeed ??= 260
  normalized.playerPresentation.characterId ||= normalized.playerPresentation.characterAssetId ?? 'placeholder_player'
  normalized.playerPresentation.characterAssetId ||= normalized.playerPresentation.characterId
  for (const placement of normalized.placements) {
    if (placement.type === 'npc') placement.characterId ||= 'placeholder_npc'
  }
  normalized.platforms ||= []
  normalized.eventPoints ||= []
  normalized.speechLines ||= []
  return normalized
}

const loadArea = async () => {
  const [latestAreas, latestMapDrafts, latestAreaStates, latestMapPartLibrary] = await Promise.all([
    getLatestAreas(),
    getLatestMapDrafts(),
    getLatestAreaStates(),
    getLatestMapPartLibrary()
  ])
  runtimeMapPartLibrary.value = latestMapPartLibrary
  allAreas.value = latestAreas
  const nextArea = latestAreas.find(candidate => candidate.id === route.params.areaId) ?? null
  area.value = nextArea
  mapDraft.value = nextArea
    ? normalizeMapDraft(latestMapDrafts.maps?.[nextArea.id] ?? null, nextArea)
    : null
  runtimePlayerCharacterId.value = mapDraft.value?.playerPresentation?.characterId
    ?? mapDraft.value?.playerPresentation?.characterAssetId
    ?? playerCharacters.value[0]?.id
    ?? ''
  areaState.value = nextArea ? latestAreaStates.areaStates?.[nextArea.id] ?? null : null
  traveling.value = false
  seamlessLoopWraps.value = 0
  lastLoopDirection.value = null
  if (!nextArea || !mapDraft.value) return

  const requestedSpawn = typeof route.query.spawn === 'string' ? route.query.spawn : nextArea.defaultSpawn
  const spawn = nextArea.spawns.find(candidate => candidate.id === requestedSpawn)
    ?? nextArea.spawns.find(candidate => candidate.id === nextArea.defaultSpawn)
    ?? nextArea.spawns[0]
  activeSpawnId.value = spawn?.id ?? ''
  playerX.value = spawn?.x ?? 100
  const spawnSurface = walkSurfaceAtSpawn(playerX.value)
  playerY.value = spawnSurface.y
  jumpVelocity.value = 0
  isJumping.value = false
  airborneMode.value = ''
  activeSurfaceId.value = spawnSurface.id
  activeTransportId.value = ''
  speechIndex.value = 0
  speechVisible.value = true
  runtimeFollowers.value = []
  followerStates.value = []
  followerPickerOpen.value = false
  followerSerial = 0
  resetPlayerTrace()
  await nextTick()
  centerCamera()
  focusViewport()
}

const centerCamera = () => {
  if (!viewport.value) return
  const viewportWidth = viewport.value.clientWidth / mapZoom.value
  const target = renderPlayerX.value - viewportWidth / 2
  const maxScroll = Math.max(0, virtualWorldWidth.value - viewportWidth)
  viewport.value.scrollLeft = Math.max(0, Math.min(target, maxScroll)) * mapZoom.value
  updateCameraState()
}

const measureViewport = () => {
  if (!viewport.value) return
  viewportHeight.value = Math.max(320, viewport.value.clientHeight)
  cameraViewportWidth.value = viewport.value.clientWidth / mapZoom.value
  updateCameraState()
}

const updateCameraState = () => {
  if (!viewport.value) return
  cameraScroll.value = viewport.value.scrollLeft / mapZoom.value
  cameraViewportWidth.value = viewport.value.clientWidth / mapZoom.value
}

const jumpCamera = event => {
  if (!viewport.value || !area.value) return
  const rect = event.currentTarget.getBoundingClientRect()
  const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
  const loopOffset = hasSeamlessLoop.value ? area.value.width : 0
  const viewportWidth = viewport.value.clientWidth / mapZoom.value
  const target = loopOffset + ratio * area.value.width - viewportWidth / 2
  const maxScroll = Math.max(0, virtualWorldWidth.value - viewportWidth)
  viewport.value.scrollLeft = Math.max(0, Math.min(target, maxScroll)) * mapZoom.value
  updateCameraState()
}

const tryHorizontalMove = nextX => {
  const candidates = matchingWalkSurfacesAt(nextX)
    .sort((first, second) => Math.abs(first.y - playerY.value) - Math.abs(second.y - playerY.value))
  const canStepTo = targetY => {
    const difference = targetY - playerY.value
    return difference >= 0
      ? difference <= playerPresentation.value.maxStepDown
      : Math.abs(difference) <= playerPresentation.value.maxStepUp
  }
  const connectedTerrain = candidates.find(candidate => canStepTo(candidate.y))
  if (connectedTerrain) {
    const isAbruptDrop = connectedTerrain.id !== activeSurfaceId.value
      && connectedTerrain.y > playerY.value + 0.5
    if (isAbruptDrop) return startFall(nextX)
    playerX.value = nextX
    playerY.value = connectedTerrain.y
    activeSurfaceId.value = connectedTerrain.id
    activeTransportId.value = ''
    return true
  }
  if (activeSurfaceId.value !== 'base_ground') {
    const lowerSurface = candidates.find(candidate => candidate.y > playerY.value + 0.5)
    if (lowerSurface) return startFall(nextX)
    const baseY = mapDraft.value?.groundY ?? playerY.value
    if (baseY > playerY.value + 0.5) return startFall(nextX)
  }
  playerX.value = nextX
  playerY.value = mapDraft.value?.groundY ?? playerY.value
  activeSurfaceId.value = 'base_ground'
  activeTransportId.value = ''
  return true
}

const jumpGravity = 1800
const startFall = nextX => {
  if (isJumping.value || playerPresentation.value.flightEnabled) return false
  playerX.value = nextX
  jumpVelocity.value = 0
  isJumping.value = true
  airborneMode.value = 'fall'
  activeSurfaceId.value = 'air'
  activeTransportId.value = ''
  speechVisible.value = false
  return true
}
const startJump = () => {
  if (!area.value || traveling.value || isJumping.value || activeTransportId.value
    || playerPresentation.value.flightEnabled) return false
  const jumpHeight = Math.max(0, playerPresentation.value.jumpHeight ?? playerPresentation.value.displayHeight ?? 66)
  if (!jumpHeight) return false
  jumpVelocity.value = -Math.sqrt(2 * jumpGravity * jumpHeight)
  isJumping.value = true
  airborneMode.value = 'jump'
  activeSurfaceId.value = 'air'
  speechVisible.value = false
  focusViewport()
  return true
}

const landingSurfacesAt = x => [
  ...matchingWalkSurfacesAt(x),
  { id: 'base_ground', kind: 'base', y: mapDraft.value?.groundY ?? playerY.value }
].sort((first, second) => first.y - second.y)

const updateJump = seconds => {
  if (!isJumping.value) return false
  if (moveDirection.value) {
    const nextX = playerX.value + moveDirection.value * 310 * seconds
    if (hasSeamlessLoop.value) {
      if (nextX < 0) {
        playerX.value = nextX + area.value.width
        recordSeamlessWrap('left')
      } else if (nextX >= area.value.width) {
        playerX.value = nextX - area.value.width
        recordSeamlessWrap('right')
      } else {
        playerX.value = nextX
      }
    } else {
      playerX.value = Math.max(28, Math.min(area.value.width - 28, nextX))
    }
  }

  const previousY = playerY.value
  jumpVelocity.value += jumpGravity * seconds
  const nextY = previousY + jumpVelocity.value * seconds
  if (jumpVelocity.value >= 0) {
    const landing = landingSurfacesAt(playerX.value).find(surface => (
      surface.y >= previousY - 0.5 && surface.y <= nextY
    ))
    if (landing) {
      playerY.value = landing.y
      jumpVelocity.value = 0
      isJumping.value = false
      airborneMode.value = ''
      activeSurfaceId.value = landing.id
      activeTransportId.value = ''
      return true
    }
  }
  playerY.value = nextY
  return true
}

const updateVerticalMovement = seconds => {
  if (!verticalDirection.value) return false
  const transport = mapDraft.value?.verticalTransports.find(item => item.id === activeTransportId.value)
    ?? nearbyVerticalTransport.value
  if (!transport) return false
  const top = Math.min(transport.topY, transport.bottomY)
  const bottom = Math.max(transport.topY, transport.bottomY)
  const nextY = Math.max(top, Math.min(bottom, playerY.value + verticalDirection.value * transport.speed * seconds))
  playerX.value = transport.x + transport.width / 2
  playerY.value = nextY
  activeTransportId.value = transport.id
  activeSurfaceId.value = `transport:${transport.id}`
  return true
}

const updateFlight = seconds => {
  if (!playerPresentation.value.flightEnabled) return false
  if (moveDirection.value) {
    const nextX = playerX.value + moveDirection.value * 310 * seconds
    if (hasSeamlessLoop.value) {
      if (nextX < 0) {
        playerX.value = nextX + area.value.width
        recordSeamlessWrap('left')
      } else if (nextX >= area.value.width) {
        playerX.value = nextX - area.value.width
        recordSeamlessWrap('right')
      } else {
        playerX.value = nextX
      }
    } else {
      playerX.value = Math.max(28, Math.min(area.value.width - 28, nextX))
    }
  }
  if (verticalDirection.value) {
    const minY = Math.max(playerPresentation.value.displayHeight, 48)
    const maxY = mapDraft.value?.groundY ?? mapDraft.value?.height ?? playerY.value
    playerY.value = Math.max(minY, Math.min(maxY,
      playerY.value + verticalDirection.value * playerPresentation.value.flightSpeed * seconds))
  }
  if (!moveDirection.value && !verticalDirection.value) return false
  speechVisible.value = false
  activeSurfaceId.value = 'flight'
  activeTransportId.value = ''
  return true
}

const update = seconds => {
  if (!area.value || traveling.value) return
  if (updateJump(seconds)) {
    centerCamera()
    return
  }
  if (updateFlight(seconds)) {
    centerCamera()
    return
  }
  if (updateVerticalMovement(seconds)) {
    speechVisible.value = false
    centerCamera()
    return
  }
  if (!moveDirection.value) return
  speechVisible.value = false
  const nextX = playerX.value + moveDirection.value * 310 * seconds
  if (hasSeamlessLoop.value) {
    if (nextX < 0) {
      playerX.value = nextX + area.value.width
      playerY.value = mapDraft.value?.groundY ?? playerY.value
      activeSurfaceId.value = 'base_ground'
      recordSeamlessWrap('left')
    } else if (nextX >= area.value.width) {
      playerX.value = nextX - area.value.width
      playerY.value = mapDraft.value?.groundY ?? playerY.value
      activeSurfaceId.value = 'base_ground'
      recordSeamlessWrap('right')
    } else {
      tryHorizontalMove(nextX)
    }
    centerCamera()
    return
  }

  tryHorizontalMove(Math.max(28, Math.min(area.value.width - 28, nextX)))
  centerCamera()

  const edge = moveDirection.value < 0 ? 'left' : 'right'
  const reachedEdge = edge === 'left' ? playerX.value <= 32 : playerX.value >= area.value.width - 32
  if (!reachedEdge) return
  const edgeExit = area.value.exits.find(exit => exit.connectionType === 'edge' && exit.edge === edge)
  if (edgeExit) travel(edgeExit)
}

const updatePlayerSprite = seconds => {
  const animation = playerAnimationDefinition.value
  const frameOrder = spriteSheetFrameOrder(animation)
  const frames = frameOrder.length
  const fps = Math.max(1, Number(animation.fps) || 1)
  const nextKey = `${playerAnimation.value}:${playerGraphicSource.value}:${frameOrder.join(',')}:${fps}`
  if (nextKey !== playerSpriteKey) {
    playerSpriteKey = nextKey
    playerSpriteClock = 0
    playerSpriteFrame.value = 0
  }
  if (frames === 1) return
  playerSpriteClock += seconds
  const nextFrame = Math.floor(playerSpriteClock * fps) % frames
  if (nextFrame !== playerSpriteFrame.value) playerSpriteFrame.value = nextFrame
}

const updatePerformanceMeter = (time, rawFrameMs) => {
  if (!performanceWindowStartedAt) performanceWindowStartedAt = time
  performanceWindowFrames += 1
  performanceWindowDuration += rawFrameMs
  const elapsed = time - performanceWindowStartedAt
  if (elapsed < 500) return
  performanceFps.value = Math.max(0, Math.round(performanceWindowFrames * 1000 / Math.max(1, elapsed)))
  performanceFrameMs.value = performanceWindowDuration / Math.max(1, performanceWindowFrames)
  const usedHeap = globalThis.performance?.memory?.usedJSHeapSize
  performanceHeapMb.value = Number.isFinite(usedHeap) ? Math.round(usedHeap / 1024 / 1024) : 0
  performanceWindowStartedAt = time
  performanceWindowFrames = 0
  performanceWindowDuration = 0
}

const frame = time => {
  if (!previousTime) previousTime = time
  const rawFrameMs = Math.max(0, time - previousTime)
  const seconds = Math.min(rawFrameMs / 1000, 0.05)
  previousTime = time
  update(seconds)
  updatePlayerSprite(seconds)
  updateFollowerTrace(seconds)
  updatePerformanceMeter(time, rawFrameMs)
  frameId = window.requestAnimationFrame(frame)
}

const onKeyDown = event => {
  if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(event.code)) {
    pressedKeys.add(event.code)
    const left = pressedKeys.has('ArrowLeft') || pressedKeys.has('KeyA')
    const right = pressedKeys.has('ArrowRight') || pressedKeys.has('KeyD')
    keyboardDirection.value = Number(right) - Number(left)
    event.preventDefault()
  }
  if (['ArrowUp', 'ArrowDown', 'KeyW', 'KeyS'].includes(event.code)) {
    pressedKeys.add(event.code)
    const up = pressedKeys.has('ArrowUp') || pressedKeys.has('KeyW')
    const down = pressedKeys.has('ArrowDown') || pressedKeys.has('KeyS')
    keyboardVerticalDirection.value = Number(down) - Number(up)
    event.preventDefault()
  }
  if ((event.code === 'KeyE' || (event.code === 'ArrowUp'
    && !playerPresentation.value.flightEnabled && !nearbyVerticalTransport.value)) && nearbyEntrance.value) {
    enterNearby()
    event.preventDefault()
  }
  if (event.code === 'Space') {
    startJump()
    event.preventDefault()
  }
  if (event.code === 'KeyF') {
    talk()
    event.preventDefault()
  }
}
const onKeyUp = event => {
  pressedKeys.delete(event.code)
  const left = pressedKeys.has('ArrowLeft') || pressedKeys.has('KeyA')
  const right = pressedKeys.has('ArrowRight') || pressedKeys.has('KeyD')
  keyboardDirection.value = Number(right) - Number(left)
  const up = pressedKeys.has('ArrowUp') || pressedKeys.has('KeyW')
  const down = pressedKeys.has('ArrowDown') || pressedKeys.has('KeyS')
  keyboardVerticalDirection.value = Number(down) - Number(up)
}
const setTouchDirection = direction => { touchDirection.value = direction }
const setTouchVerticalDirection = direction => { touchVerticalDirection.value = direction }
const focusViewport = () => viewport.value?.focus({ preventScroll: true })
const talk = () => {
  if (speechVisible.value) {
    speechIndex.value = (speechIndex.value + 1) % speechLines.value.length
  }
  speechVisible.value = true
}

const recordSeamlessWrap = edge => {
  const exit = area.value?.exits.find(candidate => isSeamlessLoopEdge(candidate) && candidate.edge === edge)
  if (exit?.destinationSpawn) activeSpawnId.value = exit.destinationSpawn
  speechVisible.value = false
  seamlessLoopWraps.value += 1
  lastLoopDirection.value = edge
}

const travel = exit => {
  if (!exit || traveling.value) return
  if (isSeamlessLoopEdge(exit)) {
    playerX.value = exit.edge === 'left' ? area.value.width - 1 : 1
    recordSeamlessWrap(exit.edge)
    centerCamera()
    return
  }
  traveling.value = true
  router.push({
    name: 'area-map',
    params: { areaId: exit.destinationArea },
    query: { spawn: exit.destinationSpawn }
  })
}
const enterNearby = () => travel(nearbyEntrance.value)

const backToSettings = () => {
  router.push({ path: '/area-exploration', query: area.value ? { area: area.value.id } : {} })
}

const renderMapState = () => JSON.stringify({
  screen: 'area-map',
  areaId: area.value?.id ?? null,
  areaName: area.value?.name ?? null,
  mapUiTheme: mapUiTheme.value,
  mapZoom: mapZoom.value,
  terrainType: area.value?.terrainType ?? null,
  player: {
    x: Math.round(playerX.value),
    y: Math.round(playerY.value),
    spawnId: activeSpawnId.value,
    surfaceId: activeSurfaceId.value,
    transportId: activeTransportId.value || null,
    isJumping: isJumping.value,
    jumpVelocity: Math.round(jumpVelocity.value),
    airborneMode: airborneMode.value || null
  },
  playerPresentation: {
    characterId: playerCharacter.value?.id ?? null,
    runtimeSelectionOnly: true,
    displayWidth: playerPresentation.value.displayWidth,
    displayHeight: playerPresentation.value.displayHeight,
    hitboxWidth: playerPresentation.value.hitboxWidth,
    hitboxHeight: playerPresentation.value.hitboxHeight,
    maxStepUp: playerPresentation.value.maxStepUp,
    maxStepDown: playerPresentation.value.maxStepDown,
    jumpHeight: playerPresentation.value.jumpHeight,
    flightEnabled: playerPresentation.value.flightEnabled,
    flightSpeed: playerPresentation.value.flightSpeed,
    animation: playerAnimation.value,
    imageSource: playerGraphicSource.value || null,
    frameCount: spriteSheetFrameOrder(playerAnimationDefinition.value).length,
    fps: playerCharacter.value?.animations?.[playerAnimation.value]?.fps
      ?? playerCharacter.value?.animations?.idle?.fps ?? 0,
    currentFrame: playerSpriteFrame.value,
    sourceFrame: spriteSheetSourceFrame(playerAnimationDefinition.value, playerSpriteFrame.value) + 1
  },
  camera: {
    x: Math.round(logicalCameraScroll.value),
    width: Math.round(cameraViewportWidth.value),
    trackX: Math.round(cameraScroll.value)
  },
  moveDirection: moveDirection.value,
  facingDirection: facingDirection.value,
  followerLoadTest: {
    available: isFollowerLoadTestArea.value,
    count: followerActors.value.length,
    activeBonePlayers: activeBonePlayerCount.value,
    fps: performanceFps.value,
    frameMs: Number(performanceFrameMs.value.toFixed(2)),
    heapMb: performanceHeapMb.value || null,
    followers: followerActors.value.map(follower => ({
      id: follower.id,
      characterId: follower.character.id,
      delayMs: follower.delayMs,
      x: Math.round(follower.x),
      y: Math.round(follower.y),
      facingDirection: follower.facingDirection,
      animation: follower.animation,
      motionId: follower.motionId || null
    }))
  },
  exits: area.value?.exits.map((exit, index) => ({
    id: exit.id,
    x: exitPosition(index),
    connectionType: exit.connectionType ?? 'exit',
    depthDirection: exit.depthDirection ?? null,
    edge: exit.edge ?? null,
    destinationName: destinationName(exit),
    destinationArea: exit.destinationArea,
    destinationSpawn: exit.destinationSpawn
  })) ?? [],
  nearbyEntrance: nearbyEntrance.value?.id ?? null,
  speech: speechVisible.value ? currentSpeech.value : null,
  seamlessLoop: {
    enabled: hasSeamlessLoop.value,
    wraps: seamlessLoopWraps.value,
    lastDirection: lastLoopDirection.value,
    sceneryCopies: worldCopies.value.length,
    renderPlayerX: Math.round(renderPlayerX.value)
  },
  events: mapDraft.value?.eventPoints ?? [],
  placements: mapDraft.value?.placements ?? [],
  visiblePlacementIds: visiblePlacements.value.map(placement => placement.id),
  areaState: areaState.value,
  collisionZones: mapDraft.value?.collisionZones ?? [],
  platforms: mapDraft.value?.platforms.map(platform => ({
    ...platform,
    walkable: platform.walkable !== false
  })) ?? [],
  terrainSegments: mapDraft.value?.terrainSegments ?? [],
  verticalTransports: mapDraft.value?.verticalTransports ?? [],
  environmentEffects: mapDraft.value?.environmentEffects ?? [],
  tileCount: mapDraft.value?.tileLayers.reduce((count, layer) => count + layer.tiles.length, 0) ?? 0,
  mapParts: mapDraft.value?.mapParts ?? [],
  backgroundGradient: mapDraft.value?.backgroundGradient ?? null,
  backgroundImageCount: mapDraft.value?.backgroundImages.length ?? 0,
  backgroundImages: mapDraft.value?.backgroundImages.map(layer => ({
    id: layer.id,
    x: layer.x,
    y: layer.y,
    resolvedY: backgroundLayerY(layer),
    verticalAnchor: layer.verticalAnchor,
    width: layer.width,
    height: layer.height,
    fit: layer.fit,
    visible: layer.visible !== false
  })) ?? [],
  coordinateSystem: 'World origin is top-left; x increases right and y increases down.'
})
const advanceMapTime = milliseconds => {
  const steps = Math.max(1, Math.round(milliseconds / (1000 / 60)))
  for (let index = 0; index < steps; index += 1) {
    update(1 / 60)
    updatePlayerSprite(1 / 60)
    updateFollowerTrace(1 / 60)
  }
}

watch(
  () => [route.params.areaId, route.query.spawn],
  loadArea
)

watch(mapZoom, async () => {
  await nextTick()
  centerCamera()
})

onMounted(async () => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.render_game_to_text = renderMapState
  window.advanceTime = advanceMapTime
  await loadArea()
  measureViewport()
  viewportObserver = new ResizeObserver(measureViewport)
  viewportObserver.observe(viewport.value)
  frameId = window.requestAnimationFrame(frame)
})

onBeforeUnmount(() => {
  window.cancelAnimationFrame(frameId)
  viewportObserver?.disconnect()
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  if (window.render_game_to_text === renderMapState) delete window.render_game_to_text
  if (window.advanceTime === advanceMapTime) delete window.advanceTime
})
</script>

<style scoped>
.map-screen {
  --cyan: #64e8ff;
  --line: rgba(126, 218, 239, 0.28);
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(100, 232, 255, 0.32);
  background: #03090d;
  color: #dffaff;
  font-family: "Consolas", "Courier New", monospace;
}

button { font: inherit; }

.map-header {
  display: grid;
  min-height: 72px;
  box-sizing: border-box;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  align-items: center;
  gap: 13px;
  padding: 10px 22px;
  border-bottom: 1px solid var(--line);
  background: #07141a;
}

.back-button {
  width: 42px;
  height: 42px;
  border: 1px solid var(--line);
  background: rgba(100, 232, 255, 0.1);
  color: var(--cyan);
  font-size: 31px;
  cursor: pointer;
}

.map-header p,
.map-header h1 { margin: 0; }
.map-header p { color: var(--cyan); font-size: 10px; letter-spacing: 0.14em; }
.map-header h1 { margin-top: 3px; font-size: 22px; }
.header-meta { display: grid; gap: 2px; text-align: right; }
.header-meta span { color: var(--cyan); font-size: 14px; font-weight: 700; }
.header-meta code { color: rgba(215, 244, 250, 0.58); font-size: 9px; }

.map-body {
  display: flex;
  width: 100%;
  min-width: 0;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
}

.follower-picker { position:fixed; z-index:3000; inset:0; width:100%; height:100%; max-width:none; max-height:none; margin:0; padding:0; border:0; background:rgba(0,8,12,.72); color:#dffaff; }
.follower-picker-panel { position:absolute; top:50%; left:50%; width:min(620px,calc(100vw - 32px)); max-height:min(680px,calc(100vh - 32px)); box-sizing:border-box; overflow:auto; padding:18px; border:1px solid rgba(100,232,255,.55); background:#071820; box-shadow:0 18px 60px rgba(0,0,0,.55); transform:translate(-50%,-50%); }
.follower-picker-panel header { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:14px; }
.follower-picker-panel header div { display:grid; gap:3px; }
.follower-picker-panel header span { color:#64e8ff; font-size:13px; }
.follower-picker-panel header strong { font-size:20px; }
.follower-picker-panel header button { width:38px; height:38px; border:1px solid var(--line); background:#102832; color:#fff; font-size:20px; cursor:pointer; }
.follower-character-list { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
.follower-character-list button { display:grid; min-height:82px; gap:4px; padding:12px; border:1px solid rgba(100,232,255,.25); background:#0b222b; color:#dffaff; text-align:left; cursor:pointer; }
.follower-character-list button:hover { border-color:#64e8ff; background:#12333e; }
.follower-character-list strong { font-size:15px; }
.follower-character-list code,.follower-character-list small { color:#a8c9d0; font-size:13px; }
.follower-picker-panel p { margin:14px 0 0; color:#a8c9d0; font-size:15px; }

.map-toolbar {
  display: grid;
  min-height: 0;
  grid-template-columns:minmax(0,1fr) auto;
  align-items: center;
  gap: 6px 10px;
  padding: 7px 10px;
  border-bottom: 1px solid var(--line);
  background: rgba(4, 18, 24, 0.96);
}

.map-toolbar span { color: #ffd498; font-size: 10px; letter-spacing: 0.1em; }
.map-toolbar > span { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.map-toolbar p { display:none; }
.runtime-character-selector { display:flex; min-width:0; grid-column:1 / -1; align-items:center; gap:8px; color:#ffd498; white-space:nowrap; }
.runtime-character-selector span { flex:0 0 auto; }
.runtime-character-selector select { min-width:0; height:29px; flex:1; padding:3px 7px; border:1px solid var(--line); background:#07141a; color:#dffaff; }
.runtime-zoom-selector { display:flex; grid-column:2; grid-row:1; align-items:center; gap:8px; color:#ffd498; font-size:15px; white-space:nowrap; }
.runtime-zoom-selector span { flex:0 0 auto; }
.runtime-zoom-selector select { height:32px; min-width:78px; padding:3px 7px; border:1px solid var(--line); background:#07141a; color:#dffaff; font-size:15px; }
.follower-load-tools { display:flex; min-width:0; width:100%; grid-column:1 / -1; align-items:center; gap:6px; }
.load-meter { display:flex; min-width:0; height:32px; flex:1; align-items:center; justify-content:space-between; gap:4px; padding:0 7px; border:1px solid rgba(100,232,255,.32); background:rgba(4,23,30,.88); color:#bceff8; font-size:13px; font-variant-numeric:tabular-nums; white-space:nowrap; }
.load-meter strong { color:#7dffab; font-size:15px; }
.load-meter span { color:#bceff8; font-size:13px; letter-spacing:0; }
.load-meter.warning strong { color:#ffd56f; }
.load-meter.critical { border-color:rgba(255,112,88,.65); background:rgba(48,16,15,.9); }
.load-meter.critical strong { color:#ff8b78; }
.follower-add-button,.follower-clear-button { height:32px; border:1px solid rgba(100,232,255,.46); background:#0c2630; color:#dffaff; font-size:15px; cursor:pointer; }
.follower-add-button { width:34px; flex:0 0 34px; padding:0; font-size:23px; line-height:1; }
.follower-clear-button { width:auto; flex:0 0 auto; padding:0 9px; white-space:nowrap; }
.follower-add-button:hover,.follower-clear-button:hover { border-color:#64e8ff; background:#153b47; }

.map-viewport {
  position: relative;
  width: 100%;
  min-width: 0;
  min-height: 0;
  flex: 0 0 46%;
  overflow: auto;
  outline: none;
  scroll-behavior: auto;
  scrollbar-color: rgba(100, 232, 255, 0.55) rgba(2, 10, 14, 0.8);
}

.map-lower {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 14px;
  box-sizing: border-box;
  padding: 18px 22px;
  border-top: 1px solid var(--line);
  background:
    linear-gradient(180deg, rgba(5, 24, 31, 0.98), rgba(2, 11, 15, 0.98)),
    repeating-linear-gradient(90deg, transparent 0 47px, rgba(100, 232, 255, 0.04) 48px);
}

.minimap-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 14px;
}

.minimap-heading > div { display: grid; gap: 2px; }
.minimap-heading span { color: var(--cyan); font-size: 9px; letter-spacing: 0.13em; }
.minimap-heading strong { font-size: 17px; }
.minimap-heading p { margin: 0; color: rgba(215, 244, 250, 0.54); font-size: 9px; }

.minimap {
  position: relative;
  height: 112px;
  flex: 0 0 auto;
  overflow: hidden;
  border: 1px solid rgba(100, 232, 255, 0.34);
  background:
    linear-gradient(rgba(100, 232, 255, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(100, 232, 255, 0.06) 1px, transparent 1px),
    rgba(1, 12, 17, 0.94);
  background-size: 20px 20px;
  cursor: crosshair;
}

.minimap-route {
  position: absolute;
  top: 53px;
  right: 12px;
  left: 12px;
  height: 5px;
  border: 1px solid rgba(100, 232, 255, 0.4);
  background: rgba(100, 232, 255, 0.15);
}
.mini-segment {
  position: absolute;
  z-index: 1;
  top: 8px;
  height: 22px;
  box-sizing: border-box;
  overflow: hidden;
  border-right: 1px solid rgba(100, 232, 255, .34);
  border-left: 1px solid rgba(100, 232, 255, .34);
  color: rgba(215, 244, 250, .55);
  font-size: 7px;
  line-height: 20px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mini-point,
.mini-player {
  position: absolute;
  z-index: 3;
  top: 48px;
  width: 13px;
  height: 13px;
  border: 2px solid #dffaff;
  border-radius: 50%;
  background: #07141a;
  transform: translateX(-50%);
}

.mini-point.spawn { border-color: #64e8ff; }
.mini-point.spawn.default { background: rgba(100, 232, 255, 0.58); }
.mini-point.exit { width: 14px; height: 14px; border-radius: 2px; border-color: #ffd498; transform: translate(-50%, -1px) rotate(45deg); }
.mini-point.exit.entrance { border-color: #7dffab; background: rgba(51, 148, 91, 0.45); }
.mini-point.exit.junction { border-color: #8fa8ff; background: rgba(72, 91, 171, 0.45); }
.mini-point.event { top: 24px; border-color: #dda5ff; }
.mini-point.placement { top: 36px; width: 7px; height: 7px; border-color: #ff9c75; background: rgba(255, 156, 117, .45); }
.mini-point.event::after {
  position: absolute;
  top: 13px;
  left: 5px;
  width: 1px;
  height: 18px;
  background: rgba(221, 165, 255, 0.5);
  content: "";
}
.mini-player {
  z-index: 5;
  top: 45px;
  width: 8px;
  height: 20px;
  border: 0;
  border-radius: 4px;
  background: #efffff;
  box-shadow: 0 0 9px #64e8ff;
}

.mini-viewport {
  position: absolute;
  z-index: 2;
  top: 8px;
  bottom: 8px;
  min-width: 8px;
  box-sizing: border-box;
  border: 2px solid rgba(100, 232, 255, 0.62);
  background: rgba(100, 232, 255, 0.08);
  pointer-events: none;
}

.minimap-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  color: rgba(215, 244, 250, 0.6);
  font-size: 9px;
}
.minimap-legend span { display: flex; align-items: center; gap: 5px; }
.minimap-legend i { width: 8px; height: 8px; border: 1px solid currentColor; border-radius: 50%; }
.minimap-legend .player-dot { color: #efffff; background: #efffff; box-shadow: 0 0 5px #64e8ff; }
.minimap-legend .spawn-dot { color: #64e8ff; }
.minimap-legend .exit-dot { color: #ffd498; border-radius: 1px; transform: rotate(45deg); }
.minimap-legend .entrance-dot { color: #7dffab; border-radius: 1px; background: rgba(51, 148, 91, 0.45); }
.minimap-legend .junction-dot { color: #8fa8ff; border-radius: 1px; background: rgba(72, 91, 171, 0.45); }
.minimap-legend .event-dot { color: #dda5ff; }
.minimap-legend .placement-dot { color: #ff9c75; background: rgba(255, 156, 117, 0.45); }

.area-data-grid {
  display: grid;
  min-height: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  overflow-y: auto;
}

.area-data-grid article {
  display: grid;
  min-width: 0;
  gap: 4px;
  padding: 10px 12px;
  border: 1px solid rgba(126, 218, 239, 0.18);
  background: rgba(8, 29, 37, 0.68);
}
.area-data-grid article.wide { grid-column: 1 / -1; }
.area-data-grid span { color: var(--cyan); font-size: 8px; letter-spacing: 0.1em; }
.area-data-grid strong { font-size: 12px; }
.area-data-grid code {
  overflow: hidden;
  color: rgba(223, 250, 255, 0.74);
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.map-viewport:focus-visible { box-shadow: inset 0 0 0 2px rgba(100, 232, 255, 0.5); }

.map-world {
  position: relative;
  min-height: 100%;
  overflow: hidden;
  transform-origin: left top;
  background:
    linear-gradient(180deg, rgba(11, 41, 53, 0.88), rgba(3, 12, 17, 0.98)),
    repeating-linear-gradient(90deg, transparent 0 119px, rgba(100, 232, 255, 0.09) 120px);
}

.world-segment {
  position: absolute;
  top: 0;
  bottom: 0;
  overflow: hidden;
}

.sky-layer,
.far-structures,
.mid-structures,
.map-base-gradient,
.map-background-image,
.scan-layer,
.foreground-layer,
.ground {
  position: absolute;
  right: 0;
  left: 0;
  pointer-events: none;
}
.map-base-gradient { z-index:0; top:0; bottom:0; }
.map-background-image { background-position:center; }

.foreground-layer {
  z-index: 5;
  bottom: 0;
  height: 22%;
  opacity: .45;
  background:
    radial-gradient(ellipse at 4% 100%, rgba(17, 42, 21, .88) 0 70px, transparent 72px),
    radial-gradient(ellipse at 96% 100%, rgba(17, 42, 21, .88) 0 90px, transparent 92px);
}

.sky-layer {
  top: 0;
  height: 58%;
  background:
    radial-gradient(circle at 18% 24%, rgba(100, 232, 255, 0.13), transparent 17%),
    radial-gradient(circle at 72% 14%, rgba(94, 113, 255, 0.1), transparent 20%);
}

.far-structures {
  bottom: calc(100% - var(--ground-top));
  height: 390px;
  opacity: 0.34;
  background:
    repeating-linear-gradient(90deg, transparent 0 170px, rgba(51, 135, 157, 0.32) 171px 250px, transparent 251px 330px);
  clip-path: polygon(0 100%, 0 48%, 4% 48%, 4% 23%, 9% 23%, 9% 58%, 15% 58%, 15% 32%, 22% 32%, 22% 68%, 96% 68%, 96% 48%, 100% 48%, 100% 100%);
}

.mid-structures {
  bottom: calc(100% - var(--ground-top));
  height: 280px;
  opacity: 0.5;
  background: repeating-linear-gradient(90deg, rgba(15, 54, 67, 0.72) 0 120px, rgba(6, 25, 33, 0.72) 121px 260px);
  clip-path: polygon(0 100%, 0 36%, 7% 36%, 7% 68%, 16% 68%, 16% 18%, 27% 18%, 27% 72%, 43% 72%, 43% 42%, 61% 42%, 61% 67%, 78% 67%, 78% 25%, 91% 25%, 91% 36%, 100% 36%, 100% 100%);
}

.scan-layer {
  inset: 0;
  background-image:
    linear-gradient(rgba(100, 232, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(100, 232, 255, 0.05) 1px, transparent 1px);
  background-size: 40px 40px;
}

.ground {
  z-index: 100;
  border-top: 3px solid rgba(100, 232, 255, 0.7);
  background:
    repeating-linear-gradient(135deg, rgba(15, 45, 55, 0.95) 0 18px, rgba(7, 24, 31, 0.95) 19px 36px);
  box-shadow: 0 -10px 28px rgba(100, 232, 255, 0.09);
}
.terrain-cutout {
  position:absolute;
  z-index: 109;
  background: #6f8780;
  pointer-events: none;
}
.terrain-segment {
  position:absolute;
  z-index: 110;
  box-sizing: border-box;
  border-top: 3px solid rgba(205, 240, 169, .88);
  background:
    repeating-linear-gradient(135deg, rgba(52, 77, 49, .98) 0 22px, rgba(31, 51, 34, .98) 23px 44px);
  box-shadow: 0 -8px 18px rgba(169, 233, 142, .1);
  pointer-events: none;
}
.terrain-segment-step {
  border-top-color: rgba(255, 205, 132, .9);
  background: repeating-linear-gradient(90deg, #62482c 0 34px, #44301f 35px 68px);
}
.terrain-segment-slope { border-top-color: rgba(164, 229, 255, .9); }
.terrain-segment-stairs {
  border-top-color: rgba(255, 225, 151, .96);
  background: repeating-linear-gradient(90deg, #63513a 0 32px, #443622 33px 64px);
}
.terrain-up-sign {
  position:absolute;
  z-index:2;
  top:42%;
  left:50%;
  padding:3px 7px;
  border:1px solid rgba(255,241,185,.72);
  border-radius:10px;
  background:rgba(23,35,24,.82);
  color:#fff1b9;
  font-size:11px;
  font-weight:700;
  transform:translateX(-50%);
}
.theme-fantasy .terrain-cutout { background:#82908a; }
.vertical-transport {
  position:absolute;
  z-index:120;
  box-sizing:border-box;
  pointer-events:none;
}
.vertical-transport-ladder {
  min-width:38px;
  border-right:4px solid rgba(175,226,236,.88);
  border-left:4px solid rgba(175,226,236,.88);
  background:repeating-linear-gradient(0deg,transparent 0 17px,rgba(175,226,236,.85) 18px 22px);
}
.vertical-transport-elevator {
  border:2px solid rgba(255,222,142,.72);
  background:linear-gradient(90deg,rgba(255,222,142,.05),rgba(255,222,142,.15),rgba(255,222,142,.05));
}
.vertical-transport.nearby { filter:drop-shadow(0 0 9px var(--cyan)); }
.elevator-cab {
  position:absolute;
  right:4px;
  left:4px;
  display:grid;
  height:34px;
  place-items:center;
  border:2px solid #ffe29d;
  background:rgba(52,42,26,.94);
  color:#fff0be;
  font-size:11px;
  font-style:normal;
  transition:top .08s linear;
}

.map-tile {
  position: absolute;
  z-index: 110;
  box-sizing: border-box;
  border: 1px dashed rgba(255, 228, 155, 0.55);
  background: linear-gradient(135deg, rgba(255, 228, 155, 0.18), transparent), rgba(41, 63, 54, 0.78);
}
.map-part {
  position:absolute;
  box-sizing:border-box;
  background-color:transparent;
  background-repeat:no-repeat;
  image-rendering:pixelated;
  pointer-events:none;
  transform-origin:center;
}
.map-part.collision { box-shadow:inset 0 0 0 1px rgba(255,116,92,.22); }
.map-tile.collision { border-style: solid; box-shadow: inset 0 0 0 2px rgba(255, 102, 75, 0.24); }
.collision-zone {
  position: absolute;
  z-index: 120;
  box-sizing: border-box;
  border: 1px dashed rgba(255, 111, 83, .55);
  background: repeating-linear-gradient(135deg, rgba(255, 72, 42, .12) 0 12px, transparent 13px 25px);
  pointer-events: none;
}
.collision-zone.collision-solid { border-color: rgba(255, 208, 116, .58); background-color: rgba(84, 68, 40, .12); }
.collision-zone.collision-one_way { border-bottom-style: solid; background: transparent; }
.collision-zone.collision-fall { border-color: rgba(185, 105, 255, .55); background-color: rgba(79, 24, 106, .15); }

.map-placement {
  position: absolute;
  display: grid;
  min-width: 38px;
  box-sizing: border-box;
  place-content: center;
  border: 2px solid #ffca78;
  border-radius: 5px;
  background: rgba(48, 31, 15, 0.84);
  color: #fff3c8;
  text-align: center;
  transform: translate(-50%, -100%);
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.34);
}
.map-placement span { font-size: 8px; font-weight: 800; letter-spacing: .05em; }
.map-placement strong {
  position: absolute;
  bottom: calc(100% + 4px);
  left: 50%;
  width: max-content;
  max-width: 150px;
  color: inherit;
  font-size: 9px;
  transform: translateX(-50%);
}
.placement-npc { border-color: #76dfff; background: rgba(24, 76, 91, .82); }
.placement-enemy { border-color: #ff7969; background: rgba(103, 30, 25, .82); }
.placement-boss { border-color: #de7aff; background: rgba(77, 29, 85, .88); }
.placement-treasure { border-color: #ffd261; background: rgba(114, 75, 16, .88); }
.placement-save_point { border-color: #91ffcf; background: rgba(21, 92, 65, .88); }
.placement-gathering { border-color: #a8e57e; background: rgba(53, 92, 28, .88); }
.placement-hazard {
  z-index: 3;
  border-color: rgba(255, 93, 53, .72);
  border-radius: 0;
  background: repeating-linear-gradient(135deg, rgba(255, 66, 28, .25) 0 12px, rgba(60, 11, 5, .2) 13px 24px);
}

.environment-effect {
  position: absolute;
  z-index: 5;
  inset: 0;
  pointer-events: none;
  opacity: .58;
}
.effect-rain {
  background: repeating-linear-gradient(105deg, transparent 0 32px, rgba(206, 235, 255, .42) 33px 35px, transparent 36px 68px);
  animation: weatherFall .7s linear infinite;
}
.effect-snow {
  background-image: radial-gradient(circle, rgba(255,255,255,.88) 0 2px, transparent 3px);
  background-size: 47px 47px;
  animation: weatherFall 3.8s linear infinite;
}
.effect-leaves,
.effect-glow_spores,
.effect-magic_motes,
.effect-embers,
.effect-ash,
.effect-cave_dust,
.effect-dust {
  color: rgba(210, 190, 155, .72);
  background-image:
    radial-gradient(circle at 20% 30%, currentColor 0 2px, transparent 3px),
    radial-gradient(circle at 72% 62%, currentColor 0 3px, transparent 4px);
  background-size: 160px 120px, 230px 180px;
  animation: weatherDrift 5s linear infinite;
}
.effect-leaves { color: #8fc55c; }
.effect-glow_spores, .effect-magic_motes { color: #b4ffd7; filter: drop-shadow(0 0 5px currentColor); }
.effect-embers { color: #ff7f39; filter: drop-shadow(0 0 4px currentColor); }
.effect-mist,
.effect-sea_spray,
.effect-wind {
  background: repeating-linear-gradient(170deg, transparent 0 80px, rgba(224, 242, 232, .18) 82px 100px, transparent 102px 180px);
  animation: weatherDrift 7s linear infinite;
}

.platform {
  position: absolute;
  z-index: 120;
  height: 18px;
  border-top: 2px solid rgba(255, 212, 152, 0.74);
  background: repeating-linear-gradient(90deg, #17323b 0 32px, #0c222b 33px 64px);
}
.platform code { position: absolute; top: 21px; left: 5px; color: rgba(255, 212, 152, 0.5); font-size: 8px; }

.map-marker {
  position: absolute;
  z-index: 350;
  display: grid;
  width: auto;
  min-width: 148px;
  max-width: 280px;
  box-sizing: border-box;
  gap: 2px;
  padding: 10px 12px;
  border: 1px solid rgba(100, 232, 255, 0.45);
  background: rgba(5, 25, 33, 0.92);
  color: #dffaff;
  text-align: left;
  transform: translateX(-50%);
}

.map-marker span { color: var(--cyan); font-size: 9px; letter-spacing: 0.1em; }
.map-marker strong { font-size: 12px; }
.map-marker code { color: rgba(215, 244, 250, 0.55); font-size: 9px; }
.exit-marker { border-color: rgba(255, 212, 152, 0.7); cursor: pointer; }
.exit-marker span { color: #ffd498; }
.exit-marker:hover { background: rgba(69, 48, 20, 0.94); }
.exit-marker.entrance-marker {
  border-color: rgba(125, 255, 171, 0.78);
  background: rgba(8, 49, 31, 0.94);
}
.exit-marker.entrance-marker span { color: #7dffab; }
.exit-marker.junction-marker {
  border-color: rgba(143, 168, 255, 0.78);
  background: rgba(23, 32, 72, 0.94);
}
.exit-marker.junction-marker span { color: #aebfff; }
.exit-marker.edge-marker { min-width: 128px; }
.exit-marker.edge-marker.edge-left { transform: none; }
.exit-marker.edge-marker.edge-right { transform: translateX(-100%); }
.exit-marker.nearby {
  box-shadow: 0 0 0 2px rgba(223, 255, 237, 0.35), 0 0 22px rgba(125, 255, 171, 0.48);
  translate: 0 -4px;
}
.destination-sign {
  position: absolute;
  bottom: calc(100% + 7px);
  left: 50%;
  min-width: max-content;
  max-width: 220px;
  box-sizing: border-box;
  padding: 5px 9px;
  border: 1px solid rgba(125, 255, 171, 0.85);
  background: rgba(5, 56, 32, 0.96);
  color: #baffd0;
  font-size: 9px;
  font-style: normal;
  font-weight: 700;
  line-height: 1.3;
  text-align: center;
  transform: translateX(-50%);
  box-shadow: 0 0 14px rgba(71, 255, 132, 0.25);
}
.spawn-marker { min-width: 126px; border-style: dashed; opacity: 0.72; }
.spawn-marker.default { border-color: #64e8ff; opacity: 1; }
.event-marker { border-color: rgba(211, 133, 255, 0.64); }
.event-marker span { color: #dda5ff; }

.depth-road {
  position: absolute;
  z-index: 4;
  width: 180px;
  height: 82px;
  pointer-events: none;
  transform: translateX(-50%);
}
.depth-road::before {
  position: absolute;
  inset: 0;
  border-right: 2px solid rgba(125, 255, 171, 0.72);
  border-left: 2px solid rgba(125, 255, 171, 0.72);
  background:
    repeating-linear-gradient(90deg, rgba(112, 255, 161, 0.2) 0 14px, rgba(12, 69, 39, 0.32) 15px 30px);
  content: "";
  clip-path: polygon(36% 0, 64% 0, 100% 100%, 0 100%);
}
.depth-road.rear {
  height: 104px;
  transform: translate(-50%, -100%);
}
.depth-road.rear::before {
  clip-path: polygon(0 0, 100% 0, 64% 100%, 36% 100%);
  opacity: 0.66;
}
.depth-road span {
  position: absolute;
  z-index: 1;
  right: 0;
  bottom: 8px;
  left: 0;
  color: #baffd0;
  font-size: 9px;
  font-weight: 700;
  text-align: center;
  text-shadow: 0 1px 3px #001c0c;
}
.depth-road.rear span { top: 9px; bottom: auto; }

.player {
  position: absolute;
  z-index: 300;
  width: 42px;
  height: 66px;
  padding: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  transform: translateX(-50%);
}
.map-follower {
  position:absolute;
  z-index:290;
  padding:0;
  border:0;
  background:transparent;
  color:inherit;
  pointer-events:none;
  transform:translateX(-50%);
}
.player.highlighted { filter: drop-shadow(0 0 9px rgba(100, 232, 255, 0.7)); }

.player-core {
  position: absolute;
  top: 6%;
  left: 24%;
  width: 52%;
  height: 33%;
  border: 2px solid #bff9ff;
  border-radius: 50%;
  background: rgba(100, 232, 255, 0.28);
}

.player-body {
  position: absolute;
  top: 44%;
  left: 17%;
  width: 66%;
  height: 45%;
  border: 2px solid #64e8ff;
  border-radius: 9px 9px 4px 4px;
  background: rgba(24, 105, 124, 0.65);
}
.player-body.has-image {
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  border-radius: 0;
  background-repeat: no-repeat;
  image-rendering: pixelated;
}
.map-bone-motion,.follower-bone-motion { position: absolute !important; inset: 0; }
.player small,.map-follower small { position: absolute; top: -12px; left: 50%; color: #dffaff; font-size: 7px; transform: translateX(-50%); }
.player.moving:not(.has-bone-motion) { animation: playerStep 220ms ease-in-out infinite alternate; }
.player.jumping {
  filter: drop-shadow(0 0 14px rgba(100, 232, 255, 0.95));
}
.player.jumping .player-body { transform: scaleY(.92); transform-origin: center bottom; }
.player.falling {
  filter: drop-shadow(0 0 11px rgba(100, 232, 255, 0.82));
}
.player.flying:not(.jumping) {
  filter: drop-shadow(0 0 15px rgba(255, 215, 122, 0.8));
}
.player.left { transform: translateX(-50%) scaleX(-1); }
.map-follower.left { transform:translateX(-50%) scaleX(-1); }
.map-follower.left small { scale:-1 1; }
.speech-bubble {
  position: absolute;
  right: 50%;
  bottom: 75px;
  display: block;
  width: max-content;
  max-width: 250px;
  padding: 9px 12px;
  border: 2px solid #baf7ff;
  border-radius: 13px;
  background: rgba(243, 254, 255, 0.96);
  color: #06212a;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.45;
  text-align: left;
  transform: translateX(28px);
  filter: none;
}
.speech-bubble::after {
  position: absolute;
  right: 21px;
  bottom: -10px;
  width: 15px;
  height: 15px;
  border-right: 2px solid #baf7ff;
  border-bottom: 2px solid #baf7ff;
  background: rgba(243, 254, 255, 0.96);
  content: "";
  transform: rotate(45deg);
}
.speech-bubble.speech-right {
  right: auto;
  left: 50%;
  transform: translateX(-16px);
}
.speech-bubble.speech-right::after {
  right: auto;
  left: 21px;
}
.player.left .speech-bubble { scale: -1 1; }

.world-ruler { position: absolute; right: 0; left: 0; z-index: 2; height: 24px; }
.world-ruler span {
  position: absolute;
  color: rgba(100, 232, 255, 0.45);
  font-size: 8px;
  transform: translateX(-50%);
}

.map-hud {
  display: grid;
  width: 100%;
  min-width: 0;
  min-height: 94px;
  flex: 0 0 auto;
  box-sizing: border-box;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1.35fr);
  align-items: center;
  gap: 16px;
  padding: 9px 22px;
  border-top: 1px solid var(--line);
  background: #07141a;
}

.position-readout,
.scene-readout { display: grid; gap: 3px; min-width: 0; }
.position-readout span,
.scene-readout span { color: var(--cyan); font-size: 9px; letter-spacing: 0.12em; }
.position-readout strong { font-size: 19px; }
.position-readout small,
.scene-readout small { overflow: hidden; color: rgba(215, 244, 250, 0.55); font-size: 8px; text-overflow: ellipsis; white-space: nowrap; }
.scene-readout { text-align: right; }
.scene-readout code { overflow: hidden; color: #dffaff; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }

.touch-controls { display: flex; gap: 8px; }
.touch-controls button {
  width: 54px;
  height: 48px;
  border: 1px solid rgba(100, 232, 255, 0.45);
  background: rgba(100, 232, 255, 0.1);
  color: #dffaff;
  font-size: 19px;
  cursor: pointer;
  touch-action: none;
}
.touch-controls .interact-button {
  border-color: rgba(125, 255, 171, 0.58);
  color: #bfffd5;
}
.touch-controls .jump-button {
  border-color: rgba(255, 215, 122, 0.64);
  color: #ffe4a3;
  font-size: 14px;
}
.touch-controls .talk-button {
  border-color: rgba(255, 255, 255, 0.48);
  color: #efffff;
  font-size: 14px;
}
.touch-controls .interact-button:disabled,
.touch-controls .jump-button:disabled {
  border-color: rgba(126, 218, 239, 0.16);
  color: rgba(215, 244, 250, 0.28);
  cursor: not-allowed;
}

.map-error { display: grid; flex: 1; place-content: center; gap: 16px; text-align: center; }
.map-error button { padding: 9px 13px; border: 1px solid var(--line); background: rgba(100, 232, 255, 0.1); color: #dffaff; }

.theme-fantasy {
  --cyan: #e2bd6c;
  --line: rgba(226, 189, 108, 0.42);
  border-color: #76552c;
  background: #1b130b;
  color: #f4e7c6;
  font-family: "Yu Mincho", "Hiragino Mincho ProN", Georgia, serif;
}

.theme-fantasy .map-header,
.theme-fantasy .map-hud {
  border-color: rgba(226, 189, 108, 0.42);
  background:
    linear-gradient(90deg, rgba(55, 32, 15, 0.98), rgba(31, 20, 11, 0.98)),
    repeating-linear-gradient(90deg, transparent 0 80px, rgba(255, 222, 151, 0.04) 81px);
  box-shadow: inset 0 0 24px rgba(10, 5, 1, 0.52);
}

.theme-fantasy .map-header h1 { color: #fff0c9; letter-spacing: 0.04em; }
.theme-fantasy .map-header p,
.theme-fantasy .header-meta span,
.theme-fantasy .position-readout span,
.theme-fantasy .scene-readout span { color: #e2bd6c; }
.theme-fantasy .header-meta code,
.theme-fantasy .position-readout small,
.theme-fantasy .scene-readout small { color: rgba(244, 231, 198, 0.58); }
.theme-fantasy .back-button,
.theme-fantasy .touch-controls button {
  border-color: #9b7339;
  background: linear-gradient(180deg, rgba(104, 68, 30, 0.78), rgba(48, 29, 14, 0.92));
  color: #ffe7aa;
  box-shadow: inset 0 0 0 2px rgba(255, 225, 159, 0.08);
}

.theme-fantasy .map-toolbar {
  border-color: rgba(226, 189, 108, 0.35);
  background: #2b1c0e;
}
.theme-fantasy .map-toolbar span { color: #f0cd7a; }
.theme-fantasy .map-toolbar p { color: rgba(244, 231, 198, 0.68); }
.theme-fantasy .runtime-character-selector select { background:#2b1c0e; color:#ffe7aa; }
.theme-fantasy .runtime-zoom-selector select { background:#2b1c0e; color:#ffe7aa; }
.theme-fantasy .map-viewport,
.theme-fantasy .area-data-grid {
  scrollbar-color: #c99445 #241508;
  scrollbar-width: thin;
}
.theme-fantasy .map-viewport::-webkit-scrollbar,
.theme-fantasy .area-data-grid::-webkit-scrollbar {
  width: 11px;
  height: 11px;
}
.theme-fantasy .map-viewport::-webkit-scrollbar-track,
.theme-fantasy .area-data-grid::-webkit-scrollbar-track {
  border: 1px solid #6f4b24;
  border-radius: 2px;
  background:
    repeating-linear-gradient(90deg, rgba(255, 220, 145, 0.035) 0 5px, transparent 6px 11px),
    #241508;
  box-shadow: inset 0 0 4px rgba(5, 2, 1, 0.72);
}
.theme-fantasy .map-viewport::-webkit-scrollbar-thumb,
.theme-fantasy .area-data-grid::-webkit-scrollbar-thumb {
  border: 2px solid #2a190b;
  border-radius: 2px;
  background:
    linear-gradient(180deg, #efd28e 0%, #bd853d 45%, #775025 100%);
  box-shadow:
    inset 0 0 0 1px rgba(255, 238, 190, 0.28),
    0 0 4px rgba(8, 3, 1, 0.7);
}
.theme-fantasy .map-viewport::-webkit-scrollbar-thumb:hover,
.theme-fantasy .area-data-grid::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #ffe7a6 0%, #d79b4c 48%, #8f612d 100%);
}
.theme-fantasy .map-viewport::-webkit-scrollbar-corner,
.theme-fantasy .area-data-grid::-webkit-scrollbar-corner {
  background: #241508;
}

.theme-fantasy .map-lower {
  border-color: rgba(226, 189, 108, 0.42);
  background:
    radial-gradient(circle at 50% 0, rgba(144, 103, 47, 0.2), transparent 48%),
    linear-gradient(180deg, #2d2113, #160f08);
}
.theme-fantasy .minimap-heading p,
.theme-fantasy .minimap-legend { color: rgba(244, 231, 198, 0.62); }
.theme-fantasy .minimap {
  border-color: #9c763d;
  background:
    linear-gradient(rgba(104, 75, 38, 0.16) 1px, transparent 1px),
    linear-gradient(90deg, rgba(104, 75, 38, 0.16) 1px, transparent 1px),
    #dac58f;
  background-size: 24px 24px;
  box-shadow: inset 0 0 22px rgba(72, 43, 16, 0.32);
}
.theme-fantasy .minimap-route {
  border-color: rgba(83, 55, 25, 0.72);
  background: rgba(101, 66, 28, 0.38);
}
.theme-fantasy .mini-point,
.theme-fantasy .mini-player { border-color: #4b3217; background: #f0d994; }
.theme-fantasy .mini-point.spawn { border-color: #896222; }
.theme-fantasy .mini-point.entrance { border-color: #426629; background: #88a35d; }
.theme-fantasy .mini-point.junction { border-color: #754c28; background: #c08a47; }
.theme-fantasy .mini-player { background: #fff4c7; box-shadow: 0 0 8px #fff0a0; }
.theme-fantasy .mini-viewport {
  border-color: rgba(93, 54, 20, 0.76);
  background: rgba(122, 76, 31, 0.14);
}
.theme-fantasy .area-data-grid article {
  border-color: rgba(226, 189, 108, 0.26);
  background: rgba(58, 39, 20, 0.78);
}
.theme-fantasy .area-data-grid code,
.theme-fantasy .scene-readout code { color: rgba(255, 238, 198, 0.78); }

.theme-fantasy .map-world {
  background:
    linear-gradient(180deg, #707f72 0%, #b0a878 48%, #51452a 100%),
    repeating-linear-gradient(90deg, transparent 0 119px, rgba(55, 42, 20, 0.1) 120px);
}
.theme-fantasy .sky-layer {
  background:
    radial-gradient(circle at 76% 18%, rgba(255, 238, 166, 0.68), transparent 10%),
    linear-gradient(180deg, rgba(116, 145, 145, 0.2), rgba(238, 198, 118, 0.18));
}
.theme-fantasy .far-structures {
  opacity: 0.62;
  background: repeating-linear-gradient(90deg, transparent 0 150px, rgba(49, 63, 43, 0.72) 151px 250px, transparent 251px 330px);
}
.theme-fantasy .mid-structures {
  opacity: 0.74;
  background: repeating-linear-gradient(90deg, #33452d 0 95px, #24341f 96px 220px);
}
.theme-fantasy .scan-layer {
  background-image:
    radial-gradient(circle at 20px 25px, rgba(246, 222, 153, 0.08) 0 2px, transparent 3px),
    linear-gradient(90deg, rgba(45, 35, 18, 0.05), transparent 18%, rgba(255, 231, 166, 0.04) 52%, transparent);
  background-size: 80px 62px, 100% 100%;
}
.theme-fantasy .ground {
  border-top-color: #9db36c;
  background:
    linear-gradient(180deg, rgba(75, 94, 47, 0.96) 0 12px, transparent 13px),
    repeating-linear-gradient(135deg, #49351e 0 22px, #342515 23px 44px);
  box-shadow: 0 -9px 20px rgba(202, 218, 133, 0.12);
}
.theme-fantasy .platform {
  border-color: #d6b06a;
  background: repeating-linear-gradient(90deg, #76502b 0 32px, #4c321c 33px 64px);
}
.theme-fantasy .platform code { color: rgba(255, 232, 180, 0.64); }

.theme-fantasy .map-marker {
  border: 2px solid #b58a47;
  border-radius: 4px;
  background: linear-gradient(180deg, rgba(64, 43, 22, 0.97), rgba(36, 25, 14, 0.98));
  color: #fff0c9;
  box-shadow: inset 0 0 0 2px rgba(244, 211, 139, 0.08);
}
.theme-fantasy .map-marker span,
.theme-fantasy .exit-marker span { color: #e8c777; }
.theme-fantasy .map-marker code { color: rgba(244, 231, 198, 0.58); }
.theme-fantasy .exit-marker.entrance-marker {
  border-color: #789752;
  background: linear-gradient(180deg, rgba(48, 74, 35, 0.97), rgba(27, 45, 22, 0.98));
}
.theme-fantasy .exit-marker.entrance-marker span { color: #cbe19c; }
.theme-fantasy .exit-marker.junction-marker {
  border-color: #c18a49;
  background: linear-gradient(180deg, rgba(87, 53, 26, 0.97), rgba(47, 30, 17, 0.98));
}
.theme-fantasy .exit-marker.junction-marker span { color: #f2c986; }
.theme-fantasy .destination-sign {
  border-color: #d3ab59;
  border-radius: 3px;
  background: #57391c;
  color: #ffe5a6;
  box-shadow: 0 3px 12px rgba(33, 19, 7, 0.46);
}
.theme-fantasy .spawn-marker { border-color: #b08a4e; }
.theme-fantasy .event-marker { border-color: #b987bb; }

.theme-fantasy .depth-road::before {
  border-color: rgba(205, 179, 111, 0.76);
  background: repeating-linear-gradient(90deg, rgba(122, 100, 57, 0.52) 0 14px, rgba(73, 55, 29, 0.62) 15px 30px);
}
.theme-fantasy .depth-road span { color: #fff0bd; text-shadow: 0 1px 3px #2b1708; }
.theme-fantasy .player.highlighted { filter: drop-shadow(0 0 8px rgba(255, 224, 137, 0.72)); }
.theme-fantasy .player-core {
  border-color: #ffe7a1;
  background: rgba(211, 164, 73, 0.48);
}
.theme-fantasy .player-body {
  border-color: #e3bd68;
  background: rgba(90, 113, 56, 0.86);
}
.theme-fantasy .player small { color: #fff0c9; }
.theme-fantasy .speech-bubble {
  border-color: #9a7138;
  background: #f4e3b4;
  color: #35220e;
}
.theme-fantasy .speech-bubble::after {
  border-color: #9a7138;
  background: #f4e3b4;
}

.theme-fantasy.terrain-grassland .map-world { background: linear-gradient(#9bc98a, #d7d39a 58%, #4e743d); }
.theme-fantasy.terrain-forest .map-world { background: linear-gradient(#254b39, #547447 58%, #203b27); }
.theme-fantasy.terrain-wetland .map-world { background: linear-gradient(#6b8f85, #94a87c 56%, #344f45); }
.theme-fantasy.terrain-coast .map-world { background: linear-gradient(#75b9d0, #d6d19d 57%, #4f8da1); }
.theme-fantasy.terrain-desert .map-world { background: linear-gradient(#deb66b, #efd18a 58%, #9d6536); }
.theme-fantasy.terrain-snowfield .map-world { background: linear-gradient(#a8c8d9, #eef6ee 58%, #94aeb8); }
.theme-fantasy.terrain-mountain .map-world,
.theme-fantasy.terrain-canyon .map-world { background: linear-gradient(#8c8576, #b89d79 58%, #514636); }
.theme-fantasy.terrain-cave .map-world,
.theme-fantasy.terrain-underground_cave .map-world { background: linear-gradient(#17171b, #343038 58%, #121115); }
.theme-fantasy.terrain-volcanic .map-world { background: linear-gradient(#2b1b1a, #633229 58%, #170b09); }
.theme-fantasy.terrain-ruins .map-world { background: linear-gradient(#746f65, #a59b7c 58%, #49463e); }

@keyframes weatherFall {
  from { background-position: 0 -120px; }
  to { background-position: 70px 120px; }
}
@keyframes weatherDrift {
  from { background-position: 0 0, 0 0; }
  to { background-position: 240px 80px, -180px 60px; }
}

@keyframes playerStep {
  from { translate: 0 0; }
  to { translate: 0 -3px; }
}

/* Project typography rule. Map debug IDs stay compact, while instructions and values use 15px. */
.map-screen :is(button, input, select, textarea, label, p, strong) {
  font-size: var(--ui-font-size-body, 15px);
}
.map-screen :is(code, small, .map-marker span, .area-data-grid span, .minimap-legend, .mini-segment) {
  font-size: var(--ui-font-size-micro, 11px);
}
.speech-bubble,
.destination-sign {
  font-size: var(--ui-font-size-body, 15px);
}
</style>
