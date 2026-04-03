#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------
# AdPilot pre-push check
# Runs lint, typecheck, tests, and build — reports pass/fail summary.
# ---------------------------------------------------------------------------

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

PASS="${GREEN}PASS${NC}"
FAIL="${RED}FAIL${NC}"
SKIP="${YELLOW}SKIP${NC}"

declare -a RESULTS=()
declare -a LABELS=()
EXIT_CODE=0

run_step() {
  local label="$1"
  shift
  LABELS+=("$label")
  printf "${CYAN}=> %s${NC}\n" "$label"
  if "$@" > /dev/null 2>&1; then
    RESULTS+=("pass")
  else
    RESULTS+=("fail")
    EXIT_CODE=1
  fi
}

echo ""
echo "${BOLD}========================================${NC}"
echo "${BOLD}  AdPilot Pre-Push Check${NC}"
echo "${BOLD}========================================${NC}"
echo ""

# 1 — Node version
run_step "Node version >= 20" node -e "process.exit(parseInt(process.version.slice(1)) >= 20 ? 0 : 1)"

# 2 — Prisma validate
run_step "Prisma validate" pnpm exec prisma validate --schema=packages/db/prisma/schema.prisma

# 3 — Prisma generate
run_step "Prisma generate" pnpm exec prisma generate --schema=packages/db/prisma/schema.prisma

# 4 — TypeScript check
run_step "TypeScript (tsc --noEmit)" pnpm -r run typecheck

# 5 — ESLint
run_step "ESLint" pnpm -r run lint

# 6 — Tests
run_step "Tests (vitest)" pnpm -r run test

# 7 — Build
run_step "Build" pnpm run build

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "${BOLD}========================================${NC}"
echo "${BOLD}  Summary${NC}"
echo "${BOLD}========================================${NC}"

for i in "${!LABELS[@]}"; do
  if [ "${RESULTS[$i]}" = "pass" ]; then
    printf "  %b  %s\n" "$PASS" "${LABELS[$i]}"
  else
    printf "  %b  %s\n" "$FAIL" "${LABELS[$i]}"
  fi
done

echo ""
if [ "$EXIT_CODE" -eq 0 ]; then
  printf "${GREEN}${BOLD}All checks passed.${NC}\n"
else
  printf "${RED}${BOLD}Some checks failed. Fix issues before pushing.${NC}\n"
fi
echo ""

exit "$EXIT_CODE"
