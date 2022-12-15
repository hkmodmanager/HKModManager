<template>
    <realview></realview>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue'
import { getModLinks } from '@/renderer/modlinks/modlinks'



export default defineComponent({
    components: {
        "realview": defineAsyncComponent(async () => {
            await getModLinks();
            return import("./view-allmods-async.vue");
        })
    }
});

</script>

