<template>
    <div class="vh-100" v-if="getApp() != undefined">
        <component :is="getApp()"></component>
    </div>
    <div class="vh-100" v-if="getApp() == undefined">
        <HkpathChange @onsave="check()"></HkpathChange>
    </div>
</template>

<script lang="ts">
import HkpathChange from '@/components/hkpath-change.vue';
import { checkGameFile, getAPIVersion } from '@/core/apiManager';
import { store } from '@/core/settings';
import { Component, defineComponent } from 'vue';

let appVue: Component | undefined;

export default defineComponent({
    methods: {
        async check() {
            if(this.throughCheck) return;
            const gs = store.get('gamepath', '');
            if(checkGameFile(gs) === true) {
                this.throughCheck = true;
                appVue = (await import('@/App.vue')).default;

                this.$forceUpdate();
                
                return true;
            }
            return false;
        },
        getApp() {
            return appVue;
        }
    },
    data() {
        return {
            throughCheck: false
        };
    },
    mounted() {
        this.check();
    },
    components: { HkpathChange }
});
</script>
