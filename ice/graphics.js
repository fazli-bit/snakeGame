import { Game } from './game.js';

Game.Graphics = {
    updateHpDisplay: function() {
        const S = Game.State;
        if(S.debugModeActive) {
            S.hpDisplay.innerHTML = `HP: ${S.player.hp}`;
            return;
        }
        let hearts = '';
        for(let i=0; i < S.player.hp; i++) {
            hearts += '❤️';
        }
        S.hpDisplay.innerHTML = hearts;
    },

    draw: function() {
        this.drawBackground();
        Game.State.platforms.forEach(p => {
            const ctx = Game.State.ctx;
            let shakeX = 0;
            if(p === Game.State.crumblingPlatformCandidate && !p.isFalling) {
                 shakeX = Math.sin(Game.State.globalAnimationTick * 0.8) * 1.5;
            }

            switch(p.subType) {
                case 'icy': ctx.fillStyle = '#A8D8F0'; break;
                case 'moving': ctx.fillStyle = '#B2B2B2'; break;
                case 'crumbling':
                    ctx.fillStyle = '#E0E0E0';
                    ctx.fillRect(p.x + shakeX, p.y, p.width, p.height);
                    return;
                default:
                    if (p.type === 'base') ctx.fillStyle = '#CCCCCC';
                    else if (p.type === 'top' || p === Game.State.goalPlatform) ctx.fillStyle = '#FFD700';
                    else ctx.fillStyle = '#FFFFFF';
            }
            ctx.fillRect(p.x, p.y, p.width, p.height);
        });
        this.drawDecorations(); 
        this.drawPowerUps();
        this.drawProjectiles(); 
        this.drawEnemies(); 
        this.drawPlayer(); 
        this.drawShowcaseCharacters();
    },
    
    drawCharacter: function(charType, x, y, isCrouching, targetCtx = Game.State.ctx, playerState = Game.State.player) {
        const player = playerState;
        if (player.isHit && Math.floor(Game.State.globalAnimationTick / 4) % 2 === 0) {
            return;
        }
        
        const showHeldItem = player.powerUp && !player.isAttacking && !player.isBlocking;

        if (showHeldItem) {
            const itemX = x + player.width / 2;
            const itemY = y + player.height / 2 - 5;
            targetCtx.save();
            targetCtx.translate(itemX, itemY);
            if (player.powerUp.type === 'HAMMER') {
                targetCtx.rotate(-Math.PI / 6); this.drawHammer(-12.5, -15, targetCtx);
            } else if (player.powerUp.type === 'SHIELD') {
                targetCtx.rotate(Math.PI / 8); this.drawShieldFrontView(-12.5, -15, targetCtx);
            }
            targetCtx.restore();
        }
        
        let heightModifier = isCrouching ? 6 : 0; let yOffset = isCrouching ? 6 : 0;
        switch (charType) {
            case 'ESKIMO':
                targetCtx.fillStyle = '#8B4513'; targetCtx.fillRect(x + 2, y + yOffset, player.width - 4, player.height - 2 - heightModifier);
                targetCtx.fillStyle = '#4682B4'; targetCtx.fillRect(x, y + player.height - 8, player.width, 5);
                targetCtx.fillStyle = '#FFDAB9'; targetCtx.fillRect(x + 7, y + 5 + yOffset, player.width - 14, 12 - heightModifier);
                targetCtx.fillStyle = '#000000'; targetCtx.fillRect(x + 10, y + 10 + yOffset, 3, 3); targetCtx.fillRect(x + 17, y + 10 + yOffset, 3, 3);
                if (!isCrouching) { targetCtx.fillStyle = '#8B4513'; const armY = y + 15; const animOffset = (player.onGround && player.dx !== 0) ? Math.sin(Game.State.globalAnimationTick * 0.2) * 3 : 0; targetCtx.fillRect(x - 2, armY + animOffset, 4, 8); targetCtx.fillRect(x + player.width - 2, armY - animOffset, 4, 8); }
                const legY = y + player.height - 2; targetCtx.fillRect(x + 5, legY, 8, 5); targetCtx.fillRect(x + player.width - 13, legY, 8, 5);
                break;
            case 'ESKIMO_FEMALE':
                targetCtx.fillStyle = '#DA70D6'; targetCtx.fillRect(x + 2, y + yOffset, player.width - 4, player.height - 2 - heightModifier);
                targetCtx.fillStyle = '#FF69B4'; targetCtx.fillRect(x, y + player.height - 8, player.width, 5);
                targetCtx.fillStyle = '#FFDAB9'; targetCtx.fillRect(x + 7, y + 5 + yOffset, player.width - 14, 12 - heightModifier);
                targetCtx.fillStyle = '#000000'; targetCtx.fillRect(x + 10, y + 10 + yOffset, 3, 4); targetCtx.fillRect(x + 17, y + 10 + yOffset, 3, 4);
                if (!isCrouching) { targetCtx.fillStyle = '#DA70D6'; const armY_f = y + 15; const animOffset_f = (player.onGround && player.dx !== 0) ? Math.sin(Game.State.globalAnimationTick * 0.2) * 3 : 0; targetCtx.fillRect(x - 2, armY_f + animOffset_f, 4, 8); targetCtx.fillRect(x + player.width - 2, armY_f - animOffset_f, 4, 8); }
                const legY_f = y + player.height - 2; targetCtx.fillRect(x + 5, legY_f, 8, 5); targetCtx.fillRect(x + player.width - 13, legY_f, 8, 5);
                break;
            case 'PENGUIN':
                const centerX = x + player.width / 2; const legState = (player.onGround && player.dx !== 0) ? Math.floor(Game.State.globalAnimationTick / 8) % 2 : 0;
                targetCtx.fillStyle = '#000000'; targetCtx.beginPath(); targetCtx.ellipse(centerX, y + 15 + yOffset/2, 15, 14 - heightModifier/2, 0, 0, Math.PI * 2); targetCtx.fill();
                targetCtx.fillStyle = '#FFFFFF'; targetCtx.beginPath(); targetCtx.ellipse(centerX, y + 17 + yOffset/2, 8, 10 - heightModifier/2, 0, 0, Math.PI * 2); targetCtx.fill();
                if (!isCrouching) { targetCtx.fillStyle = '#000000'; targetCtx.beginPath(); targetCtx.moveTo(x + 2, y + 10); targetCtx.lineTo(x - 3, y + 20); targetCtx.lineTo(x + 4, y + 22); targetCtx.closePath(); targetCtx.fill(); targetCtx.beginPath(); targetCtx.moveTo(x + player.width - 2, y + 10); targetCtx.lineTo(x + player.width + 3, y + 20); targetCtx.lineTo(x + player.width - 4, y + 22); targetCtx.closePath(); targetCtx.fill(); }
                targetCtx.fillStyle = '#FFA500'; targetCtx.beginPath(); targetCtx.moveTo(centerX, y + 12 + yOffset); targetCtx.lineTo(centerX + 5, y + 15 + yOffset); targetCtx.lineTo(centerX, y + 18 + yOffset); targetCtx.fill();
                targetCtx.fillStyle = '#FFFFFF'; targetCtx.fillRect(x + 8, y + 8 + yOffset, 5, 5); targetCtx.fillRect(x + 17, y + 8 + yOffset, 5, 5);
                targetCtx.fillStyle = '#000000'; targetCtx.fillRect(x + 10, y + 10 + yOffset, 2, 2); targetCtx.fillRect(x + 19, y + 10 + yOffset, 2, 2);
                targetCtx.fillStyle = '#FFA500'; if (legState === 0 || isCrouching) { targetCtx.fillRect(x + 7, y + player.height - 2, 8, 5); targetCtx.fillRect(x + 15, y + player.height - 2, 8, 5); } else { targetCtx.fillRect(x + 10, y + player.height - 2, 8, 5); targetCtx.fillRect(x + 12, y + player.height - 4, 8, 5); }
                break;
             case 'YETI':
                const tick = Game.State.globalAnimationTick;
                const yetiSway = Math.sin(tick * 0.1) * 2;
                const yetiCenterX = x + player.width / 2 + yetiSway;
                targetCtx.fillStyle = '#f0f8ff'; targetCtx.beginPath(); targetCtx.ellipse(yetiCenterX, y + 17, 15, 13, 0, 0, Math.PI * 2); targetCtx.fill();
                targetCtx.fillStyle = '#d1e0e0'; targetCtx.beginPath(); targetCtx.ellipse(yetiCenterX, y + 15, 10, 8, 0, 0, Math.PI * 2); targetCtx.fill();
                targetCtx.fillStyle = '#333'; targetCtx.fillRect(yetiCenterX - 6, y + 12, 3, 3); targetCtx.fillRect(yetiCenterX + 3, y + 12, 3, 3);
                targetCtx.fillStyle = '#c0c0c0'; targetCtx.fillRect(yetiCenterX - 8, y, 4, 4); targetCtx.fillRect(yetiCenterX + 4, y, 4, 4);
                const armSway = Math.sin(tick * 0.15) * 4;
                targetCtx.fillStyle = '#f0f8ff';
                targetCtx.beginPath(); targetCtx.ellipse(x - 2, y + 20 + armSway, 5, 8, 0, 0, Math.PI * 2); targetCtx.fill();
                targetCtx.beginPath(); targetCtx.ellipse(x + player.width + 2, y + 20 - armSway, 5, 8, 0, 0, Math.PI * 2); targetCtx.fill();
                break;
            case 'POLAR_BEAR_CUB':
                const bearCenterX = x + player.width / 2;
                const animFrame = Math.floor(Game.State.globalAnimationTick / 15) % 2;
                targetCtx.fillStyle = '#ffffff'; targetCtx.beginPath(); targetCtx.ellipse(bearCenterX, y + 20, 15, 10, 0, 0, Math.PI * 2); targetCtx.fill();
                targetCtx.beginPath(); targetCtx.arc(bearCenterX, y + 12, 12, 0, Math.PI * 2); targetCtx.fill();
                targetCtx.fillStyle = '#e0e0e0'; targetCtx.beginPath(); targetCtx.ellipse(bearCenterX, y + 15, 6, 4, 0, 0, Math.PI * 2); targetCtx.fill();
                targetCtx.fillStyle = '#333'; targetCtx.fillRect(bearCenterX - 1, y + 14, 2, 2);
                targetCtx.fillRect(bearCenterX - 6, y + 8, 3, 3); targetCtx.fillRect(bearCenterX + 3, y + 8, 3, 3);
                targetCtx.fillStyle = '#ffffff'; targetCtx.beginPath(); targetCtx.arc(bearCenterX - 10, y + 4, 4, 0, Math.PI * 2); targetCtx.fill();
                targetCtx.beginPath(); targetCtx.arc(bearCenterX + 10, y + 4, 4, 0, Math.PI * 2); targetCtx.fill();
                const legYpos = y + 28;
                if (animFrame === 0) {
                    targetCtx.fillRect(bearCenterX - 10, legYpos, 6, 4); targetCtx.fillRect(bearCenterX + 4, legYpos + 2, 6, 4);
                } else {
                    targetCtx.fillRect(bearCenterX - 10, legYpos + 2, 6, 4); targetCtx.fillRect(bearCenterX + 4, legYpos, 6, 4);
                }
                break;
        }

        if (player.isBlocking) {
            const shieldX = player.direction === 'right' ? x + player.width - 4 : x;
            this.drawShieldSideView(shieldX, y + 2, targetCtx);
        } else if (player.isAttacking) {
            const armY = y + 15;
            const pivotX = player.direction === 'right' ? x + player.width - 2 : x + 2;
            const pivotY = armY;
            targetCtx.save();
            targetCtx.translate(pivotX, pivotY);
            const swingProgress = (30 - player.attackTimer) / 30;
            const swingAngle = Math.sin(swingProgress * Math.PI) * (Math.PI / 1.5);
            targetCtx.rotate(player.direction === 'right' ? swingAngle : -swingAngle);
            this.drawHammer(-12.5, -25, targetCtx);
            targetCtx.restore();
        }
    },
    drawPlayer: function() { if (Game.State.stage !== 101) this.drawCharacter(Game.State.selectedCharacter, Game.State.player.x, Game.State.player.y, Game.State.player.isCrouching, Game.State.ctx, Game.State.player); },
    drawShowcaseCharacters: function() { if (Game.State.stage === 101) Game.State.showcaseCharacters.forEach(char => this.drawCharacter(char.type, char.x, char.y, false, Game.State.ctx, {})); },
    drawBackground: function() {
        const S = Game.State, ctx = S.ctx, canvas = S.canvas;
        const stage = S.stage;
        let skyColor0 = '#0c1445', skyColor1 = '#346888';
        let mount1Color = '#1e2d40', mount2Color = '#15202e', mount3Color = '#0d1520';
        if (stage >= 11 && stage <= 20) { skyColor0 = '#1c1445'; skyColor1 = '#433488'; mount1Color = '#2d1e40'; mount2Color = '#20152e'; mount3Color = '#150d20'; }
        else if (stage >= 21 && stage <= 30) { skyColor0 = '#607D8B'; skyColor1 = '#B0BEC5'; mount1Color = '#78909C'; mount2Color = '#546E7A'; mount3Color = '#37474F'; }
        else if (stage > 30) { skyColor0 = '#023047'; skyColor1 = '#0288D1'; mount1Color = '#01579B'; mount2Color = '#014073'; mount3Color = '#002340'; }
        const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
        sky.addColorStop(0, skyColor0); sky.addColorStop(1, skyColor1);
        ctx.fillStyle = sky; ctx.fillRect(0, 0, canvas.width, canvas.height);
        if(stage >= 20 || [101, 102].includes(stage)) { ctx.fillStyle = '#f0f0d0'; ctx.beginPath(); ctx.arc(320, 100, 30, 0, Math.PI * 2); ctx.fill(); }
        const m_y = { m1: [[250, 450], [150, 350], [220, 420], [120, 320], [250, 450], [200, 400]], m2: [[300, 500], [250, 450], [320, 520], [260, 460], [300, 500], [280, 480]], m3: [[400, 600], [380, 580], [410, 610], [370, 570], [420, 620], [390, 590]] }; 
        function lerp(start, end, amt) { return (1 - amt) * start + amt * end; } 
        const progressFactor = ([101, 102].includes(stage)) ? 1 : Math.min(1, (stage - 1) / 89);
        function drawMount(color, points, y_data) { ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, canvas.height); points.forEach((p, i) => ctx.lineTo(p, lerp(y_data[i][0], y_data[i][1], progressFactor))); ctx.lineTo(canvas.width, canvas.height); ctx.closePath(); ctx.fill(); } 
        drawMount(mount1Color, [0, 80, 150, 220, 300, canvas.width], m_y.m1); 
        drawMount(mount2Color, [50, 120, 200, 280, 350, canvas.width], m_y.m2); 
        drawMount(mount3Color, [30, 100, 180, 260, 330, canvas.width], m_y.m3);
    },
    drawEnemies: function() { Game.State.enemies.forEach(e => { if (e.type.includes('GROUND_MONSTER')) this.drawGroundMonster(e); else if (e.type.includes('AWAN_HANTU')) this.drawAwanHantu(e); else if (e.type.includes('ICICLE')) this.drawIcicle(e); else if (e.type.includes('BAT')) this.drawBat(e); else if (e.type === 'MIMIC_ICE') this.drawMimicIce(e); else if (e.type === 'ICE_SHARD') this.drawIceShard(e); }); },
    drawGroundMonster: function(e) {
        const ctx = Game.State.ctx;
        ctx.fillStyle = '#ff80ed';
        ctx.fillRect(e.x + (e.width * 0.08), e.y, e.width * 0.84, e.height - (e.height * 0.08));
        ctx.fillStyle = '#000000';
        const eyeSize = e.width * 0.2;
        const eyeY = e.y + e.height * 0.28;
        let eyeX = (e.facing === 'right') ? e.x + e.width - eyeSize - (e.width * 0.24) : e.x + (e.width * 0.24);
        ctx.fillRect(eyeX, eyeY, eyeSize, eyeSize);
        const mouthY = e.y + e.height * 0.6;
        const mouthWidth = e.width * 0.4;
        let mouthX = (e.facing === 'right') ? e.x + e.width - mouthWidth - (e.width * 0.08) : e.x + (e.width * 0.08);
        if (e.isAttacking) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(mouthX - 2, mouthY - 2, mouthWidth + 4, e.height * 0.32);
        } else {
            ctx.fillStyle = '#000000';
            ctx.fillRect(mouthX, mouthY, mouthWidth, e.height * 0.16);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(mouthX + (mouthWidth * 0.1), mouthY, mouthWidth * 0.2, e.height * 0.08);
            ctx.fillRect(mouthX + (mouthWidth * 0.7), mouthY, mouthWidth * 0.2, e.height * 0.08);
        }
        ctx.strokeStyle = '#ff80ed';
        ctx.lineWidth = 3;
        const legState = Math.floor(e.animationTick / 8) % 2;
        const legY = e.y + e.height - (e.height * 0.08);
        if (legState === 0) {
            ctx.beginPath();
            ctx.moveTo(e.x + (e.width * 0.32), legY); ctx.lineTo(e.x + (e.width * 0.16), legY + (e.height*0.2));
            ctx.moveTo(e.x + (e.width * 0.68), legY); ctx.lineTo(e.x + (e.width * 0.84), legY + (e.height*0.2));
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.moveTo(e.x + (e.width * 0.32), legY); ctx.lineTo(e.x + (e.width * 0.48), legY + (e.height*0.2));
            ctx.moveTo(e.x + (e.width * 0.68), legY); ctx.lineTo(e.x + (e.width * 0.52), legY + (e.height*0.2));
            ctx.stroke();
        }
    },
    drawAwanHantu: function(e) {
        const ctx = Game.State.ctx; const C = Game.Constants;
        const isAngry = e.state === 'PAUSING' || e.state === 'DASHING' || e.state === 'RETURNING';
        ctx.fillStyle = isAngry ? '#ff4136' : '#ADD8E6';
        ctx.beginPath(); ctx.arc(e.x + e.width / 2, e.y + e.height / 2, e.width / 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(e.x, e.y + e.height/2, e.width, e.height/2);
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(e.x + e.width / 2, e.y + e.height / 2, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000000';
        const pupilX = e.x + e.width / 2 + (Math.sin(e.eyeAngle) * C.EYE_SWEEP_RANGE);
        ctx.beginPath(); ctx.arc(pupilX, e.y + e.height / 2, 4, 0, Math.PI * 2); ctx.fill();
    },
    drawIcicle: function(e) {
        const ctx = Game.State.ctx;
        if (e.state === 'STUCK' && e.y > Game.State.canvas.height) return;
        ctx.fillStyle = '#bdeeff';
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.lineTo(e.x + e.width, e.y);
        ctx.lineTo(e.x + e.width / 2, e.y + e.height);
        ctx.closePath();
        ctx.fill();
    },
    drawBat: function(e) {
        const ctx = Game.State.ctx;
        const centerX = e.x + e.width / 2;
        ctx.fillStyle = '#3d5a80';
        if (e.state === 'HANGING' || e.state === 'WAKING' || e.state === 'DETECTED') {
            ctx.beginPath();
            ctx.moveTo(centerX - 8, e.y);
            ctx.lineTo(centerX, e.y + e.height);
            ctx.lineTo(centerX + 8, e.y);
            ctx.closePath();
            ctx.fill();
            if (e.state === 'DETECTED' || e.state === 'WAKING') {
                ctx.fillStyle = '#e71d36';
                ctx.fillRect(centerX - 1.5, e.y + 8, 3, 3);
            }
        } else {
            const wingFlap = Math.sin(Game.State.globalAnimationTick * 0.4) * 12;
            ctx.fillStyle = '#293241';
            ctx.fillRect(centerX - 5, e.y, 10, e.height);
            ctx.fillStyle = '#98c1d9';
            ctx.beginPath();
            ctx.moveTo(centerX, e.y + 5);
            ctx.lineTo(centerX - e.width / 2 - 5, e.y + wingFlap);
            ctx.lineTo(centerX - e.width / 2 + 5, e.y + e.height);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(centerX, e.y + 5);
            ctx.lineTo(centerX + e.width / 2 + 5, e.y + wingFlap);
            ctx.lineTo(centerX + e.width / 2 - 5, e.y + e.height);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#e71d36';
            ctx.fillRect(centerX - 1.5, e.y + 3, 3, 3);
        }
    },
    drawMimicIce: function(e) {
        const ctx = Game.State.ctx;
        ctx.fillStyle = '#E0FFFF';
        let xPos = e.state === 'SHAKING' ? e.originalX + Math.sin(Game.State.globalAnimationTick * 0.8) * 2 : e.x;
        ctx.fillRect(xPos, e.y, e.width, e.height);
        if (e.hits > 0) {
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)'; ctx.lineWidth = 1; ctx.beginPath();
            if (e.hits >= 1) { ctx.moveTo(e.x + e.width * 0.5, e.y); ctx.lineTo(e.x + e.width * 0.5, e.y + e.height); }
            if (e.hits >= 2) { ctx.moveTo(e.x + e.width * 0.2, e.y); ctx.lineTo(e.x + e.width * 0.8, e.y + e.height); }
            ctx.stroke();
        }
    },
    drawIceShard: function(e) {
        const C = Game.Constants;
        const ctx = Game.State.ctx;
        if (Math.floor(e.lifetime / C.ICE_SHARD_BLINK_RATE) % 2 === 0) {
            ctx.fillStyle = '#E0FFFF';
            ctx.fillRect(e.x, e.y, e.width, e.height);
        }
    },
    drawProjectiles: function() { const S = Game.State; S.projectiles.forEach(p => { S.ctx.fillStyle = '#bdeeff'; S.ctx.fillRect(p.x, p.y, p.width, p.height); }); },
    drawDecorations: function() { const G = Game.Graphics; Game.State.decorations.forEach(d => { switch (d.type) { case 'SNOW_PILE': G.drawSnowPile(d.x, d.y); break; case 'ICE_SHARD': G.drawIceShard(d.x, d.y); break; case 'ICY_GRASS': G.drawIcyGrass(d.x, d.y); break; case 'FROZEN_PUDDLE': G.drawFrozenPuddle(d.x, d.y); break; case 'ICE_ROCK': G.drawIceRock(d.x, d.y); break; case 'SIGNPOST': G.drawSignpost(d.x, d.y); break; case 'SNOWY_TREE': G.drawSnowyTree(d.x, d.y); break; case 'CHECKPOINT_FLAG': G.drawCheckpointFlag(d.x, d.y); break;} }); },
    drawCharacterPreviews: function() { 
        const G = Game.Graphics; 
        const characterData = { width: 30, height: 30, onGround: true }; 
        const eskimoCanvas = document.getElementById('eskimo-preview'); 
        if (eskimoCanvas) { const pCtx = eskimoCanvas.getContext('2d'); pCtx.clearRect(0,0,60,60); G.drawCharacter('ESKIMO', 15, 15, false, pCtx, characterData); } 
        const penguinCanvas = document.getElementById('penguin-preview'); 
        if (penguinCanvas) { const pCtx = penguinCanvas.getContext('2d'); pCtx.clearRect(0,0,60,60); G.drawCharacter('PENGUIN', 15, 15, false, pCtx, characterData); } 
        const eskimoFemaleCanvas = document.getElementById('eskimo-female-preview'); 
        if (eskimoFemaleCanvas) { const pCtx = eskimoFemaleCanvas.getContext('2d'); pCtx.clearRect(0,0,60,60); G.drawCharacter('ESKIMO_FEMALE', 15, 15, false, pCtx, characterData); } 
    },
    drawSnowPile: function(x, y, tCtx = Game.State.ctx) { const r = 8; tCtx.fillStyle = 'rgba(255, 255, 255, 0.8)'; tCtx.beginPath(); tCtx.arc(x, y, r, Math.PI, Math.PI * 2); tCtx.fill(); tCtx.beginPath(); tCtx.arc(x + (r*0.9), y, r*0.75, Math.PI, Math.PI * 2); tCtx.fill(); },
    drawIceShard: function(x, y, tCtx = Game.State.ctx) { const h = 13, w = 6; tCtx.fillStyle = 'rgba(189, 234, 255, 0.7)'; tCtx.beginPath(); tCtx.moveTo(x, y); tCtx.lineTo(x + w, y - h); tCtx.lineTo(x + (w*2), y); tCtx.closePath(); tCtx.fill(); },
    drawIcyGrass: function(x, y, tCtx = Game.State.ctx) { const h = [10,13,9]; tCtx.strokeStyle = 'rgba(200, 255, 255, 0.9)'; tCtx.lineWidth = 2; tCtx.beginPath(); tCtx.moveTo(x, y); tCtx.lineTo(x + 3, y - h[0]); tCtx.moveTo(x + 5, y); tCtx.lineTo(x + 6, y - h[1]); tCtx.moveTo(x + 10, y); tCtx.lineTo(x + 9, y - h[2]); tCtx.stroke(); },
    drawFrozenPuddle: function(x, y, tCtx = Game.State.ctx) { const w = 30, h = 4; tCtx.fillStyle = 'rgba(173, 216, 230, 0.6)'; tCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)'; tCtx.lineWidth = 1; tCtx.beginPath(); tCtx.ellipse(x, y, w, h, 0, 0, 2 * Math.PI); tCtx.fill(); tCtx.stroke(); },
    drawIceRock: function(x, y, tCtx = Game.State.ctx) { tCtx.fillStyle = 'rgba(210, 220, 230, 0.85)'; tCtx.strokeStyle = 'rgba(180, 190, 200, 0.9)'; tCtx.lineWidth = 1; tCtx.beginPath(); tCtx.moveTo(x, y); tCtx.lineTo(x - 8, y - 5); tCtx.lineTo(x - 2, y - 15); tCtx.lineTo(x + 10, y - 12); tCtx.lineTo(x + 12, y - 4); tCtx.closePath(); tCtx.fill(); tCtx.stroke(); },
    drawSignpost: function(x, y, tCtx = Game.State.ctx) { tCtx.fillStyle = '#8B4513'; tCtx.fillRect(x, y - 20, 4, 20); tCtx.fillRect(x - 10, y - 18, 24, 10); tCtx.fillStyle = '#FFF'; tCtx.beginPath(); tCtx.moveTo(x + 8, y - 15); tCtx.lineTo(x + 12, y - 13); tCtx.lineTo(x + 8, y - 11); tCtx.fill(); },
    drawSnowyTree: function(x, y, tCtx = Game.State.ctx) { tCtx.fillStyle = '#5C4033'; tCtx.fillRect(x, y - 15, 8, 15); tCtx.fillStyle = '#FFFFFF'; tCtx.beginPath(); tCtx.moveTo(x + 4, y - 45); tCtx.lineTo(x - 15, y - 25); tCtx.lineTo(x + 23, y - 25); tCtx.closePath(); tCtx.fill(); tCtx.beginPath(); tCtx.moveTo(x + 4, y - 30); tCtx.lineTo(x - 20, y - 10); tCtx.lineTo(x + 28, y - 10); tCtx.closePath(); tCtx.fill(); },
    drawCheckpointFlag: function(x, y, tCtx = Game.State.ctx) { tCtx.fillStyle = '#964B00'; tCtx.fillRect(x, y - 30, 4, 30); tCtx.fillStyle = '#00FF00'; tCtx.beginPath(); tCtx.moveTo(x + 4, y - 28); tCtx.lineTo(x + 18, y - 22); tCtx.lineTo(x + 4, y - 16); tCtx.closePath(); tCtx.fill(); },
    drawPowerUps: function() {
        const ctx = Game.State.ctx;
        const tick = Game.State.globalAnimationTick;
        Game.State.powerUps.forEach(p => {
            const glowRadius = p.width / 2 + 5 + Math.sin(tick * 0.1) * 3;
            const glowOpacity = 0.4 + Math.sin(tick * 0.1) * 0.2;
            ctx.save();
            ctx.fillStyle = `rgba(255, 255, 150, ${glowOpacity})`;
            ctx.beginPath();
            ctx.arc(p.x + p.width / 2, p.y + p.height / 2, glowRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            if (p.type === 'HAMMER') { this.drawHammer(p.x, p.y); } 
            else if (p.type === 'SHIELD') { this.drawShieldFrontView(p.x, p.y); }
        });
    },
    drawHammer: function(x, y, targetCtx = Game.State.ctx) {
        targetCtx.fillStyle = '#8B4513';
        targetCtx.fillRect(x + 10, y + 10, 5, 15);
        targetCtx.fillStyle = '#C0C0C0';
        targetCtx.fillRect(x, y, 25, 10);
    },
    drawShieldFrontView: function(x, y, targetCtx = Game.State.ctx) {
        targetCtx.fillStyle = '#4682B4';
        targetCtx.beginPath();
        targetCtx.moveTo(x, y);
        targetCtx.lineTo(x + 25, y);
        targetCtx.lineTo(x + 25, y + 20);
        targetCtx.arcTo(x + 12.5, y + 30, x, y + 20, 15);
        targetCtx.closePath();
        targetCtx.fill();
        targetCtx.fillStyle = '#C0C0C0';
        targetCtx.fillRect(x, y, 25, 3);
    },
    drawShieldSideView: function(x, y, targetCtx = Game.State.ctx) {
        targetCtx.fillStyle = '#C0C0C0';
        targetCtx.fillRect(x, y, 4, 25);
        targetCtx.fillStyle = '#4682B4';
        targetCtx.fillRect(x + 4, y, 3, 25);
    }
};