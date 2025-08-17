// 選択されたキャラクター情報を取得
let playerData = JSON.parse(localStorage.getItem('selectedCharacter'));

const characterData = {
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



const statKeys = ['HP', 'MP', 'ST', '攻撃', '防御', '魔力', '精神', '速度', '命中','APP',
    '隠密', '感知', '威圧', '軽業', '技術', '早業',
    '看破', '騙す', '知識', '鑑定', '装置',
    '変装', '制作', '精神接続', '魔法技術', '指揮'];

const setSumKeys = ["物理軽減", "魔法軽減", "切断耐性", "精神耐性", "毒耐性", 
    "盲目耐性", "幻覚耐性", "石化耐性", "怯み耐性", "拘束耐性", 
    "呪い耐性", "即死耐性", "時間耐性", "出血耐性", "疲労耐性", 
    "体幹耐性", "物理耐性", "魔法耐性", "Cr率耐性", "Cr威力耐性",
    "素手", "角", "牙", "爪", "翼", "尾", "外皮", "外殻", "再生", "SIZ"
    ];


const statsDisplayKeys = ['HP', 'MP', 'ST', '攻撃', '防御', '魔力', '精神', '速度', '命中'];

const TechniqueKeys = ['隠密', '感知', '威圧', '軽業', '技術', '早業',
    '看破', '騙す', '知識', '鑑定', '装置',
    '変装', '制作', '精神接続', '魔法技術', '指揮'];

const resistanceKeys = ["物理軽減", "魔法軽減", "切断耐性", "精神耐性", "毒耐性", 
    "盲目耐性", "幻覚耐性", "石化耐性", "怯み耐性", "拘束耐性", 
    "呪い耐性", "即死耐性", "時間耐性", "出血耐性", "疲労耐性", 
    "体幹耐性", "物理耐性", "魔法耐性", "Cr率耐性", "Cr威力耐性"
    ];

const bodyKeys =["素手", "角", "牙", "爪", "翼", "尾", "外皮", "外殻", "再生", "SIZ"]

// 呼び出しておいた、Excelのデータ群
let itemList = {}
let equipment = {}
let SkillList = {}

let SkillData = {}
let roleData = {}

console.log("選択されたキャラクター情報を取得 :",playerData)

let maxStorageCapacity = 50; // 倉庫の最大容量を定義

let charactersData = JSON.parse(JSON.stringify(characterData));

let allCharacters = [playerData, charactersData];

// インベントリを開いた場所フラグ　ショップなら売却 倉庫ならしまう 道具なら使用できる
let isInShop = false
let isInStorage = false;
let isInUse = false;

let selectedSlot = null; // 選択中のスロット
let selectedItem = null; // 選択中のアイテム

const statsModal = document.getElementById('statsModal');
const statsDetails = document.getElementById('statsDetails');
const TechniquesDetails = document.getElementById('TechniquesDetails');
const statsTab = document.getElementById('statsTab');
const TechniquesTab = document.getElementById('TechniquesTab');
const statsView = document.getElementById('statsView');
const TechniquesView = document.getElementById('TechniquesView');
const closeStatsModal = document.getElementById('closeStatsModal');

const authToken = localStorage.getItem('authToken') || '';
let refreshToken = null; // リフレッシュトークンをメモリに保存



// 素材の説明	武器の説明
const itemCategories = {
    basic: {
      keys: ["金額", "武器の説明", "種別", "素材", "素材の説明", "説明"],
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
        "回避率", "命中率",'HP', 'MP', 'ST', '攻撃', '防御', '魔力', '精神', '速度', '命中', 'APP',
        '隠密', '感知', '威圧', '軽業', '技術', '早業',
        '看破', '騙す', '知識', '鑑定', '装置',
        '変装', '制作', '精神接続', '魔法技術', '指揮'],
      label: "ステータス"
    },
  };

//============== ステータス表記 ============================================================
function updatePlayerStats() {
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

    // データロード
    await loadClasses()
    await loadTechniques()
    await loadEquipments()
    await loadItems()
    const dd = await characterDataLiseGet()
    console.log("DDDDeee :", dd["0"])
    allCharacters = [playerData, dd["0"], dd["1"], dd["2"], dd["3"]];
    // キャラクターデータ取得 allCharacters をループさせて作り直したい
    // forEach
    allCharacters.forEach(async setCharacter => {
        console.log("キャラクターデータ取得 :", setCharacter.name); // 各要素の "name" を出力
        if (setCharacter.name) { // nameが存在する場合のみ処理
            // ロールデータ作成し直す
            setCharacter.Role = await rollDataSet(setCharacter.Role);
            const { totalStats, abilitie } = await displayStatsAndAbilities(setCharacter);
            setCharacter.abilities = abilitie
            setCharacter.totalStats = totalStats
            console.log("キャラクターデータ作成 :",setCharacter)
        }
    });

    console.log("allCharacters :",allCharacters)
    

    
    
    // 初期描画
    await renderEquipment(playerData);

    // 横キャラクター表示 これを読み込み直せばデータを再修正できる
    await displayStatsSet()

    await loadScript('js/mainDisplay.js', async () => {
        console.log('Script loaded successfully!');
        await loadLocations();
        console.log("playerData.location : ", playerData.location, playerData.Role, playerData)
        // currentLocation = playerData.location || "川沿いの林村"
        await moveTo(playerData.location || "川沿いの林村");
        await loadShop()
    });
    
});

//============== ステータスの作成 ================================================
async function displayStatsAndAbilities(playerData) {
    const { totalStats, abilities } = calculateStatsAndAbilities(playerData);
    console.log("totalStats , abilities" , totalStats , abilities)

    let abilitie = await getAvailableAbilities(abilities)
    console.log("abilitie : ", abilitie)
    return { totalStats, abilitie }

}

// ロールデータ作成し直す
async function rollDataSet(rollList) {
    // returnData を配列として初期化
    let returnData = [];

    // 非同期処理を考慮して for...of に変更
    for (const roll of rollList) {
        const rollData = roleData.find(cls => cls['名前'] === roll.roleName);

        // rollNameが null または該当データがない場合スキップ
        if (!roll.roleName || !rollData) {
            continue;
        }

        const stats = {};
        let abilities = [];

        // ステータス計算
        statKeys.forEach(key => {
            stats[key] = Math.floor((rollData[key] || 0) * roll.Lv / 10); // ボーナス付きのステータス計算
        });

        setSumKeys.forEach(key => {
            stats[key] = Math.floor((rollData[key] || 0)); // 固定値計算
        });

        // レベルと努力値に基づいてアビリティを取得
        for (let i = 1; i <= (roll.Lv + roll.Ef); i++) {
            const SkillKey = `Skill${i}`; // テンプレートリテラルの正しい使用
            if (rollData[SkillKey]) {
                abilities.push(rollData[SkillKey]);
            }
        }

        // データを returnData に追加
        returnData.push({
            roleName: roll.roleName, // クラス名または種族
            Lv: roll.Lv, // レベル（そのクラスでの習熟度）
            Ef: roll.Ef, // 努力値（追加でアビリティを取得）
            stats: stats, // クラスごとのステータス（例: HP, MP, 攻撃力など）
            abilities: abilities // 取得アビリティ
        });
    }

    // 結果を確認
    console.log(" returnData : ", returnData)

    return returnData ;
}


// 横スライドのキャラクター表示
async function displayStatsSet() {
    console.log("横スライドのキャラクター表示:", allCharacters);
    const characterStatus = document.getElementById('character-status');
    characterStatus.innerHTML = ''; // 初期化
    allCharacters.forEach(character => {
        if (!character.name) return; // 名前がない場合はスキップ
        // 種族とクラスデータを取得
        const raceClass = roleData.find(cls => cls['名前'] === character.Role[0]?.roleName);
        const jobClass = roleData.find(cls => cls['名前'] === character.Role[1]?.roleName);

        const raceImage = `/images/${raceClass?.画像url || 'default.png'}`;
        const classImage = `/images/${jobClass?.画像url || 'default.png'}`;

        console.log("画像URL:", raceImage, classImage);
        console.log("横スライドのキャラクター表示:", character.stats.baseStats);
        // キャラクターカードの生成
        const card = document.createElement('div');
        card.className = 'character-card';
        // card.innerHTML = `
        //     <div class="icon-name-container">
        //         <div class="icon-container">
        //             <img src="${raceImage}" alt="${character.name}の種族" class="race-icon">
        //             <img src="${classImage}" alt="${character.name}のクラス" class="class-icon">
        //         </div>
        //         <p class="character-name">${character.name}</p>
        //     </div>
        //     <p>HP: ${character.stats.baseStats.HP}/${character.stats.baseStats.maxHP || character.stats.baseStats.HP}</p>
        //     <p>MP: ${character.stats.baseStats.MP}/${character.stats.baseStats.maxMP || character.stats.baseStats.MP}</p>
        //     <p>ST: ${character.stats.baseStats.ST}/${character.stats.baseStats.maxST || character.stats.baseStats.ST}</p>
        // `;
        const hpPercentage = Math.round((character.stats.baseStats.HP / (character.stats.baseStats.maxHP || character.stats.baseStats.HP)) * 100);
        const mpPercentage = Math.round((character.stats.baseStats.MP / (character.stats.baseStats.maxMP || character.stats.baseStats.MP)) * 100);
        const stPercentage = Math.round((character.stats.baseStats.ST / (character.stats.baseStats.maxST || character.stats.baseStats.ST)) * 100);
        
        card.innerHTML = `
        <div class="icon-name-container">
            <div class="icon-container">
                <img src="${raceImage}" alt="${character.name}の種族" class="race-icon">
                <img src="${classImage}" alt="${character.name}のクラス" class="class-icon">
            </div>
            <p class="character-name">${character.name}</p>
        </div>
        <div class="status-bar">
            <div class="status-label">HP:</div>
            <div class="status-bar-container">
                <div class="status-bar-fill hp-bar-fill" style="width: ${hpPercentage}%;"></div>
                <span class="status-value">
                    ${character.stats.baseStats.HP}/${character.stats.baseStats.maxHP || character.stats.baseStats.HP}
                </span>
            </div>
        </div>
        <div class="status-bar">
            <div class="status-label">MP:</div>
            <div class="status-bar-container">
                <div class="status-bar-fill mp-bar-fill" style="width: ${mpPercentage}%;"></div>
                <span class="status-value">
                    ${character.stats.baseStats.MP}/${character.stats.baseStats.maxMP || character.stats.baseStats.MP}
                </span>
            </div>
        </div>
        <div class="status-bar">
            <div class="status-label">ST:</div>
            <div class="status-bar-container">
                <div class="status-bar-fill st-bar-fill" style="width: ${stPercentage}%;"></div>
                <span class="status-value">
                    ${character.stats.baseStats.ST}/${character.stats.baseStats.maxST || character.stats.baseStats.ST}
                </span>
            </div>
        </div>
    `;


              card.addEventListener('click', () => showCharacterModal('character-modal', character._id));
        characterStatus.appendChild(card);
    });
}

//ステータスの作成　Rollに入ったデータから能力値を作る
function calculateStatsAndAbilities(playerData) {
    const totalStats = {};
    const abilities = [];

    // 初期化: ステータス、耐性、肉体値を初期化
    statKeys.forEach(key => {
        totalStats[key] = 0; // 初期値は合計用に0
    });

    resistanceKeys.forEach(key => {
        totalStats[key] = 0; // 耐性の合計用
    });

    bodyKeys.forEach(key => {
        totalStats[key] = 0; // 肉体値の最大値用
    });

    //合計値を作る baseStats から statKeys の値を取得 の値をまとめる
    if (playerData.baseStats) {
        statKeys.forEach(key => {
            totalStats[key] += playerData.baseStats[key] || 0;
        });
    }

    // Role の stats を合計し、abilities を収集
    playerData.Role.forEach(role => {
        if (role.stats) {
            // ステータスの合計
            statKeys.forEach(key => {
                totalStats[key] += role.stats[key] || 0;
            });

            // 耐性の合計
            resistanceKeys.forEach(key => {
                totalStats[key] += role.stats[key] || 0;
            });

            // 肉体値の最大値
            bodyKeys.forEach(key => {
                totalStats[key] = Math.max(totalStats[key], role.stats[key] || 0);
            });
        }

        // abilities が {} や [] の場合を除外
        if (
            role.abilities && // 存在するか確認
            !(Array.isArray(role.abilities) && role.abilities.length === 0) && // 空配列を除外
            !(typeof role.abilities === 'object' && !Array.isArray(role.abilities) && Object.keys(role.abilities).length === 0) // 空オブジェクトを除外
        ) {
            if (Array.isArray(role.abilities)) {
                abilities.push(...role.abilities);
            } else {
                abilities.push(role.abilities);
            }
        }
    });

    // stats.baseStats に totalStats を加算
    const fasutStat = roleData.find(cls => cls['名前'] === playerData.race);
    statKeys.forEach(key => {
        playerData.stats.baseStats[key] = parseInt(parseInt(fasutStat[key] || 0) * 0.5) + totalStats[key];
    });
    setSumKeys.forEach(key => {
        playerData.stats.baseStats[key] = parseInt(parseInt(fasutStat[key] || 0) * 0.5) + totalStats[key];
    });

    console.log("ステータスの作成 :", totalStats)

    return { totalStats, abilities };
}

// アビリティデータを取得
function getAvailableAbilities(SkillNames) {
    const availableAbilities = [];

    console.log(" getAvailableAbilities :",SkillNames, SkillData)
    // SkillData を走査してアビリティを取得
    SkillNames.forEach(name => {
        const matchingSkill = Object.values(SkillData).find(Skill => Skill['名前'] === name);
        // console.log(" matchingSkill :",name , matchingSkill)

        if (matchingSkill) {
            availableAbilities.push({
                name: name,
                ...matchingSkill
            });
        } else {
            console.warn(`アビリティデータが見つかりません: ${name}`);
        }
    });

    return availableAbilities;
}

// 条件が空または0であるかを判定
function isAllConditionsEmptyOrZero(cls) {
    const conditions = ['条件系統', '条件系統Lv', '条件クラス_1', '条件クラス_2', '条件スキル', '条件属性'];
    return conditions.every(key => !cls[key] || cls[key] === 0);
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

//===============  モーダル設定  ===================================================================

// キャラカードをクリックするとその中のデータを表示する を検索して表示
// showCharacterModal('character-modal', character._id)
// showCharacterModal('character-modal', playerData._id)
async function showCharacterModal(modalId, characterId) {
    // 対象キャラクターを取得
    const character = allCharacters.find(char => char._id === characterId);
    if (!character) {
      console.error("キャラクターが見つかりません:", characterId);
      return;
    }
    console.log("allCharacters から _id を検索して表示", "" )
    const modal = document.getElementById(modalId);
    modal.classList.remove('hidden'); // モーダルを表示
  
    const mainTabs = document.querySelectorAll(`#${modalId}-tabs button`);
    const subTabs = document.getElementById(`${modalId}-sub-tabs`);
    const modalBody = document.getElementById(`${modalId}-body`);

    // アビリティの表示
    await displayAbilitiesInTable(character)
    await displayStatsAll(character)
    // await renderEquipment(character.equipmentSlot);  

    console.log("subTabs modalId :", subTabs ,modalId)

    // 初期状態: ステータスとそのサブタブを表示
    mainTabs.forEach(tab => tab.classList.remove('active'));
    mainTabs[0].classList.add('active'); // ステータスをアクティブに
    // subTabs.classList.remove('hidden'); // サブタブを表示
    // updateSubTabBody(modalId, character, 'stats'); // ステータスを初期表示

    // インベントリの表示
    await renderInventory(character);
    // 装備の表示
    await renderEquipment(character, '人形');

    
}

// ステータス表示
function displayStatsAll(character) {
    addTableRows(character, "#statsTable tbody", statsDisplayKeys);
    addTableRows(character, "#TechniquesTable tbody", TechniqueKeys);
    addTableRows(character, "#resistanceTable tbody", resistanceKeys, 1);
    addTableRows(character, "#bodyTable tbody", bodyKeys);
}

// テーブル表示
function addTableRows(character, tableBodySelector, keys, minTotal = 25) {
    const tableBody = document.querySelector(tableBodySelector);
    tableBody.innerHTML = "";

    keys.forEach(stat => {
        const value = character?.stats?.baseStats?.[stat] ?? 0;
        const valuePlus = character?.temporaryBonuses?.[stat] ?? 0;
        const total = value + valuePlus;

        if (total < minTotal) return;

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${stat}</td>
            <td>${value}</td>
            <td>${valuePlus === 0 ? '-' : valuePlus}</td>
            <td>${total}</td>
        `;

        tableBody.appendChild(row);
    });
}

// アビリティ表示
function displayAbilitiesInTable(character) {
    const abilitiesTableBody = document.querySelector('#abilities-table tbody');

    console.log(" character.abilities : ", character.abilities)
    // テーブルの構造（tbodyに挿入する行）
    const tableRows = character.abilities.map(Skill => `
      <tr>
        <td><ruby>${Skill.name}<rt>${Skill.ルビ || ""}</rt></ruby></td>
        <td>${Skill.系統 || "-"}</td>
        <td>${Skill.分類 || "-"}</td>
        <td>${Skill.説明 || "詳細なし"}</td>
      </tr>
    `).join('');
  
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


  

// メインモーダルを表示
function openEquipmentModal() {
  const tableBody = document.querySelector('#equipment-table tbody');
  tableBody.innerHTML = Object.entries(playerData.equipmentSlot)
    .map(([slot, item]) => `
      <tr>
        <td>${slot}</td>
        <td>${item || '未装備'}</td>
        <td><button onclick="openChangeEquipmentModal('${slot}')">変更</button></td>
      </tr>
    `).join('');
  document.getElementById('equipment-modal').classList.remove('hidden');
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
    const currentItem = playerData.equipmentSlot[slot] || '未装備';

    // 人形の装備可能部位を取得
    const setKey = characterTypes.人形;

    // 条件に一致するアイテムを取得
    const equipableItems = getMatchingItems(slot, playerData, setKey);

    console.log(" 装備変更モーダルを表示 setKey :", slot, setKey)
    console.log(" 装備変更モーダルを表示 :",currentItem, playerData.inventory, equipableItems)

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
  
  
// 装備項目を表示 playerData.equipmentSlot
// 装備項目を表示
function renderEquipment(character) {
    const equipmentTable = document.querySelector('#equipment-table tbody');

    // 表示する部位のリスト
    const displaySlots = ['武器', '武器2', '頭', '体', '足','装飾','装飾'];

    // スロットと装備品をテーブルに挿入
    equipmentTable.innerHTML = displaySlots.map(slot => {
        // スロットに対応する装備名を取得（未装備の場合はnull）
        const itemName = playerData.equipmentSlot[slot] || '未装備';

        // 装備中のアイテム情報を取得
        const itemDetails = playerData.inventory.find(item => item.名前 === itemName) || {};

        return `
          <tr>
            <td>${getDisplayName(slot)}</td>
            <td>
              <a href="#" onclick="openChangeEquipmentModal('${slot}')">
                <ruby>${itemName}<rt>${itemDetails.ルビ || ''}</rt></ruby>
              </a>
            </td>
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
    playerData.equipmentSlot[slot] = itemName;
  
    // 装備スロットを再描画
    renderEquipment(playerData);
  
    // インベントリを再描画
    renderInventory(playerData);
  
    // モーダルを閉じる
    closeModal2('change-equipment-modal');
  }

// 装備を外す
function removeEquipment(slot) {
    // スロットを未装備状態に
    playerData.equipmentSlot[slot] = null;

    // 装備スロットを再描画
    renderEquipment(playerData);

    // インベントリを再描画
    renderInventory(playerData);

    // モーダルを閉じる
    closeModal2('change-equipment-modal');
}
  
  
  

// インベントリ内で該当スロットに装備可能なアイテムを取得
function getEquipableItems(slot) {
    return playerData.inventory.filter(item => item.equipableSlots.includes(slot));
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
function renderInventory() {
    const inventoryTableBody = document.querySelector('#inventory-table tbody');
    const inventoryCount = document.getElementById('inventory-count');
    

    // ヘルパー関数: 装備中アイテムを判定
    function isEquipped(itemName) {
      if (!playerData || !playerData.equipmentSlot) {
        return false; // 装備スロットが存在しない場合は未装備とみなす
      }
      return Object.values(playerData.equipmentSlot).includes(itemName);
    }
  
    // データ整合性チェック
    const inventory = playerData.inventory || [];
    const equippedItems = inventory.filter(item => isEquipped(item.名前));
    const unequippedItems = inventory.filter(item => !isEquipped(item.名前));
  
    // インベントリ内容の確認
    console.log("装備中のアイテム:", equippedItems);
    console.log("未装備のアイテム:", unequippedItems);
  
    // インベントリをテーブルに表示
    inventoryTableBody.innerHTML = [
      ...equippedItems.map(createInventoryRow), // 装備中のアイテム
      ...unequippedItems.map(createInventoryRow) // 未装備のアイテム
    ].join('');
  
    // 所持アイテム数の更新
    const maxInventory = playerData.maxInventory || 20; // デフォルト最大値を 20 とする
    inventoryCount.textContent = `${inventory.length} / ${maxInventory}`;
}


// インベントリ行を生成するヘルパー関数
function createInventoryRow(item, index) {
    const isEquipped = Object.values(playerData.equipmentSlot || {}).includes(item.名前);
    const equippedMark = isEquipped ? '<span class="equipped-mark">E</span>' : '';


    return `
        <tr>
        <td>${item.種別 || '-'}</td>
        <td>
            <a href="#" onclick="openItemDetailModalFromInventory(${index}); return false;">
                <ruby>${item.名前}<rt>${item.ルビ || ''}</rt></ruby>
            </a> ${equippedMark}
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

    const sellButton = document.querySelector('#inventory-item-detail-modal .button-group button.sell-item-button');
    const storageButton = document.querySelector('#inventory-item-detail-modal .button-group button.storage-item-button');
    const useButton = document.querySelector('#inventory-item-detail-modal .button-group button.use-item-button');

      // 売却ボタンの表示切り替え isInUse
    if (isInShop) {
        sellButton.style.display = 'inline-block'; // ショップからの場合、表示
    } else {
        sellButton.style.display = 'none'; // その他の場合、非表示
    }
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
    renderInventory(); // インベントリを更新
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
}

function closeModal2(modalId) {
    console.log(" モーダルを閉じる : ", modalId)
    const modal = document.getElementById(modalId);
    modal.classList.add('hidden');
    if (modal) {
      modal.style.display = 'none'; // 手動で非表示にする
    }
}


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
              connections: location['移動先'] ? location['移動先'].split('、') : []
            };
            return acc;
          }, {});
      
          console.log('取得した場所データ:', locations);

    } catch (error) {
        console.error('Error loading shop by name:', error);
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

// == セーブ ===========================================================
// セーブ機能
async function saveGame() {
    if (!playerData || !playerData._id) {
        throw new Error('セーブ失敗: キャラクターIDが存在しません');
    }

    const url = `/api/characters/${playerData._id}`; // キャラクターIDをURLに設定
    const authToken = getAuthToken(); // トークンを取得（実装済みの場合）
    // fetch('/api/characters',

    try {
        // Fetch APIでPUTリクエストを送信
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}` // トークンを送信
            },
            body: JSON.stringify(playerData) // playerDataをJSON文字列に変換
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
