// === メッセージ ===================================================================================

let storyLog = []; // ストーリーのログを保存する配列
const maxLogSize = 50; // 保存するログの最大件数

let currentTextIndex = -1; // 初期状態では非表示
let isTextVisible = false; // 現在、文章が表示されているかどうか

// === メッセージ ===================================================================================

// グローバルなキュー管理
let storyQueue = [];
let isProcessing = false;

// フッターのボタンを無効化／有効化する関数
function toggleActionButtons(disable) {
  const actionButtons = document.querySelectorAll("#action-button button");
  actionButtons.forEach((button) => {
    button.disabled = disable; // ボタンの有効／無効を切り替え
    if (disable) {
      button.classList.add("disabled"); // スタイルを変更（CSSで対応）
    } else {
      button.classList.remove("disabled");
    }
  });
}

function stSkilltory(texts, options = {}) {
  // キューに追加
  storyQueue.push({ texts, options });

  // 現在処理中でない場合、処理を開始
  if (!isProcessing) {
    processQueue();
  }
}

async function processQueue() {
  if (storyQueue.length === 0) {
    isProcessing = false; // キューが空なら処理を終了
    return;
  }

  isProcessing = true;

  // ボタンを無効化
  toggleActionButtons(true);

  const { texts, options } = storyQueue.shift(); // キューから1件取り出す

  const storyText = document.getElementById("story-text");
  const speed = options.speed || 50;

  // texts 配列の各テキストを順番に処理
  for (let text of texts) {
    if (typeof text !== "string") {
      console.error(
        "processQueue: texts内の要素が文字列ではありません。",
        text
      );
      continue; // 不正な要素はスキップ
    }
    await displayTextOnClick(storyText, text, speed); // 各テキストを個別に処理
  }

  // 処理が終了したらボタンを有効化
  toggleActionButtons(false);

  isProcessing = false;
}

// テキストを1文字ずつ表示し、クリックで次に進む関数
function displayTextOnClick(element, text, speed) {
  return new Promise((resolve) => {
    // textがnullやundefinedの場合のデフォルト処理
    if (typeof text !== "string") {
      console.error("displayTextOnClick: 引数textが無効です。", text);
      text = ""; // 空文字列に設定
    }

    let index = 0;
    element.innerHTML = ""; // テキストをリセット
    element.style.cursor = "pointer"; // テキストにカーソルを表示

    // キャラクター名が含まれている場合、名前を取り出す
    const charNameMatch = text.match(/^【(.+?)】/); // 例: 【キャラクター名】本文
    let charName = null;
    if (charNameMatch) {
      charName = charNameMatch[1]; // キャラクター名を抽出
      text = text.replace(/^【.+?】/, ""); // 名前部分を削除して本文のみ表示
    }

    // キャラクター名がある場合、名前を別要素で表示
    if (charName) {
      const charNameElement = document.getElementById("character-name");
      charNameElement.textContent = charName; // キャラクター名を設定
      charNameElement.style.display = "block"; // 表示
    }

    function typeNextChar() {
      if (index < text.length) {
        element.innerHTML += text[index];
        index++;
        setTimeout(typeNextChar, speed);
      } else {
        // タイピング終了後にクリックを待機
        element.addEventListener("click", onClick);
      }
    }

    function onClick() {
      element.removeEventListener("click", onClick); // クリックイベントを解除
      if (charName) {
        const charNameElement = document.getElementById("character-name");
        charNameElement.style.display = "none"; // キャラクター名を非表示に戻す
      }
      resolve(); // 次へ進む
    }

    typeNextChar();
    addToLog(text)
  });
}

// stSkilltory(texts, { speed: 75 }); // テキスト速度75msで開始

// ログを表示する関数
function showLog() {
  // playerData.stats.baseStats["HP"] += 5;
  // console.log("showLog:", playerData.stats.baseStats["HP"])
  const overlay = document.getElementById("overlay");
  const logContainer = document.getElementById("log-container");

  // オーバーレイとログ画面を表示
  overlay.style.display = "block";
  logContainer.style.display = "block";

  // ログ内容をクリアして再生成
  logContainer.innerHTML = '<button id="close-log">✕</button>';
  storyLog.forEach((logEntry, index) => {
    const logItem = document.createElement("p");
    logItem.textContent = `${index + 1}: ${logEntry}`; // 番号付きで表示
    logContainer.appendChild(logItem);
  });

  // ログを閉じるボタンの動作
  document.getElementById("close-log").onclick = closeLog;
}

function closeLog() {
  const overlay = document.getElementById("overlay");
  const logContainer = document.getElementById("log-container");

  // オーバーレイとログ画面を非表示
  overlay.style.display = "none";
  logContainer.style.display = "none";
}

// ストーリーをログに追加する関数
function addToLog(text) {
  storyLog.push(text);

  // ログの最大件数を超えた場合、古いものを削除
  if (storyLog.length > maxLogSize) {
    storyLog.shift();
  }
}


// === 場所移動 ===================================================================================
// 場所移動の処理
async function moveToLocation(locationKey) {
  // 移動先を取得
  const location = locations[locationKey];
  if (!location) {
    console.error("無効な場所キー:", locationKey);
    return;
  }

  // ギルド移動の場合は特別処理
  if (locationKey === "guild") {
    showGuild();
    return;
  }

  // 条件を確認 (例: レベル、アイテム)
  if (!canMoveTo(locationKey)) {
    console.log("移動条件を満たしていません:", locationKey);
    return;
  }

  const transitionText = document.getElementById("transition-text");

  // 移動中の演出テキストを表示
  transitionText.textContent = `${location.name}へ移動中…`;

  // 到着時の演出テキスト
  // transitionText.textContent = "目的地に到着しました！";
  //   await new Promise((resolve) => setTimeout(resolve, 1500));

  // 実際の場所更新
  playerData.location = locationKey;
  updateStoryArea(location.image || "default.png", location.story);
  document.getElementById("location-display").textContent = playerData.location;

  // アクションボタンを更新
  await updateActionButtons(location.actions);

  // モーダルを閉じる (移動モーダルが開いている場合)
  // closeModal("move-modal");
  closeUniversalModal()
}

// ストーリーエリアを更新する関数
function updateStoryArea(image, story) {
  const storyArea = document.getElementById("story-area");
  storyArea.style.backgroundImage = `url('/images/locations/${image}')`;

  // ストーリーテキストは `stSkilltory()` で表示するためここでは処理しない
}

// 場所に移動できるかどうかを確認す
function canMoveTo(locationKey) {
  const location = locations[locationKey];
  if (!location) {
    console.error("指定された場所が存在しません:", locationKey);
    return false;
  }

  const requirements = location.requirements || {};

  // レベル条件を確認
  if (requirements.level && playerData.level < requirements.level) {
    alert(`この場所に移動するにはレベル${requirements.level}が必要です。`);
    return false;
  }

  // 必要なアイテムを確認
  if (requirements.items) {
    const hasAllItems = requirements.items.every((itemName) =>
      playerData.inventory.some((item) => item.名前 === itemName)
    );
    if (!hasAllItems) {
      alert(
        `この場所に移動するには以下のアイテムが必要です: ${requirements.items.join(
          ", "
        )}`
      );
      return false;
    }
  }

  // 必要なクエストの完了状況を確認
  if (requirements.completedQuests) {
    const hasCompletedAllQuests = requirements.completedQuests.every(
      (questId) =>
        questData.some(
          (quest) => quest.id === questId && quest.status === "完了"
        )
    );
    if (!hasCompletedAllQuests) {
      alert("この場所に移動するには特定のクエストを完了する必要があります。");
      return false;
    }
  }

  return true; // 条件をすべて満たしていれば移動可能
}

// 画像と文章を設定
function updateStoryArea(image, story) {
  const storyArea = document.getElementById("story-area");
  const storyText = document.getElementById("story-text");

  storyArea.style.backgroundImage = `url('/images/locations/${image}')`;
  // storyText.textContent = story || '特に目立つものはない。';
}
