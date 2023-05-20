<template>
    <ModalBox :backdrop="false" :keyboard="false" :title="$t('mods.importLocal.title')" ref="modal">
        <select class="form-select " v-model="importMode">
            <option value="nonexclusive">{{ $t('mods.importLocal.nonexclusive') }}</option>
            <option value="exclusive">{{ $t('mods.importLocal.exclusive') }}</option>
        </select>
        <div v-if="importMode == 'exclusive'" class="alert alert-danger" copyable>{{
            $t('mods.importLocal.alertMsg_exclusive')
        }}</div>
        <div v-else class="alert alert-danger" copyable>{{ $t('mods.importLocal.alertMsg_nonexclusive') }}</div>
        <template v-if="!forceImportMod">
            <div v-for="(mod) in mods" :key="mod.name">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" v-model="selectedMods" :value="mod" />
                    <label class="form-check-label" copyable>
                        {{ mod.name }}(v{{ mod.mod.version }})
                        <span class="text-success" notcopyable v-if="installedMod(mod.mod)">({{
                            $t('mods.depInstall')
                        }})</span>
                        <i class="bi bi-exclamation-triangle text-danger" v-if="mod.fulllevel == 0"
                            :title="$t('mods.importLocal.alert_dllnotfull') + getMissingFileText(mod)"></i>
                        <i class="bi bi-exclamation-circle text-warning" v-if="mod.fulllevel == 1"
                            :title="$t('mods.importLocal.alert_dllfull') + getMissingFileText(mod)"></i>
                        <i class="bi bi-info-circle text-success" v-if="mod.fulllevel == 2"
                            :title="$t('mods.importLocal.alert_resourcefull') + getMissingFileText(mod)"></i>
                        <i class="bi bi-check-circle text-success" v-if="mod.fulllevel == 3"
                            :title="$t('mods.importLocal.alert_full')"></i>
                    </label>
                </div>
            </div>
        </template>
        <template v-else>
            <div class="form-check">
                <input class="form-check-input" type="checkbox" checked disabled />
                <label class="form-check-label" copyable>{{ forceImportMod.name }}(v{{
                    forceImportMod.mod.version
                }})
                    <span class="text-success" notcopyable v-if="installedMod(forceImportMod.mod)">({{
                        $t('mods.depInstall')
                    }})</span>
                    <i class="bi bi-exclamation-triangle text-danger" v-if="forceImportMod.fulllevel == 0"
                        :title="$t('mods.importLocal.alert_dllnotfull') + getMissingFileText(forceImportMod)"></i>
                    <i class="bi bi-exclamation-circle text-warning" v-if="forceImportMod.fulllevel == 1"
                        :title="$t('mods.importLocal.alert_dllfull') + getMissingFileText(forceImportMod)"></i>
                    <i class="bi bi-info-circle text-success" v-if="forceImportMod.fulllevel == 2"
                        :title="$t('mods.importLocal.alert_resourcefull') + getMissingFileText(forceImportMod)"></i>
                    <i class="bi bi-check-circle text-success" v-if="forceImportMod.fulllevel == 3"
                        :title="$t('mods.importLocal.alert_full')"></i></label>
            </div>
        </template>
        <template #footer>
            <button class="btn btn-primary w-100" @click="showConfirm()">{{ $t('mods.importLocal.import') }}</button>
        </template>
    </ModalBox>
    <ModalBox :backdrop="false" :keyboard="false" :title="$t('mods.importLocal.confirmTitle')" ref="confirm">
        <div v-if="importMode == 'exclusive'" class="alert alert-danger" copyable>{{
            $t('mods.importLocal.alertMsg_exclusive')
        }}</div>
        <div v-else class="alert alert-danger" copyable>{{ $t('mods.importLocal.alertMsg_nonexclusive') }}</div>
        <template #footer>
            <button class="btn btn-outline-danger" @click="beginImport()">{{
                $t('mods.importLocal.confirmBtn')
            }}</button>
            <button class="btn btn-primary" @click="hideConfirm()">{{ $t('mods.importLocal.cancelBtn') }}</button>
        </template>
    </ModalBox>
</template>

<script lang="ts">
import ModalBox from '@/components/modal-box.vue';
import { ModLinksManifestData } from '@/core/modlinks/modlinks';
import { isInstallMod, refreshLocalMods } from '@/core/modManager';
import { IRLocalMod, RL_ImportLocalMods, RL_ScanLocalMods } from '@/core/relocation/RLocal';
import { defineComponent } from 'vue';

export default defineComponent({
    components: { ModalBox },
    mounted() {

    },
    methods: {
        async showModal() {
            if(this.forceImportMod) {
                this.mods = [this.forceImportMod];
            } else {
                this.mods = await RL_ScanLocalMods(false, false, false);
            }
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
        installedMod(mod: ModLinksManifestData) {
            return isInstallMod(mod, true);
        },
        beginImport() {
            this.hideConfirm();
            if (this.forceImportMod) {
                this.selectedMods = [this.forceImportMod];
            }
            if (this.selectedMods.length == 0) return;
            console.log(this.selectedMods);
            RL_ImportLocalMods(this.selectedMods, this.importMode == 'exclusive');
            refreshLocalMods(true);
            this.$parent?.$forceUpdate();
        },
        getMissingFileText(mod: IRLocalMod) {
            const files = mod.missingFiles;
            if(!files) return "";
            return `\n${this.$t('mods.importLocal.missing_files')}:\n${files.join('\n')}`;
        }
    },
    data() {
        return {
            selectedMods: [] as IRLocalMod[],
            importMode: 'exclusive',
            mods: [] as IRLocalMod[],
            inited: false
        };
    },
    computed: {
        forceImportMod() {
            return this.forceImport as IRLocalMod;
        }
    },
    props: {
        forceImport: Object
    },
});
</script>
