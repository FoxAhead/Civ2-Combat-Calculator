import { UnitType } from "./UnitType.js";
import { TerrainType } from "./TerrainType.js";

const unitTypes = [];
const terrainTypes = [];

export class RulesTxt {

  static async loadFromFile(fileName) {
    const rulesTxt = await readTextFile(fileName);
    parseRulesTxt(rulesTxt, unitTypes, terrainTypes);
  }

  static getUnitType(type) {
    return unitTypes[type];
  }

  static getTerrainType(type) {
    return terrainTypes[type];
  }

  static getUnitTypesOptions() {
    let options = [];
    for (const [index, unit] of unitTypes.entries()) {
      options.push({
        // text: `${index}. ${unit.name} - ${unit.att}a/${unit.def}d/${unit.hit}h/${unit.firepwr}f`,
        text: `${unit.name} - ${unit.att}a/${unit.def}d/${unit.hit}h/${unit.firepwr}f`,
        value: options.length
      });
    }
    return options;
  }
  static getTerrainTypesOptions() {
    let options = [];
    for (const [index, terrain] of terrainTypes.entries()) {
      options.push({
        text: `${terrain.name} - ${terrain.defense}d (${terrain.defense * 50}%)`,
        value: options.length
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

function parseRulesTxt(text, unitTypes, terrainTypes) {
  const lines = text.split(/\r?\n/);
  unitTypes.length = 0;
  terrainTypes.length = 0;
  let readingUnits = false;
  let readingTerrain = false;
  for (let line of lines) {
    if (readingUnits) {
      if (line == '') {
        readingUnits = false;
      } else {
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
    }
    if (line == '@UNITS') {
      readingUnits = true;
      continue;
    }
    if (readingTerrain) {
      if (line == '') {
        readingTerrain = false;
      } else {
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
    }
    if (line == '@TERRAIN') {
      readingTerrain = true;
      continue;
    }
  }
}

