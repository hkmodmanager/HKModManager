<template>
    <template v-for="(mod, i) in modsArray.slice(0, showCount)" :key="i">
        <h6 copyable>
            <a :style="{ 'textDecoration': 'none' }" @click="anchorMod(mod.name)" href="javascript:;">{{
                mod.name
            }}</a>
            <template v-if="isLocal">
                <span v-if="isUsed(mod.name)" class="text-success" notcopyable>
                    ({{ $t("mods.enabled") }})
                </span>
            </template>
            <template v-else>
                <span v-if="isInstallMod(mod.name)" class="text-success" notcopyable>
                    ({{ $t("mods.depInstall") }})
                </span>
            </template>
        </h6>
    </template>
    <template v-if="modsArray.length >= showCount">
        <div :class="['collapse']" ref="depOnThisBody">
            <h6 v-for="(mod, i) in modsArray.slice(showCount)" :key="i" copyable>
                <a :style="{ 'textDecoration': 'none' }" @click="anchorMod(mod.name)" href="javascript:;">{{
                    mod.name
                }}</a>
                <template v-if="isLocal">
                    <span v-if="isUsed(mod.name)" class="text-success" notcopyable>
                        ({{ $t("mods.enabled") }})
                    </span>
                </template>
                <template v-else>
                    <span v-if="isInstallMod(mod.name)" class="text-success" notcopyable>
                        ({{ $t("mods.depInstall") }})
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
import { ModLinksManifestData } from '@/core/modlinks/modlinks';
import { getLocalMod, LocalModInstance } from '@/core/modManager';
import { Collapse } from 'bootstrap';
import { defineComponent } from 'vue';

export default defineComponent({
    data() {
        return {

        }
    },
    methods: {
        anchorMod(name: string) {
            const rn = `mod-download-${name.replaceAll(' ', '')}`;
            const dom = document.getElementById(rn);
            if (!dom) return;
            dom.scrollIntoView();
        },
        isUsed(name: string) {
            const lm = getLocalMod(name);
            if (!lm) return false;
            return lm.isEnabled();
        },
        isInstallMod(name: string) {
            return getLocalMod(name)?.isInstalled() ?? false;
        },
        toggleCollapse(name: string) {
            this.getCollapse(name).toggle();
        },
        getCollapse(name: string) {
            return new Collapse(this.$refs[name] as Element);
        },
        isCollapseHide(name: string) {
            const el = this.$refs[name] as Element;
            if(!el) return false;
            return el.classList.contains('collapse') && !el.classList.contains('collapsing') && !el.classList.contains('show');
        }
    },
    computed: {
        modsArray() {
            return this.mods as LocalModInstance[] | ModLinksManifestData[];
        },
        showCount() {
            return this.count ?? 8;
        }
    },
    props: {
        mods: Object,
        isLocal: Boolean,
        count: Number
    }
});
</script>
