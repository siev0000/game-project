export function applyGlobalScale(targetId = 'scalable-root') {
  const baseWidth = 720;
  const baseHeight = 1280;
  const baseRatio = baseWidth / baseHeight; // 9 / 16

  const resize = () => {
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const currentRatio = screenW / screenH;

    const scale = currentRatio > baseRatio
      ? screenH / baseHeight  // 横に余裕 → 高さ基準
      : screenW / baseWidth;  // 縦に余裕 → 幅基準

    const target = document.getElementById(targetId);
    if (target) {
      target.style.transform = `scale(${scale})`;
    }
  };

  window.addEventListener('resize', resize);
  resize();
}
export function getCurrentScale() {
  const baseWidth = 720
  const baseHeight = 1280
  const scaleX = window.innerWidth / baseWidth
  const scaleY = window.innerHeight / baseHeight
  return Math.min(scaleX, scaleY)
}