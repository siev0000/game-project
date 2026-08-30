const clone = value => JSON.parse(JSON.stringify(value))

const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0))
const point = value => ({ x: clamp(value?.x, 0, 100), y: clamp(value?.y, 0, 100) })
const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
const number = value => Number(value.toFixed(3))
const commandPoint = value => `${number(value.x)} ${number(value.y)}`
export const formationColumnOrder = {
  enemy: ['back', 'middle', 'front'],
  ally: ['front', 'middle', 'back']
}

export const normalizeBattleFormationLayout = source => {
  const field = source?.field || {}
  const normalizeBreaks = values => {
    const next = Array.isArray(values) ? values.slice(0, 2).map(value => clamp(value, 0.05, 0.95)) : [0.3333, 0.6667]
    while (next.length < 2) next.push(next.length ? 0.6667 : 0.3333)
    return next.sort((a, b) => a - b)
  }
  return {
    version: 1,
    field: {
      enemyOuterTop: point(field.enemyOuterTop),
      enemyOuterBottom: point(field.enemyOuterBottom),
      centerTop: point(field.centerTop),
      centerBottom: point(field.centerBottom),
      allyOuterTop: point(field.allyOuterTop),
      allyOuterBottom: point(field.allyOuterBottom)
    },
    columnBreaks: normalizeBreaks(source?.columnBreaks),
    rowBreaks: normalizeBreaks(source?.rowBreaks),
    style: {
      lineWidth: clamp(source?.style?.lineWidth ?? 0.75, 0.25, 4)
    }
  }
}

export const normalizeBattleFormationUnits = (source, units = { enemy: [], ally: [] }) => {
  const result = {
    version: 1,
    baseline: {
      offsetX: clamp(source?.baseline?.offsetX ?? 26, -300, 300),
      offsetY: clamp(source?.baseline?.offsetY ?? 55, -200, 200)
    },
    enemy: {},
    ally: {}
  }
  for (const side of ['enemy', 'ally']) {
    const allowedColumns = formationColumnOrder[side]
    for (const unit of units[side] || []) {
      const id = String(unit.id)
      const value = source?.[side]?.[id] || {}
      const fallbackColumn = allowedColumns.includes(unit.position) ? unit.position : allowedColumns[0]
      result[side][id] = {
        column: allowedColumns.includes(value.column) ? value.column : fallbackColumn,
        row: Math.round(clamp(value.row ?? 1, 0, 2)),
        offsetX: clamp(value.offsetX ?? 0, -300, 300),
        offsetY: clamp(value.offsetY ?? 0, -200, 200)
      }
    }
  }
  return result
}

const buildSide = (corners, columnBreaks, rowBreaks) => {
  const columns = [0, ...columnBreaks, 1]
  const rows = [0, ...rowBreaks, 1]
  const [topLeft, topRight, bottomRight, bottomLeft] = corners
  const at = (columnT, rowT) => {
    const left = lerp(topLeft, bottomLeft, rowT)
    const right = lerp(topRight, bottomRight, rowT)
    return lerp(left, right, columnT)
  }
  const lines = [
    ...columns.map(value => `M ${commandPoint(at(value, 0))} L ${commandPoint(at(value, 1))}`),
    ...rows.map(value => `M ${commandPoint(at(0, value))} L ${commandPoint(at(1, value))}`)
  ].join(' ')
  const anchors = Array.from({ length: 3 }, (_, columnIndex) =>
    Array.from({ length: 3 }, (_, rowIndex) => at(
      (columns[columnIndex] + columns[columnIndex + 1]) / 2,
      rows[rowIndex + 1]
    ))
  )
  return {
    outline: `M ${commandPoint(topLeft)} L ${commandPoint(topRight)} L ${commandPoint(bottomRight)} L ${commandPoint(bottomLeft)} Z`,
    lines,
    anchors
  }
}

export const buildBattleFormationGeometry = source => {
  const layout = normalizeBattleFormationLayout(source)
  const field = layout.field
  return {
    layout: clone(layout),
    enemy: buildSide(
      [field.enemyOuterTop, field.centerTop, field.centerBottom, field.enemyOuterBottom],
      layout.columnBreaks,
      layout.rowBreaks
    ),
    ally: buildSide(
      [field.centerTop, field.allyOuterTop, field.allyOuterBottom, field.centerBottom],
      layout.columnBreaks,
      layout.rowBreaks
    )
  }
}
