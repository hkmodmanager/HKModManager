<template>
    <div class="accordion">
        <div v-for="(mod) in getMods()" :key="mod.name">
            <CModsItem v-if="mod.isInstalled()" :mod="mod.versions[mod.getLatestVersion() ?? ''].info.modinfo" :is-local="true"></CModsItem>
        </div>
    </div>
</template>

<script lang="ts">
import { refreshLocalMods } from '@/renderer/modManager';
import { defineComponent } from 'vue';
import CModsItem from './mods/c-mods-item.vue';

export default defineComponent({
    methods: {
        getMods() {
            return refreshLocalMods();
        }
    },
    components: { CModsItem }
});
</script>
