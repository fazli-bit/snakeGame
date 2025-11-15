// Kod persediaan global dari fail asal
const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
if (isMobile) {
    document.body.classList.add('is-mobile');
}

// Import objek Game utama (kosong)
import { Game } from './game.js';

// Import semua modul untuk "melampirkan" (attach) diri mereka.
// Urutan adalah penting untuk mengelakkan ralat 'undefined'.
// Constants dan State mesti dimuatkan dahulu kerana ia mengandungi nilai statik
// dan elemen DOM yang diperlukan oleh modul lain.
import './constants.js';
import './state.js'; // Bergantung pada DOM, tetapi skrip ini dimuatkan di hujung body, jadi DOM sedia.

// Modul logik
import './player.js';
import './enemies.js';
import './level.js';
import './graphics.js';
import './controls.js';
import './debug.js';
import './firebase.js'; // Mesti sebelum Core (yang memanggil .init())

// Core mesti dimuatkan paling akhir kerana ia memanggil .init()
// yang bergantung pada semua modul lain.
import './core.js';

// Panggilan terakhir dari fail asal
Game.Core.init();