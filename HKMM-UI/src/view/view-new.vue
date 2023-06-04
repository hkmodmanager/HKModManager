<template>
    <CModsSearch @update="updateSearch"></CModsSearch>
    <div class="row m-3">
        <select class="form-select" ref="ref_type" @change="updateFilter">
            <option value="new_week" selected>{{ $t("whatsnew.new_week") }}</option>
            <option value="new_month">{{ $t("whatsnew.new_month") }}</option>
            <option value="update_week">{{ $t("whatsnew.update_week") }}</option>
            <option value="update_month">{{ $t("whatsnew.update_month") }}</option>
        </select>
    </div>
    <div class="accordion">
        <CModsItem v-for="(mod) in getMods()" :key="mod.name" :inmod="mod" @import-from-scarab="false" :disable-update="false"
            @show-uninstall-confirm="show_deleteMod"></CModsItem>
    </div>
    <CModUninstallModal :mod-name="uninstall_modName" :depend-mods="uninstall_modDep" @ondelete="impl_deleteMod"
        ref="modal_uninstall"></CModUninstallModal>
</template>

<script lang="ts" setup>
import { ModLinksManifestData, provider } from '@/core/modlinks/modlinks';
import { getOrAddLocalMod } from '@/core/modManager';
import { filterMods, prepareFilter } from '@/core/utils/modfilter';
import { ref, SelectHTMLAttributes } from 'vue';
import CModsSearch from './mods/c-mods-search.vue';
import CModsItem from './mods/c-mods-item.vue'
import CModUninstallModal from './mods/c-mod-uninstall-modal.vue';

const filter_orig = ref("");
const filter_str = ref("");
const uninstall_modName = ref("");
const uninstall_modDep = ref<string[]>([]);

const modal_uninstall = ref<any>(null);

const ref_type = ref<SelectHTMLAttributes>();

function getMods() {
    const names = provider.getAllModNames();
    if (!names) return [];

    const filter = prepareFilter(filter_str.value);
    const result = filterMods<ModLinksManifestData>(names.map(x => {
        const mod = provider.getMod(x);
        if (!mod) return;
        return mod;
    }), filter);
    return result;
}

function updateSearch(f: string) {
    filter_orig.value = f ?? '';
    updateFilter();
}

function updateFilter() {
    let fstr = filter_orig.value;
    const s = ref_type.value?.value;
    if(s == "new_week") {
        fstr += " :new-in-days=7";
    } else if(s == "new_month") {
        fstr += " :new-in-days=31";
    } else if(s == "update_week") {
        fstr += " :update-in-days=7";
    } else if(s == "update_month") {
        fstr += " :update-in-days=31";
    }

    if(s == "update_week" || s == "update_month") {
        fstr += " :sort=lastupdate";
    }
    console.log(fstr);
    filter_str.value = fstr;
}

function show_deleteMod(name: string, dep: string[]) {
    uninstall_modName.value = name;
    uninstall_modDep.value = dep;

    modal_uninstall.value.show();
}

function impl_deleteMod(name: string) {
    const group = getOrAddLocalMod(name);
    group.uninstall(undefined);
    filter_str.value = filter_str.value + "";
}
</script>
