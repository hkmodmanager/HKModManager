
<template>
    <slot v-if="isExpMode"></slot>
</template>

<script lang="ts">
import { GetSettings } from '@/renderer/settings';
import { defineComponent } from 'vue';

export default defineComponent({
    data() {
        return {
            isExpMode: GetSettings().enabled_exp_mode
        }
    }
});
</script>

