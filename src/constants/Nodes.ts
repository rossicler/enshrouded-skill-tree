export type Node = {
  id: string;
  type: string;
  base?: boolean;
  tier?: "small" | "medium" | "large";
  angle?: number;
  distance?: number;
};

export type SkillNodesType = {
  types: unknown;
  nodes: Node[];
  edges: { [key: string]: string[] };
};

// ANGLE LINES
// 15 45 75 105 135 165 195 225 255 285 315 345

const SkillNodes: SkillNodesType = {
  types: {},
  nodes: [
    {
      id: "1",
      type: "WELL_RESTED",
      base: true,
      tier: "medium",
      distance: -120,
      angle: 255,
    },
    {
      id: "2",
      type: "SNEAK_ATTACK",
      base: true,
      tier: "large",
      distance: -120,
      angle: 225,
    },
    {
      id: "3",
      type: "BACKSTAB_DAMAGE",
      tier: "medium",
      distance: -190,
      angle: 225,
    },
    {
      id: "4",
      type: "LUMBERJACK",
      base: true,
      tier: "medium",
      distance: -120,
      angle: 165,
    },
    {
      id: "5",
      type: "QUALITY_GEAR",
      tier: "medium",
      distance: -120,
      angle: 120,
    },
    { id: "6", type: "MINER", tier: "medium", distance: -190, angle: 120 },
    {
      id: "7",
      type: "MASON",
      base: true,
      tier: "medium",
      distance: -120,
      angle: 75,
    },
    {
      id: "8",
      type: "MERCILESS_ATTACK",
      base: true,
      tier: "large",
      distance: -120,
      angle: 15,
    },
    {
      id: "9",
      type: "POWER_PARRY",
      tier: "medium",
      distance: -190,
      angle: 15,
    },
    {
      id: "10",
      type: "SAVIOUR",
      base: true,
      tier: "medium",
      distance: -120,
      angle: 315,
    },
    {
      id: "11",
      type: "ATTR_SPIRIT",
      base: true,
      tier: "small",
      angle: 255,
    },
    {
      id: "12",
      type: "COUNTERSTRIKE",
      tier: "medium",
      distance: 70,
      angle: 255,
    },
    { id: "13", type: "ATTR_INT", tier: "small", distance: 170, angle: 250 },
    { id: "14", type: "ATTR_SPIRIT", tier: "small", distance: 170, angle: 260 },
    { id: "15", type: "BEGONE", tier: "large", distance: 240, angle: 255 },
    { id: "17", type: "ATTR_SPIRIT", tier: "small", distance: 310, angle: 250 },
    { id: "16", type: "ATTR_INT", tier: "small", distance: 310, angle: 260 },
    { id: "18", type: "TERROR", tier: "medium", distance: 380, angle: 255 },
    {
      id: "19",
      type: "ARCANE_CONCENTRATION",
      tier: "small",
      distance: 450,
      angle: 255,
    },
    {
      id: "20",
      type: "QUICK_CHARGE",
      tier: "medium",
      distance: 120,
      angle: 270,
    },
    { id: "21", type: "ATTR_SPIRIT", base: true, angle: 285 },
    {
      id: "22",
      type: "THIS_IS_THE_WAY",
      tier: "medium",
      distance: 70,
      angle: 285,
    },
    {
      id: "23",
      type: "NECROMANCER",
      tier: "medium",
      distance: 120,
      angle: 300,
    },
    { id: "24", type: "ATTR_SPIRIT", distance: 140, angle: 285 },
    { id: "25", type: "ARSONIST", tier: "medium", distance: 210, angle: 277 },
    { id: "26", type: "THUNDER", tier: "medium", distance: 210, angle: 285 },
    { id: "27", type: "ICEMAN", tier: "medium", distance: 210, angle: 293 },
    { id: "28", type: "PYROMANIAC", tier: "medium", distance: 280, angle: 277 },
    {
      id: "29",
      type: "RADIANT_AURA",
      tier: "large",
      distance: 350,
      angle: 273,
    },
    { id: "30", type: "SUN_AURA", tier: "medium", distance: 420, angle: 273 },
    { id: "31", type: "ATTR_SPIRIT", distance: 490, angle: 273 },
    { id: "32", type: "LIGHTNING", tier: "medium", distance: 280, angle: 285 },
    { id: "33", type: "SUBZERO", tier: "medium", distance: 280, angle: 293 },
    { id: "34", type: "FROST", tier: "medium", distance: 350, angle: 293 },
    { id: "35", type: "ATTR_INT", distance: 350, angle: 285 },
    { id: "36", type: "WIZARD", tier: "medium", distance: 420, angle: 285 },
    { id: "37", type: "DARK_ARTS", tier: "medium", distance: 490, angle: 282 },
    { id: "38", type: "CHAIN_HIT", tier: "medium", distance: 490, angle: 288 },
    { id: "39", type: "ABYSS", tier: "medium", distance: 560, angle: 282 },
    {
      id: "40",
      type: "MASS_DESTRUCTION",
      tier: "medium",
      distance: 560,
      angle: 288,
    },
    { id: "41", type: "ATTR_INT", distance: 630, angle: 285 },
    { id: "42", type: "ATTR_INT", base: true, angle: 315 },
    { id: "43", type: "HEALER", tier: "medium", distance: 70, angle: 315 },
    { id: "44", type: "HEALER II", tier: "medium", distance: 140, angle: 315 },
    { id: "45", type: "ATTR_INT", distance: 210, angle: 315 },
    { id: "46", type: "WATER_AURA", tier: "large", distance: 280, angle: 320 },
    {
      id: "47",
      type: "HEALING_REVIVE",
      tier: "medium",
      distance: 280,
      angle: 310,
    },
    {
      id: "48",
      type: "SHROOUD_FILTER",
      tier: "medium",
      distance: 340,
      angle: 315,
    },
    {
      id: "49",
      type: "WATERS_OF_LIFE",
      tier: "medium",
      distance: 330,
      angle: 325,
    },
    { id: "50", type: "ATTR_SPIRIT", distance: 340, angle: 306 },
    { id: "51", type: "ATTR_INT", distance: 410, angle: 312 },
    { id: "52", type: "ATTR_SPIRIT", distance: 410, angle: 318 },
    { id: "53", type: "MARTYR", tier: "large", distance: 480, angle: 315 },
    { id: "54", type: "EXALTED", distance: 550, angle: 315 },
    { id: "55", type: "BLINK", tier: "large", distance: 120, angle: 330 },
    {
      id: "56",
      type: "EMERGENCY_BLINK",
      tier: "medium",
      distance: 180,
      angle: 327,
    },
    {
      id: "57",
      type: "BLINK_ATTACK",
      tier: "medium",
      distance: 180,
      angle: 333,
    },
    { id: "58", type: "ATTR_INT", base: true, angle: 345 },
    {
      id: "59",
      type: "ARCANE_DEFLECTION",
      tier: "medium",
      distance: 70,
      angle: 345,
    },
    {
      id: "60",
      type: "EVASION_ATTACK",
      tier: "large",
      distance: 120,
      angle: 360,
    },
    {
      id: "61",
      type: "BATTLE_HEAL",
      tier: "medium",
      distance: 190,
      angle: 360,
    },
    { id: "62", type: "ATTR_SPIRIT", distance: 260, angle: 360 },
    { id: "63", type: "ABSORB", tier: "medium", distance: 320, angle: 3 },
    {
      id: "64",
      type: "BLOODLETTING",
      tier: "medium",
      distance: 320,
      angle: 357,
    },
    { id: "65", type: "SNAP", tier: "medium", distance: 390, angle: 3 },
    { id: "66", type: "LIFE_BURST", tier: "medium", distance: 390, angle: 357 },
    { id: "67", type: "SOUL_LEECH", tier: "medium", distance: 460, angle: 3 },
    {
      id: "68",
      type: "BLOOD_MAGIC",
      tier: "medium",
      distance: 460,
      angle: 357,
    },
    { id: "69", type: "ATTR_INT", distance: 140, angle: 345 },
    { id: "70", type: "UNITY", tier: "large", distance: 210, angle: 345 },
    { id: "72", type: "STING", tier: "medium", distance: 270, angle: 340 },
    {
      id: "71",
      type: "WAND_MASTER",
      tier: "medium",
      distance: 270,
      angle: 350,
    },
    { id: "73", type: "ATTR_SPIRIT", distance: 350, angle: 345 },
    { id: "74", type: "ATTR_INT", distance: 420, angle: 345 },
    { id: "75", type: "ATTR_CONS", base: true, angle: 15 },
    { id: "76", type: "SHINY_PLATES", tier: "medium", distance: 70, angle: 15 },
    {
      id: "77",
      type: "HEAVY_PLATES",
      tier: "medium",
      distance: 140,
      angle: 15,
    },
    { id: "78", type: "ATTR_CONS", tier: "medium", distance: 210, angle: 15 },
    { id: "79", type: "TOWER", tier: "medium", distance: 280, angle: 20 },
    { id: "80", type: "WARDEN", tier: "medium", distance: 280, angle: 10 },
    { id: "81", type: "ATTR_STR", distance: 350, angle: 25 },
    { id: "82", type: "ATTR_STR", distance: 350, angle: 18 },
    { id: "83", type: "ATTR_CONS", distance: 350, angle: 12 },
    { id: "84", type: "NEMESIS", tier: "large", distance: 420, angle: 25 },
    {
      id: "85",
      type: "ARCH_NEMESIS",
      tier: "medium",
      distance: 490,
      angle: 25,
    },
    { id: "86", type: "EARTH_AURA", tier: "large", distance: 480, angle: 15 },
    { id: "87", type: "THICK_SKIN", distance: 550, angle: 15 },
    { id: "88", type: "ATTR_CONS", base: true, angle: 45 },
    { id: "89", type: "WARRIOR_PATH", tier: "medium", distance: 70, angle: 45 },
    {
      id: "90",
      type: "PURIFICATION",
      tier: "medium",
      distance: 120,
      angle: 30,
    },
    { id: "91", type: "ATTR_STR", distance: 140, angle: 45 },
    { id: "92", type: "SLASHER", tier: "medium", distance: 210, angle: 55 },
    { id: "93", type: "BRUTE", tier: "medium", distance: 210, angle: 45 },
    { id: "94", type: "THRUST", tier: "medium", distance: 210, angle: 35 },
    { id: "95", type: "BUTCHER", tier: "medium", distance: 280, angle: 55 },
    { id: "96", type: "HAMMER_TIME", tier: "medium", distance: 280, angle: 45 },
    { id: "97", type: "PIERCE", tier: "medium", distance: 280, angle: 35 },
    { id: "98", type: "VETERAN", tier: "medium", distance: 350, angle: 45 },
    { id: "99", type: "ATTR_CONS", distance: 420, angle: 50 },
    { id: "100", type: "ATTR_STR", distance: 420, angle: 40 },
    {
      id: "101",
      type: "SWIFT_BLADES",
      tier: "large",
      distance: 490,
      angle: 45,
    },
    { id: "102", type: "ATTR_CONS", distance: 560, angle: 45 },
    { id: "103", type: "ATTR_STR", base: true, angle: 75 },
    {
      id: "104",
      type: "HEAVY_HANDED",
      tier: "medium",
      distance: 70,
      angle: 75,
    },
    { id: "105", type: "ATTR_STR", distance: 140, angle: 75 },
    { id: "106", type: "FEAST", tier: "medium", distance: 120, angle: 60 },
    { id: "107", type: "ATTR_CONS", distance: 210, angle: 75 },
    { id: "108", type: "RELENTLESS", tier: "medium", distance: 280, angle: 80 },
    { id: "109", type: "BREACH", tier: "medium", distance: 280, angle: 70 },
    { id: "110", type: "SHOCKWAVE", tier: "large", distance: 350, angle: 60 },
    { id: "111", type: "ATTR_CONS", distance: 380, angle: 75 },
    {
      id: "112",
      type: "HEAVY_SPECIALIZATION",
      tier: "large",
      distance: 450,
      angle: 75,
    },
    { id: "113", type: "BARBARIAN", distance: 520, angle: 75 },
    { id: "114", type: "BLOOD_RAGE", tier: "medium", distance: 590, angle: 75 },
    { id: "115", type: "ATTR_STR", base: true, angle: 105 },
    { id: "116", type: "JUMP_ATTACK", tier: "large", distance: 70, angle: 105 },
    {
      id: "117",
      type: "DOUBLE_JUMP",
      tier: "large",
      distance: 120,
      angle: 120,
    },
    {
      id: "118",
      type: "JUMP_ATTACK_II",
      tier: "medium",
      distance: 190,
      angle: 120,
    },
    { id: "119", type: "ATTR_STR", distance: 190, angle: 105 },
    {
      id: "120",
      type: "BLOOD_WARRIOR",
      tier: "medium",
      distance: 260,
      angle: 110,
    },
    {
      id: "178",
      type: "BACKSTAB_MASTERY",
      tier: "medium",
      distance: 310,
      angle: 120,
    },
    {
      id: "121",
      type: "VIGOROUS_DEFLECTION",
      tier: "medium",
      distance: 260,
      angle: 100,
    },
    { id: "122", type: "ATTR_CONS", distance: 330, angle: 105 },
    { id: "123", type: "ATTR_CONS", distance: 400, angle: 110 },
    { id: "124", type: "ATTR_STR", distance: 400, angle: 100 },
    { id: "125", type: "BASH", tier: "large", distance: 310, angle: 90 },
    { id: "126", type: "ATTR_STR", distance: 380, angle: 90 },
    { id: "127", type: "ATTR_ENDURANCE", base: true, angle: 135 },
    { id: "128", type: "RUNNER", tier: "medium", distance: 70, angle: 135 },
    {
      id: "129",
      type: "INNER_FIRES",
      tier: "medium",
      distance: 120,
      angle: 150,
    },
    { id: "130", type: "ATTR_ENDURANCE", distance: 140, angle: 135 },
    {
      id: "131",
      type: "WANDERLUST",
      tier: "medium",
      distance: 210,
      angle: 135,
    },
    {
      id: "132",
      type: "GOOD_METABOLISM",
      tier: "medium",
      distance: 280,
      angle: 140,
    },
    {
      id: "133",
      type: "SWIFTSHOT_SUSTENANCE",
      tier: "medium",
      distance: 280,
      angle: 130,
    },
    { id: "134", type: "REBOUND", distance: 320, angle: 135 },
    {
      id: "135",
      type: "SWEET_TOOTH",
      tier: "medium",
      distance: 370,
      angle: 140,
    },
    { id: "136", type: "ARCHNOID", tier: "medium", distance: 370, angle: 130 },
    { id: "137", type: "ATTR_DEX", distance: 440, angle: 135 },
    {
      id: "138",
      type: "DESSERT_STOMACH",
      tier: "large",
      distance: 510,
      angle: 135,
    },
    { id: "139", type: "ATTR_ENDURANCE", distance: 580, angle: 135 },
    { id: "140", type: "ATTR_ENDURANCE", base: true, angle: 165 },
    {
      id: "141",
      type: "SNAKE_EATER",
      tier: "medium",
      distance: 70,
      angle: 165,
    },
    { id: "142", type: "EAGLE_EYE", tier: "large", distance: 120, angle: 180 },
    {
      id: "143",
      type: "MITHRIDATIST",
      tier: "medium",
      distance: 140,
      angle: 165,
    },
    { id: "144", type: "ATTR_ENDURANCE", distance: 210, angle: 165 },
    {
      id: "145",
      type: "VUKAH_LANGUAGE",
      tier: "medium",
      distance: 280,
      angle: 170,
    },
    {
      id: "146",
      type: "CALM_SPIRIT",
      tier: "medium",
      distance: 280,
      angle: 160,
    },
    {
      id: "179",
      type: "RELENTLESS_FLAME",
      tier: "medium",
      distance: 330,
      angle: 150,
    },
    { id: "147", type: "ATTR_DEX", distance: 310, angle: 165 },
    { id: "148", type: "ATTR_ENDURANCE", distance: 310, angle: 175 },
    {
      id: "149",
      type: "VUKAH_CULTURE",
      tier: "medium",
      distance: 370,
      angle: 170,
    },
    {
      id: "150",
      type: "BEAST_MASTER",
      tier: "medium",
      distance: 370,
      angle: 160,
    },
    { id: "151", type: "ATTR_DEX", distance: 400, angle: 175 },
    { id: "152", type: "ENDURANCE_OF_THE_FLAME", distance: 440, angle: 165 },
    { id: "153", type: "ATTR_DEX", base: true, angle: 195 },
    { id: "154", type: "MARKSMAN", tier: "medium", distance: 70, angle: 195 },
    {
      id: "155",
      type: "SILENT_STRIDE",
      tier: "medium",
      distance: 120,
      angle: 210,
    },
    {
      id: "156",
      type: "SHARPSHOOTER",
      tier: "medium",
      distance: 200,
      angle: 200,
    },
    {
      id: "157",
      type: "COUNTER_BATTERY",
      tier: "medium",
      distance: 200,
      angle: 190,
    },
    {
      id: "158",
      type: "EAGLES_BANE",
      tier: "medium",
      distance: 320,
      angle: 200,
    },
    {
      id: "159",
      type: "SKILL_SHOT",
      tier: "medium",
      distance: 320,
      angle: 190,
    },
    { id: "160", type: "BEE_STING", tier: "large", distance: 400, angle: 205 },
    { id: "161", type: "RANGER", tier: "medium", distance: 420, angle: 195 },
    { id: "162", type: "MULTI_SHOT", tier: "large", distance: 400, angle: 185 },
    { id: "163", type: "ATTR_DEX", base: true, angle: 225 },
    { id: "164", type: "AIRBORNE", tier: "medium", distance: 70, angle: 225 },
    { id: "165", type: "UPDRAFT", tier: "large", distance: 120, angle: 240 },
    { id: "166", type: "ATTR_ENDURANCE", distance: 140, angle: 225 },
    { id: "167", type: "SNIPER", tier: "medium", distance: 210, angle: 225 },
    {
      id: "168",
      type: "VITALITY_SURGE",
      tier: "medium",
      distance: 280,
      angle: 230,
    },
    {
      id: "169",
      type: "BLESSED_ARROWS",
      tier: "medium",
      distance: 280,
      angle: 220,
    },
    { id: "170", type: "ATTR_DEX", distance: 350, angle: 235 },
    {
      id: "171",
      type: "SHELL_SHOCK",
      tier: "large",
      distance: 420,
      angle: 235,
    },
    {
      id: "172",
      type: "BOUNTY_BONANZA",
      tier: "medium",
      distance: 350,
      angle: 225,
    },
    { id: "173", type: "ATTR_DEX", distance: 350, angle: 215 },
    { id: "174", type: "RICOCHETS", tier: "medium", distance: 420, angle: 225 },
    { id: "175", type: "GRACEFUL_STRIDE", distance: 490, angle: 225 },
    { id: "176", type: "ATTR_ENDURANCE", distance: 490, angle: 220 },
    {
      id: "177",
      type: "CHAIN_REACTION",
      tier: "medium",
      distance: 560,
      angle: 225,
    },
  ],
  edges: {
    "1": [],
    "2": ["3"],
    "3": ["2"],
    "4": ["5", "6"],
    "5": ["4", "7"],
    "6": ["4", "7"],
    "7": ["5", "6"],
    "8": ["9"],
    "9": ["8"],
    "10": [],
    "11": ["12"],
    "12": ["11", "13", "14", "20", "165"],
    "13": ["12", "15"],
    "14": ["12", "15"],
    "15": ["13", "14", "16", "17"],
    "16": ["15", "18"],
    "17": ["15", "18"],
    "18": ["16", "17", "19"],
    "19": ["18"],
    "20": ["12", "22"],
    "21": ["22"],
    "22": ["20", "24", "23"],
    "23": ["22", "43"],
    "24": ["22", "25", "26", "27"],
    "25": ["24", "28"],
    "26": ["24", "32"],
    "27": ["24", "33"],
    "28": ["25", "29", "35"],
    "29": ["28", "30"],
    "30": ["29", "31"],
    "31": ["30"],
    "32": ["26", "35"],
    "33": ["27", "35", "34"],
    "34": ["33"],
    "35": ["28", "32", "33", "36"],
    "36": ["35", "37", "38"],
    "37": ["36", "39"],
    "38": ["36", "40"],
    "39": ["37"],
    "40": ["38", "41"],
    "41": ["40"],
    "42": ["43"],
    "43": ["42", "23", "44", "55"],
    "44": ["43", "45"],
    "45": ["44", "47", "48", "46"],
    "46": ["45", "49", "52"],
    "47": ["45", "50", "51"],
    "48": ["45"],
    "49": ["46"],
    "50": ["47"],
    "51": ["47", "53"],
    "52": ["46", "53"],
    "53": ["51", "52", "54"],
    "54": ["53"],
    "55": ["43", "56", "57", "59"],
    "56": ["55"],
    "57": ["55"],
    "58": ["59"],
    "59": ["58", "55", "69", "60"],
    "60": ["59", "76", "61"],
    "61": ["60", "62"],
    "62": ["61", "63", "64"],
    "63": ["62", "65"],
    "64": ["62", "66"],
    "65": ["63", "67"],
    "66": ["64", "68"],
    "67": ["65"],
    "68": ["66"],
    "69": ["59", "70"],
    "70": ["69", "72", "73", "71"],
    "71": ["70"],
    "72": ["70"],
    "73": ["70", "74"],
    "74": ["73"],
    "75": ["76"],
    "76": ["75", "60", "77", "90"],
    "77": ["76", "78"],
    "78": ["77", "80", "79"],
    "79": ["78", "81", "82"],
    "80": ["78", "83"],
    "81": ["79", "84"],
    "82": ["79", "86"],
    "83": ["80", "86"],
    "84": ["81", "85"],
    "85": ["84"],
    "86": ["82", "83", "87"],
    "87": ["86"],
    "88": ["89"],
    "89": ["88", "90", "91", "106"],
    "90": ["89", "76"],
    "91": ["89", "92", "93", "94"],
    "92": ["91", "95"],
    "93": ["91", "96"],
    "94": ["91", "97"],
    "95": ["92", "98"],
    "96": ["93", "98"],
    "97": ["94", "98"],
    "98": ["95", "96", "97", "99", "101", "100"],
    "99": ["98"],
    "100": ["98"],
    "101": ["98", "102"],
    "102": ["101"],
    "103": ["104"],
    "104": ["103", "106", "105"],
    "105": ["104", "107"],
    "106": ["104", "89"],
    "107": ["105", "108", "109"],
    "108": ["107", "111", "125"],
    "109": ["107", "111", "110"],
    "110": ["109"],
    "111": ["108", "109", "112"],
    "112": ["111", "113"],
    "113": ["112", "114"],
    "114": ["113"],
    "115": ["116"],
    "116": ["115", "117", "119"],
    "117": ["116", "118", "128"],
    "118": ["117"],
    "119": ["116", "120", "121"],
    "120": ["119", "178", "122"],
    "121": ["119", "122", "125"],
    "122": ["120", "121", "123", "124"],
    "123": ["122"],
    "124": ["122"],
    "125": ["121", "108", "126"],
    "126": ["125"],
    "127": ["128"],
    "128": ["127", "117", "130", "129"],
    "129": ["128", "141"],
    "130": ["128", "131"],
    "131": ["130", "132", "133"],
    "132": ["131", "179", "135", "134"],
    "133": ["131", "136", "178"],
    "134": ["132"],
    "135": ["132", "137"],
    "136": ["133", "137"],
    "137": ["135", "136", "138"],
    "138": ["137", "139"],
    "139": ["138"],
    "140": ["141"],
    "141": ["140", "129", "143", "142"],
    "142": ["141", "154"],
    "143": ["141", "144"],
    "144": ["143", "145", "146"],
    "145": ["144", "148", "149", "147"],
    "146": ["144", "147", "150", "179"],
    "147": ["145", "146"],
    "148": ["145"],
    "149": ["145", "151", "152"],
    "150": ["146", "152"],
    "151": ["149"],
    "152": ["149", "150"],
    "153": ["154"],
    "154": ["153", "142", "155", "156", "157"],
    "155": ["154", "164"],
    "156": ["154", "159"],
    "157": ["154", "158"],
    "158": ["157", "160", "161"],
    "159": ["156", "161", "162"],
    "160": ["158"],
    "161": ["158", "159"],
    "162": ["159"],
    "163": ["164"],
    "164": ["163", "165", "166", "155"],
    "165": ["164", "12"],
    "166": ["164", "167"],
    "167": ["166", "168", "169"],
    "168": ["167", "170", "172"],
    "169": ["167", "172", "173"],
    "170": ["168", "171"],
    "171": ["170"],
    "172": ["168", "169", "174"],
    "173": ["169"],
    "174": ["175", "176"],
    "175": ["174", "177"],
    "176": ["174"],
    "177": ["175"],
    "178": ["120", "133"],
    "179": ["132", "146"],
  },
};

export default SkillNodes;