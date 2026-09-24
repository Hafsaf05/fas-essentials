import React,{lazy,Suspense,useState} from 'react';
import {useAuth} from '../context/AuthContext';
import {api} from '../lib/api';
const Admin=lazy(()=>import('./Admin').then(m=>({default:m.Admin})));
export function AdminEntry(){
  const {user,ready,error:sessionError,refresh,logout}=useAuth();
  const [error,setError]=useState(''),[busy,setBusy]=useState(false);
  if(!ready)return <p role="status">Loading…</p>;
  if(sessionError)return <p role="alert">{sessionError}</p>;
  if(user&&user.role!=='admin')return <p role="alert">Administrator access required.</p>;
  return <main className="min-h-screen bg-[#FAFAF8] text-zinc-900">
    {error&&<p role="alert" className="p-6 text-red-700">{error}</p>}
    {user?<><button className="px-4 py-2 rounded-xl bg-zinc-950 text-white" onClick={()=>void logout().catch(e=>setError(e.message))}>Logout</button><Suspense fallback={<p role="status">Loading administration…</p>}><Admin/></Suspense></>:<section className="max-w-md mx-auto p-6 space-y-6"><h1 className="font-display text-3xl font-bold">Admin Login</h1><form className="bg-white border rounded-3xl p-6 space-y-4" onSubmit={async e=>{e.preventDefault();const f=new FormData(e.currentTarget);setBusy(true);setError('');try{await api('/auth/admin-login','POST',{email:f.get('email'),password:f.get('password')});await refresh();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}>
      <label className="block">Email<input className="w-full p-3 rounded-xl border" name="email" type="email" autoComplete="username" required/></label>
      <label className="block">Password<input className="w-full p-3 rounded-xl border" name="password" type="password" autoComplete="current-password" required maxLength={128}/></label>
      <button className="px-4 py-2 rounded-xl bg-zinc-950 text-white disabled:opacity-50" disabled={busy}>{busy?'Please wait…':'Sign in'}</button>
    </form></section>}
  </main>;
}
