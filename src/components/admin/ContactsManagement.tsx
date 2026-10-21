import React, { useState, useMemo } from 'react';
import {
  Contact,
  Users,
  Building2,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  Power,
  FileText,
  ArrowUpRight,
  Download,
  Printer,
  FileSpreadsheet,
  SlidersHorizontal,
  Plus,
  Search,
  X,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  ChevronDown,
  Calendar,
  AlertCircle,
  FileDown
} from 'lucide-react';
import { Customer, Supplier } from '../../types';

interface ContactsManagementProps {
  initialType?: 'suppliers' | 'customers';
  customers: Customer[];
  suppliers: Supplier[];
  onAddCustomer: (c: any) => Promise<void>;
  onUpdateCustomer: (c: any) => Promise<void>;
  onDeleteCustomer: (id: string) => Promise<void>;
  onToggleCustomerStatus: (id: string) => Promise<void>;
  onPayCustomerDue: (customerId: string, amount: number, paymentMethod: string, notes: string) => Promise<void>;
  onAddSupplier: (s: any) => Promise<void>;
  onUpdateSupplier: (s: any) => Promise<void>;
  onDeleteSupplier: (id: string) => Promise<void>;
  onToggleSupplierStatus: (id: string) => Promise<void>;
  onPaySupplier: (supplierId: string, amount: number, paymentMethod: string, notes: string) => Promise<void>;
  lang: 'en' | 'bn';
}

export default function ContactsManagement({
  initialType = 'customers',
  customers = [],
  suppliers = [],
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onToggleCustomerStatus,
  onPayCustomerDue,
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  onToggleSupplierStatus,
  onPaySupplier,
  lang
}: ContactsManagementProps) {
  const isBn = lang === 'bn';
  const [activeType, setActiveType] = useState<'customers' | 'suppliers'>(initialType);

  // Table controls & pagination
  const [entriesPerPage, setEntriesPerPage] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Active Dropdown Action Menu
  const [openActionId, setOpenActionId] = useState<string | null>(null);

  // Column Visibility State
  const [showColVisibility, setShowColVisibility] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<{ [key: string]: boolean }>({
    action: true,
    contactId: true,
    businessName: true,
    name: true,
    creditLimit: true,
    openingBalance: true,
    advanceBalance: true,
    addedOn: true,
    address: true,
    mobile: true,
    totalDue: true,
    totalReturnDue: true
  });

  // Modal states
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingContact, setEditingContact] = useState<any | null>(null);

  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any | null>(null);

  const [showPayModal, setShowPayModal] = useState(false);
  const [payTargetContact, setPayTargetContact] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState<string>('');
  const [payMethod, setPayMethod] = useState<string>('Cash');
  const [payNotes, setPayNotes] = useState<string>('');
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);

  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [ledgerContact, setLedgerContact] = useState<any | null>(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    contactId: '',
    businessName: '',
    name: '',
    mobile: '',
    alternateContact: '',
    email: '',
    address: '',
    district: '',
    creditLimit: 'No Limit',
    openingBalance: 0,
    advanceBalance: 0,
    addedOn: new Date().toLocaleDateString('en-GB'),
    totalDue: 0,
    totalReturnDue: 0,
    status: 'Active',
    notes: ''
  });

  // Toggle column visibility
  const toggleColumn = (col: string) => {
    setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  // Switch between customers and suppliers
  const handleTypeSwitch = (type: 'customers' | 'suppliers') => {
    setActiveType(type);
    setCurrentPage(1);
    setSearchTerm('');
    setOpenActionId(null);
  };

  // Filtered dataset
  const rawList = activeType === 'customers' ? customers : suppliers;

  const filteredList = useMemo(() => {
    let list = rawList.map((item: any, idx) => {
      const contactId = item.contactId || (activeType === 'customers' ? `CO${String(idx + 211).padStart(5, '0')}` : `SU${String(idx + 1).padStart(4, '0')}`);
      const businessName = item.businessName || item.companyName || item.name;
      const mobile = item.mobile || item.phone || '';
      const totalDue = activeType === 'customers' 
        ? (Number(item.totalSaleDue) || Number(item.dueBalance) || 0)
        : (Number(item.totalPurchaseDue) || Number(item.dueBalance) || 0);
      const totalReturnDue = activeType === 'customers' 
        ? (Number(item.totalSellReturnDue) || 0)
        : (Number(item.totalPurchaseReturnDue) || 0);

      return {
        ...item,
        contactId,
        businessName,
        mobile,
        totalDue,
        totalReturnDue,
        creditLimit: item.creditLimit || 'No Limit',
        openingBalance: Number(item.openingBalance) || 0,
        advanceBalance: Number(item.advanceBalance) || 0,
        addedOn: item.addedOn || (item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : '15-10-2026'),
        address: item.address || 'KASHIMPUR, GAZIPUR, Bangladesh',
        status: item.status || 'Active'
      };
    });

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((item: any) => 
        item.contactId.toLowerCase().includes(q) ||
        item.businessName.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.mobile.includes(q) ||
        item.address.toLowerCase().includes(q)
      );
    }

    return list;
  }, [rawList, activeType, searchTerm]);

  // Paginated List
  const totalEntries = filteredList.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const paginatedList = filteredList.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingContact(null);
    const nextIdNumber = activeType === 'customers' ? customers.length + 211 : suppliers.length + 1;
    const prefix = activeType === 'customers' ? 'CO' : 'SU';
    const genId = `${prefix}${String(nextIdNumber).padStart(activeType === 'customers' ? 5 : 4, '0')}`;

    setFormData({
      contactId: genId,
      businessName: '',
      name: '',
      mobile: '880',
      alternateContact: '',
      email: '',
      address: '',
      district: 'Gazipur',
      creditLimit: 'No Limit',
      openingBalance: 0,
      advanceBalance: 0,
      addedOn: new Date().toLocaleDateString('en-GB'),
      totalDue: 0,
      totalReturnDue: 0,
      status: 'Active',
      notes: ''
    });
    setShowAddEditModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (contact: any) => {
    setEditingContact(contact);
    setFormData({
      contactId: contact.contactId || '',
      businessName: contact.businessName || '',
      name: contact.name || '',
      mobile: contact.mobile || contact.phone || '',
      alternateContact: contact.alternateContact || '',
      email: contact.email || '',
      address: contact.address || '',
      district: contact.district || 'Gazipur',
      creditLimit: contact.creditLimit !== undefined ? contact.creditLimit : 'No Limit',
      openingBalance: Number(contact.openingBalance) || 0,
      advanceBalance: Number(contact.advanceBalance) || 0,
      addedOn: contact.addedOn || new Date().toLocaleDateString('en-GB'),
      totalDue: Number(contact.totalDue) || 0,
      totalReturnDue: Number(contact.totalReturnDue) || 0,
      status: contact.status || 'Active',
      notes: contact.notes || ''
    });
    setOpenActionId(null);
    setShowAddEditModal(true);
  };

  // Save Contact (Add or Update)
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.mobile.trim()) {
      alert(isBn ? 'অনুগ্রহ করে নাম এবং মোবাইল নম্বর দিন।' : 'Name and Mobile number are required.');
      return;
    }

    if (activeType === 'customers') {
      const payload = {
        id: editingContact ? editingContact.id : undefined,
        contactId: formData.contactId,
        businessName: formData.businessName || formData.name,
        name: formData.name,
        mobile: formData.mobile,
        alternateContact: formData.alternateContact,
        email: formData.email,
        address: formData.address,
        creditLimit: formData.creditLimit,
        openingBalance: Number(formData.openingBalance),
        advanceBalance: Number(formData.advanceBalance),
        addedOn: formData.addedOn,
        totalSaleDue: Number(formData.totalDue),
        totalSellReturnDue: Number(formData.totalReturnDue),
        status: formData.status,
        notes: formData.notes
      };

      if (editingContact) {
        await onUpdateCustomer(payload);
      } else {
        await onAddCustomer(payload);
      }
    } else {
      const payload = {
        id: editingContact ? editingContact.id : undefined,
        contactId: formData.contactId,
        companyName: formData.businessName || formData.name,
        businessName: formData.businessName || formData.name,
        name: formData.name,
        phone: formData.mobile,
        mobile: formData.mobile,
        email: formData.email,
        address: formData.address,
        creditLimit: formData.creditLimit,
        openingBalance: Number(formData.openingBalance),
        advanceBalance: Number(formData.advanceBalance),
        addedOn: formData.addedOn,
        totalPurchaseDue: Number(formData.totalDue),
        dueBalance: Number(formData.totalDue),
        totalPurchaseReturnDue: Number(formData.totalReturnDue),
        status: formData.status,
        notes: formData.notes
      };

      if (editingContact) {
        await onUpdateSupplier(payload);
      } else {
        await onAddSupplier(payload);
      }
    }

    setShowAddEditModal(false);
  };

  // Open Payment Modal
  const handleOpenPayModal = (contact: any) => {
    setPayTargetContact(contact);
    setPayAmount(String(contact.totalDue || ''));
    setPayMethod('Cash');
    setPayNotes('');
    setOpenActionId(null);
    setShowPayModal(true);
  };

  // Submit Payment
  const handleSubmitPay = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(payAmount);
    if (!payTargetContact || isNaN(amt) || amt <= 0) {
      alert(isBn ? 'সঠিক টাকার পরিমাণ দিন।' : 'Enter a valid amount.');
      return;
    }

    setIsSubmittingPay(true);
    try {
      if (activeType === 'customers') {
        await onPayCustomerDue(payTargetContact.id, amt, payMethod, payNotes);
      } else {
        await onPaySupplier(payTargetContact.id, amt, payMethod, payNotes);
      }
      setShowPayModal(false);
    } catch (err: any) {
      alert(err.message || 'Payment operation failed');
    } finally {
      setIsSubmittingPay(false);
    }
  };

  // Toggle Active/Deactivate Status
  const handleToggleStatus = async (contact: any) => {
    setOpenActionId(null);
    if (activeType === 'customers') {
      await onToggleCustomerStatus(contact.id);
    } else {
      await onToggleSupplierStatus(contact.id);
    }
  };

  // Delete Contact
  const handleDelete = async (contact: any) => {
    setOpenActionId(null);
    const confirmed = window.confirm(
      isBn 
        ? `আপনি কি নিশ্চিতভাবে '${contact.businessName || contact.name}' (${contact.contactId}) মুছে ফেলতে চান?` 
        : `Are you sure you want to delete '${contact.businessName || contact.name}' (${contact.contactId})?`
    );
    if (confirmed) {
      if (activeType === 'customers') {
        await onDeleteCustomer(contact.id);
      } else {
        await onDeleteSupplier(contact.id);
      }
    }
  };

  // View Modal
  const handleView = (contact: any) => {
    setSelectedContact(contact);
    setOpenActionId(null);
    setShowViewModal(true);
  };

  // Ledger Modal
  const handleLedger = (contact: any) => {
    setLedgerContact(contact);
    setOpenActionId(null);
    setShowLedgerModal(true);
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = [
      'Contact ID',
      'Business Name',
      'Name',
      'Credit Limit',
      'Opening Balance',
      'Advance Balance',
      'Added On',
      'Address',
      'Mobile',
      activeType === 'customers' ? 'Total Sale Due' : 'Total Purchase Due',
      activeType === 'customers' ? 'Total Sell Return Due' : 'Total Purchase Return Due',
      'Status'
    ];

    const rows = filteredList.map(c => [
      `"${c.contactId}"`,
      `"${c.businessName}"`,
      `"${c.name}"`,
      `"${c.creditLimit}"`,
      c.openingBalance,
      c.advanceBalance,
      `"${c.addedOn}"`,
      `"${c.address.replace(/"/g, '""')}"`,
      `"${c.mobile}"`,
      c.totalDue,
      c.totalReturnDue,
      `"${c.status}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeType}_contacts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Table Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5 animate-fade-in text-slate-850" id="contacts-management-view">
      
      {/* 1. Header Bar with Tabs and Add Contact Button */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-700 flex items-center justify-center font-black border border-emerald-500/30 shrink-0">
            <Contact className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-slate-900">
                {isBn ? 'কন্টাক্ট ডিরেক্টরি ও হিসাব' : 'Contacts Directory'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                {activeType === 'customers' ? (isBn ? 'গ্রাহক' : 'Customers') : (isBn ? 'সরবরাহকারী' : 'Suppliers')} ({totalEntries})
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isBn 
                ? 'সাপ্লায়ার ও কাস্টমারদের সম্পূর্ণ তথ্য, বাকি খাতা, অগ্রিম ব্যালেন্স ও লেজার স্টেটমেন্ট।' 
                : 'Manage suppliers and customer profiles, due balances, credits and financial ledgers.'}
            </p>
          </div>
        </div>

        {/* Tab switcher & Primary Add Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center border border-slate-200/80">
            <button
              onClick={() => handleTypeSwitch('customers')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeType === 'customers' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{isBn ? 'গ্রাহক (Customers)' : 'Customers'}</span>
            </button>
            <button
              onClick={() => handleTypeSwitch('suppliers')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeType === 'suppliers' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{isBn ? 'সরবরাহকারী (Suppliers)' : 'Suppliers'}</span>
            </button>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-950/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>
              {activeType === 'customers' 
                ? (isBn ? '+ নতুন কাস্টমার যুক্ত করুন' : '+ Add Customer')
                : (isBn ? '+ নতুন সাপ্লায়ার যুক্ত করুন' : '+ Add Supplier')}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Data Table Card Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Top Controls Toolbar matching screenshot: Show 25 entries, Export CSV, Export Excel, Print, Column visibility, Export PDF */}
        <div className="p-4 sm:p-5 border-b border-slate-150 flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Entries dropdown */}
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 w-full lg:w-auto">
            <span>Show</span>
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-black text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries</span>
          </div>

          {/* Action buttons matching screenshot */}
          <div className="flex items-center gap-1.5 flex-wrap justify-start lg:justify-end w-full lg:w-auto">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Export CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Export Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Print Table"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print</span>
            </button>

            {/* Column visibility dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowColVisibility(!showColVisibility)}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Column visibility"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                <span>Column visibility</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showColVisibility && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-fade-in space-y-1.5 text-left text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 font-black text-slate-800">
                    <span>{isBn ? 'কলাম দৃশ্যমানতা' : 'Toggle Columns'}</span>
                    <button onClick={() => setShowColVisibility(false)} className="text-slate-400 hover:text-slate-700">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                    {[
                      { id: 'contactId', label: 'Contact ID' },
                      { id: 'businessName', label: 'Business Name' },
                      { id: 'name', label: 'Name' },
                      { id: 'creditLimit', label: 'Credit Limit' },
                      { id: 'openingBalance', label: 'Opening Balance' },
                      { id: 'advanceBalance', label: 'Advance Balance' },
                      { id: 'addedOn', label: 'Added On' },
                      { id: 'address', label: 'Address' },
                      { id: 'mobile', label: 'Mobile' },
                      { id: 'totalDue', label: activeType === 'customers' ? 'Total Sale Due' : 'Total Purchase Due' },
                      { id: 'totalReturnDue', label: activeType === 'customers' ? 'Total Sell Return Due' : 'Total Return Due' }
                    ].map(col => (
                      <label key={col.id} className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded-lg cursor-pointer font-bold text-slate-700">
                        <input
                          type="checkbox"
                          checked={visibleColumns[col.id]}
                          onChange={() => toggleColumn(col.id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="truncate">{col.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Export PDF"
            >
              <FileDown className="w-3.5 h-3.5 text-rose-600" />
              <span>Export PDF</span>
            </button>

            {/* Search Input Box */}
            <div className="relative ml-2 w-full sm:w-auto">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={isBn ? 'নাম, আইডি, মোবাইল সার্চ করুন...' : 'Search contacts...'}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all w-full sm:w-56"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

          </div>

        </div>

        {/* 3. Main Data Table matching screenshot */}
        <div className="overflow-x-auto min-h-[350px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-700 border-b border-slate-200 font-black tracking-tight select-none">
                {visibleColumns.action && (
                  <th className="py-3 px-3 w-24 whitespace-nowrap">Action</th>
                )}
                {visibleColumns.contactId && (
                  <th className="py-3 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span>Contact ID</span>
                      <span className="text-[10px] text-slate-400">⇅</span>
                    </div>
                  </th>
                )}
                {visibleColumns.businessName && (
                  <th className="py-3 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span>Business Name</span>
                      <span className="text-[10px] text-slate-400">⇅</span>
                    </div>
                  </th>
                )}
                {visibleColumns.name && (
                  <th className="py-3 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span>Name</span>
                      <span className="text-[10px] text-slate-400">⇅</span>
                    </div>
                  </th>
                )}
                {visibleColumns.creditLimit && (
                  <th className="py-3 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span>Credit Limit</span>
                      <span className="text-[10px] text-slate-400">⇅</span>
                    </div>
                  </th>
                )}
                {visibleColumns.openingBalance && (
                  <th className="py-3 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span>Opening Balance</span>
                      <span className="text-[10px] text-slate-400">⇅</span>
                    </div>
                  </th>
                )}
                {visibleColumns.advanceBalance && (
                  <th className="py-3 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span>Advance Balance</span>
                      <span className="text-[10px] text-slate-400">⇅</span>
                    </div>
                  </th>
                )}
                {visibleColumns.addedOn && (
                  <th className="py-3 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span>Added On</span>
                      <span className="text-[10px] text-slate-400">⇅</span>
                    </div>
                  </th>
                )}
                {visibleColumns.address && (
                  <th className="py-3 px-3 whitespace-nowrap min-w-[200px]">Address</th>
                )}
                {visibleColumns.mobile && (
                  <th className="py-3 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span>Mobile</span>
                      <span className="text-[10px] text-slate-400">⇅</span>
                    </div>
                  </th>
                )}
                {visibleColumns.totalDue && (
                  <th className="py-3 px-3 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span>{activeType === 'customers' ? 'Total Sale Due' : 'Total Purchase Due'}</span>
                      <span className="text-[10px] text-slate-400">⇅</span>
                    </div>
                  </th>
                )}
                {visibleColumns.totalReturnDue && (
                  <th className="py-3 px-3 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span>{activeType === 'customers' ? 'Total Sell Return Due' : 'Total Return Due'}</span>
                      <span className="text-[10px] text-slate-400">⇅</span>
                    </div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 font-semibold text-slate-700">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400 text-xs font-bold">
                    {searchTerm 
                      ? (isBn ? 'কোনো কন্টাক্ট পাওয়া যায়নি।' : 'No contacts matching your search query.') 
                      : (isBn ? 'এই তালিকায় কোনো রেকর্ড নেই। উপরে "+ নতুন" বাটনে ক্লিক করে যুক্ত করুন।' : 'No contact entries yet. Click "+ Add Contact" to register.')}
                  </td>
                </tr>
              ) : (
                paginatedList.map((contact) => (
                  <tr 
                    key={contact.id} 
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    
                    {/* 1. Action Dropdown Button matching screenshot */}
                    {visibleColumns.action && (
                      <td className="py-3 px-3 relative">
                        <button
                          onClick={() => setOpenActionId(openActionId === contact.id ? null : contact.id)}
                          className="px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-lg text-xs font-bold border border-cyan-300/80 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        >
                          <span>Actions</span>
                          <ChevronDown className="w-3 h-3 text-cyan-600" />
                        </button>

                        {/* Dropdown Menu matching screenshot with icons: Pay, View, Edit, Delete, Deactivate, Ledger, Sales */}
                        {openActionId === contact.id && (
                          <div 
                            className="absolute left-3 top-10 w-44 bg-white rounded-2xl shadow-2xl border border-slate-200 p-1.5 z-40 animate-fade-in space-y-0.5 text-left text-xs font-bold"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => handleOpenPayModal(contact)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                            >
                              <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Pay</span>
                            </button>

                            <button
                              onClick={() => handleView(contact)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              <span>View</span>
                            </button>

                            <button
                              onClick={() => handleOpenEditModal(contact)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-blue-700 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5 text-blue-600" />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => handleDelete(contact)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              <span>Delete</span>
                            </button>

                            <button
                              onClick={() => handleToggleStatus(contact)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-amber-700 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                            >
                              <Power className="w-3.5 h-3.5 text-amber-600" />
                              <span>{contact.status === 'Active' ? 'Deactivate' : 'Activate'}</span>
                            </button>

                            <div className="my-1 border-t border-slate-100"></div>

                            <button
                              onClick={() => handleLedger(contact)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-purple-700 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5 text-purple-600" />
                              <span>Ledger</span>
                            </button>

                            <button
                              onClick={() => handleView(contact)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{activeType === 'customers' ? 'Sales' : 'Purchases'}</span>
                            </button>
                          </div>
                        )}
                      </td>
                    )}

                    {/* 2. Contact ID */}
                    {visibleColumns.contactId && (
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {contact.contactId}
                      </td>
                    )}

                    {/* 3. Business Name */}
                    {visibleColumns.businessName && (
                      <td className="py-3 px-3 font-black text-slate-900 uppercase whitespace-nowrap">
                        {contact.businessName}
                      </td>
                    )}

                    {/* 4. Name */}
                    {visibleColumns.name && (
                      <td className="py-3 px-3 font-bold text-slate-800 uppercase whitespace-nowrap">
                        {contact.name}
                      </td>
                    )}

                    {/* 5. Credit Limit */}
                    {visibleColumns.creditLimit && (
                      <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                        {contact.creditLimit === 'No Limit' ? 'No Limit' : `${contact.creditLimit} ৳`}
                      </td>
                    )}

                    {/* 6. Opening Balance */}
                    {visibleColumns.openingBalance && (
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-600">
                        {Number(contact.openingBalance).toFixed(2)} ৳
                      </td>
                    )}

                    {/* 7. Advance Balance */}
                    {visibleColumns.advanceBalance && (
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-600">
                        {Number(contact.advanceBalance).toFixed(2)} ৳
                      </td>
                    )}

                    {/* 8. Added On */}
                    {visibleColumns.addedOn && (
                      <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                        {contact.addedOn}
                      </td>
                    )}

                    {/* 9. Address */}
                    {visibleColumns.address && (
                      <td className="py-3 px-3 uppercase text-[11px] text-slate-600 max-w-xs truncate" title={contact.address}>
                        {contact.address}
                      </td>
                    )}

                    {/* 10. Mobile */}
                    {visibleColumns.mobile && (
                      <td className="py-3 px-3 font-mono text-slate-800 whitespace-nowrap">
                        {contact.mobile}
                      </td>
                    )}

                    {/* 11. Total Sale Due / Total Purchase Due */}
                    {visibleColumns.totalDue && (
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        <span className={contact.totalDue > 0 ? 'text-rose-600 font-black' : 'text-slate-600'}>
                          {Number(contact.totalDue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ৳
                        </span>
                      </td>
                    )}

                    {/* 12. Total Return Due */}
                    {visibleColumns.totalReturnDue && (
                      <td className="py-3 px-3 text-right font-mono text-slate-600 whitespace-nowrap">
                        {Number(contact.totalReturnDue).toFixed(2)} ৳
                      </td>
                    )}

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Table Pagination Footer */}
        <div className="p-4 border-t border-slate-150 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-bold">
          <div>
            Showing {totalEntries === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1} to {Math.min(currentPage * entriesPerPage, totalEntries)} of {totalEntries} entries
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed font-bold"
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg font-bold cursor-pointer transition-colors ${
                  currentPage === page 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed font-bold"
            >
              Next
            </button>
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* MODAL 1: ADD / EDIT CONTACT MODAL                        */}
      {/* ======================================================== */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto text-left space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                  <Contact className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    {editingContact 
                      ? (isBn ? 'কন্টাক্ট তথ্য সংশোধন করুন' : 'Edit Contact Details') 
                      : (isBn ? `নতুন ${activeType === 'customers' ? 'কাস্টমার' : 'সাপ্লায়ার'} যুক্ত করুন` : `Add New ${activeType === 'customers' ? 'Customer' : 'Supplier'}`)}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-bold">
                    {isBn ? 'ব্যবসায়িক নাম, মোবাইল নম্বর এবং ব্যালেন্স প্রদান করুন।' : 'Fill out business identity, contact and ledger balances.'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddEditModal(false)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="space-y-4 text-xs font-bold text-slate-700">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Contact ID */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                    Contact ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contactId}
                    onChange={(e) => setFormData({ ...formData, contactId: e.target.value.trim() })}
                    placeholder="e.g. CO0211"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                {/* Business Name */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                    {isBn ? 'ব্যবসার নাম (Business Name) *' : 'Business Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="e.g. YEASIN ELECTRIC KAJIMARKET"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                {/* Contact Person Name */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                    {isBn ? 'প্রোপাইটর / ব্যক্তির নাম *' : 'Contact Person Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. MD YEASIN"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                {/* Mobile Phone */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                    {isBn ? 'মোবাইল নম্বর (Mobile) *' : 'Mobile Phone Number *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="8801736573733"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                {/* Alternate Contact / Phone */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                    {isBn ? 'বিকল্প ফোন (Optional)' : 'Alternate Contact'}
                  </label>
                  <input
                    type="text"
                    value={formData.alternateContact}
                    onChange={(e) => setFormData({ ...formData, alternateContact: e.target.value })}
                    placeholder="017xxxxxxxx"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                    {isBn ? 'ইমেইল অ্যাড্রেস' : 'Email Address'}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@business.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

              </div>

              {/* Address details */}
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                  {isBn ? 'পূর্ণাঙ্গ ঠিকানা (Address) *' : 'Full Address *'}
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="KAJIMARKET, KASHIMPUR ROAD, GAZIPUR, Bangladesh, 1346"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 focus:bg-white resize-none"
                />
              </div>

              {/* Financial Balances Section */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isBn ? 'হিসাব ও ব্যালেন্স তথ্য (Ledger Configuration)' : 'Financial Balance & Credit Limits'}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                      Credit Limit
                    </label>
                    <input
                      type="text"
                      value={formData.creditLimit}
                      onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                      placeholder="No Limit or 25000"
                      className="w-full p-2 bg-white border border-slate-250 rounded-xl text-xs font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                      Opening Balance (৳)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.openingBalance}
                      onChange={(e) => setFormData({ ...formData, openingBalance: Number(e.target.value) })}
                      placeholder="0.00"
                      className="w-full p-2 bg-white border border-slate-250 rounded-xl text-xs font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                      Advance Balance (৳)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.advanceBalance}
                      onChange={(e) => setFormData({ ...formData, advanceBalance: Number(e.target.value) })}
                      placeholder="0.00"
                      className="w-full p-2 bg-white border border-slate-250 rounded-xl text-xs font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                      {activeType === 'customers' ? 'Total Sale Due (বর্তমান বকেয়া)' : 'Total Purchase Due (পাওনা)'}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.totalDue}
                      onChange={(e) => setFormData({ ...formData, totalDue: Number(e.target.value) })}
                      placeholder="0.00"
                      className="w-full p-2 bg-white border border-slate-250 rounded-xl text-xs font-mono font-bold text-rose-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-250 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                  {isBn ? 'মন্তব্য বা স্পেশাল নোট' : 'Notes'}
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Regular buyer in Kajimarket"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black shadow-md shadow-emerald-950/20 cursor-pointer transition-colors"
                >
                  {editingContact ? (isBn ? 'সংরক্ষণ করুন' : 'Update Contact') : (isBn ? 'যোগ করুন' : 'Save Contact')}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: PAY / RECEIVE PAYMENT MODAL                     */}
      {/* ======================================================== */}
      {showPayModal && payTargetContact && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-left space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">
                    {activeType === 'customers' ? (isBn ? 'বকেয়া টাকা আদায় (Receive Due)' : 'Receive Customer Due') : (isBn ? 'সাপ্লায়ার পেমেন্ট (Pay Supplier)' : 'Pay Supplier Due')}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold">{payTargetContact.businessName}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPayModal(false)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs font-bold">
              <span className="text-slate-500">
                {activeType === 'customers' ? 'বর্তমান বাকি (Current Due):' : 'মোট প্রদেয় বকেয়া:'}
              </span>
              <span className="text-base font-black text-rose-600 font-mono">
                ৳{Number(payTargetContact.totalDue || 0).toLocaleString()}
              </span>
            </div>

            <form onSubmit={handleSubmitPay} className="space-y-3.5 text-xs font-bold text-slate-700">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                  {isBn ? 'পরিশোধের পরিমাণ (টাকা) *' : 'Payment Amount (BDT) *'}
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-base font-black text-emerald-700 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                  Payment Method
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="Cash">Cash (ক্যাশ টাকা)</option>
                  <option value="bKash">bKash (বিকাশ)</option>
                  <option value="Nagad">Nagad (নগদ)</option>
                  <option value="Rocket">Rocket (রকেট)</option>
                  <option value="Bank">Bank Deposit (ব্যাংক ট্রান্সফার)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-500 mb-1">
                  {isBn ? 'লেনদেন রেফারেন্স বা নোট' : 'Txn Reference / Notes'}
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="e.g. Receipt #1042 / Counter Cash Collection"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPay}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black shadow-md shadow-emerald-950/20 cursor-pointer transition-colors disabled:opacity-50"
                >
                  {isSubmittingPay ? (isBn ? 'প্রক্রিয়াকরণ হচ্ছে...' : 'Processing...') : (isBn ? 'পেমেন্ট সম্পন্ন করুন' : 'Confirm Payment')}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: VIEW CONTACT PROFILE                            */}
      {/* ======================================================== */}
      {showViewModal && selectedContact && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 text-left space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                  {selectedContact.businessName ? selectedContact.businessName[0].toUpperCase() : 'C'}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base uppercase">{selectedContact.businessName}</h3>
                  <p className="text-xs text-slate-500 font-bold">{selectedContact.name} • {selectedContact.contactId}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowViewModal(false)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Stat Cards */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-rose-50/70 border border-rose-200/80 rounded-2xl">
                <p className="text-[10px] font-black uppercase text-rose-600">
                  {activeType === 'customers' ? 'Total Sale Due' : 'Total Purchase Due'}
                </p>
                <p className="text-lg font-black text-rose-700 font-mono mt-0.5">
                  ৳{Number(selectedContact.totalDue || 0).toLocaleString()}
                </p>
              </div>

              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
                <p className="text-[10px] font-black uppercase text-emerald-700">Credit Limit</p>
                <p className="text-base font-black text-emerald-800 font-mono mt-0.5">
                  {selectedContact.creditLimit === 'No Limit' ? 'No Limit' : `৳${selectedContact.creditLimit}`}
                </p>
              </div>
            </div>

            {/* Contact Details List */}
            <div className="space-y-2.5 text-xs font-bold text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block font-black">Mobile</span>
                  <span className="font-mono">{selectedContact.mobile}</span>
                  {selectedContact.alternateContact && <span className="font-mono text-slate-500 ml-2">/ {selectedContact.alternateContact}</span>}
                </div>
              </div>

              {selectedContact.email && (
                <div className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-black">Email</span>
                    <span>{selectedContact.email}</span>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block font-black">Address</span>
                  <span className="uppercase text-[11px] leading-relaxed">{selectedContact.address}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block font-black">Added On</span>
                  <span>{selectedContact.addedOn}</span>
                </div>
              </div>

              {selectedContact.notes && (
                <div className="pt-2 border-t border-slate-200 text-slate-500 italic">
                  Note: {selectedContact.notes}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleOpenPayModal(selectedContact);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-sm cursor-pointer"
              >
                {activeType === 'customers' ? 'Receive Due Payment' : 'Pay Supplier'}
              </button>

              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleOpenEditModal(selectedContact);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Edit Contact
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: CONTACT STATEMENT / LEDGER                      */}
      {/* ======================================================== */}
      {showLedgerModal && ledgerContact && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 text-left space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-black">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">
                    {isBn ? 'কন্টাক্ট লেজার খতিয়ান' : 'Contact Financial Ledger Statement'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-bold">{ledgerContact.businessName} ({ledgerContact.contactId})</p>
                </div>
              </div>
              <button 
                onClick={() => setShowLedgerModal(false)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs font-bold">
              <div>
                <span className="text-[10px] uppercase text-slate-400 block">Opening Balance</span>
                <span className="font-mono text-slate-800">৳{Number(ledgerContact.openingBalance || 0).toFixed(2)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase text-slate-400 block">Outstanding Due</span>
                <span className="font-mono text-rose-600 font-black">৳{Number(ledgerContact.totalDue || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Ledger Transactions list */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 text-xs">
              <div className="p-3 bg-white border border-slate-150 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-black text-slate-800">{ledgerContact.addedOn} - Opening Balance Recorded</p>
                  <p className="text-[10px] text-slate-400 font-bold">Initial ledger creation</p>
                </div>
                <span className="font-mono font-bold text-slate-600">৳{Number(ledgerContact.openingBalance || 0).toFixed(2)}</span>
              </div>

              {ledgerContact.totalDue > 0 && (
                <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-black text-rose-800">Sales/Purchase Balance Due</p>
                    <p className="text-[10px] text-rose-500 font-bold">Outstanding bill balance</p>
                  </div>
                  <span className="font-mono font-black text-rose-700">৳{Number(ledgerContact.totalDue).toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-150">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isBn ? 'স্টেটমেন্ট প্রিন্ট' : 'Print Statement'}</span>
              </button>

              <button
                onClick={() => {
                  setShowLedgerModal(false);
                  handleOpenPayModal(ledgerContact);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-sm cursor-pointer"
              >
                {activeType === 'customers' ? 'Receive Due' : 'Pay Due'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
