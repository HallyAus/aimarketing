/**
 * NOTE: This test requires @testing-library/react and @testing-library/jest-dom.
 * Install them if not yet present:
 *   pnpm add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PricingSection } from "@/components/marketing/pricing-section";

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
describe("PricingSection", () => {
  it("renders without crashing", () => {
    render(<PricingSection />);
    expect(screen.getByText("Pricing")).toBeDefined();
  });

  it("renders exactly three pricing tiers", () => {
    render(<PricingSection />);

    expect(screen.getByText("Free")).toBeDefined();
    expect(screen.getByText("Pro")).toBeDefined();
    expect(screen.getByText("Agency")).toBeDefined();
  });

  it("displays tier descriptions", () => {
    render(<PricingSection />);

    expect(screen.getByText("Perfect for getting started")).toBeDefined();
    expect(screen.getByText("For growing teams and agencies")).toBeDefined();
    expect(screen.getByText("For large teams and enterprises")).toBeDefined();
  });

  it("displays CTA buttons for each tier", () => {
    render(<PricingSection />);

    expect(screen.getByText("Start Free")).toBeDefined();
    expect(screen.getByText("Start Pro Trial")).toBeDefined();
    expect(screen.getByText("Contact Sales")).toBeDefined();
  });

  // -------------------------------------------------------------------------
  // Pricing display
  // -------------------------------------------------------------------------
  describe("pricing display", () => {
    it("shows monthly prices by default", () => {
      render(<PricingSection />);

      // Free = $0, Pro = $49, Agency = $299
      expect(screen.getByText("$0")).toBeDefined();
      expect(screen.getByText("$49")).toBeDefined();
      expect(screen.getByText("$299")).toBeDefined();
    });

    it("shows /mo suffix on prices", () => {
      render(<PricingSection />);

      const moLabels = screen.getAllByText("/mo");
      expect(moLabels.length).toBe(3);
    });
  });

  // -------------------------------------------------------------------------
  // Monthly / Annual toggle
  // -------------------------------------------------------------------------
  describe("monthly/annual toggle", () => {
    it("shows Monthly and Annual labels", () => {
      render(<PricingSection />);

      expect(screen.getByText("Monthly")).toBeDefined();
      expect(screen.getByText("Annual")).toBeDefined();
    });

    it("switches to annual prices when toggle is clicked", () => {
      render(<PricingSection />);

      const toggle = screen.getByLabelText("Toggle annual pricing");
      fireEvent.click(toggle);

      // Annual prices: Free = $0, Pro = $39, Agency = $239
      expect(screen.getByText("$0")).toBeDefined();
      expect(screen.getByText("$39")).toBeDefined();
      expect(screen.getByText("$239")).toBeDefined();
    });

    it('shows "Save 20%" badge when annual is selected', () => {
      render(<PricingSection />);

      // Should not be visible initially
      expect(screen.queryByText("Save 20%")).toBeNull();

      const toggle = screen.getByLabelText("Toggle annual pricing");
      fireEvent.click(toggle);

      expect(screen.getByText("Save 20%")).toBeDefined();
    });

    it("shows crossed-out monthly price when annual is selected", () => {
      render(<PricingSection />);

      const toggle = screen.getByLabelText("Toggle annual pricing");
      fireEvent.click(toggle);

      // Should show original monthly prices with strikethrough for paid tiers
      expect(screen.getByText("$49/mo")).toBeDefined();
      expect(screen.getByText("$299/mo")).toBeDefined();
    });

    it("toggles back to monthly prices on second click", () => {
      render(<PricingSection />);

      const toggle = screen.getByLabelText("Toggle annual pricing");
      fireEvent.click(toggle); // to annual
      fireEvent.click(toggle); // back to monthly

      expect(screen.getByText("$49")).toBeDefined();
      expect(screen.getByText("$299")).toBeDefined();
      expect(screen.queryByText("Save 20%")).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Free tier specifics
  // -------------------------------------------------------------------------
  describe("Free tier", () => {
    it('shows "No credit card required" note', () => {
      render(<PricingSection />);

      expect(screen.getByText("No credit card required")).toBeDefined();
    });

    it("shows included features with check marks", () => {
      render(<PricingSection />);

      expect(screen.getByText("1 user")).toBeDefined();
      expect(screen.getByText("3 platforms")).toBeDefined();
      expect(screen.getByText("30 posts per month")).toBeDefined();
    });

    it("shows excluded features", () => {
      render(<PricingSection />);

      expect(screen.getByText("AI content generation")).toBeDefined();
      expect(screen.getByText("API access")).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // Pro tier specifics
  // -------------------------------------------------------------------------
  describe("Pro tier", () => {
    it('shows "Recommended" badge', () => {
      render(<PricingSection />);

      expect(screen.getByText("Recommended")).toBeDefined();
    });

    it("lists Pro features", () => {
      render(<PricingSection />);

      expect(screen.getByText("5 users")).toBeDefined();
      expect(screen.getByText("AI Content Studio")).toBeDefined();
      expect(screen.getByText("Advanced analytics")).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // Agency tier specifics
  // -------------------------------------------------------------------------
  describe("Agency tier", () => {
    it("lists Agency features", () => {
      render(<PricingSection />);

      expect(screen.getByText("Unlimited users")).toBeDefined();
      expect(screen.getByText("White-label reports")).toBeDefined();
      expect(screen.getByText("Full API access")).toBeDefined();
      expect(screen.getByText("SSO & audit trails")).toBeDefined();
    });
  });
});
