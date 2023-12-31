import { RulesTxt } from "./RulesTxt.js";
import { Civ2, Location } from "./Civ2.js";
import { UnitType } from "./UnitType.js";

window.onload = main;

const labels1 = [];
const labels2 = [];
const hps1 = [];
const hps1a = [];
const hps2 = [];
const hps2a = [];
let attacker = {};
let defender = {};
let workers = [];
let app, vm, myChart1, myChart2;
const CHART_COLOR = [
  [
    'rgba(0,0,192,1.0)',
    'rgba(0,0,192,0.5)',
  ],
  [
    'rgba(192,0,0,1.0)',
    'rgba(192,0,0,0.5)',
  ]
];

function UnitInput({ type = 2, att = 1, def = 1, hit = 10, firepwr = 1, river = false, terrain = 2, veteran = false, fortified = false, paradrop = false, location = Location.OPEN, strength = RulesTxt.getCosmic().roadMovementMultiplier } = {}) {
  this.type = type;
  this.att = att;
  this.def = def;
  this.hit = hit;
  this.firepwr = firepwr;
  this.river = river;
  this.terrain = terrain;
  this.veteran = veteran;
  this.fortified = fortified;
  this.paradrop = paradrop;
  this.location = location;
  this.city = { walls: false, coastal: false, sdi: false, sam: false };
  this.strength = strength;
}

function UnitEffective({ att = 0, def = 0, hit = 0, firepwr = 0, rank = 0, nuclear = false } = {}) {
  this.att = att;
  this.def = def;
  this.hit = hit;
  this.firepwr = firepwr;
  this.rank = rank;
  this.nuclear = nuclear;
}

function EffectiveExplain({ att = [], def = [], hit = [], firepwr = [], rank = [] } = {}) {
  this.att = att;
  this.def = def;
  this.hit = hit;
  this.firepwr = firepwr;
  this.rank = rank;
}

function UnitOutput({ s, p0, p, pc } = {}) {
  this.effective = new UnitEffective();
  this.explain = new EffectiveExplain();
  this.s = s;
  this.p0 = p0;
  this.p = p;
  this.pc = pc;
}

async function main() {
  await RulesTxt.loadFromFile('RULES.TXT');
  initVue();
  initCharts();
  parseURLParams();
  vm.callStartCalc();
}

async function onChangeRulesTxt(ev) {
  let file = ev.target.files[0];
  await RulesTxt.loadFromFile2(file);
  vm.setSelectOptions();
}

function initVue() {
  app = Vue.createApp({
    data() {
      return {
        workersCount: 0,
        strengthRadios: RulesTxt.getStrengthRadios(),
        unitTypes: RulesTxt.getUnitTypesOptions(),
        terrainTypes: RulesTxt.getTerrainTypesOptions(),
        input: {
          unit: [
            new UnitInput(),
            new UnitInput()
          ],
          attackingUnit: 0,
        },
        output: {
          unit: [
            new UnitOutput(),
            new UnitOutput()
          ],
          s: 0,
          share: '',
        }
      }
    },
    methods: {
      onClickStart() {
        startSim();
      },
      onClickStop() {
        stopSim();
      },
      onClickArrow() {
        this.input.attackingUnit = 1 - this.input.attackingUnit;
      },
      onClickRulesTxt() {
        let input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt';
        input.onchange = onChangeRulesTxt;
        input.click();
      },
      setSelectOptions() {
        this.strengthRadios = RulesTxt.getStrengthRadios();
        this.input.unit[0].strength = RulesTxt.getCosmic().roadMovementMultiplier;
        this.input.unit[1].strength = RulesTxt.getCosmic().roadMovementMultiplier;
        this.unitTypes = RulesTxt.getUnitTypesOptions();
        this.terrainTypes = RulesTxt.getTerrainTypesOptions();
        this.moveUnitsValuesToForm(0);
        this.moveUnitsValuesToForm(1);
      },
      moveUnitsValuesToForm(unitIndex) {
        this.input.unit[unitIndex].att = 0;
        this.input.unit[unitIndex].def = 0;
        this.input.unit[unitIndex].hit = 0;
        this.input.unit[unitIndex].firepwr = 0;
        // console.log('moveUnitsValuesToForm');
        const unit = RulesTxt.getUnitType(this.input.unit[unitIndex].type);
        if (unit != undefined) {
          this.input.unit[unitIndex].att = unit.att;
          this.input.unit[unitIndex].def = unit.def;
          this.input.unit[unitIndex].hit = unit.hit * 10;
          this.input.unit[unitIndex].firepwr = unit.firepwr;
        }
      },
      checkInput(unitIndex) {
        const unitType = RulesTxt.getUnitType(this.input.unit[unitIndex].type);
        if (unitType != undefined) {
          if (!unitType.canMakeParadrops && this.input.unit[unitIndex].paradrop) { //Can make paradrops
            this.$nextTick(() => {
              this.input.unit[unitIndex].paradrop = false;
            });
          }
        }
      },
      callStartCalc() {
        let data1 = {
          input: {
            unit: this.input.unit[0],
          },
          output: {
            unit: this.output.unit[0],
            labels: labels1,
            hps: hps1,
            hpsa: hps1a,
          }
        };
        let data2 = {
          input: {
            unit: this.input.unit[1],
          },
          output: {
            unit: this.output.unit[1],
            labels: labels2,
            hps: hps2,
            hpsa: hps2a,
          }
        };
        if (this.input.attackingUnit == 0) {
          startCalc(data1, data2);
        } else {
          startCalc(data2, data1);
        }
      },
      showParadrop(unitIndex) {
        const unitType = RulesTxt.getUnitType(this.input.unit[unitIndex].type);
        if (unitType != undefined) {
          return (unitType.canMakeParadrops() && this.isAttackingUnit(unitIndex));
        } else {
          return false;
        }
      },
      isAttackingUnit(unitIndex) {
        return this.input.attackingUnit == unitIndex;
      },
      showCity(unitIndex) {
        return !this.isAttackingUnit(unitIndex) && (this.input.unit[unitIndex].location == Location.CITY);
      },
      showEffFirepwr(unitIndex) {
        return this.output.unit[unitIndex].explain.firepwr.length > 0;
      }
    },
    computed: {
      getAttackArrow() {
        // return (this.input.leftToRight) ? String.fromCharCode(8213, 9654) : String.fromCharCode(9664, 8213);
        // return (this.input.leftToRight) ? '<i class="bi bi-arrow-right"></i>' : '<i class="bi bi-arrow-left"></i>';
        return (this.input.attackingUnit == 0) ? '-->' : '<--';
      },
      getAttackColor() {
        return (this.input.attackingUnit == 0) ? 'btn-outline-primary' : 'btn-outline-danger';
      },
      showStop() {
        // console.log("showStop");
        return (this.workersCount > 0);
      },
      getLastModified() {
        return document.lastModified;
      }
    },
    watch: {
      input: {
        handler(newValue, oldValue) {
          // console.log('input');
          this.checkInput(0);
          this.checkInput(1);
          this.callStartCalc();
          this.output.share = packInput(this.input);
          window.history.replaceState({}, '', this.output.share);
        },
        deep: true
      },
    },
    mounted() {
      // console.log('mounted');
      this.moveUnitsValuesToForm(0);
      this.moveUnitsValuesToForm(1);
    }
  })

  vm = app.mount('#app')
}

function initCharts() {
  myChart1 = new Chart("myChart1", {
    type: "bar",
    data: {
      labels: labels1,
      datasets: [
        {
          backgroundColor: CHART_COLOR[0][0],
          data: hps1
        },
        {
          backgroundColor: CHART_COLOR[0][1],
          data: hps1a
        }
      ]
    }
    ,
    options: {
      layout: {
        padding: {
          bottom: -3,
        }
      },
      animation: { duration: 100 },
      plugins: { legend: false },
      scales: {
        // xAxes: [{
        //   scaleLabel: {
        //     display: true,
        //     labelString: 'HP left',
        //     fontSize: 8
        //   }
        // }],
        yAxes: [{
          position: 'right',
          ticks: {
            beginAtZero: true
          }
          // scaleLabel: {
          //   display: true,
          //   labelString: '%'
          // }
        }]
      }
    }
  });
  myChart2 = new Chart("myChart2", {
    type: "bar",
    data: {
      labels: labels2,
      datasets: [
        {
          backgroundColor: CHART_COLOR[1][0],
          data: hps2
        },
        {
          backgroundColor: CHART_COLOR[1][1],
          data: hps2a
        }
      ]
    }
    ,
    options: {
      layout: {
        padding: {
          bottom: -3,
        }
      },
      animation: { duration: 100 },
      plugins: { legend: false },
      scales: {
        // xAxes: [{
        //   scaleLabel: {
        //     display: true,
        //     labelString: 'HP left'
        //   }
        // }],
        yAxes: [{
          ticks: {
            beginAtZero: true
          }
          //   scaleLabel: {
          //     display: true,
          //     labelString: '%'
          //   }
        }]
      }
    }
  });
}

function startCalc(_attacker, _defender) {
  stopSim();
  attacker = _attacker;
  defender = _defender;
  initCalcArrays();
  initSimArrays();
  vm.output.s = 0;
  removeSimArraysFromChart();
  undefineObjectProperties(attacker.output.unit);
  undefineObjectProperties(defender.output.unit);
  Civ2.setEffectives(
    attacker.input.unit,
    defender.input.unit,
    attacker.output.unit.effective,
    defender.output.unit.effective,
    attacker.output.unit.explain,
    defender.output.unit.explain,
  );
  calculate(attacker, defender);
}

function startSim() {
  stopSim();
  addSimArraysToCharts();
  initSimArrays();
  vm.output.s = 0;
  attacker.output.unit.s = 0;
  defender.output.unit.s = 0;
  attacker.output.unit.p = 0;
  defender.output.unit.p = 0;
  vm.workersCount = 4;
  for (let i = 0; i < vm.workersCount; i++) {
    workers.push({
      w: new Worker("workerSimulateCombats.js", { type: "module" }),
      finished: false
    });
    workers[i].w.onmessage = receiveWorkerMessage;
  }
  for (let i = 0; i < workers.length; i++) {
    workers[i].w.postMessage({
      unitA: new UnitEffective(attacker.output.unit.effective),
      unitD: new UnitEffective(defender.output.unit.effective)
    });
  }
}

function pa(a, d) {
  if (d == 0) {
    return 1 - 1 / a;
  }
  else if (a > d) {
    return 1 - (d + 1) / (2 * a);
  }
  else {
    return (a - 1) / (2 * d);
  }
}

function calculate(attacker, defender) {
  let effA = attacker.output.unit.effective;
  let effD = defender.output.unit.effective;
  if (attacker.input.unit.att >= 99) {
    // Nuclear Msl.
    if (effD.nuclear) {
      // Defense in city thwarts nuclear attack
      attacker.output.unit.pc = 0;
      defender.output.unit.pc = 100;
      attacker.output.unit.p0 = 0;
      defender.output.unit.p0 = 100;
      defender.output.hps[effD.hit - 1] = 100;
    } else {
      // Nuked
      attacker.output.unit.pc = 100;
      defender.output.unit.pc = 0;
      attacker.output.unit.p0 = 100;
      defender.output.unit.p0 = 0;
      attacker.output.hps[effA.hit - 1] = 100;
    }
  } else if (attacker.input.unit.att > 0) {
    let p = pa(effA.att, effD.def);
    let toWinA = Math.ceil(effD.hit / effA.firepwr);
    let toWinD = Math.ceil(effA.hit / effD.firepwr);
    attacker.output.unit.pc = 0;
    defender.output.unit.pc = 0;
    for (let k = 0, hp = effA.hit; hp > 0; k++, hp -= effD.firepwr) {
      let pi = nbd(p, k, toWinA);
      attacker.output.unit.pc += pi;
      attacker.output.hps[hp - 1] = (pi * 100).toFixed(2);
    }
    for (let k = 0, hp = effD.hit; hp > 0; k++, hp -= effA.firepwr) {
      let pi = nbd(1 - p, k, toWinD);
      defender.output.unit.pc += pi;
      defender.output.hps[hp - 1] = (pi * 100).toFixed(2);
    }
    attacker.output.unit.pc = (attacker.output.unit.pc * 100).toFixed(2);
    defender.output.unit.pc = (defender.output.unit.pc * 100).toFixed(2);
    attacker.output.unit.p0 = (p * 100).toFixed(2);
    defender.output.unit.p0 = (100 - attacker.output.unit.p0).toFixed(2);
  }
  let max = 0;
  for (let i = 0; i < attacker.output.hps.length; i++) {
    max = Math.max(max, attacker.output.hps[i]);
  }
  for (let i = 0; i < defender.output.hps.length; i++) {
    max = Math.max(max, defender.output.hps[i]);
  }
  max = max * 1.05;
  max = parseFloat(max.toPrecision(2));
  myChart1.options.scales.yAxes[0].ticks.max = max;
  myChart2.options.scales.yAxes[0].ticks.max = max;
  myChart1.update();
  myChart2.update();
}

/**
 * Negative binomial distribution
 * @param {float} p - probability of success
 * @param {integer} k - number of failures
 * @param {integer} r - number of successes
 * @returns {float}
 */
function nbd(p, k, r) {
  let q = 1 - p;
  return combinations(k + r - 1, k) * (p ** r) * (q ** k);
}

function productRange(a, b) {
  var product = a, i = a;
  while (i++ < b) {
    product *= i;
  }
  return product;
}

function combinations(n, k) {
  if (n == k) {
    return 1;
  } else if (k == 0) {
    return 1;
  } else {
    k = Math.max(k, n - k);
    return productRange(k + 1, n) / productRange(1, n - k);
  }
}

function stopSim() {
  for (let i = 0; i < workers.length; i++) {
    workers[i].w.terminate();
    workers[i].w = undefined;
  }
  workers.length = 0;
  vm.workersCount = 0;
}

function receiveWorkerMessage(event) {
  if (event.data.finished) {
    vm.workersCount--;
  } else {
    const resultA = event.data.unitA;
    const resultD = event.data.unitD;
    for (let i = 0; i < resultA.hps.length; i++) {
      attacker.output.hpsa[i - 1] += resultA.hps[i] / 400000;
    }
    for (let i = 0; i < resultD.hps.length; i++) {
      defender.output.hpsa[i - 1] += resultD.hps[i] / 400000;
    }
    attacker.output.unit.s += resultA.wins;
    defender.output.unit.s += resultD.wins;
    vm.output.s = attacker.output.unit.s + defender.output.unit.s;
    attacker.output.unit.p = (attacker.output.unit.s / vm.output.s * 100).toFixed(2);
    defender.output.unit.p = (defender.output.unit.s / vm.output.s * 100).toFixed(2);
    myChart1.update();
    myChart2.update();
  }
}

function initCalcArrays() {
  initArray(attacker.output.labels, attacker.input.unit.hit, 1, 1);
  initArray(defender.output.labels, defender.input.unit.hit, 1, 1);
  initArray(attacker.output.hps, attacker.input.unit.hit);
  initArray(defender.output.hps, defender.input.unit.hit);
}

function initSimArrays() {
  initArray(attacker.output.hpsa, attacker.input.unit.hit);
  initArray(defender.output.hpsa, defender.input.unit.hit);
}

function addSimArraysToCharts() {
  myChart1.data.datasets[1] = {
    backgroundColor: CHART_COLOR[0][1],
    data: hps1a
  }
  myChart2.data.datasets[1] = {
    backgroundColor: CHART_COLOR[1][1],
    data: hps2a
  }
  myChart1.update();
  myChart2.update();
}

function removeSimArraysFromChart() {
  myChart1.data.datasets.length = 1;
  myChart2.data.datasets.length = 1;
  myChart1.update();
  myChart2.update();
}

function initArray(arr, len, first = 0, delta = 0) {
  arr.length = len;
  arr.fill(0);
  if (delta > 0) {
    for (let i = 0, j = first; i < arr.length; i++, j += delta) {
      arr[i] = j;
    }
  }
}

function undefineObjectProperties(obj) {
  if (obj instanceof Array) {
    obj.length = 0;
  } else {
    for (const property in obj) {
      if (obj.hasOwnProperty(property)) {
        if (typeof (obj[property]) == 'object') {
          undefineObjectProperties(obj[property])
        } else {
          obj[property] = undefined;
        }
      }
    }
  }
}

function parseURLParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const u1 = urlParams.get('u1');
  const u2 = urlParams.get('u2');
  if (u1 != null && u2 != null) {
    unpackUnitInput(u1, vm.input.unit[0]);
    unpackUnitInput(u2, vm.input.unit[1]);
    const au = urlParams.get('au');
    if (au != null) {
      vm.input.attackingUnit = +au;
    }
  }
}

function packInput(input) {
  let u1 = packUnitInput(input.unit[0]);
  let u2 = packUnitInput(input.unit[1]);
  let au = input.attackingUnit ? `&au=${input.attackingUnit}` : '';
  return '?u1=' + u1 + '&u2=' + u2 + au;
}

function packUnitInput(unitInput) {
  let byte = 0;
  let bytes = new Uint8Array(9);
  let view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  view.setUint8(0, unitInput.type);    // 0..255
  view.setUint8(1, unitInput.att);     // 0..255
  view.setUint8(2, unitInput.def);     // 0..255
  view.setUint8(3, unitInput.hit);     // 0..255
  view.setUint8(4, unitInput.firepwr); // 0..255

  byte = unitInput.terrain & 0x3F; // 6 bits, up to 64 terrains
  byte |= unitInput.river << 6;
  view.setUint8(5, byte);

  byte = unitInput.veteran;
  byte |= unitInput.fortified << 1;
  byte |= unitInput.paradrop << 2;
  byte |= (unitInput.location & 3) << 3; // 2 bits
  view.setUint8(6, byte);

  byte = unitInput.city.walls;
  byte |= unitInput.city.coastal << 1;
  byte |= unitInput.city.sdi << 2;
  byte |= unitInput.city.sam << 3;
  // byte |= unitInput.city.palace << 4;
  view.setUint8(7, byte);

  view.setUint8(8, unitInput.strength);

  // console.log(bytes);
  let s = base64UrlEncode(bytes);
  // console.log(s);
  // console.log(unitInput);
  return s;
}

function unpackUnitInput(s, unitInput) {
  let byte = 0;
  let bytes = base64UrlDecode(s);
  let view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  // console.log(bytes);
  unitInput.type = view.getUint8(0);
  unitInput.att = view.getUint8(1);
  unitInput.def = view.getUint8(2);
  unitInput.hit = view.getUint8(3);
  unitInput.firepwr = view.getUint8(4);

  byte = view.getUint8(5);
  unitInput.terrain = byte & 0x3F;
  unitInput.river = Boolean(byte >> 6 & 1);

  byte = view.getUint8(6);
  unitInput.veteran = Boolean(byte & 1);
  unitInput.fortified = Boolean(byte >> 1 & 1);
  unitInput.paradrop = Boolean(byte >> 2 & 1);
  unitInput.location = byte >> 3 & 3;

  byte = view.getUint8(7);
  unitInput.city.walls = Boolean(byte & 1);
  unitInput.city.coastal = Boolean(byte >> 1 & 1);
  unitInput.city.sdi = Boolean(byte >> 2 & 1);
  unitInput.city.sam = Boolean(byte >> 3 & 1);

  unitInput.strength = view.getUint8(8);
}


function base64UrlEncode(bytes) {
  let a = btoa(String.fromCharCode(...bytes));
  a = a.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/m, '');
  return a;
}

function base64UrlDecode(s) {
  let a = s.replace(/-/g, '+').replace(/_/g, '/');
  let pad = a.length % 4;
  if (pad) {
    if (pad === 1) {
      throw new Error('InvalidLengthError: Input base64url string is the wrong length to determine padding');
    }
    a += new Array(5 - pad).join('=');
  }
  return new Uint8Array(atob(a).split("").map(function (c) {
    return c.charCodeAt(0);
  }));
}

