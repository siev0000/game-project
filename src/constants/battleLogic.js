// battleLogic.js
// 戦闘計算処理まとめ

/**
 * 基本威力計算
 * @param {number} basePower - スキルの基礎威力 (例: 威力+20 → 20)
 * @param {object} attacker - 攻撃側キャラデータ
 * @param {object} skill - 使用するスキルデータ { 判定: "速度", 追加威力: "早業" }
 */
export function calcPower(basePower, attacker, skill) {
  let power = basePower;

  // 判定ステータスによる補正
  if (skill?.判定 && attacker.stats.totalStats[skill.判定] !== undefined) {
    power *= 1 + attacker.stats.totalStats[skill.判定] / 100;
  }

  // 追加威力（例: 早業は500で+100%）
  if (skill?.追加威力 && attacker.stats.totalStats[skill.追加威力] !== undefined) {
    power *= 1 + attacker.stats.totalStats[skill.追加威力] / 500;
  }

  return Math.round(power);
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


/**
 * スキルデータをまとめてステータス補正込みで返す
 * @param {object} skill - Skill_List の1件
 * @param {object} attacker - 攻撃側キャラデータ
 * @returns {object}
 */
export function summarizeSkill(skill, attacker) {
  if (!skill) {
    return {
      威力: { 合計: 0, 内訳: {} },
      守り: { 合計: 0, 内訳: {} },
      属性: { 合計: 0, 内訳: {} },
      回復量: { 内訳: {} },
      状態: { 合計: 0, 内訳: {} },
      クリティカル: { 率: 0, 威力: 0 },
      連撃: { 回数: 0, 追加: 0 },
    };
  }

  const num = (v) => Number(v) || 0;

  // ===== 威力 =====
  const 威力内訳 = {
    切断: num(skill.切断),
    貫通: num(skill.貫通),
    打撃: num(skill.打撃),
    威力: num(skill.威力),
    全力: num(skill.全力),
    ダメージ幅: num(skill.ダメージ幅),
  };
  let 威力合計 = Object.values(威力内訳).reduce((a, b) => a + b, 0);
  威力合計 = calcPower(威力合計, attacker, skill);

  // ===== 守り =====
  const 守り内訳 = {
    物理ガード: num(skill.物理ガード),
    魔法ガード: num(skill.魔法ガード),
  };
  let 守り合計 = Math.max(...Object.values(守り内訳));
  守り合計 = calcPower(守り合計, attacker, skill);

  // ===== 属性 =====
  const 属性内訳 = {
    炎: num(skill.炎),
    氷: num(skill.氷),
    雷: num(skill.雷),
    酸: num(skill.酸),
    音: num(skill.音),
    光: num(skill.光),
    闇: num(skill.闇),
    善: num(skill.善),
    悪: num(skill.悪),
  };
  let 属性合計 = Object.values(属性内訳).reduce((a, b) => a + b, 0);
  属性合計 = calcPower(属性合計, attacker, skill);

  // ===== 回復量 =====
  const 回復量内訳 = { 回復量: num(skill.回復量) };
  回復量内訳.回復量 = calcPower(回復量内訳.回復量, attacker, skill);

  // ===== 状態 =====
  const 状態内訳 = {
    精神攻撃: num(skill.精神攻撃),
    毒: num(skill.毒),
    盲目: num(skill.盲目),
    幻覚: num(skill.幻覚),
    石化: num(skill.石化),
    怯み: num(skill.怯み),
    拘束: num(skill.拘束),
    呪い: num(skill.呪い),
    即死: num(skill.即死),
    時間: num(skill.時間),
    出血: num(skill.出血),
    疲労: num(skill.疲労),
    体幹: num(skill.体幹),
  };
  let 状態合計 = Object.values(状態内訳).reduce((a, b) => a + b, 0);
  状態合計 = calcPower(状態合計, attacker, skill);

  // ===== クリティカル =====
  const クリティカル = {
    率: num(skill.Cr率),
    威力: num(skill.Cr威力),
  };

  // ===== 連撃 =====
  const 連撃 = {
    回数: num(skill.攻撃回数),
    追加: num(skill.攻撃追加),
  };

  return {
    威力: { 合計: 威力合計, 内訳: 威力内訳 },
    守り: { 合計: 守り合計, 内訳: 守り内訳 },
    属性: { 合計: 属性合計, 内訳: 属性内訳 },
    回復量: { 内訳: 回復量内訳 },
    状態: { 合計: 状態合計, 内訳: 状態内訳 },
    クリティカル,
    連撃,
  };
}
/**
 * 効果概要から不要な部分を削除する
 * @param {string} overview - skill.効果概要
 * @returns {string}
 */
export function cleanEffectOverview(overview) {
  if (!overview) return "";

  return overview
    // 攻撃手段:〇〇 を削除
    .replace(/攻撃手段:[^\s]+/g, "")
    // 追加威力:〇〇 を削除
    .replace(/追加威力:[^\s]+/g, "")
    // 判定:〇〇 を削除
    .replace(/判定:[^\s]+/g, "")
    // 余分なスペースを整形
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * 選択中のスキルを合算して総合数値を返す
 * @param {object} selectedSkills - { A: skill|null, S: skill|null, Q: skill|null }
 * @returns {object} - { 威力, 攻撃回数, クリティカル }
 */
export function calcCombinedSkill(selectedSkills) {
  const result = {
    威力: 0,
    攻撃回数: 0,
    クリティカル: { 率: 0, 威力: 0 }
  };

  ["A", "S", "Q"].forEach((t) => {
    const skill = selectedSkills[t];
    if (!skill) return;

    result.威力 += skill?.威力?.合計 || 0;
    result.攻撃回数 += skill?.連撃?.回数 || 0;
    result.クリティカル.率 += skill?.クリティカル?.率 || 0;
    result.クリティカル.威力 += skill?.クリティカル?.威力 || 0;
  });

  console.log(result)
  return result;
}