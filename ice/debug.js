import { Game } from './game.js';

Game.Debug = {
    updateDebugInfo: function() {
        const S = Game.State;
        if (!S.debugModeActive) return;
        S.debugPlayerX.textContent = S.player.x.toFixed(2); S.debugPlayerY.textContent = S.player.y.toFixed(2);
        S.debugPlayerDX.textContent = S.player.dx.toFixed(2); S.debugPlayerDY.textContent = S.player.dy.toFixed(2);
        S.debugPlayerOnGround.textContent = S.player.onGround;
        S.debugCollision.textContent = S.player.isHit ? 'YA' : 'Tidak';
    }
};