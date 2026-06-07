export const CONFIG = {
    GLOBAL_SCENE_SCALE: 0.5,
    SNAP_DIST: 0.30,
    SNAP_ANGLE: 20 * Math.PI / 180,
    MAGNET_DIST: 0.50,
    MAGNET_END: 0.05,
    SOFT_SNAP: 15 * Math.PI / 180,
    HARD_SNAP: 3 * Math.PI / 180,
};

export function getPartScale(partIndex, parts) {
    return CONFIG.GLOBAL_SCENE_SCALE * (parts[partIndex].scale || 1.0);
}
