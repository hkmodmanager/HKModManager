'use strict'

import { app, protocol, BrowserWindow, crashReporter, dialog, ipcMain, Menu, net } from 'electron'
import { initRenderer } from 'electron-store'
import * as path from 'path';
import { parseCmd } from './electron/cmdparse'
import { copyFileSync, existsSync, writeFileSync } from 'fs';
import { readdir, readFile } from 'fs/promises';
import { spawn } from 'child_process';
import { dirname, join, resolve } from 'path';
import * as semver from 'semver';
import * as remote from '@electron/remote/main';
const isDevelopment = process.env.NODE_ENV !== 'production'

const singleLock = app.requestSingleInstanceLock();
if (!singleLock) {
  app.quit();
}

const appDir = dirname(app.getPath('exe'));
if (existsSync(join(appDir, 'update.zip')) || existsSync(join(appDir, '_update'))) {
  const updater = join(appDir, 'updater.exe');
  if (existsSync(updater)) {
    spawn(updater, ['true', process.pid.toString()], {
      shell: false,
      detached: true
    });
    app.exit();
  }
}

remote.initialize();

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app', privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
      bypassCSP: true,

    }
  }
]);

initRenderer();

const url_args: string[] = [];
if (!app.isPackaged) {
  url_args.push("\"" + path.resolve(process.argv[1]) + "\"");
}
url_args.push("--");
url_args.push("--url");

app.setAsDefaultProtocolClient("hkmm", undefined, url_args);

export let mainWindow: BrowserWindow | undefined;

function registerAppScheme() {
  protocol.registerBufferProtocol("app", async (request, callback) => {
    try {
      let pathName = (decodeURI(request.url)).substring(6);

      const hash = pathName.lastIndexOf('#');
      if (hash > 0) {
        pathName = pathName.substring(0, hash);
      }
      const data = await readFile(path.join(__dirname, pathName));
      const extension = path.extname(pathName).toLowerCase()
      let mimeType = ''

      if (extension === '.js') {
        mimeType = 'text/javascript'
      } else if (extension === '.html') {
        mimeType = 'text/html'
      } else if (extension === '.css') {
        mimeType = 'text/css'
      } else if (extension === '.svg' || extension === '.svgz') {
        mimeType = 'image/svg+xml'
      } else if (extension === '.json') {
        mimeType = 'application/json'
      } else if (extension === '.wasm') {
        mimeType = 'application/wasm'
      }

      callback({ mimeType, data })
    } catch (e) {
      console.error(e);
      dialog.showErrorBox("Error!", e.toString());
    }
  });
}

async function createWindow() {
  // Create the browser window.
  const win = mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      allowRunningInsecureContent: true,
      devTools: true
    }
  });

  remote.enable(win.webContents);

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string);
    if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    // Load the index.html when not in development
    win.loadURL('app://./index.html');
  }
}

export const srcRoot = dirname(dirname(dirname(dirname(app.getPath('exe')))));

const startAfterQuit: Set<string> = new Set<string>();

app.on('ready', async () => {
  if (semver.lt(process.versions.electron, "22.0.0")) {
    const result = dialog.showMessageBoxSync({
      title: "Breaking update",
      message: `Electron需要更新(${process.versions.electron}->22.0.2)
Electron needs to be updated (${process.versions.electron}->22.0.2)`,
      buttons: ['下载 Download', '关闭 Close'],
      defaultId: 2
    });
    if (result == 1) app.exit();
    if (result == 0) {
      dialog.showMessageBox({
        message: `将会在Electron更新完成后自动启动程序，请不要再次手动启动程序
The program will start automatically after the Electron update is complete, please do not start the program manually again`
      });
      const url = app.getLocaleCountryCode() == 'CN' ?
        'https://cdn.npmmirror.com/binaries/electron/v22.0.2/electron-v22.0.2-win32-x64.zip'
        : 'https://github.com/electron/electron/releases/download/v22.0.2/electron-v22.0.2-win32-x64.zip';
      console.log("Download from " + url);
      const req = net.request(url);
      req.on('error', (e) => {
        dialog.showErrorBox('Error!', e.stack ?? e.message);
        app.exit();
      });
      req.on('response', (rep) => {
        const chunks: Buffer[] = [];
        rep.on('data', (chunk) => {
          chunks.push(chunk);
        });
        rep.on('error', (e: any) => {
          dialog.showErrorBox('Error!', e.stack ?? e?.message);
          app.exit();
        });
        rep.on('end', () => {
          try {
            const data = Buffer.concat(chunks);
            const outp = join(dirname(app.getPath('exe')), 'update.zip');
            writeFileSync(outp, data);
            const updater = join(dirname(outp), 'updater.exe');
            copyFileSync(join(appDir, 'updater', 'updater.exe'),
              updater);
            console.log(updater);
            spawn(updater, ['true', process.pid.toString()], {
              shell: false,
              detached: true
            });
            app.exit(0);
          } catch (e) {
            console.error(e);
            dialog.showErrorBox('Error!', e?.toString());
          }
        });
      });
      req.end();
      return;
    }
  }





  registerAppScheme()
  ipcMain.once("renderer-init", () => {
    parseCmd(process.argv);
  });
  ipcMain.on("uncagught-exception", (ev, ee) => {
    dialog.showErrorBox("Uncaught Excpetion", ee);
    console.log(ee)
  });
  ipcMain.on('update-setup-done', (ev, path) => {
    startAfterQuit.add(path);
  });
  if (app.isPackaged) Menu.setApplicationMenu(null);
  createWindow();
});


app.on('window-all-closed', () => {
  for (const s of startAfterQuit.values()) {
    spawn(s, {
      shell: false,
      detached: true
    });
    console.log(s);
  }
  app.exit();
})


app.on("second-instance", (ev, argv, wd) => {
  parseCmd(argv);
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit();
      }
    });
  } else {
    process.on('SIGTERM', () => {
      app.quit();
    });
  }
}
