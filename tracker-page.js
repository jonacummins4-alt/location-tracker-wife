// Sign-in for the location tracker pages. No Supabase key lives here.
// The page sets window.TRACKER_PERSON to "jon" or "amy" before this file loads.
(function () {
  var PERSON = window.TRACKER_PERSON;
  var API_URL = "https://otnugbbtasbrcjqghvga.supabase.co/functions/v1/tracker-api";
  var TOKEN_KEY = "lt_session";

  function rootEl() { return document.getElementById("root"); }

  function hideApp() {
    var root = rootEl();
    if (root) root.style.display = "none";
  }

  function showApp() {
    var root = rootEl();
    if (root) root.style.display = "";
    var gate = document.getElementById("tracker-gate");
    if (gate) gate.remove();
  }

  hideApp();

  function friendly(err) {
    if (!err || err.status === 401) return "";
    if (!err.status || err.message === "Failed to fetch") return "Could not reach the tracker. Check the connection and try again.";
    return err.message || "Could not reach the tracker.";
  }

  function getToken() { return localStorage.getItem(TOKEN_KEY) || ""; }

  function setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
  }

  window.trackerSignOut = function () {
    localStorage.removeItem(TOKEN_KEY);
    window.showTrackerGate("");
  };

  window.api = async function (action, body) {
    var headers = { "Content-Type": "application/json" };
    var token = getToken();
    if (token) headers.Authorization = "Bearer " + token;
    var res = await fetch(API_URL, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(Object.assign({ action: action, person: PERSON }, body || {})),
    });
    var text = await res.text();
    var data = {};
    try { data = text ? JSON.parse(text) : {}; } catch (e) { data = { error: "Unexpected response." }; }
    if (data.token) setToken(data.token);
    if (!res.ok) {
      if (res.status === 401) localStorage.removeItem(TOKEN_KEY);
      var err = new Error(data.error || "Request failed");
      err.status = res.status;
      throw err;
    }
    return data;
  };

  function el(tag, css, text) {
    var node = document.createElement(tag);
    if (css) node.style.cssText = css;
    if (text != null) node.textContent = text;
    return node;
  }

  window.showTrackerGate = function (message) {
    hideApp();
    var existing = document.getElementById("tracker-gate");
    if (existing) existing.remove();
    var box = el("div", "font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;background:#0a0f1e;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;");
    box.id = "tracker-gate";
    var card = el("div", "background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:36px 28px 28px;width:100%;max-width:380px;text-align:center;");
    card.appendChild(el("div", "font-size:42px;margin-bottom:16px;", "\u{1F4CD}"));
    card.appendChild(el("h1", "font-size:21px;font-weight:700;color:#f8fafc;margin:0 0 6px;", "Location Tracker"));
    card.appendChild(el("p", "font-size:13px;color:#94a3b8;margin:0 0 18px;line-height:1.5;", "We'll email a sign-in code to the address saved for this tracker."));
    var status = el("p", "font-size:12px;color:#f87171;margin:0 0 12px;min-height:18px;", message || "");
    card.appendChild(status);
    var send = el("button", "width:100%;padding:13px;border-radius:12px;background:linear-gradient(135deg,#1e40af,#6366f1);color:#fff;font-size:15px;font-weight:700;border:none;cursor:pointer;margin-bottom:14px;");
    send.type = "button";
    send.textContent = "Email me a sign-in code";
    var code = el("input", "width:100%;box-sizing:border-box;font-size:20px;letter-spacing:0.3em;text-align:center;padding:12px 14px;border-radius:12px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.06);color:#e2e8f0;outline:none;margin-bottom:12px;");
    code.type = "text";
    code.inputMode = "numeric";
    code.autocomplete = "one-time-code";
    code.maxLength = 6;
    code.placeholder = "123456";
    code.setAttribute("aria-label", "Sign-in code");
    var unlock = el("button", "width:100%;padding:13px;border-radius:12px;background:linear-gradient(135deg,#1e40af,#6366f1);color:#fff;font-size:15px;font-weight:700;border:none;cursor:pointer;");
    unlock.type = "button";
    unlock.textContent = "Sign in";
    card.appendChild(send);
    card.appendChild(code);
    card.appendChild(unlock);
    box.appendChild(card);
    document.body.appendChild(box);

    send.onclick = async function () {
      send.disabled = true;
      status.style.color = "#94a3b8";
      status.textContent = "Sending…";
      try {
        var data = await window.api("request-code");
        status.style.color = "#34d399";
        status.textContent = "Sent to " + (data.masked || "the saved address") + ". Enter the code.";
        code.focus();
      } catch (e) {
        status.style.color = "#f87171";
        status.textContent = friendly(e) || "Could not send the code.";
      } finally {
        send.disabled = false;
      }
    };

    async function tryCode() {
      unlock.disabled = true;
      status.style.color = "#94a3b8";
      status.textContent = "Checking…";
      try {
        await window.api("verify-code", { code: code.value.trim() });
        showApp();
        if (typeof window.init === "function") window.init();
      } catch (e) {
        status.style.color = "#f87171";
        status.textContent = friendly(e) || "That code is not valid.";
        code.focus();
      } finally {
        unlock.disabled = false;
      }
    }
    unlock.onclick = tryCode;
    code.onkeydown = function (event) { if (event.key === "Enter") tryCode(); };
  };

  window.ensureTrackerSession = async function () {
    if (!getToken()) {
      window.showTrackerGate("");
      return false;
    }
    try {
      await window.api("session");
      showApp();
      return true;
    } catch (e) {
      window.showTrackerGate(friendly(e));
      return false;
    }
  };
})();
