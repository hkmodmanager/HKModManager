<template>
    <ModalBox :backdrop="false" :keyboard="false" :title="$t('mods.importScarab.title')" ref="modal">
        <div class="alert alert-danger">{{ $t('mods.importScarab.alertMsg') }}</div>
        <div v-for="(mod) in getMods()" :key="mod.name">
            <div class="form-check">
                <input class="form-check-input" type="checkbox" v-model="selectedMods" :value="mod"/>
                <label class="form-check-label">{{ mod.name }}(v{{mod.mod.Version}})</label>
            </div>
        </div>
        <template #footer>
            <button class="btn btn-primary w-100" @click="showConfirm()">{{ $t('mods.importScarab.import') }}</button>
        </template>
    </ModalBox>
    <ModalBox :backdrop="false" :keyboard="false" :title="$t('mods.importScarab.confirmTitle')" ref="confirm">
        <div class="alert alert-danger">{{ $t('mods.importScarab.alertMsg') }}</div>
        <template #footer>
            <button class="btn btn-outline-danger" @click="beginImport()">{{ $t('mods.importScarab.confirmBtn') }}</button>
            <button class="btn btn-primary" @click="hideConfirm()">{{ $t('mods.importScarab.cancelBtn') }}</button>
        </template>
    </ModalBox>
</template>

<script lang="ts">
import ModalBox from '@/components/modal-box.vue';
import { scanScarabMods, ModInfo, importMods } from '@/renderer/relocation/Scarab/RScarab';
import { defineComponent } from 'vue';

export default defineComponent({
    components: { ModalBox },
    data() {
        return {
            selectedMods: [] as ModInfo[]
        };
    },
    methods: {
        showModal() {
            const modal = this.$refs.modal as any;
            modal.getModal().show();
        },
        hideModal() {
            const modal = this.$refs.modal as any;
            modal.getModal().hide();
        },
        showConfirm() {
            this.hideModal();
            if(this.selectedMods.length == 0) return;
            const modal = this.$refs.confirm as any;
            modal.getModal().show();
        },
        hideConfirm() {
            const modal = this.$refs.confirm as any;
            modal.getModal().hide();
        },
        beginImport() {
            this.hideConfirm();
            if(this.selectedMods.length == 0) return;
            console.log(this.selectedMods);
            importMods(this.selectedMods);
        },
        getMods() {
            return scanScarabMods();
        }
    },
    mounted() {
        this.selectedMods = [];
    }
});
</script>
