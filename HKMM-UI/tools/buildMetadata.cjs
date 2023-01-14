const { readFileSync, readdirSync } = require("fs");
const { writeJSONSync } = require("fs-extra");
const { dirname, join } = require("path");


const gitdir = join(dirname(dirname(__dirname)), ".git");
const tags = [];
const tagRoot = join(gitdir, "refs", "tags");
for (const tagName of readdirSync(tagRoot)) {
    tags.push(readFileSync(join(tagRoot, tagName), 'utf-8').trim());
}
const headcommit = readFileSync(join(gitdir, "refs", "heads", "master"), 'utf-8').trim();
const isTag = tags.includes(headcommit);
console.log(`Git: ${gitdir}`);
console.log(`Commit: ${headcommit}`);
console.log(`Is tag: ${isTag}`);

writeJSONSync("public/build-metadata.json", {
    buildTime: Date.now(),
    headCommit: headcommit,
    isTag
}, {
    spaces: 4
});
