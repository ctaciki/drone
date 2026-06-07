import { paintHierarchy, centerMeshOnPodium } from '../utils/babylon.js';
import { hslToRgb } from '../utils/math.js';

export class PreviewManager {
    constructor(parts, getPartScale) {
        this.parts = parts;
        this.getPartScale = getPartScale;
        this.engine = null;
        this.scene = null;
        this.camera = null;
        this.mesh = null;
        this.root = null;
        this.cache = {};
    }

    init() {
        const canvas = document.getElementById('previewCanvas');
        if (!canvas) return;
        this.engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.clearColor = new BABYLON.Color4(0.97, 0.98, 0.99, 1);
        this.camera = new BABYLON.ArcRotateCamera('pc', -Math.PI / 4, Math.PI / 3.2, 3, BABYLON.Vector3.Zero(), this.scene);
        this.camera.lowerRadiusLimit = 0.5;
        this.camera.upperRadiusLimit = 50;
        this.camera.wheelPrecision = 50;
        this.camera.inputs.attached.pointers.buttons = [1, 2];
        if (this.camera.inputs.attached.mousewheel) {
            this.camera.inputs.attached.mousewheel.detachControl();
        }
        const hemi = new BABYLON.HemisphericLight('ph', new BABYLON.Vector3(0, 1, 0), this.scene);
        hemi.intensity = 0.7;
        const dir = new BABYLON.DirectionalLight('pd', new BABYLON.Vector3(-0.8, -1.2, -0.8), this.scene);
        dir.intensity = 1.0;
        const dir2 = new BABYLON.DirectionalLight('pd2', new BABYLON.Vector3(0.6, 0.8, 0.6), this.scene);
        dir2.intensity = 0.5;
        this.root = new BABYLON.TransformNode('preMeshRoot', this.scene);
        this.root.position = new BABYLON.Vector3(0, 0, 0);
        this.engine.runRenderLoop(() => {
            if (this.root) this.root.rotation.y += 0.008;
            this.scene.render();
        });
        window.addEventListener('resize', () => this.engine?.resize());
    }

    loadModel(partDef, callback) {
        const file = partDef.modelFile;
        if (this.mesh) {
            this.mesh.dispose(false, true);
            this.mesh = null;
        }
        if (this.root) this.root.rotation = BABYLON.Vector3.Zero();

        if (this.cache[file] && !this.cache[file].isDisposed()) {
            const cached = this.cache[file];
            this.mesh = cached.clone('pre_clone_' + file);
            this.mesh.setEnabled(true);
            this.mesh.isPickable = false;
            this.scene.executeWhenReady(() => {
                centerMeshOnPodium(this.mesh, partDef, this.root, this.camera, this.parts, this.getPartScale);
                const [r, g, b] = hslToRgb(partDef.color.h, partDef.color.s, partDef.color.l);
                paintHierarchy(this.mesh, r, g, b);
                callback?.();
            });
            return;
        }

        BABYLON.SceneLoader.ImportMeshAsync('', 'models/', file, this.scene).then((result) => {
            const root = result.meshes.find(m => m.name === '__root__') || result.meshes[0];
            root.isPickable = false;
            root.getChildMeshes().forEach(c => c.isPickable = false);
            root.setEnabled(false);
            this.cache[file] = root;
            this.mesh = root.clone('pre_clone_' + file);
            this.mesh.setEnabled(true);
            this.mesh.isPickable = false;
            this.scene.executeWhenReady(() => {
                centerMeshOnPodium(this.mesh, partDef, this.root, this.camera, this.parts, this.getPartScale);
                const [r, g, b] = hslToRgb(partDef.color.h, partDef.color.s, partDef.color.l);
                paintHierarchy(this.mesh, r, g, b);
                callback?.();
            });
        }).catch(err => {
            console.error('Preview load error:', file, err);
        });
    }

    dispose() {
        this.engine?.stopRenderLoop();
        this.scene?.dispose();
        this.engine?.dispose();
        this.engine = null; this.scene = null; this.mesh = null; this.root = null;
    }
}
