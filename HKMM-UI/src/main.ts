import { createApp } from 'vue'
import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import { I18nLanguages, searchLanguages, SupportedLanguages } from './lang/langs'
import { createI18n } from 'vue-i18n'


import "bootstrap/dist/js/bootstrap.js"
import "@/renderer/modManager"

import "@/css/bootstrap.css"
//import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-icons/font/bootstrap-icons.css"

import viewErrorVue from './view/view-error.vue'
import { ipcRenderer } from 'electron'
import { URL } from 'url'
import { importGroup } from './renderer/modgroup'
import { store } from './renderer/settings';

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
        path: '/localmods/:filter?',
        component: () => import('./view/view-localmods.vue'),
        props: true
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
        name: 'plugins',
        path: '/plugins',
        component: () => import('./view/view-plugins.vue')
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

searchLanguages();

let lang = store.get('language')?.toLowerCase();
if(!lang || lang == '#') {
    lang = navigator.language.toLowerCase();
}
store.set('language', lang);
let clang: string;
console.log(`[I18n]Current language is ${lang}`);
if(!(clang = SupportedLanguages[lang])) {
    clang = SupportedLanguages['en-us'];
    store.set('language', 'en-us');
    
    if(!clang) {
        const l = Object.keys(SupportedLanguages)[0];
        clang = SupportedLanguages[l];
        store.set('language', l);
        console.log(`[I18n]Fallback to ${l}`);
    } else {
        console.log(`[I18n]Fallback to en-us`);
    }
}

export const i18n = createI18n({
    messages: I18nLanguages,
    locale: clang
});


(async function () {
    const app = createApp((await import('@/startup/startup-main.vue')).default);

    app.use(route);
    app.use(i18n);
    app.mount('#app');

    ipcRenderer.send("renderer-init");
})();

ipcRenderer.on("on-url-emit", (event, urlStr: string) => {
    const url = new URL(urlStr);
    console.dir(url);
    if (url.hostname == 'import.group') {
        importGroup(url);
    }
});


