import { api } from './api';
let scriptPromise: Promise<void> | undefined;
async function loadCheckout() {
  if ((window as any).Razorpay) return;
  if (!scriptPromise) scriptPromise = new Promise<void>((resolve,reject)=>{
    const s=document.createElement('script');s.src='https://checkout.razorpay.com/v1/checkout.js';s.onload=()=>resolve();s.onerror=()=>{scriptPromise=undefined;reject(new Error('Unable to load secure checkout. Retry from your account.'));};document.head.appendChild(s);
  });
  await scriptPromise;
}
export async function payOrder(order:any,key:string):Promise<any> {
  await loadCheckout();
  return new Promise((resolve,reject)=>{
    const checkout=new (window as any).Razorpay({key,order_id:order.provider_order_id,amount:order.total,currency:'INR',name:'FAS ESSENTIALS',prefill:{name:order.address.fullName,email:order.address.email,contact:order.address.phone},theme:{color:'#18181B'},
      handler:async(result:any)=>{try{resolve(await api(`/orders/${order.id}/verify`,'POST',{razorpay_payment_id:result.razorpay_payment_id,razorpay_order_id:result.razorpay_order_id,razorpay_signature:result.razorpay_signature}));}catch(e){reject(e);}},
      modal:{ondismiss:()=>reject(new Error('Checkout closed. Your unpaid order is saved in your account.'))}
    });
    checkout.on('payment.failed',()=>reject(new Error('Payment failed. Retry or check payment status from your account.')));checkout.open();
  });
}
