import { readFileSync, writeFileSync } from "fs";
import { parse } from "csv-parse";

const fp = process.argv[2];

const data = parse(readFileSync(fp, 'utf-8'),{
    bom: true,
    skip_empty_lines: true,
    columns: true,
});

const alias = {};
const desc = {};

data.on('data', data => {
    const name = data['英文名'].toLowerCase().replaceAll(' ', '');
    alias[name] = data['中文名'];
    desc[name] = data['说明'];
    console.log(data);
});

data.on('end', () => {
    writeFileSync('chinese_modalias.json', JSON.stringify(alias, undefined, 4));
    writeFileSync('chinese_moddesc.json', JSON.stringify(desc, undefined, 4));
});

//console.log(alias);



