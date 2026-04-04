import { encrypt, decrypt } from "@reachpilot/shared";

const EXPIRY_BUFFER_MS = 5 * 60 * 1000; // 5 minutes
const PROACTIVE_REFRESH_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export class TokenManager {
  constructor(private masterKey: string) {}

  encryptToken(plaintext: string): string {
    return encrypt(plaintext, this.masterKey);
  }

  decryptToken(ciphertext: string): string {
    return decrypt(ciphertext, this.masterKey);
  }

  /** Returns true if token is expired or expiring within 5 minutes */
  isTokenExpiring(expiresAt: Date | null | undefined): boolean {
    if (!expiresAt) return false;
    return expiresAt.getTime() - Date.now() < EXPIRY_BUFFER_MS;
  }

  /** Returns true if token should be proactively refreshed (within 7 days) */
  shouldProactivelyRefresh(expiresAt: Date | null | undefined): boolean {
    if (!expiresAt) return false;
    return expiresAt.getTime() - Date.now() < PROACTIVE_REFRESH_MS;
  }
}
