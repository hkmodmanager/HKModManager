<template>
    <div class="accordion">
        <div v-for="(plugin) in allPlugins" :key="plugin.name">
            <CPluginItem :inplugin="plugin">
            </CPluginItem>
        </div>
    </div>

</template>

<script lang="ts" setup>
import { allPlugins } from '@/renderer/plugins';
import CPluginItem from './plugin/c-plugin-item.vue'
</script>
