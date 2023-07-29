import { createApp } from 'vue'
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { I18nLanguages, searchLanguages, SupportedLanguages } from './lang/langs'
import { createI18n } from 'vue-i18n'
import { log, error } from 'electron-log'
import * as remote from '@electron/remote';

//import "@/css/bootstrap.dark.css"
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-icons/font/bootstrap-icons.css"
import "@/css/common.scss"

import viewErrorVue from './view/view-error.vue'
import { ipcRenderer } from 'electron'
import { URL } from 'url'
import { store } from './core/settings'
import { appVersion, publicDir } from './core/remoteCache'
import { join } from 'path'
import { onSettingChanged } from 'core'

import "@/core/interop/cs"

store.onDidAnyChange(() => {
    setTimeout(() => {
        onSettingChanged(store.path);
    }, 1);
});

const oerror = console.error;


console.log = log;
console.error = (...data: any[]) => {
    if (data[0] instanceof Error) oerror(...data);
    error(...data);
};


console.log(`Hollow Knight Mod Manager App stared(v${appVersion}) = ${new Date().valueOf()}(${new Date().toUTCString()})`);

const routes: RouteRecordRaw[] = [
    {
        name: "pack",
        path: "/pack",
        component: () => import('./view/view-pack.vue')
    },
    {
        name: "sources",
        path: "/sources",
        component: () => import('./view/view-source.vue')
    },
    {
        name: "groups",
        path: "/groups",
        component: () => import('./view/view-group.vue')
    },
    {
        name: 'settings',
        path: '/settings',
        component: () => import('./view/view-settings.vue')
    },
    {
        name: 'tasks',
        path: '/tasks/:filter?',
        component: () => import('./view/view-tasks.vue'),
        props: true
    },
    {
        name: 'about',
        path: '/about',
        component: () => import('./view/view-about.vue')
    },
    {
        path: '/:pathMatch(.*)*',
        component: viewErrorVue
    }
];

const route = createRouter({
    history: createWebHistory(),
    routes
});

searchLanguages();

let lang = store.get('language')?.toLowerCase();
if (!lang || lang == '#') {
    lang = navigator.language.toLowerCase();
}
store.set('language', lang);
let clang: string;
console.log(`[I18n]Current language is ${lang}`);
if (!(clang = SupportedLanguages[lang])) {
    clang = SupportedLanguages['en-us'];
    store.set('language', 'en-us');

    if (!clang) {
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
    locale: clang,
    legacy: false
});


(async function () {
    const app = createApp((await import('@/startup/startup-main.vue')).default);

    app.use(route);
    app.use(i18n);
    app.mount('#app');

    ipcRenderer.send("renderer-init");
})();

remote.getCurrentWindow().setIcon(join(publicDir, "logo.ico"));

ipcRenderer.on("on-url-emit", (event, urlStr: string) => {
    const url = new URL(urlStr);
    console.dir(url);
});

//document.body.setAttribute("data-bs-theme", store.get('useDarkMode', false) ? "dark" : "light");
document.body.setAttribute("data-bs-theme","dark");