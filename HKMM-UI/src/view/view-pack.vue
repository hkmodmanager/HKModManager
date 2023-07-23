
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
import { onBeforeMount, onUnmounted, ref, shallowRef } from 'vue';

const filter = prepareFilter(":nohide");
const inited = ref(false);
let checkInit: any = undefined;
let autoRefresh: any = undefined;
let packages = shallowRef(filterMods(getRootPackageProvider().getAllPackages(false) as PackageDisplay[], filter));

const input = ref<string>();

function updateFilter(i: string | undefined) {
    
    const allpackages = getRootPackageProvider().getAllPackages(false) as PackageDisplay[];
    
    const authorNames: Set<string> = new Set<string>();
    for (const pack of allpackages) {
        const authors = pack.authors;
        if(authors) {
            for (const author of authors) {
                authorNames.add(author);
            }
        }
    }
    localStorage.setItem("allAuthors", JSON.stringify([...authorNames.values()]));

    input.value = i;
    const filter = prepareFilter(i + ":nohide");
    packages.value = filterMods(allpackages, filter);
}

onBeforeMount(() => {
    if (PackageProviderProxy.allInited) {
        inited.value = true;
    } else {
        checkInit = setInterval(() => {
            if (PackageProviderProxy.allInited) {
                setTimeout(() => {
                    inited.value = true;
                }, 100);
                
                clearInterval(checkInit);
                checkInit = undefined;
            }
        }, 500);
    }
    autoRefresh = setInterval(() => updateFilter(input.value ?? ""), 1000);
    updateFilter(input.value ?? "");
});


onUnmounted(() => {
    if (checkInit) {
        clearInterval(checkInit);
        checkInit = undefined;
    }
    if(autoRefresh) {
        clearInterval(autoRefresh);
        autoRefresh = undefined;
    }
});

</script>
