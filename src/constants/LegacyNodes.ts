import type { NodeStatsType } from "./Stats";
import type { PositionedNode } from "../utils/nodePosition";

export type Node = PositionedNode & {
  id: string;
  gameNodeId?: string;
  type: string;
  base?: boolean;
  tier?: "small" | "medium" | "large";
};

export type NodeTypeMetadata = {
  importedEnglish?: boolean;
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
  gameValues?: { [varName: string]: number | string };
  gameLevelValues?: { [varName: string]: (number | string)[] };
  gamePerLevelValues?: { [varName: string]: number | string };
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

// Authored, app-owned presentation. Node membership, types, positions, base
// links and edges come from the checked import (gameSkillData.json); see
// docs/game-metadata-migration.md. Generated fields win over these overrides.
export type AuthoredTypePresentation = Omit<NodeTypeMetadata, "cost" | "description"> &
  Partial<Pick<NodeTypeMetadata, "cost" | "description">>;

export type NodePresentation = Pick<Node, "tier">;

export type AuthoredPresentation = {
  types: { [typeKey: string]: AuthoredTypePresentation };
  nodes: { [nodeId: string]: NodePresentation };
};

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

const authoredPresentation: AuthoredPresentation = {
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
      hasIcon: true,
    },
    PICKAXE_SPECIALIZATION: {
      description: [
        "Unlocks Special Abilities of Pickaxes. " + UNLEASH_FOCUS,
        FOCUS,
      ],
      color: "gold",
      cost: 3,
      hasIcon: true,
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
      maxLevel: 3,
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
        PARRY,
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
      hasIcon: true,
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
        label:
          "<b>{{value}}</b> Dexterity and Endurance per level.\n<b>{{value2}}</b> Stamina Regeneration per level",
      },
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
      cost: 1,
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
      cost: 1,
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
      hasIcon: true,
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
      hasIcon: true,
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
      hasIcon: true,
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
      hasIcon: true,
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
      hasIcon: true,
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
      hasIcon: true,
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
      hasIcon: true,
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
    "1": { tier: "medium" },
    "2": { tier: "medium" },
    "3": { tier: "large" },
    "4": { tier: "medium" },
    "5": { tier: "large" },
    "6": { tier: "medium" },
    "7": { tier: "medium" },
    "8": { tier: "medium" },
    "9": { tier: "medium" },
    "10": { tier: "large" },
    "11": { tier: "medium" },
    "12": { tier: "large" },
    "13": { tier: "medium" },
    "14": { tier: "large" },
    "15": { tier: "medium" },
    "16": { tier: "large" },
    "17": { tier: "small" },
    "18": { tier: "medium" },
    "19": { tier: "large" },
    "20": { tier: "medium" },
    "21": { tier: "medium" },
    "22": { tier: "small" },
    "23": { tier: "medium" },
    "24": { tier: "medium" },
    "25": { tier: "medium" },
    "26": { tier: "medium" },
    "27": { tier: "medium" },
    "28": { tier: "small" },
    "29": { tier: "small" },
    "30": { tier: "small" },
    "31": { tier: "small" },
    "32": { tier: "large" },
    "33": { tier: "large" },
    "34": { tier: "large" },
    "35": { tier: "small" },
    "36": { tier: "medium" },
    "37": { tier: "medium" },
    "38": { tier: "small" },
    "39": { tier: "medium" },
    "40": { tier: "medium" },
    "41": { tier: "medium" },
    "42": { tier: "medium" },
    "43": { tier: "small" },
    "44": { tier: "small" },
    "45": { tier: "large" },
    "46": { tier: "small" },
    "47": { tier: "small" },
    "48": { tier: "large" },
    "49": { tier: "medium" },
    "50": { tier: "large" },
    "51": { tier: "small" },
    "52": { tier: "small" },
    "53": { tier: "small" },
    "54": { tier: "medium" },
    "55": { tier: "small" },
    "56": { tier: "small" },
    "57": { tier: "small" },
    "58": { tier: "large" },
    "59": { tier: "medium" },
    "60": { tier: "medium" },
    "61": { tier: "medium" },
    "62": { tier: "medium" },
    "63": { tier: "large" },
    "64": { tier: "small" },
    "65": { tier: "large" },
    "66": { tier: "small" },
    "67": { tier: "medium" },
    "68": { tier: "small" },
    "69": { tier: "medium" },
    "70": { tier: "medium" },
    "71": { tier: "medium" },
    "72": { tier: "small" },
    "73": { tier: "small" },
    "74": { tier: "large" },
    "75": { tier: "small" },
    "76": { tier: "medium" },
    "77": { tier: "medium" },
    "78": { tier: "large" },
    "79": { tier: "large" },
    "80": { tier: "medium" },
    "81": { tier: "large" },
    "82": { tier: "small" },
    "83": { tier: "medium" },
    "84": { tier: "medium" },
    "85": { tier: "large" },
    "86": { tier: "medium" },
    "87": { tier: "small" },
    "88": { tier: "medium" },
    "89": { tier: "medium" },
    "90": { tier: "medium" },
    "91": { tier: "medium" },
    "92": { tier: "small" },
    "93": { tier: "large" },
    "94": { tier: "medium" },
    "95": { tier: "medium" },
    "96": { tier: "small" },
    "97": { tier: "large" },
    "98": { tier: "small" },
    "99": { tier: "medium" },
    "100": { tier: "large" },
    "101": { tier: "medium" },
    "102": { tier: "small" },
    "103": { tier: "medium" },
    "104": { tier: "small" },
    "105": { tier: "small" },
    "106": { tier: "medium" },
    "107": { tier: "medium" },
    "108": { tier: "medium" },
    "109": { tier: "medium" },
    "110": { tier: "small" },
    "111": { tier: "small" },
    "112": { tier: "medium" },
    "113": { tier: "medium" },
    "114": { tier: "small" },
    "115": { tier: "medium" },
    "116": { tier: "medium" },
    "117": { tier: "medium" },
    "118": { tier: "medium" },
    "119": { tier: "medium" },
    "120": { tier: "medium" },
    "121": { tier: "medium" },
    "122": { tier: "large" },
    "123": { tier: "large" },
    "124": { tier: "medium" },
    "125": { tier: "medium" },
    "126": { tier: "medium" },
    "127": { tier: "small" },
    "128": { tier: "large" },
    "129": { tier: "medium" },
    "130": { tier: "medium" },
    "131": { tier: "medium" },
    "132": { tier: "medium" },
    "133": { tier: "small" },
    "134": { tier: "medium" },
    "135": { tier: "large" },
    "136": { tier: "small" },
    "137": { tier: "medium" },
    "138": { tier: "large" },
    "139": { tier: "medium" },
    "140": { tier: "large" },
    "141": { tier: "small" },
    "142": { tier: "medium" },
    "143": { tier: "large" },
    "144": { tier: "small" },
    "145": { tier: "large" },
    "146": { tier: "medium" },
    "147": { tier: "medium" },
    "148": { tier: "medium" },
    "149": { tier: "medium" },
    "150": { tier: "medium" },
    "151": { tier: "medium" },
    "152": { tier: "small" },
    "153": { tier: "small" },
    "154": { tier: "medium" },
    "155": { tier: "medium" },
    "156": { tier: "medium" },
    "157": { tier: "small" },
    "158": { tier: "small" },
    "159": { tier: "large" },
    "160": { tier: "medium" },
    "161": { tier: "small" },
    "162": { tier: "medium" },
    "163": { tier: "small" },
    "164": { tier: "small" },
    "165": { tier: "small" },
    "166": { tier: "medium" },
    "167": { tier: "small" },
    "168": { tier: "medium" },
    "169": { tier: "medium" },
    "170": { tier: "small" },
    "171": { tier: "medium" },
    "172": { tier: "medium" },
    "173": { tier: "medium" },
    "174": { tier: "medium" },
    "175": { tier: "small" },
    "176": { tier: "medium" },
    "177": { tier: "medium" },
    "178": { tier: "small" },
    "179": { tier: "medium" },
    "180": { tier: "small" },
    "181": { tier: "medium" },
    "182": { tier: "large" },
    "183": { tier: "small" },
    "184": { tier: "medium" },
    "185": { tier: "medium" },
    "186": { tier: "small" },
    "187": { tier: "small" },
    "188": { tier: "medium" },
    "189": { tier: "medium" },
    "190": { tier: "medium" },
    "191": { tier: "medium" },
    "192": { tier: "small" },
    "193": { tier: "medium" },
    "194": { tier: "large" },
    "195": { tier: "medium" },
    "196": { tier: "medium" },
    "197": { tier: "small" },
    "198": { tier: "large" },
    "199": { tier: "medium" },
    "200": { tier: "medium" },
    "201": { tier: "medium" },
    "202": { tier: "medium" },
    "203": { tier: "small" },
    "204": { tier: "medium" },
    "205": { tier: "small" },
    "206": { tier: "small" },
    "207": { tier: "medium" },
    "208": { tier: "medium" },
    "209": { tier: "small" },
    "210": { tier: "medium" },
    "211": { tier: "large" },
    "212": { tier: "small" },
    "213": { tier: "medium" },
    "214": { tier: "large" },
    "215": { tier: "medium" },
    "216": { tier: "large" },
    "217": { tier: "medium" },
    "218": { tier: "medium" },
    "219": { tier: "medium" },
    "220": { tier: "large" },
    "221": { tier: "small" },
    "222": { tier: "small" },
  },
};

export default authoredPresentation;
