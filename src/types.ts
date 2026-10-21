export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  approved?: boolean;
  reported?: boolean;
}

export interface Product {
  id: string;
  name: string;
  banglaName: string;
  category: 'pigeons' | 'birds' | 'medicine' | 'accessories' | 'supplements' | string;
  subcategory?: string;
  price: number; // in BDT
  originalPrice: number; // in BDT
  description: string;
  banglaDescription: string;
  image: string;
  rating: number;
  reviewsCount: number;
  reviews: Review[];
  weight?: string;
  stock: number;
  tags: string[];
  variants?: string[];
  imagesGallery?: string[];
  videosGallery?: string[];
  featured?: boolean;
  bestSeller?: boolean;
  recommended?: boolean;
  newArrival?: boolean;
  flashSale?: boolean;
  active?: boolean;
  slug?: string;
  sku?: string;
  barcode?: string;
  shortDescription?: string;
  fullDescription?: string;
  brand?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  image: string;
}

export interface Order {
  id: string;
  trackingId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  district: string;
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  paymentMethod: 'bKash' | 'Nagad' | 'Rocket' | 'Cash on Delivery' | string;
  paymentStatus: 'Pending' | 'Paid';
  paymentTransactionId?: string;
  orderStatus: 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Return Requested' | 'Refunded' | string;
  courierName?: 'Steadfast' | 'Pathao' | 'RedX' | 'Sundarban' | 'Janani' | 'Paperfly' | 'In-House Rider' | string;
  consignmentId?: string;
  courierTrackingUrl?: string;
  courierStatus?: 'Pending Booking' | 'Booked' | 'In Review' | 'Picked Up' | 'In Transit' | 'Out for Delivery' | 'Delivered' | 'Partial Delivery' | 'Return Pending' | 'Returned' | 'Cancelled' | string;
  courierBookedAt?: string;
  codAmount?: number;
  weightKg?: number;
  courierDeliveryCharge?: number;
  courierCodFee?: number;
  courierNotes?: string;
  destinationBranch?: string;
  courierPoint?: string;
  deliveryType?: 'Home Delivery' | 'Branch / Office Pickup' | string;
  // Product & Item Descriptions
  productItemName?: string;
  itemDescription?: string;
  // Courier & Condition Details
  conditionAmount?: number;
  conditionCharge?: number;
  conditionChargeType?: 'Cash' | 'To-Pay' | string;
  carryingCharge?: number;
  carryingChargeType?: 'Cash' | 'To-Pay' | string;
  totalCondition?: number;
  paymentCharge?: number;
  paymentChargeRate?: number;
  createdAt: string;
}

export interface CourierParcel {
  id: string;
  orderId: string;
  trackingId: string;
  consignmentId: string;
  cnNumber?: string;
  courier: 'Steadfast' | 'Pathao' | 'RedX' | 'Sundarban' | 'Janani' | 'Paperfly' | 'In-House Rider' | string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  district: string;
  itemsSummary: string;
  productQuantity?: number;
  weightKg: number;
  codAmount: number;
  deliveryCharge: number;
  codFee: number;
  totalPayableByCourier: number;
  status: 'Booked' | 'Pending Pickup' | 'Picked Up' | 'In Transit' | 'Out for Delivery' | 'Delivered' | 'Partial Delivery' | 'Return Pending' | 'Returned' | 'Cancelled';
  trackingUrl: string;
  bookedAt: string;
  lastUpdated?: string;
  settlementStatus?: 'Unsettled' | 'Settled' | 'Refunded';
  notes?: string;
  riderName?: string;
  riderPhone?: string;
  destinationBranch?: string;
  deliveryType?: 'Home Delivery' | 'Branch / Office Pickup' | 'O/D' | 'H/D' | string;
  // Physical / Official CN slip fields
  placeOfBooking?: string;
  bookingDateStr?: string;
  senderName?: string;
  senderPhone?: string;
  senderAddress?: string;
  deliveryLocation?: string;
  conditionAmount?: number;
  conditionCharge?: number;
  conditionChargeType?: 'Cash' | 'To-Pay' | string;
  totalCondition?: number;
  carryingCharge?: number;
  carryingChargeType?: 'Cash' | 'To-Pay' | string;
  vat?: number;
  totalPaid?: number;
  totalDue?: number;
  amountInWords?: string;
  bookingOfficer?: string;
}

export interface CourierAccountConfig {
  apiKey?: string;
  secretKey?: string;
  storeId?: string;
  clientSecret?: string;
  senderPhone?: string;
  senderAddress?: string;
  branchCode?: string;
  merchantCode?: string;
  enabled: boolean;
  sandboxMode?: boolean;
}

export interface CourierSettings {
  defaultCourier: 'Steadfast' | 'Pathao' | 'RedX' | 'Sundarban' | 'Janani' | 'Paperfly' | 'In-House Rider';
  autoUpdateOrderStatus: boolean;
  sendCustomerSms: boolean;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  senderDistrict: string;
  steadfast: CourierAccountConfig;
  pathao: CourierAccountConfig;
  redx: CourierAccountConfig;
  sundarban: CourierAccountConfig;
  janani: CourierAccountConfig;
  paperfly: CourierAccountConfig;
}

export interface CourierPoint {
  id: string;
  name: string;
  address: string;
  contact: string;
  courier: 'Steadfast' | 'Pathao' | 'RedX' | 'Sundarban' | 'Janani' | 'Paperfly' | 'SA Paribahan' | 'In-House Rider' | string;
  district: string;
  isActive: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'Super Admin' | 'Admin' | 'Manager' | 'Editor' | 'Viewer' | 'Customer';
  joinedAt: string;
  addresses?: Address[];
  notifications?: StoreNotification[];
  recentlyViewed?: string[];
  avatar?: string;
  status?: 'Active' | 'Inactive' | 'Banned';
  lastLogin?: string;
  loyaltyPoints?: number;
}

export interface Address {
  id: string;
  label: 'Home' | 'Office' | string;
  addressLine: string;
  district: string;
  phone: string;
}

export interface StoreNotification {
  id: string;
  title: string;
  titleBn?: string;
  message: string;
  messageBn?: string;
  type: 'order' | 'promo' | 'coupon' | 'system';
  isRead: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface Category {
  id: string;
  name: string;
  banglaName: string;
  image?: string;
  icon?: string;
  displayOrder: number;
  enabled: boolean;
  subcategories: string[];
}

export interface Brand {
  id: string;
  name: string;
  logo: string;
  description: string;
  status: 'Active' | 'Inactive';
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase: number;
  maxDiscount?: number;
  expiryDate?: string;
  usageLimit?: number;
  usedCount: number;
  oneTime: boolean;
  enabled: boolean;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  type: 'Homepage Slider' | 'Offer Banner' | 'Popup Banner' | 'Category Banner';
  publishDate?: string;
  status: 'Active' | 'Inactive';
}

export interface FlashSale {
  id: string;
  title: string;
  countdownEndTime: string;
  products: string[];
  startTime: string;
  endTime: string;
  status: 'Active' | 'Inactive';
}

export interface InventoryLog {
  id: string;
  productId: string;
  productName: string;
  type: 'Stock Adjustment' | 'Purchase Entry' | 'Damage Entry' | string;
  quantity: number;
  reason: string;
  date: string;
  operator: string;
}

export interface ActivityLog {
  id: string;
  userEmail: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface Supplier {
  id: string;
  contactId?: string;
  name: string;
  companyName: string;
  businessName?: string;
  phone: string;
  mobile?: string;
  email?: string;
  address: string;
  creditLimit?: string | number;
  openingBalance?: number;
  advanceBalance?: number;
  addedOn?: string;
  totalPurchases: number;
  paidAmount: number;
  dueBalance: number;
  totalPurchaseDue?: number;
  totalPurchaseReturnDue?: number;
  status: 'Active' | 'Inactive';
  notes?: string;
  createdAt: string;
  ledger?: any[];
}

export interface Customer {
  id: string;
  contactId: string;
  businessName: string;
  name: string;
  creditLimit: string | number;
  openingBalance: number;
  advanceBalance: number;
  addedOn: string;
  address: string;
  mobile: string;
  email?: string;
  alternateContact?: string;
  totalSaleDue: number;
  totalSellReturnDue: number;
  status: 'Active' | 'Inactive';
  notes?: string;
  createdAt: string;
  ordersCount?: number;
  totalPurchased?: number;
  ledger?: any[];
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  costPrice: number;
  sellPrice?: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: 'Cash' | 'bKash' | 'Bank' | 'Nagad' | 'Due' | string;
  paymentStatus: 'Paid' | 'Partial' | 'Unpaid';
  status: 'Received' | 'Pending' | 'Ordered' | 'Cancelled';
  invoiceDate: string;
  batchNo?: string;
  notes?: string;
}

export interface Expense {
  id: string;
  title: string;
  titleBn?: string;
  category: 'Rent' | 'Salary' | 'Utilities' | 'Courier' | 'Packaging' | 'Feeding & Care' | 'Marketing' | 'Maintenance' | 'Office Supplies' | 'Other' | string;
  amount: number;
  paymentMethod: 'Cash' | 'bKash' | 'Nagad' | 'Bank' | string;
  date: string;
  referenceNo?: string;
  notes?: string;
  recordedBy: string;
}

export interface DamageWaste {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  costPerUnit: number;
  totalLoss: number;
  reason: 'Expired' | 'Broken/Damaged' | 'Spoiled/Rotten' | 'Missing/Audit Mismatch' | 'Sample/Test' | string;
  date: string;
  recordedBy: string;
  status: 'Written Off' | 'Pending Review';
  notes?: string;
}

export interface AccountTransaction {
  id: string;
  date: string;
  type: 'Income' | 'Expense' | 'Transfer';
  category: 'Order Sales' | 'Offline Counter Sale' | 'Supplier Payment' | 'Operating Expense' | 'Customer Due Recovery' | 'Tax & VAT' | 'Capital Inflow' | 'Bank Fee' | string;
  amount: number;
  method: 'Cash' | 'bKash' | 'Nagad' | 'Bank' | 'Rocket' | string;
  description: string;
  referenceId?: string;
  operator: string;
}

export interface StoreSettings {
  storeName: string;
  logo: string;
  favicon: string;
  contactEmail: string;
  contactPhone: string;
  businessHours: string;
  socialFacebook: string;
  socialYoutube: string;
  shippingChargeDhaka: number;
  shippingChargeOutside: number;
  taxRate: number;
  currency: string;
  language: 'en' | 'bn';
  // Enterprise Extensions
  bkashNumber?: string;
  bkashType?: 'Personal' | 'Agent' | 'Merchant';
  nagadNumber?: string;
  nagadType?: 'Personal' | 'Agent' | 'Merchant';
  rocketNumber?: string;
  rocketType?: 'Personal' | 'Agent' | 'Merchant';
  paymentInstructionsEn?: string;
  paymentInstructionsBn?: string;
  codChargeRate?: number; // e.g. 1.00%
  bkashChargeRate?: number; // e.g. 1.85%
  nagadChargeRate?: number; // e.g. 1.5%
  rocketChargeRate?: number; // e.g. 1.8%
  maintenanceMode?: boolean;
  orderIdPrefix?: string;
}
