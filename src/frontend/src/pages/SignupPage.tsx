import { Briefcase, Eye, EyeOff, Loader2, QrCode, User2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { UserRole } from "../backend";
import { ALL_CATEGORIES } from "../components/CategoryGrid";
import {
  SUPER_ADMIN_EMAIL,
  hashPassword,
  useAuth,
} from "../contexts/AuthContext";
import { useActor } from "../hooks/useActor";
import { useAdminConfig } from "../hooks/useQueries";
import { Link, useNavigate } from "../lib/router";

const SECURITY_QUESTIONS = [
  "Best Friend Ka Naam",
  "Maa Ka Naam",
  "Pet Ka Naam",
  "Favourite City",
  "School Ka Naam",
];

// Merge static + admin-created categories
function getCategories(): { name: string; emoji: string }[] {
  const staticCats = ALL_CATEGORIES.map((c) => ({
    name: c.name,
    emoji: c.emoji,
  }));
  try {
    const custom = JSON.parse(
      localStorage.getItem("dz_categories") ?? "[]",
    ) as {
      name: string;
      emoji: string;
    }[];
    const existing = new Set(staticCats.map((c) => c.name.toLowerCase()));
    const merged = [
      ...staticCats,
      ...custom.filter((c) => !existing.has(c.name.toLowerCase())),
    ];
    return merged;
  } catch {
    return staticCats;
  }
}

export default function SignupPage() {
  const [role, setRole] = useState<"customer" | "provider">("customer");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [secQ, setSecQ] = useState(SECURITY_QUESTIONS[0]);
  const [secA, setSecA] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("");

  const { login } = useAuth();
  const { actor } = useActor();
  const { data: adminConfig } = useAdminConfig();
  const navigate = useNavigate();
  const categories = getCategories();

  // Admin QR toggle
  const showRegistrationQR = (() => {
    try {
      const val = localStorage.getItem("dz_show_registration_qr");
      return val === null ? true : val === "true";
    } catch {
      return true;
    }
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !mobile || !password || !secA) {
      toast.error("Sab fields bharna zaroori hai");
      return;
    }
    if (password !== confirmPwd) {
      toast.error("Passwords match nahi kar rahe");
      return;
    }
    if (password.length < 6) {
      toast.error("Password kam se kam 6 characters ka hona chahiye");
      return;
    }
    if (role === "provider" && !category) {
      toast.error("Provider ke liye category select karna zaroori hai");
      return;
    }
    if (!actor) {
      toast.error("Backend se connect nahi, thoda wait karein");
      return;
    }
    setLoading(true);
    try {
      const hash = await hashPassword(password);
      const userRole =
        role === "provider" ? UserRole.provider : UserRole.customer;
      await actor.registerUser(name, mobile, hash, userRole, secQ, secA);
      // Auto login after registration
      const user = await actor.login(mobile, hash);
      const isSuperAdmin =
        email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
      login({
        userId: user.id,
        name: user.name,
        role: user.role,
        mobile: user.mobile,
        email: email.trim() || undefined,
        isSuperAdmin,
      });
      // Set category on provider profile
      if (role === "provider" && category) {
        try {
          await actor.updateProviderProfile(user.id, name, "", "", category);
        } catch {
          // Non-critical, continue
        }
      }
      toast.success("Account ban gaya!");
      if (role === "provider") navigate("/provider/choose-plan");
      else navigate("/");
    } catch (err: any) {
      toast.error(
        err?.message ?? "Registration fail ho gaya. Dobara try karein.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-hero flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-emerald-header px-8 py-7">
          <Link
            to="/"
            className="text-white/70 text-sm hover:text-white mb-3 block"
          >
            &larr; Wapas Jao
          </Link>
          <h1 className="font-heading font-bold text-white text-3xl">
            Account Banao
          </h1>
          <p className="text-white/70 text-sm mt-1">
            Digital Zindagi family mein shamil ho
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-7 space-y-5">
          {/* Role selector */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">
              Aap kaun hain?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                data-ocid="signup.toggle"
                onClick={() => setRole("customer")}
                className={`flex items-center gap-2 justify-center p-3 rounded-xl border-2 transition-all text-sm font-semibold ${
                  role === "customer"
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                <User2 size={16} /> Customer
              </button>
              <button
                type="button"
                data-ocid="signup.toggle"
                onClick={() => setRole("provider")}
                className={`flex items-center gap-2 justify-center p-3 rounded-xl border-2 transition-all text-sm font-semibold ${
                  role === "provider"
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                <Briefcase size={16} /> Provider
              </button>
            </div>
          </div>

          {/* Category dropdown — only for providers */}
          {role === "provider" && (
            <div>
              <label
                className="block text-sm font-medium text-foreground mb-1.5"
                htmlFor="service-category"
              >
                Service Category <span className="text-destructive">*</span>
              </label>
              <select
                id="service-category"
                data-ocid="signup.select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring bg-white"
                required
              >
                <option value="" disabled>
                  Category chunein...
                </option>
                {categories.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label
              className="block text-sm font-medium text-foreground mb-1.5"
              htmlFor="name"
            >
              Pura Naam
            </label>
            <input
              id="name"
              data-ocid="signup.input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Apna naam daalein"
              className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              autoComplete="name"
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium text-foreground mb-1.5"
              htmlFor="mobile"
            >
              Mobile Number
            </label>
            <input
              id="mobile"
              data-ocid="signup.input"
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="10 digit mobile number"
              className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              autoComplete="tel"
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium text-foreground mb-1.5"
              htmlFor="signup-email"
            >
              Email (Optional)
            </label>
            <input
              id="signup-email"
              data-ocid="signup.input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address (optional)"
              className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              autoComplete="email"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="block text-sm font-medium text-foreground mb-1.5"
                htmlFor="pwd"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="pwd"
                  data-ocid="signup.input"
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label
                className="block text-sm font-medium text-foreground mb-1.5"
                htmlFor="cpwd"
              >
                Confirm Password
              </label>
              <input
                id="cpwd"
                data-ocid="signup.input"
                type={showPwd ? "text" : "password"}
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                placeholder="Dobara daalein"
                className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div>
            <label
              className="block text-sm font-medium text-foreground mb-1.5"
              htmlFor="secq"
            >
              Security Question
            </label>
            <select
              id="secq"
              data-ocid="signup.select"
              value={secQ}
              onChange={(e) => setSecQ(e.target.value)}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring bg-white"
            >
              {SECURITY_QUESTIONS.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="block text-sm font-medium text-foreground mb-1.5"
              htmlFor="seca"
            >
              Security Answer
            </label>
            <input
              id="seca"
              data-ocid="signup.input"
              type="text"
              value={secA}
              onChange={(e) => setSecA(e.target.value)}
              placeholder="Jawab likhein"
              className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Registration QR from admin config */}
          {showRegistrationQR && adminConfig?.qrCodeBlobId && (
            <div className="bg-accent rounded-2xl p-4 text-center">
              <p className="text-sm font-medium text-foreground mb-1">
                <QrCode
                  size={14}
                  className="inline mr-1.5 -mt-0.5 text-primary"
                />
                Subscription Payment QR
              </p>
              <img
                src={adminConfig.qrCodeBlobId.getDirectURL()}
                alt="Admin UPI QR"
                className="w-32 h-32 mx-auto object-contain"
              />
              {adminConfig.upiId && (
                <p className="text-xs text-muted-foreground mt-1">
                  UPI: {adminConfig.upiId}
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            data-ocid="signup.submit_button"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Account Ban Raha Hai..." : "Account Banao"}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            Pehle se account hai?{" "}
            <Link
              to="/login"
              className="text-primary font-semibold hover:underline"
            >
              Login Karein
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
