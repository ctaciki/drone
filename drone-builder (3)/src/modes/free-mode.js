import { Mode } from './mode.js';
import { hslToRgb } from '../utils/math.js';

export class FreeMode extends Mode {
    constructor(parts, getPartScale) {
        super('free');
        this.parts = parts;
        this.getPartScale = getPartScale;
        this.engine = null;
        this.scene = null;
        this.hl = null;
        this.camera = null;
        this.loadedParts = [];
        this.listContainer = null;
    }

    enter() {
        super.enter();
        const canvas = document.getElementById('freeModeCanvas');
        if (!canvas) return;
        if (!this.parts.length) { alert('Ошибка: данные деталей не загружены.'); return; }

        this.engine = new BABYLON.Engine(canvas, true, { antialias: true, preserveDrawingBuffer: true });
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.clearColor = new BABYLON.Color4(0.94, 0.98, 0.99, 1);

        this.camera = new BABYLON.ArcRotateCamera('freeCam', -Math.PI / 2, Math.PI / 2.8, 8, new BABYLON.Vector3(0, 0.5, 0), this.scene);
        this.camera.attachControl(canvas, true);
        this.camera.wheelPrecision = 40;
        this.camera.lowerRadiusLimit = 2;
        this.camera.upperRadiusLimit = 20;
        this.camera.minZ = 0.05;

        const hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), this.scene);
        hemi.intensity = 0.95; hemi.groundColor = new BABYLON.Color3(0.92, 0.94, 0.96);
        const dir = new BABYLON.DirectionalLight('dir', new BABYLON.Vector3(-1, -2, -1), this.scene);
        dir.intensity = 0.6; dir.diffuse = new BABYLON.Color3(1, 0.98, 0.95);

        this.hl = new BABYLON.HighlightLayer('hl', this.scene);

        const ground = BABYLON.MeshBuilder.CreateGround('g', { width: 20, height: 20 }, this.scene);
        const gMat = new BABYLON.StandardMaterial('gMat', this.scene);
        gMat.diffuseColor = new BABYLON.Color3(0.82, 0.88, 0.92);
        gMat.wireframe = true; gMat.alpha = 0.25;
        ground.material = gMat; ground.position.y = -0.5; ground.isPickable = false;

        this.loadAllParts();

        canvas.addEventListener('pointerdown', () => {
            const pick = this.scene.pick(this.scene.pointerX, this.scene.pointerY);
            if (!pick.hit || !pick.pickedMesh?.metadata?.part) {
                this.clearFocus();
                this.hideInfo();
            }
        });

        this.buildPartsList(this.parts);
        this.engine.runRenderLoop(() => this.scene.render());
        window.addEventListener('resize', this.onResize);
        setTimeout(() => this.engine.resize(), 100);
    }

    async loadAllParts() {
        const rootUrl = './models/';
        let loadedCount = 0, failCount = 0;
        const globalScale = this.getPartScale ? 0.5 : 1.0;

        for (let i = 0; i < this.parts.length; i++) {
            const p = this.parts[i];
            let root = null, isFallback = false;
            try {
                const result = await BABYLON.SceneLoader.ImportMeshAsync('', rootUrl, p.modelFile, this.scene);
                root = result.meshes.find(m => m.name === '__root__') || result.meshes[0];
            } catch (e) { console.warn('GLB не загрузился:', p.modelFile, e.message); }

            if (!root) {
                failCount++;
                root = BABYLON.MeshBuilder.CreateBox('fb_' + i, { size: 0.8 }, this.scene);
                const fMat = new BABYLON.StandardMaterial('fbm_' + i, this.scene);
                fMat.diffuseColor = new BABYLON.Color3(0.6, 0.63, 0.66);
                fMat.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.06);
                root.material = fMat; isFallback = true;
            }

            const s = (p.scale || 1.0) * globalScale;
            root.scaling = new BABYLON.Vector3(s, s, s);
            root.position = p.targetPos.clone();

            if (!isFallback) {
                root.rotationQuaternion = null; root.rotation = BABYLON.Vector3.Zero();
                if (p.targetEuler) {
                    root.rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(p.targetEuler.y, p.targetEuler.x, p.targetEuler.z);
                }
            }
            this.setPartAppearance(root, i, 'normal');
            const mark = (m) => { if (m instanceof BABYLON.Mesh) { m.isPickable = true; m.metadata = { part: p, rootMesh: root }; } };
            mark(root); root.getDescendants().forEach(mark); root.metadata = { part: p, rootMesh: root };
            this.loadedParts.push({ root, part: p, index: i });
            loadedCount++;
        }
        console.log('Итого: GLB =', loadedCount - failCount, 'fallback =', failCount);
    }

    setPartAppearance(root, idx, mode) {
        const p = this.parts[idx];
        const [r, g, b] = hslToRgb(p.color.h, p.color.s, p.color.l);
        const base = new BABYLON.Color3(r, g, b);
        let col, em, alpha;
        if (mode === 'normal') { col = base; em = new BABYLON.Color3(0, 0, 0); alpha = 1.0; }
        else if (mode === 'selected') { col = new BABYLON.Color3(Math.min(1, r * 1.15 + 0.05), Math.min(1, g * 1.15 + 0.05), Math.min(1, b * 1.15 + 0.05)); em = new BABYLON.Color3(0.12, 0.10, 0.04); alpha = 1.0; }
        else if (mode === 'dimmed') { col = new BABYLON.Color3(r * 0.35, g * 0.35, b * 0.35); em = new BABYLON.Color3(0, 0, 0); alpha = 0.06; }

        const apply = (m) => {
            if (!(m instanceof BABYLON.Mesh)) return;
            if (!m.material) return;
            if (!m.material._freeModeClone) {
                m.material = m.material.clone(m.name + '_fm');
                m.material._freeModeClone = true;
                m.material.needDepthPrePass = true;
                m.material.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
            }
            if (m.material.diffuseColor !== undefined) m.material.diffuseColor = col.clone();
            if (m.material.albedoColor !== undefined) m.material.albedoColor = col.clone();
            if (m.material.emissiveColor !== undefined) m.material.emissiveColor = em.clone();
            m.material.alpha = alpha;
        };
        apply(root); root.getDescendants().forEach(apply);
    }

    setFocus(idx) {
        this.loadedParts.forEach((lp, i) => {
            if (i === idx) { this.setPartAppearance(lp.root, i, 'selected'); this.addHighlight(lp.root); }
            else { this.setPartAppearance(lp.root, i, 'dimmed'); this.removeHighlight(lp.root); }
        });
    }

    clearFocus() {
        this.loadedParts.forEach((lp, i) => { this.setPartAppearance(lp.root, i, 'normal'); this.removeHighlight(lp.root); });
        if (this.listContainer) this.listContainer.querySelectorAll('.fmp-item').forEach(el => el.classList.remove('active'));
    }

    addHighlight(root) { if (!this.hl) return; try { this.hl.addMesh(root, BABYLON.Color3.Teal()); } catch(e) {} }
    removeHighlight(root) { if (!this.hl) return; try { this.hl.removeMesh(root); } catch(e) {} }

    buildPartsList(parts) {
        this.listContainer = document.getElementById('freeModePartsList');
        if (!this.listContainer) return;
        this.listContainer.innerHTML = '';
        parts.forEach((p, i) => {
            const item = document.createElement('div');
            item.className = 'fmp-item';
            item.dataset.index = i;
            item.innerHTML = `<span class="fmp-num">${i + 1}</span><span class="fmp-name">${p.name}</span>`;
            item.addEventListener('click', () => this.selectPart(i));
            this.listContainer.appendChild(item);
        });
    }

    showInfo(part) {
        const nameEl = document.getElementById('freeModePartName');
        const descEl = document.getElementById('freeModePartDesc');
        const factsEl = document.getElementById('freeModeFacts');
        const quizEl = document.getElementById('freeModeQuiz');
        const infoEl = document.getElementById('freeModeInfo');
        if (nameEl) nameEl.textContent = part.name;
        if (descEl) descEl.textContent = part.desc;
        if (factsEl) factsEl.innerHTML = (part.facts || []).map(f => `<li>${f}</li>`).join('');
        if (quizEl && part.quiz) {
            quizEl.innerHTML = `<div class="fmq-q">${part.quiz.q}</div><div class="fmq-opts">${part.quiz.opts.map((o, idx) => `<div class="fmq-opt ${idx === part.quiz.ans ? 'correct' : ''}">${o}</div>`).join('')}</div>`;
        }
        if (infoEl) infoEl.classList.add('active');
    }

    hideInfo() {
        const infoEl = document.getElementById('freeModeInfo');
        if (infoEl) infoEl.classList.remove('active');
    }

    selectPart(index) {
        if (index < 0 || index >= this.loadedParts.length) return;
        if (this.listContainer) {
            this.listContainer.querySelectorAll('.fmp-item').forEach((el, i) => el.classList.toggle('active', i === index));
        }
        this.setFocus(index);
        this.showInfo(this.loadedParts[index].part);
    }

    onResize = () => { if (this.engine) this.engine.resize(); };

    exit() {
        super.exit();
        if (this.engine) {
            window.removeEventListener('resize', this.onResize);
            this.engine.stopRenderLoop();
            this.scene.dispose(); this.engine.dispose();
            this.engine = null; this.scene = null; this.hl = null; this.camera = null;
        }
        this.loadedParts = [];
        if (this.listContainer) this.listContainer.innerHTML = '';
        this.hideInfo();
    }
}
