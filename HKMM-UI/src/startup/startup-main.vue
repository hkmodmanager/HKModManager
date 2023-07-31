<template>
    <div class="vh-100" v-if="throughCheck">
        <component :is="getApp()"></component>
    </div>
    <div class="vh-100" v-if="!throughCheck">
        <HkpathChange @onsave="check()"></HkpathChange>
    </div>
    <ModalBox ref="errorModal">
        <template #title>
            <h5>
                <i class="bi bi-bug text-danger" /> Error
            </h5>
        </template>
        <div copyable style="overflow:auto;max-height: 10em" 
            v-html="(prevErr?.stack ?? prevErr?.toString())?.replaceAll('\n', '<p />')">
        </div>
    </ModalBox>
</template>

<script lang="ts" setup>
import HkpathChange from '@/components/hkpath-change.vue';
import ModalBox from '@/components/modal-box.vue';
import { checkGameFile, } from '@/core/apiManager';
import { store } from '@/core/settings';
import { Component, onErrorCaptured, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

let appVue: Component | undefined;

const router = useRouter();
const errorModal = ref<typeof ModalBox>();
const throughCheck = ref(false);
const prevErr = ref<Error>();

onMounted(() => {
    check();
});

window.addEventListener('unhandledrejection', ev => {
    prevErr.value = ev.reason;
    errorModal.value?.getModal().show();
    console.error(ev.reason);
});

onErrorCaptured((err) => {
    prevErr.value = err;
    errorModal.value?.getModal().show();
    console.error(err);
    return false;
});

async function check() {
    if (throughCheck.value) return;
    const gs = store.get('gamepath', '');
    if (checkGameFile(gs) === true) {
        appVue = (await import('@/App.vue')).default;
        throughCheck.value = true;
        router.replace({
            path: '/ext'
        });
        return true;
    }
    return false;
}
function getApp() {
    return appVue;
}

</script>
