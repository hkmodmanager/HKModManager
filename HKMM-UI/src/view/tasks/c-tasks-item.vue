
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
                        <span v-if="task?.category" class="badge bg-primary">
                            {{ task.category }}
                        </span>
                    </div>

                </div>
                <div class="text-end flex-grow-1 text-primary p-1">
                    {{ getTaskTime() }}s
                </div>
            </button>

        </h2>
        <div class="accordion-collapse collapse "  ref="body">
            <div class="accordion-body">
                <!--accordion body-->
                <div v-if="task?.progress != undefined" class="progress">
                    <div class="progress-bar" :style="'width: ' + task.progress + '%;'"></div>
                </div>
                <div class="fs-6 p-1 d-flex link-auto">
                    <div class="flex-grow-1">
                        Guid: <i copyable> {{ task?.taskGuid }}</i>
                    </div>
                    <a class="btn btn-danger" v-if="(task?.isFailed || task?.isSuccess)" @click="hideTask()">
                        <i class="bi bi-trash3"></i>
                    </a>
                </div>
                <div class="task-state p-2 bg-secondary">
                    <div v-for="(val, index) in task?.taskState" :key="index" copyable>
                        <span v-if="!task?.isFailed || index !== 0">{{ val }}</span>
                        <span v-else class="text-danger">{{ val }}</span>
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
</style>

<script lang="ts">
import { getTask, TaskInfo } from '@/renderer/taskManager';
import { Collapse } from 'bootstrap';
import { defineComponent } from 'vue';

export default defineComponent({
    methods: {
        toggleBody() {
            const tgb = new Collapse(this.$refs.body as Element);
            tgb.toggle();
        },
        updateTask() {
            this.task = getTask(this.taskguid ?? "");
        },
        isDone() {
            this.updateTask();
            return (this.task?.isFailed || this.task?.isSuccess) ?? true;
        },
        hideTask() {
            (getTask(this.taskguid ?? "") as TaskInfo).isHidden = true;
            this.$parent?.$forceUpdate();
        },
        getTaskTime() {
            this.updateTask();
            const task = this.task as TaskInfo;
            const et = task.stopTime ?? new Date().valueOf();
            const s = et - task.startTime;
            return Math.round(s / 1000);
        }
    },
    props: {
        taskguid: String
    },
    data() {
        return {
            task: getTask(this.taskguid ?? ""),
            checkTimer: setInterval(() => this.$forceUpdate(), 500),
            checkTimerStop: false
        }
    },
    created() {
        let task = getTask(this.taskguid ?? "");
        if (!task) return;
        task.updateHandler = () => {
            this.$forceUpdate();
        };
    },
    mounted() {
        if (this.checkTimerStop) {
            this.checkTimer = setInterval(() => this.$forceUpdate(), 500);
        }
    },
    unmounted() {
        if (!this.checkTimerStop) {
            clearInterval(this.checkTimer);
            this.checkTimerStop = true;
        }
    },
    updated() {
        this.updateTask();
        if (this.isDone() && !this.checkTimerStop) {
            this.checkTimerStop = true;
            clearInterval(this.checkTimer);
        }
    }
});
</script>
