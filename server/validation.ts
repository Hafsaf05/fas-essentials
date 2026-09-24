import { z } from 'zod';
export const email = z.string().trim().toLowerCase().email().max(254);
export const password = z.string().min(12).max(128);
export const addressSchema = z.object({ fullName:z.string().trim().min(2).max(100), email, phone:z.string().regex(/^(?:\+91[ -]?)?[6-9][0-9 ]{9,13}$/), address:z.string().trim().min(8).max(300), city:z.string().trim().min(2).max(80), state:z.string().trim().min(2).max(80), postalCode:z.string().regex(/^[1-9][0-9]{5}$/) }).strict();
const textList = z.array(z.string().trim().min(1).max(1000)).max(30);
export const productSchema = z.object({
  id:z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/), handle:z.string().regex(/^[a-z0-9-]{1,250}$/), title:z.string().trim().min(2).max(250), categoryId:z.string().min(1).max(80),
  price:z.number().int().positive().max(100000000), comparePrice:z.number().int().positive().max(100000000), active:z.boolean(), featured:z.boolean(), version:z.number().int().nonnegative().optional(),
  details:z.object({ shortTitle:z.string().trim().min(2).max(200), headline:z.string().max(300), description:z.string().max(5000), badge:z.string().max(60).optional(), features:textList, specs:z.record(z.string().max(60),z.string().max(1000)), careInstructions:textList, highlights:textList, images:z.array(z.string().url().startsWith('https://')).min(1).max(15) }),
  variants:z.array(z.object({id:z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/),name:z.string().trim().min(1).max(80),hex:z.string().regex(/^#[a-fA-F0-9]{6}$/),stock:z.number().int().min(0).max(1000000),active:z.boolean()})).min(1).max(30)
}).strict().refine(x=>x.comparePrice>=x.price,'Compare price must be at least price').refine(x=>new Set(x.variants.map(v=>v.id)).size===x.variants.length && new Set(x.variants.map(v=>v.name)).size===x.variants.length,'Duplicate variants');
