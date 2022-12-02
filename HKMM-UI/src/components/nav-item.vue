<template>
  <li class="nav-item">
    <router-link :to="viewpath ?? ''" :class="getCssClass()">
      <slot></slot>
    </router-link>
  </li>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
  props: {
    viewpath: String,
    viewname: String,
    comparePath: Boolean,
    textcolor: {
      type: String,
      default: "white"
    }
  },
  data() {
    return {
      vname: this.viewname ?? this.viewpath?.replaceAll('/', '')
    }
  },
  methods: {
    getCssClass: function () {
      if (this.$route.name == this.vname && !this.comparePath) return "nav-link active";
      if (this.$route.path == this.viewpath && this.comparePath) return "nav-link active";
      else return `nav-link text-${this.textcolor ?? 'white'}`;
    },
    onChangeView: function () {
      this.$router.replace(this.viewpath ?? "");
    },
  },
});
</script>
