
<template>
    <div class="task-item accordion-item text-black p-1">
        <h2 class="accordion-header">
            <button class="accordion-button collapsed" @click="toggleBody()">
                <div class="d-flex">
                    <div class="p-1">
                        {{ mod?.name }}
                    </div>
                    <span v-if="isUsed(mod?.name ?? '')" class="badge bg-success mt-2">
                        {{ $t("mods.enabled") }}
                    </span>
                    <span v-if="isInstallMod(mod?.name ?? '') && !isUsed(mod?.name ?? '')"
                        class="badge bg-success mt-2">
                        {{ $t("mods.depInstall") }}
                    </span>
                    <span v-if="isRequireUpdate(mod?.name ?? '')" class="badge bg-warning mt-2">
                        {{ $t("mods.requireUpdate") }}
                    </span>

                    <!--Tags-->
                    <span v-for="(tag, index) in mod?.tags" :key="index" class="badge bg-primary mt-2">
                        {{ $t(`mods.tags.${tag}`) }}
                    </span>
                </div>
            </button>

        </h2>
        <div class="accordion-collapse collapse" ref="body">
            <div class="accordion-body">
                <!--accordion body-->
                <div>
                    <div class="d-flex w-100">
                        <button class="btn btn-primary flex-grow-1" @click="installMod" :disabled="isDownload"
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
                                        v-if="!canEnable(mod?.name as string)" :disabled="isDownload">{{ $t("mods.installDep") }}</button>
                                </div>
                                <button class="btn btn-danger flex-grow-1" @click="uninstallMod"  :disabled="isDownload">
                                    {{ $t("mods.uninstall") }}</button>
                            </div>
                        </div>
                        <div class="flex-grow-1 d-flex" v-if="isRequireUpdate(mod?.name as string) && !isLocal">
                            <button class="btn btn-primary flex-grow-1"  :disabled="isDownload">
                                {{ $t("mods.update") }}
                            </button>
                        </div>
                    </div>

                    <div>
                        <span>{{ $t("mods.version") }}: </span>
                        <span>{{ mod?.version }}</span>
                    </div>
                    <div>
                        <span>{{ $t("mods.repo") }}:</span>
                        <a href="javascript:;" @click="openLink(mod?.repository ?? '')">{{ mod?.repository }}</a>
                    </div>
                    <div>
                        <hr />
                        <h5>{{ $t("mods.desc") }}</h5>
                        <div>
                            {{ mod?.desc }}
                        </div>
                    </div>
                    <div v-if="(mod?.dependencies?.length ?? 0) > 0">
                        <hr />
                        <h5>{{ $t("mods.dep") }}</h5>
                        <h6 v-for="(dep, i) in mod?.dependencies" :key="i">
                            {{ dep }}
                            <span v-if="isInstallMod(dep) && (isUsed(dep) || !isLocal)" class="text-success">
                                ({{ $t("mods.depInstall") }})
                            </span>
                            <span v-if="!isInstallMod(dep) && isLocal" class="text-danger">
                                ({{ $t("mods.missingDep") }})
                            </span>
                            <span v-if="isInstallMod(dep) && !isUsed(dep) && isLocal" class="text-danger">
                                ({{ $t("mods.disabled") }})
                            </span>
                        </h6>
                    </div>

                    <div v-if="(mod?.authors?.length ?? 0) > 0">
                        <hr />
                        <h5>{{ $t("mods.authors") }}</h5>
                        <h6 v-for="(author, i) in mod?.authors" :key="i">
                            {{ author }}
                        </h6>
                    </div>
                    <div v-if="isLocal && (depOnThis.length > 0)">
                        <hr />
                        <h5>{{ $t("mods.depOnThis") }}</h5>
                        <h6 v-for="(mod, i) in depOnThis" :key="i">
                            {{ mod.info.name }}
                            <span v-if="mod.isActived()" class="text-success">
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
import { ModLinksManifestData } from '@/renderer/modlinks/modlinks';
import { getLocalMod, getOrAddLocalMod, isLaterVersion, getSubMods, isDownloadingMod } from '@/renderer/modManager';
import { getCurrentGroup } from '@/renderer/modgroup'
import { Collapse } from 'bootstrap';
import { remote } from 'electron';
import { defineComponent } from 'vue';

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
        canEnable(name: string) {
            const mg = getLocalMod(name);
            if (!mg) return false;
            return mg.canEnable();
        },
        isRequireUpdate(name: string) {
            if (this.disableUpdate) return false;
            const lm = getLocalMod(name);
            if (!lm) return false;
            const lv = lm.getLatestVersion();
            if (!lv) return;
            return isLaterVersion(this.mod?.version ?? "", lv);
        },
        async installMod() {
            if (this.mod === undefined) return;
            const group = getOrAddLocalMod(this.mod.name);
            await group.installNew(this.mod);
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
        async updateMod() {
            if (this.mod === undefined || this.isLocal) return;
            const group = getOrAddLocalMod(this.mod.name);
            group.disableAll();
            await group.installNew(this.mod);
            group.getLatest()?.install();
            this.$forceUpdate();
        }
    },
    props: {
        mod: ModLinksManifestData,
        isLocal: Boolean,
        disableUpdate: Boolean
    },
    data() {
        return {
            checkTimer: setInterval(() => this.$forceUpdate(), 1000),
            depOnThis: getSubMods(this.mod?.name ?? ""),
            isDownload: false
        }
    },
    beforeUpdate() {
        this.depOnThis = getSubMods(this.mod?.name ?? "");
        this.isDownload = isDownloadingMod(this.mod?.name as string);
    },
    unmounted() {
        clearInterval(this.checkTimer);
    }
});
</script>
