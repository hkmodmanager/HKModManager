
<template>
    <div>
        <div v-for="(s) in sources" :key="s.name">
            <CSourceItemVue :item="s" />
        </div>
    </div>
</template>

<script setup lang="ts">
import CSourceItemVue from '@/view/source/c-source-item.vue';
import { CustomPackageProviderProxy } from 'core';
import { getCurrentInstance, onMounted, onUnmounted } from 'vue';

const { ctx: _this }: any = getCurrentInstance();

let sources = CustomPackageProviderProxy.getAllCustomProviders();

let autoRefresh: any = undefined;

function refresh() {
    sources = CustomPackageProviderProxy.getAllCustomProviders();

    _this.$forceUpdate();
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
