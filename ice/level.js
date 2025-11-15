import { Game } from './game.js';

Game.Level = {
    parseLayoutToPlatforms: function(layout, y, type = 'normal') {
        const C = Game.Constants;
        const S = Game.State;
        let platforms = [];
        for (let i = 0; i < C.LEVEL_SLOTS; i++) {
            const char = layout[i];
            const x = i * C.BLOCK_WIDTH;
            let commonProps = { y: y, height: C.PLATFORM_HEIGHT, type: type, isFalling: false };
            
            if ((char === 'G' || char === 'C') && Math.random() < 0.15 && S.stage > 10) {
                 S.enemies.push({ 
                    type: 'MIMIC_ICE', 
                    x: x, y: y, 
                    width: C.BLOCK_WIDTH, height: C.PLATFORM_HEIGHT, 
                    hits: 0, state: 'IDLE', 
                    originalX: x, hitCooldown: false 
                });
                continue;
            }

            if (char === 'B' || char === 'I' || char === 'M') {
                let p = { ...commonProps, x: x, width: C.BLOCK_WIDTH, subType: 'normal' };
                if (char === 'I') p.subType = 'icy';
                if (char === 'M') {
                    p.subType = 'moving';
                    p.originalX = x;
                    let speedMultiplier = 0.8;
                    if (S.stage >= 21 && S.stage <= 30) {
                        speedMultiplier = 1.0 + (S.stage - 21) * 0.05;
                    } else if (S.stage > 30) {
                        speedMultiplier = 1.5;
                    }
                    p.dx = (Math.random() < 0.5 ? 1 : -1) * speedMultiplier;
                }
                platforms.push(p);
            } else if (char === 'C') {
                let crumblingProps = { ...commonProps, width: C.BLOCK_WIDTH, subType: 'crumbling' };
                platforms.push({ ...crumblingProps, x: x, id: Math.random() });
            }
        }
        return platforms;
    },
    generatePlatformRow: function(isFirstRow) {
        const C = Game.Constants;
        const S = Game.State;
        const stage = S.stage;
        let newLayout = Array(C.LEVEL_SLOTS).fill('B');
        
        if (isFirstRow) {
            const gapStart = 3 + Math.floor(Math.random() * 3);
            newLayout[gapStart] = 'G';
            newLayout[gapStart + 1] = 'G';
            return newLayout;
        }
        
        let gapProb = C.GAP_PROBABILITY + (stage * 0.005);
        let movingProb = C.MOVING_PLATFORM_PROB + (stage * 0.003);
        let icyProb = C.ICY_PLATFORM_PROB + (stage * 0.005);
        let crumblingInsteadOfGapProb = 0.5;

        if (stage >= 11 && stage <= 20) { crumblingInsteadOfGapProb = 0.75; }
        else if (stage >= 21 && stage <= 30) { movingProb += 0.2; }
        else if (stage > 30) { icyProb += 0.3; }

        const patternRoll = Math.random();
        if (patternRoll < 0.1) {
            const patterns = [['B','I','G','G','B','B','I','I','G','G'],['B','B','B','G','G','G','G','B','B','B'],['B','B','G','G','C','C','G','G','B','B']];
            return patterns[Math.floor(Math.random() * patterns.length)];
        }

        let hasPlacedGap = false;
        for (let j = 1; j < C.LEVEL_SLOTS - 1; j++) {
            if (j === 6 && !hasPlacedGap) {
                const doubleGapType = Math.random() < crumblingInsteadOfGapProb ? 'C' : 'G';
                newLayout[j] = doubleGapType; newLayout[j+1] = doubleGapType;
                j++; hasPlacedGap = true; continue;
            }

            if (!hasPlacedGap && Math.random() < gapProb && j < C.LEVEL_SLOTS - 2) {
                const doubleGapType = Math.random() < crumblingInsteadOfGapProb ? 'C' : 'G';
                newLayout[j] = doubleGapType; newLayout[j+1] = doubleGapType;
                j++; hasPlacedGap = true;
            } else {
                newLayout[j] = (Math.random() < icyProb) ? 'I' : 'B';
            }
        }
        if (!hasPlacedGap) {
            let gapStart = 3 + Math.floor(Math.random() * 3);
            const doubleGapType = Math.random() < crumblingInsteadOfGapProb ? 'C' : 'G';
            newLayout[gapStart] = doubleGapType; newLayout[gapStart + 1] = doubleGapType;
        }

        for (let j = 1; j < C.LEVEL_SLOTS - 2; j++) {
            if (newLayout[j-1] !== 'G' && newLayout[j-1] !== 'C' && newLayout[j+1] !== 'G' && newLayout[j+1] !== 'C' && Math.random() < movingProb) {
                newLayout[j-1] = 'G'; newLayout[j] = 'M'; newLayout[j+1] = 'G';
                j += 2; 
            }
        }

        if (['C', 'M', 'G'].includes(newLayout[0])) newLayout[0] = 'B';
        if (['C', 'M', 'G'].includes(newLayout[C.LEVEL_SLOTS - 1])) newLayout[C.LEVEL_SLOTS - 1] = 'B';
        for (let j = 1; j < C.LEVEL_SLOTS -1; j++) {
             if (['G', 'C'].includes(newLayout[j-1]) && !['G', 'C', 'M'].includes(newLayout[j]) && ['G', 'C'].includes(newLayout[j+1])) {
                 newLayout[j] = newLayout[j-1];
             }
        }
        
        return newLayout;
    },

    generatePlatforms: function(basePlatformsArg = null) {
        const S = Game.State;
        const C = Game.Constants;

        if ([101, 102].includes(S.stage)) {
            const canvas = S.canvas;
            S.showcaseCharacters = [];
            S.platforms = [];
            const floor = { x: 0, y: canvas.height - 40, width: canvas.width, height: 40, type: 'base' };
            S.platforms.push(floor);
            
            if (S.stage === 101) {
                const platformWidth = 110; const gapWidth = 35; const verticalGap = 130;
                let y = canvas.height - 40 - verticalGap;
                for (let i = 0; i < 3; i++) {
                    S.platforms.push({ x: 0, y: y, width: platformWidth, height: C.PLATFORM_HEIGHT });
                    S.platforms.push({ x: platformWidth + gapWidth, y: y, width: platformWidth, height: C.PLATFORM_HEIGHT });
                    S.platforms.push({ x: (platformWidth + gapWidth) * 2, y: y, width: platformWidth, height: C.PLATFORM_HEIGHT });
                    y -= verticalGap;
                }
                S.showcaseCharacters.push({ type: 'ESKIMO', x: 120, y: floor.y - S.player.height });
                S.showcaseCharacters.push({ type: 'PENGUIN', x: 180, y: floor.y - S.player.height });
                S.showcaseCharacters.push({ type: 'ESKIMO_FEMALE', x: 240, y: floor.y - S.player.height });
            } else { // Stage 102
                S.platforms.push({ x: 0, y: canvas.height - 40 - C.VERTICAL_GAP, width: canvas.width, height: C.PLATFORM_HEIGHT });
                S.platforms.push({ x: 0, y: canvas.height - 40 - (C.VERTICAL_GAP * 2), width: canvas.width, height: C.PLATFORM_HEIGHT });
            }
            S.goalPlatform = { x: -200, y: -200, width: 0, height: 0, type: 'goal' }; 
            S.platforms.push(S.goalPlatform);
            Game.Enemies.generateEnemies(); 
            Game.Level.generateDecorations();
            return;
        }

        S.platforms = [];
        let basePlatform;
        if (basePlatformsArg && basePlatformsArg.length > 0) {
            const minX = Math.min(...basePlatformsArg.map(p => p.x));
            const maxX = Math.max(...basePlatformsArg.map(p => p.x + p.width));
            basePlatform = { x: minX, y: S.canvas.height - 20, width: maxX - minX, height: C.PLATFORM_HEIGHT, type: 'base', subType: 'normal' };
        } else {
            basePlatform = { x: 0, y: S.canvas.height - 20, width: S.canvas.width, height: C.PLATFORM_HEIGHT, type: 'base', subType: 'normal' };
        }
        
        basePlatform.x -= 30;
        basePlatform.width += 60;
        S.platforms.push(basePlatform);
        
        let currentY = basePlatform.y;
        while (currentY > C.VERTICAL_GAP + 80) { 
            const newY = currentY - C.VERTICAL_GAP;
            const isFirst = (newY === basePlatform.y - C.VERTICAL_GAP);
            const newLayout = this.generatePlatformRow(isFirst);
            const newPlatforms = this.parseLayoutToPlatforms(newLayout, newY);
            
            if (newPlatforms.length > 0) {
                newPlatforms[0].x -= 30;
                newPlatforms[0].width += 30;
                newPlatforms[newPlatforms.length - 1].width += 30;
            }
            
            S.platforms.push(...newPlatforms);
            currentY = newY;
        }

        const topPlatformY = 0 - C.PLATFORM_HEIGHT / 2;
        const topLayout = Array(C.LEVEL_SLOTS).fill('G');
        const startPos = 3 + Math.floor(Math.random() * 3);
        for (let j = 0; j < 3; j++) topLayout[startPos + j] = 'B';
        const goalPlatforms = this.parseLayoutToPlatforms(topLayout, topPlatformY, 'top');
        if (goalPlatforms.length > 0) {
            S.goalPlatform = goalPlatforms.find(p => p.type === 'top') || goalPlatforms[0];
        } else {
            S.goalPlatform = {x: 150, y: topPlatformY, width: 120, height: C.PLATFORM_HEIGHT, type: 'top'};
            goalPlatforms.push(S.goalPlatform);
        }
        
        if (goalPlatforms.length > 0) {
            goalPlatforms[0].x -= 30;
            goalPlatforms[0].width += 30;
            goalPlatforms[goalPlatforms.length - 1].width += 30;
        }
        S.platforms.push(...goalPlatforms);

        Game.Enemies.generateEnemies();
        Game.Level.generateDecorations();
    },
    
    generatePowerUps: function() {
        const S = Game.State;
        S.powerUps = [];
        const spawnablePlatforms = S.platforms.filter(p => p.type === 'normal' && p.y < S.canvas.height - 100 && p.y > 100 && (p.subType === 'normal' || p.subType === 'icy'));
        if (spawnablePlatforms.length < 1) return;

        let availablePowerUps = ['HAMMER', 'SHIELD'];
        
        if (S.player.powerUp) {
            availablePowerUps = availablePowerUps.filter(type => type !== S.player.powerUp.type);
        }

        if (availablePowerUps.length === 0) return;

        const platform = spawnablePlatforms[Math.floor(Math.random() * spawnablePlatforms.length)];
        const powerUpType = availablePowerUps[Math.floor(Math.random() * availablePowerUps.length)];
        
        S.powerUps.push({
            type: powerUpType,
            x: platform.x + platform.width / 2 - 12.5,
            y: platform.y - 25,
            width: 25,
            height: 25
        });
    },

    generateDecorations: function() {
        const S = Game.State;
        S.decorations = [];
        const verticalGapShowcase = 130;
        const levelYShowcase = {
            aras2: S.canvas.height - 40 - verticalGapShowcase,
            aras3: S.canvas.height - 40 - (verticalGapShowcase * 2),
            aras4: S.canvas.height - 40 - (verticalGapShowcase * 3)
        };

        if (S.stage === 101) {
            S.platforms.forEach(p => {
                if (p.y === levelYShowcase.aras2) {
                    S.decorations.push({ type: 'ICY_GRASS', x: p.x + 20, y: p.y });
                    S.decorations.push({ type: 'SNOW_PILE', x: p.x + 70, y: p.y });
                } else if (p.y === levelYShowcase.aras3) {
                    S.decorations.push({ type: 'FROZEN_PUDDLE', x: p.x + 40, y: p.y });
                    S.decorations.push({ type: 'ICE_ROCK', x: p.x + 90, y: p.y });
                } else if (p.y === levelYShowcase.aras4) {
                    S.decorations.push({ type: 'SNOWY_TREE', x: p.x + 50, y: p.y });
                    S.decorations.push({ type: 'SIGNPOST', x: p.x + 20, y: p.y });
                }
            });
            return;
        }
        if (S.stage === 102) return;
        
        if (S.stage > 1 && S.stage % 10 === 1) {
            const startPlatform = S.platforms[0];
            const flagX = startPlatform.x + (startPlatform.width / 2) + (S.player.width);
            const flagY = startPlatform.y;
            S.decorations.push({ type: 'CHECKPOINT_FLAG', x: flagX, y: flagY });
        }

        S.platforms.forEach(p => {
            if (p !== S.platforms[0] && p !== S.goalPlatform) {
                if (p.subType !== 'normal' && p.subType !== 'icy') {
                    return;
                }
                for(let i=0; i < 3; i++) { 
                    if (Math.random() < S.decorationProbability) {
                        const sizeRoll = Math.random();
                        const decor = { type: '', x: p.x + Math.random() * (p.width - 40) + 20, y: p.y };

                        if (sizeRoll < 0.2) { decor.type = 'SNOWY_TREE'; } 
                        else if (sizeRoll < 0.5) {
                            const mediumTypeRoll = Math.random();
                            if (mediumTypeRoll < 0.33) decor.type = 'FROZEN_PUDDLE';
                            else if (mediumTypeRoll < 0.66) decor.type = 'ICE_ROCK';
                            else decor.type = 'SIGNPOST';
                        } else {
                            const smallTypeRoll = Math.random();
                            if (smallTypeRoll < 0.33) decor.type = 'SNOW_PILE';
                            else if (smallTypeRoll < 0.66) decor.type = 'ICE_SHARD';
                            else decor.type = 'ICY_GRASS';
                        }
                        
                        if (decor.type) S.decorations.push(decor);
                    }
                }
            }
        });
    }
};