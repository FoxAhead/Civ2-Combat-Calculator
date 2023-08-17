import { RulesTxt } from "./RulesTxt.js";

const TYPE_PARTISANS = 9;
export const Location = Object.freeze({
  OPEN: 0,
  FORTRESS: 1,
  CITY: 2
})

const m = 8;
const m2 = 4;

export class Civ2 {

  static getEffectiveAttack(attacker, defender, explain) {
    explain.push(`Effective Attack:`);
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
    const rmm = RulesTxt.getCosmic().roadMovementMultiplier;
    if (attacker.strength < rmm) {
      att = Math.floor(att * attacker.strength / rmm);
      explain.push(`x${attacker.strength}/${rmm} strength = ${att}`);
    }
    if (attacker.type == TYPE_PARTISANS && defender.att == 0) {
      att *= 8;
      explain.push(`Partisans vs 0a: x8 = ${att}`);
    }
    return att;
  }

  static getEffectiveDefense(attacker, defender, explain) {
    explain.push(`Effective Defense:`);
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
    if (defender.location == Location.FORTRESS) {
      if (attackerUnitType.domain != 1 && !attackerUnitType.negatesCityWallsHowitzer()) {
        dword_6ACB34 = 4;
        explainText = `Fortress`;
      }
    }
    while (true) {
      if (defender.location == Location.CITY) {
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

  static getDefenderRank(attacker, defender, explain) {
    explain.push(`Defender Rank:`);
    let dummy = [];
    let attackerUnitType = RulesTxt.getUnitType(attacker.type);
    let defenderUnitType = RulesTxt.getUnitType(defender.type);
    let rank = this.getEffectiveDefense(attacker, defender, dummy);
    explain.push(`= Effective Defense = ${rank}`);
    let fullHP = 10 * defenderUnitType.hit;
    rank = Math.floor(rank * defender.hit / fullHP);
    explain.push(`Health: x${defender.hit}/${fullHP} = ${rank}`);
    if (defenderUnitType.x2OnDefenseVersusHorsePikemen()) {
      rank++;
      explain.push(`Pikemen: +1 = ${rank}`);
    }
    if (defenderUnitType.x2OnDefenseVersusAirAEGIS()) {
      if (attackerUnitType.domain == 1) {
        if (attackerUnitType.destroyedAfterAttackingMissiles()) {
          rank *= 5;
          explain.push(`AEGIS vs Missile: x5 = ${rank}`);
        } else {
          rank *= 3;
          explain.push(`AEGIS vs air: x3 = ${rank}`);
        }
      }
    }
    if (defenderUnitType.canAttackAirUnitsFighter()) {
      if (attackerUnitType.domain == 1 && attackerUnitType.canAttackAirUnitsFighter()) {
        rank *= 2;
        explain.push(`Fighter vs Fighter: x2 = ${rank}`);
      }
    }
    if (defenderUnitType.domain == 2 && defender.location == Location.CITY) {
      if (attackerUnitType.domain == 1 && !defender.city.sam) {
        rank *= 2;
        explain.push(`Sea vs Air in city without SAM: x2 = ${rank}`);
      } else {
        rank = Math.floor(rank / 2);
        explain.push(`Sea vs Air in city with SAM: /2 = ${rank}`);
      }
    }
    return rank;
  }

  static setEffectives(attackerInput, defenderInput, attackerEffective, defenderEffective, attackerExplain, defenderExplain) {
    let attackerUnitType = RulesTxt.getUnitType(attackerInput.type);
    let defenderUnitType = RulesTxt.getUnitType(defenderInput.type);

    attackerEffective.att = this.getEffectiveAttack(attackerInput, defenderInput, attackerExplain.att);
    attackerEffective.def = attackerInput.def;
    attackerEffective.hit = attackerInput.hit;
    attackerEffective.firepwr = attackerInput.firepwr;
    attackerEffective.rank = 0;
    attackerEffective.nuclear = false;

    defenderEffective.att = defenderInput.att;
    defenderEffective.def = this.getEffectiveDefense(attackerInput, defenderInput, defenderExplain.def);
    defenderEffective.hit = defenderInput.hit;
    defenderEffective.firepwr = defenderInput.firepwr;
    defenderEffective.rank = this.getDefenderRank(attackerInput, defenderInput, defenderExplain.rank);
    defenderEffective.nuclear = false;

    let defenderExplainDef = [];
    // Helicopter vs Fighter
    if (attackerUnitType.role == 3 && defenderUnitType.domain == 1 && defenderUnitType.rng == 0) {
      defenderEffective.firepwr = 1;
      defenderExplain.firepwr.push(`Helicopter vs Fighter: = ${defenderEffective.firepwr}`);
      defenderEffective.def -= Math.floor(defenderEffective.def / 2);
      defenderExplainDef.push(`Helicopter vs Fighter: -50% = ${defenderEffective.def}`);
    }
    // Pikemen vs mounted
    if (defenderUnitType.x2OnDefenseVersusHorsePikemen()) {
      if (attackerUnitType.move == 2 && attackerUnitType.domain == 0 && attackerInput.hit == 10) {
        defenderEffective.def += Math.floor(defenderEffective.def / 2);
        defenderExplainDef.push(`Pikemen vs mounted: x1.5 = ${defenderEffective.def}`);
      }
    }
    // AEGIS
    if (defenderUnitType.x2OnDefenseVersusAirAEGIS() && attackerUnitType.domain == 1) {
      if (attackerUnitType.destroyedAfterAttackingMissiles()) {
        defenderEffective.def *= 5;
        defenderExplainDef.push(`AEGIS vs Missile: x5 = ${defenderEffective.def}`);
      } else {
        defenderEffective.def *= 3;
        defenderExplainDef.push(`AEGIS vs air: x3 = ${defenderEffective.def}`);
      }
    }
    // Coastal Fortress
    if (defenderInput.location == Location.CITY && attackerUnitType.domain == 2 && defenderUnitType.domain != 2) {
      if (defenderInput.city.coastal) {
        defenderEffective.def *= 2;
        defenderExplainDef.push(`Coastal Fortress: x2 = ${defenderEffective.def}`);
      }
    }
    // City air defense
    if (defenderInput.location == Location.CITY && attackerUnitType.domain == 1) {
      if (!defenderUnitType.canAttackAirUnitsFighter() || attackerUnitType.destroyedAfterAttackingMissiles()) {
        if (defenderInput.city.sdi) {
          if (attackerUnitType.destroyedAfterAttackingMissiles() && attackerInput.att < 99) {
            defenderEffective.def *= 2;
            defenderExplainDef.push(`SDI Defense vs Missile: x2 = ${defenderEffective.def}`);
          }
        }
        if (defenderInput.city.sam) {
          defenderEffective.def *= 2;
          defenderExplainDef.push(`SAM Missile Battery: x2 = ${defenderEffective.def}`);
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
      defenderExplain.firepwr.push(`Submarine disadvantage: = ${defenderEffective.firepwr}`);
    }
    // Caught in port
    if (defenderUnitType.domain == 2 && defenderInput.location == Location.CITY && attackerUnitType.domain != 2) {
      defenderEffective.firepwr = 1;
      defenderExplain.firepwr.push(`Caught in port: = ${defenderEffective.firepwr}`);
      attackerEffective.firepwr *= 2;
      attackerExplain.firepwr.push(`Caught in port: x2 = ${attackerEffective.firepwr}`);
    }
    // Nuclear Missile
    if (attackerInput.att >= 99) {
      if (defenderInput.location == Location.CITY && defenderInput.city.sdi) {
        defenderEffective.nuclear = true;
        defenderExplainDef.push(`Defense in city thwarts nuclear attack`);
      } else {
        attackerEffective.nuclear = true;
        attackerExplain.att.push(`Nuclear attack`);
      }
    }
    if (defenderExplainDef.length > 0) {
      defenderExplain.def.push(`Additional:`);
      defenderExplain.def.push(...defenderExplainDef);
    }
  }
}