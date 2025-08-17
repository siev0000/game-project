// map.js

const zoomWrapper = document.getElementById("zoom-wrapper");
const mapContainer = document.getElementById("map-container");
const info = document.getElementById("info");

let scale = 5; // 初期ズーム倍率
let panX = 0; // パン（移動）のX座標
let panY = 0; // パン（移動）のY座標

const registeredPoints = []; // 登録ポイント

// エリアデータ (名前と座標)
const areas = [
    { name: "アルジビア", x: 258, y: 137 },
    { name: "海の街", x: 231, y: 134 },
    { name: "鉱山都市", x: 264.5, y: 163 },
    { name: "森林の街", x: 236, y: 157 },
    { name: "戦場後", x: 295, y: 90 },
    { name: "森の農場", x: 248, y: 133 },
    {
      name: "水脈森",
      x: 275,
      y: 135,
      description: "低レベルの動物やゴブリンが住む",
    },
    { name: "魔獣の森", x: 253, y: 155 },
    { name: "負の跡地", x: 269, y: 118 },
    { name: "海沿いの森", x: 232, y: 120 },
    { name: "大森林", x: 324, y: 130 },
    { name: "砂漠山", x: 253, y: 95 },
    { name: "オベリスク", x: 264, y: 66 },
    { name: "渓谷地帯", x: 268, y: 189 },
    { name: "大鉱山", x: 255, y: 178 },
    { name: "竜人の里", x: 283, y: 207 },
    { name: "竜人の里2", x: 315.5, y: 218 },
    { name: "竜人の里3", x: 341, y: 207 },
    { name: "黄昏の樹", x: 341, y: 225 },
    { name: "グリーン", x: 381, y: 121 },
    { name: "太陽の砦", x: 483, y: 86 },
    { name: "陽光山", x: 488, y: 77 },
    { name: "宗教国", x: 333, y: 353 },
    { name: "月光山", x: 289, y: 493 },
    { name: "天使の国", x: 222.5, y: 352 },
  ];
  

// **1. 初期位置をアルジビアに設定**
function centerOnArea(area) {
  // 画面サイズを取得
  const containerRect = mapContainer.getBoundingClientRect();

  // 指定エリアの位置を画面の中心に移動
  panX = containerRect.width / 2 - area.x * scale;
  panY = containerRect.height / 2 - area.y * scale;
  updateTransform();
}

// 初期状態：アルジビアを中心に
const aljibia = areas.find((area) => area.name === "アルジビア");
if (aljibia) centerOnArea(aljibia);

// **2. ズームとパンを適用**
function updateTransform() {
  zoomWrapper.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
}

// **3. クリックで指定エリアを中心に移動**
mapContainer.addEventListener("click", (event) => {
  // ラッパー要素を基準にクリック対象を特定
  const target = event.target.closest(".area-wrapper");
  if (target) {
    // エリアポイントを処理
    handleAreaClick(target.querySelector(".area-point"));
  } else {
    // エリア以外をクリックした場合の処理
    handleMapClick(event);
  }
});

// **エリアポイントをクリックした場合の処理**
function handleAreaClick(areaElement) {
  // エリアデータから情報を取得
  const areaName = areaElement.title; // エリア名を取得（title属性に格納）
  const rect = zoomWrapper.getBoundingClientRect();
  const areaX = parseFloat(areaElement.style.left); // CSSのleftからx座標を取得
  const areaY = parseFloat(areaElement.style.top); // CSSのtopからy座標を取得

  // パン位置を更新してエリアを画面中央に移動
  panX = mapContainer.offsetWidth / 2 - areaX * scale;
  panY = mapContainer.offsetHeight / 2 - areaY * scale;
  updateTransform();

  // エリア情報を画面下部に表示
  info.textContent = `エリア: ${areaName} (x=${Math.round(
    areaX
  )}, y=${Math.round(areaY)})`;
}

// **エリア以外をクリックした場合の処理**
function handleMapClick(event) {
  // マップ全体の位置を取得
  const rect = mapContainer.getBoundingClientRect();

  // クリック位置をズーム倍率とパン位置を考慮して計算
  const x = (event.clientX - rect.left - panX) / scale;
  const y = (event.clientY - rect.top - panY) / scale;

  // 座標を表示し、名前登録フォームを表示
  info.innerHTML = `
      <p>クリックした座標: x=${Math.round(x)}, y=${Math.round(y)}</p>
      <label for="point-name">名前を入力: </label>
      <input type="text" id="point-name" placeholder="ポイント名" />
      <button id="register-point">登録する</button>
    `;

  // 既存の仮ポイントを削除（重複防止）
  const existingPoint = document.querySelector(".temp-point");
  if (existingPoint) {
    existingPoint.remove();
  }

  // 仮ポイントを表示
  const tempPoint = document.createElement("div");
  tempPoint.classList.add("temp-point");
  tempPoint.style.left = `${x}px`;
  tempPoint.style.top = `${y}px`;
  zoomWrapper.appendChild(tempPoint);

  // 登録ボタンのイベントリスナーを追加
  document.getElementById("register-point").addEventListener("click", () => {
    const pointName = document.getElementById("point-name").value.trim(); // 入力値を取得
    if (pointName) {
      registerPoint(x, y, pointName);
      tempPoint.remove(); // 登録後に仮ポイントを削除
    } else {
      alert("名前を入力してください。");
    }
  });
}

// **ポイントを登録する関数**
function registerPoint(x, y, name) {
  // 配列に登録情報を追加
  registeredPoints.push({ x, y, name });

  // 新しいポイントを作成
  const newPoint = document.createElement("div");
  newPoint.classList.add("area-point");
  newPoint.style.left = `${x}px`;
  newPoint.style.top = `${y}px`;

  // 名前をツールチップとして表示
  newPoint.title = name;

  // 新しいポイントにクリック処理を追加
  newPoint.addEventListener("click", (event) => {
    event.stopPropagation(); // 背景クリックイベントを無効化
    info.textContent = `ポイント: ${name} (x=${Math.round(x)}, y=${Math.round(
      y
    )})`;
  });

  // ポイントをズームラッパーに追加
  zoomWrapper.appendChild(newPoint);
  console.log(" registeredPoints :", registeredPoints);

  // 情報を表示
  info.textContent = `新しいポイント「${name}」を登録しました: x=${Math.round(
    x
  )}, y=${Math.round(y)}`;
}

// **ズームとパンの更新**
function updateTransform() {
  zoomWrapper.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
}

//ロード 復元
function loadRegisteredPoints() {
  const savedPoints =
    JSON.parse(localStorage.getItem("registeredPoints")) || [];
  savedPoints.forEach((point) => {
    registerPoint(point.x, point.y); // 各ポイントを復元
  });
}

// ページロード時に復元を呼び出し
window.addEventListener("load", loadRegisteredPoints);

// **4. エリアポイントを追加**
areas.forEach((area) => {
  // ラッパー要素を作成
  const wrapper = document.createElement("div");
  wrapper.classList.add("area-wrapper");
  wrapper.style.left = `${area.x}px`;
  wrapper.style.top = `${area.y}px`;

  // ポイント（見た目）を作成
  const point = document.createElement("div");
  point.classList.add("area-point");

  // 名前をツールチップとして表示
  point.title = area.name;

  // ラッパー要素をクリックした場合
  wrapper.addEventListener("click", (event) => {
    event.stopPropagation(); // 背景クリックのイベントを無効化

    // 画面中心にエリアを移動
    panX = mapContainer.offsetWidth / 2 - area.x * scale;
    panY = mapContainer.offsetHeight / 2 - area.y * scale;
    updateTransform();

    // エリア情報を表示
    info.textContent = `エリア: ${area.name}`;
  });

  // ラッパー要素にポイントを追加
  wrapper.appendChild(point);

  // ラッパー要素をズームラッパーに追加
  zoomWrapper.appendChild(wrapper);
});

// **5. ズーム機能（マウスホイール対応）**
mapContainer.addEventListener("wheel", (event) => {
  event.preventDefault();

  const delta = event.deltaY > 0 ? -0.1 : 0.1; // ズームの増減
  const oldScale = scale;
  scale = Math.min(Math.max(1, scale + delta), 5); // ズーム範囲を1～5倍に制限

  // マウス位置を基準にパン位置を調整
  const rect = mapContainer.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  panX -= mouseX / oldScale - mouseX / scale;
  panY -= mouseY / oldScale - mouseY / scale;
  updateTransform();
});

// **6. ピンチズームとドラッグ操作のサポート（スマホ対応）**
let lastTouchDistance = 0; // ピンチ操作での距離
let lastTouchPosition = null; // ドラッグ操作の最後のタッチ位置

zoomWrapper.addEventListener("touchstart", (event) => {
  if (event.touches.length === 2) {
    // ピンチズーム開始時の指の距離を記録
    const [touch1, touch2] = event.touches;
    lastTouchDistance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );
  } else if (event.touches.length === 1) {
    // ドラッグ開始時のタッチ位置を記録
    lastTouchPosition = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    };
  }
});

zoomWrapper.addEventListener("touchmove", (event) => {
  event.preventDefault();

  if (event.touches.length === 2) {
    // ピンチズーム操作
    const [touch1, touch2] = event.touches;
    const currentDistance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );

    const delta = currentDistance - lastTouchDistance;
    scale = Math.min(Math.max(1, scale + delta * 0.01), 5); // ズーム範囲を1～5倍に制限
    lastTouchDistance = currentDistance;
    updateTransform();
  } else if (event.touches.length === 1 && lastTouchPosition) {
    // ドラッグ操作
    const currentPosition = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    };
    panX += currentPosition.x - lastTouchPosition.x;
    panY += currentPosition.y - lastTouchPosition.y;
    lastTouchPosition = currentPosition;
    updateTransform();
  }
});

zoomWrapper.addEventListener("touchend", () => {
  lastTouchDistance = 0;
  lastTouchPosition = null;
});

function resetAllPoints() {
  // 確認ダイアログを表示
  if (!confirm("すべてのポイントを削除してよろしいですか？")) {
    return;
  }

  // DOM 上のポイントを削除
  const pointElements = document.querySelectorAll(".area-point");
  pointElements.forEach((point) => point.remove());

  // 配列をクリア
  registeredPoints.length = 0;

  // ローカルストレージをクリア
  localStorage.removeItem("registeredPoints");

  // 情報を更新
  info.textContent = "すべてのポイントを削除しました。";
}

