import { UnitTypes } from "./UnitTypes.js";

const TYPE_PARTISANS = 9;

export class Civ2 {
  static m = 8;

  static getEffectiveAttack(attacker, defender) {
    // let attackerUnitType = UnitTypes.list[attacker.type];
    let att = attacker.att * this.m;
    if (attacker.veteran) {
      att += Math.floor(att / 2);
    }
    if (attacker.type == TYPE_PARTISANS && defender.att == 0) {
      att *= 8;
    }
    if (attacker.paradrop) {
      att += Math.floor(att / 2);
    }
    return att;
  }

  static getEffectiveDefense(attacker, defender) {
    // let attackerUnitType = UnitTypes.list[attacker.type];
    let def = defender.def * this.m;
    if (defender.veteran) {
      def += Math.floor(def / 2);
    }
    if (defender.fortification == 'Walls') {
      def *= 3;
    } else if (defender.fortification == 'Fortress') {
      def *= 2;
    } else if (defender.fortified) {
      def += Math.floor(def / 2);
    }
    return def;
  }

  static setEffectives(attackerInput, defenderInput, attackerEffective, defenderEffective) {
    let attackerUnitType = UnitTypes.list[attackerInput.type];
    let defenderUnitType = UnitTypes.list[defenderInput.type];
    attackerEffective.att = this.getEffectiveAttack(attackerInput, defenderInput);
    attackerEffective.def = attackerInput.def;
    attackerEffective.hit = attackerInput.hit;
    attackerEffective.firepwr = attackerInput.firepwr;
    defenderEffective.att = defenderInput.att;
    defenderEffective.def = this.getEffectiveDefense(attackerInput, defenderInput);
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
      defenderEffective.firepwr = 1;
    }
    // Submarine flag
    if (defenderUnitType.submarineAdvantagesDisadvantages()) {
      defenderEffective.firepwr = 1;
    }
  }
}