export const characterDataTemplate  = {
  // --- 基本 ---
  id: "", // ユニークID（セーブデータ識別用）
  createdAt: "", // 作成日時
  updatedAt: "", // 最終更新日時
  name: "", // キャラクター名
  gender: null, // 性別（"male", "female", "other" など）
  age: null, // 年齢
  height: null, // 身長（cm）
  weight: null, // 体重（kg）
  appearance: {
    hairColor: "",
    eyeColor: "",
    skinColor: "",
    extra: "", // 傷跡や特徴など
  },
  attribute: null, // 属性ID（炎、氷など）

  // --- ストーリー進行 ---
  questProgress: [], // { questId, progress } の配列
  storyFlags: {}, // イベント進行フラグ
  flags: {}, // その他の条件分岐フラグ
  achievements: [], // 獲得実績・称号リスト

  // --- 装備・所持品 ---
  equipmentSlot: {
    武器: null,
    武器2: null,
    頭: null,
    体: null,
    足: null,
    装飾1: null,
    装飾2: null,
  },
  inventory: [], // 所持アイテム
  maxInventory: 15, // 所持上限
  storage: [], // 倉庫
  money: 0, // 所持金

  // --- パーティー情報 ---
  party: {
    name: "", // パーティー名
    race: "", // 種族名
    selectedRaceId: null, // 選択種族のID
    selectedClassId: null, // 選択クラスのID
    Role: Array.from({ length: 20 }, () => ({
      roleName: null,
      Lv: null,
      Ef: null,
    })),
    stats: {
      allLv: 0,
      allEf: 0,
      baseStats: {}, // HP, MP, 攻撃などの初期値
      weaknesses: [], // 弱点（炎、氷など）
      bodyType: 0, // 0=人型, 1=獣型など
      temporaryBonuses: {}, // 一時補正
      cooldowns: {}, // スキル使用間隔
      statusEffects: [], // 毒、麻痺など
      experience: 0,
      nextLevelExp: 100,
    },
    skills: [], // 習得スキル
    passiveSkills: [], // 常時効果スキル
    unlockedClasses: [], // 開放済みクラス
    battleRecords: { totalBattles: 0, wins: 0, losses: 0, flee: 0 },
  },

  // --- ギルド ---
  guild: {
    name: "",
    rank: 0,
    contributionPoints: 0,
  },

  // --- 評判・関係値 ---
  reputation: {
    factions: {}, // 勢力ごとの友好度
    towns: {}, // 街ごとの評判
  },
  relationships: {}, // NPCとの関係値

  // --- ワールド ---
  memoryStreet: [], // 転移可能な街
  location: "", // 現在地
  savePoint: null, // 最後のセーブ地点

  // --- 設定 ---
  settings: {
    autoBattle: false, // オート戦闘
    messageSpeed: "normal", // メッセージ速度
    bgmVolume: 80,
    seVolume: 80,
  }
};
