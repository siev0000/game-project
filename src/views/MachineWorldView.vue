<template>
  <main class="machine-world">
    <BattleView @close="returnToCharacterSelect" />
  </main>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BattleView from '@/components/modals/robot/BattleView.vue'

const router = useRouter()
const character = ref(null)

const readSelectedCharacter = () => {
  try {
    return JSON.parse(window.sessionStorage.getItem('machine-world-character') || 'null')
  } catch {
    return null
  }
}

const renderMachineWorldState = () => JSON.stringify({
  screen: 'machine-world',
  characterId: character.value?.id ?? null,
  characterName: character.value?.name ?? 'オートマン',
  race: character.value?.race ?? 'オートマン',
  raceLevel: character.value?.raceLevel ?? 10,
  equipmentPreset: character.value?.equipmentPreset ?? 'standard'
})

const returnToCharacterSelect = () => router.push('/CharacterSelectView')

onMounted(() => {
  character.value = readSelectedCharacter()
  window.render_game_to_text = renderMachineWorldState
  window.advanceTime = () => {}
})

onBeforeUnmount(() => {
  if (window.render_game_to_text === renderMachineWorldState) delete window.render_game_to_text
  delete window.advanceTime
})
</script>

<style scoped>
.machine-world { width: 100%; min-height: 100vh; background: radial-gradient(circle at 50% 15%, #153d52, #040a10 70%); }
</style>
