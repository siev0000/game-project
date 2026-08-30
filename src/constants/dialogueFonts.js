export const DIALOGUE_FONT_OPTIONS = [
  { id: 'consolas', label: 'Consolas', stack: "Consolas, 'Courier New', monospace" },
  { id: 'yu-gothic', label: '游ゴシック', stack: "'Yu Gothic UI', 'Yu Gothic', Meiryo, sans-serif" },
  { id: 'meiryo', label: 'メイリオ', stack: "Meiryo, 'Yu Gothic UI', sans-serif" },
  { id: 'ms-gothic', label: 'MS ゴシック', stack: "'MS Gothic', 'Yu Gothic UI', monospace" },
  { id: 'yu-mincho', label: '游明朝', stack: "'Yu Mincho', 'Hiragino Mincho ProN', serif" },
  { id: 'ms-mincho', label: 'MS 明朝', stack: "'MS Mincho', 'Yu Mincho', serif" },
  { id: 'noto-sans-jp', label: 'Noto Sans JP', stack: "'Noto Sans JP', 'Yu Gothic UI', sans-serif" },
  { id: 'noto-serif-jp', label: 'Noto Serif JP', stack: "'Noto Serif JP', 'Yu Mincho', serif" },
  { id: 'segoe-ui', label: 'Segoe UI', stack: "'Segoe UI', Tahoma, sans-serif" },
  { id: 'tahoma', label: 'Tahoma', stack: "Tahoma, 'Segoe UI', sans-serif" },
  { id: 'trebuchet', label: 'Trebuchet MS', stack: "'Trebuchet MS', Verdana, sans-serif" },
  { id: 'verdana', label: 'Verdana', stack: "Verdana, Geneva, sans-serif" },
  { id: 'arial', label: 'Arial', stack: "Arial, Helvetica, sans-serif" },
  { id: 'courier-new', label: 'Courier New', stack: "'Courier New', Courier, monospace" },
  { id: 'georgia', label: 'Georgia', stack: "Georgia, 'Times New Roman', serif" },
  { id: 'times-new-roman', label: 'Times New Roman', stack: "'Times New Roman', 'Yu Mincho', serif" },
  { id: 'impact', label: 'Impact', stack: "Impact, Haettenschweiler, sans-serif" },
  { id: 'system-sans', label: 'システム・ゴシック', stack: "system-ui, -apple-system, 'Segoe UI', sans-serif" },
  { id: 'system-mono', label: 'システム・等幅', stack: "ui-monospace, Consolas, monospace" }
]

export const LEGACY_DIALOGUE_FONT_IDS = {
  1: 'consolas',
  2: 'yu-gothic',
  3: 'ms-gothic',
  4: 'trebuchet',
  5: 'times-new-roman',
  6: 'tahoma'
}

export const getDialogueFontOption = (id, legacyType = 1) => {
  const fallbackId = LEGACY_DIALOGUE_FONT_IDS[legacyType] || LEGACY_DIALOGUE_FONT_IDS[1]
  return DIALOGUE_FONT_OPTIONS.find(option => option.id === id)
    || DIALOGUE_FONT_OPTIONS.find(option => option.id === fallbackId)
    || DIALOGUE_FONT_OPTIONS[0]
}
