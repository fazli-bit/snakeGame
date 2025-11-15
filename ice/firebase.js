import { Game } from './game.js';

// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// ! KESELAMATAN DIPERTINGKATKAN: Mengimport konfigurasi daripada fail luaran
import { firebaseConfig } from './firebase-config.js';

Game.Firebase = {
    db: null, auth: null,
    init: function() {
        try {
            // ! KESELAMATAN DIPERTINGKATKAN: Menggunakan konfigurasi yang diimport
            const app = initializeApp(firebaseConfig);
            this.db = getFirestore(app);
            this.auth = getAuth(app);
            onAuthStateChanged(this.auth, user => {
                if (user) {
                    Game.State.userId = user.uid;
                    if(!Game.State.firebaseReady) {
                        Game.State.firebaseReady = true;
                        this.loadHighScores(); 
                    }
                }
            });
            signInAnonymously(this.auth);
        } catch (error) {
            console.error("Firebase Init Error:", error);
        }
    },
    handleNewHighScore: async function() {
        const S = Game.State;
        if (!S.firebaseReady) {
            setTimeout(() => Game.Firebase.handleNewHighScore(), 200);
            return;
        }
        const scoreRef = doc(this.db, "games", "ice-climber", "highscores", S.userId);
        try {
            const docSnap = await getDoc(scoreRef);
            const currentHighScore = docSnap.exists() ? docSnap.data().score : 0;
            if (S.score > currentHighScore) {
                S.nameInputMenu.style.display = 'flex';
                S.nameInputField.value = localStorage.getItem('iceClimberPlayerName') || '';
                S.nameInputField.focus();
            } else {
                 await this.loadHighScores();
            }
        } catch(e) { console.error("Error checking high score:", e); await this.loadHighScores(); }
    },
    saveHighScore: async function(score, name, stage) {
        const S = Game.State;
        if (!S.userId) return;
        const scoreRef = doc(this.db, "games", "ice-climber", "highscores", S.userId);
        try {
            await setDoc(scoreRef, { score: score, name: name, stage: stage });
        } catch (error) { console.error("Error saving high score:", error); }
    },
    loadHighScores: async function() {
        if (!Game.State.firebaseReady) {
              setTimeout(() => this.loadHighScores(), 200);
              return;
        }
        const highscoreList = document.getElementById('highscore-list');
        const startHighscoreDisplay = document.getElementById('start-highscore-display');
        highscoreList.innerHTML = '<h4>Loading...</h4>';
        startHighscoreDisplay.innerHTML = '<p>Loading...</p>';
        try {
            const q = query(collection(this.db, "games", "ice-climber", "highscores"), orderBy("score", "desc"));
            const querySnapshot = await getDocs(q);
            let scoresHTML = '';
            let count = 0;
            const medals = ['🥇', '🥈', '🥉', '4.', '5.'];
            querySnapshot.forEach((doc) => {
                if(count < 5) {
                    const data = doc.data();
                    const medal = medals[count] || `${count + 1}.`;
                    const name = data.name.padEnd(8, ' ');
                    const stageText = `P${data.stage}`.padEnd(5, ' ');
                    scoresHTML += `<p>${medal} ${name} ${stageText} ${data.score}</p>`;
                    count++;
                }
            });
              if(count === 0) {
                 scoresHTML = '<p>No scores yet!</p>';
              }
            highscoreList.innerHTML = '<h4>HIGH SCORES</h4>' + scoresHTML;
            startHighscoreDisplay.innerHTML = scoresHTML;
        } catch (error) {
            console.error("Error loading high scores:", error);
            const errorMsg = '<h4>Error loading scores</h4>';
            highscoreList.innerHTML = errorMsg;
            startHighscoreDisplay.innerHTML = errorMsg;
        }
    }
};