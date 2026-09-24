import {createMailDelivery} from './mail';
import 'dotenv/config';
import { openDatabase, run } from './db';
import { createApp } from './app';
const db=openDatabase();
const app=createApp(db);
const server=app.listen(Number(process.env.PORT||3001),process.env.HOST||'0.0.0.0',()=>console.log(`API listening on ${process.env.PORT||3001}`));
const deliverMail=createMailDelivery(db);
const timer=setInterval(()=>{void deliverMail();run(db,'DELETE FROM sessions WHERE expires_at<?',Date.now());run(db,'DELETE FROM reset_tokens WHERE expires_at<?',Date.now());run(db,'DELETE FROM rate_limits WHERE reset_at<?',Date.now());run(db,'DELETE FROM carts WHERE user_id IS NULL AND session_hash NOT IN (SELECT token_hash FROM sessions)');},30000);
function shutdown(){clearInterval(timer);server.close(()=>{db.close();process.exit(0);});setTimeout(()=>process.exit(1),15000).unref();}
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
