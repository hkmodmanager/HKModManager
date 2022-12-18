
<template>
    <div class="input-group sticky-top">
        <input class="form-control" placeholder="..." v-model="text" @keyup.enter="refresh()"/>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    data() {
        return {
            text: ""
        };
    },
    methods: {
        refresh() {
            const name = this.text.trim();
            if(name == '') {
                this.$emit('update', undefined);
            } else {
                this.$emit('update', name);
            }
            console.log(this.text.trim());
        }
    },
    emits: {
        update: null
    }
});
</script>
