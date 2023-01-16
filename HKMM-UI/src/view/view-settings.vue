<template>
  <form class="text-white">
    <HkpathChange></HkpathChange>
    <div class="p-3">
      <label class="form-label">{{ $t("settings.modsavepath.title") }}</label>
      <select class="form-select bg-dark text-white" @change="changeModsSavePathMode()" ref="modssavepathmode">
        <option value="appdir">{{ $t("settings.modsavepath.appdir") }}</option>
        <option value="userdir">{{ $t("settings.modsavepath.userdir") }}</option>
        <option value="gamepath">{{ $t("settings.modsavepath.gamepath") }}</option>
        <option value="custom">{{ $t("settings.modsavepath.custom") }}</option>
      </select>
      <div class="input-group p-1" v-if="shouldShowCustomModSavePath()">
        <input class="form-control bg-dark text-white" readonly disabled :value="getModPath()" />
        <a class="btn btn-success" @click="selectModsSavePath()"><i class="bi bi-folder2-open"></i></a>
      </div>
    </div>
    <!--Options-->
    <div class="p-3">
      <div class="form-check form-switch">
        <input class="form-check-input" type="checkbox" v-model="options" value="SHOW_DELETED_MODS" />
        <label class="form-check-label">{{ $t("settings.options.show_deleted_mods") }}</label>
      </div>
      <div class="form-check form-switch">
        <input class="form-check-input" type="checkbox" v-model="options" value="SHOW_MOD_SHORT_NAME" />
        <label class="form-check-label">{{ $t("settings.options.show_mod_short_name") }}</label>
      </div>
      <div class="form-check form-switch" v-if="$i18n.locale == 'zh'">
        <input class="form-check-input" type="checkbox" v-model="options" value="HIDE_MOD_ALIAS" />
        <label class="form-check-label">{{ $t("settings.options.hide_mod_alias") }}</label>
      </div>
      <div class="form-check form-switch">
        <input class="form-check-input" type="checkbox" v-model="options" value="ACCEPT_PRE_RELEASE" />
        <label class="form-check-label">{{ $t("settings.options.accept_pre_release") }}</label>
      </div>
      <div class="form-check form-switch">
        <input class="form-check-input" type="checkbox" v-model="options" value="ACCEPT_APLHA_RELEASE" />
        <label class="form-check-label">{{ $t("settings.options.accept_alpha_release") }}</label>
      </div>
      <div class="form-check form-switch">
        <input class="form-check-input" type="checkbox" v-model="options" value="VERIFY_MODS_AUTO" />
        <label class="form-check-label">{{ $t("settings.options.verify_mods_auto") }}</label>
      </div>
      <div v-if="$i18n.locale == 'zh'">
        <div class="form-check form-switch">
          <input class="form-check-input" type="checkbox" v-model="options" value="USE_GH_PROXY" />
          <label class="form-check-label">{{ $t("settings.options.use_gh_proxy") }}</label>
        </div>
        <hr />
        <div v-if="hasOption('USE_GH_PROXY')">
          <div class="form-group">
            <label class="form-label">{{
              $t("settings.mirror.githubmirror")
            }}<a class="bi bi-info-circle p-1 link-light" title="自行搭建" href="javascript:;"
                @click="openLink(`https://github.com/hunshcn/gh-proxy`)"></a></label>
            <mirrorlist key-name="mirror_github"></mirrorlist>
          </div>
        </div>
      </div>
      <!--div class="form-check form-switch">
          <input class="form-check-input" type="checkbox" v-model="options" value="FAST_DOWNLOAD" />
          <label class="form-check-label" :title="$t('settings.options.fastdownload_od')">{{
            $t("settings.options.fastdownload")
          }}</label>
      </div-->
    </div>
    <hr />
    <!--CDN-->
    <div class="p-3">
      <h3 class="form-label">{{ $t("settings.cdn.title") }}</h3>
      <CCdnRadio value="GITHUB_RAW" :displayname='$t("settings.cdn.githubraw")' v-model:cdnProp="cdn"></CCdnRadio>
      <CCdnRadio value="SCARABCN" :displayname='$t("settings.cdn.clazex")' v-model:cdnProp="cdn">
        <a class="bi bi-info-circle p-1 link-light" data-bs-container="body" data-bs-toggle="popover"
          data-bs-placement="right" :data-bs-content="$t('settings.cdn.popover.clazex')"></a>
      </CCdnRadio>
    </div>
    <!--Exp Mode-->
    <hr />
    <div class="p-3">
      <h3>
        {{ $t("settings.exp.title") }}
      </h3>
      <div>
        <div class="form-check form-switch">
          <input class="form-check-input" type="checkbox" @change="changeExpMode" ref="expModeSwitch" />
          <label class="form-check-label">{{ $t("settings.exp.enable") }}</label>
        </div>
        <div class="alert alert-warning" v-if="isEnableExpMode()">
          {{ $t("settings.exp.warning") }}
        </div>
        <div class="alert alert-warning" v-if="shouldShowAlertRestart()">
          {{ $t("settings.exp.applyOnRestart") }}
        </div>
      </div>
      <RequireExpmode>
        <div class="form-check form-switch">
          <input class="form-check-input" type="checkbox" v-model="options" value="SHOW_LICENCE" />
          <label class="form-check-label">{{ $t("settings.options.show_licence") }}</label>
        </div>
      </RequireExpmode>
    </div>
  </form>
</template>

<script lang="ts">
import RequireExpmode from "@/components/require-expmode.vue";
import { store, ModSavePathMode, hasOption, SettingOptions } from "@/renderer/settings";
import { defineComponent, InputHTMLAttributes, SelectHTMLAttributes } from "vue";

import mirrorlist from "./settings/c-mirror-list.vue"
import * as remote from "@electron/remote";
import HkpathChange from "@/components/hkpath-change.vue";
import { join } from "path";
import { userData } from "@/renderer/remoteCache";
import { Popover } from "bootstrap";
import CCdnRadio from "./settings/c-cdn-radio.vue";

export default defineComponent({
  components: {
    mirrorlist,
    RequireExpmode,
    HkpathChange,
    CCdnRadio
  },
  mounted() {
    let checkbox = this.$refs.expModeSwitch as InputHTMLAttributes;
    checkbox.checked = store.get("enabled_exp_mode", false);

    const select = this.$refs.modssavepathmode as SelectHTMLAttributes;
    if (store.get("modsavepathMode", ModSavePathMode.UserDir) == ModSavePathMode.AppDir) select.value = "appdir";
    else if (store.get("modsavepathMode", ModSavePathMode.UserDir) == ModSavePathMode.UserDir) select.value = "userdir";
    else if (store.get("modsavepathMode", ModSavePathMode.UserDir) == ModSavePathMode.Custom) select.value = "custom";
    else if (store.get("modsavepathMode", ModSavePathMode.UserDir) == ModSavePathMode.Gamepath) select.value = "gamepath";

    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
    popoverTriggerList.map(function (popoverTriggerEl) {
      return new Popover(popoverTriggerEl)
    })
  },
  data() {
    return {
      options: store.get('options', []),
      cdn: store.get('cdn', 'JSDELIVR')
    }
  },
  watch: {
    options(n) {
      store.set('options', n);
    },
    cdn(n) {
      store.set('cdn', n);
    }
  },
  methods: {
    changeExpMode() {
      let checkbox = this.$refs.expModeSwitch as InputHTMLAttributes;
      store.set("enabled_exp_mode", checkbox.checked as boolean);

      sessionStorage.setItem("exp_query_restart", "1");
      this.$forceUpdate();
      this.$root?.$forceUpdate();
    },
    openLink(link: string) {
      remote.shell.openExternal(link);
    },
    shouldShowCustomModSavePath() {
      return store.get("modsavepathMode") == ModSavePathMode.Custom;
    },
    isEnableExpMode() {
      return store.get('enabled_exp_mode', false);
    },
    getModPath() {
      return store.get('modsavepath', join(userData, "managedMods"));
    },
    shouldShowAlertRestart(): boolean {
      return sessionStorage.getItem("exp_query_restart") ? true : false;
    },
    hasOption(option: SettingOptions) {
      return hasOption(option);
    },
    selectModsSavePath() {
      const result = remote.dialog.showOpenDialogSync({
        properties: ["dontAddToRecent", "openDirectory"]
      });
      if (!result) return;
      store.set("modsavepath", result[0]);
    },
    changeModsSavePathMode() {
      const select = this.$refs.modssavepathmode as SelectHTMLAttributes;
      const val = select.value;
      if (val === "appdir") store.set("modsavepathMode", ModSavePathMode.AppDir);
      else if (val === "userdir") store.set("modsavepathMode", ModSavePathMode.UserDir);
      else if (val === "custom") store.set("modsavepathMode", ModSavePathMode.Custom);
      else if (val === "gamepath") store.set("modsavepathMode", ModSavePathMode.Gamepath);
      this.$forceUpdate();
    }
  }
});
</script>

