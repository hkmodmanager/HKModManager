
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
                <div class="task-state p-2 bg-dark text-white" style="border: 2px; border-color: white;" ref="logBody">
                    <div v-for="(val, index) in logs" :key="index" copyable>
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

<script setup lang="ts">
import { Collapse } from 'bootstrap';
import { TaskItem, TaskLogInfo } from 'core';
import { getCurrentInstance, nextTick, onMounted, onUnmounted, ref } from 'vue';

const { ctx: _this }: any = getCurrentInstance();

const body = ref<Element>();
const logBody = ref<HTMLDivElement>();
const logs = ref<TaskLogInfo[]>([]);

const props = defineProps<{
    task: TaskItem
}>();
function toggleBody() {
    const tgb = new Collapse(body.value as Element);
    tgb.toggle();
}

function hideTask() {
    // eslint-disable-next-line vue/no-mutating-props
    if (props.task) props.task.isHidden = true;
}

function getTaskTime() {
    const task = props.task;
    const s = task.getRunningTime();
    return Math.round(s / 1000);
}

function getLogs() {
    const logs: TaskLogInfo[] = [];
    for (let i = 0; i < props.task.logCount; i++) {
        logs.push(props.task.getLogAt(i));
    }
    nextTick(() => {
        if (logBody.value) {
            logBody.value.scrollTop = logBody.value.scrollHeight;
        }
    });

    return logs;
}

onMounted(() => {
    // eslint-disable-next-line vue/no-mutating-props
    props.task.onChanged = () => {
        logs.value = getLogs();
        _this.$forceUpdate();
    };
});

onUnmounted(() => {
    // eslint-disable-next-line vue/no-mutating-props
    props.task.onChanged = undefined;
});

</script>
