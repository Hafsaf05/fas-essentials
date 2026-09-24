import {notifyAdminOrder} from './mail';
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { z, ZodError } from 'zod';
import { resolve } from 'node:path';
import { DB, one, all, run, transaction } from './db';
import { token, hash, passwordHash, verifyPassword, requireThat, HttpError } from './security';
import { paymentGateway, Gateway, validSignature } from './payments';
import { addressSchema, email, password, productSchema } from './validation';
import { id, product, cartId, cartView, quote, reviews, orderView, releaseStock, markCaptured, markRefunded, enqueue } from './store';
interface Context { session:any; sessionHash:string; user:any; cart:string; }
declare global { namespace Express { interface Request { ctx:Context; } } }
const wrap=(f:(req:Request,res:Response)=>unknown):express.RequestHandler=>(req,res,next)=>{Promise.resolve().then(()=>f(req,res)).catch(next);};
export function createApp(db: DB, gateway: Gateway = paymentGateway()) {
  const app=express(), production=process.env.NODE_ENV==='production', origin=process.env.APP_URL||'http://localhost:3000';
  if(production && !origin.startsWith('https://')) throw new Error('Production APP_URL must use HTTPS');
  app.disable('x-powered-by');
  if(process.env.TRUST_PROXY==='1') app.set('trust proxy',1);
  app.use(helmet({contentSecurityPolicy:{directives:{defaultSrc:["'self'"],scriptSrc:["'self'",'https://checkout.razorpay.com'],styleSrc:["'self'","'unsafe-inline'",'https://fonts.googleapis.com'],fontSrc:["'self'",'https://fonts.gstatic.com'],imgSrc:["'self'",'https:','data:'],connectSrc:["'self'",'https://api.razorpay.com'],frameSrc:['https://api.razorpay.com','https://checkout.razorpay.com'],upgradeInsecureRequests:production?[]:null}},crossOriginEmbedderPolicy:false}));
  app.post('/api/payments/webhook',express.raw({type:'application/json',limit:'256kb'}),wrap((req,res)=>{
    requireThat(Buffer.isBuffer(req.body)&&validSignature(req.body,req.get('x-razorpay-signature')||'',process.env.RAZORPAY_WEBHOOK_SECRET||''),400,'Invalid webhook signature');
    const event=JSON.parse(req.body.toString());
    const eventId=req.get('x-razorpay-event-id')||hash(req.body.toString());
    if(one(db,'SELECT 1 FROM webhook_events WHERE id=?',eventId)) return res.json({received:true});
    if(event.event==='payment.captured'||event.event==='order.paid') markCaptured(db,event.payload.payment.entity);
    if(event.event==='refund.processed') markRefunded(db,event.payload.refund.entity);
    run(db,'INSERT OR IGNORE INTO webhook_events(id,event) VALUES(?,?)',eventId,String(event.event));
    res.json({received:true});
  }));
  app.use(express.json({limit:'128kb'}),cookieParser());
  app.get('/api/health',(_req,res)=>{one(db,'SELECT 1');res.json({ok:true});});
  app.use('/api',(req,res,next)=>{
    res.set('Cache-Control','no-store');
    if(!['GET','HEAD','OPTIONS'].includes(req.method) && (req.get('origin')!==origin || req.get('sec-fetch-site')==='cross-site')) return res.status(403).json({error:'Request origin rejected'});
    next();
  });
  const limit=(scope:string,max:number,seconds=900):express.RequestHandler=>(req,res,next)=>{
    const key=`${scope}:${req.ip}`,now=Date.now();
    run(db,'INSERT INTO rate_limits(key,count,reset_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN reset_at<? THEN 1 ELSE count+1 END, reset_at=CASE WHEN reset_at<? THEN excluded.reset_at ELSE reset_at END',key,now+seconds*1000,now,now);
    const row=one(db,'SELECT * FROM rate_limits WHERE key=?',key);
    if(row.count>max) {res.set('Retry-After',String(Math.ceil((row.reset_at-now)/1000)));res.status(429).json({error:'Too many requests. Please try again later.'});return;} next();
  };
  app.use('/api',limit('api',600,60));
  const cookieName=production?'__Host-fas_session':'fas_session';
  app.get(['/admin','/admin/*'],(req,res)=>{
    res.setHeader('Cache-Control','no-store');
    const raw=req.cookies[cookieName];
    const user=typeof raw==='string'?one(db,'SELECT u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND u.active=1',hash(raw),Date.now()):null;
    if(user&&user.role!=='admin'){res.status(403).send('Administrator access required.');return;}
    if(production)res.sendFile(resolve('dist/index.html'));else res.sendStatus(204);
  });
  const setCookie=(res:Response,value:string)=>res.cookie(cookieName,value,{httpOnly:true,secure:production,sameSite:'lax',path:'/',maxAge:7*86400000});
  app.use('/api',(req,res,next)=>{
    try {
      let raw=req.cookies[cookieName], session=typeof raw==='string'?one(db,'SELECT * FROM sessions WHERE token_hash=? AND expires_at>?',hash(raw),Date.now()):null;
      if(!session) {raw=token();session={token_hash:hash(raw),user_id:null,csrf:token(),expires_at:Date.now()+7*86400000,created_at:Date.now()};run(db,'INSERT INTO sessions VALUES(?,?,?,?,?)',session.token_hash,null,session.csrf,session.expires_at,session.created_at);setCookie(res,raw);}
      const user=session.user_id?one(db,'SELECT id,email,name,role,active FROM users WHERE id=? AND active=1',session.user_id):null;
      req.ctx={session,sessionHash:session.token_hash,user,cart:cartId(db,session.token_hash,user?.id)};
      if(!['GET','HEAD','OPTIONS'].includes(req.method) && req.get('x-csrf-token')!==session.csrf) return res.status(403).json({error:'Session expired. Reload and try again.'});
      next();
    }catch(e){next(e);}
  });
  const auth:express.RequestHandler=(req,res,next)=>req.ctx.user?next():res.status(401).json({error:'Please sign in to continue.'});
  const admin:express.RequestHandler=(req,res,next)=>req.ctx.user?.role==='admin'?next():res.status(403).json({error:'Administrator access required.'});
  const audit=(req:Request,action:string,entity:string)=>run(db,'INSERT INTO audit_log(id,actor_id,action,entity_id) VALUES(?,?,?,?)',id(),req.ctx.user.id,action,entity);
  function signIn(req:Request,res:Response,user:any) {
    const raw=token(),csrf=token();
    transaction(db,()=>{
      const target=cartId(db,hash(raw),user.id);
      if(target!==req.ctx.cart && !req.ctx.user) {
        for(const row of all(db,'SELECT * FROM cart_items WHERE cart_id=?',req.ctx.cart)) run(db,'INSERT INTO cart_items(id,cart_id,variant_id,quantity) VALUES(?,?,?,?) ON CONFLICT(cart_id,variant_id) DO UPDATE SET quantity=MIN(99,quantity+excluded.quantity)',id(),target,row.variant_id,row.quantity);
        run(db,'DELETE FROM carts WHERE id=? AND user_id IS NULL',req.ctx.cart);
      }
      run(db,'DELETE FROM sessions WHERE token_hash=?',req.ctx.sessionHash);
      run(db,'INSERT INTO sessions VALUES(?,?,?,?,?)',hash(raw),user.id,csrf,Date.now()+7*86400000,Date.now());
    });
    setCookie(res,raw);res.json({user:{id:user.id,email:user.email,name:user.name,role:user.role},csrf});
  }
  app.get('/api/session',(req,res)=>res.json({user:req.ctx.user,csrf:req.ctx.session.csrf,onlinePayments:gateway.configured}));
  app.post('/api/auth/register',limit('auth',15),wrap(async(req,res)=>{
    const b=z.object({name:z.string().trim().min(2).max(100),email,password}).strict().parse(req.body);
    requireThat(!one(db,'SELECT 1 FROM users WHERE email=?',b.email),409,'Unable to create this account. Try signing in or resetting your password.');
    const ph=await passwordHash(b.password),uid=id();
    run(db,'INSERT INTO users(id,email,name,password_hash) VALUES(?,?,?,?)',uid,b.email,b.name,ph);
    signIn(req,res,one(db,'SELECT * FROM users WHERE id=?',uid));
  }));
  const dummyHash=passwordHash(token());
  app.post(['/api/auth/login','/api/auth/admin-login'],limit('auth',15),wrap(async(req,res)=>{
    const b=z.object({email,password:z.string().max(128)}).strict().parse(req.body),user=one(db,'SELECT * FROM users WHERE email=?',b.email);
    const valid=await verifyPassword(b.password,user?.password_hash||await dummyHash);
    const adminLogin=req.path==='/api/auth/admin-login';
    requireThat(!adminLogin||!req.ctx.user||req.ctx.user.role==='admin',403,'Administrator access required.');
    requireThat(user?.active&&valid&&user.role===(adminLogin?'admin':'customer'),401,'Email or password is incorrect.');signIn(req,res,user);
  }));
  app.post('/api/auth/logout',(req,res)=>{run(db,'DELETE FROM sessions WHERE token_hash=?',req.ctx.sessionHash);res.clearCookie(cookieName,{path:'/',secure:production,sameSite:'lax'});res.json({ok:true});});
  app.post('/api/auth/forgot-password',limit('reset',5),wrap((req,res)=>{
    const b=z.object({email}).parse(req.body),u=one(db,'SELECT * FROM users WHERE email=? AND active=1',b.email);
    requireThat(process.env.RESEND_API_KEY && process.env.MAIL_FROM,503,'Password recovery email is not configured. Contact support.');
    if(u){const raw=token();run(db,'INSERT INTO reset_tokens VALUES(?,?,?)',hash(raw),u.id,Date.now()+1800000);enqueue(db,u.email,'Reset your password',`${origin}/#account?reset=${raw}\nThis link expires in 30 minutes.`);}
    res.json({message:'If an account exists, a reset email will be sent.'});
  }));
  app.post('/api/auth/reset-password',limit('reset',5),wrap(async(req,res)=>{
    const b=z.object({token:z.string().length(64),password}).strict().parse(req.body),ph=await passwordHash(b.password);
    transaction(db,()=>{const row=one(db,'SELECT * FROM reset_tokens WHERE token_hash=? AND expires_at>?',hash(b.token),Date.now());requireThat(row,400,'Reset link is invalid or expired.');run(db,'UPDATE users SET password_hash=? WHERE id=?',ph,row.user_id);run(db,'DELETE FROM reset_tokens WHERE user_id=?',row.user_id);run(db,'DELETE FROM sessions WHERE user_id=?',row.user_id);});res.json({ok:true});
  }));
  app.post('/api/auth/change-password',auth,limit('auth',15),wrap(async(req,res)=>{
    const b=z.object({currentPassword:z.string().max(128),password}).strict().parse(req.body),u=one(db,'SELECT * FROM users WHERE id=?',req.ctx.user.id);
    requireThat(await verifyPassword(b.currentPassword,u.password_hash),400,'Current password is incorrect.');
    const ph=await passwordHash(b.password);transaction(db,()=>{run(db,'UPDATE users SET password_hash=? WHERE id=?',ph,u.id);run(db,'DELETE FROM sessions WHERE user_id=? AND token_hash<>?',u.id,req.ctx.sessionHash);});res.json({ok:true});
  }));
  app.get('/api/products',wrap((req,res)=>{
    const q=z.object({q:z.string().max(100).default(''),category:z.string().max(100).default(''),sort:z.enum(['featured','rating','price-asc','price-desc','discount']).default('featured')}).parse(req.query);
    const order={featured:'featured DESC,created_at ASC',rating:'featured DESC', 'price-asc':'price ASC','price-desc':'price DESC',discount:'(compare_price-price)*1.0/compare_price DESC'}[q.sort];
    let ps=all(db,`SELECT p.* FROM products p JOIN categories c ON c.id=p.category_id WHERE p.active=1 AND (?='' OR c.name=?) AND (?='' OR instr(lower(p.title||' '||p.details||' '||c.name),lower(?))>0) ORDER BY ${order}`,q.category,q.category,q.q,q.q).map(p=>product(db,p));
    if(q.sort==='rating') ps.sort((a,b)=>b.rating-a.rating);res.json(ps);
  }));
  app.get('/api/products/:id',wrap((req,res)=>{const p=one(db,'SELECT * FROM products WHERE (id=? OR handle=?) AND active=1',req.params.id,req.params.id);requireThat(p,404,'Product not found');res.json(product(db,p));}));
  app.get('/api/categories',(_req,res)=>res.json(all(db,'SELECT * FROM categories ORDER BY name')));
  app.get('/api/stats',(_req,res)=>res.json({reviewCount:one(db,'SELECT COUNT(*) n FROM reviews').n,rating:one(db,'SELECT ROUND(AVG(rating),2) n FROM reviews').n||0,delivered:one(db,"SELECT COALESCE(SUM(quantity),0) n FROM order_items JOIN orders ON orders.id=order_items.order_id WHERE orders.status='delivered'").n}));
  app.get('/api/cart',(req,res)=>res.json(cartView(db,req.ctx.cart,req.ctx.user?.id)));
  app.post('/api/cart/items',wrap((req,res)=>{
    const b=z.object({productId:z.string().max(80),color:z.string().max(80).optional(),quantity:z.number().int().min(1).max(99)}).strict().parse(req.body);
    transaction(db,()=>{const v=b.color?one(db,'SELECT v.* FROM variants v JOIN products p ON p.id=v.product_id WHERE v.product_id=? AND v.name=? AND v.active=1 AND p.active=1',b.productId,b.color):one(db,'SELECT v.* FROM variants v JOIN products p ON p.id=v.product_id WHERE v.product_id=? AND v.active=1 AND p.active=1 ORDER BY v.rowid LIMIT 1',b.productId);requireThat(v,404,'Product variant unavailable');const prev=one(db,'SELECT quantity FROM cart_items WHERE cart_id=? AND variant_id=?',req.ctx.cart,v.id)?.quantity||0;requireThat(prev+b.quantity<=Math.min(99,v.stock),409,'Not enough inventory for this color.');run(db,'INSERT INTO cart_items(id,cart_id,variant_id,quantity) VALUES(?,?,?,?) ON CONFLICT(cart_id,variant_id) DO UPDATE SET quantity=quantity+excluded.quantity',id(),req.ctx.cart,v.id,b.quantity);});res.json(cartView(db,req.ctx.cart,req.ctx.user?.id));
  }));
  app.patch('/api/cart/items/:id',wrap((req,res)=>{const b=z.object({quantity:z.number().int().min(1).max(99)}).strict().parse(req.body),item=one(db,'SELECT ci.*,v.stock FROM cart_items ci JOIN variants v ON v.id=ci.variant_id WHERE ci.id=? AND cart_id=?',req.params.id,req.ctx.cart);requireThat(item,404,'Cart item not found');requireThat(b.quantity<=item.stock,409,'Not enough inventory.');run(db,'UPDATE cart_items SET quantity=? WHERE id=?',b.quantity,item.id);res.json(cartView(db,req.ctx.cart,req.ctx.user?.id));}));
  app.delete('/api/cart/items/:id',(req,res)=>{run(db,'DELETE FROM cart_items WHERE id=? AND cart_id=?',req.params.id,req.ctx.cart);res.json(cartView(db,req.ctx.cart,req.ctx.user?.id));});
  app.patch('/api/cart',wrap((req,res)=>{const b=z.object({promoCode:z.string().trim().toUpperCase().max(30).optional(),orderNote:z.string().max(1000).optional()}).strict().parse(req.body);transaction(db,()=>{if(b.promoCode!==undefined){run(db,'UPDATE carts SET promo=? WHERE id=?',b.promoCode,req.ctx.cart);const q=quote(db,req.ctx.cart,req.ctx.user?.id);requireThat(!q.promoError,400,q.promoError);}if(b.orderNote!==undefined)run(db,'UPDATE carts SET note=? WHERE id=?',b.orderNote,req.ctx.cart);});res.json(cartView(db,req.ctx.cart,req.ctx.user?.id));}));
  app.get('/api/wishlist',auth,(req,res)=>res.json(all(db,'SELECT p.* FROM wishlist w JOIN products p ON p.id=w.product_id WHERE w.user_id=? AND p.active=1',req.ctx.user.id).map(p=>product(db,p))));
  app.put('/api/wishlist/:id',auth,wrap((req,res)=>{requireThat(one(db,'SELECT 1 FROM products WHERE id=? AND active=1',req.params.id),404,'Product not found');run(db,'INSERT OR IGNORE INTO wishlist VALUES(?,?)',req.ctx.user.id,req.params.id);res.json({ok:true});}));
  app.delete('/api/wishlist/:id',auth,(req,res)=>{run(db,'DELETE FROM wishlist WHERE user_id=? AND product_id=?',req.ctx.user.id,req.params.id);res.json({ok:true});});
  app.post('/api/orders',auth,limit('checkout',20),wrap(async(req,res)=>{
    const b=z.object({checkoutKey:z.string().uuid(),address:addressSchema,paymentMethod:z.enum(['upi','cod']),orderNote:z.string().max(1000).default('')}).strict().parse(req.body),uid=req.ctx.user.id;
    const requestHash=hash(JSON.stringify({...b,checkoutKey:undefined}));
    const existing=one(db,'SELECT * FROM orders WHERE user_id=? AND checkout_key=?',uid,b.checkoutKey);
    if(existing){requireThat(existing.request_hash===requestHash,409,'This checkout was already submitted with different details.');return res.json({order:orderView(db,existing),key:gateway.key});}
    requireThat(b.paymentMethod==='cod'||gateway.configured,503,'Online payments are not configured. Choose COD.');
    const orderId=id();
    transaction(db,()=>{
      requireThat(!one(db,"SELECT 1 FROM orders WHERE user_id=? AND status IN ('payment_creating','payment_pending','payment_initialization_failed')",uid),409,'You have an unfinished payment. Open your account to resume or cancel that order.');
      const q=quote(db,req.ctx.cart,uid);requireThat(q.rows.length,400,'Your cart is empty.');requireThat(!q.promoError,400,q.promoError);
      for(const row of q.rows){requireThat(row.product_active&&row.variant_active,409,'A product is no longer available.');const change=run(db,'UPDATE variants SET stock=stock-? WHERE id=? AND stock>=?',row.quantity,row.variant_id,row.quantity);requireThat(change.changes,409,'Inventory changed. Review your cart.');run(db,'UPDATE products SET version=version+1 WHERE id=?',row.product_id);}
      run(db,`INSERT INTO orders(id,user_id,checkout_key,request_hash,status,payment_method,subtotal,discount,shipping,total,address,note,coupon) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,orderId,uid,b.checkoutKey,requestHash,b.paymentMethod==='cod'?'confirmed':'payment_creating',b.paymentMethod,q.subtotal,q.discount,q.shipping,q.total,JSON.stringify(b.address),b.orderNote,q.promoCode);
      for(const row of q.rows){const p=one(db,'SELECT * FROM products WHERE id=?',row.product_id);run(db,'INSERT INTO order_items VALUES(?,?,?,?,?,?,?,?,?)',id(),orderId,row.variant_id,p.id,p.title,row.name,p.price,row.quantity,JSON.parse(p.details).images[0]);}
      run(db,'DELETE FROM cart_items WHERE cart_id=?',req.ctx.cart);run(db,"UPDATE carts SET promo='',note='' WHERE id=?",req.ctx.cart);
      if(b.paymentMethod==='cod')enqueue(db,b.address.email,`Order ${orderId} confirmed`,`Your cash-on-delivery order for ₹${q.total/100} is confirmed. Follow progress in your account.`);
    });
    if(b.paymentMethod==='cod')notifyAdminOrder(db,orderId);
    if(b.paymentMethod==='upi') {
      try {
        const o=one(db,'SELECT * FROM orders WHERE id=?',orderId),remote=await gateway.createOrder(o.total,orderId);
        requireThat(remote.id&&remote.amount===o.total&&remote.currency==='INR',502,'Payment provider returned an inconsistent order.');
        run(db,"UPDATE orders SET provider_order_id=?,status='payment_pending' WHERE id=?",remote.id,orderId);
      }catch(e){run(db,"UPDATE orders SET status='payment_initialization_failed' WHERE id=? AND status='payment_creating'",orderId);throw new HttpError(502,`Payment initialization was not confirmed. Your order ${orderId} is saved. Check your account before retrying.`);}
    }
    res.status(201).json({order:orderView(db,one(db,'SELECT * FROM orders WHERE id=?',orderId)),key:gateway.key});
  }));
  app.get('/api/orders',auth,(req,res)=>res.json(all(db,'SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC',req.ctx.user.id).map(o=>orderView(db,o))));
  function ownOrder(req:Request){const o=one(db,'SELECT * FROM orders WHERE id=? AND user_id=?',req.params.id,req.ctx.user.id);requireThat(o,404,'Order not found');return o;}
  app.get('/api/orders/:id',auth,wrap((req,res)=>res.json({order:orderView(db,ownOrder(req)),key:gateway.key})));
  app.post('/api/orders/:id/verify',auth,wrap(async(req,res)=>{
    const b=z.object({razorpay_payment_id:z.string().regex(/^pay_[a-zA-Z0-9]+$/),razorpay_order_id:z.string(),razorpay_signature:z.string()}).strict().parse(req.body),o=ownOrder(req);
    requireThat(o.provider_order_id===b.razorpay_order_id && validSignature(`${o.provider_order_id}|${b.razorpay_payment_id}`,b.razorpay_signature,gateway.secret),400,'Invalid payment signature');
    markCaptured(db,await gateway.getPayment(b.razorpay_payment_id));res.json(orderView(db,ownOrder(req)));
  }));
  app.post('/api/orders/:id/reconcile',auth,wrap(async(req,res)=>{
    const o=ownOrder(req);requireThat(o.provider_order_id,409,'Payment order is not available. Contact support.');
    const result=await gateway.getOrderPayments(o.provider_order_id),paid=result.items.find((p:any)=>p.status==='captured');
    if(paid) markCaptured(db,paid);res.json(orderView(db,ownOrder(req)));
  }));
  function cancel(o:any){transaction(db,()=>{const fresh=one(db,'SELECT * FROM orders WHERE id=?',o.id);requireThat(['payment_pending','payment_initialization_failed','confirmed','processing'].includes(fresh.status)&&fresh.payment_status==='unpaid',409,'This order cannot be cancelled. Paid orders require a refund.');releaseStock(db,fresh);run(db,"UPDATE orders SET status='cancelled',updated_at=CURRENT_TIMESTAMP WHERE id=?",fresh.id);});}
  app.post('/api/orders/:id/cancel',auth,wrap((req,res)=>{cancel(ownOrder(req));res.json(orderView(db,ownOrder(req)));}));
  app.get('/api/reviews',(_req,res)=>res.json(reviews(db)));
  app.post('/api/reviews',auth,limit('review',10,3600),wrap((req,res)=>{
    const b=z.object({productId:z.string(),author:z.string().trim().min(2).max(80),location:z.string().trim().min(2).max(100),rating:z.number().int().min(1).max(5),title:z.string().trim().min(2).max(150),comment:z.string().trim().min(10).max(3000)}).strict().parse(req.body);
    requireThat(one(db,"SELECT 1 FROM order_items i JOIN orders o ON o.id=i.order_id WHERE o.user_id=? AND i.product_id=? AND o.status='delivered'",req.ctx.user.id,b.productId),403,'Only customers with a delivered order can review this product.');
    requireThat(!one(db,'SELECT 1 FROM reviews WHERE user_id=? AND product_id=?',req.ctx.user.id,b.productId),409,'You have already reviewed this product.');run(db,'INSERT INTO reviews(id,user_id,product_id,author,location,rating,title,comment) VALUES(?,?,?,?,?,?,?,?)',id(),req.ctx.user.id,b.productId,b.author,b.location,b.rating,b.title,b.comment);res.status(201).json(reviews(db));
  }));
  app.post('/api/reviews/:id/helpful',auth,wrap((req,res)=>{requireThat(one(db,'SELECT 1 FROM reviews WHERE id=?',req.params.id),404,'Review not found');run(db,'INSERT OR IGNORE INTO review_votes VALUES(?,?)',req.ctx.user.id,req.params.id);res.json(reviews(db));}));
  app.post('/api/contact',limit('contact',5,3600),wrap((req,res)=>{const b=z.object({name:z.string().trim().min(2).max(100),email,phone:z.string().max(30),comment:z.string().trim().min(10).max(5000)}).strict().parse(req.body);run(db,'INSERT INTO contact_messages(id,name,email,phone,comment) VALUES(?,?,?,?,?)',id(),b.name,b.email,b.phone,b.comment);if(process.env.SUPPORT_EMAIL)enqueue(db,process.env.SUPPORT_EMAIL,'New customer message',`${b.name} (${b.email}):\n${b.comment}`);res.status(201).json({ok:true});}));
  app.post('/api/newsletter',limit('newsletter',5,3600),wrap((req,res)=>{const b=z.object({email}).strict().parse(req.body);requireThat(process.env.RESEND_API_KEY && process.env.MAIL_FROM,503,'Email subscriptions are temporarily unavailable.');if(!one(db,'SELECT 1 FROM subscribers WHERE email=?',b.email)){const raw=token();transaction(db,()=>{run(db,'INSERT INTO subscribers(email,token_hash) VALUES(?,?)',b.email,hash(raw));enqueue(db,b.email,'Welcome to FAS ESSENTIALS',`Thanks for subscribing. Use FAS10 for 10% off.\nUnsubscribe: ${origin}/#account?unsubscribe=${raw}`);});}res.json({ok:true});}));
  app.post('/api/newsletter/unsubscribe',wrap((req,res)=>{const b=z.object({token:z.string().length(64)}).parse(req.body);run(db,'DELETE FROM subscribers WHERE token_hash=?',hash(b.token));res.json({ok:true});}));
  app.use('/api/admin',auth,admin);
  app.get('/api/admin/products',(_req,res)=>res.json(all(db,'SELECT * FROM products ORDER BY created_at').map(p=>({id:p.id,handle:p.handle,title:p.title,categoryId:p.category_id,price:p.price,comparePrice:p.compare_price,active:!!p.active,featured:!!p.featured,version:p.version,details:JSON.parse(p.details),variants:all(db,'SELECT * FROM variants WHERE product_id=?',p.id).map(v=>({id:v.id,name:v.name,hex:v.hex,stock:v.stock,active:!!v.active}))}))));
  app.put('/api/admin/products/:id',wrap((req,res)=>{
    const b=productSchema.parse(req.body);requireThat(req.params.id===b.id,400,'Product ID mismatch');
    transaction(db,()=>{const prev=one(db,'SELECT * FROM products WHERE id=?',b.id);requireThat(!prev||b.version===prev.version,409,'Product changed. Reload before saving.');requireThat(one(db,'SELECT 1 FROM categories WHERE id=?',b.categoryId),400,'Category not found');
      // Preserve removed variants for historical order references; deactivate instead.
      for(const v of b.variants){const old=one(db,'SELECT * FROM variants WHERE id=?',v.id);requireThat(!old||old.product_id===b.id,400,'Variant belongs to another product');}
      run(db,`INSERT INTO products(id,handle,category_id,title,price,compare_price,active,featured,details) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET handle=excluded.handle,category_id=excluded.category_id,title=excluded.title,price=excluded.price,compare_price=excluded.compare_price,active=excluded.active,featured=excluded.featured,details=excluded.details,version=version+1`,b.id,b.handle,b.categoryId,b.title,b.price,b.comparePrice,Number(b.active),Number(b.featured),JSON.stringify(b.details));
      run(db,'UPDATE variants SET active=0 WHERE product_id=?',b.id);
      for(const v of b.variants)run(db,'INSERT INTO variants(id,product_id,name,hex,stock,active) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,hex=excluded.hex,stock=excluded.stock,active=excluded.active',v.id,b.id,v.name,v.hex,v.stock,Number(v.active));
      audit(req,'product.save',b.id);
    });res.json({ok:true});
  }));
  app.delete('/api/admin/products/:id',wrap((req,res)=>{run(db,'UPDATE products SET active=0,version=version+1 WHERE id=?',req.params.id);audit(req,'product.archive',String(req.params.id));res.json({ok:true});}));
  app.post('/api/admin/categories',wrap((req,res)=>{const b=z.object({name:z.string().trim().min(2).max(80)}).strict().parse(req.body);const cid=id();run(db,'INSERT INTO categories VALUES(?,?)',cid,b.name);audit(req,'category.create',cid);res.status(201).json({id:cid,name:b.name});}));
  app.patch('/api/admin/categories/:id',wrap((req,res)=>{const b=z.object({name:z.string().trim().min(2).max(80)}).parse(req.body);run(db,'UPDATE categories SET name=? WHERE id=?',b.name,req.params.id);res.json({ok:true});}));
  app.get('/api/admin/orders',(_req,res)=>res.json(all(db,'SELECT * FROM orders ORDER BY created_at DESC LIMIT 500').map(o=>orderView(db,o))));
  app.patch('/api/admin/orders/:id',wrap((req,res)=>{
    const b=z.object({status:z.enum(['processing','shipped','delivered','cancelled']),trackingUrl:z.union([z.literal(''),z.string().url().startsWith('https://')]).default('')}).strict().parse(req.body),o=one(db,'SELECT * FROM orders WHERE id=?',req.params.id);requireThat(o,404,'Order not found');
    if(b.status==='cancelled')cancel(o);else {
      const allowed:Record<string,string>={confirmed:'processing',processing:'shipped',shipped:'delivered'};
      requireThat(allowed[o.status]===b.status,409,'Invalid order status transition');requireThat(o.payment_method==='cod'||o.payment_status==='paid',409,'Payment has not been captured.');requireThat(b.status!=='shipped'||b.trackingUrl,400,'Tracking URL is required to ship.');
      run(db,"UPDATE orders SET status=?,tracking_url=CASE WHEN ?='' THEN tracking_url ELSE ? END,payment_status=CASE WHEN ?='delivered' AND payment_method='cod' THEN 'paid' ELSE payment_status END,updated_at=CURRENT_TIMESTAMP WHERE id=?",b.status,b.trackingUrl,b.trackingUrl,b.status,o.id);
      enqueue(db,JSON.parse(o.address).email,`Order ${o.id}: ${b.status}`,`Your order is ${b.status}. ${b.trackingUrl}`);
    }audit(req,`order.${b.status}`,o.id);res.json({ok:true});
  }));
  app.post('/api/admin/orders/:id/refund',wrap(async(req,res)=>{
    const o=one(db,'SELECT * FROM orders WHERE id=?',req.params.id);requireThat(o?.payment_id&&o.payment_status==='paid'&&!['shipped','delivered'].includes(o.status),409,'Only paid, unshipped online orders can be refunded here.');
    run(db,"UPDATE orders SET status='refund_pending',payment_status='refund_pending' WHERE id=?",o.id);audit(req,'order.refund_requested',o.id);
    // Never blindly retry a timed-out refund; reconcile the provider result first.
    const refund=await gateway.refund(o.payment_id,o.total,o.id);run(db,'UPDATE orders SET refund_id=? WHERE id=?',refund.id,o.id);if(refund.status==='processed')markRefunded(db,refund);res.json({ok:true});
  }));
  app.post('/api/admin/orders/:id/reconcile',wrap(async(req,res)=>{
    const b=z.object({providerOrderId:z.string().regex(/^order_[a-zA-Z0-9]+$/).optional()}).strict().parse(req.body||{});
    let o=one(db,'SELECT * FROM orders WHERE id=?',req.params.id);requireThat(o,404,'Order not found');
    if(b.providerOrderId){requireThat(!o.provider_order_id&&o.payment_method==='upi',409,'Order is already linked or is COD.');const remote=await gateway.getOrder(b.providerOrderId);requireThat(remote.receipt===o.id&&remote.amount===o.total&&remote.currency==='INR',400,'Provider receipt, amount, or currency does not match.');run(db,"UPDATE orders SET provider_order_id=?,status=CASE WHEN status IN ('payment_initialization_failed','payment_creating') THEN 'payment_pending' ELSE status END WHERE id=?",remote.id,o.id);}
    o=one(db,'SELECT * FROM orders WHERE id=?',o.id);
    if(o.provider_order_id){const payments=await gateway.getOrderPayments(o.provider_order_id);const paid=payments.items.find((p:any)=>p.status==='captured');if(paid)markCaptured(db,paid);}
    o=one(db,'SELECT * FROM orders WHERE id=?',o.id);
    if(o.payment_id){const refunds=await gateway.getRefunds(o.payment_id);const full=refunds.items.find((r:any)=>r.amount===o.total);if(full?.status==='processed')markRefunded(db,full);else if(full)run(db,'UPDATE orders SET refund_id=? WHERE id=?',full.id,o.id);}
    audit(req,'order.reconcile',o.id);res.json(orderView(db,one(db,'SELECT * FROM orders WHERE id=?',o.id)));
  }));
  app.get('/api/admin/users',(_req,res)=>res.json(all(db,'SELECT id,name,email,role,active,created_at FROM users ORDER BY created_at DESC LIMIT 500')));
  app.patch('/api/admin/users/:id',wrap((req,res)=>{const b=z.object({role:z.enum(['admin','customer']),active:z.boolean()}).strict().parse(req.body);requireThat(req.params.id!==req.ctx.user.id,400,'You cannot change your own administrative access.');transaction(db,()=>{run(db,'UPDATE users SET role=?,active=? WHERE id=?',b.role,Number(b.active),req.params.id);run(db,'DELETE FROM sessions WHERE user_id=?',req.params.id);audit(req,'user.update',String(req.params.id));});res.json({ok:true});}));
  app.get('/api/admin/messages',(_req,res)=>res.json(all(db,'SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 500')));
  app.patch('/api/admin/messages/:id',wrap((req,res)=>{const b=z.object({status:z.enum(['open','resolved'])}).parse(req.body);run(db,'UPDATE contact_messages SET status=? WHERE id=?',b.status,req.params.id);res.json({ok:true});}));
  app.get('/api/admin/operations',(_req,res)=>res.json({pendingEmails:one(db,'SELECT COUNT(*) n FROM outbox WHERE sent_at IS NULL').n,audit:all(db,'SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 100')}));
  app.use('/api',(_req,res)=>res.status(404).json({error:'API route not found'}));
  if(production){app.use(express.static(resolve('dist'),{index:false,maxAge:'1h'}));app.get('*',(_req,res)=>res.sendFile(resolve('dist/index.html')));}
  app.use((err:any,_req:Request,res:Response,_next:NextFunction)=>{
    if(err instanceof ZodError)return res.status(400).json({error:err.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join('; ')});
    if(err instanceof HttpError)return res.status(err.status).json({error:err.message});
    if(err?.code?.startsWith('SQLITE_CONSTRAINT')||String(err?.message).includes('UNIQUE constraint'))return res.status(409).json({error:'This record already exists or conflicts with existing data.'});
    if(err?.type==='entity.parse.failed')return res.status(400).json({error:'Invalid JSON'});
    console.error('Request failed:',err?.name,err?.code||'internal');res.status(500).json({error:'Something went wrong. Please try again.'});
  });
  return app;
}
