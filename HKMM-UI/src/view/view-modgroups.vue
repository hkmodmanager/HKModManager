
<template>
    <div class="accordion">
        <div>
            <CGroupsGroupItem :groupctrl="getCurrentGroup()" :key="getCurrentGroup().info.guid"
                @onshowdelete="onShowDeleteModal" @onshowrename="onShowRenameModal"
                :ref="`group-${getCurrentGroup().info.guid}`"></CGroupsGroupItem>
        </div>
        <hr />
        <div>
            <button class="btn btn-primary w-100" @click="openCreateNewGroupBox">
                <i class="bi bi-plus-lg"></i>
            </button>
        </div>
        <div v-for="(group) in getAllGroup()" :key="group.info.guid">
            <CGroupsGroupItem :groupctrl="group" @onshowdelete="onShowDeleteModal" @onshowrename="onShowRenameModal"
                :ref="`group-${group.info.guid}`"></CGroupsGroupItem>
        </div>
    </div>
    <ModalBox :title="$t('groups.newtitle')" ref="modal_cngb_show">
        <form>
            <div class="form-group">
                <label class="form-label">{{ $t("groups.name") }}</label>
                <input v-model="group_name_t" class="form-control" />
            </div>
        </form>
        <template v-slot:footer>
            <button class="btn btn-primary" @click="createNewGroup()">{{ $t("groups.create") }}</button>
        </template>
    </ModalBox>
    <ModalBox :title="$t('groups.remove')" ref="modal_delete_group">
        <strong>{{ $t("groups.deleteMsg") }}</strong>
        <template v-slot:footer>
            <button class="btn btn-danger w-100" @click="removeGroup()">{{ $t('groups.remove') }}</button>
        </template>
    </ModalBox>
    <ModalBox :title="$t('groups.rename')" ref="modal_rename_group">
        <form>
            <input class="form-control" v-model="group_name_t" />
        </form>
        <template v-slot:footer>
            <button class="btn btn-danger w-100" @click="renameGroup()">{{ $t('groups.rename') }}</button>
        </template>
    </ModalBox>
</template>

<script lang="ts">
import ModalBox from '@/components/modal-box.vue';
import { saveGroups, getAllGroupGuids, ModGroupController, getGroup, getDefaultGroup, getCurrentGroup, getOrCreateGroup, removeGroup } from '@/renderer/modgroup';
import { defineComponent } from 'vue';
import CGroupsGroupItem from './groups/c-groups-groupItem.vue';

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
        }
    },
    data() {
        return {
            checkTimer: setInterval(() => this.$forceUpdate(), 500),
            group_name_t: "",
            group_guid_t: ""
        }
    },
    unmounted() {
        saveGroups();
        clearInterval(this.checkTimer);
    },
    components: { CGroupsGroupItem, ModalBox }
});
</script>
