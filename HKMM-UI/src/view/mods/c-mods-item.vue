
<template>
    <div class="task-item accordion-item text-black p-1">
        <h2 class="accordion-header">
            <button class="accordion-button collapsed" @click="toggleBody()">
                <div class="d-flex">
                    <div class="p-1">
                        {{ mod?.name }}
                    </div>
                    <span v-if="isInstallMod(mod?.name ?? '')" class="badge bg-success mt-2">
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
                        <button class="btn btn-primary flex-grow-1" @click="installMod" ref="btnInstall"
                            v-if="!isInstallMod(mod?.name ?? '')">{{ $t("mods.install") }}</button>
                        <div class="flex-grow-1 d-flex" v-if="isInstallMod(mod?.name ?? '')">

                            <div class="flex-grow-1 d-flex">
                                <button class="btn btn-primary flex-grow-1" v-if="!isUsed(mod?.name ?? '')" @click="toggleMod(true)">
                                    {{ $t("mods.use") }}
                                </button>
                                <button class="btn btn-primary flex-grow-1" v-if="isUsed(mod?.name ?? '')" @click="toggleMod(false)">
                                    {{ $t("mods.unuse") }}
                                </button>
                                <button class="btn btn-danger flex-grow-1" @click="uninstallMod" ref="btnUninstall">
                                    {{ $t("mods.uninstall") }}</button>
                            </div>
                        </div>
                        <div class="flex-grow-1 d-flex" v-if="isRequireUpdate(mod?.name ?? '') && !isLocal">
                            <button class="btn btn-primary flex-grow-1" ref="btnUpdate">
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
import { getLocalMod, getOrAddLocalMod, isLaterVersion, getSubMods } from '@/renderer/modManager';
import { Collapse } from 'bootstrap';
import { remote } from 'electron';
import { ButtonHTMLAttributes, defineComponent } from 'vue';

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
        isRequireUpdate(name: string) {
            const lm = getLocalMod(name);
            if (!lm) return false;
            const lv = lm.getLatestVersion();
            if (!lv) return;
            return isLaterVersion(this.mod?.version ?? "", lv);
        },
        async installMod() {
            if (this.mod === undefined) return;
            const installBtn = this.$refs.btnInstall as ButtonHTMLAttributes;
            installBtn.disabled = true;
            const group = getOrAddLocalMod(this.mod.name);
            await group.installNew(this.mod);
            installBtn.disabled = false;
            group.getLatest()?.install();
            this.$forceUpdate();
        },
        uninstallMod() {
            if (this.mod === undefined) return;
            const uninstallBtn = this.$refs.btnUninstall as ButtonHTMLAttributes;
            uninstallBtn.disabled = true;
            const group = getOrAddLocalMod(this.mod.name);
            group.uninstall(undefined);
            uninstallBtn.disabled = false;
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
            console.log(lm.isActived());
            if(!actived) {
                lm.disableAll();
            } else {
                lm.getLatest()?.install();
            }
            this.$forceUpdate();
        },
        async updateMod() {
            if (this.mod === undefined || this.isLocal) return;
            const updateBtn = this.$refs.btnUpdate as ButtonHTMLAttributes;
            updateBtn.disabled = true;
            const group = getOrAddLocalMod(this.mod.name);
            group.uninstall();
            await group.installNew(this.mod);
            group.getLatest()?.install();
            updateBtn.disabled = false;
            this.$forceUpdate();
        }
    },
    props: {
        mod: ModLinksManifestData,
        isLocal: Boolean
    },
    data() {
        return {
            checkTimer: setInterval(() => this.$forceUpdate(), 1000),
            depOnThis: getSubMods(this.mod?.name ?? "")
        }
    },
    beforeUpdate() {
        this.depOnThis = getSubMods(this.mod?.name ?? "");
    },
    unmounted() {
        clearInterval(this.checkTimer);
    }
});
</script>
