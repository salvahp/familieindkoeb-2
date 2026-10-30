/* Familieindkøb / Prisjagt
 * Uses Madpris's documented public, CORS-enabled read API.
 * No invented demo prices. Product matches are suggestions until checked.
 * All prices shown are date-stamped observations and may differ locally.
 */
window.FamiliePris = (() => {
  'use strict';
  const API = 'https://madpris.gratis.dk/api';
  const MAX_ITEMS = 30;
  const FRESH_DAYS = 7;
  const CACHE_MS = 15 * 60 * 1000;
  const currency = new Intl.NumberFormat('da-DK', {style:'currency',currency:'DKK',minimumFractionDigits:2});
  const shortDate = new Intl.DateTimeFormat('da-DK',{day:'numeric',month:'short',year:'numeric'});
  const shortTime = new Intl.DateTimeFormat('da-DK',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
  const s = v => String(v == null ? '' : v);
  const esc = v => s(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const asCents = price => (typeof price === 'number' && Number.isFinite(price) && price > 0) ? Math.round(price*100) : null;
  const money = cents => currency.format(cents/100);
  const humanDate = value => { try { const d=new Date(s(value).slice(0,10)+'T12:00:00');return Number.isFinite(+d)?shortDate.format(d):'ukendt'; } catch {return 'ukendt';} };
  const STORE_NAMES = {
    rema1000:'REMA 1000',netto:'Netto',lidl:'Lidl',foetex:'Føtex',føtex:'Føtex',bilka:'Bilka',
    '365discount':'365discount',kvickly:'Kvickly',superbrugsen:'SuperBrugsen',brugsen:'Brugsen',
    meny:'MENY',spar:'SPAR',minkobmand:'Min Købmand',nemlig:'Nemlig.com',abc:'ABC Lavpris',
    abclavpris:'ABC Lavpris',letkoeb:'Letkøb'
  };
  let refresh=()=>{}, alertUser=()=>{};
  let activeId=null, token=0;
  const byList=new Map();
  const queryCache=new Map();
  let excludedStores=new Set();
  function storeName(id) {return STORE_NAMES[s(id).toLowerCase()]||s(id).replace(/[-_]/g,' ');}
  function norm(v) {return s(v).toLocaleLowerCase('da-DK').trim().replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ');}
  const numeric=(v, fallback=0) => {const n=Number(v);return Number.isFinite(n)?n:fallback;};
  function dayDiff(from){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(s(from).slice(0,10)))return null;
    const then=Date.parse(s(from).slice(0,10)+'T12:00:00');
    if(!Number.isFinite(then))return null;
    return Math.floor((Date.now()-then)/86400000);
  }
  function validPrice(entry){
    if(!entry || !entry.store || !asCents(entry.price))return false;
    if (entry.price_status==='historical' || entry.price_status==='reverted_to_normal')return false;
    if (entry.lidl_availability==='future' || entry.lidl_availability==='out_of_stock')return false;
    const age=dayDiff(entry.price_last_seen_at || entry.price_observed_at);
    // Undated observations must not be presented as today's prices.
    return age!==null && age<=FRESH_DAYS && age>=-1;
  }
  function normalizeProduct(p){
    const offers=Array.isArray(p.store_products)?p.store_products:(Array.isArray(p.stores)?p.stores:[]);
    const normalizedStores=offers.map(o=>({
      store:s(o.store||o.chain_slug).toLowerCase(),
      name:s(o.store_product_name||o.name||p.name),
      price:typeof o.price==='number'?o.price:NaN,
      unit_price:typeof o.unit_price==='number'?o.unit_price:null,
      on_sale:o.on_sale===true,
      price_last_seen_at:s(o.price_last_seen_at||o.price_observed_at||''),
      price_status:s(o.price_status||''),
      lidl_availability:s(o.lidl_availability||''),
      valid:validPrice(o)
    })).filter(o=>o.store && Number.isFinite(o.price)).sort((a,b)=>a.price-b.price);
    return {
      key:s(p.group_id??p.ean??p.id??p.product_id??''),name:s(p.name),brand:s(p.brand),
      unit:s(p.unit),unit_size:numeric(p.unit_size,0),ean:s(p.ean),
      organic:p.organic===true,stores:normalizedStores
    };
  }
  function productSize(p){return p.unit_size>0 && p.unit ? `${new Intl.NumberFormat('da-DK',{maximumFractionDigits:2}).format(p.unit_size)} ${p.unit}` : '';}
  function matchScore(query,p){
    const q=norm(query),name=norm(p.name),other=norm(p.brand+' '+p.name);
    const words=q.split(' ').filter(Boolean);
    let score=0;
    if(name===q)score+=60;
    if(name.startsWith(q+' ')||name.startsWith(q))score+=34;
    if(name.includes(' '+q+' '))score+=22;
    if(words.length && words.every(w=>other.includes(w)))score+=23;
    if(words.length && words.some(w=>name.split(' ').includes(w)))score+=12;
    if(p.stores.filter(o=>o.valid).length>1)score+=7;
    if(p.organic && words.includes('økologisk'))score+=8;
    return score;
  }
  function rankProducts(query,items){
    return items.filter(p=>p.key && p.stores.some(o=>o.valid)).sort((a,b)=>matchScore(query,b)-matchScore(query,a) || (b.stores.filter(x=>x.valid).length-a.stores.filter(x=>x.valid).length)).slice(0,12);
  }
  function quantityInBase(quantity,unit){
    const u=norm(unit);
    let value=Number(s(quantity).replace(',','.'));
    if(!Number.isFinite(value)||value<=0)return null;
    if(u==='l'||u==='liter')return {amount:value*1000,base:'ml'};
    if(u==='ml')return {amount:value,base:'ml'};
    if(u==='kg')return {amount:value*1000,base:'g'};
    if(u==='g')return {amount:value,base:'g'};
    if(u==='stk'||u==='styk')return {amount:value,base:'stk'};
    return null;
  }
  function suggestedPackages(item,product){
    const q=s(item.quantity).trim().toLowerCase().replace(',','.');
    const match=q.match(/^(\d+(?:\.\d+)?)\s*(kg|g|liter|l|ml|stk|styk|pakker?|poser?|flasker?|dåser?|bakker?|ruller?|kartoner?)\b/i);
    if(!match)return 1;
    const desired=quantityInBase(match[1],match[2]);
    const size=quantityInBase(product.unit_size,product.unit);
    if(desired && size && desired.base===size.base && size.amount>0)
      return Math.max(1,Math.min(99,Math.ceil(desired.amount/size.amount-0.0000001)));
    if (/^(pakker?|poser?|flasker?|dåser?|bakker?|ruller?|kartoner?)$/.test(match[2]))
      return Math.max(1,Math.min(99,Math.ceil(Number(match[1]))));
    return 1;
  }
  function quantityWarning(item, product) {
    const text=s(item.quantity).trim().toLowerCase().replace(',','.');
    const match=text.match(/^(\d+(?:\.\d+)?)\s*(kg|g|liter|l|ml|stk|styk)\b/);
    if (!match) return '';
    const requested=quantityInBase(match[1],match[2]);
    const inPack=quantityInBase(product.unit_size,product.unit);
    if (!inPack || !requested || requested.base!==inPack.base)
      return `Mængden ”${s(item.quantity)}” kan ikke automatisk omregnes til varens pakningsstørrelse. Kontrollér antal pakker.`;
    return '';
  }
  function listData(id){
    if(!byList.has(id))byList.set(id,{results:new Map(),matches:new Map(),searched:false,scanning:false,done:0,total:0,error:'',lastRun:null,includeChecked:false});
    return byList.get(id);
  }
  function activate(id){activeId=id;excludedStores=new Set();token++;}
  function configure({redraw,notify}){refresh=typeof redraw==='function'?redraw:()=>{};alertUser=typeof notify==='function'?notify:()=>{};}
  function shownItems(items,d){return items.filter(x=>d.includeChecked || !x.checked).slice(0,MAX_ITEMS);}
  function cached(q){
    const hit=queryCache.get(norm(q));
    if(hit && Date.now()-hit.time<CACHE_MS)return hit.products;
    return null;
  }
  async function fetchJSON(url){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),15000);
    try{
      const response=await fetch(url,{headers:{'Accept':'application/json'},signal:controller.signal,cache:'no-store'});
      if(response.status===429)throw new Error('Prisdatatjenestens grænse for opslag er nået. Prøv senere.');
      if(!response.ok)throw new Error('Prisdatatjenesten svarede med fejl '+response.status+'.');
      return await response.json();
    }catch(err){
      if(err?.name==='AbortError')throw new Error('Prisopslaget tog for lang tid. Prøv igen.');
      if(err instanceof TypeError)throw new Error('Kunne ikke hente priser. Tjek internetforbindelsen, eller prøv via den online hjemmeside.');
      throw err;
    }finally{clearTimeout(timer);}
  }
  async function searchAPI(q){
    const term=s(q).trim().slice(0,100);
    const mem=cached(term);
    if(mem)return mem;
    const url=new URL(API+'/merged-products');
    url.searchParams.set('q',term);
    url.searchParams.set('sort','name');
    url.searchParams.set('order','asc');
    url.searchParams.set('page','1');
    const data=await fetchJSON(url.toString());
    const products=rankProducts(term,(Array.isArray(data.products)?data.products:[]).map(normalizeProduct));
    queryCache.set(norm(term),{products,time:Date.now()});
    return products;
  }
  function applyResults(data,item,products,query){
    data.results.set(item.id,{products,query});
    const prev=data.matches.get(item.id);
    const prevMatch=products.find(p=>p.key===prev?.key);
    if(prevMatch) return;
    // First result is a *suggestion*. The app clearly labels the comparison as provisional.
    const p=products[0];
    if(p){data.matches.set(item.id,{key:p.key,count:suggestedPackages(item,p)});}
    else data.matches.delete(item.id);
  }
  async function scan(items){
    if(!activeId)return;
    const listId=activeId, d=listData(listId);
    if(d.scanning)return;
    const selected=shownItems(items,d);
    if(!selected.length){alertUser('Der er ingen varer at scanne. Tilføj varer på listen først.');return;}
    d.scanning=true;d.done=0;d.total=selected.length;d.error='';d.searched=true;
    const thisToken=++token;
    // Previous search results for items no longer included are not part of this run.
    d.results=new Map();d.matches=new Map();
    refresh();
    let nextIndex=0, firstError='';
    async function worker(){
      while(nextIndex<selected.length && thisToken===token){
        const item=selected[nextIndex++];
        try {const products=await searchAPI(item.name); if(thisToken!==token)return;applyResults(d,item,products,item.name);}
        catch(e){if(thisToken!==token)return;d.results.set(item.id,{products:[],error:e.message||'Kunne ikke hente pris',query:item.name});if(!firstError)firstError=e.message||'Fejl ved prisopslag';}
        d.done++; if(thisToken===token)refresh();
      }
    }
    try{await Promise.all(Array.from({length:Math.min(3,selected.length)},()=>worker()));}
    finally{if(thisToken===token){d.scanning=false;d.lastRun=new Date();d.error=firstError;refresh();}}
  }
  async function refine(itemId,query,items){
    const d=listData(activeId);
    const item=items.find(x=>x.id===itemId);
    if(!item||!query.trim())return;
    const runId=token;
    d.results.set(itemId,{products:[],loading:true,query});refresh();
    try{const products=await searchAPI(query);if(runId!==token)return;applyResults(d,item,products,query);}
    catch(e){if(runId!==token)return;d.results.set(itemId,{products:[],error:e.message,query});alertUser(e.message,true);}
    refresh();
  }
  async function barcodeLookup(itemId,ean,items){
    const digits=s(ean).trim();
    if(!/^\d{8,14}$/.test(digits)){alertUser('Indtast en gyldig stregkode med 8–14 cifre.',true);return;}
    const item=items.find(x=>x.id===itemId);
    if(!item)return;
    const d=listData(activeId),runId=token;
    try{
      const url=new URL(API+'/product-by-ean');url.searchParams.set('ean',digits);
      const data=await fetchJSON(url.toString());
      if(runId!==token)return;
      const product=normalizeProduct({...data,group_id:'ean-'+digits,ean:digits});
      if(!product.stores.some(x=>x.valid))throw new Error('Stregkoden findes, men der er ingen nye, pålidelige priser.');
      const old=d.results.get(item.id)?.products||[];
      const products=[product,...old.filter(p=>p.key!==product.key)];
      applyResults(d,item,products,'EAN '+digits);
      d.matches.set(item.id,{key:product.key,count:suggestedPackages(item,product)});
      d.results.set(item.id,{products,query:'EAN '+digits});
      alertUser('Produktet fra stregkoden er valgt.');refresh();
    }catch(e){alertUser(e.message||'Stregkoden blev ikke fundet.',true);}
  }
  function chosen(d,item){
    const match=d.matches.get(item.id), record=d.results.get(item.id);
    if(!match||!record)return null;
    const product=record.products.find(p=>p.key===match.key);
    return product?{product,count:Math.max(1,Math.min(99,Number(match.count)||1))}:null;
  }
  function relevantPrices(product){
    // One comparable price per chain. Grouped product results can include
    // duplicate rows for the same chain; never double-count a basket item.
    const byChain=new Map();
    for(const p of product.stores){
      if(!p.valid || excludedStores.has(p.store))continue;
      const old=byChain.get(p.store);
      if(!old || p.price<old.price)byChain.set(p.store,p);
    }
    return [...byChain.values()].sort((a,b)=>a.price-b.price);
  }
  function comparison(items,d){
    const entries=shownItems(items,d);
    const matched=entries.map(item=>({item,choice:chosen(d,item)}));
    const missing=matched.filter(x=>!x.choice || !relevantPrices(x.choice.product).length);
    const catalog=new Map();
    let cheapestSplit=0,offers=0;
    const lineItems=[];
    for(const entry of matched){
      if(!entry.choice)continue;
      const prices=relevantPrices(entry.choice.product);
      if(!prices.length)continue;
      const cheapest=prices[0];
      const minCents=asCents(cheapest.price)*entry.choice.count;
      cheapestSplit+=minCents;
      const offerPrices=prices.filter(p=>p.on_sale);
      if(offerPrices.length)offers++;
      lineItems.push({...entry,cheapest,offerPrices,prices,minCents});
      for(const p of prices){
        if(!catalog.has(p.store))catalog.set(p.store,{id:p.store,name:storeName(p.store),covered:0,total:0,offers:0});
        const store=catalog.get(p.store);
        store.covered++;
        store.total+=asCents(p.price)*entry.choice.count;
        store.offers+=p.on_sale?1:0;
      }
    }
    const stores=[...catalog.values()].sort((a,b)=>b.covered-a.covered || a.total-b.total);
    const full=stores.filter(s=>s.covered===entries.length && !missing.length).sort((a,b)=>a.total-b.total);
    return {entries,missing,matched:lineItems.length,stores,full,cheapestSplit,offers,lineItems};
  }
  function safeNumberField(n){return Number.isFinite(n)&&n>0?esc(n):'1';}
  function renderProduct(item,d){
    const result=d.results.get(item.id);
    const choice=chosen(d,item);
    if(!result)return `<div class="ph-product" data-price-item="${esc(item.id)}"><span class="ph-status muted">Afventer prisopslag</span></div>`;
    if(result.loading)return '<div class="ph-product ph-wait">Søger efter varen …</div>';
    if(result.error)return `<div class="ph-product"><p class="ph-error">${esc(result.error)}</p>${renderRefine(item,result.query)}</div>`;
    if(!result.products.length)return `<div class="ph-product"><p class="ph-no-match">Vi fandt ikke en pris, der kunne bruges. Prøv et mere præcist varenavn.</p>${renderRefine(item,result.query)}</div>`;
    const options=result.products.map(p=>{
      const best=p.stores.find(x=>x.valid);
      const name=[p.brand,p.name,productSize(p)].filter(Boolean).join(' · ');
      return `<option value="${esc(p.key)}" ${choice?.product.key===p.key?'selected':''}>${esc(name)}${best?' · fra '+money(asCents(best.price)):''}</option>`;
    }).join('');
    const prices=choice?relevantPrices(choice.product):[];
    const cheapest=prices[0];
    const time=cheapest?.price_last_seen_at;
    return `<div class="ph-product">
      <div class="ph-product-pick"><label class="ph-select-label">Matchet produkt <span>– kontrollér mærke og størrelse</span><select data-price-role="product" data-item-id="${esc(item.id)}"><option value="">Vælg et produkt …</option>${options}</select></label>
        <label class="ph-quantity-label">Antal pakker<input data-price-role="quantity" data-item-id="${esc(item.id)}" type="number" min="1" max="99" step="1" inputmode="numeric" value="${safeNumberField(choice?.count||1)}" ${choice?'':'disabled'}></label></div>
      ${choice?`<div class="ph-match-copy">Forslag til varen på listen: <strong>${esc(choice.product.name)}</strong>${productSize(choice.product)?` · ${esc(productSize(choice.product))}`:''}. Vejledende – tjek antal pakker.</div>${quantityWarning(item,choice.product)?`<div class="ph-quantity-warning">⚠ ${esc(quantityWarning(item,choice.product))}</div>`:''}`:''}
      ${cheapest?`<div class="ph-best"><div><span class="ph-best-label">Laveste registrerede pris</span><strong>${esc(storeName(cheapest.store))}</strong><small>Set ${humanDate(time)}${cheapest.on_sale?' · Markerede tilbud':''}</small></div><div class="ph-best-price">${money(asCents(cheapest.price))}${choice.count>1?`<small>${choice.count} pakker: ${money(asCents(cheapest.price)*choice.count)}</small>`:''}</div></div>`:'<p class="ph-no-match">Ingen nyere priser hos de valgte butikker.</p>'}
      ${prices.length?`<div class="ph-prices">${prices.slice(0,5).map((p,index)=>`<div class="ph-price-line"><span>${index===0?'★ ':''}${esc(storeName(p.store))}${p.on_sale?'<em>Tilbud</em>':''}</span><strong>${money(asCents(p.price))}</strong><small>${humanDate(p.price_last_seen_at)}</small></div>`).join('')}${prices.length>5?`<details class="ph-more"><summary>Vis ${prices.length-5} flere butikspriser</summary>${prices.slice(5).map(p=>`<div class="ph-price-line"><span>${esc(storeName(p.store))}${p.on_sale?'<em>Tilbud</em>':''}</span><strong>${money(asCents(p.price))}</strong><small>${humanDate(p.price_last_seen_at)}</small></div>`).join('')}</details>`:''}</div>`:''}
      ${renderRefine(item,result.query)}
    </div>`;
  }
  function renderRefine(item,query){
    return `<details class="ph-refine"><summary>Anden vare eller præcis stregkode?</summary><div class="ph-refine-body"><form id="price-refine-form" data-item-id="${esc(item.id)}"><label>Søg efter et mere præcist navn<input name="query" value="${esc(query||item.name)}" maxlength="100" required placeholder="F.eks. Arla letmælk 1 liter"></label><button type="submit" class="ghost-btn">Søg igen</button></form>
      <form id="price-barcode-form" data-item-id="${esc(item.id)}"><label>Stregkode (EAN)<input name="ean" inputmode="numeric" pattern="[0-9]{8,14}" maxlength="14" placeholder="8–14 cifre" required></label><button type="submit" class="ghost-btn">Slå op</button></form></div></details>`;
  }
  function renderItemCard(item,d){
    const match=chosen(d,item);
    return `<article class="ph-item-card"><div class="ph-item-head"><span class="ph-item-icon">🛒</span><div><h3>${esc(item.name)}</h3><small>${esc(item.quantity||'1 stk')} · ${match?'Produkt foreslået':'Mangler match'}</small></div>${match&&relevantPrices(match.product).some(x=>x.on_sale)?'<span class="ph-offer-tag">🏷 Tilbud fundet</span>':''}</div>${renderProduct(item,d)}</article>`;
  }
  function renderSummary(items,d){
    const c=comparison(items,d);
    const allOk=c.entries.length>0 && !c.missing.length;
    const fastest=c.full[0];
    const copies=c.matched;
    const storeTitle=allOk?(fastest?fastest.name:'Ingen komplet butik registreret'):'Afventer produktmatch';
    return `<section class="ph-summary-area" aria-live="polite">
      <div class="ph-stats"><div class="ph-stat"><span>Priser fundet på</span><strong>${copies}<small> / ${c.entries.length} varer</small></strong></div><div class="ph-stat"><span>Varer med tilbud</span><strong>${c.offers}</strong></div><div class="ph-stat"><span>Prisgrundlag</span><strong>7 <small>dage</small></strong></div></div>
      <div class="ph-summary-main"><div class="ph-main-card"><div class="ph-card-eyebrow">🏪 Billigste butik for hele listen</div><h2>${esc(storeTitle)}</h2>${fastest?`<div class="ph-grand-price">${money(fastest.total)}</div><p>Alle ${c.entries.length} valgte varer har en registreret pris hos denne kæde.</p>`:allOk?'<p>Vi fandt ikke én butik med en nyere registreret pris på samtlige varer. Se dækningen nedenfor.</p>':`<p>${c.missing.length} ${c.missing.length===1?'vare mangler':'varer mangler'} et sikkert match eller en nyere pris. Ingen butik kan derfor udnævnes som billigst for hele listen endnu.</p>`}</div>
        <div class="ph-split-card"><div class="ph-card-eyebrow">🛍️ Billigst fordelt på butikker</div><h2>${allOk?money(c.cheapestSplit):'Ikke klar'}</h2><p>${allOk?'De laveste registrerede priser vare for vare – det kan kræve flere stop.':'Sammenlign alle varerne, før du bruger et samlet beløb.'}</p>${fastest&&allOk&&fastest.total>c.cheapestSplit?`<span class="ph-diff">Forskel: ${money(fastest.total-c.cheapestSplit)} før transport</span>`:''}</div></div>
      <div class="ph-store-compare"><div class="ph-compare-top"><h2>Hvor er hele indkøbet billigst?</h2><small>Kun komplette indkøb kan rangeres</small></div>${c.stores.length?`<div class="ph-shop-rows">${c.stores.slice(0,12).map((store,i)=>`<div class="ph-shop-row ${fastest?.id===store.id?'is-winner':''}"><span class="ph-store-rank">${i+1}</span><strong>${esc(store.name)}</strong><span class="ph-shop-coverage">${store.covered} af ${c.entries.length} varer</span><span class="ph-shop-total">${store.covered===c.entries.length&&allOk?money(store.total):'Ikke fuld kurv'}</span></div>`).join('')}</div>`:'<p>Ingen butikker med sammenlignelige, nyere priser endnu.</p>'}
      ${!allOk?'<p class="ph-compare-note">En butik med færre varer bliver aldrig kåret som billigst på grundlag af en ufuldstændig kurv.</p>':''}</div>
    </section>`;
  }
  function renderStoreFilters(items,d){
    const stores=new Set();
    for(const item of shownItems(items,d)){
      const choice=chosen(d,item);
      if(choice)choice.product.stores.filter(p=>p.valid).forEach(p=>stores.add(p.store));
    }
    const slugs=[...stores].sort((a,b)=>storeName(a).localeCompare(storeName(b),'da'));
    if(!slugs.length)return '';
    return `<section class="ph-filter"><div class="ph-compare-top"><h2>Butikker, I vil sammenligne</h2><button class="ph-text-button" data-action="price-all-stores">Vælg alle</button></div><div class="ph-store-chips">${slugs.map(slug=>`<button type="button" class="ph-store-chip ${excludedStores.has(slug)?'off':'on'}" aria-pressed="${!excludedStores.has(slug)}" data-action="price-toggle-store" data-id="${esc(slug)}">${excludedStores.has(slug)?'＋':'✓'} ${esc(storeName(slug))}</button>`).join('')}</div></section>`;
  }
  function render(lists, items){
    const list=lists.find(l=>l.id===activeId) || lists[0];
    if(!list) return `<div class="ph-header"><span class="eyebrow">Prisjagt</span><h1>Find den billigste indkøbstur</h1><p>Opret først en indkøbsliste, så du har varer at søge priser på.</p><button class="primary-btn ph-short-button" data-action="new-list">Opret indkøbsliste</button></div>`;
    if(activeId!==list.id){activeId=list.id;excludedStores=new Set();}
    const d=listData(list.id);
    const included=shownItems(items,d);
    return `<div class="ph-page"><header class="ph-header"><span class="eyebrow">NYT · PRISJAGT</span><div class="ph-title-row"><div><h1>Hvor handler I billigst?</h1><p>Scan indkøbslisten for registrerede priser og tilbud i danske supermarkeder. Se både billigste varer og billigste komplette kurv.</p></div><div class="ph-title-icon" aria-hidden="true">🔍</div></div></header>
      <div class="ph-toolbar"><div class="ph-picker"><label for="ph-list-select">Vælg indkøbsliste</label><select id="ph-list-select">${lists.map(l=>`<option value="${esc(l.id)}" ${l.id===list.id?'selected':''}>${esc(l.name)}</option>`).join('')}</select></div>
        <label class="ph-check"><input id="ph-include-checked" type="checkbox" ${d.includeChecked?'checked':''}><span>Medtag afkrydsede varer</span></label>
        <button data-action="scan-prices" class="primary-btn ph-scan" ${d.scanning||!included.length?'disabled':''}>${d.scanning?'⏳ Søger '+d.done+' / '+d.total:'🔎 Scan '+included.length+' '+(included.length===1?'vare':'varer')}</button>
      </div>
      <p class="ph-source">Prisdata: <a href="https://madpris.gratis.dk/" target="_blank" rel="noopener noreferrer">Madpris</a> · Ingen API-nøgle eller ekstra konto krævet · Kun priser med observation inden for de seneste ${FRESH_DAYS} dage tæller med · Datoerne vises ved varerne.</p>
      ${items.length>MAX_ITEMS?`<p class="ph-hint">Kun de første ${MAX_ITEMS} varer scannes ad gangen. Del meget lange indkøb op i flere lister.</p>`:''}
      ${!d.searched?`<div class="ph-start"><div class="ph-start-art">🏷️</div><h2>Scan hele listen for tilbud</h2><p>Vi søger på varerne, sammenligner registrerede priser og viser, hvilke butikker der har en komplet kurv. Du kan rette produktvalget og antallet af pakker.</p><button class="primary-btn ph-short-button" data-action="scan-prices" ${!included.length?'disabled':''}>Start prisjagten →</button><div class="ph-start-foot">F.eks. ${included.slice(0,4).map(x=>esc(x.name)).join(' · ')}</div></div>`:''}
      ${d.searched?`${d.scanning?`<div class="ph-loading" role="status"><span class="ph-loading-dot"></span>Scanner indkøbslisten: ${d.done} af ${d.total} varer …</div>`:''}${d.error?`<div class="ph-error-banner">${esc(d.error)}. Nogle priser kan mangle.</div>`:''}
      ${renderSummary(items,d)}${renderStoreFilters(items,d)}
      <div class="ph-compare-top ph-items-header"><h2>Kontrollér varerne</h2><small>${included.length} ${included.length===1?'vare':'varer'} · foreslåede produkter kan rettes</small></div><div class="ph-items">${included.map(item=>renderItemCard(item,d)).join('')}</div>`:''}
      <div class="ph-disclaimer"><strong>Sådan læser du prisjagten</strong><p>Priserne kommer fra de senest observerede butikkataloger. De er <em>ikke</em> livepriser eller garanti for lagerstatus og kan variere mellem lokale butikker. Vælg korrekt produkt og pakningsstørrelse. "Tilbud" er markeret af datakilden, ikke beregnet ud fra en påstået normalpris. Uden match eller ved ufuldstændig butiksdækning viser vi ingen falsk samlet "billigst"-rangering.</p><a target="_blank" rel="noopener noreferrer" href="https://madpris.gratis.dk/api-dokumentation">Se dokumentation og datakilde</a></div>
    </div>`;
  }
  function choose(itemId,key,items){
    const d=listData(activeId), item=items.find(i=>i.id===itemId),p=d.results.get(itemId)?.products.find(p=>p.key===key);
    if(p&&item)d.matches.set(itemId,{key:p.key,count:suggestedPackages(item,p)});
    else d.matches.delete(itemId);
    refresh();
  }
  function quantity(itemId,count){
    const d=listData(activeId),match=d.matches.get(itemId);if(!match)return;
    match.count=Math.max(1,Math.min(99,Math.floor(Number(count)||1)));
    refresh();
  }
  function toggleStore(id){if(excludedStores.has(id))excludedStores.delete(id);else excludedStores.add(id);refresh();}
  function allStores(){excludedStores.clear();refresh();}
  function includeChecked(value){const d=listData(activeId);d.includeChecked=Boolean(value);d.searched=false;d.results.clear();d.matches.clear();token++;refresh();}
  return { configure,activate,render,scan,refine,barcodeLookup,choose,quantity,toggleStore,allStores,includeChecked };
})();
