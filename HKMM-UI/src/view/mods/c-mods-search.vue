
<template>
    <div class="input-group sticky-top">
        <input class="form-control" placeholder="..." v-model="text" @keyup.enter="refresh()"/>
        <select class="form-select flex-grow-0 flex-shrink-0" v-model="ftag">
            <option  value="None">{{ $t('mods.tags.None') }}</option>
            <option v-for="(tag) in ['Gameplay', 'Boss', 'Cosmetic', 'Expansion', 'Library', 'Utility']" :key="tag" :value="tag">{{ tag }}</option>
        </select>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    data() {
        return {
            text: "",
            ftag: "None"
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
    computed: {
        tags() {
            return [];
        }
    },
    watch: {
        ftag(n) {
            this.$emit('updateTag', n);
            console.log(n);
        }
    },
    emits: {
        update: null,
        updateTag: null
    }
});
</script>
