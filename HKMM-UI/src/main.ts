import { createApp } from 'vue'
import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import { I18nLanguages } from './lang/langs'
import { createI18n } from 'vue-i18n'

import "bootstrap/dist/js/bootstrap.js"
import "@/renderer/modManager"

import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-icons/font/bootstrap-icons.css"

import viewErrorVue from './view/view-error.vue'
import requireExpmodeVue from './components/require-expmode.vue'
import startupVue from './startup/startup-main.vue'
import { ipcRenderer } from 'electron'
import { URL } from 'url'
import { importGroup } from './renderer/modgroup'

const routes: RouteRecordRaw[] = [
    {
        name: 'allmods',
        path: '/allmods',
        component: () => import('./view/view-allmods.vue')
    },
    {
        name: 'settings',
        path: '/settings',
        component: () => import('./view/view-settings.vue')
    },
    {
        name: 'localmods',
        path: '/localmods',
        component: () => import('./view/view-localmods.vue'),
    },
    {
        name: 'tasks',
        path: '/tasks/:filter?',
        component: () => import('./view/view-tasks.vue'),
        props: true
    },
    {
        name: 'modgroups',
        path: '/modgroups',
        component: () => import('./view/view-modgroups.vue')
    },
    {
        name: 'api',
        path: '/api',
        component: () => import('./view/view-api.vue')
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

export const app = createApp(startupVue);

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
