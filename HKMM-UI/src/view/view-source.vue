
<template>
    <div class="input-group mb-2">
        <input class="form-control" v-model="srcURL" />
        <button class="btn btn-primary" @click="addURL()"><i class="bi bi-plus" /></button>
    </div>
    <div>
        <div v-for="(s) in sources" :key="s.uRL">
            <CSourceItemVue :initem="s" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { store } from '@/core/settings';
import CSourceItemVue from '@/view/source/c-source-item.vue';
import { CustomPackageProviderProxy } from 'core';
import { onMounted, onUnmounted, ref, shallowRef } from 'vue';


const srcURL = ref("");

const sources = shallowRef(CustomPackageProviderProxy.getAllCustomProviders());

let autoRefresh: any = undefined;

function refresh() {
    sources.value = CustomPackageProviderProxy.getAllCustomProviders();
}

function addURL() {
    let url = srcURL.value;
    if(url == "") return;
    if(!url.startsWith("local:") && !url.startsWith("https://")) {
        url = "https://" + url;
    }
    CustomPackageProviderProxy.addCustomProvider(url);
    store.set('modpackSources', [ ...store.store.modpackSources, url ]);
}

onMounted(() => {
    autoRefresh = setInterval(refresh, 500);
});

onUnmounted(() => {
    if(autoRefresh) {
        clearInterval(autoRefresh);
        autoRefresh = undefined;
    }
});

</script>
