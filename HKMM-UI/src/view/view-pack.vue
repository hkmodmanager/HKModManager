
<template>
    <div v-if="inited">
        <div>
            <CPackSearch @update="updateFilter" />
        </div>
        <div>
            <div v-for="(pack) in packages" :key="pack.name">
                <PackItem :package="pack" />
            </div>
        </div>
    </div>
    <div class="vp-spinner-parent h-100" v-else>
        <div class="vp-spinner spinner-border text-primary"></div>
    </div>
</template>

<style>
.vp-spinner-parent {
    display: flex;
    align-items: center;
    justify-content: center;
}

.vp-spinner {
    --bs-spinner-border-width: 2em;
    width: 16em;
    height: 16em;
}
</style>

<script setup lang="ts">
import CPackSearch from './pack/c-pack-search.vue';
import PackItem from './pack/c-pack-item.vue';
import { PackageDisplay, getRootPackageProvider, PackageProviderProxy } from 'core';
import { filterMods, prepareFilter } from '@/core/utils/modfilter';
import { getCurrentInstance, onBeforeMount, onUnmounted, ref } from 'vue';

const { ctx: _this }: any = getCurrentInstance();
const filter = prepareFilter();
const inited = ref(false);
let checkInit: any = undefined;
let packages = filterMods(getRootPackageProvider().getAllPackages(false) as PackageDisplay[], filter);

const input = ref<string>();

function updateFilter(i: string | undefined) {
    input.value = i;
    const filter = prepareFilter(i);
    packages = filterMods(getRootPackageProvider().getAllPackages(false) as PackageDisplay[], filter);
    _this.$forceUpdate();
}

onBeforeMount(() => {
    if (PackageProviderProxy.allInited) {
        inited.value = true;
    } else {
        checkInit = setInterval(() => {
            if (PackageProviderProxy.allInited) {
                inited.value = true;
                _this.$forceUpdate();
                clearInterval(checkInit);
                checkInit = undefined;
            }
        }, 500);
    }

    updateFilter(input.value ?? "");
});


onUnmounted(() => {
    if (checkInit) {
        clearInterval(checkInit);
        checkInit = undefined;
    }
});

</script>
