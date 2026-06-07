


export function paintHierarchy(rootMesh, r, g, b) {
    if (!rootMesh || rootMesh.isDisposed()) {
        console.warn('[paintHierarchy] rootMesh missing or disposed');
        return;
    }
    const color = new BABYLON.Color3(r, g, b);
    let painted = 0, cloned = 0, fallback = 0;

    const collectNodes = (node, list) => {
        if (!node || node.isDisposed()) return;
        list.push(node);
        const children = node.getChildren ? node.getChildren() : [];
        children.forEach(c => collectNodes(c, list));
    };
    const allNodes = [];
    collectNodes(rootMesh, allNodes);

    const meshes = allNodes.filter(n => n.material !== undefined && n.material !== null);

    const applyColor = (mat) => {
        if (!mat) return false;
        let ok = false;
        if (mat.diffuseColor !== undefined) { mat.diffuseColor = color.clone(); ok = true; }
        if (mat.albedoColor !== undefined) { mat.albedoColor = color.clone(); ok = true; }
        if (mat.baseColor !== undefined) { mat.baseColor = color.clone(); ok = true; }
        if (mat.emissiveColor !== undefined) { mat.emissiveColor = new BABYLON.Color3(0, 0, 0); ok = true; }
        if (mat.specularColor !== undefined) { mat.specularColor = color.clone(); ok = true; }
        return ok;
    };

    meshes.forEach(m => {
        const mat = m.material;
        if (!mat) return;
        let newMat = null;
        try { newMat = mat.clone(m.name + '_p_' + Date.now()); } catch (e) {}
        if (newMat && newMat !== mat) {
            if (newMat.subMaterials && newMat.subMaterials.length > 0) {
                newMat.subMaterials = newMat.subMaterials.map((sub, i) => {
                    if (!sub) return sub;
                    const subClone = sub.clone(m.name + '_sub' + i);
                    if (subClone) applyColor(subClone);
                    return subClone || sub;
                });
            } else { applyColor(newMat); }
            m.material = newMat;
            cloned++; painted++;
        } else {
            if (mat.subMaterials && mat.subMaterials.length > 0) {
                mat.subMaterials.forEach(sub => { if (sub) applyColor(sub); });
            } else { applyColor(mat); }
            fallback++; painted++;
        }
    });
}

export function getMeshLocalBounds(mesh) {
    let min = null, max = null;
    const process = (m) => {
        if (!m.geometry || !m.getTotalVertices || m.getTotalVertices() === 0) return;
        const positions = m.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        if (!positions) return;
        for (let i = 0; i < positions.length; i += 3) {
            const local = new BABYLON.Vector3(positions[i], positions[i + 1], positions[i + 2]);
            if (!min) { min = local.clone(); max = local.clone(); }
            else { min = BABYLON.Vector3.Minimize(min, local); max = BABYLON.Vector3.Maximize(max, local); }
        }
    };
    process(mesh);
    mesh.getChildMeshes().forEach(process);
    return { min, max };
}

export function centerMeshOnPodium(mesh, partDef, preMeshRoot, preCamera, parts, getPartScale) {
    if (!mesh || !preMeshRoot) return;
    try {
        const partScale = getPartScale(parts.indexOf(partDef), parts);
        mesh.setParent(null);
        mesh.position = BABYLON.Vector3.Zero();
        mesh.rotation = BABYLON.Vector3.Zero();
        if (mesh.rotationQuaternion) mesh.rotationQuaternion = null;
        mesh.scaling = new BABYLON.Vector3(1, 1, 1);
        preMeshRoot.position = BABYLON.Vector3.Zero();
        preMeshRoot.rotation = BABYLON.Vector3.Zero();
        preMeshRoot.scaling = new BABYLON.Vector3(1, 1, 1);
        mesh.computeWorldMatrix(true);
        mesh.getChildMeshes().forEach(c => {
            c.position = BABYLON.Vector3.Zero();
            c.rotation = BABYLON.Vector3.Zero();
            if (c.rotationQuaternion) c.rotationQuaternion = null;
            c.scaling = new BABYLON.Vector3(1, 1, 1);
            c.computeWorldMatrix(true);
        });
        const bounds = getMeshLocalBounds(mesh);
        if (!bounds.min || !bounds.max) return;
        const sizeX = Math.abs(bounds.max.x - bounds.min.x);
        const sizeY = Math.abs(bounds.max.y - bounds.min.y);
        const sizeZ = Math.abs(bounds.max.z - bounds.min.z);
        const maxDim = Math.max(sizeX, sizeY, sizeZ);
        if (maxDim < 0.001) return;
        const center = new BABYLON.Vector3(
            (bounds.min.x + bounds.max.x) / 2,
            (bounds.min.y + bounds.max.y) / 2,
            (bounds.min.z + bounds.max.z) / 2
        );
        mesh.position.x = -center.x;
        mesh.position.y = -center.y;
        mesh.position.z = -center.z;
        mesh.setParent(preMeshRoot);
        const targetSize = 2.5;
        const rawScale = (targetSize / maxDim) * partScale;
        const scaleFactor = Math.max(0.01, Math.min(rawScale, 20.0));
        preMeshRoot.scaling = new BABYLON.Vector3(scaleFactor, scaleFactor, scaleFactor);
        const visualMax = maxDim * scaleFactor;
        const cameraRadius = Math.max(1.5, visualMax * 1.8);
        preCamera.target = new BABYLON.Vector3(0, 0, 0);
        preCamera.radius = cameraRadius;
        preCamera.alpha = -Math.PI / 4;
        preCamera.beta = Math.PI / 2.6;
    } catch (e) {
        mesh.setParent(preMeshRoot);
        preMeshRoot.scaling = new BABYLON.Vector3(1.0, 1.0, 1.0);
        preCamera.target = new BABYLON.Vector3(0, 0, 0);
        preCamera.radius = 2.5;
    }
}

