
<template>
    <div class="alert alert-warning alert-dismissible collapse" ref="alert" v-show="updateInfo">
        <a href="javascript:;" :style="{ 'textDecoration': 'none' }" @click="showModal()">
            {{ $t('hasUpdate') }}&nbsp;&nbsp;&nbsp;&nbsp;({{ $t('clickHere') }})
        </a>
        <button class="btn-close" @click="closeAlert()"></button>
    </div>
    <ModalBox ref="modal" :title="$t('updateTitle')">
        {{ $t('hasUpdate') }}&nbsp;(<span class="text-danger">{{ getVersion() }}</span><i class="bi bi-arrow-right"></i>
        <span class="text-success">{{
                getLatestVersion()
        }}</span>)
        <p>
            {{ $t('updateSize') }}:&nbsp;{{ getSize() }}
        </p>
        <template #footer>
            <button class="btn btn-primary" @click="installUpdate()">{{ $t("downloadUpdate") }}</button>
            <button class="btn btn-primary" @click="hideModal()">{{ $t("updateCancel") }}</button>
        </template>
    </ModalBox>
</template>

<script lang="ts">
import ModalBox from '@/components/modal-box.vue';
import { buildMetadata } from '@/core/exportGlobal';
import { appVersion } from '@/core/remoteCache';
import { checkUpdate, installUpdate, UpdateInfo } from '@/core/updater';
import { ConvertSize } from '@/core/utils/utils';
import { Collapse, Modal } from 'bootstrap';
import { defineComponent } from 'vue';

export default defineComponent({
    methods: {
        async check() {
            const result = this.updateInfo = await checkUpdate(true);
            if (!result) return false;
            const modal = (this.$refs.modal as any).getModal() as Modal;
            modal.show();
            this.$forceUpdate();
        },
        hideModal() {
            const modal = (this.$refs.modal as any).getModal() as Modal;
            modal.hide();
            this.alert.show();
        },
        showModal() {
            const modal = (this.$refs.modal as any).getModal() as Modal;
            modal.show();
        },
        closeAlert() {
            this.alert.hide();
        },
        getVersion() {
            if(!buildMetadata.isTag) {
                return `v${appVersion}-alpha-${buildMetadata.headCommit.substring(0, 7)}`;
            }
            return 'v' + appVersion;
        },
        getLatestVersion() {
            if(this.updateInfo?.version.startsWith('alpha')) return this.updateInfo.version;
            return 'v' + this.updateInfo?.version;
        },
        installUpdate() {
            this.hideModal();
            this.alert.hide();
            installUpdate().then(() => {
                this.alert.hide();
            }).catch((e) => {
                this.alert.show();
                //@ts-ignore
                // eslint-disable-next-line no-undef
                throw_fault(e);
            });
            if (this.$route.name != 'tasks' || (this.$route.params.filter != 'all' && this.$route.params.filter!= 'running')) {
                this.$router.push({ name: 'tasks', params: { filter: 'all' } });
            }
        },
        getSize() {
            if (!this.updateInfo) return '0';
            return ConvertSize(this.updateInfo.size ?? 0);
        },

    },
    data() {
        return {
            updateInfo: undefined as any as (UpdateInfo | undefined),
            alert: undefined as any as Collapse
        }
    },
    mounted() {
        this.alert = new Collapse(this.$refs.alert as any);
        this.alert.hide();
        this.check();
    },
    components: { ModalBox }
});
</script>