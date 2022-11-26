
<template>
    <div>
        <ul class="list-group c-mirror-list-group">
            <li class="list-group-item" v-for="(item, index) in groupCache.items" :key="item.target">
                <div class="input-group">
                    <input type="url" class="form-control" v-model="item.target" readonly disabled />
                    <a class="btn btn-danger" @click="remove(index)">
                        <i class="bi bi-x"></i>
                    </a>
                </div>
            </li>
            <li class="list-group-item">
                <div class="input-group">
                    <input type="url" class="form-control" v-model="addTemp.target" ref="addInput"/>
                    <a class="btn btn-success" @click="addOne">
                        <i class="bi bi-plus"></i>
                    </a>
                </div>
            </li>
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
import { MirrorGroup, MirrorItem } from '@/renderer/settings';
import { defineComponent } from 'vue';


export default defineComponent(
    {
        name: "settings-c-mirror-list",
        props: {
            group: MirrorGroup
        },
        data: function () {
            return {
                groupCache: this.group ?? new MirrorGroup(),
                addTemp: new MirrorItem()
            }
        },
        methods: {
            update: function () {
                this.$emit("update:group", this.groupCache);
            },
            addOne: function() {
                if(!this.addTemp.target || this.addTemp.target.trim() == "") return;
                
                this.groupCache.items.push(this.addTemp);
                this.addTemp = new MirrorItem();
                this.update();
            },
            remove: function(index: number) {
                let narr: MirrorItem[] = [];
                for (let i = 0; i < this.groupCache.items.length; i++) {
                    if(i != index) narr.push(this.groupCache.items[i]);
                }
                this.groupCache.items = narr;
                this.update();
            }
        }
    }
);

</script>
