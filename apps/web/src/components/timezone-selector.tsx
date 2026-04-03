"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  detectBrowserTimezone,
  getTimezoneDisplayName,
  getTimezoneGroups,
} from "@/lib/timezone";

interface TimezoneSelectorProps {
  /** Current timezone value (IANA string). If not provided, auto-detects. */
  value?: string;
  /** Called when the user selects a different timezone. */
  onChange: (timezone: string) => void;
  /** Optional class name for the outer wrapper. */
  className?: string;
}

/**
 * Searchable timezone selector component.
 *
 * Displays the current timezone with a "Change" button. When clicked,
 * expands into a searchable dropdown of all IANA timezones grouped by
 * region.
 */
export function TimezoneSelector({
  value,
  onChange,
  className,
}: TimezoneSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedTimezone, setSelectedTimezone] = useState(
    () => value || detectBrowserTimezone()
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync external value changes
  useEffect(() => {
    if (value) setSelectedTimezone(value);
  }, [value]);

  // Focus the search input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const groups = useMemo(() => getTimezoneGroups(), []);

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups;
    const q = search.toLowerCase();
    return groups
      .map((group) => ({
        ...group,
        timezones: group.timezones.filter(
          (tz) =>
            tz.iana.toLowerCase().includes(q) ||
            tz.label.toLowerCase().includes(q) ||
            group.region.toLowerCase().includes(q)
        ),
      }))
      .filter((group) => group.timezones.length > 0);
  }, [groups, search]);

  const handleSelect = useCallback(
    (iana: string) => {
      setSelectedTimezone(iana);
      setIsOpen(false);
      setSearch("");
      onChange(iana);
    },
    [onChange]
  );

  const displayName = useMemo(
    () => getTimezoneDisplayName(selectedTimezone),
    [selectedTimezone]
  );

  if (!isOpen) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Your timezone:</span>
          <span className="font-medium">{displayName}</span>
          <span className="text-green-600" aria-label="Detected">
            &#10003;
          </span>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="text-primary hover:underline text-sm font-medium"
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className || ""}`} ref={dropdownRef}>
      <div className="flex items-center gap-2 text-sm mb-2">
        <span className="text-muted-foreground">Your timezone:</span>
        <span className="font-medium">{displayName}</span>
      </div>

      <div className="border border-border rounded-lg shadow-lg bg-background w-full max-w-md">
        {/* Search input */}
        <div className="p-2 border-b border-border">
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search timezones..."
            className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Timezone list */}
        <div className="max-h-64 overflow-y-auto p-1">
          {filteredGroups.length === 0 && (
            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
              No timezones match your search.
            </div>
          )}

          {filteredGroups.map((group) => (
            <div key={group.region}>
              <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {group.region}
              </div>
              {group.timezones.map((tz) => (
                <button
                  key={tz.iana}
                  type="button"
                  onClick={() => handleSelect(tz.iana)}
                  className={`w-full text-left px-3 py-1.5 text-sm rounded-md hover:bg-accent transition-colors ${
                    tz.iana === selectedTimezone
                      ? "bg-accent font-medium"
                      : ""
                  }`}
                >
                  {tz.label}
                  <span className="text-muted-foreground ml-1 text-xs">
                    {tz.iana}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Cancel */}
        <div className="p-2 border-t border-border">
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setSearch("");
            }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default TimezoneSelector;
