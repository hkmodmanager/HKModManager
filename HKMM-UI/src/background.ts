'use strict'

import { app, protocol, BrowserWindow, crashReporter, dialog, ipcMain, Menu } from 'electron'
import { initRenderer } from 'electron-store'
import * as path from 'path';
import { parseCmd } from './electron/cmdparse'
import { readFile } from 'fs';
import { spawn } from 'child_process';
const isDevelopment = process.env.NODE_ENV !== 'production'

const singleLock = app.requestSingleInstanceLock();
if (!singleLock) {
  app.quit();
}

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
  protocol.registerBufferProtocol("app", (request, callback) => {
    let pathName = request.url.substring(6);
    const hash = pathName.lastIndexOf('#');
    if (hash > 0) {
      pathName = pathName.substring(0, hash);
    }
    pathName = decodeURI(pathName);
    readFile(path.join(__dirname, pathName), (error, data) => {
      if (error) {
        dialog.showErrorBox(
          `Failed to read ${pathName} on app protocol`,
          error.message
        );
      }
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
    })
  });
}

async function createWindow() {
  // Create the browser window.
  const win = mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {

      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      enableRemoteModule: true,
      allowRunningInsecureContent: true
    }
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string);
    if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    // Load the index.html when not in development
    win.loadURL('app://./index.html');
  }
}



const startAfterQuit: Set<string> = new Set<string>();

app.on('ready', async () => {
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
   if(app.isPackaged) Menu.setApplicationMenu(null);
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
  app.quit();
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
