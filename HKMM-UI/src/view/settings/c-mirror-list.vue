
<template>

    <div>
        <ul class="list-group c-mirror-list-group">
            <li class="list-group-item" v-for="(item, index) in groupCache" :key="item">
                <div class="input-group">
                    <input type="url" class="form-control" :value="item" readonly disabled />
                    <a class="btn btn-danger" @click="remove(index)">
                        <i class="bi bi-x"></i>
                    </a>
                </div>
            </li>
            <form @submit="addOne($event)">
                <li class="list-group-item">
                    <div class="input-group">
                        <input type="url" class="form-control" v-model="addTemp" ref="addInput" placeholder="https://ghproxy.net/"/>
                        <input class="btn btn-success bi bi-plus" type="submit" value=" + "/>
                    </div>
                </li>
            </form>
        </ul>
    </div>

</template>

<style>
.c-mirror-list-group {
    max-width: 32em;
    min-width: 32em;
}
</style>

<script lang="ts">
import { store } from '@/core/settings';
import { defineComponent } from 'vue';


export default defineComponent(
    {
        name: "settings-c-mirror-list",
        props: {
            keyName: String
        },
        data: function () {
            return {
                groupCache: store.get(this.keyName as string, []) as string[],
                addTemp: ""
            }
        },
        methods: {
            addOne: function (ev: Event) {
                ev.preventDefault();
                if (!this.addTemp || this.addTemp.trim() == "" || (this.$refs.addInput as any).validity.typeMismatch) return;
                const url = new URL(this.addTemp);
                this.groupCache.push(url.hostname);
                this.addTemp = "";
                this.update();
                
            },
            remove: function (index: number) {
                let narr: string[] = [];
                for (let i = 0; i < this.groupCache.length; i++) {
                    if (i != index) narr.push(this.groupCache[i]);
                }
                this.groupCache = narr;
                this.update();
            },
            update: function () {
                store.set(this.keyName as string, this.groupCache);
            }
        }
    }
);

</script>
