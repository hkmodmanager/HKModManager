import { createApp } from 'vue'
import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import { I18nLanguages } from './lang/langs'
import { createI18n } from 'vue-i18n'

import "bootstrap/dist/js/bootstrap.js"
import "@/renderer/modManager"

import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-icons/font/bootstrap-icons.css"
import viewAllmodsVue from './view/view-allmods.vue'
import viewSettingsVue from './view/view-settings.vue'
import viewErrorVue from './view/view-error.vue'
import viewLocalmodsVue from './view/view-localmods.vue'
import viewTasksVue from './view/view-tasks.vue'
import requireExpmodeVue from './components/require-expmode.vue'
import viewModGroups from './view/view-modgroups.vue'
import AppVue from './App.vue'
import { ipcRenderer } from 'electron'
import { URL } from 'url'
import { importGroup } from './renderer/modgroup'

const routes: RouteRecordRaw[] = [
    {
        name: 'allmods',
        path: '/allmods',
        component: viewAllmodsVue
    },
    {
        name: 'settings',
        path: '/settings',
        component: viewSettingsVue
    },
    {
        name: 'localmods',
        path: '/localmods',
        alias: '/:',
        component: viewLocalmodsVue,
    },
    {
        name: 'tasks',
        path: '/tasks/:filter?',
        component: viewTasksVue,
        props: true
    },
    {
        name: 'modgroups',
        path: '/modgroups',
        component: viewModGroups
    },
    {
        path: '/:pathMatch(.*)*',
        component: viewErrorVue
    }
];

const route = createRouter({
    history: createWebHashHistory(),
    routes
});

export const i18n = createI18n({
    locale: 'zh',
    messages: I18nLanguages
});

export const app = createApp(AppVue);

app.use(route);
app.use(i18n);
app.component("exp-mode", requireExpmodeVue);
app.mount('#app');

ipcRenderer.on("on-url-emit", (event, urlStr: string) => {
    const url = new URL(urlStr);
    console.dir(url);
    if(url.hostname == 'import.group') {
        importGroup(url);
    }
});
