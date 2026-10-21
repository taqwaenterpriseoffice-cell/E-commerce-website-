import React, { useState } from "react";
import { 
  Database, 
  Server, 
  User, 
  Lock, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Trash2, 
  Sparkles,
  ArrowRight
} from "lucide-react";

interface InstallWizardProps {
  onSuccess: () => void;
}

export default function InstallWizard({ onSuccess }: InstallWizardProps) {
  // Setup inputs
  const [host, setHost] = useState("localhost");
  const [port, setPort] = useState("3306");
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [database, setDatabase] = useState("");
  
  // Super Admin setup
  const [adminEmail, setAdminEmail] = useState("taqwaenterpriseoffice@gmail.com");
  const [adminPassword, setAdminPassword] = useState("");
  
  // Additional choices
  const [clearDemoData, setClearDemoData] = useState(true);
  
  // Form view states
  const [showDbPassword, setShowDbPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  
  // Action status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [installStep, setInstallStep] = useState<"idle" | "connecting" | "migrating" | "admin" | "completed">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleInstall = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);
    setInstallStep("connecting");

    try {
      // Step 1: Connecting to MySQL & Saving config
      const response = await fetch("/api/system/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host,
          port,
          user,
          password,
          database,
          adminEmail,
          adminPassword,
          clearDemoData
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Database installation failed.");
      }

      // Step 2: Show animated transition of installation success
      setInstallStep("migrating");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setInstallStep("admin");
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setInstallStep("completed");
      setIsSubmitting(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "কানেকশন ব্যর্থ হয়েছে। অনুগ্রহ করে আপনার হোস্টিংগারের ডাটাবেজ ক্রেডেনশিয়াল পুনরায় চেক করুন।");
      setInstallStep("idle");
      setIsSubmitting(false);
    }
  };

  if (installStep === "completed") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 antialiased">
        <div className="bg-white rounded-2xl border border-slate-200/95 shadow-xl max-w-md w-full p-8 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 animate-bounce">
            <CheckCircle className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-800">ইন্সটলেশন সফল হয়েছে!</h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              তাকওয়া এন্টারপ্রাইজ ডাটাবেজ সফলভাবে কানেক্ট হয়েছে এবং প্রয়োজনীয় টেবিলগুলো হোস্টিংগার MySQL সার্ভারে তৈরি হয়েছে।
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 text-left border border-slate-100 space-y-2 text-xs text-slate-600">
            <div className="flex justify-between">
              <span className="font-medium">ডাটাবেজ হোস্ট:</span>
              <span className="font-mono text-slate-800">{host}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">ডাটাবেজ নাম:</span>
              <span className="font-mono text-slate-800">{database}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">মাস্টার অ্যাডমিন:</span>
              <span className="font-mono text-slate-800">{adminEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">ইন্সটলেশন লক:</span>
              <span className="text-emerald-600 font-semibold">সক্রিয় (Locked)</span>
            </div>
          </div>

          <button
            onClick={onSuccess}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-xl transition duration-200 shadow-sm"
          >
            <span>তাকওয়া স্টোরে প্রবেশ করুন</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 antialiased">
      <div className="bg-white rounded-2xl border border-slate-200/95 shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Banner header with Taqwa branding */}
        <div className="bg-slate-900 px-8 py-6 text-white relative">
          <div className="absolute right-6 top-6 opacity-10">
            <Database className="w-24 h-24" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> Web Installer Wizard
              </div>
              <h1 className="text-2xl font-bold font-serif text-slate-50">তাকওয়া এন্টারপ্রাইজ</h1>
              <p className="text-xs text-slate-300 font-sans">
                হোস্টিংগার (Hostinger) MySQL ডাটাবেজ ও মাস্টার অ্যাডমিন অটোমেটিক সেটআপ ও কনফিগারেশন সিস্টেম
              </p>
            </div>
            <button
              type="button"
              onClick={onSuccess}
              className="self-start sm:self-auto px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <span>সরাসরি মূল ওয়েবসাইটে যান &rarr;</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleInstall} className="p-8 space-y-6">
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200/80 rounded-xl flex gap-3 text-rose-700 text-sm leading-relaxed">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-semibold">ডাটাবেজ কানেকশন ব্যর্থ হয়েছে!</p>
                <p className="text-xs mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {isSubmitting ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" />
              <div className="text-center">
                <h3 className="font-semibold text-slate-800">
                  {installStep === "connecting" && "হোস্টিংগার MySQL সার্ভারের সাথে সংযোগ করা হচ্ছে..."}
                  {installStep === "migrating" && "টেবিল ও ডাটাবেজ স্কিমা তৈরি করা হচ্ছে..."}
                  {installStep === "admin" && "মাস্টার অ্যাডমিন অ্যাকাউন্ট কনফিগার করা হচ্ছে..."}
                </h3>
                <p className="text-xs text-slate-400 mt-1">দয়া করে ব্রাউজার রিফ্রেশ বা বন্ধ করবেন না।</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Section 1: Database Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Database className="w-5 h-5 text-emerald-600" />
                  <h2 className="font-semibold text-slate-800">১. MySQL ডাটাবেজ কনফিগারেশন</h2>
                </div>
                
                <p className="text-xs text-slate-500">
                  আপনার Hostinger hPanel-এর <span className="font-semibold">Databases &gt; Management</span> সেকশন থেকে তৈরিকৃত MySQL ডাটাবেজের তথ্যগুলো এখানে প্রদান করুন।
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Host */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Database Host</label>
                    <div className="relative">
                      <Server className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={host}
                        onChange={(e) => setHost(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        placeholder="localhost"
                      />
                    </div>
                  </div>

                  {/* Port */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Port</label>
                    <input
                      type="text"
                      required
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                      placeholder="3306"
                    />
                  </div>

                  {/* Database Name */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-600">Database Name (ডাটাবেজ নাম)</label>
                    <input
                      type="text"
                      required
                      value={database}
                      onChange={(e) => setDatabase(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                      placeholder="u123456789_taqwadb"
                    />
                  </div>

                  {/* Username */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Database User (ব্যবহারকারীর নাম)</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={user}
                        onChange={(e) => setUser(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                        placeholder="u123456789_taqwauser"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Database Password (পাসওয়ার্ড)</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type={showDbPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-10 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                        placeholder="•••••••••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowDbPassword(!showDbPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showDbPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Master Admin Credentials */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <User className="w-5 h-5 text-emerald-600" />
                  <h2 className="font-semibold text-slate-800">২. মাস্টার অ্যাডমিন অ্যাকাউন্ট কনফিগারেশন</h2>
                </div>

                <p className="text-xs text-slate-500">
                  আপনার তাকওয়া অ্যাডমিন প্যানেলে লগইন করার জন্য আপনার পছন্দের মাস্টার ইমেইল এবং পাসওয়ার্ড নির্ধারণ করুন।
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Admin Email */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Super Admin Email (ইমেইল)</label>
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                      placeholder="taqwaenterpriseoffice@gmail.com"
                    />
                  </div>

                  {/* Admin Password */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Super Admin Password (পাসওয়ার্ড)</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type={showAdminPassword ? "text" : "password"}
                        required
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-10 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                        placeholder="কমপক্ষে ৬ ডিজিটের পাসওয়ার্ড"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Clean slate choice */}
              <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-4 flex gap-3 items-start">
                <Trash2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-amber-900">৩. ক্লিন ইন্সটলেশন প্রসেস (ক্লিন ডেমো ডেটা)</h4>
                  <p className="text-xs text-amber-800/90 leading-relaxed">
                    নিচের অপশনটি সক্রিয় থাকলে ডাটাবেজের সব টেস্ট বা ডেমো পণ্য এবং ভুয়া অর্ডার মুছে দিয়ে একদম শূন্য থেকে ফ্রেশ স্টোর হিসেবে ওয়েবসাইটটি শুরু হবে।
                  </p>
                  <label className="flex items-center gap-2 cursor-pointer mt-1 select-none">
                    <input
                      type="checkbox"
                      checked={clearDemoData}
                      onChange={(e) => setClearDemoData(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span className="text-xs font-semibold text-amber-950">
                      হ্যাঁ, সব ডেমো ডাটা মুছে ফ্রেশ এবং পরিচ্ছন্নভাবে স্টোর শুরু করতে চাই।
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl transition duration-200 shadow-md"
              >
                <span>কানেক্ট এবং ইন্সটলেশন সম্পন্ন করুন</span>
                <ArrowRight className="w-4.5 h-4.5" />
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
