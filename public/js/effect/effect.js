const container = document.getElementById("effect-container");

function applySparkEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }

  // コンテナ反転の設定
  setContainerTransform(container, direction);

  // Canvas を作成して配置
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // パーティクル生成
  const particles = Array.from({ length: size / 5 }, () => ({
    x: canvas.width / 2,
    y: canvas.height / 2,
    vx: (Math.random() - 0.5) * 5 * (size / 100) * (speed * 6), // 速度を3倍
    vy: (Math.random() - 0.5) * 5 * (size / 100) * (speed * 6), // 速度を3倍
    radius: Math.random() * (size / 13),
    alpha: 1,
    life: Math.random() * 50 + 50, // ライフタイム
  }));

  // 爆発のグラデーション設定
  function createGradient(ctx, x, y, radius, color) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    const startColor = color;
    const endColor = generateEndColor(color);
    const rgbStart = hexToRgb(endColor);
    const rgbEnd = hexToRgb(startColor);

    gradient.addColorStop(0, `rgba(${rgbStart}, 1)`); // 中心（明るい色: 開始色）
    gradient.addColorStop(0.5, `rgba(${rgbEnd}, 0.5)`); // 中間（途中の色: 終了色）
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)"); // 外側（完全透明）

    return gradient;
  }


  // 描画関数
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((particle) => {
      if (particle.life > 0) {
        const gradient = createGradient(
          ctx,
          particle.x,
          particle.y,
          particle.radius * 2,
          color
        );

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // パーティクルの更新 (速度を3倍)
        particle.x += particle.vx; // X方向の速度
        particle.y += particle.vy; // Y方向の速度
        particle.radius *= 0.97; // 徐々に縮小
        particle.alpha -= 0.02 * (speed * 3); // 透明度の変化速度を3倍
        particle.life -= speed * 3; // ライフを3倍減少
      }
    });

    // 生存しているパーティクルがある場合は再描画
    if (particles.some((p) => p.life > 0)) {
      requestAnimationFrame(draw);
    } else {
      canvas.remove(); // すべてのパーティクルが消えたらキャンバスを削除
    }
  }

  draw();
}

function applyExplosionEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }

  // コンテナ反転の設定
  setContainerTransform(container, direction);

  // Canvas を作成して配置
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // サイズを1.5倍に設定
  size *= 1.5;

  // パーティクル生成
  const particles = Array.from({ length: size / 5 }, () => ({
    x: canvas.width / 2,
    y: canvas.height / 2,
    vx: (Math.random() - 0.5) * 5 * (size / 100), // 移動速度
    vy: (Math.random() - 0.5) * 5 * (size / 100), // 移動速度
    radius: Math.random() * (size / 10) + 5, // 半径
    alpha: 1,
    life: Math.random() * 50 + 50, // ライフタイム
    colorStop: Math.random(), // グラデーション位置
  }));

  // 爆発のグラデーション設定 (color を反映)
  function createGradient(ctx, x, y, radius, alpha) {
    const startColor = color;
    const endColor = generateEndColor(color);

    const rgbStart = hexToRgb(endColor);
    const rgbEnd = hexToRgb(startColor);

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

    // 中心色: 指定された色
    gradient.addColorStop(0, `rgba(${rgbStart}, ${alpha})`);

    // 中間色: グラデーションの途中で色を混ぜる
    gradient.addColorStop(0.5, `rgba(${rgbEnd}, ${alpha * 0.8})`);

    // 外側色: より暗い透明な色
    gradient.addColorStop(1, `rgba(0, 0, 0, ${alpha * 0.5})`);

    return gradient;
  }


  // 描画関数
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((particle) => {
      if (particle.life > 0) {
        const gradient = createGradient(
          ctx,
          particle.x,
          particle.y,
          particle.radius,
          particle.alpha
        );

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // パーティクルの更新 (速度を2倍に設定)
        particle.x += particle.vx * (speed * 2); // X方向の速度
        particle.y += particle.vy * (speed * 2); // Y方向の速度
        particle.radius *= 1.02; // パーティクルの拡大速度
        particle.alpha -= 0.03 * (speed * 2); // 徐々に透明になる
        particle.life -= speed * 2; // ライフをspeedで減少
      }
    });

    // 生存しているパーティクルがある場合は再描画
    if (particles.some((p) => p.life > 0)) {
      requestAnimationFrame(draw);
    } else {
      canvas.remove(); // すべてのパーティクルが消えたらキャンバスを削除
    }
  }

  draw();
}

function applyLaserEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }

  // コンテナ反転の設定
  setContainerTransform(container, direction);

  // Canvas を作成して配置
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // 閃光の設定
  const flash = {
    x: canvas.width / 2,
    y: 0,
    radius: size / 20, // 非常に小さな初期半径
    maxRadius: size, // 小さな最大半径
    alpha: 1,
  };

  // レーザーの設定
  const laser = {
    x: canvas.width / 2, // 中央のX座標 (水平位置)
    y: 0, // 上端のY座標 (初期位置)
    width: size / 12, // レーザーの太さ
    length: canvas.height * 2, // レーザーの長さ (画面高さの2倍)
    alpha: 1, // レーザーの透明度 (1は不透明)
    speedMultiplier: speed * 2, // 縦方向の速度倍率 (速度を調整)
  };

  // 残像エフェクト用の配列
  const trails = [];

  // 閃光を描画する関数
  function drawFlash() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (flash.radius < flash.maxRadius && flash.alpha > 0) {
      // 閃光のグラデーション
      const gradient = ctx.createRadialGradient(
        flash.x,
        flash.y,
        0,
        flash.x,
        flash.y,
        flash.radius
      );
      const rgb = hexToRgb(color);
      gradient.addColorStop(0, `rgba(${rgb}, ${flash.alpha})`);
      gradient.addColorStop(1, `rgba(${rgb}, 0)`);

      ctx.beginPath();
      ctx.arc(flash.x, flash.y, flash.radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // 閃光の更新
      flash.radius += speed * 3; // 半径を広げる
      flash.alpha -= 0.02 * speed; // 徐々に透明に
    } else {
      // 閃光が終わったらレーザーを発射
      requestAnimationFrame(drawLaser);
      return;
    }

    requestAnimationFrame(drawFlash);
  }

  // レーザーを描画する関数
  function drawLaser() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 残像を描画
    trails.forEach((trail, index) => {
      const gradient = ctx.createLinearGradient(
        trail.x,
        trail.y - trail.length / 2,
        trail.x,
        trail.y + trail.length / 2
      );
      const rgb = hexToRgb(color);
      gradient.addColorStop(0, `rgba(${rgb}, 0)`);
      gradient.addColorStop(0.5, `rgba(${rgb}, ${trail.alpha})`);
      gradient.addColorStop(1, `rgba(${rgb}, 0)`);

      ctx.beginPath();
      ctx.moveTo(trail.x, trail.y - trail.length / 2);
      ctx.lineTo(trail.x, trail.y + trail.length / 2);
      ctx.lineWidth = trail.width;
      ctx.strokeStyle = gradient;
      ctx.stroke();

      // 残像を徐々に薄くする
      trail.alpha -= 0.05;
      trail.width *= 0.9;

      // 残像が完全に透明になったら削除
      if (trail.alpha <= 0) {
        trails.splice(index, 1);
      }
    });

    // 新しいレーザーを描画
    if (laser.y < canvas.height) {
      const gradient = ctx.createLinearGradient(
        laser.x,
        laser.y - laser.length / 2,
        laser.x,
        laser.y + laser.length / 2
      );
      const rgb = hexToRgb(color);
      gradient.addColorStop(0, `rgba(${rgb}, 0)`);
      gradient.addColorStop(0.5, `rgba(${rgb}, ${laser.alpha})`);
      gradient.addColorStop(1, `rgba(${rgb}, 0)`);

      ctx.beginPath();
      ctx.moveTo(laser.x, laser.y - laser.length / 2);
      ctx.lineTo(laser.x, laser.y + laser.length / 2);
      ctx.lineWidth = laser.width;
      ctx.strokeStyle = gradient;
      ctx.stroke();

      // 現在のレーザーの状態を残像として保存
      trails.push({ ...laser });

      // レーザーの更新 (上から下に移動)
      laser.y += 10 * laser.speedMultiplier; // 縦方向に進む速度
      laser.width *= 0.95; // 徐々に細くなる
      laser.alpha -= 0.01 * laser.speedMultiplier; // 徐々に透明になる
    } else {
      canvas.remove(); // レーザーが画面外に到達したら削除
      return;
    }

    requestAnimationFrame(drawLaser);
  }

  // 初期は閃光を描画
  drawFlash();
}

function applyVortexEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }

  // コンテナ反転の設定
  setContainerTransform(container, direction);

  // Canvas を作成して配置
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // パーティクル生成 (大きさ1.5倍に調整)
  const particles = Array.from({ length: size * 2 }, () => ({
    x: canvas.width / 2,
    y: canvas.height / 2,
    angle: Math.random() * Math.PI * 2, // 初期角度 (ランダム)
    radius: 0, // 初期半径
    maxRadius: Math.random() * (canvas.width / 1) + canvas.width / 2, // 最大半径 (1.5倍)
    speed: (Math.random() * 2 + 1) * (speed * 4), // 回転速度 (2倍)
    alpha: 1, // 透明度
    life: Math.random() * 100 + 100, // 寿命 (長め)
  }));

  // 描画関数
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((particle, index) => {
      if (particle.life > 0) {
        // 渦の位置計算 (極座標からデカルト座標への変換)
        particle.radius += particle.speed * 0.2; // 半径を徐々に増加 (調整)
        particle.angle += particle.speed * 0.02; // 角度を回転
        particle.x =
          canvas.width / 2 + Math.cos(particle.angle) * particle.radius;
        particle.y =
          canvas.height / 2 + Math.sin(particle.angle) * particle.radius;

        // グラデーションを設定
        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.radius / 8 // パーティクルのサイズ調整
        );
        const startColor = color;
        const endColor = generateEndColor(color);
        const rgbStart = hexToRgb(endColor);
        const rgbEnd = hexToRgb(startColor);

        gradient.addColorStop(0, `rgba(${rgbStart}, ${particle.alpha})`); // 中心 (開始色)
        gradient.addColorStop(0.5, `rgba(${rgbEnd}, ${particle.alpha * 0.8})`); // 中間 (終了色)
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)"); // 外側 (完全透明)

        // パーティクルを描画
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius / 8, 0, Math.PI * 2); // サイズ拡大
        ctx.fillStyle = gradient;
        ctx.fill();

        // パーティクルの透明度と寿命を更新
        particle.alpha -= 0.005 * (speed * 2); // 徐々に透明に (減少速度調整)
        particle.life -= speed * 2; // 寿命を減少

        // パーティクルが寿命を迎えたら削除
        if (particle.life <= 0) {
          particles.splice(index, 1);
        }
      }
    });

    // 生存しているパーティクルがある場合は再描画
    if (particles.length > 0) {
      requestAnimationFrame(draw);
    } else {
      canvas.remove(); // すべてのパーティクルが消えたらキャンバスを削除
    }
  }


  draw();
}

function applyExpandEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }

  // コンテナ反転の設定
  setContainerTransform(container, direction);

  // Canvas を作成して配置
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // 球体の設定
  const sphere = {
    x: canvas.width / 2, // 中央のX座標
    y: canvas.height / 2, // 中央のY座標
    radius: size, // 初期の半径
    maxRadius: size * 5, // 最大半径 (大きく広がる)
    alpha: 1, // 初期透明度
  };

  // 描画関数
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (sphere.radius < sphere.maxRadius && sphere.alpha > 0) {
      // グラデーションを作成
      const gradient = ctx.createRadialGradient(
        sphere.x,
        sphere.y,
        0, // 中心からの開始半径
        sphere.x,
        sphere.y,
        sphere.radius // 現在の半径
      );
      const rgb = hexToRgb(color);

      gradient.addColorStop(0, `rgba(${rgb}, ${sphere.alpha})`); // 中心: 明るい色
      gradient.addColorStop(0.7, `rgba(${rgb}, ${sphere.alpha * 0.5})`); // 中間: 薄くなる
      gradient.addColorStop(1, `rgba(${rgb}, 0)`); // 外側: 完全透明

      // 球体を描画
      ctx.beginPath();
      ctx.arc(sphere.x, sphere.y, sphere.radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // 球体の更新
      sphere.radius += speed * 5; // 半径を拡大
      sphere.alpha -= 0.01 * speed; // 透明度を減少
    } else {
      canvas.remove(); // 球体が消えるときにCanvasを削除
      return;
    }

    requestAnimationFrame(draw);
  }

  draw();
}

function applySphereEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }

  // コンテナ反転の設定
  setContainerTransform(container, direction);

  // Canvas を作成して配置
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // 球体の設定
  const sphere = {
    x: canvas.width / 2, // 中央のX座標
    y: 0, // 初期位置 (上端)
    vx: 0, // X方向の速度は0 (中央固定)
    vy: speed * 20, // Y方向の速度 (上から下)
    radius: size / 4, // 初期半径
    maxRadius: size * 1.5, // 最大半径 (3倍に拡大)
    alpha: 1, // 初期透明度
  };

  // 描画関数
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (sphere.y - sphere.radius < canvas.height && sphere.alpha > 0) {
      // グラデーションを作成
      const gradient = ctx.createRadialGradient(
        sphere.x,
        sphere.y,
        0, // 中心からの開始半径
        sphere.x,
        sphere.y,
        Math.max(sphere.radius, 1) // 半径 (0を回避)
      );
      const rgb = hexToRgb(color);

      gradient.addColorStop(0, `rgba(${rgb}, ${sphere.alpha})`); // 中心: 明るい色
      gradient.addColorStop(0.7, `rgba(${rgb}, ${sphere.alpha * 0.5})`); // 中間: 薄くなる
      gradient.addColorStop(1, `rgba(${rgb}, 0)`); // 外側: 完全透明

      // 球体を描画
      ctx.beginPath();
      ctx.arc(sphere.x, sphere.y, sphere.radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // 球体の更新 (位置とサイズ)
      sphere.y += sphere.vy; // Y方向に移動
      sphere.radius += (sphere.maxRadius - sphere.radius) * 0.05; // 半径を徐々に拡大
      sphere.alpha -= 0.01 * speed; // 透明度を減少
    } else {
      canvas.remove(); // 球体が消えるときにCanvasを削除
      return;
    }

    requestAnimationFrame(draw);
  }

  draw();
}

function applyRippleEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }

  // コンテナ反転の設定
  setContainerTransform(container, direction);

  // Canvas を作成して配置
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // 波紋の設定
  const ripples = [];
  const maxDuration = 1000 / speed; // エフェクトの持続時間 (ms)
  const startTime = Date.now(); // エフェクト開始時刻

  // 初期波紋を追加
  ripples.push({
    x: canvas.width / 2, // 中心のX座標
    y: canvas.height / 2, // 中心のY座標
    radius: size / 3, // 初期半径
    alpha: 1, // 初期透明度
    lineWidth: size / 20, // 波紋の線の幅
  });

  // 波紋を生成する関数
  function createRipple() {
    ripples.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      radius: size,
      alpha: 1,
      lineWidth: size / 20,
    });
  }

  // `speed` に基づいた波紋生成間隔を計算
  const rippleIntervalTime = Math.max(100, 1000 / speed); // 最短間隔を100msに制限
  const rippleInterval = setInterval(() => {
    // 持続時間を超えたら波紋生成を停止
    if (Date.now() - startTime > maxDuration) {
      clearInterval(rippleInterval);
    } else {
      createRipple();
    }
  }, rippleIntervalTime);

  // 描画関数
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ripples.forEach((ripple, index) => {
      if (ripple.alpha > 0) {
        // 波紋の描画
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.lineWidth = ripple.lineWidth;
        const rgb = hexToRgb(color);
        ctx.strokeStyle = `rgba(${rgb}, ${ripple.alpha})`;
        ctx.stroke();

        // 波紋の更新
        ripple.radius += speed * 5; // 半径を拡大
        ripple.alpha -= 0.02 * speed; // 徐々に透明に
        ripple.lineWidth *= 0.98; // 線の幅を縮小
      } else {
        ripples.splice(index, 1); // 透明度が0以下になった波紋を削除
      }
    });

    // 波紋がなくなり、かつエフェクトの持続時間を超えた場合、エフェクトを終了
    if (ripples.length === 0 && Date.now() - startTime > maxDuration) {
      canvas.remove();
      return;
    }

    requestAnimationFrame(draw);
  }

  draw();
}


function applySlashEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }

  // コンテナ反転の設定
  setContainerTransform(container, direction);

  // Canvas を作成して配置
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // 斬撃の設定
  const slash = {
    x1: canvas.width / 2 - size * 2, // 始点のX座標
    y1: canvas.height / 2 - size, // 始点のY座標
    x2: canvas.width / 2 + size * 2, // 終点のX座標
    y2: canvas.height / 2 + size, // 終点のY座標
    alpha: 1, // 初期透明度
    lineWidth: size / 10, // 線の太さ (中央での最大値)
  };

  // 描画関数
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (slash.alpha > 0) {
      // グラデーションを作成
      const gradient = ctx.createLinearGradient(slash.x1, slash.y1, slash.x2, slash.y2);
      const rgb = hexToRgb(color);
      gradient.addColorStop(0, `rgba(${rgb}, 0)`); // 端は透明
      gradient.addColorStop(0.5, `rgba(${rgb}, ${slash.alpha})`); // 中央で最も明るい
      gradient.addColorStop(1, `rgba(${rgb}, 0)`); // 端は透明

      // 斬撃の描画
      ctx.beginPath();
      ctx.strokeStyle = gradient;
      ctx.lineWidth = slash.lineWidth;
      ctx.moveTo(slash.x1, slash.y1);
      ctx.lineTo(slash.x2, slash.y2);
      ctx.stroke();

      // 斬撃の更新
      slash.alpha -= 0.02 * speed; // 透明度を減少
      slash.lineWidth *= 0.95; // 線の幅を縮小
    } else {
      canvas.remove(); // 斬撃が消えたらキャンバスを削除
      return;
    }

    requestAnimationFrame(draw);
  }

  draw();
}

function drawDiamond(ctx, x, y, size, alpha, color) {
  ctx.save();
  ctx.globalAlpha = alpha;

  // ダイヤ形状を描画 (角が↘を向くように回転)
  ctx.translate(x, y); // 中心を移動 (ダイヤ形状の中心に合わせる)
  ctx.rotate(Math.PI / 4 * 3); // 45度回転 (ラジアン値で指定)

  // グラデーションの作成
  const gradient = ctx.createLinearGradient(-size / 4, 0, size / 4, 0);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)"); // 左端 (明るい)
  gradient.addColorStop(0.5, color); // 中央 (指定色)
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)"); // 右端 (透明)

  // 傾けた状態でダイヤ形状を描画
  ctx.beginPath();
  ctx.moveTo(0, -size / 2); // 上頂点
  ctx.lineTo(size / 4, 0); // 右頂点 (幅を狭く)
  ctx.lineTo(0, size / 2); // 下頂点
  ctx.lineTo(-size / 4, 0); // 左頂点 (幅を狭く)
  ctx.closePath();

  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.restore(); // 状態を元に戻す
}

function applySlashEffect_2(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }
  size = size * 0.5
  speed = speed * 12.0
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  const diamond = {
    x: 0, // 初期位置X
    y: 0, // 初期位置Y
    size: size, // ダイヤのサイズ
    alpha: 1, // 透明度
    scale: 1, // 拡大率
    isShrinking: false, // 縮小フラグ
  };

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const trails = []; // 残像リスト
  let frameCounter = 0; // フレームカウント

  function drawDiamond(ctx, x, y, size, alpha, color) {
    ctx.save();
    ctx.globalAlpha = alpha;

    // ダイヤ形状を描画
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4 * 3);

    // グラデーション作成
    const gradient = ctx.createLinearGradient(-size / 4, 0, size / 4, 0);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.5, color);
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    // ダイヤを描画
    ctx.beginPath();
    ctx.moveTo(0, -size / 2);
    ctx.lineTo(size / 4, 0);
    ctx.lineTo(0, size / 2);
    ctx.lineTo(-size / 4, 0);
    ctx.closePath();

    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 残像描画
    trails.forEach((trail, index) => {
      if (trail.alpha > 0) {
        drawDiamond(ctx, trail.x, trail.y, trail.size * trail.scale, trail.alpha, trail.color);
        trail.alpha -= 0.02;
        trail.scale *= 0.98;
      } else {
        trails.splice(index, 1);
      }
    });

    if (diamond.alpha > 0) {
      // ダイヤ描画
      drawDiamond(ctx, diamond.x, diamond.y, diamond.size * diamond.scale, diamond.alpha, color);

      // 中央を超えたかチェック
      if (!diamond.isShrinking && diamond.x >= centerX && diamond.y >= centerY) {
        diamond.isShrinking = true;
      }

      // サイズ更新
      if (diamond.isShrinking) {
        diamond.scale *= 0.98; // 縮小
      } else {
        diamond.scale *= 1.02; // 拡大
      }

      // 透明度更新（中央を超えたら減少開始）
      if (diamond.isShrinking) {
        diamond.alpha -= 0.005;
      }

      // ダイヤの移動
      diamond.x += speed;
      diamond.y += speed;

      // 残像の間隔をフレームで制御
      frameCounter++;
      const interval = Math.max(5, 6 / speed); // speed に応じて間隔を調整
      if (frameCounter >= interval) {
        trails.push({
          x: diamond.x,
          y: diamond.y,
          size: diamond.size,
          alpha: diamond.alpha * 0.8,
          scale: diamond.scale * 0.8,
          color: color,
        });
        frameCounter = 0; // フレームカウントリセット
      }
    } else if (trails.length === 0) {
      canvas.remove(); // 全ての残像が消えたらキャンバス削除
      return;
    }

    requestAnimationFrame(draw);
  }

  // 初期位置設定
  diamond.x = -diamond.size;
  diamond.y = -diamond.size;

  draw();
}













function applyProjectileEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }

  // コンテナ反転の設定
  setContainerTransform(container, direction);
  speed = speed * 4
  // Canvas を作成して配置
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // 棘 (三角形) の初期設定
  const projectile = {
    x: canvas.width / 2, // 中央から発射
    y: canvas.height, // 初期Y座標 (画面下端)
    width: size / 5, // 三角形の幅
    height: size / 2, // 三角形の高さ
    alpha: 1, // 初期透明度
    velocityY: speed * 10, // 上方向への固定速度
  };

  const trail = {
    x: projectile.x, // 線のX位置（棘と同じ位置）
    yStart: projectile.y, // 線の開始Y位置
    yEnd: projectile.y, // 線の終了Y位置（棘の現在位置）
    alpha: 1, // 線の透明度
    width: size * 0.04, // 線の幅
  };
  
// 描画関数
function draw() {
  // キャンバス全体をクリアする（残像を線のみにするため）
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 棘の形状を描画
  if (projectile.alpha > 0) {
    ctx.beginPath();

    const spikes = 6; // ギザギザの数
    const spikeHeight = projectile.height / 3; // ギザギザの高さ
    const spikeWidth = projectile.width / spikes; // 各ギザギザの幅

    // 最初の点 (上方向の頂点)
    ctx.moveTo(projectile.x, projectile.y - projectile.height);

    // ギザギザを描く
    for (let i = 0; i <= spikes; i++) {
      const x = projectile.x - projectile.width / 2 + spikeWidth * i;
      const y =
        i % 2 === 0
          ? projectile.y // 偶数番目は底辺 (棘の根元)
          : projectile.y - projectile.height + spikeHeight; // 奇数番目はギザギザの山頂

      ctx.lineTo(x, y);
    }

    // 最後の点 (右下の終点)
    ctx.lineTo(projectile.x + projectile.width / 2, projectile.y);
    ctx.closePath();

    // 棘の色と透明度の適用
    const rgb = hexToRgb(color);
    ctx.fillStyle = `rgba(${rgb}, ${projectile.alpha})`;
    ctx.fill();

    // 棘の移動
    projectile.y -= projectile.velocityY; // 上方向に移動
    projectile.alpha -= 0.02; // 徐々に透明化
  }

  // 線の残像を描画
  const rgb = hexToRgb(color);
  const lineSpacing = 8; // 二本線の間隔（ピクセル単位）

  // 1本目の線（左側）
  if (trail.alpha > 0) {
    ctx.beginPath();
    ctx.moveTo(trail.x - lineSpacing / 2, trail.yStart); // 左側にオフセット
    ctx.lineTo(trail.x - lineSpacing / 2, trail.yEnd);
    ctx.lineWidth = trail.width; // 線の幅を設定
    ctx.strokeStyle = `rgba(${rgb}, ${trail.alpha})`; // 透明度を適用
    ctx.stroke();

    // 2本目の線（右側）
    ctx.beginPath();
    ctx.moveTo(trail.x + lineSpacing / 2, trail.yStart); // 右側にオフセット
    ctx.lineTo(trail.x + lineSpacing / 2, trail.yEnd);
    ctx.lineWidth = trail.width; // 線の幅を設定
    ctx.strokeStyle = `rgba(${rgb}, ${trail.alpha})`; // 透明度を適用
    ctx.stroke();

    // 線の更新
    trail.yEnd = projectile.y; // 線の終了位置を棘に追従
    trail.alpha -= 0.02; // 徐々に透明化
  }

  // 棘と線が消えたら終了
  if (
    (projectile.alpha <= 0 || projectile.y + projectile.height < 0) &&
    (trail.alpha <= 0)
  ) {
    canvas.remove();
    return;
  }

  requestAnimationFrame(draw);
}

  

  draw();
}

// 5つの球体が回転
function applyImpactEffect2(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }

  // コンテナ反転の設定
  setContainerTransform(container, direction);

  // Canvas を作成して配置
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // 球体のパラメータ
  const particles = Array.from({ length: 5 }, (_, i) => ({
    angle: (i / 5) * Math.PI * 2, // 弧の初期角度 (0～2π)
    radius: size * 0.5, // 球体が描く軌道の半径
    x: canvas.width / 2, // 初期位置 (中央)
    y: canvas.height / 2, // 初期位置 (中央)
    ballRadius: size / 10, // 球体の大きさ
    alpha: 1, // 初期透明度
    color: color, // 球体の色
  }));

  // 描画関数
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((particle) => {
      if (particle.alpha > 0) {
        // 球体の位置を計算 (弧を描く)
        particle.x = canvas.width / 2 + Math.cos(particle.angle) * particle.radius;
        particle.y = canvas.height / 2 + Math.sin(particle.angle) * particle.radius;

        // 描画
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.ballRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${hexToRgb(particle.color)}, ${particle.alpha})`;
        ctx.fill();

        // 更新
        particle.angle += 0.05 * speed; // 弧を描く速度
        particle.radius += 1 * speed; // 軌道半径を広げる
        particle.alpha -= 0.01 * speed; // 徐々に透明になる
      }
    });

    // パーティクルがまだ存在している場合は再描画
    if (particles.some((p) => p.alpha > 0)) {
      requestAnimationFrame(draw);
    } else {
      canvas.remove(); // 全て消えたらキャンバスを削除
    }
  }

  draw();
}

// function applyImpactEffect(size, speed, color, direction) {
//   const container = document.getElementById("effect-container");
//   if (!container) {
//     console.error("エフェクトコンテナが見つかりません (#effect-container)");
//     return;
//   }
//   size = size * 3.00
//   speed = speed * 2.50
//   // コンテナ反転の設定
//   setContainerTransform(container, direction);

//   // Canvas を作成して配置
//   const canvas = document.createElement("canvas");
//   canvas.width = container.offsetWidth;
//   canvas.height = container.offsetHeight;
//   canvas.style.position = "absolute";
//   canvas.style.top = "0";
//   canvas.style.left = "0";
//   container.appendChild(canvas);
//   const ctx = canvas.getContext("2d");

// // 球体の初期パラメータ
// const particle = {
//   angle: 60, // 初期角度 (60度をラジアンに変換)
//   radius: 110, // 軌道の半径
//   x: canvas.width / 2, // 初期X位置 (中央)
//   y: canvas.height / 2, // 初期Y位置 (中央)
//   ballRadius: size / 10, // 球体の大きさ
//   alpha: 1, // 初期透明度
//   traveledAngle: 0, // 移動した角度を追跡する
// };

// // 残像用の配列
// const trails = [];

// // 描画関数
// function draw() {
//   ctx.clearRect(0, 0, canvas.width, canvas.height);

//   // 球体の位置を計算 (弧を描く)
//   if (particle.traveledAngle < Math.PI) {
//     particle.x = canvas.width / 2 + Math.cos(particle.angle) * particle.radius;
//     particle.y = canvas.height / 2 + Math.sin(particle.angle) * particle.radius;

//     // // 棘を描画
//     // const spikes = 0; // 棘の数
//     // const spikeLength = particle.ballRadius * 1.5; // 棘の長さ
//     // const spikeAngleOffset = Math.PI / 3; // 棘の広がり角度

//     // for (let i = 0; i < spikes; i++) {
//     //   const spikeAngle =
//     //     particle.angle + Math.PI + (i - spikes / 2) * spikeAngleOffset;

//     //   const spikeStartX = particle.x;
//     //   const spikeStartY = particle.y;

//     //   const spikeEndX = particle.x + Math.cos(spikeAngle) * spikeLength;
//     //   const spikeEndY = particle.y + Math.sin(spikeAngle) * spikeLength;

//     //   ctx.beginPath();
//     //   ctx.moveTo(spikeStartX, spikeStartY);
//     //   ctx.lineTo(spikeEndX, spikeEndY);
//     //   ctx.strokeStyle = `rgba(${hexToRgb(color)}, ${particle.alpha})`;
//     //   ctx.lineWidth = 4; // 棘の太さ
//     //   ctx.stroke();
//     // }

//     // 球体を描画
//     ctx.beginPath();
//     ctx.arc(particle.x, particle.y, particle.ballRadius, 0, Math.PI * 2);
//     ctx.fillStyle = `rgba(${hexToRgb(color)}, ${particle.alpha})`;
//     ctx.fill();

//     // 描画関数内の更新
//     particle.angle += 0.05 * speed; // 弧を描く速度
//     particle.traveledAngle += 0.05 * speed; // 移動した角度を更新
//     particle.ballRadius *= 1.04; // 球体を少しずつ大きくする

//     // 残像を追加
//     trails.push({
//       x: particle.x,
//       y: particle.y,
//       radius: particle.ballRadius,
//       alpha: particle.alpha,
//     });
//   }

//   // 残像を描画
//   for (let i = trails.length - 1; i >= 0; i--) { // 逆順でループ
//     const trail = trails[i];
//     ctx.beginPath();
//     ctx.arc(trail.x, trail.y, trail.radius, 0, Math.PI * 2);
//     ctx.fillStyle = `rgba(${hexToRgb(color)}, ${trail.alpha})`;
//     ctx.fill();

//     // 残像の透明度を減少
//     trail.alpha -= 0.02;
//     if (trail.alpha <= 0) {
//       trails.splice(i, 1); // 完全に透明になった残像を削除
//     }
//   }

//   // 球体が180度未満を移動している場合のみ描画を続ける
//   if (particle.traveledAngle < Math.PI || trails.length > 0) {
//     requestAnimationFrame(draw);
//   } else {
//     console.log("エフェクト終了"); // デバッグ用
//   }
// }

// draw();

// }

// speed = speed * 6.00
function applyMeteorEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }
  speed = speed * 12.00
  size = size * 3
  // コンテナの反転を設定
  setContainerTransform(container, direction);

  // Canvas を作成して配置
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // 流星の初期パラメータ
  const meteor = {
    x: canvas.width + size, // 画面右外のスタート位置
    y: -size, // 画面外上部のスタート位置
    radius: size / 7, // 流星の大きさ (大きく調整)
    vx: -(canvas.width + size) / (canvas.height + size) * speed, // X方向の速度
    vy: speed, // Y方向の速度
    trail: [], // 残像を管理
    trailCount: 30, // 残像の本数を増加
  };

  // 描画関数
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 流星を描画
    ctx.beginPath();
    ctx.arc(meteor.x, meteor.y, meteor.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${hexToRgb(color)}, 1)`; // 流星の色
    ctx.fill();

    // 流星の位置を更新
    meteor.x += meteor.vx; // X方向に移動
    meteor.y += meteor.vy; // Y方向に移動
    meteor.radius = Math.max(size / 15, meteor.radius * 0.98); // 徐々に縮小

    // 残像を追加 (大きな残像)
    meteor.trail.push({ x: meteor.x, y: meteor.y, alpha: 1, radius: meteor.radius });

    // 残像の本数を制限
    if (meteor.trail.length > meteor.trailCount) {
      meteor.trail.shift(); // 古い残像を削除
    }

    // 残像を描画
    for (let i = 0; i < meteor.trail.length; i++) {
      const trail = meteor.trail[i];
      ctx.beginPath();
      ctx.arc(
        trail.x,
        trail.y,
        trail.radius * (1 + i / meteor.trail.length), // 残像を大きく調整
        0,
        Math.PI * 2
      );
      ctx.fillStyle = `rgba(${hexToRgb(color)}, ${trail.alpha})`;
      ctx.fill();

      // 残像の透明度を減少
      trail.alpha -= 0.03; // 少し速く透明化
    }

    // 流星が画面左下に到達したら終了
    if (meteor.y > canvas.height + size && meteor.x < -size) {
      console.log("流星が完全に画面外に出ました。キャンバス削除"); // デバッグ用
      canvas.remove();
    } else {
      requestAnimationFrame(draw);
    }
  }

  draw();
}


function applyImpactEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }

  // コンテナの反転を設定
  setContainerTransform(container, direction);

  // Canvas を作成して配置
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  speed = speed * 3.0;
  size = size * 1.25;

  // 球体の初期パラメータ
  const impact = {
    angle: (180 * Math.PI) / 180, // 弧の初期角度 (60度をラジアンに変換)
    traveledAngle: 0, // 移動した角度を追跡
    radius: size / 1.5, // 弧の半径 (中心からの距離)
    x: canvas.width / 2, // 画面中央 (X)
    y: canvas.height / 2, // 画面中央 (Y)
    ballRadius: size / 10, // 球体の大きさ
    trail: [], // 残像を管理
    trailCount: 20, // 残像の本数
  };

  // 描画関数
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 球体の位置を計算 (弧を描く)
    impact.x = canvas.width / 2 + Math.cos(impact.angle) * impact.radius;
    impact.y = canvas.height / 2 + Math.sin(impact.angle) * impact.radius;

    // 球体を描画
    ctx.beginPath();
    ctx.arc(impact.x, impact.y, impact.ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${hexToRgb(color)}, 1)`; // 球体の色
    ctx.fill();

    // 球体の半径を徐々に拡大
    impact.ballRadius *= 1.12;

    // 描画関数内の更新
    impact.angle += 0.05 * speed; // 弧を描く速度
    impact.traveledAngle += 0.05 * speed; // 移動した角度を更新
    impact.radius += 0.5 * speed; // 半径を徐々に広げる

    // 残像を追加
    impact.trail.push({ x: impact.x, y: impact.y, alpha: 1, radius: impact.ballRadius });

    // 残像の本数を制限
    if (impact.trail.length > impact.trailCount) {
      impact.trail.shift(); // 古い残像を削除
    }

    // 残像を描画
    for (let i = 0; i < impact.trail.length; i++) {
      const trail = impact.trail[i];
      ctx.beginPath();
      ctx.arc(
        trail.x,
        trail.y,
        trail.radius * (1.5 - i / impact.trail.length), // 残像を大きめに調整
        0,
        Math.PI * 2
      );
      ctx.fillStyle = `rgba(${hexToRgb(color)}, ${trail.alpha})`;
      ctx.fill();

      // 残像の透明度を減少
      trail.alpha -= 0.03;
    }

    // 終了条件: 180度移動したら炸裂エフェクトを呼び出し
    if (impact.traveledAngle >= Math.PI) {
      console.log("弧エフェクト終了。炸裂エフェクトを開始します。"); // デバッグ用
      canvas.remove(); // 現在のキャンバスを削除
      applyFragmentEffect(size, speed, color, impact.x, impact.y); // 炸裂エフェクトを開始
    } else {
      requestAnimationFrame(draw);
    }
  }

  draw();
}

// 炸裂エフェクト 火花が散る
function applyFragmentEffect2(size, speed, color, x, y) {
  const container = document.getElementById("effect-container");
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  const particles = Array.from({ length: 30 }, () => ({
    x,
    y,
    radius: Math.random() * (size / 30) + size / 40,
    vx: (Math.random() - 0.5) * size * speed, // 速度を反映
    vy: (Math.random() - 0.5) * size * speed, // 速度を反映
    alpha: 1,
  }));

  function drawExplosion() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((p) => {
      if (p.alpha > 0) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${hexToRgb(color)}, ${p.alpha})`;
        ctx.fill();

        // 更新
        p.x += p.vx * 0.1; // X方向の移動速度を反映
        p.y += p.vy * 0.1; // Y方向の移動速度を反映
        p.alpha -= 0.02; // 徐々に透明化
      }
    });

    if (particles.some((p) => p.alpha > 0)) {
      requestAnimationFrame(drawExplosion);
    } else {
      console.log("炸裂エフェクト終了。キャンバス削除"); // デバッグ用
      canvas.remove();
    }
  }

  drawExplosion();
}

function applyShieldEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }

  setContainerTransform(container, direction);

  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // 盾のデータ
  const shield = {
    x: canvas.width / 2, // 中央に配置 (X)
    y: canvas.height / 2, // 中央に配置 (Y)
    size,
    shineProgress: 0, // 光沢の進行度
    shakeOffset: 0, // 揺れのオフセット
    shakeIntensity: 5, // 揺れの強さ
    shakeDirection: 1, // 揺れの方向 (正負切り替え)
    sparksTriggered: false, // 火花のエフェクトが開始されたかどうか
  };

  const shieldPath = new Path2D(
    "M 0 -120 L 80 -60 L 50 80 L 0 120 L -50 80 L -80 -60 Z"
  );
  let isWaiting = true;

  setTimeout(() => {
    isWaiting = false;
  }, 1000 / speed); // 1秒待機

  
  function drawShield() {
    if (!shield.waitComplete) {
      // 待機中は盾のみを描画
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(shield.x, shield.y);
      ctx.scale(shield.size / 100, shield.size / 100); // サイズ調整
      ctx.fillStyle = darkenColor(color, 50); // 少し暗い色にする
      ctx.fill(shieldPath);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255, 255, 255, 1)";
      ctx.stroke(shieldPath);
      ctx.restore();
    
      // 待機完了フラグを設定
      setTimeout(() => {
        shield.waitComplete = true; // 待機が完了
      }, 500 / speed); // 1秒待機
    
      requestAnimationFrame(drawShield); // 次のフレームを描画
      return; // 揺れや火花は描画せず待機終了までここで止める
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 揺れのオフセットを適用して盾を描画
    ctx.save();
    ctx.translate(shield.x + shield.shakeOffset, shield.y);
    ctx.scale(shield.size / 100, shield.size / 100); // サイズ調整
    ctx.fillStyle = darkenColor(color, 50); // 少し暗い色にする
    ctx.fill(shieldPath);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255, 255, 255, 1)";
    ctx.stroke(shieldPath);
    ctx.restore();
    
  
    // 火花をトリガー
    if (!shield.sparksTriggered) {
      applyFragmentEffect(shield.size, speed*3 , color, shield.x, shield.y); // 火花エフェクトを開始
      shield.sparksTriggered = true; // 一度だけ実行
    }
  
    // 揺らしエフェクトを更新
    shield.shakeOffset += shield.shakeDirection * shield.shakeIntensity;
    shield.shakeDirection *= -1; // 揺れ方向を反転
    shield.shakeIntensity *= 0.9; // 揺れの強さを徐々に減少
  
    // 揺れが終了したらキャンバスを削除
    if (shield.shakeIntensity < 0.1) {
      console.log("盾エフェクト終了。キャンバス削除");
      canvas.remove();
    } else {
      requestAnimationFrame(drawShield);
    }
  }
  

  drawShield();
}


function applyFragmentEffect(size, speed, color, x, y) {
  const container = document.getElementById("effect-container");
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  const particles = Array.from({ length: 30 }, () => ({
    x,
    y,
    radius: Math.random() * (size / 30) + size / 40,
    vx: (Math.random() - 0.5) * size * speed, // 速度を反映
    vy: (Math.random() - 0.5) * size * speed, // 速度を反映
    alpha: 1,
  }));

  function drawExplosion() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 火花の描画
    particles.forEach((p) => {
      if (p.alpha > 0) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${hexToRgb(color)}, ${p.alpha})`;
        ctx.fill();

        // 火花の動きを更新
        p.x += p.vx * 0.1; // X方向の移動速度を反映
        p.y += p.vy * 0.1; // Y方向の移動速度を反映
        p.alpha -= 0.02; // 徐々に透明化
      }
    });

    // 火花が全て透明になるまで描画を継続
    if (particles.some((p) => p.alpha > 0)) {
      requestAnimationFrame(drawExplosion);
    } else {
      console.log("炸裂エフェクト終了。キャンバス削除"); // デバッグ用
      canvas.remove(); // 火花のキャンバスだけを削除
    }
  }

  drawExplosion();
}

function applyShieldEffect_2(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }

  setContainerTransform(container, direction);

  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  const shield = {
    x: canvas.width / 2, // 中央に配置 (X)
    y: canvas.height / 2, // 中央に配置 (Y)
    radius: size / 2, // 盾の半径
    shineAlpha: 0.6, // 光沢の透明度
  };

  const shieldPath = new Path2D(
    "M -50 -120 L 50 -120 L 90 -60 L 50 100 L -50 100 L -90 -60 Z"
  );

  function drawShield() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 盾を描画
    ctx.save();
    ctx.translate(shield.x, shield.y);
    ctx.scale(shield.radius / 100, shield.radius / 100); // サイズ調整
    ctx.fillStyle = color;
    ctx.fill(shieldPath);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255, 255, 255, 1)";
    ctx.stroke(shieldPath);
    ctx.restore();

    // 光沢を描画
    drawShine();

    // 光沢が終了条件に達したらキャンバスを削除
    if (shield.shineAlpha <= 0.2) {
      console.log("盾エフェクト終了。キャンバス削除");
      canvas.remove();
    } else {
      requestAnimationFrame(drawShield);
    }
  }

  function drawShine() {
    // グラデーションを↗から↙に移動
  
    // 値が有効であるかをチェックし、不正な場合はデフォルト値を設定
    const shineProgress = isFinite(shield.shineProgress) ? shield.shineProgress : 0;
    const radius = isFinite(shield.radius) ? shield.radius : size / 2;
  
    const xStart = shield.x - radius + shineProgress * radius;
    const xEnd = shield.x + radius + shineProgress * radius;
  
    // 再度、有効な値かを確認
    if (!isFinite(xStart) || !isFinite(xEnd)) {
      console.error("Invalid gradient coordinates after fallback:", xStart, xEnd);
      return; // 無効な値がある場合は描画を中止
    }
  
    const gradient = ctx.createLinearGradient(
      xStart,
      shield.y - radius,
      xEnd,
      shield.y + radius
    );
  
    gradient.addColorStop(0, `rgba(255, 255, 255, ${shield.shineAlpha})`);
    gradient.addColorStop(0.5, `rgba(255, 255, 255, 0.2)`);
    gradient.addColorStop(1, `rgba(255, 255, 255, ${shield.shineAlpha})`);
  
    ctx.save();
    ctx.translate(shield.x, shield.y); // 中央に配置
    ctx.scale(radius / 100, radius / 100); // サイズ調整
    ctx.fillStyle = gradient;
    ctx.fill(shieldPath); // 盾の形に沿ってグラデーションを描画
    ctx.restore();
  
    // 光沢の進行度を更新
    shield.shineProgress += 0.02 * speed;
  
    // 進行度が範囲を超えたらリセット
    if (shield.shineProgress > 1.5) {
      shield.shineProgress = -0.5; // ↗に戻してループさせる
    }
  }
  
  
  

  drawShield();
}


function applyGunshotEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }

  // コンテナ反転の設定
  setContainerTransform(container, direction);

  // Canvas を作成して軌跡を描画
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // 弾丸の初期データ
  const bullet = {
    x: canvas.width / 2,
    y: 0,
    width: size / 15,
    height: size / 8,
    color: color,
    trailOpacity: 0.5,
  };

  // マズルフラッシュを Anime.js で作成
  const flash = document.createElement("div");
  flash.style.position = "absolute";
  flash.style.width = `${size * 2}px`;
  flash.style.height = `${size}px`;
  flash.style.background = `radial-gradient(circle, ${color}, rgba(255, 255, 255, 0))`;
  flash.style.borderRadius = "50%";
  flash.style.opacity = 0.8;
  flash.style.top = "5%";
  flash.style.left = "50%";
  flash.style.transform = "translate(-50%, -50%)";
  container.appendChild(flash);

  // マズルフラッシュのアニメーション
  anime({
    targets: flash,
    opacity: [0.8, 0],
    scale: [1, 1.5],
    duration: 300 / speed, // speedが高いほど速くなる
    easing: "easeOutQuad",
    complete: () => flash.remove(),
  });

  // アニメーションのフレーム数を計算
  const totalFrames = 500 / speed / (1000 / 60); // 60FPS基準
  let frame = 0;

  // Canvas による描画ループ
  function draw() {
    if (frame > totalFrames) {
      canvas.remove(); // アニメーションが終わったらキャンバスを削除
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height); // キャンバスをクリア

    // 軌跡を描画
    ctx.fillStyle = `rgba(${hexToRgb(bullet.color)}, ${bullet.trailOpacity})`;
    ctx.beginPath();
    ctx.ellipse(
      bullet.x,
      bullet.y,
      bullet.width * 1.5, // 軌跡の横幅
      bullet.height * 2, // 軌跡の縦幅
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // 弾丸本体を描画
    ctx.fillStyle = bullet.color;
    ctx.beginPath();
    ctx.ellipse(
      bullet.x,
      bullet.y,
      bullet.width,
      bullet.height,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // 弾丸の位置を更新
    bullet.y += canvas.height / totalFrames; // 高速で下へ移動

    frame++;
    requestAnimationFrame(draw);
  }

  draw();
}

function applyRainEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }
  speed = speed * 4.0;

  // コンテナ反転の設定
  setContainerTransform(container, direction);

  // Canvas を作成
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // 雨粒の設定
  const drops = Array.from({ length: size * 1 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    length: Math.random() * 15 + 45, // 雨粒の長さ
    alpha: Math.random() * 0.5 + 0.5, // 不透明度
    speedY: Math.random() * 2 + speed * 2, // 落下速度
    width: Math.random() * 1.5 + 2.5, // 雨粒の幅
    color: color,
  }));

  // 波紋のリスト
  const ripples = [];

  // Anime.js を使った光のフラッシュ（雷や雨の反射）
  const flash = document.createElement("div");
  flash.style.position = "absolute";
  flash.style.width = "100%";
  flash.style.height = "100%";
  flash.style.background = `radial-gradient(circle, ${color}, rgba(255, 255, 255, 0))`;
  flash.style.opacity = 0;
  flash.style.top = "0";
  flash.style.left = "0";
  container.appendChild(flash);

  anime({
    targets: flash,
    opacity: [0.1, 0],
    duration: 300,
    easing: "easeOutQuad",
    loop: true,
  });

  // 描画ループ
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 雨粒の描画
    drops.forEach((drop) => {
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x, drop.y + drop.length);
      ctx.strokeStyle = `rgba(${hexToRgb(drop.color)}, ${drop.alpha})`;
      ctx.lineWidth = drop.width;
      ctx.stroke();

      // 雨粒の位置を更新
      drop.y += drop.speedY;

      // 下に到達したら再配置し、波紋を生成
      if (drop.y > canvas.height) {
        drop.y = -drop.length;
        drop.x = Math.random() * canvas.width;
        drop.alpha = Math.random() * 0.5 + 0.5;
        drop.speedY = Math.random() * 2 + speed * 2;

        // 波紋を追加
        ripples.push({
          x: drop.x,
          y: canvas.height,
          radius: 0,
          maxRadius: Math.random() * 20 + 30, // 波紋の最大半径
          alpha: 1.0,
        });
      }
    });

    // 波紋の描画と拡大
    ripples.forEach((ripple, index) => {
      if (ripple.alpha <= 0) {
        ripples.splice(index, 1); // 波紋が消えたら削除
        return;
      }

      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${hexToRgb(color)}, ${ripple.alpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // 波紋を拡大
      ripple.radius += speed * 0.5; // 半径を拡大
      ripple.alpha -= 0.02; // 徐々に透明に
    });

    requestAnimationFrame(draw); // 再描画
  }

  draw();

  // アニメーション終了時にキャンバスを削除
  setTimeout(() => {
    canvas.remove();
    flash.remove();
  }, 4000 / speed); // エフェクトの持続時間
}

function applyFallingRockEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }
  size = size * 0.2
  speed = speed * 3.0

  // コンテナ反転の設定
  setContainerTransform(container, direction);

  // Canvas を作成
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // 落下する岩の設定（固定の形状を生成）
  const numberOfRocks = 10; // 固定の岩の数
  const rocks = Array.from({ length: numberOfRocks }, () => {
    const sides = Math.floor(Math.random() * 6) + 8; // ランダムな5～8角形
    const radius = Math.random() * size + size; // ランダムな大きさ
    const angleStep = (Math.PI * 2) / sides;

    // 頂点の座標を一度生成して保存
    const vertices = Array.from({ length: sides }, (_, i) => {
      const angle = angleStep * i;
      const offset = radius * (Math.random() * 0.3 + 0.7); // 頂点ごとのランダムなオフセット
      return {
        x: offset * Math.cos(angle),
        y: offset * Math.sin(angle),
      };
    });

    return {
      x: Math.random() * canvas.width,
      y: -Math.random() * 100, // 初期位置を画面外の上部に設定
      vertices: vertices, // 固定された形状
      speedY: Math.random() * speed * 2 + speed * 2, // 落下速度
      color: color, // 色を暗く調整
      isBreaking: false, // 地面に衝突したかどうか
    };
  });

  // 破片のリスト
  const fragments = [];

  // 描画ループ
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 岩の描画と更新
    rocks.forEach((rock) => {
      if (!rock.isBreaking) {
        // 岩の形状を描画（固定された頂点を利用）
        drawFixedPolygon(ctx, rock.x, rock.y, rock.vertices, rock.color);

        // 落下位置の更新
        rock.y += rock.speedY;

        // 地面に到達したら破片を生成
        if (rock.y > canvas.height) {
          rock.isBreaking = true;

          // 破片を生成
          for (let i = 0; i < 6; i++) {
            fragments.push({
              x: rock.x,
              y: canvas.height,
              vx: (Math.random() - 0.5) * 6, // 横方向の速度
              vy: Math.random() * -3 - 2, // 縦方向の速度（上に飛ぶ）
              size: Math.random() * size / 3, // 破片のサイズ
              alpha: 1.0, // 不透明度
              color: rock.color,
            });
          }
        }
      }
    });

    // 破片の描画と更新
    fragments.forEach((fragment, index) => {
      if (fragment.alpha <= 0) {
        fragments.splice(index, 1); // 消えた破片を削除
        return;
      }

      // 破片を描画
      ctx.beginPath();
      ctx.arc(fragment.x, fragment.y, fragment.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${hexToRgb(fragment.color)}, ${fragment.alpha})`;
      ctx.fill();

      // 破片の位置と状態を更新
      fragment.x += fragment.vx;
      fragment.y += fragment.vy;
      fragment.vy += 0.1; // 重力効果
      fragment.alpha -= 0.02; // 徐々に透明に
    });

    // 岩が全て破壊され、破片が消えたら終了
    if (rocks.every((rock) => rock.isBreaking) && fragments.length === 0) {
      canvas.remove();
      return;
    }

    requestAnimationFrame(draw);
  }

  draw();

  // アニメーション終了時にキャンバスを削除
  setTimeout(() => {
    canvas.remove();
  }, 10000 / speed); // エフェクトの持続時間
}

function applySmokeEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }
  size = size * 2.0
  // コンテナ反転の設定
  setContainerTransform(container, direction);

  // Canvas を作成して配置
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // サイズを調整
  size *= 1.5;

  // 煙のパーティクルを生成
  const particles = Array.from({ length: size / 5 }, () => ({
    x: canvas.width / 2,
    y: canvas.height / 2,
    vx: (Math.random() - 0.5) * 2 * (size / 100), // 横方向の速度
    vy: (Math.random() - 0.5) * 2 * (size / 100), // 縦方向の速度
    radius: Math.random() * (size / 10) + 20, // 初期半径
    alpha: Math.random() * 0.5 + 0.5, // 不透明度
    life: Math.random() * 100 + 50, // ライフタイム
    colorStop: Math.random(), // グラデーションの位置
  }));

  // 煙のグラデーション設定
  function createGradient(ctx, x, y, radius, alpha) {
    const startColor = generateEndColor(color); // 中心の色
    const endColor = color; // 外側の色
    const rgbStart = hexToRgb(startColor);
    const rgbEnd = hexToRgb(endColor);

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

    gradient.addColorStop(0, `rgba(${rgbStart}, ${alpha})`); // 中心：開始色
    gradient.addColorStop(0.5, `rgba(${rgbStart}, ${alpha * 0.5})`); // 中間：やや透明な開始色
    gradient.addColorStop(1, `rgba(${rgbEnd}, 0)`); // 外側：終了色で完全透明

    return gradient;
  }


  // 描画関数
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((particle) => {
      if (particle.life > 0) {
        const gradient = createGradient(
          ctx,
          particle.x,
          particle.y,
          particle.radius,
          particle.alpha
        );

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // パーティクルの更新
        particle.x += particle.vx * speed; // 横方向の速度
        particle.y += particle.vy * speed; // 縦方向の速度
        particle.radius *= 1.01; // 半径を徐々に拡大
        particle.alpha -= 0.01 * speed; // 徐々に透明になる
        particle.life -= speed; // ライフを減少
      }
    });

    // 生存しているパーティクルがある場合は再描画
    if (particles.some((p) => p.life > 0)) {
      requestAnimationFrame(draw);
    } else {
      canvas.remove(); // 全てのパーティクルが消えたらキャンバスを削除
    }
  }

  draw();
}

function applyCircleEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }
  setContainerTransform(container, direction);
  // Canvas を作成
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // 魔法陣の基本設定
  const magicCircle = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    outerRadius: size * 1.2, // 外円の半径
    innerRadius: size * 0.9, // 内円の半径
    rotation: 0, // 回転角度
    alpha: 1.0, // 不透明度
    text: "ᚠ ᚢ ᚦ ᚩ ᚱ ᚳ ᚷ ᚹ ᚻ ᚾ ᛁ ᛄ ᛇ ᛈ ᛉ ᛋ ᛏ ᛒ ᛖ ᛗ ᛚ ᛝ ᛟ", // 魔法っぽい文字
    starPoints: Math.floor(Math.random() * 4) + 5, // 5～8芒星をランダムに設定
  };

  // テキストを円形に配置する関数
  function drawCircularText(ctx, text, x, y, radius, startAngle, color) {
    const angleStep = (Math.PI * 2) / text.length; // 文字間の角度
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(startAngle); // 開始角度を設定
  
    text.split("").forEach((char, index) => {
      const angle = angleStep * index; // 文字の位置を計算
      ctx.save();
      ctx.rotate(angle);
      ctx.translate(0, -radius); // 半径分だけ文字を外側に配置
      const textWidth = ctx.measureText(char).width;
      ctx.fillStyle = color;
      ctx.font = "16px serif"; // フォントを設定
      ctx.fillText(char, -textWidth / 2, 0); // 文字を描画
      ctx.restore();
    });

    ctx.restore();
  }

  // 中央の星型を描画する関数
  function drawStar(ctx, x, y, outerRadius, innerRadius, points, color) {
    const angleStep = Math.PI / points;
  
    // 外側の芒星を描画
    ctx.beginPath();
    for (let i = 0; i < 2 * points; i++) {
      const angle = i * angleStep;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
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
  
    // 中央の大きな円を描画
    ctx.beginPath();
    ctx.arc(x, y, innerRadius * 0.9, 0, Math.PI * 2); // 内側に大きな円
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  
    // 中央を埋めるための小さな円を描画
    ctx.beginPath();
    ctx.arc(x, y, innerRadius * 0.25, 0, Math.PI * 2); // 内側に小さな円
    ctx.fillStyle = color;
    ctx.fill();
  }
  
  

  // 魔法陣の描画関数
  function drawMagicCircle(ctx, circle, color) {
    ctx.save();
    ctx.translate(circle.x, circle.y);
    ctx.rotate(circle.rotation);
    ctx.globalAlpha = circle.alpha;

    // 外円
    ctx.beginPath();
    ctx.arc(0, 0, circle.outerRadius, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.stroke();

    // 内円
    ctx.beginPath();
    ctx.arc(0, 0, circle.innerRadius, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 文字リング
    drawCircularText(
      ctx,
      circle.text,
      0,
      0,
      (circle.outerRadius + circle.innerRadius) / 2.1,
      circle.rotation,
      color
    );

    // 中央の模様（ランダムな芒星）
    drawStar(
      ctx,
      0,
      0,
      circle.innerRadius * 0.9, // 外半径
      circle.innerRadius * 0.45, // 内半径
      circle.starPoints, // ランダムな芒星の点数
      color
    );

    ctx.restore();
  }

  // 描画ループ
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 魔法陣の描画
    drawMagicCircle(ctx, magicCircle, color);

    // アニメーション効果
    magicCircle.rotation += 0.02 * speed; // 回転速度
    magicCircle.alpha -= 0.005 * speed; // 徐々に透明になる

    if (magicCircle.alpha > 0) {
      requestAnimationFrame(draw);
    } else {
      canvas.remove(); // 全ての描画が終了したらキャンバスを削除
    }
  }

  // Anime.js を使った発光エフェクト
  anime({
    targets: canvas,
    opacity: [1, 0],
    duration: 3000 / speed,
    easing: "easeOutQuad",
  });

  draw();
}

function applyWaveEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }

  // コンテナ反転の設定
  setContainerTransform(container, direction);

  // Canvas を作成
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // 波のデータ
  const waves = Array.from({ length: size }, (_, i) => ({
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 0, // 初期の半径
    maxRadius: Math.random() * 100 + 200, // 波の最大半径
    alpha: 1.0, // 不透明度
    growthRate: Math.random() * 2 + 1, // 拡大速度
    delay: i * (500 / speed), // 波の生成タイミング
  }));

  // 波を描画する関数
  function drawWave(ctx, x, y, radius, alpha, color) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    const rgb = hexToRgb(color);
    gradient.addColorStop(0, `rgba(${rgb}, ${alpha * 0.4})`);
    gradient.addColorStop(0.8, `rgba(${rgb}, ${alpha})`);
    gradient.addColorStop(1, `rgba(${rgb}, 0)`);

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  // 描画ループ
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    waves.forEach((wave, index) => {
      if (wave.alpha <= 0 || wave.radius > wave.maxRadius) {
        // 波が消えたら配列から削除
        if (wave.radius > wave.maxRadius) waves.splice(index, 1);
        return;
      }

      // 波を描画
      drawWave(ctx, wave.x, wave.y, wave.radius, wave.alpha, color);

      // 波の状態を更新
      if (wave.delay <= 0) {
        wave.radius += wave.growthRate * speed; // 波を拡大
        wave.alpha -= 0.01 * speed; // 不透明度を減少
      } else {
        wave.delay -= 16; // 遅延を減少
      }
    });

    if (waves.length > 0) {
      requestAnimationFrame(draw);
    } else {
      canvas.remove(); // 全ての波が消えたらキャンバスを削除
    }
  }

  draw();

  // アニメーション終了時にキャンバスを削除
  setTimeout(() => {
    if (canvas.parentNode) {
      canvas.remove();
    }
  }, 4000 / speed); // エフェクトの持続時間
}

function applySplashEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }

  // コンテナ反転の設定
  setContainerTransform(container, direction);

  // Canvas を作成
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // 飛沫の粒子データ
  const particles = Array.from({ length: size }, () => ({
    x: canvas.width / 2,
    y: canvas.height / 2,
    vx: (Math.random() - 0.5) * 6 * speed, // ランダムな横方向の速度
    vy: (Math.random() - 0.5) * 6 * speed, // ランダムな縦方向の速度
    radius: Math.random() * 4 + 2, // 粒子の半径
    alpha: 1.0, // 不透明度
    gravity: Math.random() * 0.1 + 0.05, // 重力の影響
  }));

  // 粒子を描画する関数
  function drawParticle(ctx, x, y, radius, alpha, color) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    const rgb = hexToRgb(color);
    gradient.addColorStop(0, `rgba(${rgb}, ${alpha})`);
    gradient.addColorStop(1, `rgba(${rgb}, 0)`);

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  // 描画ループ
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((particle, index) => {
      if (particle.alpha <= 0 || particle.radius <= 0) {
        particles.splice(index, 1); // 消えた粒子を削除
        return;
      }

      // 粒子を描画
      drawParticle(ctx, particle.x, particle.y, particle.radius, particle.alpha, color);

      // 粒子の更新
      particle.x += particle.vx; // 横方向の移動
      particle.y += particle.vy; // 縦方向の移動
      particle.vy += particle.gravity; // 重力で縦方向の速度が増加
      particle.alpha -= 0.02 * speed; // 徐々に透明になる
      particle.radius -= 0.1; // 粒子が小さくなる
    });

    if (particles.length > 0) {
      requestAnimationFrame(draw);
    } else {
      canvas.remove(); // 全ての粒子が消えたらキャンバスを削除
    }
  }

  draw();

  // アニメーション終了時にキャンバスを削除
  setTimeout(() => {
    if (canvas.parentNode) {
      canvas.remove();
    }
  }, 3000 / speed); // エフェクトの持続時間
}

function applyWaterSplashEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }

  // Canvas を作成
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  const droplets = [];
  const splashes = [];
  let animationId; // requestAnimationFrame ID

  // 新しい粒子を生成
  function createDroplet() {
    droplets.push({
      x: Math.random() * canvas.width,
      y: 0,
      radius: Math.random() * 3 + 2,
      vy: (Math.random() * speed + speed) * 1.5,
      alpha: 1.0,
    });
  }

  // 水飛沫を生成
  function createSplash(x, y) {
    for (let i = 0; i < size / 2; i++) {
      splashes.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 6 * speed,
        vy: -(Math.random() * 3 + 2) * speed,
        radius: Math.random() * 3 + 1,
        alpha: 1.0,
      });
    }
  }

  // 粒子を描画
  function drawDroplet(ctx, x, y, radius, alpha, color) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    const rgb = hexToRgb(color);
    gradient.addColorStop(0, `rgba(${rgb}, ${alpha})`);
    gradient.addColorStop(1, `rgba(${rgb}, 0)`);

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  // 描画ループ
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 水の粒子を描画・更新
    droplets.forEach((droplet, index) => {
      if (droplet.y > canvas.height) {
        createSplash(droplet.x, canvas.height - droplet.radius);
        droplets.splice(index, 1); // 粒子を削除
        return;
      }
      drawDroplet(ctx, droplet.x, droplet.y, droplet.radius, droplet.alpha, color);
      droplet.y += droplet.vy;
    });

    // 水飛沫を描画・更新
    splashes.forEach((splash, index) => {
      if (splash.alpha <= 0) {
        splashes.splice(index, 1); // 飛沫を削除
        return;
      }
      drawDroplet(ctx, splash.x, splash.y, splash.radius, splash.alpha, color);
      splash.x += splash.vx;
      splash.y += splash.vy;
      splash.vy += 0.1 * speed;
      splash.alpha -= 0.02 * speed;
    });

    // 新しい粒子を生成
    if (droplets.length < size) {
      createDroplet();
    }

    // アニメーション継続条件
    if (droplets.length > 0 || splashes.length > 0) {
      animationId = requestAnimationFrame(draw);
    } else {
      cancelAnimationFrame(animationId); // アニメーションを停止
      canvas.remove(); // キャンバスを削除
    }
  }

  draw();

  // エフェクト終了時のタイマーをクリア
  setTimeout(() => {
    if (canvas.parentNode) {
      cancelAnimationFrame(animationId); // アニメーションを明確に停止
      canvas.remove(); // キャンバスを削除
    }
  }, 5000 / speed); // エフェクトの持続時間
}


function applyWaterfallEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }

  // Canvas を作成
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  const droplets = [];
  const splashes = [];
  let animationId; // requestAnimationFrame ID

  // 新しい粒子を生成
  function createDroplet() {
    droplets.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 75, // 中央に集中させる
      y: 0,
      width: Math.random() * 10 + 15, // 粒子の横幅
      height: Math.random() * 30 + 50, // 粒子の縦長さ
      radius: Math.random() * 15 + 20,
      vy: (Math.random() * speed + speed) * 5.5,
      alpha: 1.0,
    });
  }

  
  // 水飛沫を生成
  function createSplash(x, y) {
    for (let i = 0; i < size / 4; i++) {
      splashes.push({
        x: x + (Math.random() - 0.5) * 70, // ランダムな横方向の飛び散り
        y: y + 35,
        vx: (Math.random() - 0.5) * 6 * speed,
        vy: -(Math.random() * 3 + 2) * speed,
        radius: Math.random() * 3 + 1,
        alpha: 1.0,
      });
    }
  }

  // 粒子を描画
  function drawDroplet(ctx, x, y, radius, alpha, color) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    const rgb = hexToRgb(color);
    gradient.addColorStop(0, `rgba(${rgb}, ${alpha})`);
    gradient.addColorStop(1, `rgba(${rgb}, 0)`);

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  // 描画ループ
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 水粒子を描画・更新
    droplets.forEach((droplet, index) => {
      if (droplet.y > canvas.height) {
        createSplash(droplet.x, canvas.height - droplet.radius);
        droplets.splice(index, 1); // 粒子を削除
        return;
      }
      drawDroplet(ctx, droplet.x, droplet.y, droplet.radius, droplet.alpha, color);
      droplet.y += droplet.vy;
    });

    // 水飛沫を描画・更新
    splashes.forEach((splash, index) => {
      if (splash.alpha <= 0) {
        splashes.splice(index, 1); // 飛沫を削除
        return;
      }
      drawDroplet(ctx, splash.x, splash.y, splash.radius, splash.alpha, color);
      splash.x += splash.vx;
      splash.y += splash.vy;
      splash.vy += 0.1 * speed;
      splash.alpha -= 0.02 * speed;
    });

    // 新しい粒子を生成
    if (droplets.length < size / 2) {
      createDroplet();
    }

    // アニメーション継続条件
    if (droplets.length > 0 || splashes.length > 0) {
      animationId = requestAnimationFrame(draw);
    } else {
      cancelAnimationFrame(animationId); // アニメーションを停止
      canvas.remove(); // キャンバスを削除
    }
  }

  draw();

  // エフェクト終了時のタイマーをクリア
  setTimeout(() => {
    if (canvas.parentNode) {
      cancelAnimationFrame(animationId); // アニメーションを明確に停止
      canvas.remove(); // キャンバスを削除
    }
  }, 4000 / speed); // エフェクトの持続時間
}


function applyLightningEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }

  // Canvas を作成
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // 雷のデータ
  const bolts = [];

  // 雷を生成
  function createBolt() {
    const bolt = [];
    let startX = canvas.width / 2; // 中央から開始
    let startY = 0;

    // 雷の数
    for (let i = 0; i < size*3; i++) { // 分岐数 = size
      const endX = startX + (Math.random() - 0.5) * 50; // ランダムに横方向にずれる
      const endY = startY + Math.random() * 50; // 下方向に進む
      bolt.push({ startX, startY, endX, endY });
      startX = endX;
      startY = endY;
    }

    bolts.push(bolt);
  }

  // 雷を描画
  function drawBolt(bolt) {
    ctx.beginPath();
    ctx.moveTo(bolt[0].startX, bolt[0].startY);

    bolt.forEach((segment) => {
      ctx.lineTo(segment.endX, segment.endY);
    });

    ctx.strokeStyle = color;
    ctx.lineWidth = size / 30; // 太さを指定
    ctx.stroke();
  }

  // 描画ループ
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    bolts.forEach((bolt, index) => {
      drawBolt(bolt);
      bolts.splice(index, 1); // 一度表示した雷を削除
    });

    if (bolts.length < 1) {
      createBolt(); // 次の雷を生成
    }

    requestAnimationFrame(draw);
  }

  draw();

  // 一定時間で終了
  setTimeout(() => {
    canvas.remove();
  }, 1500 / speed); // エフェクトの持続時間
}

// // 煙エフェクト (煙が上から湧き出る)
// function applyFireEffect(size, speed, color, direction) {

// 煙エフェクト (煙が下方向に移動する)
function applyFireEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }
  size = size * 2.0;

  // コンテナ反転の設定
  setContainerTransform(container, direction);

  // Canvas を作成して配置
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // サイズを調整
  size *= 1.5;

  // 煙のパーティクルを生成
  const particles = Array.from({ length: size / 5 }, () => ({
    x: canvas.width / 2 + (Math.random() - 0.5) * 5, // 横方向に広がり
    y: Math.random() * 50, // 上部から発生
    vx: (Math.random() - 0.5) * 2 * (size / 100), // 横方向の速度
    vy: Math.random() * speed * 25, // 下方向の速度
    radius: Math.random() * (size / 10) + 20, // 初期半径
    alpha: Math.random() * 0.5 + 0.5, // 不透明度
    life: Math.random() * 100 + 50, // ライフタイム
  }));

  // 煙のグラデーション設定
  function createGradient(ctx, x, y, radius, alpha) {
    // 開始色 (指定された色)
    const startColor = color; // ユーザー指定の色

    // 終了色を自動生成 (例: 赤 → 黄)
    const endColor = generateEndColor(startColor);
    console.log(" endColor ", endColor , startColor)

    // グラデーションステップ数を設定
    const gradientSteps = 10;

    // グラデーション色を生成
    const gradientColors = generateGradient(endColor, startColor, gradientSteps);

    // グラデーションを作成
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

    // グラデーションの色を追加
    gradientColors.forEach((color, index) => {
      const position = index / (gradientColors.length - 1); // 色の位置を計算
      gradient.addColorStop(position, `rgba(${hexToRgb(color)}, ${alpha * (1 - position)})`);
    });

    return gradient;
  }


  // 描画関数
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((particle, index) => {
      if (particle.life <= 0 || particle.alpha <= 0) {
        particles.splice(index, 1);
        return;
      }

      const gradient = createGradient(
        ctx,
        particle.x,
        particle.y,
        particle.radius,
        particle.alpha
      );

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // 更新
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.radius *= 1.01; // 半径を徐々に拡大
      particle.alpha -= 0.01 * speed; // 徐々に透明になる
      particle.life -= speed; // ライフを減少
    });

    // 生存しているパーティクルがある場合は再描画
    if (particles.some((p) => p.life > 0)) {
      requestAnimationFrame(draw);
    } else {
      canvas.remove(); // 全てのパーティクルが消えたらキャンバスを削除
    }
  }

  draw();
}

// 刺突エフェクト (中央に槍が伸び、衝撃が広がるエフェクト)
function applyPierceEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }

  // Canvas を作成
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // 刺突エフェクトのデータ
  const pierce = {
    x: canvas.width / 2,
    y: canvas.height / 1,
    length: 0,
    maxLength: size * 3, // 最大の刺突距離
    width: size / 3,
    alpha: 1,
    stage: "expanding", // "expanding" または "fading"
  };

  let spark = true
  
  // 描画関数
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (pierce.alpha > 0) {
      ctx.beginPath();
      ctx.moveTo(pierce.x - pierce.width / 2, pierce.y);
      ctx.lineTo(pierce.x + pierce.width / 2, pierce.y);
      ctx.lineTo(pierce.x, pierce.y - pierce.length);
      ctx.closePath();

      const rgb = hexToRgb(color);
      ctx.fillStyle = `rgba(${rgb}, ${pierce.alpha})`;
      ctx.fill();

      // ステージによる更新
      if (pierce.stage === "expanding") {
        pierce.length += speed * 30; // 刺突が伸びる速度
        if (pierce.length >= pierce.maxLength) {
          pierce.stage = "fading"; // 最大長に達したらフェードへ
        }
      } else if (pierce.stage === "fading") {
        pierce.alpha -= 0.05 * speed; // 徐々に透明化
        pierce.width -= speed; // 幅を徐々に縮小
        pierce.length -= speed * 5; // 長さを徐々に縮小

        if (spark){
          // 炸裂エフェクトを開始
          const impact = {
            x: pierce.x,
            y: pierce.y - pierce.length, // 刺突の先端で炸裂
          };
          applyFragmentEffect(size * 0.3 , speed*4, color, impact.x, impact.y);
          spark = false
        }
    
        if (pierce.alpha <= 0) {
          

          canvas.remove(); // 完全に消えたら終了
          return;
        }
      }
    }

    requestAnimationFrame(draw);
  }

  draw();
}

// 衝撃 揺れと火花
function applyStrikeEffect_2(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }

  // Canvas を作成
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // 衝撃の中心
  const impact = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 0,
    maxRadius: size * 2,
    alpha: 1.0,
  };

  // 破片データ
  const fragments = Array.from({ length: size }, () => ({
    x: impact.x,
    y: impact.y,
    vx: (Math.random() - 0.5) * speed * 10,
    vy: (Math.random() - 0.5) * speed * 10,
    radius: Math.random() * 4 + 2,
    alpha: 1.0,
  }));

  // 衝撃波を描画
  function drawImpact() {
    ctx.beginPath();
    ctx.arc(impact.x, impact.y, impact.radius, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(impact.x, impact.y, 0, impact.x, impact.y, impact.radius);
    gradient.addColorStop(0, `rgba(${hexToRgb(color)}, ${impact.alpha})`);
    gradient.addColorStop(1, `rgba(${hexToRgb(color)}, 0)`);
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  // 破片を描画
  function drawFragments() {
    fragments.forEach((fragment, index) => {
      if (fragment.alpha <= 0) {
        fragments.splice(index, 1); // 消えた破片を削除
        return;
      }

      ctx.beginPath();
      ctx.arc(fragment.x, fragment.y, fragment.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${hexToRgb(color)}, ${fragment.alpha})`;
      ctx.fill();

      // 更新
      fragment.x += fragment.vx;
      fragment.y += fragment.vy;
      fragment.alpha -= 0.02 * speed;
    });
  }

  // 衝撃のアニメーション
  anime({
    targets: impact,
    radius: impact.maxRadius,
    alpha: 0,
    easing: "easeOutExpo",
    duration: 500 / speed,
    update: () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawImpact();
      drawFragments();
    },
    complete: () => {
      canvas.remove(); // 完了時にキャンバスを削除
    },
  });

  // 画面の揺れ（シェイク）
  anime({
    targets: container,
    translateX: [-10, 10, -5, 5, 0],
    translateY: [-10, 10, -5, 5, 0],
    duration: 300 / speed,
    easing: "easeInOutQuad",
  });
}

function applyBlackHoleWithRippleEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }
  size = size * 0.1
  speed = speed * 5.0


  // Canvas を作成
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // ブラックホールのデータ
  const blackHole = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: size * 2, // ブラックホールの半径
    swirlRadius: size * 4, // 渦の半径
    alpha: 1.0, // 不透明度
    particles: [],
  };

  // 波紋エフェクトのデータ
  const ripple = {
    x: blackHole.x,
    y: blackHole.y,
    radius: size * 10, // 初期の最大半径
    alpha: 1.0, // 不透明度
  };

  // 粒子を生成
  function createParticle() {
    blackHole.particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * speed * 0.5,
      vy: (Math.random() - 0.5) * speed * 0.5,
      alpha: Math.random() * 0.5 + 0.5,
      radius: Math.random() * 3 + 2,
    });
  }

  // ブラックホールの中心を描画
  function drawBlackHoleCenter() {
    ctx.beginPath();
    ctx.arc(blackHole.x, blackHole.y, blackHole.radius, 0, Math.PI * 2);
  
    // グラデーションの調整
    const gradient = ctx.createRadialGradient(
      blackHole.x,
      blackHole.y,
      0, // 中心は黒
      blackHole.x,
      blackHole.y,
      blackHole.radius // 外側ほど明るい
    );
    gradient.addColorStop(0, `rgba(0, 0, 0, 1)`); // 中央は完全な黒
    gradient.addColorStop(0.5, `rgba(50, 50, 50, 0.7)`); // 中間は暗灰色
    gradient.addColorStop(1, `rgba(100, 100, 100, 0.3)`); // 外側ほど薄灰色
  
    ctx.fillStyle = gradient;
    ctx.fill();
  }
  

  // ブラックホールのスワール（渦）を描画
  function drawSwirl() {
    ctx.save();
    ctx.translate(blackHole.x, blackHole.y);
    ctx.rotate((performance.now() / 1000) * speed); // 回転速度
    ctx.beginPath();
    ctx.arc(0, 0, blackHole.swirlRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${hexToRgb(color)}, 0.3)`;
    ctx.lineWidth = size / 8;
    ctx.stroke();
    ctx.restore();
  }

  // 粒子を描画・更新
  function drawParticles() {
    blackHole.particles.forEach((particle, index) => {
      const dx = blackHole.x - particle.x;
      const dy = blackHole.y - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < blackHole.radius) {
        // 粒子がブラックホールに吸い込まれたら削除
        blackHole.particles.splice(index, 1);
        return;
      }

      // 吸引力
      const pull = speed / distance;

      particle.vx += pull * (dx / distance);
      particle.vy += pull * (dy / distance);

      // 更新
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.alpha -= 0.005; // 徐々に透明化

      if (particle.alpha <= 0) {
        blackHole.particles.splice(index, 1); // 消えた粒子を削除
        return;
      }

      // 描画
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${hexToRgb(color)}, ${particle.alpha})`;
      ctx.fill();
    });
  }

  // 波紋を描画
  function drawRipple() {
    ctx.beginPath();
    ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(ripple.x, ripple.y, 0, ripple.x, ripple.y, ripple.radius);
    gradient.addColorStop(0, `rgba(${hexToRgb(color)}, ${ripple.alpha})`);
    gradient.addColorStop(1, `rgba(${hexToRgb(color)}, 0)`);
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  // 描画ループ
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBlackHoleCenter(); // ブラックホールの中心
    drawSwirl(); // スワール
    drawParticles(); // 粒子
    drawRipple(); // 波紋

    // 粒子の数を維持
    if (blackHole.particles.length < size * 5) {
      createParticle();
    }

    requestAnimationFrame(draw);
  }

  // Anime.js を使った波紋の逆再生アニメーション
  anime({
    targets: ripple,
    radius: 0, // 波紋が内側に収縮
    alpha: 0, // 波紋が消える
    easing: "easeOutQuad",
    duration: 2000 / speed, // アニメーションの速度
  });

  draw();

  // 一定時間で終了
  setTimeout(() => {
    canvas.remove();
  }, 10000 / speed); // エフェクトの持続時間
}

function applyReverseRippleEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }

  // Canvas を作成
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // 波紋エフェクトのデータ
  const ripple = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: size * 10, // 初期の最大半径
    alpha: 1.0, // 不透明度
  };

  // 描画関数
  function drawRipple() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(ripple.x, ripple.y, 0, ripple.x, ripple.y, ripple.radius);
    gradient.addColorStop(0, `rgba(${hexToRgb(color)}, ${ripple.alpha})`);
    gradient.addColorStop(1, `rgba(${hexToRgb(color)}, 0)`);
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  // Anime.js を使った波紋の逆再生アニメーション
  anime({
    targets: ripple,
    radius: 0, // 波紋が内側に収縮
    alpha: 0, // 波紋が消える
    easing: "easeOutQuad",
    duration: 1000 / speed, // アニメーションの速度
    update: () => {
      drawRipple();
    },
    complete: () => {
      canvas.remove(); // 完了時にキャンバスを削除
    },
  });
}

function applyBlackHoleWithRippleEffect2(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }
  size = size * 0.5
  speed = speed * 5.0


  // Canvas を作成
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // ブラックホールのデータ
  const blackHole = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: size * 1, // ブラックホールの半径
    swirlRadius: size * 4, // 渦の半径
    alpha: 1.0, // 不透明度
    particles: [],
  };

  // 波紋エフェクトのデータ
  const ripple = {
    x: blackHole.x,
    y: blackHole.y,
    radius: size * 10, // 初期の最大半径
    alpha: 1.0, // 不透明度
  };

  // 粒子を生成
  function createParticle() {
    const angle = Math.random() * Math.PI * 2; // ランダムな角度
    const distance = Math.random() * (blackHole.swirlRadius - blackHole.radius) + blackHole.radius; // ブラックホール中心からの距離
  
    blackHole.particles.push({
      x: blackHole.x + Math.cos(angle) * distance, // 円周上のX座標
      y: blackHole.y + Math.sin(angle) * distance, // 円周上のY座標
      vx: 0, // 初期速度は0（吸引力で更新）
      vy: 0,
      alpha: Math.random() * 0.5 + 0.5, // 不透明度
      radius: Math.random() * 1.5 + 0.5, // 細いリング状の粒子
    });
  }
  

  // ブラックホールの中心を描画
  function drawBlackHoleCenter() {
    ctx.beginPath();
    ctx.arc(blackHole.x, blackHole.y, blackHole.radius, 0, Math.PI * 2);
  
    // グラデーションの調整
    const gradient = ctx.createRadialGradient(
      blackHole.x,
      blackHole.y,
      0, // 中心は黒
      blackHole.x,
      blackHole.y,
      blackHole.radius // 外側ほど明るい
    );
    gradient.addColorStop(0, `rgba(0, 0, 0, 1)`); // 中央は完全な黒
    gradient.addColorStop(0.5, `rgba(50, 50, 50, 0.7)`); // 中間は暗灰色
    gradient.addColorStop(1, `rgba(100, 100, 100, 0.3)`); // 外側ほど薄灰色
  
    ctx.fillStyle = gradient;
    ctx.fill();
  }
  

  // ブラックホールのスワール（渦）を描画
  function drawSwirl() {
    ctx.save();
    ctx.translate(blackHole.x, blackHole.y);
    ctx.rotate((performance.now() / 1000) * speed); // 回転速度
    ctx.beginPath();
    ctx.arc(0, 0, blackHole.swirlRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${hexToRgb(color)}, 0.3)`;
    ctx.lineWidth = size / 8;
    ctx.stroke();
    ctx.restore();
  }

  // 粒子を描画・更新
  function drawParticles() {
    blackHole.particles.forEach((particle, index) => {
      const dx = blackHole.x - particle.x;
      const dy = blackHole.y - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
  
      if (distance < blackHole.radius) {
        // 粒子がブラックホールに吸い込まれたら削除
        blackHole.particles.splice(index, 1);
        return;
      }
  
      // 吸引力
      const pull = speed / distance;
  
      particle.vx += pull * (dx / distance);
      particle.vy += pull * (dy / distance);
  
      // 更新
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.alpha -= 0.005; // 徐々に透明化
  
      if (particle.alpha <= 0) {
        blackHole.particles.splice(index, 1); // 消えた粒子を削除
        return;
      }
  
      // 描画
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${hexToRgb(color)}, ${particle.alpha})`;
      ctx.lineWidth = particle.radius * 2; // 細いリング状にする
      ctx.stroke();
    });
  }
  

  // 波紋を描画
  function drawRipple() {
    ctx.beginPath();
    ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(ripple.x, ripple.y, 0, ripple.x, ripple.y, ripple.radius);
    gradient.addColorStop(0, `rgba(${hexToRgb(color)}, ${ripple.alpha})`);
    gradient.addColorStop(1, `rgba(${hexToRgb(color)}, 0)`);
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  // 描画ループ
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBlackHoleCenter(); // ブラックホールの中心
    drawSwirl(); // スワール
    drawParticles(); // 粒子
    drawRipple(); // 波紋

    // 粒子の数を維持
    if (blackHole.particles.length < size * 5) {
      createParticle();
    }

    requestAnimationFrame(draw);
  }

  // Anime.js を使った波紋の逆再生アニメーション
  anime({
    targets: ripple,
    radius: 0, // 波紋が内側に収縮
    alpha: 0, // 波紋が消える
    easing: "easeOutQuad",
    duration: 3000 / speed, // アニメーションの速度
  });

  draw();

  // 一定時間で終了
  setTimeout(() => {
    canvas.remove();
  }, 15000 / speed); // エフェクトの持続時間
}



function applyCurvedGustEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }

  // Canvas を作成
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // 突風の粒子データ
  const particles = [];

  // 粒子を生成
  function createParticle() {
    particles.push({
      x: direction === "right" ? -50 : canvas.width + 50, // 初期X位置
      y: Math.random() * canvas.height, // ランダムなY位置
      vx: (direction === "right" ? 1 : -1) * (Math.random() * speed + speed * 2), // 初期の横方向速度
      vy: 0, // 初期の縦方向速度
      curve: (Math.random() - 0.5) * speed * 0.2, // カーブの強さ
      alpha: Math.random() * 0.5 + 0.5, // 不透明度
      length: Math.random() * size + size / 2, // 粒子の長さ
      width: Math.random() * 2 + 1, // 粒子の幅
    });
  }

  // 粒子を描画
  function drawParticle(particle) {
    ctx.beginPath();
    ctx.moveTo(particle.x, particle.y);
    ctx.lineTo(particle.x + particle.vx * particle.length, particle.y + particle.vy * particle.length);
    ctx.strokeStyle = `rgba(${hexToRgb(color)}, ${particle.alpha})`;
    ctx.lineWidth = particle.width;
    ctx.stroke();
  }

  // 描画ループ
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((particle, index) => {
      if (particle.x < -100 || particle.x > canvas.width + 100) {
        particles.splice(index, 1); // 画面外の粒子を削除
        return;
      }

      drawParticle(particle);

      // 更新
      particle.x += particle.vx; // 横方向に移動
      particle.y += particle.vy; // 縦方向に移動
      particle.vy += particle.curve; // カーブの強さを縦方向速度に追加
      particle.alpha -= 0.005; // 徐々に透明化

      if (particle.alpha <= 0) {
        particles.splice(index, 1); // 消えた粒子を削除
      }
    });

    // 粒子の数を維持
    if (particles.length < size * 5) {
      createParticle();
    }

    requestAnimationFrame(draw);
  }

  draw();

  // 一定時間で終了
  setTimeout(() => {
    canvas.remove();
  }, 5000 / speed); // エフェクトの持続時間
}


function applyShakeEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }
  size = size * 0.15
  speed = speed * 2.0
  // Canvas を作成
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // 地割れデータ
  const cracks = [];

  // 地割れ線を生成
  function createCrack(x, y, length, angle) {
    const points = [];
    let currentX = x;
    let currentY = y;

    for (let i = 0; i < length; i++) {
      points.push({ x: currentX, y: currentY });
      const offset = (Math.random() - 0.5) * size; // ランダムな振れ幅
      currentX += Math.cos(angle) * size + offset;
      currentY += Math.sin(angle) * size + offset;
      angle += (Math.random() - 0.5) * 0.3; // ランダムな角度の変化
    }

    cracks.push(points);
  }

  // 地割れを描画
  function drawCracks() {
    cracks.forEach((crack) => {
      ctx.beginPath();
      ctx.moveTo(crack[0].x, crack[0].y);
      crack.forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = size / 10;
      ctx.stroke();
    });
  }

  // 描画ループ
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCracks();
    requestAnimationFrame(draw);
  }

  // 地割れを生成
  for (let i = 0; i < size; i++) {
    const startX = Math.random() * canvas.width;
    const startY = canvas.height - Math.random() * 50; // 下部付近からスタート
    const length = Math.random() * 10 + 5; // ランダムな地割れの長さ
    const angle = Math.PI * (Math.random() * 0.4 - 0.2); // ランダムな角度
    createCrack(startX, startY, length, angle);
  }

  // 画面揺れアニメーション
  anime({
    targets: container,
    translateX: [-10, 10, -5, 5, 0],
    translateY: [-5, 5, -2, 2, 0],
    duration: 300 / speed,
    easing: "easeInOutQuad",
    loop: true, // 持続中はループ
  });

  draw();

  // エフェクト終了
  setTimeout(() => {
    canvas.remove();
    anime.remove(container); // 揺れアニメーションを停止
  }, 3000 / speed); // エフェクトの持続時間
}


function applyGlassCrackEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }

  // Canvas を作成
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // 亀裂データ
  const cracks = [];

  // 亀裂を生成
  function createBranch(x, y, length, angle, depth) {
    if (depth <= 0) return; // 深さ（分岐の回数）が0になったら終了

    const points = [];
    let currentX = x;
    let currentY = y;

    for (let i = 0; i < length; i++) {
      points.push({ x: currentX, y: currentY });
      const offset = (Math.random() - 0.7) * size / depth; // 深さによって振れ幅を小さく
      currentX += Math.cos(angle) * size / depth + offset;
      currentY += Math.sin(angle) * size / depth + offset;
      angle += (Math.random() - 0.5) * 0.6; // ランダムな角度の変化
    }

    cracks.push({ points, progress: 0, lineWidth: size / (depth + 1) }); // 線の太さは深さに応じて細く

    // ランダムに枝分かれ
    if (Math.random() < 0.7) {
      createBranch(
        currentX,
        currentY,
        length * 0.8, // 分岐は元の長さの60%
        angle + Math.random() * 0.5, // 角度を少しずらす
        depth - 1
      );
    }
    if (Math.random() < 0.7) {
      createBranch(
        currentX,
        currentY,
        length * 0.6,
        angle - Math.random() * 0.5,
        depth - 1
      );
    }
  }

  // 亀裂を描画
  function drawCracks() {
    cracks.forEach((crack) => {
      const { points, progress, lineWidth } = crack;

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      // 進行状況に応じて亀裂を描画
      const maxIndex = Math.floor(progress * points.length);
      for (let i = 1; i < maxIndex; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    });
  }

  // 描画ループ
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCracks();

    // 亀裂の進行を更新
    cracks.forEach((crack, index) => {
      crack.progress += 0.01 * speed;
      if (crack.progress >= 1) {
        cracks.splice(index, 1); // 完了した亀裂を削除
      }
    });

    if (cracks.length > 0) {
      requestAnimationFrame(draw);
    } else {
      canvas.remove(); // 亀裂が全て消えたらキャンバスを削除
    }
  }

  // 初期亀裂を生成
  for (let i = 0; i < size; i++) {
    const startX = Math.random() * canvas.width;
    const startY = Math.random() * canvas.height;
    const length = Math.random() * 20 + 30; // ランダムな亀裂の長さ
    const angle = Math.PI * (Math.random() * 2); // ランダムな角度
    const depth = Math.floor(Math.random() * 3 + 2); // 分岐の深さ
    createBranch(startX, startY, length, angle, depth);
  }

  draw();
}


function applyLightningEffect_2(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }

  // Canvas を作成
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // 雷の数
  const boltCount = 15;

  // 雷のデータ
  const bolts = [];

  // 雷を生成
  function createBolt() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // 放射状に生成する雷の方向
    for (let i = 0; i < boltCount; i++) {
      const angle = (Math.PI * 2 * i) / boltCount; // 分割角度
      const bolt = [];
      let startX = centerX;
      let startY = centerY;

      // セグメント数を `size` に応じて設定
      const segmentCount = Math.floor(size / 10) + 10; // size に比例してセグメント数を増加

      for (let j = 0; j < segmentCount; j++) {
        const randomAngleOffset = (Math.random() - 0.5) * 0.2; // ランダムな曲がり
        const adjustedAngle = angle + randomAngleOffset;

        const endX = startX + Math.cos(adjustedAngle) * (Math.random() * 50);
        const endY = startY + Math.sin(adjustedAngle) * (Math.random() * 50);

        bolt.push({ startX, startY, endX, endY });
        startX = endX;
        startY = endY;
      }

      bolts.push(bolt);
    }
  }

  // 雷を描画
  function drawBolt(bolt) {
    bolt.forEach((segment) => {
      // 中心からの距離を計算
      const distanceFromCenter = Math.sqrt(
        Math.pow(segment.endX - canvas.width / 1.5, 2) +
        Math.pow(segment.endY - canvas.height / 1.5, 2)
      );
  
      const maxDistance = Math.sqrt(
        Math.pow(canvas.width / 2, 2) + Math.pow(canvas.height / 2, 2)
      );
  
      // 太さを `size` に基づいて調整し、外側に行くほど増加
      const baseThickness = size / 50; // `size` に基づく基準の太さ
      const thickness = baseThickness + (distanceFromCenter / maxDistance) * (baseThickness * 3.0);
  
      ctx.beginPath();
      ctx.moveTo(segment.startX, segment.startY);
      ctx.lineTo(segment.endX, segment.endY);
  
      ctx.strokeStyle = color;
      ctx.lineWidth = thickness; // 太さを動的に適用
      ctx.stroke();
    });
  }
  

  // 描画ループ
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    bolts.forEach((bolt, index) => {
      drawBolt(bolt);
      bolts.splice(index, 1); // 一度表示した雷を削除
    });

    if (bolts.length < 1) {
      createBolt(); // 次の雷を生成
    }

    requestAnimationFrame(draw);
  }

  draw();

  // 一定時間で終了
  setTimeout(() => {
    canvas.remove();
  }, 2000 / speed); // エフェクトの持続時間
}

// 氷の結晶生成エフェクト
function applyIceCrystalEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }

  // コンテナ反転の設定
  setContainerTransform(container, direction);

  // Canvas を作成して配置
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // 氷の結晶の設定
  const crystal = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: size / 2,
    branches: 6, // 結晶の枝数
    alpha: 1.0, // 初期透明度
  };

  // Anime.js を使った生成アニメーション
  anime({
    targets: crystal,
    radius: size, // 結晶を徐々に大きく
    alpha: 0, // 徐々に透明化
    easing: "easeOutQuad",
    duration: 2000 / speed, // スピードを反映
    update: () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawCrystal(ctx, crystal, color);
    },
    complete: () => {
      canvas.remove(); // アニメーション終了時にキャンバスを削除
    },
  });

  // 氷の結晶を描画する関数
  function drawCrystal(ctx, crystal, color) {
    ctx.save();
    ctx.translate(crystal.x, crystal.y);
    ctx.globalAlpha = crystal.alpha;

    // 枝を描画
    for (let i = 0; i < crystal.branches; i++) {
      ctx.save();
      ctx.rotate((Math.PI * 2 * i) / crystal.branches);
      drawBranch(ctx, crystal.radius, color);
      ctx.restore();
    }

    ctx.restore();
  }

  // 枝を描画する関数
  function drawBranch(ctx, length, color) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -length);

    // 小枝を追加
    const branchCount = 3;
    for (let i = 1; i <= branchCount; i++) {
      const offset = (length / branchCount) * i;
      const smallLength = length / 5;
      ctx.moveTo(0, -offset);
      ctx.lineTo(-smallLength, -offset - smallLength);
      ctx.moveTo(0, -offset);
      ctx.lineTo(smallLength, -offset - smallLength);
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

// 星屑の降下エフェクト
function applyFallingStarEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }

  // コンテナ反転の設定
  setContainerTransform(container, direction);

  // Canvas を作成して配置
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // 星屑の設定
  const stars = Array.from({ length: size }, () => ({
    x: Math.random() * canvas.width,
    y: -Math.random() * canvas.height, // 画面上からスタート
    radius: Math.random() * (size / 10) + 2, // ランダムなサイズ
    speed: Math.random() * speed + speed / 2, // ランダムな速度
    alpha: Math.random() * 0.8 + 0.2, // ランダムな透明度
    tailLength: Math.random() * 50 + 30, // 尾の長さ
  }));

  let elapsedTime = 0; // 経過時間
  const duration = 5000; // エフェクトの継続時間 (ミリ秒)

  // 星屑の移動アニメーションを実現
  function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawStars(ctx, stars, color);

    stars.forEach((star) => {
      star.y += star.speed; // 一定速度で降下

      // 画面外に出たら上に戻す
      if (star.y - star.radius > canvas.height) {
        star.y = -star.tailLength;
        star.x = Math.random() * canvas.width;
      }
    });

    elapsedTime += 16; // フレームごとに約16msを加算 (60FPS基準)
    if (elapsedTime < duration) {
      requestAnimationFrame(update);
    } else {
      canvas.remove(); // エフェクト終了時にキャンバスを削除
    }
  }

  update();

  // 星屑を描画する関数
  function drawStars(ctx, stars, color) {
    stars.forEach((star) => {
      // 星の尾
      ctx.beginPath();
      const gradient = createGradient(ctx, star.x, star.y, star.tailLength, star.alpha);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = star.radius / 2;
      ctx.moveTo(star.x, star.y);
      ctx.lineTo(star.x, star.y - star.tailLength);
      ctx.stroke();

      // 星本体
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${hexToRgb(color)}, ${star.alpha})`;
      ctx.fill();
    });
  }


  // 煙のグラデーション設定
  function createGradient(ctx, x, y, radius, alpha) {
    // 開始色 (指定された色)
    const startColor = color; // ユーザー指定の色

    // 終了色を自動生成 (例: 赤 → 黄)
    const endColor = generateEndColor(startColor);

    // グラデーションステップ数を設定
    const gradientSteps = 10;

    // グラデーション色を生成
    const gradientColors = generateGradient(endColor, startColor, gradientSteps);

    // グラデーションを作成
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

    // グラデーションの色を追加
    gradientColors.forEach((color, index) => {
      const position = index / (gradientColors.length - 1); // 色の位置を計算
      gradient.addColorStop(position, `rgba(${hexToRgb(color)}, ${alpha * (1 - position)})`);
    });

    return gradient;
  }
}

// エナジービームエフェクト
function applyEnergyBeamEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }

  // コンテナ反転の設定
  setContainerTransform(container, direction);

  // Canvas を作成して配置
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // ビームの設定
  const beam = {
    x: canvas.width / 4, // ビームの始点 (X座標)
    y: canvas.height / 2, // ビームの始点 (Y座標)
    targetX: canvas.width, // ビームの終点 (X座標)
    targetY: canvas.height / 2, // ビームの終点 (Y座標)
    width: size / 10, // ビームの幅
    alpha: 1.0, // 初期透明度
  };

  // Anime.js を使ったビームの拡大アニメーション
  anime({
    targets: beam,
    x: beam.targetX, // ビームを画面端まで伸ばす
    easing: "linear",
    duration: 1000 / speed, // ビームの速度を反映
    update: () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawBeam(ctx, beam, color);
    },
    complete: () => {
      canvas.remove(); // アニメーション終了時にキャンバスを削除
    },
  });

  // ビームを描画する関数
  function drawBeam(ctx, beam, color) {
    ctx.save();
    ctx.globalAlpha = beam.alpha;

    // グラデーションの設定
    const gradient = createGradient(ctx, beam.x, beam.y, beam.width * 5, beam.alpha);

    // ビーム本体
    ctx.beginPath();
    ctx.moveTo(beam.x, beam.y - beam.width / 2);
    ctx.lineTo(beam.x, beam.y + beam.width / 2);
    ctx.lineTo(beam.targetX, beam.targetY + beam.width / 2);
    ctx.lineTo(beam.targetX, beam.targetY - beam.width / 2);
    ctx.closePath();

    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.restore();
  }

  // 煙のグラデーション設定
  function createGradient(ctx, x, y, radius, alpha) {
    // 開始色 (指定された色)
    const startColor = color; // ユーザー指定の色

    // 終了色を自動生成 (例: 赤 → 黄)
    const endColor = generateEndColor(startColor);

    // グラデーションステップ数を設定
    const gradientSteps = 10;

    // グラデーション色を生成
    const gradientColors = generateGradient(endColor, startColor, gradientSteps);

    // グラデーションを作成
    const gradient = ctx.createLinearGradient(x, y, x + radius, y);

    // グラデーションの色を追加
    gradientColors.forEach((color, index) => {
      const position = index / (gradientColors.length - 1); // 色の位置を計算
      gradient.addColorStop(position, `rgba(${hexToRgb(color)}, ${alpha * (1 - position)})`);
    });

    return gradient;
  }
}

// 稲妻の衝撃エフェクト
function applyLightningStrikeEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }

  // コンテナ反転の設定
  setContainerTransform(container, direction);

  // Canvas を作成して配置
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // 稲妻の設定 (固定位置)
  const lightning = {
    xStart: canvas.width / 2, // 稲妻の開始位置 (上部中央)
    yStart: 0, // 稲妻の開始位置 (画面上)
    xEnd: canvas.width / 2, // 稲妻の終了位置 (下部中央)
    yEnd: canvas.height, // 稲妻の終了位置 (画面下)
    segments: Math.floor(size / 10) + 5, // 稲妻のセグメント数
    alpha: 1.0, // 初期透明度
  };

  // 稲妻を描画する関数
  function drawLightning(ctx, lightning, color) {
    const points = generateLightningPoints(
      lightning.xStart,
      lightning.yStart,
      lightning.xEnd,
      lightning.yEnd,
      lightning.segments
    );

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach((point) => {
      ctx.lineTo(point.x, point.y);
    });

    const gradient = ctx.createLinearGradient(
      lightning.xStart,
      lightning.yStart,
      lightning.xEnd,
      lightning.yEnd
    );
    const rgb = hexToRgb(color);
    gradient.addColorStop(0, `rgba(${rgb}, ${lightning.alpha})`);
    gradient.addColorStop(1, `rgba(${rgb}, 0)`);

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // 稲妻の点を生成する関数
  function generateLightningPoints(xStart, yStart, xEnd, yEnd, segments) {
    const points = [{ x: xStart, y: yStart }];
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const x = lerp(xStart, xEnd, t) + (Math.random() - 0.5) * size * 0.2;
      const y = lerp(yStart, yEnd, t) + (Math.random() - 0.5) * size * 0.2;
      points.push({ x, y });
    }
    points.push({ x: xEnd, y: yEnd });
    return points;
  }

  // 線形補間関数
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // 稲妻のアニメーション
  function animateLightning() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawLightning(ctx, lightning, color);

    lightning.alpha -= 0.05 * speed; // 徐々に透明化

    if (lightning.alpha > 0) {
      requestAnimationFrame(animateLightning);
    } else {
      canvas.remove(); // アニメーション終了時にキャンバスを削除
    }
  }

  animateLightning();

}

// 直線ビームと周囲に稲妻の電撃エフェクト ビームと電気が別れてる
function applyElectricBeamEffect_2(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }

  // コンテナ反転の設定
  setContainerTransform(container, direction);

  // Canvas を作成して配置
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // ビームの設定
  const beam = {
    xStart: canvas.width / 2, // ビームの開始位置 (中央上)
    yStart: 0,
    xEnd: canvas.width / 2, // ビームの終了位置 (中央下)
    yEnd: canvas.height * 1.3,
    width: size / 8, // ビームの幅
    alpha: 1.0, // 初期透明度
  };

  // 稲妻の設定
  const lightningSegments = Math.floor(size / 20) + 5; // 稲妻のセグメント数

  // ビームを描画する関数
  function drawBeam(ctx, beam, color) {
    const startColor = color; // ビーム中央の色
    const endColor = generateEndColor(color); // ビーム外側の色

    const gradient = ctx.createLinearGradient(
      beam.xStart - beam.width / 2, // 左側
      0,
      beam.xStart + beam.width / 2, // 右側
      0
    );

    // 左端から中央、右端の順でグラデーションを設定
    gradient.addColorStop(0, `rgba(${hexToRgb(startColor)}, ${beam.alpha})`); // 左端
    gradient.addColorStop(0.5, `rgba(${hexToRgb(endColor)}, ${beam.alpha})`); // 中央
    gradient.addColorStop(1, `rgba(${hexToRgb(startColor)}, ${beam.alpha})`); // 右端

    ctx.beginPath();
    ctx.moveTo(beam.xStart, beam.yStart);
    ctx.lineTo(beam.xEnd, beam.yEnd);
    ctx.lineWidth = beam.width;
    ctx.strokeStyle = gradient;
    ctx.stroke();
  }

  // 稲妻を描画する関数
  function drawLightning(ctx, beam, color) {
    const points = generateLightningPoints(
      beam.xStart,
      beam.yStart,
      beam.xEnd,
      beam.yEnd,
      lightningSegments
    );

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach((point) => {
      ctx.lineTo(point.x, point.y);
    });

    const gradient = ctx.createLinearGradient(
      beam.xStart,
      beam.yStart,
      beam.xEnd,
      beam.yEnd
    );
    const rgb = hexToRgb(color);
    gradient.addColorStop(0, `rgba(${rgb}, 1)`);
    gradient.addColorStop(1, `rgba(${rgb}, 0)`);

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // 稲妻の点を生成する関数
  function generateLightningPoints(xStart, yStart, xEnd, yEnd, segments) {
    const points = [{ x: xStart, y: yStart }];
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const x = lerp(xStart, xEnd, t) + (Math.random() - 0.5) * size * 0.3;
      const y = lerp(yStart, yEnd, t) + (Math.random() - 0.5) * size * 0.3;
      points.push({ x, y });
    }
    points.push({ x: xEnd, y: yEnd });
    return points;
  }

  // 線形補間関数
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // エフェクトのアニメーション
  function animateEffect() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ビームを描画
    drawBeam(ctx, beam, color);

    // 稲妻を描画
    for (let i = 0; i < 3; i++) {
      drawLightning(ctx, beam, color);
    }

    beam.alpha -= 0.02 * speed; // 徐々に透明化

    if (beam.alpha > 0) {
      requestAnimationFrame(animateEffect);
    } else {
      canvas.remove(); // アニメーション終了時にキャンバスを削除
    }
  }

  animateEffect();
}

// 直線ビームと周囲に稲妻の電撃エフェクト
function applyElectricBeamEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }

  // コンテナ反転の設定
  setContainerTransform(container, direction);

  // Canvas を作成して配置
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // ビームの設定
  const beam = {
    xStart: canvas.width / 2, // ビームの開始位置 (中央上)
    yStart: 0,
    xEnd: canvas.width / 2, // ビームの終了位置 (中央下)
    yEnd: canvas.height,
    width: size / 8, // ビームの幅
    alpha: 1.0, // 初期透明度
  };

  // 稲妻の設定
  const lightningSegments = Math.floor(size / 10) + 5; // 稲妻のセグメント数
  const lightningWidth = beam.width * 1.5; // 稲妻の横幅はビームより大きい

  // ビームを描画する関数
  function drawBeam(ctx, beam, color) {
    const startColor = color; // ビーム中央の色
    const endColor = generateEndColor(color); // ビーム外側の色

    const gradient = ctx.createLinearGradient(
      beam.xStart - beam.width / 2, // 左側
      0,
      beam.xStart + beam.width / 2, // 右側
      0
    );

    // 左端から中央、右端の順でグラデーションを設定
    gradient.addColorStop(0, `rgba(${hexToRgb(startColor)}, ${beam.alpha})`); // 左端
    gradient.addColorStop(0.5, `rgba(${hexToRgb(endColor)}, ${beam.alpha})`); // 中央
    gradient.addColorStop(1, `rgba(${hexToRgb(startColor)}, ${beam.alpha})`); // 右端

    ctx.beginPath();
    ctx.moveTo(beam.xStart, beam.yStart);
    ctx.lineTo(beam.xEnd, beam.yEnd);
    ctx.lineWidth = beam.width;
    ctx.strokeStyle = gradient;
    ctx.stroke();
  }

  // 稲妻を描画する関数
  function drawLightning(ctx, beam, color) {
    const points = generateLightningPoints(
      beam.xStart,
      beam.yStart,
      beam.xEnd,
      beam.yEnd,
      lightningSegments
    );

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach((point) => {
      ctx.lineTo(point.x, point.y);
    });

    const gradient = ctx.createLinearGradient(
      beam.xStart - lightningWidth / 2, // 左側
      0,
      beam.xStart + lightningWidth / 2, // 右側
      0
    );

    // 左端から中央、右端の順でグラデーションを設定
    gradient.addColorStop(0, `rgba(${hexToRgb(color)}, 1)`); // 左端
    gradient.addColorStop(0.5, `rgba(${hexToRgb(generateEndColor(color))}, 1)`); // 中央
    gradient.addColorStop(1, `rgba(${hexToRgb(color)}, 1)`); // 右端

    ctx.strokeStyle = gradient;
    ctx.lineWidth = lightningWidth;
    ctx.stroke();
  }

  // 稲妻の点を生成する関数
  function generateLightningPoints(xStart, yStart, xEnd, yEnd, segments) {
    const points = [{ x: xStart, y: yStart }];
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const x = lerp(xStart, xEnd, t) + (Math.random() - 0.5) * size * 0.1;
      const y = lerp(yStart, yEnd, t) + (Math.random() - 0.5) * size * 0.1;
      points.push({ x, y });
    }
    points.push({ x: xEnd, y: yEnd });
    return points;
  }

  // 線形補間関数
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // エフェクトのアニメーション
  function animateEffect() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ビームを描画
    drawBeam(ctx, beam, color);

    // 稲妻を描画
    for (let i = 0; i < 3; i++) {
      drawLightning(ctx, beam, color);
    }

    beam.alpha -= 0.02 * speed; // 徐々に透明化

    if (beam.alpha > 0) {
      requestAnimationFrame(animateEffect);
    } else {
      canvas.remove(); // アニメーション終了時にキャンバスを削除
    }
  }

  animateEffect();
}

// 直線ビームのみのエフェクト (グラデーション付き、徐々に細くなって消える)
function applyBeamEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }

  // コンテナ反転の設定
  setContainerTransform(container, direction);

  // Canvas を作成して配置
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // ビームの設定
  const beam = {
    xStart: canvas.width / 2, // ビームの開始位置 (中央上)
    yStart: 0,
    xEnd: canvas.width / 2, // ビームの終了位置 (中央下)
    yEnd: canvas.height,
    width: size / 8, // ビームの幅
    alpha: 1.0, // 初期透明度
  };

  // 閃光の設定
  const flash = {
    x: canvas.width / 2,
    y: 0,
    radius: size / 20, // 非常に小さな初期半径
    maxRadius: size, // 小さな最大半径
    alpha: 1,
  };

  // 閃光を描画する関数
  function drawFlash() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (flash.radius < flash.maxRadius && flash.alpha > 0) {
      // 閃光のグラデーション
      const gradient = ctx.createRadialGradient(
        flash.x,
        flash.y,
        0,
        flash.x,
        flash.y,
        flash.radius
      );
      const rgb = hexToRgb(color);
      gradient.addColorStop(0, `rgba(${rgb}, ${flash.alpha})`);
      gradient.addColorStop(1, `rgba(${rgb}, 0)`);

      ctx.beginPath();
      ctx.arc(flash.x, flash.y, flash.radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // 閃光の更新
      flash.radius += speed * 3; // 半径を広げる
      flash.alpha -= 0.02 * speed; // 徐々に透明に

      requestAnimationFrame(drawFlash);
    } else {
      // 閃光が終わったらレーザーを発射
      animateBeam();
    }
  }

  // ビームを描画する関数
  function drawBeam(ctx, beam, color) {
    const startColor = color; // ビーム中央の色
    const endColor = generateEndColor(color); // ビーム外側の色

    const gradient = ctx.createLinearGradient(
      beam.xStart - beam.width / 2, // 左側
      0,
      beam.xStart + beam.width / 2, // 右側
      0
    );

    // 左端から中央、右端の順でグラデーションを設定
    gradient.addColorStop(0, `rgba(${hexToRgb(startColor)}, ${beam.alpha})`); // 左端
    gradient.addColorStop(0.5, `rgba(${hexToRgb(endColor)}, ${beam.alpha})`); // 中央
    gradient.addColorStop(1, `rgba(${hexToRgb(startColor)}, ${beam.alpha})`); // 右端

    ctx.beginPath();
    ctx.moveTo(beam.xStart, beam.yStart);
    ctx.lineTo(beam.xEnd, beam.yEnd);
    ctx.lineWidth = beam.width;
    ctx.strokeStyle = gradient;
    ctx.stroke();
  }

  // エフェクトのアニメーション
  function animateBeam() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ビームを描画
    drawBeam(ctx, beam, color);

    // ビームを徐々に細く、透明に
    beam.width -= 0.2 * speed; // 幅を徐々に細く
    beam.alpha -= 0.02 * speed; // 徐々に透明化

    if (beam.alpha > 0 && beam.width > 0) {
      requestAnimationFrame(animateBeam);
    } else {
      canvas.remove(); // アニメーション終了時にキャンバスを削除
    }
  }

  drawFlash();
}

// 燃え上がる炎エフェクト
function applyFlamingEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }

  // コンテナ反転の設定
  setContainerTransform(container, direction);

  // Canvas を作成して配置
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // 炎のパーティクル設定
  const particles = [];
  const particleCount = Math.floor(size * 1.5);

  // タイマーの設定
  const startTime = performance.now();
  const endTime = startTime + 5000 / speed; // 終了時間 (ミリ秒)
  
  for (let i = 0; i < particleCount; i++) {
    particles.push(createParticle());
  }

  function createParticle() {
    return {
      x: canvas.width / 2 + (Math.random() - 0.5) * size, // 炎の中心からランダムに広がる
      y: canvas.height - 20, // 炎の起点 (下端付近)
      radius: Math.random() * (size / 15) + 2, // ランダムな粒子サイズ
      alpha: Math.random() * 0.5 + 0.5, // ランダムな透明度
      vy: -(Math.random() * speed + speed / 2), // 上昇速度
      vx: (Math.random() - 0.5) * speed, // 横方向の動き
      lifetime: Math.random() * 100 + 100, // パーティクルの寿命
    };
  }

  // 炎のパーティクルを描画する関数
  function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);


    const currentTime = performance.now();
    // 終了時間を超えた場合は停止
    if (currentTime >= endTime) {
      canvas.remove(); // Canvas を削除してエフェクトを終了
      return;
    }
    
    particles.forEach((particle, index) => {
      if (particle.lifetime <= 0 || particle.alpha <= 0) {
        particles.splice(index, 1);
        particles.push(createParticle()); // 新しいパーティクルを追加
        return;
      }

      // グラデーションを作成
      const gradient = ctx.createRadialGradient(
        particle.x,
        particle.y,
        0,
        particle.x,
        particle.y,
        particle.radius
      );
      const startColor = color;
      const endColor = generateEndColor(color);

      gradient.addColorStop(0, `rgba(${hexToRgb(startColor)}, ${particle.alpha})`);
      gradient.addColorStop(1, `rgba(${hexToRgb(endColor)}, 0)`);

      // パーティクルを描画
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // パーティクルを更新
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.alpha -= 0.01 * speed;
      particle.lifetime -= 1;
    });

    requestAnimationFrame(drawParticles);
  }

  drawParticles();
}


// ブラックホールのような穴が開くエフェクト
function applyBlackHoleEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }

  // コンテナ反転の設定
  setContainerTransform(container, direction);

  // Canvas を作成して配置
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // ブラックホールの設定
  const blackHole = {
    x: canvas.width / 2, // 中央位置
    y: canvas.height / 2,
    radius: size / 20, // 初期半径
    maxRadius: size, // 最大半径
    alpha: 1,
    swirlParticles: [],
  };

  // 渦巻きパーティクルの設定
  for (let i = 0; i < 100; i++) {
    blackHole.swirlParticles.push(createSwirlParticle());
  }

  function createSwirlParticle() {
    const angle = Math.random() * Math.PI * 2;
    return {
      x: blackHole.x + Math.cos(angle) * blackHole.radius,
      y: blackHole.y + Math.sin(angle) * blackHole.radius,
      angle: angle,
      distance: Math.random() * blackHole.maxRadius,
      speed: Math.random() * speed * 0.5 + speed * 0.2,
      alpha: Math.random() * 0.5 + 0.5,
    };
  }

  // ブラックホールを描画する関数
  function drawBlackHole() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ブラックホールの中心を描画
    const gradient = ctx.createRadialGradient(
      blackHole.x,
      blackHole.y,
      0,
      blackHole.x,
      blackHole.y,
      blackHole.radius
    );

    gradient.addColorStop(0, `rgba(0, 0, 0, ${blackHole.alpha})`);
    gradient.addColorStop(1, `rgba(${hexToRgb(color)}, 0)`);

    ctx.beginPath();
    ctx.arc(blackHole.x, blackHole.y, blackHole.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // 渦巻きパーティクルを描画
    blackHole.swirlParticles.forEach((particle) => {
      const gradientParticle = ctx.createRadialGradient(
        particle.x,
        particle.y,
        0,
        particle.x,
        particle.y,
        3
      );
      gradientParticle.addColorStop(0, `rgba(${hexToRgb(color)}, ${particle.alpha})`);
      gradientParticle.addColorStop(1, `rgba(${hexToRgb(color)}, 0)`);

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = gradientParticle;
      ctx.fill();

      // パーティクルの回転と縮小
      particle.angle += particle.speed * 0.01;
      particle.distance -= particle.speed * 0.1;
      particle.x = blackHole.x + Math.cos(particle.angle) * particle.distance;
      particle.y = blackHole.y + Math.sin(particle.angle) * particle.distance;
      particle.alpha -= 0.01 * speed;

      if (particle.distance < 5 || particle.alpha <= 0) {
        // パーティクルが中心に吸い込まれたら再生成
        Object.assign(particle, createSwirlParticle());
      }
    });

    // ブラックホールの成長
    if (blackHole.radius < blackHole.maxRadius && blackHole.alpha > 0) {
      blackHole.radius += speed;
      blackHole.alpha -= 0.01 * speed;
      requestAnimationFrame(drawBlackHole);
    } else {
      canvas.remove(); // エフェクト終了時にキャンバスを削除
    }
  }

  drawBlackHole();

}


// 粒子が出現し、波紋が広がるエフェクト
function applyParticleRippleEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }

  // コンテナ反転の設定
  setContainerTransform(container, direction);

  // Canvas を作成して配置
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // 粒子設定
  const particles = [];
  const maxParticles = Math.floor(size * 2);

  function createParticle() {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const radius = Math.random() * (size / 10) + 5; // ランダムな半径
    return {
      x,
      y,
      radius,
      rippleRadius: 0,
      maxRippleRadius: radius * 5, // 波紋の最大半径
      alpha: 1,
    };
  }

  function addParticle() {
    if (particles.length < maxParticles) {
      particles.push(createParticle());
    }
  }
  // タイマーの設定
  const startTime = performance.now();
  const endTime = startTime + 5000 / speed; // 終了時間 (ミリ秒)


  // 粒子と波紋を描画する関数
  function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((particle, index) => {
      if (particle.rippleRadius >= particle.maxRippleRadius || particle.alpha <= 0) {
        particles.splice(index, 1); // 粒子を削除
        return;
      }

      // 粒子の描画
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${hexToRgb(color)}, ${particle.alpha})`;
      ctx.fill();

      // 波紋の描画
      const gradient = ctx.createRadialGradient(
        particle.x,
        particle.y,
        0,
        particle.x,
        particle.y,
        particle.rippleRadius
      );
      const startColor = color;
      const endColor = generateEndColor(color);
      gradient.addColorStop(0, `rgba(${hexToRgb(startColor)}, ${particle.alpha})`);
      gradient.addColorStop(1, `rgba(${hexToRgb(endColor)}, 0)`);

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.rippleRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // 更新
      particle.rippleRadius += speed * 2; // 波紋を広げる
      particle.alpha -= 0.02 * speed; // 徐々に透明に
    });

    requestAnimationFrame(drawParticles);

    const currentTime = performance.now();
    // 終了時間を超えた場合は停止
    if (currentTime >= endTime) {
      canvas.remove(); // Canvas を削除してエフェクトを終了
      return;
    }
  }

  // 粒子を定期的に追加
  setInterval(addParticle, 100);

  drawParticles();

}

// 空間の裂け目エフェクト
function applySpaceRiftEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }

  // コンテナ反転の設定
  setContainerTransform(container, direction);

  // Canvas を作成して配置
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // 裂け目の設定
  const rift = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: size / 2, // 裂け目の幅
    height: 0, // 初期高さ
    maxHeight: size, // 最大高さ
    alpha: 1.0,
  };

  // 波動の設定
  const ripples = [];
  const rippleCount = 5;
  for (let i = 0; i < rippleCount; i++) {
    ripples.push(createRipple());
  }

  function createRipple() {
    return {
      x: rift.x,
      y: rift.y,
      radius: 0,
      maxRadius: size * 2,
      alpha: 0.5,
    };
  }

  // 裂け目を描画する関数
  function drawRift() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 裂け目を描画
    ctx.beginPath();
    ctx.rect(
      rift.x - rift.width / 2,
      rift.y - rift.height / 2,
      rift.width,
      rift.height
    );
    ctx.fillStyle = `rgba(${hexToRgb(color)}, ${rift.alpha})`;
    ctx.fill();

    // 裂け目の波動を描画
    ripples.forEach((ripple, index) => {
      if (ripple.radius >= ripple.maxRadius || ripple.alpha <= 0) {
        ripples.splice(index, 1);
        ripples.push(createRipple());
        return;
      }

      const gradient = ctx.createRadialGradient(
        ripple.x,
        ripple.y,
        0,
        ripple.x,
        ripple.y,
        ripple.radius
      );
      const startColor = color;
      const endColor = generateEndColor(color);

      gradient.addColorStop(0, `rgba(${hexToRgb(startColor)}, ${ripple.alpha})`);
      gradient.addColorStop(1, `rgba(${hexToRgb(endColor)}, 0)`);

      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // 波動の更新
      ripple.radius += speed * 2;
      ripple.alpha -= 0.01 * speed;
    });

    // 裂け目の成長
    if (rift.height < rift.maxHeight) {
      rift.height += speed * 2;
      requestAnimationFrame(drawRift);
    } else {
      // 裂け目が完全に展開した後も波動を維持
      setTimeout(() => {
        canvas.remove(); // エフェクト終了時にキャンバスを削除
      }, 5000);
    }
  }

  drawRift();

}

// 動くオーラエフェクト
function applyMovingAuraEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }

  // コンテナ反転の設定
  setContainerTransform(container, direction);

  // Canvas を作成して配置
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // オーラの設定
  const auraParticles = [];
  const maxParticles = Math.floor(size * 1.5);

  for (let i = 0; i < maxParticles; i++) {
    auraParticles.push(createParticle());
  }

  function createParticle() {
    const angle = Math.random() * Math.PI * 2;
    return {
      x: canvas.width / 2,
      y: canvas.height / 2,
      radius: Math.random() * (size / 10) + 5, // ランダムな半径
      alpha: Math.random() * 0.5 + 0.5, // ランダムな透明度
      angle: angle, // 動きの角度
      speed: Math.random() * speed * 0.2 + speed * 0.1, // 動きの速さ
      expansion: Math.random() * 2 + 1, // 拡大速度
    };
  }

  // オーラを描画する関数
  function drawAura() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    auraParticles.forEach((particle, index) => {
      if (particle.alpha <= 0) {
        // パーティクルが消えたら再生成
        auraParticles.splice(index, 1);
        auraParticles.push(createParticle());
        return;
      }

      // グラデーションを作成
      const gradient = ctx.createRadialGradient(
        particle.x,
        particle.y,
        0,
        particle.x,
        particle.y,
        particle.radius
      );
      const startColor = color;
      const endColor = generateEndColor(color);
      gradient.addColorStop(0, `rgba(${hexToRgb(startColor)}, ${particle.alpha})`);
      gradient.addColorStop(1, `rgba(${hexToRgb(endColor)}, 0)`);

      // オーラを描画
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // パーティクルの更新
      particle.radius += particle.expansion * 0.1; // 拡大
      particle.x += Math.cos(particle.angle) * particle.speed; // 横方向の動き
      particle.y += Math.sin(particle.angle) * particle.speed; // 縦方向の動き
      particle.alpha -= 0.01 * speed; // 徐々に透明化
    });

    requestAnimationFrame(drawAura);
  }

  drawAura();

}

function applyZigzagBeamEffect(size, speed, color, duration) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }
  speed = speed * 12.0
  // Canvas を作成して配置
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // 軌道リストをランダム生成 (画面内で曲がるように制御)
  const directionList = generateRandomDirectionList(8, canvas.width, canvas.height);

  // 彗星の設定
  const comet = {
    x: canvas.width / 2, // 初期位置 (上中央)
    y: 0, // 初期位置 (上端)
    radius: size / 10, // 彗星の半径
    vx: 0, // 初期の横方向速度
    vy: speed, // 初期の縦方向速度
    trail: [], // 残像のリスト
    trailMaxLength: 20, // 残像の最大数
    directionIndex: 0, // 現在の方向インデックス
  };

  const startTime = performance.now();

  // 彗星を描画する関数
  let frameCounter = 0;

  function drawComet() {
    const currentTime = performance.now();
    if (currentTime - startTime >= duration * 1000) {
      canvas.remove(); // 一定時間でエフェクトを終了
      return;
    }
  
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    // 速度に応じた残像記録間隔を計算
    const recordInterval = Math.max(1, Math.floor(6 / speed)); // 最小間隔を1に設定
  
    // 残像を記録 (速度に応じてフレーム間隔を変化)
    if (frameCounter % recordInterval === 0) {
      comet.trail.push({
        x: comet.x,
        y: comet.y,
        radius: comet.radius,
      });
      if (comet.trail.length > comet.trailMaxLength) {
        comet.trail.shift();
      }
    }
    frameCounter++;
  
    // 残像の描画
    comet.trail.forEach((trail, index) => {
      if (!isFinite(trail.x) || !isFinite(trail.y) || !isFinite(trail.radius)) return;
  
      const alpha = Math.min(1, (index + 1) / comet.trail.length); // 透明度
      const gradient = ctx.createRadialGradient(
        trail.x,
        trail.y,
        0,
        trail.x,
        trail.y,
        trail.radius
      );
  
      const startColor = color;
      const endColor = generateEndColor(color);
  
      gradient.addColorStop(0, `rgba(${hexToRgb(startColor)}, ${alpha})`);
      gradient.addColorStop(1, `rgba(${hexToRgb(endColor)}, 0)`);
  
      ctx.beginPath();
      ctx.arc(trail.x, trail.y, trail.radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    });
  
    // 彗星の描画
    if (!isFinite(comet.x) || !isFinite(comet.y) || !isFinite(comet.radius)) return;
  
    const cometGradient = ctx.createRadialGradient(
      comet.x,
      comet.y,
      0,
      comet.x,
      comet.y,
      comet.radius
    );
    cometGradient.addColorStop(0, `rgba(${hexToRgb(color)}, 1)`);
    cometGradient.addColorStop(1, `rgba(${hexToRgb(color)}, 0)`);
  
    ctx.beginPath();
    ctx.arc(comet.x, comet.y, comet.radius, 0, Math.PI * 2);
    ctx.fillStyle = cometGradient;
    ctx.fill();
  
    // 方向を更新 (重要な修正ポイント)
    updateDirection();
  
    // 彗星の位置を更新
    comet.x += comet.vx;
    comet.y += comet.vy;
  
    requestAnimationFrame(drawComet);
  }
  drawComet()
  // 軌道の更新 (ジグザグの動作を制御)
  function updateDirection() {
    if (
      comet.directionIndex < directionList.length &&
      comet.y > canvas.height * (comet.directionIndex / directionList.length)
    ) {
      const currentDirection = directionList[comet.directionIndex];
      comet.vx = currentDirection.vx;
      comet.vy = currentDirection.vy;
      comet.directionIndex++;
    }
  }
  
  // ランダムな方向リストを生成する関数 (変更なし)
  function generateRandomDirectionList(steps, canvasWidth, canvasHeight) {
    const directions = [];
    let currentX = canvasWidth / 2; // 上中央の初期X位置
    let currentY = 0; // 初期Y位置
  
    for (let i = 0; i < steps - 1; i++) {
      let vx = 0, vy = speed;
  
      // ランダムに方向を決めるが、画面外に出ないよう調整
      const random = Math.random();
      if (random < 0.33 && currentX + speed < canvasWidth) {
        vx = speed; // diagonal-right
        vy = speed;
      } else if (random < 0.66 && currentX - speed > 0) {
        vx = -speed; // diagonal-left
        vy = speed;
      } else if (currentY + speed < canvasHeight) {
        vx = 0; // down
        vy = speed;
      }
  
      // 次の位置を計算
      currentX += vx;
      currentY += vy;
  
      // リストに方向を追加
      directions.push({ vx, vy });
    }
  
    // 最後の方向を下中央に調整
    const finalVx = canvasWidth / 2 - currentX !== 0 ? (canvasWidth / 2 - currentX) / 50 : 0;
    const finalVy = canvasHeight - currentY !== 0 ? (canvasHeight - currentY) / 50 : speed;
    directions.push({ vx: finalVx, vy: finalVy });
  
    return directions;
  }
}

// 弧を描いて進み、一定距離で炸裂する打撃エフェクト applyImpactAttackEffect
// 渦巻き状に進み、炸裂する打撃エフェクト
function applyImpactAttackEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }

  speed = speed * 8.0;

  // コンテナ反転の設定
  setContainerTransform(container, direction);

  // Canvas を作成して配置
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // 攻撃エフェクトの設定
  const attack = {
    centerX: canvas.width - 210, // 渦巻きの中心 (中央右寄り)
    centerY: canvas.height / 2, // 渦巻きの垂直中央
    angle: 0, // 現在の角度
    radius: size / 3, // 攻撃の半径
    pathRadius: 110, // 渦巻きの初期半径
    pathRadiusDecay: 2.5, // 渦巻きの収束速度
    maxAngle: Math.PI * 2 - Math.PI / 4, // 1回転手前で炸裂
    alpha: 1.0, // 初期透明度
    trail: [], // 残像リスト
    trailMaxLength: 10, // 残像の最大数
  };

  // 炸裂を描画する関数 (円から輪に変更)
function drawExplosion(x, y) {
  let explosionRadius = 0;
  const maxExplosionRadius = size;

  function animateExplosion() {
    if (explosionRadius >= maxExplosionRadius) {
      canvas.remove();
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createRadialGradient(x, y, explosionRadius / 2, x, y, explosionRadius);
    // const startColor = color;
    // const endColor = generateEndColor(color);

    // gradient.addColorStop(0, `rgba(${hexToRgb(startColor)}, ${alpha})`);
    // gradient.addColorStop(1, `rgba(${hexToRgb(endColor)}, 0)`);

    const startColor = color
    const endColor = "rgba(255, 255, 255, 0)"; // 内側は透明

    gradient.addColorStop(0, endColor); // 内側透明
    gradient.addColorStop(1, startColor); // 外側白

    ctx.beginPath();
    ctx.arc(x, y, explosionRadius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    explosionRadius += speed * 2;
    requestAnimationFrame(animateExplosion);
  }

  animateExplosion();
}


  // 攻撃エフェクトを描画する関数
  function drawAttack() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 残像の描画
    attack.trail.forEach((trail, index) => {
      const alpha = (index + 1) / attack.trail.length; // 残像の透明度
      const gradient = ctx.createRadialGradient(
        trail.x,
        trail.y,
        0,
        trail.x,
        trail.y,
        trail.radius
      );
      const startColor = color;
      const endColor = generateEndColor(color);

      gradient.addColorStop(0, `rgba(${hexToRgb(startColor)}, ${alpha})`);
      gradient.addColorStop(1, `rgba(${hexToRgb(endColor)}, 0)`);

      ctx.beginPath();
      ctx.arc(trail.x, trail.y, trail.radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    });

    // 攻撃の描画
    const attackX =
      attack.centerX - Math.cos(attack.angle) * attack.pathRadius;
    const attackY =
      attack.centerY - Math.sin(attack.angle) * attack.pathRadius;

    const attackGradient = ctx.createRadialGradient(
      attackX,
      attackY,
      0,
      attackX,
      attackY,
      attack.radius
    );
    attackGradient.addColorStop(0, `rgba(${hexToRgb(color)}, 1)`);
    attackGradient.addColorStop(1, `rgba(${hexToRgb(color)}, 0)`);

    ctx.beginPath();
    ctx.arc(attackX, attackY, attack.radius, 0, Math.PI * 2);
    ctx.fillStyle = attackGradient;
    ctx.fill();

    // 渦巻きの位置と半径を更新
    attack.angle += speed * 0.02;
    attack.radius += attack.radius * 0.02
    attack.pathRadius -= attack.pathRadiusDecay;

    // 攻撃が渦巻きの最大角度に達したら炸裂
    if (attack.angle >= attack.maxAngle || attack.pathRadius <= 0) {
      drawExplosion(attackX, attackY);
      return;
    }

    // 残像を更新
    attack.trail.push({
      x: attackX,
      y: attackY,
      radius: attack.radius,
    });
    if (attack.trail.length > attack.trailMaxLength) {
      attack.trail.shift();
    }

    requestAnimationFrame(drawAttack);
  }

  drawAttack();

}

// 刺突エフェクト (中央到達時に衝撃波が発生)
function applyPierceEffect(size, speed, color, direction) {
  const container = document.getElementById("effect-container");
  if (!container) {
    console.error("エフェクトコンテナが見つかりません (#effect-container)");
    return;
  }

  // メインキャンバス
  const canvas = document.createElement("canvas");
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // 衝撃波専用キャンバス
  const shockwaveCanvas = document.createElement("canvas");
  shockwaveCanvas.width = canvas.width;
  shockwaveCanvas.height = canvas.height;
  shockwaveCanvas.style.position = "absolute";
  shockwaveCanvas.style.top = "0";
  shockwaveCanvas.style.left = "0";
  container.appendChild(shockwaveCanvas);
  const shockwaveCtx = shockwaveCanvas.getContext("2d");

  speed = speed * 15.0;

  const thrust = {
    x: canvas.width / 2,
    y: canvas.height / 1.0,
    length: 0,
    maxLength: canvas.height / 155 * size,
    width: size / 2,
    alpha: 1.0,
    isExpanding: true,
  };

  // function drawShockwave(x, y) {
  //   let shockwaveRadius = 0;
  //   const maxShockwaveRadius = canvas.height / 2;

  //   function animateShockwave() {
  //     if (shockwaveRadius >= maxShockwaveRadius) {
  //       console.log("Shockwave ended");
  //       return;
  //     }

  //     const gradient = shockwaveCtx.createRadialGradient(x, y, shockwaveRadius / 4, x, y, shockwaveRadius);
  //     gradient.addColorStop(0, "rgba(255, 255, 255, 0.2)");
  //     gradient.addColorStop(1, "rgba(255, 255, 255, 1)");

  //     shockwaveCtx.clearRect(0, 0, shockwaveCanvas.width, shockwaveCanvas.height);
  //     shockwaveCtx.beginPath();
  //     shockwaveCtx.arc(x, y, shockwaveRadius, 0, Math.PI * 2);
  //     shockwaveCtx.fillStyle = gradient;
  //     shockwaveCtx.fill();

  //     shockwaveRadius += speed * 2;
  //     requestAnimationFrame(animateShockwave);
  //   }

  //   animateShockwave();
  // }

  function drawThrust() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(
      thrust.x,
      thrust.y - thrust.length,
      thrust.x,
      thrust.y
    );
    const startColor = color;
    const endColor = generateEndColor(color);
    
    gradient.addColorStop(0, `rgba(${hexToRgb(startColor)}, ${thrust.alpha})`); // thrust.alpha を使用
    gradient.addColorStop(1, `rgba(${hexToRgb(endColor)}, 0)`);
    
    // gradient.addColorStop(0, `rgba(${hexToRgb(color)}, ${thrust.alpha})`);
    // gradient.addColorStop(1, `rgba(${hexToRgb(color)}, 0)`);

    ctx.beginPath();
    ctx.moveTo(thrust.x - thrust.width / 2, thrust.y);
    ctx.lineTo(thrust.x + thrust.width / 2, thrust.y);
    ctx.lineTo(thrust.x, thrust.y - thrust.length);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    if (thrust.isExpanding) {
      thrust.length += speed;
      if (thrust.length >= thrust.maxLength) {
        thrust.isExpanding = false;
        
        // drawShockwave(thrust.x, thrust.y / 2); // 衝撃波を発生
      }
    } else {
      thrust.length -= speed;
      if (thrust.length <= 0) {
        canvas.remove();
        shockwaveCanvas.remove();
        return;
      }
    }

    requestAnimationFrame(drawThrust);
  }

  drawThrust();
}





























