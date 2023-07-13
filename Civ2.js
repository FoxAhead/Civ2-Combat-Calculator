// import { UnitTypes } from "./UnitTypes.js";

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
    if (defender.fortified) {
      def += Math.floor(def / 2);
    }
    return def;
  }
}