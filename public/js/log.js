let logQueue = []; // 表示待ちのメッセージキュー
let isDisplaying = false; // 現在メッセージを表示中かどうか
let skipMode = false; // スキップモードかどうか
const maxLines = 4; // 戦闘ログの最大表示行数

// ログを追加する関数（自動分割対応）
function addBattleLog(message, displaySpeed = 50, animationType = "fade-in", soundFile = null, reset = false) {
  const logMessages = document.getElementById("log-messages");

  if (reset) {
    // リセット専用メッセージをキューに追加
    console.log("リセットコマンドを受け取りました。");
    logQueue.push({ message: "__RESET__", displaySpeed, animationType: "", soundFile: null });
    if (!isDisplaying) {
      displayNextLog();
    }
    return;
  }

  // メッセージを分割してキューに追加
  const splitMessages = splitMessageByWidth(message, logMessages);
  splitMessages.forEach((msg) => {
    logQueue.push({ message: msg, displaySpeed, animationType, soundFile });
  });

  console.log("メッセージをキューに追加:", message);
  console.log("現在のキュー:", logQueue);

  if (!isDisplaying) {
    displayNextLog();
  }
}



// メッセージを横幅に基づいて分割
function splitMessageByWidth(message, container) {
  const tempElement = document.createElement("span"); // 一時的な要素で幅を計測
  tempElement.style.visibility = "hidden";
  tempElement.style.whiteSpace = "nowrap"; // 強制的に1行表示
  container.appendChild(tempElement);

  const maxWidth = container.clientWidth; // コンテナの幅を取得
  let currentLine = "";
  const lines = [];

  for (const char of message) {
    tempElement.textContent = currentLine + char;
    if (tempElement.offsetWidth > maxWidth) {
      // 幅を超えた場合、現在の行を保存して次の行に移る
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine += char;
    }
  }

  // 最後の行を追加
  if (currentLine) lines.push(currentLine);

  container.removeChild(tempElement); // 一時要素を削除
  return lines;
}

// 次のメッセージを表示する関数
async function displayNextLog() {
  if (logQueue.length === 0) {
    console.log("ログキューが空です。終了します。");
    return; // キューが空の場合は終了
  }

  const logMessages = document.getElementById("log-messages");
  const { message, displaySpeed, animationType, soundFile } = logQueue.shift();

  console.log("現在のメッセージ:", message);

  // リセット専用メッセージの処理
  if (message === "__RESET__") {
    console.log("リセット専用メッセージを処理します。");

    // 現在の表示内容を削除
    while (logMessages.firstChild) {
      console.log("削除中の要素:", logMessages.firstChild);
      logMessages.removeChild(logMessages.firstChild);
    }

    // 表示フラグとスキップモードをリセット
    isDisplaying = false;
    skipMode = false;

    console.log("リセット処理が完了しました。");
    if (logQueue.length > 0) {
      displayNextLog(); // リセット後に次のメッセージを処理
    }
    return;
  }

  isDisplaying = true; // 表示中フラグを立てる
  console.log("メッセージを表示中:", message);

  // サウンド再生
  if (soundFile) {
    console.log("サウンドを再生:", soundFile);
    playSound(soundFile);
  }

  // 新しいメッセージを作成
  const newMessage = document.createElement("p");
  logMessages.appendChild(newMessage);

  // アニメーションタイプによる分岐
  if (!animationType || animationType === "") {
    console.log("1文字ずつ表示処理を開始します。");
    await typeMessage(newMessage, message, displaySpeed);
  } else {
    console.log("アニメーションを適用:", animationType);
    newMessage.textContent = message;
    newMessage.classList.add("message", animationType);
    await new Promise((resolve) => setTimeout(resolve, displaySpeed)); // アニメーション時間を考慮
  }

  // 行数が最大を超えたら最上段を削除
  if (logMessages.childNodes.length > maxLines) {
    console.log("最大行数を超えたため、最上段を削除します。");
    logMessages.removeChild(logMessages.firstChild);
  }

  // 次の行を自動表示（長文対応）
  if (logQueue.length > 0 && isLongMessage(message)) {
    console.log("長文が検出されました。次の行を自動的に表示します。");
    setTimeout(() => {
      if (!skipMode) displayNextLog();
    }, displaySpeed * 0); // 自動で次の行を表示
  } else {
    console.log("次のメッセージは存在しません。または短文です。");
    isDisplaying = false;
  }

  isDisplaying = false; // 表示完了
  console.log("メッセージの表示が完了しました:", message);
}


function isLongMessage(message) {
  return message.length > 20; // メッセージの長さで長文を判定
}

// サウンド再生の関数
function playSound(soundFile) {
  try {
    if (soundFile && soundFile.trim() !== "") {
      // 保存先のパスを構築
      const soundPath = `/sound/${soundFile}`;
      console.log(`サウンドファイルのパス: ${soundPath}`);

      // サウンドを再生
      const audio = new Audio(soundPath);
      audio.play().catch((error) => {
        console.warn(`サウンドファイル '${soundPath}' を再生できません:`, error);
      });
    } else {
      console.warn("有効なサウンドファイルが指定されていません。");
    }
  } catch (error) {
    console.error("サウンド再生中にエラーが発生しました:", error);
  }
}




// 1文字ずつ表示する関数
async function typeMessage(container, message, speed) {
  for (let i = 0; i < message.length; i++) {
    if (skipMode) {
      // スキップモードなら全メッセージを即時表示
      container.textContent = message;
      return;
    }
    container.textContent += message[i];
    await new Promise((resolve) => setTimeout(resolve, speed));
  }
}


// クリック時の処理
document.getElementById("battle-log-container").addEventListener("click", () => {
  if (isDisplaying) {
    // 表示中の場合はスキップモードを有効化
    skipMode = true;
  } else {
    // 次の文を表示
    skipMode = false;
    displayNextLog();
  }
});

// 表示
function showBattleLog() {
  const battleLogContainer = document.getElementById("battle-log-container");
  if (battleLogContainer) {
    battleLogContainer.style.display = "block"; // 表示に切り替える
  }
}

function hideBattleLog() {
  const battleLogContainer = document.getElementById("battle-log-container");
  if (battleLogContainer) {
    battleLogContainer.style.display = "none"; // 非表示に設定
  }
}


