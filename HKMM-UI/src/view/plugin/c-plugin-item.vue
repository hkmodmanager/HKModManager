
<template>
    <div class="accordion-item text-black p-1">
        <h2 class="accordion-header">
            <button class="accordion-button collapsed" @click="toggleBody()">
                {{ plugin.name }}
                <span class="badge bg-success">{{ $t('plugins.byAuthor') }}</span>
            </button>
        </h2>
        <div class="accordion-collapse collapse" ref="body">
            ADADADADAD
        </div>
    </div>

</template>

<script lang="ts" setup>
import { IHKMMPlugin } from '@/renderer/plugins';
import { Collapse } from 'bootstrap';
import { defineProps, ref } from 'vue';

const body = ref<HTMLElement | undefined>();

const props = defineProps({
    inplugin: Object
});
const plugin = props.inplugin as IHKMMPlugin;

function toggleBody() {
    const tgb = new Collapse(body.value as HTMLElement);
    tgb.toggle();
}

</script>
