async function readTextFile(fileName) {
  const response = await fetch(fileName);
  const text = await response.text();
  return text;
}

function parseRulesTxt(text) {
  const lines = text.split(/\r?\n/);
  const unitsList = [];
  let readingUnits = false;
  for (let line of lines) {
    if (readingUnits) {
      if (line == '') {
        readingUnits = false;
      } else {
        let tokens = line.split(',');
        if (tokens[12].trim() != 'no') {
          unitsList.push({
            text: tokens[0].trim(),
            att: Number(tokens[5].trim().slice(0, -1)),
            def: Number(tokens[6].trim().slice(0, -1)),
            hp: Number(tokens[7].trim().slice(0, -1)),
            fp: Number(tokens[8].trim().slice(0, -1))
            // att: tokens[5].trim().slice(0, -1),
            // def: tokens[6].trim().slice(0, -1),
            // hp: tokens[7].trim().slice(0, -1),
            // fp: tokens[8].trim().slice(0, -1)
          });
        }
        // console.log(line);
      }
    }
    if (line == '@UNITS') {
      readingUnits = true;
    }
  }
  return unitsList;
}

export async function loadUnitsList(fileName) {
  const rulesTxt = await readTextFile(fileName);
  return parseRulesTxt(rulesTxt);
}