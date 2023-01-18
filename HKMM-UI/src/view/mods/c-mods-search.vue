
<template>
    <div class="sticky-top p-1">
        <div class="input-group ">
            <input class="form-control" placeholder="..." v-model="textinput" @keyup.enter="refresh()" />
            <select class="form-select flex-grow-0 flex-shrink-0" v-model="ftag" @change="refresh()">
                <option value="None">{{ $t('mods.tags.None') }}</option>
                <option v-for="(tag) in tags" :key="tag" :value="tag">{{
                $t('mods.tags.' + tag) }}({{ (gCustomTag ?? {})[tag] ? `:${(gCustomTag ?? {})[tag]}` : `:tag=${tag}`
    }})
                </option>
            </select>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export let searchText: string = '';
let searchTag: string = 'None';
let curSearch: any = undefined;

export function getSearchText(): string {
    return curSearch?.textinput ?? searchText;
}

export function setSearchText(text: string) {
    searchText = text;
    if (curSearch) {
        curSearch.textinput = text;
        curSearch.refresh();
    }
}

export default defineComponent({
    data() {
        return {
            ftag: searchTag,
            textinput: searchText
        };
    },
    methods: {
        refresh() {
            searchTag = this.ftag;
            searchText = this.textinput.trim();
            let name = searchText;
            if (this.ftag != 'None') {
                const cn = this.gCustomTag ? this.gCustomTag[this.ftag] : undefined;
                if (cn) {
                    name += ':' + cn;
                } else {
                    name += ':tag=' + this.ftag;
                }
            }
            if (name == '') {
                this.$emit('update', undefined);
            } else {
                this.$emit('update', name);
            }
            console.log(name);
        },
    },
    mounted() {
        curSearch = this;
        if (!this.tags.includes(this.ftag)) {
            this.ftag = 'None';
            this.refresh();
            return;
        }
        if (searchTag != 'None' || searchText != '') {
            this.refresh();
        }
    },
    beforeUpdate() {
        if (!this.tags.includes(this.ftag)) {
            this.ftag = 'None';
            this.refresh();
        }
    },
    unmounted() {
        curSearch = undefined;
    },
    computed: {
        tags() {
            return ['Gameplay', 'Boss', 'Cosmetic', 'Expansion', 'Library', 'Utility',
                ...(this.gCustomTag ? Object.keys(this.gCustomTag) : [])];
        },
        gCustomTag() {
            const t = { ... this.customTags as Record<string, string> };
            t['Enabled'] = 'Enabled';
            t['Disabled'] = 'Disabled';
            return t;
        }
    },
    props: {
        customTags: Object
    },
    emits: {
        update: null
    }
});
</script>
