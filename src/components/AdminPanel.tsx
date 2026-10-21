import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Folder, 
  Tag, 
  Users, 
  Sliders, 
  Bell, 
  Settings, 
  Database, 
  RefreshCw, 
  ShieldCheck, 
  ChevronRight, 
  ChevronLeft,
  LogOut, 
  Globe,
  Menu,
  Search,
  X,
  MessageSquare,
  Clock,
  AlertCircle,
  Inbox,
  Package,
  DollarSign,
  Building,
  Receipt,
  FileSpreadsheet,
  Truck,
  MapPin,
  Contact,
  ChevronDown
} from 'lucide-react';
import { 
  Order, 
  Product, 
  User, 
  Category, 
  Coupon, 
  Banner, 
  FlashSale, 
  InventoryLog, 
  ActivityLog, 
  StoreSettings,
  Supplier,
  Customer,
  PurchaseOrder,
  Expense,
  DamageWaste,
  AccountTransaction,
  CourierParcel,
  CourierSettings
} from '../types';

// Importing sub-modules
import DashboardOverview from './admin/DashboardOverview';
import ProductManagement from './admin/ProductManagement';
import CategoryManagement from './admin/CategoryManagement';
import OrderManagement from './admin/OrderManagement';
import PromotionAndSales from './admin/PromotionAndSales';
import StaffAndCustomers from './admin/StaffAndCustomers';
import InventoryAndReviews from './admin/InventoryAndReviews';
import NotificationAndSettings from './admin/NotificationAndSettings';
import InventoryManagement from './admin/InventoryManagement';
import AccountsManagement from './admin/AccountsManagement';
import CourierManagement from './admin/CourierManagement';
import CourierPointManagement from './admin/CourierPointManagement';
import ContactsManagement from './admin/ContactsManagement';

interface AdminPanelProps {
  currentUser: User | null;
  lang: 'en' | 'bn';
  kpis: {
    sales: number;
    totalOrders: number;
    inventoriesCount: number;
    pendingOrders: number;
  };
  orders: Order[];
  products: Product[];
  onUpdateOrderStatus: (orderId: string, status: string, paymentStatus?: 'Pending' | 'Paid') => Promise<void>;
  onDeleteOrder?: (orderId: string) => Promise<void>;
  onUpdateStock: (productId: string, stock: number) => Promise<void>;
  onAddProduct: (productData: any) => Promise<void>;
  onUpdateProduct: (productData: any) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onDuplicateProduct: (productId: string) => Promise<void>;
  syncStatus: any;
  onRefreshSync: () => Promise<void>;
  onLogout?: () => Promise<void> | void;
  onExitAdminView?: () => void;
  onSettingsChange?: (newSettings: StoreSettings) => void;
  onBannersChange?: (banners: Banner[]) => void;
}

export default function AdminPanel({
  currentUser,
  lang,
  kpis,
  orders = [],
  products = [],
  onUpdateOrderStatus,
  onDeleteOrder,
  onUpdateStock,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onDuplicateProduct,
  syncStatus,
  onRefreshSync,
  onLogout,
  onExitAdminView,
  onSettingsChange,
  onBannersChange
}: AdminPanelProps) {
  const isBn = lang === 'bn';

  // Super Admin SaaS Layout States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('taqwa_admin_sidebar_collapsed') === 'true';
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [notificationsDropdownOpen, setNotificationsDropdownOpen] = useState<boolean>(false);
  const [messagesDropdownOpen, setMessagesDropdownOpen] = useState<boolean>(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');

  // Keep live date & time updated
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    };
    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, [lang]);

  // Persist sidebar collapse preference
  useEffect(() => {
    localStorage.setItem('taqwa_admin_sidebar_collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  // Selected administrative view state
  const [activeTab, setActiveTab] = useState<
    'overview' | 'contacts' | 'suppliers' | 'customers' | 'products' | 'categories' | 'orders' | 'inventory' | 'accounts' | 'courier' | 'courier-points' | 'promotions' | 'users' | 'settings'
  >('overview');

  // Contacts submenu open state
  const [isContactsMenuOpen, setIsContactsMenuOpen] = useState(true);

  // Loading indicator & error banner state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Extended dashboard collections loaded via REST API
  const [categories, setCategories] = useState<Category[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [damages, setDamages] = useState<DamageWaste[]>([]);
  const [transactions, setTransactions] = useState<AccountTransaction[]>([]);
  const [accountsSummary, setAccountsSummary] = useState<any>(null);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    const cached = localStorage.getItem('taqwa_settings');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return {
          storeName: parsed.storeName || 'Taqwa Enterprise',
          logo: parsed.logo || '',
          favicon: parsed.favicon || '',
          contactEmail: parsed.contactEmail || 'taqwaenterpriseoffice@gmail.com',
          contactPhone: parsed.contactPhone || '01913955452',
          businessHours: parsed.businessHours || '10 AM - 10 PM',
          socialFacebook: parsed.socialFacebook || 'https://facebook.com',
          socialYoutube: parsed.socialYoutube || 'https://youtube.com',
          shippingChargeDhaka: parsed.shippingChargeDhaka !== undefined ? parsed.shippingChargeDhaka : 60,
          shippingChargeOutside: parsed.shippingChargeOutside !== undefined ? parsed.shippingChargeOutside : 120,
          taxRate: parsed.taxRate !== undefined ? parsed.taxRate : 0,
          currency: parsed.currency || 'BDT',
          language: parsed.language || 'en',
          bkashNumber: parsed.bkashNumber || '01913955452',
          bkashType: parsed.bkashType || 'Personal',
          bkashChargeRate: parsed.bkashChargeRate !== undefined ? parsed.bkashChargeRate : 1.85,
          nagadNumber: parsed.nagadNumber || '01913955452',
          nagadType: parsed.nagadType || 'Personal',
          nagadChargeRate: parsed.nagadChargeRate !== undefined ? parsed.nagadChargeRate : 1.5,
          rocketNumber: parsed.rocketNumber || '01913955452',
          rocketType: parsed.rocketType || 'Personal',
          rocketChargeRate: parsed.rocketChargeRate !== undefined ? parsed.rocketChargeRate : 1.8,
          paymentInstructionsEn: parsed.paymentInstructionsEn || 'Please send money to our official number 01913955452 and input the TxnID.',
          paymentInstructionsBn: parsed.paymentInstructionsBn || 'আমাদের অফিসিয়াল নাম্বারে (01913955452) টাকা সেন্ড মানি করে ট্রানজেকশন আইডি প্রদান করুন।',
          codChargeRate: parsed.codChargeRate !== undefined ? parsed.codChargeRate : 1.0,
          maintenanceMode: parsed.maintenanceMode || false,
          orderIdPrefix: parsed.orderIdPrefix || 'TQW'
        };
      } catch (e) {
        // ignore
      }
    }
    return {
      storeName: 'Taqwa Enterprise',
      logo: '',
      favicon: '',
      contactEmail: 'taqwaenterpriseoffice@gmail.com',
      contactPhone: '01913955452',
      businessHours: '10 AM - 10 PM',
      socialFacebook: 'https://facebook.com',
      socialYoutube: 'https://youtube.com',
      shippingChargeDhaka: 60,
      shippingChargeOutside: 120,
      taxRate: 0,
      currency: 'BDT',
      language: 'en',
      bkashNumber: '01913955452',
      bkashType: 'Personal',
      bkashChargeRate: 1.85,
      nagadNumber: '01913955452',
      nagadType: 'Personal',
      nagadChargeRate: 1.5,
      rocketNumber: '01913955452',
      rocketType: 'Personal',
      rocketChargeRate: 1.8,
      paymentInstructionsEn: 'Please send money to our official number 01913955452 and input the TxnID.',
      paymentInstructionsBn: 'আমাদের অফিসিয়াল নাম্বারে (01913955452) টাকা সেন্ড মানি করে ট্রানজেকশন আইডি প্রদান করুন।',
      codChargeRate: 1.0,
      maintenanceMode: false,
      orderIdPrefix: 'TQW'
    };
  });

  const [extendedKPIs, setExtendedKPIs] = useState<any>(null);
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [categoryAnalytics, setCategoryAnalytics] = useState<any[]>([]);

  // API Trigger: Load all collections from server
  const loadDashboardData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/dashboard', {
        headers: { 'x-user-email': currentUser?.email || '' }
      });
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
        setBanners(data.banners || []);
        if (onBannersChange) onBannersChange(data.banners || []);
        setUsersList(data.users || []);
        setExtendedKPIs(data.kpis || null);
        setSalesHistory(data.salesHistory || []);
        setCategoryAnalytics(data.categoryAnalytics || []);

        // Retrieve categories dynamically from server
        try {
          const catRes = await fetch('/api/admin/categories', {
            headers: { 'x-user-email': currentUser?.email || '' }
          });
          if (catRes.ok) {
            const serverCats = await catRes.json();
            if (serverCats && serverCats.length > 0) {
              setCategories(serverCats);
              localStorage.setItem('taqwa_categories', JSON.stringify(serverCats));
            } else {
              // Initialize default categories matching server categories
              const defaults: Category[] = [
                { id: 'birds', name: 'Birds Collection', banglaName: 'পাখি কালেকশন', icon: 'Folder', displayOrder: 1, enabled: true, subcategories: ['Seeds Mix', 'Breeding Formula'] },
                { id: 'cats', name: 'Cats Food', banglaName: 'বিড়ালের খাবার', icon: 'Folder', displayOrder: 2, enabled: true, subcategories: ['Wet Pouches', 'Premium Kibbles'] },
                { id: 'fish', name: 'Fish Supplies', banglaName: 'মাছের খাবার', icon: 'Folder', displayOrder: 3, enabled: true, subcategories: ['Flakes', 'Pellets'] },
                { id: 'accessories', name: 'Accessories', banglaName: 'খাঁচা ও এক্সেসরিজ', icon: 'Folder', displayOrder: 4, enabled: true, subcategories: ['Feeders', 'Toys'] }
              ];
              setCategories(defaults);
              localStorage.setItem('taqwa_categories', JSON.stringify(defaults));
              // Also add them to server
              for (const d of defaults) {
                await fetch('/api/admin/add-category', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'x-user-email': currentUser?.email || '' },
                  body: JSON.stringify(d)
                });
              }
            }
          }
        } catch (catErr) {
          console.error("Failed to fetch server categories in admin dashboard", catErr);
          const cachedCategories = localStorage.getItem('taqwa_categories');
          if (cachedCategories) {
            setCategories(JSON.parse(cachedCategories));
          }
        }

        const cachedFlash = localStorage.getItem('taqwa_flash_sales');
        if (cachedFlash) {
          setFlashSales(JSON.parse(cachedFlash));
        } else {
          const defaults: FlashSale[] = [
            { id: 'fs-1', title: 'Monsoon Flash Feed 15%', countdownEndTime: new Date(Date.now() + 86400000 * 2).toISOString(), products: ['1', '2'], startTime: new Date().toISOString(), endTime: new Date(Date.now() + 86400000 * 2).toISOString(), status: 'Active' }
          ];
          setFlashSales(defaults);
          localStorage.setItem('taqwa_flash_sales', JSON.stringify(defaults));
        }

        const cachedLogs = localStorage.getItem('taqwa_inventory_logs');
        if (cachedLogs) {
          setInventoryLogs(JSON.parse(cachedLogs));
        } else {
          const defaults: InventoryLog[] = [
            { id: 'log-1', productId: '1', productName: 'Premium Mix Seeds (Premium)', type: 'Purchase Entry', quantity: 50, reason: 'Vendor batch #A12', date: new Date().toISOString(), operator: currentUser?.email || 'admin@taqwa.com' }
          ];
          setInventoryLogs(defaults);
          localStorage.setItem('taqwa_inventory_logs', JSON.stringify(defaults));
        }

        const cachedActivities = localStorage.getItem('taqwa_activity_logs');
        if (cachedActivities) {
          setActivityLogs(JSON.parse(cachedActivities));
        } else {
          const defaults: ActivityLog[] = [
            { id: 'act-1', userEmail: currentUser?.email || 'admin@taqwa.com', action: 'DASHBOARD_ACCESS', details: 'Authorized session established successfully', timestamp: new Date().toISOString() }
          ];
          setActivityLogs(defaults);
          localStorage.setItem('taqwa_activity_logs', JSON.stringify(defaults));
        }

        // Fetch settings from server
        try {
          const settingsRes = await fetch('/api/settings');
          if (settingsRes.ok) {
            const serverSettings = await settingsRes.json();
            setStoreSettings(serverSettings);
            localStorage.setItem('taqwa_settings', JSON.stringify(serverSettings));
          }
        } catch (settingsErr) {
          console.error("Failed to load settings from server in dashboard", settingsErr);
        }

        // Fetch enterprise inventory & accounts modules
        try {
          const [supRes, custRes, poRes, expRes, dmgRes, accRes, sumRes] = await Promise.all([
            fetch('/api/admin/suppliers', { headers: { 'x-user-email': currentUser?.email || '' } }),
            fetch('/api/admin/customers', { headers: { 'x-user-email': currentUser?.email || '' } }),
            fetch('/api/admin/purchases', { headers: { 'x-user-email': currentUser?.email || '' } }),
            fetch('/api/admin/expenses', { headers: { 'x-user-email': currentUser?.email || '' } }),
            fetch('/api/admin/damages', { headers: { 'x-user-email': currentUser?.email || '' } }),
            fetch('/api/admin/accounts/transactions', { headers: { 'x-user-email': currentUser?.email || '' } }),
            fetch('/api/admin/accounts/summary', { headers: { 'x-user-email': currentUser?.email || '' } })
          ]);

          if (supRes.ok) setSuppliers(await supRes.json());
          if (custRes.ok) setCustomers(await custRes.json());
          if (poRes.ok) setPurchases(await poRes.json());
          if (expRes.ok) setExpenses(await expRes.json());
          if (dmgRes.ok) setDamages(await dmgRes.json());
          if (accRes.ok) setTransactions(await accRes.json());
          if (sumRes.ok) setAccountsSummary(await sumRes.json());
        } catch (accErr) {
          console.error("Failed to load inventory and accounts collections", accErr);
        }

      } else {
        setErrorMsg('Failed to pull analytical feed from Express database.');
      }
    } catch (err) {
      setErrorMsg('Express Server connection timeout.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [currentUser, activeTab]);

  // Utility to log admin activity locally & securely
  const logAdminActivity = (action: string, details: string) => {
    const fresh: ActivityLog = {
      id: `act-${Date.now()}`,
      userEmail: currentUser?.email || 'admin@taqwa.com',
      action,
      details,
      timestamp: new Date().toISOString()
    };
    const updated = [fresh, ...activityLogs];
    setActivityLogs(updated);
    localStorage.setItem('taqwa_activity_logs', JSON.stringify(updated));
  };

  // 1. Core Category Handlers
  const handleAddCategory = async (payload: Category) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/add-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': currentUser?.email || '' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const next = [...categories, payload];
        setCategories(next);
        localStorage.setItem('taqwa_categories', JSON.stringify(next));
        logAdminActivity('CREATE_CATEGORY', `Created taxonomy node "${payload.name}"`);
        setSuccessMsg('Category node appended successfully.');
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to append category node.');
      }
    } catch (err) {
      setErrorMsg('Failed to compile category addition.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategory = async (payload: Category) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/update-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': currentUser?.email || '' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const next = categories.map(c => c.id === payload.id ? payload : c);
        setCategories(next);
        localStorage.setItem('taqwa_categories', JSON.stringify(next));
        logAdminActivity('UPDATE_CATEGORY', `Configured properties of "${payload.name}"`);
        setSuccessMsg('Category node saved successfully.');
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to update category.');
      }
    } catch (err) {
      setErrorMsg('Failed to sync category changes.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/delete-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': currentUser?.email || '' },
        body: JSON.stringify({ id: catId })
      });
      if (res.ok) {
        const next = categories.filter(c => c.id !== catId);
        setCategories(next);
        localStorage.setItem('taqwa_categories', JSON.stringify(next));
        logAdminActivity('DELETE_CATEGORY', `Purged taxonomy key ID "${catId}"`);
        setSuccessMsg('Category node purged.');
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to remove category.');
      }
    } catch (err) {
      setErrorMsg('Failed to process category deletion.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Core Coupon Handlers
  const handleAddCoupon = async (payload: Coupon) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/add-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': currentUser?.email || '' },
        body: JSON.stringify({
          code: payload.code,
          type: payload.type,
          value: payload.value,
          minPurchase: payload.minPurchase,
          description: payload.type === 'percentage' ? `${payload.value}% Promo` : `৳${payload.value} Off`
        })
      });
      if (res.ok) {
        logAdminActivity('CREATE_COUPON', `Generated coupon code "${payload.code}"`);
        await loadDashboardData();
        setSuccessMsg('Coupon code generated successfully.');
      }
    } catch (err) {
      setErrorMsg('Failed to save coupon.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/delete-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': currentUser?.email || '' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        logAdminActivity('DELETE_COUPON', `Purged coupon id "${id}"`);
        await loadDashboardData();
        setSuccessMsg('Coupon code removed.');
      }
    } catch (err) {
      setErrorMsg('Failed to purge coupon.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Campaign Banners Handlers
  const handleAddBanner = async (payload: Banner) => {
    setLoading(true);
    try {
      const updated = [payload, ...banners];
      const res = await fetch('/api/admin/update-banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': currentUser?.email || '' },
        body: JSON.stringify({ banners: updated })
      });
      if (res.ok) {
        logAdminActivity('PUBLISH_BANNER', `Dispatched slider banner "${payload.title}"`);
        await loadDashboardData();
        setSuccessMsg('Campaign banner published.');
      }
    } catch (err) {
      setErrorMsg('Banner save failure.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    setLoading(true);
    try {
      const updated = banners.filter(b => b.id !== id);
      const res = await fetch('/api/admin/update-banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': currentUser?.email || '' },
        body: JSON.stringify({ banners: updated })
      });
      if (res.ok) {
        logAdminActivity('REMOVE_BANNER', `Purged slider banner id "${id}"`);
        await loadDashboardData();
        setSuccessMsg('Campaign banner removed.');
      }
    } catch (err) {
      setErrorMsg('Banner purge failure.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Flash Sale Handlers
  const handleAddFlashSale = async (payload: FlashSale) => {
    const next = [payload, ...flashSales];
    setFlashSales(next);
    localStorage.setItem('taqwa_flash_sales', JSON.stringify(next));
    logAdminActivity('START_FLASHSALE', `Activated lightning campaign "${payload.title}"`);
    setSuccessMsg('Flash sale countdown activated.');
  };

  const handleDeleteFlashSale = async (id: string) => {
    const next = flashSales.filter(f => f.id !== id);
    setFlashSales(next);
    localStorage.setItem('taqwa_flash_sales', JSON.stringify(next));
    logAdminActivity('TERMINATE_FLASHSALE', `Purged campaign code "${id}"`);
    setSuccessMsg('Flash sale terminated.');
  };

  // 5. Staff identity management Handlers
  const handleAddUser = async (payload: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/add-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': currentUser?.email || '' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        logAdminActivity('CREATE_STAFF', `Registered administrative identity "${payload.name}" as ${payload.role}`);
        await loadDashboardData();
        setSuccessMsg('Staff member registered.');
      } else {
        const d = await res.json();
        setErrorMsg(d.error || 'Failed to save staff member.');
      }
    } catch (err) {
      setErrorMsg('Failed to process staff creation.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserRole = async (uId: string, role: string, permissions: string[] = []) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': currentUser?.email || '' },
        body: JSON.stringify({ id: uId, role, permissions })
      });
      if (res.ok) {
        logAdminActivity('UPDATE_STAFF_ROLE', `Modified roles/permissions of UID "${uId}" to ${role}`);
        await loadDashboardData();
        setSuccessMsg('Identity rights saved.');
      }
    } catch (err) {
      setErrorMsg('Role update failure.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (uId: string, status: 'Active' | 'Inactive' | 'Banned') => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': currentUser?.email || '' },
        body: JSON.stringify({ id: uId, status })
      });
      if (res.ok) {
        logAdminActivity('TOGGLE_USER_STATUS', `Modified operational status of UID "${uId}" to ${status}`);
        await loadDashboardData();
        setSuccessMsg('User status updated.');
      }
    } catch (err) {
      setErrorMsg('Failed to toggle status.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': currentUser?.email || '' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        logAdminActivity('DELETE_USER', `Wiped identity logs of UID "${id}" from database`);
        await loadDashboardData();
        setSuccessMsg('User account purged.');
      }
    } catch (err) {
      setErrorMsg('Failed to wipe user.');
    } finally {
      setLoading(false);
    }
  };

  // 6. Inventory Adjustment Handlers
  const handleAdjustStock = async (pId: string, quantity: number, type: string, reason: string) => {
    setLoading(true);
    try {
      const p = products.find(prod => prod.id === pId);
      const targetStock = p ? (type === 'Damage Entry' ? Math.max(0, p.stock - quantity) : p.stock + quantity) : quantity;
      
      await onUpdateStock(pId, targetStock);

      const log: InventoryLog = {
        id: `log-${Date.now()}`,
        productId: pId,
        productName: p ? p.name : 'Unknown Product',
        type,
        quantity,
        reason,
        date: new Date().toISOString(),
        operator: currentUser?.email || 'admin@taqwa.com'
      };

      const next = [log, ...inventoryLogs];
      setInventoryLogs(next);
      localStorage.setItem('taqwa_inventory_logs', JSON.stringify(next));
      logAdminActivity('ADJUST_STOCK', `Stock adjustment recorded for "${log.productName}" (+/- ${quantity})`);
      setSuccessMsg('Stock ledger transaction posted.');
    } catch (err) {
      setErrorMsg('Failed to post stock transaction.');
    } finally {
      setLoading(false);
    }
  };

  // Enterprise Purchases & Stock In Handler
  const handleAddPurchase = async (payload: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/add-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': currentUser?.email || '' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        logAdminActivity('ADD_PURCHASE', `Processed purchase order from supplier ID "${payload.supplierId}"`);
        await loadDashboardData();
        setSuccessMsg('Purchase order & stock intake successfully recorded.');
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to save purchase order.');
      }
    } catch (err) {
      setErrorMsg('Purchase order submission failed.');
    } finally {
      setLoading(false);
    }
  };

  // Enterprise Damages Handler
  const handleAddDamage = async (payload: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/add-damage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': currentUser?.email || '' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        logAdminActivity('RECORD_DAMAGE', `Wrote off damaged product ID "${payload.productId}"`);
        await loadDashboardData();
        setSuccessMsg('Damage & spoilage entry recorded and written off.');
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to record damage.');
      }
    } catch (err) {
      setErrorMsg('Damage write-off failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDamage = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/delete-damage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': currentUser?.email || '' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        await loadDashboardData();
        setSuccessMsg('Damage record removed.');
      }
    } catch (err) {
      setErrorMsg('Failed to remove damage record.');
    } finally {
      setLoading(false);
    }
  };

  // Enterprise Expenses Handler
  const handleAddExpense = async (payload: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/add-expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': currentUser?.email || '' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        logAdminActivity('ADD_EXPENSE', `Recorded expense "${payload.title}" ৳${payload.amount}`);
        await loadDashboardData();
        setSuccessMsg('Expense entry saved to ledger.');
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to save expense.');
      }
    } catch (err) {
      setErrorMsg('Expense record failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/delete-expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': currentUser?.email || '' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        await loadDashboardData();
        setSuccessMsg('Expense entry deleted.');
      }
    } catch (err) {
      setErrorMsg('Failed to delete expense.');
    } finally {
      setLoading(false);
    }
  };

  // Enterprise Supplier Payment Handler
  const handlePaySupplier = async (supplierId: string, amount: number, paymentMethod: string, notes?: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pay-supplier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': currentUser?.email || '' },
        body: JSON.stringify({ supplierId, amount, paymentMethod, notes })
      });
      if (res.ok) {
        logAdminActivity('PAY_SUPPLIER', `Paid ৳${amount} to supplier ID "${supplierId}"`);
        await loadDashboardData();
        setSuccessMsg('Supplier payment recorded successfully.');
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to record supplier payment.');
      }
    } catch (err) {
      setErrorMsg('Supplier payment failed.');
    } finally {
      setLoading(false);
    }
  };

  // Contacts: Suppliers Handlers
  const handleAddSupplier = async (payload: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/add-supplier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': currentUser?.email || '' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        logAdminActivity('ADD_SUPPLIER', `Registered supplier "${payload.name}"`);
        await loadDashboardData();
        setSuccessMsg(isBn ? 'নতুন সরবরাহকারী সফলভাবে যুক্ত হয়েছে।' : 'Supplier successfully registered.');
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to add supplier.');
      }
    } catch (err) {
      setErrorMsg('Failed to add supplier.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSupplier = async (payload: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/update-supplier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': currentUser?.email || '' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        logAdminActivity('UPDATE_SUPPLIER', `Updated supplier "${payload.name}"`);
        await loadDashboardData();
        setSuccessMsg(isBn ? 'সরবরাহকারীর তথ্য সফলভাবে আপডেট হয়েছে।' : 'Supplier updated.');
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to update supplier.');
      }
    } catch (err) {
      setErrorMsg('Supplier update failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/delete-supplier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': currentUser?.email || '' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        logAdminActivity('DELETE_SUPPLIER', `Deleted supplier record ID "${id}"`);
        await loadDashboardData();
        setSuccessMsg(isBn ? 'সরবরাহকারী মুছে ফেলা হয়েছে।' : 'Supplier deleted.');
      }
    } catch (err) {
      setErrorMsg('Failed to delete supplier.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSupplierStatus = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/toggle-supplier-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': currentUser?.email || '' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        await loadDashboardData();
        setSuccessMsg('Supplier status updated.');
      }
    } catch (err) {
      setErrorMsg('Failed to toggle supplier status.');
    } finally {
      setLoading(false);
    }
  };

  // Contacts: Customers Handlers
  const handleAddCustomer = async (payload: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/add-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': currentUser?.email || '' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        logAdminActivity('ADD_CUSTOMER', `Registered customer "${payload.businessName || payload.name}" (${payload.contactId})`);
        await loadDashboardData();
        setSuccessMsg(isBn ? 'কাস্টমার সফলভাবে নিবন্ধিত হয়েছে।' : 'Customer successfully registered.');
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to save customer.');
      }
    } catch (err) {
      setErrorMsg('Customer registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCustomer = async (payload: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/update-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': currentUser?.email || '' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        logAdminActivity('UPDATE_CUSTOMER', `Updated customer "${payload.businessName || payload.name}" (${payload.contactId})`);
        await loadDashboardData();
        setSuccessMsg(isBn ? 'কাস্টমার তথ্য আপডেট হয়েছে।' : 'Customer updated successfully.');
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to update customer.');
      }
    } catch (err) {
      setErrorMsg('Customer update failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/delete-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': currentUser?.email || '' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        logAdminActivity('DELETE_CUSTOMER', `Deleted customer record ID "${id}"`);
        await loadDashboardData();
        setSuccessMsg(isBn ? 'কাস্টমার রেকর্ড মুছে ফেলা হয়েছে।' : 'Customer deleted successfully.');
      }
    } catch (err) {
      setErrorMsg('Failed to delete customer.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCustomerStatus = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/toggle-customer-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': currentUser?.email || '' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        await loadDashboardData();
        setSuccessMsg('Customer status updated.');
      }
    } catch (err) {
      setErrorMsg('Failed to toggle customer status.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayCustomerDue = async (customerId: string, amount: number, paymentMethod: string, notes: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pay-customer-due', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': currentUser?.email || '' },
        body: JSON.stringify({ customerId, amount, paymentMethod, notes })
      });
      if (res.ok) {
        logAdminActivity('RECEIVE_CUSTOMER_DUE', `Collected ৳${amount} due payment from customer ID "${customerId}"`);
        await loadDashboardData();
        setSuccessMsg(isBn ? 'বকেয়া আদায়ের হিসাব সংরক্ষণ করা হয়েছে।' : 'Customer due collection recorded.');
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to record customer payment.');
      }
    } catch (err) {
      setErrorMsg('Due payment record failed.');
    } finally {
      setLoading(false);
    }
  };

  // Enterprise Accounts Transactions Handler
  const handleAddTransaction = async (payload: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/accounts/add-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': currentUser?.email || '' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        logAdminActivity('ADD_TRANSACTION', `Recorded ${payload.type} transaction ৳${payload.amount}`);
        await loadDashboardData();
        setSuccessMsg('Transaction successfully posted to cashbook.');
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to save transaction.');
      }
    } catch (err) {
      setErrorMsg('Transaction entry failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/accounts/delete-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': currentUser?.email || '' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        await loadDashboardData();
        setSuccessMsg('Transaction entry deleted.');
      }
    } catch (err) {
      setErrorMsg('Failed to delete transaction.');
    } finally {
      setLoading(false);
    }
  };

  // 7. Review approval Handlers
  const handleApproveReview = async (pId: string, revId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/approve-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': currentUser?.email || '' },
        body: JSON.stringify({ productId: pId, reviewId: revId, approved: true })
      });
      if (res.ok) {
        logAdminActivity('APPROVE_REVIEW', `Approved customer feedback review item ID "${revId}"`);
        await loadDashboardData();
        setSuccessMsg('Feedback review item approved.');
      }
    } catch (err) {
      setErrorMsg('Review approval failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectReview = async (pId: string, revId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/approve-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': currentUser?.email || '' },
        body: JSON.stringify({ productId: pId, reviewId: revId, approved: false })
      });
      if (res.ok) {
        logAdminActivity('REJECT_REVIEW', `Rejected and suppressed feedback item "${revId}"`);
        await loadDashboardData();
        setSuccessMsg('Feedback review item rejected.');
      }
    } catch (err) {
      setErrorMsg('Review rejection failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (pId: string, revId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/delete-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': currentUser?.email || '' },
        body: JSON.stringify({ productId: pId, reviewId: revId })
      });
      if (res.ok) {
        logAdminActivity('DELETE_REVIEW', `Wiped feedback item "${revId}"`);
        await loadDashboardData();
        setSuccessMsg('Feedback review item deleted permanently.');
      }
    } catch (err) {
      setErrorMsg('Review deletion failed.');
    } finally {
      setLoading(false);
    }
  };

  // 8. Push Broadcast Handlers
  const handleSendNotification = async (title: string, banglaTitle: string, message: string, banglaMessage: string, type: string) => {
    setLoading(true);
    try {
      // Direct call to send out promo/system message
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': currentUser?.email || '' },
        body: JSON.stringify({ title, banglaTitle, message, banglaMessage, type })
      });
      logAdminActivity('SEND_BROADCAST', `Dispatched promotional broadcast: "${title}"`);
      await loadDashboardData();
      setSuccessMsg('Promotional notification broadcast complete.');
    } catch (err) {
      setErrorMsg('Broadcast failed.');
    } finally {
      setLoading(false);
    }
  };

  // 9. Core Settings Handlers
  const handleUpdateSettings = async (newSettings: StoreSettings) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || ''
        },
        body: JSON.stringify(newSettings)
      });
      if (res.ok) {
        setStoreSettings(newSettings);
        localStorage.setItem('taqwa_settings', JSON.stringify(newSettings));
        if (onSettingsChange) onSettingsChange(newSettings);
        logAdminActivity('UPDATE_SETTINGS', `Modified official hotline, delivery charges, or Tax rates`);
        setSuccessMsg('Settings saved successfully.');
      } else {
        setErrorMsg('Failed to save settings on server.');
      }
    } catch (err) {
      setErrorMsg('Failed to sync settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex" id="super-admin-dashboard-container">
      
      {/* 1. MOBILE SIDEBAR DRAWER OVERLAY */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        >
          <aside 
            className="w-64 h-full bg-slate-900 text-white flex flex-col justify-between p-6 animate-slide-in shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-8">
              {/* Drawer Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                    <ShieldCheck className="w-4.5 h-4.5 text-white" />
                  </div>
                  <span className="font-extrabold text-xs tracking-wider">TAQWA SAAS</span>
                </div>
                <button 
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Navigation Links */}
              <nav className="space-y-1 text-xs font-bold text-slate-400">
                <button
                  onClick={() => { setActiveTab('overview'); setIsMobileSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                    activeTab === 'overview' ? 'bg-emerald-600 text-white shadow-md font-black' : 'hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <TrendingUp className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{isBn ? 'ড্যাশবোর্ড ওভারভিউ' : 'Overview Dashboard'}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                </button>

                {/* Contacts Expandable Menu (Mobile) matching screenshot */}
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setIsContactsMenuOpen(!isContactsMenuOpen);
                      if (activeTab !== 'contacts' && activeTab !== 'suppliers' && activeTab !== 'customers') {
                        setActiveTab('customers');
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                      (activeTab === 'contacts' || activeTab === 'suppliers' || activeTab === 'customers')
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-black'
                        : 'hover:bg-slate-800 hover:text-slate-200 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Contact className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>{isBn ? 'কন্টাক্টস' : 'Contacts'}</span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ${isContactsMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isContactsMenuOpen && (
                    <div className="ml-5 pl-3 border-l-2 border-emerald-500/40 space-y-1 py-1 text-xs">
                      <button
                        onClick={() => { setActiveTab('suppliers'); setIsMobileSidebarOpen(false); }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                          activeTab === 'suppliers' ? 'text-emerald-400 bg-slate-800 font-black' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span>{isBn ? 'সাপ্লায়ার (Suppliers)' : 'Suppliers'}</span>
                        <span className="text-[10px] text-slate-500">({suppliers.length})</span>
                      </button>
                      <button
                        onClick={() => { setActiveTab('customers'); setIsMobileSidebarOpen(false); }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                          activeTab === 'customers' ? 'text-emerald-400 bg-slate-800 font-black' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span>{isBn ? 'কাস্টমার (Customers)' : 'Customers'}</span>
                        <span className="text-[10px] text-slate-500">({customers.length})</span>
                      </button>
                    </div>
                  )}
                </div>

                {[
                  { id: 'inventory', label: isBn ? '১। ইনভেন্টরি ম্যানেজমেন্ট' : '1. Inventory Control', icon: Package },
                  { id: 'accounts', label: isBn ? '২। অ্যাকাউন্টস ও আয়-ব্যয়' : '2. Accounts & Finance', icon: DollarSign },
                  { id: 'courier', label: isBn ? '৩। কুরিয়ার সার্ভিস ও বুকিং' : '3. Courier & Parcel Booking', icon: Truck },
                  { id: 'courier-points', label: isBn ? '৪। অ্যাক্টিভ কুরিয়ার পয়েন্ট' : '4. Active Courier Points', icon: MapPin },
                  { id: 'products', label: isBn ? 'পণ্য ক্যাটালগ' : 'Products & Catalog', icon: ShoppingBag },
                  { id: 'orders', label: isBn ? 'অর্ডার লেজার বুক' : 'Orders Ledger', icon: ShoppingBag },
                  { id: 'categories', label: isBn ? 'ক্যাটাগরি সাজানো' : 'Taxonomy Nodes', icon: Folder },
                  { id: 'promotions', label: isBn ? 'প্রমোশন ও ডিসকাউন্ট' : 'Promos & Coupons', icon: Tag },
                  { id: 'users', label: isBn ? 'অ্যাডমিন ও ইউজার' : 'Identity Control', icon: Users },
                  { id: 'settings', label: isBn ? 'সিস্টেম সেটিংস' : 'System Settings', icon: Settings },
                  { id: 'exit', label: isBn ? 'ওয়েবসাইটে ফিরে যান' : 'Go to Website', icon: Globe },
                ].map((link) => {
                  const IconComp = link.icon;
                  return (
                    <button
                      key={link.id}
                      onClick={() => {
                        if (link.id === 'exit') {
                          onExitAdminView?.();
                        } else {
                          setActiveTab(link.id as any);
                          setIsMobileSidebarOpen(false);
                        }
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                        activeTab === link.id 
                          ? 'bg-emerald-600 text-white shadow-md font-black' 
                          : 'hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <IconComp className="w-4 h-4 shrink-0 text-emerald-400" />
                        <span>{link.label}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Drawer Footer */}
            <div className="border-t border-slate-800 pt-4 text-[10px] text-slate-500 font-bold space-y-1">
              <p className="truncate">Login: {currentUser?.email}</p>
              <p className="text-emerald-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>SECURE HOST SYNCED</span>
              </p>
            </div>
          </aside>
        </div>
      )}

      {/* 2. DESKTOP COLLAPSIBLE SIDEBAR */}
      <aside 
        className={`bg-slate-900 text-white flex-col justify-between hidden md:flex shrink-0 transition-all duration-300 ease-in-out border-r border-slate-800 ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="p-5 space-y-8">
          
          {/* Logo Brand Header */}
          <div className="flex items-center gap-2.5 justify-start">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow-md shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            {!isSidebarCollapsed && (
              <div className="animate-fade-in whitespace-nowrap">
                <h1 className="font-extrabold text-sm tracking-wide">TAQWA PANEL</h1>
                <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5">SaaS Super Admin</p>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 text-xs font-bold text-slate-400">
            <button
              onClick={() => setActiveTab('overview')}
              title={isSidebarCollapsed ? (isBn ? 'ড্যাশবোর্ড ওভারভিউ' : 'Overview Dashboard') : undefined}
              className={`w-full flex items-center rounded-xl transition-all cursor-pointer ${
                isSidebarCollapsed ? 'justify-center p-3' : 'justify-between px-4 py-3'
              } ${
                activeTab === 'overview' 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40 font-black' 
                  : 'hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4 shrink-0 text-emerald-400" />
                {!isSidebarCollapsed && <span className="animate-fade-in">{isBn ? 'ড্যাশবোর্ড ওভারভিউ' : 'Overview Dashboard'}</span>}
              </div>
              {!isSidebarCollapsed && <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />}
            </button>

            {/* Contacts Expandable Menu (Desktop) matching screenshot */}
            <div className="space-y-1">
              <button
                onClick={() => {
                  setIsContactsMenuOpen(!isContactsMenuOpen);
                  if (activeTab !== 'contacts' && activeTab !== 'suppliers' && activeTab !== 'customers') {
                    setActiveTab('customers');
                  }
                }}
                title={isSidebarCollapsed ? (isBn ? 'কন্টাক্টস' : 'Contacts') : undefined}
                className={`w-full flex items-center rounded-xl transition-all cursor-pointer ${
                  isSidebarCollapsed ? 'justify-center p-3' : 'justify-between px-4 py-2.5'
                } ${
                  (activeTab === 'contacts' || activeTab === 'suppliers' || activeTab === 'customers')
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-black' 
                    : 'hover:bg-slate-800 hover:text-slate-200 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Contact className={`w-4 h-4 shrink-0 ${(activeTab === 'contacts' || activeTab === 'suppliers' || activeTab === 'customers') ? 'text-emerald-400' : 'text-slate-400'}`} />
                  {!isSidebarCollapsed && (
                    <span className="animate-fade-in text-xs font-bold">
                      {isBn ? 'কন্টাক্টস' : 'Contacts'}
                    </span>
                  )}
                </div>
                {!isSidebarCollapsed && (
                  <ChevronDown className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ${isContactsMenuOpen ? 'rotate-180' : ''}`} />
                )}
              </button>

              {/* Submenu for Suppliers & Customers matching screenshot indentation */}
              {isContactsMenuOpen && !isSidebarCollapsed && (
                <div className="ml-5 pl-3 border-l-2 border-emerald-500/40 space-y-1 py-1 animate-fade-in text-xs font-bold">
                  <button
                    onClick={() => setActiveTab('suppliers')}
                    className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-between ${
                      activeTab === 'suppliers' 
                        ? 'text-emerald-400 bg-slate-800 font-black' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <span>{isBn ? 'সাপ্লায়ার (Suppliers)' : 'Suppliers'}</span>
                    <span className="text-[10px] text-slate-500">({suppliers.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('customers')}
                    className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-between ${
                      activeTab === 'customers' 
                        ? 'text-emerald-400 bg-slate-800 font-black' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <span>{isBn ? 'কাস্টমার (Customers)' : 'Customers'}</span>
                    <span className="text-[10px] text-slate-500">({customers.length})</span>
                  </button>
                </div>
              )}
            </div>

            {[
              { id: 'inventory', label: isBn ? '১। ইনভেন্টরি ম্যানেজমেন্ট' : '1. Inventory Control', icon: Package },
              { id: 'accounts', label: isBn ? '২। অ্যাকাউন্টস ও আয়-ব্যয়' : '2. Accounts & Finance', icon: DollarSign },
              { id: 'courier', label: isBn ? '৩। কুরিয়ার সার্ভিস ও বুকিং' : '3. Courier & Parcel Booking', icon: Truck },
              { id: 'courier-points', label: isBn ? '৪। অ্যাক্টিভ কুরিয়ার পয়েন্ট' : '4. Active Courier Points', icon: MapPin },
              { id: 'products', label: isBn ? 'পণ্য ক্যাটালগ' : 'Products & Catalog', icon: ShoppingBag },
              { id: 'orders', label: isBn ? 'অর্ডার লেজার বুক' : 'Orders Ledger', icon: ShoppingBag },
              { id: 'categories', label: isBn ? 'ক্যাটাগরি সাজানো' : 'Taxonomy Nodes', icon: Folder },
              { id: 'promotions', label: isBn ? 'প্রমোশন ও ডিসকাউন্ট' : 'Promos & Coupons', icon: Tag },
              { id: 'users', label: isBn ? 'অ্যাডমিন ও ইউজার' : 'Identity Control', icon: Users },
              { id: 'settings', label: isBn ? 'সিস্টেম সেটিংস' : 'System Settings', icon: Settings },
              { id: 'exit', label: isBn ? 'ওয়েবসাইটে ফিরে যান' : 'Go to Website', icon: Globe },
            ].map((link) => {
              const IconComp = link.icon;
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    if (link.id === 'exit') {
                      onExitAdminView?.();
                    } else {
                      setActiveTab(link.id as any);
                    }
                  }}
                  title={isSidebarCollapsed ? link.label : undefined}
                  className={`w-full flex items-center rounded-xl transition-all cursor-pointer ${
                    isSidebarCollapsed ? 'justify-center p-3' : 'justify-between px-4 py-3'
                  } ${
                    activeTab === link.id 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40 font-black' 
                      : 'hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <IconComp className={`w-4 h-4 shrink-0 ${link.id === 'exit' ? 'animate-pulse text-emerald-500' : ''}`} />
                    {!isSidebarCollapsed && <span className="animate-fade-in">{link.label}</span>}
                  </div>
                  {!isSidebarCollapsed && <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />}
                </button>
              );
            })}
          </nav>

        </div>

        {/* Footer info inside sidebar */}
        <div className={`p-5 border-t border-slate-850 text-[10px] text-slate-500 font-bold space-y-1 transition-all ${
          isSidebarCollapsed ? 'text-center' : ''
        }`}>
          {!isSidebarCollapsed ? (
            <div className="animate-fade-in">
              <p className="truncate">User: {currentUser?.email}</p>
              <p className="text-emerald-500 flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>SECURE LINK ACTIVE</span>
              </p>
            </div>
          ) : (
            <div className="flex justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Secure synchronized session host active"></span>
            </div>
          )}
        </div>
      </aside>

      {/* 3. MAIN CONTENT WORKSPACE & STICKY TOP HEADER */}
      <main className="flex-1 flex flex-col min-w-0 max-h-screen overflow-y-auto">
        
        {/* STICKY TOP HEADER */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between gap-4 shadow-xs">
          
          {/* Left: Collapsible Sidebar triggers + Welcome greeting */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:block p-2 text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer transition-all"
            >
              <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
            </button>
            
            <div className="hidden sm:block">
              <h2 className="text-slate-800 font-black text-xs sm:text-sm tracking-tight leading-none uppercase">
                {isBn ? 'স্বাগতম, অ্যাডমিন প্যানেল' : 'Welcome to Super Admin Dashboard'}
              </h2>
              <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{currentTimeStr || 'Syncing clock...'}</span>
              </p>
            </div>
          </div>

          {/* Center: Live search input */}
          <div className="flex-1 max-w-xs sm:max-w-md relative hidden sm:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isBn ? 'পণ্য, কুপন বা অর্ডার খুঁজুন...' : 'Search records (products, orders)...'}
              className="w-full text-xs pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white text-slate-700 font-semibold transition-all"
            />
          </div>

          {/* Right: Messages, Notifications, Settings, Profile */}
          <div className="flex items-center gap-2.5">
            
            {/* Live messages inquiries dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setMessagesDropdownOpen(!messagesDropdownOpen);
                  setNotificationsDropdownOpen(false);
                  setProfileDropdownOpen(false);
                }}
                className="p-2 bg-slate-100 hover:bg-slate-200/80 text-slate-600 rounded-xl cursor-pointer relative transition-all"
                title="Customer Inquiries"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="absolute top-0.5 right-0.5 bg-amber-500 w-2 h-2 rounded-full ring-2 ring-white animate-ping"></span>
              </button>
              
              {messagesDropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-72 bg-white rounded-2xl shadow-xl border border-slate-150 p-4 z-40 animate-fade-in space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-xs font-black text-slate-800">{isBn ? 'গ্রাহক অনুসন্ধান বার্তা' : 'Customer Inquiries'}</span>
                    <span className="text-[9px] bg-amber-50 text-amber-700 font-extrabold px-1.5 py-0.5 rounded">2 active</span>
                  </div>
                  <div className="space-y-2.5">
                    <div className="text-[11px] leading-tight hover:bg-slate-50 p-1.5 rounded-lg transition-colors cursor-pointer">
                      <p className="font-bold text-slate-700">Fahim Hasan</p>
                      <p className="text-slate-500 mt-0.5">Is Premium Birds Seed mix available in 10kg packages?</p>
                      <span className="text-[8px] text-slate-400 font-bold block mt-1">10 mins ago</span>
                    </div>
                    <div className="text-[11px] leading-tight hover:bg-slate-50 p-1.5 rounded-lg transition-colors cursor-pointer">
                      <p className="font-bold text-slate-700">Dr. Sajjad</p>
                      <p className="text-slate-500 mt-0.5">I completed bKash payment for order TQW-8942.</p>
                      <span className="text-[8px] text-slate-400 font-bold block mt-1">1 hour ago</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Live system alarms bell notifications dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotificationsDropdownOpen(!notificationsDropdownOpen);
                  setMessagesDropdownOpen(false);
                  setProfileDropdownOpen(false);
                }}
                className="p-2 bg-slate-100 hover:bg-slate-200/80 text-slate-600 rounded-xl cursor-pointer relative transition-all"
                title="System Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-0.5 right-0.5 bg-rose-500 w-2 h-2 rounded-full ring-2 ring-white"></span>
              </button>

              {notificationsDropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-72 bg-white rounded-2xl shadow-xl border border-slate-150 p-4 z-40 animate-fade-in space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-xs font-black text-slate-800">{isBn ? 'সিস্টেম এলার্ম নোটিফিকেশন' : 'System Notifications'}</span>
                    <span className="text-[9px] bg-rose-50 text-rose-750 font-extrabold px-1.5 py-0.5 rounded">New alerts</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2 bg-rose-50/50 rounded-xl border border-rose-100/30 flex items-start gap-2 text-[10px]">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-black text-slate-700">Low Stock Trigger</p>
                        <p className="text-slate-500 mt-0.5">Premium Seed Mix is below critical threshold.</p>
                      </div>
                    </div>
                    <div className="p-2 bg-emerald-50/30 rounded-xl border border-emerald-100/30 flex items-start gap-2 text-[10px]">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-black text-slate-700">API Sync Success</p>
                        <p className="text-slate-500 mt-0.5">Database fully synced with secure payment ledger.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Visit Website Button */}
            <button
              onClick={() => onExitAdminView?.()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60 rounded-xl transition-all font-black text-xs cursor-pointer shadow-xs"
              title={isBn ? 'ওয়েবসাইটে ফিরে যান' : 'Go to Website'}
            >
              <Globe className="w-4 h-4 animate-pulse text-emerald-600" />
              <span>{isBn ? 'ওয়েবসাইটে যান' : 'Go to Website'}</span>
            </button>

            {/* Quick settings shortcut link */}
            <button
              onClick={() => setActiveTab('settings')}
              className="p-2 bg-slate-100 hover:bg-slate-200/80 text-slate-600 rounded-xl cursor-pointer transition-all"
              title="System Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* User profile avatar and options dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setProfileDropdownOpen(!profileDropdownOpen);
                  setNotificationsDropdownOpen(false);
                  setMessagesDropdownOpen(false);
                }}
                className="flex items-center gap-1.5 p-1 hover:bg-slate-100 rounded-xl cursor-pointer transition-all"
              >
                <div className="w-7.5 h-7.5 rounded-xl bg-emerald-600 flex items-center justify-center font-black text-white text-xs border border-emerald-550 shadow-xs shrink-0">
                  {currentUser?.email ? currentUser.email[0].toUpperCase() : 'A'}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-[11px] font-extrabold text-slate-700 leading-none">
                    {currentUser?.email ? currentUser.email.split('@')[0] : 'Admin'}
                  </p>
                  <span className="text-[8px] text-emerald-600 font-extrabold uppercase mt-0.5 block tracking-wider">
                    {currentUser?.role || 'Super Admin'}
                  </span>
                </div>
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-48 bg-white rounded-2xl shadow-xl border border-slate-150 p-2.5 z-40 animate-fade-in space-y-1">
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400">{isBn ? 'লগইন অ্যাকাউন্ট' : 'Active Account'}</p>
                    <p className="text-xs font-extrabold text-slate-700 truncate mt-0.5">{currentUser?.email}</p>
                  </div>
                  <button
                    onClick={async () => {
                      setLoading(true);
                      await onRefreshSync();
                      await loadDashboardData();
                      setLoading(false);
                      setProfileDropdownOpen(false);
                      setSuccessMsg('Database logs re-synced.');
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-emerald-600 rounded-xl transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>{isBn ? 'রি-সিঙ্ক ডেটা' : 'Re-sync Data'}</span>
                  </button>
                  <button
                    onClick={async () => {
                      setProfileDropdownOpen(false);
                      if (onLogout) {
                        await onLogout();
                      } else {
                        window.location.reload();
                      }
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{isBn ? 'লগ আউট' : 'Log Out'}</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* FEEDBACK POPUPS */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-xs font-bold text-red-700 animate-fade-in">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg('')} className="text-red-500 hover:text-red-700 font-black text-sm">×</button>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs font-bold text-emerald-700 animate-fade-in">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700 font-black text-sm">×</button>
          </div>
        )}

        {/* INNER VIEWPORTS */}
        <div className="p-6 space-y-6 flex-1 max-w-7xl w-full mx-auto pb-12">
          
          {activeTab === 'overview' && (
            <DashboardOverview 
              orders={orders}
              products={products}
              users={usersList}
              coupons={coupons}
              reviews={products.flatMap(p => p.reviews || [])}
              lang={lang}
              onQuickAction={(tab: any) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'products' && (
            <ProductManagement 
              products={products}
              categories={categories}
              brands={[]}
              onAddProduct={onAddProduct}
              onUpdateProduct={onUpdateProduct}
              onDeleteProduct={onDeleteProduct}
              onDuplicateProduct={onDuplicateProduct}
              lang={lang}
            />
          )}

          {activeTab === 'categories' && (
            <CategoryManagement 
              categories={categories}
              onAddCategory={handleAddCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
              lang={lang}
            />
          )}

          {activeTab === 'orders' && (
            <OrderManagement 
              orders={orders}
              onUpdateOrderStatus={async (oId, status, paymentStatus) => {
                await onUpdateOrderStatus(oId, status, paymentStatus);
                // Also post payment status updates if modified
                if (paymentStatus) {
                  await fetch('/api/admin/update-user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-user-email': currentUser?.email || '' },
                    body: JSON.stringify({ id: oId, paymentStatus })
                  });
                }
                await loadDashboardData();
              }}
              onDeleteOrder={async (oId) => {
                if (onDeleteOrder) {
                  await onDeleteOrder(oId);
                  await loadDashboardData();
                  setSuccessMsg('Order history deleted successfully.');
                }
              }}
              lang={lang}
            />
          )}

          {activeTab === 'promotions' && (
            <PromotionAndSales 
              coupons={coupons}
              banners={banners}
              flashSales={flashSales}
              products={products}
              onAddCoupon={handleAddCoupon}
              onDeleteCoupon={handleDeleteCoupon}
              onAddBanner={handleAddBanner}
              onDeleteBanner={handleDeleteBanner}
              onAddFlashSale={handleAddFlashSale}
              onDeleteFlashSale={handleDeleteFlashSale}
              lang={lang}
            />
          )}

          {activeTab === 'users' && (
            <StaffAndCustomers 
              users={usersList}
              orders={orders}
              onAddUser={handleAddUser}
              onUpdateUserRole={handleUpdateUserRole}
              onToggleUserStatus={handleToggleUserStatus}
              onDeleteUser={handleDeleteUser}
              lang={lang}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryManagement 
              products={products}
              inventoryLogs={inventoryLogs}
              suppliers={suppliers}
              purchases={purchases}
              damages={damages}
              onAdjustStock={handleAdjustStock}
              onAddPurchase={handleAddPurchase}
              onAddDamage={handleAddDamage}
              onDeleteDamage={handleDeleteDamage}
              currentUserEmail={currentUser?.email}
              lang={lang}
            />
          )}

          {activeTab === 'accounts' && (
            <AccountsManagement 
              expenses={expenses}
              suppliers={suppliers}
              transactions={transactions}
              orders={orders}
              damages={damages}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
              onPaySupplier={handlePaySupplier}
              onAddTransaction={handleAddTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              currentUserEmail={currentUser?.email}
              lang={lang}
            />
          )}

          {(activeTab === 'contacts' || activeTab === 'suppliers' || activeTab === 'customers') && (
            <ContactsManagement 
              initialType={activeTab === 'suppliers' ? 'suppliers' : 'customers'}
              customers={customers}
              suppliers={suppliers}
              onAddCustomer={handleAddCustomer}
              onUpdateCustomer={handleUpdateCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              onToggleCustomerStatus={handleToggleCustomerStatus}
              onPayCustomerDue={handlePayCustomerDue}
              onAddSupplier={handleAddSupplier}
              onUpdateSupplier={handleUpdateSupplier}
              onDeleteSupplier={handleDeleteSupplier}
              onToggleSupplierStatus={handleToggleSupplierStatus}
              onPaySupplier={handlePaySupplier}
              lang={lang}
            />
          )}

          {activeTab === 'courier' && (
            <CourierManagement 
              orders={orders}
              onUpdateOrderStatus={async (oId, status, paymentStatus) => {
                await onUpdateOrderStatus(oId, status, paymentStatus);
                await loadDashboardData();
              }}
              currentUserEmail={currentUser?.email}
              lang={lang}
            />
          )}

          {activeTab === 'courier-points' && (
            <CourierPointManagement lang={lang} />
          )}

          {activeTab === 'settings' && (
            <NotificationAndSettings 
              notifications={[]}
              activityLogs={activityLogs}
              settings={storeSettings}
              orders={orders}
              products={products}
              onSendNotification={handleSendNotification}
              onUpdateSettings={handleUpdateSettings}
              lang={lang}
            />
          )}

        </div>

      </main>
    </div>
  );
}
