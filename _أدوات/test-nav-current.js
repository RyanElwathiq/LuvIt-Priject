/* محاكي DOM صغير · بيشغّل luvitNavCurrent الحقيقي من motion.js
   بلا متصفح، عشان أشوف المطابقة بعيني على كل حالة حدّية. */
const fs=require('fs');
const src=fs.readFileSync('D:/Ryan-Work/LUVIT/luvit/library/motion.js','utf8');
const i=src.indexOf('function luvitNavCurrent()');
const j=src.indexOf('if (document.readyState', i);
if(i<0||j<0) throw new Error('ما لقيت القسم');
const fnSrc=src.slice(i,j);

/* روابط الهيدر الجديد الحقيقية */
const LINKS=[
  ['.luvit-nav__link','/'],['.luvit-nav__link','/shop'],
  ['.luvit-nav__link','/routines'],['.luvit-nav__link','/products'],
  ['.luvit-nav__link','/about'],
  ['.luvit-drawer__link','/'],['.luvit-drawer__link','/shop'],
  ['.luvit-drawer__link','/routines'],['.luvit-drawer__link','/products'],
  ['.luvit-drawer__link','/quiz'],['.luvit-drawer__link','/about'],
  ['.luvit-drawer__link','/my-account'],['.luvit-drawer__link','/track'],
  ['.luvit-drawer__link','/shipping'],['.luvit-drawer__link','/faq'],
  ['.luvit-drawer__link','/contact'],
  ['.luvit-dock__item','/'],['.luvit-dock__item','/products'],
  ['.luvit-dock__item','/shop'],['.luvit-dock__item','/cart'],['.luvit-nav__icon-btn','/cart'],
  /* ودخلاء ما إلهم href مطلق · لازم ينتخطوا */
  ['.luvit-nav__link','#main'],['.luvit-nav__link','https://plasmajo.com/shop'],
];

function run(pathname){
  const els=LINKS.map(([cls,href])=>({
    cls, attrs:{href},
    getAttribute(k){ return k in this.attrs ? this.attrs[k] : null },
    setAttribute(k,v){ this.attrs[k]=v },
    removeAttribute(k){ delete this.attrs[k] },
  }));
  const sandbox={
    document:{ querySelectorAll:()=>els },
    window:{ location:{ pathname } },
  };
  const fn=new Function('document','window', fnSrc+'\nreturn luvitNavCurrent;')(sandbox.document,sandbox.window);
  fn();
  return els.filter(e=>'aria-current' in e.attrs).map(e=>e.cls+' '+e.attrs.href+' ='+e.attrs['aria-current']);
}

const CASES=[
  ['/',                       ['الرئيسية بالثلاثة']],
  ['/products',               ['المنتجات بالثلاثة']],
  ['/products/',              ['نفس /products']],
  ['/product/بكج-الروتين',     ['المتجر · اسم عربي خام']],
  ['/product/%d8%a8%d9%83%d8%ac', ['المتجر · اسم مرمّز']],
  ['/products/anything',      ['المنتجات · مسار فرعي']],
  ['/shop',                   ['المتجر']],
  ['/shop/',                  ['المتجر']],
  ['/cart',                   ['السلة · بالدوك بس']],
  ['/checkout',               ['ولا شي · ما إلها رابط']],
  ['/my-account',             ['حسابي · بالدرج']],
  ['/my-account/orders',      ['حسابي · مسار فرعي']],
  ['/checkout/order-received/123', ['السلة · المسار الحقيقي بووكومرس']],
  ['/order-received/123',     ['ولا شي · المسار القديم كان غلط']],
  ['/product-tag/x',          ['المتجر']],
  ['/PRODUCTS',               ['؟ حساسية الأحرف']],
  ['//',                      ['؟']],
  ['/faq',                    ['الأسئلة · مخفي بس معلّم']],
  ['/%zz-مكسور',              ['؟ decodeURI بيرمي']],
];

let fails=0;
for(const [p,note] of CASES){
  let r;
  try{ r=run(p) }catch(e){ r=['🔴 استثناء: '+e.message]; fails++ }
  const n=r.length;
  const flag = r[0]&&r[0].startsWith('🔴') ? '🔴' : (n===0?'·':'✅');
  console.log(flag+' '+p.padEnd(30)+' → '+(n?n+' عنصر: '+r.join(' | '):'ولا عنصر')+'   ['+note+']');
}
console.log('\nاستثناءات:',fails);
