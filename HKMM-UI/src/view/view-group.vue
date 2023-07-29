
<template>
    <div class="accordion">
        <div>
            <CGroupsGroupItem :item="getCurrentGroup()" :key="getCurrentGroup().name"
                @onshowdelete="onShowDeleteModal" @onshowrename="onShowRenameModal"
                :ref="`group-${getCurrentGroup().name}`"></CGroupsGroupItem>
        </div>
        <hr />
        <div>
            <button :class="`btn btn-primary w-100`" @click="openCreateNewGroupBox">
                <i class="bi bi-plus-lg"></i>
            </button>
        </div>
        <div v-for="(group) in groups" :key="group.name">
            <CGroupsGroupItem :item="group" @onshowdelete="onShowDeleteModal" @onshowrename="onShowRenameModal"
                :ref="`group-${group.name}`"></CGroupsGroupItem>
        </div>
    </div>
    <ModalBox :title="$t('groups.newtitle')" ref="modal_cngb_show" :keyboard="false" :backdrop="false">
        <form>
            <div class="form-group">
                <label class="form-label">{{ $t("groups.name") }}</label>
                <input v-model="group_name_t" class="form-control" />
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

<script setup lang="ts">
import ModalBox from '@/components/modal-box.vue';

import { onBeforeMount, onUnmounted, ref, shallowRef } from 'vue';
import CGroupsGroupItem from './groups/c-groups-item.vue'
import { getRootPackageProvider, LocalCustomPackagesProviderProxy, PackageDisplay } from 'core';


const groups = shallowRef<PackageDisplay[]>();
const group_name_t = ref<string>("");
const group_guid_t = ref<string>("");

const modal_cngb_show = ref<typeof ModalBox>();
const modal_delete_group = ref<typeof ModalBox>();
const modal_rename_group = ref<typeof ModalBox>();

function getCurrentGroup() {
    return LocalCustomPackagesProviderProxy.current;
}

function openCreateNewGroupBox() {
    const modal = modal_cngb_show.value as typeof ModalBox;
    group_name_t.value = "";
    modal.getModal().show();
}

function createNewGroup() {
    const modal = modal_cngb_show.value as typeof ModalBox;
    modal.getModal().hide();
    if (group_name_t.value.trim() == "") return;
    const p = LocalCustomPackagesProviderProxy.createNew();
    LocalCustomPackagesProviderProxy.rename(p, group_name_t.value);
}

function removeGroup() {
    if (group_guid_t.value == "") return;
    const pack = getRootPackageProvider().getPackage(group_guid_t.value);
    if (!pack) return;
    LocalCustomPackagesProviderProxy.remove(pack);

    const modal = modal_delete_group.value as typeof ModalBox;
    modal.getModal().hide();
}

function renameGroup() {
    if (group_guid_t.value == "") return;
    const pack = getRootPackageProvider().getPackage(group_guid_t.value);
    if (!pack) return;

    group_guid_t.value = "";
    LocalCustomPackagesProviderProxy.rename(pack, group_name_t.value);

    const modal = modal_rename_group.value as typeof ModalBox;
    modal.getModal().hide();
}

function onShowDeleteModal(guid: string) {
    group_guid_t.value = guid;
    const modal = modal_delete_group.value as any;
    modal.getModal().show();
}
function onShowRenameModal(guid: string) {
    const pack = getRootPackageProvider().getPackage(guid);
    if (!pack) return;
    group_guid_t.value = guid;
    group_name_t.value = pack.displayName;

    const modal = modal_rename_group.value as any;
    modal.getModal().show();
}

function refresh() {
    groups.value = LocalCustomPackagesProviderProxy.provider.getAllPackages(true);
}

let autoRefresh: any = undefined;

onBeforeMount(() => {
    refresh();

    autoRefresh = setInterval(refresh, 500);
});

onUnmounted(() => {
    clearInterval(autoRefresh);
    autoRefresh = undefined;
})

</script>