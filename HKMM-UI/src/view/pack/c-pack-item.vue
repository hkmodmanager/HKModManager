
<template>
    <div class="card mb-2" :id="`modpack-${package.displayName.replaceAll(' ', '')}`">
        <div class="d-flex g-0">
            <div class="flex-shrink-0">
                <img v-if="package.icon" class="card-img-top" :src="getIcon()" width="128" height="128" />
            </div>
            <div class="flex-grow-1 d-flex flex-column">
                <div class="flex-shrink-0 d-flex">
                    <div class="card-body flex-grow-1">
                        <h5 class="card-title">{{ package.displayName }}</h5>
                        <div class="card-text" copyable>{{ desc }}</div>

                        <div class="card-text">
                            <small class="text-muted">{{ $t("modpack.status.title") }}</small>
                            <template v-if="local != undefined">
                                <small class="text-success" v-if="local.enabled">{{ $t("modpack.status.enabled") }}</small>
                                <small class="text-danger" v-else>{{ $t("modpack.status.disabled") }}</small>
                            </template>
                            <small v-else class="text-danger">{{ $t("modpack.status.uninstalled") }}</small>
                        </div>
                        <div class="card-text"><small class="text-muted">{{ $t("modpack.version") }} {{ package.version
                        }}</small></div>
                        <div class="card-text" v-if="package.tags.length > 0">
                            <small class="text-muted">{{ $t("modpack.tags.title") }} {{ package.tags
                                .map(x => $t("modpack.tags." + x)).join(' ') }}</small>
                        </div>
                        <div class="card-text" v-if="days != undefined"><small class="text-muted">
                                {{ $t('modpack.lastUpdate', {
                                    days: days
                                }) }}
                            </small></div>
                    </div>
                    <div class="flex-shrink-0 d-flex flex-column-reverse">
                        <button class="btn btn-primary mt-1" @click="CollapseBody()">{{ $t("modpack.details") }} <i
                                class="bi bi-arrow-down" /></button>


                        <template v-if="local != undefined">
                            <button class="btn btn-danger mt-1" 
                                :disabled="!canUninstall()"
                                @click="local.uninstall()">{{
                                $t("modpack.operate.uninstall")
                            }}</button>
                            <template v-if="package.allowToggle">
                                <button v-if="!local.enabled" class="btn btn-primary mt-1" @click="setEnabled(true)">{{
                                    $t("modpack.operate.enable") }}</button>
                                <button v-else class="btn btn-primary mt-1" @click="setEnabled(false)">{{
                                    $t("modpack.operate.disable")
                                }}</button>
                            </template>
                            <button v-if="false" 
                            :disabled="!package.allowInstall"
                            class="btn btn-warning mt-1">{{ $t("modpack.operate.update")
                            }}</button>
                        </template>
                        <button v-else class="btn btn-primary mt-1" 
                        :disabled="!package.allowInstall"
                            @click="package.install()">{{
                            $t("modpack.operate.install")
                        }}</button>
                    </div>

                </div>
                <div class="collapse m-1" style="display: none" ref="bodyCollapse">
                    <template v-if="showDetails">
                        <hr class="hr-default" />

                        <div v-if="package.repository != undefined">
                            {{ $t("modpack.repo") }}
                            <a :href="package.repository">{{ package.repository }}</a>
                        </div>
                        <div v-if="package.authors.length > 0">
                            {{ $t("modpack.author") }}
                            <span copyable>{{ package.authors.join(';') }}</span>
                        </div>

                        <div v-if="package.dependencies.length > 0">
                            <hr />
                            <h4>{{ $t("modpack.dep.title") }}</h4>
                            <DiList :mods="package.dependencies" />
                        </div>

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
import { PackageDisplay, LocalPackageProxy } from 'core';
import { getCurrentInstance, nextTick, onBeforeMount, onMounted, onUnmounted, ref } from 'vue';
import { Collapse } from 'bootstrap';

const bodyCollapse = ref<HTMLDivElement>();

let local: LocalPackageProxy | undefined = undefined;
let days: string | undefined = undefined;
let desc: string | undefined = undefined;
let collapse: Collapse | undefined = undefined;
const showDetails = ref(false);

const { ctx: _this }: any = getCurrentInstance()

const props = defineProps<{
    package: PackageDisplay
}>();

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
    else return `${Math.floor(days / 365)} years`;
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
    _this.$forceUpdate();
}

function canUninstall() {
    if(!props.package.allowUninstall) return false;
    if(local?.info != undefined && !local.info.allowUninstall) return false;
    return true;
}

onBeforeMount(() => {
    local = LocalPackageProxy.getMod(props.package.name);
    days = getLastUpdate();
    desc = commonMarkdown.renderInline(props.package.description);
});

let updateTimer: any;

onMounted(() => {
    collapse = new Collapse(bodyCollapse.value as HTMLElement, {
        toggle: false
    });

    updateTimer = setInterval(() => {
        local = LocalPackageProxy.getMod(props.package.name);
        _this.$forceUpdate();
    }, 500);
});

onUnmounted(() => {
    if (updateTimer != undefined) {
        clearInterval(updateTimer);
        updateTimer = undefined;
    }
});

</script>
