/**
 * IndexedDB wrapper for photo blob storage.
 * Stores actual photo files in the browser — no backend needed.
 * Photos persist across page refreshes and are stored locally on the device.
 *
 * Production upgrade path: replace savePhoto / loadPhoto with Supabase Storage calls.
 */

const DB_NAME = 'nursery-photo-db'
const DB_VERSION = 1
const STORE_NAME = 'photo-blobs'

let _db: IDBDatabase | null = null

async function openDB(): Promise<IDBDatabase> {
  if (_db) return _db
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => { _db = req.result; resolve(req.result) }
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
  })
}

export async function savePhoto(id: string, blob: Blob): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const req = tx.objectStore(STORE_NAME).put({ id, blob, savedAt: Date.now() })
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve()
  })
}

export async function loadPhotoURL(id: string): Promise<string | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(id)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => {
      const blob: Blob | undefined = req.result?.blob
      resolve(blob ? URL.createObjectURL(blob) : null)
    }
  })
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(id)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve()
  })
}

/**
 * Generate a small base64 thumbnail for quick preview.
 * Stored in localStorage as part of PhotoMeta — keeps gallery rendering fast.
 */
export async function makeThumbnail(file: File, maxPx = 300): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(maxPx / img.width, maxPx / img.height, 1)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.72))
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve('') }
    img.src = url
  })
}
