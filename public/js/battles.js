let turnOrder = [];
// グローバル変数
let readyCharacters = []; // 行動順
let currentIndex = 0; // 現在の行動キャラクターのインデックス
let actionList = []
let currentCharacter = []

// 許可される"特殊"の値を配列で定義
const allowedKeys = ["攻撃", "防御", "回復", "回避"]; // 追加したいキーを配列に追加

const attack_attributes = ["威力", "切断", "貫通", "打撃", "炎", "氷", "雷", "酸", "音", "光", "闇", "正", "負"]
const status_attributes = ["精神攻撃", "毒", "盲目", "幻覚", "石化", "怯み", "拘束", "呪い", "即死", "時間", "出血", "疲労", "体幹"]
const modifier_Sums = [
  "防御無視", "切断倍", "貫通倍", "打撃倍", "炎倍", "氷倍", "雷倍", "酸倍", "音倍", "光倍", "闇倍",
  "善倍", "悪倍", "正倍", "負倍", "精神攻撃倍", "毒倍", "盲目倍", "幻覚倍", "石化倍", "怯み倍",
  "拘束倍", "呪い倍", "即死倍", "時間倍", "出血倍", "疲労倍", "体幹倍", "物理ガード倍", "魔法ガード倍",
  "Lv倍率", "HP倍率", "MP倍率", "ST倍率", "攻撃倍率", "防御倍率", "魔力倍率", "精神倍率", "速度倍率", 
  "命中倍率", "SIZ倍率", "APP倍率", "Lv", "HP", "MP", "ST", "攻撃", "防御", "魔力", "精神", "速度", 
  "命中", "SIZ", "APP", "隠密", "感知", "威圧", "軽業", "技術", "早業", "看破", "騙す", "知識", 
  "鑑定", "装置", "変装", "制作", "精神接続", "魔法技術", "指揮", "素手", "角", "牙", "爪", "翼", 
  "尾", "外皮", "外殻", "再生", "物理軽減", "魔法軽減", "遠隔軽減", "切断耐性", "貫通耐性", "打撃耐性", 
  "炎耐性", "氷耐性", "雷耐性", "酸耐性", "音耐性", "闇耐性", "光耐性", "善耐性", "悪耐性", "正耐性", 
  "負耐性", "精神耐性", "毒耐性", "盲目耐性", "幻覚耐性", "石化耐性", "怯み耐性", "拘束耐性", 
  "呪い耐性", "即死耐性", "時間耐性", "出血耐性", "疲労耐性", "体幹耐性", "物理耐性", "魔法耐性", 
  "Cr率耐性", "Cr威力耐性", "移動速度", "移動倍率", "射程", "攻撃追加", "待機"
]
const rangeEffect = ["範囲", "効果概要", "攻撃回数", "攻撃追加", "追加威力", "判定", "効果時間"]
const addStatsKey = [
  "Lv", "HP", "MP", "ST", "攻撃", "防御", "魔力", "精神", "速度", "命中", "SIZ", "APP", "隠密", "感知", "威圧", "軽業", "技術", "早業", "看破", "騙す",
  "知識", "鑑定", "装置", "変装", "制作", "精神接続", "魔法技術", "指揮", "素手", "角", "牙", "爪", "翼", "尾", "外皮", "外殻", "再生", "物理軽減", "魔法軽減", "遠隔軽減",
  "切断耐性", "貫通耐性", "打撃耐性", "炎耐性", "氷耐性", "雷耐性", "酸耐性", "音耐性", "闇耐性", "光耐性", "善耐性", "悪耐性", "正耐性", "負耐性", "精神耐性", "毒耐性", "盲目耐性","幻覚耐性", "石化耐性", "怯み耐性", "拘束耐性", "呪い耐性", "即死耐性", "時間耐性", "出血耐性", "疲労耐性", "体幹耐性", "物理耐性", "魔法耐性", "Cr率耐性", "Cr威力耐性", "移動速度", "移動倍率"
]
const multipliersKey = [
  "切断倍", "貫通倍", "打撃倍", "炎倍", "氷倍", "雷倍", "酸倍", "音倍", "光倍", "闇倍",
  "善倍", "悪倍", "正倍", "負倍", "精神攻撃倍", "毒倍", "盲目倍", "幻覚倍", "石化倍", "怯み倍",
  "拘束倍", "呪い倍", "即死倍", "時間倍", "出血倍", "疲労倍", "体幹倍", "物理ガード倍", "魔法ガード倍", "Cr率", "Cr威力","全力", "ダメージ幅"
]



function displayBattleField(playerParty, enemyData) {

  playerParty[0].stats.consumptionStats.MP消費 =  10
  playerParty[0].stats.consumptionStats.ST消費 = 10
  console.log(" displayBattleField :", playerParty[0].name , playerParty[0].stats.consumptionStats)

  turnOrder = [];
  // グローバル変数
  readyCharacters = []; // 行動順
  currentIndex = 0; // 現在の行動キャラクターのインデックス
  actionList = []
  currentCharacter = []
  // DOM要素を取得
  const enemyRear = document.querySelector("#enemy-rear .card-container");
  const enemyFront = document.querySelector("#enemy-front .card-container");
  const allyFront = document.querySelector("#ally-front .card-container");
  const allyRear = document.querySelector("#ally-rear .card-container");

  // 初期化
  enemyRear.innerHTML = ""; // 敵の後衛をクリア
  enemyFront.innerHTML = ""; // 敵の前衛をクリア
  allyFront.innerHTML = ""; // 味方の前衛をクリア
  allyRear.innerHTML = ""; // 味方の後衛をクリア

  enemyParty = enemyData
  // 敵の表示
  console.log("敵パーティ:", enemyParty);

  if (!Array.isArray(enemyParty)) {
    console.error("enemyParty は配列ではありません:", enemyParty);
    return;
  }
  // 使用例
  // addBattleLog('敵が攻撃してきた！');
  // addBattleLog('味方の反撃が成功した！');
  setupEnemyParty(enemyParty);
  // 味方の表示
  console.log("味方パーティ:", playerParty);

  if (!Array.isArray(playerParty)) {
    console.error("playerParty は配列ではありません:", playerParty);
    return;
  }

  setupPlayerParty(playerParty);

  console.log(turnOrder)
  initializeAP(playerParty);
  initializeAP(enemyParty);
  // ゲームループを開始
  readyCharacters = calculateReadyCharacters(playerParty, enemyParty);
  currentIndex = 0;
  console.log(" currentIndex ". currentIndex)
  console.log(" readyCharacters ". readyCharacters)
  openBattleModal(); // 戦闘画面を開く
  nextAction();
  resetComboDisplay() 
}

// 主処理
function setupPlayerParty(playerParty) {
  // カードエリアをリセット
  resetBattleCharacterCards();

  // プレイヤーパーティーのメンバーを配置
  playerParty.forEach((member, index) => {
    if (!member || typeof member !== "object") {
      console.error(`無効な味方データ (index: ${index}):`, member);
      return;
    }

    console.log(`味方データ (index: ${index}):`, member);

    try {
      // 戦闘用カード生成
      const card = createBattleCharacterCard(member, true);

      // 配置位置を取得（1~3のスロット番号）
      const slot = member.position?.slot;

      if (slot < 1 || slot > 3 || typeof slot !== "number") {
        console.error("無効なスロット番号です:", slot);
        return;
      }

      // 前衛・後衛の判定
      if (member.position?.type === "後衛") {
        const rearSlots = document.querySelectorAll("#ally-rear .card-container");
        rearSlots[slot - 1]?.appendChild(card); // スロット番号に基づいて配置
      } else if (member.position?.type === "前衛") {
        const frontSlots = document.querySelectorAll("#ally-front .card-container");
        frontSlots[slot - 1]?.appendChild(card); // スロット番号に基づいて配置
      } else {
        console.error("位置情報が無効または不明です:", member.position);
      }
    } catch (err) {
      console.error(`カード生成エラー (index: ${index}):`, err);
    }
  });
}
// 味方カードエリアのリセット処理
function resetBattleCharacterCards() {
  const rearSlots = document.querySelectorAll("#ally-rear .card-container");
  const frontSlots = document.querySelectorAll("#ally-front .card-container");

  // 後衛スロットをリセット
  rearSlots.forEach((slot) => {
    while (slot.firstChild) {
      slot.removeChild(slot.firstChild); // 子要素をすべて削除
    }
  });

  // 前衛スロットをリセット
  frontSlots.forEach((slot) => {
    while (slot.firstChild) {
      slot.removeChild(slot.firstChild); // 子要素をすべて削除
    }
  });
}

// 主処理
function setupEnemyParty(enemyParty) {
  // 敵カードエリアをリセット
  resetEnemyBattleCards();

  // 敵パーティのメンバーを配置
  enemyParty.forEach((enemy, index) => {
    if (!enemy || typeof enemy !== "object") {
      console.error(`無効な敵データ (index: ${index}):`, enemy);
      return;
    }

    console.log(`敵データ (index: ${index}):`, enemy);

    try {
      // 敵の戦闘用カード生成
      const card = createBattleCharacterCard(enemy, false);

      // 配置位置を取得（1~3のスロット番号）
      const slot = enemy.position?.slot;

      if (slot < 1 || slot > 3 || typeof slot !== "number") {
        console.error("無効なスロット番号です:", slot);
        return;
      }

      // 前衛・後衛の判定
      if (enemy.position?.type === "前衛") {
        const frontSlots = document.querySelectorAll("#enemy-front .card-container");
        frontSlots[slot - 1]?.appendChild(card); // スロット番号に基づいて配置
      } else if (enemy.position?.type === "後衛") {
        const rearSlots = document.querySelectorAll("#enemy-rear .card-container");
        rearSlots[slot - 1]?.appendChild(card); // スロット番号に基づいて配置
      } else {
        console.warn(`未知のポジションタイプ (index: ${index}):`, enemy.position?.type);
      }
    } catch (err) {
      console.error(`カード生成エラー (index: ${index}):`, err);
    }
  });
}
// 敵カードエリアのリセット処理
function resetEnemyBattleCards() {
  const rearSlots = document.querySelectorAll("#enemy-rear .card-container");
  const frontSlots = document.querySelectorAll("#enemy-front .card-container");

  // 後衛スロットをリセット
  rearSlots.forEach((slot) => {
    while (slot.firstChild) {
      slot.removeChild(slot.firstChild); // 子要素をすべて削除
    }
  });

  // 前衛スロットをリセット
  frontSlots.forEach((slot) => {
    while (slot.firstChild) {
      slot.removeChild(slot.firstChild); // 子要素をすべて削除
    }
  });
}

// キャラクターカードを生成する関数
function createBattleCharacterCard(character, isPlayer) {
  // isPlayer = true
  if (!character || typeof character !== "object") {
    console.error("無効なキャラクターデータ:", character);
    return null;
  }

  const card = document.createElement("div");
  card.className = "character-card";

  const raceClass = roleData.find(
    (cls) => cls["名前"] === character.Role?.[0]?.roleName
  );
  const jobClass = roleData.find(
    (cls) => cls["名前"] === character.Role?.[1]?.roleName
  );

  const getImageURL = (imagePath, defaultImage) =>
    `/images/${imagePath || defaultImage}`;
  const raceImage = getImageURL(raceClass?.画像url, "race-icon.png");
  const classImage = jobClass
    ? getImageURL(jobClass?.画像url, "class-icon.png")
    : null;
  // 0.webp
  console.log(" キャラクターカードを生成する関数 :", raceImage, classImage);

  const statusKeys = isPlayer ? ["HP", "MP", "ST"] : ["HP"];
  const statusBarsHTML = statusKeys
  .map((key) => {
    // 現在の最大値を取得
    const maxValue = character.stats.totalStats[key] || 0;

    // 減少している値を取得
    const statConsumption = character.stats.consumptionStats[`${key}消費`] || 0;

    // 残りの値（最大値 - 消費値）
    const currentValue = Math.max(0, maxValue - statConsumption);

    // 残りの値の割合を計算
    const percentage = maxValue > 0 ? Math.round((currentValue / maxValue) * 100) : 0;

    // ステータスバーHTMLの生成
    return `
      <div class="status-bar">
        <span class="label">${key}:</span>
        <div class="bar-container">
          <div class="bar-fill ${key.toLowerCase()}-bar-fill" style="width: ${percentage}%;"></div>
          <span class="value">${currentValue}/${maxValue}</span>
        </div>
      </div>
    `;
  })
  .join("");



  card.innerHTML = `
    <div class="icon-container">
      <img src="${raceImage}" alt="${character.name}の種族" class="race-icon">
      ${
        classImage
          ? `<img src="${classImage}" alt="${character.name}のクラス" class="class-icon">`
          : ""
      }
    </div>
    <div class="content-container">
      <div class="character-name">Lv${character.stats.totalStats["Lv"]/10} ${character.name}</div>
      <div class="status-container">
        ${statusBarsHTML}
      </div>
    </div>
  `;
  // クリックイベントを追加
  // card.addEventListener("click", () => onCharacterCardClick(character));
  return card;
}


// キャラクターカードをハイライト
function highlightCurrentCharacter(characterName) {
  const characterCards = document.querySelectorAll(".character-card");

  characterCards.forEach(card => {
    if (card.querySelector(".character-name").textContent === characterName) {
      card.classList.add("highlight");
    } else {
      card.classList.remove("highlight");
    }
  });
}

// HPバーの割合を計算
function getHpPercentage(character) {
  if (
    !character.stats ||
    typeof character.stats.HP !== "number" ||
    typeof character.stats.HP消費 !== "number"
  ) {
    console.warn("無効なステータスデータ:", character.stats);
    return 0; // 無効なデータの場合は 0%
  }
  return Math.max(0, (character.stats.HP / character.stats.HP消費) * 100);
}

// ==================================================================================================



// APおよびステータスの初期化
function initializeAP(characters) {
  if (Array.isArray(characters)) {
    // 配列の場合
    characters.forEach(character => {
      if (character && typeof character === "object") {
        character.AP = Number.isFinite(character.AP) ? character.AP : 0; // APを数値で初期化
        initializeStatusIfNeeded(character); // ステータスを初期化
      } else {
        console.warn("initializeAP: 無効なキャラクターが見つかりました:", character);
      }
    });
  } else if (characters && typeof characters === "object") {
    // 単一のキャラクターの場合
    characters.AP = Number.isFinite(characters.AP) ? character.AP : 0; // APを数値で初期化
    initializeStatusIfNeeded(characters); // ステータスを初期化
  } else {
    console.error("initializeAP: 引数が無効です:", characters);
  }
}

// ステータスに減少データを追加（totalStatsを直接変更）
function initializeStatusIfNeeded(character) {
  if (!character.stats.totalStats) {
    console.warn("totalStatsが存在しないため、空オブジェクトを作成します:", character);
    character.stats.totalStats = {}; // totalStatsが未定義の場合は空オブジェクトを作成
  }

  // totalStatsに減少データを追加（存在しない場合のみ）
  character.stats.totalStats.HP = character.stats.totalStats.HP || 0;
  character.stats.totalStats.MP = character.stats.totalStats.MP || 0;
  character.stats.totalStats.ST = character.stats.totalStats.ST || 0;

  console.log("totalStatsを初期化しました:", character.stats.consumptionStats);
}

// AP回復
function recoverAP(characters) {
  const maxAP = Math.max(...characters.map(c => c.AP));
  const recoveryAmount = 100 - maxAP;
  characters.forEach(c => {
    c.AP = Math.min(c.AP + recoveryAmount, 100); // 最大100でキャップ
  });
}

// 行動順計算
function calculateReadyCharacters(playerParty, enemyParty) {
  const allCharacters = [...playerParty, ...enemyParty];

  return allCharacters
    .filter(c => Number.isFinite(c.AP) && c.AP >= 100) // APが数値かつ100以上のキャラクターを取得
    .sort((a, b) => {
      // totalStatsと速度の安全な取得
      const speedA = b.totalStats?.速度 || 0;
      const speedB = a.totalStats?.速度 || 0;

      if (b.AP === a.AP) {
        return speedA - speedB; // 速度順
      }
      return b.AP - a.AP; // AP順
    });
}



// 次へボタンの動作
async function nextAction() {
  if (currentIndex >= readyCharacters.length) {
    console.log("全キャラクターが行動を終了。次のターンを準備します。");
    // hideBattleLog()

    // AP回復と次ターン準備
    recoverAP(playerData.party);
    recoverAP(enemyParty);
    console.log("キャラクター確認 :", )
    console.log(playerData.party)
    console.log(enemyParty)
    readyCharacters = calculateReadyCharacters(playerData.party, enemyParty);
    currentIndex = 0;

    // 敵が全滅しているか確認
    if (enemyParty.every(c => c.hp <= 0)) {
      console.log("プレイヤーの勝利です！");
      openVictoryModal(); // 勝利画面を開く
      return;
    }

    console.log("次のターンを開始します！");
  }
  console.log(" currentIndex ", currentIndex)
  console.log(" readyCharacters ", readyCharacters)
  // 現在のキャラクターを取得
  currentCharacter = readyCharacters[currentIndex];
  console.log(`${currentCharacter.name}のターンです。`, currentCharacter);

  // 使用可能な行動リストを生成
  actionList = await generateActionList(currentCharacter);
  updateUIForCharacter(currentCharacter); //仮実装
  displayCommandList(currentCharacter);
  await displayCommandList("A")
  await highlightActiveCharacter()
}

// UI更新（仮実装）
function updateUIForCharacter(character) {
  const ui = document.getElementById("action-ui");
  ui.innerHTML = `
    <p>${character.name}のターンです</p>
    <button onclick="nextAction()">次へ</button>
  `;
  const Skill = generateActionList(character)
  console.log(Skill)
}


// 勝利画面を開く（仮）
function openVictoryModal() {
  const ui = document.getElementById("action-ui");
  ui.innerHTML = `<p>プレイヤーの勝利です！</p>`;
}


// ==== アビリティ作成 ==============================================================================================
// 使用可能な行動リストを生成
function generateActionList(character) {
  const actionList = {
    A: [], // 行動スキル
    S: [], // 強化スキル
    Q: [], // 即行スキル
    P: [], // 常時発動スキル
    その他: [], // 武器攻撃、特殊攻撃、アイテムなど
  };

  console.log("character.equipmentSlot", character.equipmentSlot);

  // 武器攻撃を追加
  if (character.equipmentSlot?.武器 && Array.isArray(character.inventory)) {
    // 装備されている武器名を取得
    const equippedWeaponName = character.equipmentSlot.武器;
  
    // inventory から一致する武器データを検索
    const matchedItem = character.inventory.find(
      (item) => item.名前 === equippedWeaponName && item.種別 === "武器"
    );
  
    if (matchedItem) {
      // 攻撃タイプ（ASQ）を取得
      const attackType = matchedItem.攻撃タイプ || "A"; // デフォルトは "A"
  
      // ASQ種別が存在しない場合、配列を初期化
      actionList[attackType] = actionList[attackType] || [];
  
      // アクションリストに追加
      actionList[attackType].push({
        name: matchedItem.名前,
        ルビ: matchedItem.ルビ,
        分類: attackType,
        攻撃手段: matchedItem.種別,
        武器種: matchedItem.分類,
        全力: matchedItem.全力 || 0,
        切断: matchedItem.切断 || 0,
        貫通: matchedItem.貫通 || 0,
        打撃: matchedItem.打撃 || 0,
        物理ガード: matchedItem.ガード || 0,
        最低ダメージ: matchedItem.最低ダメージ || 0,
        Cr率: `${matchedItem.Cr率 || 0}`,
        Cr威力: `${matchedItem.Cr威力 || 0}`,
        回避率: `${matchedItem.回避率 || 0}`,
        命中率: `${matchedItem.命中率 || 0}`,
        攻撃回数: matchedItem.攻撃回数 || 1,
        判定: "攻撃",
        description: `${matchedItem.名前} を使った攻撃`,
        特殊: "攻撃"
      });
    } else {
      console.warn(
        `装備されている武器 "${equippedWeaponName}" が inventory に見つかりませんでした。`
      );
    }
  }
  
  

  

  console.log("character.totalStats", character.stats.totalStats)
  // 特殊攻撃データ
  const specialAttackData = {
    素手: { 名前: "フィスト", 種別: "素手", 全力: 100, 切断: 0.0, 貫通: 0.0, 打撃: 0.9, ガード: 0.5, 最低ダメージ: 0.1, Cr率: 0.1, Cr威力: 1.25, 回避率: 0.0, 命中率: -0.05, 攻撃回数: 2, 攻撃タイプ: "A", 説明: "多段打撃攻撃。軽快な連続攻撃で安定したダメージを与える。" },
    角: { 名前: "ホーン", 種別: "角", 全力: 115, 切断: 0.0, 貫通: 0.8, 打撃: 0.2, ガード: 0.5, 最低ダメージ: 0.07, Cr率: 0.1, Cr威力: 1.5, 回避率: -0.03, 命中率: -0.03, 攻撃回数: 1, 攻撃タイプ: "S", 説明: "貫通特化攻撃。高威力の一撃で装甲の敵に有効。" },
    牙: { 名前: "ファング", 種別: "牙", 全力: 110, 切断: 0.35, 貫通: 0.55, 打撃: 0.1, ガード: 0.4, 最低ダメージ: 0.07, Cr率: 0.2, Cr威力: 1.4, 回避率: -0.03, 命中率: -0.03, 攻撃回数: 1, 攻撃タイプ: "S", 説明: "切断と貫通のバランス攻撃。連携攻撃に最適。" },
    爪: { 名前: "クロー", 種別: "爪", 全力: 100, 切断: 0.6, 貫通: 0.3, 打撃: 0.1, ガード: 0.65, 最低ダメージ: 0.1, Cr率: 0.15, Cr威力: 1.4, 回避率: 0.0, 命中率: -0.05, 攻撃回数: 2, 攻撃タイプ: "A", 説明: "高威力の多段攻撃。素早い連続攻撃で敵を削る。" },
    翼: { 名前: "ウィング", 種別: "翼", 全力: 90, 切断: 0.0, 貫通: 0.0, 打撃: 0.70, ガード: 0.5, 最低ダメージ: 0.05, Cr率: 0.05, Cr威力: 1.2, 回避率: 0.05, 命中率: 0.0, 攻撃回数: 1, 攻撃タイプ: "Q", 説明: "低威力の多段攻撃。ガードと回避に優れる。" },
    尾: { 名前: "テイル", 種別: "尾", 全力: 105, 切断: 0.0, 貫通: 0.0, 打撃: 0.85, ガード: 0.25, 最低ダメージ: 0.00, Cr率: 0.1, Cr威力: 1.3, 回避率: -0.05, 命中率: -0.05, 攻撃回数: 1, 攻撃タイプ: "Q", 説明: "高威力の打撃攻撃。重い一撃で敵を叩き潰す。" },
    頭: { 名前: "ヘッド", 種別: "素手", 全力: 105, 切断: 0.0, 貫通: 0.0, 打撃: 0.85, ガード: 0.2, 最低ダメージ: 0.00, Cr率: 0.1, Cr威力: 1.25, 回避率: -0.05, 命中率: -0.20, 攻撃回数: 1, 攻撃タイプ: "S", 説明: "高威力の打撃攻撃。命中率が低いが威力が高い。" },
    触手: { 名前: "ウィップ", 種別: "触手", 全力: 85, 切断: 0.0, 貫通: 0.0, 打撃: 0.85, ガード: 0.2, 最低ダメージ: 0.00, Cr率: 0.1, Cr威力: 1.25, 回避率: -0.05, 命中率: -0.20, 攻撃回数: 1, 攻撃タイプ: "A", 説明: "高威力の打撃攻撃。命中率が低いが威力が高い。" },
    足: { 名前: "キック", 種別: "足", 全力: 105, 切断: 0.0, 貫通: 0.0, 打撃: 1.1, ガード: 0.5, 最低ダメージ: 0.0, Cr率: 0.1, Cr威力: 1.25, 回避率: 0.0, 命中率: -0.20, 攻撃回数: 2, 攻撃タイプ: "A", 説明: "多段打撃攻撃。軽快な連続攻撃で安定したダメージを与える。" },
  };

  // 素手/特殊攻撃を設定
  Object.keys(specialAttackData).forEach((stat) => {
    if (character.stats.totalStats?.[stat]) {
      const baseValue = (character.stats.totalStats[stat] + 50)/10;

      console.log("baseValue :", baseValue)
      // 特殊攻撃データを取得
      const data = specialAttackData[stat];

      // 対応する攻撃タイプがまだない場合は初期化
      actionList[data.攻撃タイプ] = actionList[data.攻撃タイプ] || [];

      // 計算結果を actionList に追加
      actionList[data.攻撃タイプ].push({
        name: stat,
        ルビ: data.名前,
        分類: data.攻撃タイプ,
        攻撃手段: stat,
        武器種: data.種別,
        全力: data.全力,
        切断: (baseValue * data.切断).toFixed(2),
        貫通: (baseValue * data.貫通).toFixed(2),
        打撃: (baseValue * data.打撃).toFixed(2),
        物理ガード: (baseValue * data.ガード).toFixed(2),
        最低ダメージ: (baseValue * data.最低ダメージ).toFixed(2),
        Cr率: specialAttackData.Cr率,
        Cr威力: specialAttackData.Cr威力,
        回避率: `${(data.回避率 * 100).toFixed(1)}`,
        命中率: `${(data.命中率 * 100).toFixed(1)}`,
        攻撃回数: data.攻撃回数,
        判定: "攻撃",
        説明: `${data.種別} を使った${data.説明}`,
        特殊: "攻撃"
      });
    }
  });


  // アビリティを追加
  if (Array.isArray(character.stats?.abilities)) {
    character.stats.abilities.forEach((Skill) => {
      // console.log("アビリティを追加 :", Skill.分類 , Skill);
      const type = Skill.分類 || "A"; // デフォルトは A (行動スキル)

      // 攻撃回数が未定義かつ "特殊" が "攻撃" の場合、デフォルト値を設定 allowedKeys.includes(Technique["特殊"]) Skill.特殊 === "攻撃"
      if (allowedKeys.includes(Skill["特殊"]) && Skill.攻撃回数 == "") {
        Skill.攻撃回数 = 1;
        // console.log(`攻撃回数を1に設定しました: ${Skill.名前}`);
      }      

      if (actionList[type]) {
        actionList[type].push(Skill);
      } else {
        console.warn(`未知のアビリティ分類: ${type}`);
      }
    });
  }


  console.log("character.inventory", character.inventory)
  // アイテムを追加
  if (Array.isArray(character.inventory)) {
    character.inventory.forEach((item) => {
      actionList.その他.push({
        name: item.name,
        分類: "アイテム",
        APCost: item.APCost || 5,
        effect: item.effect || null,
        description: `${item.name} を使用`,
      });
    });
  }
  return actionList;
}






// ====  コマンドリスト ==============================================================================================
// 指定されたタイプのスキルリストを表示
function displayCommandList(type = "A") {
  const TechniqueItemsContainer = document.querySelector("#Technique-list .Technique-items");

  if (!TechniqueItemsContainer) {
    console.error("スキルリストが見つかりません");
    return;
  }

  // スキルリストをクリア
  TechniqueItemsContainer.innerHTML = "";

  // 指定されたタイプのスキルを取得
  const TechniqueGroup = actionList[type];
  console.log("TechniqueGroup:", TechniqueGroup);

  // 使用可能スキルを取得
  const 使用可能スキル = addMatchingTechniquesToCombo( TechniqueGroup );
  console.log("使用可能スキル:", 使用可能スキル);

  if (TechniqueGroup && TechniqueGroup.length > 0) {
    TechniqueGroup.forEach((Technique) => {
      const TechniqueItem = document.createElement("div");
      TechniqueItem.className = "Technique-item";

      // 押せないスキルの判定
      const isDisabled = !使用可能スキル.some((matchingTechnique) => matchingTechnique.name === Technique.name);
      if (isDisabled) {
        TechniqueItem.classList.add("disabled"); // CSS で無効化スタイルを設定
      }

      // 攻撃手段のアイコンを取得（なければ"なし"を取得）
      const matchingIcon = iconData.find((item) => item.name === Technique["攻撃手段"]) 
                           || iconData.find((item) => item.name === "なし");
      const matchingIcon2 = iconData.find((item) => item.name === Technique["系統"]) 
                            || iconData.find((item) => item.name === "なし");

      // アイコン表示の条件を切り替え allowedKeys.includes(Technique["特殊"])
      const iconToDisplay = (type === "A" || allowedKeys.includes(Technique["特殊"]))
        ? matchingIcon
        : matchingIcon2;

      // スキル名にルビを追加
      let TechniqueContent = "";
      if (Technique.ルビ) {
        TechniqueContent = `
          <ruby>
            ${Technique.name}
            <rt>${Technique.ルビ}</rt>
          </ruby>
        `;
      } else {
        TechniqueContent = Technique.name; // ルビがない場合は名前のみ
      }

      // アイコンとスキル名をまとめて表示
      TechniqueItem.innerHTML = `
        <div class="Technique-content">
          <span class="Technique-icons">
            ${iconToDisplay ? `<span class="icon">${iconToDisplay.icon}</span>` : `<span class="icon">❓</span>`}
          </span>
          <span class="Technique-name">
            ${TechniqueContent}
          </span>
        </div>
      `;

      // 押せないスキルの場合はクリックイベントを無効化
      if (!isDisabled && Technique.分類 !== "P") {
        TechniqueItem.addEventListener("click", () => {
          displayTechniqueDetails(Technique, true);
        });
      } else {
        TechniqueItem.addEventListener("click", () => {
          displayTechniqueDetails(Technique, false);
        });
      }      

      TechniqueItemsContainer.appendChild(TechniqueItem);
    });
  } else {
    // スキルがない場合のメッセージ
    const emptyMessage = document.createElement("div");
    emptyMessage.className = "no-Technique";
    emptyMessage.textContent = "スキルがありません";
    TechniqueItemsContainer.appendChild(emptyMessage);
  }
}


// スキル詳細を表示
function displayTechniqueDetails(Technique, isUsable = true) {
  // 各詳細項目を取得
  const TechniqueName = document.getElementById("Technique-name");
  const TechniquePower = document.getElementById("Technique-power");
  const TechniqueConsumption = document.getElementById("Technique-consumption");
  const TechniqueAttackCount = document.getElementById("Technique-attack-count");
  const TechniqueRange = document.getElementById("Technique-range");
  const TechniqueStatusRate = document.getElementById("Technique-status-rate");
  const TechniqueData = document.getElementById("Technique-data");
  const addTechniqueButton = document.getElementById("add-Technique-to-combo");
  const TechniqueAttributes = document.getElementById("Technique-attributes");
  const TechniqueCondition = document.getElementById("Technique-condition");

  if (!TechniqueName || !TechniquePower || !TechniqueStatusRate || !TechniqueRange) {
    console.error("スキル詳細エリアが見つかりません");
    return;
  }

  // 必要な計算関数
  function calculateTotal(attributes, Skill) {
    return attributes.reduce((sum, attribute) => {
      const value = Skill[attribute];
      const numericValue =
        typeof value === "number"
          ? value
          : typeof value === "string" && !isNaN(parseFloat(value.replace("+", "")))
          ? parseFloat(value.replace("+", ""))
          : 0;
      return sum + numericValue;
    }, 0);
  }

  const 判定Value = currentCharacter.stats.totalStats[Technique["判定"]] || 0;
  const 追加威力Value = currentCharacter.stats.totalStats[Technique["追加威力"]] || 0;
  const judgingAttributes = (1 + 判定Value / 100) * (1 + 追加威力Value / 500);

  const totalAttackAttributes = calculateTotal(attack_attributes, Technique);
  const totalStatusAttributes = calculateTotal(status_attributes, Technique);
  const totalDefenseAttributes = calculateTotal(["物理ガード", "魔法ガード", "物理軽減", "魔法軽減"], Technique);

  const attackText =
    totalAttackAttributes && !isNaN(totalAttackAttributes)
      ? `威力: ${Math.floor(totalAttackAttributes * judgingAttributes)}`
      : "";
  const defenseText =
    totalDefenseAttributes && !isNaN(totalDefenseAttributes)
      ? `守り: ${Math.floor(
          totalDefenseAttributes *
            (Technique["判定"] !== "魔力"
              ? 1 + (currentCharacter.stats.totalStats["防御"] || 0) / 100
              : judgingAttributes)
        )}`
      : "";
  const statusText =
    totalStatusAttributes && !isNaN(totalStatusAttributes)
      ? `状態率: ${Math.floor(totalStatusAttributes * judgingAttributes)}`
      : "";

  const conditionAndAttribute = [];
  const matchingConditionIcon = iconData.find((item) => item.name === Technique["条件"]);
  const matchingConditionSystemIcon = iconData.find((item) => item.name === Technique["条件系統"]);

  if (matchingConditionIcon) {
    conditionAndAttribute.push(
      `条件: <ruby>${matchingConditionIcon.icon}<rt>${Technique["条件"]}</rt></ruby>`
    );
  }

  if (matchingConditionSystemIcon) {
    conditionAndAttribute.push(
      `系統: <ruby>${matchingConditionSystemIcon.icon}<rt>${Technique["条件系統"]}</rt></ruby>`
    );
  }

  TechniqueCondition.innerHTML = conditionAndAttribute.length > 0 ? conditionAndAttribute.join(" ") : "";

  const systemAndMeans = [];
  const matchingIcon = iconData.find((item) => item.name === Technique["攻撃手段"]);
  const matchingIcon2 = iconData.find((item) => item.name === Technique["系統"]);

  if (matchingIcon) {
    systemAndMeans.push(
      `攻撃手段: <ruby>${matchingIcon.icon}<rt>${Technique["攻撃手段"]}</rt></ruby>`
    );
  }

  if (matchingIcon2) {
    systemAndMeans.push(
      `系統: <ruby>${matchingIcon2.icon}<rt>${Technique["系統"]}</rt></ruby>`
    );
  }

  TechniqueAttributes.innerHTML = systemAndMeans.length > 0 ? systemAndMeans.join(" ") : "";

  const attackCountText =
  Technique["攻撃回数"] && Technique["攻撃回数"] > 0
    ? `攻撃回数: ${Math.floor(Technique["攻撃回数"])}`
    : allowedKeys.includes(Technique["特殊"])
    ? `攻撃回数: 1`
    : "";

const additionalAttackText =
  Technique["攻撃追加"] && Technique["攻撃追加"] > 0
    ? `攻撃追加: ${Math.floor(Technique["攻撃追加"])}`
    : "";


  TechniqueName.textContent = Technique.name || "";

  TechniquePower.textContent = [attackText, defenseText].filter(Boolean).join("  ");
  TechniqueStatusRate.textContent = statusText || "";
  TechniqueRange.textContent = `射程: ${Technique["射程"] || "-"}` + 
  (Technique["範囲"] ? ` 範囲: ${Technique["範囲"]}` : "");
  TechniqueData.textContent = `説明: ${Technique["説明"] || Technique["効果概要"] || ""}`;
  TechniqueConsumption.innerHTML =
    "消費: " +
    [
      Technique["HP消費"] && Technique["HP消費"] > 0
        ? `<span style="color: #4caf50;">HP: ${Technique["HP消費"]}</span>`
        : "",
      Technique["MP消費"] && Technique["MP消費"] > 0
        ? `<span style="color: #2196f3;">MP: ${Technique["MP消費"]}</span>`
        : "",
      Technique["ST消費"] && Technique["ST消費"] > 0
        ? `<span style="color: #ffc107dc;">ST: ${Technique["ST消費"]}</span>`
        : "",
      Technique["消費増加"] && Technique["消費増加"] > 0
        ? `<span>増加: ${Technique["消費増加"]}</span>`
        : "",
    ]
      .filter(Boolean)
      .join(" / ");
  TechniqueAttackCount.textContent = [attackCountText, additionalAttackText].filter(Boolean).join("  ");

  // ボタンの状態を切り替え
  if (addTechniqueButton) {
    if (isUsable) {
      addTechniqueButton.disabled = false;
      addTechniqueButton.classList.remove("disabled");
      addTechniqueButton.onclick = () => addToCombo(Technique);
      addTechniqueButton.textContent = "組み合わせる"
    } else {
      addTechniqueButton.disabled = true;
      addTechniqueButton.classList.add("disabled");
      addTechniqueButton.onclick = null; // クリック不可
      addTechniqueButton.textContent = "使用不可"
    }
  }
}



// タブを切り替える関数
function switchBattleTab(type) {
  // すべてのタブからアクティブ状態を解除
  const tabs = document.querySelectorAll("#Technique-tabs .tab");
  tabs.forEach((tab) => {
    tab.classList.remove("active");

    // 渡されたタイプと一致するタブをアクティブに設定
    if (tab.dataset.tab === type) {
      tab.classList.add("active");
    }
  });

  // 対応するスキルリストを表示
  displayCommandList(type);
}



// 行動を実行
function executeAction(action, character) {
  console.log(`${character.name} が ${action.name} を使用しました！`);

  // APを消費
  character.AP -= action.APCost;

  // 行動の効果を適用（仮実装）
  if (action.分類 === "A" || action.分類 === "特殊攻撃") {
    console.log(`${action.name} を使った攻撃でダメージ: ${action.damage}`);
  } else if (action.分類 === "S") {
    console.log(`${action.name} を使った強化:`, action.effect);
  } else if (action.分類 === "Q") {
    console.log(`${action.name} を使った即行スキル:`, action.effect);
  } else if (action.分類 === "アイテム") {
    console.log(`${action.name} を使用:`, action.effect);
  }
}

// グローバル変数
let activeSkillTab = "A"; // 現在表示中のタブ (currentTabから名前変更)
let selectedCombo = []; // 選択中のアビリティ
let totalConsumption = {HP: 0, MP: 0, ST: 0, 消費増加: 0,};




// アビリティリストを表示
function displayAbilities2(tab) {
  // 現在行動中のキャラクターを取得
  currentCharacter = readyCharacters[currentIndex];
  if (!currentCharacter || !currentCharacter.stats) {
    console.error("現在のキャラクターまたはそのステータスが無効です");
    return;
  }

  // アビリティリストの親要素を取得
  const list = document.getElementById("Skill-list");
  if (!list) {
    console.error("Skill-list が見つかりません");
    return;
  }


  // アビリティリストをクリア
  list.innerHTML = "";

  // 現在のキャラクターのアビリティを取得
  const abilities = currentCharacter.stats.abilities || [];
  abilities.filter((Skill) => Skill.分類 === tab) // タブに対応するアビリティを取得
    .forEach((Skill) => {
      const button = document.createElement("button");
      button.textContent = `${Skill.name} (AP: ${Skill.APCost})`;
      button.className = "Skill-button";

      // アビリティ選択時の処理
      button.addEventListener("click", () => {
        console.log(`${Skill.name} が選択されました`);
        console.log(Skill)
        addToCombo(Skill); // 選択中のアビリティに追加
      });

      list.appendChild(button);
  });
}

// コンボデータを初期化
const combo = {
  A: null, // 行動スキル
  S: null, // 強化スキル
  Q: null, // 即行スキル
};
// スキルをコンボに追加する関数
function addToCombo(Technique) {
  if (!Technique || !Technique["分類"]) {
    console.error("スキルが無効ですまたは分類がありません:", Technique);
    return;
  }

  const TechniqueType = Technique["分類"]; // A, S, Q のいずれか
  if (!["A", "S", "Q"].includes(TechniqueType)) {
    console.error(`無効なスキルタイプ: ${TechniqueType}`);
    return;
  }
  // 既存のスキルを上書き
  combo[TechniqueType] = Technique;

  // 条件を満たしているか判定
  checkComboTechnique(combo);

  // // コンボ表示を更新
  // updateComboDisplay();
}


// コンボを更新して ASQ のみ表示する関数
async function updateComboDisplay() {
  await resetComboDisplay()
  const comboDisplay = document.getElementById("combo"); // 表示エリアを取得
  if (!comboDisplay) {
    console.error("combo が見つかりません");
    return;
  }

  // コンボの状態をクリア
  comboDisplay.innerHTML = ""; // 古い内容を削除

  // ASQ のみを表示
  ["A", "S", "Q"].forEach(type => {
    const Technique = combo[type];

    // スキル要素を作成
    const TechniqueElement = document.createElement("div");
    TechniqueElement.className = "combo-Technique-item"; // スタイル用クラス

    // スキル内容を設定
    TechniqueElement.innerHTML = `
      <span class="combo-Technique-type">${type}</span>: 
      <span class="combo-Technique-name">${Technique ? Technique.name : "-"}</span>
    `;

    comboDisplay.appendChild(TechniqueElement); // コンボエリアに追加
  });

  // 消費量を計算してキャラクターに適用
  calculateConsumption();
}


// 初期状態に戻す関数
function resetComboDisplay() {
  const comboDisplay = document.getElementById("combo");
  if (!comboDisplay) {
    console.error("combo が見つかりません");
    return;
  }

  // 初期HTML構造を設定
  comboDisplay.innerHTML = `
    <div class="combo-Technique-item">
      <span class="combo-Technique-type">A</span>: 
      <span class="combo-Technique-name">-</span>
    </div>
    <div class="combo-Technique-item">
      <span class="combo-Technique-type">S</span>: 
      <span class="combo-Technique-name">-</span>
    </div>
    <div class="combo-Technique-item">
      <span class="combo-Technique-type">Q</span>: 
      <span class="combo-Technique-name">-</span>
    </div>
  `;
}


// position を基にキャラクターカードを取得する関数
function getCharacterCardByPosition(position) {
  console.log("getCharacterCardByPosition - position:", position);

  // 前衛または後衛を判定して行IDを取得
  const rowId = position.type === "前衛" ? "ally-front" : "ally-rear";

  // 行（前衛または後衛）を取得
  const row = document.getElementById(rowId);
  if (!row) {
    console.error(`指定された行が見つかりません: ${rowId}`);
    return null;
  }

  // スロット番号（data-id）に一致するカードを取得
  const card = row.querySelector(`.card-container[data-id='${position.slot}']`);
  if (!card) {
    console.error(`指定されたスロットが見つかりません: ${position.slot} in ${rowId}`);
    return null;
  }
  return card;
}




// 消費量を計算して消費分だけ点滅させる関数
async function calculateConsumption() {
  totalConsumption = {
    HP: 0,
    MP: 0,
    ST: 0,
    消費増加: 0,
  };

  // コンボ内のスキルから消費を合計
  Object.values(combo).forEach((Technique) => {
    if (Technique) {
      // 各消費を合計
      totalConsumption.HP += Technique.HP消費 || 0;
      totalConsumption.MP += Technique.MP消費 || 0;
      totalConsumption.ST += Technique.ST消費 || 0;

      // 消費増加が "+50%" のような形式の場合、それを数値に変換
      if (Technique.消費増加) {
        const parsedIncrease = parseFloat(Technique.消費増加.replace('%', ''));
        if (!isNaN(parsedIncrease)) {
          totalConsumption.消費増加 += parsedIncrease / 100; // 50% -> 0.5
        }
      }
    }
  });
  // 消費増加を適用して最終的な値を計算
  if (totalConsumption.消費増加 > 0) {
    totalConsumption.HP = Math.round(totalConsumption.HP * (1 + totalConsumption.消費増加));
    totalConsumption.MP = Math.round(totalConsumption.MP * (1 + totalConsumption.消費増加));
    totalConsumption.ST = Math.round(totalConsumption.ST * (1 + totalConsumption.消費増加));
  }
  

  currentCharacter = readyCharacters[currentIndex];
  console.log("コンボ内のスキルから消費を合計 :", totalConsumption, currentCharacter);

  // 対象キャラクターカードを取得
  const characterCard = getCharacterCardByPosition(currentCharacter.position);
  if (!characterCard) {
    console.error("対象キャラクターカードが見つかりません");
    return;
  }

  // 各メーターを取得
  const hpMeter = characterCard.querySelector(".hp-bar-fill");
  const mpMeter = characterCard.querySelector(".mp-bar-fill");
  const stMeter = characterCard.querySelector(".st-bar-fill");

  // 消費分だけ点滅させる
  blinkConsumptionArea(hpMeter, totalConsumption.HP, currentCharacter.stats.totalStats.HP, currentCharacter.stats.consumptionStats.HP消費);
  blinkConsumptionArea(mpMeter, totalConsumption.MP, currentCharacter.stats.totalStats.MP, currentCharacter.stats.consumptionStats.MP消費);
  blinkConsumptionArea(stMeter, totalConsumption.ST, currentCharacter.stats.totalStats.ST, currentCharacter.stats.consumptionStats.ST消費);

  await calculateComboTotals()
}

function blinkConsumptionArea(meterElement, consumption, maxValue, currentConsumption) {
  // 現在のメーター幅を計算（% 表示）
  const currentPercentage = ((maxValue - currentConsumption) / maxValue) * 100;

  // 消費後の幅を計算（現在の幅から消費分を引いた値）
  const newPercentage = ((maxValue - currentConsumption - consumption) / maxValue) * 100;

  // 消費分だけ点滅させる幅を計算
  const consumptionWidth = currentPercentage - newPercentage;

  const metervalue = meterElement.parentElement?.querySelector(".value");
  console.log(" metervalue :", metervalue.textContent, metervalue)
  metervalue.textContent = `${ maxValue - ( currentConsumption + consumption ) }/${ maxValue }`;


  // すでにオーバーレイが存在する場合を確認
  let consumptionOverlay = meterElement.parentElement.querySelector(".consumption-overlay");
  if (!consumptionOverlay) {
    // 消費エリアを作成
    consumptionOverlay = document.createElement("div");
    consumptionOverlay.className = "consumption-overlay";
    consumptionOverlay.style.position = "absolute";
    consumptionOverlay.style.top = "0";
    consumptionOverlay.style.bottom = "0";
    consumptionOverlay.style.pointerEvents = "none"; // ユーザー操作を無効化

    // メーターの親要素に追加
    meterElement.parentElement.appendChild(consumptionOverlay);
  }

  // 消費がない場合、オーバーレイを削除して点滅を外す
  if (consumption <= 0 || consumptionWidth <= 0) {
    consumptionOverlay.remove();
    return;
  }

  // 消費エリアの位置と幅を設定
  consumptionOverlay.style.right = `${100 - currentPercentage}%`; // メーターの現在位置の右端
  consumptionOverlay.style.width = `${consumptionWidth}%`;

  // 点滅アニメーションを適用
  consumptionOverlay.classList.add("blink");
}

// メーターの値を更新する関数
function updateValueElement(meterElement, currentValue, maxValue) {
  const valueElement = getValueElement(meterElement);
  if (valueElement) {
    valueElement.textContent = `${currentValue}/${maxValue}`; // 例: "56/66"
  }
}


function applyBlinkEffect(element) {
  if (element) {
    console.log("【点滅エフェクトを適用】", element);
    element.classList.remove("blink");
    void element.offsetWidth; // リフローを強制
    element.classList.add("blink");
  } else {
    console.error("【点滅エフェクトの適用対象が見つかりません】");
  }
}


// ==================================================================================================
// コンボ合計を計算する関数（攻撃手段ごとに処理）
function calculateComboTotals() {
  const character = readyCharacters[currentIndex];
  const abilitiesByMeans = calculateComboAttributes(character); // 攻撃手段ごとのデータを取得

  console.log("コンボ合計を計算する関数 (攻撃手段ごと):", abilitiesByMeans);
  console.log("ステータス確認:", character.stats.totalStats);

  // 各攻撃手段ごとに計算を実行
  Object.keys(abilitiesByMeans).forEach(mean => {
    const Skill = abilitiesByMeans[mean];

    // 攻撃手段ごとのデータをログに出力
    console.log(`攻撃手段: ${mean}`, Skill);

    // 各攻撃手段ごとの威力と攻撃回数を計算
    const calculateComboTotals = calculateTotalPowerAndAttackCount(Skill, mean);
    // まとめてログを表示
    console.log("各攻撃手段ごとの威力と攻撃回数を計算", calculateComboTotals);
  });
}

function calculateComboAttributes2(character) {
  if (!character) {
    console.error("無効なキャラクターが指定されました");
    return;
  }

  // 初期化: 攻撃手段ごとの comboAttributes
  const comboAttributesByMeans = {};

  // 登録済みの攻撃手段を取得
  const attackMeansList = Object.values(combo).reduce((means, Technique) => {
    if (Technique && Technique["攻撃手段"]) {
      const meansArray = Array.isArray(Technique["攻撃手段"]) ? Technique["攻撃手段"] : [Technique["攻撃手段"]];
      meansArray.forEach(mean => {
        if (!means.includes(mean)) {
          means.push(mean);
        }
      });
    }
    return means;
  }, []);
  const passiveTechniques = actionList["P"]
  console.log(" passiveTechniques :", passiveTechniques)
  const updatedCombo = addPassiveTechniquesToCombo(passiveTechniques, combo);
  console.log(" updatedCombo :", updatedCombo)

  
  // 攻撃手段ごとに comboAttributes を作成
  attackMeansList.forEach(mean => {
    comboAttributesByMeans[mean] = {
      attack: {},
      status: {},
      defense: {},
      modifierSums: {},
      rangeEffect: {},
    };
  });

  // スキルを各攻撃手段に振り分けて計算
  Object.values(combo).forEach(Technique => {
    if (!Technique) return;

    const TechniqueMeans = Technique["攻撃手段"]
      ? Array.isArray(Technique["攻撃手段"]) ? Technique["攻撃手段"] : [Technique["攻撃手段"]]
      : attackMeansList; // 攻撃手段がない場合はすべての攻撃手段に適用

    TechniqueMeans.forEach(mean => {
      const comboAttributes = comboAttributesByMeans[mean];

      // **1. ステータス補正を適用**
      modifier_Sums.forEach(attr => {
        comboAttributes.modifierSums[attr] =
          (comboAttributes.modifierSums[attr] || 0) + (parseFloat(Technique[attr]) || 0);
      });

      // **2. rangeEffect の計算**
      rangeEffect.forEach(key => {
        if (!comboAttributes.rangeEffect[key]) {
          comboAttributes.rangeEffect[key] = [];
        }
        if (Technique[key]) {
          comboAttributes.rangeEffect[key].push(Technique[key]);
        }
      });
    });
  });

  // **3. 攻撃属性、状態異常、防御属性を計算**
  Object.values(combo).forEach(Technique => {
    if (!Technique) return;

    const TechniqueMeans = Technique["攻撃手段"]
      ? Array.isArray(Technique["攻撃手段"]) ? Technique["攻撃手段"] : [Technique["攻撃手段"]]
      : attackMeansList; // 攻撃手段がない場合はすべての攻撃手段に適用

    TechniqueMeans.forEach(mean => {

      const comboAttributes = comboAttributesByMeans[mean];
     
      const atttackCount = calculateAttackCount(comboAttributes.rangeEffect)
      console.log(" 攻撃属性、状態異常、防御属性を計算 :", atttackCount)

      const 判定Value = (comboAttributes.modifierSums[Technique["判定"]] || 0) + character.stats.totalStats[Technique["判定"]] || 0;
      const 追加威力Value = (comboAttributes.modifierSums[Technique["追加威力"]] || 0) + character.stats.totalStats[Technique["追加威力"]] || 0;
      const judgingAttributes = (1 + 判定Value / 100) * (1 + 追加威力Value / 500) / atttackCount;
      
      attack_attributes.forEach(attr => {
        comboAttributes.attack[attr] =
          (comboAttributes.attack[attr] || 0) + ((Technique[attr] || 0) * judgingAttributes);
      });

      status_attributes.forEach(attr => {
        comboAttributes.status[attr] =
          (comboAttributes.status[attr] || 0) + ((Technique[attr] || 0) * judgingAttributes);
      });

      ["物理ガード", "魔法ガード", "物理軽減", "魔法軽減"].forEach(attr => {
        comboAttributes.defense[attr] =
          (comboAttributes.defense[attr] || 0) + ((Technique[attr] || 0) * judgingAttributes);
      });
    });
  });
  
  // **4. 攻撃属性、状態異常、防御属性の倍率計算を適用**
  Object.keys(comboAttributesByMeans).forEach(mean => {
    const comboAttributes = comboAttributesByMeans[mean];

    const applyMultiplier = attributes => {
      Object.keys(attributes).forEach(attr => {
        const attrMultiplier = (comboAttributes.modifierSums[`${attr}倍`] || 0) / 100;
        const globalMultiplier = (comboAttributes.modifierSums[`威力倍率`] || 0) / 100;
        const multiplier = (1 + attrMultiplier) * (1 + globalMultiplier);
        attributes[attr] *= multiplier;
      });
    };

    applyMultiplier(comboAttributes.attack);
    applyMultiplier(comboAttributes.status);
    applyMultiplier(comboAttributes.defense);
  });

  return comboAttributesByMeans;
}

// コンボの計算式
function calculateComboAttributes(character) {
  if (!character) {
    console.error("無効なキャラクターが指定されました");
    return;
  }

  // 初期化: 攻撃手段ごとの comboAttributes
  const comboAttributesByMeans = {};

  // **1. updatedCombo を生成**
  const passiveTechniques = actionList["P"]; // 常時発動スキル
  const updatedCombo = addPassiveTechniquesToCombo(passiveTechniques, combo);
  console.log("updatedCombo:", updatedCombo);

  // **2. 攻撃手段リストを取得**
  const attackMeansList = Object.values(updatedCombo).reduce((means, Technique) => {
    if (Technique && Technique["攻撃手段"]) {
      const meansArray = Array.isArray(Technique["攻撃手段"]) ? Technique["攻撃手段"] : [Technique["攻撃手段"]];
      meansArray.forEach(mean => {
        if (!means.includes(mean)) {
          means.push(mean);
        }
      });
    }
    return means;
  }, []);

  // **3. 攻撃手段ごとに comboAttributes を作成**
  attackMeansList.forEach(mean => {
    comboAttributesByMeans[mean] = {
      attack: {},
      status: {},
      defense: {},
      modifierSums: {},
      rangeEffect: {},
    };
  });

  // **4. updatedCombo 内のスキルを各攻撃手段に振り分けて計算**
  Object.values(updatedCombo).forEach(Technique => {
    if (!Technique) return;

    const TechniqueMeans = Technique["攻撃手段"]
      ? Array.isArray(Technique["攻撃手段"]) ? Technique["攻撃手段"] : [Technique["攻撃手段"]]
      : attackMeansList; // 攻撃手段がない場合はすべての攻撃手段に適用

    TechniqueMeans.forEach(mean => {
      const comboAttributes = comboAttributesByMeans[mean];

      // **4-1. ステータス補正の計算**
      modifier_Sums.forEach(attr => {
        comboAttributes.modifierSums[attr] =
          (comboAttributes.modifierSums[attr] || 0) + (parseFloat(Technique[attr]) || 0);
      });

      // **4-2. rangeEffect の計算**
      rangeEffect.forEach(key => {
        if (!comboAttributes.rangeEffect[key]) {
          comboAttributes.rangeEffect[key] = [];
        }
        if (Technique[key]) {
          comboAttributes.rangeEffect[key].push(Technique[key]);
        }
      });
    });
  });

  // **5. 攻撃属性、状態異常、防御属性の計算**
  Object.values(updatedCombo).forEach(Technique => {
    if (!Technique) return;

    const TechniqueMeans = Technique["攻撃手段"]
      ? Array.isArray(Technique["攻撃手段"]) ? Technique["攻撃手段"] : [Technique["攻撃手段"]]
      : attackMeansList; // 攻撃手段がない場合はすべての攻撃手段に適用

    TechniqueMeans.forEach(mean => {
      const comboAttributes = comboAttributesByMeans[mean];

      // 
      const attackCount = (allowedKeys.includes(Technique["特殊"])) ? 1 : calculateAttackCount(comboAttributes.rangeEffect);
      const 判定Value = (comboAttributes.modifierSums[Technique["判定"]] || 0) + character.stats.totalStats[Technique["判定"]] || 0;
      const 追加威力Value = (comboAttributes.modifierSums[Technique["追加威力"]] || 0) + character.stats.totalStats[Technique["追加威力"]] || 0;
      const judgingAttributes = (1 + 判定Value / 100) * (1 + 追加威力Value / 500) / attackCount;

      // 攻撃属性の計算
      attack_attributes.forEach(attr => {
        comboAttributes.attack[attr] =
          (comboAttributes.attack[attr] || 0) + ((Technique[attr] || 0) * judgingAttributes);
      });

      // 状態異常属性の計算
      status_attributes.forEach(attr => {
        comboAttributes.status[attr] =
          (comboAttributes.status[attr] || 0) + ((Technique[attr] || 0) * judgingAttributes);
      });

      // 防御属性の計算
      ["物理ガード", "魔法ガード", "物理軽減", "魔法軽減"].forEach(attr => {
        comboAttributes.defense[attr] =
          (comboAttributes.defense[attr] || 0) + ((Technique[attr] || 0) * judgingAttributes);
      });
    });
  });

  // **6. 攻撃属性、状態異常、防御属性の倍率計算を適用**
  Object.keys(comboAttributesByMeans).forEach(mean => {
    const comboAttributes = comboAttributesByMeans[mean];

    const applyMultiplier = attributes => {
      Object.keys(attributes).forEach(attr => {
        const attrMultiplier = (comboAttributes.modifierSums[`${attr}倍`] || 0) / 100;
        const globalMultiplier = (comboAttributes.modifierSums[`威力倍率`] || 0) / 100;
        const multiplier = (1 + attrMultiplier) * (1 + globalMultiplier);
        attributes[attr] *= multiplier;
      });
    };

    applyMultiplier(comboAttributes.attack);
    applyMultiplier(comboAttributes.status);
    applyMultiplier(comboAttributes.defense);
  });

  return comboAttributesByMeans;
}


function calculateTotalPowerAndAttackCount(comboAttributes, mean) {
  // attack: {},
  // status: {},
  // defense: {},
  // modifierSums: {},
  // rangeEffect: {},
  const totalPower = calculateTotalAttackPower(comboAttributes.attack) // 威力を取得
  const totalStats = calculateTotalAttackPower(comboAttributes.status) // 威力を取得
  const totalGuard= calculateTotalAttackPower(comboAttributes.defense) // 威力を取得
  const attackCount = calculateAttackCount(comboAttributes.rangeEffect); // 攻撃回数を合計

  return {
    totalPower,
    totalStats,
    totalGuard,
    attackCount
  };
}


// 追加パッシブコンボ
function addPassiveTechniquesToCombo(passiveTechniques, combo) {
  if (!Array.isArray(passiveTechniques) || !combo) {
    console.error("無効なデータです: passiveTechniques または combo が無効です");
    return combo;
  }

  console.log("パッシブスキルを combo に追加:", passiveTechniques);

  // パッシブスキルをチェック
  passiveTechniques.forEach((passive, index) => {
    if (!passive || typeof passive !== "object") {
      console.warn("無効なパッシブスキル:", passive);
      return;
    }

    // 新たに枠を追加 (P, P1, P2...)
    const passiveKey = `P${index}`; // P0, P1, P2 のように生成

    // `combo` 内の各スキルと照合
    Object.keys(combo).forEach(type => {
      const Technique = combo[type];
      if (!Technique) return; // 現在選択されていないスキルはスキップ

      // **攻撃手段が一致**または**条件系統が一致**する場合
      if (
        (passive["攻撃手段"] && Technique["攻撃手段"] && passive["攻撃手段"] === Technique["攻撃手段"]) ||
        (passive["条件系統"] && Technique["条件系統"] && passive["条件系統"] === Technique["条件系統"])
      ) {
        console.log(`条件一致: ${passive.name} を ${type} に追加 (${passiveKey})`);

        // パッシブスキルを新しい枠に追加
        combo[passiveKey] = {
          ...passive, // パッシブスキルのデータ
          適用先: type, // 適用されたスキルの種類を記録
        };
      }
    });
  });

  // 更新された combo を返す
  console.log("更新された combo:", combo);
  return combo;
}

// 使用可能アビリティを取得
function addMatchingTechniquesToCombo(TechniqueList, checkCombo = combo) {
  if (!Array.isArray(TechniqueList) || typeof checkCombo !== "object") {
    console.warn("無効なデータです: TechniqueList または checkCombo が無効です");
    return [];
  }

  console.log("スキルリストから一致するスキルを combo に追加:", TechniqueList);

  // 使用可能なスキルリストを作成
  const matchingTechniques = TechniqueList.filter(Technique => {
    if (!Technique || typeof Technique !== "object") {
      console.warn("無効なスキル:", Technique);
      return false;
    }

    // 条件が全て空の場合は無条件で OK
    const isAllEmpty = ["攻撃手段", "条件系統", "条件"].every(key => !Technique[key]);

    // 特殊が "攻撃" の場合は無条件で OK
    if (isAllEmpty || allowedKeys.includes(Technique["特殊"])) {
      // console.log(無条件で追加: ${Technique.name});
      return true;
    }

    // 攻撃手段が一致している場合は OK
    const isMatchingMeans =
      Technique["攻撃手段"] &&
      Object.values(checkCombo).some(s => s && s["攻撃手段"] === Technique["攻撃手段"]);

    // 条件系統が一致している場合は OK
    const isMatchingSystem =
      Technique["条件系統"] &&
      Object.values(checkCombo).some(s => s && s["系統"] === Technique["条件系統"]);

    // 条件が一致している場合は OK
    const isMatchingCondition =
      Technique["条件"] &&
      Object.values(checkCombo).some(s => s && s.name === Technique["条件"]);

    // 条件を満たしているか判定
    return isMatchingMeans || isMatchingSystem || isMatchingCondition;
  });

  console.log("使用可能なスキル:", matchingTechniques);
  return matchingTechniques;
}

// コンボの内容を確認
function checkComboTechnique() {
  const character = readyCharacters[currentIndex];
  if (!character) {
    console.error("キャラクター情報が見つかりません");
    return;
  }

  // updatedCombo の初期化
  const updatedCombo = {};

  // **第一段階: "特殊" === "攻撃" のスキルを残す**
  Object.keys(combo).forEach(type => {
    const Technique = combo[type];
    if (!Technique) return;

    // 特殊が "攻撃" の場合のみ追加
    if (allowedKeys.includes(Technique["特殊"])) {
      console.log(`${type}: スキル ${Technique.name} は特殊が「攻撃」のため条件をスキップ`);
      updatedCombo[type] = Technique;
      return;
    }

    // 攻撃手段、条件系統、条件が空文字列の場合は無条件で追加
    const hasNoConditions =
      (!Technique["攻撃手段"] || Technique["攻撃手段"] === "") &&
      (!Technique["条件系統"] || Technique["条件系統"] === "") &&
      (!Technique["条件"] || Technique["条件"] === "");

    if (hasNoConditions) {
      console.log(`${type}: スキル ${Technique.name} は条件が空のため無条件で追加されます`);
      updatedCombo[type] = Technique;
    }
  });

  console.log(`第一段階 :`, updatedCombo);

  // **第二段階: 攻撃手段、条件系統、条件の一致を確認**
  Object.keys(combo).forEach(type => {
    const Technique = combo[type];
    if (!Technique || updatedCombo[type]) return; // 第一段階で追加済みの場合スキップ

    // 攻撃手段が一致しているか確認
    const isMatchingMeans =
      Technique["攻撃手段"] &&
      Object.values(updatedCombo).some(s => s && s["攻撃手段"] === Technique["攻撃手段"]);

    // 条件系統が一致しているか確認
    const isMatchingSystem =
      Technique["条件系統"] &&
      Object.values(updatedCombo).some(s => s && s["系統"] === Technique["条件系統"]);

    // 条件が一致しているか確認
    const isMatchingCondition =
      Technique["条件"] &&
      Object.values(updatedCombo).some(s => s && s.name === Technique["条件"]);

    console.log(`第二段階条件を満たしていないスキルを除外 :`, isMatchingMeans, isMatchingSystem, isMatchingCondition);
    // 条件を満たしている場合のみ追加
    if (isMatchingMeans || isMatchingSystem || (Technique["条件"] && isMatchingCondition)) {
      console.log(`スキル ${Technique.name} は条件を満たしているため ${type} に追加されます`);
      updatedCombo[type] = Technique;
    } else {
      console.warn(`スキル ${Technique.name} は条件を満たしていないため除外されます`);
    }
  });
  console.log(`第二段階 :`, updatedCombo);

  // **第三段階: 更新されたスキルで再チェック**
  Object.keys(updatedCombo).forEach(type => {
    const Technique = updatedCombo[type];
    if (!Technique) return;

    // 他のスキルがこのスキルの条件を満たしているか確認
    const isMatchingCondition =
      Technique["条件"] &&
      Object.values(updatedCombo).some(s => s && s.name === Technique["条件"]);

    if (Technique["条件"] && !isMatchingCondition) {
      console.warn(`スキル ${Technique.name} の条件が再チェックで満たされていないため ${type} から外されます`);
      updatedCombo[type] = null; // 条件を満たさない場合削除
    } else {
      console.log(`スキル ${Technique.name} は最終条件を満たしています`);
    }
  });
  // **スキルがない場合、明示的に null を設定**
  Object.keys(combo).forEach(type => {
    if (!updatedCombo.hasOwnProperty(type)) {
      updatedCombo[type] = null; // 存在しないスキルを明示的に null にする
    }
  });
  console.log(`第三段階 :`, updatedCombo);

  // 最終的な combo に更新
  Object.assign(combo, updatedCombo);
  console.log(`最終的な更新 :`, combo);
  // コンボ表示を更新
  updateComboDisplay();
}









// ==================================================================================================

// イベントリスナーを設定
// document.getElementById("close-button").addEventListener("click", closeBattleModal);

function openBattleModal() {
  console.log(" openBattleModal :")  
  const battleModal = document.getElementById("battle-modal");
  // header-info
  document.getElementById("action-button").style.display = "none";
  document.getElementById('character-status').style.display = "none";
  document.getElementById('header-info').style.display = "none";
  battleModal.classList.remove("hidden"); // モーダルを表示

  // 使用例
  // addBattleLog("敵が現れた！", 50, "fade-in", "コイン maou_se_system46.mp3");
  // addBattleLog("プレイヤーの攻撃！", 30, "slide-in", "決定ボタンを押す40.mp3");
  // addBattleLog("敵に10ダメージを与えた！", 50, "bounce-in", "データ表示2.mp3");
  // // addBattleLog("", 50); // 空白メッセージ: 画面リセット
  // addBattleLog("敵に不意をつかれた！ 敵からの攻撃を回避できない。長文テスト", 70, "", "使徒のビーム.mp3");
  // addBattleLog("５", 70, "", "決定ボタンを押す40.mp3");
  // addBattleLog("6", 70, "", "決定ボタンを押す40.mp3");
  // addBattleLog("7", 70, "", "決定ボタンを押す40.mp3");
  // addBattleLog("8", 70, "", "決定ボタンを押す40.mp3");
  // addBattleLog("", 0, "", null, true);
  // addBattleLog("そのとき・・・・", 50, "fade-in", "コイン maou_se_system46.mp3");
  // addBattleLog("文章をリセットされたか確認", 30, "slide-in", "maou_se_onepoint28.mp3");
  // addBattleLog("敵に10ダメージを与えた！", 50, "bounce-in", "はてな maou_se_system46.mp3");
  // // addBattleLog("", 50); // 空白メッセージ: 画面リセット
  // addBattleLog("敵に不意をつかれた！ 敵からの攻撃を回避できない。長文テスト", 70, "", "ミス maou_se_onepoint20.mp3");

}

function closeBattleModal() {
  const battleModal = document.getElementById("battle-modal");
  document.getElementById("action-button").style.display = "flex";
  document.getElementById('character-status').style.display = "flex";
  document.getElementById('header-info').style.display = "flex";
  battleModal.classList.add("hidden"); // モーダルを非表示
}



// アビリティ選択が完了したタイミングで呼び出す
function onSkillSelectionComplete() {
  console.log("アビリティ選択が完了しました");
  showBattleLog();
}

// アビリティ計算 ================
function calculateTotalAttackPower(attackAttributes) {
  // attackAttributes 内の全ての数値を合計
  return Object.values(attackAttributes).reduce((total, value) => {
    if (typeof value === "number") {
      return total + value; // 数値の場合は合計に加算
    }
    return total; // 数値以外は無視
  }, 0);
}

// 攻撃回数
function calculateAttackCount(rangeEffect) {
  if (!rangeEffect || !Array.isArray(rangeEffect["攻撃回数"])) {
    console.error("攻撃回数データが無効です");
    return 1; // デフォルトで攻撃回数1
  }

  // **1. 攻撃回数の最低値を取得**
  const baseAttackCount = Math.min(...rangeEffect["攻撃回数"].map(value => {
    if (typeof value === "number") {
      return value; // 数値の場合そのまま返す
    }
    return 1; // 無効な値の場合、デフォルトで1
  }));

  // **2. 攻撃追加を合計**
  const attackAdditions = rangeEffect["攻撃追加"]
    ? rangeEffect["攻撃追加"].reduce((sum, value) => {
        if (typeof value === "string" && value.stSkillWith("+")) {
          return sum + parseFloat(value.replace("+", "")) || 0; // "+2" -> 2
        }
        return sum; // 数値以外は無視
      }, 0)
    : 0;

  // **3. 倍加倍率を適用**
  let multiplier = 1; // 倍加倍率の初期値
  rangeEffect["攻撃回数"].forEach(value => {
    if (typeof value === "string" && value.includes("倍加")) {
      multiplier *= parseFloat(value.replace("倍加", "")) || 1; // "2倍加" -> 2
    }
  });

  // **4. 最終攻撃回数を計算**
  const totalAttackCount = (baseAttackCount + attackAdditions) * multiplier;

  // **5. 攻撃回数を整数値として返す**
  return Math.floor(totalAttackCount);
}


// 行動中のキャラクターを選択
function highlightActiveCharacter() {
  // 現在行動中のキャラクター情報を取得
  const currentCharacter = readyCharacters[currentIndex];
  console.log("現在行動中のキャラクター:", currentCharacter);

  // キャラクターの位置からカード要素を取得
  const characterCard = getCharacterCardByPosition(currentCharacter.position);

  // 全てのキャラクターカードから強調表示を削除
  const allCards = document.querySelectorAll(".character-card, .card-container");
  allCards.forEach(card => {
    card.classList.remove("active-character");
  });

  // 行動中のキャラクターに強調表示を追加
  if (characterCard) {
    characterCard.classList.add("active-character");
  } else {
    console.warn("行動中のキャラクターカードが見つかりません");
  }
}

// ==================================================================================================
function onCharacterCardClick() {
  const character = readyCharacters[currentIndex];
  // 自分か他のキャラクターかを判定
  const isSelf = character.position === currentCharacter.position;
  console.log("onCharacterCardClick :", character)

  // 自分を選択した場合
  if (isSelf) {
    openUniversalModal({
      type: "info",
      title: "スキップの確認",
      content: "<p>このターンをスキップしますか？</p>",
      buttons: [
        { label: "はい", onClick: skipTurn },
        { label: "いいえ", onClick: closeUniversalModal },
      ],
    });
  } else {
    // 敵または味方を選択した場合
    const targetType = character.team === "enemy" ? "敵" : "味方";
    openUniversalModal({
      type: "info",
      title: `${targetType}を選択しました`,
      content: `<p>${character.name} に対して何を行いますか？</p>`,
      buttons: [
        { label: "攻撃", onClick: () => startAction(character) },
        { label: "キャンセル", onClick: closeUniversalModal },
      ],
    });
  }
}
