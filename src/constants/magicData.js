// ▼ スキルから魔法ポイントを計算する関数
export function getMagicPointFromSkills(skills) {
  if (!Array.isArray(skills)) return 0;

  let total = 0;

  for (const skill of skills) {
    if (!skill || !skill.名前) continue;

    // 「魔法取得◯」パターンに完全一致
    const match = skill.名前.match(/^魔法取得(\d+)$/);

    if (match) {
      const value = Number(match[1]);
      if (!isNaN(value)) {
        total += value;
      }
    }
  }

  return total;
}




const RANK_POINT_TABLE = [
  { rank: 1, min: 0,  max: 3 },
  { rank: 2, min: 4,  max: 8 },
  { rank: 3, min: 9,  max: 15 },
  { rank: 4, min: 16, max: 25 },
  { rank: 5, min: 25, max: 35 },
  { rank: 6, min: 36, max: 50 },
  { rank: 7, min: 51, max: Infinity }
];
// 魔法ポイント → 解禁Rank
function getUnlockedRank(magicPoint) {
  if (magicPoint <= 3) return 1;
  if (magicPoint <= 8) return 2;
  if (magicPoint <= 15) return 3;
  if (magicPoint <= 25) return 4;
  if (magicPoint <= 35) return 5;
  if (magicPoint <= 50) return 6; // 仮の値
  return 7; // Rank7 を解禁
}


// 属性数→ Rankごとの取得上限
function getRankLimit(attributeCount) {
  if (attributeCount === 1) return 3;
  if (attributeCount === 2) return 2.5;
  if (attributeCount === 3) return 2;
  if (attributeCount === 4) return 1.5;
  return 1; // 4つ以上
}
/**
 * attrIndex : 属性順（0 = 1つ目）
 * rank      : 対象魔法Rank（1..unlocked）
 * unlocked  : 魔法最大Rank
 */
function getAcquireLimit(attrIndex, rank, unlocked) {
  const d = unlocked - rank;
  return Math.max(3 - Math.max(attrIndex, d), 0);
}

// 魔法配列初期化
export function initMagicPointWithAttributes(character, totalPoint = 0) {
  const attrs = Array.isArray(character.attribute)
    ? character.attribute
    : (character.attribute ? [character.attribute] : []);

  const Attributes = {};

  for (const attr of attrs) {
    Attributes[attr] = {
      point: 0,
      magics: []
    };
  }

  character.magicPoint = {
    total: totalPoint,
    Attributes
  };

  return character.magicPoint;
}

// 魔法ポイントを属性ごとに自動配分
export function autoDistributeMagicPoint(character) {
  const mp = character.magicPoint;
  if (!mp || !mp.Attributes) return null;

  const attrs = Object.keys(mp.Attributes);
  if (attrs.length === 0) return mp.Attributes;

  // 初期化
  for (const attr of attrs) {
    mp.Attributes[attr].point = 0;
  }

  let remaining = mp.total;
  let index = 0;

  while (remaining > 0) {
    const attr = attrs[index % attrs.length];
    mp.Attributes[attr].point++;
    remaining--;
    index++;
  }

  // ★ 変更後を返す
  return mp.Attributes;
}

// ○○の接続があるときはその属性の取得数を+1 
// 魔法取得内容を自動作成 と 取得機能は別で作る
export function acquireMagicByPoint(character, attributeList, usedPoint) {
  const mp = character.magicPoint;
  if (!mp || !mp.Attributes) return null;

  const unlockedRank = getUnlockedRank(usedPoint);
  const usedMagicNames = new Set();

  for (const [attr, info] of Object.entries(mp.Attributes)) {
    info.magics = [];

    const attrData = attributeList.find(a => a?.属性名 === attr);
    if (!attrData || !Array.isArray(attrData.魔法リスト)) continue;

    const candidates = attrData.魔法リスト
      .filter(m => m.Rank <= unlockedRank)
      .sort((a, b) => a.Rank - b.Rank);

    for (const magic of candidates) {
      if (info.magics.length >= info.point) break;
      if (!magic?.名前) continue;
      if (usedMagicNames.has(magic.名前)) continue;

      info.magics.push(magic);
      usedMagicNames.add(magic.名前);
    }
  }

  // ★ 変更後を返す
  return mp.Attributes;
}

function getRankState(point) {
  for (let i = 0; i < RANK_POINT_TABLE.length; i++) {
    const { rank, min, max } = RANK_POINT_TABLE[i];
    if (point >= min && point <= max) {
      const range = max - min;
      const progress = range > 0 ? (point - min) / range : 1;
      return { baseRank: rank, progress };
    }
  }
  return { baseRank: 1, progress: 0 };
}


export function autoAcquireMagic(
  character,
  attributeList,
  totalPoint
) {
  const attrs = Array.isArray(character.attribute)
    ? character.attribute
    : (character.attribute ? [character.attribute] : []);

  const { baseRank, progress } = getRankState(totalPoint);

  const Attributes = {};
  for (const attr of attrs) {
    Attributes[attr] = { magics: [] };
  }

  character.magicPoint = {
    total: totalPoint,
    Attributes
  };

  attrs.forEach((attr, attrIndex) => {
    const attrData = attributeList.find(a => a?.属性名 === attr);
    if (!attrData || !Array.isArray(attrData.魔法リスト)) return;

    // baseRank + 1 まで見る（途中解禁のため）
    for (let rank = 1; rank <= baseRank + 1; rank++) {
      let limit = getAcquireLimit(attrIndex, rank, baseRank);

      // progress を反映
      limit = applyProgressBonus(limit, rank, baseRank, progress);
      if (limit <= 0) continue;

      const candidates = attrData.魔法リスト
        .filter(m => m.Rank === rank);

      character.magicPoint.Attributes[attr].magics
        .push(...candidates.slice(0, limit));
    }
  });

  return { magicPoint: character.magicPoint };
}