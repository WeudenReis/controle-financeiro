import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export function useAnimateOnLoad(
  selector: string,
  options?: {
    delay?: number
    stagger?: number
    duration?: number
    y?: number
    opacity?: boolean
  }
) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    const elements = ref.current.querySelectorAll(selector)
    if (elements.length === 0) return

    gsap.from(elements, {
      y: options?.y ?? 30,
      opacity: options?.opacity !== false ? 0 : 1,
      duration: options?.duration ?? 0.6,
      stagger: options?.stagger ?? 0.1,
      delay: options?.delay ?? 0,
      ease: 'power3.out',
    })
  }, [selector, options])

  return ref
}

export function useCounterAnimation(target: number, duration: number = 2) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    const counter = { value: 0 }
    gsap.to(counter, {
      value: target,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        if (ref.current) {
          ref.current.textContent = counter.value.toFixed(2)
        }
      },
    })
  }, [target, duration])

  return ref
}
