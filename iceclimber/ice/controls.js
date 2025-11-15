import { Game } from './game.js';

Game.Controls = {
    keys: { left: false, right: false, up: false, down: false, a: false, b: false },
    setupEventListeners: function() {
        const S = Game.State;
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (S.debugCodeMenu.style.display === 'flex' || S.nameInputMenu.style.display === 'flex' || S.gameOver) return;
            if (key === 'arrowleft') this.keys.left = true;
            if (key === 'arrowright') this.keys.right = true;
            if (key === 'arrowdown') this.keys.down = true;
            if (key === 'arrowup' || key === 'd') { e.preventDefault(); this.keys.up = true; this.keys.a = true; }
            if (key === 's') { e.preventDefault(); this.keys.b = true; }
            if (e.ctrlKey && key === 'd') {
                e.preventDefault();
                S.debugCodeMenu.style.display = 'flex';
                S.debugCodeInput.focus();
            }
        });
        document.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (key === 'arrowleft') this.keys.left = false;
            if (key === 'arrowright') this.keys.right = false;
            if (key === 'arrowdown') this.keys.down = false;
            if (key === 'arrowup' || key === 'd') { this.keys.up = false; this.keys.a = false; }
            if (key === 's') { this.keys.b = false; }
        });
        const checkDebugCode = () => {
            try {
                if (atob(S.secretCode) === S.debugCodeInput.value) {
                    S.debugModeActive = !S.debugModeActive;
                    S.mainContainer.classList.toggle('show-debug', S.debugModeActive);
                    S.player.maxHp = S.debugModeActive ? 99 : (S.player.powerUp ? 2 : 1);
                    S.player.hp = S.player.maxHp;
                    if (!S.debugModeActive) S.landedYLevels.clear();
                }
            } catch (err) {}
            S.debugCodeInput.value = '';
            S.debugCodeMenu.style.display = 'none';
            Object.keys(this.keys).forEach(k => this.keys[k] = false);
        };
        S.debugCodeSubmit.addEventListener('click', checkDebugCode);
        S.debugCodeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                checkDebugCode();
            } else if (e.key === 'Escape') {
                S.debugCodeInput.value = '';
                S.debugCodeMenu.style.display = 'none';
                Object.keys(this.keys).forEach(k => this.keys[k] = false);
            }
        });
        
        const submitName = async () => {
            const name = S.nameInputField.value.trim().toUpperCase();
            if (name.length < 3 || name.length > 8) {
                console.warn("Nama tidak sah, mesti 3-8 aksara.");
                S.nameInputMenu.style.animation = 'shake 0.3s';
                setTimeout(() => { S.nameInputMenu.style.animation = ''; }, 300);
                return;
            }
            localStorage.setItem('iceClimberPlayerName', name);
            S.nameInputMenu.style.display = 'none';
            
            await Game.Firebase.saveHighScore(S.score, name, S.stage);
            await Game.Firebase.loadHighScores(); 
        };

        S.nameInputSubmit.addEventListener('click', submitName);
        S.nameInputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                submitName();
            } else if (e.key === 'Escape') {
                 S.nameInputMenu.style.display = 'none';
                 Game.Firebase.loadHighScores(); 
            }
        });

        S.instructionsButton.addEventListener('click', () => { S.startMenu.style.display = 'none'; S.instructionsMenu.style.display = 'flex'; });
        S.backToStartMenuButton.addEventListener('click', () => { S.instructionsMenu.style.display = 'none'; S.startMenu.style.display = 'flex'; });
        S.startButton.addEventListener('click', Game.Core.startGame);
        S.continueButton.addEventListener('click', () => { Game.Core.startGame(); });
        S.restartButton.addEventListener('click', () => { S.checkpointStage = 1; S.stage = 1; S.gameOverMenu.style.display = 'none'; S.startMenu.style.display = 'flex'; if (document.body.classList.contains('is-mobile')) { document.getElementById('on-screen-controls').style.display = 'none'; } Game.Core.resetGame(); Game.Graphics.draw(); });
        S.decorationSlider.addEventListener('input', (e) => { const v = parseInt(e.target.value, 10); S.decorationProbability = v / 100; S.decorationValue.textContent = `${v}%`; });
        S.enemySelectionButtons.forEach(b => { b.addEventListener('click', () => { S.enemySelectionButtons.forEach(btn => btn.classList.remove('selected')); b.classList.add('selected'); S.testEnemyType = b.dataset.enemy; if (S.stage === 102) { Game.Enemies.generateEnemies(); Game.Graphics.draw(); } }); });
        S.characterSelectors.forEach(s => { s.addEventListener('click', () => { S.characterSelectors.forEach(sel => sel.classList.remove('selected')); s.classList.add('selected'); S.selectedCharacter = s.dataset.char; }); });
        S.stagePresetButtons.forEach(b => { b.addEventListener('click', (e) => {
            const newStage = parseInt(e.target.dataset.stage, 10); if (isNaN(newStage)) return;
            S.stage = newStage; S.checkpointStage = S.stage;
            S.stageDisplay.textContent = S.stage; S.gameOver = false; S.isTransitioning = false; S.score = 0; S.scoreDisplay.textContent = S.score; S.landedYLevels = new Set();
            if (newStage > 1 && ![101,102].includes(newStage)) {
                const baseW = S.player.width * 3;
                const base = [{ x: (S.canvas.width/2)-(baseW/2), width: baseW, type: 'top' }];
                Game.Level.generatePlatforms(base);
            } else {
                Game.Level.generatePlatforms();
            }
            const startP = S.platforms[0]; S.player.y = startP.y - S.player.height; S.player.x = ([101,102].includes(S.stage)) ? 20 : startP.x + (startP.width / 2) - (S.player.width / 2); S.player.dx = 0; S.player.dy = 0; S.player.onGround = true;
            if (S.startMenu.style.display !== 'none' || S.gameOverMenu.style.display !== 'none') { Game.Graphics.draw(); } else { if (Game.Core.animationFrameId) cancelAnimationFrame(Game.Core.animationFrameId); Game.Core.gameLoop(); }
        }); });
        S.resetPlatformsButton.addEventListener('click', () => {
            if ([101, 102].includes(S.stage)) return;
            Game.Level.generatePlatforms(null);
            Game.Level.generatePowerUps();
            const startP = S.platforms[0]; S.player.y = startP.y - S.player.height; S.player.x = startP.x + (startP.width / 2) - (S.player.width / 2); S.player.dx = 0; S.player.dy = 0; S.player.onGround = true; Game.Graphics.draw();
        });
        
        // ! KAWALAN MUDAH ALIH DIUBAH SUAI: Menggunakan nipplejs
        const btnA = document.getElementById('btn-a'); 
        const btnB = document.getElementById('btn-b');

        // Fungsi handleTouch kini hanya untuk butang A & B
        const handleTouch = (element, key, isPressed) => {
            element.addEventListener(isPressed ? 'touchstart' : 'touchend', (e) => {
                e.preventDefault();
                this.keys[key] = isPressed;
                if (key === 'a') this.keys['up'] = isPressed;
                element.classList.toggle('pressed', isPressed);
            }, { passive: false });
        };
        
        // Kekalkan listener untuk A dan B
        handleTouch(btnA, 'a', true); handleTouch(btnA, 'a', false);
        handleTouch(btnB, 'b', true); handleTouch(btnB, 'b', false);

        // Tambah listener untuk nipplejs (kayu bedik)
        if (document.body.classList.contains('is-mobile')) {
            const joystickZone = document.getElementById('joystick-zone');
            const joystickOptions = {
                zone: joystickZone,
                mode: 'static',
                position: { left: '50%', top: '50%' },
                color: 'rgba(255, 255, 255, 0.5)',
                size: 150,
                threshold: 0.1,
                fadeTime: 250
            };
            
            const manager = nipplejs.create(joystickOptions);
            const keys = this.keys; // Rujukan kepada Game.Controls.keys

            manager.on('move', function (evt, data) {
                if (data.direction) {
                    keys.left = (data.direction.x === 'left');
                    keys.right = (data.direction.x === 'right');
                    keys.down = (data.direction.y === 'down');
                    // Kita sengaja abaikan 'up' kerana butang 'A' mengawalnya
                }
            });

            manager.on('end', function () {
                keys.left = false;
                keys.right = false;
                keys.down = false;
            });
        }
        // ! AKHIR KAWALAN MUDAH ALIH
    }
};