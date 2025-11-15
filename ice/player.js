import { Game } from './game.js';

Game.Player = {
    getPointsPerLevel: function() {
        const stage = Game.State.stage;
        if (stage < 5) return 10;
        return 20 + Math.floor((stage - 5) / 5) * 10;
    },
    handlePlayerInput: function() {
        const player = Game.State.player;
        const stage = Game.State.stage;
        const keys = Game.Controls.keys;
        const C = Game.Constants;
        if (player.isAttacking) {
            player.dx = 0;
        } else {
            if (stage === 101) {
                player.dx = 0;
                return;
            }
            player.isCrouching = (keys.down && player.onGround);
            const onIce = player.onGround && player.standingOnPlatform && player.standingOnPlatform.subType === 'icy';
            if (keys.left) {
                player.direction = 'left';
                if (onIce) { if (player.dx > 0) player.dx -= 0.4; player.dx = Math.max(player.dx - 0.2, -Game.State.playerSpeed); } 
                else { player.dx = -Game.State.playerSpeed; }
            } else if (keys.right) {
                player.direction = 'right';
                if (onIce) { if (player.dx < 0) player.dx += 0.4; player.dx = Math.min(player.dx + 0.2, Game.State.playerSpeed); } 
                else { player.dx = Game.State.playerSpeed; }
            } else if (player.onGround) {
                if (onIce) { player.dx *= C.ICE_FRICTION; } 
                else { player.dx = 0; }
            }
            if (Math.abs(player.dx) < 0.1) player.dx = 0;
            if ((keys.up || keys.a) && player.onGround && Game.State.canJump) {
                if (player.isCrouching && player.standingOnPlatform && player.standingOnPlatform.type !== 'base' && player.canDropDown) {
                    player.dy = -2;
                    player.onGround = false;
                    player.platformToDropThrough = player.standingOnPlatform;
                    player.canDropDown = false;
                    setTimeout(() => { player.canDropDown = true; }, 300);
                } else if (!player.isCrouching) {
                    player.dy = Game.Constants.JUMP_POWER;
                    player.onGround = false;
                    Game.State.canJump = false;
                    setTimeout(() => { Game.State.canJump = true; }, Game.State.jumpDelay);
                }
            }
        }
        if (keys.b && player.powerUp) {
            if (player.powerUp.type === 'HAMMER' && player.attackTimer <= 0) {
                player.isAttacking = true;
                player.attackTimer = 30;
                player.dx = 0;
            } else if (player.powerUp.type === 'SHIELD') {
                player.isBlocking = true;
                if (player.onGround && (keys.left || keys.right) && player.dy === 0) {
                    player.dy = -2.5;
                    player.onGround = false;
                }
            }
        } else {
            player.isBlocking = false;
        }
    },
    updateActions: function() {
        const player = Game.State.player;
        const S = Game.State;
        if (player.attackTimer > 0) {
            player.attackTimer--;
            if (player.isAttacking && player.attackTimer === 25) {
                const attackOffset = 5;
                const attackWidth = 25;
                const attackX = player.direction === 'right' ? player.x + player.width + attackOffset : player.x - attackWidth - attackOffset;
                const attackY = player.y;
                const attackHeight = player.height;
                for (let i = S.enemies.length - 1; i >= 0; i--) {
                    const enemy = S.enemies[i];
                    if (attackX < enemy.x + enemy.width && attackX + attackWidth > enemy.x &&
                        attackY < enemy.y + enemy.height && attackY + attackHeight > enemy.y) {
                        if (enemy.type === 'GROUND_MONSTER' || enemy.type === 'BAT') {
                            S.enemies.splice(i, 1);
                        }
                    }
                }
            }
            if (player.attackTimer === 0) {
                player.isAttacking = false;
            }
        }
    },
    updatePlayerPosition: function() {
        const player = Game.State.player;
        if (Game.State.stage === 101) return;
        player.dy += Game.Constants.GRAVITY;
        player.x += player.dx;
        player.y += player.dy;
        if (player.x + player.width < 0) { player.x = Game.State.canvas.width; } 
        else if (player.x > Game.State.canvas.width) { player.x = -player.width; }
    },
    checkPlayerCollisions: function() {
        const player = Game.State.player;
        const S = Game.State;
        player.onGround = false;
        player.standingOnPlatform = null;
        for (const plat of S.platforms) {
            if(player.platformToDropThrough === plat || plat.isFalling) continue;
            if (player.x + player.width > plat.x && player.x < plat.x + plat.width) {
                if (player.dy >= 0 && player.y + player.height >= plat.y && (player.y + player.height - player.dy) <= plat.y) {
                    player.dy = 0;
                    player.onGround = true;
                    player.y = plat.y - player.height;
                    player.standingOnPlatform = plat;
                    if (plat.subType === 'moving') player.x += plat.dx;
                    if (!S.landedYLevels.has(plat.y) && ![101, 102].includes(S.stage) && !S.debugModeActive) {
                        S.score += Game.Player.getPointsPerLevel();
                        S.scoreDisplay.textContent = S.score;
                        S.landedYLevels.add(plat.y);
                    }
                }
                if (player.dy < 0 && player.y <= (plat.y + plat.height) && (player.y - player.dy) > (plat.y + plat.height)) {
                    if (![101, 102].includes(S.stage)) { player.dy = 0; }
                    if (plat.subType === 'crumbling') { plat.isFalling = true; }
                }
            }
        }
        for (let i = S.enemies.length - 1; i >= 0; i--) {
            const enemy = S.enemies[i];
            if (!enemy) continue;
            const isColliding = player.x + player.width > enemy.x && player.x < enemy.x + enemy.width && player.y + player.height > enemy.y && player.y < enemy.y + enemy.height;
            if (isColliding) {
                if ((enemy.type === 'ICICLE' && enemy.state === 'STUCK')) {
                    if (player.dx > 0) player.x = enemy.x - player.width; else if (player.dx < 0) player.x = enemy.x + enemy.width;
                    player.dx = 0;
                    continue;
                }
                if (enemy.type === 'MIMIC_ICE' && enemy.state !== 'BREAKING') {
                    if (player.dy >= 0 && (player.y + player.height - player.dy) <= enemy.y) {
                         player.dy = 0;
                         player.onGround = true;
                         player.y = enemy.y - player.height;
                         player.standingOnPlatform = enemy;
                         if (enemy.state === 'IDLE') {
                             enemy.state = 'SHAKING';
                             enemy.shakeTimer = Game.Constants.ICE_PLATFORM_SHAKE_DURATION;
                         }
                    } else if (player.dy < 0 && (player.y - player.dy) > (enemy.y + enemy.height)) {
                        player.dy *= -0.5;
                        if (!enemy.hitCooldown) {
                            enemy.hits = (enemy.hits || 0) + 1;
                            enemy.hitCooldown = true;
                            setTimeout(() => { if(enemy) enemy.hitCooldown = false; }, 200);
                            if (enemy.hits >= 3) {
                                enemy.state = 'BREAKING';
                            }
                        }
                    }
                    continue; 
                }
                const isFrontalCollision = (player.direction === 'right' && enemy.x >= player.x) || (player.direction === 'left' && enemy.x <= player.x);
                if (player.isBlocking && isFrontalCollision) {
                    player.dx += player.direction === 'right' ? -2 : 2; player.dy = -4; player.onGround = false; 
                } else if (!player.isHit) {
                    player.hp--;
                    player.isHit = true;
                    player.hitTimer = 90;
                    player.dy = -5;
                    if (player.hp < player.maxHp) {
                        player.powerUp = null;
                        player.maxHp = 1;
                    }
                    if (player.hp <= 0 && !S.debugModeActive) {
                        S.gameOver = true;
                    }
                }
            }
        }
        for (let i = S.projectiles.length - 1; i >= 0; i--) {
            const proj = S.projectiles[i];
            if (player.x + player.width > proj.x && player.x < proj.x + proj.width && player.y + player.height > proj.y && player.y < proj.y + proj.height) {
                 const isFrontalCollision = (player.direction === 'right' && proj.dx < 0) || (player.direction === 'left' && proj.dx > 0);
                 if (player.isBlocking && isFrontalCollision) {
                     S.projectiles.splice(i, 1);
                     player.dx += player.direction === 'right' ? -2 : 2; player.dy = -4; player.onGround = false; 
                 } else if (!player.isHit) {
                    S.projectiles.splice(i, 1);
                    player.hp--;
                    player.isHit = true;
                    player.hitTimer = 90;
                    player.dy = -5;
                    if (player.hp < player.maxHp) {
                        player.powerUp = null;
                        player.maxHp = 1;
                    }
                    if (player.hp <= 0 && !S.debugModeActive) {
                        S.gameOver = true;
                    }
                 }
            }
        }
        if (player.powerUpCooldown === 0) {
            for (let i = S.powerUps.length - 1; i >= 0; i--) {
                const p = S.powerUps[i];
                if (player.x < p.x + p.width && player.x + player.width > p.x && player.y < p.y + p.height && player.y + player.height > p.y) {
                    const currentPowerUp = player.powerUp;
                    player.powerUp = p;
                    player.hp = 2;
                    player.maxHp = 2;
                    player.powerUpCooldown = 30;
                    if (currentPowerUp) {
                        S.powerUps[i] = currentPowerUp;
                        currentPowerUp.x = p.x;
                        currentPowerUp.y = p.y;
                    } else {
                        S.powerUps.splice(i, 1);
                    }
                    break;
                }
            }
        }
    }
};