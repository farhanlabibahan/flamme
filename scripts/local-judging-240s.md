# Local judging — 240-second script

**Team Flamme · NASA Space Apps 2026 · Challenge 8: Flame in Freefall**
Target length: 3:55 to 4:00. Hard cap 4:00. Speak at a calm pace; the pauses in brackets are part of the story.

Presenters: [Name 1], [Name 2], [Name 3], [Name 4]. Every member appears by name in the opening.

---

## 0:00 – 0:25 · Hook: the flame that changes shape

**Visual:** Black screen. One candle flame, tall and yellow, on Earth. Cut to the same flame on the ISS: it shrinks into a small blue-tinged sphere, then flickers and goes out.

> "On Earth, a flame is tall and teardrop-shaped. Hot air rises, fresh oxygen rushes in, and the flame feeds itself.
> [pause]
> Take away gravity, and the same flame changes. On the International Space Station, it forms a sphere, starves for air, and sometimes goes out on its own.
> [pause]
> This is a flame in freefall. And if a fire starts in a spacecraft, nobody can walk out of it."

---

## 0:25 – 0:55 · Problem: the evidence is scattered

**Visual:** Four logos or source names appear one by one: drop towers, parabolic flights, ISS experiments, Cygnus. Then a spreadsheet with mismatched columns.

> "NASA has decades of microgravity combustion results. They sit in drop towers, parabolic flights, ISS experiments like FLEX and BASS-II, and the Saffire fires on the Cygnus cargo ship.
> [pause]
> But each test records its conditions differently. One gives oxygen but not pressure. Another leaves out the airflow. So two results can't be fairly compared, and nobody can easily see which conditions were tested, and which were never tried."

---

## 0:55 – 1:20 · Solution: what Flamme does

**Visual:** The Flamme home screen. Cursor types a plain-language question.

> "Team Flamme built Flamme. You describe a flame experiment in ten standard conditions. Flamme searches real NASA records against those conditions, shows where the evidence has gaps, and runs a machine-learning model trained on NASA test data.
> [pause]
> Everything on screen links back to its NASA source."

---

## 1:20 – 2:35 · Live demo: the flame changes, and the model answers

**Visual, scene 1 (Earth to orbit):** Full-screen Lab. Tall flame on the bench at normal gravity. Press the gravity toggle. The flame becomes a sphere.

> "Watch the same flame when we switch from Earth to orbit. Gravity off. The flame stops rising and becomes a sphere. Now we lower the oxygen."

**Visual, scene 2 (oxygen slider):** Drag oxygen from 21 percent down to 17 percent. Flame dims, then a status changes to "self-extinguishes."

> "At 21 percent oxygen, this flame keeps burning. At 17 percent, it goes out. That is the kind of boundary a spacecraft fire crew needs to know about before a fire starts."

**Visual, scene 3 (trained model card):** Scroll to the "Grounded in NASA FLEX data" card. Enter heptane, 14 percent oxygen, ISS pressure. Show the probability and the nearest real test with its PSI link.

> "This card is different. It is a real model, trained on 273 usable droplet flames from NASA's FLEX experiment on the ISS. For heptane at 14 percent oxygen, it predicts the flame will likely self-extinguish. The closest real test is right here, with its NASA source."

**Visual, scene 4 (the guardrail):** Set oxygen to 40 percent. The prediction is replaced by "outside the tested envelope."

> "Now push oxygen to 40 percent. The model refuses to answer. FLEX only tested up to 34 percent. A tool that quietly guesses outside its data is more dangerous than no tool at all. So Flamme stops."

---

## 2:35 – 3:15 · Impact: why this matters for crews

**Visual:** Three number cards appear, one at a time, each with its source name in the corner.

> "Here is what the evidence already says.
> [pause]
> One. Heptane droplet flames in 13 to 16 percent oxygen: 11 of 14 went out on their own before the fuel was used up. Source: FLEX on the ISS.
> [pause]
> Two. Acrylic rods burned in orbit at 17.5 percent oxygen, while on Earth they needed 19 percent. Flames also spread faster in microgravity. Source: BASS-II.
> [pause]
> Three. For fabric fires, a distant smoke detector alarmed within two to three and a half minutes. For acrylic fires, it took 17 to 27 minutes. Source: Saffire.
> [pause]
> And future spacecraft may use oxygen-enriched air, between 26.5 and 34 percent. In that air, plastics that self-extinguish on the ISS can keep burning. The safety margin we rely on today disappears."

---

## 3:15 – 3:45 · Validity: why you can trust it

**Visual:** The `/model` page. Show the AUC of 0.895 and R² of 0.582, and the sentence about the tested envelope.

> "We are honest about what the model can do. It was trained on 273 usable tests. Its classifier separates the two outcomes with an AUC of 0.895, and its burning-rate regression explains about 58 percent of the variation in the held-out test set.
> [pause]
> It is not a certifier. It does not approve a material, and it does not predict a spacecraft fire. Every number is traceable to its source. Judges can rerun the pipeline in our repository and get the same metrics."

---

## 3:45 – 4:00 · Close

**Visual:** Return to the single candle flame, now on the ISS. It burns steadily as a sphere.

> "A flame in freefall is not a safe flame. It is a flame we can finally understand, and that is what Flamme is for.
> [pause]
> We are Team Flamme, from the University of Dhaka. Thank you."

---

## Production notes

- **Under-18 rule:** no one under 18 appears on camera, in a recognisable voice, or by likeness. Use adult team members or hands only.
- **Astronaut shot:** use an illustration, or an adult team member in a generic suit with no real astronaut's face or name. Do not imply a specific NASA crew member is involved.
- **Attribution on camera:** name FLEX, BASS-II and Saffire out loud at least once each. This is what Relevance and NASA data usage score.
- **AI disclosure:** if you narrate with AI voice or generate the sphere animation, say so in the AI_USE document; it is not required on screen.
- **Not a NASA product:** keep the disclaimer on the final slide: "Team Flamme is not NASA and this is not NASA-endorsed."
- **Subtitles:** the local judging video does not need subtitles, but the 30-second global cut does (see `global-judging-30s.md`).
- **Rehearse offline:** the Lab and `/model` must work with Wi-Fi off. Pre-load the page and the `flexModel.json` before recording.
- **Check the date and format** with your Local Lead before the run-of-show is final.
