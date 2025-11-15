import { Game } from './game.js';

Game.Enemies = {
    generateEnemies: function() {
        const S = Game.State;
        const C = Game.Constants;
        const stage = S.stage;
        S.enemies = [];
        S.projectiles = [];
        const platforms = S.platforms;
        const goalPlatform = S.goalPlatform;
        const spawnBuffer = 20;
        if (stage >= 101) {
            const p1 = platforms.find(p => p.y < 400 && p.x === 0);
            const p2 = platforms.find(p => p.y < 400 && p.x > 100 && p.x < 200);
            const p3 = platforms.find(p => p.y < 400 && p.x > 200);
            const p6 = platforms.find(p => p.y < 200 && p.x > 100 && p.x < 200);
            if(stage === 102) {
                const selectedEnemyType = S.testEnemyType;
                const p_mid = platforms.find(p=>p.y < 450 && p.y > 400);
                const p_top = platforms.find(p=>p.y < 300 && p.y > 200);
                if(p_mid && selectedEnemyType === 'GROUND_MONSTER') S.enemies.push({ type: 'GROUND_MONSTER', width: 25, height: 25, x: p_mid.x + (p_mid.width/2) - 12.5, y: p_mid.y - 25, dx: S.enemySpeed, platform: p_mid, isTurning: false, animationTick: 0, facing: 'right' });
                if(p_mid && selectedEnemyType === 'AWAN_HANTU') { const baseX = p_mid.x + (p_mid.width/2) - 17.5; const baseY = p_mid.y - 40; S.enemies.push({ type: 'AWAN_HANTU', width: 35, height: 25, x: baseX, y: baseY, originalX: baseX, originalY: baseY, baseY: baseY, dx: 0, platform: p_mid, animationAngle: 0, eyeAngle: 0, state: 'SCANNING' });}
                if(p_top && selectedEnemyType === 'ICICLE') S.enemies.push({ type: 'ICICLE', width: 15, height: 30, x: p_top.x + (p_top.width/2), y: p_top.y + C.PLATFORM_HEIGHT, originalX: p_top.x + (p_top.width/2), originalY: p_top.y + C.PLATFORM_HEIGHT, state: 'IDLE' });
                if(p_top && selectedEnemyType === 'BAT') S.enemies.push({type: 'BAT', width: 30, height: 20, x: p_top.x + (p_top.width/2), y: p_top.y + C.PLATFORM_HEIGHT, originalX: p_top.x + (p_top.width/2), originalY: p_top.y + C.PLATFORM_HEIGHT, state: 'HANGING' });
                return;
            }
            if(p1) S.enemies.push({ type: 'GROUND_MONSTER', width: 25, height: 25, x: p1.x + (p1.width / 2) - 12.5, y: p1.y - 25, dx: 0, platform: p1, isTurning: false, animationTick: 0, facing: 'right', animationTimer: 0 });
            if(p2) { const baseX = p2.x + (p2.width / 2) - 17.5; const baseY = p2.y - 40; S.enemies.push({ type: 'AWAN_HANTU', width: 35, height: 25, x: baseX, y: baseY, originalX: baseX, originalY: baseY, baseY: baseY, dx: 0, platform: p2, animationAngle: Math.random() * Math.PI * 2, eyeAngle: 0, state: 'SCANNING' }); }
            if(p3) { const icicleX = p3.x + (p3.width / 2); const icicleY = p3.y + C.PLATFORM_HEIGHT; S.enemies.push({ type: 'ICICLE', width: 15, height: 30, x: icicleX, y: icicleY, originalX: icicleX, originalY: icicleY, state: 'IDLE' }); }
            if(p6) { const batX = p6.x + (p6.width / 2); const batY = p6.y + C.PLATFORM_HEIGHT; S.enemies.push({type: 'BAT', width: 30, height: 20, x: batX, y: batY, originalX: batX, originalY: batY, state: 'HANGING' }); }
            return; 
        }
        const spawnablePlatforms = platforms.filter(p => p.type !== 'base' && p.type !== 'top' && p !== goalPlatform && (p.subType === 'normal' || p.subType === 'icy'));
        if (spawnablePlatforms.length === 0) return;
        const lowerTierPlatforms = spawnablePlatforms.filter(p => p.y > 100);
        let numEnemies = stage >= 15 ? 3 : stage >= 7 ? 2 : stage >= 3 ? 1 : 0;
        if (numEnemies > 0 && lowerTierPlatforms.length > 0) {
            const platformYLevels = [...new Set(lowerTierPlatforms.map(p => p.y))];
            const shuffledYLevels = platformYLevels.sort(() => 0.5 - Math.random());
            const selectedYLevels = shuffledYLevels.slice(0, numEnemies);
            for (const yLevel of selectedYLevels) {
                const platformsAtLevel = lowerTierPlatforms.filter(p => p.y === yLevel);
                const platform = platformsAtLevel[Math.floor(Math.random() * platformsAtLevel.length)];
                const minSpawnX = Math.max(spawnBuffer, platform.x);
                const maxSpawnX = Math.min(S.canvas.width - spawnBuffer - 25, platform.x + platform.width - 25);
                if (maxSpawnX > minSpawnX) {
                    const spawnX = minSpawnX + Math.random() * (maxSpawnX - minSpawnX);
                    const initialDirection = Math.random() < 0.5 ? 1 : -1;
                    const monster = { type: 'GROUND_MONSTER', width: 25, height: 25, x: spawnX, y: platform.y - 25, dx: S.enemySpeed * initialDirection, platform: platform, isTurning: false, animationTick: 0, facing: initialDirection > 0 ? 'right' : 'left' };
                    if (stage >= 20) { monster.attackCooldown = (stage > 30) ? (90 + Math.random() * 40) : (120 + Math.random() * 60); monster.isAttacking = false; }
                    S.enemies.push(monster);
                }
            }
        }
        let awanHantuChance = (stage > 0 && stage % 10 === 0) ? 1.0 : (stage >= 21) ? 0.25 : 0;
        if (Math.random() < awanHantuChance && platforms.length > 5) {
            const topTierPlatforms = platforms.filter(p => p.y < 200 && p.type !== 'top' && (p.subType === 'normal' || p.subType === 'icy'));
            if (topTierPlatforms.length > 0) {
                const platform = topTierPlatforms[Math.floor(Math.random() * topTierPlatforms.length)];
                const baseX = platform.x + (platform.width / 2) - 17.5; const baseY = platform.y - 40;
                S.enemies.push({ type: 'AWAN_HANTU', width: 35, height: 25, x: baseX, y: baseY, originalX: baseX, originalY: baseY, baseY: baseY, dx: 0, platform: platform, animationAngle: Math.random() * Math.PI * 2, eyeAngle: 0, state: 'SCANNING' });
            }
        }
        if (stage >= 5) {
            const spawnChance = 0.05 + (stage - 5) * 0.002;
            spawnablePlatforms.forEach(platform => {
                if (platform.y > 50 && platform.y < S.canvas.height - 150 && Math.random() < spawnChance) {
                    if(S.lastHangingEnemyType === 'BAT') {
                        const minX = Math.max(spawnBuffer, platform.x);
                        const maxX = Math.min(S.canvas.width - spawnBuffer - 15, platform.x + platform.width - 15);
                        if (maxX > minX) {
                            const icicleX = minX + Math.random() * (maxX - minX);
                            S.enemies.push({ type: 'ICICLE', width: 15, height: 30, x: icicleX, y: platform.y + C.PLATFORM_HEIGHT, originalX: icicleX, originalY: platform.y + C.PLATFORM_HEIGHT, state: 'IDLE' });
                            S.lastHangingEnemyType = 'ICICLE';
                        }
                    } else {
                        const minX = Math.max(spawnBuffer, platform.x);
                        const maxX = Math.min(S.canvas.width - spawnBuffer - 30, platform.x + platform.width - 30);
                          if (maxX > minX) {
                            const batX = minX + Math.random() * (maxX - minX);
                            S.enemies.push({type: 'BAT', width: 30, height: 20, x: batX, y: platform.y + C.PLATFORM_HEIGHT, originalX: batX, originalY: platform.y + C.PLATFORM_HEIGHT, state: 'HANGING' });
                            S.lastHangingEnemyType = 'BAT';
                          }
                    }
                }
            });
        }
    },
    updateEnemies: function() {
        const C = Game.Constants; 
        const S = Game.State;
        for (let i = S.enemies.length - 1; i >= 0; i--) {
            const enemy = S.enemies[i];
            if (!enemy) continue;
            if (enemy.type.includes('GROUND_MONSTER')) { 
                if (!enemy.isAttacking && !enemy.isTurning && enemy.dx !== 0) { 
                    let shouldTurn = false;
                    const nextX = enemy.x + enemy.dx;
                    if (nextX <= 0 || nextX + enemy.width >= S.canvas.width) {
                        shouldTurn = true;
                    }
                    if (!shouldTurn) {
                        for (const other of S.enemies) {
                            if (other.type === 'ICICLE' && other.state === 'STUCK') {
                                if (nextX < other.x + other.width && nextX + enemy.width > other.x &&
                                    enemy.y < other.y + other.height && enemy.y + enemy.height > other.y) {
                                    shouldTurn = true;
                                    break;
                                }
                            }
                        }
                    }
                    if (!shouldTurn && S.player.isBlocking) {
                        const playerIsFacingEnemy = (S.player.direction === 'right' && enemy.x > S.player.x) || (S.player.direction === 'left' && enemy.x < S.player.x);
                        if (playerIsFacingEnemy) {
                            if (nextX < S.player.x + S.player.width &&
                                nextX + enemy.width > S.player.x &&
                                enemy.y < S.player.y + S.player.height &&
                                enemy.y + enemy.height > S.player.y)
                            {
                                shouldTurn = true;
                            }
                        }
                    }
                    if (!shouldTurn) {
                        const probeX = enemy.dx > 0 ? nextX + enemy.width : nextX;
                        const probeY = enemy.y + enemy.height + 5;
                        const groundExists = S.platforms.some(p => 
                            !p.isFalling && 
                            probeX >= p.x && 
                            probeX < (p.x + p.width) &&
                            probeY > p.y &&
                            probeY < (p.y + p.height + 10)
                        );
                        if (!groundExists) {
                            shouldTurn = true;
                        }
                    }
                    if (shouldTurn) {
                        enemy.isTurning = true;
                        enemy.facing = enemy.dx > 0 ? 'left' : 'right';
                        enemy.dx = 0;
                        setTimeout(() => {
                            if (enemy) {
                                enemy.dx = enemy.facing === 'right' ? S.enemySpeed : -S.enemySpeed;
                                enemy.isTurning = false;
                            }
                        }, C.ENEMY_TURN_DELAY);
                    } else {
                        enemy.x = nextX;
                        enemy.animationTick++;
                    }
                }
                if (enemy.isAttacking && (S.stage < 20 && S.stage !== 102)) {
                    enemy.isAttacking = false; 
                    enemy.dx = enemy.facing === 'right' ? S.enemySpeed : -S.enemySpeed;
                }
                const distanceToPlayer = Math.abs((S.player.x + S.player.width / 2) - (enemy.x + enemy.width / 2));
                const onSamePlatform = S.player.standingOnPlatform === enemy.platform;
                const isPlayerInFront = (enemy.facing === 'right' && S.player.x > enemy.x) || (enemy.facing === 'left' && S.player.x < enemy.x);
                if ((S.stage >= 20 || S.stage === 102) && onSamePlatform && isPlayerInFront && distanceToPlayer < C.GROUND_MONSTER_ATTACK_RANGE) {
                    if (!enemy.isAttacking) {
                        enemy.isAttacking = true;
                        enemy.dx = 0;
                    }
                    if (enemy.attackCooldown > 0) enemy.attackCooldown--;
                    if (enemy.attackCooldown <= 0) {
                        const projectileX = enemy.facing === 'right' ? enemy.x + enemy.width : enemy.x;
                        const projectileY = enemy.y + 17;
                        const projectileDX = enemy.facing === 'right' ? 4 : -4;
                        S.projectiles.push({ x: projectileX, y: projectileY, dx: projectileDX, width: 8, height: 8 });
                        enemy.attackCooldown = 120;
                    }
                } else {
                    if(enemy.isAttacking) {
                        enemy.isAttacking = false;
                        enemy.dx = enemy.facing === 'right' ? S.enemySpeed : -S.enemySpeed;
                    }
                }
            } else if (enemy.type.includes('AWAN_HANTU')) { 
                const isBoss = enemy.type.includes('BOSS_');
                switch (enemy.state) { 
                    case 'SCANNING': 
                        enemy.animationAngle += 0.05; 
                        enemy.y = enemy.baseY + Math.sin(enemy.animationAngle) * 5; 
                        enemy.eyeAngle += 0.03; 
                        const detectionRangeX = C.AWAN_HANTU_DETECTION_X_BASE + (isBoss ? 50 : (Math.floor(S.stage / 10) - 1) * 10);
                        const playerDistX = Math.abs((S.player.x + S.player.width/2) - (enemy.x + enemy.width/2)); 
                        const playerDistY = Math.abs(S.player.y - enemy.y); 
                        const eyeDirection = Math.sin(enemy.eyeAngle); 
                        if (playerDistX < detectionRangeX && playerDistY < C.AWAN_HANTU_DETECTION_Y) { 
                            const isPlayerRight = S.player.x > enemy.x; 
                            if ((isPlayerRight && eyeDirection > 0.3) || (!isPlayerRight && eyeDirection < -0.3)) { 
                                enemy.state = 'PAUSING'; 
                                enemy.detectionTimer = C.AWAN_HANTU_PAUSE_DURATION; 
                                const dashOvershoot = isBoss ? 50 : 0;
                                enemy.dashTargetX = S.player.x + (isPlayerRight ? dashOvershoot : -dashOvershoot);
                            } 
                        } 
                        break; 
                    case 'PAUSING': enemy.detectionTimer--; if (enemy.detectionTimer <= 0) { enemy.state = 'DASHING'; } break; 
                    case 'DASHING': const directionToTarget = Math.sign(enemy.dashTargetX - enemy.x); enemy.x += directionToTarget * C.AWAN_HANTU_DASH_SPEED; if (Math.abs(enemy.x - enemy.dashTargetX) < C.AWAN_HANTU_DASH_SPEED) { enemy.x = enemy.dashTargetX; enemy.state = 'RETURNING'; } break; 
                    case 'RETURNING': const directionToHome = Math.sign(enemy.originalX - enemy.x); enemy.x += directionToHome * (C.AWAN_HANTU_DASH_SPEED / 2); if (Math.abs(enemy.x - enemy.originalX) < (C.AWAN_HANTU_DASH_SPEED / 2)) { enemy.x = enemy.originalX; enemy.state = 'SCANNING'; } break; 
                } 
            } else if (enemy.type.includes('ICICLE')) {
                if (enemy.state === 'STUCK' && enemy.platform && enemy.platform.subType === 'moving') {
                    enemy.x += enemy.platform.dx;
                }
                switch (enemy.state) {
                    case 'IDLE':
                        if (S.stage === 101 || S.stage === 102) {
                            if(!enemy.resetTimer) enemy.resetTimer = 180;
                            enemy.resetTimer--;
                            if(enemy.resetTimer <= 0) {
                                enemy.state = 'SHAKING';
                                enemy.shakeTimer = C.ICICLE_SHAKE_DURATION;
                                delete enemy.resetTimer;
                            }
                        } else if (S.player.onGround && S.player.standingOnPlatform) {
                            const yDist = S.player.standingOnPlatform.y - (enemy.y - C.PLATFORM_HEIGHT);
                            const xDist = Math.abs((S.player.x + S.player.width/2) - (enemy.x + enemy.width/2));
                            if (Math.abs(yDist - C.VERTICAL_GAP) < 10 && xDist < C.ICICLE_DETECTION_RANGE) {
                                enemy.state = 'SHAKING';
                                enemy.shakeTimer = C.ICICLE_SHAKE_DURATION;
                            }
                        }
                        break;
                    case 'SHAKING':
                        enemy.shakeTimer--;
                        enemy.x = enemy.originalX + Math.sin(S.globalAnimationTick * 0.8) * 2;
                        if (enemy.shakeTimer <= 0) { enemy.state = 'FALLING'; enemy.platform = null; }
                        break;
                    case 'FALLING':
                        enemy.y += C.ICICLE_FALL_SPEED;
                        for (const p of S.platforms) {
                            if (p.isFalling) continue;
                            const tipY = enemy.y + enemy.height;
                            if (tipY >= p.y && tipY - C.ICICLE_FALL_SPEED < p.y && enemy.x > p.x && enemy.x < p.x + p.width)
                            {
                                enemy.y = p.y - enemy.height + 8;
                                enemy.state = 'STUCK';
                                enemy.platform = p; // Attach to new platform
                                break; 
                            }
                        }
                        if (enemy.y > S.canvas.height) {
                            S.enemies.splice(i, 1);
                        }
                        break;
                    case 'STUCK': break;
                   }
            } else if (enemy.type.includes('BAT')) { 
                const isBoss = enemy.type.includes('BOSS_');
                const currentFlightRange = isBoss ? C.BAT_FLIGHT_RANGE * 1.5 : C.BAT_FLIGHT_RANGE;
                const xDist = Math.abs((S.player.x + S.player.width/2) - (enemy.x + enemy.width/2));
                const yDist = S.player.y - enemy.y;
                const isPlayerBelow = yDist > 0;
                const playerInDetectionRange = isPlayerBelow && yDist < C.BAT_DETECTION_RANGE_Y && xDist < C.BAT_DETECTION_RANGE_X;
                switch(enemy.state) {
                    case 'HANGING': if (playerInDetectionRange) { enemy.state = 'DETECTED'; } break;
                    case 'DETECTED': if (playerInDetectionRange && xDist < C.BAT_ATTACK_RANGE_X) { enemy.state = 'WAKING'; enemy.wakeTimer = C.BAT_WAKE_DURATION; } else if (!playerInDetectionRange) { enemy.state = 'HANGING'; } break;
                    case 'WAKING': enemy.wakeTimer--; if(enemy.wakeTimer <= 0) { enemy.state = 'FLYING_DIP'; enemy.targetY = enemy.originalY + C.BAT_DIP_HEIGHT; enemy.dx = (S.player.x < enemy.x) ? -C.BAT_FLIGHT_SPEED : C.BAT_FLIGHT_SPEED; } break;
                    case 'FLYING_DIP': enemy.y += (enemy.targetY - enemy.y) * 0.1; enemy.x += enemy.dx; if (Math.abs(enemy.y - enemy.targetY) < 1) { enemy.state = 'ASCENDING'; enemy.targetY = enemy.originalY + C.BAT_FLIGHT_HEIGHT; } break;
                    case 'ASCENDING': enemy.y += (enemy.targetY - enemy.y) * 0.1; enemy.x += enemy.dx; if (Math.abs(enemy.y - enemy.targetY) < 1) { enemy.state = 'FLYING'; } if (enemy.x <= enemy.originalX - currentFlightRange || enemy.x >= enemy.originalX + currentFlightRange) { enemy.dx *= -1; } break;
                    case 'FLYING':
                        if (!enemy.dx) { enemy.dx = C.BAT_FLIGHT_SPEED; }
                        enemy.x += enemy.dx;
                        if (enemy.x <= enemy.originalX - currentFlightRange || enemy.x >= enemy.originalX + currentFlightRange) {
                            enemy.dx *= -1;
                        }
                        if (!playerInDetectionRange) {
                            if (enemy.patrolEndTimer == null) { enemy.patrolEndTimer = C.BAT_PATROL_END_DELAY; }
                            enemy.patrolEndTimer--;
                            if (enemy.patrolEndTimer <= 0) {
                                enemy.state = 'RETURNING_HOME';
                                delete enemy.patrolEndTimer;
                            }
                        } else {
                            if (enemy.patrolEndTimer != null) { delete enemy.patrolEndTimer; }
                        }
                        break;
                    case 'RETURNING_HOME': const distToHome = Math.hypot(enemy.x - enemy.originalX, enemy.y - enemy.originalY); if (distToHome < C.BAT_FLIGHT_SPEED * 2) { enemy.x = enemy.originalX; enemy.y = enemy.originalY; enemy.state = 'HANGING'; } else { const dirX = Math.sign(enemy.originalX - enemy.x); const dirY = Math.sign(enemy.originalY - enemy.y); enemy.x += dirX * C.BAT_FLIGHT_SPEED; enemy.y += dirY * C.BAT_FLIGHT_SPEED; } break;
                } 
            } else if (enemy.type === 'MIMIC_ICE') {
                if (enemy.state === 'SHAKING') {
                    enemy.shakeTimer--;
                    if (enemy.shakeTimer <= 0) {
                        enemy.state = 'BREAKING';
                    }
                } else if (enemy.state === 'BREAKING') {
                    const shardCount = 5;
                    const shardWidth = enemy.width / shardCount;
                    for (let j = 0; j < shardCount; j++) {
                        S.enemies.push({
                            type: 'ICE_SHARD',
                            x: enemy.x + (j * shardWidth), y: enemy.y,
                            width: shardWidth, height: C.PLATFORM_HEIGHT,
                            dx: (Math.random() - 0.5) * 2, dy: Math.random() * -2,
                            lifetime: C.ICE_SHARD_LIFETIME
                        });
                    }
                    S.enemies.splice(i, 1);
                }
            } else if (enemy.type === 'ICE_SHARD') {
                enemy.dy += C.GRAVITY * 0.5;
                enemy.x += enemy.dx;
                enemy.y += enemy.dy;
                enemy.lifetime--;
                if (enemy.lifetime <= 0) {
                    S.enemies.splice(i, 1);
                }
            }
        }
    },
    updateProjectiles: function() {
        const S = Game.State;
        for (let i = S.projectiles.length - 1; i >= 0; i--) {
            const p = S.projectiles[i];
            p.x += p.dx;
            if (p.x < 0 || p.x > S.canvas.width) {
                S.projectiles.splice(i, 1);
            }
        }
    }
};