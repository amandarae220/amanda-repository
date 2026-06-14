import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const VISITOR_ID_KEY = 'portfolio_visitor_id';

@Injectable({ providedIn: 'root' })
export class VisitorService {
  private platformId = inject(PLATFORM_ID);

  get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  getVisitorId(): string {
    if (!this.isBrowser) return 'ssr';
    let id = localStorage.getItem(VISITOR_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_ID_KEY, id);
    }
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
