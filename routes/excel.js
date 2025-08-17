const express = require("express");
const router = express.Router();
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");
const chokidar = require("chokidar");

// Excelファイルのパス
const filePath = path.join(__dirname, "../data/excel/game-data.xlsx");
const filePathItem = path.join(__dirname, "../data/excel/item-data.xlsx");
const filePathArea = path.join(__dirname, "../data/excel/area-data.xlsx");

console.log(filePath);
console.log(filePathItem);
console.log(filePathArea);

// キャッシュ用変数 (シート名ごとにデータを保持)
let excelCache = {};
let shopData = [];
let itemData = {};
let areaData = {};

// ファイル監視と再読み込み処理
function watchExcelFile(filePath, callback) {
  console.log(`Watching for changes in ${filePath}...`);
  const watcher = chokidar.watch(filePath, { persistent: true });

  watcher.on("change", () => {
    console.log(`${filePath} has been updated.`);
    callback(filePath);
  });
}

// Excelデータを読み込む関数
function loadExcelData(filePath, type) {
  try {
    const workbook = XLSX.readFile(filePath); // Excelファイルを読み込む
    const sheetNames = workbook.SheetNames; // シート名を取得

    console.log(`${type} ファイルのシート名:`, sheetNames);

    // 必要に応じて各シートを処理
    sheetNames.forEach((sheetName) => {
      const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      if (type === "game") {
        excelCache[sheetName] = data;
      } else if (type === "item") {
        if (!data) return;
        itemData[sheetName] = data;
        if (sheetName === "ショップ") {
          shopData = data.map((row) => ({
            店名: row["店名"],
            ルビ: row["ルビ"],
            商品: Object.keys(row)
              .filter((key) => key.startsWith("商品")) // "商品1", "商品2", ... を取得
              .map((key) => row[key]) // 商品名を取得
              .filter((item) => item), // 空の商品を除外
          }));

          console.log("ショップデータ:", shopData);
        }
      } else if (type === "area") {
        if (!data) return;
        areaData[sheetName] = data;
      }
    });
  } catch (error) {
    console.error(`Failed to load Excel data from ${filePath}:`, error);
  }
}

// ファイル監視を開始
watchExcelFile(filePath, (path) => loadExcelData(path, "game"));
watchExcelFile(filePathItem, (path) => loadExcelData(path, "item"));
watchExcelFile(filePathArea, (path) => loadExcelData(path, "area"));

// 起動時にデータを読み込む
loadExcelData(filePath, "game");
loadExcelData(filePathItem, "item");
loadExcelData(filePathArea, "area");

// 定期更新 (1時間ごと)
setInterval(() => loadExcelData(filePath, "game"), 60 * 60 * 1000);
setInterval(() => loadExcelData(filePathItem, "item"), 60 * 60 * 1000);
setInterval(() => loadExcelData(filePathArea, "area"), 60 * 60 * 1000);

// 「クラス」シートからデータを取得するAPI
router.get("/classes", (req, res) => {
  try {
    // キャッシュから「クラス」シートのデータを取得
    const classData = excelCache["クラス"]; // シート名「クラス」を取得

    if (!classData) {
      return res.status(404).json({ error: "クラスシートが見つかりません" });
    }

    // 名前が空でないデータのみフィルタリング
    const filteredData = classData.filter(
      (row) => row["名前"] && row["名前"].trim() !== ""
    );

    res.json(filteredData);
  } catch (error) {
    console.error("Error fetching class data:", error);
    res.status(500).json({ error: "Failed to fetch class data" });
  }
});

// 「スキル」シートからデータを取得するAPI
router.get("/Skills", (req, res) => {
  try {
    console.log("スキルシートをキャッシュから取得:", excelCache["Technique"]);
    const TechniqueData = excelCache["スキル"]; // シート名「スキル」を取得

    if (!TechniqueData) {
      console.error("スキルシートが見つかりません");
      return res.status(404).json({ error: "スキルシートが見つかりません" });
    }

    // console.log('取得したスキルデータ:', TechniqueData);

    // 名前が空白や未定義でないデータのみフィルタリング
    const filteredData = TechniqueData.filter(
      (row) => row && row["名前"] !== undefined
    );

    res.json(filteredData);
    // res.json(TechniqueData);
  } catch (error) {
    console.error("Error fetching Technique data:", error);
    res.status(500).json({ error: "Failed to fetch Technique data" });
  }
});

// 「属性」シートからデータを取得するAPI
router.get("/attributes", (req, res) => {
  try {
    const attributeData = excelCache["属性"]; // シート名「属性」を取得

    if (!attributeData) {
      return res.status(404).json({ error: "属性シートが見つかりません" });
    }

    // 「魔法属性一覧」の列が空でないものだけ返す
    const filteredData = attributeData.filter(
      (row) => row["属性名"] && row["属性名"].trim() !== ""
    );

    res.json(filteredData);
  } catch (error) {
    console.error("Error fetching attribute data:", error);
    res.status(500).json({ error: "Failed to fetch attribute data" });
  }
});

// 「種族属性」シートからデータを取得するAPI
router.get("/race_attributes", (req, res) => {
  try {
    const raceAttributeData = excelCache["種族属性"]; // シート名「種族属性」を取得

    if (!raceAttributeData) {
      return res.status(404).json({ error: "種族属性シートが見つかりません" });
    }

    // 「種族名」が空でないものだけ返す
    const filteredRaceAttributes = raceAttributeData.filter(
      (row) => row["種族名"] && row["種族名"].trim() !== ""
    );

    res.json(filteredRaceAttributes);
  } catch (error) {
    console.error("Error fetching race attribute data:", error);
    res.status(500).json({ error: "Failed to fetch race attribute data" });
  }
});


// 「アイテム」シートからデータを取得するAPI
router.get("/items", (req, res) => {
  try {
    const itemData2 = itemData["アイテム"]; // シート名「アイテム」を取得

    if (!itemData2) {
      console.error("アイテムシートが見つかりません");
      return res.status(404).json({ error: "アイテムシートが見つかりません" });
    }
    // 名前が空白、未定義、または "-" のデータを除外する
    const filteredItemData = itemData2.filter(
      (Technique) =>
        Technique["名前"] &&
        Technique["名前"].trim() !== "-" &&
        Technique["名前"].trim() !== ""
    );

    res.json(filteredItemData);
    //console.log('取得したアイテムデータ:', itemData2.map(Technique => Technique['名前'] || '名前が未定義'));
    // res.json(itemData2);
  } catch (error) {
    console.error("Error fetching Technique data:", error);
    res.status(500).json({ error: "Failed to fetch Technique data" });
  }
});

// 「装備品」シートからデータを取得するAPI 装備品 アイテム
router.get("/equipments", (req, res) => {
  try {
    const equipmentData = itemData["装備品"]; // シート名「装備品」を取得

    if (!equipmentData) {
      console.error("装備シートが見つかりません");
      return res.status(404).json({ error: "装備シートが見つかりません" });
    }
    // 名前が空白、未定義、または "-" のデータを除外する
    const filteredItemData = equipmentData.filter(
      (Technique) =>
        Technique["名前"] &&
        Technique["名前"].trim() !== "-" &&
        Technique["名前"].trim() !== ""
    );

    res.json(filteredItemData);
    //console.log('取得した装備データ:', equipmentData.map(Technique => Technique['名前'] || '名前が未定義'));
    // res.json(equipmentData);
  } catch (error) {
    console.error("Error fetching Technique data:", error);
    res.status(500).json({ error: "Failed to fetch Technique data" });
  }
});

// 「エリア」シートからデータを取得するAPI 装備品 アイテム
router.get("/locations", (req, res) => {
  try {
    const locationData = areaData["エリア"]; // シート名「装備品」を取得

    if (!locationData) {
      console.error("エリアシートが見つかりません");
      return res.status(404).json({ error: "エリアシートが見つかりません" });
    }

    console.log(
      "取得したエリアデータ:",
      locationData.map((Technique) => Technique["名前"] || "名前が未定義")
    );
    res.json(locationData);
  } catch (error) {
    console.error("Error fetching location data:", error);
    res.status(500).json({ error: "Failed to fetch location data" });
  }
});

// 特定のショップデータを返すAPI
router.get("/shop", (req, res) => {
  const shopName = req.query.name; // クエリパラメータ `name` からショップ名を取得

  console.log("取得したショップデータ:", shopName);

  if (shopName) {
    // 指定されたショップ名に一致するデータを取得
    const shop = shopData.find((shop) => shop["店名"] === shopName);

    if (shop) {
      res.json(shop);
    } else {
      res
        .status(404)
        .json({ error: `ショップ「${shopName}」が見つかりませんでした。` });
    }
  } else {
    // ショップ名が指定されていない場合、すべてのショップデータを返す
    res.json(shopData);
  }
});

// ギルド名から特定のクエストデータを返すAPI
router.get("/quests", (req, res) => {
  const guildName = req.query.name; // クエリパラメータ `name` からギルド名を取得

  console.log("取得したギルドデータ:", guildName);

  // Excelデータをキャッシュから取得してフィルタリング
  const quests = areaData["クエスト"]
    .filter((row) => row["依頼場所"] === guildName) // ギルド名でフィルタリング
    .map((row) => ({
      questId: row["クエストID"],
      type: row["種別"],
      questName: row["クエスト名"],
      description: row["クエスト内容"],
      targets: parseTargets(row["対象"]), // 必要なら分割処理を追加
      conditions: {
        rank: row["条件ランク"],
        status: parseStatusConditions(row["条件ステータス"]),
        Skill: parseConditions(row["条件アビリティ"]),
        quest: parseConditions(row["条件クエスト"]),
      },
      rewards: row["報酬"].split(",").map((reward) => reward.trim()),
      exp: Number(row["経験値"]),
      relatedNpc: row["関連NPC"],
      location: row["場所"],
    }));

  // フィルタリング結果を返却
  if (quests.length > 0) {
    res.status(200).json({ success: true, quests });
  } else {
    res
      .status(404)
      .json({ success: false, message: "該当するクエストが見つかりません。" });
  }
});

// 複数のクエストIDでクエストデータを取得するAPI
router.post("/quests/by-ids", (req, res) => {
  const questIds = req.body.questIds; // クエストIDの配列をリクエストボディから取得

  if (!Array.isArray(questIds)) {
    return res.status(400).json({ success: false, message: "クエストIDの配列を提供してください。" });
  }

  console.log("取得したクエストIDリスト:", questIds);

  // クエストIDの配列に基づいてクエストをフィルタリング
  const quests = areaData["クエスト"].filter((row) => questIds.includes(row["クエストID"]));

  if (quests.length > 0) {
    // 一致するクエストが見つかった場合のレスポンス
    const formattedQuests = quests.map((quest) => ({
      questId: quest["クエストID"],
      type: quest["種別"],
      questName: quest["クエスト名"],
      description: quest["クエスト内容"],
      targets: parseTargets(quest["対象"]), // 必要なら分割処理を追加
      conditions: {
        rank: quest["条件ランク"],
        status: parseStatusConditions(quest["条件ステータス"]),
        Skill: parseConditions(quest["条件アビリティ"]),
        quest: parseConditions(quest["条件クエスト"]),
      },
      rewards: quest["報酬"].split(",").map((reward) => reward.trim()),
      exp: Number(quest["経験値"]),
      relatedNpc: quest["関連NPC"],
      location: quest["場所"],
    }));

    res.status(200).json({ success: true, quests: formattedQuests });
  } else {
    // 一致するクエストが見つからない場合のレスポンス
    res.status(404).json({ success: false, message: "該当するクエストが見つかりません。" });
  }
});




// 特定のダンジョンデータを返すAPI
router.get("/dungeon", (req, res) => {
  const guildName = req.query.name; // クエリパラメータ `name` からダンジョン名を取得

  // Excelデータをキャッシュから取得してフィルタリング
  const dungeons = areaData["ダンジョン"];

  // 名前でフィルタリング
  const originalDungeon = dungeons.find((d) => d.名前 === guildName);

  console.log("取得したダンジョン名:", guildName, originalDungeon);

  if (originalDungeon) {
    // 元データを変更せずにコピーを作成
    const dungeon = { ...originalDungeon };

    // 感知アイテムをパースする
    if (dungeon.感知アイテム) {
      dungeon.感知アイテム = parseSensedItems(dungeon.感知アイテム);
    }

    // 他のフィールドも同様にパースする
    if (dungeon.確率) {
      dungeon.確率 = parseKeyValuePairs(dungeon.確率);
    }
    if (dungeon.出現する敵) {
      dungeon.出現する敵 = parseKeyValuePairs(dungeon.出現する敵);
    }
    if (dungeon.罠) {
      dungeon.罠 = parseKeyValuePairs(dungeon.罠);
    }
    if (dungeon.固定イベント) {
      dungeon.固定イベント = parseKeyValuePairs(dungeon.固定イベント);
    }
    if (dungeon.隠しダンジョン条件) {
      dungeon.隠しダンジョン条件 = parseKeyValuePairs(
        dungeon.隠しダンジョン条件
      );
    }

    // ダンジョンデータが見つかった場合、JSON形式で返す
    res.json({
      success: true,
      data: dungeon,
    });
  } else {
    // ダンジョンが見つからない場合のエラーハンドリング
    res.status(404).json({
      success: false,
      message: "指定されたダンジョンが見つかりませんでした。",
    });
  }
});

// 特定のエネミーデータを返すAPI
router.get("/enemy", (req, res) => {
  // const guildName = req.query.name; // クエリパラメータ `name` からダンジョン名を取得

  try {
    const enemys = areaData["エネミー"];

    if (!enemys) {
      return res.status(404).json({ error: "enemyシートが見つかりません" });
    }

    // 名前が空でないデータのみフィルタリング
    const filteredData = enemys.filter(
      (row) => row["名前"] && row["名前"].trim() !== ""
    );

    res.json(filteredData);
  } catch (error) {
    console.error("Error fetching class data:", error);
    res.status(500).json({ error: "Failed to fetch class data" });
  }
});

// ====　整理用　=====================================================================
// 汎用的なパース関数: "キー:値,キー:値" をオブジェクトに変換
function parseKeyValuePairs(inputString) {
  const result = {};
  if (!inputString || typeof inputString !== "string") {
    return result; // 入力が無効な場合は空オブジェクトを返す
  }

  console.log("解析対象の文字列:", inputString);

  // 入力をコロンで区切って、各ペアを解析
  const pairs = [];
  let currentPair = "";
  let insideBracket = false;

  for (const char of inputString) {
    if (char === "[") {
      insideBracket = true;
    } else if (char === "]") {
      insideBracket = false;
    }

    if (char === "," && !insideBracket) {
      // カンマがペアを区切るタイミング（角括弧外の場合）
      pairs.push(currentPair.trim());
      currentPair = "";
    } else {
      currentPair += char;
    }
  }

  // 最後のペアを追加
  if (currentPair) {
    pairs.push(currentPair.trim());
  }

  // 各ペアを解析
  pairs.forEach((pair) => {
    const lastColonIndex = pair.lastIndexOf(":"); // 最後のコロン位置を特定
    if (lastColonIndex === -1) {
      console.warn(`無効なペア: ${pair}`);
      return;
    }

    // 最後のコロンを基準にキーと値を分割
    const key = pair.slice(0, lastColonIndex).trim();
    const value = pair.slice(lastColonIndex + 1).trim();

    // 余分な角括弧を削除
    const cleanKey = key.replace(/^\[|\]$/g, "").trim(); // "[" と "]" を削除

    // 値を数値に変換可能なら変換
    const probSkill = isNaN(Number(value)) ? value : Number(value);

    // 結果を格納
    result[cleanKey] = probSkill;
  });

  console.log("解析結果:", result);
  return result;
}







function parseSensedItems(inputString) {
  const result = [];
  if (!inputString || typeof inputString !== "string") {
    return result; // 入力が無効な場合は空配列を返す
  }

  inputString.split(",").forEach((item) => {
    const [name, detail] = item.split(":").map((s) => s.trim()); // "力核:鑑定90" -> ["力核", "鑑定90"]

    if (detail) {
      // 必要技能と難易度を分解
      const TechniqueMatch = detail.match(/^([^\d]+)(\d+)$/); // 正規表現で技能と難易度を抽出
      if (TechniqueMatch) {
        const [, Technique, difficulty] = TechniqueMatch; // Technique = "鑑定", difficulty = "90"
        result.push({
          name: name,
          Technique: Technique,
          difficulty: Number(difficulty),
        });
      }
    }
  });

  return result;
}

// "対象" をパースする関数
function parseTargets(targetString) {
  if (!targetString) return [];

  return targetString.split(",").map((target) => {
    const [name, count] = target.split(":").map((part) => part.trim());
    return {
      name, // モンスター名や対象の名前
      count: Number(count) || 0, // 対象の数
    };
  });
}

function parseStatusConditions(statusString) {
  if (!statusString) {
    // console.log("空のステータス文字列が渡されました");
    return {};
  }

  return statusString.split(",").reduce((acc, item) => {
    const [key, value] = item.split(":").map((i) => i.trim());
    if (key && value) {
      acc[key] = Number(value);
    } else {
      // console.log("不正なステータス項目:", item);
    }
    return acc;
  }, {});
}

function parseConditions(conditionString) {
  if (!conditionString) {
    // console.log("空の条件文字列が渡されました");
    return [];
  }

  // カンマで分割してトリムされたリストを返す
  return conditionString.split(",").map((item) => item.trim());
}

module.exports = router;
