// 192.168.0.110

console.log('サーバーのセットアップを開始します');
require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const excelRoutes = require('./routes/excel');
const apiRoutes = require('./routes/api');
// const characterRoutes = require('./routes/characters');

// MONGO
const { initMongo } = require('./data/db/mongo.cjs');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('モジュールの読み込みが完了しました');

// CORS + JSON設定（上のほうで宣言する）
app.use(cors());
app.use(express.json());

// 静的ファイル（必要なら画像や音声用）
app.use(express.static(path.join(__dirname, 'public')));
console.log('静的ファイルの提供が設定されました');

// ルーティング設定（API）
app.use('/api', apiRoutes);
// app.use('/api/characters', characterRoutes);
app.use('/api/excel', excelRoutes);
console.log('ルーティングの設定が完了しました');

// Vue + ViteにHTML表示を任せるため '/' は指定しない
// app.get('/', ...) ← 削除

// サーバー起動
// app.listen(3000, '0.0.0.0', () => {
//     console.log('Server is running on http://192.168.0.110:3000');
// });

//=======================================================================
// --- ここから：本番でフロント(ビルド済みdist)を配信 ---
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));
  // SPA のルーティング対応（/api 以外は index.html へ）
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).end();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}
// --- ここまで ---
//=======================================================================

// Mongo 接続が成功してからサーバー起動
initMongo().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
})
.catch((err) => {
  console.error('[mongo] connect failed:', err);
  process.exit(1);
});



