
<template>
    <div>
        <div v-for="(pack) in packages" :key="pack.name">
            <PackItem :package="pack"/>
        </div>
    </div>
</template>

<script setup lang="ts">
import PackItem from './pack/c-pack-item.vue';
import { PackageDisplay, getRootPackageProvider } from 'core';
import { filterMods, prepareFilter } from '@/core/utils/modfilter';

const filter = prepareFilter();
const packages = filterMods(getRootPackageProvider().getAllPackages(false) as PackageDisplay[], filter);
</script>
