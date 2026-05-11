import { NodeStatsType } from "./Stats";

export type Node = {
  id: string;
  type: string;
  base?: boolean;
  tier?: "small" | "medium" | "large";
  angle?: number;
  distance?: number;
};

export type NodeTypeMetadata = {
  name?: string;
  description: string[];
  hasIcon?: boolean;
  iconOffset?: number;
  hasAsset?: boolean;
  unselectedAsset?: string;
  selectableAsset?: string;
  selectedAsset?: string;
  color: string;
  cost: number;
  stats?: NodeStatsType;
  maxLevel?: number;
  levelValues?: { [varName: string]: (number | string)[] };
  perLevel?: {
    value: number | string;
    value2?: number | string;
    label: string;
  };
};

export type SkillNodesType = {
  types: { [key: string]: NodeTypeMetadata };
  nodes: { [key: string]: Node };
  edges: { [key: string]: string[] };
};

export type SeedNode = Omit<Node, "id">;

// First id is connected to every following id. Use 2 ids for a simple pair,
// or 3+ for a hub-and-spoke (e.g. ["HUB", "A", "B", "C"] = HUB-A, HUB-B, HUB-C).
export type SeedEdge = readonly [string, string, ...string[]];

export type SkillTreeSeed = {
  types: { [typeKey: string]: NodeTypeMetadata };
  nodes: { [nodeId: string]: SeedNode };
  edges: ReadonlyArray<SeedEdge>;
};

const BASE_ANGLE_DIST = 30;
const Q1 = 15,
  Q2 = 45,
  Q3 = 75,
  Q4 = 105,
  Q5 = 135,
  Q6 = 165,
  Q7 = 195,
  Q8 = 225,
  Q9 = 255,
  Q10 = 285,
  Q11 = 315,
  Q12 = 345;

const BASE_DIST = 60;
const BASE_INNER = -2 * BASE_DIST;
const BASE_OUTER = 0;

export const LinesAngles = [Q1, Q2, Q3, Q4, Q5, Q6, Q7, Q8, Q9, Q10, Q11, Q12];

const SHROUD_TIME_TEXT =
  "<b>Shroud Time</b><br/>Should this time run out, the Shroud will consume you.";
const BLOCK_BREAKER =
  "<b>Block Breaker</b><br/>This special attack fills a blocking enemy's <i>Stun Bar</i> twice as much when hit.";
const OVERPOWER =
  "<b>Overpower</b><br>Attacking blocking enemies or parrying their attacks fills their <i>Stun Bar</i> until they become <b>overpowered</b>.<br><b>Overpowered</b> enemies are open for Merciless Attacks.";
const WET =
  "<b>Wet</b><br/>Reduces Stamina and Stamina Regeneration by <b>30%</b> for <b>15</b> minutes. Warmth reduces the remaining duration.";
const SOAKED =
  "<b>Soaked</b><br/>Reduces Stamina and Stamina Regeneration by <b>30%</b> for <b>30</b> seconds. Also reduces <b>Ice and Shock Resistances</b> by <b>30%</b> but increases <b>Fire Resistances</b> by <b>30%</b>.<br><b>Soaked</b> can be applied to enemies. <br><b>Soaked</b> duration can not be reduced by warmth and <b>Wet</b> debuff starts after it is over.";
const CHARGE =
  "<b>Charge</b><br/>As the Updraft charges before activation, the resulting lift is increased. A full charge grants you an additional boost. The charge is accelerated while inside your base.";
const BLOODRAGE =
  "<b>Blood Rage</b><br/>Increases Melee weapon damage by <b>15%</b> for <b>10</b> seconds.";
const SKILLSHOT =
  "<b>Skillshot</b><br/>Striking enemy weak points, such as heads or exposed hearts, is considered a Skillshot.";
const UNLEASH_FOCUS =
  "Press <b>[R]</b> to unleash a powerful Special Ability after generating enough Focus.";
const FOCUS =
  "<b>Focus</b><br/>Generate Focus by attacking. Focus can be built up with any weapon type and is used to trigger Special Abilities of weapons.";
const PARRY =
  "<b>Parry</b><br/>A well-timed block with any Melee weapon or Shield will <b>parry</b> the attack and fill up the enemy's <i>Stun Bar</i>.";

const skillTreeSeed: SkillTreeSeed = {
  types: {
    GIANT_SLAYER_HOOK: {
      name: "GIANT SLAYER HOOK",
      description: [
        "Use your <b>Grappling Hook</b> to pull yourself towards large enemies during combat.",
        "<b>Cost:</b> 50 Stamina",
      ],
      hasIcon: true,
      color: "gold",
      cost: 3,
    },
    GROUNDING_HOOK: {
      name: "GROUNDING HOOK",
      description: [
        "Use your <b>Grappling Hook</b> to pull <b>flying</b> enemies towards you during combat.",
        "<b>Cost:</b> 50 Stamina",
      ],
      hasIcon: true,
      color: "gold",
      cost: 4,
    },
    SAVIOUR: {
      name: "SAVIOUR",
      description: [
        "Time to revive an ally is reduced by <b>-1</b> seconds.",
        "Default revive time is <b>6</b> seconds. ",
      ],
      color: "gold",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: -1,
        label: "<b>-1</b> seconds per level",
      },
    },
    BACKSTAB_DAMAGE: {
      name: "BACKSTAB MASTERY",
      description: ["<b>Backstab</b> damage is increased by <b>20%</b>"],
      color: "green",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 20,
        label: "<b>{{value}}%</b> damage per level",
      },
    },
    OPPORTUNITY: {
      name: "OPPORTUNITY",
      description: [
        "Increases the damage multiplier of <b>Merciless Attacks</b> by <b>{{value}}%</b>.",
      ],
      color: "gold",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 40,
        label: "<b>{{value}}%</b> damage per level",
      },
    },
    MINER: {
      name: "MINER",
      description: [
        "Mining resources has a <b>10%</b> chance to grant one additional resource.",
      ],
      color: "gold",
      cost: 4,
    },
    LUMBERJACK: {
      name: "LUMBERJACK",
      description: [
        "Tool deals <b>{{value}}%</b> increased damage against wood.",
        "This includes trees and wooden terrain.",
      ],
      color: "gold",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 10,
        label: "<b>{{value}}%</b> damage per level",
      },
    },
    QUALITY_GEAR: {
      name: "QUALITY GEAR",
      description: [
        "Tools have a <b>20%</b> chance to restore <b>1</b> durability point",
      ],
      color: "gold",
      cost: 2,
    },
    MASON: {
      name: "MASON",
      description: [
        "Tools deal <b>{{value}}%</b> increased damage against stone.",
        "This includes stone terrain and gemstone veins.",
      ],
      color: "gold",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 10,
        label: "<b>{{value}}%</b> damage per level",
      },
    },
    FISHERMANS_RESOLVE: {
      name: "FISHERMAN'S RESOLVE",
      description: [
        "Increases your Fishing Endurance by <b>{{value}}</b>.",
        "Allows for extended battles with hooked fish.",
      ],
      color: "gold",
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 5,
        label: "<b>{{value}}</b> Fishing Endurance per level",
      },
    },
    POWER_PARRY: {
      name: "POWER PARRY",
      description: [
        "Your Parry Power is increased by <b>{{value}}%</b>.",
        PARRY,
        OVERPOWER,
      ],
      color: "gold",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 10,
        label: "<b>{{value}}%</b> Parry Power per level",
      },
    },
    FELLING_AXE_SPECIALIZATION: {
      description: [
        "Unlocks Special Abilities of Felling Axes. " + UNLEASH_FOCUS,
        FOCUS,
      ],
      color: "gold",
      cost: 3,
    },
    PICKAXE_SPECIALIZATION: {
      description: [
        "Unlocks Special Abilities of Pickaxes. " + UNLEASH_FOCUS,
        FOCUS,
      ],
      color: "gold",
      cost: 3,
    },
    PROSPECTOR: {
      description: [
        "Tools deal <b>{{value}}</b> increased damage against metal.\nThis includes metal ore veins.",
        FOCUS,
      ],
      color: "gold",
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 10,
        label: "<b>{{value}}</b> damage per level",
      },
    },
    ATTR_SPIRIT: {
      name: "SPIRIT",
      description: [
        "Increases your Spirit attribute by 1.",
        "Increases Mana by 20 per Attribute Point.",
      ],
      color: "blue",
      cost: 1,
      stats: { SPIRIT: 1 },
    },
    ATTR_INT: {
      name: "INTELLIGENCE",
      description: [
        "Increases your Intelligence attribute by 1.",
        "Increases Magic damage by 5% per Attribute Point.",
      ],
      color: "blue",
      cost: 1,
      stats: { INT: 1 },
    },
    ATTR_CONS: {
      name: "CONSTITUTION",
      description: [
        "Increases your Constitution attribute by 1.",
        "Increases Health by 50 per Attribute Point.",
      ],
      color: "red",
      cost: 1,
      stats: { CONS: 1 },
    },
    ATTR_STR: {
      name: "STRENGTH",
      description: [
        "Increases your Strength attribute by 1.",
        "Increases Melee damage by 5% per Attribute Point.",
      ],
      color: "red",
      cost: 1,
      stats: { STR: 1 },
    },
    ATTR_ENDURANCE: {
      name: "ENDURANCE",
      description: [
        "Increases your Endurance attribute by 1.",
        "Increases Stamina by 10 per Attribute Point.",
      ],
      color: "green",
      cost: 1,
      stats: { ENDURANCE: 1 },
    },
    ATTR_DEX: {
      name: "DEXTERITY",
      description: [
        "Increases your Dexterity attribute by 1.",
        "Increases Bow and Dagger damage by 5% per Attribute Point.",
      ],
      color: "green",
      cost: 1,
      stats: { DEX: 1 },
    },
    WELL_RESTED: {
      name: "WELL RESTED",
      description: [
        "The base duration for the Rested buff is increased by <b>{{value}}</b> minutes.",
        "<b>Rested</b><br>The Rested buff increases your Stamina Maximum and Regeneration significantly.",
        "It requires <b>shelter, sitting or sleeping,</b> as well as <b>warmth</b> from a heat source.",
        "The buff can be refreshed <b>anywhere.</b>",
        "Surrounding comfort items further increase its duration.",
      ],
      color: "gold",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 2,
        label: "<b>{{value}}</b> minutes per level",
      },
    },
    SNEAK_ATTACK: {
      name: "SNEAK ATTACK",
      description: [
        "Perform a <b>Sneak Attack</b> by sneaking up to an unaware enemy and pressing <b>[E]</b>.",
        "<b>Sneak Attack</b> deals <b>+900%</b> increased damage.",
      ],
      hasIcon: true,
      color: "gold",
      cost: 3,
    },
    MERCILESS_ATTACK: {
      name: "MERCILESS ATTACK",
      description: [
        "Perform a <b>Merciless Attack</b> by pressing <b>[E]</b> to deal <b>+500%</b> damage to an <b>overpowered</b> enemy.",
        OVERPOWER,
      ],
      hasIcon: true,
      color: "gold",
      cost: 2,
    },
    UPDRAFT: {
      name: "UPDRAFT",
      description: [
        "Jumping with [SPACE] while gliding lifts you upwards. Can be used once per flight.",
        CHARGE,
        "<b>Cost:</b> 100 Mana",
      ],
      hasIcon: true,
      color: "green",
      cost: 4,
    },
    BEGONE: {
      name: "BEGONE!",
      description: [
        "A magic-powered punch that pushes back and stuns enemies.",
        "Replaces your unarmed attacks as long as you have the necessary Mana available.",
        "<b>Cost:</b> 30 Mana",
      ],
      hasIcon: true,
      color: "blue",
      cost: 3,
    },
    RADIANT_AURA: {
      name: "RADIANT AURA",
      description: [
        "All <b>Fell</b> enemies within <b>{{value}}</b> meters take <b>{{value2}} Fire</b> damage per Intelligence per second.",
      ],
      hasIcon: true,
      color: "blue",
      cost: 1,
      maxLevel: 1,
      perLevel: {
        value: 2,
        value2: 1,
        label:
          "<b>{{value}}</b> meters range and <b>{{value2}} Fire</b> damage per Intelligence per level",
      },
    },
    WATER_AURA: {
      name: "WATER AURA",
      description: [
        "You emit a healing aura that heals you and all injured allies within <b>{{value}}</b> meters.",
        "The healing scales with your intelligence attribute and restores <b>1</b> Health per <b>2</b> points of intelligence.",
      ],
      hasIcon: true,
      color: "blue",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 5,
        label: "<b>{{value}}</b> meters per level",
      },
    },
    MARTYR: {
      name: "MARTYR",
      description: [
        "When you are killed by an enemy, all allies within 30 meters are healed for <b>50%</b> of their maximum health.",
        "They also receive a <b>Final Blessing</b> buff, increasing their maximum Health by <b>100</b> points for <b>15</b> minutes.",
      ],
      hasIcon: true,
      color: "red",
      cost: 3,
    },
    DIVINE_SURGE: {
      name: "DIVINE SURGE",
      description: [
        "Healing spells can perform Critical Strikes that scale with your Critical Strike damage.",
      ],
      color: "blue",
      cost: 5,
    },
    RIGHTEOUS_FIRE: {
      name: "RIGHTEOUS FIRE",
      description: [
        "Healing any target with a spell triggers a burst of fire that deals <b>{{value}}%</b> of the heal amount as <b>Fire</b> damage to nearby <b>Fell</b> enemies.",
      ],
      color: "blue",
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 20,
        label: "<b>{{value}}% Fire</b> damage per level",
      },
    },
    BLINK: {
      name: "BLINK",
      description: [
        "Replaces the Dodge Roll ability with a short-range teleport.",
        "Blink also replaces the sideways Dodge Roll of the Strategig Maneuver skill",
        "<b>Cost:</b> 20 Stamina",
      ],
      hasIcon: true,
      color: "blue",
      cost: 4,
    },
    EVASION_ATTACK: {
      name: "EVASION ATTACK",
      description: [
        "When equipped with a Melee weapon, you can perform an evade attack, which dashes towards the enemy and deals more weapon damage with <b>[LMB]</b>",
        "<b>Cost:</b> 20 Stamina",
        BLOCK_BREAKER,
      ],
      hasIcon: true,
      color: "red",
      cost: 4,
    },
    EARTH_AURA: {
      name: "EARTH AURA",
      description: [
        "You emit a protective aura that increases Physical an Magical Resistances by <b>10%</b> for you and all allies within <b>{{value}}</b> meters.",
      ],
      hasIcon: true,
      color: "red",
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 4,
        label: "<b>{{value}}</b> meters range per level",
      },
    },
    NEMESIS: {
      name: "NEMESIS",
      description: [
        "Increase the attention you draw from enemies by <b>{{value}}%</b>.",
      ],
      hasIcon: true,
      color: "red",
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 5,
        label: "<b>{{value}}%</b> attention drawn per level",
      },
    },
    SHOCKWAVE: {
      name: "SHOCKWAVE",
      description: [
        "Trigger a Shockwave when you parry an attack or <b>overpower</b> an enemy.",
        "The Shockwave pushes back nearby enemies. It also fills their <i>Stun Bar</i>, scaling with your Strength attribute.",
        OVERPOWER,
      ],
      hasIcon: true,
      color: "red",
      cost: 3,
    },
    HEAVY_SPECIALIZATION: {
      name: "HEAVY HITTER",
      description: [
        "Increases the attack speed of all Two-Handed Melee weapons by <b>10%</b>.",
      ],
      hasIcon: true,
      color: "red",
      cost: 5,
    },
    BASH: {
      name: "BASH",
      description: [
        "Parrying enemy attacks bashes them for <b>{{value}} Blunt</b> damage. Bash damage is increased by your Strength attribute.",
        PARRY
      ],
      hasIcon: true,
      color: "red",
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 10,
        label: "<b>{{value}} Blunt</b> damage per level",
      },
    },
    WHIRLWIND_CRESCENDO: {
      name: "WHIRLWIND CRESCENDO",
      description: [
        "When equipped with a Two-Handed weapon, trigger a whirl attack at the end of an attack chain.",
        "<b>Cost</b>: 75 Stamina",
      ],
      hasIcon: true,
      color: "red",
      cost: 5,
    },
    CRASH_DOWN_ATTACK: {
      name: "CRASH DOWN ATTACK",
      description: [
        "When equipped with a Melee weapon, you can perform a special attack by holding <b>[LMB]</b> during a jump.",
        "Crash Down deals 50% more weapon damage in a small blast radius and costs Stamina depending on weapon type used.",
        "<b>Cost</b>: 35-60 Stamina",
        BLOCK_BREAKER,
      ],
      hasAsset: true,
      selectedAsset: "crash_down_attack_active.png",
      unselectedAsset: "crash_down_attack.png",
      color: "red",
      cost: 3,
    },
    CRASH_DOWN_FORCE: {
      name: "Crash Down: Force",
      description: [
        "When attacking from a double jump, <b>Crash Down</b> deals <b>20%</b> more weapon damage.",
      ],
      color: "red",
      cost: 3,
    },
    DOUBLE_JUMP: {
      name: "DOUBLE JUMP",
      description: [
        "Allows jumping a second time while airborne.",
        "<b>Cost:</b> 10 Stamina",
      ],
      hasIcon: true,
      iconOffset: 10,
      color: "gold",
      cost: 4,
    },
    DESSERT_STOMACH: {
      name: "DESSERT STOMACH",
      description: ["You gain one additional Food slot"],
      hasIcon: true,
      color: "green",
      cost: 4,
    },
    LAST_MEAL: {
      name: "LAST MEAL",
      description: [
        "Your Food buffs persist through death, but they last half as long.",
      ],
      color: "green",
      cost: 5,
    },
    EAGLE_EYE: {
      name: "EAGLE EYE",
      description: [
        "Greatly increases the zoom while aiming with Bows.",
        "To aim, hold down the [RMB] while a bow is selected in the Action bar. (Alternatively, hold [Q] to aim your equipped bow.)",
      ],
      hasIcon: true,
      color: "green",
      cost: 3,
    },
    MULTI_SHOT: {
      name: "MULTI SHOT",
      description: [
        "Shooting <i>Regular Arrows</i> has a <b>20%</b> chance to spawn a <b>Flurry of <b>Arrows</b> that spreads slightly.",
        "<i>Regular Arrows</i> fired this way will substract from your ammunition.",
        "<b>Flurry of <b>Arrows</b> does not trigger on <i>Special Arrows</i>.",
      ],
      hasIcon: true,
      color: "green",
      cost: 4,
    },
    MULTI_SHOT_SPREAD: {
      name: "MULTI SHOT SPREAD",
      description: [
        "Adds a <b>25%</b> chance to spawn an additional <i>Regular Arrow</i> with your <b>Flurry of <b>Arrows</b> from the <b>Multi Shot</b> skill.",
        "This additional <i>Regular Arrow</i> does not subtract from your ammunition.",
      ],
      color: "green",
      cost: 3,
    },
    MULTI_SHOT_TRIGGER: {
      name: "MULTI SHOT TRIGGER",
      description: [
        "Shooting <i>Special Arrows</i> now triggers a <b>Flurry of <b>Arrows</b> from the <b>Multi Shot</b> skill.",
        "<i>Special Arrows</i> fired this way will subtract from your ammunition.",
      ],
      color: "green",
      cost: 3,
    },
    BEE_STING: {
      name: "BEE STING",
      description: [
        "Firing or aiming your Bow while airborne slowes down your fall briefly. Every shot lifts you slightly, granting more airtime.",
        "<b>Cost:</b> 10 stamina per second",
      ],
      hasIcon: true,
      color: "green",
      cost: 3,
    },
    SHELL_SHOCK: {
      name: "SHELL SHOCK",
      description: [
        "Infuse your <b>Ranged Explosives</b> with Mana. They now stun enemies for 2 seconds.",
        "<b>Cost:</b> 8 Mana per stunned enemy",
      ],
      hasIcon: true,
      color: "green",
      cost: 3,
    },
    COUNTERSTRIKE: {
      name: "COUNTERSTRIKE",
      description: [
        "After receiving damage, there is a <b>{{value}}%</b> chance to reflect <b>{{value2}}%</b> of the damage back to the attacker as <b>Fire</b> damage.",
        "This magical attack can trigger other skills.",
      ],
      color: "blue",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 8,
        value2: 20,
        label:
          "<b>{{value}}%</b> chance and <b>{{value2}}%</b> reflected damage per level",
      },
    },
    TERROR: {
      name: "TERROR",
      description: [
        "Critical Strikes with spells have a <b>{{value}}%</b> chance to stun the target for <b>2</b> seconds.",
      ],
      color: "blue",
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 15,
        label: "<b>{{value}}%</b> chance per level",
      },
    },
    SHOCK_RESISTANCE: {
      name: "SHOCK RESISTANCE",
      description: [
        "Increases your <b>Shock Resistance</b> by <b>{{value}}%</b> which reduces the amount of <b>Shock</b> damage received.",
      ],
      color: "blue",
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 4,
        label: "<b>{{value}}%</b> Resistance per level",
      },
    },
    QUICK_CHARGE: {
      name: "QUICK CHARGE",
      description: ["Cast Time of spells is reduced by <b>{{value}}%</b>."],
      color: "blue",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: -15,
        label: "<b>{{value}}%</b> Cast Time per level",
      },
    },
    THIS_IS_THE_WAY: {
      name: "MAGE APPRENTICE",
      description: ["Magic weapon damage is increased by <b>{{value}}%</b>."],
      color: "blue",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 5,
        label: "<b>{{value}}%</b> damage per level",
      },
    },
    ARSONIST: {
      name: "ARSONIST",
      description: [
        "All <b>Fire</b> damage is increased by <b>{{value}}%</b>.",
      ],
      color: "blue",
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 10,
        label: "<b>{{value}}%</b> damage per level",
      },
    },
    SUN_AURA: {
      name: "RADIANT AURA",
      description: [
        "All <b>Fell</b> enemies within <b>{{value}}</b> meters take <b>{{value2}} Fire</b> damage per Intelligence per second.",
      ],
      color: "blue",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 2,
        value2: 1,
        label:
          "<b>{{value}}</b> meters range and <b>{{value2}} Fire</b> damage per Intelligence per level",
      },
    },
    FIRE_RESISTANCE: {
      name: "FIRE RESISTANCE",
      description: [
        "Increases your <b>Fire Resistance</b> by <b>{{value}}%</b>, which reduces the amount of <b>Fire</b> damage received.",
      ],
      color: "blue",
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 4,
        label: "<b>{{value}}%</b> Resistance per level",
      },
    },
    THUNDER: {
      name: "THUNDER",
      description: [
        "All <b>Shock</b> damage is increased by <b>{{value}}%</b>.",
      ],
      color: "blue",
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 10,
        label: "<b>{{value}}%</b> damage per level",
      },
    },
    LIGHTNING: {
      name: "LIGHTNING",
      description: ["All shock damage is increased by an additional 20%."],
      color: "blue",
      cost: 3,
    },
    ICEMAN: {
      name: "ICEMAN",
      description: ["All <b>Ice</b> damage is increased by <b>{{value}}%</b>."],
      color: "blue",
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 10,
        label: "<b>{{value}}%</b> damage per level",
      },
    },
    SUBZERO: {
      name: "SUBZERO",
      description: ["All ice damage is increased by an additional 20%."],
      color: "blue",
      cost: 3,
    },
    FROST: {
      name: "FROST",
      description: [
        "When receiving Melee damage, the attacker will be slowed down for {{value}} seconds.",
      ],
      color: "blue",
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 3,
        label: "<b>{{value}}s</b> per level",
      },
    },
    ICE_RESISTANCE: {
      name: "ICE RESISTANCE",
      description: [
        "Increases your <b>Ice Resistance</b> by <b>{{value}}%</b> which reduces the amount of <b>Ice</b> damage received.",
      ],
      color: "blue",
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 4,
        label: "<b>{{value}}%</b> Resistance per level",
      },
    },
    WIZARD: {
      name: "WIZARD",
      description: [
        "Magic weapon Critical Strike chance is increased by <b>{{value}}%</b>.",
      ],
      color: "blue",
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 2,
        label: "<b>{{value}}%</b> Critical Strike chance per level",
      },
    },
    DARK_ARTS: {
      name: "DARK ARTS",
      description: [
        "All <b>Shroud damage</b> is increased by <b>{{value}}%</b>.",
      ],
      color: "blue",
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 10,
        label: "<b>{{value}}%</b> damage per level",
      },
    },
    ABYSS: {
      name: "ABYSS",
      description: ["All Shrouded damage is increased by an additional 20%."],
      color: "blue",
      cost: 4,
    },
    CHAIN_HIT: {
      name: "CHAIN HIT",
      description: [
        "Critical Strikes with Magic weapon will automatically hit a second enemy within <b>15</b> meters for <b>5 Shock</b> damage per intelligence.",
      ],
      color: "blue",
      cost: 3,
    },
    MASS_DESTRUCTION: {
      name: "MASS DESTRUCTION",
      description: [
        "Critical Strikes with a Magic weapons deal <b>2 Shock</b> damage per intelligence to all enemies whithin <b>{{value}}</b> meters of the target.",
      ],
      color: "blue",
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 5,
        label: "<b>{{value}}</b> meters range per level",
      },
    },
    NECROMANCER: {
      name: "NECROMANCER",
      description: [
        "When killing an enemy with a Magic weapon, you have a <b>{{value}}%</b> chance to summon a friendly <b>Skull Companion</b>.",
      ],
      color: "blue",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 5,
        label: "<b>{{value}}%</b> chance per level",
      },
    },
    HEALER: {
      name: "HEALER",
      description: [
        "Health gain from healing spells and skills is increased by <b>{{value}}%</b>.",
      ],
      color: "blue",
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 15,
        label: "<b>{{value}}%</b> healing per level",
      },
    },
    HEALER_II: {
      name: "HEALER II",
      description: ["Health gain from healing spells will be increased by 20%"],
      color: "blue",
      cost: 2,
    },
    HEALING_REVIVE: {
      name: "HEALING REVIVE",
      description: [
        "Revive players with <b>{{value}}%</b> increased Health.",
        "default Health of revived players is <b>10%</b>.",
      ],
      color: "blue",
      cost: 1,
      perLevel: {
        value: 8,
        label: "<b>{{value}}%</b> Health per level",
      },
    },
    SHROUD_FILTER: {
      name: "SHROUD FILTER",
      description: [
        "Dealing damage with a Magic weapon has a <b>{{value}}%</b> chance to trigger a small flame burst that restores <b>9</b> seconds of <b>Time in the Shroud</b> to you and your allies within <b>20</b> meters.",
        SHROUD_TIME_TEXT,
      ],
      color: "blue",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 5,
        label: "<b>{{value}}%</b> chance per level",
      },
    },
    WATERS_OF_LIFE: {
      name: "WATERS OF LIFE",
      description: [
        "Increases <b>Water Aura</b> healing to <b>2</b> Health per <b>2</b> points of Intelligence.",
      ],
      color: "blue",
      cost: 2,
    },
    SHROUD_RESISTANCE: {
      name: "SHROUD RESISTANCE",
      description: [
        "Increases your <b>Shroud Resistance</b> by <b>{{value}}%</b> which reduces the amount of <b>Shroud</b> damage received.",
      ],
      color: "blue",
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 4,
        label: "<b>{{value}}%</b> Resistance per level",
      },
    },
    SHROUD_MISTERY: {
      name: "SHARED MISERY",
      description: [
        "When you receive <b>Shroud</b> damage, all players within <b>{{value}}</b>-meters receive <b>15%</b> increased <b>Shroud Resistance</b> for <b>30</b> seconds.",
      ],
      color: "blue",
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 5,
        label: "<b>{{value}}</b> meters per level",
      },
    },
    EMERGENCY_BLINK: {
      name: "EMERGENCY BLINK",
      description: [
        "You can blink while being stunned. This will break the stunned state.",
      ],
      color: "blue",
      cost: 2,
    },
    BLINK_ATTACK: {
      name: "BLINK ATTACK",
      description: [
        "Blinking into an enemy triggers an explosion which deals <b>Fire</b> damage in a small radius.",
        "Damage and Mana cost scale with the Intelligence attribute.",
      ],
      color: "blue",
      cost: 2,
    },
    ARCANE_DEFLECTION: {
      name: "ARCANE DEFLECTION",
      description: [
        "Successfully parrying an enemy's attack restores <b>{{value}}</b> Mana.",
        PARRY,
      ],
      color: "blue",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 10,
        label: "<b>{{value}}</b> Mana per level",
      },
    },
    UNITY: {
      name: "UNITY",
      description: [
        "Damaging enemies with Wands has a <b>{{value}}%</b> chance to restore <b>{{value2}}%</b> of your maximum Mana.",
      ],
      hasIcon: true,
      color: "blue",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 10,
        value2: 2,
        label:
          "<b>{{value}}%</b> chance and <b>{{value2}}%</b> of maximum Mana per level",
      },
    },
    ARCANE_PROLIFERATION: {
      name: "ARCANE PROLIFERATION",
      description: [
        "Wand attacks have a <b>30%</b> chance to spawn double the amount of projectiles. Extra projectiles spawned deal <b>50%</b> less damage.",
      ],
      color: "blue",
      cost: 3,
    },
    ETERNAL_SPARK: {
      name: "ETERNAL SPARK",
      description: [
        "Dealing damage with Wand projectiles has a <b>{{value}}%</b> chance to restore 1 durability to that weapon.",
      ],
      color: "blue",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 10,
        label: "<b>{{value}}%</b> chance per level",
      },
    },
    STING: {
      name: "STING",
      description: ["Repeated Wand damage is increased by <b>20%</b>."],
      color: "blue",
      cost: 3,
    },
    BATTLE_HEAL: {
      name: "BATTLE HEAL",
      description: [
        "Critical Strikes with Melee weapon heal you for <b>{{value}}%</b> of your maximum Health.",
      ],
      color: "red",
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 1,
        label: "<b>{{value}}%</b> of maximum Health per level",
      },
    },
    BLOODLETTING: {
      name: "BLOODLETTING",
      description: [
        "Critical Strikes with spells have a <b>{{value}}%</b> chance to spawn 2 Health, Mana, and/or Stamina Orbs.",
        "Gathering an Orb restores <b>10%</b> of the respective resource.",
      ],
      color: "blue",
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 15,
        label: "<b>{{value}}%</b> chance per level",
      },
    },
    LIFE_BURST: {
      name: "LIFE BURST",
      description: [
        "Defeating an enemy with a Magic weapon restores Health equal to <b>3</b> times your Intelligence to all players within <b>15</b> meters of the target.",
      ],
      color: "blue",
      cost: 4,
    },
    BLOOD_MAGIC: {
      name: "BLOOD MAGIC",
      description: [
        "When your Mana drops below <b>20%</b>, you restore up to <b>35%</b> of your maximum Mana at the cost of <b>1</b> Health per Mana restored.",
        "This effect stops at 1 Health.",
        "<b>Cooldown:</b> 2 minutes",
      ],
      color: "blue",
      cost: 4,
    },
    ABSORB: {
      name: "ABSORB",
      description: [
        "When you receive <b>Magic</b> damage, you have a <b>{{value}}%</b> chance to restore 1 Mana per Health point lost.",
      ],
      color: "red",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 4,
        label: "<b>{{value}}%</b> chance per level",
      },
    },
    SNAP: {
      name: "SNAP",
      description: [
        "Triggering a <b>Merciless Attack</b> restores <b>10%</b> Mana.",
      ],
      color: "red",
      cost: 3,
    },
    SOUL_LEECH: {
      name: "SOUL LEECH",
      description: [
        "When killing an enemy with a Melee weapon, all players within <b>{{value}}</b> meters of the target restore <b>{{value2}}</b> Mana.",
      ],
      color: "red",
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 5,
        value2: 15,
        label:
          "<b>{{value}}</b> meters range and <b>{{value2}}</b> Mana per level",
      },
    },
    SHINY_PLATES: {
      name: "SHINY PLATES",
      description: [
        "Equipped armor grants <b>{{value}}%</b> increased Magical Armor",
      ],
      color: "red",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 4,
        label: "<b>{{value}}%</b> increased Magical Armor per level",
      },
    },
    HEAVY_PLATES: {
      name: "HEAVY PLATES",
      description: [
        "Equipped armor grants <b>{{value}}%</b> increased Physical Armor",
      ],
      color: "red",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 4,
        label: "<b>{{value}}%</b> increased Physical Armor per level",
      },
    },
    ONE_HANDED_SPECIALIZATION: {
      name: "One-Handed Specialization",
      description: [
        "Unlocks Special Abilities of One-Handed Melee weapons.\nPress <b>[R]</b> to unleash a powerful Special Ability after generating enough Focus",
        FOCUS,
      ],
      color: "red",
      cost: 3,
    },
    WARDEN: {
      name: "WARDEN",
      description: [
        "While there are three or more enemies within <b>20</b> meters, you receive <b>10%</b> increased <b>Magical Resistance</b>.",
      ],
      color: "red",
      cost: 3,
    },
    TOWER: {
      name: "TOWER",
      description: [
        "While there are three or more enemies within <b>20</b> meters, you receive <b>10%</b> increased <b>Physical Resistance</b>",
      ],
      color: "red",
      cost: 3,
    },
    ARCH_NEMESIS: {
      name: "ARCH NEMESIS",
      description: [
        "Whenever an ally draws the attention of an enemy, you draw twice as much.",
      ],
      color: "red",
      cost: 3,
    },
    PURIFICATION: {
      name: "PURIFICATION",
      description: [
        "Defeating a Shroud infested enemy with a Melee weapon restores <b>{{value}}</b> seconds of <b>Time in the Shroud</b>.",
        SHROUD_TIME_TEXT,
      ],
      color: "red",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 3,
        label: "<b>{{value}}</b> seconds per level",
      },
    },
    WARRIOR_PATH: {
      name: "WARRIOR'S PATH",
      description: [
        "One-Handed Melee weapon damage is increased by <b>{{value}}%</b>.",
      ],
      color: "red",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 5,
        label: "<b>{{value}}%</b> damage per level",
      },
    },
    THRUST: {
      name: "THRUST",
      description: [
        "Melee <b>Piercing</b> damage is increased by <b>{{value}}%</b>.",
      ],
      color: "red",
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 10,
        label: "<b>{{value}}%</b> damage per level",
      },
    },
    PIERCE: {
      name: "PIERCE",
      description: [
        "All melee piercing damage is increased by an additional 20%.",
      ],
      color: "red",
      cost: 3,
    },
    BRUTE: {
      name: "BRUTE",
      description: [
        "Melee <b>Blunt</b> damage is increased by <b>{{value}}%</b>.",
      ],
      color: "red",
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 10,
        label: "<b>{{value}}%</b> damage per level",
      },
    },
    HAMMER_TIME: {
      name: "HAMMER TIME",
      description: [
        "All melee blunt damage is increased by an additional 20%.",
      ],
      color: "red",
      cost: 3,
    },
    SLASHER: {
      name: "SLASHER",
      description: [
        "Melee <b>Cutting</b> damage is increased by <b>{{value}}%</b>.",
      ],
      color: "red",
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 10,
        label: "<b>{{value}}%</b> damage per level",
      },
    },
    BUTCHER: {
      name: "BUTCHER",
      description: [
        "All melee cutting damage is increased by an additional 20%.",
      ],
      color: "red",
      cost: 3,
    },
    VETERAN: {
      name: "VETERAN",
      description: [
        "Melee weapon Critical Strike chance is increased by <b>{{value}}%</b>.",
      ],
      color: "red",
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 2,
        label: "<b>{{value}}%</b> Critical Strike chance per level",
      },
    },
    TITAN_EDGE: {
      name: "TITAN EDGE",
      description: [
        "Two-Handed Greatsword damage is increased by <b>{{value}}%</b>.",
      ],
      color: "red",
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 5,
        label: "<b>{{value}}%</b> damage per level",
      },
    },
    SWIFT_BLADES: {
      name: "SWIFT BLADES",
      description: [
        "Increase the attack speed of all One-Handed Melee weapons by <b>15%</b>.",
      ],
      hasIcon: true,
      color: "red",
      cost: 5,
    },
    FEAST: {
      name: "FEAST",
      description: ["Meat now increases health by an additional 15%."],
      color: "red",
      cost: 3,
    },
    HEAVY_HANDED: {
      name: "HEAVY HANDED",
      description: [
        "Filling up enemy <i>Stun Bars</i> is increased by <b>{{value}}</b> when attacking blocking enemies with Melee weapons.",
        OVERPOWER,
      ],
      color: "red",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 10,
        label: "<b>{{value}}</b> effect per level",
      },
    },
    STEADFAST: {
      name: "STEADFAST",
      description: [
        "Defeating an enemy with a melee weapon restores <b>{{value}}</b> durability to that weapon.",
      ],
      color: "red",
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 1,
        label: "<b>{{value}}</b> durability per level",
      },
    },
    UPWARDS_SLASH_ATTACK: {
      name: "UPWARDS SLASH ATTACK",
      description: [
        "When equipped with a Melee weapon, launch a powerful upward strike during the ascent of your jump.",
        "Use this skill to rapidly close the distance on <b>flying</b> enemies.",
        "<b>Cost</b>: 25 Stamina",
      ],
      hasIcon: true,
      color: "red",
      cost: 3,
    },
    BREACH: {
      name: "BREACH",
      description: [
        "<b>Overpowered</b> enemies receive <b>+100%</b> increased Melee physical damage for <b>3</b> seconds.",
        OVERPOWER,
      ],
      color: "red",
      cost: 3,
    },
    RELENTLESS: {
      name: "RELENTLESS",
      description: [
        "Critical Strikes with Two-Handed weapons increase your Critical Strike chance by <b>8%</b> for the next hit.",
      ],
      color: "red",
      cost: 5,
    },
    BARBARIAN: {
      name: "BARBARIAN",
      description: [
        "Gain one point of Strength for every two levels of the Flame.",
      ],
      color: "red",
      cost: 5,
    },
    BLOOD_RAGE: {
      name: "BLOOD RAGE",
      description: [
        "When an enemy within <b>{{value}}</b> meters is killed by a Melee weapon, you fall into <b>Blood Rage</b>",
        BLOODRAGE,
      ],
      color: "red",
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 5,
        label: "<b>{{value}}</b> meters per level",
      },
    },
    VIGOROUS_DEFLECTION: {
      name: "VIGOROUS DEFLECTION",
      description: [
        "Succesfully parrying an enemy's attack restore <b>{{value}}</b> Stamina.",
        PARRY,
      ],
      color: "red",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 15,
        label: "<b>{{value}}</b> Stamina per level",
      },
    },
    BLOOD_WARRIOR: {
      name: "BLOOD WARRIOR",
      description: [
        "Defeating an enemy with a <b>Sneak Attack</b> or <b>Merciless Attack</b> spawns a Health Orb.",
        "Gathering an Orb restores <b>10%</b> of the respective resource.",
      ],
      color: "red",
      cost: 3,
    },
    WET_DOG: {
      name: "WET DOG",
      description: [
        "Weakens the effect of the <b>Wet</b> and <b>Soaked</b> debuffs.",
        "Stamina and Stamina Regeneration is reduced by <b>20%</b> instead of <b>30%</b>.",
        WET,
        SOAKED,
      ],
      color: "red",
      cost: 3,
    },
    SOAKED_DOG: {
      name: "SOAKED DOG",
      description: [
        "Weakens the effect of the <b>Wet</b> and <b>Soaked</b> debuffs.",
        "Stamina and Stamina Regeneration are reduced by <b>10%</b> instead of <b>20%</b>.",
        WET,
        SOAKED,
      ],
      color: "red",
      cost: 3,
    },
    SPLASH_DASH: {
      name: "SPLASH DASH",
      description: [
        "Allows you to perform an evasive dash while swimming or diving.",
        "<b>Cost</b>: 40 Stamina",
      ],
      hasIcon: true,
      color: "red",
      cost: 5,
    },
    FINESSE: {
      name: "FINESSE",
      description: [
        "Dealing damage with One-Handed Melee weapons and daggers has a <b>{{value}}%</b> chance to restore <b>1</b> durability to that weapon.",
      ],
      color: "red",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 10,
        label: "<b>{{value}}%</b> chance per level",
      },
    },
    JUMP_ATTACK_II: {
      name: "CRASH DOWN: FORCE",
      description: [
        "When attacking from a double jump, <b>Crash Down</b> deals <b>20%</b> more weapon damage.",
      ],
      color: "red",
      cost: 3,
    },
    BACKSTAB_MASTERY: {
      name: "BACKSTAB MASTERY",
      description: [
        "<b>Backstab</b> damage is increased by <b>{{value}}%</b>.",
      ],
      color: "green",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 20,
        label: "<b>{{value}}%</b> per level",
      },
    },
    RUNNER: {
      name: "RUNNER",
      description: [
        "Sprint Speed is increased by <b>{{value}}%</b> and Stamina cost while sprinting is decreased by <b>{{value2}}%</b>.",
      ],
      color: "green",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 5,
        value2: 5,
        label:
          "<b>{{value}}%</b> Speed and <b>{{value2}}%</b> cost reduction per level",
      },
    },
    WANDERLUST: {
      name: "WANDERLUST",
      description: [
        "Stamina cost for <b>sprinting on dirt roads</b> is reduced from <b>90% to 80%</b>. Stamina cost for <b>sprinting on stone roads</b> is reduced from <b>75% to 50%</b>.",
      ],
      color: "green",
      cost: 3,
    },
    GOOD_METABOLISM: {
      name: "GOOD METABOLISM",
      description: [
        "Health, Mana, and Stamina Orbs restore <b>30%</b> instead of <b>10%</b> of their respective resource.",
        "Health and Mana Potions restore <b>20%</b> more resources.",
      ],
      color: "green",
      cost: 3,
    },
    SWIFTSHOT_SUSTENANCE: {
      name: "SWIFTSHOT SUSTENANCE",
      description: [
        "Defeating an enemy with a Bow has a <b>{{value}}%</b> chance to spawn a Stamina Orb.",
        "Gathering an Orb restores <b>10%</b> of the respective resource.",
      ],
      color: "green",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 12,
        label: "<b>{{value}}%</b> chance per level",
      },
    },
    SWEET_TOOTH: {
      name: "SWEET TOOTH",
      description: [
        "Stamina Regeneration of sweets is increased by <b>50%</b>.",
      ],
      color: "green",
      cost: 3,
    },
    ARACHNOID: {
      name: "ARACHNOID",
      description: [
        "Stamina cost while climbing is reduced by <b>{{value}}%</b>.",
      ],
      color: "green",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 20,
        label: "<b>{{value}}%</b> cost reduction per level",
      },
    },
    REBOUND: {
      name: "REBOUND",
      description: [
        "Base Stamina Regeneration is increased <b>{{value}}%</b>.",
      ],
      color: "green",
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 10,
        label: "<b>{{value}}%</b> Stamina Regeneration per level",
      },
    },
    REBOUND_II: {
      name: "REBOUND",
      description: ["Increase base stamina regeneration by 50%"],
      color: "green",
      cost: 4,
    },
    INNER_FIRES: {
      name: "INNER FIRES",
      description: [
        "<i>Time in the Shroud</i> is increased by <b>{{value}} min</b>, allowing you to explore for longer.",
        SHROUD_TIME_TEXT,
      ],
      color: "green",
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 2,
        label: "<b>{{value}} min</b> per level",
      },
    },
    RELENTLESS_FLAME: {
      name: "RELENTLESS FLAME",
      description: [
        "Maximum <i>Shroud Time</i> increased by 5 minutes, allowing you to explore for longer.",
        SHROUD_TIME_TEXT,
      ],
      color: "green",
      cost: 4,
    },
    SNAKE_EATER: {
      name: "SNAKE EATER",
      description: [
        "Increases your <b>Poison Resistance</b> by <b>{{value}}%</b>, which reduces the amount of <b>Poison</b> damage received.",
      ],
      color: "green",
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 4,
        label: "<b>{{value}}%</b> Resistance per level",
      },
    },
    MITHRIDATIST: {
      name: "MITHRIDATIST",
      description: ["Gain a <b>25%</b> chance to avoid being poisoned."],
      color: "green",
      cost: 2,
    },
    DAGGER_MASTERY: {
      name: "DAGGER MASTERY",
      description: [
        "Increases damage dealt with daggers by <b>{{value}}%</b>.",
      ],
      color: "green",
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 5,
        label: "<b>{{value}}%</b> damage per level",
      },
    },
    SLICE_AND_DICE: {
      name: "SLICE AND DICE",
      description: [
        "After a Critical Strike with a Dagger, the base damage of your next Bow attack within 20 seconds is increased by <b>50%</b>.",
      ],
      color: "green",
      cost: 3,
    },
    VUKAH_LANGUAGE: {
      name: "VUKAH LANGUAGE",
      description: [
        "<b>Vukah</b> within <b>50</b> meters will no longer attack you unless provoked.",
      ],
      color: "green",
      cost: 3,
    },
    CALM_SPIRIT: {
      name: "CALM SPIRIT",
      description: [
        "<b>Wild Animals</b> within <b>50</b> meters will be no longer attack you unless provoked.",
        "Does not affect animals corrupted by the Shroud.",
      ],
      color: "green",
      cost: 3,
    },
    BEAST_MASTER: {
      name: "BEAST MASTER",
      description: [
        "When you are targeted by an attack, <b>Wild Animals</b> within <b>50</b> meters will attack the enemy.",
      ],
      color: "green",
      cost: 4,
    },
    VUKAH_CULTURE: {
      name: "VUKAH CULTURE",
      description: [
        "When you are targeted by an attack, <b>Vukah</b> within <b>50</b> meters will attack the enemy.",
      ],
      color: "green",
      cost: 4,
    },
    ENDURANCE_OF_THE_FLAME: {
      name: "ENDURANCE OF THE FLAME",
      description: [
        "Gain one point of Endurance for every two levels of the Flame.",
      ],
      color: "green",
      cost: 5,
    },
    MARKSMAN: {
      name: "MARKSMAN",
      description: ["Damage with Bows is increased by <b>{{value}}%</b>"],
      color: "green",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 5,
        label: "<b>{{value}}%</b> damage per level",
      },
    },
    SHARPSHOOTER: {
      name: "SHARPSHOOTER",
      description: ["All ranged damage is increased by an additional 20%"],
      color: "green",
      cost: 2,
    },
    COUNTER_BATTERY: {
      name: "COUNTER BATTERY",
      description: [
        "Damage against <b>ranged</b> enemies is increased by <b>{{value}}%</b>.",
      ],
      color: "green",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 8,
        label: "<b>{{value}}%</b> damage per level",
      },
    },
    EAGLES_BANE: {
      name: "EAGLES BANE",
      description: [
        "Damage against <b>flying</b> enemies is increased by <b>{{value}}%</b>.",
      ],
      color: "green",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 10,
        label: "<b>{{value}}%</b> damage per level",
      },
    },
    SKILL_SHOT: {
      name: "SKILL SHOT",
      description: [
        "<b>Skillshot</b> damage is increased by <b>{{value}}%</b>.",
        SKILLSHOT,
      ],
      color: "green",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 20,
        label: "<b>{{value}}%</b> damage per level",
      },
    },
    RANGER: {
      name: "RANGER",
      description: [
        "Increases your Dexterity and Endurace attributes by <b>{{value}}</b>.",
        "Base Stamina Regeneration is increased by <b>{{value2}}</b>,",
      ],
      color: "green",
      cost: 2,
      stats: {
        DEX: 1,
        ENDURANCE: 1,
      },
      maxLevel: 3,
      perLevel: {
        value: 1,
        value2: 5,
        label: "<b>{{value}}</b> Dexterity and Endurance per level.\n<b>{{value2}}</b> Stamina Regeneration per level"
      }
    },
    SILENT_STRIDE: {
      name: "SILENT STRIDE",
      description: [
        "Increases your movement speed while <b>sneaking</b> by <b>{{value}}%</b>.",
      ],
      color: "green",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 20,
        label: "<b>{{value}}%</b> movement speed per level",
      },
    },
    KICK: {
      name: "KICK",
      description: [
        "When equipped with a Melee weapon you can perform a Kick by attacking while blocking.",
        "Kick deals little damage but hits the target with massive force and pushes them back, filling their <i>Stun Bar</i>.",
        "<i>Stun Bar</i> increase scales with Dexterity. Stun time depends on the enemy's size.",
        OVERPOWER,
      ],
      color: "green",
      hasIcon: true,
      cost: 3,
    },
    AIRBORNE: {
      name: "AIRBORNE",
      description: ["Gliders consume <b>{{value}}%</b> less Stamina"],
      color: "green",
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 12,
        label: "<b>{{value}}%</b> cost reduction per level",
      },
    },
    SNIPER: {
      name: "SNIPER",
      description: [
        "Ranged weapon Critical Strike chance is increased by <b>{{value}}%</b>.",
      ],
      color: "green",
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 2,
        label: "<b>{{value}}%</b> Critical Strike chance per level",
      },
    },
    VITALITY_SURGE: {
      name: "VITALITY SURGE",
      description: [
        "Critical Strikea with Ranged weapons restore <b>{{value}}</b> Stamina.",
      ],
      color: "green",
      cost: 3,
      maxLevel: 3,
      perLevel: {
        value: 3,
        label: "<b>{{value}}</b> Stamina per level",
      },
    },
    BLESSED_ARROWS: {
      name: "BLESSED ARROWS",
      description: ["Critical Strikes with Bowsrestore <b>{{value}}</b> mana."],
      color: "green",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 8,
        label: "<b>{{value}}</b> mana per level",
      },
    },
    BOUNTY_BONANZA: {
      name: "BOUNTY BONANZA",
      description: [
        "After defeating a <b>Fell</b> enemy with a <b>Skillshot</b>, your group gains an additional <b>+5</b> Experience Points.",
        SKILLSHOT,
      ],
      color: "green",
      cost: 2,
    },
    RICOCHETS: {
      name: "RICOCHETS",
      description: [
        "For every target you hit with an <b>Explosive Arrow</b>, its damage is increased by <b>1%</b>.",
      ],
      color: "green",
      cost: 4,
    },
    GRACEFUL_STRIDE: {
      name: "GRACEFUL STRIDE",
      description: [
        "Gain one point of Dexterity for every two levels of the Flame.",
      ],
      color: "green",
      cost: 5,
    },
    CHAIN_REACTION: {
      name: "CHAIN REACTION",
      description: [
        "Every enemy hit with an <b>Explosive Arrow</b> has a <b>20%</b> chance to trigger a secondary explosion for <b>50%</b> damage in a small radius.",
      ],
      color: "green",
      cost: 5,
    },
    ARCANE_CONCENTRATION: {
      name: "ARCANE CONCENTRATION",
      description: [
        "Gain one point of Spirit for every two levels of the Flame.",
      ],
      color: "blue",
      cost: 5,
    },
    EXALTED: {
      name: "EXALTED",
      description: [
        "Gain one point of Intelligence for every two levels of the Flame.",
      ],
      color: "blue",
      cost: 5,
    },
    THICK_SKIN: {
      name: "THICK SKIN",
      description: [
        "Gain one point of Constitution for every two levels of the Flame.",
      ],
      color: "red",
      cost: 5,
    },
    LIFE_ESSENCES: {
      name: "LIFE ESSENCES",
      description: [
        "Increase your maximum Health by <b>{{value}}</b> times your Intelligence attribute.",
      ],
      color: "blue",
      hasIcon: true,
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 2,
        label: "<b>{{value}}</b> times per level",
      },
    },
    POISONED_BLADES: {
      name: "VENOMOUS BLADES",
      description: [
        "Increases the chance to poison enemies to <b>25%</b> when using Daggers with the <b>Venomous Blades</b> perk.",
      ],
      color: "green",
      cost: 3,
    },
    POISON_MASTERY: {
      name: "VENOM MASTERY",
      description: [
        "Increases the damage dealt with the <b>Venomous Blades</b> Dagger perk by <b>100%</b>.",
      ],
      color: "green",
      cost: 4,
    },
    QUICK_REFLEX_BLOCK: {
      name: "QUICK REFLEX BLOCK",
      description: [
        "Briefly enhances your block value when blocking with Daggers, ensuring a near-miss parry reduces stamina minimally.",
      ],
      color: "green",
      cost: 3,
    },
    EXPOSE_WEAKNESS: {
      name: "EXPOSE WEAKNESS",
      description: [
        "Critical Strikes with Daggers increase damage dealt to the enemy by <b>25%</b> for <b>5</b> seconds.",
      ],
      color: "green",
      cost: 4,
    },
    BARBARIAN_PATH: {
      name: "Barbarian's Path",
      description: [
        "Two-Handed Melee weapon damage is increased by <b>{{value}}</b>.",
      ],
      color: "red",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 5,
        label: "<b>{{value}}</b>% damage per level",
      },
    },
    TWO_HANDED_SPECIALIZATION: {
      name: "Two-Handed Specialization",
      description: [
        "Unlocks Special Abilities of Two-Handed Melee weapons.\n" +
        UNLEASH_FOCUS,
        FOCUS,
      ],
      color: "red",
      cost: 3,
    },
    ATHLETE: {
      description: [
        "Increases your maximum Health by <b>{{value}}</b> times your Strength attribute.",
      ],
      color: "red",
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 2,
        label: "<b>{{value}}</b> times per level",
      },
    },
    STRATEGIC_MANEUVER: {
      description: [
        "Replaces the Dodge Roll ability with a sideways Dodge Roll while an enemy target is locked.",
        "Use it to roll around your enemies, making it easier to flank them or deliver backstabs.",
        "Blink replaces the sideways Dodge Roll of the Strategic Maneuver skill.",
        "<b>Cost:</b> 20 Stamina",
      ],
      color: "green",
      cost: 1,
    },
    PRIMAL_FORCE: {
      description: ["Damage against Vukah is increased by <b>{{value}}</b>."],
      color: "green",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 5,
        label: "<b>{{value}}</b>% damage per level",
      },
    },
    CULL_THE_HERD: {
      description: [
        "Damage against Wildlife is increased by <b>{{value}}</b>.",
      ],
      color: "green",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 5,
        label: "<b>{{value}}</b>% damage per level",
      },
    },
    FATAL_PRECISION: {
      description: [
        "Critical Strike chance is increased by <b>{{value}}</b>.\nCritical Strike damage is increased by <b>{{value2}}</b>.",
      ],
      color: "green",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 1,
        value2: 5,
        label:
          "<b>{{value}}</b>% Critical Strike chance and <b>{{value2}}</b>% Critical Strike damage per level",
      },
    },
    BOW_SPECIALIZATION: {
      description: [
        "Unlocks Special Abilities of Bows.\n" + UNLEASH_FOCUS,
        FOCUS,
      ],
      color: "green",
      cost: 3,
    },
    CUTTHROAT: {
      description: ["Sneak Attack Damage is increased by <b>{{value}}</b>."],
      color: "green",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 100,
        label: "<b>{{value}}</b>% damage per level",
      },
    },
    DAGGER_SPECIALIZATION: {
      description: [
        "Unlocks Special Abilities of Daggers.\n" + UNLEASH_FOCUS,
        FOCUS,
      ],
      color: "green",
      cost: 3,
    },
    VEILED_VIGOR: {
      description: [
        "Increases your maximum Health by <b>{{value}}</b> times your Dexterity attribute.",
      ],
      color: "green",
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 2,
        label: "<b>{{value}}</b> times per level",
      },
    },
    VILE_CONCOCTION: {
      description: ["Throwable damage is increased by <b>{{value}}%</b>."],
      color: "green",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 12,
        label: "<b>{{value}}</b>% damage per level",
      },
    },
    MANA_CURRENTS: {
      description: ["Base Mana Regeneration is increased by <b>{{value}}</b>."],
      color: "blue",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 3,
        label: "<b>{{value}}</b> Mana Regeneration per level",
      },
    },
    SLEIGHT_OF_HAND: {
      name: "Sleight of Hand",
      description: ["Unarmed damage is increased by <b>{{value}}%</b>."],
      color: "blue",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 30,
        label: "<b>{{value}}</b>% damage per level",
      },
    },
    SPELLSLINGER: {
      description: ["Staff damage is increased by <b>{{value}}%</b>."],
      color: "blue",
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 5,
        label: "<b>{{value}}</b>% damage per level",
      },
    },
    MAGE_APPRENTICE: {
      description: ["Magic weapon damage is increased by <b>{{value}}%</b>."],
      color: "blue",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 5,
        label: "<b>{{value}}</b>% damage per level",
      },
    },
    BONE_TO_ASH: {
      description: ["Damage against Hollow is increased by <b>{{value}}%</b>."],
      color: "blue",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 5,
        label: "<b>{{value}}</b>% damage per level",
      },
    },
    HEALER_REVIVE: {
      description: [
        "Revive players with <b>{{value}}%</b> increased Health.",
        "Default Health of revived players is <b>10%</b>",
      ],
      color: "blue",
      cost: 1,
      maxLevel: 3,
      perLevel: {
        value: 8,
        label: "<b>{{value}}</b>% damage per level",
      },
    },
    WAND_SPECIALIZATION: {
      description: [
        "Unlobkc Special Abilities of Wands.\n" + UNLEASH_FOCUS,
        FOCUS,
      ],
      color: "blue",
      cost: 3,
    },
    WAND_MASTERY: {
      description: ["Wand damage is increased by <b>{{value}}%</b>."],
      color: "blue",
      cost: 2,
      maxLevel: 3,
      perLevel: {
        value: 5,
        label: "<b>{{value}}</b>% damage per level",
      },
    },
  },
  nodes: {
    "1": {
      type: "OPPORTUNITY",
      tier: "medium",
      distance: BASE_INNER,
      angle: Q12,
    },
    "2": {
      type: "POWER_PARRY",
      base: true,
      tier: "medium",
      distance: BASE_INNER,
      angle: Q1,
    },
    "3": {
      type: "MERCILESS_ATTACK",
      base: true,
      tier: "large",
      distance: BASE_INNER,
      angle: Q2,
    },
    "4": {
      type: "MASON",
      base: true,
      tier: "medium",
      distance: BASE_INNER,
      angle: Q3,
    },
    "5": {
      type: "PICKAXE_SPECIALIZATION",
      tier: "large",
      distance: BASE_INNER - 1 * BASE_DIST,
      angle: Q3,
    },
    "6": {
      type: "PROSPECTOR",
      tier: "medium",
      distance: BASE_INNER,
      angle: Q4,
    },
    "7": {
      type: "MINER",
      tier: "medium",
      distance: BASE_INNER - BASE_DIST,
      angle: Q4 + BASE_ANGLE_DIST / 2,
    },
    "8": {
      type: "QUALITY_GEAR",
      tier: "medium",
      distance: BASE_INNER,
      angle: Q5,
    },
    "9": {
      type: "LUMBERJACK",
      base: true,
      tier: "medium",
      distance: BASE_INNER,
      angle: Q6,
    },
    "10": {
      type: "FELLING_AXE_SPECIALIZATION",
      tier: "large",
      distance: BASE_INNER - BASE_DIST,
      angle: Q6,
    },
    "11": {
      type: "FISHERMANS_RESOLVE",
      base: true,
      tier: "medium",
      distance: BASE_INNER,
      angle: Q7,
    },
    "12": {
      type: "DOUBLE_JUMP",
      base: true,
      tier: "large",
      distance: BASE_INNER,
      angle: Q8,
    },
    "13": {
      type: "WELL_RESTED",
      base: true,
      tier: "medium",
      distance: BASE_INNER,
      angle: Q9,
    },
    "14": {
      type: "GIANT_SLAYER_HOOK",
      base: true,
      tier: "large",
      distance: BASE_INNER,
      angle: Q10,
    },
    "15": {
      type: "SAVIOUR",
      base: true,
      tier: "medium",
      distance: BASE_INNER,
      angle: Q11,
    },
    "16": {
      type: "GROUNDING_HOOK",
      tier: "large",
      distance: BASE_INNER - BASE_DIST,
      angle: Q11,
    },
    "17": {
      type: "ATTR_CONS",
      tier: "small",
      base: true,
      angle: Q1,
    },
    "18": {
      type: "HEAVY_PLATES",
      tier: "medium",
      distance: BASE_OUTER + BASE_DIST,
      angle: Q1,
    },
    "19": {
      type: "ONE_HANDED_SPECIALIZATION",
      tier: "large",
      distance: BASE_OUTER + 2 * BASE_DIST,
      angle: Q1 + BASE_ANGLE_DIST / 2,
    },
    "20": {
      type: "SHINY_PLATES",
      tier: "medium",
      distance: BASE_OUTER + 3 * BASE_DIST,
      angle: Q1 + BASE_ANGLE_DIST / 4,
    },
    "21": {
      type: "PURIFICATION",
      tier: "medium",
      distance: BASE_OUTER + 3 * BASE_DIST,
      angle: Q1 - BASE_ANGLE_DIST / 4,
    },
    "22": {
      type: "ATTR_CONS",
      tier: "small",
      distance: BASE_OUTER + 4 * BASE_DIST,
      angle: Q1,
    },
    "23": {
      type: "TOWER",
      tier: "medium",
      distance: BASE_OUTER + 4 * BASE_DIST,
      angle: Q1 + BASE_ANGLE_DIST / 3,
    },
    "24": {
      type: "WARDEN",
      tier: "medium",
      distance: BASE_OUTER + 4 * BASE_DIST,
      angle: Q1 - BASE_ANGLE_DIST / 3,
    },
    "25": {
      type: "SOUL_LEECH",
      tier: "medium",
      distance: BASE_OUTER + 5 * BASE_DIST,
      angle: Q1 + BASE_ANGLE_DIST / 3,
    },
    "26": {
      type: "SNAP",
      tier: "medium",
      distance: BASE_OUTER + 5 * BASE_DIST,
      angle: Q1,
    },
    "27": {
      type: "ABSORB",
      tier: "medium",
      distance: BASE_OUTER + 5 * BASE_DIST,
      angle: Q1 - BASE_ANGLE_DIST / 3,
    },
    "28": {
      type: "ATTR_STR",
      tier: "small",
      distance: BASE_OUTER + 6 * BASE_DIST,
      angle: Q1 + BASE_ANGLE_DIST / 3,
    },
    "29": {
      type: "ATTR_CONS",
      tier: "small",
      distance: BASE_OUTER + 6 * BASE_DIST,
      angle: Q1,
    },
    "30": {
      type: "ATTR_CONS",
      tier: "small",
      distance: BASE_OUTER + 6 * BASE_DIST,
      angle: Q1 - BASE_ANGLE_DIST / 3,
    },
    "31": {
      type: "THICK_SKIN",
      tier: "small",
      distance: BASE_OUTER + 7 * BASE_DIST,
      angle: Q1,
    },
    "32": {
      type: "NEMESIS",
      tier: "large",
      distance: BASE_OUTER + 7.5 * BASE_DIST,
      angle: Q1 + BASE_ANGLE_DIST / 5,
    },
    "33": {
      type: "EARTH_AURA",
      tier: "large",
      distance: BASE_OUTER + 8.5 * BASE_DIST,
      angle: Q1,
    },
    "34": {
      type: "MARTYR",
      tier: "large",
      distance: BASE_OUTER + 7.5 * BASE_DIST,
      angle: Q1 - BASE_ANGLE_DIST / 5,
    },
    "35": {
      type: "ATTR_CONS",
      tier: "small",
      base: true,
      angle: Q2,
    },
    "36": {
      type: "WARRIOR_PATH",
      tier: "medium",
      distance: BASE_OUTER + BASE_DIST,
      angle: Q2,
    },
    "37": {
      type: "HEAVY_HANDED",
      tier: "medium",
      distance: BASE_OUTER + 1.5 * BASE_DIST,
      angle: Q2 + BASE_ANGLE_DIST / 2,
    },
    "38": {
      type: "ATTR_STR",
      tier: "small",
      distance: BASE_OUTER + 2 * BASE_DIST,
      angle: Q2,
    },
    "39": {
      type: "SLASHER",
      tier: "medium",
      distance: BASE_OUTER + 3 * BASE_DIST,
      angle: Q2 + BASE_ANGLE_DIST / 4,
    },
    "40": {
      type: "BATTLE_HEAL",
      tier: "medium",
      distance: BASE_OUTER + 3 * BASE_DIST,
      angle: Q2,
    },
    "41": {
      type: "THRUST",
      tier: "medium",
      distance: BASE_OUTER + 3 * BASE_DIST,
      angle: Q2 - BASE_ANGLE_DIST / 4,
    },
    "42": {
      type: "VETERAN",
      tier: "medium",
      distance: BASE_OUTER + 4.25 * BASE_DIST,
      angle: Q2,
    },
    "43": {
      type: "ATTR_CONS",
      tier: "small",
      distance: BASE_OUTER + 5 * BASE_DIST,
      angle: Q2 + BASE_ANGLE_DIST / 6,
    },
    "44": {
      type: "ATTR_STR",
      tier: "small",
      distance: BASE_OUTER + 5 * BASE_DIST,
      angle: Q2 - BASE_ANGLE_DIST / 6,
    },
    "45": {
      type: "SWIFT_BLADES",
      tier: "large",
      distance: BASE_OUTER + 6 * BASE_DIST,
      angle: Q2,
    },
    "46": {
      type: "ATTR_CONS",
      tier: "small",
      distance: BASE_OUTER + 7.25 * BASE_DIST,
      angle: Q2,
    },
    "47": {
      type: "ATTR_STR",
      tier: "small",
      distance: BASE_OUTER + 8.25 * BASE_DIST,
      angle: Q2,
    },
    "48": {
      type: "BASH",
      tier: "large",
      distance: BASE_OUTER + 4 * BASE_DIST - 10,
      angle: Q2 + BASE_ANGLE_DIST / 2,
    },
    "49": {
      type: "BREACH",
      tier: "medium",
      distance: BASE_OUTER + 5 * BASE_DIST,
      angle: Q2 + BASE_ANGLE_DIST / 2,
    },
    "50": {
      type: "SHOCKWAVE",
      tier: "large",
      distance: BASE_OUTER + 6 * BASE_DIST + 10,
      angle: Q2 + BASE_ANGLE_DIST / 2,
    },
    "51": {
      type: "ATTR_CONS",
      tier: "small",
      distance: BASE_OUTER + 5 * BASE_DIST,
      angle: Q2 + BASE_ANGLE_DIST / 2 - 5,
    },
    "52": {
      type: "ATTR_STR",
      tier: "small",
      distance: BASE_OUTER + 5 * BASE_DIST,
      angle: Q2 + BASE_ANGLE_DIST / 2 + 5,
    },
    "53": {
      type: "ATTR_STR",
      tier: "small",
      base: true,
      angle: Q3,
    },
    "54": {
      type: "BARBARIAN_PATH",
      tier: "medium",
      distance: BASE_OUTER + BASE_DIST,
      angle: Q3,
    },
    "67": {
      type: "STEADFAST",
      tier: "medium",
      distance: BASE_OUTER + 2 * BASE_DIST,
      angle: Q3 + BASE_ANGLE_DIST / 2,
    },
    "55": {
      type: "ATTR_CONS",
      tier: "small",
      distance: BASE_OUTER + 2 * BASE_DIST,
      angle: Q3,
    },
    "56": {
      type: "ATTR_CONS",
      tier: "small",
      distance: BASE_OUTER + 3 * BASE_DIST,
      angle: Q3 + BASE_ANGLE_DIST / 6,
    },
    "57": {
      type: "ATTR_STR",
      tier: "small",
      distance: BASE_OUTER + 3 * BASE_DIST,
      angle: Q3 - BASE_ANGLE_DIST / 6,
    },
    "58": {
      type: "TWO_HANDED_SPECIALIZATION",
      tier: "large",
      distance: BASE_OUTER + 3.5 * BASE_DIST,
      angle: Q3,
    },
    "59": {
      type: "RELENTLESS",
      tier: "medium",
      distance: BASE_OUTER + 4.75 * BASE_DIST,
      angle: Q3,
    },
    "60": {
      type: "TITAN_EDGE",
      tier: "medium",
      distance: BASE_OUTER + 6 * BASE_DIST,
      angle: Q3 + BASE_ANGLE_DIST / 6,
    },
    "61": {
      type: "BRUTE",
      tier: "medium",
      distance: BASE_OUTER + 6 * BASE_DIST,
      angle: Q3 - BASE_ANGLE_DIST / 6,
    },
    "62": {
      type: "BLOOD_RAGE",
      tier: "medium",
      distance: BASE_OUTER + 7 * BASE_DIST,
      angle: Q3,
    },
    "63": {
      type: "WHIRLWIND_CRESCENDO",
      tier: "large",
      distance: BASE_OUTER + 8 * BASE_DIST,
      angle: Q3 + BASE_ANGLE_DIST / 6,
    },
    "64": {
      type: "BARBARIAN",
      tier: "small",
      distance: BASE_OUTER + 8 * BASE_DIST,
      angle: Q3,
    },
    "65": {
      type: "HEAVY_SPECIALIZATION",
      tier: "large",
      distance: BASE_OUTER + 8 * BASE_DIST,
      angle: Q3 - BASE_ANGLE_DIST / 6,
    },
    "66": {
      type: "ATTR_STR",
      tier: "small",
      distance: BASE_OUTER + 9 * BASE_DIST,
      angle: Q3,
    },
    "68": {
      type: "ATTR_STR",
      tier: "small",
      base: true,
      angle: Q4,
    },
    "69": {
      type: "WET_DOG",
      tier: "medium",
      distance: BASE_OUTER + BASE_DIST,
      angle: Q4,
    },
    "70": {
      type: "FINESSE",
      tier: "medium",
      distance: BASE_OUTER + 2 * BASE_DIST,
      angle: Q4 + BASE_ANGLE_DIST / 2,
    },
    "71": {
      type: "SOAKED_DOG",
      tier: "medium",
      distance: BASE_OUTER + 2.5 * BASE_DIST,
      angle: Q4,
    },
    "72": {
      type: "ATTR_STR",
      tier: "small",
      distance: BASE_OUTER + 3 * BASE_DIST,
      angle: Q4 + BASE_ANGLE_DIST / 5,
    },
    "73": {
      type: "ATTR_CONS",
      tier: "small",
      distance: BASE_OUTER + 3 * BASE_DIST,
      angle: Q4 - BASE_ANGLE_DIST / 5,
    },
    "74": {
      type: "CRASH_DOWN_ATTACK",
      tier: "large",
      distance: BASE_OUTER + 4 * BASE_DIST,
      angle: Q4,
    },
    "75": {
      type: "ATTR_STR",
      tier: "small",
      distance: BASE_OUTER + 5 * BASE_DIST,
      angle: Q4 + BASE_ANGLE_DIST / 5,
    },
    "76": {
      type: "VIGOROUS_DEFLECTION",
      tier: "medium",
      distance: BASE_OUTER + 5 * BASE_DIST,
      angle: Q4 - BASE_ANGLE_DIST / 5,
    },
    "77": {
      type: "CRASH_DOWN_FORCE",
      tier: "medium",
      distance: BASE_OUTER + 5.25 * BASE_DIST,
      angle: Q4,
    },
    "78": {
      type: "UPWARDS_SLASH_ATTACK",
      tier: "large",
      distance: BASE_OUTER + 6 * BASE_DIST,
      angle: Q4 + BASE_ANGLE_DIST / 3,
    },
    "79": {
      type: "ATHLETE",
      tier: "large",
      distance: BASE_OUTER + 6.5 * BASE_DIST,
      angle: Q4,
    },
    "80": {
      type: "BLOOD_WARRIOR",
      tier: "medium",
      distance: BASE_OUTER + 6 * BASE_DIST,
      angle: Q4 - BASE_ANGLE_DIST / 3,
    },
    "81": {
      type: "SPLASH_DASH",
      tier: "large",
      distance: BASE_OUTER + 8 * BASE_DIST,
      angle: Q4,
    },
    "82": {
      type: "ATTR_ENDURANCE",
      tier: "small",
      base: true,
      angle: Q5,
    },
    "83": {
      type: "RUNNER",
      tier: "medium",
      distance: BASE_OUTER + BASE_DIST,
      angle: Q5,
    },
    "84": {
      type: "INNER_FIRES",
      tier: "medium",
      distance: BASE_OUTER + 2 * BASE_DIST,
      angle: Q5 + BASE_ANGLE_DIST / 2,
    },
    "85": {
      type: "KICK",
      tier: "large",
      distance: BASE_OUTER + 3 * BASE_DIST,
      angle: Q5 + BASE_ANGLE_DIST / 2,
    },
    "86": {
      type: "WANDERLUST",
      tier: "medium",
      distance: BASE_OUTER + 2.5 * BASE_DIST,
      angle: Q5 + BASE_ANGLE_DIST / 5,
    },
    "87": {
      type: "ATTR_ENDURANCE",
      tier: "small",
      distance: BASE_OUTER + 2.5 * BASE_DIST,
      angle: Q5,
    },
    "88": {
      type: "ARACHNOID",
      tier: "medium",
      distance: BASE_OUTER + 2.5 * BASE_DIST,
      angle: Q5 - BASE_ANGLE_DIST / 5,
    },
    "89": {
      type: "GOOD_METABOLISM",
      tier: "medium",
      distance: BASE_OUTER + 4 * BASE_DIST,
      angle: Q5 + BASE_ANGLE_DIST / 5,
    },
    "90": {
      type: "REBOUND",
      tier: "medium",
      distance: BASE_OUTER + 3.5 * BASE_DIST,
      angle: Q5,
    },
    "91": {
      type: "SWIFTSHOT_SUSTENANCE",
      tier: "medium",
      distance: BASE_OUTER + 4 * BASE_DIST,
      angle: Q5 - BASE_ANGLE_DIST / 5,
    },
    "92": {
      type: "ATTR_DEX",
      tier: "small",
      distance: BASE_OUTER + 5 * BASE_DIST,
      angle: Q5,
    },
    "93": {
      type: "DESSERT_STOMACH",
      tier: "large",
      distance: BASE_OUTER + 6 * BASE_DIST,
      angle: Q5,
    },
    "94": {
      type: "SWEET_TOOTH",
      tier: "medium",
      distance: BASE_OUTER + 6 * BASE_DIST,
      angle: Q5 + BASE_ANGLE_DIST / 5,
    },
    "95": {
      type: "LAST_MEAL",
      tier: "medium",
      distance: BASE_OUTER + 7 * BASE_DIST,
      angle: Q5 + BASE_ANGLE_DIST / 5,
    },
    "96": {
      type: "ATTR_ENDURANCE",
      tier: "small",
      distance: BASE_OUTER + 7 * BASE_DIST,
      angle: Q5,
    },
    "97": {
      type: "STRATEGIC_MANEUVER",
      tier: "large",
      distance: BASE_OUTER + 7 * BASE_DIST,
      angle: Q5 - BASE_ANGLE_DIST / 3,
    },
    "98": {
      type: "ATTR_ENDURANCE",
      tier: "small",
      base: true,
      angle: Q6,
    },
    "99": {
      type: "MITHRIDATIST",
      tier: "medium",
      distance: BASE_OUTER + BASE_DIST,
      angle: Q6,
    },
    "100": {
      type: "EAGLE_EYE",
      tier: "large",
      distance: BASE_OUTER + 2 * BASE_DIST,
      angle: Q6 + BASE_ANGLE_DIST / 2,
    },
    "101": {
      type: "SNAKE_EATER",
      tier: "medium",
      distance: BASE_OUTER + 2 * BASE_DIST,
      angle: Q6 + BASE_ANGLE_DIST / 6,
    },
    "102": {
      type: "ATTR_ENDURANCE",
      tier: "small",
      distance: BASE_OUTER + 3 * BASE_DIST,
      angle: Q6,
    },
    "103": {
      type: "BOUNTY_BONANZA",
      tier: "medium",
      distance: BASE_OUTER + 4 * BASE_DIST,
      angle: Q6 + BASE_ANGLE_DIST / 5,
    },
    "104": {
      type: "ATTR_DEX",
      tier: "small",
      distance: BASE_OUTER + 4 * BASE_DIST,
      angle: Q6 - BASE_ANGLE_DIST / 5,
    },
    "105": {
      type: "ATTR_ENDURANCE",
      tier: "small",
      distance: BASE_OUTER + 5 * BASE_DIST,
      angle: Q6,
    },
    "106": {
      type: "PRIMAL_FORCE",
      tier: "medium",
      distance: BASE_OUTER + 5.25 * BASE_DIST,
      angle: Q6 + BASE_ANGLE_DIST / 5,
    },
    "107": {
      type: "CULL_THE_HERD",
      tier: "medium",
      distance: BASE_OUTER + 5.25 * BASE_DIST,
      angle: Q6 - BASE_ANGLE_DIST / 5,
    },
    "108": {
      type: "VUKAH_LANGUAGE",
      tier: "medium",
      distance: BASE_OUTER + 7 * BASE_DIST,
      angle: Q6 + BASE_ANGLE_DIST / 5,
    },
    "109": {
      type: "VUKAH_CULTURE",
      tier: "medium",
      distance: BASE_OUTER + 8 * BASE_DIST,
      angle: Q6 + BASE_ANGLE_DIST / 3,
    },
    "110": {
      type: "ENDURANCE_OF_THE_FLAME",
      tier: "small",
      distance: BASE_OUTER + 7 * BASE_DIST,
      angle: Q6,
    },
    "111": {
      type: "ATTR_DEX",
      tier: "small",
      distance: BASE_OUTER + 8 * BASE_DIST,
      angle: Q6,
    },
    "112": {
      type: "CALM_SPIRIT",
      tier: "medium",
      distance: BASE_OUTER + 7 * BASE_DIST,
      angle: Q6 - BASE_ANGLE_DIST / 5,
    },
    "113": {
      type: "BEAST_MASTER",
      tier: "medium",
      distance: BASE_OUTER + 8 * BASE_DIST,
      angle: Q6 - BASE_ANGLE_DIST / 3,
    },
    "114": {
      type: "ATTR_DEX",
      tier: "small",
      base: true,
      angle: Q7,
    },
    "115": {
      type: "MARKSMAN",
      tier: "medium",
      distance: BASE_OUTER + BASE_DIST,
      angle: Q7,
    },
    "116": {
      type: "SILENT_STRIDE",
      tier: "medium",
      distance: BASE_OUTER + 2 * BASE_DIST,
      angle: Q7 + BASE_ANGLE_DIST / 2,
    },
    "117": {
      type: "SNIPER",
      tier: "medium",
      distance: BASE_OUTER + 3 * BASE_DIST,
      angle: Q7 + BASE_ANGLE_DIST / 6,
    },
    "118": {
      type: "COUNTER_BATTERY",
      tier: "medium",
      distance: BASE_OUTER + 3 * BASE_DIST,
      angle: Q7 - BASE_ANGLE_DIST / 6,
    },
    "119": {
      type: "VITALITY_SURGE",
      tier: "medium",
      distance: BASE_OUTER + 5 * BASE_DIST,
      angle: Q7 + BASE_ANGLE_DIST / 6,
    },
    "120": {
      type: "SKILL_SHOT",
      tier: "medium",
      distance: BASE_OUTER + 5 * BASE_DIST,
      angle: Q7 - BASE_ANGLE_DIST / 6,
    },
    "121": {
      type: "FATAL_PRECISION",
      tier: "medium",
      distance: BASE_OUTER + 5.5 * BASE_DIST,
      angle: Q7 + BASE_ANGLE_DIST / 2,
    },
    "122": {
      type: "BOW_SPECIALIZATION",
      tier: "large",
      distance: BASE_OUTER + 5.5 * BASE_DIST,
      angle: Q7,
    },
    "123": {
      type: "BEE_STING",
      tier: "large",
      distance: BASE_OUTER + 5.5 * BASE_DIST,
      angle: Q7 - BASE_ANGLE_DIST / 2,
    },
    "124": {
      type: "BLESSED_ARROWS",
      tier: "medium",
      distance: BASE_OUTER + 6 * BASE_DIST,
      angle: Q7 + BASE_ANGLE_DIST / 6,
    },
    "125": {
      type: "EAGLES_BANE",
      tier: "medium",
      distance: BASE_OUTER + 6 * BASE_DIST,
      angle: Q7 - BASE_ANGLE_DIST / 6,
    },
    "126": {
      type: "RANGER",
      tier: "medium",
      distance: BASE_OUTER + 7 * BASE_DIST,
      angle: Q7,
    },
    "127": {
      type: "ATTR_DEX",
      tier: "small",
      distance: BASE_OUTER + 7.5 * BASE_DIST,
      angle: Q7 + BASE_ANGLE_DIST / 4,
    },
    "128": {
      type: "MULTI_SHOT",
      tier: "large",
      distance: BASE_OUTER + 7.5 * BASE_DIST,
      angle: Q7 - BASE_ANGLE_DIST / 4,
    },
    "129": {
      type: "RICOCHETS",
      tier: "medium",
      distance: BASE_OUTER + 8.5 * BASE_DIST,
      angle: Q7 + BASE_ANGLE_DIST / 3,
    },
    "130": {
      type: "CHAIN_REACTION",
      tier: "medium",
      distance: BASE_OUTER + 8.35 * BASE_DIST,
      angle: Q7 + 1.5,
    },
    "131": {
      type: "MULTI_SHOT_TRIGGER",
      tier: "medium",
      distance: BASE_OUTER + 8.35 * BASE_DIST,
      angle: Q7 - 1.5,
    },
    "132": {
      type: "MULTI_SHOT_SPREAD",
      tier: "medium",
      distance: BASE_OUTER + 8.5 * BASE_DIST,
      angle: Q7 - BASE_ANGLE_DIST / 3,
    },
    "133": {
      type: "ATTR_DEX",
      tier: "small",
      base: true,
      angle: Q8,
    },
    "134": {
      type: "AIRBORNE",
      tier: "medium",
      distance: BASE_OUTER + BASE_DIST,
      angle: Q8,
    },
    "135": {
      type: "UPDRAFT",
      tier: "large",
      distance: BASE_OUTER + 2 * BASE_DIST,
      angle: Q8 + BASE_ANGLE_DIST / 2,
    },
    "136": {
      type: "ATTR_ENDURANCE",
      tier: "small",
      distance: BASE_OUTER + 2 * BASE_DIST,
      angle: Q8,
    },
    "137": {
      type: "QUICK_REFLEX_BLOCK",
      tier: "medium",
      distance: BASE_OUTER + 3 * BASE_DIST,
      angle: Q8 + BASE_ANGLE_DIST / 5,
    },
    "138": {
      type: "SNEAK_ATTACK",
      tier: "large",
      distance: BASE_OUTER + 3 * BASE_DIST,
      angle: Q8 - BASE_ANGLE_DIST / 5,
    },
    "139": {
      type: "CUTTHROAT",
      tier: "medium",
      distance: BASE_OUTER + 3 * BASE_DIST,
      angle: Q8 - BASE_ANGLE_DIST / 2,
    },
    "140": {
      type: "DAGGER_SPECIALIZATION",
      tier: "large",
      distance: BASE_OUTER + 4 * BASE_DIST,
      angle: Q8 + BASE_ANGLE_DIST / 3,
    },
    "141": {
      type: "ATTR_DEX",
      tier: "small",
      distance: BASE_OUTER + 4 * BASE_DIST,
      angle: Q8,
    },
    "142": {
      type: "BACKSTAB_MASTERY",
      tier: "medium",
      distance: BASE_OUTER + 4 * BASE_DIST,
      angle: Q8 - BASE_ANGLE_DIST / 3,
    },
    "143": {
      type: "VEILED_VIGOR",
      tier: "large",
      distance: BASE_OUTER + 5 * BASE_DIST,
      angle: Q8,
    },
    "144": {
      type: "ATTR_ENDURANCE",
      tier: "small",
      distance: BASE_OUTER + 6 * BASE_DIST,
      angle: Q8,
    },
    "145": {
      type: "SHELL_SHOCK",
      tier: "large",
      distance: BASE_OUTER + 6 * BASE_DIST,
      angle: Q8 + BASE_ANGLE_DIST / 2.5,
    },
    "146": {
      type: "VILE_CONCOCTION",
      tier: "medium",
      distance: BASE_OUTER + 7 * BASE_DIST,
      angle: Q8 + BASE_ANGLE_DIST / 1.9,
    },
    "147": {
      type: "SLICE_AND_DICE",
      tier: "medium",
      distance: BASE_OUTER + 6 * BASE_DIST,
      angle: Q8 - BASE_ANGLE_DIST / 2.5,
    },
    "148": {
      type: "POISON_MASTERY",
      tier: "medium",
      distance: BASE_OUTER + 6.75 * BASE_DIST,
      angle: Q8 + BASE_ANGLE_DIST / 4,
    },
    "149": {
      type: "DAGGER_MASTERY",
      tier: "medium",
      distance: BASE_OUTER + 6.75 * BASE_DIST,
      angle: Q8 - BASE_ANGLE_DIST / 4,
    },
    "150": {
      type: "POISONED_BLADES",
      tier: "medium",
      distance: BASE_OUTER + 8 * BASE_DIST,
      angle: Q8 + BASE_ANGLE_DIST / 8,
    },
    "151": {
      type: "EXPOSE_WEAKNESS",
      tier: "medium",
      distance: BASE_OUTER + 8 * BASE_DIST,
      angle: Q8 - BASE_ANGLE_DIST / 8,
    },
    "152": {
      type: "GRACEFUL_STRIDE",
      tier: "small",
      distance: BASE_OUTER + 9 * BASE_DIST,
      angle: Q8,
    },
    "153": {
      type: "ATTR_SPIRIT",
      tier: "small",
      base: true,
      angle: Q9,
    },
    "154": {
      type: "COUNTERSTRIKE",
      tier: "medium",
      distance: BASE_OUTER + BASE_DIST,
      angle: Q9,
    },
    "155": {
      type: "QUICK_CHARGE",
      tier: "medium",
      distance: BASE_OUTER + 2 * BASE_DIST,
      angle: Q9 + BASE_ANGLE_DIST / 2,
    },
    "156": {
      type: "MANA_CURRENTS",
      tier: "medium",
      distance: BASE_OUTER + 3 * BASE_DIST,
      angle: Q9 + BASE_ANGLE_DIST / 2,
    },
    "157": {
      type: "ATTR_INT",
      tier: "small",
      distance: BASE_OUTER + 3 * BASE_DIST,
      angle: Q9 + BASE_ANGLE_DIST / 6,
    },
    "158": {
      type: "ATTR_SPIRIT",
      tier: "small",
      distance: BASE_OUTER + 3 * BASE_DIST,
      angle: Q9 - BASE_ANGLE_DIST / 6,
    },
    "159": {
      type: "BEGONE",
      tier: "large",
      distance: BASE_OUTER + 3.5 * BASE_DIST,
      angle: Q9,
    },
    "160": {
      type: "SLEIGHT_OF_HAND",
      tier: "medium",
      distance: BASE_OUTER + 4.5 * BASE_DIST,
      angle: Q9,
    },
    "161": {
      type: "ATTR_SPIRIT",
      tier: "small",
      distance: BASE_OUTER + 5 * BASE_DIST,
      angle: Q9 + BASE_ANGLE_DIST / 5,
    },
    "162": {
      type: "BLOODLETTING",
      tier: "medium",
      distance: BASE_OUTER + 5 * BASE_DIST,
      angle: Q9 - BASE_ANGLE_DIST / 5,
    },
    "163": {
      type: "ATTR_INT",
      tier: "small",
      distance: BASE_OUTER + 6 * BASE_DIST,
      angle: Q9 + BASE_ANGLE_DIST / 3,
    },
    "164": {
      type: "ARCANE_CONCENTRATION",
      tier: "small",
      distance: BASE_OUTER + 6 * BASE_DIST,
      angle: Q9,
    },
    "165": {
      type: "ATTR_SPIRIT",
      tier: "small",
      distance: BASE_OUTER + 6 * BASE_DIST,
      angle: Q9 - BASE_ANGLE_DIST / 3,
    },
    "166": {
      type: "TERROR",
      tier: "medium",
      distance: BASE_OUTER + 7 * BASE_DIST,
      angle: Q9 + BASE_ANGLE_DIST / 5,
    },
    "167": {
      type: "ATTR_SPIRIT",
      tier: "small",
      distance: BASE_OUTER + 7 * BASE_DIST,
      angle: Q9,
    },
    "168": {
      type: "BLOOD_MAGIC",
      tier: "medium",
      distance: BASE_OUTER + 7 * BASE_DIST,
      angle: Q9 - BASE_ANGLE_DIST / 5,
    },
    "169": {
      type: "SPELLSLINGER",
      tier: "medium",
      distance: BASE_OUTER + 8 * BASE_DIST,
      angle: Q9,
    },
    "170": {
      type: "ATTR_SPIRIT",
      tier: "small",
      base: true,
      angle: Q10,
    },
    "171": {
      type: "MAGE_APPRENTICE",
      tier: "medium",
      distance: BASE_OUTER + BASE_DIST,
      angle: Q10,
    },
    "172": {
      type: "NECROMANCER",
      tier: "medium",
      distance: BASE_OUTER + 2 * BASE_DIST,
      angle: Q10 + BASE_ANGLE_DIST / 2,
    },
    "173": {
      type: "BONE_TO_ASH",
      tier: "medium",
      distance: BASE_OUTER + 3 * BASE_DIST,
      angle: Q10 + BASE_ANGLE_DIST / 2 + 3,
    },
    "174": {
      type: "DARK_ARTS",
      tier: "medium",
      distance: BASE_OUTER + 3 * BASE_DIST,
      angle: Q10 + BASE_ANGLE_DIST / 2 - 3,
    },
    "175": {
      type: "ATTR_INT",
      tier: "small",
      distance: BASE_OUTER + 2.5 * BASE_DIST,
      angle: Q10,
    },
    "176": {
      type: "ARSONIST",
      tier: "medium",
      distance: BASE_OUTER + 4 * BASE_DIST,
      angle: Q10 + BASE_ANGLE_DIST / 5,
    },
    "177": {
      type: "ICEMAN",
      tier: "medium",
      distance: BASE_OUTER + 4 * BASE_DIST,
      angle: Q10 - BASE_ANGLE_DIST / 5,
    },
    "178": {
      type: "ATTR_SPIRIT",
      tier: "small",
      distance: BASE_OUTER + 5 * BASE_DIST,
      angle: Q10 + BASE_ANGLE_DIST / 2.5,
    },
    "179": {
      type: "FIRE_RESISTANCE",
      tier: "medium",
      distance: BASE_OUTER + 5 * BASE_DIST,
      angle: Q10 + BASE_ANGLE_DIST / 4,
    },
    "180": {
      type: "ATTR_INT",
      tier: "small",
      distance: BASE_OUTER + 5 * BASE_DIST,
      angle: Q10,
    },
    "181": {
      type: "ICE_RESISTANCE",
      tier: "medium",
      distance: BASE_OUTER + 5 * BASE_DIST,
      angle: Q10 - BASE_ANGLE_DIST / 3,
    },
    "182": {
      type: "RADIANT_AURA",
      tier: "large",
      distance: BASE_OUTER + 6 * BASE_DIST,
      angle: Q10 + BASE_ANGLE_DIST / 2.5,
    },
    "183": {
      type: "ATTR_SPIRIT",
      tier: "small",
      distance: BASE_OUTER + 7.15 * BASE_DIST,
      angle: Q10 + BASE_ANGLE_DIST / 1.6,
    },
    "184": {
      type: "WIZARD",
      tier: "medium",
      distance: BASE_OUTER + 6 * BASE_DIST,
      angle: Q10,
    },
    "185": {
      type: "FROST",
      tier: "medium",
      distance: BASE_OUTER + 6 * BASE_DIST,
      angle: Q10 - BASE_ANGLE_DIST / 5,
    },
    "186": {
      type: "ATTR_SPIRIT",
      tier: "small",
      distance: BASE_OUTER + 7.5 * BASE_DIST,
      angle: Q10,
    },
    "187": {
      type: "ATTR_INT",
      tier: "small",
      distance: BASE_OUTER + 8.5 * BASE_DIST,
      angle: Q10,
    },
    "188": {
      type: "CHAIN_HIT",
      tier: "medium",
      distance: BASE_OUTER + 7.8 * BASE_DIST,
      angle: Q10 + BASE_ANGLE_DIST / 8,
    },
    "189": {
      type: "MASS_DESTRUCTION",
      tier: "medium",
      distance: BASE_OUTER + 7.25 * BASE_DIST,
      angle: Q10 + BASE_ANGLE_DIST / 4,
    },
    "190": {
      type: "THUNDER",
      tier: "medium",
      distance: BASE_OUTER + 8.05 * BASE_DIST,
      angle: Q10 - BASE_ANGLE_DIST / 8,
    },
    "191": {
      type: "SHOCK_RESISTANCE",
      tier: "medium",
      distance: BASE_OUTER + 8.75 * BASE_DIST,
      angle: Q10 - BASE_ANGLE_DIST / 4,
    },
    "192": {
      type: "ATTR_INT",
      tier: "small",
      base: true,
      angle: Q11,
    },
    "193": {
      type: "HEALER",
      tier: "medium",
      distance: BASE_OUTER + BASE_DIST,
      angle: Q11,
    },
    "194": {
      type: "BLINK",
      tier: "large",
      distance: BASE_OUTER + 2 * BASE_DIST,
      angle: Q11 + BASE_ANGLE_DIST / 2,
    },
    "195": {
      type: "BLINK_ATTACK",
      tier: "medium",
      distance: BASE_OUTER + 3 * BASE_DIST,
      angle: Q11 + BASE_ANGLE_DIST / 2 + 3,
    },
    "196": {
      type: "EMERGENCY_BLINK",
      tier: "medium",
      distance: BASE_OUTER + 3 * BASE_DIST,
      angle: Q11 + BASE_ANGLE_DIST / 2 - 3,
    },
    "197": {
      type: "ATTR_SPIRIT",
      tier: "small",
      distance: BASE_OUTER + 2.5 * BASE_DIST,
      angle: Q11,
    },
    "198": {
      type: "WATER_AURA",
      tier: "large",
      distance: BASE_OUTER + 4 * BASE_DIST,
      angle: Q11 + BASE_ANGLE_DIST / 6,
    },
    "199": {
      type: "HEALER_REVIVE",
      tier: "medium",
      distance: BASE_OUTER + 4 * BASE_DIST,
      angle: Q11 - BASE_ANGLE_DIST / 6,
    },
    "200": {
      type: "SHROUD_FILTER",
      tier: "medium",
      distance: BASE_OUTER + 5 * BASE_DIST,
      angle: Q11 + BASE_ANGLE_DIST / 3,
    },
    "201": {
      type: "SHROUD_RESISTANCE",
      tier: "medium",
      distance: BASE_OUTER + 6 * BASE_DIST,
      angle: Q11 + BASE_ANGLE_DIST / 3,
    },
    "202": {
      type: "SHROUD_MISTERY",
      tier: "medium",
      distance: BASE_OUTER + 7 * BASE_DIST,
      angle: Q11 + BASE_ANGLE_DIST / 3,
    },
    "203": {
      type: "ATTR_INT",
      tier: "small",
      distance: BASE_OUTER + 5 * BASE_DIST,
      angle: Q11,
    },
    "204": {
      type: "WATERS_OF_LIFE",
      tier: "medium",
      distance: BASE_OUTER + 6 * BASE_DIST,
      angle: Q11,
    },
    "205": {
      type: "ATTR_INT",
      tier: "small",
      distance: BASE_OUTER + 6 * BASE_DIST,
      angle: Q11 - BASE_ANGLE_DIST / 6,
    },
    "206": {
      type: "ATTR_SPIRIT",
      tier: "small",
      distance: BASE_OUTER + 6 * BASE_DIST,
      angle: Q11 + BASE_ANGLE_DIST / 6,
    },
    "207": {
      type: "DIVINE_SURGE",
      tier: "medium",
      distance: BASE_OUTER + 7 * BASE_DIST,
      angle: Q11,
    },
    "208": {
      type: "RIGHTEOUS_FIRE",
      tier: "medium",
      distance: BASE_OUTER + 8 * BASE_DIST,
      angle: Q11 - BASE_ANGLE_DIST / 4,
    },
    "209": {
      type: "ATTR_INT",
      tier: "small",
      base: true,
      angle: Q12,
    },
    "210": {
      type: "ARCANE_DEFLECTION",
      tier: "medium",
      distance: BASE_OUTER + BASE_DIST,
      angle: Q12,
    },
    "211": {
      type: "EVASION_ATTACK",
      tier: "large",
      distance: BASE_OUTER + 2 * BASE_DIST,
      angle: Q12 + BASE_ANGLE_DIST / 2,
    },
    "212": {
      type: "ATTR_INT",
      tier: "small",
      distance: BASE_OUTER + 2 * BASE_DIST,
      angle: Q12 + BASE_ANGLE_DIST / 5,
    },
    "213": {
      type: "ETERNAL_SPARK",
      tier: "medium",
      distance: BASE_OUTER + 2 * BASE_DIST,
      angle: Q12 - BASE_ANGLE_DIST / 5,
    },
    "214": {
      type: "UNITY",
      tier: "large",
      distance: BASE_OUTER + 3 * BASE_DIST,
      angle: Q12,
    },
    "215": {
      type: "STING",
      tier: "medium",
      distance: BASE_OUTER + 4 * BASE_DIST,
      angle: Q12 + BASE_ANGLE_DIST / 5,
    },
    "216": {
      type: "WAND_SPECIALIZATION",
      tier: "large",
      distance: BASE_OUTER + 4 * BASE_DIST,
      angle: Q12 - BASE_ANGLE_DIST / 5,
    },
    "217": {
      type: "LIFE_BURST",
      tier: "medium",
      distance: BASE_OUTER + 5 * BASE_DIST,
      angle: Q12 + BASE_ANGLE_DIST / 2.8,
    },
    "218": {
      type: "WAND_MASTERY",
      tier: "medium",
      distance: BASE_OUTER + 4.9 * BASE_DIST,
      angle: Q12,
    },
    "219": {
      type: "ARCANE_PROLIFERATION",
      tier: "medium",
      distance: BASE_OUTER + 5 * BASE_DIST,
      angle: Q12 - BASE_ANGLE_DIST / 2.8,
    },
    "220": {
      type: "LIFE_ESSENCES",
      tier: "large",
      distance: BASE_OUTER + 6 * BASE_DIST,
      angle: Q12,
    },
    "221": {
      type: "EXALTED",
      tier: "small",
      distance: BASE_OUTER + 7.25 * BASE_DIST,
      angle: Q12,
    },
    "222": {
      type: "ATTR_INT",
      tier: "small",
      distance: BASE_OUTER + 7 * BASE_DIST,
      angle: Q12 - BASE_ANGLE_DIST + BASE_ANGLE_DIST / 1.5,
    },
  },
  edges: [
    ["1", "2", "16"],
    ["2", "3"],
    ["4", "5", "6"],
    ["6", "7"],
    ["9", "10"],
    ["8", "6", "7", "9"],
    ["14", "16"],
    ["17", "18"],
    ["18", "19", "20", "21"],
    ["22", "20", "21", "23", "24", "26"],
    ["26", "25", "27"],
    ["25", "23", "28"],
    ["27", "24", "30"],
    ["29", "28", "30"],
    ["28", "32"],
    ["30", "34"],
    ["31", "33", "29"],
    ["33", "32", "34"],
    ["36", "35", "37", "38", "19"],
    ["38", "39", "41"],
    ["42", "40"],
    ["44", "41", "42", "45", "28"],
    ["43", "39", "45", "51"],
    ["46", "45", "47"],
    ["51", "48", "50"],
    ["49", "48", "50"],
    ["52", "48", "50"],
    ["54", "53", "55", "67", "37"],
    ["55", "56", "57"],
    ["58", "56", "57"],
    ["60", "56", "63"],
    ["61", "57", "65", "52"],
    ["59", "60", "61", "62"],
    ["62", "63", "65"],
    ["64", "63", "65"],
    ["66", "63", "65"],
    ["69", "68", "71", "72", "73", "67", "70"],
    ["70", "72"],
    ["74", "77", "72", "73"],
    ["75", "78", "79", "72"],
    ["76", "79", "73", "80"],
    ["81", "78", "80"],
    ["83", "82", "84", "85", "86", "87", "88", "70"],
    ["87", "89", "91"],
    ["92", "89", "91", "90", "93", "97"],
    ["93", "94", "95", "96"],
    ["97", "96", "81"],
    ["99", "98", "84", "100", "101", "102"],
    ["102", "101", "85", "103", "104"],
    ["105", "102", "106", "107", "108", "112"],
    ["111", "112", "110", "108"],
    ["112", "113"],
    ["108", "109"],
    ["115", "114", "117", "118", "100", "116"],
    ["120", "117", "122", "123"],
    ["119", "118", "121", "122"],
    ["123", "125"],
    ["121", "124"],
    ["126", "124", "125", "122", "127", "128"],
    ["132", "128", "131"],
    ["129", "127", "130"],
    ["134", "133", "135", "116", "136"],
    ["138", "116", "139", "142", "136"],
    ["137", "136"],
    ["140", "137", "141"],
    ["142", "141"],
    ["143", "141", "144"],
    ["144", "147", "145", "151", "150"],
    ["147", "121"],
    ["145", "146"],
    ["151", "149", "152"],
    ["150", "148", "152"],
    ["154", "155", "157", "158"],
    ["155", "156"],
    ["159", "160", "157", "158"],
    ["162", "165", "158"],
    ["163", "166"],
    ["165", "145", "168"],
    ["161", "157", "163"],
    ["164", "163", "165", "166", "167", "168"],
    ["167", "169"],
    ["171", "170", "155", "172", "175"],
    ["172", "173", "174"],
    ["175", "176", "177"],
    ["177", "181", "185"],
    ["176", "178", "180"],
    ["185", "181", "184"],
    ["179", "178"],
    ["182", "183", "179", "178", "184"],
    ["184", "180", "186"],
    ["186", "187", "190"],
    ["190", "191"],
    ["188", "187", "189"],
    ["183", "208"],
    ["193", "192", "172", "194", "197"],
    ["194", "195", "196"],
    ["197", "198", "199"],
    ["198", "200", "203", "206"],
    ["199", "205"],
    ["203", "204"],
    ["201", "200", "202"],
    ["207", "206", "205", "208"],
    ["210", "209", "211", "212", "213", "194"],
    ["211", "18"],
    ["214", "213", "212", "216", "215"],
    ["219", "216", "218", "220"],
    ["217", "215", "220", "27"],
    ["220", "221"],
    ["222", "221", "202"],
  ],
};

export const buildSkillNodes = (seed: SkillTreeSeed): SkillNodesType => {
  if (process.env.NODE_ENV !== "production") {
    const problems: string[] = [];
    for (const [id, node] of Object.entries(seed.nodes)) {
      if (!(node.type in seed.types)) {
        problems.push(`node "${id}" references unknown type "${node.type}"`);
      }
    }
    for (const entry of seed.edges) {
      for (const id of entry) {
        if (!(id in seed.nodes)) {
          problems.push(
            `edge ${JSON.stringify(entry)} references unknown node id "${id}"`,
          );
          break;
        }
      }
    }
    if (problems.length > 0) {
      throw new Error(
        `SkillTree seed has ${problems.length} unresolved reference(s):\n  - ${problems.join("\n  - ")}`,
      );
    }
  }
  const nodes: SkillNodesType["nodes"] = {};
  for (const [id, node] of Object.entries(seed.nodes)) {
    nodes[id] = { ...node, id };
  }
  const edges: SkillNodesType["edges"] = {};
  const ensure = (id: string) => (edges[id] ??= []);
  for (const [first, ...rest] of seed.edges) {
    for (const other of rest) {
      if (first === other) continue;
      const a = ensure(first);
      const b = ensure(other);
      if (!a.includes(other)) a.push(other);
      if (!b.includes(first)) b.push(first);
    }
  }
  for (const id of Object.keys(nodes)) ensure(id);
  return { types: seed.types, nodes, edges };
};

const SkillNodes: SkillNodesType = buildSkillNodes(skillTreeSeed);

export default SkillNodes;

export const getMaxLevel = (typeId: string): number =>
  SkillNodes.types[typeId]?.maxLevel ?? 1;
