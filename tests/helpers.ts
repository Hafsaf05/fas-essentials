import {openDatabase,run} from '../server/db';
import {createApp} from '../server/app';
import {passwordHash} from '../server/security';
import request from 'supertest';
export async function fixture(){
  const db=openDatabase(':memory:');
  run(db,'INSERT INTO categories VALUES(?,?)','kitchen','Kitchen');
  run(db,'INSERT INTO products(id,handle,category_id,title,price,compare_price,active,featured,details) VALUES(?,?,?,?,?,?,1,1,?)','test-product','test-product','kitchen','Test Tumbler',34900,79900,JSON.stringify({shortTitle:'Test Tumbler',headline:'Test',description:'Test fixture',features:['Steel'],specs:{material:'Steel'},careInstructions:['Wash'],highlights:['Test'],images:['https://example.com/tumbler.png']}));
  run(db,"INSERT INTO variants VALUES('black','test-product','Black','#18181B',5,1),('white','test-product','White','#FFFFFF',2,1)");
  run(db,"INSERT INTO coupons VALUES('FAS10',10,0,1,0),('FAS15',15,70000,1,0),('FIRST10',10,0,1,1)");
  run(db,"INSERT INTO users(id,email,name,password_hash,role) VALUES('admin','admin@example.test','Admin',?,'admin')",await passwordHash('test-password-123'));
  const app=createApp(db);
  async function client(){const agent=request.agent(app);let csrf=(await agent.get('/api/session')).body.csrf;
    return {agent,get:(path:string)=>agent.get('/api'+path),send:async(method:string,path:string,body?:unknown)=>{const r=await (agent as any)[method]('/api'+path).set('Origin','http://localhost:3000').set('X-CSRF-Token',csrf).send(body);if(r.body.csrf)csrf=r.body.csrf;return r;}};
  }
  return {db,app,client};
}
export const shipping={fullName:'Test Customer',email:'customer@example.test',phone:'9876543210',address:'123 Test Street',city:'Bengaluru',state:'Karnataka',postalCode:'560038'};
