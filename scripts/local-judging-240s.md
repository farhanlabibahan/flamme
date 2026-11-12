# Local judging — 240-second script

**Team Flamme · NASA Space Apps 2026 · Challenge 8: Flame in Freefall**
Target: about 3:50. Hard cap 4:00. Speak slowly and confidently. Bracketed notes are for the editor and the team, not for the voiceover.

**Cue key**
- **[VISUAL]** what is on screen
- **[MOTION]** motion-graphics or animation to build
- **[WEB]** screen recording of the Flamme website
- **[B-ROLL]** extra footage to cut in under the voice
- **[SFX / MUSIC]** sound

**Presenters:** [Name 1], [Name 2], [Name 3], [Name 4]. Everyone is named in the opening.

---

## SCENE 1 · The hook (0:00 – 0:25)

**[VISUAL]** Black screen. One candle flame on Earth: tall, yellow, teardrop-shaped.
**[MOTION]** The flame lifts off a wick and drifts. It shrinks into a small glowing sphere, then flickers and goes out.
**[B-ROLL]** Real ISS footage of a crew member at a window, shot wide, no face needed.
**[SFX / MUSIC]** Low pulse under the voice. Silence on the word "out".

> "On Earth, a flame is tall. In space, it becomes a ball of light.
> [pause]
> And sometimes, it just goes out.
> [pause]
> If that happens on a spacecraft, there is nowhere to walk to. We built something to make sure the crew knows about it before it happens."

---

## SCENE 2 · The problem (0:25 – 0:55)

**[VISUAL]** Four source logos appear one by one: drop towers, parabolic flights, ISS experiments, Cygnus cargo ship.
**[MOTION]** The four logos merge into one messy spreadsheet. Columns jitter out of line.
**[B-ROLL]** Close-up of a real lab test. Keep it short.

> "NASA has decades of fire research. Experiments on the ISS. Fires on a cargo ship. Drop towers on the ground.
> [pause]
> But every test writes its results differently. One records the oxygen but not the pressure. Another leaves out the airflow.
> [pause]
> So you cannot compare them. Most people never see the gaps at all."

---

## SCENE 3 · What we built (0:55 – 1:20)

**[VISUAL]** Our Flamme homepage, loaded at full screen.
**[WEB]** Scroll slowly down the home page. Pause on the title line.
**[MOTION]** Three glowing labels float in, one at a time: "Lab", "Evidence", "Ask".

> "This is Flamme. We took those scattered results and put them in one place. You describe a fire in plain words. Flamme finds the real NASA tests that match, shows where the evidence is missing, and runs a model we trained on NASA data.
> [pause]
> Every number links back to its source."

---

## SCENE 4 · The live demo (1:20 – 2:35)

This is the most important part. Show, do not explain.

### 4a · Earth to orbit (1:20 – 1:40)

**[WEB]** Open the Lab. A tall flame sits in a glass chamber at normal gravity.
**[MOTION]** Click the gravity switch. The flame loses its tail and turns into a sphere. Add a soft glow ring.
**[SFX / MUSIC]** A whoosh on the switch, then a quiet hum.

> "Here is the same flame, on Earth. Now we switch gravity off. The flame stops rising. It becomes a sphere."

### 4b · Lower the oxygen (1:40 – 2:00)

**[WEB]** Drag the oxygen slider from 21 percent down to 17 percent.
**[MOTION]** The flame dims. A status badge changes from "Burning" to "Goes out on its own".
**[SFX / MUSIC]** The music drops out for half a second when the flame goes out.

> "At 21 percent oxygen, it keeps burning. Drop to 17, and it goes out. That line is exactly what a crew needs to know."

### 4c · The trained model (2:00 – 2:20)

**[WEB]** Scroll to the card "Grounded in NASA FLEX data". Choose heptane, 14 percent oxygen, ISS pressure.
**[MOTION]** A probability bar fills to a high number. A card slides in with the closest real NASA test, with its source link.
**[B-ROLL]** Short shot of a real droplet flame test from the NASA FLEX experiment, if you can cite the source.

> "This card is different. It runs a real model, trained on 273 real droplet flames from NASA's FLEX experiment on the ISS. For this setup, it says the flame will likely go out. And here is the real test it is based on."

### 4d · The guardrail (2:20 – 2:35)

**[WEB]** Push oxygen to 40 percent. The prediction is replaced by a clear box: "Outside the tested range".
**[MOTION]** The box shakes once, then holds still.

> "Now push to 40 percent. The model says no. It was never tested there. Most tools guess. Ours tells you when it does not know."

---

## SCENE 5 · Why this matters (2:35 – 3:05)

**[VISUAL]** Three big number cards, one at a time. Each has its source tag in the corner.
**[MOTION]** Each card flips in, the number counts up, the source tag slides under it.
**[B-ROLL]** Cut-in of a smoke detector on a cabin wall, under the third card only.

> "Here is what the evidence already shows.
> [pause]
> Card one. In heptane flames at 13 to 16 percent oxygen, eleven out of fourteen went out on their own. [Source: FLEX]
> [pause]
> Card two. Acrylic rods burned in orbit at 17.5 percent oxygen. On Earth they needed 19. [Source: BASS-II]
> [pause]
> Card three. For some plastic fires, the smoke alarm took up to 27 minutes to sound. [Source: Saffire]
> [pause]
> And future spacecraft may use richer oxygen. In that air, materials that stop burning on the ISS can keep going."

---

## SCENE 6 · Why you can trust it (3:05 – 3:25)

**[WEB]** Open the Model page. Highlight the two numbers: AUC 0.895 and R² 0.582.
**[MOTION]** A simple checkmark stamp appears beside each number. A "source" line underlines the page.
**[B-ROLL]** Screen recording of the repository, scrolling the README and the ML folder.

> "We trained it on 273 real tests and checked it on tests it had never seen. Every result is traceable. Judges can run the same pipeline in our repository and get the same numbers."

---

## SCENE 7 · The ask and the close (3:25 – 3:50)

**[VISUAL]** The sphere flame from the opening returns. This time it burns steadily on the ISS.
**[MOTION]** The flame grows, then the Flamme logo wipes in across the bottom.
**[SFX / MUSIC]** Music builds to one clear note and holds.

> "A flame in freefall is not a safe flame. Until now, it was hard to read. Now the crew can see the line before the fire finds it.
> [pause]
> We are Team Flamme, from the University of Dhaka. Thank you."

**[END CARD]** "Flamme · Team Flamme, University of Dhaka · Not a NASA product. Not NASA-endorsed." Hold for 3 seconds.

---

## Production checklist

- **Under-18 rule:** nobody under 18 on camera or recognisable by voice. Use adult members or hands only.
- **Astronaut shots:** use stock or illustrated footage with no real crew member's face or name.
- **Name the sources out loud:** FLEX, BASS-II and Saffire each at least once. This is what the Relevance and NASA data usage scores look at.
- **Record the demo offline:** load the Lab and the Model page before recording, then switch Wi-Fi off.
- **Audio:** test on a laptop speaker. Voice sits 6 to 10 dB above music.
- **Confirm the format** with your Local Lead and the Judging Guide (published 13 November).
