
<template>
    <div class="task-item accordion-item p-1" :id="`mod-download-${mod.name.replaceAll(' ', '')}`">
        <h2 class="accordion-header">
            <button class="accordion-button collapsed" @click="toggleCollapse('body')">
                <div class="d-flex">
                    <div class="p-1">
                        {{ mod?.name }}
                        <i v-if="getShortName(mod.name) != mod.name.toUpperCase()">
                            ({{ getShortName(mod.name) }})
                        </i>
                        <strong v-if="getModAliasName(mod.name) != undefined && getModAliasName(mod.name) != mod.name">
                            ({{ getModAliasName(mod.name) }})
                        </strong>
                    </div>
                    <span v-if="isUsed(mod?.name ?? '')" class="badge bg-success mt-2">
                        {{ $t("mods.enabled") }}
                    </span>
                    <span v-if="isInstallMod(mod?.name ?? '') && !isUsed(mod?.name ?? '')"
                        class="badge bg-success mt-2">
                        {{ $t("mods.depInstall") }}
                    </span>

                    <template v-if="localmod && localmod.info.imported">
                        <span v-if="localmod.info.imported.fromScarab" class="badge bg-success mt-2">
                            {{ $t("mods.badge_importFromScarab") }}
                        </span>
                        <span v-if="localmod.info.imported.localmod" class="badge bg-success mt-2">
                            {{ $t("mods.badge_importFromLocal") }}
                        </span>
                        <span v-if="localmod.info.imported.nonExclusiveImport" class="badge bg-warning mt-2"
                            :title="$t('mods.alert_nonExclusiveImport')">
                            {{ $t("mods.badge_nonExclusiveImport") }}
                        </span>
                        <!--
                        <template v-if="localmod.info.modVerify && localmod.info.modVerify.fulllevel <= 3">
                            <span v-if="localmod.info.modVerify.fulllevel == 1" class="badge bg-warning mt-2"
                                :title="$t('mods.importLocal.alert_dllfull') + getMissingFileText(localmod.info.modVerify)">
                                {{ $t('mods.badge_missingFileLevel1') }}
                            </span>
                            <span v-if="localmod.info.modVerify.fulllevel == 0" class="badge bg-danger mt-2"
                                :title="$t('mods.importLocal.alert_dllnotfull') + getMissingFileText(localmod.info.modVerify)">
                                {{ $t('mods.badge_missingFileLevel2') }}
                            </span>
                        </template>-->
                    </template>
                    <span v-if="!isLocal && scarab" class="badge bg-success mt-2">
                        {{ $t("mods.badge_scarabInstalled") }}
                    </span>
                    <span v-if="!isLocal && rlocal" class="badge bg-success mt-2">
                        {{ $t("mods.badge_localInstalled") }}
                    </span>
                    <span v-if="(isRequireUpdate(mod?.name ?? '') && !disableUpdate)" class="badge bg-warning mt-2">
                        {{ $t("mods.requireUpdate") }}
                    </span>

                    <!--Tags-->
                    <span v-for="(tag, index) in mod?.tags" :key="index" class="badge bg-primary mt-2">
                        {{ $t(`mods.tags.${tag}`) }}
                    </span>

                    <span v-if="mod?.isDeleted" class="badge bg-danger mt-2">
                        {{ $t("mods.isDeleted") }}
                    </span>
                    <span v-if="(modSize == undefined) && modSizeGet && !isLocal && !isInstallMod(mod?.name ?? '')"
                        class="badge bg-danger mt-2">
                        {{ $t("mods.noSource") }}
                    </span>
                    <template v-if="localmod?.info.modVerify">
                        <span v-if="localmod.info.modVerify.fulllevel >= 2" class="badge mt-2 text-success"
                            style="font-size: .75rem" :title="$t('mods.importLocal.alert_full') 
                            + getVerifyDate(localmod.info.modVerify)">
                            <i class="bi bi-patch-check"></i>
                        </span>
                        <span v-if="localmod.info.modVerify.fulllevel == 1" class="badge mt-2 text-warning"
                            style="font-size: .75rem" :title="$t('mods.importLocal.alert_dllfull') 
                            + getVerifyDate(localmod.info.modVerify)
                            + getMissingFileText(localmod.info.modVerify)">
                            <i class="bi bi-patch-exclamation"></i>
                        </span>
                        <span v-if="localmod.info.modVerify.fulllevel == 0" class="badge mt-2 text-danger"
                            style="font-size: .75rem" :title="$t('mods.importLocal.alert_dllnotfull') 
                            + getVerifyDate(localmod.info.modVerify)
                            + getMissingFileText(localmod.info.modVerify)">
                            <i class="bi bi-patch-exclamation"></i>
                        </span>
                    </template>
                </div>
            </button>

        </h2>
        <div class="accordion-collapse collapse" ref="body">
            <div class="accordion-body" v-if="isInitBody">
                <!--accordion body-->
                <div>
                    <div class="d-flex w-100">
                        <template v-if="!isInstallMod(mod?.name as string)">
                            <button class="btn btn-primary flex-grow-1" @click="$emit('importFromScarab', scarab)"
                                :disabled="isDownload" v-if="scarab">{{
                                $t("mods.importScarab.title") }}</button>
                            <button class="btn btn-primary flex-grow-1" @click="$emit('importFromLocal', rlocal)"
                                :disabled="isDownload" v-if="rlocal">{{
                                $t("mods.importLocal.title") }}</button>
                            <button class="btn btn-primary flex-grow-1" @click="installMod"
                                :disabled="isDownload || (modSize == undefined) || !isOnline()">{{ $t("mods.install")
                                }}</button>
                        </template>
                        <div class="flex-grow-1 d-flex" v-else>

                            <div class="flex-grow-1 d-flex">
                                <template v-if="localmod">
                                    <a class="btn btn-primary bi bi-box-arrow-up-right" v-if="canExportToScarab()"
                                        :title="$t('mods.exportToScarab')" @click="exportToScarab()"></a>
                                    <a class="btn btn-primary bi bi-folder2-open" :title="$t('mods.openDataFolder')"
                                        @click="openModFolder(localmod?.name ?? '')"></a>
                                    <a class="btn btn-primary bi bi-file-earmark" :title="$t('mods.openDllFolder')"
                                        @click="openFolder(localmod?.info.path ?? '')"></a>
                                    <a class="btn btn-primary bi bi-patch-check" :title="$t('mods.verifyMod')"
                                        @click="vaildMod()"></a>
                                    <button class="btn btn-primary bi bi-wrench-adjustable"
                                        :title="$t('mods.repairMod')"
                                        v-if="localmod?.info.modVerify && localmod.info.modVerify.fulllevel < 2"
                                        :disabled="isDisbaleRepairModBtn()" @click="repairMod()"></button>
                                </template>
                                <div class="flex-grow-1 d-flex">
                                    <button class="btn btn-primary flex-grow-1"
                                        v-if="!isUsed(mod?.name as string) && canEnable(mod?.name as string)"
                                        @click="toggleMod(true)">
                                        {{ $t("mods.use") }}
                                    </button>
                                    <button class="btn btn-primary flex-grow-1" v-if="isUsed(mod?.name as string)"
                                        @click="toggleMod(false)">
                                        {{ $t("mods.unuse") }}
                                    </button>
                                    <button class="btn btn-primary flex-grow-1" @click="installMod"
                                        v-if="!canEnable(mod?.name as string)" :disabled="isDownload || !isOnline()">{{
                                        $t("mods.installDep")
                                        }}</button>
                                </div>
                                <button class="btn btn-danger flex-grow-1" @click="uninstallMod" :disabled="isDownload">
                                    {{ $t("mods.uninstall") }}</button>
                                <div class="flex-grow-1 d-flex"
                                    v-if="(isRequireUpdate(mod?.name as string) && !disableUpdate)">
                                    <button class="btn btn-primary flex-grow-1" :disabled="isDownload || !isOnline()"
                                        @click="updateMod()">
                                        {{ $t("mods.update") }}
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>

                    <div>
                        <span>{{ $t("mods.version") }}: </span>
                        <span v-if="isRequireUpdate(mod.name)" class="text-success" copyable>
                            {{
                            isLocal ? `${ mod.version } -> ${ getLatestVersion(mod.name) } ` :
                            `${ getLocalLatestModVer(mod.name) } -> ${ mod.version } `
                            }}
                        </span>
                        <span v-else copyable>{{ mod?.version }}</span>
                    </div>
                    <div v-if="licenseName != null">
                        <span>{{ $t('mods.license') }}: </span>
                        <span copyable>{{ licenseName }}</span>
                    </div>
                    <div v-if="modSize">
                        <span>{{ $t("mods.size") }}: </span>
                        <span copyable>{{ getModSize() }}</span>
                    </div>
                    <div v-if="mod.owner">
                        <span>{{ $t("mods.owner") }}:</span>
                        <a :style="{ 'textDecoration': 'none' }" href='javascript:;'
                            @click="openLink(`https://github.com/${mod.owner}`)" copyable>{{ mod.owner }}</a>
                        <a :style="{ 'textDecoration': 'none' }" href="javascript:;"
                            @click="lookAtAuthor(mod.owner ?? '')"> ({{ $t('mods.ownerOtherMods') }})</a>
                    </div>
                    <div>
                        <span>{{ $t("mods.repo") }}:</span>
                        <a copyable href="javascript:;" @click="openLink(mod?.repository ?? '')">{{
                            mod?.repository
                        }}</a>
                    </div>
                    <div v-if="releasePath">
                        <span>{{ $t("mods.releasePath") }}:</span>
                        <a copyable href="javascript:;" @click="openLink(releasePath ?? '')">{{ releasePath }}</a>
                    </div>
                    <div v-if="mod.date && mod.date != '1970-12-22T04:50:23Z'">
                        <span>{{ $t("mods.publishTime") }}:</span>
                        <span copyable>{{ getModPublishTime(mod.date).toLocaleString() }}</span>
                    </div>
                    <div v-if="localmod">
                        <span>{{ $t("mods.installTime") }}:</span>
                        <span copyable>{{ new Date(localmod.info.install).toLocaleString() }}</span>
                    </div>
                    <div>
                        <hr />
                        <h5>{{ $t("mods.desc") }}</h5>
                        <div copyable>
                            {{ mod?.desc }}
                        </div>
                        <!--<div v-if="getModDesc()" copyable>
                            <hr />
                            {{ getModDesc() }}
                        </div>-->
                    </div>
                    <div v-if="(mod?.dependencies?.length ?? 0) > 0">
                        <hr />
                        <h5>{{ $t("mods.dep") }} ({{ mod.dependencies.length }})</h5>
                        <template v-if="isLocal || mod.date == '1970-12-22T04:50:23Z'">
                            <h6 v-for="(dep, i) in mod?.dependencies" :key="i" copyable>
                                <a :style="{ 'textDecoration': 'none' }" @click="anchorMod(dep)" href="javascript:;">{{
                                    dep
                                }}</a>
                                <span v-if="isInstallMod(dep) && (isUsed(dep) || !isLocal)" class="text-success"
                                    notcopyable>
                                    ({{ $t("mods.depInstall") }})
                                </span>
                                <span v-if="!isInstallMod(dep) && isLocal" class="text-danger" notcopyable>
                                    ({{ $t("mods.missingDep") }})
                                </span>
                                <span v-if="isInstallMod(dep) && !isUsed(dep) && isLocal" class="text-danger"
                                    notcopyable>
                                    ({{ $t("mods.disabled") }})
                                </span>
                            </h6>
                        </template>
                        <template v-else>
                            <h6 v-for="(dep, i) in getLowestDep(mod)" :key="i">
                                <a :style="{ 'textDecoration': 'none' }" @click="anchorMod(dep.name)"
                                    href="javascript:;">{{ dep.name }} (>= {{ dep.version }})</a>
                                <span v-if="!isInstallMod2(dep.name, dep.version) && isInstallMod(dep.name)"
                                    class="text-danger">
                                    ({{ $t("mods.requireUpdate") }})
                                </span>
                                <span v-if="isInstallMod2(dep.name, dep.version)" class="text-success">
                                    ({{ $t("mods.depInstall") }})
                                </span>
                            </h6>
                        </template>
                    </div>

                    <div v-if="(mod?.authors?.length ?? 0) > 0">
                        <hr />
                        <h5>{{ $t("mods.authors") }} ({{ mod.authors.length }})</h5>
                        <h6 v-for="(author, i) in mod?.authors" :key="i" copyable>
                            {{ author }}
                        </h6>
                    </div>
                    <div v-if="depOnThis.length > 0">
                        <hr />
                        <h5>{{ $t("mods.depOnThis") }} ({{ depOnThis.length }})</h5>
                        <CModsDiList :mods="depOnThis" :is-local="isLocal"></CModsDiList>
                    </div>
                    <div v-if="integrateWithThis.length > 0">
                        <hr />
                        <h5>{{ $t("mods.integrateWithThis") }} ({{ integrateWithThis.length }})</h5>
                        <CModsDiList :mods="integrateWithThis" :is-local="isLocal"></CModsDiList>
                    </div>
                </div>
                <!--accordion body end-->
            </div>

        </div>
    </div>
</template>

<style>
.mod-item {
    background-color: var(--bs-gray-200);
    color: var(--bs-black);
}
</style>

<script lang="ts">
import { getModLinkMod, getModLinks, modlinksCache, ModLinksManifestData, getModDate, getLowestDep, getSubMods_ModLinks, getIntegrationsMods_ModLinks, getModRepo } from '@/renderer/modlinks/modlinks';
import { getLocalMod, getOrAddLocalMod, isLaterVersion, isDownloadingMod, LocalModInstance, getSubMods, getIntegrationsMods, getRealModPath, IImportedLocalModVerify, verifyModFiles } from '@/renderer/modManager';
import { getCurrentGroup } from '@/renderer/modgroup'
import { Collapse } from 'bootstrap';
import * as remote from "@electron/remote";
import { defineComponent } from 'vue';
import { I18nLanguages } from '@/lang/langs';
import { ConvertSize, getShortName } from '@/renderer/utils/utils';
import { hasOption } from '@/renderer/settings';
import { getScarabModConfig, ModInfo } from '@/renderer/relocation/Scarab/RScarab';
import { existsSync } from 'fs';
import CModsDiList from './c-mods-di-list.vue';
import { dirname, join, parse } from 'path';
import { IRLocalMod } from '@/renderer/relocation/RLocal';
import { getSearchText, setSearchText } from './c-mods-search.vue';
import { shell } from 'electron';
import { ignoreVerifyMods, repairMod } from '@/renderer/modrepairer';
import { startTask } from '@/renderer/taskManager';

const licenseCache: Record<string, string | null> = {};

export default defineComponent({
    methods: {
        toggleCollapse(name: string) {
            this.isInitBody = true;
            setTimeout(() => {
                this.getCollapse(name).toggle();
            }, 1);

        },
        getCollapse(name: string) {
            return this.collapses[name] ??= new Collapse(this.$refs[name] as Element);
        },
        isCollapseHide(name: string) {
            const el = this.$refs[name] as Element;
            if (!el)
                return false;
            return el.classList.contains("collapse") && !el.classList.contains("collapsing") && !el.classList.contains("show");
        },
        openLink(link: string) {
            remote.shell.openExternal(link);
        },
        isInstallMod(name: string) {
            return getLocalMod(name)?.isInstalled() ?? false;
        },
        isInstallMod2(name: string, minver: string) {
            const mod = getLocalMod(name);
            if (!mod)
                return false;
            const lv = mod.getLatestVersion();
            if (!lv)
                return false;
            if (isLaterVersion(lv, minver))
                return true;
            return lv == minver;
        },
        canEnable(name: string) {
            const mg = getLocalMod(name);
            if (!mg)
                return false;
            return mg.canEnable();
        },
        isRequireUpdate(name: string) {
            if (this.disableUpdate || !this.modlinkCache)
                return false;
            const lm = getLocalMod(name);
            if (!lm)
                return false;
            const lv = lm.getLatestVersion();
            if (name == "Benchwrap") console.log(lm);
            if (!lv)
                return;
            return isLaterVersion(this.modlinkCache.getMod(name)?.version ?? "0", lv);
        },
        getLocalLatestModVer(name: string) {
            const lm = getLocalMod(name);
            if (!lm)
                return undefined;
            const lv = lm.getLatestVersion();

            return lv;
        },
        vaildMod() {
            if (this.mod === undefined) return;
            const lm = getLocalMod(this.mod.name);
            if (!lm) return;
            const ver = lm.getLatest();
            if (!ver || !ver.info.modinfo.ei_files?.files) return;
            const missing_files: string[] = [];
            ver.info.modVerify = {
                fulllevel: verifyModFiles(ver.info.path, ver.info.modinfo.ei_files?.files, missing_files),
                missingFiles: missing_files,
                verifyDate: Date.now()
            };
            ver.save();
            this.$forceUpdate();
        },
        repairMod() {
            if (this.mod === undefined) return;
            const lm = getLocalMod(this.mod.name);
            if (!lm) return;
            const ver = lm.getLatest();
            if (!ver || !ver.info.modinfo.ei_files?.files) return;
            startTask(`Repair mod ${lm.name}-v${ver.info.version}`, undefined, async (task) => {
                this.$forceUpdate();
                await repairMod(ver, task);
            });
        },
        isDisbaleRepairModBtn() {
            return ignoreVerifyMods.has(this.localmod?.info.path ?? "") || isDownloadingMod(this.mod?.name ?? '');
        },
        getModAliasName(name: string) {
            if (hasOption('HIDE_MOD_ALIAS'))
                return undefined;
            const lang = I18nLanguages[this.$i18n.locale];
            const alias = lang?.mods?.nameAlias;
            if (!alias)
                return undefined;
            return alias[name?.toLowerCase()?.replaceAll(" ", "")];
        },
        getShortName(name: string) {
            if (!hasOption('SHOW_MOD_SHORT_NAME'))
                return name.toUpperCase();
            return getShortName(name);
        },
        getModDesc() {
            const lang = I18nLanguages[this.$i18n.locale];
            const desc = lang?.mods?._desc;
            if (!desc)
                return undefined;
            return desc[this.mod?.name?.toLowerCase()?.replaceAll(" ", "")];
        },
        getLatestVersion(name: string) {
            if (this.disableUpdate || !this.modlinkCache)
                return undefined;
            return this.modlinkCache.getMod(name)?.version;
        },
        exportToScarab() {
            if (!this.localmod)
                return;
            this.$emit("showExportToScarabConfirm", this.localmod);
        },
        canExportToScarab() {
            return this.isUseScarab() && this.localmod;
        },
        isUseScarab() {
            return existsSync(getScarabModConfig());
        },
        async installMod() {
            if (this.mod === undefined)
                return;
            const group = getOrAddLocalMod(this.mod.name);
            (await group.installNew(this.mod)).install(true);
            this.$forceUpdate();
            this.$parent?.$forceUpdate();
        },
        async installModDep() {
            if (this.mod === undefined)
                return;
            const group = getOrAddLocalMod(this.mod.name);
            await group.getLatest()?.checkDependencies();
            this.$forceUpdate();
            this.$parent?.$forceUpdate();
        },
        uninstallMod() {
            if (this.mod === undefined)
                return;
            const group = getOrAddLocalMod(this.mod.name);
            group.uninstall(undefined);
            this.$forceUpdate();
            this.$parent?.$forceUpdate();
        },
        isUsed(name: string) {
            if (this.mod === undefined)
                return false;
            const lm = getLocalMod(name);
            if (!lm)
                return false;
            return lm.isActived();
        },
        toggleMod(actived: boolean) {
            if (this.mod === undefined)
                return;
            const lm = getLocalMod(this.mod.name);
            if (!lm || !lm.isInstalled())
                return;
            const group = getCurrentGroup();
            if (!actived) {
                lm.disableAll();
                group.removeMod(this.mod.name);
            }
            else {
                lm.getLatest()?.install();
                group.addMod(this.mod.name, this.mod.version);
            }
            this.$forceUpdate();
        },
        getModPublishTime(date: string) {
            return getModDate(date);
        },
        getLowestDep(mod?: ModLinksManifestData) {
            if (!mod)
                return [];
            return getLowestDep(mod) ?? [];
        },
        anchorMod(name: string) {
            const rn = `mod-download-${name.replaceAll(" ", "")}`;
            const dom = document.getElementById(rn);
            if (!dom)
                return;
            dom.scrollIntoView();
        },
        async updateMod() {
            if (this.mod === undefined || this.disableUpdate)
                return;
            const ml = await getModLinkMod(this.mod.name);
            if (!ml)
                return;
            const group = getOrAddLocalMod(this.mod.name);
            const oa = group.isActived();
            group.disableAll(false);
            await group.installNew(ml);
            if (!oa)
                group.getLatest()?.uninstall();
            this.$forceUpdate();
            this.$parent?.$forceUpdate();
        },
        getModSize() {
            if (!this.modSize)
                return "0 KB";
            return ConvertSize(this.modSize);
        },
        openFolder(folder: string) {
            shell.openPath(folder);
        },
        openModFolder(name: string) {
            this.openFolder(getRealModPath(name));
        },
        getModRepo(repo: string) {
            return getModRepo(repo);
        },
        buildSvgUrl(repo: string) {
            const r = getModRepo(repo);
            if (!r) return undefined;
            return `https://img.shields.io/github/license/${r[0]}/${r[1]}?style=for-the-badge`;
        },
        getMissingFileText(mod: IImportedLocalModVerify) {
            const files = mod.missingFiles;
            if (!files) return "";
            return `\n${this.$t('mods.importLocal.missing_files')}:\n${files.join('\n')}`;
        },
        getVerifyDate(mod: IImportedLocalModVerify) {
            return "\n" + this.$t('mods.lastVerify', {
                date: new Date(mod.verifyDate).toLocaleString(),
                past: Math.round((Date.now() - mod.verifyDate) / 1000)
            });
        },
        isOnline() {
            if (!navigator.onLine) return false;
            if (modlinksCache) {
                return !modlinksCache.offline;
            }
            return true;
        },
        lookAtAuthor(author: string) {
            let search = getSearchText();
            const index = search.indexOf(':author=');
            if (index == -1) {
                setSearchText(search + " :author=" + author);
                return;
            }
            if (search.includes(':author=' + author)) return;
            search = search.replace(/:author=([-A-Za-z0-9_]+)/g, " :author=" + author);
            setSearchText(search);
        }
    },
    props: {
        inmod: Object,
        localmod: LocalModInstance,
        isLocal: Boolean,
        disableUpdate: Boolean,
        scarabInstalled: Object,
        localInstalled: Object
    },
    computed: {
        scarab(): ModInfo {
            return this.scarabInstalled as ModInfo;
        },
        rlocal(): IRLocalMod {
            return this.localInstalled as IRLocalMod;
        },
        releasePath(): string | undefined {
            if (!this.mod?.link) return undefined;
            const url = new URL(this.mod.link);
            if (url.hostname !== 'github.com') return undefined;
            const tag = parse(dirname(url.pathname));
            const repo = dirname(dirname(dirname(dirname(url.pathname))));
            url.pathname = join(repo, "releases", "tag", tag.base);
            return url.toString();
        }
    },
    data() {
        return {
            mod: this.inmod as ModLinksManifestData,
            checkTimer: setInterval(() => this.$forceUpdate(), 1000),
            depOnThis: this.isLocal ? getSubMods(this.mod?.name ?? "") : getSubMods_ModLinks(this.mod?.name ?? ""),
            integrateWithThis: this.isLocal ? getIntegrationsMods(this.mod?.name ?? "") : getIntegrationsMods_ModLinks(this.mod?.name ?? ""),
            isDownload: false,
            modlinkCache: modlinksCache,
            modSize: undefined as (undefined | number),
            modSizeGet: false,
            collapses: {} as Record<string, Collapse>,
            licenseName: null as (string | null),
            isInitBody: false
        };
    },
    beforeUpdate() {
        if(!this.isInitBody) return;
        this.depOnThis = this.isLocal ? getSubMods(this.mod?.name ?? "") : getSubMods_ModLinks(this.mod?.name ?? "");
        this.integrateWithThis = this.isLocal ? getIntegrationsMods(this.mod?.name ?? "") : getIntegrationsMods_ModLinks(this.mod?.name ?? "")
        this.isDownload = isDownloadingMod(this.mod?.name as string);
    },
    mounted() {
        getModLinks().then((val) => {
            this.modlinkCache = val;
            this.$forceUpdate();
        });
        this.modSizeGet = true;
        this.modSize = this.mod.ei_files?.noSource ? undefined : (this.mod.ei_files?.size ?? 0);
        if (this.mod.repository && hasOption('SHOW_LICENCE') && navigator.onLine) {
            const repo = this.mod.repository;
            if (licenseCache[repo] != undefined) {
                this.licenseName = licenseCache[repo];
            } else {
                const url = this.buildSvgUrl(repo);
                if (url) {
                    fetch(url).then(async val => {
                        const text = await val.text();
                        const le = text.lastIndexOf('</text>');
                        const ls = text.lastIndexOf('>', le);
                        let l: string | null = text.substring(ls + 1, le);
                        if (l == 'NOT SPECIFIED' || l == 'NOT IDENTIFIABLE BY GITHUB') l = null;
                        this.licenseName = licenseCache[repo] = l;
                    }).catch();
                }
            }
        }

    },
    unmounted() {
        clearInterval(this.checkTimer);
    },
    emits: {
        showExportToScarabConfirm: null,
        importFromScarab: null,
        importFromLocal: null
    },
    components: { CModsDiList }
});
</script>
