// ── ADMIN OPERATIONS ──
function switchAdmin(sid,link){
  document.querySelectorAll('.admin-section').forEach(s=>s.classList.remove('active'));$(sid).classList.add('active');
  document.querySelectorAll('.sidebar-link').forEach(l=>l.classList.remove('active'));if(link)link.classList.add('active');
  if(sid==='adminToday')renderAdminToday();
  if(sid==='adminMenu')renderMenuAdmin();
  if(sid==='adminUsers')renderUsersAdmin();
  if(sid==='adminAdmins')renderAdminsAdmin();
  if(sid==='adminRestaurants')renderRestaurantsAdmin();
  if(sid==='adminRestaurant'){loadRestaurantForm();loadRestaurantView();}
}

// ── HELPER: get items scoped to admin's restaurant ──
function getAdminMenuItems(){
  const all=Object.values(cMenuItems);
  const rid=getAdminRestId(currentUser);
  return rid?all.filter(m=>m.restaurantId===rid):all;
}
function getAdminOrders(){
  const all=Object.values(cOrders);
  const rid=getAdminRestId(currentUser);
  return rid?all.filter(o=>o.restaurantId===rid):all;
}

// ── TODAY'S ORDERS ──
function renderAdminToday(){
  const td=getAdminOrders().filter(o=>o.date===todayStr()).sort((a,b)=>a.timestamp-b.timestamp);
  const totAmt=td.reduce((s,o)=>s+o.total,0);
  const totItems=td.reduce((s,o)=>s+(o.items||[]).reduce((ss,i)=>ss+i.qty,0),0);
  $('todayStats').innerHTML=`
    <div class="stat-card"><div class="stat-number">${td.length}</div><div class="stat-label">عدد الطلبات</div></div>
    <div class="stat-card"><div class="stat-number">${totItems}</div><div class="stat-label">صنف طُلب</div></div>
    <div class="stat-card"><div class="stat-number">${td.length*2}</div><div class="stat-label">رسوم خدمة (جنيه)</div></div>
    <div class="stat-card"><div class="stat-number" style="color:var(--green);">${totAmt}</div><div class="stat-label">الإجمالي الكلي (جنيه)</div></div>`;
  const gb=$('grandTotalBar'),list=$('todayOrdersList');
  if(!td.length){gb.style.display='none';list.innerHTML='<div class="empty-state"><div class="empty-state-icon">📭</div><h3>لا توجد طلبات اليوم بعد</h3><p>انتظر حتى يسجّل الموظفون طلباتهم</p></div>';return;}
  gb.style.display='flex';$('grandTotalAmount').textContent=totAmt+' جنيه';
  list.innerHTML=td.map(o=>`<div class="today-order-card">
    <div class="today-order-header">
      <div><div class="today-order-user">👤 ${o.userName}</div><div class="today-order-time">🕐 ${fmtTime(o.timestamp)}${o.restaurantName?' | 🏪 '+o.restaurantName:''}</div></div>
      <span class="badge badge-green">✓ مسجّل</span>
    </div>
    <div>${(o.items||[]).map(i=>`<div class="today-order-item-line"><span>${i.emoji} ${i.name} × ${i.qty}</span><span>${i.price*i.qty} جنيه</span></div>`).join('')}</div>
    ${o.notes?`<div class="today-order-notes">📝 <strong>ملاحظات:</strong> ${o.notes}</div>`:''}
    <div style="margin-top:10px;">
      <div class="today-order-total-line"><span style="color:var(--text-light);">إجمالي الأصناف</span><span>${o.subtotal} جنيه</span></div>
      <div class="today-order-total-line"><span style="color:var(--text-light);">رسوم الخدمة</span><span>2 جنيه</span></div>
      <div class="today-order-total-line bold"><span>الإجمالي</span><span>${o.total} جنيه</span></div>
    </div>
  </div>`).join('');
}

// ── MENU ADMIN ──
function renderMenuAdmin(){
  const items=getAdminMenuItems();
  const catLabel=c=>CATEGORIES[c]||c;
  $('menuTableBody').innerHTML=items.length
    ?items.map(i=>`<tr><td style="font-size:24px;">${i.emoji}</td><td style="font-weight:700;">${i.name}</td><td><span class="badge badge-orange">${catLabel(i.category||'sandwiches')}</span></td><td style="color:var(--text-light);">${i.desc||'—'}</td><td><span class="badge badge-orange">${i.price} جنيه</span></td><td><button class="btn-sm btn-danger" onclick="delMenuItem('${i.id}')">🗑 حذف</button></td></tr>`).join('')
    :'<tr><td colspan="6" style="text-align:center;color:var(--text-light);padding:2rem;">لا توجد أصناف</td></tr>';
  // Show restaurant selector for super admin
  if(isSuperAdmin(currentUser)){
    $('menuRestSelectGroup').style.display='block';
  }
}
async function addMenuItem(){
  const name=$('nSName').value.trim(),price=parseFloat($('nSPrice').value),emoji=$('nSEmoji').value.trim()||'🥙',desc=$('nSDesc').value.trim(),cat=$('nSCategory').value;
  if(!name||!price){toast('⚠️ أدخل اسم الصنف والسعر','error');return;}
  let rid=getAdminRestId(currentUser);
  if(isSuperAdmin(currentUser)){
    const sel=$('nSRestaurant');
    rid=sel?sel.value:'';
    if(!rid){toast('⚠️ اختر المطعم','error');return;}
  }
  if(!rid){toast('⚠️ لا يوجد مطعم مرتبط','error');return;}
  const id=uid();
  await menuItemsRef.child(id).set({id,name,emoji,price,desc,category:cat,restaurantId:rid});
  ['nSName','nSPrice','nSEmoji','nSDesc'].forEach(f=>$(f).value='');
  toast('✅ تمت إضافة الصنف','success');
}
async function delMenuItem(id){if(!confirm('هل تريد حذف هذا الصنف؟'))return;await menuItemsRef.child(id).remove();toast('🗑 تم الحذف','');}

// ── USERS ADMIN ──
function renderUsersAdmin(){
  const u=Object.values(cUsers).filter(u=>u.role==='user');
  $('usersTableBody').innerHTML=u.length
    ?u.map((u,i)=>`<tr><td>${i+1}</td><td style="font-weight:700;">${u.name}</td><td style="color:var(--text-light);">@${u.username}</td><td><span class="badge badge-orange">مستخدم</span></td><td><button class="btn-sm btn-danger" onclick="delUser('${u.id}')">🗑 حذف</button></td></tr>`).join('')
    :'<tr><td colspan="5" style="text-align:center;color:var(--text-light);padding:2rem;">لا يوجد مستخدمون</td></tr>';
}
async function addUser(){
  const name=$('nUName').value.trim(),un=$('nUUsername').value.trim(),pw=$('nUPassword').value;
  if(!name||!un||!pw){toast('⚠️ يرجى تعبئة جميع الحقول','error');return;}
  if(Object.values(cUsers).find(u=>u.username===un)){toast('❌ اسم المستخدم موجود بالفعل','error');return;}
  const id=uid();await usersRef.child(id).set({id,name,username:un,password:pw,role:'user'});
  ['nUName','nUUsername','nUPassword'].forEach(f=>$(f).value='');
  toast('✅ تمت إضافة المستخدم','success');
}
async function delUser(id){
  if(id===currentUser.id){toast('❌ لا يمكنك حذف حسابك الحالي','error');return;}
  if(!confirm('هل تريد حذف هذا المستخدم؟'))return;
  await usersRef.child(id).remove();toast('🗑 تم الحذف','');
}

// ── ADMINS MANAGEMENT (Super Admin only) ──
function renderAdminsAdmin(){
  const a=Object.values(cUsers).filter(u=>u.role==='admin'||u.role==='super_admin');
  const getRestName=rid=>{const r=cRestaurants[rid];return r?r.name:'—';};
  const roleBadge=r=>r==='super_admin'?'<span class="badge badge-super">مسؤول رئيسي</span>':'<span class="badge badge-red">مسؤول</span>';
  $('adminsTableBody').innerHTML=a.map((u,i)=>`<tr><td>${i+1}</td><td style="font-weight:700;">${u.name}</td><td style="color:var(--text-light);">@${u.username}</td><td>${roleBadge(u.role)}</td><td>${u.restaurantId?getRestName(u.restaurantId):'الكل'}</td><td>${u.id!==currentUser.id?`<button class="btn-sm btn-danger" onclick="delUser('${u.id}')">🗑 حذف</button>`:'<span style="font-size:12px;color:var(--text-light);">أنت</span>'}</td></tr>`).join('');
}
async function addAdmin(){
  if(!isSuperAdmin(currentUser)){toast('❌ ليس لديك صلاحية إضافة مسؤولين','error');return;}
  const name=$('nAName').value.trim(),un=$('nAUsername').value.trim(),pw=$('nAPassword').value;
  const role=$('nARole').value,restId=$('nARestaurant').value;
  if(!name||!un||!pw){toast('⚠️ يرجى تعبئة جميع الحقول','error');return;}
  if(Object.values(cUsers).find(u=>u.username===un)){toast('❌ اسم المستخدم موجود بالفعل','error');return;}
  const id=uid();
  const userData={id,name,username:un,password:pw,role};
  if(role==='admin'&&restId)userData.restaurantId=restId;
  await usersRef.child(id).set(userData);
  ['nAName','nAUsername','nAPassword'].forEach(f=>$(f).value='');
  toast('✅ تمت إضافة المسؤول','success');
}

// ── POPULATE RESTAURANT SELECTS ──
function populateRestSelects(){
  const rests=Object.values(cRestaurants);
  const opts=rests.map(r=>`<option value="${r.id}">${r.name}</option>`).join('');
  ['nARestaurant','nSRestaurant'].forEach(id=>{const el=$(id);if(el)el.innerHTML=opts||'<option value="">لا توجد مطاعم</option>';});
}

// ── RESTAURANTS MANAGEMENT (Super Admin) ──
function renderRestaurantsAdmin(){
  const list=$('restaurantsAdminList');if(!list)return;
  const rests=Object.values(cRestaurants);
  if(!rests.length){list.innerHTML='<div class="empty-state"><div class="empty-state-icon">🏪</div><h3>لا توجد مطاعم</h3></div>';return;}
  list.innerHTML=rests.map(r=>`<div class="card-form" style="margin-bottom:1rem;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
      <div><span style="font-size:18px;font-weight:800;">🏪 ${r.name}</span>
        ${r.active===false?'<span class="badge badge-red" style="margin-right:8px;">معطل</span>':'<span class="badge badge-green" style="margin-right:8px;">نشط</span>'}
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn-sm btn-danger" onclick="delRestaurant('${r.id}')">🗑 حذف</button>
      </div>
    </div>
    <div class="info-grid">
      <div class="info-item"><label>رقم التواصل</label><span>${r.phone||'—'}</span></div>
      <div class="info-item"><label>رقم الدليفري</label><span>${r.delivery_number?`<a class="delivery-link" href="tel:${r.delivery_number}">📞 ${r.delivery_number}</a>`:'—'}</span></div>
      <div class="info-item"><label>العنوان</label><span>${r.address||'—'}</span></div>
      <div class="info-item"><label>أوقات العمل</label><span>${r.hours||'—'}</span></div>
    </div>
    ${r.notes?`<div style="margin-top:8px;font-size:13px;color:var(--text-light);">📝 ${r.notes}</div>`:''}
  </div>`).join('');
}
async function addRestaurant(){
  if(!isSuperAdmin(currentUser)){toast('❌ ليس لديك صلاحية','error');return;}
  const name=$('nRName').value.trim(),phone=$('nRPhone').value.trim(),delivery=$('nRDelivery').value.trim();
  const hours=$('nRHours').value.trim(),address=$('nRAddress').value.trim(),menuImg=$('nRMenuImage').value.trim(),notes=$('nRNotes').value.trim();
  if(!name){toast('⚠️ أدخل اسم المطعم','error');return;}
  const id=uid();
  await restaurantsRef.child(id).set({id,name,phone,address,hours,notes,delivery_number:delivery,menu_image_url:menuImg,active:true});
  ['nRName','nRPhone','nRDelivery','nRHours','nRAddress','nRMenuImage','nRNotes'].forEach(f=>{const el=$(f);if(el)el.value='';});
  toast('✅ تمت إضافة المطعم','success');
}
async function delRestaurant(id){
  if(!confirm('هل تريد حذف هذا المطعم وجميع أصنافه؟'))return;
  await restaurantsRef.child(id).remove();
  // Delete related menu items
  const items=Object.values(cMenuItems).filter(m=>m.restaurantId===id);
  for(const item of items)await menuItemsRef.child(item.id).remove();
  toast('🗑 تم حذف المطعم','');
}

// ── RESTAURANT INFO (Regular Admin) ──
function loadRestaurantForm(){
  const rid=getAdminRestId(currentUser);if(!rid)return;
  const r=cRestaurants[rid]||{};
  $('restName').value=r.name||'';$('restPhone').value=r.phone||'';
  $('restAddress').value=r.address||'';$('restHours').value=r.hours||'';
  $('restNotes').value=r.notes||'';$('restDelivery').value=r.delivery_number||'';
  $('restMenuImage').value=r.menu_image_url||'';
}
function loadRestaurantView(){
  const rid=getAdminRestId(currentUser);
  if(!rid){return;}
  const r=cRestaurants[rid]||{};
  const s=id=>$(id);
  if(s('ri_name'))s('ri_name').textContent=r.name||'—';
  if(s('ri_phone'))s('ri_phone').textContent=r.phone||'—';
  if(s('ri_address'))s('ri_address').textContent=r.address||'—';
  if(s('ri_hours'))s('ri_hours').textContent=r.hours||'—';
  if(s('ri_delivery'))s('ri_delivery').textContent=r.delivery_number||'—';
  if(s('ri_notes'))s('ri_notes').textContent=r.notes||'—';
}
async function saveRestaurant(){
  const rid=getAdminRestId(currentUser);if(!rid){toast('❌ لا يوجد مطعم مرتبط','error');return;}
  await restaurantsRef.child(rid).update({
    name:$('restName').value.trim(),phone:$('restPhone').value.trim(),
    address:$('restAddress').value.trim(),hours:$('restHours').value.trim(),
    notes:$('restNotes').value.trim(),delivery_number:$('restDelivery').value.trim(),
    menu_image_url:$('restMenuImage').value.trim()
  });
  toast('✅ تم حفظ معلومات المطعم','success');
}

// ── APP STARTUP ──
$('todayDateLabel').textContent=fmtDate(Date.now());
init();
