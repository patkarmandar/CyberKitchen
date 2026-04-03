/* ════════════════════════════════════════════════════════════
   script.js - CyberKitchen shared utilities
   Include after Font Awesome and before page-specific script.
   Exposes: CK.theme, CK.status, CK.copy, CK.download, CK.share
   ════════════════════════════════════════════════════════════ */
var CK = (function () {
  'use strict';

  /* ── Internal helpers ─────────────────────────────────────── */
  var _statusTimer = null;
  var _themeKey    = 'ck-theme';   // override in page if needed: CK.theme.key = 'aes-theme'

  /* ── Theme ────────────────────────────────────────────────── */
  var theme = {
    key: 'ck-theme',
    load: function () {
      var t = localStorage.getItem(this.key) || 'light';
      document.documentElement.setAttribute('data-theme', t);
      this._applyIcon(t);
    },
    toggle: function () {
      var cur  = document.documentElement.getAttribute('data-theme');
      var next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem(this.key, next);
      this._applyIcon(next);
    },
    _applyIcon: function (t) {
      var ic = document.getElementById('themeIcon');
      if (ic) ic.className = t === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }
  };

  /* ── Status toast ─────────────────────────────────────────── */
  var status = {
    show: function (msg, type) {
      type = type || 'success';
      var s = document.getElementById('status');
      if (!s) return;
      s.textContent = msg;
      s.className   = 'status ' + type;
      s.style.display = 'block';
      clearTimeout(_statusTimer);
      _statusTimer = setTimeout(function () { s.style.display = 'none'; }, 3800);
    }
  };

  /* ── Clipboard ────────────────────────────────────────────── */
  var copy = {
    fromEl: function (id) {
      var el = document.getElementById(id);
      if (!el || !el.value) { status.show('Nothing to copy', 'warn'); return; }
      this._write(el.value);
    },
    raw: function (text) {
      if (!text) { status.show('Nothing to copy', 'warn'); return; }
      this._write(text);
    },
    _write: function (text) {
      var ok   = function () { status.show('Copied to clipboard', 'success'); };
      var fail = function () {
        try {
          var ta = document.createElement('textarea');
          ta.value = text;
          ta.style.cssText = 'position:fixed;top:-9999px;opacity:0';
          document.body.appendChild(ta);
          ta.focus(); ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          ok();
        } catch (e) { status.show('Copy failed', 'error'); }
      };
      if (navigator.clipboard && navigator.clipboard.writeText)
        navigator.clipboard.writeText(text).then(ok).catch(fail);
      else fail();
    }
  };

  /* ── Clear field ──────────────────────────────────────────── */
  function clearEl(id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
    status.show('Cleared', 'success');
  }

  /* ── Download ─────────────────────────────────────────────── */
  var download = {
    fromEl: function (id, filename) {
      var el = document.getElementById(id);
      if (!el || !el.value) { status.show('Nothing to save', 'warn'); return; }
      this._blob(el.value, filename);
    },
    raw: function (text, filename) {
      if (!text) { status.show('Nothing to save', 'warn'); return; }
      this._blob(text, filename);
    },
    _blob: function (text, filename) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
      a.download = filename || 'ck-export.txt';
      a.click();
      URL.revokeObjectURL(a.href);
      status.show('Download started', 'success');
    }
  };

  /* ── URL-safe Base64 (for Share URL) ──────────────────────── */
  var b64 = {
    encode: function (str) {
      var bytes = new TextEncoder().encode(str), bin = '';
      bytes.forEach(function (b) { bin += String.fromCharCode(b); });
      return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    },
    decode: function (str) {
      str = str.replace(/-/g, '+').replace(/_/g, '/');
      while (str.length % 4) str += '=';
      var bin = atob(str), arr = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return new TextDecoder().decode(arr);
    }
  };

  /* ── Share URL ────────────────────────────────────────────── */
  var share = {
    encode: b64.encode,
    decode: b64.decode,
    /** Build URL with state in hash and copy to clipboard */
    copyUrl: function (state) {
      try {
        var encoded = b64.encode(JSON.stringify(state));
        var url = window.location.href.split('#')[0] + '#s=' + encoded;
        copy._write(url);
        // override the "Copied" message
        setTimeout(function () { status.show('Share URL copied to clipboard', 'success'); }, 0);
      } catch (e) { status.show('Could not generate URL', 'error'); }
    },
    /** Parse state from current URL hash */
    load: function () {
      var hash = window.location.hash;
      if (!hash || hash.indexOf('s=') === -1) return null;
      try {
        var enc = new URLSearchParams(hash.slice(1)).get('s');
        return enc ? JSON.parse(b64.decode(enc)) : null;
      } catch (e) { console.warn('CK.share.load failed:', e); return null; }
    },
    /** Clear hash from URL without reload */
    clearHash: function () {
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    }
  };

  /* ── Global Ctrl+R → resetAll() shortcut ─────────────────── */
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') {
      if (typeof window.resetAll === 'function') {
        e.preventDefault();
        window.resetAll();
      }
    }
  });

  /* ── Public API ───────────────────────────────────────────── */
  return { theme: theme, status: status, copy: copy, clearEl: clearEl, download: download, share: share, b64: b64 };
})();
