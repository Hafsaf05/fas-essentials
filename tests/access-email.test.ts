import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,createHmac} from 'node:crypto';
import request from 'supertest';
import {fixture,shipping} from './helpers';
import {all,one,run} from '../server/db';
import {notifyAdminOrder,createMailDelivery} from '../server/mail';
import {createApp} from '../server/app';
const credentials={email:'owner@example.test',password:'test-password-123'};
const register=(c:any,email=credentials.email)=>c.send('post','/auth/register',{...credentials,email,name:'Owner'});
const add=(c:any)=>c.send('post','/cart/items',{productId:'test-product',quantity:1,color:'Black'});
const orderBody=()=>({checkoutKey:randomUUID(),address:shipping,paymentMethod:'cod'});
test('customer session ownership, tampering, separate login, every admin endpoint and page',async()=>{
 const {db,client}=await fixture();try{
  const owner=await client(),other=await client(),guest=await client();
  assert.equal((await register(owner)).status,200);assert.equal((await register(other,'other@example.test')).status,200);
  await add(owner);const o=(await owner.send('post','/orders',orderBody())).body.order;
  const uid=one(db,"SELECT id FROM users WHERE email='owner@example.test'").id;
  assert.equal((await owner.get('/orders')).body[0].id,o.id);
  assert.deepEqual((await other.get(`/orders?userId=${uid}&user_id=${uid}`)).body,[]);
  assert.equal((await other.agent.get('/api/orders').send({userId:uid})).body.length,0);
  for(const path of [`/orders/${o.id}`,`/orders/${o.id}?userId=${uid}`]){
   const r=await other.get(path);assert.equal(r.status,404);assert.ok(!JSON.stringify(r.body).includes(shipping.phone));
  }
  for(const suffix of ['cancel','reconcile'])assert.equal((await other.send('post',`/orders/${o.id}/${suffix}`,{userId:uid})).status,404);
  assert.equal((await other.send('post',`/orders/${o.id}/verify?userId=${uid}`,{razorpay_payment_id:'pay_test',razorpay_order_id:'order_test',razorpay_signature:'invalid'})).status,404);
  assert.equal((await other.send('post','/orders',{...orderBody(),userId:uid})).status,400);
  const endpoints=[['get','products'],['put','products/test-product'],['delete','products/test-product'],['post','categories'],['patch','categories/kitchen'],['get','orders'],['patch',`orders/${o.id}`],['post',`orders/${o.id}/refund`],['post',`orders/${o.id}/reconcile`],['get','users'],['patch','users/admin'],['get','messages'],['patch','messages/test'],['get','operations']];
  for(const [method,path] of endpoints){const r=method==='get'?await other.get('/admin/'+path):await other.send(method,'/admin/'+path,{});assert.equal(r.status,403,`${method} ${path}`);assert.ok(!JSON.stringify(r.body).includes(shipping.phone));}
  assert.equal((await guest.get('/admin/orders')).status,401);
  assert.equal((await owner.agent.get('/admin')).status,403);assert.equal((await owner.agent.get('/admin/orders')).status,403);
  assert.equal((await guest.agent.get('/admin')).status,204);
  assert.equal((await owner.send('post','/auth/admin-login',{email:'admin@example.test',password:'test-password-123'})).status,403);
  assert.equal((await guest.send('post','/auth/admin-login',credentials)).status,401);
  assert.equal((await guest.send('post','/auth/login',{email:'admin@example.test',password:'test-password-123'})).status,401);
  assert.equal((await owner.send('post','/auth/logout')).status,200);assert.equal((await owner.get('/orders')).status,401);
  const returning=await client();
  assert.equal((await returning.send('post','/auth/login',{...credentials,password:'bad'})).status,401);
  assert.equal((await returning.send('post','/auth/login',credentials)).status,200);
  const admin=await client();assert.equal((await admin.send('post','/auth/admin-login',{email:'admin@example.test',password:'test-password-123'})).status,200);
  await add(other);const second=(await other.send('post','/orders',orderBody())).body.order;
  assert.deepEqual(new Set((await admin.get('/admin/orders')).body.map((r:any)=>r.id)),new Set([o.id,second.id]));
  assert.equal((await admin.agent.get('/admin')).status,204);
  assert.equal((await admin.send('patch',`/admin/orders/${o.id}`,{status:'processing'})).status,200);
  const p=(await admin.get('/admin/products')).body[0];p.variants[0].stock=12;p.title='Admin updated';
  assert.equal((await admin.send('put','/admin/products/test-product',p)).status,200);
  assert.equal(one(db,'SELECT stock FROM variants WHERE id=?',p.variants[0].id).stock,12);
 }finally{db.close();}
});
test('COD committed stock, full admin email payload, unique outbox, transport failure isolation',async()=>{
 process.env.ADMIN_EMAIL='admin@example.test';process.env.RESEND_API_KEY='test-transport-only';process.env.MAIL_FROM='orders@example.test';
 const {db,client}=await fixture();try{
  const c=await client();await register(c);await add(c);const b=orderBody();const placed=await c.send('post','/orders',b);assert.equal(placed.status,201);const o=placed.body.order;
  assert.equal(one(db,"SELECT stock FROM variants WHERE id='black'").stock,4);
  assert.equal((await c.send('post','/orders',b)).body.order.id,o.id);notifyAdminOrder(db,o.id);
  assert.equal(one(db,"SELECT COUNT(*) n FROM outbox WHERE id LIKE 'admin-order:%'").n,1);
  const messages:any[]=[];
  const deliver=createMailDelivery(db,async(_url,init)=>{messages.push({headers:init!.headers,...JSON.parse(String(init!.body))});return new Response('{}',{status:200});});
  await deliver();await deliver();const mail=messages.filter(m=>m.to[0]==='admin@example.test');assert.equal(mail.length,1);
  for(const text of [o.id,shipping.fullName,shipping.email,shipping.phone,shipping.address,shipping.city,shipping.state,shipping.postalCode,'Test Tumbler','Variant: black','Color: Black','Qty: 1','Unit price: INR 349.00','Subtotal: INR 349.00','Discount: INR 0.00','Shipping: INR 49.00','Total: INR 398.00','Payment method: cod','Payment status: unpaid','Order status: confirmed',o.created_at])assert.ok(mail[0].text.includes(text),text);
  await add(c);const second=(await c.send('post','/orders',orderBody())).body.order;const before=one(db,'SELECT * FROM orders WHERE id=?',second.id);
  let attempts=0;const failure=createMailDelivery(db,async()=>{attempts++;throw new Error('simulated transport failure');});await failure();await failure();
  assert.deepEqual(one(db,'SELECT * FROM orders WHERE id=?',second.id),before);assert.equal(one(db,"SELECT stock FROM variants WHERE id='black'").stock,3);
  const failed=one(db,'SELECT * FROM outbox WHERE id=?',`admin-order:${second.id}`);assert.equal(failed.sent_at,null);assert.equal(failed.attempts,1);assert.equal(failed.next_attempt,Number.MAX_SAFE_INTEGER);
  assert.ok(attempts>=1);
 }finally{db.close();delete process.env.ADMIN_EMAIL;delete process.env.RESEND_API_KEY;delete process.env.MAIL_FROM;}
});
test('simulated gateway: no email before capture; verify and signed webhook replays enqueue/send once',async()=>{
 process.env.ADMIN_EMAIL='admin@example.test';process.env.RAZORPAY_KEY_SECRET='test-secret';process.env.RAZORPAY_WEBHOOK_SECRET='test-hook';process.env.RESEND_API_KEY='test-transport-only';process.env.MAIL_FROM='orders@example.test';
 const f=await fixture();const {db}=f;
 let payment:any;
 const gateway={configured:true,key:'test-key',secret:'test-secret',createOrder:async(amount:number)=>({id:'order_simulated',amount,currency:'INR'}),getPayment:async()=>payment,getOrderPayments:async()=>({items:[payment]}),refund:async()=>({})};
 const app=createApp(db,gateway as any);const a=request.agent(app);let csrf=(await a.get('/api/session')).body.csrf;
 const post=async(path:string,body:any)=>{const r=await a.post('/api'+path).set('Origin','http://localhost:3000').set('X-CSRF-Token',csrf).send(body);if(r.body.csrf)csrf=r.body.csrf;return r;};
 try{
  await post('/auth/register',{...credentials,name:'Owner'});await post('/cart/items',{productId:'test-product',quantity:1,color:'Black'});
  const r=await post('/orders',{...orderBody(),paymentMethod:'upi'});assert.equal(r.status,201);const o=r.body.order;
  assert.equal(all(db,"SELECT * FROM outbox WHERE id LIKE 'admin-order:%'").length,0);
  payment={id:'pay_simulated',order_id:'order_simulated',amount:o.total,currency:'INR',status:'captured'};
  const verification={razorpay_payment_id:payment.id,razorpay_order_id:payment.order_id,razorpay_signature:createHmac('sha256','test-secret').update(`${payment.order_id}|${payment.id}`).digest('hex')};
  assert.equal((await post(`/orders/${o.id}/verify`,{...verification,razorpay_signature:'0'.repeat(64)})).status,400);
  assert.equal(all(db,"SELECT * FROM outbox WHERE id LIKE 'admin-order:%'").length,0);
  for(let i=0;i<2;i++)assert.equal((await post(`/orders/${o.id}/verify`,verification)).status,200);
  const raw=JSON.stringify({event:'payment.captured',payload:{payment:{entity:payment}}});
  for(const eventId of ['one','one','two'])assert.equal((await request(app).post('/api/payments/webhook').set('Content-Type','application/json').set('x-razorpay-signature',createHmac('sha256','test-hook').update(raw).digest('hex')).set('x-razorpay-event-id',eventId).send(raw)).status,200);
  assert.equal(all(db,"SELECT * FROM outbox WHERE id LIKE 'admin-order:%'").length,1);
  let count=0;const deliver=createMailDelivery(db,async(_url,init)=>{if(JSON.parse(String(init!.body)).to[0]==='admin@example.test')count++;return new Response('{}');});await deliver();await deliver();assert.equal(count,1);
 }finally{db.close();for(const key of ['ADMIN_EMAIL','RAZORPAY_KEY_SECRET','RAZORPAY_WEBHOOK_SECRET','RESEND_API_KEY','MAIL_FROM'])delete process.env[key];}
});
