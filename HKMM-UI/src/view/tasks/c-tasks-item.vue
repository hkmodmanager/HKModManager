
<template>
    <div class="task-item accordion-item text-black p-1">
        <h2 class="accordion-header">
            <button class="accordion-button collapsed" @click="toggleBody()">
                <div class="d-flex">
                    <i class="bi bi-exclamation-circle text-danger task-state-icon" v-if="task?.isFailed"></i>
                    <i class="bi bi bi-check-circle text-success task-state-icon" v-if="task?.isSuccess"></i>
                    <div class="spinner-border" v-if="!(task?.isFailed || task?.isSuccess)"></div>
                    <div class="p-1">
                        {{ task?.name }}
                    </div>

                </div>
                <div class="text-end flex-grow-1 text-primary p-1">
                    {{ getTaskTime() }}s
                </div>
            </button>

        </h2>
        <div class="accordion-collapse collapse " ref="body">
            <div class="accordion-body">
                <!--accordion body-->
                <div v-if="task?.progress != undefined" class="progress">
                    <div class="progress-bar" :style="'width: ' + task.progress + '%;'"></div>
                </div>
                <div class="fs-6 p-1 d-flex link-auto">
                    <div class="flex-grow-1">
                        Guid: <i copyable> {{ task?.guid }}</i>
                    </div>
                    <a class="btn btn-danger" v-if="(task?.isFailed || task?.isSuccess)" @click="hideTask()">
                        <i class="bi bi-trash3"></i>
                    </a>
                </div>
                <div class="task-state p-2 bg-dark text-white" style="border: 2px; border-color: white;">
                    <div v-for="(val, index) in getLogs()"  :key="index" copyable>
                        <span :class="`text-${val.color}`">{{ val.message }}</span>
                    </div>
                </div>
                <!--accordion body end-->
            </div>

        </div>
    </div>
</template>

<style>
.task-state-icon {
    font-size: 2rem;
    display: block;
    width: 2rem;
    height: 2rem;
}

.task-state {
    font-size: .75em;
    max-height: 15em;
    overflow: auto;
}

.task-item {
    --bs-border-radius: 0;
}


</style>

<script lang="ts">
import { Collapse } from 'bootstrap';
import { TaskItem, TaskLogInfo } from 'core';
import { defineComponent } from 'vue';

export default defineComponent({
    methods: {
        toggleBody() {
            const tgb = new Collapse(this.$refs.body as Element);
            tgb.toggle();
        },
        isDone() {
            return (this.task?.isFailed || this.task?.isSuccess) ?? true;
        },
        hideTask() {
            // eslint-disable-next-line vue/no-mutating-props
            if(this.task) this.task.isHidden = true;
            this.$parent?.$forceUpdate();
        },
        getTaskTime() {
            const task = this.task as TaskItem;
            const s = task.getRunningTime();
            return Math.round(s / 1000);
        },
        getLogs() {
            const logs: TaskLogInfo[] = [];
            for(let i = 0; i < this.task.logCount ; i++) {
                logs.push(this.task.getLogAt(i));
            }
            return logs;
        }
    },
    props: {
        task: TaskItem
    },
    data() {
        return {
            checkTimer: setInterval(() => this.$forceUpdate(), 500),
            checkTimerStop: false
        }
    },
    mounted() {
        if (this.task) {
            (this.task as TaskItem).onChanged = () => {
                this.$forceUpdate();
            };
        }
    },
    unmounted() {
        if (this.task) {
            (this.task as TaskItem).onChanged = undefined;
        }
    },
});
</script>
