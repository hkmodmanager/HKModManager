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
        <span :style="{ 'font-size': '1rem' }">v{{ getAppVersion() }}</span>
      </h3>
      </RouterLink>
      <a v-if="!isRelease() && !isPreRelease()" :style="{ 'font-size': '0.6rem' }" class="badge bg-warning" :title="getCommitSHA()"
        :href="`https://github.com/hkmodmanager/HKModManager/commit/${getCommitSHA()}`">Alpha-{{
          getShortCommitSHA()
        }}</a>
      <a v-else-if="isPreRelease()" :style="{ 'font-size': '0.6rem' }" class="badge bg-success" :title="getPreVersion()"
        >{{
          getPreVersion()
        }}</a>
      <div class="d-flex" :style="{ 'fontSize': '1.5rem' }">
        <a class="bi bi-github p-2 link-auto" title="Github" href='https://github.com/hkmodmanager/HKModManager'></a>
        <a class="bi bi-discord p-2 link-auto" title="HK Modding" href="https://discord.gg/4Zhdg7QyPS"></a>
        <a class="bi bi-code-slash p-2 link-auto" title="Dev Tools" @click="openDevTools()" href="javascript:;"></a>
      </div>

      <hr />
      <ul class="nav nav-pnavills flex-column mb-auto">
        <navitem viewpath="/localmods/all" compare-path><i class="bi bi-hdd"></i> {{ $t("tabs.localmods") }}</navitem>
        <div class="list-group nav-list">
          <navitem viewpath="/localmods/requireUpdate" textcolor="warning" compare-path v-if="isRequireUpdateMods()">
            &nbsp;{{ $t("tabs.requireUpdateMods") }}</navitem>
        </div>
        
        <navitem viewpath="/allmods"><i class="bi bi-cloud-download"></i> {{ $t("tabs.allmods") }}</navitem>
        <navitem viewpath="/new" v-if="!enableOption('CUSTOM_MODLINKS')"><i class="bi bi-cloud-plus"></i> {{ $t("tabs.whatsnew") }}</navitem>

        <li class="nav-item">
          <a class="nav-link text-nav-item-auto" @click="toggleNavTasks()" href="javascript:;">
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
        
        <navitem viewpath="/modgroups"><i class="bi bi-collection"></i> {{ $t("tabs.modgroups") }}</navitem>
        <navitem viewpath="/api"><i class="bi bi-box"></i> {{ $t("tabs.api") }} <i
            class="bi bi-exclamation-diamond text-warning" v-if="!isInstalledVaildAPI()"></i></navitem>
      </ul>

      <hr />
      <ul class="nav nav-pnills flex-column">
        <li class="nav-item">
          <a class="nav-link text-nav-item-auto" href="javascript:;" @click="openModalLanguage">
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
    <ModalBox ref="modal_language" :title="$t('c_language_title')">
      <select class="form-select" ref="modssavepathmode" v-model="current_language">
        <option v-for="(i18n, l_name) in getAllNamedLanguage()" :key="l_name" :value="i18n">{{ l_name }}</option>
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

<script lang="ts">
import "@/view/view-allmods.vue";
import "@/view/view-api.vue";
import "@/view/view-error.vue";
import "@/view/view-localmods.vue";
import "@/view/view-modgroups.vue";
import "@/view/view-settings.vue";
import "@/view/view-tasks.vue";

import { defineComponent } from "vue";
import { Collapse } from 'bootstrap';
import navitem from "./components/nav-item.vue";
import { getAPIVersion } from '@/core/apiManager';
import { getRequireUpdateModsSync } from "./core/modManager";
import { getModLinks, provider } from "./core/modlinks/modlinks";
import ModalBox from "./components/modal-box.vue";
import { AllNamedLanaguages } from "./lang/langs";
import { hasOption, SettingOptions, store } from "./core/settings";
//import { checkUpdate, installUpdate } from "./core/updater";
import * as remote from "@electron/remote";

import { appVersion } from "./core/remoteCache";
import ModalUpdate from "./view/update/modal-update.vue";
import { buildMetadata } from "./core/exportGlobal";

export default defineComponent({
  data: function () {
    return {
      current_language: this.$i18n.locale,
      hasUpdate: false
    };
  },
  components: {
    navitem,
    ModalBox,
    ModalUpdate
  },
  methods: {
    toggleNavTasks() {
      const group = this.$refs.tasksNavGroup as Element;
      const col = new Collapse(group);
      col.toggle();
    },
    getAllNamedLanguage() {
      return AllNamedLanaguages;
    },
    getAppVersion() {
      console.dir(appVersion);
      return `${appVersion.major}.${appVersion.minor}.${appVersion.patch}`;
    },
    isRelease() {
      return buildMetadata.isTag;
    },
    isPreRelease() {
      return appVersion.prerelease.length > 0;
    },
    getPreVersion() {
      return appVersion.prerelease.join('.');
    },
    getBuildMeta() {
      return buildMetadata;
    },
    enableOption(option: SettingOptions) {
      return hasOption(option);
    },
    getCommitSHA() {
      return buildMetadata.headCommit;
    },
    getShortCommitSHA() {
      return this.getCommitSHA().substring(0, 7);
    },
    openModalLanguage() {
      this.current_language = this.$i18n.locale;
      const modal = this.$refs.modal_language as any;
      modal.getModal().show();
    },
    openDevTools() {
      remote.getCurrentWebContents().openDevTools();
    },
    applyLanguage() {
      console.log(this.current_language);
      if (this.$root) this.$root.$i18n.locale = this.current_language;
      store.set('language', this.current_language);
      const modal = this.$refs.modal_language as any;
      modal.getModal().hide();
    },
    isInstalledVaildAPI() {
      return getAPIVersion() >= 72;
    },
    isRequireUpdateMods() {
      if (provider?.isOffline()) return false;
      return getRequireUpdateModsSync().length > 0;
    },
    useDarkMode(e: boolean) {
      document.body.setAttribute("data-bs-theme", e ? "dark" : "light");
      store.set('useDarkMode', e);
      this.$forceUpdate();
    },
    isDarkMode() {
      return document.body.getAttribute("data-bs-theme") == "dark";
    }
  },
  updated() {
    if (!provider.hasData()) {
      getModLinks().then(() => {
        this.$forceUpdate();
      });
    }
  },
  mounted() {
    if (!provider.hasData()) {
      getModLinks().then(() => {
        this.$forceUpdate();
      });
    }

  }
});
</script>
