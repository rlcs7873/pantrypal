import React, { useState, useEffect } from 'react';
import { 
  Camera, Plus, Trash2, Search, X, Check, ChefHat, Package, RefreshCw,
  Minus, Sparkles, Clock, Users, ArrowLeft, ArrowRight, Snowflake,
  Refrigerator, Archive, Pencil, AlertCircle, Flame, Loader2, Barcode,
  Home, Copy, Share2, LogOut, RotateCw, Undo2, ScanLine, CalendarClock,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Constants                                                          */
/* ------------------------------------------------------------------ */

const CATEGORIES = ["Produce","Dairy","Meat","Seafood","Grains","Canned","Frozen","Condiments","Snacks","Beverages","Baking","Spices","Other"];
const LOCATIONS = ["Pantry","Fridge","Freezer"];
const UNITS = ["pcs","g","kg","oz","lb","ml","L","cup","can","bottle","bag","box","bunch"];

const DIETS = [
  { id: "balanced", label: "Balanced", note: "No restrictions" },
  { id: "lowcal", label: "Low calorie", note: "Lighter portions" },
  { id: "highprotein", label: "High protein", note: "Protein-forward" },
  { id: "keto", label: "Keto", note: "Very low carb" },
  { id: "lowcarb", label: "Low carb", note: "Reduced carbs" },
  { id: "vegan", label: "Vegan", note: "No animal products" },
  { id: "vegetarian", label: "Vegetarian", note: "No meat or fish" },
  { id: "glutenfree", label: "Gluten free", note: "No gluten" },
];

const APPLIANCES = [
  { id: "stove", label: "Stove / Cooktop" },
  { id: "oven", label: "Oven" },
  { id: "microwave", label: "Microwave" },
  { id: "airfryer", label: "Air fryer" },
  { id: "pressure", label: "Pressure cooker" },
  { id: "slowcooker", label: "Slow cooker" },
  { id: "none", label: "No-cook only" },
];

const LOC_ICON = { Pantry: Archive, Fridge: Refrigerator, Freezer: Snowflake };

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const makeCode = () => "HOME-" + Array.from({ length: 4 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");

const PERSONAL_ITEMS = "pantry:items";
const homeItemsKey = (code) => `home:${code}:items`;

const DAY = 86400000;

function expiryInfo(item) {
  if (!item || !item.expiresAt) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const exp = new Date(item.expiresAt + "T00:00:00");
  const days = Math.round((exp - today) / DAY);
  if (days < 0) return { days, label: `Expired ${-days}d ago`, tone: "expired" };
  if (days === 0) return { days, label: "Use today", tone: "soon" };
  if (days <= 3) return { days, label: `${days}d left`, tone: "soon" };
  if (days <= 7) return { days, label: `${days}d left`, tone: "week" };
  return { days, label: `${days}d left`, tone: "fresh" };
}

const EXP_STYLE = {
  expired: "bg-rose-100 text-rose-700",
  soon: "bg-orange-100 text-orange-700",
  week: "bg-amber-100 text-amber-700",
  fresh: "bg-stone-100 text-stone-500",
};

/* ------------------------------------------------------------------ */
/* Simulated AI (no API key needed)                                   */
/* ------------------------------------------------------------------ */

function simulateShelfRecognition(hint) {
  const base = {
    pantry: [
      { name: "Brown rice", quantity: 1, unit: "bag", category: "Grains" },
      { name: "Canned tomatoes", quantity: 3, unit: "can", category: "Canned" },
      { name: "Olive oil", quantity: 1, unit: "bottle", category: "Condiments" },
      { name: "Pasta", quantity: 2, unit: "box", category: "Grains" },
      { name: "Black beans", quantity: 2, unit: "can", category: "Canned" },
    ],
    fridge: [
      { name: "Eggs", quantity: 12, unit: "pcs", category: "Dairy" },
      { name: "Milk", quantity: 1, unit: "L", category: "Dairy" },
      { name: "Greek yogurt", quantity: 4, unit: "pcs", category: "Dairy" },
      { name: "Chicken breast", quantity: 500, unit: "g", category: "Meat" },
      { name: "Spinach", quantity: 1, unit: "bag", category: "Produce" },
    ],
    freezer: [
      { name: "Frozen berries", quantity: 1, unit: "bag", category: "Frozen" },
      { name: "Chicken thighs", quantity: 1, unit: "bag", category: "Meat" },
      { name: "Peas", quantity: 1, unit: "bag", category: "Frozen" },
      { name: "Fish fillets", quantity: 4, unit: "pcs", category: "Seafood" },
    ]
  };

  const suggestions = base[hint] || base.pantry;
  return suggestions.map(item => ({
    ...item,
    id: uid(),
    location: hint.charAt(0).toUpperCase() + hint.slice(1),
    expiresAt: hint === 'fridge' ? getRandomFutureDate(2, 6) : hint === 'freezer' ? getRandomFutureDate(30, 90) : undefined
  }));
}

function simulateSingleItemRecognition() {
  const options = [
    { name: "Greek yogurt (Fage)", quantity: 1, unit: "pcs", category: "Dairy", location: "Fridge" },
    { name: "Avocados", quantity: 4, unit: "pcs", category: "Produce", location: "Pantry" },
    { name: "Salmon fillet", quantity: 300, unit: "g", category: "Seafood", location: "Fridge" },
    { name: "Almond milk", quantity: 1, unit: "L", category: "Beverages", location: "Fridge" },
    { name: "Quinoa", quantity: 1, unit: "bag", category: "Grains", location: "Pantry" },
  ];
  return options[Math.floor(Math.random() * options.length)];
}

function getRandomFutureDate(minDays, maxDays) {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * (maxDays - minDays)) + minDays);
  return date.toISOString().split('T')[0];
}

function generateSmartRecipes(currentItems, selectedDiets, selectedAppliances) {
  if (currentItems.length === 0) {
    return [{
      title: "Simple Veggie Stir Fry",
      time: "15 min",
      servings: 2,
      difficulty: "Easy",
      uses: ["Spinach", "Eggs"],
      need: ["Soy sauce", "Garlic"],
      steps: ["Heat oil in pan", "Add garlic and vegetables", "Stir fry 5-7 minutes", "Season and serve"],
      tip: "Great for using up vegetables before they go bad."
    }];
  }

  const expiringSoon = currentItems.filter(i => {
    const e = expiryInfo(i);
    return e && e.days <= 4;
  }).map(i => i.name);

  const hasMeat = currentItems.some(i => i.category === 'Meat');
  const hasDairy = currentItems.some(i => i.category === 'Dairy');

  const recipes = [];

  if (hasMeat || hasDairy) {
    recipes.push({
      title: hasMeat ? "Quick Garlic Chicken" : "High Protein Egg Scramble",
      time: "18 min",
      servings: 2,
      difficulty: "Easy",
      uses: currentItems.filter(i => ['Meat', 'Dairy', 'Produce'].includes(i.category)).slice(0, 4).map(i => i.name),
      need: ["Salt", "Pepper", "Olive oil"],
      steps: ["Season protein", "Cook in pan over medium heat", "Add vegetables", "Finish with seasoning"],
      tip: expiringSoon.length > 0 ? `Use up ${expiringSoon[0]} before it expires!` : "Serve with rice or quinoa."
    });
  }

  recipes.push({
    title: "One-Pan Roasted Vegetables",
    time: "25 min",
    servings: 3,
    difficulty: "Easy",
    uses: currentItems.filter(i => ['Produce', 'Grains', 'Canned'].includes(i.category)).slice(0, 5).map(i => i.name),
    need: ["Olive oil", "Salt"],
    steps: ["Preheat oven to 200°C", "Toss ingredients with oil", "Roast 20-25 minutes", "Season and serve"],
    tip: "Batch cook for easy lunches this week."
  });

  recipes.push({
    title: "10-Minute Protein Bowl",
    time: "10 min",
    servings: 1,
    difficulty: "Easy",
    uses: currentItems.slice(0, 4).map(i => i.name),
    need: ["Lemon or dressing"],
    steps: ["Chop ingredients", "Combine in bowl", "Add dressing", "Mix and enjoy"],
    tip: expiringSoon.length > 0 ? "Perfect for using items that need to be eaten soon." : "Customize with whatever you have."
  });

  return recipes.slice(0, 3);
}

/* ------------------------------------------------------------------ */
/* Main App                                                           */
/* ------------------------------------------------------------------ */

export default function App() {
  const [tab, setTab] = useState("inventory");
  const [items, setItems] = useState([]);
  const [household, setHousehold] = useState(null);
  const [ready, setReady] = useState(false);
  const [showHome, setShowHome] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Filters
  const [query, setQuery] = useState("");
  const [locFilter, setLocFilter] = useState("All");
  const [soonOnly, setSoonOnly] = useState(false);

  // Sheets
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [scan, setScan] = useState({ status: "idle", mode: "", found: null, single: null, error: null });
  const [undoItem, setUndoItem] = useState(null);

  // Recipes
  const [recipeStep, setRecipeStep] = useState(0);
  const [selectedDiets, setSelectedDiets] = useState([]);
  const [selectedAppliances, setSelectedAppliances] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [openRecipe, setOpenRecipe] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "", quantity: 1, unit: "pcs", category: "Other", location: "Pantry", expiresAt: ""
  });

  const inHome = !!household;
  const itemsKey = inHome ? homeItemsKey(household.code) : PERSONAL_ITEMS;

  // Load data
  useEffect(() => {
    const savedHousehold = localStorage.getItem("pantry:household");
    let hh = null;
    if (savedHousehold) hh = JSON.parse(savedHousehold);

    const key = hh ? homeItemsKey(hh.code) : PERSONAL_ITEMS;
    const savedItems = localStorage.getItem(key);
    
    if (savedItems) setItems(JSON.parse(savedItems));
    if (hh) setHousehold(hh);
    
    setReady(true);
  }, []);

  // Save items when they change
  useEffect(() => {
    if (ready) {
      localStorage.setItem(itemsKey, JSON.stringify(items));
    }
  }, [items, itemsKey, ready]);

  // Save household
  useEffect(() => {
    if (household) {
      localStorage.setItem("pantry:household", JSON.stringify(household));
    } else {
      localStorage.removeItem("pantry:household");
    }
  }, [household]);

  /* ------------------ Operations ------------------ */
  const ops = {
    addItems: (arr) => {
      const withIds = arr.map(a => ({
        ...a,
        id: a.id || uid(),
        addedAt: a.addedAt || Date.now()
      }));
      setItems(prev => [...withIds, ...prev]);
    },
    removeItem: (id) => {
      const item = items.find(i => i.id === id);
      if (item) {
        setUndoItem(item);
        setTimeout(() => setUndoItem(null), 5000);
      }
      setItems(prev => prev.filter(i => i.id !== id));
    },
    updateItem: (updated) => {
      setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
    },
    bump: (id, delta) => {
      setItems(prev => prev.map(i => 
        i.id === id ? { ...i, quantity: Math.max(0, parseFloat((i.quantity + delta).toFixed(2))) } : i
      ));
    }
  };

  /* ------------------ Filtering ------------------ */
  const filteredItems = items.filter(i => {
    if (locFilter !== "All" && i.location !== locFilter) return false;
    if (query && !i.name.toLowerCase().includes(query.toLowerCase())) return false;
    if (soonOnly) {
      const e = expiryInfo(i);
      if (!e || e.days > 3) return false;
    }
    return true;
  }).sort((a, b) => {
    const ea = expiryInfo(a), eb = expiryInfo(b);
    if (ea && eb) return ea.days - eb.days;
    if (ea) return -1;
    if (eb) return 1;
    return 0;
  });

  const grouped = LOCATIONS.map(l => ({
    loc: l,
    list: filteredItems.filter(i => i.location === l)
  })).filter(g => g.list.length > 0);

  const expiringCount = items.filter(i => {
    const e = expiryInfo(i);
    return e && e.days <= 3;
  }).length;

  /* ------------------ Camera / Scan ------------------ */
  const startShelfScan = (hint) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setScan({ status: "scanning", mode: "shelf", found: null, single: null, error: null });
      
      setTimeout(() => {
        const detected = simulateShelfRecognition(hint);
        setScan({ status: "review", mode: "shelf", found: detected, single: null, error: null });
      }, 1200);
    };
    input.click();
  };

  const startSingleScan = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setScan({ status: "scanning", mode: "single", found: null, single: null, error: null });
      
      setTimeout(() => {
        const item = simulateSingleItemRecognition();
        setScan({ status: "single", mode: "single", found: null, single: item, error: null });
      }, 900);
    };
    input.click();
  };

  const confirmScanReview = (selectedItems) => {
    ops.addItems(selectedItems);
    setScan({ status: "idle", mode: "", found: null, single: null, error: null });
  };

  /* ------------------ Item Form ------------------ */
  const openAddForm = () => {
    setFormData({ name: "", quantity: 1, unit: "pcs", category: "Other", location: "Pantry", expiresAt: "" });
    setEditing(null);
    setShowAdd(true);
  };

  const openEditForm = (item) => {
    setFormData({ ...item });
    setEditing(item);
    setShowAdd(true);
  };

  const saveForm = () => {
    if (!formData.name.trim()) return;

    const itemData = {
      ...formData,
      quantity: parseFloat(formData.quantity) || 1,
      name: formData.name.trim()
    };

    if (editing) {
      ops.updateItem(itemData);
    } else {
      ops.addItems([itemData]);
    }
    setShowAdd(false);
    setEditing(null);
  };

  /* ------------------ Recipes ------------------ */
  const toggleDiet = (id) => {
    setSelectedDiets(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const toggleAppliance = (id) => {
    if (id === "none") {
      setSelectedAppliances(prev => prev.includes("none") ? [] : ["none"]);
    } else {
      setSelectedAppliances(prev => {
        if (prev.includes(id)) return prev.filter(a => a !== id);
        return [...prev.filter(a => a !== "none"), id];
      });
    }
  };

  const generateRecipes = () => {
    setLoadingRecipes(true);
    setTimeout(() => {
      const generated = generateSmartRecipes(items, selectedDiets, selectedAppliances);
      setRecipes(generated);
      setRecipeStep(2);
      setLoadingRecipes(false);
    }, 600);
  };

  const resetRecipeFlow = () => {
    setRecipeStep(0);
    setRecipes([]);
    setSelectedDiets([]);
    setSelectedAppliances([]);
  };

  /* ------------------ Household ------------------ */
  const createHome = () => {
    const code = makeCode();
    const newHousehold = { code };
    setHousehold(newHousehold);
    setShowHome(false);
    alert(`Home created! Your invite code is: ${code}`);
  };

  const joinHome = (code) => {
    if (!code.startsWith("HOME-")) {
      alert("Invalid code format");
      return;
    }
    const newHousehold = { code };
    setHousehold(newHousehold);
    setShowHome(false);
    
    // Load shared items if exist
    const shared = localStorage.getItem(homeItemsKey(code));
    if (shared) setItems(JSON.parse(shared));
  };

  const leaveHome = () => {
    if (!confirm("Leave this home?")) return;
    localStorage.setItem(PERSONAL_ITEMS, JSON.stringify(items));
    setHousehold(null);
    setShowHome(false);
  };

  const syncHome = () => {
    if (!household) return;
    setSyncing(true);
    setTimeout(() => {
      const shared = localStorage.getItem(homeItemsKey(household.code));
      if (shared) setItems(JSON.parse(shared));
      setSyncing(false);
    }, 500);
  };

  /* ------------------ Undo ------------------ */
  const doUndo = () => {
    if (undoItem) {
      setItems(prev => [undoItem, ...prev]);
      setUndoItem(null);
    }
  };

  /* ------------------ Render ------------------ */
  if (!ready) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 max-w-md mx-auto relative">
      {/* Header */}
      <div className="bg-emerald-800 text-white px-5 pt-6 pb-5 rounded-b-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-600/40 rounded-xl flex items-center justify-center">
              <ChefHat size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold">PantryPal</h1>
              <p className="text-xs text-emerald-200 -mt-0.5">Know what you have. Cook what you can.</p>
            </div>
          </div>
          <button onClick={() => setShowHome(true)} className="flex flex-col items-center px-3 py-1.5 rounded-xl bg-emerald-600/40">
            {inHome ? <Users size={18} /> : <Home size={18} />}
            <span className="text-[10px] font-medium mt-0.5">{inHome ? household.code.replace("HOME-", "") : "Personal"}</span>
          </button>
        </div>
      </div>

      {/* INVENTORY TAB */}
      {tab === "inventory" && (
        <div className="pb-24">
          {/* Scan Buttons */}
          <div className="px-4 pt-4">
            <div className="grid grid-cols-3 gap-2">
              {["pantry", "fridge", "freezer"].map((h, idx) => {
                const labels = ["Pantry", "Fridge", "Freezer"];
                const icons = [Archive, Refrigerator, Snowflake];
                const Icon = icons[idx];
                return (
                  <button key={h} onClick={() => startShelfScan(h)}
                    className="flex flex-col items-center gap-1.5 py-4 rounded-2xl bg-emerald-700 text-white active:scale-[0.985]">
                    <div className="relative"><Icon size={22} /><Camera size={11} className="absolute -bottom-1 -right-1 bg-emerald-700 rounded-full p-0.5" /></div>
                    <span className="text-xs font-semibold">Scan {labels[idx]}</span>
                  </button>
                );
              })}
            </div>
            <button onClick={startSingleScan} className="mt-2 w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-stone-900 text-white text-sm font-medium">
              <Barcode size={17} /> Scan single item
            </button>
          </div>

          {/* Household Sync */}
          {inHome && (
            <div className="px-4 pt-3">
              <button onClick={syncHome} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-medium">
                <RotateCw size={13} className={syncing ? "animate-spin" : ""} /> {household.code} · {syncing ? "Syncing..." : "Tap to sync"}
              </button>
            </div>
          )}

          {/* Use Soon Banner */}
          {expiringCount > 0 && (
            <div className="px-4 pt-3">
              <button onClick={() => { setSoonOnly(true); setLocFilter("All"); }} 
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-sm font-medium">
                <CalendarClock size={15} /> {expiringCount} item{expiringCount > 1 ? "s" : ""} to use soon
              </button>
            </div>
          )}

          {/* Search + Filters */}
          <div className="px-4 pt-4 sticky top-0 z-10 bg-stone-50/95 backdrop-blur pb-2">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-3 text-stone-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search inventory"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-stone-200 bg-white text-sm focus:border-emerald-500 outline-none" />
            </div>
            <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
              {["All", ...LOCATIONS].map(l => (
                <button key={l} onClick={() => { setLocFilter(l); setSoonOnly(false); }}
                  className={`px-4 py-1.5 text-sm font-medium rounded-full border whitespace-nowrap ${locFilter === l && !soonOnly ? "bg-emerald-700 text-white border-emerald-700" : "bg-white border-stone-200 text-stone-600"}`}>
                  {l}
                </button>
              ))}
              <button onClick={() => { setSoonOnly(!soonOnly); setLocFilter("All"); }}
                className={`px-4 py-1.5 text-sm font-medium rounded-full border flex items-center gap-1 ${soonOnly ? "bg-orange-600 text-white border-orange-600" : "bg-white border-orange-200 text-orange-700"}`}>
                <CalendarClock size={13} /> Use soon
              </button>
            </div>
          </div>

          {/* Inventory List */}
          <div className="px-4 pt-2">
            {items.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-2xl flex items-center justify-center mb-4"><Package size={28} className="text-emerald-700" /></div>
                <p className="font-semibold">Your kitchen is empty</p>
                <p className="text-sm text-stone-500 mt-1">Scan a shelf or tap + to add items.</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <p className="text-center text-stone-400 py-12 text-sm">No items match your filters.</p>
            ) : (
              grouped.map(group => {
                const Icon = LOC_ICON[group.loc];
                return (
                  <div key={group.loc} className="mb-5">
                    <div className="flex items-center gap-2 mb-2 text-stone-500 px-1">
                      <Icon size={14} /><span className="text-xs font-bold tracking-wider">{group.loc}</span>
                    </div>
                    <div className="space-y-2">
                      {group.list.map(item => {
                        const exp = expiryInfo(item);
                        return (
                          <div key={item.id} className="flex items-center gap-3 bg-white rounded-2xl border border-stone-200 p-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-stone-900 truncate">{item.name}</p>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">{item.category}</span>
                                {exp && <span className={`text-[10px] px-2 py-0.5 rounded-full ${EXP_STYLE[exp.tone]}`}>{exp.label}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => ops.bump(item.id, -1)} className="w-7 h-7 bg-stone-100 rounded-lg flex items-center justify-center"><Minus size={13} /></button>
                              <span className="w-14 text-center text-sm font-medium tabular-nums">{item.quantity} {item.unit}</span>
                              <button onClick={() => ops.bump(item.id, 1)} className="w-7 h-7 bg-stone-100 rounded-lg flex items-center justify-center"><Plus size={13} /></button>
                            </div>
                            <div className="flex gap-0.5">
                              <button onClick={() => openEditForm(item)} className="p-2 text-stone-400"><Pencil size={15} /></button>
                              <button onClick={() => ops.removeItem(item.id)} className="p-2 text-stone-400"><Trash2 size={15} /></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Floating + Button */}
          <button onClick={openAddForm} className="fixed bottom-20 right-5 w-14 h-14 bg-emerald-700 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 z-40">
            <Plus size={26} />
          </button>
        </div>
      )}

      {/* RECIPES TAB */}
      {tab === "recipes" && (
        <div className="px-4 pt-4 pb-24">
          {/* Stepper */}
          <div className="flex items-center gap-2 mb-6 text-sm">
            {["Diet", "Equipment", "Recipes"].map((label, i) => (
              <React.Fragment key={i}>
                <div className={`flex items-center gap-1.5 ${i <= recipeStep ? "text-emerald-700" : "text-stone-400"}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${i < recipeStep ? "bg-emerald-700 text-white" : i === recipeStep ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-700" : "bg-stone-200"}`}>
                    {i < recipeStep ? <Check size={11} /> : i + 1}
                  </span>
                  <span className="font-medium">{label}</span>
                </div>
                {i < 2 && <div className={`flex-1 h-px ${i < recipeStep ? "bg-emerald-700" : "bg-stone-200"}`} />}
              </React.Fragment>
            ))}
          </div>

          {/* Step 0: Diets */}
          {recipeStep === 0 && (
            <div>
              <h2 className="text-2xl font-bold tracking-tight">What are you eating?</h2>
              <p className="text-stone-500 text-sm mt-1">Select any that apply</p>
              <div className="grid grid-cols-2 gap-2.5 mt-4">
                {DIETS.map(d => (
                  <button key={d.id} onClick={() => toggleDiet(d.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${selectedDiets.includes(d.id) ? "bg-emerald-700 border-emerald-700 text-white" : "bg-white border-stone-200"}`}>
                    <div className="font-semibold text-sm flex justify-between">{d.label} {selectedDiets.includes(d.id) && <Check size={15} />}</div>
                    <p className="text-xs mt-0.5 text-emerald-100/80">{d.note}</p>
                  </button>
                ))}
              </div>
              <button onClick={() => setRecipeStep(1)} className="mt-6 w-full py-3.5 bg-emerald-700 text-white font-semibold rounded-2xl flex items-center justify-center gap-2">
                Next: Equipment <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* Step 1: Appliances */}
          {recipeStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold tracking-tight">What can you cook with?</h2>
              <div className="grid grid-cols-2 gap-2.5 mt-4">
                {APPLIANCES.map(a => (
                  <button key={a.id} onClick={() => toggleAppliance(a.id)}
                    className={`p-3.5 rounded-2xl border flex justify-between items-center text-sm font-semibold transition-all ${selectedAppliances.includes(a.id) ? "bg-emerald-700 border-emerald-700 text-white" : "bg-white border-stone-200"}`}>
                    {a.label} {selectedAppliances.includes(a.id) && <Check size={15} />}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setRecipeStep(0)} className="px-6 py-3.5 bg-stone-200 rounded-2xl font-medium flex items-center gap-2"><ArrowLeft size={17} /> Back</button>
                <button onClick={generateRecipes} disabled={selectedAppliances.length === 0 || loadingRecipes}
                  className="flex-1 py-3.5 bg-emerald-700 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50">
                  {loadingRecipes ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />} Get recipes
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Results */}
          {recipeStep === 2 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Your recipes</h2>
                  <p className="text-xs text-stone-500">Built from {items.length} items</p>
                </div>
                <button onClick={resetRecipeFlow} className="text-emerald-700 text-sm font-medium flex items-center gap-1"><RefreshCw size={14} /> Redo</button>
              </div>

              <div className="space-y-3">
                {recipes.map((r, idx) => (
                  <button key={idx} onClick={() => setOpenRecipe(r)} className="w-full text-left bg-white rounded-2xl border border-stone-200 p-4 active:scale-[0.985]">
                    <div className="flex justify-between"><h3 className="font-bold">{r.title}</h3><ChefHat size={18} className="text-emerald-600" /></div>
                    <div className="flex gap-4 mt-2 text-xs text-stone-500">
                      <span><Clock size={13} className="inline mr-1" />{r.time}</span>
                      <span><Users size={13} className="inline mr-1" />{r.servings} serv</span>
                      <span><Flame size={13} className="inline mr-1" />{r.difficulty}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t flex z-50">
        <button onClick={() => setTab("inventory")} className={`flex-1 py-3 flex flex-col items-center ${tab === "inventory" ? "text-emerald-700" : "text-stone-400"}`}>
          <Package size={21} /><span className="text-[10px] font-medium mt-0.5">Inventory</span>
        </button>
        <button onClick={() => setTab("recipes")} className={`flex-1 py-3 flex flex-col items-center ${tab === "recipes" ? "text-emerald-700" : "text-stone-400"}`}>
          <ChefHat size={21} /><span className="text-[10px] font-medium mt-0.5">Recipes</span>
        </button>
      </div>

      {/* Add/Edit Item Sheet */}
      {showAdd && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-end" onClick={() => setShowAdd(false)}>
          <div className="bg-white w-full rounded-t-3xl p-5" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-4">
              <h3 className="text-xl font-semibold">{editing ? "Edit item" : "Add item"}</h3>
              <button onClick={() => setShowAdd(false)}><X size={22} /></button>
            </div>

            <div className="space-y-4">
              <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Item name" className="w-full border rounded-2xl px-4 py-3 text-sm" />
              
              <div className="grid grid-cols-2 gap-3">
                <input type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="border rounded-2xl px-4 py-3 text-sm" />
                <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="border rounded-2xl px-4 py-3 text-sm">
                  {UNITS.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>

              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border rounded-2xl px-4 py-3 text-sm">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>

              <div>
                <div className="text-xs font-medium text-stone-500 mb-1.5">STORED IN</div>
                <div className="grid grid-cols-3 gap-2">
                  {LOCATIONS.map(l => (
                    <button key={l} onClick={() => setFormData({...formData, location: l})} 
                      className={`py-2.5 rounded-2xl border text-sm font-medium ${formData.location === l ? "bg-emerald-700 text-white border-emerald-700" : "bg-white border-stone-200"}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <input type="date" value={formData.expiresAt} onChange={e => setFormData({...formData, expiresAt: e.target.value})} className="w-full border rounded-2xl px-4 py-3 text-sm" />
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-3.5 rounded-2xl bg-stone-100 font-semibold">Cancel</button>
              <button onClick={saveForm} className="flex-1 py-3.5 rounded-2xl bg-emerald-700 text-white font-semibold">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Scan Review Sheet */}
      {scan.status === "review" && scan.found && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-end" onClick={() => setScan({ status: "idle" })}>
          <div className="bg-white w-full rounded-t-3xl p-5 max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-xl mb-1">Review detected items</h3>
            <p className="text-sm text-stone-500 mb-4">Uncheck anything wrong, then add.</p>
            
            <div className="space-y-2 mb-5">
              {scan.found.map((item, idx) => (
                <div key={idx} className="border rounded-2xl p-3 flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-emerald-700" id={`scan-${idx}`} />
                  <div className="flex-1">
                    <input defaultValue={item.name} className="font-medium w-full bg-transparent" />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setScan({ status: "idle" })} className="flex-1 py-3 rounded-2xl bg-stone-100 font-semibold">Cancel</button>
              <button onClick={() => confirmScanReview(scan.found)} className="flex-1 py-3 rounded-2xl bg-emerald-700 text-white font-semibold">Add items</button>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Detail */}
      {openRecipe && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-end" onClick={() => setOpenRecipe(null)}>
          <div className="bg-white w-full rounded-t-3xl p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-bold mb-1">{openRecipe.title}</h3>
            <div className="flex gap-4 text-sm text-stone-500 mb-5">
              <span>{openRecipe.time}</span><span>{openRecipe.servings} servings</span><span>{openRecipe.difficulty}</span>
            </div>

            {openRecipe.uses?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold text-emerald-700 mb-1.5">FROM YOUR INVENTORY</p>
                <div className="flex flex-wrap gap-1.5">{openRecipe.uses.map((u,i) => <span key={i} className="px-3 py-1 text-xs bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">{u}</span>)}</div>
              </div>
            )}

            <div>
              <p className="text-xs font-bold text-stone-500 mb-2">METHOD</p>
              <ol className="space-y-2 text-sm">{openRecipe.steps?.map((s, i) => <li key={i} className="flex gap-3"><span className="font-mono text-emerald-700">{i+1}.</span> {s}</li>)}</ol>
            </div>

            {openRecipe.tip && <div className="mt-4 p-3 bg-lime-50 rounded-2xl text-sm">{openRecipe.tip}</div>}

            <button onClick={() => setOpenRecipe(null)} className="mt-6 w-full py-3.5 bg-emerald-700 text-white rounded-2xl font-semibold">Close</button>
          </div>
        </div>
      )}

      {/* Household Sheet */}
      {showHome && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-end" onClick={() => setShowHome(false)}>
          <div className="bg-white w-full rounded-t-3xl p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-4">{household ? "Your Home" : "Homes"}</h3>
            
            {household ? (
              <div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center mb-4">
                  <p className="text-xs text-emerald-700 font-bold tracking-widest">INVITE CODE</p>
                  <p className="text-3xl font-bold text-emerald-800 tracking-widest mt-1">{household.code}</p>
                </div>
                <button onClick={leaveHome} className="w-full py-3 rounded-2xl border text-rose-600 font-medium flex items-center justify-center gap-2">
                  <LogOut size={17} /> Leave home
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button onClick={createHome} className="w-full p-4 bg-emerald-700 text-white rounded-2xl text-left flex gap-3">
                  <Home size={22} /><div><div className="font-semibold">Create a home</div><div className="text-xs text-emerald-100">Get an invite code</div></div></button>
                <button onClick={() => {
                  const code = prompt("Enter invite code (e.g. HOME-ABCD)");
                  if (code) joinHome(code.toUpperCase());
                }} className="w-full p-4 bg-white border rounded-2xl text-left flex gap-3">
                  <Users size={22} className="text-emerald-700" /><div><div className="font-semibold">Join a home</div><div className="text-xs text-stone-500">Enter a code</div></div></button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Undo Toast */}
      {undoItem && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-stone-900 text-white px-5 py-3 rounded-2xl flex items-center gap-4 z-[70]">
          <span className="text-sm">Removed <strong>{undoItem.name}</strong></span>
          <button onClick={doUndo} className="text-emerald-400 font-bold text-sm flex items-center gap-1"><Undo2 size={15} /> Undo</button>
        </div>
      )}
    </div>
  );
}

                <img className="button-icon" src={reactLogo} alt="" />
                Learn more
              </a>
            </li>
          </ul>
        </div>
        <div id="social">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2>Connect with us</h2>
          <p>Join the Vite community</p>
          <ul>
            <li>
              <a href="https://github.com/vitejs/vite" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Discord
              </a>
            </li>
            <li>
              <a href="https://x.com/vite_js" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#x-icon"></use>
                </svg>
                X.com
              </a>
            </li>
            <li>
              <a href="https://bsky.app/profile/vite.dev" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#bluesky-icon"></use>
                </svg>
                Bluesky
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default App
