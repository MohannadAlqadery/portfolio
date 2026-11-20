import { useEffect, useState } from 'react'
import { subscribeToRoute } from '@/lib/router'

/**
 * Id of the section currently crossing the middle band of the viewport, or `null` above the first
 * one (near the top of the page). Falls back to `null` where IntersectionObserver is unavailable.
 *
 * The elements are collected again after every route change: the site header stays mounted
 * across pages, so after a visit to the notes it must watch the home page's *new* sections, not
 * the detached ones from before (which left the label stuck on an old section).
 */
export function useActiveSection(ids: readonly string[]): string | null {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return

    let elements: HTMLElement[] = []
    const inBand = new Set<string>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) inBand.add(entry.target.id)
          else inBand.delete(entry.target.id)
        }
        // The last section (in page order) touching the band wins.
        const current = [...elements].reverse().find((el) => inBand.has(el.id))
        if (current) {
          setActive(current.id)
          return
        }
        // Nothing in the band: above the first section means "no section yet"; anywhere else
        // (the footer, a gap) keeps the last one, so the label doesn't flicker.
        const first = elements[0]
        if (!first || first.getBoundingClientRect().top > window.innerHeight * 0.4) setActive(null)
      },
      // A thin band just above the vertical centre decides which section is "current".
      { rootMargin: '-40% 0px -55% 0px' },
    )

    const collect = () => {
      observer.disconnect()
      inBand.clear()
      elements = ids
        .map((id) => document.getElementById(id))
        .filter((el): el is HTMLElement => el !== null)
      elements.forEach((el) => observer.observe(el))
    }
    collect()

    // After a route change, wait a frame for the new page to be in the DOM, then re-collect.
    let frame = 0
    const unsubscribe = subscribeToRoute(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(collect)
      })
    })

    return () => {
      cancelAnimationFrame(frame)
      unsubscribe()
      observer.disconnect()
    }
  }, [ids])

  return active
}
