// エフェクトリスト（動的にセレクトボックスに追加） applyStrikeEffect  applyImpactEffect
const effectsList = [
    { value: "斬撃", label: "斬撃", description: "鋭い線、アーク状の斜線", action: applySlashEffect },
    { value: "刺突", label: "刺突", description: "鋭い点やスパイク状", action: applyPierceEffect },
    { value: "殴打", label: "殴打", description: "円形や割れ目模様", action: applyImpactAttackEffect },
    { value: "盾", label: "盾", description: "半透明の防御フィールドや幾何学模様", action: applyShieldEffect },
    { value: "銃撃", label: "銃撃", description: "細い弾道のような線", action: applyGunshotEffect },
    { value: "射出", label: "射出", description: "矢や弾丸などの飛び道具状", action: applyProjectileEffect },
    { value: "火花", label: "火花", description: "細かい点や線が飛び散る", action: applySparkEffect },
    { value: "光線", label: "光線", description: "細い直線、レーザー", action: applyBeamEffect },
    { value: "爆発", label: "爆発", description: "円形、球形", action: applyExplosionEffect },
    { value: "広がる", label: "広がる", description: "波紋や矢印状、直線的な広がり", action: applyExpandEffect },
    { value: "渦", label: "渦", description: "渦巻きや回転流線", action: applyVortexEffect },
    { value: "球体", label: "球体", description: "完全な球形、光の玉", action: applySphereEffect },
    { value: "波紋", label: "波紋", description: "同心円の波模様", action: applyRippleEffect },
    { value: "雨", label: "雨", description: "細い粒子や小さな点", action: applyRainEffect },
    { value: "落石", label: "落石", description: "不規則な形の岩や破片", action: applyFallingRockEffect },
    { value: "揺れ", label: "揺れ", description: "画面や地面全体の揺れ", action: applyShakeEffect },
    { value: "燃え上がる", label: "燃え上がる", description: "火柱や炎の波", action: applyFireEffect },
    { value: "突風", label: "突風", description: "矢印状、流線型", action: applyCurvedGustEffect },
    { value: "割れ目", label: "割れ目", description: "地面のひび割れ模様", action: applyGlassCrackEffect },


    { value: "流星", label: "流星", description: "光る玉や燃え盛る石", action: applyMeteorEffect },
    { value: "サークル", label: "サークル", description: "魔法陣や幾何学模様", action: applyCircleEffect },
    { value: "波紋2", label: "波紋2", description: "曲線的な波や水しぶき", action: applyWaveEffect },
    { value: "鏡", label: "鏡", description: "ガラスの破片や光の反射", action: applyMirrorEffect },
    { value: "煙", label: "煙", description: "不透明な半透明の雲状", action: applySmokeEffect },
    { value: "水飛沫", label: "水飛沫", description: "水飛沫が起こす", action: applyWaterSplashEffect },
    { value: "波飛沫", label: "波飛沫", description: "波が起きて、飛沫が起きる", action: applyWaterfallEffect },

    { value: "稲妻", label: "稲妻", description: "", action: applyLightningEffect },
    { value: "稲妻中央", label: "稲妻中央", description: "", action: applyLightningEffect_2 },

    { value: "黒穴", label: "黒穴", description: "", action: applyBlackHoleWithRippleEffect },
    { value: "吸収", label: "吸収", description: "", action: applyBlackHoleWithRippleEffect2 },
    
    { value: "光が集まる", label: "光が集まる", description: "", action: applyReverseRippleEffect },
    { value: "氷の生成", label: "氷の生成", description: "", action: applyIceCrystalEffect },
    { value: "星屑の降下", label: "星屑の降下", description: "", action: applyFallingStarEffect },
    { value: "稲妻の衝撃", label: "稲妻の衝撃", description: "", action: applyLightningStrikeEffect },
    { value: "稲妻の直線", label: "稲妻の直線", description: "", action: applyElectricBeamEffect },
    { value: "稲妻の直線2", label: "稲妻の直線2", description: "", action: applyElectricBeamEffect_2 },
    { value: "ビーム屈折", label: "ビーム屈折", description: "", action: applyZigzagBeamEffect },
    
    { value: "燃え上がる炎", label: "燃え上がる炎", description: "", action: applyFlamingEffect },
    { value: "転移の扉", label: "転移の扉", description: "", action: applyBlackHoleEffect },
    { value: "粒子の点滅", label: "粒子の点滅", description: "", action: applyParticleRippleEffect },
    
    { value: "空間の裂け目", label: "空間の裂け目", description: "", action: applySpaceRiftEffect },
    
    { value: "オーラ持続", label: "オーラ持続", description: "", action: applyMovingAuraEffect },
  ];

// drawBeamOnly applyWindBladeEffect　 applyExplodingParticlesEffect(

// セレクトボックスを動的に生成
const effectTypeSelect = document.getElementById("effect-type");
effectsList.forEach(effect => {
  const option = document.createElement("option");
  option.value = effect.value;
  option.textContent = effect.label;
  effectTypeSelect.appendChild(option);
});

const defaultEffect = "斬撃"; // 初期値を設定
effectTypeSelect.value = defaultEffect;

// 選択されたエフェクトをトリガー
function triggerSelectedEffect() {
  const selectedValue = effectTypeSelect.value;
  const selectedEffect = effectsList.find(effect => effect.value === selectedValue);

  // ユーザー指定のパラメータを取得
  const size = parseInt(document.getElementById("size").value, 10) || 100;
  const speed = parseFloat(document.getElementById("speed").value) || 1;
  const color = document.getElementById("color").value || "#ffffff";
  const direction = document.getElementById("direction").value || "right";

  if (selectedEffect && selectedEffect.action) {
    selectedEffect.action(size, speed, color, direction); // パラメータを渡して関数を実行
  } else {
    console.log("未定義のエフェクトです。");
  }
}

// CanvasとAnime.jsのアニメーションを強制終了する関数
function stopAllAnimations() {
  // Canvasの全アニメーションを停止
  const canvasElements = document.querySelectorAll("canvas");
  canvasElements.forEach((canvas) => {
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    canvas.remove();
  });

  // Anime.jsの全アニメーションを停止
  if (anime) {
    anime.running.forEach((animation) => {
      animation.pause();
    });
  }

  console.log("すべてのCanvasとAnime.jsのアニメーションが停止しました。");
}


// HEXカラーコードをRGBに変換するユーティリティ関数
function hexToRgb(hex) {
    const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (!match) return "255,255,255"; // デフォルトは白
    return `${parseInt(match[1], 16)},${parseInt(match[2], 16)},${parseInt(match[3], 16)}`;
}
function darkenColor(color, amount) {
  // HEXをRGBに変換し、数値配列として取得
  const rgb = hexToRgb(color).split(",").map((c) => {
    const value = parseInt(c.trim(), 10) - amount; // 値を減算
    return Math.max(0, Math.min(255, value)); // 値を0~255の範囲に制限
  });

  // RGB形式に戻して返す
  return `rgb(${rgb.join(",")})`;
}

// 多角形を描画する関数
function drawPolygon(ctx, x, y, radius, sides, color) {
  ctx.beginPath();
  const angleStep = (Math.PI * 2) / sides;

  for (let i = 0; i < sides; i++) {
    const angle = angleStep * i;
    const px = x + radius * Math.cos(angle);
    const py = y + radius * Math.sin(angle);
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }

  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// 固定された多角形を描画する関数 (グラデーション付き)
function drawFixedPolygon(ctx, x, y, vertices, color) {
  // グラデーションの作成
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, Math.max(...vertices.map(v => Math.sqrt(v.x ** 2 + v.y ** 2))));
  const rgb = hexToRgb(color);

  gradient.addColorStop(0, `rgba(${rgb}, 1)`); // 中心 (明るい色)
  gradient.addColorStop(1, `rgba(${rgb}, 0.7)`); // 外側 (暗い色)

  ctx.beginPath();

  vertices.forEach((vertex, i) => {
    const px = x + vertex.x;
    const py = y + vertex.y;
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  });

  ctx.closePath();
  ctx.fillStyle = gradient; // グラデーションを適用
  ctx.fill();
}


// コンテナの反転を設定する関数
function setContainerTransform(container, direction) {
    if (!container) {
      console.error("コンテナが見つかりません");
      return;
    }
  
    // direction に基づく反転の設定
    if (direction === "horizontal-flip") {
      container.style.transform = "scaleX(-1)";
      console.log("コンテナが左右反転されました");
    } else if (direction === "vertical-flip") {
      container.style.transform = "scaleY(-1)";
      console.log("コンテナが上下反転されました");
    } else if (direction === "both") {
      container.style.transform = "scaleX(-1) scaleY(-1)";
      console.log("コンテナが上下左右反転されました");
    } else {
      container.style.transform = "";
      console.log("コンテナの反転が解除されました");
    }
}


function drawStar(ctx, x, y, outerRadius, innerRadius, points, color) {
  const angleStep = Math.PI / points; // 各頂点の角度

  ctx.beginPath();
  for (let i = 0; i < 2 * points; i++) {
    const angle = i * angleStep;
    const radius = i % 2 === 0 ? outerRadius : innerRadius; // 外側と内側を交互に切り替え
    const px = x + radius * Math.cos(angle);
    const py = y + radius * Math.sin(angle);
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
}
  


// ギザギザ付きの球体を描画する関数
function drawJaggedSphere(ctx, x, y, radius, color, jaggedHeight, jaggedPoints) {
  // 球体の基本部分を描画
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // 上部のギザギザを描画
  const startAngle = Math.PI; // ギザギザを描く範囲（上半分）
  const endAngle = 0; // 上半分の終わり
  const step = (endAngle - startAngle) / jaggedPoints; // ギザギザの間隔

  ctx.beginPath();
  let currentAngle = startAngle;

  for (let i = 0; i <= jaggedPoints; i++) {
    const pointX = x + Math.cos(currentAngle) * radius; // 円周上の点のX座標
    const pointY = y + Math.sin(currentAngle) * radius; // 円周上の点のY座標

    const nextX = x + Math.cos(currentAngle + step) * radius;
    const nextY = y + Math.sin(currentAngle + step) * radius;

    const jaggedX = (pointX + nextX) / 2; // ギザギザの山
    const jaggedY = (pointY + nextY) / 2 - jaggedHeight; // ギザギザの高さ

    ctx.lineTo(pointX, pointY); // 現在の点を描画
    ctx.lineTo(jaggedX, jaggedY); // ギザギザの山を描画

    currentAngle += step; // 次の点に進む
  }

  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}




