<template>
  <div class="container sf-terminal machine-shop">
    <main class="panel">
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      <p v-else-if="isLoading" class="loading-message">ショップデータを読み込み中…</p>

      <template v-else-if="screen === 'directory'">
        <nav class="shop-list" aria-label="ショップ一覧">
          <button v-for="shop in shops" :key="shop.店名" type="button" class="shop-card" @click="openShop(shop)">
            <span class="shop-card__eyebrow">SHOP DIRECTORY</span>
            <strong>{{ shop.店名 }}</strong>
            <small v-if="shop.ルビ">{{ shop.ルビ }}</small>
            <span class="shop-card__count">取扱商品 {{ shop.商品?.length || 0 }} 点</span>
            <span class="shop-card__enter">この店に入る ▶</span>
          </button>
        </nav>
      </template>

      <section v-else-if="selectedShop" class="storefront" :style="storefrontStyle">
        <img class="store-background" :src="backgroundImage" alt="" />
        <div class="store-shade"></div>
        <header class="shop-header">
          <button type="button" class="change-shop" :aria-label="screen === 'action-select' ? 'ショップを選ぶ' : '取引を選ぶ'" @click="screen = screen === 'action-select' ? 'directory' : 'action-select'">◀</button>
          <div class="shop-title"><h2>{{ selectedShop.店名 }}</h2><p v-if="selectedShop.ルビ">{{ selectedShop.ルビ }}</p></div>
        </header>

        <div v-if="screen === 'action-select'" class="clerk-stage">
          <img class="shop-clerk" :src="clerkImage" alt="店員" />
          <aside class="purchase-summary" aria-label="所持金と購入予定"><p>所持金 <strong>{{ characterMoney }} G</strong></p><p>合計 <strong>{{ purchaseTotal }} G</strong></p><p>所持品 <strong>{{ inventoryCount }} / {{ inventoryLimit }}</strong></p></aside>
          <aside class="clerk-message" aria-live="polite"><p>{{ clerkMessage }}</p></aside>
        </div>

        <nav v-if="screen === 'action-select'" class="action-choice-list" aria-label="取引を選ぶ">
          <button v-for="action in shopActions" :key="action.id" type="button" @click="openAction(action.id)">
            <strong>{{ action.label }}</strong>
            <small>{{ action.description }}</small>
            <span>▶</span>
          </button>
        </nav>

        <template v-else>
          <div class="transaction-layout">
            <aside class="transaction-clerk">
              <div class="transaction-clerk__visual"><img class="shop-clerk" :src="clerkImage" alt="店員" /><aside class="purchase-summary" aria-label="所持金と購入予定"><p>所持金 <strong>{{ characterMoney }} G</strong></p><p>合計 <strong>{{ purchaseTotal }} G</strong></p><p>所持品 <strong>{{ inventoryCount }} / {{ inventoryLimit }}</strong></p><ul v-if="purchaseCart.length"><li v-for="item in purchaseCart" :key="item.name"><small>×{{ item.quantity }}</small><span>{{ item.name }}</span></li></ul></aside></div>
              <div class="clerk-message" aria-live="polite"><p>{{ clerkMessage }}</p></div>
              <article class="product-detail transaction-detail" aria-live="polite">
                <template v-if="activeAction === 'buy' && selectedProduct">
                  <div class="product-heading"><div class="detail-quantity-control" :aria-label="`${selectedProduct.name} の購入数`"><button type="button" aria-label="購入数を増やす" @click="changePurchaseQuantity(selectedProduct, 1)">▲</button><span>{{ purchaseQuantity(selectedProduct) }}</span><button type="button" aria-label="購入数を減らす" :disabled="purchaseQuantity(selectedProduct) === 0" @click="changePurchaseQuantity(selectedProduct, -1)">▼</button></div><p class="price">{{ productPrice(selectedProduct) }}</p><h3><ruby>{{ selectedProduct.name }}<rt v-if="selectedProduct.data?.ルビ">{{ selectedProduct.data.ルビ }}</rt></ruby></h3></div>
                  <template v-if="isEquipment(selectedProduct.data)">
                    <p class="item-subinfo"><span>{{ productCategory }}</span><span v-if="productCategory && selectedProduct.data?.素材"> / </span><span>{{ selectedProduct.data?.素材 }}</span></p>
                    <div v-if="isWeapon(selectedProduct.data)" class="equipment-stats">
                      <p><span>全力:</span><strong>{{ getNumber(selectedProduct.data.全力) }}</strong></p>
                      <p><span>威力:</span><strong>{{ getPhysicalPower(selectedProduct.data) }}</strong></p>
                      <div v-if="hasPhysicalDamage(selectedProduct.data)" class="stat-breakdown"><span>└</span><template v-for="type in PHYSICAL_TYPES" :key="type"><b v-if="getNumber(selectedProduct.data[type]) > 0" :class="{ highlight: getNumber(selectedProduct.data[type]) === getMaxPhysical(selectedProduct.data) }">{{ type }} {{ getNumber(selectedProduct.data[type]) }}</b></template></div>
                      <p v-if="getValidAttributes(selectedProduct.data).length"><span>属性:</span><strong>{{ attributeTotal(selectedProduct.data) }}</strong></p>
                      <div v-if="getValidAttributes(selectedProduct.data).length" class="stat-breakdown"><span>└</span><b v-for="attribute in getValidAttributes(selectedProduct.data)" :key="attribute" :class="{ highlight: getNumber(selectedProduct.data[attribute]) === getMaxAttribute(selectedProduct.data) }">{{ attribute }} {{ getNumber(selectedProduct.data[attribute]) }}</b></div>
                      <p><span>ガード:</span><strong>{{ getNumber(selectedProduct.data.ガード) }}</strong></p>
                      <p><span>Cr率:</span><strong>{{ getNumber(selectedProduct.data.Cr率) }}%</strong></p>
                      <p><span>Cr威力:</span><strong>{{ getNumber(selectedProduct.data.Cr威力) }}%</strong></p>
                    </div>
                    <div v-else class="equipment-stats">
                      <p v-if="getNumber(selectedProduct.data?.物理軽減)"><span>物理:</span><strong>{{ getNumber(selectedProduct.data.物理軽減) }}</strong></p>
                      <p v-if="getNumber(selectedProduct.data?.魔法軽減)"><span>魔法:</span><strong>{{ getNumber(selectedProduct.data.魔法軽減) }}</strong></p>
                      <p v-if="getValidResists(selectedProduct.data).length"><span>耐性:</span><strong>{{ statTotal(selectedProduct.data, getValidResists) }}</strong></p>
                      <div v-if="getValidResists(selectedProduct.data).length" class="stat-breakdown"><span>└</span><b v-for="resist in getValidResists(selectedProduct.data)" :key="resist" :class="{ highlight: getNumber(selectedProduct.data[resist]) === getMaxResist(selectedProduct.data) }">{{ resist }} {{ getNumber(selectedProduct.data[resist]) }}</b></div>
                      <p v-if="getValidSkills(selectedProduct.data).length"><span>技能:</span><strong>{{ statTotal(selectedProduct.data, getValidSkills) }}</strong></p>
                      <div v-if="getValidSkills(selectedProduct.data).length" class="stat-breakdown"><span>└</span><b v-for="skill in getValidSkills(selectedProduct.data)" :key="skill" :class="{ highlight: getNumber(selectedProduct.data[skill]) === getMaxSkill(selectedProduct.data) }">{{ skill }} +{{ getNumber(selectedProduct.data[skill]) }}</b></div>
                    </div>
                    <div v-if="getValidStats(selectedProduct.data).length" class="equipment-stats"><p><span>上昇値:</span><strong>{{ statTotal(selectedProduct.data, getValidStats) }}</strong></p><div class="stat-breakdown"><span>└</span><b v-for="stat in getValidStats(selectedProduct.data)" :key="stat" :class="{ highlight: getNumber(selectedProduct.data[stat]) === getMaxStat(selectedProduct.data) }">{{ stat }} +{{ getNumber(selectedProduct.data[stat]) }}</b></div></div>
                    <div v-if="getNumber(selectedProduct.data?.命中率) < 0 || getNumber(selectedProduct.data?.回避率) < 0" class="equipment-stats penalty"><p><span>ペナルティ</span></p><div class="stat-breakdown"><span>└</span><b v-if="getNumber(selectedProduct.data.命中率) < 0">命中率 {{ getNumber(selectedProduct.data.命中率) }}%</b><b v-if="getNumber(selectedProduct.data.回避率) < 0">回避率 {{ getNumber(selectedProduct.data.回避率) }}%</b></div></div>
                    <p v-if="itemTraits(selectedProduct.data).length" class="traits">{{ itemTraits(selectedProduct.data).join('・') }}</p>
                  </template>
                  <dl v-else><div v-if="productCategory"><dt>分類</dt><dd>{{ productCategory }}</dd></div><div v-if="selectedProduct.data?.種別"><dt>種別</dt><dd>{{ selectedProduct.data.種別 }}</dd></div><div v-if="selectedProduct.data?.素材"><dt>素材</dt><dd>{{ selectedProduct.data.素材 }}</dd></div></dl>
                  <p class="description">{{ productDescription || '説明データは未設定です。' }}</p>
                </template>
                <template v-else><p class="detail-label">{{ activeAction === 'sell' ? '売却' : '注文' }}</p><h3>{{ activeAction === 'sell' ? '売却する品を選択' : '注文を確認' }}</h3><p class="description">{{ activeAction === 'sell' ? '売却できる所持品をここに表示します。' : '注文内容をここに表示します。' }}</p></template>
              </article>
            </aside>
            <div class="transaction-right">
              <!-- <p class="swipe-hint">左右にスワイプして、購入・売却・注文を切り替えます</p> -->
              <div ref="carouselRef" class="action-carousel" @scroll.passive="updateActionFromScroll">
                <section id="shop-action-buy" class="action-pane">
                  <header class="action-pane__header"><p>購入</p><span>1 / 3</span></header>
                  <div class="shop-grid">
                    <ul class="product-list" aria-label="購入する商品一覧">
                      <li v-for="product in selectedProducts" :key="product.name" class="product-row">
                        <button type="button" class="product-select" :class="{ active: selectedProduct?.name === product.name }" @click="selectedProduct = product">
                          <span>{{ product.name }}</span><small>{{ productPrice(product) }}</small>
                        </button>
                      </li>
                    </ul>
                  </div>
                </section>
                <section id="shop-action-sell" class="action-pane placeholder-pane"><header class="action-pane__header"><p>売却</p><span>2 / 3</span></header><h3>売却する品を選択</h3><p>所持品と接続すると、ここに売却できる品が表示されます。</p></section>
                <section id="shop-action-order" class="action-pane placeholder-pane"><header class="action-pane__header"><p>注文</p><span>3 / 3</span></header><h3>注文を確認</h3><p>依頼・受取機能と接続すると、ここに注文内容が表示されます。</p></section>
              </div>
              <div class="carousel-indicator" aria-hidden="true"><span v-for="action in shopActions" :key="action.id" :class="{ active: activeAction === action.id }"></span></div>
            </div>
          </div>
        </template>
      </section>

      <button type="button" class="return-button" @click="router.push('/machine-adventure')">機械世界メニューに戻る</button>
    </main>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { applyGlobalScale } from '@/components/useScale.js'
import { getCharIllust } from '@/constants/statData.js'
import { PHYSICAL_TYPES, getMaxAttribute, getMaxPhysical, getMaxResist, getMaxSkill, getMaxStat, getNumber, getPhysicalPower, getValidAttributes, getValidResists, getValidSkills, getValidStats, hasPhysicalDamage, isEquipment, isWeapon } from '@/constants/equipmentDisplay.js'

const router = useRouter()
const shops = ref([])
const catalog = ref([])
const selectedShop = ref(null)
const selectedProduct = ref(null)
const screen = ref('directory')
const activeAction = ref('buy')
const carouselRef = ref(null)
const defaultClerkImage = getCharIllust('セレス')
const defaultBackgroundImage = getCharIllust('魔法研究')
const clerkImage = ref(defaultClerkImage)
const backgroundImage = ref(defaultBackgroundImage)
const isLoading = ref(true)
const errorMessage = ref('')
const adventureCharacter = ref(null)
const purchaseCart = ref([])

const catalogByName = computed(() => new Map(catalog.value.map(item => [item.名前, item])))
const selectedProducts = computed(() => (selectedShop.value?.商品 || []).map(name => ({ name, data: catalogByName.value.get(name) || null })))
const productCategory = computed(() => selectedProduct.value?.data?.分類 || selectedProduct.value?.data?.カテゴリ || '')
const productDescription = computed(() => selectedProduct.value?.data?.説明 || selectedProduct.value?.data?.素材の説明 || selectedProduct.value?.data?.武器の説明 || '')
const attributeTotal = item => getValidAttributes(item).reduce((total, key) => total + getNumber(item[key]), 0)
const statTotal = (item, getKeys) => getKeys(item).reduce((total, key) => total + getNumber(item[key]), 0)
const itemTraits = item => [item?.付与, item?.装備特性].flatMap(value => Array.isArray(value) ? value : []).map(value => value?.名前 || value).filter(Boolean)
const characterMoney = computed(() => Math.max(0, Number(adventureCharacter.value?.money) || 0))
const inventoryCount = computed(() => Array.isArray(adventureCharacter.value?.inventory) ? adventureCharacter.value.inventory.length : 0)
const inventoryLimit = computed(() => Math.max(0, Number(adventureCharacter.value?.maxInventory) || 15))
const productPriceValue = product => Math.max(0, Number(product?.data?.金額) || 0)
const purchaseTotal = computed(() => purchaseCart.value.reduce((total, item) => total + productPriceValue(item.product) * item.quantity, 0))
const shopActions = [
  { id: 'buy', label: '購入', description: '店の商品を確認して購入します' },
  { id: 'sell', label: '売却', description: '所持品を売却します' },
  { id: 'order', label: '注文', description: '注文・受取を確認します' }
]
const storefrontStyle = computed(() => ({ '--shop-accent': activeAction.value === 'buy' ? '#81f4ff' : '#b2e8ff' }))
const clerkMessage = computed(() => {
  if (screen.value === 'action-select') return 'いらっしゃいませ。ご用件をお選びください。'
  if (activeAction.value === 'sell') return '売却ですね。品物を見せてください。'
  if (activeAction.value === 'order') return '注文のご相談ですか？ 内容を確認します。'
  return selectedProduct.value ? `「${selectedProduct.value.name}」ですね。どうぞご覧ください。` : 'いらっしゃいませ。お探しの品を選んでください。'
})

function loadShopImage(imageName, fallback) {
  if (!imageName) return fallback
  const imageKey = String(imageName).split('/').pop().replace(/\.[^.]+$/, '')
  return getCharIllust(imageKey) || fallback
}

function productPrice(product) {
  const price = product?.data?.金額
  return Number.isFinite(Number(price)) && Number(price) > 0 ? `${price} G` : '価格未設定'
}

function purchaseQuantity(product) {
  return purchaseCart.value.find(item => item.name === product.name)?.quantity || 0
}

function changePurchaseQuantity(product, change) {
  const existing = purchaseCart.value.find(item => item.name === product.name)
  if (existing) {
    existing.quantity += change
    if (existing.quantity <= 0) purchaseCart.value = purchaseCart.value.filter(item => item !== existing)
  } else if (change > 0) {
    purchaseCart.value.push({ name: product.name, product, quantity: change })
  }
}

const openShop = shop => {
  selectedShop.value = shop
  selectedProduct.value = selectedProducts.value[0] || null
  purchaseCart.value = []
  activeAction.value = 'buy'
  clerkImage.value = loadShopImage(shop.店員, defaultClerkImage)
  backgroundImage.value = loadShopImage(shop.背景, defaultBackgroundImage)
  screen.value = 'action-select'
}

const openAction = async actionId => {
  activeAction.value = actionId
  screen.value = 'storefront'
  await nextTick()
  const target = carouselRef.value?.querySelector(`#shop-action-${actionId}`)
  target?.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'start' })
}

const updateActionFromScroll = () => {
  const carousel = carouselRef.value
  if (!carousel?.clientWidth) return
  const actionIndex = Math.max(0, Math.min(shopActions.length - 1, Math.round(carousel.scrollLeft / carousel.clientWidth)))
  activeAction.value = shopActions[actionIndex].id
}

onMounted(async () => {
  applyGlobalScale()
  try {
    adventureCharacter.value = JSON.parse(window.sessionStorage.getItem('active-adventure-character') || 'null')
  } catch {
    adventureCharacter.value = null
  }
  try {
    const [shopResponse, itemResponse, equipmentResponse, materialResponse] = await Promise.all([
      fetch('/api/excel/shop'),
      fetch('/api/excel/items'),
      fetch('/api/excel/equipments'),
      fetch('/api/excel/materials')
    ])
    if (![shopResponse, itemResponse, equipmentResponse, materialResponse].every(response => response.ok)) {
      throw new Error('ショップまたは商品データの取得に失敗しました')
    }
    shops.value = await shopResponse.json()
    catalog.value = [
      ...(await itemResponse.json()),
      ...(await equipmentResponse.json()),
      ...(await materialResponse.json())
    ]
  } catch (error) {
    console.error('ショップデータの取得に失敗:', error)
    errorMessage.value = 'ショップデータを読み込めませんでした。'
  } finally {
    isLoading.value = false
  }

  window.render_game_to_text = () => JSON.stringify({
    screen: 'machine-shop',
    mode: screen.value,
    shopCount: shops.value.length,
    selectedShop: selectedShop.value?.店名 || null,
    activeAction: activeAction.value,
    productCount: selectedProducts.value.length,
    selectedProduct: selectedProduct.value?.name || null,
    money: characterMoney.value,
    inventory: `${inventoryCount.value}/${inventoryLimit.value}`,
    purchaseTotal: purchaseTotal.value,
    purchaseItems: purchaseCart.value.map(item => `${item.name}×${item.quantity}`)
  })
})

onBeforeUnmount(() => {
  delete window.render_game_to_text
})
</script>

<style scoped>
:global(#scalable-root) {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 720px !important;
  height: 1280px !important;
  box-sizing: border-box;
  margin: -640px 0 0 -360px;
  padding: 0 !important;
}
.machine-shop { max-width: 700px; width: 100%; height: 100%; padding: 1px; box-sizing: border-box; color: #aefcff; font-family: Consolas, "Courier New", monospace; }
.panel { min-height: 100%; box-sizing: border-box; display: flex; flex-direction: column; gap: 0; padding: 0; border: 0; background: transparent; box-shadow: none; }
.eyebrow { margin: 0 0 8px; color: #72eefa; font-size: 15px; letter-spacing: .12em; }
h1, h2, h3 { margin: 0; color: #e0faff; }
h1 { font-size: 32px; }
.subtitle { margin: 8px 0 0; color: #a7dfe7; font-size: 15px; }
.loading-message, .error-message { padding: 14px; border: 1px solid #2fa4c7; background: rgba(0, 0, 0, .6); font-size: 15px; }
.error-message { color: #ffb5b5; border-color: #b95e66; }
.shop-list { display: grid; gap: 12px; }
.shop-card { min-height: 138px; display: flex; flex-direction: column; align-items: flex-start; gap: 7px; padding: 16px; border: 1px solid #3aaed8; border-radius: 6px; background: linear-gradient(135deg, rgba(20, 91, 118, .9), rgba(7, 25, 37, .95)); color: #d8fbff; font: inherit; text-align: left; cursor: pointer; }
.shop-card:hover { border-color: #8af5ff; box-shadow: inset 0 0 20px rgba(112, 240, 255, .18), 0 0 12px rgba(73, 198, 229, .3); }.shop-card__eyebrow { color: #72eefa; font-size: 13px; letter-spacing: .1em; }.shop-card strong { font-size: 23px; }.shop-card small { color: #9edbe6; font-size: 14px; }.shop-card__count { color: #bdeef4; font-size: 15px; }.shop-card__enter { margin-top: auto; color: #82f2ff; font-size: 16px; font-weight: 700; }
.storefront { position: relative; min-height: 0; flex: 1 1 0; overflow: hidden; border: 1px solid #2fa4c7; background: #05131a; isolation: isolate; }
.store-background, .store-shade { position: absolute; inset: 0; width: 100%; height: 100%; }.store-background { object-fit: cover; z-index: -2; }.store-shade { z-index: -1; background: linear-gradient(90deg, rgba(3, 13, 20, .88) 0%, rgba(3, 13, 20, .56) 62%, rgba(3, 13, 20, .2)); }
.shop-header { position: relative; z-index: 2; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px; border-bottom: 1px solid rgba(93, 205, 229, .4); background: rgba(3, 15, 23, .74); }
.shop-header h2 { font-size: 22px; }.shop-header p { margin: 2px 0 0; color: #8ac9d8; font-size: 13px; }.shop-resources { min-width: 104px; color: #a7dfe7; text-align: right; }.shop-resources p { margin: 0; font-size: 13px; line-height: 1.45; white-space: nowrap; }.shop-resources strong { color: #80eefa; font-size: 15px; }
.change-shop { display: block; margin: 0 0 7px; padding: 0; border: 0; background: transparent; color: #8df3ff; font: inherit; font-size: 14px; cursor: pointer; }.change-shop:hover { text-decoration: underline; }
.clerk-stage { position: relative; z-index: 1; height: 335px; overflow: hidden; border-bottom: 1px solid rgba(93, 205, 229, .35); }.shop-clerk { position: absolute; top: 0; left: 50%; width: 320px; height: 100%; object-fit: contain; object-position: top center; filter: drop-shadow(0 0 12px rgba(3, 13, 20, .8)); transform: translateX(-50%); pointer-events: none; }.clerk-message { position: absolute; right: 14px; bottom: 14px; left: 14px; margin: 0; padding: 12px 15px; border: 1px solid rgba(180, 246, 255, .84); border-radius: 6px; background: rgba(4, 19, 28, .9); color: #ecfeff; box-shadow: 0 0 15px rgba(69, 213, 244, .25); font-size: 15px; line-height: 1.55; }.clerk-message p { margin: 0; }
.action-choice-list { position: relative; z-index: 2; display: grid; gap: 9px; padding: 12px; }.action-choice-list button { min-height: 68px; display: grid; grid-template-columns: 1fr auto; column-gap: 12px; align-items: center; padding: 10px 14px; border: 1px solid rgba(116, 230, 248, .72); border-radius: 5px; background: rgba(2, 19, 30, .74); color: #e5fdff; font: inherit; text-align: left; cursor: pointer; }.action-choice-list button:hover { background: rgba(27, 119, 144, .68); }.action-choice-list strong { font-size: 19px; }.action-choice-list small { grid-column: 1; margin-top: 3px; color: #9bdce8; font-size: 13px; }.action-choice-list span { grid-column: 2; grid-row: 1 / span 2; color: #8af5ff; font-size: 20px; }
.swipe-hint { position: relative; z-index: 2; margin: 0; padding: 9px 12px; background: rgba(3, 15, 23, .74); color: #a7dfe7; font-size: 13px; text-align: center; }.action-carousel { position: relative; z-index: 2; display: flex; height: 500px; overflow-x: auto; overflow-y: hidden; scroll-snap-type: x mandatory; scrollbar-width: none; background: rgba(2, 13, 21, .58); }.action-carousel::-webkit-scrollbar { display: none; }.action-pane { box-sizing: border-box; flex: 0 0 100%; min-width: 100%; padding: 0; scroll-snap-align: start; overflow-y: auto; }.action-pane__header { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-bottom: 1px solid rgba(93, 205, 229, .35); background: rgba(3, 18, 28, .54); }.action-pane__header p { margin: 0; color: #e9feff; font-size: 18px; font-weight: 700; }.action-pane__header span { color: #83eaf6; font-size: 13px; }
.shop-grid { min-height: 0; display: grid; grid-template-columns: 1fr; background: rgba(2, 13, 21, .58); }.product-list { min-height: 0; max-height: 225px; margin: 0; padding: 0; overflow-y: auto; list-style: none; border-bottom: 1px solid rgba(93, 205, 229, .4); scrollbar-color: #39cce8 rgba(2, 16, 23, .88); background: rgba(2, 13, 21, .33); }
.product-list button { width: 100%; min-height: 62px; display: block; padding: 8px 12px; border: 0; border-bottom: 1px solid rgba(93, 205, 229, .18); background: rgba(3, 18, 28, .44); color: #d9fbff; font: inherit; text-align: left; cursor: pointer; }.product-list button > span { display: block; font-size: 18px; font-weight: 700; line-height: 1.2; }.product-list button small { display: block; margin-top: 4px; color: #86c9d8; font-size: 13px; line-height: 1.1; text-align: right; }.product-list button.active { background: rgba(63, 199, 226, .2); color: #81f4ff; }
.product-detail { min-height: 0; padding: 14px; color: #d9fbff; font-size: 15px; overflow-y: auto; background: rgba(3, 18, 28, .53); }.detail-label { margin: 0 0 8px; color: #78eefa; font-size: 13px; letter-spacing: .08em; }.product-heading { position: relative; min-height: 47px; padding-right: 72px; }.product-heading .price { position: absolute; top: 3px; right: 0; margin: 0; color: #71f2c5; font-size: 10px; font-weight: 700; text-align: right; white-space: nowrap; }.product-heading h3 { max-width: 74px; margin: 0; font-size: 22px; }.product-heading ruby { display: inline-flex; flex-direction: column; align-items: flex-start; }.product-heading ruby rt { display: block; width: 74px; color: #93d8e3; font-size: 11px; line-height: 1.1; overflow-wrap: anywhere; }.price { margin: 8px 0; color: #71f2c5; font-size: 21px; font-weight: 700; }.product-detail dl { margin: 0; }.product-detail dl div { display: grid; grid-template-columns: 54px 1fr; gap: 8px; margin: 7px 0; }.product-detail dt { color: #7bddeb; }.product-detail dd { margin: 0; }.item-subinfo { margin: 0 0 10px; color: #abdfe6; font-size: 14px; }.equipment-stats { margin: 7px 0; }.equipment-stats p { display: flex; gap: 7px; margin: 3px 0; line-height: 1.45; }.equipment-stats p span { width: 62px; flex: 0 0 62px; color: #8bdae7; }.equipment-stats strong { color: #f3fdff; }.stat-breakdown { display: flex; flex-wrap: wrap; gap: 3px 7px; margin: 0 0 5px 12px; color: #c5f2f7; font-size: 13px; line-height: 1.45; }.stat-breakdown > span { color: #8bdae7; }.stat-breakdown b { font-weight: 400; }.stat-breakdown .highlight { color: #83f2c9; font-weight: 700; }.penalty { color: #ffb9a8; }.penalty .stat-breakdown { color: #ffb9a8; }.traits { margin: 8px 0; color: #c2e7ff; font-size: 13px; }.description { margin: 14px 0 0; padding-top: 10px; border-top: 1px solid rgba(93, 205, 229, .35); line-height: 1.6; white-space: pre-line; }.placeholder-pane { padding: 0 18px; background: rgba(3, 18, 28, .55); }.placeholder-pane h3 { margin: 32px 0 10px; font-size: 22px; }.placeholder-pane > p { color: #c4e8ee; line-height: 1.7; }.carousel-indicator { position: relative; z-index: 2; display: flex; justify-content: center; gap: 7px; padding: 9px; background: rgba(3, 15, 23, .74); }.carousel-indicator span { width: 28px; height: 3px; border-radius: 5px; background: rgba(142, 222, 235, .35); }.carousel-indicator span.active { background: var(--shop-accent); }
.product-detail { min-height: 0; padding: 14px; color: #d9fbff; font-size: 15px; overflow-y: auto; background: rgba(3, 18, 28, .53); }.detail-label { margin: 0 0 8px; color: #78eefa; font-size: 13px; letter-spacing: .08em; }.product-detail h3 { font-size: 22px; }.price { margin: 8px 0; color: #71f2c5; font-size: 21px; font-weight: 700; }.product-detail dl { margin: 0; }.product-detail dl div { display: grid; grid-template-columns: 54px 1fr; gap: 8px; margin: 7px 0; }.product-detail dt { color: #7bddeb; }.product-detail dd { margin: 0; }.description { margin: 14px 0 0; padding-top: 10px; border-top: 1px solid rgba(93, 205, 229, .35); line-height: 1.6; white-space: pre-line; }.placeholder-pane { padding: 0 18px; background: rgba(3, 18, 28, .55); }.placeholder-pane h3 { margin: 32px 0 10px; font-size: 22px; }.placeholder-pane > p { color: #c4e8ee; line-height: 1.7; }.carousel-indicator { position: relative; z-index: 2; display: flex; justify-content: center; gap: 7px; padding: 9px; background: rgba(3, 15, 23, .74); }.carousel-indicator span { width: 28px; height: 3px; border-radius: 5px; background: rgba(142, 222, 235, .35); }.carousel-indicator span.active { background: var(--shop-accent); }
.transaction-layout { position: relative; z-index: 2; display: grid; grid-template-columns: 1fr 1fr; height: calc(100% - 114px); min-height: 0; background: rgba(2, 13, 21, .54); }.transaction-clerk { min-width: 0; display: grid; grid-template-rows: minmax(220px, 35%) auto minmax(0, 1fr); overflow: hidden; border-right: 1px solid rgba(93, 205, 229, .38); background: rgba(2, 13, 21, .42); }.transaction-clerk__visual { position: relative; overflow: hidden; }.transaction-clerk .shop-clerk { top: 90px; width: 480px; height: 580px; max-width: none; }.transaction-clerk .clerk-message { position: static; margin: 8px; padding: 10px; font-size: 14px; }.transaction-detail { min-height: 0; margin: 0 8px 4px; border: 1px solid rgba(93, 205, 229, .35); }.transaction-right { min-width: 0; display: flex; flex-direction: column; min-height: 0; }.transaction-right .swipe-hint { font-size: 12px; }.transaction-right .action-carousel { height: auto; min-height: 0; flex: 1; }.transaction-right .action-pane { height: 100%; display: flex; flex-direction: column; }.transaction-right .shop-grid { display: block; min-height: 0; flex: 1; }.transaction-right .product-list { height: 100%; max-height: none; border-bottom: 0; }.transaction-right .carousel-indicator { margin-top: auto; }
.transaction-clerk .clerk-message { margin: 5px; padding: 5px; }
.transaction-detail { margin: 0 5px 4px; padding: 5px; }
.transaction-detail .product-heading { position: sticky; top: -5px; z-index: 3; min-height: 0; padding: 3px 0 5px; background: rgba(3, 18, 28, .97); }
.transaction-detail .product-heading .price { position: static; display: block; margin: 0 0 4px; font-size: 12px; text-align: right; }
.transaction-detail .product-heading h3 { max-width: none; margin: 0; font-size: 20px; }
.transaction-detail .product-heading ruby { display: inline-flex; flex-direction: column; align-items: flex-start; }
.transaction-detail .product-heading ruby rt { display: block; width: auto; line-height: 1.1; }
.transaction-detail .item-subinfo { margin: 0 0 5px; }
.transaction-detail .equipment-stats { margin: 5px 0; }
.transaction-detail .description { margin: 5px 0 0; padding-top: 5px; }
.product-list button { min-height: 54px; padding: 5px; }.product-list button small { margin-top: 2px; }
.purchase-summary { position: absolute; z-index: 2; top: 5px; left: 5px; width: min(178px, calc(100% - 10px)); box-sizing: border-box; padding: 5px; border: 1px solid rgba(148, 239, 250, .75); border-radius: 4px; background: rgba(3, 18, 28, .9); color: #b9eef4; font-size: 12px; line-height: 1.35; }.purchase-summary p { display: flex; justify-content: space-between; gap: 5px; margin: 0; }.purchase-summary strong { color: #79f1d0; font-size: 13px; }.purchase-summary ul { max-height: 82px; margin: 4px 0 0; padding: 4px 0 0; overflow-y: auto; list-style: none; border-top: 1px solid rgba(148, 239, 250, .35); }.purchase-summary li { display: flex; justify-content: flex-start; gap: 5px; padding: 1px 0; }.purchase-summary li span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.purchase-summary li small { flex: 0 0 auto; color: #83eaf6; }
.product-row { display: flex; min-height: 54px; border-bottom: 1px solid rgba(93, 205, 229, .18); }.product-row .quantity-control { flex: 0 0 31px; display: grid; grid-template-rows: 16px 1fr 16px; align-items: center; justify-items: center; border-right: 1px solid rgba(93, 205, 229, .18); background: rgba(3, 18, 28, .68); color: #83eaf6; font-size: 11px; }.product-row .quantity-control button { width: 100%; min-height: 16px; padding: 0; border: 0; border-bottom: 1px solid rgba(93, 205, 229, .12); background: transparent; color: #83eaf6; font: inherit; line-height: 1; cursor: pointer; }.product-row .quantity-control button:last-child { border-bottom: 0; border-top: 1px solid rgba(93, 205, 229, .12); }.product-row .quantity-control button:disabled { color: rgba(131, 234, 246, .3); cursor: default; }.product-row .product-select { flex: 1; min-width: 0; min-height: 54px; padding: 5px; border-bottom: 0; }.product-row .product-select > span { font-size: 17px; }
.product-row { display: block; }.product-row .product-select { width: 100%; min-height: 54px; padding: 5px; border-bottom: 0; }.product-row .product-select > span { font-size: 17px; }
.transaction-detail .product-heading { min-height: 54px; }.detail-quantity-control { position: absolute; top: 3px; left: 0; display: grid; grid-template-columns: 16px 18px 16px; align-items: center; height: 18px; border: 1px solid rgba(148, 239, 250, .55); border-radius: 3px; background: rgba(3, 18, 28, .88); color: #83eaf6; font-size: 11px; text-align: center; }.detail-quantity-control button { min-height: 16px; padding: 0; border: 0; background: transparent; color: #83eaf6; font: inherit; line-height: 1; cursor: pointer; }.detail-quantity-control button:disabled { color: rgba(131, 234, 246, .3); cursor: default; }
.shop-header { justify-content: flex-start; gap: 5px; min-height: 36px; padding: 4px 5px; }.change-shop { flex: 0 0 28px; min-height: 28px; margin: 0; font-size: 18px; text-align: left; }.shop-title { min-width: 0; margin-left: auto; text-align: right; }.shop-header h2 { font-size: 18px; }.shop-header p { margin: 0; font-size: 11px; }
.purchase-summary { border: 0; border-radius: 0; background: rgba(3, 18, 28, .62); }
.clerk-message, .transaction-clerk .clerk-message { border: 0; border-radius: 0; background: rgba(4, 19, 28, .66); box-shadow: none; }
.shop-header { min-height: 48px; }
.change-shop { align-self: flex-end; transform: translateY(-2px); }
.transaction-layout { height: calc(100% - 126px); }
.machine-shop { font-size: 20px; }
.shop-header h2 { font-size: 24px; }
.shop-header p, .shop-resources p { font-size: 15px; }
.change-shop { font-size: 24px; }
.clerk-message, .transaction-clerk .clerk-message { font-size: 20px; }
.purchase-summary { font-size: 16px; line-height: 1.35; }
.purchase-summary strong { font-size: 18px; }
.purchase-summary li small { font-size: 15px; }
.action-choice-list strong { font-size: 26px; }
.action-choice-list small, .swipe-hint, .action-pane__header span { font-size: 18px; }
.action-choice-list span { font-size: 27px; }
.action-pane__header p { font-size: 24px; }
.product-list button > span, .product-row .product-select > span { font-size: 23px; }
.product-list button small { font-size: 17px; }
.transaction-detail { font-size: 20px; }
.transaction-detail .product-heading .price { font-size: 16px; }
.transaction-detail .product-heading h3 { font-size: 27px; }
.detail-quantity-control { font-size: 15px; }
.item-subinfo, .stat-breakdown, .traits { font-size: 18px; }
.return-button { font-size: 22px; }
.return-button { min-height: 48px; border: 1px solid #3aaed8; border-radius: 4px; background: transparent; color: #a7dfe7; font: inherit; font-size: 22px; cursor: pointer; }
.return-button:hover { background: rgba(33, 111, 137, .3); }
@media (min-width: 700px) { .machine-shop { padding: 18px; }.panel { padding: 20px; }.clerk-stage { height: 310px; }.action-carousel { height: 480px; } }
</style>
