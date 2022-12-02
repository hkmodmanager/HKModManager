<template>
  <form>
    <HkpathChange v-model:gamepath="settings.gamepath" @onsave="save()"></HkpathChange>
    <div class="form-group p-3">
      <label class="form-label">{{ $t("settings.modsavepath.title") }}</label>
      <select class="form-select" @change="changeModsSavePathMode()" ref="modssavepathmode">
        <option value="appdir">{{ $t("settings.modsavepath.appdir") }}</option>
        <option value="userdir">{{ $t("settings.modsavepath.userdir") }}</option>
        <option value="custom">{{ $t("settings.modsavepath.custom") }}</option>
      </select>
      <div class="input-group p-1" v-if="shouldShowCustomModSavePath()">
        <input class="form-control" readonly disabled :value="settings.modsavepath" />
        <a class="btn btn-success" @click="selectModsSavePath()"><i class="bi bi-folder2-open"></i></a>
      </div>
    </div>
    <!--Exp Mode-->
    <hr />
    <div class="form-group p-3">
      <h3>
        {{ $t("settings.exp.title") }}
      </h3>
      <div class="form-group">
        <div class="form-check form-switch">
          <input class="form-check-input" type="checkbox" @change="changeExpMode" ref="expModeSwitch" />
          <label class="form-check-label">{{ $t("settings.exp.enable") }}</label>
        </div>
        <div class="alert alert-warning" v-if="settings.enabled_exp_mode">
          {{ $t("settings.exp.warning") }}
        </div>
        <div class="alert alert-warning" v-if="shouldShowAlertRestart()">
          {{ $t("settings.exp.applyOnRestart") }}
          <a class="btn btn-success float-end" @click="restart()">{{ $t("settings.exp.restartNow") }}</a>
        </div>
      </div>
    </div>

    <!--Mirror-->
    <RequireExpmode>
      <div class="form-group p-3">
        <div class="form-group">
          <label class="form-label">{{
              $t("settings.mirror.githubmirror")
          }}</label>
          <mirrorlist v-model:group="settings.mirror_github"></mirrorlist>
        </div>
      </div>
      <hr />
    </RequireExpmode>
  </form>
</template>

<script lang="ts">
import RequireExpmode from "@/components/require-expmode.vue";
import { SaveSettings, GetSettings, ModSavePathMode } from "@/renderer/settings";
import { defineComponent, InputHTMLAttributes, SelectHTMLAttributes } from "vue";

import mirrorlist from "./settings/c-mirror-list.vue"
import { remote } from "electron";
import HkpathChange from "@/components/hkpath-change.vue";

export default defineComponent({
  data() {
    return {
      settings: GetSettings()
    }
  },
  components: {
    mirrorlist,
    RequireExpmode,
    HkpathChange
},
  mounted() {
    let checkbox = this.$refs.expModeSwitch as InputHTMLAttributes;
    checkbox.checked = this.settings.enabled_exp_mode ?? false;

    const select = this.$refs.modssavepathmode as SelectHTMLAttributes;
    if(this.settings.modsavepathMode == ModSavePathMode.AppDir) select.value = "appdir";
    else if(this.settings.modsavepathMode == ModSavePathMode.UserDir) select.value = "userdir";
    else if(this.settings.modsavepathMode == ModSavePathMode.Custom) select.value = "custom";
  },
  methods: {
    save() {
      SaveSettings(this.settings);
    },
    changeExpMode() {
      let checkbox = this.$refs.expModeSwitch as InputHTMLAttributes;
      this.settings.enabled_exp_mode = checkbox.checked as boolean;

      SaveSettings(this.settings);
      sessionStorage.setItem("exp_query_restart", "1");

      this.$root?.$forceUpdate();
    },
    shouldShowCustomModSavePath() {
      return this.settings.modsavepathMode == ModSavePathMode.Custom;
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
        properties: [ "dontAddToRecent", "openDirectory" ]
      });
      if(!result) return;
      this.settings.modsavepath = result[0];
    },
    changeModsSavePathMode() {
      const select = this.$refs.modssavepathmode as SelectHTMLAttributes;
      const val = select.value;
      if(val === "appdir") this.settings.modsavepathMode = ModSavePathMode.AppDir;
      else if(val === "userdir") this.settings.modsavepathMode = ModSavePathMode.UserDir;
      else if(val === "custom") this.settings.modsavepathMode = ModSavePathMode.Custom;
    }
  },
  unmounted: function () {
    SaveSettings(this.settings);
  }
});
</script>

