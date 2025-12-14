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

// 取得条件をチェック（簡易版：本実装に合わせて後で拡張）
function checkMagicCondition(magic, char) {
  if (!magic.取得条件 || magic.取得条件 === "") return true;
  // ここにクラス判定・種族判定・属性Lv判定など追加予定
  return true;
}

/*
Lv 1: 0 pt  → 初期状態
Lv10: 3 pt  → Rank2 到達ライン　1 2
Lv20: 7 pt  → Rank3 到達ライン  2 2 3
Lv30: 14 pt → Rank4 到達ライン  2 3 3
Lv40: 23 pt → Rank5 到達ライン  4 5 5
Lv50: 36 pt → Rank6 到達ライン 
Lv60: 51 pt → Rank7 到達ライン 
*/
// 魔法ポイント → 解禁Rank
function getUnlockedRank(magicPoint) {
  if (magicPoint <= 2) return 1;
  if (magicPoint <= 6) return 2;
  if (magicPoint <= 13) return 3;
  if (magicPoint <= 22) return 4;
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


// 魔法ポイントに基づいて魔法取得情報を構築
export function autoAcquireMagic(
  character,
  attributeList,
  totalPoint
) {
  // 初期化
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

  // ★ 戻り値を受け取る
  const distributed = autoDistributeMagicPoint(character);
  const acquired = acquireMagicByPoint(character, attributeList, totalPoint);

  return {
    // distributed,
    // acquired,
    magicPoint: character.magicPoint
  };
}



export function autoAcquireMagic2(char, attributeList, magicPoint = 0) {

  const attributes = Array.isArray(char.attribute)
    ? char.attribute
    : (char.attribute ? [char.attribute] : []);

  const unlockedRank = getUnlockedRank(magicPoint);
  const perRankLimit = getRankLimit(attributes.length || 0);
  const baseRankLimit = Math.floor(perRankLimit);
  const bonusSlotsPerRank = Math.floor((perRankLimit - baseRankLimit) * (attributes.length || 0));
  const rankCounts = new Map();
  const rankBonusUsed = new Map();

  
  // 取得できる魔法総数（ポイントそのままでもいい）
  let remainingSlots = magicPoint;

  let acquiredMagic = [];

  for (const attr of attributes) {
    const attrData = attributeList.find(a => a?.属性名 === attr);
    if (!attrData || !Array.isArray(attrData.魔法リスト)) continue;

    // Rank順に並べて候補を取る
    const candidates = attrData.魔法リスト
      .filter(m => m.Rank <= unlockedRank)
      .sort((a, b) => a.Rank - b.Rank);

    // ポイント分だけ取得
    for (const magic of candidates) {
      if (remainingSlots <= 0) break;
      if (magic?.Rank == null) continue;

      const currentRankCount = rankCounts.get(magic.Rank) || 0;
      const bonusUsed = rankBonusUsed.get(magic.Rank) || 0;
      const canUseBase = currentRankCount < baseRankLimit;
      const canUseBonus = !canUseBase && bonusUsed < bonusSlotsPerRank && currentRankCount < baseRankLimit + 1;
      if (!canUseBase && !canUseBonus) continue;

      acquiredMagic.push(magic);
      if (canUseBonus) {
        rankBonusUsed.set(magic.Rank, bonusUsed + 1);
      }
      rankCounts.set(magic.Rank, currentRankCount + 1);
      remainingSlots--;
    }
  }

  // 重複排除
  const unique = [];
  const used = new Set();

  for (const m of acquiredMagic) {
    if (!m?.名前) continue;
    if (!used.has(m.名前)) {
      unique.push(m);
      used.add(m.名前);
    }
  }

  char.magicList = unique;
  return unique;
}
