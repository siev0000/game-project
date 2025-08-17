function triggerSelectedEffect() {
  const selectedValue = document.getElementById("effect-type").value;
  const selectedEffect = effectsList.find(effect => effect.value === selectedValue);

  const size = parseFloat(document.getElementById("size").value) || 1.0;
  const speed = parseFloat(document.getElementById("speed").value) || 1.0;
  const color = document.getElementById("color").value || "#ffffff";
  
  if (selectedEffect && selectedEffect.action) {
    selectedEffect.action(size, speed, hexToRGB(color));
  } else {
    console.log("未定義のエフェクトです。");
  }
}

// HEXカラーをEffekseerのRGB形式に変換
function hexToRGB(hex) {
  const r = parseInt(hex.substring(1, 3), 16) / 255;
  const g = parseInt(hex.substring(3, 5), 16) / 255;
  const b = parseInt(hex.substring(5, 7), 16) / 255;
  return [r, g, b, 1.0];
}