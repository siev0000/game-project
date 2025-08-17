// ダンジョンデータ例
let dungeons = [];
// ダンジョン探索用アクションの定義
const dungeonActions = [
  {
    label: "進む",
    handler: (locationKey) => {
      console.log(`進む処理が実行されました: 現在地 ${locationKey}`);
      advanceExploration(locationKey); // 探索率を進める処理
    },
  },
  {
    label: "戻る",
    handler: (locationKey) => {
      console.log(`戻る処理が実行されました: 現在地 ${locationKey}`);
      moveToPreviousArea(locationKey); // 戻る処理
    },
  },
  {
    label: "周囲を探る",
    handler: (locationKey) => {
      console.log(`周囲を探る処理が実行されました: 現在地 ${locationKey}`);
      searchArea(locationKey); // 周囲を探る処理
    },
  },
  {
    label: "休憩",
    handler: (locationKey) => {
      console.log(`休憩処理が実行されました: 現在地 ${locationKey}`);
      rest("回復薬", locationKey); // 休憩処理（アイテム名を指定）
    },
  },
  {
    label: "脱出",
    handler: (locationKey) => {
      console.log(`脱出処理が実行されました: 現在地 ${locationKey}`);
      exitDungeon(locationKey); // ダンジョンからの脱出処理
    },
  },
];

// ダンジョンに入る準備を確認する関数
function prepareForDungeon() {
  console.log("ダンジョンに入る準備を整えましょう！");

  const ready = confirm("準備はできましたか？");
  if (ready) {
    console.log("準備完了！ダンジョンに入ります。");
    return true;
  } else {
    console.log("準備が整っていません。もう一度確認しましょう。");
    return false;
  }
}

// 散策 処理
async function enterDungeon(setLocation = null) {
  console.log(" setLocation :", setLocation, locations);

  // PointerEvent 対策: setLocation が文字列の場合のみ処理
  const locationName =
    typeof setLocation === "string" && setLocation !== null && setLocation !== undefined
      ? setLocation
      : playerData.location; // 現在の場所の名前

  console.log(" locationName :", locationName, locations[locationName]);
  
  const locationData = await fetchDungeonData(locationName); // APIから場所データを取得

  if (!locationData) {
    console.log("指定された場所データが見つかりませんでした。");
    return;
  }

  console.log(`現在の場所: ${locationName}`);
  console.log(`場所情報: ${locationData.種別}`);

  // ダンジョンかどうかを判定
  if (locations[locationName].dungeon) {
    console.log(`${locationName} はダンジョンです。`);
  } else {
    console.log(`${locationName} はダンジョンではありません。`);

    // ダンジョンではない場合、クエスト受注を確認
    if (!isQuestAccepted(playerData.questProgress.ongoing, locationName)) {
      console.log(
        "このエリアに進入するには該当するクエストを受注する必要があります。"
      );
      return;
    }
    console.log("クエストを受注しているため進入が許可されました。");
  }

  // 準備を確認
  if (!prepareForDungeon()) {
    console.log("準備が整っていないため、ダンジョンに入るのを中止しました。");
    return;
  }

  // ダンジョンに入場
  console.log(`${locationName} に入場しました！`);
  console.log("探索を開始します...");
  exploreDungeon(playerData, dungeonActions, locationData);
}

function isQuestAccepted(quests, locationName) {
  // クエストリストから location が locationName と一致するものを探す
  const matchingQuest = quests.find((quest) => quest.location === locationName);

  if (matchingQuest) {
    alert(`クエスト「${matchingQuest.questName}」が受注されています。`);
    return true; // 一致するクエストがある場合は true
  } else {
    console.log("該当するクエストが見つかりませんでした。");
    return false; // 一致するクエストがない場合は false
  }
}

// ダンジョン探索中のアクションボタンを生成する関数
function updateDungeonActionButtons(actions, locationKey) {
  const actionContainer = document.querySelector("footer"); // ボタンを配置するコンテナ

  // 現在のボタンをクリア
  actionContainer.innerHTML = "";

  // アクションが空の場合の確認
  if (!actions || actions.length === 0) {
    console.warn("アクションが見つかりません");
    return;
  }

  // 各アクションをボタンとして生成
  actions.forEach((action) => {
    const button = document.createElement("button");
    button.textContent = action.label;

    // ボタンのイベントリスナーを設定
    button.onclick = () => {
      console.log(`アクション「${action.label}」が選択されました`);
      action.handler(locationKey); // アクションごとに設定された処理を実行
    };

    // ボタンをアクションコンテナに追加
    actionContainer.appendChild(button);
  });

  console.log(
    "生成されたダンジョンアクションボタン:",
    actionContainer.innerHTML
  );
}

// ダンジョン探索のスタート
function exploreDungeon(playerData, dungeonActions, dungeonData) {
  console.log(`${dungeonData.名前} の探索を開始します！`, dungeonActions);
  console.log(" ダンジョン探索のスタート :", playerData, dungeonActions, dungeonData);
  // ダンジョン進行データの初期化
  if (!playerData.dungeonProgress) {
    playerData.dungeonProgress = {}; // dungeonProgressが存在しない場合に初期化
  }

  if (!playerData.dungeonProgress[dungeonData.名前]) {
    playerData.dungeonProgress[dungeonData.名前] = { explorationRate: 0 }; // ダンジョンごとの初期化
  }

  // 現在のダンジョン情報を取得
  const currentDungeon = playerData.dungeonProgress[dungeonData.名前];
  console.log(" 現在のダンジョン情報を取得 探索率:", currentDungeon, " ダンジョンデータ :", dungeonData)
  updateStoryArea(dungeonData.画像ファイル名 || "default.png", dungeonData.説明);

  // アクションボタンの更新
  updateDungeonActionButtons(
    [
      {
        label: "進む",
        handler: () => {
          advanceExploration(playerData, dungeonData.名前, dungeonData);
        },
      },
      {
        label: "周囲を探る",
        handler: () => {
          searchArea(dungeonData.名前, dungeonData);
        },
      },
      {
        label: "休憩",
        handler: () => {
          rest(playerData);
        },
      },
      {
        label: "脱出",
        handler: () => {
          exitDungeon(playerData);
        },
      },
    ],
    dungeonData.名前
  );
}

// 探索率を進める処理
function advanceExploration(playerData, dungeonName, dungeonData) {
  console.log("探索率を進める処理 :", playerData, dungeonName, dungeonData);
  const currentDungeon = playerData.dungeonProgress[dungeonName];

  if (!currentDungeon) {
    console.error(`${dungeonName} の進行データが見つかりません。`);
    return;
  }

  const maxExplorationRate = dungeonData.探索率最大値 || 100; // デフォルト値 100

  // 探索率を増加
  const increase = Math.floor(Math.random() * 10) + 15; // 15〜25%増加
  currentDungeon.explorationRate += increase;

  // 最大探索率を超えないように調整
  if (currentDungeon.explorationRate > maxExplorationRate) {
    currentDungeon.explorationRate = maxExplorationRate;
  }

  console.log(
    `${dungeonName} の探索率が ${increase}% 増加しました。現在の探索率: ${currentDungeon.explorationRate}% / ${maxExplorationRate}%`
  );



  // 探索率が最大値に達した場合の処理
  if (currentDungeon.explorationRate >= maxExplorationRate) {
    console.log(`${dungeonName} の探索率が最大値に達しました。`);

    if (dungeonData.次エリア) {
      // 次のエリアが存在する場合、エリア移動の確認
      console.log(`次のエリア「${dungeonData.次エリア}」に進みます。`);
      checkNextArea(playerData, dungeonName, dungeonData.次エリア);
    } else {
      // 次のエリアがない場合、イベントを引き続き発生
      console.log(`このエリアは次のエリアがありません。引き続きイベントを発生させます。`);
      triggerEvent(dungeonData);
    }
  } else {
    // 探索率が最大値に達していない場合、通常通りイベントを発生
    triggerEvent(dungeonData);
  }

  
}


// イベントをランダムで発生させる処理
function triggerEvent(dungeonData) {
  console.log("ランダムイベントを発生させます...");

  if (!dungeonData.確率 || Object.keys(dungeonData.確率).length === 0) {
    console.error("エラー: イベント確率データが無効です。");
    return null;
  }

  const totalWeight = Object.values(dungeonData.確率).reduce(
    (sum, weight) => sum + weight,
    0
  );

  if (totalWeight <= 0) {
    console.error("エラー: イベント確率の合計が0以下です。");
    return null;
  }

  // ランダムな値 (0-100)
  const roll = Math.random() * 100;

  console.log(`ランダム値: ${roll} / 最大値: 100`);

  let cumulative = 0;
  for (const [event, weight] of Object.entries(dungeonData.確率)) {
    cumulative += weight;
    console.log(`累積値: ${cumulative} / 現在のイベント: ${event}`);
    if (roll < cumulative) {
      console.log(`発生イベント: ${event}`);
      handleEvent(event, dungeonData);
      return { event, weight, roll };
    }
  }

  // 何も起きない場合
  console.log("イベントなし。");
  return { event: "なし", roll };
}


// イベントごとの処理
function handleEvent(event, dungeonData) {
  switch (event) {
    case "接敵":
      console.log("敵が現れました！戦闘開始！");
      // 戦闘処理をここに追加
      // openBattleModal();
      startCombat(playerData.party, (triggerEncounter(dungeonData)));
      // 戦闘処理を開始する場合のトリガー
      // startCombat(playerData, enemyList);
      break;
    case "罠":
      console.log("罠にかかりました！ダメージを受けます。");
      playerData.health -= Math.floor(Math.random() * 10) + 5;
      if (playerData.health <= 0) {
        console.log("体力が尽きました。ゲームオーバーです。");
        exitDungeon(playerData);
      }
      break;
    case "強敵":
      console.log("強敵が現れました！慎重に行動してください！");
      // 強敵戦闘処理をここに追加
      break;
    case "アイテム":
      console.log("アイテムを発見しました！");
      // アイテム取得処理をここに追加
      handleItemEvent(playerData, dungeonData.感知アイテム);
      break;
    default:
      console.log("何も起こりませんでした。");
  }
}
// = アイテム処理 =====================================================================
// アイテム処理関数
function handleItemEvent(playerData, sensedItems) {
  console.log("アイテム感知イベントが発生しました！");

  // アイテムが存在しない場合の早期リターン
  if (!sensedItems || sensedItems.length === 0) {
    stSkilltory(["感知されたアイテムがありません。"], { speed: 75 });
    return;
  }

  // ランダムに1つのアイテムを選択
  const randomIndex = Math.floor(Math.random() * sensedItems.length);
  const selectedItem = sensedItems[randomIndex];

  // 成功率計算関数
  function calculateSuccessRate(TechniqueValue, difficulty) {
    const TechniqueDifference = TechniqueValue - difficulty;
    return Math.min(100, Math.max(0, 50 + TechniqueDifference * 0.5)); // 50%を基準に補正
  }

  // パーティ内の特定スキルに関連するデータを計算
  function calculateTechniqueStats(partyMembers, TechniqueName) {
    let maxTechniqueValue = 0; // 最大スキル値
    let totalOtherTechniqueValues = 0; // 最大値以外のスキル合計値

    // スキル値の計算
    partyMembers.forEach((member) => {
      const TechniqueValue = member.stats?.baseStats?.[TechniqueName] || 0;
      if (TechniqueValue > maxTechniqueValue) {
        // 最大値を更新し、それまでの最大値を合計に加える
        totalOtherTechniqueValues += maxTechniqueValue;
        maxTechniqueValue = TechniqueValue;
      } else {
        // 最大値未満のスキル値を合計
        totalOtherTechniqueValues += TechniqueValue;
      }
    });

    return { maxTechniqueValue, totalOtherTechniqueValues };
  }

  // 成功時の処理
  function handleSuccess(item, successRate, randomValue) {
    const successMessage = `成功！「${
      item.name
    }」を発見しました！（成功率: ${successRate.toFixed(
      2
    )}%、判定値: ${randomValue.toFixed(2)}）`;
    const message = `インベントリに「${item.name}」を追加しました！`;
    stSkilltory(["・・・ん？", "何かありそうだ。", successMessage, message], {
      speed: 75,
    });
    console.log(successMessage);
    addItemToInventory(playerData, item.name); // アイテムをインベントリに追加
  }

  // 失敗時の処理
  function handleFailure() {
    const failureMessage = ["・・・ん？", "何かありそうだ。", "・・・何も見つからなかった"];
    stSkilltory(failureMessage, { speed: 75 });
    console.log(...failureMessage);
  }

  try {
    // パーティメンバーのデータ取得
    const partyMembers = Object.values(playerData.party);

    // 特定スキルの最大値とその他スキル値の合計を取得
    const { maxTechniqueValue, totalOtherTechniqueValues } = calculateTechniqueStats(
      partyMembers,
      selectedItem.Technique
    );

    if (maxTechniqueValue === 0) {
      throw new Error(
        `パーティ内に技能「${selectedItem.Technique}」を持つメンバーはいません。`
      );
    }

    console.log(
      `技能「${selectedItem.Technique}」のパーティ最大値: ${maxTechniqueValue}, 他のスキル値合計: ${totalOtherTechniqueValues}`
    );

    // 最終スキル値を計算（最大値 + 他の合計値の20%）
    const finalTechniqueValue =
      maxTechniqueValue + Math.floor(totalOtherTechniqueValues * 0.2);
    console.log(
      `最終スキル値: ${finalTechniqueValue}（最大値: ${maxTechniqueValue}, 他の合計値の20%: ${Math.floor(
        totalOtherTechniqueValues * 0.2
      )}）`
    );

    // 成功率を計算
    const successRate = calculateSuccessRate(
      finalTechniqueValue,
      selectedItem.difficulty
    );

    // 成功判定
    const randomValue = Math.random() * 100; // 0〜100のランダム値
    if (randomValue < successRate) {
      handleSuccess(selectedItem, successRate, randomValue);
    } else {
      handleFailure();
    }
  } catch (error) {
    // エラー発生時の処理
    stSkilltory([error.message], { speed: 75 });
    console.error("エラー発生:", error.message, error);
  }
}



// インベントリ追加関数
function addItemToInventory(playerData, itemName) {
  if (!playerData.inventory) {
    playerData.inventory = []; // インベントリが未定義の場合は初期化
  }
  const pushItem = getItemDescription(itemName);
  playerData.inventory.push(pushItem); // インベントリに追加
}

// = 接敵 処理 =====================================================================
function triggerEncounter(dungeonData) {
  console.log("接敵イベントが発生しました！");

  // 出現する敵のデータを取得
  const enemies = dungeonData["出現する敵"];
  if (!enemies || Object.keys(enemies).length === 0) {
    console.log("このエリアには出現する敵がいません！");
    const noEnemyTexts = [
      "このエリアには敵がいませんでした。",
      "探索を続けましょう。",
    ];
    stSkilltory(noEnemyTexts, 75); // 敵がいない場合のテキスト表示
    return;
  }

  // 総確率を計算
  const totalWeight = Object.values(enemies).reduce(
    (sum, weight) => sum + weight,
    0
  );

  // ランダム値を生成（0 〜 totalWeight の範囲）
  const roll = Math.random() * totalWeight;

  // 出現する敵グループをランダムに決定
  let cumulative = 0;
  for (const [groupString, weight] of Object.entries(enemies)) {
    cumulative += weight;
    if (roll < cumulative) {
      console.log(
        `出現モンスターグループ: ${groupString}（判定値: ${roll.toFixed(
          2
        )}, 累積確率: ${cumulative}）`
      );

      // 敵グループを解析してリスト化
      const enemyList = parseEnemyGroup(groupString);
      console.log(" enemyList :", enemyList)
      // 接敵テキストを生成
      const encounterTexts = [];
      enemyList.forEach((enemy) => {
        for (let i = 0; i < enemy.count; i++) {
          encounterTexts.push(`「${enemy.name}」が現れた！`);
        }
      });
      encounterTexts.push("どうする？");

      // テキストを順番に表示
      stSkilltory(encounterTexts, 75);
      
      return enemyList; // 出現した敵のリストを返す
    }
  }

  // 複数体の敵か確認
  function parseEnemyGroup(groupString) {
    // 敵グループをカンマで分割し、それぞれを解析
    const enemies = groupString.split(",").map((entry) => {
      const match = entry.trim().match(/^(.*?)(?: ×(\d+))?$/); // 敵名 × 数 を解析
      if (match) {
        const name = match[1].trim(); // 敵名
        const count = parseInt(match[2], 10) || 1; // 数字部分がない場合は1
        return { name, count }; // オブジェクト形式に変換
      }
      return null; // 無効なデータは除外
    });
  
    // 無効なデータを除外して結果を返す
    return enemies.filter((enemy) => enemy !== null);
  }  
}


// 敵の名前と数を解析する関数
function parseEnemyKey(enemyKey) {
  // 正規表現で「敵名 × 数」を解析
  const match = enemyKey.match(/^(.*?)(?: ×(\d+))?$/); // "ゴブリン ×2" -> ["ゴブリン ×2", "ゴブリン", "2"]
  if (match) {
    const name = match[1].trim(); // 敵名
    const count = parseInt(match[2], 10) || 1; // 数（指定がない場合は1）
    return { name, count };
  }
  // デフォルトは敵名そのまま、1体
  return { name: enemyKey, count: 1 };
}

// 戦闘処理を開始する関数（簡易版）
async function startCombat(playerData, enemyData, enemyEncount = false) {
  console.log(`戦闘を開始します！ 敵: ${enemyData} ×${enemyEncount}`);
  console.log(enemyData);
  console.log(enemyEncount);
  // const storyText = `戦闘開始！敵は「${enemyName}」が${enemyCount}体出現しました！`;
  // stSkilltory([storyText], 75);
  const enemies = await generateEnemyData(enemyData, enemyEncount);
  console.log(" enemies :", enemies)
  enemyData = enemies
  await displayBattleField(playerData, enemyData)
}


// = アクション処理 =====================================================================

// 次のエリアへの移動確認
function checkNextArea(playerData, dungeonName, nextAreas) {
  console.log("nextAreas :", nextAreas);

  // カンマ区切りの文字列を配列に変換
  if (typeof nextAreas === "string") {
    nextAreas = nextAreas.split(",").map(area => area.trim());
  }

  if (!Array.isArray(nextAreas) || nextAreas.length === 0) {
    console.error("エラー: 次エリアが存在しません。");
    return;
  }

  // 次のエリアが1つの場合
  if (nextAreas.length === 1) {
    const singleArea = nextAreas[0];
    const moveToNext = confirm(`次のエリア「${singleArea}」に進みますか？`);
    if (moveToNext) {
      console.log(`次のエリア「${singleArea}」に移動しました！`);
      enterDungeon(singleArea);
    } else {
      console.log("このエリアで探索を続けます。");
    }
    return;
  }

  // 次のエリアが複数ある場合
  const areaOptions = nextAreas.map((area, index) => `${index + 1}: ${area}`).join("\n");
  const selectedOption = prompt(
    `次のエリアを選択してください:\n${areaOptions}\nキャンセルする場合は何も入力しないでください。`
  );

  if (selectedOption === null || selectedOption.trim() === "") {
    console.log("このエリアで探索を続けます。");
    return;
  }

  const selectedIndex = parseInt(selectedOption, 10) - 1;
  if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= nextAreas.length) {
    console.error("無効な選択肢です。");
    return;
  }

  const selectedArea = nextAreas[selectedIndex];
  console.log(`次のエリア「${selectedArea}」に移動しました！`);
  enterDungeon(selectedArea);
}




// 脱出処理
function exitDungeon(playerData) {
  console.log("ダンジョンから脱出しました。");
  moveToLocation(playerData.location)
}

// 周囲を探る処理
function searchArea(dungeonName, dungeonData) {
  console.log(`${dungeonName} を探っています...`);
  if (Math.random() < 0.5) {
    console.log("隠されたアイテムを発見しました！");
  } else {
    console.log("特に何も見つかりませんでした。");
  }
}

// 休憩処理
function rest(playerData) {
  console.log("休憩を開始します...");

  // プレイヤーのインベントリから「休憩」アイテムを抽出
  const restItems = playerData.inventory.filter((item) => item.種別 === "休憩");

  if (restItems.length === 0) {
    console.log("休憩用のアイテムを所持していません！");
    const storyText = "休憩用のアイテムを所持していません！";
    stSkilltory([storyText], 75);
    return;
  }

  console.log("休憩用アイテム:", restItems);

  // アイテム選択プロンプト（簡易版: 選択はプロンプトを使用）
  const itemNames = restItems
    .map((item, index) => `${index + 1}: ${item.名前}`)
    .join("\n");
  const choice = prompt(
    `休憩に使用するアイテムを選択してください:\n${itemNames}`
  );

  const selectedItemIndex = parseInt(choice) - 1;
  if (
    isNaN(selectedItemIndex) ||
    selectedItemIndex < 0 ||
    selectedItemIndex >= restItems.length
  ) {
    console.log("無効な選択です。");
    return;
  }

  const selectedItem = restItems[selectedItemIndex];
  console.log(`選択したアイテム: ${selectedItem.名前}`);

  // 休憩効果を適用
  // applyRestEffect(playerData, selectedItem);

  // アイテムが消費型なら削除
  if (selectedItem.消費) {
    const indexToRemove = playerData.inventory.indexOf(selectedItem);
    if (indexToRemove > -1) {
      playerData.inventory.splice(indexToRemove, 1);
      console.log(
        `アイテム「${selectedItem.名前}」をインベントリから削除しました。`
      );
    }
  }

  // 結果を画面に表示
  const storyText = `「${selectedItem.名前}」を使用して休憩しました！`;
  stSkilltory([storyText], 75);
}


// 休憩効果を適用する関数 修正予定
function applyRestEffect(playerData, item) {
  // 効果を仮定して設定（ここでは回復量を仮定）
  const hpRecovery = item.effect?.hp || 30; // 仮で30回復
  const mpRecovery = item.effect?.mp || 20; // 仮で20回復

  // プレイヤーのHPとMPを回復
  playerData.stats.totalStats.HP = Math.min(
    playerData.stats.totalStats.maxHP,
    playerData.stats.totalStats.HP + hpRecovery
  );
  playerData.stats.totalStats.MP = Math.min(
    playerData.stats.totalStats.maxMP,
    playerData.stats.totalStats.MP + mpRecovery
  );

  console.log(
    `休憩効果: HP +${hpRecovery}, MP +${mpRecovery}。現在のHP: ${playerData.stats.totalStats.HP}, 現在のMP: ${playerData.stats.totalStats.MP}`
  );

  // 結果を画面に表示
  const storyText = "";
  storyText.push(`HPが${hpRecovery}回復しました！`);
  storyText.push(`MPが${mpRecovery}回復しました！`);
  stSkilltory(storyText, 75);
}

// ========================================================================

// APIからダンジョンデータを取得する関数
async function fetchDungeonData(dungeonName) {
  try {
    const response = await fetch(
      `/api/excel/dungeon?name=${encodeURIComponent(dungeonName)}`
    );
    const result = await response.json();

    if (response.ok && result.success) {
      return result.data; // ダンジョンデータを返す
    } else {
      console.error(result.message);
      return null;
    }
  } catch (error) {
    console.error("API呼び出し中にエラーが発生しました:", error);
    return null;
  }
}
