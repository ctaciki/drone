import { PARTS } from './data/parts.js';
import { getPartScale } from './config.js';
import { initAudioWarmup } from './core/audio-manager.js';
import { PreviewManager } from './components/preview-manager.js';
import { CutsceneMode } from './modes/cutscene-mode.js';
import { FreeMode } from './modes/free-mode.js';
import { LearningMode } from './modes/learning-mode.js';

class App {
    constructor() {
        this.parts = PARTS;
        this.getPartScale = (idx) => getPartScale(idx, this.parts);
        this.previewManager = new PreviewManager(this.parts, this.getPartScale);
        this.cutsceneMode = new CutsceneMode();
        this.freeMode = new FreeMode(this.parts, this.getPartScale);
        this.learningMode = new LearningMode(this.parts, this.getPartScale, this.previewManager);
        this.currentMode = null;
    }

    init() {
        initAudioWarmup();
        this.previewManager.init();
        this.bindMenuEvents();
    }

    bindMenuEvents() {
        const mainMenu = document.getElementById('mainMenu');

        document.getElementById('btnLearning')?.addEventListener('click', () => {
            mainMenu.classList.add('hidden');
            document.getElementById('cutscene').style.display = 'block';
            this.switchMode(this.cutsceneMode);
        });

        document.getElementById('btnSkip')?.addEventListener('click', () => {
            this.cutsceneMode.skip();
        });

        document.getElementById('btnStartRepair')?.addEventListener('click', () => {
            document.getElementById('crashReport').classList.remove('active');
            const gl = document.getElementById('gameLoading');
            gl.style.display = 'flex';
            setTimeout(() => {
                gl.style.display = 'none';
                document.getElementById('gameContainer').style.display = 'block';
                this.switchMode(this.learningMode);
            }, 1200);
        });

        document.getElementById('btnFree')?.addEventListener('click', () => {
            mainMenu.classList.add('hidden');
            document.getElementById('freeModeContainer').classList.add('active');
            this.switchMode(this.freeMode);
        });

        document.getElementById('freeModeBack')?.addEventListener('click', () => {
            this.switchMode(null);
            document.getElementById('freeModeContainer').classList.remove('active');
            mainMenu.classList.remove('hidden');
            mainMenu.style.display = '';
        });

        document.getElementById('freeModeCloseInfo')?.addEventListener('click', () => {
            document.getElementById('freeModeInfo').classList.remove('active');
            this.freeMode.clearFocus();
        });

        document.getElementById('resetPosBtn')?.addEventListener('click', () => this.learningMode.resetPartPosition());
        document.getElementById('endBtn')?.addEventListener('click', () => this.learningMode.nextLevel());
        document.getElementById('hintBtn')?.addEventListener('click', () => this.learningMode.useHint());

        document.getElementById('achRestartBtn')?.addEventListener('click', () => {
            this.learningMode.hideAchievementsScreen();
            this.learningMode.restart();
        });

        document.getElementById('achMenuBtn')?.addEventListener('click', () => {
            this.learningMode.hideAchievementsScreen();
            document.getElementById('gameContainer').style.display = 'none';
            const mainMenu = document.getElementById('mainMenu');
            mainMenu.classList.remove('hidden');
            mainMenu.style.display = 'flex';
            this.switchMode(null);
        });

        document.getElementById('manualSnapBtn')?.addEventListener('click', () => this.learningMode.manualSnap());
    }

    switchMode(newMode) {
        if (this.currentMode && this.currentMode.active) {
            this.currentMode.exit();
        }
        this.currentMode = newMode;
        if (newMode) newMode.enter();
    }
}

// Глобальное присваивание — доступно из HTML и консоли
window.app = new App();
window.addEventListener('DOMContentLoaded', () => window.app.init());
