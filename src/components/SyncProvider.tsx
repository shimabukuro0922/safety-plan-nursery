/**
 * SyncProvider — クラウド同期の起点コンポーネント
 * 施設が Supabase に接続されている場合、マウント時・フォーカス時にデータを引き込みます。
 * 午睡記録はリアルタイム購読で他端末の入力を即時反映します。
 */
import React, { useEffect, useRef } from 'react'
import { useFacilityStore } from '@/stores/facilityStore'
import {
  useNapCheckStore,
  useNearMissStore,
  useStaffTrainingStore,
  useChecklistStore,
  useChecklistItemsStore,
} from '@/stores/appStore'
import { useChildrenStore } from '@/stores/childrenStore'
import {
  pullNearMisses,
  pullNapChecks,
  pullTrainingRecords,
  pullChecklistDone,
  pullChecklistItems,
  pullChildren,
  subscribeToNapChecks,
} from '@/lib/sync'

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { facility } = useFacilityStore()
  const facilityId = facility?.supabaseId ?? null
  const lastSyncRef = useRef<number>(0)

  useEffect(() => {
    if (!facilityId) return

    const today = new Date().toISOString().split('T')[0]

    const syncAll = async (force = false) => {
      const now = Date.now()
      // Debounce: don't sync more than once every 30s (unless forced on mount)
      if (!force && now - lastSyncRef.current < 30_000) return
      lastSyncRef.current = now

      try {
        const [nearMisses, napChecks, trainingRecords, checklistDone, checklistItems, children] =
          await Promise.all([
            pullNearMisses(facilityId),
            pullNapChecks(facilityId, today),
            pullTrainingRecords(facilityId),
            pullChecklistDone(facilityId),
            pullChecklistItems(facilityId),
            pullChildren(facilityId),
          ])

        // Replace local state with remote (writes have already been pushed on each action)
        useNearMissStore.setState({ nearMisses })
        useNapCheckStore.setState((s) => ({
          records: [
            ...s.records.filter((r) => r.date !== today),
            ...napChecks,
          ],
        }))
        useStaffTrainingStore.setState({ records: trainingRecords })
        useChecklistStore.setState({
          doneItems: checklistDone.doneItems,
          lastMarkedMonth: checklistDone.lastMarkedMonth,
        })
        // Only replace checklist items if there is remote data (don't wipe local defaults)
        if (checklistItems.length > 0) {
          useChecklistItemsStore.setState({ items: checklistItems })
        }
        useChildrenStore.setState((s) => ({ ...s, children }))
      } catch (err) {
        console.warn('[SyncProvider] sync failed:', err)
      }
    }

    // Initial pull (forced — bypass debounce)
    syncAll(true)

    // Real-time subscription: nap checks appear on other devices immediately
    const unsubRealtime = subscribeToNapChecks(facilityId, today, (record) => {
      useNapCheckStore.setState((s) => {
        if (s.records.some((r) => r.id === record.id)) return s
        return { records: [...s.records, record] }
      })
    })

    // Pull-on-focus (debounced)
    const onFocus = () => syncAll()
    window.addEventListener('focus', onFocus)

    return () => {
      unsubRealtime()
      window.removeEventListener('focus', onFocus)
    }
  }, [facilityId])

  return <>{children}</>
}

export default SyncProvider
