<template>
    <realview></realview>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue'
import { getModLinks, getAPIInfo } from '@/renderer/modlinks/modlinks'



export default defineComponent({
    components: {
        "realview": defineAsyncComponent(async () => {
            await getAPIInfo();
            await getModLinks();
            return import("./view-allmods-async.vue");
        })
    }
});

</script>

