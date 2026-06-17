import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const VISITOR_ID_KEY = 'portfolio_visitor_id';
const VISITOR_ID_ISSUED_AT_KEY = 'portfolio_visitor_id_issued_at';
const VISITOR_ID_TTL_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class VisitorService {
  private platformId = inject(PLATFORM_ID);

  get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  get isLocalhost(): boolean {
    if (!this.isBrowser) return false;
    const host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  }

  getVisitorId(): string {
    if (!this.isBrowser) return 'ssr';
    const existingId = localStorage.getItem(VISITOR_ID_KEY);
    const issuedAtRaw = localStorage.getItem(VISITOR_ID_ISSUED_AT_KEY);
    const issuedAt = issuedAtRaw ? parseInt(issuedAtRaw, 10) : 0;
    const expired = !issuedAt || Date.now() - issuedAt > VISITOR_ID_TTL_DAYS * MS_PER_DAY;
    if (existingId && !expired) return existingId;
    const id = crypto.randomUUID();
    localStorage.setItem(VISITOR_ID_KEY, id);
    localStorage.setItem(VISITOR_ID_ISSUED_AT_KEY, String(Date.now()));
    return id;
  }

  getDevice(): string {
    if (!this.isBrowser) return 'unknown';
    return navigator.maxTouchPoints > 0 ? 'touch' : 'mouse';
  }

  getBrowser(): string {
    if (!this.isBrowser) return 'unknown';
    const ua = navigator.userAgent;
    if (/Edg\//.test(ua))    return 'Edge';
    if (/Chrome\//.test(ua)) return 'Chrome';
    if (/Firefox\//.test(ua)) return 'Firefox';
    if (/Safari\//.test(ua)) return 'Safari';
    return 'Other';
  }

  getReferrer(): string {
    if (!this.isBrowser) return '';
    const ref = document.referrer;
    if (!ref) return 'direct';
    try {
      return new URL(ref).hostname;
    } catch {
      return ref;
    }
  }
}
