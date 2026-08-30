// TRPG calculator v10 と同じ順序で、攻撃側威力 → 属性補正 → ガード → 負傷を解決する。
export const DAMAGE_RULES = Object.freeze({
  skillPowerDivideByBaseAttackCount: true,
  guardBreakMinPowerRatio: 0.3,
  guardCurrentReductionRatio: 0.1,
  incapacitationCurrentHpRatio: 0.3,
  limbDamageCurrentHpRatio: 0.5,
  limbDamageMinMaxHpRatio: 0.15,
  instantDeathCurrentHpRatio: 1,
  instantDeathMinMaxHpRatio: 0.3
})

const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback
const positiveInteger = (value, fallback = 1) => Math.max(1, Math.floor(number(value, fallback)))

export const skillPowerPerHit = (power, baseAttackCount = 1, rules = DAMAGE_RULES) => {
  const count = positiveInteger(baseAttackCount)
  return rules.skillPowerDivideByBaseAttackCount === false ? number(power) : number(power) / count
}

export const attackPower = ({ power, judge, extra, baseAttackCount = 1, rules = DAMAGE_RULES }) => {
  let value = skillPowerPerHit(power, baseAttackCount, rules)
  if (Number.isFinite(Number(judge))) value *= 1 + number(judge) / 100
  if (Number.isFinite(Number(extra))) value *= 1 + number(extra) / 500
  return value
}

export const alignmentAppMultiplier = (attribute, app) => {
  const value = number(app)
  const matched = (String(attribute).trim() === '悪' && value > 0) || (String(attribute).trim() === '善' && value < 0)
  return matched ? 1.25 + Math.min(Math.abs(value), 500) / 1000 : 1
}

export const resolveGuardSequence = ({ attacks, physicalGuard = 0, defense = 0, guardCount = 1, rules = DAMAGE_RULES }) => {
  const baseGuard = number(physicalGuard) * (1 + number(defense) / 100)
  let currentGuard = baseGuard
  let refreshesRemaining = positiveInteger(guardCount) - 1
  const hits = (Array.isArray(attacks) ? attacks : []).map((attackValue, index) => {
    const attack = number(attackValue)
    let refreshed = false
    if (currentGuard <= 0 && refreshesRemaining > 0) {
      currentGuard = baseGuard
      refreshesRemaining -= 1
      refreshed = true
    }
    const guardBefore = Math.max(0, currentGuard)
    const guardReduction = guardBefore * number(rules.guardCurrentReductionRatio, 0.1)
    const guardConsumption = Math.max(0, attack - guardReduction)
    let damage = attack
    let blocked = false
    let broken = false
    if (guardBefore > 0 && guardConsumption <= guardBefore) {
      currentGuard = guardBefore - guardConsumption
      damage = 0
      blocked = true
    } else if (guardBefore > 0) {
      const breakthrough = Math.max(0, guardConsumption - guardBefore)
      damage = Math.max(breakthrough, attack * number(rules.guardBreakMinPowerRatio, 0.3))
      currentGuard = 0
      broken = true
    }
    return { hit: index + 1, attack, refreshed, guardBefore, guardReduction, guardConsumption, blocked, broken, damage, guardRemaining: currentGuard, refreshesRemaining }
  })
  return { baseGuard, hits, guardRemaining: currentGuard }
}

export const resolveInjury = ({ maxHp, currentHp, damage, damageType = '', rules = DAMAGE_RULES }) => {
  const max = number(maxHp)
  const current = number(currentHp)
  const totalDamage = number(damage)
  const incapacitationThreshold = current * number(rules.incapacitationCurrentHpRatio, 0.3)
  const limbThreshold = Math.max(current * number(rules.limbDamageCurrentHpRatio, 0.5), max * number(rules.limbDamageMinMaxHpRatio, 0.15))
  const instantDeathThreshold = Math.max(current * number(rules.instantDeathCurrentHpRatio, 1), max * number(rules.instantDeathMinMaxHpRatio, 0.3))
  return {
    incapacitated: totalDamage >= incapacitationThreshold,
    limbLost: totalDamage >= limbThreshold && damageType !== '打撃',
    fractured: totalDamage >= limbThreshold && damageType === '打撃',
    instantDeath: totalDamage >= instantDeathThreshold,
    thresholds: { incapacitation: incapacitationThreshold, limb: limbThreshold, instantDeath: instantDeathThreshold }
  }
}

export const resolveDamage = ({
  power,
  baseAttackCount = 1,
  judge,
  extra,
  attribute = '',
  app = 0,
  physicalGuard = 0,
  defense = 0,
  guardCount = 1,
  targetHp,
  targetHpMax,
  damageType = '',
  rules = DAMAGE_RULES
}) => {
  const perHitBeforeAlignment = attackPower({ power, judge, extra, baseAttackCount, rules })
  const alignmentMultiplier = alignmentAppMultiplier(attribute, app)
  const perHitPower = perHitBeforeAlignment * alignmentMultiplier
  const hitCount = positiveInteger(baseAttackCount)
  const guard = resolveGuardSequence({ attacks: Array.from({ length: hitCount }, () => perHitPower), physicalGuard, defense, guardCount, rules })
  const totalDamage = guard.hits.reduce((sum, hit) => sum + hit.damage, 0)
  const injury = resolveInjury({ maxHp: targetHpMax, currentHp: targetHp, damage: totalDamage, damageType, rules })
  return {
    hitCount,
    perHitPower,
    alignmentMultiplier,
    guard,
    totalDamage,
    nextHp: Math.max(0, number(targetHp) - totalDamage),
    injury
  }
}
