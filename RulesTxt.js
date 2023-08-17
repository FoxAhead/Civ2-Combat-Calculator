import { UnitType } from "./UnitType.js";
import { TerrainType } from "./TerrainType.js";

const cosmic = {
  roadMovementMultiplier: 0
};
const unitTypes = [];
const terrainTypes = [];
const difficulty = [];
const sectionParsers = {
  '@COSMIC': parseSectionCosmic,
  '@UNITS': parseSectionUnits,
  '@TERRAIN': parseSectionTerrain,
  '@DIFFICULTY': parseSectionDifficulty,
};

export class RulesTxt {

  static async loadFromFile(fileName) {
    const rulesTxt = await readTextFile(fileName);
    parseRulesTxt(rulesTxt);
  }

  static async loadFromFile2(file) {
    const rulesTxt = await readTextFile2(file);
    parseRulesTxt(rulesTxt);
  }

  static getCosmic() {
    return cosmic;
  }

  static getUnitType(type) {
    return unitTypes[type];
  }

  static getTerrainType(type) {
    return terrainTypes[type];
  }

  static getStrengthRadios() {
    const rmm = cosmic.roadMovementMultiplier;
    let radios = [];
    for (let index = rmm; index > 0; index--) {
      radios.push({
        text: (index == rmm) ? 'Full strength' : `${index}/${rmm}`,
        value: index,
        checked: (index == rmm)
      });
    }
    return radios;
  }

  static getUnitTypesOptions() {
    let options = [];
    for (const [index, unit] of unitTypes.entries()) {
      options.push({
        // text: `${index}. ${unit.name} - ${unit.att}a/${unit.def}d/${unit.hit}h/${unit.firepwr}f`,
        text: `${unit.name} - ${unit.att}a/${unit.def}d/${unit.hit}h/${unit.firepwr}f`,
        value: index,
      });
    }
    return options;
  }
  static getTerrainTypesOptions() {
    let options = [];
    for (const [index, terrain] of terrainTypes.entries()) {
      options.push({
        text: `${terrain.name} - ${terrain.defense}d (${terrain.defense * 50}%)`,
        value: index,
      });
    }
    return options;
  }
}

async function readTextFile(fileName) {
  const response = await fetch(fileName);
  const text = await response.text();
  return text;
}

function readTextFile2(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = res => {
      resolve(res.target.result);
    }
    reader.onerror = err => reject(err);
    reader.readAsText(file);
  });
}

function parseRulesTxt(text) {
  const lines = text.split(/\r?\n/);
  unitTypes.length = 0;
  terrainTypes.length = 0;
  difficulty.length = 0;
  let currentSection = '';
  let index = 0;
  for (let line of lines) {
    if (currentSection != '') {
      if (line == '') {
        currentSection = ''
      } else {
        if (sectionParsers[currentSection] != undefined) { sectionParsers[currentSection](line, index) };
        index++;
      }
    } else {
      if (line[0] == '@') {
        currentSection = line;
        index = 0;
      }
    }
    continue;
  }
}

function parseSectionCosmic(line, index) {
  let tokens = line.split(';').map(item => item.trim());
  switch (index) {
    case 0:
      cosmic.roadMovementMultiplier = tokens[0];
      break;
  }
}

function parseSectionUnits(line, index) {
  let tokens = line.split(',').map(item => item.trim());
  if (tokens[12] != 'no') {
    unitTypes.push(
      new UnitType({
        name: tokens[0],
        until: tokens[1],
        domain: parseInt(tokens[2]),
        move: parseInt(tokens[3]),
        rng: parseInt(tokens[4]),
        att: parseInt(tokens[5]),
        def: parseInt(tokens[6]),
        hit: parseInt(tokens[7]),
        firepwr: parseInt(tokens[8]),
        cost: parseInt(tokens[9]),
        hold: parseInt(tokens[10]),
        role: parseInt(tokens[11]),
        preq: tokens[12],
        flags: parseInt(tokens[13], 2),
      })
    );
  }
}

function parseSectionTerrain(line, index) {
  let tokens = line.split(',').map(item => item.trim());
  terrainTypes.push(
    new TerrainType({
      name: tokens[0],
      movecost: parseInt(tokens[1]),
      defense: parseInt(tokens[2]),
      food: parseInt(tokens[3]),
      shields: parseInt(tokens[4]),
      trade: parseInt(tokens[5]),
    })
  );
}

function parseSectionDifficulty(line, index) {
  difficulty.push(line);
}