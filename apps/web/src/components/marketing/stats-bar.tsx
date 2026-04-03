"use client";

import { useEffect, useRef, useState } from "react";

const stats = [
  { value: 9, suffix: "", label: "Platforms" },
  { value: 10000, suffix: "+", label: "Posts Published" },
  { value: 30, suffix: "+", label: "Countries" },
  { value: 99.9, suffix: "%", label: "Uptime" },
];

function useCountUp(target: number, duration: number, trigger: boolean) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!trigger) return;

    let start = 0;
    const startTime = performance.now();
    const isFloat = target % 1 !== 0;

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      const val = eased * target;
      setCurrent(isFloat ? parseFloat(val.toFixed(1)) : Math.floor(val));
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCurrent(target);
      }
    }

    requestAnimationFrame(animate);
  }, [trigger, target, duration]);

  return current;
}

function StatItem({ value, suffix, label, trigger }: { value: number; suffix: string; label: string; trigger: boolean }) {
  const count = useCountUp(value, 2000, trigger);

  const formatNumber = (n: number) => {
    if (n >= 1000) {
      return n.toLocaleString("en-AU");
    }
    return n.toString();
  };

  return (
    <div className="flex flex-col items-center px-6 sm:px-10 py-6">
      <span
        className="text-3xl sm:text-4xl font-extrabold tabular-nums"
        style={{ color: "var(--text-primary)" }}
      >
        {formatNumber(count)}
        {suffix}
      </span>
      <span
        className="text-sm mt-1 font-medium"
        style={{ color: "var(--text-tertiary)" }}
      >
        {label}
      </span>
    </div>
  );
}

export function StatsBar() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="py-8 px-4"
      style={{
        background: "var(--bg-secondary)",
        borderTop: "1px solid var(--border-secondary)",
        borderBottom: "1px solid var(--border-secondary)",
      }}
    >
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="relative"
              style={{
                borderRight:
                  i < stats.length - 1
                    ? "1px solid var(--border-secondary)"
                    : "none",
              }}
            >
              <StatItem
                value={stat.value}
                suffix={stat.suffix}
                label={stat.label}
                trigger={visible}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
