import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

export interface DbConfig {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
}

let pool: mysql.Pool | null = null;
let isMySqlAvailable = false;

export function getDbConfig(): DbConfig {
  const dataDir = path.join(process.cwd(), "data");
  const configPath = path.join(dataDir, "config.json");
  let fileConfig: DbConfig = {};
  try {
    if (fs.existsSync(configPath)) {
      fileConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    }
  } catch (e) {
    // Silent fallback
  }

  return {
    host: fileConfig.host || process.env.DB_HOST || process.env.MYSQL_HOST,
    port: Number(fileConfig.port || process.env.DB_PORT || process.env.MYSQL_PORT || 3306),
    user: fileConfig.user || process.env.DB_USER || process.env.MYSQL_USER,
    password: fileConfig.password || process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD,
    database: fileConfig.database || process.env.DB_NAME || process.env.MYSQL_DATABASE,
  };
}

export function isDbConfigured(): boolean {
  const config = getDbConfig();
  // We can also check if a locked file exists
  const lockPath = path.join(process.cwd(), "data", "install.lock");
  const hasLock = fs.existsSync(lockPath);
  return Boolean(config.host && config.user && config.database) || hasLock;
}

export async function saveDbConfig(config: DbConfig): Promise<boolean> {
  try {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const configPath = path.join(dataDir, "config.json");
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");

    // Try writing to .env if possible
    const envPath = path.join(process.cwd(), ".env");
    try {
      let envContent = "";
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, "utf8");
      }
      
      const keys = {
        DB_HOST: config.host || "",
        DB_PORT: String(config.port || 3306),
        DB_USER: config.user || "",
        DB_PASSWORD: config.password || "",
        DB_NAME: config.database || "",
      };
      
      let lines = envContent ? envContent.split("\n") : [];
      for (const [key, val] of Object.entries(keys)) {
        const idx = lines.findIndex(l => l.startsWith(`${key}=`));
        if (idx !== -1) {
          lines[idx] = `${key}="${val}"`;
        } else {
          lines.push(`${key}="${val}"`);
        }
      }
      fs.writeFileSync(envPath, lines.join("\n"), "utf8");
    } catch (e) {
      console.warn("Could not write to .env (config.json will be used):", e);
    }

    // Recreate the pool
    if (pool) {
      await pool.end().catch(() => {});
      pool = null;
    }

    // Attempt to initialize MySQL connection
    const success = await initMySql([], [], []);
    if (success) {
      // Create a lock file to prevent subsequent installer exposure
      const lockPath = path.join(dataDir, "install.lock");
      fs.writeFileSync(lockPath, JSON.stringify({ installedAt: new Date().toISOString() }, null, 2), "utf8");
    }
    return success;
  } catch (err: any) {
    console.error("Error saving DB config:", err);
    return false;
  }
}

export async function initMySql(initialProducts: any[] = [], initialUsers: any[] = [], initialCourierPoints: any[] = []): Promise<boolean> {
  const config = getDbConfig();

  if (!isDbConfigured()) {
    console.log("[MYSQL] No MySQL configuration found in environment variables (DB_HOST, DB_USER, DB_NAME). Operating in local persistent file engine mode.");
    isMySqlAvailable = false;
    return false;
  }

  try {
    console.log(`[MYSQL] Connecting to MySQL at ${config.host}:${config.port}, Database: ${config.database}...`);
    pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 15,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      charset: "utf8mb4",
    });

    // Test connection
    const connection = await pool.getConnection();
    console.log("[MYSQL] ✅ Connected successfully to MySQL database!");
    connection.release();

    // Create tables automatically if they don't exist
    await createSchema();

    // Seed tables if empty
    await seedInitialData(initialProducts, initialUsers, initialCourierPoints);

    isMySqlAvailable = true;
    return true;
  } catch (err: any) {
    console.error("[MYSQL] ⚠️ Connection failed:", err.message);
    console.log("[MYSQL] Continuing with local persistent storage fallback so the store remains 100% functional.");
    isMySqlAvailable = false;
    pool = null;
    return false;
  }
}

export function isMySqlConnected(): boolean {
  return isMySqlAvailable && pool !== null;
}

export async function query(sql: string, params: any[] = []): Promise<any> {
  if (!pool) {
    throw new Error("MySQL connection pool is not initialized");
  }
  const [results] = await pool.execute(sql, params);
  return results;
}

async function createSchema() {
  if (!pool) return;

  console.log("[MYSQL] Verifying database tables schema...");

  const queries = [
    // 1. Products table
    `CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(64) PRIMARY KEY,
      slug VARCHAR(191) UNIQUE,
      name VARCHAR(255) NOT NULL,
      bangla_name VARCHAR(255),
      category VARCHAR(64) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      original_price DECIMAL(10, 2) DEFAULT NULL,
      cost_price DECIMAL(10, 2) DEFAULT NULL,
      stock INT NOT NULL DEFAULT 0,
      unit VARCHAR(32) DEFAULT 'kg',
      weight VARCHAR(64) DEFAULT NULL,
      short_description TEXT DEFAULT NULL,
      description LONGTEXT DEFAULT NULL,
      image VARCHAR(512) NOT NULL,
      additional_images JSON DEFAULT NULL,
      is_featured BOOLEAN DEFAULT FALSE,
      best_seller BOOLEAN DEFAULT FALSE,
      rating DECIMAL(3, 2) DEFAULT 5.00,
      reviews_count INT DEFAULT 0,
      sku VARCHAR(64) DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_category (category),
      INDEX idx_slug (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 2. Users table
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(191) NOT NULL UNIQUE,
      phone VARCHAR(32) DEFAULT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(32) NOT NULL DEFAULT 'Customer',
      address TEXT DEFAULT NULL,
      district VARCHAR(64) DEFAULT NULL,
      avatar VARCHAR(512) DEFAULT NULL,
      loyalty_points INT NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_role (role)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 3. Orders table
    `CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(64) PRIMARY KEY,
      tracking_id VARCHAR(64) UNIQUE,
      customer_name VARCHAR(255) NOT NULL,
      customer_email VARCHAR(191) DEFAULT NULL,
      customer_phone VARCHAR(32) NOT NULL,
      delivery_address TEXT NOT NULL,
      district VARCHAR(64) NOT NULL,
      courier_point_id VARCHAR(64) DEFAULT NULL,
      courier_name VARCHAR(128) DEFAULT NULL,
      total_amount DECIMAL(10, 2) NOT NULL,
      delivery_charge DECIMAL(10, 2) NOT NULL DEFAULT 0,
      discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
      coupon_code VARCHAR(64) DEFAULT NULL,
      payment_method VARCHAR(64) NOT NULL DEFAULT 'cod',
      payment_status VARCHAR(32) NOT NULL DEFAULT 'unpaid',
      payment_trx_id VARCHAR(128) DEFAULT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'pending',
      notes TEXT DEFAULT NULL,
      invoice_number VARCHAR(64) DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_tracking (tracking_id),
      INDEX idx_status (status),
      INDEX idx_phone (customer_phone)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 4. Order Items table
    `CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id VARCHAR(64) NOT NULL,
      product_id VARCHAR(64) NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      product_image VARCHAR(512) DEFAULT NULL,
      price DECIMAL(10, 2) NOT NULL,
      quantity INT NOT NULL,
      total_price DECIMAL(10, 2) NOT NULL,
      INDEX idx_order (order_id),
      INDEX idx_product (product_id),
      CONSTRAINT fk_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 5. Courier Points table
    `CREATE TABLE IF NOT EXISTS courier_points (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      bangla_name VARCHAR(255) DEFAULT NULL,
      district VARCHAR(64) NOT NULL,
      address TEXT NOT NULL,
      phone VARCHAR(64) DEFAULT NULL,
      courier_service VARCHAR(64) NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_district (district),
      INDEX idx_service (courier_service)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 6. Expenses & Accounting table
    `CREATE TABLE IF NOT EXISTS expenses (
      id VARCHAR(64) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(64) NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      expense_date DATE NOT NULL,
      notes TEXT DEFAULT NULL,
      created_by VARCHAR(128) DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 7. Uploaded Local Assets Catalog
    `CREATE TABLE IF NOT EXISTS uploaded_files (
      id VARCHAR(128) PRIMARY KEY,
      filename VARCHAR(255) NOT NULL,
      mime_type VARCHAR(64) DEFAULT 'image/jpeg',
      file_size INT DEFAULT 0,
      disk_path VARCHAR(512) NOT NULL,
      public_url VARCHAR(512) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_filename (filename)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 8. Courier Parcels & Consignment Bookings (Dedicated Courier Ledger & CN records)
    `CREATE TABLE IF NOT EXISTS courier_parcels (
      id VARCHAR(64) PRIMARY KEY,
      order_id VARCHAR(64) DEFAULT NULL,
      tracking_id VARCHAR(64) DEFAULT NULL,
      consignment_id VARCHAR(64) DEFAULT NULL,
      cn_number VARCHAR(64) DEFAULT NULL,
      courier VARCHAR(64) NOT NULL DEFAULT 'Janani',
      delivery_type VARCHAR(64) DEFAULT 'O/D',
      customer_name VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(32) NOT NULL,
      customer_alt_phone VARCHAR(32) DEFAULT NULL,
      shipping_address TEXT NOT NULL,
      district VARCHAR(64) NOT NULL,
      destination_branch VARCHAR(128) DEFAULT NULL,
      sender_name VARCHAR(255) DEFAULT 'Abdul Malek Molla',
      sender_phone VARCHAR(32) DEFAULT '01718-105642',
      sender_address TEXT DEFAULT NULL,
      place_of_booking VARCHAR(128) DEFAULT 'Konabari',
      booking_officer VARCHAR(128) DEFAULT 'Md. Rakib',
      booking_date_str VARCHAR(128) DEFAULT NULL,
      items_summary TEXT DEFAULT NULL,
      product_quantity INT DEFAULT 1,
      package_type VARCHAR(64) DEFAULT 'ব্যাগ/বস্তা',
      weight_kg DECIMAL(8, 2) DEFAULT 1.0,
      special_instructions TEXT DEFAULT NULL,
      condition_amount DECIMAL(10, 2) DEFAULT 0,
      condition_charge DECIMAL(10, 2) DEFAULT 0,
      condition_charge_type VARCHAR(32) DEFAULT 'To-Pay',
      carrying_charge DECIMAL(10, 2) DEFAULT 0,
      carrying_charge_type VARCHAR(32) DEFAULT 'To-Pay',
      vat DECIMAL(10, 2) DEFAULT 0,
      amount_in_words VARCHAR(255) DEFAULT NULL,
      cod_amount DECIMAL(10, 2) DEFAULT 0,
      cod_fee DECIMAL(10, 2) DEFAULT 0,
      delivery_charge DECIMAL(10, 2) DEFAULT 0,
      total_payable_by_courier DECIMAL(10, 2) DEFAULT 0,
      status VARCHAR(64) NOT NULL DEFAULT 'In Transit',
      settlement_status VARCHAR(64) NOT NULL DEFAULT 'Unsettled',
      tracking_url VARCHAR(512) DEFAULT NULL,
      notes TEXT DEFAULT NULL,
      booked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_consignment (consignment_id),
      INDEX idx_tracking (tracking_id),
      INDEX idx_customer_phone (customer_phone),
      INDEX idx_courier (courier),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 9. Courier Service Configurations & Merchant API Credentials
    `CREATE TABLE IF NOT EXISTS courier_settings (
      id VARCHAR(32) PRIMARY KEY DEFAULT 'primary',
      default_courier VARCHAR(64) DEFAULT 'Steadfast',
      auto_update_order_status BOOLEAN DEFAULT TRUE,
      send_customer_sms BOOLEAN DEFAULT TRUE,
      sender_name VARCHAR(255) DEFAULT 'Taqwa Enterprise',
      sender_phone VARCHAR(32) DEFAULT '01913955452',
      sender_address TEXT DEFAULT NULL,
      sender_district VARCHAR(64) DEFAULT 'Dhaka',
      config_json LONGTEXT DEFAULT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 10. General System & Shop Settings
    `CREATE TABLE IF NOT EXISTS system_settings (
      id VARCHAR(32) PRIMARY KEY DEFAULT 'primary',
      settings_json LONGTEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 11. Discount Coupons & Promo Codes
    `CREATE TABLE IF NOT EXISTS coupons (
      code VARCHAR(64) PRIMARY KEY,
      discount_percent INT DEFAULT 0,
      discount_amount DECIMAL(10, 2) DEFAULT 0,
      min_order_amount DECIMAL(10, 2) DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      expires_at DATETIME DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 12. Product Categories
    `CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(128) NOT NULL,
      bangla_name VARCHAR(128) DEFAULT NULL,
      icon VARCHAR(64) DEFAULT NULL,
      image VARCHAR(512) DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 13. Suppliers & Vendors
    `CREATE TABLE IF NOT EXISTS suppliers (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(32) DEFAULT NULL,
      email VARCHAR(191) DEFAULT NULL,
      address TEXT DEFAULT NULL,
      company VARCHAR(255) DEFAULT NULL,
      balance DECIMAL(10, 2) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 14. Stock Purchases
    `CREATE TABLE IF NOT EXISTS purchases (
      id VARCHAR(64) PRIMARY KEY,
      invoice_no VARCHAR(64) DEFAULT NULL,
      supplier_id VARCHAR(64) DEFAULT NULL,
      supplier_name VARCHAR(255) DEFAULT NULL,
      total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
      paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
      due_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
      items_json LONGTEXT DEFAULT NULL,
      purchase_date DATE DEFAULT NULL,
      notes TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 15. Inventory Movement Logs
    `CREATE TABLE IF NOT EXISTS inventory_logs (
      id VARCHAR(64) PRIMARY KEY,
      product_id VARCHAR(64) NOT NULL,
      product_name VARCHAR(255) DEFAULT NULL,
      change_type VARCHAR(64) NOT NULL,
      quantity INT NOT NULL,
      previous_stock INT NOT NULL DEFAULT 0,
      new_stock INT NOT NULL DEFAULT 0,
      reference VARCHAR(255) DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 16. Damaged / Returned Goods
    `CREATE TABLE IF NOT EXISTS damages (
      id VARCHAR(64) PRIMARY KEY,
      product_id VARCHAR(64) NOT NULL,
      product_name VARCHAR(255) DEFAULT NULL,
      quantity INT NOT NULL,
      cost_loss DECIMAL(10, 2) NOT NULL DEFAULT 0,
      reason TEXT DEFAULT NULL,
      damage_date DATE DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 17. Accounting & Cash/Bank Transactions
    `CREATE TABLE IF NOT EXISTS accounts_transactions (
      id VARCHAR(64) PRIMARY KEY,
      type VARCHAR(32) NOT NULL,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(64) DEFAULT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      account_type VARCHAR(64) DEFAULT 'cash',
      transaction_date DATE NOT NULL,
      notes TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 18. Customers Contact Directory
    `CREATE TABLE IF NOT EXISTS customers (
      id VARCHAR(64) PRIMARY KEY,
      contact_id VARCHAR(64) DEFAULT NULL,
      business_name VARCHAR(255) DEFAULT NULL,
      name VARCHAR(255) NOT NULL,
      credit_limit VARCHAR(64) DEFAULT 'No Limit',
      opening_balance DECIMAL(12, 2) DEFAULT 0.00,
      advance_balance DECIMAL(12, 2) DEFAULT 0.00,
      added_on VARCHAR(64) DEFAULT NULL,
      address TEXT DEFAULT NULL,
      mobile VARCHAR(64) DEFAULT NULL,
      email VARCHAR(191) DEFAULT NULL,
      alternate_contact VARCHAR(64) DEFAULT NULL,
      total_sale_due DECIMAL(12, 2) DEFAULT 0.00,
      total_sell_return_due DECIMAL(12, 2) DEFAULT 0.00,
      status VARCHAR(32) DEFAULT 'Active',
      notes TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
  ];

  for (const q of queries) {
    try {
      await pool.query(q);
    } catch (e: any) {
      console.error("[MYSQL] Error creating table:", e.message);
    }
  }

  // Ensure contact columns in suppliers table
  const supplierColumns = [
    "ALTER TABLE suppliers ADD COLUMN contact_id VARCHAR(64) DEFAULT NULL;",
    "ALTER TABLE suppliers ADD COLUMN business_name VARCHAR(255) DEFAULT NULL;",
    "ALTER TABLE suppliers ADD COLUMN credit_limit VARCHAR(64) DEFAULT 'No Limit';",
    "ALTER TABLE suppliers ADD COLUMN opening_balance DECIMAL(12, 2) DEFAULT 0.00;",
    "ALTER TABLE suppliers ADD COLUMN advance_balance DECIMAL(12, 2) DEFAULT 0.00;",
    "ALTER TABLE suppliers ADD COLUMN added_on VARCHAR(64) DEFAULT NULL;",
    "ALTER TABLE suppliers ADD COLUMN mobile VARCHAR(64) DEFAULT NULL;",
    "ALTER TABLE suppliers ADD COLUMN total_purchase_due DECIMAL(12, 2) DEFAULT 0.00;",
    "ALTER TABLE suppliers ADD COLUMN total_purchase_return_due DECIMAL(12, 2) DEFAULT 0.00;",
    "ALTER TABLE suppliers ADD COLUMN status VARCHAR(32) DEFAULT 'Active';",
    "ALTER TABLE suppliers ADD COLUMN notes TEXT DEFAULT NULL;"
  ];
  for (const sCol of supplierColumns) {
    try {
      await pool.query(sCol);
    } catch (e) {
      // ignore if exists
    }
  }

  // Ensure loyalty_points column is present in users table if table already existed
  try {
    await pool.query("ALTER TABLE users ADD COLUMN loyalty_points INT NOT NULL DEFAULT 0;");
  } catch (err: any) {
    // Already exists
  }

  // Ensure courier booking columns exist in orders table
  const orderColumns = [
    "ALTER TABLE orders ADD COLUMN consignment_id VARCHAR(64) DEFAULT NULL;",
    "ALTER TABLE orders ADD COLUMN place_of_booking VARCHAR(128) DEFAULT NULL;",
    "ALTER TABLE orders ADD COLUMN booking_date_str VARCHAR(128) DEFAULT NULL;",
    "ALTER TABLE orders ADD COLUMN booking_officer VARCHAR(128) DEFAULT NULL;",
    "ALTER TABLE orders ADD COLUMN sender_name VARCHAR(255) DEFAULT NULL;",
    "ALTER TABLE orders ADD COLUMN sender_phone VARCHAR(32) DEFAULT NULL;",
    "ALTER TABLE orders ADD COLUMN destination_branch VARCHAR(128) DEFAULT NULL;",
    "ALTER TABLE orders ADD COLUMN delivery_type VARCHAR(64) DEFAULT NULL;",
    "ALTER TABLE orders ADD COLUMN weight_kg DECIMAL(8, 2) DEFAULT NULL;",
    "ALTER TABLE orders ADD COLUMN condition_charge DECIMAL(10, 2) DEFAULT 0;",
    "ALTER TABLE orders ADD COLUMN amount_in_words VARCHAR(255) DEFAULT NULL;"
  ];
  for (const colQuery of orderColumns) {
    try {
      await pool.query(colQuery);
    } catch (e) {
      // Column already exists, safe to ignore
    }
  }

  console.log("[MYSQL] ✅ All database tables created or verified successfully!");
}

async function seedInitialData(initialProducts: any[], initialUsers: any[], initialCourierPoints: any[]) {
  if (!pool) return;

  try {
    // Check if products exist
    const [pRows]: any = await pool.query("SELECT COUNT(*) as count FROM products");
    if (pRows[0].count === 0 && initialProducts.length > 0) {
      console.log(`[MYSQL] Seeding ${initialProducts.length} initial products into MySQL...`);
      for (const p of initialProducts) {
        await pool.query(
          `INSERT INTO products (
            id, slug, name, bangla_name, category, price, original_price, cost_price, 
            stock, unit, weight, short_description, description, image, additional_images, 
            is_featured, best_seller, rating, reviews_count, sku
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE name=VALUES(name)`,
          [
            p.id,
            p.slug || p.id,
            p.name,
            p.banglaName || null,
            p.category,
            p.price,
            p.originalPrice || null,
            p.costPrice || null,
            p.stock ?? 10,
            p.unit || 'kg',
            p.weight || null,
            p.shortDescription || null,
            p.description || null,
            p.image,
            JSON.stringify(p.additionalImages || []),
            Boolean(p.isFeatured),
            Boolean(p.bestSeller),
            p.rating || 5.0,
            p.reviewsCount || 0,
            p.sku || null
          ]
        );
      }
      console.log("[MYSQL] ✅ Products seeded successfully.");
    }

    // Check if users exist
    const [uRows]: any = await pool.query("SELECT COUNT(*) as count FROM users");
    if (uRows[0].count === 0 && initialUsers.length > 0) {
      console.log(`[MYSQL] Seeding ${initialUsers.length} initial users into MySQL...`);
      for (const u of initialUsers) {
        await pool.query(
          `INSERT INTO users (id, name, email, phone, password_hash, role, address, district)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE name=VALUES(name)`,
          [
            u.id,
            u.name,
            u.email,
            u.phone || null,
            u.password || "admin123",
            u.role || "Customer",
            u.address || null,
            u.district || null
          ]
        );
      }
      console.log("[MYSQL] ✅ Users seeded successfully.");
    }

    // Check if courier points exist
    const [cRows]: any = await pool.query("SELECT COUNT(*) as count FROM courier_points");
    if (cRows[0].count === 0 && initialCourierPoints.length > 0) {
      console.log(`[MYSQL] Seeding ${initialCourierPoints.length} initial courier points into MySQL...`);
      for (const c of initialCourierPoints) {
        await pool.query(
          `INSERT INTO courier_points (id, name, bangla_name, district, address, phone, courier_service, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE name=VALUES(name)`,
          [
            c.id,
            c.name,
            c.banglaName || null,
            c.district,
            c.address,
            c.phone || null,
            c.courierService || "Steadfast",
            c.isActive !== false
          ]
        );
      }
      console.log("[MYSQL] ✅ Courier points seeded successfully.");
    }
  } catch (err: any) {
    console.error("[MYSQL] Seeding warning:", err.message);
  }
}

// ----------------------------------------------------
// DATABASE OPERATION HELPERS
// ----------------------------------------------------

export async function fetchProductsFromDb(): Promise<any[] | null> {
  if (!isMySqlConnected()) return null;
  try {
    const [rows]: any = await pool!.query("SELECT * FROM products ORDER BY created_at DESC");
    return rows.map((r: any) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      banglaName: r.bangla_name,
      category: r.category,
      price: Number(r.price),
      originalPrice: r.original_price ? Number(r.original_price) : undefined,
      costPrice: r.cost_price ? Number(r.cost_price) : undefined,
      stock: Number(r.stock),
      unit: r.unit,
      weight: r.weight,
      shortDescription: r.short_description,
      description: r.description,
      image: r.image,
      additionalImages: typeof r.additional_images === "string" ? JSON.parse(r.additional_images) : (r.additional_images || []),
      isFeatured: Boolean(r.is_featured),
      bestSeller: Boolean(r.best_seller),
      rating: Number(r.rating),
      reviewsCount: Number(r.reviews_count),
      sku: r.sku,
    }));
  } catch (err: any) {
    console.error("[MYSQL] Error fetching products:", err.message);
    return null;
  }
}

export async function upsertProductToDb(p: any): Promise<boolean> {
  if (!isMySqlConnected()) return false;
  try {
    await pool!.query(
      `INSERT INTO products (
        id, slug, name, bangla_name, category, price, original_price, cost_price, 
        stock, unit, weight, short_description, description, image, additional_images, 
        is_featured, best_seller, rating, reviews_count, sku
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        slug=VALUES(slug), name=VALUES(name), bangla_name=VALUES(bangla_name), 
        category=VALUES(category), price=VALUES(price), original_price=VALUES(original_price), 
        cost_price=VALUES(cost_price), stock=VALUES(stock), unit=VALUES(unit), 
        weight=VALUES(weight), short_description=VALUES(short_description), 
        description=VALUES(description), image=VALUES(image), additional_images=VALUES(additional_images), 
        is_featured=VALUES(is_featured), best_seller=VALUES(best_seller), 
        rating=VALUES(rating), reviews_count=VALUES(reviews_count), sku=VALUES(sku)`,
      [
        p.id,
        p.slug || p.id,
        p.name,
        p.banglaName || null,
        p.category,
        p.price,
        p.originalPrice || null,
        p.costPrice || null,
        p.stock ?? 0,
        p.unit || 'kg',
        p.weight || null,
        p.shortDescription || null,
        p.description || null,
        p.image,
        JSON.stringify(p.additionalImages || []),
        Boolean(p.isFeatured),
        Boolean(p.bestSeller),
        p.rating || 5.0,
        p.reviewsCount || 0,
        p.sku || null
      ]
    );
    return true;
  } catch (err: any) {
    console.error("[MYSQL] Error upserting product:", err.message);
    return false;
  }
}

export async function deleteProductFromDb(id: string): Promise<boolean> {
  if (!isMySqlConnected()) return false;
  try {
    await pool!.query("DELETE FROM products WHERE id = ?", [id]);
    return true;
  } catch (err: any) {
    console.error("[MYSQL] Error deleting product:", err.message);
    return false;
  }
}

export async function saveOrderToDb(order: any): Promise<boolean> {
  if (!isMySqlConnected()) return false;
  const conn = await pool!.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `INSERT INTO orders (
        id, tracking_id, customer_name, customer_email, customer_phone, delivery_address,
        district, courier_point_id, courier_name, total_amount, delivery_charge,
        discount_amount, coupon_code, payment_method, payment_status, payment_trx_id,
        status, notes, invoice_number, consignment_id, place_of_booking,
        booking_date_str, booking_officer, sender_name, sender_phone,
        destination_branch, delivery_type, weight_kg, condition_charge, amount_in_words
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        status=VALUES(status), payment_status=VALUES(payment_status), 
        payment_trx_id=VALUES(payment_trx_id),
        consignment_id=VALUES(consignment_id),
        courier_name=VALUES(courier_name),
        place_of_booking=VALUES(place_of_booking),
        booking_date_str=VALUES(booking_date_str),
        booking_officer=VALUES(booking_officer),
        destination_branch=VALUES(destination_branch)`,
      [
        order.id,
        order.trackingId || order.id,
        order.customerName || order.shippingAddress?.fullName || 'Customer',
        order.customerEmail || order.shippingAddress?.email || null,
        order.customerPhone || order.shippingAddress?.phone || '',
        order.deliveryAddress || `${order.shippingAddress?.address || ''}, ${order.shippingAddress?.city || ''}`,
        order.district || order.shippingAddress?.city || 'Dhaka',
        order.courierPointId || null,
        order.courierName || order.courier || null,
        order.totalAmount || order.total || 0,
        order.deliveryCharge || 0,
        order.discountAmount || 0,
        order.couponCode || null,
        order.paymentMethod || 'cod',
        order.paymentStatus || 'unpaid',
        order.paymentTrxId || null,
        order.status || 'pending',
        order.notes || null,
        order.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
        order.consignmentId || order.courierConsignmentId || null,
        order.placeOfBooking || null,
        order.bookingDateStr || null,
        order.bookingOfficer || null,
        order.senderName || null,
        order.senderPhone || null,
        order.destinationBranch || null,
        order.deliveryType || null,
        order.weightKg || null,
        order.conditionCharge || 0,
        order.amountInWords || null
      ]
    );

    // Insert order items
    if (Array.isArray(order.items) && order.items.length > 0) {
      await conn.query("DELETE FROM order_items WHERE order_id = ?", [order.id]);
      for (const item of order.items) {
        const prod = item.product || item;
        await conn.query(
          `INSERT INTO order_items (order_id, product_id, product_name, product_image, price, quantity, total_price)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            order.id,
            prod.id || 'item',
            prod.name || 'Product',
            prod.image || null,
            prod.price || 0,
            item.quantity || 1,
            (prod.price || 0) * (item.quantity || 1)
          ]
        );
      }
    }

    await conn.commit();
    return true;
  } catch (err: any) {
    await conn.rollback();
    console.error("[MYSQL] Error saving order to DB:", err.message);
    return false;
  } finally {
    conn.release();
  }
}

export async function recordUploadedFile(fileInfo: {
  id: string;
  filename: string;
  mimeType?: string;
  fileSize?: number;
  diskPath: string;
  publicUrl: string;
}): Promise<boolean> {
  if (!isMySqlConnected()) return false;
  try {
    await pool!.query(
      `INSERT INTO uploaded_files (id, filename, mime_type, file_size, disk_path, public_url)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE filename=VALUES(filename)`,
      [
        fileInfo.id,
        fileInfo.filename,
        fileInfo.mimeType || 'image/jpeg',
        fileInfo.fileSize || 0,
        fileInfo.diskPath,
        fileInfo.publicUrl
      ]
    );
    return true;
  } catch (err: any) {
    console.error("[MYSQL] Error registering uploaded file in DB:", err.message);
    return false;
  }
}

// ----------------------------------------------------
// COURIER BOOKING & LOGISTICS DB HELPERS
// ----------------------------------------------------

export async function fetchCourierParcelsFromDb(): Promise<any[] | null> {
  if (!isMySqlConnected()) return null;
  try {
    const [rows]: any = await pool!.query("SELECT * FROM courier_parcels ORDER BY booked_at DESC");
    return rows.map((r: any) => ({
      id: r.id,
      orderId: r.order_id,
      trackingId: r.tracking_id,
      consignmentId: r.consignment_id,
      cnNumber: r.cn_number || r.consignment_id,
      courier: r.courier,
      deliveryType: r.delivery_type,
      customerName: r.customer_name,
      customerPhone: r.customer_phone,
      customerAltPhone: r.customer_alt_phone,
      shippingAddress: r.shipping_address,
      district: r.district,
      destinationBranch: r.destination_branch,
      senderName: r.sender_name,
      senderPhone: r.sender_phone,
      senderAddress: r.sender_address,
      placeOfBooking: r.place_of_booking,
      bookingOfficer: r.booking_officer,
      bookingDateStr: r.booking_date_str,
      itemsSummary: r.items_summary,
      productQuantity: Number(r.product_quantity) || 1,
      packageType: r.package_type,
      weightKg: Number(r.weight_kg) || 1,
      specialInstructions: r.special_instructions,
      conditionAmount: Number(r.condition_amount) || 0,
      conditionCharge: Number(r.condition_charge) || 0,
      conditionChargeType: r.condition_charge_type || 'To-Pay',
      carryingCharge: Number(r.carrying_charge) || 0,
      carryingChargeType: r.carrying_charge_type || 'To-Pay',
      vat: Number(r.vat) || 0,
      amountInWords: r.amount_in_words,
      codAmount: Number(r.cod_amount) || 0,
      codFee: Number(r.cod_fee) || 0,
      deliveryCharge: Number(r.delivery_charge) || 0,
      totalPayableByCourier: Number(r.total_payable_by_courier) || 0,
      status: r.status,
      settlementStatus: r.settlement_status,
      trackingUrl: r.tracking_url,
      notes: r.notes,
      bookedAt: r.booked_at ? new Date(r.booked_at).toISOString() : new Date().toISOString(),
      lastUpdated: r.last_updated ? new Date(r.last_updated).toISOString() : new Date().toISOString()
    }));
  } catch (err: any) {
    console.error("[MYSQL] Error fetching courier parcels:", err.message);
    return null;
  }
}

export async function saveCourierParcelToDb(p: any): Promise<boolean> {
  if (!isMySqlConnected()) return false;
  try {
    await pool!.query(
      `INSERT INTO courier_parcels (
        id, order_id, tracking_id, consignment_id, cn_number, courier, delivery_type,
        customer_name, customer_phone, customer_alt_phone, shipping_address, district,
        destination_branch, sender_name, sender_phone, sender_address, place_of_booking,
        booking_officer, booking_date_str, items_summary, product_quantity, package_type,
        weight_kg, special_instructions, condition_amount, condition_charge, condition_charge_type,
        carrying_charge, carrying_charge_type, vat, amount_in_words, cod_amount, cod_fee,
        delivery_charge, total_payable_by_courier, status, settlement_status, tracking_url,
        notes, booked_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        status=VALUES(status),
        settlement_status=VALUES(settlement_status),
        consignment_id=VALUES(consignment_id),
        cn_number=VALUES(cn_number),
        tracking_url=VALUES(tracking_url),
        last_updated=CURRENT_TIMESTAMP`,
      [
        p.id,
        p.orderId || null,
        p.trackingId || null,
        p.consignmentId || p.cnNumber || null,
        p.cnNumber || p.consignmentId || null,
        p.courier || 'Janani',
        p.deliveryType || 'O/D',
        p.customerName || 'Valued Customer',
        p.customerPhone || '',
        p.customerAltPhone || null,
        p.shippingAddress || '',
        p.district || 'Dhaka',
        p.destinationBranch || null,
        p.senderName || 'Abdul Malek Molla',
        p.senderPhone || '01718-105642',
        p.senderAddress || null,
        p.placeOfBooking || 'Konabari',
        p.bookingOfficer || 'Md. Rakib',
        p.bookingDateStr || null,
        p.itemsSummary || null,
        p.productQuantity || 1,
        p.packageType || 'ব্যাগ/বস্তা',
        p.weightKg || 1,
        p.specialInstructions || null,
        p.conditionAmount || 0,
        p.conditionCharge || 0,
        p.conditionChargeType || 'To-Pay',
        p.carryingCharge || 0,
        p.carryingChargeType || 'To-Pay',
        p.vat || 0,
        p.amountInWords || null,
        p.codAmount || 0,
        p.codFee || 0,
        p.deliveryCharge || 0,
        p.totalPayableByCourier || 0,
        p.status || 'In Transit',
        p.settlementStatus || 'Unsettled',
        p.trackingUrl || null,
        p.notes || null,
        p.bookedAt ? new Date(p.bookedAt) : new Date()
      ]
    );
    return true;
  } catch (err: any) {
    console.error("[MYSQL] Error saving courier parcel to DB:", err.message);
    return false;
  }
}

export async function deleteCourierParcelFromDb(id: string): Promise<boolean> {
  if (!isMySqlConnected()) return false;
  try {
    await pool!.query("DELETE FROM courier_parcels WHERE id = ? OR consignment_id = ?", [id, id]);
    return true;
  } catch (err: any) {
    console.error("[MYSQL] Error deleting courier parcel from DB:", err.message);
    return false;
  }
}

export async function fetchCourierSettingsFromDb(): Promise<any | null> {
  if (!isMySqlConnected()) return null;
  try {
    const [rows]: any = await pool!.query("SELECT * FROM courier_settings WHERE id = 'primary' LIMIT 1");
    if (rows && rows.length > 0 && rows[0].config_json) {
      return JSON.parse(rows[0].config_json);
    }
    return null;
  } catch (err: any) {
    console.error("[MYSQL] Error fetching courier settings:", err.message);
    return null;
  }
}

export async function saveCourierSettingsToDb(settings: any): Promise<boolean> {
  if (!isMySqlConnected()) return false;
  try {
    await pool!.query(
      `INSERT INTO courier_settings (
        id, default_courier, auto_update_order_status, send_customer_sms,
        sender_name, sender_phone, sender_address, sender_district, config_json
      ) VALUES ('primary', ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        default_courier=VALUES(default_courier),
        auto_update_order_status=VALUES(auto_update_order_status),
        send_customer_sms=VALUES(send_customer_sms),
        sender_name=VALUES(sender_name),
        sender_phone=VALUES(sender_phone),
        sender_address=VALUES(sender_address),
        sender_district=VALUES(sender_district),
        config_json=VALUES(config_json)`,
      [
        settings.defaultCourier || 'Steadfast',
        settings.autoUpdateOrderStatus !== false,
        settings.sendCustomerSms !== false,
        settings.senderName || 'Taqwa Enterprise',
        settings.senderPhone || '01913955452',
        settings.senderAddress || null,
        settings.senderDistrict || 'Dhaka',
        JSON.stringify(settings)
      ]
    );
    return true;
  } catch (err: any) {
    console.error("[MYSQL] Error saving courier settings to DB:", err.message);
    return false;
  }
}

export async function fetchSystemSettingsFromDb(): Promise<any | null> {
  if (!isMySqlConnected()) return null;
  try {
    const [rows]: any = await pool!.query("SELECT settings_json FROM system_settings WHERE id = 'primary' LIMIT 1");
    if (rows && rows.length > 0 && rows[0].settings_json) {
      return JSON.parse(rows[0].settings_json);
    }
    return null;
  } catch (err: any) {
    console.error("[MYSQL] Error fetching system settings:", err.message);
    return null;
  }
}

export async function saveSystemSettingsToDb(settings: any): Promise<boolean> {
  if (!isMySqlConnected()) return false;
  try {
    await pool!.query(
      `INSERT INTO system_settings (id, settings_json)
       VALUES ('primary', ?)
       ON DUPLICATE KEY UPDATE 
         settings_json = VALUES(settings_json)`,
      [JSON.stringify(settings)]
    );
    return true;
  } catch (err: any) {
    console.error("[MYSQL] Error saving system settings to DB:", err.message);
    return false;
  }
}

export async function fetchCustomersFromDb(): Promise<any[] | null> {
  if (!isMySqlConnected()) return null;
  try {
    const [rows]: any = await pool!.query("SELECT * FROM customers ORDER BY created_at DESC");
    return rows.map((r: any) => ({
      id: r.id,
      contactId: r.contact_id || `CO${r.id.slice(-4)}`,
      businessName: r.business_name || '',
      name: r.name,
      creditLimit: r.credit_limit || 'No Limit',
      openingBalance: Number(r.opening_balance) || 0,
      advanceBalance: Number(r.advance_balance) || 0,
      addedOn: r.added_on || (r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB') : '15-10-2026'),
      address: r.address || '',
      mobile: r.mobile || '',
      email: r.email || '',
      alternateContact: r.alternate_contact || '',
      totalSaleDue: Number(r.total_sale_due) || 0,
      totalSellReturnDue: Number(r.total_sell_return_due) || 0,
      status: r.status || 'Active',
      notes: r.notes || '',
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString()
    }));
  } catch (err: any) {
    console.error("[MYSQL] Error fetching customers:", err.message);
    return null;
  }
}

export async function saveCustomerToDb(c: any): Promise<boolean> {
  if (!isMySqlConnected()) return false;
  try {
    await pool!.query(
      `INSERT INTO customers (
        id, contact_id, business_name, name, credit_limit, opening_balance,
        advance_balance, added_on, address, mobile, email, alternate_contact,
        total_sale_due, total_sell_return_due, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        contact_id=VALUES(contact_id),
        business_name=VALUES(business_name),
        name=VALUES(name),
        credit_limit=VALUES(credit_limit),
        opening_balance=VALUES(opening_balance),
        advance_balance=VALUES(advance_balance),
        added_on=VALUES(added_on),
        address=VALUES(address),
        mobile=VALUES(mobile),
        email=VALUES(email),
        alternate_contact=VALUES(alternate_contact),
        total_sale_due=VALUES(total_sale_due),
        total_sell_return_due=VALUES(total_sell_return_due),
        status=VALUES(status),
        notes=VALUES(notes)`,
      [
        c.id,
        c.contactId || c.id,
        c.businessName || '',
        c.name || 'Valued Customer',
        c.creditLimit !== undefined ? String(c.creditLimit) : 'No Limit',
        Number(c.openingBalance) || 0,
        Number(c.advanceBalance) || 0,
        c.addedOn || new Date().toLocaleDateString('en-GB'),
        c.address || '',
        c.mobile || c.phone || '',
        c.email || '',
        c.alternateContact || '',
        Number(c.totalSaleDue) || 0,
        Number(c.totalSellReturnDue) || 0,
        c.status || 'Active',
        c.notes || ''
      ]
    );
    return true;
  } catch (err: any) {
    console.error("[MYSQL] Error saving customer to DB:", err.message);
    return false;
  }
}

export async function deleteCustomerFromDb(id: string): Promise<boolean> {
  if (!isMySqlConnected()) return false;
  try {
    await pool!.query("DELETE FROM customers WHERE id = ?", [id]);
    return true;
  } catch (err: any) {
    console.error("[MYSQL] Error deleting customer from DB:", err.message);
    return false;
  }
}

export async function fetchSuppliersFromDb(): Promise<any[] | null> {
  if (!isMySqlConnected()) return null;
  try {
    const [rows]: any = await pool!.query("SELECT * FROM suppliers ORDER BY created_at DESC");
    return rows.map((r: any) => ({
      id: r.id,
      contactId: r.contact_id || `CO${r.id.slice(-4)}`,
      name: r.name,
      companyName: r.company || r.business_name || r.name,
      businessName: r.business_name || r.company || r.name,
      phone: r.phone || r.mobile || '',
      mobile: r.mobile || r.phone || '',
      email: r.email || '',
      address: r.address || '',
      creditLimit: r.credit_limit || 'No Limit',
      openingBalance: Number(r.opening_balance) || 0,
      advanceBalance: Number(r.advance_balance) || 0,
      addedOn: r.added_on || (r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB') : '15-10-2026'),
      totalPurchases: Number(r.balance) || 0,
      paidAmount: 0,
      dueBalance: Number(r.total_purchase_due) || Number(r.balance) || 0,
      totalPurchaseDue: Number(r.total_purchase_due) || Number(r.balance) || 0,
      totalPurchaseReturnDue: Number(r.total_purchase_return_due) || 0,
      status: r.status || 'Active',
      notes: r.notes || '',
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString()
    }));
  } catch (err: any) {
    console.error("[MYSQL] Error fetching suppliers:", err.message);
    return null;
  }
}

export async function saveSupplierToDb(s: any): Promise<boolean> {
  if (!isMySqlConnected()) return false;
  try {
    await pool!.query(
      `INSERT INTO suppliers (
        id, contact_id, name, phone, mobile, email, address, company, business_name,
        balance, credit_limit, opening_balance, advance_balance, added_on,
        total_purchase_due, total_purchase_return_due, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        contact_id=VALUES(contact_id),
        name=VALUES(name),
        phone=VALUES(phone),
        mobile=VALUES(mobile),
        email=VALUES(email),
        address=VALUES(address),
        company=VALUES(company),
        business_name=VALUES(business_name),
        balance=VALUES(balance),
        credit_limit=VALUES(credit_limit),
        opening_balance=VALUES(opening_balance),
        advance_balance=VALUES(advance_balance),
        added_on=VALUES(added_on),
        total_purchase_due=VALUES(total_purchase_due),
        total_purchase_return_due=VALUES(total_purchase_return_due),
        status=VALUES(status),
        notes=VALUES(notes)`,
      [
        s.id,
        s.contactId || s.id,
        s.name,
        s.phone || s.mobile || '',
        s.mobile || s.phone || '',
        s.email || '',
        s.address || '',
        s.companyName || s.businessName || '',
        s.businessName || s.companyName || '',
        Number(s.dueBalance) || Number(s.totalPurchases) || 0,
        s.creditLimit !== undefined ? String(s.creditLimit) : 'No Limit',
        Number(s.openingBalance) || 0,
        Number(s.advanceBalance) || 0,
        s.addedOn || new Date().toLocaleDateString('en-GB'),
        Number(s.dueBalance) || Number(s.totalPurchaseDue) || 0,
        Number(s.totalPurchaseReturnDue) || 0,
        s.status || 'Active',
        s.notes || ''
      ]
    );
    return true;
  } catch (err: any) {
    console.error("[MYSQL] Error saving supplier to DB:", err.message);
    return false;
  }
}

export async function deleteSupplierFromDb(id: string): Promise<boolean> {
  if (!isMySqlConnected()) return false;
  try {
    await pool!.query("DELETE FROM suppliers WHERE id = ?", [id]);
    return true;
  } catch (err: any) {
    console.error("[MYSQL] Error deleting supplier from DB:", err.message);
    return false;
  }
}

export async function exportDbToSql(): Promise<string> {
  if (!pool) {
    throw new Error("MySQL database is not connected.");
  }

  let sqlDump = `-- ======================================================\n`;
  sqlDump += `-- TAQWA ENTERPRISE - LIVE MYSQL DATABASE BACKUP\n`;
  sqlDump += `-- Exported At: ${new Date().toISOString()}\n`;
  sqlDump += `-- Backup Engine: Pure TypeScript Resilient Dump Utility\n`;
  sqlDump += `-- ======================================================\n\n`;
  sqlDump += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

  const tables = [
    'products',
    'users',
    'orders',
    'order_items',
    'courier_points',
    'courier_parcels',
    'courier_settings',
    'system_settings',
    'coupons',
    'categories',
    'suppliers',
    'customers',
    'purchases',
    'inventory_logs',
    'damages',
    'accounts_transactions',
    'expenses',
    'uploaded_files'
  ];

  for (const table of tables) {
    sqlDump += `-- ------------------------------------------------------\n`;
    sqlDump += `-- Table structure for table \`${table}\`\n`;
    sqlDump += `-- ------------------------------------------------------\n`;
    sqlDump += `DROP TABLE IF EXISTS \`${table}\`;\n`;

    try {
      const [showCreate] = await pool.query(`SHOW CREATE TABLE \`${table}\``) as any[];
      if (showCreate && showCreate[0] && showCreate[0]['Create Table']) {
        sqlDump += showCreate[0]['Create Table'] + ";\n\n";
      } else {
        throw new Error("No create table query returned.");
      }
    } catch (err: any) {
      sqlDump += `-- [Schema export failed, using standard fallback] \n`;
    }

    sqlDump += `-- Dumping data for table \`${table}\`\n`;
    try {
      const [rows] = await pool.query(`SELECT * FROM \`${table}\``) as any[];
      if (rows && rows.length > 0) {
        sqlDump += `LOCK TABLES \`${table}\` WRITE;\n`;
        for (const row of rows) {
          const keys = Object.keys(row).map(k => `\`${k}\``).join(', ');
          const values = Object.values(row).map(val => {
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'boolean') return val ? '1' : '0';
            if (typeof val === 'number') return String(val);
            if (typeof val === 'object') {
              return `'${JSON.stringify(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
            }
            const escaped = String(val).replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
              switch (char) {
                case "\0": return "\\0";
                case "\x08": return "\\b";
                case "\x09": return "\\t";
                case "\x1a": return "\\z";
                case "\n": return "\\n";
                case "\r": return "\\r";
                case "\"": return "\\\"";
                case "'": return "\\'";
                case "\\": return "\\\\";
                case "%": return "\\%";
                default: return char;
              }
            });
            return `'${escaped}'`;
          }).join(', ');
          sqlDump += `INSERT INTO \`${table}\` (${keys}) VALUES (${values});\n`;
        }
        sqlDump += `UNLOCK TABLES;\n\n`;
      } else {
        sqlDump += `-- No data rows found for \`${table}\`\n\n`;
      }
    } catch (dumpErr: any) {
      sqlDump += `-- Error exporting table data: ${dumpErr.message}\n\n`;
    }
  }

  sqlDump += `SET FOREIGN_KEY_CHECKS = 1;\n`;
  return sqlDump;
}
