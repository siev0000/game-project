// =====================================
// battleLogic.js
// 戦闘処理専用ロジック（UI非依存）
// =====================================

/*
設計方針
- UI（BattleView.vue）から完全分離
- データ構造は battleAllies / battleEnemies を直接操作
- ランダム要素は使用しない（決定的処理）
*/

// -------------------------------
// ダメージ適用
// -------------------------------
export function applyDamage(unit, value) {
  if (!unit || value <= 0) return

  const prevHp = unit.hp
  unit.hp = Math.max(0, unit.hp - value)

  return {
    type: 'damage',
    value,
    prevHp,
    currentHp: unit.hp
  }
}

// -------------------------------
// 回復適用
// -------------------------------
export function applyHeal(unit, value) {
  if (!unit || value <= 0) return

  const prevHp = unit.hp
  unit.hp = Math.min(unit.hpMax, unit.hp + value)

  return {
    type: 'heal',
    value,
    prevHp,
    currentHp: unit.hp
  }
}

// -------------------------------
// MP / ENERGY 消費
// -------------------------------
export function consumeEnergy(unit, cost) {
  if (!unit || cost <= 0) return false

  if (unit.energy < cost) {
    return false
  }

  unit.energy -= cost

  // ENERGY 枯渇 → 疲労
  if (unit.energy <= 0) {
    unit.energy = 0
    unit.fatigue = true
  }

  return true
}

// -------------------------------
// 疲労解除（回復など用）
// -------------------------------
export function clearFatigue(unit) {
  if (!unit) return
  unit.fatigue = false
}

// -------------------------------
// 命中判定（決定式）
// -------------------------------
export function checkHit(attacker, defender) {
  /*
    命中成功条件
    attacker.accuracy > defender.agility
  */
  return attacker.accuracy > defender.agility
}

// -------------------------------
// 基本攻撃処理
// -------------------------------
export function executeAttack(attacker, defender) {
  if (!attacker || !defender) return null

  const hit = checkHit(attacker, defender)

  if (!hit) {
    return {
      type: 'miss',
      attacker: attacker.id,
      defender: defender.id
    }
  }

  // ダメージ計算（決定式）
  const rawDamage = Math.max(0, attacker.power - defender.defense)

  const result = applyDamage(defender, rawDamage)

  return {
    type: 'attack',
    attacker: attacker.id,
    defender: defender.id,
    damage: rawDamage,
    result
  }
}

// -------------------------------
// 戦闘不能判定
// -------------------------------
export function isDefeated(unit) {
  return unit.hp <= 0
}
