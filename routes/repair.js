const Datastore = require('nedb');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, './data/characters.db');
const backupPath = path.join(__dirname, './data/characters_backup.db');
const repairedPath = path.join(__dirname, './data/characters_repaired.db');

// ファイルをバックアップ
if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(dbPath, backupPath);
    console.log('Backup created:', backupPath);
}

// 修復用データベースの作成
const db = new Datastore({ filename: repairedPath, autoload: false });

try {
    db.loadDatabase((err) => {
        if (err) {
            console.error('Failed to load database:', err.message);
        } else {
            console.log('Database repaired successfully. Saved as:', repairedPath);
        }
    });
} catch (error) {
    console.error('Error during repair process:', error);
}

const characterRoutes = require('./routes/character');
app.use('/api', characterRoutes);
