<template>
  <div class="tab-panel">

    <div class="info-row"><span class="label">Lv：</span><span class="value">{{ character?.stats?.allLv }}</span></div>
    <div class="info-row"><span class="label">種族：</span><span class="value">{{ character?.Role?.[1]?.roleName || '未設定' }}</span></div>
    <div class="info-row"><span class="label">クラス：</span><span class="value">{{ character?.Role?.[0]?.roleName || '未設定' }}</span></div>

    <hr />

    <div class="info-row"><span class="label">所持金：</span><span class="value">{{ player?.money }}</span></div>
    <div class="info-row"><span class="label">現在地：</span><span class="value">{{ player?.location || '不明' }}</span></div>

    <hr />
    <h3>ギルド情報</h3>
    <div class="info-row">
    <span class="label">所属：</span>
    <span class="value">{{ character?.guild?.name || '未所属' }}</span>
    </div>

<div class="info-row">
  <span class="label">ランク：</span>
  <span class="value">
    <template v-if="character?.guild?.rank">
      <span
        class="guild-rank"
        :style="{
          color: getRankStyleByName(character.guild.rank)?.color,
          WebkitTextStroke: `1px ${getRankStyleByName(character.guild.rank)?.outline}`
        }"
      >
        <ruby>
          {{ getRankStyleByName(character.guild.rank)?.symbol }}
          <!-- <rt>{{ getRankStyleByName(character.guild.rank)?.name }}</rt> -->
        </ruby>
      </span>
    </template>
    <template v-else>-</template>
  </span>
</div>

<div class="info-row">
  <span class="label">貢献度：</span>
  <span class="value">{{ character?.guild?.contributionPoints || 0 }}</span>
</div>


  </div>
</template>


<script setup>
import { getRankStyleByName } from "@/constants/statData.js";

const { character, player } = defineProps({
  character: { type: Object, required: true },
  player: { type: Object, required: true }
});

console.log("=========== 基本タブ st ==========");
console.log(player);
// console.log(character);
// console.log(character.guild);
// console.log(character.guild.rank);
console.log("=========== 基本タブ ed ==========");
</script>



<style scoped>
.tab-panel {
  background: rgba(255, 255, 240, 0.9);
  border: 2px solid #8b5a2b;
  padding: 12px;
  border-radius: 8px;
}
h2, h3 {
  margin: 6px 0;
  color: #4d3216;
}

.guild-rank {
  font-size: 32px;
  font-weight: bold;
}
.guild-rank rt {
  font-size: 14px;
  color: #fff;
}
</style>
