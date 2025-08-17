let locations = {
  riverwood: {
    name: "リバーウッド村",
    image: "village.jpg",
    story: "「ここは静かな村だ。住民たちは平和に暮らしている。」",
    actions: ["ショップ", "倉庫", "ギルド", "散策"],
  },
  capitalCity: {
    name: "王都",
    image: "capital.jpg",
    story: "「王都は壮大な城とにぎやかな市場が広がっている。」",
    actions: ["ショップ", "ギルド", "散策"],
  },
  mysticForest: {
    name: "神秘の森",
    image: "forest.jpg",
    story: "「木漏れ日が差し込む静かな森だが、不思議な気配を感じる。」",
    actions: ["散策"],
  },
};
// 商品価格を設定（仮の価格情報）

// let currentLocation = "川沿いの林村"; // "riverwood"; // 初期位置

// 売却金額
const sellNum = 1;

let shopData = [];
// ========= 移動 ========================================================

// function openMoveModal() {
//   console.log("playerData.location :", playerData.location);
//   const currentLocationData = locations[playerData.location || "川沿いの林村"];
//   const moveOptions = document.getElementById("move-options");

//   // 移動可能な場所をリストアップ
//   moveOptions.innerHTML = currentLocationData.connections
//     .map((locationName) => {
//       const location = locations[locationName];
//       return `
//           <li>
//             <button onclick="moveToLocation('${locationName}')">${location.name}</button>
//           </li>
//         `;
//     })
//     .join("");

//   // モーダルを表示
//   document.getElementById("move-modal").classList.remove("hidden");
// }
const typeImages = {
  都市: "images/equipment/街.webp",
  街: "images/equipment/街.webp",
  村: "images/equipment/街.webp",
  森: "images/equipment/ダンジョン.webp",
  山: "images/equipment/ダンジョン.webp",
  荒野: "images/equipment/ダンジョン.webp",
  渓谷: "images/equipment/ダンジョン.webp",
  砦: "images/equipment/街.webp",
  国: "images/equipment/街.webp",
};
function openMoveModal() {
  console.log("playerData.location :", playerData.location);

  // 現在の場所のデータを取得
  const currentLocationData = locations[playerData.location || "アルジビア王国"];

  // 移動可能な場所を生成
  const moveTableRows = currentLocationData.connections
    .map((locationName) => {
      const location = locations[locationName];

      // 種別に応じた画像を取得
      const locationImage = typeImages[location.type] || "images/equipment/ダンジョン.webp";

      // テーブル行を生成
      return `
        <tr>
          <td class="clickable-cell" onclick="moveToLocation('${locationName}')">
            <div class="table-row-content">
              <img src="${locationImage}" alt="${location.type}" class="table-location-image" />
              <span>${location.name}</span>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  // モーダルを表示
  openUniversalModal({
    type: "info",
    title: "移動可能な場所",
    content: `
      <p>次の目的地を選んでください:</p>
      <table class="u-modal__table">
        <thead>
          <tr>
            <th>場所名</th>
          </tr>
        </thead>
        <tbody>
          ${moveTableRows}
        </tbody>
      </table>
    `,
    buttons: [
      {
        label: "閉じる",
        onClick: closeUniversalModal,
      },
    ],
    vertical: false,
  });
}




function updateActionButtons(actions, locationKey) {
  const actionContainer = document.querySelector("footer");

  // 現在のアクションボタンをクリア
  actionContainer.innerHTML = "";
  // 倉庫がない場合に初期値として `false` を設定
  isInStorage = false;
  // アクションが空の場合の確認

  if (!actions || actions.length === 0) {
    console.warn("アクションが見つかりません");
    return;
  }

  // 各アクションをボタンとして生成
  actions.forEach((action) => {
    const button = document.createElement("button");
    button.textContent = action;

    // アクションごとの処理を設定
    switch (action) {
      case "ショップ":
        button.onclick = openShopModal;
        break;
      case "倉庫":
        isInStorage = true;
        button.onclick = openStorage;
        break;
      case "ギルド":
        button.onclick = showGuild;
        break;
      case "散策":
        button.onclick = enterDungeon;
        break;
      case "帰還":
        button.onclick = returnHome;
        break;
      case "日記":
        button.onclick = saveGame;
        break;
      default:
        console.warn(`未知のアクション: ${action}`);
    }

    actionContainer.appendChild(button);
  });

  // 移動ボタンを追加
  const moveButton = document.createElement("button");
  moveButton.textContent = "移動";
  moveButton.onclick = openMoveModal;
  actionContainer.appendChild(moveButton);

  console.log("生成されたアクションボタン:", actionContainer.innerHTML);
}

// メインコンテンツエリアに HTML を動的にロード
// ============== ショップ  ========================================
async function loadShop() {
  try {
    // スクリプトを動的にロード
    const script = document.createElement("script");
    script.src = "js/shop.js";
    // script.onload = () => {
    //     if (typeof initializeShop === 'function') {
    //         initializeShop(); // ショップの初期化を実行
    //     } else {
    //         console.error('initializeShop が定義されていません');
    //     }
    // };
    document.body.appendChild(script);
  } catch (error) {
    console.error("ショップのロードに失敗しました:", error);
  }
}

// ショップ取得
async function loadShopByName(shopName) {
  console.log(" ショップ取得 :", shopName);
  try {
    // クエリパラメータを使用して特定のショップを取得
    const response = await fetch(
      `/api/excel/shop?name=${encodeURIComponent(shopName)}`
    );
    if (!response.ok) {
      throw new Error(
        `ショップ「${shopName}」のデータを取得できませんでした。`
      );
    }

    const shop = await response.json();

    console.log(" shop :", shop);
    return shop;
  } catch (error) {
    console.error("Error loading shop by name:", error);
    document.getElementById("shopList").textContent =
      "ショップデータの取得に失敗しました。";
  }
}

// ショップを開く
async function openShopModal() {
  console.log("ショップモーダルを開きます。（未実装）");
  shopData = await loadShopByName(playerData.location); // 現在地に基づくショップデータ
  const shopNameElement = document.getElementById("shop-name");
  const shopTableBody = document.querySelector("#shop-table tbody");
  const goldDisplay = document.getElementById("gold-display");
  const overlay = document.getElementById("overlay");
  console.log("ショップデータ :", shopData);

  if (!shopData) {
    alert("このエリアにはショップがありません。");
    return;
  }

  // ショップ名を表示
  shopNameElement.textContent = shopData.店名;

  // // 所持金を表示
  // goldDisplay.textContent = playerData.money;

  if (!shopData || !shopData.商品) {
    console.error("商品データが見つかりません:", shopData);
    alert("このエリアには商品がありません。");
    return;
  }
  // 商品リストを生成
  shopTableBody.innerHTML = shopData["商品"]
    .map((itemName, index) => {
      const description = getItemDescription(itemName);
      // console.log(itemName, description); // デバッグ用

      // 画像アイコンの設定
      const imageIcon = description.画像url
        ? `<img src="/images/equipment/${description.画像url}" alt="${description.画像url}" style="height: 2.7vh;">`
        : ""; // 画像がない場合は空

      return `
        <tr>
          <td>
            <a href="#" onclick="openItemDetailModal(${index}); return false;">
            ${imageIcon} <!-- 名前の右にアイコンを追加 -->
              <ruby>${itemName}<rt>${description.ルビ || ""}</rt></ruby>
            </a>
          </td>
          <td>${description.種別}</td>
          <td>${
            parseInt(description.切断 + description.貫通 + description.打撃) ||
            "-"
          }/${parseInt(description.射撃) || "-"}</td>
          <td>${description.ガード || "-"}/${
        parseInt(description.物理軽減) || "-"
      }</td>
          <td>${description.金額}G</td>
        </tr>
      `;
    })
    .join(""); // 配列を文字列として結合
    overlay.style.display = "block";
  shopbuy();
  // モーダルを表示
  document.getElementById("shop-modal").classList.remove("hidden");
}

// タブ切り替え
function switchShopTab(tab) {
  const tabs = document.querySelectorAll(".shop-tab-content");
  tabs.forEach((tabContent) => {
    tabContent.classList.add("hidden"); // 全てのタブを非表示
  });

  document.getElementById(`${tab}-tab`).classList.remove("hidden"); // 対象タブを表示
}

function shopbuy() {
  // 売却用のインベントリリストを生成
  const inventoryTableBody = document.querySelector(
    "#shop-inventory-table tbody"
  );
  console.log("shopbuy playerData.inventory", playerData.inventory);
  // allCharacters 配列の処理
  
  
  inventoryTableBody.innerHTML = matchingCharacter.inventory
    .map((item, index) => {
      // インデックスも取得
      console.log("item:", item);
      const sellPrice = Math.floor((item.金額 || 0) * sellNum); // 売却価格をそのまま使用

      return `
        <tr>
          <td>
            <a href="#" onclick="openItemDetailModal(${index}, null, 'inventory'); return false;">
              <ruby>${item.名前}<rt>${item.ルビ || ""}</rt></ruby>
            </a>
          </td>
          <td>${item.種別 || "-"}</td>
          <td>${parseInt(item.切断 + item.貫通 + item.打撃) || "-"}/${
        parseInt(item.射撃) || "-"
      }</td>
          <td>${item.ガード || "-"}/${parseInt(item.物理軽減) || "-"}</td>
          <td>${sellPrice}G</td>
        </tr>
      `;
    })
    .join("");
}

function buyItem(itemName) {
  const itemPrice = getItemPrice(itemName); // アイテムの価格を取得
  if (!itemPrice) {
    alert("価格が設定されていない商品です。");
    return;
  }

  // 所持金チェック
  if (player.gold < itemPrice) {
    alert("所持金が足りません。");
    return;
  }
  let matchingCharacter = playerData.party.find(character => character.name === playerData.name);
  // 購入処理
  player.gold -= itemPrice;
  matchingCharacter.inventory.push(itemName);
  alert(`${itemName}を購入しました！`);

  // ショップモーダルを更新
  openShopModal();
}

function sellItem(item, sellPrice, index) {
  // インベントリから削除
  playerData.inventory.splice(index, 1);

  
  // インベントリ内でアイテムを検索
  const itemIndex = matchingCharacter.inventory.findIndex(
    (item) => item.名前 === itemName
  );
  if (itemIndex === -1) {
    alert("アイテムが見つかりません！");
    return;
  }

  // 売却処理
  playerData.money += sellPrice; // 所持金を増加
  matchingCharacter.inventory.splice(itemIndex, 1); // インベントリから削除
  document.getElementById("money-display").textContent = playerData.money;

  // モーダルを閉じる
  closeItemDetailModal();

  // ショップモーダルを更新
  openShopModal(); // 再描画
}

// function sellItem(item, sellPrice, index) {
//   // インベントリから削除
//   playerData.inventory.splice(index, 1);

//   // 所持金を増加
//   playerData.money += sellPrice;

//   // モーダルを閉じる
//   closeItemDetailModal();

//   // ショップモーダルを更新
//   openShopModal();

//   // alert(`${item.名前 || item}を${sellPrice}Gで売却しました！`);
// }

// 商品データを表示 使わない
function openItemDetail(index) {
  console.log("openItemDetail :", index);
  currentItemIndex = index;
  const itemName = shopData.商品[index];
  const price = itemPrices[itemName] || "不明";

  // 装備品とアイテムシートからデータを取得して　itemDescriptions に入れておく
  // const description = itemDescriptions[itemName] || "詳細な説明がありません。";
  const description = getItemDescription(itemName);
  console.log("openItemDetail description:", description);
  // 詳細モーダルにデータを表示
  document.getElementById("item-name").textContent = itemName;
  document.getElementById("item-description").textContent = description;
  document.getElementById("item-price").textContent = price;

  document.getElementById("item-detail-modal").classList.remove("hidden");
}

// アイテムデータを取得
function getItemDescription(itemName) {
  // itemListから該当アイテムを検索
  const item = itemList.find((e) => e.名前 === itemName);

  if (item) {
    return item;
  }

  console.log(" アイテムデータを取得 :", itemName);
  // itemListになければequipmentから検索
  const equipmentItem = equipment.find((e) => e.名前 === itemName);

  if (equipmentItem) {
    // console.log("Found in equipment:", equipmentItem);
    return equipmentItem;
  }

  // どちらにも該当アイテムがなければnullを返す
  // console.log("Item not found:", itemName);
  return null;
}

let currentItemIndex = 0; // 現在のアイテムインデックスを保持
let currentTab = null; // 現在表示中のタブ名

// 商品データを表示
function openItemDetailModal(index, activeTab = null, source = "shop") {
  currentMode = source; // 現在のモードを設定
  currentItemIndex = index; // 現在のアイテムインデックスを更新
  
  // データソースに応じてアイテムデータを取得
  const item =
    source === "shop"
      ? getItemDescription(shopData["商品"][index])
      : matchingCharacter.inventory[index];

  // 商品名や説明を設定
  document.getElementById("item-name").innerHTML = `
    <ruby>${item.名前}<rt>${item.ルビ || ""}</rt></ruby>
  `;

  document.getElementById("item-price").innerHTML = item.金額 + "G";

  // 前へ・次への動作を設定
  const prevButton = document.getElementById("prev-item");
  const nextButton = document.getElementById("next-item");

  prevButton.onclick = () => showPreviousItem(source);
  nextButton.onclick = () => showNextItem(source);

  // ボタン表示の切り替え（購入/売却）
  const buyButton = document.getElementById("buy-item");
  const sellButton = document.getElementById("sell-item");

  if (source === "shop") {
    buyButton.style.display = "inline-block";
    sellButton.style.display = "none";
    buyButton.onclick = () => buySelectedItem(index);
  } else if (source === "inventory") {
    sellButton.style.display = "inline-block";
    buyButton.style.display = "none";
    sellButton.onclick = () => confirmSellItem(index);
  }

  // タブやコンテンツを動的に生成
  const tabsContainer = document.getElementById("item-tabs");
  const contentsContainer = document.getElementById("item-contents");
  tabsContainer.innerHTML = "";
  contentsContainer.innerHTML = "";
  // basic: {
  //   keys: ["金額", "武器の説明", "種別", "素材", "素材の説明", "説明"],
  //   label: "基本情報"
  // },
  Object.keys(itemCategories).forEach((categoryKey) => {
    const category = itemCategories[categoryKey];

    // フィルタリング条件
    const filteredKeys = category.keys.filter((key) => {
      const value = item[key];
      return (
        value !== undefined &&
        value !== null &&
        value !== 0 &&
        !(typeof value === "string" && value.trim() === "")
      );
    });

    console.log(`カテゴリ: ${category.label}, フィルタ結果:`, filteredKeys);

    // フィルタリング結果が空でない場合にタブとコンテンツを生成
    if (filteredKeys.length > 0) {
      // タブボタンを生成
      const tabButton = document.createElement("button");
      tabButton.textContent = category.label;
      tabButton.dataset.tab = categoryKey; // data-tab を設定
      tabButton.onclick = () => switchItemTab(categoryKey); // タブ切り替え
      tabsContainer.appendChild(tabButton);

      // コンテンツを生成
      const contentTable = document.createElement("table");
      const tableBody = document.createElement("tbody");

      filteredKeys.forEach((key) => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${key}</td><td>${item[key]}</td>`;
        tableBody.appendChild(row);
      });

      contentTable.appendChild(tableBody);
      contentTable.id = `${categoryKey}-content`; // コンテンツのIDを設定
      contentTable.classList.add("item-tab-content");
      contentTable.style.display = "none"; // 初期状態では非表示

      contentsContainer.appendChild(contentTable);
    }
  });

  // 初期タブを選択
  const firstTab = tabsContainer.querySelector("button");
  if (firstTab) firstTab.click();

  // モーダルを表示
  document.getElementById("item-detail-modal").classList.add("active");
  document.getElementById("item-detail-modal").style.display = "inline-block";
}

// 売却処理
function confirmSellItem(index) {
  // 
  const item = matchingCharacter.inventory[index];
  const sellPrice = Math.floor((item.金額 || 0) * sellNum);

  // 装備中かどうかを確認
  const isEquipped = Object.entries(matchingCharacter.equipmentSlot).some(
    ([slot, equippedItem]) => equippedItem === item.名前
  );

  if (isEquipped) {
    const confirmSell = confirm(
      `「${item.名前}」は現在装備中です。本当に売却しますか？`
    );
    if (!confirmSell) {
      return; // 売却キャンセル
    }

    // 装備解除
    unequipItem(item.名前);
  }

  // 売却処理
  playerData.money += sellPrice; // 所持金を増やす
  matchingCharacter.inventory.splice(index, 1); // インベントリから削除

  // UI更新
  renderInventory(matchingCharacter.inventory, matchingCharacter.equipmentSlot); // インベントリを再描画
  openShopModal(); // ショップを再描画
  alert(`${item.名前} を ${sellPrice}G で売却しました！`);

  // モーダルを閉じてショップを再描画
  closeItemDetailModal();
  shopbuy();

  // 所持金をモーダルに反映
  // document.getElementById('gold-display').textContent = playerData.money;
  document.getElementById("money-display").textContent = playerData.money;
}
// 装備解除
function unequipItem(itemName) {
  
  // 装備スロットを確認し、装備中のスロットを解除
  Object.keys(matchingCharacter.equipmentSlot).forEach((slot) => {
    if (matchingCharacter.equipmentSlot[slot] === itemName) {
      matchingCharacter.equipmentSlot[slot] = null; // スロットを空にする
      console.log(`スロット「${slot}」の「${itemName}」を解除しました。`);
    }
  });

  // 装備UIを更新（必要に応じて）
  renderEquipment(matchingCharacter.equipmentSlot, matchingCharacter.inventory);
}

// タブを切り替える
function switchItemTab(tabName) {
  console.log(`タブ切り替え: ${tabName}`); // デバッグ用

  // すべてのタブコンテンツを非表示にする
  document.querySelectorAll(".item-tab-content").forEach((content) => {
    content.style.display = "none"; // 非表示
  });

  // 対応するタブコンテンツを表示
  const targetContent = document.getElementById(`${tabName}-content`);
  if (targetContent) {
    targetContent.style.display = "block"; // 表示
    console.log(`表示するコンテンツ: ${targetContent.id}`);
  } else {
    console.warn(`対応するタブコンテンツが見つかりません: ${tabName}`);
  }

  // すべてのタブボタンを非アクティブ化
  document.querySelectorAll("#item-tabs button").forEach((button) => {
    button.classList.remove("active"); // 非アクティブ状態を解除
  });

  // 対応するタブボタンをアクティブ化
  const targetButton = document.querySelector(
    `#item-tabs button[data-tab="${tabName}"]`
  );
  if (targetButton) {
    targetButton.classList.add("active"); // アクティブ状態を設定
    console.log(`アクティブなボタン: ${targetButton.textContent}`);
  } else {
    console.warn(`対応するタブボタンが見つかりません: ${tabName}`);
  }

  // 現在のタブを更新
  currentTab = tabName;
}

function closeItemDetailModal() {
  document.getElementById("item-detail-modal").classList.remove("active");
  document.getElementById("item-detail-modal").style.display = "none";
}

function showNextItem(source = "shop") {
  
  // データソースを選択
  const items = source === "shop" ? shopData["商品"] : matchingCharacter.inventory;

  if (!items || items.length === 0) {
    console.error("アイテムリストが空です");
    return;
  }

  // 現在のインデックスを1つ増やす
  currentItemIndex = (currentItemIndex + 1) % items.length;

  // 次のアイテムをモーダルで表示
  openItemDetailModal(currentItemIndex, currentTab, source);
}

function showPreviousItem(source = "shop") {
  
  // データソースを選択
  const items = source === "shop" ? shopData["商品"] : matchingCharacter.inventory;

  if (!items || items.length === 0) {
    console.error("アイテムリストが空です");
    return;
  }

  // 現在のインデックスを1つ減らす（負の値になった場合、最後に戻る）
  currentItemIndex = (currentItemIndex - 1 + items.length) % items.length;

  // 前のアイテムをモーダルで表示
  openItemDetailModal(currentItemIndex, currentTab, source);
}

// 購入処理
function buySelectedItem() {
  const itemName = shopData["商品"][currentItemIndex];

  const buyItem = getItemDescription(itemName);
  const price = buyItem.金額 || 0;
  console.log(" 購入処理 : ", buyItem, shopData);
  // 所持金チェック
  if (playerData.money < price) {
    alert("所持金が足りません。");
    return;
  }
  let matchingCharacter = playerData.party.find(character => character.name === playerData.name);

  // インベントリの容量チェック
  if (matchingCharacter.inventory.length >= playerData.maxInventory) {
    alert("インベントリがいっぱいです。");
    return;
  }

  // 購入処理
  playerData.money -= price;
  matchingCharacter.inventory.push(buyItem);
  alert(`${itemName}を購入しました！`);

  // 所持金をモーダルに反映
  // document.getElementById('gold-display').textContent = playerData.money;
  document.getElementById("money-display").textContent = playerData.money;
  // モーダルを閉じる
  closeItemDetailModal();
}

// console.log("倉庫モーダルを開きます。")
function openStorage() {
  const storageModal = document.getElementById("storage-modal");
  renderStorage(); // 倉庫のアイテムを描画
  storageModal.style.display = "flex"; // モーダルを表示
  console.log("倉庫モーダルを開きます。");
}

function closeStorageModal() {
  const storageModal = document.getElementById("storage-modal");
  storageModal.style.display = "none"; // モーダルを非表示
}

function renderStorage() {
  const storageTableBody = document.querySelector("#storage-table tbody");
  const storage = playerData.storage || [];

  const storageCountElement = document.getElementById("storage-count");
  storageCountElement.textContent = `${storage.length} / ${maxStorageCapacity}`;

  // 倉庫データをテーブルに描画
  storageTableBody.innerHTML = storage
    .map(
      (item, index) => `
    <tr>
      <td>
        <a href="#" onclick="moveItemToInventory(${index}); return false;">
          <ruby>${item.名前}<rt>${item.ルビ || ""}</rt></ruby>
        </a>
      </td>
      <td>${item.種別 || "-"}</td>
      <td>${item.威力 || "-"}/${item.射撃 || "-"}</td>
      <td>${item.ガード || "-"}/${item.物理軽減 || "-"}</td>
      <td>${item.属性 || "-"}</td>
    </tr>
  `
    )
    .join("");
}

function moveItemToInventory(index) {
  if (playerData.inventory.length >= playerData.maxInventory) {
    alert("インベントリが満杯です。");
    return;
  }

  const item = playerData.storage.splice(index, 1)[0]; // 倉庫から削除
  playerData.inventory.push(item); // インベントリに追加

  alert(`${item.名前} をインベントリに移動しました。`);
  renderStorage(); // 倉庫の更新
  renderInventory(); // インベントリの更新（別途実装済みと仮定）
}

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

  if (playerData.storage.length >= 50) {
    // 倉庫の最大容量を仮定
    alert("倉庫が満杯です。");
    return;
  }

  // インベントリから削除して倉庫に追加
  playerData.inventory.splice(currentItemIndex, 1);
  playerData.storage.push(currentItem);

  alert(`${currentItem.名前} を倉庫に移動しました。`);
  renderInventory(); // インベントリを更新
  renderStorage(); // 倉庫を更新
}

function openGuildModal() {
  console.log("ギルドモーダルを開きます。（未実装）");
}

function explore() {
  console.log("散策イベントを開始します。（未実装）");
}
