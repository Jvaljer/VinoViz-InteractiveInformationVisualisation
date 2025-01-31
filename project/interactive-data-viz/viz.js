let canvas;
let alcoholAbuse = false;
let gridAbuseHeights = [];
let gridDependenceHeights = [];
let gridDeathRates = [];
let years = [];
let ages = [];
//font values
let fontType = 'Arial';
let fontHeight = 14;
let fontColor = 'white';
let lineSpacing = 10;

function preload() {
    textFont = loadFont("./assets/Roboto-Regular.ttf");
    sizes = {
        width: document.getElementById('viz').clientWidth,
        height: document.getElementById('viz').clientHeight
    }

    // TODO: Add data preload here
    dependenceTable = loadTable("./data/Distribution-Of-Age-Of-Onset-Of-Alcohol-Dependence.csv", "csv", "header");
    abuseTable = loadTable("./data/Distribution-Of-Age-Of-Onset-Of-Alcohol-Abuse.csv", "csv", "header");
    deathRateTable = loadTable("./data/Alcohol-Related-Disease-Mortality-Rate-by-Age.csv", "csv", "header");
}

function setup() {
    // Getting all year values
    let yearSet = new Set();
    let ageSet = new Set();
    let deathRateSet = new Set();

    for (let i=0; i<abuseTable.getRowCount(); i++) {
        let year = abuseTable.get(i, "year");
        let age = abuseTable.get(i, "age");
        yearSet.add(year);
        ageSet.add(age);
    }
    for (let i=0; i<dependenceTable.getRowCount(); i++) {
        let year = dependenceTable.get(i, "year");
        let age = dependenceTable.get(i, "age");
        yearSet.add(year);
        ageSet.add(age);
    } 
    years = Array.from(yearSet);
    ages = Array.from(ageSet);

    gridAbuseHeights = new Array(ages.length*years.length);
    for (let i = 0; i < ages.length; i++) {
        for (let j = 0; j < years.length; j++) {
            gridAbuseHeights[i*years.length + j] = getAbusePercentage(years[j], ages[i]);
        }
    }

    gridDependenceHeights = new Array(ages.length*years.length);
    for (let i = 0; i < ages.length; i++) {
        for (let j = 0; j < years.length; j++) {
            gridDependenceHeights[i*years.length + j] = getDependencePercentage(years[j], ages[i]);
        }
    }

    gridDeathRates = new Array(ages.length*years.length);
    for (let i = 0; i < ages.length; i++) {
        for (let j = 0; j < years.length; j++) {
            gridDeathRates[i*years.length + j] = getDeathRate(years[j], ages[i]);
        }
    }


    canvas = createCanvas(sizes.width, sizes.height, WEBGL);
    canvas.parent('viz');

    angleMode(DEGREES);
}

function draw() {
    background(46,46,46);

    orbitControl();

    push();
    translate(0, 0, 0);
    rotateX(60);
    rotateZ(45);

    noStroke();
    plane(sizes.height/1.25); // white plane for grid base
    drawGrid(sizes.height/1.5);
    pop();
}

function getAbusePercentage(year, age)
{
    for (let i=0; i<abuseTable.getRowCount(); i++) {
        let rowYear = abuseTable.get(i, "year");
        let rowAge = abuseTable.get(i, "age");
        let rowGender = abuseTable.get(i, "gender");

        if (rowYear == year && rowAge == age && rowGender == "all") {
            return abuseTable.get(i, "percentage");
        }
    }
}

function getDependencePercentage(year, age)
{
    for (let i=0; i<dependenceTable.getRowCount(); i++) {
        let rowYear = dependenceTable.get(i, "year");
        let rowAge = dependenceTable.get(i, "age");
        let rowGender = dependenceTable.get(i, "gender");

        if (rowYear == year && rowAge == age && rowGender == "all") {
            return dependenceTable.get(i, "percentage");
        }
    }
}

function getDeathRate(year, age) {
    for (let i=0; i<deathRateTable.getRowCount(); i++) {
        let rowYear = deathRateTable.get(i, "year");
        let rowAge = deathRateTable.get(i, "age");

        if (rowYear == year && rowAge == age) {
            return deathRateTable.get(i, "percentage");
        }
    }
}

function drawGrid(size) {
    let gridCount = 4; // 4x4 grid
    let step = size/gridCount; // Calculate step size (grid cell size)

    stroke(0); // drawing lines in black
    strokeWeight(2);

    // Horizontal lines
    for (let i = 0; i <= gridCount; i++) {
        line(-size/2, (i*step) - size/2, size/2, (i*step) - size/2);
    }

    // Vertical lines
    for (let i = 0; i <= gridCount; i++) {
        line((i * step) - size / 2, -size / 2, (i * step) - size / 2, size / 2);
    }

    stroke(0);
    strokeWeight(1);

    let min = 0;
    let max = 0;
    for (let i = 0; i < gridCount; i++) {
        for (let j = 0; j < gridCount; j++) {
            let height; // gonna be reduced by 5
            if (alcoholAbuse) {
                height = gridAbuseHeights[i*gridCount + j]/5;
            } else {
                height = gridDependenceHeights[i*gridCount + j]/5;
            }

            // Normalize height (0 to 1)
            
            let t = height/10;

            min = Math.min(min, t);
            max = Math.max(max, t);

            if (alcoholAbuse) {
                if (t >= 0.75) {
                    fill(150 + (t-0.75)/0.25 * (255 - 150), 0, 0);
                } else {
                    fill(255, 255 - t * 255, 0);
                }
            } else {
                if (t >= 0.75) {
                    fill(0, 0, 150 + (t - 0.75) * (255 - 150));
                } else {
                    fill(0, 255 - t * 255, 255);
                }
            }

            // here the idea is to draw one box in the center of each cell
            // the box should be 1/2 the size of the cell
            push();
            translate((i - 1.5)*step, (j - 1.5)*step, height*step/10); // height*step/2
            box(step, step, height*step/5); // height*step

            let radius = gridDeathRates[i*gridCount + j];

            let minOld = 0.2, maxOld = 30;
            let minNew = 5, maxNew = 25;

            // Map the radius to the new range
            let scaledRadius = minNew + ((radius - minOld) * (maxNew - minNew)) / (maxOld - minOld);

            // Ensure it stays within bounds
            scaledRadius = constrain(scaledRadius, minNew, maxNew);

            translate(0, 0, (height * step / 10) + 25);

            if (radius > 0) {
                fill(0, 0, 0, 80);
                noStroke();
                sphere(scaledRadius);
            } else {
                fill(0, 0, 0, 1);
                noStroke();
                sphere(1); // Default small size for invalid values
            }
            pop();
        }
    }
    displayMinMax(alcoholAbuse, min, max);
}


// continuous rotation on Z axis
function rotateZWithFrameCount() {
    rotateZ(frameCount/5);
}

// resizing on window resize
function windowResized() {
    sizes = {
        width: document.getElementById('viz').clientWidth,
        height: document.getElementById('viz').clientHeight
    }
    resizeCanvas(sizes.width, sizes.height);
}

function switchIssue() {
    alcoholAbuse = !alcoholAbuse;
    document.getElementById('display-issue').innerHTML = alcoholAbuse ? "Alcohol Abuse" : "Alcohol Dependence";
}

function displayMinMax(abuse,min,max) {
    let minText = document.getElementById('min');
    let maxText = document.getElementById('max');
    if (max>1.0) {
        max = 1.0;
    }
    minText.innerHTML = min*100 + "%";
    maxText.innerHTML = max*100 + "%";

    let barContainer = document.getElementById('bar-container');
    let gradientStart = getValueColor(abuse,min);
    let gradientEnd = getValueColor(abuse,max);
    barContainer.style.background = `linear-gradient(to right, ${gradientStart}, ${gradientEnd})`;
}


function getValueColor(abuse,v) {
    let r, g, b;
    if (abuse) {
        if (v >= 0.75) {
            r = 150 + (v-0.75)/0.25 * (255 - 150);
            g = 0;
            b = 0;
        } else {
            r = 255;
            g = 255 - v * 255;
            b = 0;
        }
    } else {
        if (v >= 0.75) {
            r = 0;
            g = 0;
            b = 150 + (v - 0.75) * (255 - 150);
        } else {
            r = 0;
            g = 255 - v * 255;
            b = 255;
        }
    }

    return `rgb(${r}, ${g}, ${b})`;
}