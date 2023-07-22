import { RulesTxt } from "./RulesTxt.js";

const TYPE_PARTISANS = 9;

const m = 8;
const m2 = 4;

export class Civ2 {

  static getEffectiveAttack(attacker, defender, explain) {
    let att = attacker.att * m;
    explain.push(`x${m} = ${att}`);
    if (attacker.veteran) {
      att += Math.floor(att / 2);
      explain.push(`Veteran: x1.5 = ${att}`);
    }
    if (attacker.paradrop) {
      att += Math.floor(att / 2);
      explain.push(`Paradrop: x1.5 = ${att}`);
    }
    if (attacker.strength < 3) {
      att = Math.floor(att * attacker.strength / 3);
      explain.push(`x${attacker.strength}/3 strength = ${att}`);
    }
    if (attacker.type == TYPE_PARTISANS && defender.att == 0) {
      att *= 8;
      explain.push(`Partisans vs 0a: x8 = ${att}`);
    }
    return att;
  }

  static getEffectiveDefense(attacker, defender, explain) {
    let def = defender.def * m2;
    explain.push(`x${m2} = ${def}`);
    let attackerUnitType = RulesTxt.getUnitType(attacker.type);
    let defenderUnitType = RulesTxt.getUnitType(defender.type);
    let terrain = RulesTxt.getTerrainType(defender.terrain);
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
    if (defender.location == 'Fortress') {
      if (attackerUnitType.domain != 1 && !attackerUnitType.negatesCityWallsHowitzer()) {
        dword_6ACB34 = 4;
        explainText = `Fortress`;
      }
    }
    while (true) {
      if (defender.location == 'City') {
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
        if (defender.city.walls && defenderUnitType.domain == 0) {
          if (attackerUnitType.domain == 0 && !attackerUnitType.negatesCityWallsHowitzer()) {
            dword_6ACB34 = 6;
            explainText = `City Walls or Great Wall`;
          }
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
    return def;
  }

  static setEffectives(attackerInput, defenderInput, attackerEffective, defenderEffective, attackerExplain, defenderExplain) {
    let attackerUnitType = RulesTxt.getUnitType(attackerInput.type);
    let defenderUnitType = RulesTxt.getUnitType(defenderInput.type);

    attackerEffective.att = this.getEffectiveAttack(attackerInput, defenderInput, attackerExplain.att);
    attackerEffective.def = attackerInput.def;
    attackerEffective.hit = attackerInput.hit;
    attackerEffective.firepwr = attackerInput.firepwr;

    defenderEffective.att = defenderInput.att;
    defenderEffective.def = this.getEffectiveDefense(attackerInput, defenderInput, defenderExplain.def);
    defenderEffective.hit = defenderInput.hit;
    defenderEffective.firepwr = defenderInput.firepwr;

    // Helicopter vs Fighter
    if (attackerUnitType.role == 3 && defenderUnitType.domain == 1 && defenderUnitType.rng == 0) {
      defenderEffective.firepwr = 1;
      defenderExplain.firepwr.push(`Helicopter vs Fighter: = ${defenderEffective.firepwr}`);
      defenderEffective.def -= Math.floor(defenderEffective.def / 2);
      defenderExplain.def.push(`Helicopter vs Fighter: -50% = ${defenderEffective.def}`);
    }
    // Pikemen vs mounted
    if (defenderUnitType.x2OnDefenseVersusHorsePikemen()) {
      if (attackerUnitType.move == 2 && attackerUnitType.domain == 0 && attackerInput.hit == 10) {
        defenderEffective.def += Math.floor(defenderEffective.def / 2);
        defenderExplain.def.push(`Pikemen vs mounted: x1.5 = ${defenderEffective.def}`);
      }
    }
    // AEGIS
    if (defenderUnitType.x2OnDefenseVersusAirAEGIS() && attackerUnitType.domain == 1) {
      if (attackerUnitType.destroyedAfterAttackingMissiles()) {
        defenderEffective.def *= 5;
        defenderExplain.def.push(`AEGIS vs Missile: x5 = ${defenderEffective.def}`);
      } else {
        defenderEffective.def *= 3;
        defenderExplain.def.push(`AEGIS vs air: x3 = ${defenderEffective.def}`);
      }
    }
    // Coastal Fortress
    if (defenderInput.location == 'City' && attackerUnitType.domain == 2 && defenderUnitType.domain != 2) {
      if (defenderInput.city.coastal) {
        defenderEffective.def *= 2;
        defenderExplain.def.push(`Coastal Fortress: x2 = ${defenderEffective.def}`);
      }
    }
    // City air defense
    if (defenderInput.location == 'City' && attackerUnitType.domain == 1) {
      if (!defenderUnitType.canAttackAirUnitsFighter() || attackerUnitType.destroyedAfterAttackingMissiles()) {
        if (defenderInput.city.sdi) {
          if (attackerUnitType.destroyedAfterAttackingMissiles() && attackerInput.att < 99) {
            defenderEffective.def *= 2;
            defenderExplain.def.push(`SDI Defense vs Missile: x2 = ${defenderEffective.def}`);
          }
        }
        if (defenderInput.city.sam) {
          defenderEffective.def *= 2;
          defenderExplain.def.push(`SAM Missile Battery: x2 = ${defenderEffective.def}`);
        }
      }
    }
    // Shore bombardment
    if (attackerUnitType.domain == 2 && defenderUnitType.domain == 0) {
      attackerEffective.firepwr = 1;
      attackerExplain.firepwr.push(`Shore bombardment: = ${attackerEffective.firepwr}`);
      defenderEffective.firepwr = 1;
      defenderExplain.firepwr.push(`Shore bombardment: = ${defenderEffective.firepwr}`);
    }
    // Submarine flag
    if (defenderUnitType.submarineAdvantagesDisadvantages()) {
      defenderEffective.firepwr = 1;
    }
    // Caught in port
    if (defenderUnitType.domain == 2 && defenderInput.location == 'City' && attackerUnitType.domain != 2) {
      defenderEffective.firepwr = 1;
      defenderExplain.firepwr.push(`Caught in port: = ${defenderEffective.firepwr}`);
      attackerEffective.firepwr *= 2;
      attackerExplain.firepwr.push(`Caught in port: x2 = ${attackerEffective.firepwr}`);
    }
  }
}