<template>
    <div class="vh-100" v-if="getApp() != undefined">
        <component :is="getApp()"></component>
    </div>
    <div class="vh-100" v-if="getApp() == undefined">
        <HkpathChange v-model:gamepath="gamepath" @onsave="check()"></HkpathChange>
    </div>
</template>

<script lang="ts">
import HkpathChange from '@/components/hkpath-change.vue';
import { checkGameFile, getAPIVersion } from '@/renderer/apiManager';
import { GetSettings, SaveSettings } from '@/renderer/settings';
import { Component, defineComponent } from 'vue';

let appVue: Component | undefined;

export default defineComponent({
    methods: {
        async check() {
            if(this.throughCheck) return;
            const gs = this.gamepath;
            if(checkGameFile(gs) === true) {
                this.throughCheck = true;
                appVue = (await import('@/App.vue')).default;
                
                GetSettings().gamepath = this.gamepath;
                SaveSettings();
                this.$forceUpdate();
                if(getAPIVersion() > 0) {
                    this.$router.replace({ name: "modgroups" });
                } else {
                    this.$router.replace({ name: "api" })
                }
            }
        },
        getApp() {
            return appVue;
        }
    },
    data() {
        return {
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
