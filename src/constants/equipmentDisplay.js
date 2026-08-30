// 手持ちタブとショップで共通する、装備能力値の表示ルール。
export const WEAPON_TYPES = ["武器", "弓", "杖", "盾", "銃", "素手"];
export const ARMOR_TYPES = ["頭", "腕", "足", "体", "服", "装飾"];
export const PHYSICAL_TYPES = ["切断", "貫通", "打撃"];
export const ELEMENTAL_KEYS = ["炎", "氷", "雷", "酸", "音", "光", "闇", "善", "悪", "正", "負"];
export const STATUS_KEYS = ["Lv", "HP", "MP", "ST", "攻撃", "防御", "魔力", "精神", "速度", "命中", "SIZ", "APP"];

export const getNumber = (value) => {
  const number = Number(value);
  return Number.isNaN(number) ? 0 : Math.round(number);
};

export const isWeapon = (item) => WEAPON_TYPES.includes(item?.種別);
export const isArmor = (item) => ARMOR_TYPES.includes(item?.種別);
export const isEquipment = (item) => isWeapon(item) || isArmor(item);

export const hasPhysicalDamage = (item) => PHYSICAL_TYPES.some((type) => getNumber(item?.[type]) > 0);
export const getMaxPhysical = (item) => Math.max(...PHYSICAL_TYPES.map((type) => getNumber(item?.[type])));
export const getPhysicalPower = (item) => PHYSICAL_TYPES.reduce((sum, type) => sum + getNumber(item?.[type]), 0);

export const getValidAttributes = (item) => ELEMENTAL_KEYS.filter((key) => getNumber(item?.[key]) > 0);
export const getMaxAttribute = (item) => {
  const values = getValidAttributes(item).map((key) => getNumber(item?.[key]));
  return values.length ? Math.max(...values) : 0;
};

export const getValidResists = (item) => Object.keys(item || {}).filter(
  (key) => key.includes("耐性") && getNumber(item[key]) > 0
);
export const getMaxResist = (item) => {
  const values = getValidResists(item).map((key) => getNumber(item[key]));
  return values.length ? Math.max(...values) : 0;
};

const SKILL_KEYS = ["隠密", "感知", "威圧", "軽業", "技術", "早業", "看破", "騙す", "知識", "鑑定", "装置", "変装", "制作", "精神接続", "魔法技術", "指揮"];
export const getValidSkills = (item) => SKILL_KEYS.filter((key) => getNumber(item?.[key]) > 0);
export const getMaxSkill = (item) => {
  const values = getValidSkills(item).map((key) => getNumber(item[key]));
  return values.length ? Math.max(...values) : 0;
};

export const getValidStats = (item) => STATUS_KEYS.filter((key) => getNumber(item?.[key]) > 0);
export const getMaxStat = (item) => {
  const values = getValidStats(item).map((key) => getNumber(item[key]));
  return values.length ? Math.max(...values) : 0;
};
