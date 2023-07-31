
<template>
    <div class="card mb-2" v-if="packItem" :style="{
        'background-color': (packItem.isImportant && local == undefined) ? 'var(--bs-warning-border-subtle)' : ''
    }" :id="`modpack-${packItem.displayName.replaceAll(' ', '')}`">
        <div class="d-flex g-0">
            <div class="flex-shrink-0 m-3" style="max-height: 100%; max-width: 100%; width: 128px;">
                <img v-if="packItem.icon" class="card-img" :src="getIcon()" ref="packIconS" />
            </div>
            <div class="flex-grow-1 d-flex flex-column">
                <div class="flex-shrink-0 d-flex">
                    <div class="card-body flex-grow-1">
                        <h5 class="card-title">{{ packItem.displayName }}
                            <span v-if="!hasOption('HIDE_MOD_ALIAS') &&
                                $i18n.locale == 'zh'" >
                                {{ getAlias(packItem.name) }}
                            </span>
                            <strong v-if="hasOption('SHOW_MOD_SHORT_NAME') 
                                && shortName != packItem.name.toUpperCase()">
                                ({{ shortName }})
                            </strong>
                            <strong v-if="packItem.isImportant && local == undefined" class="text-danger">
                                ({{ $t("modpack.tips.importantUninstalled") }})
                            </strong>
                        </h5>
                        <div class="card-text" copyable v-html="desc"></div>

                        <div class="card-text">
                            <small class="text-muted">{{ $t("modpack.status.title") }}</small>
                            <template v-if="local != undefined">
                                <small class="text-success" v-if="local.enabled">{{ $t("modpack.status.enabled") }}</small>
                                <small class="text-danger" v-else>{{ $t("modpack.status.disabled") }}</small>
                            </template>
                            <small v-else class="text-danger">{{ $t("modpack.status.uninstalled") }}</small>
                        </div>
                        <div class="card-text"><small class="text-muted">{{ $t("modpack.version") }} {{ curVer
                        }}
                                <span class="text-warning" v-if="newerVer != undefined"><i class="bi bi-arrow-right" /> {{
                                    newerVer }}</span>
                            </small></div>
                        <div class="card-text" v-if="packItem.tags.length > 0">
                            <small class="text-muted">{{ $t("modpack.tags.title") }} {{ packItem.tags
                                .map(x => $t("modpack.tags." + x)).join(' ') }}</small>
                        </div>
                        <div class="card-text" v-if="days != undefined && getLastUpdate() != ''"><small class="text-muted">
                                {{ $t('modpack.lastUpdate', {
                                    days: days
                                }) }}
                            </small></div>
                    </div>
                    <div class="flex-shrink-0 d-flex flex-column-reverse">
                        <button class="btn btn-primary mt-1" @click="CollapseBody()">{{ $t("modpack.details") }} <i
                                class="bi bi-arrow-down" /></button>


                        <template v-if="local != undefined">
                            <button class="btn btn-danger mt-1" :disabled="!canUninstall()" @click="local.uninstall()">{{
                                $t("modpack.operate.uninstall")
                            }}</button>
                            <template v-if="packItem.allowToggle">
                                <button v-if="!local.enabled" class="btn btn-primary mt-1" @click="setEnabled(true)">{{
                                    $t("modpack.operate.enable") }}</button>
                                <button v-else class="btn btn-primary mt-1" @click="setEnabled(false)">{{
                                    $t("modpack.operate.disable")
                                }}</button>
                            </template>
                            <button v-if="newerVer != undefined" :disabled="!packItem.allowInstall" @click="clickUpdate()"
                                class="btn btn-warning mt-1">{{ $t("modpack.operate.update")
                                }}</button>
                        </template>
                        <button v-else class="btn btn-primary mt-1" :disabled="!packItem.allowInstall"
                            @click="packItem.install(true)">{{
                                $t("modpack.operate.install")
                            }}</button>
                    </div>

                </div>
                <div class="collapse m-1" style="display: none" ref="bodyCollapse">
                    <template v-if="showDetails">
                        <template v-if="fullIcon">
                            <hr class="hr-default" />
                            <img :src="fullIcon" class="card-img" style="max-height: 20em" />
                        </template>
                        <hr class="hr-default" />

                        <div v-if="packItem.repository != undefined">
                            {{ $t("modpack.repo") }}
                            <a :href="packItem.repository">{{ packItem.repository }}</a>
                        </div>
                        <div v-if="packItem.authors.length > 0">
                            {{ $t("modpack.author") }}
                            <span copyable>{{ packItem.authors.join(';') }}</span>
                        </div>

                        <div v-if="packItem.dependencies.length > 0">
                            <hr />
                            <h4>{{ $t("modpack.dep.title") }}</h4>
                            <DiList :mods="getDependencies()" />
                        </div>
                        <hr />
                    </template>
                </div>

            </div>
        </div>
        <!--Package Details-->

    </div>
</template>

<script setup lang="ts">
import DiList from "../mods/c-mods-di-list.vue";
import { commonMarkdown } from '@/core/utils/utils';
import { PackageDisplay, LocalPackageProxy, getRootPackageProvider } from 'core';
import { computed, nextTick, onBeforeMount, onMounted, onUnmounted, ref, shallowRef, triggerRef } from 'vue';
import { Collapse } from 'bootstrap';
import { hasOption } from '@/core/settings';
import { getShortName } from '@/core/utils/utils'
import { useI18n } from "vue-i18n";
import { mdConvertURL } from "@/core/utils/urlParser";

const bodyCollapse = ref<HTMLDivElement>();
const packIconS = ref<HTMLImageElement>();
const i18n = useI18n();

let local: LocalPackageProxy | undefined = undefined;
let days: string | undefined = undefined;
let desc: string | undefined = undefined;
let collapse: Collapse | undefined = undefined;
let newerVer: string | undefined = undefined;
let curVer: string | undefined = undefined;
let fullIcon = ref<string>();
const showDetails = ref(false);

const props = defineProps<{
    package: PackageDisplay
}>();

const packItem = shallowRef<PackageDisplay>();

const shortName = computed(() => {
    return getShortName(props.package.name);
});

function getIcon() {
    if (!props.package.icon) return undefined;
    return props.package.icon.replace('internal-icons://', "../icons/")
}

function getLastUpdate() {
    const span = Date.now() - props.package.date;
    const days = span / 1000 / 3600 / 24;
    if (days < 7) return `${days} days`;
    else if (days < 31) return `${Math.floor(days / 7)} weeks`;
    else if (days < 365) return `${Math.floor(days / 31)} months`;
    else if (days / 365 < 10) return `${Math.floor(days / 365)} years`;
    else return "";
}

function CollapseBody() {
    if (collapse == undefined || bodyCollapse.value == undefined) return;
    bodyCollapse.value.style.display = "";
    showDetails.value = true;
    nextTick(() => {
        collapse?.toggle();
    });
}

function setEnabled(e: boolean) {
    if (local == undefined) return;
    local.enabled = e;
}

function canUninstall() {
    if (!props.package.allowUninstall) return false;
    if (local?.info != undefined && !local.info.allowUninstall) return false;
    return true;
}

function getDependencies() {
    const result: string[] = [];
    const root = getRootPackageProvider();
    for (const name of props.package.dependencies) {
        const pack = root.getPackage(name);
        if (pack != undefined) {
            result.push(pack.displayName);
        } else {
            result.push(name);
        }
    }
    return result;
}

onBeforeMount(async () => {
    packItem.value = props.package;
    days = getLastUpdate();
    desc = commonMarkdown.renderInline(
        mdConvertURL(props.package.description)
    );
    update();
});

function update() {
    local = LocalPackageProxy.getMod(props.package.name);
    curVer = props.package.version;
    newerVer = undefined;
    if (local) {
        if (local.info.version !== curVer) {
            newerVer = curVer;
            curVer = local.info.version;
        }
    }
    triggerRef(packItem);
}

function clickUpdate() {
    update();
    if(!local) {
        props.package.install(true);
        return;
    }
    props.package.install(local?.enabled ?? true);
}

function getAlias(name: string) {
    const key = `mods.nameAlias.${name.toLowerCase().replaceAll(' ', '')}`;
    const result = i18n.t(key, [], {
        fallbackWarn: false,
        missingWarn: false
    });
    return result == key ? "" : `(${result})`;
}

let updateTimer: any;

onMounted(() => {
    collapse = new Collapse(bodyCollapse.value as HTMLElement, {
        toggle: false
    });
    if (packIconS.value) {
        (async function () {
            const img = await new Promise<HTMLImageElement>((resolve) => {
                const el = packIconS.value as HTMLImageElement;
                if (el.complete) {
                    resolve(el);
                } else {
                    el.onload = () => {
                        resolve(el);
                    };
                }
            });
            if(img.width == 0 || img.height == 0) return;
            const a = img.width / img.height;
            if(a > 2) {
                fullIcon.value = img.src;
            }
        })();
    }

    updateTimer = setInterval(() => {
        update();
    }, 500);
});

onUnmounted(() => {
    if (updateTimer != undefined) {
        clearInterval(updateTimer);
        updateTimer = undefined;
    }
});

</script>
