<template>
  <Teleport to="body">
    <div class="modal fade" ref="modal_el">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <slot name="title">
              <h5 class="modal-title">{{ title }}</h5>
            </slot>
            <button class="btn text-white" @click="getModal().hide()"><i class="bi bi-x-lg"></i></button>
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

<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import { Modal } from 'bootstrap'

let modal: Modal | undefined;

const modal_el = ref<HTMLElement>();
const props = defineProps<{
  title?: string,
  backdrop?: boolean,
  keyboard?: boolean,
  focus?: boolean
}>();

function getModal() {
  if (modal) return modal as Modal;
  const el = modal_el.value as HTMLDivElement;
  return modal = new Modal(el, {
    backdrop: (props.backdrop ?? true) ? true : 'static',
    keyboard: props.keyboard,
    focus: props.focus
  });
}

defineExpose({
  getModal
});

onUnmounted(() => {
  modal?.dispose();
  modal = undefined;
});

</script>


