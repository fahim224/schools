"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import {
  ArrowRight,
  School,
  ShieldCheck,
  Users,
  BookOpen,
  LineChart,
  MessageCircle,
  Wallet,
  CheckCircle2,
  Sparkles,
  GraduationCap,
  Globe,
  Zap
} from "lucide-react";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, dir } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [whatsapp, setWhatsapp] = useState("0093780340446");

  useEffect(() => {
    setMounted(true);
    if (session) {
      router.push(`/dashboard/${(session.user as any).role?.toLowerCase()}`);
    }

    // Fetch schools for slider
    fetch("/api/schools/recent-logos")
      .then(res => res.json())
      .then(data => setSchools(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));

    // Fetch approved ads
    fetch("/api/schools/ads")
      .then(res => res.json())
      .then(data => setAds(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));

    // Fetch public settings for whatsapp
    fetch("/api/settings/public")
      .then(res => res.json())
      .then(data => {
        if (data.whatsappNumber) setWhatsapp(data.whatsappNumber);
      })
      .catch(err => console.error(err));
  }, [session, router]);


  if (!mounted) return null;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground selection:bg-primary/20">

      {/* 🌟 Hero Section Background Effects - Advanced Animation */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* Animated Gradient Meshes */}
        <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-r from-purple-500/30 to-blue-500/30 blur-[100px] animate-blob mix-blend-multiply filter dark:mix-blend-screen opacity-70"></div>
        <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-r from-cyan-500/30 to-emerald-500/30 blur-[100px] animate-blob animation-delay-2000 mix-blend-multiply filter dark:mix-blend-screen opacity-70"></div>
        <div className="absolute -bottom-[40%] left-[20%] w-[80%] h-[80%] rounded-full bg-gradient-to-r from-pink-500/30 to-orange-500/30 blur-[100px] animate-blob animation-delay-4000 mix-blend-multiply filter dark:mix-blend-screen opacity-70"></div>

        {/* Dynamic Grid Pattern */}
        <div className="absolute inset-0 bg-[url('/images/grid.svg')] bg-center [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)] opacity-20 dark:opacity-10 animate-pulse-slow"></div>

        {/* Floating Particles/Dots */}
        <div className="absolute inset-0 opacity-30 dark:opacity-20">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-foreground rounded-full animate-float-slow"></div>
          <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-primary rounded-full animate-float-medium"></div>
          <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-secondary rounded-full animate-float-fast"></div>
          <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-accent rounded-full animate-float-slow delay-1000"></div>
        </div>
      </div>

      {/* 🚀 Main Hero Content */}
      <div className="container mx-auto px-4 pt-10 pb-20 relative z-10 flex flex-col items-center">

        {/* Glass Card Container */}
        <div className="relative max-w-full mx-auto">
          {/* Glow / Border Effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-[2.5rem] blur opacity-30 animate-tilt"></div>

          <div className="relative rounded-[2rem] bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/20 shadow-2xl p-8 md:p-16 text-center overflow-hidden">

            {/* Internal Ambient Lights */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] -translate-y-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] translate-y-1/2 pointer-events-none"></div>

            {/* Badge */}
            <div className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-black/50 border border-primary/20 text-primary mb-8 shadow-sm backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <Sparkles size={16} />
              <span className="text-sm font-bold tracking-wide">نسل جدید مدیریت آموزشی</span>
            </div>

            {/* Title */}
            <h1 className="relative text-6xl md:text-8xl font-black tracking-tight mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 drop-shadow-sm">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400">
                {t.app_name}
              </span>
              <br />
              <span className="text-4xl md:text-6xl text-foreground/90 mt-4 block">
                آینده‌ی روشن مکاتب
              </span>
            </h1>

            {/* Description */}
            <p className="relative max-w-5xl mx-auto text-xl md:text-2xl text-muted-foreground leading-relaxed mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
              {t.home_page.description}
              <br className="hidden md:block" />
              یک پلتفرم جامع برای مدیریت هوشمند، سریع و شفاف مدارس افغانستان.
            </p>

            {/* Buttons */}
            {!session && (
              <div className="relative flex flex-col sm:flex-row items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
                <Link
                  href="/auth/signin"
                  className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-lg font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {t.login} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform rtl:group-hover:-translate-x-1" />
                  </span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                </Link>

                <Link
                  href="/register"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-white/50 dark:bg-black/50 backdrop-blur-sm border border-border text-foreground rounded-full text-lg font-bold hover:bg-white/80 dark:hover:bg-black/80 transition-all duration-300 hover:scale-105"
                >
                  {t.register}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 📢 Featured Schools / Advertisements */}
        {ads.length > 0 && (
          <div className="mt-20 w-full max-w-7xl mx-auto px-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-1000">
            <div className="text-center mb-12">
              <span className="text-sm font-bold text-primary bg-primary/10 px-4 py-2 rounded-full mb-4 inline-block">برترین های ماه</span>
              <h2 className="text-3xl md:text-5xl font-black mb-4">مدارس نمونه و پیشتاز</h2>
              <p className="text-muted-foreground">با امکانات و خدمات آموزشی برتر این مدارس آشنا شوید.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {ads.map((ad, i) => (
                <div key={ad.id} className="group relative rounded-3xl overflow-hidden bg-card border border-border hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 hover:-translate-y-2">
                  {/* Image Banner */}
                  <div className="h-48 w-full bg-muted relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                    {ad.adBanner ? (
                      <img src={ad.adBanner} alt={ad.schoolName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/5">
                        <School size={64} className="text-primary/20" />
                      </div>
                    )}
                    {/* Badge */}
                    <div className="absolute top-4 right-4 z-20 bg-white/90 dark:bg-black/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-green-500" />
                      تایید شده
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 relative">
                    <div className="absolute -top-10 right-6 w-16 h-16 rounded-2xl bg-card border-4 border-card shadow-lg overflow-hidden flex items-center justify-center p-2 z-20">
                      {ad.schoolLogo ? (
                        <img src={ad.schoolLogo} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <School size={32} className="text-muted-foreground" />
                      )}
                    </div>

                    <div className="mt-4">
                      <h3 className="text-xl font-bold mb-2 line-clamp-1">{ad.adTitle || ad.schoolName}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
                        {ad.adDescription || "توضیحات بیشتری برای این مدرسه ثبت نشده است."}
                      </p>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                        <Globe size={14} />
                        <span className="truncate max-w-[200px]">{ad.schoolAddress || "آدرس ثبت نشده"}</span>
                      </div>

                      <div className="flex gap-2">
                        <a
                          href={`https://wa.me/${ad.whatsappNumber?.replace(/\+/g, '')}`}
                          target="_blank"
                          className="flex-1 bg-primary/10 hover:bg-primary text-primary hover:text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                        >
                          <MessageCircle size={16} />
                          تماس
                        </a>
                        <button className="flex-1 border border-border hover:bg-muted px-4 py-2.5 rounded-xl font-bold text-sm transition-colors">
                          مشاهده جزئیات
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 🌟 3D Stats/Floating Cards */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl w-full mx-auto animate-in fade-in zoom-in-50 duration-1000 delay-700">
          {[
            { label: 'رضایت کاربران', value: '98%', icon: CheckCircle2, bg: 'bg-green-500/10', color: 'text-green-500' },
            { label: 'مکاتب فعال', value: '+50', icon: School, bg: 'bg-blue-500/10', color: 'text-blue-500' },
            { label: 'شاگردان', value: '+10k', icon: Users, bg: 'bg-purple-500/10', color: 'text-purple-500' },
            { label: 'آپتایم', value: '99.9%', icon: Zap, bg: 'bg-orange-500/10', color: 'text-orange-500' },
          ].map((stat, i) => (
            <div key={i} className="p-6 rounded-3xl bg-card/ border border-white/5 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all text-center group">
              <div className={`mx-auto w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} />
              </div>
              <h3 className="text-3xl font-black text-foreground mb-1">{stat.value}</h3>
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 🏫 Schools Grid */}
      {schools.length > 0 && (
        <div className="w-full py-16 bg-gradient-to-b from-slate-50/0 via-slate-50/50 to-slate-50/0 dark:from-slate-900/0 dark:via-slate-900/50 dark:to-slate-900/0 border-y border-border/50 backdrop-blur-sm overflow-hidden">
          <div className="container mx-auto text-center mb-10">
            <span className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground bg-background/50 px-4 py-1 rounded-full border border-border/100 text-4xl md:text-5xl font-black mb-6">مورد اعتماد برترین مکاتب کشور</span>
          </div>

          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 transition-all">
              {schools.map((school, i) => (
                <div
                  key={school.id || i}
                  className="group relative flex flex-col items-center gap-3 p-6 rounded-3xl bg-background/40 hover:bg-background/80 border border-border/50 hover:border-primary/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10 animate-in fade-in zoom-in-50"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="h-16 w-16 flex items-center justify-center p-2 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-500">
                    {school.image ? (
                      <img src={school.image} alt={school.name} className="h-full w-full object-contain" />
                    ) : (
                      <School className="text-muted-foreground" />
                    )}
                  </div>
                  <span className="font-bold text-sm text-muted-foreground group-hover:text-primary transition-colors">{school.name}</span>
                  {school.phone && (
                    <span className="text-xs text-muted-foreground/50">{school.phone}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ✨ Features Grid */}
      <div className="container mx-auto px-4 py-32">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-black mb-6">امکانات فوق‌العاده</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">ما تمام ابزارهای لازم برای مدیریت یک مکتب مدرن را در اختیار شما قرار می‌دهیم.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: t.home_page.feature_superadmin_title, desc: t.home_page.feature_superadmin_desc, icon: ShieldCheck, gradient: 'from-blue-500 to-cyan-500' },
            { title: t.home_page.feature_admin_title, desc: t.home_page.feature_admin_desc, icon: School, gradient: 'from-purple-500 to-pink-500' },
            { title: t.home_page.feature_collab_title, desc: t.home_page.feature_collab_desc, icon: Users, gradient: 'from-orange-500 to-amber-500' },
            { title: 'گزارش‌دهی هوشمند', desc: 'تولید کارنامه‌ها و گزارشات مدیریتی با یک کلیک.', icon: LineChart, gradient: 'from-emerald-500 to-teal-500' },
            { title: 'ارتباطات زنده', desc: 'چت اختصاصی بین والدین، معلمان و مدیران.', icon: MessageCircle, gradient: 'from-rose-500 to-red-500' },
            { title: 'مدیریت مالی', desc: 'سیستم حسابداری شفاف و دقیق برای شهریه‌ها.', icon: Wallet, gradient: 'from-indigo-500 to-blue-500' },
          ].map((feature, i) => (
            <div key={i} className="group relative p-8 rounded-[2rem] border border-border bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2">
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-[2rem] transition-opacity`}></div>
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 🚀 Call to Action / WhatsApp */}
      <div className="container mx-auto px-4 pb-32">
        <div className="relative rounded-[3rem] overflow-hidden bg-gradient-to-r from-blue-900 to-slate-900 text-white p-12 md:p-24 text-center shadow-2xl">
          <div className="absolute inset-0 bg-[url('/images/grid.svg')] opacity-10"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>

          <div className="relative z-10 max-w-4xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
              آماده‌اید مدرسه خود را متحول کنید؟
            </h2>
            <p className="text-xl md:text-2xl text-blue-100 mb-8">
              همین امروز با ما تماس بگیرید و نسخه دمو را رایگان دریافت کنید. تیم پشتیبانی ما ۲۴/۷ در کنار شماست.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <a
                href={`https://wa.me/${whatsapp.replace(/\+/g, '')}`}
                target="_blank"
                className="inline-flex items-center gap-3 px-8 py-5 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full text-xl font-bold shadow-xl hover:scale-105 transition-all"
              >
                <MessageCircle size={24} />
                مشاوره رایگان در واتساپ
              </a>
              <Link
                href="/register"
                className="inline-flex items-center gap-3 px-8 py-5 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white rounded-full text-xl font-bold transition-all"
              >
                ثبت نام آنلاین
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Floating CTA */}
      <a
        href={`https://wa.me/${whatsapp.replace(/\+/g, '')}`}
        target="_blank"
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-[#25D366] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 hover:rotate-12 transition-all duration-300 animate-bounce"
        title="پشتیبانی آنلاین"
      >
        <MessageCircle size={32} />
      </a>

    </div>
  );
}
