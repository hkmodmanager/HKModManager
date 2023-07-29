<template>
    <div class="form-check">

        <input class="form-check-input" type="radio" name="cdnRadio" :value="value" v-model="cdn">
        <label class="form-check-label" copyable>
            {{ displayname }}
        </label>
        <slot></slot>
    </div>
</template>

<script lang="ts">
import { store } from '@/core/settings';
import { defineComponent } from 'vue';

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
    }
});
</script>
