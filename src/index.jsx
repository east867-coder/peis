import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@vercel/kv';

// --- 1. 云端数据库初始化 (放在函数外面) ---
const kv = createClient({
  url: import.meta.env.VITE_KV_REST_API_URL,
  token: import.meta.env.VITE_KV_REST_API_TOKEN,
});

// --- 2. 常量定义 (放在函数外面) ---
const CATEGORIES = ['全部', '蔬菜', '肉类', '海鲜', '调料', '主食', '水果', '其他'];
const INITIAL_MATERIALS = [ /* 你的初始数据... */ ];

// --- 3. 组件主体 ---
function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [ingredients, setIngredients] = useState(INITIAL_MATERIALS);
  const [orders, setOrders] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // 这里放你的 useEffect 同步逻辑...

  return (
    // 这里是你的 HTML/JSX 代码...
    <div>内容...</div>
  );
} // <--- 确保这里有关闭 App 函数的大括号

// --- 4. 渲染入口 ---
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
// --- 常量与初始数据 ---

const CATEGORIES = ['全部', '蔬菜', '肉类', '海鲜', '调料', '主食', '水果', '其他'];

const INITIAL_MATERIALS = [
  { id: 'v1', code: 'V001', name: '土豆', category: '蔬菜', unit: 'kg', currentStock: 25, minStock: 10 },
  { id: 'm1', code: 'M001', name: '猪五花', category: '肉类', unit: 'kg', currentStock: 15, minStock: 5 },
  { id: 's1', code: 'S001', name: '生抽', category: '调料', unit: '瓶', currentStock: 8, minStock: 2 },
];

const INITIAL_CUSTOMERS = [
  { id: 'c1', name: '四季火锅店', phone: '13800138001', address: '创业路 88 号', totalDebt: 12500, lat: 31.2304, lng: 121.4737 },
  { id: 'c2', name: '老李家常菜', phone: '13911112222', address: '民生街 12 号', totalDebt: 3400, lat: 31.2211, lng: 121.4891 },
];

const DEFAULT_USERS = [
  { id: 'u1', name: '管理员', role: 'Admin', password: '111' },
  { id: 'u2', name: '王师傅', role: '送货员', password: '222' },
];

const ROLE_PERMISSIONS = {
  'Admin': ['dashboard', 'inventory', 'customer', 'inbound', 'outbound', 'user_mgmt'],
  '老板': ['dashboard', 'inventory', 'customer', 'inbound', 'outbound'],
  '采购员': ['dashboard', 'inventory', 'inbound'],
  '送货员': ['dashboard', 'customer', 'outbound'],
};

// --- 工具函数 ---

const formatCurrency = (amount, locale = 'zh-CN') => `¥${Number(amount).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatDate = (ts) => new Date(ts).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

const handleCapturePhoto = (multiple = false) => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (multiple) input.multiple = true;
    input.setAttribute('capture', 'environment');
    input.onchange = async (e) => {
      const target = e.target;
      const files = target.files;
      if (!files || files.length === 0) {
        resolve(null);
        return;
      }
      
      const readAsDataURL = (file) => {
        return new Promise((res) => {
          const reader = new FileReader();
          reader.onload = (ev) => res(ev.target.result);
          reader.readAsDataURL(file);
        });
      };

      if (multiple) {
        const results = await Promise.all(Array.from(files).map(f => readAsDataURL(f)));
        resolve(results);
      } else {
        const result = await readAsDataURL(files[0]);
        resolve(result);
      }
    };
    input.click();
  });
};

const openNavigation = (customer, type) => {
  const { address, name, lat, lng } = customer;
  let url = '';
  if (type === 'amap') {
    url = lat && lng ? `https://uri.amap.com/marker?position=${lng},${lat}&name=${name}` : `https://www.amap.com/search?query=${encodeURIComponent(address)}`;
  } else if (type === 'baidu') {
    url = lat && lng ? `https://api.map.baidu.com/marker?location=${lat},${lng}&title=${name}&content=${address}&output=html` : `https://map.baidu.com/search/${encodeURIComponent(address)}`;
  } else if (type === 'google') {
    url = lat && lng ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  } else if (type === 'geo') {
    url = lat && lng ? `geo:${lat},${lng}?q=${encodeURIComponent(name)}` : `geo:0,0?q=${encodeURIComponent(address)}`;
  }
  window.open(url, '_blank');
};

// --- 子组件: 订单详情 ---

const OrderDetailView = ({ order, customers, users, onPrint }) => {
  const customer = customers.find((c) => c.id === order.customerId);
  const operator = users.find((u) => u.id === order.operatorId);
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
         <div>
            <h3 className="text-2xl font-black gradient-text uppercase">{order.type === 'IN' ? '采购进货单' : '商户配送单'}</h3>
            <p className="text-[10px] text-slate-500 font-mono mt-1 tracking-widest">ID: {order.id}</p>
         </div>
         <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${order.type === 'IN' ? 'bg-indigo-500 text-white' : 'bg-cyan-500 text-white shadow-lg'}`}>
            {order.type === 'IN' ? '采购流水' : '销售配送'}
         </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
         <div className="glass p-3 rounded-2xl"><p className="text-[8px] text-slate-500 font-black mb-1 uppercase">日期</p><p className="text-xs font-bold">{formatDate(order.date)}</p></div>
         <div className="glass p-3 rounded-2xl"><p className="text-[8px] text-slate-500 font-black mb-1 uppercase">{order.type === 'IN' ? '操作员' : '收货客户'}</p><p className="text-xs font-bold truncate">{order.type === 'IN' ? operator?.name : customer?.name || '散客'}</p></div>
      </div>
      <div className="glass rounded-[24px] overflow-hidden">
         <table className="w-full text-[11px] text-left">
            <thead className="bg-white/5 text-slate-500 font-black uppercase">
               <tr><th className="px-4 py-2.5">品名</th><th className="px-4 py-2.5">数量</th><th className="px-4 py-2.5 text-right">小计</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
               {order.items.map((item) => (
                  <tr key={item.id}><td className="px-4 py-3 font-bold">{item.name}</td><td className="px-4 py-3 text-slate-400">{item.quantity}{item.unit} × {item.price}</td><td className="px-4 py-3 text-right font-mono font-bold text-indigo-400">{formatCurrency(item.quantity * item.price)}</td></tr>
               ))}
            </tbody>
         </table>
      </div>
      <div className="flex justify-between items-center p-5 glass rounded-[24px] border-indigo-500/30 border"><span className="text-xs text-slate-400 font-black uppercase tracking-widest">总金额</span><span className="text-2xl font-black font-mono text-indigo-400">{formatCurrency(order.totalAmount)}</span></div>
      
      {order.photos && order.photos.length > 0 && (
        <div className="space-y-3">
           <h4 className="text-[10px] text-slate-500 font-black uppercase tracking-widest px-1">原始单据留底 ({order.photos.length})</h4>
           <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {order.photos.map((img, i) => (
                <div key={i} className="shrink-0 w-24 h-24 rounded-xl overflow-hidden glass border border-white/5 shadow-lg">
                  <img src={img} className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform" onClick={() => window.open(img)} />
                </div>
              ))}
           </div>
        </div>
      )}

      <button onClick={() => onPrint(order)} className="w-full py-4 bg-slate-800 rounded-2xl text-xs font-black uppercase text-slate-300 flex items-center justify-center gap-2 hover:bg-slate-700 transition-all active:scale-95 shadow-xl"><i data-lucide="printer" className="w-4 h-4"></i> 重新打印单据</button>
    </div>
  );
};

// --- 主程序 ---

const App = () => {
  const [currentUser, setCurrentUser] = useState(DEFAULT_USERS[0]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [ingredients, setIngredients] = useState(INITIAL_MATERIALS);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [users, setUsers] = useState(DEFAULT_USERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState('全部');
  const [authError, setAuthError] = useState(false);
  const [aiPasteText, setAiPasteText] = useState('');
  const [showAiTextInput, setShowAiTextInput] = useState(false);
  const [tempPhotos, setTempPhotos] = useState([]);

  // 逻辑 A：初始化加载 —— 从云端拉取
  useEffect(() => {
    const fetchCloudData = async () => {
      setIsSyncing(true);
      try {
        const [cloudIngredients, cloudOrders] = await Promise.all([
          kv.get('materials'),
          kv.get('orders')
        ]);

        if (cloudIngredients) setIngredients(cloudIngredients);
        if (cloudOrders) setOrders(cloudOrders);
        console.log("✅ 云端数据加载成功");
      } catch (err) {
        console.error("❌ 云端拉取失败，使用本地默认值", err);
      } finally {
        setIsSyncing(false);
      }
    };
    fetchCloudData();
  }, []);

  // 逻辑 B：自动保存 —— 监听数据变化并推送到云端
  useEffect(() => {
    const saveData = async () => {
      // 只有当数据不是初始默认状态时才保存，防止覆盖云端已有的数据
      if (ingredients !== INITIAL_MATERIALS) {
        try {
          await kv.set('materials', ingredients);
          await kv.set('orders', orders);
          console.log("☁️ 数据已同步至云端");
        } catch (err) {
          console.error("❌ 同步至云端失败", err);
        }
      }
    };

    // 使用防抖或简单的延迟，避免频繁触发 API 请求
    const timer = setTimeout(saveData, 1000); 
    return () => clearTimeout(timer);
  }, [ingredients, orders]);
  const handleOpenModal = (type, data) => {
    setModalType(type);
    setSelectedItem(data || null);
    setShowAiTextInput(false);
    setAiPasteText('');
    setTempPhotos([]); 
    setIsModalOpen(true);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) { alert("您的浏览器不支持地理位置功能"); return; }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setSelectedItem((prev) => ({ ...prev, lat: latitude, lng: longitude }));
        setIsGettingLocation(false);
      },
      (err) => { alert("获取位置失败: " + err.message); setIsGettingLocation(false); },
      { enableHighAccuracy: true }
    );
  };

  const handleUploadPhotos = async () => {
    if (tempPhotos.length >= 7) {
      alert("每单最多支持上传 7 张单据照片");
      return;
    }
    const results = await handleCapturePhoto(true);
    if (results && Array.isArray(results)) {
      const nextPhotos = [...tempPhotos, ...results].slice(0, 7);
      setTempPhotos(nextPhotos);
    }
  };

  const removePhoto = (index) => {
    setTempPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const processWithAi = async (input) => {
    setIsAiScanning(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `你是一个专业的食材单据数字化助手。请从提供的信息（图片或文字）中提取食材清单明细。
      要求：
      1. 必须识别出：品名(name)、数量(quantity, 数字型)、单位(unit)、单价(price, 数字型)。
      2. 如果是手写或不清晰的文字，请基于食材常识进行推断修正。
      3. 输出格式必须是 JSON 数组。`;

      const contentsParts = [{ text: prompt }];
      if (input.photo) {
        contentsParts.push({ inlineData: { mimeType: 'image/jpeg', data: input.photo.split(',')[1] } });
      } else if (input.text) {
        contentsParts.push({ text: `原始文字内容：\n${input.text}` });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: contentsParts },
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                quantity: { type: Type.NUMBER },
                unit: { type: Type.STRING },
                price: { type: Type.NUMBER }
              },
              required: ["name", "quantity", "unit", "price"]
            }
          }
        }
      });

      const items = JSON.parse(response.text || '[]');
      if (items.length > 0) {
        setSelectedItem((prev) => ({ ...prev, items: [...(prev?.items || []), ...items] }));
        setShowAiTextInput(false);
        setAiPasteText('');
      } else {
        alert("未能识别到有效明细，请重试");
      }
    } catch (e) {
      console.error(e);
      alert("AI 识别失败，请检查网络或 API Key");
    } finally {
      setIsAiScanning(false);
    }
  };

  const saveOrderAction = useCallback((type, orderData) => {
    const newOrder = {
      id: `${type}${Date.now().toString().slice(-6)}`,
      type,
      date: Date.now(),
      operatorId: currentUser.id,
      items: orderData.items,
      totalAmount: orderData.totalAmount,
      note: orderData.note || '',
      photos: orderData.photos,
    };
    if (type === 'OUT' && orderData.customerId) newOrder.customerId = orderData.customerId;
    setOrders(prev => [newOrder, ...prev]);
    setIngredients(prev => {
      const next = [...prev];
      newOrder.items.forEach((item) => {
        const idx = next.findIndex(i => i.name.trim() === item.name.trim());
        if (idx > -1) { next[idx] = { ...next[idx], currentStock: type === 'IN' ? next[idx].currentStock + item.quantity : next[idx].currentStock - item.quantity }; }
        else if (type === 'IN') { next.push({ id: Math.random().toString(), code: `V${Date.now().toString().slice(-3)}`, name: item.name, category: '其他', unit: item.unit, currentStock: item.quantity, minStock: 5 }); }
      });
      return next;
    });
    if (type === 'OUT' && orderData.customerId) { setCustomers(prev => prev.map(c => c.id === orderData.customerId ? { ...c, totalDebt: c.totalDebt + orderData.totalAmount } : c)); }
    setIsModalOpen(false);
    if (orderData.shouldPrint) { setSelectedItem(newOrder); setModalType('detail'); setIsModalOpen(true); setTimeout(() => window.print(), 300); }
  }, [currentUser]);

  const dashboardStats = useMemo(() => {
    const today = new Date().setHours(0,0,0,0);
    const todayIn = orders.filter(o => o.type === 'IN' && o.date >= today).reduce((a, b) => a + b.totalAmount, 0);
    const todayOut = orders.filter(o => o.type === 'OUT' && o.date >= today).reduce((a, b) => a + b.totalAmount, 0);
    const totalDebt = customers.reduce((a, b) => a + b.totalDebt, 0);
    const lowStock = ingredients.filter(i => i.currentStock <= i.minStock).length;
    return { todayIn, todayOut, totalDebt, lowStock };
  }, [orders, customers, ingredients]);

  const allowedTabs = ROLE_PERMISSIONS[currentUser.role];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0b1120] text-slate-200">
      <nav className="fixed bottom-0 left-0 right-0 md:relative md:w-64 glass border-t md:border-t-0 md:border-r border-slate-800 flex md:flex-col justify-around md:justify-start md:p-6 z-[60] py-3 print:hidden">
        <h1 className="hidden md:block text-2xl font-black gradient-text mb-10 tracking-tighter text-center uppercase">智厨 Pro</h1>
        <div className="flex md:flex-col w-full gap-1 overflow-x-auto no-scrollbar">
          {[
            {id: 'dashboard', icon: 'layout-dashboard', label: '工作台'},
            {id: 'inventory', icon: 'box', label: '物料中心'},
            {id: 'customer', icon: 'users', label: '商户档案'},
            {id: 'inbound', icon: 'shopping-bag', label: '采购流水'},
            {id: 'outbound', icon: 'truck', label: '配送流水'},
            {id: 'user_mgmt', icon: 'user-cog', label: '用户管理'}
          ].filter(item => allowedTabs.includes(item.id)).map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 p-3 rounded-2xl transition-all ${activeTab === item.id ? 'text-indigo-400 md:bg-indigo-600 md:text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}>
              <i data-lucide={item.icon} className="w-5 h-5"></i><span className="text-[10px] md:text-sm font-bold">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1 h-screen overflow-y-auto custom-scrollbar p-6 md:p-8 print:hidden pb-24 md:pb-8">
        <header className="flex justify-between items-center mb-10">
          <div><h2 className="text-2xl font-black tracking-tight flex items-center gap-3"><span className="bg-indigo-600/20 text-indigo-400 px-3 py-1 rounded-xl text-xs">{currentUser.role}</span>{activeTab === 'dashboard' ? `早安, ${currentUser.name}` : activeTab === 'inventory' ? '物料管理中心' : activeTab === 'customer' ? '商户档案中心' : activeTab === 'inbound' ? '采购台账' : activeTab === 'outbound' ? '配送台账' : '职员权限中心'}</h2></div>
          <div className="flex gap-2">
            {(activeTab === 'inbound' || activeTab === 'dashboard') && <button onClick={() => handleOpenModal('order_in')} className="bg-indigo-600 px-5 py-3 rounded-2xl text-[10px] font-black shadow-lg hover:bg-indigo-500 transition-all">采购入库</button>}
            {(activeTab === 'outbound' || activeTab === 'dashboard') && <button onClick={() => handleOpenModal('order_out')} className="bg-cyan-600 px-5 py-3 rounded-2xl text-[10px] font-black shadow-lg hover:bg-cyan-500 transition-all">销售配送</button>}
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass p-5 rounded-3xl border border-white/5"><p className="text-[10px] text-slate-500 font-black mb-1 uppercase tracking-widest">今日采购额</p><p className="text-xl font-black text-indigo-400 font-mono">{formatCurrency(dashboardStats.todayIn)}</p></div>
              <div className="glass p-5 rounded-3xl border border-white/5"><p className="text-[10px] text-slate-500 font-black mb-1 uppercase tracking-widest">今日销售额</p><p className="text-xl font-black text-cyan-400 font-mono">{formatCurrency(dashboardStats.todayOut)}</p></div>
              <div className="glass p-5 rounded-3xl border border-white/5"><p className="text-[10px] text-slate-500 font-black mb-1 uppercase tracking-widest">全平台应收</p><p className="text-xl font-black text-rose-400 font-mono">{formatCurrency(dashboardStats.totalDebt)}</p></div>
              <div className="glass p-5 rounded-3xl border border-white/5"><p className="text-[10px] text-slate-500 font-black mb-1 uppercase tracking-widest">缺货预警</p><p className={`text-xl font-black ${dashboardStats.lowStock > 0 ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>{dashboardStats.lowStock} 项</p></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass p-6 rounded-[32px] border border-white/5">
                 <h3 className="text-sm font-black mb-4 flex items-center gap-2 text-indigo-400"><i data-lucide="history" className="w-4 h-4"></i> 最近业务流水</h3>
                 <div className="space-y-3">
                   {orders.slice(0, 5).map(o => (
                     <div key={o.id} onClick={() => handleOpenModal('detail', o)} className="flex justify-between items-center py-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-all px-2 rounded-xl">
                       <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${o.type === 'IN' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-cyan-500/20 text-cyan-400'}`}>{o.type}</span>
                       <div className="flex-1 ml-4"><p className="text-xs font-bold">{o.id}</p><p className="text-[8px] text-slate-500 uppercase">{o.type === 'OUT' ? customers.find(c => c.id === o.customerId)?.name : '补录进货'}</p></div>
                       <p className="text-sm font-black font-mono">{formatCurrency(o.totalAmount)}</p>
                     </div>
                   ))}
                 </div>
              </div>
              <div className="glass p-6 rounded-[32px] border border-white/5">
                 <h3 className="text-sm font-black mb-4 flex items-center gap-2 text-rose-400"><i data-lucide="alert-triangle" className="w-4 h-4"></i> 库存告急清单</h3>
                 <div className="space-y-2">
                   {ingredients.filter(i => i.currentStock <= i.minStock).slice(0, 5).map(i => (
                     <div key={i.id} className="flex justify-between items-center p-3 bg-rose-500/5 border border-rose-500/10 rounded-2xl">
                       <div><p className="text-xs font-bold">{i.name}</p><p className="text-[8px] text-slate-500">剩余: {i.currentStock.toFixed(1)}{i.unit}</p></div>
                       <div className="text-right text-rose-400"><p className="text-[10px] font-black uppercase">补货</p><p className="text-xs font-mono font-black">{(i.minStock * 2 - i.currentStock).toFixed(1)} {i.unit}</p></div>
                     </div>
                   ))}
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-6 animate-in slide-in-from-right-10">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">{CATEGORIES.map(cat => ( <button key={cat} onClick={() => setSelectedCat(cat)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${selectedCat === cat ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-900 border-white/5 text-slate-500 hover:text-slate-300'}`}>{cat}</button> ))}</div>
              <div className="relative"><i data-lucide="search" className="absolute left-3 top-3 w-4 h-4 text-slate-600"></i><input className="bg-slate-900 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs outline-none w-full md:w-64 focus:border-indigo-500" placeholder="搜索品名、编号..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {ingredients.filter(i => (selectedCat === '全部' || i.category === selectedCat) && i.name.includes(searchTerm)).map(i => (
                <div key={i.id} className={`glass p-5 rounded-[28px] border relative group ${i.currentStock <= i.minStock ? 'border-rose-500/30' : 'border-white/5 hover:border-indigo-500/30'}`}>
                  <div className="flex justify-between items-start mb-4"><span className="text-[8px] bg-slate-900 px-2 py-0.5 rounded-full font-black text-slate-500 uppercase">{i.category}</span><button onClick={() => handleOpenModal('edit_ing', i)} className="p-1.5 bg-slate-800 rounded-lg opacity-0 group-hover:opacity-100 transition-all text-slate-400 hover:text-white"><i data-lucide="edit-3" className="w-3 h-3"></i></button></div>
                  <h4 className="text-lg font-black mb-6">{i.name}</h4>
                  <div className="flex justify-between items-end mb-2"><p className={`text-2xl font-black font-mono leading-none ${i.currentStock <= i.minStock ? 'text-rose-500' : 'text-emerald-400'}`}>{i.currentStock.toFixed(1)} <span className="text-xs font-normal opacity-50">{i.unit}</span></p><p className="text-[8px] text-slate-600 font-black uppercase">预警 {i.minStock}{i.unit}</p></div>
                  <div className="h-1 bg-slate-950 rounded-full overflow-hidden"><div className={`h-full transition-all duration-700 ${i.currentStock <= i.minStock ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (i.currentStock / (i.minStock * 2 || 10)) * 100)}%` }}></div></div>
                  {i.currentStock <= i.minStock && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></div>}
                </div>
              ))}
              <button onClick={() => handleOpenModal('edit_ing')} className="glass p-5 rounded-[28px] border border-dashed border-white/10 text-slate-600 font-black flex flex-col items-center justify-center gap-3 hover:bg-white/5 transition-all aspect-square md:aspect-auto"><i data-lucide="plus" className="w-8 h-8"></i><span className="text-[10px] uppercase tracking-widest">新增物料档案</span></button>
            </div>
          </div>
        )}

        {activeTab === 'customer' && (
          <div className="space-y-6 animate-in slide-in-from-right-10">
            <div className="flex justify-between items-center"><h3 className="text-lg font-bold">商户档案中心</h3><button onClick={() => handleOpenModal('edit_cust')} className="bg-cyan-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg">+ 新增商户</button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customers.map(c => (
                <div key={c.id} className={`glass rounded-[32px] p-6 border transition-all ${c.totalDebt >= 10000 ? 'border-rose-500/30 shadow-[0_0_40px_rgba(244,63,94,0.1)]' : 'border-white/5'}`}>
                   <div className="flex justify-between items-start mb-6"><div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-black text-xl">{c.name[0]}</div><div className="text-right"><p className="text-[8px] text-slate-500 font-black uppercase mb-1">待结算金额</p><p className={`text-xl font-black font-mono ${c.totalDebt > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{formatCurrency(c.totalDebt)}</p></div></div>
                   <h4 className="text-lg font-black mb-1">{c.name}</h4>
                   <p className="text-xs text-slate-500 mb-2 flex items-center gap-2"><i data-lucide="phone" className="w-3 h-3"></i> {c.phone}</p>
                   <p className="text-[10px] text-slate-400 mb-6 flex items-start gap-2"><i data-lucide="map-pin" className="w-3 h-3 mt-0.5 shrink-0"></i><span className="line-clamp-2">{c.address}</span></p>
                   <div className="flex flex-wrap gap-2">
                      <button onClick={() => handleOpenModal('nav_menu', c)} className="flex-1 min-w-[100px] py-3 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2"><i data-lucide="navigation" className="w-3 h-3"></i> 地图导航</button>
                      <button onClick={() => handleOpenModal('settlement', c)} className="flex-1 min-w-[100px] py-3 bg-cyan-600/10 border border-cyan-500/20 text-cyan-400 rounded-xl text-[10px] font-black uppercase hover:bg-cyan-600 hover:text-white transition-all">账务结算</button>
                      <button onClick={() => handleOpenModal('edit_cust', c)} className="px-4 py-3 bg-slate-900 rounded-xl text-slate-400 hover:text-white transition-all"><i data-lucide="settings" className="w-4 h-4"></i></button>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(activeTab === 'inbound' || activeTab === 'outbound') && (
           <div className="space-y-6 animate-in slide-in-from-right-10">
              <div className="relative"><i data-lucide="search" className="absolute left-4 top-4 w-4 h-4 text-slate-600"></i><input className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-xs outline-none focus:border-indigo-500 transition-all" placeholder="搜索单号、商户名、经办人或包含的食材..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
              <div className="space-y-3">
                 {orders.filter(o => o.type === (activeTab === 'inbound' ? 'IN' : 'OUT') && (o.id.includes(searchTerm) || o.items.some((i) => i.name.includes(searchTerm)))).map(o => (
                    <button key={o.id} onClick={() => handleOpenModal('detail', o)} className="w-full glass p-5 rounded-[28px] border border-white/5 hover:border-indigo-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 text-left group">
                       <div className="flex items-center gap-4"><div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black ${o.type === 'IN' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-cyan-500/10 text-cyan-400'}`}><i data-lucide={o.type === 'IN' ? 'shopping-bag' : 'truck'} className="w-6 h-6"></i></div><div><h4 className="font-black text-white">{o.id}</h4><p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">{formatDate(o.date)} · {o.type === 'OUT' ? (customers.find(c => c.id === o.customerId)?.name || '散户') : '补录采购'}</p></div></div>
                       <p className={`text-xl font-black font-mono ${o.type === 'IN' ? 'text-indigo-400' : 'text-cyan-400'}`}>{formatCurrency(o.totalAmount)}</p>
                    </button>
                 ))}
              </div>
           </div>
        )}

        {activeTab === 'user_mgmt' && (
          <div className="space-y-8 animate-in slide-in-from-right-10">
             <div className="flex justify-between items-center"><h3 className="text-lg font-bold">职员权限中心</h3><button onClick={() => handleOpenModal('edit_user')} className="bg-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg">+ 新增职员</button></div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {users.map(u => (
                   <div key={u.id} className={`glass p-6 rounded-[32px] border transition-all ${u.id === currentUser.id ? 'border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.2)]' : 'border-white/5'}`}>
                      <div className="flex justify-between items-start mb-4"><div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${u.role === 'Admin' ? 'bg-amber-500/10 text-amber-500' : 'bg-indigo-500/10 text-indigo-400'}`}>{u.name[0]}</div><span className="text-[8px] bg-slate-800 px-2 py-0.5 rounded-full font-black text-slate-500 uppercase">{u.role}</span></div>
                      <h4 className="text-lg font-black mb-6">{u.name}</h4>
                      <div className="flex gap-2">
                        <button onClick={() => handleOpenModal('auth_check', u)} className="flex-1 py-3 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all">切换至该用户</button>
                        <button onClick={() => handleOpenModal('edit_user', u)} className="px-3 py-3 bg-slate-900 rounded-xl text-slate-500 hover:text-white transition-all"><i data-lucide="edit-3" className="w-4 h-4"></i></button>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        )}
      </main>

      {/* 弹窗中心 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl z-[100] flex items-end md:items-center justify-center p-0 md:p-4 overflow-y-auto">
          <div className="glass w-full max-w-lg rounded-t-[40px] md:rounded-[40px] p-6 md:p-10 border-t md:border border-white/10 relative animate-in slide-in-from-bottom-10 duration-500 shadow-2xl">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-5 right-5 text-slate-400 p-2 hover:text-white bg-slate-900 rounded-full transition-all"><i data-lucide="x" className="w-6 h-6"></i></button>
            <div className="pt-4 max-h-[80vh] overflow-y-auto custom-scrollbar no-scrollbar pr-1">
              
              {(modalType === 'order_in' || modalType === 'order_out') && (
                 <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                       <h3 className="text-xl font-black uppercase">{modalType === 'order_in' ? '补录入库' : '配送登记'}</h3>
                       <div className="flex gap-2 w-full sm:w-auto">
                          <button onClick={async () => {
                             const photo = await handleCapturePhoto();
                             if (photo && typeof photo === 'string') processWithAi({ photo });
                          }} className="flex-1 sm:flex-none bg-indigo-600 px-4 py-2.5 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 shadow-lg"><i data-lucide="zap" className="w-4 h-4"></i> AI 扫码</button>
                          <button onClick={() => setShowAiTextInput(!showAiTextInput)} className="flex-1 sm:flex-none bg-slate-800 border border-indigo-500/30 px-4 py-2.5 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 shadow-lg"><i data-lucide="file-text" className="w-4 h-4"></i> 文字识别</button>
                       </div>
                    </div>

                    {showAiTextInput && (
                      <div className="glass p-4 rounded-2xl border-indigo-500/30 border-2 animate-in slide-in-from-top-4">
                        <textarea 
                          className="w-full bg-transparent outline-none text-xs text-white min-h-[100px] font-medium" 
                          placeholder="在此处输入或粘贴文字单据，例如：猪五花 10斤 25元，土豆 5kg 3.5元..."
                          value={aiPasteText}
                          onChange={e => setAiPasteText(e.target.value)}
                        />
                        <div className="flex justify-end gap-2 mt-2">
                           <button onClick={() => setShowAiTextInput(false)} className="px-3 py-1.5 rounded-lg text-[8px] font-black text-slate-500 uppercase">取消</button>
                           <button onClick={() => processWithAi({ text: aiPasteText })} disabled={!aiPasteText.trim()} className="px-4 py-1.5 bg-indigo-600 rounded-lg text-[8px] font-black text-white uppercase disabled:opacity-50">开始智能识别</button>
                        </div>
                      </div>
                    )}

                    <form onSubmit={e => {
                       e.preventDefault();
                       const fd = new FormData(e.currentTarget);
                       const items = [];
                       const names = fd.getAll('item_name');
                       const amounts = fd.getAll('item_amount');
                       const units = fd.getAll('item_unit');
                       const prices = fd.getAll('item_price');
                       names.forEach((n, i) => { if (n) items.push({ id: Math.random().toString(), name: n, quantity: parseFloat(amounts[i]) || 0, unit: units[i] || 'kg', price: parseFloat(prices[i]) || 0 }); });
                       saveOrderAction(modalType === 'order_in' ? 'IN' : 'OUT', {
                          customerId: fd.get('customerId'),
                          items,
                          totalAmount: items.reduce((acc, cur) => acc + (cur.price * cur.quantity), 0),
                          note: fd.get('note'),
                          photos: tempPhotos,
                          shouldPrint: fd.get('shouldPrint') === 'true'
                       });
                    }} className="space-y-4">
                       {modalType === 'order_out' && (
                          <div className="space-y-1"><label className="text-[10px] text-slate-500 font-black uppercase ml-1">配送商户</label>
                            <select name="customerId" required className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 outline-none text-white font-bold cursor-pointer"><option value="">-- 选择商户 --</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                          </div>
                       )}

                       <div className="space-y-3">
                          <div className="flex justify-between items-center px-1">
                             <label className="text-[10px] text-slate-500 font-black uppercase">原始单据留底 ({tempPhotos.length}/7)</label>
                             <button type="button" onClick={handleUploadPhotos} className="text-indigo-400 text-[10px] font-black flex items-center gap-1"><i data-lucide="plus-circle" className="w-3 h-3"></i> 添加照片</button>
                          </div>
                          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                             {tempPhotos.map((p, i) => (
                               <div key={i} className="relative shrink-0 w-20 h-20 rounded-xl overflow-hidden glass border border-white/10 group">
                                  <img src={p} className="w-full h-full object-cover" />
                                  <button type="button" onClick={() => removePhoto(i)} className="absolute top-1 right-1 bg-rose-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><i data-lucide="x" className="w-2 h-2"></i></button>
                               </div>
                             ))}
                             {tempPhotos.length < 7 && (
                               <button type="button" onClick={handleUploadPhotos} className="shrink-0 w-20 h-20 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center text-slate-600 hover:text-indigo-400 hover:border-indigo-400 transition-all">
                                  <i data-lucide="camera" className="w-5 h-5 mb-1"></i>
                                  <span className="text-[8px] font-black uppercase">上传</span>
                               </button>
                             )}
                          </div>
                       </div>

                       <div className="space-y-2 max-h-[40vh] overflow-y-auto no-scrollbar">
                          {(selectedItem?.items || [1]).map((_, idx) => (
                             <div key={idx} className={`glass p-4 rounded-2xl border border-white/5 grid grid-cols-2 gap-3 transition-all ${idx >= (selectedItem?.items?.length || 0) - 1 ? 'animate-in fade-in slide-in-from-left-4' : ''}`}>
                                <input name="item_name" defaultValue={_?.name} placeholder="食材品名" className="col-span-2 bg-transparent border-b border-white/5 font-black outline-none text-sm pb-2" />
                                <div className="space-y-1"><label className="text-[7px] text-slate-600 font-black uppercase">数量</label><input name="item_amount" type="number" step="any" defaultValue={_?.quantity} className="w-full bg-slate-950/50 p-2 rounded-lg text-xs outline-none text-white font-mono" /></div>
                                <div className="space-y-1"><label className="text-[7px] text-slate-600 font-black uppercase">单位</label><input name="item_unit" defaultValue={_?.unit} className="w-full bg-slate-950/50 p-2 rounded-lg text-xs outline-none text-white font-bold" /></div>
                                <div className="col-span-2 space-y-1"><label className="text-[7px] text-slate-600 font-black uppercase">单价 (¥)</label><input name="item_price" type="number" step="any" defaultValue={_?.price} className="w-full bg-slate-950/50 p-2 rounded-lg text-xs outline-none text-white font-mono" /></div>
                             </div>
                          ))}
                          <button type="button" onClick={() => setSelectedItem((prev) => ({ ...prev, items: [...(prev?.items || [{}]), {}] }))} className="w-full py-4 border border-dashed border-white/10 rounded-2xl text-[10px] text-slate-500 font-black uppercase hover:bg-white/5 transition-all">+ 手动新增食材明细</button>
                       </div>
                       <input type="hidden" name="shouldPrint" id="shouldPrintInput" value="false" />
                       <div className="flex gap-2 pt-4">
                          <button type="submit" onClick={() => { document.getElementById('shouldPrintInput').value = 'false' }} className="flex-1 py-4 bg-slate-800 rounded-2xl text-xs font-black uppercase text-slate-400">仅存入库</button>
                          <button type="submit" onClick={() => { document.getElementById('shouldPrintInput').value = 'true' }} className="flex-1 py-4 bg-indigo-600 rounded-2xl text-xs font-black uppercase text-white shadow-lg active:scale-95 transition-all">保存打印</button>
                       </div>
                    </form>
                 </div>
              )}

              {modalType === 'nav_menu' && selectedItem && (
                <div className="space-y-6 text-center">
                  <div className="w-20 h-20 bg-indigo-600/10 rounded-full flex items-center justify-center mx-auto text-indigo-400"><i data-lucide="navigation" className="w-10 h-10"></i></div>
                  <h3 className="text-xl font-black uppercase">选择导航方式</h3><p className="text-xs text-slate-500">目的地: {selectedItem.name}</p>
                  <div className="grid grid-cols-2 gap-3 mt-8">
                    <button onClick={() => openNavigation(selectedItem, 'amap')} className="py-4 bg-slate-900 border border-white/5 rounded-2xl text-xs font-bold hover:bg-white/5 transition-all flex flex-col items-center gap-2"><span className="text-blue-400 font-black">高德地图</span></button>
                    <button onClick={() => openNavigation(selectedItem, 'baidu')} className="py-4 bg-slate-900 border border-white/5 rounded-2xl text-xs font-bold hover:bg-white/5 transition-all flex flex-col items-center gap-2"><span className="text-blue-600 font-black">百度地图</span></button>
                    <button onClick={() => openNavigation(selectedItem, 'google')} className="py-4 bg-slate-900 border border-white/5 rounded-2xl text-xs font-bold hover:bg-white/5 transition-all flex flex-col items-center gap-2"><span className="text-emerald-500 font-black">谷歌地图</span></button>
                    <button onClick={() => openNavigation(selectedItem, 'geo')} className="py-4 bg-slate-900 border border-white/5 rounded-2xl text-xs font-bold hover:bg-white/5 transition-all flex flex-col items-center gap-2"><span className="text-amber-500 font-black">系统直达</span></button>
                  </div>
                </div>
              )}

              {modalType === 'detail' && selectedItem && <OrderDetailView order={selectedItem} customers={customers} users={users} onPrint={() => window.print()} />}

              {modalType === 'edit_ing' && (
                 <form onSubmit={e => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const data = { 
                      name: fd.get('name'), 
                      category: fd.get('category'), 
                      unit: fd.get('unit'), 
                      currentStock: parseFloat(fd.get('stock')) || 0, 
                      minStock: parseFloat(fd.get('min')) || 0 
                    };
                    if (selectedItem) setIngredients(prev => prev.map(i => i.id === selectedItem.id ? { ...i, ...data } : i));
                    else setIngredients(prev => [...prev, { id: Date.now().toString(), code: `V${Date.now().toString().slice(-3)}`, ...data }]);
                    setIsModalOpen(false);
                 }} className="space-y-5 text-left">
                    <h3 className="text-xl font-black mb-6 uppercase">{selectedItem ? '编辑物料档案' : '新增物料档案'}</h3>
                    <div className="space-y-4">
                       <div className="space-y-1"><label className="text-[10px] text-slate-500 font-black uppercase ml-1">品名</label><input name="name" defaultValue={selectedItem?.name} required className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 outline-none text-white font-bold" /></div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1"><label className="text-[10px] text-slate-500 font-black uppercase ml-1">分类</label><select name="category" defaultValue={selectedItem?.category || '蔬菜'} className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 outline-none text-white font-bold">{CATEGORIES.filter(c => c !== '全部').map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                          <div className="space-y-1"><label className="text-[10px] text-slate-500 font-black uppercase ml-1">单位</label><input name="unit" defaultValue={selectedItem?.unit || 'kg'} className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 outline-none text-white font-bold" /></div>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1"><label className="text-[10px] text-slate-500 font-black uppercase ml-1">当前库存</label><input name="stock" type="number" step="any" defaultValue={selectedItem?.currentStock || 0} className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 outline-none text-white font-mono" /></div>
                          <div className="space-y-1"><label className="text-[10px] text-slate-500 font-black uppercase ml-1">预警值</label><input name="min" type="number" step="any" defaultValue={selectedItem?.minStock || 5} className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 outline-none text-white font-mono" /></div>
                       </div>
                    </div>
                    <button type="submit" className="w-full py-5 bg-indigo-600 rounded-[28px] font-black text-white shadow-lg active:scale-95 transition-all mt-6 uppercase">确认保存</button>
                 </form>
              )}

              {modalType === 'edit_cust' && (
                 <form onSubmit={e => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const data = { 
                      name: fd.get('name'), 
                      phone: fd.get('phone'), 
                      address: fd.get('address'), 
                      lat: selectedItem?.lat, 
                      lng: selectedItem?.lng 
                    };
                    if (selectedItem?.id) setCustomers(prev => prev.map(c => c.id === selectedItem.id ? { ...c, ...data } : c));
                    else setCustomers(prev => [...prev, { id: Date.now().toString(), ...data, totalDebt: 0 }]);
                    setIsModalOpen(false);
                 }} className="space-y-5 text-left">
                    <h3 className="text-xl font-black mb-6 uppercase">{selectedItem?.id ? '编辑商户档案' : '录入新商户'}</h3>
                    <div className="space-y-4">
                       <div className="space-y-1"><label className="text-[10px] text-slate-500 font-black uppercase ml-1">商户名</label><input name="name" defaultValue={selectedItem?.name} required className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 outline-none text-white font-bold" /></div>
                       <div className="space-y-1"><label className="text-[10px] text-slate-500 font-black uppercase ml-1">联系电话</label><input name="phone" defaultValue={selectedItem?.phone} className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 outline-none text-white font-bold" /></div>
                       <div className="space-y-1"><label className="text-[10px] text-slate-500 font-black uppercase ml-1">详细地址</label><input name="address" defaultValue={selectedItem?.address} className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 outline-none text-white font-bold" /></div>
                       <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                         <div className="flex justify-between items-center mb-4"><span className="text-[10px] text-slate-500 font-black uppercase">地理坐标采集</span><button type="button" onClick={handleGetCurrentLocation} className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase flex items-center gap-1 transition-all ${isGettingLocation ? 'bg-amber-500 text-white animate-pulse' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}><i data-lucide="crosshair" className="w-3 h-3"></i> {isGettingLocation ? '正在获取...' : '获取当前定位'}</button></div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1"><label className="text-[8px] text-slate-600 font-black uppercase">纬度 (LAT)</label><input readOnly value={selectedItem?.lat || ''} className="w-full bg-transparent border-b border-white/5 py-1 text-xs text-indigo-400 font-mono outline-none" placeholder="未采集" /></div>
                            <div className="space-y-1"><label className="text-[8px] text-slate-600 font-black uppercase">经度 (LNG)</label><input readOnly value={selectedItem?.lng || ''} className="w-full bg-transparent border-b border-white/5 py-1 text-xs text-indigo-400 font-mono outline-none" placeholder="未采集" /></div>
                         </div>
                       </div>
                    </div>
                    <button type="submit" className="w-full py-5 bg-cyan-600 rounded-[28px] font-black text-white shadow-lg active:scale-95 transition-all mt-6 uppercase">保存商户档案</button>
                 </form>
              )}

              {modalType === 'settlement' && selectedItem && (
                 <form onSubmit={e => {
                    e.preventDefault();
                    const amount = parseFloat(new FormData(e.currentTarget).get('amount')) || 0;
                    if (amount > 0) { setCustomers(prev => prev.map(c => c.id === selectedItem.id ? { ...c, totalDebt: c.totalDebt - amount } : c)); setIsModalOpen(false); }
                 }} className="space-y-6 text-center">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400"><i data-lucide="wallet" className="w-10 h-10"></i></div>
                    <h3 className="text-xl font-black uppercase">商户回款结算</h3><p className="text-sm text-slate-500">{selectedItem.name} 当前待结算: <span className="text-rose-400 font-black font-mono">{formatCurrency(selectedItem.totalDebt)}</span></p>
                    <div className="space-y-1 text-left"><label className="text-[10px] text-slate-500 font-black uppercase ml-1">结算回款金额 (¥)</label><input name="amount" type="number" step="any" required autoFocus className="w-full bg-slate-900 border border-emerald-500/30 rounded-2xl px-5 py-6 outline-none text-white font-black text-3xl text-center" /></div>
                    <button type="submit" className="w-full py-5 bg-emerald-600 rounded-[28px] font-black text-white shadow-lg active:scale-95 transition-all mt-4 uppercase">立即登记回款</button>
                 </form>
              )}

              {modalType === 'edit_user' && (
                 <form onSubmit={e => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const data = { 
                      name: fd.get('name'), 
                      role: fd.get('role'), 
                      password: fd.get('password') 
                    };
                    if (selectedItem) setUsers(prev => prev.map(u => u.id === selectedItem.id ? { ...u, ...data } : u));
                    else setUsers(prev => [...prev, { id: Date.now().toString(), ...data }]);
                    setIsModalOpen(false);
                 }} className="space-y-5 text-left">
                    <h3 className="text-xl font-black mb-6 uppercase">{selectedItem ? '编辑职员信息' : '录入新职员'}</h3>
                    <div className="space-y-4">
                       <div className="space-y-1"><label className="text-[10px] text-slate-500 font-black uppercase ml-1">职员姓名</label><input name="name" defaultValue={selectedItem?.name} required className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 outline-none text-white font-bold" /></div>
                       <div className="space-y-1"><label className="text-[10px] text-slate-500 font-black uppercase ml-1">系统角色</label><select name="role" defaultValue={selectedItem?.role || '送货员'} className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 outline-none text-white font-bold"><option value="Admin">Admin (最高权限)</option><option value="老板">老板</option><option value="采购员">采购员</option><option value="送货员">送货员</option></select></div>
                       <div className="space-y-1"><label className="text-[10px] text-slate-500 font-black uppercase ml-1">登录密码 (仅数字)</label><input name="password" type="password" defaultValue={selectedItem?.password} required className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 outline-none text-white font-mono text-center text-xl tracking-widest" /></div>
                    </div>
                    <button type="submit" className="w-full py-5 bg-indigo-600 rounded-[28px] font-black text-white shadow-lg active:scale-95 transition-all mt-6 uppercase">保存职员档案</button>
                 </form>
              )}

              {modalType === 'auth_check' && selectedItem && (
                <div className="space-y-10 text-center py-6">
                  <div className="w-24 h-24 rounded-[32px] bg-indigo-600/10 flex items-center justify-center mx-auto text-indigo-400 font-black text-3xl">{selectedItem.name[0]}</div>
                  <h3 className="text-2xl font-black uppercase tracking-widest">身份校验 - {selectedItem.name}</h3>
                  <form onSubmit={e => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    if (fd.get('password') === selectedItem.password) { setCurrentUser(selectedItem); setIsModalOpen(false); setActiveTab('dashboard'); }
                    else { setAuthError(true); setTimeout(() => setAuthError(false), 2000); }
                  }} className="space-y-8">
                    <input name="password" type="password" autoFocus placeholder="PIN CODE" className={`w-full max-w-xs mx-auto block bg-slate-900 border-2 ${authError ? 'border-rose-500 animate-bounce shadow-[0_0_30px_rgba(244,63,94,0.3)]' : 'border-slate-700'} rounded-2xl px-6 py-5 outline-none text-white text-center font-black text-3xl tracking-[0.5em] transition-all focus:border-indigo-500`} />
                    <button type="submit" className="w-full max-w-xs mx-auto block py-5 bg-indigo-600 rounded-[28px] font-black text-white shadow-lg active:scale-95 transition-all uppercase tracking-widest">确认授权并切换</button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isAiScanning && (
        <div className="fixed inset-0 bg-slate-950/95 z-[500] flex flex-col items-center justify-center backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="w-32 h-32 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-[0_0_80px_rgba(99,102,241,0.2)]"></div>
          <p className="text-indigo-400 font-black uppercase text-2xl mt-12 animate-pulse tracking-[0.5em]">AI 正在识别数据</p>
        </div>
      )}

      <div id="print-area" className="hidden">
         {selectedItem && (modalType === 'detail') && (
            <div className="p-10 text-black">
               <h1 className="text-4xl font-black text-center mb-10 uppercase border-b-4 border-black pb-6">{selectedItem.type === 'IN' ? '采购进货单' : '商户配送单'}</h1>
               <div className="grid grid-cols-2 mb-10 text-sm gap-y-3"><p><b>单据编号:</b> {selectedItem.id}</p><p><b>日期:</b> {formatDate(selectedItem.date)}</p><p><b>经办职员:</b> {users.find(u => u.id === selectedItem.operatorId)?.name}</p><p><b>{selectedItem.type === 'OUT' ? '收货单位:' : '供货说明:'}</b> {selectedItem.type === 'OUT' ? customers.find(c => c.id === selectedItem.customerId)?.name : '采购补录'}</p></div>
               <table className="w-full mb-10 border-collapse border-2 border-black text-sm">
                  <thead><tr className="bg-gray-100"><th className="border-2 border-black p-3 text-left">品名</th><th className="border-2 border-black p-3 text-center">数量</th><th className="border-2 border-black p-3 text-right">单价</th><th className="border-2 border-black p-3 text-right">金额</th></tr></thead>
                  <tbody>{selectedItem.items.map((item) => ( <tr key={item.id}><td className="border-2 border-black p-3 font-bold">{item.name}</td><td className="border-2 border-black p-3 text-center">{item.quantity}{item.unit}</td><td className="border-2 border-black p-3 text-right">{formatCurrency(item.price)}</td><td className="border-2 border-black p-3 text-right font-bold">{formatCurrency(item.quantity * item.price)}</td></tr> ))}</tbody>
               </table>
               <div className="text-right text-3xl font-black border-t-2 border-black pt-4">合计金额: {formatCurrency(selectedItem.totalAmount)}</div>
               <div className="mt-32 flex justify-between text-sm px-4"><p>库管/经办人签字: __________________</p><p>客户/收货人签字: __________________</p></div>
               <div className="mt-20 text-center text-[10px] text-gray-400">智厨 Pro 数字化进销存系统 打印输出</div>
            </div>
         )}
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);
