import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import "./update.css";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SPREADSHEET_ID = import.meta.env.VITE_SHEET_ID;
const SHEET_NAME = import.meta.env.VITE_SHEET_NAME || "Entries";
const START_DATE = import.meta.env.VITE_START_DATE || "2026-04-12";
const EMAIL_TO_NAME = JSON.parse(import.meta.env.VITE_EMAIL_TO_NAME || "{}");

const NAME_TO_COLUMN = {
  Alessio: "B",
  Andrea: "C",
  Francesco: "D",
  Jacopo: "E",
  Luca: "F",
};

const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

function localIsoToday() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseJwt(jwt) {
  const base64Url = jwt.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const json = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
      .join("")
  );
  return JSON.parse(json);
}

function daysBetween(startIso, endIso) {
  const start = new Date(`${startIso}T00:00:00Z`);
  const end = new Date(`${endIso}T00:00:00Z`);
  return Math.round((end - start) / 86400000);
}

function rangeFor(name, dateIso) {
  const col = NAME_TO_COLUMN[name];
  if (!col) throw new Error(`No column configured for ${name}`);
  const offset = daysBetween(START_DATE, dateIso);
  if (offset < 0) throw new Error("Selected date is before the spreadsheet start date.");
  const row = 2 + offset;
  return `${SHEET_NAME}!${col}${row}`;
}

async function writeValue({ accessToken, name, dateIso, value }) {
  const range = rangeFor(name, dateIso);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: [[Number(value)]] }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  return res.json();
}

function App() {
  const [googleReady, setGoogleReady] = useState(false);
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [count, setCount] = useState(0);
  const [dateIso, setDateIso] = useState(localIsoToday());
  const signInRef = useRef(null);

  const today = useMemo(() => localIsoToday(), []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (window.google?.accounts?.id) {
        window.clearInterval(timer);
        setGoogleReady(true);
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!googleReady || !signInRef.current) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        const payload = parseJwt(response.credential);
        setProfile(payload);
        setStatus("");
      },
      auto_select: false,
      ux_mode: "popup",
    });

    signInRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(signInRef.current, {
      theme: "outline",
      size: "large",
      shape: "pill",
      text: "signin_with",
      width: 260,
    });
  }, [googleReady]);

  const allowedName = profile?.email ? EMAIL_TO_NAME[profile.email] : null;
  const canSubmit = Boolean(profile && allowedName);

  async function getSheetsAccessToken() {
    if (accessToken) return accessToken;

    return new Promise((resolve, reject) => {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SHEETS_SCOPE,
        callback: (response) => {
          if (response.error) {
            reject(new Error(response.error));
            return;
          }
          setAccessToken(response.access_token);
          resolve(response.access_token);
        },
      });

      client.requestAccessToken({ prompt: "consent" });
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
  
    if (!canSubmit) {
      setStatus("This Google account is not allowed to edit the sheet.");
      return;
    }
  
    if (dateIso < START_DATE || dateIso > today) {
      setStatus(`Choose a date between ${START_DATE} and ${today}.`);
      return;
    }
  
    try {
      setSaving(true);
      setStatus("Requesting Google Sheets permission...");
      const accessToken = await getSheetsAccessToken();
  
      setStatus("Saving...");
      await writeValue({
        accessToken,
        name: allowedName,
        dateIso,
        value: count,
      });
  
      const webhookUrl = import.meta.env.VITE_MAKE_WEBHOOK_URL;
      if (webhookUrl) {
        setStatus("Saved. Sending WhatsApp notification...");
        const webhookRes = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            person: allowedName,
            date: dateIso,
            visits: count,
          }),
        });
  
        if (!webhookRes.ok) {
          const text = await webhookRes.text();
          throw new Error(`Webhook failed: ${webhookRes.status} ${text}`);
        }
      }
  
      setStatus(`Saved ${count} for ${allowedName} on ${dateIso}.`);
    } catch (err) {
      console.error(err);
      setStatus(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    window.google?.accounts?.id?.disableAutoSelect?.();
    setProfile(null);
    setAccessToken("");
    setStatus("");
  }

  return (
    <div className="page">
      <div className="card">
        <div className="eyebrow">Shit tracker</div>
        <h1>Update your own count</h1>
        <p className="lead">
          Sign in with the Google account that is allowed to edit your column, then save the number for any date.
        </p>

        <div className="block">
          {!profile ? (
            <>
              <div ref={signInRef} />
              <p className="hint">Only the five allowed Google accounts can submit values.</p>
            </>
          ) : (
            <div className="signed-in-box">
              <div>
                <div className="signed-in-label">Signed in as</div>
                <div className="signed-in-email">{profile.email}</div>
                <div className="signed-in-name">
                  {allowedName ? `Column unlocked: ${allowedName}` : "This account is not mapped to any column."}
                </div>
              </div>
              <button className="secondary-btn" onClick={handleLogout}>
                Sign out
              </button>
            </div>
          )}
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <label>
            <span>Date</span>
            <input
              type="date"
              min={START_DATE}
              max={today}
              value={dateIso}
              onChange={(e) => setDateIso(e.target.value)}
            />
          </label>

          <label>
            <span>Number of visits</span>
            <input
              type="number"
              min="0"
              max="20"
              step="1"
              value={count}
              onChange={(e) => setCount(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </label>

          <button className="primary-btn" type="submit" disabled={!canSubmit || saving}>
            {saving ? "Saving..." : "Save to Google Sheet"}
          </button>
        </form>

        {status && <div className="status">{status}</div>}

        <div className="notes">
          <p><strong>How the security works:</strong> the page only unlocks a person when the signed-in Google email matches the mapping in your config, and Google Sheets protected ranges enforce that each account can only edit its own column.</p>
          <p><strong>How the new day is created:</strong> column A should be an auto-generated date list in the sheet, so the page only writes into the correct row for the chosen day.</p>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
