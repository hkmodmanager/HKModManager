
<template>
    <div class="accordion">
        <div>
            <CGroupsGroupItem :groupctrl="getCurrentGroup()" :key="getCurrentGroup().info.guid"
                @onshowdelete="onShowDeleteModal" @onshowrename="onShowRenameModal" @onshowexport="onShowExportModal"
                :ref="`group-${getCurrentGroup().info.guid}`"></CGroupsGroupItem>
        </div>
        <hr />
        <div>
            <button :class="`btn btn-${show_drag_hkmg ? 'info' : 'primary'} w-100`" @click="openCreateNewGroupBox"
                @drop="onImportHKMGDrop($event)" @dragleave="onImportHKMGLeave($event)"
                @dragover="onImportHKMGDragOver($event)">
                <i class="bi bi-plus-lg" v-if="!show_drag_hkmg"></i>
                <i class="bi bi-box-arrow-in-down" v-else></i>
            </button>
        </div>
        <div v-for="(group) in getAllGroup()" :key="group.info.guid">
            <CGroupsGroupItem :groupctrl="group" @onshowdelete="onShowDeleteModal" @onshowrename="onShowRenameModal"
                @onshowexport="onShowExportModal" :ref="`group-${group.info.guid}`"></CGroupsGroupItem>
        </div>
    </div>
    <ModalBox :title="$t('groups.newtitle')" ref="modal_cngb_show" :keyboard="false" :backdrop="false">
        <form>
            <div class="form-group">
                <label class="form-label">{{ $t("groups.name") }}</label>
                <input v-model="group_name_t" class="form-control"/>
            </div>
        </form>
        <template #footer>
            <button class="btn btn-primary" @click="createNewGroup()">{{ $t("groups.create") }}</button>
        </template>
    </ModalBox>
    <ModalBox :title="$t('groups.remove')" ref="modal_delete_group" :keyboard="false">
        <strong>{{ $t("groups.deleteMsg") }}</strong>
        <template #footer>
            <button class="btn btn-danger w-100" @click="removeGroup()">{{ $t('groups.remove') }}</button>
        </template>
    </ModalBox>
    <ModalBox :title="$t('groups.rename')" ref="modal_rename_group" :keyboard="false">
        <form>
            <input class="form-control" v-model="group_name_t" />
        </form>
        <template #footer>
            <button class="btn btn-danger w-100" @click="renameGroup()">{{ $t('groups.rename') }}</button>
        </template>
    </ModalBox>
    <ModalBox :title="$t('groups.export')" ref="modal_export_group">
        <form>
            <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" v-model="pack_feat" value="include-api"
                    :disabled="!installedAPI()" />
                <label class="form-check-label">{{ $t("groups.exportOptions.include_api") }}</label>
            </div>
            <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" v-model="pack_feat" value="always-full-path" />
                <label class="form-check-label">{{ $t("groups.exportOptions.always_full_path") }}</label>
            </div>

            <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" v-model="pack_feat" value="only-mod-files" />
                <label class="form-check-label">{{ $t("groups.exportOptions.only_mod_files") }}</label>
            </div>
        </form>
        <template #footer>
            <button class="btn btn-primary w-100" @click="exportGroup()">{{ $t('groups.export') }}</button>
        </template>
    </ModalBox>
    <Teleport to="body">
        <div class="modal-backdrop show mask-0" v-if="show_wm">
            <div class="spinner spinner-border text-primary high-index mx-auto d-block"></div>
        </div>
    </Teleport>
</template>

<style>
.high-index {
    z-index: 2000;
}

.mask-0 {
    opacity: 1 !important;
    background-color: rgba(0, 0, 0, 0.5);
}
</style>

<script lang="ts">
import ModalBox from '@/components/modal-box.vue';
import {
    saveGroups, getAllGroupGuids, ModGroupController, getGroup, getDefaultGroup,
    getCurrentGroup, getOrCreateGroup, removeGroup, importFromHKMG
} from '@/core/modgroup';
import { defineComponent } from 'vue';
import * as remote from "@electron/remote";
import CGroupsGroupItem from './groups/c-groups-groupItem.vue';
import { zip } from 'compressing';
import { createWriteStream } from 'fs';
import { getAPIVersion } from '@/core/apiManager';
import { extname } from 'path';
import { refreshLocalMods } from '@/core/modManager';
import { gl } from '@/core/exportGlobal';

export default defineComponent({
    methods: {
        getAllGroup() {
            const guids = getAllGroupGuids();
            const result: ModGroupController[] = [];
            const cur = getCurrentGroup();
            if (cur.info.guid != "default") result.push(getDefaultGroup());
            for (const v of guids) {
                if (v == "default" || v == cur.info.guid)
                    continue;
                const r = getGroup(v);
                if (!r)
                    continue;
                result.push(r);
            }
            return result;
        },
        getCurrentGroup() {
            return getCurrentGroup();
        },
        openCreateNewGroupBox() {
            const modal = this.$refs.modal_cngb_show as any;
            this.group_name_t = "";
            modal.getModal().show();
        },
        createNewGroup() {
            const modal = this.$refs.modal_cngb_show as any;
            modal.getModal().hide();
            if (this.group_name_t.trim() == "") return;
            getOrCreateGroup(undefined, this.group_name_t);
        },
        removeGroup() {
            if (this.group_guid_t == "") return;
            removeGroup(this.group_guid_t);
            saveGroups();
            this.group_guid_t = "";
            const modal = this.$refs.modal_delete_group as any;
            modal.getModal().hide();
            this.$forceUpdate();
        },
        onShowDeleteModal(guid: string) {
            this.group_guid_t = guid;
            const modal = this.$refs.modal_delete_group as any;
            modal.getModal().show();
        },
        onShowRenameModal(guid: string) {
            const group = getGroup(guid);
            if (!group) return;

            this.group_guid_t = guid;
            this.group_name_t = group.info.name;

            const modal = this.$refs.modal_rename_group as any;
            modal.getModal().show();
        },
        onShowExportModal(guid: string) {
            const group = getGroup(guid);
            if (!group) return;

            this.group_guid_t = guid;

            const modal = this.$refs.modal_export_group as any;
            modal.getModal().show();
        },
        renameGroup() {
            if (this.group_guid_t == "") return;
            const group = getGroup(this.group_guid_t);
            if (!group) return;

            this.group_guid_t = "";
            group.info.name = this.group_name_t;
            group.save();
            this.group_name_t = "";

            const modal = this.$refs.modal_rename_group as any;
            modal.getModal().hide();
        },
        onImportHKMGDrop(ev: DragEvent) {
            const transfer = ev.dataTransfer as DataTransfer;
            this.show_drag_hkmg = false;
            for (const file of transfer.files) {
                if (extname(file.path) === '.hkmg') importFromHKMG(file.path);
                //if (extname(file.path) === '.zip') importFromZip(file.path);
            }
            ev.preventDefault();
            refreshLocalMods(true);
            this.$forceUpdate();
        },
        onImportHKMGDragOver(ev: DragEvent) {
            this.show_drag_hkmg = true;
            ev.preventDefault();
        },
        onImportHKMGLeave(ev: DragEvent) {
            this.show_drag_hkmg = false;
            ev.preventDefault();
        },
        installedAPI() {
            return getAPIVersion() > 0
        },
        async exportGroup() {
            const modal = this.$refs.modal_export_group as any;
            modal.getModal().hide();

            if (this.group_guid_t == "") return;
            const group = getGroup(this.group_guid_t);
            if (!group) return;

            const s = remote.dialog.showSaveDialogSync(remote.getCurrentWindow(), {
                filters: [
                    {
                        name: "Pack Zip",
                        extensions: ['zip']
                    }
                ]
            });
            if (!s) return;



            const feat = this.pack_feat as string[];
            try {
                const stream = new zip.Stream();
                this.show_wm = true;
                group.exportAsZip(stream, {
                    onlyModFiles: feat.includes('only-mod-files'),
                    fullPath: feat.includes('always-full-path'),
                    includeAPI: feat.includes('include-api') && (getAPIVersion() > 0),
                    includeMetadata: true
                });
                gl.zs = stream;

                const fs = createWriteStream(s, 'binary');
                
                await new Promise<void>((r) => {
                    stream.pipe(fs);
                    fs.on('finish', () => {
                        this.show_wm = false;
                        fs.close();
                        console.log(s);
                        r();
                    });
                });

            } catch (e) {
                console.log(e);

            } finally {
                //this.show_wm = false;
            }
            console.log(s);
        }
    },
    data() {
        return {
            checkTimer: setInterval(() => this.$forceUpdate(), 500),
            group_name_t: "",
            group_guid_t: "",
            pack_feat: [],
            show_wm: false,
            show_drag_hkmg: false
        }
    },
    unmounted() {
        saveGroups();
        clearInterval(this.checkTimer);
    },
    components: { CGroupsGroupItem, ModalBox }
});
</script>
