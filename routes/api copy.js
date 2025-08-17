const express = require('express');
const router = express.Router();
const authenticateUser = require('../middleware/auth');
const bcrypt = require('bcrypt');
const Datastore = require('nedb');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express();
const SALT_ROUNDS = 10;

// ユーザーデータベース
const userDB = new Datastore({ filename: path.join(__dirname, '../data/db/users.db'), autoload: true });


const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key'; // JWT_SECRET を環境変数から取得

//ログイン処理
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'ユーザー名とパスワードは必須です' });
    }

    userDB.findOne({ username }, (err, user) => {
        if (err) {
            console.error('データベースエラー:', err);
            return res.status(500).json({ error: 'サーバーエラー' });
        }
        if (!user) {
            return res.status(401).json({ error: 'ユーザー名またはパスワードが間違っています' });
        }

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error('パスワード検証エラー:', err);
                return res.status(500).json({ error: 'サーバーエラー' });
            }
            if (!isMatch) {
                return res.status(401).json({ error: 'ユーザー名またはパスワードが間違っています' });
            }

            // トークンを生成
            const token = jwt.sign(
                { _id: user._id, username: user.username },
                JWT_SECRET,
                { expiresIn: '1d' } // トークンの有効期限を1日に設定
            );

            res.status(200).json({ userId: user._id, username: user.username, token });
        });
    });
});


// トークン更新API（リフレッシュ時）
app.post('/refresh-token', (req, res) => {
    const refreshToken = req.body.refreshToken;

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

// ユーザー情報の取得
router.get('/user', authenticateUser, (req, res) => {
    try {
        const { _id, username } = req.user;
        res.status(200).json({ id: _id, username });
    } catch (error) {
        console.error('ユーザー情報の取得エラー:', error);
        res.status(500).json({ error: 'ユーザー情報の取得に失敗しました' });
    }
});

// 登録処理

router.post('/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'ユーザー名とパスワードは必須です' });
    }

    userDB.findOne({ username }, (err, existingUser) => {
        if (err) {
            return res.status(500).json({ error: 'データベースエラー' });
        }
        if (existingUser) {
            return res.status(409).json({ error: 'このユーザー名は既に使用されています' });
        }

        // パスワードをハッシュ化
        bcrypt.hash(password, SALT_ROUNDS, (err, hashedPassword) => {
            if (err) {
                return res.status(500).json({ error: 'パスワードのハッシュ化に失敗しました' });
            }

            const newUser = { username, password: hashedPassword };
            userDB.insert(newUser, (err, createdUser) => {
                if (err) {
                    return res.status(500).json({ error: 'ユーザー登録に失敗しました' });
                }
                res.status(201).json({ message: 'ユーザー登録成功', userId: createdUser._id });
            });
        });
    });
});

module.exports = router;
