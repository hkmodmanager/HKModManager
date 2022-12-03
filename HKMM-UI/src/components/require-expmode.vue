
<template>
    <slot v-if="isExpMode"></slot>
</template>

<script lang="ts">
import { store } from '@/renderer/settings';
import { defineComponent } from 'vue';

export default defineComponent({
    data() {
        return {
            isExpMode: store.get("enabled_exp_mode", false)
        }
    }
});
</script>

