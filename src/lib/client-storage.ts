type StorageScope = 'local' | 'session'

type StorageEnvelope<T> = {
  v: number
  value: T
  expiresAt?: number
}

type WriteVersionedStorageOptions = {
  ttlMs?: number
}

function getStorage(scope: StorageScope): Storage | null {
  if (typeof window === 'undefined') {
    return null
  }

  return scope === 'local' ? window.localStorage : window.sessionStorage
}

export function readVersionedStorage<T>(
  scope: StorageScope,
  key: string,
  version: number
): T | null {
  const storage = getStorage(scope)

  if (!storage) {
    return null
  }

  try {
    const raw = storage.getItem(key)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as StorageEnvelope<T>
    if (parsed.v !== version) {
      storage.removeItem(key)
      return null
    }

    if (parsed.expiresAt && parsed.expiresAt <= Date.now()) {
      storage.removeItem(key)
      return null
    }

    return parsed.value
  } catch {
    storage.removeItem(key)
    return null
  }
}

export function writeVersionedStorage<T>(
  scope: StorageScope,
  key: string,
  version: number,
  value: T,
  options: WriteVersionedStorageOptions = {}
) {
  const storage = getStorage(scope)

  if (!storage) {
    return
  }

  try {
    const payload: StorageEnvelope<T> = {
      v: version,
      value,
      expiresAt: options.ttlMs ? Date.now() + options.ttlMs : undefined,
    }

    storage.setItem(key, JSON.stringify(payload))
  } catch {
    storage.removeItem(key)
  }
}

export function removeVersionedStorage(scope: StorageScope, key: string) {
  const storage = getStorage(scope)

  if (!storage) {
    return
  }

  storage.removeItem(key)
}