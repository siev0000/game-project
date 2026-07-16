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

## Verification

- `npm run build` passes.
- The Playwright web-game client could not run because the environment does not have the `playwright` package installed.

## TODO

- Visually verify that the custom marker modal no longer shows an outer horizontal/vertical scrollbar at a short landscape viewport.
