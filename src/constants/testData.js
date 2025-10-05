// testData.js
// テスト用の初期キャラクターデータ

export const testCharacterData = {
  equipmentSlot: {
    武器: "木の剣",
    武器2: null,
    頭: null,
    体: "皮の胴衣",
    足: "皮の靴",
    装飾1: null,
    装飾2: null,
  },
  inventory: [
    // 武器候補
    { name: "木の短刀", quantity: 1 },
    { name: "木の短弓", quantity: 1 },

    // 防具候補
    { name: "皮の帽子", quantity: 1 },

    // 装飾候補
    { name: "魔獣皮の帯", quantity: 1 },
    { name: "紫の冠", quantity: 1 },

    // 消耗品
    { name: "下位水薬", quantity: 3 },
  ],
};
// src/testData.js
import { loadItemData, createEquipment, equipmentemplate } from "@/constants/itemFactory.js"; // 装備生成 & データロード
import { logEquipment } from "@/constants/statData.js";                     // ログ出力関数

/**
 * 装備テストを実行
 */
export async function runEquipmentTest() {
  // データロード
  await loadItemData();

  // === 武器系 ===
  const sword = createEquipment("短剣", "水晶鉄", ["闘気の一撃", "炎付与Ⅳ"]);
  const spear = createEquipment("剣槍", "黒鉄", ["炎付与Ⅴ", "対魔Ⅱ"]);

  // === 防具系 ===
  const armor = createEquipment("鎧", "鋼", ["耐炎Ⅴ", "炎付与Ⅰ"]); // ← 炎付与ⅠはNG
  const robe = createEquipment("法衣", "魔獣皮", ["精神耐性Ⅲ", "炎付与Ⅰ"]); // ← 炎付与ⅠはNG

  // === 装飾品系 ===
  const ring = createEquipment("指輪", "銀", ["毒耐性Ⅱ", "炎付与Ⅰ"]); // ← 炎付与ⅠはNG
  const crown = createEquipment("冠", "金", ["精神耐性Ⅰ", "闘気の一撃"]); // ← 闘気の一撃はNG

  // === ログ出力 ===
  console.log("===== 武器: 短剣(水晶鉄) =====");
  logEquipment(sword, equipmentemplate);

  console.log("===== 武器: 剣槍(黒鉄) =====");
  logEquipment(spear, equipmentemplate);

  console.log("===== 防具: 鎧(鋼) =====");
  logEquipment(armor, equipmentemplate);

  console.log("===== 防具: 法衣(魔獣皮) =====");
  logEquipment(robe, equipmentemplate);

  console.log("===== 装飾: 指輪(銀) =====");
  logEquipment(ring, equipmentemplate);

  console.log("===== 装飾: 冠(金) =====");
  logEquipment(crown, equipmentemplate);

}




