<template>
    <div class="accordion">
        <CModsItem v-for="(mod) in getMods()" :key="mod.name" :mod="mod"></CModsItem>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { modlinksCache } from '@/renderer/modlinks/modlinks'
import CModsItem from './mods/c-mods-item.vue';

export default defineComponent({
    methods: {
        getMods() {
            console.log(modlinksCache);
            return modlinksCache?.mods ?? [];
        }
    },
    components: { CModsItem }
})
</script>

