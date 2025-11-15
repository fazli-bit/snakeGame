import { Game } from './game.js';

Game.Core = {
    animationFrameId: null,
    init: function() {
        Game.Firebase.init();
        Game.State.decorationValue.textContent = `${Game.State.decorationSlider.value}%`;
        Game.Core.resetGame();
        Game.Graphics.draw();
        Game.Graphics.drawCharacterPreviews();
        Game.Controls.setupEventListeners();
    },
    gameLoop: function() {
        Game.Core.update();
        Game.Graphics.draw();
        Game.Core.animationFrameId = requestAnimationFrame(Game.Core.gameLoop);
    },
    update: function() {
        if (Game.State.gameOver) return;
        Game.State.globalAnimationTick++;
        if (Game.State.isTransitioning) {
            Game.Core.handleStageTransition();
            return;
        }
        if (Game.State.player.hitTimer > 0) {
            Game.State.player.hitTimer--;
        } else {
            Game.State.player.isHit = false;
        }
        if (Game.State.player.powerUpCooldown > 0) {
            Game.State.player.powerUpCooldown--;
        }
        if (Game.State.player.platformToDropThrough && Game.State.player.y > Game.State.player.platformToDropThrough.y + Game.Constants.PLATFORM_HEIGHT) {
            Game.State.player.platformToDropThrough = null;
        }
        Game.Enemies.updateEnemies();
        Game.Enemies.updateProjectiles();
        Game.Player.handlePlayerInput();
        Game.Player.updateActions();
        Game.Player.updatePlayerPosition();
        Game.Player.checkPlayerCollisions();
        Game.Debug.updateDebugInfo();
        Game.Graphics.updateHpDisplay();
        const S = Game.State;
        const standingPlat = S.player.standingOnPlatform;
        if (standingPlat && standingPlat.subType === 'crumbling' && S.player.dx === 0) {
            if (standingPlat !== S.crumblingPlatformCandidate) {
                S.crumblingPlatformCandidate = standingPlat;
                S.crumbleCounter = 0;
            }
            S.crumbleCounter++;
            if (S.crumbleCounter > 60) {
                standingPlat.isFalling = true;
                S.crumblingPlatformCandidate = null;
            }
        } else {
            S.crumblingPlatformCandidate = null;
            S.crumbleCounter = 0;
        }
        for (let i = S.platforms.length - 1; i >= 0; i--) {
            const p = S.platforms[i];
            if (p.subType === 'moving') {
                const nextX = p.x + p.dx;
                let collision = false;
                if (nextX < 0 || nextX + p.width > S.canvas.width) {
                    collision = true;
                } else {
                    for (let j = 0; j < S.platforms.length; j++) {
                        if (i === j) continue;
                        const other = S.platforms[j];
                        if (other.isFalling) continue;
                        if (nextX < other.x + other.width && nextX + p.width > other.x && p.y < other.y + other.height && p.y + p.height > other.y) {
                            collision = true;
                            break;
                        }
                    }
                }
                if (collision) { p.dx *= -1; }
                p.x += p.dx;
            }
            if (p.isFalling) {
                p.y += 5;
                if (p.y > S.canvas.height) { S.platforms.splice(i, 1); }
            }
        }
        if (S.player.onGround && S.player.standingOnPlatform && S.player.standingOnPlatform.type === 'top' && ![101, 102].includes(S.stage)) {
            S.isTransitioning = true;
        }
        if (S.player.y > S.canvas.height) {
            if (![101, 102].includes(S.stage)) {
                S.player.hp = 0;
                S.gameOver = true;
            } else {
                const floor = S.platforms[0];
                S.player.y = floor.y - S.player.height;
                S.player.x = 20;
                S.player.dy = 0;
                S.player.dx = 0;
            }
        }
        if (S.gameOver) {
            cancelAnimationFrame(Game.Core.animationFrameId);
            S.finalScoreDisplay.textContent = S.score;
            S.finalStageDisplay.textContent = S.stage;
            S.continueButton.disabled = S.checkpointStage <= 1;
            S.gameOverMenu.style.display = 'flex';
            S.hud.style.display = 'none';
            if (document.body.classList.contains('is-mobile')) {
                document.getElementById('on-screen-controls').style.display = 'none';
            }
            if (!S.debugModeActive) {
                Game.Firebase.handleNewHighScore();
            } else {
                Game.Firebase.loadHighScores();
            }
        }
    },
    startGame: function() {
        const S = Game.State;
        S.startMenu.style.display = 'none';
        S.gameOverMenu.style.display = 'none';
        S.hud.style.display = 'flex';
        if (document.body.classList.contains('is-mobile')) {
            document.getElementById('on-screen-controls').style.display = 'flex';
        }
        if (Game.Core.animationFrameId) cancelAnimationFrame(Game.Core.animationFrameId);
        S.stage = S.checkpointStage; 
        Game.Core.resetGame();
        Game.Core.gameLoop();
    },
    resetGame: function() {
        const S = Game.State;
        const player = S.player;
        player.x = 20;
        player.y = S.canvas.height - 40 - player.height;
        player.dx = 0;
        player.dy = 0;
        player.onGround = true;
        player.standingOnPlatform = null;
        player.isCrouching = false;
        player.canDropDown = true;
        player.platformToDropThrough = null;
        player.isHit = false;
        player.hitTimer = 0;
        player.powerUp = null;
        player.powerUpCooldown = 0;
        player.isAttacking = false;
        player.attackTimer = 0;
        player.isBlocking = false;
        player.direction = 'right';
        player.maxHp = 1;
        player.hp = S.debugModeActive ? 99 : 1;
        S.score = 0;
        S.scoreDisplay.textContent = S.score;
        S.stageDisplay.textContent = S.stage;
        S.gameOver = false;
        S.isTransitioning = false;
        S.landedYLevels = new Set();
        Game.Level.generatePlatforms();
        Game.Level.generatePowerUps();
        if(S.platforms[0]) S.landedYLevels.add(S.platforms[0].y);
    },
    handleStageTransition: function() {
        const S = Game.State;
        const scrollSpeed = 5;
        const targetY = S.canvas.height - S.goalPlatform.height;
        S.platforms.forEach(p => p.y += scrollSpeed);
        S.powerUps.forEach(p => p.y += scrollSpeed);
        S.player.y += scrollSpeed;
        S.enemies.forEach(e => e.y += scrollSpeed);
        S.decorations.forEach(d => d.y += scrollSpeed);
        if (S.goalPlatform.y >= targetY) {
            const finalShift = targetY - S.goalPlatform.y;
            S.platforms.forEach(p => p.y += finalShift);
            S.powerUps.forEach(p => p.y += finalShift);
            S.player.y += finalShift;
            S.isTransitioning = false;
            S.stage++;
            if ((S.stage - 1) > 0 && (S.stage - 1) % 10 === 0) {
                S.checkpointStage = S.stage;
            }
            S.stageDisplay.textContent = S.stage;
            const previousTopPlatforms = S.platforms.filter(p => p.type === 'top');
            Game.Level.generatePlatforms(previousTopPlatforms);
            Game.Level.generatePowerUps();
            const startPlatform = S.platforms[0];
            S.player.y = startPlatform.y - S.player.height;
            S.player.x = startPlatform.x + (startPlatform.width / 2) - (S.player.width / 2);
            S.player.onGround = true;
            S.player.dy = 0;
            S.player.dx = 0;
            S.landedYLevels.clear();
            S.landedYLevels.add(startPlatform.y);
        }
    }
};