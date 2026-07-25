Original prompt: ターゲットマーカー作成モーダルを追加し、リングごとの表示・動作設定を編集して保存できるようにする。

## Current work

- CustomMarkerModal is teleported to body and displayed above the battle modal.
- Custom marker settings are saved to localStorage only after pressing 決定.
- Ring tabs select the independently editable ring.
- Rings can be duplicated and reordered forward/backward in the render stack.
- The preview can switch between normal and target-moving states.
- Arc segments support tangent, radial, and fixed orientation modes.
- Custom markers now have separate idle/moving appearance and animation states.
- Custom target movement supports morph-before-move, simultaneous morph/move, and morph-after-move sequences.
- The custom-marker preview moves to clicked positions and includes a center-reset control.
- Custom segments now use SVG paths for circle, square, star, arrow, arrowhead, and waveform shapes.
- State copy, fill, equalized segments, per-segment colors, sequential lighting, glow animation, line flow, and fill pulsing are available.
- The custom modal now uses the portrait main screen's 720x1280 base size and the shared global scale calculation.
- Fixed the custom modal frame so its base layout does not flex-shrink before scaling.
- The custom modal frame uses hidden outer overflow; only internal settings and ring tabs scroll.
- The builder now includes an `既存` section that replaces the working rings with editable presets for G1-G5.5, 天使, 熾天使, 戦術, 菱形, レーダー, and 裂け目; SP is intentionally excluded.
- Added custom SVG shapes for triangle, diamond, line, cross, corner bracket, arc, tick, four-point sparkle, and sector parts so existing-marker presets can be reconstructed from editable rings.
- Fixed ring centering while changing width/height by separating CSS translate, rotate, and scale instead of combining them in one transform animation.
- Limited segment equalization to split counts of two or more; a stale equalize flag on a single SVG no longer forces a square that overflows downward when width/height differ.
- Fixed the actual width/height centering issue by forcing each custom segment SVG to fill its ring grid cell instead of retaining the SVG intrinsic square size and overflowing from the center anchor.
- Expanded each editable marker layer with six render modes: continuous ring, true segmented arc, circumference placement, free placement, centered part, and point-connection line.
- Increased editable layers from 8 to 16 while retaining an 8-point/segment limit per layer.
- Existing settings infer the new render mode from legacy `layout`; G4/G4.5 now use editable connection layers, G5.5 uses a true segmented arc, and radar sweep uses free placement.
- Replaced circularly repeated single L-parts in G1.5, G2, G5.5, and tactical presets with a dedicated four-corner SVG frame; G1.5 was also corrected to use ticks, dashed inner ring, crosshair, and core rather than an incorrect pulsing outer ring.
- Selecting, adding, duplicating, or loading a ring now flashes only that preview layer for 0.85 seconds through a separate wrapper, without resetting its rotation or pulse animation.
- Moved the render-mode controls back into the per-ring section after they were accidentally rendered under overall settings.
- Overall shape replacement is now a closed danger section with an in-modal confirmation before all rings in the edited state are overwritten.
- Added a left-side display section with persisted preview background color, cursor-follow toggle, and follow duration.
- Cursor follow is intentionally limited to the builder's upper preview: pointer movement shows the moving state and a short pause restores the idle state. It does not affect the live battle field.
- When preview cursor-follow is enabled, clicking the upper preview toggles tracking on/off; the header shows `追従中` while active.
- Display settings now allow the preview radial gradient to be disabled, leaving a flat selected background color.
- Added a preview focus mode that hides the modal header, editor, tabs, and footer; double-click, Escape, or F restores the editor.
- Replaced cursor-follow transition delay/duration behavior with requestAnimationFrame movement at a configurable percentage-per-second speed; the moving appearance remains active until the marker reaches the cursor target.
- Preview focus mode now removes the 720x1280 frame scaling/width constraint and fills the current browser viewport.
- Added an editable `円周文字` render mode. It supports up to 64 grapheme-based characters or 64 individually entered labels, clockwise/counterclockwise placement, inward/outward/upright orientation, radius, angular spacing, start angle, font size, weight, per-item colors, sequential lighting, and glow.
- Upright text counter-rotates against the ring orbit so labels remain screen-upright while the ring rotates.
- Added a `保存` section to the custom marker builder with a local marker library of up to 20 named entries.
- Saved markers can be selected, loaded into the working draft, overwritten, or deleted. Loading does not affect the battle marker until `決定` is pressed.
- The marker library persists independently in `localStorage` under `battle-custom-target-marker-library-v1`.
- Fixed custom `二重線` rendering so the second stroke is visibly inset instead of overlapping the first stroke; straight lines use a parallel offset.
- Added `/electronic-life` as a scaled black-background lab screen linked from `/guest`, split into an upper hologram stage and lower motion selector.
- Replaced the electronic-life placeholder with a floating hologram creature: round face, glowing round hands, articulated arms and torso, and a legless spectral tail.
- Reworked the hologram from a robot-like CSS assembly into one organic SVG light-form based on the supplied reference: integrated round head/body, soft membrane arms, flame wisps, long curved ghost tail, halo, highlights, and drifting particles.
- Connected eight electronic-life motions to the selector: idle, float, move, jump, joy, surprise, puzzled, and rest. Idle now keeps both hands lowered; emotion motions also animate the arms, eyes, mouth, core, halo, and whole-body pose.
- Move mode now turns the upper stage into a click destination surface. Clicking moves the hologram wrapper to a clamped in-stage percentage coordinate over 900ms while its internal travel animation continues.
- Removed float and move from the manual selector. The hologram now floats as its normal idle behavior, and every upper-stage click automatically uses the move motion until arrival before restoring the selected manual motion.
- Split automatic travel into left, right, up, and down motions based on the dominant pixel-axis distance to the clicked destination. Upward travel uses the jump pose; jump is no longer a manual button.
- Horizontal travel keeps the original unified creature design and uses a subtle three-quarter pose: face and body shift toward travel, the far eye fades, the torso narrows slightly, and the existing arms and tail trail behind. A separate nose/profile body experiment was removed because it broke character continuity.
- Added per-ring advanced details: editable name, position for every render mode, draw order, blend mode, horizontal/vertical mirroring, SVG line caps/joins/miter limit, and dash offset. These settings are saved independently for idle and moving states.

## Verification

- `npm run build` passes.
- Playwright verified the custom marker modal opens from the battle UI and renders the advanced ring controls; ring name, position, z-index, blend, mirroring, and SVG line styles persist to localStorage with no page or console errors.
- Playwright verified a 31-character continuous text ring and 12 individually entered labels, including localStorage persistence, with no page or console errors.
- Playwright verified creating two saved markers, loading one, renaming and overwriting it, deleting the other, and restoring the remaining entry after a page reload, with no page or console errors.
- Playwright visually verified the electronic-life hologram at the scaled 720x1280 layout, including its floating pose, round hands, spectral tail, equal-width motion controls, and selected-motion text state.
- Playwright screenshots verified the organic spirit redesign at two animation timings with no console errors; the halo, full body, arms, and tail remain inside the upper stage.
- Playwright verified idle, joy, surprise, and puzzled poses plus selected-motion text state. A no-keyboard rerun confirmed the full eight-button grid remains stable and joy raises both hands as intended.
- Playwright selected move mode, clicked the stage at a left/lower destination, verified the position changed from center to approximately x=30%, y=62%, waited for relocation completion, and confirmed the hologram stayed visible without console errors.
- Playwright verified the five-button selector no longer contains float, move, or jump. Four staged clicks reported `move-right`, `move-left`, `move-up`, and `move-down` respectively, then restored automatic float after arrival with no console errors.
- Playwright screenshot verified the revised right-travel three-quarter pose keeps the original round face and spectral body recognizable while the far eye, body angle, arms, and tail indicate direction, with no console errors.

## TODO

- Visually verify that the custom marker modal no longer shows an outer horizontal/vertical scrollbar at a short landscape viewport.
- Electronic Life animation is deferred until the character images are ready. Planned direction: split the character into transparent 2D parts (face, eyes, mouth, horns, torso, both arms/hands, and 2-3 tail sections), animate those parts with Phaser/JavaScript, and keep CSS limited to hologram glow, scanlines, and other electronic effects. Spine can be considered later if more complex deformation or many combat motions become necessary.

## Skill effect and SE designer

- Added a footer mode switch to the skill-effect modal for moving between skill-effect settings and an SE synthesis screen.
- Added electronic, physical, and hybrid SE presets with editable waveform, pitch sweep, duration, attack, oscillator/noise mix, filter, resonance, distortion, and volume.
- Synthesized SE settings can be auditioned, assigned to the selected skill, exported in `skillEffectSettings.json`, and played during battle.

## SE designer verification

- `npm run build` passes after adding the SE designer and synthesized battle playback.
- The required web-game Playwright client opened the battle screen successfully; its screenshot was visually inspected.
- Browser interaction verified footer switching, electronic/physical/hybrid categories, preset selection, audition, assignment to a skill, return to skill settings, and no horizontal overflow at 848px.
- Exported JSON was inspected and confirmed to contain `seMode: "synth"` plus the complete selected `seSynth` settings.
- The final narrow-layout screenshot was visually inspected; preset summaries and action buttons remain inside their frames without clipping.

## Element and weapon SE presets

- Added editable presets for 炎, 氷, 雷, 酸, 音波, 闇, 光, 斬撃, 刺突, 打撃, 弓, and 銃撃.
- Added oscillator amplitude modulation and feedback echo controls so elemental and weapon sounds can be tuned beyond the original oscillator/noise/filter settings.
- `npm run build` passes. Playwright verified all seven elemental and five weapon names, auditioned 銃撃, and found no horizontal overflow at 1440px or 848px; only the project's pre-existing anonymous 404 console messages remain.
- Retuned the 12 requested presets away from light electronic tones toward fantasy combat sounds, and added editable low-body and attack-transient layers for weight and physical impact.
- Added an inharmonic four-resonator metal layer with editable mix, pitch, dissonance, and decay; pitch sweep ranges now reach 8kHz, and a 金属音 preset provides a short clang starting point.
- Added a direct SE作成 entry to `/guest`; it opens the shared skill-effect editor in sound mode while retaining access to the six existing skill configurations.
- Moved runtime target-marker preset JSON out of ignored `memo/` into `src/components/modals/data/targetMarkerPresets/`. The standalone lab sync now copies every preset JSON into `src/data/targetMarkerPresets/`, and the shared modal uses the same relative import in both projects.
- Unnamed target-marker layers now use their idle shape label as the tab/display name; explicit user names still take priority, and legacy generated names such as `リング 1` are treated as unnamed.
- Duplicate ring display names are numbered in their current order, such as `円 1` through `円 5`; the suffix disappears automatically when only one matching name remains.
- The marker library now shows saved count, remaining slots out of the 20-entry limit, and the current library's approximate UTF-8 JSON size.
- Renamed the custom marker UI concept from rings to layers while preserving the `rings` JSON field for compatibility. Added moon, heart, and sun motif shapes plus an adjustable inner cutout mask for closed filled shapes.
- Replaced the fixed moon silhouette with an adjustable moon-phase path: 0% is a full moon and 100% is a thin crescent, with intermediate gibbous and half-moon states.
- Added an experimental `eraseBelow` layer option for closed single shapes. It uses the layer shape, size, position, angle, and mirroring as a mask that removes only lower marker layers while leaving the battle background and character visible.
- Added an Electronic Life Ver.2 SVG form inspired by the supplied reference: a broad round face, paired flame horns, floating hands, expressive tall eyes and mouth, and a tapered spectral tail. The reference image is not rendered directly, and electronic stage effects remain separate layers.
- Removed the Ver.2 dark pupils that came from misreading transparency artifacts, and replaced the filled mouth with a clean curved smile.
- Removed the two added cheek lines that looked like dents below the eyes, while restoring the large open smile without dark pupils.

## Custom marker mobile UI

- Added a true viewport-sized mobile layout instead of scaling the 720x1280 desktop editor down. State controls, horizontal layer tabs, setting categories, scrollable content, and the footer now remain usable at a 390x844 viewport.
- Increased mobile tap targets for tabs, buttons, checkboxes, sliders, and footer actions. Layer addition remains fixed at the start of the horizontal layer row.
- Tapping a setting value on mobile now opens a bottom numeric editor with direct number input, minus/plus controls, a large slider, and visible minimum/maximum values. Changes update the marker preview immediately.
- `npm run build` passes. The required web-game Playwright client opened the battle screen, and a 390x844 Playwright interaction opened the custom marker modal and numeric editor with no console errors. Both screenshots were visually inspected.
- Synced the shared target-marker files and presets to `target-marker-lab`.

## Custom marker mobile UI redesign memo

The current mobile UI is still a rearranged desktop editor. Before making further layout changes, redesign the mobile information architecture independently while preserving the desktop UI.

### Main screen

- Header contains the marker name, close button, and a three-dot menu.
- Keep the preview at the top with only idle/moving state switching and reset-to-center controls.
- Show only the currently selected layer name below the preview.
- Keep a fixed `LAYER` button on the left edge.
- Display settings for only the selected layer in the main scroll area.
- Organize layer settings into a small number of tabs such as basic, appearance, motion, and details.
- Keep only the confirm button fixed at the bottom. Move initialization and JSON operations into the three-dot menu.

### Layer drawer

- Remove the horizontal layer tabs on mobile.
- Tapping the left-edge `LAYER` button opens a drawer from the left using approximately 70-80% of the screen width.
- Show layers as a vertical list with their name, color, and visibility.
- Include add, duplicate, move forward, move backward, and delete operations.
- Close the drawer automatically after selecting a layer.
- Design the list for up to 24 layers.

### Three-dot menu

Move non-layer-specific screens and operations into the three-dot menu:

- Overall settings
- Display settings
- Existing markers
- Saved markers
- JSON import/export
- Initialization
- Fullscreen preview

Each item should open a dedicated side panel or bottom panel rather than displaying every setting at once.

### Placement mode

Replace the large placement-mode buttons with a select list:

- Single shape
- Continuous ring
- Segmented ring
- Circumference placement
- Circumference text
- Polygon

Keep placement mode and shape as separate settings. For example, select `Circumference placement` as the placement mode and `Arrow` as the shape.

### Numeric editor

- Retain the mobile bottom-sheet numeric editor.
- Open it by tapping a setting value.
- Support direct numeric input, minus/plus buttons, a large slider, and visible minimum/maximum values.
- Consider press-and-hold continuous increment/decrement.

### Mobile redesign implementation

- Replaced the mobile horizontal layer tabs with a compact left-edge `LAYER` trigger and a vertical slide-out drawer.
- The layer drawer supports selection, add, duplicate, forward/backward ordering, and deletion, and is sized for the 24-layer limit.
- Added a header three-dot menu for overall settings, display settings, existing markers, saved markers/JSON, fullscreen preview, state copy, and initialization.
- Reduced the main mobile editor to idle/moving state controls, layer shape/motion tabs, the selected layer settings, and a fixed confirm button.
- Replaced placement-mode buttons with a `配置方式` select list while keeping shape selection separate.
- The numeric bottom sheet remains transparent over the preview so adjustments can be checked live.
- A 390x844 Playwright pass verified the main editor, layer drawer, menu, global settings route, placement-mode selection, and state-copy action without console errors.
- The mobile layer drawer now starts below the preview so the marker remains visible while layers are managed.
- Added touch/mouse drag reordering through a dedicated handle. Long press or right-clicking a layer opens a compact duplicate/delete action sheet.
- Removed the redundant small shape label from each layer row; generated names such as `歯車 1` are now shown only once unless the layer is hidden.
- Increased the default mobile preview area to a 40:60 preview/editor split. Display settings now includes a 25-60% preview-ratio control, and the layer drawer dynamically opens immediately below the resized preview.
- Compacted the mobile header and replaced the generic title with the currently loaded marker name. Preset, saved-marker, and imported JSON loads update the header; unnamed work displays `新規マーカー`.
- Mobile range controls now ignore taps on the track and only begin changing when the pointer starts within 24px of the current thumb, preventing accidental value jumps while scrolling.
- Combined the four mobile state/section controls into two compact segmented switches on one row: `停止時/移動時` and `形状・線/動き`.
- Disabled direct interaction with range tracks inside the mobile scrollable settings area. Values are adjusted by tapping the numeric output and using the bottom editor, preventing sliders from catching vertical scroll gestures; the bottom editor slider remains interactive.
- Reduced custom-marker editor rendering load without removing features: the underlying battle UI is hidden and its CSS animations are paused while the teleported editor is open, and the preview/settings areas use layout/paint containment to limit redraw propagation.

## Possible future custom marker work

- These items are ideas under consideration and are not confirmed implementation tasks.
- Consider GIF export that records the marker through the end of its configured transition.
- Consider bundling only the final selected webfont files instead of every font candidate, to avoid increasing mobile load time.
- Added `変換先` as a third editable marker state alongside `停止時` and `移動時`. Overall appearance, per-layer appearance, whole-marker motion, and per-layer motion are stored independently for all three states.
- Added explicit state-copy destinations on desktop and two destination actions in the mobile menu. Existing settings and presets without a transform state initialize it from their idle state.
- JSON export now includes the transform state, and TargetMarker can render it explicitly in the editor without changing the existing battle idle/moving behavior.
- Both projects build successfully. Desktop and 390x844 browser checks verified transform editing, preview switching, state copying, JSON persistence, old-preset fallback, and no console errors.
- Added a header-level transform animation mode with three choices: no animation, animate to the transform state then reverse back to idle, or animate to the transform state then reset immediately to idle.
- Replaced the transform state's redundant per-layer master animation checkbox with the header mode. Transform duration, start delay, and transformed-state hold delay are editable from the transform motion screen.
- TargetMarker now runs the selected transform sequence continuously while idle and suspends it during target movement. Reverse mode uses the same duration/easing on the way back; reset mode returns to idle with a zero-duration state change.
- Browser timing checks verified reverse mode grows and shrinks smoothly, while reset mode grows then snaps to idle. Desktop and mobile layouts showed the new controls without horizontal overflow or console errors, and the standalone lab build passes after synchronization.
- Added a separate return duration for reverse transform playback. Existing JSON without this field inherits its forward transform duration; browser timing checks verified a 300ms forward transform and 900ms rewind use visibly different speeds.

## Custom marker text fonts

- Added per-text-layer font selection for standard, magic, cyber, fantasy, rune/ancient, and Japanese magic styles.
- Added a custom CSS `font-family` option for fonts supplied later by the project.
- Presets include candidate font names with built-in Windows/Japanese fallback stacks, so the control works without downloading additional font assets.
- Build and mobile Playwright checks passed for preset and custom font-family rendering with no console errors.
- Added `/guest` -> `フォント確認`, an independent font preview screen with editable sample text, size, weight, custom family input, and selectable comparison cards for every font preset.
- The shared font preset data is now copied by the target-marker lab sync script, and the standalone lab build passes.
- Added the five additional JS font entries: `ファンタジー（JS）`, `魔法（JS）`, `ルーン（JS）`, `メカニック`, and `電子`. They are selectable in both the font preview screen and text-ring settings, and the electronic preset was verified in the marker preview.
- Rune presets now restrict text and individual labels to Unicode Runic characters plus spaces. Switching to a rune preset replaces an incompatible or empty string with `ᚠᚢᚦᚨᚱᚲ`, and the font preview applies the same input rule.
- Bundled the supplied `dist/fontList` fonts into the source as `src/assets/fonts/magic-ring.ttf` and `src/assets/fonts/alien-script.ttf`.
- Added `@font-face` registration and `魔法陣` / `異星字` presets. The runtime no longer references the Japanese `異星字` directory or its mojibake filename, so Vite can resolve the files consistently.
- `npm run build` and the `/guest` font preview smoke check passed after the asset change.
- Tightened font preview card typography: explicit label/category sizes, single-line ellipsis, compact card spacing, and better sample vertical alignment prevent long preset names and categories from expanding or wrapping awkwardly.
- Added a dedicated Rune Input modal to the custom marker text settings. Rune strings and individual labels can be assembled from clickable rune glyphs, with space, delete, clear, sample, and close controls.
- Rune input now commits when the modal is closed, so there is no separate apply action. Clearing the editor leaves the preview blank and preserves an empty value instead of visually falling back to the sample.
- Reordered text-layer settings so input mode, font, custom font, and bold appear before the text content and placement controls. Replaced the normal/bold select with a single `文字を太字にする` checkbox while preserving the stored `normal`/`bold` values.
- Grouped the text layer's compact appearance controls below the font selector: color, text size, and bold now share one compact panel on desktop. On narrow/mobile layouts, color and bold remain side by side while the size slider uses the next row for touch-safe adjustment.
- Adjusted the compact text controls again so color and bold always share the first row, with text size on a full-width second row; this prevents the bold checkbox from being clipped.
- Removed the close button from the mobile numeric bottom sheet because tapping outside already closes it. The minus/plus buttons now auto-repeat after a 360ms hold at 80ms intervals while preserving one-step taps.
- Registered the newly supplied bundled fonts from `src/assets/fonts`: Isekai, Neko no Mezame, Technoid, and Tech Vermin regular/italic. They are available in both the font preview and custom text-layer selector, and the production build emits all font assets.
- Added PNG image export to the custom marker library. The export captures the current marker preview at 512x512 and supports either a transparent background or the configured preview background.
- The image exporter pauses CSS motion during capture, keeps the marker's bundled styles and font samples, and downloads a PNG named from the current marker name.
- `npm run build` passed after the image export change. Browser interaction verification was blocked because this workspace cannot start Vite's dev/preview server due to its filesystem access restriction.
- Replaced the text layer's compact font select with a dedicated font picker modal. Every option displays an actual sample in that font, and selecting a card applies it immediately.
- Hid the duplicate fantasy, magic, and rune JS aliases from selection while retaining their font-family mappings for compatibility with previously saved marker JSON.
- Updated `target-marker-lab` synchronization to copy the font picker component, bundled font CSS/assets, and required main entry import. Both projects build successfully, and the nested picker selection flow was verified without console errors.
- Diagnosed the marker library PNG export failure: `CustomMarkerModal.vue` serializes HTML through SVG `foreignObject` and then calls `canvas.toBlob()`. Chromium marks that canvas as tainted, so `toBlob()` throws `SecurityError` and the existing catch displays the generic image-generation failure notice. This is reproducible with the default marker and is not a browser setting issue.
- Replaced the SVG `foreignObject` export with `html2canvas`, which renders a temporary static clone of the marker directly to Canvas. Transparent and preview-background PNG downloads now complete without console errors; the temporary clone is removed even if rendering fails. Added `html2canvas@1.4.1` to both the game project and target-marker-lab, synchronized the shared modal, and confirmed both production builds pass.
- Corrected PNG export sizing: the earlier `html2canvas` implementation expanded the 140px marker root to 512px. Export now uses the same 360px coordinate space as the preview, then renders it at 512px resolution, so regular-size markers preserve their preview scale and enlarged markers stay within the output frame.
- Corrected html2canvas glow artifacts: nested CSS `drop-shadow` filters were being repeatedly composited into many offset copies in exported PNGs. The export-only clone now disables filter, box-shadow, and text-shadow while preserving the live preview's effects; a complex magic-circle preset exports clean geometry without console errors.
- Added one controlled Canvas blur pass after the clean marker render, so PNG output retains a single soft glow without reintroducing repeated shadow artifacts. The background is composited beneath the transparent marker render, allowing the same glow approach to work for both transparent and preview-background exports.
- Evaluated `html-to-image` as a browser-compositor-like alternative for PNG export, but it did not retain the Vue scoped marker styles in this project and produced a blank image. It was removed; do not use it for this editor. Exact browser-composited PNG output requires a browser screenshot renderer rather than a client-side DOM-to-canvas library.
- Replaced the approximate PNG/Canvas export with standalone SVG export. The current marker DOM, TargetMarker scoped CSS, native filters, and bundled fonts are embedded in the downloaded SVG, avoiding Canvas taint and repeated-shadow reconstruction artifacts.
- Removed `html2canvas` from both projects, synchronized `CustomMarkerModal.vue` to target-marker-lab, and confirmed both production builds pass.
- Browser-tested the `記号魔法陣` preset: the editor downloaded a 389 KB transparent SVG without console errors, and the standalone file reopened in Chromium with its geometry, text, and glow intact.
