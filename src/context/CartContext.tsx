import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Product, CartItem } from '../types';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';
const empty = {items:[] as CartItem[],subtotal:0,discount:0,shipping:0,total:0,promoCode:'',promoDiscountRate:0,promoError:'',orderNote:''};
function useCartState() {
  const {user,ready}=useAuth();
  const [cart,setCart]=useState(empty),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const [orderNote,setOrderNote]=useState('');
  const [isCartOpen,setIsCartOpen]=useState(false),[isSearchOpen,setIsSearchOpen]=useState(false),[isCheckoutOpen,setIsCheckoutOpen]=useState(false),[selectedProduct,setSelectedProduct]=useState<Product|null>(null);
  const queue=useRef<Promise<any>>(Promise.resolve());
  async function refreshCart(){try{const c=await api('/cart');setCart(c);setOrderNote(c.orderNote);setError('');}catch(e){setError((e as Error).message);}}
  useEffect(()=>{if(ready) void refreshCart();},[ready,user?.id]);
  function mutate(path:string,method:string,body?:unknown):Promise<boolean>{
    setBusy(true);
    const task=queue.current.then(async()=>{try{const c=await api(path,method,body);setCart(c);setError('');return true;}catch(e){setError((e as Error).message);return false;}});
    queue.current=task;
    void task.finally(()=>{if(queue.current===task)setBusy(false);});return task;
  }
  const itemCount=cart.items.reduce((n,i)=>n+i.quantity,0);
  return {...cart,orderNote,setOrderNote,error,busy,refreshCart,itemCount,freeShippingThreshold:499,amountToFreeShipping:Math.max(0,499-cart.subtotal),isFreeShipping:cart.shipping===0,
    isCartOpen,openCart:()=>setIsCartOpen(true),closeCart:()=>setIsCartOpen(false),toggleCart:()=>setIsCartOpen(x=>!x),
    isSearchOpen,openSearch:()=>setIsSearchOpen(true),closeSearch:()=>setIsSearchOpen(false),
    isCheckoutOpen,openCheckout:()=>{setIsCartOpen(false);if(!user){window.location.hash='account';setError('Sign in or create an account to checkout.');return;}setIsCheckoutOpen(true);},closeCheckout:()=>setIsCheckoutOpen(false),
    selectedProduct,openProductModal:(p:Product)=>setSelectedProduct(p),closeProductModal:()=>setSelectedProduct(null),
    addToCart:async(p:Product,quantity=1,color?:string)=>{const ok=await mutate('/cart/items','POST',{productId:p.id,quantity,color:color||p.colors?.[0]?.name});if(ok)setIsCartOpen(true);return ok;},
    updateQuantity:(item:string,quantity:number)=>mutate(`/cart/items/${item}`,quantity<=0?'DELETE':'PATCH',quantity>0?{quantity}:undefined),
    removeFromCart:(item:string)=>mutate(`/cart/items/${item}`,'DELETE'),
    applyPromoCode:(promoCode:string)=>mutate('/cart','PATCH',{promoCode}),removePromoCode:()=>mutate('/cart','PATCH',{promoCode:''}),
    saveNote:()=>mutate('/cart','PATCH',{orderNote})
  };
}
const CartContext=createContext<ReturnType<typeof useCartState>>(null!);
export const CartProvider=({children}:{children:React.ReactNode})=><CartContext.Provider value={useCartState()}>{children}</CartContext.Provider>;
export const useCart=()=>useContext(CartContext);
