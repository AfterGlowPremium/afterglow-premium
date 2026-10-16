// Afterglow Real: forecast-gated weather drawn over the WebGL sky render. Same gates as the live app's sky animation:
//  rain/snow only if the forecast lists rain/snow in the event window; lightning only if lightning odds >= 25% (near its window);
//  fog only when forecast; rainbow only if rainbow odds >= 10% AND the slider time is inside the forecast rainbow window with the sun up.
//  Clouds come from HRRR/GOES in the sky shader itself. Nothing is invented.
(function (g) {
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  function conditions(ev, t, elev) {
    const WX = ev.wx || { items: [], bolt: { p: 0 }, wind: { mph: 0 } }, on = id => WX.items.some(x => x.id === id);
    const bp = WX.bolt.p || 0, bw = WX.bolt.win;
    const bolt = bp >= 25 && (!bw || (t >= bw.start - 1800 && t <= bw.end + 1800)) ? clamp(bp / 60, 0.4, 1) : 0;
    const rainIt = WX.items.find(x => x.id === "rain");
    const rain = rainIt ? clamp(0.25 + (WX.rain && WX.rain.mm || 0) / 4 + (WX.rain && WX.rain.pp || 0) / 300, 0.2, 1) : 0;
    const snow = on("snow") ? 0.7 : 0, fog = on("fog") ? 0.6 : 0;
    const bow = ev.bonus && ev.bonus.bow, bwin = bow && bow.win;
    const bowOn = !!(bow && bow.p >= 10 && bwin && t >= bwin.start && t <= bwin.end && elev > -0.3 && elev < 42);
    const bowA = bowOn ? clamp(Math.min(t - bwin.start, bwin.end - t) / 420) * clamp(0.35 + bow.p / 60) : 0;
    return { bolt, boltP: bp, rain, rainName: rainIt && rainIt.name, snow, fog, bow: bowA, bowP: bow ? bow.p : 0, red: bow && bow.red, wind: WX.wind && WX.wind.mph || 0 };
  }
  let drops = null;
  function draw(cv, C, t, now) {
    const W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, g.devicePixelRatio || 1);
    if (!W || !H) return;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const x = cv.getContext("2d"); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
    const hz = H * 0.6;
    // wind from the left or right of the view: cross-component sets which way rain leans; >40 mph → horizontal sheets
    const side = C.wdir != null && C.faceAz != null ? Math.sin(((C.wdir + 180) - C.faceAz) * Math.PI / 180) : -1;
    const slant = (side >= 0 ? 1 : -1) * (C.wind > 40 ? 6 : 0.1 + clamp(C.wind / 40) * 1.4);
    if (C.sea) sea(x, W, H, hz, C, now);
    if (C.torn) tornado(x, W, H, hz, now);
    if (C.fog) { const gr = x.createLinearGradient(0, hz - H * 0.3, 0, H); gr.addColorStop(0, "rgba(200,205,215,0)"); gr.addColorStop(0.5, `rgba(200,205,215,${0.45 * C.fog})`); gr.addColorStop(1, `rgba(190,195,205,${0.3 * C.fog})`); x.fillStyle = gr; x.fillRect(0, 0, W, H); }
    if (C.bolt) {   // storm cell + flicker; deterministic per minute of forecast time, plus a live flicker while it sits still
      const k = Math.floor(t / 60) + Math.floor(now / 2400), ph = now % 2400, a = (ph < 70 ? 1 : ph < 120 ? 0.25 : ph < 190 ? 0.75 : 0) * C.bolt;
      const gr = x.createRadialGradient(W * 0.16, hz - H * 0.25, 4, W * 0.16, hz - H * 0.25, W * 0.4); gr.addColorStop(0, "rgba(28,27,44,.75)"); gr.addColorStop(1, "rgba(28,27,44,0)"); x.fillStyle = gr; x.fillRect(0, 0, W, hz + 4);
      if (a > 0) {
        x.save(); x.fillStyle = `rgba(220,228,255,${0.22 * a})`; x.fillRect(0, 0, W, hz);
        let bx = W * (0.08 + 0.22 * (Math.sin(k * 91.7) * 0.5 + 0.5)), by = hz - H * 0.36;
        x.strokeStyle = `rgba(255,255,255,${a})`; x.lineWidth = 2; x.shadowColor = "#bcd0ff"; x.shadowBlur = 16; x.beginPath(); x.moveTo(bx, by);
        for (let s = 1; s <= 9; s++) { bx += Math.sin(k * 13.1 + s * 7.3) * W * 0.03; by += H * 0.36 / 9; x.lineTo(bx, by); }
        x.stroke(); x.restore();
      }
    }
    if (C.rain || C.snow) {
      const n = Math.round(60 + 240 * Math.max(C.rain, C.snow));
      if (!drops || drops.length !== n) drops = Array.from({ length: n }, (_, i) => [((i * 0.618) % 1), ((i * 0.377) % 1), 0.6 + ((i * 0.733) % 1) * 0.8]);
      const fall = ((t / 30) % 1 + 1) % 1 + now * (C.snow ? 0.00015 : 0.0008);
      x.save();
      if (C.snow) { x.fillStyle = "rgba(255,255,255,.75)"; for (const d of drops) { const y = ((d[1] + fall * d[2]) % 1) * H, xx = (((d[0] + slant * 0.2 * y / H) % 1) + 1) % 1 * W; x.beginPath(); x.arc(xx, y, 1 + d[2], 0, 6.283); x.fill(); } }
      else { x.strokeStyle = "rgba(205,215,232,.42)"; x.lineWidth = 1; x.beginPath();
        for (const d of drops) { const y = ((d[1] + fall * d[2]) % 1) * (H + 30) - 15, xx = (((d[0] + slant * 0.3 * y / H) % 1) + 1) % 1 * W, L = 9 + 13 * d[2]; x.moveTo(xx, y); x.lineTo(xx + slant * L, y + L); }
        x.stroke();
        const gr = x.createLinearGradient(0, hz - H * 0.22, 0, hz + 6); gr.addColorStop(0, "rgba(110,116,132,0)"); gr.addColorStop(1, `rgba(110,116,132,${0.3 * C.rain})`); x.fillStyle = gr; x.fillRect(0, hz - H * 0.22, W, H * 0.22 + 6); }
      x.restore();
    }
    if (C.bow > 0.01) {   // the bow is opposite the sun, i.e. behind someone facing the event: inset "look behind you" panel
      const pw = Math.min(W * 0.42, 190), ph = pw * 0.62, px = W - pw - 12, py = H * 0.2;
      x.save(); x.globalAlpha = clamp(C.bow * 1.4); x.fillStyle = "rgba(60,62,86,.85)"; x.strokeStyle = "rgba(255,255,255,.5)"; x.lineWidth = 1;
      x.beginPath(); x.roundRect ? x.roundRect(px, py, pw, ph, 10) : x.rect(px, py, pw, ph); x.fill(); x.stroke(); x.clip();
      const cols = C.red ? ["#ff4a3a", "#ff7a2a", "#ffae3a", "#ffd25a"] : ["#ff3b3b", "#ff8a1f", "#ffe14d", "#4fd05a", "#3fa0ff", "#6a4dff"], R = pw * 0.42, bw = R * 0.05;
      x.globalCompositeOperation = "lighter"; x.lineWidth = bw;
      cols.forEach((c, i) => { x.strokeStyle = c; x.beginPath(); x.arc(px + pw / 2, py + ph * 0.95, R - i * bw, Math.PI, 2 * Math.PI); x.stroke(); });
      x.globalCompositeOperation = "source-over"; x.globalAlpha = 1; x.fillStyle = "#fff"; x.font = "600 11px Inter,sans-serif"; x.textAlign = "center";
      x.fillText(`🌈 ${C.red ? "Red rainbow" : "Rainbow"} ${C.bowP}% · behind you`, px + pw / 2, py + 15); x.restore();
    }
  }
  // Surf/sea layer: wave rows scale with height; chop & ripple density with wind; offshore = smooth glassy faces that
  // stand up, pitch and barrel (spray blown back off the lip); combo swell = peaky A-frames; rows angle with swell dir.
  function sea(x, W, H, hz, C, now) {
    const S = C.sea, ft = clamp(S.ft, 0, 15), wind = C.wind || 0, chop = S.off ? clamp(wind / 40) * 0.25 : clamp(wind / 25);
    const rel = S.dir != null && C.faceAz != null ? Math.sin(((S.dir + 180) - C.faceAz) * Math.PI / 180) : 0;   // swell angle across view
    x.save();
    // ripples / chop with reflections broken up by it
    const n = Math.round(40 + 260 * chop);
    for (let i = 0; i < n; i++) { const yy = hz + 2 + Math.pow((i * 0.618) % 1, 1.6) * (H - hz), d = (yy - hz) / (H - hz), xx = (((i * 0.377 + now * 0.00002 * (1 + d)) % 1)) * W, L = (6 + 40 * d) * (0.4 + chop);
      x.strokeStyle = `rgba(255,255,255,${(0.05 + 0.12 * chop) * (0.4 + d)})`; x.lineWidth = 0.6 + d * 1.4; x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx + L, yy + L * 0.05 * rel); x.stroke(); }
    if (S.surf && ft >= 0.8) {
      const rows = 3, per = S.per || 8;
      for (let r = 0; r < rows; r++) {
        const ph = ((now / (per * 1000)) + r / rows) % 1, d = 0.25 + ph * 0.6, y = hz + (H - hz) * d, amp = ft * (4 + 26 * d) * (H / 800), tilt = rel * 40 * d;
        const g = x.createLinearGradient(0, y - amp, 0, y + amp * 0.3); g.addColorStop(0, `rgba(40,70,85,${0.0})`); g.addColorStop(0.55, `rgba(30,60,72,${0.55})`); g.addColorStop(1, `rgba(20,40,50,.0)`);
        x.fillStyle = g; x.beginPath(); x.moveTo(0, y + tilt);
        const peaks = S.combo ? 4 : 1;
        for (let k = 0; k <= 48; k++) { const u = k / 48, pk = S.combo ? Math.pow(Math.abs(Math.sin(u * Math.PI * peaks + r)), 3) : 0.75 + 0.25 * Math.sin(u * 6 + r);
          x.lineTo(u * W, y + tilt * (1 - 2 * u) - amp * pk); }
        x.lineTo(W, y + amp * 0.3); x.lineTo(0, y + amp * 0.3); x.closePath(); x.fill();
        // lip / whitewater: offshore → thin clean feathering lip + curling barrel shade; onshore → crumbly foam
        const br = ph > 0.55;
        x.strokeStyle = `rgba(245,250,255,${br ? (S.off ? 0.75 : 0.55) : 0.18})`; x.lineWidth = S.off ? 1.6 : 3 + chop * 4; x.beginPath();
        for (let k = 0; k <= 48; k++) { const u = k / 48, pk = S.combo ? Math.pow(Math.abs(Math.sin(u * Math.PI * peaks + r)), 3) : 0.75 + 0.25 * Math.sin(u * 6 + r), jit = S.off ? 0 : Math.sin(u * 90 + now * 0.004) * chop * 3;
          const yy = y + tilt * (1 - 2 * u) - amp * pk + jit; k ? x.lineTo(u * W, yy) : x.moveTo(u * W, yy); }
        x.stroke();
        if (br && S.off && ft >= 3) { const bx = ((r * 0.37 + ph) % 1) * W, bw = amp * 1.6; x.fillStyle = "rgba(8,22,30,.55)"; x.beginPath(); x.ellipse(bx, y - amp * 0.45, bw, amp * 0.42, 0, 0, Math.PI * 2); x.fill();
          x.fillStyle = "rgba(255,255,255,.25)"; for (let k = 0; k < 14; k++) x.fillRect(bx - bw + k * bw / 7, y - amp * (1.05 + 0.2 * Math.sin(k + now * 0.01)), 2, 1); }   // offshore spray off the lip
        if (br && !S.off) { x.fillStyle = `rgba(240,245,250,${0.25 + chop * 0.3})`; x.fillRect(0, y - amp * 0.2, W, amp * 0.35 * ph); }
      }
    }
    x.restore();
  }
  function tornado(x, W, H, hz, now) {   // NWS Tornado Warning only: rope/cone funnel under a dark wall cloud, debris at the ground
    const cx = W * 0.7 + Math.sin(now * 0.0004) * W * 0.03, top = hz - H * 0.42;
    let g = x.createRadialGradient(cx, top, 10, cx, top, W * 0.5); g.addColorStop(0, "rgba(30,32,38,.85)"); g.addColorStop(1, "rgba(30,32,38,0)"); x.fillStyle = g; x.fillRect(0, 0, W, hz);
    x.save();
    for (let i = 0; i < 60; i++) { const u = i / 60, y = top + u * (hz - top), w = (1 - u) * W * 0.07 + 3, sx = cx + Math.sin(u * 4 + now * 0.002) * W * 0.02 * u;
      x.fillStyle = `rgba(70,72,78,${0.5 + 0.3 * (1 - u)})`; x.fillRect(sx - w / 2, y, w, (hz - top) / 60 + 1); }
    for (let i = 0; i < 40; i++) { const a = i * 2.4 + now * 0.003, r = 10 + (i % 7) * 6; x.fillStyle = "rgba(90,80,70,.5)"; x.fillRect(cx + Math.cos(a) * r, hz - 4 - Math.abs(Math.sin(a)) * r * 0.6, 2, 2); }
    x.restore();
  }
  function label(C) {
    const t = [];
    if (C.rain) t.push(`🌧️ ${C.rainName || "Rain"} forecast`); if (C.snow) t.push("❄️ Snow forecast"); if (C.fog) t.push("🌫️ Fog forecast");
    if (C.bolt) t.push(`⚡ Lightning ${C.boltP}%`); if (C.torn) t.push("🌪 NWS Tornado Warning"); if (C.wind > 40 && C.rain) t.push(`💨 ${Math.round(C.wind)} mph — sideways rain`); if (C.sea && C.sea.ft >= 1) t.push(`🌊 ${C.sea.ft.toFixed(1)} ft${C.sea.off ? " · offshore, clean" : ""}${C.sea.combo ? " · combo swell, peaky" : ""}`); if (C.bow > 0.01) t.push(`🌈 Rainbow ${C.bowP}%`);
    return t.join(" · ");
  }
  g.Wx = { conditions, draw, label };
})(window);
