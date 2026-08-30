<template>
  <Teleport to="body">
    <BaseHudModal
      :frame-width="previewFullscreen ? 'calc(100vw - 4px)' : mobileLayout ? 'calc(100vw - 8px)' : '720px'"
      :frame-height="previewFullscreen ? 'calc(100vh - 4px)' : mobileLayout ? 'calc(100dvh - 8px)' : '1280px'"
      frame-max-height="none"
      frame-overflow="hidden"
      :frame-scale="previewFullscreen || mobileLayout ? 1 : modalScale"
      :close-on-overlay="false"
      @close="$emit('close')"
    >
      <div
        class="custom-marker-modal"
        :class="{ 'preview-fullscreen-mode': previewFullscreen, 'mobile-layout': mobileLayout }"
        :style="mobileLayoutStyle"
        @click.capture="openRangeEditorFromEvent"
        @pointerdown.capture="guardMobileRangePointerDown"
      >
      <header class="modal-header">
        <div>
          <strong v-if="mobileLayout" class="mobile-marker-name">{{ currentMarkerName }}</strong>
          <div v-else class="modal-kicker">TARGET MARKER</div>
          <h2 v-if="!mobileLayout">作成</h2>
        </div>
        <div class="header-actions">
          <div v-if="mobileLayout" class="mobile-history-actions" aria-label="変更履歴">
            <button type="button" :disabled="!canUndoDraft" aria-label="変更を戻る" @click="undoDraftChange">↶ 戻る</button>
            <button type="button" :disabled="!canRedoDraft" aria-label="変更を進む" @click="redoDraftChange">進む ↷</button>
          </div>
          <button
            v-if="mobileLayout"
            type="button"
            class="mobile-menu-trigger"
            aria-label="その他の設定を開く"
            @click="mobileMenuOpen = true"
          >
            …
          </button>
          <button v-if="!mobileLayout" type="button" class="close-button" @click="$emit('close')">閉じる</button>
        </div>
      </header>

      <section
        ref="markerPreviewRef"
        class="marker-preview"
        :style="previewBackgroundStyle"
        @click="movePreviewToPointer"
        @dblclick.stop.prevent="exitPreviewFullscreen"
        @pointermove="movePreviewWithCursor"
        @pointerleave="endPreviewCursorFollow"
      >
        <div class="preview-label">PREVIEW</div>
        <div v-if="previewFullscreen" class="fullscreen-return-hint">DOUBLE CLICK / ESC / F : RETURN</div>
        <div class="preview-controls">
          <span>{{ previewStateLabel }}</span>
          <span v-if="draft.behavior.followCursor" :class="{ tracking: previewCursorFollowActive }">
            {{ previewCursorFollowActive ? '追従中' : 'クリックで追従' }}
          </span>
          <button type="button" @click.stop="movePreviewToCenter">中央に戻す</button>
        </div>
        <div class="preview-target" :style="previewTargetStyle">
          <TargetMarker
            generation="1"
            marker-type="custom"
            :custom-marker-settings="draft"
            :is-target-moving="previewMoving"
            :custom-marker-state="previewMarkerState"
            :highlight-ring-id="highlightedRingId"
            :enable-erase-debug-preview="true"
          />
        </div>
      </section>

      <button
        v-if="mobileLayout"
        type="button"
        class="mobile-layer-trigger"
        aria-label="レイヤー一覧を開く"
        @click="openMobileLayerDrawer"
      >
        <span>LAYER</span>
        <strong>{{ selectedRingIndex + 1 }}/{{ draft.rings.length }}</strong>
      </button>

      <section class="editor-layout">
        <div class="editor-state-tabs" aria-label="編集する状態">
          <span>EDIT STATE</span>
          <button type="button" :class="{ active: editingState === 'idle' }" @click="selectEditingState('idle')">停止時</button>
          <button type="button" :class="{ active: editingState === 'transform' }" @click="selectEditingState('transform')">変換先</button>
          <button type="button" :class="{ active: editingState === 'moving' }" @click="selectEditingState('moving')">移動時</button>
          <select v-model="copyDestinationState" class="state-copy-select" aria-label="状態のコピー先">
            <option v-for="state in copyDestinationOptions" :key="state.key" :value="state.key">{{ state.label }}へ</option>
          </select>
          <button type="button" class="state-copy-button" @click="copyEditingStateTo(copyDestinationState)">コピー</button>
          <div v-if="!mobileLayout" class="desktop-history-actions" aria-label="変更履歴">
            <button type="button" :disabled="!canUndoDraft" @click="undoDraftChange">↶ 戻る</button>
            <button type="button" :disabled="!canRedoDraft" @click="redoDraftChange">進む ↷</button>
          </div>
        </div>
        <div class="ring-tabs" aria-label="編集するレイヤー">
          <div class="ring-tabs-header">
            <span class="ring-tabs-label">レイヤー</span>
            <button
              type="button"
              class="ring-tab-add"
              :disabled="draft.rings.length >= MAX_RINGS"
              :title="draft.rings.length >= MAX_RINGS ? `レイヤーは${MAX_RINGS}個までです` : '選択中のレイヤーの下へ追加'"
              aria-label="選択中のレイヤーの下へ追加"
              @click="addRing"
            >
              ＋
            </button>
          </div>
          <div class="ring-tabs-list">
            <button
              v-for="(ring, index) in draft.rings"
              :key="ring.id"
              type="button"
              :class="{ active: selectedRingId === ring.id, hidden: getRingAppearance(ring).visible === false }"
               :title="`${getRingName(ring, index)}を編集`"
              @click="selectRing(ring.id)"
            >
              <span class="ring-tab-color" :style="{ backgroundColor: getRingAppearance(ring).color }"></span>
               <span>{{ getRingName(ring, index) }}</span>
            </button>
          </div>
        </div>
        <nav class="setting-list desktop-setting-list" aria-label="ターゲットマーカー設定">
          <button
            v-for="section in sections"
            :key="section.key"
            type="button"
            :class="{ active: activeSection === section.key }"
            @click="activeSection = section.key"
          >
            {{ section.label }}
          </button>
        </nav>
        <nav v-if="mobileLayout" class="mobile-setting-list" aria-label="レイヤー設定">
          <button
            v-for="section in layerSections"
            :key="section.key"
            type="button"
            :class="{ active: activeSection === section.key }"
            @click="activeSection = section.key"
          >
            {{ section.label }}
          </button>
        </nav>

        <div class="setting-content">
          <template v-if="activeSection === 'library'">
            <h3>保存マーカー</h3>
            <p>作成中のマーカーへ名前を付け、最大20件までこのブラウザに保存できます。</p>
            <div class="library-storage-status">
              <span>保存数 <strong>{{ savedMarkers.length }} / {{ MAX_SAVED_MARKERS }}</strong></span>
              <span>残り <strong>{{ remainingMarkerSlots }}件</strong></span>
              <span>使用量 <strong>{{ markerLibrarySizeLabel }}</strong></span>
            </div>
            <label class="library-name-row">
              <span>保存名</span>
              <input v-model="libraryName" type="text" maxlength="32" placeholder="マーカー名" />
            </label>
            <div class="library-toolbar">
              <button type="button" :disabled="savedMarkers.length >= MAX_SAVED_MARKERS" @click="saveNewMarker">新規保存</button>
              <button type="button" :disabled="!selectedSavedMarkerId" @click="overwriteSavedMarker">選択中へ上書き</button>
              <button type="button" :disabled="settingsExporting" @click="exportMarkerSettings">
                {{ settingsExporting ? 'JSON準備中...' : mobileLayout ? 'JSON保存・共有' : 'JSON保存' }}
              </button>
              <button type="button" @click="openMarkerSettingsFile">JSON読込</button>
            </div>
            <div class="image-export-panel">
              <label>
                <span>画像背景</span>
                <select v-model="imageExportBackground">
                  <option value="transparent">背景透過</option>
                  <option value="preview">プレビュー背景を含める</option>
                </select>
              </label>
              <button type="button" class="image-export-button" :disabled="imageExporting" @click="exportMarkerImage">
                {{ imageExporting ? 'SVG作成中...' : mobileLayout ? 'SVG保存・共有' : '画像保存（SVG）' }}
              </button>
            </div>
            <input ref="markerSettingsFileInput" class="marker-settings-file-input" type="file" accept="application/json,.json" @change="importMarkerSettings" />
            <p class="library-export-note">作成中の停止時・移動時設定をJSONとして保存・読込できます。画像は現在のプレビュー状態をSVGで保存します。</p>
            <div v-if="libraryNotice" class="library-notice">{{ libraryNotice }}</div>
            <div v-if="savedMarkers.length === 0" class="library-empty">保存されたマーカーはありません。</div>
            <div v-else class="marker-library-list">
              <article
                v-for="marker in savedMarkers"
                :key="marker.id"
                :class="{ active: selectedSavedMarkerId === marker.id }"
              >
                <button type="button" class="library-marker-summary" @click="selectSavedMarker(marker)">
                  <span class="library-marker-color" :style="{ backgroundColor: marker.settings?.color || '#8fefff' }"></span>
                  <span class="library-marker-name">{{ marker.name }}</span>
                  <span class="library-marker-meta">
                    {{ mobileLayout ? `${marker.settings?.rings?.length || 0}層` : `${marker.settings?.rings?.length || 0}レイヤー` }}
                  </span>
                </button>
                <div class="library-marker-actions">
                  <button type="button" @click="loadSavedMarker(marker)">読込</button>
                  <button type="button" class="library-delete-button" @click="requestSavedMarkerDelete(marker.id)">削除</button>
                </div>
              </article>
            </div>
          </template>

          <template v-else-if="activeSection === 'existing'">
            <h3>既存マーカー</h3>
            <p>選択したマーカーを、編集可能なレイヤー設定として作成中データへ反映します。</p>
            <div class="preset-notice">現在のレイヤー設定は選択したプリセットで置き換わります。</div>
            <div class="existing-preset-grid">
              <button
                v-for="preset in existingMarkerPresets"
                :key="preset.key"
                type="button"
                :class="{ active: appliedPresetKey === preset.key }"
                @click="applyExistingMarkerPreset(preset)"
              >
                <span class="preset-color" :style="{ backgroundColor: preset.color }"></span>
                <span>{{ preset.label }}</span>
              </button>
            </div>
          </template>

          <template v-else-if="activeSection === 'display'">
            <h3>表示設定</h3>
            <p>上部プレビューの背景と確認方法を設定します。</p>
            <label class="setting-row">
              <span>プレビュー表示比率</span>
              <input v-model.number="draft.behavior.previewRatio" type="range" min="25" max="60" step="5" />
              <output>{{ draft.behavior.previewRatio }}%</output>
            </label>
            <div class="setting-note">初期値40%で、プレビューと設定画面がおよそ4:6になります。</div>
            <label class="setting-row">
              <span>背景色</span>
              <input v-model="draft.behavior.previewBackgroundColor" type="color" />
              <code>{{ draft.behavior.previewBackgroundColor }}</code>
            </label>
            <label class="toggle-row">
              <input v-model="draft.behavior.previewGradientEnabled" type="checkbox" />
              <span>背景グラデーションを表示</span>
            </label>
            <label class="toggle-row">
              <input v-model="draft.behavior.followCursor" type="checkbox" @change="onFollowCursorSettingChange" />
              <span>上部プレビューでカーソル追従</span>
            </label>
            <label v-if="draft.behavior.followCursor" class="setting-row">
              <span>移動速度</span>
              <input v-model.number="draft.behavior.cursorFollowSpeed" type="range" min="10" max="300" step="5" />
              <output>{{ draft.behavior.cursorFollowSpeed }}%/秒</output>
            </label>
            <div class="setting-note">ON時は上部プレビューをクリックすると追従開始、もう一度クリックすると停止します。カーソル移動中は移動時設定を表示します。</div>
            <button type="button" class="preview-fullscreen-button" @click="enterPreviewFullscreen">プレビューを全面表示</button>
          </template>

          <template v-else-if="activeSection === 'overall'">
            <h3>全体設定</h3>
            <p>マーカー全体の形、サイズ、表示を設定します。</p>
            <details class="danger-settings">
              <summary>全レイヤーの形状を一括変更</summary>
              <p>すべてのレイヤー形状を書き換えます。個別に設定した形状は失われます。</p>
              <div class="choice-grid">
                <button
                  v-for="shape in shapes"
                  :key="shape.key"
                  type="button"
                  :class="{ active: selectedOverall.shape === shape.key }"
                  @click="requestOverallShapeChange(shape.key)"
                >
                  {{ shape.label }}
                </button>
              </div>
              <div v-if="pendingOverallShape" class="shape-confirmation">
                <strong>全レイヤーを「{{ shapeLabel(pendingOverallShape) }}」へ変更しますか？</strong>
                <div>
                  <button type="button" @click="confirmOverallShapeChange">変更する</button>
                  <button type="button" @click="pendingOverallShape = null">キャンセル</button>
                </div>
              </div>
            </details>
            <label class="setting-row">
              <span>全体の横幅</span>
              <input v-model.number="selectedOverall.width" type="range" min="10" max="180" step="1" />
              <output>{{ selectedOverall.width }}%</output>
            </label>
            <label class="setting-row">
              <span>全体の縦幅</span>
              <input v-model.number="selectedOverall.height" type="range" min="10" max="180" step="1" />
              <output>{{ selectedOverall.height }}%</output>
            </label>
            <label class="toggle-row">
              <input v-model="selectedOverall.applyAspectToLayers" type="checkbox" />
              <span>全体の縦横比をレイヤーの回転・サイズに反映</span>
            </label>
            <p class="setting-hint">OFFにすると、全体の表示枠だけを縦横に変更し、各レイヤーと回転は正方形の比率を維持します。</p>
            <label class="setting-row">
              <span>全体の透明度</span>
              <input v-model.number="selectedOverall.opacity" type="range" min="25" max="100" step="1" />
              <output>{{ selectedOverall.opacity }}%</output>
            </label>
            <details class="ring-advanced-settings">
              <summary>マーカー全体の動き</summary>
              <p>全レイヤーを一つのマーカーとして動かします。レイヤーごとの動きとも同時に使用できます。</p>
              <label v-if="['moving', 'transform'].includes(editingState)" class="toggle-row state-enabled-toggle">
                <input v-model="selectedWholeMotion.traceIdle" type="checkbox" />
                <span>停止時の動きをトレースする</span>
              </label>
              <p v-if="selectedWholeMotionTracesIdle" class="setting-hint">停止時の全体動作をそのまま続けながら、{{ editingStateLabel }}の形状変化を同時に行います。</p>
              <template v-if="!selectedWholeMotionTracesIdle">
              <label v-if="editingState !== 'transform'" class="toggle-row state-enabled-toggle">
                <input v-model="selectedWholeMotion.enabled" type="checkbox" />
                <span>この状態で全体をアニメーションする</span>
              </label>
              <section class="motion-block">
                <label class="toggle-row motion-toggle">
                  <input v-model="selectedWholeMotion.rotateEnabled" type="checkbox" :disabled="!selectedWholeMotion.enabled" />
                  <span>全体を回転</span>
                </label>
                <label v-if="selectedWholeMotion.rotateEnabled" class="setting-row">
                  <span>回転速度</span>
                  <input v-model.number="selectedWholeMotion.rotateDuration" type="range" min="1" max="20" step="1" :disabled="!selectedWholeMotion.enabled" />
                  <output>{{ selectedWholeMotion.rotateDuration }}秒</output>
                </label>
                <label v-if="selectedWholeMotion.rotateEnabled" class="setting-row select-row">
                  <span>回転方向</span>
                  <select v-model="selectedWholeMotion.direction" :disabled="!selectedWholeMotion.enabled">
                    <option value="normal">時計回り</option>
                    <option value="reverse">反時計回り</option>
                  </select>
                </label>
              </section>
              <section class="motion-block">
                <label class="toggle-row motion-toggle">
                  <input v-model="selectedWholeMotion.pulseEnabled" type="checkbox" :disabled="!selectedWholeMotion.enabled" />
                  <span>全体を縮小・拡大</span>
                </label>
                <label v-if="selectedWholeMotion.pulseEnabled" class="setting-row">
                  <span>伸縮速度</span>
                  <input v-model.number="selectedWholeMotion.pulseDuration" type="range" min="1" max="20" step="1" :disabled="!selectedWholeMotion.enabled" />
                  <output>{{ selectedWholeMotion.pulseDuration }}秒</output>
                </label>
                <label v-if="selectedWholeMotion.pulseEnabled" class="setting-row">
                  <span>伸縮量</span>
                  <input v-model.number="selectedWholeMotion.pulseAmount" type="range" min="2" max="45" step="1" :disabled="!selectedWholeMotion.enabled" />
                  <output>{{ selectedWholeMotion.pulseAmount }}%</output>
                </label>
              </section>
              <section class="motion-block">
                <label class="toggle-row motion-toggle">
                  <input v-model="selectedWholeMotion.glowEnabled" type="checkbox" :disabled="!selectedWholeMotion.enabled" />
                  <span>全体の発光を動かす</span>
                </label>
                <label v-if="selectedWholeMotion.glowEnabled" class="setting-row">
                  <span>最小発光</span>
                  <input v-model.number="selectedWholeMotion.glowMin" type="range" min="0" max="30" step="1" :disabled="!selectedWholeMotion.enabled" />
                  <output>{{ selectedWholeMotion.glowMin }}</output>
                </label>
                <label v-if="selectedWholeMotion.glowEnabled" class="setting-row">
                  <span>最大発光</span>
                  <input v-model.number="selectedWholeMotion.glowMax" type="range" min="0" max="40" step="1" :disabled="!selectedWholeMotion.enabled" />
                  <output>{{ selectedWholeMotion.glowMax }}</output>
                </label>
                <label v-if="selectedWholeMotion.glowEnabled" class="setting-row">
                  <span>発光速度</span>
                  <input v-model.number="selectedWholeMotion.glowDuration" type="range" min="0.5" max="10" step="0.5" :disabled="!selectedWholeMotion.enabled" />
                  <output>{{ selectedWholeMotion.glowDuration }}秒</output>
                </label>
              </section>
              <label class="setting-row">
                <span>開始遅延</span>
                <input v-model.number="selectedWholeMotion.delay" type="range" min="0" max="10" step="0.5" :disabled="!selectedWholeMotion.enabled" />
                <output>{{ selectedWholeMotion.delay }}秒</output>
              </label>
              <label class="toggle-row">
                <input v-model="selectedWholeMotion.repeat" type="checkbox" :disabled="!selectedWholeMotion.enabled" />
                <span>全体の動きを繰り返す</span>
              </label>
              </template>
            </details>
            <label class="toggle-row">
              <input v-model="selectedOverall.showCenterDot" type="checkbox" />
              <span>中央点を表示</span>
            </label>
            <section v-if="editingState === 'transform'" class="transform-transition-settings">
              <h4>全体の変換タイミング</h4>
              <p>マーカー全体と、全体設定を使うレイヤーに適用します。</p>
              <label class="setting-row select-row">
                <span>変換動作</span>
                <select :value="draft.transition.transformMode" @change="setTransformMode($event.target.value)">
                  <option value="none">アニメーションしない</option>
                  <option value="reverse">変換先となってから戻る</option>
                  <option value="reset">変換完了後に停止時へ戻る</option>
                </select>
              </label>
              <label class="setting-row">
                <span>変更速度</span>
                <input v-model.number="draft.transition.transformDuration" type="range" min="100" max="10000" step="100" />
                <output>{{ draft.transition.transformDuration }}ms</output>
              </label>
              <label v-if="draft.transition.transformMode === 'reverse'" class="setting-row">
                <span>戻る速度</span>
                <input v-model.number="draft.transition.transformReturnDuration" type="range" min="100" max="10000" step="100" />
                <output>{{ draft.transition.transformReturnDuration }}ms</output>
              </label>
              <label class="setting-row">
                <span>動き出し遅延</span>
                <input v-model.number="draft.transition.transformStartDelay" type="range" min="0" max="10000" step="100" />
                <output>{{ draft.transition.transformStartDelay }}ms</output>
              </label>
              <label class="setting-row">
                <span>変換先になってからの遅延</span>
                <input v-model.number="draft.transition.transformHoldDuration" type="range" min="0" max="10000" step="100" />
                <output>{{ draft.transition.transformHoldDuration }}ms</output>
              </label>
              <label class="setting-row select-row">
                <span>変化方法</span>
                <select v-model="draft.transition.easing">
                  <option value="linear">一定</option>
                  <option value="ease-in-out">滑らか</option>
                  <option value="ease-in">加速</option>
                  <option value="ease-out">減速</option>
                </select>
              </label>
            </section>
            <div class="transition-settings">
              <h3>移動変形</h3>
              <p>停止時と移動時の形状を切り替える順序と時間を設定します。</p>
              <label class="setting-row select-row">
                <span>実行順</span>
                <select v-model="draft.transition.sequence">
                  <option value="before">変形してから移動</option>
                  <option value="simultaneous">移動しながら変形</option>
                  <option value="after">移動してから変形</option>
                </select>
              </label>
              <label class="setting-row">
                <span>移動形状へ</span>
                <input v-model.number="draft.transition.morphInDuration" type="range" min="0" max="1500" step="50" />
                <output>{{ draft.transition.morphInDuration }}ms</output>
              </label>
              <label class="setting-row">
                <span>移動時間</span>
                <input v-model.number="draft.transition.moveDuration" type="range" min="100" max="2000" step="50" />
                <output>{{ draft.transition.moveDuration }}ms</output>
              </label>
              <label class="setting-row">
                <span>停止形状へ</span>
                <input v-model.number="draft.transition.morphOutDuration" type="range" min="0" max="1500" step="50" />
                <output>{{ draft.transition.morphOutDuration }}ms</output>
              </label>
            </div>
          </template>

          <template v-else-if="activeSection === 'rings'">
            <div class="section-heading">
              <div>
                <h3>{{ mobileLayout ? getRingName(selectedRing, selectedRingIndex) : 'レイヤー' }}</h3>
                <p>追加したレイヤーごとに表示設定を変更できます。</p>
              </div>
              <div class="ring-action-buttons">
                <button type="button" :disabled="draft.rings.length >= MAX_RINGS" @click="duplicateSelectedRing">複製</button>
                <button type="button" :disabled="selectedRingIndex >= draft.rings.length - 1" @click="moveSelectedRing(1)">後ろへ</button>
                <button type="button" :disabled="selectedRingIndex <= 0" @click="moveSelectedRing(-1)">前へ</button>
              </div>
            </div>
            <label class="setting-row select-row render-mode-select">
              <span>配置方式</span>
              <select :value="selectedRingAppearance.renderMode" @change="setRenderMode($event.target.value)">
                <option v-for="mode in renderModes" :key="mode.key" :value="mode.key">{{ mode.label }}</option>
              </select>
            </label>
            <p class="render-mode-description">
              {{ renderModes.find(mode => mode.key === selectedRingAppearance.renderMode)?.description }}
            </p>
            <label v-if="selectedRingAppearance.renderMode !== 'segmentedArc'" class="setting-row select-row">
              <span>形状</span>
              <select v-model="selectedRingAppearance.shape" @change="onRingShapeChange">
                <option v-for="shape in shapes" :key="shape.key" :value="shape.key">{{ shape.label }}</option>
              </select>
            </label>
            <label v-if="['moon', 'sharpMoon'].includes(selectedRingAppearance.shape)" class="setting-row">
              <span>{{ selectedRingAppearance.shape === 'sharpMoon' ? '内円の大きさ' : '月の欠け方' }}</span>
              <input v-model.number="selectedRingAppearance.moonPhase" type="range" min="0" max="100" step="1" />
              <output>{{ selectedRingAppearance.shape === 'sharpMoon' ? `${selectedRingAppearance.moonPhase}%` : moonPhaseLabel(selectedRingAppearance.moonPhase) }}</output>
            </label>
            <label v-if="selectedRingAppearance.shape === 'sharpMoon'" class="setting-row">
              <span>内円の接触位置</span>
              <input v-model.number="selectedRingAppearance.innerCircleAngle" type="range" min="0" max="359" step="1" />
              <output>{{ selectedRingAppearance.innerCircleAngle }}°</output>
            </label>
            <template v-if="['gear', 'gear2'].includes(selectedRingAppearance.shape)">
              <label class="setting-row">
                <span>歯の数</span>
                <input v-model.number="selectedRingAppearance.gearTeeth" type="range" min="6" max="32" step="1" />
                <output>
                  {{ selectedRingAppearance.gearTeeth }}
                  <template v-if="selectedRingAppearance.shape === 'gear2'">（支柱 {{ getGearSpokeCount(selectedRingAppearance.gearTeeth, selectedRingAppearance.shape) }}）</template>
                </output>
              </label>
              <label v-if="selectedRingAppearance.shape === 'gear'" class="toggle-row">
                <input v-model="selectedRingAppearance.gearSupportsEnabled" type="checkbox" />
                <span>支柱を追加</span>
              </label>
              <label v-if="selectedRingAppearance.shape === 'gear' && selectedRingAppearance.gearSupportsEnabled" class="setting-row">
                <span>支柱数</span>
                <input v-model.number="selectedRingAppearance.gearSupportCount" type="range" min="1" max="16" step="1" />
                <output>{{ selectedRingAppearance.gearSupportCount }}</output>
              </label>
              <label v-if="selectedRingAppearance.shape === 'gear' && selectedRingAppearance.gearSupportsEnabled" class="setting-row">
                <span>支柱の内外位置</span>
                <input v-model.number="selectedRingAppearance.gearSupportOffset" type="range" min="-30" max="30" step="1" />
                <output>{{ selectedRingAppearance.gearSupportOffset }}%</output>
              </label>
              <label v-if="selectedRingAppearance.shape === 'gear2'" class="setting-row">
                <span>中央の円の大きさ</span>
                <input v-model.number="selectedRingAppearance.gearInnerSize" type="range" min="5" max="90" step="1" />
                <output>{{ selectedRingAppearance.gearInnerSize }}%</output>
              </label>
            </template>
            <label v-if="selectedRingAppearance.renderMode !== 'textRing'" class="setting-row">
              <span>色</span>
              <input v-model="selectedRingAppearance.color" type="color" />
              <code>{{ selectedRingAppearance.color }}</code>
            </label>
            <label v-if="selectedRingAppearance.renderMode !== 'textRing'" class="setting-row">
              <span>横幅</span>
              <input v-model.number="selectedRingAppearance.width" type="range" min="1" max="140" step="1" />
              <output>{{ selectedRingAppearance.width }}%</output>
            </label>
            <label v-if="selectedRingAppearance.renderMode !== 'textRing'" class="setting-row">
              <span>縦幅</span>
              <input v-model.number="selectedRingAppearance.height" type="range" min="1" max="140" step="1" />
              <output>{{ selectedRingAppearance.height }}%</output>
            </label>
            <label v-if="selectedRingAppearance.shape === 'segmentedRing' || selectedRingAppearance.renderMode === 'circumference' || (selectedRingAppearance.renderMode === 'textRing' && selectedRingAppearance.textMode === 'labels')" class="setting-row">
              <span>分割数</span>
              <input v-model.number="selectedRingAppearance.splitCount" type="range" :min="selectedRingAppearance.shape === 'segmentedRing' ? 2 : 1" :max="selectedRingAppearance.renderMode === 'textRing' ? 64 : 8" step="1" />
              <output>{{ selectedRingAppearance.splitCount }}</output>
            </label>
            <label v-if="selectedRingAppearance.shape === 'polygon'" class="setting-row">
              <span>頂点数</span>
              <input v-model.number="selectedRingAppearance.polygonSides" type="range" min="3" max="24" step="1" />
              <output>{{ selectedRingAppearance.polygonSides }}</output>
            </label>
            <template v-if="selectedRingAppearance.renderMode === 'textRing'">
              <label class="setting-row select-row">
                <span>文字の入力方法</span>
                <select v-model="selectedRingAppearance.textMode">
                  <option value="string">連続文字列</option>
                  <option value="labels">個別ラベル</option>
                </select>
              </label>
              <div class="setting-row font-picker-row">
                <span>フォント</span>
                <button type="button" class="font-picker-trigger" @click="fontPickerOpen = true">
                  <strong>{{ selectedTextFontLabel }}</strong>
                  <span :style="{ fontFamily: selectedTextFontFamily }">魔法陣 TARGET 123</span>
                </button>
              </div>
              <label v-if="selectedRingAppearance.textFontPreset === 'custom'" class="setting-row text-setting-row">
                <span>カスタムフォント</span>
                <input
                  v-model="selectedRingAppearance.textCustomFontFamily"
                  type="text"
                  maxlength="120"
                  placeholder='例: "Cinzel Decorative", serif'
                />
              </label>
              <div class="text-quick-settings">
                <label class="text-quick-color">
                  <span>色</span>
                  <input v-model="selectedRingAppearance.color" type="color" />
                  <code>{{ selectedRingAppearance.color }}</code>
                </label>
                <label class="text-quick-size setting-row">
                  <span>文字サイズ</span>
                  <input v-model.number="selectedRingAppearance.textSize" type="range" min="6" max="40" step="1" />
                  <output>{{ selectedRingAppearance.textSize }}px</output>
                </label>
                <label class="text-quick-bold">
                  <input
                    type="checkbox"
                    :checked="selectedRingAppearance.textWeight === 'bold'"
                    @change="selectedRingAppearance.textWeight = $event.target.checked ? 'bold' : 'normal'"
                  />
                  <span>太字</span>
                </label>
              </div>
              <label v-if="selectedRingAppearance.textMode === 'string'" class="setting-row text-setting-row">
                <span>文字列</span>
                <input
                  v-model="selectedRingAppearance.textContent"
                  class="text-value-input"
                  type="text"
                  maxlength="64"
                  :placeholder="isRuneFontPreset(selectedRingAppearance.textFontPreset) ? 'ᚠᚢᚦᚨᚱᚲ' : 'TARGET LOCKED'"
                  @input="sanitizeSelectedTextContent"
                />
                <button
                  v-if="isRuneFontPreset(selectedRingAppearance.textFontPreset)"
                  type="button"
                  class="rune-input-button"
                  @click="openRuneEditor('text')"
                >ルーン入力</button>
                <output>{{ countTextCharacters(selectedRingAppearance.textContent) }}/64</output>
              </label>
              <label v-if="selectedRingAppearance.textMode === 'string'" class="setting-row">
                <span>文字の分割数</span>
                <input v-model.number="selectedRingAppearance.textDivisionCount" type="range" min="1" max="8" step="1" />
                <output>{{ selectedRingAppearance.textDivisionCount }}</output>
              </label>
              <p v-if="selectedRingAppearance.textMode === 'string' && selectedRingAppearance.textDivisionCount > 1" class="setting-hint">文字列を分割片ごとに割り当て、選択した形状の輪郭に沿って配置します。</p>
              <div v-if="selectedRingAppearance.textMode === 'labels'" class="segment-label-grid">
                <label v-for="index in selectedRingItemCount" :key="index">
                  <span>{{ index }}</span>
                    <input
                      v-model="selectedRingAppearance.segmentLabels[index - 1]"
                      type="text"
                      maxlength="8"
                      :placeholder="isRuneFontPreset(selectedRingAppearance.textFontPreset) ? 'ᚠᚢᚦ' : ''"
                      @input="sanitizeSegmentLabel(index - 1, $event)"
                    />
                    <button
                      v-if="isRuneFontPreset(selectedRingAppearance.textFontPreset)"
                      type="button"
                      class="rune-input-button rune-label-input-button"
                      @click="openRuneEditor('label', index - 1)"
                    >入力</button>
                  </label>
              </div>
              <label class="setting-row select-row">
                <span>文字の配置</span>
                <select v-model="selectedRingAppearance.textLayout">
                  <option value="circle">円周</option>
                  <option value="shape">形状に沿う</option>
                </select>
              </label>
              <label class="setting-row select-row">
                <span>配置基準レイヤー</span>
                <select v-model="selectedRingAppearance.textReferenceRingId">
                  <option value="self">この文字レイヤー</option>
                  <option
                    v-for="(ring, index) in draft.rings"
                    :key="ring.id"
                    :value="ring.id"
                    :disabled="ring.id === selectedRing.id"
                  >{{ getRingName(ring, index) }}</option>
                </select>
              </label>
              <p v-if="selectedRingAppearance.textReferenceRingId !== 'self'" class="setting-hint">選択したレイヤーの形・縦横比・角度・位置に文字を合わせます。</p>
              <label v-if="selectedRingAppearance.textReferenceRingId !== 'self'" class="setting-row">
                <span>基準からの大きさ</span>
                <input v-model.number="selectedRingAppearance.textReferenceScale" type="range" min="50" max="160" step="1" />
                <output>{{ selectedRingAppearance.textReferenceScale }}%</output>
              </label>
              <p v-if="selectedRingAppearance.textLayout === 'shape'" class="setting-hint">円・四角・三角・菱形・星・G5オービットの輪郭に沿って配置します。</p>
              <label v-if="selectedRingAppearance.textLayout !== 'shape'" class="setting-row">
                <span>配置半径</span>
                <input v-model.number="selectedRingAppearance.textRadius" type="range" min="0" max="70" step="1" />
                <output>{{ selectedRingAppearance.textRadius }}%</output>
              </label>
              <label v-if="!selectedRingAppearance.textEvenSpacing" class="setting-row">
                <span>文字間隔</span>
                <input v-model.number="selectedRingAppearance.textSpacing" type="range" min="25" max="200" step="5" />
                <output>{{ selectedRingAppearance.textSpacing }}%</output>
              </label>
              <label class="toggle-row">
                <input v-model="selectedRingAppearance.textEvenSpacing" type="checkbox" />
                <span>文字を均等配置する</span>
              </label>
              <label v-if="selectedRingAppearance.textEvenSpacing" class="setting-row">
                <span>配置範囲</span>
                <input v-model.number="selectedRingAppearance.textArcSpread" type="range" min="1" max="360" step="1" />
                <output>{{ selectedRingAppearance.textLayout === 'shape' ? Math.round(selectedRingAppearance.textArcSpread / 360 * 100) + '%' : selectedRingAppearance.textArcSpread + '°' }}</output>
              </label>
              <label class="setting-row">
                <span>{{ selectedRingAppearance.textLayout === 'shape' ? '開始位置' : '開始角度' }}</span>
                <input v-model.number="selectedRingAppearance.arcAngle" type="range" min="0" max="359" step="1" />
                <output>{{ selectedRingAppearance.textLayout === 'shape' ? Math.round(selectedRingAppearance.arcAngle / 359 * 100) + '%' : selectedRingAppearance.arcAngle + '°' }}</output>
              </label>
              <label class="setting-row select-row">
                <span>配置方向</span>
                <select v-model="selectedRingAppearance.textDirection">
                  <option value="clockwise">時計回り</option>
                  <option value="counterclockwise">反時計回り</option>
                </select>
              </label>
              <label class="setting-row select-row">
                <span>文字の向き</span>
                <select v-model="selectedRingAppearance.textOrientation">
                  <option value="outward">外向き</option>
                  <option value="inward">内向き</option>
                  <option value="centerFacing">中央へ頭を向ける</option>
                  <option value="upright">常に正立</option>
                  <option value="tangent">輪郭に沿う</option>
                </select>
              </label>
            </template>
            <label v-if="selectedRingAppearance.renderMode === 'circumference' && selectedRingAppearance.splitCount > 1" class="toggle-row">
              <input v-model="selectedRingAppearance.equalizeSegments" type="checkbox" />
              <span>分割片を正形にする</span>
            </label>
            <label v-if="selectedRingAppearance.renderMode === 'circumference' && selectedRingAppearance.splitCount > 1" class="toggle-row">
              <input v-model="selectedRingAppearance.evenSpacing" type="checkbox" />
              <span>分割片を均等配置する</span>
            </label>
            <label v-if="selectedRingAppearance.shape === 'segmentedRing'" class="setting-row">
              <span>円弧間隔</span>
              <input v-model.number="selectedRingAppearance.splitGap" type="range" min="0" max="20" step="1" />
              <output>{{ selectedRingAppearance.splitGap }}</output>
            </label>
            <label v-if="selectedRingAppearance.renderMode === 'circumference' && !selectedRingAppearance.evenSpacing" class="setting-row">
              <span>円弧角度</span>
              <input v-model.number="selectedRingAppearance.arcSpread" type="range" min="0" max="360" step="1" />
              <output>{{ selectedRingAppearance.arcSpread }}°</output>
            </label>
            <label v-if="selectedRingAppearance.renderMode === 'circumference' || selectedRingAppearance.shape === 'polygon'" class="setting-row">
              <span>{{ selectedRingAppearance.shape === 'polygon' ? '頂点半径' : '軌道半径' }}</span>
              <input v-model.number="selectedRingAppearance.arcRadius" type="range" min="0" max="70" step="1" />
              <output>{{ selectedRingAppearance.arcRadius }}%</output>
            </label>
            <label v-if="selectedRingAppearance.renderMode === 'circumference' || selectedRingAppearance.shape === 'polygon'" class="setting-row">
              <span>{{ selectedRingAppearance.shape === 'polygon' ? '開始角度' : '配置角度' }}</span>
              <input v-model.number="selectedRingAppearance.arcAngle" type="range" min="0" max="359" step="1" />
              <output>{{ selectedRingAppearance.arcAngle }}°</output>
            </label>
            <label v-if="selectedRingAppearance.renderMode === 'circumference'" class="setting-row select-row">
              <span>円弧の向き</span>
              <select v-model="selectedRingAppearance.arcOrientation">
                <option value="tangent">接線方向</option>
                <option value="radial">中央方向</option>
                <option value="fixed">角度固定</option>
              </select>
            </label>
            <label v-if="selectedRingAppearance.renderMode !== 'textRing'" class="setting-row">
              <span>角度</span>
              <input v-model.number="selectedRingAppearance.angle" type="range" min="0" max="359" step="1" />
              <output>{{ selectedRingAppearance.angle }}°</output>
            </label>
            <template v-if="selectedRingAppearance.shape === 'magitechWave'">
              <p class="setting-group-label">G4ウェーブ</p>
              <label class="setting-row">
                <span>ブレ幅</span>
                <input v-model.number="selectedRingAppearance.waveAmplitude" type="range" min="0" max="10" step="0.5" />
                <output>{{ selectedRingAppearance.waveAmplitude }}</output>
              </label>
              <label class="setting-row">
                <span>波の数</span>
                <input v-model.number="selectedRingAppearance.waveCount" type="range" min="1" max="24" step="1" />
                <output>{{ selectedRingAppearance.waveCount }}</output>
              </label>
              <label class="setting-row">
                <span>ランダムさ</span>
                <input v-model.number="selectedRingAppearance.waveRandomness" type="range" min="0" max="100" step="1" />
                <output>{{ selectedRingAppearance.waveRandomness }}%</output>
              </label>
              <label class="setting-row">
                <span>揺れ速度</span>
                <input v-model.number="selectedRingAppearance.waveSpeed" type="range" min="0" max="3" step="0.1" />
                <output>{{ selectedRingAppearance.waveSpeed.toFixed(1) }}x</output>
              </label>
            </template>
            <label v-if="selectedRingAppearance.shape === 'polygon'" class="toggle-row">
              <input v-model="selectedRingAppearance.connectionClosed" type="checkbox" />
              <span>最後の点を最初の点へ接続</span>
            </label>
            <label v-if="selectedRingAppearance.renderMode !== 'textRing'" class="setting-row select-row">
              <span>線種</span>
              <select v-model="selectedRingAppearance.lineStyle">
                <option value="solid">実線</option>
                <option value="dashed">破線</option>
                <option value="dotted">点線</option>
                <option value="double">二重線</option>
              </select>
            </label>
            <template v-if="selectedRingAppearance.renderMode !== 'textRing' && selectedRingAppearance.lineStyle === 'dashed'">
              <label class="setting-row">
                <span>破線の長さ</span>
                <input v-model.number="selectedRingAppearance.dashLength" type="range" min="1" max="40" step="1" />
                <output>{{ selectedRingAppearance.dashLength }}</output>
              </label>
              <label class="setting-row">
                <span>破線の間隔</span>
                <input v-model.number="selectedRingAppearance.dashGap" type="range" min="1" max="40" step="1" />
                <output>{{ selectedRingAppearance.dashGap }}</output>
              </label>
              <label class="setting-row">
                <span>破線のランダム性</span>
                <input v-model.number="selectedRingAppearance.dashRandomness" type="range" min="0" max="100" step="1" />
                <output>{{ selectedRingAppearance.dashRandomness }}%</output>
              </label>
            </template>
            <label v-if="selectedRingAppearance.renderMode !== 'textRing'" class="setting-row">
              <span>線の太さ</span>
              <input v-model.number="selectedRingAppearance.lineWidth" type="range" min="1" max="8" step="1" />
              <output>{{ selectedRingAppearance.lineWidth }}px</output>
            </label>
            <label class="setting-row">
              <span>透明度</span>
              <input v-model.number="selectedRingAppearance.opacity" type="range" min="10" max="100" step="1" />
              <output>{{ selectedRingAppearance.opacity }}%</output>
            </label>
            <label class="setting-row">
              <span>発光</span>
              <input v-model.number="selectedRingAppearance.glow" type="range" min="0" max="30" step="1" />
              <output>{{ selectedRingAppearance.glow }}</output>
            </label>
            <label class="setting-row">
              <span>発光色</span>
              <input v-model="selectedRingAppearance.glowColor" type="color" />
              <code>{{ selectedRingAppearance.glowColor }}</code>
            </label>
            <label v-if="!['segmentedArc', 'textRing'].includes(selectedRingAppearance.renderMode)" class="toggle-row">
              <input v-model="selectedRingAppearance.fillEnabled" type="checkbox" />
              <span>内側を塗る</span>
            </label>
            <template v-if="!['segmentedArc', 'textRing'].includes(selectedRingAppearance.renderMode) && selectedRingAppearance.fillEnabled">
              <label v-if="selectedRingAppearance.lineStyle === 'double'" class="toggle-row">
                <input v-model="selectedRingAppearance.fillBetweenDoubleLines" type="checkbox" />
                <span>二重線の間だけ塗る</span>
              </label>
              <template v-if="selectedRingAppearance.shape === 'gear'">
                <label class="toggle-row">
                  <input v-model="selectedRingAppearance.gearFillBody" type="checkbox" />
                  <span>支柱以外を塗る</span>
                </label>
              </template>
              <label class="setting-row">
                <span>塗り色</span>
                <input v-model="selectedRingAppearance.fillColor" type="color" />
                <code>{{ selectedRingAppearance.fillColor }}</code>
              </label>
              <label class="setting-row">
                <span>塗り透明度</span>
                <input v-model.number="selectedRingAppearance.fillOpacity" type="range" min="0" max="100" step="1" />
                <output>{{ selectedRingAppearance.fillOpacity }}%</output>
              </label>
              <label v-if="selectedRingSupportsCutout" class="toggle-row">
                <input v-model="selectedRingAppearance.cutoutEnabled" type="checkbox" />
                <span>内側をくり抜く</span>
              </label>
              <label v-if="selectedRingSupportsCutout && selectedRingAppearance.cutoutEnabled" class="setting-row">
                <span>くり抜きサイズ</span>
                <input v-model.number="selectedRingAppearance.cutoutSize" type="range" min="10" max="90" step="1" />
                <output>{{ selectedRingAppearance.cutoutSize }}%</output>
              </label>
            </template>
            <label v-if="selectedRingSupportsLayerErase" class="toggle-row layer-erase-toggle">
              <input v-model="selectedRingAppearance.eraseBelow" type="checkbox" />
              <span>形状の内側で下層レイヤーを透明化</span>
            </label>
            <label v-if="selectedRingSupportsLayerErase && selectedRingAppearance.eraseBelow" class="toggle-row layer-erase-toggle">
              <input v-model="selectedRingAppearance.eraseDebug" type="checkbox" />
              <span>透過確認（確認色を表示）</span>
            </label>
            <p v-if="selectedRingAppearance.eraseBelow" class="setting-hint">このレイヤーより描画順が下のマーカーだけを切り抜きます。背景とキャラクターは穴から表示されます。</p>
            <p v-if="selectedRingAppearance.eraseBelow && selectedRingAppearance.eraseDebug" class="setting-hint">マゼンタ色の範囲が、現在このレイヤーから透明化判定へ渡されている領域です。確認色は編集プレビューだけに表示されます。</p>
            <label v-if="['circumference', 'textRing'].includes(selectedRingAppearance.renderMode) && selectedRingItemCount > 1" class="toggle-row">
              <input v-model="selectedRingAppearance.useSegmentColors" type="checkbox" />
              <span>分割片ごとに色を設定</span>
            </label>
            <div v-if="['circumference', 'textRing'].includes(selectedRingAppearance.renderMode) && selectedRingItemCount > 1 && selectedRingAppearance.useSegmentColors" class="segment-color-grid">
              <label v-for="index in selectedRingItemCount" :key="index">
                <span>{{ index }}</span>
                <input v-model="selectedRingAppearance.segmentColors[index - 1]" type="color" />
              </label>
            </div>
            <details
              class="ring-advanced-settings"
              :open="ringAdvancedSettingsOpen"
              @toggle="ringAdvancedSettingsOpen = $event.currentTarget.open"
            >
              <summary>詳細設定</summary>
              <p>このレイヤーだけに適用する名前、位置、反転、重なり方、線の見た目を設定します。</p>
              <label class="setting-row text-setting-row">
                <span>レイヤー名</span>
                <input v-model="selectedRing.name" class="text-value-input" type="text" maxlength="20" :placeholder="shapeLabel(selectedRingAppearance.shape)" />
              </label>
              <label class="setting-row">
                <span>横位置</span>
                <input v-model.number="selectedRingAppearance.offsetX" type="range" min="-50" max="50" step="1" />
                <output>{{ selectedRingAppearance.offsetX }}%</output>
              </label>
              <label class="setting-row">
                <span>縦位置</span>
                <input v-model.number="selectedRingAppearance.offsetY" type="range" min="-50" max="50" step="1" />
                <output>{{ selectedRingAppearance.offsetY }}%</output>
              </label>
              <label class="setting-row">
                <span>重なり順</span>
                <input v-model.number="selectedRingAppearance.zIndex" type="range" min="0" max="32" step="1" />
                <output>{{ selectedRingAppearance.zIndex }}</output>
              </label>
              <label class="setting-row select-row">
                <span>合成方法</span>
                <select v-model="selectedRingAppearance.blendMode">
                  <option value="normal">通常</option>
                  <option value="screen">スクリーン</option>
                  <option value="plus-lighter">加算</option>
                  <option value="lighten">比較（明）</option>
                </select>
              </label>
              <div class="advanced-toggle-pair">
                <label class="toggle-row"><input v-model="selectedRingAppearance.flipX" type="checkbox" /><span>左右反転</span></label>
                <label class="toggle-row"><input v-model="selectedRingAppearance.flipY" type="checkbox" /><span>上下反転</span></label>
              </div>
              <template v-if="selectedRingAppearance.renderMode !== 'textRing'">
                <label class="setting-row select-row">
                  <span>線端</span>
                  <select v-model="selectedRingAppearance.lineCap">
                    <option value="butt">平坦</option>
                    <option value="round">丸</option>
                    <option value="square">四角</option>
                  </select>
                </label>
                <label class="setting-row select-row">
                  <span>線の角</span>
                  <select v-model="selectedRingAppearance.lineJoin">
                    <option value="miter">尖り</option>
                    <option value="round">丸</option>
                    <option value="bevel">面取り</option>
                  </select>
                </label>
                <label v-if="selectedRingAppearance.lineJoin === 'miter'" class="setting-row">
                  <span>角の鋭さ</span>
                  <input v-model.number="selectedRingAppearance.miterLimit" type="range" min="1" max="20" step="1" />
                  <output>{{ selectedRingAppearance.miterLimit }}</output>
                </label>
                <label v-if="selectedRingAppearance.lineStyle !== 'solid'" class="setting-row">
                  <span>破線の開始位置</span>
                  <input v-model.number="selectedRingAppearance.dashOffset" type="range" min="-40" max="40" step="1" />
                  <output>{{ selectedRingAppearance.dashOffset }}</output>
                </label>
                <label v-if="selectedRingAppearance.lineStyle === 'double'" class="setting-row">
                  <span>二重線の間隔</span>
                  <input v-model.number="selectedRingAppearance.doubleLineGap" type="range" min="0" max="100" step="1" />
                  <output>{{ selectedRingAppearance.doubleLineGap }}%</output>
                </label>
              </template>
            </details>
            <label class="toggle-row">
              <input v-model="selectedRingAppearance.visible" type="checkbox" />
              <span>このレイヤーを表示</span>
            </label>
            <button
              type="button"
              class="remove-ring-button"
              :disabled="draft.rings.length <= 1"
              @click="requestSelectedRingDelete"
            >
              選択中のレイヤーを削除
            </button>
          </template>

          <template v-else-if="activeSection === 'motion'">
            <h3>動き</h3>
            <p>レイヤー {{ selectedRingIndex + 1 }} の停止時・移動時・変換先を個別に設定します。</p>
            <section v-if="editingState === 'transform'" class="transform-transition-settings">
              <h4>このレイヤーの変換タイミング</h4>
              <label class="toggle-row">
                <input
                  v-model="selectedRingTransformTiming.useGlobal"
                  type="checkbox"
                  @change="onRingTransformTimingScopeChange"
                />
                <span>全体設定を使用</span>
              </label>
              <template v-if="!selectedRingTransformTiming.useGlobal">
                <label class="setting-row select-row">
                  <span>変換動作</span>
                  <select
                    :value="selectedRingTransformTiming.transformMode"
                    @change="setRingTransformMode($event.target.value)"
                  >
                    <option value="none">アニメーションしない</option>
                    <option value="reverse">変換先となってから戻る</option>
                    <option value="reset">変換完了後に停止時へ戻る</option>
                  </select>
                </label>
                <label class="setting-row">
                  <span>動き出し遅延</span>
                  <input v-model.number="selectedRingTransformTiming.delay" type="range" min="0" max="10000" step="100" />
                  <output>{{ selectedRingTransformTiming.delay }}ms</output>
                </label>
                <label class="setting-row">
                  <span>変更速度</span>
                  <input v-model.number="selectedRingTransformTiming.duration" type="range" min="100" max="10000" step="100" />
                  <output>{{ selectedRingTransformTiming.duration }}ms</output>
                </label>
                <label v-if="selectedRingTransformTiming.transformMode === 'reverse'" class="setting-row">
                  <span>戻る速度</span>
                  <input v-model.number="selectedRingTransformTiming.returnDuration" type="range" min="100" max="10000" step="100" />
                  <output>{{ selectedRingTransformTiming.returnDuration }}ms</output>
                </label>
                <label class="setting-row">
                  <span>変換先になってからの遅延</span>
                  <input v-model.number="selectedRingTransformTiming.holdDuration" type="range" min="0" max="10000" step="100" />
                  <output>{{ selectedRingTransformTiming.holdDuration }}ms</output>
                </label>
                <label class="setting-row select-row">
                  <span>変化方法</span>
                  <select v-model="selectedRingTransformTiming.easing">
                    <option value="linear">一定</option>
                    <option value="ease-in-out">滑らか</option>
                    <option value="ease-in">加速</option>
                    <option value="ease-out">減速</option>
                  </select>
                </label>
              </template>
            </section>
            <label v-if="['moving', 'transform'].includes(editingState)" class="toggle-row state-enabled-toggle">
              <input v-model="selectedMotion.traceIdle" type="checkbox" />
              <span>停止時の動きをトレースする</span>
            </label>
            <p v-if="selectedMotionTracesIdle" class="setting-hint">停止時のレイヤー動作をそのまま続けながら、{{ editingStateLabel }}の形状変化を同時に行います。</p>
            <template v-if="!selectedMotionTracesIdle">
            <label v-if="editingState !== 'transform'" class="toggle-row state-enabled-toggle">
              <input v-model="selectedMotion.enabled" type="checkbox" />
              <span>この状態でアニメーションする</span>
            </label>
            <section class="motion-block">
              <label class="toggle-row motion-toggle">
                <input v-model="selectedMotion.rotateEnabled" type="checkbox" :disabled="!selectedMotion.enabled" />
                <span>回転</span>
              </label>
              <label v-if="selectedMotion.rotateEnabled" class="setting-row">
                <span>回転速度</span>
                <input v-model.number="selectedMotion.rotateDuration" type="range" min="1" max="20" step="1" :disabled="!selectedMotion.enabled" />
                <output>{{ selectedMotion.rotateDuration }}秒</output>
              </label>
              <label v-if="selectedMotion.rotateEnabled" class="setting-row select-row">
                <span>回転方向</span>
                <select v-model="selectedMotion.direction" :disabled="!selectedMotion.enabled">
                  <option value="normal">時計回り</option>
                  <option value="reverse">反時計回り</option>
                </select>
              </label>
              <label v-if="selectedMotion.rotateEnabled && (selectedRingAppearance.renderMode !== 'textRing' || selectedMotion.rotateTarget !== 'text')" class="setting-row select-row">
                <span>回転の中心</span>
                <select v-model="selectedMotion.rotateOrigin" :disabled="!selectedMotion.enabled">
                  <option value="marker">マーカー中心（現在と同じ）</option>
                  <option value="self">このレイヤーの中心</option>
                </select>
              </label>
              <label v-if="selectedMotion.rotateEnabled && selectedRingAppearance.renderMode === 'textRing'" class="setting-row select-row">
                <span>回転対象</span>
                <select v-model="selectedMotion.rotateTarget" :disabled="!selectedMotion.enabled">
                  <option value="whole">全体（文字位置も回転）</option>
                  <option value="text">文字だけ（位置は固定）</option>
                </select>
              </label>
            </section>
            <section class="motion-block">
              <label class="toggle-row motion-toggle">
                <input v-model="selectedMotion.pulseEnabled" type="checkbox" :disabled="!selectedMotion.enabled" />
                <span>縮小・拡大</span>
              </label>
              <label v-if="selectedMotion.pulseEnabled" class="setting-row">
                <span>伸縮速度</span>
                <input v-model.number="selectedMotion.pulseDuration" type="range" min="1" max="20" step="1" :disabled="!selectedMotion.enabled" />
                <output>{{ selectedMotion.pulseDuration }}秒</output>
              </label>
              <label v-if="selectedMotion.pulseEnabled" class="setting-row">
                <span>伸縮量</span>
                <input v-model.number="selectedMotion.pulseAmount" type="range" min="2" max="45" step="1" :disabled="!selectedMotion.enabled" />
                <output>{{ selectedMotion.pulseAmount }}%</output>
              </label>
            </section>
            <section class="motion-block">
              <label class="toggle-row motion-toggle">
                <input v-model="selectedMotion.glowEnabled" type="checkbox" :disabled="!selectedMotion.enabled" />
                <span>発光を動かす</span>
              </label>
              <label v-if="selectedMotion.glowEnabled" class="setting-row">
                <span>最小発光</span>
                <input v-model.number="selectedMotion.glowMin" type="range" min="0" max="30" step="1" :disabled="!selectedMotion.enabled" />
                <output>{{ selectedMotion.glowMin }}</output>
              </label>
              <label v-if="selectedMotion.glowEnabled" class="setting-row">
                <span>最大発光</span>
                <input v-model.number="selectedMotion.glowMax" type="range" min="0" max="40" step="1" :disabled="!selectedMotion.enabled" />
                <output>{{ selectedMotion.glowMax }}</output>
              </label>
              <label v-if="selectedMotion.glowEnabled" class="setting-row">
                <span>発光速度</span>
                <input v-model.number="selectedMotion.glowDuration" type="range" min="0.5" max="10" step="0.5" :disabled="!selectedMotion.enabled" />
                <output>{{ selectedMotion.glowDuration }}秒</output>
              </label>
            </section>
            <section class="motion-block">
              <label class="toggle-row motion-toggle">
                <input v-model="selectedMotion.segmentSequenceEnabled" type="checkbox" :disabled="!selectedMotion.enabled || selectedRingItemCount <= 1" />
                <span>分割片を順番に点灯</span>
              </label>
              <label v-if="selectedMotion.segmentSequenceEnabled" class="setting-row">
                <span>点灯周期</span>
                <input v-model.number="selectedMotion.segmentSequenceDuration" type="range" min="0.5" max="10" step="0.5" :disabled="!selectedMotion.enabled" />
                <output>{{ selectedMotion.segmentSequenceDuration }}秒</output>
              </label>
              <label class="toggle-row">
                <input v-model="selectedMotion.lineFlowEnabled" type="checkbox" :disabled="!selectedMotion.enabled" />
                <span>線を流す</span>
              </label>
              <label v-if="selectedMotion.lineFlowEnabled" class="setting-row">
                <span>線の速度</span>
                <input v-model.number="selectedMotion.lineFlowDuration" type="range" min="0.5" max="10" step="0.5" :disabled="!selectedMotion.enabled" />
                <output>{{ selectedMotion.lineFlowDuration }}秒</output>
              </label>
              <label class="toggle-row">
                <input v-model="selectedMotion.fillPulseEnabled" type="checkbox" :disabled="!selectedMotion.enabled || !selectedRingAppearance.fillEnabled" />
                <span>塗りを明滅</span>
              </label>
              <label v-if="selectedMotion.fillPulseEnabled" class="setting-row">
                <span>明滅速度</span>
                <input v-model.number="selectedMotion.fillPulseDuration" type="range" min="0.5" max="10" step="0.5" :disabled="!selectedMotion.enabled" />
                <output>{{ selectedMotion.fillPulseDuration }}秒</output>
              </label>
              <label v-if="selectedMotion.fillPulseEnabled" class="setting-row">
                <span>最小濃度</span>
                <input v-model.number="selectedMotion.fillPulseMin" type="range" min="0" max="100" step="5" :disabled="!selectedMotion.enabled" />
                <output>{{ selectedMotion.fillPulseMin }}%</output>
              </label>
            </section>
            <label class="setting-row">
              <span>開始遅延</span>
              <input v-model.number="selectedMotion.delay" type="range" min="0" max="10" step="0.5" :disabled="!selectedMotion.enabled" />
              <output>{{ selectedMotion.delay }}秒</output>
            </label>
            <label class="toggle-row">
              <input v-model="selectedMotion.repeat" type="checkbox" :disabled="!selectedMotion.enabled" />
              <span>縮小・拡大／回転を繰り返す</span>
            </label>
            </template>
          </template>
        </div>
      </section>

      <footer class="modal-footer">
        <button type="button" class="secondary-button" @click="reset">初期化</button>
        <button type="button" class="save-button" @click="save">決定</button>
      </footer>

      <div
        v-if="mobileLayerDrawerOpen"
        class="mobile-panel-overlay mobile-layer-overlay"
        :style="{ top: `${mobileDrawerTop}px` }"
        @click.self="mobileLayerDrawerOpen = false"
      >
        <aside class="mobile-layer-drawer" aria-label="レイヤー一覧">
          <header>
            <div>
              <span>EDIT LAYER</span>
              <strong>{{ draft.rings.length }} / {{ MAX_RINGS }}</strong>
            </div>
            <div class="mobile-layer-header-actions">
              <button
                type="button"
                :disabled="draft.rings.length >= MAX_RINGS"
                aria-label="選択中のレイヤーの下へ追加"
                @click="addRing"
              >
                ＋
              </button>
            </div>
          </header>
          <div class="mobile-layer-list">
            <div
              v-for="(ring, index) in draft.rings"
              :key="ring.id"
              class="mobile-layer-item"
              :class="{
                active: selectedRingId === ring.id,
                hidden: getRingAppearance(ring).visible === false,
                dragging: draggingRingId === ring.id,
                'drag-over': dragOverRingId === ring.id
              }"
              :data-ring-id="ring.id"
            >
              <button
                type="button"
                class="mobile-layer-select"
                @pointerdown="startLayerLongPress($event, ring.id)"
                @pointermove="cancelLayerLongPressOnMove"
                @pointerup="endLayerLongPress"
                @pointercancel="cancelLayerLongPress"
                @contextmenu.prevent="openLayerContextMenu(ring.id)"
                @click="handleLayerSelect(ring.id)"
              >
                <span class="ring-tab-color" :style="{ backgroundColor: getRingAppearance(ring).color }"></span>
                <span>{{ index + 1 }}. {{ getRingName(ring, index) }}</span>
                <small v-if="getRingAppearance(ring).visible === false">非表示</small>
              </button>
              <button
                type="button"
                class="mobile-layer-drag-handle"
                aria-label="ドラッグしてレイヤーを並べ替え"
                @pointerdown.prevent="startLayerDrag($event, ring.id)"
                @pointermove.prevent="moveLayerDrag"
                @pointerup.prevent="endLayerDrag"
                @pointercancel.prevent="endLayerDrag"
              >
                ≡
              </button>
            </div>
          </div>
          <div v-if="layerContextRingId" class="mobile-layer-context-backdrop" @click.self="closeLayerContextMenu">
            <section class="mobile-layer-context-menu">
              <strong>{{ contextLayerName }}</strong>
              <button type="button" :disabled="draft.rings.length >= MAX_RINGS" @click="duplicateContextLayer">複製</button>
              <button type="button" class="danger-button" :disabled="draft.rings.length <= 1" @click="requestContextLayerDelete">削除</button>
              <button type="button" @click="closeLayerContextMenu">キャンセル</button>
            </section>
          </div>
        </aside>
      </div>

      <div
        v-if="mobileMenuOpen"
        class="mobile-panel-overlay mobile-menu-overlay"
        @click.self="mobileMenuOpen = false"
      >
        <aside class="mobile-overflow-menu" aria-label="その他の設定">
          <header>
            <strong>MENU</strong>
            <button type="button" aria-label="メニューを閉じる" @click="mobileMenuOpen = false">×</button>
          </header>
          <button
            v-for="section in menuSections"
            :key="section.key"
            type="button"
            :class="{ active: activeSection === section.key }"
            @click="openMobileSection(section.key)"
          >
            <span>{{ section.label }}</span>
            <small>{{ section.description }}</small>
          </button>
          <button type="button" @click="openFullscreenFromMenu">
            <span>全画面プレビュー</span>
            <small>設定UIを隠してマーカーだけ確認</small>
          </button>
          <button
            v-for="state in copyDestinationOptions"
            :key="`copy-${state.key}`"
            type="button"
            @click="copyFromMobileMenu(state.key)"
          >
            <span>状態間コピー</span>
            <small>{{ editingStateLabel }}の設定を{{ state.label }}へコピー</small>
          </button>
          <button type="button" class="danger-button" @click="resetFromMobileMenu">
            <span>初期化</span>
            <small>作成中の設定を初期状態へ戻す</small>
          </button>
          <button type="button" @click="save">
            <span>閉じる</span>
            <small>現在の設定を反映して作成画面を閉じる</small>
          </button>
        </aside>
      </div>

      <div
        v-if="deleteConfirmation"
        class="delete-confirmation-backdrop"
        @click.self="cancelDeleteConfirmation"
      >
        <section class="delete-confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-confirmation-title">
          <strong id="delete-confirmation-title">削除の確認</strong>
          <p>「{{ deleteConfirmation.name }}」を削除しますか？</p>
          <small v-if="deleteConfirmation.kind === 'ring'">削除後も「戻る」で復元できます。</small>
          <small v-else>保存一覧から削除されます。この操作は元に戻せません。</small>
          <div>
            <button type="button" @click="cancelDeleteConfirmation">キャンセル</button>
            <button type="button" class="danger-button" @click="confirmDelete">削除する</button>
          </div>
        </section>
      </div>

      <div
        v-if="rangeEditorOpen"
        class="range-editor-backdrop"
        @click.self="closeRangeEditor"
      >
        <section class="range-editor-sheet" role="dialog" aria-modal="true" :aria-label="`${rangeEditorLabel}の数値調整`">
          <header>
            <div>
              <span>数値調整</span>
              <strong>{{ rangeEditorLabel }}</strong>
            </div>
          </header>
          <div class="range-editor-stepper">
            <button
              type="button"
              aria-label="値を下げる"
              @click="handleRangeAdjustClick(-1)"
              @pointerdown="startRangeAdjustHold(-1, $event)"
              @pointerup="stopRangeAdjustHold"
              @pointercancel="stopRangeAdjustHold"
            >－</button>
            <label>
              <input
                :value="rangeEditorValue"
                type="number"
                inputmode="decimal"
                :min="rangeEditorMin"
                :max="rangeEditorMax"
                :step="rangeEditorStep"
                @input="setRangeEditorValue($event.target.value)"
              />
              <span>{{ rangeEditorUnit }}</span>
            </label>
            <button
              type="button"
              aria-label="値を上げる"
              @click="handleRangeAdjustClick(1)"
              @pointerdown="startRangeAdjustHold(1, $event)"
              @pointerup="stopRangeAdjustHold"
              @pointercancel="stopRangeAdjustHold"
            >＋</button>
          </div>
          <input
            class="range-editor-slider"
            :value="rangeEditorValue"
            type="range"
            :min="rangeEditorMin"
            :max="rangeEditorMax"
            :step="rangeEditorStep"
            @input="setRangeEditorValue($event.target.value)"
          />
          <div class="range-editor-limits">
            <span>{{ rangeEditorMin }}</span>
            <span>{{ rangeEditorMax }}</span>
          </div>
        </section>
      </div>
      </div>
    </BaseHudModal>
    <BaseHudModal
      v-if="runeEditorOpen"
      frame-width="min(620px, calc(100vw - 20px))"
      frame-height="min(720px, calc(100dvh - 20px))"
      frame-max-height="none"
      :close-on-overlay="false"
      @close="closeRuneEditor"
    >
      <div class="rune-editor-modal">
        <header class="rune-editor-header">
          <div>
            <span class="modal-kicker">RUNE INPUT</span>
            <h2>ルーン文字入力</h2>
          </div>
          <button type="button" @click="closeRuneEditor">閉じる</button>
        </header>
        <p class="rune-editor-note">キーボード入力の代わりに文字を選択してください。閉じると現在の入力内容が反映されます。</p>
        <output class="rune-editor-value">{{ runeEditorText }}</output>
        <div class="rune-key-grid" aria-label="ルーン文字一覧">
          <button v-for="rune in runeKeyboard" :key="rune" type="button" @click="appendRuneCharacter(rune)">{{ rune }}</button>
          <button type="button" @click="appendRuneCharacter(' ')">空白</button>
        </div>
        <div class="rune-editor-actions">
          <button type="button" @click="removeRuneCharacter">1文字削除</button>
          <button type="button" @click="clearRuneEditor">クリア</button>
          <button type="button" @click="setRuneSample">サンプル</button>
        </div>
      </div>
    </BaseHudModal>
    <FontSelectModal
      v-if="fontPickerOpen"
      :selected-key="selectedRingAppearance.textFontPreset"
      :custom-family="selectedRingAppearance.textCustomFontFamily"
      @close="fontPickerOpen = false"
      @select="selectTextFont"
    />
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getCurrentScale } from '@/components/useScale.js'
import BaseHudModal from './BaseHudModal.vue'
import FontSelectModal from './FontSelectModal.vue'
import TargetMarker from './TargetMarker.vue'
import { TEXT_FONT_PRESETS, VISIBLE_TEXT_FONT_PRESETS } from '../data/textFontPresets.js'
import magicCircleExport from '../data/targetMarkerPresets/magic-circle.json'
import symbolMagicCircleExport from '../data/targetMarkerPresets/symbol-magic-circle.json'

const makeMotionState = overrides => ({
  enabled: true,
  traceIdle: false,
  rotateEnabled: true,
  rotateTarget: 'whole',
  rotateOrigin: 'marker',
  pulseEnabled: false,
  rotateDuration: 8,
  pulseDuration: 3,
  direction: 'normal',
  delay: 0,
  pulseAmount: 18,
  repeat: true,
  glowEnabled: false,
  glowMin: 4,
  glowMax: 14,
  glowDuration: 2,
  segmentSequenceEnabled: false,
  segmentSequenceDuration: 2,
  lineFlowEnabled: false,
  lineFlowDuration: 2,
  fillPulseEnabled: false,
  fillPulseDuration: 2,
  fillPulseMin: 20,
  ...overrides
})
const makeRingTransformTiming = overrides => ({
  useGlobal: true,
  transformMode: 'none',
  delay: 0,
  duration: 1200,
  returnDuration: 1200,
  holdDuration: 500,
  easing: 'ease-in-out',
  ...overrides
})
const makeOverallAppearance = overrides => ({
  shape: 'circle',
  size: 100,
  width: 100,
  height: 100,
  applyAspectToLayers: false,
  opacity: 88,
  showCenterDot: true,
  ...overrides
})
const TEXT_ITEM_LIMIT = 64
const makeTextItemArray = value => Array.from({ length: TEXT_ITEM_LIMIT }, (_, index) => value?.[index] || '')
const countTextCharacters = value => {
  const text = String(value || '')
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    return Math.min(TEXT_ITEM_LIMIT, Array.from(new Intl.Segmenter('ja', { granularity: 'grapheme' }).segment(text)).length)
  }
  return Math.min(TEXT_ITEM_LIMIT, Array.from(text).length)
}
const makeRingAppearance = overrides => ({
  renderMode: 'continuous',
  color: '#8fefff',
  width: 100,
  height: 100,
  splitCount: 1,
  polygonSides: 3,
  splitGap: 0,
  equalizeSegments: false,
  evenSpacing: false,
  spacingRatio: 20,
  layout: 'straight',
  arcSpread: 90,
  arcRadius: 45,
  arcAngle: 270,
  arcOrientation: 'tangent',
  connectionClosed: true,
  angle: 0,
  offsetX: 0,
  offsetY: 0,
  opacity: 100,
  lineWidth: 2,
  shape: 'circle',
  lineStyle: 'solid',
  glow: 8,
  glowColor: '#8fefff',
  fillEnabled: false,
  fillBetweenDoubleLines: false,
  fillColor: '#8fefff',
  fillOpacity: 30,
  cutoutEnabled: false,
  cutoutSize: 62,
  moonPhase: 78,
  innerCircleAngle: 0,
  gearTeeth: 12,
  gearInnerSize: 38,
  gearSupportsEnabled: false,
  gearSupportCount: 3,
  gearSupportOffset: 0,
  gearFillBody: true,
  eraseBelow: false,
  eraseDebug: false,
  useSegmentColors: false,
  segmentColors: Array(TEXT_ITEM_LIMIT).fill('#8fefff'),
  zIndex: 0,
  blendMode: 'normal',
  flipX: false,
  flipY: false,
  lineCap: 'butt',
  lineJoin: 'miter',
  miterLimit: 4,
  dashOffset: 0,
  dashLength: 14,
  dashGap: 8,
  dashRandomness: 0,
  doubleLineGap: 18,
  waveAmplitude: 4,
  waveCount: 12,
  waveRandomness: 55,
  waveSpeed: 1,
  textMode: 'string',
  textLayout: 'circle',
  textReferenceRingId: 'self',
  textReferenceScale: 100,
  textContent: 'TARGET LOCKED',
  textDivisionCount: 1,
  segmentLabels: Array(TEXT_ITEM_LIMIT).fill(''),
  textRadius: 45,
  textSpacing: 100,
  textEvenSpacing: false,
  textArcSpread: 360,
  textSize: 14,
  textFontPreset: 'cyber',
  textCustomFontFamily: '',
  textWeight: 'bold',
  textDirection: 'clockwise',
  textOrientation: 'outward',
  visible: true,
  ...overrides
})

const DEFAULT_SETTINGS = {
  shape: 'circle',
  color: '#8fefff',
  size: 100,
  opacity: 88,
  ringCount: 2,
  lineWidth: 2,
  rotationSeconds: 8,
  showCenterDot: true,
  behavior: {
    previewBackgroundColor: '#071722',
    previewGradientEnabled: true,
    previewRatio: 40,
    followCursor: false,
    cursorFollowDuration: 80,
    cursorFollowSpeed: 90
  },
  appearance: {
    idle: makeOverallAppearance(),
    moving: makeOverallAppearance(),
    transform: makeOverallAppearance()
  },
  wholeMotion: {
    idle: makeMotionState({ enabled: false, rotateEnabled: false }),
    moving: makeMotionState({ enabled: false, rotateEnabled: false }),
    transform: makeMotionState({ enabled: false, rotateEnabled: false })
  },
  transition: {
    sequence: 'before',
    morphInDuration: 250,
    moveDuration: 350,
    morphOutDuration: 250,
    transformMode: 'none',
    transformDuration: 1200,
    transformReturnDuration: 1200,
    transformStartDelay: 500,
    transformHoldDuration: 500,
    easing: 'ease-in-out'
  },
  rings: [
    { id: 'ring-1', transformTiming: makeRingTransformTiming(), appearance: { idle: makeRingAppearance(), moving: makeRingAppearance(), transform: makeRingAppearance() }, motion: { idle: makeMotionState({ enabled: false }), moving: makeMotionState({ enabled: false }), transform: makeMotionState({ enabled: false }) } },
    { id: 'ring-2', transformTiming: makeRingTransformTiming(), appearance: { idle: makeRingAppearance({ width: 78, height: 78, opacity: 80, lineStyle: 'dashed', glow: 5 }), moving: makeRingAppearance({ width: 78, height: 78, opacity: 80, lineStyle: 'dashed', glow: 5 }), transform: makeRingAppearance({ width: 78, height: 78, opacity: 80, lineStyle: 'dashed', glow: 5 }) }, motion: { idle: makeMotionState({ enabled: false, rotateEnabled: false, pulseEnabled: true }), moving: makeMotionState({ enabled: false, rotateEnabled: false, pulseEnabled: true }), transform: makeMotionState({ enabled: false, rotateEnabled: false, pulseEnabled: true }) } }
  ]
}

const props = defineProps({
  settings: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close', 'save'])
const MAX_RINGS = 24
const MODAL_BASE_WIDTH = 720
const MODAL_BASE_HEIGHT = 1280
const EDITING_STATE_OPTIONS = [
  { key: 'idle', label: '停止時' },
  { key: 'transform', label: '変換先' },
  { key: 'moving', label: '移動時' }
]
const modalScale = ref(1)
const mobileLayout = ref(false)
const mobileLayerDrawerOpen = ref(false)
const mobileMenuOpen = ref(false)
const mobileDrawerTop = ref(302)
const markerPreviewRef = ref(null)
const layerContextRingId = ref(null)
const draggingRingId = ref(null)
const dragOverRingId = ref(null)
const previewMoving = ref(false)
const previewPosition = ref({ x: 50, y: 50 })
const editingState = ref('idle')
const copyDestinationState = ref('moving')
const highlightedRingId = ref(null)
const pendingOverallShape = ref(null)
const deleteConfirmation = ref(null)
const previewCursorFollowActive = ref(false)
const previewFullscreen = ref(false)
const rangeEditorOpen = ref(false)
const rangeEditorLabel = ref('')
const rangeEditorValue = ref(0)
const rangeEditorMin = ref(0)
const rangeEditorMax = ref(100)
const rangeEditorStep = ref(1)
const rangeEditorUnit = ref('')
const runeEditorOpen = ref(false)
const fontPickerOpen = ref(false)
const runeEditorText = ref('')
const runeEditorTarget = ref(null)
const runeKeyboard = Array.from('ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟᚩᚪᚫᚣᚤᚥᚸᛋᛝ')
let rangeEditorTarget = null
let previewMoveTimer = null
let previewMoveToken = 0
let ringHighlightTimer = null
let previewCursorAnimationFrame = null
let previewCursorLastFrame = null
let previewCursorTarget = { x: 50, y: 50 }
let layerLongPressTimer = null
let layerLongPressStart = null
let layerLongPressTriggered = false
let rangeAdjustHoldTimer = null
let rangeAdjustRepeatTimer = null
let rangeAdjustRepeated = false
const getRangePrecision = step => {
  const stepText = String(step)
  return stepText.includes('.') ? stepText.split('.')[1].length : 0
}
const normalizeRangeValue = value => {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return null
  const min = Number(rangeEditorMin.value)
  const max = Number(rangeEditorMax.value)
  const step = Math.max(Number.EPSILON, Number(rangeEditorStep.value) || 1)
  const clamped = Math.min(max, Math.max(min, numericValue))
  const stepped = min + Math.round((clamped - min) / step) * step
  return Number(stepped.toFixed(getRangePrecision(step)))
}
const setRangeEditorValue = value => {
  if (!rangeEditorTarget?.isConnected) {
    closeRangeEditor()
    return
  }
  const normalized = normalizeRangeValue(value)
  if (normalized == null) return
  rangeEditorValue.value = normalized
  rangeEditorTarget.value = String(normalized)
  rangeEditorTarget.dispatchEvent(new Event('input', { bubbles: true }))
  rangeEditorTarget.dispatchEvent(new Event('change', { bubbles: true }))
}
const adjustRangeEditor = direction => {
  setRangeEditorValue(Number(rangeEditorValue.value) + Number(direction) * Number(rangeEditorStep.value))
}
const stopRangeAdjustHold = () => {
  if (rangeAdjustHoldTimer) clearTimeout(rangeAdjustHoldTimer)
  if (rangeAdjustRepeatTimer) clearInterval(rangeAdjustRepeatTimer)
  rangeAdjustHoldTimer = null
  rangeAdjustRepeatTimer = null
}
const startRangeAdjustHold = (direction, event) => {
  stopRangeAdjustHold()
  rangeAdjustRepeated = false
  event.currentTarget?.setPointerCapture?.(event.pointerId)
  rangeAdjustHoldTimer = setTimeout(() => {
    rangeAdjustRepeated = true
    adjustRangeEditor(direction)
    rangeAdjustRepeatTimer = setInterval(() => adjustRangeEditor(direction), 80)
  }, 360)
}
const handleRangeAdjustClick = direction => {
  stopRangeAdjustHold()
  if (rangeAdjustRepeated) {
    rangeAdjustRepeated = false
    return
  }
  adjustRangeEditor(direction)
}
const closeRangeEditor = () => {
  stopRangeAdjustHold()
  rangeEditorOpen.value = false
  rangeEditorTarget = null
}
const guardMobileRangePointerDown = event => {
  if (!mobileLayout.value || event.button > 0) return
  const input = event.target
  if (!(input instanceof HTMLInputElement) || input.type !== 'range' || input.disabled) return

  const rect = input.getBoundingClientRect()
  const min = Number(input.min || 0)
  const max = Number(input.max || 100)
  const value = Number(input.value)
  const ratio = max > min ? Math.min(1, Math.max(0, (value - min) / (max - min))) : 0
  const thumbCenterX = rect.left + rect.width * ratio
  const thumbHitRadius = 24

  if (Math.abs(event.clientX - thumbCenterX) <= thumbHitRadius) return
  event.preventDefault()
  event.stopPropagation()
}
const openRangeEditorFromEvent = event => {
  if (!mobileLayout.value || rangeEditorOpen.value) return
  const output = event.target?.closest?.('.setting-row output')
  if (!output) return
  const row = output.closest('.setting-row')
  const input = row?.querySelector('input[type="range"]')
  if (!input || input.disabled) return

  event.preventDefault()
  const outputText = output.textContent?.trim() || ''
  const unitMatch = outputText.match(/[-+]?\d+(?:\.\d+)?\s*(.*)$/)
  rangeEditorTarget = input
  rangeEditorLabel.value = row.querySelector(':scope > span')?.textContent?.trim() || '数値'
  rangeEditorMin.value = Number(input.min || 0)
  rangeEditorMax.value = Number(input.max || 100)
  rangeEditorStep.value = Number(input.step || 1)
  rangeEditorValue.value = Number(input.value)
  rangeEditorUnit.value = unitMatch?.[1] || ''
  rangeEditorOpen.value = true
}
const updateModalScale = () => {
  if (typeof window === 'undefined') return
  mobileLayout.value = window.innerWidth <= 768
    || (window.matchMedia('(pointer: coarse)').matches && window.innerWidth <= 1024)
  if (!mobileLayout.value) {
    if (rangeEditorOpen.value) closeRangeEditor()
    mobileLayerDrawerOpen.value = false
    mobileMenuOpen.value = false
    layerContextRingId.value = null
  }
  const viewportScale = Math.min(
    (window.innerWidth - 24) / MODAL_BASE_WIDTH,
    (window.innerHeight - 24) / MODAL_BASE_HEIGHT
  )
  modalScale.value = Math.max(0.1, Math.min(getCurrentScale(), viewportScale))
}
const exitPreviewFullscreen = () => {
  previewFullscreen.value = false
}
const enterPreviewFullscreen = () => {
  previewFullscreen.value = true
}
const onPreviewFullscreenKeydown = event => {
  if (!previewFullscreen.value || !['Escape', 'f', 'F'].includes(event.key)) return
  event.preventDefault()
  exitPreviewFullscreen()
}

onMounted(() => {
  window.addEventListener('resize', updateModalScale)
  window.addEventListener('keydown', onPreviewFullscreenKeydown)
  window.addEventListener('pagehide', persistMarkerDraft)
  updateModalScale()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateModalScale)
  window.removeEventListener('keydown', onPreviewFullscreenKeydown)
  window.removeEventListener('pagehide', persistMarkerDraft)
  persistMarkerDraft()
  if (previewMoveTimer) clearTimeout(previewMoveTimer)
  if (ringHighlightTimer) clearTimeout(ringHighlightTimer)
  if (draftHistoryCommitTimer) clearTimeout(draftHistoryCommitTimer)
  if (previewCursorAnimationFrame != null) cancelAnimationFrame(previewCursorAnimationFrame)
  if (layerLongPressTimer) clearTimeout(layerLongPressTimer)
  stopRangeAdjustHold()
})

const makeRing = index => ({
  id: `ring-${Date.now()}-${index}`,
  name: '',
  transformTiming: makeRingTransformTiming(),
  appearance: {
    idle: makeRingAppearance({ width: Math.max(20, 100 - index * 14), height: Math.max(20, 100 - index * 14) }),
    moving: makeRingAppearance({ width: Math.max(20, 100 - index * 14), height: Math.max(20, 100 - index * 14) }),
    transform: makeRingAppearance({ width: Math.max(20, 100 - index * 14), height: Math.max(20, 100 - index * 14) })
  },
  motion: {
    idle: makeMotionState({ enabled: false, rotateEnabled: false }),
    moving: makeMotionState({ enabled: false, rotateEnabled: false }),
    transform: makeMotionState({ enabled: false, rotateEnabled: false })
  }
})
const normalizeRingTransformTiming = timing => {
  const source = timing || {}
  const holdDuration = Number(source.holdDuration)
  const easing = ['linear', 'ease-in', 'ease-out', 'ease-in-out'].includes(source.easing)
    ? source.easing
    : 'ease-in-out'
  const duration = Math.min(10000, Math.max(100, Number(source.duration) || 1200))
  return makeRingTransformTiming({
    useGlobal: source.useGlobal !== false,
    transformMode: ['reverse', 'reset'].includes(source.transformMode) ? source.transformMode : 'none',
    delay: Math.min(10000, Math.max(0, Number(source.delay) || 0)),
    duration,
    returnDuration: Math.min(10000, Math.max(100, Number(source.returnDuration) || duration)),
    holdDuration: Math.min(10000, Math.max(0, Number.isFinite(holdDuration) ? holdDuration : 500)),
    easing
  })
}
const normalizeRingMotion = ring => {
  const legacyState = makeMotionState({
    rotateEnabled: typeof ring.rotateEnabled === 'boolean' ? ring.rotateEnabled : ring.animationType === 'rotate',
    pulseEnabled: typeof ring.pulseEnabled === 'boolean' ? ring.pulseEnabled : ring.animationType === 'pulse',
    rotateDuration: Number(ring.rotateDuration) || Number(ring.duration) || 8,
    pulseDuration: Number(ring.pulseDuration) || Number(ring.duration) || 3,
    direction: ring.direction === 'reverse' ? 'reverse' : 'normal',
    rotateOrigin: ring.rotateOrigin === 'self' ? 'self' : 'marker',
    delay: Number(ring.delay) || 0,
    pulseAmount: Number(ring.pulseAmount) || 18,
    repeat: ring.repeat !== false
  })
  const trigger = ring.animationTrigger || 'always'
  return {
    idle: {
      ...legacyState,
      enabled: trigger === 'always',
      ...(ring.motion?.idle || {})
    },
    moving: {
      ...legacyState,
      enabled: trigger === 'always' || trigger === 'moving',
      ...(ring.motion?.moving || {})
    },
    transform: {
      ...legacyState,
      enabled: trigger === 'always',
      ...(ring.motion?.idle || {}),
      ...(ring.motion?.transform || {})
    }
  }
}
const normalizeRingAppearance = ring => {
  const legacySize = Number(ring.size) || 100
  const legacyRenderMode = ['center', 'free'].includes(ring.renderMode)
    ? 'continuous'
    : ring.renderMode === 'segmentedArc' || ring.renderMode === 'connection'
      ? 'continuous'
      : ring.renderMode || (ring.layout === 'arc' ? 'circumference' : 'continuous')
  const legacyShape = ring.renderMode === 'segmentedArc'
    ? 'segmentedRing'
    : ring.renderMode === 'connection' ? 'polygon' : ring.shape || 'circle'
  const legacy = makeRingAppearance({
    renderMode: legacyRenderMode,
    color: ring.color || '#8fefff',
    width: Number(ring.width) || legacySize,
    height: Number(ring.height) || legacySize,
    splitCount: Number(ring.splitCount) || 1,
    polygonSides: Math.min(24, Math.max(3, Number(ring.polygonSides) || (ring.renderMode === 'connection' ? Number(ring.splitCount) || 3 : 3))),
    splitGap: Number(ring.splitGap) || 0,
    equalizeSegments: ring.equalizeSegments === true,
    evenSpacing: ring.evenSpacing === true,
    spacingRatio: Number(ring.spacingRatio) || 20,
    layout: ring.layout || 'straight',
    arcSpread: Number(ring.arcSpread) || 90,
    arcRadius: Number(ring.arcRadius) || 45,
    arcAngle: Number(ring.arcAngle) || 270,
    arcOrientation: ring.arcOrientation || 'tangent',
    angle: Number(ring.angle) || 0,
    offsetX: Number(ring.offsetX) || 0,
    offsetY: Number(ring.offsetY) || 0,
    opacity: Number(ring.opacity) || 100,
    lineWidth: Number(ring.lineWidth) || 2,
    shape: legacyShape,
    lineStyle: ring.lineStyle || 'solid',
    dashLength: Math.min(40, Math.max(1, Number(ring.dashLength) || 14)),
    dashGap: Math.min(40, Math.max(1, Number(ring.dashGap) || 8)),
    dashRandomness: Math.min(100, Math.max(0, Number(ring.dashRandomness) || 0)),
    doubleLineGap: Number.isFinite(Number(ring.doubleLineGap)) ? Number(ring.doubleLineGap) : 18,
    waveAmplitude: Number.isFinite(Number(ring.waveAmplitude)) ? Number(ring.waveAmplitude) : 4,
    waveCount: Number.isFinite(Number(ring.waveCount)) ? Number(ring.waveCount) : 12,
    waveRandomness: Number.isFinite(Number(ring.waveRandomness)) ? Number(ring.waveRandomness) : 55,
    waveSpeed: Number.isFinite(Number(ring.waveSpeed)) ? Number(ring.waveSpeed) : 1,
    glow: Number(ring.glow) || 0,
    glowColor: ring.glowColor || ring.color || '#8fefff',
    fillEnabled: ring.fillEnabled === true,
    fillBetweenDoubleLines: ring.fillBetweenDoubleLines === true,
    fillColor: ring.fillColor || ring.color || '#8fefff',
    fillOpacity: Number(ring.fillOpacity) || 30,
    cutoutEnabled: ring.cutoutEnabled === true,
    cutoutSize: Math.min(90, Math.max(10, Number(ring.cutoutSize) || 62)),
    moonPhase: Math.min(100, Math.max(0, Number.isFinite(Number(ring.moonPhase)) ? Number(ring.moonPhase) : 78)),
    innerCircleAngle: Math.min(359, Math.max(0, Number(ring.innerCircleAngle) || 0)),
    gearTeeth: Math.min(32, Math.max(6, Number(ring.gearTeeth) || 12)),
    gearInnerSize: Math.min(90, Math.max(5, Number(ring.gearInnerSize) || 38)),
    gearSupportsEnabled: ring.gearSupportsEnabled === true,
    gearSupportCount: Math.min(16, Math.max(1, Number(ring.gearSupportCount) || 3)),
    gearSupportOffset: Math.min(30, Math.max(-30, Number(ring.gearSupportOffset) || 0)),
    gearFillBody: ring.gearFillBody !== false,
    eraseBelow: ring.eraseBelow === true,
    eraseDebug: ring.eraseDebug === true,
    useSegmentColors: ring.useSegmentColors === true,
    segmentColors: Array.from({ length: TEXT_ITEM_LIMIT }, (_, index) => ring.segmentColors?.[index] || ring.color || '#8fefff'),
    textMode: ring.textMode === 'labels' ? 'labels' : 'string',
    textLayout: ring.textLayout === 'shape' ? 'shape' : 'circle',
    textReferenceRingId: typeof ring.textReferenceRingId === 'string' && ring.textReferenceRingId ? ring.textReferenceRingId : 'self',
    textReferenceScale: Number.isFinite(Number(ring.textReferenceScale)) ? Number(ring.textReferenceScale) : 100,
    textContent: String(ring.textContent || 'TARGET LOCKED').slice(0, TEXT_ITEM_LIMIT),
    textDivisionCount: Math.min(8, Math.max(1, Number(ring.textDivisionCount) || 1)),
    segmentLabels: makeTextItemArray(ring.segmentLabels),
    textRadius: Number(ring.textRadius) || 45,
    textSpacing: Number(ring.textSpacing) || 100,
    textEvenSpacing: ring.textEvenSpacing === true,
    textArcSpread: Number(ring.textArcSpread) || 360,
    textSize: Number(ring.textSize) || 14,
    textFontPreset: TEXT_FONT_PRESETS.some(font => font.key === ring.textFontPreset) || ring.textFontPreset === 'custom' ? ring.textFontPreset : 'cyber',
    textCustomFontFamily: String(ring.textCustomFontFamily || '').slice(0, 120),
    textWeight: ring.textWeight === 'normal' ? 'normal' : 'bold',
    textDirection: ring.textDirection === 'counterclockwise' ? 'counterclockwise' : 'clockwise',
    textOrientation: ['outward', 'inward', 'centerFacing', 'upright', 'tangent'].includes(ring.textOrientation) ? ring.textOrientation : 'outward',
    visible: ring.visible !== false
  })
  const idleState = ring.appearance?.idle || {}
  const movingState = ring.appearance?.moving || {}
  const transformState = ring.appearance?.transform || idleState
  return {
    idle: {
      ...legacy,
      ...idleState,
      renderMode: idleState.renderMode || (idleState.layout === 'arc' ? 'circumference' : legacy.renderMode),
      segmentColors: Array.from({ length: TEXT_ITEM_LIMIT }, (_, index) => idleState.segmentColors?.[index] || legacy.segmentColors[index]),
      segmentLabels: makeTextItemArray(idleState.segmentLabels || legacy.segmentLabels)
    },
    moving: {
      ...legacy,
      ...movingState,
      renderMode: movingState.renderMode || (movingState.layout === 'arc' ? 'circumference' : legacy.renderMode),
      segmentColors: Array.from({ length: TEXT_ITEM_LIMIT }, (_, index) => movingState.segmentColors?.[index] || legacy.segmentColors[index]),
      segmentLabels: makeTextItemArray(movingState.segmentLabels || legacy.segmentLabels)
    },
    transform: {
      ...legacy,
      ...transformState,
      renderMode: transformState.renderMode || (transformState.layout === 'arc' ? 'circumference' : legacy.renderMode),
      segmentColors: Array.from({ length: TEXT_ITEM_LIMIT }, (_, index) => transformState.segmentColors?.[index] || legacy.segmentColors[index]),
      segmentLabels: makeTextItemArray(transformState.segmentLabels || legacy.segmentLabels)
    }
  }
}
const cloneRing = ring => ({
  ...ring,
  transformTiming: normalizeRingTransformTiming(ring.transformTiming),
  appearance: {
    idle: {
      ...ring.appearance.idle,
      segmentColors: [...ring.appearance.idle.segmentColors],
      segmentLabels: [...ring.appearance.idle.segmentLabels]
    },
    moving: {
      ...ring.appearance.moving,
      segmentColors: [...ring.appearance.moving.segmentColors],
      segmentLabels: [...ring.appearance.moving.segmentLabels]
    },
    transform: {
      ...ring.appearance.transform,
      segmentColors: [...ring.appearance.transform.segmentColors],
      segmentLabels: [...ring.appearance.transform.segmentLabels]
    }
  },
  motion: {
    idle: { ...ring.motion.idle },
    moving: { ...ring.motion.moving },
    transform: { ...ring.motion.transform }
  }
})
const createDraftFromSettings = settings => {
  const source = settings || {}
  const transformMode = ['reverse', 'reset'].includes(source.transition?.transformMode)
    ? source.transition.transformMode
    : 'none'
  const rings = Array.isArray(source.rings) && source.rings.length > 0
    ? source.rings.map((ring, index) => {
      return {
        ...makeRing(index + 1),
        ...ring,
        appearance: normalizeRingAppearance(ring),
        motion: normalizeRingMotion(ring),
        transformTiming: normalizeRingTransformTiming(ring.transformTiming)
      }
    })
    : DEFAULT_SETTINGS.rings.map(cloneRing)
  rings.forEach(ring => {
    ring.motion.transform.enabled = ring.transformTiming.useGlobal
      ? transformMode !== 'none'
      : ring.transformTiming.transformMode !== 'none'
  })
  const legacyOverall = makeOverallAppearance({
    shape: source.shape || DEFAULT_SETTINGS.shape,
    size: Number(source.size) || DEFAULT_SETTINGS.size,
    width: Number(source.width) || Number(source.size) || DEFAULT_SETTINGS.size,
    height: Number(source.height) || Number(source.size) || DEFAULT_SETTINGS.size,
    applyAspectToLayers: source.applyAspectToLayers === true,
    opacity: Number(source.opacity) || DEFAULT_SETTINGS.opacity,
    showCenterDot: source.showCenterDot !== false
  })
  const idleOverall = source.appearance?.idle || {}
  const movingOverall = source.appearance?.moving || {}
  const transformOverall = source.appearance?.transform || idleOverall
  return {
    ...DEFAULT_SETTINGS,
    ...source,
    appearance: {
      idle: {
        ...legacyOverall,
        ...idleOverall,
        width: Number(idleOverall.width) || Number(idleOverall.size) || legacyOverall.width,
        height: Number(idleOverall.height) || Number(idleOverall.size) || legacyOverall.height
      },
      moving: {
        ...legacyOverall,
        ...movingOverall,
        width: Number(movingOverall.width) || Number(movingOverall.size) || legacyOverall.width,
        height: Number(movingOverall.height) || Number(movingOverall.size) || legacyOverall.height
      },
      transform: {
        ...legacyOverall,
        ...transformOverall,
        width: Number(transformOverall.width) || Number(transformOverall.size) || legacyOverall.width,
        height: Number(transformOverall.height) || Number(transformOverall.size) || legacyOverall.height
      }
    },
    wholeMotion: {
      idle: makeMotionState({ enabled: false, rotateEnabled: false, ...(source.wholeMotion?.idle || {}) }),
      moving: makeMotionState({ enabled: false, rotateEnabled: false, ...(source.wholeMotion?.moving || {}) }),
      transform: makeMotionState({ rotateEnabled: false, ...(source.wholeMotion?.idle || {}), ...(source.wholeMotion?.transform || {}), enabled: transformMode !== 'none' })
    },
    transition: {
      ...DEFAULT_SETTINGS.transition,
      ...(source.transition || {}),
      transformMode,
      transformReturnDuration: Number(source.transition?.transformReturnDuration)
        || Number(source.transition?.transformDuration)
        || DEFAULT_SETTINGS.transition.transformReturnDuration
    },
    behavior: { ...DEFAULT_SETTINGS.behavior, ...(source.behavior || {}) },
    rings
  }
}
const MARKER_EDITOR_DRAFT_STORAGE_KEY = 'battle-custom-target-marker-editor-draft-v1'
const readMarkerEditorDraft = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(MARKER_EDITOR_DRAFT_STORAGE_KEY) || 'null')
    if (!parsed?.settings || typeof parsed.settings !== 'object' || Array.isArray(parsed.settings)) return null
    return parsed
  } catch {
    return null
  }
}
const restoredMarkerDraft = readMarkerEditorDraft()
const draft = ref(createDraftFromSettings(restoredMarkerDraft?.settings || props.settings))
if (EDITING_STATE_OPTIONS.some(state => state.key === restoredMarkerDraft?.ui?.editingState)) {
  editingState.value = restoredMarkerDraft.ui.editingState
}
if (EDITING_STATE_OPTIONS.some(state => state.key === restoredMarkerDraft?.ui?.copyDestinationState)) {
  copyDestinationState.value = restoredMarkerDraft.ui.copyDestinationState
}
const mobileLayoutStyle = computed(() => {
  const previewRatio = Math.min(60, Math.max(25, Number(draft.value.behavior.previewRatio) || 40))
  return {
    '--mobile-preview-ratio': `${previewRatio}fr`,
    '--mobile-settings-ratio': `${100 - previewRatio}fr`
  }
})
const MARKER_LIBRARY_STORAGE_KEY = 'battle-custom-target-marker-library-v1'
const MAX_SAVED_MARKERS = 20
const readMarkerLibrary = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(MARKER_LIBRARY_STORAGE_KEY) || '[]')
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(marker => marker && typeof marker.id === 'string' && marker.settings && typeof marker.settings === 'object')
      .slice(0, MAX_SAVED_MARKERS)
  } catch {
    return []
  }
}
const savedMarkers = ref(readMarkerLibrary())
const remainingMarkerSlots = computed(() => Math.max(0, MAX_SAVED_MARKERS - savedMarkers.value.length))
const markerLibrarySizeLabel = computed(() => {
  const bytes = new TextEncoder().encode(JSON.stringify(savedMarkers.value)).length
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
})
const selectedSavedMarkerId = ref(
  typeof restoredMarkerDraft?.ui?.selectedSavedMarkerId === 'string'
    ? restoredMarkerDraft.ui.selectedSavedMarkerId
    : null
)
const libraryName = ref(
  typeof restoredMarkerDraft?.ui?.libraryName === 'string'
    ? restoredMarkerDraft.ui.libraryName.slice(0, 32)
    : typeof draft.value.name === 'string' ? draft.value.name.slice(0, 32) : ''
)
const loadedMarkerName = ref(
  typeof restoredMarkerDraft?.ui?.loadedMarkerName === 'string'
    ? restoredMarkerDraft.ui.loadedMarkerName.slice(0, 32)
    : libraryName.value
)
const currentMarkerName = computed(() => loadedMarkerName.value.trim() || '新規マーカー')
const libraryNotice = ref(restoredMarkerDraft ? '前回の編集中データを復元しました。' : '')
const markerSettingsFileInput = ref(null)
const imageExportBackground = ref('transparent')
const imageExporting = ref(false)
const settingsExporting = ref(false)
const EDITOR_SECTION_KEYS = new Set(['library', 'existing', 'display', 'overall', 'rings', 'motion'])
const activeSection = ref(
  EDITOR_SECTION_KEYS.has(restoredMarkerDraft?.ui?.activeSection)
    ? restoredMarkerDraft.ui.activeSection
    : 'rings'
)
const ringAdvancedSettingsOpen = ref(false)
const appliedPresetKey = ref(
  typeof restoredMarkerDraft?.ui?.appliedPresetKey === 'string'
    ? restoredMarkerDraft.ui.appliedPresetKey
    : null
)
const restoredSelectedRingId = restoredMarkerDraft?.ui?.selectedRingId
const selectedRingId = ref(
  draft.value.rings.some(ring => ring.id === restoredSelectedRingId)
    ? restoredSelectedRingId
    : draft.value.rings[0].id
)
const selectedRingIndex = computed(() => Math.max(0, draft.value.rings.findIndex(ring => ring.id === selectedRingId.value)))
const selectedRing = computed(() => draft.value.rings[selectedRingIndex.value])
const selectedRingTransformTiming = computed(() => selectedRing.value.transformTiming)
const editingStateLabel = computed(() => EDITING_STATE_OPTIONS.find(state => state.key === editingState.value)?.label || '停止時')
const copyDestinationOptions = computed(() => EDITING_STATE_OPTIONS.filter(state => state.key !== editingState.value))
const transformAnimationActive = computed(() => (
  ['reverse', 'reset'].includes(draft.value.transition.transformMode)
  || draft.value.rings.some(ring => (
    ring.transformTiming?.useGlobal === false
    && ['reverse', 'reset'].includes(ring.transformTiming.transformMode)
  ))
))
const previewMarkerState = computed(() => {
  if (previewMoving.value) return 'moving'
  if (editingState.value === 'transform') {
    return transformAnimationActive.value ? '' : 'transform'
  }
  return 'idle'
})
const previewStateLabel = computed(() => (
  editingState.value === 'transform' && transformAnimationActive.value
    ? '変換アニメーション'
    : EDITING_STATE_OPTIONS.find(state => state.key === previewMarkerState.value)?.label || '停止時'
))
const contextLayerName = computed(() => {
  const index = draft.value.rings.findIndex(ring => ring.id === layerContextRingId.value)
  if (index < 0) return ''
  return getRingName(draft.value.rings[index], index)
})
const selectedOverall = computed(() => draft.value.appearance[editingState.value])
const selectedWholeMotion = computed(() => draft.value.wholeMotion[editingState.value])
const selectedWholeMotionTracesIdle = computed(() => (
  ['moving', 'transform'].includes(editingState.value) && selectedWholeMotion.value.traceIdle === true
))
const selectedRingAppearance = computed(() => selectedRing.value.appearance[editingState.value])
const CUTOUT_SHAPES = new Set(['circle', 'point', 'square', 'triangle', 'diamond', 'star', 'hexagram', 'octagram', 'sparkle', 'arrow', 'arrowhead', 'sector', 'moon', 'sharpMoon', 'gear', 'gear2', 'heart', 'sun'])
const selectedRingSupportsCutout = computed(() => CUTOUT_SHAPES.has(selectedRingAppearance.value.shape))
const selectedRingSupportsLayerErase = computed(() => (
  CUTOUT_SHAPES.has(selectedRingAppearance.value.shape)
  && ['continuous', 'circumference'].includes(selectedRingAppearance.value.renderMode)
))
const selectedMotion = computed(() => selectedRing.value.motion[editingState.value])
const selectedMotionTracesIdle = computed(() => (
  ['moving', 'transform'].includes(editingState.value) && selectedMotion.value.traceIdle === true
))
let markerDraftPersistTimer = null
const persistMarkerDraft = () => {
  if (markerDraftPersistTimer) {
    clearTimeout(markerDraftPersistTimer)
    markerDraftPersistTimer = null
  }
  try {
    localStorage.setItem(MARKER_EDITOR_DRAFT_STORAGE_KEY, JSON.stringify({
      version: 1,
      updatedAt: Date.now(),
      settings: draft.value,
      ui: {
        editingState: editingState.value,
        copyDestinationState: copyDestinationState.value,
        activeSection: activeSection.value,
        selectedRingId: selectedRingId.value,
        selectedSavedMarkerId: selectedSavedMarkerId.value,
        libraryName: libraryName.value,
        loadedMarkerName: loadedMarkerName.value,
        appliedPresetKey: appliedPresetKey.value
      }
    }))
  } catch (error) {
    console.warn('[CustomMarkerModal] editor draft autosave failed', error)
  }
}
const scheduleMarkerDraftPersist = () => {
  if (markerDraftPersistTimer) clearTimeout(markerDraftPersistTimer)
  markerDraftPersistTimer = setTimeout(persistMarkerDraft, 100)
}
watch(
  [
    draft,
    editingState,
    copyDestinationState,
    activeSection,
    selectedRingId,
    selectedSavedMarkerId,
    libraryName,
    loadedMarkerName,
    appliedPresetKey
  ],
  scheduleMarkerDraftPersist,
  { deep: true }
)
const DRAFT_HISTORY_LIMIT = 100
const serializeDraftHistory = () => JSON.stringify(draft.value)
const draftHistory = ref([serializeDraftHistory()])
const draftHistoryIndex = ref(0)
let draftHistoryCommitTimer = null
const hasPendingDraftHistory = () => (
  serializeDraftHistory() !== draftHistory.value[draftHistoryIndex.value]
)
const canUndoDraft = computed(() => draftHistoryIndex.value > 0 || hasPendingDraftHistory())
const canRedoDraft = computed(() => (
  !hasPendingDraftHistory() && draftHistoryIndex.value < draftHistory.value.length - 1
))
const commitDraftHistory = () => {
  if (draftHistoryCommitTimer) {
    clearTimeout(draftHistoryCommitTimer)
    draftHistoryCommitTimer = null
  }
  const snapshot = serializeDraftHistory()
  if (snapshot === draftHistory.value[draftHistoryIndex.value]) return
  const nextHistory = draftHistory.value.slice(0, draftHistoryIndex.value + 1)
  nextHistory.push(snapshot)
  if (nextHistory.length > DRAFT_HISTORY_LIMIT) nextHistory.shift()
  draftHistory.value = nextHistory
  draftHistoryIndex.value = nextHistory.length - 1
}
const scheduleDraftHistoryCommit = () => {
  if (draftHistoryCommitTimer) clearTimeout(draftHistoryCommitTimer)
  draftHistoryCommitTimer = setTimeout(commitDraftHistory, 220)
}
const restoreDraftHistorySnapshot = snapshot => {
  draft.value = JSON.parse(snapshot)
  if (!draft.value.rings.some(ring => ring.id === selectedRingId.value)) {
    selectedRingId.value = draft.value.rings[0].id
  }
  pendingOverallShape.value = null
  deleteConfirmation.value = null
}
const undoDraftChange = () => {
  commitDraftHistory()
  if (draftHistoryIndex.value <= 0) return
  draftHistoryIndex.value -= 1
  restoreDraftHistorySnapshot(draftHistory.value[draftHistoryIndex.value])
}
const redoDraftChange = () => {
  commitDraftHistory()
  if (draftHistoryIndex.value >= draftHistory.value.length - 1) return
  draftHistoryIndex.value += 1
  restoreDraftHistorySnapshot(draftHistory.value[draftHistoryIndex.value])
}
watch(draft, scheduleDraftHistoryCommit, { deep: true })
const selectedRingItemCount = computed(() => {
  const appearance = selectedRingAppearance.value
  if (appearance.renderMode === 'textRing') {
    return appearance.textMode === 'labels'
      ? Math.min(TEXT_ITEM_LIMIT, Math.max(1, Number(appearance.splitCount) || 1))
      : countTextCharacters(appearance.textContent)
  }
  return Math.min(8, Math.max(1, Number(appearance.splitCount) || 1))
})
const getRingAppearance = ring => ring.appearance[editingState.value]
const getRingBaseName = (ring, index) => {
  const name = ring.name?.trim() || ''
  const isGeneratedName = /^リング\s*\d+$/.test(name)
  if (name && !isGeneratedName) return name
  const shape = ring.appearance?.idle?.shape || ring.shape || 'circle'
  return shapeLabel(shape) || `レイヤー ${index + 1}`
}
const getRingName = (ring, index) => {
  const baseName = getRingBaseName(ring, index)
  const matchingRings = draft.value.rings.filter((candidate, candidateIndex) => (
    getRingBaseName(candidate, candidateIndex) === baseName
  ))
  if (matchingRings.length <= 1) return baseName
  const occurrence = draft.value.rings
    .slice(0, index + 1)
    .filter((candidate, candidateIndex) => getRingBaseName(candidate, candidateIndex) === baseName)
    .length
  return `${baseName} ${occurrence}`
}
const selectRing = ringId => {
  selectedRingId.value = ringId
  highlightedRingId.value = null
  if (ringHighlightTimer) clearTimeout(ringHighlightTimer)
  ringHighlightTimer = setTimeout(() => {
    highlightedRingId.value = ringId
    ringHighlightTimer = setTimeout(() => {
      highlightedRingId.value = null
      ringHighlightTimer = null
    }, 850)
  }, 20)
}
const selectRingFromDrawer = ringId => {
  selectRing(ringId)
  activeSection.value = 'rings'
}
const openMobileLayerDrawer = () => {
  const previewBottom = markerPreviewRef.value?.getBoundingClientRect?.().bottom
  mobileDrawerTop.value = Number.isFinite(previewBottom) ? Math.round(previewBottom) : 302
  mobileLayerDrawerOpen.value = true
}
const openLayerContextMenu = ringId => {
  layerContextRingId.value = ringId
}
const closeLayerContextMenu = () => {
  layerContextRingId.value = null
}
const cancelLayerLongPress = () => {
  if (layerLongPressTimer) clearTimeout(layerLongPressTimer)
  layerLongPressTimer = null
  layerLongPressStart = null
}
const startLayerLongPress = (event, ringId) => {
  if (event.pointerType === 'mouse' && event.button !== 0) return
  cancelLayerLongPress()
  layerLongPressTriggered = false
  layerLongPressStart = { x: event.clientX, y: event.clientY }
  layerLongPressTimer = setTimeout(() => {
    layerLongPressTriggered = true
    openLayerContextMenu(ringId)
    layerLongPressTimer = null
  }, 550)
}
const cancelLayerLongPressOnMove = event => {
  if (!layerLongPressStart) return
  if (Math.hypot(event.clientX - layerLongPressStart.x, event.clientY - layerLongPressStart.y) > 8) {
    cancelLayerLongPress()
  }
}
const endLayerLongPress = () => {
  cancelLayerLongPress()
}
const handleLayerSelect = ringId => {
  if (layerLongPressTriggered) {
    layerLongPressTriggered = false
    return
  }
  selectRingFromDrawer(ringId)
}
const startLayerDrag = (event, ringId) => {
  cancelLayerLongPress()
  draggingRingId.value = ringId
  dragOverRingId.value = ringId
  event.currentTarget.setPointerCapture?.(event.pointerId)
}
const moveLayerDrag = event => {
  if (!draggingRingId.value) return
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest?.('.mobile-layer-item')
  const targetId = target?.dataset?.ringId
  if (!targetId || targetId === draggingRingId.value) return
  const from = draft.value.rings.findIndex(ring => ring.id === draggingRingId.value)
  const to = draft.value.rings.findIndex(ring => ring.id === targetId)
  if (from < 0 || to < 0) return
  const [ring] = draft.value.rings.splice(from, 1)
  draft.value.rings.splice(to, 0, ring)
  dragOverRingId.value = targetId
}
const endLayerDrag = event => {
  event.currentTarget.releasePointerCapture?.(event.pointerId)
  draggingRingId.value = null
  dragOverRingId.value = null
}
const openMobileSection = section => {
  activeSection.value = section
  mobileMenuOpen.value = false
}
const openFullscreenFromMenu = () => {
  mobileMenuOpen.value = false
  enterPreviewFullscreen()
}
const copyFromMobileMenu = destination => {
  copyEditingStateTo(destination)
  mobileMenuOpen.value = false
}
const resetFromMobileMenu = () => {
  reset()
  mobileMenuOpen.value = false
}
const cloneMarkerSettings = settings => JSON.parse(JSON.stringify(settings))
const persistMarkerLibrary = () => {
  try {
    localStorage.setItem(MARKER_LIBRARY_STORAGE_KEY, JSON.stringify(savedMarkers.value))
    return true
  } catch {
    libraryNotice.value = '保存できませんでした。ブラウザの保存領域を確認してください。'
    return false
  }
}
const markerNameForSave = () => libraryName.value.trim().slice(0, 32) || `マーカー ${savedMarkers.value.length + 1}`
const markerSettingsJson = () => JSON.stringify({
  version: 1,
  name: markerNameForSave(),
  exportedAt: new Date().toISOString(),
  settings: cloneMarkerSettings(draft.value)
}, null, 2)
const downloadBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
const saveBlobForDevice = async (blob, fileName) => {
  if (mobileLayout.value && typeof navigator.share === 'function' && typeof File === 'function') {
    const primaryType = blob.type || 'application/octet-stream'
    const shareTypes = [primaryType]
    if (
      (primaryType.startsWith('image/svg+xml') || primaryType === 'application/json')
      && !shareTypes.includes('text/plain')
    ) {
      // Mobile Web Share implementations often reject SVG/JSON MIME types even
      // though they can save the exact same file as plain text.
      shareTypes.push('text/plain')
    }
    for (const shareType of shareTypes) {
      const file = new File([blob], fileName, {
        type: shareType,
        lastModified: Date.now()
      })
      let canShareFile = true
      if (typeof navigator.canShare === 'function') {
        try {
          canShareFile = navigator.canShare({ files: [file] })
        } catch {
          canShareFile = false
        }
      }
      if (!canShareFile) continue
      try {
        await navigator.share({
          title: fileName,
          files: [file]
        })
        return 'shared'
      } catch (error) {
        if (error?.name === 'AbortError') return 'cancelled'
        console.warn(`[CustomMarkerModal] mobile file share failed for ${shareType}`, error)
      }
    }
  }
  downloadBlob(blob, fileName)
  return 'downloaded'
}
const exportMarkerSettings = async () => {
  if (settingsExporting.value) return
  settingsExporting.value = true
  try {
    const json = markerSettingsJson()
    const fileName = markerNameForSave().replace(/[\\/:*?"<>|]/g, '_')
    const blob = new Blob([json], { type: 'application/json' })
    const result = await saveBlobForDevice(blob, `${fileName || 'target-marker'}.json`)
    libraryNotice.value = result === 'shared'
      ? '端末の保存・共有画面へ設定JSONを渡しました。'
      : result === 'cancelled'
        ? '設定JSONの保存をキャンセルしました。'
        : '作成中の設定JSONを保存しました。'
  } catch (error) {
    console.error('[CustomMarkerModal] marker settings export failed', error)
    libraryNotice.value = '設定JSONを保存できませんでした。ブラウザのファイル出力対応を確認してください。'
  } finally {
    settingsExporting.value = false
  }
}
const blobToDataUrl = blob => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result)
  reader.onerror = () => reject(reader.error)
  reader.readAsDataURL(blob)
})
const inlineCssUrls = async (cssText, baseUrl) => {
  const matches = [...cssText.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/g)]
  let inlined = cssText
  for (const match of matches) {
    const rawUrl = match[2]?.trim()
    if (!rawUrl || rawUrl.startsWith('data:') || rawUrl.startsWith('#')) continue
    try {
      const resourceUrl = new URL(rawUrl, baseUrl || document.baseURI).href
      const response = await fetch(resourceUrl)
      if (!response.ok) continue
      const dataUrl = await blobToDataUrl(await response.blob())
      inlined = inlined.replace(match[0], `url("${dataUrl}")`)
    } catch {
      // Keep the original URL when an optional resource cannot be embedded.
    }
  }
  return inlined
}
const getMarkerExportCss = async () => {
  const markerRules = []
  const fontRules = []
  const fontFaceRuleType = typeof window !== 'undefined' && window.CSSRule
    ? window.CSSRule.FONT_FACE_RULE
    : 5
  for (const sheet of document.styleSheets) {
    let rules
    try {
      rules = [...sheet.cssRules]
    } catch {
      continue
    }
    const rulesText = rules.map(rule => rule.cssText).join('\n')
    if (rulesText.includes('.custom-marker-whole-orbit')) {
      markerRules.push(rulesText)
    }
    for (const rule of rules) {
      if (rule.type !== fontFaceRuleType) continue
      fontRules.push(await inlineCssUrls(rule.cssText, sheet.href || document.baseURI))
    }
  }
  return [...fontRules, ...markerRules].join('\n')
}
const exportMarkerImage = async () => {
  const source = markerPreviewRef.value?.querySelector('.preview-target > .target-marker')
  if (!source || imageExporting.value) return

  imageExporting.value = true
  try {
    await document.fonts?.ready
    const exportSize = 512
    const exportViewportSize = 360
    const clone = source.cloneNode(true)
    ;[clone, ...clone.querySelectorAll('*')].forEach(element => {
      element.style.animationPlayState = 'paused'
      element.style.transition = 'none'
    })
    const cssText = (await getMarkerExportCss()).replace(/\]\]>/g, ']]]]><![CDATA[>')
    const cloneMarkup = new XMLSerializer().serializeToString(clone)
    const backgroundColor = draft.value.behavior.previewBackgroundColor || '#071722'
    const backgroundMarkup = imageExportBackground.value === 'preview'
      ? `
    <defs>
      <radialGradient id="preview-glow" cx="50%" cy="50%" r="72%">
        <stop offset="0%" stop-color="rgb(80, 180, 210)" stop-opacity="0.28"/>
        <stop offset="100%" stop-color="rgb(80, 180, 210)" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${exportViewportSize}" height="${exportViewportSize}" fill="${backgroundColor}"/>
    <rect width="${exportViewportSize}" height="${exportViewportSize}" fill="url(#preview-glow)"/>`
      : ''
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${exportSize}" height="${exportSize}" viewBox="0 0 ${exportViewportSize} ${exportViewportSize}">
  <style><![CDATA[
${cssText}
.target-marker, .target-marker * {
  animation-play-state: paused !important;
  transition: none !important;
}
  ]]></style>${backgroundMarkup}
  <foreignObject x="0" y="0" width="${exportViewportSize}" height="${exportViewportSize}">
    <div xmlns="http://www.w3.org/1999/xhtml" style="position:relative;width:${exportViewportSize}px;height:${exportViewportSize}px;overflow:hidden;display:grid;place-items:center;">
      ${cloneMarkup}
    </div>
  </foreignObject>
</svg>`
    const fileName = markerNameForSave().replace(/[\\/:*?"<>|]/g, '_')
    const result = await saveBlobForDevice(
      new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }),
      `${fileName || 'target-marker'}.svg`
    )
    libraryNotice.value = result === 'shared'
      ? '端末の保存・共有画面へSVGを渡しました。'
      : result === 'cancelled'
        ? 'SVGの保存をキャンセルしました。'
        : imageExportBackground.value === 'transparent'
          ? '背景透過SVGを保存しました。'
          : '背景付きSVGを保存しました。'
  } catch (error) {
    console.error('[CustomMarkerModal] marker image export failed', error)
    libraryNotice.value = 'SVGを作成できませんでした。ブラウザのファイル出力対応を確認してください。'
  } finally {
    imageExporting.value = false
  }
}
const openMarkerSettingsFile = () => markerSettingsFileInput.value?.click()
const importMarkerSettings = async event => {
  const input = event.target
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  try {
    const parsed = JSON.parse(await file.text())
    const settings = parsed?.settings && typeof parsed.settings === 'object' ? parsed.settings : parsed
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) throw new Error('invalid settings')

    draft.value = createDraftFromSettings(cloneMarkerSettings(settings))
    selectedSavedMarkerId.value = null
    libraryName.value = typeof parsed?.name === 'string' ? parsed.name.slice(0, 32) : file.name.replace(/\.json$/i, '').slice(0, 32)
    loadedMarkerName.value = libraryName.value
    selectedRingId.value = draft.value.rings[0].id
    appliedPresetKey.value = null
    pendingOverallShape.value = null
    previewPosition.value = { x: 50, y: 50 }
    selectEditingState('idle')
    selectRing(selectedRingId.value)
    libraryNotice.value = `「${file.name}」を読み込みました。決定するまで戦闘画面には反映されません。`
  } catch {
    libraryNotice.value = '設定JSONを読み込めませんでした。JSON保存で出力したファイルを選択してください。'
  }
}
const selectSavedMarker = marker => {
  selectedSavedMarkerId.value = marker.id
  libraryName.value = marker.name
  libraryNotice.value = `「${marker.name}」を選択しました。`
}
const saveNewMarker = () => {
  if (savedMarkers.value.length >= MAX_SAVED_MARKERS) {
    libraryNotice.value = `保存できるマーカーは${MAX_SAVED_MARKERS}件までです。`
    return
  }
  const marker = {
    id: `marker-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: markerNameForSave(),
    updatedAt: Date.now(),
    settings: cloneMarkerSettings(draft.value)
  }
  savedMarkers.value.unshift(marker)
  selectedSavedMarkerId.value = marker.id
  libraryName.value = marker.name
  loadedMarkerName.value = marker.name
  if (persistMarkerLibrary()) libraryNotice.value = `「${marker.name}」を保存しました。`
}
const overwriteSavedMarker = () => {
  const index = savedMarkers.value.findIndex(marker => marker.id === selectedSavedMarkerId.value)
  if (index < 0) return
  const current = savedMarkers.value[index]
  const updated = {
    ...current,
    name: markerNameForSave(),
    updatedAt: Date.now(),
    settings: cloneMarkerSettings(draft.value)
  }
  savedMarkers.value.splice(index, 1)
  savedMarkers.value.unshift(updated)
  libraryName.value = updated.name
  loadedMarkerName.value = updated.name
  if (persistMarkerLibrary()) libraryNotice.value = `「${updated.name}」を上書きしました。`
}
const loadSavedMarker = marker => {
  draft.value = createDraftFromSettings(cloneMarkerSettings(marker.settings))
  selectedSavedMarkerId.value = marker.id
  libraryName.value = marker.name
  loadedMarkerName.value = marker.name
  selectedRingId.value = draft.value.rings[0].id
  appliedPresetKey.value = null
  pendingOverallShape.value = null
  previewPosition.value = { x: 50, y: 50 }
  selectEditingState('idle')
  selectRing(selectedRingId.value)
  libraryNotice.value = `「${marker.name}」を読み込みました。決定するまで戦闘画面には反映されません。`
}
const deleteSavedMarker = markerId => {
  const marker = savedMarkers.value.find(item => item.id === markerId)
  if (!marker) return
  savedMarkers.value = savedMarkers.value.filter(item => item.id !== markerId)
  if (selectedSavedMarkerId.value === markerId) {
    selectedSavedMarkerId.value = null
    libraryName.value = ''
  }
  if (persistMarkerLibrary()) libraryNotice.value = `「${marker.name}」を削除しました。`
}
const requestSavedMarkerDelete = markerId => {
  const marker = savedMarkers.value.find(item => item.id === markerId)
  if (!marker) return
  deleteConfirmation.value = {
    kind: 'library',
    id: marker.id,
    name: marker.name
  }
}
const setOverallShape = shape => {
  selectedOverall.value.shape = shape
  draft.value.rings.forEach(ring => {
    const appearance = ring.appearance[editingState.value]
    appearance.shape = shape
    if (shape === 'point') {
      appearance.fillEnabled = true
      appearance.fillOpacity = 100
    }
  })
}
const onRingShapeChange = () => {
  const appearance = selectedRingAppearance.value
  if (appearance.shape === 'point') {
    appearance.fillEnabled = true
    appearance.fillOpacity = 100
  }
  if (appearance.shape === 'segmentedRing') {
    appearance.splitCount = Math.max(2, Number(appearance.splitCount) || 2)
    appearance.equalizeSegments = false
    appearance.evenSpacing = false
  }
  if (appearance.shape === 'polygon') {
    appearance.polygonSides = Math.max(3, Number(appearance.polygonSides) || 3)
    appearance.connectionClosed = true
  }
}
const requestOverallShapeChange = shape => {
  if (shape === selectedOverall.value.shape) return
  pendingOverallShape.value = shape
}
const shapeLabel = shapeKey => shapes.find(shape => shape.key === shapeKey)?.label || shapeKey
const getGearSpokeCount = (teeth, shape) => {
  const toothCount = Math.min(32, Math.max(6, Number(teeth) || 12))
  return shape === 'gear2' ? toothCount : 0
}
const moonPhaseLabel = value => {
  const phase = Number(value) || 0
  if (phase <= 8) return '満月'
  if (phase <= 42) return '欠け始め'
  if (phase <= 68) return '半月'
  return '三日月'
}
const confirmOverallShapeChange = () => {
  if (!pendingOverallShape.value) return
  setOverallShape(pendingOverallShape.value)
  pendingOverallShape.value = null
}
const setRenderMode = mode => {
  const appearance = selectedRingAppearance.value
  appearance.renderMode = mode
  // 表示形式ごとに座標系と分割の意味が異なるため、前の形式の状態を持ち込まない。
  appearance.offsetX = 0
  appearance.offsetY = 0
  appearance.equalizeSegments = false
  appearance.evenSpacing = false
  appearance.splitGap = 0

  if (mode === 'circumference') {
    appearance.layout = 'arc'
    appearance.evenSpacing = true
    appearance.splitCount = Math.max(3, Number(appearance.splitCount) || 1)
  } else if (mode === 'textRing') {
    appearance.layout = 'straight'
    appearance.textMode = appearance.textMode === 'labels' ? 'labels' : 'string'
    appearance.textLayout = appearance.textLayout === 'shape' ? 'shape' : 'circle'
    appearance.textContent ||= 'TARGET LOCKED'
    appearance.textRadius ||= 45
    appearance.textSpacing ||= 100
    appearance.textArcSpread ||= 360
    appearance.textSize ||= 14
  } else if (mode === 'continuous') {
    // 円周配置の分割・軌道設定を残すと、単体へ戻したSVGが縮小・偏位する。
    appearance.layout = 'straight'
    appearance.splitCount = 1
  } else {
    appearance.layout = 'straight'
  }
}
const previewTargetStyle = computed(() => {
  const transition = draft.value.transition
  const easing = ['linear', 'ease-in', 'ease-out', 'ease-in-out'].includes(transition.easing)
    ? transition.easing
    : 'ease-in-out'
  const duration = Math.max(100, Number(transition.moveDuration) || 350)
  return {
    left: `${previewPosition.value.x}%`,
    top: `${previewPosition.value.y}%`,
    transition: previewCursorFollowActive.value
      ? 'none'
      : `left ${duration}ms ${easing}, top ${duration}ms ${easing}`
  }
})
const previewBackgroundStyle = computed(() => ({
  '--preview-background': draft.value.behavior.previewBackgroundColor || DEFAULT_SETTINGS.behavior.previewBackgroundColor,
  backgroundImage: draft.value.behavior.previewGradientEnabled === false ? 'none' : undefined
}))

const sections = [
  { key: 'rings', label: '形状・線' },
  { key: 'motion', label: '動き' },
  { key: 'overall', label: '全体設定' },
  { key: 'display', label: '表示設定' },
  { key: 'existing', label: '既存' },
  { key: 'library', label: '保存' }
]
const layerSections = sections.filter(section => ['rings', 'motion'].includes(section.key))
const menuSections = [
  { key: 'overall', label: '全体設定', description: '全レイヤーの大きさと動き' },
  { key: 'display', label: '表示設定', description: '背景とプレビュー操作' },
  { key: 'existing', label: '既存マーカー', description: '既存設定から作成' },
  { key: 'library', label: '保存・JSON', description: '保存、読込、JSON入出力' }
]

const shapes = [
  { key: 'circle', label: '円' },
  { key: 'point', label: '点' },
  { key: 'square', label: '四角' },
  { key: 'triangle', label: '三角' },
  { key: 'diamond', label: '菱形' },
  { key: 'line', label: '直線' },
  { key: 'cross', label: '十字' },
  { key: 'corner', label: 'L字枠' },
  { key: 'cornerFrame', label: '四隅枠' },
  { key: 'arc', label: '円弧' },
  { key: 'segmentedRing', label: '分割リング' },
  { key: 'polygon', label: '多角形' },
  { key: 'tick', label: '目盛り' },
  { key: 'star', label: '星' },
  { key: 'hexagram', label: '六芒星' },
  { key: 'octagram', label: '八芒星' },
  { key: 'sparkle', label: '十字星' },
  { key: 'moon', label: '月' },
  { key: 'sharpMoon', label: '二重円（可変）' },
  { key: 'gear', label: '歯車' },
  { key: 'gear2', label: '歯車2' },
  { key: 'heart', label: 'ハート' },
  { key: 'sun', label: '太陽' },
  { key: 'arrow', label: '矢印 ⇒' },
  { key: 'arrowhead', label: '矢じり ➤' },
  { key: 'sector', label: '扇形' },
  { key: 'wave', label: 'G5オービット' },
  { key: 'magitechWave', label: 'G4ウェーブ' }
]
const textFontPresets = [
  ...VISIBLE_TEXT_FONT_PRESETS,
  { key: 'custom', label: 'カスタム指定', category: '自由入力' }
]
const selectedTextFontLabel = computed(() => (
  textFontPresets.find(font => font.key === selectedRingAppearance.value.textFontPreset)?.label
  || 'フォントを選択'
))
const selectedTextFontFamily = computed(() => {
  if (selectedRingAppearance.value.textFontPreset === 'custom') {
    return selectedRingAppearance.value.textCustomFontFamily || 'inherit'
  }
  return textFontPresets.find(font => font.key === selectedRingAppearance.value.textFontPreset)?.family || 'inherit'
})
const RUNE_SAMPLE = 'ᚠᚢᚦᚨᚱᚲ'
const isRuneFontPreset = preset => ['rune', 'runeJs'].includes(preset)
const sanitizeRuneText = value => Array.from(String(value || ''))
  .filter(character => /[\u16A0-\u16FF\s]/u.test(character))
  .join('')
const onTextFontPresetChange = () => {
  if (!isRuneFontPreset(selectedRingAppearance.value.textFontPreset)) return
  const sanitized = sanitizeRuneText(selectedRingAppearance.value.textContent)
  selectedRingAppearance.value.textContent = sanitized.trim() ? sanitized : RUNE_SAMPLE
  selectedRingAppearance.value.segmentLabels = selectedRingAppearance.value.segmentLabels.map(label => sanitizeRuneText(label))
}
const selectTextFont = key => {
  selectedRingAppearance.value.textFontPreset = key
  onTextFontPresetChange()
  fontPickerOpen.value = false
}
const sanitizeSelectedTextContent = event => {
  if (!isRuneFontPreset(selectedRingAppearance.value.textFontPreset)) return
  event.target.value = sanitizeRuneText(event.target.value)
  selectedRingAppearance.value.textContent = event.target.value
}
const sanitizeSegmentLabel = (index, event) => {
  if (!isRuneFontPreset(selectedRingAppearance.value.textFontPreset)) return
  event.target.value = sanitizeRuneText(event.target.value)
  selectedRingAppearance.value.segmentLabels[index] = event.target.value
}
const openRuneEditor = (target, index = null) => {
  runeEditorTarget.value = { target, index }
  runeEditorText.value = target === 'label'
    ? String(selectedRingAppearance.value.segmentLabels[index] || '')
    : String(selectedRingAppearance.value.textContent || '')
  runeEditorOpen.value = true
}
const closeRuneEditor = () => {
  const value = runeEditorText.value
  if (runeEditorTarget.value?.target === 'label') {
    selectedRingAppearance.value.segmentLabels[runeEditorTarget.value.index] = value
  } else if (runeEditorTarget.value?.target === 'text') {
    selectedRingAppearance.value.textContent = value
  }
  runeEditorOpen.value = false
  runeEditorTarget.value = null
}
const appendRuneCharacter = character => {
  const maxLength = runeEditorTarget.value?.target === 'label' ? 8 : TEXT_ITEM_LIMIT
  runeEditorText.value = sanitizeRuneText(`${runeEditorText.value}${character}`).slice(0, maxLength)
}
const removeRuneCharacter = () => {
  runeEditorText.value = Array.from(runeEditorText.value).slice(0, -1).join('')
}
const clearRuneEditor = () => { runeEditorText.value = '' }
const setRuneSample = () => { runeEditorText.value = RUNE_SAMPLE }

const renderModes = [
  { key: 'continuous', label: '単体形状', description: '中心を基準に、円や模様などの形を1つ描画します。' },
  { key: 'circumference', label: '分割配置', description: '同じ部品を分割し、中心点の周囲へ均等に配置します。' },
  { key: 'textRing', label: '円周文字', description: '文字列または個別ラベルを中心の周囲へ最大64個まで配置します。' }
]

const staticMotion = overrides => makeMotionState({
  enabled: false,
  rotateEnabled: false,
  pulseEnabled: false,
  ...overrides
})
const presetRing = (appearance, motion = {}, movingAppearance = {}, movingMotion = {}) => ({
  appearance,
  motion,
  movingAppearance,
  movingMotion
})
const nodeColors = ['#63f58c', '#ffe45c', '#5faeff', '#ffffff', '#b8ff62', '#63f58c', '#ffe45c', '#5faeff']
const g45NodeColors = ['#63f58c', '#ffe45c', '#5faeff', '#ffffff', '#b8ff62']
const existingMarkerPresets = [
  {
    key: 1,
    label: 'G1',
    color: '#dcdcdc',
    rings: [
      presetRing({ shape: 'circle', width: 100, height: 100, lineWidth: 3 }, { enabled: true, pulseEnabled: true, pulseDuration: 1.6, pulseAmount: 8 }),
      presetRing({ shape: 'circle', width: 64, height: 64, lineStyle: 'dashed' }, { enabled: true, rotateEnabled: true, rotateDuration: 6 }),
      presetRing({ shape: 'cross', width: 62, height: 62, lineWidth: 2 }),
      presetRing({ shape: 'circle', width: 14, height: 14, lineWidth: 2 })
    ]
  },
  {
    key: 1.5,
    label: 'G1.5',
    color: '#e58a36',
    rings: [
      presetRing({ shape: 'segmentedRing', width: 92, height: 92, splitCount: 8, splitGap: 7, lineWidth: 1, opacity: 62 }),
      presetRing({ shape: 'circle', width: 64, height: 64, lineStyle: 'dashed', lineWidth: 2 }, { enabled: true, rotateEnabled: true, rotateDuration: 6 }),
      presetRing({ shape: 'cornerFrame', width: 100, height: 100, lineWidth: 3 }),
      presetRing({ shape: 'cross', width: 58, height: 58, lineWidth: 2 }),
      presetRing({ shape: 'circle', width: 28, height: 28, lineWidth: 1, opacity: 82 })
    ]
  },
  {
    key: 2,
    label: 'G2',
    color: '#5cff8a',
    rings: [
      presetRing({ shape: 'circle', width: 96, height: 96, lineWidth: 2 }),
      presetRing({ shape: 'tick', width: 72, height: 16, splitCount: 8, equalizeSegments: true, layout: 'arc', evenSpacing: true, arcRadius: 51, arcOrientation: 'radial', lineWidth: 2 }, { enabled: true, rotateEnabled: true, rotateDuration: 9 }),
      presetRing({ shape: 'cornerFrame', width: 100, height: 100, lineWidth: 2 }),
      presetRing({ shape: 'cross', width: 70, height: 70, lineWidth: 2 })
    ]
  },
  {
    key: 2.5,
    label: 'G2.5',
    color: '#21dce5',
    rings: [
      presetRing({ shape: 'tick', width: 92, height: 12, splitCount: 8, equalizeSegments: true, layout: 'arc', evenSpacing: true, arcRadius: 54, arcOrientation: 'radial', opacity: 80 }, { enabled: true, rotateEnabled: true, rotateDuration: 14 }),
      presetRing({ shape: 'arc', width: 82, height: 36, splitCount: 3, equalizeSegments: true, layout: 'arc', evenSpacing: true, arcRadius: 30, arcOrientation: 'tangent', lineStyle: 'dashed', lineWidth: 2 }, { enabled: true, rotateEnabled: true, rotateDuration: 7, direction: 'reverse' }),
      presetRing({ shape: 'arrowhead', width: 48, height: 18, splitCount: 4, equalizeSegments: true, layout: 'arc', evenSpacing: true, arcRadius: 39, arcOrientation: 'radial', angle: 180, fillEnabled: true, fillOpacity: 55 }, {}, { arcRadius: 52 }, {}),
      presetRing({ shape: 'circle', width: 9, height: 9, fillEnabled: true, fillOpacity: 100 })
    ]
  },
  {
    key: 3,
    label: 'G3',
    color: '#b7ceff',
    rings: [
      presetRing({ shape: 'circle', width: 100, height: 100, lineWidth: 2 }),
      presetRing({ shape: 'circle', width: 66, height: 66, lineWidth: 3, lineStyle: 'dashed', opacity: 72 }, { enabled: true, rotateEnabled: true, rotateDuration: 8 }),
      presetRing({ shape: 'arrowhead', width: 50, height: 20, splitCount: 4, equalizeSegments: true, layout: 'arc', evenSpacing: true, arcRadius: 38, arcOrientation: 'radial', angle: 180, fillEnabled: true, fillOpacity: 76 }),
      presetRing({ shape: 'cross', width: 28, height: 28, lineWidth: 2 })
    ]
  },
  {
    key: 3.5,
    label: 'G3.5',
    color: '#a9d8ff',
    rings: [
      presetRing({ shape: 'circle', width: 106, height: 106, lineWidth: 3 }, { enabled: true, rotateEnabled: true, rotateDuration: 12 }),
      presetRing({ shape: 'tick', width: 92, height: 13, splitCount: 8, equalizeSegments: true, layout: 'arc', evenSpacing: true, arcRadius: 51, arcOrientation: 'radial', opacity: 75 }, { enabled: true, rotateEnabled: true, rotateDuration: 9, direction: 'reverse' }),
      presetRing({ shape: 'circle', width: 72, height: 72, lineStyle: 'dashed', lineWidth: 3 }, { enabled: true, rotateEnabled: true, rotateDuration: 6 }),
      presetRing({ shape: 'arrowhead', width: 46, height: 17, splitCount: 4, equalizeSegments: true, layout: 'arc', evenSpacing: true, arcRadius: 40, arcOrientation: 'radial', angle: 180, fillEnabled: true, fillOpacity: 70 }),
      presetRing({ shape: 'sparkle', width: 15, height: 15, fillEnabled: true, fillOpacity: 75 })
    ]
  },
  {
    key: 4,
    label: 'G4',
    color: '#39c6d8',
    rings: [
      presetRing({ shape: 'magitechWave', width: 96, height: 96, lineWidth: 2, opacity: 90 }, { enabled: true, rotateEnabled: true, rotateDuration: 10 }),
      presetRing({ shape: 'circle', width: 72, height: 72, lineWidth: 1, opacity: 78 }),
      presetRing({ shape: 'polygon', width: 100, height: 100, splitCount: 3, arcRadius: 47, lineWidth: 2, opacity: 72 }, { enabled: true, rotateEnabled: true, rotateDuration: 9, glowEnabled: true, glowMin: 3, glowMax: 9 }),
      presetRing({ shape: 'circle', width: 56, height: 18, splitCount: 3, equalizeSegments: true, layout: 'arc', evenSpacing: true, arcRadius: 47, arcOrientation: 'fixed', fillEnabled: true, fillOpacity: 75, useSegmentColors: true, segmentColors: nodeColors }, { enabled: true, rotateEnabled: true, rotateDuration: 9, glowEnabled: true, glowMin: 5, glowMax: 12 }),
      presetRing({ shape: 'sparkle', width: 12, height: 12, fillEnabled: true, fillOpacity: 70 })
    ]
  },
  {
    key: 4.5,
    label: 'G4.5',
    color: '#7064dc',
    behavior: { followCursor: true, cursorFollowDuration: 30, cursorFollowSpeed: 90 },
    rings: [
      presetRing({ shape: 'magitechWave', width: 124, height: 114, lineWidth: 2, waveAmplitude: 1.5, waveCount: 24, waveRandomness: 81 }, { enabled: true, rotateEnabled: true, rotateDuration: 8 }, { waveAmplitude: 4, waveCount: 12, waveRandomness: 55, waveSpeed: 1 }, { rotateDuration: 1 }),
      presetRing({ shape: 'circle', width: 85, height: 85, lineWidth: 1, opacity: 78 }, staticMotion(), {}, { enabled: true, rotateEnabled: true, rotateDuration: 1 }),
      presetRing({ shape: 'polygon', width: 117, height: 117, splitCount: 5, arcRadius: 49, lineWidth: 2, opacity: 76 }, { enabled: true, rotateEnabled: true, rotateDuration: 8, glowEnabled: true, glowMin: 4, glowMax: 11 }, { width: 100, height: 100 }, { rotateDuration: 1 }),
      presetRing({ shape: 'circle', width: 64, height: 18, splitCount: 5, equalizeSegments: true, layout: 'arc', evenSpacing: true, arcRadius: 49, arcOrientation: 'fixed', fillEnabled: true, fillOpacity: 80, useSegmentColors: true, segmentColors: g45NodeColors, lineStyle: 'double', doubleLineGap: 40, glow: 14, glowColor: '#c28cf8', blendMode: 'screen' }, { enabled: true, rotateEnabled: true, rotateDuration: 8 }, { lineStyle: 'solid', doubleLineGap: 18, glow: 8, glowColor: '#7064dc', blendMode: 'normal' }, { rotateDuration: 1 }),
      presetRing({ shape: 'arrowhead', width: 62, height: 15, splitCount: 4, equalizeSegments: true, layout: 'arc', evenSpacing: true, arcRadius: 70, arcOrientation: 'radial', fillEnabled: true, fillOpacity: 65 }, { enabled: true, rotateEnabled: false, rotateDuration: 12, direction: 'reverse' }, { angle: 178 }),
      presetRing({ shape: 'circle', width: 24, height: 12, lineWidth: 2, opacity: 55 }),
      presetRing({ shape: 'diamond', width: 8, height: 14, color: '#6a6572', fillEnabled: true, fillOpacity: 65 }),
      presetRing({ shape: 'circle', width: 128, height: 128, color: '#722aac', glowColor: '#ae00ff' }, { enabled: true, rotateEnabled: true, rotateDuration: 8 }, {}, { rotateDuration: 1 }),
      presetRing({ renderMode: 'circumference', shape: 'point', width: 10, height: 10, splitCount: 5, equalizeSegments: true, layout: 'arc', evenSpacing: true, arcSpread: 288, arcRadius: 49, lineWidth: 1, color: '#8fefff', glowColor: '#8fefff', fillColor: '#8fefff', fillEnabled: true, fillOpacity: 100 }, { enabled: true, rotateEnabled: true, rotateDuration: 8 }, { renderMode: 'continuous', shape: 'circle', width: 20, height: 20, splitCount: 1, equalizeSegments: false, evenSpacing: false, arcSpread: 90, arcRadius: 45, lineWidth: 2, fillEnabled: false, fillOpacity: 30 })
    ]
  },
  {
    key: 5,
    label: 'G5',
    color: '#fff0a6',
    size: 85,
    rings: [
      presetRing({ shape: 'wave', width: 120, height: 120, lineWidth: 2 }, { enabled: true, rotateEnabled: true, rotateDuration: 13 }),
      presetRing({ shape: 'wave', width: 96, height: 96, lineWidth: 2, opacity: 82 }, { enabled: true, rotateEnabled: true, rotateDuration: 9, direction: 'reverse' }),
      presetRing({ shape: 'circle', width: 72, height: 72, lineWidth: 1, opacity: 40 }),
      presetRing({ shape: 'circle', width: 46, height: 46, lineWidth: 3, opacity: 36 }),
      presetRing({ shape: 'circle', width: 126, height: 126, lineStyle: 'dotted', opacity: 62 }, { enabled: true, rotateEnabled: true, rotateDuration: 16 })
    ]
  },
  {
    key: 5.5,
    label: 'G5.5',
    color: '#9be7ff',
    rings: [
      presetRing({ shape: 'segmentedRing', width: 92, height: 92, splitCount: 4, splitGap: 8, lineWidth: 4, opacity: 75 }, { enabled: true, rotateEnabled: true, rotateDuration: 12 }),
      presetRing({ shape: 'cross', width: 72, height: 72, angle: 45, lineStyle: 'dotted', lineWidth: 3, opacity: 42 }),
      presetRing({ shape: 'cornerFrame', width: 100, height: 100, lineWidth: 3, opacity: 78 }, { enabled: true, pulseEnabled: true, pulseDuration: 2.6, pulseAmount: 8 }),
      presetRing({ shape: 'circle', width: 74, height: 74, lineWidth: 1, opacity: 88 })
    ]
  },
  {
    key: 'magic-circle-json',
    label: '魔法陣',
    color: magicCircleExport.settings?.color || '#8fefff',
    settings: magicCircleExport.settings
  },
  {
    key: 'symbol-magic-circle-json',
    label: '記号魔法陣',
    color: symbolMagicCircleExport.settings?.color || '#8fefff',
    settings: symbolMagicCircleExport.settings
  },
  {
    key: 'magic-star-ring',
    label: '魔法陣・星環',
    color: '#8fefff',
    rings: [
      presetRing({ shape: 'circle', width: 140, height: 140, lineStyle: 'double', lineWidth: 2 }, { enabled: true, rotateEnabled: true, rotateDuration: 8 }, { width: 58, height: 58, lineStyle: 'solid' }),
      presetRing({ renderMode: 'textRing', shape: 'circle', textLayout: 'shape', textContent: '1234512345123451234512345123451234512345', textReferenceScale: 90, textEvenSpacing: true, arcAngle: 359, textSize: 13, textOrientation: 'centerFacing', glow: 0 }, { enabled: true, rotateEnabled: true, rotateDuration: 8 }, { renderMode: 'continuous', shape: 'circle', width: 58, height: 58 }),
      presetRing({ shape: 'square', width: 100, height: 100, lineStyle: 'double', doubleLineGap: 45, lineWidth: 2 }, { enabled: true, rotateEnabled: true, rotateDuration: 8 }, { shape: 'circle', width: 30, height: 30, lineStyle: 'solid' }),
      presetRing({ shape: 'square', width: 100, height: 100, angle: 45, lineStyle: 'double', doubleLineGap: 45, lineWidth: 2 }, { enabled: true, rotateEnabled: true, rotateDuration: 8 }, { shape: 'circle', width: 30, height: 30, lineStyle: 'solid' }),
      presetRing({ renderMode: 'circumference', shape: 'diamond', width: 5, height: 58, splitCount: 8, evenSpacing: true, arcRadius: 30, arcOrientation: 'radial', fillEnabled: true, fillOpacity: 100, lineWidth: 1 }, { enabled: true, rotateEnabled: true, rotateDuration: 8 }),
      presetRing({ renderMode: 'circumference', shape: 'diamond', width: 3, height: 35, splitCount: 8, evenSpacing: true, arcRadius: 25, arcAngle: 23, arcOrientation: 'radial', fillEnabled: true, fillOpacity: 100, lineWidth: 1 }, { enabled: true, rotateEnabled: true, rotateDuration: 8 }),
      presetRing({ shape: 'circle', width: 96, height: 96, lineWidth: 2 }, { enabled: true, rotateEnabled: true, rotateDuration: 8 }, { width: 20, height: 20 }),
      presetRing({ renderMode: 'circumference', shape: 'circle', width: 14, height: 9, splitCount: 8, evenSpacing: true, arcRadius: 49, arcAngle: 67, arcOrientation: 'tangent', lineStyle: 'double', doubleLineGap: 25, lineWidth: 2, fillEnabled: true, fillOpacity: 100 }, { enabled: true, rotateEnabled: true, rotateDuration: 8 }),
      presetRing({ renderMode: 'circumference', shape: 'line', width: 33, height: 140, splitCount: 8, evenSpacing: true, arcRadius: 50, arcAngle: 45, arcOrientation: 'radial', angle: 90, lineWidth: 2 }, { enabled: true, rotateEnabled: true, rotateDuration: 8 }),
      presetRing({ renderMode: 'circumference', shape: 'diamond', width: 4, height: 58, splitCount: 8, evenSpacing: true, arcRadius: 49, arcAngle: 45, arcOrientation: 'radial', fillEnabled: true, fillOpacity: 100, lineWidth: 1 }, { enabled: true, rotateEnabled: true, rotateDuration: 8 }),
      presetRing({ shape: 'circle', width: 80, height: 80, lineStyle: 'double', lineWidth: 2 }, { enabled: true, rotateEnabled: true, rotateDuration: 8 }, { width: 20, height: 20 }),
      presetRing({ shape: 'point', width: 42, height: 42, lineWidth: 5, fillEnabled: true, fillOpacity: 14 }, { enabled: true, rotateEnabled: true, rotateDuration: 8 }, { shape: 'circle', width: 20, height: 20 }),
      presetRing({ shape: 'sparkle', width: 53, height: 53, lineStyle: 'double', doubleLineGap: 50, lineWidth: 2, fillEnabled: true, fillOpacity: 9 }, { enabled: true, rotateEnabled: true, rotateDuration: 8 }, { shape: 'circle', width: 20, height: 20 })
    ]
  },
  {
    key: 'magic-hexagram',
    label: '魔法陣・六芒',
    color: '#ffcf78',
    rings: [
      presetRing({ shape: 'circle', width: 126, height: 126, lineStyle: 'double', doubleLineGap: 28, lineWidth: 2 }, { enabled: true, rotateEnabled: true, rotateDuration: 16 }),
      presetRing({ shape: 'circle', width: 104, height: 104, lineStyle: 'dashed', lineWidth: 2, opacity: 78 }, { enabled: true, rotateEnabled: true, rotateDuration: 10, direction: 'reverse' }),
      presetRing({ shape: 'hexagram', width: 88, height: 88, lineWidth: 3 }, { enabled: true, rotateEnabled: true, rotateDuration: 14 }),
      presetRing({ shape: 'hexagram', width: 57, height: 57, angle: 30, lineStyle: 'dashed', lineWidth: 2 }, { enabled: true, rotateEnabled: true, rotateDuration: 9, direction: 'reverse' }),
      presetRing({ renderMode: 'circumference', shape: 'diamond', width: 9, height: 15, splitCount: 6, evenSpacing: true, arcRadius: 47, arcOrientation: 'radial', fillEnabled: true, fillOpacity: 80 }, { enabled: true, rotateEnabled: true, rotateDuration: 12 }),
      presetRing({ shape: 'circle', width: 38, height: 38, lineStyle: 'double', doubleLineGap: 36, lineWidth: 2 }),
      presetRing({ shape: 'sparkle', width: 18, height: 18, fillEnabled: true, fillOpacity: 85 }, { enabled: true, glowEnabled: true, glowMin: 4, glowMax: 16, glowDuration: 2 })
    ]
  },
  {
    key: 'magic-octagram',
    label: '魔法陣・八方',
    color: '#d59cff',
    rings: [
      presetRing({ shape: 'segmentedRing', width: 132, height: 132, splitCount: 8, splitGap: 4, lineWidth: 2 }, { enabled: true, rotateEnabled: true, rotateDuration: 18 }),
      presetRing({ shape: 'circle', width: 112, height: 112, lineStyle: 'double', doubleLineGap: 34, lineWidth: 2 }, { enabled: true, rotateEnabled: true, rotateDuration: 12, direction: 'reverse' }),
      presetRing({ shape: 'octagram', width: 88, height: 88, lineWidth: 2 }, { enabled: true, rotateEnabled: true, rotateDuration: 14 }),
      presetRing({ shape: 'octagram', width: 58, height: 58, angle: 22, lineStyle: 'dashed', lineWidth: 2 }, { enabled: true, rotateEnabled: true, rotateDuration: 8, direction: 'reverse' }),
      presetRing({ renderMode: 'circumference', shape: 'tick', width: 11, height: 28, splitCount: 8, evenSpacing: true, arcRadius: 52, arcOrientation: 'radial', lineWidth: 2 }, { enabled: true, rotateEnabled: true, rotateDuration: 11 }),
      presetRing({ renderMode: 'circumference', shape: 'point', width: 8, height: 8, splitCount: 8, evenSpacing: true, arcRadius: 38, fillEnabled: true, fillOpacity: 100 }, { enabled: true, rotateEnabled: true, rotateDuration: 8, direction: 'reverse' }),
      presetRing({ shape: 'cross', width: 38, height: 38, lineWidth: 2 }),
      presetRing({ shape: 'circle', width: 10, height: 10, fillEnabled: true, fillOpacity: 100 })
    ]
  },
  {
    key: 'angel',
    label: '天使',
    color: '#dff7ff',
    rings: [
      presetRing({ shape: 'circle', width: 104, height: 84, lineWidth: 3 }, { enabled: true, rotateEnabled: true, rotateDuration: 10 }),
      presetRing({ shape: 'circle', width: 90, height: 72, lineStyle: 'dashed', opacity: 72 }, { enabled: true, rotateEnabled: true, rotateDuration: 7, direction: 'reverse' }),
      presetRing({ shape: 'arc', width: 86, height: 34, splitCount: 3, equalizeSegments: true, layout: 'arc', evenSpacing: true, arcRadius: 34, arcOrientation: 'tangent', lineWidth: 3, opacity: 88 }),
      presetRing({ shape: 'sparkle', width: 25, height: 25, fillEnabled: true, fillColor: '#fff6d6', fillOpacity: 75 }),
      presetRing({ shape: 'circle', width: 7, height: 7, fillEnabled: true, fillOpacity: 100 })
    ]
  },
  {
    key: 'seraph',
    label: '熾天使',
    color: '#fff2c0',
    rings: [
      presetRing({ shape: 'circle', width: 112, height: 88, lineWidth: 3 }, { enabled: true, rotateEnabled: true, rotateDuration: 8 }),
      presetRing({ shape: 'circle', width: 98, height: 76, lineStyle: 'dashed', opacity: 78 }, { enabled: true, rotateEnabled: true, rotateDuration: 6, direction: 'reverse' }),
      presetRing({ shape: 'arc', width: 92, height: 38, splitCount: 6, equalizeSegments: true, layout: 'arc', evenSpacing: true, arcRadius: 36, arcOrientation: 'tangent', lineWidth: 3 }),
      presetRing({ shape: 'tick', width: 82, height: 14, splitCount: 8, equalizeSegments: true, layout: 'arc', evenSpacing: true, arcRadius: 53, arcOrientation: 'radial', lineWidth: 2 }),
      presetRing({ shape: 'sparkle', width: 30, height: 30, fillEnabled: true, fillOpacity: 82 }, { enabled: true, glowEnabled: true, glowMin: 6, glowMax: 18, glowDuration: 2.4 }),
      presetRing({ shape: 'circle', width: 8, height: 8, fillEnabled: true, fillOpacity: 100 })
    ]
  },
  {
    key: 'tactical',
    label: '戦術',
    color: '#93ffb9',
    rings: [
      presetRing({ shape: 'cornerFrame', width: 100, height: 100, lineWidth: 3 }),
      presetRing({ shape: 'tick', width: 62, height: 13, splitCount: 8, equalizeSegments: true, layout: 'arc', arcSpread: 145, arcAngle: 270, arcRadius: 36, arcOrientation: 'radial' }),
      presetRing({ shape: 'cross', width: 42, height: 42, lineWidth: 2 })
    ]
  },
  {
    key: 'diamond',
    label: '菱形',
    color: '#ff9fe8',
    rings: [
      presetRing({ shape: 'diamond', width: 76, height: 76, lineWidth: 2 }, { enabled: true, rotateEnabled: true, rotateDuration: 11 }),
      presetRing({ shape: 'diamond', width: 40, height: 40, lineStyle: 'dashed', lineWidth: 2 }, { enabled: true, rotateEnabled: true, rotateDuration: 6, direction: 'reverse' }),
      presetRing({ shape: 'diamond', width: 52, height: 13, splitCount: 4, equalizeSegments: true, layout: 'arc', evenSpacing: true, arcRadius: 51, arcOrientation: 'fixed', fillEnabled: true, fillOpacity: 90 }),
      presetRing({ shape: 'diamond', width: 10, height: 10, fillEnabled: true, fillColor: '#fff5fc', fillOpacity: 100 })
    ]
  },
  {
    key: 'radar',
    label: 'レーダー',
    color: '#6ee8ff',
    rings: [
      presetRing({ shape: 'circle', width: 86, height: 86, lineStyle: 'dashed' }),
      presetRing({ shape: 'circle', width: 47, height: 47, opacity: 72 }),
      presetRing({ shape: 'cross', width: 86, height: 86, lineWidth: 1, opacity: 42 }),
      presetRing({ shape: 'line', width: 39, height: 10, offsetX: 19, lineWidth: 2 }, { enabled: true, rotateEnabled: true, rotateDuration: 3.8 }),
      presetRing({ shape: 'circle', width: 7, height: 7, fillEnabled: true, fillOpacity: 100 })
    ]
  },
  {
    key: 'rift',
    label: '裂け目',
    color: '#b592ff',
    rings: [
      presetRing({ shape: 'diamond', width: 84, height: 84, lineWidth: 3 }, { enabled: true, pulseEnabled: true, pulseDuration: 2.8, pulseAmount: 11 }),
      presetRing({ shape: 'diamond', width: 49, height: 49, angle: 22, lineStyle: 'dashed' }, { enabled: true, rotateEnabled: true, rotateDuration: 8, direction: 'reverse' }),
      presetRing({ shape: 'triangle', width: 54, height: 18, splitCount: 4, equalizeSegments: true, layout: 'arc', evenSpacing: true, arcRadius: 58, arcOrientation: 'radial', fillEnabled: true, fillOpacity: 82 }),
      presetRing({ shape: 'diamond', width: 14, height: 14, fillEnabled: true, fillOpacity: 80 })
    ]
  }
]

const addRing = () => {
  if (draft.value.rings.length >= MAX_RINGS) return
  const ring = makeRing(draft.value.rings.length + 1)
  draft.value.rings.splice(selectedRingIndex.value + 1, 0, ring)
  selectRing(ring.id)
}
const duplicateRingById = ringId => {
  if (draft.value.rings.length >= MAX_RINGS) return
  const index = draft.value.rings.findIndex(ring => ring.id === ringId)
  if (index < 0) return
  const ring = {
    ...cloneRing(draft.value.rings[index]),
    id: `ring-${Date.now()}-copy`
  }
  draft.value.rings.splice(index + 1, 0, ring)
  selectRing(ring.id)
}
const duplicateSelectedRing = () => duplicateRingById(selectedRingId.value)
const moveSelectedRing = direction => {
  const from = selectedRingIndex.value
  const to = from + direction
  if (to < 0 || to >= draft.value.rings.length) return
  const [ring] = draft.value.rings.splice(from, 1)
  draft.value.rings.splice(to, 0, ring)
}
const removeRingById = ringId => {
  if (draft.value.rings.length <= 1) return
  const index = draft.value.rings.findIndex(ring => ring.id === ringId)
  if (index < 0) return
  draft.value.rings.splice(index, 1)
  selectedRingId.value = draft.value.rings[Math.max(0, index - 1)].id
}
const requestRingDelete = ringId => {
  if (draft.value.rings.length <= 1) return
  const index = draft.value.rings.findIndex(ring => ring.id === ringId)
  if (index < 0) return
  deleteConfirmation.value = {
    kind: 'ring',
    id: ringId,
    name: getRingName(draft.value.rings[index], index)
  }
}
const requestSelectedRingDelete = () => requestRingDelete(selectedRingId.value)
const duplicateContextLayer = () => {
  duplicateRingById(layerContextRingId.value)
  closeLayerContextMenu()
}
const requestContextLayerDelete = () => {
  requestRingDelete(layerContextRingId.value)
  closeLayerContextMenu()
}
const cancelDeleteConfirmation = () => {
  deleteConfirmation.value = null
}
const confirmDelete = () => {
  const pendingDelete = deleteConfirmation.value
  if (!pendingDelete) return
  deleteConfirmation.value = null
  if (pendingDelete.kind === 'library') {
    deleteSavedMarker(pendingDelete.id)
    return
  }
  removeRingById(pendingDelete.id)
}

const materializePresetRing = (preset, index, color) => {
  const idleAppearance = makeRingAppearance({
    color,
    glowColor: color,
    fillColor: color,
    renderMode: preset.appearance.renderMode || (preset.appearance.layout === 'arc' ? 'circumference' : 'continuous'),
    ...preset.appearance
  })
  idleAppearance.segmentColors = [...(preset.appearance.segmentColors || idleAppearance.segmentColors)]
  idleAppearance.segmentLabels = [...(preset.appearance.segmentLabels || idleAppearance.segmentLabels)]
  const movingAppearance = makeRingAppearance({
    ...idleAppearance,
    ...preset.movingAppearance
  })
  movingAppearance.segmentColors = [...(preset.movingAppearance.segmentColors || idleAppearance.segmentColors)]
  movingAppearance.segmentLabels = [...(preset.movingAppearance.segmentLabels || idleAppearance.segmentLabels)]
  return {
    id: `preset-${Date.now()}-${index}`,
    transformTiming: makeRingTransformTiming(),
    appearance: {
      idle: idleAppearance,
      moving: movingAppearance,
      transform: {
        ...idleAppearance,
        segmentColors: [...idleAppearance.segmentColors],
        segmentLabels: [...idleAppearance.segmentLabels]
      }
    },
    motion: {
      idle: staticMotion(preset.motion),
      moving: staticMotion({ ...preset.motion, ...preset.movingMotion }),
      transform: staticMotion(preset.motion)
    }
  }
}
const applyExistingMarkerPreset = preset => {
  if (preset.settings) {
    draft.value = createDraftFromSettings(cloneMarkerSettings(preset.settings))
    selectedRingId.value = draft.value.rings[0].id
    appliedPresetKey.value = preset.key
    loadedMarkerName.value = preset.label
    libraryName.value = preset.label
    pendingOverallShape.value = null
    previewPosition.value = { x: 50, y: 50 }
    selectEditingState('idle')
    selectRing(selectedRingId.value)
    return
  }
  const overall = makeOverallAppearance({
    shape: 'circle',
    size: preset.size || 100,
    opacity: 100,
    showCenterDot: false
  })
  const rings = preset.rings.map((ring, index) => materializePresetRing(ring, index, preset.color))
  draft.value = {
    ...DEFAULT_SETTINGS,
    color: preset.color,
    size: overall.size,
    opacity: overall.opacity,
    showCenterDot: false,
    appearance: {
      idle: { ...overall },
      moving: { ...overall },
      transform: { ...overall }
    },
    wholeMotion: {
      idle: { ...DEFAULT_SETTINGS.wholeMotion.idle },
      moving: { ...DEFAULT_SETTINGS.wholeMotion.moving },
      transform: { ...DEFAULT_SETTINGS.wholeMotion.transform }
    },
    transition: { ...DEFAULT_SETTINGS.transition },
    behavior: { ...DEFAULT_SETTINGS.behavior, ...(preset.behavior || {}) },
    rings
  }
  appliedPresetKey.value = preset.key
  loadedMarkerName.value = preset.label
  libraryName.value = preset.label
  selectRing(rings[0].id)
  selectEditingState('idle')
}

const reset = () => {
  draft.value = {
    ...DEFAULT_SETTINGS,
    appearance: {
      idle: { ...DEFAULT_SETTINGS.appearance.idle },
      moving: { ...DEFAULT_SETTINGS.appearance.moving },
      transform: { ...DEFAULT_SETTINGS.appearance.transform }
    },
    wholeMotion: {
      idle: { ...DEFAULT_SETTINGS.wholeMotion.idle },
      moving: { ...DEFAULT_SETTINGS.wholeMotion.moving },
      transform: { ...DEFAULT_SETTINGS.wholeMotion.transform }
    },
    transition: { ...DEFAULT_SETTINGS.transition },
    behavior: { ...DEFAULT_SETTINGS.behavior },
    rings: DEFAULT_SETTINGS.rings.map(cloneRing)
  }
  selectedRingId.value = draft.value.rings[0].id
  appliedPresetKey.value = null
  pendingOverallShape.value = null
  previewCursorFollowActive.value = false
  previewFullscreen.value = false
  loadedMarkerName.value = ''
  libraryName.value = ''
  selectEditingState('idle')
}

const selectEditingState = state => {
  if (!EDITING_STATE_OPTIONS.some(option => option.key === state)) return
  editingState.value = state
  if (copyDestinationState.value === state) {
    copyDestinationState.value = EDITING_STATE_OPTIONS.find(option => option.key !== state)?.key || 'idle'
  }
  // 編集中は対象状態の形状を固定表示し、位置移動はプレビュークリック時だけ行う。
  previewMoving.value = state === 'moving'
}
const setTransformMode = mode => {
  const normalizedMode = ['reverse', 'reset'].includes(mode) ? mode : 'none'
  draft.value.transition.transformMode = normalizedMode
  const enabled = normalizedMode !== 'none'
  draft.value.wholeMotion.transform.enabled = enabled
  draft.value.rings.forEach(ring => {
    if (ring.transformTiming.useGlobal) ring.motion.transform.enabled = enabled
  })
}
const setRingTransformMode = mode => {
  const normalizedMode = ['reverse', 'reset'].includes(mode) ? mode : 'none'
  selectedRingTransformTiming.value.transformMode = normalizedMode
  selectedRing.value.motion.transform.enabled = normalizedMode !== 'none'
}
const onRingTransformTimingScopeChange = () => {
  const mode = selectedRingTransformTiming.value.useGlobal
    ? draft.value.transition.transformMode
    : selectedRingTransformTiming.value.transformMode
  selectedRing.value.motion.transform.enabled = mode !== 'none'
}
const copyEditingStateTo = destination => {
  const source = editingState.value
  if (source === destination || !EDITING_STATE_OPTIONS.some(option => option.key === destination)) return
  draft.value.appearance[destination] = { ...draft.value.appearance[source] }
  draft.value.wholeMotion[destination] = {
    ...draft.value.wholeMotion[source],
    ...(destination === 'transform'
      ? { enabled: ['reverse', 'reset'].includes(draft.value.transition.transformMode) }
      : {})
  }
  draft.value.rings.forEach(ring => {
    ring.appearance[destination] = {
      ...ring.appearance[source],
      segmentColors: [...ring.appearance[source].segmentColors],
      segmentLabels: [...ring.appearance[source].segmentLabels]
    }
    ring.motion[destination] = {
      ...ring.motion[source],
      ...(destination === 'transform'
        ? {
            enabled: ring.transformTiming.useGlobal
              ? ['reverse', 'reset'].includes(draft.value.transition.transformMode)
              : ['reverse', 'reset'].includes(ring.transformTiming.transformMode)
          }
        : {})
    }
  })
}

const schedulePreviewStep = (callback, duration, token) => {
  if (previewMoveTimer) clearTimeout(previewMoveTimer)
  previewMoveTimer = setTimeout(() => {
    if (token !== previewMoveToken) return
    previewMoveTimer = null
    callback()
  }, duration)
}
const runPreviewMove = position => {
  previewMoveToken += 1
  const token = previewMoveToken
  if (previewMoveTimer) clearTimeout(previewMoveTimer)
  const transition = draft.value.transition
  const sequence = ['before', 'simultaneous', 'after'].includes(transition.sequence)
    ? transition.sequence
    : 'before'
  const morphInDuration = Math.max(0, Number(transition.morphInDuration) || 0)
  const moveDuration = Math.max(100, Number(transition.moveDuration) || 350)
  const morphOutDuration = Math.max(0, Number(transition.morphOutDuration) || 0)
  const restore = () => {
    previewMoving.value = editingState.value === 'moving'
    schedulePreviewStep(() => {}, morphOutDuration, token)
  }
  const move = () => {
    previewPosition.value = position
    schedulePreviewStep(restore, moveDuration, token)
  }

  if (sequence === 'simultaneous') {
    previewMoving.value = true
    move()
    return
  }
  if (sequence === 'after') {
    previewMoving.value = false
    previewPosition.value = position
    schedulePreviewStep(() => {
      previewMoving.value = true
      schedulePreviewStep(restore, morphInDuration, token)
    }, moveDuration, token)
    return
  }

  previewMoving.value = true
  schedulePreviewStep(move, morphInDuration, token)
}
const movePreviewToPointer = event => {
  if (draft.value.behavior.followCursor) {
    previewCursorFollowActive.value = !previewCursorFollowActive.value
    if (previewCursorFollowActive.value) {
      movePreviewWithCursor(event)
    } else {
      endPreviewCursorFollow()
    }
    return
  }
  const rect = event.currentTarget.getBoundingClientRect()
  const x = Math.min(92, Math.max(8, (event.clientX - rect.left) / rect.width * 100))
  const y = Math.min(88, Math.max(12, (event.clientY - rect.top) / rect.height * 100))
  runPreviewMove({ x, y })
}
const endPreviewCursorFollow = () => {
  if (previewCursorAnimationFrame != null) cancelAnimationFrame(previewCursorAnimationFrame)
  previewCursorAnimationFrame = null
  previewCursorLastFrame = null
  previewCursorTarget = { ...previewPosition.value }
  previewMoving.value = editingState.value === 'moving'
}
const animatePreviewCursor = timestamp => {
  if (!draft.value.behavior.followCursor || !previewCursorFollowActive.value) {
    endPreviewCursorFollow()
    return
  }
  if (previewCursorLastFrame == null) previewCursorLastFrame = timestamp
  const elapsed = Math.min(50, Math.max(0, timestamp - previewCursorLastFrame))
  previewCursorLastFrame = timestamp
  const dx = previewCursorTarget.x - previewPosition.value.x
  const dy = previewCursorTarget.y - previewPosition.value.y
  const distance = Math.hypot(dx, dy)
  if (distance <= 0.05) {
    previewPosition.value = { ...previewCursorTarget }
    previewCursorAnimationFrame = null
    previewCursorLastFrame = null
    previewMoving.value = editingState.value === 'moving'
    return
  }
  const speed = Math.min(300, Math.max(10, Number(draft.value.behavior.cursorFollowSpeed) || 90))
  const movement = Math.min(distance, speed * elapsed / 1000)
  const ratio = movement / distance
  previewPosition.value = {
    x: previewPosition.value.x + dx * ratio,
    y: previewPosition.value.y + dy * ratio
  }
  previewMoving.value = true
  previewCursorAnimationFrame = requestAnimationFrame(animatePreviewCursor)
}
const startPreviewCursorMovement = () => {
  if (previewCursorAnimationFrame != null) return
  previewCursorLastFrame = null
  previewCursorAnimationFrame = requestAnimationFrame(animatePreviewCursor)
}
const movePreviewWithCursor = event => {
  if (!draft.value.behavior.followCursor || !previewCursorFollowActive.value) return
  const rect = event.currentTarget.getBoundingClientRect()
  previewCursorTarget = {
    x: Math.min(92, Math.max(8, (event.clientX - rect.left) / rect.width * 100)),
    y: Math.min(88, Math.max(12, (event.clientY - rect.top) / rect.height * 100))
  }
  startPreviewCursorMovement()
}
const onFollowCursorSettingChange = () => {
  if (draft.value.behavior.followCursor) return
  previewCursorFollowActive.value = false
  endPreviewCursorFollow()
}
const movePreviewToCenter = () => {
  if (draft.value.behavior.followCursor && previewCursorFollowActive.value) {
    previewCursorTarget = { x: 50, y: 50 }
    startPreviewCursorMovement()
    return
  }
  runPreviewMove({ x: 50, y: 50 })
}

const save = () => {
  emit('save', {
    ...draft.value,
    name: loadedMarkerName.value.trim() || libraryName.value.trim() || '新規マーカー'
  })
}
</script>

<style scoped>
.custom-marker-modal {
  box-sizing: border-box;
  position: relative;
  display: grid;
  grid-template-rows: auto 360px 1fr auto;
  gap: 16px;
  width: 720px;
  height: 1280px;
  padding: 18px;
  color: #d7f7ff;
  font-family: Consolas, monospace;
  font-size: 20px;
  scrollbar-color: #55dff5 rgba(3, 18, 28, 0.92);
  scrollbar-width: thin;
}

.custom-marker-modal.preview-fullscreen-mode {
  grid-template-rows: 1fr;
  gap: 0;
  width: 100%;
  height: 100%;
  padding: 0;
}
.preview-fullscreen-mode > .modal-header,
.preview-fullscreen-mode > .editor-layout,
.preview-fullscreen-mode > .modal-footer,
.preview-fullscreen-mode .preview-label,
.preview-fullscreen-mode .preview-controls {
  display: none;
}
.preview-fullscreen-mode .marker-preview {
  width: 100%;
  height: 100%;
  border: 0;
}

.custom-marker-modal button,
.custom-marker-modal input,
.custom-marker-modal select,
.custom-marker-modal output,
.custom-marker-modal code {
  font-family: inherit;
  font-size: inherit;
}

.custom-marker-modal *::-webkit-scrollbar {
  width: 10px;
  height: 9px;
}

.custom-marker-modal *::-webkit-scrollbar-track {
  border: 1px solid rgba(78, 199, 225, 0.22);
  background:
    repeating-linear-gradient(90deg, rgba(67, 204, 232, 0.08) 0 1px, transparent 1px 6px),
    rgba(2, 14, 23, 0.94);
  box-shadow: inset 0 0 7px rgba(22, 122, 148, 0.28);
}

.custom-marker-modal *::-webkit-scrollbar-thumb {
  border: 2px solid rgba(2, 17, 27, 0.95);
  border-radius: 1px;
  background: linear-gradient(90deg, #238ca8, #76efff 48%, #238ca8);
  box-shadow: 0 0 7px rgba(93, 229, 255, 0.72);
}

.custom-marker-modal *::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(90deg, #39b5d0, #c5faff 48%, #39b5d0);
}

.custom-marker-modal *::-webkit-scrollbar-corner {
  background: #03131d;
}

.modal-header,
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.mobile-history-actions,
.desktop-history-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.mobile-history-actions button,
.desktop-history-actions button {
  white-space: nowrap;
}
.mobile-history-actions button:disabled,
.desktop-history-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.35;
}
.mobile-menu-trigger,
.mobile-layer-trigger,
.mobile-setting-list,
.mobile-panel-overlay {
  display: none;
}

.modal-kicker {
  color: #71dff4;
  font-size: 20px;
  letter-spacing: 0.18em;
}

h2,
h3,
p { margin: 0; }
h2 { font-size: 28px; letter-spacing: 0.12em; }
h3 { font-size: 22px; letter-spacing: 0.08em; }
p { margin-top: 8px; color: rgba(200, 240, 250, 0.72); font-size: 20px; line-height: 1.45; }

.close-button,
.secondary-button,
.save-button,
.setting-list button,
.choice-grid button {
  border: 1px solid rgba(126, 224, 245, 0.5);
  background: rgba(8, 28, 40, 0.88);
  color: #d7f7ff;
  cursor: pointer;
}

.close-button,
.secondary-button,
.save-button { padding: 7px 12px; }
.close-button { width: auto; flex: 0 0 auto; }
.save-button { border-color: #aef6ff; background: rgba(30, 97, 115, 0.95); }

.marker-preview {
  position: relative;
  display: grid;
  place-items: center;
  contain: layout paint;
  height: 360px;
  overflow: hidden;
  border: 1px solid rgba(116, 220, 245, 0.3);
  background-color: var(--preview-background, #071722);
  background-image: radial-gradient(circle at center, rgba(80, 180, 210, 0.28), transparent 72%);
  cursor: crosshair;
}

.preview-label {
  position: absolute;
  top: 10px;
  left: 12px;
  color: rgba(180, 240, 250, 0.66);
  font-size: 20px;
  letter-spacing: 0.14em;
}
.fullscreen-return-hint {
  position: absolute;
  top: 18px;
  left: 50%;
  z-index: 4;
  padding: 8px 14px;
  border: 1px solid rgba(142, 238, 255, 0.45);
  background: rgba(3, 18, 28, 0.82);
  color: rgba(215, 247, 255, 0.84);
  letter-spacing: 0.08em;
  translate: -50% 0;
  pointer-events: none;
  animation: fullscreenHintFade 3s ease-out forwards;
}

.preview-controls {
  position: absolute;
  top: 10px;
  right: 12px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 6px;
}
.preview-controls > span {
  padding: 6px 10px;
  color: #9fefff;
  background: rgba(4, 22, 33, 0.78);
}
.preview-controls > span.tracking {
  color: #fff5bb;
  border: 1px solid rgba(255, 228, 123, 0.58);
  box-shadow: 0 0 8px rgba(255, 222, 108, 0.3);
}
.preview-controls button {
  width: auto;
  padding: 6px 12px;
  border: 1px solid rgba(126, 224, 245, 0.42);
  background: rgba(4, 22, 33, 0.86);
  color: rgba(215, 247, 255, 0.72);
  cursor: pointer;
}
.preview-controls button:hover {
  border-color: #bdf7ff;
  background: rgba(34, 112, 134, 0.94);
  color: #fff;
  box-shadow: 0 0 8px rgba(89, 220, 250, 0.35);
}
.preview-target {
  position: absolute;
  z-index: 1;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.editor-layout {
  display: grid;
  grid-template-columns: 156px minmax(0, 1fr);
  grid-template-rows: auto auto minmax(0, 1fr);
  min-height: 0;
  border: 1px solid rgba(116, 220, 245, 0.3);
}

.editor-state-tabs {
  display: flex;
  flex-wrap: wrap;
  grid-column: 1 / -1;
  align-items: center;
  gap: 8px;
  padding: 9px 10px;
  border-bottom: 1px solid rgba(116, 220, 245, 0.3);
  background: rgba(4, 20, 30, 0.96);
}
.editor-state-tabs > span {
  margin-right: auto;
  color: rgba(158, 239, 255, 0.68);
  letter-spacing: 0.1em;
}
.editor-state-tabs button {
  width: auto;
  min-width: 88px;
  padding: 8px 10px;
  border: 1px solid rgba(126, 224, 245, 0.42);
  background: rgba(5, 23, 34, 0.8);
  color: rgba(215, 247, 255, 0.72);
  cursor: pointer;
}
.editor-state-tabs button.active {
  border-color: #bdf7ff;
  background: rgba(34, 112, 134, 0.94);
  color: #fff;
  box-shadow: 0 0 8px rgba(89, 220, 250, 0.35);
}
.editor-state-tabs .state-copy-button {
  min-width: 72px;
  white-space: nowrap;
  color: #ffe9a6;
  border-color: rgba(255, 222, 130, 0.5);
}
.editor-state-tabs .desktop-history-actions button {
  min-width: 82px;
}
.state-copy-select {
  min-width: 112px;
  padding: 8px 10px;
  border: 1px solid rgba(255, 222, 130, 0.5);
  background: rgba(5, 23, 34, 0.9);
  color: #ffe9a6;
}
.transform-mode-control {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  color: #bdf7ff;
  white-space: nowrap;
}
.transform-mode-control select {
  min-width: 190px;
  padding: 8px 10px;
  border: 1px solid rgba(126, 224, 245, 0.5);
  background: rgba(5, 23, 34, 0.9);
  color: #e3fbff;
}
.transform-transition-settings {
  display: grid;
  gap: 8px;
  margin: 10px 0 14px;
  padding: 10px;
  border: 1px solid rgba(255, 222, 130, 0.35);
  background: rgba(35, 31, 12, 0.2);
}
.transform-transition-settings h4 {
  margin: 0;
  color: #ffe9a6;
}

.ring-tabs {
  display: flex;
  grid-column: 1;
  grid-row: 2 / 4;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  min-width: 0;
  min-height: 0;
  padding: 10px;
  border-right: 1px solid rgba(116, 220, 245, 0.3);
  background: rgba(2, 12, 21, 0.92);
}

.ring-tabs-label {
  flex: 0 0 auto;
  color: rgba(158, 239, 255, 0.68);
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.ring-tabs-header {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
  min-width: 0;
  min-height: 32px;
}

.ring-tabs-list {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  gap: 4px;
  overflow-x: hidden;
  overflow-y: auto;
}

.ring-tabs-list button {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
  justify-content: flex-start;
  min-width: 0;
  width: 100%;
  padding: 9px 10px;
  border: 1px solid rgba(126, 224, 245, 0.28);
  border-radius: 4px;
  background: rgba(8, 28, 40, 0.72);
  color: rgba(215, 247, 255, 0.68);
  cursor: pointer;
}

.ring-tabs-list button.active {
  border-color: #bdf7ff;
  background: rgba(34, 112, 134, 0.96);
  color: #fff;
  box-shadow: 0 0 10px rgba(89, 220, 250, 0.3);
}

.ring-tabs-list button.hidden { opacity: 0.48; }
.ring-tabs-list button.active.hidden { opacity: 0.78; }
.ring-tabs .ring-tab-add {
  flex: 0 0 32px;
  margin-left: auto;
  width: 32px;
  height: 30px;
  padding: 0;
  border: 1px solid rgba(126, 224, 245, 0.5);
  border-radius: 4px;
  background: rgba(8, 28, 40, 0.88);
  color: #8defff;
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  box-shadow: inset 0 0 8px rgba(89, 220, 250, 0.12);
}
.ring-tabs .ring-tab-add:hover:not(:disabled) {
  border-color: #bdf7ff;
  background: rgba(34, 112, 134, 0.72);
  color: #fff;
}
.ring-tabs .ring-tab-add:disabled {
  cursor: not-allowed;
  opacity: 0.35;
}
.ring-tab-color {
  width: 9px;
  height: 9px;
  flex: 0 0 auto;
  border: 1px solid rgba(255, 255, 255, 0.75);
  border-radius: 50%;
  box-shadow: 0 0 5px currentColor;
}

.setting-list {
  display: grid;
  grid-column: 2;
  grid-row: 2;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 4px;
  min-width: 0;
  padding: 8px;
  border-bottom: 1px solid rgba(116, 220, 245, 0.22);
  background: rgba(3, 14, 24, 0.65);
}

.setting-list button {
  min-width: 0;
  padding: 8px 4px;
  border-color: rgba(126, 224, 245, 0.24);
  background: rgba(5, 23, 34, 0.74);
  color: rgba(215, 247, 255, 0.72);
  font-weight: 700;
  text-align: center;
  white-space: nowrap;
}
.setting-list button.active {
  border-color: #c4faff;
  background: rgba(34, 112, 134, 0.9);
  color: #fff;
  box-shadow: inset 0 3px 0 #8fefff, 0 0 9px rgba(89, 220, 250, 0.32);
}
.choice-grid button.active {
  border-color: #c4faff;
  background: rgba(34, 112, 134, 0.9);
  box-shadow: 0 0 9px rgba(89, 220, 250, 0.32);
}

.setting-content {
  grid-column: 2;
  grid-row: 3;
  min-width: 0;
  padding: 16px;
  overflow-y: auto;
  contain: layout paint;
}
.render-mode-select {
  margin-top: 0;
}
.render-mode-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 16px;
}
.render-mode-grid button {
  min-height: 48px;
  padding: 8px 10px;
  border: 1px solid rgba(126, 224, 245, 0.42);
  background: rgba(8, 28, 40, 0.88);
  color: #d7f7ff;
  cursor: pointer;
}
.ring-advanced-settings {
  margin-top: 14px;
  padding: 10px;
  border: 1px solid rgba(126, 224, 245, 0.34);
  background: rgba(5, 22, 34, 0.58);
}
.ring-advanced-settings summary {
  color: #bdf7ff;
  font-weight: 700;
  cursor: pointer;
}
.ring-advanced-settings > p {
  margin: 9px 0 12px;
  color: rgba(205, 238, 247, 0.68);
  font-size: 12px;
  line-height: 1.5;
}
.advanced-toggle-pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin: 10px 0;
}
.render-mode-grid button.active {
  border-color: #c4faff;
  background: rgba(34, 112, 134, 0.9);
  box-shadow: 0 0 9px rgba(89, 220, 250, 0.32);
}
.render-mode-description {
  min-height: 58px;
  padding: 8px 10px;
  border-bottom: 1px solid rgba(126, 224, 245, 0.22);
}
.danger-settings {
  margin-top: 18px;
  padding: 12px;
  border: 1px solid rgba(255, 174, 112, 0.4);
  background: rgba(62, 25, 14, 0.24);
}
.danger-settings summary {
  color: #ffd09b;
  font-weight: 700;
  cursor: pointer;
}
.shape-confirmation {
  margin-top: 14px;
  padding: 12px;
  border: 1px solid rgba(255, 210, 122, 0.55);
  background: rgba(91, 53, 12, 0.46);
  color: #fff0bd;
}
.shape-confirmation > div {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
.shape-confirmation button {
  width: auto;
  padding: 7px 12px;
  border: 1px solid rgba(255, 220, 142, 0.6);
  background: rgba(52, 28, 9, 0.9);
  color: #fff2c9;
  cursor: pointer;
}
.setting-note {
  margin-top: 18px;
  padding: 10px 12px;
  border-left: 3px solid #71dff4;
  background: rgba(20, 67, 82, 0.32);
  color: rgba(215, 247, 255, 0.82);
}
.preview-fullscreen-button {
  width: 100%;
  margin-top: 18px;
  padding: 12px;
  border: 1px solid rgba(126, 224, 245, 0.55);
  background: rgba(21, 78, 94, 0.72);
  color: #e2faff;
  cursor: pointer;
}
.preview-fullscreen-button:hover {
  border-color: #c4faff;
  background: rgba(34, 112, 134, 0.9);
}
.preset-notice {
  margin-top: 16px;
  padding: 10px 12px;
  border-left: 3px solid #f0c96b;
  background: rgba(101, 74, 20, 0.24);
  color: #ffe6a3;
}
.existing-preset-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 18px;
}
.existing-preset-grid button {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 52px;
  padding: 10px 14px;
  border: 1px solid rgba(126, 224, 245, 0.42);
  background: rgba(8, 28, 40, 0.88);
  color: #d7f7ff;
  text-align: left;
  cursor: pointer;
}
.existing-preset-grid button:hover,
.existing-preset-grid button.active {
  border-color: #c4faff;
  background: rgba(34, 112, 134, 0.9);
  box-shadow: 0 0 9px rgba(89, 220, 250, 0.32);
}
.library-name-row {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  margin-top: 18px;
  font-size: 20px;
}
.library-storage-status {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 12px;
}
.library-storage-status span {
  display: grid;
  gap: 3px;
  padding: 8px 10px;
  border: 1px solid rgba(126, 224, 245, 0.3);
  background: rgba(5, 24, 35, 0.72);
  color: rgba(201, 248, 255, 0.68);
  font-size: 16px;
}
.library-storage-status strong { color: #e8fb9b; font-size: 20px; }
.library-name-row input {
  min-width: 0;
  border: 1px solid rgba(126, 224, 245, 0.5);
  background: rgba(4, 19, 29, 0.92);
  color: #e3fbff;
  padding: 8px 10px;
}
.library-toolbar {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 14px;
}
.library-toolbar button,
.library-marker-actions button,
.library-marker-summary {
  border: 1px solid rgba(126, 224, 245, 0.48);
  background: rgba(8, 28, 40, 0.88);
  color: #d7f7ff;
  cursor: pointer;
}
.library-toolbar button { padding: 9px 10px; }
.library-toolbar button:disabled { cursor: not-allowed; opacity: 0.4; }
.image-export-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 10px;
  margin-top: 12px;
  padding: 10px;
  border: 1px solid rgba(126, 224, 245, 0.32);
  background: rgba(8, 28, 40, 0.58);
}
.image-export-panel label {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  min-width: 0;
  color: #c9f8ff;
}
.image-export-panel select {
  min-width: 0;
  border: 1px solid rgba(126, 224, 245, 0.5);
  background: rgba(4, 19, 29, 0.92);
  color: #e3fbff;
  padding: 8px 10px;
}
.image-export-button {
  min-height: 38px;
  padding: 8px 14px;
  border: 1px solid #6de8ff;
  background: rgba(25, 92, 111, 0.88);
  color: #fff;
  cursor: pointer;
}
.image-export-button:disabled { cursor: wait; opacity: 0.6; }
.marker-settings-file-input { display: none; }
.library-export-note {
  margin: 10px 0 0;
  color: rgba(201, 248, 255, 0.72);
  font-size: 18px;
  line-height: 1.45;
}
.library-notice,
.library-empty {
  margin-top: 14px;
  padding: 10px 12px;
  border-left: 3px solid #71dff4;
  background: rgba(20, 67, 82, 0.32);
  color: #c9f8ff;
  font-size: 20px;
  line-height: 1.4;
}
.library-empty { color: rgba(200, 240, 250, 0.62); }
.marker-library-list {
  display: grid;
  gap: 8px;
  margin-top: 14px;
}
.marker-library-list article {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  padding: 7px;
  border: 1px solid rgba(126, 224, 245, 0.24);
  background: rgba(4, 18, 28, 0.72);
}
.marker-library-list article.active {
  border-color: #9ef2ff;
  box-shadow: inset 3px 0 #71dff4, 0 0 8px rgba(89, 220, 250, 0.24);
}
.library-marker-summary {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 9px;
  min-width: 0;
  padding: 8px 10px;
  text-align: left;
}
.library-marker-color {
  width: 14px;
  height: 14px;
  border: 1px solid #e7fcff;
  border-radius: 50%;
  box-shadow: 0 0 7px currentColor;
}
.library-marker-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.library-marker-meta { color: #8ddfed; font-size: 20px; white-space: nowrap; }
.library-marker-actions { display: flex; align-items: stretch; gap: 5px; }
.library-marker-actions button { padding: 7px 9px; }
.library-marker-actions .library-delete-button { border-color: rgba(255, 146, 146, 0.55); color: #ffb7b7; }
.preset-color {
  width: 13px;
  height: 13px;
  flex: 0 0 13px;
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-radius: 50%;
  box-shadow: 0 0 8px currentColor;
}
.section-heading { display: flex; align-items: start; justify-content: space-between; gap: 16px; }
.ring-action-buttons { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; }
.ring-action-buttons button {
  width: auto;
  padding: 6px 9px;
  border: 1px solid rgba(126, 224, 245, 0.5);
  background: rgba(8, 28, 40, 0.88);
  color: #d7f7ff;
  cursor: pointer;
}
.ring-action-buttons button:disabled { cursor: not-allowed; opacity: 0.38; }
.segment-color-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-top: 14px;
}
.segment-color-grid label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 5px;
  padding: 6px;
  border: 1px solid rgba(126, 224, 245, 0.28);
  background: rgba(5, 23, 34, 0.72);
}
.segment-color-grid input[type='color'] {
  width: 34px;
  height: 28px;
  padding: 0;
  border: 0;
}
.text-setting-row {
  grid-template-columns: 132px minmax(0, 1fr) auto;
}
.font-picker-row { align-items: stretch; }
.font-picker-trigger {
  display: grid;
  grid-column: 2 / 4;
  grid-template-columns: minmax(120px, auto) minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  min-width: 0;
  min-height: 52px;
  padding: 6px 10px;
  border: 1px solid rgba(126, 224, 245, .5);
  background: rgba(8, 28, 40, .9);
  color: #d7f7ff;
  text-align: left;
}
.font-picker-trigger strong {
  overflow: hidden;
  color: #fff0a8;
  font-size: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.font-picker-trigger > span {
  overflow: hidden;
  color: #e9fdff;
  font-size: 20px;
  text-align: center;
  text-overflow: ellipsis;
  text-shadow: 0 0 8px rgba(95, 229, 255, .6);
  white-space: nowrap;
}
.text-value-input,
.segment-label-grid input[type='text'] {
  min-width: 0;
  border: 1px solid rgba(126, 224, 245, 0.42);
  background: rgba(4, 19, 29, 0.92);
  color: #e3fbff;
  padding: 7px 9px;
}
.segment-label-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin: 14px 0;
}
.segment-label-grid label {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 6px;
  padding: 6px;
  border: 1px solid rgba(126, 224, 245, 0.28);
  background: rgba(5, 23, 34, 0.72);
}
.add-ring-button,
.remove-ring-button {
  border: 1px solid rgba(126, 224, 245, 0.5);
  background: rgba(8, 28, 40, 0.88);
  color: #d7f7ff;
  cursor: pointer;
}
.add-ring-button { padding: 7px 10px; white-space: nowrap; }
.add-ring-button,
.remove-ring-button { width: auto; }
.remove-ring-button { margin-top: 18px; padding: 7px 10px; color: #ffb7b7; border-color: rgba(255, 146, 146, 0.55); }
.remove-ring-button:disabled { cursor: not-allowed; opacity: 0.4; }
.choice-grid { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 15px; }
.choice-grid button { width: auto; min-width: 70px; padding: 8px 12px; }

.setting-row {
  display: grid;
  grid-template-columns: 130px 1fr auto;
  gap: 10px;
  align-items: center;
  margin-top: 18px;
  font-size: 20px;
}

.setting-row input[type='range'] { width: 100%; }
.setting-row output { min-width: 42px; text-align: right; color: #9fefff; }
.color-row input[type='color'] { width: 40px; height: 28px; padding: 0; border: 0; background: transparent; }
.color-row code { color: #9fefff; font-family: inherit; }
.setting-row input[type='color'] { width: 40px; height: 28px; padding: 0; border: 0; background: transparent; }
.setting-row code { color: #9fefff; font-family: inherit; }
.select-row select { grid-column: 2 / 4; min-height: 30px; border: 1px solid rgba(126, 224, 245, 0.5); background: #081c28; color: #d7f7ff; }
.select-row select:disabled,
.setting-row input:disabled,
.toggle-row input:disabled { opacity: 0.45; cursor: not-allowed; }

.toggle-row { display: flex; gap: 9px; align-items: center; margin-top: 18px; font-size: 20px; }
.toggle-row input[type='checkbox'] { width: 20px; height: 20px; flex: 0 0 20px; }
.text-quick-settings {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(90px, auto);
  gap: 10px;
  align-items: stretch;
  margin-top: 14px;
}
.text-quick-settings > label {
  min-width: 0;
  min-height: 48px;
  padding: 7px 9px;
  border: 1px solid rgba(126, 224, 245, 0.28);
  background: rgba(5, 23, 34, 0.72);
  box-sizing: border-box;
}
.text-quick-color {
  display: grid;
  grid-template-columns: auto 38px minmax(0, 1fr);
  gap: 7px;
  align-items: center;
}
.text-quick-color input[type='color'] {
  width: 38px;
  height: 30px;
  padding: 0;
  border: 0;
  background: transparent;
}
.text-quick-color code {
  overflow: hidden;
  color: #9fefff;
  font-family: inherit;
  font-size: 13px;
  text-overflow: ellipsis;
}
.text-quick-settings .text-quick-size {
  grid-column: 1 / -1;
  grid-template-columns: auto minmax(80px, 1fr) auto;
  gap: 7px;
  margin-top: 0;
  font-size: 16px;
}
.text-quick-settings .text-quick-size output { min-width: 48px; }
.text-quick-bold {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  white-space: nowrap;
}
.text-quick-bold input[type='checkbox'] {
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
}
.motion-block {
  margin-top: 18px;
  padding: 14px;
  border: 1px solid rgba(126, 224, 245, 0.3);
  background: rgba(5, 23, 34, 0.68);
}
.motion-block .motion-toggle { margin-top: 0; color: #bdf7ff; font-weight: 700; }
.state-enabled-toggle {
  padding: 10px 12px;
  border-left: 3px solid #71dff4;
  background: rgba(20, 67, 82, 0.32);
}
.transition-settings {
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid rgba(126, 224, 245, 0.3);
}
.modal-footer { margin: 0; }
.modal-footer > button { width: auto; flex: 1 1 0; }

.delete-confirmation-backdrop {
  position: absolute;
  z-index: 50;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(0, 8, 13, 0.76);
}
.delete-confirmation-dialog {
  box-sizing: border-box;
  display: grid;
  width: min(520px, 100%);
  gap: 14px;
  padding: 22px;
  border: 1px solid #6de8ff;
  background: rgba(4, 25, 36, 0.99);
  box-shadow: 0 0 28px rgba(34, 185, 219, 0.3);
}
.delete-confirmation-dialog strong {
  color: #fff0a8;
  font-size: 24px;
}
.delete-confirmation-dialog p {
  margin: 0;
  color: #fff;
}
.delete-confirmation-dialog small {
  color: rgba(215, 247, 255, 0.72);
}
.delete-confirmation-dialog > div {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.delete-confirmation-dialog button {
  min-height: 44px;
}

.range-editor-backdrop {
  position: fixed;
  z-index: 20;
  inset: 0;
  display: flex;
  align-items: flex-end;
  background: transparent;
}
.range-editor-sheet {
  box-sizing: border-box;
  width: 100%;
  padding: 14px 14px calc(14px + env(safe-area-inset-bottom));
  border: 1px solid #6de8ff;
  border-bottom: 0;
  border-radius: 14px 14px 0 0;
  background:
    linear-gradient(180deg, rgba(10, 42, 56, 0.98), rgba(3, 17, 26, 0.99)),
    repeating-linear-gradient(90deg, transparent 0 11px, rgba(112, 231, 255, 0.04) 11px 12px);
  box-shadow: 0 -12px 32px rgba(40, 197, 229, 0.3);
}
.range-editor-sheet header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.range-editor-sheet header div {
  display: grid;
  gap: 2px;
}
.range-editor-sheet header span {
  color: #6de8ff;
  font-size: 13px;
  letter-spacing: 0.14em;
}
.range-editor-sheet header strong { font-size: 20px; }
.range-editor-sheet header button {
  min-width: 72px;
  min-height: 44px;
  border: 1px solid rgba(126, 224, 245, 0.52);
  background: rgba(5, 23, 34, 0.9);
  color: #d7f7ff;
}
.range-editor-stepper {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) 56px;
  gap: 10px;
  margin-top: 14px;
}
.range-editor-stepper > button {
  min-width: 56px;
  min-height: 56px;
  border: 1px solid #75eaff;
  border-radius: 8px;
  background: rgba(25, 92, 111, 0.88);
  color: #fff;
  font-size: 28px;
  font-weight: 700;
}
.range-editor-stepper label {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  border: 1px solid rgba(126, 224, 245, 0.54);
  border-radius: 8px;
  background: rgba(1, 12, 20, 0.78);
}
.range-editor-stepper input {
  box-sizing: border-box;
  min-width: 0;
  width: 100%;
  height: 54px;
  padding: 6px 10px;
  border: 0;
  outline: 0;
  background: transparent;
  color: #fff5a6;
  font-size: 24px;
  font-weight: 700;
  text-align: center;
}
.range-editor-stepper label span {
  padding-right: 10px;
  color: #9fefff;
}
.range-editor-slider {
  width: 100%;
  min-height: 48px;
  margin-top: 12px;
  touch-action: pan-y;
}
.range-editor-limits {
  display: flex;
  justify-content: space-between;
  color: rgba(200, 240, 250, 0.68);
  font-size: 14px;
}

@keyframes fullscreenHintFade {
  0%, 65% { opacity: 1; }
  100% { opacity: 0; }
}

@media (max-width: 768px), (max-width: 1024px) and (pointer: coarse) {
  .custom-marker-modal.mobile-layout {
    position: relative;
    grid-template-rows:
      auto
      minmax(180px, var(--mobile-preview-ratio, 40fr))
      minmax(0, var(--mobile-settings-ratio, 60fr));
    gap: 8px;
    width: 100%;
    height: 100%;
    padding: 8px;
    font-size: 16px;
  }
  .mobile-layout .modal-header {
    min-width: 0;
    min-height: 40px;
  }
  .mobile-layout .modal-header > div:first-child {
    min-width: 0;
  }
  .mobile-marker-name {
    display: block;
    overflow: hidden;
    color: #d7f7ff;
    font-size: 17px;
    letter-spacing: 0.04em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .mobile-layout .modal-kicker { font-size: 12px; }
  .mobile-layout h2 { font-size: 20px; }
  .mobile-layout h3 { font-size: 18px; }
  .mobile-layout p { font-size: 15px; }
  .mobile-layout .image-export-panel {
    grid-template-columns: 1fr;
    align-items: stretch;
  }
  .mobile-layout .image-export-panel label {
    grid-template-columns: 72px minmax(0, 1fr);
  }
  .mobile-layout .image-export-button { width: 100%; }
  .mobile-layout .close-button {
    min-width: 72px;
    min-height: 44px;
  }
  .mobile-layout .mobile-menu-trigger {
    display: grid;
    place-items: center;
    width: 44px;
    height: 40px;
    padding: 0;
    border: 1px solid rgba(126, 224, 245, 0.5);
    background: rgba(8, 28, 40, 0.88);
    color: #d7f7ff;
    font-size: 28px;
    line-height: 1;
  }
  .mobile-layout .mobile-history-actions {
    gap: 4px;
  }
  .mobile-layout .mobile-history-actions button {
    width: auto;
    min-width: 0;
    min-height: 40px;
    padding: 5px 8px;
    border: 1px solid rgba(126, 224, 245, 0.42);
    background: rgba(8, 28, 40, 0.88);
    color: #d7f7ff;
    font-size: 13px;
  }
  .mobile-layout .marker-preview { height: auto; min-height: 0; }
  .mobile-layout .preview-label { top: 6px; left: 8px; font-size: 12px; }
  .mobile-layout .preview-controls {
    top: 6px;
    right: 6px;
    gap: 4px;
    font-size: 13px;
  }
  .mobile-layout .preview-controls > span { padding: 5px 7px; }
  .mobile-layout .preview-controls button { min-height: 36px; padding: 5px 8px; }
  .editor-layout {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: auto minmax(0, 1fr);
  }
  .editor-state-tabs {
    grid-column: 1;
    grid-row: 1;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0;
    padding: 5px 3px 5px 5px;
    border-right: 1px solid rgba(116, 220, 245, 0.22);
  }
  .editor-state-tabs > span { display: none; }
  .editor-state-tabs button {
    min-width: 0;
    min-height: 36px;
    min-width: 0;
    padding: 4px 5px;
    border-color: rgba(126, 224, 245, 0.3);
    border-radius: 0;
    font-size: 14px;
  }
  .editor-state-tabs button:first-of-type { border-radius: 999px 0 0 999px; }
  .editor-state-tabs button:nth-of-type(2) {
    margin-left: -1px;
    border-radius: 0;
  }
  .editor-state-tabs button:nth-of-type(3) {
    margin-left: -1px;
    border-radius: 0 999px 999px 0;
  }
  .editor-state-tabs .state-copy-button,
  .editor-state-tabs .state-copy-select { display: none; }
  .editor-state-tabs .transform-mode-control {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 6px;
    margin: 5px 0 0;
  }
  .editor-state-tabs .transform-mode-control > span { display: none; }
  .editor-state-tabs .transform-mode-control select {
    min-width: 0;
    width: 100%;
    padding: 7px 4px;
    font-size: 12px;
  }
  .mobile-layout .ring-tabs,
  .mobile-layout .desktop-setting-list {
    display: none;
  }
  .mobile-setting-list {
    display: grid;
    grid-column: 2;
    grid-row: 1;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0;
    padding: 5px 5px 5px 3px;
    border-bottom: 1px solid rgba(116, 220, 245, 0.3);
    background: rgba(3, 14, 24, 0.78);
  }
  .mobile-setting-list button {
    min-height: 36px;
    padding: 4px 3px;
    border: 1px solid rgba(126, 224, 245, 0.32);
    border-radius: 0;
    background: rgba(5, 23, 34, 0.78);
    color: rgba(215, 247, 255, 0.76);
    font-size: 14px;
    white-space: normal;
  }
  .mobile-setting-list button:first-child { border-radius: 999px 0 0 999px; }
  .mobile-setting-list button:last-child {
    margin-left: -1px;
    border-radius: 0 999px 999px 0;
  }
  .mobile-setting-list button.active {
    border-color: #c4faff;
    background: rgba(34, 112, 134, 0.9);
    color: #fff;
    box-shadow: inset 0 3px 0 #8fefff;
  }
  .setting-content {
    grid-column: 1 / -1;
    grid-row: 2;
    padding: 10px 10px 10px 46px;
  }
  .render-mode-grid { grid-template-columns: 1fr; }
  .render-mode-grid button,
  .choice-grid button,
  .ring-action-buttons button,
  .library-toolbar button,
  .existing-preset-grid button {
    min-height: 44px;
  }
  .mobile-layout .marker-library-list article {
    grid-template-columns: minmax(0, 1fr);
  }
  .mobile-layout .library-marker-summary {
    grid-template-columns: 10px minmax(0, 1fr) auto;
    align-items: start;
    gap: 7px;
    width: 100%;
    padding: 9px;
  }
  .mobile-layout .library-marker-color {
    width: 10px;
    height: 10px;
    margin-top: 4px;
  }
  .mobile-layout .library-marker-name {
    display: -webkit-box;
    overflow: hidden;
    min-width: 0;
    line-height: 1.3;
    overflow-wrap: anywhere;
    text-overflow: clip;
    white-space: normal;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  .mobile-layout .library-marker-meta {
    padding-top: 2px;
    font-size: 12px;
    line-height: 1.2;
  }
  .mobile-layout .library-marker-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .mobile-layout .library-marker-actions button {
    min-height: 42px;
  }
  .section-heading {
    align-items: flex-start;
    flex-direction: column;
  }
  .mobile-layout .section-heading p,
  .mobile-layout .section-heading .ring-action-buttons {
    display: none;
  }
  .ring-action-buttons {
    width: 100%;
    flex-wrap: wrap;
  }
  .ring-action-buttons button { flex: 1 1 30%; }
  .setting-row {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 6px 8px;
    margin-top: 14px;
  }
  .setting-row > span:first-child { grid-column: 1 / -1; }
  .setting-row input[type='range'] { grid-column: 1; }
  .setting-row output {
    display: grid;
    grid-column: 2;
    place-items: center;
    min-width: 70px;
    min-height: 44px;
    padding: 0 8px;
    border: 1px solid rgba(126, 224, 245, 0.46);
    border-radius: 6px;
    background: rgba(8, 35, 48, 0.88);
    cursor: pointer;
  }
  .setting-row output:active {
    background: rgba(34, 112, 134, 0.92);
  }
  .select-row select,
  .text-setting-row input {
    grid-column: 1 / -1;
    min-height: 44px;
  }
  .font-picker-trigger {
    grid-column: 1 / -1;
    grid-template-columns: minmax(100px, .8fr) minmax(0, 1.2fr);
    min-height: 48px;
  }
  .setting-row input[type='range'] {
    min-height: 40px;
    touch-action: pan-y;
  }
  .mobile-layout .setting-content .setting-row input[type='range'] {
    pointer-events: none;
  }
  .setting-row input[type='range']::-webkit-slider-runnable-track {
    height: 10px;
    border-radius: 999px;
  }
  .setting-row input[type='range']::-webkit-slider-thumb {
    width: 24px;
    height: 24px;
    margin-top: -7px;
  }
  .setting-row input[type='range']::-moz-range-track {
    height: 10px;
    border-radius: 999px;
  }
  .setting-row input[type='range']::-moz-range-thumb {
    width: 24px;
    height: 24px;
  }
  .toggle-row {
    min-height: 44px;
    margin-top: 12px;
  }
  .toggle-row input[type='checkbox'] {
    width: 26px;
    height: 26px;
    flex-basis: 26px;
  }
  .text-quick-settings {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 8px;
    margin-top: 10px;
  }
  .text-quick-settings .text-quick-size {
    grid-column: 1 / -1;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 7px;
    margin-top: 0;
  }
  .text-quick-settings .text-quick-size > span:first-child {
    grid-column: auto;
  }
  .text-quick-settings .text-quick-size input[type='range'] {
    grid-column: auto;
  }
  .text-quick-settings .text-quick-size output {
    grid-column: auto;
    min-width: 64px;
  }
  .text-quick-color,
  .text-quick-bold { min-height: 48px; }
  .mobile-layout .modal-footer { display: none; }

  .mobile-layer-trigger {
    position: absolute;
    z-index: 9;
    top: 61%;
    left: -1px;
    display: grid;
    place-items: center;
    width: 36px;
    min-height: 74px;
    padding: 6px 2px;
    border: 1px solid #6de8ff;
    border-left: 0;
    border-radius: 0 8px 8px 0;
    background: rgba(5, 32, 44, 0.97);
    color: #9fefff;
    box-shadow: 5px 0 16px rgba(34, 185, 219, 0.28);
    translate: 0 -50%;
  }
  .mobile-layer-trigger span {
    font-size: 10px;
    letter-spacing: 0.08em;
    writing-mode: vertical-rl;
  }
  .mobile-layer-trigger strong {
    font-size: 13px;
  }
  .preview-fullscreen-mode > .mobile-layer-trigger {
    display: none;
  }

  .mobile-panel-overlay {
    position: fixed;
    z-index: 30;
    inset: 0;
    display: flex;
    background: rgba(0, 8, 13, 0.48);
  }
  .mobile-layer-overlay {
    top: 302px;
    justify-content: flex-start;
  }
  .mobile-menu-overlay { justify-content: flex-end; }
  .mobile-layer-drawer,
  .mobile-overflow-menu {
    position: relative;
    box-sizing: border-box;
    display: flex;
    width: min(82vw, 340px);
    height: 100%;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid #6de8ff;
    background:
      linear-gradient(180deg, rgba(5, 31, 43, 0.99), rgba(2, 14, 23, 0.995)),
      repeating-linear-gradient(0deg, transparent 0 9px, rgba(112, 231, 255, 0.035) 9px 10px);
    box-shadow: 14px 0 32px rgba(34, 185, 219, 0.28);
  }
  .mobile-overflow-menu {
    width: min(78vw, 320px);
    box-shadow: -14px 0 32px rgba(34, 185, 219, 0.28);
  }
  .mobile-layer-drawer > header,
  .mobile-overflow-menu > header {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: space-between;
    min-height: 58px;
    padding: 8px 10px;
    border-bottom: 1px solid rgba(126, 224, 245, 0.36);
  }
  .mobile-layer-drawer > header div {
    display: grid;
    gap: 3px;
  }
  .mobile-layer-drawer > header span {
    color: rgba(158, 239, 255, 0.72);
    font-size: 12px;
    letter-spacing: 0.12em;
  }
  .mobile-layer-header-actions {
    display: flex !important;
    align-items: center;
    gap: 6px !important;
  }
  .mobile-layer-drawer > header button,
  .mobile-overflow-menu > header button {
    width: 46px;
    height: 44px;
    border: 1px solid rgba(126, 224, 245, 0.42);
    background: rgba(8, 28, 40, 0.88);
    color: #d7f7ff;
    font-size: 24px;
  }
  .mobile-layer-drawer > header button:disabled {
    opacity: 0.35;
  }
  .mobile-layer-list {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: 6px;
    min-height: 0;
    padding: 8px;
    overflow-y: auto;
  }
  .mobile-layer-item {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 48px;
    align-items: center;
    min-height: 52px;
    border: 1px solid rgba(126, 224, 245, 0.28);
    background: rgba(8, 28, 40, 0.78);
    color: #d7f7ff;
  }
  .mobile-layer-item.active {
    border-color: #bdf7ff;
    background: rgba(34, 112, 134, 0.94);
    box-shadow: inset 4px 0 0 #8fefff;
  }
  .mobile-layer-item.hidden { opacity: 0.55; }
  .mobile-layer-item.dragging {
    opacity: 0.72;
    box-shadow: 0 0 16px rgba(111, 233, 255, 0.72);
  }
  .mobile-layer-item.drag-over {
    border-top: 3px solid #fff0a8;
  }
  .mobile-layer-select {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px;
    align-self: stretch;
    min-width: 0;
    padding: 8px 10px;
    border: 0;
    background: transparent;
    color: inherit;
    text-align: left;
  }
  .mobile-layer-select small {
    color: rgba(200, 240, 250, 0.62);
    font-size: 12px;
  }
  .mobile-layer-drag-handle {
    align-self: stretch;
    min-width: 48px;
    border: 0;
    border-left: 1px solid rgba(126, 224, 245, 0.24);
    background: rgba(3, 19, 29, 0.52);
    color: #9fefff;
    font-size: 26px;
    touch-action: none;
    cursor: grab;
  }
  .mobile-layer-drag-handle:active { cursor: grabbing; }
  .danger-button {
    border-color: rgba(255, 124, 124, 0.5) !important;
    color: #ffb7b7 !important;
  }
  .mobile-layer-context-backdrop {
    position: absolute;
    z-index: 3;
    inset: 0;
    display: flex;
    align-items: flex-end;
    padding: 10px;
    background: rgba(0, 8, 13, 0.44);
  }
  .mobile-layer-context-menu {
    box-sizing: border-box;
    display: grid;
    width: 100%;
    gap: 7px;
    padding: 12px;
    border: 1px solid #6de8ff;
    border-radius: 12px 12px 4px 4px;
    background: rgba(4, 25, 36, 0.99);
    box-shadow: 0 -10px 28px rgba(34, 185, 219, 0.28);
  }
  .mobile-layer-context-menu strong {
    padding: 4px 2px 8px;
    color: #fff3b4;
  }
  .mobile-layer-context-menu button {
    min-height: 48px;
    border: 1px solid rgba(126, 224, 245, 0.38);
    background: rgba(8, 28, 40, 0.92);
    color: #d7f7ff;
  }

  .mobile-overflow-menu {
    gap: 6px;
    padding-bottom: calc(8px + env(safe-area-inset-bottom));
  }
  .mobile-overflow-menu > button {
    display: grid;
    gap: 4px;
    min-height: 64px;
    margin: 0 8px;
    padding: 9px 12px;
    border: 1px solid rgba(126, 224, 245, 0.3);
    background: rgba(8, 28, 40, 0.82);
    color: #d7f7ff;
    text-align: left;
  }
  .mobile-overflow-menu > button.active {
    border-color: #bdf7ff;
    background: rgba(34, 112, 134, 0.76);
  }
  .mobile-overflow-menu > button span { font-weight: 700; }
  .mobile-overflow-menu > button small {
    color: rgba(200, 240, 250, 0.62);
    font-size: 12px;
  }
}

.rune-input-button {
  min-height: 32px;
  padding: 4px 9px;
  border: 1px solid rgba(255, 240, 168, .55);
  color: #fff0a8;
  background: rgba(78, 65, 22, .72);
  white-space: nowrap;
}
.rune-label-input-button { min-height: 28px; font-size: 12px; }
.rune-editor-modal {
  display: grid;
  gap: 14px;
  height: 100%;
  padding: 18px;
  box-sizing: border-box;
  color: #d7f7ff;
  background: linear-gradient(135deg, rgba(3, 19, 29, .99), rgba(7, 39, 52, .98));
}
.rune-editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.rune-editor-header h2 { margin: 4px 0 0; font-size: 24px; }
.rune-editor-note { margin: 0; color: rgba(200, 240, 250, .72); font-size: 14px; }
.rune-editor-value {
  display: block;
  min-height: 66px;
  padding: 12px;
  overflow-wrap: anywhere;
  border: 1px solid rgba(126, 224, 245, .42);
  color: #fff0a8;
  background: rgba(2, 14, 23, .9);
  font-family: 'Alien Script', serif;
  font-size: 30px;
  line-height: 1.35;
  white-space: pre-wrap;
}
.rune-key-grid {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 7px;
  min-height: 0;
  overflow-y: auto;
  padding: 2px;
}
.rune-key-grid button {
  min-height: 46px;
  padding: 4px;
  border: 1px solid rgba(126, 224, 245, .36);
  color: #e9fdff;
  background: rgba(8, 28, 40, .9);
  font-family: 'Alien Script', serif;
  font-size: 24px;
}
.rune-key-grid button:hover,
.rune-key-grid button:focus-visible { border-color: #fff0a8; background: rgba(34, 112, 134, .76); }
.rune-editor-actions { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
.rune-editor-actions button { min-height: 44px; }
.rune-editor-actions .primary-action { border-color: #c4faff; background: rgba(34, 112, 134, .84); }
@media (max-width: 560px) {
  .rune-key-grid { grid-template-columns: repeat(6, minmax(0, 1fr)); }
  .rune-editor-actions { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
