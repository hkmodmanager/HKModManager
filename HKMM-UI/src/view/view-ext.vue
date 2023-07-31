<template>
    <iframe class="w-100 h-100" :src="`app-ext://index.html?lang=${$i18n.locale}#/${
        typeof $route.params.path == 'string' ? $route.params.path : $route.params.path.join('/')
        }`" 
        ref="frame"></iframe>
</template>

<script setup lang="ts">
import {  ref } from 'vue';
const frame = ref<HTMLIFrameElement>();


</script>
