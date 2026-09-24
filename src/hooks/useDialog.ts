import {useEffect,useRef} from 'react';
export function useDialog(selector:string,open:boolean,onClose:()=>void,label:string){
  const close=useRef(onClose);close.current=onClose;
  useEffect(()=>{
    if(!open)return;
    const panel=document.querySelector<HTMLElement>(selector);if(!panel)return;
    const previous=document.activeElement as HTMLElement|null;
    panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label',label);panel.tabIndex=-1;
    const targets=()=>Array.from(panel.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select,textarea,a[href],[tabindex="0"]')).filter(e=>e.getClientRects().length>0);
    (targets()[0]||panel).focus();
    const key=(e:KeyboardEvent)=>{
      const dialogs=document.querySelectorAll('[role="dialog"]');if(dialogs[dialogs.length-1]!==panel)return;
      if(e.key==='Escape'){e.preventDefault();close.current();}
      if(e.key==='Tab'){const list=targets();if(!list.length){e.preventDefault();panel.focus();return;}const first=list[0],last=list[list.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===panel)){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
    };
    document.addEventListener('keydown',key);
    return()=>{document.removeEventListener('keydown',key);previous?.focus();};
  },[selector,open,label]);
}
