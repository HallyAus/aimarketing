import { vi, beforeAll, afterAll, afterEach } from "vitest";
import { server } from "./mocks/server";

// ---------------------------------------------------------------------------
// Mock: next/navigation
// ---------------------------------------------------------------------------
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT: ${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

// ---------------------------------------------------------------------------
// Mock: next/headers
// ---------------------------------------------------------------------------
const mockCookieStore = {
  get: vi.fn(),
  getAll: vi.fn(() => []),
  set: vi.fn(),
  delete: vi.fn(),
  has: vi.fn(() => false),
};

const mockHeadersMap = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => mockCookieStore),
  headers: vi.fn(() => mockHeadersMap),
}));

// ---------------------------------------------------------------------------
// Mock: next/cache
// ---------------------------------------------------------------------------
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn(
    (fn: (...args: unknown[]) => unknown) =>
      (...args: unknown[]) =>
        fn(...args),
  ),
}));

// ---------------------------------------------------------------------------
// MSW server lifecycle
// ---------------------------------------------------------------------------
beforeAll(() => {
  server.listen({ onUnhandledRequest: "bypass" });
});

afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
  mockHeadersMap.clear();
});

afterAll(() => {
  server.close();
});

// ---------------------------------------------------------------------------
// Exports for test files that need direct access
// ---------------------------------------------------------------------------
export { mockRouter, mockCookieStore, mockHeadersMap };
