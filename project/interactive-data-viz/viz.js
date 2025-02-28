let canvas;
let planeSize;
let alcoholAbuse = false;
let showBoth = false;

let years = [];
let ages = [];
let ageLabelPositions = [];
let yearLabelPositions = [];

// font values
let roboto;

// data storage
let gridAbusesPercentage = new Map();
let gridAbusesNumber = new Map();
let gridDependenceNumber = new Map();
let gridDependencePercentage = new Map();
let gridDeathRates = new Map();
let gridDrinkingRates = new Map();

let redScaleMin = [255, 240, 0];
let redScaleMax = [255, 0, 0];

let blueScaleMin = [0, 240, 255];
let blueScaleMax = [0, 0, 176];

function colorScale(min, max, value) {
  let scale = [];
  for (let i = 0; i < 3; i++) {
    scale.push(min[i] + (max[i] - min[i]) * value);
  }
  return scale;
}

function preload() {
  roboto = loadFont("./assets/Roboto-Regular.ttf");

  sizes = {
    width: document.getElementById("viz").clientWidth,
    height: document.getElementById("viz").clientHeight,
  };

  planeSize = sizes.height / 1.25;

  // TODO: Add data preload here
  dependenceTable = loadTable(
    "./data/Distribution-Of-Age-Of-Onset-Of-Alcohol-Dependence.csv",
    "csv",
    "header"
  );
  abuseTable = loadTable(
    "./data/Distribution-Of-Age-Of-Onset-Of-Alcohol-Abuse.csv",
    "csv",
    "header"
  );
  deathRateTable = loadTable(
    "./data/Alcohol-Related-Disease-Mortality-Rate-by-Age.csv",
    "csv",
    "header"
  );
  drinkingRateTable = loadTable(
    "./data/Lifetime-Drinking-Rate-Among-Adults-19plus.csv",
    "csv",
    "header"
  );
}

function setup() {
  // Getting all year values
  let yearSet = new Set();
  let ageSet = new Set();

  for (let i = 0; i < abuseTable.getRowCount(); i++) {
    if (abuseTable.get(i, "gender") !== "all") {
      continue;
    }
    let year = parseInt(abuseTable.get(i, "year"));
    let age = parseInt(abuseTable.get(i, "age"));
    let number = parseInt(abuseTable.get(i, "number of people"));
    let percentage = parseFloat(abuseTable.get(i, "percentage"));
    yearSet.add(year);
    ageSet.add(age);
    gridAbusesNumber.set(year + "-" + age, number);
    gridAbusesPercentage.set(year + "-" + age, percentage);
  }
  for (let i = 0; i < dependenceTable.getRowCount(); i++) {
    if (dependenceTable.get(i, "gender") !== "all") {
      continue;
    }
    let year = parseInt(dependenceTable.get(i, "year"));
    let age = parseInt(dependenceTable.get(i, "age"));
    let number = parseInt(dependenceTable.get(i, "number of people"));
    let percentage = parseFloat(dependenceTable.get(i, "percentage"));
    yearSet.add(year);
    ageSet.add(age);
    gridDependenceNumber.set(year + "-" + age, number);
    gridDependencePercentage.set(year + "-" + age, percentage);
  }
  for (let i = 0; i < deathRateTable.getRowCount(); i++) {
    let year = parseInt(deathRateTable.get(i, "year"));
    let age = parseInt(deathRateTable.get(i, "age"));
    let rate = parseFloat(deathRateTable.get(i, "rate"));
    yearSet.add(year);
    ageSet.add(age);
    gridDeathRates.set(year + "-" + age, rate);
  }
  for (let i = 0; i < drinkingRateTable.getRowCount(); i++)
  {
    let year = parseInt(drinkingRateTable.get(i, "year"));
    let age = parseInt(drinkingRateTable.get(i, "age"));
    let rate = parseFloat(drinkingRateTable.get(i, "rate"));
    gridDrinkingRates.set(year + "-" + age, rate);
  }
  years = Array.from(yearSet).sort();
  ages = Array.from(ageSet).sort();

  canvas = createCanvas(sizes.width, sizes.height, WEBGL);
  textFont(roboto);
  textSize(25);
  textAlign(CENTER, CENTER);
  // canvas = mCreateCanvas(sizes.width, sizes.height, WEBGL);
  canvas.parent("viz");

  planeSize = sizes.height/1.25;

  angleMode(DEGREES);
}

function draw() {
  background(46, 46, 46);

  orbitControl();

  push();
  translate(0, 0, 0);
  rotateX(60);
  rotateZ(45);

  noStroke();

  plane(planeSize); // white plane for grid base

  translate(0, 0, 1);
  drawGrid(sizes.height / 1.5);

  let gridSize = sizes.height / 1.5;
  let cellSize = gridSize / 4;

  for (let i=0; i<ages.length; i++)
  {
    push();
    translate(-gridSize/2 + cellSize/2, gridSize/2 + 15, 0); // initial age position
    fill(0);
    translate(i*cellSize, 0, 0);
    text(`${ages[i]}`, 0, 0);
    pop();
  }

  for (let i=0; i<ages.length; i++)
  {
    push();
    translate(gridSize/2 + 15, gridSize/2 - cellSize/2, 0) // "initial" year position
    fill(0);
    translate(0, -(i*cellSize), 0);
    rotateZ(-90);
    text(`${years[(years.length-1) - i]}`, 0, 0);
    pop();
  }

  pop();
}

function iteratorMin(map) {
  let min = Number.MAX_VALUE;
  for (let value of map.values()) {
    if (value < min) {
      min = value;
    }
  }
  return min;
}

function iteratorMax(map) {
  let max = Number.MIN_VALUE;
  for (let value of map.values()) {
    if (value > max) {
      max = value;
    }
  }
  return max;
}

function drawGrid(size) {
  let nbYears = years.length;
  let nbAges = ages.length;
  let yearsStep = size / nbYears; // (sizes.height / 1.5) / 4
  let agesStep = size / nbAges;
  let maxHeight = 0.5 * size;
  let minRadius = 0.05 * Math.min(yearsStep, agesStep);
  let maxRadius = 0.25 * Math.min(yearsStep, agesStep);

  stroke(0); // drawing lines in black
  strokeWeight(2);

  // Year lines (horizontal)
  for (let i = 0; i <= nbYears; i++) {
    line(
      -size / 2,
      i * yearsStep - size / 2,
      size / 2,
      i * yearsStep - size / 2
    );
  }

  // Age lines (vertical)
  for (let i = 0; i <= nbAges; i++) {
    line(i * agesStep - size / 2, -size / 2, i * agesStep - size / 2, size / 2);
  }

  stroke(0);
  strokeWeight(1);

  let numberMap = alcoholAbuse ? gridAbusesNumber : gridDependenceNumber;
  let percentMap = alcoholAbuse
    ? gridAbusesPercentage
    : gridDependencePercentage;

  let abuseNumberMap = gridAbusesNumber;
  let abusePercentMap = gridAbusesPercentage;
  let dependencePercentMap = gridDependencePercentage;
  let dependenceNumberMap = gridDependenceNumber;
  
  let minNumber = iteratorMin(numberMap);
  let maxNumber = iteratorMax(numberMap);
  let minPercent = iteratorMin(percentMap);
  let maxPercent = iteratorMax(percentMap);
  let minDeathRate = iteratorMin(gridDeathRates);
  let maxDeathRate = iteratorMax(gridDeathRates);
  let minDrinkingRate = iteratorMin(gridDrinkingRates);
  let maxDrinkingRate = iteratorMax(gridDrinkingRates);

  let minAbuseNumber = iteratorMin(abuseNumberMap);
  let maxAbuseNumber = iteratorMax(abuseNumberMap);
  let minAbusePercent = iteratorMin(abusePercentMap);
  let maxAbusePercent = iteratorMax(abusePercentMap);
  let minDependenceNumber = iteratorMin(dependenceNumberMap);
  let maxDependenceNumber = iteratorMax(dependenceNumberMap);
  let minDependencePercent = iteratorMin(dependencePercentMap);
  let maxDependencePercent = iteratorMax(dependencePercentMap);

  // replacing this by a for loop that display BOTH abuse & dependence.
  if (!showBoth)
  {
    for (let i = 0; i < nbYears; i++) {
      for (let j = 0; j < nbAges; j++) {
        let number = numberMap.get(years[i] + "-" + ages[j]);
        let percentage = percentMap.get(years[i] + "-" + ages[j]);
        let deathRate = gridDeathRates.get(years[i] + "-" + ages[j]);

        let normalizedPercentage =
          (percentage - minPercent) / (maxPercent - minPercent);
        let color = alcoholAbuse
          ? colorScale(redScaleMin, redScaleMax, normalizedPercentage)
          : colorScale(blueScaleMin, blueScaleMax, normalizedPercentage);

        fill(color[0], color[1], color[2]);
        
        push();
        let normalizedHeight = number / maxNumber;
        translate(
          (j - nbAges / 2 + 0.5) * agesStep,
          (i - nbYears / 2 + 0.5) * yearsStep,
          (normalizedHeight * maxHeight + 1) / 2
        );
        box(agesStep, yearsStep, normalizedHeight * maxHeight + 1);

        let drinkingRate = gridDrinkingRates.get(years[i]+"-"+ages[j]);
        if (drinkingRate != null)
        {
          let normalizedDrinkingRate = (drinkingRate - minDrinkingRate) / (maxDrinkingRate - minDrinkingRate);
          let filledCells = Math.round(normalizedDrinkingRate*100);

          let cellSizeX = agesStep/12;
          let cellSizeY = yearsStep/12;
          translate(-cellSizeX/2, -cellSizeY/2, (normalizedHeight * maxHeight + 1) / 2 + 0.1);

          let filledCount = 0;
          for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
              if (filledCount < filledCells) {
                  let xOffset = (col - 4.5) * cellSizeX; // Centering grid
                  let yOffset = (row - 4.5) * cellSizeY;
                  
                  fill(0, 0, 0, 127);
                  stroke(0, 0, 0, 127);
                  rect(xOffset, yOffset, cellSizeX, cellSizeY);
                  
                  filledCount++;
              } else {
                let xOffset = (col - 4.5) * cellSizeX; // Centering grid
                let yOffset = (row - 4.5) * cellSizeY;
                  
                fill(255, 255, 255, 50);
                stroke(0, 0, 0, 25);
                rect(xOffset, yOffset, cellSizeX, cellSizeY);
              }
            }
          }
        }

        let normalizedRadius = deathRate / maxDeathRate;
        let radius = minRadius + normalizedRadius * (maxRadius - minRadius);

        translate(0, 0, (normalizedHeight * maxHeight + 1) / 2 + maxRadius);
        if (deathRate != null) {
          fill(0, 0, 0, 80);
          noStroke();
          sphere(radius);
        }
        pop();
      }
    }

    displayMinMaxNumber(
      alcoholAbuse ? minAbuseNumber : minDependenceNumber,
      alcoholAbuse ? maxAbuseNumber : maxDependenceNumber
    );

    displayMinMaxPercentage(
      alcoholAbuse ? minAbusePercent : minDependencePercent,
      alcoholAbuse ? maxAbusePercent : maxDependencePercent
    );

    displayMinMaxDeathRate(minDeathRate, maxDeathRate);
  }
  else 
  {
    for (let i=0; i<nbYears; i++)
    {
      for (let j=0; j<nbAges; j++)
      {
          let abuseNumber = abuseNumberMap.get(years[i] + "-" + ages[j]);
          let abusePercent = abusePercentMap.get(years[i] + "-" + ages[j]);
          let dependenceNumber = dependenceNumberMap.get(years[i] + "-" + ages[j]);
          let dependencePercent = dependencePercentMap.get(years[i] + "-" + ages[j]);
          let deathRate = gridDeathRates.get(years[i] + "-" + ages[j]);

          let abuseNormPercent = (abusePercent - minAbusePercent) / (maxAbusePercent - minAbusePercent);
          let dependenceNormPercent = (dependencePercent - minDependencePercent) / (maxDependencePercent - minDependencePercent);

          let abuseColor = colorScale(redScaleMin, redScaleMax, abuseNormPercent);
          let dependenceColor = colorScale(blueScaleMin, blueScaleMax, dependenceNormPercent);

          fill(abuseColor[0], abuseColor[1], abuseColor[2]);

          push();
          let normalizedAbuseHeight = abuseNumber / maxAbuseNumber;
          translate(
              (j - nbAges / 2 + 0.5) * agesStep+agesStep/5,
              (i - nbYears / 2 + 0.5) * yearsStep,
              (normalizedAbuseHeight * maxHeight + 1) / 2
          );
          box(agesStep/2.5, yearsStep*3/4, normalizedAbuseHeight * maxHeight + 1);
          pop();

          fill(dependenceColor[0], dependenceColor[1], dependenceColor[2]);

          push();
          let normalizedDependenceHeight = dependenceNumber / maxDependenceNumber;
          translate(
              (j - nbAges / 2 + 0.5) * agesStep-(agesStep/5),
              (i - nbYears / 2 + 0.5) * yearsStep,
              (normalizedDependenceHeight * maxHeight + 1) / 2
          );
          box(agesStep/2.5, yearsStep*3/4, normalizedDependenceHeight * maxHeight + 1);

          // INSERT HERE ?

          let normalizedRadius = deathRate / maxDeathRate;
          let radius = minRadius + normalizedRadius * (maxRadius - minRadius);

          translate(0, 0, (normalizedAbuseHeight * maxHeight + 1) / 2 + maxRadius);
          if (deathRate != null) {
              fill(0, 0, 0, 80);
              noStroke();
              sphere(radius);
          }
          pop();
        }
      }
      let allMin = Math.min(minAbuseNumber, minDependenceNumber);
      let allMax = Math.max(maxAbuseNumber, maxDependenceNumber);

      displayMinMaxNumber(allMin, allMax);
      displayMinMaxDeathRate(minDeathRate, maxDeathRate);
      displayAbuseGradient(minAbusePercent, maxAbusePercent);
      displayDependenceGradient(minDependencePercent, maxDependencePercent);
  }
}

// continuous rotation on Z axis
function rotateZWithFrameCount() {
  rotateZ(frameCount / 5);
}

// resizing on window resize
function windowResized() {
  sizes = {
    width: document.getElementById("viz").clientWidth,
    height: document.getElementById("viz").clientHeight,
  };
  resizeCanvas(sizes.width, sizes.height);
}

function updateDefinition() {
  document.getElementById("alcohol-abuse-question").style.display = alcoholAbuse
  ? "block"
  : "none";

document.getElementById("alcohol-abuse-answer").style.display = alcoholAbuse
  ? "block"
  : "none";

document.getElementById("alcohol-dependence-question").style.display = alcoholAbuse  
  ? "none"
  : "block";    

document.getElementById("alcohol-dependence-answer").style.display = alcoholAbuse  
  ? "none"
  : "block";    
}

function switchIssue() {
  alcoholAbuse = !alcoholAbuse;
  document.getElementById("display-issue").innerHTML = alcoholAbuse
    ? "Alcohol Abuse"
    : "Alcohol Dependence";

  updateDefinition();
}

function displayBoth() {
  showBoth = !showBoth;

  document.querySelectorAll(".showone").forEach(div => div.style.display= showBoth?'none':'block');
  document.querySelectorAll(".showboth").forEach(div => div.style.display=showBoth?'block':'none');

  document.getElementById('clickBoth').innerHTML = showBoth ? "Show One" : "Show Both";

  document.getElementById("alcohol-abuse-question").style.display = alcoholAbuse || showBoth
  ? "block"
  : "none";

document.getElementById("alcohol-abuse-answer").style.display = alcoholAbuse || showBoth
  ? "block"
  : "none";

document.getElementById("alcohol-dependence-question").style.display = alcoholAbuse && !showBoth
  ? "none"
  : "block";

document.getElementById("alcohol-dependence-answer").style.display = alcoholAbuse && !showBoth
  ? "none"
  : "block";

  if (showBoth) {
  document.querySelector("button[onclick='switchIssue()']").style.visibility = "hidden";
  } else {
  document.querySelector("button[onclick='switchIssue()']").style.visibility = "visible";
  }
}

function displayMinMaxNumber(min, max) {
  let minText = document.getElementById("n-min");
  let maxText = document.getElementById("n-max");
  minText.innerHTML = min;
  maxText.innerHTML = max;
}

function displayAbuseGradient(min, max)
{
  let minText = document.getElementById("pa-min");
  let maxText = document.getElementById("pa-max");
  minText.innerHTML = min + "%";
  maxText.innerHTML = max + "%";

  let barContainer = document.getElementById("a-bar-container");
  let gradientStart = `rgb(${redScaleMin[0]}, ${redScaleMin[1]}, ${redScaleMin[2]})`;
  let gradientEnd = `rgb(${redScaleMax[0]}, ${redScaleMax[1]}, ${redScaleMax[2]})`;
  barContainer.style.background = `linear-gradient(to right, ${gradientStart}, ${gradientEnd})`;
}

function displayDependenceGradient(min, max)
{
  let minText = document.getElementById("pd-min");
  let maxText = document.getElementById("pd-max");
  minText.innerHTML = min + "%";
  maxText.innerHTML = max + "%";
  
  let barContainer = document.getElementById("d-bar-container");
  let gradientStart = `rgb(${blueScaleMin[0]}, ${blueScaleMin[1]}, ${blueScaleMin[2]})`;
  let gradientEnd = `rgb(${blueScaleMax[0]}, ${blueScaleMax[1]}, ${blueScaleMax[2]})`;
  barContainer.style.background = `linear-gradient(to right, ${gradientStart}, ${gradientEnd})`;
}

function displayMinMaxPercentage(min, max) {
  let minText = document.getElementById("p-min");
  let maxText = document.getElementById("p-max");
  minText.innerHTML = min + "%";
  maxText.innerHTML = max + "%";

  let currentColorMin = alcoholAbuse ? redScaleMin : blueScaleMin;
  let currentColorMax = alcoholAbuse ? redScaleMax : blueScaleMax;

  let barContainer = document.getElementById("bar-container");
  let gradientStart = `rgb(${currentColorMin[0]}, ${currentColorMin[1]}, ${currentColorMin[2]})`;
  let gradientEnd = `rgb(${currentColorMax[0]}, ${currentColorMax[1]}, ${currentColorMax[2]})`;
  barContainer.style.background = `linear-gradient(to right, ${gradientStart}, ${gradientEnd})`;
}

function displayMinMaxDeathRate(min, max) {
  let minText = document.getElementById("d-min");
  let maxText = document.getElementById("d-max");
  minText.innerHTML = min;
  maxText.innerHTML = max;
}