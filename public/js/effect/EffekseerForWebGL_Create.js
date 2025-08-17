let effekseerContext;
let effect;

// Effekseer の初期化
function initEffekseer() {
  console.log("Effekseer を初期化...");

  // Effekseer のロード確認
  if (typeof effekseer === "undefined") {
    console.error("Effekseer がロードされていません。スクリプトの読み込みを確認してください。");
    return;
  }

  console.log("Effekseer のロード確認:", effekseer);

  // Canvas 要素の取得
  const canvas = document.getElementById("canvas");
  if (!canvas) {
    console.error("Canvas 要素が見つかりません。");
    return;
  }

  // WebGL2 のコンテキストを試す
  let gl = canvas.getContext("webgl2", { alpha: true });
  if (!gl) {
    console.warn("WebGL2 の初期化に失敗。WebGL 1 にフォールバックします。");
    gl = canvas.getContext("webgl", { alpha: true });
  }

  if (!gl) {
    console.error("WebGL の初期化に失敗しました。");
    return;
  }

  console.log("WebGL の初期化成功:", gl);

  // EffekseerContext の作成
  try {
    console.log("EffekseerContext の作成を試みます...");

    // `EffekseerForWebGL170e` では `initContext()` を使用する
    window.effekseerContext = effekseer.initContext(gl);

    console.log("EffekseerContext の取得結果:", window.effekseerContext);

    if (!window.effekseerContext) {
      throw new Error("EffekseerContext の作成に失敗しました。");
    }

    // Effekseer の初期化
    effekseerContext.init(gl);
    console.log("Effekseer が正常に初期化されました。");

    // カメラとプロジェクションの設定
    effekseerContext.setProjectionMatrix(
      effekseer.matrix4.perspective(30.0, canvas.width / canvas.height, 1.0, 100.0)
    );
    effekseerContext.setCameraMatrix(
      effekseer.matrix4.lookAt([0, 5, 10], [0, 0, 0], [0, 1, 0])
    );

    console.log("エフェクトロードを開始...");

    // エフェクトのロード
    effekseerContext.loadEffect("assets/effect.efk", 1.0, function (e) {
      window.effect = e;
      console.log("エフェクトが読み込まれました。");
    });

    // 描画ループ開始
    requestAnimationFrame(render);

  } catch (error) {
    console.error(error.message);
  }
}

// Effekseer の描画ループ
function render() {
  requestAnimationFrame(render);
  if (effekseerContext) {
    effekseerContext.update(1.0 / 60.0);
    effekseerContext.draw();
  }
}

// Effekseer のロード完了後に初期化
document.addEventListener("DOMContentLoaded", function () {
  console.log("Effekseer を初期化...");
  initEffekseer();
});



// 斬撃エフェクト
function applySlashEffect(size, speed, color) {
  if (!effekseerContext || !effect) {
    console.error("Effekseer が初期化されていません。");
    return;
  }

  console.log(`斬撃エフェクトを再生: サイズ ${size}, 速度 ${speed}, 色 ${color}`);

  let effectHandle = effekseerContext.play(effect, 0, 0, 0);
  effectHandle.setScale(size, size, size);
  effectHandle.setSpeed(speed);
  effectHandle.setAllColor(color);
}

// 刺突エフェクト
function applyPierceEffect(size, speed, color) {
  if (!effekseerContext || !effect) {
    console.error("Effekseer が初期化されていません。");
    return;
  }

  console.log(`刺突エフェクトを再生: サイズ ${size}, 速度 ${speed}, 色 ${color}`);

  let effectHandle = effekseerContext.play(effect, 0, 0, 0);
  effectHandle.setScale(size, size, size);
  effectHandle.setSpeed(speed);
  effectHandle.setAllColor(color);
}

// 爆発エフェクト
function applyExplosionEffect(size, speed, color) {
  if (!effekseerContext || !effect) {
    console.error("Effekseer が初期化されていません。");
    return;
  }

  console.log(`爆発エフェクトを再生: サイズ ${size}, 速度 ${speed}, 色 ${color}`);

  let effectHandle = effekseerContext.play(effect, 0, 0, 0);
  effectHandle.setScale(size, size, size);
  effectHandle.setSpeed(speed);
  effectHandle.setAllColor(color);
}
