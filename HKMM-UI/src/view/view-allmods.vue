<template>
    <CModsSearch @update="updateSearch" :custom-tags="{ 
        'ScarabInstalled': 'ScarabInstalled', 
        'LocalInstalled': 'LocalInstalled' }">
    </CModsSearch>
    <div class="alert alert-danger" v-if="isUseModlinksBackup()">
        {{ $t('allmods_offline', { date: getModlinksBackupDate().toLocaleString() }) }}
    </div>
    <div class="accordion">
        <CModsItem v-for="(mod) in getMods()" :key="mod.name" :inmod="mod" :scarab-installed="scarabInstalled(mod)"
            :local-installed="localInstalled(mod)" @import-from-scarab="importFromScarab"
            @import-from-local="importFromLocal" :disable-update="isUseModlinksBackup()"></CModsItem>
    </div>
    <ModalScarab ref="modal_import_scarab" :force-import="hopeImportFromScarab">
    </ModalScarab>
    <ModalLocal ref="modal_import_local" :force-import="hopeImportFromLocal"></ModalLocal>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { getModLinks, modlinksCache, ModLinksManifestData } from '@/renderer/modlinks/modlinks'
import CModsItem from './mods/c-mods-item.vue';
import { hasOption } from '@/renderer/settings';
import CModsSearch from './mods/c-mods-search.vue';
import { I18nLanguages } from '@/lang/langs';
import { ModInfo, scanScarabMods } from '@/renderer/relocation/Scarab/RScarab';
import ModalScarab from './relocation/modal-scarab.vue';
import ModalLocal from './relocation/modal-local.vue';
import { IRLocalMod, RL_ScanLocalMods } from '@/renderer/relocation/RLocal';
import { filterMods, prepareFilter } from '@/renderer/utils/modfilter';

export default defineComponent({
    methods: {
        getMods() {
            const names = modlinksCache?.getAllModNames();
            if (!names || !modlinksCache) return [];
            const filter = prepareFilter(this.filter, {
                'localinstalled': (_parts, mod) => [this.localInstalled(mod) != undefined, 0],
                'scarabinstalled': (_parts, mod) => [this.scarabInstalled(mod) != undefined, 0]
            }, (mod) => this.getModAliasName(mod.name));
            return filterMods<ModLinksManifestData>(names.map(x => {
                const mod = modlinksCache?.getMod(x);
                if(!mod) return;
                if(mod.isDeleted && !hasOption('SHOW_DELETED_MODS')) return;
                return mod;
            }), filter);
        },
        updateSearch(f: string) {
            this.filter = f;
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
        localInstalled(mod: ModLinksManifestData) {
            return this.localMods.find(x => x.name == mod.name && x.mod.version == mod.version);
        },
        importFromLocal(mod: IRLocalMod) {
            const modal = this.$refs.modal_import_local as any;
            this.hopeImportFromLocal = mod;
            modal.showModal();
        },
        importFromScarab(mod: ModInfo) {
            const modal = this.$refs.modal_import_scarab as any;
            this.hopeImportFromScarab = mod;
            modal.showModal();
        },
        isUseModlinksBackup() {
            if (modlinksCache) {
                return modlinksCache.offline;
            }
            return false;
        },
        getModlinksBackupDate() {
            if (modlinksCache) {
                const sdate = modlinksCache.mods.lastUpdate ?? modlinksCache.mods.saveDate;
                if (sdate) {
                    return new Date(sdate);
                }
            }
            return new Date();
        },
        onlineRefresh() {
            this.refreshModLinks(true);
        },
        refreshModLinks(force = false) {
            getModLinks(force).then(() => {
                this.$forceUpdate();
                this.localMods = RL_ScanLocalMods(true, true);
            });
        }
    },
    data() {
        return {
            filter: undefined as any as (string | undefined),
            hopeImportFromScarab: undefined as any as ModInfo,
            hopeImportFromLocal: undefined as any as IRLocalMod,
            scarabMods: scanScarabMods(),
            localMods: RL_ScanLocalMods(true, true)
        };
    },
    beforeUpdate() {
        this.scarabMods = scanScarabMods();
        this.localMods = RL_ScanLocalMods(true, true);
    },
    mounted() {
        this.refreshModLinks();
        window.addEventListener('online', this.onlineRefresh);
    },
    unmounted() {
        window.removeEventListener('online', this.onlineRefresh);
    },
    components: { CModsItem, CModsSearch, ModalScarab, ModalLocal }
})
</script>

