import { openDatabase, run } from '../server/db';
import { SOURCE_PRODUCTS } from '../scripts/catalog-source';
import {passwordHash} from '../server/security';
const db=openDatabase(process.env.DATABASE_PATH);
for(const p of SOURCE_PRODUCTS){const cat=p.category.toLowerCase().replace(/[^a-z0-9]+/g,'-');run(db,'INSERT OR IGNORE INTO categories VALUES(?,?)',cat,p.category);const {shortTitle,headline,description,badge,features,specs,careInstructions,highlights,images}=p;run(db,'INSERT OR IGNORE INTO products(id,handle,category_id,title,price,compare_price,active,featured,details) VALUES(?,?,?,?,?,?,1,1,?)',p.id,p.handle,cat,p.title,p.price*100,p.compareAtPrice*100,JSON.stringify({shortTitle,headline,description,badge,features,specs,careInstructions,highlights,images}));for(const [i,c] of p.colors.entries())run(db,'INSERT OR IGNORE INTO variants(id,product_id,name,hex,stock) VALUES(?,?,?,?,20)',`${p.id}-${i}`,p.id,c.name,c.hex);}
run(db,"INSERT OR IGNORE INTO coupons VALUES('FAS10',10,0,1,0)");
run(db,"INSERT OR IGNORE INTO users(id,email,name,password_hash,role) VALUES('e2e-admin','admin@example.test','Admin',?,'admin')",await passwordHash('e2e-password-123'));
db.close();
