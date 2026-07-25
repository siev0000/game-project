export const TEXT_FONT_PRESETS = [
  {
    key: 'standard',
    label: '標準',
    family: 'Arial, "Yu Gothic", Meiryo, sans-serif',
    category: 'ベーシック'
  },
  {
    key: 'magic',
    label: '魔法文字',
    family: '"Cinzel Decorative", Georgia, "Times New Roman", "Yu Mincho", serif',
    category: '魔法・装飾'
  },
  {
    key: 'cyber',
    label: 'サイバー',
    family: 'Orbitron, Oxanium, Consolas, "Courier New", monospace',
    category: '電子・機械'
  },
  {
    key: 'fantasy',
    label: 'ファンタジー',
    family: 'Cinzel, Almendra, "Palatino Linotype", "Book Antiqua", "Yu Mincho", serif',
    category: '幻想・古典'
  },
  {
    key: 'rune',
    label: 'ルーン・古代文字',
    family: '"Uncial Antiqua", MedievalSharp, "Copperplate Gothic Light", "Palatino Linotype", serif',
    category: '古代・碑文'
  },
  {
    key: 'jpMagic',
    label: '和風魔法',
    family: '"Zen Old Mincho", "Shippori Mincho", "Yu Mincho", serif',
    category: '日本語・魔法'
  },
  {
    key: 'fantasyJs',
    label: 'ファンタジー（JS）',
    family: '"Cinzel", "Kaisei Tokumin", serif',
    category: '互換用',
    hidden: true
  },
  {
    key: 'magicJs',
    label: '魔法（JS）',
    family: '"Uncial Antiqua", "Kaisei Decol", serif',
    category: '互換用',
    hidden: true
  },
  {
    key: 'runeJs',
    label: 'ルーン（JS）',
    family: '"Noto Sans Runic", "Cinzel", serif',
    category: '互換用',
    hidden: true
  },
  {
    key: 'mechanic',
    label: 'メカニック',
    family: '"Oxanium", "Dela Gothic One", sans-serif',
    category: '追加フォント'
  },
  {
    key: 'electronic',
    label: '電子',
    family: '"Orbitron", "DotGothic16", monospace',
    category: '追加フォント'
  },
  {
    key: 'magicRing',
    label: '魔法陣',
    family: '"Magic Ring", "Cinzel Decorative", serif',
    category: 'ゲーム内フォント'
  },
  {
    key: 'alienScript',
    label: '異星字',
    family: '"Alien Script", fantasy',
    category: 'ゲーム内フォント'
  },
  {
    key: 'isekai',
    label: '異世界文字',
    family: '"Isekai", fantasy',
    category: 'ゲーム内フォント'
  },
  {
    key: 'nekoNoMezame',
    label: '猫の目覚め',
    family: '"Neko no Mezame", "Yu Gothic", sans-serif',
    category: 'ゲーム内フォント'
  },
  {
    key: 'technoid',
    label: 'テクノイド',
    family: '"Technoid", Orbitron, monospace',
    category: 'ゲーム内フォント'
  },
  {
    key: 'techVermin',
    label: 'テックヴァーミン',
    family: '"Tech Vermin", Oxanium, sans-serif',
    category: 'ゲーム内フォント'
  },
  {
    key: 'techVerminItalic',
    label: 'テックヴァーミン斜体',
    family: '"Tech Vermin Italic", "Tech Vermin", Oxanium, sans-serif',
    category: 'ゲーム内フォント'
  }
]

export const TEXT_FONT_FAMILY_MAP = Object.fromEntries(
  TEXT_FONT_PRESETS.map(font => [font.key, font.family])
)

export const VISIBLE_TEXT_FONT_PRESETS = TEXT_FONT_PRESETS.filter(font => !font.hidden)
