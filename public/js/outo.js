// // ====== 自動更新 ==========================================================================================
// // 表示を更新する関数
// function updateMoneyDisplay() {
//     document.getElementById('money-display').textContent = money;
// }

// // `money`プロパティの変更を監視
// Object.defineProperty(playerData, 'money', {
//     get() {
//         return money;
//     },
//     set(value) {
//         money = value;
//         updateMoneyDisplay(); // 値が変更されたら表示を更新
//     }
// });

// function updateLocationDisplay() {
//     document.getElementById('location-display').textContent = playerData.money;
// }
// // Proxyを利用して値の変更を監視
// const playerDataLocation = new Proxy(playerData, {
//     set(target, property, value) {
//         if (property === 'location') {
//             target[property] = value; // 値を更新
//             updateLocationDisplay(); // 表示を更新
//             return true;
//         }
//         return false;
//     }
// });