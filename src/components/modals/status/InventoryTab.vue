<template>
  <div class="tab-panel inventory-tab">
    <p class="tab-sub">所持上限: {{ player?.maxInventory || 15 }}</p>

    <div class="inventory-container">
      <!-- 左：アイテム一覧 -->
      <ul class="inventory-list">
        <li v-if="displayInventory.length === 0" class="empty">
          下位水薬
        </li>

        <li
          v-for="(item, idx) in displayInventory"
          :key="idx"
          :class="['inventory-item', { selected: selectedItem?.名前 === item.名前 }]"
          @click="selectItem(item)"
        >
          <span class="item-name">{{ item.名前 }}</span>
          <span v-if="!isEquipment(item)" class="item-qty">×{{ item.数量 }}</span>
        </li>
      </ul>

      <!-- 右：選択アイテム説明 -->
      <div class="inventory-detail">
        <!-- 名前 + ルビ -->
         <div class="item-header">
          <h3 class="detail-title">
            <ruby>
              {{ selectedItem?.名前 || '---' }}
              <rt v-if="selectedItem?.ルビ">{{ selectedItem.ルビ }}</rt>
            </ruby>
            <span v-if="selectedItem?.装備Lv" class="label">Lv{{ selectedItem.装備Lv }}</span>
          </h3>
        </div>

        <template v-if="selectedItem">
          <!-- 右：選択アイテム説明 -->
            <div class="item-header">
              <!-- 装備種と素材 -->
              <p class="item-subinfo">
                <span v-if="selectedItem.分類">{{ selectedItem.分類 }}</span>
                <span v-if="selectedItem.分類 && selectedItem.素材"> / </span>
                <span v-if="selectedItem.素材">{{ selectedItem.素材 }}</span>
                
              </p>
            </div>
          <!-- 武器 -->
          <template v-if="isWeapon(selectedItem)">
            <div class="weapon-card">
              <!-- 全力 -->
              <div class="info-block">
                <div class="weapon-line">
                  <span class="label">全力:</span>
                  <span class="value strong">{{ getNumber(selectedItem.全力) }}</span>
                </div>
              </div>
              <!-- 威力 -->
              <div class="info-block">
                <div class="weapon-line">
                  <span class="label">威力:</span>
                  <span class="value strong">
                    {{
                      Math.round(
                        physicalTypes.reduce((sum, t) => sum + getNumber(selectedItem[t]), 0)
                      )
                    }}
                  </span>
                  <!-- <span class="label">ガード:</span>
                  <span class="value strong">{{ getNumber(selectedItem.ガード) }}</span> -->
                </div>

                <!-- 威力内訳 -->
                <div class="weapon-subline" v-if="hasPhysicalDamage(selectedItem)">
                  <span class="sub-label">└</span>

                  <template v-for="type in physicalTypes" :key="type">
                    <span
                      v-if="getNumber(selectedItem[type]) > 0"
                      class="sub-value"
                      :class="{ highlight: getNumber(selectedItem[type]) === getMaxPhysical(selectedItem) }"
                    >
                      {{ type }} {{ getNumber(selectedItem[type]) }}
                    </span>
                  </template>
                </div>
              </div>

              <!-- 属性合計 -->
              <div class="weapon-line" v-if="getValidAttributes(selectedItem).length > 0">
                <div class="info-block">
                  <span class="label">属性:</span>
                  <span class="value strong">
                    {{getValidAttributes(selectedItem).map(attr => getNumber(selectedItem[attr])).reduce((a, b) => a + b, 0).toFixed(0)}}
                  </span>
                  <!-- 属性内訳 -->
                  <div class="weapon-subline-grid" v-if="getValidAttributes(selectedItem).length > 0">
                    <span class="sub-label">└ </span>
                    <div class="attr-wrap">
                      <template v-for="attr in getValidAttributes(selectedItem)" :key="attr">
                        <span
                          class="sub-value"
                          :class="{ highlight: getNumber(selectedItem[attr]) === getMaxAttribute(selectedItem) }"
                        >
                          {{ attr }} {{ getNumber(selectedItem[attr]) }}
                        </span>
                      </template>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- ガード -->
              <div class="info-block">
                <div class="weapon-line">
                  <span class="label">ガード:</span>
                  <span class="value strong">{{ getNumber(selectedItem.ガード) }}</span>
                </div>

                <!-- 内訳 -->
                <!-- <div class="weapon-subline" v-if="hasPhysicalDamage(selectedItem)">
                  <span class="sub-label">└</span>
                    <span class="sub-value">
                      <span class="label">物理:</span>
                      <span class="value strong">{{ getNumber(selectedItem.物理ガード) }}</span>
                    </span>
                </div> -->
              </div>


          <div class="info-block">
            <div class="critical-line">
              <span class="label">Cr率:</span>
              <span class="value strong">{{ getNumber(selectedItem.Cr率) }}%</span>
            </div>
            <div class="critical-line">
              <span class="label">Cr威力:</span>
              <span class="value strong">{{ getNumber(selectedItem.Cr威力) }}%</span>
            </div>
          </div>

          <!-- 付与 -->
          <div class="info-block">
            <div v-if="Array.isArray(selectedItem.付与) && selectedItem.付与.length" class="info-grid">
              <span class="info-label">付与:</span>
              <div class="info-list">
                <template v-for="(t, i) in selectedItem.付与" :key="i">
                  <span class="info-item">{{ t.名前 || t }}</span>
                </template>
              </div>
            </div>
          </div>

          <!-- 特性 -->
          <div class="info-block">
            <div v-if="Array.isArray(selectedItem.装備特性) && selectedItem.装備特性.length" class="info-grid">
              <span class="info-label">特性:</span>
              <div class="info-list">
                <template v-for="(t, i) in selectedItem.装備特性" :key="i">
                  <span class="info-item">{{ t.名前 || t }}</span>
                </template>
              </div>
            </div>
          </div>
              <div class="info-block">
                <p class="detail-desc">{{ selectedItem.武器の説明 || selectedItem.説明 || "説明はありません。" }}</p>
              </div>
            </div>
          </template>

<!-- 防具 -->
<template v-else-if="isArmor(selectedItem)">
  <div class="armor-card">
    <!-- 防御性能 -->
    <div class="info-block">
      <div class="weapon-line" v-if="getNumber(selectedItem.物理軽減)">
        <span class="label">物理:</span>
        <span class="value">{{ getNumber(selectedItem.物理軽減) }}</span>
      </div>
      <div class="weapon-line" v-if="getNumber(selectedItem.魔法軽減)">
        <span class="label">魔法:</span>
        <span class="value">{{ getNumber(selectedItem.魔法軽減) }}</span>
      </div>
    </div>

    <!-- 耐性 -->
    <div class="info-block" v-if="getValidResists(selectedItem).length">
      <div class="weapon-line">
        <span class="label">耐性:</span>
        <span class="value strong">
          {{
            getValidResists(selectedItem)
              .map(r => getNumber(selectedItem[r]))
              .reduce((a, b) => a + b, 0)
          }}
        </span>
      </div>

      <!-- 内訳 -->
      <div class="weapon-subline-grid">
        <span class="sub-label">└</span>
        <div class="attr-wrap">
          <template v-for="r in getValidResists(selectedItem)" :key="r">
            <span
              class="sub-value"
              :class="{ highlight: getNumber(selectedItem[r]) === getMaxResist(selectedItem) }"
            >
              {{ r }} {{ getNumber(selectedItem[r]) }}
            </span>
          </template>
        </div>
      </div>
    </div>

          <!-- 付与 -->
          <div class="info-block">
            <div v-if="Array.isArray(selectedItem.付与) && selectedItem.付与.length" class="info-grid">
              <span class="info-label">付与:</span>
              <div class="info-list">
                <template v-for="(t, i) in selectedItem.付与" :key="i">
                  <span class="info-item">{{ t.名前 || t }}</span>
                </template>
              </div>
            </div>
          </div>

          <!-- 特性 -->
          <div class="info-block">
            <div v-if="Array.isArray(selectedItem.装備特性) && selectedItem.装備特性.length" class="info-grid">
              <span class="info-label">特性:</span>
              <div class="info-list">
                <template v-for="(t, i) in selectedItem.装備特性" :key="i">
                  <span class="info-item">{{ t.名前 || t }}</span>
                </template>
              </div>
            </div>
          </div>
              <div class="info-block">
                <p class="detail-desc">{{ selectedItem.武器の説明 || selectedItem.説明 || "説明はありません。" }}</p>
              </div>
            </div>
          </template>


          <!-- 道具・素材 -->
          <template v-else>
            <h3 class="detail-title">{{ selectedItem.名前 }}</h3>
            <p class="detail-type">種別: {{ selectedItem.種別 || "アイテム" }}</p>
            <p>数量: {{ selectedItem.数量 || 1 }}</p>
            <p class="detail-desc">
              {{ selectedItem.説明 || "説明はありません。" }}
            </p>
          </template>
        </template>

        <template v-else>
          <p class="detail-empty">アイテムを選択すると説明が表示されます。</p>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { logEquipment } from "@/constants/statData";
import { ref, onMounted, onBeforeUnmount } from "vue";
import { loadItemData, rebuildInventory } from "@/constants/itemFactory.js";
import "../modals_css/inventoryTab.css";

// ===== 種別判定配列 =====
const WEAPON_TYPES = ["武器", "弓", "杖", "盾", "銃", "素手"];
const ARMOR_TYPES  = ["頭", "腕", "足", "体", "服"];
const ITEM_TYPES   = ["素材", "道具", "休憩"];

const props = defineProps({
  character: { type: Object, required: true },
  player: { type: Object, required: true }
});

// 簡易デフォルトデータ　"剣槍", "黒鉄", ["炎付与Ⅴ", "対魔Ⅱ"]
const dbEquipments = [
  { id: "eq_0001", 名前: "木の剣", ルビ:"ウッドソード", 分類: "剣", 素材: "黒鉄", 付与: ["炎付与Ⅴ"], 装備中: "武器" },
  { id: "eq_0003", 名前: "虹の短剣", ルビ:"レインボーナイフ", 分類: "短剣", 素材: "虹宝鋼", 付与: ["炎付与Ⅱ","闘気の一撃","氷付与Ⅱ"], 装備中: "武器" },
  { id: "eq_0002", 名前: "皮の鎧", ルビ:"レザーアーマー", 分類: "鎧", 素材: "皮", 付与: [], 装備中: "体" },
  { id: "eq_0004", 名前: "鉄の鎧", ルビ:"レザーアーマー", 分類: "鎧", 素材: "鉄", 付与: [], 装備中: "体" },
  { id: "eq_0005", 名前: "虹の鎧", ルビ:"レザーアーマー", 分類: "鎧", 素材: "虹宝鋼", 付与: [], 装備中: "体" },
  { id: "eq_0006", 名前: "金鋼の鎧", ルビ:"レザーアーマー", 分類: "鎧", 素材: "金鋼", 付与: [], 装備中: "体" },
  { id: "eq_0006", 名前: "黒鋼の鎧", ルビ:"レザーアーマー", 分類: "鎧", 素材: "黒鋼", 付与: [], 装備中: "体" },
  { id: "eq_0005", 名前: "虹の兜", ルビ:"レザーアーマー", 分類: "兜", 素材: "虹宝鋼", 付与: ["威圧Ⅲ"], 装備中: "体" },
  { id: "eq_0005", 名前: "虹の冠", ルビ:"レザーアーマー", 分類: "冠", 素材: "虹宝鋼", 付与: ["看破Ⅲ"], 装備中: "頭" },
  { 名前: "下位水薬", 種別: "道具", 数量: 3 },
  { 名前: "鉄", 種別: "素材", 数量: 5 }
];
const getNumber = (val) => {
  const num = Number(val);
  if (isNaN(num)) return 0;
  return Math.round(num); // ← 小数点第1位で四捨五入
};

const getValidAttributes = (item) => {
  return ELEMENTAL_KEYS.filter((key) => getNumber(item[key]) > 0);
};
// 物理内訳の最大値を取得
const getMaxPhysical = (item) =>
  Math.max(...physicalTypes.map((t) => getNumber(item[t])));

// 物理タイプの定義
const physicalTypes = ["切断", "貫通", "打撃"];

// 合計判定・存在チェック・最大値算出
const hasPhysicalDamage = (item) =>
  physicalTypes.some((t) => getNumber(item[t]) > 0);

// 属性内訳の最大値を取得
const getMaxAttribute = (item) => {
  const vals = getValidAttributes(item).map(attr => getNumber(item[attr]));
  return vals.length > 0 ? Math.max(...vals) : 0;
};
// 属性カテゴリをまとめて定義（ステータス画面仕様.md に準拠）
const ELEMENTAL_KEYS = [
  "炎", "氷", "雷", "酸", "音",
  "光", "闇", "善", "悪", "正", "負"
];


// 防具===================
// 耐性カテゴリ定義（物理・属性）
const RESIST_KEYS = [
  "切断耐性", "貫通耐性", "打撃耐性",
  "炎耐性", "氷耐性", "雷耐性", "酸耐性",
  "音耐性", "光耐性", "闇耐性",
  "善耐性", "悪耐性", "正耐性", "負耐性"
];

// 有効な耐性を自動抽出
const getValidResists = (item) => {
  if (!item || typeof item !== "object") return [];

  return Object.keys(item).filter((key) => {
    return (
      key.includes("耐性") && // 「耐性」を含む
      getNumber(item[key]) > 0 // 数値が正
    );
  });
};

// 最大耐性値を取得
const getMaxResist = (item) => {
  const vals = getValidResists(item).map(r => getNumber(item[r]));
  return vals.length > 0 ? Math.max(...vals) : 0;
};








// アイテム選択時========================
const displayInventory = ref([]);
const selectedItem = ref(null);
const selectItem = (item) => (selectedItem.value = item);

let isMounted = true;
onBeforeUnmount(() => (isMounted = false));

onMounted(async () => {
  try {
    await loadItemData();
    const baseInv =
      props.character?.inventory?.length > 0 ? props.character.inventory : dbEquipments;
    const rebuilt = await rebuildInventory(baseInv);
    if (!isMounted) return;

    // Promise.allで全装備の非同期処理を待つ
    const filteredList = await Promise.all(
      rebuilt.map(async (item) => {
        const filtered = await logEquipment(item); // ← await使用OK
        console.log(filtered);
        return filtered;
      })
    );

    displayInventory.value = filteredList;

  } catch (err) {
    console.error("インベントリ再構築エラー:", err);
  }
});


// 判定関数
const isWeapon = (item) => WEAPON_TYPES.includes(item.種別);
const isArmor = (item) => ARMOR_TYPES.includes(item.種別);
const isEquipment = (item) => isWeapon(item) || isArmor(item);
</script>
<style scoped>
.inventory-tab {
  background: rgba(255, 255, 240, 0.9);
  border: 2px solid #8b5a2b;
  border-radius: 8px;
  padding: 10px;
  color: #3b2f1c;
  height: 930px;
}

.inventory-container {
  display: flex;
  gap: 10px;
  height: 830px;
}

.inventory-list {
  width: 50%;
  list-style: none;
  padding: 0;
  margin: 0;
  background: radial-gradient(circle at center, #5e5b54 0%, #423d2f 100%);
  color: #ffeecc;
  border: 2px solid #8b5a2b;
  border-radius: 6px;
  overflow-y: auto;
}

.inventory-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: background 0.2s;
}
.inventory-item:hover {
  background: rgba(255, 215, 0, 0.15);
}
.inventory-item.selected {
  background: rgba(255, 215, 0, 0.3);
  font-weight: bold;
}

.item-name {
  font-weight: bold;
}
.item-qty {
  color: #d6b56c;
}
.empty {
  color: #777;
  font-style: italic;
  padding: 8px;
}

.inventory-detail {
  width: 50%;
  background: rgba(37, 37, 37, 0.9);
  color: #ffeecc;
  border: 2px solid #8b5a2b;
  border-radius: 6px;
  padding: 8px;
  overflow-y: auto;
  font-size: 25px;
}

.detail-title {
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 4px;
}

.detail-type {
  font-size: 14px;
  opacity: 0.8;
}

.detail-desc {
  margin-top: 1px;
  margin-bottom: 0px;
  line-height: 1.5;
  white-space: pre-line;
}

.detail-empty {
  color: #ccc;
  font-style: italic;
  text-align: center;
  margin-top: 45%;
}

.weapon-line {
  /* display: flex; */
  gap: 0px;
  margin: 0px 0;
  line-height: 1.6;
}

.weapon-subline {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 0 2px 20px; /* ← インデントで階層を表現 */
  font-size: 22px;
  opacity: 0.9;
}

.label {
  color: #f2d37f;
  font-weight: 600;
  width: 60px;
}

.value {
  color: #f9f7f3;
}

.value.strong {
  color: #ffa857;
  font-weight: 500;
}

.sub-label {
  color: #d8c79c;
}

.sub-value {
  color: #f1ede0;
}
.sub-value {
  color: #f1ede0;
  transition: color 0.2s ease;
}

.sub-value.highlight {
  color: #ff7b47; /* 金橙色で目立たせる */
  font-weight: 600;
  /* text-shadow: 0 0 4px rgba(255, 190, 90, 0.4); */
}
</style>
<style scoped>
.weapon-subline-grid {
  display: grid;
  grid-template-columns: 36px 1fr; /* 左:ラベル 右:内容 */
  gap: 4px 8px;
  margin: 0 0 2px 20px;
  font-size: 23px;
  opacity: 0.9;
  line-height: 1.5;
}

/* 左側ラベル └ : */
.sub-label {
  color: #d8c79c;
  text-align: right;
  padding-right: 4px;
}

/* 属性右側エリア */
.attr-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 1px 10px;
  max-width: 240px;
}

/* 属性名と値 */
.sub-value {
  color: #f1ede0;
  white-space: nowrap;
}

/* ハイライト */
.sub-value.highlight {
  color: #ffb347;
  font-weight: 600;
  text-shadow: 0 0 4px rgba(255, 190, 90, 0.4);
}
</style>
<style scoped>
/* 付与・特性 全体構造 */
.info-grid {
  display: grid;
  grid-template-columns: 60px 1fr; /* 左にラベル、右に内容 */
  gap: 4px 8px;
  margin: 4px 0;
  font-size: 23.5px;
  line-height: 1.6;
}

/* 左側ラベル */
.info-label {
  color: #f2d37f;
  font-weight: 600;
  text-align: right;
  
}

/* 右側のリスト領域 */
.info-list {
  display: flex;
  flex-direction: column; /* 縦並び */
  gap: 2px;               /* 行間 */
}

/* 各行（1項目） */
.info-item {
  color: #f9f7f3;
  white-space: nowrap;
}
</style>
<style scoped>
.item-header {
  text-align: center;
  margin-bottom: 8px;
}

/* ルビ付きタイトル */
.detail-title {
  font-size: 26px;
  font-weight: bold;
  color: #f2d37f;
  text-shadow: 0 0 4px rgba(255, 220, 160, 0.4);
  line-height: 1.3;
  margin-bottom: 4px;
  margin-top: 0px;
}

/* ルビ部分（<rt>） */
.detail-title rt {
  font-size: 17px;
  color: #d7cbb0;
  opacity: 0.9;
}

/* 武器種 / 素材 */
.item-subinfo {
  font-size: 23px;
  color: #f5efe2;
  opacity: 0.85;
  margin-bottom: 4px;
  margin-top: 0px;
}
.info-block {
  border: 1px solid rgba(255, 230, 180, 0.15);
  background: rgba(255, 255, 255, 0.04);
  border-radius: 6px;
  padding: 2px 5px;
  margin-bottom: 0px;
  box-shadow: inset 0 0 4px rgba(255, 255, 255, 0.05);
}

</style>
