<template>
  <div
    class="modal fade"
    id="app-modal"
    tabindex="-1"
    role="dialog"
    aria-labelledby="app-modal-title"
    aria-hidden="true"
  >
    <div class="modal-dialog" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="app-modal-title">{{ $t(title ?? "") }}</h5>
          <button
            type="button"
            class="close"
            data-dismiss="modal"
            aria-label="Close"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    props: {
        title: String
    },
    methods: {
        showModal: function() {
            
        }
    }
})
</script>


