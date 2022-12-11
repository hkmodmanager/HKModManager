<template>
    <div class="spinner spinner-border text-primary mx-auto d-block" v-if="showSpinner()">
    </div>
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
import { getModLinks, modlinksCache } from '@/renderer/modlinks/modlinks';
import CModsItem from './mods/c-mods-item.vue';

export default defineComponent({
    methods: {
        getMods() {
            if (this.filter === 'all' || !this.filter) return refreshLocalMods();
            const result: LocalModsVersionGroup[] = [];
            if (!modlinksCache) return result;
            for (const mod of getRequireUpdateModsSync()) {
                const m = getLocalMod(mod);
                if(m) {
                    result.push(m);
                }
            }
            console.log(result);
            return result;
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
        }
    },
    props: {
        filter: {
            type: String,
            default: "all"
        }
    },
    beforeUpdate() {
        this.refresh();
    },
    mounted() {
        this.refresh();
    },
    components: { CModsItem }
});
</script>
