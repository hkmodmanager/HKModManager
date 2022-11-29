
<template>
    <div class="form-group p-3">
        <label class="form-label">{{ $t("settings.gamepath.title") }}</label>
        <div class="input-group">
            <input type="text" class="form-control" :value="gamepath" readonly disabled />
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
import { checkGameFile } from '@/renderer/apiManager';

export default defineComponent({
    data() {
        return {
            msg: ""
        };
    },
    props: {
        gamepath: {
            type: String,
            default: ""
        }
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
            this.$emit('update:gamepath', p.dir);
            this.$emit('onsave', p.dir);
        }
    },
    mounted() {
        const re = checkGameFile(this.gamepath);
        if (typeof re == "string") {
            this.msg = re;
            return;
        }
        this.msg = '';
    },
    emits: {
        'update:gamepath': null,
        'onsave': null
    }
});
</script>
