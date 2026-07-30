# Starter Deck — Art Prompts for ChatGPT

The default "Starter Deck — The Day Shift" ships with the Player App and is seeded on
first launch (see `apps/player/src/store/useLibrary.ts`). Each card references its art by a
**`bundled:`** path that resolves to a static file under `apps/player/public/cards/`.

## How to use this file
1. Generate each image with ChatGPT (or any image tool) using the prompt below.
2. Save it under **`apps/player/public/cards/<filename>`** using the **exact filename** listed.
3. Rebuild the Player App — the art appears automatically (no code changes).

## Art direction (apply to every prompt)
- **Aspect ratio:** the card art window is wide (roughly 5:2 — about 92% wide × 40% tall of a
  portrait card). Generate **landscape**, ~1024×512 or wider, with the subject centered and
  some headroom so the card frame can crop the top/bottom without losing the face.
- **Style:** friendly, modern flat-illustration / sticker-art with bold clean outlines, soft
  shading, and a simple background. All-ages, lighthearted, slightly humorous. No text in the image.
- **Format:** PNG, transparent or simple solid/gradient background.
- **Class color cue (subtle accent only — keep it tasteful):**
  - **Shifter** → warm coral/red (`#e0533a`)
  - **Stray** → fresh green (`#3aa563`)
  - **NPC** → friendly blue (`#4f7fe0`)

---

## Characters

### 1. Barista — Shifter (Common) · `cards/barista.png`
> A cheerful young barista in an apron mid-shift, holding a steaming espresso cup that's firing a
> jet of espresso like a tiny cannon ("Espresso Shot"). Coffee-shop background, warm coral accents.
> Flat sticker-art, bold outlines, lighthearted.

### 2. Line Cook — Shifter (Common) · `cards/line-cook.png`
> A focused line cook in a kitchen flipping a flaming pan ("Flambé"), flames leaping up dramatically
> but comically. Steamy diner kitchen, warm coral accents. Flat sticker-art, bold outlines.

### 3. Night-Shift Manager — Shifter (Premium Plus) · `cards/night-manager.png`
> A confident, slightly tired night-shift manager rallying the team, clipboard in one hand, coffee in
> the other, a determined grin ("Team Rally"). Premium feel — richer lighting, subtle glow, warm coral
> accents. Flat illustration, polished, bold outlines.

### 4. Stray Dog — Stray (Common) · `cards/stray-dog.png`
> A scrappy lovable stray dog mid wag, tail blurring with motion ("Tail Wag"), ears flopping, alley
> background. Fresh green accents. Flat sticker-art, bold outlines, charming.

### 5. Alley Cat — Stray (Common) · `cards/alley-cat.png`
> A sleek alley cat mid-pounce, claws out, eyes wide and mischievous ("Pounce"). Nighttime alley with a
> trash-can silhouette. Fresh green accents. Flat sticker-art, bold outlines.

### 6. Dumpster Raccoon — Stray (Premium Plus) · `cards/raccoon.png`
> A bold raccoon bursting out of a tipped-over trash can, arms raised mid-smash, snacks flying everywhere
> ("Trash Panda Smash"). Premium feel — richer lighting, subtle glow, fresh green accents. Polished flat
> illustration, bold outlines, comedic energy.

### 7. Jogging Dad — NPC (Common) · `cards/jogging-dad.png`
> A friendly suburban dad power-walking in a headband, sweatband, and running shorts, arms pumping
> ("Power Walk"). Sunny park path. Friendly blue accents. Flat sticker-art, bold outlines, wholesome.

### 8. Mall Walker — NPC (Common) · `cards/mall-walker.png`
> A cheerful older mall walker mid-stride swinging a cane ("Cane Whack"), tracksuit and comfy sneakers,
> shopping-mall background with storefronts. Friendly blue accents. Flat sticker-art, bold outlines.

### 9. Lost Tourist — NPC (Common) · `cards/lost-tourist.png`
> A bewildered tourist in a sun hat and camera around the neck, holding up a giant unfolded map upside
> down ("Map Slap"), looking confused but happy. City street background. Friendly blue accents. Flat
> sticker-art, bold outlines.

---

## Support cards
Support art uses a slightly shorter window than Characters but the same direction applies. Neutral teal
accent (`#0f766e`) suits these. Depict the *object/action*, no people needed.

### 10. Coffee Break — Pep Talk · `cards/coffee-break.png`
> A big restorative mug of coffee with a heart-shaped swirl of steam and a glowing "refresh" feel —
> healing/restoring energy. Teal accent. Flat sticker-art, bold outlines.

### 11. Shift Swap — Tag Out · `cards/shift-swap.png`
> Two arrows curving in a circle around a name-tag / time-clock, suggesting swapping places. Clean,
> energetic. Teal accent. Flat sticker-art, bold outlines.

### 12. Overtime — Power Up · `cards/overtime.png`
> A glowing alarm clock or stopwatch crackling with energy and bold upward arrows, radiating power.
> Teal accent. Flat sticker-art, bold outlines.

### 13. Paperwork Shuffle — Quick Draw · `cards/paperwork.png`
> A flurry of papers and sticky notes being shuffled and flung into the air, two cards being drawn from
> a stack. Playful office chaos. Teal accent. Flat sticker-art, bold outlines.

### 14. Lost Keys Found — Second Wind · `cards/lost-keys.png`
> A set of keys glinting with a triumphant sparkle, found at last — a small relieved/comeback vibe, maybe
> a faint "+1" or shine. Teal accent. Flat sticker-art, bold outlines.

---

## Deck contents (for reference)

| # | Card | Class | Rarity | HP | Attack (dmg) | Ability (flavor) | Pts |
|---|------|-------|--------|----|--------------|------------------|-----|
| 1 | Barista | Shifter | Common | 70 | Espresso Shot (40) | Run Away — "Clock Out" | 12/12 |
| 2 | Line Cook | Shifter | Common | 50 | Flambé (50) | Buffed Attack — "Fire It Up" | 12/12 |
| 3 | Night-Shift Manager | Shifter | Premium+ | 80 | Team Rally (50) | Regain Health — "Snack Break" | 15/15 |
| 4 | Stray Dog | Stray | Common | 60 | Tail Wag (50) | Run Away — "Bolt" | 12/12 |
| 5 | Alley Cat | Stray | Common | 50 | Pounce (60) | Dodge — "Nine Lives" | 12/12 |
| 6 | Dumpster Raccoon | Stray | Premium+ | 70 | Trash Panda Smash (60) | Buffed Attack — "Sugar Rush" | 15/15 |
| 7 | Jogging Dad | NPC | Common | 70 | Power Walk (40) | Run Away — "Quick Jog" | 12/12 |
| 8 | Mall Walker | NPC | Common | 70 | Cane Whack (30) | Regain Health — "Catch My Breath" | 12/12 |
| 9 | Lost Tourist | NPC | Common | 60 | Map Slap (50) | None | 11/12 |

| # | Support | Effect | Max per deck |
|---|---------|--------|--------------|
| 10 | Coffee Break | Pep Talk — restore 50% of Active's max HP | 2 |
| 11 | Shift Swap | Tag Out — free switch with a Minivan Character | 2 |
| 12 | Overtime | Power Up — next attack +30 damage | 1 |
| 13 | Paperwork Shuffle | Quick Draw — draw 2 cards | 2 |
| 14 | Lost Keys Found | Second Wind — erase 1 opponent KO + recover a KO'd Character | 1 |

**Totals:** 9 Characters (3 Shifter / 3 Stray / 3 NPC, 2 Premium Plus) + 5 Support = **14 cards** —
legal under the v3 deck rules (13–15 cards, 8–10 Characters, exactly 5 Support, ≤2 Premium Plus).
