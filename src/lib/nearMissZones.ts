import { NEAR_MISS_LOCATION_GRID } from '@/types'
import { useNearMissZoneStore } from '@/stores/appStore'

export interface AnyZone {
  key: string
  emoji: string
  label: string
  isCustom: boolean
}

/** デフォルトゾーン（非表示を除く）＋カスタムゾーンを結合して返すフック */
export function useAllZones(): AnyZone[] {
  const { customZones, hiddenDefaults } = useNearMissZoneStore()
  const visibleDefaults = NEAR_MISS_LOCATION_GRID
    .filter((z) => !hiddenDefaults.includes(z.key))
    .map((z) => ({ key: z.key, emoji: z.emoji, label: z.label, isCustom: false }))
  const custom = customZones.map((z) => ({ ...z, isCustom: true }))
  return [...visibleDefaults, ...custom]
}

/** キーからゾーン情報を検索（デフォルト＋カスタム両方を対象） */
export function findZone(
  key: string | null,
  customZones: Array<{ key: string; emoji: string; label: string }>
): AnyZone | undefined {
  if (!key) return undefined
  const def = NEAR_MISS_LOCATION_GRID.find((z) => z.key === key)
  if (def) return { key: def.key, emoji: def.emoji, label: def.label, isCustom: false }
  const custom = customZones.find((z) => z.key === key)
  if (custom) return { ...custom, isCustom: true }
  return undefined
}
