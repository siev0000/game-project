const characterData = {
    // キャラクターの基本情報
    name: "", // キャラクター名
    race: "ヒューマン", // 種族名（例: 人族、亜人、魔族など）
    Role: Array.from({ length: 20 }, () => ({
        roleName: null, // クラス名または種族
        Lv: null, // レベル（そのクラスでの習熟度）
        Ef: null, // 努力値（追加でアビリティを取得）
        stats: {}, // クラスごとのステータス（例: HP, MP, 攻撃力など）
        abilities: {} //取得アビリティ
    })),

    // ステータス関連情報
    stats: {
        allLv: 0, // 全体の合計レベル
        allEf: 0, // 全体の合計努力値
        baseStats: {}, // 基礎ステータス（例: HP, MP, 攻撃など初期値）
        TechniqueValues: {}, // 技能値（例: 隠密、感知、威圧などのスキル値）
        resistances: {}, // 耐性（例: 炎耐性、氷耐性など）
        bodyAttributes: {}, // 肉体値（例: 筋力、耐久など）
        weaknesses: [], // 弱点（例: 火が弱点、魔法攻撃が弱点など）
        bodyType: 0, // 肉体種別（例: 0=人型、1=獣型など）
    },

    // 戦闘関連
    experience: 0, // 現在の経験値
    nextLevelExp: 100, // 次のレベルに必要な経験値
    statusEffects: [], // 現在の状態異常（例: 毒、麻痺など）
    combatData: {
        actionPoints: 30, // 行動ポイント（1ターンで行えるアクション数）
        initiative: 10, // 戦闘での行動順序（素早さやスキルに影響される）
        cooldowns: {} // スキルや魔法のクールダウン管理（例: {"スキル名": 2ターン})
    },

    // 一時的なバフ/デバフ
    temporaryBonuses: {
        // 各ステータスに一時的な補正値を記録
    },

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
        '右手': null, // 右手に装備中のアイテム
        '左手': null, // 左手に装備中のアイテム
        '頭': null,   // 頭部装備
        '背中': null, // 背中装備
        '体': null,   // 胴体装備
        '下着': null, // 特殊効果付きの装備
        '腕': null,   // 腕に装備中のアイテム
        '腰': null,   // 腰に装備中のアイテム
        '足': null,   // 足装備
        'メインコア': null, // 特殊なコア装備
        'アームコア': null, // アームコア装備
        'スタートコア': null // 初期コアスロット
    },
    inventory: [], // 所持アイテムリスト
    maxInventory: 15, // 最大所持可能数
    storage: [], // 倉庫アイテムリスト
    money: 0, // 所持金

    // 外見カスタマイズ
    appearance: {
        hairColor: "黒", // 髪色
        eyeColor: "茶", // 目の色
        height: 170, // 身長 (cm)
        weight: 65, // 体重 (kg)
    },

    // ギルド/パーティー
    party: [
        // パーティーメンバーリスト（例: {name: "仲間A", role: "ヒーラー"})
    ],
    guild: {
        // ギルド情報
        name: "", // ギルド名
        rank: 0, // ギルドランク
        contributionPoints: 0 // 貢献ポイント
    },

    // その他の情報
    memoryStreet: [], // 記憶した街（転移で移動可能）
    currentLocation: "村の広場", // 現在地
    notes: null, // メモ（ユーザー用の自由記入フィールド）
    ultimateTechnique: null, // 必殺技の設定
    savePoint: null, // 最後にセーブした地点
};