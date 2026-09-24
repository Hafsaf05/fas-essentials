import 'dotenv/config';
import { SOURCE_PRODUCTS } from './catalog-source';
import { openDatabase, run, transaction } from '../server/db';
const db=openDatabase();
transaction(db,()=>{
  for(const p of SOURCE_PRODUCTS){
    const category=p.category.toLowerCase().replace(/[^a-z0-9]+/g,'-');
    run(db,'INSERT OR IGNORE INTO categories VALUES(?,?)',category,p.category);
    const {shortTitle,headline,description,badge,features,specs,careInstructions,highlights,images}=p;
    run(db,'INSERT OR IGNORE INTO products(id,handle,category_id,title,price,compare_price,active,featured,details) VALUES(?,?,?,?,?,?,0,?,?)',p.id,p.handle,category,p.title,p.price*100,p.compareAtPrice*100,Number(p.featured),JSON.stringify({shortTitle,headline,description,badge,features,specs,careInstructions,highlights,images}));
    for(const [i,c] of (p.colors||[{name:'Default',hex:'#18181B'}]).entries())run(db,'INSERT OR IGNORE INTO variants(id,product_id,name,hex,stock) VALUES(?,?,?,?,0)',`${p.id}-${i}`,p.id,c.name,c.hex);
  }
  for(const [code,percent,min,first] of [['FAS10',10,0,0],['FIRST10',10,0,1],['WELCOME10',10,0,1],['FAS15',15,70000,0]])run(db,'INSERT OR IGNORE INTO coupons(code,percent,minimum,first_order) VALUES(?,?,?,?)',code,percent,min,first);
});db.close();console.log('Imported original products as inactive, zero-stock records. Review and activate in Admin. No reviews or stock quantities were fabricated.');
