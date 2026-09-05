const {
  app,
  BrowserWindow,
  nativeImage
} = require('electron');
const path = require('path');


function createWindow() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'assets', 'icon.png'));

  const mainWindow = new BrowserWindow({
    width: 650,
    height: 850,
    icon: icon, // Ruta directa a la raíz
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    autoHideMenuBar: true,
    backgroundColor: '#f5f5f7'
  });


  mainWindow.loadFile(path.join(__dirname, 'src/index.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});