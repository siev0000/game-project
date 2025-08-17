// エフェクトリスト（動的にセレクトボックスに追加）
const effectsList = [
  { value: "斬撃", label: "斬撃", description: "鋭い線、アーク状の斜線", action: applySlashEffect },
  // { value: "刺突", label: "刺突", description: "鋭い点やスパイク状", action: applyPierceEffect },
  // { value: "爆発", label: "爆発", description: "円形、球形", action: applyExplosionEffect },
];

// セレクトボックスを動的に生成
document.addEventListener("DOMContentLoaded", function () {
  const effectTypeSelect = document.getElementById("effect-type");

  if (effectTypeSelect) {
    effectsList.forEach(effect => {
      const option = document.createElement("option");
      option.value = effect.value;
      option.textContent = effect.label;
      effectTypeSelect.appendChild(option);
    });
  } else {
    console.error("エフェクトのセレクトボックスが見つかりません。");
  }
});
