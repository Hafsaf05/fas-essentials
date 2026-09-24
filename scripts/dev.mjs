import { spawn } from 'node:child_process';
const children=[spawn('node',['--import','tsx','--watch','server/index.ts'],{stdio:'inherit'}),spawn('node',['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','3000'],{stdio:'inherit'})];
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>children.forEach(p=>p.kill(signal)));
for(const child of children)child.on('exit',code=>{children.forEach(p=>p.kill());process.exitCode=code||0;});
