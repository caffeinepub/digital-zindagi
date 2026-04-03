import { Eye, EyeOff, Loader2 } from "lucide-react";
import { motion } from "motion/react";
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

export default function LoginPage() {
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { actor } = useActor();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      // Check if logging in as manager (localStorage)
      const managers: {
        id: string;
        name: string;
        mobile: string;
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
        // Manager login
        login({
          userId: BigInt(0),
          name: managerMatch.name,
          role: "manager",
          mobile: managerMatch.mobile,
        });
        toast.success(`Welcome, Manager ${managerMatch.name}!`);
        navigate("/admin");
        return;
      }

      const user = await actor.login(mobile.trim(), hash);

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
      toast.success(`Welcome back, ${user.name}!`);
      if (user.role === UserRole.admin) navigate("/admin/pin");
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
      >
        {/* Header */}
        <div className="bg-emerald-header px-8 py-8">
          <Link
            to="/"
            className="text-white/70 text-sm hover:text-white mb-4 block"
          >
            &larr; Wapas Jao
          </Link>
          <h1 className="font-heading font-bold text-white text-3xl">
            Login Karein
          </h1>
          <p className="text-white/70 text-sm mt-1">
            Digital Zindagi mein swagat hai
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
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

          <div>
            <label
              className="block text-sm font-medium text-foreground mb-1.5"
              htmlFor="login-email"
            >
              Email (Optional - Super Admin ke liye)
            </label>
            <input
              id="login-email"
              data-ocid="login.input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address (optional)"
              className="w-full border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring bg-white"
              autoComplete="email"
            />
          </div>

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

          <button
            type="submit"
            data-ocid="login.submit_button"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Log In Ho Raha Hai..." : "Login Karein"}
          </button>

          <div className="flex items-center justify-between text-sm">
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
