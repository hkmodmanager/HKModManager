<template>
    <CModsSearch @update="updateSearch" @update-tag="updateTag" :custom-tags="[ 'ScarabInstalled', 'LocalInstalled' ]">
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
import { getModLinks, modlinksCache, ModLinksManifestData, ModTag } from '@/renderer/modlinks/modlinks'
import CModsItem from './mods/c-mods-item.vue';
import { hasOption } from '@/renderer/settings';
import CModsSearch from './mods/c-mods-search.vue';
import { I18nLanguages } from '@/lang/langs';
import { getShortName } from '@/renderer/utils/utils';
import { ModInfo, scanScarabMods } from '@/renderer/relocation/Scarab/RScarab';
import ModalScarab from './relocation/modal-scarab.vue';
import ModalLocal from './relocation/modal-local.vue';
import { IRLocalMod, RL_ScanLocalMods } from '@/renderer/relocation/RLocal';

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
                        if (!this.scarabInstalled(v)) continue;
                    } else if (this.tag == 'LocalInstalled') {
                        if (!this.localInstalled(v)) continue;
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
                if (modlinksCache.mods.saveDate) {
                    return new Date(modlinksCache.mods.saveDate);
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
            tag: 'None',
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

