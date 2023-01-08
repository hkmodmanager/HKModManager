<template>
    <CModsSearch @update="updateSearch" @update-tag="updateTag" :custom-tags="[ 'ScarabInstalled' ]">
    </CModsSearch>
    <div class="accordion">
        <CModsItem v-for="(mod) in getMods()" :key="mod.name" :inmod="mod" :scarab-installed="scarabInstalled(mod)"
            @import-from-scarab="importFromScarab"></CModsItem>
    </div>
    <ModalScarab ref="modal_import_scarab" :force-import="hopeImportFromScarab">
    </ModalScarab>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { getModLinks, modlinksCache, ModLinksManifestData, ModTag } from '@/renderer/modlinks/modlinks'
import CModsItem from './mods/c-mods-item.vue';
import { hasOption } from '@/renderer/settings';
import CModsSearch from './mods/c-mods-search.vue';
import { I18nLanguages } from '@/lang/langs';
import { getShortName } from '@/renderer/utils/utils';
import { ModInfo, scanScarabMods } from '@/renderer/relocation/Scarab/RScarab';
import ModalScarab from './relocation/modal-scarab.vue';

export default defineComponent({
    methods: {
        getMods() {
            const names = modlinksCache?.getAllModNames();
            if (!names || !modlinksCache) return [];
            const arr: ModLinksManifestData[] = [];
            const filterT = this.filter?.trim();
            const fname = this.filter?.toLowerCase().replaceAll(' ', '').trim();
            for (const name of names) {
                const v = modlinksCache.getMod(name);
                if (!v) continue;
                const mname = name.toLowerCase().replaceAll(' ', '').trim() + (this.getModAliasName(name) ?? '');
                if (filterT && fname) {
                    if (!mname.includes(fname) && !getShortName(name).startsWith(filterT)) continue;
                }
                if (this.tag && this.tag != 'None') {
                    if (this.tag == 'ScarabInstalled') {
                        if(!this.scarabInstalled(v)) continue;
                    } else {
                        if (!v.tags.includes(this.tag as ModTag)) continue;
                    }

                }
                if (!v.isDeleted || hasOption('SHOW_DELETED_MODS')) {
                    arr.push(v);
                }
            }
            return arr.sort((a, b) =>
                a.name.localeCompare(b.name) +
                (a.isDeleted ? 100 : 0) +
                (b.isDeleted ? -100 : 0) +
                (filterT ? (
                    (getShortName(a.name).startsWith(filterT) ? -100 : 0) +
                    (getShortName(b.name).startsWith(filterT) ? 100 : 0)
                ) : 0));
        },
        updateSearch(f: string) {
            this.filter = f;
            this.$forceUpdate();
        },
        updateTag(tag: string) {
            this.tag = tag;
            this.$forceUpdate();
        },
        getModAliasName(name: string) {
            const lang = I18nLanguages[this.$i18n.locale];
            const alias = lang?.mods?.nameAlias;
            if (!alias) return undefined;
            return alias[name?.toLowerCase()?.replaceAll(' ', '')];
        },
        scarabInstalled(mod: ModLinksManifestData) {
            return this.scarabMods.find(x => x.name == mod.name && x.mod.Version == mod.version);
        },
        importFromScarab(mod: ModInfo) {
            const modal = this.$refs.modal_import_scarab as any;
            this.hopeImportFromScarab = mod;
            modal.showModal();
        }
    },
    data() {
        return {
            filter: undefined as any as (string | undefined),
            tag: 'None',
            hopeImportFromScarab: undefined as any,
            scarabMods: scanScarabMods()
        };
    },
    beforeUpdate() {
        this.scarabMods = scanScarabMods();
    },
    mounted() {
        getModLinks().then(() => {
            this.$forceUpdate();
        });
    },
    components: { CModsItem, CModsSearch, ModalScarab }
})
</script>

