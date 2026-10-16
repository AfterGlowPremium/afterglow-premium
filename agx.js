// DRAFT extras: wave ≥3 ft icon (Open-Meteo Marine), NWS severe triangle + tornado flag (api.weather.gov),
// default-facing (water side) per spot, photo upload + feedback panel (localStorage, exportable).
(function (g) {
  const FACE_EAST = new Set(["hatteraslh","windmillpt","grandview","plumtree","capehenry","avalonpier","jennettes","frisco","buxton","avon",
    "ditchplains","rockaway","manasquan","narragansett","hamptonnh","ocmd","vb1st","sandbridge","sturns","wrightsville","folly","tybee","jaxpier","newsmyrna","sebastian","cocoa"]);
  const M = {}, AL = {};
  const SEV = /Tornado|Severe Thunderstorm|Hurricane|Tropical Storm|Storm Surge|Flash Flood|Extreme Wind|Hurricane Force Wind/;
  async function marine(spots) {
    const pts = spots.filter(s => s.water !== undefined);
    for (let i = 0; i < pts.length; i += 40) {
      const b = pts.slice(i, i + 40), p = new URLSearchParams({ latitude: b.map(s => s.lat).join(","), longitude: b.map(s => s.lng).join(","),
        hourly: "wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,wind_wave_height,wind_wave_direction,secondary_swell_wave_height,secondary_swell_wave_direction", forecast_days: "3", timezone: "America/New_York", length_unit: "imperial", cell_selection: "sea" });
      try { const r = await fetch("https://marine-api.open-meteo.com/v1/marine?" + p); if (!r.ok) continue; let j = await r.json(); if (!Array.isArray(j)) j = [j];
        j.forEach((d, k) => { const h = d.hourly; if (!h) return; const now = Date.now(), idx = Math.max(0, h.time.findIndex(t => Date.parse(t) >= now - 3600e3));
          const hs = h.wave_height.slice(idx, idx + 48).filter(x => x != null), max = hs.length ? Math.max(...hs) : null;
          M[b[k].id] = { max, now: h.wave_height[idx], dir: h.swell_wave_direction[idx] ?? h.wave_direction[idx], per: h.wave_period[idx], sw: h.swell_wave_height[idx], ww: h.wind_wave_height[idx], s2: h.secondary_swell_wave_height[idx], d2: h.secondary_swell_wave_direction[idx] }; });
      } catch (e) { console.warn("marine", e); }
    }
  }
  async function alerts(spots) {
    let q = 0; await Promise.all(spots.map(async s => { await new Promise(r => setTimeout(r, (q++) * 80));
      try { const r = await fetch(`https://api.weather.gov/alerts/active?point=${s.lat.toFixed(4)},${s.lng.toFixed(4)}`, { headers: { Accept: "application/geo+json" } }); if (!r.ok) return;
        const f = (await r.json()).features.map(x => x.properties).filter(p => SEV.test(p.event));
        AL[s.id] = f.length ? { events: [...new Set(f.map(p => p.event))], tornado: f.some(p => /Tornado Warning/.test(p.event)) } : null; } catch (e) {} }));
  }
  const offshore = (sp, wdir) => { const face = FACE_EAST.has(sp.id) ? 90 : (sp.arc ? (sp.arc[0] + sp.arc[1]) / 2 : 270); const d = Math.abs(((wdir - face + 540) % 360) - 180); return d > 120; };
  const X = g.AGX = {
    marine: M, alerts: AL,
    startTurned: (id, rise) => !rise && FACE_EAST.has(id),
    badges: sp => { let h = ""; const m = M[sp.id], a = AL[sp.id]; if (m && m.max >= 3) h += `<em class="pb wave" title="Waves to ${m.max.toFixed(1)} ft">🌊</em>`; if (a) h += `<em class="pb sev" title="${a.events.join(", ")}"></em>`; return h; },
    tip: sp => { const m = M[sp.id], a = AL[sp.id]; return (m && m.max != null ? `<br>🌊 Waves ${m.now != null ? m.now.toFixed(1) : "?"} ft now · up to ${m.max.toFixed(1)} ft / 48 h${m.per ? ` · ${Math.round(m.per)} s` : ""}` : "") + (a ? `<br><b style="color:#ff5a4a">▲ ${a.events.join(", ")}</b>` : ""); },
    sea: (sp, wind) => { const dq = new URLSearchParams(location.search).get("demo") || ""; if (/surf/.test(dq)) return { ft: 5, per: 11, dir: 75, combo: /combo/.test(dq), off: !/onshore/.test(dq), surf: true }; const m = M[sp.id] || {}; const wd = wind && wind.dir != null ? wind.dir : null;
      return { ft: m.now || 0, per: m.per || 8, dir: m.dir, combo: !!(m.s2 && m.s2 > 1 && m.d2 != null && m.dir != null && Math.abs(((m.d2 - m.dir + 540) % 360) - 180) > 25), off: wd != null && offshore(sp, wd), surf: FACE_EAST.has(sp.id) || sp.type === "Beach" || sp.type === "Pier" }; },
    async refresh(spots) { g.__agSpots = spots; await Promise.all([marine(spots), alerts(spots)]); g.__agRender && g.__agRender(); },
  };
  // ---- photo upload + feedback side panel ----
  const FK = "afterglow-feedback";
  const load = () => { try { return JSON.parse(localStorage.getItem(FK)) || [] } catch (e) { return [] } };
  function panel() {
    const sp = (g.__agSpots || []).find(s => s.id === g.__agSpot), items = load();
    let el = document.getElementById("fb-panel"); if (!el) { el = document.createElement("aside"); el.id = "fb-panel"; document.body.appendChild(el); }
    el.innerHTML = `<button class="fb-x" aria-label="Close">✕</button><h3>Photo & feedback</h3>
      <label>Location<select id="fb-spot">${(g.__agSpots || []).map(s => `<option value="${s.id}"${sp && s.id === sp.id ? " selected" : ""}>${s.name}, ${s.state}</option>`).join("")}</select></label>
      <label>How was it really? (0–100)<input id="fb-score" type="range" min="0" max="100" value="60"><output id="fb-o">60</output></label>
      <label>Forecast was<select id="fb-acc"><option>about right</option><option>too high</option><option>too low</option><option>wrong cloud type/placement</option></select></label>
      <label>Notes<textarea id="fb-note" rows="3" placeholder="e.g. cirrus lit up pink 10 min after sunset, water glassy"></textarea></label>
      <label class="fb-file">📷 Add photo<input id="fb-photo" type="file" accept="image/*" capture="environment"></label><img id="fb-prev" alt="" hidden>
      <button id="fb-save" class="btn">Save</button> <button id="fb-exp" class="btn ghost">Export all (${items.length})</button>
      <p class="fine">Saved on this phone for now. Draft plan: a daily job uploads these, pairs each with that day's forecast inputs, and re-fits the score weights.</p>`;
    let img = null; const $ = s => el.querySelector(s);
    $(".fb-x").onclick = () => el.classList.remove("open"); $("#fb-score").oninput = e => $("#fb-o").textContent = e.target.value;
    $("#fb-photo").onchange = e => { const f = e.target.files[0]; if (!f) return; const im = new Image(), r = new FileReader(); r.onload = () => { im.onload = () => { const c = document.createElement("canvas"), k = Math.min(1, 900 / Math.max(im.width, im.height)); c.width = im.width * k; c.height = im.height * k; c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); img = c.toDataURL("image/jpeg", 0.72); $("#fb-prev").src = img; $("#fb-prev").hidden = false; }; im.src = r.result; }; r.readAsDataURL(f); };
    $("#fb-save").onclick = () => { const a = load(); a.push({ at: new Date().toISOString(), mode: g.AG_MODE, spot: $("#fb-spot").value, actual: +$("#fb-score").value, acc: $("#fb-acc").value, note: $("#fb-note").value, photo: img });
      try { localStorage.setItem(FK, JSON.stringify(a)); $("#fb-save").textContent = "Saved ✓"; } catch (e) { a[a.length - 1].photo = null; localStorage.setItem(FK, JSON.stringify(a)); $("#fb-save").textContent = "Saved (photo too big for phone storage)"; } };
    $("#fb-exp").onclick = () => { const b = new Blob([JSON.stringify(load(), null, 1)], { type: "application/json" }), u = URL.createObjectURL(b), l = document.createElement("a"); l.href = u; l.download = "afterglow-feedback.json"; l.click(); };
    el.classList.add("open");
  }
  addEventListener("DOMContentLoaded", () => { const b = document.createElement("button"); b.id = "fb-tab"; b.textContent = "📷 Feedback"; b.onclick = panel; document.body.appendChild(b); });
  X.panel = panel;
})(window);
