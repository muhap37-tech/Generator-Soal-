import React, { useState } from "react";
import { Sparkles, User, LogOut, LogIn, ChevronDown, Award } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface NavbarProps {
  user: any;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export default function Navbar({ user, onOpenAuth, onLogout }: NavbarProps) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Getting additional user metadata if present (for offline mode display enrichment)
  const getUserDisplayName = () => {
    if (!user) return "";
    const extra = localStorage.getItem("user_profile_details");
    if (extra && user.uid === "local-user-id") {
      const parsed = JSON.parse(extra);
      return parsed.fullName;
    }
    return user.displayName || user.email?.split("@")[0] || "Guru Indonesia";
  };

  const getUserSchool = () => {
    const extra = localStorage.getItem("user_profile_details");
    if (extra && user?.uid === "local-user-id") {
      const parsed = JSON.parse(extra);
      return parsed.schoolName;
    }
    return "Satuan Pendidikan";
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-card border-b border-slate-100/50 dark:border-slate-900/50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 dark:bg-blue-900 text-white rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center animate-pulse">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 dark:from-blue-400 dark:via-blue-300 dark:to-indigo-300 bg-clip-text text-transparent">
              Generator Soal AI
            </h1>
            <p className="hidden sm:block text-3xs font-mono tracking-wider uppercase text-slate-400 dark:text-slate-500 font-semibold">
              KISI-KISI • SOAL UJIAN • KUNCI JAWABAN
            </p>
          </div>
        </div>

        {/* Middle: Clear Watermark in Header (By Muh. Asriwadi AP) */}
        <div className="hidden md:flex items-center gap-2 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-900/40 px-3.5 py-1.5 rounded-full shadow-inner">
          <Award className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-mono text-blue-800 dark:text-blue-300 font-semibold">
            By Muh. Asriwadi AP
          </span>
        </div>

        {/* Right: Actions, Theme, & User Profile */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* User Auth Info / Dropdown */}
          {user ? (
            <div className="relative">
              <button
                id="profile-dropdown-trigger"
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2.5 p-1.5 pl-2.5 pr-3 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-800/80 rounded-xl transition-all shadow-sm focus:outline-none"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={getUserDisplayName()}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    {getUserDisplayName().charAt(0).toUpperCase()}
                  </div>
                )}
                
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 max-w-28 truncate">
                    {getUserDisplayName()}
                  </p>
                  <p className="text-4xs text-slate-400 font-semibold uppercase truncate max-w-28">
                    {getUserSchool()}
                  </p>
                </div>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {profileDropdownOpen && (
                <>
                  <div
                    onClick={() => setProfileDropdownOpen(false)}
                    className="fixed inset-0 z-45"
                  ></div>
                  <div className="absolute right-0 mt-2 w-52 rounded-xl glass-card border border-slate-250/60 dark:border-slate-800/80 shadow-xl p-2 z-50 animate-scale-up">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-850">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {getUserDisplayName()}
                      </p>
                      <p className="text-4xs text-slate-400 truncate">{user.email}</p>
                    </div>

                    <button
                      id="navbar-logout-btn"
                      onClick={() => {
                        onLogout();
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full mt-1.5 flex items-center gap-2.5 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Keluar Sesi</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              id="navbar-login-btn"
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-500/15 hover:shadow-blue-500/25 active:scale-98 transition-all"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Profil Guru / Masuk</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
