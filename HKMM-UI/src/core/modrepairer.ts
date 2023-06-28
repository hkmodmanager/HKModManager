/* eslint-disable no-inner-declarations */
import { TaskItem } from "core";
import { createHash } from "crypto";
import { existsSync, mkdirSync, rmSync } from "fs";
import { copyFile, readdir, readFile, rename, stat, writeFile } from "fs/promises";
import { dirname, join } from "path/win32";
import { localModFilesCache } from "./exportGlobal";
import { getModLinks } from "./modlinks/modlinks";
import { getOrAddLocalMod, getRealModPath, isDownloadingMod, LocalModInstance, LocalMod_FullLevel, verifyModFiles } from "./modManager";
import { downloadRaw } from "./utils/downloadFile";

export const ignoreVerifyMods: Set<string> = new Set<string>();

export async function repairMod(mod: LocalModInstance, taskinfo?: TaskItem) {
    try {
        if (!mod.info.modinfo.ei_files?.files) return;
        const root = mod.info.path;
        if(ignoreVerifyMods.has(root) || isDownloadingMod(mod.name)) return;
        const files = mod.info.modinfo.ei_files.files;
        const missingFiles: string[] = [];
        const fulllevel = verifyModFiles(root, files, missingFiles);
        mod.info.modVerify = {
            fulllevel,
            missingFiles,
            verifyDate: Date.now()
        };
        mod.save();
        ignoreVerifyMods.add(root);
        taskinfo?.print("Try searching for an existing file");
        const existsFiles: Record<string, string> = {};
        const shaMap: Record<string, string> = {};
        async function readDirL0(root: string, op: string = "") {
            for (const name of await readdir(root, 'utf-8')) {
                const rp = join(root, name);
                const p = join(op, name);
                const stats = await stat(rp);
                if (stats.isDirectory()) {
                    await readDirL0(rp, p);
                    continue;
                }
                if (stats.isFile() && (!files[p] || missingFiles.includes(p))) {
                    const sha = createHash('sha256').update(await readFile(rp)).digest('hex');
                    taskinfo?.print(`Existing file: ${rp}=${sha}`);
                    shaMap[sha] = p;
                    existsFiles[p] = sha;
                }
            }
        }
        await readDirL0(root, "");
        await readDirL0(getRealModPath(mod.name), getRealModPath(mod.name));
        taskinfo?.print("Checking for reusable files");
        const deleteAfterReuse: string[] = [];
        for (const file of missingFiles) {
            const rp = join(root, file);
            if (existsSync(rp) && existsFiles[file]) {
                const sha = existsFiles[file];
                const newpath = join(dirname(rp), "sha256-" + sha);
                await rename(rp, newpath);
                taskinfo?.print(`Move file: ${rp}->${newpath}`);
                shaMap[sha] = newpath;
                deleteAfterReuse.push(newpath);
            }
        }
        for (const file of missingFiles) {
            const rp = join(root, file);
            const sha = files[file];
            const reuseName = shaMap[sha];
            if (!reuseName) continue;
            const reuse = reuseName[1] == ':' ? reuseName : join(root, reuseName);
            taskinfo?.print(`Reuse files: ${reuse}->${rp}`);
            if(!existsSync(dirname(rp))) mkdirSync(dirname(rp), { recursive: true });
            await copyFile(reuse, rp);
            deleteAfterReuse.push(reuse);
        }
        for (const file of deleteAfterReuse) {
            const p = file[1] == ':' ? file : join(root, file);
            if(!existsSync(p)) continue;
            taskinfo?.print(`Remove file: ${p}`);
            rmSync(p);
        }
        const modstr = `${mod.name}-v${mod.info.version}`;
        taskinfo?.print(`Mod str: ${modstr}`);
        const skips = new Set<string>();
        const req_promise: Promise<void>[] = [];
        if (localModFilesCache.includes(modstr)) {
            taskinfo?.print(`Use scatter files on Github https://raw.githubusercontent.com/hkmodmanager/modlinks-archive/modfiles/files/`);
            for (const file of missingFiles) {
                req_promise.push((async function () {
                    try {
                        const fp = join(root, file);
                        taskinfo?.print(`Download file: ${file}`);
                        const r = await downloadRaw(`https://raw.githubusercontent.com/hkmodmanager/modlinks-archive/modfiles/files/${mod.name}/${mod.info.version}/${file}`,
                            undefined, undefined, true, `[${taskinfo?.guid}]Download Mod File: ${file}`, 'Download');
                        if(!existsSync(dirname(fp))) mkdirSync(dirname(fp), { recursive: true });
                        await writeFile(fp, r);
                        skips.add(file);
                    } catch (e) {
                        return;
                    }
                })());
            }
            taskinfo?.print(`Waiting for downloaders`);
            await Promise.all(req_promise);
        }

        taskinfo?.print(`Checking the remaining status of the file`);
        ignoreVerifyMods.delete(mod.info.path);
        missingFiles.length = 0;
        mod.info.modVerify = {
            fulllevel: verifyModFiles(root, files, missingFiles),
            missingFiles,
            verifyDate: Date.now()
        };
        mod.save();
        if (mod.info.modVerify.fulllevel < LocalMod_FullLevel.ResourceFull) {
            taskinfo?.print(`The file is not completed to fill.`);
            const mlm = (await getModLinks()).getMod(mod.name, mod.info.version);

            if (mlm) {
                taskinfo?.print(`Re-download the full mod`);
                const group = getOrAddLocalMod(mod.name);
                group.installNew(mlm, false, true);
            } else {
                throw new Error("Not found mod in modlinks");
            }
        }

    } finally {
        ignoreVerifyMods.delete(mod.info.path);
    }
}
