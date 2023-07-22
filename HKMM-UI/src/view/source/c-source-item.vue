<template>
    <div class="card mb-2">
        <div class="d-flex g-0">
            <div class="flex-shrink-0" style="width: 128px;height: 128px">
                <img v-if="item.icon" class="card-img-top" :src="item.icon" width="128" height="128" />
            </div>
            <div class="flex-grow-1 d-flex flex-column">
                <div class="flex-shrink-0 d-flex">
                    <div class="card-body flex-grow-1">
                        <h5 class="card-title">{{ item.name }}</h5>
                        <div class="card-text" copyable v-html="desc"></div>
                        <small class="text-muted">
                            <div>{{ $t("modpack.source") }} 
                            <a :href="item.uRL" copyable>{{ item.uRL }}</a>
                            </div>
                        </small>
                    </div>
                </div>
            </div>
            <div class="flex-shrink-0 d-flex flex-column-reverse">
                <button class="btn btn-primary mt-1" @click="item.remove()">{{ $t("modpack.operate.remove") }}</button>
                <button class="btn btn-primary mt-1" @click="refresh()">{{ $t("modpack.operate.refresh") }}</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { commonMarkdown } from '@/core/utils/utils';
import { CustomPackageProviderProxy } from 'core';
import { computed } from 'vue';


const props = defineProps<{
    item: CustomPackageProviderProxy
}>();

const desc = computed(() => commonMarkdown.renderInline(props.item.description));

function refresh() {
    props.item.remove();
    CustomPackageProviderProxy.addCustomProvider(props.item.uRL);
}

</script>
