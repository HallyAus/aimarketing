"use client";

import { useState, useEffect } from "react";

export function ContactForm() {
  const [timezone, setTimezone] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setTimezone(tz);
    } catch {
      setTimezone("Unable to detect");
    }
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div
        className="glass rounded-2xl p-8 md:p-12 text-center"
        style={{ borderColor: "var(--border-primary)" }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{
            background: "rgba(59, 130, 246, 0.15)",
            color: "var(--accent-blue)",
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3
          className="text-xl font-semibold mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          Message sent
        </h3>
        <p style={{ color: "var(--text-secondary)" }}>
          We'll get back to you within 24 hours during your business hours.
        </p>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    background: "var(--bg-primary)",
    border: "1px solid var(--border-primary)",
    color: "var(--text-primary)",
    borderRadius: "0.5rem",
    padding: "0.75rem 1rem",
    width: "100%",
    fontSize: "0.875rem",
    outline: "none",
    transition: "border-color 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    color: "var(--text-secondary)",
    fontSize: "0.875rem",
    fontWeight: 500,
    marginBottom: "0.375rem",
    display: "block",
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="glass rounded-2xl p-8 md:p-12 space-y-6"
      style={{ borderColor: "var(--border-primary)" }}
    >
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" style={labelStyle}>
            Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            placeholder="Your name"
            style={inputStyle}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "var(--accent-blue)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "var(--border-primary)")
            }
          />
        </div>
        <div>
          <label htmlFor="email" style={labelStyle}>
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            placeholder="you@company.com"
            style={inputStyle}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "var(--accent-blue)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "var(--border-primary)")
            }
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="company" style={labelStyle}>
            Company
          </label>
          <input
            type="text"
            id="company"
            name="company"
            placeholder="Your company"
            style={inputStyle}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "var(--accent-blue)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "var(--border-primary)")
            }
          />
        </div>
        <div>
          <label htmlFor="plan" style={labelStyle}>
            Plan interest
          </label>
          <select id="plan" name="plan" style={inputStyle}>
            <option value="not-sure">Not sure yet</option>
            <option value="free">Free ($0/mo)</option>
            <option value="pro">Pro ($49/mo)</option>
            <option value="agency">Agency ($299/mo)</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="message" style={labelStyle}>
          Message *
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="How can we help?"
          style={inputStyle}
          onFocus={(e) =>
            (e.currentTarget.style.borderColor = "var(--accent-blue)")
          }
          onBlur={(e) =>
            (e.currentTarget.style.borderColor = "var(--border-primary)")
          }
        />
      </div>

      {timezone && (
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          Your timezone: <strong style={{ color: "var(--text-primary)" }}>{timezone}</strong>{" "}
          — we'll respond during your business hours.
        </p>
      )}

      <button
        type="submit"
        className="btn-cta w-full md:w-auto"
        style={{ display: "inline-flex" }}
      >
        Send Message
      </button>
    </form>
  );
}
