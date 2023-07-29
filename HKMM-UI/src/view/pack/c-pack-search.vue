
<template>
    <div class="sticky-top bg-body">
        <div class="p-1 card m-2">
            <div class="input-group ">
                <input class="form-control" placeholder="..." v-model="textinput" @keyup.enter="refresh()" />
                <button class="btn border text-white" @click="db_collapse?.toggle()"><i class="bi bi-arrow-down" /></button>
            </div>
            <div class="mt-1 collapse" ref="detailsBody">
                <div v-for="(group, id) in groups" :key="id" class="row">

                    <div class="col">{{ $t("modpack.tags.groups." + id) }}</div>

                    <div v-for="(key, name) in group" :key="key" class="col form-check">

                        <input :id="`cps-g-${id}-${key}`" class="form-check-input" type="checkbox"
                            v-if="id.startsWith('mul_')" :name="`cps-g-${id}`" :value="key" v-model="options"
                            @change="refresh()" />
                        <input :id="`cps-g-${id}-${key}`" class="form-check-input" type="radio" v-else :name="`cps-g-${id}`"
                            :value="key" v-model="filters[id]" @change="refresh()" />

                        <label :for="`cps-g-${id}-${key}`" class="form-check-label">
                            {{ $t("modpack.tags." + name) }}<span v-if="false">(:{{ key }})</span>
                        </label>
                    </div>
                </div>
                <div class="form-floating">
                    <select class="form-select" id="floatingSelect" v-model="filters['autho']" @change="refresh()">
                        <option v-for="author in authors" :key="author" :value="`author=${author}`">{{ author }}</option>
                    </select>
                    <label for="floatingSelect">{{ $t("modpack.tags.groups.author") }}</label>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Collapse } from 'bootstrap';
import { computed, onBeforeMount, onMounted, onUnmounted, ref } from 'vue';

let searchText: string = '';

const detailsBody = ref<Element>();
const filters = ref<Record<string, string>>({});
const options = ref<string[]>([])
const textinput = ref(searchText);
const commonTags: Record<string, string> = {};



let db_collapse: Collapse | undefined = undefined;

for (const tag of ['Gameplay', 'Boss', 'Cosmetic', 'Expansion', 'Library', 'Utility']) {
    commonTags[tag] = "tag=" + tag;
}

const defaultTags: Record<string, Record<string, string>> = {
    "mul_tags": commonTags,
    "enabled": {
        "None": "",
        "Enabled": "Enabled",
        "Disabled": "Disabled"
    },
    "installed": {
        "None": "",
        "installed.installed": "Installed",
        "installed.uninstalled": "Uninstalled"
    },
    "type": {
        "None": "",
        "type.mod": "type=Mod",
        "type.modpack": "type=ModPack"
    },
    "requireUpdate": {
        "None": "",
        "ru.yes": "requireUpdate=true",
        "ru.no": "requireUpdate=false",
    }
};

const authors: string[] = ["", ...(JSON.parse(localStorage.getItem('allAuthors') ?? '[]') as string[])
    .sort((a, b) => a.localeCompare(b))];
const emit = defineEmits(['update']);

const props = defineProps<{
    customTags?: Record<string, Record<string, string>>
}>();

const groups = computed(() => {
    const all = props.customTags ? { ...props.customTags, ...defaultTags } : defaultTags;
    return all;
});

function refresh() {
    searchText = textinput.value.trim();
    let name = searchText;
    for (const v of Object.values(filters.value)) {
        if (typeof v === 'string') {
            name += ':' + v;
        }
    }
    for (const n of options.value) {
        name += ':' + n;
    }
    console.log(name);
    if (name == '') {
        emit('update', undefined);
    } else {
        emit('update', name);
    }
}

onBeforeMount(() => {
    const c = sessionStorage.getItem("cps-filters");
    if (typeof c === 'string') {
        filters.value = JSON.parse(c);
    }
    if (typeof filters.value !== 'object') {
        filters.value = {};
    }
    const o = sessionStorage.getItem("cps-options");
    if (typeof o === 'string') {
        options.value = JSON.parse(o);
    }
    if (options.value["length"] == undefined) {
        options.value = [];
    }
    const i = sessionStorage.getItem("cps-input");
    if (typeof i === 'string') {
        textinput.value = i;
    }
    refresh();
});

onMounted(() => {
    db_collapse = new Collapse(detailsBody.value as Element, {
        toggle: false
    });
});

onUnmounted(() => {
    sessionStorage.setItem("cps-input", textinput.value);
    sessionStorage.setItem("cps-filters", JSON.stringify(filters.value));
    sessionStorage.setItem("cps-options", JSON.stringify(options.value));
});

</script>
