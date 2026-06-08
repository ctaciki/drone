import { Mode } from './mode.js';
import { hslToRgb, normalizeAngle0, angleDiff } from '../utils/math.js';
import { CONFIG } from '../config.js';
import { checkAchievements, levelStars } from '../data/achievements.js';
import { UIManager } from '../core/ui-manager.js';
import { AssetManager } from '../core/asset-manager.js';
import { paintHierarchy } from '../utils/babylon.js';
import { playClick, playSnap, playStar, playWin, playQuizSelect } from '../core/audio-manager.js';
export class LearningMode extends Mode {
    constructor(parts, getPartScale, previewManager) {
        super('learning');
        this.parts = parts;
        this.getPartScale = getPartScale;
        this.previewManager = previewManager;
        this.level = 0;
        this.phase = 'pre';
        this.timerVal = 0;
        this.timerInterval = null;
        this.hintsLeft = 1;
        this.hintUsed = false;
        this.streakCount = 0;
        this.starsEarned = 0;
        this.totalScore = 0;
        this.placedMeshes = [];
        this.activeMesh = null;
        this.ghostMesh = null;
        this.scene = null;
        this.engine = null;
        this.camera = null;
        this.prePhase = 0;
        this.quizAnswered = false;
        this.gameDragging = false;
        this.gameDragOffset = null;
        this.gameDragMode = 'xz';
        this.gameShiftDown = false;
        this.activeTouches = new Map();
        this.touchStartAngle = 0;
        this.touchInitialRotY = 0;
        this.userChangedColor = false;
    }

    enter() {
        super.enter();
        this.initBabylon();
        this.showPreCard();
    }

    initBabylon() {
        const canvas = document.getElementById('renderCanvas');
        this.engine = new BABYLON.Engine(canvas, true);
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.clearColor = new BABYLON.Color4(0.94, 0.96, 0.98, 1);

        this.camera = new BABYLON.ArcRotateCamera('cam', -Math.PI / 2, Math.PI / 3, 5.5, BABYLON.Vector3.Zero(), this.scene);
        this.camera.lowerRadiusLimit = 2.5; this.camera.upperRadiusLimit = 12;
        this.camera.attachControl(canvas, true);
        this.camera.inputs.attached.pointers.buttons = [1, 2];
        if (this.camera.inputs.attached.mousewheel) {
            this.camera.inputs.remove(this.camera.inputs.attached.mousewheel);
        }
// Полностью вырезаем встроенный зум колесом из камеры
        if (this.camera.inputs.attached.mousewheel) {
            this.camera.inputs.remove(this.camera.inputs.attached.mousewheel);
        }

// Отключаем системные жесты
        canvas.style.touchAction = 'none';
        document.body.style.overscrollBehavior = 'none';
        const hemi = new BABYLON.HemisphericLight('h', new BABYLON.Vector3(0, 1, 0), this.scene);
        hemi.intensity = 0.45;
        const dir = new BABYLON.DirectionalLight('d', new BABYLON.Vector3(-1, -2, -1), this.scene);
        dir.intensity = 0.85;

        const ground = BABYLON.MeshBuilder.CreateGround('g', { width: 8, height: 8 }, this.scene);
        let gm;
        try {
            gm = new BABYLON.GridMaterial('gmat', this.scene);
            gm.majorUnitFrequency = 5; gm.minorUnitVisibility = 0.25; gm.gridRatio = 0.25;
            gm.mainColor = new BABYLON.Color3(0.85, 0.87, 0.92);
            gm.lineColor = new BABYLON.Color3(0.6, 0.65, 0.75); gm.opacity = 0.5;
        } catch (e) {
            gm = new BABYLON.StandardMaterial('gmat', this.scene);
            gm.diffuseColor = new BABYLON.Color3(0.85, 0.87, 0.92);
        }
        ground.material = gm; ground.position.y = -0.5;

        let gridTime = 0;
        this.scene.onBeforeRenderObservable.add(() => {
            gridTime += 0.008;
            if (gm.opacity !== undefined) gm.opacity = 0.35 + 0.15 * Math.sin(gridTime);
            const pulse = 0.6 + 0.08 * Math.sin(gridTime * 0.7);
            if (gm.lineColor) gm.lineColor = new BABYLON.Color3(pulse, pulse * 1.02, pulse * 1.08);
        });

        try {
            const dustSystem = new BABYLON.ParticleSystem('dust', 60, this.scene);
            dustSystem.emitter = new BABYLON.Vector3(0, 1.5, 0);
            dustSystem.minEmitBox = new BABYLON.Vector3(-3, 0, -3); dustSystem.maxEmitBox = new BABYLON.Vector3(3, 2, 3);
            dustSystem.color1 = new BABYLON.Color4(0.7, 0.75, 0.9, 0.4); dustSystem.color2 = new BABYLON.Color4(0.8, 0.82, 0.95, 0.25);
            dustSystem.colorDead = new BABYLON.Color4(0.9, 0.9, 1, 0);
            dustSystem.minSize = 0.02; dustSystem.maxSize = 0.05;
            dustSystem.minLifeTime = 4; dustSystem.maxLifeTime = 8;
            dustSystem.emitRate = 10; dustSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
            dustSystem.gravity = new BABYLON.Vector3(0, 0.01, 0);
            dustSystem.direction1 = new BABYLON.Vector3(-0.05, 0.05, -0.05); dustSystem.direction2 = new BABYLON.Vector3(0.05, 0.1, 0.05);
            dustSystem.minEmitPower = 0.02; dustSystem.maxEmitPower = 0.08; dustSystem.updateSpeed = 0.008;
            dustSystem.start();
        } catch (e) { console.warn('Dust particles skipped:', e); }

        this.setupPointerEvents(canvas);
        this.engine.runRenderLoop(() => { if (this.scene) this.scene.render(); });
        window.addEventListener('resize', () => this.engine?.resize());
// Глобально глушим браузерный зум Ctrl+Wheel / Meta+Wheel

// Отключаем системные жесты на canvas
        canvas.style.touchAction = 'none';
        AssetManager.preloadAll(this.scene, this.parts, (pct) => {
            const bar = document.getElementById('loadingBar');
            if (bar) bar.style.width = pct + '%';
        }).then(() => {
            const loading = document.getElementById('loading');
            if (loading) loading.style.display = 'none';
        });

        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer && this.engine) {
            const observer = new MutationObserver(() => { if (gameContainer.style.display !== 'none') this.engine.resize(); });
            observer.observe(gameContainer, { attributes: true, attributeFilter: ['style'] });
        }
        setTimeout(() => this.engine.resize(), 300);
    }

    setupPointerEvents(canvas) {
        let lastMouseY = 0;
        window.addEventListener('keydown', e => { if (e.key === 'Shift') this.gameShiftDown = true; });
        window.addEventListener('keyup', e => { if (e.key === 'Shift') this.gameShiftDown = false; });

        canvas.addEventListener('pointerdown', (e) => {
            if (this.phase !== 'play' || !this.activeMesh || e.button !== 0) return;
            const pick = this.scene.pick(e.clientX, e.clientY, m => this.isPartMesh(m));
            if (pick.hit) {
                playClick(); this.gameDragging = true; this.gameDragMode = this.gameShiftDown ? 'y' : 'xz';
                canvas.setPointerCapture(e.pointerId); e.preventDefault();
                if (this.gameDragMode === 'xz') {
                    const t = this.rayPlaneXZ(e.clientX, e.clientY, this.parts[this.level].targetPos.y);
                    if (t !== null) this.gameDragOffset = this.activeMesh.position.subtract(t);
                } else { this.gameDragOffset = new BABYLON.Vector3(0, this.activeMesh.position.y, 0); }
                lastMouseY = e.clientY;
            }
        });
        this._wheelHandler = (e) => {
            const isOverCanvas = e.target === canvas || canvas.contains(e.target);
            if (!isOverCanvas) return;
            if (!e.cancelable) return;

            const hasShift = e.shiftKey;
            const hasCtrl = e.ctrlKey || e.metaKey;

            // Если нет модификаторов — зум камеры (наше ручное управление)
            if (!hasShift && !hasCtrl) {
                e.preventDefault();
                e.stopImmediatePropagation();
                if (this.camera) {
                    this.camera.radius += e.deltaY * 0.01;
                    this.camera.radius = Math.max(
                        this.camera.lowerRadiusLimit,
                        Math.min(this.camera.upperRadiusLimit, this.camera.radius)
                    );
                }
                return;
            }

            // Shift / Ctrl / Shift+Ctrl — вращение детали
            e.preventDefault();
            e.stopImmediatePropagation();

            if (this.phase !== 'play' || !this.activeMesh) return;

            this.ensureRotationEuler();
            const SENSITIVITY = 0.0008; // чуть увеличили, чтобы было плавнее при редких событиях

            if (hasShift && hasCtrl) {
                this.activeMesh.rotation.z += e.deltaY * SENSITIVITY;
            } else if (hasShift) {
                this.activeMesh.rotation.y += e.deltaY * SENSITIVITY;
            } else if (hasCtrl) {
                this.activeMesh.rotation.x += e.deltaY * SENSITIVITY;
            }

            this.snapRotationIfClose();
            this.checkAutoSnap();
        };

        window.addEventListener('wheel', this._wheelHandler, { passive: false, capture: true });
        canvas.addEventListener('pointermove', (e) => {
            if (this.phase !== 'play' || !this.activeMesh || !this.gameDragging) return;
            e.preventDefault();
            if (this.gameDragMode === 'xz') {
                const t = this.rayPlaneXZ(e.clientX, e.clientY, this.activeMesh.position.y);
                if (t !== null) {
                    this.activeMesh.position.x = t.x + (this.gameDragOffset ? this.gameDragOffset.x : 0);
                    this.activeMesh.position.z = t.z + (this.gameDragOffset ? this.gameDragOffset.z : 0);
                }
            } else {
                const dy = (lastMouseY - e.clientY) * 0.0015;
                this.activeMesh.position.y += dy;
            }
            lastMouseY = e.clientY;
            this.checkAutoSnap();
        });

        canvas.addEventListener('pointerup', (e) => {
            if (this.gameDragging) { this.gameDragging = false; this.gameDragOffset = null; canvas.releasePointerCapture(e.pointerId); }
        });



        canvas.addEventListener('touchstart', (e) => {
            if (this.phase !== 'play' || !this.activeMesh) return;
            e.preventDefault();
            for (let t of e.changedTouches) this.activeTouches.set(t.identifier, { x: t.clientX, y: t.clientY });
            if (this.activeTouches.size === 1) {
                const t = e.touches[0];
                const pick = this.scene.pick(t.clientX, t.clientY, m => this.isPartMesh(m));
                if (pick.hit) { playClick(); this.gameDragging = true; this.gameDragMode = 'xz'; const pt = this.rayPlaneXZ(t.clientX, t.clientY, this.parts[this.level].targetPos.y); if (pt) this.gameDragOffset = this.activeMesh.position.subtract(pt); }
            } else if (this.activeTouches.size === 2) {
                this.gameDragging = false; const t0 = e.touches[0], t1 = e.touches[1];
                this.touchStartAngle = Math.atan2(t1.clientY - t0.clientY, t1.clientX - t0.clientX);
                this.touchInitialRotY = this.activeMesh.rotation ? this.activeMesh.rotation.y : 0;
            }
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            if (this.phase !== 'play' || !this.activeMesh) return;
            e.preventDefault();
            if (this.activeTouches.size === 1 && this.gameDragging) {
                const t = e.touches[0]; const pt = this.rayPlaneXZ(t.clientX, t.clientY, this.activeMesh.position.y);
                if (pt && this.gameDragOffset) { this.activeMesh.position.x = pt.x + this.gameDragOffset.x; this.activeMesh.position.z = pt.z + this.gameDragOffset.z; }
                this.checkAutoSnap();
            } else if (this.activeTouches.size === 2) {
                const t0 = e.touches[0], t1 = e.touches[1];
                const angle = Math.atan2(t1.clientY - t0.clientY, t1.clientX - t0.clientX);
                const deltaAngle = angle - this.touchStartAngle;
                this.ensureRotationEuler();
                this.activeMesh.rotation.y = this.touchInitialRotY - deltaAngle;
                this.snapRotationIfClose(); this.checkAutoSnap();
            }
        }, { passive: false });

        canvas.addEventListener('touchend', (e) => {
            for (let t of e.changedTouches) this.activeTouches.delete(t.identifier);
            if (this.activeTouches.size === 0) { this.gameDragging = false; this.gameDragOffset = null; }
        });
    }

    rayPlaneXZ(px, py, planeY) {
        const ray = this.scene.createPickingRay(px, py, BABYLON.Matrix.Identity(), this.camera);
        if (Math.abs(ray.direction.y) < 0.0001) return null;
        const t = (planeY - ray.origin.y) / ray.direction.y;
        if (t <= 0) return null;
        return ray.origin.add(ray.direction.scale(t));
    }

    isPartMesh(m) {
        if (!this.activeMesh) return false;
        let cur = m;
        while (cur) { if (cur === this.activeMesh) return true; cur = cur.parent; }
        return false;
    }

    ensureRotationEuler() {
        if (this.activeMesh && this.activeMesh.rotationQuaternion) {
            const euler = this.activeMesh.rotationQuaternion.toEulerAngles();
            this.activeMesh.rotationQuaternion = null;
            this.activeMesh.rotation = euler;
        }
    }

    snapRotationIfClose() {
        if (!this.activeMesh || this.phase !== 'play') return;
        const p = this.parts[this.level]; this.ensureRotationEuler();
        ['x', 'y', 'z'].forEach(axis => {
            const current = this.activeMesh.rotation[axis];
            const target = p.targetEuler[axis];
            const diff = angleDiff(current, target);
            if (diff < CONFIG.HARD_SNAP) { this.activeMesh.rotation[axis] = target; }
            else if (diff < CONFIG.SOFT_SNAP) {
                const rawDiff = normalizeAngle0(target) - normalizeAngle0(current);
                const dir = (Math.abs(rawDiff) > Math.PI) ? -Math.sign(rawDiff) : Math.sign(rawDiff);
                this.activeMesh.rotation[axis] += dir * diff * 0.4;
            }
        });
    }

    checkAutoSnap() {
        if (!this.activeMesh || this.phase !== 'play') return;
        const p = this.parts[this.level];
        const dist = BABYLON.Vector3.Distance(this.activeMesh.position, p.targetPos);

        this.ensureRotationEuler();

        // === Кватернионная проверка угла: не боится оборотов и gimbal lock ===
        const currentQ = BABYLON.Quaternion.FromEulerAngles(
            this.activeMesh.rotation.x,
            this.activeMesh.rotation.y,
            this.activeMesh.rotation.z
        );
        const targetQ = BABYLON.Quaternion.FromEulerAngles(
            p.targetEuler.x,
            p.targetEuler.y,
            p.targetEuler.z
        );
        const dot = Math.abs(
            currentQ.x * targetQ.x + currentQ.y * targetQ.y +
            currentQ.z * targetQ.z + currentQ.w * targetQ.w
        );
        // Защита от NaN из-за float-ошибок
        let maxAngleDiff = Math.acos(Math.min(1, dot)) * 2;
        if (isNaN(maxAngleDiff)) maxAngleDiff = Math.PI;
        // ===================================================================

        // Позиционный магнит
        if (dist < CONFIG.MAGNET_DIST && dist > CONFIG.MAGNET_END) {
            const baseStrength = ((CONFIG.MAGNET_DIST - dist) / (CONFIG.MAGNET_DIST - CONFIG.MAGNET_END)) * 0.3;
            const strength = (this._isFlatPart ? 0.35 : 1.0) * baseStrength;

            this.activeMesh.position.x += (p.targetPos.x - this.activeMesh.position.x) * strength;
            this.activeMesh.position.z += (p.targetPos.z - this.activeMesh.position.z) * strength;
            this.activeMesh.position.y += (p.targetPos.y - this.activeMesh.position.y) * strength * 0.3;

            // Угловой магнит — только если угол ещё не в мёртвой зоне
            if (maxAngleDiff > 1.5 * Math.PI / 180) {
                ['x', 'y', 'z'].forEach(axis => {
                    const diff = angleDiff(this.activeMesh.rotation[axis], p.targetEuler[axis]);
                    if (diff < 1.0 * Math.PI / 180) return;

                    const rawDiff = normalizeAngle0(p.targetEuler[axis]) - normalizeAngle0(this.activeMesh.rotation[axis]);
                    const dir = (Math.abs(rawDiff) > Math.PI) ? -Math.sign(rawDiff) : Math.sign(rawDiff);
                    const rotStrength = this._isFlatPart ? strength * 0.4 : strength * 0.7;
                    this.activeMesh.rotation[axis] += dir * diff * rotStrength;
                });
            }
        }

        // Снап: <= вместо <, порог 0.15 вместо 0.12 (рукоятки часто чуть смещены по Y)
        if (dist <= 0.15 && maxAngleDiff <= CONFIG.SNAP_ANGLE) {
            this.doSnap();
        }
    }

    manualSnap() {
        if (this.phase !== 'play' || !this.activeMesh) return;
        const p = this.parts[this.level]; this.ensureRotationEuler();
        this.activeMesh.position = p.targetPos.clone(); this.activeMesh.rotation = p.targetEuler.clone(); this.doSnap();
    }

    doSnap() {
        if (this.phase !== 'play') return;
        this.phase = 'snapping'; this.stopTimer();


        // Очищаем кадровый автоснап
        if (this._autoSnapObs) {
            this.scene.onBeforeRenderObservable.remove(this._autoSnapObs);
            this._autoSnapObs = null;
        }

        playSnap();playSnap();
        const p = this.parts[this.level]; this.ensureRotationEuler();
        const aPos = new BABYLON.Animation('sp', 'position', 60, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        aPos.setKeys([{ frame: 0, value: this.activeMesh.position.clone() }, { frame: 10, value: p.targetPos.clone() }]);
        const targetQ = BABYLON.Quaternion.FromEulerAngles(p.targetEuler.x, p.targetEuler.y, p.targetEuler.z);
        const startQ = BABYLON.Quaternion.FromEulerAngles(this.activeMesh.rotation.x, this.activeMesh.rotation.y, this.activeMesh.rotation.z);
        this.activeMesh.rotationQuaternion = startQ;
        const aRot = new BABYLON.Animation('sr', 'rotationQuaternion', 60, BABYLON.Animation.ANIMATIONTYPE_QUATERNION, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        aRot.setKeys([{ frame: 0, value: startQ }, { frame: 10, value: targetQ }]);
        const easing = new BABYLON.QuadraticEase(); easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
        aPos.setEasingFunction(easing); aRot.setEasingFunction(easing);
        this.activeMesh.animations = [aPos, aRot];
        this.scene.beginAnimation(this.activeMesh, 0, 10, false, 1, () => {
            if (this.ghostMesh) { if (this.ghostMesh._obs) this.scene.onBeforeRenderObservable.remove(this.ghostMesh._obs); this.ghostMesh.dispose(); this.ghostMesh = null; }
            this.placedMeshes.push(this.activeMesh); this.activeMesh = null;
            const sfx = document.getElementById('snapFX');
            if (sfx) { sfx.classList.add('flash'); setTimeout(() => sfx.classList.remove('flash'), 200); }
            this.createSnapParticles(p.targetPos);
            checkAchievements('snap', { stars: this.starsEarned, timeLeft: this.timerVal, level: this.level, totalParts: this.parts.length, timeLimit: p.timeLimit, hintUsed: this.hintUsed, streakCount: this.streakCount });
            this.calcStarsAndShow();
        });
    }

    createSnapParticles(pos) {
        try {
            const ps = new BABYLON.ParticleSystem('snapParticles', 80, this.scene);
            ps.emitter = pos; ps.minEmitBox = new BABYLON.Vector3(-0.08, -0.08, -0.08); ps.maxEmitBox = new BABYLON.Vector3(0.08, 0.08, 0.08);
            ps.color1 = new BABYLON.Color4(0.3, 0.9, 0.6, 1.0); ps.color2 = new BABYLON.Color4(0.2, 0.7, 1.0, 1.0); ps.colorDead = new BABYLON.Color4(0.1, 0.3, 0.8, 0.0);
            ps.minSize = 0.03; ps.maxSize = 0.1; ps.minLifeTime = 0.4; ps.maxLifeTime = 1.0; ps.emitRate = 400;
            ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE; ps.gravity = new BABYLON.Vector3(0, 0.8, 0);
            ps.direction1 = new BABYLON.Vector3(-0.8, 1.5, -0.8); ps.direction2 = new BABYLON.Vector3(0.8, 2.5, 0.8);
            ps.minAngularSpeed = 0; ps.maxAngularSpeed = Math.PI; ps.minEmitPower = 1.5; ps.maxEmitPower = 4; ps.updateSpeed = 0.015;
            ps.targetStopDuration = 0.25; ps.start();
            setTimeout(() => ps.dispose(), 1500);
        } catch (e) { console.warn('Snap particles error:', e); }
    }

    showPreCard() {
        if (!this.parts[this.level]) { console.error('PARTS не загружены!'); return; }
        this.phase = 'pre'; this.prePhase = 0; this.quizAnswered = false; this.userChangedColor = false;
        if (this.level === 0) levelStars.length = 0;
        const p = this.parts[this.level];
        if (!p._originalColor) {
            p._originalColor = { h: p.color.h, s: p.color.s, l: p.color.l };
        }
        UIManager.setText('preSubtitle', `ИЗУЧАЕМ ДЕТАЛЬ · ${this.level + 1}/${this.parts.length}`);
        UIManager.setText('preTitle', p.name); UIManager.setText('preDesc', p.desc); UIManager.setText('previewLabel', p.name.toUpperCase());
        const hueEl = document.getElementById('colorHue'); const satEl = document.getElementById('colorSat'); const lightEl = document.getElementById('colorLight');
        if (hueEl) { hueEl.value = p.color.h; hueEl.oninput = () => this.updatePartColor(); }
        if (satEl) { satEl.value = p.color.s; satEl.oninput = () => this.updatePartColor(); }
        if (lightEl) { lightEl.value = p.color.l; lightEl.oninput = () => this.updatePartColor(); }
        const fl = document.getElementById('factsList');
        if (fl) fl.innerHTML = p.facts.map((f, i) => `<div class="factItem" id="pf${i}">${f}</div>`).join('');
        UIManager.setHTML('quizArea', '');
        const btn = document.getElementById('preBtn');
        if (btn) { btn.textContent = 'Открыть факт'; btn.style.display = 'block'; btn.onclick = () => this.preBtnClick(); }
        UIManager.show('preCard');
        UIManager.show('calibrateBtn');
        document.getElementById('manualSnapBtn').style.display = 'none';
        setTimeout(() => { this.previewManager.loadModel(p, () => this.updatePartColor()); }, 100);
    }

    preBtnClick() {
        const p = this.parts[this.level]; const btn = document.getElementById('preBtn');
        if (this.prePhase < p.facts.length) {
            const fact = document.getElementById('pf' + this.prePhase);
            if (fact) fact.style.display = 'block'; this.prePhase++;
            if (this.prePhase === p.facts.length && btn) btn.textContent = 'Ответить на вопрос';
            return;
        }
        if (this.prePhase === p.facts.length && !this.quizAnswered) { this.showQuiz(p); if (btn) btn.style.display = 'none'; return; }
        if (this.previewManager.mesh) { this.previewManager.mesh.setParent(null); this.previewManager.mesh.setEnabled(false); }
        if (this.previewManager.root) this.previewManager.root.rotation = BABYLON.Vector3.Zero();
        UIManager.hide('preCard'); UIManager.hide('calibrateBtn'); this.startPlay();
    }

    showQuiz(p) {
        const qa = document.getElementById('quizArea');
        if (!qa) return;
        qa.innerHTML = `<div class="quizQ">${p.quiz.q}</div>` +
            p.quiz.opts.map((o, i) => `<div class="quizOpt" id="qo${i}" data-quiz-index="${i}">${o}</div>`).join('');
        qa.querySelectorAll('.quizOpt').forEach(el => {
            el.addEventListener('click', (e) => this.quizAnswer(parseInt(e.target.dataset.quizIndex)));
        });
    }

    quizAnswer(i) {

        if (this.quizAnswered) return;
        playQuizSelect();  // <-- ЗВУК ВЫБОРА
        this.quizAnswered = true;        this.quizAnswered = true; const p = this.parts[this.level];
        document.querySelectorAll('.quizOpt').forEach(el => el.classList.add('locked'));
        const qo = document.getElementById('qo' + i); const qoAns = document.getElementById('qo' + p.quiz.ans);
        if (qo) qo.classList.add(i === p.quiz.ans ? 'correct' : 'wrong');
        if (i !== p.quiz.ans && qoAns) qoAns.classList.add('correct');
        const btn = document.getElementById('preBtn');
        if (btn) { btn.style.display = 'block'; btn.textContent = 'Начать сборку →'; }
        this.prePhase++;
    }

    startPlay() {
        this.phase = 'play'; this.hintsLeft = 1; this.hintUsed = false; this.updateHintPips(); this.gameShiftDown = false;
        const p = this.parts[this.level];
        UIManager.setText('lvlLabel', `ДЕТАЛЬ ${this.level + 1}/${this.parts.length}`);
        UIManager.setText('partName', p.name);
        this.starsEarned = 3; this.updateStarsHUD(3);
        this.ghostMesh = this.createGhost(p);
        this.activeMesh = this.cloneForMainScene(p.modelFile, this.level);
        this.activeMesh.name = 'active_' + this.level;
        this.activeMesh.position = new BABYLON.Vector3(-2.8, p.targetPos.y, 0.2);
        if (this.activeMesh.rotationQuaternion) this.activeMesh.rotationQuaternion = null;
        this.activeMesh.rotation = new BABYLON.Vector3(0, Math.random() * Math.PI * 2, 0);
        try {
            const bbox = this.activeMesh.getHierarchyBoundingVectors(true);
            const size = bbox.max.subtract(bbox.min);
            const maxDim = Math.max(size.x, size.y, size.z);
            const minDim = Math.min(size.x, size.y, size.z);
            this._isFlatPart = maxDim > 0 && (minDim / maxDim) < 0.3;
        } catch (e) {
            this._isFlatPart = false;
        }
        this.timerVal = p.timeLimit; this.updateTimerDisplay();
        this.timerInterval = setInterval(() => this.tickTimer(), 1000);
        const instr = document.getElementById('instrBox');
        if (instr) instr.textContent = 'ЛКМ — тащить · ПКМ — камера · Колёсико — зум · Shift+Колёсико — поворот Y · Ctrl+Колёсико — поворот X · Shift+Ctrl+Колёсико — поворот Z · Shift+ЛКМ — Y-ось';
        document.getElementById('manualSnapBtn').style.display = 'none';
        this._autoSnapObs = this.scene.onBeforeRenderObservable.add(() => {
            if (this.phase === 'play' && this.activeMesh) this.checkAutoSnap();
        });
    }

    createGhost(partDef) {
        const g = this.cloneForMainScene(partDef.modelFile, this.level);
        g.name = 'ghost';
        const mat = new BABYLON.StandardMaterial('gm_' + this.level, this.scene);
        mat.diffuseColor = new BABYLON.Color3(1, 0.85, 0.1); mat.emissiveColor = new BABYLON.Color3(0.4, 0.3, 0); mat.alpha = 0.3; mat.backFaceCulling = false;
        g.getChildMeshes().forEach(m => { m.material = mat; m.isPickable = false; });
        g.isPickable = false; g.position = partDef.targetPos.clone();
        if (g.rotationQuaternion) g.rotationQuaternion = null; g.rotation = partDef.targetEuler.clone();
        let t = 0;
        g._obs = this.scene.onBeforeRenderObservable.add(() => { t += 0.04; mat.alpha = 0.18 + 0.18 * Math.sin(t); });
        return g;
    }

    cloneForMainScene(file, partIndex) {
        const tmpl = AssetManager.getTemplate(file);
        if (!tmpl) return this.createFallbackBox(partIndex);
        const s = this.getPartScale(partIndex, this.parts);
        const clone = tmpl.root.clone('clone_' + file + '_' + Date.now());
        clone.setEnabled(true); clone.isPickable = true; clone.scaling = new BABYLON.Vector3(s, s, s);
        clone.position = BABYLON.Vector3.Zero(); clone.rotation = BABYLON.Vector3.Zero();
        if (clone.rotationQuaternion) clone.rotationQuaternion = null;
        clone.getChildMeshes().forEach(c => { c.isPickable = true; c.setEnabled(true); });
        const p = this.parts[partIndex]; const [r, g, b] = hslToRgb(p.color.h, p.color.s, p.color.l);
        paintHierarchy(clone, r, g, b);
        return clone;
    }

    createFallbackBox(partIndex) {
        const p = this.parts[partIndex || 0]; const s = this.getPartScale(partIndex || 0, this.parts);
        const box = BABYLON.MeshBuilder.CreateBox('fallback_' + partIndex, { size: 0.5 }, this.scene);
        const mat = new BABYLON.StandardMaterial('fbm' + partIndex, this.scene);
        const [r, g, b] = hslToRgb(p.color.h, p.color.s, p.color.l); mat.diffuseColor = new BABYLON.Color3(r, g, b);
        box.material = mat; box.scaling = new BABYLON.Vector3(s, s, s); return box;
    }

    tickTimer() {
        this.timerVal--; this.updateTimerDisplay();
        const p = this.parts[this.level]; const ratio = this.timerVal / p.timeLimit;
        if (ratio <= 0.66 && this.starsEarned >= 3) { this.starsEarned = 2; this.updateStarsHUD(2); }
        if (ratio <= 0.33 && this.starsEarned >= 2) { this.starsEarned = 1; this.updateStarsHUD(1); }
        if (this.timerVal <= 0) { this.stopTimer(); this.starsEarned = 1; this.updateStarsHUD(1); this.showAutoHint(); }
    }

    stopTimer() { if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; } }

    updateTimerDisplay() {
        const el = document.getElementById('timerBox');
        if (!el) return; el.textContent = this.timerVal + 's';
        el.style.color = this.timerVal <= 10 ? '#dc2626' : this.timerVal <= 20 ? '#d97706' : '#6336a0';
    }

    updateStarsHUD(n) { for (let i = 0; i < 3; i++) { const el = document.getElementById('s' + i); if (el) el.className = 'star' + (i < n ? ' lit' : ''); } }

    showAutoHint() {
        if (!this.activeMesh || !this.ghostMesh) return; const p = this.parts[this.level];
        this.ensureRotationEuler(); const origRot = this.activeMesh.rotation.clone();
        this.activeMesh.rotation = p.targetEuler.clone();
        this.activeMesh.getChildMeshes().forEach(m => { if (m.material) m.material.emissiveColor = new BABYLON.Color3(0, 0.6, 0.8); });
        this.starsEarned = 0; this.updateStarsHUD(0);
        setTimeout(() => {
            if (!this.activeMesh) return;
            this.activeMesh.rotation = origRot;
            this.activeMesh.getChildMeshes().forEach(m => { if (m.material) m.material.emissiveColor = new BABYLON.Color3(0, 0, 0); });
        }, 1500);
    }

    updateHintPips() {
        const btn = document.getElementById('hintBtn');
        if (btn) btn.textContent = this.hintsLeft > 0 ? `Подсказка (${this.hintsLeft})` : 'Подсказок нет';
    }

    calcStarsAndShow() {
        this.totalScore += this.starsEarned;
        if (this.starsEarned > 0) playStar();
        if (this.starsEarned === 3 && !this.hintUsed) this.streakCount++; else this.streakCount = 0;
        UIManager.show('endCard');
        UIManager.setText('endTitle', this.level === this.parts.length - 1 ? 'Дрон собран!' : 'Деталь установлена!');
        UIManager.setText('endSub', `Счёт: ${this.totalScore} · ${this.starsEarned} из 3 звёзд`);
        UIManager.setText('streakMsg', this.streakCount >= 2 ? `🔥 Серия ${this.streakCount}` : '');
        const endBtn = document.getElementById('endBtn');
        if (endBtn) endBtn.textContent = this.level === this.parts.length - 1 ? '🚀 Запустить дрон →' : 'Следующая деталь →';
        ['es0', 'es1', 'es2'].forEach((id, i) => {
            const el = document.getElementById(id); if (el) { el.className = 'endStar'; if (i < this.starsEarned) setTimeout(() => el.classList.add('lit'), 300 + i * 200); }
        });
        document.getElementById('manualSnapBtn').style.display = 'none';
    }

    nextLevel() {
        UIManager.hide('endCard');
        if (this.level < this.parts.length - 1) { this.level++; this.showPreCard(); }
        else { checkAchievements('complete'); playWin(); this.showAchievementsScreen(); }
    }

    resetPartPosition() {
        if (this.phase !== 'play' || !this.activeMesh) return;
        const p = this.parts[this.level];
        this.activeMesh.position = new BABYLON.Vector3(-2.8, p.targetPos.y, 0.2);
        if (this.activeMesh.rotationQuaternion) this.activeMesh.rotationQuaternion = null;
        this.activeMesh.rotation = new BABYLON.Vector3(0, Math.random() * Math.PI * 2, 0);
    }

    useHint() {
        if (this.hintsLeft <= 0 || this.phase !== 'play') return;
        this.hintsLeft--; this.hintUsed = true; this.updateHintPips();
        this.starsEarned = 0; this.updateStarsHUD(0); this.showAutoHint();
    }

    updatePartColor() {
        const hueEl = document.getElementById('colorHue'); const satEl = document.getElementById('colorSat'); const lightEl = document.getElementById('colorLight');
        if (!hueEl || !satEl || !lightEl) return;
        const h = parseInt(hueEl.value); const s = parseInt(satEl.value); const l = parseInt(lightEl.value);
        const p = this.parts[this.level];
        if (p._originalColor && !this.userChangedColor) {
            const orig = p._originalColor;
            if (h !== orig.h || s !== orig.s || l !== orig.l) { this.userChangedColor = true; checkAchievements('color'); }
        }
        UIManager.setText('hueValue', h + '°'); UIManager.setText('satValue', s + '%'); UIManager.setText('lightValue', l + '%');
        const [r, g, b] = hslToRgb(h, s, l);
        const hexColor = '#' + [r, g, b].map(x => { const hex = Math.round(x * 255).toString(16); return hex.length === 1 ? '0' + hex : hex; }).join('');
        const colorPreview = document.getElementById('colorPreview');
        if (colorPreview) colorPreview.style.backgroundColor = hexColor;
        p.color = { h, s, l };
        if (this.previewManager.mesh && !this.previewManager.mesh.isDisposed()) paintHierarchy(this.previewManager.mesh, r, g, b);
        if (this.activeMesh && !this.activeMesh.isDisposed()) paintHierarchy(this.activeMesh, r, g, b);
    }

    showAchievementsScreen() {
        const screen = document.getElementById('achievementsScreen');
        const list = document.getElementById('achievementsList');
        if (!screen || !list) return;
        list.innerHTML = '';
        import('../data/achievements.js').then(({ ACHIEVEMENTS }) => {
            ACHIEVEMENTS.forEach((ach, index) => {
                const isEarned = ach.unlocked;
                const item = document.createElement('div');
                item.className = 'ach-item ' + (isEarned ? 'ach-earned' : 'ach-locked');
                item.innerHTML = `<div class="ach-medal">${ach.icon}</div><div class="ach-text"><div class="ach-name">${ach.name}</div><div class="ach-desc">${ach.desc}</div></div><div class="ach-check">${isEarned ? '✓' : '○'}</div>`;
                list.appendChild(item);
                setTimeout(() => item.classList.add('ach-visible'), 100 + index * 120);
            });
        });
        screen.classList.add('active');
    }

    hideAchievementsScreen() {
        const screen = document.getElementById('achievementsScreen');
        if (screen) screen.classList.remove('active');
    }

    restart() {
        if (this._autoSnapObs) {
            this.scene?.onBeforeRenderObservable.remove(this._autoSnapObs);
            this._autoSnapObs = null;
        }
        this.level = 0; this.totalScore = 0; this.streakCount = 0; this.hintsLeft = 1; this.hintUsed = false;
        this._isFlatPart = false; // <-- добавь
        this.placedMeshes.forEach(m => { if (m && !m.isDisposed()) m.dispose(); });
        this.placedMeshes = [];
        if (this.activeMesh && !this.activeMesh.isDisposed()) { this.activeMesh.dispose(); this.activeMesh = null; }
        if (this.ghostMesh && !this.ghostMesh.isDisposed()) { this.ghostMesh.dispose(); this.ghostMesh = null; }
        this.updateHintPips(); this.showPreCard();
    }

    exit() {
        super.exit();
        this.stopTimer();

        if (this._autoSnapObs) {
            this.scene?.onBeforeRenderObservable.remove(this._autoSnapObs);
            this._autoSnapObs = null;
        }

        if (this._wheelHandler) {
            window.removeEventListener('wheel', this._wheelHandler, { capture: true });
            this._wheelHandler = null;
        }
        super.exit();
        this.stopTimer();

        // Удаляем глобальный wheel listener
        if (this._wheelHandler) {
            window.removeEventListener('wheel', this._wheelHandler, { capture: true });
            this._wheelHandler = null;
        }
        this.engine?.stopRenderLoop();
        this.scene?.dispose();
        this.engine?.dispose();
        this.engine = null;
        this.scene = null;
        this.camera = null;
        this.placedMeshes = [];
        this.activeMesh = null;
        this.ghostMesh = null;
    }
}
