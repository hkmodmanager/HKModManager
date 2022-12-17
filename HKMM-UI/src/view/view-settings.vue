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
          <a class="btn btn-success float-end" @click="restart()">{{ $t("settings.exp.restartNow") }}</a>
        </div>
      </div>
    </div>
    <RequireExpmode>
      <div class="p-3">
        <div class="form-check form-switch">
          <input class="form-check-input" type="checkbox" v-model="options" value="SHOW_DELETED_MODS"/>
          <label class="form-check-label">{{ $t("settings.options.show_deleted_mods") }}</label>
        </div>
      </div>
    </RequireExpmode>
    <!--Mirror-->
    <RequireExpmode v-if="false">
      <div class="p-3">
        <div class="form-group">
          <label class="form-label">{{
              $t("settings.mirror.githubmirror")
          }}</label>
          <mirrorlist key-name="mirror_github"></mirrorlist>
        </div>
      </div>
      <hr />
    </RequireExpmode>
  </form>
</template>

<script lang="ts">
import RequireExpmode from "@/components/require-expmode.vue";
import { store, ModSavePathMode } from "@/renderer/settings";
import { defineComponent, InputHTMLAttributes, SelectHTMLAttributes } from "vue";

import mirrorlist from "./settings/c-mirror-list.vue"
import { remote } from "electron";
import HkpathChange from "@/components/hkpath-change.vue";
import { join } from "path";
import { userData } from "@/renderer/remoteCache";

export default defineComponent({
  components: {
    mirrorlist,
    RequireExpmode,
    HkpathChange
  },
  mounted() {
    let checkbox = this.$refs.expModeSwitch as InputHTMLAttributes;
    checkbox.checked = store.get("enabled_exp_mode", false);

    const select = this.$refs.modssavepathmode as SelectHTMLAttributes;
    if (store.get("modsavepathMode", ModSavePathMode.UserDir) == ModSavePathMode.AppDir) select.value = "appdir";
    else if (store.get("modsavepathMode", ModSavePathMode.UserDir) == ModSavePathMode.UserDir) select.value = "userdir";
    else if (store.get("modsavepathMode", ModSavePathMode.UserDir) == ModSavePathMode.Custom) select.value = "custom";
    else if (store.get("modsavepathMode", ModSavePathMode.UserDir) == ModSavePathMode.Gamepath) select.value = "gamepath";
  },
  data() {
    return {
      options: store.get('options', [])
    }
  },
  watch: {
    options(n) {
      store.set('options', n);
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
    restart() {
      remote.app.relaunch();
      remote.app.exit();
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

