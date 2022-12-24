
<template>
    <div class="task-item accordion-item text-black p-1" :id="`mod-download-${mod.name.replaceAll(' ', '')}`">
        <h2 class="accordion-header">
            <button class="accordion-button collapsed" @click="toggleBody()">
                <div class="d-flex">
                    <div class="p-1">
                        {{ mod?.name }}
                        <strong v-if="getModAliasName(mod.name) != undefined">
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
                    <span v-if="(modSize == undefined) && modSizeGet && !isLocal && !isInstallMod(mod?.name ?? '')" class="badge bg-danger mt-2">
                        {{ $t("mods.noSource") }}
                    </span>
                </div>
            </button>

        </h2>
        <div class="accordion-collapse collapse bg-secondary text-white" ref="body">
            <div class="accordion-body">
                <!--accordion body-->
                <div>
                    <div class="d-flex w-100">
                        <button class="btn btn-primary flex-grow-1" @click="installMod"
                            :disabled="isDownload || (modSize == undefined)"
                            v-if="!isInstallMod(mod?.name as string)">{{ $t("mods.install") }}</button>
                        <div class="flex-grow-1 d-flex" v-if="isInstallMod(mod?.name as string)">

                            <div class="flex-grow-1 d-flex">
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
                                        v-if="!canEnable(mod?.name as string)" :disabled="isDownload">{{
                                                $t("mods.installDep")
                                        }}</button>
                                </div>
                                <button class="btn btn-danger flex-grow-1" @click="uninstallMod" :disabled="isDownload">
                                    {{ $t("mods.uninstall") }}</button>
                            </div>
                        </div>
                        <div class="flex-grow-1 d-flex" v-if="(isRequireUpdate(mod?.name as string) && !disableUpdate)">
                            <button class="btn btn-primary flex-grow-1" :disabled="isDownload" @click="updateMod()">
                                {{ $t("mods.update") }}
                            </button>
                        </div>
                    </div>

                    <div>
                        <span>{{ $t("mods.version") }}: </span>
                        <span v-if="isRequireUpdate(mod.name)" class="text-success" copyable>
                            {{
                                isLocal ? `${mod.version} -> ${getLatestVersion(mod.name)}` : `${getLocalLatestModVer(mod.name)} -> ${mod.version}`
                            }}
                        </span>
                        <span v-else copyable>{{ mod?.version }}</span>
                    </div>
                    <div v-if="modSize">
                        <span>{{ $t("mods.size") }}: </span>
                        <span copyable>{{ getModSize() }}</span>
                    </div>
                    <div>
                        <span>{{ $t("mods.repo") }}:</span>
                        <a copyable href="javascript:;" @click="openLink(mod?.repository ?? '')">{{ mod?.repository }}</a>
                    </div>
                    <div v-if="mod.date">
                        <span>{{ $t("mods.publishTime") }}:</span>
                        <span copyable>{{ getModPublishTime(mod.date).toLocaleString() }}</span>
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
                        <h5>{{ $t("mods.dep") }}</h5>
                        <template v-if="isLocal">
                            <h6 v-for="(dep, i) in mod?.dependencies" :key="i" copyable>
                                {{ dep }}
                                <span v-if="isInstallMod(dep) && (isUsed(dep) || !isLocal)" class="text-success" notcopyable>
                                    ({{ $t("mods.depInstall") }})
                                </span>
                                <span v-if="!isInstallMod(dep) && isLocal" class="text-danger" notcopyable>
                                    ({{ $t("mods.missingDep") }})
                                </span>
                                <span v-if="isInstallMod(dep) && !isUsed(dep) && isLocal" class="text-danger" notcopyable>
                                    ({{ $t("mods.disabled") }})
                                </span>
                            </h6>
                        </template>
                        <template v-if="!isLocal">
                            <h6 v-for="(dep, i) in getLowestDep(mod)" :key="i">
                                <a :style="{ 'textDecoration': 'none' }" @click="anchorMod(dep.name)" href="javascript:;">{{ dep.name }} (>= {{ dep.version }})</a>
                                <span v-if="!isInstallMod2(dep.name, dep.version) && isInstallMod(dep.name)" class="text-danger">
                                    ({{ $t("mods.requireUpdate") }})
                                </span>
                                <span v-if="isInstallMod2(dep.name, dep.version)" class="text-success">
                                    ({{ $t("mods.depInstall") }})
                                </span>
                            </h6>
                        </template>
                    </div>

                    <div v-if="(mod?.authors?.length ?? 0) > 0" >
                        <hr />
                        <h5>{{ $t("mods.authors") }}</h5>
                        <h6 v-for="(author, i) in mod?.authors" :key="i" copyable>
                            {{ author }}
                        </h6>
                    </div>
                    <div v-if="isLocal && (depOnThis.length > 0)" > 
                        <hr />
                        <h5>{{ $t("mods.depOnThis") }}</h5>
                        <h6 v-for="(mod, i) in depOnThis" :key="i" copyable>
                            {{ mod.info.name }}
                            <span v-if="mod.isActived()" class="text-success" notcopyable>
                                ({{ $t("mods.enabled") }})
                            </span>
                        </h6>
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
import { getModLinkMod, getModLinks, modlinksCache, ModLinksManifestData, getModDate, getLowestDep } from '@/renderer/modlinks/modlinks';
import { getLocalMod, getOrAddLocalMod, isLaterVersion, getSubMods, isDownloadingMod } from '@/renderer/modManager';
import { getCurrentGroup } from '@/renderer/modgroup'
import { Collapse } from 'bootstrap';
import { remote } from 'electron';
import { defineComponent } from 'vue';
import { getFileSize } from '@/renderer/utils/downloadFile';
import { I18nLanguages } from '@/lang/langs';
import { ConvertSize } from '@/renderer/utils/utils';

class ModSizeCache {
    public time: number = new Date().valueOf();
    public static cache: Record<string, ModSizeCache> = {};
    public promise?: Promise<number>;
    public size?: number;

    public static async getSize(url: string) {
        if(!navigator.onLine) return undefined;
        const ct = new Date().valueOf();

        let c = ModSizeCache.cache[url] ?? new ModSizeCache();
        if (ct - c.time > 1000 * 60 * 60 /* 1 Hour */) c = new ModSizeCache();
        ModSizeCache.cache[url] = c;
        if (c.size) return c.size;
        if (c.promise) return await c.promise;
        c.promise = (async function () {
            const result = await getFileSize(url);
            c.size = result;
            c.promise = undefined;
            return result;
        })();
        return await c.promise;
    }
}

export default defineComponent({
    methods: {
        toggleBody() {
            const tgb = new Collapse(this.$refs.body as Element);
            tgb.toggle();
        },
        openLink(link: string) {
            remote.shell.openExternal(link);
        },
        isInstallMod(name: string) {
            return getLocalMod(name)?.isInstalled() ?? false;
        },
        isInstallMod2(name: string, minver: string) {
            const mod = getLocalMod(name);
            if(!mod) return false;
            const lv = mod.getLatestVersion();
            if(!lv) return false;
            if(isLaterVersion(lv, minver)) return true;
            return lv == minver;
        },
        canEnable(name: string) {
            const mg = getLocalMod(name);
            if (!mg) return false;
            return mg.canEnable();
        },
        isRequireUpdate(name: string) {
            if (this.disableUpdate || !this.modlinkCache) return false;
            const lm = getLocalMod(name);
            if (!lm) return false;
            const lv = lm.getLatestVersion();
            if (!lv) return;
            return isLaterVersion(this.modlinkCache.getMod(name)?.version ?? "0", lv);
        },
        getLocalLatestModVer(name: string) {
            const lm = getLocalMod(name);
            if (!lm) return undefined;
            const lv = lm.getLatestVersion();
            return lv;
        },
        getModAliasName(name: string) {
            const lang = I18nLanguages[this.$i18n.locale];
            const alias = lang?.mods?.nameAlias;
            if(!alias) return undefined;
            return alias[name?.toLowerCase()?.replaceAll(' ', '')];
        },
        getModDesc() {
            const lang = I18nLanguages[this.$i18n.locale];
            const desc = lang?.mods?._desc;
            if(!desc) return undefined;
            return desc[this.mod?.name?.toLowerCase()?.replaceAll(' ', '')];
        },
        getLatestVersion(name: string) {
            if (this.disableUpdate || !this.modlinkCache) return undefined;
            return this.modlinkCache.getMod(name)?.version;
        },
        async installMod() {
            if (this.mod === undefined) return;
            const group = getOrAddLocalMod(this.mod.name);
            (await group.installNew(this.mod)).install(true);
            this.$forceUpdate();
        },
        async installModDep() {
            if (this.mod === undefined) return;
            const group = getOrAddLocalMod(this.mod.name);
            await group.getLatest()?.checkDependencies();
            this.$forceUpdate();
        },
        uninstallMod() {
            if (this.mod === undefined) return;
            const group = getOrAddLocalMod(this.mod.name);
            group.uninstall(undefined);
            this.$forceUpdate();
        },
        isUsed(name: string) {
            if (this.mod === undefined) return false;
            const lm = getLocalMod(name);
            if (!lm) return false;
            return lm.isActived();
        },
        toggleMod(actived: boolean) {
            if (this.mod === undefined) return;
            const lm = getLocalMod(this.mod.name);
            if (!lm || !lm.isInstalled()) return;
            const group = getCurrentGroup();
            if (!actived) {
                lm.disableAll();
                group.removeMod(this.mod.name)
            } else {
                lm.getLatest()?.install();
                group.addMod(this.mod.name, this.mod.version);
            }
            this.$forceUpdate();
        },
        getModPublishTime(date: string) {
            return getModDate(date);
        },
        getLowestDep(mod?: ModLinksManifestData) {
            if (!mod) return [];
            return getLowestDep(mod) ?? [];
        },
        anchorMod(name: string) {
            const rn = `mod-download-${name.replaceAll(' ', '')}`;
            const dom = document.getElementById(rn);
            if(!dom) return;
            dom.scrollIntoView();
        },
        async updateMod() {

            if (this.mod === undefined || this.disableUpdate) return;
            const ml = await getModLinkMod(this.mod.name);
            if (!ml) return;
            const group = getOrAddLocalMod(this.mod.name);
            group.disableAll();
            await group.installNew(ml);
            group.getLatest()?.install();
            this.$forceUpdate();
        },
        getModSize() {
            if (!this.modSize) return "0 KB";
            return ConvertSize(this.modSize);
        }
    },
    props: {
        inmod: Object,
        isLocal: Boolean,
        disableUpdate: Boolean
    },
    data() {
        return {
            mod: this.inmod as ModLinksManifestData,
            checkTimer: setInterval(() => this.$forceUpdate(), 1000),
            depOnThis: getSubMods(this.mod?.name ?? ""),
            isDownload: false,
            modlinkCache: modlinksCache,
            modSize: undefined as (undefined | number),
            modSizeGet: false
        }
    },
    beforeUpdate() {
        this.depOnThis = getSubMods(this.mod?.name ?? "");
        this.isDownload = isDownloadingMod(this.mod?.name as string);
    },
    mounted() {
        getModLinks().then((val) => {
            this.modlinkCache = val;
            this.$forceUpdate();

            ModSizeCache.getSize(val.getMod(this.mod?.name as string)?.link as string).then((val) => {
                this.modSize = val;
                this.modSizeGet = true;
                this.$forceUpdate();
            }).catch(() => {
                this.modSizeGet = true;
                this.$forceUpdate();
            });
        });

    },
    unmounted() {
        clearInterval(this.checkTimer);
    }
});
</script>
