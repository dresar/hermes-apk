import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { create } from 'zustand'
import { Preferences } from '@capacitor/preferences'
import { Search, X, Check, RefreshCw, Sparkles } from 'lucide-react'
import { PetSprite } from './PetSprite'

export interface PetItem {
  slug: string
  name: string
  category: string
  spritesheetUrl: string
  description?: string
}

export interface PetPickerProps {
  isOpen: boolean
  onClose: () => void
  activePetSlug?: string
  onSelectPet?: (pet: PetItem) => void
}

const MANIFEST_URL = ['https:', '', 'petdex.dev', 'api', 'manifest'].join('/')
const SPRITES_BASE_URL = ['https:', '', 'petdex.dev', 'sprites'].join('/')

export const DEFAULT_LOCAL_PETS: PetItem[] = [
  {
    slug: 'hermes-fox',
    name: 'Hermes Fox',
    category: 'Companion',
    spritesheetUrl: [SPRITES_BASE_URL, 'hermes-fox.webp'].join('/'),
    description: 'Fleet-footed messenger fox with swift reasoning.',
  },
  {
    slug: 'cyber-hound',
    name: 'Cyber Hound',
    category: 'Cyber',
    spritesheetUrl: [SPRITES_BASE_URL, 'cyber-hound.webp'].join('/'),
    description: 'Synthetic guardian tuned for rapid tool execution.',
  },
  {
    slug: 'obsidian-cat',
    name: 'Obsidian Cat',
    category: 'Beast',
    spritesheetUrl: [SPRITES_BASE_URL, 'obsidian-cat.webp'].join('/'),
    description: 'Stealthy nocturnal feline that prowls the dark terminal.',
  },
  {
    slug: 'quantum-dragon',
    name: 'Quantum Dragon',
    category: 'Mythic',
    spritesheetUrl: [SPRITES_BASE_URL, 'quantum-dragon.webp'].join('/'),
    description: 'Superpositioned drake capable of deep recursive reasoning.',
  },
  {
    slug: 'solar-falcon',
    name: 'Solar Falcon',
    category: 'Elemental',
    spritesheetUrl: [SPRITES_BASE_URL, 'solar-falcon.webp'].join('/'),
    description: 'High-altitude scout with blazing turn latency.',
  },
  {
    slug: 'pixel-panda',
    name: 'Pixel Panda',
    category: 'Companion',
    spritesheetUrl: [SPRITES_BASE_URL, 'pixel-panda.webp'].join('/'),
    description: 'Calm and steady companion that prevents context drift.',
  },
  {
    slug: 'void-wolf',
    name: 'Void Wolf',
    category: 'Beast',
    spritesheetUrl: [SPRITES_BASE_URL, 'void-wolf.webp'].join('/'),
    description: 'Pack hunter adept at distributed agent orchestration.',
  },
  {
    slug: 'neon-tiger',
    name: 'Neon Tiger',
    category: 'Cyber',
    spritesheetUrl: [SPRITES_BASE_URL, 'neon-tiger.webp'].join('/'),
    description: 'Electroluminescent predator with high token velocity.',
  },
  {
    slug: 'echo-bear',
    name: 'Echo Bear',
    category: 'Beast',
    spritesheetUrl: [SPRITES_BASE_URL, 'echo-bear.webp'].join('/'),
    description: 'Resilient sentinel equipped with lossless memory recall.',
  },
  {
    slug: 'astro-rabbit',
    name: 'Astro Rabbit',
    category: 'Companion',
    spritesheetUrl: [SPRITES_BASE_URL, 'astro-rabbit.webp'].join('/'),
    description: 'Gravity-defying hare navigating celestial orbits.',
  },
  {
    slug: 'frost-owl',
    name: 'Frost Owl',
    category: 'Elemental',
    spritesheetUrl: [SPRITES_BASE_URL, 'frost-owl.webp'].join('/'),
    description: 'Glacial observer maintaining cool deterministic outputs.',
  },
  {
    slug: 'inferno-drake',
    name: 'Inferno Drake',
    category: 'Mythic',
    spritesheetUrl: [SPRITES_BASE_URL, 'inferno-drake.webp'].join('/'),
    description: 'Volcanic wyrm that burns through complex task trees.',
  },
  {
    slug: 'chrono-stag',
    name: 'Chrono Stag',
    category: 'Mythic',
    spritesheetUrl: [SPRITES_BASE_URL, 'chrono-stag.webp'].join('/'),
    description: 'Temporal warden steering scheduled heartbeat loops.',
  },
  {
    slug: 'shadow-panther',
    name: 'Shadow Panther',
    category: 'Beast',
    spritesheetUrl: [SPRITES_BASE_URL, 'shadow-panther.webp'].join('/'),
    description: 'Silent tracker executing sandboxed background routines.',
  },
  {
    slug: 'mecha-falcon',
    name: 'Mecha Falcon',
    category: 'Cyber',
    spritesheetUrl: [SPRITES_BASE_URL, 'mecha-falcon.webp'].join('/'),
    description: 'Titanium-plated drone delivering precision code patches.',
  },
  {
    slug: 'terra-golem',
    name: 'Terra Golem',
    category: 'Elemental',
    spritesheetUrl: [SPRITES_BASE_URL, 'terra-golem.webp'].join('/'),
    description: 'Bedrock defender protecting immutable Git checkpoints.',
  },
]

interface PetStoreState {
  activePet: PetItem
  setActivePet: (pet: PetItem) => void
  loadPersistedPet: () => Promise<void>
}

export const usePetStore = create<PetStoreState>((set) => ({
  activePet: DEFAULT_LOCAL_PETS[0],
  setActivePet: (pet: PetItem) => {
    set({ activePet: pet })
    try {
      const payload = JSON.stringify(pet)
      Preferences.set({ key: 'hermes_active_pet', value: payload }).catch(() => {})
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('hermes_active_pet', payload)
      }
    } catch {}
  },
  loadPersistedPet: async () => {
    try {
      const pref = await Preferences.get({ key: 'hermes_active_pet' })
      if (pref.value) {
        const parsed = JSON.parse(pref.value) as PetItem
        if (parsed && parsed.slug) {
          set({ activePet: parsed })
          return
        }
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        const local = window.localStorage.getItem('hermes_active_pet')
        if (local) {
          const parsed = JSON.parse(local) as PetItem
          if (parsed && parsed.slug) {
            set({ activePet: parsed })
          }
        }
      }
    } catch {}
  },
}))

const CATEGORIES = ['All', 'Companion', 'Cyber', 'Beast', 'Elemental', 'Mythic']
const PAGE_SIZE = 48

export const PetPicker: React.FC<PetPickerProps> = ({
  isOpen,
  onClose,
  activePetSlug,
  onSelectPet,
}) => {
  const storeActivePet = usePetStore((s) => s.activePet)
  const setStoreActivePet = usePetStore((s) => s.setActivePet)
  const loadPersistedPet = usePetStore((s) => s.loadPersistedPet)

  const [catalog, setCatalog] = useState<PetItem[]>(DEFAULT_LOCAL_PETS)
  const [isCatalogLoading, setIsCatalogLoading] = useState(false)
  const [catalogLoaded, setCatalogLoaded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const currentActiveSlug = activePetSlug || storeActivePet.slug

  useEffect(() => {
    loadPersistedPet()
  }, [loadPersistedPet])

  useEffect(() => {
    if (!isOpen || catalogLoaded || isCatalogLoading) return

    let isMounted = true
    setIsCatalogLoading(true)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 12000)

    fetch(MANIFEST_URL, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Manifest response not ok')
        return res.json()
      })
      .then((data) => {
        if (!isMounted) return
        const rawList = Array.isArray(data) ? data : data?.pets || []
        if (Array.isArray(rawList) && rawList.length > 0) {
          const formatted: PetItem[] = rawList.map((item: Record<string, unknown>, idx: number) => {
            const slug = String(item.slug || `pet-${idx + 1}`)
            const name = String(item.name || slug.replace(/-/g, ' '))
            const category = String(item.category || 'Companion')
            const spritesheetUrl = String(
              item.spritesheetUrl ||
              item.url ||
              [SPRITES_BASE_URL, `${slug}.webp`].join('/'),
            )
            const description = item.description ? String(item.description) : undefined
            return { slug, name, category, spritesheetUrl, description }
          })

          const mergedMap = new Map<string, PetItem>()
          DEFAULT_LOCAL_PETS.forEach((p) => mergedMap.set(p.slug, p))
          formatted.forEach((p) => mergedMap.set(p.slug, p))
          setCatalog(Array.from(mergedMap.values()))
          setCatalogLoaded(true)
        }
      })
      .catch(() => {
        if (!isMounted) return
      })
      .finally(() => {
        clearTimeout(timer)
        if (isMounted) {
          setIsCatalogLoading(false)
        }
      })

    return () => {
      isMounted = false
      controller.abort()
      clearTimeout(timer)
    }
  }, [isOpen, catalogLoaded, isCatalogLoading])

  const filteredPets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return catalog.filter((pet) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        pet.category.toLowerCase() === selectedCategory.toLowerCase()
      if (!matchesCategory) return false

      if (!q) return true
      return (
        pet.name.toLowerCase().includes(q) ||
        pet.slug.toLowerCase().includes(q) ||
        pet.category.toLowerCase().includes(q)
      )
    })
  }, [catalog, searchQuery, selectedCategory])

  const visiblePets = useMemo(() => {
    return filteredPets.slice(0, visibleCount)
  }, [filteredPets, visibleCount])

  const handleSelect = useCallback(
    (pet: PetItem) => {
      setStoreActivePet(pet)
      if (onSelectPet) {
        onSelectPet(pet)
      }
      onClose()
    },
    [setStoreActivePet, onSelectPet, onClose],
  )

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE)
  }

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [searchQuery, selectedCategory])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-xs transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pet-picker-heading"
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 flex max-h-[85dvh] w-full flex-col rounded-t-2xl border-t border-[#23262d] bg-[#121316] shadow-2xl">
        <div className="flex h-5 w-full items-center justify-center pt-2">
          <div className="h-1 w-12 rounded-full bg-[#23262d]" />
        </div>

        <div className="flex items-center justify-between border-b border-[#23262d] px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#323640] bg-[#1a1c20] text-[#ff6347]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2
                id="pet-picker-heading"
                className="text-base font-medium tracking-tight text-[#f3f4f6]"
              >
                Petdex Mascot Companion
              </h2>
              <div className="flex items-center gap-2 text-xs text-[#9ca3af]">
                <span>
                  {catalogLoaded ? `${catalog.length.toLocaleString()} pets` : `${catalog.length} starter pets`}
                </span>
                {isCatalogLoading && (
                  <span className="flex items-center gap-1 text-[#ff6347]">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Syncing catalog
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-[#23262d] bg-[#1a1c20] text-[#9ca3af] transition-colors hover:text-[#f3f4f6] active:bg-[#23262d]"
            aria-label="Close pet gallery"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 px-4 pt-3 pb-2">
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-[#9ca3af]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pets by name, slug, or trait..."
              className="h-11 w-full rounded-lg border border-[#23262d] bg-[#090a0b] pr-10 pl-9 text-sm text-[#f3f4f6] placeholder-[#9ca3af] transition-colors focus:border-[#ff6347] focus:outline-none"
              aria-label="Filter pets"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-1 flex min-h-[44px] min-w-[44px] items-center justify-center text-[#9ca3af] hover:text-[#f3f4f6]"
                aria-label="Clear pet search input"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex min-h-[44px] items-center px-3 text-xs font-medium transition-colors ${
                    isSelected
                      ? 'rounded-lg border border-[#ff6347]/40 bg-[#ff6347]/15 text-[#ff6347]'
                      : 'rounded-lg border border-[#23262d] bg-[#1a1c20] text-[#9ca3af] hover:text-[#f3f4f6]'
                  }`}
                  aria-pressed={isSelected}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {filteredPets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-[#9ca3af]">No mascots match your search</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('All')
                }}
                className="mt-3 flex min-h-[44px] items-center rounded-lg border border-[#23262d] bg-[#1a1c20] px-4 text-xs font-medium text-[#f3f4f6]"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6">
                {visiblePets.map((pet) => {
                  const isActive = pet.slug === currentActiveSlug
                  return (
                    <button
                      key={pet.slug}
                      type="button"
                      onClick={() => handleSelect(pet)}
                      className={`group relative flex min-h-[96px] w-full flex-col items-center justify-between rounded-xl border p-2 text-center transition-all ${
                        isActive
                          ? 'border-[#ff6347] bg-[#ff6347]/10 ring-1 ring-[#ff6347]'
                          : 'border-[#23262d] bg-[#1a1c20] hover:border-[#323640] hover:bg-[#23262d]/50'
                      }`}
                      aria-label={`Select ${pet.name} mascot`}
                    >
                      {isActive && (
                        <div className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#ff6347] text-[#090a0b]">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </div>
                      )}

                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden">
                        <PetSprite
                          slug={pet.slug}
                          name={pet.name}
                          spritesheetUrl={pet.spritesheetUrl}
                          state="idle"
                          scale={0.24}
                          className="pointer-events-none"
                        />
                      </div>

                      <div className="w-full">
                        <span className="block truncate text-[11px] font-medium text-[#f3f4f6]">
                          {pet.name}
                        </span>
                        <span className="block truncate text-[9px] text-[#9ca3af]">
                          {pet.category}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>

              {visibleCount < filteredPets.length && (
                <div className="mt-4 flex justify-center pb-4">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    className="flex min-h-[44px] w-full items-center justify-center rounded-xl border border-[#23262d] bg-[#1a1c20] px-4 text-xs font-medium text-[#f3f4f6] transition-colors hover:border-[#323640] active:bg-[#23262d]"
                  >
                    Load More Mascots ({filteredPets.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default PetPicker
