import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,createHmac} from 'node:crypto';
import {fixture,shipping} from './helpers';
import {one,run} from '../server/db';
import {markCaptured} from '../server/store';
import {validSignature} from '../server/payments';
import request from 'supertest';
const register=(c:any,email='customer@example.test')=>c.send('post','/auth/register',{name:'Test Customer',email,password:'test-password-123'});
const add=(c:any,quantity=1,color='Black')=>c.send('post','/cart/items',{productId:'test-product',quantity,color});
const checkout=(c:any,key=randomUUID(),paymentMethod='cod')=>c.send('post','/orders',{checkoutKey:key,address:shipping,paymentMethod,orderNote:'Ring bell'});
test('real database flow: guest cart merge, variant, coupon, checkout, duplicate submit, ownership, fulfillment, review',async()=>{
  const {db,client}=await fixture();try{
    const c=await client();assert.equal((await add(c,2,'White')).status,200);assert.equal((await register(c)).status,200);
    assert.equal((await c.get('/cart')).body.items[0].selectedColor,'White');
    assert.equal((await c.send('patch','/cart',{promoCode:'FAS10'})).body.discount,69.8);
    const key=randomUUID(),placed=await checkout(c,key);assert.equal(placed.status,201,JSON.stringify(placed.body));const o=placed.body.order;assert.equal(o.total,62820);assert.equal(o.status,'confirmed');assert.equal(o.items[0].color,'White');assert.equal(one(db,"SELECT stock FROM variants WHERE id='white'").stock,0);
    assert.equal((await checkout(c,key)).body.order.id,o.id);assert.equal(one(db,'SELECT COUNT(*) n FROM orders').n,1);assert.equal((await c.get('/cart')).body.items.length,0);
    const stranger=await client();await register(stranger,'stranger@example.test');assert.equal((await stranger.get(`/orders/${o.id}`)).status,404);assert.equal((await c.get('/admin/orders')).status,403);
    const review={productId:'test-product',author:'Customer',location:'Bengaluru',rating:5,title:'Good product',comment:'This is a verified test review.'};assert.equal((await c.send('post','/reviews',review)).status,403);
    const admin=await client();await admin.send('post','/auth/admin-login',{email:'admin@example.test',password:'test-password-123'});
    assert.equal((await admin.send('patch',`/admin/orders/${o.id}`,{status:'delivered'})).status,409);
    for(const status of ['processing','shipped','delivered'])assert.equal((await admin.send('patch',`/admin/orders/${o.id}`,{status,trackingUrl:'https://example.com/tracking'})).status,200);
    assert.equal((await c.send('post','/reviews',review)).status,201);assert.equal((await c.send('post','/reviews',review)).status,409);assert.equal((await c.get('/reviews')).body[0].verified,true);
  }finally{db.close();}
});
test('inventory race cannot oversell and cancellation restores stock once',async()=>{
  const {db,client}=await fixture();try{const a=await client(),b=await client();await register(a);await register(b,'b@example.test');await add(a,5);await add(b,5);
    const result=await Promise.all([checkout(a),checkout(b)]);assert.deepEqual(result.map(x=>x.status).sort(),[201,409]);assert.equal(one(db,"SELECT stock FROM variants WHERE id='black'").stock,0);
    const idx=result.findIndex(x=>x.status===201),c=[a,b][idx],o=result[idx].body.order;
    assert.equal((await c.send('post',`/orders/${o.id}/cancel`)).status,200);assert.equal((await c.send('post',`/orders/${o.id}/cancel`)).status,409);assert.equal(one(db,"SELECT stock FROM variants WHERE id='black'").stock,5);
  }finally{db.close();}
});
test('validation, CSRF, sessions, wishlists, support and missing gateway fail honestly',async()=>{
  const {db,app,client}=await fixture();try{const c=await client();assert.equal((await c.agent.post('/api/contact').send({})).status,403);assert.equal((await c.send('post','/auth/register',{name:'X',email:'bad',password:'123'})).status,400);await register(c);
    assert.equal((await c.send('put','/wishlist/test-product')).status,200);assert.equal((await c.get('/wishlist')).body.length,1);
    assert.equal((await c.send('patch','/cart',{promoCode:'NOPE'})).status,400);assert.equal((await add(c,-1)).status,400);assert.equal((await add(c,99)).status,409);
    assert.equal((await c.send('post','/contact',{name:'Test',email:'test@example.test',phone:'',comment:'Please help with my order.'})).status,201);assert.equal(one(db,'SELECT COUNT(*) n FROM contact_messages').n,1);
    await add(c);assert.equal((await checkout(c,randomUUID(),'upi')).status,503);assert.equal(one(db,'SELECT COUNT(*) n FROM orders').n,0);
    assert.equal((await c.send('post','/auth/change-password',{currentPassword:'wrong',password:'another-password-123'})).status,400);
    assert.equal((await request(app).post('/api/payments/webhook').set('Content-Type','application/json').send('{}')).status,400);
  }finally{db.close();}
});
test('signed webhooks: invalid amount, idempotent capture, cancellation race, refund',async()=>{
  process.env.RAZORPAY_WEBHOOK_SECRET='test-webhook-secret';const {db,app,client}=await fixture();try{const c=await client();await register(c);await add(c);const o=(await checkout(c)).body.order;
    run(db,"UPDATE orders SET payment_method='upi',status='payment_pending',provider_order_id='order_test' WHERE id=?",o.id);
    const payment={id:'pay_test',order_id:'order_test',status:'captured',currency:'INR',amount:o.total};
    assert.throws(()=>markCaptured(db,{...payment,amount:1}));assert.equal(one(db,'SELECT payment_status FROM orders WHERE id=?',o.id).payment_status,'unpaid');
    await c.send('post',`/orders/${o.id}/cancel`);
    async function hook(event:any,eid:string){const raw=JSON.stringify(event),sig=createHmac('sha256','test-webhook-secret').update(raw).digest('hex');return request(app).post('/api/payments/webhook').set('Content-Type','application/json').set('x-razorpay-signature',sig).set('x-razorpay-event-id',eid).send(raw);}
    const event={event:'payment.captured',payload:{payment:{entity:payment}}};assert.equal((await hook(event,'event1')).status,200);assert.equal((await hook(event,'event1')).status,200);assert.equal(one(db,'SELECT status FROM orders WHERE id=?',o.id).status,'payment_review');assert.equal(one(db,"SELECT stock FROM variants WHERE id='black'").stock,5);
    const refund={event:'refund.processed',payload:{refund:{entity:{id:'rfnd_test',payment_id:'pay_test',amount:o.total,status:'processed'}}}};assert.equal((await hook(refund,'event2')).status,200);assert.equal(one(db,'SELECT payment_status FROM orders WHERE id=?',o.id).payment_status,'refunded');assert.equal(one(db,"SELECT stock FROM variants WHERE id='black'").stock,5);
    assert.equal(validSignature('abc','00'.repeat(32),'test'),false);
  }finally{db.close();delete process.env.RAZORPAY_WEBHOOK_SECRET;}
});
test('admin edits enforce validation, ownership and stale inventory protection',async()=>{
 const {db,client}=await fixture();try{const a=await client();await a.send('post','/auth/admin-login',{email:'admin@example.test',password:'test-password-123'});const p=(await a.get('/admin/products')).body[0];
 const c=await client();await register(c);await add(c);await checkout(c);assert.equal((await a.send('put','/admin/products/test-product',p)).status,409);
 const fresh=(await a.get('/admin/products')).body[0];fresh.title='Updated Tumbler';assert.equal((await a.send('put','/admin/products/test-product',fresh)).status,200);assert.equal((await c.get('/products?q=Updated')).body.length,1);
 assert.equal((await a.send('patch','/admin/users/admin',{role:'customer',active:false})).status,400);
 }finally{db.close();}
});
test('password reset tokens expire and are single-use; blocked users lose access',async()=>{
 process.env.RESEND_API_KEY='test-only-not-used';process.env.MAIL_FROM='test@example.test';
 const {db,client}=await fixture();try{const c=await client();await register(c);
 assert.equal((await c.send('post','/auth/forgot-password',{email:'customer@example.test'})).status,200);
 const body=one(db,"SELECT body FROM outbox WHERE subject='Reset your password'").body;const raw=body.match(/reset=([a-f0-9]{64})/)[1];
 run(db,'UPDATE reset_tokens SET expires_at=0');
 assert.equal((await c.send('post','/auth/reset-password',{token:raw,password:'new-password-12345'})).status,400);
 run(db,'UPDATE reset_tokens SET expires_at=?',Date.now()+60000);
 assert.equal((await c.send('post','/auth/reset-password',{token:raw,password:'new-password-12345'})).status,200);
 assert.equal((await c.get('/orders')).status,401);
 const fresh=await client();assert.equal((await fresh.send('post','/auth/reset-password',{token:raw,password:'newer-password-12345'})).status,400);
 assert.equal((await fresh.send('post','/auth/login',{email:'customer@example.test',password:'new-password-12345'})).status,200);
 const a=await client();await a.send('post','/auth/admin-login',{email:'admin@example.test',password:'test-password-123'});const uid=one(db,"SELECT id FROM users WHERE email='customer@example.test'").id;
 assert.equal((await a.send('patch',`/admin/users/${uid}`,{role:'customer',active:false})).status,200);assert.equal((await fresh.get('/orders')).status,401);
 }finally{db.close();delete process.env.RESEND_API_KEY;delete process.env.MAIL_FROM;}
});
