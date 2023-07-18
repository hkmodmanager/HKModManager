<template>
    <template v-for="(mod, i) in modsArray.slice(0, showCount)" :key="i">
        <h6 copyable>
            <a :style="{ 'textDecoration': 'none' }" @click="anchorMod(mod)" href="javascript:;">{{
                mod
            }}</a>
            <template v-if="isLocal">
                <span v-if="isUsed(mod)" class="text-success" notcopyable>
                    ({{ $t("modpack.status.enabled") }})
                </span>
            </template>
            <template v-else>
                <span v-if="isInstallMod(mod)" class="text-success" notcopyable>
                    ({{ $t("modpack.status.installed") }})
                </span>
            </template>
        </h6>
    </template>
    <template v-if="modsArray.length >= showCount">
        <div :class="['collapse']" ref="depOnThisBody">
            <h6 v-for="(mod, i) in modsArray.slice(showCount)" :key="i" copyable>
                <a :style="{ 'textDecoration': 'none' }" @click="anchorMod(mod)" href="javascript:;">{{
                    mod
                }}</a>
                <template v-if="isLocal">
                    <span v-if="isUsed(mod)" class="text-success" notcopyable>
                        ({{ $t("modpack.status.enabled") }})
                    </span>
                </template>
                <template v-else>
                    <span v-if="isInstallMod(mod)" class="text-success" notcopyable>
                        ({{ $t("modpack.status.installed") }})
                    </span>
                </template>
            </h6>
        </div>
        <a :style="{ 'textDecoration': 'none' }" @click="toggleCollapse('depOnThisBody')" href="javascript:;">
            ...{{ $t(isCollapseHide('depOnThisBody') ? 'expand' : 'collapse') }}
        </a>
    </template>
</template>

<script lang="ts">
import { Collapse } from 'bootstrap';
import { defineComponent } from 'vue';
import { LocalPackageProxy } from 'core';

export default defineComponent({
    data() {
        return {

        }
    },
    methods: {
        anchorMod(name: string) {
            const rn = `modpack-${name.replaceAll(' ', '')}`;
            const dom = document.getElementById(rn);
            if (!dom) return;
            dom.scrollIntoView();
        },
        isUsed(name: string) {
            const lm = LocalPackageProxy.getMod(name);
            if (!lm) return false;
            return lm.enabled;
        },
        isInstallMod(name: string) {
            const lm = LocalPackageProxy.getMod(name);
            return lm != undefined;
        },
        toggleCollapse(name: string) {
            this.getCollapse(name).toggle();
        },
        getCollapse(name: string) {
            return new Collapse(this.$refs[name] as Element);
        },
        isCollapseHide(name: string) {
            const el = this.$refs[name] as Element;
            if (!el) return false;
            return el.classList.contains('collapse') && !el.classList.contains('collapsing') && !el.classList.contains('show');
        }
    },
    computed: {
        modsArray() {
            return this.mods as string[];
        },
        showCount() {
            return this.count ?? 8;
        }
    },
    props: {
        mods: Array,
        isLocal: Boolean,
        count: Number
    }
});
</script>
