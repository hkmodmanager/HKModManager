const { execSync } = require("child_process");
const { readFileSync, readdirSync, existsSync } = require("fs");
const { writeJSONSync, readJSONSync } = require("fs-extra");
const { dirname, join } = require("path");


const gitdir = join(dirname(dirname(__dirname)), ".git");
const tags = [];
const tagRoot = join(gitdir, "refs", "tags");
for (const tagName of readdirSync(tagRoot)) {
    const tag = readFileSync(join(tagRoot, tagName), 'utf-8').trim();
    console.log(`Tag ${tagName} -> ${tag}`)
    tags.push(tag);
}
const curBranch = execSync("git branch --show-current", {
    encoding: 'utf8'
}).trim();
const masterPath = join(gitdir, "refs", "heads", curBranch);
let headcommit = "";
let isTag = false;
if (existsSync(masterPath)) {
    headcommit = readFileSync(masterPath, 'utf-8').trim();
} else {
    headcommit = tags[0];
    isTag =  true;
}

const version = readJSONSync("package.json").version;

console.log(`Git: ${gitdir}`);
console.log(`Commit: ${headcommit}`);
console.log(`Branch: ${curBranch}`);
console.log(`Is tag: ${isTag}`);

writeJSONSync("public/build-metadata.json", {
    buildTime: Date.now(),
    headCommit: headcommit,
    isTag,
    version
}, {
    spaces: 4
});