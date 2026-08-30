const toFiniteNumber = (...values) => {
  for (const value of values) {
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed >= 0) return parsed
  }
  return null
}

const readStat = (stats, keys) => {
  const sources = [stats?.currentStats, stats?.totalStats, stats?.baseStats, stats]
  for (const source of sources) {
    for (const key of keys) {
      const value = toFiniteNumber(source?.[key])
      if (value != null) return value
    }
  }
  return null
}

export const buildBattleAlliesFromCharacter = character => {
  if (!character) return null

  const members = Array.isArray(character.party) && character.party.length
    ? character.party
    : [character]

  return members.map((member, index) => {
    const stats = member?.stats || {}
    const level = toFiniteNumber(stats.allLv, character.raceLevel, 1) || 1
    const hpMax = readStat(stats, ['HP最大', 'HPMax', 'hpMax', 'HP']) || Math.max(10, level * 10)
    const mpMax = readStat(stats, ['MP最大', 'MPMax', 'mpMax', 'MP']) || Math.max(0, level * 5)
    const hp = Math.min(toFiniteNumber(member?.hp, stats.currentHP, stats.hp, hpMax) ?? hpMax, hpMax)
    const mp = Math.min(toFiniteNumber(member?.mp, stats.currentMP, stats.mp, mpMax) ?? mpMax, mpMax)

    return {
      id: member?.id || `${character.id || 'character'}-${index}`,
      name: member?.name || character.name || `UNIT-${index + 1}`,
      hp,
      hpMax,
      mp,
      mpMax,
      fatigue: Array.isArray(stats.statusEffects) && stats.statusEffects.some(effect => String(effect?.type || effect).includes('疲労')),
      icon: member?.battleIcon || member?.icon || character.battleIcon || character.icon || '',
      siz: readStat(stats, ['SIZ', 'サイズ']) || 180,
      position: member?.position || (index === 0 ? 'front' : 'back'),
      distance: 0,
      sFlying: false,
      targetOffsetX: 20,
      targetOffsetY: 140,
      targetScale: 1,
      character: member
    }
  })
}
