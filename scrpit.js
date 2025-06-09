// Part 1: Game Setup and Variables (Updated)

let availableUnitsByLevel; // Declare it here to ensure it exists

const regions = [
    { name: 'New Territories', startLevel: 1, endLevel: 10 },
    { name: 'Kowloon', startLevel: 11, endLevel: 20 },
    { name: 'Hong Kong Island East', startLevel: 21, endLevel: 30 },
    { name: 'Hong Kong Island West', startLevel: 31, endLevel: 40 }
];

const battlefield = document.getElementById('battlefield');
const cardContainer = document.getElementById('card-container');
const supplyCount = document.getElementById('supply-count');
const levelNumber = document.getElementById('level-count');
const waveProgressDisplay = document.getElementById('enemies-remaining');
const gameOverDiv = document.getElementById('game-over');
const startLevelBtn = document.getElementById('start-wave');
const levelDisplay = document.getElementById('level-count');
const progressBar = document.getElementById('wave-progress-bar');
const dragGhost = document.getElementById('drag-ghost');
let supplies = 50;
let levelCount = 1;
let currentWaveInLevel = 1; 
// Always 1 since there's only one wave;
let currentRegion = 0;
let enemiesSpawned = 0;
let totalEnemiesInWave = 0;
let enemiesDefeated = 0;
let gameActive = false;
let gamePaused = false;
let gameSpeed = 1;
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let lastActivityTime = Date.now();
let banzaiCount = 0;
const maxBanzai = 3;
const towerFiringIntervals = new Map();
const towerKills = new Map();
const MAX_CARDS = 5;
let cardDeck = [];
let selectedUnit = null;
let initialSuppliesForLevel = 0;
let initialTowersForLevel = [];
let lastSupplyDropTime = 0; // Add this to track the last supply drop time
const SUPPLY_DROP_INTERVAL = 10000; // Add this to define the minimum interval between supply drops (10 seconds)

// Part 2: Towers and Units (Updated for Normal Size Universal Carrier)

availableUnitsByLevel = availableUnitsByLevel || {
    1: ['hkvdc', 'royal-scots'],
    2: ['hkvdc', 'royal-scots', 'winnipeg-grenadiers', ],
    4: ['hkvdc', 'royal-scots', 'winnipeg-grenadiers', 'rajputs'],
    5: ['hkvdc', 'royal-scots', 'winnipeg-grenadiers', 'rajputs', 'royal-rifles'],
    8: ['hkvdc', 'royal-scots', 'winnipeg-grenadiers', 'rajputs', 'royal-rifles', 'universal-carrier'],
    9: ['hkvdc', 'royal-scots', 'winnipeg-grenadiers', 'rajputs', 'royal-rifles', 'universal-carrier', 'middlesex']
};

const towers = {
    'royal-scots': { name: '2nd Royal Scots', cost: 10, damage: 10, range: 4, fireRate: 1000, sprite: 'https://i.imgur.com/rkEzkDE.png', ability: 'none' },
    'winnipeg-grenadiers': { name: 'Winnipeg Grenadiers', cost: 20, damage: 10, range: 4, fireRate: 1500, sprite: 'https://i.imgur.com/bR9vveb.png', ability: 'blind' },
    'royal-rifles': { name: 'Royal Rifles', cost: 25, damage: 15, range: 5, fireRate: 1200, sprite: 'https://i.imgur.com/AM628F8.png', ability: 'boost' },
    'middlesex': { name: '1st Middlesex', cost: 30, damage: 8, range: 5, fireRate: 800, sprite: 'https://i.imgur.com/1iRftzs.png', ability: 'boost' },
    'rajputs': { name: '5/7th Rajputs', cost: 15, damage: 10, range: 3, fireRate: 500, sprite: 'https://i.imgur.com/oUefopL.png', ability: 'melee' },
    'hkvdc': { name: 'HKVDC', cost: 5, damage: 10, range: 4, fireRate: 1000, sprite: 'https://i.imgur.com/dKsmPMp.png', ability: 'scrape-supplies' },
    'universal-carrier': { name: 'Universal Carrier', cost: 100, damage: 10, range: 5, fireRate: 500, sprite: 'https://i.imgur.com/xAnreth.png', ability: 'splash' } // Removed width: 128, height: 64
};

const enemies = [
    { type: '228th', name: '228th Regiment', health: 30, speed: 0.4, sprite: 'https://i.imgur.com/4Z1YvwF.png', damage: 5, ability: 'none', canShoot: true, shootChance: 0.6 },
    { type: '229th', name: '229th Regiment', health: 35, speed: 0.4, sprite: 'https://i.imgur.com/4Z1YvwF.png', damage: 8, ability: 'none', canShoot: true, shootChance: 0.6 },
    { type: '230th', name: '230th Regiment', health: 30, speed: 0.3, sprite: 'https://i.imgur.com/4Z1YvwF.png', damage: 10, ability: 'none', canShoot: true, shootChance: 0.6 },
    { type: 'artillery', name: '1st Artillery Group', health: 15, speed: 0.3, sprite: 'https://i.imgur.com/4Z1YvwF.png', damage: 15, function: 'splash', canShoot: true, shootChance: 1.5 }
];

// Part 3: Battlefield Setup

// Part 3: Battlefield Setup (Expanded RTS Lanes)
const LANE_COUNT = 3;
const LANE_HEIGHT = 100;
const BATTLEFIELD_WIDTH = 1280; // Expanded to match Warfare 1944's scale

function setupBattlefield() {
    console.log("Setting up expanded RTS battlefield...");
    battlefield.innerHTML = '';
    battlefield.style.background = 'transparent';
    battlefield.style.opacity = '1';
    battlefield.style.width = `${BATTLEFIELD_WIDTH}px`;
    battlefield.style.height = `${LANE_COUNT * LANE_HEIGHT}px`;
    battlefield.style.position = 'relative';
    battlefield.style.overflowX = 'auto'; // Allow scrolling if needed

    // Player base (British Commonwealth)
    const playerBase = document.createElement('div');
    playerBase.classList.add('base', 'player-base');
    playerBase.style.width = '50px';
    playerBase.style.height = `${LANE_COUNT * LANE_HEIGHT}px`;
    playerBase.style.position = 'absolute';
    playerBase.style.left = '0';
    playerBase.style.background = 'blue';
    playerBase.dataset.health = 150;
    playerBase.dataset.maxHealth = 150;
    battlefield.appendChild(playerBase);

    // Enemy base (Japanese)
    const enemyBase = document.createElement('div');
    enemyBase.classList.add('base', 'enemy-base');
    enemyBase.style.width = '50px';
    enemyBase.style.height = `${LANE_COUNT * LANE_HEIGHT}px`;
    enemyBase.style.position = 'absolute';
    enemyBase.style.right = '0';
    enemyBase.style.background = 'red';
    enemyBase.dataset.health = 150;
    enemyBase.dataset.maxHealth = 150;
    battlefield.appendChild(enemyBase);

    // Create lanes (North, Central, South)
    for (let i = 0; i < LANE_COUNT; i++) {
        const lane = document.createElement('div');
        lane.classList.add('lane');
        lane.dataset.laneIndex = i;
        lane.style.width = `${BATTLEFIELD_WIDTH}px`;
        lane.style.height = `${LANE_HEIGHT}px`;
        lane.style.background = `url('https://i.imgur.com/JjWIVeX.png') repeat-x`;
        lane.style.backgroundSize = '64px 64px';
        lane.style.position = 'absolute';
        lane.style.top = `${i * LANE_HEIGHT}px`;
        lane.style.left = '0';

        // Click to deploy units in this lane
        lane.addEventListener('click', (e) => {
            if (selectedUnit && gameActive) {
                deployUnit(selectedUnit, i);
            }
        });

        // Add a static Japanese tower in each lane (at 75% of the battlefield width)
        const tower = document.createElement('div');
        tower.classList.add('enemy-tower', `lane-${i}`);
        tower.dataset.health = 50;
        tower.dataset.maxHealth = 50;
        tower.dataset.damage = 5;
        tower.style.position = 'absolute';
        tower.style.left = `${BATTLEFIELD_WIDTH * 0.75}px`; // 75% across the battlefield
        tower.style.top = `${i * LANE_HEIGHT + (LANE_HEIGHT - 64) / 2}px`;
        tower.innerHTML = `<img src="https://i.imgur.com/japanese-tower.png" style="width: 64px; height: 64px;">`;
        lane.appendChild(tower);

        battlefield.appendChild(lane);
    }

    console.log("Expanded RTS battlefield setup complete with 3 lanes");
}

// Initial setup when the game loads
document.addEventListener('DOMContentLoaded', () => {
    setupBattlefield();
    updateRegionBar();
    setupCardSystem();
    supplyCount.textContent = supplies;
    levelNumber.textContent = levelCount;
    levelDisplay.textContent = `Level: ${levelCount}`;
    console.log("Initial game setup completed");
});

function setupBattlefield() {
    console.log("Setting up battlefield...");
    battlefield.innerHTML = ''; // Clear existing content to avoid duplicates
    for (let i = 0; i < 50; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i;
        cell.dataset.occupiedBy = ''; // Initialize to track if a cell is occupied by a multi-tile unit
        if (Math.random() < 0.2) {
            cell.classList.add('fortified');
            console.log(`Cell ${i} marked as fortified`);
        }

        // Desktop drag-and-drop events
        cell.addEventListener('dragover', (e) => {
            e.preventDefault();
            // Only allow drag-over if the cell is not occupied and not reserved by a multi-tile unit
            if (!cell.childElementCount && !cell.dataset.occupiedBy) {
                cell.classList.add('drag-over');
                console.log(`Drag entered cell ${i}`);
            }
        });
        cell.addEventListener('dragleave', (e) => {
            cell.classList.remove('drag-over');
            console.log(`Drag left cell ${i}`);
        });
        cell.addEventListener('drop', (e) => {
            console.log(`Drop event on cell ${i}`);
            placeTower(e);
        });

        // Click event for click-to-deploy
        cell.addEventListener('click', (e) => {
            console.log(`Cell ${i} clicked`);
            handleCellClick(e);
        });

        // Touch events for mobile drag-and-drop
        cell.addEventListener('touchstart', (e) => {
            e.preventDefault();
            // Only allow drag-over if the cell is not occupied and not reserved by a multi-tile unit
            if (!cell.childElementCount && !cell.dataset.occupiedBy) {
                cell.classList.add('drag-over');
                console.log(`Touch started on cell ${i}`);
            }
        });
        cell.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!selectedUnit || cell.childElementCount > 0 || cell.dataset.occupiedBy) {
                console.log(`Touch ended on cell ${i}, but no unit selected, cell occupied, or reserved by another unit`);
                return;
            }
            const touch = e.changedTouches[0];
            const target = document.elementFromPoint(touch.clientX, touch.clientY);
            if (target && target.classList.contains('cell')) {
                console.log(`Touch ended, deploying to cell ${target.dataset.index}`);
                const event = new Event('click', { bubbles: true });
                target.dispatchEvent(event);
            }
            cell.classList.remove('drag-over');
        });

        battlefield.appendChild(cell);
    }
    console.log("Battlefield setup complete with 50 cells");
    updateRegionBar();
}

function updateRegionBar() {
    const regionBar = document.getElementById('region-bar');
    if (!regionBar) {
        console.error("Region bar element not found!");
        return;
    }
    const progress = levelCount;
    regionBar.style.setProperty('--progress', progress);
    regions.forEach((region, index) => {
        const regionDiv = document.getElementById(`region-${index + 1}`);
        if (!regionDiv) {
            console.error(`Region div for ${region.name} not found!`);
            return;
        }
        if (levelCount >= region.startLevel && levelCount <= region.endLevel) {
            regionDiv.classList.remove('controlled', 'lost', 'inactive');
            regionDiv.classList.add('contested');
        } else if (levelCount > region.endLevel) {
            regionDiv.classList.remove('contested', 'inactive');
            regionDiv.classList.add('lost');
        } else {
            regionDiv.classList.remove('contested', 'lost');
            regionDiv.classList.add('controlled');
        }
    });
    console.log(`Region bar updated for level ${levelCount}`);
}

function renderCards() {
    console.log("Rendering cards...");
    cardContainer.innerHTML = '';
    if (!cardDeck.length) {
        console.warn("Card deck is empty, initializing with default cards");
        setupCardSystem();
    }
    cardDeck.forEach((unitType, index) => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.type = unitType;
        card.draggable = true;

        const unit = towers[unitType];
        if (!unit) {
            console.error(`Unit type ${unitType} not found in towers object!`);
            return;
        }
        card.innerHTML = `
            <img src="${unit.sprite}" alt="${unit.name}" style="width: 48px; height: 48px;">
            <div class="card-name">${unit.name}</div>
            <div class="card-cost">Cost: ${unit.cost}</div>
        `;
        console.log(`Card ${index}: ${unit.name} added`);

        card.addEventListener('dragstart', (e) => {
            selectedUnit = unitType;
            card.classList.add('dragging');
            const img = new Image();
            img.src = unit.sprite;
            dragGhost.appendChild(img);
            e.dataTransfer.setDragImage(dragGhost, 24, 24);
            dragGhost.style.left = `${e.pageX - 1}px`;
            dragGhost.style.top = `${e.pageY - 1}px`;
            console.log(`Dragging started for ${unitType}`);
        });

        card.addEventListener('dragend', () => {
            dragGhost.innerHTML = '';
            card.classList.remove('dragging');
            document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('drag-over'));
            console.log(`Dragging ended for ${unitType}`);
        });

        card.addEventListener('touchstart', (e) => {
            e.preventDefault();
            selectedUnit = unitType;
            card.classList.add('dragging');
            const touch = e.touches[0];
            const img = new Image();
            img.src = unit.sprite;
            dragGhost.appendChild(img);
            dragGhost.style.width = '64px';
            dragGhost.style.height = '64px';
            dragGhost.style.display = 'block';
            const offsetX = -70;
            const offsetY = 20;
            dragGhost.style.left = `${touch.clientX + offsetX}px`;
            dragGhost.style.top = `${touch.clientY + offsetY}px`;
            console.log(`Touch drag started for ${unitType} at clientX: ${touch.clientX}, clientY: ${touch.clientY}`);
            console.log(`Drag ghost positioned at left: ${dragGhost.style.left}, top: ${dragGhost.style.top}`);
        });

        card.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const offsetX = -70;
            const offsetY = 20;
            dragGhost.style.left = `${touch.clientX + offsetX}px`;
            dragGhost.style.top = `${touch.clientY + offsetY}px`;
            console.log(`Touch move for ${unitType} at clientX: ${touch.clientX}, clientY: ${touch.clientY}`);
            console.log(`Drag ghost updated to left: ${dragGhost.style.left}, top: ${dragGhost.style.top}`);

            const battlefieldRect = battlefield.getBoundingClientRect();
            const cellX = Math.floor((touch.clientX - battlefieldRect.left) / 64);
            const cellY = Math.floor((touch.clientY - battlefieldRect.top) / 64);
            const cellIndex = cellY * 10 + cellX;
            const targetCell = document.querySelector(`.cell[data-index="${cellIndex}"]`);

            document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('drag-over'));
            if (targetCell && cellX >= 0 && cellX < 10 && cellY >= 0 && cellY < 5 && !targetCell.childElementCount && !targetCell.dataset.occupiedBy) {
                targetCell.classList.add('drag-over');
            }
        });

        card.addEventListener('touchend', (e) => {
            e.preventDefault();
            dragGhost.innerHTML = '';
            dragGhost.style.display = 'none';
            card.classList.remove('dragging');
            const touch = e.changedTouches[0];
            const battlefieldRect = battlefield.getBoundingClientRect();
            const cellX = Math.floor((touch.clientX - battlefieldRect.left) / 64);
            const cellY = Math.floor((touch.clientY - battlefieldRect.top) / 64);
            const cellIndex = cellY * 10 + cellX;
            const target = document.querySelector(`.cell[data-index="${cellIndex}"]`);

            if (target && cellX >= 0 && cellX < 10 && cellY >= 0 && cellY < 5 && !target.childElementCount && !target.dataset.occupiedBy) {
                console.log(`Touch ended, placing ${unitType} on cell ${cellIndex}`);
                const event = { target, preventDefault: () => {} };
                placeTower(event);
            }

            document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('drag-over'));
        });

        card.addEventListener('click', () => {
            if (selectedUnit === unitType) {
                selectedUnit = null;
                card.classList.remove('selected');
                console.log(`Deselected ${unitType}`);
            } else {
                selectedUnit = unitType;
                document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                console.log(`Selected ${unitType}`);
            }
        });

        cardContainer.appendChild(card);
    });
    console.log("Cards rendered successfully");
}

function setupCardSystem() {
    console.log(`Setting up card system for level ${levelCount}`);
    const shouldResetDeck = levelCount <= 1 || (levelCount in availableUnitsByLevel);
    if (shouldResetDeck || cardDeck.length === 0) {
        cardContainer.innerHTML = '';
        cardDeck = [];
        for (let i = 0; i < MAX_CARDS; i++) {
            cardDeck.push(generateRandomCard());
        }
        console.log(`Level ${levelCount} Card Deck (Reset):`, [...cardDeck]);
    } else {
        console.log(`Level ${levelCount} Card Deck (Preserved):`, [...cardDeck]);
    }
    renderCards();
}

function generateRandomCard() {
    let availableUnits = [];
    const effectiveLevel = Math.max(levelCount, 1);
    let highestLevel = 1;
    for (let level in availableUnitsByLevel) {
        if (effectiveLevel >= parseInt(level)) {
            availableUnits = availableUnitsByLevel[level];
            highestLevel = parseInt(level);
        }
    }

    // Carry forward units from the highest defined level if current level exceeds it
    if (effectiveLevel > highestLevel) {
        availableUnits = availableUnitsByLevel[highestLevel];
    }

    if (availableUnits.length === 0) {
        availableUnits = availableUnitsByLevel[1];
        console.warn("No units available for current level, defaulting to level 1 units");
    }

    const levelFactor = Math.min(effectiveLevel / 40, 1);
    const weights = availableUnits.map(unit => {
        const cost = towers[unit].cost;
        let baseProbability = 1 / cost;
        // Boost probability for universal-carrier after Level 8 to ensure it appears
        if (unit === 'universal-carrier' && effectiveLevel >= 8) {
            baseProbability *= 10; // Increase chance significantly
        }
        const levelAdjustedProbability = baseProbability * (1 + levelFactor * 2);
        return levelAdjustedProbability;
    });

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const normalizedWeights = weights.map(weight => weight / totalWeight);

    let rand = Math.random();
    let cumulativeWeight = 0;
    for (let i = 0; i < availableUnits.length; i++) {
        cumulativeWeight += normalizedWeights[i];
        if (rand <= cumulativeWeight) {
            console.log(`Generated card: ${availableUnits[i]}`);
            return availableUnits[i];
        }
    }
    console.log(`Generated card (fallback): ${availableUnits[availableUnits.length - 1]}`);
    return availableUnits[availableUnits.length - 1];
}

function placeTower(e) {
    e.preventDefault();
    if (!gameActive) {
        console.log("Cannot place tower: Game is not active");
        alert("Start the wave to deploy units!");
        return;
    }
    if (!selectedUnit) {
        console.log("Cannot place tower: No unit selected");
        return;
    }
    if (!e.target || e.target.childElementCount > 0 || e.target.dataset.occupiedBy) {
        console.log(`Cannot place tower: Target invalid, occupied, or reserved by another unit (occupiedBy: ${e.target.dataset.occupiedBy})`);
        return;
    }

    const tower = towers[selectedUnit];
    const cellIndex = parseInt(e.target.dataset.index);
    const col = cellIndex % 10;
    const row = Math.floor(cellIndex / 10);

    if (tower.width === 128) {
        if (col >= 9) {
            console.log("Cannot place Universal Carrier: Not enough space on the right");
            alert("Not enough space to deploy the Universal Carrier! Place it on a cell with an empty cell to its right.");
            return;
        }
        const adjacentCellIndex = cellIndex + 1;
        const adjacentCell = document.querySelector(`.cell[data-index="${adjacentCellIndex}"]`);
        if (adjacentCell.childElementCount > 0 || adjacentCell.dataset.occupiedBy) {
            console.log(`Cannot place Universal Carrier: Adjacent cell ${adjacentCellIndex} is occupied or reserved (occupiedBy: ${adjacentCell.dataset.occupiedBy})`);
            alert("The adjacent cell must be empty to deploy the Universal Carrier!");
            return;
        }
    }

    if (supplies >= tower.cost) {
        updateSupplies(-tower.cost, `Tower Placement (${tower.name})`);
        console.log(`Placing ${tower.name} at cell ${e.target.dataset.index}, cost: ${tower.cost}, remaining supplies: ${supplies}`);

        const towerDiv = document.createElement('div');
        towerDiv.classList.add('tower');
        if (tower.width === 128) {
            towerDiv.classList.add('universal-carrier');
            towerDiv.style.width = '128px';
            towerDiv.style.height = '64px';
            const adjacentCellIndex = cellIndex + 1;
            const adjacentCell = document.querySelector(`.cell[data-index="${adjacentCellIndex}"]`);
            adjacentCell.dataset.occupiedBy = cellIndex.toString();
            console.log(`Marked cell ${adjacentCellIndex} as occupied by Universal Carrier at cell ${cellIndex}`);
        }
        const soldier = document.createElement('img');
        soldier.src = tower.sprite;
        soldier.style.width = tower.width ? `${tower.width}px` : '64px';
        soldier.style.height = tower.height ? `${tower.height}px` : '64px';
        towerDiv.appendChild(soldier);
        towerDiv.dataset.type = selectedUnit;
        towerDiv.dataset.damage = tower.damage;
        towerDiv.dataset.range = tower.range;
        towerDiv.dataset.fireRate = tower.fireRate;
        towerDiv.dataset.level = 1;
        towerDiv.dataset.health = 50;
        towerDiv.dataset.maxHealth = 50;
        towerDiv.dataset.shotsFired = 0;

        const healthBar = document.createElement('div');
        healthBar.classList.add('health-bar');
        healthBar.style.width = tower.width ? `${tower.width}px` : '64px';
        towerDiv.appendChild(healthBar);

        const tooltip = document.createElement('div');
        tooltip.classList.add('tower-tooltip');
        tooltip.innerHTML = `
            <strong>${tower.name}</strong><br>
            Damage: ${towerDiv.dataset.damage}<br>
            Range: ${towerDiv.dataset.range}<br>
            Fire Rate: ${towerDiv.dataset.fireRate}ms<br>
            Level: ${towerDiv.dataset.level}
        `;
        towerDiv.appendChild(tooltip);

        // Show tooltip on hover (desktop) or tap (mobile)
        towerDiv.addEventListener('mouseenter', () => tooltip.style.display = 'block');
        towerDiv.addEventListener('mouseleave', () => tooltip.style.display = 'none');
        towerDiv.addEventListener('touchstart', (e) => {
            e.preventDefault();
            tooltip.style.display = 'block';
        });
        towerDiv.addEventListener('touchend', (e) => {
            e.preventDefault();
            tooltip.style.display = 'none';
        });

        const upgradeBtn = document.createElement('button');
        upgradeBtn.classList.add('upgrade-btn');
        upgradeBtn.textContent = 'Upgrade';
        
        // Function to handle upgrade (shared between click and touch)
        const handleUpgrade = (event) => {
            event.preventDefault();
            console.log(`Upgrade button triggered for ${tower.name} at cell ${cellIndex}`);
            upgradeTower(event, towerDiv);
        };

        // Desktop click event
        upgradeBtn.addEventListener('click', handleUpgrade);

        // Mobile touch event
        upgradeBtn.addEventListener('touchend', handleUpgrade);

        towerDiv.appendChild(upgradeBtn);

        e.target.appendChild(towerDiv);
        startFiring(towerDiv, e.target.dataset.index);

        if (tower.ability === 'boost') {
            setInterval(() => activateBoost(towerDiv), 35000);
            activateBoost(towerDiv);
            console.log(`${tower.name} boost ability activated`);
        }

        setInterval(() => {
            if (Math.random() < 0.3) showBattleCry(towerDiv);
        }, 10000);

        const cardIndex = cardDeck.indexOf(selectedUnit);
        if (cardIndex !== -1) {
            const cardElement = cardContainer.children[cardIndex];
            cardElement.classList.add('card-used');
            setTimeout(() => {
                cardDeck.splice(cardIndex, 1);
                cardDeck.push(generateRandomCard());
                renderCardsWithAnimation(cardIndex);
                console.log(`Card ${selectedUnit} used, replaced with new card at index ${cardIndex}`);
            }, 300);
        } else {
            console.error(`Card ${selectedUnit} not found in deck:`, [...cardDeck]);
        }

        selectedUnit = null;
        document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
        lastActivityTime = Date.now();
    } else {
        console.log(`Not enough supplies to place ${tower.name}. Required: ${tower.cost}, Available: ${supplies}`);
        alert('Not enough supplies to deploy this unit!');
    }
    e.target.classList.remove('drag-over');
}

function handleCellClick(e) {
    if (!gameActive) {
        console.log("Click ignored: Game is not active");
        alert("Start the wave to deploy units!");
        return;
    }
    if (!selectedUnit) {
        console.log("Click ignored: No unit selected");
        return;
    }
    if (e.currentTarget.childElementCount > 0 || e.currentTarget.dataset.occupiedBy) {
        console.log(`Click ignored: Cell ${e.currentTarget.dataset.index} is occupied or reserved (occupiedBy: ${e.currentTarget.dataset.occupiedBy})`);
        return;
    }
    const tower = towers[selectedUnit];
    if (supplies >= tower.cost) {
        console.log(`Click deploying ${tower.name} to cell ${e.currentTarget.dataset.index}`);
        placeTower(e);
    } else {
        console.log(`Not enough supplies for ${tower.name}. Required: ${tower.cost}, Available: ${supplies}`);
        alert('Not enough supplies to deploy this unit!');
    }
}

function renderCardsWithAnimation(startIndex) {
    console.log(`Rendering cards with animation starting at index ${startIndex}`);
    cardContainer.innerHTML = '';

    cardDeck.forEach((unitType, index) => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.type = unitType;

        const unit = towers[unitType];
        card.innerHTML = `
            <img src="${unit.sprite}" alt="${unit.name}" style="width: 48px; height: 48px;">
            <div class="card-name">${unit.name}</div>
            <div class="card-cost">Cost: ${unit.cost}</div>
        `;
        card.draggable = true;

        card.addEventListener('dragstart', (e) => {
            selectedUnit = unitType;
            card.classList.add('dragging');
            const img = new Image();
            img.src = unit.sprite;
            dragGhost.appendChild(img);
            e.dataTransfer.setDragImage(dragGhost, 24, 24);
            dragGhost.style.left = `${e.pageX - 24}px`;
            dragGhost.style.top = `${e.pageY - 24}px`;
            console.log(`Dragging started for ${unitType} (animated)`);
        });

        card.addEventListener('dragend', () => {
            dragGhost.innerHTML = '';
            card.classList.remove('dragging');
            document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('drag-over'));
            console.log(`Dragging ended for ${unitType} (animated)`);
        });

        let touchStartX = 0;
        let touchStartY = 0;
        card.addEventListener('touchstart', (e) => {
            e.preventDefault();
            selectedUnit = unitType;
            card.classList.add('dragging');
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;

            const img = new Image();
            img.src = unit.sprite;
            dragGhost.appendChild(img);
            dragGhost.style.left = `${touchStartX - 24}px`;
            dragGhost.style.top = `${touchStartY - 24}px`;
            console.log(`Touch drag started for ${unitType} (animated)`);
        });

        card.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            dragGhost.style.left = `${touch.clientX - 24}px`;
            dragGhost.style.top = `${touch.clientY - 24}px`;
            const target = document.elementFromPoint(touch.clientX, touch.clientY);
            if (target && target.classList.contains('cell')) {
                document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('drag-over'));
                if (!target.childElementCount && !target.dataset.occupiedBy) {
                    target.classList.add('drag-over');
                    console.log(`Touch moved over cell ${target.dataset.index} (animated)`);
                }
            }
        });

        card.addEventListener('touchend', (e) => {
            e.preventDefault();
            dragGhost.innerHTML = '';
            card.classList.remove('dragging');
            const touch = e.changedTouches[0];
            const target = document.elementFromPoint(touch.clientX, touch.clientY);

            if (target && target.classList.contains('cell') && !target.childElementCount && !target.dataset.occupiedBy) {
                console.log(`Touch ended, placing ${unitType} on cell ${target.dataset.index} (animated)`);
                const event = new Event('drop', { bubbles: true });
                target.dispatchEvent(event);
            }

            if (Math.abs(touchStartX - touch.clientX) < 10 && Math.abs(touchStartY - touch.clientY) < 10) {
                console.log(`Tap detected on ${unitType} (animated)`);
                const clickEvent = new Event('click', { bubbles: true });
                card.dispatchEvent(clickEvent);
            }

            document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('drag-over'));
        });

        card.addEventListener('click', () => {
            if (selectedUnit === unitType) {
                selectedUnit = null;
                card.classList.remove('selected');
                console.log(`Deselected ${unitType} (animated)`);
            } else {
                selectedUnit = unitType;
                document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                console.log(`Selected ${unitType} (animated)`);
            }
        });

        if (index >= startIndex) {
            card.classList.add('card-slide-left');
        }
        if (index === cardDeck.length - 1) {
            card.classList.add('card-appear');
        }

        cardContainer.appendChild(card);
    });
    console.log("Cards with animation rendered successfully");
}

// Part 5: Tower Placement

function upgradeTower(event, towerDiv) {
    event.stopPropagation();
    const towerType = towerDiv.dataset.type;
    const currentLevel = parseInt(towerDiv.dataset.level);
    
    if (currentLevel >= 7) {
        alert('Tower has reached maximum level (10)!');
        return;
    }

    const upgradeCost = towers[towerType].cost * currentLevel * 1.2;
    if (supplies >= upgradeCost) {
        updateSupplies(-upgradeCost, `Tower Upgrade (${towers[towerType].name})`);
        towerDiv.dataset.level = currentLevel + 1;
        towerDiv.dataset.damage = Math.floor(parseInt(towerDiv.dataset.damage) * 1.1);
        towerDiv.dataset.range = Math.min(parseInt(towerDiv.dataset.range) + 0.2, 10);
        towerDiv.dataset.fireRate = Math.floor(parseInt(towerDiv.dataset.fireRate) * 0.9);

        const tooltip = towerDiv.querySelector('.tower-tooltip');
        tooltip.innerHTML = `
            <strong>${towers[towerType].name}</strong><br>
            Damage: ${towerDiv.dataset.damage}<br>
            Range: ${towerDiv.dataset.range}<br>
            Fire Rate: ${towerDiv.dataset.fireRate}ms<br>
            Level: ${towerDiv.dataset.level}
        `;

        const intervalId = towerFiringIntervals.get(towerDiv);
        if (intervalId) {
            clearInterval(intervalId);
            towerFiringIntervals.delete(towerDiv);
        }
        startFiring(towerDiv, towerDiv.parentElement.dataset.index);

        const upgradeEffect = document.createElement('div');
        upgradeEffect.classList.add('upgrade-effect');
        upgradeEffect.textContent = 'Upgraded!';
        towerDiv.appendChild(upgradeEffect);
        setTimeout(() => upgradeEffect.remove(), 1000);
    } else {
        alert('Not enough supplies to upgrade!');
    }
}

function autoUpgradeTower(towerDiv) {
    const level = parseInt(towerDiv.dataset.level);
    if (level >= 5) return;

    towerDiv.dataset.level = level + 1;
    towerDiv.dataset.damage = parseInt(towerDiv.dataset.damage) + 5;
    towerDiv.dataset.range = parseInt(towerDiv.dataset.range) + 1;
    const newHealth = parseInt(towerDiv.dataset.health) + 20;
    const newMaxHealth = parseInt(towerDiv.dataset.maxHealth) + 20;
    towerDiv.dataset.health = newHealth;
    towerDiv.dataset.maxHealth = newMaxHealth;

    towerDiv.querySelector('.health-bar').style.width = `${(newHealth / newMaxHealth) * 64}px`;

    const chevrons = towerDiv.querySelectorAll('.chevron').length;
    if (chevrons < level + 1) {
        const chevron = document.createElement('div');
        chevron.classList.add('chevron');
        towerDiv.appendChild(chevron);
    }

    if (level + 1 === 3) {
        const btn = towerDiv.querySelector('.upgrade-btn');
        if (btn) {
            btn.classList.add('disabled');
            btn.disabled = true;
        }
    }

    const cellIndex = towerDiv.parentElement.dataset.index;
    const existingInterval = parseInt(towerDiv.dataset.fireInterval);
    if (!isNaN(existingInterval)) {
        clearInterval(existingInterval);
        towerFiringIntervals.delete(towerDiv);
    }
    startFiring(towerDiv, cellIndex);
}

function activateBoost(towerDiv) {
    if (!towerDiv.parentElement || towerDiv.dataset.boostCooldown) return; // Check if tower is still in DOM

    towerDiv.classList.add('aura-active');
    const cellIndex = parseInt(towerDiv.parentElement.dataset.index);
    const row = Math.floor(cellIndex / 10);
    const col = cellIndex % 10;

    const boostMultiplier = 1.2;
    if (!towerDiv.dataset.isBoosted) {
        const originalDamage = parseInt(towerDiv.dataset.damage);
        const originalFireRate = parseInt(towerDiv.dataset.fireRate);
        towerDiv.dataset.damage = Math.floor(originalDamage * boostMultiplier);
        towerDiv.dataset.fireRate = Math.floor(originalFireRate / boostMultiplier);
        towerDiv.dataset.isBoosted = 'true';
        const intervalId = towerFiringIntervals.get(towerDiv);
        if (intervalId) {
            clearInterval(intervalId);
            towerFiringIntervals.delete(towerDiv);
        }
        startFiring(towerDiv, cellIndex);
        setTimeout(() => {
            if (towerDiv.parentElement) { // Check again before resetting
                towerDiv.dataset.damage = originalDamage;
                towerDiv.dataset.fireRate = originalFireRate;
                delete towerDiv.dataset.isBoosted;
                const intervalId = towerFiringIntervals.get(towerDiv);
                if (intervalId) {
                    clearInterval(intervalId);
                    towerFiringIntervals.delete(towerDiv);
                }
                startFiring(towerDiv, cellIndex);
            }
        }, 5000 / gameSpeed); // Adjust duration with gameSpeed
    }

    for (let r = Math.max(0, row - 1); r <= Math.min(4, row + 1); r++) {
        for (let c = Math.max(0, col - 1); c <= Math.min(9, col + 1); c++) {
            const nearbyCell = document.querySelector(`.cell[data-index="${r * 10 + c}"]`);
            if (nearbyCell && nearbyCell.querySelector('.tower') && nearbyCell !== towerDiv.parentElement) {
                const nearbyTower = nearbyCell.querySelector('.tower');
                if (!nearbyTower.dataset.isBoosted) {
                    const originalDamage = parseInt(nearbyTower.dataset.damage);
                    const originalFireRate = parseInt(nearbyTower.dataset.fireRate);
                    nearbyTower.dataset.damage = Math.floor(originalDamage * boostMultiplier);
                    nearbyTower.dataset.fireRate = Math.floor(originalFireRate / boostMultiplier);
                    nearbyTower.dataset.isBoosted = 'true';
                    const nearbyIndex = nearbyCell.dataset.index;
                    const intervalId = towerFiringIntervals.get(nearbyTower);
                    if (intervalId) {
                        clearInterval(intervalId);
                        towerFiringIntervals.delete(nearbyTower);
                    }
                    startFiring(nearbyTower, nearbyIndex);
                    setTimeout(() => {
                        if (nearbyTower.parentElement) { // Check again before resetting
                            nearbyTower.dataset.damage = originalDamage;
                            nearbyTower.dataset.fireRate = originalFireRate;
                            delete nearbyTower.dataset.isBoosted;
                            const intervalId = towerFiringIntervals.get(nearbyTower);
                            if (intervalId) {
                                clearInterval(intervalId);
                                towerFiringIntervals.delete(nearbyTower);
                            }
                            startFiring(nearbyTower, nearbyIndex);
                        }
                    }, 5000 / gameSpeed); // Adjust duration with gameSpeed
                }
            }
        }
    }

    setTimeout(() => {
        if (towerDiv.parentElement) { // Check before removing aura
            towerDiv.classList.remove('aura-active');
            towerDiv.dataset.boostCooldown = 'true';
            setTimeout(() => {
                if (towerDiv.parentElement) delete towerDiv.dataset.boostCooldown;
            }, 30000 / gameSpeed); // Adjust cooldown with gameSpeed
        }
    }, 5000 / gameSpeed); // Adjust aura duration with gameSpeed
}

// Part 6 Message//

function showBattlefieldPopup(message, className, duration = 3000, position = { top: '50%', left: '50%' }, buttons = []) {
    const popup = document.createElement('div');
    popup.classList.add('battlefield-popup', className);
    popup.style.top = position.top;
    popup.style.left = position.left;
    popup.style.zIndex = '1000';

    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    popup.appendChild(messageDiv);

    if (buttons.length > 0) {
        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('popup-buttons');
        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.id = btn.id;
            button.textContent = btn.text;
            button.addEventListener('click', (e) => {
                btn.onClick(e);
                popup.remove(); // Remove popup after button click
            });
            buttonContainer.appendChild(button);
        });
        popup.appendChild(buttonContainer);
    }

    battlefield.appendChild(popup);
    if (duration > 0) {
        setTimeout(() => popup.remove(), duration);
    }
    return popup;
}

// Part 7: Supply Generation and Drops (Updated with New Features)

function startSupplyDrops() {
    console.log("Starting supply drops...");
    generateSupplies(); // Start the periodic supply generation
    startSupplySurgeEvents(); // Start the new supply surge events
}

function updateSupplies(amount, source) {
    const previousSupplies = supplies;
    supplies += amount;
    supplyCount.textContent = supplies;
    console.log(`Supply Update - Source: ${source}, Amount: ${amount}, Previous: ${previousSupplies}, New Total: ${supplies}`);
}

function generateSupplies() {
    setInterval(() => {
        if (gameActive) {
            const supplyIncrease = Math.floor(1 * (1 + levelCount * 0.07));
            updateSupplies(supplyIncrease, "generateSupplies (Periodic Increase)");
            // Dynamic supply drop rate: Higher levels have more frequent drops
            const dropChance = 0.2 + (levelCount * 0.005); // Increases drop chance with level
            if (Math.random() < Math.min(dropChance, 0.5)) { // Cap at 0.5 to avoid too many drops
                spawnSupplyDrop();
            }
        }
    }, 5000);
}

function spawnSupplyDrop(bonusMultiplier = 1) {
    const currentTime = Date.now();
    if (currentTime - lastSupplyDropTime < SUPPLY_DROP_INTERVAL) {
        console.log("Supply drop skipped: Too soon since last drop");
        return;
    }

    if (!gameActive || gamePaused) {
        console.log("Supply drop skipped: Game not active or paused");
        return;
    }

    if (!battlefield) {
        console.error("Battlefield element not found! Cannot spawn supply drop.");
        return;
    }

    const emptyCells = Array.from(document.querySelectorAll('.cell')).filter(cell => 
        !cell.childElementCount && !cell.querySelector('.supply-drop') && !cell.dataset.occupiedBy
    );
    if (emptyCells.length === 0) {
        console.log("Supply drop skipped: No empty cells available");
        return;
    }

    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const supplyDrop = document.createElement('div');
    supplyDrop.classList.add('supply-drop', 'pulsate');
    supplyDrop.innerHTML = '<img src="https://i.imgur.com/ZD3UitQ.png" alt="Supply Drop" style="width: 32px; height: 32px;">';
    supplyDrop.style.cursor = 'pointer';
    supplyDrop.style.zIndex = '15';
    randomCell.appendChild(supplyDrop);

    const baseSupplyAmount = 15;
    const supplyAmount = Math.floor(baseSupplyAmount * bonusMultiplier);

    // Function to handle supply collection (shared between click and touch)
    const collectSupply = () => {
        updateSupplies(supplyAmount, `Supply Drop Collection (Bonus Multiplier: ${bonusMultiplier})`);
        const supplyPopup = document.createElement('div');
        supplyPopup.classList.add('supply-popup');
        supplyPopup.textContent = `+${supplyAmount} Supplies`;
        supplyPopup.style.position = 'absolute';
        supplyPopup.style.left = '50%';
        supplyPopup.style.top = '-20px';
        supplyPopup.style.transform = 'translateX(-50%)';
        supplyPopup.style.color = '#FFD700';
        supplyPopup.style.fontSize = '14px';
        supplyPopup.style.animation = 'fadeOutUp 1s ease forwards';
        supplyDrop.appendChild(supplyPopup);
        supplyDrop.remove();
        lastActivityTime = Date.now();
    };

    // Desktop click event
    supplyDrop.addEventListener('click', (e) => {
        e.preventDefault();
        console.log(`Supply drop clicked at cell ${randomCell.dataset.index}`);
        collectSupply();
    });

    // Mobile touch event
    supplyDrop.addEventListener('touchend', (e) => {
        e.preventDefault();
        console.log(`Supply drop touched at cell ${randomCell.dataset.index}`);
        collectSupply();
    });

    setTimeout(() => {
        if (supplyDrop.parentElement) {
            supplyDrop.remove();
            console.log(`Supply drop at cell ${randomCell.dataset.index} expired and removed`);
        }
    }, 5000);

    lastSupplyDropTime = currentTime;
    console.log(`Supply drop spawned with ${supplyAmount} supplies at cell ${randomCell.dataset.index}`);
}

// New Function: Supply Surge Events
function startSupplySurgeEvents() {
    setInterval(() => {
        if (gameActive && !gamePaused && Math.random() < 0.1) { // 10% chance every 20 seconds
            triggerSupplySurge();
        }
    }, 20000);
}

function triggerSupplySurge() {
    showBattlefieldPopup(
        "SUPPLY SURGE! Increased Drops for 10 Seconds!",
        'supply-surge-popup',
        3000,
        { top: '20%', left: '50%' }
    );
    const surgeDuration = 15000; // 10 seconds
    const surgeInterval = setInterval(() => {
        if (!gameActive || gamePaused) return;
        spawnSupplyDrop(3); // 50% bonus supplies during surge
    }, 2000); // Spawn a drop every 2 seconds

    setTimeout(() => {
        clearInterval(surgeInterval);
        showBattlefieldPopup(
            "Supply Surge Ended",
            'supply-surge-end-popup',
            2000,
            { top: '20%', left: '50%' }
        );
    }, surgeDuration);
}

// Part 8: Speed Controls
document.addEventListener('DOMContentLoaded', () => {
    const speedButtons = { 'speed-1x': 1, 'speed-2x': 2 }; // Reverted to original IDs
    Object.keys(speedButtons).forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', () => {
                if (gamePaused) return;
                gameSpeed = speedButtons[buttonId];
                document.querySelectorAll('.speed-btn').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                console.log(`Game speed set to ${gameSpeed}x`);
            });
        } else {
            console.warn(`Button with ID ${buttonId} not found in DOM`);
        }
    });

    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            gamePaused = !gamePaused;
            pauseBtn.textContent = gamePaused ? 'Resume' : 'Pause';
            pauseBtn.classList.toggle('active', gamePaused);
            if (!gamePaused) lastActivityTime = Date.now();
            console.log(`Game ${gamePaused ? 'paused' : 'resumed'}`);
        });
    } else {
        console.warn("Pause button not found in DOM");
    }
});

// Part 9: Enemy Spawning and Wave Management (Updated)

startLevelBtn.addEventListener('click', startNextLevel);

function startNextLevel() {
    console.log(`Starting level ${levelCount}`);
    if (!gameActive) {
        gameActive = true;
        startSupplyDrops();
        console.log("Game activated");
    }

    // Ensure battlefield is visible and reset
    battlefield.style.opacity = '1';
    battlefield.style.pointerEvents = 'auto'; // Ensure battlefield is interactive

    // Only save initial state if this is a new level (not a replay)
    if (!initialTowersForLevel || initialTowersForLevel.length === 0) {
        initialSuppliesForLevel = supplies;
        initialTowersForLevel = [];
        document.querySelectorAll('.tower').forEach(tower => {
            initialTowersForLevel.push({
                cellIndex: tower.parentElement.dataset.index,
                type: tower.dataset.type,
                level: tower.dataset.level,
                damage: tower.dataset.damage,
                range: tower.dataset.range,
                health: tower.dataset.health
            });
        });
    }

    towerFiringIntervals.forEach((intervalId) => clearInterval(intervalId));
    towerFiringIntervals.clear();
    document.querySelectorAll('.tower').forEach(tower => startFiring(tower, tower.parentElement.dataset.index));

    currentWaveInLevel = 0;
    levelNumber.textContent = levelCount;
    levelDisplay.textContent = `Level: ${levelCount}`;
    enemiesSpawned = 0;
    totalEnemiesInWave = 0;
    updateRegionBar();
    spawnLevelWaves(levelCount);
    startLevelBtn.style.display = 'none';
    setupCardSystem();
    console.log(`Level ${levelCount} started, cards initialized`);

    if (levelCount % 5 === 0) {
        clearTowersForRecycling();
        initialTowersForLevel = []; // Clear initialTowersForLevel after recycling
    }

    // Only increment levelCount if this is not a replay
    if (!document.querySelector('#replay-level')) {
        levelCount++;
    }
}

function clearTowersForRecycling() {
    const towersToRemove = document.querySelectorAll('.tower');
    let recycledSupplies = 0;
    towersToRemove.forEach(tower => {
        const towerType = tower.dataset.type;
        const refund = Math.floor(towers[towerType].cost * 0.5);
        recycledSupplies += refund;
        const intervalId = towerFiringIntervals.get(tower);
        if (intervalId) {
            clearInterval(intervalId);
            towerFiringIntervals.delete(tower);
        }
        tower.remove();
    });
    updateSupplies(recycledSupplies, "Tower Recycling");
    supplyCount.textContent = supplies;

    showBattlefieldPopup(
        `LEVEL ${levelCount - 1} COMPLETE! RECYCLED ${recycledSupplies} SUPPLIES`,
        'wave-complete-popup',
        5000,
        { top: '50%', left: '50%' }
    );
}

function resetForNewRegion() {
    battlefield.innerHTML = '';
    setupBattlefield();
    supplyCount.textContent = supplies;
    enemiesDefeated = 0;
    totalEnemiesInWave = 0;
    enemiesSpawned = 0;
    banzaiCount = 0;
    towerKills.clear();
    towerFiringIntervals.clear();
    console.log(`Region reset for ${regions[currentRegion].name}`);
}

function spawnLevelWaves(level) {
    banzaiCount = 0;
    const numWaves = 1; // Always 1 wave
    console.log(`Spawning 1 wave for level ${level}`);

    currentWaveInLevel = 1; // Always wave 1
totalEnemiesInWave = Math.min(Math.floor((5 + level * 2 + Math.pow(level - 1, 1.5)) * 1.5), 50); // Cap at 50 enemies
const healthMultiplier = Math.min(1 + level * 0.1, 5); // Cap health increase
const speedMultiplier = Math.min(1 + (level - 1) * 0.02, 1.5); // Cap speed increase
    let numCommanders = level >= 4 ? Math.floor((level - 3) / 5) + 1 : 0;
    let numMinibosses = level >= 4 ? Math.floor((level - 3) / 5) + 1 : 0;
    if (level === 19 || level === 29 || level === 39) {
        numCommanders = Math.floor(Math.random() * 3) + 4;
        numMinibosses = Math.floor(Math.random() * 3) + 4;
    }

    const totalSpecialEnemies = numCommanders + numMinibosses;
    const regularEnemies = totalEnemiesInWave - totalSpecialEnemies;
    const enemiesToSpawn = [];
    for (let i = 0; i < regularEnemies; i++) {
        const enemyType = { ...enemies[Math.floor(Math.random() * enemies.length)], melee: true };
        enemyType.health = Math.floor(enemyType.health * healthMultiplier);
        enemyType.speed = enemyType.speed * speedMultiplier;
        enemiesToSpawn.push(enemyType);
    }
    for (let i = 0; i < numCommanders; i++) {
        const commander = { type: 'commander', name: 'Enemy Commander', health: 40, speed: 0.4, sprite: 'https://i.imgur.com/cioyDCS.png', damage: 20, ability: 'splash', melee: true, canShoot: true, shootChance: 0.8 };
        commander.health = Math.floor(commander.health * healthMultiplier);
        commander.speed = commander.speed * speedMultiplier;
        enemiesToSpawn.push(commander);
    }
    for (let i = 0; i < numMinibosses; i++) {
        const miniboss = selectMiniboss();
        miniboss.health = Math.floor(miniboss.health * healthMultiplier);
        miniboss.speed = miniboss.speed * speedMultiplier;
        miniboss.melee = true;
        miniboss.canShoot = true;
        miniboss.shootChance = 0.8;
        enemiesToSpawn.push(miniboss);
    }

    enemiesToSpawn.sort(() => Math.random() - 0.5);

    for (let i = 0; i < totalEnemiesInWave; i++) {
        setTimeout(() => {
            if (!gameActive || gamePaused) {
                console.log(`Enemy spawn skipped: gameActive ${gameActive}, gamePaused ${gamePaused}`);
                return;
            }
            const enemyType = enemiesToSpawn[i];
            const row = Math.floor(Math.random() * 5);
            const enemy = createEnemy(enemyType, row);
            enemy.dataset.isSpecialEnemy = (enemyType.type === 'commander' || enemyType.type === 'miniboss') ? 'true' : 'false';
            if (banzaiCount < maxBanzai && Math.random() < 0.3) {
                triggerBanzai(enemy);
            }
            if (enemyType.type === 'commander' || enemyType.type === 'miniboss') {
                setTimeout(() => enemy.parentElement && banzaiCount < maxBanzai && triggerBanzai(enemy), 1000);
            }
            battlefield.appendChild(enemy);
            moveEnemy(enemy, row);
            enemiesSpawned++;
            updateWaveProgress();
            console.log(`Spawned enemy ${enemyType.name} in row ${row}`);
        }, i * 2000 / gameSpeed);
    }

    if (level in availableUnitsByLevel) {
        setTimeout(() => {
            const newUnit = availableUnitsByLevel[level].slice(-1)[0];
            showBattlefieldPopup(
                `NEW UNIT RECEIVED: ${towers[newUnit].name.toUpperCase()}`,
                'new-unit-popup',
                4000,
                { top: '20%', left: '50%' }
            );
        }, 2000);
    }

    const idleCheckInterval = setInterval(() => {
        if (!gameActive) {
            clearInterval(idleCheckInterval);
            return;
        }
        const enemies = document.querySelectorAll('.enemy');
        const towersFiring = document.querySelectorAll('.tower').length > 0;
        let enemiesMoving = false;
        enemies.forEach(enemy => {
            const pos = parseFloat(enemy.style.left);
            if (pos > 0 && pos < 640 && !enemy.classList.contains('melee-mode')) {
                enemiesMoving = true;
            }
        });

        const now = Date.now();
        if (enemies.length > 0 && !enemiesMoving && towersFiring && (now - lastActivityTime > 60000)) {
            showBattlefieldPopup(
                `BUG DETECTED: No activity for 60 seconds. Ending battle.`,
                'bug-notification',
                5000,
                { top: '50%', left: '50%' }
            );
            console.log(`Bug: No activity for 60 seconds at Level ${levelCount}. Supplies: ${supplies}, Battle Progress: ${enemies.length}/${totalEnemiesInWave}`);
            enemies.forEach(enemy => enemy.remove());
            enemiesSpawned = totalEnemiesInWave;
            updateWaveProgress();
            lastActivityTime = now;
        }
    }, 1000);
}

function selectMiniboss() {
    const minibosses = [
        { type: 'miniboss', name: 'Lieutenant Tōichi', health: 80, speed: 0.7, sprite: 'https://i.imgur.com/4Z1YvwF.png', damage: 25, ability: 'splash' },
        { type: 'miniboss', name: 'Lieutenant Ryuji', health: 80, speed: 0.7, sprite: 'https://i.imgur.com/4Z1YvwF.png', damage: 25, ability: 'splash' },
        { type: 'miniboss', name: 'Major Tadamichi Kuribayashi', health: 70, speed: 1, sprite: 'https://i.imgur.com/4Z1YvwF.png', damage: 35, ability: 'splash' },
        { type: 'miniboss', name: 'Colonel Ryosaburo Tanaka', health: 120, speed: 0.7, sprite: 'https://i.imgur.com/4Z1YvwF.png', damage: 35, ability: 'splash' },
        { type: 'miniboss', name: 'Major Masa Orita', health: 90, speed: 0.6, sprite: 'https://i.imgur.com/4Z1YvwF.png', damage: 30, ability: 'splash' },
        { type: 'miniboss', name: 'Colonel Chōsei Oyadomari', health: 150, speed: 0.4, sprite: 'https://i.imgur.com/4Z1YvwF.png', damage: 30, ability: 'splash' }
    ];
    const selected = minibosses[Math.floor(Math.random() * minibosses.length)];
    console.log(`Selected miniboss: ${selected.name}`);
    return selected;
}

function createEnemy(enemyType, row) {
    const enemy = document.createElement('div');
    enemy.classList.add('enemy');
    if (enemyType.type === 'miniboss' || enemyType.type === 'commander') enemy.classList.add('mini-boss');
    const img = document.createElement('img');
    img.src = enemyType.sprite;
    enemy.appendChild(img);
    const nameTag = document.createElement('div');
    nameTag.classList.add('enemy-name');
    nameTag.textContent = enemyType.name;
    enemy.appendChild(nameTag);
    const healthBar = document.createElement('div');
    healthBar.classList.add('health-bar');
    healthBar.style.width = '64px';
    enemy.appendChild(healthBar);
    enemy.dataset.health = enemyType.health;
    enemy.dataset.maxHealth = enemyType.health;
    enemy.dataset.speed = enemyType.speed;
    enemy.dataset.damage = enemyType.damage;
    enemy.dataset.ability = enemyType.ability;
    enemy.dataset.canShoot = enemyType.canShoot ? 'true' : 'false';
    enemy.dataset.shootChance = enemyType.shootChance || 0;
    enemy.dataset.attackCooldown = 0;
    enemy.dataset.row = row;
    enemy.dataset.isSpecialEnemy = (enemyType.type === 'commander' || enemyType.type === 'miniboss') ? 'true' : 'false';
    enemy.style.left = '640px';
    enemy.style.top = `${row * 64 + 3}px`;

    if (enemyType.type === 'miniboss') {
        showBattlefieldPopup(
            `WARNING: ${enemyType.name.toUpperCase()} APPROACHING!`,
            'miniboss-popup',
            5000,
            { top: '10%', left: '50%' }
        );
    }

    setInterval(() => {
        if (Math.random() < 0.3 && gameActive && !gamePaused && enemy.parentElement) showEnemyBattleCry(enemy);
    }, 10000);

    return enemy;
}

function moveEnemy(enemy, row) {
    let pos = 640;
    let moveInterval = null;
    let isInMelee = false;

    const move = () => {
        if (!gameActive || !enemy.parentElement) {
            clearInterval(moveInterval);
            return;
        }
        if (gamePaused || isInMelee) return;

        const fortified = Array.from(document.querySelectorAll('.fortified')).some(cell => {
            const cellX = parseInt(cell.dataset.index % 10) * 64;
            return Math.abs(cellX - pos) < 32 && Math.floor(cell.dataset.index / 10) === row;
        });
        const speed = parseFloat(enemy.dataset.speed);
        const adjustedSpeed = fortified ? speed * 0.5 : speed;
        pos -= adjustedSpeed;
        enemy.style.left = `${pos}px`;
        lastActivityTime = Date.now();

        const tower = checkEnemyAttack(enemy, row, pos);
        if (tower) {
            const towerCol = parseInt(tower.parentElement.dataset.index) % 10;
            const enemyCol = Math.floor(pos / 64);
            const distance = Math.abs(towerCol - enemyCol);
            if (enemy.dataset.melee === 'true' && distance <= 1) {
                // Stop moving and enter melee mode
                enemy.classList.add('melee-mode');
                isInMelee = true;
                attackTower(enemy, tower, true, () => {
                    isInMelee = false;
                    enemy.classList.remove('melee-mode');
                    // Resume movement after melee
                    if (enemy.parentElement) move();
                });
                // Clear the movement interval while in melee
                clearInterval(moveInterval);
                moveInterval = null;
            } else if (distance <= 4) {
                attackTower(enemy, tower, false);
            }
        } else if (pos <= 0) {
            clearInterval(moveInterval);
            enemy.remove();
            triggerGameOver();
            updateWaveProgress();
        }
    };

    moveInterval = setInterval(move, 50 / gameSpeed);
    enemy.moveInterval = moveInterval;

    // Resume movement if melee ends
    enemy.addEventListener('melee-end', () => {
        if (!moveInterval && enemy.parentElement) {
            moveInterval = setInterval(move, 50 / gameSpeed);
            enemy.moveInterval = moveInterval;
        }
    });
}

function attackTower(enemy, tower, isMelee = false, onTowerDestroyed = () => {}) {
    const isRanged = enemy.dataset.ability === 'splash' || enemy.dataset.canShoot === 'true';
    const damage = parseInt(enemy.dataset.damage);
    let towerHealth = parseInt(tower.dataset.health);

    if (isMelee) {
        if (enemy.meleeInterval) clearInterval(enemy.meleeInterval);
        const meleeInterval = setInterval(() => {
            if (!enemy.parentElement || !tower.parentElement || gamePaused || !gameActive) {
                clearInterval(meleeInterval);
                enemy.meleeInterval = null;
                enemy.classList.remove('melee-mode');
                onTowerDestroyed();
                // Dispatch event to resume movement
                const meleeEndEvent = new Event('melee-end');
                enemy.dispatchEvent(meleeEndEvent);
                return;
            }
            towerHealth -= damage;
            tower.dataset.health = towerHealth;
            const maxHealth = parseInt(tower.dataset.maxHealth);
            tower.querySelector('.health-bar').style.width = `${(towerHealth / maxHealth) * 64}px`;
            tower.style.animation = 'flash 0.3s';
            if (towerHealth <= 0) {
                clearInterval(meleeInterval);
                enemy.meleeInterval = null;
                const intervalId = towerFiringIntervals.get(tower);
                if (intervalId) {
                    clearInterval(intervalId);
                    towerFiringIntervals.delete(tower);
                }
                tower.parentElement.innerHTML = '';
                onTowerDestroyed();
                // Dispatch event to resume movement
                const meleeEndEvent = new Event('melee-end');
                enemy.dispatchEvent(meleeEndEvent);
            }
        }, 1000 / gameSpeed);
        enemy.meleeInterval = meleeInterval;
    } else if (isRanged) {
        let cooldown = parseInt(enemy.dataset.attackCooldown) || 0;
        if (cooldown <= 0 && Math.random() < parseFloat(enemy.dataset.shootChance)) {
            const bullet = document.createElement('div');
            bullet.classList.add('enemy-bullet');
            bullet.style.left = `${parseFloat(enemy.style.left) + 32}px`;
            bullet.style.top = `${parseFloat(enemy.style.top) + 32}px`;
            bullet.style.zIndex = '20'; // Ensure bullet is visible
            battlefield.appendChild(bullet);

            const towerX = (parseInt(tower.parentElement.dataset.index) % 10) * 64 + 32;
            let bulletX = parseFloat(bullet.style.left);
            const moveBullet = setInterval(() => {
                if (gamePaused || !bullet.parentElement || !tower.parentElement) {
                    clearInterval(moveBullet);
                    bullet.remove();
                    return;
                }
                bulletX -= 15 * gameSpeed;
                bullet.style.left = `${bulletX}px`;
                if (bulletX <= towerX) {
                    clearInterval(moveBullet);
                    bullet.remove();
                    towerHealth -= damage;
                    tower.dataset.health = towerHealth;
                    const maxHealth = parseInt(tower.dataset.maxHealth);
                    tower.querySelector('.health-bar').style.width = `${(towerHealth / maxHealth) * 64}px`;
                    tower.style.animation = 'flash 0.3s';
                    if (towerHealth <= 0) {
                        const intervalId = towerFiringIntervals.get(tower);
                        if (intervalId) {
                            clearInterval(intervalId);
                            towerFiringIntervals.delete(tower);
                        }
                        tower.parentElement.innerHTML = '';
                    }
                }
            }, 20 / gameSpeed);
            enemy.dataset.attackCooldown = 2000 / gameSpeed;
        } else {
            enemy.dataset.attackCooldown = Math.max(0, cooldown - (50 * gameSpeed));
        }
    }
}

function checkEnemyAttack(enemy, row, pos) {
    const enemyCol = Math.floor(pos / 64);
    const towers = Array.from(battlefield.querySelectorAll('.tower')).filter(tower => {
        const towerRow = Math.floor(parseInt(tower.parentElement.dataset.index) / 10);
        const towerCol = parseInt(tower.parentElement.dataset.index) % 10;
        const distance = Math.abs(towerCol - enemyCol);
        return towerRow === row && distance <= 4 && towerCol >= enemyCol;
    });
    return towers.length > 0 ? towers.reduce((closest, tower) => {
        const towerCol = parseInt(tower.parentElement.dataset.index) % 10;
        const closestCol = closest ? parseInt(closest.parentElement.dataset.index) % 10 : -1;
        return towerCol > closestCol ? tower : closest;
    }, null) : null;
}

function triggerGameOver() {
    gameActive = false;
    showBattlefieldPopup(
        `ENEMY BREACHED! DEFENSE FAILED!`,
        'end-game-popup',
        5000,
        { top: '50%', left: '50%' }
    );
    gameOverDiv.style.display = 'block';
    startLevelBtn.style.display = 'block';
    console.log("Game Over: Enemy reached the leftmost line");
}

function triggerBanzai(enemy) {
    if (banzaiCount >= maxBanzai) {
        console.log("Banzai limit reached, skipping");
        return;
    }

    enemy.classList.add('banzai');
    const originalSpeed = parseFloat(enemy.dataset.speed);
    enemy.dataset.speed = originalSpeed * 2.5;
    enemy.dataset.invulnerable = 'true';
    enemy.dataset.damageMultiplier = '0.75';

    const maxHealth = parseInt(enemy.dataset.maxHealth);
    enemy.querySelector('.health-bar').style.width = `${(parseFloat(enemy.dataset.health) / maxHealth) * 64}px`;

    const banzaiText = document.createElement('div');
    banzaiText.classList.add('banzai-text');
    banzaiText.textContent = 'Banzai!';
    enemy.appendChild(banzaiText);
    showEnemyBattleCry(enemy, "Banzai!");
    banzaiCount++;
    console.log(`Banzai triggered for ${enemy.querySelector('.enemy-name').textContent}`);

    setTimeout(() => enemy.parentElement && delete enemy.dataset.invulnerable, 500);
    setTimeout(() => {
        if (enemy.parentElement) {
            enemy.classList.remove('banzai');
            enemy.dataset.speed = originalSpeed;
            delete enemy.dataset.damageMultiplier;
            enemy.querySelector('.health-bar').style.width = `${(parseFloat(enemy.dataset.health) / maxHealth) * 64}px`;
            banzaiText.remove();
        }
    }, 5000);
}

//Part 10: Reserve

// Part 11: Tower Firing Logic (Updated)

function updateKills(tower) {
    let kills = towerKills.get(tower) || 0;
    kills += 1;
    towerKills.set(tower, kills);
    if (kills >= 3) {
        try {
            autoUpgradeTower(tower);
            towerKills.set(tower, 0);
        } catch (error) {
            console.error(`Failed to auto-upgrade tower: ${error.message}`);
        }
    }
}

function fireBullet(tower, target, row, splash = false) {
    const bullet = document.createElement('div');
    bullet.classList.add('bullet');
    const towerX = (parseInt(tower.parentElement.dataset.index) % 10) * 64 + 32;
    bullet.style.left = `${towerX}px`;
    bullet.style.top = `${row * 64 + 32}px`;
    battlefield.appendChild(bullet);

    const bangText = document.createElement('div');
    bangText.classList.add('fire-text');
    bangText.textContent = 'Pang!';
    tower.appendChild(bangText);
    setTimeout(() => bangText.remove(), 400);

    const shootSound = document.getElementById('shoot-sound');
    shootSound.currentTime = 0;
    shootSound.play();

    let bulletX = towerX;
    const moveBullet = setInterval(() => {
        if (gamePaused || !bullet.parentElement) {
            clearInterval(moveBullet);
            bullet.remove();
            return;
        }
        if (!target.parentElement && !splash) {
            clearInterval(moveBullet);
            bullet.remove();
            return;
        }

        bulletX += 15 * gameSpeed;
        bullet.style.left = `${bulletX}px`;
        const targetX = splash ? bulletX : parseFloat(target.style.left);

        if (bulletX >= targetX) {
            clearInterval(moveBullet);
            bullet.remove();

            if (splash) {
                // Splash damage: Affect all enemies within a small radius
                const splashRadius = 1; // 1 tile radius
                const enemiesInSplash = findEnemiesInRange(`${row}-${Math.floor(bulletX / 64)}`, splashRadius);
                enemiesInSplash.forEach(enemy => {
                    if (enemy.dataset.invulnerable === 'true') {
                        const invulnerableText = document.createElement('div');
                        invulnerableText.classList.add('hit-reaction');
                        invulnerableText.textContent = 'Invulnerable!';
                        invulnerableText.style.left = '50%';
                        invulnerableText.style.top = '-20px';
                        invulnerableText.style.transform = 'translateX(-50%)';
                        enemy.appendChild(invulnerableText);
                        setTimeout(() => invulnerableText.remove(), 1000);
                        return;
                    }

                    let damage = parseInt(tower.dataset.damage);
                    if (enemy.dataset.damageMultiplier) damage = Math.floor(damage * parseFloat(enemy.dataset.damageMultiplier));
                    enemy.dataset.health = parseInt(enemy.dataset.health) - damage;
                    enemy.style.animation = 'flash 0.3s';
                    if (Math.random() < 0.2) showHitReaction(enemy);
                    const maxHealth = parseInt(enemy.dataset.maxHealth);
                    enemy.querySelector('.health-bar').style.width = `${(parseInt(enemy.dataset.health) / maxHealth) * 64}px`;
                    if (parseInt(enemy.dataset.health) <= 0) {
                        enemy.remove();
                        enemiesDefeated++;
                        score += 10 + levelCount * 5;
                        if (Math.random() < 0.3) showCelebration(tower);
                        updateKills(tower);
                        updateWaveProgress();
                    }
                });

                // Create an explosion effect for splash damage
                const explosion = document.createElement('div');
                explosion.classList.add('explosion');
                explosion.style.left = `${bulletX}px`;
                explosion.style.top = `${row * 64 + 32}px`;
                battlefield.appendChild(explosion);
                setTimeout(() => explosion.remove(), 300);
            } else {
                if (target.dataset.invulnerable === 'true') {
                    const invulnerableText = document.createElement('div');
                    invulnerableText.classList.add('hit-reaction');
                    invulnerableText.textContent = 'Invulnerable!';
                    invulnerableText.style.left = '50%';
                    invulnerableText.style.top = '-20px';
                    invulnerableText.style.transform = 'translateX(-50%)';
                    target.appendChild(invulnerableText);
                    setTimeout(() => invulnerableText.remove(), 1000);
                    return;
                }

                let damage = parseInt(tower.dataset.damage);
                if (target.dataset.damageMultiplier) damage = Math.floor(damage * parseFloat(target.dataset.damageMultiplier));
                let health = parseInt(target.dataset.health) - damage;
                target.dataset.health = health;
                const maxHealth = parseInt(target.dataset.maxHealth);
                target.querySelector('.health-bar').style.width = `${(health / maxHealth) * 64}px`;
                target.style.animation = 'flash 0.3s';
                if (Math.random() < 0.2) showHitReaction(target);

                if (health <= 0) {
                    lastActivityTime = Date.now();
                    const explosion = document.createElement('div');
                    explosion.classList.add('explosion');
                    explosion.style.left = `${targetX}px`;
                    explosion.style.top = target.style.top;
                    battlefield.appendChild(explosion);
                    setTimeout(() => explosion.remove(), 300);
                    target.remove();
                    enemiesDefeated++;
                    score += 10 + levelCount * 5;
                    if (Math.random() < 0.3) showCelebration(tower);
                    updateKills(tower);
                    updateWaveProgress();
                }
            }
        }
    }, 20 / gameSpeed);
}

function findEnemiesInRange(cellIndex, range) {
    const [towerRow, towerCol] = cellIndex.split('-').map(Number);
    const enemies = document.querySelectorAll('.enemy');
    return Array.from(enemies).filter(enemy => {
        const enemyCol = parseInt(enemy.style.left) / 64;
        const enemyRow = parseInt(enemy.dataset.row);
        const distance = Math.sqrt(Math.pow(towerRow - enemyRow, 2) + Math.pow(towerCol - enemyCol, 2));
        return distance <= range;
    });
}

function startFiring(tower, cellIndex) {
    const row = Math.floor(cellIndex / 10);
    const col = cellIndex % 10;
    const fireRate = parseInt(tower.dataset.fireRate);

    const existingInterval = towerFiringIntervals.get(tower);
    if (existingInterval) {
        clearInterval(existingInterval);
        towerFiringIntervals.delete(tower);
    }

    const fireInterval = setInterval(() => {
        if (!gameActive || !tower.parentElement) {
            clearInterval(fireInterval);
            towerFiringIntervals.delete(tower);
            return;
        }
        if (gamePaused) return;

        if (tower.dataset.reloading === 'true') return;

        let shotsFired = parseInt(tower.dataset.shotsFired) || 0;
        if (shotsFired >= 1) {
            tower.dataset.reloading = 'true';
            const reloadText = document.createElement('div');
            reloadText.classList.add('reload-text');
            reloadText.textContent = 'Reloading...';
            tower.appendChild(reloadText);
            setTimeout(() => {
                if (tower.parentElement) {
                    tower.dataset.shotsFired = 0;
                    delete tower.dataset.reloading;
                    reloadText.remove();
                }
            }, 2000 / gameSpeed);
            return;
        }

        const enemiesInRange = Array.from(battlefield.querySelectorAll('.enemy')).filter(enemy => {
            const enemyX = parseFloat(enemy.style.left);
            const enemyRow = Math.floor((parseFloat(enemy.style.top) - 3) / 64);
            const towerX = col * 64;
            const range = parseInt(tower.dataset.range) * 64;
            return enemyRow === row && enemyX > towerX && enemyX <= towerX + range;
        });

        if (enemiesInRange.length > 0) {
            lastActivityTime = Date.now();
            const target = enemiesInRange.reduce((closest, enemy) => {
                const enemyX = parseFloat(enemy.style.left);
                const closestX = closest ? parseFloat(closest.style.left) : Infinity;
                return enemyX < closestX ? enemy : closest;
            }, null);

            if (target) {
                if (tower.dataset.type === 'rajputs') {
                    const towerX = col * 64;
                    const targetX = parseFloat(target.style.left);
                    const distance = Math.abs(targetX - towerX);
                    const meleeRange = 64;

                    if (distance <= meleeRange) {
                        tower.classList.add('special-attack');
                        const slashEffect = document.createElement('div');
                        slashEffect.classList.add('slash-effect');
                        tower.appendChild(slashEffect);
                        setTimeout(() => slashEffect.remove(), 500);

                        const enemiesInMeleeRange = findEnemiesInRange(`${row}-${col}`, 1);
                        enemiesInMeleeRange.forEach(enemy => {
                            if (enemy.dataset.invulnerable === 'true') return;
                            let damage = parseInt(tower.dataset.damage);
                            if (enemy.dataset.damageMultiplier) damage = Math.floor(damage * parseFloat(enemy.dataset.damageMultiplier));
                            enemy.dataset.health = parseInt(enemy.dataset.health) - damage;
                            enemy.style.animation = 'flash 0.3s';
                            if (Math.random() < 0.2) showHitReaction(enemy);
                            const maxHealth = parseInt(enemy.dataset.maxHealth);
                            enemy.querySelector('.health-bar').style.width = `${(parseInt(enemy.dataset.health) / maxHealth) * 64}px`;
                            if (parseInt(enemy.dataset.health) <= 0) {
                                enemy.remove();
                                enemiesDefeated++;
                                score += 10 + levelCount * 5;
                                if (Math.random() < 0.3) showCelebration(tower);
                                updateKills(tower);
                                updateWaveProgress();
                            }
                        });
                        tower.dataset.shotsFired = shotsFired + 1;
                    } else {
                        fireBullet(tower, target, row);
                        tower.dataset.shotsFired = shotsFired + 1;
                    }
                } else if (tower.dataset.type === 'winnipeg-grenadiers' && Math.random() < 0.1) {
                    target.classList.add('blinded');
                    const originalSpeed = parseFloat(target.dataset.speed);
                    target.dataset.speed = 0;
                    setTimeout(() => {
                        if (target.parentElement) {
                            target.classList.remove('blinded');
                            target.dataset.speed = originalSpeed;
                        }
                    }, 2000);
                    fireBullet(tower, target, row);
                    tower.dataset.shotsFired = shotsFired + 1;
                } else if (tower.dataset.type === 'universal-carrier') {
                    // Universal Carrier fires explosive rounds with splash damage
                    fireBullet(tower, target, row, true);
                    tower.dataset.shotsFired = shotsFired + 1;
                } else {
                    fireBullet(tower, target, row);
                    tower.dataset.shotsFired = shotsFired + 1;
                }
            }
        }

        if (tower.dataset.type === 'hkvdc' && !tower.dataset.supplyInterval) {
            if (cellIndex === undefined || isNaN(cellIndex)) {
                console.warn(`Cannot start supply generation for HKVDC tower: cellIndex is undefined`);
                return;
            }
            const supplyInterval = setInterval(() => {
                if (tower.parentElement && !gamePaused && gameActive) {
                    updateSupplies(1, `HKVDC Supply Generation (Tower at cell ${cellIndex})`);
                }
            }, 30000 / gameSpeed);
            tower.dataset.supplyInterval = supplyInterval;
        }
    }, fireRate / gameSpeed);

    towerFiringIntervals.set(tower, fireInterval);
}

// Part 12: Helper Functions
function showBattleCry(tower) {
    const cries = ["For King and Country!", "Hold the line!", "Fire at will!", "Defend Hong Kong!", "Stand firm!", "We’ll never surrender!", "Push them back!", "For the Empire!"];
    const cry = document.createElement('div');
    cry.classList.add('battle-cry');
    cry.textContent = cries[Math.floor(Math.random() * cries.length)];
    cry.style.left = '50%';
    cry.style.top = '0';
    cry.style.transform = 'translateX(-50%)';
    tower.appendChild(cry);
    setTimeout(() => cry.remove(), 2000);
}

function showEnemyBattleCry(enemy, forcedText = null) {
    const cries = ["Banzai!", "Kill you!", "For the Emperor!", "Charge!", "Death to the enemy!", "Tenno Heika!", "Forward!", "Victory or death!"];
    const cry = document.createElement('div');
    cry.classList.add('battle-cry');
    cry.textContent = forcedText || cries[Math.floor(Math.random() * cries.length)];
    cry.style.left = '50%';
    cry.style.top = '0';
    cry.style.transform = 'translateX(-50%)';
    enemy.appendChild(cry);
    setTimeout(() => cry.remove(), 2000);
}

function showHitReaction(element) {
    const reactions = ["Ouch!", "Take that!", "Argh!", "Hit!", "Ugh!", "Got me!", "That hurts!", "Aah!"];
    const reaction = document.createElement('div');
    reaction.classList.add('hit-reaction');
    reaction.textContent = reactions[Math.floor(Math.random() * reactions.length)];
    reaction.style.left = '50%';
    reaction.style.top = '-20px';
    reaction.style.transform = 'translateX(-50%)';
    element.appendChild(reaction);
    setTimeout(() => reaction.remove(), 2000);
}

function showCelebration(tower) {
    const celebration = document.createElement('div');
    celebration.classList.add('celebration');
    celebration.textContent = 'Victory!';
    celebration.style.left = '50%';
    celebration.style.top = '-20px';
    celebration.style.transform = 'translateX(-50%)';
    tower.appendChild(celebration);
    setTimeout(() => celebration.remove(), 2000);
}

// Part 13: Wave Progress and New Features (Updated)

function showWaveCompletionCelebration() {
    const celebration = document.createElement('div');
    celebration.classList.add('wave-celebration');
    celebration.textContent = `Wave ${currentWaveInLevel} of Level ${levelCount} Cleared!`;
    celebration.style.position = 'absolute';
    celebration.style.left = '50%';
    celebration.style.top = '50%';
    celebration.style.transform = 'translate(-50%, -50%)';
    celebration.style.fontSize = '48px';
    celebration.style.color = '#FFD700';
    celebration.style.textShadow = '2px 2px 4px #000';
    celebration.style.zIndex = '1000';
    battlefield.appendChild(celebration);
    setTimeout(() => celebration.remove(), 2000);
}

function updateWaveProgress() {
    const allEnemies = document.querySelectorAll('.enemy');
    const enemiesRemaining = allEnemies.length;
    waveProgressDisplay.textContent = `Enemy Wave: ${enemiesRemaining}/${totalEnemiesInWave}`;
    const progress = totalEnemiesInWave > 0 ? (enemiesSpawned - enemiesRemaining) / totalEnemiesInWave * 100 : 0;
    progressBar.style.width = `${progress}%`;

    if (enemiesRemaining === 0 && enemiesSpawned >= totalEnemiesInWave) {
        checkWaveCompletion();
    }
}

function checkActivity() {
    setInterval(() => {
        if (gameActive && !gamePaused && Date.now() - lastActivityTime > 10000) {
            const enemies = document.querySelectorAll('.enemy').length;
            const towersFiring = document.querySelectorAll('.tower').length > 0;
            if (enemies === 0 && towersFiring && enemiesSpawned >= totalEnemiesInWave) {
                console.log("No enemies remaining, forcing wave completion check");
                checkWaveCompletion();
            }
        }
    }, 1000);
}
checkActivity();

function checkWaveCompletion() {
    const allEnemiesGone = document.querySelectorAll('.enemy').length === 0;
    if (allEnemiesGone && enemiesSpawned >= totalEnemiesInWave) {
        score += levelCount * 50 + enemiesDefeated * 5;

        if (score > highScore) {
            highScore = score;
            localStorage.setItem('highScore', highScore);
        }

        const currentLevel = levelCount - 1;

        // Check for new unit unlock after Level 8
        if (currentLevel === 8) {
            setTimeout(() => {
                showBattlefieldPopup(
                    `NEW UNIT RECEIVED: ${towers['universal-carrier'].name.toUpperCase()}`,
                    'new-unit-popup',
                    4000,
                    { top: '20%', left: '50%' }
                );
            }, 2000);
        }

        if (currentLevel >= 40) {
            showBattlefieldPopup(
                `VICTORY! HONG KONG DEFENDED - SCORE: ${score}`,
                'victory-popup',
                6000,
                { top: '50%', left: '50%' }
            );
            gameOverDiv.innerHTML = `
                <div class="game-over-box">
                    <h2>Congratulations!</h2>
                    <p>You have defended Hong Kong!</p>
                    <p>Final Score: ${score}</p>
                    <p>High Score: ${highScore}</p>
                    <p>Enemies Defeated: ${enemiesDefeated}</p>
                    <button id="restart">Play Again</button>
                </div>
            `;
            gameOverDiv.style.display = 'block';
            document.getElementById('restart').addEventListener('click', restartGame);
            gameActive = false;
        } else {
            showBattlefieldPopup(
                `LEVEL ${currentLevel} CLEARED!`,
                'level-cleared-popup',
                4000,
                { top: '50%', left: '50%' }
            );
            gameOverDiv.innerHTML = `
                <div class="game-over-box">
                    <h2>Level ${currentLevel} Cleared!</h2>
                    <p>Score: ${score}</p>
                    <p>High Score: ${highScore}</p>
                    <p>Enemies Defeated: ${enemiesDefeated}</p>
                    <button id="next-level">Next Level (${currentLevel + 1})</button>
                </div>
            `;
            gameOverDiv.style.display = 'block';
            document.getElementById('next-level').addEventListener('click', () => {
                gameOverDiv.style.display = 'none';
                startNextLevel();
            });
        }
    }
}

function getNumWaves(level) {
    return level <= 5 ? 1 : level <= 10 ? 2 : level <= 15 ? 3 : (level === 19 || level === 29 || level === 39) ? 5 : 4;
}

function cleanupIntervals() {
    towerFiringIntervals.forEach((intervalId) => clearInterval(intervalId));
    towerFiringIntervals.clear();
    document.querySelectorAll('.tower').forEach(tower => {
        if (tower.dataset.supplyInterval) {
            clearInterval(tower.dataset.supplyInterval);
            delete tower.dataset.supplyInterval;
        }
    });
}

function endGame() {
    gameActive = false;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }
    let newUnitMessage = '';
    if (levelCount in availableUnitsByLevel) {
        const newUnit = availableUnitsByLevel[levelCount].slice(-1)[0];
        newUnitMessage = `New Unit Unlocked: ${towers[newUnit].name}`;
    }
    showBattlefieldPopup(
        `DEFENSE FAILED - LEVEL ${levelCount} BREACHED\nScore: ${score}\nHigh Score: ${highScore}\nEnemies Defeated: ${enemiesDefeated}\n${newUnitMessage}`,
        'end-game-popup',
        0, // No auto-remove, waits for button click
        { top: '50%', left: '50%' },
        [
            { id: 'restart', text: 'Restart Campaign', onClick: restartGame },
            { id: 'replay-level', text: `Retry Level ${levelCount}`, onClick: replayLevel }
        ]
    );
    console.log(`Game ended at Level ${levelCount}`);
}

function replayLevel() {
    console.log(`Replaying Level ${levelCount}`);

    // Reset game state
    gameActive = false;
    gamePaused = false;
    gameOverDiv.style.display = 'none';

    // Clear all enemies and towers
    document.querySelectorAll('.enemy').forEach(enemy => enemy.remove());
    document.querySelectorAll('.tower').forEach(tower => {
        const intervalId = towerFiringIntervals.get(tower);
        if (intervalId) {
            clearInterval(intervalId);
            towerFiringIntervals.delete(tower);
        }
        if (tower.dataset.supplyInterval) {
            clearInterval(tower.dataset.supplyInterval);
        }
        tower.remove();
    });

    // Clear battlefield of any bullets, effects, etc.
    document.querySelectorAll('.bullet, .enemy-bullet, .explosion, .supply-drop').forEach(element => element.remove());

    // Reset wave progress and enemy counters
    enemiesSpawned = 0;
    totalEnemiesInWave = 0;
    enemiesDefeated = 0;
    currentWaveInLevel = 0;
    banzaiCount = 0;
    towerKills.clear();
    towerFiringIntervals.clear();
    waveProgressDisplay.textContent = `Wave ${currentWaveInLevel}: 0/0`;
    progressBar.style.width = '0%';

    // Reset supplies to the amount at the start of the level
    supplies = initialSuppliesForLevel || 0;
    supplyCount.textContent = supplies;

    // Reset cards to the state at the start of the level
    setupCardSystem();

    // Restore towers to their initial state at the start of the level
    initialTowersForLevel.forEach(towerData => {
        const cell = document.querySelector(`.cell[data-index="${towerData.cellIndex}"]`);
        if (cell && !cell.childElementCount) {
            const tower = document.createElement('div');
            tower.classList.add('tower');
            if (towers[towerData.type].width === 128) {
                tower.classList.add('universal-carrier');
                tower.style.width = '128px';
                tower.style.height = '64px';
                const adjacentCellIndex = parseInt(towerData.cellIndex) + 1;
                const adjacentCell = document.querySelector(`.cell[data-index="${adjacentCellIndex}"]`);
                if (adjacentCell) adjacentCell.dataset.occupiedBy = towerData.cellIndex;
            }
            const soldier = document.createElement('img');
            soldier.src = towers[towerData.type].sprite;
            soldier.style.width = towers[towerData.type].width ? `${towers[towerData.type].width}px` : '64px';
            soldier.style.height = towers[towerData.type].height ? `${towers[towerData.type].height}px` : '64px';
            tower.appendChild(soldier);
            tower.dataset.type = towerData.type;
            tower.dataset.damage = towerData.damage;
            tower.dataset.range = towerData.range;
            tower.dataset.fireRate = towers[towerData.type].fireRate;
            tower.dataset.level = towerData.level;
            tower.dataset.health = towerData.health;
            tower.dataset.maxHealth = towerData.health;
            tower.dataset.shotsFired = 0;

            const healthBar = document.createElement('div');
            healthBar.classList.add('health-bar');
            healthBar.style.width = towers[towerData.type].width ? `${towers[towerData.type].width}px` : '64px';
            tower.appendChild(healthBar);

            const tooltip = document.createElement('div');
            tooltip.classList.add('tower-tooltip');
            tooltip.innerHTML = `
                <strong>${towers[towerData.type].name}</strong><br>
                Damage: ${tower.dataset.damage}<br>
                Range: ${tower.dataset.range}<br>
                Fire Rate: ${tower.dataset.fireRate}ms<br>
                Level: ${tower.dataset.level}
            `;
            tower.appendChild(tooltip);

            tower.addEventListener('mouseenter', () => tooltip.style.display = 'block');
            tower.addEventListener('mouseleave', () => tooltip.style.display = 'none');

            const upgradeBtn = document.createElement('button');
            upgradeBtn.classList.add('upgrade-btn');
            upgradeBtn.textContent = 'Upgrade';
            upgradeBtn.addEventListener('click', (event) => upgradeTower(event, tower));
            tower.appendChild(upgradeBtn);

            cell.appendChild(tower);
            startFiring(tower, towerData.cellIndex);

            if (towers[towerData.type].ability === 'boost') {
                setInterval(() => activateBoost(tower), 35000);
                activateBoost(tower);
            }

            setInterval(() => {
                if (Math.random() < 0.3) showBattleCry(tower);
            }, 10000);
        }
    });

    // Reset level count to the current level (undo the increment)
    levelCount = levelCount;

    // Restart the level
    gameActive = true;
    startLevelBtn.style.display = 'none';
    startNextLevel();
}