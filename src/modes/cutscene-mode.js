import { Mode } from './mode.js';

export class CutsceneMode extends Mode {
    constructor() {
        super('cutscene');
        this.engine = null;
        this.scene = null;
        this.fpvCam = null;
        this.cutsceneActive = false;
        this.impactStart = null;
        this.SPEED_MULT = 2;
    }

    enter() {
        super.enter();
        const canvas = document.getElementById('cutsceneCanvas');
        if (!canvas) { this.skip(); return; }

        this.engine = new BABYLON.Engine(canvas, true, { antialias: true, preserveDrawingBuffer: true });
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.clearColor = new BABYLON.Color4(0.45, 0.72, 0.90, 1);
        this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        this.scene.fogDensity = 0.008;
        this.scene.fogColor = new BABYLON.Color3(0.55, 0.78, 0.92);

        this.fpvCam = new BABYLON.UniversalCamera('fpv', new BABYLON.Vector3(0, 12, -80), this.scene);
        this.fpvCam.fov = 1.35;
        this.fpvCam.minZ = 0.1;
        this.fpvCam.inertia = 0.7;

        const hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), this.scene);
        hemi.intensity = 0.6;
        hemi.diffuse = new BABYLON.Color3(1, 0.97, 0.93);
        hemi.groundColor = new BABYLON.Color3(0.35, 0.55, 0.30);

        const sun = new BABYLON.DirectionalLight('sun', new BABYLON.Vector3(-0.6, -1, -0.3), this.scene);
        sun.intensity = 1.4;
        sun.diffuse = new BABYLON.Color3(1, 0.95, 0.82);

        try {
            const pipeline = new BABYLON.DefaultRenderingPipeline('cutscenePipeline', true, this.scene, [this.fpvCam]);
            if (pipeline) {
                pipeline.bloomEnabled = true; pipeline.bloomThreshold = 0.7; pipeline.bloomWeight = 0.35;
                pipeline.bloomKernel = 64; pipeline.bloomScale = 0.5;
                pipeline.grainEnabled = true; pipeline.grainIntensity = 12; pipeline.grainAnimated = true;
                pipeline.chromaticAberrationEnabled = true; pipeline.chromaticAberration.aberrationAmount = 10;
                pipeline.chromaticAberration.radialIntensity = 0.5;
                pipeline.vignetteEnabled = true; pipeline.vignetteWeight = 1.8;
                pipeline.vignetteColor = new BABYLON.Color4(0, 0, 0, 1);
                pipeline.vignetteBlendMode = BABYLON.VignetteBlendMode.Multiply;
            }
        } catch (e) { console.warn('Post-processing не поддерживается:', e); }

        try {
            const gl = new BABYLON.GlowLayer('glow', this.scene);
            gl.intensity = 0.4;
        } catch (e) { console.warn('GlowLayer не поддерживается:', e); }

        this.buildWorld();
        this.cutsceneActive = true;

        setTimeout(() => {
            document.getElementById('lbTop')?.classList.add('open');
            document.getElementById('lbBot')?.classList.add('open');
        }, 300);

        this.engine.runRenderLoop(() => { if (this.cutsceneActive && this.scene) this.scene.render(); });
        window.addEventListener('resize', () => this.engine?.resize());
        this.runFlight();
    }

    buildWorld() {
        const ground = BABYLON.MeshBuilder.CreateGround('g', { width: 600, height: 600, subdivisions: 120, updatable: true }, this.scene);
        const pos = ground.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        for (let i = 0; i < pos.length; i += 3) {
            const x = pos[i], z = pos[i+2];
            let h = 0;
            const ridgeDist = this.distToSegment(x, z, -5, 0, 15, 40);
            if (ridgeDist < 25) h += 14 * Math.exp(-ridgeDist / 12);
            h += Math.sin(x * 0.06) * Math.cos(z * 0.05) * 2.0;
            h += Math.sin(x * 0.18 + z * 0.12) * 0.8;
            h += Math.sin(x * 0.04 - z * 0.03) * 1.5;
            h += (Math.random() - 0.5) * 0.15;
            pos[i+1] = h;
        }
        ground.updateVerticesData(BABYLON.VertexBuffer.PositionKind, pos);
        ground.computeWorldMatrix(true);
        const gMat = new BABYLON.StandardMaterial('gm', this.scene);
        gMat.diffuseColor = new BABYLON.Color3(0.33, 0.55, 0.28);
        gMat.specularColor = new BABYLON.Color3(0.02, 0.02, 0.02);
        gMat.roughness = 0.9;
        ground.material = gMat;

        for (let i = 0; i < 70; i++) {
            const a = Math.random() * Math.PI * 2;
            const d = 70 + Math.random() * 140;
            const tx = Math.cos(a) * d, tz = Math.sin(a) * d;
            if (Math.abs(tx) < 15 && tz > -60 && tz < 60) continue;
            this.makeTree(tx, tz, 0.8 + Math.random() * 0.7, false);
        }
        this.makeTree(28, 20, 1.2, false);
        this.makeTree(18, 35, 1.1, false);

        for (let i = 0; i < 15; i++) {
            this.makeCloud((Math.random()-0.5)*250, 35 + Math.random()*25, 30 + Math.random()*140);
        }
    }

    distToSegment(px, py, ax, ay, bx, by) {
        const dx = bx-ax, dy = by-ay;
        const len2 = dx*dx + dy*dy;
        if (len2 === 0) return Math.hypot(px-ax, py-ay);
        const t = Math.max(0, Math.min(1, ((px-ax)*dx + (py-ay)*dy) / len2));
        return Math.hypot(px-(ax+t*dx), py-(ay+t*dy));
    }

    makeTree(x, z, scale) {
        const root = new BABYLON.TransformNode('tree_'+x, this.scene);
        root.position.set(x, 0, z);
        const trunkH = (5 + Math.random()*3) * scale;
        const trunk = BABYLON.MeshBuilder.CreateCylinder('trk', {
            diameterTop: 0.30*scale, diameterBottom: 0.85*scale, height: trunkH, tessellation: 12
        }, this.scene);
        trunk.position.y = trunkH/2; trunk.parent = root;
        const barkMat = new BABYLON.StandardMaterial('bark', this.scene);
        barkMat.diffuseColor = new BABYLON.Color3(0.32, 0.20, 0.12);
        barkMat.specularColor = new BABYLON.Color3(0.03, 0.03, 0.03);
        trunk.material = barkMat;
        const leafColors = [
            new BABYLON.Color3(0.12, 0.42, 0.12), new BABYLON.Color3(0.16, 0.50, 0.14),
            new BABYLON.Color3(0.10, 0.38, 0.10), new BABYLON.Color3(0.20, 0.48, 0.16),
            new BABYLON.Color3(0.14, 0.44, 0.20),
        ];
        const levels = 4 + Math.floor(Math.random()*2);
        for (let lv = 0; lv < levels; lv++) {
            const count = 4 + Math.floor(Math.random()*3);
            for (let s = 0; s < count; s++) {
                const sz = (3.0 + Math.random()*1.8) * scale * (1 - lv*0.08);
                const leaf = BABYLON.MeshBuilder.CreateSphere('lf', { diameter: sz, segments: 8 }, this.scene);
                const ang = (s/count)*Math.PI*2 + Math.random()*0.8;
                const rad = (0.8 + Math.random()*0.6) * scale;
                leaf.position.set(Math.cos(ang)*rad, trunkH - 1.0 + lv*1.8*scale + (Math.random()-0.5)*0.6, Math.sin(ang)*rad);
                leaf.scaling.set(0.9+Math.random()*0.4, 0.65+Math.random()*0.3, 0.9+Math.random()*0.4);
                const lm = new BABYLON.StandardMaterial('lm', this.scene);
                lm.diffuseColor = leafColors[Math.floor(Math.random()*leafColors.length)];
                lm.specularColor = new BABYLON.Color3(0.02, 0.04, 0.02);
                leaf.material = lm; leaf.parent = root;
            }
        }
        const col = BABYLON.MeshBuilder.CreateBox('col', { width: 6*scale, height: (trunkH+12)*scale, depth: 6*scale }, this.scene);
        col.position.set(x, (trunkH+12)*scale/2, z); col.isVisible = false;
        return col;
    }

    makeCloud(x, y, z) {
        const root = new BABYLON.TransformNode('cloud', this.scene);
        root.position.set(x, y, z);
        const parts = 5 + Math.floor(Math.random()*4);
        for (let i = 0; i < parts; i++) {
            const c = BABYLON.MeshBuilder.CreateSphere('cl', { diameter: 10 + Math.random()*8, segments: 10 }, this.scene);
            c.position.set((Math.random()-0.5)*16, (Math.random()-0.5)*3, (Math.random()-0.5)*10);
            c.scaling.set(2.2+Math.random()*0.8, 0.8+Math.random()*0.3, 1.8+Math.random()*0.6);
            const cm = new BABYLON.StandardMaterial('cm', this.scene);
            cm.diffuseColor = new BABYLON.Color3(0.95, 0.97, 1.0);
            cm.alpha = 0.55 + Math.random()*0.15;
            c.material = cm; c.parent = root;
        }
    }

    runFlight() {
        let t = 0, phase = 'intro', impactDone = false, bounceT = 0;
        let tumbleV = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 };
        this.fpvCam.position.set(0, 10, -80); this.fpvCam.rotation.set(0, 0, 0);

        setTimeout(() => {
            const ct = document.getElementById('cinTitle');
            if (ct) ct.style.opacity = '1';
            setTimeout(() => { if (ct) ct.style.opacity = '0'; }, 3000);
        }, 1500);

        const interval = setInterval(() => {
            if (!this.cutsceneActive) { clearInterval(interval); return; }
            t += 0.08;
            const camPos = this.fpvCam.position;
            const camRot = this.fpvCam.rotation;
            const breathY = Math.sin(t * 1.2) * 0.08;
            const breathX = Math.sin(t * 0.7) * 0.02;
            const breathRoll = Math.sin(t * 1.5) * 0.005;

            switch (phase) {
                case 'intro': {
                    camPos.z += (0.3 + t * 0.08)*2;
                    camPos.y = 10 + Math.sin(t * 0.8) * 0.3 + breathY;
                    camPos.x += Math.sin(t * 0.5) * 0.01 + breathX;
                    camRot.x = -0.05 + Math.sin(t*0.7)*0.01;
                    camRot.y = Math.sin(t*0.3)*0.015; camRot.z = breathRoll;
                    this.setHUD(12 + t*0.5, 10 + t*0.05, 94);
                    if (t > 3) { phase = 'straight'; this.setMode('СТАБИЛЬНЫЙ ПОЛЁТ'); }
                    break;
                }
                case 'straight': {
                    const sp = 0.55 * this.SPEED_MULT;
                    camPos.z += sp;
                    camPos.y = 12 + Math.sin(t*1.8)*0.15 + breathY;
                    camPos.x += Math.sin(t*1.2)*0.008 + breathX;
                    camRot.x = -0.04 + Math.sin(t*0.9)*0.012;
                    camRot.y = Math.sin(t*0.4)*0.018;
                    camRot.z = Math.sin(t*1.3)*0.008 + breathRoll;
                    this.setHUD(18, Math.round(camPos.y), 91);
                    if (camPos.z > -30) { phase = 'approach'; this.setMode('↻ МАНЁВР — ОБЛЁТ'); }
                    break;
                }
                case 'approach': {
                    camPos.z += 0.45 * this.SPEED_MULT;
                    camPos.x -= 0.18 * this.SPEED_MULT;
                    camPos.y = 13 + Math.sin(t*2)*0.1 + breathY;
                    camRot.z = 0.06 + breathRoll; camRot.y = -0.05; camRot.x = -0.03;
                    this.setHUD(20, Math.round(camPos.y), 88);
                    if (camPos.z > -10) { phase = 'crest'; this.setMode('↗ ПОДЪЁМ'); }
                    break;
                }
                case 'crest': {
                    camPos.z += 0.4 * this.SPEED_MULT;
                    camPos.x += 0.15 * this.SPEED_MULT;
                    camPos.y += 0.06 * this.SPEED_MULT;
                    camRot.z *= 0.9; camRot.y += 0.008; camRot.x = -0.06 - Math.sin(t)*0.01;
                    this.setHUD(18, Math.round(camPos.y), 86);
                    if (camPos.z > 5) { phase = 'reveal'; }
                    break;
                }
                case 'reveal': {
                    camPos.z += 0.42 * this.SPEED_MULT;
                    camPos.x += 0.28 * this.SPEED_MULT;
                    camPos.y -= 0.04 * this.SPEED_MULT;
                    const w = document.getElementById('hudWarning');
                    if (w && (!w.style.opacity || w.style.opacity === '0')) this.triggerWarning();
                    const shake = Math.max(0, (camPos.z - 5) / 25) * 0.04;
                    camRot.z = -0.18 + (Math.random()-0.5)*shake;
                    camRot.y += 0.022 + (Math.random()-0.5)*shake*0.5;
                    camRot.x = -0.02 + (Math.random()-0.5)*shake*0.3;
                    this.setHUD(22, Math.round(camPos.y), 83);
                    const dx = camPos.x - 22, dz = camPos.z - 28;
                    const dist = Math.sqrt(dx*dx + dz*dz);
                    if ((dist < 4 || camPos.z > 32) && !impactDone) {
                        impactDone = true; phase = 'impact';
                        this.doImpact(camPos, t);
                    }
                    break;
                }
                case 'impact': {
                    if (!this.impactStart) this.impactStart = t;
                    const elapsed = t - this.impactStart;
                    if (elapsed < 0.10) {
                        camPos.x += (Math.random()-0.5)*0.8;
                        camPos.y += (Math.random()-0.5)*0.7;
                        camPos.z += (Math.random()-0.5)*0.5;
                        camRot.x += (Math.random()-0.5)*0.4;
                        camRot.y += (Math.random()-0.5)*0.4;
                        camRot.z += (Math.random()-0.5)*0.35;
                        this.setHUD(0, Math.round(camPos.y), 42);
                    } else {
                        tumbleV = { x: -0.35 + Math.random()*0.1, y: 0.22, z: -0.28, rx: 0.14, ry: -0.18, rz: 0.24 };
                        bounceT = t; phase = 'bounce';
                        this.setMode('💥 СТОЛКНОВЕНИЕ // ПОТЕРЯ УПРАВЛЕНИЯ');
                        const w = document.getElementById('hudWarning');
                        if (w) w.style.opacity = '0';
                    }
                    break;
                }
                case 'bounce': {
                    tumbleV.y -= 0.012;
                    camPos.x += tumbleV.x; camPos.y += tumbleV.y; camPos.z += tumbleV.z;
                    camRot.x += tumbleV.rx; camRot.y += tumbleV.ry; camRot.z += tumbleV.rz;
                    tumbleV.x *= 0.95; tumbleV.z *= 0.95;
                    this.setHUD(0, Math.max(0, Math.round(camPos.y)), 18);
                    if (camPos.y < 6) { phase = 'fall'; this.setMode('⚠ ПАДЕНИЕ'); }
                    break;
                }
                case 'fall': {
                    camPos.y -= 0.5 + (8 - camPos.y) * 0.06;
                    camPos.x += (Math.random()-0.5)*0.5; camRot.x += 0.1; camRot.z += 0.07;
                    this.setHUD(0, Math.max(0, Math.round(camPos.y)), 5);
                    if (camPos.y < 1.5) { phase = 'crash'; this.doCrash(); }
                    break;
                }
                case 'crash': case 'end': break;
            }

            const horizon = document.getElementById('horizonLine');
            if (horizon) {
                horizon.style.transform = `translate(-50%, -50%) rotate(${-camRot.z * 30}deg) translateY(${camRot.x * 60}px)`;
            }
            const altPct = Math.min(100, Math.max(0, (camPos.y / 20) * 100));
            const altBar = document.getElementById('altBar');
            if (altBar) altBar.style.height = altPct + '%';
        }, 16);
    }

    setHUD(spd, alt, bat) {
        const s = document.getElementById('hudSpd');
        const a = document.getElementById('hudAlt');
        const b = document.getElementById('hudBat');
        const an = document.getElementById('altNum');
        if (s) s.textContent = Math.max(0, Math.round(spd)) + ' m/s';
        if (a) a.textContent = Math.max(0, Math.round(alt)) + ' m';
        if (b) b.textContent = Math.max(0, Math.round(bat)) + '%';
        if (an) an.textContent = Math.max(0, Math.round(alt)) + 'm';
        const sig = document.getElementById('sigVal');
        const sigPct = document.getElementById('sigPct');
        if (sig && bat < 50) { sig.textContent = '██░░'; if (sigPct) sigPct.textContent = '34%'; }
        if (sig && bat < 20) { sig.textContent = '█░░░'; if (sigPct) sigPct.textContent = '12%'; }
        if (sig && bat <= 5) { sig.textContent = '░░░░'; if (sigPct) sigPct.textContent = '0%'; }
    }

    setMode(text) {
        const el = document.getElementById('hudModeLabel');
        if (el) el.textContent = text;
    }

    triggerWarning() {
        const w = document.getElementById('hudWarning');
        if (!w) return;
        w.style.opacity = '1'; w.style.color = '#ff4444';
        let blinks = 0;
        const bInt = setInterval(() => {
            w.style.opacity = blinks % 2 === 0 ? '0' : '1';
            blinks++;
            if (blinks > 6) { clearInterval(bInt); w.style.opacity = '1'; }
        }, 120);
    }

    doImpact(pos) {
        const fl = document.getElementById('flashOverlay');
        if (fl) { fl.style.opacity = '1'; setTimeout(() => { fl.style.transition = 'opacity 0.3s'; fl.style.opacity = '0'; }, 80); }
        const cs = document.getElementById('cutscene');
        if (cs) { cs.classList.add('shake-hard'); setTimeout(() => cs.classList.remove('shake-hard'), 600); }
        try {
            const flash = new BABYLON.PointLight('ifl', pos.clone(), this.scene);
            flash.diffuse = new BABYLON.Color3(1, 0.8, 0.4); flash.intensity = 50; flash.range = 80;
            let flashFrame = 0;
            const flashObs = this.scene.onBeforeRenderObservable.add(() => {
                flashFrame++; flash.intensity *= 0.92;
                if (flashFrame > 30) { flash.dispose(); this.scene.onBeforeRenderObservable.remove(flashObs); }
            });
        } catch (e) { console.warn('Вспышка не создана:', e); }
        try {
            for (let i = 0; i < 100; i++) {
                const size = 0.05 + Math.random() * 0.25;
                const isLeaf = Math.random() > 0.5;
                const d = BABYLON.MeshBuilder.CreateBox('d'+i, { size: size }, this.scene);
                d.position = pos.clone();
                const spread = new BABYLON.Vector3((Math.random()-0.5)*8, Math.random()*6, (Math.random()-0.5)*8 + 3);
                d.position.addInPlace(spread);
                const dm = new BABYLON.StandardMaterial('dm', this.scene);
                if (isLeaf) dm.diffuseColor = new BABYLON.Color3(0.18 + Math.random()*0.1, 0.45 + Math.random()*0.1, 0.14);
                else dm.diffuseColor = new BABYLON.Color3(0.22 + Math.random()*0.08, 0.22 + Math.random()*0.08, 0.25 + Math.random()*0.08);
                d.material = dm;
                const vel = new BABYLON.Vector3((Math.random()-0.5)*0.3, Math.random()*0.4, (Math.random()-0.5)*0.3);
                let life = 0;
                const obs = this.scene.onBeforeRenderObservable.add(() => {
                    life += 0.016; vel.y -= 0.015;
                    d.position.addInPlace(vel);
                    d.rotation.x += vel.z * 2; d.rotation.z -= vel.x * 2;
                    if (life > 3 || d.position.y < 0) { d.dispose(); this.scene.onBeforeRenderObservable.remove(obs); }
                });
            }
        } catch (e) { console.warn('Обломки не созданы:', e); }
        const co = document.getElementById('chromaOverlay');
        if (co) { co.classList.add('show'); setTimeout(() => co.classList.remove('show'), 1200); }
        this.impactStart = null;
    }

    doCrash() {
        const fl = document.getElementById('flashOverlay');
        if (fl) { fl.style.transition = 'none'; fl.style.opacity = '0.8'; setTimeout(() => { fl.style.transition = 'opacity 0.5s'; fl.style.opacity = '0'; }, 100); }
        const cs = document.getElementById('cutscene');
        if (cs) { cs.classList.add('shake-hard'); setTimeout(() => cs.classList.remove('shake-hard'), 700); }
        const cg = document.getElementById('crackedGlass');
        const sn = document.getElementById('staticNoise');
        if (cg) cg.classList.add('show'); if (sn) sn.classList.add('show');
        this.setMode('⚠ СИГНАЛ ПОТЕРЯН');
        const hml = document.getElementById('hudModeLabel');
        if (hml) hml.style.color = '#ff4444';
        const fh = document.getElementById('fpvHud');
        if (fh) fh.style.transition = 'opacity 2s';
        setTimeout(() => { if (fh) fh.style.opacity = '0.1'; }, 500);
        setTimeout(() => this.endCutscene(), 2800);
    }

    endCutscene() {
        this.cutsceneActive = false;
        const cs = document.getElementById('cutscene');
        if (cs) {
            cs.style.transition = 'opacity 1.5s ease'; cs.style.opacity = '0';
            setTimeout(() => {
                cs.style.display = 'none';
                const cr = document.getElementById('crashReport');
                if (cr) cr.classList.add('active');
            }, 1500);
        }
    }

    skip() {
        this.cutsceneActive = false;
        const cs = document.getElementById('cutscene');
        if (cs) cs.style.display = 'none';
        const cr = document.getElementById('crashReport');
        if (cr) cr.classList.add('active');
    }

    exit() {
        super.exit();
        this.cutsceneActive = false;
        this.engine?.stopRenderLoop();
        this.scene?.dispose();
        this.engine?.dispose();
        this.engine = null; this.scene = null; this.fpvCam = null;
    }
}