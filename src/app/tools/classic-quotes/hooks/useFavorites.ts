import { useEffect, useState, useCallback } from 'react'

export function useFavorites(storageKey = 'classic_quotes_favs') {
  const [favIds, setFavIds] = useState<number[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) setFavIds(JSON.parse(raw))
    } catch {}
  }, [storageKey])

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(favIds)) } catch {}
  }, [favIds, storageKey])

  const isFav = useCallback((id: number) => favIds.includes(id), [favIds])
  const toggle = useCallback((id: number) => {
    setFavIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }, [])
  const clear = useCallback(() => setFavIds([]), [])

  return { favIds, isFav, toggle, clear }
}