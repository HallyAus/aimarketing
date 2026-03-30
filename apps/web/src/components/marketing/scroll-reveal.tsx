"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  /** CSS class applied before element is visible. Defaults to "reveal". */
  revealClass?: "reveal" | "reveal-left" | "reveal-right" | "reveal-scale";
  /** IntersectionObserver threshold (0-1). Defaults to 0.15. */
  threshold?: number;
  /** Root margin for early/late triggering. Defaults to "0px 0px -50px 0px". */
  rootMargin?: string;
  /** If true, animation only plays once. Defaults to true. */
  once?: boolean;
}

/**
 * IntersectionObserver wrapper that adds the "visible" class to its container
 * when scrolled into view, triggering the corresponding CSS reveal animation
 * defined in marketing.css.
 *
 * Usage:
 * ```tsx
 * <ScrollReveal>
 *   <h2 className="marketing-h2">Features</h2>
 * </ScrollReveal>
 *
 * <ScrollReveal revealClass="reveal-left" threshold={0.2}>
 *   <FeatureCard />
 * </ScrollReveal>
 * ```
 */
export function ScrollReveal({
  children,
  className = "",
  revealClass = "reveal",
  threshold = 0.15,
  rootMargin = "0px 0px -50px 0px",
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Respect user's reduced-motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      element.classList.add("visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            if (once) {
              observer.unobserve(entry.target);
            }
          } else if (!once) {
            entry.target.classList.remove("visible");
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, once]);

  return (
    <div ref={ref} className={`${revealClass} ${className}`.trim()}>
      {children}
    </div>
  );
}

/**
 * Wrapper that applies staggered fade-in to all direct children.
 * Uses the .stagger-in CSS class from marketing.css.
 *
 * Usage:
 * ```tsx
 * <StaggerReveal>
 *   <Card />
 *   <Card />
 *   <Card />
 * </StaggerReveal>
 * ```
 */
export function StaggerReveal({
  children,
  className = "",
  threshold = 0.1,
  rootMargin = "0px 0px -50px 0px",
}: {
  children: ReactNode;
  className?: string;
  threshold?: number;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      element.classList.add("visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("stagger-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
