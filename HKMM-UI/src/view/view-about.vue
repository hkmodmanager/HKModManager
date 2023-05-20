<template>
    <div class="text-center">
        <div v-html="mdContent" />
    </div>
</template>

<script setup lang="ts">
import { publicDir } from '@/core/remoteCache';
import { store } from '@/core/settings';
import { readFileSync } from 'fs';
import MarkdownIt from 'markdown-it';
import { join } from 'path';

const mdName = store.store.language == 'zh' ? "about-cn.md" : "about.md";
const aboutMD = readFileSync(join(publicDir, "md", mdName), 'utf8');
const mdContent = MarkdownIt({
    html: true
}).render(aboutMD);

</script>
