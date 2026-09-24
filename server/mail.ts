import {all,one,run,type DB} from './db';

// The existing outbox primary key is the notification's unique order key.
// Called only after the order/payment transaction has committed.
export function notifyAdminOrder(db:DB,orderId:string){
  try{
    if(!process.env.ADMIN_EMAIL)return;
    const o=one(db,'SELECT * FROM orders WHERE id=?',orderId);
    if(!o||(o.payment_method!=='cod'&&o.payment_status!=='paid'))return;
    const a=JSON.parse(o.address),money=(n:number)=>`INR ${(n/100).toFixed(2)}`;
    const items=all(db,'SELECT * FROM order_items WHERE order_id=?',o.id);
    const body=[`Order: ${o.id}`,`Date/time (UTC): ${o.created_at}`,`Customer: ${a.fullName}`,`Email: ${a.email}`,`Phone: ${a.phone}`,`Shipping address: ${a.address}, ${a.city}, ${a.state} ${a.postalCode}`,'Items:',...items.map(i=>`${i.title} | Variant: ${i.variant_id} | Color: ${i.color} | Qty: ${i.quantity} | Unit price: ${money(i.price)} | Line total: ${money(i.price*i.quantity)}`),`Subtotal: ${money(o.subtotal)}`,`Discount: ${money(o.discount)}`,`Shipping: ${money(o.shipping)}`,`Total: ${money(o.total)}`,`Payment method: ${o.payment_method}`,`Payment status: ${o.payment_status}`,`Order status: ${o.status}`].join('\n');
    run(db,'INSERT OR IGNORE INTO outbox(id,recipient,subject,body) VALUES(?,?,?,?)',`admin-order:${o.id}`,process.env.ADMIN_EMAIL,`New order ${o.id}`,body);
  }catch{console.error('Admin order notification could not be queued.');}
}

export function createMailDelivery(db:DB,transport:typeof fetch=fetch){
  let sending=false;
  return async function deliverMail(){
    if(sending||!process.env.RESEND_API_KEY||!process.env.MAIL_FROM)return;
    sending=true;
    try{for(const job of all(db,'SELECT * FROM outbox WHERE sent_at IS NULL AND next_attempt<? LIMIT 10',Date.now())){
      const adminNotice=job.id.startsWith('admin-order:');
      // Claim durably before sending: an ambiguous failure must not cause a
      // duplicate after Resend's 24-hour idempotency window has expired.
      if(adminNotice&&!run(db,'UPDATE outbox SET next_attempt=? WHERE id=? AND next_attempt=? AND sent_at IS NULL',Number.MAX_SAFE_INTEGER,job.id,job.next_attempt).changes)continue;
      try{
        const response=await transport('https://api.resend.com/emails',{method:'POST',signal:AbortSignal.timeout(10000),headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':job.id},body:JSON.stringify({from:process.env.MAIL_FROM,to:[job.recipient],subject:job.subject,text:job.body})});
        if(!response.ok)throw new Error('Mail delivery failed');
        run(db,'UPDATE outbox SET sent_at=CURRENT_TIMESTAMP WHERE id=?',job.id);
      }catch{
        console.error(adminNotice?'Admin mail delivery unconfirmed; inspect Resend before manually retrying.':'Mail delivery failed; notification remains in outbox.');
        run(db,'UPDATE outbox SET attempts=attempts+1,next_attempt=? WHERE id=?',adminNotice?Number.MAX_SAFE_INTEGER:Date.now()+Math.min(86400000,60000*2**Math.min(job.attempts,10)),job.id);
      }
    }}catch{console.error('Mail outbox processing failed.');}finally{sending=false;}
  };
}
