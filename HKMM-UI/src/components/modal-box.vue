<template>
  <Teleport to="body">
    <div class="modal fade" ref="modal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <slot name="title">
              <h5 class="modal-title">{{ title }}</h5>
            </slot>
            <button class="btn" @click="close()"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body">
            <slot></slot>
          </div>
          <div class="modal-footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { Modal } from 'bootstrap'

export default defineComponent({
  methods: {
    getModal() {
      if(this.modal) return this.modal as Modal;
      const el = this.$refs.modal as HTMLDivElement;
      return this.modal = new Modal(el);
    },
    close() {
      this.getModal().hide();
    }
  },
  data() {
    return {
      modal: undefined as any
    }
  },
  unmounted() {
    if(this.modal) {
      this.modal.dispose();
      this.modal = undefined;
    }
  },
  props: {
    title: String
  }
})
</script>


