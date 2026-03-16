const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const startBtn = document.getElementById("startBtn");
const statsMsg = document.getElementById("stats-msg");

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let score = 0;
let highScore = localStorage.getItem("snakeHighScore") || 0;
let dx = 0, dy = 0;
let snake = [];
let food = { x: 5, y: 5 };
let gameRunning = false;
const gameSpeed = 100;

// --- AUDIO SYSTEM ---
let audioCtx;
function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playSound(freq, type, duration, volume = 0.05) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

// --- INPUTS ---
document.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    let moved = false;
    if ((key === "arrowleft" || key === "a") && dx === 0) { dx = -1; dy = 0; moved = true; }
    if ((key === "arrowup" || key === "w") && dy === 0) { dx = 0; dy = -1; moved = true; }
    if ((key === "arrowright" || key === "d") && dx === 0) { dx = 1; dy = 0; moved = true; }
    if ((key === "arrowdown" || key === "s") && dy === 0) { dx = 0; dy = 1; moved = true; }
    
    if (moved && gameRunning) playSound(150, 'sine', 0.05, 0.02); // Move click
    if (["enter", " "].includes(key) && !gameRunning) startGame();
});

// Mobile Touch
let tsX, tsY;
canvas.addEventListener('touchstart', e => { tsX = e.touches[0].clientX; tsY = e.touches[0].clientY; }, false);
canvas.addEventListener('touchend', e => {
    let teX = e.changedTouches[0].clientX; let teY = e.changedTouches[0].clientY;
    let xD = tsX - teX; let yD = tsY - teY;
    if (Math.abs(xD) > Math.abs(yD)) {
        if (xD > 0 && dx === 0) { dx = -1; dy = 0; } else if (dx === 0) { dx = 1; dy = 0; }
    } else {
        if (yD > 0 && dy === 0) { dx = 0; dy = -1; } else if (dy === 0) { dx = 0; dy = 1; }
    }
    if (gameRunning) playSound(150, 'sine', 0.05, 0.02);
    if (!gameRunning) startGame();
}, false);

function startGame() {
    initAudio();
    snake = [{x: 10, y: 10}, {x: 10, y: 11}, {x: 10, y: 12}];
    score = 0; dx = 0; dy = -1;
    gameRunning = true;
    overlay.style.display = "none";
    createFood();
    main();
}

function main() {
    if (!gameRunning) return;
    if (checkDeath()) {
        playSound(100, 'sawtooth', 0.5, 0.1); // Death sound
        if (score > highScore) {
            highScore = score;
            localStorage.setItem("snakeHighScore", highScore);
        }
        statsMsg.innerHTML = `SYSTEM CRASH<br>SCORE: ${score} | BEST: ${highScore}`;
        overlay.style.display = "flex";
        gameRunning = false;
        return;
    }
    setTimeout(() => {
        update();
        draw();
        main();
    }, gameSpeed);
}

function update() {
    let nextX = snake[0].x + dx;
    let nextY = snake[0].y + dy;

    // Wrap Logic
    if (nextX < 0) nextX = tileCount - 1;
    if (nextX >= tileCount) nextX = 0;
    if (nextY < 0) nextY = tileCount - 1;
    if (nextY >= tileCount) nextY = 0;

    const head = { x: nextX, y: nextY };
    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score += 10;
        playSound(600 + score, 'triangle', 0.1); // Eat sound (gets higher as you grow)
        createFood();
    } else {
        snake.pop();
    }
}

function checkDeath() {
    for (let i = 1; i < snake.length; i++) {
        if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) return true;
    }
    return false;
}

function createFood() {
    food.x = Math.floor(Math.random() * tileCount);
    food.y = Math.floor(Math.random() * tileCount);
    if (snake.some(p => p.x === food.x && p.y === food.y)) createFood();
}

function draw() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Food
    ctx.fillStyle = "#f0f"; ctx.shadowBlur = 10; ctx.shadowColor = "#f0f";
    ctx.fillRect(food.x * gridSize + 2, food.y * gridSize + 2, gridSize - 4, gridSize - 4);

    // Snake
    ctx.fillStyle = "#0ff"; ctx.shadowBlur = 15; ctx.shadowColor = "#0ff";
    snake.forEach((p, i) => {
        ctx.globalAlpha = i === 0 ? 1 : 0.7;
        ctx.fillRect(p.x * gridSize + 1, p.y * gridSize + 1, gridSize - 2, gridSize - 2);
    });

    // Score HUD
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    ctx.fillStyle = "white"; ctx.font = "14px Courier New";
    ctx.fillText(`SCORE: ${score}`, 10, 20);
    ctx.fillText(`BEST: ${highScore}`, canvas.width - 110, 20);
}

startBtn.addEventListener("click", startGame);