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
}