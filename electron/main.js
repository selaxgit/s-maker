/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

const template = [
  {
    label: 'View',
    submenu: [
      {
        role: 'toggledevtools',
      },
      {
        role: 'togglefullscreen',
      },
    ],
  },
];
const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1680,
    height: 900,
    title: 'S-Maker',
    autoHideMenuBar: true,
    icon: path.join(__dirname, '/favicon.ico'),
  });
  win.loadFile(path.join(__dirname, 'dist/index.html'));
};

app.whenReady().then(() => {
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
