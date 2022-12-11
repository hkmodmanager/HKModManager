<template>
    <div class="accordion">
        <CModsItem v-for="(mod) in getMods()" :key="mod.name" :inmod="mod"></CModsItem>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { modlinksCache, ModLinksManifestData } from '@/renderer/modlinks/modlinks'
import CModsItem from './mods/c-mods-item.vue';
import { hasOption } from '@/renderer/settings';

export default defineComponent({
    methods: {
        getMods() {
            const names = modlinksCache?.getAllModNames();
            if(!names || !modlinksCache) return [];
            const arr: ModLinksManifestData[] = [];
            for (const name of names) {
                const v = modlinksCache.getMod(name);
                if(v && (!v.isDeleted || hasOption('SHOW_DELETED_MODS'))) {
                    arr.push(v);
                }
            }
            return arr;
        }
    },
    components: { CModsItem }
})
</script>

