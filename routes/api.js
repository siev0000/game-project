// routes/api.js
const express = require('express');
const router = express.Router();
// 既存の認証ミドルウェア（パスはあなたの構成に合わせてそのまま）
const authenticateUser = require('./middleware/auth');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { getDb, ObjectId } = require('../data/db/mongo.cjs'); // Mongo接続ヘルパ
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';

// ========== ログイン ==========
router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'ユーザー名とパスワードは必須です' });
  }

  try {
    const db = getDb();
    const users = db.collection('users');

    const user = await users.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'ユーザー名またはパスワードが間違っています' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'ユーザー名またはパスワードが間違っています' });
    }

    // トークン発行（_id は文字列化）
    const payload = { _id: String(user._id), username: user.username };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({ userId: String(user._id), username: user.username, token });
  } catch (err) {
    console.error('データベースエラー:', err);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// ========== リフレッシュトークン ==========
router.post('/refresh-token', (req, res) => {
  const refreshToken = req.body?.refreshToken;
  if (!refreshToken) return res.status(400).json({ message: 'refreshToken がありません' });

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    const newToken = jwt.sign(
      { _id: decoded._id, username: decoded.username },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token: newToken });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// ========== 認証ユーザー情報 ==========
router.get('/user', authenticateUser, (req, res) => {
  try {
    const { _id, username } = req.user || {};
    res.status(200).json({ id: _id, username });
  } catch (error) {
    console.error('ユーザー情報の取得エラー:', error);
    res.status(500).json({ error: 'ユーザー情報の取得に失敗しました' });
  }
});

// ========== 新規登録 ==========
router.post('/register', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'ユーザー名とパスワードは必須です' });
  }

  try {
    const db = getDb();
    const users = db.collection('users');

    // 既存チェック
    const existing = await users.findOne({ username });
    if (existing) {
      return res.status(409).json({ error: 'このユーザー名は既に使用されています' });
    }

    // パスワードハッシュ化
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const doc = {
      username,
      password: hashedPassword,
      characters: [],           // 将来参照用
      createdAt: new Date(),
    };

    const result = await users.insertOne(doc);
    return res.status(201).json({
      message: 'ユーザー登録成功',
      userId: String(result.insertedId),
    });
  } catch (err) {
    // インデックス（unique）作成済みの場合は duplicate key を捕捉
    if (err && err.code === 11000) {
      return res.status(409).json({ error: 'このユーザー名は既に使用されています' });
    }
    console.error('ユーザー登録エラー:', err);
    return res.status(500).json({ error: 'ユーザー登録に失敗しました' });
  }
});

module.exports = router;
