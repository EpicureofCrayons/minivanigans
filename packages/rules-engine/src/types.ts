// Core domain types for Minivanigans! Persisted as JSON; IDs are UUIDs.
// Images live as separate files referenced by relative path (see BaseCard.imagePath).

export type CardClass = "Shifter" | "Stray" | "NPC";
export type Rarity = "Common" | "PremiumPlus";
export type CardType = "Character" | "Support";

/** Keys into the rules config menus. Strings keep saved data forward-compatible. */
export type AbilityId = string;
export type SupportEffectId = string;

// ---- Cards ----

export interface BaseCard {
  id: string;
  type: CardType;
  name: string;
  /** Relative path into the app's images dir; optional. */
  imagePath?: string;
  /** How the art is framed in the card window: object-position % (x,y) + zoom. */
  imageTransform?: { x: number; y: number; scale: number };
  /** Set when this card arrived via an imported share; the sender's username. */
  sharedBy?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface CharacterCard extends BaseCard {
  type: "Character";
  cardClass: CardClass;
  rarity: Rarity;
  /** v4.1: the preset chassis this card is built on (key into cfg.presets).
   *  Fixes hp / damage / ability / rarity; everything else is cosmetic. */
  chassisId?: string;
  hp: number; // 30–80 (fixed by the chassis in v4.1)
  attack: {
    name: string; // custom Everyday Move name, e.g. "Espresso Shot"
    damage: number; // fixed by the chassis
  };
  /** Kept as a storage-compatible key; in v5 this is always the chassis id. */
  abilityId: AbilityId;
  /** Custom Shift Move name. The standard move and full effect are still shown. */
  abilityFlavorName?: string;
  /** Premium+ only: art fills the whole card as a full-bleed background, with
   *  legibility scrims behind the text. Ignored for Common cards. */
  fullBleedArt?: boolean;
}

/**
 * Support cards have no rarity in v3 — their balance is the per-deck copy cap
 * (maxPerDeck) defined on the SupportEffectDef and printed on the card.
 */
export interface SupportCard extends BaseCard {
  type: "Support";
  effectId: SupportEffectId; // key into the rules config support list
  effectFlavorName?: string;
  // default description comes from the rules config for this effectId
}

export type AnyCard = CharacterCard | SupportCard;
/** v5 calls one-use action cards Moments. The persisted discriminator remains
 * "Support" so existing libraries and shared files migrate without data loss. */
export type MomentCard = SupportCard;

// ---- Player profile (Player App; one per install) ----

/** A built-in icon (by id) or an uploaded image (by storage ref). */
export type Avatar =
  | { kind: "builtin"; id: string }
  | { kind: "image"; ref: string };

/** The vehicle skin for a player's printable play mat ("the Minivan"). */
export type VehicleKind = "minivan" | "wagon" | "semi" | "rv" | "dumpster" | "bike";

/** A player's customised play mat / reserve "ride". */
export interface Garage {
  vehicle: VehicleKind;
  /** Body paint colour (hex). */
  color: string;
  /** Short license-plate text. */
  plate: string;
  /** Banner name; falls back to the profile username when empty. */
  name?: string;
}

/** One placeable facial feature in a custom avatar. */
export interface AvatarFeature {
  /** Chosen style id within its category, or "none". */
  style: string;
  /** Hex colour, where the feature is recolourable. */
  color?: string;
  /** Offset from the feature's default position, in 0–100 avatar units. */
  dx: number;
  dy: number;
  /** Size multiplier. */
  scale: number;
}

/**
 * The editable "recipe" behind a custom avatar. We rasterise it to a PNG for the
 * actual `avatar` (so every consumer keeps working unchanged), but keep the
 * recipe so the creator can reload and tweak it later.
 */
export interface AvatarRecipe {
  skin: string;
  bg: string;
  hair: AvatarFeature;
  eyes: AvatarFeature;
  nose: AvatarFeature;
  mouth: AvatarFeature;
  glasses: AvatarFeature;
  hat: AvatarFeature;
}

export interface Profile {
  username: string;
  avatar: Avatar;
  /** The recipe behind a custom-built avatar, kept so it can be edited later. */
  avatarRecipe?: AvatarRecipe;
  /** Id of the player's favorite Character card; shown on their lanyard. */
  favoriteCardId?: string;
  /** Customised printable play mat. Optional — defaults applied in the app. */
  garage?: Garage;
}

// ---- Decks ----

export interface DeckEntry {
  cardId: string;
  count: number;
}

export interface Deck {
  id: string;
  name: string;
  // Cards referenced by id with a count. Counts are bounded by the global
  // maxCopiesByName rule and, for Supports, the effect's own maxPerDeck cap.
  entries: DeckEntry[];
  createdAt: string;
  updatedAt: string;
}

// ---- Rules config menu entries ----

export interface AbilityDef {
  id: string;
  displayName: string;
  description: string;
  cost: number;
  /** Reserved: restrict an ability to Common cards (no default ability uses this in v3). */
  commonOnly?: boolean;
}

export interface SupportEffectDef {
  id: string;
  displayName: string;
  description: string;
  /** Max copies of this Support allowed per deck (printed on the card). */
  maxPerDeck: number;
}

/** v4.1 preset chassis: a fixed stat line + ability that custom Characters are
 *  built on. Players pick a chassis + class, then customize only cosmetics. */
export interface ChassisDef {
  id: string;
  /** Roster name, e.g. "The Tank". Players rename the card, not the chassis. */
  displayName: string;
  rarity: Rarity;
  hp: number;
  damage: number;
  abilityId: AbilityId;
  /** Printed standard names/effect for Rules v5. */
  everydayName?: string;
  shiftName?: string;
  shiftDamage?: number;
  shiftEffect?: string;
  /** One-line identity blurb from the roster table. */
  identity: string;
}

// ---- The tunable rules configuration consumed by the app and game engine ----

export interface RulesConfig {
  version: number;
  deck: {
    size: { min: number; max: number }; // 18–18 (exactly 18)
    character: { min: number; max: number }; // 12–12
    support: { min: number; max: number }; // 6–6
    maxCopiesByName: number; // 3
    /** Legacy storage field; v5 has no mechanical rarity limit. */
    maxPremiumPlus: number;
    minivanMax: number; // 3 (1 Active + 3 Minivan = 4 in play)
    startingHand: number; // 5
    secondPlayerBonusCards: number; // 1 (player going second draws extra)
    handLimit: number; // 7 (discard down to this at end of turn)
    mulliganMax: number; // 2 (free redraws if opening hand has no Characters)
  };
  rules: {
    winKnockouts: number; // 3 (first to this many KOs wins)
    /** Legacy tuning field. Rules v5 uses 0. */
    koComebackDraw: number;
    /** v4.1: both decks empty → most KO tokens wins; tied → next knockout wins. */
    suddenDeath: boolean; // true
    /** What sudden death compares: current KO tokens (Second Wind can erase
     *  them) or knockouts SCORED over the game (Second Wind can't). Defaults
     *  to "tokens" when omitted. */
    suddenDeathBasis?: "tokens" | "scored";
    /** When true, Second Wind can't be played once both decks are empty. */
    secondWindDeckoutLock?: boolean;
    /** Legacy tuning field; unused by v5. */
    powerUpBonus: number;
  };
  budgets: { Common: number; PremiumPlus: number }; // 12 / 15
  /** Stat cost = ceil(value / pointsPer) × (pointsFactor ?? 1). */
  hp: { min: number; max: number; pointsPer: number; pointsFactor?: number }; // 30 / 80, 1pt per 10
  damage: { min: number; max: number; pointsPer: number; pointsFactor?: number }; // 10 / 30, 2pts per 10
  /** Printable lanyard / employee-badge size in inches (portrait). */
  lanyard: { widthIn: number; heightIn: number }; // 4 x 6
  classAdvantageBonus: number; // +10
  classBeats: Record<CardClass, CardClass>; // Shifter->Stray, Stray->NPC, NPC->Shifter
  abilities: AbilityDef[];
  supportEffects: SupportEffectDef[];
  /** v4.1 preset roster. When non-empty, Characters must be built on a chassis. */
  presets: ChassisDef[];
  conduct: { bannedWords: string[] }; // optional local text check
}
