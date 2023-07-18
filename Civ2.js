import { RulesTxt } from "./RulesTxt.js";

const TYPE_PARTISANS = 9;

export class Civ2 {
  static m = 8;
  static m2 = 4;

  static getEffectiveAttack(attacker, defender, explain) {
    let att = attacker.att * this.m;
    explain.push(`x${this.m} = ${att}`);
    if (attacker.veteran) {
      att += Math.floor(att / 2);
      explain.push(`Veteran: x1.5 = ${att}`);
    }
    if (attacker.paradrop) {
      att += Math.floor(att / 2);
      explain.push(`Paradrop: x1.5 = ${att}`);
    }
    if (attacker.type == TYPE_PARTISANS && defender.att == 0) {
      att *= 8;
      explain.push(`Partisans vs 0a: x8 = ${att}`);
    }
    return att;
  }

  static getEffectiveDefense(attacker, defender, explain) {
    let def = defender.def * this.m2;
    explain.push(`x${this.m2} = ${def}`);
    let attackerUnitType = RulesTxt.unitTypes[attacker.type];
    let defenderUnitType = RulesTxt.unitTypes[defender.type];
    let terrain = RulesTxt.terrainTypes[defender.terrain];
    let explainText = '';
    if (defender.river) {
      def *= (terrain.defense + 1);
      explain.push(`${terrain.name}, River: x(${terrain.defense}+1) = ${def}`);
    } else {
      def *= terrain.defense;
      explain.push(`${terrain.name}: x${terrain.defense} = ${def}`);
    }
    let dword_6ACB34 = 2;
    if (defender.fortified && defenderUnitType.domain == 0) {
      dword_6ACB34 = 3;
      explainText = `Fortified`;
    }
    if (defender.fortification == 'Fortress') {
      if (attackerUnitType.domain != 1 && !attackerUnitType.negatesCityWallsHowitzer()) {
        dword_6ACB34 = 4;
        explainText = `Fortress`;
      }
    }
    while (true) {
      if (defender.fortification == 'City' || defender.fortification == 'Walls') {
        if (defenderUnitType.domain == 1 && defenderUnitType.canAttackAirUnitsFighter()) {
          if (attackerUnitType.domain == 1 && !attackerUnitType.destroyedAfterAttackingMissiles()) {
            if (attackerUnitType.canAttackAirUnitsFighter()) {
              dword_6ACB34 *= 2;
              explainText = `Scrambling fighter vs fighter`;
            } else {
              dword_6ACB34 *= 4;
              explainText = `Scrambling fighter vs bomber`;
            }
            break;
          }
        }
      }
      if (defender.fortification == 'Walls' && defenderUnitType.domain == 0) {
        if (attackerUnitType.domain == 0 && !attackerUnitType.negatesCityWallsHowitzer()) {
          dword_6ACB34 = 6;
          explainText = `City Walls or Great Wall`;
        }
      }
      if (defenderUnitType.domain != 0) {
        dword_6ACB34 = 2;
      }
      break;
    }
    if (dword_6ACB34 != 2) {
      def = Math.floor((dword_6ACB34 * def) / 2);
      explainText += `: x${dword_6ACB34 / 2} = ${def}`
      explain.push(explainText);
    }
    if (defender.veteran) {
      def += Math.floor(def / 2);
      explain.push(`Veteran: x1.5 = ${def}`);
    }
    // if (defender.fortification == 'Walls') {
    //   def *= 3;
    //   explain.push(`City Walls: x3 = ${def}`);
    // } else if (defender.fortification == 'Fortress') {
    //   def *= 2;
    //   explain.push(`Fortress: x2 = ${def}`);
    // } else if (defender.fortified) {
    //   def += Math.floor(def / 2);
    //   explain.push(`Fortified: x1.5 = ${def}`);
    // }
    return def;
  }

  static setEffectives(attackerInput, defenderInput, attackerEffective, defenderEffective, attackerExplain, defenderExplain) {
    let attackerUnitType = RulesTxt.unitTypes[attackerInput.type];
    let defenderUnitType = RulesTxt.unitTypes[defenderInput.type];

    attackerEffective.att = this.getEffectiveAttack(attackerInput, defenderInput, attackerExplain.att);
    attackerEffective.def = undefined;
    attackerEffective.hit = attackerInput.hit;
    attackerEffective.firepwr = attackerInput.firepwr;

    defenderEffective.att = undefined;
    defenderEffective.def = this.getEffectiveDefense(attackerInput, defenderInput, defenderExplain.def);
    defenderEffective.hit = defenderInput.hit;
    defenderEffective.firepwr = defenderInput.firepwr;

    // Helicopter
    if (defenderUnitType.domain == 1 && defenderUnitType.rng == 0 && attackerUnitType.role == 3) {
      defenderEffective.firepwr = 1;
      defenderEffective.def = Math.floor(defenderEffective.def / 2);
    }
    // Shore bombardment
    if (attackerUnitType.domain == 2 && defenderUnitType.domain == 0) {
      attackerEffective.firepwr = 1;
      attackerExplain.firepwr.push('Shore bombardment: = 1');
      defenderEffective.firepwr = 1;
      defenderExplain.firepwr.push('Shore bombardment: = 1');
    }
    // Submarine flag
    if (defenderUnitType.submarineAdvantagesDisadvantages()) {
      defenderEffective.firepwr = 1;
    }
  }
}