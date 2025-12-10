// 魔法ポイント → 解禁Rank
function getUnlockedRank(magicPoint) {
  if (magicPoint <= 2) return 1;
  if (magicPoint <= 6) return 2;
  if (magicPoint <= 13) return 3;
  if (magicPoint <= 22) return 4;
  if (magicPoint <= 35) return 5;
  return 6; // 拡張
}

// 属性数→ Rankごとの取得上限
function getRankLimit(attributeCount) {
  if (attributeCount === 1) return 3;
  if (attributeCount === 2) return 2;
  if (attributeCount === 3) return 2;
  return 1; // 4つ以上
}

// 取得条件をチェック（簡易版：本実装に合わせて後で拡張）
function checkMagicCondition(magic, char) {
  if (!magic.取得条件 || magic.取得条件 === "") return true;
  // ここにクラス判定・種族判定・属性Lv判定など追加予定
  return true;
}

export function autoAcquireMagic(char, attributeList, magicPoint = 0) {

  const attributes = Array.isArray(char.attribute)
    ? char.attribute
    : (char.attribute ? [char.attribute] : []);

  const unlockedRank = getUnlockedRank(magicPoint);
  
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

      acquiredMagic.push(magic);
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
