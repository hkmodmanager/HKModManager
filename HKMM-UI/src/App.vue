<template>
  <div class="d-flex">
    <!--Nav-->
    <div class="
      d-inline-flex
      flex-column
      p-3
      app-nav
      fill-height
      flex-shrink-0
    ">
      <RouterLink to="/about" class="nav-link">
        <h3>
          HKMM
          <span :style="{ 'font-size': '1rem' }">v{{ `${appVersion.major}.${appVersion.minor}.${appVersion.patch}`
          }}</span>
        </h3>
      </RouterLink>
      <a v-if="!isRelease && !isPreRelease" :style="{ 'font-size': '0.6rem' }" class="badge bg-warning"
        :title="buildMetadata.headCommit"
        :href="`https://github.com/hkmodmanager/HKModManager/commit/${buildMetadata.headCommit}`">Alpha-{{
          buildMetadata.headCommit.substring(0, 7)
        }}</a>
      <a v-else-if="isPreRelease" :style="{ 'font-size': '0.6rem' }" class="badge bg-success" :title="preversion">{{
        preversion
      }}</a>
      <div class="d-flex" :style="{ 'fontSize': '1.5rem' }">
        <a class="bi bi-github p-2 link-auto" title="Github" href='https://github.com/hkmodmanager/HKModManager'></a>
        <a class="bi bi-discord p-2 link-auto" title="HK Modding" href="https://discord.gg/4Zhdg7QyPS"></a>
        <a class="bi bi-code-slash p-2 link-auto" title="Dev Tools" @click="remote.getCurrentWebContents().openDevTools()"
          href="javascript:;"></a>
      </div>

      <hr />
      <ul class="nav nav-pnavills flex-column mb-auto">
        <navitem viewpath="/pack"><i class="bi bi-cloud-download"></i> {{ $t("tabs.allpacks") }}</navitem>
        <li class="nav-item">
          <a class="nav-link text-nav-item-auto" @click="taskNavGroupCollapse?.toggle()" href="javascript:;">
            <i class="bi bi-list-task"></i> {{ $t("tabs.tasks.title") }}
          </a>
          <div class="list-group nav-list collapse" ref="tasksNavGroup">
            <navitem viewpath="/tasks/all" class="list-group-item" compare-path>{{ $t("tabs.tasks.all") }}
            </navitem>
            <navitem viewpath="/tasks/running" class="list-group-item" compare-path>{{ $t("tabs.tasks.running") }}
            </navitem>
            <navitem viewpath="/tasks/done" class="list-group-item" compare-path>{{ $t("tabs.tasks.done") }}
            </navitem>
            <navitem viewpath="/tasks/failed" class="list-group-item" compare-path>{{ $t("tabs.tasks.failed") }}
            </navitem>

          </div>
        </li>
      </ul>

      <hr />
      <ul class="nav nav-pnills flex-column">
        <li class="nav-item">
          <a class="nav-link text-nav-item-auto" href="javascript:;" @click="showLanguageModal()">
            <i class="bi bi-globe"></i> {{ $t("c_languages") }}
          </a>
        </li>
        <!--- 
        <li class="nav-item">
          <a class="nav-link text-nav-item-auto" href="javascript:;" @click="useDarkMode(true)" v-if="!isDarkMode()">
            <i class="bi bi-moon"></i> {{ $t("c_theme_dark") }}
          </a>
          <a class="nav-link text-nav-item-auto" href="javascript:;" @click="useDarkMode(false)" v-else>
            <i class="bi bi-lightbulb"></i> {{ $t("c_theme_light") }}
          </a>
        </li> -->

        <navitem viewpath="/settings"><i class="bi bi-gear"></i> {{ $t("tabs.settings") }}</navitem>
      </ul>
    </div>
    <!--Body-->
    <div class="flex-grow-1 app-body">
      <ModalUpdate />
      <router-view></router-view>
    </div>
    <!--Modals-->
    <ModalBox ref="languageModal" :title="$t('c_language_title')">
      <select class="form-select" ref="modssavepathmode" v-model="current_language">
        <option v-for="(i18n, l_name) in AllNamedLanaguages" :key="l_name" :value="i18n">{{ l_name }}</option>
      </select>
      <template #footer>
        <button class="btn btn-primary w-100" @click="applyLanguage">{{ $t('c_language_apply') }}</button>
      </template>
    </ModalBox>
  </div>
</template>

<style>
body,
.fill-height,
#app {
  min-height: 100vh;
  max-height: 100vh;
}

[notcopyable] {
  user-select: none;
}

[copyable],
.popover-body {
  user-select: text;
}

.nav-list {
  --bs-list-group-bg: var(--bs-body-bg);
  --bs-list-group-item-padding-y: 0em;
}

.h-100 {
  height: 100%;
}

.app-body {
  max-height: 100vh;
  overflow: auto;
  background-color: var(--bs-body-bg);
}

.app-nav {
  background-color: var(--bs-body-bg);
  border-right: var(--bs-border-width) solid var(--bs-border-color);
  overflow: auto;
}

html {
  height: -webkit-fill-available;
}
</style>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Collapse } from 'bootstrap';
import navitem from "./components/nav-item.vue";

import ModalBox from "./components/modal-box.vue";
import { AllNamedLanaguages } from "./lang/langs";
import { store } from "./core/settings";
//import { checkUpdate, installUpdate } from "./core/updater";
import * as remote from "@electron/remote";

import { appVersion } from "./core/remoteCache";
import ModalUpdate from "./view/update/modal-update.vue";
import { buildMetadata } from "./core/exportGlobal";
import { useI18n } from "vue-i18n";



const i18n = useI18n();
const current_language = ref(i18n.locale.value);

const tasksNavGroup = ref<HTMLElement>();
const languageModal = ref<typeof ModalBox>();
const preversion = appVersion.prerelease.join('.');
const isRelease = buildMetadata.isTag;
const isPreRelease = appVersion.prerelease.length > 0;

let taskNavGroupCollapse: Collapse | undefined = undefined;

onMounted(() => {
  taskNavGroupCollapse = new Collapse(tasksNavGroup.value as Element);
});

console.log(appVersion);

function applyLanguage() {
  console.log(current_language);
  i18n.locale.value = current_language.value;
  store.set('language', current_language.value);
  languageModal.value?.getModal().hide();
}

function showLanguageModal() {
  languageModal.value?.getModal().show();
}
</script>
