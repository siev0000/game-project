document.getElementById("characterForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const characterName = document.getElementById("characterName").value;
  const raceLevel = parseInt(document.getElementById("raceLevel").value, 10);
  const classLevel = parseInt(document.getElementById("classLevel").value, 10);

  console.log("キャラクター名:", characterName);
  console.log("種族レベル:", raceLevel);
  console.log("クラスレベル:", classLevel);

  // 次のステップに進む処理を記述
});
