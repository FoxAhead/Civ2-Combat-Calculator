import Unit from "./Unit.js";
import { loadUnitsList } from './rules.js';

window.onload = main;

let unitsList = [];
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

async function main() {
  unitsList = await loadUnitsList('RULES.TXT');
  initVue();
  initCharts();
  vm.callStartCalc();
}

function initVue() {
  const options = [];
  for (const unit of unitsList) {
    options.push({
      text: `${unit.text} - ${unit.att}a/${unit.def}d/${unit.hp}h/${unit.fp}f`,
      value: options.length
    });
  }

  app = Vue.createApp({
    data() {
      return {
        workersCount: 0,
        max: 100,
        value: 50,
        unitsList: {
          selected1: 2,
          selected2: 2,
        },
        options: options,
        input: {
          leftToRight: true,
          unit1: {
            att: 1,
            def: 1,
            hp: 10,
            fp: 1,
          },
          unit2: {
            att: 1,
            def: 1,
            hp: 10,
            fp: 1,
          },
        },
        output: {
          unit1: {
            s: 0,
            p0: 0.0,
            p: 0.0,
            pc: 0.0
          },
          unit2: {
            s: 0,
            p0: 0.0,
            p: 0.0,
            pc: 0.0
          },
          s: 0,
        },
        totHP1: 0,
        totHP2: 0
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
        this.input.leftToRight = !this.input.leftToRight;
      },
      moveUnitsValuesToForm() {
        // console.log('moveUnitsValuesToForm');
        const unit1 = unitsList[this.unitsList.selected1];
        if (unit1 != undefined) {
          this.input.unit1.att = unit1.att;
          this.input.unit1.def = unit1.def;
          this.input.unit1.hp = unit1.hp * 10;
          this.input.unit1.fp = unit1.fp;
        }
        const unit2 = unitsList[this.unitsList.selected2];
        if (unit2 != undefined) {
          this.input.unit2.att = unit2.att;
          this.input.unit2.def = unit2.def;
          this.input.unit2.hp = unit2.hp * 10;
          this.input.unit2.fp = unit2.fp;
        }
      },
      callStartCalc() {
        let data1 = {
          input: {
            unit: this.input.unit1,
          },
          output: {
            unit: this.output.unit1,
            labels: labels1,
            hps: hps1,
            hpsa: hps1a,
          }
        };
        let data2 = {
          input: {
            unit: this.input.unit2,
          },
          output: {
            unit: this.output.unit2,
            labels: labels2,
            hps: hps2,
            hpsa: hps2a,
          }
        };
        if (this.input.leftToRight) {
          startCalc(data1, data2);
        } else {
          startCalc(data2, data1);
        }
      }
    },
    computed: {
      getArrow() {
        if (this.input.leftToRight) {
          return String.fromCharCode(8213, 9654)
        } else {
          return String.fromCharCode(9664, 8213)
        }
      },
      showStop() {
        // console.log("showStop");
        return (this.workersCount > 0);
      }
    },
    watch: {
      input: {
        handler(newValue, oldValue) {
          // console.log('input');
          this.callStartCalc();
        },
        deep: true
      },
      unitsList: {
        handler(newValue, oldValue) {
          // console.log('unitsList');
          this.moveUnitsValuesToForm();
        },
        deep: true
      }
    },
    mounted() {
      // console.log('mounted');
      this.moveUnitsValuesToForm();
    }
  })

  vm = app.mount('#app')
}

function initCharts() {
  myChart1 = new Chart("myChart1", {
    type: "bar",
    data: {
      labels: labels1,
      datasets: [{
        backgroundColor: "rgba(0,0,192,1.0)",
        data: hps1
      },
      {
        backgroundColor: "rgba(0,0,192,0.2)",
        data: hps1a
      }]
    }
    ,
    options: {
      animation: { duration: 100 },
      plugins: { legend: false },
      scales: {
        xAxes: [{
          scaleLabel: {
            display: true,
            labelString: 'HP left'
          }
        }],
        yAxes: [{
          position: 'right',
          scaleLabel: {
            display: true,
            labelString: '%'
          }
        }]
      }
    }
  });
  myChart2 = new Chart("myChart2", {
    type: "bar",
    data: {
      labels: labels2,
      datasets: [{
        backgroundColor: "rgba(192,0,0,1.0)",
        data: hps2
      },
      {
        backgroundColor: "rgba(192,0,0,0.2)",
        data: hps2a
      }]
    }
    ,
    options: {
      animation: { duration: 100 },
      plugins: { legend: false },
      scales: {
        xAxes: [{
          scaleLabel: {
            display: true,
            labelString: 'HP left'
          }
        }],
        yAxes: [{
          scaleLabel: {
            display: true,
            labelString: '%'
          }
        }]
      }
    }
  });
}

function startCalc(_attacker, _defender) {
  attacker = _attacker;
  defender = _defender;
  initChartArrays();
  attacker.output.unit.pc = 0;
  defender.output.unit.pc = 0;
  vm.totHP1 = 0;
  vm.totHP2 = 0;
  calculate(attacker, defender);
}

function startSim() {
  stopSim();
  initArray(attacker.output.hpsa, attacker.input.unit.hp + 1);
  initArray(defender.output.hpsa, defender.input.unit.hp + 1);
  attacker.output.unit.s = 0;
  defender.output.unit.s = 0;
  vm.output.s = 0;
  attacker.output.unit.p = 0;
  defender.output.unit.p = 0;
  vm.workersCount = 4;
  for (let i = 0; i < vm.workersCount; i++) {
    workers.push({
      w: new Worker("workerSimulateCombats.js"),
      finished: false
    });
    workers[i].w.onmessage = receiveWorkerMessage;

  }
  let unitA = new Unit(attacker.input.unit.att, attacker.input.unit.def, attacker.input.unit.hp, attacker.input.unit.fp);
  let unitD = new Unit(defender.input.unit.att, defender.input.unit.def, defender.input.unit.hp, defender.input.unit.fp);
  for (let i = 0; i < workers.length; i++) {
    workers[i].w.postMessage({
      unitA: unitA,
      unitD: unitD
    });
  }
}

function pa(a, d, m = 8) {
  if (d == 0) {
    return 1 - 1 / (m * a);
  }
  else if (a > d) {
    return 1 - (m * d + 1) / (2 * m * a);
  }
  else {
    return (m * a - 1) / (2 * m * d);
  }
}

function calculate(attacker, defender) {
  if (attacker.input.unit.att > 0) {
    let p = pa(attacker.input.unit.att, defender.input.unit.def);
    let max = 0;
    let toWinA = Math.ceil(defender.input.unit.hp / attacker.input.unit.fp);
    let toWinD = Math.ceil(attacker.input.unit.hp / defender.input.unit.fp);
    attacker.output.unit.pc = 0;
    defender.output.unit.pc = 0;
    for (let k = 0, hp = attacker.input.unit.hp; hp > 0; k++, hp -= defender.input.unit.fp) {
      let pi = nbd(p, k, toWinA);
      attacker.output.unit.pc += pi;
      attacker.output.hps[hp] = (pi * 100).toFixed(2);
      max = Math.max(max, attacker.output.hps[hp]);
    }
    for (let k = 0, hp = defender.input.unit.hp; hp > 0; k++, hp -= attacker.input.unit.fp) {
      let pi = nbd(1 - p, k, toWinD);
      defender.output.unit.pc += pi;
      defender.output.hps[hp] = (pi * 100).toFixed(2);
      max = Math.max(max, defender.output.hps[hp]);
    }
    attacker.output.unit.pc = (attacker.output.unit.pc * 100).toFixed(2);
    defender.output.unit.pc = (defender.output.unit.pc * 100).toFixed(2);
    attacker.output.unit.p0 = (p * 100).toFixed(2);
    defender.output.unit.p0 = (100 - attacker.output.unit.p0).toFixed(2);
    max = max * 1.05;
    myChart1.options.scales.yAxes[0].ticks.max = max;
    myChart2.options.scales.yAxes[0].ticks.max = max;
  }
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
    // let max = 0;
    for (let i = 0; i < resultA.hps.length; i++) {
      attacker.output.hpsa[i] += resultA.hps[i] / 400000;
      //max = Math.max(max, hps1[i]);
    }
    for (let i = 0; i < resultD.hps.length; i++) {
      defender.output.hpsa[i] += resultD.hps[i] / 400000;
      //max = Math.max(max, hps2[i]);
    }
    attacker.output.unit.s += resultA.wins;
    defender.output.unit.s += resultD.wins;
    vm.output.s = attacker.output.unit.s + defender.output.unit.s;
    attacker.output.unit.p = (attacker.output.unit.s / vm.output.s * 100).toFixed(2);
    defender.output.unit.p = (defender.output.unit.s / vm.output.s * 100).toFixed(2);
    //  vm.totHP1 += combatResult.hp1;
    //  vm.totHP2 += combatResult.hp2;
    //max = Math.floor(max * 1.05);
    //myChart1.options.scales.yAxes[0].ticks.max = max;
    //myChart2.options.scales.yAxes[0].ticks.max = max;
    myChart1.update();
    myChart2.update();
  }
}

function initChartArrays() {
  initArray(attacker.output.labels, attacker.input.unit.hp + 1, 1);
  initArray(defender.output.labels, defender.input.unit.hp + 1, 1);
  initArray(attacker.output.hps, attacker.input.unit.hp + 1);
  initArray(defender.output.hps, defender.input.unit.hp + 1);
}

function initArray(arr, len, d = 0) {
  arr.length = len;
  arr.fill(0);
  if (d > 0) {
    for (let i = 0, j = 0; i < arr.length; i++, j += d) {
      arr[i] = j;
    }
  }
}

