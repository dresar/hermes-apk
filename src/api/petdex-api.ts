import type { PetGalleryItem, PetManifestEntry } from './types'

const PETDEX_MANIFEST_URL = ['https:', '', 'petdex.dev', 'api', 'manifest'].join('/')
const MANIFEST_CACHE_KEY = 'hermes_petdex_manifest_cache'
const MANIFEST_CACHE_TIMESTAMP_KEY = 'hermes_petdex_manifest_cache_time'
const MANIFEST_CACHE_TTL_MS = 24 * 60 * 60 * 1000

export function getCachedPetManifest(): PetManifestEntry[] | null {
  if (typeof localStorage === 'undefined') {
    return null
  }
  try {
    const cachedData = localStorage.getItem(MANIFEST_CACHE_KEY)
    if (!cachedData) {
      return null
    }
    const parsed = JSON.parse(cachedData)
    if (Array.isArray(parsed)) {
      return parsed as PetManifestEntry[]
    }
  } catch {
    return null
  }
  return null
}

export function clearPetManifestCache(): void {
  if (typeof localStorage === 'undefined') {
    return
  }
  try {
    localStorage.removeItem(MANIFEST_CACHE_KEY)
    localStorage.removeItem(MANIFEST_CACHE_TIMESTAMP_KEY)
  } catch {
    void 0
  }
}

export async function fetchPetManifest(forceRefresh = false): Promise<PetManifestEntry[]> {
  if (!forceRefresh && typeof localStorage !== 'undefined') {
    try {
      const cachedTimeStr = localStorage.getItem(MANIFEST_CACHE_TIMESTAMP_KEY)
      const cachedDataStr = localStorage.getItem(MANIFEST_CACHE_KEY)
      if (cachedTimeStr && cachedDataStr) {
        const cachedTime = Number(cachedTimeStr)
        if (!isNaN(cachedTime) && Date.now() - cachedTime < MANIFEST_CACHE_TTL_MS) {
          const parsed = JSON.parse(cachedDataStr)
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed as PetManifestEntry[]
          }
        }
      }
    } catch {
      void 0
    }
  }

  try {
    const response = await fetch(PETDEX_MANIFEST_URL)
    if (!response.ok) {
      throw new Error(String(response.status))
    }
    const rawData = await response.json()
    let manifest: PetManifestEntry[] = []

    if (Array.isArray(rawData)) {
      manifest = rawData as PetManifestEntry[]
    } else if (
      rawData &&
      typeof rawData === 'object' &&
      Array.isArray((rawData as { pets?: unknown }).pets)
    ) {
      manifest = (rawData as { pets: PetManifestEntry[] }).pets
    }

    if (manifest.length > 0 && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(MANIFEST_CACHE_KEY, JSON.stringify(manifest))
        localStorage.setItem(MANIFEST_CACHE_TIMESTAMP_KEY, Date.now().toString())
      } catch {
        void 0
      }
    }

    return manifest
  } catch {
    const cached = getCachedPetManifest()
    if (cached) {
      return cached
    }
    return []
  }
}

export async function generatePetThumbnail(entry: PetManifestEntry): Promise<string> {
  if (entry.thumb && entry.thumb.startsWith('data:image')) {
    return entry.thumb
  }

  const sourceUrl = entry.thumb || entry.spritesheetUrl
  if (!sourceUrl) {
    return ''
  }

  if (typeof document === 'undefined' || typeof Image === 'undefined') {
    return entry.thumb || ''
  }

  return new Promise<string>((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = 96
        canvas.height = 96
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(entry.thumb || '')
          return
        }
        const sourceWidth = Math.min(192, img.width)
        const sourceHeight = Math.min(208, img.height)
        ctx.imageSmoothingEnabled = false
        ctx.drawImage(img, 0, 0, sourceWidth, sourceHeight, 0, 0, 96, 96)
        const dataUrl = canvas.toDataURL('image/png')
        resolve(dataUrl)
      } catch {
        resolve(entry.thumb || '')
      }
    }
    img.onerror = () => {
      resolve(entry.thumb || '')
    }
    img.src = sourceUrl
  })
}

export function createGalleryItem(
  entry: PetManifestEntry,
  previewBase64?: string
): PetGalleryItem {
  return {
    slug: entry.slug,
    name: entry.name,
    spritesheetUrl: entry.spritesheetUrl,
    thumbUrl: entry.thumb,
    previewBase64,
    isLocal: false,
  }
}
