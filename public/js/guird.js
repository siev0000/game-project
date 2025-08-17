let questData = [];

let filteredQuests = [];
let currentQuestIndex = 0;
const guildContent = document.getElementById("guild-content");
const rankSelection = document.getElementById("quest-rank-selection");
const rankButtons = document.getElementById("rank-buttons");
const questDetails = document.getElementById("quest-details");
const maxQuestsByRank = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
};

// ギルド画面の切り替え
async function showGuild() {
  // メイン画面を非表示
  document.getElementById("story-area").style.display = "none";
  document.getElementById("action-button").style.display = "none";

  // ギルド画面を表示
  document.getElementById("guild-area").style.display = "block";

  // ギルドの初期メッセージをセット
  //   const guildContent = document.getElementById("guild-content");
  //   guildContent.innerHTML = "<p>ギルドで何をしますか？</p>";
  const guildName = "ギルド"; // 対象ギルド名
  questData = await questListGet(guildName);

  console.log("questData :", questData);
  //   console.log("questData :", questData)
  //   console.log("questData :", questData)

  if (questData) {
    console.log("取得したクエスト:", questData);
  } else {
    console.log("クエストデータを取得できませんでした。");
  }
}

function showGuildInfo() {
  questDetails.style.display = "none";
  rankSelection.style.display = "none";
  guildContent.style.display = "block";
  // デフォルト値を設定してエラーを防ぐ
  const ongoingQuests = playerData.questProgress?.ongoing || [];

  guildContent.innerHTML = `
      <h3>ギルド情報</h3>
      <p>ギルドランク: ${playerData.guild?.rank || 1}</p>
      <p>貢献度: ${playerData.guild?.contributionPoints || 0}</p>
      <p>名声: ${playerData.guild?.fame || 0}</p>
      <p>受注中のクエスト数: ${ongoingQuests.length}</p>
    `;
}

// クエスト一覧を表示 (ランク選択画面)
function showGuildQuests() {
  if (!guildContent || !rankSelection || !rankButtons || !questDetails) {
    console.error("必要なHTML要素が見つかりません。");
    return;
  }

  // ギルド情報を非表示
  guildContent.style.display = "none";

  // 一度クエスト内容を非表示
  questDetails.classList.add("hidden");
  questDetails.style.display = "none";

  // ランク選択画面を表示
  rankSelection.classList.remove("hidden");
  rankSelection.style.display = "block";

  // ランクボタンを生成
  const ranks = [...new Set(questData.map((quest) => quest.conditions.rank))]; // 重複を排除したランクリスト
  console.log(" ranks :", ranks);
  rankButtons.innerHTML = ranks
    .map(
      (rank) =>
        `<button onclick="filterQuestsByRank(${rank})">ランク ${rank}</button>`
    )
    .join("");
}

// ランク内クエストをフィルタリング
function filterQuestsByRank(rank) {
  console.log("選択されたランク:", rank);

  // 指定されたランクのクエストをフィルタリング
  filteredQuests = questData.filter((quest) => {
    // 条件チェック
    const meetsRank = quest.conditions.rank === rank; // ランクが完全一致
    const meetsPrerequisite =
      !quest.prerequisite || // 前提条件がない場合
      playerData.questProgress.completed.includes(quest.prerequisite); // 前提クエストが完了している場合
    const meetsStats = checkPartyStats(quest.conditions.status); // 能力値条件を満たす場合

    // 条件をすべて満たす場合のみ表示
    return meetsRank && meetsPrerequisite && meetsStats;
  });

  console.log("フィルタリングされたクエスト:", filteredQuests);

  // フィルタリング結果が空の場合
  if (filteredQuests.length === 0) {
    alert("該当するクエストがありません。条件を見直してください。");
    return;
  }

  // ランク選択画面を非表示
  rankSelection.classList.add("hidden");
  rankSelection.style.display = "none";

  // クエスト詳細画面を表示
  questDetails.classList.remove("hidden");
  questDetails.style.display = "block";

  console.log("calculateOngoingQuestRank() :", calculateOngoingQuestRank());

  // 最初のクエストを表示
  currentQuestIndex = 0;
  showQuestDetails();
  updateQuestProgress();
}

// プレイヤーの能力値を条件と比較
function checkPartyStats(requiredStats) {
  // 条件が設定されていない場合はスキップ
  if (!requiredStats || Object.keys(requiredStats).length === 0) {
    console.log(
      "条件となるステータスが設定されていません。チェックをスキップします。"
    );
    return true; // 条件がない場合は常にOK
  }

  // パーティが存在しない場合、チェック不可
  if (!playerData.party || playerData.party.length === 0) {
    console.log("パーティが存在しません。");
    return false; // パーティが存在しない場合はチェック失敗
  }

  // 一人でも条件を満たしているかチェック
  const someoneMeetsCondition = playerData.party.some((member) => {
    return Object.keys(requiredStats).every((statKey) => {
      const playerStat = member.stats?.baseStats?.[statKey] || 0; // メンバーのステータス値
      const requiredValue = requiredStats[statKey]; // 必要な値
      const result = playerStat >= requiredValue;

      console.log(
        `メンバー: ${member.name}, チェック: ${statKey} (必要: ${requiredValue}, プレイヤー: ${playerStat}) => ${
          result ? "条件を満たす" : "条件を満たさない"
        }`
      );

      return result;
    });
  });

  return someoneMeetsCondition;
}


// ギルド情報を表示
function returnToMain() {
  // ギルド画面を非表示
  document.getElementById("guild-area").style.display = "none";

  // メイン画面を再表示
  document.getElementById("story-area").style.display = "block";
  document.getElementById("action-button").style.display = "flex";
}

// ランクに応じた色と記号の設定
const rankStyles = {
  7: { name: "赤鉄", color: "darkred", symbol: "❖", outline: "white" }, // 特別な輝き
  6: { name: "青鉄", color: "blue", symbol: "❖", outline: "white" }, // 視認性を高める白枠
  5: { name: "銀鉄", color: "#82ffe6", symbol: "★", outline: "white" }, // ミスリルブルー
  4: { name: "白金", color: "#c8f7ff", symbol: "✪", outline: "yellow" }, // シャンパンゴールド
  3: { name: "金", color: "gold", symbol: "✷", outline: "black" }, // 金色
  2: { name: "銀", color: "#C0C0C0", symbol: "✦", outline: "black" }, // メタリックシルバー
  1: { name: "銅", color: "#c87209", symbol: "✧", outline: "black" }, // 小さな星
};

// クエスト詳細を表示する関数
function showQuestDetails() {
  const quest = filteredQuests[currentQuestIndex];

  if (!quest) {
    console.error("現在のクエストデータが見つかりません。");
    return;
  }

  console.log("表示するクエスト:", quest, quest.conditions.rank);

  // クエストが進行中かどうかを判定
  const isOngoing = (playerData.questProgress?.ongoing || []).some(
    (ongoingQuest) => ongoingQuest.id === quest.questId
  );

  console.log(`クエスト ${quest.questId} は進行中: ${isOngoing}`);

  // クエスト情報の表示
  const questTitleElement = document.getElementById("quest-title");
  document.getElementById("quest-description").style.textAlign = "left";
  document.getElementById("quest-rewards").style.textAlign = "left";
  document.getElementById("quest-npc").style.textAlign = "left";
  document.getElementById("quest-location").style.textAlign = "left";

  // クエスト名
  const questName = quest.questName || "クエスト名不明";

  // ランク
  const rank = quest.conditions.rank || 0;
  const rankInfo = rankStyles[rank] || {
    name: "不明",
    color: "darkorange",
    symbol: "?",
  };

  // HTMLにランクマークとクエスト名を設定
  questTitleElement.innerHTML = `
      <span style="color: ${rankInfo.color}; font-weight: bold; font-size: 1.2em
      -webkit-text-stroke: 1px ${rankInfo.outline};
      text-shadow: 0px 0px 3px ${rankInfo.outline};
      ">
        ${rankInfo.symbol}
      </span>
      <span>${questName} </span>`;

  // 進行中なら「受注中」を小さく表示
  if (isOngoing) {
    questTitleElement.innerHTML += `
        <span style="font-size: 0.6em; color: #f0e6d2; margin-left: 0.3vw;">
          (受注中)
        </span>`;
  }

  // "quest.targets" のデータをフォーマット
  const formattedTargets =
    quest.targets && quest.targets.length > 0
      ? quest.targets
          .map((target) => `${target.name}×${target.count}`)
          .join(", ")
      : "対象不明";

  // その他のクエスト情報を表示（省略可能）
  document.getElementById("quest-description").textContent = `${
    quest.type || "不明"
  }: ${quest.description || "クエスト内容不明"}`;

  // 報酬を改行対応して表示（innerHTMLを使用）
  document.getElementById("quest-rewards").innerHTML = `<span>💰</span> 報酬: ${
    quest.rewards ? quest.rewards.join(", ") : "なし"
  }<br><span>⭐</span> 経験値: ${quest.exp || 0}`;

  document.getElementById("quest-npc").textContent = `依頼人: ${
    quest.relatedNpc || "不明"
  }`;

  // 場所と対象を改行対応して表示（innerHTMLを使用）
  document.getElementById("quest-location").innerHTML = `場所: ${
    quest.location || "場所不明"
  }<br>対象: ${formattedTargets}`;

  // 条件チェック
  const { meetsRank, meetsStatus, meetsSkill, meetsQuest, allMet } =
    checkConditions(quest.conditions);

  // 条件メッセージ
  const conditionMessage = [];
  if (!meetsRank) {
    conditionMessage.push("ランクが不足しています。");
  }
  if (!meetsStatus) {
    conditionMessage.push("能力値が不足しています。");
  }
  if (!meetsSkill) {
    conditionMessage.push("必要なアビリティを持っていません。");
  }
  if (!meetsQuest) {
    conditionMessage.push("前提クエストが完了していません。");
  }

  // 条件メッセージを表示
  const conditionMessageElement = document.getElementById(
    "quest-condition-message"
  );
  conditionMessageElement.textContent = conditionMessage.join(" ");
  conditionMessageElement.style.color =
    conditionMessage.length > 0 ? "red" : "green";

  // 受注ボタンの有効/無効を設定
  const acceptButton = document.getElementById("accept-quest");
  acceptButton.disabled = !allMet;
}

// クエスト条件チェック関数 (party に対応)
function checkConditions(conditions) {
  const { Skill, quest, rank, status } = conditions;

  playerData.guild.rank = 7
  // ランク条件の判定 (一人でもランクを満たしていればOK)
  const meetsRank =
    rank === undefined ||
    playerData.guild?.rank

  // ステータス条件の判定 (例: status: { attack: 150, defense: 100 } 一人でも満たせばOK)
  const meetsStatus =
    !status ||
    playerData.party.some((member) =>
      Object.keys(status).every((statKey) => {
        const playerStat = member.stats?.baseStats?.[statKey] || 0; // メンバーのステータス
        const requiredStat = status[statKey]; // 必要なステータス値
        console.log(
          `メンバー: ${member.name}, ステータス判定: ${statKey} (必要: ${requiredStat}, プレイヤー: ${playerStat})`
        );
        return playerStat >= requiredStat;
      })
    );

  // アビリティ条件の判定 (例: Skill: ["剣術", "魔法知識"] 一人でも満たせばOK)
  const meetsSkill =
    !Skill ||
    playerData.party.some((member) =>
      Skill.every((requiredSkill) => {
        const hasSkill = member.abilities?.some(
          (playerSkill) => playerSkill.name === requiredSkill
        );
        console.log(
          `メンバー: ${member.name}, アビリティ判定: ${requiredSkill} => ${
            hasSkill ? "所持" : "未所持"
          }`
        );
        return hasSkill;
      })
    );

  // クエスト条件の判定 (例: quest: ["quest001", "quest002"] 一人でも満たせばOK)
  const meetsQuest =
    !quest ||
    playerData.party.some((member) =>
      quest.every((requiredQuest) => {
        const isCompleted =
          member.questProgress?.completed?.includes(requiredQuest) || false;
        console.log(
          `メンバー: ${member.name}, クエスト判定: ${requiredQuest} => ${
            isCompleted ? "達成済み" : "未達成"
          }`
        );
        return isCompleted;
      })
    );

  // 全条件の結果を返す
  return {
    meetsRank,
    meetsStatus,
    meetsSkill,
    meetsQuest,
    allMet: meetsRank && meetsStatus && meetsSkill && meetsQuest,
  };
}



// クエストを次へ
function showNextQuest() {
  if (!filteredQuests || filteredQuests.length === 0) {
    console.error("No quests available.");
    return;
  }

  // インデックスを更新
  const previousIndex = currentQuestIndex;
  currentQuestIndex = (currentQuestIndex + 1) % filteredQuests.length;

  console.log(
    `Next Quest: Previous Index = ${previousIndex}, New Index = ${currentQuestIndex}, Total Quests = ${filteredQuests.length}`
  );

  // クエスト詳細を表示
  showQuestDetails();

  // 進捗を更新
  updateQuestProgress();
}

// クエストを前へ
function showPreviousQuest() {
  if (!filteredQuests || filteredQuests.length === 0) {
    console.error("No quests available.");
    return;
  }

  // インデックスを更新
  currentQuestIndex =
    (currentQuestIndex - 1 + filteredQuests.length) % filteredQuests.length;

  console.log(
    `Previous Quest Index: ${currentQuestIndex}, Total Quests: ${filteredQuests.length}`
  );

  // クエスト詳細を表示
  showQuestDetails();

  // 進捗を更新
  updateQuestProgress();
}

// 進捗を更新
function updateQuestProgress() {
  const progressElement = document.getElementById("quest-progress");
  if (progressElement) {
    const current = currentQuestIndex + 1; // 現在のクエスト番号 (0ベースなので +1)
    const total = filteredQuests.length; // 総クエスト数
    progressElement.textContent = `${current}/${total}`;
    console.log(`Updated Quest Progress: ${current}/${total}`);
  } else {
    console.warn("Quest progress element not found.");
  }
}

// クエスト受注処理
function acceptQuestFromDetails() {
  const quest = filteredQuests[currentQuestIndex];

  if (!quest) {
    console.error("クエストデータが見つかりません。");
    alert("クエストデータが見つかりません。");
    return;
  }

  console.log("クエスト受注処理:", quest);

  // questProgressの初期化を保証
  if (
    !playerData.questProgress ||
    typeof playerData.questProgress !== "object"
  ) {
    playerData.questProgress = { ongoing: [], completed: [] };
  }

  // `ongoing`が配列であることを保証
  if (!Array.isArray(playerData.questProgress.ongoing)) {
    console.warn("ongoingが配列ではありません。修正します。");
    playerData.questProgress.ongoing = [];
  }

  // 現在のランク合計を計算
  const currentRankSum = calculateOngoingQuestRank();
  // プレイヤーのランクに基づく最大ランク合計を取得
  const maxRankSum = maxQuestsByRank[playerData.guild.rank] || 1;

  // ランク合計が上限を超える場合の処理
  const questRank = quest.conditions.rank; // 新しいクエストのランク (+1 を適用)
  if (currentRankSum + questRank > maxRankSum) {
    alert(
      `現在のランクでは合計ランク${maxRankSum}までのクエストしか受注できません！`
    );
    return;
  }

  // 重複受注チェック
  if (
    playerData.questProgress.ongoing.some((q) => q.questId === quest.questId)
  ) {
    alert(`「${quest.questName}」は既に受注しています！`);
    return;
  }
  
  // クエストの進行状況を初期化
  const progress = (quest.targets || []).map((target) => ({
    name: target.name,
    current: 0,
    required: target.count,
  }));
  console.log("クエストの進行状況を初期化 :", quest, progress)
  // `ongoing` にクエストを追加
  playerData.questProgress.ongoing.push({
    questId: quest.questId,
    questName: quest.questName,
    location: quest.location,
    progress,
  });

  console.log(`受注後のquestProgress:`, playerData.questProgress);

  alert(`「${quest.questName}」を受注しました！`);
  showQuestDetails();
}

// 進行中クエストのランク合計を計算する
function calculateOngoingQuestRank() {
  // playerData.questProgress または ongoing が未定義の場合に備えた安全な処理
  const ongoingQuestIds = (playerData.questProgress?.ongoing || []).map(
    (q) => q.questId
  );

  console.log(`ongoingQuestIds: ${ongoingQuestIds}`);

  // クエストがない場合の処理
  if (ongoingQuestIds.length === 0) {
    console.log("進行中のクエストがありません");
    return 0; // クエストがない場合はランク合計0を返す
  }

  // filteredQuests の中から進行中のクエストを検索しランクを合計
  const totalRank = filteredQuests.reduce((total, quest) => {
    if (ongoingQuestIds.includes(quest.questId)) {
      const questRank = quest.conditions.rank || 1; // ランクがない場合は1
      return total + questRank;
    }
    return total;
  }, 0);

  console.log(`進行中クエストの合計ランク: ${totalRank}`);
  return totalRank;
}

// questProgressの構造を保証する関数
function ensureQuestProgressStructure() {
  if (
    !playerData.questProgress ||
    typeof playerData.questProgress !== "object"
  ) {
    console.warn("questProgressが不正です。初期化します。");
    playerData.questProgress = { ongoing: [], completed: [] };
  }

  if (!Array.isArray(playerData.questProgress.ongoing)) {
    console.warn("ongoingが配列ではありません。修正します。");
    playerData.questProgress.ongoing = [];
  }

  if (!Array.isArray(playerData.questProgress.completed)) {
    console.warn("completedが配列ではありません。修正します。");
    playerData.questProgress.completed = [];
  }
}

// クエストクリア処理 ＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝

// クリアしているか確認
function checkQuestCompletion(quest) {
  // 条件例: モンスター討伐数やアイテム収集
  if (quest.targets) {
    return quest.targets.every((target) => {
      const playerProgress = playerData.progress[target.name] || 0;
      return playerProgress >= target.quantity;
    });
  }

  // 条件が指定されていない場合はクリア扱い
  return true;
}

// クエスト報告処理
function reportQuestsAtGuild() {
  const completedQuests = [];

  playerData.questProgress.ongoing.forEach((quest) => {
    if (checkQuestCompletion(quest)) {
      completedQuests.push(quest);
    }
  });

  if (completedQuests.length === 0) {
    alert("達成したクエストがありません。");
    return;
  }

  console.log("報告するクエスト:", completedQuests);

  completedQuests.forEach((quest) => {
    // `questData` から報酬を取得
    const questDetails = questData.find((q) => q.questId === quest.questId);
    if (!questDetails) {
      console.error(`クエストデータが見つかりません (ID: ${quest.questId})`);
      return;
    }

    console.log("クエストデータ :", questDetails);
    console.log("報酬を適用 :", questDetails.rewards);

    // 報酬を適用
    applyQuestRewards(questDetails);

    // 進行中リストから削除
    playerData.questProgress.ongoing = playerData.questProgress.ongoing.filter(
      (q) => q.questId !== quest.questId
    );

    
    // クエストIDを追加する際、重複をチェック
    if (!playerData.questProgress.completed.includes(quest.questId)) {
      // クリア済みに追加
      playerData.questProgress.completed.push(quest.questId);
    }


    console.log(`クエスト「${questDetails.questName}」を報告しました！`);
  });

  alert(
    `以下のクエストを報告しました:\n${completedQuests
      .map(
        (quest) =>
          questData.find((q) => q.questId === quest.questId)?.questName ||
          "不明"
      )
      .join("\n")}`
  );

  // updateQuestUI();
}

// 受注済みやクリア済みのクエストをリストで表示します
function updateQuestUI() {
  const ongoingQuestList = document.getElementById("ongoing-quest-list");
  const completedQuestList = document.getElementById("completed-quest-list");

  // 進行中クエスト
  ongoingQuestList.innerHTML = playerData.questProgress.ongoing
    .map((quest) => {
      return `<li>${quest.questName} (${quest.progress
        .map((p) => `${p.name}: ${p.current}/${p.required}`)
        .join(", ")})</li>`;
    })
    .join("");

  // クリア済みクエスト
  completedQuestList.innerHTML = playerData.questProgress.completed
    .map((id) => {
      const quest = questData.find((q) => q.questId === id);
      return `<li>${quest.questName}</li>`;
    })
    .join("");
}

//クエスト報酬
function applyQuestRewards(questDetails) {
  const rewards = questDetails.rewards;
  console.log(questDetails.exp);
  rewards.forEach((reward) => {
    if (reward.includes("ゴールド")) {
      const gold = parseInt(reward.replace("ゴールド", "").trim(), 10);
      playerData.money += gold;
      document.getElementById("money-display").textContent = playerData.money;
      console.log(`${gold}Gを獲得しました！`);
    } else {
      console.log(`その他の報酬: ${reward}`);
      // 必要に応じて、他の報酬（アイテムなど）を処理 itemList
      // アイテム報酬
      const item = itemList.find((item) => item.名前 === reward);
      if (item) {
        const matchingCharacter = playerData.party.find(character => character.name === playerData.name);
        matchingCharacter.inventory.push(item);
        console.log(
          `${item.name}をインベントリに追加しました！詳細: ${item.description}`
        );
      } else {
        console.log(`報酬アイテム "${reward}" は存在しません。`);
      }
    }
  });
  if (questDetails.exp) {
    const exp = parseInt(questDetails.exp);
    processExperience(playerData.party, exp)
  }
}

// Excelから データを取得 ＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝
async function questListGet(guildName) {
  const token = authToken; // 認証トークンを取得
  try {
    // クエリ文字列にギルド名を含める
    const response = await fetch(
      `/api/excel/quests?name=${encodeURIComponent(guildName)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // レスポンスのステータスをチェック
    if (!response.ok) {
      throw new Error(
        `APIリクエストに失敗しました: ${response.status} ${response.statusText}`
      );
    }

    // クエストデータをJSONとしてパース
    const questData = await response.json();
    console.log("取得したクエストデータ:", questData);

    return questData.quests;
  } catch (error) {
    console.error("クエストデータ取得中にエラーが発生しました:", error);
    return null; // エラー時には null を返す（必要に応じて適切なエラー処理を追加）
  }
}
