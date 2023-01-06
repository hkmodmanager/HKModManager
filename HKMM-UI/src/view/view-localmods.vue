<template>
    <div class="spinner spinner-border text-primary mx-auto d-block" v-if="showSpinner()">
    </div>
    <CModsSearch v-if="!showSpinner()" @update="updateSearch" @update-tag="updateTag" />
    <div class="accordion" v-if="!showSpinner()">
        <div v-for="(mod) in getMods()" :key="mod.name">
            <CModsItem v-if="mod.isInstalled()" :inmod="mod.versions[mod.getLatestVersion() ?? ''].info.modinfo"
                :localmod="mod.versions[mod.getLatestVersion() ?? '']" :is-local="true" @show-export-to-scarab-confirm="showISConfirm"></CModsItem>
        </div>
    </div>
    <div v-if="filter !== 'requireUpdate'">
        <button class="btn btn-primary w-100" @click="showScarabModal()" :disabled="!canImportFromScarab()">{{
            $t('mods.importScarab.btn')
        }}</button>
    </div>
    <ModalScarab ref="modal_import_scarab">
    </ModalScarab>
    <ModalBox :backdrop="false" :keyboard="false" :title="$t('mods.exportScarab.confirmTitle')" ref="modal_export_scarab">
        <div class="alert alert-danger" copyable>{{ $t('mods.exportScarab.alertMsg') }}</div>
        <template #footer>
            <div class="form-check">
                <input class="form-check-input" type="checkbox" v-model="options" value="HIDE_ALERT_EXPORT_TO_SCARAB"/>
                <label class="form-check-label">{{ $t('mods.exportScarab.dontAsk') }}</label>
            </div>
            <button class="btn btn-outline-danger" @click="beginES()">{{ $t('mods.exportScarab.confirmBtn') }}</button>
            <button class="btn btn-primary" @click="hideISConfirm()">{{ $t('mods.exportScarab.cancelBtn') }}</button>
        </template>
    </ModalBox>
</template>

<script lang="ts">
import { refreshLocalMods, LocalModsVersionGroup, getRequireUpdateModsSync, getLocalMod, LocalModInstance } from '@/renderer/modManager';
import { defineComponent } from 'vue';
import { getModLinks, hasModLink_ei_files, modlinksCache, ModTag } from '@/renderer/modlinks/modlinks';
import CModsItem from './mods/c-mods-item.vue';
import { I18nLanguages } from '@/lang/langs';
import CModsSearch from './mods/c-mods-search.vue';
import { getShortName } from '@/renderer/utils/utils';
import ModalScarab from './relocation/modal-scarab.vue';
import ModalBox from '@/components/modal-box.vue';
import { exportMods } from '@/renderer/relocation/Scarab/RScarab';
import { hasOption, store } from '@/renderer/settings';

export default defineComponent({
    methods: {
        getMods() {
            const src = (this.filter === 'all' || !this.filter) ? Object.keys(refreshLocalMods()) : getRequireUpdateModsSync();
            const result: LocalModsVersionGroup[] = [];
            //if (!modlinksCache) return result;
            const filterT = this.search?.trim();
            for (const mod of src) {
                const mname = mod.toLowerCase().replaceAll(' ', '').trim()
                    + (this.getModAliasName(mod) ?? '');

                if (filterT) {
                    const fname = this.search.toLowerCase().replaceAll(' ', '').trim();
                    if (!mname.includes(fname) && !getShortName(mod).startsWith(filterT.trim())) continue;
                }

                const m = getLocalMod(mod);
                if (!m) continue;
                if (this.tag && this.tag != 'None') {
                    if (!m.getLatest()?.info.modinfo.tags.includes(this.tag as ModTag)) continue;
                }
                result.push(m);
            }
            return result.sort((a, b) => a.name.localeCompare(b.name) + (filterT ? (
                (getShortName(a.name).startsWith(filterT) ? -100 : 0) +
                (getShortName(b.name).startsWith(filterT) ? 100 : 0)
            ) : 0));
        },
        refresh() {
            if (!modlinksCache) {
                getModLinks().then(() => {
                    this.$forceUpdate();
                });
            }
        },
        showScarabModal() {
            const modal = this.$refs.modal_import_scarab as any;
            modal.showModal();
        },
        showISConfirm(mod: LocalModInstance) {
            this.ets_mod = mod;
            if(hasOption('HIDE_ALERT_EXPORT_TO_SCARAB')) {
                this.beginES();
                return;
            }
            const modal = this.$refs.modal_export_scarab as any;
            modal.getModal().show();
        },
        hideISConfirm() {
            const modal = this.$refs.modal_export_scarab as any;
            modal.getModal().hide();
        },
        canImportFromScarab() {
            return hasModLink_ei_files();
        },
        beginES() {
            this.hideISConfirm();
            if(!this.ets_mod) return;
            exportMods([ this.ets_mod as any ]);
            this.ets_mod = undefined as any;
        },
        showSpinner() {
            return this.filter === 'requireUpdate' && !modlinksCache;
        },
        updateSearch(f: string) {
            this.search = f;
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
        getModLinks() {
            return modlinksCache;
        }
    },
    props: {
        filter: {
            type: String,
            default: "all"
        }
    },
    watch: {
        options(n) {
            store.set('options', n);
        }
    },
    data() {
        return {
            search: undefined as any as string,
            tag: 'None',
            ets_mod: undefined as any as LocalModInstance,
            options: store.get('options')
        };
    },
    beforeUpdate() {
        this.refresh();
    },
    mounted() {
        this.refresh();
    },
    components: { CModsItem, CModsSearch, ModalScarab, ModalBox }
});
</script>
