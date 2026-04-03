// V72: Admin credentials — change these to match your setup
const ADMIN_PASSWORD = "Admin@2024";
const ADMIN_PIN = "786786";

import { Eye, EyeOff, Loader2, Lock, Mail, Phone, Star } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { UserRole } from "../backend";
import {
  SUPER_ADMIN_EMAIL,
  hashPassword,
  useAuth,
} from "../contexts/AuthContext";
import { useActor } from "../hooks/useActor";
import { Link, useNavigate } from "../lib/router";

type LoginMode = "mobile" | "email";

export default function LoginPage() {
  const [mode, setMode] = useState<LoginMode>("mobile");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secretPin, setSecretPin] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { actor } = useActor();
  const navigate = useNavigate();

  const isSuperAdminEmail =
    email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "email") {
      if (!email.trim() || !password.trim()) {
        toast.error("Email aur password dono zaroori hain");
        return;
      }

      setLoading(true);
      try {
        // Super Admin — 3-step validation
        if (isSuperAdminEmail) {
          if (password !== ADMIN_PASSWORD) {
            toast.error("Galat password!");
            return;
          }
          if (secretPin !== ADMIN_PIN) {
            toast.error("Galat Secret PIN!");
            return;
          }
          login({
            userId: BigInt(0),
            name: "Super Admin",
            role: "admin" as UserRole,
            mobile: "",
            email: SUPER_ADMIN_EMAIL,
            isSuperAdmin: true,
          });
          sessionStorage.setItem("adminVerified", "true");
          toast.success("Welcome, Super Admin!");
          navigate("/admin");
          return;
        }

        // Manager email login
        const hash = await hashPassword(password);
        const managers: {
          id: string;
          name: string;
          mobile: string;
          email: string;
          password: string;
        }[] = (() => {
          try {
            return JSON.parse(localStorage.getItem("dz_managers") ?? "[]");
          } catch {
            return [];
          }
        })();

        const managerMatch = managers.find(
          (m) =>
            m.email?.toLowerCase() === email.trim().toLowerCase() &&
            m.password === hash,
        );

        if (managerMatch) {
          login({
            userId: BigInt(0),
            name: managerMatch.name,
            role: "manager",
            mobile: managerMatch.mobile,
            email: managerMatch.email,
          });
          toast.success(`Welcome, Manager ${managerMatch.name}!`);
          navigate("/manager");
          return;
        }

        toast.error("Email se koi account nahi mila. Mobile se login karein.");
      } catch (err: any) {
        toast.error(err?.message ?? "Login fail ho gaya");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Mobile login path
    if (!mobile.trim() || !password.trim()) {
      toast.error("Mobile aur password dono zaroori hain");
      return;
    }
    if (!actor) {
      toast.error("Backend se connect nahi ho pa raha, thoda wait karein");
      return;
    }
    setLoading(true);
    try {
      const hash = await hashPassword(password);

      // Check manager by mobile
      const managers: {
        id: string;
        name: string;
        mobile: string;
        email: string;
        password: string;
      }[] = (() => {
        try {
          return JSON.parse(localStorage.getItem("dz_managers") ?? "[]");
        } catch {
          return [];
        }
      })();

      const managerMatch = managers.find(
        (m) => m.mobile === mobile.trim() && m.password === hash,
      );

      if (managerMatch) {
        login({
          userId: BigInt(0),
          name: managerMatch.name,
          role: "manager",
          mobile: managerMatch.mobile,
          email: managerMatch.email,
        });
        toast.success(`Welcome, Manager ${managerMatch.name}!`);
        navigate("/manager");
        return;
      }

      const user = await actor.login(mobile.trim(), hash);

      login({
        userId: user.id,
        name: user.name,
        role: user.role,
        mobile: user.mobile,
        email: undefined,
        isSuperAdmin: false,
      });
      toast.success(`Welcome back, ${user.name}!`);
      if (user.role === UserRole.admin) navigate("/admin");
      else if (user.role === UserRole.provider) navigate("/provider/dashboard");
      else navigate("/");
    } catch (err: any) {
      toast.error(err?.message ?? "Login fail ho gaya. Dobara try karein.");
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
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        data-ocid="login.card"
      >
        {/* Header */}
        <div className="bg-emerald-header px-8 py-8">
          <Link
            to="/"
            data-ocid="login.link"
            className="text-white/70 text-sm hover:text-white mb-4 block"
          >
            &larr; Wapas Jao
          </Link>
          {/* Digital Zindagi Logo */}
          <div className="flex justify-center mb-4">
            <img
              src="/logo.png"
              alt="Digital Zindagi Logo"
              className="w-16 h-16 rounded-full object-cover"
            />
          </div>
          <h1 className="font-heading font-bold text-white text-3xl">
            Login Karein
          </h1>
          <p className="text-white/70 text-sm mt-1">
            Digital Zindagi mein swagat hai
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="px-8 pt-6 pb-0">
          <div className="flex gap-1 bg-muted rounded-xl p-1">
            <button
              type="button"
              data-ocid="login.tab"
              onClick={() => setMode("mobile")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === "mobile"
                  ? "bg-white text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Phone size={14} />
              Mobile Se Login
            </button>
            <button
              type="button"
              data-ocid="login.tab"
              onClick={() => setMode("email")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === "email"
                  ? "bg-white text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Mail size={14} />
              Email Se Login
            </button>
          </div>

          {/* Super Admin badge */}
          {mode === "email" && isSuperAdminEmail && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 flex items-center gap-2 bg-accent border border-primary/20 rounded-xl px-3 py-2"
            >
              <Star size={14} className="text-primary flex-shrink-0" />
              <p className="text-xs text-primary font-semibold">
                Super Admin — 3-Step Secure Login
              </p>
            </motion.div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
          {mode === "mobile" ? (
            <div>
              <label
                className="block text-sm font-medium text-foreground mb-1.5"
                htmlFor="mobile"
              >
                Mobile Number
              </label>
              <input
                id="mobile"
                data-ocid="login.input"
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Apna mobile number daalein"
                className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring bg-white"
                autoComplete="tel"
              />
            </div>
          ) : (
            <div>
              <label
                className="block text-sm font-medium text-foreground mb-1.5"
                htmlFor="login-email"
              >
                Email Address
              </label>
              <input
                id="login-email"
                data-ocid="login.input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address daalein"
                className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring bg-white"
                autoComplete="email"
              />
            </div>
          )}

          <div>
            <label
              className="block text-sm font-medium text-foreground mb-1.5"
              htmlFor="password"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                data-ocid="login.input"
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Apna password daalein"
                className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring bg-white pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Secret PIN — only for Super Admin email in email mode */}
          <AnimatePresence>
            {mode === "email" && isSuperAdminEmail && (
              <motion.div
                key="secret-pin"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
              >
                <label
                  className="block text-sm font-medium text-foreground mb-1.5"
                  htmlFor="secret-pin"
                >
                  Secret PIN (Admin Only)
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  />
                  <input
                    id="secret-pin"
                    data-ocid="login.input"
                    type="password"
                    inputMode="text"
                    value={secretPin}
                    onChange={(e) => setSecretPin(e.target.value)}
                    placeholder="Secret PIN daalein"
                    className="w-full border border-primary/40 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring bg-accent/30"
                    autoComplete="one-time-code"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            data-ocid="login.submit_button"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Log In Ho Raha Hai..." : "Login Karein"}
          </button>

          <div className="flex items-center justify-between text-sm flex-wrap gap-2">
            <Link
              to="/forgot-password"
              data-ocid="login.link"
              className="text-primary hover:underline"
            >
              Password Bhool Gaye?
            </Link>
            <Link
              to="/signup"
              data-ocid="login.link"
              className="text-primary hover:underline"
            >
              Account Banao
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
