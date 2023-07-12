export class Civ2 {
  static m = 8;
  static getEffectiveAttack(attacker, defender) {
    let att = attacker.unitType.att * this.m;
    if (attacker.veteran) {
      att += Math.floor(att / 2);
    }
    if (attacker.partisans && defender.unitType.att == 0) {
      att *= 8;
    }
    if (attacker.paradrop) {
      att += Math.floor(att / 2);
    }
    return att;
  }
}