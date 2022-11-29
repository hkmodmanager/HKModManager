<template>
    <div class="vh-100" v-if="appVue != undefined">
        <component :is="appVue"></component>
    </div>
    <div class="vh-100" v-if="appVue == undefined">
        <HkpathChange v-model:gamepath="gamepath" @onsave="check()"></HkpathChange>
    </div>
</template>

<script lang="ts">
import HkpathChange from '@/components/hkpath-change.vue';
import { checkGameFile } from '@/renderer/apiManager';
import { GetSettings, SaveSettings } from '@/renderer/settings';
import { Component, defineComponent } from 'vue';

export default defineComponent({
    methods: {
        async check() {
            if(this.throughCheck) return;
            const gs = this.gamepath;
            if(checkGameFile(gs) === true) {
                this.throughCheck = true;
                this.appVue = (await import('@/App.vue')).default;
                console.log(this.appVue);
                
                GetSettings().gamepath = this.gamepath;
                SaveSettings();
            }
        }
    },
    data() {
        return {
            appVue: undefined as any as Component,
            throughCheck: false,
            gamepath: GetSettings().gamepath
        };
    },
    mounted() {
        this.check();
    },
    components: { HkpathChange }
});
</script>
