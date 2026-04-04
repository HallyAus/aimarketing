# ADR-005: AES-256-GCM for OAuth Token Encryption

**Date:** 2026-03-15
**Status:** Accepted

## Context

ReachPilot stores OAuth access tokens and refresh tokens for up to 9 social platforms per organization. These tokens grant publishing and analytics read access to user accounts. A database breach exposing plaintext tokens would allow an attacker to post content and read analytics on behalf of every connected account.

We needed application-level encryption that:

- Provides both confidentiality and integrity (authenticated encryption)
- Uses a widely reviewed, standards-based algorithm
- Works with Node.js built-in `crypto` module (no additional dependencies)
- Produces ciphertext storable in a standard Prisma `String` column

## Decision

Use **AES-256-GCM** (authenticated encryption with associated data) implemented in `packages/shared/src/encryption.ts`.

The implementation:

1. Generates a random 12-byte IV per encryption operation
2. Encrypts with AES-256-GCM using the `MASTER_ENCRYPTION_KEY` environment variable (64-char hex = 32 bytes)
3. Appends the 16-byte GCM authentication tag
4. Base64-encodes the concatenation of `IV + ciphertext + authTag` for storage

Format: `base64(iv[12] || ciphertext[n] || authTag[16])`

Encrypted fields in the database:
- `PlatformConnection.accessToken`
- `PlatformConnection.refreshToken`
- `Page.accessToken`

Decryption happens at the point of use (publishing, analytics sync, token refresh) and never in API response serialization.

## Consequences

**Benefits:**

- GCM mode provides integrity verification; tampered ciphertext is detected and rejected.
- Random IV per operation means identical plaintext tokens produce different ciphertext.
- Zero additional dependencies; uses Node.js built-in `crypto` module.
- Base64 encoding fits cleanly in Prisma `String` columns.

**Trade-offs:**

- Single `MASTER_ENCRYPTION_KEY` is a single point of compromise; key rotation requires re-encrypting all tokens.
- No key versioning yet; a future ADR should address envelope encryption or key rotation.
- Encryption/decryption adds ~0.1ms latency per operation.

## Alternatives Considered

| Alternative | Reason Rejected |
|---|---|
| **Database-level encryption (pgcrypto)** | Decryption happens at the DB layer, meaning DB access = token access; application-level is more secure |
| **AWS KMS / GCP KMS** | Adds cloud vendor dependency; self-hosted Proxmox deployment cannot rely on cloud KMS |
| **libsodium (secretbox)** | Requires native addon; AES-256-GCM via Node.js crypto is sufficient and dependency-free |
| **AES-256-CBC** | No built-in integrity checking; GCM is strictly superior for authenticated encryption |
