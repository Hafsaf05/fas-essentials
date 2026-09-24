import React, { createContext, useContext, useEffect, useState } from 'react';
import { session, api } from '../lib/api';
type User = { id: string; email: string; name: string; role: string };
const Context = createContext<{ user: User | null; ready: boolean; onlinePayments: boolean; error: string; refresh: () => Promise<void>; logout: () => Promise<void> }>(null!);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null), [ready, setReady] = useState(false), [error, setError] = useState(''), [onlinePayments, setOnline] = useState(false);
  async function refresh() { try { const s = await session(); setUser(s.user); setOnline(s.onlinePayments); setError(''); } catch(e) {setError((e as Error).message);} finally {setReady(true);} }
  async function logout() {await api('/auth/logout','POST'); await refresh();}
  useEffect(()=>{void refresh();},[]);
  return <Context.Provider value={{user,ready,onlinePayments,error,refresh,logout}}>{children}</Context.Provider>;
}
export const useAuth=()=>useContext(Context);
