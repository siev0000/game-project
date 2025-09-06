// battleLogic.js
// 戦闘計算処理まとめ

/**
 * 基本威力計算
 * @param {number} basePower - スキルの基礎威力 (例: 威力+20 → 20)
 * @param {object} attacker - 攻撃側キャラデータ
 * @param {object} defender - 防御側キャラデータ
 * @param {object} skill - 使用するスキルデータ { 判定: "速度", 追加威力: "早業" }
 */
export function calcPower(basePower, attacker, defender, skill) {
  let power = basePower;

  // 判定ステータスによる補正
  if (skill?.判定 && attacker.stats[skill.判定] !== undefined) {
    power *= 1 + attacker.stats[skill.判定] / 100;
  }

  // 追加威力（例: 早業は500で+100%）
  if (skill?.追加威力 && attacker.stats[skill.追加威力] !== undefined) {
    power *= 1 + attacker.stats[skill.追加威力] / 500;
  }

  return power;
}

/**
 * 命中判定
 * 命中率 = 攻撃側の命中 - 防御側の速度
 */
export function checkHit(attacker, defender) {
  const hitValue = (attacker.stats?.命中 || 0) - (defender.stats?.速度 || 0);
  const chance = Math.max(5, hitValue); // 最低5%は当たる
  return Math.random() * 100 < chance;
}

/**
 * ダメージ計算
 * - 威力と攻撃力/防御力を参照
 * - 最低ダメージ補正あり
 */
export function calcDamage(power, attacker, defender) {
  const atk = attacker.stats?.攻撃 || 0;
  const def = defender.stats?.防御 || 0;

  // ダメージ基礎
  let damage = power + atk - def;
  damage = Math.max(1, damage);

  // ダメージ揺らぎ (100%〜50%)
  const minDamage = damage * 0.5;
  const finalDamage = Math.floor(Math.random() * (damage - minDamage) + minDamage);

  return finalDamage;
}

/**
 * クリティカル判定
 */
export function checkCritical(attacker) {
  const rate = attacker.stats?.Cr率 || 0;
  return Math.random() * 100 < rate;
}

/**
 * クリティカルダメージ補正
 */
export function applyCritical(damage, attacker) {
  const bonus = attacker.stats?.Cr威力 || 0;
  return Math.floor(damage * (1.5 + bonus / 100)); // 1.5倍 + 補正
}
