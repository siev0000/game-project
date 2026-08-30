import { resolveDamage, resolveGuardSequence, resolveInjury } from '../src/constants/damageResolver.js'

const fail = (message) => { throw new Error(message) }
const near = (actual, expected, label) => { if (Math.abs(actual - expected) > 1e-9) fail(`${label}: ${actual} !== ${expected}`) }

const guard = resolveGuardSequence({ attacks: [120], physicalGuard: 50, defense: 100 })
near(guard.baseGuard, 100, 'base guard')
near(guard.hits[0].guardReduction, 10, 'guard reduction')
near(guard.hits[0].damage, 36, 'breakthrough minimum damage')
if (!guard.hits[0].broken) fail('guard should break')

const injury = resolveInjury({ maxHp: 160, currentHp: 120, damage: 60, damageType: '打撃' })
if (!injury.incapacitated || !injury.fractured || injury.limbLost || injury.instantDeath) fail('injury thresholds differ from v10')

const result = resolveDamage({ power: 100, baseAttackCount: 2, judge: 100, extra: 500, attribute: '悪', app: 100, targetHp: 500, targetHpMax: 500 })
near(result.perHitPower, 270, 'per-hit power')
near(result.totalDamage, 540, 'total damage')
near(result.nextHp, 0, 'next HP')
console.log('damage resolver: OK')

