<template>
    <div class="task-item accordion-item text-black p-1" v-if="groupItem">
        <h2 class="accordion-header">
            <button class="accordion-button collapsed" @click="toggleBody()">
                <div class="d-flex">
                    <div class="p-1">
                        {{ groupItem.displayName }}
                    </div>
                    <span v-if="isCurrent()" class="badge bg-success mt-2">
                        {{ $t("groups.current") }}
                    </span>
                </div>
            </button>

        </h2>
        <div class="accordion-collapse collapse" ref="body">
            <div class="accordion-body">
                <!--accordion body-->
                <div class="w-100 d-flex p-1">


                    <!----<button class="btn btn-primary" @click="rename(groupctrl as ModGroupController)">Rename</button>-->
                    <button class="btn btn-primary flex-grow-1" @click="setAsCurrent()">{{
                        $t("groups.use")
                    }}</button>

                    <button class="btn btn-danger" @click="$emit('onshowdelete', groupItem.name)">
                        <i class="bi bi-trash3"></i></button>
                </div>
                <div>
                    <div class="accordion">
                        <div class="accordion-item p-1" v-for="(mod) in getMods()" :key="mod">
                            <div class="input-group">
                                <input :class="`form-control text-${isInstalled(mod) ? 'success' : 'danger'}`"
                                    :value="mod + ` (${$t(isInstalled(mod) ? 'groups.ready' : 'groups.unready')})`" readonly
                                    disabled />
                                <a class="btn btn-danger" @click="removeMod(mod)">
                                    <i class="bi bi-x"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                <!--accordion body end-->
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { onBeforeMount, ref, shallowRef, triggerRef } from 'vue';
import { Collapse } from 'bootstrap';
import { LocalCustomPackagesProviderProxy, LocalPackageProxy, PackageDisplay } from 'core';
const props = defineProps<{
    item: PackageDisplay
}>();

const $emit = defineEmits(['onshowdelete', 'onshowrename', 'onshowexport']);
const groupItem = shallowRef<PackageDisplay>();

const body = ref<Element>();

function toggleBody() {
    const tgb = new Collapse(body.value as Element);
    tgb.toggle();
}

function setAsCurrent() {
    LocalCustomPackagesProviderProxy.switchTo(props.item)
        .then(() => {
            triggerRef(groupItem);
        });
}

function isCurrent() {
    return LocalCustomPackagesProviderProxy.current.name == props.item.name;
}

function getMods() {
    return props.item.dependencies;
}

function isInstalled(mod: string) {
    return LocalPackageProxy.getMod(mod) != undefined;
}



onBeforeMount(() => {
    groupItem.value = props.item;
});

function removeMod(mod: string) {
    const pack = LocalPackageProxy.getMod(mod);
    if (!pack) return;
    pack.enabled = false;
    triggerRef(groupItem);
}

</script>