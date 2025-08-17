
// HEXをRGBに変換するユーティリティ関数
function hexToRgb(hex) {
    const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (!match) return "255,255,255"; // デフォルトは白
    return `${parseInt(match[1], 16)},${parseInt(match[2], 16)},${parseInt(match[3], 16)}`;
  }
  
  // RGBをHEXに変換するユーティリティ関数
  function rgbToHex(r, g, b) {
    return `#${[r, g, b]
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("")}`;
  }
  
  // 2つの色間でグラデーションを生成する関数
  function generateGradient(startColor, endColor, steps) {
    function hexToRgbArray(hex) {
      const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
      if (!match) return [255, 255, 255]; // デフォルトは白
      return [
        parseInt(match[1], 16),
        parseInt(match[2], 16),
        parseInt(match[3], 16),
      ];
    }
  
    const startRgb = hexToRgbArray(startColor);
    const endRgb = hexToRgbArray(endColor);
    const gradient = [];
  
    for (let i = 0; i <= steps; i++) {
      const r = Math.round(startRgb[0] + ((endRgb[0] - startRgb[0]) * i) / steps);
      const g = Math.round(startRgb[1] + ((endRgb[1] - startRgb[1]) * i) / steps);
      const b = Math.round(startRgb[2] + ((endRgb[2] - startRgb[2]) * i) / steps);
      gradient.push(rgbToHex(r, g, b));
    }
  
    return gradient;
  }
  
  // 自動で終了色を生成する関数
  function generateEndColor(startColor) {
    const [r, g, b] = hexToRgb(startColor).split(",").map(Number);
  
    // 赤の場合は黄色に寄せる
    if (r > g && r > b) {
      return rgbToHex(r, Math.min(255, g + 170), b);
    }
  
    // 緑の場合は青に寄せる
    if (g > r && g > b) {
      return rgbToHex(r, g, Math.min(255, b + 170));
    }
  
    // 青の場合は赤に寄せる
    if (b > r && b > g) {
      return rgbToHex(Math.min(255, r + 170), g, b);
    }

    if (r > 225 && g > 225 && b > 225) {
        return rgbToHex(Math.min(255, r - 50), (Math.min(255, g - 50)), (Math.min(255, b - 50)));
    }

    if (r < 30 && g < 30 && b < 30) {
        return rgbToHex(Math.min(255, r + 50), (Math.min(255, g + 50)), (Math.min(255, b + 50)));
    }

    // その他は明るくする
    return rgbToHex(
      Math.min(255, r + 30),
      Math.min(255, g + 30),
      Math.min(255, b + 30)
    );
  }
  