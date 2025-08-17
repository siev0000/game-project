const jwt = require('jsonwebtoken');

function authenticateUser(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: '認証トークンが見つかりません' });
    }

    const token = authHeader.split(' ')[1]; // "Bearer <token>" の形式からトークンを抽出

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // トークンを検証
        req.user = decoded; // トークンからユーザー情報をリクエストに追加
        next(); // 次の処理に進む
    } catch (err) {
        console.error('認証エラー:', err);
        res.status(403).json({ error: 'トークンが無効です' });
    }
}

module.exports = authenticateUser;
