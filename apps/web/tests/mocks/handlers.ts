import { http, HttpResponse } from "msw";

// ---------------------------------------------------------------------------
// Stripe API handlers
// ---------------------------------------------------------------------------
const stripeHandlers = [
  http.post("https://api.stripe.com/v1/customers", () => {
    return HttpResponse.json({
      id: "cus_test_123",
      object: "customer",
      email: "test@example.com",
      name: "Test Customer",
      created: Math.floor(Date.now() / 1000),
      livemode: false,
    });
  }),

  http.post("https://api.stripe.com/v1/subscriptions", () => {
    return HttpResponse.json({
      id: "sub_test_123",
      object: "subscription",
      customer: "cus_test_123",
      status: "active",
      items: {
        data: [
          {
            id: "si_test_123",
            price: { id: "price_test_123", unit_amount: 2900, currency: "usd" },
          },
        ],
      },
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400,
    });
  }),

  http.get("https://api.stripe.com/v1/invoices", () => {
    return HttpResponse.json({
      object: "list",
      data: [
        {
          id: "in_test_123",
          object: "invoice",
          customer: "cus_test_123",
          status: "paid",
          amount_due: 2900,
          amount_paid: 2900,
          currency: "usd",
          created: Math.floor(Date.now() / 1000),
        },
      ],
      has_more: false,
    });
  }),
];

// ---------------------------------------------------------------------------
// Anthropic API handlers
// ---------------------------------------------------------------------------
const anthropicHandlers = [
  http.post("https://api.anthropic.com/v1/messages", () => {
    return HttpResponse.json({
      id: "msg_test_123",
      type: "message",
      role: "assistant",
      model: "claude-sonnet-4-20250514",
      content: [
        {
          type: "text",
          text: "This is a test response from the mock Anthropic API.",
        },
      ],
      stop_reason: "end_turn",
      usage: { input_tokens: 25, output_tokens: 50 },
    });
  }),
];

// ---------------------------------------------------------------------------
// Facebook Graph API handlers
// ---------------------------------------------------------------------------
const facebookHandlers = [
  http.post("https://graph.facebook.com/:pageId/feed", ({ params }) => {
    const { pageId } = params;
    return HttpResponse.json({
      id: `${pageId}_post_test_123`,
    });
  }),

  http.get("https://graph.facebook.com/:pageId/posts", ({ params }) => {
    const { pageId } = params;
    return HttpResponse.json({
      data: [
        {
          id: `${pageId}_post_1`,
          message: "Test post content",
          created_time: new Date().toISOString(),
        },
        {
          id: `${pageId}_post_2`,
          message: "Another test post",
          created_time: new Date().toISOString(),
        },
      ],
      paging: {
        cursors: { before: "cursor_before", after: "cursor_after" },
        next: null,
      },
    });
  }),
];

// ---------------------------------------------------------------------------
// Combined handlers
// ---------------------------------------------------------------------------
export const handlers = [
  ...stripeHandlers,
  ...anthropicHandlers,
  ...facebookHandlers,
];
