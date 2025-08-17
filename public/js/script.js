let playerHP = 100;
let enemyHP = 50;
let playerTurn = true;

function chooseOption(option) {
  const exploreScreen = document.getElementById('exploreScreen');
  const battleScreen = document.getElementById('battleScreen');
  
  if (option === '戦闘') {
    exploreScreen.style.display = 'none';
    battleScreen.style.display = 'block';
  } else {
    alert(`${option} を選択しました。イベントは後日実装！`);
  }
}

function playerAction(action) {
  const battleLog = document.getElementById('battleLog');
  const playerHPElement = document.getElementById('playerHP');
  const enemyHPElement = document.getElementById('enemyHP');

  if (action === '攻撃') {
    const damage = Math.floor(Math.random() * 20) + 5; // 5~25ダメージ
    enemyHP -= damage;
    battleLog.textContent = `あなたは攻撃し、敵に ${damage} のダメージを与えました！`;
  } else if (action === '防御') {
    battleLog.textContent = 'あなたは防御して敵の攻撃を軽減します。';
  } else if (action === '逃走') {
    alert('あなたは戦闘から逃げました。探索画面に戻ります。');
    endBattle();
    return;
  }

  enemyHPElement.textContent = Math.max(enemyHP, 0);

  if (enemyHP <= 0) {
    battleLog.textContent = '敵を倒しました！探索画面に戻ります。';
    setTimeout(endBattle, 2000);
  } else {
    playerTurn = false;
    setTimeout(enemyAction, 1000);
  }
}

function enemyAction() {
  const battleLog = document.getElementById('battleLog');
  const playerHPElement = document.getElementById('playerHP');

  if (!playerTurn) {
    const damage = Math.floor(Math.random() * 15) + 5; // 5~20ダメージ
    playerHP -= damage;
    battleLog.textContent = `敵が攻撃し、あなたに ${damage} のダメージ！`;
    playerHPElement.textContent = Math.max(playerHP, 0);

    if (playerHP <= 0) {
      battleLog.textContent = 'あなたは敗北しました…。探索画面に戻ります。';
      setTimeout(endBattle, 2000);
    } else {
      playerTurn = true;
    }
  }
}

function endBattle() {
  playerHP = 100;
  enemyHP = 50;

  document.getElementById('playerHP').textContent = playerHP;
  document.getElementById('enemyHP').textContent = enemyHP;

  document.getElementById('battleScreen').style.display = 'none';
  document.getElementById('exploreScreen').style.display = 'block';
}
