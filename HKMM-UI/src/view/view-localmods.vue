<template>
    <div class="spinner spinner-border text-primary mx-auto d-block" v-if="showSpinner()">
    </div>
    <CModsSearch v-if="!showSpinner()" @update="updateSearch" @update-tag="updateTag" />
    <div class="accordion" v-if="!showSpinner()">
        <div v-for="(mod) in getMods()" :key="mod.name">
            <CModsItem v-if="mod.isInstalled()" :inmod="mod.versions[mod.getLatestVersion() ?? ''].info.modinfo"
                :is-local="true"></CModsItem>
        </div>
    </div>

</template>

<script lang="ts">
import { refreshLocalMods, LocalModsVersionGroup, getRequireUpdateModsSync, getLocalMod } from '@/renderer/modManager';
import { defineComponent } from 'vue';
import { getModLinks, modlinksCache, ModTag } from '@/renderer/modlinks/modlinks';
import CModsItem from './mods/c-mods-item.vue';
import { I18nLanguages } from '@/lang/langs';
import CModsSearch from './mods/c-mods-search.vue';

export default defineComponent({
    methods: {
        getMods() {
            const src = (this.filter === 'all' || !this.filter) ? Object.keys(refreshLocalMods()) : getRequireUpdateModsSync();
            const result: LocalModsVersionGroup[] = [];
            //if (!modlinksCache) return result;
            for (const mod of src) {
                const mname = mod.toLowerCase().replaceAll(' ', '').trim() + (this.getModAliasName(mod) ?? '');
                if (this.search) {
                    const fname = this.search.toLowerCase().replaceAll(' ', '').trim();
                    if (!mname.includes(fname)) continue;
                }

                const m = getLocalMod(mod);
                if (!m) continue;
                if (this.tag && this.tag != 'None') {
                    if (!m.getLatest()?.info.modinfo.tags.includes(this.tag as ModTag)) continue;
                }
                result.push(m);
            }
            return result.sort((a, b) => a.name.localeCompare(b.name));
        },
        refresh() {
            if (!modlinksCache) {
                getModLinks().then(() => {
                    this.$forceUpdate();
                });
            }
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
        }
    },
    props: {
        filter: {
            type: String,
            default: "all"
        }
    },
    data() {
        return {
            search: undefined as any as string,
            tag: 'None'
        };
    },
    beforeUpdate() {
        this.refresh();
    },
    mounted() {
        this.refresh();
    },
    components: { CModsItem, CModsSearch }
});
</script>
