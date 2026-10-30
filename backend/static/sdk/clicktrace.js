/**
 * ClickTrace JavaScript Tracking SDK (Lightweight, Safe, Resilient)
 * Auto-captures clicks, navigation, scroll milestones, and form metadata.
 * Never collects sensitive values, passwords, or PII.
 */
(function () {
  'use strict';

  // Prevent multiple initializations
  if (window.__CLICKTRACE_LOADED__) return;
  window.__CLICKTRACE_LOADED__ = true;

  // Locate the script tag to extract configuration
  var currentScript = document.currentScript || (function () {
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].src && scripts[i].src.indexOf('clicktrace') !== -1) {
        return scripts[i];
      }
    }
    return null;
  })();

  var projectId = (currentScript && currentScript.getAttribute('data-project-id')) || 'demo-project';
  var endpoint = '';

  if (currentScript && currentScript.src) {
    try {
      var url = new URL(currentScript.src);
      endpoint = url.origin;
    } catch (e) {
      endpoint = window.location.origin;
    }
  } else {
    endpoint = window.location.origin;
  }

  var API_URL = endpoint + '/api/events';

  // Session ID management (persisted in sessionStorage)
  var SESSION_KEY = 'clicktrace_session_id';
  function getSessionId() {
    try {
      var sid = window.sessionStorage.getItem(SESSION_KEY);
      if (!sid) {
        sid = 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
        window.sessionStorage.setItem(SESSION_KEY, sid);
      }
      return sid;
    } catch (e) {
      return 'sess_fallback_' + Date.now();
    }
  }

  var sessionId = getSessionId();

  // Event queue and throttling
  var eventQueue = [];
  var flushTimer = null;
  var BATCH_INTERVAL_MS = 1500;
  var MAX_BATCH_SIZE = 25;

  function flushEvents() {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    if (eventQueue.length === 0) return;

    var payload = eventQueue.splice(0, MAX_BATCH_SIZE);
    var body = JSON.stringify({
      project_id: projectId,
      events: payload
    });

    try {
      if (navigator.sendBeacon) {
        var blob = new Blob([body], { type: 'application/json' });
        var sent = navigator.sendBeacon(API_URL, blob);
        if (!sent) {
          sendWithFetch(body);
        }
      } else {
        sendWithFetch(body);
      }
    } catch (err) {
      sendWithFetch(body);
    }
  }

  function sendWithFetch(body) {
    try {
      fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body,
        keepalive: true
      }).catch(function () {
        // Silently fail if backend is offline to not break host site
      });
    } catch (e) {}
  }

  function scheduleFlush() {
    if (!flushTimer) {
      flushTimer = setTimeout(flushEvents, BATCH_INTERVAL_MS);
    }
    if (eventQueue.length >= MAX_BATCH_SIZE) {
      flushEvents();
    }
  }

  function pushEvent(eventType, data) {
    try {
      var evt = {
        session_id: sessionId,
        event_type: eventType,
        page_url: window.location.pathname + window.location.search,
        timestamp: new Date().toISOString(),
        viewport_width: window.innerWidth || document.documentElement.clientWidth || 0,
        viewport_height: window.innerHeight || document.documentElement.clientHeight || 0,
        element_tag: data.element_tag || null,
        element_id: data.element_id || null,
        element_text: data.element_text || null,
        click_x: typeof data.click_x === 'number' ? Math.round(data.click_x) : null,
        click_y: typeof data.click_y === 'number' ? Math.round(data.click_y) : null,
        scroll_depth: typeof data.scroll_depth === 'number' ? data.scroll_depth : null,
        metadata_json: data.metadata ? JSON.stringify(data.metadata) : null
      };
      eventQueue.push(evt);
      scheduleFlush();
    } catch (e) {
      // Safe guard against errors
    }
  }

  // Sanitizer: strip private/sensitive info and limit text length
  function sanitizeText(elem) {
    if (!elem) return '';
    // Skip inputs, passwords, credit cards
    var tag = elem.tagName ? elem.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select') {
      var inputType = (elem.type || '').toLowerCase();
      if (inputType === 'password' || inputType === 'hidden') return '[REDACTED]';
      return (elem.name || elem.id || inputType) ? '[' + tag + ':' + (elem.name || elem.id || inputType) + ']' : '';
    }
    var text = (elem.innerText || elem.textContent || '').trim();
    // Check for obvious sensitive words
    if (/password|cvv|creditcard|pin|secret|auth/i.test(text)) {
      return '[REDACTED]';
    }
    return text.substring(0, 50).replace(/\s+/g, ' ');
  }

  function getElementId(elem) {
    if (!elem) return null;
    if (elem.id) return elem.id;
    if (elem.getAttribute && elem.getAttribute('data-ct-id')) return elem.getAttribute('data-ct-id');
    // Helpful identifier fallback
    var tag = elem.tagName ? elem.tagName.toLowerCase() : '';
    var cls = elem.className && typeof elem.className === 'string' ? '.' + elem.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    return tag + cls;
  }

  // --- A. Clicks and Repeated Click tracking ---
  document.addEventListener('click', function (e) {
    try {
      var target = e.target;
      if (!target) return;

      // Find closest actionable or meaningful element
      var actionable = target.closest('button, a, input, select, textarea, [role="button"], form, h1, h2, h3, card, .btn') || target;

      var tag = actionable.tagName ? actionable.tagName.toLowerCase() : 'unknown';
      var id = getElementId(actionable);
      var text = sanitizeText(actionable);

      var clickX = e.pageX || (e.clientX + (window.scrollX || window.pageXOffset || 0));
      var clickY = e.pageY || (e.clientY + (window.scrollY || window.pageYOffset || 0));

      pushEvent('click', {
        element_tag: tag,
        element_id: id,
        element_text: text,
        click_x: clickX,
        click_y: clickY,
        metadata: {
          client_x: e.clientX,
          client_y: e.clientY,
          class_names: actionable.className ? String(actionable.className).substring(0, 100) : ''
        }
      });
    } catch (err) {}
  }, true);

  // --- B. Navigation tracking ---
  function trackNavigation(type) {
    pushEvent('navigation', {
      element_tag: 'window',
      element_id: type || 'page_load',
      element_text: document.title ? document.title.substring(0, 60) : '',
      metadata: {
        referrer: document.referrer || '',
        title: document.title || '',
        nav_type: type || 'direct'
      }
    });
  }

  // Initial page load navigation
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    trackNavigation('initial_load');
  } else {
    window.addEventListener('DOMContentLoaded', function () {
      trackNavigation('dom_ready');
    });
  }

  // Single-Page Application (SPA) navigation hooks
  var originalPushState = history.pushState;
  if (originalPushState) {
    history.pushState = function () {
      var res = originalPushState.apply(this, arguments);
      setTimeout(function () {
        trackNavigation('pushState');
        resetScrollMilestones();
      }, 50);
      return res;
    };
  }
  window.addEventListener('popstate', function () {
    trackNavigation('popstate');
    resetScrollMilestones();
  });

  // --- C. Scroll depth milestones (25%, 50%, 75%, 100%) ---
  var reachedMilestones = {};
  function resetScrollMilestones() {
    reachedMilestones = { 25: false, 50: false, 75: false, 100: false };
  }
  resetScrollMilestones();

  var scrollThrottleTimer = null;
  function checkScrollDepth() {
    try {
      var docHeight = Math.max(
        document.body.scrollHeight, document.documentElement.scrollHeight,
        document.body.offsetHeight, document.documentElement.offsetHeight,
        document.body.clientHeight, document.documentElement.clientHeight
      );
      var winHeight = window.innerHeight || document.documentElement.clientHeight;
      var scrollTop = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      
      var scrollable = docHeight - winHeight;
      var percentage = 100;
      if (scrollable > 0) {
        percentage = Math.min(100, Math.round(((scrollTop + winHeight) / docHeight) * 100));
      }

      var milestones = [25, 50, 75, 100];
      for (var i = 0; i < milestones.length; i++) {
        var m = milestones[i];
        if (percentage >= m && !reachedMilestones[m]) {
          reachedMilestones[m] = true;
          pushEvent('scroll', {
            element_tag: 'window',
            element_id: 'scroll_' + m + 'pct',
            scroll_depth: m,
            metadata: {
              depth_percentage: m,
              scroll_top: Math.round(scrollTop),
              doc_height: docHeight
            }
          });
        }
      }
    } catch (e) {}
  }

  window.addEventListener('scroll', function () {
    if (!scrollThrottleTimer) {
      scrollThrottleTimer = setTimeout(function () {
        scrollThrottleTimer = null;
        checkScrollDepth();
      }, 250);
    }
  }, { passive: true });

  // --- D. Form interaction tracking (Safe metadata only) ---
  var trackedForms = new WeakMap();

  function getFormInfo(form) {
    var formId = form.id || form.name || ('form_' + (form.getAttribute('action') || 'unnamed'));
    var fields = form.querySelectorAll('input:not([type=hidden]):not([type=submit]), select, textarea');
    return {
      formId: formId,
      fieldCount: fields.length
    };
  }

  document.addEventListener('focusin', function (e) {
    try {
      var target = e.target;
      if (!target || !target.form) return;
      var form = target.form;
      var info = getFormInfo(form);

      var state = trackedForms.get(form) || { started: false, touchedFields: 0 };
      if (!state.started) {
        state.started = true;
        state.touchedFields = 1;
        trackedForms.set(form, state);

        pushEvent('form_start', {
          element_tag: 'form',
          element_id: info.formId,
          element_text: 'Form interaction initiated',
          metadata: {
            field_count: info.fieldCount,
            first_field_type: target.type || target.tagName.toLowerCase()
          }
        });
      } else {
        state.touchedFields++;
        trackedForms.set(form, state);
      }
    } catch (err) {}
  }, true);

  document.addEventListener('submit', function (e) {
    try {
      var form = e.target;
      if (!form || form.tagName.toLowerCase() !== 'form') return;
      var info = getFormInfo(form);
      var state = trackedForms.get(form) || { started: true, touchedFields: 1 };

      pushEvent('form_submit', {
        element_tag: 'form',
        element_id: info.formId,
        element_text: 'Form submission attempt',
        metadata: {
          field_count: info.fieldCount,
          touched_count: state.touchedFields
        }
      });
    } catch (err) {}
  }, true);

  // Window unload flush
  window.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      flushEvents();
    }
  });
  window.addEventListener('beforeunload', function () {
    flushEvents();
  });

  // Global helper on window for demo and instrumented conversions
  window.ClickTrace = {
    projectId: projectId,
    sessionId: sessionId,
    trackEvent: function (type, data) {
      pushEvent(type, data || {});
    },
    trackConversion: function (funnelStep, meta) {
      pushEvent('conversion', {
        element_tag: 'conversion',
        element_id: funnelStep || 'goal_completed',
        element_text: 'Successful conversion reached',
        metadata: meta || {}
      });
      flushEvents();
    },
    flush: flushEvents
  };

  // Perform initial scroll check once loaded
  setTimeout(checkScrollDepth, 500);
})();
