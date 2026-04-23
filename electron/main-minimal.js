const { app, BrowserWindow } = require('electron');

app.whenReady().then(() => {
  const win = new BrowserWindow({ width: 800, height: 600 });
  win.loadURL('data:text/html,<h1>Minimal Test</h1>');
  console.log('Window created!');
});

app.on('window-all-closed', () => {
  app.quit();
});
