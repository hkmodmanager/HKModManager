
<template>
    <div class="accordion-item p-1">
        <div class="accordion-header d-flex">
            <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" v-model="plugin.context.status.enabled" @change="plugin.context.setActive()" 
                    value="SHOW_DELETED_MODS" />
            </div>
            <div class="flex-grow-1">
                {{ plugin.displayName }}
            </div>
            <div>
                <button class="btn btn-danger">
                    <i class="bi bi-trash3"></i>
                </button>
            </div>
        </div>
    </div>

</template>

<script lang="ts" setup>
import { IHKMMPlugin } from '@/renderer/plugins';
import { defineProps } from 'vue';



const props = defineProps<{
    inplugin: IHKMMPlugin
}>();
const plugin = props.inplugin as IHKMMPlugin;
</script>
