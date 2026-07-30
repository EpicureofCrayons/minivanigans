import { defaultConfig, type AnyCard, type Deck } from "@minivanigans/rules-engine";

/** Shape of the build-shipped starter decks (apps/player/public/default-deck.json).
 *  v2 ships multiple decks in `decks`; v1 shipped a single `deck`. */
interface DefaultDeckFile {
  version: number;
  cards: AnyCard[];
  decks?: Deck[];
  deck?: Deck;
}

/**
 * Load the starter decks seeded on first launch (bundled, offline).
 * Returns undefined if the asset is missing or malformed, in which case the app
 * simply starts with an empty library.
 */
export async function loadDefaultDeck(): Promise<{ cards: AnyCard[]; decks: Deck[] } | undefined> {
  try {
    const res = await fetch("default-deck.json", { cache: "no-store" });
    if (!res.ok) return undefined;
    const json = (await res.json()) as DefaultDeckFile;
    const decks = json.decks ?? (json.deck ? [json.deck] : []);
    if (!Array.isArray(json.cards) || decks.length === 0) return undefined;
    if (json.version >= 5) return { cards: json.cards, decks };

    // The bundled art and deck lists predate v5. Rebase their mechanics onto
    // the new chassis/Moment menu while keeping names and artwork intact.
    const chassisMap: Record<string, string> = {
      tank: "anchor",
      cannon: "cannon",
      pivot: "pivot",
      sustainer: "sustainer",
      gambler: "trickster",
      puncher: "underdog",
      fortress: "anchor",
      captain: "captain",
      "all-in": "underdog",
      "hit-and-run": "wildcard",
      ace: "captain",
      wildcard: "wildcard",
    };
    const momentMap: Record<string, string> = {
      "pep-talk": "snack-break",
      "tag-out": "running-late",
      "second-wind": "encore",
      "sneak-peek": "detour",
      "power-up": "encore",
      "quick-draw": "group-chat",
      "find-a-friend": "carpool",
      "not-so-fast": "backseat-driver",
    };
    const cards = json.cards.map((card): AnyCard => {
      if (card.type === "Support") return { ...card, effectId: momentMap[card.effectId] ?? "good-vibes" };
      const chassisId = chassisMap[card.chassisId ?? ""] ?? "pivot";
      const chassis = defaultConfig.presets.find((c) => c.id === chassisId)!;
      return {
        ...card,
        chassisId,
        rarity: "Common",
        hp: chassis.hp,
        attack: { ...card.attack, damage: chassis.damage },
        abilityId: chassis.id,
        abilityFlavorName: undefined,
      };
    });
    const renamedDecks = decks.map((d) => ({
      ...d,
      name:
        d.id === "ds-starter-a"
          ? "Starter Deck A — Rush Hour"
          : d.id === "ds-starter-b"
            ? "Starter Deck B — Last One Standing"
            : d.name,
    }));
    return { cards, decks: renamedDecks };
  } catch {
    return undefined;
  }
}
