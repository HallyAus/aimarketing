#!/bin/bash
# Stripe Product & Price Seeding Script
#
# Creates ReachPilot Free/Pro/Agency products with monthly and annual prices.
# Idempotent — safe to run multiple times.
#
# Usage:
#   STRIPE_SECRET_KEY=sk_test_xxx ./scripts/seed-stripe.sh
#
# Or load from .env:
#   source .env && ./scripts/seed-stripe.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

if [ -z "${STRIPE_SECRET_KEY:-}" ]; then
  echo "Error: STRIPE_SECRET_KEY is not set."
  echo "Usage: STRIPE_SECRET_KEY=sk_test_xxx $0"
  exit 1
fi

cd "$PROJECT_ROOT"
exec npx tsx scripts/seed-stripe.ts
