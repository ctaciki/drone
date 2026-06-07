
export const AssetManager = {
    templates: {},
    modelsLoaded: false,

    async preloadAll(scene, parts, onProgress) {
        this.modelsLoaded = false;
        const files = [...new Set(parts.map(p => p.modelFile))];
        let loaded = 0;
        const total = files.length;
        if (total === 0) { this.modelsLoaded = true; return; }

        scene._modelTemplates = {};
        await Promise.all(files.map(file => new Promise((resolve) => {
            BABYLON.SceneLoader.ImportMeshAsync('', 'models/', file, scene, (evt) => {
                if (evt.lengthComputable && onProgress) {
                    const pct = ((loaded + evt.loaded / evt.total) / total) * 100;
                    onProgress(pct);
                }
            }).then((result) => {
                const root = result.meshes.find(m => m.name === '__root__') || result.meshes[0];
                if (root) {
                    root.setEnabled(false);
                    root.isPickable = false;
                    root.getChildMeshes().forEach(c => c.isPickable = false);
                    this.templates[file] = { root };
                    scene._modelTemplates[file] = { root };
                }
                loaded++;
                onProgress?.(loaded / total * 100);
                resolve();
            }).catch((err) => {
                console.error('Ошибка загрузки', file, err);
                loaded++;
                onProgress?.(loaded / total * 100);
                resolve();
            });
        })));
        this.modelsLoaded = true;
    },

    getTemplate(file) {
        return this.templates[file];
    }
};
