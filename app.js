/* Familieindkøb – vanilla JS, no build tools needed.
 * Local demo: localStorage. Family sync: Supabase with row-level security.
 */
(() => {
  'use strict';

  const STORAGE_KEY = 'familieindkoeb-demo-v2';
  const SELECTED_FAMILY_KEY = 'familieindkoeb-family-v1';
  const app = document.getElementById('app');
  const toastRegion = document.getElementById('toast-region');
  const CATEGORIES = [
    { id: 'produce', name: 'Frugt & grønt', emoji: '🥦' },
    { id: 'dairy', name: 'Mejeri & æg', emoji: '🥛' },
    { id: 'meat', name: 'Kød & fisk', emoji: '🍗' },
    { id: 'bread', name: 'Brød & bager', emoji: '🥖' },
    { id: 'pantry', name: 'Kolonial', emoji: '🥫' },
    { id: 'frozen', name: 'Frost', emoji: '🧊' },
    { id: 'drinks', name: 'Drikkevarer', emoji: '🧃' },
    { id: 'household', name: 'Husholdning', emoji: '🧽' },
    { id: 'other', name: 'Andet', emoji: '🛒' }
  ];
  const ICONS = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    basket: '<path d="m4 10 2 10h12l2-10H4Z"/><path d="m8 10 4-7 4 7M9 14v3m6-3v3"/>',
    home: '<path d="m3 10 9-7 9 7v11H3V10Z"/><path d="M9 21v-8h6v8"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><path d="m3 6 1 1 2-2M3 12h3m-3 6h3"/>',
    archive: '<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v11h14V9m-9 5h4"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    share: '<path d="M12 16V3m0 0 5 5m-5-5L7 8"/><path d="M4 14v6a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    edit: '<path d="M12 20h9M4 20l4.5-1 11-11a2.1 2.1 0 0 0-3-3l-11 11L4 20Z"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2m3 0-1 15H6L5 6m5 4v7m4-7v7"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
    search: '<circle cx="10.8" cy="10.8" r="7.3"/><path d="m16.3 16.3 4.5 4.5"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5 9a8 8 0 0 1 13-2l2 5M4 12l2 5a8 8 0 0 0 13-2"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.9l.06.06-1.8 1.8-.06-.06a1.7 1.7 0 0 0-1.9-.34 1.7 1.7 0 0 0-1 1.55V20h-2.6v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.9.34l-.06.06-1.8-1.8.06-.06A1.7 1.7 0 0 0 6.6 15a1.7 1.7 0 0 0-1.55-1H5v-2.6h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.9l-.06-.06 1.8-1.8.06.06A1.7 1.7 0 0 0 10 7a1.7 1.7 0 0 0 1-1.55V5h2.6v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.9-.34l.06-.06 1.8 1.8-.06.06A1.7 1.7 0 0 0 18 10a1.7 1.7 0 0 0 1.55 1H20v2.6h-.09A1.7 1.7 0 0 0 19.4 15Z"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5m5 5H9"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    sparkles: '<path d="m12 3 1.9 6.1L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9L12 3ZM20 19l.8 2.2L23 22l-2.2.8L20 25l-.8-2.2L17 22l2.2-.8L20 19Z"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8 7.8 0 0 0 0 11L12 22l8.8-8.4a7.8 7.8 0 0 0 0-9Z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    box: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m8 12 3 3 5-6"/>',
    cloud: '<path d="M20 16a4 4 0 0 0-2-7.4 6.5 6.5 0 0 0-12 2A4 4 0 0 0 7 19h12"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>'
  };
  const icon = (name, size = 18) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.list}</svg>`;
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const uid = () => (globalThis.crypto && crypto.randomUUID ? crypto.randomUUID() : 'demo-' + Date.now() + '-' + Math.random().toString(36).slice(2));
  const stamp = () => new Date().toISOString();
  const dateLabel = date => date ? new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date)) : '';
  const nItems = (n) => n === 1 ? '1 vare' : `${n} varer`;
  const category = id => CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
  const optionsHTML = selected => CATEGORIES.map(c => `<option value="${c.id}" ${selected === c.id ? 'selected' : ''}>${c.emoji} ${esc(c.name)}</option>`).join('');
  const countItems = listId => state.items.filter(i => i.list_id === listId);
  const available = () => state.lists.filter(l => l.status !== 'archived').sort((a,b) => (b.created_at||'').localeCompare(a.created_at||''));
  const archived = () => state.lists.filter(l => l.status === 'archived').sort((a,b) => (b.archived_at||'').localeCompare(a.archived_at||''));
  const getList = id => state.lists.find(l => l.id === id);
  const progress = listId => { const arr = countItems(listId); const done = arr.filter(i => i.checked).length; return { done, total: arr.length, left: arr.length - done, pct: arr.length ? Math.round(done/arr.length*100) : 0 }; };
  const displayName = user => user?.user_metadata?.name || user?.email?.split('@')[0] || 'Dig';
  const state = {
    mode: 'demo', user: null, families: [], family: null, members: [],
    lists: [], items: [], selectedListId: null, priceListId: null, view: 'detail',
    modal: null, search: '', menuOpen: false, authTab: 'login',
    busy: false, fetchToken: 0
  };
  let sb = null;
  let subscription = null;
  let refreshTimer = null;
  let notificationTimer = null;
  let reloading = false;

  function guessedCategory(name) {
    const n = name.toLocaleLowerCase('da-DK');
    const keys = [
      ['produce', ['æble','banan','avocado','agurk','tomat','gulerod','salat','broccoli','kartoffel','løg','citron','lime','pære','jordbær','blåbær','peberfrugt','champignon','appelsin']],
      ['dairy', ['mælk','yoghurt','ost','smør','fløde','skyr','æg','creme fraiche','havredrik','feta']],
      ['meat', ['kylling','hakket kød','oksekød','svinekød','bacon','laks','tun','fisk','pølse','skinke','kotelet']],
      ['bread', ['rugbrød','franskbrød','toast','boller','croissant','flute','bagel','knækbrød']],
      ['pantry', ['pasta','ris','mel','sukker','salt','peber','olie','havregryn','dåse','ketchup','nutella','kaffe','te','chokolade','chips','kiks']],
      ['frozen', ['frost','frossen','isvaffel','ispind','pizza']],
      ['drinks', ['juice','sodavand','cola','saft','øl','danskvand','vand']],
      ['household', ['toiletpapir','køkkenrulle','sæbe','shampoo','vaskemiddel','opvask','tandpasta','bleer','affaldsposer','rengøring']]
    ];
    return keys.find(([,words]) => words.some(w => n.includes(w)))?.[0] || 'other';
  }

  function seedDemo() {
    const ago = days => new Date(Date.now()-days*86400e3).toISOString();
    const names = [
      { id: 'start-1', name: 'Ugens indkøb', created_at: ago(0), status:'active', archived_at:null },
      { id: 'start-2', name: 'Weekendhygge', created_at: ago(2), status:'active', archived_at:null },
      { id: 'start-3', name: 'Sidste uges indkøb', created_at: ago(7), status:'archived', archived_at: ago(5) },
      { id: 'start-4', name: 'Fødselsdagsmiddag', created_at: ago(30), status:'archived', archived_at: ago(27) }
    ];
    const templates = [
      ['start-1', [['Mælk','2 L','dairy',false], ['Æg','10 stk','dairy',false], ['Rugbrød','1 stk','bread',true], ['Bananer','6 stk','produce',false], ['Tomater','1 bakke','produce',false], ['Pasta','2 pakker','pantry',true], ['Toiletpapir','1 pakke','household',false]]],
      ['start-2', [['Chips','2 poser','pantry',false], ['Sodavand','2 flasker','drinks',false], ['Pizza','2 stk','frozen',false]]],
      ['start-3', [['Mælk','1 L','dairy',true], ['Havregryn','1 pose','pantry',true], ['Agurk','2 stk','produce',true], ['Kaffe','1 pose','pantry',true]]],
      ['start-4', [['Kartofler','2 kg','produce',true], ['Kylling','2 kg','meat',true], ['Fløde','2 stk','dairy',true], ['Is','1 bakke','frozen',true]]]
    ];
    const items = templates.flatMap(([list_id, entries]) => entries.map(([name,quantity,category,checked],i) => ({id:uid(),list_id,name,quantity,category,checked,position:i,created_at:ago(0)})));
    return { lists: names, items };
  }
  function readDemo() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) { const example = seedDemo(); localStorage.setItem(STORAGE_KEY, JSON.stringify(example)); return example; }
      const data = JSON.parse(raw);
      return data && Array.isArray(data.lists) && Array.isArray(data.items) ? data : seedDemo();
    } catch (e) { return seedDemo(); }
  }
  function updateDemo(fn) {
    const data = readDemo();
    const result = fn(data);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
    catch(e) { notify('Kunne ikke gemme i browseren. Kontroller lagerplads.', true); }
    state.lists = data.lists;
    state.items = data.items;
    return result;
  }
  function demoLoad() {
    const data = readDemo();
    state.lists = data.lists;
    state.items = data.items;
    if (!getList(state.selectedListId)) state.selectedListId = available()[0]?.id || null;
    if (!state.selectedListId && state.view === 'detail') state.view = 'home';
    render();
  }
  function notify(message, error=false) {
    const el = document.createElement('div');
    el.className = `toast${error?' error':''}`;
    el.textContent = message;
    toastRegion.appendChild(el);
    setTimeout(() => el.remove(), 4200);
  }
  function friendlyError(err) {
    const msg = err?.message || String(err);
    if (/network|fetch|failed to fetch/i.test(msg)) return 'Ingen forbindelse. Prøv igen, når du er online.';
    if (/invalid login credentials/i.test(msg)) return 'Forkert e-mail eller adgangskode.';
    if (/email not confirmed/i.test(msg)) return 'Bekræft din e-mail, før du logger ind.';
    if (/user already registered/i.test(msg)) return 'E-mailen er allerede oprettet. Prøv at logge ind.';
    if (/password should be|password must|weak password/i.test(msg)) return 'Vælg en adgangskode på mindst 6 tegn.';
    if (/household not found|ukendt familiekode/i.test(msg)) return 'Familiekoden blev ikke fundet. Kontrollér den og prøv igen.';
    return msg;
  }
  function getCloudConfig() {
    const c = window.APP_CONFIG || {};
    return (typeof c.supabaseUrl === 'string' && /^https:\/\//.test(c.supabaseUrl) && c.supabaseAnonKey) ? c : null;
  }
  async function initialize() {
    const c = getCloudConfig();
    if (!c) { state.mode = 'demo'; demoLoad(); return; }
    state.mode = 'cloud';
    try {
      // The SDK is loaded only when family sync has been configured.
      // This keeps the local demo fully functional without an internet connection.
      if (!window.supabase?.createClient) {
        await new Promise((resolve,reject) => {
          const sdk = document.createElement('script');
          sdk.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
          sdk.onload = () => window.supabase?.createClient ? resolve() : reject(new Error('Kunne ikke indlæse skydelingen.'));
          sdk.onerror = () => reject(new Error('Kunne ikke indlæse skydelingen. Kontrollér internetforbindelsen.'));
          document.head.appendChild(sdk);
        });
      }
      sb = window.supabase.createClient(c.supabaseUrl, c.supabaseAnonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
        realtime: { params: { eventsPerSecond: 10 } }
      });
      const { data, error } = await sb.auth.getSession();
      if (error) throw error;
      state.user = data.session?.user || null;
      await loadForUser();
      sb.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
          const currentId = state.user?.id || null;
          const nextId = session?.user?.id || null;
          if (currentId !== nextId) {
            state.user = session?.user || null;
            setTimeout(() => loadForUser().catch(e => notify(friendlyError(e),true)), 0);
          }
        }
      });
    } catch(e) {
      app.innerHTML = `<div class="boot-screen"><div class="boot-mark">!</div><h2>Kan ikke forbinde til databasen</h2><p>${esc(friendlyError(e))}</p><button class="secondary-btn" onclick="location.reload()">Prøv igen</button></div>`;
    }
  }
  async function loadForUser() {
    unsubscribe();
    state.family = null;
    state.families = [];
    state.lists = [];
    state.items = [];
    state.selectedListId = null;
    state.view = 'detail';
    state.modal = null;
    if (!state.user) { render(); return; }
    await loadFamilies();
  }
  async function loadFamilies(preferredId = null) {
    const { data, error } = await sb.from('household_members')
      .select('household_id, display_name, households(id, name, invite_code, created_by)')
      .eq('user_id', state.user.id);
    if (error) throw error;
    state.families = (data||[]).map(m => m.households).filter(Boolean).map(h => Array.isArray(h) ? h[0] : h).filter(Boolean);
    if (!state.families.length) { state.family = null; render(); return; }
    const saved = preferredId || safeStorageGet(SELECTED_FAMILY_KEY);
    state.family = state.families.find(f => f.id === saved) || state.families[0];
    safeStorageSet(SELECTED_FAMILY_KEY,state.family.id);
    await loadWorkspace();
    subscribeToFamily();
  }
  function safeStorageGet(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function safeStorageSet(key, value) { try { localStorage.setItem(key,value); } catch(e) {} }
  async function loadWorkspace() {
    if (!sb || !state.family) return;
    const token = ++state.fetchToken;
    const { data: lists, error: listsError } = await sb.from('shopping_lists').select('*').eq('household_id',state.family.id);
    if (listsError) throw listsError;
    const ids = (lists || []).map(l => l.id);
    let items = [];
    if (ids.length) {
      const { data, error } = await sb.from('shopping_items').select('*').in('list_id',ids).order('position',{ascending:true});
      if (error) throw error;
      items = data || [];
    }
    if (token !== state.fetchToken) return;
    state.lists = lists || [];
    state.items = items;
    if (!getList(state.selectedListId)) state.selectedListId = available()[0]?.id || null;
    if (!state.selectedListId && state.view === 'detail') state.view = 'home';
    render();
  }
  function unsubscribe() {
    if (subscription && sb) sb.removeChannel(subscription);
    subscription = null;
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = null;
  }
  function subscribeToFamily() {
    unsubscribe();
    if (!state.family || !sb) return;
    // Realtime catches other members' edits. A periodic refresh is a fallback.
    subscription = sb.channel('family-changes-' + state.family.id)
      .on('postgres_changes',{event:'*',schema:'public',table:'shopping_lists'},() => scheduleRefresh())
      .on('postgres_changes',{event:'*',schema:'public',table:'shopping_items'},() => scheduleRefresh())
      .subscribe();
    refreshTimer = setInterval(() => { if (!document.hidden && !state.modal) scheduleRefresh(); }, 30000);
  }
  function scheduleRefresh() {
    if (notificationTimer) clearTimeout(notificationTimer);
    notificationTimer = setTimeout(() => {
      if (!state.user || !state.family || state.busy || state.modal) return;
      loadWorkspace().catch(e => console.warn('Refresh failed:',e));
    },450);
  }

  // CRUD operations use the same user interface in demo and synchronized mode.
  const repo = {
    async createList(name) {
      const clean = name.trim().slice(0,120);
      if (state.mode === 'demo') {
        const id = uid();
        updateDemo(d => d.lists.push({id,name:clean,created_at:stamp(),status:'active',archived_at:null}));
        return id;
      }
      const {data,error} = await sb.from('shopping_lists').insert({name:clean,household_id:state.family.id,created_by:state.user.id,status:'active'}).select('id').single();
      if (error) throw error;
      return data.id;
    },
    async updateList(id, patch) {
      if (state.mode === 'demo') {
        updateDemo(d => Object.assign(d.lists.find(l=>l.id===id)||{},patch));
        return;
      }
      const {error} = await sb.from('shopping_lists').update(patch).eq('id',id);
      if (error) throw error;
    },
    async deleteList(id) {
      if (state.mode === 'demo') {
        updateDemo(d=>{d.lists=d.lists.filter(l=>l.id!==id);d.items=d.items.filter(i=>i.list_id!==id);});
        return;
      }
      const {error} = await sb.from('shopping_lists').delete().eq('id',id);
      if (error) throw error;
    },
    async addItem(listId, name, quantity, cat) {
      const clean = name.trim().slice(0,140);
      const qty = quantity.trim().slice(0,60);
      const position = (Math.max(-1,...countItems(listId).map(i=>Number(i.position)||0))) + 1;
      if (state.mode === 'demo') {
        updateDemo(d=>d.items.push({id:uid(),list_id:listId,name:clean,quantity:qty,category:cat,checked:false,position,created_at:stamp()}));
        return;
      }
      const {error} = await sb.from('shopping_items').insert({list_id:listId,name:clean,quantity:qty,category:cat,checked:false,position});
      if (error) throw error;
    },
    async updateItem(id,patch) {
      if (state.mode === 'demo') {
        updateDemo(d=>Object.assign(d.items.find(i=>i.id===id)||{},patch));
        return;
      }
      const {error} = await sb.from('shopping_items').update(patch).eq('id',id);
      if (error) throw error;
    },
    async deleteItem(id) {
      if (state.mode === 'demo') {
        updateDemo(d=>d.items=d.items.filter(i=>i.id!==id));
        return;
      }
      const {error} = await sb.from('shopping_items').delete().eq('id',id);
      if (error) throw error;
    },
    async clearChecks(listId) {
      if (state.mode === 'demo') {
        updateDemo(d=>d.items.forEach(i=>{if(i.list_id===listId)i.checked=false;}));
        return;
      }
      const {error} = await sb.from('shopping_items').update({checked:false}).eq('list_id',listId);
      if (error) throw error;
    },
    async duplicateList(listId) {
      const original = getList(listId);
      if (!original) throw new Error('Listen findes ikke længere.');
      const originalItems = countItems(listId);
      const title = (original.name.replace(/ \(kopi\)$/i,'') + ' (kopi)').slice(0,120);
      const id = await this.createList(title);
      if (state.mode === 'demo') {
        updateDemo(d=>{
          originalItems.forEach((item,index)=>d.items.push({
            id:uid(),list_id:id,name:item.name,quantity:item.quantity||'',category:item.category||'other',checked:false,position:index,created_at:stamp()
          }));
        });
      } else if (originalItems.length) {
        const rows = originalItems.map((item,index)=>({list_id:id,name:item.name,quantity:item.quantity||'',category:item.category||'other',checked:false,position:index}));
        const {error} = await sb.from('shopping_items').insert(rows);
        if (error) {
          await sb.from('shopping_lists').delete().eq('id',id);
          throw error;
        }
      }
      return id;
    }
  };

  async function mutate(fn, success, options={}) {
    if (state.busy) return;
    state.busy = true;
    try {
      const result = await fn();
      if (typeof options.onSuccess === 'function') options.onSuccess(result);
      if (state.mode === 'cloud') await loadWorkspace();
      else render();
      if (success) notify(success);
      return result;
    } catch(e) {
      notify(friendlyError(e), true);
      return null;
    } finally { state.busy = false; }
  }
  async function toggleItem(id) {
    const item = state.items.find(x=>x.id===id);
    if (!item || getList(item.list_id)?.status === 'archived') return;
    const before = item.checked;
    item.checked = !before;
    render();
    try { await repo.updateItem(id, {checked: !before}); }
    catch(e) { item.checked = before; render(); notify(friendlyError(e),true); }
  }
  async function changeFamily(id) {
    const next = state.families.find(f=>f.id===id);
    if (!next) return;
    unsubscribe();
    state.family = next;
    state.selectedListId = null;
    state.view = 'home';
    state.modal = null;
    safeStorageSet(SELECTED_FAMILY_KEY,id);
    await loadWorkspace();
    subscribeToFamily();
  }
  async function openShare() {
    if (state.mode === 'demo') { state.modal = {type:'share-demo'}; render(); return; }
    if (!state.family) return;
    state.modal = {type:'share'};
    render();
    const familyId = state.family.id;
    const {data,error} = await sb.from('household_members').select('user_id, display_name, joined_at').eq('household_id',familyId).order('joined_at');
    if (error) { notify(friendlyError(error),true); return; }
    if (state.family?.id === familyId && state.modal?.type === 'share') {
      state.members = data || [];
      render();
    }
  }
  async function createFamily(name, personName) {
    if (!sb) return;
    const {data,error} = await sb.rpc('create_household',{
      p_name: name.trim().slice(0,100),p_display_name:personName.trim().slice(0,100)
    });
    if (error) throw error;
    await loadFamilies(data);
    state.view = 'home';
    state.modal = null;
    notify('Familien er oprettet! Lav jeres første liste.');
  }
  async function joinFamily(code,personName) {
    if (!sb) return;
    const {data,error} = await sb.rpc('join_household',{
      p_invite_code:code.replace(/\s+/g,'').toLowerCase(),p_display_name:personName.trim().slice(0,100)
    });
    if (error) throw error;
    await loadFamilies(data);
    state.view = 'home';
    state.modal = null;
    notify('Du er nu med i familien. Velkommen!');
  }
  async function switchToSignout() {
    if (!sb) return;
    await sb.auth.signOut();
    state.user = null;
    await loadForUser();
    notify('Du er logget ud.');
  }

  function brandMark() {
    return `<div class="brand-badge" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><path d="M9 20h30l-3.7 19H12.7L9 20Z" fill="#E9DEA3"/><path d="M16 20c0-7 3.5-13 8-13s8 6 8 13" stroke="#E9DEA3" stroke-width="3.5" stroke-linecap="round"/><path d="M19 27v6m5-6v6m5-6v6" stroke="#2f6654" stroke-width="2.4" stroke-linecap="round"/></svg></div>`;
  }
  function brand() { return `${brandMark()}<div><div class="brand-title">familieindkøb<span style="color:#9eae91">.</span></div><div class="brand-sub">sammen om hverdagen</div></div>`; }
  function renderSidebar() {
    const active = available();
    const familyName = state.mode === 'demo' ? 'Min familie' : state.family?.name || 'Familien';
    return `<aside class="sidebar" aria-label="Navigation">
      <div class="brand" role="button" tabindex="0" data-action="home" aria-label="Gå til oversigt">${brand()}</div>
      <button type="button" class="primary-btn" data-action="new-list">${icon('plus')} Ny indkøbsliste</button>
      <div class="nav-heading">Overblik</div>
      <div class="nav-list"><button class="nav-item ${state.view==='home'?'active':''}" data-action="home">${icon('home')}<span class="nav-label">Oversigt</span></button></div>
      <div class="nav-heading">Aktive lister <span>${active.length}</span></div>
      <nav class="nav-list" aria-label="Aktive lister">
        ${active.map(l=>{const p=progress(l.id);return `<button class="nav-item ${state.selectedListId===l.id&&state.view==='detail'?'active':''}" data-action="open-list" data-id="${esc(l.id)}">${icon('list')}<span class="nav-label">${esc(l.name)}</span><span class="nav-count">${p.left}</span></button>`;}).join('')}
        ${active.length===0?'<span style="color:#9daa9e;font-size:12px;padding:7px 12px">Ingen aktive lister endnu</span>':''}
      </nav>
      <div class="sidebar-rule"></div>
      <div class="nav-heading" style="padding-top:16px">Spar på indkøbene</div>
      <div class="nav-list"><button class="nav-item ${state.view==='prices'?'active':''}" data-action="prices-view">${icon('search')}<span class="nav-label">Prisjagt & tilbud</span><span class="ph-sidebar-new">NYT</span></button></div>
      <div class="nav-heading" style="padding-top:16px">Gemte lister</div>
      <div class="nav-list"><button class="nav-item ${state.view==='archive' || state.view==='detail' && getList(state.selectedListId)?.status==='archived'?'active':''}" data-action="archive-view">${icon('archive')}<span class="nav-label">Arkiv</span><span class="nav-count">${archived().length}</span></button></div>
      <div class="sidebar-bottom">
        <div class="family-tile">
          <span class="family-avatar">${icon('users',20)}</span>
          <div style="min-width:0"><div class="family-tile-title">${esc(familyName)}</div><div class="family-tile-sub">${state.mode==='demo'?'Prøvetilstand':'Fælles lister for familien'}</div><button class="family-action" data-action="family">${state.mode==='demo'?'Sådan deler I':'Administrer familie'} →</button></div>
        </div>
        ${state.mode==='cloud'?`<button class="nav-item" data-action="logout">${icon('logout')}<span class="nav-label">Log ud</span></button>`:''}
        <div class="sidebar-foot"><span class="dot ${state.mode==='demo'?'ochre':''}"></span>${state.mode==='demo'?'Gemmes kun i denne browser':'Delt og gemt i skyen'}</div>
      </div>
    </aside>`;
  }
  function renderTopbar() {
    const l=state.view==='detail'?getList(state.selectedListId):null;
    const crumb=state.view==='home'?'Oversigt':state.view==='archive'?'Arkiv':state.view==='prices'?'Prisjagt & tilbud':l?.name||'Indkøbslister';
    return `<div class="topbar">
      <div class="topbar-left"><button class="icon-btn mobile-menu" data-action="toggle-menu" aria-label="Åbn menu">${icon('menu')}</button><span class="slash">Hjem</span><span class="slash">/</span><span style="color:#607b68;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(crumb)}</span></div>
      <div class="topbar-right"><div class="mode-pill"><span class="dot ${state.mode==='demo'?'ochre':''}"></span>${state.mode==='demo'?'Lokal prøve':'Synkroniseret'}</div><button class="ghost-btn" data-action="share">${icon('users')}<span>Del med familien</span></button></div>
    </div>`;
  }
  function renderDemoBanner() {
    return state.mode==='demo'?`<div class="demo-banner"><span><strong>Du prøver appen.</strong> Listerne gemmes på denne enhed. Familiedeling på tværs af telefoner kræver opsætning af skyen.</span><button data-action="share">Læs om familiedeling →</button></div>`:'';
  }
  function renderListCard(l, archiveCard=false) {
    const items = countItems(l.id);
    const p = progress(l.id);
    const preview = items.slice(0,4).map(i=>i.name).join(' · ');
    return `<article class="list-card ${archiveCard?'archive-card':''}">
      <div class="card-top"><div class="card-emoji">${archiveCard?'🗂️':l.name.toLocaleLowerCase('da-DK').includes('weekend')?'🍿':'🛍️'}</div><span class="pill ${archiveCard?'archived':''}">${archiveCard?'Gemt':'Aktiv'}</span></div>
      <div><h3 class="card-title">${esc(l.name)}</h3><div class="card-meta">${archiveCard?'Gemt '+dateLabel(l.archived_at):'Oprettet '+dateLabel(l.created_at)}</div></div>
      ${archiveCard?`<p class="card-sub" title="${esc(preview)}">${esc(preview||'Listen er tom')}</p>`:`<div><div class="progress-line"><span style="width:${p.pct}%"></span></div><div style="color:#8e9f91;font-size:11px;margin-top:8px">${p.left} mangler · ${p.done} i kurven</div></div>`}
      <div class="card-footer"><span class="card-count">${nItems(items.length)}</span><div style="display:flex;align-items:center;gap:10px">${archiveCard?`<button class="ghost-btn" data-action="duplicate-list" data-id="${esc(l.id)}">${icon('copy')} Genbrug</button>`:''}<button class="card-link" data-action="open-list" data-id="${esc(l.id)}">Åbn ${icon('arrow')}</button></div></div>
    </article>`;
  }
  function renderHome() {
    const active = available();
    const left = active.reduce((sum,l)=>sum+progress(l.id).left,0);
    const completed = archived().length;
    return `<section class="hero"><div><span class="eyebrow">Helt styr på hverdagen</span><h1>Indkøbene er nemmere, når vi er sammen.</h1><p>Alle familiens lister samlet ét sted – fra ugens mælk til den næste store fødselsdagsmiddag.</p></div><div class="hero-art" aria-hidden="true"><div class="circle"></div><span class="bag">🛍️</span></div></section>
      <div class="stats"><div class="stat"><span class="stat-icon">${icon('list')}</span><div><div class="stat-number">${active.length}</div><div class="stat-label">Aktive lister</div></div></div><div class="stat"><span class="stat-icon cream">${icon('basket')}</span><div><div class="stat-number">${left}</div><div class="stat-label">Varer tilbage</div></div></div><div class="stat"><span class="stat-icon lilac">${icon('archive')}</span><div><div class="stat-number">${completed}</div><div class="stat-label">Gemte lister</div></div></div></div>
      <div class="ph-home-teaser"><div class="ph-teaser-icon">🏷️</div><div><strong>Hvor handler I billigst i denne uge?</strong><p>Scan listen for priser og tilbud i danske supermarkeder.</p></div><button class="ghost-btn" data-action="prices-view">Find tilbud ${icon('arrow',16)}</button></div>
      <div class="section-heading"><h2>Jeres indkøbslister</h2><button class="inline-action" data-action="new-list">+ Opret ny liste</button></div>
      ${active.length?`<div class="list-cards">${active.map(l=>renderListCard(l)).join('')}</div>`:renderEmpty('🛍️','Ingen aktive indkøbslister','Opret jeres første liste, og tilføj de varer, I mangler.','new-list','Opret en liste')}
      ${archived().length?`<div class="section-heading" style="margin-top:33px"><h2>Tidligere indkøb</h2><button class="inline-action" data-action="archive-view">Se hele arkivet →</button></div><div class="list-cards">${archived().slice(0,2).map(l=>renderListCard(l,true)).join('')}</div>`:''}`;
  }
  function renderEmpty(emoji,title,subtitle,action,label) {
    return `<div class="empty"><div class="empty-illustration">${emoji}</div><h3>${esc(title)}</h3><p>${esc(subtitle)}</p>${action?`<button class="primary-btn" data-action="${action}">${icon('plus')} ${esc(label)}</button>`:''}</div>`;
  }
  function itemRow(item, readOnly=false) {
    return `<div class="item-row ${item.checked?'is-checked':''}" data-item="${esc(item.id)}">
      <button class="check-box ${item.checked?'checked':''}" data-action="toggle-item" data-id="${esc(item.id)}" ${readOnly?'disabled':''} aria-label="${item.checked?'Fjern afkrydsning for':'Kryds af'} ${esc(item.name)}" aria-pressed="${!!item.checked}">${item.checked?icon('check'):''}</button>
      <div class="item-name">${esc(item.name)}</div>
      ${item.quantity?`<span class="item-qty">${esc(item.quantity)}</span>`:''}
      ${readOnly?'':`<div class="row-actions"><button class="row-action" data-action="edit-item" data-id="${esc(item.id)}" title="Rediger ${esc(item.name)}" aria-label="Rediger ${esc(item.name)}">${icon('edit')}</button><button class="row-action danger" data-action="delete-item" data-id="${esc(item.id)}" title="Slet ${esc(item.name)}" aria-label="Slet ${esc(item.name)}">${icon('trash')}</button></div>`}
    </div>`;
  }
  function itemsSection(title, emoji, items, readOnly=false) {
    if (!items.length) return '';
    return `<section class="item-section"><div class="item-section-header"><span class="item-section-title"><span class="emoji">${emoji}</span>${esc(title)}</span><span>${nItems(items.length)}</span></div>${items.map(i=>itemRow(i,readOnly)).join('')}</section>`;
  }
  function renderItems(list) {
    const isArchive=list.status==='archived';
    const items=countItems(list.id).sort((a,b)=>(a.position||0)-(b.position||0));
    if (!items.length) return renderEmpty('🧺','Der er ingen varer endnu',isArchive?'Den gemte liste indeholder ingen varer.':'Skriv den første vare ovenfor, og lad indkøbene begynde.',null,null);
    if (isArchive) {
      return `<div class="items-card">${CATEGORIES.map(cat=>itemsSection(cat.name,cat.emoji,items.filter(i=>i.category===cat.id),true)).join('')}<div class="items-footer"><span class="text-link">${nItems(items.length)} på denne gamle liste</span></div></div>`;
    }
    const pending = items.filter(i=>!i.checked), done = items.filter(i=>i.checked);
    return `<div class="items-card">${CATEGORIES.map(cat=>itemsSection(cat.name,cat.emoji,pending.filter(i=>(i.category||'other')===cat.id))).join('')}
      ${done.length?itemsSection('Lagt i kurven','✅',done):''}
      <div class="items-footer"><span class="text-link">${nItems(items.length)} i alt</span>${done.length?`<button class="text-link" data-action="uncheck-all" data-id="${esc(list.id)}">${icon('refresh',13)} Gør alle varer aktive igen</button>`:''}</div>
    </div>`;
  }
  function renderDetail() {
    const l=getList(state.selectedListId);
    if (!l) return renderHome();
    const isArchive=l.status==='archived';
    const p=progress(l.id);
    return `<div class="detail-header">
      <span class="eyebrow">${isArchive?'Arkiv / gemt indkøbsliste':'Aktuel indkøbsliste'}</span>
      <div class="detail-heading-row"><div><h1>${esc(l.name)}</h1><div class="detail-sub"><span>${icon('calendar',14)} ${isArchive?'Gemt':'Oprettet'} ${dateLabel(isArchive?l.archived_at:l.created_at)}</span><span class="tiny-dot"></span><span>${nItems(p.total)} i alt</span><span class="pill ${isArchive?'archived':''}">${isArchive?'Gemt':'Aktiv'}</span></div></div>
        <div class="detail-tools">${!isArchive?`<button class="ghost-btn ph-detail-price" data-action="prices-for-list" data-id="${esc(l.id)}">${icon('search')}<span>Find tilbud</span></button>`:''}<button class="ghost-btn" data-action="duplicate-list" data-id="${esc(l.id)}">${icon('copy')}<span>Genbrug</span></button><button class="ghost-btn" data-action="${isArchive?'restore-list':'archive-list'}" data-id="${esc(l.id)}">${icon(isArchive?'refresh':'archive')}<span>${isArchive?'Gendan':'Gem i arkiv'}</span></button><button class="icon-btn" data-action="rename-list" data-id="${esc(l.id)}" title="Omdøb liste" aria-label="Omdøb liste">${icon('edit')}</button><button class="icon-btn delete" data-action="confirm-delete-list" data-id="${esc(l.id)}" title="Slet liste" aria-label="Slet liste">${icon('trash')}</button></div>
      </div>
      <div class="progress-panel"><div class="progress-copy"><div><span class="progress-title">${isArchive?'Indkøbets status':'Så langt er I nået'}</span><span class="progress-caption">${p.done} af ${p.total} krydset af</span></div><div class="progress-line"><span style="width:${p.pct}%"></span></div></div><div class="progress-percent">${p.pct}%</div></div>
    </div>
    ${isArchive?`<div class="muted-bar">Denne liste er gemt præcis som den var. Vælg <strong>Genbrug</strong> for at oprette en ny, redigerbar kopi uden afkrydsninger.</div>`:`<div class="add-panel"><div class="panel-label">${icon('plus')} Tilføj en vare</div>
      <form id="add-item-form" class="add-form" autocomplete="off"><input name="name" aria-label="Varenavn" placeholder="Hvad mangler I? F.eks. mælk ..." maxlength="140" required /><input name="quantity" aria-label="Antal" placeholder="Antal" maxlength="60"/><select name="category" aria-label="Kategori"><option value="auto">✨ Automatisk</option>${optionsHTML('auto')}</select><button class="primary-btn" type="submit">${icon('plus')} Tilføj</button></form><div class="form-hint">Tryk Enter for hurtigt at tilføje en vare. Vi foreslår automatisk en kategori.</div>
      </div>`}
    ${p.total?`<div class="section-heading"><h2>${isArchive?'Varer på den gemte liste':'Varer på listen'}</h2><span style="font-size:12px;color:#91a095">${isArchive?nItems(p.total):`${p.left} tilbage at købe`}</span></div>`:''}
    ${renderItems(l)}`;
  }
  function archiveMatches() {
    const q=state.search.trim().toLocaleLowerCase('da-DK');
    return archived().filter(l=>!q || l.name.toLocaleLowerCase('da-DK').includes(q) || dateLabel(l.archived_at).toLocaleLowerCase('da-DK').includes(q) || countItems(l.id).some(i=>i.name.toLocaleLowerCase('da-DK').includes(q)));
  }
  function renderArchiveResults() {
    const results=archiveMatches();
    return results.length?`<div class="list-cards">${results.map(l=>renderListCard(l,true)).join('')}</div>`:renderEmpty('🗂️',state.search?'Ingen lister matcher søgningen':'Arkivet er tomt',state.search?'Prøv at søge på en anden vare eller et andet listenavn.':'Når I er færdige med en liste, kan I gemme den her og finde den frem igen.',null,null);
  }
  function renderArchive() {
    const results=archiveMatches();
    return `<span class="eyebrow">Genbrug jeres favoritter</span><h1>Gamle lister, nye indkøb.</h1><p class="lead">Alle jeres tidligere indkøb er gemt. Find en gammel liste, se varerne, og kopiér den til næste indkøbstur.</p>
      <div class="archive-toolbar"><label class="search-wrap">${icon('search')}<input id="archive-search" aria-label="Søg i gemte indkøbslister" placeholder="Søg efter lister eller varer ..." value="${esc(state.search)}" /></label><span class="search-count" id="archive-count">${results.length} ${results.length===1?'gemt liste':'gemte lister'}</span></div>
      <div id="archive-results">${renderArchiveResults()}</div>`;
  }
  function renderApp() {
    app.innerHTML=`<div class="app-layout ${state.menuOpen?'menu-open':''}"><div class="mobile-nav-shade" data-action="toggle-menu"></div>${renderSidebar()}<main class="main"><div class="content">${renderTopbar()}${renderDemoBanner()}${state.view==='home'?renderHome():state.view==='archive'?renderArchive():state.view==='prices'?(window.FamiliePris?.render(available(),countItems(state.priceListId||available()[0]?.id))||''):renderDetail()}</div></main></div>${renderModal()}`;
  }

  function renderAuth() {
    const signup = state.authTab==='signup';
    app.innerHTML = `<div class="auth-screen">
      <div class="auth-side"><div class="brand" style="padding:0;cursor:default">${brand()}</div><div class="auth-headline"><span class="eyebrow" style="color:#b9dcc7">Alt samlet ét sted</span><h1>Mindre bøvl. Mere overskud.</h1><p>Opret jeres familie, del indkøbslister i realtid, og genbrug tidligere indkøb igen og igen.</p></div><div class="auth-side-foot">Lavet til helt almindelige familier og helt almindelige tirsdage. ♡</div></div>
      <div class="auth-main"><div class="auth-box"><span class="eyebrow">Velkommen til familieindkøb</span><h2>${signup?'Opret din konto':'Godt at se dig igen'}</h2><p>${signup?'Lav en gratis konto, og kom i gang med familiens lister.':'Log ind for at se og redigere familiens fælles lister.'}</p>
        <div class="auth-tabs"><button class="auth-tab ${!signup?'active':''}" data-action="auth-login">Log ind</button><button class="auth-tab ${signup?'active':''}" data-action="auth-signup">Opret konto</button></div>
        <form id="auth-form">${signup?`<div class="form-field"><label for="auth-name">Dit navn</label><input id="auth-name" name="name" maxlength="100" autocomplete="name" placeholder="F.eks. Mette" required/></div>`:''}
        <div class="form-field"><label for="auth-email">E-mail</label><input id="auth-email" name="email" type="email" autocomplete="email" placeholder="dig@eksempel.dk" required/></div>
        <div class="form-field"><label for="auth-password">Adgangskode</label><input id="auth-password" name="password" type="password" minlength="6" autocomplete="${signup?'new-password':'current-password'}" placeholder="Mindst 6 tegn" required/></div>
        <button class="primary-btn" type="submit" style="margin-top:8px">${signup?'Opret konto':'Log ind'} ${icon('arrow')}</button></form>
        <p class="auth-note">Familielister deles kun med medlemmer af jeres familie. Efter tilmelding kan du oprette en familie eller tilslutte dig med en familiekode.</p>
      </div></div>
    </div>`;
  }
  function renderOnboarding() {
    app.innerHTML = `<div class="auth-screen">
      <div class="auth-side"><div class="brand" style="padding:0;cursor:default">${brand()}</div><div class="auth-headline"><span class="eyebrow" style="color:#b9dcc7">Jeres fælles sted</span><h1>Velkommen til et lettere indkøb.</h1><p>Opret jeres familie, eller brug den kode, du har fået af en anden i husstanden.</p></div><div class="auth-side-foot">Del lister og følg med i hinandens afkrydsninger.</div></div>
      <div class="auth-main"><div class="auth-box"><span class="eyebrow">Hej ${esc(displayName(state.user))} 👋</span><h2>Hvordan vil du starte?</h2><p>Vælg én mulighed. Resten kan du gøre senere.</p>
        <div class="onboard-options"><button class="onboard-card" data-action="create-family"><span class="onboard-icon">${icon('home',23)}</span><span><strong>Opret en familie</strong><small>Bliv den første, der opretter jeres fælles lister.</small></span>${icon('chevron')}</button>
        <button class="onboard-card" data-action="join-family"><span class="onboard-icon">${icon('users',23)}</span><span><strong>Deltag i en familie</strong><small>Indtast den kode, som din familie har delt.</small></span>${icon('chevron')}</button></div>
        <button class="text-link" data-action="logout" style="margin-top:22px">${icon('logout',15)} Log ud</button>
      </div></div>
    </div>${renderModal()}`;
  }
  function field(name,label,value='',placeholder='',max=120,autofocus=false) {
    return `<div class="form-field"><label for="field-${name}">${esc(label)}</label><input id="field-${name}" name="${esc(name)}" value="${esc(value)}" placeholder="${esc(placeholder)}" maxlength="${max}" ${autofocus?'autofocus':''} required/></div>`;
  }
  function modalShell(title,intro,contents,buttons='') {
    return `<div class="overlay" data-action="close-modal-overlay" role="presentation"><section class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="modal-top"><h2>${esc(title)}</h2><button class="icon-btn" data-action="close-modal" aria-label="Luk">${icon('x')}</button></div>${intro?`<p>${intro}</p>`:''}${contents}${buttons}</section></div>`;
  }
  function modalButtons(label='Gem', danger=false) {
    return `<div class="modal-actions"><button class="secondary-btn" type="button" data-action="close-modal">Annuller</button><button class="primary-btn ${danger?'danger-btn':''}" type="submit" ${state.busy?'disabled':''}>${esc(label)}</button></div>`;
  }
  function renderModal() {
    if (!state.modal) return '';
    const m=state.modal;
    const list = getList(m.listId);
    const item = state.items.find(i=>i.id===m.itemId);
    switch(m.type) {
      case 'new-list':
        return modalShell('Ny indkøbsliste','Hvad skal listen hedde? Du kan altid ændre navnet senere.',`<form id="new-list-form">${field('name','Listens navn','','F.eks. Ugens indkøb',120,true)}${modalButtons('Opret liste')}</form>`);
      case 'rename-list':
        return modalShell('Omdøb indkøbsliste','Giv listen et nyt navn.',`<form id="rename-list-form" data-id="${esc(m.listId)}">${field('name','Listens navn',list?.name||'','Nyt navn',120,true)}${modalButtons('Gem navn')}</form>`);
      case 'edit-item':
        if (!item) return '';
        return modalShell('Rediger vare','Ret navn, antal eller kategori.',`<form id="edit-item-form" data-id="${esc(m.itemId)}">${field('name','Vare',item.name,'F.eks. mælk',140,true)}<div class="form-field"><label for="field-quantity">Antal / mængde (valgfrit)</label><input id="field-quantity" name="quantity" value="${esc(item.quantity||'')}" placeholder="F.eks. 2 L" maxlength="60"/></div><div class="form-field"><label for="field-category">Kategori</label><select name="category" id="field-category">${optionsHTML(item.category||'other')}</select></div>${modalButtons('Gem vare')}</form>`);
      case 'confirm-delete-list':
        return modalShell('Slet listen?',`Du er ved at slette <strong>${esc(list?.name||'listen')}</strong> og alle varerne på den. Det kan ikke fortrydes.`,`<form id="delete-list-form" data-id="${esc(m.listId)}">${modalButtons('Ja, slet listen',true)}</form>`);
      case 'confirm-delete-item':
        return modalShell('Slet varen?',`Vil du slette <strong>${esc(item?.name||'varen')}</strong> fra listen?`,`<form id="delete-item-form" data-id="${esc(m.itemId)}">${modalButtons('Slet vare',true)}</form>`);
      case 'share-demo':
        return modalShell('Del lister med familien','Appen kører lige nu i lokal prøvetilstand. Du kan oprette, gemme, arkivere og genbruge lister, men de bliver kun gemt på denne enhed.',`<div class="mini-note"><strong>Vil I dele lister mellem mobiler?</strong><br/>Der skal aktiveres en gratis skydatabase, og hjemmesiden skal lægges online. Når det er gjort, kan I oprette familiemedlemmer og dele lister med en familiekode. Følg den medfølgende <a href="README.md" target="_blank" rel="noopener">opsætningsvejledning</a>.</div><div class="modal-actions"><button class="primary-btn" data-action="close-modal">Forstået</button></div>`);
      case 'share':
        return modalShell('Invitér familien',`Alle, der er medlemmer af <strong>${esc(state.family?.name||'jeres familie')}</strong>, kan se, ændre og krydse af på de samme indkøbslister.`,`<div class="mini-note"><strong>1.</strong> Bed familiemedlemmet åbne hjemmesiden og oprette en konto.<br/><strong>2.</strong> Vælg ”Deltag i en familie”.<br/><strong>3.</strong> Indtast denne familiekode:</div><div class="code-box"><code>${esc(state.family?.invite_code||'…')}</code><button class="ghost-btn" data-action="copy-code">${icon('copy')} Kopiér</button></div><div class="section-heading"><h2 style="font-size:14px">Medlemmer (${state.members.length||'…'})</h2></div><div class="member-list">${state.members.map(member=>`<div class="member"><span class="member-icon">${esc((member.display_name||'F').slice(0,1).toUpperCase())}</span><div>${esc(member.display_name||'Familiemedlem')}${member.user_id===state.user?.id?' <span style="color:#93a198;font-size:11px">(dig)</span>':''}</div></div>`).join('')}</div><div class="modal-actions"><button class="secondary-btn" data-action="close-modal">Luk</button><button class="primary-btn" data-action="share-code">${icon('share')} Del kode</button></div>`);
      case 'family':
        return modalShell('Din familie','Her kan du skifte familie, oprette en ny eller deltage i en anden.',`<div class="mini-note"><strong>Aktuel familie:</strong> ${esc(state.family?.name||'')}</div><div class="onboard-options" style="margin-top:14px">${state.families.map(f=>`<button class="onboard-card" data-action="switch-family" data-id="${esc(f.id)}"><span class="onboard-icon">${icon('users')}</span><span><strong>${esc(f.name)}</strong><small>${f.id===state.family?.id?'Aktiv familie':'Skift til denne familie'}</small></span>${f.id===state.family?.id?icon('check'):icon('chevron')}</button>`).join('')}</div><hr class="modal-divider"/><div style="display:flex;flex-wrap:wrap;gap:8px"><button class="ghost-btn" data-action="create-family">${icon('plus')} Opret ny familie</button><button class="ghost-btn" data-action="join-family">${icon('users')} Deltag med kode</button></div><div class="modal-actions"><button class="secondary-btn" data-action="logout">${icon('logout')} Log ud</button><button class="primary-btn" data-action="close-modal">Luk</button></div>`);
      case 'create-family':
        return modalShell('Opret en familie','Vælg et navn til jeres fælles indkøb. Du kan invitere andre bagefter.',`<form id="create-family-form">${field('name','Familiens navn','','F.eks. Familien Jensen',100,true)}${field('person','Dit visningsnavn',displayName(state.user),'Dit fornavn',100)}${modalButtons('Opret familie')}</form>`);
      case 'join-family':
        return modalShell('Deltag i familien','Få familiekoden af den, der har oprettet familiens indkøbslister.',`<form id="join-family-form">${field('code','Familiekode','','Indsæt koden her',50,true)}${field('person','Dit visningsnavn',displayName(state.user),'Dit fornavn',100)}${modalButtons('Deltag i familie')}</form>`);
      default: return '';
    }
  }
  function render() {
    if (state.mode==='cloud' && !state.user) renderAuth();
    else if (state.mode==='cloud' && !state.family) renderOnboarding();
    else renderApp();
  }

  async function copyText(value) {
    try {
      if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(value); return true; }
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.style.position = 'fixed';textarea.style.left = '-9999px';
      document.body.appendChild(textarea);textarea.select();
      const worked = document.execCommand('copy');textarea.remove();return worked;
    } catch(e) { return false; }
  }
  async function actionHandler(event) {
    if (event.target.classList?.contains('overlay')) {
      state.modal=null;render();return;
    }
    const target=event.target.closest?.('[data-action]');
    if (!target) return;
    const action=target.dataset.action;
    const id=target.dataset.id;
    if (action === 'close-modal-overlay') return;
    if (action==='toggle-menu') { state.menuOpen=!state.menuOpen; render(); return; }
    if (action==='close-modal') { state.modal=null; render(); return; }
    if (action==='home') { state.view='home';state.menuOpen=false;state.modal=null;render();window.scrollTo(0,0);return; }
    if (action==='archive-view') { state.view='archive';state.menuOpen=false;state.modal=null;render();window.scrollTo(0,0);return; }
    if (action==='prices-view' || action==='prices-for-list') {
      const selected=(action==='prices-for-list' && available().some(l=>l.id===id)) ? id : (state.priceListId && available().some(l=>l.id===state.priceListId)?state.priceListId:available()[0]?.id);
      state.view='prices';state.priceListId=selected;state.menuOpen=false;state.modal=null;
      window.FamiliePris?.activate(selected);render();window.scrollTo(0,0);return;
    }
    if (action==='scan-prices') { await window.FamiliePris?.scan(countItems(state.priceListId));return; }
    if (action==='price-toggle-store') { window.FamiliePris?.toggleStore(id);return; }
    if (action==='price-all-stores') { window.FamiliePris?.allStores();return; }
    if (action==='open-list') { if (!getList(id)) return;state.view='detail';state.selectedListId=id;state.menuOpen=false;state.modal=null;render();window.scrollTo(0,0);return; }
    if (action==='new-list') {state.modal={type:'new-list'};state.menuOpen=false;render();focusModal();return;}
    if (action==='rename-list') {state.modal={type:'rename-list',listId:id};render();focusModal();return;}
    if (action==='edit-item') {state.modal={type:'edit-item',itemId:id};render();focusModal();return;}
    if (action==='confirm-delete-list') {state.modal={type:'confirm-delete-list',listId:id};render();return;}
    if (action==='delete-item') {state.modal={type:'confirm-delete-item',itemId:id};render();return;}
    if (action==='share' || action==='family') {
      state.menuOpen=false;
      if (action==='share') await openShare();
      else if (state.mode==='demo') {state.modal={type:'share-demo'};render();}
      else {state.modal={type:'family'};render();}
      return;
    }
    if (action==='auth-login' || action==='auth-signup') {state.authTab=action==='auth-login'?'login':'signup';render();return;}
    if (action==='create-family' || action==='join-family') {state.modal={type:action};render();focusModal();return;}
    if (action==='switch-family') {
      try {await changeFamily(id);}catch(e){notify(friendlyError(e),true);}
      return;
    }
    if (action==='logout') {
      try {await switchToSignout();} catch(e) {notify(friendlyError(e),true);}
      return;
    }
    if (action==='copy-code' || action==='share-code') {
      const code=state.family?.invite_code;
      if (!code) return;
      const link=location.protocol.startsWith('http')?`${location.origin}${location.pathname}`:'';
      const message=`Kom med i vores indkøbslister på Familieindkøb!\nÅbn: ${link || 'familieindkoeb-hjemmesiden'}\nOpret konto, vælg "Deltag i en familie", og brug familiekoden: ${code}`;
      if (action==='share-code' && navigator.share) {
        try {await navigator.share({title:'Kom med i vores familieindkøb',text:message});return;}catch(e) {if(e.name==='AbortError')return;}
      }
      const success=await copyText(action==='copy-code'?code:message);
      notify(success?'Kopieret! Send det til familien.':'Kunne ikke kopiere automatisk. Markér koden, og kopiér den.',!success);
      return;
    }
    if (action==='toggle-item') {await toggleItem(id);return;}
    if (action==='duplicate-list') {
      await mutate(()=>repo.duplicateList(id),'Listen er kopieret – alle varer er klar til at blive krydset af igen.',{
        onSuccess(newId) {state.selectedListId=newId;state.view='detail';state.modal=null;}
      });return;
    }
    if (action==='archive-list') {
      await mutate(()=>repo.updateList(id,{status:'archived',archived_at:stamp()}),'Listen er gemt i arkivet.',{
        onSuccess() {state.selectedListId=null;state.view='archive';}
      });return;
    }
    if (action==='restore-list') {
      await mutate(()=>repo.updateList(id,{status:'active',archived_at:null}),'Listen er tilbage blandt de aktive.',{
        onSuccess() {state.selectedListId=id;state.view='detail';}
      });return;
    }
    if (action==='uncheck-all') {
      await mutate(()=>repo.clearChecks(id),'Alle varer er gjort aktive igen.');return;
    }
  }
  function focusModal() {
    setTimeout(()=>document.querySelector('.modal input[autofocus], .modal input:not([type=hidden])')?.focus(),0);
  }
  async function formHandler(event) {
    const form=event.target;
    if (!(form instanceof HTMLFormElement)) return;
    event.preventDefault();
    if (state.busy) return;
    const id=form.id;
    const data=new FormData(form);
    const str=key=>String(data.get(key)||'').trim();
    if (id==='price-refine-form') {
      await window.FamiliePris?.refine(form.dataset.itemId,str('query'),countItems(state.priceListId));return;
    }
    if (id==='price-barcode-form') {
      await window.FamiliePris?.barcodeLookup(form.dataset.itemId,str('ean'),countItems(state.priceListId));return;
    }
    if (id==='add-item-form') {
      const listId=state.selectedListId;
      if (!getList(listId) || getList(listId).status==='archived') return;
      const name=str('name'), qty=str('quantity');
      if (!name) return;
      const cat=str('category')==='auto'?guessedCategory(name):str('category');
      await mutate(()=>repo.addItem(listId,name,qty,cat),'Vare tilføjet.');
      document.querySelector('#add-item-form [name=name]')?.focus();
      return;
    }
    if (id==='new-list-form') {
      const name=str('name');if (!name) return;
      await mutate(()=>repo.createList(name),'Listen er oprettet.',{
        onSuccess(newId){state.modal=null;state.view='detail';state.selectedListId=newId;}
      });return;
    }
    if (id==='rename-list-form') {
      const name=str('name');if(!name)return;
      await mutate(()=>repo.updateList(form.dataset.id,{name}),'Navnet er ændret.',{onSuccess(){state.modal=null;}});return;
    }
    if (id==='edit-item-form') {
      const name=str('name');if(!name)return;
      await mutate(()=>repo.updateItem(form.dataset.id,{name,quantity:str('quantity'),category:str('category')}),'Varen er opdateret.',{onSuccess(){state.modal=null;}});return;
    }
    if (id==='delete-item-form') {
      await mutate(()=>repo.deleteItem(form.dataset.id),'Varen er slettet.',{onSuccess(){state.modal=null;}});return;
    }
    if (id==='delete-list-form') {
      const listId=form.dataset.id;
      await mutate(()=>repo.deleteList(listId),'Listen er slettet.',{
        onSuccess(){state.modal=null;state.selectedListId=null;state.view='home';}
      });return;
    }
    if (id==='create-family-form' || id==='join-family-form') {
      state.busy = true;
      try {
        if (id==='create-family-form') await createFamily(str('name'),str('person'));
        else await joinFamily(str('code'),str('person'));
      } catch(e) { notify(friendlyError(e),true); }
      finally { state.busy=false; }
      return;
    }
    if (id==='auth-form') {
      const email=str('email'),password=String(data.get('password')||'');
      state.busy=true;
      try {
        if (state.authTab==='signup') {
          const name=str('name');
          const redirectTo=location.protocol.startsWith('http')?`${location.origin}${location.pathname}`:undefined;
          const {data:created,error}=await sb.auth.signUp({email,password,options:{data:{name},emailRedirectTo:redirectTo}});
          if (error) throw error;
          if (!created.session) notify('Tjek din e-mail og bekræft kontoen. Derefter kan du logge ind.');
        } else {
          const {error}=await sb.auth.signInWithPassword({email,password});
          if (error) throw error;
        }
      }catch(e) {notify(friendlyError(e),true);}
      finally {state.busy=false;}
    }
  }
  document.addEventListener('click',actionHandler);
  document.addEventListener('submit',formHandler);
  document.addEventListener('change',event=>{
    const target=event.target;
    if(target?.id==='ph-list-select') {
      const id=target.value;
      if(!available().some(l=>l.id===id))return;
      state.priceListId=id;window.FamiliePris?.activate(id);render();return;
    }
    if(target?.id==='ph-include-checked') {window.FamiliePris?.includeChecked(target.checked);return;}
    if(target?.dataset?.priceRole==='product') {
      window.FamiliePris?.choose(target.dataset.itemId,target.value,countItems(state.priceListId));return;
    }
    if(target?.dataset?.priceRole==='quantity') {
      window.FamiliePris?.quantity(target.dataset.itemId,target.value);return;
    }
  });
  document.addEventListener('input',event=>{
    if (event.target?.id==='archive-search') {
      state.search=event.target.value;
      const result=document.getElementById('archive-results');
      if (result) result.innerHTML=renderArchiveResults();
      const counter=document.getElementById('archive-count');
      if (counter) {const n=archiveMatches().length;counter.textContent=`${n} ${n===1?'gemt liste':'gemte lister'}`;}
    }
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape' && state.modal) {state.modal=null;render();}
    if(event.key==='Enter' && event.target.classList?.contains('brand')) {event.preventDefault();state.view='home';state.menuOpen=false;render();}
  });
  // Defer price-page repaint until after the current input/change/blur event.
  // Replacing the whole app synchronously while a form control has focus
  // can cause DOM NotFoundError in Chromium on some platforms.
  let pricePaintPending=false;
  function renderPricesSoon(){
    if(pricePaintPending)return;
    pricePaintPending=true;
    requestAnimationFrame(()=>{
      pricePaintPending=false;
      if(state.view==='prices')render();
    });
  }
  window.FamiliePris?.configure({redraw:renderPricesSoon, notify});
  initialize();
})();
