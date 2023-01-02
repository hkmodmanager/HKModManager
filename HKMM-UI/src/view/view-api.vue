<template>
    <div>
        <div>
            <img src="@/assets/apilogo.png" class="mx-auto d-block" v-if="getAPIVersion() > 0" />
            <img src="@/assets/hklogo.png" class="mx-auto d-block" v-if="getAPIVersion() <= 0" />
        </div>
        <div class="text-center">
            <div v-if="getAPIVersion() > 0">
                <h3><span copyable>{{ getGameVersion() }}-{{ getAPIVersion() }}</span>
                    <span class="badge bg-success p-1 m-1">{{ $t("api.found") }}</span>
                    <span v-if="apigf">
                        <span class="badge bg-success p-1 m-1" v-if="!hasUpdate()">{{ $t("api.isLatestVer") }}</span>
                        <span class="badge bg-warning p-1 m-1" v-else>{{ $t("api.hasLatestVer") }}</span>
                    </span>
                </h3>
            </div>
            <div v-else>
                <h3><span copyable>{{ getGameVersion() }}</span>
                    <span class="badge bg-warning p-1 m-1">{{ $t("api.notfound") }}</span>
                    <span calss="badge bg-danger p-1 m-1" v-if="nofitapi">{{ $t("api.notfit") }}</span>
                </h3>
            </div>
        </div>
        <hr />
        <div>
            <div class="d-flex" v-if="getAPIVersion() > 0 || !nofitapi">
                <button class="btn btn-primary flex-grow-1" v-if="!isInstallAPI()" :disabled="apiDownloading" @click="updateAPI()">{{ $t("api.install") }}</button>
                <button class="btn btn-primary flex-grow-1" v-if="hasUpdate()" :disabled="apiDownloading" @click="updateAPI()">{{ $t("api.update") }}</button>
                <button class="btn btn-primary flex-grow-1" v-if="isInstallAPI() && hasBackupFile()" @click="showUnistallAPI()">{{
                        $t("api.uninstall")
                }}</button>

            </div>
            <div class="alert alert-danger" v-if="isInstallAPI() && !hasBackupFile()">{{ $t("api.noBackup") }}</div>
            <div class="alert alert-danger" v-if="nofitapi">
                {{ $t("api.notfit") }}
            </div>
        </div>
    </div>
    <ModalBox ref="uninstallModal">
        <strong>{{ $t("api.uninstallMsg") }}</strong>
        <template #footer>
            <button class="btn btn-danger w-100" @click="uninstallAPI()">{{ $t('api.uninstall') }}</button>
        </template>
    </ModalBox>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { getAPIVersion, getGameVersion, getLatestIsMatch, getLatestIsMatchSync, downloadAPI, isVaildBackup, resotreBackup } from '@/renderer/apiManager'
import { apiInfoCache, getAPIInfo } from '@/renderer/modlinks/modlinks';
import ModalBox from '@/components/modal-box.vue';


export default defineComponent({
    methods: {
        hasBackupFile() {
            return isVaildBackup();
        },
        getAPIVersion() {
            return getAPIVersion();
        },
        getGameVersion() {
            return getGameVersion();
        },
        isInstallAPI() {
            return getAPIVersion() > 0;
        },
        showUnistallAPI() {
            (this.$refs.uninstallModal as any).getModal().show();
        },
        uninstallAPI() {
            (this.$refs.uninstallModal as any).getModal().hide();
            if(!isVaildBackup()) {
                this.$forceUpdate();
                return;
            }
            resotreBackup();
            this.$forceUpdate();
        },
        hasUpdate() {
            if (!this.apigf || !this.isInstallAPI() || !getLatestIsMatchSync())
                return false;
            const api = apiInfoCache;
            if (!api)
                return false;
            return api.version > getAPIVersion();
        },
        async updateAPI() {
            this.apiDownloading = true;
            await downloadAPI();
            this.apiDownloading = false;
            this.$forceUpdate();
        }
    },
    data() {
        return {
            nofitapi: false,
            apigf: false,
            apiDownloading: false
        };
    },
    mounted() {
        getAPIInfo().then(() => {
            this.apigf = true;
            this.$forceUpdate();
        });
        getLatestIsMatch().then((result) => {
            this.nofitapi = !result;
        });
    },
    components: { ModalBox }
});

</script>
