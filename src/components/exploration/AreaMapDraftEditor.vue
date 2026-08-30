<template>
  <div :class="['workspace-backdrop', themeClass]" role="presentation">
    <section class="workspace" role="dialog" aria-modal="true" aria-labelledby="workspace-title">
      <header class="workspace-header">
        <div>
          <p>LOCAL SOURCE / EXPLORATION WORKSPACE</p>
          <h2 id="workspace-title">{{ area.name }}</h2>
        </div>
        <div class="header-summary">
          <span>{{ area.width.toLocaleString() }} × {{ draft.height }}</span>
          <span>{{ draft.placements.length }} PLACEMENTS</span>
          <button type="button" aria-label="マップ編集を閉じる" @click="$emit('close')">×</button>
        </div>
      </header>

      <nav class="workspace-tabs" aria-label="マップ編集機能">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          :class="{ active: activeTab === tab.id }"
          :data-editor-tab="tab.id"
          @click="activeTab = tab.id"
        >
          <span>{{ tab.code }}</span>{{ tab.label }}
          <small v-if="tab.id === 'assets' && diagnostics.length">{{ diagnostics.length }}</small>
        </button>
      </nav>

      <div v-if="activeTab === 'layout'" class="layout-workspace">
        <aside class="tool-palette">
          <section class="map-part-palette">
            <span class="section-label">素材・部品</span>
            <button
              type="button"
              :class="{ active: !selectedPartId }"
              @click="activateObjectSelection"
            >選択・移動</button>
            <button
              v-for="part in mapPartLibrary.parts"
              :key="part.id"
              type="button"
              :class="{ active: selectedPartId === part.id }"
              :title="`${part.name}を選択してマップをクリック`"
              @click="chooseMapPart(part.id)"
            >{{ part.name }}</button>
            <small v-if="!mapPartLibrary.parts.length">先にヘッダーの「素材・部品」で作成</small>
          </section>
          <section class="background-layout-palette">
            <span class="section-label">背景画像</span>
            <button
              v-for="(layer, index) in draft.backgroundImages"
              :key="layer.id"
              type="button"
              :class="{ active: isSelected('background', layer.id) }"
              :title="`背景 #${index + 1} を選択して位置とサイズを調整`"
              @click="selectBackgroundForLayout(layer)"
            >背景 #{{ index + 1 }} {{ imageAssetName(layer.imageAssetId) }}</button>
            <small v-if="!draft.backgroundImages.length">「背景・キャラ」で背景画像を追加</small>
          </section>
          <section>
            <span class="section-label">ADD OBJECT</span>
            <button type="button" @click="addPlatform">＋ 足場</button>
            <button type="button" @click="addCollision">＋ 当たり判定</button>
            <button type="button" @click="addTile">＋ マップチップ</button>
            <button type="button" @click="addTerrainSegment('flat')">＋ 地面区間</button>
            <button type="button" @click="addTerrainSegment('step')">＋ 段差</button>
            <button type="button" @click="addTerrainSegment('slope')">＋ 坂</button>
            <button type="button" @click="addTerrainSegment('stairs')">＋ 階段</button>
            <button type="button" @click="addVerticalTransport('ladder')">＋ 梯子</button>
            <button type="button" @click="addVerticalTransport('elevator')">＋ エレベーター</button>
          </section>
          <section>
            <span class="section-label">PLACEMENT</span>
            <button
              v-for="type in assetCatalog.placementTypes"
              :key="type.id"
              type="button"
              @click="addPlacement(type)"
            >
              <i :class="`type-${type.id}`">{{ placementTypeShort(type.id) }}</i>
              {{ type.name }}
            </button>
          </section>
          <section>
            <span class="section-label">TERRAIN TEMPLATE</span>
            <button type="button" class="template-button" @click="applyTerrainTemplate">
              {{ area.terrainType }} を適用
            </button>
          </section>
        </aside>

        <section class="canvas-column">
          <div class="canvas-toolbar">
            <div>
              <button type="button" class="compact-icon-button" title="縮小" aria-label="マップを縮小" @click="zoom = Math.max(.1, zoom - .04)">−</button>
              <strong>{{ Math.round(zoom * 100) }}%</strong>
              <button type="button" class="compact-icon-button" title="拡大" aria-label="マップを拡大" @click="zoom = Math.min(.5, zoom + .04)">＋</button>
              <button
                type="button"
                class="compact-icon-button fit-button"
                title="マップ全体を画面幅に合わせる"
                aria-label="マップ全体を画面幅に合わせる"
                @click="zoom = fitZoom"
              >⛶</button>
            </div>
            <button
              type="button"
              class="tool-toggle"
              :class="{ active: snapEnabled }"
              :aria-pressed="snapEnabled"
              title="グリッド吸着を切り替える"
              @click="snapEnabled = !snapEnabled"
            ><span aria-hidden="true">⌗</span></button>
            <label class="grid-size-control" title="グリッド間隔">
              <span aria-hidden="true">↔</span>
              <input v-model.number="gridSize" aria-label="グリッド間隔" type="number" min="8" max="256" step="8">
            </label>
            <div class="test-controls">
              <button type="button" @click="moveTestPlayer(-1)">←</button>
              <label>TEST X <input v-model.number="testPlayerX" type="number" min="0" :max="area.width"></label>
              <button type="button" @click="moveTestPlayer(1)">→</button>
              <b :class="{ blocked: testCollision }">{{ testCollision ? `接触: ${testCollision.id}` : '通行可' }}</b>
            </div>
            <span class="drag-hint">本体をドラッグで移動 / 選択後に端をドラッグでサイズ変更</span>
          </div>
          <div class="view-filterbar" aria-label="マップ表示設定">
            <span class="filterbar-label">表示</span>
            <button
              v-for="filter in viewFilterOptions"
              :key="filter.id"
              type="button"
              class="filter-toggle"
              :class="{ active: viewFilters[filter.id] }"
              :title="filter.description"
              :aria-label="filter.description"
              :aria-pressed="viewFilters[filter.id]"
              :data-view-filter="filter.id"
              @click="viewFilters[filter.id] = !viewFilters[filter.id]"
            >
              <span aria-hidden="true">{{ filter.icon }}</span>
              <small>{{ filter.shortLabel }}</small>
            </button>
            <button
              type="button"
              class="filter-help"
              title="表示ボタンはクリックでON/OFF。マップ上の項目にカーソルを合わせると詳細を表示します"
              aria-label="表示切替の説明"
            >?</button>
          </div>
          <div ref="canvasScroller" class="canvas-scroller">
            <div
              ref="mapCanvas"
              class="map-canvas"
              :style="canvasStyle"
              @pointermove="dragMove"
              @pointerup="endDrag"
              @pointercancel="endDrag"
              @click="handleCanvasClick"
            >
              <div v-show="viewFilters.background" class="canvas-gradient" :style="gradientStyle"></div>
              <div
                v-for="(layer, index) in viewFilters.background ? draft.backgroundImages : []"
                :key="layer.id"
                class="canvas-background-image"
                :data-background-layer-id="layer.id"
                :style="backgroundImageLayerStyle(layer, index + 1)"
              ></div>
              <button
                v-if="selected.kind === 'background' && selectedObject"
                type="button"
                class="background-layout-box"
                :style="backgroundLayoutBoxStyle"
                aria-label="選択中の背景画像をドラッグして移動"
                @pointerdown.stop="startDrag($event, 'background', selectedObject)"
                @click.stop
              ><span>BG</span></button>
              <div v-show="viewFilters.terrain" class="canvas-ground" :style="{ top: scaled(draft.groundY) }"></div>

              <button
                v-for="part in draft.mapParts"
                :key="part.id"
                type="button"
                class="canvas-object map-part-object"
                :class="[`render-${part.renderLayer}`, { selected: isSelected('part', part.id) }]"
                :style="mapPartStyle(part)"
                :title="hoverTitle('素材・部品', part, mapPartById(part.partId)?.name || part.partId)"
                @pointerdown.stop="startDrag($event, 'part', part)"
                @click.stop="select('part', part.id)"
                @mouseenter="showHover('素材・部品', part, `${mapPartById(part.partId)?.name || part.partId} / ${renderLayerNames.find(layer => layer.id === part.renderLayer)?.label}`)"
                @mouseleave="clearHover"
              ><span v-if="viewFilters.labels">{{ mapPartById(part.partId)?.name || part.partId }}</span></button>

              <button
                v-for="segment in viewFilters.terrain ? draft.terrainSegments : []"
                :key="segment.id"
                type="button"
                class="canvas-object terrain-object"
                :class="[`terrain-${segment.type}`, { selected: isSelected('terrain', segment.id) }]"
                :style="terrainSegmentStyle(segment)"
                :title="hoverTitle(terrainTypeName(segment.type), segment, `${segment.startY} → ${segment.endY}`)"
                @pointerdown.stop="startDrag($event, 'terrain', segment)"
                @click.stop="select('terrain', segment.id)"
                @mouseenter="showHover(terrainTypeName(segment.type), segment, `幅 ${segment.width} / 高さ ${segment.startY} → ${segment.endY}`)"
                @mouseleave="clearHover"
              >
                <i v-if="['slope', 'stairs'].includes(segment.type)" class="terrain-direction-icon">
                  {{ segment.direction === 'left' ? '↖' : '↗' }}
                </i>
                <span v-if="viewFilters.labels">{{ segment.id }}</span>
              </button>

              <button
                v-for="transport in viewFilters.terrain ? draft.verticalTransports : []"
                :key="transport.id"
                type="button"
                class="canvas-object vertical-transport-object"
                :class="[`transport-${transport.type}`, { selected: isSelected('transport', transport.id) }]"
                :style="verticalTransportStyle(transport)"
                :title="hoverTitle(transport.type === 'ladder' ? '梯子' : 'エレベーター', transport, `${transport.bottomY} → ${transport.topY}`)"
                @pointerdown.stop="startDrag($event, 'transport', transport)"
                @click.stop="select('transport', transport.id)"
                @mouseenter="showHover(transport.type === 'ladder' ? '梯子' : 'エレベーター', transport, `上 ${transport.topY} / 下 ${transport.bottomY}`)"
                @mouseleave="clearHover"
              ><i>{{ transport.type === 'ladder' ? 'H' : 'EV' }}</i></button>

              <button
                v-for="zone in viewFilters.terrain ? draft.collisionZones : []"
                :key="zone.id"
                type="button"
                class="canvas-object collision-object"
                :class="{ selected: isSelected('collision', zone.id) }"
                :style="rectStyle(zone)"
                :title="hoverTitle('当たり判定', zone)"
                @pointerdown.stop="startDrag($event, 'collision', zone)"
                @click.stop="select('collision', zone.id)"
                @mouseenter="showHover('当たり判定', zone, `${zone.width} × ${zone.height}`)"
                @mouseleave="clearHover"
              ><span v-if="viewFilters.labels">{{ zone.id }}</span></button>

              <button
                v-for="platform in viewFilters.terrain ? draft.platforms : []"
                :key="platform.id"
                type="button"
                class="canvas-object platform-object"
                :class="{ selected: isSelected('platform', platform.id) }"
                :style="platformStyle(platform)"
                :title="hoverTitle('足場', platform)"
                @pointerdown.stop="startDrag($event, 'platform', platform)"
                @click.stop="select('platform', platform.id)"
                @mouseenter="showHover('足場', platform, `幅 ${platform.width}`)"
                @mouseleave="clearHover"
              ><span v-if="viewFilters.labels">{{ platform.id }}</span></button>

              <template v-for="layer in viewFilters.terrain ? draft.tileLayers : []" :key="layer.id">
                <button
                  v-for="tile in layer.visible ? layer.tiles : []"
                  :key="tile.id"
                  type="button"
                  class="canvas-object tile-object"
                  :class="{ selected: isSelected('tile', tile.id) }"
                  :style="tileStyle(tile, layer)"
                  :title="hoverTitle('マップチップ', tile, tile.assetId)"
                  @pointerdown.stop="startDrag($event, 'tile', tile, layer)"
                  @click.stop="select('tile', tile.id, layer.id)"
                  @mouseenter="showHover('マップチップ', tile, `${layer.name || layer.id} / ${tile.assetId}`)"
                  @mouseleave="clearHover"
                ><span v-if="viewFilters.labels">{{ tile.assetId }}</span></button>
              </template>

              <button
                v-for="placement in draft.placements.filter(placementFilter)"
                :key="placement.id"
                type="button"
                class="canvas-object placement-object"
                :class="[`type-${placement.type}`, { selected: isSelected('placement', placement.id), inactive: !placementVisible(placement) }]"
                :style="placementStyle(placement)"
                :title="hoverTitle(placementTypeName(placement.type), placement, placement.label)"
                @pointerdown.stop="startDrag($event, 'placement', placement)"
                @click.stop="select('placement', placement.id)"
                @mouseenter="showHover(placementTypeName(placement.type), placement, placement.assetId)"
                @mouseleave="clearHover"
              >
                <i>{{ placementTypeShort(placement.type) }}</i>
                <span v-if="viewFilters.labels">{{ placement.label }}</span>
              </button>

              <button
                v-for="handle in resizeHandles"
                :key="`resize-${handle.direction}`"
                type="button"
                class="resize-handle"
                :class="`resize-${handle.direction}`"
                :style="handle.style"
                :title="handle.title"
                :aria-label="handle.title"
                @pointerdown.stop.prevent="startResize($event, handle.direction)"
                @click.stop
              ></button>

              <span
                v-for="spawn in viewFilters.routes ? area.spawns : []"
                :key="spawn.id"
                class="locked-marker spawn"
                :style="{ left: scaled(spawn.x), top: scaled(draft.groundY) }"
                :title="hoverTitle('出現地点', spawn)"
                @mouseenter="showHover('出現地点', { ...spawn, y: draft.groundY })"
                @mouseleave="clearHover"
              >S<span v-if="viewFilters.labels"><br>{{ spawn.label }}</span></span>
              <span
                v-for="exit in viewFilters.routes ? area.exits : []"
                :key="exit.id"
                class="locked-marker exit"
                :style="{ left: scaled(exit.x ?? area.width / 2), top: scaled(draft.groundY) }"
                :title="hoverTitle('出口', { ...exit, x: exit.x ?? area.width / 2, y: draft.groundY }, exit.destinationArea)"
                @mouseenter="showHover('出口', { ...exit, x: exit.x ?? area.width / 2, y: draft.groundY }, `接続先: ${exit.destinationArea}`)"
                @mouseleave="clearHover"
              >E<span v-if="viewFilters.labels"><br>{{ exit.label }}</span></span>
              <span
                class="test-player"
                :class="{ blocked: testCollision, 'has-bone-motion': !!editorPlayerBoneMotionId }"
                :style="editorTestPlayerStyle"
                :title="`${selectedPlayerCharacter?.name || '仮プレイヤー'} / ${editorPlayerPresentation.displayWidth} × ${editorPlayerPresentation.displayHeight}px`"
              >
                <BoneMotionPlayer
                  v-if="editorPlayerBoneMotionId"
                  class="editor-bone-motion"
                  :project-id="selectedPlayerCharacter.motionProjectId"
                  :animation-id="editorPlayerBoneMotionId"
                  :width="editorPlayerPresentation.displayWidth"
                  :height="editorPlayerPresentation.displayHeight"
                  :style="{ transform: `scale(${zoom})` }"
                  :title="`${selectedPlayerCharacter.name}・待機モーション`"
                />
                <span v-else-if="editorPlayerGraphicSource" class="editor-player-graphic" :style="editorPlayerGraphicStyle"></span>
                <span v-else class="editor-player-placeholder">P</span>
                <small>{{ editorPlayerPresentation.displayWidth }}×{{ editorPlayerPresentation.displayHeight }}</small>
              </span>
            </div>
          </div>
          <aside v-if="hovered" class="hover-card" aria-live="polite">
            <span>{{ hovered.kind }}</span>
            <strong>{{ hovered.label }}</strong>
            <code>{{ hovered.id }}</code>
            <p>X {{ hovered.x ?? '-' }} / Y {{ hovered.y ?? '-' }}</p>
            <p v-if="hovered.detail">{{ hovered.detail }}</p>
          </aside>
          <div class="canvas-status">
            <span>選択: {{ selectedLabel }}</span>
            <span>X {{ selectedObject?.x ?? '-' }} / Y {{ selected.kind === 'background' && selectedObject ? backgroundLayerY(selectedObject) : selectedObject?.y ?? '-' }}</span>
            <span>背景画像も選択してドラッグ調整できます</span>
          </div>
        </section>

        <aside class="inspector">
          <header>
            <div><span>INSPECTOR</span><strong>{{ selectedLabel }}</strong></div>
            <button v-if="selected.kind !== 'map'" type="button" @click="removeSelected">削除</button>
          </header>

          <div v-if="selected.kind === 'map'" class="inspector-scroll">
            <h3>マップ基本</h3>
            <div class="field-grid map-core-fields">
              <label>高さ<input v-model.number="draft.height" type="number" min="320" max="2160"></label>
              <label>地面Y<input v-model.number="draft.groundY" type="number" min="0" :max="draft.height"></label>
              <label>使用するプレイヤー
                <select v-model="draft.playerPresentation.characterId" @change="syncPlayerCharacterId">
                  <option v-for="character in playerCharacters" :key="character.id" :value="character.id">{{ character.name }} / {{ character.id }}</option>
                </select>
              </label>
            </div>
            <p class="map-player-note">共通キャラクター: <strong>{{ selectedPlayerCharacter?.name || '未選択' }}</strong><span>{{ selectedPlayerCharacter?.id || 'キャラクター作成・管理でプレイヤーを追加してください' }}</span></p>
            <h3>環境演出</h3>
            <div class="check-grid">
              <label v-for="effect in assetCatalog.environmentEffects" :key="effect.id">
                <input v-model="draft.environmentEffects" type="checkbox" :value="effect.id">{{ effect.name }}
              </label>
            </div>
            <h3>ミニマップ</h3>
            <label>表示方式
              <select v-model="draft.minimap.mode">
                <option value="auto">配置から自動生成</option>
                <option value="custom">専用データを使用</option>
              </select>
            </label>
            <div class="check-grid">
              <label><input v-model="draft.minimap.fogOfWar" type="checkbox">未探索を隠す</label>
              <label><input v-model="draft.minimap.showPlacements" type="checkbox">配置物表示</label>
              <label><input v-model="draft.minimap.showEvents" type="checkbox">イベント表示</label>
            </div>
            <label>区画メモ<textarea v-model="draft.minimap.regionNotes" rows="4"></textarea></label>
            <h3>専用ミニマップ区画</h3>
            <button type="button" @click="addMinimapSegment">＋ 区画を追加</button>
            <article v-for="(segment, index) in draft.minimap.segments" :key="segment.id" class="minimap-segment-row">
              <label>表示名<input v-model.trim="segment.label"></label>
              <div class="field-grid">
                <label>開始X<input v-model.number="segment.startX" type="number" min="0" :max="area.width"></label>
                <label>終了X<input v-model.number="segment.endX" type="number" min="0" :max="area.width"></label>
              </div>
              <button type="button" @click="draft.minimap.segments.splice(index, 1)">削除</button>
            </article>
          </div>

          <div v-else-if="selectedObject" class="inspector-scroll">
            <label>ID<input :value="selectedObject.id" @change="renameSelected($event.target.value)"></label>
            <div class="field-grid">
              <label>X<input v-model.number="selectedObject.x" type="number" min="0" :max="area.width"></label>
              <label v-if="selected.kind === 'background'">表示Y<input :value="backgroundLayerY(selectedObject)" type="number" step="1" @change="setBackgroundY(selectedObject, $event.target.value)"></label>
              <label v-else-if="!['terrain', 'transport'].includes(selected.kind)">Y<input v-model.number="selectedObject.y" type="number" min="0" :max="draft.height"></label>
            </div>

            <template v-if="selected.kind === 'background'">
              <label>地面基準
                <select v-model="selectedObject.verticalAnchor" @change="applyBackgroundAnchor(selectedObject)">
                  <option value="free">自由配置</option>
                  <option value="aboveGround">地面の上に接地</option>
                  <option value="belowGround">地面の下から開始</option>
                </select>
              </label>
              <div class="field-grid">
                <label>幅<input v-model.number="selectedObject.width" type="number" min="32" step="1"></label>
                <label>高さ<input v-model.number="selectedObject.height" type="number" min="32" step="1"></label>
              </div>
              <label>表示方法
                <select v-model="selectedObject.fit"><option value="stretch">縦横に引き延ばす</option><option value="cover">範囲を覆う</option><option value="contain">全体を収める</option><option value="repeat">繰り返し</option></select>
              </label>
              <label>透明度<input v-model.number="selectedObject.opacity" type="number" min="0" max="1" step=".05"></label>
              <label class="switch"><input v-model="selectedObject.visible" type="checkbox">表示する</label>
              <p class="layer-help">ドラッグで自由配置に切り替わります。地面基準を選ぶと、地面Yを変えても接地位置を保ちます。</p>
            </template>

            <template v-else-if="selected.kind === 'part'">
              <label>使用部品
                <select v-model="selectedObject.partId">
                  <option v-for="part in mapPartLibrary.parts" :key="part.id" :value="part.id">{{ part.name }} / {{ part.id }}</option>
                </select>
              </label>
              <label>表示位置
                <select v-model="selectedObject.renderLayer">
                  <option v-for="layer in renderLayerNames" :key="layer.id" :value="layer.id">{{ layer.label }}</option>
                </select>
              </label>
              <label>同レイヤー内の重なり順 Z<input v-model.number="selectedObject.zOrder" type="number" min="-40" max="40" step="1" @change="selectedObject.zOrder = clampZOrder(selectedObject.zOrder)"></label>
              <div class="field-grid">
                <label>幅<input v-model.number="selectedObject.width" type="number" min="1" max="4000" @change="syncPartDimension(selectedObject, 'width')"></label>
                <label>高さ<input v-model.number="selectedObject.height" type="number" min="1" max="2160" @change="syncPartDimension(selectedObject, 'height')"></label>
              </div>
              <div class="check-grid">
                <label><input v-model="selectedObject.lockAspectRatio" type="checkbox">縦横比を維持</label>
                <label><input v-model="selectedObject.flipX" type="checkbox">左右反転</label>
                <label><input v-model="selectedObject.flipY" type="checkbox">上下反転</label>
                <label><input v-model="selectedObject.collision" type="checkbox">当たり判定あり</label>
              </div>
              <button type="button" class="reset-part-size-button" @click="resetPartSize(selectedObject)">切り出しサイズへ戻す</button>
            </template>

            <template v-else-if="selected.kind === 'placement'">
              <label>種類
                <select v-model="selectedObject.type" @change="applyPlacementDefault(selectedObject)">
                  <option v-for="type in assetCatalog.placementTypes" :key="type.id" :value="type.id">{{ type.name }}</option>
                </select>
              </label>
              <label>表示名<input v-model.trim="selectedObject.label"></label>
              <label>アセットID<input v-model.trim="selectedObject.assetId"></label>
              <label>表示位置
                <select v-model="selectedObject.renderLayer">
                  <option v-for="layer in renderLayerNames" :key="layer.id" :value="layer.id">{{ layer.label }}</option>
                </select>
              </label>
              <label>同レイヤー内の重なり順 Z<input v-model.number="selectedObject.zOrder" type="number" min="-40" max="40" step="1" @change="selectedObject.zOrder = clampZOrder(selectedObject.zOrder)"></label>
              <div class="field-grid">
                <label>幅<input v-model.number="selectedObject.width" type="number" min="8" max="2000"></label>
                <label>高さ<input v-model.number="selectedObject.height" type="number" min="8" max="1000"></label>
              </div>
              <label>必要EventFlag<input :value="formatArray(selectedObject.requiredEventFlags)" @input="selectedObject.requiredEventFlags = parseArray($event.target.value)"></label>
              <label>状態保存キー<input v-model.trim="selectedObject.stateKey" placeholder="省略時は配置ID"></label>

              <template v-if="selectedObject.type === 'npc'">
                <h3>NPC会話</h3>
                <label>呼び出すNPC
                  <select v-model="selectedObject.characterId">
                    <option v-for="character in npcCharacters" :key="character.id" :value="character.id">{{ character.name }} / {{ character.id }}</option>
                  </select>
                </label>
                <label>会話ID<input v-model.trim="selectedObject.dialogueId" placeholder="dialogue_forest_guide"></label>
                <label>所属・役割<input v-model.trim="selectedObject.faction"></label>
                <label>会話メモ<textarea v-model="selectedObject.dialogueMemo" rows="4"></textarea></label>
              </template>
              <template v-if="['enemy', 'boss'].includes(selectedObject.type)">
                <h3>敵編成</h3>
                <label>敵編成ID<input v-model.trim="selectedObject.enemyFormationId"></label>
                <label>遭遇方式
                  <select v-model="selectedObject.encounterMode">
                    <option value="touch">接触</option><option value="fixed">固定戦</option><option value="event">イベント戦</option>
                  </select>
                </label>
                <label class="switch"><input v-model="selectedObject.respawn" type="checkbox">再出現する</label>
              </template>
              <template v-if="['treasure', 'gathering'].includes(selectedObject.type)">
                <h3>報酬・採取</h3>
                <label>アイテムID<input v-model.trim="selectedObject.rewardItemId"></label>
                <div class="field-grid">
                  <label>個数<input v-model.number="selectedObject.rewardQuantity" type="number" min="1"></label>
                  <label>復活時間<input v-model.number="selectedObject.respawnSeconds" type="number" min="0"></label>
                </div>
              </template>
              <template v-if="selectedObject.type === 'hazard'">
                <h3>危険地帯</h3>
                <label>ダメージ種別<input v-model.trim="selectedObject.damageType"></label>
                <label>毎秒ダメージ<input v-model.number="selectedObject.damagePerSecond" type="number" min="0"></label>
              </template>
              <template v-if="['event', 'landmark', 'save_point'].includes(selectedObject.type)">
                <h3>機能設定</h3>
                <label>イベント・機能ID<input v-model.trim="selectedObject.eventId"></label>
              </template>
            </template>

            <template v-else-if="selected.kind === 'platform'">
              <label>幅<input v-model.number="selectedObject.width" type="number" min="32" :max="area.width"></label>
              <label class="switch"><input v-model="selectedObject.walkable" type="checkbox">歩行可能な足場</label>
            </template>
            <template v-else-if="selected.kind === 'terrain'">
              <label>地形形状
                <select v-model="selectedObject.type" @change="changeTerrainType(selectedObject)">
                  <option value="flat">地面区間</option>
                  <option value="step">段差</option>
                  <option value="slope">坂</option>
                  <option value="stairs">階段</option>
                </select>
              </label>
              <div class="field-grid">
                <label>横幅<input v-model.number="selectedObject.width" type="number" min="32" :max="area.width" @change="setTerrainManualWidth(selectedObject)"></label>
                <label v-if="selectedObject.type === 'stairs'">階段数<input v-model.number="selectedObject.steps" type="number" min="2" max="32"></label>
              </div>
              <div v-if="['slope', 'stairs'].includes(selectedObject.type)" class="field-grid slope-controls">
                <label>接続する下側地面Y<input v-model.number="selectedObject.baseY" type="number" min="0" :max="draft.height" @change="syncTerrainSlope(selectedObject)"></label>
                <label>登る高さ<input v-model.number="selectedObject.rise" type="number" min="16" :max="draft.height" @change="syncTerrainSlope(selectedObject)"></label>
                <label>登り方向
                  <select v-model="selectedObject.direction" @change="syncTerrainSlope(selectedObject)">
                    <option value="right">右へ登る ↗</option>
                    <option value="left">左へ登る ↖</option>
                  </select>
                </label>
                <label class="switch"><input v-model="selectedObject.autoWidth" type="checkbox" @change="syncTerrainSlope(selectedObject)">横幅を自動計算</label>
                <label>横幅倍率<input v-model.number="selectedObject.grade" type="number" min=".5" max="8" step=".25" :disabled="!selectedObject.autoWidth" @change="syncTerrainSlope(selectedObject)"></label>
                <small>横幅を直接入力すると自動計算はOFFになります。高さは「登る高さ」で変更します。</small>
              </div>
              <div v-else class="field-grid">
                <label>左端の地面Y<input v-model.number="selectedObject.startY" type="number" min="0" :max="draft.height" @change="syncTerrainMetadata(selectedObject)"></label>
                <label>右端の地面Y<input v-model.number="selectedObject.endY" type="number" min="0" :max="draft.height" @change="syncTerrainMetadata(selectedObject)"></label>
              </div>
              <label>地形アセットID<input v-model.trim="selectedObject.assetId"></label>
              <label>画像パス / URL<input v-model.trim="selectedObject.imageSource" placeholder="/images/exploration/ground.png"></label>
              <label>画像表示
                <select v-model="selectedObject.imageMode">
                  <option value="repeat">繰り返し</option>
                  <option value="cover">範囲を覆う</option>
                  <option value="contain">全体を収める</option>
                </select>
              </label>
            </template>
            <template v-else-if="selected.kind === 'transport'">
              <label>昇降設備
                <select v-model="selectedObject.type">
                  <option value="ladder">梯子</option>
                  <option value="elevator">エレベーター</option>
                </select>
              </label>
              <div class="field-grid">
                <label>幅<input v-model.number="selectedObject.width" type="number" min="24" max="320"></label>
                <label>移動速度<input v-model.number="selectedObject.speed" type="number" min="40" max="600"></label>
                <label>高さ・長さ<input :value="transportLength(selectedObject)" type="number" min="32" :max="draft.height" @change="setTransportLength(selectedObject, $event.target.value)"></label>
                <label>上端Y<input v-model.number="selectedObject.topY" type="number" min="0" :max="draft.height" @change="syncTransportMetadata(selectedObject)"></label>
                <label>下端Y<input v-model.number="selectedObject.bottomY" type="number" min="0" :max="draft.height" @change="syncTransportMetadata(selectedObject)"></label>
              </div>
              <small>高さ・長さを変更すると、下端Yを固定して上端を伸縮します。</small>
              <label>アセットID<input v-model.trim="selectedObject.assetId"></label>
              <label>画像パス / URL<input v-model.trim="selectedObject.imageSource" placeholder="/images/exploration/ladder.png"></label>
            </template>
            <template v-else-if="selected.kind === 'collision'">
              <div class="field-grid">
                <label>幅<input v-model.number="selectedObject.width" type="number" min="8"></label>
                <label>高さ<input v-model.number="selectedObject.height" type="number" min="8"></label>
              </div>
              <label>種別
                <select v-model="selectedObject.collisionType">
                  <option value="solid">壁・床</option><option value="one_way">一方向床</option><option value="damage">ダメージ</option><option value="fall">落下</option>
                </select>
              </label>
            </template>
            <template v-else-if="selected.kind === 'tile'">
              <label>アセットID<input v-model.trim="selectedObject.assetId"></label>
              <label>画像パス / URL<input v-model.trim="selectedObject.imageSource" placeholder="/images/exploration/tile.png"></label>
              <label>画像表示
                <select v-model="selectedObject.imageMode">
                  <option value="cover">範囲を覆う</option>
                  <option value="contain">全体を収める</option>
                  <option value="repeat">繰り返し</option>
                </select>
              </label>
              <label class="switch"><input v-model="selectedObject.collision" type="checkbox">当たり判定あり</label>
            </template>
          </div>
        </aside>
      </div>

      <div v-else-if="activeTab === 'settings'" class="background-settings-workspace">
        <section class="background-live-panel" aria-label="背景ライブプレビュー">
          <header>
            <div><strong>背景プレビュー</strong><small>変更はすぐ反映されます</small></div>
            <span>{{ Math.round(zoom * 100) }}%</span>
          </header>
          <div class="background-preview-scroller">
            <div
              class="background-live-preview"
              :style="canvasStyle"
              @pointermove="backgroundDragMove"
              @pointerup="endBackgroundDrag"
              @pointercancel="endBackgroundDrag"
            >
              <div class="canvas-gradient" :style="gradientStyle"></div>
              <div
                v-for="(layer, index) in draft.backgroundImages"
                :key="layer.id"
                class="canvas-background-image"
                :data-background-layer-id="layer.id"
                :style="backgroundImageLayerStyle(layer, index + 1)"
              ></div>
              <div class="background-ground-guide" :style="{ top: scaled(draft.groundY) }"><span>地面</span></div>
              <button
                v-if="backgroundSettingTab === 'images' && activeBackgroundLayer"
                type="button"
                class="background-transform-box"
                :style="backgroundTransformBoxStyle"
                aria-label="選択中の背景画像をドラッグして移動"
                @pointerdown.stop.prevent="startBackgroundDrag($event, 'move')"
              >
                <span>{{ activeBackgroundIndex + 1 }}</span>
              </button>
              <button
                v-for="handle in backgroundResizeHandles"
                :key="`background-resize-${handle.direction}`"
                type="button"
                class="background-resize-handle"
                :class="`background-resize-${handle.direction}`"
                :style="handle.style"
                :aria-label="handle.title"
                :title="handle.title"
                @pointerdown.stop.prevent="startBackgroundDrag($event, handle.direction)"
              ></button>
            </div>
          </div>
        </section>
        <nav class="background-setting-tabs" aria-label="背景とキャラクターの設定項目">
          <button
            v-for="tab in backgroundSettingTabs"
            :key="tab.id"
            type="button"
            :class="{ active: backgroundSettingTab === tab.id }"
            @click="backgroundSettingTab = tab.id"
          >{{ tab.label }}</button>
        </nav>
        <div class="panel-scroll settings-panel">
          <section v-if="backgroundSettingTab === 'gradient'" class="panel-card settings-tab-card">
          <header><span>01</span><h3>最奥背景・4方向グラデーション</h3></header>
          <p class="panel-note">最も奥は画像を使わず、上・右・下・左の4色を滑らかにつなげます。</p>
          <div class="gradient-settings" :style="gradientStyle">
            <label>上<input v-model="draft.backgroundGradient.top" type="color"></label>
            <label>右<input v-model="draft.backgroundGradient.right" type="color"></label>
            <label>下<input v-model="draft.backgroundGradient.bottom" type="color"></label>
            <label>左<input v-model="draft.backgroundGradient.left" type="color"></label>
          </div>
          </section>
          <section v-else-if="backgroundSettingTab === 'images'" class="panel-card settings-tab-card">
          <header><span>02</span><h3>背景画像レイヤー</h3><button type="button" class="background-add-button" @click="addBackgroundImage">＋ 背景を追加</button></header>
          <p class="panel-note">枚数は自由です。背景は常に地面より奥に表示されます。地面基準で接地するか、上のプレビュー／配置編集で自由に移動できます。</p>
          <div v-if="!draft.backgroundImages.length" class="empty-backgrounds">背景画像なし — 最奥グラデーションだけを表示します。</div>
          <div
            v-for="(layer, index) in draft.backgroundImages"
            :key="layer.id"
            class="background-row dynamic-background-row"
            :class="{ selected: activeBackgroundId === layer.id }"
            :data-background-layer-id="layer.id"
            @click="activeBackgroundId = layer.id"
          >
            <strong>#{{ index + 1 }}</strong>
            <label>画像
              <button type="button" class="background-image-picker-button" :aria-label="`背景画像を選択 #${index + 1}`" @click="openBackgroundImagePicker(layer)">
                <i v-if="layer.imageAssetId" :style="{ backgroundImage: `url(&quot;${mapAssetSource(layer.imageAssetId)}&quot;)` }"></i>
                <span><strong>{{ imageAssetName(layer.imageAssetId) }}</strong><small>{{ layer.imageAssetId || 'サムネイル一覧を開く' }}</small></span>
              </button>
            </label>
            <label>表示
              <select v-model="layer.fit"><option value="stretch">縦横に引き延ばす</option><option value="cover">範囲を覆う</option><option value="contain">全体を収める</option><option value="repeat">繰り返し</option></select>
            </label>
            <label>透明度<input v-model.number="layer.opacity" type="number" min="0" max="1" step=".05"></label>
            <label>速度<input v-model.number="layer.parallax" type="number" min="0" max="2" step=".05"></label>
            <label><input v-model="layer.visible" type="checkbox">表示</label>
            <button type="button" aria-label="背景画像レイヤーを削除" @click.stop="removeBackgroundImage(layer, index)">削除</button>
            <div class="background-transform-fields">
              <label>地面基準
                <select v-model="layer.verticalAnchor" @change="applyBackgroundAnchor(layer)">
                  <option value="free">自由配置</option>
                  <option value="aboveGround">地面の上に接地</option>
                  <option value="belowGround">地面の下から開始</option>
                </select>
              </label>
              <label>位置 X<input v-model.number="layer.x" type="number" step="1"></label>
              <label>表示 Y<input :value="backgroundLayerY(layer)" type="number" step="1" @change="setBackgroundY(layer, $event.target.value)"></label>
              <label>幅<input v-model.number="layer.width" type="number" min="32" step="1"></label>
              <label>高さ<input v-model.number="layer.height" type="number" min="32" step="1"></label>
              <button type="button" @click.stop="resetBackgroundFrame(layer)">マップ全面に戻す</button>
            </div>
          </div>
          </section>
          <section v-else-if="backgroundSettingTab === 'character'" class="panel-card settings-tab-card">
          <header><span>03</span><h3>歩行キャラクター</h3></header>
          <p class="panel-note">画像・スプライト・当たり判定は共通キャラクター設定で管理します。このマップでは、呼び出すプレイヤーだけを選びます。</p>
          <div class="settings-grid">
            <label>使用するプレイヤー
              <select v-model="draft.playerPresentation.characterId" @change="syncPlayerCharacterId">
                <option v-for="character in playerCharacters" :key="character.id" :value="character.id">{{ character.name }} / {{ character.id }}</option>
              </select>
            </label>
            <div class="character-library-summary"><span>共通設定</span><strong>{{ selectedPlayerCharacter?.name || '未選択' }}</strong><small>ゲストメニューの「キャラクター作成・管理」で追加・編集</small></div>
          </div>
          <h4 class="subsection-title">エリア共通の移動設定</h4>
          <div class="settings-grid">
            <label>自動で上れる段差<input v-model.number="draft.playerPresentation.maxStepUp" type="number" min="0" max="240"></label>
            <label>自動で下りる段差<input v-model.number="draft.playerPresentation.maxStepDown" type="number" min="0" max="360"></label>
            <label>ジャンプ高さ<input v-model.number="draft.playerPresentation.jumpHeight" type="number" min="0" max="360"></label>
            <label class="switch"><input v-model="draft.playerPresentation.flightEnabled" type="checkbox">飛行操作をON</label>
            <label>飛行速度<input v-model.number="draft.playerPresentation.flightSpeed" type="number" min="40" max="1000"></label>
          </div>
          </section>
          <section v-else class="panel-card settings-tab-card">
          <header><span>04</span><h3>会話・案内文</h3></header>
          <textarea :value="draft.speechLines.join('\n')" rows="7" @input="draft.speechLines = parseLines($event.target.value)"></textarea>
          </section>
        </div>
      </div>

      <div v-else-if="activeTab === 'connections'" class="panel-scroll connection-panel">
        <section class="connection-graph">
          <article class="area-node current"><span>CURRENT AREA</span><strong>{{ area.name }}</strong><code>{{ area.id }}</code></article>
          <div class="connection-lines" aria-hidden="true"></div>
          <article v-for="exit in area.exits" :key="exit.id" class="area-node destination">
            <span>{{ exit.connectionType || 'EXIT' }}</span>
            <strong>{{ areaName(exit.destinationArea) }}</strong>
            <code>{{ exit.destinationArea }} / {{ exit.destinationSpawn }}</code>
            <small>{{ exit.label }}</small>
          </article>
          <p v-if="!area.exits.length" class="empty-panel">接続は未設定です。エリア基本設定の出口から追加できます。</p>
        </section>
        <aside class="connection-audit">
          <h3>接続診断</h3>
          <p v-if="!connectionWarnings.length" class="success">接続先と出現地点はすべて解決できます。</p>
          <p v-for="warning in connectionWarnings" :key="warning" class="warning">{{ warning }}</p>
          <h3>入口一覧</h3>
          <article v-for="spawn in area.spawns" :key="spawn.id"><strong>{{ spawn.label }}</strong><code>{{ spawn.id }} / X{{ spawn.x }}</code></article>
        </aside>
      </div>

      <div v-else-if="activeTab === 'simulation'" class="panel-scroll simulation-panel">
        <section class="panel-card">
          <header><span>EVENT FLAG</span><h3>物語条件プレビュー</h3></header>
          <div class="flag-grid">
            <label v-for="flag in eventFlags" :key="flag.id">
              <input v-model="previewFlags[flag.id]" type="checkbox">
              <span><strong>{{ flag.label }}</strong><code>{{ flag.id }}</code></span>
            </label>
          </div>
        </section>
        <section class="panel-card">
          <header><span>AREA STATE</span><h3>現在状態テスト</h3></header>
          <p class="panel-note">これはゲーム中のセーブではありません。このエリアを初めて開いたときの警報・ボス撃破・配置物状態を <code>areaStateDefaults.json</code> へ保存します。左側の物語条件プレビューは保存されません。</p>
          <div class="state-grid">
            <label>警報状態
              <select v-model="stateDraft.alarmState"><option value="normal">通常</option><option value="alert">警戒</option><option value="emergency">非常</option></select>
            </label>
            <label class="switch"><input v-model="stateDraft.clearedBoss" type="checkbox">ボス撃破済み</label>
          </div>
          <div class="simulation-list">
            <article v-for="placement in draft.placements" :key="placement.id" :class="{ inactive: !placementVisible(placement) }">
              <i :class="`type-${placement.type}`">{{ placementTypeShort(placement.type) }}</i>
              <div><strong>{{ placement.label }}</strong><code>{{ placement.id }}</code></div>
              <span>{{ placementVisible(placement) ? '表示' : '条件未達' }}</span>
              <button type="button" @click="togglePlacementState(placement)">{{ placementStateApplied(placement) ? '状態解除' : '変更済みにする' }}</button>
            </article>
          </div>
          <div class="state-save-actions">
            <button type="button" @click="emitStateSave">状態テストの初期値を保存</button>
          </div>
        </section>
      </div>

      <div v-else class="panel-scroll asset-panel">
        <section class="diagnostic-summary">
          <article><span>CHARACTER</span><strong>{{ characterLibrary.characters.length }}</strong></article>
          <article><span>BACKGROUND</span><strong>{{ assetCatalog.backgroundSets.length }}</strong></article>
          <article><span>TILE SET</span><strong>{{ assetCatalog.tileSets.length }}</strong></article>
          <article><span>PLACEHOLDER</span><strong>{{ placeholderCount }}</strong></article>
        </section>
        <section class="panel-card">
          <header><span>ASSET AUDIT</span><h3>差し替え・設定漏れ</h3></header>
          <p v-if="!diagnostics.length" class="success">素材IDの設定漏れはありません。</p>
          <p v-for="item in diagnostics" :key="item" class="warning">{{ item }}</p>
        </section>
        <section class="panel-card asset-list">
          <header><span>PLACEMENT ASSETS</span><h3>現在使用中</h3></header>
          <article v-for="placement in draft.placements" :key="placement.id">
            <i :class="`type-${placement.type}`">{{ placementTypeShort(placement.type) }}</i>
            <strong>{{ placement.label }}</strong><code>{{ placement.assetId || '未設定' }}</code>
          </article>
        </section>
      </div>

      <footer class="workspace-footer">
        <p v-if="validationMessages.length" class="validation">{{ validationMessages.join(' / ') }}</p>
        <p v-else-if="saveNotice" :class="['workspace-save-notice', { error: saveNoticeError }]" role="status">{{ saveNotice }}</p>
        <p v-else>マップ保存先：areaMapDrafts.json　保存しても画面は閉じません</p>
        <div>
          <button type="button" @click="$emit('close')">閉じる</button>
          <button type="button" class="save-button" :disabled="validationMessages.length > 0" @click="emitMapSave">マップをJSONへ保存</button>
        </div>
      </footer>
      <ImageAssetPickerModal
        v-if="imagePickerOpen"
        title="背景画像を選択"
        :selected-id="imagePickerLayer?.imageAssetId || ''"
        :directories="['locations']"
        @close="closeImagePicker"
        @clear="clearBackgroundImage"
        @select="selectBackgroundImage"
      />
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import ImageAssetPickerModal from '@/components/common/ImageAssetPickerModal.vue'
import BoneMotionPlayer from '@/components/motion/BoneMotionPlayer.vue'
import { backgroundGradientStyle, croppedMapPartStyle, mapAssetSource } from '@/utils/explorationMapAssets.js'
import { spriteSheetFrameStyle } from '@/utils/spriteSheet.js'

const props = defineProps({
  area: { type: Object, required: true },
  mapDraft: { type: Object, required: true },
  areaState: { type: Object, default: () => ({}) },
  allAreas: { type: Array, default: () => [] },
  eventFlags: { type: Array, default: () => [] },
  assetCatalog: { type: Object, required: true },
  characterLibrary: { type: Object, required: true },
  mapPartLibrary: { type: Object, default: () => ({ parts: [] }) }
})
const emit = defineEmits(['close', 'save', 'save-state'])
const clone = value => JSON.parse(JSON.stringify(value))
const draft = reactive(clone(props.mapDraft))
const stateDraft = reactive(clone(props.areaState))
const activeTab = ref('layout')
const saveNotice = ref('')
const saveNoticeError = ref(false)
const backgroundSettingTabs = [
  { id: 'gradient', label: 'グラデーション' },
  { id: 'images', label: '背景画像' },
  { id: 'character', label: 'キャラクター' },
  { id: 'speech', label: '会話・案内文' }
]
const backgroundSettingTab = ref('gradient')
const imagePickerOpen = ref(false)
const imagePickerLayer = ref(null)
const activeBackgroundId = ref('')
const backgroundDrag = reactive({ active: false, mode: '', item: null, element: null, startX: 0, startY: 0, originX: 0, originY: 0, originWidth: 0, originHeight: 0 })
const canvasScroller = ref(null)
const mapCanvas = ref(null)
const zoom = ref(.5)
const fitZoom = ref(.34)
const snapEnabled = ref(true)
const gridSize = ref(32)
const selectedPartId = ref('')
const locationImages = ref([])
const testPlayerX = ref(props.area.spawns.find(spawn => spawn.id === props.area.defaultSpawn)?.x ?? 180)
const selected = reactive({ kind: 'map', id: '', layerId: '' })
const previewFlags = reactive(Object.fromEntries(props.eventFlags.map(flag => [flag.id, flag.defaultValue])))
const drag = reactive({
  active: false, mode: '', direction: '', item: null, element: null,
  startX: 0, startY: 0, originX: 0, originY: 0
})
const hovered = ref(null)
const viewFilters = reactive({
  background: true,
  terrain: true,
  routes: true,
  npc: true,
  enemies: true,
  rewards: true,
  events: true,
  labels: false
})

const tabs = [
  { id: 'layout', code: '01', label: '配置編集' },
  { id: 'settings', code: '02', label: '背景・キャラ' },
  { id: 'connections', code: '03', label: 'エリア接続図' },
  { id: 'simulation', code: '04', label: '状態テスト' },
  { id: 'assets', code: '05', label: '素材診断' }
]
const viewFilterOptions = [
  { id: 'background', icon: 'BG', shortLabel: '背景', description: '遠景・中景・前景を表示します' },
  { id: 'terrain', icon: '▦', shortLabel: '地形', description: '地面、足場、マップチップ、当たり判定を表示します' },
  { id: 'routes', icon: '⇄', shortLabel: '移動', description: '出現地点とエリア移動出口を表示します' },
  { id: 'npc', icon: 'N', shortLabel: 'NPC', description: '会話キャラクターを表示します' },
  { id: 'enemies', icon: 'E', shortLabel: '敵', description: '敵とボスの配置を表示します' },
  { id: 'rewards', icon: '◇', shortLabel: '報酬', description: '宝箱と採取地点を表示します' },
  { id: 'events', icon: '!', shortLabel: 'イベント', description: 'イベント、ランドマーク、セーブ地点、地形ダメージを表示します' },
  { id: 'labels', icon: 'Aa', shortLabel: 'ラベル', description: 'マップ上に名称を常時表示します。密集時はオフを推奨します' }
]
const backgroundLayerNames = [
  { id: 'far', label: '遠景' }, { id: 'mid', label: '中景' }, { id: 'foreground', label: '前景' }
]
const renderLayerNames = [
  { id: 'background', label: '地面の後ろ' },
  { id: 'behindPlayer', label: '地面の前・プレイヤーの後ろ' },
  { id: 'frontPlayer', label: 'プレイヤーの前' },
  { id: 'foreground', label: '最前面' }
]
const playerCharacters = computed(() => props.characterLibrary.characters.filter(character => character.kind === 'player'))
const npcCharacters = computed(() => props.characterLibrary.characters.filter(character => character.kind === 'npc'))
const themeClass = computed(() => areaTheme(props.area))
const areaTheme = area => area.mapUiTheme === 'fantasy' ? 'theme-fantasy' : 'theme-sf'
const parseArray = value => value.split(',').map(item => item.trim()).filter(Boolean)
const parseLines = value => value.split(/\r?\n/).map(item => item.trim()).filter(Boolean)
const formatArray = value => (value ?? []).join(', ')

draft.height ||= 720
draft.groundY = Number.isFinite(draft.groundY) ? draft.groundY : 570
draft.platforms ||= []
for (const platform of draft.platforms) platform.walkable ??= true
draft.eventPoints ||= []
draft.speechLines ||= []
draft.environmentEffects ||= []
draft.backgroundLayers ||= {}
for (const [index, layer] of ['far', 'mid', 'foreground'].entries()) {
  draft.backgroundLayers[layer] ||= {
    assetId: props.area.backgrounds?.[index] ?? '',
    parallax: layer === 'far' ? .2 : layer === 'mid' ? .5 : 1.15,
    visible: true
  }
  draft.backgroundLayers[layer].imageSource ||= ''
  draft.backgroundLayers[layer].imageMode ||= 'cover'
}
draft.backgroundGradient ||= { top: '#102c38', right: '#173f4a', bottom: '#02080c', left: '#0a2029' }
draft.backgroundImages ||= []
if (!draft.backgroundImages.length) {
  const migrated = ['far', 'mid', 'foreground'].map((layer, index) => ({
    id: `background_${index + 1}`,
    imageAssetId: '',
    imageSource: draft.backgroundLayers[layer]?.imageSource || '',
    fit: draft.backgroundLayers[layer]?.imageMode || 'cover',
    opacity: 1,
    parallax: draft.backgroundLayers[layer]?.parallax ?? (index + 1) * .35,
    visible: draft.backgroundLayers[layer]?.visible !== false
  })).filter(layer => layer.imageSource)
  if (migrated.length) draft.backgroundImages.push(...migrated)
  else if (props.area.locationImage) draft.backgroundImages.push({
    id: 'background_1', imageAssetId: props.area.locationImage, imageSource: '', fit: 'cover', opacity: 1, parallax: .35, visible: true
  })
}
for (const layer of draft.backgroundImages) {
  layer.x ??= 0
  layer.y ??= 0
  layer.width ??= props.area.width
  layer.height ??= draft.height
  layer.verticalAnchor ||= 'free'
}
activeBackgroundId.value = draft.backgroundImages[0]?.id || ''
draft.playerPresentation ||= {
  characterId: 'placeholder_player', characterAssetId: 'placeholder_player', displayWidth: 42, displayHeight: 66,
  footOffsetX: 0, footOffsetY: 0, hitboxWidth: 26, hitboxHeight: 58,
  maxStepUp: 48, maxStepDown: 72, jumpHeight: 66, flightEnabled: false, flightSpeed: 260
}
draft.playerPresentation.maxStepUp ??= 48
draft.playerPresentation.maxStepDown ??= 72
draft.playerPresentation.jumpHeight ??= draft.playerPresentation.displayHeight ?? 66
draft.playerPresentation.flightEnabled ??= false
draft.playerPresentation.flightSpeed ??= 260
draft.playerPresentation.characterId ||= draft.playerPresentation.characterAssetId ?? playerCharacters.value[0]?.id ?? ''
draft.playerPresentation.characterAssetId = draft.playerPresentation.characterId
draft.tileLayers ||= []
draft.mapParts ||= []
for (const part of draft.mapParts) {
  part.lockAspectRatio ??= true
  part.renderLayer ||= 'behindPlayer'
  part.zOrder ??= 0
}
draft.placements ||= []
draft.collisionZones ||= []
draft.terrainSegments ||= []
for (const segment of draft.terrainSegments) {
  segment.type ||= 'flat'
  segment.width ||= 320
  segment.startY = Number.isFinite(segment.startY) ? segment.startY : (segment.y ?? draft.groundY)
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
draft.verticalTransports ||= []
for (const transport of draft.verticalTransports) {
  transport.type ||= 'ladder'
  transport.width ||= transport.type === 'elevator' ? 96 : 48
  transport.topY = Number.isFinite(transport.topY) ? transport.topY : draft.groundY - 240
  transport.bottomY = Number.isFinite(transport.bottomY) ? transport.bottomY : draft.groundY
  transport.y = Math.min(transport.topY, transport.bottomY)
  transport.speed ||= transport.type === 'elevator' ? 170 : 220
  transport.assetId ||= ''
  transport.imageSource ||= ''
}
draft.minimap ||= { mode: 'auto', fogOfWar: true, showPlacements: true, showEvents: true, regionNotes: '', segments: [] }
draft.minimap.segments ||= []
for (const key of ['openedDoors', 'defeatedEnemies', 'collectedItems', 'repairedFacilities', 'rescuedNpcs', 'unlockedExits']) {
  stateDraft[key] ||= []
}
stateDraft.alarmState ||= 'normal'
stateDraft.clearedBoss = stateDraft.clearedBoss === true
for (const placement of draft.placements) normalizePlacement(placement)
for (const layer of draft.tileLayers) {
  layer.tiles ||= []
  layer.visible = layer.visible !== false
  layer.tileSize ||= 64
  for (const [index, tile] of layer.tiles.entries()) tile.id ||= `${layer.id}_tile_${index + 1}`
}

function normalizePlacement(placement) {
  placement.requiredEventFlags ||= []
  placement.width ||= 42
  placement.height ||= 66
  placement.stateKey ||= ''
  placement.renderLayer ||= 'behindPlayer'
  placement.zOrder ??= 0
  if (placement.type === 'npc') {
    placement.characterId ||= npcCharacters.value[0]?.id ?? 'placeholder_npc'
    placement.dialogueId ||= ''
    placement.dialogueMemo ||= ''
    placement.faction ||= ''
  }
  if (['enemy', 'boss'].includes(placement.type)) {
    placement.enemyFormationId ||= ''
    placement.encounterMode ||= 'touch'
    placement.respawn = placement.respawn === true
  }
  if (['treasure', 'gathering'].includes(placement.type)) {
    placement.rewardItemId ||= ''
    placement.rewardQuantity ||= 1
    placement.respawnSeconds ||= 0
  }
  if (placement.type === 'hazard') {
    placement.damageType ||= 'terrain'
    placement.damagePerSecond ||= 0
  }
  if (['event', 'landmark', 'save_point'].includes(placement.type)) placement.eventId ||= ''
}

const selectedObject = computed(() => {
  if (selected.kind === 'background') return draft.backgroundImages.find(item => item.id === selected.id)
  if (selected.kind === 'platform') return draft.platforms.find(item => item.id === selected.id)
  if (selected.kind === 'terrain') return draft.terrainSegments.find(item => item.id === selected.id)
  if (selected.kind === 'transport') return draft.verticalTransports.find(item => item.id === selected.id)
  if (selected.kind === 'placement') return draft.placements.find(item => item.id === selected.id)
  if (selected.kind === 'collision') return draft.collisionZones.find(item => item.id === selected.id)
  if (selected.kind === 'part') return draft.mapParts.find(item => item.id === selected.id)
  if (selected.kind === 'tile') {
    return draft.tileLayers.find(layer => layer.id === selected.layerId)?.tiles.find(item => item.id === selected.id)
  }
  return null
})
const selectedPlayerCharacter = computed(() => playerCharacters.value.find(character => character.id === draft.playerPresentation.characterId) ?? null)
const editorPlayerPresentation = computed(() => ({
  ...draft.playerPresentation,
  ...(selectedPlayerCharacter.value ?? {}),
  displayWidth: selectedPlayerCharacter.value?.displayWidth ?? draft.playerPresentation.displayWidth ?? 42,
  displayHeight: selectedPlayerCharacter.value?.displayHeight ?? draft.playerPresentation.displayHeight ?? 66
}))
const editorPlayerBoneMotionId = computed(() => selectedPlayerCharacter.value?.motionProjectId
  ? selectedPlayerCharacter.value.motionStates?.idle || ''
  : '')
const editorPlayerAnimation = computed(() => selectedPlayerCharacter.value?.animations?.idle ?? null)
const editorPlayerGraphicSource = computed(() => editorPlayerAnimation.value?.imageSource || '')
const editorPlayerGraphicStyle = computed(() => spriteSheetFrameStyle(editorPlayerAnimation.value, 0))
const editorTestPlayerStyle = computed(() => ({
  left: scaled(testPlayerX.value + (editorPlayerPresentation.value.footOffsetX ?? 0)),
  top: scaled(testSurfaceY.value + (editorPlayerPresentation.value.footOffsetY ?? 0)),
  width: scaled(editorPlayerPresentation.value.displayWidth),
  height: scaled(editorPlayerPresentation.value.displayHeight)
}))
const mapPartById = partId => props.mapPartLibrary.parts.find(part => part.id === partId) ?? null
const syncPlayerCharacterId = () => { draft.playerPresentation.characterAssetId = draft.playerPresentation.characterId }
const selectedLabel = computed(() => selected.kind === 'map'
  ? 'マップ全体'
  : `${selected.kind.toUpperCase()} / ${selectedObject.value?.label || selectedObject.value?.id || '未選択'}`)
const resizeDirections = computed(() => {
  if (['terrain', 'platform'].includes(selected.kind)) return ['w', 'e']
  if (['background', 'transport', 'collision', 'part'].includes(selected.kind)) return ['n', 'e', 's', 'w']
  return []
})
const resizeHandlePoint = direction => {
  const item = selectedObject.value
  if (!item) return null
  if (selected.kind === 'terrain') {
    return direction === 'w'
      ? { x: item.x, y: item.startY }
      : { x: item.x + item.width, y: item.endY }
  }
  if (selected.kind === 'platform') {
    return { x: direction === 'w' ? item.x : item.x + item.width, y: item.y }
  }
  if (selected.kind === 'transport') {
    const top = Math.min(item.topY, item.bottomY)
    const bottom = Math.max(item.topY, item.bottomY)
    const displayWidth = Math.max(20, item.width * zoom.value)
    const left = item.x * zoom.value
    const right = left + displayWidth
    const center = (left + right) / 2
    if (direction === 'n') return { pixelX: center, y: top }
    if (direction === 's') return { pixelX: center, y: bottom }
    return { pixelX: direction === 'w' ? left : right, y: (top + bottom) / 2 }
  }
  if (selected.kind === 'collision') {
    if (direction === 'n') return { x: item.x + item.width / 2, y: item.y }
    if (direction === 's') return { x: item.x + item.width / 2, y: item.y + item.height }
    return { x: direction === 'w' ? item.x : item.x + item.width, y: item.y + item.height / 2 }
  }
  if (selected.kind === 'background') {
    const top = backgroundLayerY(item)
    if (direction === 'n') return { x: item.x + item.width / 2, y: top }
    if (direction === 's') return { x: item.x + item.width / 2, y: top + item.height }
    return { x: direction === 'w' ? item.x : item.x + item.width, y: top + item.height / 2 }
  }
  if (selected.kind === 'part') {
    if (direction === 'n') return { x: item.x + item.width / 2, y: item.y }
    if (direction === 's') return { x: item.x + item.width / 2, y: item.y + item.height }
    return { x: direction === 'w' ? item.x : item.x + item.width, y: item.y + item.height / 2 }
  }
  return null
}
const resizeHandles = computed(() => resizeDirections.value.map(direction => {
  const point = resizeHandlePoint(direction)
  const directionNames = { n: '上端', e: '右端', s: '下端', w: '左端' }
  return {
    direction,
    title: `${directionNames[direction]}をドラッグしてサイズ変更`,
    style: {
      left: point.pixelX === undefined ? scaled(point.x) : `${point.pixelX}px`,
      top: scaledCoordinate(point.y)
    }
  }
}))
const testCollision = computed(() => draft.collisionZones.find(zone => (
  testPlayerX.value >= zone.x && testPlayerX.value <= zone.x + zone.width
  && testSurfaceY.value >= zone.y && testSurfaceY.value <= zone.y + zone.height
)) ?? null)
const terrainSurfaceAt = x => {
  let surface = draft.groundY
  for (const segment of draft.terrainSegments) {
    if (x < segment.x || x > segment.x + segment.width) continue
    const ratio = Math.max(0, Math.min(1, (x - segment.x) / Math.max(1, segment.width)))
    surface = segment.startY + (segment.endY - segment.startY) * ratio
  }
  return surface
}
const testSurfaceY = computed(() => terrainSurfaceAt(testPlayerX.value))
const canvasStyle = computed(() => ({
  width: scaled(props.area.width),
  height: scaled(draft.height),
  '--grid-size': scaled(gridSize.value)
}))
const updateFitZoom = () => {
  const availableWidth = (canvasScroller.value?.clientWidth ?? 1200) - 36
  fitZoom.value = Math.max(.1, Math.min(.5, availableWidth / props.area.width))
}
const scaled = value => `${Math.max(0, value * zoom.value)}px`
const scaledCoordinate = value => `${Number(value || 0) * zoom.value}px`
const rectStyle = item => ({ left: scaled(item.x), top: scaled(item.y), width: scaled(item.width), height: scaled(item.height) })
const platformStyle = item => ({ left: scaled(item.x), top: scaled(item.y), width: scaled(item.width), height: `${Math.max(6, 18 * zoom.value)}px` })
const imageBackgroundStyle = item => item.imageSource ? {
  backgroundImage: `url("${item.imageSource.replaceAll('"', '\\"')}")`,
  backgroundSize: item.imageMode === 'repeat' ? 'auto' : item.imageMode,
  backgroundRepeat: item.imageMode === 'repeat' ? 'repeat' : 'no-repeat',
  backgroundPosition: 'center'
} : {}
const gradientStyle = computed(() => backgroundGradientStyle(draft.backgroundGradient))
const backgroundLayerY = layer => {
  if (layer.verticalAnchor === 'aboveGround') return Number(draft.groundY) - Math.max(1, Number(layer.height || draft.height))
  if (layer.verticalAnchor === 'belowGround') return Number(draft.groundY)
  return Number(layer.y || 0)
}
const setBackgroundY = (layer, value) => {
  layer.verticalAnchor = 'free'
  layer.y = Number(value) || 0
}
const applyBackgroundAnchor = layer => {
  layer.y = backgroundLayerY(layer)
}
const backgroundImageLayerStyle = (layer, index = 0) => {
  const source = layer.imageAssetId ? mapAssetSource(layer.imageAssetId) : layer.imageSource
  if (!source || layer.visible === false) return { display: 'none' }
  return {
    zIndex: 10 + Math.min(index, 19),
    opacity: layer.opacity ?? 1,
    left: scaledCoordinate(layer.x),
    top: scaledCoordinate(backgroundLayerY(layer)),
    right: 'auto',
    bottom: 'auto',
    width: scaled(layer.width ?? props.area.width),
    height: scaled(layer.height ?? draft.height),
    backgroundImage: `url("${source.replaceAll('"', '\\"')}")`,
    backgroundSize: layer.fit === 'stretch' ? '100% 100%' : layer.fit || 'cover',
    backgroundRepeat: layer.fit === 'repeat' ? 'repeat' : 'no-repeat',
    backgroundPosition: 'center'
  }
}
const activeBackgroundIndex = computed(() => draft.backgroundImages.findIndex(layer => layer.id === activeBackgroundId.value))
const activeBackgroundLayer = computed(() => draft.backgroundImages[activeBackgroundIndex.value] ?? null)
const backgroundTransformBoxStyle = computed(() => activeBackgroundLayer.value ? {
  left: scaledCoordinate(activeBackgroundLayer.value.x),
  top: scaledCoordinate(backgroundLayerY(activeBackgroundLayer.value)),
  width: scaled(activeBackgroundLayer.value.width),
  height: scaled(activeBackgroundLayer.value.height)
} : {})
const backgroundLayoutBoxStyle = computed(() => selected.kind === 'background' && selectedObject.value ? {
  left: scaledCoordinate(selectedObject.value.x),
  top: scaledCoordinate(backgroundLayerY(selectedObject.value)),
  width: scaled(selectedObject.value.width),
  height: scaled(selectedObject.value.height)
} : {})
const backgroundResizeHandles = computed(() => {
  const layer = activeBackgroundLayer.value
  if (backgroundSettingTab.value !== 'images' || !layer || layer.visible === false) return []
  const left = Number(layer.x || 0)
  const top = backgroundLayerY(layer)
  const width = Math.max(32, Number(layer.width || props.area.width))
  const height = Math.max(32, Number(layer.height || draft.height))
  const points = {
    n: { x: left + width / 2, y: top },
    e: { x: left + width, y: top + height / 2 },
    s: { x: left + width / 2, y: top + height },
    w: { x: left, y: top + height / 2 }
  }
  const names = { n: '上端', e: '右端', s: '下端', w: '左端' }
  return Object.entries(points).map(([direction, point]) => ({
    direction,
    title: `${names[direction]}をドラッグして背景画像を引き延ばす`,
    style: { left: scaledCoordinate(point.x), top: scaledCoordinate(point.y) }
  }))
})
const clampZOrder = value => Math.max(-40, Math.min(40, Math.round(Number(value) || 0)))
const objectRenderZ = item => ({ background: 40, behindPlayer: 200, frontPlayer: 400, foreground: 500 }[item.renderLayer] ?? 200) + clampZOrder(item.zOrder)
const mapPartStyle = item => {
  const part = mapPartById(item.partId)
  const width = Math.max(1, (item.width || part?.sourceRect?.width || 64) * zoom.value)
  const height = Math.max(1, (item.height || part?.sourceRect?.height || 64) * zoom.value)
  return {
    left: scaled(item.x), top: scaled(item.y), width: `${width}px`, height: `${height}px`,
    zIndex: objectRenderZ(item),
    transform: `scale(${item.flipX ? -1 : 1},${item.flipY ? -1 : 1})`,
    ...croppedMapPartStyle(part, width, height)
  }
}
const tileStyle = (tile, layer) => ({
  left: scaled(tile.x), top: scaled(tile.y), width: scaled(layer.tileSize), height: scaled(layer.tileSize),
  ...imageBackgroundStyle(tile)
})
const terrainSurfacePoints = item => {
  if (item.type !== 'stairs') return [{ x: 0, y: item.startY }, { x: 100, y: item.endY }]
  const steps = Math.max(2, Math.min(32, item.steps || 8))
  const points = [{ x: 0, y: item.startY }]
  for (let index = 1; index <= steps; index += 1) {
    const previousY = item.startY + (item.endY - item.startY) * ((index - 1) / steps)
    const nextY = item.startY + (item.endY - item.startY) * (index / steps)
    const x = index / steps * 100
    points.push({ x, y: previousY }, { x, y: nextY })
  }
  return points
}
const terrainSegmentStyle = item => {
  if (['slope', 'stairs'].includes(item.type)) {
    const top = Math.min(item.startY, item.endY)
    const modelHeight = Math.max(24, Math.abs(item.endY - item.startY) + 24)
    const point = ({ x, y }, offset = 0) => `${x}% ${Math.max(0, (y - top + offset) / modelHeight * 100)}%`
    const surface = terrainSurfacePoints(item)
    const band = [
      ...surface.map(value => point(value)),
      ...[...surface].reverse().map(value => point(value, 18))
    ]
    return {
      left: scaled(item.x),
      top: scaled(top),
      width: scaled(item.width),
      height: scaled(modelHeight),
      clipPath: `polygon(${band.join(',')})`,
      ...imageBackgroundStyle(item)
    }
  }
  const top = Math.min(item.startY, item.endY)
  const height = Math.max(24, draft.height - top)
  return {
    left: scaled(item.x),
    top: scaled(top),
    width: scaled(item.width),
    height: scaled(height),
    clipPath: `polygon(0 ${(item.startY - top) / height * 100}%,100% ${(item.endY - top) / height * 100}%,100% 100%,0 100%)`,
    ...imageBackgroundStyle(item)
  }
}
const verticalTransportStyle = item => ({
  left: scaled(item.x),
  top: scaled(Math.min(item.topY, item.bottomY)),
  width: `${Math.max(20, item.width * zoom.value)}px`,
  height: scaled(Math.max(32, Math.abs(item.bottomY - item.topY))),
  ...imageBackgroundStyle(item)
})
const placementStyle = item => ({
  left: scaled(item.x), top: scaled(item.y), width: `${Math.max(22, item.width * zoom.value)}px`,
  height: `${Math.max(28, item.height * zoom.value)}px`, zIndex: objectRenderZ(item)
})
const placementTypeShort = type => ({
  npc: 'N', enemy: 'E', boss: 'B', treasure: 'T', gathering: 'G',
  save_point: 'S', event: '!', landmark: 'L', hazard: 'H'
}[type] ?? '?')
const placementTypeName = type => props.assetCatalog.placementTypes.find(item => item.id === type)?.name ?? type
const terrainTypeName = type => ({
  flat: '地面区間', step: '段差', slope: '坂', stairs: '階段'
}[type] ?? '地形')
const placementFilter = placement => {
  if (placement.type === 'npc') return viewFilters.npc
  if (['enemy', 'boss'].includes(placement.type)) return viewFilters.enemies
  if (['treasure', 'gathering'].includes(placement.type)) return viewFilters.rewards
  return viewFilters.events
}
const showHover = (kind, item, detail = '') => {
  hovered.value = {
    kind,
    label: item.label || item.name || item.id,
    id: item.id,
    x: item.x,
    y: item.y,
    detail
  }
}
const clearHover = () => {
  hovered.value = null
}
const hoverTitle = (kind, item, detail = '') => [
  `${kind}: ${item.label || item.name || item.id}`,
  item.id,
  `X ${item.x ?? '-'} / Y ${item.y ?? '-'}`,
  detail
].filter(Boolean).join('\n')
const isSelected = (kind, id) => selected.kind === kind && selected.id === id
const select = (kind, id, layerId = '') => Object.assign(selected, { kind, id, layerId })
const selectMap = () => select('map', '')
const activateObjectSelection = () => {
  selectedPartId.value = ''
  selectMap()
}
const chooseMapPart = partId => {
  selectedPartId.value = partId
  selectMap()
}
const selectBackgroundForLayout = layer => {
  selectedPartId.value = ''
  activeBackgroundId.value = layer.id
  select('background', layer.id)
  revealAddedItem(Number(layer.x || 0) + Number(layer.width || props.area.width) / 2, backgroundLayerY(layer) + Number(layer.height || draft.height) / 2)
}
const snap = value => snapEnabled.value ? Math.round(value / gridSize.value) * gridSize.value : Math.round(value)
const nextId = (prefix, list) => {
  let index = list.length + 1
  while (list.some(item => item.id === `${prefix}_${index}`)) index += 1
  return `${prefix}_${index}`
}
const viewportCenterX = () => {
  const scroller = canvasScroller.value
  const canvas = mapCanvas.value
  if (!scroller || !canvas) return Math.round(props.area.width / 2)
  const visibleLeft = Math.max(0, (scroller.scrollLeft - canvas.offsetLeft) / zoom.value)
  const visibleRight = Math.min(
    props.area.width,
    (scroller.scrollLeft + scroller.clientWidth - canvas.offsetLeft) / zoom.value
  )
  if (visibleRight <= visibleLeft) return Math.round(props.area.width / 2)
  return snap((visibleLeft + visibleRight) / 2)
}
const centeredAddX = width => Math.max(0, Math.min(
  props.area.width - width,
  snap(viewportCenterX() - width / 2)
))
const revealAddedItem = (x, y) => {
  nextTick(() => {
    const scroller = canvasScroller.value
    const canvas = mapCanvas.value
    if (!scroller || !canvas) return
    const pixelX = canvas.offsetLeft + x * zoom.value
    const pixelY = canvas.offsetTop + y * zoom.value
    const margin = 40
    let nextLeft = scroller.scrollLeft
    let nextTop = scroller.scrollTop
    if (pixelX < scroller.scrollLeft + margin || pixelX > scroller.scrollLeft + scroller.clientWidth - margin) {
      nextLeft = Math.max(0, pixelX - scroller.clientWidth / 2)
    }
    if (pixelY < scroller.scrollTop + margin || pixelY > scroller.scrollTop + scroller.clientHeight - margin) {
      nextTop = Math.max(0, pixelY - scroller.clientHeight / 2)
    }
    scroller.scrollTo({ left: nextLeft, top: nextTop })
  })
}
const moveTestPlayer = direction => {
  testPlayerX.value = Math.max(0, Math.min(props.area.width, snap(testPlayerX.value + direction * gridSize.value)))
}

const addPlatform = () => {
  const width = 320
  const item = { id: nextId('platform', draft.platforms), x: centeredAddX(width), y: snap(draft.groundY - 140), width, walkable: true }
  draft.platforms.push(item)
  select('platform', item.id)
  revealAddedItem(item.x + item.width / 2, item.y)
}
const addCollision = () => {
  const width = 160
  const height = 96
  const item = {
    id: nextId('collision', draft.collisionZones),
    x: centeredAddX(width), y: snap(draft.groundY - height), width, height, collisionType: 'solid'
  }
  draft.collisionZones.push(item)
  select('collision', item.id)
  revealAddedItem(item.x + item.width / 2, item.y + item.height / 2)
}
const addTile = () => {
  let layer = draft.tileLayers[0]
  if (!layer) {
    layer = { id: 'tile_layer_1', name: '基本チップ', tileSize: 64, visible: true, tiles: [] }
    draft.tileLayers.push(layer)
  }
  const set = props.assetCatalog.tileSets.find(item => item.terrainType === props.area.terrainType)
  const item = {
    id: nextId(`${layer.id}_tile`, layer.tiles),
    assetId: set?.groundTop ?? '',
    imageSource: '',
    imageMode: 'cover',
    x: centeredAddX(layer.tileSize),
    y: snap(draft.groundY - layer.tileSize),
    collision: false
  }
  layer.tiles.push(item)
  select('tile', item.id, layer.id)
  revealAddedItem(item.x + layer.tileSize / 2, item.y + layer.tileSize / 2)
}
const addBackgroundImage = () => {
  const layer = {
    id: nextId('background', draft.backgroundImages), imageAssetId: '', imageSource: '',
    x: 0, y: 0, width: props.area.width, height: draft.height, verticalAnchor: 'free',
    fit: 'stretch', opacity: 1, parallax: Math.min(2, .25 + draft.backgroundImages.length * .25), visible: true
  }
  draft.backgroundImages.push(layer)
  activeBackgroundId.value = layer.id
}
const resetBackgroundFrame = layer => Object.assign(layer, { x: 0, y: 0, width: props.area.width, height: draft.height, verticalAnchor: 'free' })
const removeBackgroundImage = (layer, index) => {
  draft.backgroundImages.splice(index, 1)
  if (activeBackgroundId.value === layer.id) activeBackgroundId.value = draft.backgroundImages[Math.min(index, draft.backgroundImages.length - 1)]?.id || ''
}
const startBackgroundDrag = (event, mode) => {
  if (event.button !== 0 || !activeBackgroundLayer.value) return
  const layer = activeBackgroundLayer.value
  Object.assign(backgroundDrag, {
    active: true, mode, item: layer, element: event.currentTarget,
    startX: event.clientX, startY: event.clientY,
    originX: Number(layer.x || 0), originY: backgroundLayerY(layer),
    originWidth: Math.max(32, Number(layer.width || props.area.width)),
    originHeight: Math.max(32, Number(layer.height || draft.height))
  })
  event.currentTarget.setPointerCapture(event.pointerId)
}
const backgroundDragMove = event => {
  if (!backgroundDrag.active || !backgroundDrag.item) return
  const layer = backgroundDrag.item
  const deltaX = Math.round((event.clientX - backgroundDrag.startX) / zoom.value)
  const deltaY = Math.round((event.clientY - backgroundDrag.startY) / zoom.value)
  if (backgroundDrag.mode === 'move') {
    layer.verticalAnchor = 'free'
    layer.x = backgroundDrag.originX + deltaX
    layer.y = backgroundDrag.originY + deltaY
    return
  }
  if (backgroundDrag.mode === 'e') layer.width = Math.max(32, backgroundDrag.originWidth + deltaX)
  if (backgroundDrag.mode === 's') layer.height = Math.max(32, backgroundDrag.originHeight + deltaY)
  if (backgroundDrag.mode === 'w') {
    const right = backgroundDrag.originX + backgroundDrag.originWidth
    layer.width = Math.max(32, backgroundDrag.originWidth - deltaX)
    layer.x = right - layer.width
  }
  if (backgroundDrag.mode === 'n') {
    layer.verticalAnchor = 'free'
    const bottom = backgroundDrag.originY + backgroundDrag.originHeight
    layer.height = Math.max(32, backgroundDrag.originHeight - deltaY)
    layer.y = bottom - layer.height
  }
}
const endBackgroundDrag = event => {
  if (backgroundDrag.element?.hasPointerCapture?.(event.pointerId)) backgroundDrag.element.releasePointerCapture(event.pointerId)
  Object.assign(backgroundDrag, { active: false, mode: '', item: null, element: null })
}
const imageAssetName = assetId => {
  if (!assetId) return '画像を選択'
  return locationImages.value.find(image => image.id === assetId)?.name ?? assetId.split('/').at(-1)
}
const openBackgroundImagePicker = layer => {
  imagePickerLayer.value = layer
  imagePickerOpen.value = true
}
const closeImagePicker = () => {
  imagePickerOpen.value = false
  imagePickerLayer.value = null
}
const selectBackgroundImage = asset => {
  if (imagePickerLayer.value) {
    imagePickerLayer.value.imageAssetId = asset.id
    imagePickerLayer.value.imageSource = ''
  }
  closeImagePicker()
}
const clearBackgroundImage = () => {
  if (imagePickerLayer.value) {
    imagePickerLayer.value.imageAssetId = ''
    imagePickerLayer.value.imageSource = ''
  }
  closeImagePicker()
}
const partSourceSize = item => {
  const part = mapPartById(item?.partId)
  return {
    width: Math.max(1, Number(part?.sourceRect?.width) || 1),
    height: Math.max(1, Number(part?.sourceRect?.height) || 1)
  }
}
const syncPartDimension = (item, changedDimension) => {
  item.width = Math.max(1, Math.round(Number(item.width) || 1))
  item.height = Math.max(1, Math.round(Number(item.height) || 1))
  if (item.lockAspectRatio === false) return
  const source = partSourceSize(item)
  if (changedDimension === 'width') item.height = Math.max(1, Math.round(item.width * source.height / source.width))
  else item.width = Math.max(1, Math.round(item.height * source.width / source.height))
}
const resetPartSize = item => {
  const source = partSourceSize(item)
  item.width = source.width
  item.height = source.height
}
const addMapPartAt = event => {
  const part = mapPartById(selectedPartId.value)
  if (!part || !mapCanvas.value) return
  const canvasRect = mapCanvas.value.getBoundingClientRect()
  const rawX = (event.clientX - canvasRect.left) / zoom.value
  const rawY = (event.clientY - canvasRect.top) / zoom.value
  const useSnap = part.placementMode === 'grid' || snapEnabled.value
  const place = value => useSnap ? Math.round(value / gridSize.value) * gridSize.value : Math.round(value)
  const item = {
    id: nextId(part.id, draft.mapParts), partId: part.id,
    x: Math.max(0, Math.min(props.area.width, place(rawX))),
    y: Math.max(0, Math.min(draft.height, place(rawY))),
    width: part.sourceRect.width, height: part.sourceRect.height,
    flipX: false, flipY: false, lockAspectRatio: true, renderLayer: part.defaultRenderLayer, zOrder: 0,
    collision: part.defaultCollision === true
  }
  draft.mapParts.push(item)
  select('part', item.id)
}
const handleCanvasClick = event => {
  if (selectedPartId.value) addMapPartAt(event)
  else selectMap()
}
const addTerrainSegment = type => {
  const startY = type === 'step' ? draft.groundY - 96 : draft.groundY
  const endY = ['slope', 'stairs'].includes(type) ? draft.groundY - 160 : startY
  const grade = type === 'stairs' ? 2 : 3
  const width = type === 'flat' ? 512
    : ['slope', 'stairs'].includes(type) ? Math.abs(endY - startY) * grade : 384
  const x = centeredAddX(width)
  const set = props.assetCatalog.tileSets.find(item => item.terrainType === props.area.terrainType)
  const item = {
    id: nextId(type === 'stairs' ? 'stairs' : 'terrain', draft.terrainSegments),
    type,
    x,
    y: Math.min(startY, endY),
    width,
    startY,
    endY,
    baseY: Math.max(startY, endY),
    rise: Math.max(16, Math.abs(endY - startY)),
    direction: startY >= endY ? 'right' : 'left',
    steps: 8,
    autoWidth: ['slope', 'stairs'].includes(type),
    grade,
    assetId: set?.groundFill ?? '',
    imageSource: '',
    imageMode: 'repeat'
  }
  draft.terrainSegments.push(item)
  select('terrain', item.id)
  revealAddedItem(item.x + item.width / 2, (item.startY + item.endY) / 2)
}
const syncTerrainSlope = segment => {
  if (!segment || !['slope', 'stairs'].includes(segment.type)) return
  segment.baseY = Math.max(0, Math.min(draft.height, Number(segment.baseY) || draft.groundY))
  segment.rise = Math.max(16, Math.min(draft.height, Number(segment.rise) || 160))
  const upperY = Math.max(0, segment.baseY - segment.rise)
  if (segment.direction === 'left') {
    segment.startY = upperY
    segment.endY = segment.baseY
  } else {
    segment.startY = segment.baseY
    segment.endY = upperY
  }
  segment.grade ||= segment.type === 'stairs' ? 2 : 3
  if (segment.autoWidth) segment.width = Math.max(32, snap(segment.rise * segment.grade))
  segment.y = Math.min(segment.startY, segment.endY)
}
const setTerrainManualWidth = segment => {
  segment.width = Math.max(32, Math.min(props.area.width, Number(segment.width) || 32))
  if (['slope', 'stairs'].includes(segment.type)) segment.autoWidth = false
}
const syncTerrainMetadata = segment => {
  segment.baseY = Math.max(segment.startY, segment.endY)
  segment.rise = Math.max(0, Math.abs(segment.endY - segment.startY))
  segment.direction = segment.startY >= segment.endY ? 'right' : 'left'
  segment.y = Math.min(segment.startY, segment.endY)
}
const changeTerrainType = segment => {
  if (['slope', 'stairs'].includes(segment.type)) {
    segment.autoWidth = true
    segment.grade = segment.type === 'stairs' ? 2 : 3
    segment.baseY = Math.max(segment.startY, segment.endY)
    segment.rise = Math.max(16, Math.abs(segment.endY - segment.startY) || 160)
    segment.direction = segment.startY >= segment.endY ? 'right' : 'left'
  }
  syncTerrainSlope(segment)
}
const syncTransportMetadata = transport => {
  const firstY = Math.max(0, Math.min(draft.height, Number(transport.topY) || 0))
  const secondY = Math.max(0, Math.min(draft.height, Number(transport.bottomY) || 0))
  transport.topY = Math.min(firstY, secondY)
  transport.bottomY = Math.max(firstY, secondY)
  transport.y = transport.topY
}
const transportLength = transport => Math.round(Math.abs(transport.bottomY - transport.topY))
const setTransportLength = (transport, value) => {
  const requestedLength = Math.max(32, Math.min(draft.height, Number(value) || 32))
  const fixedBottomY = Math.max(0, Math.min(draft.height, Math.max(transport.topY, transport.bottomY)))
  transport.bottomY = fixedBottomY
  transport.topY = Math.max(0, fixedBottomY - requestedLength)
  transport.y = transport.topY
}
const addVerticalTransport = type => {
  const topY = draft.groundY - 256
  const width = type === 'elevator' ? 96 : 48
  const x = centeredAddX(width)
  const item = {
    id: nextId(type, draft.verticalTransports),
    type,
    x,
    y: topY,
    width,
    topY,
    bottomY: draft.groundY,
    speed: type === 'elevator' ? 170 : 220,
    assetId: type === 'elevator' ? 'placeholder_elevator' : 'placeholder_ladder',
    imageSource: ''
  }
  draft.verticalTransports.push(item)
  select('transport', item.id)
  revealAddedItem(item.x + item.width / 2, (item.topY + item.bottomY) / 2)
}
const addPlacement = type => {
  const width = type.id === 'hazard' ? 256 : 42
  const height = type.id === 'hazard' ? 48 : 66
  const item = {
    id: nextId(type.id, draft.placements), type: type.id, label: `仮${type.name}`,
    assetId: type.defaultAssetId, x: viewportCenterX(), y: snap(draft.groundY),
    width, height, renderLayer: 'behindPlayer', zOrder: 0,
    requiredEventFlags: [], stateKey: ''
  }
  normalizePlacement(item)
  draft.placements.push(item)
  select('placement', item.id)
  revealAddedItem(item.x, item.y - item.height / 2)
}
const addMinimapSegment = () => {
  const index = draft.minimap.segments.length + 1
  draft.minimap.segments.push({
    id: `minimap_region_${index}`,
    label: `区画 ${index}`,
    startX: snap((index - 1) * props.area.width / 4),
    endX: snap(index * props.area.width / 4)
  })
  draft.minimap.mode = 'custom'
}
const applyPlacementDefault = placement => {
  const type = props.assetCatalog.placementTypes.find(candidate => candidate.id === placement.type)
  if (type && (!placement.assetId || placement.assetId.startsWith('placeholder_'))) placement.assetId = type.defaultAssetId
  normalizePlacement(placement)
}
const applyTerrainTemplate = () => {
  const backgrounds = props.assetCatalog.backgroundSets.find(item => item.terrainType === props.area.terrainType)
  if (backgrounds) {
    for (const layer of ['far', 'mid', 'foreground']) draft.backgroundLayers[layer].assetId = backgrounds[layer]
  }
  const effectsByTerrain = {
    grassland: ['wind'], forest: ['leaves', 'magic_motes'], wetland: ['mist', 'rain'],
    coast: ['sea_spray', 'wind'], desert: ['dust', 'wind'], snowfield: ['snow', 'wind'],
    mountain: ['wind'], canyon: ['dust', 'wind'], cave: ['cave_dust'],
    underground_cave: ['glow_spores', 'cave_dust'], volcanic: ['ash', 'embers'], ruins: ['magic_motes', 'dust']
  }
  draft.environmentEffects = [...(effectsByTerrain[props.area.terrainType] ?? [])]
  if (!draft.tileLayers.length) addTile()
  selectMap()
}

const startDrag = (event, kind, item, layer = null) => {
  if (event.button !== 0) return
  select(kind, item.id, layer?.id ?? '')
  Object.assign(drag, {
    active: true, mode: 'move', direction: '', item, element: event.currentTarget,
    startX: event.clientX, startY: event.clientY, originX: item.x, originY: kind === 'background' ? backgroundLayerY(item) : item.y,
    originStartY: item.startY, originEndY: item.endY,
    originTopY: item.topY, originBottomY: item.bottomY
  })
  event.currentTarget.setPointerCapture(event.pointerId)
}
const startResize = (event, direction) => {
  if (event.button !== 0 || !selectedObject.value) return
  const item = selectedObject.value
  Object.assign(drag, {
    active: true, mode: 'resize', direction, item, element: event.currentTarget,
    startX: event.clientX, startY: event.clientY,
    originX: item.x, originY: selected.kind === 'background' ? backgroundLayerY(item) : item.y,
    originWidth: item.width, originHeight: item.height,
    originStartY: item.startY, originEndY: item.endY,
    originTopY: item.topY, originBottomY: item.bottomY
  })
  event.currentTarget.setPointerCapture(event.pointerId)
}
const resizeMove = event => {
  const item = drag.item
  const direction = drag.direction
  const deltaX = (event.clientX - drag.startX) / zoom.value
  const deltaY = (event.clientY - drag.startY) / zoom.value
  const minWidth = selected.kind === 'transport' ? 24 : selected.kind === 'collision' ? 8 : 32
  const minHeight = selected.kind === 'collision' ? 8 : 32

  if (selected.kind === 'background') {
    if (direction === 'e') item.width = Math.max(minWidth, snap(drag.originWidth + deltaX))
    if (direction === 'w') {
      const right = drag.originX + drag.originWidth
      item.width = Math.max(minWidth, snap(drag.originWidth - deltaX))
      item.x = right - item.width
    }
    if (direction === 's') item.height = Math.max(minHeight, snap(drag.originHeight + deltaY))
    if (direction === 'n') {
      const bottom = drag.originY + drag.originHeight
      item.height = Math.max(minHeight, snap(drag.originHeight - deltaY))
      item.verticalAnchor = 'free'
      item.y = bottom - item.height
    }
    return
  }

  if (direction === 'e') {
    const right = Math.max(drag.originX + minWidth, Math.min(props.area.width, snap(drag.originX + drag.originWidth + deltaX)))
    item.width = right - drag.originX
  } else if (direction === 'w') {
    const originalRight = drag.originX + drag.originWidth
    const left = Math.max(0, Math.min(originalRight - minWidth, snap(drag.originX + deltaX)))
    item.x = left
    item.width = originalRight - left
  }
  if (selected.kind === 'part' && ['e', 'w'].includes(direction)) syncPartDimension(item, 'width')

  if (selected.kind === 'terrain' && ['slope', 'stairs'].includes(item.type)) item.autoWidth = false

  if (selected.kind === 'transport') {
    const originalTop = Math.min(drag.originTopY, drag.originBottomY)
    const originalBottom = Math.max(drag.originTopY, drag.originBottomY)
    if (direction === 'n') item.topY = Math.max(0, Math.min(originalBottom - minHeight, snap(originalTop + deltaY)))
    if (direction === 's') item.bottomY = Math.max(originalTop + minHeight, Math.min(draft.height, snap(originalBottom + deltaY)))
    syncTransportMetadata(item)
  } else if (selected.kind === 'collision') {
    if (direction === 'n') {
      const originalBottom = drag.originY + drag.originHeight
      item.y = Math.max(0, Math.min(originalBottom - minHeight, snap(drag.originY + deltaY)))
      item.height = originalBottom - item.y
    }
    if (direction === 's') {
      const bottom = Math.max(drag.originY + minHeight, Math.min(draft.height, snap(drag.originY + drag.originHeight + deltaY)))
      item.height = bottom - drag.originY
    }
  } else if (selected.kind === 'part' && ['n', 's'].includes(direction)) {
    const originalBottom = drag.originY + drag.originHeight
    const originalCenterX = drag.originX + drag.originWidth / 2
    if (direction === 'n') {
      item.y = Math.max(0, Math.min(originalBottom - minHeight, snap(drag.originY + deltaY)))
      item.height = originalBottom - item.y
    } else {
      const bottom = Math.max(drag.originY + minHeight, Math.min(draft.height, snap(drag.originY + drag.originHeight + deltaY)))
      item.height = bottom - drag.originY
    }
    syncPartDimension(item, 'height')
    if (item.lockAspectRatio !== false) item.x = Math.max(0, Math.min(props.area.width - item.width, originalCenterX - item.width / 2))
  }
}
const dragMove = event => {
  if (!drag.active || !drag.item) return
  if (drag.mode === 'resize') {
    resizeMove(event)
    return
  }
  if (selected.kind === 'background') {
    drag.item.verticalAnchor = 'free'
    drag.item.x = snap(drag.originX + (event.clientX - drag.startX) / zoom.value)
    drag.item.y = snap(drag.originY + (event.clientY - drag.startY) / zoom.value)
    return
  }
  const maxX = Math.max(0, props.area.width - (selected.kind === 'placement' ? 0 : drag.item.width ?? 0))
  const maxY = Math.max(0, draft.height - (selected.kind === 'placement' ? 0 : drag.item.height ?? 0))
  drag.item.x = Math.max(0, Math.min(maxX, snap(drag.originX + (event.clientX - drag.startX) / zoom.value)))
  if (selected.kind === 'terrain') {
    if (['slope', 'stairs'].includes(drag.item.type)) return
    const deltaY = snap((event.clientY - drag.startY) / zoom.value)
    drag.item.startY = Math.max(0, Math.min(draft.height, drag.originStartY + deltaY))
    drag.item.endY = Math.max(0, Math.min(draft.height, drag.originEndY + deltaY))
    drag.item.y = Math.min(drag.item.startY, drag.item.endY)
    syncTerrainMetadata(drag.item)
    return
  }
  if (selected.kind === 'transport') {
    const deltaY = snap((event.clientY - drag.startY) / zoom.value)
    drag.item.topY = Math.max(0, Math.min(draft.height, drag.originTopY + deltaY))
    drag.item.bottomY = Math.max(0, Math.min(draft.height, drag.originBottomY + deltaY))
    drag.item.y = Math.min(drag.item.topY, drag.item.bottomY)
    return
  }
  drag.item.y = Math.max(0, Math.min(maxY, snap(drag.originY + (event.clientY - drag.startY) / zoom.value)))
}
const endDrag = event => {
  if (drag.element?.hasPointerCapture?.(event.pointerId)) drag.element.releasePointerCapture(event.pointerId)
  Object.assign(drag, { active: false, mode: '', direction: '', item: null, element: null })
}
const removeSelected = () => {
  if (selected.kind === 'background') {
    const index = draft.backgroundImages.findIndex(item => item.id === selected.id)
    if (index >= 0) removeBackgroundImage(draft.backgroundImages[index], index)
  }
  if (selected.kind === 'platform') draft.platforms.splice(draft.platforms.findIndex(item => item.id === selected.id), 1)
  if (selected.kind === 'terrain') draft.terrainSegments.splice(draft.terrainSegments.findIndex(item => item.id === selected.id), 1)
  if (selected.kind === 'transport') draft.verticalTransports.splice(draft.verticalTransports.findIndex(item => item.id === selected.id), 1)
  if (selected.kind === 'placement') draft.placements.splice(draft.placements.findIndex(item => item.id === selected.id), 1)
  if (selected.kind === 'collision') draft.collisionZones.splice(draft.collisionZones.findIndex(item => item.id === selected.id), 1)
  if (selected.kind === 'part') draft.mapParts.splice(draft.mapParts.findIndex(item => item.id === selected.id), 1)
  if (selected.kind === 'tile') {
    const layer = draft.tileLayers.find(item => item.id === selected.layerId)
    if (layer) layer.tiles.splice(layer.tiles.findIndex(item => item.id === selected.id), 1)
  }
  selectMap()
}
const renameSelected = value => {
  const nextId = value.trim()
  if (!nextId || !selectedObject.value) return
  selectedObject.value.id = nextId
  selected.id = nextId
}

const areaName = areaId => props.allAreas.find(item => item.id === areaId)?.name ?? areaId
const connectionWarnings = computed(() => {
  const warnings = []
  for (const exit of props.area.exits) {
    const target = props.allAreas.find(item => item.id === exit.destinationArea)
    if (!target) warnings.push(`${exit.id}: 接続先エリアがありません`)
    else if (!target.spawns.some(spawn => spawn.id === exit.destinationSpawn)) warnings.push(`${exit.id}: 接続先の出現地点がありません`)
  }
  return warnings
})
const stateArrayFor = placement => ({
  enemy: 'defeatedEnemies', boss: 'defeatedEnemies', treasure: 'collectedItems',
  gathering: 'collectedItems', npc: 'rescuedNpcs', save_point: 'repairedFacilities',
  event: 'repairedFacilities', hazard: 'repairedFacilities', landmark: 'repairedFacilities'
}[placement.type] ?? 'repairedFacilities')
const placementStateKey = placement => placement.stateKey || placement.id
const placementStateApplied = placement => stateDraft[stateArrayFor(placement)]?.includes(placementStateKey(placement))
const togglePlacementState = placement => {
  const list = stateDraft[stateArrayFor(placement)]
  const key = placementStateKey(placement)
  const index = list.indexOf(key)
  if (index >= 0) list.splice(index, 1)
  else list.push(key)
}
const placementVisible = placement => (
  (placement.requiredEventFlags ?? []).every(flag => previewFlags[flag] === true)
  && !placementStateApplied(placement)
)
const placeholderCount = computed(() => draft.placements.filter(item => item.assetId?.startsWith('placeholder_')).length
  + (draft.playerPresentation.characterId?.startsWith('placeholder_') ? 1 : 0))
const diagnostics = computed(() => {
  const messages = []
  if (draft.playerPresentation.characterId?.startsWith('placeholder_')) messages.push('歩行キャラクターが仮素材です')
  for (const layer of backgroundLayerNames) {
    if (!draft.backgroundLayers[layer.id].assetId) messages.push(`${layer.label}アセットIDが未設定です`)
  }
  for (const placement of draft.placements) {
    if (!placement.assetId) messages.push(`${placement.id}: アセットIDが未設定です`)
    else if (placement.assetId.startsWith('placeholder_')) messages.push(`${placement.id}: 仮素材 ${placement.assetId}`)
    if (placement.type === 'npc' && !placement.dialogueId) messages.push(`${placement.id}: 会話IDが未設定です`)
    if (['enemy', 'boss'].includes(placement.type) && !placement.enemyFormationId) messages.push(`${placement.id}: 敵編成IDが未設定です`)
    if (['treasure', 'gathering'].includes(placement.type) && !placement.rewardItemId) messages.push(`${placement.id}: 報酬アイテムIDが未設定です`)
  }
  for (const part of draft.mapParts) {
    if (!mapPartById(part.partId)) messages.push(`${part.id}: 素材・部品 ${part.partId} がライブラリにありません`)
  }
  return messages
})
const duplicateIds = items => {
  const ids = items.map(item => item.id).filter(Boolean)
  return ids.length !== new Set(ids).size
}
const validationMessages = computed(() => {
  const messages = []
  if (draft.groundY < 0 || draft.groundY > draft.height) messages.push('地面Yがマップ範囲外です')
  if (duplicateIds(draft.platforms) || duplicateIds(draft.terrainSegments) || duplicateIds(draft.verticalTransports) || duplicateIds(draft.placements) || duplicateIds(draft.collisionZones) || duplicateIds(draft.mapParts)) messages.push('IDが重複しています')
  if (draft.placements.some(item => item.x < 0 || item.x > props.area.width || item.y < 0 || item.y > draft.height)) messages.push('配置物が範囲外です')
  if (draft.terrainSegments.some(item => item.x < 0 || item.x + item.width > props.area.width
    || item.startY < 0 || item.startY > draft.height || item.endY < 0 || item.endY > draft.height)) messages.push('地形区間が範囲外です')
  if (draft.verticalTransports.some(item => item.x < 0 || item.x + item.width > props.area.width
    || item.topY < 0 || item.topY > draft.height || item.bottomY < 0 || item.bottomY > draft.height)) messages.push('昇降設備が範囲外です')
  if (draft.mapParts.some(item => item.x < 0 || item.x + item.width > props.area.width
    || item.y < 0 || item.y + item.height > draft.height)) messages.push('素材・部品がマップ範囲外です')
  return messages
})
const emitMapSave = () => {
  if (validationMessages.value.length) return
  const savedDraft = clone(draft)
  delete savedDraft.characterProfiles
  delete savedDraft.playerPresentation.characterProfileId
  delete savedDraft.playerPresentation.characterAssetId
  saveNotice.value = 'areaMapDrafts.jsonへ保存しています…'
  saveNoticeError.value = false
  emit('save', savedDraft, (ok, text) => {
    saveNoticeError.value = !ok
    saveNotice.value = text
  })
}
const emitStateSave = () => {
  saveNotice.value = '状態テストの初期値を保存しています…'
  saveNoticeError.value = false
  emit('save-state', clone(stateDraft), (ok, text) => {
    saveNoticeError.value = !ok
    saveNotice.value = ok ? '状態テストの初期値を保存しました' : text
  })
}

let previousRenderState = null
const renderEditorState = () => JSON.stringify({
  screen: 'area-map-editor',
  areaId: props.area.id,
  activeTab: activeTab.value,
  backgroundSettingTab: backgroundSettingTab.value,
  imagePickerOpen: imagePickerOpen.value,
  zoom: zoom.value,
  gridSize: gridSize.value,
  snapEnabled: snapEnabled.value,
  playerCharacterId: draft.playerPresentation.characterId,
  testPlayer: {
    x: testPlayerX.value,
    y: testSurfaceY.value,
    collisionId: testCollision.value?.id ?? null,
    displayWidth: editorPlayerPresentation.value.displayWidth,
    displayHeight: editorPlayerPresentation.value.displayHeight,
    motionId: editorPlayerBoneMotionId.value,
    imageSource: editorPlayerGraphicSource.value
  },
  selected: { ...selected },
  viewFilters: { ...viewFilters },
  hovered: hovered.value,
  placements: draft.placements.map(item => ({
    id: item.id, type: item.type, x: item.x, y: item.y, visible: placementVisible(item)
  })),
  platforms: draft.platforms.map(item => ({ id: item.id, x: item.x, y: item.y, width: item.width, walkable: item.walkable !== false })),
  terrainSegments: draft.terrainSegments.map(item => ({
    id: item.id, type: item.type, x: item.x, width: item.width, startY: item.startY, endY: item.endY,
    autoWidth: item.autoWidth
  })),
  verticalTransports: draft.verticalTransports.map(item => ({
    id: item.id, type: item.type, x: item.x, width: item.width,
    topY: item.topY, bottomY: item.bottomY, length: transportLength(item)
  })),
  collisionZones: draft.collisionZones,
  mapParts: draft.mapParts.map(item => ({ ...item, partFound: !!mapPartById(item.partId) })),
  backgroundGradient: draft.backgroundGradient,
  backgroundImages: draft.backgroundImages.map(layer => ({ ...layer, resolvedY: backgroundLayerY(layer) })),
  diagnostics: diagnostics.value,
  validationMessages: validationMessages.value,
  coordinateSystem: 'Map origin is top-left; x increases right and y increases down. Placement y is the foot position.'
})
onMounted(async () => {
  previousRenderState = window.render_game_to_text
  window.render_game_to_text = renderEditorState
  nextTick(() => {
    updateFitZoom()
    revealAddedItem(testPlayerX.value, testSurfaceY.value - editorPlayerPresentation.value.displayHeight / 2)
  })
  window.addEventListener('resize', updateFitZoom)
  try {
    const response = await fetch('/api/local/image-assets')
    const payload = await response.json()
    if (response.ok) locationImages.value = (payload.assets ?? []).filter(image => image.directory === 'locations')
  } catch {}
})
onBeforeUnmount(() => {
  Object.assign(drag, { active: false, item: null, element: null })
  window.removeEventListener('resize', updateFitZoom)
  if (window.render_game_to_text === renderEditorState) window.render_game_to_text = previousRenderState
})
</script>

<style scoped>
.workspace-backdrop { position: absolute; z-index: 30; inset: 0; padding: 8px; background: rgba(0,5,8,.94); backdrop-filter: blur(4px); }
.workspace { --accent:#64e8ff; --line:rgba(100,232,255,.28); display:flex; width:100%; height:100%; min-height:0; box-sizing:border-box; flex-direction:column; overflow:hidden; border:1px solid var(--line); background:#071218; color:#dcf8ff; font:12px "Consolas","Courier New",monospace; }
.theme-fantasy .workspace { --accent:#e4bd67; --line:rgba(226,189,108,.4); background:#1b1209; color:#f3e5c2; font-family:"Yu Mincho","Hiragino Mincho ProN",serif; }
button,input,select,textarea { box-sizing:border-box; font:inherit; }
button { cursor:pointer; }
.workspace-header { display:flex; min-height:58px; box-sizing:border-box; flex:0 0 auto; align-items:center; justify-content:space-between; padding:8px 16px; border-bottom:1px solid var(--line); background:#0a222c; }
.theme-fantasy .workspace-header { background:linear-gradient(90deg,#3b2411,#211409); }
.workspace-header p,.workspace-header h2 { margin:0; }.workspace-header p { color:var(--accent); font-size:8px; letter-spacing:.14em; }.workspace-header h2 { margin-top:3px; font-size:19px; }
.header-summary { display:flex; align-items:center; gap:16px; color:var(--accent); font-size:9px; }
.header-summary button { width:36px; height:36px; border:1px solid var(--line); background:transparent; color:inherit; font-size:20px; }
.workspace-tabs { display:flex; min-height:42px; flex:0 0 auto; padding:0 12px; border-bottom:1px solid var(--line); background:#071a21; }
.theme-fantasy .workspace-tabs { background:#29190c; }
.workspace-tabs button { position:relative; min-width:130px; padding:0 16px; border:0; border-right:1px solid var(--line); background:transparent; color:inherit; opacity:.58; }
.workspace-tabs button.active { background:rgba(100,232,255,.09); color:var(--accent); opacity:1; }
.workspace-tabs span { margin-right:7px; font-size:8px; }.workspace-tabs small { position:absolute; top:6px; right:6px; min-width:16px; border-radius:9px; background:#b75545; color:#fff; font-size:8px; }
.layout-workspace {
  display:grid;
  min-height:0;
  flex:1;
  overflow:hidden;
  grid-template-columns:260px minmax(0,1fr);
  grid-template-rows:minmax(280px,3fr) minmax(210px,2fr);
}
.tool-palette,.inspector { min-height:0; overflow-y:auto; background:#08171d; }
.theme-fantasy .tool-palette,.theme-fantasy .inspector { background:#24170c; }
.tool-palette { grid-column:1; grid-row:2; padding:12px; border-top:1px solid var(--line); border-right:1px solid var(--line); }
.tool-palette section { display:grid; gap:5px; margin-bottom:16px; }
.section-label { margin-bottom:3px; color:var(--accent); font-size:8px; letter-spacing:.12em; }
.tool-palette button { display:flex; min-height:32px; align-items:center; gap:8px; padding:5px 8px; border:1px solid var(--line); background:rgba(100,232,255,.045); color:inherit; text-align:left; }
.tool-palette button.active { border-color:var(--accent); background:rgba(100,232,255,.18); color:var(--accent); }
.map-part-palette small { color:rgba(220,248,252,.62); font-size:13px; line-height:1.5; }
.tool-palette i,.asset-list i,.simulation-list i { display:grid; width:22px; height:22px; place-items:center; border:1px solid currentColor; border-radius:3px; color:#ffd174; font-size:9px; font-style:normal; }
.tool-palette .template-button { color:var(--accent); }
.canvas-column { position:relative; display:flex; min-width:0; min-height:0; grid-column:1/-1; grid-row:1; flex-direction:column; background:#030b0e; }
.canvas-toolbar { display:flex; min-height:48px; box-sizing:border-box; flex:0 0 auto; align-items:center; justify-content:flex-start; gap:10px; padding:6px 10px; overflow-x:auto; border-bottom:1px solid var(--line); color:rgba(220,248,255,.68); font-size:9px; white-space:nowrap; }
.canvas-toolbar > * { flex:0 0 auto; }
.canvas-toolbar div { display:flex; align-items:center; gap:5px; }.canvas-toolbar button { min-height:30px; padding:0 10px; border:1px solid var(--line); background:transparent; color:inherit; white-space:nowrap; }.canvas-toolbar input[type="number"] { width:58px; }
.canvas-toolbar .compact-icon-button {
  display:grid;
  width:34px;
  height:34px;
  min-height:34px;
  padding:0;
  place-items:center;
  color:var(--accent);
  font-size:18px;
  line-height:1;
}
.canvas-toolbar .fit-button { font-size:20px; }
.tool-toggle {
  display:grid;
  width:38px;
  min-width:38px;
  max-width:38px;
  height:38px;
  min-height:38px!important;
  flex:0 0 38px!important;
  grid-template-columns:1fr;
  align-items:center;
  padding:0!important;
  opacity:.55;
}
.tool-toggle > span { font-size:21px; line-height:1; }
.tool-toggle.active,.filter-toggle.active {
  border-color:var(--accent);
  background:rgba(100,232,255,.14);
  color:var(--accent);
  opacity:1;
  box-shadow:inset 0 0 12px rgba(100,232,255,.14),0 0 10px rgba(100,232,255,.2);
  text-shadow:0 0 8px currentColor;
}
.theme-fantasy .tool-toggle.active,.theme-fantasy .filter-toggle.active {
  background:rgba(228,189,103,.14);
  box-shadow:inset 0 0 12px rgba(228,189,103,.14),0 0 10px rgba(228,189,103,.18);
}
.grid-size-control {
  display:flex;
  width:auto;
  align-items:center;
  gap:5px;
  color:inherit;
}
.grid-size-control > span { color:var(--accent); font-size:18px; }
.test-controls{display:flex!important;align-items:center;gap:4px!important}.test-controls label{display:flex;align-items:center;gap:4px;white-space:nowrap}.test-controls b{min-width:42px;color:#8fffc0;font-size:8px;white-space:nowrap}.test-controls b.blocked{color:#ff9985}.drag-hint{margin-left:auto;white-space:nowrap}
.view-filterbar {
  display:flex;
  min-height:52px;
  box-sizing:border-box;
  flex:0 0 auto;
  align-items:center;
  gap:7px;
  padding:6px 12px;
  overflow-x:auto;
  border-bottom:1px solid var(--line);
  background:rgba(100,232,255,.035);
  white-space:nowrap;
}
.filterbar-label { margin-right:3px; color:var(--accent); font-size:13px; }
.filter-toggle {
  display:grid;
  width:54px;
  height:40px;
  min-height:40px;
  grid-template-rows:18px 12px;
  place-items:center;
  padding:3px 4px;
  border:1px solid var(--line);
  background:transparent;
  color:inherit;
  opacity:.5;
}
.filter-toggle > span { font-size:17px; font-weight:700; line-height:1; }
.filter-toggle small { overflow:hidden; font-size:11px; line-height:1; text-overflow:ellipsis; white-space:nowrap; }
.filter-help {
  width:30px;
  height:30px;
  min-height:30px;
  margin-left:auto;
  padding:0;
  border:1px solid var(--line);
  border-radius:50%;
  background:transparent;
  color:var(--accent);
  font-size:15px;
}
.canvas-scroller { min-height:0; flex:1; overflow:auto; padding:18px; scrollbar-color:var(--accent) #091217; }
.map-canvas { position:relative; min-width:300px; min-height:180px; overflow:hidden; border:1px solid var(--line); background-color:#687d70; background-image:linear-gradient(rgba(255,255,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.08) 1px,transparent 1px); background-size:var(--grid-size) var(--grid-size); box-shadow:0 0 28px #000; touch-action:none; }
.canvas-gradient { position:absolute; inset:0; pointer-events:none; }
.canvas-background-image { position:absolute; pointer-events:none; }
.canvas-background-image { background-position:center; }
.background-layout-box { position:absolute; z-index:900; box-sizing:border-box; min-width:0; min-height:0; padding:0; border:2px solid rgba(255,255,255,.82); background:rgba(100,232,255,.04); box-shadow:0 0 0 1px var(--accent); cursor:move; touch-action:none; }
.background-layout-box span { position:absolute; top:4px; left:4px; padding:2px 5px; border:1px solid var(--accent); background:rgba(2,12,17,.88); color:var(--accent); font-size:11px; }
.canvas-ground { position:absolute; z-index:100; right:0; bottom:0; left:0; border-top:2px solid #b9d489; background:repeating-linear-gradient(135deg,#4b321d 0 16px,#362315 17px 32px); }
.canvas-object { position:absolute; z-index:120; box-sizing:border-box; padding:0; border:1px solid currentColor; overflow:visible; color:#fff; touch-action:none; }
.canvas-object.selected { outline:3px solid #fff; box-shadow:0 0 14px var(--accent); }
.resize-handle {
  position:absolute;
  z-index:920;
  width:16px;
  height:16px;
  min-width:16px;
  min-height:16px;
  padding:0;
  border:2px solid #fff;
  border-radius:3px;
  background:var(--accent);
  box-shadow:0 0 0 2px rgba(3,11,14,.8),0 0 12px var(--accent);
  transform:translate(-50%,-50%);
  touch-action:none;
}
.resize-handle::after { display:block; color:#071218; font-size:12px; font-weight:900; line-height:10px; }
.resize-w,.resize-e { cursor:ew-resize; }
.resize-n,.resize-s { cursor:ns-resize; }
.resize-w::after,.resize-e::after { content:'↔'; }
.resize-n::after,.resize-s::after { content:'↕'; }
.canvas-object span { position:absolute; bottom:calc(100% + 2px); left:50%; width:max-content; max-width:160px; color:inherit; font-size:7px; transform:translateX(-50%); }
.platform-object { z-index:120; min-height:7px; background:#b67d42; color:#ffe4b2; }
.terrain-object {
  z-index:110;
  border-top:2px solid #d7efac;
  background:repeating-linear-gradient(135deg,#4d5f36 0 16px,#314127 17px 32px);
  color:#e7ffc2;
}
.terrain-object.terrain-step { border-top-color:#ffd189; background:repeating-linear-gradient(90deg,#654829 0 24px,#49321d 25px 48px); }
.terrain-object.terrain-slope { border-top-color:#a9e8ff; }
.terrain-object.terrain-stairs { border-top-color:#ffe29d; background:repeating-linear-gradient(90deg,#65523a 0 28px,#493923 29px 56px); }
.terrain-object.terrain-slope,.terrain-object.terrain-stairs { border:0; box-shadow:0 0 0 2px currentColor inset,0 0 9px rgba(255,226,157,.32); }
.terrain-direction-icon {
  position:absolute;
  z-index:2;
  top:50%;
  left:50%;
  display:grid;
  width:26px;
  height:26px;
  place-items:center;
  border-radius:50%;
  background:rgba(4,18,24,.88);
  color:#fff1b9;
  font-size:18px!important;
  font-style:normal;
  transform:translate(-50%,-50%);
}
.slope-controls > small { grid-column:1/-1; color:var(--accent); font-size:13px; }
.vertical-transport-object {
  z-index:120;
  display:grid;
  place-items:center;
  border:2px solid #8fe9ff;
  background:repeating-linear-gradient(0deg,transparent 0 13px,rgba(143,233,255,.72) 14px 17px),rgba(13,48,59,.68);
  color:#bff5ff;
}
.vertical-transport-object.transport-elevator {
  border-color:#ffe29d;
  background:linear-gradient(90deg,rgba(255,226,157,.14),rgba(255,226,157,.38),rgba(255,226,157,.14));
  color:#ffe9b7;
}
.vertical-transport-object i { font-size:11px; font-style:normal; }
.collision-object { background:repeating-linear-gradient(135deg,rgba(255,72,51,.28) 0 8px,rgba(255,72,51,.08) 9px 16px); color:#ff8b72; }
.tile-object { background:#657547; color:#d8efae; }
.map-part-object { background-color:transparent; color:#a8f4ff; image-rendering:pixelated; transform-origin:center; }
.placement-object { display:grid; place-items:center; border-width:2px; border-radius:3px; background:#24505f; color:#9cecff; transform:translate(-50%,-100%); }
.placement-object i { font-size:9px; font-style:normal; }.placement-object.inactive { opacity:.22; filter:grayscale(1); }
.placement-object.type-enemy { background:#6b2824;color:#ff9b8d; }.placement-object.type-boss{background:#582763;color:#e9a0ff}.placement-object.type-treasure{background:#745218;color:#ffe088}.placement-object.type-save_point{background:#205e49;color:#9effd0}.placement-object.type-gathering{background:#3f632a;color:#bce992}.placement-object.type-hazard{background:#74251b;color:#ff8d72}
.locked-marker { position:absolute; z-index:350; min-width:20px; min-height:20px; box-sizing:border-box; padding:3px 5px; border:1px dashed currentColor; color:#dff8ff; font-size:6px; line-height:1.2; text-align:center; transform:translate(-50%,-100%); pointer-events:auto; }.locked-marker.exit{color:#9effb2}
.test-player{position:absolute;z-index:300;display:block;box-sizing:border-box;border:1px dashed rgba(255,243,174,.72);background:transparent;color:#fff8d1;transform:translate(-50%,-100%);filter:drop-shadow(0 0 7px rgba(255,239,149,.55));pointer-events:none}.test-player.blocked{border-color:#ff6e56;filter:drop-shadow(0 0 8px rgba(255,90,70,.7))}.test-player.has-bone-motion{border-color:rgba(100,232,255,.55)}
.editor-bone-motion{position:absolute!important;top:0;left:0;transform-origin:top left}.editor-player-graphic{position:absolute;inset:0;background-position:center;background-repeat:no-repeat;image-rendering:pixelated}.editor-player-placeholder{position:absolute;inset:10%;display:grid;place-items:center;border:2px solid #fff3ae;border-radius:45% 45% 20% 20%;background:#765b24;font-size:12px}.test-player>small{position:absolute;right:0;bottom:100%;padding:2px 4px;background:rgba(2,10,14,.88);color:#ffe9a3;font-size:11px;line-height:1;white-space:nowrap}
.hover-card {
  position:absolute;
  z-index:20;
  top:102px;
  right:20px;
  display:grid;
  width:min(300px,calc(100% - 40px));
  box-sizing:border-box;
  gap:4px;
  padding:12px 14px;
  border:1px solid var(--accent);
  background:rgba(4,18,24,.96);
  box-shadow:0 8px 24px rgba(0,0,0,.5);
  pointer-events:none;
}
.theme-fantasy .hover-card { background:rgba(43,27,12,.96); }
.hover-card span { color:var(--accent); font-size:13px; }
.hover-card strong { font-size:15px; }
.hover-card code,.hover-card p { margin:0; font-size:13px; }
.canvas-status { display:flex; min-height:30px; align-items:center; justify-content:space-between; padding:0 10px; border-top:1px solid var(--line); color:rgba(220,248,255,.55); font-size:8px; }
.inspector { display:grid; min-width:0; grid-column:2; grid-row:2; grid-template-rows:auto minmax(0,1fr); overflow:hidden; border-top:1px solid var(--line); }
.inspector>header { display:flex; min-height:52px; align-items:center; justify-content:space-between; padding:8px 12px; border-bottom:1px solid var(--line); }.inspector>header div{display:grid;gap:3px}.inspector>header span{color:var(--accent);font-size:8px}.inspector>header button{border:1px solid #a94e43;background:transparent;color:#ff9c8f}
.inspector-scroll { display:grid; min-height:0; grid-template-columns:repeat(3,minmax(180px,1fr)); align-content:start; gap:10px 14px; overflow:auto; padding:12px 14px 60px; }
.inspector-scroll > h3 { grid-column:1/-1; }
.inspector h3 { margin:8px 0 0; padding-bottom:5px; border-bottom:1px solid var(--line); color:var(--accent); font-size:11px; }
label { display:grid; gap:4px; color:rgba(220,248,255,.65); font-size:9px; }.theme-fantasy label{color:rgba(243,229,194,.72)}
input,select,textarea { width:100%; min-height:30px; padding:5px 7px; border:1px solid var(--line); background:rgba(0,0,0,.3); color:inherit; }.field-grid,.settings-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.settings-grid .wide{grid-column:1/-1}
.map-core-fields { grid-column:1/-1; grid-template-columns:repeat(3,minmax(0,1fr)); }
.map-player-note { display:flex; grid-column:1/-1; gap:7px; align-items:baseline; margin:0; color:rgba(220,248,255,.64); font-size:13px; }
.map-player-note strong { color:var(--accent); font-size:15px; }
.map-player-note span { opacity:.72; }
.reset-part-size-button { min-height:34px; grid-column:1/-1; border:1px solid var(--line); background:rgba(100,232,255,.08); color:var(--accent); }
.check-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:5px; }.check-grid label,.switch{display:flex;align-items:center;gap:6px;min-height:26px}.check-grid input,.switch input{width:auto;min-height:auto}
.minimap-segment-row{display:grid;gap:7px;padding:8px;border:1px solid var(--line)}.minimap-segment-row>button{min-height:28px;border:1px solid #a94e43;background:transparent;color:#ff9c8f}
.panel-scroll { min-height:0; flex:1; overflow:auto; padding:16px 18px 80px; }
.background-settings-workspace { display:grid; min-height:0; flex:1; grid-template-rows:minmax(220px,42%) auto minmax(0,1fr); overflow:hidden; }
.background-live-panel { display:grid; min-height:0; grid-template-rows:auto minmax(0,1fr); border-bottom:1px solid var(--line); background:#02090d; }
.background-live-panel > header { display:flex; min-height:46px; align-items:center; justify-content:space-between; gap:12px; padding:7px 18px; border-bottom:1px solid var(--line); }
.background-live-panel > header div { display:flex; align-items:baseline; gap:12px; }
.background-live-panel > header strong { color:var(--accent); font-size:15px; }
.background-live-panel > header small { color:rgba(220,248,255,.62); font-size:13px; }
.background-live-panel > header span { color:var(--accent); font-size:15px; font-weight:700; }
.background-preview-scroller { min-width:0; min-height:0; overflow:auto; padding:12px 18px; scrollbar-color:var(--accent) #091217; }
.background-live-preview { position:relative; min-width:300px; min-height:180px; overflow:hidden; border:1px solid var(--line); background:#050b0e; box-shadow:0 0 24px #000; touch-action:none; }
.background-ground-guide { position:absolute; z-index:40; right:0; left:0; height:0; border-top:2px solid rgba(185,212,137,.92); box-shadow:0 0 8px rgba(185,212,137,.35); pointer-events:none; }
.background-ground-guide span { position:absolute; right:6px; bottom:3px; padding:2px 5px; background:rgba(2,12,17,.82); color:#d9efaf; font-size:11px; }
.background-transform-box { position:absolute; z-index:50; box-sizing:border-box; min-width:0; min-height:0; padding:0; border:2px solid #fff; background:rgba(100,232,255,.08); box-shadow:0 0 0 1px var(--accent),inset 0 0 20px rgba(100,232,255,.08); cursor:move; touch-action:none; }
.background-transform-box span { position:absolute; top:4px; left:4px; display:grid; min-width:22px; height:22px; place-items:center; padding:0 4px; border:1px solid var(--accent); background:rgba(2,12,17,.9); color:var(--accent); font-size:13px; line-height:1; }
.background-resize-handle { position:absolute; z-index:51; width:18px; min-width:18px; height:18px; min-height:18px; padding:0; border:2px solid #fff; border-radius:3px; background:var(--accent); box-shadow:0 0 0 2px rgba(3,11,14,.8); transform:translate(-50%,-50%); touch-action:none; }
.background-resize-n,.background-resize-s { cursor:ns-resize; }
.background-resize-e,.background-resize-w { cursor:ew-resize; }
.background-setting-tabs { display:flex; min-width:0; gap:6px; overflow-x:auto; padding:8px 18px; border-bottom:1px solid var(--line); background:rgba(100,232,255,.035); }
.background-setting-tabs button { min-width:150px; min-height:38px; padding:5px 14px; border:1px solid var(--line); background:transparent; color:inherit; white-space:nowrap; }.background-setting-tabs button.active { border-color:var(--accent); background:rgba(100,232,255,.15); color:var(--accent); font-weight:700; }
.settings-panel { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); align-content:start; gap:12px; }.settings-panel .panel-card:first-child,.settings-panel .panel-card:nth-child(2){grid-column:1/-1}
.panel-card { padding:14px; border:1px solid var(--line); background:rgba(4,18,24,.68); }.theme-fantasy .panel-card{background:rgba(49,30,13,.58)}
.panel-card>header { display:flex; align-items:center; gap:10px; margin-bottom:12px; }.panel-card>header span{color:var(--accent);font-size:8px}.panel-card h3{margin:0;font-size:16px}
.panel-note { margin:0 0 10px; color:rgba(220,248,255,.68); font-size:13px; line-height:1.55; }.theme-fantasy .panel-note{color:rgba(243,229,194,.72)}
.character-profile-tabs { display:flex; gap:6px; margin-bottom:10px; overflow:auto; padding-bottom:3px; }.character-profile-tabs button{display:grid;min-width:116px;gap:2px;padding:8px 10px;border:1px solid var(--line);background:transparent;color:inherit;text-align:left}.character-profile-tabs button.active{border-color:var(--accent);background:rgba(100,232,255,.13);color:var(--accent)}.theme-fantasy .character-profile-tabs button.active{background:rgba(228,189,103,.13)}.character-profile-tabs small{opacity:.7;font-size:11px}.character-profile-tabs .add-character-profile{display:grid;min-width:42px;place-items:center;padding:0;color:var(--accent);font-size:22px}
.character-profile-actions { display:flex; align-items:center; gap:8px; margin:4px 0 12px; padding:8px; border:1px solid var(--line); }.character-profile-actions strong{margin-right:auto}.character-profile-actions button,.danger-button{min-height:32px;padding:0 10px;border:1px solid var(--line);background:transparent;color:inherit}.character-profile-actions .danger-button{border-color:#a94e43;color:#ff9c8f}.character-profile-actions button:disabled{opacity:.45;cursor:default}
.subsection-title{margin:16px 0 8px;padding-top:12px;border-top:1px solid var(--line);color:var(--accent);font-size:15px}.character-animation-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.character-animation-grid article{display:grid;gap:7px;padding:10px;border:1px solid var(--line);background:rgba(0,0,0,.16)}.character-animation-grid header{display:grid;gap:2px}.character-animation-grid header small,.fallback-note{color:rgba(220,248,255,.58);font-size:11px}.character-animation-grid article>div{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.gradient-settings { display:grid; min-height:170px; grid-template-columns:repeat(4,minmax(110px,1fr)); align-items:end; gap:10px; margin-top:12px; padding:14px; border:1px solid var(--line); }
.gradient-settings label { padding:8px; background:rgba(0,0,0,.5); }.gradient-settings input[type="color"] { width:100%; height:38px; padding:2px; }
.gradient-settings label,.dynamic-background-row label { font-size:15px; }
.panel-card > header .background-add-button { width:auto !important; min-width:140px; min-height:34px; flex:0 0 auto; margin-left:auto; padding:5px 12px; border:1px solid var(--line); background:rgba(100,232,255,.1); color:var(--accent); }
.panel-card > header h3 { white-space:nowrap; }
.background-row { display:grid; grid-template-columns:45px minmax(180px,1fr) 140px 100px 90px 70px 64px; align-items:end; gap:9px; margin-top:8px; padding:9px; border:1px solid transparent; }.background-row.selected { border-color:var(--accent); background:rgba(100,232,255,.07); }.background-row>label:nth-of-type(5){display:flex;align-items:center;gap:5px}.background-row>label:nth-of-type(5) input{width:auto}
.background-transform-fields { display:grid; grid-column:2/-1; grid-template-columns:repeat(5,minmax(100px,1fr)) minmax(150px,auto); align-items:end; gap:9px; }
.background-transform-fields > button { min-height:32px; border:1px solid var(--line); background:rgba(100,232,255,.08); color:var(--accent); }
.background-image-picker-button { display:grid; width:100%; min-width:0; min-height:54px; grid-template-columns:68px minmax(0,1fr); align-items:center; gap:8px; padding:5px; border:1px solid var(--line); background:rgba(0,0,0,.28); color:inherit; text-align:left; }.background-image-picker-button i { display:block; width:64px; height:42px; background-position:center; background-size:cover; }.background-image-picker-button span { display:grid; min-width:0; gap:2px; }.background-image-picker-button strong,.background-image-picker-button small { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }.background-image-picker-button strong { font-size:15px; }.background-image-picker-button small { color:rgba(220,248,255,.6); font-size:11px; }
.dynamic-background-row > button { min-height:32px; border:1px solid rgba(255,110,90,.45); background:rgba(255,80,60,.08); color:#ffb2a8; }
.empty-backgrounds { margin-top:10px; padding:14px; border:1px dashed var(--line); color:rgba(220,248,252,.62); font-size:15px; }
.layer-help { grid-column:1/-1; margin:0; color:rgba(220,248,255,.68); font-size:13px; line-height:1.5; }
.connection-panel { display:grid; grid-template-columns:minmax(0,1fr) 330px; gap:16px; }.connection-graph{position:relative;display:flex;min-height:440px;align-content:center;justify-content:center;flex-wrap:wrap;gap:24px;padding:40px;border:1px solid var(--line);background:radial-gradient(circle at 50% 50%,rgba(100,232,255,.12),transparent 34%)}.area-node{position:relative;z-index:2;display:grid;width:230px;gap:5px;padding:14px;border:1px solid var(--line);background:#0c232c}.theme-fantasy .area-node{background:#35210f}.area-node.current{width:280px;border:2px solid var(--accent)}.area-node span{color:var(--accent);font-size:8px}.area-node code,.area-node small{opacity:.58;font-size:8px}.connection-audit{padding:14px;border:1px solid var(--line)}.connection-audit h3{color:var(--accent)}.connection-audit article{display:grid;gap:3px;margin-top:8px;padding:8px;border:1px solid var(--line)}.connection-audit code{font-size:8px;opacity:.65}
.simulation-panel { display:grid; grid-template-columns:340px minmax(0,1fr); gap:14px; }.flag-grid{display:grid;gap:7px}.flag-grid label{display:flex;align-items:center;gap:8px;padding:8px;border:1px solid var(--line)}.flag-grid input{width:auto;min-height:auto}.flag-grid span{display:grid;gap:2px}.flag-grid code{font-size:8px;opacity:.55}.state-grid{display:flex;align-items:end;gap:20px}.simulation-list{display:grid;gap:6px;margin-top:12px}.simulation-list article{display:grid;grid-template-columns:28px minmax(0,1fr) 70px auto;align-items:center;gap:8px;padding:8px;border:1px solid var(--line)}.simulation-list article.inactive{opacity:.42}.simulation-list div{display:grid}.simulation-list code{font-size:8px;opacity:.55}.simulation-list button{border:1px solid var(--line);background:transparent;color:inherit}
.state-save-actions { display:flex; justify-content:flex-end; margin-top:14px; padding-top:12px; border-top:1px solid var(--line); }.state-save-actions button{min-height:38px;padding:0 14px;border:1px solid var(--accent);background:rgba(100,232,255,.12);color:var(--accent);font-weight:700}
.diagnostic-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px}.diagnostic-summary article{display:grid;gap:5px;padding:14px;border:1px solid var(--line)}.diagnostic-summary span{color:var(--accent);font-size:8px}.diagnostic-summary strong{font-size:22px}.asset-panel{display:grid;align-content:start;gap:12px}.asset-list{display:grid;gap:5px}.asset-list article{display:grid;grid-template-columns:28px 180px minmax(0,1fr);align-items:center;gap:8px;padding:7px;border-top:1px solid var(--line)}.asset-list code{font-size:9px;opacity:.68}.success{color:#8fffc0}.warning,.validation{color:#ffab8e}.empty-panel{width:100%;text-align:center;opacity:.6}
.workspace-footer { display:flex; min-height:54px; box-sizing:border-box; flex:0 0 auto; align-items:center; justify-content:space-between; gap:12px; padding:8px 14px; border-top:1px solid var(--line); background:#081a21; }.theme-fantasy .workspace-footer{background:#2a1a0c}.workspace-footer p{margin:0;font-size:8px;opacity:.65}.workspace-footer div{display:flex;gap:7px}.workspace-footer button{min-height:34px;padding:0 12px;border:1px solid var(--line);background:transparent;color:inherit}.workspace-footer .save-button{background:rgba(100,232,255,.14);color:var(--accent);font-weight:700}.workspace-footer button:disabled{opacity:.35;cursor:not-allowed}
.workspace-footer .workspace-save-notice { color:#9dffb6; font-size:15px; opacity:1; }.workspace-footer .workspace-save-notice.error{color:#ff9b8d}
@media (max-width:1000px){
  .layout-workspace{grid-template-columns:220px minmax(0,1fr);grid-template-rows:minmax(250px,3fr) minmax(190px,2fr)}
  .inspector-scroll{grid-template-columns:repeat(2,minmax(170px,1fr))}
  .map-core-fields { grid-template-columns:repeat(2,minmax(0,1fr)); }
  .workspace-tabs button{min-width:105px;padding:0 8px}
  .connection-panel,.simulation-panel{grid-template-columns:1fr}
  .settings-panel{grid-template-columns:1fr}
  .settings-panel .panel-card:first-child{grid-column:auto}
  .background-settings-workspace{grid-template-rows:minmax(180px,34%) auto minmax(0,1fr)}
  .background-live-panel > header small{display:none}
  .gradient-settings{grid-template-columns:repeat(2,minmax(120px,1fr))}
  .background-row{grid-template-columns:36px minmax(220px,1fr)}
  .background-row > :not(strong){grid-column:2}
  .background-transform-fields{grid-column:2;grid-template-columns:repeat(2,minmax(100px,1fr))}
  .background-transform-fields>button{grid-column:1/-1}
  .character-animation-grid{grid-template-columns:1fr}
}

/* Project typography rule: operational text is 15px; secondary IDs/labels never below 11px. */
.workspace { font-size: var(--ui-font-size-body, 15px); }
.workspace :is(button, input, select, textarea, label) { font-size: var(--ui-font-size-control, 15px); }
.workspace :is(
  .workspace-header p,
  .workspace-tabs span,
  .workspace-tabs small,
  .section-label,
  .canvas-object span,
  .canvas-object i,
  .locked-marker,
  .canvas-status,
  .inspector > header span,
  code,
  .workspace-footer p
) { font-size: var(--ui-font-size-micro, 11px); }
.canvas-toolbar,
.test-controls b,
.connection-audit p,
.template-button { font-size: var(--ui-font-size-body, 15px); }
.inspector h3 { font-size: var(--ui-font-size-body, 15px); }
</style>
