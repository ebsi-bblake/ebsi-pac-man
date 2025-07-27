document.addEventListener("DOMContentLoaded", () => {
    // UI Elements
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const scoreEl = document.getElementById("score");
    const livesEl = document.getElementById("lives");
    const endScreen = document.getElementById("end-screen");
    const endMessage = document.getElementById("end-message");
    const restartBtn = document.getElementById("restart-btn");
    const muteBtn = document.getElementById("mute-btn");
    const powerUpBanner = document.getElementById("powerup-banner");

    // Game Constants
    const TILE_SIZE = 22;
    const ROWS = 22;
    const COLS = 19;
    canvas.width = COLS * TILE_SIZE;
    canvas.height = ROWS * TILE_SIZE;

    // Game State
    let score, lives, powerUpActive, powerUpTimer, gameLoopId, gameReady;
    let player, tokens, enemies, powerUps;
    let frameCount = 0;

    // --- Sound Engine ---
    const SoundEngine = {
        audioCtx: null,
        sounds: {},
        muted: false,
        init() {
            try {
                this.audioCtx = new (window.AudioContext ||
                    window.webkitAudioContext)();
            } catch (e) {
                console.error("Web Audio API is not supported");
            }
        },
        play(name) {
            if (!this.audioCtx || this.muted) return;
            const sound = this.sounds[name];
            if (!sound) return;
            const source = this.audioCtx.createBufferSource();
            source.buffer = sound.buffer;
            const gainNode = this.audioCtx.createGain();
            gainNode.gain.setValueAtTime(sound.volume, this.audioCtx.currentTime);
            source.connect(gainNode).connect(this.audioCtx.destination);
            source.start(0);
        },
        create(name, { type, frequency, volume, duration }) {
            if (!this.audioCtx) return;
            const buffer = this.audioCtx.createBuffer(
                1,
                this.audioCtx.sampleRate * duration,
                this.audioCtx.sampleRate,
            );
            const data = buffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) {
                data[i] = Math.sin(
                    (2 * Math.PI * frequency * i) / this.audioCtx.sampleRate,
                );
            }
            this.sounds[name] = { buffer, volume };
        },
        toggleMute() {
            this.muted = !this.muted;
            muteBtn.innerText = this.muted ? "Unmute" : "Mute";
        },
    };

    // --- ASSET DEFINITIONS ---
    const assets = {};
    const svgAssets = {
        player: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="#00BFB3" stroke="#fff" stroke-width="5"/><path d="M50 15 L55 45 L85 50 L55 55 L50 85 L45 55 L15 50 L45 45 Z" fill="#fff"/></svg>`,
        powerUp: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 5 L20 50 L45 50 L35 95 L80 40 L55 40 Z" fill="gold" stroke="#fff" stroke-width="5"/></svg>`,
        token: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="20" fill="#fff"/></svg>`,
        enemies: {
            Confuso: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M10 90 V40 C10 10 90 10 90 40 V90 L75 75 L60 90 L45 75 L30 90 Z" fill="purple"/></svg>`,
            Delaya: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M10 90 V40 C10 10 90 10 90 40 V90 L75 75 L60 90 L45 75 L30 90 Z" fill="red"/></svg>`,
            MissyMatch: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M10 90 V40 C10 10 90 10 90 40 V90 L75 75 L60 90 L45 75 L30 90 Z" fill="blue"/></svg>`,
            Forgotto: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M10 90 V40 C10 10 90 10 90 40 V90 L75 75 L60 90 L45 75 L30 90 Z" fill="orange"/></svg>`,
        },
    };

    const map = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
        [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1],
        [1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1],
        [1, 1, 1, 1, 0, 1, 0, 1, 1, 2, 1, 1, 0, 1, 0, 1, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1],
        [1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1],
        [1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
        [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
        [1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1],
        [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];

    function loadAssets(callback) {
        let loadedCount = 0;
        const totalAssets = Object.keys(svgAssets.enemies).length + 3;
        function assetLoaded() {
            if (++loadedCount === totalAssets) callback();
        }
        function loadSvg(name, svgString) {
            const img = new Image();
            img.onload = assetLoaded;
            img.src = "data:image/svg+xml;base64," + btoa(svgString);
            assets[name] = img;
        }
        loadSvg("player", svgAssets.player);
        loadSvg("powerUp", svgAssets.powerUp);
        loadSvg("token", svgAssets.token);
        Object.keys(svgAssets.enemies).forEach((k) =>
            loadSvg(`enemy_${k}`, svgAssets.enemies[k]),
        );
    }

    function init() {
        score = 0;
        lives = 3;
        powerUpActive = false;
        powerUpTimer = 0;
        frameCount = 0;
        gameReady = false;

        scoreEl.innerText = score;
        updateLives();

        createPowerUps();
        createTokens();
        resetCharacters();

        endScreen.classList.add("hidden");
        powerUpBanner.classList.add("hidden");

        if (gameLoopId) cancelAnimationFrame(gameLoopId);
        gameLoopId = requestAnimationFrame(gameLoop);

        setTimeout(() => {
            gameReady = true;
        }, 500); // Staggered start
    }

    function createPowerUps() {
        powerUps = [
            { x: 1, y: 3 },
            { x: 17, y: 3 },
            { x: 1, y: 16 },
            { x: 17, y: 16 },
        ];
    }

    function createTokens() {
        tokens = [];
        const powerUpLocations = powerUps.map((p) => `${p.x},${p.y}`);
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (map[y][x] === 0 && !powerUpLocations.includes(`${x},${y}`)) {
                    tokens.push({ x, y });
                }
            }
        }
    }

    function resetCharacters() {
        player = { x: 9, y: 16, dx: 0, dy: 0, isInvulnerable: true };
        setTimeout(() => {
            if (player) player.isInvulnerable = false;
        }, 2000);

        enemies = [
            {
                name: "Confuso",
                x: 9,
                y: 8,
                dx: 1,
                dy: 0,
                asset: "enemy_Confuso",
                ai: "chase",
            },
            {
                name: "Delaya",
                x: 9,
                y: 10,
                dx: -1,
                dy: 0,
                asset: "enemy_Delaya",
                ai: "ambush",
            },
            {
                name: "MissyMatch",
                x: 7,
                y: 10,
                dx: 1,
                dy: 0,
                asset: "enemy_MissyMatch",
                ai: "flank",
            },
            {
                name: "Forgotto",
                x: 11,
                y: 10,
                dx: -1,
                dy: 0,
                asset: "enemy_Forgotto",
                ai: "random",
            },
        ];
    }

    function gameLoop() {
        if (gameReady) {
            update();
        }
        draw();
        gameLoopId = requestAnimationFrame(gameLoop);
    }

    function update() {
        frameCount++;
        movePlayer();
        moveEnemies();
        checkCollisions();
        updatePowerUp();
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawMap();
        drawTokens();
        drawPowerUps();
        drawEnemies();
        drawPlayer();
    }

    function movePlayer() {
        if (frameCount % 5 !== 0) return;
        let newX = player.x + player.dx;
        let newY = player.y + player.dy;
        if (newX < 0) newX = COLS - 1;
        if (newX >= COLS) newX = 0;
        if (map[newY] && map[newY][newX] !== 1) {
            player.x = newX;
            player.y = newY;
        }
    }

    function moveEnemies() {
        enemies.forEach((enemy) => {
            if (frameCount % 6 !== 0) return;
            const target = getEnemyTarget(enemy);
            const bestMove = getBestMove(enemy, target);
            if (bestMove) {
                enemy.dx = bestMove.dx;
                enemy.dy = bestMove.dy;
                enemy.x += enemy.dx;
                enemy.y += enemy.dy;
            }
        });
    }

    function getEnemyTarget(enemy) {
        if (powerUpActive)
            return {
                x: Math.floor(Math.random() * COLS),
                y: Math.floor(Math.random() * ROWS),
            };
        switch (enemy.ai) {
            case "chase":
                return { x: player.x, y: player.y };
            case "ambush":
                return { x: player.x + player.dx * 4, y: player.y + player.dy * 4 };
            case "flank":
                const blinky = enemies.find((e) => e.ai === "chase");
                if (blinky) {
                    let offsetX = player.x + player.dx * 2 - blinky.x;
                    let offsetY = player.y + player.dy * 2 - blinky.y;
                    return { x: blinky.x + offsetX * 2, y: blinky.y + offsetY * 2 };
                }
                return { x: player.x, y: player.y };
            case "random":
                return Math.hypot(enemy.x - player.x, enemy.y - player.y) > 8
                    ? { x: player.x, y: player.y }
                    : { x: 0, y: ROWS - 1 };
        }
    }

    function getBestMove(entity, target) {
        const validMoves = [];
        const { x, y, dx, dy } = entity;
        if (map[y - 1] && map[y - 1][x] !== 1) validMoves.push({ dx: 0, dy: -1 });
        if (map[y + 1] && map[y + 1][x] !== 1) validMoves.push({ dx: 0, dy: 1 });
        if (map[y][x - 1] !== 1) validMoves.push({ dx: -1, dy: 0 });
        if (map[y][x + 1] !== 1) validMoves.push({ dx: 1, dy: 0 });

        const nonReversingMoves = validMoves.filter(
            (move) => (move.dx !== -dx || move.dy !== -dy) && validMoves.length > 1,
        );
        const movesToConsider =
            nonReversingMoves.length > 0 ? nonReversingMoves : validMoves;

        let bestMove = null,
            minDistance = Infinity;
        for (const move of movesToConsider) {
            const distance = Math.hypot(
                x + move.dx - target.x,
                y + move.dy - target.y,
            );
            if (distance < minDistance) {
                minDistance = distance;
                bestMove = move;
            }
        }
        return bestMove;
    }

    function checkCollisions() {
        tokens = tokens.filter((token) => {
            if (token.x === player.x && token.y === player.y) {
                score += 10;
                scoreEl.innerText = score;
                SoundEngine.play("collect");
                return false;
            }
            return true;
        });

        let powerUpCollected = false;
        powerUps.forEach((powerUp) => {
            if (powerUp.x === player.x && powerUp.y === player.y) {
                powerUpCollected = true;
                powerUpActive = true;
                powerUpTimer = 10 * 60;
                powerUpBanner.classList.remove("hidden");
                SoundEngine.play("powerup");
            }
        });
        if (powerUpCollected)
            powerUps = powerUps.filter(
                (p) => !(p.x === player.x && p.y === player.y),
            );

        enemies.forEach((enemy) => {
            if (enemy.x === player.x && enemy.y === player.y) {
                if (powerUpActive) {
                    score += 50;
                    scoreEl.innerText = score;
                    SoundEngine.play("enemy");
                    Object.assign(enemy, { x: 9, y: 10, dx: 1, dy: 0 });
                } else if (!player.isInvulnerable) {
                    lives--;
                    SoundEngine.play("die");
                    updateLives();
                    if (lives === 0) endGame(false);
                    else resetCharacters();
                }
            }
        });

        if (tokens.length === 0) endGame(true);
    }

    function updatePowerUp() {
        if (powerUpActive) {
            powerUpTimer--;
            if (powerUpTimer <= 0) {
                powerUpActive = false;
                powerUpBanner.classList.add("hidden");
            }
        }
    }

    function drawMap() {
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (map[y][x] === 1) {
                    ctx.fillStyle = "#00ADEF";
                    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
            }
        }
    }

    function drawTokens() {
        tokens.forEach((token) => {
            ctx.drawImage(
                assets.token,
                token.x * TILE_SIZE + 4,
                token.y * TILE_SIZE + 4,
                TILE_SIZE - 8,
                TILE_SIZE - 8,
            );
        });
    }

    function drawPowerUps() {
        powerUps.forEach((powerUp) => {
            ctx.drawImage(
                assets.powerUp,
                powerUp.x * TILE_SIZE,
                powerUp.y * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE,
            );
        });
    }

    function drawPlayer() {
        if (player && player.isInvulnerable && frameCount % 10 < 5) return;
        ctx.save();
        if (powerUpActive) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = "gold";
        }
        if (player)
            ctx.drawImage(
                assets.player,
                player.x * TILE_SIZE,
                player.y * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE,
            );
        ctx.restore();
    }

    function drawEnemies() {
        enemies.forEach((enemy) => {
            ctx.drawImage(
                assets[enemy.asset],
                enemy.x * TILE_SIZE,
                enemy.y * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE,
            );
        });
    }

    function endGame(win) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
        gameReady = false;
        endScreen.classList.remove("hidden");
        endMessage.innerHTML = win
            ? "🎉 You’ve unlocked your full benefits potential!"
            : "😓 Overwhelmed? Let Empyrean guide you.";
        SoundEngine.play(win ? "win" : "lose");
    }

    function updateLives() {
        livesEl.innerHTML = "";
        for (let i = 0; i < lives; i++) livesEl.innerHTML += "🌟";
    }

    // Keyboard controls
    window.addEventListener("keydown", (e) => {
        if (!player) return;
        const key = e.key;
        if (key === "ArrowUp" || key === "w") {
            player.dx = 0;
            player.dy = -1;
        } else if (key === "ArrowDown" || key === "s") {
            player.dx = 0;
            player.dy = 1;
        } else if (key === "ArrowLeft" || key === "a") {
            player.dx = -1;
            player.dy = 0;
        } else if (key === "ArrowRight" || key === "d") {
            player.dx = 1;
            player.dy = 0;
        }
    });
    
    // Touch/swipe controls
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    
    const minSwipeDistance = 30; // Minimum distance for a swipe to register
    
    window.addEventListener("touchstart", (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });
    
    window.addEventListener("touchend", (e) => {
        if (!player) return;
        
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        // Check if swipe distance is sufficient
        if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
            return; // Not a swipe, ignore
        }
        
        // Determine swipe direction based on which delta is larger
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (deltaX > 0) {
                // Swipe right
                player.dx = 1;
                player.dy = 0;
            } else {
                // Swipe left
                player.dx = -1;
                player.dy = 0;
            }
        } else {
            // Vertical swipe
            if (deltaY > 0) {
                // Swipe down
                player.dx = 0;
                player.dy = 1;
            } else {
                // Swipe up
                player.dx = 0;
                player.dy = -1;
            }
        }
    }, { passive: true });
    
    // Optional: Prevent default touch behaviors that might interfere
    window.addEventListener("touchmove", (e) => {
        e.preventDefault();
    }, { passive: false });

    muteBtn.addEventListener("click", () => SoundEngine.toggleMute());
    restartBtn.addEventListener("click", init);
    document.addEventListener("touchstart", (e) => e.preventDefault(), {
        passive: false,
    });
    document.addEventListener("touchmove", (e) => e.preventDefault(), {
        passive: false,
    });
    SoundEngine.init();
    SoundEngine.create("collect", {
        type: "sine",
        frequency: 440,
        volume: 0.5,
        duration: 0.1,
    });
    SoundEngine.create("powerup", {
        type: "sine",
        frequency: 880,
        volume: 0.7,
        duration: 0.3,
    });
    SoundEngine.create("enemy", {
        type: "sine",
        frequency: 220,
        volume: 0.6,
        duration: 0.2,
    });
    SoundEngine.create("die", {
        type: "sine",
        frequency: 110,
        volume: 0.8,
        duration: 0.5,
    });
    SoundEngine.create("win", {
        type: "sine",
        frequency: 660,
        volume: 0.8,
        duration: 1.0,
    });
    SoundEngine.create("lose", {
        type: "sine",
        frequency: 165,
        volume: 0.8,
        duration: 1.5,
    });
    loadAssets(init);
});
