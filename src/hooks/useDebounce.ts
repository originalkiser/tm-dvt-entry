import { useEffect, useRef } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDebounce<F extends (...args: any[]) => void>(fn: F, delay: number): F {
  const fnRef = useRef(fn)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { fnRef.current = fn }, [fn])

  const debounced = useRef((...args: Parameters<F>) => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => fnRef.current(...args), delay)
  })

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  return debounced.current as F
}
