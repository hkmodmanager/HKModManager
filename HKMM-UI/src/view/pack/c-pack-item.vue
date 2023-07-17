
<template>
    <div class="card mb-2">
        <div class="row g-0">
            <div class="col-md-2">
                <img v-if="package.icon" class="card-img-top" :src="getIcon()" />
            </div>
            <div class="col-md-10">
                <div class="card-body">
                    <h5 class="card-title">{{ package.displayName }}</h5>
                    <p class="card-text">{{ package.description }}
                    </p>
                    <p class="card-text" v-if="package.tags.length > 0"><small class="text-muted">Tags: {{ package.tags.join(' ') }}</small></p>
                    <p class="card-text"><small class="text-muted">Last updated {{ getLastUpdate() }} ago</small></p>
                </div>
                <button class="btn btn-primary" style="float: right;">Details <i class="bi bi-arrow-right" /></button>
            </div>
            
        </div>
    </div>
</template>

<script setup lang="ts">
import { PackageDisplay } from 'core';


const props = defineProps<{
    package: PackageDisplay
}>();

function getIcon() {
    if (!props.package.icon) return undefined;
    return props.package.icon.replace('internal-icons://', "../icons/")
}

function getLastUpdate() {
    const span = Date.now() - props.package.date;
    const days = span / 1000 / 3600 / 24;
    if(days < 7) return `${days} days`;
    else if(days < 31) return `${Math.floor(days / 7)} weeks`;
    else if(days < 365) return `${Math.floor(days / 31)} months`;
    else return `${Math.floor(days / 365)} years`;
}

</script>
