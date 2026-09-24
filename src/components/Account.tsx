import React,{useEffect,useState} from 'react';
import {api} from '../lib/api';
import {useAuth} from '../context/AuthContext';
import {useCart} from '../context/CartContext';
import {payOrder} from '../lib/payments';
import {Product} from '../types';
const input='w-full p-3 rounded-xl border border-zinc-300 bg-zinc-50';
const button='px-4 py-2 rounded-xl bg-zinc-950 text-white text-xs font-bold disabled:opacity-50';
export function Account({view='account'}:{view?:string}){
  const {user,refresh,logout}=useAuth(),{openProductModal,refreshCart,openCheckout,items}=useCart();
  const [mode,setMode]=useState(view==='signup'?'register':'login'),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[orders,setOrders]=useState<any[]>([]),[wishlist,setWishlist]=useState<Product[]>([]);
  const params=new URLSearchParams(window.location.hash.split('?')[1]||'');
  const reset=params.get('reset'),unsubscribe=params.get('unsubscribe');
  async function load(){if(user){const [o,w]=await Promise.all([api('/orders'),api('/wishlist')]);setOrders(o);setWishlist(w);}}
  useEffect(()=>{const update=()=>{void load().catch(e=>setError(e.message));};update();window.addEventListener('store:changed',update);return()=>window.removeEventListener('store:changed',update);},[user?.id]);
  async function action(f:()=>Promise<unknown>){setBusy(true);setError('');setMessage('');try{await f();await load();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);await action(async()=>{
    if(reset){await api('/auth/reset-password','POST',{token:reset,password:f.get('password')});window.location.hash='account';setMessage('Password reset. Sign in with your new password.');return;}
    if(mode==='forgot'){const r=await api('/auth/forgot-password','POST',{email:f.get('email')});setMessage(r.message);return;}
    await api('/auth/'+(mode==='register'?'register':'login'),'POST',{email:f.get('email'),password:f.get('password'),...(mode==='register'?{name:f.get('name')}:{})});await refresh();await refreshCart();
  });}
  return <section className="max-w-5xl mx-auto p-6 sm:p-10 space-y-6">
    <h1 className="font-display text-3xl font-extrabold">{view==='orders'?'My Orders':'My Account'}</h1>
    {error&&<p role="alert" className="text-red-700 bg-red-50 p-3 rounded-xl">{error}</p>}{message&&<p role="status" className="text-emerald-700">{message}</p>}
    {unsubscribe?<button className={button} disabled={busy} onClick={()=>action(async()=>{await api('/newsletter/unsubscribe','POST',{token:unsubscribe});setMessage('You have been unsubscribed.');window.location.hash='account';})}>Unsubscribe from offers</button>:!user||reset?<form onSubmit={submit} className="max-w-md bg-white border rounded-3xl p-6 space-y-4">
      <h2 className="font-bold text-xl">{reset?'Reset password':mode==='register'?'Create account':mode==='forgot'?'Recover account':'Sign in'}</h2>
      {mode==='register'&&!reset&&<label className="block text-sm">Name<input name="name" required minLength={2} autoComplete="name" className={input}/></label>}
      {!reset&&<label className="block text-sm">Email<input name="email" type="email" required autoComplete="email" className={input}/></label>}
      {(mode!=='forgot'||reset)&&<label className="block text-sm">Password<input aria-label="Password" name="password" type="password" required minLength={mode==='register'||reset?12:1} maxLength={128} autoComplete={mode==='register'||reset?'new-password':'current-password'} className={input}/><small>New passwords must contain at least 12 characters.</small></label>}
      <button disabled={busy} className={button}>{busy?'Please wait…':reset?'Reset password':mode==='forgot'?'Send reset link':mode==='register'?'Create account':'Sign in'}</button>
      {!reset&&<div className="flex gap-4 text-xs">{['login','register','forgot'].filter(x=>x!==mode).map(x=><button key={x} type="button" onClick={()=>setMode(x)} className="underline">{x==='login'?'Sign in':x==='register'?'Create account':'Forgot password?'}</button>)}</div>}
    </form>:<>
      <div className="flex flex-wrap gap-4 items-center"><p>Welcome, {user.name}</p><button disabled={busy} className={button} onClick={()=>action(logout)}>Sign out</button>{items.length>0&&<button className={button} onClick={openCheckout}>Continue to checkout</button>}</div>
      <h2 className="text-xl font-bold">Orders</h2>{!orders.length&&<p>No orders yet.</p>}
      {orders.map(o=><article key={o.id} className="bg-white border rounded-2xl p-5 space-y-3"><div className="flex flex-wrap justify-between gap-2"><strong className="break-all">{o.id}</strong><span>₹{(o.total/100).toFixed(2)}</span></div><p className="text-sm">{o.status.replaceAll('_',' ')} · Payment: {o.payment_status} · {o.created_at}</p><ul className="text-sm">{o.items.map((i:any)=><li key={i.id}>{i.title} — {i.color} × {i.quantity}</li>)}</ul><p className="text-xs">Ship to: {o.address.address}, {o.address.city}, {o.address.postalCode}</p>{o.tracking_url&&<a href={o.tracking_url} target="_blank" rel="noreferrer" className="underline">Track shipment</a>}
        <div className="flex flex-wrap gap-2">{o.status==='payment_pending'&&<button disabled={busy} className={button} onClick={()=>action(async()=>{const r=await api(`/orders/${o.id}`);await payOrder(r.order,r.key);})}>Resume secure payment</button>}{o.provider_order_id&&o.payment_status==='unpaid'&&<button disabled={busy} className={button} onClick={()=>action(()=>api(`/orders/${o.id}/reconcile`,'POST'))}>Check payment status</button>}{['payment_pending','payment_initialization_failed','confirmed','processing'].includes(o.status)&&o.payment_status==='unpaid'&&<button disabled={busy} className={button} onClick={()=>action(()=>api(`/orders/${o.id}/cancel`,'POST'))}>Cancel unpaid order</button>}</div>
        {o.status==='payment_review'&&<p className="text-amber-800">Payment arrived after cancellation. Support must arrange a refund; this order will not be shipped automatically.</p>}
      </article>)}
      <h2 className="text-xl font-bold">Wishlist</h2>{!wishlist.length&&<p>No saved products yet. Use “Save to wishlist” on a product.</p>}{wishlist.map(p=><div key={p.id} className="bg-white border rounded-xl p-4 flex justify-between gap-3"><button onClick={()=>openProductModal(p)} className="text-left">{p.shortTitle} · ₹{p.price}</button><button className="text-xs underline" onClick={()=>action(()=>api(`/wishlist/${p.id}`,'DELETE'))}>Remove</button></div>)}
      <details className="bg-white border rounded-xl p-4"><summary>Change password</summary><form className="max-w-md space-y-3 mt-4" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);void action(async()=>{await api('/auth/change-password','POST',{currentPassword:f.get('currentPassword'),password:f.get('password')});setMessage('Password updated. Other sessions have been signed out.');});}}><label className="block">Current password<input required name="currentPassword" type="password" autoComplete="current-password" className={input}/></label><label className="block">New password<input required minLength={12} maxLength={128} name="password" type="password" autoComplete="new-password" className={input}/></label><button disabled={busy} className={button}>Update password</button></form></details>
    </>}
  </section>;
}
