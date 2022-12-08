
<template>
    <div class="form-group p-3">
        <label class="form-label">{{ $t("settings.gamepath.title") }}</label>
        <div class="input-group">
            <input type="text" class="form-control" :value="getHKPath()" readonly disabled />
            <a class="btn btn-success" @click="selectHKPath()"><i class="bi bi-folder2-open"></i></a>
        </div>
        <div class="alert alert-danger" v-if="msg != ''">
            {{ $t(`error.hkcheck.${msg}`) }}
        </div>
    </div>
</template>

<script lang="ts">
import { remote } from 'electron';
import { parse } from 'path';
import { defineComponent } from 'vue';
import { checkGameFile, findHKPath } from '@/renderer/apiManager';
import { store } from '@/renderer/settings';

export default defineComponent({
    data() {
        return {
            msg: ""
        };
    },
    methods: {
        selectHKPath() {
            const result = remote.dialog.showOpenDialogSync({
                filters: [
                    {
                        name: this.$t("settings.gamepath.hkexe"),
                        extensions: ["exe"]
                    }
                ],
                properties: ["dontAddToRecent", "openFile"]
            });
            if (!result) return;
            const p = parse(result[0]);
            console.log(p);
            const re = checkGameFile(p.dir);
            if (typeof re == "string") {
                this.msg = re;
                return;
            }
            this.msg = '';
            store.set('gamepath', p.dir);
            this.$emit('onsave', p.dir);
        },
        getHKPath() {
            return store.get('gamepath', '');
        }
    },
    mounted() {
        let re = checkGameFile(this.getHKPath());
        if (typeof re == "string") {
            const afh = findHKPath();
            if(!afh) {
                this.msg = 'aff';
                return;
            }
            else
            {
                re = checkGameFile(afh);
            }
            if(typeof re == 'string') {
                this.msg = 'aff';
                return;
            }
            else
            {
                store.set('gamepath', afh);
                this.$emit('onsave', afh);
            }
        }
        this.msg = '';
    },
    emits: {
        'onsave': null
    }
});
</script>
