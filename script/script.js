// Declaring Variables

// Namespace for SVG elements
const svgNS = "http://www.w3.org/2000/svg";

// Board size configuration
let boardsizeX = 800;
let boardsizeY = 1000;

// Game constants
let nStars = 20;           // Number of stars in the background
let nAliens = 6;           // Number of aliens per wave
let minCircleRadius = 1;   // Minimum radius of a star
let maxCircleRadius = 8;   // Maximum radius of a star
let score = 0;             // Player's score
var myTimer = null;        // Timer for game loop
var bulletTimer = null;    // Timer for bullet generation
var genAlien = null;       // Timer for alien generation
var moveInterval = null;   // Interval for ship movement
let timingInterval = 20;   // Main game loop interval (ms)
let elapsedTime = 0;       // Elapsed time in the game
let shipWidth = 140;       // Width of the player's ship
let bulletCount = 30;      // Maximum number of bullets
let bulletW = 10;          // Width of a bullet
let bulletH = 30;          // Height of a bullet
const svg = document.getElementById("board"); // SVG game board element
var bulletimg = './media/bullet.svg'; // Path to the bullet image

/**
 * Creates a star element with randomized attributes.
 * @param {number} starNumber - The unique identifier for the star.
 * @returns {SVGCircleElement} The star element.
 */
function makeStar(starNumber) {
    let star = document.createElementNS(svgNS, "circle");
    star.setAttribute("id", "star" + starNumber);
    star.setAttribute("fill", "white");

    // Randomize size and position
    let radius = Math.floor(Math.random() * (maxCircleRadius - minCircleRadius) + minCircleRadius);
    star.setAttribute("r", radius);
    let cx = Math.floor(Math.random() * (boardsizeX - radius));
    star.setAttribute("cx", cx);
    let cy = Math.floor(Math.random() * boardsizeY - radius);
    star.setAttribute("cy", cy);

    // Randomize color/opacity
    let c = Math.floor(Math.random() * 180) + 55;
    star.style.fill = `rgb(${c},${c},${c})`;
    return star;
}

/**
 * Removes all child elements from the SVG board and clears game intervals.
 */
function clearAll() {
    while (svg.childNodes.length > 0) {
        svg.removeChild(svg.firstChild);
    }

    // Clearing intervals
    clearInterval(myTimer);
    clearInterval(bulletTimer);
    clearInterval(genAlien);
    clearInterval(moveInterval);

    // Resetting arrays
    bulletList = [];
    alienList = [];
}

// Modal element for game over
var modal = document.getElementById('pop');

/**
 * Opens the game over modal.
 */
function openModal() {
    bootstrap.Modal.getOrCreateInstance(document.getElementById('pop')).show();
}

/**
 * Generates the player's ship outside the visible area.
 * @returns {SVGImageElement} The ship element.
 */
function genShip() {
    const ship = document.createElementNS(svgNS, 'image');
    ship.setAttribute('href', "./media/ship.svg");
    ship.setAttribute('width', 200);
    ship.setAttribute('height', 100);
    ship.setAttribute('id', "ship");
    ship.setAttribute('x', '320');
    ship.setAttribute('y', '1100');
    svg.appendChild(ship);
    return ship;
}

/**
 * Animates the ship entering the game frame and initializes bullets.
 */
function shipStart() {
    let ship = genShip();
    let y = ship.getAttribute("y");
    let width = ship.getAttribute("width");
    let shipTimer = setInterval(() => {
        y -= 5;
        ship.setAttribute('y', y);
        width -= 1;
        height = width * (3 / 4);
        ship.setAttribute('width', width);
        ship.setAttribute('height', height);
        if (y <= 800) {
            clearInterval(shipTimer);
            genBullets();
        }
    }, timingInterval);
}

// List of active aliens and unique ID tracker
var alienList = [];
var alienId = 0;

/**
 * Starts generating waves of aliens.
 */
function aliens() {
    genAlien = setInterval(() => {
        alienGen();
    }, 8000);
}

/**
 * Generates a wave of aliens.
 */
function alienGen() {
    while (alienId < nAliens) {
        const w = 100;
        c = alienId * w;
        let x = Math.floor((Math.random() * w + c));
        let y = Math.floor((Math.random() * (boardsizeY / 2 - w + w / 3)) - 800);
        let alien = document.createElementNS(svgNS, "image");
        alien.setAttribute("id", "alien" + alienId);
        alienId++;
        alien.setAttribute("href", "./media/alien.svg");
        alien.setAttribute("width", w);
        alien.setAttribute("height", w);
        alien.setAttribute('life', 3);
        alien.setAttribute("x", x);
        alien.setAttribute("y", y);
        alienList.push(alien);
        svg.appendChild(alien);
    }
    alienId = 0;
}

/**
 * Detects collision between two objects (top side).
 * @param {HTMLElement} obj1 - First object.
 * @param {HTMLElement} obj2 - Second object.
 * @returns {boolean} True if collision occurs.
 */
function topCollision(obj1, obj2) {
    let o1 = {
        x: parseInt(obj1.getAttribute('x')),
        y: parseInt(obj1.getAttribute('y')),
        w: parseInt(obj1.getAttribute('width')),
        h: parseInt(obj1.getAttribute('height'))
    };

    let o2 = {
        x: parseInt(obj2.getAttribute('x')),
        y: parseInt(obj2.getAttribute('y')),
        w: parseInt(obj2.getAttribute('width')),
        h: parseInt(obj2.getAttribute('height'))
    };

    return (((o1.x <= o2.x && o1.x + o1.w >= o2.x) ||
            (o1.x + o1.w >= o2.x + o2.w && o1.x <= o2.x + o2.w)) &&
            o2.y < o1.y && o2.y + o2.h > o1.y);
}

/**
 * Detects collision between the player's ship and an alien.
 * @param {HTMLElement} ship - The ship object.
 * @param {HTMLElement} alien - The alien object.
 * @returns {boolean} True if collision occurs.
 */
function shipCollision(ship, alien) {
    let o1 = {
        x: parseInt(ship.getAttribute('x')) + (parseInt(ship.getAttribute('width')) / 2),
        y: parseInt(ship.getAttribute('y')) + parseInt(ship.getAttribute('height') / 1.5),
        r: parseInt(ship.getAttribute('width') / 2),
    };

    let o2 = {
        x: parseInt(alien.getAttribute('x')),
        y: parseInt(alien.getAttribute('y')),
        w: parseInt(alien.getAttribute('width')),
        h: parseInt(alien.getAttribute('height'))
    };

    return (
        o1.y > (o2.y + o2.h) &&
        o1.x >= o2.x &&
        o1.x <= (o2.x + o2.w) &&
        (o1.y - o1.r) <= (o2.y + o2.h)
    ) || (
        o1.x > (o2.x + o2.w) &&
        o1.y >= o2.y &&
        o1.y <= (o2.y + o2.h) &&
        (o1.x - o1.r) <= (o2.x + o2.w)
    ) || (
        o1.x < o2.x &&
        o1.y >= o2.y &&
        o1.y <= (o2.y + o2.h) &&
        (o1.x + o1.r) >= o2.x
    );
}

// List of active bullets and unique ID tracker
var bulletList = [];
var bulletId = 0;

/**
 * Generates bullets periodically.
 */
function genBullets() {
    if (bulletTimer != null) {
        clearInterval(bulletTimer);
    }
    bulletTimer = setInterval(() => {
        let bullet = document.createElementNS(svgNS, 'image');
        bullet.setAttribute('href', bulletimg);
        bullet.setAttribute('id', 'bullet' + bulletId);
        bulletId++;
        let x = parseInt(ship.getAttribute('x'));
        let y = parseInt(ship.getAttribute('y'));
        let w = parseInt(ship.getAttribute('width'));
        x = Math.floor((x + (w - bulletW) / 2));
        bullet.setAttribute('x', x);
        bullet.setAttribute('y', y - bulletH);
        bullet.setAttribute('height', bulletH);
        bullet.setAttribute('width', bulletW);
        bulletList.push(bullet);
        svg.appendChild(bullet);
        if (bulletId > bulletCount) {
            bulletId = 0;
        }
    }, timingInterval * 4);
}

/**
 * Ends the game, showing the game over modal and resetting variables.
 */
function gameOver() {
    clearInterval(myTimer);
    clearInterval(bulletTimer);
    clearInterval(moveInterval);
    openModal();
    let scoreFin = document.getElementById('score-final');
    let scoreObj = document.getElementById('score');
    score = parseInt(scoreObj.innerText);
    scoreFin.innerText = score;
    elapsedTime = 0;
    document.getElementById("timer").innerHTML = elapsedTime;
}

/**
 * Updates the player's score.
 * @param {number} int - The value to add to the score.
 */
function scoreUpdate(int) {
    let scoreObj = document.getElementById('score');
    score = parseInt(scoreObj.innerText);
    score += int;
    scoreObj.innerText = score;
}

/**
 * Function to handle ship movement based on user input events.
 * Initializes event listeners for ship movement and manages movement intervals.
 */
function move() {
    let togg1 = false; // Toggle for right movement
    let togg2 = false; // Toggle for left movement
    let Xspeed = 8; // Speed of the ship
    let ship = document.getElementById('ship');
    let shipX = parseInt(ship.getAttribute('x'));
    const lb = document.getElementById("lb"); // Left button element
    const rb = document.getElementById("rb"); // Right button element
    moveInterval = null; // Interval for movement

    // Event listeners for right button
    rb.addEventListener('mousedown', e => {
        togg1 = true;
        updateR();
    });

    rb.addEventListener('mouseup', e => {
        togg1 = false;
        updateR();
    });

    rb.addEventListener('touchstart', e => {
        togg1 = true;
        updateR();
    });

    rb.addEventListener('touchend', e => {
        togg1 = false;
        updateR();
    });

    rb.addEventListener('mousemove', e => {
        togg1 = false;
        updateR();
    });

    // Event listeners for left button
    lb.addEventListener('mousedown', e => {
        togg2 = true;
        updateL();
    });

    lb.addEventListener('mouseup', e => {
        togg2 = false;
        updateL();
    });

    lb.addEventListener('mousemove', e => {
        togg2 = false;
        updateL();
    });

    lb.addEventListener('touchstart', e => {
        togg2 = true;
        updateL();
    });

    lb.addEventListener('touchend', e => {
        togg2 = false;
        updateL();
    });

    /**
     * Updates the ship's position to the right when toggled.
     */
    const updateR = () => {
        if (moveInterval != null) {
            clearInterval(moveInterval);
        }
        if (togg1) {
            moveInterval = setInterval(() => {
                if (shipX < ((boardsizeX - shipWidth) - Xspeed)) {
                    shipX += Xspeed;
                    ship.setAttribute('x', shipX);
                }
            }, timingInterval);
        } else {
            clearInterval(moveInterval);
        }
    };

    /**
     * Updates the ship's position to the left when toggled.
     */
    const updateL = () => {
        if (moveInterval != null) {
            clearInterval(moveInterval);
        }
        if (togg2) {
            moveInterval = setInterval(() => {
                if (shipX > Xspeed) {
                    shipX -= Xspeed;
                    ship.setAttribute('x', shipX);
                }
            }, timingInterval);
        } else {
            clearInterval(moveInterval);
        }
    };
}

/**
 * Starts the game by initializing the game state, generating elements, and starting timers.
 */
function gameStart() {
    clearAll();
    shipStart();
    move();
    alienGen();
    aliens();

    // Generate stars for the background
    for (i = 0; i < nStars; i++) {
        let star = makeStar(i);
        svg.appendChild(star);
    }

    if (myTimer != null) {
        clearInterval(myTimer);
    }

    if (bulletTimer != null) {
        clearInterval(bulletTimer);
    }

    elapsedTime = 0;
    score = 0;
    document.getElementById('score').innerText = score;

    // Main game loop
    myTimer = setInterval(function () {
        document.getElementById('timer').innerText = 0;
        elapsedTime += timingInterval;
        let timeSpan = document.getElementById("timer");
        timeSpan.innerHTML = "" + elapsedTime;

        // Move stars downward
        for (var s = 0; s < nStars; s++) {
            let star = document.getElementById("star" + s);

            if (star != null) {
                let cyVal = parseInt(star.getAttribute("cy"));
                let rVal = parseInt(star.getAttribute("r"));
                let cxVal = parseInt(star.getAttribute("cx"));
                cyVal += rVal; // Larger stars fall faster
                star.setAttribute("cy", cyVal);

                if (cyVal > boardsizeY) {
                    cxVal = Math.floor(Math.random() * (boardsizeX));
                    cyVal -= 1000 + (Math.floor(Math.random() * 30));
                    star.setAttribute("cy", cyVal);
                    star.setAttribute("cx", cxVal);
                }
            }
        }

        // Update bullet positions
        bulletList.forEach(bullet => {
            let y = parseInt(bullet.getAttribute("y"));
            y -= 60;
            let id = bullet.getAttribute('id');
            bullet.setAttribute('y', y);

            // Check for collisions with aliens
            alienList.forEach(alien => {
                let life = parseInt(alien.getAttribute('life'));
                if ((y > 0) && topCollision(alien, bullet) && (bullet != null)) {
                    alien.style.fill = "rgb(255,0,0)";
                    bulletList.splice(bulletList.indexOf(bullet), 1);
                    svg.removeChild(bullet);
                    life--;
                    alien.setAttribute('life', life);
                    scoreUpdate(10);
                }
            });

            if (y <= 0) {
                bulletList.splice(bulletList.indexOf(bullet), 1);
                svg.removeChild(bullet);
            }
        });

        // Update alien positions and check for collisions
        alienList.forEach(alien => {
            let life = parseInt(alien.getAttribute('life'));
            let y = parseInt(alien.getAttribute("y"));
            y += 3;
            alien.setAttribute('y', y);

            if (shipCollision(ship, alien)) {
                gameOver();
            }

            if (life == 2) {
                alien.setAttribute('href', "./media/alien-1.svg");
            } else if (life == 1) {
                alien.setAttribute('href', "./media/alien-2.svg");
            } else if (life <= 0) {
                svg.removeChild(alien);
                alienList.splice(alienList.indexOf(alien), 1);
                scoreUpdate(50);
            }

            if (y >= 1000) {
                alienList.splice(alienList.indexOf(alien), 1);
                svg.removeChild(alien);
            }
        });

    }, timingInterval);
}

/**
 * Event listener for changing the color of the ship.
 */
document.getElementById('colorChange').addEventListener('click', function (e) {
    switch (t) {
        case 1:
            ship.setAttribute('href', './media/Bship.svg');
            bulletimg = './media/BBullet.svg';
            t++;
            break;
        case 2:
            ship.setAttribute('href', './media/Pship.svg');
            bulletimg = './media/PBullet.svg';
            t++;
            break;
        case 3:
            ship.setAttribute('href', './media/Gship.svg');
            bulletimg = './media/GBullet.svg';
            t++;
            break;
        case 4:
            ship.setAttribute('href', './media/Rship.svg');
            bulletimg = './media/RBullet.svg';
            t++;
            break;
        case 5:
            ship.setAttribute('href', './media/ship.svg');
            bulletimg = './media/Bullet.svg';
            t = 1;
            break;
    }
});


/**
 * Initializes the game controls and event listeners on window load.
 * Handles keydown events for ship movement and button clicks for game start and restart.
 */
window.addEventListener("load", function() {
    document.getElementById("year").textContent = new Date().getFullYear();
    /**
     * Event listener for keydown events to control ship movement.
     * - ArrowRight: Moves the ship to the right.
     * - ArrowLeft: Moves the ship to the left.
     *
     * @param {KeyboardEvent} e - The keyboard event triggered by key press.
     */
    document.addEventListener('keydown', function(e) {
        if (myTimer != null) {
            let Xspeed = 8; // Speed at which the ship moves.
            let ship = document.getElementById('ship');
            let shipX = parseInt(ship.getAttribute('x')); // Current X position of the ship.

            if (e.code == 'ArrowRight') {
                // Move the ship to the right if within bounds.
                if (shipX < ((boardsizeX - shipWidth) - Xspeed)) {
                    shipX += Xspeed;
                    ship.setAttribute('x', shipX);
                }
            } else if (e.code == 'ArrowLeft') {
                // Move the ship to the left if within bounds.
                if (shipX > Xspeed) {
                    shipX -= Xspeed;
                    ship.setAttribute('x', shipX);
                }
            }
        }
    });

    /**
     * Event listener for the start button click to start the game.
     */
    document.getElementById("start").addEventListener("click", gameStart);

    /**
     * Event listener for the restart button click to restart the game.
     */
    document.getElementById("restart").addEventListener("click", gameStart);
});

