<template>
    <div class="task-item accordion-item text-black p-1" v-if="groupctrl != undefined">
        <h2 class="accordion-header">
            <button class="accordion-button collapsed" @click="toggleBody()">
                <div class="d-flex">
                    <div class="p-1">
                        {{ groupctrl.info.name }}
                    </div>
                    <span v-if="isCurrent(groupctrl)" class="badge bg-success mt-2">
                        {{ $t("groups.current") }}
                    </span>
                </div>
            </button>

        </h2>
        <div class="accordion-collapse collapse" ref="body">
            <div class="accordion-body">
                <!--accordion body-->
                <div class="w-100 d-flex p-1">
                    <button class="btn btn-primary" v-if="canUseGroup(groupctrl as ModGroupController)"
                        @click="showExportModal(groupctrl?.info.guid as string)" :title="$t('groups.packShareMsg')">
                        <i class="bi bi-box-arrow-up-right"></i>
                    </button>
                    <button class="btn btn-primary" @click="genShareUrl(groupctrl as ModGroupController)"
                        :title="$t('groups.copyShareMsg')">
                        <i class="bi bi-share"></i>
                    </button>

                    <!----<button class="btn btn-primary" @click="rename(groupctrl as ModGroupController)">Rename</button>-->
                    <button class="btn btn-primary flex-grow-1" :disabled="isCurrent(groupctrl) || isDownloading"
                        v-if="canUseGroup(groupctrl as ModGroupController)" @click="setAsCurrent(groupctrl)">{{
                                $t("groups.use")
                        }}</button>
                    <button class="btn btn-primary flex-grow-1" :disabled="isDownloading"
                        v-if="!canUseGroup(groupctrl as ModGroupController)"
                        @click="downloadMissingMods(groupctrl as ModGroupController)">{{ $t("groups.download")
                        }}</button>
                    <button class="btn btn-danger" v-if="!isDefault(groupctrl)"
                        @click="showRemoveGroupModal(groupctrl?.info.guid as string)">
                        <i class="bi bi-trash3"></i></button>
                </div>
                <div class="collapse" ref="sharelink">
                    <div class="input-group">
                        <input readonly disabled class="form-control" style="user-select: all"
                            :value="sharelink" />
                        <button class="btn btn-primary" @click="copyShareUrl()">Copy</button>
                    </div>
                </div>
                <div>
                    <div class="accordion">
                        <div class="accordion-item p-1" v-for="(mod) in getMods(groupctrl)" :key="mod[0]">
                            <div class="input-group">
                                <input :class="`form-control text-${isInstalled(mod) ? 'success' : 'danger'}`"
                                    :value="getModName(mod[0]) + ` (${$t(isInstalled(mod) ? 'groups.ready' : 'groups.unready')})`"
                                    readonly disabled />
                                <a class="btn btn-danger" @click="removeMod(groupctrl as ModGroupController, mod[0])">
                                    <i class="bi bi-x"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                <!--accordion body end-->
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { getCurrentGroup, ModGroupController, changeCurrentGroup } from '@/core/modgroup';
import { defineComponent } from 'vue';
import { Collapse } from 'bootstrap';
import { getLocalMod, getOrAddLocalMod, isDownloadingMod } from '@/core/modManager';
import { getModLinkMod } from '@/core/modlinks/modlinks';
import { clipboard } from 'electron';
import { I18nLanguages } from '@/lang/langs';
import { ver_lg } from '@/core/utils/version';

export default defineComponent({
    props: {
        groupctrl: ModGroupController
    },
    methods: {
        toggleBody() {
            const tgb = new Collapse(this.$refs.body as Element);
            tgb.toggle();
        },
        isCurrent(ctrl: ModGroupController) {
            return getCurrentGroup().info.guid == ctrl.info.guid;
        },
        setAsCurrent(ctrl?: ModGroupController) {
            if (!ctrl)
                return;
            changeCurrentGroup(ctrl.info.guid);
            this.$parent?.$forceUpdate();
        },
        getMods(ctrl: ModGroupController) {
            return ctrl.getModNames();
        },
        getModName(name: string) {
            const lang = I18nLanguages[this.$i18n.locale];
            const alias = lang?.mods?.nameAlias;
            let an = (alias ?? {})[name?.toLowerCase()?.replaceAll(' ', '')];
            if (!an) return name;
            return `${name} (${an})`;
        },
        removeMod(ctrl: ModGroupController, name: string) {
            const mg = getLocalMod(name);
            if (mg) {
                mg.disableAll();
            }
            ctrl.removeMod(name);
            ctrl.save();
            this.getShareCollapse().hide();
            this.$forceUpdate();
        },
        isDefault(ctrl: ModGroupController) {
            return ctrl.info.guid == "default";
        },
        showRemoveGroupModal(guid: string) {
            this.$emit("onshowdelete", guid);
        },
        canUseGroup(ctrl: ModGroupController) {
            for (const mod of ctrl.getModNames()) {
                if (!this.isInstalled(mod) || !getLocalMod(mod[0]).canEnable()) return false;
            }
            return true;
        },
        isInstalled(mod: [string, string]) {
            const mg = getLocalMod(mod[0]);
            if (!mg) return false;
            return mg.canEnable() && (mg.getLatestVersion() == mod[1] || ver_lg(mg.getLatestVersion() ?? "0.0", mod[1]));
        },
        async downloadMissingMods(ctrl: ModGroupController) {
            this.isDownloading = true;
            this.setAsCurrent(ctrl);
            let w: Promise<any>[] = [];
            for (const mod of ctrl.getModNames()) {
                if (this.isInstalled(mod) || isDownloadingMod(mod[0])) continue;
                const mg = getOrAddLocalMod(mod[0]);
                const m = (await getModLinkMod(mod[0])) ?? ctrl.info.fallbackModinfo[mod[0]];
                if (!m) continue;
                w.push(mg.installNew(m));
            }
            await Promise.all(w);
            this.isDownloading = false;
            this.$forceUpdate();
        },
        genShareUrl(ctrl: ModGroupController) {
            const url = ctrl.getShareUrl();
            console.log(url.toString());
            this.sharelink = url.toString();
            this.getShareCollapse().toggle();
            //
        },
        copyShareUrl() {
            if(!this.sharelink) {
                this.genShareUrl(this.groupctrl as ModGroupController);
            }
            clipboard.writeText(this.sharelink);
        },
        showExportModal(guid: string) {
            this.$emit('onshowexport', guid);
        },
        rename(ctrl: ModGroupController) {
            this.$emit("onshowrename", ctrl.info.guid);
        },
        getShareCollapse() {
            return (this.share_collapse ??= new Collapse(this.$refs.sharelink as any)) as Collapse;
        }
    },
    unmounted() {
        clearInterval(this.checkTimer);
    },
    data() {
        return {
            checkTimer: setInterval(() => this.$forceUpdate(), 500),
            isDownloading: false,
            sharelink: "",
            share_collapse: undefined as any
        }
    },
    emits: {
        onshowdelete: null,
        onshowrename: null,
        onshowexport: null
    }
});
</script>
