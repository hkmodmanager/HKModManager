<template>
    <ModalBox :backdrop="false" :keyboard="false" :title="$t('mods.importScarab.title')" ref="modal">
        <select class="form-select bg-dark text-white" v-model="importMode">
            <option value="nonexclusive">{{ $t('mods.importScarab.nonexclusive') }}</option>
            <option value="exclusive">{{ $t('mods.importScarab.exclusive') }}</option>
        </select>
        <div v-if="importMode == 'exclusive'" class="alert alert-danger" copyable>{{
            $t('mods.importScarab.alertMsg_exclusive')
        }}</div>
        <div v-else class="alert alert-danger" copyable>{{ $t('mods.importScarab.alertMsg_nonexclusive') }}</div>
        <template v-if="!forceImportMod">
            <div v-for="(mod) in getMods()" :key="mod.name">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" v-model="selectedMods" :value="mod" />
                    <label class="form-check-label" copyable>{{ mod.name }}(v{{ mod.mod.Version }})</label>
                </div>
            </div>
        </template>
        <template v-else>
            <div class="form-check">
                <input class="form-check-input" type="checkbox" checked disabled />
                <label class="form-check-label" copyable>{{ forceImportMod.name }}(v{{
                    forceImportMod.mod.Version
                }})</label>
            </div>
        </template>
        <template #footer>
            <button class="btn btn-primary w-100" @click="showConfirm()">{{ $t('mods.importScarab.import') }}</button>
        </template>
    </ModalBox>
    <ModalBox :backdrop="false" :keyboard="false" :title="$t('mods.importScarab.confirmTitle')" ref="confirm">
        <div v-if="importMode == 'exclusive'" class="alert alert-danger" copyable>{{
            $t('mods.importScarab.alertMsg_exclusive')
        }}</div>
        <div v-else class="alert alert-danger" copyable>{{ $t('mods.importScarab.alertMsg_nonexclusive') }}</div>
        <template #footer>
            <button class="btn btn-outline-danger" @click="beginImport()">{{
                $t('mods.importScarab.confirmBtn')
            }}</button>
            <button class="btn btn-primary" @click="hideConfirm()">{{ $t('mods.importScarab.cancelBtn') }}</button>
        </template>
    </ModalBox>
</template>

<script lang="ts">
import ModalBox from '@/components/modal-box.vue';
import { refreshLocalMods } from '@/renderer/modManager';
import { scanScarabMods, ModInfo, importMods } from '@/renderer/relocation/Scarab/RScarab';
import { defineComponent } from 'vue';

export default defineComponent({
    components: { ModalBox },
    data() {
        return {
            selectedMods: [] as ModInfo[],
            importMode: 'exclusive'
        };
    },
    props: {
        forceImport: Object
    },
    computed: {
        forceImportMod() {
            return this.forceImport as ModInfo;
        }
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
            if (this.forceImportMod) {
                this.selectedMods = [this.forceImportMod];
            }
            if (this.selectedMods.length == 0) return;
            const modal = this.$refs.confirm as any;
            modal.getModal().show();
        },
        hideConfirm() {
            const modal = this.$refs.confirm as any;
            modal.getModal().hide();
        },
        beginImport() {
            this.hideConfirm();
            if (this.forceImportMod) {
                this.selectedMods = [this.forceImportMod];
            }
            if (this.selectedMods.length == 0) return;
            console.log(this.selectedMods);
            importMods(this.selectedMods, this.importMode == 'exclusive');
            refreshLocalMods(true);
            this.$parent?.$forceUpdate();
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
