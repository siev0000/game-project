const STORAGE_KEY = 'bone_editor_compact_single_v34';
const PREVIOUS_STORAGE_KEY = 'bone_editor_compact_single_v33';
const INSPECTOR_COLLAPSE_KEY = 'bone_editor_inspector_collapse_v1';
const PANEL_LAYOUT_KEY = 'bone_editor_panel_layout_v1';
const CURRENT_PROJECT_ID_KEY = 'bone_editor_current_source_project_v1';
const editorUrlParams = new URLSearchParams(window.location.search);
const embeddedPreviewMode = editorUrlParams.get('preview') === '1';
let pendingEmbeddedAnimationId = null;
let embeddedPreviewReady = false;
if(embeddedPreviewMode) document.documentElement.classList.add('preview-mode');
if(embeddedPreviewMode && editorUrlParams.get('transparent') === '1') document.documentElement.classList.add('preview-transparent');
const stageEl = document.getElementById('stage');
const characterEl = document.getElementById('character');
const nameInputEl = document.getElementById('nameInput');
const backgroundImageLayerEl = document.getElementById('backgroundImageLayer');
const backgroundImageStatusEl = document.getElementById('backgroundImageStatus');
const backgroundImageInputEl = document.getElementById('backgroundImageInput');
const backgroundAdjustValueEl = document.getElementById('backgroundAdjustValue');
const boneInspectorEl = document.getElementById('boneInspector');
const backgroundInspectorEl = document.getElementById('backgroundInspector');
const inspectorTitleEl = document.getElementById('inspectorTitle');
const connectionsEl = document.getElementById('connections');
const anchorRingEl = document.getElementById('anchorRing');
const resizeOverlayEl = document.getElementById('resizeOverlay');
const resizeBoxEl = document.getElementById('resizeBox');
let boneOverlayEl = null;
const boneOverlayEls = {};
const boneDisplaySizeModeInputEl = document.getElementById('boneDisplaySizeModeInput');
const boneDisplayWidthInputEl = document.getElementById('boneDisplayWidthInput');
const boneDisplayHeightInputEl = document.getElementById('boneDisplayHeightInput');
const frameListEl = document.getElementById('frameList');
const layerListEl = document.getElementById('layerList');
const jsonAreaEl = document.getElementById('jsonArea');
const modeHintEl = document.getElementById('modeHint');
const poseHintEl = document.getElementById('poseHint');
const parentInputEl = document.getElementById('parentInput');
const editModeSelectEl = document.getElementById('editModeSelect');
const shapeInputEl = document.getElementById('shapeInput');
const inspectorEl = document.getElementById('inspector');
const workspaceEl = document.getElementById('workspace');
const boneCountEl = document.getElementById('boneCount');
const jsonDialogEl = document.getElementById('jsonDialog');
const rotateModeBtn = document.getElementById('rotateModeBtn');
const moveModeBtn = document.getElementById('moveModeBtn');
const wholeMoveModeBtn = document.getElementById('wholeMoveModeBtn');
const scaleModeBtn = document.getElementById('scaleModeBtn');
const anchorModeBtn = document.getElementById('anchorModeBtn');
const anchorEditorEl = document.getElementById('anchorEditor');
const settingsDialogEl = document.getElementById('settingsDialog');
const saveDialogEl = document.getElementById('saveDialog');
const spriteExportDialogEl = document.getElementById('spriteExportDialog');
const spriteExportSummaryEl = document.getElementById('spriteExportSummary');
const spriteExportStatusEl = document.getElementById('spriteExportStatus');
const spriteExportRunBtn = document.getElementById('spriteExportRunBtn');
const groundLineEl = document.getElementById('groundLine');
const wholeScaleOverlayEl = document.getElementById('wholeScaleOverlay');
const wholeScaleBoxEl = document.getElementById('wholeScaleBox');
const onionSkinCanvasEl = document.getElementById('onionSkinCanvas');
const frameStatusEl = document.getElementById('frameStatus');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const leftPanelResizerEl = document.getElementById('leftPanelResizer');
const rightPanelResizerEl = document.getElementById('rightPanelResizer');
const imageCropDialogEl = document.getElementById('imageCropDialog');
const cropEditorImageEl = document.getElementById('cropEditorImage');
const cropImageFrameEl = document.getElementById('cropImageFrame');
const cropSelectionsEl = document.getElementById('cropSelections');
const cropBoneSelectEl = document.getElementById('cropBoneSelect');
const cropBoneChecksEl = document.getElementById('cropBoneChecks');
const cropSourceLabelEl = document.getElementById('cropSourceLabel');
const cropImageRotateHandleEl = document.getElementById('cropImageRotateHandle');
const cropHeaderRotationValueEl = document.getElementById('cropHeaderRotationValue');
const cropZoomValueEl = document.getElementById('cropZoomValue');
const projectLibraryDialogEl = document.getElementById('projectLibraryDialog');
const projectLibraryListEl = document.getElementById('projectLibraryList');
const projectLibraryStatusEl = document.getElementById('projectLibraryStatus');
const currentProjectNameEl = document.getElementById('currentProjectName');
const projectNameInputEl = document.getElementById('projectNameInput');
const animationSelectEl = document.getElementById('animationSelect');
const motionManagerDialogEl = document.getElementById('motionManagerDialog');
const motionManagerListEl = document.getElementById('motionManagerList');
const motionCreateModeEl = document.getElementById('motionCreateMode');
const motionCopySourceSelectEl = document.getElementById('motionCopySourceSelect');
const motionCopySourceFieldEl = document.getElementById('motionCopySourceField');
const tweenFrameDialogEl = document.getElementById('tweenFrameDialog');
const tweenPartialPanelEl = document.getElementById('tweenPartialPanel');
const tweenWholePanelEl = document.getElementById('tweenWholePanel');
const tweenPartialCountSelectEl = document.getElementById('tweenPartialCountSelect');
const tweenWholeMultiplierSelectEl = document.getElementById('tweenWholeMultiplierSelect');
const tweenFrameSummaryEl = document.getElementById('tweenFrameSummary');
const tweenFrameApplyBtn = document.getElementById('tweenFrameApplyBtn');
const copyFrameDialogEl = document.getElementById('copyFrameDialog');
const copyFrameTargetSelectEl = document.getElementById('copyFrameTargetSelect');
const meshBindingDialogEl = document.getElementById('meshBindingDialog');
const meshChainSelectEl = document.getElementById('meshChainSelect');
const meshChainStartSelectEl = document.getElementById('meshChainStartSelect');
const meshChainEndSelectEl = document.getElementById('meshChainEndSelect');
const meshPreviewImageEl = document.getElementById('meshPreviewImage');
const meshPreviewFrameEl = document.getElementById('meshPreviewFrame');
const meshControlOverlayEl = document.getElementById('meshControlOverlay');
const meshSourceLabelEl = document.getElementById('meshSourceLabel');
const meshZoomValueEl = document.getElementById('meshZoomValue');
const partReferenceDialogEl = document.getElementById('partReferenceDialog');
const partReferenceImageEl = document.getElementById('partReferenceImage');
const baseImageInputEl = document.getElementById('baseImageInput');
const baseImageSourceStatusEl = document.getElementById('baseImageSourceStatus');
const imageSlotInputEl = document.getElementById('imageSlotInput');

function uid(){ return 'layer_' + Math.random().toString(36).slice(2,10); }
function clone(obj){ return JSON.parse(JSON.stringify(obj)); }
function rotate(x,y,deg){ const r = deg*Math.PI/180; const c=Math.cos(r), s=Math.sin(r); return {x:x*c-y*s, y:x*s+y*c}; }
function angleDeg(x1,y1,x2,y2){ return Math.atan2(y2-y1, x2-x1) * 180 / Math.PI; }
function clamp01(v){ if(isNaN(v)) return 0; return Math.max(0, Math.min(1, v)); }
function num(id){ return parseFloat(document.getElementById(id).value) || 0; }
function basename(name){ return name.replace(/\.[^.]+$/, ''); }
function cleanBoneName(name){
  return String(name ?? '').trim();
}
function isBoneNameTaken(name, excludeId=null){
  const target = cleanBoneName(name);
  if(!target) return false;
  return project.layerOrder.some(id => id !== excludeId && cleanBoneName(project.layers[id]?.name) === target);
}
function uniqueBoneName(base='ボーン', excludeId=null){
  const clean = cleanBoneName(base) || 'ボーン';
  if(!isBoneNameTaken(clean, excludeId)) return clean;
  let n = 2;
  while(isBoneNameTaken(`${clean}${n}`, excludeId)) n++;
  return `${clean}${n}`;
}
function defaultBoneColor(key=''){
  const map = {
    waist:'#d8875f', abdomen:'#d9a066', chest:'#d6b66a', neck:'#b7c7d6', head:'#cfd7e2',
    armRU:'#ff6b6b', armRL:'#ff8787', handR:'#ffb3b3',
    armLU:'#4dabf7', armLL:'#74c0fc', handL:'#a5d8ff',
    legRU:'#845ef7', legRL:'#9775fa', footR:'#b197fc', toeR:'#c4b5fd',
    legLU:'#20c997', legLL:'#38d9a9', footL:'#63e6be', toeL:'#96f2d7'
  };
  if(map[key]) return map[key];
  const palette=['#ff8787','#74c0fc','#63e6be','#ffd43b','#b197fc','#ffa94d','#f783ac','#a9e34b'];
  let hash=0; for(const ch of key) hash=(hash*31 + ch.charCodeAt(0))>>>0;
  return palette[hash % palette.length];
}
function ensureLayerColor(layer){ if(layer && !layer.color) layer.color = defaultBoneColor(layer.key || layer.name || 'bone'); }
function ensureImageAdjustments(layer){
  if(!layer) return;
  if(layer.imageOffsetX === undefined) layer.imageOffsetX = 0;
  if(layer.imageOffsetY === undefined) layer.imageOffsetY = 0;
  if(layer.imageScaleX === undefined) layer.imageScaleX = 1;
  if(layer.imageScaleY === undefined) layer.imageScaleY = 1;
  if(layer.imageRotation === undefined) layer.imageRotation = 0;
  if(layer.imageFlipX === undefined) layer.imageFlipX = false;
  if(layer.imageFlipY === undefined) layer.imageFlipY = false;
  if(layer.imageOpacity === undefined) layer.imageOpacity = 1;
}
function resetImageAdjustments(layer){
  if(!layer) return;
  layer.imageOffsetX = 0;
  layer.imageOffsetY = 0;
  layer.imageScaleX = 1;
  layer.imageScaleY = 1;
  layer.imageRotation = 0;
  layer.imageFlipX = false;
  layer.imageFlipY = false;
  layer.imageOpacity = 1;
}

function imageSourceUid(){ return 'img_' + Math.random().toString(36).slice(2,10); }
function backgroundUid(){ return 'background_' + Math.random().toString(36).slice(2,10); }
const IMAGE_SLOT_DEFS = [
  {id:'body',label:'体',selectId:'imageSlotBodySelect'},
  {id:'face',label:'顔',selectId:'imageSlotFaceSelect'},
  {id:'held',label:'手持ち',selectId:'imageSlotHeldSelect'},
  {id:'decoration',label:'装飾',selectId:'imageSlotDecorationSelect'}
];
let imageUploadTargetSlot = 'body';

function ensureImageCrop(layer){
  if(!layer) return;
  if(layer.imageCropX === undefined) layer.imageCropX = 0;
  if(layer.imageCropY === undefined) layer.imageCropY = 0;
  if(layer.imageCropW === undefined) layer.imageCropW = 1;
  if(layer.imageCropH === undefined) layer.imageCropH = 1;
  layer.imageCropX = Math.max(0, Math.min(1, Number(layer.imageCropX) || 0));
  layer.imageCropY = Math.max(0, Math.min(1, Number(layer.imageCropY) || 0));
  layer.imageCropW = Math.max(0.01, Math.min(1 - layer.imageCropX, Number(layer.imageCropW) || 1));
  layer.imageCropH = Math.max(0.01, Math.min(1 - layer.imageCropY, Number(layer.imageCropH) || 1));
  if(layer.imageFragmentData === undefined) layer.imageFragmentData = null;
}

function resetImageCrop(layer){
  if(!layer) return;
  layer.imageCropX = 0;
  layer.imageCropY = 0;
  layer.imageCropW = 1;
  layer.imageCropH = 1;
  layer.imageFragmentData = null;
}

function clearLayerImage(layer){
  if(!layer) return;
  layer.imageSourceId = null;
  layer.imageSourceSlot = null;
  layer.imageSourceRole = null;
  layer.imageData = null;
  layer.imageFragmentData = null;
}

function removeOrphanImageSource(sourceId){
  if(!sourceId || !project.imageSources?.[sourceId]) return;
  const stillUsed = project.layerOrder.some(id => project.layers[id]?.imageSourceId === sourceId)
    || project.layerOrder.some(id => Object.values(project.layers[id]?.morphs || {}).some(morph=>morph?.imageSourceId===sourceId))
    || Object.values(project.meshBindings || {}).some(binding => binding.sourceId === sourceId)
    || Object.values(project.imageSlots || {}).some(slot=>slot.sourceIds?.includes(sourceId))
    || (project.backgrounds || []).some(background=>background?.sourceId===sourceId)
    || project.baseImageSourceId === sourceId;
  if(!stillUsed){
    delete project.imageSources[sourceId];
    if(project.baseImageSourceId === sourceId) project.baseImageSourceId = null;
  }
}

function registerImageSource(data, name='画像'){
  if(!project.imageSources) project.imageSources = {};
  const existing = Object.values(project.imageSources).find(src => src?.data === data);
  if(existing) return existing.id;
  const id = imageSourceUid();
  project.imageSources[id] = {id, name:name || '画像', data, cropRotation:0, cropFlipX:false, cropFlipY:false};
  return id;
}

function activeImageSlotSourceId(slotId){
  const slot=slotId ? project.imageSlots?.[slotId] : null;
  return slot?.activeSourceId && project.imageSources?.[slot.activeSourceId] ? slot.activeSourceId : null;
}

function imageSlotForSourceId(sourceId){
  return IMAGE_SLOT_DEFS.find(def=>project.imageSlots?.[def.id]?.sourceIds?.includes(sourceId))?.id || null;
}

function ensureImageSlots(){
  const legacyBase=project.baseImageSourceId && project.imageSources?.[project.baseImageSourceId] ? project.baseImageSourceId : null;
  if(!project.imageSlots || typeof project.imageSlots!=='object') project.imageSlots={};
  IMAGE_SLOT_DEFS.forEach(def=>{
    const old=project.imageSlots[def.id] || {};
    const sourceIds=[...new Set(Array.isArray(old.sourceIds)?old.sourceIds.filter(id=>project.imageSources?.[id]):[])];
    if(def.id==='body' && legacyBase && !sourceIds.includes(legacyBase)) sourceIds.unshift(legacyBase);
    const activeSourceId=sourceIds.includes(old.activeSourceId) ? old.activeSourceId : sourceIds[0] || null;
    const activeSource=activeSourceId ? project.imageSources[activeSourceId] : null;
    project.imageSlots[def.id]={
      id:def.id,label:def.label,sourceIds,activeSourceId,
      cropRotation:Number.isFinite(Number(old.cropRotation))?Number(old.cropRotation):Number(activeSource?.cropRotation)||0,
      cropFlipX:old.cropFlipX===undefined?!!activeSource?.cropFlipX:!!old.cropFlipX,
      cropFlipY:old.cropFlipY===undefined?!!activeSource?.cropFlipY:!!old.cropFlipY
    };
  });
  const bodyActive=activeImageSlotSourceId('body');
  project.baseImageSourceId=bodyActive;
  project.layerOrder?.forEach(id=>{
    const layer=project.layers?.[id];
    if(!layer) return;
    if(layer.imageSourceSlot && !project.imageSlots[layer.imageSourceSlot]) layer.imageSourceSlot=null;
    if(!layer.imageSourceSlot && legacyBase && layer.imageSourceId===legacyBase && (layer.imageSourceRole==='base' || !layer.imageSourceRole)) layer.imageSourceSlot='body';
    const active=activeImageSlotSourceId(layer.imageSourceSlot);
    if(active){ layer.imageSourceId=active; layer.imageSourceRole='slot'; }
  });
  Object.values(project.meshBindings || {}).forEach(binding=>{
    if(binding.imageSourceSlot && !project.imageSlots[binding.imageSourceSlot]) binding.imageSourceSlot=null;
    if(!binding.imageSourceSlot && legacyBase && binding.sourceId===legacyBase) binding.imageSourceSlot='body';
    const active=activeImageSlotSourceId(binding.imageSourceSlot);
    if(active) binding.sourceId=active;
  });
}

function syncSlotTransform(slotId){
  const slot=project.imageSlots?.[slotId];
  if(!slot) return;
  slot.sourceIds.forEach(sourceId=>{
    const source=project.imageSources?.[sourceId];
    if(!source) return;
    source.cropRotation=normalizedRotation(slot.cropRotation);
    source.cropFlipX=!!slot.cropFlipX;
    source.cropFlipY=!!slot.cropFlipY;
  });
}

async function refreshImageSlotAssignments(slotId){
  const slot=project.imageSlots?.[slotId];
  if(!slot) return;
  const sourceId=activeImageSlotSourceId(slotId);
  const source=sourceId ? project.imageSources?.[sourceId] : null;
  syncSlotTransform(slotId);
  let previewData=null;
  if(source?.data) previewData=await createRotatedSourceData(source.data,slot.cropRotation,slot.cropFlipX,slot.cropFlipY);
  for(const id of project.layerOrder){
    const layer=project.layers[id];
    if(layer?.imageSourceSlot!==slotId) continue;
    layer.imageSourceId=sourceId;
    layer.imageSourceRole='slot';
    layer.imageFragmentData=previewData ? await createCropFragment(previewData,cropForLayer(layer)) : null;
  }
  Object.values(project.meshBindings || {}).forEach(binding=>{
    if(binding.imageSourceSlot===slotId) binding.sourceId=sourceId;
  });
}

async function activateImageSlot(slotId,sourceId){
  const slot=project.imageSlots?.[slotId];
  if(!slot || (sourceId && !slot.sourceIds.includes(sourceId))) return;
  slot.activeSourceId=sourceId || null;
  if(slotId==='body') project.baseImageSourceId=slot.activeSourceId;
  await refreshImageSlotAssignments(slotId);
  render();
}

function ensureLayerImageSource(layer){
  if(!layer) return null;
  if(!project.imageSources) project.imageSources = {};
  const slottedId=activeImageSlotSourceId(layer.imageSourceSlot);
  if(slottedId){
    layer.imageSourceId=slottedId;
    ensureImageCrop(layer);
    return slottedId;
  }
  if(layer.imageSourceId && project.imageSources[layer.imageSourceId]){
    ensureImageCrop(layer);
    return layer.imageSourceId;
  }
  // v33以前のimageDataを共有画像ソースへ自動移行。
  if(layer.imageData){
    layer.imageSourceId = registerImageSource(layer.imageData, `${layer.name || 'ボーン'}_image`);
    layer.imageData = null;
    ensureImageCrop(layer);
    return layer.imageSourceId;
  }
  return null;
}

function getLayerImageSource(layer){
  const id = ensureLayerImageSource(layer);
  const source = id ? project.imageSources?.[id] || null : null;
  if(source){
    if(!Number.isFinite(Number(source.cropRotation))) source.cropRotation = 0;
    source.cropFlipX = !!source.cropFlipX;
    source.cropFlipY = !!source.cropFlipY;
  }
  return source;
}

function getLayerImageData(layer){
  return getLayerImageSource(layer)?.data || layer?.imageData || null;
}

function getLayerRenderImageData(layer){
  ensureImageCrop(layer);
  return layer?.imageFragmentData || getLayerImageData(layer);
}

function layerUsesBakedFragment(layer){
  return !!layer?.imageFragmentData;
}

function defaultBoneEndpoints(shape='bar'){
  switch(shape){
    case 'torso': return {ox:0.5,oy:0.88,tailX:0.5,tailY:0.10};
    case 'circle': return {ox:0.5,oy:0.50,tailX:0.5,tailY:1.00};
    case 'foot': return {ox:0.18,oy:0.55,tailX:0.92,tailY:0.55};
    case 'hand': return {ox:0.5,oy:0.20,tailX:0.5,tailY:0.90};
    default: return {ox:0.5,oy:0.08,tailX:0.5,tailY:1.00};
  }
}
function ensureBoneEndpoints(layer){
  if(!layer) return;
  const d = defaultBoneEndpoints(layer.shape || 'bar');
  // 旧データでは回転軸(ox/oy)が頭点を兼ねていた。初回読込時だけ現在値を頭点へ引き継ぐ。
  if(layer.headX === undefined) layer.headX = Number.isFinite(Number(layer.ox)) ? Number(layer.ox) : d.ox;
  if(layer.headY === undefined) layer.headY = Number.isFinite(Number(layer.oy)) ? Number(layer.oy) : d.oy;
  if(layer.tailX === undefined) layer.tailX = d.tailX;
  if(layer.tailY === undefined) layer.tailY = d.tailY;
}

function createDefaultPartGroups(layers,layerOrder){
  const groupDefs=[
    {id:'head',name:'頭',slot:'head',keys:['head']},
    {id:'torso',name:'胴体',slot:'torso',keys:['waist','abdomen','chest','neck']},
    {id:'right_arm',name:'右腕',slot:'right_arm',keys:['armRU','armRL','handR']},
    {id:'left_arm',name:'左腕',slot:'left_arm',keys:['armLU','armLL','handL']},
    {id:'right_leg',name:'右脚',slot:'right_leg',keys:['legRU','legRL','footR','toeR']},
    {id:'left_leg',name:'左脚',slot:'left_leg',keys:['legLU','legLL','footL','toeL']}
  ];
  return Object.fromEntries(groupDefs.map(group=>{
    const boneIds=layerOrder.filter(id=>group.keys.includes(layers[id]?.key));
    return [group.id,{id:group.id,name:group.name,slot:group.slot,boneIds,boneKeys:boneIds.map(id=>layers[id].key),renderMode:boneIds.length>1?'mesh':'rigid'}];
  }));
}

function getPartGroupIdForLayer(layerId){
  return Object.values(project.partGroups || {}).find(group => (group?.boneIds || []).includes(layerId))?.id || null;
}

function horizontalCropPeerIds(activeId=cropEditorState?.currentBoneId){
  if(!cropEditorState) return [];
  const ids = [...cropEditorState.shared];
  if(!cropEditorState.groupHorizontalByPart) return ids;
  const groupId = getPartGroupIdForLayer(activeId);
  return groupId ? ids.filter(id => getPartGroupIdForLayer(id) === groupId) : [activeId];
}

function createRigProject(defs,{rigType='standard_2d',poseType='front',name='motion',fps=8,referencePoseName='初期姿勢'}={}){
  const keyToId = {};
  defs.forEach(d => keyToId[d.key] = uid());
  const layerOrder = defs.map(d => keyToId[d.key]);
  const layers = {};
  const frame = {};
  defs.forEach(d => {
    const id = keyToId[d.key];
    layers[id] = {
      id,key:d.key,name:d.name,shape:d.shape,parent:d.parent ? keyToId[d.parent] : null,
      attachX:d.attachX,attachY:d.attachY,ox:d.ox,oy:d.oy,headX:d.ox,headY:d.oy,tailX:d.tailX,tailY:d.tailY,shapeFlipX:!!d.shapeFlipX,
      imageData:null,imageSourceId:null,imageCropX:0,imageCropY:0,imageCropW:1,imageCropH:1,
      color:defaultBoneColor(d.key),attached:true,imageOffsetX:0,imageOffsetY:0,imageScaleX:1,imageScaleY:1,
      imageRotation:0,imageFlipX:false,imageFlipY:false,imageOpacity:1
    };
    frame[id] = clone(d.pose);
  });
  return {
    meta:{name,fps,rigType,poseType,editMode:'rotate',imageDisplayScale:1,referencePose:clone(frame),referencePoseName,display:{labels:true,anchors:true,lines:true,bones:true,images:true,grid:true,groundVisible:true,centerGuides:true},ground:{enabled:true,y:880,autoFoot:true,airAngle:60}},
    baseImageSourceId:null,imageSources:{},meshBindings:{},partGroups:createDefaultPartGroups(layers,layerOrder),layerOrder,layers,
    defaultFrame:frame,animations:[]
  };
}

function createHumanoidProject(poseType='side'){
  const defs = [
    {key:'waist', name:'腰', parent:null, shape:'torso', attachX:0, attachY:0, ox:0.5, oy:0.5, pose:{x:500,y:604,w:117,h:64,r:0,z:6}},
    {key:'chest', name:'胸', parent:'waist', shape:'torso', attachX:0.5, attachY:0.18, ox:0.5, oy:0.88, pose:{x:0,y:0,w:132,h:108,r:-1,z:8}},
    {key:'neck', name:'首', parent:'chest', shape:'bar', attachX:0.5, attachY:0.04, ox:0.5, oy:0.78, pose:{x:0,y:-2,w:42,h:34,r:0,z:9}},
    {key:'head', name:'頭', parent:'neck', shape:'circle', attachX:0.5, attachY:0.05, ox:0.5, oy:0.82, pose:{x:0,y:-6,w:108,h:108,r:0,z:10}},

    // 右腕・右脚 = 手前。左腕・左脚 = 奥。
    {key:'armRU', name:'右上腕', parent:'chest', shape:'bar', attachX:0.18, attachY:0.18, ox:0.5, oy:0.10, pose:{x:-15,y:-2,w:34,h:100,r:7,z:12}},
    {key:'armRL', name:'右前腕', parent:'armRU', shape:'bar', attachX:0.5, attachY:1.0, ox:0.5, oy:0.08, pose:{x:0,y:0,w:30,h:94,r:-2,z:13}},
    {key:'handR', name:'右手', parent:'armRL', shape:'hand', attachX:0.5, attachY:1.0, ox:0.5, oy:0.20, pose:{x:0,y:0,w:40,h:40,r:2,z:14}},

    {key:'armLU', name:'左上腕', parent:'chest', shape:'bar', attachX:0.82, attachY:0.18, ox:0.5, oy:0.10, pose:{x:5,y:0,w:34,h:100,r:-12,z:4}},
    {key:'armLL', name:'左前腕', parent:'armLU', shape:'bar', attachX:0.5, attachY:1.0, ox:0.5, oy:0.08, pose:{x:0,y:0,w:30,h:94,r:0,z:3}},
    {key:'handL', name:'左手', parent:'armLL', shape:'hand', attachX:0.5, attachY:1.0, ox:0.5, oy:0.20, pose:{x:0,y:0,w:40,h:40,r:-2,z:2}},

    {key:'legRU', name:'右太腿', parent:'waist', shape:'bar', attachX:0.38, attachY:0.82, ox:0.5, oy:0.08, pose:{x:-21,y:1,w:42,h:132,r:2,z:11}},
    {key:'legRL', name:'右すね', parent:'legRU', shape:'bar', attachX:0.5, attachY:1.0, ox:0.5, oy:0.08, pose:{x:0,y:0,w:38,h:124,r:2,z:12}},
    {key:'footR', name:'右足', parent:'legRL', shape:'foot', attachX:0.5, attachY:1.0, ox:0.18, oy:0.55, pose:{x:0,y:0,w:45,h:36,r:-4,z:13}},

    {key:'legLU', name:'左太腿', parent:'waist', shape:'bar', attachX:0.62, attachY:0.82, ox:0.5, oy:0.08, pose:{x:22,y:0,w:42,h:132,r:-8,z:5}},
    {key:'legLL', name:'左すね', parent:'legLU', shape:'bar', attachX:0.5, attachY:1.0, ox:0.5, oy:0.08, pose:{x:0,y:0,w:38,h:124,r:6,z:4}},
    {key:'footL', name:'左足', parent:'legLL', shape:'foot', attachX:0.5, attachY:1.0, ox:0.18, oy:0.55, pose:{x:0,y:0,w:76,h:28,r:2,z:3}},
  ];
  if(poseType==='side'){
    defs.push(
      {key:'toeR', name:'右つま先', parent:'footR', shape:'bar', attachX:0.92, attachY:0.55, ox:0.5, oy:0.08, tailX:0.5, tailY:1, pose:{x:0,y:0,w:20,h:34,r:-90,z:15}},
      {key:'toeL', name:'左つま先', parent:'footL', shape:'bar', attachX:0.92, attachY:0.55, ox:0.5, oy:0.08, tailX:0.5, tailY:1, pose:{x:0,y:0,w:18,h:34,r:-90,z:1}}
    );
  }
  if(poseType==='front'){
    const front={
      waist:{attachX:0,pose:{x:500,y:598,w:148,h:70,r:0,z:6}},
      chest:{attachX:.5,pose:{x:0,y:0,w:178,h:112,r:0,z:8}},
      neck:{attachX:.5,pose:{x:0,y:-2,w:48,h:36,r:0,z:9}},
      head:{attachX:.5,pose:{x:0,y:-8,w:118,h:118,r:0,z:10}},
      armRU:{attachX:.08,attachY:.2,pose:{x:0,y:0,w:42,h:108,r:8,z:12}},
      armRL:{attachX:.5,pose:{x:0,y:0,w:38,h:100,r:-4,z:13}},
      handR:{attachX:.5,pose:{x:0,y:0,w:46,h:46,r:-2,z:14}},
      armLU:{attachX:.92,attachY:.2,pose:{x:0,y:0,w:42,h:108,r:-8,z:12}},
      armLL:{attachX:.5,pose:{x:0,y:0,w:38,h:100,r:4,z:13}},
      handL:{attachX:.5,pose:{x:0,y:0,w:46,h:46,r:2,z:14}},
      legRU:{attachX:.28,attachY:.84,pose:{x:0,y:0,w:48,h:138,r:3,z:11}},
      legRL:{attachX:.5,pose:{x:0,y:0,w:44,h:130,r:-3,z:12}},
      footR:{attachX:.5,ox:.82,tailX:.08,tailY:.55,shapeFlipX:true,pose:{x:0,y:0,w:54,h:42,r:0,z:13}},
      legLU:{attachX:.72,attachY:.84,pose:{x:0,y:0,w:48,h:138,r:-3,z:11}},
      legLL:{attachX:.5,pose:{x:0,y:0,w:44,h:130,r:3,z:12}},
      footL:{attachX:.5,ox:.18,tailX:.92,tailY:.55,shapeFlipX:false,pose:{x:0,y:0,w:54,h:42,r:0,z:13}}
    };
    defs.forEach(def=>{
      const settings=front[def.key];
      if(!settings) return;
      Object.assign(def,settings,{pose:{...def.pose,...settings.pose}});
    });
  }
  const referencePoseName=poseType==='front'?'通常2D・正面姿勢':'通常2D・横向き姿勢';
  return createRigProject(defs,{rigType:'standard_2d',poseType,referencePoseName});
}

function createPixelHumanoidProject(poseType='front'){
  const defs=[
    {key:'waist',name:'腰',parent:null,shape:'torso',attachX:0,attachY:0,ox:.5,oy:.5,pose:{x:500,y:673,w:104,h:74,r:0,z:6}},
    {key:'chest',name:'体',parent:'waist',shape:'torso',attachX:.5,attachY:.15,ox:.5,oy:.9,pose:{x:0,y:0,w:122,h:150,r:0,z:7}},
    {key:'head',name:'頭',parent:'chest',shape:'circle',attachX:.5,attachY:.03,ox:.5,oy:.88,pose:{x:0,y:-4,w:96,h:96,r:0,z:8}},
    {key:'armRU',name:'右上腕',parent:'chest',shape:'bar',attachX:.12,attachY:.2,ox:.5,oy:.08,pose:{x:0,y:0,w:38,h:74,r:5,z:12}},
    {key:'armRL',name:'右腕',parent:'armRU',shape:'bar',attachX:.5,attachY:1,ox:.5,oy:.08,pose:{x:0,y:0,w:34,h:70,r:-3,z:13}},
    {key:'handR',name:'右手',parent:'armRL',shape:'hand',attachX:.5,attachY:1,ox:.5,oy:.18,pose:{x:0,y:0,w:40,h:40,r:-2,z:14}},
    {key:'armLU',name:'左上腕',parent:'chest',shape:'bar',attachX:.88,attachY:.2,ox:.5,oy:.08,pose:{x:0,y:0,w:38,h:74,r:-5,z:12}},
    {key:'armLL',name:'左腕',parent:'armLU',shape:'bar',attachX:.5,attachY:1,ox:.5,oy:.08,pose:{x:0,y:0,w:34,h:70,r:3,z:13}},
    {key:'handL',name:'左手',parent:'armLL',shape:'hand',attachX:.5,attachY:1,ox:.5,oy:.18,pose:{x:0,y:0,w:40,h:40,r:2,z:14}},
    {key:'legRU',name:'右太腿',parent:'waist',shape:'bar',attachX:.3,attachY:.82,ox:.5,oy:.08,pose:{x:0,y:0,w:44,h:98,r:2,z:10}},
    {key:'legRL',name:'右すね',parent:'legRU',shape:'bar',attachX:.5,attachY:1,ox:.5,oy:.08,pose:{x:0,y:0,w:40,h:94,r:-2,z:11}},
    {key:'footR',name:'右足首',parent:'legRL',shape:'foot',attachX:.5,attachY:1,ox:.82,oy:.55,tailX:.08,tailY:.55,shapeFlipX:true,pose:{x:0,y:0,w:54,h:40,r:0,z:12}},
    {key:'legLU',name:'左太腿',parent:'waist',shape:'bar',attachX:.7,attachY:.82,ox:.5,oy:.08,pose:{x:0,y:0,w:44,h:98,r:-2,z:10}},
    {key:'legLL',name:'左すね',parent:'legLU',shape:'bar',attachX:.5,attachY:1,ox:.5,oy:.08,pose:{x:0,y:0,w:40,h:94,r:2,z:11}},
    {key:'footL',name:'左足首',parent:'legLL',shape:'foot',attachX:.5,attachY:1,ox:.18,oy:.55,tailX:.92,tailY:.55,shapeFlipX:false,pose:{x:0,y:0,w:54,h:40,r:0,z:12}}
  ];
  if(poseType==='side'){
    // `pixel_side_motion` で調整した横向き基準姿勢。新規作成時もこの姿勢から始める。
    const side={
      waist:{pose:{x:500,y:675,w:76,h:70,r:0,z:6}},
      chest:{pose:{x:0,y:0,w:84,h:146,r:0,z:7}},
      head:{attachX:.56,pose:{x:-1,y:-4,w:82,h:96,r:0,z:8}},
      armRU:{attachX:.34,pose:{x:-20,y:-14,w:38,h:98,r:5,z:12}},
      armRL:{pose:{x:0,y:0,w:32,h:70,r:-1,z:13}},
      handR:{pose:{x:0,y:0,w:38,h:38,r:-2,z:14}},
      armLU:{attachX:.55,pose:{x:38,y:-13,w:34,h:80,r:-4,z:3}},
      armLL:{pose:{x:0,y:0,w:30,h:77,r:3,z:2}},
      handL:{pose:{x:0,y:0,w:36,h:36,r:1,z:1}},
      legRU:{attachX:.42,pose:{x:-21,y:-3,w:43,h:112,r:6,z:11}},
      legRL:{pose:{x:0,y:0,w:36,h:106,r:-2,z:12}},
      footR:{ox:.18,tailX:.92,shapeFlipX:false,pose:{x:0,y:0,w:58,h:38,r:0,z:13}},
      legLU:{attachX:.58,pose:{x:12,y:-3,w:39,h:107,r:-2,z:4}},
      legLL:{pose:{x:0,y:0,w:36,h:103,r:2,z:3}},
      footL:{ox:.18,tailX:.92,shapeFlipX:false,pose:{x:0,y:0,w:56,h:36,r:0,z:2}}
    };
    defs.forEach(def=>{
      const settings=side[def.key];
      if(!settings) return;
      Object.assign(def,settings,{pose:{...def.pose,...settings.pose}});
    });
  }
  const name=poseType==='side'?'pixel_side_motion':'pixel_motion';
  const referencePoseName=poseType==='side'?'ドット2D・横向き15ボーン':'ドット2D・正面15ボーン';
  return createRigProject(defs,{rigType:'pixel_simple',poseType,name,fps:6,referencePoseName});
}

function defaultProject(){ return createHumanoidProject('side'); }
function loadProject(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw) return JSON.parse(raw);
    const previous = localStorage.getItem(PREVIOUS_STORAGE_KEY);
    if(previous){
      const migrated = JSON.parse(previous);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  }catch(e){}
  return defaultProject();
}

let project = loadProject();
// 「表示サイズだけ調整」は保存内容ではなく、その場だけの編集ツールとして扱う。
// 前回ONのJSONを開いても通常の実サイズ編集から開始する。
if(project.meta) project.meta.boneDisplaySizeMode=false;
ensureProjectSettings();
let currentSourceProjectId = localStorage.getItem(CURRENT_PROJECT_ID_KEY) || null;
let currentAnimationId = null;
let currentFrame = 0;
let selectedLayer = null;
let backgroundSelected = false;
let selectedBackgroundId = project.backgrounds?.[0]?.id || null;
let selectedManagedMotionId = null;
let playing = false;
let playbackRequestId = null;
let playbackLastTime = 0;
let playbackAccumulator = 0;
let dragState = null;
let stagePanState = null;
let stageView = {x:0,y:0,zoom:1};
let backgroundAdjustMode = false;
let backgroundDragState = null;
let backgroundWheelCommitTimer = null;
let wholeScaleDragState = null;
let nameEditingLayerId = null;
let draftAutoSaveBlocked = false;
let draftStorageWarningShown = false;
let onionSkinRenderKey = '';
let onionSkinRenderToken = 0;
const onionImageCache = new Map();
const layerEls = {};
const undoStack = [];
const redoStack = [];
const HISTORY_LIMIT = 60;
let lastDefaultFrameSnapshot = clone(project.defaultFrame);

function snapshotState(){
  return {project:clone(project), currentAnimationId, currentFrame, selectedLayer, backgroundSelected,selectedBackgroundId};
}
function pushHistory(){
  undoStack.push(snapshotState());
  if(undoStack.length > HISTORY_LIMIT) undoStack.shift();
  redoStack.length = 0;
  updateHistoryButtons();
}
function restoreState(state){
  project = clone(state.project);
  onionSkinRenderKey='';
  ensureProjectSettings();
  currentAnimationId = state.currentAnimationId && project.animations.some(animation=>animation.id===state.currentAnimationId) ? state.currentAnimationId : null;
  currentFrame = Math.max(0, Math.min(state.currentFrame ?? 0, activeFrames().length - 1));
  selectedLayer = state.selectedLayer && project.layers[state.selectedLayer] ? state.selectedLayer : null;
  backgroundSelected = !selectedLayer && !!state.backgroundSelected;
  selectedBackgroundId=project.backgrounds.some(background=>background.id===state.selectedBackgroundId) ? state.selectedBackgroundId : project.backgrounds[0]?.id || null;
  lastDefaultFrameSnapshot=clone(project.defaultFrame);
  stop();
  render();
}
function undo(){
  if(!undoStack.length) return;
  redoStack.push(snapshotState());
  restoreState(undoStack.pop());
  updateHistoryButtons();
}
function redo(){
  if(!redoStack.length) return;
  undoStack.push(snapshotState());
  restoreState(redoStack.pop());
  updateHistoryButtons();
}
function updateHistoryButtons(){
  if(undoBtn) undoBtn.disabled = undoStack.length === 0;
  if(redoBtn) redoBtn.disabled = redoStack.length === 0;
}


function safeLocalStorageSet(key, value){
  try{
    localStorage.setItem(key, value);
    return true;
  }catch(error){
    if(!draftStorageWarningShown){
      console.warn('ブラウザの自動バックアップ容量を超えたため、ソースJSONを優先して編集を続行します。', error?.name || error);
      draftStorageWarningShown = true;
    }
    return false;
  }
}

function saveProject(){
  if(!embeddedPreviewMode && !draftAutoSaveBlocked){
    draftAutoSaveBlocked = !safeLocalStorageSet(STORAGE_KEY, JSON.stringify(project));
  }
  if(currentProjectNameEl){
    const animationName=currentAnimation()?.name || 'デフォルト';
    currentProjectNameEl.textContent = `${project.meta?.name || '未保存'} / ${animationName}`;
    currentProjectNameEl.title = draftAutoSaveBlocked
      ? '画像容量が大きいためブラウザ自動バックアップは停止中です。保存メニューの「ソースJSONへ保存」は使用できます。'
      : '';
  }
}

function sourceProjectUid(){
  const date = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  return `motion_${date}_${Math.random().toString(36).slice(2, 6)}`;
}

function animationUid(){ return `animation_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`; }

function replaceCurrentProject(nextProject, sourceId=null){
  project = clone(nextProject);
  if(project.meta) project.meta.boneDisplaySizeMode=false;
  onionSkinRenderKey='';
  ensureProjectSettings();
  currentAnimationId = null;
  lastDefaultFrameSnapshot=clone(project.defaultFrame);
  currentFrame = 0;
  selectedLayer = null;
  backgroundSelected = false;
  selectedBackgroundId=project.backgrounds[0]?.id || null;
  currentSourceProjectId = sourceId;
  draftAutoSaveBlocked = false;
  draftStorageWarningShown = false;
  if(sourceId) safeLocalStorageSet(CURRENT_PROJECT_ID_KEY, sourceId);
  else {
    try{ localStorage.removeItem(CURRENT_PROJECT_ID_KEY); }catch(error){}
  }
  undoStack.length = 0;
  redoStack.length = 0;
  stop();
  render();
}

function initializeProject(requireConfirmation=true,rigType='standard_2d',poseType='side'){
  const label=rigType==='pixel_simple'?(poseType==='front'?'ドット2D・正面':'ドット2D・横向き'):poseType==='front'?'通常2D・正面':'通常2D・横向き';
  if(requireConfirmation && !confirm(`現在の作業内容を閉じて、${label}の新規プロジェクトへ初期化しますか？`)) return false;
  replaceCurrentProject(rigType==='pixel_simple'?createPixelHumanoidProject(poseType):createHumanoidProject(poseType), null);
  if(projectNameInputEl) projectNameInputEl.value = project.meta.name;
  return true;
}

async function fetchSourceProjectLibrary(){
  const response = await fetch('/api/local/bone-motion-projects', { cache:'no-store' });
  const body = await response.json().catch(() => ({}));
  if(!response.ok) throw new Error(body.error || '保存済みモーションを取得できませんでした');
  return body;
}

function renderSourceProjectLibrary(library){
  if(!projectLibraryListEl || !projectLibraryStatusEl) return;
  const entries = Array.isArray(library?.projects) ? library.projects : [];
  projectLibraryStatusEl.textContent = entries.length ? `${entries.length}件の保存済みモーション` : '保存済みモーションはありません';
  projectLibraryListEl.innerHTML = '';
  if(!entries.length){
    projectLibraryListEl.innerHTML = '<div class="project-library-empty">「新規作成」から開始し、保存メニューの「ソースJSONへ保存」でここへ追加できます。</div>';
    return;
  }
  entries.forEach(entry => {
    const card = document.createElement('article');
    card.className = 'project-card';
    const main = document.createElement('button');
    main.type = 'button';
    main.className = 'project-card-main';
    const updated = entry.updatedAt ? new Date(entry.updatedAt).toLocaleString('ja-JP') : '更新日時なし';
    const rigLabel=entry.project?.meta?.rigType==='pixel_simple'?(entry.project?.meta?.poseType==='side'?'ドット2D・横向き':'ドット2D・正面'):entry.project?.meta?.poseType==='front'?'通常2D・正面':'通常2D・横向き';
    const animationCount=entry.project?.animations?.length || 0;
    const frameCount=entry.project?.animations?.reduce((total,animation)=>total+(animation.frames?.length || 0),0) || entry.project?.frames?.length || 0;
    main.innerHTML = `<span class="project-card-name"></span><span class="project-card-meta">${rigLabel} / 派生${animationCount}件・${frameCount}フレーム / ${entry.project?.layerOrder?.length || 0}ボーン<br>${updated}</span>`;
    main.querySelector('.project-card-name').textContent = entry.name || entry.id;
    main.addEventListener('click', () => {
      replaceCurrentProject(entry.project, entry.id);
      if(projectNameInputEl) projectNameInputEl.value = entry.name || entry.id;
      projectLibraryDialogEl?.close();
    });
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'project-card-delete';
    remove.textContent = '削除';
    remove.addEventListener('click', async () => {
      if(!confirm(`「${entry.name || entry.id}」をソースJSONから削除しますか？`)) return;
      try{
        const response = await fetch('/api/local/bone-motion-projects', {
          method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id:entry.id})
        });
        const body = await response.json().catch(() => ({}));
        if(!response.ok) throw new Error(body.error || '削除に失敗しました');
        if(currentSourceProjectId === entry.id){
          currentSourceProjectId = null;
          localStorage.removeItem(CURRENT_PROJECT_ID_KEY);
        }
        renderSourceProjectLibrary(body);
      }catch(error){ alert(error.message); }
    });
    card.append(main, remove);
    projectLibraryListEl.appendChild(card);
  });
}

async function openProjectLibrary(){
  saveDialogEl?.close();
  if(projectLibraryStatusEl) projectLibraryStatusEl.textContent = '保存済みデータを読み込んでいます…';
  if(projectLibraryListEl) projectLibraryListEl.innerHTML = '';
  if(!projectLibraryDialogEl?.open && typeof projectLibraryDialogEl?.showModal === 'function') projectLibraryDialogEl.showModal();
  try{
    renderSourceProjectLibrary(await fetchSourceProjectLibrary());
  }catch(error){
    if(projectLibraryStatusEl) projectLibraryStatusEl.textContent = error.message;
    if(projectLibraryListEl) projectLibraryListEl.innerHTML = '<div class="project-library-empty">ローカル開発サーバーを再起動すると、ソースJSON保存APIが有効になります。</div>';
  }
}

async function saveCurrentProjectToSource(saveAs=false){
  const name = String(projectNameInputEl?.value || project.meta?.name || 'motion').trim();
  if(!name){ alert('保存名を入力してください。'); return false; }
  if(saveAs && currentSourceProjectId && name===String(project.meta?.name || '').trim()){
    alert('別名で保存する名前を入力してください。');
    projectNameInputEl?.focus();
    projectNameInputEl?.select();
    return false;
  }
  project.meta.name = name;
  const id = saveAs ? sourceProjectUid() : (currentSourceProjectId || sourceProjectUid());
  const response = await fetch('/api/local/bone-motion-projects', {
    method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id,name,project})
  });
  const body = await response.json().catch(() => ({}));
  if(!response.ok) throw new Error(body.error || 'ソースJSONへの保存に失敗しました');
  currentSourceProjectId = id;
  safeLocalStorageSet(CURRENT_PROJECT_ID_KEY, id);
  saveProject();
  return true;
}

function createAnimationFromDefault(name){
  const animationName=String(name || '').trim();
  if(!animationName) return null;
  pushHistory();
  const animation={id:animationUid(),name:animationName,fps:Math.max(1,Number(project.meta.fps)||8),loop:true,frames:[clone(project.defaultFrame)]};
  project.animations.push(animation);
  currentAnimationId=animation.id;
  currentFrame=0;
  selectedLayer=null;
  render();
  return animation;
}

function cloneAnimationAsNew(source,name){
  const animationName=String(name || '').trim();
  if(!source || !animationName) return null;
  pushHistory();
  const animation={
    id:animationUid(),name:animationName,fps:source.fps,loop:source.loop!==false,
    frames:source.frames.map(frame=>clone(frame))
  };
  project.animations.splice(project.animations.indexOf(source)+1,0,animation);
  currentAnimationId=animation.id;
  currentFrame=Math.min(currentFrame,animation.frames.length-1);
  selectedLayer=null;
  ensureFrameCompleteness();
  render();
  return animation;
}

function deleteAnimationById(animationId){
  const animation=project.animations.find(item=>item.id===animationId);
  if(!animation || !confirm(`派生アニメーション「${animation.name}」を削除しますか？`)) return false;
  pushHistory();
  project.animations=project.animations.filter(item=>item.id!==animation.id);
  if(currentAnimationId===animation.id){ currentAnimationId=null; currentFrame=0; selectedLayer=null; }
  render();
  return true;
}

function renderMotionManager(){
  if(!motionManagerListEl) return;
  if(!project.animations.some(animation=>animation.id===selectedManagedMotionId)){
    selectedManagedMotionId=currentAnimationId && project.animations.some(animation=>animation.id===currentAnimationId)
      ? currentAnimationId
      : project.animations[0]?.id || null;
  }
  motionManagerListEl.innerHTML='';
  if(!project.animations.length){
    motionManagerListEl.innerHTML='<div class="motion-manager-empty">まだモーションはありません。</div>';
  }else{
    project.animations.forEach(animation=>{
      const button=document.createElement('button');
      button.type='button';
      button.className=`motion-list-item${animation.id===selectedManagedMotionId?' active':''}`;
      button.innerHTML='<strong></strong><span></span>';
      button.querySelector('strong').textContent=animation.name;
      button.querySelector('span').textContent=`${animation.frames.length}フレーム`;
      button.addEventListener('click',()=>{ selectedManagedMotionId=animation.id; renderMotionManager(); });
      motionManagerListEl.appendChild(button);
    });
  }
  const deleteButton=document.getElementById('deleteManagedMotionBtn');
  if(deleteButton) deleteButton.disabled=!selectedManagedMotionId;
  if(motionCopySourceSelectEl){
    motionCopySourceSelectEl.innerHTML='';
    project.animations.forEach(animation=>{
      const option=document.createElement('option'); option.value=animation.id; option.textContent=animation.name; motionCopySourceSelectEl.appendChild(option);
    });
  }
  const hasSource=project.animations.length>0;
  const copyOption=motionCreateModeEl?.querySelector('option[value="copy"]');
  if(copyOption) copyOption.disabled=!hasSource;
  if(!hasSource && motionCreateModeEl?.value==='copy') motionCreateModeEl.value='default';
  const copyMode=motionCreateModeEl?.value==='copy';
  motionCopySourceFieldEl?.classList.toggle('is-hidden',!copyMode);
  if(motionCopySourceSelectEl) motionCopySourceSelectEl.disabled=!copyMode;
}

function openMotionManager(){
  selectedManagedMotionId=currentAnimationId || project.animations[0]?.id || null;
  renderMotionManager();
  if(!motionManagerDialogEl?.open && typeof motionManagerDialogEl?.showModal==='function') motionManagerDialogEl.showModal();
}

function createManagedMotion(){
  const name=String(document.getElementById('newMotionNameInput')?.value || '').trim();
  if(!name){ alert('モーション名を入力してください。'); return; }
  if(project.animations.some(animation=>animation.name===name)){ alert('同じモーション名が既にあります。'); return; }
  let created=null;
  if(motionCreateModeEl?.value==='copy'){
    const source=project.animations.find(animation=>animation.id===motionCopySourceSelectEl?.value);
    if(!source){ alert('複製元モーションを選択してください。'); return; }
    created=cloneAnimationAsNew(source,name);
  }else{
    created=createAnimationFromDefault(name);
  }
  if(created){
    document.getElementById('newMotionNameInput').value='';
    motionManagerDialogEl?.close();
  }
}

function renderCopyFrameTargets(){
  if(!copyFrameTargetSelectEl) return;
  const targets=project.animations.filter(animation=>animation.id!==currentAnimationId);
  copyFrameTargetSelectEl.innerHTML='';
  targets.forEach(animation=>{
    const option=document.createElement('option'); option.value=animation.id; option.textContent=`${animation.name}（${animation.frames.length}フレーム）`; copyFrameTargetSelectEl.appendChild(option);
  });
  const applyButton=document.getElementById('copyFrameApplyBtn');
  if(applyButton) applyButton.disabled=!targets.length;
}

function openCopyFrameDialog(){
  renderCopyFrameTargets();
  if(!copyFrameTargetSelectEl?.options.length){ alert('複製先にできる他のモーションがありません。'); return; }
  if(!copyFrameDialogEl?.open && typeof copyFrameDialogEl?.showModal==='function') copyFrameDialogEl.showModal();
}

function copyCurrentFrameToMotion(){
  const target=project.animations.find(animation=>animation.id===copyFrameTargetSelectEl?.value);
  if(!target) return;
  pushHistory();
  target.frames.push(clone(currentFrameData()));
  copyFrameDialogEl?.close();
  render();
}

function normalizeStandardSideToeBones(){
  if(project.meta?.rigType!=='standard_2d' || project.meta?.poseType!=='side') return;
  const frames=[project.defaultFrame,...(project.animations || []).flatMap(animation=>animation.frames || [])];
  if(project.meta.referencePose && !frames.includes(project.meta.referencePose)) frames.push(project.meta.referencePose);
  for(const key of ['toeR','toeL']){
    const id=(project.layerOrder || []).find(layerId=>project.layers?.[layerId]?.key===key);
    const layer=project.layers?.[id];
    // 初回追加時だけ使っていた足形状を、W=太さ/H=長さの通常ボーンへ移行する。
    if(!layer || layer.shape!=='foot') continue;
    Object.assign(layer,{shape:'bar',ox:.5,oy:.08,headX:.5,headY:.08,tailX:.5,tailY:1,shapeFlipX:false});
    frames.forEach(frame=>{
      const pose=frame?.[id];
      if(!pose) return;
      const oldWidth=Math.max(1,Number(pose.w)||1);
      const oldHeight=Math.max(1,Number(pose.h)||1);
      pose.w=oldHeight;
      pose.h=oldWidth;
      pose.r=(Number(pose.r)||0)-90;
    });
  }
}

function ensureProjectSettings(){
  if(!project.meta) project.meta = {name:'motion', fps:8, editMode:'rotate'};
  if(!project.imageSources) project.imageSources = {};
  const legacyBackground=project.background && typeof project.background==='object' ? project.background : null;
  if(!Array.isArray(project.backgrounds)) project.backgrounds=legacyBackground ? [{...legacyBackground,id:legacyBackground.id || backgroundUid(),name:legacyBackground.name || '背景 1'}] : [];
  if(!project.backgrounds.length) project.backgrounds=[{id:backgroundUid(),name:'背景 1',sourceId:null,x:0,y:0,scale:1,opacity:1,layerNo:1,flipX:false,flipY:false}];
  delete project.background;
  const usedBackgroundIds=new Set();
  project.backgrounds=project.backgrounds.map((entry,index)=>{
    const background=entry && typeof entry==='object' ? entry : {};
    let id=String(background.id || backgroundUid());
    while(usedBackgroundIds.has(id)) id=backgroundUid();
    usedBackgroundIds.add(id);
    background.id=id;
    background.name=String(background.name || `背景 ${index+1}`);
    if(background.sourceId && !project.imageSources[background.sourceId]) background.sourceId=null;
    if(background.sourceId===undefined) background.sourceId=null;
    if(!Number.isFinite(Number(background.x))) background.x=0;
    if(!Number.isFinite(Number(background.y))) background.y=0;
    background.scale=Math.max(.1,Math.min(4,Number(background.scale)||1));
    if(!Number.isFinite(Number(background.opacity))) background.opacity=1;
    background.opacity=Math.max(0,Math.min(1,Number(background.opacity)));
    if(!Number.isFinite(Number(background.layerNo))) background.layerNo=index+1;
    background.layerNo=Math.max(1,Math.min((project.layerOrder?.length || 0)+project.backgrounds.length,Math.round(Number(background.layerNo)||1)));
    background.flipX=!!background.flipX;
    background.flipY=!!background.flipY;
    return background;
  });
  if(project.baseImageSourceId === undefined || (project.baseImageSourceId && !project.imageSources[project.baseImageSourceId])) project.baseImageSourceId = null;
  if(!project.meshBindings || typeof project.meshBindings !== 'object') project.meshBindings = {};
  // 旧「全親子を自動接続」設定を一度だけ解除する。以後は連続メッシュの明示ONだけ使用する。
  if(project.meta.meshAttachmentVersion !== 1){
    Object.values(project.layers || {}).forEach(layer=>{ layer.attached=false; });
    project.meta.meshAttachmentVersion=1;
  }
  ensureImageSlots();
  if(!project.meta.rigType) project.meta.rigType = 'standard_2d';
  if(!project.meta.poseType || project.meta.poseType==='natural') project.meta.poseType = project.meta.rigType==='pixel_simple'?'front':'side';
  if(!project.partGroups || typeof project.partGroups !== 'object') project.partGroups = createDefaultPartGroups(project.layers || {},project.layerOrder || []);
  const legacyFrames=Array.isArray(project.frames)?project.frames:null;
  const legacyPoses=Array.isArray(project.poseEntries)?project.poseEntries:null;
  if(!project.defaultFrame || typeof project.defaultFrame!=='object') project.defaultFrame=clone(legacyFrames?.[0] || {});
  if(!Array.isArray(project.animations)){
    project.animations=[];
    if(legacyFrames?.length>1){
      project.animations.push({
        id:animationUid(),name:'既存モーション',fps:Math.max(1,Number(project.meta.fps)||8),loop:true,
        frames:legacyFrames.map(frame=>clone(frame))
      });
    }
  }
  if(!project.meta.referencePose || typeof project.meta.referencePose !== 'object') project.meta.referencePose = clone(project.defaultFrame);
  if(!project.meta.referencePoseName) project.meta.referencePoseName = '初期フレーム';
  project.animations=project.animations.map((animation,index)=>({
    id:animation.id || animationUid(),name:String(animation.name || `アニメーション${index+1}`),
    fps:Math.max(1,Math.min(60,Number(animation.fps)||Number(project.meta.fps)||8)),loop:animation.loop!==false,
    frames:Array.isArray(animation.frames)&&animation.frames.length?animation.frames:[clone(project.defaultFrame)]
  }));
  normalizeStandardSideToeBones();
  normalizeSharedLayerOrder();
  delete project.defaultLayerGroups;
  project.animations.forEach(animation=>delete animation.layerGroups);
  delete project.frames;
  delete project.poseEntries;
  if(!Number.isFinite(Number(project.meta.imageDisplayScale))) project.meta.imageDisplayScale = 1;
  project.meta.imageDisplayScale = Math.max(.5,Math.min(2.5,Number(project.meta.imageDisplayScale) || 1));
  project.meta.boneDisplaySizeMode = !!project.meta.boneDisplaySizeMode;
  if(!project.meta.display) project.meta.display = {};
  const d = project.meta.display;
  if(d.labels === undefined) d.labels = true;
  if(d.anchors === undefined) d.anchors = true;
  if(d.lines === undefined) d.lines = true;
  if(d.visuals === undefined) d.visuals = true;
  if(d.bones === undefined) d.bones = d.visuals;
  if(d.images === undefined) d.images = d.visuals;
  if(d.grid === undefined) d.grid = true;
  if(d.groundVisible === undefined) d.groundVisible = true;
  if(d.centerGuides === undefined) d.centerGuides = true;
  if(d.onionSkin === undefined) d.onionSkin = false;
  if(d.boneColors === undefined) d.boneColors = true;
  const boneColorIntensity=Number(d.boneColorIntensity);
  d.boneColorIntensity=Number.isFinite(boneColorIntensity) ? Math.max(0,Math.min(100,boneColorIntensity)) : 100;
  if(d.internalIds === undefined) d.internalIds = false;
  if(project.layers){
    const usedNames = new Set();
    for(const id of project.layerOrder || Object.keys(project.layers)){
      const layer = project.layers[id];
      if(!layer) continue;
      ensureLayerColor(layer);
      ensureBoneEndpoints(layer);
      ensureImageAdjustments(layer);
      ensureImageCrop(layer);
      ensureLayerImageSource(layer);
      if(!layer.morphs || typeof layer.morphs!=='object') layer.morphs={};
      if(layer.positionLocked!==true) delete layer.positionLocked;
      if(Number.isFinite(Number(layer.editorBoneDisplayW))) layer.editorBoneDisplayW=Math.max(8,Math.min(2000,Number(layer.editorBoneDisplayW)));
      else delete layer.editorBoneDisplayW;
      if(Number.isFinite(Number(layer.editorBoneDisplayH))) layer.editorBoneDisplayH=Math.max(8,Math.min(2000,Number(layer.editorBoneDisplayH)));
      else delete layer.editorBoneDisplayH;
      layer.editorBoneDisplayOffsetX=Number.isFinite(Number(layer.editorBoneDisplayOffsetX)) ? Number(layer.editorBoneDisplayOffsetX) : 0;
      layer.editorBoneDisplayOffsetY=Number.isFinite(Number(layer.editorBoneDisplayOffsetY)) ? Number(layer.editorBoneDisplayOffsetY) : 0;
      if(Number.isFinite(Number(layer.editorBoneScale))) layer.editorBoneScale=Math.max(.15,Math.min(2.5,Number(layer.editorBoneScale)));
      else delete layer.editorBoneScale;
      if(layer.attached === undefined) layer.attached = false;
      const base = cleanBoneName(layer.name) || 'ボーン';
      let fixed = base;
      let n = 2;
      while(usedNames.has(fixed)) fixed = `${base}${n++}`;
      layer.name = fixed;
      usedNames.add(fixed);
    }
    if(project.meta.rigType==='standard_2d' && project.meta.poseType==='front'){
      const footR=project.layers[getLayerIdByKey('footR')];
      const footL=project.layers[getLayerIdByKey('footL')];
      if(footR && footR.shapeFlipX === undefined){
        Object.assign(footR,{shapeFlipX:true,ox:.82,tailX:.08,tailY:.55});
        if(footL) Object.assign(footL,{shapeFlipX:false,ox:.18,tailX:.92,tailY:.55});
      }
    }
  }
  if(!project.meta.ground) project.meta.ground = {};
  const g = project.meta.ground;
  if(g.enabled === undefined) g.enabled = true;
  if(g.y === undefined) g.y = 880;
  if(g.autoFoot === undefined) g.autoFoot = true;
  if(g.airAngle === undefined) g.airAngle = 60;
  Object.values(project.meshBindings || {}).forEach(binding=>{
    ensureMeshBinding(binding);
    syncMeshBindingResizeBoxWidth(binding);
    syncMeshBindingEditorResizeBoxWidth(binding);
  });
}

function currentAnimation(){ return project.animations.find(animation=>animation.id===currentAnimationId) || null; }
function activeFrames(){ return currentAnimation()?.frames || [project.defaultFrame]; }
function allProjectFrames(){ return [project.defaultFrame,...project.animations.flatMap(animation=>animation.frames)]; }

function sharedLayerOrder(){
  const known=new Set(Object.keys(project.layers || {}));
  const ordered=(project.layerOrder || []).filter(id=>known.delete(id));
  return [...ordered,...known];
}

function syncSharedLayerOrderToFrames(){
  const order=sharedLayerOrder();
  project.layerOrder=order;
  let changed=false;
  for(const frame of allProjectFrames()){
    order.forEach((id,index)=>{
      if(!frame?.[id]) return;
      const layerNo=index+1;
      if(Number(frame[id].z)!==layerNo){ frame[id].z=layerNo; changed=true; }
    });
  }
  return changed;
}

function normalizeSharedLayerOrder(){
  if(!project?.meta || !project?.layers) return false;
  const previousOrder=Array.isArray(project.layerOrder) ? [...project.layerOrder] : [];
  const baseIndex=new Map((project.layerOrder || []).map((id,index)=>[id,index]));
  if(project.meta.sharedLayerOrderVersion!==1){
    const defaultFrame=project.defaultFrame || {};
    project.layerOrder=sharedLayerOrder().sort((first,second)=>{
      const firstZ=Number(defaultFrame[first]?.z);
      const secondZ=Number(defaultFrame[second]?.z);
      if(Number.isFinite(firstZ) && Number.isFinite(secondZ) && firstZ!==secondZ) return firstZ-secondZ;
      return (baseIndex.get(first) ?? 0)-(baseIndex.get(second) ?? 0);
    });
    project.meta.sharedLayerOrderVersion=1;
    return syncSharedLayerOrderToFrames();
  }
  const canonicalOrder=sharedLayerOrder();
  project.layerOrder=canonicalOrder;
  const orderChanged=previousOrder.length!==canonicalOrder.length || previousOrder.some((id,index)=>id!==canonicalOrder[index]);
  return orderChanged ? syncSharedLayerOrderToFrames() : false;
}

function sharedLayerNoForBone(id){
  const index=project.layerOrder.indexOf(id);
  return index>=0 ? index+1 : 1;
}

function effectiveBoneImageFlip(id,pose,axis,binding=findMeshBindingForBone(id)){
  const poseProperty=axis==='x'?'imageFlipX':'imageFlipY';
  if(typeof pose?.[poseProperty]==='boolean') return pose[poseProperty];
  if(binding){
    if(axis==='x') return !!binding.flipX !== !!binding.boneFlipX?.[id];
    return !!binding.flipY;
  }
  return !!project.layers?.[id]?.[poseProperty];
}

function isLayerActiveForCurrentAnimation(layerId){
  return !!project.layers[layerId];
}
function getRootId(){ return project.layerOrder.find(id => !project.layers[id]?.parent) || project.layerOrder[0]; }
function getLayerIdByKey(key){ return project.layerOrder.find(id => project.layers[id]?.key === key) || null; }
function isFootLayer(layer){ return layer?.key === 'footR' || layer?.key === 'footL'; }
function isWaistLayer(layer){ return layer?.key === 'waist' || layer?.name === '腰'; }
function getFootContactLocal(layer, pose){
  const toeX=layer.shapeFlipX ? .04 : .96;
  const heelX=layer.shapeFlipX ? .96 : .04;
  return {
    toe:{x:(toeX-layer.ox) * pose.w, y:(0.72-layer.oy) * pose.h},
    heel:{x:(heelX-layer.ox) * pose.w, y:(0.72-layer.oy) * pose.h}
  };
}
function solveAutoFootRotation(layer, pose, anchorY){
  ensureProjectSettings();
  const groundY = Number(project.meta.ground.y) || 880;
  const airAngle = Math.max(0, Number(project.meta.ground.airAngle) || 60);
  const heelSnap = 16;
  const contact = getFootContactLocal(layer, pose);
  const toeYAt = deg => anchorY + rotate(contact.toe.x, contact.toe.y, deg).y;
  const heelYAt = deg => anchorY + rotate(contact.heel.x, contact.heel.y, deg).y;
  const flatToeY = toeYAt(0);
  const flatHeelY = heelYAt(0);
  const flatBottom = Math.max(flatToeY, flatHeelY);

  // 地面に十分近づいたら、つま先接地のまま止めずにフラットへ戻して、かかとも接地させる。
  if(flatBottom >= groundY - heelSnap) return 0;

  const airToeY = toeYAt(airAngle);
  if(airToeY <= groundY) return airAngle;

  // 空中 → 接地の間は、まずつま先から接地する。
  let lo = 0, hi = airAngle;
  for(let i=0;i<24;i++){
    const mid = (lo + hi) / 2;
    if(toeYAt(mid) < groundY) lo = mid; else hi = mid;
  }
  return hi;
}
function stateCorners(state){
  const {layer,pose,anchorX,anchorY,rotation} = state;
  const pts = [[0,0],[pose.w,0],[0,pose.h],[pose.w,pose.h]];
  return pts.map(([x,y])=>{
    const rel = rotate(x-layer.ox*pose.w, y-layer.oy*pose.h, rotation);
    return {x:anchorX+rel.x,y:anchorY+rel.y};
  });
}
function getFootBottoms(frame){
  const world = getWorldState(frame);
  return ['footR','footL'].map(key=>{
    const id = getLayerIdByKey(key); if(!id || !world[id]) return null;
    const bottom = Math.max(...stateCorners(world[id]).map(p=>p.y));
    return {id,key,bottom};
  }).filter(Boolean);
}
function maxGroundPenetration(frame){
  ensureProjectSettings();
  if(!project.meta.ground.enabled) return 0;
  const gy = Number(project.meta.ground.y) || 880;
  return Math.max(0, ...getFootBottoms(frame).map(f=>f.bottom-gy));
}

const meshImageCache = new Map();
const meshTransformCache = new Map();
const meshCanvasElements = {};

function meshBindingUid(){ return 'mesh_' + Math.random().toString(36).slice(2,10); }

function defaultMeshControlPoints(chainLength){
  const count = Math.max(2, chainLength + 1);
  return Array.from({length:count}, (_, index) => ({
    u:0.5,
    v:0.06 + (index / (count - 1)) * 0.88,
    t:index / (count - 1),
    leftWidth:0.44,
    rightWidth:0.44,
    width:0.88
  }));
}

function isNeckToHeadMeshChain(chain){
  const keys=(chain || []).map(id=>project.layers[id]?.key);
  return keys[0]==='neck' && keys.at(-1)==='head';
}

function isNeckTerminalMeshChain(chain){
  const keys=(chain || []).map(id=>project.layers[id]?.key);
  return keys.at(-1)==='neck';
}

function defaultMeshControlPointsForChain(chain){
  const points = defaultMeshControlPoints(chain.length);
  if(inferredPartSlot(chain) === 'torso' || isNeckToHeadMeshChain(chain) || isNeckTerminalMeshChain(chain)){
    points.forEach(point => { point.v = 0.94 - point.t * 0.88; });
  }
  return points;
}

function ensureMeshBinding(binding){
  if(!binding) return;
  delete binding.uniformTargetWidth;
  if(!Array.isArray(binding.boneChain)) binding.boneChain = [];
  if(!Array.isArray(binding.controlPoints) || binding.controlPoints.length < 2){
    binding.controlPoints = defaultMeshControlPointsForChain(binding.boneChain);
  }
  binding.controlPoints.forEach((point,index,points) => {
    point.u = Math.max(0, Math.min(1, Number(point.u) || 0.5));
    point.v = Math.max(0, Math.min(1, Number(point.v) || 0));
    point.t = Math.max(0, Math.min(1, Number.isFinite(Number(point.t)) ? Number(point.t) : index / Math.max(1,points.length-1)));
    point.name = String(point.name || '').trim().slice(0,24);
    const legacyHalf=Math.max(0.02,Math.min(0.75,(Number(point.width)||0.88)/2));
    point.leftWidth = Math.max(0.01, Math.min(1, Number(point.leftWidth) || legacyHalf));
    point.rightWidth = Math.max(0.01, Math.min(1, Number(point.rightWidth) || legacyHalf));
    point.width = point.leftWidth + point.rightWidth;
  });
  binding.controlPoints.sort((left,right)=>left.t-right.t);
  binding.controlPoints[0].t=0;
  binding.controlPoints.at(-1).t=1;
  if(isNeckToHeadMeshChain(binding.boneChain) && binding.sourceDirectionVersion!==2){
    if(binding.controlPoints[0].v < binding.controlPoints.at(-1).v){
      binding.controlPoints.forEach(point=>{ point.v=1-point.v; });
      // 旧データで上下反転を使って向きを補正していた場合も、移行後の見た目を維持する。
      if(binding.flipY) binding.flipY=false;
    }
    binding.sourceDirectionVersion=2;
  }
  if(isNeckTerminalMeshChain(binding.boneChain) && binding.sourceDirectionVersion!==3){
    if(binding.controlPoints[0].v < binding.controlPoints.at(-1).v){
      binding.controlPoints.forEach(point=>{ point.v=1-point.v; });
      if(binding.flipY) binding.flipY=false;
    }
    binding.sourceDirectionVersion=3;
  }
  binding.segmentsPerBone = Math.max(1, Math.min(16, Number(binding.segmentsPerBone) || 6));
  binding.targetWidthScale = Math.max(0.1, Math.min(3, Number(binding.targetWidthScale) || 1));
  binding.targetScaleX = Math.max(0.1, Math.min(5, Number(binding.targetScaleX) || 1));
  binding.targetScaleY = Math.max(0.1, Math.min(5, Number(binding.targetScaleY) || 1));
  binding.targetOffsetX = Number(binding.targetOffsetX) || 0;
  binding.targetOffsetY = Number(binding.targetOffsetY) || 0;
  binding.resizeBoxWidth = inferMeshBindingResizeBoxWidth(binding);
  binding.editorResizeBoxWidth = inferMeshBindingEditorResizeBoxWidth(binding);
  binding.rotation = Math.max(-180,Math.min(180,Number(binding.rotation)||0));
  binding.flipX = !!binding.flipX;
  binding.flipY = !!binding.flipY;
  binding.rectangularSource = !!binding.rectangularSource;
  binding.boneFlipX = Object.fromEntries(binding.boneChain.filter(id=>binding.boneFlipX?.[id]).map(id=>[id,true]));
  const crossSectionCount=binding.boneChain.length+1;
  if(!Array.isArray(binding.targetCrossSections)) binding.targetCrossSections=[];
  binding.targetCrossSections=Array.from({length:crossSectionCount},(_,index)=>{
    const section=binding.targetCrossSections[index] || {};
    return {
      leftScale:Math.max(.05,Math.min(8,Number(section.leftScale)||1)),
      rightScale:Math.max(.05,Math.min(8,Number(section.rightScale)||1))
    };
  });
  binding.sourceRect = normalizeMeshSourceRect(binding.sourceRect);
  if(!binding.partSlot) binding.partSlot = 'custom';
  if(binding.enabled === undefined) binding.enabled = true;
}

function meshBindingFrames(){
  const frames=[project.defaultFrame,...(project.animations || []).flatMap(animation=>animation.frames || [])].filter(Boolean);
  if(project.meta?.referencePose && !frames.includes(project.meta.referencePose)) frames.push(project.meta.referencePose);
  return frames;
}

function inferMeshBindingResizeBoxWidth(binding){
  const stored=Number(binding?.resizeBoxWidth);
  if(Number.isFinite(stored)) return Math.max(12,Math.min(2000,stored));
  const widths=[];
  for(const boneId of binding?.boneChain || []){
    const pose=meshBindingFrames().map(frame=>frame?.[boneId]).find(Boolean);
    if(Number.isFinite(Number(pose?.w))) widths.push(Number(pose.w));
  }
  return Math.max(12,Math.min(2000,widths.length ? Math.max(...widths) : 80));
}

function syncMeshBindingResizeBoxWidth(binding,width=binding?.resizeBoxWidth,{fixedCorner=null}={}){
  if(!binding?.boneChain?.length) return;
  const sharedWidth=Math.max(12,Math.min(2000,Number(width)||inferMeshBindingResizeBoxWidth(binding)));
  const frames=meshBindingFrames();
  const fixedPoints=new Map();
  if(fixedCorner){
    frames.forEach(frame=>{
      const world=getWorldState(frame);
      const points=new Map();
      binding.boneChain.forEach(boneId=>{
        const state=world[boneId];
        if(state) points.set(boneId,boneRectCornerWorld(state,state.pose.w,state.pose.h,fixedCorner));
      });
      fixedPoints.set(frame,points);
    });
  }
  binding.resizeBoxWidth=sharedWidth;
  frames.forEach(frame=>{
    binding.boneChain.forEach(boneId=>{
      if(frame?.[boneId]) frame[boneId].w=sharedWidth;
    });
  });
  if(fixedCorner){
    frames.forEach(frame=>{
      const points=fixedPoints.get(frame);
      // 親から子の順に補正し、親の移動で子の固定辺がずれる分も戻す。
      binding.boneChain.forEach(boneId=>{
        const fixed=points?.get(boneId);
        const state=getWorldState(frame)[boneId];
        if(!fixed || !state) return;
        const current=boneRectCornerWorld(state,state.pose.w,state.pose.h,fixedCorner);
        movePoseAnchorByWorldDelta(frame,boneId,fixed.x-current.x,fixed.y-current.y);
      });
    });
  }
}

function setMeshBindingResizeBoxWidthForBone(boneId,width,options){
  const binding=findMeshBindingForBone(boneId);
  if(!binding) return false;
  syncMeshBindingResizeBoxWidth(binding,width,options);
  return true;
}

function inferMeshBindingEditorResizeBoxWidth(binding){
  const stored=Number(binding?.editorResizeBoxWidth);
  if(Number.isFinite(stored)) return Math.max(8,Math.min(2000,stored));
  const widths=[];
  for(const boneId of binding?.boneChain || []){
    const layer=project.layers?.[boneId];
    if(Number.isFinite(Number(layer?.editorBoneDisplayW))){
      widths.push(Number(layer.editorBoneDisplayW));
      continue;
    }
    const pose=project.defaultFrame?.[boneId] || project.meta?.referencePose?.[boneId]
      || (project.animations || []).flatMap(animation=>animation.frames || []).map(frame=>frame?.[boneId]).find(Boolean);
    if(Number.isFinite(Number(pose?.w))) widths.push(Number(pose.w));
  }
  return Math.max(8,Math.min(2000,widths.length ? Math.max(...widths) : 80));
}

function syncMeshBindingEditorResizeBoxWidth(binding,width=binding?.editorResizeBoxWidth){
  if(!binding?.boneChain?.length) return;
  const sharedWidth=Math.max(8,Math.min(2000,Number(width)||inferMeshBindingEditorResizeBoxWidth(binding)));
  binding.editorResizeBoxWidth=sharedWidth;
  binding.boneChain.forEach(boneId=>{
    const layer=project.layers?.[boneId];
    if(layer){
      layer.editorBoneDisplayW=sharedWidth;
      delete layer.editorBoneScale;
    }
  });
}

function setMeshBindingEditorResizeBoxWidthForBone(boneId,width){
  const binding=findMeshBindingForBone(boneId);
  if(!binding) return false;
  syncMeshBindingEditorResizeBoxWidth(binding,width);
  return true;
}

function normalizeMeshSourceRect(rect){
  const source=rect && typeof rect==='object' ? rect : {};
  const x=Math.max(0,Math.min(.97,Number(source.x)||0));
  const y=Math.max(0,Math.min(.97,Number(source.y)||0));
  const w=Math.max(.03,Math.min(1-x,Number(source.w)||1));
  const h=Math.max(.03,Math.min(1-y,Number(source.h)||1));
  return {x,y,w,h};
}

function localPointToWorld(state, localX, localY){
  const rel = rotate(localX - state.layer.ox * state.pose.w, localY - state.layer.oy * state.pose.h, state.rotation);
  return {x:state.anchorX + rel.x, y:state.anchorY + rel.y};
}

function getMeshTargetPoints(binding, world, {applyCrossSections=true}={}){
  const states = binding.boneChain.map(id => world[id]).filter(Boolean);
  if(states.length !== binding.boneChain.length || !states.length) return [];
  const points = states.map((state,index) => {
    const previousWidth=index>0 ? states[index-1].pose.w : state.pose.w;
    ensureBoneEndpoints(state.layer);
    const head = localPointToWorld(state, state.layer.headX * state.pose.w, state.layer.headY * state.pose.h);
    return {x:head.x, y:head.y, width:(previousWidth+state.pose.w)*.5*binding.targetWidthScale};
  });
  const last = states.at(-1);
  const terminalIsNeck=last.layer.key==='neck';
  const tail = localPointToWorld(
    last,
    (terminalIsNeck ? (last.layer.headX ?? last.layer.ox ?? 0.5) : (last.layer.tailX ?? 0.5)) * last.pose.w,
    (terminalIsNeck ? 0 : (last.layer.tailY ?? 1)) * last.pose.h
  );
  points.push({x:tail.x, y:tail.y, width:last.pose.w*binding.targetWidthScale});
  const origin=points[0];
  const scaleX=Math.max(.1,Number(binding.targetScaleX)||1),scaleY=Math.max(.1,Number(binding.targetScaleY)||1);
  const offsetX=Number(binding.targetOffsetX)||0,offsetY=Number(binding.targetOffsetY)||0;
  return points.map((point,index)=>{
    const width=point.width*scaleX;
    const section=applyCrossSections ? binding.targetCrossSections?.[index] : null;
    return {
      ...point,
      x:origin.x+(point.x-origin.x)*scaleX+offsetX,
      y:origin.y+(point.y-origin.y)*scaleY+offsetY,
      width,
      leftWidth:width*.5*(Number(section?.leftScale)||1),
      rightWidth:width*.5*(Number(section?.rightScale)||1)
    };
  });
}

function meshTargetNormal(points,index){
  const previous=points[Math.max(0,index-1)],next=points[Math.min(points.length-1,index+1)];
  const dx=next.x-previous.x,dy=next.y-previous.y,length=Math.hypot(dx,dy)||1;
  return {x:-dy/length,y:dx/length};
}

function meshBoneTargetQuad(binding,world,boneId){
  const boneIndex=binding?.boneChain?.indexOf(boneId) ?? -1;
  if(boneIndex<0) return null;
  const controls=getMeshTargetPoints(binding,world);
  if(controls.length!==binding.boneChain.length+1) return null;
  const edges=stripEdges(controls),head=edges[boneIndex],tail=edges[boneIndex+1];
  if(!head || !tail) return null;
  return {tl:head.left,tr:head.right,bl:tail.left,br:tail.right,boneIndex};
}

function getMeshTargetBounds(binding,world){
  if(!binding) return null;
  ensureMeshBinding(binding);
  const controls=getMeshTargetPoints(binding,world);
  if(controls.length<2) return null;
  const edges=stripEdges(sampleMeshPath(controls,binding.segmentsPerBone));
  const points=edges.flatMap(edge=>[edge.left,edge.right]);
  if(!points.length) return null;
  const left=Math.min(...points.map(point=>point.x)),right=Math.max(...points.map(point=>point.x));
  const top=Math.min(...points.map(point=>point.y)),bottom=Math.max(...points.map(point=>point.y));
  return {left,top,right,bottom,width:Math.max(1,right-left),height:Math.max(1,bottom-top)};
}

function catmullValue(a,b,c,d,t){
  const t2=t*t, t3=t2*t;
  return 0.5 * ((2*b) + (-a+c)*t + (2*a-5*b+4*c-d)*t2 + (-a+3*b-3*c+d)*t3);
}

function sampleMeshPath(points, segmentsPerBone){
  if(points.length < 2) return points;
  const sampled = [];
  for(let index=0; index<points.length-1; index++){
    const p0=points[Math.max(0,index-1)], p1=points[index], p2=points[index+1], p3=points[Math.min(points.length-1,index+2)];
    for(let step=0; step<segmentsPerBone; step++){
      const t=step/segmentsPerBone;
      sampled.push({
        x:catmullValue(p0.x,p1.x,p2.x,p3.x,t),
        y:catmullValue(p0.y,p1.y,p2.y,p3.y,t),
        width:Math.max(1,catmullValue(p0.width,p1.width,p2.width,p3.width,t)),
        leftWidth:Math.max(1,catmullValue(p0.leftWidth ?? p0.width/2,p1.leftWidth ?? p1.width/2,p2.leftWidth ?? p2.width/2,p3.leftWidth ?? p3.width/2,t)),
        rightWidth:Math.max(1,catmullValue(p0.rightWidth ?? p0.width/2,p1.rightWidth ?? p1.width/2,p2.rightWidth ?? p2.width/2,p3.rightWidth ?? p3.width/2,t))
      });
    }
  }
  sampled.push({...points.at(-1)});
  return sampled;
}

function sampleLinearMeshPath(points, segmentsPerBone){
  if(points.length < 2) return points;
  const sampled=[];
  const mix=(a,b,t)=>a+(b-a)*t;
  for(let index=0;index<points.length-1;index++){
    const left=points[index],right=points[index+1];
    for(let step=0;step<segmentsPerBone;step++){
      const t=step/segmentsPerBone;
      sampled.push({
        x:mix(left.x,right.x,t),y:mix(left.y,right.y,t),
        width:Math.max(1,mix(left.width,right.width,t)),
        leftWidth:Math.max(1,mix(left.leftWidth ?? left.width/2,right.leftWidth ?? right.width/2,t)),
        rightWidth:Math.max(1,mix(left.rightWidth ?? left.width/2,right.rightWidth ?? right.width/2,t))
      });
    }
  }
  sampled.push({...points.at(-1)});
  return sampled;
}

function stripEdges(points){
  return points.map((point,index) => {
    const previous=points[Math.max(0,index-1)], next=points[Math.min(points.length-1,index+1)];
    const dx=next.x-previous.x, dy=next.y-previous.y;
    const length=Math.hypot(dx,dy) || 1;
    const nx=-dy/length, ny=dx/length;
    const leftWidth=point.leftWidth ?? point.width/2;
    const rightWidth=point.rightWidth ?? point.width/2;
    return {
      left:{x:point.x+nx*leftWidth,y:point.y+ny*leftWidth},
      right:{x:point.x-nx*rightWidth,y:point.y-ny*rightWidth}
    };
  });
}

function pointAtNormalizedPath(path,t){
  if(path.length<2) return path[0] ? {...path[0]} : null;
  const position=Math.max(0,Math.min(1,t))*(path.length-1);
  const index=Math.min(path.length-2,Math.floor(position));
  const ratio=position-index, left=path[index], right=path[index+1];
  const mix=(a,b)=>a+(b-a)*ratio;
  return {
    x:mix(left.x,right.x),
    y:mix(left.y,right.y),
    width:mix(left.width,right.width),
    leftWidth:mix(left.leftWidth ?? left.width/2,right.leftWidth ?? right.width/2),
    rightWidth:mix(left.rightWidth ?? left.width/2,right.rightWidth ?? right.width/2)
  };
}

function transformedMeshImage(image,binding){
  const key=`${binding.sourceId}|${binding.rotation}|${image.naturalWidth}x${image.naturalHeight}`;
  const cached=meshTransformCache.get(key);
  if(cached) return cached;
  const radians=binding.rotation*Math.PI/180;
  const cos=Math.abs(Math.cos(radians)),sin=Math.abs(Math.sin(radians));
  const width=Math.max(1,Math.ceil(image.naturalWidth*cos+image.naturalHeight*sin));
  const height=Math.max(1,Math.ceil(image.naturalWidth*sin+image.naturalHeight*cos));
  const canvas=document.createElement('canvas'); canvas.width=width; canvas.height=height;
  const context=canvas.getContext('2d');
  context.translate(width/2,height/2);
  context.rotate(radians);
  context.drawImage(image,-image.naturalWidth/2,-image.naturalHeight/2);
  meshTransformCache.set(key,canvas);
  return canvas;
}

function drawTexturedTriangle(context,image,source,destination){
  const [s0,s1,s2]=source, [d0,d1,d2]=destination;
  const denominator=s0.x*(s1.y-s2.y)+s1.x*(s2.y-s0.y)+s2.x*(s0.y-s1.y);
  if(Math.abs(denominator)<0.0001) return;
  const a=(d0.x*(s1.y-s2.y)+d1.x*(s2.y-s0.y)+d2.x*(s0.y-s1.y))/denominator;
  const b=(d0.y*(s1.y-s2.y)+d1.y*(s2.y-s0.y)+d2.y*(s0.y-s1.y))/denominator;
  const c=(d0.x*(s2.x-s1.x)+d1.x*(s0.x-s2.x)+d2.x*(s1.x-s0.x))/denominator;
  const d=(d0.y*(s2.x-s1.x)+d1.y*(s0.x-s2.x)+d2.y*(s1.x-s0.x))/denominator;
  const e=(d0.x*(s1.x*s2.y-s2.x*s1.y)+d1.x*(s2.x*s0.y-s0.x*s2.y)+d2.x*(s0.x*s1.y-s1.x*s0.y))/denominator;
  const f=(d0.y*(s1.x*s2.y-s2.x*s1.y)+d1.y*(s2.x*s0.y-s0.x*s2.y)+d2.y*(s0.x*s1.y-s1.x*s0.y))/denominator;
  context.save();
  context.beginPath();
  context.moveTo(d0.x,d0.y); context.lineTo(d1.x,d1.y); context.lineTo(d2.x,d2.y); context.closePath();
  context.clip();
  context.transform(a,b,c,d,e,f);
  context.drawImage(image,0,0);
  context.restore();
}

function isFullMeshSourceRect(rect){
  const normalized=normalizeMeshSourceRect(rect);
  return normalized.x<=.0001 && normalized.y<=.0001 && normalized.w>=.9999 && normalized.h>=.9999;
}

function meshRangeInfluence(point,rect,image){
  const normalized=normalizeMeshSourceRect(rect);
  const x=point.x/image.width,y=point.y/image.height;
  if(x<normalized.x || x>normalized.x+normalized.w || y<normalized.y || y>normalized.y+normalized.h) return 0;
  const featherX=Math.max(.004,Math.min(.025,normalized.w*.16));
  const featherY=Math.max(.004,Math.min(.025,normalized.h*.16));
  const edgeX=Math.min(x-normalized.x,normalized.x+normalized.w-x)/featherX;
  const edgeY=Math.min(y-normalized.y,normalized.y+normalized.h-y)/featherY;
  const value=Math.max(0,Math.min(1,Math.min(edgeX,edgeY)));
  return value*value*(3-2*value);
}

function mixMeshPoint(rigid,smooth,influence){
  return {x:rigid.x+(smooth.x-rigid.x)*influence,y:rigid.y+(smooth.y-rigid.y)*influence};
}

function pointAcrossStrip(edge,ratio){
  return {x:edge.left.x+(edge.right.x-edge.left.x)*ratio,y:edge.left.y+(edge.right.y-edge.left.y)*ratio};
}

function meshSegmentBoneIndex(binding,index){
  const sectionIndex=Math.min(binding.controlPoints.length-2,Math.floor(index/Math.max(1,binding.segmentsPerBone)));
  const sectionStart=binding.controlPoints[sectionIndex]?.t ?? 0;
  const sectionEnd=binding.controlPoints[sectionIndex+1]?.t ?? 1;
  return Math.min(binding.boneChain.length-1,Math.floor(((sectionStart+sectionEnd)/2)*binding.boneChain.length));
}

function meshBoneSegmentRange(binding,boneIndex,totalSegments){
  let start=totalSegments,end=0;
  for(let segment=0;segment<totalSegments;segment++){
    if(meshSegmentBoneIndex(binding,segment)!==boneIndex) continue;
    start=Math.min(start,segment);
    end=Math.max(end,segment+1);
  }
  return start<end ? {start,end} : {start:0,end:totalSegments};
}

function meshTextureSegmentEdges(sourceEdges,binding,index,frame=currentFrameData()){
  const lastIndex=sourceEdges.length-1;
  const boneIndex=meshSegmentBoneIndex(binding,index);
  const boneId=binding.boneChain[boneIndex];
  const pose=frame?.[boneId];
  const hasFrameFlipY=typeof pose?.imageFlipY==='boolean';
  let sourceIndex,nextSourceIndex;
  if(hasFrameFlipY){
    const range=meshBoneSegmentRange(binding,boneIndex,lastIndex);
    if(pose.imageFlipY){
      sourceIndex=range.end-(index-range.start);
      nextSourceIndex=sourceIndex-1;
    }else{
      sourceIndex=index;
      nextSourceIndex=index+1;
    }
  }else{
    sourceIndex=binding.flipY ? lastIndex-index : index;
    nextSourceIndex=binding.flipY ? sourceIndex-1 : sourceIndex+1;
  }
  sourceIndex=Math.max(0,Math.min(lastIndex,sourceIndex));
  nextSourceIndex=Math.max(0,Math.min(lastIndex,nextSourceIndex));
  const flipX=effectiveBoneImageFlip(boneId,pose,'x',binding);
  const orient=edge=>flipX ? {left:edge.right,right:edge.left} : edge;
  return [orient(sourceEdges[sourceIndex]),orient(sourceEdges[nextSourceIndex])];
}

function getMeshSourceEdges(binding,image){
  // 編集画面のSVGはu/vの正規化座標上で帯域を作る。描画側も同じ座標系で
  // 法線と左右幅を計算してから画像pxへ戻し、縦長画像の横向き部位が見切れないようにする。
  const unit=1000;
  const normalizedControls=binding.controlPoints.map(point=>({
    x:point.u*unit,
    y:point.v*unit,
    width:(point.leftWidth+point.rightWidth)*unit,
    leftWidth:point.leftWidth*unit,
    rightWidth:point.rightWidth*unit
  }));
  return stripEdges(sampleMeshPath(normalizedControls,binding.segmentsPerBone)).map(edge=>({
    left:{x:edge.left.x/unit*image.width,y:edge.left.y/unit*image.height},
    right:{x:edge.right.x/unit*image.width,y:edge.right.y/unit*image.height}
  }));
}

function drawLocalizedMesh(context,image,sourceEdges,binding,rigidEdges,smoothEdges,sourceRect,frame){
  const columns=8;
  for(let index=0;index<sourceEdges.length-1;index++){
    const [textureStart,textureEnd]=meshTextureSegmentEdges(sourceEdges,binding,index,frame);
    for(let column=0;column<columns;column++){
      const leftRatio=column/columns,rightRatio=(column+1)/columns;
      const g00=pointAcrossStrip(sourceEdges[index],leftRatio),g01=pointAcrossStrip(sourceEdges[index],rightRatio);
      const g10=pointAcrossStrip(sourceEdges[index+1],leftRatio),g11=pointAcrossStrip(sourceEdges[index+1],rightRatio);
      const s00=pointAcrossStrip(textureStart,leftRatio),s01=pointAcrossStrip(textureStart,rightRatio);
      const s10=pointAcrossStrip(textureEnd,leftRatio),s11=pointAcrossStrip(textureEnd,rightRatio);
      const r00=pointAcrossStrip(rigidEdges[index],leftRatio),r01=pointAcrossStrip(rigidEdges[index],rightRatio);
      const r10=pointAcrossStrip(rigidEdges[index+1],leftRatio),r11=pointAcrossStrip(rigidEdges[index+1],rightRatio);
      const m00=pointAcrossStrip(smoothEdges[index],leftRatio),m01=pointAcrossStrip(smoothEdges[index],rightRatio);
      const m10=pointAcrossStrip(smoothEdges[index+1],leftRatio),m11=pointAcrossStrip(smoothEdges[index+1],rightRatio);
      const d00=mixMeshPoint(r00,m00,meshRangeInfluence(g00,sourceRect,image));
      const d01=mixMeshPoint(r01,m01,meshRangeInfluence(g01,sourceRect,image));
      const d10=mixMeshPoint(r10,m10,meshRangeInfluence(g10,sourceRect,image));
      const d11=mixMeshPoint(r11,m11,meshRangeInfluence(g11,sourceRect,image));
      drawTexturedTriangle(context,image,[s00,s01,s11],[d00,d01,d11]);
      drawTexturedTriangle(context,image,[s00,s11,s10],[d00,d11,d10]);
    }
  }
}

function requestMeshImage(sourceId, data){
  const cached=meshImageCache.get(sourceId);
  if(cached?.data===data) return cached.image;
  const image=new Image();
  meshImageCache.set(sourceId,{data,image});
  image.onload=()=>render();
  image.src=data;
  return image;
}

function meshRenderLayerNo(binding){
  const layerNumbers=(binding?.boneChain || []).map(sharedLayerNoForBone);
  return layerNumbers.length ? Math.max(...layerNumbers) : 1;
}

function meshCanvasResolutionScale(image){
  if(!image?.naturalWidth || !image?.naturalHeight) return 1;
  return Math.max(1,Math.min(2,Math.max(image.naturalWidth,image.naturalHeight)/1000));
}

function meshCompositeLayerEntries(binding,frame){
  return (binding?.boneChain || []).map((boneId,index)=>{
    const layer=project.layers?.[boneId];
    const pose=frame?.[boneId];
    if(!layer || !pose) return null;
    const visualLayer=visualLayerForPose(layer,pose);
    const data=getLayerRenderImageData(visualLayer);
    if(!data) return null;
    return {boneId,index,layer,pose,visualLayer,data};
  }).filter(Boolean);
}

function drawMeshCompositeLayers(context,binding,world,frame){
  for(const entry of meshCompositeLayerEntries(binding,frame)){
    const state=world[entry.boneId];
    if(!state) continue;
    const variantId=String(entry.pose.morphId || 'base');
    const image=requestMeshImage(`composite:${binding.id}:${entry.boneId}:${variantId}`,entry.data);
    if(!image.complete || !image.naturalWidth) continue;
    drawOnionBoneImage(context,state,image,1,null);
  }
}

function drawMeshBinding(canvas,binding,world,image,frame=currentFrameData()){
  const resolutionScale=meshCanvasResolutionScale(image);
  const renderWidth=Math.round(1000*resolutionScale);
  const renderHeight=Math.round(1000*resolutionScale);
  if(canvas.width!==renderWidth || canvas.height!==renderHeight){
    canvas.width=renderWidth;
    canvas.height=renderHeight;
  }
  const context=canvas.getContext('2d');
  context.setTransform(1,0,0,1,0,0);
  context.clearRect(0,0,canvas.width,canvas.height);
  if(!image.complete || !image.naturalWidth) return;
  context.setTransform(resolutionScale,0,0,resolutionScale,0,0);
  context.imageSmoothingEnabled=true;
  context.imageSmoothingQuality='high';
  const transformedImage=transformedMeshImage(image,binding);
  const targetBoneControls=getMeshTargetPoints(binding,world);
  if(targetBoneControls.length < 2) return;
  const targetBonePath=sampleMeshPath(targetBoneControls,binding.segmentsPerBone);
  const rigidBonePath=sampleLinearMeshPath(targetBoneControls,binding.segmentsPerBone);
  const targetControls=binding.controlPoints.map(point=>pointAtNormalizedPath(targetBonePath,point.t));
  const rigidControls=binding.controlPoints.map(point=>pointAtNormalizedPath(rigidBonePath,point.t));
  const targetPath=sampleMeshPath(targetControls,binding.segmentsPerBone);
  const rigidPath=sampleLinearMeshPath(rigidControls,binding.segmentsPerBone);
  const sourceEdges=getMeshSourceEdges(binding,transformedImage), targetEdges=stripEdges(targetPath);
  if(!isFullMeshSourceRect(binding.sourceRect)){
    drawLocalizedMesh(context,transformedImage,sourceEdges,binding,stripEdges(rigidPath),targetEdges,binding.sourceRect,frame);
  }else{
    for(let index=0; index<sourceEdges.length-1; index++){
      const [s0,s1]=meshTextureSegmentEdges(sourceEdges,binding,index,frame),d0=targetEdges[index],d1=targetEdges[index+1];
      drawTexturedTriangle(context,transformedImage,[s0.left,s0.right,s1.right],[d0.left,d0.right,d1.right]);
      drawTexturedTriangle(context,transformedImage,[s0.left,s1.right,s1.left],[d0.left,d1.right,d1.left]);
    }
  }
  drawMeshCompositeLayers(context,binding,world,frame);
}

function drawMeshBindings(world){
  ensureProjectSettings();
  const activeIds=new Set();
  const displayScale=Math.max(.5,Math.min(2.5,Number(project.meta.imageDisplayScale)||1));
  const rootState=world[getRootId()];
  Object.values(project.meshBindings).forEach(binding=>{
    ensureMeshBinding(binding);
    const renderSourceId=activeImageSlotSourceId(binding.imageSourceSlot) || binding.sourceId;
    if(!binding.enabled || !renderSourceId || !binding.boneChain.every(isLayerActiveForCurrentAnimation)) return;
    const source=project.imageSources?.[renderSourceId];
    if(!source?.data) return;
    activeIds.add(binding.id);
    let canvas=meshCanvasElements[binding.id];
    if(!canvas){
      canvas=document.createElement('canvas');
      canvas.className='mesh-binding-canvas';
      canvas.dataset.bindingId=binding.id;
      canvas.width=1000; canvas.height=1000;
      meshCanvasElements[binding.id]=canvas;
      characterEl.appendChild(canvas);
    }
    // 連続メッシュは複数ボーンの画像を一枚で描く。
    // 先頭だけを代表にすると、右すね／つま先側で変更した順番が反映されないため、
    // 結合中で最も手前にしたボーンの番号へ合わせる。
    canvas.style.zIndex=String(displayLayerNoForBone(meshRenderLayerNo(binding)));
    canvas.style.opacity='1';
    canvas.style.transformOrigin=rootState ? `${rootState.anchorX}px ${rootState.anchorY}px` : '50% 50%';
    canvas.style.transform=displayScale===1 ? 'none' : `scale(${displayScale})`;
    drawMeshBinding(canvas,binding,world,requestMeshImage(renderSourceId,source.data));
  });
  Object.entries(meshCanvasElements).forEach(([id,canvas])=>{
    if(!activeIds.has(id)){ canvas.remove(); delete meshCanvasElements[id]; }
  });
}

function loadOnionImage(data){
  if(!data) return Promise.resolve(null);
  const cached=onionImageCache.get(data);
  if(cached) return cached.promise;
  const image=new Image();
  const promise=new Promise(resolve=>{
    image.addEventListener('load',()=>resolve(image),{once:true});
    image.addEventListener('error',()=>resolve(null),{once:true});
  });
  onionImageCache.set(data,{image,promise});
  image.src=data;
  return promise;
}

function drawOnionBoneShape(context,state){
  const {layer,pose,anchorX,anchorY,rotation}=state;
  context.save();
  context.translate(anchorX,anchorY);
  context.rotate(rotation*Math.PI/180);
  context.translate(-layer.ox*pose.w,-layer.oy*pose.h);
  const color=project.meta.display.boneColors ? (layer.color || defaultBoneColor(layer.key || layer.name || 'bone')) : '#aab8c5';
  context.fillStyle=color;
  context.strokeStyle='rgba(5,9,13,.92)';
  context.lineWidth=2;
  context.beginPath();
  if(layer.shape==='circle') context.ellipse(pose.w/2,pose.h/2,pose.w/2,pose.h/2,0,0,Math.PI*2);
  else{
    const radius=layer.shape==='bar' ? Math.min(pose.w,pose.h)/2 : layer.shape==='torso' ? Math.min(22,pose.w/3,pose.h/3) : Math.min(14,pose.w/3,pose.h/3);
    if(context.roundRect) context.roundRect(0,0,pose.w,pose.h,radius);
    else context.rect(0,0,pose.w,pose.h);
  }
  context.fill();
  context.stroke();
  context.restore();
}

function drawOnionBoneImage(context,state,image,imageDisplayScale,imageDisplayOrigin){
  if(!image?.naturalWidth) return;
  const {layer,pose,anchorX,anchorY,rotation}=state;
  const morph=activeBoneMorph(layer,pose);
  const imageLayer=visualLayerForPose(layer,pose);
  ensureImageCrop(imageLayer);
  const hasFragment=layerUsesBakedFragment(imageLayer);
  const cropX=hasFragment?0:imageLayer.imageCropX,cropY=hasFragment?0:imageLayer.imageCropY;
  const cropW=hasFragment?1:Math.max(.01,imageLayer.imageCropW),cropH=hasFragment?1:Math.max(.01,imageLayer.imageCropH);
  const unsignedScaleX=imageDisplayScale*Math.abs(Number(imageLayer.imageScaleX ?? 1));
  const unsignedScaleY=imageDisplayScale*Math.abs(Number(imageLayer.imageScaleY ?? 1));
  const flipX=morph ? !!morph.imageFlipX : effectiveBoneImageFlip(state.id,pose,'x',null);
  const flipY=morph ? !!morph.imageFlipY : effectiveBoneImageFlip(state.id,pose,'y',null);
  const sx=unsignedScaleX*(flipX?-1:1),sy=unsignedScaleY*(flipY?-1:1);
  const displayWorldOffset=imageDisplayOrigin?{x:(anchorX-imageDisplayOrigin.anchorX)*(imageDisplayScale-1),y:(anchorY-imageDisplayOrigin.anchorY)*(imageDisplayScale-1)}:{x:0,y:0};
  const displayLocalOffset=rotate(displayWorldOffset.x,displayWorldOffset.y,-rotation);
  const flipCenterOffset={x:flipX?2*unsignedScaleX*(.5-layer.ox)*pose.w:0,y:flipY?2*unsignedScaleY*(.5-layer.oy)*pose.h:0};
  const flipCenterCompensation=rotate(flipCenterOffset.x,flipCenterOffset.y,Number(imageLayer.imageRotation ?? 0));
  const tx=Number(imageLayer.imageOffsetX ?? 0)+displayLocalOffset.x+flipCenterCompensation.x;
  const ty=Number(imageLayer.imageOffsetY ?? 0)+displayLocalOffset.y+flipCenterCompensation.y;
  context.save();
  context.translate(anchorX,anchorY);
  context.rotate(rotation*Math.PI/180);
  context.translate(-layer.ox*pose.w,-layer.oy*pose.h);
  context.translate(tx+layer.ox*pose.w,ty+layer.oy*pose.h);
  context.rotate(Number(imageLayer.imageRotation ?? 0)*Math.PI/180);
  context.scale(sx,sy);
  context.translate(-layer.ox*pose.w,-layer.oy*pose.h);
  context.beginPath(); context.rect(0,0,pose.w,pose.h); context.clip();
  context.globalAlpha=Math.max(0,Math.min(1,Number(imageLayer.imageOpacity ?? 1)));
  context.drawImage(image,(-cropX/cropW)*pose.w,(-cropY/cropH)*pose.h,pose.w/cropW,pose.h/cropH);
  context.restore();
}

async function regenerateOnionSkin(frame,token){
  if(!onionSkinCanvasEl || !frame) return;
  const context=onionSkinCanvasEl.getContext('2d');
  const world=getWorldState(frame);
  const imageDisplayScale=Math.max(.5,Math.min(2.5,Number(project.meta.imageDisplayScale)||1));
  const imageDisplayOrigin=world[getRootId()] || null;
  const items=[];
  project.layerOrder.filter(isLayerActiveForCurrentAnimation).forEach((id,index)=>{
    if(frame[id]) items.push({type:'bone',id,z:sharedLayerNoForBone(id),index,meshComposited:!!findMeshBindingForBone(id)});
  });
  Object.values(project.meshBindings || {}).forEach((binding,index)=>{
    ensureMeshBinding(binding);
    const hasFrameBone=binding.boneChain?.some(id=>frame[id]);
    if(binding.enabled!==false && hasFrameBone && binding.boneChain.every(isLayerActiveForCurrentAnimation)) items.push({type:'mesh',binding,z:meshRenderLayerNo(binding),index:project.layerOrder.length+index});
  });
  const imageJobs=[];
  for(const item of items){
    if(item.type==='bone'){
      const data=item.meshComposited ? null : getLayerRenderImageData(visualLayerForPose(project.layers[item.id],frame[item.id]));
      if(data) imageJobs.push(loadOnionImage(data).then(image=>{item.image=image;}));
    }else{
      const sourceId=activeImageSlotSourceId(item.binding.imageSourceSlot)||item.binding.sourceId;
      const data=project.imageSources?.[sourceId]?.data;
      if(data) imageJobs.push(loadOnionImage(data).then(image=>{item.image=image;}));
    }
  }
  await Promise.all(imageJobs);
  if(token!==onionSkinRenderToken) return;
  context.clearRect(0,0,onionSkinCanvasEl.width,onionSkinCanvasEl.height);
  items.sort((a,b)=>a.z-b.z || a.index-b.index);
  for(const item of items){
    if(item.type==='bone'){
      const state=world[item.id];
      if(project.meta.display.bones) drawOnionBoneShape(context,state);
      if(project.meta.display.images && item.image && !item.meshComposited) drawOnionBoneImage(context,state,item.image,imageDisplayScale,imageDisplayOrigin);
    }else if(project.meta.display.images && item.image){
      const temporary=document.createElement('canvas'); temporary.width=1000; temporary.height=1000;
      drawMeshBinding(temporary,item.binding,world,item.image,frame);
      context.save();
      if(imageDisplayScale!==1 && imageDisplayOrigin){
        context.translate(imageDisplayOrigin.anchorX,imageDisplayOrigin.anchorY);
        context.scale(imageDisplayScale,imageDisplayScale);
        context.translate(-imageDisplayOrigin.anchorX,-imageDisplayOrigin.anchorY);
      }
      context.imageSmoothingEnabled=true;
      context.imageSmoothingQuality='high';
      context.drawImage(temporary,0,0,temporary.width,temporary.height,0,0,1000,1000);
      context.restore();
    }
  }
}

function syncOnionSkinCanvas(){
  if(!onionSkinCanvasEl) return;
  const animation=currentAnimation(),enabled=!!project.meta.display.onionSkin;
  const visible=enabled && !!animation && currentFrame>0 && animation.frames.length>1;
  onionSkinCanvasEl.classList.toggle('visible',visible);
  if(!visible){
    onionSkinRenderKey='';
    onionSkinRenderToken++;
    onionSkinCanvasEl.getContext('2d').clearRect(0,0,onionSkinCanvasEl.width,onionSkinCanvasEl.height);
    return;
  }
  const key=`${animation.id}:${currentFrame}`;
  if(key===onionSkinRenderKey) return;
  onionSkinRenderKey=key;
  const token=++onionSkinRenderToken;
  regenerateOnionSkin(animation.frames[currentFrame-1],token);
}

let meshEditorState = null;
let meshControlPointer = null;
let meshPanPointer = null;

function findMeshBindingForBone(boneId){
  return Object.values(project.meshBindings || {}).find(binding => binding.enabled !== false && binding.boneChain?.includes(boneId)) || null;
}

function connectedChainOptions(selectedId){
  const byKey = key => project.layerOrder.find(id => project.layers[id]?.key === key);
  const knownGroups = [
    ['armRU','armRL','handR'], ['armLU','armLL','handL'],
    ['legRU','legRL','footR','toeR'], ['legLU','legLL','footL','toeL'],
    ['waist','abdomen','chest','neck']
  ].map(keys => keys.map(byKey).filter(Boolean)).filter(chain => chain.length >= 2);

  const children = {};
  project.layerOrder.forEach(id => { children[id] = []; });
  project.layerOrder.forEach(id => {
    const parent = project.layers[id]?.parent;
    if(parent && children[parent]) children[parent].push(id);
  });
  const generic = [];
  project.layerOrder.forEach(startId => {
    const chain = [startId];
    let current = startId;
    while(children[current]?.length === 1){
      current = children[current][0];
      chain.push(current);
      if(chain.length >= 2) generic.push([...chain]);
    }
  });

  const unique = new Map();
  const candidates=[];
  knownGroups.forEach(chain=>{
    for(let start=0;start<chain.length-1;start++){
      for(let end=start+1;end<chain.length;end++) candidates.push(chain.slice(start,end+1));
    }
  });
  candidates.push(...generic);
  project.layerOrder.forEach(id=>{
    const key=project.layers[id]?.key;
    const hasRealToe=key==='footR' ? !!byKey('toeR') : key==='footL' ? !!byKey('toeL') : false;
    if(['footR','footL'].includes(key) && !hasRealToe) candidates.push([id]);
    if(['toeR','toeL'].includes(key)) candidates.push([id]);
    if(key==='neck') candidates.push([id]);
  });
  candidates.forEach(chain => {
    if(!chain.includes(selectedId)) return;
    const valid = chain.every((id,index) => index === 0 || project.layers[id]?.parent === chain[index-1]);
    if(valid) unique.set(chain.join('|'), chain);
  });
  return [...unique.values()].sort((left,right) => {
    const leftStarts = left[0] === selectedId ? 0 : 1;
    const rightStarts = right[0] === selectedId ? 0 : 1;
    return leftStarts-rightStarts || right.length-left.length;
  });
}

function chainLabel(chain){
  const labels=chain.map(id => project.layers[id]?.name || id);
  if(chain.length===1 && ['footR','footL'].includes(project.layers[chain[0]]?.key)){
    const footKey=project.layers[chain[0]]?.key;
    const toeKey=footKey==='footR'?'toeR':'toeL';
    if(!getLayerIdByKey(toeKey)) labels.push('つま先');
  }
  return labels.join(' → ');
}

function meshChainEndLabel(chain){
  const key=project.layers[chain[0]]?.key;
  const virtualToe=chain.length===1 && ['footR','footL'].includes(key) && !getLayerIdByKey(key==='footR'?'toeR':'toeL');
  return virtualToe ? 'つま先' : (project.layers[chain.at(-1)]?.name || chain.at(-1));
}

function oppositeBoneId(boneId){
  const key=project.layers[boneId]?.key || '';
  const pairs={
    armRU:'armLU',armLU:'armRU',armRL:'armLL',armLL:'armRL',handR:'handL',handL:'handR',
    legRU:'legLU',legLU:'legRU',legRL:'legLL',legLL:'legRL',footR:'footL',footL:'footR',toeR:'toeL',toeL:'toeR'
  };
  const oppositeKey=pairs[key] || null;
  return oppositeKey ? getLayerIdByKey(oppositeKey) : null;
}

function oppositeChainForChain(chain){
  const oppositeChain=(chain || []).map(oppositeBoneId);
  return oppositeChain.length && oppositeChain.every(Boolean) ? oppositeChain : null;
}

function oppositeMeshBindingForChain(chain){
  const oppositeChain=oppositeChainForChain(chain);
  if(!oppositeChain) return null;
  return Object.values(project.meshBindings || {}).find(binding=>
    binding.enabled!==false
    && binding.boneChain?.length===oppositeChain.length
    && binding.boneChain.every((id,index)=>id===oppositeChain[index])
  ) || null;
}

function copyMeshSourceRectToOpposite(){
  if(!meshEditorState) return;
  const oppositeChain=oppositeChainForChain(meshEditorState.boneChain);
  const status=document.getElementById('meshRangeCopyStatus');
  if(!oppositeChain){
    if(status) status.textContent='反対側に対応するボーン列がありません。';
    return;
  }
  pushHistory();
  let target=oppositeMeshBindingForChain(meshEditorState.boneChain);
  const created=!target;
  if(!target){
    const id=meshBindingUid();
    target=project.meshBindings[id]={
      id,
      name:chainLabel(oppositeChain),
      sourceId:meshEditorState.sourceId,
      imageSourceSlot:meshEditorState.imageSourceSlot || null,
      boneChain:[...oppositeChain],
      controlPoints:[],
      segmentsPerBone:meshEditorState.segmentsPerBone,
      targetWidthScale:meshEditorState.targetWidthScale,
      targetScaleX:meshEditorState.targetScaleX,
      targetScaleY:meshEditorState.targetScaleY,
      targetOffsetX:meshEditorState.targetOffsetX,
      targetOffsetY:meshEditorState.targetOffsetY,
      partSlot:inferredPartSlot(oppositeChain),
      rotation:meshEditorState.rotation,
      flipX:meshEditorState.flipX,
      flipY:meshEditorState.flipY,
      sourceDirectionVersion:isNeckTerminalMeshChain(oppositeChain)?3:2,
      boneFlipX:{},
      sourceRect:normalizeMeshSourceRect(meshEditorState.sourceRect),
      rectangularSource:!!meshEditorState.widthLocked,
      enabled:true
    };
    oppositeChain.forEach(boneId=>clearLayerImage(project.layers[boneId]));
  }
  target.sourceRect=normalizeMeshSourceRect(meshEditorState.sourceRect);
  target.controlPoints=clone(meshEditorState.controlPoints);
  target.rectangularSource=!!meshEditorState.widthLocked;
  ensureMeshBinding(target);
  syncMeshBindingResizeBoxWidth(target);
  syncMeshBindingEditorResizeBoxWidth(target);
  if(status) status.textContent=`${target.name || chainLabel(target.boneChain)}を${created?'作成し、':''}同じ画像位置・変形範囲・メッシュ点にしました。`;
  saveProject();
  render();
}

function syncMeshChainSelectors(){
  if(!meshEditorState) return;
  const options=meshEditorState.chainOptions || [];
  const currentKey=meshEditorState.boneChain.join('|');
  meshChainSelectEl.innerHTML='';
  options.forEach(chain=>{
    const option=document.createElement('option');
    option.value=chain.join('|'); option.textContent=chainLabel(chain);
    meshChainSelectEl.appendChild(option);
  });
  meshChainSelectEl.value=currentKey;

  const starts=[...new Set(options.map(chain=>chain[0]))];
  meshChainStartSelectEl.innerHTML='';
  starts.forEach(id=>{
    const option=document.createElement('option');
    option.value=id; option.textContent=project.layers[id]?.name || id;
    meshChainStartSelectEl.appendChild(option);
  });
  const currentStart=meshEditorState.boneChain[0];
  meshChainStartSelectEl.value=currentStart;

  const endings=options.filter(chain=>chain[0]===currentStart).sort((left,right)=>left.length-right.length);
  meshChainEndSelectEl.innerHTML='';
  endings.forEach(chain=>{
    const option=document.createElement('option');
    option.value=chain.join('|');
    option.textContent=meshChainEndLabel(chain);
    meshChainEndSelectEl.appendChild(option);
  });
  meshChainEndSelectEl.value=currentKey;
  const rangeHint=document.getElementById('meshChainRangeHint');
  if(rangeHint){
    const labels=endings.map(chain=>`${meshChainEndLabel(chain)}まで`);
    rangeHint.textContent=labels.length ? `選択可能: ${labels.join(' / ')}` : '';
  }
}

function inferredPartSlot(chain){
  const keys=chain.map(id=>project.layers[id]?.key);
  if(keys.includes('armRU')) return 'right_arm';
  if(keys.includes('armLU')) return 'left_arm';
  if(keys.includes('legRU')) return 'right_leg';
  if(keys.includes('legLU')) return 'left_leg';
  if(keys.some(key=>['waist','abdomen','chest'].includes(key))) return 'torso';
  return 'custom';
}

function fitMeshPreview(){
  if(!meshEditorState || !meshPreviewImageEl?.naturalWidth) return;
  const area=document.getElementById('meshPreviewArea');
  const availableWidth=Math.max(180,area.clientWidth-36), availableHeight=Math.max(180,area.clientHeight-36);
  const scale=Math.min(availableWidth/meshPreviewImageEl.naturalWidth,availableHeight/meshPreviewImageEl.naturalHeight,1) * (meshEditorState.zoom || 1);
  meshPreviewFrameEl.style.width=`${Math.max(180,Math.round(meshPreviewImageEl.naturalWidth*scale))}px`;
  meshPreviewFrameEl.style.height=`${Math.max(180,Math.round(meshPreviewImageEl.naturalHeight*scale))}px`;
  area.classList.toggle('is-zoomed',(meshEditorState.zoom || 1)>1);
  if(meshZoomValueEl) meshZoomValueEl.textContent=`${Math.round((meshEditorState.zoom || 1)*100)}%`;
  renderMeshControlOverlay();
}

function meshControlBandPolygon(points){
  const left=[], right=[];
  points.forEach((point,index) => {
    const previous=points[Math.max(0,index-1)], next=points[Math.min(points.length-1,index+1)];
    const dx=(next.u-previous.u)*100, dy=(next.v-previous.v)*100;
    const length=Math.hypot(dx,dy)||1, nx=-dy/length, ny=dx/length;
    left.push(`${point.u*100+nx*point.leftWidth*100},${point.v*100+ny*point.leftWidth*100}`);
    right.unshift(`${point.u*100-nx*point.rightWidth*100},${point.v*100-ny*point.rightWidth*100}`);
  });
  return [...left,...right].join(' ');
}

function meshPointSides(points,index){
  const point=points[index],previous=points[Math.max(0,index-1)],next=points[Math.min(points.length-1,index+1)];
  const dx=(next.u-previous.u)*100,dy=(next.v-previous.v)*100,length=Math.hypot(dx,dy)||1,nx=-dy/length,ny=dx/length;
  return {
    nx,ny,
    left:{x:point.u*100+nx*point.leftWidth*100,y:point.v*100+ny*point.leftWidth*100},
    right:{x:point.u*100-nx*point.rightWidth*100,y:point.v*100-ny*point.rightWidth*100}
  };
}

function meshPointLabel(index){
  const points=meshEditorState?.controlPoints || [],chain=meshEditorState?.boneChain || [];
  const customName=points[index]?.name;
  if(customName) return customName;
  if(index===0) return `${project.layers[chain[0]]?.name || '開始'}・根元`;
  if(index===points.length-1) return `${project.layers[chain.at(-1)]?.name || '終端'}・先端`;
  const jointIndex=Math.round(points[index].t*chain.length);
  const exact=Math.abs(points[index].t-jointIndex/chain.length)<.025;
  return exact && jointIndex>0 && jointIndex<chain.length ? project.layers[chain[jointIndex]]?.name || `関節${jointIndex}` : `中間点 ${index}`;
}

function applyLockedMeshWidths(){
  if(!meshEditorState?.widthLocked) return;
  const source=meshEditorState.controlPoints[meshEditorState.activePoint];
  if(!source) return;
  meshEditorState.controlPoints.forEach(point=>{
    point.leftWidth=source.leftWidth;
    point.rightWidth=source.rightWidth;
    point.width=point.leftWidth+point.rightWidth;
  });
}

function alignRectangularMeshPoints(){
  if(!meshEditorState?.widthLocked) return;
  const points=meshEditorState.controlPoints;
  if(points.length<2) return;
  const start=points[0],end=points.at(-1),span=Math.max(.0001,end.t-start.t);
  points.slice(1,-1).forEach(point=>{
    const ratio=Math.max(0,Math.min(1,(point.t-start.t)/span));
    point.u=start.u+(end.u-start.u)*ratio;
    point.v=start.v+(end.v-start.v)*ratio;
  });
}

function moveRectangularMeshPoint(index,u,v){
  if(!meshEditorState?.widthLocked) return;
  const points=meshEditorState.controlPoints;
  if(index<=0 || index>=points.length-1) return;
  const start=points[0],end=points.at(-1);
  const axisU=end.u-start.u,axisV=end.v-start.v,lengthSquared=axisU*axisU+axisV*axisV;
  if(lengthSquared<.000001) return;
  const ratioFor=point=>((point.u-start.u)*axisU+(point.v-start.v)*axisV)/lengthSquared;
  const requestedRatio=((u-start.u)*axisU+(v-start.v)*axisV)/lengthSquared;
  const previousRatio=ratioFor(points[index-1]),nextRatio=ratioFor(points[index+1]);
  const margin=Math.min(.005,Math.max(0,(nextRatio-previousRatio)/4));
  const ratio=Math.max(previousRatio+margin,Math.min(nextRatio-margin,requestedRatio));
  points[index].u=start.u+axisU*ratio;
  points[index].v=start.v+axisV*ratio;
}

function renderMeshControlOverlay(){
  if(!meshEditorState || !meshControlOverlayEl) return;
  const points=meshEditorState.controlPoints;
  const chain=meshEditorState.boneChain;
  const rect=meshControlOverlayEl.getBoundingClientRect();
  const unit=Math.max(.001,Math.sqrt((rect.width || 100) * (rect.height || 100)) / 100);
  // SVGの座標は画像と一緒に拡大されるため、表示上のpx値を逆算して操作ガイドだけは一定サイズに保つ。
  const pointRadius=6 / unit;
  const handleRadius=5 / unit;
  const labelFontSize=12 / unit;
  const labelOffsetX=8 / Math.max(1,rect.width / 100);
  const labelOffsetY=7 / Math.max(1,rect.height / 100);
  meshControlOverlayEl.innerHTML='';
  const sourceRect=normalizeMeshSourceRect(meshEditorState.sourceRect);
  const range=document.createElementNS('http://www.w3.org/2000/svg','rect');
  range.setAttribute('class','mesh-source-range');
  range.setAttribute('x',String(sourceRect.x*100)); range.setAttribute('y',String(sourceRect.y*100));
  range.setAttribute('width',String(sourceRect.w*100)); range.setAttribute('height',String(sourceRect.h*100));
  meshControlOverlayEl.appendChild(range);
  const rangeHandleRadius=6 / unit;
  const corners={tl:[sourceRect.x,sourceRect.y],tr:[sourceRect.x+sourceRect.w,sourceRect.y],bl:[sourceRect.x,sourceRect.y+sourceRect.h],br:[sourceRect.x+sourceRect.w,sourceRect.y+sourceRect.h]};
  Object.entries(corners).forEach(([corner,[x,y]])=>{
    const handle=document.createElementNS('http://www.w3.org/2000/svg','rect');
    handle.setAttribute('class','mesh-range-handle'); handle.dataset.corner=corner;
    handle.setAttribute('x',String(x*100-rangeHandleRadius)); handle.setAttribute('y',String(y*100-rangeHandleRadius));
    handle.setAttribute('width',String(rangeHandleRadius*2)); handle.setAttribute('height',String(rangeHandleRadius*2));
    meshControlOverlayEl.appendChild(handle);
  });
  const polygon=document.createElementNS('http://www.w3.org/2000/svg','polygon');
  polygon.setAttribute('class','mesh-control-band');
  polygon.setAttribute('points',meshControlBandPolygon(points));
  meshControlOverlayEl.appendChild(polygon);
  const line=document.createElementNS('http://www.w3.org/2000/svg','polyline');
  line.setAttribute('class','mesh-control-line');
  line.setAttribute('points',points.map(point=>`${point.u*100},${point.v*100}`).join(' '));
  meshControlOverlayEl.appendChild(line);
  points.forEach((point,index) => {
    const sides=meshPointSides(points,index);
    ['left','right'].forEach(side=>{
      const handle=document.createElementNS('http://www.w3.org/2000/svg','circle');
      handle.setAttribute('class',`mesh-width-handle${meshEditorState.activePoint===index?' active':''}`);
      handle.setAttribute('data-index',String(index)); handle.setAttribute('data-side',side);
      handle.setAttribute('cx',String(sides[side].x)); handle.setAttribute('cy',String(sides[side].y)); handle.setAttribute('r',String(handleRadius));
      meshControlOverlayEl.appendChild(handle);
    });
    const circle=document.createElementNS('http://www.w3.org/2000/svg','circle');
    circle.setAttribute('class',`mesh-control-point${meshEditorState.activePoint===index?' active':''}`);
    circle.setAttribute('data-index',String(index));
    circle.setAttribute('cx',String(point.u*100)); circle.setAttribute('cy',String(point.v*100)); circle.setAttribute('r',String(pointRadius));
    meshControlOverlayEl.appendChild(circle);
    const label=document.createElementNS('http://www.w3.org/2000/svg','text');
    label.setAttribute('class','mesh-control-label');
    label.setAttribute('x',String(Math.min(98,point.u*100+labelOffsetX))); label.setAttribute('y',String(Math.max(labelOffsetY,point.v*100-labelOffsetY)));
    label.setAttribute('font-size',String(labelFontSize));
    label.textContent=meshPointLabel(index);
    meshControlOverlayEl.appendChild(label);
  });
}

function syncMeshEditorControls(){
  if(!meshEditorState) return;
  const source=project.imageSources?.[meshEditorState.sourceId];
  const imageSlotLabel=IMAGE_SLOT_DEFS.find(def=>def.id===meshEditorState.imageSourceSlot)?.label;
  const sourceLabel=source ? `${imageSlotLabel ? `${imageSlotLabel}: ` : ''}${source.name}` : '画像未設定';
  meshSourceLabelEl.textContent=sourceLabel;
  document.getElementById('meshImageStatus').textContent=source ? `${sourceLabel} / 関節点 ${meshEditorState.controlPoints.length}個` : '腕・脚全体が1枚につながった透過画像を使用します。';
  const activePoint=meshEditorState.controlPoints[meshEditorState.activePoint] || meshEditorState.controlPoints[0];
  const sourceWidth=Math.round(((activePoint?.leftWidth || .44)+(activePoint?.rightWidth || .44))*100);
  document.getElementById('meshSourceWidthInput').value=String(sourceWidth);
  document.getElementById('meshSourceWidthValue').textContent=`${sourceWidth}%`;
  document.getElementById('meshTargetWidthInput').value=String(Math.round(meshEditorState.targetWidthScale*100));
  document.getElementById('meshTargetWidthValue').textContent=`${Math.round(meshEditorState.targetWidthScale*100)}%`;
  document.getElementById('meshSegmentsInput').value=String(meshEditorState.segmentsPerBone);
  document.getElementById('meshSegmentsValue').textContent=String(meshEditorState.segmentsPerBone);
  document.getElementById('meshPartSlotSelect').value=meshEditorState.partSlot || 'custom';
  document.getElementById('meshFlipXBtn').setAttribute('aria-pressed',String(!!meshEditorState.flipX));
  document.getElementById('meshFlipYBtn').setAttribute('aria-pressed',String(!!meshEditorState.flipY));
  document.getElementById('meshRotationInput').value=String(meshEditorState.rotation || 0);
  document.getElementById('meshActivePointLabel').textContent=meshPointLabel(meshEditorState.activePoint);
  document.getElementById('meshPointNameInput').value=activePoint.name || '';
  document.getElementById('meshPointTInput').value=String(Math.round(activePoint.t*100));
  document.getElementById('meshPointTValue').textContent=`${Math.round(activePoint.t*100)}%`;
  document.getElementById('meshPointLeftInput').value=String(Math.round(activePoint.leftWidth*100));
  document.getElementById('meshPointLeftValue').textContent=`${Math.round(activePoint.leftWidth*100)}%`;
  document.getElementById('meshPointRightInput').value=String(Math.round(activePoint.rightWidth*100));
  document.getElementById('meshPointRightValue').textContent=`${Math.round(activePoint.rightWidth*100)}%`;
  document.getElementById('meshSymmetricWidthInput').checked=meshEditorState.symmetricWidth !== false;
  document.getElementById('meshLockWidthInput').checked=!!meshEditorState.widthLocked;
  const sourceRect=normalizeMeshSourceRect(meshEditorState.sourceRect);
  const percent=value=>Math.round(value*1000)/10;
  document.getElementById('meshRangeXInput').value=String(percent(sourceRect.x));
  document.getElementById('meshRangeYInput').value=String(percent(sourceRect.y));
  document.getElementById('meshRangeWInput').value=String(percent(sourceRect.w));
  document.getElementById('meshRangeHInput').value=String(percent(sourceRect.h));
  const endpoint=meshEditorState.activePoint===0 || meshEditorState.activePoint===meshEditorState.controlPoints.length-1;
  document.getElementById('meshPointTInput').disabled=endpoint;
  document.getElementById('meshRemovePointBtn').disabled=endpoint;
  document.getElementById('meshReferencePoseStatus').textContent=`基準: ${project.meta.referencePoseName || '初期フレーム'} / この姿勢に合わせた素材ガイドを出力できます。`;
  document.getElementById('meshBindingDeleteBtn').disabled=!meshEditorState.bindingId;
  const opposite=oppositeMeshBindingForChain(meshEditorState.boneChain);
  const oppositeChain=oppositeChainForChain(meshEditorState.boneChain);
  const copyButton=document.getElementById('meshRangeCopyOppositeBtn');
  if(copyButton){
    copyButton.disabled=!oppositeChain;
    copyButton.title=opposite
      ? `${opposite.name || chainLabel(opposite.boneChain)}へ画像位置・変形範囲・メッシュ点をコピー`
      : oppositeChain ? `${chainLabel(oppositeChain)}を作成して画像位置・変形範囲・メッシュ点をコピー` : '反対側に対応するボーン列がありません';
  }
  renderMeshControlOverlay();
}

async function setMeshPreviewSource(sourceId){
  if(!meshEditorState) return;
  meshEditorState.sourceId=sourceId;
  const source=project.imageSources?.[sourceId];
  if(source?.data){
    meshPreviewImageEl.onload=fitMeshPreview;
    // 参照位置を確認する画面では元画像の座標を固定し、反転はメッシュへの貼り付け結果だけへ適用する。
    meshPreviewImageEl.src=await createRotatedSourceData(source.data,meshEditorState.rotation,false,false);
  }else{
    meshPreviewImageEl.removeAttribute('src');
  }
  syncMeshEditorControls();
}

function selectMeshChain(chain){
  if(!meshEditorState) return;
  meshEditorState.boneChain=[...chain];
  meshEditorState.controlPoints=defaultMeshControlPointsForChain(chain);
  meshEditorState.partSlot=inferredPartSlot(chain);
  meshEditorState.activePoint=0;
  const rangeCopyStatus=document.getElementById('meshRangeCopyStatus');
  if(rangeCopyStatus) rangeCopyStatus.textContent='';
  syncMeshChainSelectors();
  syncMeshEditorControls();
}

function openMeshBindingEditor(){
  if(!selectedLayer) return;
  const existing=findMeshBindingForBone(selectedLayer);
  const options=connectedChainOptions(selectedLayer);
  if(existing && !options.some(chain=>chain.join('|')===existing.boneChain.join('|'))) options.unshift(existing.boneChain);
  if(!options.length){ alert('選択ボーンを含む、連続メッシュに使える親子範囲がありません。'); return; }
  const chain=existing?.boneChain || options[0];
  const layerSourceId=ensureLayerImageSource(currentLayer());
  const sourceSlot=existing?.imageSourceSlot || currentLayer()?.imageSourceSlot || (!existing?.sourceId && !layerSourceId && activeImageSlotSourceId('body') ? 'body' : null);
  meshEditorState={
    bindingId:existing?.id || null,
    sourceId:activeImageSlotSourceId(sourceSlot) || existing?.sourceId || layerSourceId || project.baseImageSourceId,
    imageSourceSlot:sourceSlot,
    chainOptions:options,
    boneChain:[...chain],
    controlPoints:existing ? clone(existing.controlPoints) : defaultMeshControlPointsForChain(chain),
    segmentsPerBone:existing?.segmentsPerBone || 6,
    targetWidthScale:existing?.targetWidthScale || 1,
    targetScaleX:existing?.targetScaleX || 1,
    targetScaleY:existing?.targetScaleY || 1,
    targetOffsetX:existing?.targetOffsetX || 0,
    targetOffsetY:existing?.targetOffsetY || 0,
    partSlot:existing?.partSlot || inferredPartSlot(chain),
    rotation:existing?.rotation || 0,
    flipX:!!existing?.flipX,
    flipY:!!existing?.flipY,
    boneFlipX:clone(existing?.boneFlipX || {}),
    sourceRect:normalizeMeshSourceRect(existing?.sourceRect),
    activePoint:0,
    zoom:1,
    symmetricWidth:true,
    widthLocked:!!existing?.rectangularSource
  };
  ensureMeshBinding(meshEditorState);
  if(meshEditorState.widthLocked){
    applyLockedMeshWidths();
    alignRectangularMeshPoints();
  }
  syncMeshChainSelectors();
  if(typeof meshBindingDialogEl?.showModal==='function') meshBindingDialogEl.showModal();
  setMeshPreviewSource(meshEditorState.sourceId);
  requestAnimationFrame(fitMeshPreview);
}

function closeMeshBindingEditor(){
  const temporarySourceId=meshEditorState?.temporarySourceId;
  meshEditorState=null; meshControlPointer=null; meshPanPointer=null;
  meshBindingDialogEl?.close();
  removeOrphanImageSource(temporarySourceId);
}

function applyMeshBindingEditor(){
  if(!meshEditorState?.sourceId || !project.imageSources?.[meshEditorState.sourceId]){
    alert('メッシュ変形に使う画像を選択してください。'); return;
  }
  const overlap=Object.values(project.meshBindings).find(binding=>binding.id!==meshEditorState.bindingId && binding.boneChain?.some(id=>meshEditorState.boneChain.includes(id)));
  if(overlap){ alert(`「${overlap.name || chainLabel(overlap.boneChain)}」と使用ボーンが重複しています。`); return; }
  pushHistory();
  const id=meshEditorState.bindingId || meshBindingUid();
  const previousSourceId=project.meshBindings[id]?.sourceId;
  const replacedLayerSources=new Set(meshEditorState.boneChain.map(boneId=>project.layers[boneId]?.imageSourceId).filter(Boolean));
  project.meshBindings[id]={
    id,
    name:chainLabel(meshEditorState.boneChain),
    sourceId:meshEditorState.sourceId,
    imageSourceSlot:meshEditorState.imageSourceSlot || null,
    boneChain:[...meshEditorState.boneChain],
    controlPoints:clone(meshEditorState.controlPoints),
    segmentsPerBone:meshEditorState.segmentsPerBone,
    targetWidthScale:meshEditorState.targetWidthScale,
    targetScaleX:meshEditorState.targetScaleX,
    targetScaleY:meshEditorState.targetScaleY,
    targetOffsetX:meshEditorState.targetOffsetX,
    targetOffsetY:meshEditorState.targetOffsetY,
    partSlot:meshEditorState.partSlot,
    rotation:meshEditorState.rotation,
    flipX:meshEditorState.flipX,
    flipY:meshEditorState.flipY,
    sourceDirectionVersion:isNeckTerminalMeshChain(meshEditorState.boneChain)?3:2,
    boneFlipX:clone(meshEditorState.boneFlipX || {}),
    sourceRect:normalizeMeshSourceRect(meshEditorState.sourceRect),
    rectangularSource:!!meshEditorState.widthLocked,
    enabled:true
  };
  ensureMeshBinding(project.meshBindings[id]);
  syncMeshBindingResizeBoxWidth(project.meshBindings[id]);
  syncMeshBindingEditorResizeBoxWidth(project.meshBindings[id]);
  meshEditorState.boneChain.forEach(boneId=>clearLayerImage(project.layers[boneId]));
  removeOrphanImageSource(previousSourceId);
  replacedLayerSources.forEach(removeOrphanImageSource);
  closeMeshBindingEditor();
  render();
}

function deleteMeshBindingEditor(){
  if(!meshEditorState?.bindingId) return;
  if(!confirm('この連続メッシュ設定を削除しますか？')) return;
  pushHistory();
  const sourceId=project.meshBindings[meshEditorState.bindingId]?.sourceId;
  delete project.meshBindings[meshEditorState.bindingId];
  removeOrphanImageSource(sourceId);
  closeMeshBindingEditor();
  render();
}

function startMeshControlPointer(event){
  const rangeTarget=event.target.closest?.('.mesh-source-range,.mesh-range-handle');
  if(meshEditorState && rangeTarget){
    event.preventDefault();
    const rect=meshControlOverlayEl.getBoundingClientRect();
    meshControlPointer={pointerId:event.pointerId,mode:rangeTarget.matches('.mesh-range-handle')?'range-resize':'range-move',corner:rangeTarget.dataset.corner || '',startX:event.clientX,startY:event.clientY,startRect:normalizeMeshSourceRect(meshEditorState.sourceRect),overlayWidth:rect.width,overlayHeight:rect.height};
    meshControlOverlayEl.setPointerCapture?.(event.pointerId);
    return;
  }
  const point=event.target.closest?.('.mesh-control-point,.mesh-width-handle');
  if(!meshEditorState || !point){
    // 緑の帯域を掴んだ時は、丸い制御点を選ばなくても範囲全体を平行移動する。
    const band=event.target.closest?.('.mesh-control-band,.mesh-control-line');
    if(!band) return;
    event.preventDefault();
    const rect=meshControlOverlayEl.getBoundingClientRect();
    meshControlPointer={pointerId:event.pointerId,mode:'control-range-move',startX:event.clientX,startY:event.clientY,overlayWidth:rect.width,overlayHeight:rect.height,startPoints:clone(meshEditorState.controlPoints)};
    meshControlOverlayEl.setPointerCapture?.(event.pointerId);
    return;
  }
  event.preventDefault();
  const index=Number(point.dataset.index);
  meshEditorState.activePoint=index;
  meshControlPointer={pointerId:event.pointerId,index,side:point.dataset.side || 'center'};
  meshControlOverlayEl.setPointerCapture?.(event.pointerId);
  syncMeshEditorControls();
}

function moveMeshControlPointer(event){
  if(!meshEditorState || !meshControlPointer) return;
  const rect=meshControlOverlayEl.getBoundingClientRect();
  if(!rect.width || !rect.height) return;
  if(meshControlPointer.mode?.startsWith('range-')){
    const start=meshControlPointer.startRect;
    const dx=(event.clientX-meshControlPointer.startX)/Math.max(1,meshControlPointer.overlayWidth);
    const dy=(event.clientY-meshControlPointer.startY)/Math.max(1,meshControlPointer.overlayHeight);
    if(meshControlPointer.mode==='range-move'){
      meshEditorState.sourceRect={...start,x:Math.max(0,Math.min(1-start.w,start.x+dx)),y:Math.max(0,Math.min(1-start.h,start.y+dy))};
    }else{
      let left=start.x,top=start.y,right=start.x+start.w,bottom=start.y+start.h;
      if(meshControlPointer.corner.includes('l')) left=Math.max(0,Math.min(right-.03,left+dx));
      if(meshControlPointer.corner.includes('r')) right=Math.min(1,Math.max(left+.03,right+dx));
      if(meshControlPointer.corner.includes('t')) top=Math.max(0,Math.min(bottom-.03,top+dy));
      if(meshControlPointer.corner.includes('b')) bottom=Math.min(1,Math.max(top+.03,bottom+dy));
      meshEditorState.sourceRect={x:left,y:top,w:right-left,h:bottom-top};
    }
    syncMeshEditorControls();
    return;
  }
  if(meshControlPointer.mode==='control-range-move'){
    const dx=(event.clientX-meshControlPointer.startX)/Math.max(1,meshControlPointer.overlayWidth);
    const dy=(event.clientY-meshControlPointer.startY)/Math.max(1,meshControlPointer.overlayHeight);
    meshEditorState.controlPoints.forEach((point,index)=>{
      const start=meshControlPointer.startPoints[index];
      point.u=Math.max(0,Math.min(1,start.u+dx));
      point.v=Math.max(0,Math.min(1,start.v+dy));
    });
    syncMeshEditorControls();
    return;
  }
  const control=meshEditorState.controlPoints[meshControlPointer.index];
  const u=Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width));
  const v=Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height));
  if(meshControlPointer.side==='center'){
    if(meshEditorState.widthLocked && meshControlPointer.index>0 && meshControlPointer.index<meshEditorState.controlPoints.length-1){
      moveRectangularMeshPoint(meshControlPointer.index,u,v);
    }else{
      control.u=u; control.v=v;
      alignRectangularMeshPoints();
    }
  }else{
    const sides=meshPointSides(meshEditorState.controlPoints,meshControlPointer.index);
    const projected=(u-control.u)*sides.nx+(v-control.v)*sides.ny;
    const width=meshControlPointer.side==='left' ? Math.max(.01,Math.min(1,projected)) : Math.max(.01,Math.min(1,-projected));
    if(meshEditorState.symmetricWidth !== false){ control.leftWidth=width; control.rightWidth=width; }
    else if(meshControlPointer.side==='left') control.leftWidth=width;
    else control.rightWidth=width;
    control.width=control.leftWidth+control.rightWidth;
    applyLockedMeshWidths();
  }
  syncMeshEditorControls();
}

function endMeshControlPointer(event){
  if(!meshControlPointer) return;
  try{meshControlOverlayEl.releasePointerCapture?.(meshControlPointer.pointerId);}catch(error){}
  meshControlPointer=null;
}

function addMeshControlPoint(){
  if(!meshEditorState) return;
  const points=meshEditorState.controlPoints;
  let leftIndex=Math.min(meshEditorState.activePoint,points.length-2);
  if(meshEditorState.activePoint===points.length-1) leftIndex=points.length-2;
  const left=points[leftIndex],right=points[leftIndex+1];
  const point={
    u:(left.u+right.u)/2,
    v:(left.v+right.v)/2,
    t:(left.t+right.t)/2,
    name:'分割点',
    leftWidth:(left.leftWidth+right.leftWidth)/2,
    rightWidth:(left.rightWidth+right.rightWidth)/2
  };
  point.width=point.leftWidth+point.rightWidth;
  points.splice(leftIndex+1,0,point);
  meshEditorState.activePoint=leftIndex+1;
  alignRectangularMeshPoints();
  syncMeshEditorControls();
}

function startMeshPreviewPan(event){
  if(!meshEditorState || event.target.closest?.('.mesh-control-point,.mesh-width-handle,.mesh-source-range,.mesh-range-handle,.mesh-control-band,.mesh-control-line')) return;
  const area=event.currentTarget;
  event.preventDefault();
  meshPanPointer={pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,scrollLeft:area.scrollLeft,scrollTop:area.scrollTop};
  area.classList.add('is-panning');
  area.setPointerCapture?.(event.pointerId);
}

function moveMeshPreviewPan(event){
  if(!meshPanPointer) return;
  const area=event.currentTarget;
  area.scrollLeft=meshPanPointer.scrollLeft-(event.clientX-meshPanPointer.startX);
  area.scrollTop=meshPanPointer.scrollTop-(event.clientY-meshPanPointer.startY);
}

function endMeshPreviewPan(event){
  if(!meshPanPointer) return;
  const area=event.currentTarget;
  try{area.releasePointerCapture?.(meshPanPointer.pointerId);}catch(error){}
  meshPanPointer=null;
  area.classList.remove('is-panning');
}

function removeMeshControlPoint(){
  if(!meshEditorState) return;
  const index=meshEditorState.activePoint;
  if(index<=0 || index>=meshEditorState.controlPoints.length-1) return;
  meshEditorState.controlPoints.splice(index,1);
  meshEditorState.activePoint=Math.max(0,index-1);
  syncMeshEditorControls();
}

function saveReferencePose(){
  if(!meshEditorState) return;
  pushHistory();
  project.meta.referencePose=clone(currentFrameData());
  project.meta.referencePoseName=`${project.meta.name || 'motion'} / フレーム${currentFrame+1}`;
  saveProject();
  syncMeshEditorControls();
}

function applyReferencePose(){
  if(!project.meta.referencePose) return;
  pushHistory();
  const target=currentFrameData();
  project.layerOrder.forEach(id=>{
    if(project.meta.referencePose[id]) target[id]=clone(project.meta.referencePose[id]);
  });
  render();
  syncMeshEditorControls();
}

function downloadMeshReferenceGuide(){
  if(!meshEditorState) return;
  const referenceFrame=clone(project.meta.referencePose || project.defaultFrame);
  const world=getWorldState(referenceFrame);
  const binding={
    boneChain:[...meshEditorState.boneChain],
    targetWidthScale:meshEditorState.targetWidthScale,
    segmentsPerBone:meshEditorState.segmentsPerBone
  };
  const controls=getMeshTargetPoints(binding,world);
  const path=sampleMeshPath(controls,Math.max(8,meshEditorState.segmentsPerBone));
  const edges=stripEdges(path);
  const all=edges.flatMap(edge=>[edge.left,edge.right]);
  const minX=Math.min(...all.map(point=>point.x)),maxX=Math.max(...all.map(point=>point.x));
  const minY=Math.min(...all.map(point=>point.y)),maxY=Math.max(...all.map(point=>point.y));
  const canvas=document.createElement('canvas'); canvas.width=768; canvas.height=768;
  const context=canvas.getContext('2d');
  context.fillStyle='#071016'; context.fillRect(0,0,canvas.width,canvas.height);
  const padding=96,scale=Math.min((canvas.width-padding*2)/Math.max(1,maxX-minX),(canvas.height-padding*2)/Math.max(1,maxY-minY));
  const offsetX=(canvas.width-(maxX-minX)*scale)/2-minX*scale;
  const offsetY=(canvas.height-(maxY-minY)*scale)/2-minY*scale;
  const map=point=>({x:point.x*scale+offsetX,y:point.y*scale+offsetY});
  context.beginPath(); edges.forEach((edge,index)=>{const point=map(edge.left);index?context.lineTo(point.x,point.y):context.moveTo(point.x,point.y);});
  [...edges].reverse().forEach(edge=>{const point=map(edge.right);context.lineTo(point.x,point.y);}); context.closePath();
  context.fillStyle='rgba(101,255,208,.12)'; context.fill(); context.strokeStyle='#65ffd0'; context.lineWidth=3; context.stroke();
  context.beginPath(); path.forEach((point,index)=>{const mapped=map(point);index?context.lineTo(mapped.x,mapped.y):context.moveTo(mapped.x,mapped.y);});
  context.strokeStyle='#e9fff8'; context.lineWidth=2; context.setLineDash([8,6]); context.stroke(); context.setLineDash([]);
  controls.forEach((point,index)=>{
    const mapped=map(point); context.beginPath(); context.arc(mapped.x,mapped.y,7,0,Math.PI*2); context.fillStyle='#ffd36a'; context.fill();
    context.fillStyle='#e9fff8'; context.font='bold 18px sans-serif'; context.fillText(index===controls.length-1?'先端':project.layers[binding.boneChain[index]]?.name || `点${index}`,mapped.x+12,mapped.y-10);
  });
  context.fillStyle='#e9fff8'; context.font='bold 24px sans-serif'; context.fillText(`${project.meta.referencePoseName || '基準姿勢'} / ${chainLabel(binding.boneChain)}`,28,38);
  context.font='16px sans-serif'; context.fillStyle='#9fe8ff'; context.fillText('この輪郭と関節点に合わせて、交換用パーツを透過画像として描きます。',28,66);
  const link=document.createElement('a'); link.href=canvas.toDataURL('image/png'); link.download=`${meshEditorState.partSlot || 'mesh'}_reference_guide.png`; link.click();
}

function getPartTemplateDefinitions(){
  const idByKey=key=>project.layerOrder.find(id=>project.layers[id]?.key===key);
  const make=(slot,label,keys,color)=>({slot,label,color,boneChain:keys.map(idByKey).filter(Boolean)});
  return [
    make('head','頭',['head'],'#d7e7f4'),
    make('torso','胴体',['waist','abdomen','chest','neck'],'#e4b96f'),
    make('right_arm','右腕',['armRU','armRL','handR'],'#ff7f70'),
    make('left_arm','左腕',['armLU','armLL','handL'],'#62aef5'),
    make('right_leg','右脚',['legRU','legRL','footR','toeR'],'#8a68ed'),
    make('left_leg','左脚',['legLU','legLL','footL','toeL'],'#32d0a0')
  ].map(definition=>{
    // 簡易リグでは中間ボーンがないため、存在する端点だけでテンプレートを作る。
    if(definition.slot==='torso' && !definition.boneChain.length) definition.boneChain=[idByKey('chest')].filter(Boolean);
    return definition;
  }).filter(definition=>definition.boneChain.length);
}

function partTemplateDimensions(){
  return project.meta.rigType==='pixel_simple'?{width:128,height:256,pixel:true}:{width:512,height:1024,pixel:false};
}

function createPartTemplateCanvas(definition,{guide=false}={}){
  const dimensions=partTemplateDimensions();
  const square=definition.boneChain.length===1;
  const canvas=document.createElement('canvas');
  canvas.width=square?dimensions.width:dimensions.width;
  canvas.height=square?dimensions.width:dimensions.height;
  const context=canvas.getContext('2d');
  context.imageSmoothingEnabled=!dimensions.pixel;
  const width=canvas.width,height=canvas.height;
  if(guide){
    context.fillStyle=dimensions.pixel?'#111820':'#071016'; context.fillRect(0,0,width,height);
    const grid=dimensions.pixel?8:32;
    context.strokeStyle=dimensions.pixel?'rgba(255,255,255,.08)':'rgba(101,255,208,.08)'; context.lineWidth=1;
    for(let x=0;x<=width;x+=grid){context.beginPath();context.moveTo(x,0);context.lineTo(x,height);context.stroke();}
    for(let y=0;y<=height;y+=grid){context.beginPath();context.moveTo(0,y);context.lineTo(width,y);context.stroke();}
  }
  if(square){
    const padding=width*.12;
    context.beginPath(); context.ellipse(width/2,height/2,(width-padding*2)/2,(height-padding*2)/2,0,0,Math.PI*2);
    context.fillStyle=definition.color; context.fill(); context.strokeStyle=guide?'#65ffd0':'rgba(255,255,255,.55)'; context.lineWidth=dimensions.pixel?3:8; context.stroke();
    if(guide){context.fillStyle='#ffd36a';context.beginPath();context.arc(width/2,height*.88,dimensions.pixel?4:12,0,Math.PI*2);context.fill();}
    return canvas;
  }
  const points=defaultMeshControlPointsForChain(definition.boneChain);
  const outlineWidths=points.map((point,index)=>{
    const progress=index/(points.length-1);
    if(definition.slot==='torso') return .34+Math.sin(progress*Math.PI)*.12;
    if(definition.slot.includes('leg')) return .30-progress*.05+(index===points.length-1 ? .04 : 0);
    return .25-progress*.06+(index===points.length-1 ? .05 : 0);
  });
  const left=[],right=[];
  points.forEach((point,index)=>{
    const half=outlineWidths[index]*width/2;
    left.push({x:width/2-half,y:point.v*height}); right.unshift({x:width/2+half,y:point.v*height});
  });
  context.beginPath(); [...left,...right].forEach((point,index)=>index?context.lineTo(point.x,point.y):context.moveTo(point.x,point.y)); context.closePath();
  context.fillStyle=definition.color; context.fill(); context.strokeStyle=guide?'#65ffd0':'rgba(255,255,255,.5)'; context.lineWidth=dimensions.pixel?3:8; context.stroke();
  points.forEach((point,index)=>{
    const y=point.v*height;
    context.beginPath();context.moveTo(width*.34,y);context.lineTo(width*.66,y);
    context.strokeStyle=guide?'rgba(255,211,106,.95)':'rgba(10,18,24,.32)';context.lineWidth=dimensions.pixel?2:5;context.stroke();
    if(guide){context.fillStyle='#ffd36a';context.beginPath();context.arc(width/2,y,dimensions.pixel?4:12,0,Math.PI*2);context.fill();}
  });
  if(guide){
    context.beginPath();context.moveTo(width/2,points[0].v*height);context.lineTo(width/2,points.at(-1).v*height);
    context.strokeStyle='#e9fff8';context.lineWidth=dimensions.pixel?2:4;context.setLineDash(dimensions.pixel?[4,4]:[12,10]);context.stroke();context.setLineDash([]);
  }
  return canvas;
}

function buildPartTemplateKit(){
  const rig=project.meta.rigType || 'standard_2d';
  return getPartTemplateDefinitions().flatMap(definition=>[
    {name:`${rig}_${definition.slot}_sample.png`,slot:definition.slot,type:'sample',data:createPartTemplateCanvas(definition).toDataURL('image/png')},
    {name:`${rig}_${definition.slot}_guide.png`,slot:definition.slot,type:'guide',data:createPartTemplateCanvas(definition,{guide:true}).toDataURL('image/png')}
  ]);
}

function buildPartTemplateManifest(){
  const dimensions=partTemplateDimensions();
  return {
    formatVersion:1,
    rigType:project.meta.rigType || 'standard_2d',
    referencePose:project.meta.referencePoseName || '初期姿勢',
    rules:{keepCanvasSize:true,transparentBackground:true,note:'guide PNGの中心線と関節点に合わせて描画し、完成画像ではガイド線を消します。'},
    parts:getPartTemplateDefinitions().map(definition=>{
      const square=definition.boneChain.length===1;
      return {
        slot:definition.slot,
        label:definition.label,
        canvas:{width:dimensions.width,height:square?dimensions.width:dimensions.height},
        bones:definition.boneChain.map(id=>({key:project.layers[id]?.key,name:project.layers[id]?.name})),
        controlPoints:square?[{u:.5,v:.88,t:0,type:'anchor'}]:defaultMeshControlPointsForChain(definition.boneChain).map(point=>({u:point.u,v:point.v,t:point.t,leftWidth:point.leftWidth,rightWidth:point.rightWidth}))
      };
    })
  };
}

function downloadPartTemplateKit(){
  const kit=buildPartTemplateKit();
  kit.forEach((entry,index)=>{
    setTimeout(()=>{const link=document.createElement('a');link.href=entry.data;link.download=entry.name;link.click();},index*80);
  });
  setTimeout(()=>{
    const manifest=JSON.stringify(buildPartTemplateManifest(),null,2);
    const link=document.createElement('a'); link.href=`data:application/json;charset=utf-8,${encodeURIComponent(manifest)}`;
    link.download=`${project.meta.rigType || 'standard_2d'}_part_manifest.json`; link.click();
  },kit.length*80);
}

function currentPartReferenceInfo(){
  const pixel=project.meta.rigType==='pixel_simple';
  const pixelSide=pixel && project.meta.poseType==='side';
  return pixel?{
    label:pixelSide?'ドット2D・横向き15ボーン':'ドット2D・正面15ボーン',
    url:'./part_templates/reference/pixel_simple_modular_reference.png',
    filename:'pixel_simple_modular_reference.png',
    note:pixelSide?'交換画像は6パーツです。横向きの素材は、横向き基準姿勢から出力するガイドPNGへ合わせて作成します。内部は各3ボーンの連続メッシュです。':'交換画像は頭・胴体・左右腕・左右脚の6パーツです。内部は体＋腰、上腕＋腕＋手、太腿＋すね＋足首に分け、1画像のまま連続メッシュで曲げます。'
  }:{
    label:project.meta.poseType==='side'?'通常2D・横向き18ボーン':'通常2D・正面16ボーン',
    url:'./part_templates/reference/standard_2d_modular_reference.png',
    filename:'standard_2d_modular_reference.png',
    note:project.meta.poseType==='side'?'上腕・前腕・手、太腿・すね・足・つま先まで細かく作れます。連続メッシュ用画像では、右側の分解例を縦につないだ1枚として描けます。':'上腕・前腕・手、太腿・すね・足まで細かく作れます。連続メッシュ用画像では、右側の分解例を縦につないだ1枚として描けます。'
  };
}

function currentPartExampleInfo(){
  const rig=project.meta.rigType==='pixel_simple'?'pixel_simple':'standard_2d';
  const slot=document.getElementById('partExampleSelect')?.value || 'right_arm';
  const filename=`${rig}_${slot}_example.png`;
  return {url:`./part_templates/examples/${rig}/${filename}`,filename};
}

function updatePartExamplePreview(){
  const info=currentPartExampleInfo();
  const image=document.getElementById('partExampleImage');
  if(image) image.src=info.url;
}

function openPartReference(){
  const info=currentPartReferenceInfo();
  document.getElementById('partReferenceRigLabel').textContent=info.label;
  document.getElementById('partReferenceTypeNote').textContent=info.note;
  partReferenceImageEl.src=info.url;
  partReferenceDialogEl.classList.toggle('pixel-reference',project.meta.rigType==='pixel_simple');
  saveDialogEl?.close();
  updatePartExamplePreview();
  if(typeof partReferenceDialogEl?.showModal==='function') partReferenceDialogEl.showModal();
}

function downloadPartReferenceImage(){
  const info=currentPartReferenceInfo();
  const link=document.createElement('a');link.href=info.url;link.download=info.filename;link.click();
}

function downloadPartExampleImage(){
  const info=currentPartExampleInfo();
  const link=document.createElement('a');link.href=info.url;link.download=info.filename;link.click();
}
function renderImageSlotSettings(){
  ensureImageSlots();
  IMAGE_SLOT_DEFS.forEach(def=>{
    const slot=project.imageSlots[def.id];
    const select=document.getElementById(def.selectId);
    const row=document.querySelector(`.image-slot-row[data-slot="${def.id}"]`);
    if(!select || !row) return;
    select.innerHTML='';
    if(!slot.sourceIds.length){
      const option=document.createElement('option'); option.value=''; option.textContent='未設定'; select.appendChild(option);
    }else{
      slot.sourceIds.forEach(sourceId=>{
        const source=project.imageSources[sourceId];
        const option=document.createElement('option'); option.value=sourceId; option.textContent=source?.name || sourceId; select.appendChild(option);
      });
    }
    select.value=slot.activeSourceId || '';
    select.disabled=!slot.sourceIds.length;
    select.onchange=async event=>{
      pushHistory();
      await activateImageSlot(def.id,event.target.value);
    };
    row.classList.toggle('has-images',slot.sourceIds.length>0);
    const status=row.querySelector('.image-slot-status');
    const active=slot.activeSourceId ? project.imageSources[slot.activeSourceId] : null;
    if(status){ status.textContent=slot.sourceIds.length ? `${slot.sourceIds.length}枚登録 / 表示中: ${active?.name || '未設定'}` : '未設定'; status.title=status.textContent; }
    const remove=row.querySelector('.image-slot-remove');
    if(remove) remove.disabled=!slot.activeSourceId;
  });
}

function currentBackground(){
  ensureProjectSettings();
  return project.backgrounds.find(background=>background.id===selectedBackgroundId) || project.backgrounds[0] || null;
}

function renderBackgroundImage(){
  if(!backgroundImageLayerEl) return;
  const activeIds=new Set(project.backgrounds.map(background=>background.id));
  backgroundImageLayerEl.querySelectorAll('img[data-background-id]').forEach(image=>{
    if(!activeIds.has(image.dataset.backgroundId)) image.remove();
  });
  let anyImage=false;
  for(const background of project.backgrounds){
    const source=background.sourceId ? project.imageSources?.[background.sourceId] : null;
    const hasImage=!!source?.data;
    let image=backgroundImageLayerEl.querySelector(`img[data-background-id="${CSS.escape(background.id)}"]`);
    if(!image){
      image=document.createElement('img');
      image.dataset.backgroundId=background.id;
      image.alt=background.name || '背景画像';
      backgroundImageLayerEl.appendChild(image);
    }
    image.style.display=hasImage?'block':'none';
    image.classList.toggle('selected-background-image',backgroundSelected && background.id===selectedBackgroundId);
    if(hasImage && image.src!==source.data) image.src=source.data;
    if(!hasImage) image.removeAttribute('src');
    image.style.left=`calc(50% + ${Number(background.x)||0}px)`;
    image.style.top=`calc(50% + ${Number(background.y)||0}px)`;
    const scale=Math.max(.1,Math.min(4,Number(background.scale)||1));
    image.style.transform=`translate(-50%,-50%) scale(${scale*(background.flipX?-1:1)},${scale*(background.flipY?-1:1)})`;
    image.style.opacity=String(Math.max(0,Math.min(1,Number(background.opacity))));
    image.style.zIndex=String(getBackgroundLayerNo(background.id));
    anyImage ||= hasImage;
  }
  backgroundImageLayerEl.style.display=anyImage?'block':'none';
  const background=currentBackground();
  const source=background?.sourceId ? project.imageSources?.[background.sourceId] : null;
  const hasImage=!!source?.data;
  const scale=Math.max(.1,Math.min(4,Number(background?.scale)||1));
  if(backgroundImageStatusEl){
    backgroundImageStatusEl.textContent=`${background?.name || '背景'} / ${source?.name || '画像未設定'}`;
    backgroundImageStatusEl.title=source?.name || '背景画像はまだ設定されていません';
  }
  const removeButton=document.getElementById('backgroundImageRemoveBtn');
  if(removeButton) removeButton.disabled=!hasImage;
  const deleteButton=document.getElementById('backgroundLayerDeleteBtn');
  if(deleteButton) deleteButton.disabled=project.backgrounds.length<=1;
  if(backgroundAdjustValueEl && background) backgroundAdjustValueEl.textContent=`${background.name} / X ${Math.round(Number(background.x)||0)} / Y ${Math.round(Number(background.y)||0)} / ${Math.round(scale*100)}%`;
}

function syncDisplaySettings(){
  ensureProjectSettings();
  const d=project.meta.display, g=project.meta.ground;
  stageEl.classList.toggle('hide-labels', !d.labels);
  stageEl.classList.toggle('hide-anchors', !d.anchors);
  stageEl.classList.toggle('hide-lines', !d.lines);
  stageEl.classList.toggle('hide-bones', !d.bones);
  stageEl.classList.toggle('hide-images', !d.images);
  stageEl.classList.toggle('hide-grid', !d.grid);
  stageEl.classList.toggle('hide-center-guides', !d.centerGuides);
  if(groundLineEl){
    const groundY=Number.isFinite(Number(g.y)) ? Number(g.y) : 880;
    // 地面線の表示と当たり判定は別設定。判定OFFでも位置確認用の線は表示する。
    groundLineEl.classList.toggle('visible', !!d.groundVisible);
    groundLineEl.style.top = `${groundY}px`;
    const label=groundLineEl.querySelector('span');
    if(label) label.textContent=`GROUND Y ${groundY}`;
  }
  const map=[['showLabels','labels'],['showAnchors','anchors'],['showLines','lines'],['showBones','bones'],['showImages','images'],['showOnionSkin','onionSkin'],['showCenterGuides','centerGuides']];
  map.forEach(([id,k])=>{ const el=document.getElementById(id); if(el) el.checked=!!d[k]; });
  const set=(id,val)=>{const el=document.getElementById(id); if(el){ if(el.type==='checkbox') el.checked=!!val; else el.value=val; }};
  set('settingLabels',d.labels); set('settingAnchors',d.anchors); set('settingLines',d.lines); set('settingBones',d.bones); set('settingImages',d.images); set('settingGrid',d.grid); set('settingBoneColors',d.boneColors); set('settingInternalIds',d.internalIds); set('settingBoneColorIntensity',d.boneColorIntensity);
  const boneColorIntensityValue=document.getElementById('settingBoneColorIntensityValue');
  if(boneColorIntensityValue) boneColorIntensityValue.textContent=`${Math.round(d.boneColorIntensity)}%`;
  set('settingGroundEnabled',g.enabled); set('settingGroundVisible',d.groundVisible); set('settingGroundY',g.y); set('settingAutoFoot',g.autoFoot); set('settingAirFootAngle',g.airAngle);
  const background=currentBackground() || {};
  set('backgroundXInput',background.x); set('backgroundYInput',background.y);
  set('backgroundLayerInput',getBackgroundLayerNo(background.id));
  const backgroundLayerInput=document.getElementById('backgroundLayerInput');
  if(backgroundLayerInput) backgroundLayerInput.max=String(project.layerOrder.length+project.backgrounds.length);
  set('backgroundScaleInput',Math.round((Number(background.scale)||1)*100));
  set('backgroundOpacityInput',Math.round(Math.max(0,Math.min(1,Number(background.opacity)))*100));
  set('backgroundFlipXInput',background.flipX); set('backgroundFlipYInput',background.flipY);
  const imageDisplayPercent = Math.round((Number(project.meta.imageDisplayScale) || 1) * 100);
  set('settingImageDisplayScale',imageDisplayPercent); set('settingImageDisplayScaleNumber',imageDisplayPercent);
  if(baseImageSourceStatusEl){
    const source = project.baseImageSourceId ? project.imageSources?.[project.baseImageSourceId] : null;
    baseImageSourceStatusEl.textContent = source?.name || '未設定';
    baseImageSourceStatusEl.title = source?.name || '基準画像はまだ設定されていません';
  }
  renderImageSlotSettings();
  renderBackgroundImage();
}

function currentFrameData(){ return activeFrames()[currentFrame]; }
function currentLayer(){ return project.layers[selectedLayer]; }
function currentPose(){ return currentFrameData()[selectedLayer]; }
function isHandReplacementLayer(layer){
  return !!layer && (layer.key==='handR' || layer.key==='handL' || layer.shape==='hand');
}
function uniqueBoneMorphName(layer,baseName){
  const base=cleanBoneName(String(baseName || '').replace(/\.[^.]+$/,'')) || '手画像';
  let name=base,index=2;
  while(layer?.morphs?.[name]) name=`${base}${index++}`;
  return name;
}
function readImageFileData(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=event=>resolve(event.target.result);
    reader.onerror=()=>reject(reader.error || new Error('画像を読み込めませんでした。'));
    reader.readAsDataURL(file);
  });
}
function currentBoneMorphEntry(layer=currentLayer(),pose=currentPose()){
  const id=String(pose?.morphId || '');
  return id && layer?.morphs?.[id] ? layer.morphs[id] : null;
}
function activeBoneMorph(layer=currentLayer(),pose=currentPose()){
  const id=String(pose?.morphId || '');
  const morph=currentBoneMorphEntry(layer,pose);
  return morph ? {id,...morph} : null;
}
function visualLayerForPose(layer,pose){
  const morph=currentBoneMorphEntry(layer,pose);
  return morph ? {...layer,...morph} : layer;
}
function syncBoneMorphOptions(){
  const select=document.getElementById('boneMorphSelect');
  const imageSelect=document.getElementById('boneMorphImageSelect');
  const imageRow=document.getElementById('boneMorphImageRow');
  const layer=currentLayer(); const pose=currentPose();
  if(!select || !layer || !pose) return;
  const isHand=isHandReplacementLayer(layer);
  const selected=String(pose.morphId || '');
  const morph=selected ? layer.morphs?.[selected] : null;
  select.innerHTML=`<option value="">${isHand?'通常の手':'通常（モーフなし）'}</option>`+Object.keys(layer.morphs || {}).map(id=>`<option value="${id}">${id}</option>`).join('');
  select.value=selected;
  const label=document.getElementById('boneMorphLabel');
  const addButton=document.getElementById('addBoneMorphBtn');
  const deleteButton=document.getElementById('deleteBoneMorphBtn');
  const imageLabel=document.getElementById('boneMorphImageLabel');
  const note=document.getElementById('handSwapNote');
  document.getElementById('boneMorphField')?.classList.toggle('hand-mode',isHand);
  if(label) label.textContent=isHand?'このコマの手':'このコマのモーフ';
  if(addButton){ addButton.textContent=isHand?'＋手画像':'＋作成'; addButton.title=isHand?'新しい手画像を直接追加':''; }
  if(deleteButton){ deleteButton.textContent='削除'; deleteButton.title=isHand?'選択中の手画像を削除':''; deleteButton.disabled=!selected; }
  if(imageLabel) imageLabel.textContent=isHand?'登録画像':'モーフ画像';
  if(note) note.hidden=!isHand;
  if(imageRow) imageRow.hidden=!selected;
  if(imageSelect){
    const handSourceIds=isHand ? new Set(Object.values(layer.morphs || {}).map(item=>item?.imageSourceId).filter(Boolean)) : null;
    const sources=Object.values(project.imageSources || {}).filter(source=>!handSourceIds || handSourceIds.has(source.id) || source.id===morph?.imageSourceId);
    imageSelect.innerHTML=sources.map(source=>`<option value="${source.id}">${source.name}</option>`).join('');
    imageSelect.value=morph?.imageSourceId || '';
  }
}
function getEditMode(){ return project.meta.editMode || 'rotate'; }
function getWholeMoveAxis(){
  return ['free','horizontal','vertical'].includes(project.meta.wholeMoveAxis) ? project.meta.wholeMoveAxis : 'free';
}

function applyStageView(){
  if(!characterEl) return;
  characterEl.style.left=`calc(50% + ${stageView.x}px)`;
  characterEl.style.top=`calc(50% + ${stageView.y}px)`;
  characterEl.style.transform=`translate(-50%,-50%) scale(${stageView.zoom})`;
  characterEl.style.setProperty('--stage-zoom',String(stageView.zoom));
}

function characterPointFromClient(clientX,clientY){
  const rect=characterEl.getBoundingClientRect();
  const zoom=Math.max(.01,stageView.zoom || 1);
  return {x:(clientX-rect.left)/zoom,y:(clientY-rect.top)/zoom};
}

function characterDeltaFromClient(dx,dy){
  const zoom=Math.max(.01,stageView.zoom || 1);
  return {x:dx/zoom,y:dy/zoom};
}

function ensureFrameCompleteness(){
  for(const frame of allProjectFrames()){
    for(const [index,id] of project.layerOrder.entries()){
      if(!frame[id]) frame[id] = {x:0,y:0,w:100,h:100,r:0,z:index+1};
    }
  }
}

function getWorldState(frame){
  const cache = {};
  function calc(id){
    if(cache[id]) return cache[id];
    const layer = project.layers[id];
    const pose = frame[id];
    // 参照姿勢・モーションコマは全ボーンを持つ必要がない。
    // 後から追加されたボーンがない部分姿勢でも、存在するボーンだけを描画・計算する。
    if(!layer || !pose) return null;
    let anchorX, anchorY, rotation;
    const parentPose = layer.parent ? frame[layer.parent] : null;
    const parentLayer = layer.parent ? project.layers[layer.parent] : null;
    const parent = parentPose && parentLayer ? calc(layer.parent) : null;
    if(!parent){
      anchorX = pose.x; anchorY = pose.y; rotation = pose.r;
    } else {
      const dx = layer.attachX * parentPose.w - parentLayer.ox * parentPose.w;
      const dy = layer.attachY * parentPose.h - parentLayer.oy * parentPose.h;
      const rel = rotate(dx, dy, parent.rotation);
      const offs = rotate(pose.x, pose.y, parent.rotation);
      anchorX = parent.anchorX + rel.x + offs.x;
      anchorY = parent.anchorY + rel.y + offs.y;
      rotation = parent.rotation + pose.r;
    }
    ensureProjectSettings();
    if(project.meta.ground.enabled && project.meta.ground.autoFoot && isFootLayer(layer)){
      rotation = solveAutoFootRotation(layer, pose, anchorY);
    }
    const left = anchorX - layer.ox * pose.w;
    const top = anchorY - layer.oy * pose.h;
    cache[id] = {id, layer, pose, anchorX, anchorY, rotation, left, top};
    return cache[id];
  }
  project.layerOrder.forEach(calc);
  return cache;
}

function getActiveRigBounds(world=getWorldState(currentFrameData())){
  const points=[];
  for(const id of project.layerOrder){
    if(!isLayerActiveForCurrentAnimation(id)) continue;
    const state=world[id];
    if(!state) continue;
    const {pose,layer,anchorX,anchorY,rotation}=state;
    const left=-layer.ox*pose.w,right=(1-layer.ox)*pose.w;
    const top=-layer.oy*pose.h,bottom=(1-layer.oy)*pose.h;
    for(const [x,y] of [[left,top],[right,top],[left,bottom],[right,bottom]]){
      const point=rotate(x,y,rotation);
      points.push({x:anchorX+point.x,y:anchorY+point.y});
    }
  }
  if(!points.length) return null;
  const xs=points.map(point=>point.x),ys=points.map(point=>point.y);
  const left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);
  return {left,top,right,bottom,width:Math.max(1,right-left),height:Math.max(1,bottom-top)};
}

function renderWholeScaleOverlay(world){
  if(!wholeScaleOverlayEl || !wholeScaleBoxEl) return;
  const bounds=getEditMode()==='scale' ? getActiveRigBounds(world) : null;
  wholeScaleOverlayEl.classList.toggle('active',!!bounds);
  if(!bounds) return;
  wholeScaleBoxEl.style.left=`${bounds.left}px`;
  wholeScaleBoxEl.style.top=`${bounds.top}px`;
  wholeScaleBoxEl.style.width=`${bounds.width}px`;
  wholeScaleBoxEl.style.height=`${bounds.height}px`;
  if(!wholeScaleDragState){
    const label=wholeScaleBoxEl.querySelector('.whole-scale-label');
    if(label) label.textContent='全体拡縮';
  }
}

function roundScaleValue(value){ return Math.round(value*1000)/1000; }

function startWholeScaleDrag(event){
  if(event.button!==0 || getEditMode()!=='scale') return;
  event.preventDefault();
  event.stopPropagation();
  const bounds=getActiveRigBounds();
  if(!bounds) return;
  const corner=event.currentTarget.dataset.corner;
  const moving={x:corner.includes('l')?bounds.left:bounds.right,y:corner.includes('t')?bounds.top:bounds.bottom};
  const fixed={x:corner.includes('l')?bounds.right:bounds.left,y:corner.includes('t')?bounds.bottom:bounds.top};
  const startVector={x:moving.x-fixed.x,y:moving.y-fixed.y};
  const ids=project.layerOrder.filter(id=>isLayerActiveForCurrentAnimation(id) && currentFrameData()[id]);
  const poses=Object.fromEntries(ids.map(id=>[id,clone(currentFrameData()[id])]));
  const minFactor=Math.max(.05,...ids.flatMap(id=>{
    const pose=poses[id];
    return [12/Math.max(12,Number(pose.w)||12),12/Math.max(12,Number(pose.h)||12)];
  }));
  wholeScaleDragState={corner,fixed,startVector,denominator:startVector.x**2+startVector.y**2,ids,poses,minFactor,startX:event.clientX,startY:event.clientY,activated:false,factor:1};
  window.addEventListener('mousemove',moveWholeScaleDrag);
  window.addEventListener('mouseup',endWholeScaleDrag);
}

function moveWholeScaleDrag(event){
  const state=wholeScaleDragState;
  if(!state) return;
  if(!state.activated){
    if(Math.hypot(event.clientX-state.startX,event.clientY-state.startY)<3) return;
    pushHistory();
    state.activated=true;
  }
  const pointer=characterPointFromClient(event.clientX,event.clientY);
  const currentVector={x:pointer.x-state.fixed.x,y:pointer.y-state.fixed.y};
  const projected=(currentVector.x*state.startVector.x+currentVector.y*state.startVector.y)/Math.max(1,state.denominator);
  const factor=Math.max(state.minFactor,Math.min(8,projected));
  state.factor=factor;
  const frame=currentFrameData();
  for(const id of state.ids){
    const original=state.poses[id],pose=frame[id],layer=project.layers[id];
    if(!original || !pose || !layer) continue;
    pose.w=roundScaleValue(original.w*factor);
    pose.h=roundScaleValue(original.h*factor);
    if(layer.parent){
      pose.x=roundScaleValue(original.x*factor);
      pose.y=roundScaleValue(original.y*factor);
    }else{
      pose.x=roundScaleValue(state.fixed.x+(original.x-state.fixed.x)*factor);
      pose.y=roundScaleValue(state.fixed.y+(original.y-state.fixed.y)*factor);
    }
  }
  render();
  const label=wholeScaleBoxEl?.querySelector('.whole-scale-label');
  if(label) label.textContent=`全体 ${Math.round(factor*100)}%`;
}

function endWholeScaleDrag(){
  if(!wholeScaleDragState) return;
  const changed=wholeScaleDragState.activated;
  wholeScaleDragState=null;
  window.removeEventListener('mousemove',moveWholeScaleDrag);
  window.removeEventListener('mouseup',endWholeScaleDrag);
  if(changed) render();
}

function initWholeScaleHandles(){
  wholeScaleBoxEl?.querySelectorAll('.whole-scale-handle').forEach(handle=>{
    if(handle.dataset.ready==='1') return;
    handle.dataset.ready='1';
    handle.addEventListener('mousedown',startWholeScaleDrag);
  });
}

function createLayerEl(id){
  const el = document.createElement('div');
  el.className = 'layer interactive';
  el.dataset.id = id;
  const visual = document.createElement('div');
  visual.className = 'layer-visual';
  const placeholder = document.createElement('div');
  placeholder.className = 'shape';
  const imageTransform = document.createElement('div');
  imageTransform.className = 'image-transform';
  const img = document.createElement('img');
  imageTransform.appendChild(img);
  visual.appendChild(placeholder);
  visual.appendChild(imageTransform);
  const label = document.createElement('div');
  label.className = 'layer-label';
  const tail = document.createElement('div');
  tail.className = 'bone-tail';
  el.appendChild(visual);
  el.appendChild(tail);
  el.appendChild(label);
  el.addEventListener('mousedown', startDrag);
  el.addEventListener('click', event => {
    if(!isPointerInsideEditorBone(id,event.clientX,event.clientY)) return;
    selectedLayer = id;
    render();
  });
  return el;
}

function createBoneOverlayEl(id){
  const el=document.createElement('div');
  el.className='bone-overlay-item';
  el.dataset.id=id;
  const shape=document.createElement('div');
  shape.className='bone-overlay-shape';
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('aria-hidden','true');
  const polygon=document.createElementNS('http://www.w3.org/2000/svg','polygon');
  svg.appendChild(polygon);
  shape.appendChild(svg);
  const head=document.createElement('div');
  head.className='bone-overlay-head';
  const tail=document.createElement('div');
  tail.className='bone-overlay-tail';
  const label=document.createElement('div');
  label.className='bone-overlay-label';
  el.append(shape,head,tail,label);
  const selectBone=event=>{
    const isExactBonePolygon=event.currentTarget?.tagName?.toLowerCase()==='polygon';
    if(project.meta.display.bones && !isExactBonePolygon && !isPointerInsideEditorBone(id,event.clientX,event.clientY)) return;
    event.stopPropagation();
    selectedLayer=id;
    render();
  };
  // 通常時はSVG多角形だけ、ボーン非表示時は透明な本体領域からも選択できる。
  polygon.addEventListener('mousedown',startDrag);
  polygon.addEventListener('click',selectBone);
  shape.addEventListener('mousedown',startDrag);
  shape.addEventListener('click',selectBone);
  return el;
}

function isSelectedBoneBranch(id){
  if(!selectedLayer) return false;
  let currentId=id;
  const visited=new Set();
  while(currentId && !visited.has(currentId)){
    if(currentId===selectedLayer) return true;
    visited.add(currentId);
    currentId=project.layers?.[currentId]?.parent || null;
  }
  return false;
}

function renderBoneOverlay(world){
  if(!characterEl) return;
  if(!boneOverlayEl){
    boneOverlayEl=document.createElement('div');
    boneOverlayEl.className='bone-overlay';
  }
  for(const id of project.layerOrder){
    if(!boneOverlayEls[id]){
      boneOverlayEls[id]=createBoneOverlayEl(id);
      boneOverlayEl.appendChild(boneOverlayEls[id]);
    }
  }
  for(const id in boneOverlayEls){
    if(project.layers[id]) continue;
    boneOverlayEls[id].remove();
    delete boneOverlayEls[id];
  }
  for(const id of project.layerOrder){
    const state=world[id];
    const el=boneOverlayEls[id];
    const active=!!state && isLayerActiveForCurrentAnimation(id);
    el.style.display=active?'':'none';
    if(!active) continue;
    const rect=boneEditorDisplayRect(state.layer,state.pose);
    const shape=el.querySelector('.bone-overlay-shape');
    const shapeSvg=shape.querySelector('svg');
    const shapePolygon=shape.querySelector('polygon');
    const head=el.querySelector('.bone-overlay-head');
    const tail=el.querySelector('.bone-overlay-tail');
    const label=el.querySelector('.bone-overlay-label');
    el.style.left=`${state.left}px`;
    el.style.top=`${state.top}px`;
    el.style.width=`${state.pose.w}px`;
    el.style.height=`${state.pose.h}px`;
    el.style.transform=`rotate(${state.rotation}deg)`;
    el.style.transformOrigin=`${state.layer.ox*100}% ${state.layer.oy*100}%`;
    shape.style.left=`${rect.left}px`;
    shape.style.top=`${rect.top}px`;
    shape.style.width=`${rect.w}px`;
    shape.style.height=`${rect.h}px`;
    shape.style.transformOrigin=`${state.layer.ox*state.pose.w-rect.left}px ${state.layer.oy*state.pose.h-rect.top}px`;
    shape.style.transform=state.layer.shapeFlipX?'scaleX(-1)':'';
    const useBoneColors=!!project.meta.display.boneColors;
    const boneColorOpacity=Math.max(0,Math.min(100,Number(project.meta.display.boneColorIntensity ?? 100)))/100;
    const color=state.layer.color || defaultBoneColor(state.layer.key || state.layer.name || 'bone');
    const boneColor=useBoneColors ? color : 'rgb(147,224,255)';
    shapeSvg.setAttribute('viewBox',`0 0 ${rect.w} ${rect.h}`);
    shapePolygon.setAttribute('points',`${rect.w/2},0 ${rect.w},${rect.h*.3} ${rect.w/2},${rect.h} 0,${rect.h*.3}`);
    shapePolygon.setAttribute('fill',boneColor);
    shapePolygon.setAttribute('fill-opacity','.14');
    shapePolygon.setAttribute('stroke',boneColor);
    shapePolygon.setAttribute('stroke-width',id===selectedLayer ? '3' : '1');
    shape.style.opacity=String(useBoneColors ? boneColorOpacity : 1);
    head.style.left=`${rect.left+(state.layer.headX ?? state.layer.ox)*rect.w}px`;
    head.style.top=`${rect.top+(state.layer.headY ?? state.layer.oy)*rect.h}px`;
    tail.style.left=`${rect.left+(state.layer.tailX ?? .5)*rect.w}px`;
    tail.style.top=`${rect.top+(state.layer.tailY ?? 1)*rect.h}px`;
    label.textContent=state.layer.name;
    el.classList.toggle('selected',id===selectedLayer);
    el.classList.toggle('selected-branch',isSelectedBoneBranch(id));
    el.style.zIndex=String(id===selectedLayer ? 100000 : displayLayerNoForBone(sharedLayerNoForBone(id)));
  }
  characterEl.appendChild(boneOverlayEl);
}

function initResizeHandles(){
  if(!resizeBoxEl || resizeBoxEl.dataset.ready === '1') return;
  const outline=document.createElementNS('http://www.w3.org/2000/svg','svg');
  outline.classList.add('mesh-resize-outline');
  outline.setAttribute('aria-hidden','true');
  const polygon=document.createElementNS('http://www.w3.org/2000/svg','polygon');
  outline.appendChild(polygon);
  resizeBoxEl.appendChild(outline);
  // 枠の内側は背後のボーンを選べるよう透過する。寸法変更は四隅ハンドルだけで行う。
  ['tl','tr','bl','br'].forEach(corner => {
    const handle = document.createElement('div');
    handle.className = `resize-handle ${corner}`;
    handle.dataset.corner = corner;
    handle.addEventListener('mousedown', startResize);
    resizeBoxEl.appendChild(handle);
  });
  resizeBoxEl.dataset.ready = '1';
}

function renderMeshResizeBox(binding,state){
  const quad=meshBoneTargetQuad(binding,getWorldState(currentFrameData()),state.layer.id);
  if(!quad) return false;
  resizeBoxEl.classList.add('mesh-deform');
  resizeBoxEl.dataset.bindingId=binding.id;
  resizeBoxEl.style.left='0px';
  resizeBoxEl.style.top='0px';
  resizeBoxEl.style.width='1000px';
  resizeBoxEl.style.height='1000px';
  resizeBoxEl.style.transform='none';
  resizeBoxEl.style.transformOrigin='0 0';
  const polygon=resizeBoxEl.querySelector('.mesh-resize-outline polygon');
  if(polygon) polygon.setAttribute('points',[quad.tl,quad.tr,quad.br,quad.bl].map(point=>`${point.x},${point.y}`).join(' '));
  Object.entries(quad).forEach(([corner,point])=>{
    if(!['tl','tr','bl','br'].includes(corner)) return;
    const handle=resizeBoxEl.querySelector(`.resize-handle.${corner}`);
    if(handle){handle.style.left=`${point.x}px`;handle.style.top=`${point.y}px`;}
  });
  return true;
}

function resetResizeHandlePositions(){
  ['tl','tr','bl','br'].forEach(corner=>{
    const handle=resizeBoxEl?.querySelector(`.resize-handle.${corner}`);
    if(!handle) return;
    handle.style.left=corner.includes('r')?'100%':'0';
    handle.style.top=corner.includes('b')?'100%':'0';
  });
}

function refreshParentOptions(){
  parentInputEl.innerHTML = '<option value="">(root)</option>';
  for(const id of project.layerOrder){
    if(!isLayerActiveForCurrentAnimation(id)) continue;
    const op = document.createElement('option');
    op.value = id;
    op.textContent = project.meta.display.internalIds ? `${project.layers[id].name} (${id.slice(-4)})` : project.layers[id].name;
    parentInputEl.appendChild(op);
  }
}

function isDescendant(possibleParent, targetChild){
  let p = project.layers[possibleParent]?.parent;
  while(p){ if(p === targetChild) return true; p = project.layers[p]?.parent; }
  return false;
}

// 自動接続は連続メッシュ専用の補助機能。通常の親子ボーンは常に自由調整する。
function isMeshAutoAttachLayer(id, layer=project.layers?.[id]){
  return !!layer?.parent && !!layer.attached && !!findMeshBindingForBone(id);
}

function attachedPoseOffset(layer, pose){
  ensureBoneEndpoints(layer);
  const headFromPivot = rotate(
    (layer.headX-layer.ox)*pose.w,
    (layer.headY-layer.oy)*pose.h,
    pose.r
  );
  return {x:-headFromPivot.x,y:-headFromPivot.y};
}

function setMeshLayerAttached(id, attached, withHistory=true){
  const layer=project.layers[id];
  if(!layer || !findMeshBindingForBone(id)) return;
  if(withHistory) pushHistory();
  layer.attached=!!attached;
  if(layer.attached){
    // 親の尾ではなく、接続点モードで指定した親画像内の位置を使う。
    allProjectFrames().forEach(frame=>{
      const pose=frame[id];
      if(!pose) return;
      const offset=attachedPoseOffset(layer,pose);
      pose.x=offset.x;
      pose.y=offset.y;
    });
  }
  render();
}

function captureLayerWorldStates(id){
  return allProjectFrames().map(frame => {
    const state = getWorldState(frame)[id];
    return state ? {anchorX:state.anchorX, anchorY:state.anchorY, rotation:state.rotation} : null;
  });
}

function captureDescendantAnchors(id, frame=currentFrameData()){
  const world = getWorldState(frame);
  const anchors = {};
  for(const candidate of project.layerOrder){
    if(candidate !== id && isDescendant(candidate, id) && world[candidate]){
      anchors[candidate] = {anchorX:world[candidate].anchorX, anchorY:world[candidate].anchorY};
    }
  }
  return anchors;
}

function preserveDescendantAnchors(anchors, frame=currentFrameData()){
  const depth = id => {
    let value = 0, cursor = project.layers[id]?.parent;
    while(cursor){ value += 1; cursor = project.layers[cursor]?.parent; }
    return value;
  };
  Object.keys(anchors || {}).sort((a,b)=>depth(a)-depth(b)).forEach(id => {
    const layer = project.layers[id];
    const pose = frame[id];
    const target = anchors[id];
    if(!layer?.parent || !pose || !target) return;
    const local = localOffsetForWorldAnchor(frame, layer, layer.parent, target);
    pose.x = Math.round(local.x);
    pose.y = Math.round(local.y);
  });
}

function localOffsetForWorldAnchor(frame, layer, newParent, worldAnchor){
  if(!newParent) return {x:worldAnchor.anchorX, y:worldAnchor.anchorY, parentRotation:0};
  const world = getWorldState(frame);
  const parentState = world[newParent];
  const parentPose = frame[newParent];
  const parentLayer = project.layers[newParent];
  const dx = layer.attachX * parentPose.w - parentLayer.ox * parentPose.w;
  const dy = layer.attachY * parentPose.h - parentLayer.oy * parentPose.h;
  const rel = rotate(dx, dy, parentState.rotation);
  const deltaX = worldAnchor.anchorX - parentState.anchorX - rel.x;
  const deltaY = worldAnchor.anchorY - parentState.anchorY - rel.y;
  const local = rotate(deltaX, deltaY, -parentState.rotation);
  return {x:local.x, y:local.y, parentRotation:parentState.rotation};
}

function reparentLayer(id, newParent, worldBefore=null){
  const layer = project.layers[id];
  if(!layer) return false;
  if(newParent === id) return false;
  if(newParent && isDescendant(newParent, id)) return false;
  if(layer.parent === newParent) return true;

  const before = worldBefore || captureLayerWorldStates(id);
  layer.parent = newParent || null;

  allProjectFrames().forEach((frame, index) => {
    const pose = frame[id];
    const oldWorld = before[index];
    if(!pose || !oldWorld) return;

    if(!newParent){
      pose.x = Math.round(oldWorld.anchorX);
      pose.y = Math.round(oldWorld.anchorY);
      pose.r = Math.round(oldWorld.rotation);
      return;
    }

    const local = localOffsetForWorldAnchor(frame, layer, newParent, oldWorld);
    pose.r = Math.round(oldWorld.rotation - local.parentRotation);
    // 親を変更しても、見た目の位置を保つ。通常編集では自動スナップしない。
    pose.x = Math.round(local.x);
    pose.y = Math.round(local.y);
  });
  return true;
}

function renderConnections(world){
  connectionsEl.innerHTML = '';
  // 自動接続は通常編集から外した。接続線も固定済みであるかのように見せない。
  return;
  connectionsEl.setAttribute('width', characterEl.clientWidth);
  connectionsEl.setAttribute('height', characterEl.clientHeight);
  for(const id of project.layerOrder){
    const layer = project.layers[id];
    if(!isLayerActiveForCurrentAnimation(id) || !layer.parent || !isLayerActiveForCurrentAnimation(layer.parent) || layer.attached === false) continue;
    const c = world[id];
    const parentPoint = parentAttachWorldPosition(layer, world, currentFrameData());
    ensureBoneEndpoints(layer);
    const childHead = localPointToWorld(c, layer.headX * c.pose.w, layer.headY * c.pose.h);
    if(!parentPoint || !childHead) continue;
    const line = document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1', parentPoint.x); line.setAttribute('y1', parentPoint.y);
    line.setAttribute('x2', childHead.x); line.setAttribute('y2', childHead.y);
    connectionsEl.appendChild(line);
  }
}

function parentAttachWorldPosition(layer, world, frame){
  const parentId = layer?.parent;
  if(!parentId) return null;
  const parentState = world[parentId];
  const parentPose = frame[parentId];
  const parentLayer = project.layers[parentId];
  if(!parentState || !parentPose || !parentLayer) return null;
  const localX = layer.attachX * parentPose.w - parentLayer.ox * parentPose.w;
  const localY = layer.attachY * parentPose.h - parentLayer.oy * parentPose.h;
  const offset = rotate(localX, localY, parentState.rotation);
  return {x:parentState.anchorX + offset.x, y:parentState.anchorY + offset.y};
}

function makeAnchorEditorHandle(role, x, y){
  const handle = document.createElement('div');
  handle.className = `anchor-editor-handle ${role}`;
  handle.dataset.anchorRole = role;
  handle.style.left = `${x}px`;
  handle.style.top = `${y}px`;
  handle.title = role === 'parent' ? '親側の接続位置をドラッグ' : '画像内の回転軸をドラッグ';
  handle.setAttribute('aria-label', handle.title);
  const dot = document.createElement('span');
  dot.className = 'anchor-editor-dot';
  handle.append(dot);
  handle.addEventListener('mousedown', startAnchorEditorDrag);
  return handle;
}

function renderAnchorEditor(world){
  if(!anchorEditorEl) return;
  anchorEditorEl.innerHTML = '';
  if(getEditMode() !== 'anchor' || !selectedLayer) return;
  const layer = project.layers[selectedLayer];
  const state = world[selectedLayer];
  if(!layer || !state) return;
  const frame = currentFrameData();
  const parentPoint = parentAttachWorldPosition(layer, world, frame);
  if(parentPoint){
    anchorEditorEl.appendChild(makeAnchorEditorHandle('parent', parentPoint.x, parentPoint.y));
  }
  anchorEditorEl.appendChild(makeAnchorEditorHandle('origin', state.anchorX, state.anchorY));
}

function updateModeUI(){
  const mode = getEditMode();
  stageEl.classList.toggle('rotate-mode', mode === 'rotate');
  stageEl.classList.toggle('move-mode', mode === 'move');
  stageEl.classList.toggle('whole-mode', mode === 'whole');
  stageEl.classList.toggle('scale-mode', mode === 'scale');
  stageEl.classList.toggle('anchor-mode', mode === 'anchor');
  modeHintEl.textContent = mode === 'rotate' ? 'ROTATE' : mode === 'move' ? 'MOVE' : mode === 'whole' ? 'WHOLE' : mode === 'scale' ? 'SCALE' : 'CONNECT';
  rotateModeBtn?.classList.toggle('active', mode === 'rotate');
  moveModeBtn?.classList.toggle('active', mode === 'move');
  wholeMoveModeBtn?.classList.toggle('active', mode === 'whole');
  scaleModeBtn?.classList.toggle('active', mode === 'scale');
  anchorModeBtn?.classList.toggle('active', mode === 'anchor');
  document.getElementById('wholeAxisTools')?.classList.toggle('visible',mode==='whole');
  document.querySelectorAll('input[name="wholeMoveAxis"]').forEach(input=>{ input.checked=input.value===getWholeMoveAxis(); });
  poseHintEl.innerHTML = mode === 'rotate'
    ? '<strong>回転モード</strong>ではドラッグで関節中心に回転します。'
    : mode === 'move'
      ? '<strong>移動モード</strong>では選択ボーンの相対位置を調整します。'
      : mode === 'whole'
        ? `<strong>全体移動</strong>では、どのボーンをドラッグしてもキャラクター全体を移動します。軸は${getWholeMoveAxis()==='horizontal'?'横固定':getWholeMoveAxis()==='vertical'?'縦固定':'自由'}です。Shift中は移動量の大きい軸へ一時固定します。`
        : mode === 'scale'
          ? '<strong>全体拡縮</strong>では、全体枠の四隅をドラッグして縦横比を保ったまま拡大縮小します。'
          : '<strong>接続点モード</strong>では、青い丸で親側の接続先、橙のひし形で画像内の回転軸（軸X/Y）を直接調整できます。';
  const positionLocked=!!currentLayer()?.positionLocked;
  const connectionLocked=isMeshAutoAttachLayer(selectedLayer,currentLayer());
  document.getElementById('xInput').disabled = mode !== 'move' || positionLocked || connectionLocked;
  document.getElementById('yInput').disabled = mode !== 'move' || positionLocked || connectionLocked;
  document.getElementById('rInput').disabled = mode !== 'rotate';
  document.getElementById('xInput').parentElement.classList.toggle('disabled-note', mode !== 'move' || positionLocked || connectionLocked);
  document.getElementById('yInput').parentElement.classList.toggle('disabled-note', mode !== 'move' || positionLocked || connectionLocked);
  document.getElementById('rInput').parentElement.classList.toggle('disabled-note', mode !== 'rotate');
  if(mode === 'move' && connectionLocked){
    poseHintEl.innerHTML = '<strong>メッシュ接続を固定中</strong>です。位置を変えるには「メッシュ接続を固定」をOFFにしてください。';
  }
  if(mode === 'move' && positionLocked){
    poseHintEl.innerHTML = '<strong>腰の位置を固定中</strong>です。腰を選択できますが、ドラッグとX/Y入力では移動しません。';
  }
}

function getFrameLayerOrder(){ return project.layerOrder; }

function backgroundLayerKey(id){ return `background:${id}`; }
function backgroundIdFromLayerKey(key){ return String(key || '').startsWith('background:') ? String(key).slice(11) : null; }
function getCombinedLayerOrder(){
  ensureProjectSettings();
  const combined=[...getFrameLayerOrder()];
  [...project.backgrounds].sort((a,b)=>(Number(a.layerNo)||1)-(Number(b.layerNo)||1)).forEach(background=>{
    const target=Math.max(0,Math.min(combined.length,Math.round(Number(background.layerNo)||1)-1));
    combined.splice(target,0,backgroundLayerKey(background.id));
  });
  combined.forEach((key,index)=>{
    const backgroundId=backgroundIdFromLayerKey(key);
    const background=backgroundId ? project.backgrounds.find(item=>item.id===backgroundId) : null;
    if(background) background.layerNo=index+1;
  });
  return combined;
}

function getBackgroundLayerNo(backgroundId=selectedBackgroundId){
  const index=getCombinedLayerOrder().indexOf(backgroundLayerKey(backgroundId));
  return index>=0 ? index+1 : 1;
}

function displayLayerNoForBone(boneLayerNo){
  const boneId=project.layerOrder[Math.max(0,Math.round(Number(boneLayerNo)||1)-1)];
  const index=getCombinedLayerOrder().indexOf(boneId);
  return index>=0 ? index+1 : Math.max(1,Math.round(Number(boneLayerNo)||1));
}

function setBackgroundLayerNo(layerNo,push=true,doRender=true,backgroundId=selectedBackgroundId){
  ensureProjectSettings();
  if(!project.backgrounds.some(background=>background.id===backgroundId)) return false;
  const combined=getCombinedLayerOrder();
  const key=backgroundLayerKey(backgroundId);
  const currentIndex=combined.indexOf(key);
  const next=Math.max(1,Math.min(combined.length,Math.round(Number(layerNo)||1)));
  if(next===currentIndex+1){
    if(doRender) render();
    return false;
  }
  if(push) pushHistory();
  combined.splice(currentIndex,1);
  combined.splice(next-1,0,key);
  combined.forEach((item,index)=>{
    const id=backgroundIdFromLayerKey(item);
    const background=id ? project.backgrounds.find(entry=>entry.id===id) : null;
    if(background) background.layerNo=index+1;
  });
  if(doRender) render();
  return true;
}

function changeBackgroundLayer(delta,backgroundId=selectedBackgroundId){
  setBackgroundLayerNo(getBackgroundLayerNo(backgroundId)+delta,true,true,backgroundId);
}

function renderLayerList(){
  layerListEl.innerHTML = '';
  if(boneCountEl) boneCountEl.textContent = String(project.layerOrder.length);
  const orderBackToFront = getFrameLayerOrder();
  const boneLayerNo = new Map(orderBackToFront.map((id,i)=>[id,i+1]));
  const combinedBackToFront=getCombinedLayerOrder();
  const displayLayerNo = new Map(combinedBackToFront.map((id,i)=>[id,i+1]));
  const ids = [...combinedBackToFront].reverse();
  const createItem=id=>{
    const l = project.layers[id];
    const no = displayLayerNo.get(id) || 1;
    const item = document.createElement('div');
    item.className = 'layer-item' + (id === selectedLayer ? ' active' : '');
    item.draggable = true;
    item.dataset.layerId = id;
    item.dataset.layerNo = String(boneLayerNo.get(id) || 1);
    item.dataset.displayLayerNo = String(no);
    item.innerHTML = `<div class="layer-name-wrap"><span class="bone-chip" title="現在フレームのレイヤー番号 ${no}" style="background:${l.color || defaultBoneColor(l.key || l.name || 'bone')}">${no}</span><span class="bone-name">${l.name}</span></div><div class="layer-meta"><div class="layer-z-controls"><button class="layer-z-btn z-front" title="現在フレームだけ1つ手前へ">⬆️</button><button class="layer-z-btn z-back" title="現在フレームだけ1つ奥へ">⬇️</button></div></div>`;
    item.querySelector('.z-front')?.addEventListener('click', e=>{ e.stopPropagation(); selectBoneLayer(id,false); changeDisplayOrder(1); });
    item.querySelector('.z-back')?.addEventListener('click', e=>{ e.stopPropagation(); selectBoneLayer(id,false); changeDisplayOrder(-1); });

    item.addEventListener('dragstart', e => {
      selectBoneLayer(id,false);
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', id);
    });
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      layerListEl.querySelectorAll('.drag-target').forEach(el=>el.classList.remove('drag-target'));
    });
    item.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      item.classList.add('drag-target');
    });
    item.addEventListener('dragleave', () => item.classList.remove('drag-target'));
    item.addEventListener('drop', e => {
      e.preventDefault();
      e.stopPropagation();
      item.classList.remove('drag-target');
      const draggedId = e.dataTransfer.getData('text/plain');
      const draggedBackgroundId=backgroundIdFromLayerKey(draggedId);
      if(draggedBackgroundId){
        selectBackgroundLayer(draggedBackgroundId,false);
        setBackgroundLayerNo(Number(item.dataset.displayLayerNo)||1,true,true,draggedBackgroundId);
        return;
      }
      if(!draggedId || draggedId === id || !project.layers[draggedId]) return;
      selectBoneLayer(draggedId,false);

      // 一覧は「手前が上」。ドロップ先の番号へ、現在フレームだけ移動。
      const targetNo = Number(item.dataset.layerNo) || 1;
      setLayerNumber(draggedId, targetNo, true, true);
    });

    item.addEventListener('click', () => selectBoneLayer(id));
    return item;
  };
  const createBackgroundItem=backgroundId=>{
    const item=document.createElement('div');
    const background=project.backgrounds.find(entry=>entry.id===backgroundId);
    const backgroundSource=background?.sourceId ? project.imageSources?.[background.sourceId] : null;
    const no=getBackgroundLayerNo(backgroundId);
    const key=backgroundLayerKey(backgroundId);
    item.className=`layer-item background-layer-item${backgroundSelected && selectedBackgroundId===backgroundId?' active':''}${backgroundSource?.data?' has-image':''}`;
    item.draggable=true;
    item.dataset.layerId=key;
    item.dataset.displayLayerNo=String(no);
    item.innerHTML=`<div class="layer-name-wrap"><span class="bone-chip" title="背景のレイヤー番号 ${no}">BG</span><span class="bone-name">${background?.name || '背景画像'}</span></div><div class="layer-meta"><span>${backgroundSource?.name || '画像未設定'} / #${no}</span><div class="layer-z-controls"><button class="layer-z-btn z-front" title="背景を1つ手前へ">⬆️</button><button class="layer-z-btn z-back" title="背景を1つ奥へ">⬇️</button></div></div>`;
    item.querySelector('.z-front')?.addEventListener('click',event=>{ event.stopPropagation(); selectBackgroundLayer(backgroundId,false); changeBackgroundLayer(1,backgroundId); });
    item.querySelector('.z-back')?.addEventListener('click',event=>{ event.stopPropagation(); selectBackgroundLayer(backgroundId,false); changeBackgroundLayer(-1,backgroundId); });
    item.addEventListener('dragstart',event=>{
      selectBackgroundLayer(backgroundId,false);
      item.classList.add('dragging');
      event.dataTransfer.effectAllowed='move';
      event.dataTransfer.setData('text/plain',key);
    });
    item.addEventListener('dragend',()=>{
      item.classList.remove('dragging');
      layerListEl.querySelectorAll('.drag-target').forEach(element=>element.classList.remove('drag-target'));
    });
    item.addEventListener('dragover',event=>{ event.preventDefault(); event.dataTransfer.dropEffect='move'; item.classList.add('drag-target'); });
    item.addEventListener('dragleave',()=>item.classList.remove('drag-target'));
    item.addEventListener('drop',event=>{
      event.preventDefault(); event.stopPropagation(); item.classList.remove('drag-target');
      const draggedId=event.dataTransfer.getData('text/plain');
      const draggedBackgroundId=backgroundIdFromLayerKey(draggedId);
      if(draggedBackgroundId){
        selectBackgroundLayer(draggedBackgroundId,false);
        setBackgroundLayerNo(no,true,true,draggedBackgroundId);
        return;
      }
      if(!project.layers[draggedId]) return;
      selectBoneLayer(draggedId,false);
      const bonesBefore=combinedBackToFront.slice(0,no-1).filter(id=>project.layers[id]).length;
      setLayerNumber(draggedId,Math.max(1,Math.min(project.layerOrder.length,bonesBefore+1)),true,true);
    });
    item.addEventListener('click',()=>selectBackgroundLayer(backgroundId));
    return item;
  };
  ids.forEach(id=>{
    const backgroundId=backgroundIdFromLayerKey(id);
    layerListEl.appendChild(backgroundId?createBackgroundItem(backgroundId):createItem(id));
  });
}

function renderAnimationSelector(){
  if(!animationSelectEl) return;
  animationSelectEl.innerHTML='<option value="default">デフォルト（1フレーム）</option>';
  project.animations.forEach(animation=>{
    const option=document.createElement('option'); option.value=animation.id; option.textContent=animation.name; animationSelectEl.appendChild(option);
  });
  const animation=currentAnimation();
  animationSelectEl.value=animation?.id || 'default';
  const fpsInput=document.getElementById('fpsInput');
  fpsInput.disabled=!animation;
  fpsInput.value=animation?.fps || project.meta.fps || 8;
  document.getElementById('playBtn').disabled=!animation || animation.frames.length<2;
  document.getElementById('prevBtn').disabled=activeFrames().length<2;
  document.getElementById('nextBtn').disabled=activeFrames().length<2;
}

function renderFrameButtons(){
  frameListEl.innerHTML = '';
  const frames=activeFrames();
  const animation=currentAnimation();
  if(frameStatusEl) frameStatusEl.textContent = animation ? `${animation.name} ${currentFrame + 1}/${frames.length}` : 'デフォルト 1/1';
  frames.forEach((_, i) => {
    const b = document.createElement('button');
    b.className = 'frame-btn' + (i === currentFrame ? ' active' : '');
    b.innerHTML = `<span class="frame-no">${i + 1}</span>`;
    b.title = animation ? `${animation.name} フレーム${i + 1}` : 'デフォルト';
    // コマごとの手・表情を続けて設定できるよう、フレーム移動では選択ボーンを維持する。
    b.addEventListener('click', () => { stop(); currentFrame = i; render(); });
    frameListEl.appendChild(b);
  });
  ['addFrameBtn','dupFrameBtn','tweenFrameBtn','delFrameBtn'].forEach(id=>{ document.getElementById(id).disabled=!animation; });
  const copyButton=document.getElementById('copyFrameToMotionBtn');
  if(copyButton) copyButton.disabled=!project.animations.some(item=>item.id!==currentAnimationId);
}

function boneEditorDisplaySize(layer,pose){
  const legacyScale=Number.isFinite(Number(layer?.editorBoneScale)) ? Number(layer.editorBoneScale) : 1;
  const meshBinding=findMeshBindingForBone(layer?.id);
  return {
    w:Math.max(8,Math.min(2000,Number.isFinite(Number(meshBinding?.editorResizeBoxWidth)) ? Number(meshBinding.editorResizeBoxWidth) : Number.isFinite(Number(layer?.editorBoneDisplayW)) ? Number(layer.editorBoneDisplayW) : (Number(pose?.w)||1)*legacyScale)),
    h:Math.max(8,Math.min(2000,Number.isFinite(Number(layer?.editorBoneDisplayH)) ? Number(layer.editorBoneDisplayH) : (Number(pose?.h)||1)*legacyScale))
  };
}

function boneEditorDisplayRect(layer,pose){
  const size=boneEditorDisplaySize(layer,pose);
  const poseW=Math.max(1,Number(pose?.w)||1);
  const poseH=Math.max(1,Number(pose?.h)||1);
  const ox=Number(layer?.ox)||0;
  const oy=Number(layer?.oy)||0;
  return {
    w:size.w,
    h:size.h,
    left:ox*poseW-ox*size.w+(Number(layer?.editorBoneDisplayOffsetX)||0),
    top:oy*poseH-oy*size.h+(Number(layer?.editorBoneDisplayOffsetY)||0)
  };
}

function boneResizeOverlayRect(layer,pose){
  if(project.meta.boneDisplaySizeMode) return boneEditorDisplayRect(layer,pose);
  return {left:0,top:0,w:pose.w,h:pose.h};
}

// 編集用のボーンは、頭側30%・尾側70%の幅を持つテーパー形状。
// CSSの見た目だけでは親divの矩形がクリックできてしまうため、同じ形で判定する。
function isPointerInsideEditorBone(id,clientX,clientY){
  const layer=project.layers?.[id];
  const pose=currentFrameData()?.[id];
  if(!layer || !pose) return false;
  const state=getWorldState(currentFrameData())[id];
  if(!state) return false;
  const point=characterPointFromClient(clientX,clientY);
  const local=rotate(point.x-state.anchorX,point.y-state.anchorY,-state.rotation);
  const rect=boneEditorDisplayRect(layer,pose);
  let x=local.x+layer.ox*pose.w-rect.left;
  const y=local.y+layer.oy*pose.h-rect.top;
  // 表示時に左右反転した♦は、同じ変形原点で座標を戻してから判定する。
  if(layer.shapeFlipX){
    const flipOriginX=layer.ox*pose.w-rect.left;
    x=2*flipOriginX-x;
  }
  if(x<0 || y<0 || x>rect.w || y>rect.h) return false;
  const v=y/Math.max(1,rect.h);
  // 最大幅を頭寄り30%へ置いた♦型。頭からすぐ太くなり、尾へ向けて細長く絞る。
  const halfWidth=(v<=.3 ? (v/.3)*.5 : ((1-v)/.7)*.5);
  const u=x/Math.max(1,rect.w);
  return u>=.5-halfWidth && u<=.5+halfWidth;
}

function resizeCornerPoint(corner){
  return {
    x:corner?.includes('r') ? 1 : 0,
    y:corner?.includes('b') ? 1 : 0
  };
}

function oppositeResizeCorner(corner){
  const moving=resizeCornerPoint(corner);
  return {x:1-moving.x,y:1-moving.y};
}

function boneRectCornerWorld(state,width,height,corner,left=0,top=0){
  const local=rotate(
    left+corner.x*width-state.layer.ox*state.pose.w,
    top+corner.y*height-state.layer.oy*state.pose.h,
    state.rotation
  );
  return {x:state.anchorX+local.x,y:state.anchorY+local.y};
}

function movePoseAnchorByWorldDelta(frame,id,deltaX,deltaY){
  const layer=project.layers[id];
  const pose=frame[id];
  if(!layer || !pose) return;
  if(layer.parent){
    const parentState=getWorldState(frame)[layer.parent];
    const local=rotate(deltaX,deltaY,-(parentState?.rotation||0));
    pose.x+=local.x;
    pose.y+=local.y;
  }else{
    pose.x+=deltaX;
    pose.y+=deltaY;
  }
}

function syncInputs(){
  updateModeUI();
  const layer = currentLayer();
  const pose = currentPose();
  if(!layer || !pose) return;
  const morph=activeBoneMorph(layer,pose);
  const visualLayer=visualLayerForPose(layer,pose);
  syncBoneMorphOptions();
  document.getElementById('nameInput').value = layer.name;
  const waistPositionLockRow=document.getElementById('waistPositionLockRow');
  const waistPositionLockInput=document.getElementById('waistPositionLockInput');
  if(waistPositionLockRow) waistPositionLockRow.hidden=!isWaistLayer(layer);
  if(waistPositionLockInput) waistPositionLockInput.checked=!!layer.positionLocked;
  shapeInputEl.value = layer.shape || 'bar';
  parentInputEl.value = layer.parent || '';
  document.getElementById('colorInput').value = layer.color || defaultBoneColor(layer.key || layer.name || 'bone');
  const attachedInput = document.getElementById('attachedInput');
  const meshAttachRow=document.getElementById('meshAttachRow');
  const canUseMeshAttach=!!layer.parent && !!findMeshBindingForBone(selectedLayer);
  meshAttachRow.hidden=!canUseMeshAttach;
  attachedInput.checked=!!layer.attached;
  attachedInput.disabled=!canUseMeshAttach;
  document.getElementById('attachXInput').value = layer.attachX;
  document.getElementById('attachYInput').value = layer.attachY;
  document.getElementById('oxInput').value = layer.ox;
  document.getElementById('oyInput').value = layer.oy;
  document.getElementById('headXInput').value = layer.headX ?? layer.ox;
  document.getElementById('headYInput').value = layer.headY ?? layer.oy;
  document.getElementById('tailXInput').value = layer.tailX ?? defaultBoneEndpoints(layer.shape).tailX;
  document.getElementById('tailYInput').value = layer.tailY ?? defaultBoneEndpoints(layer.shape).tailY;
  document.getElementById('wInput').value = pose.w;
  document.getElementById('hInput').value = pose.h;
  if(boneDisplaySizeModeInputEl) boneDisplaySizeModeInputEl.checked=!!project.meta.boneDisplaySizeMode;
  const displaySize=boneEditorDisplaySize(layer,pose);
  if(boneDisplayWidthInputEl) boneDisplayWidthInputEl.value=String(Math.round(displaySize.w));
  if(boneDisplayHeightInputEl) boneDisplayHeightInputEl.value=String(Math.round(displaySize.h));
  document.getElementById('wInput').disabled=!!project.meta.boneDisplaySizeMode;
  document.getElementById('hInput').disabled=!!project.meta.boneDisplaySizeMode;
  document.getElementById('xInput').value = pose.x;
  document.getElementById('yInput').value = pose.y;
  document.getElementById('rInput').value = pose.r;
  const layerOrderNow = getFrameLayerOrder();
  document.getElementById('zInput').value = Math.max(1, layerOrderNow.indexOf(selectedLayer) + 1);
  const source = getLayerImageSource(layer);
  const meshBinding = findMeshBindingForBone(selectedLayer);
  ['detachMeshBindingBtn','headerDetachMeshBindingBtn'].forEach(id=>{
    const detachMeshButton=document.getElementById(id);
    if(!detachMeshButton) return;
    detachMeshButton.hidden=!meshBinding;
    detachMeshButton.title=meshBinding ? `「${meshBinding.name || chainLabel(meshBinding.boneChain)}」のメッシュ結合を解除` : '';
  });
  const activeSlotId=meshBinding?.imageSourceSlot || layer.imageSourceSlot || '';
  const meshSourceId=meshBinding ? (activeImageSlotSourceId(meshBinding.imageSourceSlot) || meshBinding.sourceId) : null;
  const meshSource = meshSourceId ? project.imageSources?.[meshSourceId] : null;
  const imageSourceNameInput = document.getElementById('imageSourceNameInput');
  if(imageSourceNameInput){
    const slotLabel=IMAGE_SLOT_DEFS.find(def=>def.id===activeSlotId)?.label;
    const sourcePrefix = source ? (slotLabel ? `${slotLabel}: ` : '個別: ') : '';
    const baseSource = project.baseImageSourceId ? project.imageSources?.[project.baseImageSourceId] : null;
    imageSourceNameInput.value = meshSource ? `〰 ${meshSource.name}` : source ? `${sourcePrefix}${source.name}` : baseSource ? `未設定（編集時は基準: ${baseSource.name}）` : '';
  }
  if(imageSlotInputEl) imageSlotInputEl.value=activeSlotId;
  document.getElementById('imageOffsetXInput').value = visualLayer.imageOffsetX ?? 0;
  document.getElementById('imageOffsetYInput').value = visualLayer.imageOffsetY ?? 0;
  document.getElementById('imageScaleXInput').value = visualLayer.imageScaleX ?? 1;
  document.getElementById('imageScaleYInput').value = visualLayer.imageScaleY ?? 1;
  document.getElementById('imageRotationInput').value = visualLayer.imageRotation ?? 0;
  document.getElementById('imageOpacityInput').value = visualLayer.imageOpacity ?? 1;
  document.getElementById('imageFlipXInput').checked = morph?.imageFlipX ?? effectiveBoneImageFlip(selectedLayer,pose,'x',meshBinding);
  document.getElementById('imageFlipYInput').checked = morph?.imageFlipY ?? effectiveBoneImageFlip(selectedLayer,pose,'y',meshBinding);
  document.getElementById('fpsInput').value = currentAnimation()?.fps || project.meta.fps || 8;
  editModeSelectEl.value = getEditMode();
}

function propagateDefaultFrameChanges(){
  const before=lastDefaultFrameSnapshot || {};
  const after=project.defaultFrame || {};
  for(const id of project.layerOrder){
    const previousPose=before[id];
    const nextPose=after[id];
    if(!previousPose || !nextPose) continue;
    const changedKeys=Object.keys(nextPose).filter(key=>
      key!=='imageFlipX' && key!=='imageFlipY' && key!=='z' && !Object.is(nextPose[key],previousPose[key])
    );
    if(!changedKeys.length) continue;
    project.animations.forEach(animation=>animation.frames.forEach(frame=>{
      const pose=frame[id];
      if(!pose) return;
      changedKeys.forEach(key=>{ if(Object.is(pose[key],previousPose[key])) pose[key]=nextPose[key]; });
    }));
  }
  lastDefaultFrameSnapshot=clone(after);
}

function normalizeRootTorsoBoneLength(){
  const waistId=getLayerIdByKey('waist');
  const waistLayer=project.layers?.[waistId];
  const torsoBinding=Object.values(project.meshBindings || {}).find(binding=>
    binding.enabled!==false && binding.partSlot==='torso' && binding.boneChain?.[0]===waistId && binding.boneChain.length>1
  );
  const torsoChildId=torsoBinding?.boneChain?.[1];
  const torsoChild=project.layers?.[torsoChildId];
  if(!waistId || !waistLayer || waistLayer.parent || !torsoChild || torsoChild.parent!==waistId) return false;

  ensureBoneEndpoints(waistLayer);
  const legacyRootY=Number(waistLayer.oy);
  const legacyHeadY=Number(waistLayer.headY);
  const legacyAttachY=Number(torsoChild.attachY);
  const usedRatio=Math.abs(legacyAttachY-legacyRootY);
  const isLegacyCenteredRoot=Math.abs(legacyRootY-.5)<.001 && Math.abs(legacyHeadY-legacyRootY)<.001;
  if(!isLegacyCenteredRoot || !Number.isFinite(usedRatio) || usedRatio<.1 || usedRatio>.9) return false;

  const frames=[...allProjectFrames()];
  if(project.meta.referencePose && !frames.includes(project.meta.referencePose)){
    // 基準ポーズは変更したボーンだけを持つ旧データもあるため、座標計算前に不足分を補う。
    for(const id of project.layerOrder){
      if(!project.meta.referencePose[id] && project.defaultFrame[id]){
        project.meta.referencePose[id]=clone(project.defaultFrame[id]);
      }
    }
    frames.push(project.meta.referencePose);
  }
  const snapshots=frames.map(frame=>({frame,anchors:captureDescendantAnchors(waistId,frame)}));

  // 旧リグでは腰矩形の中央を根元にし、上側の一部だけを胸接続までの長さとして使っていた。
  // 腰Hそのものが「腰根元→胸接続点」の100%になるよう、根元を下端、接続先を上端へ正規化する。
  waistLayer.oy=1;
  waistLayer.headY=1;
  waistLayer.tailX=.5;
  waistLayer.tailY=0;
  torsoChild.attachY=0;
  for(const layer of Object.values(project.layers || {})){
    if(layer.parent===waistId && (layer.key==='legRU' || layer.key==='legLU')) layer.attachY=1;
  }

  snapshots.forEach(({frame,anchors})=>{
    const waistPose=frame?.[waistId];
    if(!waistPose) return;
    waistPose.h=Math.max(12,Number((Number(waistPose.h)*usedRatio).toFixed(3)));
    preserveDescendantAnchors(anchors,frame);
  });
  lastDefaultFrameSnapshot=clone(project.defaultFrame);
  return true;
}

function render(playbackOnly=false){
  ensureProjectSettings();
  if(!playbackOnly){
    if(selectedLayer && project.layers[selectedLayer]) leaveBackgroundSelection();
    ensureFrameCompleteness();
    applyStageView();
    normalizeRootTorsoBoneLength();
    propagateDefaultFrameChanges();
    if(!currentAnimation()) lastDefaultFrameSnapshot=clone(project.defaultFrame);
    initResizeHandles();
    initWholeScaleHandles();
    refreshParentOptions();
  }
  const world = getWorldState(currentFrameData());
  const imageDisplayScale = Math.max(.5,Math.min(2.5,Number(project.meta.imageDisplayScale) || 1));
  const imageDisplayOrigin = world[getRootId()] || null;
  stageEl?.classList.toggle('bone-display-size-mode',!!project.meta.boneDisplaySizeMode);

  for(const id of project.layerOrder){
    if(!layerEls[id]){
      layerEls[id] = createLayerEl(id);
      characterEl.appendChild(layerEls[id]);
    }
  }
  for(const id in layerEls){
    if(!project.layers[id]){ layerEls[id].remove(); delete layerEls[id]; }
  }

  const drawOrder = project.layerOrder.filter(isLayerActiveForCurrentAnimation);
  drawOrder.forEach(id => characterEl.appendChild(layerEls[id]));

  for(const id of project.layerOrder){
    const state = world[id];
    const el = layerEls[id];
    const layerActive=isLayerActiveForCurrentAnimation(id);
    el.style.display=layerActive?'':'none';
    if(!layerActive) continue;
    const visual = el.querySelector('.layer-visual');
    const placeholder = visual.querySelector('.shape');
    const imageTransform = visual.querySelector('.image-transform');
    const img = imageTransform.querySelector('img');
    const label = el.querySelector('.layer-label');

    el.style.left = state.left + 'px';
    el.style.top = state.top + 'px';
    el.style.width = state.pose.w + 'px';
    el.style.height = state.pose.h + 'px';
    el.style.transform = `rotate(${state.rotation}deg)`;
    el.style.transformOrigin = `${state.layer.ox * 100}% ${state.layer.oy * 100}%`;
    el.style.zIndex = displayLayerNoForBone(sharedLayerNoForBone(id));
    el.classList.remove('selected-branch');
    el.style.pointerEvents = 'none';
    const editorBoneDisplayRect=boneEditorDisplayRect(state.layer,state.pose);
    el.style.setProperty('--anchor-left', `${editorBoneDisplayRect.left+(state.layer.headX ?? state.layer.ox)*editorBoneDisplayRect.w}px`);
    el.style.setProperty('--anchor-top', `${editorBoneDisplayRect.top+(state.layer.headY ?? state.layer.oy)*editorBoneDisplayRect.h}px`);
    el.style.setProperty('--tail-left', `${editorBoneDisplayRect.left+(state.layer.tailX ?? .5)*editorBoneDisplayRect.w}px`);
    el.style.setProperty('--tail-top', `${editorBoneDisplayRect.top+(state.layer.tailY ?? 1)*editorBoneDisplayRect.h}px`);
    el.classList.toggle('position-locked',!!state.layer.positionLocked);
    placeholder.style.left=`${editorBoneDisplayRect.left}px`;
    placeholder.style.top=`${editorBoneDisplayRect.top}px`;
    placeholder.style.width=`${editorBoneDisplayRect.w}px`;
    placeholder.style.height=`${editorBoneDisplayRect.h}px`;
    placeholder.style.transformOrigin=`${state.layer.ox*state.pose.w-editorBoneDisplayRect.left}px ${state.layer.oy*state.pose.h-editorBoneDisplayRect.top}px`;
    placeholder.style.transform=state.layer.shapeFlipX?'scaleX(-1)':'';

    const imageLayer=visualLayerForPose(state.layer,state.pose);
    const imageData = findMeshBindingForBone(id) ? null : getLayerRenderImageData(imageLayer);
    const shapeFlipClass = state.layer.shapeFlipX ? ' shape-flip-x' : '';
    if(imageData){
      visual.className = `layer-visual has-image ${state.layer.shape || 'bar'}${shapeFlipClass}`;
      ensureImageCrop(imageLayer);
      imageTransform.style.display = 'block';
      img.style.display = 'block';
      if(img.src !== imageData) img.src = imageData;

      const hasFragment = layerUsesBakedFragment(imageLayer);
      const cropX = hasFragment ? 0 : imageLayer.imageCropX;
      const cropY = hasFragment ? 0 : imageLayer.imageCropY;
      const cropW = hasFragment ? 1 : Math.max(0.01, imageLayer.imageCropW);
      const cropH = hasFragment ? 1 : Math.max(0.01, imageLayer.imageCropH);

      // 元画像全体を拡大・移動し、指定範囲だけをボーン枠内に表示。
      img.style.left = `${(-cropX / cropW) * 100}%`;
      img.style.top = `${(-cropY / cropH) * 100}%`;
      img.style.width = `${100 / cropW}%`;
      img.style.height = `${100 / cropH}%`;

      const unsignedScaleX = imageDisplayScale * Math.abs(Number(imageLayer.imageScaleX ?? 1));
      const unsignedScaleY = imageDisplayScale * Math.abs(Number(imageLayer.imageScaleY ?? 1));
      // 通常画像の反転はコマ側、モーフ画像の反転はモーフ側が正本。
      // imageLayerには基本レイヤーの false も入るため、?? ではコマ設定が届かなかった。
      const morph=activeBoneMorph(state.layer,state.pose);
      const frameFlipX=morph ? !!morph.imageFlipX : effectiveBoneImageFlip(id,state.pose,'x',null);
      const frameFlipY=morph ? !!morph.imageFlipY : effectiveBoneImageFlip(id,state.pose,'y',null);
      const sx = unsignedScaleX * (frameFlipX ? -1 : 1);
      const sy = unsignedScaleY * (frameFlipY ? -1 : 1);
      const displayWorldOffset = imageDisplayOrigin ? {
        x:(state.anchorX-imageDisplayOrigin.anchorX)*(imageDisplayScale-1),
        y:(state.anchorY-imageDisplayOrigin.anchorY)*(imageDisplayScale-1)
      } : {x:0,y:0};
      const displayLocalOffset = rotate(displayWorldOffset.x,displayWorldOffset.y,-state.rotation);
      const flipCenterOffset = {
        x:frameFlipX ? 2*unsignedScaleX*(.5-state.layer.ox)*state.pose.w : 0,
        y:frameFlipY ? 2*unsignedScaleY*(.5-state.layer.oy)*state.pose.h : 0
      };
      const flipCenterCompensation = rotate(flipCenterOffset.x,flipCenterOffset.y,Number(imageLayer.imageRotation ?? 0));
      const imageTranslateX = Number(imageLayer.imageOffsetX ?? 0) + displayLocalOffset.x + flipCenterCompensation.x;
      const imageTranslateY = Number(imageLayer.imageOffsetY ?? 0) + displayLocalOffset.y + flipCenterCompensation.y;
      const baseImageOpacity=Math.max(0,Math.min(1,Number(imageLayer.imageOpacity ?? 1)));
      imageTransform.style.opacity=String(baseImageOpacity);
      imageTransform.style.transformOrigin = `${state.layer.ox * 100}% ${state.layer.oy * 100}%`;
      imageTransform.style.transform = `translate(${imageTranslateX}px, ${imageTranslateY}px) rotate(${Number(imageLayer.imageRotation ?? 0)}deg) scale(${sx}, ${sy})`;
      placeholder.style.display = 'none';
    } else {
      visual.className = `layer-visual placeholder ${state.layer.shape || 'bar'}${shapeFlipClass}`;
      imageTransform.style.display = 'none';
      imageTransform.style.transform = '';
      imageTransform.style.opacity = '1';
      img.style.display = 'none';
      img.src = '';
      placeholder.style.display = 'none';
    }

    const useBoneColors = !!project.meta.display.boneColors;
    const color = state.layer.color || defaultBoneColor(state.layer.key || state.layer.name || 'bone');
    if(useBoneColors) placeholder.style.background = `linear-gradient(180deg, ${color}55, ${color}18)`;
    else placeholder.style.background = 'linear-gradient(180deg,rgba(139,201,255,.28),rgba(103,185,255,.06))';
    placeholder.style.borderColor = 'rgba(147,224,255,.92)';

    label.textContent = state.layer.name;
    el.classList.toggle('selected', id === selectedLayer);
    el.classList.toggle('mesh-deform-selected',id===selectedLayer && !project.meta.boneDisplaySizeMode && !!findMeshBindingForBone(id));
  }

  drawMeshBindings(world);
  renderBoneOverlay(world);
  renderWholeScaleOverlay(world);

  if(selectedLayer && !isLayerActiveForCurrentAnimation(selectedLayer)) selectedLayer=null;
  const selectedState = world[selectedLayer];
  if(selectedState && getEditMode()!=='scale'){
    anchorRingEl.style.left = selectedState.anchorX + 'px';
    anchorRingEl.style.top = selectedState.anchorY + 'px';
    if(resizeOverlayEl && resizeBoxEl){
      resizeOverlayEl.dataset.id = selectedLayer;
      resizeBoxEl.dataset.id = selectedLayer;
      resizeBoxEl.classList.toggle('position-locked',!!selectedState.layer.positionLocked);
      resizeOverlayEl.classList.add('active');
      const meshBinding=!project.meta.boneDisplaySizeMode ? findMeshBindingForBone(selectedLayer) : null;
      if(!meshBinding || !renderMeshResizeBox(meshBinding,selectedState)){
        resizeBoxEl.classList.remove('mesh-deform');
        delete resizeBoxEl.dataset.bindingId;
        resetResizeHandlePositions();
        const displayRect=boneResizeOverlayRect(selectedState.layer,selectedState.pose);
        resizeBoxEl.style.left = (selectedState.left + displayRect.left) + 'px';
        resizeBoxEl.style.top = (selectedState.top + displayRect.top) + 'px';
        resizeBoxEl.style.width = displayRect.w + 'px';
        resizeBoxEl.style.height = displayRect.h + 'px';
        resizeBoxEl.style.transform = `rotate(${selectedState.rotation}deg)`;
        resizeBoxEl.style.transformOrigin = `${selectedState.layer.ox*selectedState.pose.w-displayRect.left}px ${selectedState.layer.oy*selectedState.pose.h-displayRect.top}px`;
      }
    }
  } else {
    resizeOverlayEl?.classList.remove('active');
    resizeBoxEl?.classList.remove('position-locked');
    resizeBoxEl?.classList.remove('mesh-deform');
  }
  renderConnections(world);
  if(playbackOnly){
    const animation=currentAnimation();
    if(frameStatusEl) frameStatusEl.textContent=animation ? `${animation.name} ${currentFrame+1}/${animation.frames.length}` : 'デフォルト 1/1';
    [...frameListEl.querySelectorAll('.frame-btn')].forEach((button,index)=>button.classList.toggle('active',index===currentFrame));
    if(project.meta.display.onionSkin) syncOnionSkinCanvas();
    return;
  }
  renderAnchorEditor(world);
  renderFrameButtons();
  renderAnimationSelector();
  renderLayerList();
  syncInputs();
  // 右側の編集メニューは常時固定。選択解除でキャンバス幅を揺らさない。
  workspaceEl?.classList.add('inspector-open');
  inspectorEl?.classList.toggle('background-selected',backgroundSelected);
  inspectorEl?.setAttribute('aria-hidden', 'false');
  if(boneInspectorEl) boneInspectorEl.hidden=backgroundSelected;
  if(backgroundInspectorEl) backgroundInspectorEl.hidden=!backgroundSelected;
  if(inspectorTitleEl) inspectorTitleEl.textContent=backgroundSelected?'🖼️ BACKGROUND':'🦴 BONE';
  exportJSON(false);
  updateHistoryButtons();
  syncDisplaySettings();
  syncOnionSkinCanvas();
  saveProject();
}

function commitLayerName(layerId=nameEditingLayerId || selectedLayer,value=nameInputEl?.value,{renderAfter=true}={}){
  const layer=project.layers?.[layerId];
  if(!layer) return false;
  const requestedName=cleanBoneName(value);
  if(!requestedName){
    alert('ボーン名を入力してください。');
    if(nameInputEl && selectedLayer===layerId) nameInputEl.value=layer.name;
    return false;
  }
  if(isBoneNameTaken(requestedName,layerId)){
    alert(`「${requestedName}」はすでに使われています。ボーン名は重複できません。`);
    if(nameInputEl && selectedLayer===layerId) nameInputEl.value=layer.name;
    return false;
  }
  nameEditingLayerId=null;
  if(layer.name===requestedName) return true;
  pushHistory();
  layer.name=requestedName;
  if(renderAfter) render();
  else saveProject();
  return true;
}

function applyLayerInputs(){
  const layer = currentLayer();
  const pose = currentPose();
  if(!layer || !pose) return;

  const newParent = parentInputEl.value || null;
  if(newParent === selectedLayer){ alert('自分自身を親にはできません'); syncInputs(); return; }
  if(newParent && isDescendant(newParent, selectedLayer)){ alert('子孫を親にすると循環参照になります'); syncInputs(); return; }

  const requestedName = cleanBoneName(document.getElementById('nameInput').value);
  if(!requestedName){
    alert('ボーン名を入力してください。');
    syncInputs();
    return;
  }
  if(isBoneNameTaken(requestedName, selectedLayer)){
    alert(`「${requestedName}」はすでに使われています。ボーン名は重複できません。`);
    syncInputs();
    return;
  }

  pushHistory();
  const oldParent = layer.parent;
  const worldBefore = oldParent !== newParent ? captureLayerWorldStates(selectedLayer) : null;

  layer.name = requestedName;
  layer.shape = shapeInputEl.value;
  layer.color = document.getElementById('colorInput').value || layer.color;
  layer.attachX = clamp01(parseFloat(document.getElementById('attachXInput').value));
  layer.attachY = clamp01(parseFloat(document.getElementById('attachYInput').value));
  layer.ox = clamp01(parseFloat(document.getElementById('oxInput').value));
  layer.oy = clamp01(parseFloat(document.getElementById('oyInput').value));
  layer.headX = clamp01(parseFloat(document.getElementById('headXInput').value));
  layer.headY = clamp01(parseFloat(document.getElementById('headYInput').value));
  layer.tailX = clamp01(parseFloat(document.getElementById('tailXInput').value));
  layer.tailY = clamp01(parseFloat(document.getElementById('tailYInput').value));
  // モーフを選んでいる時の画像調整は、通常画像ではなくそのモーフの実データへ保存する。
  const imageTarget=currentBoneMorphEntry(layer,pose) || layer;
  imageTarget.imageOffsetX = num('imageOffsetXInput');
  imageTarget.imageOffsetY = num('imageOffsetYInput');
  imageTarget.imageScaleX = parseFloat(document.getElementById('imageScaleXInput').value) || 1;
  imageTarget.imageScaleY = parseFloat(document.getElementById('imageScaleYInput').value) || 1;
  imageTarget.imageRotation = num('imageRotationInput');
  imageTarget.imageOpacity = Math.max(0, Math.min(1, parseFloat(document.getElementById('imageOpacityInput').value) || 0));

  pose.w = Math.max(1, num('wInput'));
  setMeshBindingResizeBoxWidthForBone(selectedLayer,pose.w);
  pose.h = Math.max(1, num('hInput'));
  const requestedLayerNo = Math.max(1, Math.round(num('zInput')));

  if(oldParent !== newParent){
    reparentLayer(selectedLayer, newParent, worldBefore);
  }

  if(getEditMode() === 'move'){
    if(!isMeshAutoAttachLayer(selectedLayer,layer)){
      pose.x = num('xInput');
      pose.y = num('yInput');
    }
  } else if(getEditMode() === 'rotate'){
    pose.r = num('rInput');
  }
  if(isMeshAutoAttachLayer(selectedLayer,layer)){
    const attachedOffset = attachedPoseOffset(layer, pose);
    pose.x = attachedOffset.x;
    pose.y = attachedOffset.y;
  }

  setLayerNumber(selectedLayer, requestedLayerNo, false, false);
  render();
}

function addEmptyLayer(name='ボーン', shape='bar'){
  pushHistory();
  const selectedBefore=selectedLayer;
  const frameInsertions=allProjectFrames().map(frame=>({frame}));
  name = uniqueBoneName(name);
  const id = uid();
  const ep = defaultBoneEndpoints(shape);
  const parentLayer=selectedBefore ? project.layers[selectedBefore] : null;
  if(parentLayer) ensureBoneEndpoints(parentLayer);
  project.layers[id] = {id, name, shape, parent:parentLayer ? selectedBefore : null, attachX:parentLayer ? clamp01(parentLayer.tailX) : 0.5, attachY:parentLayer ? clamp01(parentLayer.tailY) : 0.5, ox:ep.ox, oy:ep.oy, headX:ep.ox, headY:ep.oy, tailX:ep.tailX, tailY:ep.tailY, imageData:null, imageSourceId:null, imageCropX:0, imageCropY:0, imageCropW:1, imageCropH:1, color:defaultBoneColor(id), attached:false, autoTail:true, imageOffsetX:0, imageOffsetY:0, imageScaleX:1, imageScaleY:1, imageRotation:0, imageFlipX:false, imageFlipY:false, imageOpacity:1};
  const structuralIndex=selectedBefore ? project.layerOrder.indexOf(selectedBefore) : -1;
  if(structuralIndex>=0) project.layerOrder.splice(structuralIndex+1,0,id);
  else project.layerOrder.push(id);
  for(const {frame} of frameInsertions){
    const pose={x:parentLayer ? 0 : 500,y:parentLayer ? 0 : 500,w:shape === 'circle' ? 80 : (shape === 'torso' ? 120 : (shape === 'foot' ? 80 : (shape === 'hand' ? 50 : 34))), h:shape === 'circle' ? 80 : (shape === 'torso' ? 120 : (shape === 'foot' ? 28 : (shape === 'hand' ? 50 : 100))), r:0,z:1};
    frame[id]=pose;
  }
  syncSharedLayerOrderToFrames();
  selectedLayer = id;
  render();
}

function addImageLayer(file){
  const reader = new FileReader();
  reader.onload = e => {
    const data = e.target.result;
    const img = new Image();
    img.onload = () => {
      pushHistory();
      const id = uid();
      project.layers[id] = {
        id,
        name: uniqueBoneName(basename(file.name)),
        shape:'bar',
        parent:null,
        attachX:0.5,
        attachY:0.5,
        ox:0.5,
        oy:0.5,
        headX:0.5,
        headY:0.5,
        imageData:null,
        imageSourceId:registerImageSource(data, file.name),
        imageCropX:0,
        imageCropY:0,
        imageCropW:1,
        imageCropH:1,
        color:defaultBoneColor(basename(file.name)),
        attached:true,
        tailX:0.5,
        tailY:1.0,
        autoTail:true,
        imageOffsetX:0,
        imageOffsetY:0,
        imageScaleX:1,
        imageScaleY:1,
        imageRotation:0,
        imageFlipX:false,
        imageFlipY:false,
        imageOpacity:1
      };
      project.layerOrder.push(id);
      for(const frame of allProjectFrames()){
        frame[id] = {x:500, y:500, w:img.width, h:img.height, r:0, z:project.layerOrder.length};
      }
      syncSharedLayerOrderToFrames();
      selectedLayer = id;
      render();
    };
    img.src = data;
  };
  reader.readAsDataURL(file);
}

function duplicateLayer(){
  if(!currentLayer()) return;
  pushHistory();
  const source = currentLayer();
  if(!source) return;
  const id = uid();
  const copyLayer = clone(source);
  copyLayer.id = id;
  copyLayer.name = uniqueBoneName(source.name + '_copy');
  project.layers[id] = copyLayer;
  project.layerOrder.push(id);
  for(const frame of allProjectFrames()){ frame[id] = clone(frame[selectedLayer] || currentFrameData()[selectedLayer]); frame[id].z = project.layerOrder.length; }
  syncSharedLayerOrderToFrames();
  selectedLayer = id;
  render();
}

function deleteLayer(){
  if(!selectedLayer || project.layerOrder.length <= 1) return;
  const id = selectedLayer;
  const deletedLayer = project.layers[id];
  if(!deletedLayer) return;

  pushHistory();

  const removedMeshSources=[];
  Object.values(project.meshBindings || {}).forEach(binding=>{
    if(binding.boneChain?.includes(id)){
      removedMeshSources.push(binding.sourceId);
      delete project.meshBindings[binding.id];
    }
  });

  // 子ボーンは消さず、削除するボーンの親へ付け替える。
  // 見た目が飛ばないよう、各フレームのワールド位置を先に保存する。
  const childIds = project.layerOrder.filter(lid => project.layers[lid]?.parent === id);
  const childWorld = {};
  childIds.forEach(cid => { childWorld[cid] = captureLayerWorldStates(cid); });
  const fallbackParent = deletedLayer.parent || null;

  project.layerOrder = project.layerOrder.filter(v => v !== id);
  delete project.layers[id];
  for(const frame of allProjectFrames()) delete frame[id];

  childIds.forEach(cid => {
    const child = project.layers[cid];
    if(!child) return;
    child.parent = fallbackParent;

    allProjectFrames().forEach((frame, index) => {
      const pose = frame[cid];
      const oldWorld = childWorld[cid]?.[index];
      if(!pose || !oldWorld) return;

      if(!fallbackParent){
        pose.x = Math.round(oldWorld.anchorX);
        pose.y = Math.round(oldWorld.anchorY);
        pose.r = Math.round(oldWorld.rotation);
      } else {
        // 削除直後に子が飛ばないことを優先し、一旦「親から離す」にする。
        const local = localOffsetForWorldAnchor(frame, child, fallbackParent, oldWorld);
        pose.x = Math.round(local.x);
        pose.y = Math.round(local.y);
        pose.r = Math.round(oldWorld.rotation - local.parentRotation);
        child.attached = false;
      }
    });
  });

  removedMeshSources.forEach(removeOrphanImageSource);

  syncSharedLayerOrderToFrames();
  selectedLayer = null;
  render();
}

function addFrame(copyCurrent=false){
  const animation=currentAnimation();
  if(!animation) return;
  pushHistory();
  const frame = copyCurrent ? clone(currentFrameData()) : clone(project.defaultFrame);
  animation.frames.splice(currentFrame + 1, 0, frame);
  currentFrame++;
  selectedLayer=null;
  render();
}

function roundedTweenValue(value){
  return Number(Number(value).toFixed(3));
}

function tweenAngle(startValue,endValue,ratio){
  const start=Number(startValue) || 0;
  const end=Number(endValue) || 0;
  const delta=((end-start+540)%360)-180;
  return roundedTweenValue(start+delta*ratio);
}

function tweenPose(startPose,endPose,ratio){
  if(!startPose) return clone(endPose || {});
  if(!endPose) return clone(startPose);
  const pose=clone(startPose);
  for(const key of ['x','y','w','h']){
    const start=Number(startPose[key]);
    const end=Number(endPose[key]);
    if(Number.isFinite(start) && Number.isFinite(end)) pose[key]=roundedTweenValue(start+(end-start)*ratio);
  }
  if(Number.isFinite(Number(startPose.r)) && Number.isFinite(Number(endPose.r))){
    pose.r=tweenAngle(startPose.r,endPose.r,ratio);
  }
  return pose;
}

function tweenFrame(startFrame,endFrame,ratio){
  const frame={};
  const layerIds=new Set([
    ...sharedLayerOrder(),
    ...Object.keys(startFrame || {}),
    ...Object.keys(endFrame || {})
  ]);
  layerIds.forEach(id=>{
    if(startFrame?.[id] && endFrame?.[id]) frame[id]=tweenPose(startFrame[id],endFrame[id],ratio);
    else if(startFrame?.[id]) frame[id]=clone(startFrame[id]);
    else if(endFrame?.[id]) frame[id]=clone(endFrame[id]);
  });
  return frame;
}

function currentTweenMode(){
  return document.querySelector('input[name="tweenFrameMode"]:checked')?.value || 'partial';
}

function uniqueTweenAnimationName(sourceName,frameCount){
  const base=`${sourceName}_${frameCount}フレーム`;
  let name=base;
  let suffix=2;
  while(project.animations.some(animation=>animation.name===name)) name=`${base}_${suffix++}`;
  return name;
}

function resampleAnimationFrames(animation,multiplier){
  const source=animation.frames;
  const targetCount=source.length*multiplier;
  if(animation.loop!==false){
    return Array.from({length:targetCount},(_,index)=>{
      const position=index/multiplier;
      const leftIndex=Math.floor(position)%source.length;
      const ratio=position-Math.floor(position);
      return ratio===0
        ? clone(source[leftIndex])
        : tweenFrame(source[leftIndex],source[(leftIndex+1)%source.length],ratio);
    });
  }
  return Array.from({length:targetCount},(_,index)=>{
    const position=targetCount<=1 ? 0 : index*(source.length-1)/(targetCount-1);
    const leftIndex=Math.floor(position);
    const ratio=position-leftIndex;
    const rightIndex=Math.min(source.length-1,leftIndex+1);
    return ratio===0 ? clone(source[leftIndex]) : tweenFrame(source[leftIndex],source[rightIndex],ratio);
  });
}

function syncTweenFrameDialog(){
  const animation=currentAnimation();
  const mode=currentTweenMode();
  if(tweenPartialPanelEl) tweenPartialPanelEl.hidden=mode!=='partial';
  if(tweenWholePanelEl) tweenWholePanelEl.hidden=mode!=='whole';
  if(!animation){
    if(tweenFrameSummaryEl){
      tweenFrameSummaryEl.textContent='先に編集するモーションを選択してください。';
      tweenFrameSummaryEl.classList.add('is-error');
    }
    if(tweenFrameApplyBtn) tweenFrameApplyBtn.disabled=true;
    return;
  }

  const frameCount=animation.frames.length;
  if(tweenWholeMultiplierSelectEl){
    const previous=Number(tweenWholeMultiplierSelectEl.value) || 2;
    tweenWholeMultiplierSelectEl.innerHTML='';
    for(let multiplier=2;multiplier<=5;multiplier++){
      const option=document.createElement('option');
      option.value=String(multiplier);
      option.textContent=`×${multiplier}（${frameCount} → ${frameCount*multiplier}枚）`;
      tweenWholeMultiplierSelectEl.appendChild(option);
    }
    tweenWholeMultiplierSelectEl.value=String(Math.max(2,Math.min(5,previous)));
  }

  let valid=true;
  let summary='';
  if(mode==='partial'){
    const count=Math.max(1,Math.min(4,Number(tweenPartialCountSelectEl?.value)||1));
    const nextIndex=currentFrame+1<frameCount ? currentFrame+1 : (animation.loop!==false ? 0 : -1);
    valid=nextIndex>=0 && frameCount>=2;
    summary=valid
      ? `${currentFrame+1} → ${nextIndex+1} の間へ ${count}枚追加します。合計 ${frameCount+count}枚になります。`
      : '次のフレームがありません。非ループの末尾では部分追加できません。';
  }else{
    const multiplier=Math.max(2,Math.min(5,Number(tweenWholeMultiplierSelectEl?.value)||2));
    const fps=Math.min(60,Math.max(1,Math.round((Number(animation.fps)||8)*multiplier)));
    valid=frameCount>=2;
    summary=valid
      ? `${frameCount}枚を ${frameCount*multiplier}枚へ増やした別モーションを作成します。再生時間維持のためFPSは ${animation.fps} → ${fps} になります。`
      : '全体生成には2枚以上のフレームが必要です。';
  }
  if(tweenFrameSummaryEl){
    tweenFrameSummaryEl.textContent=summary;
    tweenFrameSummaryEl.classList.toggle('is-error',!valid);
  }
  if(tweenFrameApplyBtn) tweenFrameApplyBtn.disabled=!valid;
}

function openTweenFrameDialog(){
  stop();
  syncTweenFrameDialog();
  if(!tweenFrameDialogEl?.open && typeof tweenFrameDialogEl?.showModal==='function') tweenFrameDialogEl.showModal();
}

function addPartialTweenFrames(count){
  const animation=currentAnimation();
  if(!animation || animation.frames.length<2) return false;
  const nextIndex=currentFrame+1<animation.frames.length ? currentFrame+1 : (animation.loop!==false ? 0 : -1);
  if(nextIndex<0) return false;
  const startFrame=animation.frames[currentFrame];
  const endFrame=animation.frames[nextIndex];
  const added=Array.from({length:count},(_,index)=>tweenFrame(startFrame,endFrame,(index+1)/(count+1)));
  pushHistory();
  animation.frames.splice(currentFrame+1,0,...added);
  currentFrame++;
  selectedLayer=null;
  syncSharedLayerOrderToFrames();
  tweenFrameDialogEl?.close();
  render();
  return true;
}

function generateWholeTweenAnimation(multiplier){
  const source=currentAnimation();
  if(!source || source.frames.length<2) return false;
  const frames=resampleAnimationFrames(source,multiplier);
  pushHistory();
  const animation={
    id:animationUid(),
    name:uniqueTweenAnimationName(source.name,frames.length),
    fps:Math.min(60,Math.max(1,Math.round((Number(source.fps)||8)*multiplier))),
    loop:source.loop!==false,
    frames
  };
  project.animations.splice(project.animations.indexOf(source)+1,0,animation);
  currentAnimationId=animation.id;
  currentFrame=0;
  selectedLayer=null;
  syncSharedLayerOrderToFrames();
  tweenFrameDialogEl?.close();
  render();
  return true;
}

function applyTweenFrames(){
  if(currentTweenMode()==='whole'){
    generateWholeTweenAnimation(Math.max(2,Math.min(5,Number(tweenWholeMultiplierSelectEl?.value)||2)));
  }else{
    addPartialTweenFrames(Math.max(1,Math.min(4,Number(tweenPartialCountSelectEl?.value)||1)));
  }
}

function deleteFrame(){
  const animation=currentAnimation();
  if(!animation || animation.frames.length <= 1) return;
  pushHistory();
  animation.frames.splice(currentFrame, 1);
  currentFrame = Math.max(0, Math.min(currentFrame, animation.frames.length - 1));
  selectedLayer=null;
  render();
}

function play(){
  stop();
  const animation=currentAnimation();
  if(!animation || animation.frames.length<2) return;
  playing = true;
  const fps = Math.max(1, parseInt(document.getElementById('fpsInput').value, 10) || 8);
  animation.fps = fps;
  exportJSON(false);
  saveProject();
  playbackLastTime=performance.now();
  playbackAccumulator=0;
  const frameDuration=1000/fps;
  const tick=now=>{
    if(!playing) return;
    playbackAccumulator+=Math.min(250,Math.max(0,now-playbackLastTime));
    playbackLastTime=now;
    let advanced=false;
    while(playbackAccumulator>=frameDuration){
      if(currentFrame>=animation.frames.length-1 && animation.loop===false){
        stop();
        render();
        return;
      }
      currentFrame=(currentFrame+1)%animation.frames.length;
      playbackAccumulator-=frameDuration;
      advanced=true;
    }
    if(advanced) render(true);
    playbackRequestId=requestAnimationFrame(tick);
  };
  playbackRequestId=requestAnimationFrame(tick);
  document.getElementById('playBtn').textContent = '■';
}
function stop(){
  playing = false;
  if(playbackRequestId!==null) cancelAnimationFrame(playbackRequestId);
  playbackRequestId=null;
  playbackAccumulator=0;
  document.getElementById('playBtn').textContent = '▶';
}
function togglePlay(){
  if(playing){ stop(); render(); }
  else play();
}

function startAnchorEditorDrag(e){
  e.preventDefault();
  e.stopPropagation();
  if(!selectedLayer) return;
  const role = e.currentTarget.dataset.anchorRole;
  const layer = project.layers[selectedLayer];
  const frame = currentFrameData();
  if(!layer || !frame[selectedLayer]) return;
  if(role === 'parent' && !layer.parent) return;
  const state = getWorldState(frame)[selectedLayer];
  const descendantAnchors = role === 'origin' ? captureDescendantAnchors(selectedLayer, frame) : null;
  dragState = {
    type:role === 'parent' ? 'parent-anchor' : 'local-origin',
    id:selectedLayer,
    startX:e.clientX,
    startY:e.clientY,
    origAttachX:layer.attachX,
    origAttachY:layer.attachY,
    origX:frame[selectedLayer].x,
    origY:frame[selectedLayer].y,
    originAnchorX:state?.anchorX,
    originAnchorY:state?.anchorY,
    originRotation:state?.rotation || 0,
    originOx:layer.ox,
    originOy:layer.oy,
    originImageOffsetX:Number(layer.imageOffsetX || 0),
    originImageOffsetY:Number(layer.imageOffsetY || 0),
    descendantAnchors,
    activated:false
  };
  window.addEventListener('mousemove', onDrag);
  window.addEventListener('mouseup', endDrag);
}

function startDrag(e){
  if(e.target.classList?.contains('resize-handle')) return;
  const clickedId=e.currentTarget.dataset.id || e.currentTarget.closest?.('.bone-overlay-item')?.dataset.id;
  if(!clickedId) return;
  const isExactBonePolygon=e.currentTarget?.tagName?.toLowerCase()==='polygon';
  if(project.meta.display.bones && !isExactBonePolygon && !isPointerInsideEditorBone(clickedId,e.clientX,e.clientY)) return;
  e.preventDefault();
  e.stopPropagation();
  if(nameEditingLayerId && nameEditingLayerId!==clickedId) commitLayerName(nameEditingLayerId,nameInputEl?.value,{renderAfter:false});
  selectedLayer = clickedId;
  const mode = getEditMode();
  if(mode==='move' && (project.layers[clickedId]?.positionLocked || isMeshAutoAttachLayer(clickedId,project.layers[clickedId]))){
    dragState=null;
    render();
    return;
  }
  const world = getWorldState(currentFrameData());
  const pointer=characterPointFromClient(e.clientX,e.clientY);
  const mx = pointer.x;
  const my = pointer.y;
  if(mode === 'whole'){
    const rootId = getRootId();
    const rootPose = currentFrameData()[rootId];
    dragState = {type:'whole', id:rootId, startX:e.clientX, startY:e.clientY, origX:rootPose.x, origY:rootPose.y, axis:getWholeMoveAxis(), shiftAxis:null, activated:false};
  } else {
    const id = clickedId;
    const pose = currentFrameData()[id];
    const state = world[id];
    const parentId = project.layers[id].parent;
    const parentRot = parentId ? world[parentId].rotation : 0;
    if(mode === 'rotate'){
      dragState = { type:'rotate', id, startRot:pose.r, startAngle:angleDeg(state.anchorX, state.anchorY, mx, my), anchorX:state.anchorX, anchorY:state.anchorY, startX:e.clientX, startY:e.clientY, activated:false };
    } else {
      dragState = { type:'move', id, startX:e.clientX, startY:e.clientY, origX:pose.x, origY:pose.y, parentRot, activated:false };
    }
  }
  render();
  window.addEventListener('mousemove', onDrag);
  window.addEventListener('mouseup', endDrag);
}

function startResize(e){
  e.preventDefault();
  e.stopPropagation();
  const id = e.currentTarget.parentElement.dataset.id;
  if(!id) return;
  selectedLayer = id;
  const pose = currentFrameData()[id];
  const world = getWorldState(currentFrameData());
  const state = world[id];
  const displayOnly=!!project.meta.boneDisplaySizeMode;
  const layer=project.layers[id];
  const meshBinding=!displayOnly ? findMeshBindingForBone(id) : null;
  if(meshBinding){
    ensureMeshBinding(meshBinding);
    const boneIndex=meshBinding.boneChain.indexOf(id);
    const corner=e.currentTarget.dataset.corner;
    const pointIndex=boneIndex+(corner.includes('b')?1:0);
    const side=corner.includes('l')?'left':'right';
    const baseControls=getMeshTargetPoints(meshBinding,world,{applyCrossSections:false});
    const basePoint=baseControls[pointIndex];
    const normal=meshTargetNormal(baseControls,pointIndex);
    dragState={
      type:'mesh-corner-resize',id,corner,bindingId:meshBinding.id,pointIndex,side,
      basePoint,normal,baseHalfWidth:Math.max(1,(basePoint?.width||2)*.5),activated:false,
      startX:e.clientX,startY:e.clientY
    };
    render();
    window.addEventListener('mousemove',onDrag);
    window.addEventListener('mouseup',endDrag);
    return;
  }
  const displayRect=boneResizeOverlayRect(layer,pose);
  const oppositeCorner=oppositeResizeCorner(e.currentTarget.dataset.corner);
  dragState = {
    type:displayOnly?'display-resize':'resize',
    id,
    corner:e.currentTarget.dataset.corner,
    startX:e.clientX,
    startY:e.clientY,
    startW:pose.w,
    startH:pose.h,
    rotation:state.rotation,
    startDisplayW:displayRect.w,
    startDisplayH:displayRect.h,
    startDisplayLeft:displayRect.left,
    startDisplayTop:displayRect.top,
    oppositeCorner,
    fixedWorld:boneRectCornerWorld(
      state,
      displayOnly?displayRect.w:pose.w,
      displayOnly?displayRect.h:pose.h,
      oppositeCorner,
      displayOnly?displayRect.left:0,
      displayOnly?displayRect.top:0
    ),
    activated:false
  };
  render();
  window.addEventListener('mousemove', onDrag);
  window.addEventListener('mouseup', endDrag);
}

function onDrag(e){
  if(!dragState) return;
  if(!dragState.activated){
    const distance = Math.hypot(e.clientX - dragState.startX, e.clientY - dragState.startY);
    if(distance < 4) return;
    pushHistory();
    dragState.activated = true;
  }
  const frame = currentFrameData();
  const pose = frame[dragState.id];
  const before = clone(pose);
  const groundPenetrationBefore = project.meta?.ground?.enabled ? maxGroundPenetration(frame) : 0;
  if(dragState.type === 'parent-anchor'){
    const layer = project.layers[dragState.id];
    const parentState = layer?.parent ? getWorldState(frame)[layer.parent] : null;
    const parentPose = layer?.parent ? frame[layer.parent] : null;
    const parentLayer = layer?.parent ? project.layers[layer.parent] : null;
    if(parentState && parentPose && parentLayer){
      const pointer=characterPointFromClient(e.clientX,e.clientY);
      const local = rotate(pointer.x - parentState.anchorX, pointer.y - parentState.anchorY, -parentState.rotation);
      layer.attachX = Math.round(clamp01((local.x + parentLayer.ox * parentPose.w) / parentPose.w) * 1000) / 1000;
      layer.attachY = Math.round(clamp01((local.y + parentLayer.oy * parentPose.h) / parentPose.h) * 1000) / 1000;
    }
  } else if(dragState.type === 'local-origin'){
    const layer = project.layers[dragState.id];
    const pointer=characterPointFromClient(e.clientX,e.clientY);
    const targetX = pointer.x;
    const targetY = pointer.y;
    if(layer && Number.isFinite(dragState.originAnchorX)){
      const local = rotate(targetX - dragState.originAnchorX, targetY - dragState.originAnchorY, -dragState.originRotation);
      layer.ox = Math.round(clamp01(dragState.originOx + local.x / pose.w) * 1000) / 1000;
      layer.oy = Math.round(clamp01(dragState.originOy + local.y / pose.h) * 1000) / 1000;
      // 画像個別の回転・拡大・反転も、変換原点だけが変わると位置がずれる。
      // 同じ見た目を保つ逆方向のオフセットを加える。
      const originDelta = {
        x:(layer.ox - dragState.originOx) * pose.w,
        y:(layer.oy - dragState.originOy) * pose.h
      };
      const displayScale = Math.max(.5,Math.min(2.5,Number(project.meta.imageDisplayScale) || 1));
      const imageScaleX = displayScale * Math.abs(Number(layer.imageScaleX ?? 1)) * (layer.imageFlipX ? -1 : 1);
      const imageScaleY = displayScale * Math.abs(Number(layer.imageScaleY ?? 1)) * (layer.imageFlipY ? -1 : 1);
      const transformedOriginDelta = rotate(originDelta.x * imageScaleX, originDelta.y * imageScaleY, Number(layer.imageRotation ?? 0));
      layer.imageOffsetX = dragState.originImageOffsetX + transformedOriginDelta.x - originDelta.x;
      layer.imageOffsetY = dragState.originImageOffsetY + transformedOriginDelta.y - originDelta.y;
      // 画像・ボーンの見た目はその場に維持し、選んだ画像内の点だけを新しい回転軸にする。
      // つまり、変えた頭X/Yぶんだけアンカーをドラッグ先へ移し、位置を相殺する。
      if(layer.parent){
        const world = getWorldState(frame);
        const parentState = world[layer.parent];
        const attach = parentAttachWorldPosition(layer, world, frame);
        if(parentState && attach){
          const relative = rotate(targetX - attach.x, targetY - attach.y, -parentState.rotation);
          pose.x = Math.round(relative.x);
          pose.y = Math.round(relative.y);
        }
      } else {
        pose.x = Math.round(targetX);
        pose.y = Math.round(targetY);
      }
      preserveDescendantAnchors(dragState.descendantAnchors, frame);
    }
  } else if(dragState.type === 'rotate'){
    const pointer=characterPointFromClient(e.clientX,e.clientY);
    const mx = pointer.x;
    const my = pointer.y;
    const currentAngle = angleDeg(dragState.anchorX, dragState.anchorY, mx, my);
    pose.r = Math.round(dragState.startRot + (currentAngle - dragState.startAngle));
  } else if(dragState.type === 'mesh-corner-resize') {
    const binding=project.meshBindings?.[dragState.bindingId];
    const pointer=characterPointFromClient(e.clientX,e.clientY);
    if(binding && dragState.basePoint){
      const deltaX=pointer.x-dragState.basePoint.x,deltaY=pointer.y-dragState.basePoint.y;
      const signed=deltaX*dragState.normal.x+deltaY*dragState.normal.y;
      const width=dragState.side==='left' ? signed : -signed;
      const scale=Math.max(.05,Math.min(8,width/dragState.baseHalfWidth));
      const section=binding.targetCrossSections[dragState.pointIndex];
      section[`${dragState.side}Scale`]=Math.round(scale*1000)/1000;
    }
  } else if(dragState.type === 'resize') {
    const delta=characterDeltaFromClient(e.clientX-dragState.startX,e.clientY-dragState.startY);
    const dx = delta.x;
    const dy = delta.y;
    const local = rotate(dx, dy, -dragState.rotation);
    const sx = dragState.corner.includes('r') ? 1 : -1;
    const sy = dragState.corner.includes('b') ? 1 : -1;
    const nextWidth = Math.max(12, Math.round(dragState.startW + local.x * sx));
    if(!setMeshBindingResizeBoxWidthForBone(dragState.id,nextWidth,{fixedCorner:dragState.oppositeCorner})) pose.w=nextWidth;
    pose.h = Math.max(12, Math.round(dragState.startH + local.y * sy));
    const resizedState=getWorldState(frame)[dragState.id];
    const currentFixed=boneRectCornerWorld(resizedState,pose.w,pose.h,dragState.oppositeCorner);
    movePoseAnchorByWorldDelta(
      frame,
      dragState.id,
      dragState.fixedWorld.x-currentFixed.x,
      dragState.fixedWorld.y-currentFixed.y
    );
  } else if(dragState.type === 'display-resize') {
    const delta=characterDeltaFromClient(e.clientX-dragState.startX,e.clientY-dragState.startY);
    const local=rotate(delta.x,delta.y,-dragState.rotation);
    const sx=dragState.corner.includes('r') ? 1 : -1;
    const sy=dragState.corner.includes('b') ? 1 : -1;
    const layer=project.layers[dragState.id];
    const nextW=Math.max(8,Math.min(2000,Math.round(dragState.startDisplayW+local.x*sx)));
    const nextH=Math.max(8,Math.min(2000,Math.round(dragState.startDisplayH+local.y*sy)));
    const fixedLocalX=dragState.startDisplayLeft+dragState.oppositeCorner.x*dragState.startDisplayW;
    const fixedLocalY=dragState.startDisplayTop+dragState.oppositeCorner.y*dragState.startDisplayH;
    const nextLeft=fixedLocalX-dragState.oppositeCorner.x*nextW;
    const nextTop=fixedLocalY-dragState.oppositeCorner.y*nextH;
    layer.editorBoneDisplayW=nextW;
    setMeshBindingEditorResizeBoxWidthForBone(dragState.id,nextW);
    layer.editorBoneDisplayH=nextH;
    layer.editorBoneDisplayOffsetX=nextLeft-(layer.ox*pose.w-layer.ox*nextW);
    layer.editorBoneDisplayOffsetY=nextTop-(layer.oy*pose.h-layer.oy*nextH);
    delete layer.editorBoneScale;
  } else if(dragState.type === 'whole') {
    const delta=characterDeltaFromClient(e.clientX-dragState.startX,e.clientY-dragState.startY);
    let axis=dragState.axis;
    if(e.shiftKey){
      if(!dragState.shiftAxis) dragState.shiftAxis=Math.abs(delta.x)>=Math.abs(delta.y)?'horizontal':'vertical';
      axis=dragState.shiftAxis;
    }else{
      dragState.shiftAxis=null;
    }
    pose.x = Math.round(dragState.origX + (axis==='vertical'?0:delta.x));
    pose.y = Math.round(dragState.origY + (axis==='horizontal'?0:delta.y));
  } else {
    const delta=characterDeltaFromClient(e.clientX-dragState.startX,e.clientY-dragState.startY);
    const dx = delta.x;
    const dy = delta.y;
    const local = rotate(dx, dy, -dragState.parentRot);
    pose.x = Math.round(dragState.origX + local.x);
    pose.y = Math.round(dragState.origY + local.y);
  }

  const changedLayer=project.layers[dragState.id];
  if(isMeshAutoAttachLayer(dragState.id,changedLayer) && !['parent-anchor','whole','display-resize','mesh-corner-resize'].includes(dragState.type)){
    const attachedOffset=attachedPoseOffset(changedLayer,pose);
    pose.x=attachedOffset.x;
    pose.y=attachedOffset.y;
  }

  ensureProjectSettings();
  if(project.meta.ground.enabled && dragState.type !== 'local-origin'){
    const penetration = maxGroundPenetration(frame);
    // 「地面に既に触れている」こと自体では操作を戻さない。
    // 今回の操作で、操作前より地面への侵入量が増えた時だけ制限する。
    if(penetration > groundPenetrationBefore + 0.1){
      if(dragState.type === 'whole'){
        pose.y -= Math.ceil(penetration - groundPenetrationBefore);
      } else {
        Object.assign(pose, before);
      }
    }
  }
  render();
}

function endDrag(){
  dragState = null;
  window.removeEventListener('mousemove', onDrag);
  window.removeEventListener('mouseup', endDrag);
}

function setLayerNumber(id, targetNo, push=true, doRender=true){
  let order = [...project.layerOrder];
  const oldIndex = order.indexOf(id);
  if(oldIndex < 0) return;
  const maxNo = order.length;
  const desiredNo = Math.max(1, Math.min(maxNo, Math.round(Number(targetNo) || 1)));
  const targetIndex = desiredNo - 1;
  if(oldIndex === targetIndex){
    syncSharedLayerOrderToFrames();
    if(doRender) render();
    return;
  }
  if(push) pushHistory();
  order.splice(oldIndex, 1);
  order.splice(targetIndex, 0, id);
  project.layerOrder=order;
  syncSharedLayerOrderToFrames();
  if(doRender) render();
}

function changeDisplayOrder(delta){
  if(!selectedLayer) return;
  const frame = currentFrameData();
  const order = getFrameLayerOrder(frame);
  const index = order.indexOf(selectedLayer);
  if(index < 0) return;
  const currentNo = index + 1;
  setLayerNumber(selectedLayer, currentNo + (delta > 0 ? 1 : -1), true, true);
}

function exportJSON(showAlert=false){
  jsonAreaEl.value = JSON.stringify(project, null, 2);
  if(showAlert) alert('JSONを出力しました');
}
function applyJSON(){
  try{
    const data = JSON.parse(jsonAreaEl.value);
    if(!data.layers || !data.layerOrder || (!data.defaultFrame && !data.frames)) throw new Error('layers / layerOrder / defaultFrame（旧JSONはframes）が必要です');
    pushHistory();
    project = data;
    onionSkinRenderKey='';
    ensureProjectSettings();
    if(!project.meta) project.meta = {fps:8, editMode:'rotate'};
    if(!project.meta.editMode) project.meta.editMode = 'rotate';
    currentAnimationId = null;
    currentFrame = 0;
    selectedLayer = null;
    lastDefaultFrameSnapshot=clone(project.defaultFrame);
    stop();
    render();
    alert('JSONを読み込みました');
  } catch(err){ alert('JSON読込エラー: ' + err.message); }
}
function downloadJSON(){
  exportJSON(false);
  const blob = new Blob([jsonAreaEl.value], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (project.meta.name || 'motion_editor_project') + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function safeExportFileName(value,fallback='motion'){
  const cleaned=String(value || fallback).trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g,'_').replace(/[. ]+$/g,'');
  return cleaned || fallback;
}

function canvasBlob(canvas,type='image/png'){
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob ? resolve(blob) : reject(new Error('画像データを作成できませんでした。')),type));
}

function downloadExportBlob(blob,fileName){
  const link=document.createElement('a');
  link.href=URL.createObjectURL(blob);
  link.download=fileName;
  link.click();
  setTimeout(()=>URL.revokeObjectURL(link.href),1000);
}

const zipCrcTable=Array.from({length:256},(_,value)=>{
  let crc=value;
  for(let bit=0;bit<8;bit++) crc=(crc&1) ? (0xedb88320^(crc>>>1)) : (crc>>>1);
  return crc>>>0;
});

function zipCrc32(bytes){
  let crc=0xffffffff;
  for(const byte of bytes) crc=zipCrcTable[(crc^byte)&0xff]^(crc>>>8);
  return (crc^0xffffffff)>>>0;
}

function writeZipUint16(view,offset,value){ view.setUint16(offset,value,true); }
function writeZipUint32(view,offset,value){ view.setUint32(offset,value>>>0,true); }

async function createStoredZip(files){
  const encoder=new TextEncoder();
  const now=new Date();
  const dosTime=((now.getHours()&31)<<11)|((now.getMinutes()&63)<<5)|((Math.floor(now.getSeconds()/2))&31);
  const dosDate=(((Math.max(1980,now.getFullYear())-1980)&127)<<9)|(((now.getMonth()+1)&15)<<5)|(now.getDate()&31);
  const entries=[];
  let localSize=0;
  for(const file of files){
    const name=encoder.encode(file.name.replaceAll('\\','/'));
    const data=new Uint8Array(await file.blob.arrayBuffer());
    const entry={name,data,crc:zipCrc32(data),offset:localSize};
    localSize+=30+name.length+data.length;
    entries.push(entry);
  }
  const centralSize=entries.reduce((sum,entry)=>sum+46+entry.name.length,0);
  const output=new Uint8Array(localSize+centralSize+22);
  const view=new DataView(output.buffer);
  let offset=0;
  for(const entry of entries){
    writeZipUint32(view,offset,0x04034b50); writeZipUint16(view,offset+4,20); writeZipUint16(view,offset+6,0x0800);
    writeZipUint16(view,offset+8,0); writeZipUint16(view,offset+10,dosTime); writeZipUint16(view,offset+12,dosDate);
    writeZipUint32(view,offset+14,entry.crc); writeZipUint32(view,offset+18,entry.data.length); writeZipUint32(view,offset+22,entry.data.length);
    writeZipUint16(view,offset+26,entry.name.length); writeZipUint16(view,offset+28,0);
    output.set(entry.name,offset+30); output.set(entry.data,offset+30+entry.name.length);
    offset+=30+entry.name.length+entry.data.length;
  }
  const centralOffset=offset;
  for(const entry of entries){
    writeZipUint32(view,offset,0x02014b50); writeZipUint16(view,offset+4,20); writeZipUint16(view,offset+6,20);
    writeZipUint16(view,offset+8,0x0800); writeZipUint16(view,offset+10,0); writeZipUint16(view,offset+12,dosTime); writeZipUint16(view,offset+14,dosDate);
    writeZipUint32(view,offset+16,entry.crc); writeZipUint32(view,offset+20,entry.data.length); writeZipUint32(view,offset+24,entry.data.length);
    writeZipUint16(view,offset+28,entry.name.length); writeZipUint16(view,offset+30,0); writeZipUint16(view,offset+32,0);
    writeZipUint16(view,offset+34,0); writeZipUint16(view,offset+36,0); writeZipUint32(view,offset+38,0); writeZipUint32(view,offset+42,entry.offset);
    output.set(entry.name,offset+46);
    offset+=46+entry.name.length;
  }
  writeZipUint32(view,offset,0x06054b50); writeZipUint16(view,offset+4,0); writeZipUint16(view,offset+6,0);
  writeZipUint16(view,offset+8,entries.length); writeZipUint16(view,offset+10,entries.length);
  writeZipUint32(view,offset+12,centralSize); writeZipUint32(view,offset+16,centralOffset); writeZipUint16(view,offset+20,0);
  return new Blob([output],{type:'application/zip'});
}

async function renderMotionFrameImage(frame){
  const canvas=document.createElement('canvas');
  canvas.width=1000;
  canvas.height=1000;
  const context=canvas.getContext('2d');
  const world=getWorldState(frame);
  const imageDisplayScale=Math.max(.5,Math.min(2.5,Number(project.meta.imageDisplayScale)||1));
  const imageDisplayOrigin=world[getRootId()] || null;
  const items=[];

  project.layerOrder.filter(isLayerActiveForCurrentAnimation).forEach((id,index)=>{
    if(frame[id]) items.push({type:'bone',id,z:sharedLayerNoForBone(id),index,meshComposited:!!findMeshBindingForBone(id)});
  });
  Object.values(project.meshBindings || {}).forEach((binding,index)=>{
    ensureMeshBinding(binding);
    const hasFrameBone=binding.boneChain?.some(id=>frame[id]);
    if(binding.enabled!==false && hasFrameBone && binding.boneChain.every(isLayerActiveForCurrentAnimation)){
      items.push({type:'mesh',binding,z:meshRenderLayerNo(binding),index:project.layerOrder.length+index});
    }
  });

  const imageJobs=[];
  for(const item of items){
    if(item.type==='bone'){
      const data=item.meshComposited ? null : getLayerRenderImageData(visualLayerForPose(project.layers[item.id],frame[item.id]));
      if(data) imageJobs.push(loadOnionImage(data).then(image=>{item.image=image;}));
    }else{
      const sourceId=activeImageSlotSourceId(item.binding.imageSourceSlot)||item.binding.sourceId;
      const data=project.imageSources?.[sourceId]?.data;
      if(data) imageJobs.push(loadOnionImage(data).then(image=>{item.image=image;}));
    }
  }
  await Promise.all(imageJobs);

  items.sort((a,b)=>a.z-b.z || a.index-b.index);
  for(const item of items){
    if(item.type==='bone'){
      const state=world[item.id];
      if(state && item.image) drawOnionBoneImage(context,state,item.image,imageDisplayScale,imageDisplayOrigin);
    }else if(item.image){
      const temporary=document.createElement('canvas');
      temporary.width=1000;
      temporary.height=1000;
      drawMeshBinding(temporary,item.binding,world,item.image,frame);
      context.save();
      if(imageDisplayScale!==1 && imageDisplayOrigin){
        context.translate(imageDisplayOrigin.anchorX,imageDisplayOrigin.anchorY);
        context.scale(imageDisplayScale,imageDisplayScale);
        context.translate(-imageDisplayOrigin.anchorX,-imageDisplayOrigin.anchorY);
      }
      context.imageSmoothingEnabled=true;
      context.imageSmoothingQuality='high';
      context.drawImage(temporary,0,0,temporary.width,temporary.height,0,0,1000,1000);
      context.restore();
    }
  }
  return canvas;
}

function canvasOpaqueBounds(canvas){
  const {width,height}=canvas;
  const data=canvas.getContext('2d').getImageData(0,0,width,height).data;
  let left=width,top=height,right=-1,bottom=-1;
  for(let y=0;y<height;y++){
    for(let x=0;x<width;x++){
      if(data[(y*width+x)*4+3]===0) continue;
      if(x<left) left=x;
      if(x>right) right=x;
      if(y<top) top=y;
      if(y>bottom) bottom=y;
    }
  }
  return right<left ? null : {left,top,right,bottom,width:right-left+1,height:bottom-top+1};
}

function updateSpriteExportDialog(){
  const animations=project.animations || [];
  if(!animations.length){
    spriteExportSummaryEl.textContent='書き出せるモーションがありません。';
    spriteExportRunBtn.disabled=true;
    return;
  }
  const totalFrames=animations.reduce((sum,animation)=>sum+animation.frames.length,0);
  spriteExportSummaryEl.textContent=`${animations.length}モーション / 合計${totalFrames}コマを、モーションごとのPNGとして保存します。`;
  spriteExportRunBtn.disabled=false;
}

async function createMotionSpriteSheet(animation,scale,padding){
  const frameCanvases=[];
  let bounds=null;
  for(const frame of animation.frames){
    const canvas=await renderMotionFrameImage(frame);
    const frameBounds=canvasOpaqueBounds(canvas);
    frameCanvases.push(canvas);
    if(!frameBounds) continue;
    bounds=bounds ? {
      left:Math.min(bounds.left,frameBounds.left),
      top:Math.min(bounds.top,frameBounds.top),
      right:Math.max(bounds.right,frameBounds.right),
      bottom:Math.max(bounds.bottom,frameBounds.bottom)
    } : {...frameBounds};
  }
  if(!bounds) throw new Error(`「${animation.name}」に書き出せる画像がありません。`);
  bounds.width=bounds.right-bounds.left+1;
  bounds.height=bounds.bottom-bounds.top+1;

  const frameWidth=Math.max(1,Math.ceil(bounds.width*scale)+padding*2);
  const frameHeight=Math.max(1,Math.ceil(bounds.height*scale)+padding*2);
  const columns=frameCanvases.length;
  const sheet=document.createElement('canvas');
  sheet.width=frameWidth*columns;
  sheet.height=frameHeight;
  if(sheet.width>16384 || sheet.height>16384) throw new Error(`「${animation.name}」の出力画像が大きすぎます。出力倍率を下げてください。`);
  const context=sheet.getContext('2d');
  frameCanvases.forEach((canvas,index)=>{
    context.drawImage(canvas,bounds.left,bounds.top,bounds.width,bounds.height,index*frameWidth+padding,padding,Math.ceil(bounds.width*scale),Math.ceil(bounds.height*scale));
  });
  return {sheet,frameWidth,frameHeight,columns};
}

async function exportAllMotionSprites(){
  const animations=project.animations || [];
  if(!animations.length) return;
  stop();
  spriteExportRunBtn.disabled=true;
  spriteExportStatusEl.classList.remove('is-error');
  spriteExportStatusEl.textContent='画像を作成しています…';
  const previousAnimationId=currentAnimationId;
  const previousFrame=currentFrame;
  try{
    const scale=Math.max(.1,Math.min(2,(Number(document.getElementById('spriteExportScaleInput').value)||100)/100));
    const padding=Math.max(0,Math.min(100,Math.round(Number(document.getElementById('spriteExportPaddingInput').value)||0)));
    const folderName=`${safeExportFileName(project.meta.name,'motion')}_sprites`;
    const files=[];
    for(let index=0;index<animations.length;index++){
      const animation=animations[index];
      spriteExportStatusEl.textContent=`画像を作成しています… ${index+1}/${animations.length} ${animation.name}`;
      currentAnimationId=animation.id;
      currentFrame=0;
      const {sheet,frameWidth,frameHeight,columns}=await createMotionSpriteSheet(animation,scale,padding);
      const imageFileName=`${safeExportFileName(animation.name,`animation_${index+1}`)}.png`;
      files.push({name:`${folderName}/${imageFileName}`,blob:await canvasBlob(sheet),frameWidth,frameHeight,columns});
    }
    const zipFileName=`${folderName}.zip`;
    downloadExportBlob(await createStoredZip(files),zipFileName);
    spriteExportStatusEl.textContent=`${zipFileName}をダウンロードしました（${files.length}モーション）。`;
  }catch(error){
    spriteExportStatusEl.textContent=`書き出しに失敗しました: ${error.message}`;
    spriteExportStatusEl.classList.add('is-error');
  }finally{
    currentAnimationId=previousAnimationId;
    currentFrame=previousFrame;
    spriteExportRunBtn.disabled=!(project.animations || []).length;
    render();
  }
}

function downloadMaterialGuide(){
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1200;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = 'rgba(103,185,255,.18)';
  context.lineWidth = 1;
  for(let position = 0; position <= 1200; position += 40){
    context.beginPath(); context.moveTo(position, 0); context.lineTo(position, 1200); context.stroke();
    context.beginPath(); context.moveTo(0, position); context.lineTo(1200, position); context.stroke();
  }

  const scale = 1.1;
  const offset = 50;
  const world = getWorldState(currentFrameData());
  for(const id of getFrameLayerOrder()){
    const state = world[id];
    if(!state) continue;
    const layer = state.layer;
    const pose = state.pose;
    const color = layer.color || defaultBoneColor(layer.key || layer.name || 'bone');
    const anchorX = state.left + layer.ox * pose.w;
    const anchorY = state.top + layer.oy * pose.h;
    context.save();
    context.translate(offset + anchorX * scale, offset + anchorY * scale);
    context.rotate(state.rotation * Math.PI / 180);
    context.translate(-layer.ox * pose.w * scale, -layer.oy * pose.h * scale);
    context.fillStyle = `${color}55`;
    context.strokeStyle = color;
    context.lineWidth = 3;
    const width = pose.w * scale;
    const height = pose.h * scale;
    if(layer.shape === 'circle'){
      context.beginPath();
      context.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
      context.fill(); context.stroke();
    }else{
      const radius = Math.min(width, height) * (layer.shape === 'torso' ? .2 : .45);
      context.beginPath();
      context.roundRect(0, 0, width, height, radius);
      context.fill(); context.stroke();
    }
    context.fillStyle = color;
    context.beginPath();
    context.arc(layer.ox * width, layer.oy * height, 6, 0, Math.PI * 2);
    context.fill();
    context.restore();

    context.font = '700 18px sans-serif';
    context.fillStyle = '#eaf7ff';
    context.strokeStyle = 'rgba(3,8,13,.88)';
    context.lineWidth = 5;
    const labelX = offset + (state.left + pose.w + 7) * scale;
    const labelY = offset + (state.top + 18) * scale;
    context.strokeText(layer.name, labelX, labelY);
    context.fillText(layer.name, labelX, labelY);
  }

  context.fillStyle = '#dce7f1';
  context.font = '700 18px sans-serif';
  context.fillText('素材作成ガイド / 現在フレームのボーン範囲', 24, 32);
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = `${project.meta.name || 'motion'}_material-guide_frame-${currentFrame + 1}.png`;
  link.click();
}
function resetHumanoid(){
  initializeProject(true);
}



function initCollapsibleInspectorSections(){
  const scroll = document.querySelector('.inspector-scroll');
  if(!scroll || scroll.dataset.collapsibleReady === '1') return;

  let saved = {};
  try{ saved = JSON.parse(localStorage.getItem(INSPECTOR_COLLAPSE_KEY) || '{}'); }catch(e){}

  const headers = [...scroll.querySelectorAll(':scope > .section-label')];
  headers.forEach((header, index) => {
    const key =
      header.classList.contains('section-basic') ? 'basic' :
      header.classList.contains('section-connect') ? 'connect' :
      header.classList.contains('section-pose') ? 'pose' :
      header.classList.contains('section-image') ? 'image' :
      `section${index}`;

    header.dataset.sectionKey = key;
    header.setAttribute('role', 'button');
    header.setAttribute('tabindex', '0');

    const content = document.createElement('div');
    content.className = 'section-content';
    content.dataset.sectionKey = key;

    let node = header.nextSibling;
    while(node){
      const next = node.nextSibling;
      if(node.nodeType === 1 && node.classList?.contains('section-label')) break;
      content.appendChild(node);
      node = next;
    }
    header.after(content);

    const collapsed = !!saved[key];
    header.classList.toggle('collapsed', collapsed);
    content.classList.toggle('collapsed', collapsed);
    header.setAttribute('aria-expanded', collapsed ? 'false' : 'true');

    const toggle = () => {
      const willCollapse = !header.classList.contains('collapsed');
      header.classList.toggle('collapsed', willCollapse);
      content.classList.toggle('collapsed', willCollapse);
      header.setAttribute('aria-expanded', willCollapse ? 'false' : 'true');

      let state = {};
      try{ state = JSON.parse(localStorage.getItem(INSPECTOR_COLLAPSE_KEY) || '{}'); }catch(e){}
      state[key] = willCollapse;
      try{ localStorage.setItem(INSPECTOR_COLLAPSE_KEY, JSON.stringify(state)); }catch(e){}
    };

    header.addEventListener('click', toggle);
    header.addEventListener('keydown', e => {
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        toggle();
      }
    });
  });

  scroll.dataset.collapsibleReady = '1';
}


function initViewportSafeTooltips(){
  // script実行時点でHTML末尾のtooltip要素がまだ生成されていない場合があるため、
  // 必要ならここで確実に作成する。
  let tip = document.getElementById('floatingTooltip');
  if(!tip){
    tip = document.createElement('div');
    tip.id = 'floatingTooltip';
    tip.className = 'floating-tooltip';
    tip.setAttribute('role','tooltip');
    document.body.appendChild(tip);
  }

  let active = null;

  const hide = () => {
    active = null;
    tip.classList.remove('visible');
  };

  const show = el => {
    const message = el?.dataset?.tooltip;
    if(!message) return;
    active = el;
    tip.textContent = message;
    tip.classList.add('visible');

    // サイズ計測後、必ずviewport内へクランプ。
    const target = el.getBoundingClientRect();
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;
    const margin = 8;
    const gap = 8;

    let left = target.left + target.width / 2 - tw / 2;
    left = Math.max(margin, Math.min(window.innerWidth - tw - margin, left));

    let top = target.bottom + gap;
    if(top + th > window.innerHeight - margin){
      top = target.top - th - gap;
    }
    top = Math.max(margin, Math.min(window.innerHeight - th - margin, top));

    tip.style.left = `${Math.round(left)}px`;
    tip.style.top = `${Math.round(top)}px`;
  };

  document.addEventListener('pointerover', e => {
    const el = e.target.closest?.('[data-tooltip]');
    if(el) show(el);
  });
  document.addEventListener('pointerout', e => {
    if(!active) return;
    const next = e.relatedTarget;
    if(next && active.contains(next)) return;
    if(e.target === active || active.contains(e.target)) hide();
  });
  document.addEventListener('focusin', e => {
    const el = e.target.closest?.('[data-tooltip]');
    if(el) show(el);
  });
  document.addEventListener('focusout', hide);
  window.addEventListener('scroll', hide, true);
  window.addEventListener('resize', () => active ? show(active) : null);
}

function clampPanelWidth(value, min, max){
  return Math.max(min, Math.min(max, value));
}
function applyPanelWidths(bonesWidth, inspectorWidth, persist=true){
  const maxBones = Math.max(220, Math.min(460, window.innerWidth * 0.46));
  const maxInspector = Math.max(280, Math.min(520, window.innerWidth * 0.48));
  const bw = clampPanelWidth(Number(bonesWidth) || 250, 180, maxBones);
  const iw = clampPanelWidth(Number(inspectorWidth) || 340, 260, maxInspector);
  document.documentElement.style.setProperty('--bones-w', `${Math.round(bw)}px`);
  document.documentElement.style.setProperty('--inspector-w', `${Math.round(iw)}px`);
  if(persist){
    try{ localStorage.setItem(PANEL_LAYOUT_KEY, JSON.stringify({bonesWidth:bw, inspectorWidth:iw})); }catch(e){}
  }
}
function loadPanelWidths(){
  try{
    const saved = JSON.parse(localStorage.getItem(PANEL_LAYOUT_KEY) || '{}');
    applyPanelWidths(saved.bonesWidth || 250, saved.inspectorWidth || 340, false);
  }catch(e){
    applyPanelWidths(250, 340, false);
  }
}
function startPanelResize(e, side){
  if(e.button !== 0) return;
  e.preventDefault();
  const splitter = side === 'left' ? leftPanelResizerEl : rightPanelResizerEl;
  splitter?.classList.add('dragging');

  const startX = e.clientX;
  const styles = getComputedStyle(document.documentElement);
  const startBones = parseFloat(styles.getPropertyValue('--bones-w')) || 250;
  const startInspector = parseFloat(styles.getPropertyValue('--inspector-w')) || 340;

  const onMove = ev => {
    const dx = ev.clientX - startX;
    if(side === 'left'){
      applyPanelWidths(startBones + dx, startInspector, false);
    }else{
      applyPanelWidths(startBones, startInspector - dx, false);
    }
  };
  const onUp = () => {
    splitter?.classList.remove('dragging');
    const stylesNow = getComputedStyle(document.documentElement);
    applyPanelWidths(
      parseFloat(stylesNow.getPropertyValue('--bones-w')),
      parseFloat(stylesNow.getPropertyValue('--inspector-w')),
      true
    );
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
  };
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
}
initViewportSafeTooltips();
initCollapsibleInspectorSections();
loadPanelWidths();
leftPanelResizerEl?.addEventListener('pointerdown', e=>startPanelResize(e,'left'));
rightPanelResizerEl?.addEventListener('pointerdown', e=>startPanelResize(e,'right'));
leftPanelResizerEl?.addEventListener('dblclick', ()=>applyPanelWidths(250, parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--inspector-w')) || 340));
rightPanelResizerEl?.addEventListener('dblclick', ()=>applyPanelWidths(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bones-w')) || 250, 340));
window.addEventListener('resize', ()=>{
  const s = getComputedStyle(document.documentElement);
  applyPanelWidths(parseFloat(s.getPropertyValue('--bones-w')), parseFloat(s.getPropertyValue('--inspector-w')), false);
});

render();

undoBtn?.addEventListener('click', undo);
redoBtn?.addEventListener('click', redo);
document.getElementById('playBtn').addEventListener('click', togglePlay);
document.getElementById('prevBtn').addEventListener('click', ()=>{ const frames=activeFrames(); stop(); currentFrame = (currentFrame - 1 + frames.length) % frames.length; render(); });
document.getElementById('nextBtn').addEventListener('click', ()=>{ const frames=activeFrames(); stop(); currentFrame = (currentFrame + 1) % frames.length; render(); });
document.getElementById('fpsInput').addEventListener('change', ()=>{ const animation=currentAnimation(); if(!animation) return; animation.fps = Math.max(1, parseInt(document.getElementById('fpsInput').value, 10) || 8); if(playing) play(); saveProject(); });
editModeSelectEl.addEventListener('change', e => { project.meta.editMode = e.target.value; render(); });

[['showLabels','labels'],['showAnchors','anchors'],['showLines','lines'],['showBones','bones'],['showImages','images'],['showOnionSkin','onionSkin'],['showCenterGuides','centerGuides']].forEach(([id, key]) => {
  document.getElementById(id).addEventListener('change', e => {
    ensureProjectSettings(); project.meta.display[key] = e.target.checked;
    if(key==='onionSkin') onionSkinRenderKey='';
    render();
  });
});


let cropEditorState = null;
let cropPointerState = null;
let cropPanPointer = null;
let cropRotationPointerState = null;
let cropPreviewVersion = 0;

function loadDataImage(data){
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('画像を読み込めませんでした。'));
    image.src = data;
  });
}

function normalizedRotation(value){
  const rotation = Number(value) || 0;
  return Math.max(-180, Math.min(180, rotation));
}

async function createRotatedSourceData(data, rotation, flipX=false, flipY=false){
  const image = await loadDataImage(data);
  const radians = normalizedRotation(rotation) * Math.PI / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  const width = Math.max(1, Math.ceil(image.naturalWidth * cos + image.naturalHeight * sin));
  const height = Math.max(1, Math.ceil(image.naturalWidth * sin + image.naturalHeight * cos));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  context.translate(width / 2, height / 2);
  context.rotate(radians);
  context.scale(flipX ? -1 : 1, flipY ? -1 : 1);
  context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
  return canvas.toDataURL('image/png');
}

async function refreshCropPreview(){
  if(!cropEditorState) return;
  const source = project.imageSources?.[cropEditorState.sourceId];
  if(!source?.data) return;
  const version = ++cropPreviewVersion;
  const previewData = await createRotatedSourceData(
    source.data,
    cropEditorState.rotation,
    cropEditorState.flipX,
    cropEditorState.flipY
  );
  if(!cropEditorState || version !== cropPreviewVersion) return;
  cropEditorState.previewData = previewData;
  cropEditorImageEl.style.transform = '';
  cropEditorImageEl.onload = fitCropPreviewImage;
  cropEditorImageEl.src = previewData;
  const input = document.getElementById('cropRotationInput');
  if(input && document.activeElement !== input) input.value = String(cropEditorState.rotation);
  if(cropHeaderRotationValueEl) cropHeaderRotationValueEl.textContent = `${Math.round(cropEditorState.rotation)}°`;
  const flipXInput = document.getElementById('cropFlipXInput');
  const flipYInput = document.getElementById('cropFlipYInput');
  if(flipXInput) flipXInput.checked = cropEditorState.flipX;
  if(flipYInput) flipYInput.checked = cropEditorState.flipY;
  requestAnimationFrame(fitCropPreviewImage);
}

async function createCropFragment(previewData, crop){
  const image = await loadDataImage(previewData);
  const normalized = normalizeCrop({...crop});
  const sx = Math.floor(normalized.x * image.naturalWidth);
  const sy = Math.floor(normalized.y * image.naturalHeight);
  const sw = Math.max(1, Math.round(normalized.w * image.naturalWidth));
  const sh = Math.max(1, Math.round(normalized.h * image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  canvas.getContext('2d').drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);
  return canvas.toDataURL('image/png');
}

function cropForLayer(layer){
  ensureImageCrop(layer);
  return {
    x:Number(layer.imageCropX) || 0,
    y:Number(layer.imageCropY) || 0,
    w:Number(layer.imageCropW) || 1,
    h:Number(layer.imageCropH) || 1
  };
}

function normalizeCrop(crop){
  crop.x = Math.max(0, Math.min(0.99, Number(crop.x) || 0));
  crop.y = Math.max(0, Math.min(0.99, Number(crop.y) || 0));
  crop.w = Math.max(0.01, Math.min(1 - crop.x, Number(crop.w) || 1));
  crop.h = Math.max(0.01, Math.min(1 - crop.y, Number(crop.h) || 1));
  return crop;
}

function applyHorizontalRangeToSharedCrops(x, width, activeId=cropEditorState?.currentBoneId){
  if(!cropEditorState) return;
  const horizontal = normalizeCrop({x, y:0, w:width, h:1});
  for(const id of horizontalCropPeerIds(activeId)){
    if(id === activeId) continue;
    const crop = cropEditorState.crops[id];
    if(crop){
      crop.x = horizontal.x;
      crop.w = horizontal.w;
      normalizeCrop(crop);
    }
  }
}

function currentCrop(){
  if(!cropEditorState) return null;
  return cropEditorState.crops[cropEditorState.currentBoneId] || null;
}

function fitCropPreviewImage(){
  if(!cropEditorState || !cropEditorImageEl?.naturalWidth) return;
  const area = document.getElementById('cropPreviewArea');
  const aw = Math.max(100, area.clientWidth - 36);
  const ah = Math.max(100, area.clientHeight - 36);
  const nw = cropEditorImageEl.naturalWidth;
  const nh = cropEditorImageEl.naturalHeight;
  const scale = Math.min(aw / nw, ah / nh, 1) * (cropEditorState.zoom || 1);
  cropImageFrameEl.style.width = `${Math.max(40, Math.round(nw * scale))}px`;
  cropImageFrameEl.style.height = `${Math.max(40, Math.round(nh * scale))}px`;
  area.classList.toggle('is-zoomed', (cropEditorState.zoom || 1) > 1);
  if(cropZoomValueEl) cropZoomValueEl.textContent = `${Math.round((cropEditorState.zoom || 1) * 100)}%`;
  renderCropSelections();
}

function setCropWidthAroundCenter(crop, requestedWidth, center=crop.x + crop.w / 2){
  const minSize = 0.02;
  const maxWidth = Math.max(minSize, 2 * Math.min(center, 1 - center));
  crop.w = Math.max(minSize, Math.min(maxWidth, Number(requestedWidth) || minSize));
  crop.x = center - crop.w / 2;
  normalizeCrop(crop);
}

function renderCropSelections(){
  if(!cropEditorState || !cropSelectionsEl) return;
  cropSelectionsEl.innerHTML = '';
  project.layerOrder.filter(id => cropEditorState.shared.has(id)).forEach(id => {
    const crop = normalizeCrop(cropEditorState.crops[id] || {x:0,y:0,w:1,h:1});
    cropEditorState.crops[id] = crop;
    const layer = project.layers[id];
    const selection = document.createElement('div');
    selection.className = `crop-selection${id === cropEditorState.currentBoneId ? ' active' : ''}`;
    selection.dataset.boneId = id;
    selection.style.setProperty('--crop-color', layer?.color || defaultBoneColor(id));
    selection.style.left = `${crop.x * 100}%`;
    selection.style.top = `${crop.y * 100}%`;
    selection.style.width = `${crop.w * 100}%`;
    selection.style.height = `${crop.h * 100}%`;
    selection.innerHTML = `<span class="crop-selection-label">${layer?.name || id}</span>${id === cropEditorState.currentBoneId ? '<span class="crop-handle tl" data-handle="tl"></span><span class="crop-handle tr" data-handle="tr"></span><span class="crop-handle bl" data-handle="bl"></span><span class="crop-handle br" data-handle="br"></span>' : ''}`;
    cropSelectionsEl.appendChild(selection);
  });

  const crop = currentCrop();
  if(!crop) return;
  const widthNote = document.getElementById('cropGroupWidthNote');
  if(widthNote){
    const peerCount = horizontalCropPeerIds().length;
    widthNote.textContent = cropEditorState.groupHorizontalByPart
      ? `X位置・W横幅は同じ基本パーツ内の${peerCount}部位で共通`
      : `X位置・W横幅は使用中の${peerCount}部位で共通`;
  }

  const ids = ['cropXInput','cropYInput','cropWInput','cropHInput'];
  const vals = [crop.x,crop.y,crop.w,crop.h].map(v => (v * 100).toFixed(1).replace(/\.0$/,''));
  ids.forEach((id,i) => {
    const el = document.getElementById(id);
    if(el && document.activeElement !== el) el.value = vals[i];
  });
}

// ドラッグ中はDOMを作り直さない。枠を再生成するとpointer captureが失われ、
// 大きな画像ではカーソルとの追従が遅れて見えるため、既存枠の座標だけを更新する。
function updateCropSelectionPositions(){
  if(!cropEditorState || !cropSelectionsEl) return;
  project.layerOrder.filter(id=>cropEditorState.shared.has(id)).forEach(id=>{
    const crop=normalizeCrop(cropEditorState.crops[id] || {x:0,y:0,w:1,h:1});
    cropEditorState.crops[id]=crop;
    const selection=cropSelectionsEl.querySelector(`.crop-selection[data-bone-id="${id}"]`);
    if(!selection) return;
    selection.style.left=`${crop.x*100}%`;
    selection.style.top=`${crop.y*100}%`;
    selection.style.width=`${crop.w*100}%`;
    selection.style.height=`${crop.h*100}%`;
  });
  const crop=currentCrop();
  if(!crop) return;
  const vals=[crop.x,crop.y,crop.w,crop.h].map(v=>(v*100).toFixed(1).replace(/\.0$/,''));
  ['cropXInput','cropYInput','cropWInput','cropHInput'].forEach((id,index)=>{
    const input=document.getElementById(id);
    if(input && document.activeElement!==input) input.value=vals[index];
  });
}

function rebuildCropBoneSelect(preferredId=null){
  if(!cropEditorState || !cropBoneSelectEl) return;
  const ids = project.layerOrder.filter(id => cropEditorState.shared.has(id));
  cropBoneSelectEl.innerHTML = '';
  ids.forEach(id => {
    const op = document.createElement('option');
    op.value = id;
    op.textContent = project.layers[id]?.name || id;
    cropBoneSelectEl.appendChild(op);
  });

  let next = preferredId && cropEditorState.shared.has(preferredId) ? preferredId : cropEditorState.currentBoneId;
  if(!next || !cropEditorState.shared.has(next)) next = ids[0] || null;
  cropEditorState.currentBoneId = next;
  if(next) cropBoneSelectEl.value = next;
  renderCropSelections();
  rebuildCropBoneChecks();
}

function rebuildCropBoneChecks(){
  if(!cropEditorState || !cropBoneChecksEl) return;
  cropBoneChecksEl.innerHTML = '';
  project.layerOrder.filter(id => !cropEditorState.availableIds || cropEditorState.availableIds.has(id)).forEach(id => {
    const layer = project.layers[id];
    const label = document.createElement('label');
    label.className = `crop-bone-check${id === cropEditorState.currentBoneId ? ' active' : ''}`;
    label.style.setProperty('--crop-color', layer?.color || defaultBoneColor(id));

    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = cropEditorState.shared.has(id);

    const text = document.createElement('span');
    text.textContent = layer?.name || id;
    text.title = 'この部位の範囲を編集';
    text.addEventListener('click', event => {
      event.preventDefault();
      if(!cropEditorState.shared.has(id)){
        check.checked = true;
        check.dispatchEvent(new Event('change'));
        return;
      }
      cropEditorState.currentBoneId = id;
      rebuildCropBoneSelect(id);
    });

    check.addEventListener('change', () => {
      if(check.checked){
        const horizontalSource = currentCrop() ? {x:currentCrop().x, w:currentCrop().w} : {x:0,w:1};
        const activeGroupId = getPartGroupIdForLayer(cropEditorState.currentBoneId);
        const shareHorizontal = !cropEditorState.groupHorizontalByPart || activeGroupId === getPartGroupIdForLayer(id);
        cropEditorState.shared.add(id);
        if(!cropEditorState.crops[id]){
          cropEditorState.crops[id] = layer?.imageSourceId === cropEditorState.sourceId
            ? cropForLayer(layer)
            : {x:0,y:0,w:1,h:1};
        }
        if(shareHorizontal){
          cropEditorState.crops[id].x = horizontalSource.x;
          cropEditorState.crops[id].w = horizontalSource.w;
        }
        normalizeCrop(cropEditorState.crops[id]);
        rebuildCropBoneSelect(id);
      }else{
        cropEditorState.shared.delete(id);
        rebuildCropBoneSelect(cropEditorState.currentBoneId === id ? null : cropEditorState.currentBoneId);
      }
      rebuildCropBoneChecks();
    });

    label.appendChild(check);
    label.appendChild(text);
    cropBoneChecksEl.appendChild(label);
  });
}

function openImageCropEditor(){
  const layer = currentLayer();
  if(!layer) return;
  const morph=activeBoneMorph(layer,currentPose());
  if(morph){
    const source=project.imageSources?.[morph.imageSourceId];
    if(!source?.data){ alert('モーフ画像を選択してください。'); return; }
    cropEditorState={sourceId:morph.imageSourceId,sourceSlot:null,currentBoneId:selectedLayer,availableIds:new Set([selectedLayer]),shared:new Set([selectedLayer]),crops:{[selectedLayer]:cropForLayer(morph)},rotation:normalizedRotation(morph.imageCropRotation ?? source.cropRotation),flipX:morph.imageCropFlipX ?? !!source.cropFlipX,flipY:morph.imageCropFlipY ?? !!source.cropFlipY,zoom:1,symmetricX:false,groupHorizontalByPart:false,morphId:morph.id};
    cropSourceLabelEl.textContent=`モーフ「${morph.id}」: ${source.name || '画像'}`;
    const removeAllButton=document.getElementById('imageCropRemoveAllBtn');
    if(removeAllButton) removeAllButton.hidden=true;
    rebuildCropBoneChecks(); rebuildCropBoneSelect(selectedLayer);
    if(typeof imageCropDialogEl?.showModal==='function'){ imageCropDialogEl.showModal(); refreshCropPreview().catch(error=>alert(error.message)); }
    return;
  }
  const ownSourceId=ensureLayerImageSource(layer);
  const removeAllButton=document.getElementById('imageCropRemoveAllBtn');
  if(removeAllButton) removeAllButton.hidden=false;
  const sourceSlot=layer.imageSourceSlot || (!ownSourceId && activeImageSlotSourceId('body') ? 'body' : null);
  const sourceId = activeImageSlotSourceId(sourceSlot) || ownSourceId || project.baseImageSourceId;
  const source = sourceId ? project.imageSources?.[sourceId] : null;
  if(!source?.data){
    alert('先に画像をセットしてください。');
    return;
  }

  const usesImageSlot = !!sourceSlot || sourceId === project.baseImageSourceId;
  const selectedGroupId = usesImageSlot ? getPartGroupIdForLayer(selectedLayer) : null;
  const selectedGroup = selectedGroupId ? project.partGroups?.[selectedGroupId] : null;
  const availableIds = new Set(selectedGroup?.boneIds?.filter(id => project.layers[id]) || project.layerOrder);
  const shared = new Set();
  const crops = {};
  project.layerOrder.forEach(id => {
    if(!availableIds.has(id)) return;
    const l = project.layers[id];
    ensureImageCrop(l);
    if((sourceSlot && l.imageSourceSlot===sourceSlot) || (!sourceSlot && l.imageSourceId === sourceId)){
      shared.add(id);
      crops[id] = cropForLayer(l);
    }
  });
  shared.add(selectedLayer);
  if(!crops[selectedLayer]) crops[selectedLayer] = cropForLayer(layer);

  cropEditorState = {
    sourceId,
    sourceSlot,
    currentBoneId:selectedLayer,
    availableIds,
    shared,
    crops,
    rotation:normalizedRotation(source.cropRotation),
    flipX:!!source.cropFlipX,
    flipY:!!source.cropFlipY,
    zoom:1,
    symmetricX:true,
    groupHorizontalByPart:usesImageSlot
  };
  const selectedCrop = cropEditorState.crops[selectedLayer];
  if(selectedCrop) applyHorizontalRangeToSharedCrops(selectedCrop.x, selectedCrop.w, selectedLayer);

  const slotLabel=IMAGE_SLOT_DEFS.find(def=>def.id===sourceSlot)?.label;
  cropSourceLabelEl.textContent = `${slotLabel ? `${slotLabel}: ` : ''}${source.name || '画像'}`;
  const symmetricInput = document.getElementById('cropSymmetricXInput');
  if(symmetricInput) symmetricInput.checked = cropEditorState.symmetricX;
  rebuildCropBoneChecks();
  rebuildCropBoneSelect(selectedLayer);

  if(typeof imageCropDialogEl?.showModal === 'function'){
    imageCropDialogEl.showModal();
    refreshCropPreview().catch(error => alert(error.message));
  }
}

function closeImageCropEditor(){
  cropEditorState = null;
  cropPointerState = null;
  cropPanPointer = null;
  cropRotationPointerState = null;
  imageCropDialogEl?.close();
}

async function applyImageCropEditor(){
  if(!cropEditorState) return;
  pushHistory();

  const source = project.imageSources?.[cropEditorState.sourceId];
  // モーフの範囲調整は元画像・共有スロットの回転や反転を変更しない。
  if(!cropEditorState.morphId && source){
    source.cropRotation = normalizedRotation(cropEditorState.rotation);
    source.cropFlipX = !!cropEditorState.flipX;
    source.cropFlipY = !!cropEditorState.flipY;
  }
  if(!cropEditorState.morphId && cropEditorState.sourceSlot){
    const slot=project.imageSlots[cropEditorState.sourceSlot];
    slot.cropRotation=normalizedRotation(cropEditorState.rotation);
    slot.cropFlipX=!!cropEditorState.flipX;
    slot.cropFlipY=!!cropEditorState.flipY;
    syncSlotTransform(cropEditorState.sourceSlot);
  }
  if(!cropEditorState.previewData){
    try{
      await refreshCropPreview();
    }catch(error){
      alert(error.message);
      return;
    }
  }
  if(cropEditorState.morphId){
    const morph=project.layers[selectedLayer]?.morphs?.[cropEditorState.morphId];
    if(morph){
      const crop=normalizeCrop(cropEditorState.crops[selectedLayer] || {x:0,y:0,w:1,h:1});
      Object.assign(morph,{imageSourceId:cropEditorState.sourceId,imageSourceSlot:null,imageCropX:crop.x,imageCropY:crop.y,imageCropW:crop.w,imageCropH:crop.h,imageCropRotation:normalizedRotation(cropEditorState.rotation),imageCropFlipX:!!cropEditorState.flipX,imageCropFlipY:!!cropEditorState.flipY,imageFragmentData:await createCropFragment(cropEditorState.previewData,crop)});
    }
    closeImageCropEditor(); render(); return;
  }

  for(const id of project.layerOrder){
    const layer = project.layers[id];
    if(cropEditorState.shared.has(id)){
      layer.imageSourceId = cropEditorState.sourceId;
      layer.imageSourceSlot = cropEditorState.sourceSlot || null;
      layer.imageSourceRole = cropEditorState.sourceSlot ? 'slot' : 'additional';
      layer.imageData = null;
      const crop = normalizeCrop(cropEditorState.crops[id] || {x:0,y:0,w:1,h:1});
      layer.imageCropX = crop.x;
      layer.imageCropY = crop.y;
      layer.imageCropW = crop.w;
      layer.imageCropH = crop.h;
      layer.imageFragmentData = await createCropFragment(cropEditorState.previewData, crop);
    }else if((!cropEditorState.availableIds || cropEditorState.availableIds.has(id)) && ((cropEditorState.sourceSlot && layer.imageSourceSlot===cropEditorState.sourceSlot) || (!cropEditorState.sourceSlot && layer.imageSourceId === cropEditorState.sourceId))){
      layer.imageSourceId = null;
      layer.imageSourceSlot = null;
      layer.imageSourceRole = null;
      layer.imageFragmentData = null;
    }
  }
  removeOrphanImageSource(cropEditorState.sourceId);

  closeImageCropEditor();
  render();
}

function removeCropSourceFromAllBones(){
  if(!cropEditorState) return;
  const sourceId = cropEditorState.sourceId;
  const sourceName = project.imageSources?.[sourceId]?.name || 'この画像';
  if(!confirm(`「${sourceName}」を使用している全部位から画像を外しますか？`)) return;
  pushHistory();
  project.layerOrder.forEach(id => {
    const layer = project.layers[id];
    if(layer?.imageSourceId === sourceId) clearLayerImage(layer);
  });
  removeOrphanImageSource(sourceId);
  closeImageCropEditor();
  render();
}

function updateCropFromNumberInputs(event){
  const crop = currentCrop();
  if(!crop) return;
  const requestedWidth = (parseFloat(document.getElementById('cropWInput').value) || 1) / 100;
  const requestedX = (parseFloat(document.getElementById('cropXInput').value) || 0) / 100;
  const previousCenter = crop.x + crop.w / 2;
  crop.x = requestedX;
  crop.y = (parseFloat(document.getElementById('cropYInput').value) || 0) / 100;
  crop.h = (parseFloat(document.getElementById('cropHInput').value) || 1) / 100;
  if(event?.target?.id === 'cropWInput' && cropEditorState?.symmetricX) setCropWidthAroundCenter(crop, requestedWidth, previousCenter);
  else crop.w = requestedWidth;
  normalizeCrop(crop);
  applyHorizontalRangeToSharedCrops(crop.x, crop.w);
  renderCropSelections();
}

function startCropPointer(e){
  const selection = e.target.closest?.('.crop-selection');
  const boneId = selection?.dataset.boneId;
  if(!cropEditorState || !boneId) return;
  if(cropEditorState.currentBoneId !== boneId){
    cropEditorState.currentBoneId = boneId;
    rebuildCropBoneSelect(boneId);
  }
  e.preventDefault();
  e.stopPropagation();
  const handle = e.target.closest?.('.crop-handle')?.dataset.handle || 'move';
  cropPointerState = {
    pointerId:e.pointerId,
    mode:handle,
    startX:e.clientX,
    startY:e.clientY,
    crop:{...currentCrop()},
    captureTarget:selection
  };
  selection.setPointerCapture?.(e.pointerId);
}

function moveCropPointer(e){
  if(!cropPointerState || !cropEditorState) return;
  const rect = cropImageFrameEl.getBoundingClientRect();
  if(rect.width <= 0 || rect.height <= 0) return;

  const dx = (e.clientX - cropPointerState.startX) / rect.width;
  const dy = (e.clientY - cropPointerState.startY) / rect.height;
  const s = cropPointerState.crop;
  const c = currentCrop();
  const minSize = 0.02;

  if(cropPointerState.mode === 'move'){
    c.x = Math.max(0, Math.min(1 - s.w, s.x + dx));
    c.y = Math.max(0, Math.min(1 - s.h, s.y + dy));
    c.w = s.w;
    c.h = s.h;
  }else{
    let left=s.x, top=s.y, right=s.x+s.w, bottom=s.y+s.h;
    const resizingX = cropPointerState.mode.includes('l') || cropPointerState.mode.includes('r');
    if(resizingX && cropEditorState.symmetricX){
      const width = cropPointerState.mode.includes('l') ? s.w - dx * 2 : s.w + dx * 2;
      const center = s.x + s.w / 2;
      setCropWidthAroundCenter(c, width, center);
      left = c.x;
      right = c.x + c.w;
    }else{
      if(cropPointerState.mode.includes('l')) left = Math.max(0, Math.min(right-minSize, s.x + dx));
      if(cropPointerState.mode.includes('r')) right = Math.min(1, Math.max(left+minSize, s.x+s.w + dx));
    }
    if(cropPointerState.mode.includes('t')) top = Math.max(0, Math.min(bottom-minSize, s.y + dy));
    if(cropPointerState.mode.includes('b')) bottom = Math.min(1, Math.max(top+minSize, s.y+s.h + dy));
    c.x=left; c.y=top; c.w=right-left; c.h=bottom-top;
  }

  normalizeCrop(c);
  applyHorizontalRangeToSharedCrops(c.x, c.w);
  updateCropSelectionPositions();
}

function endCropPointer(e){
  if(!cropPointerState) return;
  try{ cropPointerState.captureTarget?.releasePointerCapture?.(cropPointerState.pointerId); }catch(err){}
  cropPointerState = null;
}

function startCropPreviewPan(event){
  if(!cropEditorState || event.target.closest?.('.crop-selection,.crop-handle,.crop-image-rotate-handle')) return;
  const area=event.currentTarget;
  event.preventDefault();
  cropPanPointer={pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,scrollLeft:area.scrollLeft,scrollTop:area.scrollTop};
  area.classList.add('is-panning');
  area.setPointerCapture?.(event.pointerId);
}

function moveCropPreviewPan(event){
  if(!cropPanPointer) return;
  const area=event.currentTarget;
  area.scrollLeft=cropPanPointer.scrollLeft-(event.clientX-cropPanPointer.startX);
  area.scrollTop=cropPanPointer.scrollTop-(event.clientY-cropPanPointer.startY);
}

function endCropPreviewPan(event){
  if(!cropPanPointer) return;
  const area=event.currentTarget;
  try{ area.releasePointerCapture?.(cropPanPointer.pointerId); }catch(error){}
  cropPanPointer=null;
  area.classList.remove('is-panning');
}

function startCropRotationPointer(e){
  if(!cropEditorState) return;
  e.preventDefault();
  cropRotationPointerState = {
    pointerId:e.pointerId,
    startX:e.clientX,
    rotation:cropEditorState.rotation
  };
  cropImageRotateHandleEl?.classList.add('dragging');
  cropImageRotateHandleEl?.setPointerCapture?.(e.pointerId);
}

function moveCropRotationPointer(e){
  if(!cropRotationPointerState || !cropEditorState) return;
  const dx = e.clientX - cropRotationPointerState.startX;
  cropEditorState.rotation = normalizedRotation(cropRotationPointerState.rotation + dx * 0.5);
  const previewDelta = cropEditorState.rotation - cropRotationPointerState.rotation;
  if(cropEditorImageEl) cropEditorImageEl.style.transform = `rotate(${previewDelta}deg)`;
  if(cropHeaderRotationValueEl) cropHeaderRotationValueEl.textContent = `${Math.round(cropEditorState.rotation)}°`;
}

function endCropRotationPointer(e){
  if(!cropRotationPointerState || !cropEditorState) return;
  try{ cropImageRotateHandleEl?.releasePointerCapture?.(cropRotationPointerState.pointerId); }catch(err){}
  cropRotationPointerState = null;
  cropImageRotateHandleEl?.classList.remove('dragging');
  refreshCropPreview().catch(error => alert(error.message));
}

document.getElementById('addEmptyLayerBtn').addEventListener('click', ()=>addEmptyLayer('ボーン', document.getElementById('newLayerShapeSelect').value));
document.getElementById('resetHumanoidBtn').addEventListener('click', resetHumanoid);
document.getElementById('dupLayerBtn').addEventListener('click', duplicateLayer);
document.getElementById('delLayerBtn').addEventListener('click', deleteLayer);
document.getElementById('deleteSelectedBoneBtn')?.addEventListener('click', deleteLayer);
document.getElementById('zUpBtn')?.addEventListener('click', ()=>changeDisplayOrder(1));
document.getElementById('zDownBtn')?.addEventListener('click', ()=>changeDisplayOrder(-1));
document.getElementById('addFrameBtn').addEventListener('click', ()=>addFrame(false));
document.getElementById('dupFrameBtn').addEventListener('click', ()=>addFrame(true));
document.getElementById('tweenFrameBtn')?.addEventListener('click',openTweenFrameDialog);
document.getElementById('delFrameBtn').addEventListener('click', deleteFrame);
document.getElementById('copyFrameToMotionBtn')?.addEventListener('click', openCopyFrameDialog);
document.getElementById('applyLayerBtn').addEventListener('click', applyLayerInputs);
document.getElementById('exportBtn').addEventListener('click', ()=>exportJSON(true));
document.getElementById('applyJsonBtn').addEventListener('click', applyJSON);
document.getElementById('fileInput').addEventListener('change', async e => {
  const file = e.target.files[0]; if(!file) return;
  jsonAreaEl.value = await file.text();
  applyJSON();
  e.target.value = '';
});

document.querySelectorAll('.image-slot-add').forEach(button=>button.addEventListener('click',()=>{
  imageUploadTargetSlot=button.dataset.slot || 'body';
  baseImageInputEl?.click();
}));
baseImageInputEl?.addEventListener('change', async event => {
  const files=[...(event.target.files || [])];
  if(!files.length) return;
  pushHistory();
  ensureImageSlots();
  const slot=project.imageSlots[imageUploadTargetSlot] || project.imageSlots.body;
  const updatedSourceIds=new Set();
  for(const file of files){
    const data=await new Promise((resolve,reject)=>{ const reader=new FileReader(); reader.onload=loadEvent=>resolve(loadEvent.target.result); reader.onerror=()=>reject(reader.error); reader.readAsDataURL(file); });
    const activeSource=slot.activeSourceId ? project.imageSources?.[slot.activeSourceId] : null;
    const sameNameSourceId=activeSource?.name===file.name
      ? slot.activeSourceId
      : slot.sourceIds.find(sourceId=>project.imageSources?.[sourceId]?.name===file.name);
    let sourceId=sameNameSourceId;
    if(sameNameSourceId){
      project.imageSources[sameNameSourceId].data=data;
      meshImageCache.delete(sameNameSourceId);
      onionImageCache.clear();
      updatedSourceIds.add(sameNameSourceId);
    }else{
      sourceId=registerImageSource(data,file.name);
    }
    if(!slot.sourceIds.includes(sourceId)) slot.sourceIds.push(sourceId);
    slot.activeSourceId=sourceId;
  }
  if(!slot.activeSourceId) slot.activeSourceId=slot.sourceIds[0] || null;
  if(slot.id==='body') project.baseImageSourceId=slot.activeSourceId;
  await refreshImageSlotAssignments(slot.id);
  for(const otherSlot of Object.values(project.imageSlots)){
    if(otherSlot.id!==slot.id && otherSlot.sourceIds.some(sourceId=>updatedSourceIds.has(sourceId))){
      await refreshImageSlotAssignments(otherSlot.id);
    }
  }
  event.target.value='';
  render();
});
document.querySelectorAll('.image-slot-remove').forEach(button=>button.addEventListener('click',async()=>{
  const slotId=button.dataset.slot;
  const slot=project.imageSlots?.[slotId];
  const sourceId=slot?.activeSourceId;
  const source=sourceId ? project.imageSources?.[sourceId] : null;
  if(!slot || !sourceId || !confirm(`「${source?.name || '選択画像'}」を${slot.label}の候補から削除しますか？`)) return;
  pushHistory();
  slot.sourceIds=slot.sourceIds.filter(id=>id!==sourceId);
  slot.activeSourceId=slot.sourceIds[0] || null;
  if(slotId==='body') project.baseImageSourceId=slot.activeSourceId;
  await refreshImageSlotAssignments(slotId);
  removeOrphanImageSource(sourceId);
  render();
}));
imageSlotInputEl?.addEventListener('change',async event=>{
  if(!selectedLayer) return;
  const slotId=event.target.value || null;
  if(slotId && !activeImageSlotSourceId(slotId)){
    alert(`先に設定画面で「${IMAGE_SLOT_DEFS.find(def=>def.id===slotId)?.label}」の画像を登録してください。`);
    syncInputs();
    return;
  }
  pushHistory();
  const binding=findMeshBindingForBone(selectedLayer);
  if(binding){
    binding.imageSourceSlot=slotId;
    if(slotId) binding.sourceId=activeImageSlotSourceId(slotId);
  }else{
    const layer=project.layers[selectedLayer];
    layer.imageSourceSlot=slotId;
    if(slotId){ layer.imageSourceId=activeImageSlotSourceId(slotId); layer.imageSourceRole='slot'; }
    else if(layer.imageSourceId) layer.imageSourceRole='additional';
  }
  if(slotId) await refreshImageSlotAssignments(slotId);
  render();
});
document.getElementById('headerSetImageBtn')?.addEventListener('click', ()=>{ if(selectedLayer) document.getElementById('replaceImageInput').click(); });
document.getElementById('replaceImageInput').addEventListener('change', e => {
  const file = e.target.files[0];
  const targetId = selectedLayer;
  if(!file || !targetId) return;
  const reader = new FileReader();
  reader.onload = ev => {
    pushHistory();
    const layer = project.layers[targetId];
    if(!layer) return;
    layer.imageSourceId = registerImageSource(ev.target.result, file.name);
    layer.imageSourceSlot = null;
    layer.imageSourceRole = 'additional';
    layer.imageData = null;
    resetImageCrop(layer);

    // 画像の実寸にはボーンを合わせない。
    // ボーンW/Hを維持し、画像範囲は別途クロップ編集する。
    resetImageAdjustments(layer);
    selectedLayer = targetId;
    render();

    // 新しい画像をセットしたら、そのまま範囲編集へ。
    openImageCropEditor();
  };
  reader.readAsDataURL(file);
  e.target.value = '';
});
document.getElementById('headerClearImageBtn')?.addEventListener('click', ()=>{
  if(!selectedLayer) return;
  pushHistory();
  const layer = project.layers[selectedLayer];
  const sourceId = layer.imageSourceId;
  clearLayerImage(layer);
  removeOrphanImageSource(sourceId);
  render();
});
document.getElementById('resetImageAdjustBtn')?.addEventListener('click', ()=>{
  if(!selectedLayer) return;
  pushHistory();
  const pose=currentPose();
  const morph=currentBoneMorphEntry(project.layers[selectedLayer],pose);
  if(morph) resetImageAdjustments(morph);
  else {
    resetImageAdjustments(project.layers[selectedLayer]);
    if(pose){ delete pose.imageFlipX; delete pose.imageFlipY; }
  }
  render();
});
document.getElementById('editImageCropBtn')?.addEventListener('click', openImageCropEditor);
document.getElementById('editMeshBindingBtn')?.addEventListener('click', openMeshBindingEditor);
function detachSelectedMeshBinding(){
  if(!selectedLayer) return;
  const binding=findMeshBindingForBone(selectedLayer);
  if(!binding) return;
  const name=binding.name || chainLabel(binding.boneChain);
  if(!confirm(`「${name}」の連続メッシュだけを解除しますか？\n画像ソースとボーンは残ります。`)) return;
  pushHistory();
  delete project.meshBindings[binding.id];
  render();
}
document.getElementById('detachMeshBindingBtn')?.addEventListener('click',detachSelectedMeshBinding);
document.getElementById('headerDetachMeshBindingBtn')?.addEventListener('click',detachSelectedMeshBinding);
document.getElementById('meshChooseImageBtn')?.addEventListener('click', ()=>document.getElementById('meshImageInput')?.click());
document.getElementById('meshImageInput')?.addEventListener('change', event=>{
  const file=event.target.files?.[0];
  if(!file || !meshEditorState) return;
  const reader=new FileReader();
  reader.onload=loadEvent=>{
    removeOrphanImageSource(meshEditorState.temporarySourceId);
    const sourceId=registerImageSource(loadEvent.target.result,file.name);
    meshEditorState.temporarySourceId=sourceId;
    meshEditorState.imageSourceSlot=null;
    setMeshPreviewSource(sourceId);
  };
  reader.readAsDataURL(file);
  event.target.value='';
});
meshChainSelectEl?.addEventListener('change',event=>{
  if(!meshEditorState) return;
  const chain=meshEditorState.chainOptions.find(option=>option.join('|')===event.target.value);
  if(chain) selectMeshChain(chain);
});
meshChainStartSelectEl?.addEventListener('change',event=>{
  if(!meshEditorState) return;
  const candidates=meshEditorState.chainOptions.filter(chain=>chain[0]===event.target.value);
  if(candidates[0]) selectMeshChain(candidates[0]);
});
meshChainEndSelectEl?.addEventListener('change',event=>{
  if(!meshEditorState) return;
  const chain=meshEditorState.chainOptions.find(option=>option.join('|')===event.target.value);
  if(chain) selectMeshChain(chain);
});
document.getElementById('meshSourceWidthInput')?.addEventListener('input',event=>{
  if(!meshEditorState) return;
  const width=Math.max(.1,Math.min(1.4,Number(event.target.value)/100));
  meshEditorState.controlPoints.forEach(point=>{point.leftWidth=width/2;point.rightWidth=width/2;point.width=width;});
  document.getElementById('meshSourceWidthValue').textContent=`${Math.round(width*100)}%`;
  syncMeshEditorControls();
});
document.getElementById('meshTargetWidthInput')?.addEventListener('input',event=>{
  if(!meshEditorState) return;
  meshEditorState.targetWidthScale=Math.max(.4,Math.min(1.8,Number(event.target.value)/100));
  document.getElementById('meshTargetWidthValue').textContent=`${Math.round(meshEditorState.targetWidthScale*100)}%`;
});
document.getElementById('meshSegmentsInput')?.addEventListener('input',event=>{
  if(!meshEditorState) return;
  meshEditorState.segmentsPerBone=Math.max(1,Math.min(12,Number(event.target.value)||6));
  document.getElementById('meshSegmentsValue').textContent=String(meshEditorState.segmentsPerBone);
});
document.getElementById('meshPartSlotSelect')?.addEventListener('change',event=>{if(meshEditorState) meshEditorState.partSlot=event.target.value;});
document.getElementById('meshFlipXBtn')?.addEventListener('click',event=>{
  if(!meshEditorState) return; meshEditorState.flipX=!meshEditorState.flipX; syncMeshEditorControls();
});
document.getElementById('meshFlipYBtn')?.addEventListener('click',event=>{
  if(!meshEditorState) return; meshEditorState.flipY=!meshEditorState.flipY; syncMeshEditorControls();
});
document.getElementById('meshRotationInput')?.addEventListener('change',event=>{
  if(!meshEditorState) return; meshEditorState.rotation=Math.max(-180,Math.min(180,Number(event.target.value)||0)); setMeshPreviewSource(meshEditorState.sourceId);
});
function updateMeshSourceRectFromInputs(){
  if(!meshEditorState) return;
  meshEditorState.sourceRect=normalizeMeshSourceRect({
    x:Number(document.getElementById('meshRangeXInput').value)/100,
    y:Number(document.getElementById('meshRangeYInput').value)/100,
    w:Number(document.getElementById('meshRangeWInput').value)/100,
    h:Number(document.getElementById('meshRangeHInput').value)/100
  });
  syncMeshEditorControls();
}
['meshRangeXInput','meshRangeYInput','meshRangeWInput','meshRangeHInput'].forEach(id=>document.getElementById(id)?.addEventListener('change',updateMeshSourceRectFromInputs));
document.getElementById('meshRangeResetBtn')?.addEventListener('click',()=>{
  if(!meshEditorState) return;
  meshEditorState.sourceRect={x:0,y:0,w:1,h:1};
  syncMeshEditorControls();
});
document.getElementById('meshRangeCopyOppositeBtn')?.addEventListener('click',copyMeshSourceRectToOpposite);
document.getElementById('meshPointTInput')?.addEventListener('input',event=>{
  if(!meshEditorState) return; const index=meshEditorState.activePoint,points=meshEditorState.controlPoints,point=points[index];
  const min=(points[index-1]?.t ?? -.01)+.01,max=(points[index+1]?.t ?? 1.01)-.01;
  point.t=Math.max(min,Math.min(max,Number(event.target.value)/100)); syncMeshEditorControls();
});
document.getElementById('meshPointNameInput')?.addEventListener('input',event=>{
  if(!meshEditorState) return;
  const point=meshEditorState.controlPoints[meshEditorState.activePoint];
  point.name=String(event.target.value || '').trim().slice(0,24);
  syncMeshEditorControls();
});
document.getElementById('meshPointLeftInput')?.addEventListener('input',event=>{
  if(!meshEditorState) return; const point=meshEditorState.controlPoints[meshEditorState.activePoint],width=Math.max(.01,Number(event.target.value)/100); point.leftWidth=width; if(meshEditorState.symmetricWidth !== false) point.rightWidth=width; point.width=point.leftWidth+point.rightWidth; applyLockedMeshWidths(); syncMeshEditorControls();
});
document.getElementById('meshPointRightInput')?.addEventListener('input',event=>{
  if(!meshEditorState) return; const point=meshEditorState.controlPoints[meshEditorState.activePoint],width=Math.max(.01,Number(event.target.value)/100); point.rightWidth=width; if(meshEditorState.symmetricWidth !== false) point.leftWidth=width; point.width=point.leftWidth+point.rightWidth; applyLockedMeshWidths(); syncMeshEditorControls();
});
document.getElementById('meshSymmetricWidthInput')?.addEventListener('change',event=>{
  if(!meshEditorState) return;
  meshEditorState.symmetricWidth=event.target.checked;
  if(event.target.checked){
    const point=meshEditorState.controlPoints[meshEditorState.activePoint];
    const width=(point.leftWidth+point.rightWidth)/2;
    point.leftWidth=width; point.rightWidth=width; point.width=width*2;
    syncMeshEditorControls();
  }
});
document.getElementById('meshLockWidthInput')?.addEventListener('change',event=>{
  if(!meshEditorState) return;
  meshEditorState.widthLocked=event.target.checked;
  applyLockedMeshWidths();
  alignRectangularMeshPoints();
  syncMeshEditorControls();
});
document.getElementById('meshAddPointBtn')?.addEventListener('click',addMeshControlPoint);
document.getElementById('meshRemovePointBtn')?.addEventListener('click',removeMeshControlPoint);
document.getElementById('meshSaveReferencePoseBtn')?.addEventListener('click',saveReferencePose);
document.getElementById('meshApplyReferencePoseBtn')?.addEventListener('click',applyReferencePose);
document.getElementById('meshGuideDownloadBtn')?.addEventListener('click',downloadMeshReferenceGuide);
meshControlOverlayEl?.addEventListener('pointerdown',startMeshControlPointer);
meshControlOverlayEl?.addEventListener('pointermove',moveMeshControlPointer);
meshControlOverlayEl?.addEventListener('pointerup',endMeshControlPointer);
meshControlOverlayEl?.addEventListener('pointercancel',endMeshControlPointer);
document.getElementById('meshPreviewArea')?.addEventListener('pointerdown',startMeshPreviewPan);
document.getElementById('meshPreviewArea')?.addEventListener('pointermove',moveMeshPreviewPan);
document.getElementById('meshPreviewArea')?.addEventListener('pointerup',endMeshPreviewPan);
document.getElementById('meshPreviewArea')?.addEventListener('pointercancel',endMeshPreviewPan);
document.getElementById('meshPreviewArea')?.addEventListener('wheel',event=>{
  if(!meshEditorState) return;
  event.preventDefault();
  const previousZoom=meshEditorState.zoom || 1;
  const nextZoom=Math.max(.5,Math.min(6,previousZoom*(event.deltaY<0?1.12:1/1.12)));
  if(nextZoom===previousZoom) return;
  meshEditorState.zoom=nextZoom;
  fitMeshPreview();
},{passive:false});
document.getElementById('meshBindingApplyBtn')?.addEventListener('click',applyMeshBindingEditor);
document.getElementById('meshBindingDeleteBtn')?.addEventListener('click',deleteMeshBindingEditor);
document.getElementById('meshBindingCancelBtn')?.addEventListener('click',closeMeshBindingEditor);
document.getElementById('meshBindingCloseBtn')?.addEventListener('click',closeMeshBindingEditor);

cropBoneSelectEl?.addEventListener('change', e => {
  if(!cropEditorState) return;
  cropEditorState.currentBoneId = e.target.value || null;
  renderCropSelections();
});
['cropXInput','cropYInput','cropWInput','cropHInput'].forEach(id => {
  document.getElementById(id)?.addEventListener('change', updateCropFromNumberInputs);
});
document.getElementById('cropRotationInput')?.addEventListener('change', event => {
  if(!cropEditorState) return;
  cropEditorState.rotation = normalizedRotation(event.target.value);
  refreshCropPreview().catch(error => alert(error.message));
});
document.getElementById('cropFlipXInput')?.addEventListener('change', event => {
  if(!cropEditorState) return;
  cropEditorState.flipX = event.target.checked;
  refreshCropPreview().catch(error => alert(error.message));
});
document.getElementById('cropFlipYInput')?.addEventListener('change', event => {
  if(!cropEditorState) return;
  cropEditorState.flipY = event.target.checked;
  refreshCropPreview().catch(error => alert(error.message));
});
document.getElementById('cropFullBtn')?.addEventListener('click', () => {
  const crop = currentCrop();
  if(!crop) return;
  crop.x=0; crop.y=0; crop.w=1; crop.h=1;
  applyHorizontalRangeToSharedCrops(crop.x, crop.w);
  renderCropSelections();
});
document.getElementById('cropSymmetricXInput')?.addEventListener('change', event => {
  if(!cropEditorState) return;
  cropEditorState.symmetricX = event.target.checked;
});
document.getElementById('cropPreviewArea')?.addEventListener('wheel', event => {
  if(!cropEditorState) return;
  event.preventDefault();
  const previousZoom = cropEditorState.zoom || 1;
  const nextZoom = Math.max(.5, Math.min(6, previousZoom * (event.deltaY < 0 ? 1.12 : 1 / 1.12)));
  if(nextZoom === previousZoom) return;
  cropEditorState.zoom = nextZoom;
  fitCropPreviewImage();
}, {passive:false});
document.getElementById('cropPreviewArea')?.addEventListener('pointerdown',startCropPreviewPan);
document.getElementById('cropPreviewArea')?.addEventListener('pointermove',moveCropPreviewPan);
document.getElementById('cropPreviewArea')?.addEventListener('pointerup',endCropPreviewPan);
document.getElementById('cropPreviewArea')?.addEventListener('pointercancel',endCropPreviewPan);
cropSelectionsEl?.addEventListener('pointerdown', startCropPointer);
cropSelectionsEl?.addEventListener('pointermove', moveCropPointer);
cropSelectionsEl?.addEventListener('pointerup', endCropPointer);
cropSelectionsEl?.addEventListener('pointercancel', endCropPointer);
cropImageRotateHandleEl?.addEventListener('pointerdown', startCropRotationPointer);
cropImageRotateHandleEl?.addEventListener('pointermove', moveCropRotationPointer);
cropImageRotateHandleEl?.addEventListener('pointerup', endCropRotationPointer);
cropImageRotateHandleEl?.addEventListener('pointercancel', endCropRotationPointer);
document.getElementById('imageCropApplyBtn')?.addEventListener('click', applyImageCropEditor);
document.getElementById('imageCropRemoveAllBtn')?.addEventListener('click', removeCropSourceFromAllBones);
document.getElementById('imageCropCancelBtn')?.addEventListener('click', closeImageCropEditor);
document.getElementById('imageCropCloseBtn')?.addEventListener('click', closeImageCropEditor);
window.addEventListener('resize', () => {
  if(imageCropDialogEl?.open) fitCropPreviewImage();
  if(meshBindingDialogEl?.open) fitMeshPreview();
});

nameInputEl?.addEventListener('focus',()=>{ nameEditingLayerId=selectedLayer; });
nameInputEl?.addEventListener('keydown',event=>{
  if(event.key!=='Enter') return;
  event.preventDefault();
  commitLayerName(nameEditingLayerId || selectedLayer,event.currentTarget.value);
  event.currentTarget.blur();
});
nameInputEl?.addEventListener('blur',()=>{
  if(nameEditingLayerId) commitLayerName(nameEditingLayerId,nameInputEl.value);
});
document.getElementById('attachedInput')?.addEventListener('change', e => {
  if(!selectedLayer) return;
  setMeshLayerAttached(selectedLayer, e.target.checked);
});
document.getElementById('waistPositionLockInput')?.addEventListener('change',event=>{
  const layer=currentLayer();
  if(!isWaistLayer(layer)) return;
  pushHistory();
  if(event.target.checked) layer.positionLocked=true;
  else delete layer.positionLocked;
  render();
});
boneDisplaySizeModeInputEl?.addEventListener('change',event=>{
  ensureProjectSettings();
  pushHistory();
  project.meta.boneDisplaySizeMode=!!event.target.checked;
  render();
});
function updateBoneDisplayDimension(axis,value){
  const layer=currentLayer();
  if(!layer) return;
  pushHistory();
  const property=axis==='w'?'editorBoneDisplayW':'editorBoneDisplayH';
  layer[property]=Math.max(8,Math.min(2000,Number(value)||8));
  if(axis==='w') setMeshBindingEditorResizeBoxWidthForBone(selectedLayer,layer[property]);
  delete layer.editorBoneScale;
  render();
}
boneDisplayWidthInputEl?.addEventListener('change',event=>updateBoneDisplayDimension('w',event.target.value));
boneDisplayHeightInputEl?.addEventListener('change',event=>updateBoneDisplayDimension('h',event.target.value));
['shapeInput','attachXInput','attachYInput','oxInput','oyInput','headXInput','headYInput','tailXInput','tailYInput','wInput','hInput','xInput','yInput','rInput','zInput','parentInput','imageOffsetXInput','imageOffsetYInput','imageScaleXInput','imageScaleYInput','imageRotationInput','imageOpacityInput'].forEach(id => {
  document.getElementById(id).addEventListener('change', applyLayerInputs);
});
function applyInspectorImageFlip(axis,checked){
  const layer=currentLayer();
  const pose=currentPose();
  if(!layer || !pose) return;
  const property=axis==='x'?'imageFlipX':'imageFlipY';
  const morph=currentBoneMorphEntry(layer,pose);
  if(morph){ pushHistory(); morph[property]=!!checked; render(); return; }
  if(typeof pose[property]==='boolean' && pose[property]===!!checked) return;
  pushHistory();
  pose[property]=!!checked;
  render();
}
document.getElementById('imageFlipXInput')?.addEventListener('change',event=>applyInspectorImageFlip('x',event.target.checked));
document.getElementById('imageFlipYInput')?.addEventListener('change',event=>applyInspectorImageFlip('y',event.target.checked));
document.getElementById('boneMorphSelect')?.addEventListener('change',event=>{
  const pose=currentPose(); if(!pose) return;
  pushHistory(); pose.morphId=event.target.value || ''; render();
});
document.getElementById('addBoneMorphBtn')?.addEventListener('click',()=>{
  const layer=currentLayer(); const pose=currentPose(); if(!layer || !pose) return;
  if(isHandReplacementLayer(layer)){
    document.getElementById('handVariantImageInput')?.click();
    return;
  }
  const name=cleanBoneName(prompt('モーフ名（例: 握る、開く、閉じ目）',''));
  if(!name) return;
  if(layer.morphs?.[name]){ alert('同名のモーフがあります。'); return; }
  pushHistory();
  layer.morphs ||= {};
  const sourceId=activeImageSlotSourceId(layer.imageSourceSlot) || layer.imageSourceId || null;
  const source=sourceId ? project.imageSources?.[sourceId] : null;
  layer.morphs[name]={imageSourceId:sourceId,imageSourceSlot:null,imageFragmentData:null,imageCropX:layer.imageCropX ?? 0,imageCropY:layer.imageCropY ?? 0,imageCropW:layer.imageCropW ?? 1,imageCropH:layer.imageCropH ?? 1,imageCropRotation:normalizedRotation(source?.cropRotation),imageCropFlipX:!!source?.cropFlipX,imageCropFlipY:!!source?.cropFlipY,imageOffsetX:layer.imageOffsetX ?? 0,imageOffsetY:layer.imageOffsetY ?? 0,imageScaleX:layer.imageScaleX ?? 1,imageScaleY:layer.imageScaleY ?? 1,imageRotation:layer.imageRotation ?? 0,imageOpacity:layer.imageOpacity ?? 1,imageFlipX:!!layer.imageFlipX,imageFlipY:!!layer.imageFlipY};
  pose.morphId=name; render();
});
document.getElementById('handVariantImageInput')?.addEventListener('change',async event=>{
  const file=event.target.files?.[0];
  event.target.value='';
  const layer=currentLayer(); const pose=currentPose();
  if(!file || !layer || !pose || !isHandReplacementLayer(layer)) return;
  let data;
  try{ data=await readImageFileData(file); }
  catch(error){ alert(error?.message || '手画像を読み込めませんでした。'); return; }
  pushHistory();
  layer.morphs ||= {};
  const name=uniqueBoneMorphName(layer,file.name);
  const sourceId=registerImageSource(data,file.name || name);
  layer.morphs[name]={
    kind:'hand',imageSourceId:sourceId,imageSourceSlot:null,imageFragmentData:null,
    imageCropX:0,imageCropY:0,imageCropW:1,imageCropH:1,imageCropRotation:0,imageCropFlipX:false,imageCropFlipY:false,
    imageOffsetX:layer.imageOffsetX ?? 0,imageOffsetY:layer.imageOffsetY ?? 0,
    imageScaleX:layer.imageScaleX ?? 1,imageScaleY:layer.imageScaleY ?? 1,
    imageRotation:layer.imageRotation ?? 0,imageOpacity:layer.imageOpacity ?? 1,
    imageFlipX:effectiveBoneImageFlip(selectedLayer,pose,'x',null),imageFlipY:effectiveBoneImageFlip(selectedLayer,pose,'y',null)
  };
  pose.morphId=name;
  render();
});
document.getElementById('deleteBoneMorphBtn')?.addEventListener('click',()=>{
  const layer=currentLayer(); const pose=currentPose(); const morph=activeBoneMorph(layer,pose); if(!morph) return;
  const hand=isHandReplacementLayer(layer);
  if(!confirm(`${hand?'手画像':'モーフ'}「${morph.id}」を削除しますか？`)) return;
  const sourceId=morph.imageSourceId;
  pushHistory(); delete layer.morphs[morph.id];
  for(const frame of allProjectFrames()) if(frame[selectedLayer]?.morphId===morph.id) frame[selectedLayer].morphId='';
  removeOrphanImageSource(sourceId);
  render();
});
document.getElementById('boneMorphImageSelect')?.addEventListener('change',event=>{
  const layer=currentLayer(); const pose=currentPose(); const morph=currentBoneMorphEntry(layer,pose); if(!morph) return;
  pushHistory(); morph.imageSourceId=event.target.value || null; morph.imageSourceSlot=null; morph.imageFragmentData=null; render();
});

syncDisplaySettings();


// ---- Compact UI bindings / keyboard shortcuts ----
function setEditMode(mode){
  project.meta.editMode = mode;
  editModeSelectEl.value = mode;
  render();
}
function setWholeMoveAxis(axis){
  if(!['free','horizontal','vertical'].includes(axis)) return;
  project.meta.wholeMoveAxis=axis;
  render();
}
function leaveBackgroundSelection(){
  backgroundSelected=false;
  if(backgroundAdjustMode){
    backgroundAdjustMode=false;
    backgroundDragState=null;
    stageEl.classList.remove('background-adjust-mode','is-background-dragging');
    window.removeEventListener('mousemove',moveBackgroundDrag);
    window.removeEventListener('mouseup',endBackgroundDrag);
  }
  if(backgroundWheelCommitTimer){
    clearTimeout(backgroundWheelCommitTimer);
    backgroundWheelCommitTimer=null;
  }
}
function selectBoneLayer(id,renderAfter=true){
  if(!project.layers?.[id]) return;
  leaveBackgroundSelection();
  selectedLayer=id;
  if(renderAfter) render();
}
function selectBackgroundLayer(backgroundId=selectedBackgroundId,renderAfter=true){
  if(typeof backgroundId==='boolean'){
    renderAfter=backgroundId;
    backgroundId=selectedBackgroundId;
  }
  if(!project.backgrounds.some(background=>background.id===backgroundId)) backgroundId=project.backgrounds[0]?.id || null;
  if(!backgroundId) return;
  if(nameEditingLayerId) commitLayerName(nameEditingLayerId,nameInputEl?.value,{renderAfter:false});
  selectedLayer=null;
  selectedBackgroundId=backgroundId;
  backgroundSelected=true;
  setBackgroundAdjustMode(true);
  if(renderAfter) render();
}
function clearSelection(){
  selectedLayer = null;
  leaveBackgroundSelection();
  render();
}

function syncBackgroundAdjustInputs(){
  const background=currentBackground() || {};
  const setValue=(id,value)=>{ const input=document.getElementById(id); if(input) input.value=value; };
  setValue('backgroundXInput',Math.round(Number(background.x)||0));
  setValue('backgroundYInput',Math.round(Number(background.y)||0));
  setValue('backgroundScaleInput',Math.round((Number(background.scale)||1)*100));
}

function setBackgroundAdjustMode(enabled){
  ensureProjectSettings();
  const background=currentBackground();
  const hasImage=!!project.imageSources?.[background?.sourceId]?.data;
  backgroundAdjustMode=!!enabled && hasImage;
  stageEl.classList.toggle('background-adjust-mode',backgroundAdjustMode);
  stageEl.classList.remove('is-background-dragging');
  if(backgroundAdjustMode){
    settingsDialogEl?.close();
    renderBackgroundImage();
  }else if(backgroundWheelCommitTimer){
    clearTimeout(backgroundWheelCommitTimer);
    backgroundWheelCommitTimer=null;
    render();
  }
}

function startBackgroundDrag(event){
  if(!backgroundAdjustMode || event.button!==0 || event.target?.closest?.('.background-adjust-toolbar')) return false;
  event.preventDefault();
  event.stopImmediatePropagation();
  const background=currentBackground() || {};
  backgroundDragState={
    startX:event.clientX,startY:event.clientY,
    originX:Number(background.x)||0,originY:Number(background.y)||0,
    activated:false
  };
  stageEl.classList.add('is-background-dragging');
  window.addEventListener('mousemove',moveBackgroundDrag);
  window.addEventListener('mouseup',endBackgroundDrag);
  return true;
}

function moveBackgroundDrag(event){
  if(!backgroundDragState) return;
  const dx=event.clientX-backgroundDragState.startX,dy=event.clientY-backgroundDragState.startY;
  if(!backgroundDragState.activated){
    if(Math.hypot(dx,dy)<2) return;
    pushHistory();
    backgroundDragState.activated=true;
  }
  const delta=characterDeltaFromClient(dx,dy);
  const background=currentBackground();
  if(!background) return;
  background.x=Math.round(backgroundDragState.originX+delta.x);
  background.y=Math.round(backgroundDragState.originY+delta.y);
  syncBackgroundAdjustInputs();
  renderBackgroundImage();
}

function endBackgroundDrag(){
  if(!backgroundDragState) return;
  const changed=backgroundDragState.activated;
  backgroundDragState=null;
  stageEl.classList.remove('is-background-dragging');
  window.removeEventListener('mousemove',moveBackgroundDrag);
  window.removeEventListener('mouseup',endBackgroundDrag);
  if(changed) render();
}

function adjustBackgroundScaleFromWheel(event){
  if(!backgroundAdjustMode || event.target?.closest?.('.background-adjust-toolbar')) return false;
  event.preventDefault();
  ensureProjectSettings();
  if(!backgroundWheelCommitTimer) pushHistory();
  const background=currentBackground();
  if(!background) return false;
  const current=Math.max(.1,Math.min(4,Number(background.scale)||1));
  const next=Math.max(.1,Math.min(4,current*(event.deltaY<0?1.05:1/1.05)));
  background.scale=Math.round(next*1000)/1000;
  syncBackgroundAdjustInputs();
  renderBackgroundImage();
  if(backgroundWheelCommitTimer) clearTimeout(backgroundWheelCommitTimer);
  backgroundWheelCommitTimer=setTimeout(()=>{
    backgroundWheelCommitTimer=null;
    render();
  },220);
  return true;
}

function isStagePanTarget(target){
  return !target?.closest?.('.layer,.resize-box,.resize-handle,.whole-scale-handle,.anchor-editor-handle,.ground-line');
}

function startStagePan(event){
  if(event.button!==0 || !isStagePanTarget(event.target)) return;
  event.preventDefault();
  stagePanState={startX:event.clientX,startY:event.clientY,viewX:stageView.x,viewY:stageView.y,moved:false};
  stageEl.classList.add('is-panning');
  window.addEventListener('mousemove',moveStagePan);
  window.addEventListener('mouseup',endStagePan);
}

function moveStagePan(event){
  if(!stagePanState) return;
  const dx=event.clientX-stagePanState.startX,dy=event.clientY-stagePanState.startY;
  if(Math.hypot(dx,dy)>=4) stagePanState.moved=true;
  if(!stagePanState.moved) return;
  stageView.x=stagePanState.viewX+dx;
  stageView.y=stagePanState.viewY+dy;
  applyStageView();
}

function endStagePan(){
  if(!stagePanState) return;
  const moved=stagePanState.moved;
  stagePanState=null;
  stageEl.classList.remove('is-panning');
  window.removeEventListener('mousemove',moveStagePan);
  window.removeEventListener('mouseup',endStagePan);
  if(!moved) clearSelection();
}

function zoomStageAt(event){
  if(adjustBackgroundScaleFromWheel(event)) return;
  event.preventDefault();
  const previous=stageView.zoom;
  const next=Math.max(.35,Math.min(3,previous*(event.deltaY<0?1.12:1/1.12)));
  if(next===previous) return;
  const rect=stageEl.getBoundingClientRect();
  const centerX=rect.left+rect.width/2+stageView.x;
  const centerY=rect.top+rect.height/2+stageView.y;
  const ratio=next/previous;
  stageView.x+=(event.clientX-centerX)*(1-ratio);
  stageView.y+=(event.clientY-centerY)*(1-ratio);
  stageView.zoom=next;
  applyStageView();
}
function isTypingTarget(target){
  if(!target) return false;
  const tag = target.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable;
}

function clampSettingsDialogPosition(left, top){
  const rect = settingsDialogEl.getBoundingClientRect();
  const maxLeft = Math.max(0, window.innerWidth - rect.width);
  const maxTop = Math.max(0, window.innerHeight - rect.height);
  return {left:Math.max(0,Math.min(maxLeft,left)), top:Math.max(0,Math.min(maxTop,top))};
}
function setSettingsDialogPosition(left, top, save=true){
  if(!settingsDialogEl) return;
  settingsDialogEl.classList.add('floating');
  const pos = clampSettingsDialogPosition(left, top);
  settingsDialogEl.style.left = `${Math.round(pos.left)}px`;
  settingsDialogEl.style.top = `${Math.round(pos.top)}px`;
  if(save){
    if(!project.meta.ui) project.meta.ui = {};
    project.meta.ui.settingsX = Math.round(pos.left);
    project.meta.ui.settingsY = Math.round(pos.top);
    saveProject();
  }
}
function placeSettingsDialog(){
  if(!settingsDialogEl) return;
  if(!project.meta.ui) project.meta.ui = {};
  const savedX = Number(project.meta.ui.settingsX), savedY = Number(project.meta.ui.settingsY);
  if(Number.isFinite(savedX) && Number.isFinite(savedY)){
    requestAnimationFrame(()=>setSettingsDialogPosition(savedX,savedY,false));
  } else {
    requestAnimationFrame(()=>{
      const rect=settingsDialogEl.getBoundingClientRect();
      setSettingsDialogPosition(Math.max(8,window.innerWidth-rect.width-18), Math.max(56,(window.innerHeight-rect.height)/2), false);
    });
  }
}
function initSettingsDialogDrag(){
  if(!settingsDialogEl || settingsDialogEl.dataset.dragReady==='1') return;
  const head = settingsDialogEl.querySelector('.dialog-head');
  if(!head) return;
  head.addEventListener('mousedown', e=>{
    if(e.button!==0 || e.target.closest('button')) return;
    e.preventDefault();
    const rect=settingsDialogEl.getBoundingClientRect();
    const startX=e.clientX, startY=e.clientY, startLeft=rect.left, startTop=rect.top;
    const move=ev=>setSettingsDialogPosition(startLeft+(ev.clientX-startX), startTop+(ev.clientY-startY), false);
    const up=ev=>{
      window.removeEventListener('mousemove',move); window.removeEventListener('mouseup',up);
      const r=settingsDialogEl.getBoundingClientRect(); setSettingsDialogPosition(r.left,r.top,true);
    };
    window.addEventListener('mousemove',move); window.addEventListener('mouseup',up);
  });
  head.addEventListener('dblclick', e=>{
    if(e.target.closest('button')) return;
    const rect=settingsDialogEl.getBoundingClientRect();
    setSettingsDialogPosition((window.innerWidth-rect.width)/2, Math.max(20,(window.innerHeight-rect.height)/2), true);
  });
  settingsDialogEl.dataset.dragReady='1';
}
initSettingsDialogDrag();
window.addEventListener('resize',()=>{
  if(settingsDialogEl?.open){ const r=settingsDialogEl.getBoundingClientRect(); setSettingsDialogPosition(r.left,r.top,false); }
});

rotateModeBtn?.addEventListener('click', ()=>setEditMode('rotate'));
moveModeBtn?.addEventListener('click', ()=>setEditMode('move'));
wholeMoveModeBtn?.addEventListener('click', ()=>setEditMode('whole'));
document.querySelectorAll('input[name="wholeMoveAxis"]').forEach(input=>input.addEventListener('change',event=>{
  if(event.target.checked) setWholeMoveAxis(event.target.value);
}));
scaleModeBtn?.addEventListener('click', ()=>setEditMode('scale'));
anchorModeBtn?.addEventListener('click', ()=>setEditMode('anchor'));
document.getElementById('settingsBtn')?.addEventListener('click', ()=>{ syncDisplaySettings(); if(!settingsDialogEl?.open && typeof settingsDialogEl?.showModal === 'function') settingsDialogEl.showModal(); placeSettingsDialog(); });
document.getElementById('settingsCloseBtn')?.addEventListener('click', ()=>settingsDialogEl?.close());
document.getElementById('saveMenuBtn')?.addEventListener('click', ()=>{
  if(projectNameInputEl) projectNameInputEl.value = project.meta?.name || 'motion';
  if(typeof saveDialogEl?.showModal === 'function') saveDialogEl.showModal();
});
document.getElementById('saveMenuCloseBtn')?.addEventListener('click', ()=>saveDialogEl?.close());
document.getElementById('openSpriteExportBtn')?.addEventListener('click',()=>{
  saveDialogEl?.close();
  spriteExportStatusEl.textContent='';
  spriteExportStatusEl.classList.remove('is-error');
  updateSpriteExportDialog();
  if(typeof spriteExportDialogEl?.showModal==='function') spriteExportDialogEl.showModal();
});
document.getElementById('spriteExportCloseBtn')?.addEventListener('click',()=>spriteExportDialogEl?.close());
spriteExportRunBtn?.addEventListener('click',exportAllMotionSprites);
document.getElementById('closeEditorBtn')?.addEventListener('click', ()=>{
  const requestedReturn = new URLSearchParams(window.location.search).get('return');
  const returnPath = requestedReturn?.startsWith('/') && !requestedReturn.startsWith('//') ? requestedReturn : '/guest';
  window.location.assign(returnPath);
});
document.getElementById('saveSourceJsonBtn')?.addEventListener('click', async ()=>{
  try{
    if(await saveCurrentProjectToSource()){
      saveDialogEl?.close();
      alert('デフォルトと全派生アニメーションを上書き保存しました。');
    }
  }catch(error){ alert(error.message); }
});
document.getElementById('saveSourceAsJsonBtn')?.addEventListener('click', async ()=>{
  try{
    if(await saveCurrentProjectToSource(true)){
      saveDialogEl?.close();
      alert('別名のセーブデータとして保存しました。以後はこちらへ上書き保存します。');
    }
  }catch(error){ alert(error.message); }
});
animationSelectEl?.addEventListener('change',event=>{
  stop(); currentAnimationId=event.target.value==='default'?null:event.target.value; currentFrame=0; selectedLayer=null; render();
});
document.getElementById('motionManagerBtn')?.addEventListener('click',openMotionManager);
document.getElementById('motionManagerCloseBtn')?.addEventListener('click',()=>motionManagerDialogEl?.close());
motionCreateModeEl?.addEventListener('change',renderMotionManager);
document.getElementById('createMotionBtn')?.addEventListener('click',createManagedMotion);
document.getElementById('deleteManagedMotionBtn')?.addEventListener('click',()=>{
  if(!selectedManagedMotionId || !deleteAnimationById(selectedManagedMotionId)) return;
  selectedManagedMotionId=project.animations[0]?.id || null;
  renderMotionManager();
});
document.getElementById('copyFrameCloseBtn')?.addEventListener('click',()=>copyFrameDialogEl?.close());
document.getElementById('copyFrameApplyBtn')?.addEventListener('click',copyCurrentFrameToMotion);
document.getElementById('tweenFrameCloseBtn')?.addEventListener('click',()=>tweenFrameDialogEl?.close());
document.querySelectorAll('input[name="tweenFrameMode"]').forEach(input=>input.addEventListener('change',syncTweenFrameDialog));
tweenPartialCountSelectEl?.addEventListener('change',syncTweenFrameDialog);
tweenWholeMultiplierSelectEl?.addEventListener('change',syncTweenFrameDialog);
tweenFrameApplyBtn?.addEventListener('click',applyTweenFrames);
document.getElementById('openProjectListBtn')?.addEventListener('click', openProjectLibrary);
document.getElementById('initializeProjectBtn')?.addEventListener('click', ()=>{
  saveDialogEl?.close(); openProjectLibrary();
});
document.getElementById('projectListBtn')?.addEventListener('click', openProjectLibrary);
document.getElementById('projectLibraryCloseBtn')?.addEventListener('click', ()=>projectLibraryDialogEl?.close());
document.getElementById('createStandardProjectBtn')?.addEventListener('click', ()=>{
  initializeProject(false,'standard_2d','side');
  projectLibraryDialogEl?.close();
});
document.getElementById('createFrontProjectBtn')?.addEventListener('click', ()=>{
  initializeProject(false,'standard_2d','front');
  projectLibraryDialogEl?.close();
});
document.getElementById('createPixelProjectBtn')?.addEventListener('click', ()=>{
  initializeProject(false,'pixel_simple','front');
  projectLibraryDialogEl?.close();
});
document.getElementById('createPixelSideProjectBtn')?.addEventListener('click', ()=>{
  initializeProject(false,'pixel_simple','side');
  projectLibraryDialogEl?.close();
});
document.getElementById('recoverDraftBtn')?.addEventListener('click', ()=>{
  const draft = loadProject();
  replaceCurrentProject(draft, localStorage.getItem(CURRENT_PROJECT_ID_KEY) || null);
  if(projectNameInputEl) projectNameInputEl.value = project.meta?.name || 'motion';
  projectLibraryDialogEl?.close();
});
document.getElementById('saveJsonFileBtn')?.addEventListener('click', ()=>{ saveDialogEl?.close(); downloadJSON(); });
document.getElementById('loadJsonFileBtn')?.addEventListener('click', ()=>{ saveDialogEl?.close(); document.getElementById('fileInput').click(); });
document.getElementById('exportMaterialGuideBtn')?.addEventListener('click', ()=>{ saveDialogEl?.close(); downloadMaterialGuide(); });
document.getElementById('exportPartTemplateKitBtn')?.addEventListener('click',openPartReference);
document.getElementById('partReferenceCloseBtn')?.addEventListener('click',()=>partReferenceDialogEl?.close());
document.getElementById('partReferenceDownloadBtn')?.addEventListener('click',downloadPartReferenceImage);
document.getElementById('partReferenceTechnicalBtn')?.addEventListener('click',downloadPartTemplateKit);
document.getElementById('partExampleSelect')?.addEventListener('change',updatePartExamplePreview);
document.getElementById('partExampleDownloadBtn')?.addEventListener('click',downloadPartExampleImage);
document.getElementById('editJsonBtn')?.addEventListener('click', ()=>{
  saveDialogEl?.close();
  exportJSON(false);
  if(typeof jsonDialogEl?.showModal === 'function') jsonDialogEl.showModal();
});
document.getElementById('backgroundImageSetBtn')?.addEventListener('click',()=>backgroundImageInputEl?.click());
document.getElementById('backgroundAddBtn')?.addEventListener('click',()=>{
  ensureProjectSettings();
  pushHistory();
  const id=backgroundUid();
  const background={id,name:`背景 ${project.backgrounds.length+1}`,sourceId:null,x:0,y:0,scale:1,opacity:1,layerNo:getCombinedLayerOrder().length+1,flipX:false,flipY:false};
  project.backgrounds.push(background);
  selectedBackgroundId=id;
  backgroundSelected=true;
  setBackgroundAdjustMode(false);
  render();
});
document.getElementById('backgroundLayerDeleteBtn')?.addEventListener('click',()=>{
  ensureProjectSettings();
  if(project.backgrounds.length<=1) return;
  const index=project.backgrounds.findIndex(background=>background.id===selectedBackgroundId);
  if(index<0) return;
  pushHistory();
  const [removed]=project.backgrounds.splice(index,1);
  selectedBackgroundId=project.backgrounds[Math.min(index,project.backgrounds.length-1)]?.id || null;
  removeOrphanImageSource(removed.sourceId);
  backgroundSelected=!!selectedBackgroundId;
  setBackgroundAdjustMode(backgroundSelected);
  render();
});
backgroundImageInputEl?.addEventListener('change',async event=>{
  const file=event.target.files?.[0];
  if(!file) return;
  const data=await new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=loadEvent=>resolve(loadEvent.target.result);
    reader.onerror=()=>reject(reader.error);
    reader.readAsDataURL(file);
  });
  pushHistory();
  ensureProjectSettings();
  const background=currentBackground();
  if(!background) return;
  const previousSourceId=background.sourceId;
  background.sourceId=registerImageSource(data,file.name);
  if(/^背景 \d+$/.test(background.name)) background.name=file.name.replace(/\.[^.]+$/,'') || background.name;
  removeOrphanImageSource(previousSourceId);
  event.target.value='';
  if(backgroundSelected) setBackgroundAdjustMode(true);
  render();
});
document.getElementById('backgroundImageRemoveBtn')?.addEventListener('click',()=>{
  ensureProjectSettings();
  const background=currentBackground();
  const sourceId=background?.sourceId;
  if(!sourceId) return;
  pushHistory();
  setBackgroundAdjustMode(false);
  background.sourceId=null;
  removeOrphanImageSource(sourceId);
  render();
});
function updateBackgroundSettings(){
  ensureProjectSettings();
  const background=currentBackground();
  if(!background) return;
  pushHistory();
  background.x=Math.max(-2000,Math.min(2000,num('backgroundXInput')));
  background.y=Math.max(-2000,Math.min(2000,num('backgroundYInput')));
  background.scale=Math.max(.1,Math.min(4,num('backgroundScaleInput')/100 || 1));
  background.opacity=Math.max(0,Math.min(1,num('backgroundOpacityInput')/100));
  background.flipX=!!document.getElementById('backgroundFlipXInput')?.checked;
  background.flipY=!!document.getElementById('backgroundFlipYInput')?.checked;
  render();
}
['backgroundXInput','backgroundYInput','backgroundScaleInput','backgroundOpacityInput','backgroundFlipXInput','backgroundFlipYInput'].forEach(id=>{
  document.getElementById(id)?.addEventListener('change',updateBackgroundSettings);
});
document.getElementById('backgroundLayerInput')?.addEventListener('change',event=>setBackgroundLayerNo(event.target.value,true,true));
document.getElementById('backgroundAdjustDoneBtn')?.addEventListener('click',clearSelection);
[['settingLabels','display','labels'],['settingAnchors','display','anchors'],['settingLines','display','lines'],['settingBones','display','bones'],['settingImages','display','images'],['settingGrid','display','grid'],['settingBoneColors','display','boneColors'],['settingInternalIds','display','internalIds'],['settingGroundVisible','display','groundVisible'],['settingGroundEnabled','ground','enabled'],['settingAutoFoot','ground','autoFoot']].forEach(([id,group,key])=>{
  document.getElementById(id)?.addEventListener('change', e=>{ ensureProjectSettings(); project.meta[group][key]=e.target.checked; render(); });
});
document.getElementById('settingBoneColorIntensity')?.addEventListener('input', event=>{
  ensureProjectSettings();
  project.meta.display.boneColorIntensity=Math.max(0,Math.min(100,Number(event.target.value)||0));
  render();
});
document.getElementById('settingGroundY')?.addEventListener('change', e=>{ ensureProjectSettings(); project.meta.ground.y=Math.max(0,Math.min(1000,parseFloat(e.target.value)||880)); render(); });
document.getElementById('settingAirFootAngle')?.addEventListener('change', e=>{ ensureProjectSettings(); project.meta.ground.airAngle=Math.max(-180,Math.min(180,parseFloat(e.target.value)||60)); render(); });
function setImageDisplayScale(percent){
  ensureProjectSettings();
  project.meta.imageDisplayScale=Math.max(.5,Math.min(2.5,(Number(percent)||100)/100));
  render();
}
document.getElementById('settingImageDisplayScale')?.addEventListener('input',event=>setImageDisplayScale(event.target.value));
document.getElementById('settingImageDisplayScaleNumber')?.addEventListener('change',event=>setImageDisplayScale(event.target.value));
document.getElementById('settingImageDisplayScaleReset')?.addEventListener('click',()=>setImageDisplayScale(100));
document.getElementById('jsonCloseBtn')?.addEventListener('click', ()=>jsonDialogEl?.close());
document.getElementById('closeInspectorBtn')?.addEventListener('click', clearSelection);

stageEl.addEventListener('mousedown',event=>{ if(backgroundAdjustMode) startBackgroundDrag(event); },true);
stageEl.addEventListener('mousedown',startStagePan);
stageEl.addEventListener('wheel',zoomStageAt,{passive:false});

window.addEventListener('keydown', e => {
  if(isTypingTarget(e.target)) return;
  if(e.key==='Escape' && backgroundAdjustMode){
    e.preventDefault();
    clearSelection();
    return;
  }
  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z'){
    e.preventDefault();
    if(e.shiftKey) redo(); else undo();
    return;
  }
  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y'){
    e.preventDefault();
    redo();
    return;
  }
  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's'){
    e.preventDefault();
    if(e.shiftKey){
      if(projectNameInputEl) projectNameInputEl.value=project.meta?.name || 'motion';
      if(typeof saveDialogEl?.showModal==='function') saveDialogEl.showModal();
      return;
    }
    saveCurrentProjectToSource()
      .then(saved => { if(saved) alert('デフォルトと全派生アニメーションを上書き保存しました。'); })
      .catch(error => alert(error.message));
    return;
  }
  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd'){
    e.preventDefault();
    addFrame(true);
    return;
  }
  if(e.code === 'Space'){
    e.preventDefault();
    togglePlay();
    return;
  }
  if(e.key === 'ArrowLeft'){
    const frames=activeFrames(); e.preventDefault(); stop(); currentFrame = (currentFrame - 1 + frames.length) % frames.length; render(); return;
  }
  if(e.key === 'ArrowRight'){
    const frames=activeFrames(); e.preventDefault(); stop(); currentFrame = (currentFrame + 1) % frames.length; render(); return;
  }
  if(e.key === ']'){ changeDisplayOrder(1); return; }
  if(e.key === '['){ changeDisplayOrder(-1); return; }
  switch(e.key.toLowerCase()){
    case 'r': setEditMode('rotate'); break;
    case 'g': setEditMode('move'); break;
    case 't': setEditMode('whole'); break;
    case 's': setEditMode('scale'); break;
    case 'p': setEditMode('anchor'); break;
    case 'b': addEmptyLayer('ボーン', document.getElementById('newLayerShapeSelect').value); break;
    case 'f': addFrame(false); break;
    case 'i': if(selectedLayer) document.getElementById('replaceImageInput').click(); break;
    case 'escape': clearSelection(); break;
    case 'delete': if(selectedLayer) deleteLayer(); break;
  }
});

window.render_game_to_text = () => JSON.stringify({
  mode:'2d-bone-motion-editor',
  coordinates:'stage origin is top-left; x increases right, y increases down',
  project:{name:project.meta?.name,rigType:project.meta?.rigType || 'standard_2d',poseType:project.meta?.poseType || null,editing:currentAnimation()?.name || 'デフォルト',frame:currentFrame+1,frameCount:activeFrames().length,animationCount:project.animations.length,boneCount:project.layerOrder.length,referencePose:project.meta?.referencePoseName || null,baseImage:project.imageSources?.[project.baseImageSourceId]?.name || null,imageSlots:Object.fromEntries(IMAGE_SLOT_DEFS.map(def=>[def.id,{count:project.imageSlots?.[def.id]?.sourceIds?.length || 0,active:project.imageSources?.[activeImageSlotSourceId(def.id)]?.name || null}])),imageDisplayScalePercent:Math.round((Number(project.meta?.imageDisplayScale)||1)*100),centerGuides:project.meta?.display?.centerGuides!==false,partGroups:Object.values(project.partGroups || {}).map(group=>({id:group.id,bones:group.boneKeys?.length || group.boneIds?.length || 0,mode:group.renderMode}))},
  selectedBone:selectedLayer ? {
    id:selectedLayer,
    name:project.layers[selectedLayer]?.name,
    pivotX:project.layers[selectedLayer]?.ox,
    pivotY:project.layers[selectedLayer]?.oy,
    headX:project.layers[selectedLayer]?.headX,
    headY:project.layers[selectedLayer]?.headY,
    width:Number(currentPose()?.w)||0,
    height:Number(currentPose()?.h)||0,
    displayWidth:boneEditorDisplaySize(project.layers[selectedLayer],currentPose()).w,
    displayHeight:boneEditorDisplaySize(project.layers[selectedLayer],currentPose()).h,
    displaySizeOnly:!!project.meta.boneDisplaySizeMode,
    positionLocked:!!project.layers[selectedLayer]?.positionLocked,
    imageFlipX:effectiveBoneImageFlip(selectedLayer,currentPose(),'x'),
    imageFlipY:effectiveBoneImageFlip(selectedLayer,currentPose(),'y'),
    imageRole:project.layers[selectedLayer]?.imageSourceRole || null,
    imageSlot:findMeshBindingForBone(selectedLayer)?.imageSourceSlot || project.layers[selectedLayer]?.imageSourceSlot || null
  } : null,
  editMode:getEditMode(),
  wholeMoveAxis:getWholeMoveAxis(),
  onionSkin:{enabled:!!project.meta.display.onionSkin,visible:onionSkinCanvasEl?.classList.contains('visible')||false,sourceFrame:project.meta.display.onionSkin && currentFrame>0 ? currentFrame : null,opacity:.25},
  selectedTarget:backgroundSelected?'background':selectedLayer?'bone':null,
  background:(()=>{ const background=currentBackground() || {}; return {id:background.id || null,name:background.name || null,source:project.imageSources?.[background.sourceId]?.name || null,layerNo:getBackgroundLayerNo(background.id),x:Number(background.x)||0,y:Number(background.y)||0,scale:Number(background.scale)||1,opacity:Number(background.opacity ?? 1),flipX:!!background.flipX,flipY:!!background.flipY,adjusting:backgroundAdjustMode}; })(),
  backgrounds:project.backgrounds.map(background=>({id:background.id,name:background.name,source:project.imageSources?.[background.sourceId]?.name || null,layerNo:getBackgroundLayerNo(background.id),x:Number(background.x)||0,y:Number(background.y)||0,scale:Number(background.scale)||1,opacity:Number(background.opacity ?? 1),flipX:!!background.flipX,flipY:!!background.flipY})),
  draftBackup:{blocked:draftAutoSaveBlocked},
  meshEditor:meshEditorState ? {slot:meshEditorState.partSlot,chain:chainLabel(meshEditorState.boneChain),points:meshEditorState.controlPoints.length,activePoint:meshEditorState.activePoint,flipX:meshEditorState.flipX,flipY:meshEditorState.flipY,boneFlipX:Object.keys(meshEditorState.boneFlipX || {}),rotation:meshEditorState.rotation,sourceRect:normalizeMeshSourceRect(meshEditorState.sourceRect)} : null,
  meshBindings:Object.values(project.meshBindings || {}).map(binding=>({id:binding.id,slot:binding.partSlot,imageSlot:binding.imageSourceSlot || null,name:binding.name,points:binding.controlPoints?.length || 0,boneFlipX:Object.keys(binding.boneFlipX || {}),resizeBoxWidth:Number(binding.resizeBoxWidth)||0,editorResizeBoxWidth:Number(binding.editorResizeBoxWidth)||0,source:project.imageSources?.[activeImageSlotSourceId(binding.imageSourceSlot) || binding.sourceId]?.name || null,sourceRect:normalizeMeshSourceRect(binding.sourceRect),targetScaleX:Number(binding.targetScaleX)||1,targetScaleY:Number(binding.targetScaleY)||1,targetOffsetX:Number(binding.targetOffsetX)||0,targetOffsetY:Number(binding.targetOffsetY)||0,targetCrossSections:clone(binding.targetCrossSections || [])})),
  dialogs:{library:!!projectLibraryDialogEl?.open,mesh:!!meshBindingDialogEl?.open,partReference:!!partReferenceDialogEl?.open}
});
window.advanceTime = () => render();
window.getPartTemplateKit = () => buildPartTemplateKit();
window.getPartTemplateManifest = () => buildPartTemplateManifest();

function fitEmbeddedPreview(){
  if(!embeddedPreviewMode || !stageEl || !project?.layerOrder?.length) return;
  const points=[];
  activeFrames().forEach(frame=>{
    const world=getWorldState(frame);
    project.layerOrder.filter(isLayerActiveForCurrentAnimation).forEach(id=>{
      const state=world[id];
      if(!state) return;
      [{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}].forEach(corner=>{
        points.push(boneRectCornerWorld(state,state.pose.w,state.pose.h,corner));
      });
    });
  });
  if(!points.length) return;
  const minX=Math.min(...points.map(point=>point.x));
  const minY=Math.min(...points.map(point=>point.y));
  const maxX=Math.max(...points.map(point=>point.x));
  const maxY=Math.max(...points.map(point=>point.y));
  const width=Math.max(1,maxX-minX),height=Math.max(1,maxY-minY);
  const rect=stageEl.getBoundingClientRect();
  const horizontalPadding=Math.min(14,Math.max(4,rect.width*.08));
  const topPadding=Math.min(10,Math.max(4,rect.height*.05));
  const bottomPadding=Math.min(3,Math.max(1,rect.height*.012));
  const zoom=Math.max(.18,Math.min(1.35,(rect.width-horizontalPadding*2)/(width*1.2),(rect.height-topPadding-bottomPadding)/(height*1.2)));
  const centerX=(minX+maxX)/2;
  stageView.zoom=zoom;
  stageView.x=-(centerX-500)*zoom;
  stageView.y=rect.height/2-bottomPadding-(maxY-500)*zoom;
  applyStageView();
}

function showEmbeddedPreviewError(message){
  const node=document.createElement('p');
  node.className='embedded-preview-error';
  node.textContent=message;
  stageEl?.appendChild(node);
  window.parent?.postMessage({type:'bone-motion:error',message},window.location.origin);
}

function selectEmbeddedPreviewAnimation(animationId){
  if(!embeddedPreviewMode || !embeddedPreviewReady || !project) return false;
  const nextId=animationId==='__default__'?null:animationId;
  if(nextId && !project.animations?.some(animation=>animation.id===nextId)) return false;
  stop();
  currentAnimationId=nextId;
  currentFrame=0;
  const fps=Math.max(1,Number(currentAnimation()?.fps)||Number(project.meta?.fps)||8);
  const fpsInput=document.getElementById('fpsInput');
  if(fpsInput) fpsInput.value=String(fps);
  render();
  fitEmbeddedPreview();
  if(currentAnimation()?.frames?.length>1) play();
  return true;
}

async function openEmbeddedPreview(){
  const projectId=editorUrlParams.get('project');
  const animationId=editorUrlParams.get('animation');
  if(!projectId || !animationId){ showEmbeddedPreviewError('モーションが未設定です'); return; }
  try{
    const response=await fetch(`/api/local/bone-motion-projects?id=${encodeURIComponent(projectId)}`,{cache:'no-store'});
    const entry=await response.json().catch(()=>({}));
    if(!response.ok || !entry.project) throw new Error(entry.error || 'モーションを読み込めませんでした');
    project=clone(entry.project);
    ensureProjectSettings();
    currentAnimationId=null;
    if(animationId!=='__default__' && !project.animations?.some(animation=>animation.id===animationId)) throw new Error('指定したモーションが見つかりません');
    currentFrame=0;
    selectedLayer=null;
    backgroundSelected=false;
    lastDefaultFrameSnapshot=clone(project.defaultFrame);
    project.meta.display={...project.meta.display,labels:false,anchors:false,lines:false,bones:false,images:true,onionSkin:false,centerGuides:false,groundVisible:false};
    embeddedPreviewReady=true;
    selectEmbeddedPreviewAnimation(pendingEmbeddedAnimationId || animationId);
    pendingEmbeddedAnimationId=null;
    requestAnimationFrame(()=>{
      fitEmbeddedPreview();
      window.parent?.postMessage({type:'bone-motion:ready',projectId,animationId:currentAnimationId || '__default__'},window.location.origin);
    });
    window.addEventListener('resize',fitEmbeddedPreview);
  }catch(error){
    showEmbeddedPreviewError(error.message || 'モーションを読み込めませんでした');
  }
}

if(embeddedPreviewMode) openEmbeddedPreview();
else openProjectLibrary();

window.addEventListener('message',event=>{
  if(!embeddedPreviewMode || event.origin!==window.location.origin || event.data?.type!=='bone-motion:set-animation') return;
  const animationId=String(event.data.animationId || '__default__');
  if(!selectEmbeddedPreviewAnimation(animationId)) pendingEmbeddedAnimationId=animationId;
});
