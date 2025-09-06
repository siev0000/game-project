// 選択されたキャラクター情報を取得
let selectedIds = JSON.parse(localStorage.getItem('selectedId'));
console.log("selectedId :", selectedIds)


//最終的にこうする
const characterData = {
    // キャラクターの基本情報
    name: "", // キャラクター名

    // ステータス関連情報
    stats: {
        allLv: 10, // 全体の合計レベル
        allEf: 0, // 全体の合計努力値
    },

    // 戦闘関連
    experience: 0, // 現在の経験値
    nextLevelExp: 100, // 次のレベルに必要な経験値

    

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
    },
    
    inventory: [], // 所持アイテムリスト
    maxInventory: 15, // 最大所持可能数
    storage: [], // 倉庫アイテムリスト
    money: 0, // 所持金

    // 外見カスタマイズ
    appearance: {
        hairColor: "黒", // 髪色
        eyeColor: "青", // 目の色
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
    userId: null
};

const characterData2 = {
    // キャラクターの基本情報
    name: "", // キャラクター名
    race: "人族", // 種族名（例: 人族、亜人、魔族など）
    Role: Array.from({ length: 20 }, () => ({
        roleName: null, // クラス名または種族
        Lv: null, // レベル（そのクラスでの習熟度）
        Ef: null, // 努力値（追加でアビリティを取得）
        stats: {}, // クラスごとのステータス（例: HP, MP, 攻撃力など）
        abilities: [] //取得アビリティ
    })),

    // ステータス関連情報
    stats: {
        allLv: 10, // 全体の合計レベル
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

    //装備可能部位
    availableSlots: ['右手', '左手', '頭', '体', '足'],
    
    inventory: [], // 所持アイテムリスト
    maxInventory: 15, // 最大所持可能数
    storage: [], // 倉庫アイテムリスト
    money: 0, // 所持金

    // 外見カスタマイズ
    appearance: {
        hairColor: "黒", // 髪色
        eyeColor: "青", // 目の色
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
    userId: null
};

let playerData = JSON.parse(JSON.stringify(characterData));// JSON.parse(localStorage.getItem('selectedCharacter'));

const statKeys = ['HP', 'MP', 'ST', '攻撃', '防御', '魔力', '精神', '回避', '命中','APP',
    '隠密', '感知', '威圧', '軽業', '技術', '早業',
    '看破', '騙す', '知識', '鑑定', '装置',
    '変装', '制作', '精神接続', '魔法技術', '指揮'];

const setSumKeys = ["物理軽減", "魔法軽減", "切断耐性", "精神耐性", "毒耐性", 
    "盲目耐性", "幻覚耐性", "石化耐性", "怯み耐性", "拘束耐性", 
    "呪い耐性", "即死耐性", "時間耐性", "出血耐性", "疲労耐性", 
    "体幹耐性", "物理耐性", "魔法耐性", "Cr率耐性", "Cr威力耐性",
    "素手", "角", "牙", "爪", "翼", "尾", "外皮", "外殻", "再生", "SIZ"
    ];


const statsDisplayKeys = ['HP', 'MP', 'ST', '攻撃', '防御', '魔力', '精神', '回避', '命中'];

const TechniqueKeys = ['隠密', '感知', '威圧', '軽業', '技術', '早業',
    '看破', '騙す', '知識', '鑑定', '装置',
    '変装', '制作', '精神接続', '魔法技術', '指揮'];

const resistanceKeys = ["物理軽減", "魔法軽減", "切断耐性", "精神耐性", "毒耐性", 
    "盲目耐性", "幻覚耐性", "石化耐性", "怯み耐性", "拘束耐性", 
    "呪い耐性", "即死耐性", "時間耐性", "出血耐性", "疲労耐性", 
    "体幹耐性", "物理耐性", "魔法耐性", "Cr率耐性", "Cr威力耐性"
    ];

const bodyKeys =["素手", "角", "牙", "爪", "翼", "尾", "外皮", "外殻", "再生", "SIZ"]

const attributes = [
    "HP", "MP", "ST", "攻撃", "防御", "魔力", "精神", "速度", "命中", 
    "SIZ", "APP", "隠密", "感知", "威圧", "軽業", "技術", "早業", 
    "看破", "騙す", "知識", "鑑定", "装置", "変装", "制作", "精神接続", 
    "魔法技術", "指揮", "角", "牙", "爪", "翼", "尾", "外皮", "装甲", 
    "再生", "物理軽減", "魔法軽減", "切断耐性", "貫通耐性", "打撃耐性", 
    "炎耐性", "氷耐性", "雷耐性", "酸耐性", "音耐性", "光耐性", "闇耐性", 
    "善耐性", "悪耐性", "正耐性", "負耐性", "精神耐性", "毒耐性", 
    "盲目耐性", "幻覚耐性", "石化耐性", "怯み耐性", "拘束耐性", "呪い耐性", 
    "即死耐性", "時間耐性", "出血耐性", "疲労耐性", "体幹耐性", "物理耐性", 
    "魔法耐性", "Cr率耐性", "Cr威力耐性", "回避率", "命中率"
]

const passive_Skill_value = [
    "消費増加", "全力", "ダメージ幅", "防御無視", "切断倍", "貫通倍", "打撃倍", 
    "炎倍", "氷倍", "雷倍", "酸倍", "音倍", "光倍", "闇倍", "善倍", 
    "悪倍", "正倍", "負倍", "精神攻撃倍", "毒倍", "盲目倍", "幻覚倍", 
    "石化倍", "怯み倍", "拘束倍", "呪い倍", "即死倍", "時間倍", "出血倍", 
    "疲労倍", "体幹倍", "物理ガード倍", "魔法ガード倍", "Lv倍率", "HP倍率", 
    "MP倍率", "ST倍率", "攻撃倍率", "防御倍率", "魔力倍率", "精神倍率", 
    "速度倍率", "命中倍率", "SIZ倍率", "APP倍率", "Lv", "HP", "MP", 
    "ST", "攻撃", "防御", "魔力", "精神", "速度", "命中", "SIZ", "APP", 
    "隠密", "感知", "威圧", "軽業", "技術", "早業", "看破", "騙す", 
    "知識", "鑑定", "装置", "変装", "制作", "精神接続", "魔法技術", 
    "指揮", "素手", "角", "牙", "爪", "翼", "尾", "外皮", "外殻", 
    "再生", "物理軽減", "魔法軽減", "遠隔軽減", "切断耐性", "貫通耐性", 
    "打撃耐性", "炎耐性", "氷耐性", "雷耐性", "酸耐性", "音耐性", 
    "闇耐性", "光耐性", "善耐性", "悪耐性", "正耐性", "負耐性", 
    "精神耐性", "毒耐性", "盲目耐性", "幻覚耐性", "石化耐性", "怯み耐性", 
    "拘束耐性", "呪い耐性", "即死耐性", "時間耐性", "出血耐性", 
    "疲労耐性", "体幹耐性", "物理耐性", "魔法耐性", "Cr率耐性", 
    "Cr威力耐性", "移動速度", "移動倍率"
]

// 素材の説明	武器の説明
const itemCategories = {
    basic: {
      keys: ["全力", "威力","射撃","射程", "弾倉", "リロード時間", "攻撃回数", "ガード", "属性", "属性値","Cr率", "Cr威力","物理軽減", "魔法軽減","回避率", "命中率","攻撃タイプ", "武器の説明", "種別", "素材", "素材の説明", "説明"],
      label: "基本情報"
    },
    attack: {
      keys: [
        "全力", "威力", "ガード", "切断", "貫通", "打撃", "射撃",
        "属性", "属性値", "変動", "Cr率", "Cr威力", "射程", "弾倉", "リロード時間", "攻撃回数", "攻撃タイプ",
        "能力", "武器特性","物理軽減", "魔法軽減", "切断耐性", "貫通耐性", "打撃耐性",
        "炎耐性", "氷耐性", "雷耐性", "酸耐性", "音耐性", "闇耐性", "光耐性",
        "善耐性", "悪耐性", "正耐性", "負耐性", "精神耐性", "毒耐性",
        "盲目耐性", "幻覚耐性", "石化耐性", "怯み耐性", "拘束耐性",
        "呪い耐性", "即死耐性", "時間耐性", "出血耐性", "疲労耐性",
        "体幹耐性", "物理耐性", "魔法耐性", "Cr率耐性", "Cr威力耐性", 
        "回避率", "命中率",'HP', 'MP', 'ST', '攻撃', '防御', '魔力', '精神', '回避', '命中', 'APP',
        '隠密', '感知', '威圧', '軽業', '技術', '早業',
        '看破', '騙す', '知識', '鑑定', '装置',
        '変装', '制作', '精神接続', '魔法技術', '指揮'],
      label: "ステータス"
    },
  };

　//文字アイコン
  const iconData = [
    { name: "炎", icon: "🔥" }, { name: "氷", icon: "❄️" }, { name: "雷", icon: "⚡️" },{ name: "酸", icon: "💧" }, { name: "音", icon: "♪" }, { name: "闇", icon: "⚫" },
    { name: "光", icon: "✨" }, { name: "善", icon: "⚖️" }, { name: "悪", icon: "🔗" },{ name: "正", icon: "💖" }, { name: "負", icon: "🖤" }, { name: "精神攻撃", icon: "🌀" },
    { name: "毒", icon: "☠️" }, { name: "盲目", icon: "👁️‍🗨️" }, { name: "幻覚", icon: "🌫️" },{ name: "石化", icon: "🌑" }, { name: "怯み", icon: "🪫" }, { name: "拘束", icon: "🕸️" },
    { name: "呪い", icon: "🧿" }, { name: "即死", icon: "🖤" }, { name: "時間", icon: "⏱️" },{ name: "出血", icon: "🩸" }, { name: "疲労", icon: "💦" }, { name: "体幹", icon: "💫" },
    { name: "物理ガード", icon: "🛡️" }, { name: "太陽", icon: "☀️" }, { name: "月", icon: "🌙" },{ name: "星", icon: "🌟" }, { name: "重力", icon: "🕳️" }, { name: "大地", icon: "⛰️" },
    { name: "植物", icon: "🍀" }, { name: "風", icon: "🌪️" }, { name: "空間", icon: "🧊" },{ name: "物理", icon: "💥" }, { name: "力場", icon: "☄️" }, { name: "武器", icon: "⚔️" },
    { name: "弓", icon: "🏹" }, { name: "銃", icon: "🔫" }, { name: "盾", icon: "🛡️" },{ name: "素手", icon: "✊" }, { name: "足", icon: "🦶" },{ name: "角", icon: "🦄" }, 
    { name: "牙", icon: "🦷" },{ name: "爪", icon: "🐾" }, { name: "翼", icon: "🕊️" }, { name: "尾", icon: "🐉" },{ name: "魔眼", icon: "👁️" }, { name: "スキル", icon: "🧬" }, 
    { name: "魔法", icon: "🔮" }, { name: "吐息", icon: "🌬️" },{ name: "単体", icon: "👤" }, { name: "全体", icon: "👥" }, { name: "なし", icon: "🔼" }
  ];
  
  

// 呼び出しておいた、Excelのデータ群
let itemList = {}
let equipment = {}
let SkillList = {}

let SkillData = {}
let roleData = {}

let enemyData = {}
let enemyParty = {}
let maxStorageCapacity = 50; // 倉庫の最大容量を定義

let charactersData = JSON.parse(JSON.stringify(characterData));

let allCharacters = [];
// モーダルスタック モーダルを二重で開く処理があったり、複数のモーダルがあるのですが
const modalStack = [];

// インベントリを開いた場所フラグ　ショップなら売却 倉庫ならしまう 道具なら使用できる
let isInShop = false
let isInStorage = false;
let isInUse = false;

let selectedSlot = null; // 選択中のスロット
let selectedItem = null; // 選択中のアイテム

const positionSlots = { 前衛: [false, false, false], 後衛: [false, false, false] }; // 前衛/後衛スロットの状態管理

const statsModal = document.getElementById('statsModal');
const statsDetails = document.getElementById('statsDetails');
const TechniquesDetails = document.getElementById('TechniquesDetails');
const statsTab = document.getElementById('statsTab');
const TechniquesTab = document.getElementById('TechniquesTab');
const statsView = document.getElementById('statsView');
const TechniquesView = document.getElementById('TechniquesView');
const closeStatsModal = document.getElementById('closeStatsModal');

//モーダル表示時の処理
const overlay = document.getElementById("overlay");

const authToken = localStorage.getItem('authToken') || '';
let refreshToken = null; // リフレッシュトークンをメモリに保存
let matchingCharacter = []


//============== ステータス表記 ============================================================
function convertPlayerToParty(playerData) {
    // プレイヤーのデータをparty形式に変換
    const playerPartyData = {
      name: playerData.name,
      race: playerData.race,
      Role: playerData.Role,
      stats: playerData.stats,
      equipmentSlot: playerData.equipmentSlot || {}, // 装備データを統合
      inventory: playerData.inventory || [], // インベントリを統合
      position: playerData.position || { type: "前衛", slot: 1 }, // デフォルト位置を設定
      isPlayer: true // プレイヤーフラグ
    };
  
    // プレイヤーをpartyに統合
    playerData.party = {
      [playerPartyData.name]: playerPartyData,
      ...playerData.party // 既存の仲間データを維持
    };
  
    return playerData;
  }

// ステータスを消費する例
// document.getElementById('exploreButton').addEventListener('click', () => {
//     if (playerStatus.ST >= 10) {
//         playerStatus.ST -= 10;
//         addLog('探索を行いました。ST -10');
//         updatePlayerStats();
//     } else {
//         addLog('STが不足しています！');
//     }
// });
const ZLP = {} //仮作成

// ロード時処理　ログの追加方法 addLog('STが不足しています！');
document.addEventListener('DOMContentLoaded', async () => {
    console.log(" authToken : ", localStorage.getItem('authToken')," : " ,authToken)
    console.log( " selectedIds :", selectedIds)
    playerData = await fetchCharacter(selectedIds)
    console.log("選択されたキャラクター情報を取得 :",playerData)
    console.log("パーティメンバー :", playerData.party)
    allCharacters = [playerData, charactersData];

    
    // データロード
    await loadClasses()
    await loadTechniques()
    await loadEquipments()
    await loadItems()

    await loadEnemys()

    await loadScript('js/characterCreate.js', async () => {
        console.log('ロード完了! js/characterCreate.js');
        
        playerData.party = await npcDataGet(playerData.party)
    
        console.log("playerData.party, :",playerData.party,)
    
        // 横キャラクター表示 これを読み込み直せばデータを再修正できる
        // 
    
        await loadScript('js/dungeon.js', async () => {
            console.log('ロード完了! js/dungeon.js');
        });
        await loadScript('js/guird.js', async () => {
            console.log('ロード完了! js/guird.js');
        });
        await loadScript('js/battles.js', async () => {
            console.log('ロード完了! js/battles.js');
            await displayStatsSet()
        });
        await loadScript('js/log.js', async () => {
            console.log('ロード完了! js/log.js');
        });
        await loadScript('js/mainDisplay.js', async () => {
            console.log('Script loaded successfully!');
            await loadLocations();
            console.log("playerData.location : ", playerData.location, playerData.Role, playerData)
            // currentLocation = playerData.location || "川沿いの林村"
            await loadScript('js/textarea.js', async () => {
                console.log('ロード完了! js/textarea.js');
                await moveToLocation(playerData.location || "アルジビア王国");
            });
            await loadShop()
        });

        // await displayPositionControls()
        await displayCharacterCards()
        document.getElementById("money-display").textContent = playerData.money; 
        matchingCharacter = playerData.party.find(character => character.name === playerData.name);


        await loadScript('js/modal.js', async () => {
            console.log('ロード完了! js/modal.js');
        });
    
    });
});


//============== ステータスの作成 ================================================

// 条件が空または0であるかを判定
function isAllConditionsEmptyOrZero(cls) {
    const conditions = ['条件系統', '条件系統Lv', '条件クラス_1', '条件クラス_2', '条件スキル', '条件属性'];
    return conditions.every(key => !cls[key] || cls[key] === 0);
}

// キャラクターカードをセットする処理
async function displayStatsSet() {

    const characterStatus = document.getElementById('character-status');
    characterStatus.innerHTML = '';

    // 共通のキャラクターカード生成ロジック
    async function createCharacterCard(character) {
        if (!character.name) return;
    
        // 種族とクラスデータを取得
        const raceClass = roleData.find(cls => cls['名前'] === character.Role?.[0]?.roleName);
        const jobClass = roleData.find(cls => cls['名前'] === character.Role?.[1]?.roleName);
    
        // アイコン画像URLの取得
        const getImageURL = (imagePath) => `/images/${imagePath || 'default.png'}`;
        const raceImage = getImageURL(raceClass?.画像url);
        const classImage = getImageURL(jobClass?.画像url);
    
        // キャラクターカード要素の作成
        const card = document.createElement('div');
        card.className = 'character-card';
        card.setAttribute('aria-label', `${character.name}のステータス`);
    
        // アイコンコンテナ部分
        const iconContainer = document.createElement('div');
        iconContainer.className = 'icon-container';
        iconContainer.innerHTML = `
            <img src="${raceImage}" alt="種族アイコン" class="race-icon">
            <img src="${classImage}" alt="クラスアイコン" class="class-icon">
        `;
    
        // コンテンツコンテナ部分
        const contentContainer = document.createElement('div');
        contentContainer.className = 'content-container';
    
        // キャラクター名
        const characterName = document.createElement('div');
        characterName.className = 'character-name';
        characterName.textContent = character.name;
    
        // ステータスコンテナ
        const statusContainer = document.createElement('div');
        statusContainer.className = 'status-container';
    
        // ステータスバーの生成関数
        const generateStatusBar = (key, currentValue, maxValue, percentage) => {
            const statusBar = document.createElement('div');
            statusBar.className = 'status-bar';
    
            statusBar.innerHTML = `
                <span class="label">${key}:</span>
                <div class="bar-container">
                    <div class="bar-fill ${key.toLowerCase()}-bar-fill" style="width: ${percentage}%;"></div>
                </div>
                <span class="value">${currentValue}/${maxValue}</span>
            `;
            return statusBar;
        };
    
        // ステータスバーの生成と追加
        const statusKeys = ['HP', 'MP', 'ST'];
        statusKeys.forEach((key) => {
            const currentValue = character.stats.totalStats[key] || 0;
            const maxValue = character.stats.totalStats[`max${key}`] || currentValue;
            const percentage = Math.round((currentValue / maxValue) * 100);
            statusContainer.appendChild(generateStatusBar(key, currentValue, maxValue, percentage));
        });
    
        // コンテンツコンテナにキャラクター名とステータスコンテナを追加
        contentContainer.appendChild(characterName);
        contentContainer.appendChild(statusContainer);
    
        // カードにアイコンコンテナとコンテンツコンテナを追加
        card.appendChild(iconContainer);
        card.appendChild(contentContainer);
    
        // カードクリック時のイベント設定
        const modalType = character.stats.isPlayer ? 'player-modal' : 'character-modal';
        card.addEventListener('click', () => showCharacterModal(modalType, character));
    
        // カードを返す
        return card;
    }
    
    

    // allCharacters 配列の処理
    playerData.party.forEach(async character => {
        // stats が存在しない場合、空オブジェクトとして初期化
        if (!character.stats) {
            character.stats = {};
        }
    
        // 名前が一致する場合に isPlayer フラグを設定
        if (playerData.name === character.name) {
            character.isPlayer = true;
        } else {
            character.isPlayer = false;
        }
    
        // キャラクターカードを生成　
        characterStatus.appendChild(await createCharacterCard(character));
    });
}
  


//// ============== ボタンのログ表示 ============================================================
// document.addEventListener('DOMContentLoaded', () => {
//     const logList = document.getElementById('logList');
//     function addLog(message) {
//         const li = document.createElement('li');
//         li.textContent = message;
//         logList.appendChild(li);
//         logList.scrollTop = logList.scrollHeight; // ログが自動的にスクロール
//     }
//     document.getElementById('moveButton').addEventListener('click', () => {
//         addLog('プレイヤーが移動しました。');
//     });

//============== 別ページをロードする用 ===========================================================
function loadScript(src, callback) {
    const script = document.createElement('script');
    script.src = src;
    script.type = 'text/javascript';
    script.onload = callback; // スクリプトがロードされた後に実行される
    script.onerror = () => console.error(`Failed to load script: ${src}`);
    document.head.appendChild(script);
}

// 戻るボタンを無効化する
window.history.pushState(null, null, location.href); // 初期状態を履歴に追加
window.addEventListener("popstate", function (event) {
  window.history.pushState(null, null, location.href); // 戻る操作を防ぐ
  alert("ミスを防ぐため戻る操作は1回無効化されます。戻る場合はもう一度押してください。");
});
window.onbeforeunload = function (event) {
    event.preventDefault();
    event.returnValue = "このページを離れると変更内容が失われる可能性があります。";
};
//===============  モーダル設定  ===================================================================

// キャラカードをクリックするとその中のデータを表示する を検索して表示
async function showCharacterModal(modalId, character) {
    // 対象キャラクターを取得
    // const character = allCharacters.find(char => char._id === characterId);
    if (!character) {
      console.error("キャラクターが見つかりません:", characterId);
      return;
    }
    
    console.log("modalId ", modalId,  "character", character )
    const modal = document.getElementById("character-modal");
    modal.classList.remove('hidden'); // モーダルを表示
    const mainTabs = document.querySelectorAll(`#character-modal-tabs button`);
    const subTabs = document.getElementById(`character-modal-sub-tabs`);
    const modalBody = document.getElementById(`character-modal-body`);
    // 初期状態: ステータスとそのサブタブを表示
    mainTabs.forEach(tab => tab.classList.remove('active'));
    mainTabs[0].classList.add('active'); // ステータスをアクティブに

    // ギルドデータを入れる
    await displayGuildContent(playerData.guild, playerData.questProgress)

    if(modalId == 'player-modal'){ 
        // アビリティの表示
        await displayAbilitiesInTable(character.abilities)
        await displayStatsAll(character.stats)
    
        console.log("subTabs modalId :", subTabs ,modalId)

        // インベントリの表示
        console.log("renderInventor を開く")
        await renderInventory(character.inventory, character.equipmentSlot, character.isPlayer);
        // 装備の表示
        await renderEquipment(character.equipmentSlot, character.inventory, character.isPlayer);

        

    }else{
        // アビリティの表示
        await displayAbilitiesInTable(character.stats.abilities)
        await displayStatsAll(character.stats)
    
        console.log("subTabs modalId :", subTabs ,modalId)
    
        // インベントリの表示
        console.log("NPC Data equipmentSlot :", character.equipmentSlot)
        await renderInventory(character.inventory, character.equipmentSlot , character.isPlayer);
        // 装備の表示
        await renderEquipment(character.equipmentSlot, character.inventory , character.isPlayer);
    }
}

// == キャラクターのギルドデータを表示 ===========================================================================
  
// データをHTMLにセットする

async function displayGuildContent(guildData, questData) {
    // ギルド情報のHTML
    const guildContentHTML = `
      <h3>ギルド情報</h3>
      <p>ギルドランク: ${guildData?.rank || 1}</p>
      <p>貢献度: ${guildData?.contributionPoints || 0}</p>
      <p>名声: ${guildData?.fame || 0}</p>
      <p>受注中のクエスト数: ${questData.ongoing?.length || 0}</p>
      <p>クリア済のクエスト数: ${questData.completed?.length || 0}</p>
    `;
    document.getElementById("guild-info-content").innerHTML = guildContentHTML;

    // クエストIDの抽出
    // questData.ongoingが未定義の場合にデフォルト値として空の配列を設定
    const ongoingQuestIds = Array.isArray(questData.ongoing)
    ? questData.ongoing.map((quest) => quest.questId)
    : [];

    // ongoingQuestIdsをログで確認
    console.log(ongoingQuestIds);

    let completedQuestIds = [];

    if (questData && Array.isArray(questData.completed)) {
        completedQuestIds = questData.completed;
    } else {
        console.error("questData.completedが無効です。", questData);
    }

    // completedQuestIdsを使用
    console.log(`Completed quests: ${completedQuestIds.length}`);

    // 進行中のクエストを取得して分類
    if (ongoingQuestIds.length > 0) {
        const ongoingQuests = await fetchQuestsByIds(ongoingQuestIds);
        const reportableQuestsHTML = [];
        const ongoingQuestsHTML = [];

        ongoingQuests.forEach((quest) => {
            const progressDetails = questData.ongoing.find((oq) => oq.questId === quest.questId)?.progress || [];
            const isReportable = progressDetails.every((p) => p.current >= p.required);

            if (isReportable) {
                // 報告可能なクエスト
                reportableQuestsHTML.push(`
                  <li>
                    <strong>${quest.questName || "クエスト名不明"}</strong><br>
                    場所: ${quest.location || "不明"}<br>
                    報告可能: ${progressDetails.map((p) => `${p.name}: ${p.current}/${p.required}`).join(", ")}<br>
                    報酬: ${(quest.rewards || []).join(", ") || "なし"}<br>
                    経験値: ${quest.exp || 0}
                  </li>
                `);
            } else {
                // 進行中のクエスト
                const progressHTML = progressDetails.map((p) => `${p.name}: ${p.current}/${p.required}`).join(", ");
                ongoingQuestsHTML.push(`
                  <li>
                    <strong>${quest.questName || "クエスト名不明"}</strong><br>
                    場所: ${quest.location || "不明"}<br>
                    進行状況: ${progressHTML || "進捗情報なし"}<br>
                    報酬: ${(quest.rewards || []).join(", ") || "なし"}<br>
                    経験値: ${quest.exp || 0}
                  </li>
                `);
            }
        });

        document.getElementById("quest-info-content").innerHTML = `
          <h3>進行中のクエスト</h3>
          <ul>
            ${ongoingQuestsHTML.join("") || "<p>現在進行中のクエストはありません。</p>"}
          </ul>
          <h3>報告可能なクエスト</h3>
          <ul>
            ${reportableQuestsHTML.join("") || "<p>報告可能なクエストはありません。</p>"}
          </ul>
        `;
    } else {
        document.getElementById("quest-info-content").innerHTML = `
          <h3>進行中のクエスト</h3>
          <p>現在受注中のクエストはありません。</p>
        `;
    }

    // クリア済みクエストを取得して表示
    if (completedQuestIds.length > 0) {
        const completedQuests = await fetchQuestsByIds(completedQuestIds);
        
        console.log(" completedQuests :", completedQuests)
        const completedQuestsHTML = completedQuests
            .map((quest) => `
              <li>
                <strong>${quest.questName || "クエスト名不明"}</strong><br>
                対象: ${quest.targets.map((p) => `${p.name}: ${p.count}`).join(", ")}<br>
                報酬: ${(quest.rewards || []).join(", ") || "なし"}<br>
                経験値: ${quest.exp || 0}
              </li>`)
            .join("");

        document.getElementById("completed-quests-content").innerHTML = `
          <h3>クリアしたクエスト</h3>
          <ul>
            ${completedQuestsHTML}
          </ul>
        `;
    } else {
        document.getElementById("completed-quests-content").innerHTML = `
          <h3>クリアしたクエスト</h3>
          <p>まだクリアしたクエストはありません。</p>
        `;
    }
}

  
  
  // 表示切り替え（ギルド情報）
  function showGuildFomeInfo() {
    console.log("showGuildInfo")
    // 表示切り替え
    document.getElementById("guild-info-content").style.display = "block";
    document.getElementById("quest-info-content").style.display = "none";
    document.getElementById("completed-quests-content").style.display = "none";
  
    // タブのスタイル切り替え
    document.getElementById("guildInfoTab").classList.add("active");
    document.getElementById("questsTab").classList.remove("active");
    document.getElementById("completedQuestsTab").classList.remove("active");
  }
  
  function showQuests() {
    console.log("showQuests")
    // 表示切り替え
    document.getElementById("guild-info-content").style.display = "none";
    document.getElementById("quest-info-content").style.display = "block";
    document.getElementById("completed-quests-content").style.display = "none";
  
    // タブのスタイル切り替え
    document.getElementById("guildInfoTab").classList.remove("active");
    document.getElementById("questsTab").classList.add("active");
    document.getElementById("completedQuestsTab").classList.remove("active");
  }
  
  function showCompletedQuests() {
    console.log("showCompletedQuests")
    // 表示切り替え
    document.getElementById("guild-info-content").style.display = "none";
    document.getElementById("quest-info-content").style.display = "none";
    document.getElementById("completed-quests-content").style.display = "block";
  
    // タブのスタイル切り替え
    document.getElementById("guildInfoTab").classList.remove("active");
    document.getElementById("questsTab").classList.remove("active");
    document.getElementById("completedQuestsTab").classList.add("active");
  }
  
// =============================================================================


// ステータス表示
function displayStatsAll(stats) {
    addStatsTableRows(stats, "#statsTable tbody", statsDisplayKeys);
    addStatsTableRows(stats, "#TechniquesTable tbody", TechniqueKeys);
    addStatsTableRows(stats, "#resistanceTable tbody", resistanceKeys);
    addStatsTableRows(stats, "#bodyTable tbody", bodyKeys);
}

const keyDescriptions = {
    Lv: "レベル、キャラクターの強さの基準。能力の数でもある。",
    HP: "ヘルスポイント、キャラクターの生命力。無くなると死亡する。",
    MP: "マジックポイント。魔法を使うためのリソース。",
    ST: "スタミナ。行動力やアビリティの使うためのリソース。",
    攻撃: "物理攻撃の強さ、高いほど威力が上がる。",
    防御: "物理防御の強さ、高いほど物理の被ダメージが下がり、防御アビリティが強くなる。",
    魔力: "魔法攻撃の強さ、高いほど威力が上がる。",
    精神: "魔法防御の強さ、高いほど魔法の被ダメージが下がる。",
    回避: "回避力の高さ、高いほど攻撃を避けやすくダメージが減衰しやすい。",
    命中: "命中率の高さ、高いほど攻撃が当たりやすい。",
    SIZ: "体の大きさ。高いとHPと攻撃と威圧が上昇し、隠密と速度が下がる。低いと隠密、速度が上昇しHPと攻撃と威圧が減少する。",
    APP: "見た目や心の綺麗さを表す。高いと善人、低いほど悪人。",
    隠密: "戦闘外: 敵に見つかりにくくなる。戦闘中: 不意打ち時の攻撃力上昇や逃走成功率向上。",
    感知: "戦闘外: 敵の位置や罠を発見しやすくなる。戦闘中: 不意打ち耐性強化や追跡能力向上。",
    威圧: "戦闘外: 敵NPCとの交渉を有利に進める。戦闘中: 敵に怯え状態を付与する。",
    軽業: "戦闘外: 高所移動や罠回避が得意になる。戦闘中: 回避率や移動スキルのコスト軽減。",
    技術: "戦闘外: 工具や罠の操作が得意。戦闘中: トラップ設置や武器修理が可能。",
    早業: "戦闘外: 作業速度が向上。戦闘中: 攻撃回数増加や連携攻撃が可能。",
    看破: "戦闘外: 敵の意図や嘘を見抜く。戦闘中: 敵のスキルや弱点を解析。",
    騙す: "戦闘外: NPCとの交渉を成功させる。特殊: 敵に混乱を引き起こす。",
    知識: "戦闘外: 敵やNPCの情報を把握する。戦闘中: 種族特効ダメージボーナスを得る。",
    鑑定: "戦闘外: アイテムや装置の詳細を把握する。戦闘中: 敵の装備情報を確認可能。",
    装置: "戦闘外: 罠設置や鍵開けが得意。戦闘中: 戦闘用トラップで敵にダメージやデバフを与える。",
    変装: "戦闘外: 敵陣潜入や情報収集が可能。戦闘中: 肉体変形スキルが強化される。",
    制作: "戦闘外: 武器や防具の作成能力が向上。戦闘中: 魔法やスキルの性能強化。",
    精神接続: "遠隔操作スキルや精神干渉スキルを強化する。",
    魔法技術: "一部魔法効果を向上させる。",
    指揮: "指揮系スキルの性能が向上する。",
    素手: "武器を装備していない時の数値。",
    角: "突撃や貫通攻撃の威力が上昇する。",
    牙: "貫通と切断攻撃。攻撃時に相手へ組付きを行う。",
    爪: "切断と貫通攻撃。威力が低いが2回攻撃。",
    翼: "打撃攻撃。低威力の2回攻撃。",
    尾: "全力打撃攻撃の威力が上昇する。",
    外皮: "高いほど受ける物理ダメージが下がる。",
    外殻: "一部装備不可だが受けるダメージが減り、属性耐性を得る。",
    再生: "ターン終了時や行動毎にHPを回復する。",
    物理軽減: "物理ダメージを軽減する。",
    魔法軽減: "魔法ダメージを軽減する。",
    遠隔軽減: "遠隔攻撃ダメージを軽減する。",
    切断耐性: "切断攻撃への耐性。",
    貫通耐性: "貫通攻撃への耐性。",
    打撃耐性: "打撃攻撃への耐性。",
    炎耐性: "炎属性攻撃への耐性。",
    氷耐性: "氷属性攻撃への耐性。",
    雷耐性: "雷属性攻撃への耐性。",
    酸耐性: "酸属性攻撃への耐性。",
    音耐性: "音属性攻撃への耐性。",
    闇耐性: "闇属性攻撃への耐性。",
    光耐性: "光属性攻撃への耐性。",
    善耐性: "善属性攻撃への耐性。",
    悪耐性: "悪属性攻撃への耐性。",
    正耐性: "正属性攻撃への耐性。",
    負耐性: "負属性攻撃への耐性。",
    精神耐性: "精神的な攻撃への耐性。",
    毒耐性: "毒状態への耐性。",
    盲目耐性: "盲目状態への耐性。",
    幻覚耐性: "幻覚状態への耐性。",
    石化耐性: "石化状態への耐性。",
    怯み耐性: "怯み状態への耐性。",
    拘束耐性: "拘束状態への耐性。",
    呪い耐性: "呪い状態への耐性。",
    即死耐性: "即死攻撃への耐性。",
    時間耐性: "時間攻撃への耐性。",
    出血耐性: "出血状態への耐性。",
    疲労耐性: "疲労状態への耐性。",
    体幹耐性: "体幹への攻撃耐性。",
    物理耐性: "物理的な攻撃全般への耐性。",
    魔法耐性: "魔法的な攻撃全般への耐性。",
    Cr率耐性: "敵のクリティカル確率を下げる。",
    Cr威力耐性: "敵のクリティカルダメージを軽減する。",
    移動速度: "逃走率や特定の攻撃の効果が強くなる。"
};

// テーブル表示
function addStatsTableRows(stats, tableBodySelector, keys, minTotal = 25) {
    const tableBody = document.querySelector(tableBodySelector);
    tableBody.innerHTML = "";

    keys.forEach(stat => {
        const value = stats?.baseStats?.[stat] ?? 0;
        const passiveStatsPlus = stats?.passiveStats?.[stat] ?? 0;
        const equipmentStatsPlus = stats?.equipmentStats?.[stat] ?? 0;
        const valuePlus = passiveStatsPlus + equipmentStatsPlus;
        const total = value + valuePlus;

        // resistanceTableの場合は total が 0 の場合にスキップ
        if (tableBodySelector === "#resistanceTable tbody" && total === 0) {
            return;
        }

        // それ以外の場合は minTotal を満たさない場合にスキップ
        if (tableBodySelector !== "#resistanceTable tbody" && total < minTotal) return;

        const row = document.createElement("tr");

        console.log("テーブル表示 ツールチップ:", stat, keyDescriptions[stat] );
        // キーに応じた説明文を取得
        const description = keyDescriptions[stat] || "説明なし";

        row.innerHTML = `
            <td title="${description}">${stat}</td>
            <td>${total}</td>
            <td>${valuePlus === 0 ? '-' : valuePlus}</td>
        `;

        tableBody.appendChild(row);
    });
}
// ツールチップを一度だけ作成
const tooltip = document.createElement("div");
tooltip.className = "tooltip";
tooltip.style.display = "none"; // 初期状態は非表示
document.body.appendChild(tooltip);

// マウスオーバーイベント
document.addEventListener("mouseover", (e) => {
    // ツールチップ対象かどうか確認
    if (e.target.matches("td[title]")) {
        tooltip.textContent = e.target.getAttribute("title"); // ツールチップ内容を設定
        tooltip.style.display = "block"; // 表示
        console.log("ツールチップ表示:", tooltip.textContent);

        // ツールチップ位置の更新
        const updatePosition = (event) => {
            const x = event.pageX + 10; // マウスの右下に表示
            const y = event.pageY + 10;

            // 画面外に出ないよう調整
            const tooltipRect = tooltip.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // 右端を超える場合
            if (x + tooltipRect.width > viewportWidth) {
                tooltip.style.left = `${event.pageX - tooltipRect.width - 10}px`;
            } else {
                tooltip.style.left = `${x}px`;
            }

            // 下端を超える場合
            if (y + tooltipRect.height > viewportHeight) {
                tooltip.style.top = `${event.pageY - tooltipRect.height - 10}px`;
            } else {
                tooltip.style.top = `${y}px`;
            }
        };

        // 初期位置の設定
        updatePosition(e);

        // マウス移動時に位置を更新（スロットリング適用）
        const throttledUpdatePosition = throttle(updatePosition, 50); // 50ms 間隔
        document.addEventListener("mousemove", throttledUpdatePosition);

        // マウスが離れたとき
        e.target.addEventListener(
            "mouseleave",
            () => {
                tooltip.style.display = "none"; // 非表示
                document.removeEventListener("mousemove", throttledUpdatePosition);
                console.log("ツールチップを非表示にしました。");
            },
            { once: true }
        );
    }
});

// スロットリング関数（間引き処理）
function throttle(callback, delay) {
    let timeoutId = null;
    return function (...args) {
        if (timeoutId) return;
        timeoutId = setTimeout(() => {
            callback(...args);
            timeoutId = null;
        }, delay);
    };
}





// アビリティ表示
function displayAbilitiesInTable(abilities) {
    const abilitiesTableBody = document.querySelector('#abilities-table tbody');

    console.log(" character.abilities : ", abilities)
    // テーブルの構造（tbodyに挿入する行）
    const tableRows = abilities.map(Skill => `
        <tr>
          <td>
            <ruby>
              ${Skill.name}<rt>${Skill.ルビ || ""}</rt></ruby>
            ${Skill.MP消費 || Skill.ST消費 ? `
              <div style="background-color: #5b5b5b; padding: 0% 2%; font-weight: bold; border-radius: 4px; display: inline-block;">
                ${Skill.MP消費 ? `<span style="color: #87CEFA;">${Skill.MP消費}</span>` : ""}
                ${Skill.MP消費 && Skill.ST消費 ? " / " : ""}
                ${Skill.ST消費 ? `<span style="color: #FFD700;">${Skill.ST消費}</span>` : ""}
              </div>
            ` : ""}
          </td>
          <td>${Skill.系統 || "-"}</td>
          <td>${Skill.分類 || "-"}</td>
          <td>${Skill.説明 || Skill.効果概要 || "詳細なし"}</td>
        </tr>
      `).join('');
    // 枠で囲う時はこちら    
  
    // テーブルの中身を設定
    abilitiesTableBody.innerHTML = tableRows;
}

 
  // メインタブ切り替え処理
function switchTab(event, tabName) {
    // 全てのタブとタブコンテンツを非アクティブに
    const tabs = document.querySelectorAll('#character-modal-tabs button');
    const contents = document.querySelectorAll('.tab-content');
  
    tabs.forEach(tab => tab.classList.remove('active'));
    contents.forEach(content => content.classList.remove('active'));
  
    // クリックされたタブをアクティブに
    event.target.classList.add('active');
  
    // 対応するタブコンテンツを表示
    const targetContent = document.getElementById(`${tabName}-content`);
    if (targetContent) {
      targetContent.classList.add('active');
    }
}

// ステータスタブの切り替え
function switchCategory(category) {
    // すべてのコンテンツを非表示
    const contents = document.querySelectorAll('.category-content');
    contents.forEach(content => content.classList.remove('active'));
  
    // 対応するコンテンツを表示
    const targetContent = document.getElementById(`${category}-content`);
    if (!targetContent) {
      console.error(`コンテンツが見つかりません: ${category}-content`);
      return;
    }
    targetContent.classList.add('active');
    console.log("switchCategory: category =", category);
    console.log("switchCategory: targetContent =", targetContent);
    
  
    // ナビゲーションボタンのアクティブ状態をリセット
    const buttons = document.querySelectorAll('#icon-navigation button');
    buttons.forEach(button => button.classList.remove('active'));
  
    // 選択されたボタンをアクティブに
    const activeButton = [...buttons].find(btn => btn.getAttribute('onclick').includes(category));
    console.log("switchCategory: activeButton =", activeButton);
    if (!activeButton) {
      console.error(`ナビゲーションボタンが見つかりません: ${category}`);
      return;
    }
    activeButton.classList.add('active');
}


// ===== 装備関連のモーダル  ================
// 装備カテゴリデータ
// const equipmentTypes = {
//     武器: ["主武器", "副武器"],
//     頭: ["面兜", "兜", "冠", "面頬", "単眼鏡", "仮面"],
//     体: ["外套", "鎧", "胴衣", "衣布", "法衣", "襯衣"],
//     腕: ["篭手", "腕輪"],
//     腰: ["帯", "腰布"],
//     脚: ["靴", "脚輪"],
//     装飾品: ["首飾り", "指輪"]
//   };
  
  // キャラクター種別データ
  const characterTypes = {
    人形: ["武器", "副武器", "面兜", "兜", "冠", "面頬", "単眼鏡", "仮面", "外套", "鎧", "胴衣", "衣布", "法衣", "襯衣", "篭手", "帯", "腰布", "靴", "腕輪", "脚輪", "首飾り", "指輪"],
    四足歩行: ["副武器", "兜", "冠", "胴衣", "衣布", "法衣", "襯衣", "帯", "腰布", "靴", "腕輪", "脚輪", "首飾り", "指輪"],
    蛇型: ["副武器", "兜", "冠", "胴衣", "衣布", "法衣", "襯衣", "帯", "首飾り", "指輪"],
    非実体: ["主武器", "首飾り", "指輪", "メインコア", "アームコア", "スターコア"]
  };
  
function getUsableEquipment(characterType, equipmentTypes, characterTypes) {
    const usableEquipment = {};

    // キャラクター種別に対応する装備可能リストを取得
    const allowedItems = new Set(characterTypes[characterType] || []);

    // 各装備カテゴリごとにチェック
    Object.entries(equipmentTypes).forEach(([category, items]) => {
        usableEquipment[category] = items.filter(item => allowedItems.has(item));
    });

    return usableEquipment;
}


// 条件に一致するアイテムを取得
function getMatchingItems(slot, playerData, setKey) {
    // スロットが武器かどうかを判定
    const isWeaponSlot = (slot === '武器' || slot === '武器2');

    // 装備中のアイテムを特定（null以外のスロットを収集）
    const equippedItems = Object.values(playerData.equipmentSlot).filter(item => item !== null);

    // 条件に一致するアイテムをフィルタリング
    const matchingItems = playerData.inventory.filter(item => {
        // 装備中のアイテムは除外
        if (equippedItems.includes(item.名前)) {
            return false;
        }

        // スロットが武器または武器2の場合は、種別が武器かどうかだけで判定
        if (isWeaponSlot) {
            return item.種別 === '武器';
        }

        // それ以外の場合はスロット一致かつ setKey と分類一致
        const matchesSlot = item.種別 === slot;
        const matchesCategory = setKey.includes(item.分類);
        return matchesSlot && matchesCategory;
    });

    return matchingItems;
}




// 装備変更モーダルを表示
function openChangeEquipmentModal(slot) {
    // 現在のスロット情報
    // 現在のスロット情報
    let matchingCharacter = playerData.party.find(character => character.name === playerData.name);
    const currentItem = matchingCharacter.equipmentSlot[slot] || '未装備';

    // 人形の装備可能部位を取得
    const setKey = characterTypes.人形;

    // 条件に一致するアイテムを取得
    const equipableItems = getMatchingItems(slot, matchingCharacter, setKey);

    console.log(" 装備変更モーダルを表示 setKey :", slot, setKey)
    console.log(" 装備変更モーダルを表示 :",currentItem, matchingCharacter.inventory, equipableItems)

    // モーダルに現在のスロット情報を表示
    document.getElementById('current-slot').textContent = `スロット: ${slot}`;
    document.getElementById('current-item').textContent = `現在装備: ${currentItem}`;
  
    // テーブルを更新
    const tableBody = document.querySelector('#change-equipment-table tbody');
    tableBody.innerHTML = '';
  
    // 現在装備を外すオプション
    if (currentItem !== '未装備') {
      tableBody.innerHTML += `
        <tr>
          <td>${slot}</td>
          <td>
            <a href="#" onclick="removeEquipment('${slot}')">外す</a>
          </td>
          <td>-</td>
          <td>-</td>
          <td>現在の装備を解除します。</td>
        </tr>
      `;
    }
    //     <a href="#" onclick="moveItemToInventory(${index}); return false;">
    //     <ruby>${item.名前}<rt>${item.ルビ || ''}</rt></ruby>
    //   </a>
    // 装備候補をテーブルに追加
    equipableItems.forEach(item => {
      tableBody.innerHTML += `
        <tr>
          <td>${slot}</td>
          <td>
            <a href="#" onclick="selectItem('${item.名前}', '${slot}')">
               <ruby>${item.名前}<rt>${item.ルビ || ''}</rt></ruby>
            </a>
            
          </td>
          <td>${item.威力 || '-'}/${item.射撃 || '-'}</td>
          <td>${item.ガード || '-'}/${item.物理軽減 || '-'}</td>
          <td>${item.属性 || '-'}</td>
          <td>${item.属性値 || '-'}</td>
        </tr>
      `;
    });
  
    // モーダルを表示
    document.getElementById('change-equipment-modal').style.display = 'flex';
  }
  
  
// 装備項目を表示 playerData.equipmentSlot キャラクター名をセットして、使わないとダメそう、
function renderEquipment(equipmentSlot, inventory, isPlayer = true) {
    const equipmentTable = document.querySelector('#equipment-table tbody');
    console.log("renderEquipment :");

    // 表示する部位のリスト
    const displaySlots = ['武器', '武器2', '頭', '体', '足', '装飾', '装飾'];

    // スロットと装備品をテーブルに挿入
    equipmentTable.innerHTML = displaySlots.map(slot => {
        // スロットに対応する装備名を取得（未装備の場合はnull）
        const itemName = equipmentSlot[slot] || '未装備';

        // 装備中のアイテム情報を取得
        const itemDetails = inventory.find(item => item.名前 === itemName) || {};

        // プレイヤー以外の場合は装備変更リンクを無効化
        const slotHTML = isPlayer
            ? `<a href="#" onclick="openChangeEquipmentModal('${slot}'); return false;">
                  <ruby>${itemName}<rt>${itemDetails.ルビ || ''}</rt></ruby>
              </a>`
            : `<ruby>${itemName}<rt>${itemDetails.ルビ || ''}</rt></ruby>`;

        return `
          <tr>
            <td>${getDisplayName(slot)}</td>
            <td>${slotHTML}</td>
            <td>${itemDetails.威力 || '-'}/${itemDetails.射撃 || '-'}</td>
            <td>${itemDetails.ガード || '-'}/${itemDetails.物理軽減 || '-'}</td>
            <td>${itemDetails.属性 || '-'}</td>
            <td>${itemDetails.属性値 || '-'}</td>
          </tr>
        `;
    }).join('');
}


// スロットの表示名を変換するヘルパー関数
function getDisplayName(slot) {
    const slotDisplayNames = {
        '武器': '主武器',
        '武器2': '副武器',
        '頭': '頭',
        '体': '体',
        '背中': '背中',
        '腕': '腕',
        '腰': '腰',
        '足': '足'
    };
    return slotDisplayNames[slot] || slot;
}



  
  
// 装備を選択
function selectItem(itemName, slot) {
    // スロットに選択したアイテムを装備
    
    matchingCharacter.equipmentSlot[slot] = itemName;
  
    // 装備スロットを再描画
    renderEquipment(matchingCharacter.equipmentSlot, matchingCharacter.inventory);
  
    // インベントリを再描画
    renderInventory(matchingCharacter.inventory, matchingCharacter.equipmentSlot);
  
    // モーダルを閉じる
    closeModal2('change-equipment-modal');
  }

// 装備を外す
function removeEquipment(slot) {
    

    // スロットを未装備状態に
    matchingCharacter.equipmentSlot[slot] = null;

    // 装備スロットを再描画
    renderEquipment(matchingCharacter.equipmentSlot, matchingCharacter.inventory);

    // インベントリを再描画
    renderInventory(matchingCharacter.inventory, matchingCharacter.equipmentSlot);

    // モーダルを閉じる
    closeModal2('change-equipment-modal');
}
  
  
  

// インベントリ内で該当スロットに装備可能なアイテムを取得
function getEquipableItems(slot) {
    
    return matchingCharacter.inventory.filter(item => item.equipableSlots.includes(slot));
}

// 装備可能データを取得
function getCombinedUsableEquipment(characterTypesArray, equipmentTypes, characterTypes) {
    const combinedAllowedItems = new Set();
  
    // 各種別の装備可能リストをマージ
    characterTypesArray.forEach(type => {
      (characterTypes[type] || []).forEach(item => combinedAllowedItems.add(item));
    });
  
    // 装備可能リストをフィルタリング
    const usableEquipment = {};
    Object.entries(equipmentTypes).forEach(([category, items]) => {
      usableEquipment[category] = items.filter(item => combinedAllowedItems.has(item));
    });
  
    return usableEquipment;
  }
  

    
  

// ========= インベントリ ========================================================
function renderInventory(inventory, equippedItem, isPlayer = true) {
    const inventoryTableBody = document.querySelector('#inventory-table tbody');
    const inventoryCount = document.getElementById('inventory-count');

    // ヘルパー関数: 装備中アイテムを判定
    function isEquipped(itemName) {
        if (!equippedItem) {
            return false; // 装備スロットが存在しない場合は未装備とみなす
        }
        return Object.values(equippedItem).includes(itemName);
    }

    // データ整合性チェック
    const equippedItems = inventory.filter(item => isEquipped(item.名前));
    const unequippedItems = inventory.filter(item => !isEquipped(item.名前));

    // インベントリをテーブルに表示
    inventoryTableBody.innerHTML = [
        ...equippedItems.map((item, index) => createInventoryRow(item, index, equippedItem, isPlayer)),
        ...unequippedItems.map((item, index) => createInventoryRow(item, index, equippedItem, isPlayer))
    ].join('');

    // 所持アイテム数の更新
    const maxInventory = playerData.maxInventory || 20; // デフォルト最大値を 20 とする
    inventoryCount.textContent = `${inventory.length} / ${maxInventory}`;
}



// インベントリ行を生成するヘルパー関数
function createInventoryRow(item, index, equipmentSlot, isPlayer) {
    const isEquipped = Object.values(equipmentSlot || {}).includes(item.名前);
    const equippedMark = isEquipped ? '<span class="equipped-mark">E</span>' : '';

    // プレイヤー以外のキャラクターではリンクや装備変更を無効化
    const itemNameHTML = isPlayer
        ? `<a href="#" onclick="openItemDetailModalFromInventory(${index}); return false;">
                <ruby>${item.名前}<rt>${item.ルビ || ''}</rt></ruby>
            </a>`
        : `<ruby>${item.名前}<rt>${item.ルビ || ''}</rt></ruby>`;

    return `
        <tr>
        <td>${item.種別 || '-'}</td>
        <td>
            ${itemNameHTML} ${equippedMark}
        </td>
        <td>${item.威力 || '-'}/${item.射撃 || '-'}</td>
        <td>${item.ガード || '-'}/${item.物理軽減 || '-'}</td>
        <td>${item.属性 || '-'}</td>
        <td>${item.属性値 || '-'}</td>
        </tr>
    `;
}   
  
// ========= インベントリモーダル ========================================================

// インベントリデータを表示
function openItemDetailModalFromInventory(index, activeTab = null) {
    console.log("openItemDetail :", index)

    // const sellButton = document.querySelector('#inventory-item-detail-modal .button-group button.sell-item-button');
    const storageButton = document.querySelector('#inventory-item-detail-modal .button-group button.storage-item-button');
    const useButton = document.querySelector('#inventory-item-detail-modal .button-group button.use-item-button');

      // 売却ボタンの表示切り替え isInUse
    // if (isInShop) {
    //     sellButton.style.display = 'inline-block'; // ショップからの場合、表示
    // } else {
    //     sellButton.style.display = 'none'; // その他の場合、非表示
    // }
    if (isInStorage) {
        storageButton.style.display = 'inline-block'; // ショップからの場合、表示
    } else {
        storageButton.style.display = 'none'; // その他の場合、非表示
    }
    if (isInStorage) {
        useButton.style.display = 'inline-block'; // ショップからの場合、表示
    } else {
        useButton.style.display = 'none'; // その他の場合、非表示
    }


    currentItemIndex = index;
    const description = playerData.inventory[index];
    // const description = getItemDescription(itemName);
    const price = description.金額 || "不明";
  
    // 装備品とアイテムシートからデータを取得して　itemDescriptions に入れておく
    console.log("openItemDetail description:", description)
    // 詳細モーダルにデータを表示
    document.getElementById('inventory-item-name').innerHTML = `<ruby>${description.名前}<rt>${description.ルビ || ""}</rt></ruby>`;

  
    document.getElementById('inventory-item-detail-modal').classList.remove('hidden');
    document.getElementById("inventory-item-detail-modal").style.display = 'flex';

      const tabsContainer = document.getElementById("inventory-item-tabs");
      const contentsContainer = document.getElementById("inventory-item-contents");
    
      // タブとコンテンツをクリア
      tabsContainer.innerHTML = "";
      contentsContainer.innerHTML = "";
    
    // モーダル固有のプレフィックスを定義
    const uniquePrefix = "inventory-item";

    // タブとコンテンツを生成
    Object.keys(itemCategories).forEach(categoryKey => {
    const category = itemCategories[categoryKey];

    // description から条件を満たすキーを抽出
    const filteredKeys = category.keys.filter(key => {
        const value = description[key];
        // console.log("検証中のキー:", key, "値:", value); // デバッグ用
        return value !== undefined && value !== null && value !== 0;
    });

    if (filteredKeys.length > 0) {
        // ユニークなタブ名とコンテンツIDを作成
        const uniqueTabKey = `${uniquePrefix}-${categoryKey}`;
        const uniqueContentId = `${uniqueTabKey}-content`;

        // タブを追加
        const tabButton = document.createElement("button");
        tabButton.textContent = category.label;
        tabButton.dataset.tab = uniqueTabKey; // 一意のキーを設定
        tabButton.onclick = () => switchItemInventoryTab(uniqueTabKey); // 一意のキーを引数に渡す
        tabsContainer.appendChild(tabButton);

        // コンテンツをテーブル形式で追加
        const contentTable = document.createElement("table");
        contentTable.id = uniqueContentId; // 一意のIDを設定
        contentTable.classList.add("inventory-item-tab-content", "hidden");

        // テーブルヘッダー
        const tableHeader = document.createElement("thead");
        tableHeader.innerHTML = "<tr><th>項目</th><th>値</th></tr>";
        contentTable.appendChild(tableHeader);

        // テーブルボディ
        const tableBody = document.createElement("tbody");
        filteredKeys.forEach(key => {
        const row = document.createElement("tr");

        const keyCell = document.createElement("td");
        keyCell.textContent = key;

        const valueCell = document.createElement("td");
        valueCell.textContent = description[key];

        row.appendChild(keyCell);
        row.appendChild(valueCell);
        tableBody.appendChild(row);
        });

        contentTable.appendChild(tableBody);
        contentsContainer.appendChild(contentTable);
    }
    });
    

    if (activeTab && document.querySelector(`#${activeTab}-content`)) {
    switchItemInventoryTab(activeTab);
    } else {
    const firstTab = tabsContainer.querySelector("button");
    if (firstTab) {
        firstTab.click();
    }
    }

    // モーダルを表示
    document.getElementById("inventory-item-detail-modal").classList.add("active");
}

function switchItemInventoryTab(tabName) {
    console.log(`タブ切り替え: ${tabName}`); // デバッグ用
  
    // すべてのタブコンテンツを非表示
    document.querySelectorAll(".inventory-item-tab-content").forEach(content => {
      content.style.display = 'none'; // 非表示
    });
  
    // 対応するタブコンテンツを表示
    const targetContent = document.getElementById(`${tabName}-content`);
    if (targetContent) {
      targetContent.style.display = 'block'; // 表示
      console.log(`表示するコンテンツ: ${targetContent.id}`);
    } else {
      console.warn(`対応するタブコンテンツが見つかりません: ${tabName}`);
    }
  
    // すべてのタブボタンを非アクティブ化
    document.querySelectorAll(`#${uniquePrefix}-tabs button`).forEach(button => {
      button.classList.remove("active"); // 非アクティブ状態を解除
    });
  
    // 対応するタブボタンをアクティブ化
    const targetButton = document.querySelector(`#${uniquePrefix}-tabs button[data-tab="${tabName}"]`);
    if (targetButton) {
      targetButton.classList.add("active"); // アクティブ状態を設定
      console.log(`アクティブなボタン: ${targetButton.textContent}`);
    } else {
      console.warn(`対応するタブボタンが見つかりません: ${tabName}`);
    }

    currentTab = tabName;
  }
  
          
          
      
function showNextInventory() {
    // 現在のインデックスを1つ増やす
    currentItemIndex = (currentItemIndex + 1) % playerData.inventory.length;
    openItemDetailModalFromInventory(currentItemIndex, currentTab); // 現在のタブを維持
}

function showPreviousInventory() {
    // 現在のインデックスを1つ減らす（負の値になった場合、最後に戻る）
    currentItemIndex =
    (currentItemIndex - 1 + playerData.inventory.length) % playerData.inventory.length;
    openItemDetailModalFromInventory(currentItemIndex, currentTab); // 現在のタブを維持
}

function closeInventoryItemModal(){
    document.getElementById('inventory-item-detail-modal').classList.remove('active');
    document.getElementById("inventory-item-detail-modal").style.display = 'none';
}
// ===============================================================================================
// アイテムを倉庫に送る
function moveItemToStorage() {
    if (!isInStorage) {
      alert("倉庫でのみ操作できます。");
      return;
    }
  
    const currentItem = playerData.inventory[currentItemIndex];
    if (!currentItem) {
      alert("選択されたアイテムが見つかりません。");
      return;
    }
  
    if (playerData.storage.length >= 100) { // 倉庫の最大容量を仮定
      alert("倉庫が満杯です。");
      return;
    }
  
    // インベントリから削除して倉庫に追加
    playerData.inventory.splice(currentItemIndex, 1);
    playerData.storage.push(currentItem);
  
    alert(`${currentItem.名前} を倉庫に移動しました。`);
    renderInventory(playerData.inventory, playerData.equipmentSlot); // インベントリを更新
    renderStorage();   // 倉庫を更新（必要に応じて）
  }


//=================================================================================================
// モーダルを開く
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('hidden');
    if (modal) {
      modal.style.display = 'flex'; // モーダルを表示
    }

}

// modal.classList.add('hidden');
// モーダルを閉じる
function closeModal(modalId) {
  console.log(" モーダルを閉じる : ", modalId)
  const modal = document.getElementById(modalId);
  modal.classList.add('hidden');
  overlay.style.display = "none"; // オーバーレイを非表示
}

function closeModal2(modalId) {
    console.log(" モーダルを閉じる : ", modalId)
    const modal = document.getElementById(modalId);
    modal.classList.add('hidden');
    if (modal) {
      modal.style.display = 'none'; // 手動で非表示にする
    }
    overlay.style.display = "none"; // オーバーレイを非表示
}

// アイテム検索 ==================================================================================
// findByIdInLists: 複数のリストを検索してデータを置き換える関数
async function findByIdInLists(targetList, ...lists) {
    if (!Array.isArray(targetList)) return []; // 配列でない場合は空配列を返す

    return Promise.all(
        targetList.map(async targetItem => {
            console.log("targetItem:", targetItem);

            // idがある場合
            if (targetItem.id !== undefined) {
                // idを持つ場合に詳細データを検索
                for (const list of lists) {
                    const foundItem = list.find(item => item.id === targetItem.id);
                    if (foundItem) {
                        return { ...foundItem, ...targetItem }; // 詳細データと元のデータをマージして返す
                    }
                }
                console.log("idのみまたは詳細が見つからない:", targetItem);
                return targetItem; // 詳細データが見つからない場合、そのまま返す
            }

            // idがない場合、名前で検索してidを追加
            if (targetItem.名前) {
                for (const list of lists) {
                    const foundItem = list.find(item => item.名前 === targetItem.名前);
                    if (foundItem) {
                        return { ...targetItem, id: foundItem.id }; // idを追加して返す
                    }
                }
            }

            return targetItem; // idも名前も見つからなければそのまま返す
        })
    );
}



async function findByNameInLists(targetList, ...lists) {
    if (!Array.isArray(targetList)) return []; // 配列でない場合は空配列を返す
    console.log("findByNameInLists:", targetList);
    // targetList の各名前を検索して結果を返す
    return targetList.map(targetItem => {
        console.log("targetItem:", targetItem);

        if (targetItem) {
            // 名前で検索して一致するデータを探す
            for (const list of lists) {
                const foundItem = list.find(item => item.名前 === targetItem);
                if (foundItem) {
                    return foundItem; // 一致したデータをそのまま返す
                }
            }
        }

        return null; // 一致しなかった場合は null を返す
    });
}

// ==== 要素禁止エリア =================================================================================
document.addEventListener("touchstart", (e) => {
    // スワイプリロード検出のために開始時の位置を記録
    window.startY = e.touches[0].clientY;
  }, { passive: false });
  
  document.addEventListener("touchmove", (e) => {
    const currentY = e.touches[0].clientY;
  
    // ページの一番上で、下方向へのスワイプ（リロード操作）を検出して防止
    if (window.scrollY === 0 && currentY > window.startY) {
      // 実際に下方向へ動いている場合のみリロードを防止
      if (currentY - window.startY > 10) { // 必要に応じて閾値を調整
        e.preventDefault(); // スワイプリロードを無効化
      }
    }
  }, { passive: false });
  

  
//============== excelデータ取得用 ===========================================================

// スキル取得
async function loadTechniques() {
    try {
        const response = await fetch('/api/excel/Techniques');
        if (!response.ok) {
            throw new Error('Failed to fetch Technique data');
        }

        const Techniques = await response.json();
        SkillData = Techniques
        console.log('取得したスキルデータ SkillData :', SkillData);
        
    } catch (error) {
        console.error('スキルデータの取得中にエラーが発生:', error);
    }
}

// データをロードしてカテゴリ分け
async function loadClasses() {
    try {
        const response = await fetch('/api/excel/classes');
        const classes = await response.json();
        roleData = classes
        console.log('取得したクラスデータ roleData :', roleData);

    } catch (error) {
        console.error('データの取得に失敗', error);
        document.getElementById('message').textContent = 'データの取得に失敗しました';
    }
}

// アイテム取得　
async function loadItems() {
    try {
        const response = await fetch('/api/excel/items');
        if (!response.ok) {
            throw new Error('Failed to fetch Technique data');
        }

        const Techniques = await response.json();
        itemList = Techniques
        itemList= [...itemList, ...equipment];
        console.log('取得したアイテムデータ itemList :', itemList);
        
    } catch (error) {
        console.error('スキルデータの取得中にエラーが発生:', error);
    }
}

// 装備取得
async function loadEquipments() {
    try {
        const response = await fetch('/api/excel/equipments');
        const classes = await response.json();
        equipment = classes;
        
        console.log('取得した装備データ equipment :', equipment);

    } catch (error) {
        console.error('データの取得に失敗', error);
        document.getElementById('message').textContent = 'データの取得に失敗しました';
    }
}
// エネミー取得
async function loadEnemys() {
    try {
        // `/api/excel/dungeon
        const response = await fetch('/api/excel/enemy');
        if (!response.ok) {
            throw new Error('Failed to fetch Technique data');
        }

        const enemys = await response.json();
        console.log('取得したエネミーデータ enemys :', enemys);

        enemyData = enemys
        
    } catch (error) {
        console.error('スキルデータの取得中にエラーが発生:', error);
    }
}

// エリア取得
async function loadLocations() {
    try {
        // クエリパラメータを使用して特定のショップを取得
        const response = await fetch('/api/excel/locations');
        if (!response.ok) {
            throw new Error(`エリアのデータを取得できませんでした。`);
        }

        const data = await response.json();
        locations = data.reduce((acc, location) => {
            acc[location['名前']] = {
              name: location['名前'],
              ruby: location['ルビ'],
              type: location['種別'],
              image: location['画像ファイル名'],
              story: location['ストーリー'] || '',
              actions: location['アクション'] ? location['アクション'].split('、') : [],
              connections: location['移動先'] ? location['移動先'].split('、') : [],
              dungeon: location['ダンジョン']|| false
            };
            return acc;
          }, {});
      
          console.log('取得した場所データ:', locations);

    } catch (error) {
        console.error('Error loading locations by name:', error);
    }
}

async function characterDataLiseGet (){
    const token = authToken;
    // キャラクターデータを取得
    const response = await fetch('/api/characters', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    const characters = await response.json();
    console.log('characterDataLiseGet取得したキャラクターデータ:', characters);

    return characters
}
// ====================================================================


async function fetchCharacter(selectedId) {
    const url = `/api/characters/${selectedId.id}?userId=${selectedId.userId}`; // idとuserIdをURLに追加
    const authToken = getAuthToken(); // 認証トークンを取得する関数

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}` // 認証トークンを送信
            }
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('取得エラー:', error);
            throw new Error(`取得失敗: ${response.status} ${response.statusText}`);
        }

        const characterData = await response.json();
        console.log('取得成功:', characterData);
        console.log('キャラクター情報が正常に取得されました');
        return characterData;
    } catch (error) {
        console.error('取得中にエラーが発生:', error);
        alert('キャラクター情報の取得中にエラーが発生しました。もう一度お試しください。');
        throw error;
    }
}

async function fetchData() {
    const authToken = getAuthToken(); // トークンを取得
    const url = '/api/characters/all'; // URLを正確に指定

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`, // トークンをヘッダーに含める
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('エラー内容:', errorData);
            // throw new Error(`HTTPエラー: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('取得成功:', data);
        return data;

    } catch (error) {
        console.error('データ取得中にエラー:', error);
        alert('データ取得中に問題が発生しました。');
        throw error;
    }
}

async function fetchQuestsByIds(questIds) {
    const token = authToken; // 認証トークンを取得

    try {
    const response = await fetch("/api/excel/quests/by-ids", {
        method: "POST",
        headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        },
        body: JSON.stringify({ questIds }), // クエストIDの配列を送信
    });

    if (!response.ok) {
        throw new Error(`APIリクエストに失敗しました: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log("取得したクエストデータ:", result);
    return result.quests || [];
    } catch (error) {
    console.error("クエストデータ取得中にエラーが発生しました:", error);
    return [];
    }
}

// == セーブ ===========================================================
// セーブ機能
async function saveGame() {
    if (!playerData || !playerData._id) {
        throw new Error('セーブ失敗: キャラクターIDが存在しません');
    }

    const url = `/api/characters/${playerData._id}`; // キャラクターIDをURLに設定
    const authToken = getAuthToken(); // トークンを取得（実装済みの場合）

    let saveData = JSON.parse(JSON.stringify(playerData)); // 深いコピーを作成

    // 不要なデータを削除
    if (saveData.abilities) {
        delete saveData.abilities;
        console.log("abilities を削除しました");
    }

    if (saveData.stats && saveData.stats.baseStats) {
        delete saveData.stats.baseStats;
        console.log("baseStats を削除しました");
    } else {
        console.log("baseStats が存在しません");
    }

    if (saveData.totalStats) {
        delete saveData.totalStats;
        console.log("totalStats を削除しました");
    }

    if (saveData.consumptionStats) {
        // consumptionStats の中から値が 0 のキーを削除
        Object.keys(saveData.consumptionStats).forEach((key) => {
            if (saveData.consumptionStats[key] === 0) {
                delete saveData.consumptionStats[key];
                console.log(`${key} を削除しました`);
            }
        });
    }
    
    if (saveData.storage) {
        // idだけのデータに変換
        saveData.storage = saveData.storage.map(item => ({ id: item.id }));
        console.log("storage をidのみに変換しました", saveData.storage);
    }
    
    console.log("saveData :", saveData);

    saveData.party.forEach(character => {
        if (character.isPlayer === true) { 
            // プレイヤーキャラクターの場合、stats を削除
            console.log(`${character.name} はプレイヤーキャラクターです。`);
            delete character.stats; // stats を削除

            if (character.inventory) {
                // idだけのデータに変換
                character.inventory = character.inventory.map(item => ({ id: item.id }));
                console.log("inventory をidのみに変換しました", character.inventory);
            }
        } else {
            // プレイヤーではない場合、name と position を残して他を削除
            console.log(`${character.name} はプレイヤーではありません。`);
            // character のプロパティを取得して処理
            Object.keys(character).forEach(key => {
                if (key !== 'name' && key !== 'position' && key !== 'experience') {
                    delete character[key]; // name と position と experience 以外を削除
                }
            });
        }
    });
    
  
    console.log("整理後saveData :", saveData.party);

    // return //デバック用
    try {
        console.log("整理後 saveData.questProgress :", saveData.questProgress);

        saveData.questProgress = {
            ongoing: Array.isArray(saveData.questProgress.ongoing) ? saveData.questProgress.ongoing : [],
            completed: Array.isArray(saveData.questProgress.completed) ? saveData.questProgress.completed : []
        };

        console.log("リクエスト送信直前のquestProgress:", JSON.stringify(saveData.questProgress));

        // Fetch APIでPUTリクエストを送信
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}` // トークンを送信
            },
            body: JSON.stringify(saveData) // playerDataをJSON文字列に変換
        });

        // サーバーのレスポンスを確認
        if (!response.ok) {
            const error = await response.json();
            console.error('更新エラー:', error);
            throw new Error(`更新失敗: ${response.status} ${response.statusText}`);
        }

        const updatedData = await response.json();
        console.log('更新成功:', updatedData);
        alert('ゲームが正常にセーブされました'); // ユーザー通知
        return updatedData; // 更新後のデータを返す
    } catch (error) {
        console.error('更新中にエラーが発生:', error);
        alert('セーブ中にエラーが発生しました。もう一度お試しください。');
        throw error;
    }
}

// トークン取得のサンプル実装
function getAuthToken() {
    // ログイン時に取得したトークンをlocalStorageから取得
    return authToken || '';
}
