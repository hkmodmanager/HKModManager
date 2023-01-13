import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import axios from 'axios';

const offlineDataDir = join("public", "offline");
if(!existsSync(offlineDataDir)) {
    mkdirSync(offlineDataDir, { recursive: true });
}

const modlinks = JSON.parse((await axios.get('https://raw.githubusercontent.com/HKLab/modlinks-archive/master/modlinks.json', {
    responseType: 'text'
})).data);
modlinks['saveDate'] = Date.now();
writeFileSync(join(offlineDataDir, 'modlinks.json'), JSON.stringify(modlinks));


