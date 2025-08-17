const characterData = {
  // キャラクターの基本情報
  name: "",

  // クエストとストーリー
  questProgress: [
    // クエストごとの進行状況
    // 例: { questId: "001", progress: "進行中" }
  ],
  storyFlags: {
    // ストーリーイベントの進行状況を記録
    // 例: {"イベント001": true, "イベント002": false}
  },

　storage: [], // 倉庫アイテムリスト
  money: 0, // 所持金

  // ギルド/パーティー
  party: [],
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
  userId: null,
};

const statKeys = [
  "HP",
  "MP",
  "ST",
  "攻撃",
  "防御",
  "魔力",
  "精神",
  "速度",
  "命中",
  "APP",
  "隠密",
  "感知",
  "威圧",
  "軽業",
  "技術",
  "早業",
  "看破",
  "騙す",
  "知識",
  "鑑定",
  "装置",
  "変装",
  "制作",
  "精神接続",
  "魔法技術",
  "指揮",
];

const resistanceKeys = [
  "物理軽減",
  "魔法軽減",
  "切断耐性",
  "精神耐性",
  "毒耐性",
  "盲目耐性",
  "幻覚耐性",
  "石化耐性",
  "怯み耐性",
  "拘束耐性",
  "呪い耐性",
  "即死耐性",
  "時間耐性",
  "出血耐性",
  "疲労耐性",
  "体幹耐性",
  "物理耐性",
  "魔法耐性",
  "Cr率耐性",
  "Cr威力耐性",
];

const bodyKeys = [
  "素手",
  "角",
  "牙",
  "爪",
  "翼",
  "尾",
  "外皮",
  "外殻",
  "再生",
  "SIZ",
];

// HTML要素の取得
const nameInput = document.getElementById("name");
const confirmNameButton = document.getElementById("confirmName");
const raceSelection = document.getElementById("raceSelection");
const classSelection = document.getElementById("classSelection");
const createCharacterButton = document.getElementById("createCharacter");
const modal = document.getElementById("modal-select");
const modalTitle = document.getElementById("modalTitle");
const statsList = document.getElementById("statsList");
const trait = document.getElementById("trait");
const role = document.getElementById("role");
const weakness = document.getElementById("weakness");
const prevButton = document.getElementById("prevButton");
const nextButton = document.getElementById("nextButton");
const confirmButton = document.getElementById("confirmButton");
const closeButton = document.getElementById("closeButton");
const showRaceModal = document.getElementById("showRaceModal");
const showClassModal = document.getElementById("showClassModal");
const selectedRaceName = document.getElementById("selectedRaceName");
const selectedClassName = document.getElementById("selectedClassName");
const selectedRaceContainer = document.getElementById("selectedRace");
const selectedClassContainer = document.getElementById("selectedClass");
const raceCategoryButtons = document.getElementById("raceCategoryButtons");
const raceLevelInput = document.getElementById("raceLevel");
const classLevelInput = document.getElementById("classLevel");
const levelAllocation = document.getElementById("levelAllocation");
const confirmLevelsButton = document.getElementById("confirmLevels");
const statusPreview = document.getElementById("statusPreview");
const totalStatusElement = document.getElementById("totalStatus");
const totalTechniquesElement = document.getElementById("totalTechniques");

const TechniquesList = document.getElementById("TechniquesList");
const selectedRaceDisplay = document.getElementById("selectedRaceDisplay");
const selectedClassDisplay = document.getElementById("selectedClassDisplay");

// データと状態管理
let raceData = [];
let classData = [];
let selectedRace = null;
let selectedClass = null;
let raceLevel = 1;
let classLevel = 9;
let isHuman = false; // 人族かどうかの判定
let playerData = JSON.parse(JSON.stringify(characterData));

let SkillData = [];

const username = localStorage.getItem("username");
const userId = localStorage.getItem("userId");
const token = localStorage.getItem("authToken");
// localStorage.setItem('authToken', token);

//========= 初期化処理とデータロード ================================================================
// ページ読み込み時の初期化処理
document.addEventListener("DOMContentLoaded", () => {
  console.log("ページロード完了");
  console.log("username userId :", username, userId);
  console.log("token :", token);
  console.log("ページロード完了");
  loadOptions(); // 種族とクラスのデータをロード
  disableAutofill(); // フォームのオートフィル無効化
});

// オートフィルを無効化
function disableAutofill() {
  const fields = document.querySelectorAll("input");
  fields.forEach((field) => {
    field.setAttribute("autocomplete", "off");
    field.setAttribute("autofill", "off");
  });
  console.log("オートフィル無効化完了");
}

// データをロードしてカテゴリ分け
async function loadOptions() {
  try {
    const response = await fetch("/api/excel/classes");
    const classes = await response.json();
    console.log("データ取得成功", classes);

    raceData = classes
      .filter((cls) => ["人族", "亜人", "魔族"].includes(cls["分類"]))
      .filter(isAllConditionsEmptyOrZero);
    classData = classes
      .filter((cls) => cls["分類"] === "職業")
      .filter(isAllConditionsEmptyOrZero);

    console.log("raceData", raceData);
    console.log("classData", classData);

    showRaceModal.onclick = () => openModal(raceData, "race");
    showClassModal.onclick = () => openModal(classData, "class");
  } catch (error) {
    console.error("データの取得に失敗", error);
    document.getElementById("message").textContent =
      "データの取得に失敗しました";
  }
  await loadTechniques();
}

async function getUserId() {
  try {
    const token = localStorage.getItem("authToken"); // ログイン時に保存されたトークン
    const response = await fetch("/api/user", {
      headers: {
        Authorization: `Bearer ${token}`, // トークンをヘッダーに含める
      },
    });

    if (!response.ok) {
      throw new Error("ユーザー情報の取得に失敗しました");
    }

    const user = await response.json();
    console.log("ログイン中のユーザー:", user);
    return user.id; // ユーザーIDを返す
  } catch (error) {
    console.error("ユーザーIDの取得中にエラー:", error);
    alert("ログイン情報を確認してください");
    window.location.href = "/login.html"; // ログイン画面にリダイレクト
  }
}

// 条件が空または0であるかを判定
function isAllConditionsEmptyOrZero(cls) {
  const conditions = [
    "条件系統",
    "条件系統Lv",
    "条件クラス_1",
    "条件クラス_2",
    "条件スキル",
    "条件属性",
  ];
  return conditions.every((key) => !cls[key] || cls[key] === 0);
}

// 名前を確定する処理
confirmNameButton.addEventListener("click", () => {
  const enteredName = nameInput.value.trim(); // 名前入力を取得
  if (!enteredName) {
    document.getElementById("message").textContent = "名前を入力してください";
    console.error("名前が空です");
    return;
  }

  // 名前が有効な場合の処理
  document.getElementById("message").textContent = ""; // メッセージをクリア
  raceSelection.style.display = "block"; // 種族選択を表示
  confirmNameButton.disabled = true; // 名前確定ボタンを無効化
  console.log(`名前を確定: ${enteredName}`);
});

//========= モーダル制御 ================================================================
// モーダルを表示してデータを切り替え
function openModal(dataArray, type) {
  modal.style.display = "block";
  currentIndex = 0;
  displayModalData(dataArray[currentIndex]);

  prevButton.onclick = () => {
    currentIndex = (currentIndex - 1 + dataArray.length) % dataArray.length;
    displayModalData(dataArray[currentIndex]);
  };

  nextButton.onclick = () => {
    currentIndex = (currentIndex + 1) % dataArray.length;
    displayModalData(dataArray[currentIndex]);
  };

  confirmButton.onclick = () => {
    modal.style.display = "none";
    if (type === "race") {
      selectedRace = dataArray[currentIndex];
      selectedRaceName.textContent = selectedRace["名前"];
      selectedRaceContainer.style.display = "block";
      classSelection.style.display = "block"; // クラス選択を表示
      updateIsHuman(); // 人族かどうかを更新
    } else if (type === "class") {
      selectedClass = dataArray[currentIndex];
      selectedClassName.textContent = selectedClass["名前"];
      selectedClassContainer.style.display = "block";
    }
    updateSelectionDisplay(); // 選択情報を更新
    calculateAndDisplayStatus(); // ステータス更新
    displayTechniques(); // 技能更新
    displayAbilities(raceLevelInput.value, classLevelInput.value);
  };

  closeButton.onclick = () => {
    modal.style.display = "none";
  };
  console.log(`モーダルを開きました: ${type}`);
}

function calculateSizeModifier(siz) {
  if (siz >= 180) {
    return siz / 50 + 8;
  } else if (siz <= 150) {
    return -(160 - siz) / 3;
  } else {
    return 0;
  }
}

// テスト
console.log(calculateSizeModifier(180)); // 11.6 (例: 180/50 + 8)
console.log(calculateSizeModifier(150)); // -3.33 (例: -(160-150)/3)
console.log(calculateSizeModifier(160)); // 0 (範囲外)
console.log(calculateSizeModifier(200)); // 12 (例: 200/50 + 8)
console.log(calculateSizeModifier(100)); // -20 (例: -(160-100)/3)

// モーダル内のデータ表示
function displayModalData(data) {
  modalTitle.textContent = data["名前"];
  statsList.innerHTML = "";

  const sizValue = data["SIZ"] || 0;
  const modifier = calculateSizeModifier(sizValue);

  // ステータスリストに基づき補正を適用またはそのまま表示
  ["HP", "MP", "ST", "攻撃", "防御", "魔力", "精神", "速度", "命中"].forEach(
    (stat) => {
      let baseValue = data[stat] || 0;
      let adjustedValue = baseValue;
      let modifierDisplay = ""; // 補正の表示用

      if (["HP", "攻撃", "速度"].includes(stat)) {
        if (sizValue !== 0) {
          // SIZが0の場合は補正をスキップ
          if (stat === "速度") {
            // 速度は補正値の正負を反転させて適用
            adjustedValue = Math.round(
              baseValue - (baseValue * modifier) / 100
            );
            if (modifier !== 0) {
              modifierDisplay = ` (${baseValue} ${
                modifier > 0 ? "-" : "+"
              }${Math.abs(Math.round(modifier))}%)`;
            }
          } else {
            // HP, 攻撃は補正が正の場合は増加
            adjustedValue = Math.round(
              baseValue + (baseValue * modifier) / 100
            );
            if (modifier !== 0) {
              modifierDisplay = ` (${baseValue} ${
                modifier < 0 ? "" : "+"
              }${Math.round(modifier)}%)`;
            }
          }
        }
      }

      statsList.innerHTML += `<li>${stat}: ${adjustedValue}<span style="margin-left: 10px;">${modifierDisplay}</span></li>`;
    }
  );

  trait.textContent = data["特徴"] || "不明";
  role.textContent = data["主な役割"] || "不明";
  weakness.textContent = data["短所"] || "不明";

  // アイコン画像を設定
  const modalIcon = document.getElementById("modalIcon");
  modalIcon.src = `/images/${data["画像url"]}` || "/images/default-icon.png"; // アイコンがない場合はデフォルト画像
  modalIcon.alt = `${data["名前"]}のアイコン`;

  console.log("モーダルデータ表示", data);
}

// 選択中の情報を更新
function updateSelectionDisplay() {
  selectedRaceDisplay.textContent = selectedRace
    ? `種族: ${selectedRace["名前"]}`
    : "種族未選択";
  selectedClassDisplay.textContent = selectedClass
    ? `クラス: ${selectedClass["名前"]}`
    : "クラス未選択";

  selectedRaceDisplay.textContent = selectedRace
    ? `種族: ${selectedRace["名前"]}`
    : "種族未選択";
  selectedClassDisplay.textContent = selectedClass
    ? `クラス: ${selectedClass["名前"]}`
    : "クラス未選択";
  console.log("選択情報を更新:", { selectedRace, selectedClass });
}

// isHumanの動的更新
function updateIsHuman() {
  isHuman = selectedRace && selectedRace["分類"] === "人族"; // 種族が人族かを判定

  if (isHuman) {
    console.log("isHuman: 人族 ", isHuman);
    // 人族の場合、種族レベルを0に固定し、クラスレベルを最大10に設定
    raceLevel = 0;
    raceLevelInput.value = 0; // 入力欄を更新
    classLevel = 10;
    classLevelInput.value = 10;
  } else {
    console.log("noHuman: ", isHuman);
    // 人族以外の場合、種族レベルは最低1以上
    // if (raceLevel <= 0) {
    //     raceLevel = 1;
    //     raceLevelInput.value = 1;
    //     classLevel = 9;
    //     classLevelInput.value = 9;
    // }
  }

  console.log("updateIsHuman:", {
    isHuman,
    raceLevel,
    classLevel,
    selectedRace,
  });
}

//========= ステータスと技能の計算================================================================
// ステータスを計算して表示
function calculateAndDisplayStatus() {
  if (!selectedRace || !selectedClass) return;

  // 入力されたクラスレベルと種族レベルを再取得
  const currentClassLevel = parseInt(classLevelInput.value, 10) || 0;
  const currentRaceLevel = parseInt(raceLevelInput.value, 10) || 0;

  // 人族の場合、種族レベルは常に0
  const raceLevelEffective = isHuman ? 0 : currentRaceLevel;

  let totalStatus = 0;
  const statKeys = [
    "HP",
    "MP",
    "ST",
    "攻撃",
    "防御",
    "魔力",
    "精神",
    "速度",
    "命中",
  ];
  const statResults = [];

  // SIZ補正値を取得する関数
  function calculateSIZModifier(siz) {
    if (siz >= 180) {
      return siz / 50 + 8; // 大型種族の補正
    } else if (siz <= 150) {
      return -(160 - siz) / 3; // 小型種族の補正
    } else {
      return 0; // 標準種族は補正なし
    }
  }

  // SIZ補正値の取得
  const sizValue = selectedRace.SIZ || 0;
  const sizModifier = calculateSIZModifier(sizValue);

  // ステータス計算と結果保存
  statKeys.forEach((key) => {
    const raceStat = Math.floor(
      ((selectedRace[key] || 0) * (raceLevelEffective + 5)) / 10
    );
    const classStat = Math.floor(
      ((selectedClass[key] || 0) * currentClassLevel) / 10
    );
    let totalStat = raceStat + classStat;

    // SIZ補正の適用
    if (["HP", "攻撃", "速度"].includes(key)) {
      if (key === "速度") {
        // 速度はSIZ補正が正のとき減少、負のとき増加
        totalStat = Math.round(totalStat - (totalStat * sizModifier) / 100);
      } else {
        // HPや攻撃はSIZ補正値をそのまま加算
        totalStat = Math.round(totalStat + (totalStat * sizModifier) / 100);
      }
    }

    totalStatus += totalStat;

    // 結果を保存
    statResults.push({ key, totalStat, raceStat, classStat });
  });

  // 最大値と2番目の値を特定
  const sortedResults = [...statResults].sort(
    (a, b) => b.totalStat - a.totalStat
  );
  const highestValue = sortedResults[0]?.totalStat || 0;
  const secondHighestValue = sortedResults[1]?.totalStat || 0;

  // テーブルの描画
  const statusTableBody = document.querySelector("#statusTable tbody");
  statusTableBody.innerHTML = ""; // テーブルの中身をリセット

  statResults.forEach((result) => {
    let color = "";
    if (result.totalStat === highestValue) color = "color: red;"; // 最大値: 赤
    else if (result.totalStat === secondHighestValue) color = "color: orange;"; // 2番目: オレンジ

    // テーブルの行を生成
    statusTableBody.innerHTML += `
            <tr>
                <td>${result.key}</td>
                <td>${result.raceStat}</td>
                <td>${result.classStat}</td>
                <td style="${color}"><strong>${result.totalStat}</strong></td>
            </tr>
        `;
  });

  // 合計ステータスを表示
  document.getElementById("totalStatusElement").textContent = totalStatus;

  console.log("ステータス計算完了", {
    totalStatus,
    currentClassLevel,
    currentRaceLevel,
    sizModifier,
  });
}

function displayTechniques() {
  if (!selectedRace || !selectedClass) return;

  // 入力されたクラスレベルと種族レベルを再取得
  const currentClassLevel = parseInt(classLevelInput.value, 10) || 0; // クラスレベル
  const currentRaceLevel = parseInt(raceLevelInput.value, 10) || 0; // 種族レベル

  // 人族の場合、種族レベルは常に0
  const raceLevelEffective = isHuman ? 0 : currentRaceLevel;

  // 技能データの初期化
  const TechniqueResults = [];

  // 技能項目
  const TechniqueKeys = [
    "隠密",
    "感知",
    "威圧",
    "軽業",
    "技術",
    "早業",
    "看破",
    "騙す",
    "知識",
    "鑑定",
    "装置",
    "変装",
    "制作",
    "精神接続",
    "魔法技術",
    "指揮",
  ];

  // 技能値を計算
  TechniqueKeys.forEach((key) => {
    const raceTechnique = Math.floor(
      ((selectedRace[key] || 0) * (raceLevelEffective + 5)) / 10
    );
    const classTechnique = Math.floor(
      ((selectedClass[key] || 0) * currentClassLevel) / 10
    );
    const totalTechnique = raceTechnique + classTechnique;

    if (totalTechnique === 0 || totalTechnique <= 25) return; // 技能値が0または25以下の場合スキップ

    // 技能データを保存
    TechniqueResults.push({ key, totalTechnique, raceTechnique, classTechnique });
  });

  // 技能値を降順にソート
  TechniqueResults.sort((a, b) => b.totalTechnique - a.totalTechnique);

  // テーブルの描画
  const TechniquesTableBody = document.querySelector("#TechniquesTable tbody");
  TechniquesTableBody.innerHTML = ""; // テーブルの中身をリセット

  // 最も高い2つの技能に色を設定
  TechniqueResults.forEach((result, index) => {
    let color = "";
    if (index === 0) color = "color: red;"; // 1番目: 赤
    if (index === 1) color = "color: orange;"; // 2番目: オレンジ

    // テーブルの行を生成
    TechniquesTableBody.innerHTML += `
            <tr>
                <td>${result.key}</td>
                <td>${result.raceTechnique}</td>
                <td>${result.classTechnique}</td>
                <td style="${color}"><strong>${result.totalTechnique}</strong></td>
            </tr>
        `;
  });

  console.log("技能計算完了", TechniqueResults);
}

function displaySkills() {
  if (!selectedRace || !selectedClass) return;

  // 入力されたクラスレベルと種族レベルを再取得
  const currentClassLevel = parseInt(classLevelInput.value, 10) || 0; // クラスレベル
  const currentRaceLevel = parseInt(raceLevelInput.value, 10) || 0; // 種族レベル

  // 人族の場合、種族レベルは常に0
  const raceLevelEffective = isHuman ? 0 : currentRaceLevel;

  // 技能データの初期化
  const TechniqueResults = [];

  // 技能項目
  const TechniqueKeys = [
    "隠密",
    "感知",
    "威圧",
    "軽業",
    "技術",
    "早業",
    "看破",
    "騙す",
    "知識",
    "鑑定",
    "装置",
    "変装",
    "制作",
    "精神接続",
    "魔法技術",
    "指揮",
  ];

  // 技能値を計算
  TechniqueKeys.forEach((key) => {
    const raceTechnique = Math.floor(
      ((selectedRace[key] || 0) * (raceLevelEffective + 5)) / 10
    );
    const classTechnique = Math.floor(
      ((selectedClass[key] || 0) * currentClassLevel) / 10
    );
    const totalTechnique = raceTechnique + classTechnique;

    if (totalTechnique === 0 || totalTechnique <= 25) return; // 技能値が0または25以下の場合スキップ

    // 技能データを保存
    TechniqueResults.push({ key, totalTechnique, raceTechnique, classTechnique });
  });

  // 技能値を降順にソート
  TechniqueResults.sort((a, b) => b.totalTechnique - a.totalTechnique);

  // テーブルの描画
  const TechniquesTableBody = document.querySelector("#TechniquesTable tbody");
  TechniquesTableBody.innerHTML = ""; // テーブルの中身をリセット

  // 最も高い2つの技能に色を設定
  TechniqueResults.forEach((result, index) => {
    let color = "";
    if (index === 0) color = "color: red;"; // 1番目: 赤
    if (index === 1) color = "color: orange;"; // 2番目: オレンジ

    // テーブルの行を生成
    TechniquesTableBody.innerHTML += `
            <tr>
                <td>${result.key}</td>
                <td>${result.raceTechnique}</td>
                <td>${result.classTechnique}</td>
                <td style="${color}"><strong>${result.totalTechnique}</strong></td>
            </tr>
        `;
  });

  console.log("技能計算完了", TechniqueResults);
}

// イベントリスナーを追加してレベル調整時にステータスを更新
raceLevelInput.addEventListener("input", adjustLevels);
classLevelInput.addEventListener("input", adjustLevels);

// レベル割り振りの調整
function adjustLevels(event) {
  const target = event.target.id; // どちらの入力が変更されたか判定
  let newRaceLevel = parseInt(raceLevelInput.value, 10) || 0;
  let newClassLevel = parseInt(classLevelInput.value, 10) || 0;

  // 人族の場合は種族レベルを0固定
  if (isHuman) {
    raceLevel = 0;
    raceLevelInput.value = 0;
    classLevel = 10; // クラスレベルを合計10に固定
    classLevelInput.value = classLevel;
  } else {
    // 種族レベルが変更された場合
    if (target === "raceLevel") {
      // 合計10から種族レベルを引いた値をクラスレベルに設定
      if (newRaceLevel >= 0 && newRaceLevel <= 10) {
        classLevel = 10 - newRaceLevel;
        classLevelInput.value = classLevel;
      }
    }

    // クラスレベルが変更された場合
    if (target === "classLevel") {
      // 合計10からクラスレベルを引いた値を種族レベルに設定
      if (newClassLevel >= 0 && newClassLevel <= 10) {
        raceLevel = 10 - newClassLevel;
        raceLevelInput.value = raceLevel;
      }
    }

    // 種族レベルが0以下にならないように修正
    if (raceLevel <= 0) {
      raceLevel = 1;
      raceLevelInput.value = 1;
      classLevel = 9; // 合計を10に保つ
      classLevelInput.value = 9;
    }
  }

  updateIsHuman(); // 人族判定を更新
  calculateAndDisplayStatus(); // ステータス更新
  displayTechniques(); // 技能更新
  displayAbilities(raceLevelInput.value, classLevelInput.value); // スキルを更新
}
// ========================================================

function displayAbilities(raceLevel, classLevel) {
  console.log("displayAbilities  ");
  console.log(selectedRace, selectedClass);

  // Role[0]: 種族のアビリティを取得
  const raceAbilities = getAbilities(selectedRace, raceLevel);

  // Role[1]: クラスのアビリティを取得
  const classAbilities = getAbilities(selectedClass, classLevel);

  // アビリティを統合
  const totalAbilities = [...raceAbilities, ...classAbilities];

  // アビリティテーブルに表示
  const SkillTableBody = document.querySelector("#SkillTable tbody");
  SkillTableBody.innerHTML = ""; // テーブルを初期化

  totalAbilities.forEach((Skill) => {
    SkillTableBody.innerHTML += `
            <tr>
                <td>${Skill.name}</td>
                <td>${Skill.system}</td>
                <td>${Skill.attribute}</td>
                <td>${Skill.description}</td>
            </tr>
        `;
  });

  console.log("取得したアビリティ:", totalAbilities);
}

// 指定されたレベルに基づいてアビリティを取得し、詳細情報を追加
function getAbilities(data, level) {
  const abilities = [];
  console.log("getAbilities:", SkillData);
  // 最大10個のアビリティを取得
  for (let i = 1; i <= 10; i++) {
    const SkillKey = `Skill${i}`;
    const SkillName = data[SkillKey];
    if (!SkillName) break; // アビリティが存在しなければ終了

    // JSONデータから詳細情報を検索
    const detailedSkill = SkillData.find(
      (Skill) => Skill.名前 === SkillName
    );
    if (detailedSkill) {
      abilities.push({
        name: detailedSkill.名前 || "不明",
        system: detailedSkill.系統 || "-",
        attribute: detailedSkill.分類 || "-",
        description: detailedSkill.説明 || detailedSkill.効果概要 || "説明なし",
      });
    }

    // レベル分のアビリティのみ取得
    if (abilities.length >= level) break;
  }

  return abilities;
}

// ========== タブ切り替え ===============================

// タブ切り替えのイベントリスナー
// statsTabButton.addEventListener('click', () => showTab('stats'));
// TechniquesTabButton.addEventListener('click', () => showTab('Techniques'));
// showSkillTabButton.addEventListener('click', () => showTab('Techniques'));

// // タブを切り替える関数
// function showTab(tab) {
//     if (tab === 'stats') {
//         statsTabButton.classList.add('active');
//         TechniquesTabButton.classList.remove('active');
//         statsView.classList.add('active');
//         TechniquesView.classList.remove('active');
//     } else if (tab === 'Techniques') {
//         TechniquesTabButton.classList.add('active');
//         statsTabButton.classList.remove('active');
//         TechniquesView.classList.add('active');
//         statsView.classList.remove('active');
//     }
// }

const statsTabButton = document.getElementById("showStatsTab");
const TechniquesTabButton = document.getElementById("showTechniquesTab");
const showSkillTabButton = document.getElementById("showSkillTab");
const statsView = document.getElementById("statsView");
const TechniquesView = document.getElementById("TechniquesView");
const SkillView = document.getElementById("SkillView");
// const statsTabButton = document.getElementById('showStatsTab');
// const TechniquesTabButton = document.getElementById('showTechniquesTab');
// const showSkillTabButton = document.getElementById('showSkillTab');
// const statsView = document.getElementById('statsView');
// const TechniquesView = document.getElementById('TechniquesView');

// タブ切り替えのイベントリスナー
statsTabButton.addEventListener("click", () => showTab("stats"));
TechniquesTabButton.addEventListener("click", () => showTab("Techniques"));
showSkillTabButton.addEventListener("click", () => showTab("Skill"));

// タブを切り替える関数
function showTab(tab) {
  // すべてのタブボタンの「active」を削除
  statsTabButton.classList.remove("active");
  TechniquesTabButton.classList.remove("active");
  showSkillTabButton.classList.remove("active");

  // すべてのビューの「active」を削除
  statsView.classList.remove("active");
  TechniquesView.classList.remove("active");
  SkillView.classList.remove("active");

  // 選択されたタブとビューに「active」を追加
  if (tab === "stats") {
    statsTabButton.classList.add("active");
    statsView.classList.add("active");
  } else if (tab === "Techniques") {
    TechniquesTabButton.classList.add("active");
    TechniquesView.classList.add("active");
  } else if (tab === "Skill") {
    // 修正箇所
    showSkillTabButton.classList.add("active");
    SkillView.classList.add("active");
  }
}

// 初期状態: ステータスを表示
showTab("stats");

// ========== データ計算 ======================================================================

// ステータス計算と取得スキルを返す
function calculateStats(entity, level) {
  console.log(
    " ステータス計算と取得スキルを返す :",
    entity,
    level,
    entity[`Skill1`]
  );
  const stats = {};

  statKeys.forEach((key) => {
    stats[key] = Math.floor(((entity[key] || 0) * level) / 10); // ボーナス付きのステータス計算
    // console.log(" statKeys.forEac :", key , stats[key])
  });

  // abilitiesを配列として初期化
  let abilities = [];

  // レベルに基づいてアビリティを取得
  for (let i = 1; i <= level; i++) {
    const SkillKey = `Skill${i}`; // テンプレートリテラルの正しい使用
    if (entity[SkillKey]) {
      // entityの該当プロパティが存在するかチェック
      abilities.push(entity[SkillKey]); // abilitiesに追加
    }
  }

  // 耐性を入れる
  resistanceKeys.forEach((key) => {
    stats[key] = entity[key] || 0; // 耐性値がない場合はデフォルトで0
  });

  // 肉体値を入れる
  bodyKeys.forEach((key) => {
    stats[key] = entity[key] || 0; // レベル依存の計算を追加
  });

  console.log("Final stats:", stats);
  console.log("Final abilities:", abilities);

  return [stats, abilities];
}

//金額分け
function getInitialMoneyByRace(raceCategory) {
  const initialMoneyMapping = {
    人族: 1500, // 人族の初期金額
    亜人: 1200, // 亜人の初期金額
    魔族: 900, // 魔族の初期金額
  };

  // マッピングに応じた初期金額を返す（該当がない場合は 0）
  return initialMoneyMapping[raceCategory] || 0;
}

// データを設定する関数
function setCharacterRole(selectedRace, selectedClass, raceLevel, classLevel) {
  try {
    console.log("初期テンプレート (characterData):", characterData);

    // プレイヤーデータをリセット
    const playerData = JSON.parse(JSON.stringify(characterData));
    console.log("リセット後のプレイヤーデータ (playerData):", playerData);

    // プレイヤーキャラクターの初期設定
    const playerName = nameInput.value.trim();
    // キャラクター名（入力された名前を使用）
    playerData.name = playerName;

    playerData.party = [
      {
        name: playerName, // プレイヤー名
        race: selectedRace["名前"], // 種族名
        Role: [
          { roleName: selectedRace["名前"], Lv: raceLevel, Ef: 0 }, // 種族データ
          { roleName: selectedClass["名前"], Lv: classLevel, Ef: 0 }, // クラスデータ
        ],
        stats: {
          allLv: raceLevel + classLevel,
          allEf: 0,
          // baseStats: calculateStats(selectedRace, raceLevel), // 種族のステータス
          // currentStats: calculateStats(selectedClass, classLevel), // クラスのステータス
          // weaknesses: selectedRace["弱点"] || [], // 種族特有の弱点
        },
        equipmentSlot: {}, // 初期装備スロット（空）
        inventory: [], // 初期所持アイテム（空）
        position: { type: "前衛", slot: 1 }, // 配置
        isPlayer: true, // プレイヤーキャラクターであることを示す
      },
    ];

    // 初期所持金を設定
    playerData.money = getInitialMoneyByRace(selectedRace["分類"]);

    // 名前と種族をログに出力
    console.log(" キャラクター種族 :", playerData);

    return playerData; // 更新されたプレイヤーデータを返す
  } catch (error) {
    console.error(
      "キャラクターの種族とクラスを設定する際にエラーが発生しました:",
      error
    );
  }
}

// モーダルを開くとき
document.body.classList.add("modal-open");

// モーダルを閉じるとき
document.body.classList.remove("modal-open");

// モーダルとボタンの要素を取得
const createCharacter = document.getElementById("createCharacter");
const closeModalButton = document.getElementById("confirmLevels2");
const modalLevelAndStatus = document.getElementById("modal-levelAndStatus");

// 決定ボタンをクリックしたらモーダルを表示
createCharacterButton.addEventListener("click", () => {
  modalLevelAndStatus.style.display = "flex"; // モーダルを表示
});

// 閉じるボタンをクリックしたらモーダルを非表示
closeModalButton.addEventListener("click", () => {
  modalLevelAndStatus.style.display = "none"; // モーダルを非表示
});

// モーダルの外側をクリックした場合にも閉じる
modalLevelAndStatus.addEventListener("click", (event) => {
  if (event.target === modalLevelAndStatus) {
    modalLevelAndStatus.style.display = "none"; // モーダルを非表示
  }
});

//位置変え
function reorderCharacterData(data) {
  // 新しいオブジェクトを作成し、nameを最初に追加
  const reorderedData = {
    name: data.name, // nameを最上位に配置
    ...data, // 残りのプロパティを追加
  };

  return reorderedData;
}
// =========送信データ作成=================================================================
// 決定した種族とクラスを characterData に追加
//　絶賛バグり中
function updateCharacterData() {
  if (!selectedRace || !selectedClass) {
    console.error("種族またはクラスが未選択です");
    return;
  }
  const currentRaceLevel = parseInt(raceLevelInput.value, 10) || 0;
  const currentClassLevel = parseInt(classLevelInput.value, 10) || 0;

  // raceLevel = currentRaceLevel;
  // classLevel = currentClassLevel;

  console.log(" classLevelInput : ", currentRaceLevel, currentClassLevel);
  console.log(" classLevel : ", raceLevel, classLevel);

  playerData = setCharacterRole(
    selectedRace,
    selectedClass,
    raceLevel,
    classLevel
  );

  console.log("キャラクターデータが更新されました:", playerData);
}

// 個々を変更  createCharacterButton
// 「レベルを決定」ボタンのイベントリスナー
confirmLevelsButton.addEventListener("click", async () => {
  // レベルの合計が10以内であることを確認
  const currentRaceLevel = parseInt(raceLevelInput.value, 10) || 0;
  const currentClassLevel = parseInt(classLevelInput.value, 10) || 0;

  if (currentRaceLevel + currentClassLevel > 10) {
    document.getElementById("message").textContent =
      "レベルの合計は10以内である必要があります";
    return;
  }

  console.log(
    " レベルの合計は10以内である必要があります : ",
    raceLevelInput,
    classLevelInput
  );

  // レベルが確定された場合の処理
  raceLevel = currentRaceLevel;
  classLevel = currentClassLevel;

  // メッセージをクリア
  document.getElementById("message").textContent = "";

  // キャラクター作成ボタンを有効化
  createCharacterButton.disabled = false;
  console.log("レベルが確定されました:", { raceLevel, classLevel });

  // レベル割り振り画面を隠す
  // levelAllocation.style.display = 'none';

  // ステータスを再計算
  // calculateAndDisplayStatus();
  // displayTechniques();

  // 確認ダイアログを表示
  const confirmation = confirm(
    `以下のキャラクターを作成しますか？\n\n名前: ${nameInput.value.trim()}\n種族: ${
      selectedRace["名前"]
    }\nクラス: ${selectedClass["名前"]}`
  );
  if (!confirmation) {
    console.log("キャラクター作成がキャンセルされました");
    return;
  }
  console.log(" playerData : ", playerData);
  await updateCharacterData();

  playerData = reorderCharacterData(playerData)

  try {
    // サーバーに playerData を送信
    const response = await fetch("/api/characters", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(playerData), // playerData を送信
    });

    const result = await response.json();

    if (response.ok) {
      document.getElementById(
        "message"
      ).textContent = `キャラクター「${result.name}」を作成しました！`;
      console.log("キャラクター作成成功:", result);

      // キャラクター選択画面にリダイレクト
      setTimeout(() => {
        window.location.href = "/character-select.html";
      }, 2000);
    } else {
      document.getElementById(
        "message"
      ).textContent = `エラー: ${result.error}`;
      console.error("キャラクター作成エラー:", result.error);
    }
  } catch (error) {
    document.getElementById("message").textContent =
      "キャラクター作成に失敗しました";
    console.error("キャラクター作成に失敗:", error);
  }
});

// スキル取得
async function loadTechniques() {
  try {
    const response = await fetch("/api/excel/Techniques");
    if (!response.ok) {
      throw new Error("Failed to fetch Technique data");
    }

    const Techniques = await response.json();
    SkillData = Techniques;
    console.log("取得したスキルデータ SkillData :", SkillData);
  } catch (error) {
    console.error("スキルデータの取得中にエラーが発生:", error);
  }
}

//
