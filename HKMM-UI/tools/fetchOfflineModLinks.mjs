import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import axios from 'axios';

const offlineDataDir = join("public", "offline");
if (!existsSync(offlineDataDir)) {
    mkdirSync(offlineDataDir, { recursive: true });
}

function saveOffline(name, data, date) {
    if(typeof data == 'string') {
        data = Buffer.from(data, 'utf-8');
    }
    date ??= Date.now();
    const head = Buffer.alloc(8);
    console.log(date);
    head.writeUIntBE(date, 0, 6);
    writeFileSync(join(offlineDataDir, name), Buffer.concat([head, data]));
}

const modlinks = JSON.parse((await axios.get('https://raw.githubusercontent.com/HKLab/modlinks-archive/master/modlinks.json', {
    responseType: 'text'
})).data);
modlinks['saveDate'] = Date.now();
saveOffline('modlinks.json', JSON.stringify(modlinks), modlinks.lastUpdate);

saveOffline("modfiles-cache.txt",
    (await axios.get('https://raw.githubusercontent.com/HKLab/modlinks-archive/modfiles/filecache.txt', {
        responseType: 'text'
    })).data);

