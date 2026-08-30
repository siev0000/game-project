Original prompt: ターゲットマーカー作成モーダルを追加し、リングごとの表示・動作設定を編集して保存できるようにする。

## 2026-08-29 2Dボーン: スプライトアニメーション書き出し

- 保存メニューへ「スプライトアニメーションを書き出す」を追加。現在選択中のモーション全コマを、ボーン表示や編集補助線を含めない透明PNGへ合成する。
- 全コマの画像範囲を統一してスプライトシート化し、出力倍率・余白・横のコマ数を指定可能。PNGと同時にFPS、ループ、columns/rows、frameOrder、1コマ寸法を持つ `.sprite.json` を出力する。
- File System Access API対応ブラウザでは保存先フォルダを選択して2ファイルを直接保存し、非対応時は通常のダウンロード先へ保存する。
- `node --check 2d_bone_editor_split/app.js` と `npm run build` を通過。ユーザー指示によりブラウザ操作確認は行わず、確認手順のみ引き渡す。
- 仕様を修正し、補助JSONと「横のコマ数」設定を削除。選択モーションの全フレームを、その枚数どおり横一列へ並べたPNGだけを保存する。
- 書き出し対象を現在の1モーションから設定済みの全モーションへ変更。選択した保存先に `<プロジェクト名>_sprites` フォルダを作り、各モーションを名前別PNGとして一括保存する。
- 保存先フォルダAPIは環境によって使えず不要だったため撤去。全モーションPNGを `<プロジェクト名>_sprites/` に格納したZIPを1ファイルとして通常ダウンロードする方式へ変更した。
- 連続メッシュCanvasの固定1000×1000内部解像度を、元画像の長辺に合わせて最大2000×2000まで自動拡張するよう変更。CSS上の1000×1000座標は維持し、高品質補間を有効化。オニオンスキンとスプライト書き出しへ合成する際も高解像度Canvasを論理1000×1000へ正しく縮小する。

## 2026-08-26 ダメージ計算（TRPG v10）

- `src/constants/damageResolver.js` を追加。Python版 `trpg_calc_v10.py` と同じ順序で、基礎攻撃数による威力分割、判定／追加威力、善悪・APP補正、複数ヒットのガード消費・再展開・突破最低保証、負傷閾値を解決する。
- `BattleView.vue` の攻撃実行は、選択中（未選択時は先頭）の敵へ共通Resolverの結果を適用し、HP、残ガード、負傷結果を更新するようにした。攻撃結果は設定欄の先頭に表示する。現時点の既存演出のHIT COUNTを基礎攻撃数として扱う。
- `output/verify-damage-resolver.mjs`（ガード破壊、打撃骨折、属性補正・複数ヒット）と `output/verify-battle-damage.mjs`（Guest→バトル情報→敵選択→攻撃実行）を通過。画面は `output/battle-damage-result.png`。`npm run build` も通過（既存のglob非推奨・chunk size警告のみ）。

## 2026-08-26 2Dボーン: 接続済み右上腕のリサイズ

- 接続済みボーンのリサイズ後に共通の親接続スナップをもう一度適用していたため、右上腕などで対角固定の位置補正が打ち消され、枠を変更できない状態になっていた。`resize` / `display-resize` 中は接続スナップを再適用しないようにした。
- `output/verify-bone-editor-opposite-corner-resize.mjs` で右上腕の実サイズ・表示枠の全4ハンドルを確認。対角のずれは最大0.013px、幅85→113。腕のメッシュ範囲選択の回帰 `verify-bone-editor-upper-arm-range.mjs` も通過。画面は `output/bone-editor-opposite-corner-resize.png`。`npm run build` 通過（既存警告のみ）。
- Follow-up diagnosis: user-used `ver4_2作成` (`motion_20260816133413_r1zy`) has five added bones absent from `meta.referencePose` (left/right shoulder, left/right knee, elbow). Resizing the right-upper-arm mesh loops that partial reference pose, `getWorldState()` iterates every layer, and throws `TypeError: Cannot read properties of undefined (reading 'x')`; the resize is aborted. Reproduced by `output/inspect-ver4-right-upper-arm-edit.mjs`: selected right upper arm, 4 handles present, W/H stayed 88/131, five errors. Pending fix: normalize/fill `referencePose` before mesh sizing calls or skip incomplete layers safely.
- Fixed the follow-up correctly without imposing a full reference pose: `getWorldState(frame)` now ignores layers missing from the given pose, and treats a present layer with an absent parent as an independent root for that partial pose. `ver4_2作成` right upper-arm resize now changes W/H 88/131 → 120/147 with no browser errors; its right-upper-arm→right-forearm mesh remains active. Existing all-corner resize and upper-arm range tests also pass. `npm run build` passes (existing warnings only).

## 2026-08-11 技エフェクト作成

- Guest の「ゲーム作成」タブに「技エフェクト作成」を追加。`EffectEditorModal.vue` は Phaser プレビュー、6種類（斬撃/リング/衝撃波/ビーム/雷/粒子）の複数レイヤー、フレーム式タイムライン、テンプレート、コマ送り、JSON出力、localStorage 反映を提供する。
- `src/components/effects/EffectRenderer.js` をVue非依存のゲーム用ランタイムとして追加。作成JSONを `new EffectRenderer(scene).play(effect, { x, y })` で再生できる。現在のBattleView既存スプライト演出は変更していないため、次段階で保存済みJSONを技データへ割り当てる。
- 初期実装時点ではローカルPlaywright依存がなくブラウザ未確認だったが、下記のUI再編時にdevelop-web-game付属Playwrightで実ブラウザ確認まで完了した。
- 技エフェクト作成UIを上下構成へ再編。上段に発射点（シアン丸）・着弾点（橙ひし形）のドラッグ操作とX/Y%数値入力、方向ガイド、再生/停止/確認フレームを集約し、下段に基本情報・テンプレート・レイヤー一覧・詳細設定を配置した。各レイヤーは発射点/経路上/着弾点を選べ、方向追従とBeam/Lightningの経路全長フィットに対応。`EffectRenderer` のゲームAPIも `{ origin, target }` を受け取る。
- 標準web-gameクライアントでGuestのゲーム作成タブと導線を確認。`output/verify-effect-editor-ui.mjs` で発射点をX24/Y55→X33/Y67へドラッグ、レーザーテンプレートを2レイヤーで再生し、Phaser canvas 1枚・console/page errorなしを確認。画面は `output/effect-editor-ui.png`。
- プレビュー上の発射点/着弾点から大きな説明ラベルを削除し、色付きの `○` / `◆` だけに変更。座標欄も同じ記号と色で対応し、`↺` で両点を初期値（○ X24/Y55、◆ X76/Y45）へ戻せる。操作ボタンを `× / ↺ / ▶ / ■ / ＋ / 🗑 / ⇩ / 💾`、テンプレートを `⚔ / ⚡ / ➜ / 🔥` へ変更し、説明はtitle/aria-labelだけにした。ブラウザでドラッグ→初期化→再ドラッグ、レーザー再生、console/page errorなしを再確認。画面は更新済み `output/effect-editor-ui.png`。
- 位置点をさらに簡素化し、囲い・背景なしの22px `●` / `♦` のみに変更。方向点線は通常32%透過、再生中20%透過、位置点は再生中28%透過になる。技エフェクト名は例示アイコンではなく文字へ戻し、テンプレートとレイヤー一覧を「斬撃／雷斬撃／レーザー／爆発」「ビーム／リング」表示にした。検証で位置点22px、再生中opacity 0.28、点線0.2、全テンプレート名、ドラッグ・初期化、console/page errorなしを確認。
- 位置UIを再圧縮。●/♦の見た目は11px、透明なドラッグ判定は34pxとして操作性を維持し、座標グループの外枠・余分なpaddingを削除。方向点線は1px、通常opacity 0.24／再生中0.14へ細く薄くした。テンプレートの横並びボタンを撤去し、レイヤー欄の116pxプルダウン＋36px `＋` に統合。選択変更だけでは追加せず、`＋` 時だけ選択テンプレートのレイヤー群を既存レイヤーへ追加する。検証でレーザー選択時1レイヤー維持、＋後3レイヤー、ドラッグ判定34px、記号11px、外枠0px、console/page errorなしを確認。

## Current work

### 2026-08-21 2Dボーンエディタ: 選択輪郭とボーン色濃さ

- ♦ボーン本体はSVG多角形で描画し、内側は薄い塗り・外周は1pxの連続した輪郭にした。選択中だけ輪郭を+2px（計3px）へ太くする。画像・メッシュの不透明度や表示順は選択では変更しない。
- リサイズ枠のレイヤーを♦ボーン描画の下に置き、他ボーンの四隅ハンドルと重なる場合も♦ボーン本体の選択を優先するようにした。
- ♦のクリック対象を外接長方形からSVG多角形そのものへ変更。複数ボーンのリサイズ枠／表示範囲が重なっても、♦の外側では下のボーン本体へクリックが通る。ボーン非表示時は従来どおり透明な本体領域から選択できる。
- SVGの♦本体を直接クリックした場合は、別座標系の二重命中判定を行わないようにした。左右反転した♦については、従来の判定を使う経路でも反転原点を考慮する。
- 操作優先順位を「選択中ボーンの四隅リサイズハンドル ＞ 選択中の♦本体 ＞ 他ボーン」に修正。リサイズoverlayは最前面だが枠内はクリック透過で、四隅ハンドルだけが他ボーンと重なってもサイズ変更を優先する。
- 設定画面の「表示」に「ボーン色の濃さ」スライダー（0〜100%）を追加。`meta.display.boneColorIntensity` として保存し、表示中の♦ボーンの塗りと輪郭へ反映する。

- 右側インスペクターは常時固定表示に変更。選択解除・背景編集終了・Escでパネルを閉じず、`workspace.inspector-open` を維持してキャンバス幅と画面位置を変えない。`output/verify-bone-editor-inspector-fixed.mjs` で選択→解除前後のstage幅がともに `847.703125`、右メニュー `display:grid`・aria表示状態を確認。`npm run build` と標準web-gameクライアントも通過（既存Vite警告のみ）。

- 選択強調を四角いリサイズ枠から♦ボーン本体へ変更。選択中の♦は白4px輪郭とシアン発光で強調し、矩形は四隅ハンドルだけを残す。ボーン非表示時も最前面操作overlayは残し、形状だけ透明にして画像枠全体をヒット対象にするため、画像から選択・回転・移動できる。非表示時の実ドラッグで腰の回転 `0 → -9`、console/page errorなしを `output/verify-bone-editor-hidden-bone-select.mjs` で確認。選択枝検証と `npm run build` も通過（既存Vite警告のみ）。

- 選択中の♦ボーンは `bone-overlay` 内でも `z-index:2`、他は1として最優先にしたため、他ボーンに重なっても選択済みのボーンを直接再操作できる。選択枝の連続メッシュ表示が漏れていた原因は存在しない `binding.bones` を参照していたことだったため、実データの `binding.boneChain` で判定するよう修正。上腕など連続メッシュに含まれるボーンも選択時に前面・45%表示になる。`output/verify-bone-editor-selection-preview.mjs` で選択overlay 2／子1、枝の前面化と画像45%、色反映、console/page errorなしを確認。`npm run build` と標準web-gameクライアントも通過（既存Vite警告のみ）。

- ♦ボーン操作時に画面パンも同時に始まる競合を解消。ボーン操作が有効なmousedownを `stopPropagation()` し、stageのパン開始へ渡さない。`output/verify-bone-editor-overlay-drag.mjs` で左太腿の回転 `-8 → 23` と画面位置 `calc(50% + 0px)` 不変を確認。`npm run build` も通過（既存Vite警告のみ）。

- 最前面♦ボーンの押下処理を修正。♦要素自身にはボーンIDがなく、親の `bone-overlay-item` からIDを取る必要があったため、押下中の選択・移動・回転が開始されず、mouseup後のクリックだけが反応していた。親要素からIDを解決するようにして即時操作を復帰。`output/verify-bone-editor-overlay-drag.mjs` で♦を実際にドラッグし、左太腿の選択と回転値 `-8 → 19`、console/page errorなしを確認。画面を目視確認、`npm run build` と標準web-gameクライアントも通過（既存Vite警告のみ）。

- `2d_bone_editor_split` は選択ボーンと子孫ボーンの画像を編集補助として最前面に一時表示し、元の不透明度の45%へ下げる。選択解除時は通常のレイヤー順・不透明度へ戻る。連続メッシュも対象ボーンを含む場合は同様に前面・45%で表示する。最前面へ分離済みの♦表示にはボーン色設定も反映し、色ONなら各ボーン固有色、OFFなら従来のシアンになる。`output/verify-bone-editor-selection-preview.mjs` で親子枝の前面化、子画像45%、設定色 `#ff00aa` の反映、console/page errorなしを確認。`output/bone-editor-selection-preview.png` を目視確認、`npm run build` と標準web-gameクライアントも通過（既存Vite警告のみ）。

- `2d_bone_editor_split` の♦ボーン表示と入力を画像レイヤーから分離した最前面 `bone-overlay` に移動。画像・メッシュ・選択中の四角枠に遮られず、表示中の♦部分を直接クリックして選択／回転／移動できる。元の画像レイヤーは入力を受けず、選択枠は四隅ハンドルだけが入力を受ける。`output/verify-bone-editor-overlay-priority.mjs` で最前面要素が対象ボーン、画像側の入力が無効、overlayの前面z、console/page errorなしを確認。スクリーンショット `output/bone-editor-overlay-priority.png` を目視確認し、`npm run build` と標準web-gameクライアントも通過（既存Vite警告のみ）。

- `2d_bone_editor_split` の選択中四角枠をクリック透過に変更。枠の内側は背後の♦ボーン選択を遮らず、サイズ変更に必要な四隅ハンドルだけをクリック可能にした。`output/verify-bone-editor-resize-overlay-clickthrough.mjs` で枠=`pointer-events:none`、ハンドル=`auto`、選択枠の表示状態、console/page errorなしを確認。標準web-gameクライアントと `npm run build` も通過（既存Vite警告のみ）。

- ボーン表示の形状を再修正。丸い台形ではなく、頭端・尾端とも尖る♦型にし、最大幅は頭寄り30%へ配置して尾側が細長く絞られる形にした。従来の `bar` / `torso` / `hand` 等の角丸指定もボーン表示では無効化。ボーン形状は画像の `z-index` より前面、半透明の塗りとシアン輪郭で画像を隠さず判別できる。クリック判定も同じ「頭寄り30%で最大幅」の♦型計算へ更新。`output/verify-bone-editor-tapered-hit-area.mjs` は形状外未選択／形状内選択・CSSの♦型を再確認済み。`npm run build` と標準web-gameクライアントも通過（既存Vite警告のみ）。

- `2d_bone_editor_split` の通常ボーン表示を、頭側30%・尾側70%幅のテーパーした♦型へ変更。実画像・メッシュ・実寸のW/Hは変更せず、選択前はこのボーン形状のみを表示し、選択後だけ既存の四隅ハンドル付き矩形を表示する。親div矩形全体がクリックできないよう、画面座標をボーンローカル座標へ戻して同じテーパー形状内だけを選択判定にした。表示専用サイズを使う時も、頭／尾の操作点は編集用ボーン形状へ追従する。`output/verify-bone-editor-tapered-hit-area.mjs` で形状外クリックは未選択、形状内クリックは選択、CSSテーパー形状、console/page errorなしを確認。画面は `output/bone-editor-tapered-hit-area.png`。`node --check`、標準web-gameクライアント、`npm run build` を通過（既存Vite警告のみ）。

- `2d_bone_editor_split` の画像調整「左右反転／上下反転」が通常画像で効かない不具合を修正。チェック値は現在フレームへ保存される一方、HTML描画がレイヤー基本値の `false` を常に優先していた。通常画像ではフレーム値、モーフ画像ではモーフ値を正本にして描画・オニオンスキンの双方へ反映するよう統一した。`output/verify-bone-editor-image-flips.mjs` で両チェックをONにし、保存された両値とCSS `scale(-1, -1)`、console/page errorなしを確認。画面は `output/bone-editor-image-flips.png`。`npm run build` と標準web-gameクライアントも通過（既存Vite警告のみ）。

- `2d_bone_editor_split` の連続ボーン・メッシュ変形で、緑の帯域（制御点や黄色の幅ハンドル以外）をドラッグすると、全制御点をまとめて平行移動できるようにした。青い画像範囲の移動・四隅リサイズ、各制御点、幅ハンドル、画面パンは従来どおり分離されている。部位分割ではドラッグのたびに選択枠DOMを全再生成していた処理を、同じ枠の座標だけを更新する軽量処理へ置換し、pointer captureを維持してカーソル遅延・枠のずれを防ぐ。`output/verify-bone-editor-range-dragging.mjs` で緑帯域を28px/18pxドラッグし全3点が同量（U+0.0636/V+0.0273）移動、部位分割のドラッグ中も選択枠DOMが同一・console/page errorなしを確認。画面は `output/bone-editor-range-dragging.png`。`node --check`、標準web-gameクライアント、`npm run build` を通過（既存Vite警告のみ）。

- `2d_bone_editor_split` のボーン別モーフで、画像範囲の変更先を通常インスペクターの数値入力ではなく既存の `✂️ 部位分割` ダイアログへ統一した。モーフ選択中に開くと対象ラベルを `モーフ「名称」` と表示し、対象ボーンだけの枠をドラッグ／数値で調整できる。適用時はモーフ固有の `imageCropX/Y/W/H`、部位分割内の回転・左右反転・上下反転、生成済み切り抜き画像だけを更新し、通常画像の切り抜き・共有画像スロット・元画像は変更しない。通常インスペクターの位置・拡大・回転・透明度・左右／上下反転もモーフ選択中はモーフ実データに保存し、リセットもモーフだけを初期化する。通常画像を消す「全部位から画像を外す」もモーフ編集時は隠して誤操作を防止する。`output/verify-bone-editor-morph-crop.mjs` でモーフ作成→部位分割表示→範囲12/8/64/72%＋両方向反転→適用→画像調整欄の両方向反転を確認し、通常画像の範囲不変・モーフのみ更新・console/page errorなしを確認。画面は `output/bone-editor-morph-crop-dialog.png` と `output/bone-editor-morph-crop.png`。`node --check`、標準web-gameクライアント、`npm run build` も通過（既存のVite警告のみ）。

- `AreaMapView` のプレイヤー表示に最後の左右移動向き `facingDirection` を追加。初期は右向き、左／右へ動いた時だけ更新し、停止・会話・梯子／飛行の上下移動では最後の左右向きを維持する。ボーンモーションと通常スプライトを含むプレイヤー全体へ `.left` の反転を適用するため、同じ動作になる。`output/verify-area-map-facing-direction.mjs` で左移動→停止（`facing=-1`、scaleX=-1維持）→右移動→停止（`facing=1`、通常向き維持）、console/page errorなしを確認。画面は `output/area-map-facing-left-stopped.png` と `output/area-map-facing-right-stopped.png`。`npm run build` も通過（既存Vite警告のみ）。

- `2d_bone_editor_split` のレイヤー順をフレーム固有の描画値ではなく、`project.layerOrder` を唯一の正本に統一した。既存JSONは初回読込時だけデフォルトフレームの順を共通順へ移行し、以後の並べ替えはデフォルト＋全モーション全フレームの互換用 `z` へ同時同期する。通常ボーン、連続メッシュ、オニオンスキンはいずれも共通順を読むため、Character Library とゲーム画面の `BoneMotionPlayer` iframe に別のレイヤー計算を持たせない。常時レンダーで全フレームを再同期する無駄も取り除き、新規フレームだけ共通順のzで補完する。`output/verify-bone-editor-shared-layer-order.mjs` で保存済み `ver4_作成` を編集画面・共通プレビュー・Character Library・`middle_terminal_concourse` の実エリアマップで比較し、24ボーン／7連続メッシュのCSS描画順一致、並べ替え後13フレームすべての同期、console/page errorなしを確認。画面は `output/bone-editor-shared-layer-order.png` と `output/character-library-shared-layer-order.png`。`node --check` と `npm run build` も通過（既存Vite警告のみ）。

- 連続メッシュの描画順を、従来の「結合列の先頭ボーン固定」から「結合中で最も手前に置かれたボーン」に変更。これにより `右太腿 → 右すね` では右すね側、`右足 → 右つま先` ではつま先側のレイヤー操作も描画順へ反映される。保存済み `ver4_作成` を読み、右すねを27番、右足／右つま先を5番以下へ動かしたブラウザテストで、右すねメッシュ27・右足メッシュ5へ追従、console errorなしを `output/verify-bone-editor-mesh-layer-order.mjs` で確認。画面は `output/bone-editor-mesh-layer-order.png`。`node --check` と `npm run build` を通過（既存Vite警告のみ）。

- `2d_bone_editor_split` の使用画像セットを、同名画像の再選択時は候補追加ではなく既存 `sourceId` を維持した画像データ更新として扱うよう修正。選択中画像を新内容へ切り替え、共有スロットの切り抜き、メッシュ画像キャッシュ、オニオンスキンも更新する。`output/verify-bone-editor-image-slot-refresh.mjs` で同名の異なるPNGを順に読み込み、候補1件・ID維持・Data URL更新・console errorなしを確認。
- character-library のボーンモーションを area-map で表示する自動フィットを、切替時の1コマ中央基準から「選択モーション全コマの回転後範囲＋足元下端基準」へ変更。走行中の別コマも枠内へ収め、ボーンモーション使用中は旧スプライト用の上下バウンドを重ねない。保存済み `player_3 / ver4_作成` を `middle_terminal_concourse` で待機・右走行させ、95×125枠内で走行6コマ、最下端から枠下端3.27px、左右上下の見切れなし、console errorなしを `output/inspect-area-map-motion-layout.mjs` と `output/area-map-motion-layout-walk.png` で確認。標準web-gameクライアント、`node --check`、`npm run build` も通過（既存Vite警告のみ）。

- `2d_bone_editor_split` で首単体メッシュが上下逆に表示される不具合を修正。首は親接続点が下寄りで実先端がボーン上端にあるため、首で終わるメッシュだけターゲット終点を上端として扱い、元画像を下側＝首根元・上側＝首先端の順で割り当てる。首単体も接続範囲の終了候補へ追加し、旧方向データは `sourceDirectionVersion: 3` へ一度だけ補正する。赤い画像上半分／青い下半分の素材で首単体を作り、赤の平均Yが青より上、制御点Vが下→上、単体1ボーン、console/page errorなしを `output/verify-bone-editor-neck-only-mesh-direction.mjs` で確認。画面は `output/bone-editor-neck-only-mesh-direction.png`。

- `2d_bone_editor_split` の通常インスペクターへ「メッシュ解除」を追加。選択ボーンが連続メッシュに含まれる時だけ、ヘッダーの常時見える `〰×` と画像調整欄の文字ボタンを表示する。`首 → 頭` など確認対象名を出して、ボーンや画像ソースを削除せずメッシュ結合だけを解除し、解除後は両ボタンを非表示にする。保存済み `ver4` の首で、首→頭メッシュ1件だけの解除、メッシュCanvas1枚減少、画像ソースID完全一致、ボーン数維持、console/page errorなしを `output/verify-bone-editor-detach-neck-mesh.mjs` で確認。操作前後は `output/bone-editor-neck-mesh-detach-control.png` と `output/bone-editor-neck-mesh-detached.png`。

- `2d_bone_editor_split` の上腕メッシュ範囲で、既存の「腕まで／手まで」の短長2候補をUI上で明示。終了候補は短い「右前腕（ドット2Dでは右腕）」を先頭、その次に「右手」と並べ、設定欄へ `選択可能: 右前腕まで / 右手まで` を常時表示する。手までの既存設定は削除せず、終了を腕へ変更すると上腕根元・腕接続・腕先端の3点メッシュになる。`output/verify-bone-editor-upper-arm-range.mjs` で候補順、案内表示、3点生成、適用後の上腕→腕範囲復元、console/page errorなしを確認。画面は `output/bone-editor-upper-arm-to-arm-range.png`。

- `2d_bone_editor_split` の連続ボーン・メッシュ変形へ「四角形固定」を追加。ONにすると全制御点の左右幅を統一し、中間点を始点―終点の直線上へ固定する。始点／終点をドラッグすると帯域を四角形のまま任意方向へ傾けられ、中間点はドラッグ位置を中心線へ投影して前後点間を単独移動する。設定は `rectangularSource` として保存・再読込し、反対側メッシュへのコピーにも含める。保存済み `ver4` の3点メッシュで傾斜、全点幅4%一致、中間点の共線・単独移動、両端不動、適用後の復元、console/page errorなしを `output/verify-bone-editor-rectangular-mesh.mjs` で確認。画面は `output/bone-editor-rectangular-mesh.png`。反対側コピー、つま先寸法、既存連続メッシュ、標準web-gameクライアント、`npm run build` も通過。

- 連続ボーン・メッシュ変形の「反対側へコピー」を、コピー先メッシュの事前作成が不要な動作へ修正。対応する反対側ボーン列があればボタンを有効化し、未作成時は反対側のメッシュ結合を自動作成して、使用画像、青い変形範囲、緑の中心線・左右幅・分割点、描画調整値を引き継ぐ。既存コピー先がある場合は従来どおり範囲とメッシュ点を更新する。保存済み `ver4` の右足→右つま先だけがある状態で、左足→左つま先の自動作成、画像名一致、範囲4値一致、緑3点と帯域ポリゴン完全一致、console/page errorなしを `output/verify-bone-editor-opposite-mesh-copy.mjs` で確認。画面は `output/bone-editor-opposite-mesh-copy.png`。つま先寸法・既存連続メッシュ回帰、標準web-gameクライアント、`npm run build` も通過。

- つま先など横向き連続メッシュで、編集画面の指定帯域より狭く画像が切り出される不具合を修正。縦長素材でも描画側が左右幅を常に画像横幅基準で換算していたため、横方向の中心線では上下が見切れていた。メッシュ編集SVGと同じ正規化座標で法線・幅・曲線補間を計算してから画像pxへ変換し、画面上で指定した帯域と実描画を一致させた。ユーザー保存済み `ver4` のメッシュ範囲を変更せず、ボーン／ラベル非表示で足先画像全体が出ることを `output/verify-ver4-toe-source-range.png` で実確認。縦200×横400相当の比率検証では指定Y260～340が描画計算でも同値。つま先寸法テスト、既存連続メッシュ回帰、標準web-gameクライアント、`npm run build` も通過。

- 通常2D・横向きのつま先を、特殊な足形状から他部位と同じ通常の棒ボーンへ修正。横向きは角度-90度で表現し、Wをメッシュの太さ、Hをボーン／メッシュの長さとして反映する。前回形式の `toeR/toeL` を含む既存データは、読み込み時に矩形の見た目を保つようW/Hを入れ替えて角度を補正し、作り直し不要で移行する。つま先単体も連続メッシュ範囲として選択可能。`output/verify-bone-editor-standard-side-toes.mjs` で右つま先H34→68に対して実描画幅32→63px、左右親接続、正面17本維持、console/page errorなしを確認。連続メッシュ回帰、標準web-gameクライアント、`npm run build` も通過。画面は `output/bone-editor-standard-side-toes.png`。

- `2d_bone_editor_split` の新規「通常2D・横向き」へ、右足・左足の先端を親にした「右つま先／左つま先」を追加し、17ボーンから19ボーンへ拡張。つま先は通常ボーンとして回転・移動・画像設定でき、脚の連続メッシュ、交換パーツグループ、左右メッシュコピーにも含める。実つま先がない通常2D・正面／ドット2Dでは従来の仮想つま先処理を維持し、既存保存データへは自動追加しない。`output/verify-bone-editor-standard-side-toes.mjs` で横向き19本・左右の親接続・正面17本維持・console/page errorなしを確認し、連続メッシュ回帰、標準web-gameクライアント、`npm run build` も通過。画面は `output/bone-editor-standard-side-toes.png`。

- `バトル情報ver2` のキャラ配置へ「全体位置」を追加。`battleFormationUnits.json` の `baseline.offsetX/offsetY` を全キャラへ適用し、Xは敵側へ正値・味方側へ負値、Yは敵味方へ同値を適用する。個別X/Yは全体位置へ加える差分として維持する。初期基準はX26/Y55だが編集画面から変更・保存でき、ユーザーが保存した最新のX3/Y78もそのまま保持した。飛行キャラの影も全体位置へ追従。`output/verify-battle-ver2-character-baseline.mjs` は保存済み共通値を動的に読み、X+4/Y+10の非保存プレビューで敵X正・味方X負・共通Y・影の追従、console/page errorなし、テスト前後でJSON不変を確認する。画面は `output/battle-ver2-character-baseline.png`。

- `バトル情報ver2` のキャラXY基準を「敵X+26／味方X-26／共通Y+55」へ統一。前列／後列ごとの旧X補正と全個体差を削除し、`battleFormationUnits.json` は敵4体・味方3体すべて `offsetX: 0 / offsetY: 0` にした。編集値0のとき、地上キャラは敵X+26/Y+55、味方X-26/Y+55となる。飛行キャラは同じ足元基準から既存の浮遊量だけ画像を上げる。不要との指定により移行前バックアップも削除。`output/verify-battle-ver2-character-baseline.mjs` で全7体の編集値0、各CSS基準値、console/page errorなし、テスト前後で配置JSON不変を確認。キャラ直接ドラッグ・XY数値調整の回帰、標準web-gameクライアント、`npm run build` も通過。画面は `output/battle-ver2-character-baseline.png`。

- `バトル情報ver2` のキャラ配置で、JSON・画面状態の `offsetX/offsetY` は変わるのに画像が動かない不具合を修正。描画側が廃止済みの `slotOffsetX/slotOffsetY` を参照していたため、敵画像・味方画像・飛行キャラの影を保存形式と同じ `offsetX/offsetY` へ統一した。ブラウザ内だけの非保存テストでENEMY-04のXを-21→24に変更しCSS座標も45px変化、ENEMY-01のYを+30して飛行画像と影のCSS座標も各30px変化することを確認。ユーザー保存済みの `battleFormationLayout.json`（SHA-256 `C3680EFC...`）と `battleFormationUnits.json`（SHA-256 `937AE56F...`）はテスト前後で不変。

- `バトル情報ver2` の配置面調整へ「キャラ配置」を追加。敵4体・味方3体を一覧から選び、列（前/中/後）・行（1～3）・X/Y微調整を数値とスライダーで変更できる。実画面のキャラをドラッグすると最寄りの3×3マスを自動判定し、マス内のずれをpxで保持する。同じマスへの複数配置も可能。飛行キャラは画像の浮遊量を維持し、影の足元だけを配置基準にする。保存先はグリッド形状の `battleFormationLayout.json` と分離した `src/data/battle/battleFormationUnits.json` で、両方を編集パネルの保存操作から更新する。`output/verify-battle-ver2-character-placement.mjs` でENEMY-04を前列2→中列2、X-21/Y-25へ直接ドラッグし、X24へ数値調整、保存形式の検証、console/page errorなしを確認。自動テストは `validateOnly=1` を使い、実JSONを保存・復元しない。配置面テストとキャラ配置テストの前後SHA-256が両JSONとも同一であることも確認した。既存配置面テスト、標準web-gameクライアント、`npm run build` も通過。画面は `output/battle-ver2-character-placement.png`。

- `バトル情報ver2` の `UI MODAL` に「配置面調整」を追加。独立モーダルでは実画面が見えないため廃止し、調整中だけ下段 `command-area` を「基準点／3×3区切り／表示／JSON」のタブ式パネルへ置き換える。上のバトルフィールドは常時表示し、敵外側上下・中央上下・味方外側上下の6基準点を実画面上の色付き点で直接ドラッグできる。下段のスライダー＋数値とも双方向同期し、グリッドとキャラクター足元は同じ四角形補間座標へ追従する。表示タブでは敵味方共通の線幅を0.25～4pxでリアルタイム調整でき、現在位置は変えず既定値を0.75pxにした。「保存値へ戻す」「JSONへ保存」「調整終了」を用意し、`src/data/battle/battleFormationLayout.json` を `/api/local/battle-formation-layout` 経由で原子的に上書きする。専用JSONの保存だけはVite HMR対象外とし、保存後も画面を再読込せず調整を継続する。`output/verify-battle-ver2-grid-ui.mjs` で実画面＋下段パネルの同時表示、6操作点、直接ドラッグ中央上X52/Y42、基準点12組、区切り4組、線幅0.55pxのプレビューと保存、JSON表示、保存後のパネル維持、調整終了で通常コマンド復帰、保存ファイル再取得と元データ復元、地上足元ずれ0px、飛行影ずれ0px、console/page errorなしを確認。`npm run build` と標準web-gameクライアントも通過。画面は `output/battle-ver2-formation-editor.png`。

- `バトル情報ver2` のフィールド配置を敵・味方それぞれ前/中/後3列×3行の9マスへ変更。旧 `position: front/back` は従来の列へ入り、`middle` / `center` も中列として使える。盤面全体を横へ傾ける `skewY` と背景を暗くする面塗りは撤去。現在のSVG形状と足元座標は上記の `battleFormationLayout.json` を共通参照する。1体だけの列は中央行へ置き、飛行キャラは画像だけ上昇して影を所属マスの足元へ残す。`UI MODAL` では「グリッド線 ON/OFF」「文字 ON/OFF」を横並びにし、線と「敵 後1」「味 前1」などの配置文字を独立して切り替える。UIModal本体の操作ボタンと世代/マーカー切替も共通定義から読み込み、バトル情報1親画面専用で無反応になる項目は一覧対象外とした。

- `character-library` の状態別スプライトへ自由な再生順を追加。画像のコマは左上から1始まりで数え、該当コマの画像付きカードをドラッグして順番を変更する。`frameOrder` は1始まりの配列でJSONへ保存され、設定プレビューとエリアマップのプレイヤー再生が共通処理で参照する。「通常順に戻す」で1からの並びへ復元できる。列・行変更時、通常順のままなら新しい総コマ数へ自動展開する。`output/verify-character-frame-order.mjs` で2行×4列の1番カードを4番位置へドラッグし、`2,3,4,1,5,6,7,8` の元コマと表示位置が全8段階で一致した後、通常順へ復元でき、console/page errorなしを確認。標準web-gameクライアントと `npm run build` も通過。画面は `output/character-frame-order.png`。

- `character-library` の状態別スプライトシートへ横列数・縦行数を追加。2行×4列などを左上→右→次行の順で再生し、合計枚数は列×行で自動設定する。旧 `frames` データは横frames列×縦1行として読み込み、設定プレビュー・一覧サムネイル・マップ上プレイヤー/NPCで共通の切り出し処理を使用する。`output/verify-character-sprite-grid.mjs` で横4×縦2＝8枚、背景サイズ400%×200%、上段4位置→下段4位置、console/page errorなしを確認。旧横2枚プレビュー回帰、標準web-gameクライアント、diff check、`npm run build` も通過。画面は `output/character-sprite-grid-2x4.png`。

- `2d_bone_editor_split` の首→頭の連続メッシュで、画像上側へ首、下側へ頭が割り当たる逆転を修正。親子順が下から上へ進む首→頭では初期メッシュ点の画像Yも下から上へ並べ、画像上側＝頭、画像下側＝首にする。旧JSONの上→下データも初回利用時に一度だけ移行し、上下反転で手動補正済みなら見た目を保ったまま設定を正規化するため、作り直しは不要。腕・脚など下向きの列は従来どおり。`output/verify-bone-editor-neck-head-mesh-direction.mjs` で首→頭の選択、上端「頭・先端」／下端「首・根元」、旧データ移行、console/page errorなしを確認。既存の右腕連続メッシュ回帰、標準web-gameクライアント、`node --check`、diff check、`npm run build` も通過。画面は `output/bone-editor-neck-head-mesh-direction.png`。

- `2d_bone_editor_split` に前フレーム1枚のオニオンスキン表示を追加。ヘッダーの「前」でON/OFFし、1000×1000の専用Canvasへ通常画像・ボーン・連続メッシュを合成して25%透明で現在フレームの背後へ表示する。フレーム番号が変わった時とON切替時だけ再生成し、ドラッグ中は再描画しない。先頭フレームでは非表示、選択枠・ボーン名・操作点は合成しない。`output/verify-bone-editor-onion-skin.mjs` で通常画像＋連続メッシュ、Canvas1枚、約4.7万描画画素、25%透明、ドラッグ前後のCanvasハッシュ完全一致、先頭フレームとOFF時の空Canvas、console/page errorなしを確認。全体移動軸固定と既存連続メッシュの回帰、`node --check`、diff check、`npm run build` も通過。画面は `output/bone-editor-onion-skin.png`。

- `2d_bone_editor_split` の全体移動へ「自由・横固定・縦固定」の軸指定を追加。全体移動中だけキャンバス上部へ ✣／↔／↕ を表示し、Shiftドラッグでは移動量の大きい軸へ一時固定する。選択軸は `meta.wholeMoveAxis` として保存し、個別ボーン・背景移動には影響させない。`output/verify-bone-editor-whole-move-axis-lock.mjs` で横固定時Y不変、縦固定時X不変、自由時XY変更、Shift時の優勢軸固定、保存・再読込、console/page errorなしを確認。画面は `output/bone-editor-whole-move-axis-lock.png`。

- `2d_bone_editor_split` の連続メッシュで、青い「関節の変形範囲」と緑のメッシュ点を反対側へコピーする操作を追加。左右位置を反転せず、`sourceRect` のX/Y/幅/高さと `controlPoints`（中心点、左右幅、分割点名、ボーン列上の位置）を同値でコピーし、画像・ボーン列・曲線の滑らかさ・倍率・角度・反転は変更しない。反対側に同じ開始・終了範囲のメッシュがない場合はボタンを無効化する。`output/verify-bone-editor-opposite-mesh-range-copy.mjs` で右太腿→右すねから左側へのコピー、非対象設定の維持、保存・再読込、console/page errorなしを確認。画面は `output/bone-editor-opposite-mesh-range-copy.png`。

- `2d_bone_editor_split` の連続メッシュ対象を開始・終了ボーンで指定できるように変更。太腿→脛、上腕→前腕（ドット2Dでは上腕→腕）、足→つま先を選択可能にし、既存JSONの `boneChain` 形式は維持した。つま先は独立ボーンを増やさず、足ボーンの先端点として2制御点で扱う。`output/verify-bone-editor-mesh-chain-range.mjs` で3範囲の選択、通常2Dの上腕→前腕、足→つま先の描画・保存・再読込、console/page errorなしを確認。画面は `output/bone-editor-mesh-chain-range-dialog.png`。

- `2d_bone_editor_split` の背景特殊レイヤーを最背面固定から移動可能へ変更。`background.layerNo`（1～ボーン数+1、既存/初期値1）をJSONへ保存し、BONES一覧の前後矢印、ドラッグ&ドロップ、背景インスペクターの表示順入力で変更できる。背景位置を挿入した分だけ通常ボーンと連続メッシュの表示zを同じ規則で繰り上げ、重複を作らない。`output/verify-bone-editor-background-layer-order.mjs` で1→矢印5→数値20（最前面）→ドラッグ13、各段階の背景/全ボーン/全メッシュz、一覧位置、JSON再適用後13維持、console errorなしを確認。画面は `output/bone-editor-background-layer-order.png`。

- `2d_bone_editor_split` の背景画像をBONES一覧の初期最下段「背景画像」特殊レイヤーへ移動。選択すると右の `inspector panel-compact` が背景専用表示へ切り替わり、画像設定・削除、X/Y、大きさ、透明度、左右/上下反転を編集できる。背景選択中かつ画像設定済みならキャンバス全域のドラッグで背景だけを移動、ホイールで拡縮し、通常ボーンを一覧から選ぶとボーンインスペクターへ復帰する。表示・動作設定モーダルの重複背景項目は削除。`output/verify-bone-editor-background-layer-inspector.mjs` で初期最下段配置、専用インスペクター、X64/Y32、105%、透明度60%、左右反転、ボーン選択復帰、console errorなしを確認。画面は `output/bone-editor-background-layer-inspector.png`。

- `2d_bone_editor_split` の通常編集画面へ全体拡縮モード「拡」（S）を追加。現在フレームの回転後ボーン外周から全体枠を作り、四隅ハンドルのドラッグで反対角を固定したまま、全ボーンのW/H、親子の相対X/Y、ルート位置を同一倍率で変更する。縦横比・関節接続・設定画像・連続メッシュの配置を維持し、操作はUndo可能。`output/verify-bone-editor-whole-scale.mjs` で右上角から約119.6%へ拡大し、全W/H倍率差0.000012未満、固定左下角X/Y差0、Undo完全復元、console errorなしを確認。画面は `output/bone-editor-whole-scale.png`。

- `2d_bone_editor_split` のヘッダー表示ツールへ中心ガイド切替「＋」を追加。中心十字・中心円・縦横の中央補助線と、地面中央から上へ伸びる目印をまとめてON/OFFでき、`meta.display.centerGuides` としてJSONへ保存する。中心補助線・十字・中心円・地面線・地面中央目印は間隔のある点線へ変更。`output/verify-bone-editor-center-guides.mjs` でON→OFF→JSON再適用後もOFF→ONの切替、全ガイドの点線CSS、console errorなしを確認。画面は `output/bone-editor-center-guides.png`。

- `2d_bone_editor_split` の背景画像を通常キャンバス上で直接調整できる「背景位置を調整中」モードを追加。設定画面の「画面を見ながら位置調整」でモーダルを閉じ、画像をドラッグしてX/Y移動、ホイールで5%刻みの拡大縮小、画面上のX/Y/倍率表示を見ながら微調整できる。調整中はボーン入力を無効化し、完了またはEscで通常編集へ戻る。キャラクター座標の中央へ、パン・ズームに追従し画面上の太さと大きさを維持する十字＋中心円と中央軸線も追加。`output/verify-bone-editor-background-direct-adjust.mjs` でドラッグX72/Y36、ホイール105%、調整中のボーン未選択、完了後のボーン選択復帰、十字とキャラクター中心の一致、console errorなしを確認。画面は `output/bone-editor-background-direct-adjust.png`。

- `2d_bone_editor_split` のプロジェクト共通設定に `background` を追加し、設定画面から背景画像の設定・削除、X/Y移動、10～400%の大きさ、0～100%の透明度、左右反転、上下反転を編集できるようにした。背景はキャラクターキャンバス内の最背面に描画し、通常画面のズームとパンに追従する。画像本体は既存 `imageSources` で共有し、背景から削除しても他用途が参照中ならソースを残す。`output/verify-bone-editor-background-image.mjs` でX80/Y-40、大きさ60%、透明度35%、左右・上下反転を設定し、JSON再適用後も値・画像・CSS変形が一致、console errorなしを確認。画面は `output/bone-editor-background-settings.png` と `output/bone-editor-background-image.png`。

- `2d_bone_editor_split` の部位分割で、範囲内部のドラッグまで表示パンに奪われていた回帰を修正。範囲内ドラッグは部位範囲の移動、四隅はサイズ変更、範囲外の空白ドラッグだけを画面移動に戻した。地面線は `ground.enabled`（当たり判定）とのAND条件を外し、`display.groundVisible` のON/OFFだけで表示する。ラベルに `GROUND Y 700` のように設定座標も表示。`output/verify-bone-editor-editing-interactions.mjs` で部位範囲X25/Y0→X31.4/Y2.8の移動と空白パンを両立、`output/verify-bone-editor-crop-and-ground-fixes.mjs` で地面判定OFF・地面線ON時にY700の線がキャンバス内へ表示され、console errorなしを確認。画面は `output/bone-editor-editing-interactions.png` と `output/bone-editor-ground-visible-with-collision-off.png`。

- `2d_bone_editor_split` の通常編集操作を改善。B+の新規ボーンは選択中ボーンを親とし、親の尾と新規ボーンの頭を接続ONで接続、全フレームで選択中ボーンの直上（Z+1）へ挿入する。未選択時だけ親なしのルートとして500,500へ追加する。名前確定を他のインスペクター適用から分離し、Enterとフォーカス外れで名前だけを保存するため、移動後のX/Yが接続初期位置へ戻らない。通常キャンバスにホイール35～300%拡大と空白ドラッグの表示移動を追加。部位分割画面は範囲外の空白ドラッグで表示移動し、部位範囲内のドラッグで範囲移動、大きさは四隅ハンドルで操作する。`output/verify-bone-editor-editing-interactions.mjs` で腰を親に設定、腰尾(0.5,0)と追加接続点(0.5,0)の一致、腰Z9→追加Z10、移動後(65,37)のEnter/選択外確定後維持、112%拡大中のボーン移動座標補正、通常画面パン、部位分割248%時のパン、console errorなしを確認。画面は `output/bone-editor-editing-interactions.png`。

- `2d_bone_editor_split` の通常画面は、腰を含む全ボーンで同じ操作に統一。選択枠と四隅ハンドル、W/H入力はボーン本体の大きさを変更する。メッシュ変形対象の `sourceRect` は「連続メッシュの画像編集」でのみ変更でき、通常画面の角ドラッグでは変化しない。

- 保存中の「鎧デフォルト」は、旧腰骨格が腰H303のうち中央から胸接続までの40%（121.2px）しかメッシュ長に使っていなかった。読み込み時に腰根元を下端、胸接続を上端とし、腰Hそのものが「腰根元→胸接続」の100%になるよう自動変換。旧H303はH121.2へ正規化しつつ、胸・脚など子孫の画面位置と画像の見た目は保持する。部分データの旧基準ポーズもデフォルト姿勢で補完して変換するため、既存JSONの作り直しは不要。`output/verify-bone-editor-waist-mesh-resize.mjs` で、腰H121.2、上下端の接続、通常画面でのサイズ変更後も `sourceRect` 不変、console errorなしを確認。画面は `output/bone-editor-waist-mesh-range-before.png`。

- `2d_bone_editor_split` の表示時レイヤー順を重複なしの `1..N` へ安定正規化。メッシュCanvasの表示zは「構成ボーン最大z+1」から先頭ボーンのzへ変更し、右太腿を腰より奥に置いた際に右脚画像だけが手前へ出る問題を解消した。`output/verify-bone-editor-layer-normalization.mjs` で既存モーション2フレーム目が1～17の重複なし、腰/胴体メッシュがz9、右太腿/右脚メッシュがz8、console errorなしを確認。画面は `output/bone-editor-layer-normalization.png`。

- `2d_bone_editor_split` の画像範囲編集で、X位置とW横幅をチェック済み全部位の共通値へ変更。数値入力、選択中の枠の横移動、左右角のドラッグのどれでも、全共有部位へ同じX/Wをコピーする。Y位置とH高さだけが部位別。`output/verify-bone-editor-shared-crop-width.mjs` で胸・腹・腰が数値変更後X25/W60、角ドラッグ後X25/W51.25、横移動後X31/W51.25で全件一致し、console errorなしを確認。画面は `output/bone-editor-shared-crop-width.png`。

- `2d_bone_editor_split` にソースJSON保存型のモーションライブラリを追加。起動時に `src/data/motion/boneMotionProjects.json` の一覧を表示し、保存済みカードから編集対象を開く、新規標準人型へ初期化する、ブラウザ作業中データを開く、削除する操作を用意した。保存メニューの保存名と「ソースJSONへ保存」はViteローカルAPIを通じて追加・上書きし、Ctrl+Sも同じ保存を実行する。画像角度ヘッダーはドラッグ中に画像へCSS回転を即時反映し、終了時に確定プレビューを再生成する。`output/verify-bone-editor-source-library-and-live-rotation.mjs` でFPS12の保存・一覧再選択、ドラッグ中25°、標準17ボーン/1フレームへの初期化、console errorなしを確認。検証用保存データは終了時に削除済み。画面は `output/bone-editor-source-project-list.png` と `output/bone-editor-source-library-live-rotation.png`。

- `2d_bone_editor_split` の画像範囲編集を、選択中の1ボーンだけを見る方式から、画像を使う全ボーンの部位枠を画像上へ同時表示する方式へ変更。枠または右側の部位名から編集対象を切り替え、胸・腹・腰などの範囲を同じ画像内で個別指定できる。元画像の角度は画像上端の「画像角度」ヘッダーを横ドラッグして変更する。選択部位の画像解除時に残っていた `imageFragmentData` も削除し、「全部位から画像を外す」で共有先と未使用の共有元画像を一括削除可能にした。`output/verify-bone-editor-multipart-header-rotation.mjs` で3枠同時表示、60pxドラッグで30°、個別解除、全部位解除、共有元削除、console errorなしを確認。画面は `output/bone-editor-multipart-header-rotation.png`。

- `2d_bone_editor_split` で、ボーン選択時の微小なマウス移動が回転ドラッグとして即時反映される問題を修正。回転・移動・全体移動・サイズ変更はいずれも4px以上動かした時だけ履歴保存と編集を開始し、クリック選択や1〜2pxの手ぶれではポーズを変更しない。保存済み角度17°を再読込した状態でクリック後17°維持、2px移動でも初期7°維持、24pxドラッグ時のみ17°→15°へ変更、console errorなしを確認。検証は `output/verify-bone-selection-drag-threshold.mjs`、画面は `output/bone-selection-drag-threshold.png`。

- `2d_bone_editor_split` の元画像範囲編集に左右反転・上下反転を追加。回転と反転を元画像へ先に適用し、その結果から共有先ボーン別の透過PNG断片を生成する。UI説明も「1枚の胴体画像を胸・腹・腰へ共有して3範囲に分ける」例へ更新。ブラウザで胸から胴体画像を登録し、腹・腰を共有、左右反転、縦3分割を実行。3部位が同一 `imageSourceId`、異なる3つのPNG断片、`cropFlipX: true`、console errorなしを確認。画面は `output/bone-editor-torso-split-flip.png`。

- `2d_bone_editor_split` の画像範囲編集をv35化。元画像を-180〜180°で回転してから共有先ボーンごとに範囲指定でき、適用時は各範囲を独立した透過PNG断片として生成するため、同じ元画像が各部位に重複して表示されない。保存メニューには、現在フレームのボーン範囲・関節・部位名を出力する「素材作成ガイドPNG」を追加。右上腕／右前腕／右手への共有・30°回転・別断片生成（3つとも異なるData URL）とガイドPNGのダウンロード、console errorなしを `output/verify-bone-editor-crop-and-guide.mjs` で確認。画面・ガイドは `output/bone-editor-rotated-crop.png` と `output/bone-editor-material-guide.png`。

- Guest画面を「動作確認」と「ゲーム作成」の2タブへ分割。動作確認側にはデモ・各種情報／バトル確認、ゲーム作成側には既存の作成・設定ツールを整理して配置した。追加された独立アプリ `2d_bone_editor_split` は「2Dボーン・モーション作成」から `/2d_bone_editor_split/` へ同一タブで開く。`npm run build`、Guestタブ切替、ボーンエディタ遷移、console errorなしを確認。スクリーンショットは `output/guest-menu-create-tab.png`。

## Task memo

- ショップに商品の購入・売却機能を追加する。
- ショップに注文機能を追加する。注文ではカスタム品を作成してもらう流れにする。
- キャラクターごとのイラストを登録できるようにする。
- 立ち絵の変更機能を追加する。将来的にはレイヤー単位で部分ごとに差し替える。

### MP3利用規約メモ（びじえもん / BGMemon）

- 対象フォルダ: `src/assets/audio/bgm/robot`
- 商用・非商用を問わず利用可能。
- クレジット表記が必要（「びじえもん」または「BGMemon」）。
- 楽曲使用の連絡は任意。
- 著作権は「びじえもん」に帰属。
- 楽曲利用により生じた損害・問題について、提供者は責任を負わない。

- Machine shop: compressed the header to 45px with the back arrow on the left and the shop name right-aligned. The purchase summary and clerk speech bubble are now borderless, semi-transparent overlays with no outer border color. Verified at 540x1000; the header title is within the right edge and both overlay borders compute to 0px.
- Machine shop: gave the compact header 12px more vertical room, positioned the left back arrow lower, and reduced the transaction area's fixed height by the same amount. At 540x1000 the clerk visual, message, and product detail now begin at y=59/348/407 respectively and retain a 74px gap before the bottom return button.
- Machine shop: it had been routed to `explorationFull.css`, which disables the global transform, despite calling `applyGlobalScale()`. It now uses the same global 720x1280 scaling path as the machine/status screens. A shop-local centered base frame avoids inherited padding shifting the scaled UI off-screen; at 540x1000 it computes to `scale(0.75)` and occupies x=0..540, y=20..980.
- Machine shop: retained the common global scale and increased shop text styles about 35% (base body 20px; product rows 23px; message/detail 20px; headers and controls enlarged proportionally). The scaled 540x1000 visual was checked with no horizontal clipping.
- Guest start: the stale character was in `sessionStorage`, not localStorage. `login.vue` now clears `active-adventure-character` and `machine-world-character` before the login screen's "機械で始める" route to `/guest`; seeded stale data was cleared and the original test battle appeared at 540x1000.
- Battle UIModal: added a `ルーン雨` control. It toggles a pointer-free full-screen green rune-stream overlay (26 independently timed columns using the existing rune font stack) above the battle view. Browser-tested at 540x1000: enable created the layer and columns, and pressing the control again removed it without console errors.
- Global sound settings: added a BGM volume slider to the battle OPTIONS SOUND section. Values are stored in `localStorage` under `global-bgm-volume-v1` and exposed through `getBGMVolume`/`setBGMVolume`; unset storage defaults to 100%. Browser verification saved 42% as `0.42` and displayed the BGM row beside SE.
- Machine-world BGM: added a shared robot BGM loader/player for `src/assets/audio/bgm/robot`. Normal guest/machine screens loop `incredible.mp3`; opening BattleView switches to `zensen he totugekiseyo.mp3`, and closing battle restores the normal track. The current global volume is applied to the active player; browser interception verified the paths, loop state, switch, and 30% setting producing 0.21 volume from the 70% track base.
- Normal-screen settings: added a `設定` button to both `GuestView` and `MachineAdventureView`. It opens the shared `OptionsModal` in sound-only mode, allowing SE/BGM volume changes from either screen while retaining the existing full options panel in battle.

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


## 2026-08-05 Default exploration entry

- Added a logged-in Dashboard button that bypasses server character collection and opens `/exploration` with default settings.
- Added `ChoiceExplorationView.vue`: it starts at `upper_terminal_concourse`, displays available area exits as choices, supports inspecting the current area, and maintains an in-session back history. Existing side-scroll exploration screens and data remain unchanged.
- The new route uses the full-screen exploration layout, avoiding the portrait-only scaled shell used by the existing dashboard.
- Browser screenshot review found the header competing with its return control; it now uses two full-width rows, and the choice list can scroll on shorter screens.
- `npm run build` passed. Browser smoke checks opened `/exploration`, inspected the initial area, and selected an exit to move to `upper_shared_spine`; the final screenshot confirmed the destination name, navigation choices, and no visual clipping.
- The temporary default-start buttons were removed from login and dashboard because the default starting configuration needs to be decided before exposing the flow. The choice-exploration view remains available as implementation work, but has no public entry point.
- Character selection now separates fantasy and machine-world cards. An explicit `world` field takes priority; existing characters with the race `オートマン` fall back to the machine-world theme. The character status confirmation modal receives the same theme.
- `npm run build` passed. The required browser client confirmed the existing unauthenticated guard still returns `/CharacterSelectView` to login; a live fantasy/machine card visual check remains blocked until character collection access is restored.
- When the machine-world tab has no characters, it now offers a standard start with an Automaton at race level 10 and a standard equipment preset. Selecting a machine character or this standard start routes to `/machine-world`, which hosts the existing battle-information screen; selection metadata is kept only for the current browser session.
- The same standard-start option is also shown when the whole character collection is empty.
- The machine-world tab now replaces the global `background-image.webp` with `歯車の背景.png`; it restores the original background for fantasy and when leaving character selection. Standard start is rendered as a machine character card, not a separate action button.
- `npm run build` and targeted `git diff --check` passed. The required Playwright client opened `/machine-world`; its text state reported the standard Automaton Lv10/standard-equipment metadata and the inspected screenshot showed the existing battle-information UI without visual breakage. Character-select card rendering remains blocked by the current login/collection failure.
- The standard Automaton card now follows the same selection flow as normal fantasy cards: it builds a complete temporary character and opens `CharacterStatusModal`; only that modal's `冒険を続ける` confirmation enters `/machine-world`. Build passed. The browser client still redirects direct character-select access to login without the unavailable collection/auth state, so this card-to-detail interaction awaits live verification after collection recovery.
- Guarded `getRollIcon()` against an unknown or missing role record. The default Automaton can now open the status modal even when `オートマン` has no matching `画像url` record; its icon simply remains empty instead of throwing. Build and machine-world browser smoke screenshot passed.
- Refined the machine-themed character detail UI: missing role images now render `Ω`/`—` fallbacks rather than broken-image badges; the base tab uses the dark cyan machine panel; and its race/class fields now follow the same Role ordering as the rest of the app (Role[0] = race, Role[1] = class). Machine confirmation/cancel buttons match the theme. Build passed; direct character-select visual validation remains auth-blocked.
- Audited every currently visible CharacterStatusModal tab (基本, ステータス, 技, 手持ち, 進行). Machine theme now reaches scoped child content through parent deep selectors: status tables/buttons, skill panels/sub-tabs, inventory list/detail states, and progress panels use the same cyan/dark palette. The unused empty skill-creation spacer is hidden only in machine mode. Fantasy styling is unchanged. Build/diff checks passed; browser access still lands on login because no authenticated collection session is available.
- Temporarily changed the machine character confirmation destination from `/machine-world` to `/guest`. The full selected character is stored in sessionStorage as `active-adventure-character` (while retaining the legacy `machine-world-character` key). GuestView reads that data, reports CHARACTER access plus unit/race/level, returns to CharacterSelectView, and exposes the handoff in `render_game_to_text`; ordinary guest access remains unchanged. Build/diff checks and a guest-mode browser screenshot passed. Auth-blocked character selection prevents an automated end-to-end screenshot of the character-mode handoff for now.
- Added a temporary redirect from the legacy `/machine-world` route to `/guest`, so any lingering navigation cannot open the battle screen. Build/diff checks passed. The browser client opened `/machine-world`, text state reported `guest-terminal`, and the inspected screenshot showed the guest terminal rather than BattleView.
- GuestView now passes the active adventure character to both battle modal variants. `battleCharacterAdapter.js` converts the party into battle allies from the character's real name, role, level, HP/MP, and optional icon; character-mode battle has no test allies or placeholder enemies. BattleView replaces the ATTACK EFFECT TEST panel with an active-unit summary, and the ver2 test entry is hidden in character mode. Browser verification with an Automaton Lv10 session showed `オートマン`, HP 150/150, MP 70/70, no `UNIT-01`, no ATTACK EFFECT TEST panel, no test enemies, and no console errors. Normal guest battle smoke also passed.
- Replaced the character-start destination with dedicated `/machine-adventure`; GuestView remains the development menu. The new screen reads the active character session, exposes status and battle actions, and its status action reopens CharacterStatusModal with a `閉じる` confirmation. Legacy `/machine-world` redirects there. The detail border is now 3px in machine theme (4px otherwise); a seeded Automaton browser check opened the screen and status detail without console errors.
- The auto-created Automaton is marked only while unsaved. On first `冒険を続ける`, CharacterSelectView POSTs it to the existing authenticated `/api/characters` collection endpoint, then clears that marker and keeps it in the local selection list so future use follows the normal collection path. Registration failure keeps the user in the detail screen rather than starting with an unsaved character. Live registration remains unverified while collection access is unavailable.
- Added a view-only machine-world shop at `/machine-shop`, opened from the machine adventure menu. It reads the existing Excel APIs for shops, items, equipment, and materials; players can choose a shop and inspect its product list plus price, category, material, and description. The required browser check selected `アルジビア王国` (24 products) successfully, screenshot review passed, and `npm run build` passed. Purchasing and inventory changes are intentionally not implemented yet.

- Changed machine shop flow to a directory first, then a storefront. The storefront overlays semi-transparent product panels over a temporary shop background, shows the temporary clerk image with a contextual speech bubble, and has purchase/sell/order tabs. Only purchase displays catalog details; sell and order intentionally show integration placeholders until inventory/order systems exist. Excel shop parsing now exposes optional 店員 and 背景 image-name columns; blank legacy rows fall back to セレス.webp and 魔法研究.webp. Browser screenshots verified the directory and a selected storefront, including アルジビア王国 with 24 products. Build and diff checks passed.
- Corrected shop image resolution to use the existing getCharIllust() asset resolver in statData.js, rather than a new static-server path. Both セレス/セレス.webp and 魔法研究/魔法研究.webp resolve from src/assets/images/illust; the selected storefront screenshot verified the clerk and background render correctly.
- Reworked the shop UI for the existing 720x1280 portrait scale: the clerk now occupies the upper stage, selecting a store opens three large transaction choices (購入/売却/注文), and the selected transaction opens a scroll-snap horizontal carousel with no persistent tab row. Mobile-width automation selected the shop, opened purchase, swiped to order, and reported activeAction=order; the 390x844 screenshot was reviewed. Build and diff checks passed.
- Changed the purchase storefront to the requested mobile two-column arrangement: 35% left clerk/message column and 65% right transaction area, with product names large and left aligned above smaller right-aligned prices. The product list fills the upper right and the selected product detail fills the lower right. `/machine-shop` now uses the full-screen layout instead of the 720px scaled shell, preventing horizontal clipping on phones. A 390x844 screenshot and measured layout confirmed 112px/208px columns; build, diff, and browser-client checks passed.
- Simplified the shop shell: MachineShop uses 1px outer padding and no extra panel border/padding, the large generic shop heading was removed, and the store name remains in the only header. The purchase layout is now 50:50: clerk/message plus selected-product detail on the left, and the large product list on the right. The 390x844 visual check and browser client passed without shop resource errors; build/diff checks passed.
- Enlarged the transaction clerk illustration from 240x290 to 480x580 and shifted it downward within the left visual area. The mobile screenshot was reviewed; build and browser-client checks passed.
- Shop equipment details now follow the same hand-held presentation: ruby name, classification/material, weapon power breakdown, attributes, guard, critical values, armour resistance/skill bonuses, stat bonuses, penalties, traits, and description. Shared equipment type/display rules now live in `src/constants/equipmentDisplay.js`; the hand-held tab also consumes the common equipment-type and physical-damage categories. A 390x844 browser check selected `鉄の剣` and confirmed its full stat breakdown. `npm run build` passed; `git diff --check` still reports the pre-existing trailing whitespace in `.gitignore`.
- Bound the shop storefront to the portrait viewport: the transaction area now uses the available height, its product/detail regions scroll internally, and the machine-world return button stays visible. Removed the redundant `購入する商品` label and placed the selected product price in the detail card's upper-right. A 390x844 browser check confirmed document height equals viewport height (844px), the return button is visible, and the product detail remains inside the storefront. Build and scoped diff checks passed.
- Raised the transaction speech bubble and selected-product detail by allocating 35% (previously 45%) of the left column to the clerk visual. The detail card now leaves an explicit 4px bottom gap before the transaction boundary, preventing the lower controls from feeling adjacent. Tightened the ruby/price layout so the right-aligned price stays fully readable without covering the product name. The reviewed 390x844 screenshot confirmed the 4px gap and no page overflow; build and scoped diff checks passed.
- Corrected a real overlap found at 540x1000: the left detail element extended 15px below the return-button top despite being visually clipped. The transaction height now explicitly reserves the 48px return-button area, leaving a measured 29px safe gap. Product detail header is now sticky while its contents scroll; price is placed first at its upper right and the product name/ruby follows below. Non-header transaction spacing is reduced to a 5px baseline. Build and scoped diff checks passed.
- Shop header now shows the active adventure character's `所持金` on the upper-right and `所持品 current / max` below it. It reads `active-adventure-character` from sessionStorage; absent character data safely renders `0 G` and `0 / 15`. The shop text-state output includes the same resource values. Browser verification seeded 1234 G with two items and confirmed `所持金 1234 G` / `所持品 2 / 15`; build and scoped diff checks passed.
- Moved character resources from the store header into a compact panel at the clerk image's upper-left. It shows money, the purchase total directly below it, and inventory count. Clicking a product in purchase mode now adds it to the planned-purchase list (repeated clicks raise its quantity); the panel lists those items and the cumulative total. This is still a preview cart only: it does not yet deduct money, add inventory, or persist a transaction. Browser verification added 下位水薬 twice and 水薬 once, showing `合計 380 G` and the correct quantities; build and scoped diff checks passed.
- Changed purchase quantity control so tapping a product in the right list only selects it. The selected-product detail now has its own compact ▲ quantity ▼ control at the upper-left, opposite the price. Purchase-plan quantities are displayed at the left of each planned-item row. The clerk information panel widened to 178px to accommodate the normal six-digit money limit. Browser verification confirmed list controls are absent, detail controls adjust the planned total and quantity, and `123456 G` renders without clipping; build and scoped diff checks passed.
- Added independent bone/image visibility switches to the split 2D bone editor. Bone-only, image-only, both, and neither states were verified with `verify-bone-editor-separate-bone-image-display.mjs` and reviewed screenshots.
- Added a continuous-chain mesh image mode to the split 2D bone editor. A single source image can now bind to a connected chain such as right upper arm → right forearm → right hand; draggable source control points, source/target width, and smoothness are edited in a dedicated dialog. Rendering warps the uncut image through a textured triangle strip along the current bone pose, while JSON/browser-draft save and reload preserve `meshBindings`. `verify-bone-editor-chain-mesh.mjs` confirmed a 3-bone chain, visible bent output, cleared rigid layer sources, and restored binding/canvas after reload. The bent-arm screenshot was visually reviewed. `node --check` and `npm run build` passed; repository-wide `git diff --check` still reports the pre-existing trailing whitespace in `.gitignore`.
- Extended continuous meshes into replaceable character-part slots (`right_arm`, `left_arm`, legs, torso, or custom). Re-selecting an image keeps the chain and mesh geometry. Mesh ranges now support extra intermediate points, separate left/right widths, direct center/boundary dragging, per-binding rotation, and horizontal/vertical flip. Added a project-wide reference pose with save/apply controls and a 768px part-guide PNG showing the reference outline, centerline, joints, and labels. `verify-bone-editor-mesh-parts-reference.mjs` verified a right-arm slot with 5 center points/10 width handles, asymmetric 24%/58% range, 15° rotation, horizontal flip, gold-to-purple image replacement, 55° reference-pose restoration, PNG download, draft reload, visible canvas, and no console errors. Screenshots `bone-editor-mesh-fine-range.png`, `bone-editor-mesh-part-replaced.png`, and `bone-editor-right-arm-reference-guide.png` were reviewed. A visual check found the mesh canvas could be hidden by later chain bones; its z-order now uses the chain maximum plus one.
- Final v37 checks: `node --check`, the required web-game client, and `npm run build` passed. Repository-wide `git diff --check` continues to report only the pre-existing trailing whitespace at `.gitignore:25`.
- Added v38 rig selection: normal 2D creates the existing 17-bone rig, while pixel 2D creates a 10-bone rig with whole-arm/hand and whole-leg/foot chains. Saved-project cards identify the rig type. Added per-rig 1254px transparent modular-character reference sheets generated with the built-in image tool, showing both the assembled mannequin and substantial exploded parts with cyan overlap tabs. The previous line-only PNGs are now explicitly secondary coordinate aids under `part_templates/technical`.
- Replaced the misleading main `交換パーツ見本PNG一式` action with a full-screen `交換パーツ作画見本` dialog. It explains overlap rules, shows the complete reference at once, and provides selectable individual head/torso/right-left arm/right-left leg PNG examples. `tools/extract_reference_parts.py` reproducibly extracts and composes those transparent files at 128×256 pixel-rig or 512×1024 standard-rig sizes. Browser verification confirmed 10/17 bone counts, a two-bone pixel right-arm chain, reference image loading, technical manifests, example mesh application, and no console errors.
- Changed the replaceable-image structure to six explicit JSON groups: head, torso, right/left arm, and right/left leg. Head stays rigid; torso/arms/legs use their finer bones as continuous-mesh controls. New-project selection now offers `通常2D・正面` (default 17-bone), `ドット2D・正面` (10-bone), and the previous asymmetric pose as `通常2D・自然立ち`. Existing standard projects without pose metadata migrate as natural stance instead of being mislabeled as front. Browser verification confirmed the three choices, 6 part groups, symmetric front rotations, retained natural rotations, 10/17 bone counts, and no console errors; `npm run build` passed.
- Corrected the standard front rig after visual review showed the first version only changed rotations. The original 17-bone arrangement is again the default `通常2D・横向き`; `通常2D・正面` is now a separate rig layout with a wider 178px chest, symmetric 8/92% shoulder anchors, symmetric arm/leg dimensions, z-order, and rotations. Legacy `natural` metadata migrates to `side`. Side/front screenshots were inspected, the standard client directly opened the front option, the targeted browser test reported no console errors, and `npm run build` passed.
- Fixed the front rig's feet both pointing screen-right. The character-right/screen-left foot now mirrors its bone silhouette, moves the ankle origin to 82%, and puts its toe endpoint at 8%; the opposite foot remains 18%/92%, so the front stance points outward symmetrically. Ground auto-foot contact now respects shape mirroring, and older front drafts without this field migrate on load. Full-stage and standard-client screenshots were inspected, the browser state confirmed both endpoint definitions, and build passed.
- Expanded the dot-2D front rig from 10 to 15 bones: head, body, waist; right/left upper arm, arm, hand; and right/left thigh, shin, ankle. The six replaceable image groups remain unchanged, while torso uses a 2-bone mesh and each limb uses a 3-bone mesh. Repositioned the root so both mirrored ankles start horizontally on the ground instead of being tilted by auto-foot correction. The one saved 10-bone `pixel_motion` was an empty one-frame/no-image template, so it was safely updated in place to the 15-bone project rather than leaving a stale list entry. The targeted browser test confirmed 15 bones, `右上腕 → 右腕 → 右手`, 6 part groups, regenerated technical manifests, and no console errors; the full-stage screenshot was visually reviewed and build passed.
- Added a separate 15-bone `ドット2D・横向き` initial rig alongside the existing dot front rig. It uses a narrower profile torso/head, overlapping near/far limbs with distinct z-order and offsets, an asymmetric side stance, and both feet pointing in the same screen-right travel direction. The project selector is now a clear 2x2 matrix: normal/dot by side/front. Browser screenshots confirmed the side silhouette differs visibly from front while preserving the same six part groups and 15-bone chains; no console errors were reported.
- Added selected-bone hit priority without changing visual z-order. The existing top-level resize overlay now exposes a transparent pointer surface over the selected bone, so a bone chosen from the list remains draggable even when another layer visually covers it. A browser interaction selected the behind `左腕`, verified the hit target was `resizeBox` with pointer events enabled, dragged over the overlap, retained the same selected ID, and changed its rotation from 3 to -32 degrees with no console errors.
- Restored move-mode behavior for connected child bones. Move mode no longer early-returns or disables X/Y when `親に接続` is on; it adjusts the bone's parent-relative X/Y while retaining parent transform follow. The selected-behind interaction test verified the selected left arm kept priority and moved from X/Y `0,0` to `31,20`; the UI copy now explains this behavior.

- 2Dボーン・モーション作成の『ドット2D・横向き』新規テンプレートを、保存済み pixel_side_motion の調整済み姿勢（各部位の位置・幅・高さ・角度、接続位置、足の向き）と同じ値へ更新。output/verify-bone-editor-rig-types-and-templates.mjs でソースJSON内 pixel_side_motion と新規作成結果の15部位を全項目比較し一致、画面とconsole errorなしを確認。

- 2Dボーン・モーション作成の画像範囲編集に、プレビュー上でのホイール拡大（50〜600%、現在倍率表示）と、初期ONの「左右自動調整」を追加。ON中は横幅数値または左右ハンドルの操作で中心を維持し、左右を同量ずつ縮小／拡大する。共有している全ボーンには同じX/W範囲を反映する。`output/verify-bone-editor-crop-zoom-and-symmetric-width.mjs` で112%拡大、X20/W60の数値調整、右ハンドル操作後の共有2部位の同一範囲を確認し、console errorなし。画像編集画面のスクリーンショットを目視確認、標準クライアントと `npm run build` も通過。

- 連続ボーン・メッシュ変形にも画像範囲編集と同じホイール拡大（50〜600%、倍率表示）を追加。選択中の範囲点には初期ONの「左右自動調整」を用意し、左／右の幅スライダーまたは黄色ハンドルを操作すると、中心線の両側が同じ幅へ連動する。`output/verify-bone-editor-mesh-zoom-and-symmetric-width.mjs` で112%拡大、左幅28%入力による左右28%連動、ハンドル操作後の左右25%連動、console errorなしを確認。メッシュ調整画面を目視確認、標準クライアントと `npm run build` も通過。

- メッシュプレビューの拡大時、関節名・中心丸点・黄色の幅ハンドルまで一緒に巨大化して画像が見えにくくなる問題を修正。SVG操作オーバーレイの半径・文字サイズ・ラベル位置を画面上のpx基準で逆算し、画像の倍率に関わらず一定サイズにした。メッシュ範囲の面塗りもほぼ透明にして元画像を優先表示する。112%拡大前後でオーバーレイのSVG値が縮小して画面上のサイズを維持すること、左右自動調整、console errorなしをテストし、画面を目視確認。標準クライアントと `npm run build` も通過。

- メッシュの選択中の範囲点へ「横幅固定」チェックを追加。ONにすると現在の左幅／右幅を全関節点に揃え、その後にどの点の幅スライダー・黄色ハンドルを操作しても全点へ同じ幅を反映するため、途中だけ細くなるテーパーを避けられる。左右自動調整と併用中は全点で左右対称の一定幅になる。テストで別関節点への28%反映と、他点で36%へ変更した後の全点反映、console errorなしを確認。画面を目視確認、標準クライアントと `npm run build` も通過。

- メッシュの追加点を「分割点」として明示し、選択中の分割点へ任意の名前（例: 肘）とボーン列上の位置を設定できるようにした。画像上の丸点ドラッグで画像側位置も変更でき、追加した分割点はJSONの `name` / `t` として保存される。テストで5点目を追加して「肘」、列上30%へ設定し、保存後も値が残ること、console errorなしを確認。画面を目視確認、標準クライアントと `npm run build` も通過。

- 「横幅固定」を「直線固定」へ更新。ON中は全関節点の左右幅に加えて画像側X座標も選択点へ揃えるため、分割点が縦一直線になり途中で細くならない。メッシュプレビューは、丸点・幅ハンドル以外の場所をドラッグするだけで表示位置をパンできるようにし、スクロールバーへ触れず拡大画像を移動できる。テストで4分割点のX座標一致、600%拡大時に空白ドラッグで `scrollTop` 220→140、追加肘点のJSON保存、console errorなしを確認。画面を目視確認、標準クライアントと `npm run build` も通過。

- ボーン編集へ「接続点モード（接）」を追加。選択中の子ボーンでは、青い丸の「親側 接続点」をドラッグして `attachX/Y` を、橙のひし形の「回転軸」をドラッグしてそのフレームの相対 `X/Y` を直接調整できる。親を持たないルートでは回転軸のみを表示する。`P` キーでも切り替え可能で、接続点モード中はサイズ変更オーバーレイを無効にして誤操作を避ける。`verify-bone-editor-anchor-mode.mjs` で両ハンドルの値変更・text state・console errorなしを確認し、画面を目視確認。標準クライアント、`node --check`、対象ファイルの `git diff --check`、`npm run build` も通過（既存のVite警告のみ）。

- 接続点モードの回転軸操作を修正。橙ひし形はフレーム座標ではなく、ボーン／画像内の回転軸 `頭X/Y (ox/oy)` を動かす。これで端にあった軸を部位の中央など任意位置へドラッグできる。モード中は操作ラベル、ボーン名、頭・尾ラベルもすべて隠し、小さな青丸・橙ひし形だけを表示して画像を遮らない。テストで `oy: 0.08 → 0.498` の中央寄せを確認し、画面を目視確認。標準クライアントと `npm run build` も通過。

- 回転軸の直接調整時に、画像／ボーンが動いたり大きさが変わったように見える問題を修正。`頭X/Y` を更新するのと同時に相対X/Yを補正し、ドラッグ前後の選択ボーンの画面上の矩形（幅・高さ・位置）が実測で一致するようにした。回転軸だけがドラッグ先へ移る。テストでは幅46.3967px・高さ100.939pxを維持し、位置の差も0.05px未満。標準クライアントと `npm run build` を再確認。

- 回転軸調整で子ボーンや、個別回転／拡大／反転済みの画像まで連動してずれるケースを追加補正。調整開始時に子孫ボーンの画面上アンカーを保持し、軸変更後に相対X/Yを再計算して元位置へ戻す。画像変換についても新旧の transform-origin 差から `imageOffsetX/Y` を逆算して補正する。これにより画像・ボーンの表示サイズ／位置を維持したまま橙ひし形だけを移動する。`node --check`、操作テスト、標準クライアント、`npm run build` を通過。

- 実画像付きソースプロジェクト `pixel_side_motion` で回転軸変更を再調査。前回テストは新規の画像なしリグで `.layer` の矩形だけを測っており、メッシュCanvasの変形を検証できていなかった。右腕は `mesh_q84e3tz2` の連続メッシュで、`getMeshTargetPoints()` が各ボーンの `state.anchorX/Y`（現在は `ox/oy` と同一概念）をメッシュ経路点に使用する。橙軸を `oy 0.08→0.492` へ動かすと、右腕メッシュの不透明領域が 66x190px から63x151pxへ変化し、上端も y542→581へ移動した一方、通常ボーンDOMの矩形はほぼ維持された。原因は回転軸・ボーン頭点・メッシュ制御点の共有。正しい修正には回転軸を独立データ化し、メッシュの頭点／接続点と分離する必要がある。調査画像: `output/bone-editor-origin-real-before.png`, `output/bone-editor-origin-real-after.png`。

- 回転軸と頭点／メッシュ制御点を分離。既存 `ox/oy` は「軸X/Y」として回転専用にし、新規 `headX/headY` を「頭X/Y」として追加。旧JSONは読み込み時に元の `ox/oy` を頭点へ自動移行する。メッシュ経路は独立した頭点を使い、接続線も親側接続点から子の頭点へ描画する。再接続時は軸と頭の差から相対X/Yを算出して接続を維持する。実画像付き `pixel_side_motion` で軸Yを0.08→0.492へ変更しても、右腕メッシュは高さ190px・上下位置を維持（幅差1px、画素差1のみ）。その後35°回転し、中央軸回転と肩の頭点維持を目視確認。`verify-bone-editor-mesh-origin-separation.mjs`、既存軸テスト、標準クライアント、`node --check`、対象diff check、`npm run build` を通過。

- 大容量画像を含む保存済みモーションを開くと `localStorage` の5MB前後の容量制限で `QuotaExceededError` が発生し、`render()` が途中終了してプロジェクト読込とドラッグ用イベント登録まで止まる問題を修正。ブラウザ自動バックアップだけを停止し、ソースJSONの読込・編集・手動保存は継続する。現在プロジェクト名のtitleで自動バックアップ停止を案内し、text stateにも `draftBackup.blocked` を追加。容量超過を強制した回帰テストで保存済み `pixel_side_motion` を開き、移動モードで右上腕を X -19→16 / Y 19→38 にドラッグでき、console/page errorなしを確認。`verify-bone-editor-quota-and-move.mjs`、標準クライアント、`node --check`、対象diff check、`npm run build` を通過。

- ボーン表示OFFでも、選択中ボーンのシアン枠線とサイズ操作ハンドルだけは表示・操作できるように修正。ボーン形状・アンカー・ラベルは非表示のまま維持する。実画像付き `pixel_side_motion` で右上腕を選び、形状 `display:none`、枠線 `solid 2px`、操作オーバーレイ表示、pointer events有効、console errorなしを確認。標準クライアント、対象diff check、`npm run build` も通過。

- 画像範囲編集／連続メッシュ編集モーダルを広い画面ではほぼ全画面（最大1680x1100）まで使う構成に変更。1440x960ではモーダル1424x944、画像プレビュー1018x756、右操作欄360pxを確保した。表示・動作設定は840px幅の2カラムカードへ再編し、表示項目は2列のクリック可能なスイッチ、地面・足は数値項目と分離してスクロールなしで一覧できるようにした。スイッチから画面表示への反映、画像範囲数値からプレビューへの反映、console/page errorなしを自動確認し、両画面を目視確認。標準クライアント、対象diff check、`npm run build` も通過。

- 表示・動作設定を非モーダル `show()` から `showModal()` へ変更し、開いている間は背面のボーン・キャンバスを選択できないようにした。設定画面へ「基準画像」を追加し、新規プロジェクトでは1枚を15基本ボーン（頭・胴体・左右腕・左右脚）へ一括割当して範囲編集を開始する。基準画像の横位置・横幅は同じ基本パーツ内だけ連動し、別パーツの範囲を巻き込まない。選択ボーンの従来ボタンは「＋追加画像」として独立ソースで上書きし、基準／追加をインスペクターとJSONで区別する。既存の個別画像は初回の基準画像設定時に上書きしない。設定画面を900px幅・画面高対応にして追加欄まで一覧表示。モーダル背面遮断、15/15部位への基準割当、パーツ別範囲、追加画像上書き、既存クロップ連動、console/page errorなしを自動確認し、画面を目視確認。標準クライアント、`node --check`、対象diff check、`npm run build` も通過。

- 上記の基準画像一括割当は要件の解釈違いだったため撤回。基準画像の設定時は画像ソースを登録するだけで、ボーンへは一切割り当てず編集画面も自動で開かない。画像未設定の部位から「部位分割」または「連続メッシュ」を開いた時だけ基準画像を初期表示し、適用した部位／同じ基本パーツ内のチェック対象に限って割り当てる。別部位の基準画像設定は維持し、＋追加画像は従来どおり独立ソース。胴体メッシュは親子列が腰→腹→胸→首なのに画像側の初期点も上→下だったため腰が画像上端になっていた。胴体だけ画像側の初期点を下→上へ反転し、腰・根元を下端、首・先端を上端へ修正。素材見本PNG／manifestも同じ向きにした。基準登録直後の割当0件、胸の分割候補が胴体4部位のみ・適用は胸のみ、胴体5点のvが0.94→0.06、腕メッシュは従来の上→下、追加画像独立、モーダル背面遮断、console/page errorなしを検証。画面を目視確認し、標準クライアント、既存crop/arm mesh回帰、`node --check`、対象diff check、`npm run build` を通過。

- ソースJSONに保存済みのプロジェクト「デフォルト」を実データとして確認（通常画像1件＋連続メッシュ5件）。ボーンを大きくしなくても完成画像だけを調整できるよう、設定画面へプロジェクト共通の「画像表示倍率」50〜250%を追加した。既存JSONは100%として読み込むため現在の状態は変わらず、倍率変更時は通常画像と全メッシュを腰の共通原点から一括拡大し、ボーンの位置・幅・高さは変更しない。保存済み「デフォルト」を130%にした自動検証で15ボーンの画面矩形が全て不変、通常画像と5メッシュが1.3倍、100%へ戻すと画像矩形も完全復元、console/page errorなしを確認。画面を目視確認し、標準クライアント、`node --check`、対象diff check、`npm run build` を通過。

- 連続ボーン・メッシュを部分変形方式へ作り直した。画像上のシアン枠は切り抜きではなく「関節の変形範囲」で、ドラッグ移動・四隅リサイズ・X/Y/幅/高さ0.1%入力に対応する。適用後は `sourceRect` としてJSONへ保存。枠外の画像は消さず、上腕・前腕・手などを各ボーン間の直線メッシュで保ち、枠内だけ従来の滑らかな曲線メッシュへ境界フェード付きで混合する。これにより肘や膝だけを歪ませられる。「腕・脚全体を変形」で従来の全体曲線へ戻せる。既存JSONに `sourceRect` がない場合は画像全体として移行し、保存済み「デフォルト」の見た目は変更しない。実画像の右腕で肘範囲を約10.7%×10.1%に絞り前腕を55度回転した画面を確認し、上腕・前腕の硬い部分を保ったまま肘だけが連続して曲がること、枠内influence=1・枠外=0・枠外画像の描画維持、console/page errorなしを自動検証。既存「デフォルト」の倍率回帰、従来腕メッシュ回帰、標準クライアント、`node --check`、対象diff check、`npm run build` を通過。

- 設定済みの関節変形範囲が、メッシュ画像の上下／左右反転後も元座標へ残り別の部位を変形してしまう問題を修正。反転操作時に `sourceRect` の四隅を画像中心・現在角度基準で同時変換し、反転後の同じ関節画像へシアン枠を追従させる。非同期の反転プレビュー生成前にも枠と数値を即時同期し、表示の一時的なずれも解消。実画像で上下反転は Y31%→55%、左右反転は X5%→77%へ移動し、各反転を解除すると X5%/Y31%/W18%/H14%へ復元することを確認。反転後スクリーンショットを目視確認し、局所メッシュ、保存済み「デフォルト」の倍率、従来腕メッシュ、標準クライアント、`node --check`、対象diff check、`npm run build` を通過。

- インスペクター「画像調整」の左右／上下反転を、ボーン設定一式を再適用する処理から画像専用処理へ分離。通常画像は画像中心基準の位置補正を加え、反転してもボーン座標・接続・画像の表示位置／大きさを変更しない。連続メッシュではボーン側の未使用フラグではなくメッシュ本体の `flipX/flipY` を更新し、関節変形範囲も反転後の同じ箇所へ追従する。保存済み先頭プロジェクト「ポーズ」で通常画像とメッシュを左右反転し、ボーン不変・画像反転・解除時の完全復元・console errorなしを自動検証。画面を目視確認し、局所メッシュ／従来腕メッシュ回帰と標準クライアントも通過。

- 反転仕様を再確認し、上記の「元画像全体を反転して参照範囲を反対側へ移す」方式を廃止。右手など現在メッシュで切り取っている参照点・左右幅・関節変形範囲は固定し、その切り取り結果のテクスチャだけを左右／上下反転する。これにより右手を左右反転しても元画像の左手へ参照が移らず、同じ右手が鏡像になる。保存済み「ポーズ」で参照点・範囲・ボーンが完全不変、メッシュCanvasの描画だけが変化し、解除時に復元することを確認。局所メッシュ範囲編集、従来腕メッシュ、標準クライアントも通過。

- 連続メッシュの一部分だけを反転できる区間設定を追加。メッシュ編集で分割点を選び「次の分割点まで左右反転」をONにすると、その区間の切り取りテクスチャだけを反転する。参照画像・中心点・左右幅・関節変形範囲・ボーンは変更しない。終端点では次区間がないため操作を無効化。設定は各control pointの `flipXToNext` としてソースJSONへ保存され、全体反転との併用はXORで自然に切り替わる。保存済み「ポーズ」の右腕で1区間だけON、他区間OFF、参照値不変、Canvas描画変更、JSON保持、console errorなしを自動検証し、設定画面と適用後を目視確認。

- 上記の分割点区間スイッチは要件違いのためUI・データとも撤回。「画像調整」の左右反転を選択中ボーン単位へ変更した。連続メッシュでも右手を選べば右手に対応するテクスチャ区間だけを反転し、右上腕・右前腕や全体反転設定は変更しない。部位別設定はbindingの `boneFlipX` にボーンID単位で保存し、全体反転とはXORで併用可能。保存済み「ポーズ」で右手だけをONにし、参照点・変形範囲・ボーン・全体反転値が不変、描画差分が右手の画面矩形＋24px以内だけに収まること、解除時の完全復元、console errorなしを自動検証。不要になった区間反転テストも削除。

- ソースJSONの1セーブデータ内で、全ポーズ共通のデフォルトレイヤーフォルダーと、ポーズごとの専用レイヤーフォルダーを持てるようにした。既存JSONは全レイヤーを共通の「デフォルト」へ自動移行する。左パネルでポーズを選択し、`＋共通`／`＋ポーズ` でフォルダーを追加、フォルダータブ切替とドラッグでレイヤーを移動できる。保存画面は「上書き保存」と「現在のポーズを新規保存」を分離。新規ポーズでは共通レイヤーと画像ソースを共有し、現在ポーズ専用のレイヤー定義・フレーム値・関連メッシュだけを別IDで複製するため、その後は独立して編集できる。`output/verify-bone-editor-pose-layer-save.mjs` で旧構造17ボーンの移行、専用フォルダー追加、同一セーブ内2ポーズ化、ポーズ別表示、上書き時にポーズ数が増えないこと、API保存・再読込、console errorなしを確認。部位反転、メッシュ範囲、連結メッシュ、保存ライブラリ／画像回転の回帰テスト、標準クライアント、`node --check`、対象diff check、`npm run build` も通過。1280px幅で上部の「編集対象」「保存」が縦折返ししないよう調整した。

- 上記の「1フレーム＝1ポーズ」方式は要件違いのため撤回し、1セーブデータを `defaultFrame`（基準となる1フレーム）＋ `animations[]`（任意名・複数フレームの派生アニメーション）へ置き換えた。デフォルト選択時は再生・FPS・フレーム追加／複製／削除を無効化し、`＋派生` でデフォルトを基に新規アニメーションを作る。派生ごとに名前、FPS、ループ、タイムライン、専用レイヤーフォルダーを保持し、現在の派生を独立レイヤー込みで複製・削除できる。基本画像ソースは共有し、デフォルトのボーン値を後から変えた場合は、旧デフォルト値のまま未編集だった派生フレームだけ新しい値へ追従する。保存画面はセーブデータ全体の上書きに一本化。旧 `frames` JSONは先頭をデフォルト、全フレームを「既存モーション」へ自動移行する。ローカル保存APIも新旧両構造を受理する。`output/verify-bone-editor-animation-model.mjs` でデフォルト1枚固定、任意派生の2フレーム化、未編集値だけの継承、専用レイヤー分離、派生複製・削除、非ループ終端停止、ソースJSON保存、旧JSON移行、console errorなしを確認。画像反転、メッシュ範囲、連結メッシュ、保存ライブラリ／画像回転の回帰、標準クライアントの画面確認、`node --check`、`npm run build` も通過。

- モーション操作を確定仕様へ整理。左上は編集対象セレクトと「モーション」ボタンだけにし、`＋派生`／上部の複製・削除／`＋共通`／`＋専用` と専用レイヤーフォルダー構造を撤去した。モーション管理画面から、名前だけを指定して「デフォルトから新規作成」または「既存モーションを複製」を選べ、既存モーションの削除も行える。全モーションは同じ通常レイヤー・画像・メッシュ定義を共有し、各モーションは複数フレームだけを保持する。フッターには従来の追加／複製／削除を残し、「他のレイヤーに複製」で現在フレームを別モーションの末尾へ追加できる。旧 `defaultLayerGroups`／`layerGroups` は読み込み時に削除して通常レイヤーへ統合する。`verify-bone-editor-animation-model.mjs` で新規・既存複製・別モーション末尾複製・削除・ソースJSON保存・旧構造移行を確認。画像反転、局所メッシュ、保存ライブラリ／画像回転の回帰、標準クライアント、画面目視、`node --check`、diff check、`npm run build` を通過（既存Vite警告のみ）。

- モーション保存画面へ「別名で保存」を追加。入力したセーブデータ名で常に新しいソース保存IDを発行し、`boneMotionProjects.json` 内へ元データを残したまま別データとして追加する。保存後は新しい方を現在の編集対象に切り替えるため、以後の上書き保存はコピー先を更新する。既存データと同名のまま押した場合は誤複製を防ぎ、名前入力へ戻す。自動検証で元IDの維持、新IDの発行、両データの一覧保持、別名データの再読込、同名抑止、console errorなしを確認。保存画面を目視確認し、標準クライアント、`node --check`、diff check、`npm run build` を通過（既存Vite警告のみ）。

- 1セーブデータ内へ同配置画像の切替セットを追加。画像を「体」「顔」「手持ち」「装飾」の4種類に分け、設定画面から各種類へ複数枚を一括登録し、現在表示する1枚を選択・削除できる。ボーン編集欄の「画像種類」で通常パーツまたは連続メッシュを各種類へ割り当てる。種類側の表示画像を変えると、その種類を参照する通常パーツとメッシュだけが即時に差し替わり、別種類は変えない。切り抜き、関節メッシュ範囲、位置、倍率、反転は共有して維持する。既存の基準画像とそれを使うパーツ／メッシュは「体」へ自動移行し、個別追加画像は固定画像として維持する。体2枚・顔2枚で、体と顔の独立切替、通常パーツと胴体メッシュの追従、クロップ／位置維持、ソースJSON保存を検証。既存の基準画像・胴体メッシュ、画像反転、局所メッシュ、モーション構造の回帰、標準クライアント、画面目視、`node --check`、diff check、`npm run build` を通過（既存Vite警告のみ）。保存済み「デフォルト」を名前指定する古い倍率テストは対象データ名が現在存在せず実行不能。

- 技エフェクト作成画面で「着弾点の横にある水色の方向表示」と指摘された初期斬撃エフェクト本体を修正。位置記号の●・♦は21px表示／34pxクリック範囲のまま維持し、斬撃だけをサイズ48・長さ64・太さ2へ縮小した。リセットボタンも36pxへ復元。自動検証で初期値、位置ドラッグ／初期化、テンプレートの選択のみでは追加されず＋で追加されること、再生時の位置記号と点線の半透明化、console errorなしを確認し、スクリーンショットを目視確認。

- 技エフェクト作成画面のフッターを撤去し、エフェクト名／レイヤー数とJSON出力・保存・閉じるをヘッダー右側へ集約。エフェクト名・FPS・総フレームの基本設定はプレビュー上段の位置設定右側へ移動し、下段をレイヤー編集専用にした。既存の簡易図形デフォルトは `EffectEditorModal.vue` の `layer()`／`templates`、描画は `EffectRenderer.js` の `drawLayer()` にあるプレースホルダーで、従来戦闘用WebPエフェクト (`assets/effect/320×240`) とは別系統であることを確認。標準クライアントと編集操作検証を通過し、再配置後の画面を目視確認。

- 2Dボーン編集の「サイズ / ポーズ」へ「ボーン表示サイズだけ調整」を追加。ON中はW/Hを保護し、四隅ドラッグまたは表示倍率（15〜250%）で選択中ボーンの色付き形状と操作枠だけを拡大縮小する。通常画像、連続メッシュ画像、実ボーンW/H、接続点・回転軸は変更しない。表示倍率は各ボーンの `editorBoneScale`、モードは `meta.boneDisplaySizeMode` としてJSONへ保持する。`pixel_side_motion` の右上腕で100%→50%→四隅拡大を行い、W/H・画像レイヤー寸法・メッシュCanvas描画ハッシュが不変、操作枠だけ倍率追従、JSON出力、console/page errorなしを確認。ボーン非表示時の選択枠・背面ボーン選択の回帰、`node --check`、`npm run build` を通過し、画面を目視確認。

- 背景画像を複数レイヤー化。旧 `background` は読み込み時に1件の `backgrounds[]` へ自動移行し、背景ごとにID・名前・画像・X/Y・倍率・透明度・反転・ボーンを含む表示順を保持する。左レイヤー一覧へ各背景を個別表示し、右インスペクターから追加・選択・画像差替え／解除・背景レイヤー削除が可能。選択中背景だけをキャンバスドラッグ／ホイール／数値で調整し、背景同士とボーンの間へ独立したZ順で配置できる。背景2枚を#1/#10に置き、個別位置・透明度の独立、同時表示、追加／削除、JSON再読込、旧データ移行、console/page errorなしを自動検証。標準Webゲームクライアントの状態／画面、`node --check`、`npm run build` を確認し、複数背景とレイヤー一覧を目視確認。

- 「ボーン表示サイズだけ調整」を一括倍率から独立した表示W/Hへ修正。ON中は右インスペクターの「表示 W」「表示 H」と四隅ドラッグで色付きボーン形状・操作枠の横幅／縦幅を別々に変更し、通常画像・連続メッシュ・実ボーンW/H・接続点は変更しない。各ボーンの `editorBoneDisplayW/H` としてJSON保存し、旧 `editorBoneScale` があるデータは新W/H未設定時だけ換算して従来表示を維持、新W/H確定時に旧値を削除する。右上腕で表示Wのみ75→40（表示H125維持）、表示H→95、四隅ドラッグを行い、画像レイヤー寸法・メッシュCanvas描画ハッシュ・実W/H不変、JSON出力、console/page errorなしを確認。非表示ボーン選択枠・背面選択の回帰、標準クライアント、`node --check`、`npm run build` を通過し、画面を目視確認。

- 仮テンプレート定義を `src/components/effects/effectTemplates.js` へ分離。画面側は同ファイルのnamed exportを自動収集し、エクスポート関数名をそのままテンプレート名として表示する。現在は `explosion`／`laser`／`slash`／`thunderSlash` の4関数。今後は同ファイルへfactory関数をexportするだけで一覧へ自動追加される。各関数は新しいレイヤー定義配列を返し、選択だけでは追加せず＋押下時に生成する。ブラウザ検証で4関数名の完全一致、laser選択時1レイヤー維持、＋後3レイヤー／beam選択、再生、console errorなしを確認し、画面も目視確認。

- エフェクトの動きを先に作れるよう、選択レイヤーの「動き／基本」編集画面を追加。「動き」では総フレーム数に連動する横スクロール式タイムライン、現在フレーム選択、キーフレーム追加／削除、位置X/Y・サイズ・長さ・太さ・回転・透明度、次キーまでの緩急（一定／ゆっくり開始／素早く開始／両端を滑らかに）を編集できる。`EffectRenderer` とコマ送りプレビューは同じキーフレーム補間を使用し、キーがない既存JSONは従来描画を維持する。フレーム0をsize20/rotation-30/alpha0、フレーム4を80/40/100、easeOutに設定した際、フレーム2が65/22.5/75になること、フレーム6のキー追加→削除、基本／動き切替、位置ドラッグ、テンプレート追加・再生、console errorなしを自動検証。画面は `output/effect-motion-editor-ui.png` を目視確認。

- 2Dボーン編集の通常「ボーンの大きさ」と「ボーン表示サイズだけ調整」の四隅リサイズを、中央／回転軸固定から対角固定へ変更。ドラッグした角の反対側を画面上に固定したままW/Hを変更し、回転済みボーンでも同じ挙動にした。通常サイズはボーンの親相対アンカーを補正し、表示サイズは画像・メッシュ・実W/Hへ触れない編集専用 `editorBoneDisplayOffsetX/Y` で表示枠だけを補正する。`output/verify-bone-editor-opposite-corner-resize.mjs` で通常／表示×4隅を検証し、対角移動は通常最大0.012px・表示0px、表示モードの実W/H不変、JSON保存、console/page errorなしを確認。従来の表示W/H独立テスト、標準クライアント、画面目視、`node --check`、`npm run build` を通過。

- 腰ボーンの基本設定へ「腰の位置を固定」を追加。ON中は移動モードで腰本体／選択枠を誤ドラッグしても移動を開始せず、X/Y数値入力も無効化する。選択、回転、サイズ変更などは維持し、全体移動は明示操作として従来どおり使用可能。固定状態は腰レイヤーの `positionLocked` としてJSON保存し、OFF時は項目を削除する。`output/verify-bone-editor-waist-position-lock.mjs` で固定ONの腰位置 `(500,675)` 維持、JSON再読込後の復元、OFF後の `(545,700)` への移動、console/page errorなしを確認。対角固定8パターン、表示サイズ、ボーン非表示枠、背面選択・移動、`node --check`、`npm run build` の回帰を通過し、固定UIを目視確認。

- モーションの各コマ・各部位へ画像の左右／上下反転差分を保存できるようにした。画像調整の反転スイッチは選択中フレームのposeへ `imageFlipX/imageFlipY` を保存し、未設定なら既存レイヤー／メッシュ共通値を互換用初期値として使う。通常画像は位置・表示枠を維持したまま反転し、連続メッシュは選択ボーンに対応するテクスチャ区間だけをコマ別に反転する。前フレーム半透明表示には前フレーム自身の反転値を渡し、デフォルト側の反転変更は既存モーションへ自動伝播させない。`output/verify-bone-editor-frame-part-flips.mjs` で1コマ目の頭と右腕を反転、2コマ目への非漏洩、右腕周辺だけの3909画素差分、通常画像枠の完全一致、JSON再読込、実再生によるOFFコマへの切替、デフォルトから既存モーションへの非漏洩、console/page errorなしを確認。オニオンスキン、モーション管理、対角リサイズ、腰固定、標準クライアント、`node --check`、`npm run build` を通過し、ON/OFF両コマを目視確認。

- 2Dボーン・モーション作成画面のヘッダー左側へ常時見える閉じるボタンを追加し、guestの「ゲーム作成」タブへ戻すようにした。guestから開く際は戻り先をクエリで渡し、単独起動時は `/guest` を既定にする。キャラクター基本設定へ「使用モーション」を追加し、`boneMotionProjects.json` の保存済みデータを軽量な概要APIから選択、`motionProjectId` と `motionProjectName` の参照だけを `characterLibrary.json` の保存対象へ含める。削除済み参照は警告表示し、同じIDの名称変更は再読込時に追従する。`output/verify-motion-character-link.mjs` で閉じるボタンの画面内表示、ゲーム作成タブへの復帰、11件の一覧、`ver4` 選択、非破壊の保存リクエスト検査、console/page errorなしを確認。画面は `output/motion-editor-close-button.png`、`output/motion-editor-return-result.png`、`output/character-motion-project-setting.png` を目視確認し、標準Webゲームクライアント、`node --check`、`npm run build` を通過。

- キャラクターの「状態別グラフィック」へ、待機・移動・ジャンプ・落下・会話ごとの使用モーション選択を追加。基本設定で選んだモーションプロジェクト内の派生モーションと「デフォルト姿勢（静止）」から選び、未指定なら従来の状態別画像を使用する。参照は `motionStates.{idle,walk,jump,fall,talk}` にアニメーションIDを保存し、存在しない参照はその状態で警告する。状態タブの設定済み表示は画像またはモーションのどちらでも点灯する。`output/verify-motion-character-link.mjs` で `ver4` の待機へ「走る」を割り当て、`motionStates.idle` の保存リクエスト、画面状態、console/page errorなしを確認。`output/character-motion-project-setting.png` を目視確認し、`npm run build` を通過。

- 状態別モーションを設定した場合、キャラクター編集左側の `stage-grid` を2Dボーン編集と同じ描画処理を使う埋め込み再生プレビューへ切り替えるようにした。プレビューは選択中プロジェクト1件だけをID指定APIで読み、画像・連続メッシュ・レイヤー順・各フレーム姿勢を再生する。編集UI、ボーン名、操作点、プレースホルダー枠、背景は非表示にし、キャラクター範囲をstageへ自動フィットする。埋め込み表示ではブラウザ作業バックアップを更新しない。未設定状態は従来のスプライト画像プレビューを維持する。`output/verify-motion-character-link.mjs` で `ver4 / 走る` の6コマ読み込みとフレーム進行、console/page errorなしを確認し、`output/character-motion-project-setting.png` を目視確認。標準Webゲームクライアント、`node --check`、`npm run build` を通過。

- ボーンモーション再生入口を共通 `src/components/motion/BoneMotionPlayer.vue` へ分離し、キャラクター編集と実マップの両方から使用するようにした。幅・高さpropsが再生枠へ直接反映され、character-libraryでは表示幅／高さの2倍（編集プレビュー倍率）、area-mapではゲーム内の表示幅／高さをそのまま使う。再生iframeはプロジェクト変更時だけ読み込み、待機・移動・ジャンプ・落下・会話の切替はpostMessageで行うため、移動開始／停止ごとの再読込を避ける。`middle_terminal_concourse` の保存済み `player_3 / ver4` で停止中のデフォルト姿勢、右移動中の「走る」6コマ、X 90→234.677の移動、42×66表示、停止時の待機復帰を確認。未設定状態は状態別画像へフォールバックする。`output/verify-motion-character-link.mjs` で60×100設定→120×200編集プレビュー、`output/verify-area-map-bone-motion.mjs` でゲーム内切替を検証し、両画面を目視確認。標準Webゲームクライアント、`node --check`、`npm run build` を通過。

- 2Dボーン・モーション作成画面へ「中割」を追加。部分追加は選択中→次フレームの間へ1〜4枚を等間隔で直接挿入し、ループ末尾では先頭との間を補間する。全体生成は元モーションを残したまま×2〜×5（例：6→12/18/24/30枚）の別モーションを作り、再生時間維持のためFPSも倍率に合わせる。X/Y/W/Hは線形補間、回転は350°→10°を360°経由にする最短角度補間、モーフ・コマ別画像反転などの切替値は直前フレームを維持する。`output/verify-bone-editor-tween-frames.mjs` で部分6→7枚、全体6→12枚、元6枚の保持、FPS 6→12、角度・モーフ・反転値、選択中モーション切替、console/page errorなしを実ブラウザ検証し、`output/bone-editor-tween-frames.png` を目視確認。`npm run build` を通過（既存Vite警告のみ）。

- 親を持つボーンの接続操作を「接続を外して位置調整」へ反転。OFF時は親の尾と子の頭を固定し、移動ドラッグとX/Y入力を無効化する。ONにすると現在位置を維持したまま接続を外して自由移動でき、OFFへ戻すと全モーション・全フレームを親尾→子頭へ再スナップする。接続中の回転・通常サイズ変更・回転軸調整ではpose X/Yを自動補正し、頭側接続点を動かさない。左レイヤー一覧の小スイッチも「親」から「離」へ揃えた。`output/verify-bone-editor-parent-joint-lock.mjs` で右上腕→右前腕を使用し、接続時X/Y無効、切断後の実ドラッグ移動、再接続時の全フレーム一致、接続距離0、接続中の移動拒否、回転後の接続距離0、console/page errorなしを確認。`output/bone-editor-parent-joint-lock.png` を目視確認し、16FPS再生回帰は実測15.825FPS、標準Webゲームクライアントと`npm run build`も通過（既存Vite警告のみ）。

- 連続メッシュのキャラクター側表示幅を、各ボーンWから算出する可変幅ではなく、メッシュ設定ごとの共通固定幅へ変更。`uniformTargetWidth`を基準姿勢にある対象ボーンWの平均で初期化・JSON保存し、すべてのボーン頭点と末端点へ同じ値を使用する。既存の「ボーン側の太さ」は「全ボーン共通の太さ」へ改名し、共通幅全体の倍率として維持、現在の実幅pxも表示する。個別ボーンWを後から変更してもメッシュの一部だけ太さが変わらない。反対側コピーでも共通幅を複製する。`output/verify-bone-editor-uniform-mesh-width.mjs` で腰・胸・首の元W 180/180/169に対して全4点97px、125%時は全4点121.25px、胸Wを360へ変更してJSON再読込後も121.25px固定、console/page errorなしを確認。連続メッシュ描画、ズーム・左右幅・四角形固定幅のテスト、標準Webゲームクライアント、`node --check`、`npm run build`を通過し、`output/bone-editor-uniform-mesh-width.png`を目視確認。既存の四角形固定テストは現在の保存済み`ver4`で中間点への固定ドラッグ方向が線方向とほぼ直交し0.09pxしか動かず既存閾値に届かない。メッシュ範囲テストは保存済みfixture待機でtimeoutするため、別途fixture固定化が必要。

- 上記の「連続メッシュのキャラクター側表示幅を共通固定幅へ変更」は要望の取り違えだったため撤回。対象はメッシュ画像の描画幅ではなく、通常編集画面で選択ボーンを囲む青い「リサイズ枠」の横幅。`uniformTargetWidth`、関連UI、保存項目、専用検証を削除し、従来のボーンWごとのメッシュ描画へ復元した。再発防止として `docs/ui/00_2Dボーン編集_名称メモ_v1.md` を作成し、`AGENTS.md` から作業前に必ず参照するよう指定。名称メモではリサイズ枠、ボーン実サイズ、ボーン表示サイズ、画像範囲、メッシュ範囲、メッシュ左右幅、メッシュ描画幅を分離し、「メッシュで指定されたボーンの幅」は同じ `boneChain` に含まれる各ボーンのリサイズ枠横幅を指すと確定した。撤回後に `node --check`、既存連続メッシュ編集・描画・JSON再読込テスト、標準Webゲームクライアントを通過。正しいリサイズ枠の共通化処理は、通常のボーン実Wを共通化するのか、編集専用の `editorBoneDisplayW` を共通化するのかを確定してから実装する。

- 連続メッシュの `boneChain` に含まれるボーンについて、「ボーン表示サイズだけ調整」で使う青いリサイズ枠の表示Wを共通固定化。例として腰→腹→胸を指定した場合、`editorResizeBoxWidth` をメッシュ設定へ1値だけ保存し、3ボーンの `editorBoneDisplayW` へ同じ値を反映する。どの対象ボーンの表示W数値または四隅ハンドルから変更してもチェーン全体へ同期し、縦幅は各ボーン個別のまま維持。既存データは対象ボーンの現在の表示W（未設定時は実W）の最大値で初期化する。通常の実W、画像範囲、メッシュ範囲、メッシュ描画幅は変更せず、過去の誤実装項目 `uniformTargetWidth` / `resizeBoxWidth` は読込時に除去する。`output/verify-bone-editor-mesh-resize-box-width.mjs` で実W 117/210/132を維持しながら表示枠174/174/174、ハンドルドラッグ、数値変更、3ボーンの実表示幅、JSON再読込、console/page errorなしを確認し、`output/bone-editor-mesh-resize-box-width.png` を目視確認。既存連続メッシュ編集・描画・JSON再読込、標準Webゲームクライアント、`node --check`、`npm run build`を通過（既存Vite警告のみ）。

- 上記の共通リサイズ枠が一時的に「ボーン表示サイズだけ調整」ON時だけへ限定され、通常編集で元の個別幅へ戻る退行を修正。連続メッシュ対象は通常編集でも `editorResizeBoxWidth` を使う青い枠を表示し、横ドラッグはチェーン共通の操作枠Wだけを変更する。通常編集で同じ四隅を上下へ動かした際の実H変更は維持するが、実W、画像、メッシュ描画には触れない。腰→腹→胸で通常表示132/132/132、腹の実Wだけ108→210後も枠132/132/132、通常モードの横ドラッグ後は枠160/160/160かつ実W117/210/132の維持、メッシュCanvasハッシュ不変を確認。「表示サイズだけ調整」ONの数値・ドラッグ、JSON再読込、通常モード復帰、console/page errorなしも通過。画面を再度目視し、既存連続メッシュ、標準Webゲームクライアント、`node --check`、`npm run build`も通過（既存Vite警告のみ）。

- ユーザー実画面では上記の「表示枠だけ共通」が要望を満たしていなかったため、実保存データと一瞬だけ動作していた途中実装を再調査。求める幅は通常リサイズ枠が操作する実Wであると確定し、メッシュ設定ごとの `resizeBoxWidth` を復元した。同じ `boneChain` にある全ボーンの実Wを全モーションコマ・基準姿勢で共通固定し、通常の四隅ドラッグまたはW数値入力をどの対象ボーンから行っても全対象へ同期する。「ボーン表示サイズだけ調整」の `editorResizeBoxWidth` は別値として維持。過去の誤実装 `uniformTargetWidth` は引き続き除去し、メッシュ描画専用の固定幅は追加していない。仮の腰→腹→胸で初期132/132/132、W数値210/210/210、通常ドラッグ238/238/238、表示専用174/174/174、JSON再読込を確認。さらに実保存済み「ver4_作成」を直接読み、腰・腹・胸・首が130へ初期統一され、胸の通常枠ドラッグ後に154/154/154へ同期、console/page errorなしを確認し `output/saved-project-resize-box-width.png` を目視。既存連続メッシュ、標準Webゲームクライアント、`node --check`、`npm run build`も通過（既存Vite警告のみ）。

- 通常2Dの新規デフォルトから腹を外し、胴体を腰→胸→首へ変更。正面16ボーン／横向き18ボーンとし、素材manifestの胴体も3ボーン4点へ更新した。既存JSON内の腹は削除せず、そのまま読込・編集可能。腰→胸→首の共通横リサイズでは、従来は操作対象の胸だけ反対角を固定し腰・首が中心基準で逆側へ伸びていたため、全対象・全フレームで変更前の反対角を保存し、親から子の順に位置補正する方式へ変更。胸の右上ドラッグで3ボーンの左端誤差0.003px以内、右端+28px、W 210→238共通を確認。実保存済みver4（腹あり）もW130→154共通で互換確認。

- ソース保存済み「デフォルト」が `boneDisplaySizeMode:true` を保持していたため、開いた直後から「表示枠だけ調整」になり、四隅を動かしても画像が変わらない状態を修正。このモードはプロジェクト内容ではなく一時編集ツールとして扱い、起動・一覧・JSON・下書きから開く際は必ずOFFに戻す。ON中はキャンバス右上へ15pxの「表示枠のみ調整中 — 画像は変わりません」を表示。実デフォルトで通常ドラッグW120→144、メッシュ画像幅70→85px・画素数8017→9589、W150で画像幅88pxを確認。表示専用W190では画像幅88px・画素数10009のまま、再読込後はOFF、console/page errorなし。

- `/area-exploration?area=middle_terminal_concourse` の設定編集へ「エリア画像」を追加。既存の `src/assets/images/locations` を移動せず画像置き場として使い、同フォルダ内の43画像をサムネイル一覧から選択・解除できる。選択値は AreaMaster の `locationImage`（例: `locations/機械廊下.webp`）として保存し、基本タブにも画像とパスを表示する。`output/verify-area-location-image.mjs` で一覧がlocations配下だけであること、選択・画像読込・保存後表示・`render_game_to_text`・console/page errorなしを確認。保存リクエストはテスト時にモックしたため、実データへ画像は割り当てていない。標準Webゲームクライアントと画面目視も確認。

- エリア編集の責任範囲を再調査し、ヘッダーへ常時表示の「作成手順」を追加。5段階を「エリア情報（AreaMaster）→素材・部品作成→マップ作成（areaMapDrafts）→状態・イベント（AreaState）→実マップ確認」と確定し、背景・配置画像はエリア情報へ置かない方針を案内した。未実装の素材切り出しと背景1枚統合は未実装表示にし、現在のエリア画像が実マップへ未接続である注意も明記。ヘッダーの「設定編集」を「エリア情報」、「マップ編集」を「マップ作成」へ改名し、案内から両編集画面と実マップへ直接移動可能にした。`output/verify-area-creation-guide.mjs` で5手順、15px本文、各画面への遷移、390px幅の横はみ出しなし、console/page errorなしを確認。標準Webゲームクライアント、デスクトップ／モバイル画面目視、`npm run build`を通過。

- エリア作成手順①〜③を実装。①エリア情報は名称・寸法・接続などAreaMasterだけを扱い、②素材・部品では`locations`画像から床／壁／配管／足場／装飾の範囲をドラッグまたは数値で切り出して`mapPartLibrary.json`へ保存、③マップ作成では登録部品を選んで配置し、背景／プレイヤーの後ろ／プレイヤーの前／最前面の4レイヤー、位置・大きさ・反転・当たり判定を調整できるようにした。背景は上下左右4色の最背面グラデーションと、追加・削除可能な任意枚数の画像レイヤー（表示、透明度、fit、視差）へ分離。旧`locationImage`は未保存のマップでは最初の背景へ互換移行する。`output/verify-map-authoring-flow.mjs`で画像範囲切り出し→部品保存→マップ配置→プレイヤー前指定→背景3枚・4色設定→保存→実マップ反映を通し、部品z-index 7／プレイヤー6、モバイル390px横はみ出し0、console/page errorなしを確認。保存APIはモックして実JSONを変更せず、標準Webゲームクライアントと各画面の目視、作成手順回帰、`node --check`、`npm run build`を通過。

- 最背面の4方向グラデーションが右上／右下／左下／左上寄りになっていた問題を修正。`conic-gradient`の開始角度を`-45deg`から`0deg`へ変更し、指定色の中心が上辺／右辺／下辺／左辺に一致するようにした。素材・背景設定から実マップまでの通しテストを再実行し、computed styleの0/90/180/270度への色割り当て、画面目視、console/page errorなしを確認。標準Webゲームクライアントと`npm run build`も通過。

- マップ作成の「背景・キャラ」タブ上部へ、最背面グラデーションと全背景画像レイヤーを実寸倍率で重ねるライブプレビューを追加。色・画像・表示方法・透明度・表示ON/OFFの変更を設定画面から離れず確認でき、横長マップはプレビュー内だけ横スクロールする。マップ作成を開いた直後の倍率を34%から50%へ変更し、配置編集と背景プレビューで共有。390px幅ではプレビューを横スクロール可能にし、4方向色を2×2、背景レイヤー項目を縦配置へ変更した。通しテストで初期zoom 0.5、3000×720マップのプレビュー1500×360、背景3枚とグラデーションの即時反映、外側の横はみ出し0、console/page errorなしを確認。標準Webゲームクライアントの画面・状態も確認。

- 背景ライブプレビューより下を「グラデーション／背景画像／キャラクター／会話・案内文」の4タブへ分割し、一度に必要な設定だけを表示するよう整理。共通`ImageAssetPickerModal.vue`を新設し、画像名・パス検索、フォルダ絞り込み、サムネイルグリッド、選択中の大型プレビュー、選択／解除を提供した。背景画像レイヤーと素材・部品の元画像選択を従来の文字selectから共通モーダルへ移行。`output/verify-map-authoring-flow.mjs`で全4タブ切替、43画像のサムネイル表示、研究所／機械廊下の選択、部品切り出し、背景3枚の即時反映と実マップ保存を通し、390px幅では2列グリッド・横はみ出しなし、console/page errorなしを確認。共通モーダルと各編集画面を目視し、標準Webゲームクライアント、`npm run build`を通過。

- マップ作成の固定18×30px「P」表示を廃止し、選択中プレイヤーの実設定サイズ、待機ボーンモーションまたは待機スプライトを50%編集倍率で描画するよう変更。`player_3`の175×205pxがキャンバス上87.5×102.5pxになり、サイズラベルと薄い外枠で設置部品との比較ができる。画面を開いた際はプレイヤー位置まで縦スクロールして最初から見えるようにした。設置部品には上下左右のドラッグハンドル、幅／高さ数値変更、初期ONの縦横比維持、切り出しサイズへ戻すボタンを追加。切り出し523×430の部品を幅240→高さ197、右端ドラッグで幅300→高さ247へ変更し、JSON保存と実マップ反映、プレイヤー前レイヤー、console/page errorなしを通しテストで確認。標準Webゲームクライアントの画面・状態、`npm run build`も通過。

- マップ作成の各背景画像レイヤーへマップ座標のX／Y／幅／高さを追加し、背景プレビュー上で選択枠をドラッグして移動、上下左右ハンドルで縦横を独立して引き延ばせるようにした。表示方法には画像そのものを枠へ合わせる「縦横に引き延ばす」を追加し、「マップ全面に戻す」でX0／Y0／マップ幅・高さへ初期化できる。既存JSONは未設定値をマップ全面として互換補完する。3枚目を数値でX120／Y40／900×500に設定後、ドラッグとハンドルでX160／Y20／960×540へ変更し、保存JSONと実マップのCSSが同値、background-sizeが100% 100%、console/page errorなしを通し確認。背景設定画面と標準Webゲームクライアントのスクリーンショットを目視確認し、テスト保存はAPIモックで実データを変更していない。

- マップ作成プレビューと実操作画面でボーンキャラクターの見た目の大きさが一致しない問題を修正。設定値は両方175×100だったが、設定画面だけiframeを50%の87.5×50で起動していたため、2Dボーン側の自動フィット倍率が実マップと異なっていた。設定画面でも内部iframeは実寸175×100のまま起動し、外側だけマップ編集倍率50%で縮小するよう変更。2Dボーン側から読込完了を通知し、それまではiframeを透明にして編集UIが一瞬表示される問題も防止した。`output/verify-map-player-preview-size.mjs`で両画面のiframe 175×100、内部character 180×180、preview-mode、編集topbar非表示が一致することを確認。右移動X90→147、既存マップ作成通しテスト、標準Webゲームクライアント、console/page errorなし、画面目視を通過。

- 背景画像へ地面基準「自由配置／地面の上に接地／地面の下から開始」を追加し、地面Y変更後も接地を維持できるようにした。背景設定プレビューには地面ガイドを表示し、配置編集の左欄から背景を選択して地面を見ながらドラッグ・四辺リサイズ可能にした。部品と配置オブジェクトは「地面の後ろ／地面の前・プレイヤーの後ろ／プレイヤーの前／最前面」の表示レイヤーと、同一レイヤー内Z（-40〜40）を個別調整できる。編集画面と実マップの描画帯を背景10台、地面100、地形110、後方200、プレイヤー300、前方400、最前面500へ統一。`output/verify-map-ground-layering.mjs`で地面上Y270、地面下Y570、配置画面ドラッグ後の自由配置、地面・プレイヤー前後のZ順、console/page errorなしを確認し、既存マップ作成通しテストと`npm run build`も通過。

- 素材・部品作成の切り出し操作を作り直した。黄色枠の内側ドラッグで選択範囲を移動し、8個の辺・角ハンドルで幅と高さを再調整、枠外ドラッグで元画像の表示位置をパン、マウスホイールと±ボタンで25〜800%拡大縮小、全体表示で初期状態へ戻せる。数値入力は画像範囲内へ正規化する。「切り出し結果」は固定4:3表示を廃止して「配置時の見た目」へ改名し、sourceRectの縦横比と配置時の初期サイズをそのまま使用。共通切り出しCSSもborder-box原点へ統一し、編集枠の境界で表示がずれないようにした。`output/verify-map-authoring-flow.mjs`で枠内移動、右下リサイズ、右端だけの幅変更、ホイール拡大、枠外パン、プレビュー比率、配置時初期サイズ、保存、実マップ反映、モバイル表示、console/page errorなしを確認。標準Webゲームクライアントの`output/map-part-standard-client/`と画面を目視し、`npm run build`も通過（既存警告のみ）。

- エリア情報・マップ・素材部品の各JSON保存を、保存後も編集画面を閉じない動作へ統一し、明示的な「閉じる」または×だけで終了するようにした。保存中／保存成功／失敗は背面の共通通知ではなく各編集画面のフッター内へ表示する。「状態を保存」はゲーム中のセーブではなく `areaStateDefaults.json` の初期値保存だったため、「状態テストの初期値を保存」へ改名し、保存対象が警報・ボス撃破・配置物状態で、左側の物語条件プレビューは対象外だと画面内に明記した。`output/verify-editor-save-stays-open.mjs`でエリア情報の保存後継続と閉じる操作、`output/verify-map-authoring-flow.mjs`でマップ・素材部品・状態初期値の保存後継続と成功表示をAPIモック付きで確認。標準Webゲームクライアントの画面と状態を確認し、`npm run build`を通過（既存Vite警告のみ）。

- 「マップを開く」の実操作画面で、初期表示倍率150%時にキャラだけ相対的に大きくなる不具合を修正。原因はワールド高さを `viewportHeight / mapZoom` として背景・地面・部品だけを倍率分あらかじめ縮めてからワールド全体を拡大していたこと。ワールドの基準高さは倍率に依存させず、倍率は背景・地面・部品・キャラを含む全体へ一度だけ掛けるよう統一した。拡大時に縦方向も確認できるようマップ表示領域は縦横スクロール対応にした。`output/verify-area-map-zoom.mjs`で100%→150%時のプレイヤー／背景／地面／部品の幅・高さが全て1.5倍、console errorなしを確認。標準Webゲームクライアントで右移動後の150%画面と状態を目視確認し、`npm run build`を通過（既存Vite警告のみ）。

- `area-exploration` のマップ作成で「マップをJSONへ保存」後に画面が閉じる原因を修正。保存コンポーネント自体は閉じていなかったが、開発サーバーが `areaMapDrafts.json` のAPI保存をソース変更として検知してページを自動再読み込みし、モーダル状態が初期化されていた。`areaMasterDevApi` はAPI経由で保存したAreaMaster／マップ下書き／素材部品／状態初期値（エリア一括作成含む）の直後だけ、そのJSONのHMR再読み込みを抑止する。手作業によるJSON更新は従来どおり再読み込み対象。`output/verify-live-map-save-stays-open.mjs`でモックなしの実ファイル保存後も成功表示と編集画面が残ること、console/page errorなしを確認。標準Webゲームクライアントと`npm run build`を通過（既存Vite警告のみ）。

- 設定画面と「マップを開く」の見た目サイズが合わない件を測定。設定画面は背景／部品／キャラを全て編集倍率50%で同じ比率に縮小している。一方実操作画面は背景／部品のY位置・高さだけを `worldRenderHeight / mapDraft.height`（実測550/720=約76.4%）へ合わせ、キャラはY位置だけ同率にするが本体175×205は縮めず、その後ワールド全体150%を掛けている。従って背景・部品も縦横比が設定画面と異なり、キャラはそれらに対して縦に約1.31倍大きくなる。`output/inspect-editor-runtime-coordinate-scale.mjs`で各inline styleと実測矩形を取得。次の修正では、実マップのX/Y/W/Hへ単一の共通表示倍率を用い、キャラも同じ座標変換に通す必要がある。

- 実マップのプレイヤーは常時 `drop-shadow` で光っていたため、通常時の発光を削除。プレイヤーボタンのポインター進入／退出とフォーカス／解除を `playerHighlighted` として追跡し、カーソルを合わせた時または選択（フォーカス）時だけ発光するよう変更。会話吹き出しやボーンiframe上へカーソルが乗っても親のイベントで確実に反映する。ジャンプ／落下／飛行の状態発光は維持。`output/verify-player-hover-glow.mjs`で通常 `filter:none`、ホバー・フォーカス時のdrop-shadow、console/page errorなしを確認し、通常時画面を目視確認。標準Webゲームクライアントと`npm run build`を通過（既存Vite警告のみ）。

- 2Dボーン編集の全親子ボーンを対象にした「自動接続」を撤去。通常ボーンは親を持っていても位置・回転・リサイズで再スナップせず、既存の画像合わせを壊さない。連続メッシュに含まれる子だけへ、インスペクターの「メッシュ接続を固定」を追加した。OFFは自由調整、ONは親の尾ではなく接続点モードで指定した親側 `attachX/Y` へ子ボーンの頭を固定する。メッシュ外には項目を表示しない。旧保存データの全親子接続フラグは初回読込でOFFへ移行する。`output/verify-bone-editor-mesh-only-attachment.mjs`で、メッシュ外の頭は項目なし・移動可能、メッシュ内右前腕はOFF時移動可能、ON時接続点への誤差0かつ移動ロック、OFFへの復帰、console/page errorなしを確認。`output/bone-editor-mesh-only-attachment.png`を目視確認し、`node --check 2d_bone_editor_split/app.js`と`npm run build`も通過（既存Vite警告のみ）。標準Webゲームクライアントは初期のプロジェクト一覧ダイアログを閉じるアクション指定を受け付けず実行できなかった。

- ボーン本体や表示専用の二重枠を変える試作は要望と違うため撤去。確定した目的は、通常画面の青いリサイズ枠の四隅を動かし、連続メッシュ画像そのものの片側幅を広げること。各メッシュ接続点へキャラクター側の左右幅 `targetCrossSections[*].leftScale/rightScale` を追加し、選択ボーン区間の4ハンドルを実画像端へ接続した。四隅ドラッグは対応する1辺だけを変形し、他の3角とボーン実W/Hは維持する。親子区間の境界は同じ断面を共有するため継ぎ目も維持する。実保存済み `motion_20260816133413_r1zy` の右上腕で左下だけ34.4px拡張し、他3角0px、メッシュCanvas画素ハッシュ変化、右前腕との共有角誤差0px、枠1個・ハンドル4個、JSON再読込、console/page errorなしを `output/verify-bone-editor-mesh-corner-image-deform.mjs` で確認。スクリーンショットを目視し、標準Webゲームクライアント、`node --check`、`npm run build`を通過（既存Vite警告のみ）。旧対角W/Hテストは連続メッシュの四隅操作が画像変形へ変更されたため、その対象では旧仕様として失敗する。

- 連続メッシュ画像の四隅変形時に、新しい実画像端の青枠と選択レイヤーの旧アウトラインが同時表示されて二重枠になっていた問題を修正。選択レイヤーへ `mesh-deform-selected` を付け、変形中だけ `.layer-visual` の旧アウトラインを非表示にした。実画像端の枠1個・ハンドル4個は維持し、右上腕の片側変形、Canvas画素変化、右前腕との共有角、JSON再読込、旧アウトラインのcomputed styleがnone、console/page errorなしを自動確認して画面を目視した。

- 右手・左手ボーンへ手画像差し替えを実装。既存のコマ別 `pose.morphId` / `layer.morphs` を互換データとして利用し、手ボーン選択時は「このコマの手」「＋手画像」と表示して画像ファイルを直接登録できる。ファイル名を手形名として候補へ追加し、同名は連番化。各候補は画像X/Y・拡大・回転・透明度・反転・部位分割を独立保持し、未指定コマは通常の手を表示する。フレーム切替時はボーン選択を維持し、連続コマの手設定をしやすくした。削除時は全コマの参照を解除し、他で使われていない画像ソースも削除する。持ち物は対象外。`output/verify-bone-editor-hand-image-swap.mjs`で保存済みver4の右手へ「開いた手.svg」を直接追加し、独立X調整、1コマ目追加手／2コマ目通常手、2FPS再生中の画像切替、非手ボーンの従来モーフUI、削除と孤立画像除去、console/page errorなしを確認。`output/bone-editor-hand-image-swap.png`を目視確認。

## 2026-08-29 中層ターミナル追従キャラ負荷テスト

- `middle_terminal_concourse` の実マップへ、`＋`から共通プレイヤーキャラを選んで上限なく追従キャラを追加する実行時テストUIを追加中。各追従キャラは追加順に350msずつ遅れ、操作キャラのX/Y・向き・walk/jump/fall/idleを履歴からトレースする。
- 追従側も各自で実際の `BoneMotionPlayer` iframeを起動する。上部にFPS、フレーム間隔、追従数、同時ボーンプレイヤー数、取得可能時のJSヒープ量を表示し、`全削除`で負荷を戻せる。
- TODO: Vueビルド、追加数を段階的に増やすブラウザ試験、標準web-gameクライアント、スクリーンショット目視、実測結果の記録。
