<template>
  <div
    class="modal-overlay"
    tabindex="0"
  >
    <div class="modal-content" role="dialog" aria-modal="true">
      <header class="modal-header">
        <h2 class="modal-title">属性を選択</h2>
      </header>

      <!-- 検索ボックス -->
      <!-- <div class="modal-tools">
        <input
          v-model="q"
          class="search-input"
          type="text"
          placeholder="属性名・ルビ・分類で絞り込み…"
        />
      </div> -->

      <!-- 一覧 -->
      <div class="attribute-grid">
        <button
          v-for="attr in filtered"
          :key="attrKey(attr)"
          :class="['attribute-card', { selected: isSelected(attr) }]"
          @click="pick(attr)"
          :title="displayName(attr)"
        >
          <img
            v-if="resolveImage(attr)"
            :src="resolveImage(attr)"
            :alt="displayName(attr)"
            class="attribute-image"
            loading="lazy"
          />
          <div class="attribute-text">
            <p class="attribute-name">
              <ruby>
                {{ displayName(attr) }}
                <rt v-if="displayRuby(attr)">{{ displayRuby(attr) }}</rt>
              </ruby>
            </p>
          </div>
        </button>
      </div>

      <!-- 選択した属性の詳細プレビュー -->
      <div class="attribute-detail" v-if="selected">
        <div class="detail-header">
          <img
            v-if="resolveImage(selected)"
            :src="resolveImage(selected)"
            :alt="displayName(selected)"
            class="detail-image"
            loading="lazy"
          />
          <div>
            <h3 class="detail-name">
              <ruby>
                {{ displayName(selected) }}
                <rt v-if="displayRuby(selected)">{{ displayRuby(selected) }}</rt>
              </ruby>
            </h3>
          </div>
          <!-- <p class="detail-type" v-if="displayType(selected)">
            {{ displayType(selected) }}
          </p> -->

        </div>
         <!-- ▼ ここから差し替え：詳細本文（テーマ / 取得魔法内容） -->
        <div class="detail-body">
          <!-- テーマ -->
          <section class="detail-section" v-if="displayTheme(selected)">
            <p class="section-text">{{ displayTheme(selected) }}</p>
          </section>

          <!-- 取得魔法内容（例を分割して箇条書き） -->
          <section class="detail-section" v-if="exampleList(selected).length">
            <!-- <ul class="example-list">
              <li v-for="(ex, idx) in exampleList(selected)" :key="idx">{{ ex }}</li>
            </ul> -->
            <p class="example-list">取得魔法:{{ exampleList(selected) }}</p>
          </section>
        </div>
        <!-- ▲ 差し替えここまで -->

      </div>

      <footer class="modal-footer">
        <button class="primary-btn" :disabled="!selected" @click="confirm">決定</button>
        <button class="secondary-btn" @click="onClose">閉じる</button>
      </footer>
    </div>
  </div>
</template>

<script>
// /src/assets/images/属性アイコン/100/{属性名}.webp を全部取り込む（Vite）
const iconMods = import.meta.glob(
  "/src/assets/images/属性アイコン/100/*.webp",
  { eager: true, as: "url" }
);

const ICONS = {};
for (const [path, url] of Object.entries(iconMods)) {
  const filename = path.split("/").pop().replace(/\.webp$/i, ""); // 例: "炎"
  ICONS[filename] = url;
}

export default {
  name: "AttributeModal",
  props: {
    // CharacterCreateView.vue 側の attributeList をそのまま渡す
    attributes: { type: Array, default: () => [] },
  },
  emits: ["close", "select"],
  data() {
    return { q: "", selected: null };
  },
  computed: {
    filtered() {
      const q = this.q?.trim().toLowerCase();

      // 条件1 フィルタも検索フィルタも実行せず全件返す
      return this.attributes;
    },
  },

  mounted() {
    // キーボード操作（Escなど）を受けられるようフォーカス
    this.$el && this.$el.focus?.();

    const first = this.attributes.find(a => this.displayName(a) === "力場");
    if (first) {
      this.selected = first;
    }
  },
  methods: {
    onClose() {
      this.$emit("close");
    },
    // シングルクリックで選択（下部にプレビュー表示）
    pick(attr) {
      this.selected = attr;
    },
    // 選択ハイライト用
    isSelected(a) {
      if (!this.selected) return false;
      return this.attrKey(a) === this.attrKey(this.selected);
    },
    // 決定ボタンで確定（emit→次tickでクローズ）
    confirm() {
      if (!this.selected) return;
      this.$emit("select", this.selected);
      this.$nextTick(() => this.onClose());
    },

    // ---- データ吸収（日本語キー対応）----
    attrKey(a) {
      return a.id ?? a.ID ?? a.key ?? a.名前 ?? a.属性名 ?? a.name;
    },
    displayName(a) {
      // あなたの属性データ例に合わせる: { 属性名, 分類, テーマ, 例（スキルや特徴） }
      return a.属性名 ?? a.name ?? a.名前 ?? "";
    },
    displayRuby(a) {
      return a.ruby ?? a.ルビ ?? "";
    },
    displayTheme(a) {
      // あなたのデータ構造 { テーマ, 属性名, 分類, 例（スキルや特徴） } に対応
      return a?.テーマ ?? a?.theme ?? "";
    },
    magic(a) {
      // あなたのデータ構造 { テーマ, 属性名, 分類, 例（スキルや特徴） } に対応
      return a?.取得魔法内容 ?? "";
    },
    exampleList(a) {
      // 「取得魔法内容」または旧仕様「例（スキルや特徴）」を配列化
      const raw = a?.取得魔法内容 
              ?? a?.["例（スキルや特徴）"] 
              ?? a?.examples 
              ?? "";
      if (!raw) return [];
      return raw
        .split(/[、,／・]\s*/g)
        .map(s => s.trim())
        .filter(Boolean);
    },

    // 画像解決：属性名と一致するファイルをマップから引く
    resolveImage(a) {
      const name = (this.displayName(a) || "").trim();
      if (!name) return "";
      return ICONS[name] || "";
    },
  },
};
</script>

<style scoped>
.modal-overlay {
  width: 100%;
  height: 100%;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 3000;
}

.modal-content {
  min-width: 700px ;
  min-height: 1200px;
  max-width: 700px ;
  max-height: 1200px;
  
  /* max-width: none !important; */
  font-size: 20px;
  background: #1a1a1a;
  border-radius: 12px;
  overflow: hidden;
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.25);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #eee;
}

.modal-title {
  margin: 0;
  font-size: 25px;
}

.close-btn {
  border: none;
  background: transparent;
  font-size: 25px;
  cursor: pointer;
}

.modal-tools {
  padding: 10px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.search-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 20px;
}

.attribute-grid {
  padding: 6px;
  overflow: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.attribute-card {
  display: flex;
  gap: 1px;
  width: 100%;
  height: 74px;
  text-align: left;
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 10px 4px;
  font-size: 30px;
  background: #424242;
  cursor: pointer;
  align-items: center;    /* ← 縦中央（交差軸） */
  margin-bottom: 0;
  transition: transform 0.08s ease, box-shadow 0.08s ease, background 0.08s;
}
.attribute-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  background: #424242;
}
.attribute-card.selected {
  border-color: #c8a24b;
  background: #424242;
  box-shadow: 0 0 0 2px rgba(200, 162, 75, 0.25);
}

.attribute-image, .detail-image {
  width: 55px;
  height: 55px;
  object-fit: contain;
  border-radius: 8px;
  flex: 0 0 auto;
  border-radius: 50%;
}

.attribute-text {
  display: grid;
  gap: 2px;
}

.attribute-name {
  margin: 0;
  font-weight: 600;
}

.attribute-meta {
  margin: 0;
  font-size: 20px;
  color: #666;
}

.attribute-desc {
  margin: 4px 0 0;
  font-size: 20px;
  color: #666;
  line-height: 1.4;
}

/* 詳細プレビュー */
/* ▼ 詳細ビューをコンパクトに（アイコン左上小さめ → 説明は下） */
.attribute-detail {
  padding: 10px 16px;
  display: grid;
  gap: 6px;            /* 見出しと説明の間を詰める */
  border-top: 1px solid #eee;
  height: 360px;
  grid-template-rows: 1fr 9fr; /* ← 上下の高さ割合 */
}

.detail-header {
  display: flex;
  align-items: flex-start; /* ← アイコンを“上”に合わせる */
  gap: 8px;                /* アイコンとタイトルの間隔 */
  height: 50px;
}



.detail-name {
  margin: 0;
  font-size: 30px;
  font-weight: 700;
  line-height: 1.2;
}

.detail-type {
  margin: 2px 0 0;
  font-size: 12px;
  color: #ffffff;
}

.detail-desc {
  margin: 0;               /* 上の gap を活かすので margin は0 */
  font-size: 20px;
  color: #ffffff;
  line-height: 1.6;        /* 読みやすい行間 */
}


/* フッターのボタン */
.modal-footer {
  padding: 12px 16px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  height: 45px;
}
.primary-btn {
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  background: #c8a24b;
  color: #fff;
  cursor: pointer;
}
.primary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.secondary-btn {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #ddd;
  background: #424242;
  cursor: pointer;
}
.secondary-btn:hover {
  background: #424242;
}


/* 詳細レイアウト：ヘッダー 2 / 本文 8 の比率にしたい場合は高さを持たせる */
.attribute-detail {
  padding: 10px 16px;
  display: grid;
  grid-template-rows: 1fr 9fr; /* 上下比 2:8 */
  gap: 6px;
  border-top: 1px solid #eee;
  min-height: 160px; /* ← 比率が効くよう最低高を付ける（任意で調整） */
  box-sizing: border-box;
}

/* ヘッダーはすでにあるものを流用（アイコン左上小さく） */
.detail-header {
  display: flex;
  align-items: flex-start;   /* アイコンを上揃え */
  gap: 8px;
}

/* 下部本文（テーマ / 取得魔法内容） */
.detail-body {
  overflow-y: auto;          /* 長文でもスクロール */
  padding-right: 2px;        /* スクロールバー時の見切れ防止 */
  display: grid;
  gap: 10px;
  grid-template-rows: 2fr 8fr;
  font-size: 20px;
}

.detail-section {
  display: grid;
  gap: 4px;
}

.section-title {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  color: #6b6b6b;            /* 見出しを控えめに */
  letter-spacing: 0.03em;
}

.section-text {
  margin: 0;
  font-size: 22px;
  color: #ffffff;
  line-height: 1.6;
  text-align: left;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
}

.example-list {
  margin: 0;
  padding-left: 1em;         /* 箇条書きの字下げ */
  font-size: 22px;
  color: #ffffff;
  line-height: 1.6;
  text-align: left;
}
.example-list li {
  margin: 0.1em 0;
}

</style>
