<template>
    <div class="card mb-2">
        <div class="d-flex g-0">
            <div class="flex-shrink-0" style="width: 128px;height: 128px">
                <img v-if="item?.icon" class="card-img-top" :src="item.icon" width="128" height="128" />
            </div>
            <div class="flex-grow-1 d-flex flex-column">

                <div class="flex-shrink-0 d-flex">
                    <div class="card-body flex-grow-1">
                        <template v-if="isInited()">
                            <h5 class="card-title">{{ item?.name }}</h5>
                            <div class="card-text" copyable v-html="desc"></div>
                            <small class="text-muted">
                                <div>{{ $t("modpack.source") }}
                                    <a :href="item?.uRL" copyable>{{ item?.uRL }}</a>
                                </div>
                            </small>
                        </template>
                        <template v-else>
                            <a :href="item?.uRL" copyable>{{ item?.uRL }}</a>
                            <p class="card-text placeholder-glow">
                                <span class="placeholder col-7"></span>
                                <span class="placeholder col-4"></span>
                                <span class="placeholder col-4"></span>
                                <span class="placeholder col-6"></span>
                                <span class="placeholder col-8"></span>
                            </p>
                        </template>
                    </div>
                </div>

            </div>
            <div class="flex-shrink-0 d-flex flex-column-reverse">
                <button class="btn btn-primary mt-1" @click="remove()">{{ $t("modpack.operate.remove") }}</button>
                <button class="btn btn-primary mt-1" @click="refresh()">{{ $t("modpack.operate.refresh") }}</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { store } from '@/core/settings';
import { commonMarkdown } from '@/core/utils/utils';
import { CustomPackageProviderProxy } from 'core';
import { computed, onBeforeMount, onMounted, onUnmounted, shallowRef, triggerRef } from 'vue';


let autoRefresh: any = undefined;

const props = defineProps<{
    initem: CustomPackageProviderProxy
}>();
const item = shallowRef<CustomPackageProviderProxy>();

const desc = computed(() => commonMarkdown.renderInline(props.initem.description));

function refresh() {
    props.initem.remove();
    CustomPackageProviderProxy.addCustomProvider(props.initem.uRL);
}

function remove() {
    props.initem.remove();
    const arr = store.store.modpackSources;
    const id = arr.indexOf(props.initem.uRL);
    if(id == -1) return;
    arr.splice(id, 1);
    store.set('modpackSources', arr);
}

function isInited() {
    try {
        return props.initem.name != undefined;
    } catch {
        return false;
    }
}

onBeforeMount(() => {
    item.value = props.initem;
});

onMounted(() => {
    item.value = props.initem;
    autoRefresh = setInterval(() => 
    {
        triggerRef(item);
    }, 500);
});

onUnmounted(() => {
    if(autoRefresh) {
        clearInterval(autoRefresh);
        autoRefresh = undefined;
    }
});

</script>
