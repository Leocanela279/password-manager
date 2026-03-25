const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { initDatabase } = require('./database.js');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

let db;

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadURL('http://localhost:5173');
}

ipcMain.handle('auth:register', async (event, { username, email, password }) => {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword], function (err) {
      if (err) {
        reject(err);
      }
      resolve({ id: this.lastID, username, email });
    });
  });
});

ipcMain.handle('auth:login', async (event, { email, password }) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, row) => {
      if (err) {
        return reject(err);
      }
      if (!row) {
        return reject(new Error('User not found'));
      }
      const match = await bcrypt.compare(password, row.password);
      if (match) {
        resolve(row);
      } else {
        reject(new Error('Wrong password'));
      }
    });
  });
});

ipcMain.handle('passwords:add', async (event, { userId, provider, password, link, masterPassword }) => {
  const derivedKey = await new Promise((resolve, reject) => {
    crypto.scrypt(masterPassword, 'a-salt', 32, (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey);
    });
  });

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', derivedKey, iv);
  let encryptedPassword = cipher.update(password, 'utf8', 'hex');
  encryptedPassword += cipher.final('hex');

  return new Promise((resolve, reject) => {
    db.run('INSERT INTO passwords (user_id, provider, password, iv, link) VALUES (?, ?, ?, ?, ?)', [userId, provider, encryptedPassword, iv.toString('hex'), link], function (err) {
      if (err) {
        reject(err);
      }
      resolve({ id: this.lastID });
    });
  });
});

ipcMain.handle('passwords:get', async (event, { userId, masterPassword }) => {
  const derivedKey = await new Promise((resolve, reject) => {
    crypto.scrypt(masterPassword, 'a-salt', 32, (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey);
    });
  });

  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM passwords WHERE user_id = ?', [userId], (err, rows) => {
      if (err) {
        reject(err);
      }
      const decryptedPasswords = rows.map(row => {
        const decipher = crypto.createDecipheriv('aes-256-cbc', derivedKey, Buffer.from(row.iv, 'hex'));
        let decryptedPassword = decipher.update(row.password, 'hex', 'utf8');
        decryptedPassword += decipher.final('utf8');
        return { ...row, password: decryptedPassword };
      });
      resolve(decryptedPasswords);
    });
  });
});


app.whenReady().then(() => {
  db = initDatabase(app);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
