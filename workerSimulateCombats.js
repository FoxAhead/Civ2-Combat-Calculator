onmessage = function (event) {
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
  combatsResult.unitA.hps.length = event.data.unitA.hit + 1;
  combatsResult.unitD.hps.length = event.data.unitD.hit + 1;
  for (let j = 0; j < 100; j++) {
    combatsResult.unitA.hps.fill(0);
    combatsResult.unitD.hps.fill(0);
    combatsResult.unitA.wins = 0;
    combatsResult.unitD.wins = 0;
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
  let hpA = unitA.hit;
  let hpD = unitD.hit;
  if (unitA.nuclear) {
    hpD = 0;
  } else if (unitD.nuclear) {
    hpA = 0;
  } else {
    while ((hpA > 0) && (hpD > 0)) {
      let dice1 = (unitA.att <= 1) ? 0 : Math.floor(Math.random() * unitA.att);
      let dice2 = (unitD.def <= 1) ? 0 : Math.floor(Math.random() * unitD.def);
      if (dice1 > dice2) {
        hpD = hpD - unitA.firepwr;
      } else {
        hpA = hpA - unitD.firepwr;
      }
      if (hpA < 0) hpA = 0;
      if (hpD < 0) hpD = 0;
    }
  }
  return {
    hpA: hpA,
    hpD: hpD
  }
}
