// ── DATABASE SEED & MIGRATION ──
async function seedIfEmpty(){
  const s=await usersRef.once('value');
  const rSnap=await restaurantsRef.once('value');
  // If restaurants already exist, skip migration
  if(rSnap.exists()){
    // Upgrade legacy admin to super_admin if needed
    if(s.exists()){
      const users=s.val();
      for(const[k,u]of Object.entries(users)){
        if(u.role==='admin'&&u.username==='admin'&&!u.restaurantId){
          await usersRef.child(k).update({role:'super_admin'});
        }
      }
    }
    return;
  }
  // Create default restaurant from legacy data
  const legacyRest=(await restRef.once('value')).val()||{};
  const rid=uid();
  const restData={id:rid,name:legacyRest.name||'المطعم الرئيسي',phone:legacyRest.phone||'',address:legacyRest.address||'',hours:legacyRest.hours||'',notes:legacyRest.notes||'',delivery_number:legacyRest.phone||'',menu_image_url:'',active:true};
  await restaurantsRef.child(rid).set(restData);
  // Create super_admin if no users
  if(!s.exists()){
    const aid=uid();
    await usersRef.child(aid).set({id:aid,name:'المسؤول الرئيسي',username:'admin',password:'admin123',role:'super_admin'});
  } else {
    // Upgrade existing admin to super_admin
    const users=s.val();
    for(const[k,u]of Object.entries(users)){
      if(u.role==='admin'&&u.username==='admin'){
        await usersRef.child(k).update({role:'super_admin'});
      }
    }
  }
  // Migrate legacy menu items to menuItems with restaurantId
  const legacyMenu=(await menuRef.once('value')).val();
  if(legacyMenu){
    for(const[k,m]of Object.entries(legacyMenu)){
      const cat=(m.name&&m.name.includes('إضافة'))?'extras':'sandwiches';
      await menuItemsRef.child(k).set({...m,id:k,category:cat,restaurantId:rid});
    }
  } else {
    // Seed default menu
    const menu=[
      {name:'فول بلدي',emoji:'🫘',price:12,desc:'فول سادة (عيش بلدي)',category:'sandwiches'},
      {name:'فول إسكندراني',emoji:'🌶️',price:15,desc:'فول بالخلطة الإسكندراني',category:'sandwiches'},
      {name:'طعمية بلدي',emoji:'🧆',price:12,desc:'طعمية سادة (عيش بلدي)',category:'sandwiches'},
      {name:'طعمية محشية',emoji:'🧆',price:15,desc:'طعمية محشية بالخلطة',category:'sandwiches'},
      {name:'بطاطس بلدي',emoji:'🍟',price:17,desc:'بطاطس صوابع مقلية',category:'sandwiches'},
      {name:'أومليت بسطرمة',emoji:'🍳',price:23,desc:'بيض أومليت بالبسطرمة',category:'meals'},
      {name:'شكشوكة',emoji:'🍳',price:15,desc:'بيض بالطماطم والبصل',category:'meals'},
      {name:'مسقعة',emoji:'🍆',price:15,desc:'مسقعة مصرية بالباذنجان',category:'meals'},
      {name:'إضافة كاتشب مايونيز',emoji:'🥫',price:6,desc:'صوص كاتشب ومايونيز',category:'extras'}
    ];
    for(const m of menu){const id=uid();await menuItemsRef.child(id).set({...m,id,restaurantId:rid});}
  }
  // Tag existing orders with restaurantId
  const legacyOrders=(await ordersRef.once('value')).val();
  if(legacyOrders){
    const updates={};
    for(const[k,o]of Object.entries(legacyOrders)){
      if(!o.restaurantId) updates[k+'/restaurantId']=rid;
    }
    if(Object.keys(updates).length) await ordersRef.update(updates);
  }
}

// ── SIDEBAR RENDERING ──
function buildAdminSidebar(){
  const sa=isSuperAdmin(currentUser);
  let html=`<div style="padding:0 1.5rem 1rem;color:#fff;font-size:14px;font-weight:700;border-bottom:1px solid rgba(255,255,255,.1);">🔐 لوحة الإدارة</div>
    <div class="sidebar-title" style="margin-top:1rem;">الطلبات</div>
    <div class="sidebar-link active" onclick="switchAdmin('adminToday',this)"><span class="sidebar-icon">📋</span> طلبات اليوم</div>
    <div class="sidebar-title">القائمة</div>
    <div class="sidebar-link" onclick="switchAdmin('adminMenu',this)"><span class="sidebar-icon">🥪</span> إدارة الأصناف</div>
    <div class="sidebar-title">الحسابات</div>
    <div class="sidebar-link" onclick="switchAdmin('adminUsers',this)"><span class="sidebar-icon">👥</span> إدارة المستخدمين</div>`;
  if(sa){
    html+=`<div class="sidebar-link" onclick="switchAdmin('adminAdmins',this)"><span class="sidebar-icon">🔑</span> إدارة المسؤولين</div>`;
    html+=`<div class="sidebar-title">المنصة</div>
      <div class="sidebar-link" onclick="switchAdmin('adminRestaurants',this)"><span class="sidebar-icon">🏪</span> إدارة المطاعم</div>`;
  } else {
    html+=`<div class="sidebar-title">الإعدادات</div>
      <div class="sidebar-link" onclick="switchAdmin('adminRestaurant',this)"><span class="sidebar-icon">🏪</span> معلومات المطعم</div>`;
  }
  $('adminSidebar').innerHTML=html;
  // Mobile nav
  let mob=`<div class="mob-link active" onclick="switchAdminMob('adminToday',this)">📋 الطلبات</div>
    <div class="mob-link" onclick="switchAdminMob('adminMenu',this)">🥪 الأصناف</div>
    <div class="mob-link" onclick="switchAdminMob('adminUsers',this)">👥 المستخدمين</div>`;
  if(sa){
    mob+=`<div class="mob-link" onclick="switchAdminMob('adminAdmins',this)">🔑 المسؤولين</div>`;
    mob+=`<div class="mob-link" onclick="switchAdminMob('adminRestaurants',this)">🏪 المطاعم</div>`;
  } else {
    mob+=`<div class="mob-link" onclick="switchAdminMob('adminRestaurant',this)">🏪 المطعم</div>`;
  }
  $('mobileAdminNav').innerHTML=mob;
}
function switchAdminMob(sid,el){
  document.querySelectorAll('.mob-link').forEach(l=>l.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.admin-section').forEach(s=>s.classList.remove('active'));
  $(sid).classList.add('active');
  // Also sync sidebar
  document.querySelectorAll('.sidebar-link').forEach(l=>l.classList.remove('active'));
}

// ── INITIALIZATION ──
async function init(){
  try{
    await seedIfEmpty();
    usersRef.on('value',s=>{
      cUsers=s.val()||{};
      if(currentUser&&isAdmin(currentUser)){renderUsersAdmin();renderAdminsAdmin();populateRestSelects();}
    });
    menuItemsRef.on('value',s=>{
      cMenuItems=s.val()||{};
      if(currentUser){
        if(currentUser.role==='user'){if(selectedRestaurant)renderCategorizedMenu();}
        else renderMenuAdmin();
      }
    });
    // Legacy menu listener for backward compat
    menuRef.on('value',s=>{cMenu=s.val()||{};});
    ordersRef.on('value',s=>{
      cOrders=s.val()||{};
      if(currentUser&&isAdmin(currentUser))renderAdminToday();
      if(currentUser&&currentUser.role==='user')renderUserHistory();
    });
    restaurantsRef.on('value',s=>{
      cRestaurants=s.val()||{};
      if(currentUser&&currentUser.role==='user')renderRestaurantPicker();
      if(currentUser&&isAdmin(currentUser)){populateRestSelects();renderRestaurantsAdmin();}
      loadRestaurantView();
    });
    restRef.on('value',s=>{cRest=s.val()||{};});
    showPage('pageLogin');
  }catch(e){
    console.error(e);
    toast('❌ خطأ في الاتصال بـ Firebase','error');
    $('pageLoading').style.display='none';
    showPage('pageLogin');
  }
}

// ── AUTHENTICATION ──
async function doLogin(){
  const un=$('loginUsername').value.trim(),pw=$('loginPassword').value,err=$('loginError'),btn=$('loginBtn');
  if(!un||!pw){err.style.display='block';err.textContent='⚠️ يرجى تعبئة جميع الحقول';return;}
  btn.disabled=true;btn.textContent='جاري التحقق...';
  const user=Object.values(cUsers).find(u=>u.username===un&&u.password===pw);
  btn.disabled=false;btn.textContent='دخول';
  if(!user){err.style.display='block';err.textContent='❌ اسم المستخدم أو كلمة المرور غير صحيحة';return;}
  err.style.display='none';
  currentUser=user;
  $('navUser').style.display='flex';$('navUsername').textContent=user.name;
  if(isAdmin(user)){
    showPage('pageAdmin');
    $('todayDateLabel').textContent=fmtDate(Date.now());
    buildAdminSidebar();
    renderAdminToday();renderMenuAdmin();renderUsersAdmin();renderAdminsAdmin();
    populateRestSelects();renderRestaurantsAdmin();
    if(!isSuperAdmin(user))loadRestaurantForm();
  }else{
    selectedRestaurant=null;cart={};
    showPage('pageSelectRestaurant');
    $('welcomeNamePicker').textContent='أهلاً، '+user.name+'! 👋';
    renderRestaurantPicker();renderUserHistory();
  }
}
async function doRegister(){
  const name=$('regName').value.trim(),un=$('regUsername').value.trim(),pw=$('regPassword').value;
  const err=$('regError'),btn=$('regBtn');
  if(!name||!un||!pw){err.style.display='block';err.textContent='⚠️ يرجى تعبئة جميع الحقول';return;}
  if(Object.values(cUsers).find(u=>u.username===un)){err.style.display='block';err.textContent='❌ اسم المستخدم موجود بالفعل';return;}
  btn.disabled=true;btn.textContent='جاري الإنشاء...';
  const id=uid();
  await usersRef.child(id).set({id,name,username:un,password:pw,role:'user'});
  btn.disabled=false;btn.textContent='إنشاء الحساب';
  err.style.display='none';
  ['regName','regUsername','regPassword'].forEach(f=>$(f).value='');
  toast('✅ تم إنشاء الحساب! يمكنك تسجيل الدخول','success');
  showPage('pageLogin');
}
function logout(){
  currentUser=null;cart={};selectedRestaurant=null;
  $('navUser').style.display='none';
  $('loginUsername').value=$('loginPassword').value='';
  showPage('pageLogin');
}

// ── USER TAB SWITCHING ──
function switchUserTab(id,btn){
  const parent=btn.closest('.dashboard');
  parent.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const tabs=['tabOrder','tabHistory','tabRestaurants','tabHistoryGlobal'];
  tabs.forEach(t=>{const el=parent.querySelector('#'+t);if(el)el.style.display=t===id?'block':'none';});
  if(id==='tabHistory'||id==='tabHistoryGlobal')renderUserHistory();
}
