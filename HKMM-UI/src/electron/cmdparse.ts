import { mainWindow } from "@/background";
import { app, ipcMain } from "electron";

function parseUrl(uri: URL) {
    console.log(uri);
    mainWindow?.webContents.send("on-url-emit", uri.toString());
}

export function parseCmd(argv: string[]) {
    const url_index = argv.findIndex((val) => val === "--url");
    if (url_index > -1) {
        const url = new URL(argv[url_index + 1]);
        parseUrl(url);
        mainWindow?.show();
        return;
    }
}
