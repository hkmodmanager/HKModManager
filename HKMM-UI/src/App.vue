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
      <h3>
        HKMM
        <span :style="{ 'font-size': '1rem' }">v{{ getAppVersion() }}</span>

      </h3>
      <a v-if="!isRelease()" :style="{ 'font-size': '0.6rem' }" class="badge bg-success" :title="getCommitSHA()"
        :href="`https://github.com/HKLab/HKModManager/commit/${getCommitSHA()}`">Alpha-{{
          getShortCommitSHA()
        }}</a>
      <div class="d-flex" :style="{ 'fontSize': '1.5rem' }">
        <a class="bi bi-github p-2 link-auto" title="Github" href='https://github.com/HKLab/HKModManager'></a>
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
        <li class="nav-item">
          <a class="nav-link text-nav-item-auto" href="javascript:;" @click="useDarkMode(true)" v-if="!isDarkMode()">
            <i class="bi bi-moon"></i> {{ $t("c_theme_dark") }}
          </a>
          <a class="nav-link text-nav-item-auto" href="javascript:;" @click="useDarkMode(false)" v-else>
            <i class="bi bi-lightbulb"></i> {{ $t("c_theme_light") }}
          </a>
        </li>

        <li class="nav-item">
          <a class="nav-link text-nav-item-auto" href="javascript:;" @click="exportDebugPackage"
            :title="$t('debugpack_desc')">
            <i class="bi bi-box-arrow-up-right"></i> {{ $t("c_exportLog") }}
          </a>
        </li>
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
import { getModLinks, modlinksCache } from "./core/modlinks/modlinks";
import ModalBox from "./components/modal-box.vue";
import { AllNamedLanaguages } from "./lang/langs";
import { store } from "./core/settings";
//import { checkUpdate, installUpdate } from "./core/updater";
import * as remote from "@electron/remote";

import { appVersion } from "./core/remoteCache";
import ModalUpdate from "./view/update/modal-update.vue";
import { br_build_zip } from "./core/bugReport";
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
      return appVersion;
    },
    isRelease() {
      return buildMetadata.isTag;
    },
    getBuildMeta() {
      return buildMetadata;
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
      if (modlinksCache?.offline) return false;
      return getRequireUpdateModsSync().length > 0;
    },
    exportDebugPackage() {
      br_build_zip().then(() => {
        remote.dialog.showMessageBoxSync(remote.getCurrentWindow(), {
          message: this.$t('debugpack_done'),
          title: this.$t('debugpack_done_title')
        });
      });

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
    if (!modlinksCache) {
      getModLinks().then(() => {
        this.$forceUpdate();
      });
    }
  },
  mounted() {
    if (!modlinksCache) {
      getModLinks().then(() => {
        this.$forceUpdate();
      });
    }

  }
});
</script>
