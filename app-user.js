// ── RESTAURANT PICKER (User) ──
function renderRestaurantPicker(){
  const grid=$('restaurantGrid');
  if(!grid)return;
  const rests=Object.values(cRestaurants).filter(r=>r.active!==false);
  if(!rests.length){grid.innerHTML='<div class="empty-state"><div class="empty-state-icon">🏪</div><h3>لا توجد مطاعم متاحة حالياً</h3></div>';return;}
  grid.innerHTML=rests.map(r=>`<div class="restaurant-card" onclick="selectRestaurant('${r.id}')">
    <div class="rc-name">🏪 ${r.name}</div>
    <div class="rc-address">${r.address||'عنوان غير محدد'}</div>
    ${r.hours?`<div class="rc-hours">🕐 ${r.hours}</div>`:''}
    ${r.delivery_number?`<a class="delivery-link" href="tel:${r.delivery_number}" onclick="event.stopPropagation()">📞 ${r.delivery_number}</a>`:''}
    ${r.menu_image_url?`<div style="margin-top:8px"><img src="${r.menu_image_url}" style="width:100%;border-radius:10px;max-height:120px;object-fit:cover;" alt="منيو"></div>`:''}
  </div>`).join('');
}
function selectRestaurant(rid){
  selectedRestaurant=cRestaurants[rid];
  if(!selectedRestaurant)return;
  $('selectedRestName').textContent='🏪 '+selectedRestaurant.name;
  // Show delivery number
  const dBox=$('deliveryNumberBox');
  if(selectedRestaurant.delivery_number){
    dBox.innerHTML=`<a class="delivery-link delivery-link-lg" href="tel:${selectedRestaurant.delivery_number}">📞 اتصل للدليفري: ${selectedRestaurant.delivery_number}</a>`;
  }else{dBox.innerHTML='';}
  cart={};
  showPage('pageUser');
  renderCategorizedMenu();
  renderUserHistory();
}
function backToRestaurants(){
  selectedRestaurant=null;cart={};
  showPage('pageSelectRestaurant');
  renderRestaurantPicker();
}

// ── CATEGORIZED MENU (User) ──
function renderCategorizedMenu(){
  const container=$('menuCategorized');
  if(!container||!selectedRestaurant)return;
  const items=Object.values(cMenuItems).filter(m=>m.restaurantId===selectedRestaurant.id);
  if(!items.length){container.innerHTML='<div class="empty-state"><div class="empty-state-icon">📭</div><h3>القائمة فارغة حالياً</h3></div>';return;}
  // Group by category
  const groups={};
  items.forEach(item=>{
    const cat=item.category||'sandwiches';
    if(!groups[cat])groups[cat]=[];
    groups[cat].push(item);
  });
  let html='';
  for(const[cat,label] of Object.entries(CATEGORIES)){
    if(!groups[cat]||!groups[cat].length)continue;
    html+=`<div class="category-section" id="cat_${cat}">
      <div class="category-header" onclick="toggleCategory('${cat}')">${label} <span class="ch-toggle">▼</span></div>
      <div class="menu-grid">`;
    groups[cat].forEach(item=>{
      const qty=cart[item.id]||0;
      html+=`<div class="menu-item${qty>0?' selected':''}">
        <div class="menu-item-qty">${qty}</div>
        <div class="menu-item-icon">${item.emoji}</div>
        <div class="menu-item-name">${item.name}</div>
        <div class="menu-item-price">${item.price} جنيه</div>
        <div class="qty-controls">
          <button class="qty-btn" onclick="chQty('${item.id}',-1,event)">−</button>
          <div class="qty-display">${qty}</div>
          <button class="qty-btn" onclick="chQty('${item.id}',1,event)">+</button>
        </div>
      </div>`;
    });
    html+=`</div></div>`;
  }
  container.innerHTML=html;
  updateSummary();
}
function toggleCategory(cat){
  const sec=$('cat_'+cat);
  if(sec)sec.classList.toggle('collapsed');
}
function chQty(id,d,e){e.stopPropagation();cart[id]=Math.max(0,(cart[id]||0)+d);if(!cart[id])delete cart[id];renderCategorizedMenu();}
function updateSummary(){
  const lines=$('orderSummaryLines'),tot=$('orderTotalSection'),ents=Object.entries(cart);
  if(!ents.length){lines.innerHTML='<p style="color:var(--text-light);font-size:14px;text-align:center;padding:1rem;">لم تختر شيئاً بعد</p>';tot.style.display='none';return;}
  let sub=0,html='';
  ents.forEach(([id,qty])=>{const it=cMenuItems[id];if(!it)return;const l=it.price*qty;sub+=l;html+=`<div class="order-line"><span>${it.emoji} ${it.name} × ${qty}</span><span>${l} جنيه</span></div>`;});
  lines.innerHTML=html;tot.style.display='block';
  $('orderSubtotal').textContent=sub+' جنيه';$('orderTotal').textContent=(sub+2)+' جنيه';
}

// ── ORDER SUBMISSION ──
async function submitOrder(){
  const ents=Object.entries(cart),notes=$('orderNotes').value.trim();
  if(!ents.length&&!notes){toast('⚠️ اختر صنفاً أو أضف ملاحظة','error');return;}
  if(!selectedRestaurant){toast('⚠️ يرجى اختيار مطعم أولاً','error');return;}
  const existingOrder=Object.values(cOrders).find(o=>o.userId===currentUser.id&&o.date===todayStr()&&o.restaurantId===selectedRestaurant.id);
  if(existingOrder){toast('⚠️ لقد سجّلت طلبك لهذا اليوم من هذا المطعم بالفعل','error');return;}
  const btn=$('submitOrderBtn');btn.disabled=true;btn.textContent='جاري الحفظ...';
  let sub=0;
  const items=ents.map(([id,qty])=>{const it=cMenuItems[id];sub+=it.price*qty;return{id,name:it.name,emoji:it.emoji,price:it.price,qty};});
  const oid=uid();
  await ordersRef.child(oid).set({id:oid,userId:currentUser.id,userName:currentUser.name,items,notes,subtotal:sub,serviceFee:2,total:sub+2,date:todayStr(),timestamp:Date.now(),restaurantId:selectedRestaurant.id,restaurantName:selectedRestaurant.name});
  btn.disabled=false;btn.textContent='✅ تأكيد الطلب';
  cart={};$('orderNotes').value='';renderCategorizedMenu();
  toast('✅ تم تسجيل طلبك بنجاح!','success');
}

// ── USER HISTORY ──
function renderUserHistory(){
  if(!currentUser)return;
  // Render in both locations
  ['userHistoryList','userHistoryListGlobal'].forEach(elId=>{
    const list=$(elId);if(!list)return;
    const mine=Object.values(cOrders).filter(o=>o.userId===currentUser.id).sort((a,b)=>b.timestamp-a.timestamp);
    if(!mine.length){list.innerHTML='<div class="empty-state"><div class="empty-state-icon">📭</div><h3>لا توجد طلبات سابقة</h3><p>اطلب إفطارك اليوم!</p></div>';return;}
    list.innerHTML=mine.map(o=>`<div class="order-history-card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="font-size:12px;color:var(--text-light);">📅 ${fmtDate(o.timestamp)}</span>
        <span class="badge badge-green">✓ مسجّل</span>
      </div>
      ${o.restaurantName?`<div style="font-size:13px;color:var(--orange);font-weight:700;margin-bottom:6px;">🏪 ${o.restaurantName}</div>`:''}
      <div style="font-size:14px;color:var(--text-mid);margin-bottom:8px;">
        ${(o.items||[]).map(i=>`${i.emoji} ${i.name} ×${i.qty}`).join(' | ')}
        ${o.notes?`<div style="margin-top:4px;color:var(--text-light);">📝 ${o.notes}</div>`:''}
      </div>
      <div style="font-size:15px;font-weight:800;color:var(--orange);">الإجمالي: ${o.total} جنيه <span style="font-size:12px;color:var(--text-light);font-weight:400;">(شامل 2 جنيه خدمة)</span></div>
    </div>`).join('');
  });
}
