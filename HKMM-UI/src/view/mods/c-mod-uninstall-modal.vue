<template>
    <ModalBox :title="$t('mods.uninstall_title', {
        modname: modName
    })" :backdrop="false" :keyboard="false" ref="modal">
        <div v-if="(dependMods?.length ?? 0) > 0">
            <div>{{ $t('mods.uninstall_BeDepended', {
                modname: modName
            }) }}</div>
            <div>
                <div v-for="val in dependMods" :key="val">
                    {{ val }}
                </div>
            </div>
        </div>
        <div v-else>
            <div>{{ $t('mods.uninstall_0', {
                modname: modName
            }) }}</div>
        </div>
        <template #footer>
            <button class="btn btn-outline-danger" @click="clickConfirm()">{{ $t('mods.exportScarab.confirmBtn') }}</button>
            <button class="btn btn-primary" @click="clickCancel()">{{ $t('mods.exportScarab.cancelBtn') }}</button>
        </template>
    </ModalBox>
</template>

<script lang="ts">
import ModalBox from '@/components/modal-box.vue';
import { defineComponent } from 'vue';

export default defineComponent({
    components: { ModalBox },
    props: {
        modName: String,
        dependMods: Array<string>
    },
    methods: {
        clickCancel() {
            const modal = this.$refs.modal as any;
            modal.getModal().hide();
        },
        clickConfirm() {
            this.clickCancel();

            this.$emit("ondelete", this.modName);
        },
        show() {
            const modal = this.$refs.modal as any;
            modal.getModal().show();
        }
    },
    emits: {
        ondelete: null
    }
});

</script>
