<template>
    <CModsSearch @update="updateSearch">
        
    </CModsSearch>
    <div class="accordion">
        <CModsItem v-for="(mod) in getMods()" :key="mod.name" :inmod="mod"></CModsItem>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { getModLinks, modlinksCache, ModLinksManifestData } from '@/renderer/modlinks/modlinks'
import CModsItem from './mods/c-mods-item.vue';
import { hasOption } from '@/renderer/settings';
import CModsSearch from './mods/c-mods-search.vue';
import { I18nLanguages } from '@/lang/langs';

export default defineComponent({
    methods: {
        getMods() {
            const names = modlinksCache?.getAllModNames();
            if(!names || !modlinksCache) return [];
            const arr: ModLinksManifestData[] = [];
            for (const name of names) {
                const v = modlinksCache.getMod(name);
                if(!v) continue;
                const mname = name.toLowerCase().replaceAll(' ', '').trim() + (this.getModAliasName(name) ?? '');
                if(this.filter) {
                    const fname = this.filter.toLowerCase().replaceAll(' ', '').trim();
                    if(!mname.includes(fname)) continue;
                }
                if(!v.isDeleted || hasOption('SHOW_DELETED_MODS')) {
                    arr.push(v);
                }
            }
            return arr.sort((a, b) => a.name.localeCompare(b.name) + (a.isDeleted ? 100 : 0) + (b.isDeleted ? -100 : 0));
        },
        updateSearch(f: string) {
            this.filter = f;
            this.$forceUpdate();
        },
        getModAliasName(name: string) {
            const lang = I18nLanguages[this.$i18n.locale];
            const alias = lang?.mods?.nameAlias;
            if(!alias) return undefined;
            return alias[name?.toLowerCase()?.replaceAll(' ', '')];
        }
    },
    data() {
        return {
            filter: undefined as any as (string | undefined)
        };
    },
    mounted() {
        getModLinks().then(() => {
            this.$forceUpdate();
        });
    },
    components: { CModsItem, CModsSearch }
})
</script>

