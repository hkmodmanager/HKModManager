import { createApp } from 'vue'
import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
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
import { importGroup } from './core/modgroup'
import { store } from './core/settings'
import { appVersion, publicDir } from './core/remoteCache'
import { LogSkipStackFrame } from './common'
import { fixModLinksManifestData, getModLinks, ModLinksManifestData } from './core/modlinks/modlinks'
import { getOrAddLocalMod } from './core/modManager'
import { join } from 'path'
import { initJSAPI, onSettingChanged } from 'core'

initJSAPI({
    getConfigPath() {
        return store.path;
    },
});

store.onDidAnyChange(() => {
    setTimeout(() => {
        onSettingChanged();
    }, 1);
});

const oerror = console.error;

//transports.console = null as any;

function getStack(skip: number = 0) {
    return new Error().stack?.split('\n')[2 + skip]?.trim() ?? "No stack trace";
    /*const orig = Error.prepareStackTrace;
    Error.prepareStackTrace = function(_, stack){ return stack; };
    const err = new Error;
    //Error.captureStackTrace(err, arguments.callee);
    const stack = err.stack as any as NodeJS.CallSite[];
    Error.prepareStackTrace = orig;
    if(!stack) return "No stack trace";
    
    const frame = stack[skip + 1];
    if(!frame) return "No stack trace";
    return `${frame.getFunctionName()} in ${frame.isEval() ? frame.getEvalOrigin() : frame.getFileName()}:${frame.getLineNumber()}:${frame.getColumnNumber()}`;
*/}

console.log = (...data: any[]) => {
    //olog(...data);
    const last = data[data.length - 1];
    let skip = 0;
    if (last instanceof LogSkipStackFrame) {
        skip = last.count;
        data.pop();
    }
    log(`[${getStack(skip + 1)}] ` + data[0], ...data.slice(1));
};
console.error = (...data: any[]) => {
    if (data[0] instanceof Error) oerror(...data);
    const last = data[data.length - 1];
    let skip = 0;
    if (last instanceof LogSkipStackFrame) {
        skip = last.count;
        data.pop();
    }
    error(`[${getStack(skip + 1)}] ` + data[0], ...data.slice(1));
};
/*console.warn = (...data: any[]) => {
    //owarn(...data);
    const last = data[data.length - 1];
    let skip = 0;
    if(last instanceof LogSkipStackFrame) {
        skip = last.count;
        data.pop();
    }
    warn(`[${getStack(skip + 1)}] ` + data[0], ...data.slice(1));
};*/

console.log(`Hollow Knight Mod Manager App stared(v${appVersion}) = ${new Date().valueOf()}(${new Date().toUTCString()})`);

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
        name: 'new',
        path: '/new',
        component: () => import('./view/view-new.vue')
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
    history: createWebHashHistory(),
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
    locale: clang
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
    if (url.hostname == 'import.group') {
        importGroup(url);
    }
    else if (url.hostname == 'install.mod') {
        getModLinks().then((data) => {
            let mds = url.searchParams.get('metadata');
            if(!mds) {
                const m2 = url.searchParams.get('metadata64');
                if(m2) {
                    mds = Buffer.from(m2, 'base64url').toString('utf-8');
                }
            }
            const skipDep = url.searchParams.get('skipDep') === 'true';
            let md: ModLinksManifestData | null = null;

            const name = url.searchParams.get('name');
            const ver = url.searchParams.get('version');
            md = data.getMod(name ?? '', ver ?? undefined) ?? null;
            if (mds) {
                const m: ModLinksManifestData = JSON.parse(mds);
                if(!md) {
                    md = m;
                } else {
                    for (const name of Object.keys(m)) {
                        if((m as any)[name]) {
                            (md as any)[name] = (m as any)[name];
                        }
                    }
                }
            }
            if (!md) {
                return;
            }
            fixModLinksManifestData(md);
            const mg = getOrAddLocalMod(md.name);
            mg.installNew(md, false, skipDep);
        });

    }
});

//document.body.setAttribute("data-bs-theme", store.get('useDarkMode', false) ? "dark" : "light");
document.body.setAttribute("data-bs-theme","dark");