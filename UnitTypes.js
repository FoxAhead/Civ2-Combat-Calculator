import { UnitType } from "./UnitType.js";

export class UnitTypes {
  static list = [];
  static async loadFromRulesTxt(fileName) {
    const rulesTxt = await readTextFile(fileName);
    this.list = parseRulesTxt(rulesTxt);
  }
}

async function readTextFile(fileName) {
  const response = await fetch(fileName);
  const text = await response.text();
  return text;
}

function parseRulesTxt(text) {
  const lines = text.split(/\r?\n/);
  const unitsList = [];
  let readingUnits = false;
  for (let line of lines) {
    if (readingUnits) {
      if (line == '') {
        readingUnits = false;
      } else {
        let tokens = line.split(',').map(item => item.trim());
        if (tokens[12] != 'no') {
          unitsList.push(
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
    }
  }
  return unitsList;
}
