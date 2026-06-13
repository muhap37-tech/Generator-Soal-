import React, { useState } from "react";
import { X, Mail, Shield, School, User, LogIn, Sparkles } from "lucide-react";
import { storageService } from "../lib/firebase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [role, setRole] = useState("Guru Kelas / Mapel");
  const [isMailLogin, setIsMailLogin] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    const result = await storageService.loginWithGoogle();
    setLoading(false);
    if (result.success) {
      onAuthSuccess(result.user);
      onClose();
    } else {
      alert("Gagal login dengan Google: " + result.error);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !fullName || !schoolName) {
      alert("Harap isi semua kolom!");
      return;
    }
    setLoading(true);
    const result = await storageService.loginWithEmail(email, `${fullName} (${role})`);
    // Save additional profile data offline
    localStorage.setItem(
      "user_profile_details",
      JSON.stringify({ fullName, schoolName, role, email })
    );
    setLoading(false);
    if (result.success) {
      onAuthSuccess(result.user);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        id="auth-modal"
        className="relative w-full max-w-md overflow-hidden rounded-2xl glass-card shadow-2xl border border-white/20 dark:border-slate-800/80 p-6 animate-scale-up"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 bg-blue-600/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xl font-display font-semibold text-slate-900 dark:text-white">
              Profil & Akses Guru
            </h3>
          </div>
          <button
            id="close-auth-modal"
            onClick={onClose}
            className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {!isMailLogin ? (
          <div className="space-y-5">
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Login untuk mengaktifkan Penyimpanan Cloud otomatis, melihat statistik penyusunan soal, dan melacak riwayat asesmen Anda.
            </p>

            <button
              id="google-login-btn"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-white font-medium border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm active:scale-98"
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg"
                alt="Google Logo"
                className="w-5 h-5"
              />
              <span>{loading ? "Menghubungkan..." : "Masuk dengan Google Workspace"}</span>
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              <span className="flex-shrink mx-4 text-xs text-slate-400 uppercase">Atau</span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            </div>

            <button
              id="alternate-login-btn"
              onClick={() => setIsMailLogin(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 dark:bg-blue-950 text-white dark:text-blue-100 hover:bg-slate-800 dark:hover:bg-blue-900 rounded-xl font-medium transition-all"
            >
              <Mail className="w-4 h-4" />
              <span>Gunakan Akun Belajar.id / Email</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                E-mail / Akun Belajar.id
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@guru.sd.belajar.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl font-sans text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Nama Lengkap & Gelar
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Muh. Asriwadi AP, S.Pd."
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl font-sans text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Nama Sekolah / Satpen
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="SD Negeri 1"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl font-sans text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <School className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Jabatan / Peran
                </label>
                <div className="relative">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full pl-9 pr-2 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl font-sans text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none"
                  >
                    <option value="Guru SD / Kelas">Guru SD / Kelas</option>
                    <option value="Guru SMP / Mapel">Guru SMP / Mapel</option>
                    <option value="Guru SMA / SMK">Guru SMA / SMK</option>
                    <option value="Kepala Sekolah / Pengawas">Kepala Sekolah / Pengawas</option>
                  </select>
                  <Shield className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                id="back-auth-modal"
                type="button"
                onClick={() => setIsMailLogin(false)}
                className="w-1/3 px-4 py-2.5 text-sm font-medium border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                disabled={loading}
              >
                Kembali
              </button>
              <button
                id="submit-auth-btn"
                type="submit"
                disabled={loading}
                className="w-2/3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>{loading ? "Menyimpan..." : "Simpan Profil & Masuk"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
