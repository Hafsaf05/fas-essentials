import {notifyAdminOrder} from './mail';
import { randomUUID } from 'node:crypto';
import { DB, all, one, run, transaction } from './db';
import { requireThat } from './security';
export const id = () => randomUUID();
export function reviews(db: DB, productId?: string) {
  return all(db, `SELECT r.*, p.title AS productName, (SELECT COUNT(*) FROM review_votes v WHERE v.review_id=r.id) AS helpful FROM reviews r JOIN products p ON p.id=r.product_id WHERE p.active=1 ${productId?'AND r.product_id=?':''} ORDER BY r.created_at DESC`, ...(productId?[productId]:[])).map(r=>({...r,productId:r.product_id,verified:true,date:r.created_at.slice(0,10)}));
}
export function product(db: DB, p: any) {
  const variants=all(db,'SELECT * FROM variants WHERE product_id=? AND active=1',p.id);
  const rs=reviews(db,p.id), stock=variants.reduce((n,v)=>n+v.stock,0);
  return {...JSON.parse(p.details), id:p.id,handle:p.handle,title:p.title,category:one(db,'SELECT name FROM categories WHERE id=?',p.category_id).name,price:p.price/100,compareAtPrice:p.compare_price/100,featured:!!p.featured,inStock:!!p.active&&stock>0,stockCount:stock,colors:variants.map(v=>({id:v.id,name:v.name,hex:v.hex,stock:v.stock})),rating:rs.length?Math.round(rs.reduce((n,r)=>n+r.rating,0)/rs.length*100)/100:0,reviewCount:rs.length,customerReviews:rs};
}
export function cartId(db: DB, sessionHash: string, userId?: string) {
  let row=userId?one(db,'SELECT id FROM carts WHERE user_id=?',userId):one(db,'SELECT id FROM carts WHERE session_hash=?',sessionHash);
  if(!row) { row={id:id()}; run(db,'INSERT INTO carts(id,user_id,session_hash) VALUES(?,?,?)',row.id,userId||null,userId?null:sessionHash); }
  return row.id as string;
}
export function quote(db: DB, cart: string, userId?: string) {
  const c=one(db,'SELECT * FROM carts WHERE id=?',cart);
  const rows=all(db,`SELECT ci.*,v.name,v.stock,v.product_id,v.active AS variant_active,p.active AS product_active,p.price FROM cart_items ci JOIN variants v ON v.id=ci.variant_id JOIN products p ON p.id=v.product_id WHERE ci.cart_id=?`,cart);
  const subtotal=rows.reduce((n,r)=>n+r.price*r.quantity,0);
  const coupon=c.promo?one(db,'SELECT * FROM coupons WHERE code=? AND active=1',c.promo):null;
  let promoError='';
  if(c.promo && (!coupon || subtotal<coupon.minimum)) promoError='Coupon is invalid or minimum order amount is not met.';
  if(coupon?.first_order && (!userId||one(db,"SELECT 1 FROM orders WHERE user_id=? AND status NOT IN ('cancelled','refunded') LIMIT 1",userId))) promoError='This coupon requires an account with no previous orders.';
  const rate=coupon&&!promoError?coupon.percent/100:0;
  const discount=Math.round(subtotal*rate), shipping=rows.length && subtotal<49900?4900:0;
  return { rows,subtotal,discount,shipping,total:subtotal-discount+shipping,promoCode:c.promo,promoDiscountRate:rate,promoError,orderNote:c.note };
}
export function cartView(db: DB, cart: string, userId?: string) {
  const q=quote(db,cart,userId);
  return {...q,rows:undefined,items:q.rows.map(r=>({id:r.id,productId:r.product_id,variantId:r.variant_id,selectedColor:r.name,quantity:r.quantity,product:product(db,one(db,'SELECT * FROM products WHERE id=?',r.product_id))})),subtotal:q.subtotal/100,discount:q.discount/100,shipping:q.shipping/100,total:q.total/100};
}
export function orderView(db: DB, row: any) {
  return {...row,address:JSON.parse(row.address),items:all(db,'SELECT * FROM order_items WHERE order_id=?',row.id),request_hash:undefined,checkout_key:undefined};
}
export function releaseStock(db: DB, order: any) {
  if(!order.reserved) return;
  for(const item of all(db,'SELECT * FROM order_items WHERE order_id=?',order.id)) {run(db,'UPDATE variants SET stock=stock+? WHERE id=?',item.quantity,item.variant_id);run(db,'UPDATE products SET version=version+1 WHERE id=?',item.product_id);}
  run(db,'UPDATE orders SET reserved=0 WHERE id=?',order.id);
}
export function enqueue(db: DB, recipient: string, subject: string, body: string) { run(db,'INSERT INTO outbox(id,recipient,subject,body) VALUES(?,?,?,?)',id(),recipient,subject,body); }
export function markCaptured(db: DB, payment: any) {
  transaction(db,()=>{
    const order=one(db,'SELECT * FROM orders WHERE provider_order_id=?',payment.order_id);
    requireThat(order,404,'Order not found');
    requireThat(payment.status==='captured' && payment.currency==='INR' && payment.amount===order.total,400,'Payment amount, currency, or capture status does not match.');
    if(order.payment_id===payment.id && order.payment_status!=='unpaid') return;
    requireThat(!order.payment_id,409,'A different payment is already recorded.');
    // A late capture on a cancelled order must never silently recreate fulfillment.
    const status=order.status==='cancelled'?'payment_review':'confirmed';
    run(db,"UPDATE orders SET status=?,payment_status='paid',payment_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",status,payment.id,order.id);
    enqueue(db,JSON.parse(order.address).email,`Payment received for ${order.id}`,`We received ₹${order.total/100}. Order status: ${status}. View your account for fulfillment updates.`);
  });
  const committed=one(db,'SELECT id FROM orders WHERE provider_order_id=?',payment.order_id);
  if(committed)notifyAdminOrder(db,committed.id);
}
export function markRefunded(db: DB, refund: any) {
  transaction(db,()=>{
    const o=one(db,'SELECT * FROM orders WHERE payment_id=?',refund.payment_id);
    requireThat(o && refund.amount===o.total,400,'Refund does not match a full order refund.');
    if(o.payment_status==='refunded') return;
    requireThat(refund.status==='processed',400,'Refund is not processed.');
    // Delivered/shipped returns require physical stock inspection, not automatic restocking.
    if(!['shipped','delivered'].includes(o.status)) releaseStock(db,o);
    run(db,"UPDATE orders SET status='refunded',payment_status='refunded',refund_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",refund.id,o.id);
  });
}
