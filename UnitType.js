export class UnitType {
  constructor({ name, until, domain, move, rng, att, def, hit, firepwr, cost, hold, role, preq, flags } = {}) {
    this.name = name;
    this.until = until;
    this.domain = domain;
    this.move = move;
    this.rng = rng;
    this.att = att;
    this.def = def;
    this.hit = hit;
    this.firepwr = firepwr;
    this.cost = cost;
    this.hold = hold;
    this.role = role;
    this.preq = preq;
    this.flags = flags;
  }
}
