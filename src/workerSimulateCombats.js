onmessage = function (event) {
  for (let j = 0; j < 100; j++) {
    let combatsResult = {
      finished: false,
      unitA: {
        hps: [],
        wins: 0
      },
      unitD: {
        hps: [],
        wins: 0
      },
    };
    combatsResult.unitA.hps.length = event.data.unitA.hp + 1;
    combatsResult.unitD.hps.length = event.data.unitD.hp + 1;
    combatsResult.unitA.hps.fill(0);
    combatsResult.unitD.hps.fill(0);
    for (let i = 0; i < 100000; i++) {
      let combatResult = simulateCombat(event.data.unitA, event.data.unitD);
      if (combatResult.hpA > 0) {
        combatsResult.unitA.wins++;
        combatsResult.unitA.hps[combatResult.hpA]++;
      } else {
        combatsResult.unitD.wins++;
        combatsResult.unitD.hps[combatResult.hpD]++;
      }
    }
    postMessage(combatsResult);
  }
  postMessage({ finished: true });
}

function simulateCombat(unitA, unitD) {
  //console.log("Test");
  let hpA = unitA.hp;
  let hpD = unitD.hp;
  while ((hpA > 0) && (hpD > 0)) {
    let dice1 = Math.floor(Math.random() * unitA.att * 8);
    let dice2 = Math.floor(Math.random() * unitD.def * 8);
    if (dice1 > dice2) {
      hpD = hpD - unitA.fp;
    } else {
      hpA = hpA - unitD.fp;
    }
    if (hpA < 0) hpA = 0;
    if (hpD < 0) hpD = 0;
  }
  return {
    hpA: hpA,
    hpD: hpD
  }


  // myhpsLabels1.length = this.unit1HP + 1;
  // myhpsLabels2.length = this.unit2HP + 1;
  // for (let index = 0; index < myhpsLabels1.length; index++) {
  //   myhpsLabels1[index] = index;
  // }
  // for (let index = 0; index < myhpsLabels2.length; index++) {
  //   myhpsLabels2[index] = index;
  // }
  // //myhpsLabels1 = [...Array(this.unit1HP + 1).keys()];
  // //myhpsLabels2 = [...Array(this.unit2HP + 1).keys()];
  // hps1.length = this.unit1HP + 1;
  // hps2.length = this.unit2HP + 1;
  // hps1.fill(0);
  // hps2.fill(0);
  // let s = 0;
  // let s1 = 0;
  // let s2 = 0;
  // this.totHP1 = 0;
  // this.totHP2 = 0;
  // for (let i = 0; i < 100000; i++) {
  //   s++;
  //   let hp1 = this.unit1HP;
  //   let hp2 = this.unit2HP;
  //   while ((hp1 > 0) && (hp2 > 0)) {
  //     let dice1 = Math.floor(Math.random() * this.unit1Att * 8);
  //     let dice2 = Math.floor(Math.random() * this.unit2Def * 8);
  //     if (dice1 > dice2) {
  //       hp2 = hp2 - this.unit1FP;
  //       // this.totHP1 += this.unit1FP;
  //     } else {
  //       hp1 = hp1 - this.unit2FP;
  //       // this.totHP2 += this.unit2FP;
  //     }
  //     if (hp1 < 0) hp1 = 0;
  //     if (hp2 < 0) hp2 = 0;
  //   }
  //   if (hp1 > 0) {
  //     s1++;
  //     // hps1[hp1]++;
  //   } else {
  //     s2++;
  //     // hps2[hp2]++;
  //   }
  //   hps1[hp1]++;
  //   hps2[hp2]++;
  //   this.totHP1 += hp1;
  //   this.totHP2 += hp2;
  // };
  // this.p1 = s1 / s;
  // this.p2 = s2 / s;
  // //myChart1.data.labels = myhpsLabels1;
  // //myChart2.data.labels = myhpsLabels2;
  // // myChart1.data.datasets.forEach((dataset) => {
  // //   dataset.data = hps1;
  // // });
  // // myChart2.data.datasets.forEach((dataset) => {
  // //   dataset.data = hps2;
  // // });
  // myChart1.update();
  // myChart2.update();
}

