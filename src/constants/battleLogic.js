// battleLogic.js
// 戦闘計算処理まとめ
// ===== 集計キー定義 =====

// 威力系
const POWER_KEYS = [
  "切断",  "貫通",  "打撃",  "威力",  "全力",  "ダメージ幅",
];

// 守り系
const DEFENSE_KEYS = [ "物理ガード",  "魔法ガード",];

// 属性ダメージ系
const ATTRIBUTE_KEYS = [
  "炎",  "氷",  "雷",  "酸",
  "音",  "光",  "闇",  "善",  "悪",
];

// 状態異常系
const STATUS_KEYS = [
  "精神攻撃",  "毒",  "盲目",  "幻覚",  "石化",  "怯み",
  "拘束",  "呪い",  "即死",  "時間",  "出血",  "疲労",  "体幹",
];

/**
 * 基本威力計算
 * @param {number} basePower - 技の基礎威力 (例: 威力+20 → 20)
 * @param {object} attacker - 攻撃側キャラデータ
 * @param {object} skill - 使用する技データ { 判定: "速度", 追加威力: "早業" }
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

const num = (v) => {
  if (v === null || v === undefined || v === "") return 0;
  return Number(String(v).replace(/^\+/, "")) || 0;
};

function buildBreakdown(skill, keys) {
  const breakdown = {};
  for (const key of keys) {
    breakdown[key] = num(skill[key]);
  }
  return breakdown;
}

function sumValues(obj) {
  return Object.values(obj).reduce((a, b) => a + b, 0);
}


/**
 * 技データをまとめてステータス補正込みで返す
 * @param {object} skill
 * @param {object} attacker
 * @returns {object}
 */
export function summarizeSkill(skill, attacker) {
  if (!skill) {
    return {
      威力: { 合計: 0, 内訳: {} },
      守り: { 合計: 0, 内訳: {} },
      属性: { 合計: 0, 内訳: {} },
      回復量: { 合計: 0 },
      状態: { 合計: 0, 内訳: {} },
      クリティカル: { 率: 0, 威力: 0 },
      連撃: { 回数: 0, 追加: 0 },
    };
  }

  // ===== 威力 =====
  const 威力内訳 = buildBreakdown(skill, POWER_KEYS);
  let 威力合計 = calcPower(sumValues(威力内訳), attacker, skill);

  // ===== 守り =====
  const 守り内訳 = buildBreakdown(skill, DEFENSE_KEYS);
  let 守り合計 = calcPower(
    Math.max(...Object.values(守り内訳)),
    attacker,
    skill
  );

  // ===== 属性 =====
  const 属性内訳 = buildBreakdown(skill, ATTRIBUTE_KEYS);
  let 属性合計 = calcPower(sumValues(属性内訳), attacker, skill);

  // ===== 回復量 =====
  const 回復量内訳 = buildBreakdown(skill, ["回復"]);
  let 回復合計 = calcPower(sumValues(回復量内訳), attacker, skill);

  // ===== 状態 =====
  const 状態内訳 = buildBreakdown(skill, STATUS_KEYS);
  let 状態合計 = calcPower(sumValues(状態内訳), attacker, skill);

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

  console.log("summarizeSkill:", {
    威力合計, 守り合計, 属性合計, 状態合計, 回復合計, クリティカル, 連撃, skill
  });
  return {
    威力: { 合計: 威力合計, 内訳: 威力内訳 },
    守り: { 合計: 守り合計, 内訳: 守り内訳 },
    属性: { 合計: 属性合計, 内訳: 属性内訳 },
    回復量: { 合計: 回復合計 },
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
 * 選択中の技を合算して総合数値を返す
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