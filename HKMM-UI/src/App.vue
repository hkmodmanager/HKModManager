<template>
  <div class="d-flex">
    <!--Nav-->
    <div class="
      d-inline-flex
      flex-column
      p-3
      text-white
      bg-dark
      fill-height
      flex-shrink-0
    ">
      <h3>
        HKMM 
        <span v-if="isRelease()" :style="{ 'font-size': '1rem' }">v{{ getAppVersion() }}</span>
        <span v-else :style="{ 'font-size': '0.6rem' }" class="badge bg-success" :title="getCommitSHA()">Beta: {{ getShortCommitSHA() }}</span>
      </h3>
      <div class="d-flex" :style="{ 'fontSize': '1.5rem' }">
        <a class="bi bi-github p-2 link-light" @click="openLink('https://github.com/HKLab/HKModManager')" href="javascript:;"></a>
        <a class="bi bi-discord p-2 link-light" @click="openLink('https://discord.gg/4Zhdg7QyPS')" href="javascript:;"></a>
        <a class="bi bi-wrench-adjustable-circle p-2 link-light" @click="openDevTools()" href="javascript:;"></a>
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
          <a class="nav-link text-white" @click="toggleNavTasks()" href="javascript:;">
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
            class="bi bi-exclamation-diamond text-warning" v-if="!isInstalledAPI()"></i></navitem>
      </ul>

      <hr />
      <ul class="nav nav-pnills flex-column">
        <li class="nav-item">
          <a class="nav-link text-white" href="javascript:;" @click="openModalLanguage">
            <i class="bi bi-globe"></i> {{ $t("c_languages") }}
          </a>
        </li>
        <RequireExpmode>
          <navitem viewpath="/plugins"><i class="bi bi-puzzle"></i> {{ $t("tabs.plugins") }}</navitem>
        </RequireExpmode>
        <navitem viewpath="/settings"><i class="bi bi-gear"></i> {{ $t("tabs.settings") }}</navitem>

      </ul>
    </div>
    <!--Body-->
    <div class="text-white flex-grow-1 app-body">
      <ModalUpdate />
      <router-view></router-view>
    </div>
    <ModalBox ref="modal_language" :title="$t('c_language_title')">
      <select class="form-select bg-dark text-white" ref="modssavepathmode" v-model="current_language">
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

[copyable], .popover-body {
  user-select: text;
}

.nav-list {
  --bs-list-group-bg: var(--bs-dark);
  --bs-list-group-item-padding-y: 0em;
}

.h-100 {
  height: 100%;
}

.app-body {
  max-height: 100vh;
  overflow: auto;
}

html {
  height: -webkit-fill-available;
}
</style>

<script lang="ts">
import { defineComponent } from "vue";
import { Collapse } from 'bootstrap';
import navitem from "./components/nav-item.vue";
import { getAPIVersion } from '@/renderer/apiManager'
import { getRequireUpdateModsSync } from "./renderer/modManager";
import { getModLinks, modlinksCache } from "./renderer/modlinks/modlinks";
import ModalBox from "./components/modal-box.vue";
import { AllNamedLanaguages } from "./lang/langs";
import { store } from "./renderer/settings";
//import { checkUpdate, installUpdate } from "./renderer/updater";
import { remote } from "electron";

import "./renderer/plugins"
import RequireExpmode from "./components/require-expmode.vue";
import { appVersion } from "./renderer/remoteCache";
import ModalUpdate from "./view/update/modal-update.vue";

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
    RequireExpmode,
    ModalUpdate
},
  methods: {
    toggleNavTasks() {
      const group = this.$refs.tasksNavGroup as Element;
      const col = new Collapse(group);
      col.toggle();
    },
    openLink(link: string) {
      remote.shell.openExternal(link);
    },
    getAllNamedLanguage() {
      return AllNamedLanaguages;
    },
    getAppVersion() {
      return appVersion;
    },
    isRelease() {
      return true;
    },
    getCommitSHA() {
      return "9d743e7: feat: search for mods by short name";
    },
    getShortCommitSHA() {
      return "9d743e7";
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
    isInstalledAPI() {
      return getAPIVersion() > 0;
    },
    isRequireUpdateMods() {
      return getRequireUpdateModsSync().length > 0;
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
    /*checkUpdate().then((val) => {
      if (val) {
        const result = remote.dialog.showMessageBoxSync(remote.getCurrentWindow(), {
          message: `${this.$t('hasUpdate')} (v${appVersion} -> v${val[1]})`,
          type: 'question',
          buttons: [this.$t('downloadUpdate'), 'Cancel'],
          cancelId: 1
        });
        if (result == 0) {
          installUpdate();
        }
        this.$forceUpdate();
      }
    });*/
  }
});
</script>
