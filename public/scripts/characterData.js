const characterData = {
  // キャラクターの基本情報
  name: "", // キャラクター名

  // クエストとストーリー
  questProgress: [
    // クエストごとの進行状況
    // 例: { questId: "001", progress: "進行中" }
  ],
  storyFlags: {
    // ストーリーイベントの進行状況を記録
    // 例: {"イベント001": true, "イベント002": false}
  },

  // 装備関連
  equipmentSlot: {
    // 各部位の装備スロット
    武器: null, // 右手に装備中のアイテム
    武器2: null, // 左手に装備中のアイテム
    頭: null, // 頭部装備
    体: null, // 胴体装備
    足: null, // 足装備
    装飾1: null,
    装飾2: null,
  },
  inventory: [], // 所持アイテムリスト
  maxInventory: 15, // 最大所持可能数
  storage: [], // 倉庫アイテムリスト
  money: 0, // 所持金

  // ギルド/パーティー
  party: {
    name: "", // キャラクター名
    race: "ヒューマン", // 種族名（例: 人族、亜人、魔族など）
    Role: Array.from({ length: 20 }, () => ({
      roleName: null, // クラス名または種族
      Lv: null, // レベル（そのクラスでの習熟度）
      Ef: null, // 努力値（追加でアビリティを取得）
    })),

    // ステータス関連情報
    stats: {
      allLv: 0, // 全体の合計レベル
      allEf: 0, // 全体の合計努力値
      baseStats: {}, // 基礎ステータス（例: HP, MP, 攻撃など初期値）
      weaknesses: [], // 弱点（例: 火が弱点、魔法攻撃が弱点など）
      bodyType: 0, // 肉体種別（例: 0=人型、1=獣型など）
      // 一時的なバフ/デバフ
      temporaryBonuses: {}, // 各ステータスに一時的な補正値を記録
      abilities: {},
      cooldowns: {},
      statusEffects: [], // 現在の状態異常（例: 毒、麻痺など）
      // 戦闘関連
      experience: 0, // 現在の経験値
      nextLevelExp: 100, // 次のレベルに必要な経験値
    },
  },
  guild: {
    // ギルド情報
    name: "", // ギルド名
    rank: 0, // ギルドランク
    contributionPoints: 0, // 貢献ポイント
  },

  // その他の情報
  memoryStreet: [], // 記憶した街（転移で移動可能）
  location: "", // 現在地
  savePoint: null, // 最後にセーブした地点
};
