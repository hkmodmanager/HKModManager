<template>
    <div>
        <div>
            <img src="@/assets/apilogo.png" class="mx-auto d-block" v-if="getAPIVersion() > 0" />
            <img src="@/assets/hklogo.png" class="mx-auto d-block" v-if="getAPIVersion() <= 0" />
        </div>
        <div class="text-center">
            <div v-if="getAPIVersion() > 0">
                <h3>{{ getGameVersion() }}-{{ getAPIVersion() }}<span class="badge bg-success p-1 m-1">{{ $t("api.found") }}</span></h3>
            </div>
            <div v-else>
                <h3>{{ getGameVersion() }}<span class="badge bg-warning p-1 m-1">{{ $t("api.notfound") }}</span></h3>
            </div>
        </div>
        <hr />
        <div>
            <div class="d-flex">
                <button class="btn btn-primary flex-grow-1" v-if="!hasLocalAPI()">{{ $t("api.download") }}</button>
                <button class="btn btn-primary flex-grow-1" v-if="hasUpdate()">{{ $t("api.update") }}</button>
                <button class="btn btn-primary flex-grow-1" v-if="getAPIVersion() <= 0 && hasLocalAPI()">{{ $t("api.enable") }}</button>
                <button class="btn btn-primary flex-grow-1" v-if="getAPIVersion() > 0">{{ $t("api.disable") }}</button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { getAPIVersion, getGameVersion } from '@/renderer/apiManager'
import { getAPIInfo } from '@/renderer/modlinks/modlinks';


export default defineComponent({
    methods: {
        hasLocalAPI() {
            return false;
        },
        getAPIVersion() {
            return getAPIVersion();
        },
        getGameVersion() {
            return getGameVersion();
        },
        hasUpdate() {
            if(!this.hasLocalAPI()) return false;
        }
    },
    data() {
        return {

        }
    },
    mounted() {
        getAPIInfo().then(() => {
            this.$forceUpdate();
        });
    }
});

</script>
