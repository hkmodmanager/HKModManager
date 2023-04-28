<template>
    <div class="form-check">

        <input class="form-check-input" type="radio" name="cdnRadio" :value="value" v-model="cdn">
        <label class="form-check-label" copyable>
            {{ displayname }}
        </label>
        <slot></slot>
        <i class="bi bi-globe p-1" v-if="pingResult === 0"></i>
        <i class="bi bi-wifi-off text-danger p-1" v-else-if="pingResult < 0"></i>
        <i class="bi bi-globe text-success p-1" v-else-if="pingResult < 500">{{ pingResult }}ms</i>
        <i class="bi bi-globe text-warning p-1" v-else-if="pingResult < 1000">{{ pingResult }}ms</i>
        <i class="bi bi-globe text-danger p-1" v-else>{{ pingResult }}ms</i>
    </div>
</template>

<script lang="ts">
import { cdn_modlinks } from '@/core/exportGlobal';
import { CDN, store } from '@/core/settings';
import { Guid } from 'guid-typescript';
import { downloadText } from '@/core/utils/downloadFile'
import { defineComponent } from 'vue';

const pr: Record<string, number> = {};

async function getPingResult(cdn: CDN) {
    if (pr[cdn]) return pr[cdn];
    const st = Date.now();
    try {
        //await fetch(cdn_modlinks[cdn] + "?_=" + Guid.create().toString());
        await downloadText(cdn_modlinks[cdn] + "?_=" + Guid.create().toString());
    } catch (e) {
        setTimeout(() => {
            delete pr[cdn];
        }, 1000 * 10);
        return (pr[cdn] = -1);
    }
    const s = Date.now() - st;
    setTimeout(() => {
        delete pr[cdn];
    }, 1000 * 10);
    return (pr[cdn] = s);
}

export default defineComponent({
    props: {
        value: String,
        displayname: String,
        cdnProp: String
    },
    data() {
        return {
            cdn: this.cdnProp,
            pingResult: 0
        }
    },
    watch: {
        cdn(n, o) {
            if (n == o) return;
            this.$emit('update:cdnProp', n);
            store.set('cdn', n);
        }
    },
    beforeUpdate() {
        this.cdn = this.cdnProp;
    },
    mounted() {
        getPingResult(this.value as CDN).then(val => {
            this.pingResult = val;
        });
    }
});
</script>
