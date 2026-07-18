(function () {
    'use strict';

    var cfg = window.CALC_CONFIG;
    if (!cfg) {
        console.warn('[analytics] window.CALC_CONFIG missing — config.js did not load');
        return;
    }
    if (!window.supabase || !window.supabase.createClient) {
        console.warn('[analytics] window.supabase missing — Supabase UMD bundle did not load (extension blocked the CDN?)');
        return;
    }

    // ── Localhost short-circuit ───────────────────────────────────────────────
    var host = window.location.hostname;
    var isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === '::1';

    // ── Consent state ─────────────────────────────────────────────────────────
    // Tracking only fires when consent === 'accepted'. While consent is null
    // (banner still showing), events queue up and flush on accept.
    var CONSENT_KEY = 'calc_analytics_consent';
    function getConsent() {
        try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
    }

    // ── Visitor identity ──────────────────────────────────────────────────────
    var VISITOR_ID_KEY        = 'calc_visitor_id';
    var VISITOR_ID_ISSUED_KEY = 'calc_visitor_id_issued_at';
    var VISITOR_ID_TTL_MS     = 30 * 24 * 60 * 60 * 1000; // 30 days

    function getVisitorId() {
        try {
            var existing = localStorage.getItem(VISITOR_ID_KEY);
            var issuedRaw = localStorage.getItem(VISITOR_ID_ISSUED_KEY);
            var issued = issuedRaw ? parseInt(issuedRaw, 10) : 0;
            var expired = !issued || Date.now() - issued > VISITOR_ID_TTL_MS;
            if (existing && !expired) return existing;
            var id = (crypto.randomUUID && crypto.randomUUID()) || ('v_' + Math.random().toString(36).slice(2) + Date.now().toString(36));
            localStorage.setItem(VISITOR_ID_KEY, id);
            localStorage.setItem(VISITOR_ID_ISSUED_KEY, String(Date.now()));
            return id;
        } catch (e) {
            return 'anon';
        }
    }

    function getDevice() {
        return navigator.maxTouchPoints > 0 ? 'touch' : 'mouse';
    }

    function getBrowser() {
        var ua = navigator.userAgent;
        if (/Edg\//.test(ua))     return 'Edge';
        if (/Chrome\//.test(ua))  return 'Chrome';
        if (/Firefox\//.test(ua)) return 'Firefox';
        if (/Safari\//.test(ua))  return 'Safari';
        return 'Other';
    }

    function getReferrer() {
        var ref = document.referrer;
        if (!ref) return 'direct';
        try { return new URL(ref).hostname; } catch (_) { return ref; }
    }

    // ── Supabase client (only configured once consent is known) ──────────────
    var client = null;
    function ensureClient() {
        if (!client) {
            client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
                auth: { persistSession: false, autoRefreshToken: false },
            });
        }
        return client;
    }

    // pageBase is built lazily — we don't want to mint a visitor_id until
    // the user has accepted analytics. That way 'declined' visitors never
    // get a UUID written to their localStorage.
    var pageBase = null;
    function ensurePageBase() {
        if (!pageBase) {
            pageBase = {
                visitor_id: getVisitorId(),
                page:       window.location.pathname,
                referrer:   getReferrer(),
                device:     getDevice(),
                browser:    getBrowser(),
            };
        }
        return pageBase;
    }

    // ── Event queue ──────────────────────────────────────────────────────────
    // Events that arrive before consent is granted go into pendingEvents and
    // get flushed on accept. Events that arrive after a 'declined' choice are
    // dropped silently.
    var pendingEvents = [];

    function send(eventType, extras) {
        var row = Object.assign({}, ensurePageBase(), { event_type: eventType }, extras || {});
        ensureClient().from(cfg.EVENT_TABLE).insert(row).then(
            function (res) {
                if (res && res.error) {
                    console.error('[analytics] insert failed for ' + eventType + ':', res.error);
                }
            },
            function (err) {
                console.error('[analytics] insert threw for ' + eventType + ':', err);
            }
        );
    }

    function track(eventType, extras) {
        if (isLocalhost) {
            console.info('[analytics] skipped on localhost:', eventType);
            return;
        }
        var consent = getConsent();
        if (consent === 'declined') return;
        if (consent === 'accepted') {
            send(eventType, extras);
        } else {
            // Consent undecided — buffer for later
            pendingEvents.push({ eventType: eventType, extras: extras });
        }
    }

    // ── Once-per-session guard for "first time" events ────────────────────────
    var firedOnce = {};
    function trackOnce(eventType, extras) {
        if (firedOnce[eventType]) return;
        firedOnce[eventType] = true;
        track(eventType, extras);
    }

    // ── Consent change listener: flush queue on accept, clear it on decline ──
    window.addEventListener('calc:consent', function (e) {
        var v = e && e.detail;
        if (v === 'accepted') {
            var q = pendingEvents.slice();
            pendingEvents = [];
            q.forEach(function (item) { send(item.eventType, item.extras); });
        } else if (v === 'declined') {
            pendingEvents = [];
        }
    });

    // ── Page view (auto, may be queued) ──────────────────────────────────────
    var pageStart = Date.now();
    track('page_view');

    function trackExit() {
        if (isLocalhost || firedOnce.page_exit) return;
        firedOnce.page_exit = true;
        if (getConsent() !== 'accepted') return;
        var duration = Math.round((Date.now() - pageStart) / 1000);
        // Supabase REST requires apikey/Authorization headers, so navigator.sendBeacon
        // can't be used. The client uses fetch with keepalive, which modern browsers
        // honor on unload.
        send('page_exit', { duration_seconds: duration });
    }
    window.addEventListener('pagehide', trackExit);
    window.addEventListener('beforeunload', trackExit);

    // ── Public API for index.html to call ─────────────────────────────────────
    window.CalcAnalytics = {
        track: track,
        trackOnce: trackOnce,
        scenarioSaved: function (name, inputs) {
            track('scenario_saved', { label: name, payload: inputs });
        },
        insightFocused: function (insightName) {
            // One row per insight per session — avoid spamming on every hover
            var key = 'insight_focused:' + insightName;
            if (firedOnce[key]) return;
            firedOnce[key] = true;
            track('insight_focused', { label: insightName });
        },
        mobileSheetOpened: function () {
            track('mobile_sheet_opened');
        },
        calculation: function () {
            track('calculation');
        },
        coastFiUsed: function (yearlySpend) {
            trackOnce('coast_fi_used', { payload: { yearly_spend: yearlySpend } });
        },
    };
})();
