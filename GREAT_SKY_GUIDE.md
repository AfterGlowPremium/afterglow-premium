# Afterglow — What Makes a Great Sunrise or Sunset (judging guide, draft)
Based on /workspace/research/sunset_metric_bible.md. Use it to check whether a score, and the rendered colors and cloud texture, look right for the sun angle.

## 1. The core recipe
1. **A clear path for the light.** The 100–300 km toward the sun (west at sunset, east at sunrise) needs to be mostly clear, *especially of low cloud*. A low deck on the horizon blocks the light, and the show is over.
2. **A canvas overhead.** Mid and high cloud (altocumulus, cirrus, cirrostratus edges), about 20–60% cover, broken and textured. These clouds catch the sun after it has set at ground level.
3. **Clean-to-lightly-hazy air.** A little fine aerosol (AOD about 0.1–0.25) deepens oranges and reds. Heavy smoke or haze (AOD above 0.4) mutes everything to a dull red disk. Very clean, post-front air gives vivid but cooler pinks and purples.
4. **Moderate humidity at cloud level, drier near the ground.** Humid air near the surface turns the scene milky.
5. **Water calm enough to reflect it.** Wind under about 5 mph gives a glassy mirror that doubles the color. 5–12 mph breaks the reflection into streaks. Above 15 mph whitecaps scatter it.

## 2. Cloud type, height, and when each one lights up
| Cloud | Height | Lights up | Color and texture to expect |
|---|---|---|---|
| Cumulus / stratocumulus (low) | under 6,500 ft | From sun about 5° up until just after sunset | Gold rims, gray bases. They fade first. Best when scattered and NOT on the horizon toward the sun. |
| Altocumulus (mid) | 6,500–20,000 ft | From about 0 to −4° (up to ~15 min after sunset) | "Mackerel" puffs turn orange, then salmon pink. Each puff has a lit underside and a darker top. |
| Altostratus (mid, sheet) | 6,500–20,000 ft | Briefly | Uniform orange wash. Pretty, but flat texture. |
| Cirrus / cirrocumulus (high) | above 20,000 ft | From about −2 to −6° (15–30 min after sunset) | Thin fibrous streaks or ripples go gold, then hot pink and magenta, and are last to fade. This is the classic "sky on fire". Sun dogs form here when the sun is under ~20° up. |
| Cirrostratus | above 20,000 ft | Sun up | Halo and sun dogs. Turns a pale pink veil at twilight. |
| Cumulonimbus anvil | tops 35–50k ft | Late | Towering pink/orange anvil from far away. Lightning and possible rainbow opposite the sun. |

**Rule of thumb for sun angle vs. color:** while the sun is high, clouds are white or gold. At 0° the low cloud is orange. Below 0°, only clouds high enough to still see the sun get lit, so the color climbs from low to mid to high cloud, shifting orange → red → pink → magenta → purple-gray. Undersides light first, because the light comes from *below* once the sun is down.

## 3. Judging examples (what the score and the picture should look like)
| # | Setup | Expected score | The render should show |
|---|---|---|---|
| A | 40% cirrus overhead, clear western horizon, AOD 0.15, wind 3 mph (e.g. Cape Charles, fall) | 85–95 "Epic" | Fibrous pink/magenta streaks 10–25 min after sunset, glassy mirror reflection, gold sun path. |
| B | Scattered altocumulus, clear horizon, wind 8 mph | 70–85 "Great" | Orange-to-salmon puffs with lit undersides; a streaky, rippled reflection. |
| C | Low overcast stratus deck to the west | 5–20 "Poor" | Gray dimming, no color, no sun disk. |
| D | Clear blue sky, no clouds | 30–45 "Fair" | A clean orange horizon band and a purple Belt of Venus opposite, but no cloud color. |
| E | Thick smoke (AOD 0.6) | 25–40 | Dull red disk you can look at, brownish horizon, muted clouds. |
| F | Clearing storm line to the east at sunset, sun out in the west | 75–95 plus a rainbow | Bright anvil and a rainbow *behind you* (180° Turn), possible lightning, wet sheen on the water. Trifecta candidate. |
| G | 25 mph onshore wind, 4 ft surf (Jennette's Pier) | Color can be great, water poor | Whitecaps, crumbly whitewater, no mirror. A 🌊 icon on the map. |
| H | Offshore W wind 10 mph, 4 ft NE swell (S-Turns sunrise) | Color and water both great | Clean groomed faces, spray blown off the lips, barrels, a gold path broken by the wave rows. |

## 4. Water
- **Glassy (under 5 mph):** a mirror image of the clouds, with soft long-period swell lines.
- **Rippled (5–12 mph):** a long, streaky sun glitter path. Reflections break into vertical bars.
- **Choppy (above 15 mph):** whitecaps, and the reflections are gone. More fetch (open bay or ocean) means bigger chop than a creek or marsh.
- **Surf:** offshore wind gives clean faces and barrels. Onshore wind gives crumbly, mushy waves. Two swells from different directions give peaky A-frames.

## 5. Accuracy checks for the renderings
- Cloud type, height, and amount at event time must match the HRRR/GFS low/mid/high cover, cross-checked against GOES visible and cirrus imagery for today. Future days are labeled ESTIMATED.
- The geography must match the real horizon for the direction you're facing (water vs. land, landmarks like the Cape Hatteras or Cape Henry lighthouses).
- Weather is drawn only when it's forecast. A tornado is drawn only during an active NWS Tornado Warning.

## 6. Learning from your feedback (planned, not built)
Each feedback entry (spot, date, your 0–100 score, a note, a photo) is exported now. Planned daily job: pair each entry with that day's saved forecast inputs, fit score weights (cloud tiers, AOD, horizon clearance, wind) by minimizing the error against your scores, then publish a new `weights.json` that the app loads. It needs no secrets in the app itself. Uploads would go through a small server endpoint with its own key, kept server-side.
