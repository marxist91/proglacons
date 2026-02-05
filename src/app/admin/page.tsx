'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Order, Product, Profile, Driver, CartItem, StockLog, PaymentStatus, StockPrediction, AdminNotification, NotificationConfig, NotificationType } from '@/types';
import { CATEGORIES, UNITS } from '@/constants';
import {
  LayoutDashboard, Package, Truck, Users, ShoppingBag, LogOut, Search,
  TrendingUp, ShoppingCart, DollarSign, ArrowUpRight, AlertTriangle, MapPin, Phone,
  Eye, X, CheckCircle, Clock, ChevronDown, Loader2, Edit2, Trash2, Plus, Save,
  AlignLeft, Scale, Tag, BarChart3, Download, FileText, ShieldCheck, Image as ImageIcon,
  Volume2, VolumeX, Bell, BellRing, History, ArrowDownCircle, ArrowUpCircle, RefreshCw,
  Calendar, Printer, Table, Wallet, CreditCard, Receipt, CircleDollarSign, Banknote,
  Activity, TrendingDown, Zap, Settings, PackageX, Archive, ExternalLink,
  Moon, Crown, Star, Gift, UserCheck, Heart, Map, Navigation, Route, Layers, Menu, Home, ChevronLeft, ChevronRight,
  Target, ArrowUp, ArrowDown, Percent, TrendingUp as TrendIcon, Award, UserCog, Lock, EyeOff, Mail
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area, Legend, Line
} from 'recharts';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subMonths, addDays, eachDayOfInterval, isSameDay, isSameMonth, addMonths, isToday, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dynamic from 'next/dynamic';

// Dynamic import for Leaflet map (requires window)
const DeliveryMap = dynamic(() => import('@/components/DeliveryMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-800 rounded-xl">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00ADEF] mx-auto mb-2" />
        <p className="text-sm text-slate-400">Chargement de la carte...</p>
      </div>
    </div>
  )
});

// ========================================
// TYPES
// ========================================
type TabType = 'overview' | 'analytics' | 'orders' | 'products' | 'stock-logs' | 'stock-alerts' | 'drivers' | 'users' | 'reports' | 'payments' | 'calendar' | 'clients' | 'map' | 'kpi' | 'my-account';
type TimeFrame = 'day' | 'month' | 'year';
type ReportPeriod = 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  unit: string;
  category: string;
  imageUrl: string;
  inStock: boolean;
  tag: string;
  stock_quantity: number;
}

// Default notification config
const DEFAULT_NOTIFICATION_CONFIG: NotificationConfig = {
  id: '',
  user_id: '',
  enable_push: true,
  enable_sound: true,
  enable_email: false,
  notify_new_orders: true,
  notify_order_status: true,
  notify_low_stock: true,
  notify_stock_alerts: true,
  notify_payments: true,
  notify_deliveries: true,
  notify_system: true,
  low_stock_threshold: 10,
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '07:00',
  created_at: '',
  updated_at: '',
};

// ========================================
// HELPER COMPONENTS
// ========================================
const PackagesIcon = ({ size, className }: { size: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m7.5 4.27 9 5.15"/>
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
    <path d="m3.3 7 8.7 5 8.7-5"/>
    <path d="M12 22v-9"/>
  </svg>
);

const TabButton = ({ active, onClick, icon, label, badge }: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string;
  badge?: number;
}) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center justify-between gap-4 p-4 rounded-2xl font-black text-sm transition-all ${
      active 
        ? 'bg-[#00ADEF] text-white shadow-lg shadow-blue-500/20' 
        : 'text-slate-400 hover:text-[#00ADEF] hover:bg-slate-800/50'
    }`}
  >
    <span className="flex items-center gap-4">{icon}{label}</span>
    {badge !== undefined && badge > 0 && (
      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
        active ? 'bg-white/20 text-white' : 'bg-red-500/20 text-red-400'
      }`}>
        {badge}
      </span>
    )}
  </button>
);

const StatCard = ({ title, value, icon, trend, className = '' }: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  trend?: string;
  className?: string;
}) => (
  <div className={`bg-slate-800/40 p-8 rounded-[2.5rem] border border-slate-800 shadow-sm group hover:border-[#00ADEF]/30 transition-all flex flex-col justify-between ${className}`}>
    <div className="flex justify-between items-start mb-6">
      <div className="w-12 h-12 bg-slate-900/80 rounded-2xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400">
          <ArrowUpRight size={10} /> {trend}
        </div>
      )}
    </div>
    <div>
      <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{title}</div>
      <div className="text-3xl font-black tracking-tighter truncate">{value}</div>
    </div>
  </div>
);

// ========================================
// STATUS COLORS
// ========================================
const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'En attente': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  'Préparation': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  'Livraison en cours': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  'En attente de confirmation': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  'Livré': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  'Annulé': { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
};

// ========================================
// REPORT PERIOD HELPERS
// ========================================
const getReportDateRange = (period: ReportPeriod, customStart?: string, customEnd?: string): { start: Date; end: Date; label: string } => {
  const now = new Date();
  switch (period) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now), label: "Aujourd'hui" };
    case 'yesterday':
      const yesterday = subDays(now, 1);
      return { start: startOfDay(yesterday), end: endOfDay(yesterday), label: 'Hier' };
    case 'week':
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }), label: 'Cette semaine' };
    case 'month':
      return { start: startOfMonth(now), end: endOfMonth(now), label: 'Ce mois' };
    case 'quarter':
      const quarterStart = startOfMonth(subMonths(now, 2));
      return { start: quarterStart, end: endOfMonth(now), label: '3 derniers mois' };
    case 'year':
      return { start: startOfYear(now), end: endOfYear(now), label: 'Cette année' };
    case 'custom':
      return { 
        start: customStart ? startOfDay(new Date(customStart)) : startOfMonth(now),
        end: customEnd ? endOfDay(new Date(customEnd)) : endOfDay(now),
        label: 'Période personnalisée'
      };
    default:
      return { start: startOfMonth(now), end: endOfMonth(now), label: 'Ce mois' };
  }
};

// ========================================
// REPORTS TAB COMPONENT
// ========================================
interface ReportsTabProps {
  orders: Order[];
  products: Product[];
  stockLogs: StockLog[];
  reportPeriod: ReportPeriod;
  setReportPeriod: (period: ReportPeriod) => void;
  customStartDate: string;
  setCustomStartDate: (date: string) => void;
  customEndDate: string;
  setCustomEndDate: (date: string) => void;
  isExporting: boolean;
  setIsExporting: (exporting: boolean) => void;
}

const ReportsTab: React.FC<ReportsTabProps> = ({
  orders, reportPeriod, setReportPeriod,
  customStartDate, setCustomStartDate, customEndDate, setCustomEndDate,
  isExporting, setIsExporting
}) => {
  const { start, end, label } = getReportDateRange(reportPeriod, customStartDate, customEndDate);
  
  // Filtrer les commandes par période
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= start && orderDate <= end;
    });
  }, [orders, start, end]);
  
  // Statistiques de la période
  const stats = useMemo(() => {
    const delivered = filteredOrders.filter(o => o.status === 'Livré');
    const cancelled = filteredOrders.filter(o => o.status === 'Annulé');
    const pending = filteredOrders.filter(o => !['Livré', 'Annulé'].includes(o.status));
    
    const totalRevenue = delivered.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalDeliveryFees = delivered.reduce((sum, o) => sum + (o.delivery_fee || 0), 0);
    const avgOrderValue = delivered.length > 0 ? totalRevenue / delivered.length : 0;
    
    // Top produits vendus
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    delivered.forEach(order => {
      order.items?.forEach((item: CartItem) => {
        if (!productSales[item.id]) {
          productSales[item.id] = { name: item.name, quantity: 0, revenue: 0 };
        }
        productSales[item.id].quantity += item.quantity;
        productSales[item.id].revenue += item.price * item.quantity;
      });
    });
    
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    
    // Ventes par jour
    const salesByDay: Record<string, { date: string; orders: number; revenue: number }> = {};
    delivered.forEach(order => {
      const day = format(new Date(order.created_at), 'yyyy-MM-dd');
      if (!salesByDay[day]) {
        salesByDay[day] = { date: day, orders: 0, revenue: 0 };
      }
      salesByDay[day].orders += 1;
      salesByDay[day].revenue += order.total || 0;
    });
    
    const dailySales = Object.values(salesByDay).sort((a, b) => a.date.localeCompare(b.date));
    
    // Répartition par statut
    const statusDistribution = [
      { name: 'Livré', value: delivered.length, color: '#10b981' },
      { name: 'En cours', value: pending.length, color: '#3b82f6' },
      { name: 'Annulé', value: cancelled.length, color: '#ef4444' },
    ].filter(s => s.value > 0);
    
    // Répartition par mode de paiement
    const paymentMethods: Record<string, number> = {};
    delivered.forEach(order => {
      const method = order.payment_method || 'Non spécifié';
      paymentMethods[method] = (paymentMethods[method] || 0) + (order.total || 0);
    });
    
    const paymentDistribution = Object.entries(paymentMethods).map(([name, value]) => ({
      name, value, color: name === 'Cash' ? '#f59e0b' : name === 'Mobile Money' ? '#8b5cf6' : '#6b7280'
    }));
    
    return {
      totalOrders: filteredOrders.length,
      deliveredOrders: delivered.length,
      cancelledOrders: cancelled.length,
      pendingOrders: pending.length,
      totalRevenue,
      totalDeliveryFees,
      avgOrderValue,
      topProducts,
      dailySales,
      statusDistribution,
      paymentDistribution,
      conversionRate: filteredOrders.length > 0 ? (delivered.length / filteredOrders.length * 100) : 0
    };
  }, [filteredOrders]);
  
  // Export PDF
  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFillColor(30, 58, 138);
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('PRO-GLAÇONS', 14, 20);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Rapport de Ventes', 14, 30);
      
      // Période
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(10);
      doc.text(`Période: ${format(start, 'dd/MM/yyyy', { locale: fr })} - ${format(end, 'dd/MM/yyyy', { locale: fr })}`, pageWidth - 14, 25, { align: 'right' });
      doc.text(`Généré le: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`, pageWidth - 14, 32, { align: 'right' });
      
      // Résumé
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Résumé', 14, 55);
      
      // Stats cards
      const statsData = [
        ['Total Commandes', stats.totalOrders.toString()],
        ['Commandes Livrées', stats.deliveredOrders.toString()],
        ['Chiffre d\'Affaires', `${stats.totalRevenue.toLocaleString()} FCFA`],
        ['Panier Moyen', `${Math.round(stats.avgOrderValue).toLocaleString()} FCFA`],
        ['Frais de Livraison', `${stats.totalDeliveryFees.toLocaleString()} FCFA`],
        ['Taux de Conversion', `${stats.conversionRate.toFixed(1)}%`],
      ];
      
      autoTable(doc, {
        startY: 60,
        head: [['Indicateur', 'Valeur']],
        body: statsData,
        theme: 'grid',
        headStyles: { fillColor: [0, 173, 239], textColor: 255 },
        styles: { fontSize: 10 },
        columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } }
      });
      
      // Top Produits
      let currentY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 100;
      currentY += 15;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Top 5 Produits', 14, currentY);
      
      autoTable(doc, {
        startY: currentY + 5,
        head: [['Produit', 'Quantité', 'Chiffre d\'Affaires']],
        body: stats.topProducts.map(p => [
          p.name,
          p.quantity.toString(),
          `${p.revenue.toLocaleString()} FCFA`
        ]),
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129], textColor: 255 },
        styles: { fontSize: 9 }
      });
      
      // Liste des commandes
      currentY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 150;
      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      } else {
        currentY += 15;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Détail des Commandes', 14, currentY);
      
      const ordersData = filteredOrders
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 50)
        .map(o => [
          format(new Date(o.created_at), 'dd/MM/yy HH:mm'),
          o.full_name || '-',
          o.neighborhood || '-',
          o.status,
          `${(o.total || 0).toLocaleString()} F`
        ]);
      
      autoTable(doc, {
        startY: currentY + 5,
        head: [['Date', 'Client', 'Quartier', 'Statut', 'Total']],
        body: ordersData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        styles: { fontSize: 8 },
        columnStyles: { 
          0: { cellWidth: 30 },
          3: { cellWidth: 35 },
          4: { halign: 'right', cellWidth: 25 }
        }
      });
      
      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Page ${i} / ${pageCount} - PRO-GLAÇONS © ${new Date().getFullYear()}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }
      
      // Télécharger
      doc.save(`rapport-ventes-${format(start, 'yyyy-MM-dd')}-${format(end, 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Erreur export PDF:', error);
    }
    setIsExporting(false);
  };
  
  // Export Excel (CSV)
  const exportToExcel = () => {
    setIsExporting(true);
    try {
      // Préparer les données
      const headers = ['Date', 'Heure', 'N° Commande', 'Client', 'Téléphone', 'Adresse', 'Quartier', 'Produits', 'Statut', 'Mode Paiement', 'Frais Livraison', 'Total'];
      
      const rows = filteredOrders
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .map(o => [
          format(new Date(o.created_at), 'dd/MM/yyyy'),
          format(new Date(o.created_at), 'HH:mm'),
          o.id.slice(0, 8).toUpperCase(),
          o.full_name || '',
          o.phone || '',
          o.address || '',
          o.neighborhood || '',
          o.items?.map((i: CartItem) => `${i.name} x${i.quantity}`).join('; ') || '',
          o.status,
          o.payment_method || '',
          o.delivery_fee || 0,
          o.total || 0
        ]);
      
      // Créer le CSV
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => {
          const str = String(cell);
          // Échapper les guillemets et envelopper si nécessaire
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(','))
      ].join('\n');
      
      // Ajouter BOM pour Excel
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `commandes-${format(start, 'yyyy-MM-dd')}-${format(end, 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur export CSV:', error);
    }
    setIsExporting(false);
  };
  
  return (
    <>
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-white">Rapports de Ventes</h2>
          <p className="text-slate-400 text-sm">
            Analyse et export des données commerciales • {label}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={reportPeriod}
            onChange={(e) => setReportPeriod(e.target.value as ReportPeriod)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-cyan-500"
          >
            <option value="today">Aujourd&apos;hui</option>
            <option value="yesterday">Hier</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="quarter">3 derniers mois</option>
            <option value="year">Cette année</option>
            <option value="custom">Personnalisé</option>
          </select>
          
          {reportPeriod === 'custom' && (
            <>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-sm text-white"
              />
              <span className="text-slate-500">→</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-sm text-white"
              />
            </>
          )}
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/10 p-6 rounded-2xl border border-cyan-500/20">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingBag size={20} className="text-cyan-400" />
            <span className="text-xs text-slate-400 font-bold uppercase">Commandes</span>
          </div>
          <div className="text-3xl font-black text-white">{stats.totalOrders}</div>
          <div className="text-xs text-slate-500 mt-1">
            {stats.deliveredOrders} livrées • {stats.cancelledOrders} annulées
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/10 p-6 rounded-2xl border border-emerald-500/20">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign size={20} className="text-emerald-400" />
            <span className="text-xs text-slate-400 font-bold uppercase">Chiffre d&apos;Affaires</span>
          </div>
          <div className="text-3xl font-black text-white">{stats.totalRevenue.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">FCFA</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/10 p-6 rounded-2xl border border-purple-500/20">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingCart size={20} className="text-purple-400" />
            <span className="text-xs text-slate-400 font-bold uppercase">Panier Moyen</span>
          </div>
          <div className="text-3xl font-black text-white">{Math.round(stats.avgOrderValue).toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">FCFA / commande</div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 p-6 rounded-2xl border border-amber-500/20">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp size={20} className="text-amber-400" />
            <span className="text-xs text-slate-400 font-bold uppercase">Conversion</span>
          </div>
          <div className="text-3xl font-black text-white">{stats.conversionRate.toFixed(1)}%</div>
          <div className="text-xs text-slate-500 mt-1">Taux de livraison</div>
        </div>
      </div>
      
      {/* Export Buttons */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={exportToPDF}
          disabled={isExporting}
          className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-2xl hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50"
        >
          {isExporting ? <Loader2 size={20} className="animate-spin" /> : <FileText size={20} />}
          Exporter PDF
        </button>
        <button
          onClick={exportToExcel}
          disabled={isExporting}
          className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-2xl hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50"
        >
          {isExporting ? <Loader2 size={20} className="animate-spin" /> : <Table size={20} />}
          Exporter Excel (CSV)
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-3 px-6 py-4 bg-slate-700 text-white font-bold rounded-2xl hover:bg-slate-600 transition-all"
        >
          <Printer size={20} />
          Imprimer
        </button>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Ventes journalières */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Évolution des Ventes</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={stats.dailySales}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ADEF" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00ADEF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="date" 
                stroke="#64748b" 
                fontSize={10}
                tickFormatter={(value) => format(new Date(value), 'dd/MM')}
              />
              <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }}
                labelFormatter={(value) => format(new Date(value), 'dd MMMM yyyy', { locale: fr })}
                formatter={(value) => [`${Number(value).toLocaleString()} FCFA`, 'Revenus']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#00ADEF" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Répartition par statut */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Répartition des Commandes</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={stats.statusDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {stats.statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }}
                formatter={(value, name) => [`${Number(value)} commandes`, name]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Top Produits */}
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800 p-6 mb-8">
        <h3 className="text-lg font-bold text-white mb-4">Top Produits Vendus</h3>
        <div className="space-y-3">
          {stats.topProducts.map((product, index) => (
            <div key={index} className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white ${
                index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-amber-700' : 'bg-slate-600'
              }`}>
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="font-bold text-white">{product.name}</div>
                <div className="text-sm text-slate-400">{product.quantity} unités vendues</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-emerald-400">{product.revenue.toLocaleString()} F</div>
              </div>
            </div>
          ))}
          {stats.topProducts.length === 0 && (
            <div className="text-center text-slate-500 py-8">
              Aucune vente sur cette période
            </div>
          )}
        </div>
      </div>
      
      {/* Tableau récapitulatif */}
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">Commandes de la période</h3>
          <p className="text-sm text-slate-400">{filteredOrders.length} commande(s) • Du {format(start, 'dd/MM/yyyy')} au {format(end, 'dd/MM/yyyy')}</p>
        </div>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-slate-800">
              <tr>
                <th className="text-left text-xs font-black text-slate-400 uppercase tracking-wider p-4">Date</th>
                <th className="text-left text-xs font-black text-slate-400 uppercase tracking-wider p-4">Client</th>
                <th className="text-left text-xs font-black text-slate-400 uppercase tracking-wider p-4">Quartier</th>
                <th className="text-left text-xs font-black text-slate-400 uppercase tracking-wider p-4">Statut</th>
                <th className="text-right text-xs font-black text-slate-400 uppercase tracking-wider p-4">Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 100)
                .map(order => (
                  <tr key={order.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="p-4">
                      <div className="text-sm font-bold text-white">
                        {format(new Date(order.created_at), 'dd/MM/yyyy')}
                      </div>
                      <div className="text-xs text-slate-500">
                        {format(new Date(order.created_at), 'HH:mm')}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-white">{order.full_name || '-'}</div>
                      <div className="text-xs text-slate-500">{order.phone || '-'}</div>
                    </td>
                    <td className="p-4 text-slate-300">{order.neighborhood || '-'}</td>
                    <td className="p-4">
                      <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold ${
                        STATUS_COLORS[order.status]?.bg || 'bg-slate-500/20'
                      } ${STATUS_COLORS[order.status]?.text || 'text-slate-400'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-bold text-white">{(order.total || 0).toLocaleString()} F</span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {filteredOrders.length === 0 && (
            <div className="text-center text-slate-500 py-12">
              <Calendar size={48} className="mx-auto mb-4 opacity-50" />
              <p className="font-bold">Aucune commande sur cette période</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// ========================================
// PAYMENTS TAB COMPONENT
// ========================================
const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  'paid': { label: 'Payé', bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: <CheckCircle size={16} /> },
  'pending': { label: 'En attente', bg: 'bg-amber-500/20', text: 'text-amber-400', icon: <Clock size={16} /> },
  'unpaid': { label: 'Impayé', bg: 'bg-red-500/20', text: 'text-red-400', icon: <AlertTriangle size={16} /> },
  'partial': { label: 'Partiel', bg: 'bg-blue-500/20', text: 'text-blue-400', icon: <CircleDollarSign size={16} /> },
  'refunded': { label: 'Remboursé', bg: 'bg-purple-500/20', text: 'text-purple-400', icon: <RefreshCw size={16} /> },
};

const PAYMENT_METHOD_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  'cash': { label: 'Espèces', icon: <Banknote size={16} />, color: 'text-emerald-400' },
  'mobile_money': { label: 'Mobile Money', icon: <CreditCard size={16} />, color: 'text-purple-400' },
  'bank_transfer': { label: 'Virement', icon: <Receipt size={16} />, color: 'text-blue-400' },
  'other': { label: 'Autre', icon: <Wallet size={16} />, color: 'text-slate-400' },
};

interface PaymentsTabProps {
  orders: Order[];
  onUpdatePayment: (orderId: string, paymentData: { 
    payment_status: PaymentStatus; 
    payment_date?: string; 
    payment_amount?: number;
    payment_notes?: string;
  }) => Promise<void>;
}

const PaymentsTab: React.FC<PaymentsTabProps> = ({ orders, onUpdatePayment }) => {
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | 'all'>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  
  // Filtrer les commandes
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Exclure les commandes annulées
      if (order.status === 'Annulé') return false;
      
      // Filtre par statut de paiement
      const orderPaymentStatus = order.payment_status || (order.status === 'Livré' ? 'pending' : 'pending');
      if (filterStatus !== 'all' && orderPaymentStatus !== filterStatus) return false;
      
      // Filtre par méthode de paiement
      if (filterMethod !== 'all' && order.payment_method !== filterMethod) return false;
      
      // Filtre par recherche
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!order.full_name?.toLowerCase().includes(query) && 
            !order.phone?.includes(query) &&
            !order.id.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      // Filtre par date
      if (dateRange !== 'all') {
        const orderDate = new Date(order.created_at);
        const now = new Date();
        if (dateRange === 'today') {
          if (orderDate < startOfDay(now)) return false;
        } else if (dateRange === 'week') {
          if (orderDate < startOfWeek(now, { locale: fr })) return false;
        } else if (dateRange === 'month') {
          if (orderDate < startOfMonth(now)) return false;
        }
      }
      
      return true;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [orders, filterStatus, filterMethod, searchQuery, dateRange]);
  
  // Statistiques
  const stats = useMemo(() => {
    const delivered = orders.filter(o => o.status === 'Livré');
    
    const paidOrders = delivered.filter(o => o.payment_status === 'paid');
    const pendingOrders = delivered.filter(o => !o.payment_status || o.payment_status === 'pending');
    const unpaidOrders = delivered.filter(o => o.payment_status === 'unpaid');
    const partialOrders = delivered.filter(o => o.payment_status === 'partial');
    
    const totalRevenue = delivered.reduce((sum, o) => sum + (o.total || 0), 0);
    const paidAmount = paidOrders.reduce((sum, o) => sum + (o.payment_amount || o.total || 0), 0);
    const partialAmount = partialOrders.reduce((sum, o) => sum + (o.payment_amount || 0), 0);
    const pendingAmount = pendingOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const unpaidAmount = unpaidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    
    return {
      totalRevenue,
      paidAmount,
      pendingAmount,
      unpaidAmount,
      partialAmount,
      paidCount: paidOrders.length,
      pendingCount: pendingOrders.length,
      unpaidCount: unpaidOrders.length,
      partialCount: partialOrders.length,
      collectionRate: totalRevenue > 0 ? ((paidAmount + partialAmount) / totalRevenue * 100) : 0
    };
  }, [orders]);
  
  // Gérer la mise à jour du paiement
  const handleUpdatePayment = async (status: PaymentStatus) => {
    if (!selectedOrder) return;
    setIsUpdating(true);
    try {
      await onUpdatePayment(selectedOrder.id, {
        payment_status: status,
        payment_date: status === 'paid' ? new Date().toISOString() : undefined,
        payment_amount: status === 'partial' ? paymentAmount : (status === 'paid' ? selectedOrder.total : undefined),
        payment_notes: paymentNotes || undefined
      });
      setSelectedOrder(null);
      setPaymentAmount(0);
      setPaymentNotes('');
    } catch (error) {
      console.error('Erreur mise à jour paiement:', error);
    }
    setIsUpdating(false);
  };
  
  return (
    <>
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-white">Gestion des Paiements</h2>
          <p className="text-slate-400 text-sm">
            Suivi et historique des transactions • {filteredOrders.length} commande(s)
          </p>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/10 p-6 rounded-2xl border border-emerald-500/20">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle size={20} className="text-emerald-400" />
            <span className="text-xs text-slate-400 font-bold uppercase">Payé</span>
          </div>
          <div className="text-2xl font-black text-white">{stats.paidAmount.toLocaleString()} F</div>
          <div className="text-xs text-slate-500 mt-1">{stats.paidCount} commande(s)</div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 p-6 rounded-2xl border border-amber-500/20">
          <div className="flex items-center gap-3 mb-2">
            <Clock size={20} className="text-amber-400" />
            <span className="text-xs text-slate-400 font-bold uppercase">En attente</span>
          </div>
          <div className="text-2xl font-black text-white">{stats.pendingAmount.toLocaleString()} F</div>
          <div className="text-xs text-slate-500 mt-1">{stats.pendingCount} commande(s)</div>
        </div>
        
        <div className="bg-gradient-to-br from-red-500/20 to-pink-500/10 p-6 rounded-2xl border border-red-500/20">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle size={20} className="text-red-400" />
            <span className="text-xs text-slate-400 font-bold uppercase">Impayé</span>
          </div>
          <div className="text-2xl font-black text-white">{stats.unpaidAmount.toLocaleString()} F</div>
          <div className="text-xs text-slate-500 mt-1">{stats.unpaidCount} commande(s)</div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/10 p-6 rounded-2xl border border-blue-500/20">
          <div className="flex items-center gap-3 mb-2">
            <CircleDollarSign size={20} className="text-blue-400" />
            <span className="text-xs text-slate-400 font-bold uppercase">Partiel</span>
          </div>
          <div className="text-2xl font-black text-white">{stats.partialAmount.toLocaleString()} F</div>
          <div className="text-xs text-slate-500 mt-1">{stats.partialCount} commande(s)</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/10 p-6 rounded-2xl border border-purple-500/20">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp size={20} className="text-purple-400" />
            <span className="text-xs text-slate-400 font-bold uppercase">Taux Recouvrement</span>
          </div>
          <div className="text-2xl font-black text-white">{stats.collectionRate.toFixed(1)}%</div>
          <div className="text-xs text-slate-500 mt-1">sur {stats.totalRevenue.toLocaleString()} F</div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800 p-6 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Recherche */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher par client, téléphone, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-800 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          
          {/* Filtre statut paiement */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as PaymentStatus | 'all')}
            className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white"
          >
            <option value="all">Tous les statuts</option>
            <option value="paid">✅ Payé</option>
            <option value="pending">⏳ En attente</option>
            <option value="unpaid">❌ Impayé</option>
            <option value="partial">💰 Partiel</option>
            <option value="refunded">↩️ Remboursé</option>
          </select>
          
          {/* Filtre méthode */}
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white"
          >
            <option value="all">Toutes méthodes</option>
            <option value="cash">💵 Espèces</option>
            <option value="mobile_money">📱 Mobile Money</option>
          </select>
          
          {/* Filtre période */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white"
          >
            <option value="all">Toutes périodes</option>
            <option value="today">Aujourd&apos;hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
          </select>
        </div>
      </div>
      
      {/* Orders Table */}
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">Liste des Commandes</h3>
          <div className="text-sm text-slate-400">
            {filteredOrders.length} résultat(s)
          </div>
        </div>
        
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-slate-800">
              <tr>
                <th className="text-left text-xs font-black text-slate-400 uppercase tracking-wider p-4">Date</th>
                <th className="text-left text-xs font-black text-slate-400 uppercase tracking-wider p-4">Client</th>
                <th className="text-left text-xs font-black text-slate-400 uppercase tracking-wider p-4">Statut Livraison</th>
                <th className="text-left text-xs font-black text-slate-400 uppercase tracking-wider p-4">Mode Paiement</th>
                <th className="text-left text-xs font-black text-slate-400 uppercase tracking-wider p-4">Statut Paiement</th>
                <th className="text-right text-xs font-black text-slate-400 uppercase tracking-wider p-4">Total</th>
                <th className="text-center text-xs font-black text-slate-400 uppercase tracking-wider p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => {
                const paymentStatus = order.payment_status || 'pending';
                const statusConfig = PAYMENT_STATUS_CONFIG[paymentStatus];
                const methodConfig = PAYMENT_METHOD_CONFIG[order.payment_method || 'cash'];
                
                return (
                  <tr key={order.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="p-4">
                      <div className="text-sm font-bold text-white">
                        {format(new Date(order.created_at), 'dd/MM/yyyy')}
                      </div>
                      <div className="text-xs text-slate-500">
                        {format(new Date(order.created_at), 'HH:mm')}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-white">{order.full_name || '-'}</div>
                      <div className="text-xs text-slate-500">{order.phone || '-'}</div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold ${
                        STATUS_COLORS[order.status]?.bg || 'bg-slate-500/20'
                      } ${STATUS_COLORS[order.status]?.text || 'text-slate-400'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`flex items-center gap-2 ${methodConfig?.color || 'text-slate-400'}`}>
                        {methodConfig?.icon}
                        {methodConfig?.label || order.payment_method || 'Non spécifié'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${statusConfig?.bg} ${statusConfig?.text}`}>
                        {statusConfig?.icon}
                        {statusConfig?.label}
                      </span>
                      {order.payment_status === 'partial' && order.payment_amount && (
                        <div className="text-xs text-slate-500 mt-1">
                          Payé: {order.payment_amount.toLocaleString()} F
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-bold text-white">{(order.total || 0).toLocaleString()} F</span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setPaymentAmount(order.payment_amount || order.total || 0);
                          setPaymentNotes(order.payment_notes || '');
                        }}
                        className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl hover:bg-cyan-500/30 transition-colors"
                        title="Modifier le paiement"
                      >
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredOrders.length === 0 && (
            <div className="text-center text-slate-500 py-12">
              <Wallet size={48} className="mx-auto mb-4 opacity-50" />
              <p className="font-bold">Aucune commande trouvée</p>
              <p className="text-sm">Modifiez vos filtres pour voir plus de résultats</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal de modification du paiement */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-white">Modifier le Paiement</h3>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Résumé de la commande */}
              <div className="bg-slate-800/50 rounded-2xl p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-400">Commande</span>
                  <span className="text-white font-bold">#{selectedOrder.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-400">Client</span>
                  <span className="text-white">{selectedOrder.full_name}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-400">Date</span>
                  <span className="text-white">{format(new Date(selectedOrder.created_at), 'dd/MM/yyyy HH:mm')}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-700">
                  <span className="text-slate-400 font-bold">Total à payer</span>
                  <span className="text-2xl font-black text-cyan-400">{(selectedOrder.total || 0).toLocaleString()} F</span>
                </div>
              </div>
              
              {/* Montant payé (pour paiement partiel) */}
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">Montant payé (FCFA)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-800 rounded-xl text-white focus:ring-2 focus:ring-cyan-500"
                  placeholder="Entrez le montant payé"
                />
              </div>
              
              {/* Notes */}
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">Notes (optionnel)</label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-800 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 resize-none"
                  placeholder="Référence de transaction, remarques..."
                />
              </div>
              
              {/* Boutons de statut */}
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-3">Marquer comme :</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleUpdatePayment('paid')}
                    disabled={isUpdating}
                    className="flex items-center justify-center gap-2 p-4 bg-emerald-500/20 text-emerald-400 rounded-xl font-bold hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                  >
                    {isUpdating ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                    Payé
                  </button>
                  <button
                    onClick={() => handleUpdatePayment('pending')}
                    disabled={isUpdating}
                    className="flex items-center justify-center gap-2 p-4 bg-amber-500/20 text-amber-400 rounded-xl font-bold hover:bg-amber-500/30 transition-colors disabled:opacity-50"
                  >
                    {isUpdating ? <Loader2 size={18} className="animate-spin" /> : <Clock size={18} />}
                    En attente
                  </button>
                  <button
                    onClick={() => handleUpdatePayment('partial')}
                    disabled={isUpdating}
                    className="flex items-center justify-center gap-2 p-4 bg-blue-500/20 text-blue-400 rounded-xl font-bold hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                  >
                    {isUpdating ? <Loader2 size={18} className="animate-spin" /> : <CircleDollarSign size={18} />}
                    Partiel
                  </button>
                  <button
                    onClick={() => handleUpdatePayment('unpaid')}
                    disabled={isUpdating}
                    className="flex items-center justify-center gap-2 p-4 bg-red-500/20 text-red-400 rounded-xl font-bold hover:bg-red-500/30 transition-colors disabled:opacity-50"
                  >
                    {isUpdating ? <Loader2 size={18} className="animate-spin" /> : <AlertTriangle size={18} />}
                    Impayé
                  </button>
                </div>
              </div>
              
              {/* Remboursement */}
              <button
                onClick={() => handleUpdatePayment('refunded')}
                disabled={isUpdating}
                className="w-full flex items-center justify-center gap-2 p-4 bg-purple-500/20 text-purple-400 rounded-xl font-bold hover:bg-purple-500/30 transition-colors disabled:opacity-50"
              >
                {isUpdating ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                Marquer comme remboursé
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ========================================
// STOCK ALERTS TAB COMPONENT
// ========================================
interface StockAlertsTabProps {
  products: Product[];
  orders: Order[];
  stockLogs: StockLog[];
}

const StockAlertsTab: React.FC<StockAlertsTabProps> = ({ products, orders }) => {
  const [alertThresholds, setAlertThresholds] = useState<Record<string, number>>(() => {
    // Initialiser depuis localStorage de manière synchrone
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('stock_alert_thresholds');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return {};
        }
      }
    }
    return {};
  });
  const [showConfigModal, setShowConfigModal] = useState(false);
  
  // Sauvegarder les seuils
  const saveThreshold = (productId: string, threshold: number) => {
    const updated = { ...alertThresholds, [productId]: threshold };
    setAlertThresholds(updated);
    localStorage.setItem('stock_alert_thresholds', JSON.stringify(updated));
  };
  
  // Calculer les prévisions de stock
  const stockPredictions = useMemo((): StockPrediction[] => {
    // Analyser les ventes des 30 derniers jours
    const thirtyDaysAgo = subDays(new Date(), 30);
    const recentOrders = orders.filter(o => 
      o.status === 'Livré' && new Date(o.created_at) >= thirtyDaysAgo
    );
    
    // Calculer les ventes par produit
    const salesByProduct: Record<string, { total: number; days: Set<string> }> = {};
    
    recentOrders.forEach(order => {
      const day = format(new Date(order.created_at), 'yyyy-MM-dd');
      order.items?.forEach((item: CartItem) => {
        if (!salesByProduct[item.id]) {
          salesByProduct[item.id] = { total: 0, days: new Set() };
        }
        salesByProduct[item.id].total += item.quantity;
        salesByProduct[item.id].days.add(day);
      });
    });
    
    // Générer les prévisions
    return products.map(product => {
      const sales = salesByProduct[product.id];
      const activeDays = sales ? sales.days.size : 0;
      const totalSold = sales ? sales.total : 0;
      
      // Moyenne journalière (en utilisant les jours actifs ou 30 jours)
      const avgDaily = activeDays > 0 ? totalSold / Math.max(activeDays, 7) : 0;
      
      // Jours avant rupture
      const daysUntilStockout = avgDaily > 0 
        ? Math.floor(product.stock_quantity / avgDaily)
        : product.stock_quantity > 0 ? 999 : 0;
      
      // Date prévue de rupture
      const predictedDate = addDays(new Date(), daysUntilStockout);
      
      // Tendance (comparer semaine 1 vs semaine 2)
      const week1Sales = recentOrders
        .filter(o => {
          const d = new Date(o.created_at);
          return d >= subDays(new Date(), 14) && d < subDays(new Date(), 7);
        })
        .reduce((sum, o) => sum + (o.items?.filter((i: CartItem) => i.id === product.id).reduce((s, i) => s + i.quantity, 0) || 0), 0);
      
      const week2Sales = recentOrders
        .filter(o => new Date(o.created_at) >= subDays(new Date(), 7))
        .reduce((sum, o) => sum + (o.items?.filter((i: CartItem) => i.id === product.id).reduce((s, i) => s + i.quantity, 0) || 0), 0);
      
      let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
      if (week2Sales > week1Sales * 1.2) trend = 'increasing';
      else if (week2Sales < week1Sales * 0.8) trend = 'decreasing';
      
      // Confiance basée sur le nombre de données
      let confidence: 'high' | 'medium' | 'low' = 'low';
      if (activeDays >= 20) confidence = 'high';
      else if (activeDays >= 10) confidence = 'medium';
      
      // Quantité recommandée (pour 15 jours de stock)
      const recommendedQty = Math.ceil(avgDaily * 15);
      
      return {
        product_id: product.id,
        product_name: product.name,
        current_stock: product.stock_quantity,
        avg_daily_sales: Math.round(avgDaily * 10) / 10,
        days_until_stockout: daysUntilStockout,
        predicted_stockout_date: format(predictedDate, 'yyyy-MM-dd'),
        recommended_restock_qty: recommendedQty,
        confidence,
        trend
      };
    }).sort((a, b) => a.days_until_stockout - b.days_until_stockout);
  }, [products, orders]);
  
  // Alertes actives
  const activeAlerts = useMemo(() => {
    return products.filter(p => {
      const threshold = alertThresholds[p.id] || 10;
      return p.stock_quantity <= threshold;
    }).sort((a, b) => a.stock_quantity - b.stock_quantity);
  }, [products, alertThresholds]);
  
  // Produits en rupture
  const outOfStock = products.filter(p => p.stock_quantity === 0);
  
  // Produits critiques (< 5 unités)
  const criticalStock = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5);
  
  // Historique des ventes pour le graphique
  const salesHistory = useMemo(() => {
    const last14Days: { date: string; sales: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayOrders = orders.filter(o => 
        o.status === 'Livré' && 
        format(new Date(o.created_at), 'yyyy-MM-dd') === dateStr
      );
      const totalItems = dayOrders.reduce((sum, o) => 
        sum + (o.items?.reduce((s, i) => s + i.quantity, 0) || 0), 0
      );
      last14Days.push({ date: format(date, 'dd/MM'), sales: totalItems });
    }
    return last14Days;
  }, [orders]);
  
  return (
    <>
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-white">Alertes & Prévisions Stock</h2>
          <p className="text-slate-400 text-sm">
            Suivi intelligent des niveaux de stock et prévisions basées sur les ventes
          </p>
        </div>
        <button
          onClick={() => setShowConfigModal(true)}
          className="flex items-center gap-2 px-4 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors font-bold"
        >
          <Settings size={18} />
          Configurer les seuils
        </button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-red-500/20 to-pink-500/10 p-6 rounded-2xl border border-red-500/20">
          <div className="flex items-center gap-3 mb-2">
            <PackageX size={20} className="text-red-400" />
            <span className="text-xs text-slate-400 font-bold uppercase">Rupture</span>
          </div>
          <div className="text-3xl font-black text-white">{outOfStock.length}</div>
          <div className="text-xs text-red-400 mt-1">Produit(s) à 0</div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 p-6 rounded-2xl border border-amber-500/20">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle size={20} className="text-amber-400" />
            <span className="text-xs text-slate-400 font-bold uppercase">Critique</span>
          </div>
          <div className="text-3xl font-black text-white">{criticalStock.length}</div>
          <div className="text-xs text-amber-400 mt-1">Moins de 5 unités</div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/10 p-6 rounded-2xl border border-blue-500/20">
          <div className="flex items-center gap-3 mb-2">
            <Bell size={20} className="text-blue-400" />
            <span className="text-xs text-slate-400 font-bold uppercase">Alertes</span>
          </div>
          <div className="text-3xl font-black text-white">{activeAlerts.length}</div>
          <div className="text-xs text-blue-400 mt-1">Sous le seuil configuré</div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/10 p-6 rounded-2xl border border-emerald-500/20">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle size={20} className="text-emerald-400" />
            <span className="text-xs text-slate-400 font-bold uppercase">OK</span>
          </div>
          <div className="text-3xl font-black text-white">{products.length - activeAlerts.length}</div>
          <div className="text-xs text-emerald-400 mt-1">Stock suffisant</div>
        </div>
      </div>
      
      {/* Alertes actives */}
      {activeAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-red-500/10 to-amber-500/10 rounded-3xl border border-red-500/30 p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-500/20 rounded-xl">
              <AlertTriangle size={24} className="text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">⚠️ Alertes Stock Actives</h3>
              <p className="text-sm text-slate-400">{activeAlerts.length} produit(s) nécessitent votre attention</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeAlerts.map(product => {
              const threshold = alertThresholds[product.id] || 10;
              const prediction = stockPredictions.find(p => p.product_id === product.id);
              return (
                <div key={product.id} className={`p-4 rounded-2xl ${
                  product.stock_quantity === 0 
                    ? 'bg-red-500/20 border border-red-500/40' 
                    : 'bg-amber-500/20 border border-amber-500/40'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-bold text-white">{product.name}</div>
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                      product.stock_quantity === 0 
                        ? 'bg-red-500 text-white' 
                        : 'bg-amber-500 text-black'
                    }`}>
                      {product.stock_quantity === 0 ? 'RUPTURE' : 'BAS'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Stock actuel:</span>
                    <span className="text-white font-bold">{product.stock_quantity} {product.unit}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Seuil d&apos;alerte:</span>
                    <span className="text-amber-400">{threshold} {product.unit}</span>
                  </div>
                  {prediction && prediction.avg_daily_sales > 0 && (
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-slate-400">Rupture prévue:</span>
                      <span className="text-red-400 font-bold">
                        {prediction.days_until_stockout} jour(s)
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Graphique des ventes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800 p-6">
          <h3 className="text-lg font-bold text-white mb-4">📊 Tendance des Ventes (14 jours)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={salesHistory}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ADEF" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00ADEF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }}
                formatter={(value) => [`${Number(value)} unités`, 'Ventes']}
              />
              <Area type="monotone" dataKey="sales" stroke="#00ADEF" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Distribution des stocks */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800 p-6">
          <h3 className="text-lg font-bold text-white mb-4">📦 État des Stocks</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Rupture', value: outOfStock.length, color: '#ef4444' },
                  { name: 'Critique', value: criticalStock.length, color: '#f59e0b' },
                  { name: 'Alerte', value: activeAlerts.length - outOfStock.length - criticalStock.length, color: '#3b82f6' },
                  { name: 'OK', value: products.length - activeAlerts.length, color: '#10b981' },
                ].filter(d => d.value > 0)}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {[
                  { name: 'Rupture', value: outOfStock.length, color: '#ef4444' },
                  { name: 'Critique', value: criticalStock.length, color: '#f59e0b' },
                  { name: 'Alerte', value: activeAlerts.length - outOfStock.length - criticalStock.length, color: '#3b82f6' },
                  { name: 'OK', value: products.length - activeAlerts.length, color: '#10b981' },
                ].filter(d => d.value > 0).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }}
                formatter={(value) => [`${Number(value)} produit(s)`, '']}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Prévisions de stock */}
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800 overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">🔮 Prévisions de Rupture</h3>
          <p className="text-sm text-slate-400">Basées sur les ventes des 30 derniers jours</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800">
              <tr>
                <th className="text-left text-xs font-black text-slate-400 uppercase tracking-wider p-4">Produit</th>
                <th className="text-center text-xs font-black text-slate-400 uppercase tracking-wider p-4">Stock</th>
                <th className="text-center text-xs font-black text-slate-400 uppercase tracking-wider p-4">Ventes/Jour</th>
                <th className="text-center text-xs font-black text-slate-400 uppercase tracking-wider p-4">Tendance</th>
                <th className="text-center text-xs font-black text-slate-400 uppercase tracking-wider p-4">Rupture dans</th>
                <th className="text-center text-xs font-black text-slate-400 uppercase tracking-wider p-4">Confiance</th>
                <th className="text-center text-xs font-black text-slate-400 uppercase tracking-wider p-4">Réapprovisionnement</th>
              </tr>
            </thead>
            <tbody>
              {stockPredictions.slice(0, 10).map(prediction => (
                <tr key={prediction.product_id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="p-4">
                    <div className="font-bold text-white">{prediction.product_name}</div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`font-bold ${
                      prediction.current_stock === 0 ? 'text-red-400' :
                      prediction.current_stock <= 5 ? 'text-amber-400' :
                      'text-white'
                    }`}>
                      {prediction.current_stock}
                    </span>
                  </td>
                  <td className="p-4 text-center text-slate-300">
                    {prediction.avg_daily_sales}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
                      prediction.trend === 'increasing' ? 'bg-emerald-500/20 text-emerald-400' :
                      prediction.trend === 'decreasing' ? 'bg-red-500/20 text-red-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {prediction.trend === 'increasing' ? <TrendingUp size={12} /> :
                       prediction.trend === 'decreasing' ? <TrendingDown size={12} /> :
                       <Activity size={12} />}
                      {prediction.trend === 'increasing' ? 'Hausse' :
                       prediction.trend === 'decreasing' ? 'Baisse' : 'Stable'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {prediction.current_stock === 0 ? (
                      <span className="text-red-400 font-bold">RUPTURE</span>
                    ) : prediction.days_until_stockout >= 999 ? (
                      <span className="text-slate-500">-</span>
                    ) : (
                      <span className={`font-bold ${
                        prediction.days_until_stockout <= 3 ? 'text-red-400' :
                        prediction.days_until_stockout <= 7 ? 'text-amber-400' :
                        'text-emerald-400'
                      }`}>
                        {prediction.days_until_stockout} jour(s)
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                      prediction.confidence === 'high' ? 'bg-emerald-500/20 text-emerald-400' :
                      prediction.confidence === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {prediction.confidence === 'high' ? '🎯 Haute' :
                       prediction.confidence === 'medium' ? '📊 Moyenne' : '📉 Faible'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {prediction.recommended_restock_qty > 0 ? (
                      <span className="text-cyan-400 font-bold">
                        +{prediction.recommended_restock_qty}
                      </span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Modal de configuration des seuils */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-black text-white">⚙️ Configuration des Seuils d&apos;Alerte</h3>
              <button 
                onClick={() => setShowConfigModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <p className="text-slate-400 mb-6">
                Définissez le seuil de stock minimum pour chaque produit. 
                Une alerte sera déclenchée quand le stock passe en dessous de ce seuil.
              </p>
              <div className="space-y-4">
                {products.map(product => (
                  <div key={product.id} className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl">
                    <div className="flex-1">
                      <div className="font-bold text-white">{product.name}</div>
                      <div className="text-xs text-slate-500">
                        Stock actuel: {product.stock_quantity} {product.unit}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-400">Seuil:</span>
                      <input
                        type="number"
                        value={alertThresholds[product.id] || 10}
                        onChange={(e) => saveThreshold(product.id, Number(e.target.value))}
                        className="w-20 px-3 py-2 bg-slate-700 rounded-lg text-white text-center"
                        min={0}
                      />
                      <span className="text-sm text-slate-500">{product.unit}</span>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      product.stock_quantity <= (alertThresholds[product.id] || 10)
                        ? 'bg-red-500'
                        : 'bg-emerald-500'
                    }`} />
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-slate-800 flex justify-end gap-4">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-6 py-3 bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-600"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ========================================
// CLIENTS TAB COMPONENT - Advanced Customer Management
// ========================================
type ClientSegment = 'all' | 'vip' | 'regular' | 'new' | 'inactive';
type ClientTier = 'bronze' | 'silver' | 'gold' | 'platinum';

interface ClientData {
  profile: Profile;
  orders: Order[];
  totalSpent: number;
  orderCount: number;
  averageOrder: number;
  firstOrderDate: string | null;
  lastOrderDate: string | null;
  segment: 'vip' | 'regular' | 'new' | 'inactive';
  tier: ClientTier;
  loyaltyPoints: number;
  favoriteProducts: { name: string; count: number }[];
}

interface ClientsTabProps {
  profiles: Profile[];
  orders: Order[];
  onUpdateLoyalty: (userId: string, points: number, tier: ClientTier) => Promise<void>;
}

const TIER_CONFIG: Record<ClientTier, { label: string; icon: React.ReactNode; color: string; bg: string; minSpent: number; pointsMultiplier: number }> = {
  'bronze': { label: 'Bronze', icon: <Star size={14} />, color: 'text-amber-600', bg: 'bg-amber-500/20', minSpent: 0, pointsMultiplier: 1 },
  'silver': { label: 'Argent', icon: <Star size={14} />, color: 'text-slate-400', bg: 'bg-slate-400/20', minSpent: 50000, pointsMultiplier: 1.5 },
  'gold': { label: 'Or', icon: <Crown size={14} />, color: 'text-yellow-400', bg: 'bg-yellow-400/20', minSpent: 150000, pointsMultiplier: 2 },
  'platinum': { label: 'Platine', icon: <Crown size={14} />, color: 'text-cyan-400', bg: 'bg-cyan-400/20', minSpent: 500000, pointsMultiplier: 3 },
};

const ClientsTab: React.FC<ClientsTabProps> = ({ profiles, orders, onUpdateLoyalty }) => {
  const [selectedSegment, setSelectedSegment] = useState<ClientSegment>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [sortBy, setSortBy] = useState<'spent' | 'orders' | 'recent'>('spent');
  const [isUpdatingLoyalty, setIsUpdatingLoyalty] = useState(false);
  const [loyaltyPointsToAdd, setLoyaltyPointsToAdd] = useState(0);

  // Calculate client data with segmentation
  const clientsData = useMemo(() => {
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    return profiles.map(profile => {
      const clientOrders = orders.filter(o => o.user_id === profile.id);
      const totalSpent = clientOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      const orderCount = clientOrders.length;
      const averageOrder = orderCount > 0 ? totalSpent / orderCount : 0;
      
      const sortedOrders = [...clientOrders].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const firstOrderDate = sortedOrders.length > 0 ? sortedOrders[sortedOrders.length - 1].created_at : null;
      const lastOrderDate = sortedOrders.length > 0 ? sortedOrders[0].created_at : null;

      // Determine segment
      let segment: 'vip' | 'regular' | 'new' | 'inactive' = 'new';
      if (orderCount === 0) {
        segment = 'new';
      } else if (lastOrderDate && new Date(lastOrderDate) < ninetyDaysAgo) {
        segment = 'inactive';
      } else if (totalSpent >= 100000 || orderCount >= 10) {
        segment = 'vip';
      } else if (orderCount >= 2) {
        segment = 'regular';
      }

      // Determine tier based on total spent
      let tier: ClientTier = 'bronze';
      if (totalSpent >= TIER_CONFIG.platinum.minSpent) tier = 'platinum';
      else if (totalSpent >= TIER_CONFIG.gold.minSpent) tier = 'gold';
      else if (totalSpent >= TIER_CONFIG.silver.minSpent) tier = 'silver';

      // Calculate loyalty points (10 points per 1000 FCFA, multiplied by tier)
      const basePoints = Math.floor(totalSpent / 1000) * 10;
      const loyaltyPoints = Math.floor(basePoints * TIER_CONFIG[tier].pointsMultiplier);

      // Find favorite products
      const productCounts: Record<string, number> = {};
      clientOrders.forEach(order => {
        order.items?.forEach((item: CartItem) => {
          productCounts[item.name] = (productCounts[item.name] || 0) + item.quantity;
        });
      });
      const favoriteProducts = Object.entries(productCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      return {
        profile,
        orders: clientOrders,
        totalSpent,
        orderCount,
        averageOrder,
        firstOrderDate,
        lastOrderDate,
        segment,
        tier,
        loyaltyPoints,
        favoriteProducts
      } as ClientData;
    });
  }, [profiles, orders]);

  // Filter and sort clients
  const filteredClients = useMemo(() => {
    let filtered = clientsData;

    // Filter by segment
    if (selectedSegment !== 'all') {
      filtered = filtered.filter(c => c.segment === selectedSegment);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.profile.full_name?.toLowerCase().includes(query) ||
        c.profile.email?.toLowerCase().includes(query) ||
        c.profile.phone?.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case 'spent':
        filtered.sort((a, b) => b.totalSpent - a.totalSpent);
        break;
      case 'orders':
        filtered.sort((a, b) => b.orderCount - a.orderCount);
        break;
      case 'recent':
        filtered.sort((a, b) => {
          if (!a.lastOrderDate) return 1;
          if (!b.lastOrderDate) return -1;
          return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime();
        });
        break;
    }

    return filtered;
  }, [clientsData, selectedSegment, searchQuery, sortBy]);

  // Stats
  const stats = useMemo(() => {
    const vipClients = clientsData.filter(c => c.segment === 'vip');
    const regularClients = clientsData.filter(c => c.segment === 'regular');
    const newClients = clientsData.filter(c => c.segment === 'new');
    const inactiveClients = clientsData.filter(c => c.segment === 'inactive');
    const totalRevenue = clientsData.reduce((sum, c) => sum + c.totalSpent, 0);
    const avgLifetimeValue = clientsData.length > 0 ? totalRevenue / clientsData.length : 0;

    return {
      total: clientsData.length,
      vip: vipClients.length,
      regular: regularClients.length,
      new: newClients.length,
      inactive: inactiveClients.length,
      totalRevenue,
      avgLifetimeValue,
      vipRevenue: vipClients.reduce((sum, c) => sum + c.totalSpent, 0)
    };
  }, [clientsData]);

  const getSegmentConfig = (segment: string) => {
    switch (segment) {
      case 'vip': return { label: 'VIP', icon: <Crown size={14} />, bg: 'bg-purple-500/20', text: 'text-purple-400' };
      case 'regular': return { label: 'Régulier', icon: <UserCheck size={14} />, bg: 'bg-blue-500/20', text: 'text-blue-400' };
      case 'new': return { label: 'Nouveau', icon: <Star size={14} />, bg: 'bg-emerald-500/20', text: 'text-emerald-400' };
      case 'inactive': return { label: 'Inactif', icon: <Clock size={14} />, bg: 'bg-slate-500/20', text: 'text-slate-400' };
      default: return { label: 'Inconnu', icon: <Users size={14} />, bg: 'bg-slate-500/20', text: 'text-slate-400' };
    }
  };

  const handleAddLoyaltyPoints = async () => {
    if (!selectedClient || loyaltyPointsToAdd <= 0) return;
    setIsUpdatingLoyalty(true);
    try {
      await onUpdateLoyalty(
        selectedClient.profile.id, 
        selectedClient.loyaltyPoints + loyaltyPointsToAdd,
        selectedClient.tier
      );
      setLoyaltyPointsToAdd(0);
    } catch (error) {
      console.error('Error updating loyalty:', error);
    }
    setIsUpdatingLoyalty(false);
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <Users className="text-[#00ADEF]" />
            Gestion Clients
          </h2>
          <p className="text-slate-400 text-sm">
            Profils, segmentation et fidélité • {stats.total} client(s)
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white w-48 focus:ring-2 focus:ring-[#00ADEF]"
            />
          </div>
          
          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
          >
            <option value="spent">Total dépensé</option>
            <option value="orders">Nb commandes</option>
            <option value="recent">Plus récent</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/10 p-5 rounded-2xl border border-purple-500/20">
          <div className="flex items-center gap-3 mb-2">
            <Crown size={20} className="text-purple-400" />
            <span className="text-xs text-slate-400 font-bold uppercase">Clients VIP</span>
          </div>
          <div className="text-2xl font-black text-white">{stats.vip}</div>
          <p className="text-xs text-slate-400 mt-1">{stats.vipRevenue.toLocaleString()} F de CA</p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/10 p-5 rounded-2xl border border-blue-500/20">
          <div className="flex items-center gap-3 mb-2">
            <UserCheck size={20} className="text-blue-400" />
            <span className="text-xs text-slate-400 font-bold uppercase">Réguliers</span>
          </div>
          <div className="text-2xl font-black text-white">{stats.regular}</div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/10 p-5 rounded-2xl border border-emerald-500/20">
          <div className="flex items-center gap-3 mb-2">
            <Star size={20} className="text-emerald-400" />
            <span className="text-xs text-slate-400 font-bold uppercase">Nouveaux</span>
          </div>
          <div className="text-2xl font-black text-white">{stats.new}</div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 p-5 rounded-2xl border border-amber-500/20">
          <div className="flex items-center gap-3 mb-2">
            <Gift size={20} className="text-amber-400" />
            <span className="text-xs text-slate-400 font-bold uppercase">Valeur Moy.</span>
          </div>
          <div className="text-2xl font-black text-white">{stats.avgLifetimeValue.toLocaleString()} F</div>
        </div>
      </div>

      {/* Segment Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {(['all', 'vip', 'regular', 'new', 'inactive'] as ClientSegment[]).map(segment => {
          const count = segment === 'all' ? stats.total : stats[segment as keyof typeof stats] as number;
          const config = segment === 'all' 
            ? { label: 'Tous', icon: <Users size={14} />, bg: 'bg-slate-500/20', text: 'text-slate-400' }
            : getSegmentConfig(segment);
          
          return (
            <button
              key={segment}
              onClick={() => setSelectedSegment(segment)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                selectedSegment === segment
                  ? 'bg-[#00ADEF] text-white'
                  : `${config.bg} ${config.text} hover:opacity-80`
              }`}
            >
              {config.icon}
              {config.label}
              <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-xs">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Clients List */}
      <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="text-left p-4 text-xs font-bold text-slate-400 uppercase">Client</th>
                <th className="text-left p-4 text-xs font-bold text-slate-400 uppercase">Segment</th>
                <th className="text-left p-4 text-xs font-bold text-slate-400 uppercase">Tier</th>
                <th className="text-right p-4 text-xs font-bold text-slate-400 uppercase">Commandes</th>
                <th className="text-right p-4 text-xs font-bold text-slate-400 uppercase">Total Dépensé</th>
                <th className="text-right p-4 text-xs font-bold text-slate-400 uppercase">Points</th>
                <th className="text-center p-4 text-xs font-bold text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredClients.map(client => {
                const segmentConfig = getSegmentConfig(client.segment);
                const tierConfig = TIER_CONFIG[client.tier];
                
                return (
                  <tr key={client.profile.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#00ADEF] to-[#1E3A8A] rounded-xl flex items-center justify-center text-white font-black">
                          {client.profile.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-white">{client.profile.full_name || 'Sans nom'}</p>
                          <p className="text-xs text-slate-400">{client.profile.email || client.profile.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${segmentConfig.bg} ${segmentConfig.text}`}>
                        {segmentConfig.icon}
                        {segmentConfig.label}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${tierConfig.bg} ${tierConfig.color}`}>
                        {tierConfig.icon}
                        {tierConfig.label}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-bold text-white">{client.orderCount}</span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-bold text-emerald-400">{client.totalSpent.toLocaleString()} F</span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-bold text-amber-400">{client.loyaltyPoints.toLocaleString()}</span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedClient(client);
                          setShowClientModal(true);
                        }}
                        className="p-2 bg-[#00ADEF]/20 text-[#00ADEF] rounded-lg hover:bg-[#00ADEF]/30 transition-colors"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredClients.length === 0 && (
          <div className="p-12 text-center">
            <Users size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400">Aucun client trouvé</p>
          </div>
        )}
      </div>

      {/* Client Detail Modal */}
      {showClientModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-700">
            {/* Header */}
            <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-[#00ADEF] to-[#1E3A8A] rounded-2xl flex items-center justify-center text-white text-xl font-black">
                  {selectedClient.profile.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">{selectedClient.profile.full_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {(() => {
                      const segConfig = getSegmentConfig(selectedClient.segment);
                      const tierConf = TIER_CONFIG[selectedClient.tier];
                      return (
                        <>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${segConfig.bg} ${segConfig.text}`}>
                            {segConfig.icon} {segConfig.label}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${tierConf.bg} ${tierConf.color}`}>
                            {tierConf.icon} {tierConf.label}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowClientModal(false);
                  setSelectedClient(null);
                }}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 uppercase font-bold mb-1">Email</p>
                  <p className="text-white font-medium">{selectedClient.profile.email || '-'}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 uppercase font-bold mb-1">Téléphone</p>
                  <p className="text-white font-medium">{selectedClient.profile.phone || '-'}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-white">{selectedClient.orderCount}</p>
                  <p className="text-xs text-slate-400">Commandes</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-emerald-400">{selectedClient.totalSpent.toLocaleString()}</p>
                  <p className="text-xs text-slate-400">Total (FCFA)</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-blue-400">{Math.round(selectedClient.averageOrder).toLocaleString()}</p>
                  <p className="text-xs text-slate-400">Panier Moy.</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-amber-400">{selectedClient.loyaltyPoints.toLocaleString()}</p>
                  <p className="text-xs text-slate-400">Points</p>
                </div>
              </div>

              {/* Loyalty Program */}
              <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl border border-amber-500/20 p-5">
                <h4 className="font-black text-white mb-4 flex items-center gap-2">
                  <Gift size={18} className="text-amber-400" />
                  Programme Fidélité
                </h4>
                
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">Progression vers {
                        selectedClient.tier === 'platinum' ? 'Platine MAX' :
                        selectedClient.tier === 'gold' ? 'Platine' :
                        selectedClient.tier === 'silver' ? 'Or' : 'Argent'
                      }</span>
                      <span className="text-sm font-bold text-white">
                        {selectedClient.totalSpent.toLocaleString()} / {
                          selectedClient.tier === 'platinum' ? '∞' :
                          selectedClient.tier === 'gold' ? TIER_CONFIG.platinum.minSpent.toLocaleString() :
                          selectedClient.tier === 'silver' ? TIER_CONFIG.gold.minSpent.toLocaleString() :
                          TIER_CONFIG.silver.minSpent.toLocaleString()
                        } F
                      </span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                        style={{ 
                          width: `${Math.min(100, (selectedClient.totalSpent / (
                            selectedClient.tier === 'platinum' ? selectedClient.totalSpent :
                            selectedClient.tier === 'gold' ? TIER_CONFIG.platinum.minSpent :
                            selectedClient.tier === 'silver' ? TIER_CONFIG.gold.minSpent :
                            TIER_CONFIG.silver.minSpent
                          )) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    placeholder="Points à ajouter"
                    value={loyaltyPointsToAdd || ''}
                    onChange={e => setLoyaltyPointsToAdd(parseInt(e.target.value) || 0)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white"
                  />
                  <button
                    onClick={handleAddLoyaltyPoints}
                    disabled={loyaltyPointsToAdd <= 0 || isUpdatingLoyalty}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isUpdatingLoyalty ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    Ajouter
                  </button>
                </div>
              </div>

              {/* Favorite Products */}
              {selectedClient.favoriteProducts.length > 0 && (
                <div>
                  <h4 className="font-black text-white mb-3 flex items-center gap-2">
                    <Heart size={18} className="text-red-400" />
                    Produits Favoris
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedClient.favoriteProducts.map((product, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-slate-800 rounded-lg text-sm text-white">
                        {product.name} <span className="text-slate-400">({product.count}x)</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Order History */}
              <div>
                <h4 className="font-black text-white mb-3 flex items-center gap-2">
                  <ShoppingBag size={18} className="text-[#00ADEF]" />
                  Historique Commandes
                </h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {selectedClient.orders.slice(0, 10).map(order => (
                    <div key={order.id} className="flex items-center justify-between bg-slate-800/50 rounded-xl p-3">
                      <div>
                        <p className="text-sm font-bold text-white">
                          {format(parseISO(order.created_at), 'd MMM yyyy', { locale: fr })}
                        </p>
                        <p className="text-xs text-slate-400">
                          {order.items?.length || 0} article(s)
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-400">{order.total?.toLocaleString()} F</p>
                        <p className={`text-xs ${
                          order.status === 'Livré' ? 'text-emerald-400' :
                          order.status === 'Annulé' ? 'text-red-400' : 'text-amber-400'
                        }`}>
                          {order.status}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {selectedClient.orders.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">Aucune commande</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ========================================
// KPI DASHBOARD TAB COMPONENT - Performance Tracking
// ========================================

type KPIWidgetType = 'revenue' | 'orders' | 'avg-order' | 'conversion' | 'delivery-time' | 'stock' | 'clients' | 'growth';
type KPIPeriod = 'today' | 'week' | 'month' | 'quarter' | 'year';

interface KPIGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  unit: string;
  period: KPIPeriod;
  category: 'revenue' | 'orders' | 'clients' | 'delivery';
}

interface KPIDashboardTabProps {
  orders: Order[];
  products: Product[];
  profiles: Profile[];
  drivers: Driver[];
}

// KPI Card - Individual metric display component
const KPICard = ({ 
  title, 
  value, 
  previous, 
  growth, 
  icon, 
  color, 
  unit = '',
  comparePeriod = true
}: { 
  title: string; 
  value: number; 
  previous?: number; 
  growth?: number; 
  icon: React.ReactNode; 
  color: string;
  unit?: string;
  comparePeriod?: boolean;
}) => (
  <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 hover:border-slate-700 transition-all">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      {growth !== undefined && comparePeriod && (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-bold ${
          growth >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
        }`}>
          {growth >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
          {Math.abs(growth)}%
        </div>
      )}
    </div>
    <p className="text-3xl font-black text-white mb-1">
      {typeof value === 'number' ? value.toLocaleString() : value}{unit && <span className="text-lg text-slate-400 ml-1">{unit}</span>}
    </p>
    <p className="text-sm text-slate-400">{title}</p>
    {previous !== undefined && comparePeriod && (
      <p className="text-xs text-slate-500 mt-2">
        Période précédente: {previous.toLocaleString()}{unit}
      </p>
    )}
  </div>
);

// Goal Card - Objective progress display
const GoalCard = ({ goal }: { goal: KPIGoal }) => {
  const progress = Math.min((goal.current / goal.target) * 100, 100);
  const isAchieved = goal.current >= goal.target;
  
  return (
    <div className={`bg-slate-900 rounded-2xl border p-5 ${
      isAchieved ? 'border-emerald-500/50' : 'border-slate-800'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-white text-sm">{goal.name}</h4>
        {isAchieved && <Award size={20} className="text-emerald-400" />}
      </div>
      <div className="flex items-end gap-2 mb-3">
        <span className="text-2xl font-black text-white">{goal.current.toLocaleString()}</span>
        <span className="text-slate-400 text-sm mb-1">/ {goal.target.toLocaleString()} {goal.unit}</span>
      </div>
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all ${
            isAchieved ? 'bg-emerald-500' : progress > 75 ? 'bg-amber-500' : 'bg-[#00ADEF]'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-slate-500 mt-2">{Math.round(progress)}% atteint</p>
    </div>
  );
};

const KPIDashboardTab: React.FC<KPIDashboardTabProps> = ({ orders, profiles }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<KPIPeriod>('month');
  const [comparePeriod, setComparePeriod] = useState<boolean>(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_activeWidgets, _setActiveWidgets] = useState<KPIWidgetType[]>(['revenue', 'orders', 'avg-order', 'clients']);
  const [goals] = useState<KPIGoal[]>([
    { id: '1', name: 'Chiffre d\'affaires mensuel', target: 500000, current: 0, unit: 'FCFA', period: 'month', category: 'revenue' },
    { id: '2', name: 'Commandes par jour', target: 20, current: 0, unit: 'commandes', period: 'today', category: 'orders' },
    { id: '3', name: 'Nouveaux clients', target: 50, current: 0, unit: 'clients', period: 'month', category: 'clients' },
    { id: '4', name: 'Temps livraison moyen', target: 30, current: 0, unit: 'min', period: 'month', category: 'delivery' },
  ]);
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [editingGoal, setEditingGoal] = useState<KPIGoal | null>(null);

  // Calculate date ranges
  const getDateRange = useCallback((period: KPIPeriod) => {
    const now = new Date();
    switch (period) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'week':
        return { start: startOfWeek(now, { locale: fr }), end: endOfWeek(now, { locale: fr }) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const quarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
        return { start: quarterStart, end: quarterEnd };
      case 'year':
        return { start: startOfYear(now), end: endOfYear(now) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  }, []);

  const getPreviousDateRange = useCallback((period: KPIPeriod) => {
    const now = new Date();
    switch (period) {
      case 'today':
        const yesterday = subDays(now, 1);
        return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
      case 'week':
        const lastWeekStart = subDays(startOfWeek(now, { locale: fr }), 7);
        return { start: lastWeekStart, end: subDays(endOfWeek(now, { locale: fr }), 7) };
      case 'month':
        return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
      case 'quarter':
        const prevQuarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 - 3, 1);
        const prevQuarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 0);
        return { start: prevQuarterStart, end: prevQuarterEnd };
      case 'year':
        return { start: startOfYear(subMonths(now, 12)), end: endOfYear(subMonths(now, 12)) };
      default:
        return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
    }
  }, []);

  // Filter orders by period
  const filterOrdersByPeriod = useCallback((orderList: Order[], start: Date, end: Date) => {
    return orderList.filter(o => {
      const orderDate = parseISO(o.created_at);
      return orderDate >= start && orderDate <= end;
    });
  }, []);

  // Calculate KPIs
  const kpiData = useMemo(() => {
    const { start, end } = getDateRange(selectedPeriod);
    const { start: prevStart, end: prevEnd } = getPreviousDateRange(selectedPeriod);
    
    const currentOrders = filterOrdersByPeriod(orders, start, end);
    const previousOrders = filterOrdersByPeriod(orders, prevStart, prevEnd);
    
    const deliveredCurrent = currentOrders.filter(o => o.status === 'Livré');
    const deliveredPrevious = previousOrders.filter(o => o.status === 'Livré');
    
    const currentRevenue = deliveredCurrent.reduce((sum, o) => sum + o.total, 0);
    const previousRevenue = deliveredPrevious.reduce((sum, o) => sum + o.total, 0);
    
    const currentOrderCount = currentOrders.length;
    const previousOrderCount = previousOrders.length;
    
    const currentAvgOrder = currentOrderCount > 0 ? currentRevenue / deliveredCurrent.length : 0;
    const previousAvgOrder = previousOrderCount > 0 ? previousRevenue / deliveredPrevious.length : 0;
    
    // New clients in period
    const newClientsCount = profiles.filter(p => {
      const createdAt = parseISO(p.created_at);
      return createdAt >= start && createdAt <= end && p.role === 'client';
    }).length;
    
    const prevNewClientsCount = profiles.filter(p => {
      const createdAt = parseISO(p.created_at);
      return createdAt >= prevStart && createdAt <= prevEnd && p.role === 'client';
    }).length;

    const calcGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      revenue: {
        current: currentRevenue,
        previous: previousRevenue,
        growth: calcGrowth(currentRevenue, previousRevenue)
      },
      orders: {
        current: currentOrderCount,
        previous: previousOrderCount,
        growth: calcGrowth(currentOrderCount, previousOrderCount)
      },
      avgOrder: {
        current: Math.round(currentAvgOrder),
        previous: Math.round(previousAvgOrder),
        growth: calcGrowth(currentAvgOrder, previousAvgOrder)
      },
      clients: {
        current: newClientsCount,
        previous: prevNewClientsCount,
        growth: calcGrowth(newClientsCount, prevNewClientsCount)
      },
      deliveredOrders: deliveredCurrent.length,
      cancelledOrders: currentOrders.filter(o => o.status === 'Annulé').length,
      pendingOrders: currentOrders.filter(o => o.status === 'En attente' || o.status === 'En attente de confirmation').length,
      conversionRate: currentOrderCount > 0 ? Math.round((deliveredCurrent.length / currentOrderCount) * 100) : 0
    };
  }, [orders, profiles, selectedPeriod, getDateRange, getPreviousDateRange, filterOrdersByPeriod]);

  // Update goals with current values (computed directly without useMemo)
  const revenueValue = kpiData.revenue.current;
  const ordersValue = kpiData.orders.current;
  const clientsValue = kpiData.clients.current;
  const todayOrders = filterOrdersByPeriod(orders, startOfDay(new Date()), endOfDay(new Date())).length;
  
  const updatedGoals = goals.map(goal => {
    let current = 0;
    switch (goal.category) {
      case 'revenue':
        current = revenueValue;
        break;
      case 'orders':
        current = goal.period === 'today' ? todayOrders : ordersValue;
        break;
      case 'clients':
        current = clientsValue;
        break;
      case 'delivery':
        current = 25; // Simulated avg delivery time
        break;
    }
    return { ...goal, current };
  });

  // Chart data for trend
  const trendData = useMemo(() => {
    const { start, end } = getDateRange(selectedPeriod);
    const days = eachDayOfInterval({ start, end });
    
    return days.slice(-14).map(day => {
      const dayOrders = orders.filter(o => isSameDay(parseISO(o.created_at), day));
      const dayRevenue = dayOrders.filter(o => o.status === 'Livré').reduce((sum, o) => sum + o.total, 0);
      
      return {
        date: format(day, 'dd/MM', { locale: fr }),
        commandes: dayOrders.length,
        revenus: dayRevenue,
        livrees: dayOrders.filter(o => o.status === 'Livré').length
      };
    });
  }, [orders, selectedPeriod, getDateRange]);

  // Product performance
  const productPerformance = useMemo(() => {
    const { start, end } = getDateRange(selectedPeriod);
    const periodOrders = filterOrdersByPeriod(orders, start, end).filter(o => o.status === 'Livré');
    
    const productStats: Record<string, { name: string; quantity: number; revenue: number }> = {};
    
    periodOrders.forEach(order => {
      order.items?.forEach(item => {
        if (!productStats[item.id]) {
          productStats[item.id] = { name: item.name, quantity: 0, revenue: 0 };
        }
        productStats[item.id].quantity += item.quantity;
        productStats[item.id].revenue += item.price * item.quantity;
      });
    });
    
    return Object.values(productStats).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [orders, selectedPeriod, getDateRange, filterOrdersByPeriod]);

  const PERIOD_LABELS: Record<KPIPeriod, string> = {
    'today': 'Aujourd\'hui',
    'week': 'Cette semaine',
    'month': 'Ce mois',
    'quarter': 'Ce trimestre',
    'year': 'Cette année'
  };

  return (
    <>
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-white lg:hidden">KPIs & Performance</h2>
          <p className="text-sm text-slate-400">Suivi des indicateurs clés</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <div className="flex items-center bg-slate-800 rounded-xl p-1">
            {(['today', 'week', 'month', 'quarter', 'year'] as KPIPeriod[]).map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedPeriod === period 
                    ? 'bg-[#00ADEF] text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {period === 'today' ? 'Jour' : 
                 period === 'week' ? 'Sem.' : 
                 period === 'month' ? 'Mois' : 
                 period === 'quarter' ? 'Trim.' : 'Année'}
              </button>
            ))}
          </div>
          
          {/* Compare Toggle */}
          <button
            onClick={() => setComparePeriod(!comparePeriod)}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              comparePeriod ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-slate-400'
            }`}
          >
            <TrendIcon size={14} /> Comparer
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Chiffre d'affaires"
          value={kpiData.revenue.current}
          previous={kpiData.revenue.previous}
          growth={kpiData.revenue.growth}
          icon={<DollarSign size={24} className="text-emerald-400" />}
          color="bg-emerald-500/10"
          unit=" F"
        />
        <KPICard
          title="Commandes"
          value={kpiData.orders.current}
          previous={kpiData.orders.previous}
          growth={kpiData.orders.growth}
          icon={<ShoppingBag size={24} className="text-blue-400" />}
          color="bg-blue-500/10"
        />
        <KPICard
          title="Panier moyen"
          value={kpiData.avgOrder.current}
          previous={kpiData.avgOrder.previous}
          growth={kpiData.avgOrder.growth}
          icon={<ShoppingCart size={24} className="text-purple-400" />}
          color="bg-purple-500/10"
          unit=" F"
        />
        <KPICard
          title="Nouveaux clients"
          value={kpiData.clients.current}
          previous={kpiData.clients.previous}
          growth={kpiData.clients.growth}
          icon={<Users size={24} className="text-amber-400" />}
          color="bg-amber-500/10"
        />
      </div>

      {/* Conversion Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <CheckCircle size={16} /> <span className="text-xs font-bold uppercase">Livrées</span>
          </div>
          <p className="text-2xl font-black text-white">{kpiData.deliveredOrders}</p>
        </div>
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <Clock size={16} /> <span className="text-xs font-bold uppercase">En attente</span>
          </div>
          <p className="text-2xl font-black text-white">{kpiData.pendingOrders}</p>
        </div>
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <X size={16} /> <span className="text-xs font-bold uppercase">Annulées</span>
          </div>
          <p className="text-2xl font-black text-white">{kpiData.cancelledOrders}</p>
        </div>
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
          <div className="flex items-center gap-2 text-[#00ADEF] mb-2">
            <Percent size={16} /> <span className="text-xs font-bold uppercase">Taux conversion</span>
          </div>
          <p className="text-2xl font-black text-white">{kpiData.conversionRate}%</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 p-6">
          <h3 className="font-black text-white mb-4 flex items-center gap-2">
            <Activity size={20} className="text-[#00ADEF]" />
            Tendance ({PERIOD_LABELS[selectedPeriod]})
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ADEF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00ADEF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenus" 
                  stroke="#00ADEF" 
                  fill="url(#colorRevenue)" 
                  strokeWidth={2}
                  name="Revenus (F)"
                />
                <Line 
                  type="monotone" 
                  dataKey="commandes" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={false}
                  name="Commandes"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
          <h3 className="font-black text-white mb-4 flex items-center gap-2">
            <Package size={20} className="text-purple-400" />
            Top Produits
          </h3>
          <div className="space-y-3">
            {productPerformance.map((product, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                  idx === 0 ? 'bg-amber-500 text-black' :
                  idx === 1 ? 'bg-slate-400 text-black' :
                  idx === 2 ? 'bg-amber-700 text-white' :
                  'bg-slate-800 text-slate-400'
                }`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">{product.name}</p>
                  <p className="text-xs text-slate-400">{product.quantity} vendus</p>
                </div>
                <p className="font-bold text-emerald-400 text-sm">{product.revenue.toLocaleString()} F</p>
              </div>
            ))}
            {productPerformance.length === 0 && (
              <p className="text-center text-slate-500 py-4">Aucune donnée</p>
            )}
          </div>
        </div>
      </div>

      {/* Goals Section */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-black text-white flex items-center gap-2">
            <Target size={20} className="text-[#00ADEF]" />
            Objectifs de Performance
          </h3>
          <button
            onClick={() => {
              setEditingGoal(null);
              setShowGoalEditor(true);
            }}
            className="px-3 py-1.5 bg-[#00ADEF] hover:bg-[#00ADEF]/80 rounded-xl text-sm font-bold text-white flex items-center gap-2"
          >
            <Plus size={14} /> Nouvel objectif
          </button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {updatedGoals.map(goal => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      </div>

      {/* Goal Editor Modal */}
      {showGoalEditor && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-md w-full">
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-white">
                  {editingGoal ? 'Modifier l\'objectif' : 'Nouvel objectif'}
                </h2>
                <button onClick={() => setShowGoalEditor(false)} className="p-2 hover:bg-slate-800 rounded-xl">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">Nom de l&apos;objectif</label>
                <input
                  type="text"
                  placeholder="Ex: Chiffre d'affaires mensuel"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white"
                  defaultValue={editingGoal?.name || ''}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">Valeur cible</label>
                  <input
                    type="number"
                    placeholder="500000"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white"
                    defaultValue={editingGoal?.target || ''}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">Unité</label>
                  <input
                    type="text"
                    placeholder="FCFA"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white"
                    defaultValue={editingGoal?.unit || ''}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">Catégorie</label>
                <select className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white">
                  <option value="revenue">Chiffre d&apos;affaires</option>
                  <option value="orders">Commandes</option>
                  <option value="clients">Clients</option>
                  <option value="delivery">Livraison</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">Période</label>
                <select className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white">
                  <option value="today">Jour</option>
                  <option value="week">Semaine</option>
                  <option value="month">Mois</option>
                  <option value="quarter">Trimestre</option>
                  <option value="year">Année</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-slate-800 flex gap-3">
              <button
                onClick={() => setShowGoalEditor(false)}
                className="flex-1 py-3 bg-slate-800 rounded-xl font-bold text-slate-400"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  // Save goal logic
                  setShowGoalEditor(false);
                }}
                className="flex-1 py-3 bg-[#00ADEF] rounded-xl font-bold text-white"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ========================================
// DELIVERY MAP TAB COMPONENT - Real-time Delivery Tracking
// ========================================

interface DeliveryZone {
  id: string;
  name: string;
  color: string;
  neighborhoods: string[];
  baseDeliveryFee: number;
  estimatedTime: string;
  active: boolean;
}

interface DriverLocation {
  driver: Driver;
  lat: number;
  lng: number;
  status: 'available' | 'delivering' | 'returning' | 'offline';
  currentOrder?: Order;
  lastUpdate: Date;
  speed?: number;
  heading?: string;
}

interface DeliveryMapTabProps {
  orders: Order[];
  drivers: Driver[];
  onAssignDriver: (orderId: string, driverId: string) => Promise<void>;
  onUpdateZone: (zone: DeliveryZone) => void;
}

// Lomé neighborhoods with coordinates (simulated)
const LOME_NEIGHBORHOODS: Record<string, { lat: number; lng: number; zone: string }> = {
  'Tokoin': { lat: 6.1756, lng: 1.2108, zone: 'centre' },
  'Bè Kpota': { lat: 6.1519, lng: 1.2342, zone: 'centre' },
  'Kodjoviakopé': { lat: 6.1289, lng: 1.2167, zone: 'sud' },
  'Nyekonakpoé': { lat: 6.1378, lng: 1.2089, zone: 'centre' },
  'Adidogomé': { lat: 6.1667, lng: 1.1833, zone: 'nord' },
  'Agbalépedo': { lat: 6.1756, lng: 1.2283, zone: 'nord' },
  'Avenou': { lat: 6.1522, lng: 1.2178, zone: 'centre' },
  'Cassablanca': { lat: 6.1311, lng: 1.2244, zone: 'sud' },
  'Dékon': { lat: 6.1789, lng: 1.2356, zone: 'nord' },
  'Forever': { lat: 6.1844, lng: 1.2178, zone: 'nord' },
  'Hedzranawoe': { lat: 6.1678, lng: 1.2411, zone: 'nord' },
  'Kegue': { lat: 6.1922, lng: 1.2089, zone: 'nord' },
  'Akossombo': { lat: 6.1633, lng: 1.2167, zone: 'centre' },
  'Baguida': { lat: 6.1200, lng: 1.3167, zone: 'est' },
  'Athémé': { lat: 6.1456, lng: 1.1944, zone: 'ouest' },
  'Agoenyive': { lat: 6.1989, lng: 1.2011, zone: 'nord' },
  'Aflao Gakli': { lat: 6.1167, lng: 1.1833, zone: 'ouest' },
  'Totsi': { lat: 6.1944, lng: 1.2244, zone: 'nord' },
};

const DEFAULT_ZONES: DeliveryZone[] = [
  {
    id: 'centre',
    name: 'Centre-ville',
    color: '#10B981',
    neighborhoods: ['Tokoin', 'Bè Kpota', 'Nyekonakpoé', 'Avenou', 'Akossombo'],
    baseDeliveryFee: 1000,
    estimatedTime: '15-30 min',
    active: true
  },
  {
    id: 'nord',
    name: 'Nord Lomé',
    color: '#3B82F6',
    neighborhoods: ['Adidogomé', 'Agbalépedo', 'Dékon', 'Forever', 'Hedzranawoe', 'Kegue', 'Agoenyive', 'Totsi'],
    baseDeliveryFee: 1500,
    estimatedTime: '30-45 min',
    active: true
  },
  {
    id: 'sud',
    name: 'Sud Lomé (Plage)',
    color: '#F59E0B',
    neighborhoods: ['Kodjoviakopé', 'Cassablanca'],
    baseDeliveryFee: 1500,
    estimatedTime: '25-40 min',
    active: true
  },
  {
    id: 'est',
    name: 'Est (Baguida)',
    color: '#EF4444',
    neighborhoods: ['Baguida'],
    baseDeliveryFee: 2500,
    estimatedTime: '45-60 min',
    active: true
  },
  {
    id: 'ouest',
    name: 'Ouest (Aflao)',
    color: '#8B5CF6',
    neighborhoods: ['Athémé', 'Aflao Gakli'],
    baseDeliveryFee: 2000,
    estimatedTime: '35-50 min',
    active: true
  },
];

const DeliveryMapTab: React.FC<DeliveryMapTabProps> = ({ orders, drivers, onAssignDriver, onUpdateZone }) => {
  const [zones, setZones] = useState<DeliveryZone[]>(DEFAULT_ZONES);
  const [driverLocations, setDriverLocations] = useState<DriverLocation[]>([]);
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<DriverLocation | null>(null);
  const [showZoneEditor, setShowZoneEditor] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [mapView, setMapView] = useState<'drivers' | 'zones' | 'orders'>('drivers');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Simulate driver locations
  useEffect(() => {
    const simulateDriverLocations = () => {
      const activeDrivers = drivers.filter(d => d.status === 'Disponible' || d.is_available);
      const locations: DriverLocation[] = activeDrivers.map((driver) => {
        // Get orders assigned to this driver
        const driverOrders = orders.filter(o => 
          o.driver_id === driver.id && 
          ['Préparation', 'Livraison en cours'].includes(o.status)
        );
        
        // Determine status based on actual data
        let status: 'available' | 'delivering' | 'returning' | 'offline';
        if (driverOrders.length > 0) {
          status = 'delivering';
        } else if (driver.status === 'Disponible' || driver.is_available) {
          status = 'available';
        } else if (driver.status === 'En livraison') {
          status = 'delivering';
        } else if (driver.status === 'Hors service') {
          status = 'offline';
        } else {
          status = 'available'; // Default to available if no orders
        }
        
        // PRO-GLAÇONS HQ coordinates
        const HQ_LAT = 6.1725;
        const HQ_LNG = 1.2314;
        
        // Position based on status:
        // - Available/Offline: at HQ (siège)
        // - Delivering: simulated position near delivery address
        let lat: number;
        let lng: number;
        
        if (status === 'delivering' && driverOrders[0]) {
          // If delivering, simulate position near the delivery area
          const neighborhoods = Object.keys(LOME_NEIGHBORHOODS);
          const orderNeighborhood = driverOrders[0].neighborhood || '';
          const matchedNeighborhood = neighborhoods.find(n => 
            orderNeighborhood.toLowerCase().includes(n.toLowerCase())
          );
          
          if (matchedNeighborhood) {
            const coords = LOME_NEIGHBORHOODS[matchedNeighborhood];
            lat = coords.lat + (Math.random() - 0.5) * 0.01;
            lng = coords.lng + (Math.random() - 0.5) * 0.01;
          } else {
            // Random position if neighborhood not found
            const randomNeighborhood = neighborhoods[Math.floor(Math.random() * neighborhoods.length)];
            const coords = LOME_NEIGHBORHOODS[randomNeighborhood];
            lat = coords.lat + (Math.random() - 0.5) * 0.01;
            lng = coords.lng + (Math.random() - 0.5) * 0.01;
          }
        } else {
          // Available, offline, or no orders: at HQ
          lat = HQ_LAT;
          lng = HQ_LNG;
        }
        
        return {
          driver,
          lat,
          lng,
          status,
          currentOrder: driverOrders[0],
          lastUpdate: new Date(),
          speed: Math.round(Math.random() * 40 + 10),
          heading: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)]
        };
      });
      setDriverLocations(locations);
      setLastRefresh(new Date());
    };

    simulateDriverLocations();
    
    if (autoRefresh) {
      const interval = setInterval(simulateDriverLocations, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [drivers, orders, autoRefresh]);

  // Get pending orders with delivery addresses
  const pendingDeliveries = useMemo(() => {
    return orders.filter(o => 
      ['En attente', 'Préparation', 'Livraison en cours', 'En attente de confirmation'].includes(o.status) &&
      o.address // Has delivery address
    ).map(order => {
      // Try to match neighborhood from address
      const address = (order.address || order.neighborhood || '').toLowerCase();
      let matchedNeighborhood = null;
      for (const [name, coords] of Object.entries(LOME_NEIGHBORHOODS)) {
        if (address.includes(name.toLowerCase())) {
          matchedNeighborhood = { name, ...coords };
          break;
        }
      }
      return { order, neighborhood: matchedNeighborhood };
    });
  }, [orders]);

  // Stats
  const stats = useMemo(() => {
    const activeDrivers = driverLocations.filter(d => d.status !== 'offline');
    const deliveringDrivers = driverLocations.filter(d => d.status === 'delivering');
    const availableDrivers = driverLocations.filter(d => d.status === 'available');
    const pendingOrders = pendingDeliveries.length;
    const activeZones = zones.filter(z => z.active);
    
    return {
      activeDrivers: activeDrivers.length,
      deliveringDrivers: deliveringDrivers.length,
      availableDrivers: availableDrivers.length,
      pendingOrders,
      activeZones: activeZones.length,
      avgDeliveryTime: '28 min',
      coverage: Math.round((activeZones.length / zones.length) * 100)
    };
  }, [driverLocations, pendingDeliveries, zones]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-500';
      case 'delivering': return 'bg-blue-500';
      case 'returning': return 'bg-amber-500';
      case 'offline': return 'bg-slate-500';
      default: return 'bg-slate-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Disponible';
      case 'delivering': return 'En livraison';
      case 'returning': return 'En retour';
      case 'offline': return 'Hors ligne';
      default: return status;
    }
  };

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <Truck size={20} className="text-emerald-400" />
            </div>
            <span className="text-sm text-slate-400">Livreurs Actifs</span>
          </div>
          <p className="text-3xl font-black text-white">{stats.activeDrivers}</p>
          <p className="text-xs text-slate-500 mt-1">{stats.availableDrivers} disponibles</p>
        </div>

        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Navigation size={20} className="text-blue-400" />
            </div>
            <span className="text-sm text-slate-400">En Livraison</span>
          </div>
          <p className="text-3xl font-black text-white">{stats.deliveringDrivers}</p>
          <p className="text-xs text-slate-500 mt-1">livraisons en cours</p>
        </div>

        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
              <ShoppingBag size={20} className="text-amber-400" />
            </div>
            <span className="text-sm text-slate-400">Commandes</span>
          </div>
          <p className="text-3xl font-black text-white">{stats.pendingOrders}</p>
          <p className="text-xs text-slate-500 mt-1">à livrer</p>
        </div>

        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
              <Clock size={20} className="text-purple-400" />
            </div>
            <span className="text-sm text-slate-400">Temps Moyen</span>
          </div>
          <p className="text-3xl font-black text-white">{stats.avgDeliveryTime}</p>
          <p className="text-xs text-slate-500 mt-1">de livraison</p>
        </div>

        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[#00ADEF]/10 rounded-xl flex items-center justify-center">
              <Layers size={20} className="text-[#00ADEF]" />
            </div>
            <span className="text-sm text-slate-400">Zones</span>
          </div>
          <p className="text-3xl font-black text-white">{stats.activeZones}/{zones.length}</p>
          <p className="text-xs text-slate-500 mt-1">{stats.coverage}% couverture</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMapView('drivers')}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
              mapView === 'drivers' 
                ? 'bg-[#00ADEF] text-white' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Truck size={16} /> Livreurs
          </button>
          <button
            onClick={() => setMapView('zones')}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
              mapView === 'zones' 
                ? 'bg-[#00ADEF] text-white' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Layers size={16} /> Zones
          </button>
          <button
            onClick={() => setMapView('orders')}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
              mapView === 'orders' 
                ? 'bg-[#00ADEF] text-white' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <ShoppingBag size={16} /> Commandes
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 ${
              autoRefresh ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
            }`}
          >
            <RefreshCw size={16} className={autoRefresh ? 'animate-spin-slow' : ''} />
            {autoRefresh ? 'Auto' : 'Manuel'}
          </button>
          <span className="text-xs text-slate-500">
            Mis à jour: {format(lastRefresh, 'HH:mm:ss', { locale: fr })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real Map with Leaflet */}
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="h-[600px] lg:h-[calc(100vh-280px)] min-h-[500px] relative">
            <DeliveryMap
              drivers={driverLocations.map(loc => ({
                id: loc.driver.id,
                name: loc.driver.name,
                phone: loc.driver.phone,
                lat: loc.lat,
                lng: loc.lng,
                status: loc.status,
                currentOrderId: loc.currentOrder?.id,
                currentOrderAddress: loc.currentOrder?.address || loc.currentOrder?.neighborhood
              }))}
              orders={pendingDeliveries
                .filter(p => p.neighborhood)
                .map(p => ({
                  id: p.order.id,
                  customerName: p.order.full_name,
                  address: p.order.address || p.order.neighborhood,
                  lat: p.neighborhood!.lat,
                  lng: p.neighborhood!.lng,
                  status: p.order.status
                }))}
              zones={zones.map(z => ({
                ...z,
                coordinates: []
              }))}
              mapView={mapView}
              onDriverClick={(driver) => {
                const loc = driverLocations.find(l => l.driver.id === driver.id);
                if (loc) setSelectedDriver(loc);
              }}
            />
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Driver List / Zone List based on view */}
          {mapView === 'drivers' && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
              <h3 className="font-black text-white mb-4 flex items-center gap-2">
                <Truck size={18} className="text-[#00ADEF]" />
                Livreurs ({driverLocations.length})
              </h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {driverLocations.map(loc => (
                  <div
                    key={loc.driver.id}
                    onClick={() => setSelectedDriver(loc)}
                    className={`p-3 rounded-xl cursor-pointer transition-all ${
                      selectedDriver?.driver.id === loc.driver.id
                        ? 'bg-[#00ADEF]/10 border border-[#00ADEF]/30'
                        : 'bg-slate-800/50 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${getStatusColor(loc.status)} flex items-center justify-center`}>
                        <Truck size={18} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white truncate">{loc.driver.name}</p>
                        <p className="text-xs text-slate-400">{loc.driver.phone}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          loc.status === 'available' ? 'bg-emerald-500/10 text-emerald-400' :
                          loc.status === 'delivering' ? 'bg-blue-500/10 text-blue-400' :
                          loc.status === 'returning' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-slate-500/10 text-slate-400'
                        }`}>
                          {getStatusLabel(loc.status)}
                        </span>
                      </div>
                    </div>
                    {loc.currentOrder && (
                      <div className="mt-2 pt-2 border-t border-slate-700">
                        <p className="text-xs text-slate-400">
                          <span className="text-amber-400">Commande:</span> {loc.currentOrder.id.slice(0, 8)}...
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          <MapPin size={10} className="inline mr-1" />
                          {loc.currentOrder.address || loc.currentOrder.neighborhood || 'Adresse non spécifiée'}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {mapView === 'zones' && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-white flex items-center gap-2">
                  <Layers size={18} className="text-[#00ADEF]" />
                  Zones de Livraison
                </h3>
                <button
                  onClick={() => {
                    setEditingZone(null);
                    setShowZoneEditor(true);
                  }}
                  className="p-2 bg-[#00ADEF] rounded-lg hover:bg-[#00ADEF]/80 transition-colors"
                >
                  <Plus size={16} className="text-white" />
                </button>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {zones.map(zone => (
                  <div
                    key={zone.id}
                    onClick={() => setSelectedZone(zone)}
                    className={`p-3 rounded-xl cursor-pointer transition-all ${
                      selectedZone?.id === zone.id
                        ? 'bg-[#00ADEF]/10 border border-[#00ADEF]/30'
                        : 'bg-slate-800/50 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: zone.color }}
                      />
                      <div className="flex-1">
                        <p className="font-bold text-white">{zone.name}</p>
                        <p className="text-xs text-slate-400">{zone.neighborhoods.length} quartiers</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-400">{zone.baseDeliveryFee.toLocaleString()} F</p>
                        <p className="text-xs text-slate-500">{zone.estimatedTime}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {zone.neighborhoods.slice(0, 3).map(n => (
                        <span key={n} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                          {n}
                        </span>
                      ))}
                      {zone.neighborhoods.length > 3 && (
                        <span className="text-xs text-slate-500">+{zone.neighborhoods.length - 3}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mapView === 'orders' && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
              <h3 className="font-black text-white mb-4 flex items-center gap-2">
                <ShoppingBag size={18} className="text-[#00ADEF]" />
                Livraisons en attente ({pendingDeliveries.length})
              </h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {pendingDeliveries.map(({ order, neighborhood }) => (
                  <div
                    key={order.id}
                    className="p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-slate-400">#{order.id.slice(0, 8)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        order.status === 'En attente' ? 'bg-amber-500/10 text-amber-400' :
                        order.status === 'Préparation' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-purple-500/10 text-purple-400'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-white">{order.full_name}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <MapPin size={12} />
                      {order.address || order.neighborhood || 'Adresse non spécifiée'}
                    </p>
                    {neighborhood && (
                      <span className="inline-block mt-2 text-xs bg-[#00ADEF]/10 text-[#00ADEF] px-2 py-0.5 rounded">
                        Zone: {neighborhood.zone}
                      </span>
                    )}
                    <div className="mt-3 flex gap-2">
                      <select
                        className="flex-1 text-xs bg-slate-700 border-0 rounded-lg px-2 py-1.5 text-white"
                        onChange={(e) => onAssignDriver(order.id, e.target.value)}
                        value={order.driver_id || ''}
                      >
                        <option value="">Assigner livreur...</option>
                        {driverLocations
                          .filter(d => d.status === 'available')
                          .map(d => (
                            <option key={d.driver.id} value={d.driver.id}>
                              {d.driver.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                ))}
                {pendingDeliveries.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <ShoppingBag size={32} className="mx-auto mb-2 opacity-50" />
                    <p>Aucune livraison en attente</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
            <h3 className="font-black text-white mb-3">Actions Rapides</h3>
            <div className="space-y-2">
              <button className="w-full p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-left flex items-center gap-3 transition-colors">
                <Route size={18} className="text-[#00ADEF]" />
                <span className="text-sm text-white">Optimiser les routes</span>
              </button>
              <button 
                onClick={() => setShowZoneEditor(true)}
                className="w-full p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-left flex items-center gap-3 transition-colors"
              >
                <Layers size={18} className="text-purple-400" />
                <span className="text-sm text-white">Gérer les zones</span>
              </button>
              <button className="w-full p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-left flex items-center gap-3 transition-colors">
                <Download size={18} className="text-emerald-400" />
                <span className="text-sm text-white">Exporter rapport</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Zone Editor Modal */}
      {showZoneEditor && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-white">
                  {editingZone ? 'Modifier Zone' : 'Nouvelle Zone'}
                </h2>
                <button
                  onClick={() => setShowZoneEditor(false)}
                  className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">Nom de la zone</label>
                <input
                  type="text"
                  placeholder="Ex: Centre-ville"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white"
                  defaultValue={editingZone?.name || ''}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">Couleur</label>
                <div className="flex gap-2">
                  {['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'].map(color => (
                    <button
                      key={color}
                      className="w-10 h-10 rounded-xl border-2 border-transparent hover:border-white transition-all"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">Frais de livraison (FCFA)</label>
                <input
                  type="number"
                  placeholder="1500"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white"
                  defaultValue={editingZone?.baseDeliveryFee || 1500}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">Temps estimé</label>
                <input
                  type="text"
                  placeholder="30-45 min"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white"
                  defaultValue={editingZone?.estimatedTime || ''}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">Quartiers</label>
                <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto p-2 bg-slate-800 rounded-xl">
                  {Object.keys(LOME_NEIGHBORHOODS).map(neighborhood => (
                    <button
                      key={neighborhood}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                        editingZone?.neighborhoods.includes(neighborhood)
                          ? 'bg-[#00ADEF] text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {neighborhood}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-800 flex gap-3">
              <button
                onClick={() => setShowZoneEditor(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-slate-400 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  // Save zone logic - update local state and call parent callback
                  if (editingZone) {
                    setZones(prev => prev.map(z => z.id === editingZone.id ? editingZone : z));
                    onUpdateZone(editingZone);
                  }
                  setShowZoneEditor(false);
                }}
                className="flex-1 py-3 bg-[#00ADEF] hover:bg-[#00ADEF]/80 rounded-xl font-bold text-white transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Driver Detail Modal */}
      {selectedDriver && mapView === 'drivers' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-md w-full">
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full ${getStatusColor(selectedDriver.status)} flex items-center justify-center`}>
                    <Truck size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">{selectedDriver.driver.name}</h2>
                    <p className="text-sm text-slate-400">{selectedDriver.driver.phone}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDriver(null)}
                  className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-white">{selectedDriver.speed || 0}</p>
                  <p className="text-xs text-slate-400">km/h</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-white">{selectedDriver.heading || 'N/A'}</p>
                  <p className="text-xs text-slate-400">Direction</p>
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">Position actuelle</p>
                <p className="text-sm text-white">
                  {selectedDriver.lat.toFixed(4)}° N, {selectedDriver.lng.toFixed(4)}° E
                </p>
              </div>
              {selectedDriver.currentOrder && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                  <p className="text-xs text-amber-400 mb-2 font-bold">Livraison en cours</p>
                  <p className="text-sm text-white font-bold">{selectedDriver.currentOrder.full_name}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    <MapPin size={12} className="inline mr-1" />
                    {selectedDriver.currentOrder.address || selectedDriver.currentOrder.neighborhood}
                  </p>
                </div>
              )}
              <div className="flex gap-3">
                <button className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-colors">
                  <Phone size={16} /> Appeler
                </button>
                <button className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-slate-300 flex items-center justify-center gap-2 transition-colors">
                  <Navigation size={16} /> Localiser
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ========================================
// CALENDAR TAB COMPONENT - Delivery Planning
// ========================================
interface CalendarTabProps {
  orders: Order[];
  drivers: Driver[];
  onScheduleDelivery: (orderId: string, data: { scheduled_date: string; scheduled_time?: string; driver_id?: string }) => Promise<void>;
  onAutoAssignDriver: (orderId: string, date: string) => Promise<Driver | null>;
}

const CalendarTab: React.FC<CalendarTabProps> = ({ orders, drivers, onScheduleDelivery, onAutoAssignDriver }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedOrderForSchedule, setSelectedOrderForSchedule] = useState<Order | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    date: '',
    time: '',
    driver_id: '',
    notes: ''
  });
  const [isScheduling, setIsScheduling] = useState(false);
  const [autoAssigning, setAutoAssigning] = useState<string | null>(null);

  // Get calendar days
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const startWeek = startOfWeek(start, { weekStartsOn: 1 }); // Monday
    const endWeek = endOfWeek(end, { weekStartsOn: 1 });
    
    return eachDayOfInterval({ start: startWeek, end: endWeek });
  }, [currentMonth]);

  // Group orders by date (using created_at or scheduled date)
  const ordersByDate = useMemo(() => {
    const grouped: Record<string, Order[]> = {};
    
    orders.forEach(order => {
      // Use scheduled_date if available, otherwise created_at
      const dateStr = order.scheduled_date 
        ? format(parseISO(order.scheduled_date), 'yyyy-MM-dd')
        : format(parseISO(order.created_at), 'yyyy-MM-dd');
      
      if (!grouped[dateStr]) {
        grouped[dateStr] = [];
      }
      grouped[dateStr].push(order);
    });
    
    return grouped;
  }, [orders]);

  // Get pending orders (not yet scheduled or delivered)
  const pendingOrders = useMemo(() => 
    orders.filter(o => 
      o.status !== 'Livré' && 
      o.status !== 'Annulé' &&
      !o.scheduled_date
    ),
    [orders]
  );

  // Get scheduled deliveries for today
  const todayDeliveries = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    return orders.filter(o => 
      o.scheduled_date && 
      format(parseISO(o.scheduled_date), 'yyyy-MM-dd') === todayStr &&
      o.status !== 'Livré' &&
      o.status !== 'Annulé'
    );
  }, [orders]);

  // Driver workload for a specific date
  const getDriverWorkload = useCallback((driverId: string, date: Date): number => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return orders.filter(o => 
      o.driver_id === driverId &&
      o.scheduled_date &&
      format(parseISO(o.scheduled_date), 'yyyy-MM-dd') === dateStr
    ).length;
  }, [orders]);

  // Find best available driver for a date
  const findBestDriver = useCallback((date: Date): Driver | null => {
    const availableDrivers = drivers.filter(d => d.is_available !== false);
    if (availableDrivers.length === 0) return null;

    // Sort by workload (ascending) - driver with least deliveries first
    const sorted = availableDrivers.sort((a, b) => {
      const workloadA = getDriverWorkload(a.id, date);
      const workloadB = getDriverWorkload(b.id, date);
      return workloadA - workloadB;
    });

    return sorted[0];
  }, [drivers, getDriverWorkload]);

  // Handle schedule delivery
  const handleScheduleDelivery = async () => {
    if (!selectedOrderForSchedule || !scheduleForm.date) return;
    
    setIsScheduling(true);
    try {
      await onScheduleDelivery(selectedOrderForSchedule.id, {
        scheduled_date: scheduleForm.date,
        scheduled_time: scheduleForm.time || undefined,
        driver_id: scheduleForm.driver_id || undefined
      });
      setShowScheduleModal(false);
      setSelectedOrderForSchedule(null);
      setScheduleForm({ date: '', time: '', driver_id: '', notes: '' });
    } catch (error) {
      console.error('Error scheduling delivery:', error);
    }
    setIsScheduling(false);
  };

  // Handle auto-assign driver
  const handleAutoAssign = async (order: Order) => {
    if (!order.scheduled_date) return;
    
    setAutoAssigning(order.id);
    try {
      const driver = await onAutoAssignDriver(order.id, order.scheduled_date);
      if (!driver) {
        alert('Aucun livreur disponible pour cette date');
      }
    } catch (error) {
      console.error('Error auto-assigning driver:', error);
    }
    setAutoAssigning(null);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En attente': return 'bg-amber-500';
      case 'Confirmé': return 'bg-blue-500';
      case 'En livraison': return 'bg-purple-500';
      case 'Livré': return 'bg-emerald-500';
      case 'Annulé': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  // Render calendar cell
  const renderCalendarCell = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayOrders = ordersByDate[dateStr] || [];
    const isCurrentMonth = isSameMonth(day, currentMonth);
    const isSelected = selectedDate && isSameDay(day, selectedDate);
    const isTodayDate = isToday(day);

    return (
      <div
        key={dateStr}
        onClick={() => setSelectedDate(day)}
        className={`min-h-[100px] p-2 border border-slate-700/50 cursor-pointer transition-all hover:bg-slate-800/50 ${
          !isCurrentMonth ? 'bg-slate-900/30 opacity-50' : 'bg-slate-800/20'
        } ${isSelected ? 'ring-2 ring-[#00ADEF]' : ''} ${
          isTodayDate ? 'bg-[#00ADEF]/10' : ''
        }`}
      >
        <div className={`text-sm font-bold mb-1 ${
          isTodayDate ? 'text-[#00ADEF]' : isCurrentMonth ? 'text-white' : 'text-slate-600'
        }`}>
          {format(day, 'd')}
        </div>
        
        {/* Order indicators */}
        <div className="space-y-1">
          {dayOrders.slice(0, 3).map(order => (
            <div
              key={order.id}
              className={`text-[10px] px-1.5 py-0.5 rounded truncate ${getStatusColor(order.status)} text-white`}
              title={`${order.full_name} - ${order.total?.toLocaleString()} F`}
            >
              {order.full_name?.split(' ')[0] || 'Client'}
            </div>
          ))}
          {dayOrders.length > 3 && (
            <div className="text-[10px] text-slate-400 font-bold">
              +{dayOrders.length - 3} autres
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <Calendar className="text-[#00ADEF]" />
            Calendrier des Livraisons
          </h2>
          <p className="text-slate-400 text-sm">
            Planification et suivi des livraisons • {todayDeliveries.length} livraison(s) aujourd&apos;hui
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                viewMode === 'month' ? 'bg-[#00ADEF] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Mois
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                viewMode === 'week' ? 'bg-[#00ADEF] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Semaine
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 p-5 rounded-2xl border border-amber-500/20">
          <div className="flex items-center gap-3 mb-2">
            <Clock size={20} className="text-amber-400" />
            <span className="text-xs text-slate-400 font-bold uppercase">À Planifier</span>
          </div>
          <div className="text-2xl font-black text-white">{pendingOrders.length}</div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/10 p-5 rounded-2xl border border-blue-500/20">
          <div className="flex items-center gap-3 mb-2">
            <Calendar size={20} className="text-blue-400" />
            <span className="text-xs text-slate-400 font-bold uppercase">Aujourd&apos;hui</span>
          </div>
          <div className="text-2xl font-black text-white">{todayDeliveries.length}</div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/10 p-5 rounded-2xl border border-emerald-500/20">
          <div className="flex items-center gap-3 mb-2">
            <Truck size={20} className="text-emerald-400" />
            <span className="text-xs text-slate-400 font-bold uppercase">Livreurs Actifs</span>
          </div>
          <div className="text-2xl font-black text-white">
            {drivers.filter(d => d.is_available !== false).length}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/10 p-5 rounded-2xl border border-purple-500/20">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle size={20} className="text-purple-400" />
            <span className="text-xs text-slate-400 font-bold uppercase">Ce Mois</span>
          </div>
          <div className="text-2xl font-black text-white">
            {orders.filter(o => 
              isSameMonth(parseISO(o.created_at), currentMonth) && o.status === 'Livré'
            ).length}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3 bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
            <button
              onClick={() => setCurrentMonth(prev => addMonths(prev, -1))}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <ChevronDown className="rotate-90" size={20} />
            </button>
            <h3 className="text-lg font-black text-white">
              {format(currentMonth, 'MMMM yyyy', { locale: fr })}
            </h3>
            <button
              onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <ChevronDown className="-rotate-90" size={20} />
            </button>
          </div>

          {/* Week Days Header */}
          <div className="grid grid-cols-7 border-b border-slate-700/50">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
              <div key={day} className="p-2 text-center text-xs font-bold text-slate-400 uppercase">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map(day => renderCalendarCell(day))}
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Selected Date Details */}
          {selectedDate && (
            <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-4">
              <h4 className="font-black text-white mb-3 flex items-center gap-2">
                <Calendar size={16} className="text-[#00ADEF]" />
                {format(selectedDate, 'EEEE d MMMM', { locale: fr })}
              </h4>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {(ordersByDate[format(selectedDate, 'yyyy-MM-dd')] || []).map(order => (
                  <div
                    key={order.id}
                    className="bg-slate-700/30 rounded-xl p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{order.full_name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${getStatusColor(order.status)} text-white`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      {order.neighborhood} • {order.total?.toLocaleString()} F
                    </div>
                    {order.driver_id ? (
                      <div className="text-xs text-emerald-400 flex items-center gap-1">
                        <Truck size={12} />
                        {drivers.find(d => d.id === order.driver_id)?.name || 'Livreur assigné'}
                      </div>
                    ) : order.status !== 'Livré' && order.status !== 'Annulé' && (
                      <button
                        onClick={() => handleAutoAssign(order)}
                        disabled={autoAssigning === order.id}
                        className="text-xs text-[#00ADEF] hover:underline flex items-center gap-1"
                      >
                        {autoAssigning === order.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Zap size={12} />
                        )}
                        Auto-assigner livreur
                      </button>
                    )}
                  </div>
                ))}
                
                {(!ordersByDate[format(selectedDate, 'yyyy-MM-dd')] || ordersByDate[format(selectedDate, 'yyyy-MM-dd')].length === 0) && (
                  <p className="text-sm text-slate-500 text-center py-4">
                    Aucune commande ce jour
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Pending Orders to Schedule */}
          <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-4">
            <h4 className="font-black text-white mb-3 flex items-center gap-2">
              <Clock size={16} className="text-amber-400" />
              Commandes à planifier ({pendingOrders.length})
            </h4>
            
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {pendingOrders.slice(0, 5).map(order => (
                <div
                  key={order.id}
                  className="bg-slate-700/30 rounded-xl p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-white text-sm">{order.full_name}</p>
                    <p className="text-xs text-slate-400">{order.neighborhood}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedOrderForSchedule(order);
                      setScheduleForm({
                        ...scheduleForm,
                        date: format(new Date(), 'yyyy-MM-dd')
                      });
                      setShowScheduleModal(true);
                    }}
                    className="px-3 py-1.5 bg-[#00ADEF] hover:bg-[#0090c5] text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    Planifier
                  </button>
                </div>
              ))}
              
              {pendingOrders.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">
                  Toutes les commandes sont planifiées ✨
                </p>
              )}
              
              {pendingOrders.length > 5 && (
                <p className="text-xs text-slate-400 text-center pt-2">
                  +{pendingOrders.length - 5} autres commandes
                </p>
              )}
            </div>
          </div>

          {/* Driver Availability */}
          <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-4">
            <h4 className="font-black text-white mb-3 flex items-center gap-2">
              <Truck size={16} className="text-emerald-400" />
              Disponibilité Livreurs
            </h4>
            
            <div className="space-y-2">
              {drivers.map(driver => {
                const todayWorkload = getDriverWorkload(driver.id, new Date());
                return (
                  <div
                    key={driver.id}
                    className="bg-slate-700/30 rounded-xl p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        driver.is_available !== false ? 'bg-emerald-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <p className="font-bold text-white text-sm">{driver.name}</p>
                        <p className="text-xs text-slate-400">{driver.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-white">{todayWorkload}</p>
                      <p className="text-[10px] text-slate-400">livraisons</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && selectedOrderForSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-white">Planifier la Livraison</h3>
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setSelectedOrderForSchedule(null);
                }}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Order Info */}
            <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
              <p className="font-bold text-white">{selectedOrderForSchedule.full_name}</p>
              <p className="text-sm text-slate-400">{selectedOrderForSchedule.address}</p>
              <p className="text-sm text-slate-400">{selectedOrderForSchedule.neighborhood}</p>
              <p className="text-sm font-bold text-[#00ADEF] mt-2">
                {selectedOrderForSchedule.total?.toLocaleString()} FCFA
              </p>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">
                  Date de livraison *
                </label>
                <input
                  type="date"
                  value={scheduleForm.date}
                  onChange={e => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#00ADEF] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">
                  Heure préférée
                </label>
                <select
                  value={scheduleForm.time}
                  onChange={e => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#00ADEF] focus:border-transparent"
                >
                  <option value="">Sélectionner une plage</option>
                  <option value="08:00-10:00">08h - 10h</option>
                  <option value="10:00-12:00">10h - 12h</option>
                  <option value="12:00-14:00">12h - 14h</option>
                  <option value="14:00-16:00">14h - 16h</option>
                  <option value="16:00-18:00">16h - 18h</option>
                  <option value="18:00-20:00">18h - 20h</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">
                  Livreur
                </label>
                <div className="flex gap-2">
                  <select
                    value={scheduleForm.driver_id}
                    onChange={e => setScheduleForm({ ...scheduleForm, driver_id: e.target.value })}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#00ADEF] focus:border-transparent"
                  >
                    <option value="">Auto-assigner</option>
                    {drivers.filter(d => d.is_available !== false).map(driver => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name} ({getDriverWorkload(driver.id, scheduleForm.date ? parseISO(scheduleForm.date) : new Date())} livr.)
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      if (scheduleForm.date) {
                        const best = findBestDriver(parseISO(scheduleForm.date));
                        if (best) {
                          setScheduleForm({ ...scheduleForm, driver_id: best.id });
                        }
                      }
                    }}
                    className="px-4 py-3 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-colors"
                    title="Suggérer le meilleur livreur"
                  >
                    <Zap size={20} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">
                  Notes
                </label>
                <textarea
                  value={scheduleForm.notes}
                  onChange={e => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                  rows={2}
                  placeholder="Instructions spéciales..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#00ADEF] focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setSelectedOrderForSchedule(null);
                }}
                className="flex-1 px-4 py-3 bg-slate-800 text-slate-400 rounded-xl font-bold hover:bg-slate-700 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleScheduleDelivery}
                disabled={!scheduleForm.date || isScheduling}
                className="flex-1 px-4 py-3 bg-[#00ADEF] hover:bg-[#0090c5] text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isScheduling ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Calendar size={18} />
                )}
                Planifier
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ========================================
// NOTIFICATION CENTER COMPONENT
// ========================================
const NOTIFICATION_TYPE_CONFIG: Record<NotificationType, { icon: React.ReactNode; bg: string; text: string; label: string }> = {
  'new_order': { icon: <ShoppingBag size={16} />, bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Nouvelle commande' },
  'order_status': { icon: <Truck size={16} />, bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Statut commande' },
  'low_stock': { icon: <AlertTriangle size={16} />, bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Stock bas' },
  'out_of_stock': { icon: <PackageX size={16} />, bg: 'bg-red-500/20', text: 'text-red-400', label: 'Rupture stock' },
  'stock_out': { icon: <PackageX size={16} />, bg: 'bg-red-500/20', text: 'text-red-400', label: 'Rupture totale' },
  'payment_received': { icon: <DollarSign size={16} />, bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Paiement reçu' },
  'payment_pending': { icon: <Clock size={16} />, bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Paiement en attente' },
  'driver_assigned': { icon: <Truck size={16} />, bg: 'bg-cyan-500/20', text: 'text-cyan-400', label: 'Livreur assigné' },
  'delivery_completed': { icon: <CheckCircle size={16} />, bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Livraison terminée' },
  'system': { icon: <Settings size={16} />, bg: 'bg-slate-500/20', text: 'text-slate-400', label: 'Système' },
  'promo': { icon: <Tag size={16} />, bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Promotion' },
};

interface NotificationCenterProps {
  notifications: AdminNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDismiss: (id: string) => void;
  onClearAll: () => void;
  onAction: (notification: AdminNotification) => void;
  config: NotificationConfig;
  onUpdateConfig: (config: Partial<NotificationConfig>) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  onClearAll,
  onAction,
  config,
  onUpdateConfig
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | NotificationType>('all');
  
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (!n.dismissed) {
        if (filter === 'all') return true;
        if (filter === 'unread') return !n.read;
        return n.type === filter;
      }
      return false;
    });
  }, [notifications, filter]);
  
  const unreadCount = notifications.filter(n => !n.read && !n.dismissed).length;
  
  const groupedNotifications = useMemo(() => {
    const today: AdminNotification[] = [];
    const yesterday: AdminNotification[] = [];
    const older: AdminNotification[] = [];
    
    const now = new Date();
    const todayStart = startOfDay(now);
    const yesterdayStart = startOfDay(subDays(now, 1));
    
    filteredNotifications.forEach(n => {
      const date = new Date(n.created_at);
      if (date >= todayStart) {
        today.push(n);
      } else if (date >= yesterdayStart) {
        yesterday.push(n);
      } else {
        older.push(n);
      }
    });
    
    return { today, yesterday, older };
  }, [filteredNotifications]);
  
  // Request browser notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        onUpdateConfig({ enable_push: true });
        new Notification('🔔 Notifications activées', {
          body: 'Vous recevrez maintenant les notifications Pro-Glaçons',
          icon: '/icon-192.png'
        });
      }
    }
  };
  
  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-black text-white">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <Settings size={16} />
          </button>
          {unreadCount > 0 && (
            <button 
              onClick={onMarkAllAsRead}
              className="text-[10px] font-bold text-[#00ADEF] hover:underline"
            >
              Tout marquer lu
            </button>
          )}
        </div>
      </div>
      
      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 bg-slate-800/50 border-b border-slate-700 space-y-4">
          <h4 className="text-sm font-bold text-white mb-3">⚙️ Paramètres de notification</h4>
          
          {/* Push Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-slate-400" />
              <span className="text-sm text-slate-300">Notifications push</span>
            </div>
            <button
              onClick={() => {
                if (!config.enable_push) {
                  requestNotificationPermission();
                } else {
                  onUpdateConfig({ enable_push: false });
                }
              }}
              className={`relative w-12 h-6 rounded-full transition-colors ${config.enable_push ? 'bg-cyan-500' : 'bg-slate-600'}`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${config.enable_push ? 'translate-x-6' : ''}`} />
            </button>
          </div>
          
          {/* Sound */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 size={16} className="text-slate-400" />
              <span className="text-sm text-slate-300">Son de notification</span>
            </div>
            <button
              onClick={() => onUpdateConfig({ enable_sound: !config.enable_sound })}
              className={`relative w-12 h-6 rounded-full transition-colors ${config.enable_sound ? 'bg-cyan-500' : 'bg-slate-600'}`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${config.enable_sound ? 'translate-x-6' : ''}`} />
            </button>
          </div>
          
          {/* Quiet Hours */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon size={16} className="text-slate-400" />
              <span className="text-sm text-slate-300">Mode silencieux</span>
            </div>
            <button
              onClick={() => onUpdateConfig({ quiet_hours_enabled: !config.quiet_hours_enabled })}
              className={`relative w-12 h-6 rounded-full transition-colors ${config.quiet_hours_enabled ? 'bg-cyan-500' : 'bg-slate-600'}`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${config.quiet_hours_enabled ? 'translate-x-6' : ''}`} />
            </button>
          </div>
          
          {config.quiet_hours_enabled && (
            <div className="flex items-center gap-2 pl-6">
              <input
                type="time"
                value={config.quiet_hours_start}
                onChange={(e) => onUpdateConfig({ quiet_hours_start: e.target.value })}
                className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white"
              />
              <span className="text-slate-400">→</span>
              <input
                type="time"
                value={config.quiet_hours_end}
                onChange={(e) => onUpdateConfig({ quiet_hours_end: e.target.value })}
                className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white"
              />
            </div>
          )}
          
          <div className="pt-3 border-t border-slate-700">
            <p className="text-xs text-slate-500 mb-2">Notifications activées pour :</p>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'notify_new_orders', label: '🛒 Commandes' },
                { key: 'notify_low_stock', label: '📦 Stock' },
                { key: 'notify_payments', label: '💰 Paiements' },
                { key: 'notify_deliveries', label: '🚚 Livraisons' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => onUpdateConfig({ [key]: !config[key as keyof NotificationConfig] })}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                    config[key as keyof NotificationConfig] 
                      ? 'bg-cyan-500/20 text-cyan-400' 
                      : 'bg-slate-700 text-slate-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Filter */}
      <div className="p-3 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
        {[
          { value: 'all', label: 'Tout' },
          { value: 'unread', label: 'Non lu' },
          { value: 'new_order', label: '🛒' },
          { value: 'low_stock', label: '📦' },
          { value: 'payment_received', label: '💰' },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value as typeof filter)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              filter === value 
                ? 'bg-cyan-500/20 text-cyan-400' 
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      
      {/* Notifications List */}
      <div className="max-h-[400px] overflow-y-auto">
        {filteredNotifications.length > 0 ? (
          <>
            {/* Today */}
            {groupedNotifications.today.length > 0 && (
              <>
                <div className="px-4 py-2 bg-slate-800/30">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Aujourd&apos;hui</span>
                </div>
                {groupedNotifications.today.map(notif => (
                  <NotificationItem
                    key={notif.id}
                    notification={notif}
                    onMarkAsRead={onMarkAsRead}
                    onDismiss={onDismiss}
                    onAction={onAction}
                  />
                ))}
              </>
            )}
            
            {/* Yesterday */}
            {groupedNotifications.yesterday.length > 0 && (
              <>
                <div className="px-4 py-2 bg-slate-800/30">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Hier</span>
                </div>
                {groupedNotifications.yesterday.map(notif => (
                  <NotificationItem
                    key={notif.id}
                    notification={notif}
                    onMarkAsRead={onMarkAsRead}
                    onDismiss={onDismiss}
                    onAction={onAction}
                  />
                ))}
              </>
            )}
            
            {/* Older */}
            {groupedNotifications.older.length > 0 && (
              <>
                <div className="px-4 py-2 bg-slate-800/30">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Plus ancien</span>
                </div>
                {groupedNotifications.older.map(notif => (
                  <NotificationItem
                    key={notif.id}
                    notification={notif}
                    onMarkAsRead={onMarkAsRead}
                    onDismiss={onDismiss}
                    onAction={onAction}
                  />
                ))}
              </>
            )}
          </>
        ) : (
          <div className="p-8 text-center text-slate-500">
            <Bell size={32} className="mx-auto mb-3 opacity-30" />
            <p className="font-bold">Aucune notification</p>
            <p className="text-xs">Les nouvelles alertes apparaîtront ici</p>
          </div>
        )}
      </div>
      
      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[10px] text-slate-500">
            {notifications.length} notification(s)
          </span>
          <button 
            onClick={onClearAll}
            className="text-xs font-bold text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1"
          >
            <Archive size={12} />
            Archiver tout
          </button>
        </div>
      )}
    </div>
  );
};

// Individual Notification Item
const NotificationItem: React.FC<{
  notification: AdminNotification;
  onMarkAsRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onAction: (notification: AdminNotification) => void;
}> = ({ notification, onMarkAsRead, onDismiss, onAction }) => {
  const config = NOTIFICATION_TYPE_CONFIG[notification.type] || NOTIFICATION_TYPE_CONFIG['system'];
  
  return (
    <div 
      className={`p-4 border-b border-slate-800/50 hover:bg-slate-800/50 cursor-pointer transition-all group ${
        !notification.read ? 'bg-[#00ADEF]/5' : ''
      }`}
      onClick={() => {
        onMarkAsRead(notification.id);
        onAction(notification);
      }}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg} ${config.text}`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">{notification.title}</span>
            {!notification.read && (
              <span className="w-2 h-2 bg-[#00ADEF] rounded-full flex-shrink-0"></span>
            )}
            {notification.priority === 'urgent' && (
              <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[8px] font-bold rounded uppercase">Urgent</span>
            )}
          </div>
          <p className="text-sm text-slate-400 line-clamp-2">{notification.message}</p>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-[10px] text-slate-600">
              {format(new Date(notification.created_at), 'HH:mm', { locale: fr })}
            </p>
            {notification.action_label && (
              <span className="text-[10px] text-cyan-400 font-bold flex items-center gap-1">
                {notification.action_label} <ExternalLink size={10} />
              </span>
            )}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(notification.id);
          }}
          className="p-1 text-slate-600 hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-all"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

const CONFIRMATION_LABELS: Record<string, { label: string; color: string }> = {
  'client': { label: 'Confirmé par le client', color: 'text-emerald-400' },
  'driver': { label: 'Confirmé par le livreur', color: 'text-amber-400' },
  'admin': { label: 'Confirmé par l\'admin', color: 'text-blue-400' },
};

const DRIVER_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  'Disponible': { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  'En livraison': { bg: 'bg-amber-500/20', text: 'text-amber-400' },
  'Indisponible': { bg: 'bg-red-500/20', text: 'text-red-400' },
};

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b'];

// ========================================
// MAIN COMPONENT
// ========================================
export default function AdminDashboard() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Dashboard state
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [stockLogFilter, setStockLogFilter] = useState<string>('all');
  
  // Filter states
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [driverStatusFilter, setDriverStatusFilter] = useState<string>('all');
  
  // Driver editing
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  // Product form state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [productFormData, setProductFormData] = useState<ProductFormData>({
    name: '', description: '', price: 0, unit: 'Sac', 
    category: CATEGORIES[0], imageUrl: '', inStock: true, tag: '', stock_quantity: 0
  });

  // Driver form state
  const [isAddingDriver, setIsAddingDriver] = useState(false);
  const [isSavingDriver, setIsSavingDriver] = useState(false);
  const [newDriver, setNewDriver] = useState({ name: '', phone: '' });

  // Admin profile state
  const [adminProfileForm, setAdminProfileForm] = useState({ full_name: '', phone: '' });
  const [adminPasswordForm, setAdminPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [isEditingAdminProfile, setIsEditingAdminProfile] = useState(false);
  const [isChangingAdminPassword, setIsChangingAdminPassword] = useState(false);
  const [isSavingAdminProfile, setIsSavingAdminProfile] = useState(false);
  const [adminProfileMessage, setAdminProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAdminPasswords, setShowAdminPasswords] = useState({ new: false, confirm: false });

  // Analytics state
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<TimeFrame>('month');

  // Reports state
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('month');
  const [customStartDate, setCustomStartDate] = useState<string>(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [isExporting, setIsExporting] = useState(false);

  // Stock alert state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hasPlayedAlert, setHasPlayedAlert] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Notifications state
  const [notifications, setNotifications] = useState<AdminNotification[]>(() => {
    // Charger depuis localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin_notifications');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [];
        }
      }
    }
    return [];
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Notification config state
  const [notificationConfig, setNotificationConfig] = useState<NotificationConfig>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notification_config');
      if (saved) {
        try {
          return { ...DEFAULT_NOTIFICATION_CONFIG, ...JSON.parse(saved) };
        } catch {
          return DEFAULT_NOTIFICATION_CONFIG;
        }
      }
    }
    return DEFAULT_NOTIFICATION_CONFIG;
  });
  
  // Save notifications to localStorage when they change
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('admin_notifications', JSON.stringify(notifications.slice(0, 100)));
    }
  }, [notifications]);
  
  // Save config to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('notification_config', JSON.stringify(notificationConfig));
  }, [notificationConfig]);
  
  // Helper function to create and show notification
  const createNotification = useCallback((
    type: NotificationType,
    title: string,
    message: string,
    options?: {
      priority?: AdminNotification['priority'];
      metadata?: AdminNotification['metadata'];
      action_url?: string;
      action_label?: string;
    }
  ) => {
    // Check if we're in quiet hours
    if (notificationConfig.quiet_hours_enabled) {
      const now = new Date();
      const currentTime = format(now, 'HH:mm');
      const { quiet_hours_start, quiet_hours_end } = notificationConfig;
      
      // Simple check (doesn't handle overnight properly but works for most cases)
      if (currentTime >= quiet_hours_start || currentTime <= quiet_hours_end) {
        // In quiet hours, still save but don't notify
      }
    }
    
    const newNotif: AdminNotification = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      priority: options?.priority || 'medium',
      read: false,
      dismissed: false,
      metadata: options?.metadata,
      action_url: options?.action_url,
      action_label: options?.action_label,
      created_at: new Date().toISOString(),
    };
    
    setNotifications(prev => [newNotif, ...prev.slice(0, 99)]);
    
    // Play sound if enabled
    if (notificationConfig.enable_sound && notificationAudioRef.current) {
      notificationAudioRef.current.play().catch(() => {});
    }
    
    // Show browser notification if enabled
    if (notificationConfig.enable_push && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/icon-192.png',
        tag: newNotif.id,
      });
    }
    
    return newNotif;
  }, [notificationConfig]);
  
  // Notification handlers
  const handleMarkAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n
    ));
  }, []);
  
  const handleMarkAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() })));
  }, []);
  
  const handleDismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, dismissed: true } : n));
  }, []);
  
  const handleClearAllNotifications = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, dismissed: true })));
  }, []);
  
  const handleNotificationAction = useCallback((notification: AdminNotification) => {
    if (notification.metadata?.order_id) {
      const order = orders.find(o => o.id === notification.metadata?.order_id);
      if (order) setSelectedOrder(order);
    }
    if (notification.metadata?.product_id) {
      setActiveTab('products');
    }
    setShowNotifications(false);
  }, [orders]);
  
  const handleUpdateNotificationConfig = useCallback((updates: Partial<NotificationConfig>) => {
    setNotificationConfig(prev => ({ ...prev, ...updates, updated_at: new Date().toISOString() }));
  }, []);

  // ========================================
  // AUTH CHECK
  // ========================================
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profile?.role === 'admin') {
          // Ensure we display the email used to login (from session)
          if (session.user.email && !profile.email) {
            profile.email = session.user.email;
          }
          setCurrentProfile(profile);
          setIsAuthenticated(true);
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  // ========================================
  // DATA FETCHING WITH NOTIFICATIONS
  // ========================================
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchData = async () => {
      const [ordersRes, productsRes, profilesRes, driversRes, stockLogsRes] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('drivers').select('*').order('created_at', { ascending: false }),
        supabase.from('stock_logs').select('*').order('created_at', { ascending: false }).limit(100),
      ]);
      
      if (ordersRes.data) setOrders(ordersRes.data);
      if (productsRes.data) setProducts(productsRes.data);
      if (profilesRes.data) setProfiles(profilesRes.data);
      if (driversRes.data) setDrivers(driversRes.data);
      if (stockLogsRes.data) setStockLogs(stockLogsRes.data);
    };

    fetchData();

    // Track order IDs we've already seen to detect new ones
    let knownOrderIds = new Set<string>();
    
    // Initial population of known orders
    supabase.from('orders').select('id').then(({ data }) => {
      if (data) {
        knownOrderIds = new Set(data.map(o => o.id));
      }
    });

    // Polling as backup for realtime (every 10 seconds)
    const pollInterval = setInterval(async () => {
      const { data: latestOrders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (latestOrders) {
        for (const order of latestOrders) {
          if (!knownOrderIds.has(order.id)) {
            // New order detected!
            knownOrderIds.add(order.id);
            
            if (notificationConfig.notify_new_orders) {
              createNotification(
                'new_order',
                '🆕 Nouvelle Commande!',
                `${order.full_name || 'Client'} - ${order.total?.toLocaleString()} FCFA`,
                {
                  priority: 'high',
                  metadata: { order_id: order.id, amount: order.total },
                  action_label: 'Voir détails'
                }
              );
            }
            
            // Update the orders list
            setOrders(latestOrders);
          }
        }
      }
    }, 8000);

    // Realtime subscription with notification handling (primary method)
    const channel = supabase
      .channel('admin-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        // New order notification
        const newOrder = payload.new as Order;
        
        // Avoid duplicate if polling already caught it
        if (knownOrderIds.has(newOrder.id)) return;
        knownOrderIds.add(newOrder.id);
        
        if (notificationConfig.notify_new_orders) {
          createNotification(
            'new_order',
            '🆕 Nouvelle Commande!',
            `${newOrder.full_name || 'Client'} - ${newOrder.total?.toLocaleString()} F`,
            {
              priority: 'high',
              metadata: { order_id: newOrder.id, amount: newOrder.total },
              action_label: 'Voir détails'
            }
          );
        }
        
        fetchData();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, async (payload) => {
        const updatedOrder = payload.new as Order;
        const oldOrder = payload.old as Partial<Order>;
        
        // Détecter si une commande vient de passer en "Livré" (confirmée par livreur ou client)
        if (updatedOrder.status === 'Livré' && oldOrder.status !== 'Livré') {
          // Note: La réduction du stock est gérée par le driver ou le client qui confirme
          // Ici on rafraîchit juste les données et on envoie la notification
          
          // Notification pour admin
          const confirmedBy = updatedOrder.confirmed_by === 'client' ? 'par le client' : 
                             updatedOrder.confirmed_by === 'driver' ? 'par le livreur' : '';
          if (confirmedBy && notificationConfig.notify_deliveries) {
            createNotification(
              'delivery_completed',
              '✅ Commande Livrée!',
              `${updatedOrder.full_name || 'Client'} - Confirmé ${confirmedBy}`,
              {
                priority: 'medium',
                metadata: { order_id: updatedOrder.id },
                action_label: 'Voir commande'
              }
            );
          }
        }
        
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        // Détecter si le stock est bas après une mise à jour
        if (payload.eventType === 'UPDATE' && notificationConfig.notify_stock_alerts) {
          const updatedProduct = payload.new as { id: string; name: string; stock_quantity: number };
          const oldProduct = payload.old as { stock_quantity?: number };
          
          // Notification si le stock passe sous le seuil de 10
          if (updatedProduct.stock_quantity <= 10 && (oldProduct.stock_quantity === undefined || oldProduct.stock_quantity > 10)) {
            createNotification(
              'low_stock',
              '⚠️ Stock Bas!',
              `${updatedProduct.name} - ${updatedProduct.stock_quantity} unité(s) restante(s)`,
              {
                priority: updatedProduct.stock_quantity <= 5 ? 'high' : 'medium',
                metadata: { product_id: updatedProduct.id, stock: updatedProduct.stock_quantity },
                action_label: 'Gérer stock'
              }
            );
          }
          
          // Notification critique si stock à 0
          if (updatedProduct.stock_quantity === 0 && (oldProduct.stock_quantity === undefined || oldProduct.stock_quantity > 0)) {
            createNotification(
              'stock_out',
              '🚨 Rupture de Stock!',
              `${updatedProduct.name} - Plus aucune unité disponible`,
              {
                priority: 'high',
                metadata: { product_id: updatedProduct.id },
                action_label: 'Commander stock'
              }
            );
          }
        }
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_logs' }, async () => {
        // Rafraîchir les stock_logs quand il y a des changements
        const { data } = await supabase.from('stock_logs').select('*').order('created_at', { ascending: false }).limit(100);
        if (data) setStockLogs(data);
      })
      .subscribe();

    return () => { 
      clearInterval(pollInterval);
      supabase.removeChannel(channel); 
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, soundEnabled, notificationConfig.notify_new_orders, notificationConfig.notify_deliveries, notificationConfig.notify_stock_alerts]);

  // ========================================
  // LOW STOCK ALERT
  // ========================================
  const lowStockProducts = useMemo(() => 
    products.filter(p => (p.stock_quantity ?? 0) <= 10), 
    [products]
  );

  useEffect(() => {
    if (lowStockProducts.length > 0 && soundEnabled && !hasPlayedAlert && isAuthenticated) {
      if (!audioRef.current) {
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      }
      audioRef.current.play().catch(() => {});
      setHasPlayedAlert(true);
    }
  }, [lowStockProducts, soundEnabled, hasPlayedAlert, isAuthenticated]);

  // ========================================
  // ANALYTICS DATA - Enhanced for Professional Accounting
  // ========================================
  const analyticsData = useMemo(() => {
    const now = new Date();
    let filteredOrders = orders;
    let previousPeriodOrders: Order[] = [];

    if (analyticsTimeframe === 'day') {
      filteredOrders = orders.filter(o => 
        new Date(o.created_at).toDateString() === now.toDateString()
      );
      // Previous day
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      previousPeriodOrders = orders.filter(o => 
        new Date(o.created_at).toDateString() === yesterday.toDateString()
      );
    } else if (analyticsTimeframe === 'month') {
      filteredOrders = orders.filter(o => {
        const d = new Date(o.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      // Previous month
      const lastMonth = new Date(now);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      previousPeriodOrders = orders.filter(o => {
        const d = new Date(o.created_at);
        return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
      });
    } else {
      filteredOrders = orders.filter(o => 
        new Date(o.created_at).getFullYear() === now.getFullYear()
      );
      // Previous year
      previousPeriodOrders = orders.filter(o => 
        new Date(o.created_at).getFullYear() === now.getFullYear() - 1
      );
    }

    const statusCounts = filteredOrders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
    
    // Revenue calculations
    const totalRevenue = filteredOrders.filter(o => o.status === 'Livré').reduce((sum, o) => sum + o.total, 0);
    const previousRevenue = previousPeriodOrders.filter(o => o.status === 'Livré').reduce((sum, o) => sum + o.total, 0);
    const revenueGrowth = previousRevenue > 0 ? Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100) : 0;
    
    // Pending revenue
    const pendingRevenue = filteredOrders.filter(o => o.status !== 'Livré').reduce((sum, o) => sum + o.total, 0);
    
    // Average order value
    const avgOrderValue = filteredOrders.length > 0 
      ? Math.round(filteredOrders.reduce((sum, o) => sum + o.total, 0) / filteredOrders.length) 
      : 0;
    const previousAvgOrder = previousPeriodOrders.length > 0 
      ? Math.round(previousPeriodOrders.reduce((sum, o) => sum + o.total, 0) / previousPeriodOrders.length) 
      : 0;
    const avgOrderGrowth = previousAvgOrder > 0 ? Math.round(((avgOrderValue - previousAvgOrder) / previousAvgOrder) * 100) : 0;

    // Orders growth
    const ordersGrowth = previousPeriodOrders.length > 0 
      ? Math.round(((filteredOrders.length - previousPeriodOrders.length) / previousPeriodOrders.length) * 100) 
      : 0;

    // Product sales with detailed info
    const productSalesDetailed: Record<string, { quantity: number; revenue: number; orders: number }> = {};
    filteredOrders.forEach(order => {
      order.items.forEach((item: CartItem) => {
        if (!productSalesDetailed[item.name]) {
          productSalesDetailed[item.name] = { quantity: 0, revenue: 0, orders: 0 };
        }
        productSalesDetailed[item.name].quantity += item.quantity;
        productSalesDetailed[item.name].revenue += item.price * item.quantity;
        productSalesDetailed[item.name].orders += 1;
      });
    });

    const barData = Object.entries(productSalesDetailed)
      .map(([name, data]) => ({ name: name.substring(0, 15), quantity: data.quantity, revenue: data.revenue }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8);

    // Full product analytics
    const productAnalytics = Object.entries(productSalesDetailed)
      .map(([name, data]) => {
        const product = products.find(p => p.name === name);
        return {
          name,
          ...data,
          stock: product?.stock_quantity ?? 0,
          price: product?.price ?? 0,
          category: product?.category ?? 'N/A',
          margin: data.revenue,
          inStock: product?.inStock ?? false,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    // Daily revenue for chart (last 7 days or 12 months)
    const revenueByPeriod: { period: string; revenue: number; orders: number }[] = [];
    if (analyticsTimeframe === 'day' || analyticsTimeframe === 'month') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayOrders = orders.filter(o => 
          new Date(o.created_at).toDateString() === date.toDateString() && o.status === 'Livré'
        );
        revenueByPeriod.push({
          period: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
          revenue: dayOrders.reduce((sum, o) => sum + o.total, 0),
          orders: dayOrders.length,
        });
      }
    } else {
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const monthOrders = orders.filter(o => {
          const d = new Date(o.created_at);
          return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear() && o.status === 'Livré';
        });
        revenueByPeriod.push({
          period: date.toLocaleDateString('fr-FR', { month: 'short' }),
          revenue: monthOrders.reduce((sum, o) => sum + o.total, 0),
          orders: monthOrders.length,
        });
      }
    }

    // Top customers
    const customerSpending: Record<string, { name: string; total: number; orders: number }> = {};
    filteredOrders.forEach(order => {
      if (!customerSpending[order.full_name]) {
        customerSpending[order.full_name] = { name: order.full_name, total: 0, orders: 0 };
      }
      customerSpending[order.full_name].total += order.total;
      customerSpending[order.full_name].orders += 1;
    });
    const topCustomers = Object.values(customerSpending)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Delivery performance
    const deliveredOrders = filteredOrders.filter(o => o.status === 'Livré');
    const deliveryRate = filteredOrders.length > 0 
      ? Math.round((deliveredOrders.length / filteredOrders.length) * 100) 
      : 0;

    // Revenue by neighborhood
    const revenueByNeighborhood: Record<string, number> = {};
    filteredOrders.filter(o => o.status === 'Livré').forEach(order => {
      revenueByNeighborhood[order.neighborhood] = (revenueByNeighborhood[order.neighborhood] || 0) + order.total;
    });
    const topNeighborhoods = Object.entries(revenueByNeighborhood)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return { 
      filteredOrders, 
      pieData, 
      totalRevenue, 
      previousRevenue,
      revenueGrowth,
      pendingRevenue,
      avgOrderValue, 
      avgOrderGrowth,
      ordersGrowth,
      barData, 
      productAnalytics,
      revenueByPeriod,
      topCustomers,
      deliveryRate,
      topNeighborhoods,
    };
  }, [orders, analyticsTimeframe, products]);

  // ========================================
  // HANDLERS
  // ========================================
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    try {
      if (authMode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profile?.role !== 'admin') {
          await supabase.auth.signOut();
          throw new Error('Accès refusé. Vous n\'êtes pas administrateur.');
        }

        setCurrentProfile(profile);
        setIsAuthenticated(true);
      } else {
        const { error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;

        // Note: New users are clients by default, an admin must promote them
        setAuthMode('login');
        setAuthError('Compte créé! Un admin doit vous promouvoir.');
      }
    } catch (err) {
      const error = err as Error;
      if (error.message?.includes('rate limit')) {
        setAuthError('Trop de tentatives. Attendez quelques minutes.');
      } else {
        setAuthError(error.message || 'Erreur de connexion');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setCurrentProfile(null);
  };

  // Admin profile functions
  const handleSaveAdminProfile = async () => {
    if (!currentProfile?.id) return;
    setIsSavingAdminProfile(true);
    setAdminProfileMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: adminProfileForm.full_name,
          phone: adminProfileForm.phone
        })
        .eq('id', currentProfile.id);

      if (error) throw error;

      setCurrentProfile({ ...currentProfile, full_name: adminProfileForm.full_name, phone: adminProfileForm.phone });
      setAdminProfileMessage({ type: 'success', text: '✅ Profil mis à jour!' });
      setIsEditingAdminProfile(false);
    } catch (err: any) {
      setAdminProfileMessage({ type: 'error', text: `❌ ${err.message}` });
    } finally {
      setIsSavingAdminProfile(false);
    }
  };

  const handleChangeAdminPassword = async () => {
    setIsSavingAdminProfile(true);
    setAdminProfileMessage(null);

    if (adminPasswordForm.newPassword.length < 6) {
      setAdminProfileMessage({ type: 'error', text: '❌ Minimum 6 caractères' });
      setIsSavingAdminProfile(false);
      return;
    }

    if (adminPasswordForm.newPassword !== adminPasswordForm.confirmPassword) {
      setAdminProfileMessage({ type: 'error', text: '❌ Les mots de passe ne correspondent pas' });
      setIsSavingAdminProfile(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: adminPasswordForm.newPassword
      });

      if (error) throw error;

      setAdminProfileMessage({ type: 'success', text: '✅ Mot de passe modifié!' });
      setIsChangingAdminPassword(false);
      setAdminPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setAdminProfileMessage({ type: 'error', text: `❌ ${err.message}` });
    } finally {
      setIsSavingAdminProfile(false);
    }
  };

  // Initialize admin profile form
  useEffect(() => {
    if (currentProfile) {
      setAdminProfileForm({
        full_name: currentProfile.full_name || '',
        phone: currentProfile.phone || ''
      });
    }
  }, [currentProfile]);

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status'], driverId?: string) => {
    setProcessingId(orderId);
    const updates: { 
      status: Order['status']; 
      driver_id?: string;
      delivered_at?: string;
      confirmed_at?: string;
      confirmed_by?: 'client' | 'driver' | 'admin';
      delivery_code?: string;
    } = { status: newStatus };
    
    if (driverId) updates.driver_id = driverId;
    
    // Quand le livreur est marqué comme arrivé, générer un code de confirmation
    if (newStatus === 'En attente de confirmation') {
      updates.delivery_code = Math.floor(1000 + Math.random() * 9000).toString();
      updates.delivered_at = new Date().toISOString();
    }
    
    // Quand l'admin confirme la livraison
    if (newStatus === 'Livré') {
      updates.confirmed_at = new Date().toISOString();
      updates.confirmed_by = 'admin';
    }
    
    await supabase.from('orders').update(updates).eq('id', orderId);
    
    // Note: Stock reduction et stock_logs sont gérés par le listener realtime
    // pour éviter les duplications et s'assurer que ça fonctionne peu importe
    // qui change le statut (admin, driver, ou client)
    
    setOrders(prev => prev.map(o => 
      o.id === orderId ? { ...o, status: newStatus, driver_id: driverId || o.driver_id } : o
    ));
    setProcessingId(null);
  };

  const handleToggleRole = async (profile: Profile) => {
    const newRole = profile.role === 'admin' ? 'client' : 'admin';
    await supabase.from('profiles').update({ role: newRole }).eq('id', profile.id);
    setProfiles(prev => prev.map(p => 
      p.id === profile.id ? { ...p, role: newRole } : p
    ));
  };

  const handleAddDriver = async () => {
    // Validation
    if (!newDriver.name.trim()) {
      alert('❌ Veuillez entrer le nom du livreur');
      return;
    }
    if (!newDriver.phone.trim()) {
      alert('❌ Veuillez entrer le numéro de téléphone');
      return;
    }
    
    // Vérifier format téléphone (au moins 8 chiffres)
    const phoneClean = newDriver.phone.replace(/\s/g, '');
    if (phoneClean.length < 8) {
      alert('❌ Le numéro de téléphone doit contenir au moins 8 chiffres');
      return;
    }

    setIsSavingDriver(true);

    try {
      // Vérifier si le téléphone existe déjà
      const { data: existing } = await supabase
        .from('drivers')
        .select('id')
        .eq('phone', phoneClean)
        .single();
      
      if (existing) {
        alert('❌ Un livreur avec ce numéro existe déjà');
        setIsSavingDriver(false);
        return;
      }

      const { data, error } = await supabase
        .from('drivers')
        .insert([{ 
          name: newDriver.name.trim(), 
          phone: phoneClean,
          status: 'Disponible',
          is_available: true
        }])
        .select();
      
      if (error) {
        console.error('Erreur ajout livreur:', error);
        alert(`❌ Erreur: ${error.message}`);
        setIsSavingDriver(false);
        return;
      }
      
      if (data?.[0]) {
        setDrivers(prev => [data[0] as Driver, ...prev]);
        setIsAddingDriver(false);
        setNewDriver({ name: '', phone: '' });
        alert('✅ Livreur ajouté avec succès!');
      }
    } catch (err) {
      console.error('Exception:', err);
      alert('❌ Une erreur est survenue. Vérifiez votre connexion.');
    } finally {
      setIsSavingDriver(false);
    }
  };

  const handleSaveProduct = async () => {
    const productData = {
      name: productFormData.name,
      description: productFormData.description,
      price: productFormData.price,
      unit: productFormData.unit,
      category: productFormData.category,
      imageUrl: productFormData.imageUrl,
      inStock: productFormData.inStock,
      tag: productFormData.tag || null,
      stock_quantity: productFormData.stock_quantity,
    };

    if (editingProduct) {
      const { data } = await supabase.from('products').update(productData).eq('id', editingProduct.id).select();
      if (data?.[0]) setProducts(prev => prev.map(p => p.id === editingProduct.id ? data[0] as Product : p));
    } else {
      const { data } = await supabase.from('products').insert([productData]).select();
      if (data?.[0]) setProducts(prev => [data[0] as Product, ...prev]);
    }
    setEditingProduct(null);
    setIsAddingProduct(false);
    resetProductForm();
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Supprimer ce produit?')) {
      await supabase.from('products').delete().eq('id', id);
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleToggleProductStock = async (product: Product) => {
    const { data } = await supabase.from('products').update({ inStock: !product.inStock }).eq('id', product.id).select();
    if (data?.[0]) setProducts(prev => prev.map(p => p.id === product.id ? data[0] as Product : p));
  };

  const resetProductForm = () => {
    setProductFormData({
      name: '', description: '', price: 0, unit: 'Sac',
      category: CATEGORIES[0], imageUrl: '', inStock: true, tag: '', stock_quantity: 0
    });
  };

  const openEditProduct = (product: Product) => {
    setProductFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      unit: product.unit,
      category: product.category,
      imageUrl: product.imageUrl,
      inStock: product.inStock,
      tag: product.tag || '',
      stock_quantity: product.stock_quantity ?? 0,
    });
    setEditingProduct(product);
  };

  const exportCSV = useCallback(() => {
    const headers = ['ID', 'Client', 'Total', 'Statut', 'Date'];
    const rows = analyticsData.filteredOrders.map(o => [
      o.id.substring(0, 8),
      o.full_name,
      o.total,
      o.status,
      new Date(o.created_at).toLocaleDateString(),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-${analyticsTimeframe}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }, [analyticsData.filteredOrders, analyticsTimeframe]);

  // Filtered orders for search and status
  const filteredOrders = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return orders.filter(o => {
      const matchesSearch = (o.full_name || '').toLowerCase().includes(query) ||
        (o.id || '').toLowerCase().includes(query) ||
        (o.neighborhood || '').toLowerCase().includes(query);
      const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, orderStatusFilter]);

  // Filtered products for search and category
  const filteredProducts = useMemo(() => {
    const query = productSearchQuery.toLowerCase();
    return products.filter(p => {
      const matchesSearch = (p.name || '').toLowerCase().includes(query) ||
        (p.description || '').toLowerCase().includes(query);
      const matchesCategory = productCategoryFilter === 'all' || p.category === productCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, productSearchQuery, productCategoryFilter]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    const query = userSearchQuery.toLowerCase();
    return profiles.filter(u => 
      (u.full_name || '').toLowerCase().includes(query) ||
      (u.phone || '').toLowerCase().includes(query) ||
      (u.id || '').toLowerCase().includes(query)
    );
  }, [profiles, userSearchQuery]);

  // Filtered drivers
  const filteredDrivers = useMemo(() => {
    return drivers.filter(d => 
      driverStatusFilter === 'all' || d.status === driverStatusFilter
    );
  }, [drivers, driverStatusFilter]);

  // Driver stats
  const driverStats = useMemo(() => {
    const available = drivers.filter(d => d.status === 'Disponible').length;
    const delivering = drivers.filter(d => d.status === 'En livraison').length;
    const totalDeliveries = orders.filter(o => o.status === 'Livré').length;
    return { available, delivering, totalDeliveries };
  }, [drivers, orders]);

  // Product stats
  const productStats = useMemo(() => {
    const totalStock = products.reduce((sum, p) => sum + (p.stock_quantity ?? 0), 0);
    const lowStock = products.filter(p => (p.stock_quantity ?? 0) <= 10).length;
    const activeProducts = products.filter(p => p.inStock).length;
    const categories = [...new Set(products.map(p => p.category))].length;
    return { totalStock, lowStock, activeProducts, categories };
  }, [products]);

  // User stats
  const userStats = useMemo(() => {
    const admins = profiles.filter(p => p.role === 'admin').length;
    const clients = profiles.filter(p => p.role === 'client').length;
    const thisMonth = profiles.filter(p => {
      const d = new Date(p.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    return { admins, clients, thisMonth };
  }, [profiles]);

  // Handler for driver actions
  const handleDeleteDriver = async (id: string) => {
    if (confirm('Supprimer ce livreur?')) {
      await supabase.from('drivers').delete().eq('id', id);
      setDrivers(prev => prev.filter(d => d.id !== id));
    }
  };

  const handleUpdateDriverStatus = async (driver: Driver, newStatus: string) => {
    const { data } = await supabase.from('drivers').update({ status: newStatus }).eq('id', driver.id).select();
    if (data?.[0]) setDrivers(prev => prev.map(d => d.id === driver.id ? data[0] as Driver : d));
  };

  const handleSaveDriver = async () => {
    if (editingDriver) {
      const { data } = await supabase.from('drivers')
        .update({ name: newDriver.name, phone: newDriver.phone })
        .eq('id', editingDriver.id)
        .select();
      if (data?.[0]) setDrivers(prev => prev.map(d => d.id === editingDriver.id ? data[0] as Driver : d));
      setEditingDriver(null);
    }
    setNewDriver({ name: '', phone: '' });
  };

  // Pending orders count
  const pendingCount = useMemo(() => 
    orders.filter(o => o.status === 'En attente').length,
    [orders]
  );

  // ========================================
  // LOADING STATE
  // ========================================
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#00ADEF] animate-spin" />
      </div>
    );
  }

  // ========================================
  // LOGIN FORM
  // ========================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-[#00ADEF]/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-[#00ADEF]/20">
              <ShieldCheck className="w-10 h-10 text-[#00ADEF]" />
            </div>
            <h1 className="text-3xl font-black text-white mb-2">Administration</h1>
            <p className="text-slate-500">Pro Glaçons - Panneau Admin</p>
          </div>

          <form onSubmit={handleAuth} className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-800">
            <div className="flex bg-slate-800 rounded-2xl p-1 mb-8">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                  authMode === 'login' ? 'bg-[#00ADEF] text-white' : 'text-slate-400'
                }`}
              >
                Connexion
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                  authMode === 'register' ? 'bg-[#00ADEF] text-white' : 'text-slate-400'
                }`}
              >
                Inscription
              </button>
            </div>

            {authError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl mb-6 text-sm font-medium">
                {authError}
              </div>
            )}

            <div className="space-y-4 mb-8">
              <input
                type="email"
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-white font-medium outline-none focus:ring-2 focus:ring-[#00ADEF] transition-all"
              />
              <input
                type="password"
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                placeholder="Mot de passe"
                required
                minLength={6}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-white font-medium outline-none focus:ring-2 focus:ring-[#00ADEF] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-[#00ADEF] hover:bg-blue-600 text-white py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all disabled:opacity-50"
            >
              {authLoading ? <Loader2 className="animate-spin" size={20} /> : null}
              {authMode === 'login' ? 'Se connecter' : "S'inscrire"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ========================================
  // MAIN DASHBOARD
  // ========================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex">
      {/* MOBILE HEADER */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-xl bg-slate-800 text-white"
        >
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl font-black text-[#00ADEF]">Pro Glaçons</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl bg-slate-800"
          >
            {notifications.filter(n => !n.read && !n.dismissed).length > 0 ? (
              <BellRing size={20} className="text-[#00ADEF] animate-bounce" />
            ) : (
              <Bell size={20} className="text-slate-400" />
            )}
            {notifications.filter(n => !n.read && !n.dismissed).length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {notifications.filter(n => !n.read && !n.dismissed).length > 9 ? '9+' : notifications.filter(n => !n.read && !n.dismissed).length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* MOBILE MENU OVERLAY */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <aside 
            className="w-80 h-full bg-slate-900 p-6 overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-black text-[#00ADEF]">Pro Glaçons</h1>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Admin Panel</p>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-xl bg-slate-800">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            
            <nav className="space-y-2">
              {[
                { id: 'overview', icon: <LayoutDashboard size={18} />, label: 'Aperçu' },
                { id: 'analytics', icon: <BarChart3 size={18} />, label: 'Comptabilité' },
                { id: 'orders', icon: <ShoppingBag size={18} />, label: 'Commandes', badge: pendingCount },
                { id: 'products', icon: <Package size={18} />, label: 'Produits', badge: lowStockProducts.length },
                { id: 'drivers', icon: <Truck size={18} />, label: 'Livreurs' },
                { id: 'map', icon: <Map size={18} />, label: 'Carte' },
                { id: 'clients', icon: <Crown size={18} />, label: 'Clients' },
                { id: 'kpi', icon: <Target size={18} />, label: 'KPIs & Perf' },
                { id: 'payments', icon: <Wallet size={18} />, label: 'Paiements' },
                { id: 'calendar', icon: <Calendar size={18} />, label: 'Calendrier' },
                { id: 'reports', icon: <FileText size={18} />, label: 'Rapports' },
                { id: 'stock-logs', icon: <History size={18} />, label: 'Historique Stock' },
                { id: 'stock-alerts', icon: <Zap size={18} />, label: 'Alertes Stock', badge: lowStockProducts.length },
                { id: 'users', icon: <Users size={18} />, label: 'Utilisateurs' },
                { id: 'my-account', icon: <UserCog size={18} />, label: 'Mon Compte' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id as TabType); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between p-4 rounded-xl font-bold text-sm transition-all ${
                    activeTab === item.id 
                      ? 'bg-[#00ADEF] text-white' 
                      : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-3">{item.icon}{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      activeTab === item.id ? 'bg-white/20' : 'bg-red-500/20 text-red-400'
                    }`}>{item.badge}</span>
                  )}
                </button>
              ))}
            </nav>

            <div className="mt-6 pt-6 border-t border-slate-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#00ADEF]/10 rounded-xl flex items-center justify-center">
                  <ShieldCheck size={18} className="text-[#00ADEF]" />
                </div>
                  <div>
                  <div className="text-sm font-bold">{currentProfile?.full_name || 'Admin'}</div>
                  <div className="text-xs text-slate-400 truncate">{currentProfile?.email || ''}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Administrateur</div>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-3 text-red-400 bg-red-500/10 rounded-xl text-sm font-bold"
              >
                <LogOut size={16} /> Déconnexion
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* SIDEBAR - Hidden on mobile */}
      <aside className={`hidden lg:flex ${sidebarCollapsed ? 'w-20' : 'w-72'} bg-slate-900 border-r border-slate-800 p-4 flex-col sticky top-0 h-screen overflow-hidden transition-all duration-300 relative`}>
        {/* Toggle Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-8 z-10 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center hover:bg-[#00ADEF] hover:border-[#00ADEF] transition-all"
        >
          <ChevronRight size={14} className={`text-white transition-transform duration-300 ${sidebarCollapsed ? '' : 'rotate-180'}`} />
        </button>

        <div className={`mb-6 ${sidebarCollapsed ? 'text-center' : ''}`}>
          {sidebarCollapsed ? (
            <div className="w-10 h-10 bg-[#00ADEF] rounded-xl flex items-center justify-center mx-auto">
              <span className="text-white font-black text-lg">P</span>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-black">Pro Glaçons</h1>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Admin Panel</p>
            </>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {[
            { id: 'overview', icon: <LayoutDashboard size={18} />, label: 'Aperçu' },
            { id: 'analytics', icon: <BarChart3 size={18} />, label: 'Comptabilité' },
            { id: 'orders', icon: <ShoppingBag size={18} />, label: 'Commandes', badge: pendingCount },
            { id: 'products', icon: <Package size={18} />, label: 'Produits', badge: lowStockProducts.length },
            { id: 'drivers', icon: <Truck size={18} />, label: 'Livreurs' },
            { id: 'map', icon: <Map size={18} />, label: 'Carte' },
            { id: 'clients', icon: <Crown size={18} />, label: 'Clients' },
            { id: 'kpi', icon: <Target size={18} />, label: 'KPIs' },
            { id: 'payments', icon: <Wallet size={18} />, label: 'Paiements' },
            { id: 'calendar', icon: <Calendar size={18} />, label: 'Calendrier' },
            { id: 'reports', icon: <FileText size={18} />, label: 'Rapports' },
            { id: 'stock-logs', icon: <History size={18} />, label: 'Historique' },
            { id: 'stock-alerts', icon: <Zap size={18} />, label: 'Alertes', badge: lowStockProducts.length },
            { id: 'users', icon: <Users size={18} />, label: 'Utilisateurs' },
            { id: 'my-account', icon: <UserCog size={18} />, label: 'Mon Compte' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} p-3 rounded-xl font-bold text-sm transition-all group relative ${
                activeTab === item.id 
                  ? 'bg-[#00ADEF] text-white' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <span className={`flex items-center ${sidebarCollapsed ? '' : 'gap-3'}`}>
                {item.icon}
                {!sidebarCollapsed && <span>{item.label}</span>}
              </span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`${sidebarCollapsed ? 'absolute -top-1 -right-1 w-5 h-5 text-[10px]' : 'px-2 py-0.5 text-xs'} rounded-full flex items-center justify-center ${
                  activeTab === item.id ? 'bg-white/20' : 'bg-red-500/20 text-red-400'
                }`}>{item.badge}</span>
              )}
              {/* Tooltip on hover when collapsed */}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </button>
          ))}
        </nav>

        <div className="pt-4 mt-2 border-t border-slate-800 flex-shrink-0">
          {sidebarCollapsed ? (
            <>
              <div className="flex justify-center mb-3">
                <div className="w-10 h-10 bg-[#00ADEF]/10 rounded-xl flex items-center justify-center">
                  <ShieldCheck size={18} className="text-[#00ADEF]" />
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center p-3 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                title="Déconnexion"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#00ADEF]/10 rounded-xl flex items-center justify-center">
                  <ShieldCheck size={18} className="text-[#00ADEF]" />
                </div>
                <div>
                  <div className="text-sm font-bold">{currentProfile?.full_name || 'Admin'}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Administrateur</div>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-3 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all text-sm font-bold"
              >
                <LogOut size={16} /> Déconnexion
              </button>
            </>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto pt-20 lg:pt-8 pb-24 lg:pb-8">
        {/* Header - Hidden on mobile (using mobile header instead) */}
        <header className="hidden lg:flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-black capitalize">{activeTab === 'overview' ? 'Tableau de bord' : activeTab === 'analytics' ? 'Comptabilité' : activeTab}</h2>
            <p className="text-slate-500 text-sm">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Sound toggle for stock alerts */}
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-3 rounded-xl transition-all ${soundEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}
              title={soundEnabled ? 'Désactiver les alertes sonores' : 'Activer les alertes sonores'}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-3 rounded-xl transition-all ${
                  notifications.filter(n => !n.read && !n.dismissed).length > 0 
                    ? 'bg-[#00ADEF]/20 text-[#00ADEF]' 
                    : 'bg-slate-800 text-slate-500 hover:text-white'
                }`}
              >
                {notifications.filter(n => !n.read && !n.dismissed).length > 0 ? <BellRing size={18} className="animate-bounce" /> : <Bell size={18} />}
                {notifications.filter(n => !n.read && !n.dismissed).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {notifications.filter(n => !n.read && !n.dismissed).length > 9 ? '9+' : notifications.filter(n => !n.read && !n.dismissed).length}
                  </span>
                )}
              </button>

              {/* Notifications Panel - Using NotificationCenter Component */}
              {showNotifications && (
                <div className="absolute right-0 top-14 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  <NotificationCenter
                    notifications={notifications}
                    onMarkAsRead={handleMarkAsRead}
                    onMarkAllAsRead={handleMarkAllAsRead}
                    onDismiss={handleDismissNotification}
                    onClearAll={handleClearAllNotifications}
                    onAction={handleNotificationAction}
                    config={notificationConfig}
                    onUpdateConfig={handleUpdateNotificationConfig}
                  />
                </div>
              )}
            </div>
            
            {/* Stock alert indicator */}
            {lowStockProducts.length > 0 && (
              <button 
                onClick={() => setActiveTab('stock-alerts')}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-bold animate-pulse"
              >
                <AlertTriangle size={16} />
                {lowStockProducts.length} Stock bas
              </button>
            )}

            {/* Search (for orders tab) */}
            {activeTab === 'orders' && (
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Rechercher..."
                  className="bg-slate-800/50 border border-slate-700 rounded-2xl pl-12 pr-6 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-[#00ADEF] w-64"
                />
              </div>
            )}
          </div>
        </header>

        <div className="space-y-8">
          {/* ===== OVERVIEW TAB ===== */}
          {activeTab === 'overview' && (
            <>
              {/* Mobile Title */}
              <div className="lg:hidden">
                <h2 className="text-2xl font-black">Tableau de bord</h2>
                <p className="text-slate-500 text-sm">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
              </div>

              {/* Quick Actions - Mobile Optimized */}
              <div className="lg:hidden">
                <h3 className="text-sm font-bold text-slate-400 uppercase mb-3">Actions Rapides</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="relative p-4 bg-gradient-to-br from-amber-500/20 to-orange-600/10 rounded-2xl border border-amber-500/30 text-left"
                  >
                    <ShoppingBag size={24} className="text-amber-400 mb-2" />
                    <p className="font-bold text-white">Commandes</p>
                    <p className="text-xs text-slate-400">Gérer les commandes</p>
                    {pendingCount > 0 && (
                      <span className="absolute top-3 right-3 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('map')}
                    className="p-4 bg-gradient-to-br from-blue-500/20 to-cyan-600/10 rounded-2xl border border-blue-500/30 text-left"
                  >
                    <Map size={24} className="text-blue-400 mb-2" />
                    <p className="font-bold text-white">Carte</p>
                    <p className="text-xs text-slate-400">Suivre livraisons</p>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('drivers')}
                    className="p-4 bg-gradient-to-br from-emerald-500/20 to-green-600/10 rounded-2xl border border-emerald-500/30 text-left"
                  >
                    <Truck size={24} className="text-emerald-400 mb-2" />
                    <p className="font-bold text-white">Livreurs</p>
                    <p className="text-xs text-slate-400">{drivers.filter(d => d.status === 'Disponible').length} disponibles</p>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('products')}
                    className="relative p-4 bg-gradient-to-br from-purple-500/20 to-violet-600/10 rounded-2xl border border-purple-500/30 text-left"
                  >
                    <Package size={24} className="text-purple-400 mb-2" />
                    <p className="font-bold text-white">Produits</p>
                    <p className="text-xs text-slate-400">Stock & catalogue</p>
                    {lowStockProducts.length > 0 && (
                      <span className="absolute top-3 right-3 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {lowStockProducts.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Urgent Alerts - Mobile */}
              {(pendingCount > 0 || lowStockProducts.length > 0) && (
                <div className="lg:hidden space-y-3">
                  {pendingCount > 0 && (
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="w-full p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-4"
                    >
                      <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                        <Clock size={24} className="text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-bold text-white">{pendingCount} commande(s) en attente</p>
                        <p className="text-xs text-amber-400">Nécessitent votre attention</p>
                      </div>
                      <ChevronLeft size={20} className="text-slate-400 rotate-180" />
                    </button>
                  )}
                  
                  {lowStockProducts.length > 0 && (
                    <button
                      onClick={() => setActiveTab('stock-alerts')}
                      className="w-full p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-4"
                    >
                      <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                        <AlertTriangle size={24} className="text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-bold text-white">{lowStockProducts.length} alerte(s) stock</p>
                        <p className="text-xs text-red-400">Stock faible détecté</p>
                      </div>
                      <ChevronLeft size={20} className="text-slate-400 rotate-180" />
                    </button>
                  )}
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                <StatCard 
                  title="Commandes Totales" 
                  value={orders.length} 
                  icon={<ShoppingCart size={20} className="text-[#00ADEF]" />}
                />
                <StatCard 
                  title="En Attente" 
                  value={pendingCount} 
                  icon={<Clock size={20} className="text-amber-400" />}
                />
                <StatCard 
                  title="Revenus (Livrés)" 
                  value={`${orders.filter(o => o.status === 'Livré').reduce((s, o) => s + o.total, 0).toLocaleString()} F`}
                  icon={<DollarSign size={20} className="text-emerald-400" />}
                  trend="+12%"
                />
                <StatCard 
                  title="Produits" 
                  value={products.length} 
                  icon={<Package size={20} className="text-purple-400" />}
                />
              </div>

              {/* Top Products */}
              <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-800 p-8">
                <h3 className="text-xl font-black mb-6">Produits les plus vendus</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analyticsData.barData.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#00ADEF]/10 rounded-xl flex items-center justify-center text-[#00ADEF] font-black text-lg">
                        #{idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold truncate">{item.name}</div>
                        <div className="text-sm text-slate-500">{item.quantity} vendus</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-800 p-8">
                <h3 className="text-xl font-black mb-6">Commandes récentes</h3>
                <div className="space-y-4">
                  {orders.slice(0, 5).map(order => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center text-xs font-bold">
                          {order.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="font-bold">{order.full_name || 'Client'}</div>
                          <div className="text-xs text-slate-500">{order.neighborhood}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-400">{order.total.toLocaleString()} F</div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${STATUS_COLORS[order.status]?.bg} ${STATUS_COLORS[order.status]?.text}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ===== ANALYTICS TAB - Professional Accounting Dashboard ===== */}
          {activeTab === 'analytics' && (
            <>
              {/* Header with Timeframe & Export */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-2">
                <div>
                  <p className="text-slate-400 text-sm">Analyse financière complète de votre activité</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex bg-slate-800/80 rounded-2xl p-1.5 border border-slate-700/50">
                    {(['day', 'month', 'year'] as TimeFrame[]).map(tf => (
                      <button
                        key={tf}
                        onClick={() => setAnalyticsTimeframe(tf)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                          analyticsTimeframe === tf 
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {tf === 'day' ? "Aujourd'hui" : tf === 'month' ? 'Ce mois' : 'Cette année'}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={exportCSV}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl font-bold text-sm hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20"
                  >
                    <Download size={16} /> Exporter CSV
                  </button>
                </div>
              </div>

              {/* Financial KPIs - Main Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Revenue */}
                <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 p-6 rounded-3xl border border-emerald-500/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                        <DollarSign size={20} className="text-emerald-400" />
                      </div>
                      {analyticsData.revenueGrowth !== 0 && (
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                          analyticsData.revenueGrowth > 0 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {analyticsData.revenueGrowth > 0 ? '+' : ''}{analyticsData.revenueGrowth}%
                        </span>
                      )}
                    </div>
                    <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Revenus Encaissés</div>
                    <div className="text-3xl font-black text-emerald-400">{analyticsData.totalRevenue.toLocaleString()} <span className="text-lg">F</span></div>
                    <div className="text-xs text-slate-500 mt-1">vs {analyticsData.previousRevenue.toLocaleString()} F période préc.</div>
                  </div>
                </div>

                {/* Pending Revenue */}
                <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 p-6 rounded-3xl border border-amber-500/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                        <Clock size={20} className="text-amber-400" />
                      </div>
                    </div>
                    <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Revenus en Attente</div>
                    <div className="text-3xl font-black text-amber-400">{analyticsData.pendingRevenue.toLocaleString()} <span className="text-lg">F</span></div>
                    <div className="text-xs text-slate-500 mt-1">{analyticsData.filteredOrders.filter(o => o.status !== 'Livré').length} commandes en cours</div>
                  </div>
                </div>

                {/* Orders */}
                <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/10 p-6 rounded-3xl border border-cyan-500/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all"></div>
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                        <ShoppingBag size={20} className="text-cyan-400" />
                      </div>
                      {analyticsData.ordersGrowth !== 0 && (
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                          analyticsData.ordersGrowth > 0 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {analyticsData.ordersGrowth > 0 ? '+' : ''}{analyticsData.ordersGrowth}%
                        </span>
                      )}
                    </div>
                    <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Commandes</div>
                    <div className="text-3xl font-black text-cyan-400">{analyticsData.filteredOrders.length}</div>
                    <div className="text-xs text-slate-500 mt-1">{analyticsData.deliveryRate}% taux de livraison</div>
                  </div>
                </div>

                {/* Average Order */}
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 p-6 rounded-3xl border border-purple-500/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                        <TrendingUp size={20} className="text-purple-400" />
                      </div>
                      {analyticsData.avgOrderGrowth !== 0 && (
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                          analyticsData.avgOrderGrowth > 0 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {analyticsData.avgOrderGrowth > 0 ? '+' : ''}{analyticsData.avgOrderGrowth}%
                        </span>
                      )}
                    </div>
                    <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Panier Moyen</div>
                    <div className="text-3xl font-black text-purple-400">{analyticsData.avgOrderValue.toLocaleString()} <span className="text-lg">F</span></div>
                    <div className="text-xs text-slate-500 mt-1">par commande</div>
                  </div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Revenue Trend Chart - Takes 2 columns */}
                <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-black">Évolution des Revenus</h3>
                      <p className="text-sm text-slate-500">{analyticsTimeframe === 'year' ? '12 derniers mois' : '7 derniers jours'}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"></div>
                        <span className="text-slate-400">Revenus</span>
                      </div>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={analyticsData.revenueByPeriod}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.8}/>
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="period" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip 
                        contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                        labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '8px' }}
                        formatter={(value) => [`${Number(value || 0).toLocaleString()} F`, 'Revenus']}
                      />
                      <Bar dataKey="revenue" fill="url(#revenueGradient)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Order Status Pie Chart */}
                <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800 p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-black">Statuts des Commandes</h3>
                    <p className="text-sm text-slate-500">Répartition actuelle</p>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={analyticsData.pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        strokeWidth={0}
                      >
                        {analyticsData.pieData.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-3 mt-2">
                    {analyticsData.pieData.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></div>
                        <span className="text-slate-400">{item.name}: <span className="text-white font-bold">{item.value}</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Product Analytics Table - Full Width */}
              <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black flex items-center gap-2">
                      <Package size={20} className="text-cyan-400" />
                      Analyse des Produits
                    </h3>
                    <p className="text-sm text-slate-500">Performance détaillée de chaque produit</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-white">{products.length}</div>
                    <div className="text-xs text-slate-500">produits actifs</div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-800/50">
                      <tr>
                        <th className="text-left p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Produit</th>
                        <th className="text-left p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Catégorie</th>
                        <th className="text-right p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Prix unitaire</th>
                        <th className="text-right p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Qté vendue</th>
                        <th className="text-right p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Revenus</th>
                        <th className="text-right p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Commandes</th>
                        <th className="text-right p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Stock</th>
                        <th className="text-center p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.productAnalytics.length > 0 ? (
                        analyticsData.productAnalytics.map((product, idx) => (
                          <tr key={idx} className="border-b border-slate-800/30 hover:bg-white/5 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center text-cyan-400 font-black text-sm">
                                  #{idx + 1}
                                </div>
                                <div>
                                  <div className="font-bold text-white">{product.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="px-3 py-1 bg-slate-800 rounded-lg text-xs font-bold text-slate-300">
                                {product.category}
                              </span>
                            </td>
                            <td className="p-4 text-right font-bold text-white">{product.price.toLocaleString()} F</td>
                            <td className="p-4 text-right">
                              <span className="font-black text-cyan-400">{product.quantity}</span>
                              <span className="text-slate-500 text-xs ml-1">unités</span>
                            </td>
                            <td className="p-4 text-right">
                              <span className="font-black text-emerald-400">{product.revenue.toLocaleString()} F</span>
                            </td>
                            <td className="p-4 text-right font-bold text-slate-300">{product.orders}</td>
                            <td className="p-4 text-right">
                              <span className={`font-black ${product.stock <= 10 ? 'text-red-400' : product.stock <= 25 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {product.stock}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                                product.inStock 
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
                              }`}>
                                {product.inStock ? 'Actif' : 'Inactif'}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        // Show all products even if no sales
                        products.map((product, idx) => (
                          <tr key={product.id} className="border-b border-slate-800/30 hover:bg-white/5 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center text-slate-400 font-black text-sm">
                                  #{idx + 1}
                                </div>
                                <div>
                                  <div className="font-bold text-white">{product.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="px-3 py-1 bg-slate-800 rounded-lg text-xs font-bold text-slate-300">
                                {product.category}
                              </span>
                            </td>
                            <td className="p-4 text-right font-bold text-white">{product.price.toLocaleString()} F</td>
                            <td className="p-4 text-right text-slate-500">0 unités</td>
                            <td className="p-4 text-right text-slate-500">0 F</td>
                            <td className="p-4 text-right text-slate-500">0</td>
                            <td className="p-4 text-right">
                              <span className={`font-black ${(product.stock_quantity ?? 0) <= 10 ? 'text-red-400' : (product.stock_quantity ?? 0) <= 25 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {product.stock_quantity ?? 0}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                                product.inStock 
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
                              }`}>
                                {product.inStock ? 'Actif' : 'Inactif'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Row - Top Customers & Neighborhoods */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Top Customers */}
                <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-black flex items-center gap-2">
                        <Users size={20} className="text-purple-400" />
                        Meilleurs Clients
                      </h3>
                      <p className="text-sm text-slate-500">Par chiffre d&apos;affaires</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {analyticsData.topCustomers.length > 0 ? (
                      analyticsData.topCustomers.map((customer, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-2xl hover:bg-slate-800/50 transition-colors">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                            idx === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white' :
                            idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800' :
                            idx === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white' :
                            'bg-slate-700 text-slate-400'
                          }`}>
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-white truncate">{customer.name}</div>
                            <div className="text-xs text-slate-500">{customer.orders} commandes</div>
                          </div>
                          <div className="text-right">
                            <div className="font-black text-emerald-400">{customer.total.toLocaleString()} F</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <Users size={40} className="mx-auto mb-3 opacity-30" />
                        <p>Aucune donnée client pour cette période</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Neighborhoods */}
                <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-black flex items-center gap-2">
                        <MapPin size={20} className="text-cyan-400" />
                        Zones les plus actives
                      </h3>
                      <p className="text-sm text-slate-500">Par revenus générés</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {analyticsData.topNeighborhoods.length > 0 ? (
                      analyticsData.topNeighborhoods.map((zone, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-2xl hover:bg-slate-800/50 transition-colors">
                          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center">
                            <MapPin size={18} className="text-cyan-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-white truncate">{zone.name}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-black text-cyan-400">{zone.revenue.toLocaleString()} F</div>
                            <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden mt-1">
                              <div 
                                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                                style={{ width: `${Math.min((zone.revenue / (analyticsData.topNeighborhoods[0]?.revenue || 1)) * 100, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <MapPin size={40} className="mx-auto mb-3 opacity-30" />
                        <p>Aucune donnée de zone pour cette période</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Orders Details Table */}
              <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black flex items-center gap-2">
                      <FileText size={20} className="text-slate-400" />
                      Historique des Transactions
                    </h3>
                    <p className="text-sm text-slate-500">{analyticsData.filteredOrders.length} commandes sur la période</p>
                  </div>
                </div>
                <div className="overflow-x-auto max-h-[400px]">
                  <table className="w-full">
                    <thead className="bg-slate-800/50 sticky top-0">
                      <tr>
                        <th className="text-left p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">ID</th>
                        <th className="text-left p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Client</th>
                        <th className="text-left p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Quartier</th>
                        <th className="text-right p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Montant</th>
                        <th className="text-center p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Statut</th>
                        <th className="text-right p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.filteredOrders.map(order => (
                        <tr key={order.id} className="border-b border-slate-800/30 hover:bg-white/5 transition-colors">
                          <td className="p-4 font-mono text-xs text-slate-400">{order.id.substring(0, 8).toUpperCase()}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center text-xs font-bold text-slate-300">
                                {order.full_name?.charAt(0) || '?'}
                              </div>
                              <span className="font-bold text-white">{order.full_name || 'Client'}</span>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-slate-400">{order.neighborhood}</td>
                          <td className="p-4 text-right font-black text-emerald-400">{order.total.toLocaleString()} F</td>
                          <td className="p-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${STATUS_COLORS[order.status]?.bg} ${STATUS_COLORS[order.status]?.text} border ${STATUS_COLORS[order.status]?.border}`}>
                              {order.status === 'Livré' && <CheckCircle size={10} />}
                              {order.status === 'En attente' && <Clock size={10} />}
                              {order.status === 'Livraison en cours' && <Truck size={10} />}
                              {order.status === 'En attente de confirmation' && <MapPin size={10} />}
                              {order.status}
                            </span>
                            {order.status === 'Livré' && order.confirmed_by && (
                              <div className={`text-[9px] mt-1 ${CONFIRMATION_LABELS[order.confirmed_by]?.color || 'text-slate-500'}`}>
                                {CONFIRMATION_LABELS[order.confirmed_by]?.label}
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-right text-sm text-slate-400">
                            {new Date(order.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ===== ORDERS TAB ===== */}
          {activeTab === 'orders' && (
            <>
              {/* Orders Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/10 p-5 rounded-2xl border border-cyan-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <ShoppingBag size={20} className="text-cyan-400" />
                    <span className="text-xs text-slate-400 font-bold uppercase">Total</span>
                  </div>
                  <div className="text-2xl font-black text-white">{orders.length}</div>
                </div>
                <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 p-5 rounded-2xl border border-amber-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock size={20} className="text-amber-400" />
                    <span className="text-xs text-slate-400 font-bold uppercase">En attente</span>
                  </div>
                  <div className="text-2xl font-black text-amber-400">{orders.filter(o => o.status === 'En attente').length}</div>
                </div>
                <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/10 p-5 rounded-2xl border border-blue-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Truck size={20} className="text-blue-400" />
                    <span className="text-xs text-slate-400 font-bold uppercase">En cours</span>
                  </div>
                  <div className="text-2xl font-black text-blue-400">{orders.filter(o => o.status === 'Livraison en cours').length}</div>
                </div>
                <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/10 p-5 rounded-2xl border border-emerald-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle size={20} className="text-emerald-400" />
                    <span className="text-xs text-slate-400 font-bold uppercase">Livrées</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-400">{orders.filter(o => o.status === 'Livré').length}</div>
                </div>
              </div>

              {/* Search & Filters */}
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Rechercher par nom, ID, quartier..."
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl pl-12 pr-6 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-[#00ADEF] transition-all"
                  />
                </div>
                <div className="flex gap-2">
                  {['all', 'En attente', 'Livraison en cours', 'Livré'].map(status => (
                    <button
                      key={status}
                      onClick={() => setOrderStatusFilter(status)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        orderStatusFilter === status 
                          ? 'bg-[#00ADEF] text-white' 
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {status === 'all' ? 'Tous' : status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orders Table */}
              <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800 overflow-hidden">
                <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                  <div className="text-sm text-slate-400">
                    <span className="text-white font-bold">{filteredOrders.length}</span> commande(s) trouvée(s)
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-800/50">
                      <tr>
                        <th className="text-left p-5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Client</th>
                        <th className="text-left p-5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Contact</th>
                        <th className="text-left p-5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Quartier</th>
                        <th className="text-right p-5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Total</th>
                        <th className="text-center p-5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Statut</th>
                        <th className="text-right p-5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Date</th>
                        <th className="text-right p-5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.length > 0 ? filteredOrders.map(order => (
                        <tr key={order.id} className="border-b border-slate-800/30 hover:bg-white/5 transition-colors">
                          <td className="p-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center text-cyan-400 font-black">
                                {order.full_name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <div className="font-bold text-white">{order.full_name || 'Client'}</div>
                                <div className="text-[10px] text-slate-500 font-mono">#{order.id.substring(0, 8).toUpperCase()}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-5">
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                              <Phone size={14} className="text-slate-500" />
                              {order.phone}
                            </div>
                          </td>
                          <td className="p-5">
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                              <MapPin size={14} className="text-slate-500" />
                              {order.neighborhood}
                            </div>
                          </td>
                          <td className="p-5 text-right">
                            <div className="font-black text-emerald-400 text-lg">{order.total.toLocaleString()} F</div>
                            <div className="text-[10px] text-slate-500">{order.items.length} article(s)</div>
                          </td>
                          <td className="p-5 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase ${STATUS_COLORS[order.status]?.bg} ${STATUS_COLORS[order.status]?.text} border ${STATUS_COLORS[order.status]?.border}`}>
                              {order.status === 'Livré' && <CheckCircle size={12} />}
                              {order.status === 'En attente' && <Clock size={12} />}
                              {order.status === 'Livraison en cours' && <Truck size={12} />}
                              {order.status === 'En attente de confirmation' && <MapPin size={12} />}
                              {order.status === 'Préparation' && <Package size={12} />}
                              {order.status}
                            </span>
                            {order.status === 'Livré' && order.confirmed_by && (
                              <div className={`text-[9px] mt-1 ${CONFIRMATION_LABELS[order.confirmed_by]?.color || 'text-slate-500'}`}>
                                {CONFIRMATION_LABELS[order.confirmed_by]?.label}
                              </div>
                            )}
                          </td>
                          <td className="p-5 text-right">
                            <div className="text-sm text-white">{new Date(order.created_at).toLocaleDateString('fr-FR')}</div>
                            <div className="text-[10px] text-slate-500">{new Date(order.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                          </td>
                          <td className="p-5 text-right">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="p-3 bg-slate-800 hover:bg-[#00ADEF] text-slate-400 hover:text-white rounded-xl transition-all"
                              title="Voir détails"
                            >
                              <Eye size={16} />
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={7} className="p-12 text-center text-slate-500">
                            <ShoppingBag size={48} className="mx-auto mb-4 opacity-30" />
                            <p>Aucune commande trouvée</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ===== PRODUCTS TAB ===== */}
          {activeTab === 'products' && (
            <>
              {/* Product Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-purple-500/20 to-indigo-500/10 p-5 rounded-2xl border border-purple-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Package size={20} className="text-purple-400" />
                    <span className="text-xs text-slate-400 font-bold uppercase">Total Produits</span>
                  </div>
                  <div className="text-2xl font-black text-white">{products.length}</div>
                </div>
                <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/10 p-5 rounded-2xl border border-emerald-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle size={20} className="text-emerald-400" />
                    <span className="text-xs text-slate-400 font-bold uppercase">Actifs</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-400">{productStats.activeProducts}</div>
                </div>
                <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/10 p-5 rounded-2xl border border-cyan-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <PackagesIcon size={20} className="text-cyan-400" />
                    <span className="text-xs text-slate-400 font-bold uppercase">Stock Total</span>
                  </div>
                  <div className="text-2xl font-black text-cyan-400">{productStats.totalStock.toLocaleString()}</div>
                </div>
                <div className="bg-gradient-to-br from-red-500/20 to-orange-500/10 p-5 rounded-2xl border border-red-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle size={20} className="text-red-400" />
                    <span className="text-xs text-slate-400 font-bold uppercase">Stock Bas</span>
                  </div>
                  <div className="text-2xl font-black text-red-400">{productStats.lowStock}</div>
                </div>
              </div>

              {/* Low Stock Alert */}
              {lowStockProducts.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="text-red-400" size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-red-400 mb-1">⚠️ Alerte Stock Critique</div>
                    <div className="text-sm text-slate-400">
                      {lowStockProducts.map(p => `${p.name} (${p.stock_quantity})`).join(' • ')}
                    </div>
                  </div>
                  <button 
                    onClick={() => setProductCategoryFilter('all')}
                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl text-sm font-bold hover:bg-red-500 hover:text-white transition-all"
                  >
                    Gérer
                  </button>
                </div>
              )}

              {/* Search & Filters */}
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="text"
                    value={productSearchQuery}
                    onChange={e => setProductSearchQuery(e.target.value)}
                    placeholder="Rechercher un produit..."
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl pl-12 pr-6 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-[#00ADEF] transition-all"
                  />
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <select
                    value={productCategoryFilter}
                    onChange={e => setProductCategoryFilter(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-[#00ADEF]"
                  >
                    <option value="all">Toutes catégories</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => { resetProductForm(); setIsAddingProduct(true); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
                  >
                    <Plus size={18} /> Nouveau Produit
                  </button>
                </div>
              </div>

              {/* Products Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredProducts.length > 0 ? filteredProducts.map(product => (
                  <div key={product.id} className={`bg-slate-900/50 backdrop-blur-xl rounded-2xl border overflow-hidden transition-all hover:scale-[1.02] hover:shadow-xl group ${
                    (product.stock_quantity ?? 0) <= 10 
                      ? 'border-red-500/50 ring-2 ring-red-500/20' 
                      : 'border-slate-800 hover:border-cyan-500/30'
                  }`}>
                    <div className="relative aspect-[4/3] bg-slate-800 overflow-hidden">
                      {product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600 bg-gradient-to-br from-slate-800 to-slate-900">
                          <ImageIcon size={40} />
                        </div>
                      )}
                      {/* Overlays */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                      {product.tag && (
                        <span className="absolute top-3 left-3 px-2.5 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[10px] font-bold rounded-lg uppercase">
                          {product.tag}
                        </span>
                      )}
                      <div className="absolute top-3 right-3 flex gap-1">
                        {(product.stock_quantity ?? 0) <= 10 && (
                          <span className="px-2.5 py-1 bg-red-500 text-white text-[10px] font-bold rounded-lg animate-pulse">
                            Stock: {product.stock_quantity}
                          </span>
                        )}
                      </div>
                      {/* Category badge */}
                      <span className="absolute bottom-3 left-3 px-2.5 py-1 bg-slate-900/80 backdrop-blur-sm text-slate-300 text-[10px] font-bold rounded-lg">
                        {product.category}
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-white text-sm truncate flex-1 mr-2">{product.name}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex-shrink-0 ${
                          product.inStock ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {product.inStock ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <div className="text-lg font-black text-emerald-400">{product.price.toLocaleString()} F</div>
                          <div className="text-[10px] text-slate-500">par {product.unit} • Stock: {product.stock_quantity ?? 0}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleProductStock(product)}
                            className={`p-1.5 rounded-lg transition-all ${
                              product.inStock 
                                ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white' 
                                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white'
                            }`}
                            title={product.inStock ? 'Désactiver' : 'Activer'}
                          >
                            {product.inStock ? <VolumeX size={14} /> : <Volume2 size={14} />}
                          </button>
                          <button
                            onClick={() => openEditProduct(product)}
                            className="p-1.5 bg-slate-800 hover:bg-[#00ADEF] text-slate-400 hover:text-white rounded-lg transition-all"
                            title="Modifier"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-1.5 bg-slate-800 hover:bg-red-500 text-slate-400 hover:text-white rounded-lg transition-all"
                            title="Supprimer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full py-16 text-center text-slate-500">
                    <Package size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="font-bold">Aucun produit trouvé</p>
                    <p className="text-sm">Essayez de modifier vos filtres</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ===== REPORTS TAB ===== */}
          {activeTab === 'reports' && (
            <ReportsTab
              orders={orders}
              products={products}
              stockLogs={stockLogs}
              reportPeriod={reportPeriod}
              setReportPeriod={setReportPeriod}
              customStartDate={customStartDate}
              setCustomStartDate={setCustomStartDate}
              customEndDate={customEndDate}
              setCustomEndDate={setCustomEndDate}
              isExporting={isExporting}
              setIsExporting={setIsExporting}
            />
          )}

          {/* ===== PAYMENTS TAB ===== */}
          {activeTab === 'payments' && (
            <PaymentsTab
              orders={orders}
              onUpdatePayment={async (orderId, paymentData) => {
                try {
                  const { error } = await supabase
                    .from('orders')
                    .update({
                      payment_status: paymentData.payment_status,
                      payment_date: paymentData.payment_date,
                      payment_amount: paymentData.payment_amount,
                      payment_notes: paymentData.payment_notes,
                    })
                    .eq('id', orderId);
                  
                  if (error) {
                    console.error('Erreur Supabase:', error);
                    alert(`Erreur: Les colonnes de paiement n'existent pas encore dans la base de données.\n\nExécutez ce SQL dans Supabase:\n\nALTER TABLE orders\nADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',\nADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ,\nADD COLUMN IF NOT EXISTS payment_amount NUMERIC,\nADD COLUMN IF NOT EXISTS payment_notes TEXT;`);
                    throw error;
                  }
                  
                  // Mettre à jour localement
                  setOrders(prev => prev.map(order => 
                    order.id === orderId 
                      ? { 
                          ...order, 
                          payment_status: paymentData.payment_status,
                          payment_date: paymentData.payment_date,
                          payment_amount: paymentData.payment_amount,
                          payment_notes: paymentData.payment_notes,
                        } 
                      : order
                  ));
                  
                  // Créer une notification pour le paiement
                  const targetOrder = orders.find(o => o.id === orderId);
                  if (notificationConfig.notify_payments && targetOrder) {
                    const statusLabels: Record<string, string> = {
                      'paid': 'Payé',
                      'partial': 'Partiel',
                      'unpaid': 'Impayé',
                      'pending': 'En attente',
                      'refunded': 'Remboursé'
                    };
                    const statusLabel = statusLabels[paymentData.payment_status] || paymentData.payment_status;
                    
                    if (paymentData.payment_status === 'paid') {
                      createNotification(
                        'payment_received',
                        '💰 Paiement Reçu!',
                        `${targetOrder.full_name} - ${targetOrder.total?.toLocaleString()} FCFA`,
                        {
                          priority: 'medium',
                          metadata: { order_id: orderId, amount: targetOrder.total },
                          action_label: 'Voir détails'
                        }
                      );
                    } else if (paymentData.payment_status === 'partial') {
                      createNotification(
                        'payment_received',
                        '💳 Paiement Partiel',
                        `${targetOrder.full_name} - ${paymentData.payment_amount?.toLocaleString()} / ${targetOrder.total?.toLocaleString()} FCFA`,
                        {
                          priority: 'low',
                          metadata: { order_id: orderId, amount: paymentData.payment_amount },
                          action_label: 'Voir détails'
                        }
                      );
                    } else {
                      createNotification(
                        'system',
                        `📄 Statut Paiement: ${statusLabel}`,
                        `${targetOrder.full_name} - Commande #${orderId.slice(0, 8)}`,
                        {
                          priority: 'low',
                          metadata: { order_id: orderId }
                        }
                      );
                    }
                  }
                } catch (err) {
                  console.error('Erreur mise à jour paiement:', err);
                  throw err;
                }
              }}
            />
          )}

          {/* ===== CALENDAR TAB ===== */}
          {activeTab === 'calendar' && (
            <CalendarTab
              orders={orders}
              drivers={drivers}
              onScheduleDelivery={async (orderId, data) => {
                try {
                  const updateData: Record<string, unknown> = {
                    scheduled_date: data.scheduled_date,
                  };
                  
                  if (data.scheduled_time) {
                    updateData.scheduled_time = data.scheduled_time;
                  }
                  
                  if (data.driver_id) {
                    updateData.driver_id = data.driver_id;
                    updateData.status = 'Confirmé';
                  }
                  
                  const { error } = await supabase
                    .from('orders')
                    .update(updateData)
                    .eq('id', orderId);
                  
                  if (error) {
                    console.error('Erreur planification:', error);
                    // Si les colonnes n'existent pas, afficher le SQL
                    if (error.message.includes('column') || error.code === '42703') {
                      alert(`Erreur: Les colonnes de planification n'existent pas encore.\n\nExécutez ce SQL dans Supabase:\n\nALTER TABLE orders\nADD COLUMN IF NOT EXISTS scheduled_date DATE,\nADD COLUMN IF NOT EXISTS scheduled_time TEXT;`);
                    }
                    throw error;
                  }
                  
                  // Mettre à jour localement
                  setOrders(prev => prev.map(order => 
                    order.id === orderId 
                      ? { 
                          ...order, 
                          scheduled_date: data.scheduled_date,
                          scheduled_time: data.scheduled_time,
                          driver_id: data.driver_id || order.driver_id,
                          status: data.driver_id ? 'Confirmé' : order.status
                        } 
                      : order
                  ));
                  
                  // Notification
                  const targetOrder = orders.find(o => o.id === orderId);
                  if (targetOrder) {
                    createNotification(
                      'order_status',
                      '📅 Livraison Planifiée',
                      `${targetOrder.full_name} - ${format(parseISO(data.scheduled_date), 'd MMMM', { locale: fr })}`,
                      {
                        priority: 'low',
                        metadata: { order_id: orderId, date: data.scheduled_date },
                        action_label: 'Voir calendrier'
                      }
                    );
                  }
                } catch (err) {
                  console.error('Erreur planification:', err);
                  throw err;
                }
              }}
              onAutoAssignDriver={async (orderId, scheduledDate) => {
                // Trouver le meilleur livreur disponible
                const availableDrivers = drivers.filter(d => d.is_available !== false);
                if (availableDrivers.length === 0) return null;
                
                // Compter les livraisons par livreur pour cette date
                const workloads = availableDrivers.map(driver => {
                  const count = orders.filter(o => 
                    o.driver_id === driver.id &&
                    o.scheduled_date &&
                    format(parseISO(o.scheduled_date), 'yyyy-MM-dd') === scheduledDate
                  ).length;
                  return { driver, count };
                });
                
                // Trier par charge de travail (le moins chargé en premier)
                workloads.sort((a, b) => a.count - b.count);
                const bestDriver = workloads[0].driver;
                
                // Assigner le livreur
                const { error } = await supabase
                  .from('orders')
                  .update({ 
                    driver_id: bestDriver.id,
                    status: 'Confirmé'
                  })
                  .eq('id', orderId);
                
                if (error) {
                  console.error('Erreur assignation:', error);
                  throw error;
                }
                
                // Mettre à jour localement
                setOrders(prev => prev.map(order => 
                  order.id === orderId 
                    ? { ...order, driver_id: bestDriver.id, status: 'Confirmé' } 
                    : order
                ));
                
                // Notification
                createNotification(
                  'driver_assigned',
                  '🚚 Livreur Assigné',
                  `${bestDriver.name} assigné à la commande`,
                  {
                    priority: 'low',
                    metadata: { order_id: orderId, driver_id: bestDriver.id }
                  }
                );
                
                return bestDriver;
              }}
            />
          )}

          {/* ===== CLIENTS TAB ===== */}
          {activeTab === 'clients' && (
            <ClientsTab
              profiles={profiles}
              orders={orders}
              onUpdateLoyalty={async (userId, points, tier) => {
                // Pour l'instant, on stocke les points de fidélité dans le localStorage
                // TODO: Ajouter une table loyalty_points dans Supabase
                const loyaltyData = JSON.parse(localStorage.getItem('loyalty_data') || '{}');
                loyaltyData[userId] = { points, tier, updated_at: new Date().toISOString() };
                localStorage.setItem('loyalty_data', JSON.stringify(loyaltyData));
                
                createNotification(
                  'system',
                  '🎁 Points Fidélité',
                  `${points} points attribués`,
                  { priority: 'low', metadata: {} }
                );
              }}
            />
          )}

          {/* ===== KPI DASHBOARD TAB ===== */}
          {activeTab === 'kpi' && (
            <KPIDashboardTab
              orders={orders}
              products={products}
              profiles={profiles}
              drivers={drivers}
            />
          )}

          {/* ===== DELIVERY MAP TAB ===== */}
          {activeTab === 'map' && (
            <DeliveryMapTab
              orders={orders}
              drivers={drivers}
              onAssignDriver={async (orderId, driverId) => {
                try {
                  const { error } = await supabase
                    .from('orders')
                    .update({ driver_id: driverId, status: 'Préparation' })
                    .eq('id', orderId);
                  
                  if (error) throw error;
                  
                  setOrders(prev => prev.map(order => 
                    order.id === orderId 
                      ? { ...order, driver_id: driverId, status: 'Préparation' as const }
                      : order
                  ));
                  
                  createNotification(
                    'order_status',
                    '🚚 Livreur Assigné',
                    `Commande ${orderId.slice(0, 8)} assignée`,
                    { priority: 'medium', metadata: { order_id: orderId } }
                  );
                } catch (err) {
                  console.error('Error assigning driver:', err);
                }
              }}
              onUpdateZone={(zone) => {
                // For now, zones are stored locally
                // TODO: Add delivery_zones table in Supabase
                console.log('Zone updated:', zone);
              }}
            />
          )}

          {/* ===== DRIVERS TAB ===== */}
          {activeTab === 'drivers' && (
            <>
              {/* Driver Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/10 p-5 rounded-2xl border border-cyan-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Truck size={20} className="text-cyan-400" />
                    <span className="text-xs text-slate-400 font-bold uppercase">Total Livreurs</span>
                  </div>
                  <div className="text-2xl font-black text-white">{drivers.length}</div>
                </div>
                <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/10 p-5 rounded-2xl border border-emerald-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle size={20} className="text-emerald-400" />
                    <span className="text-xs text-slate-400 font-bold uppercase">Disponibles</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-400">{driverStats.available}</div>
                </div>
                <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 p-5 rounded-2xl border border-amber-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Truck size={20} className="text-amber-400" />
                    <span className="text-xs text-slate-400 font-bold uppercase">En Livraison</span>
                  </div>
                  <div className="text-2xl font-black text-amber-400">{driverStats.delivering}</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-indigo-500/10 p-5 rounded-2xl border border-purple-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Package size={20} className="text-purple-400" />
                    <span className="text-xs text-slate-400 font-bold uppercase">Livraisons Totales</span>
                  </div>
                  <div className="text-2xl font-black text-purple-400">{driverStats.totalDeliveries}</div>
                </div>
              </div>

              {/* Filters & Add Button */}
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex gap-2">
                  {['all', 'Disponible', 'En livraison', 'Hors service'].map(status => (
                    <button
                      key={status}
                      onClick={() => setDriverStatusFilter(status)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        driverStatusFilter === status 
                          ? 'bg-[#00ADEF] text-white' 
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {status === 'all' ? 'Tous' : status === 'Hors service' ? 'Indisponible' : status}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => { setNewDriver({ name: '', phone: '' }); setIsAddingDriver(true); }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
                >
                  <Plus size={18} /> Nouveau Livreur
                </button>
              </div>

              {/* Drivers Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredDrivers.length > 0 ? filteredDrivers.map(driver => (
                  <div key={driver.id} className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 p-5 hover:border-cyan-500/30 transition-all group">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                        driver.status === 'Disponible' ? 'bg-emerald-500/20' :
                        driver.status === 'En livraison' ? 'bg-amber-500/20' : 'bg-red-500/20'
                      }`}>
                        <Truck size={24} className={
                          driver.status === 'Disponible' ? 'text-emerald-400' :
                          driver.status === 'En livraison' ? 'text-amber-400' : 'text-red-400'
                        } />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-lg truncate">{driver.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Phone size={14} /> {driver.phone}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditingDriver(driver); setNewDriver({ name: driver.name, phone: driver.phone }); }}
                          className="p-2 bg-slate-800 hover:bg-[#00ADEF] text-slate-400 hover:text-white rounded-lg transition-all"
                          title="Modifier"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteDriver(driver.id)}
                          className="p-2 bg-slate-800 hover:bg-red-500 text-slate-400 hover:text-white rounded-lg transition-all"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Status & Actions */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${DRIVER_STATUS_COLORS[driver.status]?.bg} ${DRIVER_STATUS_COLORS[driver.status]?.text}`}>
                        {driver.status}
                      </span>
                      <div className="text-sm text-slate-400">
                        <span className="text-white font-bold">{driver.activeOrders}</span> commandes actives
                      </div>
                    </div>

                    {/* Quick Status Change */}
                    <div className="flex gap-2">
                      {driver.status !== 'Disponible' && (
                        <button
                          onClick={() => handleUpdateDriverStatus(driver, 'Disponible')}
                          className="flex-1 px-3 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-bold hover:bg-emerald-500 hover:text-white transition-all"
                        >
                          Disponible
                        </button>
                      )}
                      {driver.status !== 'En livraison' && (
                        <button
                          onClick={() => handleUpdateDriverStatus(driver, 'En livraison')}
                          className="flex-1 px-3 py-2 bg-amber-500/10 text-amber-400 rounded-lg text-xs font-bold hover:bg-amber-500 hover:text-white transition-all"
                        >
                          En livraison
                        </button>
                      )}
                      {driver.status !== 'Hors service' && (
                        <button
                          onClick={() => handleUpdateDriverStatus(driver, 'Hors service')}
                          className="flex-1 px-3 py-2 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500 hover:text-white transition-all"
                        >
                          Indisponible
                        </button>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full py-16 text-center text-slate-500">
                    <Truck size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="font-bold">Aucun livreur trouvé</p>
                    <p className="text-sm">Ajoutez votre premier livreur</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ===== STOCK LOGS TAB ===== */}
          {activeTab === 'stock-logs' && (
            <>
              {/* Stock Logs Header */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-black text-white">Historique des Stocks</h2>
                  <p className="text-slate-400 text-sm">Traçabilité complète des mouvements de stock</p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={stockLogFilter}
                    onChange={(e) => setStockLogFilter(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="all">Tous les mouvements</option>
                    <option value="in">Entrées uniquement</option>
                    <option value="out">Sorties uniquement</option>
                    <option value="adjustment">Ajustements</option>
                  </select>
                  <button 
                    onClick={async () => {
                      const { data } = await supabase.from('stock_logs').select('*').order('created_at', { ascending: false }).limit(100);
                      if (data) setStockLogs(data);
                    }}
                    className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
                    title="Rafraîchir"
                  >
                    <RefreshCw size={18} className="text-slate-400" />
                  </button>
                  <button 
                    onClick={async () => {
                      if (confirm('Supprimer toutes les données de démonstration de l\'historique des stocks ?')) {
                        // Supprimer les entrées qui ne sont pas liées à une vraie commande
                        await supabase.from('stock_logs').delete().is('order_id', null);
                        const { data } = await supabase.from('stock_logs').select('*').order('created_at', { ascending: false }).limit(100);
                        if (data) setStockLogs(data);
                      }
                    }}
                    className="p-3 bg-red-500/20 rounded-xl hover:bg-red-500/30 transition-colors"
                    title="Supprimer les données de démo"
                  >
                    <Trash2 size={18} className="text-red-400" />
                  </button>
                </div>
              </div>

              {/* Stock Logs Stats */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/10 p-5 rounded-2xl border border-emerald-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <ArrowDownCircle size={20} className="text-emerald-400" />
                    <span className="text-xs text-slate-400 font-bold uppercase">Entrées (30j)</span>
                  </div>
                  <div className="text-2xl font-black text-white">
                    {stockLogs.filter(l => l.type === 'in' && new Date(l.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-red-500/20 to-orange-500/10 p-5 rounded-2xl border border-red-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <ArrowUpCircle size={20} className="text-red-400" />
                    <span className="text-xs text-slate-400 font-bold uppercase">Sorties (30j)</span>
                  </div>
                  <div className="text-2xl font-black text-white">
                    {stockLogs.filter(l => ((l.type as string) === 'out' || (l.type as string) === 'sale') && new Date(l.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-amber-500/20 to-yellow-500/10 p-5 rounded-2xl border border-amber-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <History size={20} className="text-amber-400" />
                    <span className="text-xs text-slate-400 font-bold uppercase">Total Mouvements</span>
                  </div>
                  <div className="text-2xl font-black text-white">{stockLogs.length}</div>
                </div>
              </div>

              {/* Stock Logs Table */}
              <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="text-left text-xs font-black text-slate-400 uppercase tracking-wider p-5">Date</th>
                        <th className="text-left text-xs font-black text-slate-400 uppercase tracking-wider p-5">Produit</th>
                        <th className="text-left text-xs font-black text-slate-400 uppercase tracking-wider p-5">Type</th>
                        <th className="text-left text-xs font-black text-slate-400 uppercase tracking-wider p-5">Quantité</th>
                        <th className="text-left text-xs font-black text-slate-400 uppercase tracking-wider p-5">Avant → Après</th>
                        <th className="text-left text-xs font-black text-slate-400 uppercase tracking-wider p-5">Raison</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockLogs.length > 0 ? (
                        stockLogs
                          .filter(log => {
                            if (stockLogFilter === 'all') return true;
                            if (stockLogFilter === 'out') return (log.type as string) === 'out' || (log.type as string) === 'sale';
                            return log.type === stockLogFilter;
                          })
                          .map((log) => (
                            <tr key={log.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                              <td className="p-5">
                                <div className="text-sm font-bold text-white">
                                  {new Date(log.created_at).toLocaleDateString('fr-FR')}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {new Date(log.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </td>
                              <td className="p-5">
                                <span className="font-bold text-white">{log.product_name}</span>
                              </td>
                              <td className="p-5">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase ${
                                  log.type === 'in' 
                                    ? 'bg-emerald-500/20 text-emerald-400' 
                                    : ((log.type as string) === 'out' || (log.type as string) === 'sale')
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'bg-amber-500/20 text-amber-400'
                                }`}>
                                  {log.type === 'in' && <ArrowDownCircle size={12} />}
                                  {((log.type as string) === 'out' || (log.type as string) === 'sale') && <ArrowUpCircle size={12} />}
                                  {log.type === 'adjustment' && <RefreshCw size={12} />}
                                  {log.type === 'in' ? 'Entrée' : ((log.type as string) === 'out' || (log.type as string) === 'sale') ? 'Sortie' : 'Ajustement'}
                                </span>
                              </td>
                              <td className="p-5">
                                <span className={`text-lg font-black ${
                                  log.quantity_change > 0 ? 'text-emerald-400' : 'text-red-400'
                                }`}>
                                  {log.quantity_change > 0 ? '+' : ''}{log.quantity_change}
                                </span>
                              </td>
                              <td className="p-5">
                                <span className="text-slate-400 font-medium">
                                  {log.previous_quantity} → <span className="text-white font-bold">{log.new_quantity}</span>
                                </span>
                              </td>
                              <td className="p-5">
                                <span className="text-sm text-slate-300">{log.reason}</span>
                                {log.order_id && (
                                  <span className="ml-2 text-xs text-cyan-400">
                                    #{log.order_id.slice(0, 8)}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-12 text-center">
                            <History size={48} className="mx-auto mb-4 text-slate-700" />
                            <p className="text-slate-500 font-bold">Aucun mouvement de stock enregistré</p>
                            <p className="text-slate-600 text-sm mt-1">Les mouvements apparaîtront ici automatiquement</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ===== STOCK ALERTS TAB ===== */}
          {activeTab === 'stock-alerts' && (
            <StockAlertsTab
              products={products}
              orders={orders}
              stockLogs={stockLogs}
            />
          )}

          {/* ===== USERS TAB ===== */}
          {activeTab === 'users' && (
            <>
              {/* User Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-purple-500/20 to-indigo-500/10 p-5 rounded-2xl border border-purple-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Users size={20} className="text-purple-400" />
                    <span className="text-xs text-slate-400 font-bold uppercase">Total Utilisateurs</span>
                  </div>
                  <div className="text-2xl font-black text-white">{profiles.length}</div>
                </div>
                <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/10 p-5 rounded-2xl border border-cyan-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Users size={20} className="text-cyan-400" />
                    <span className="text-xs text-slate-400 font-bold uppercase">Clients</span>
                  </div>
                  <div className="text-2xl font-black text-cyan-400">{userStats.clients}</div>
                </div>
                <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 p-5 rounded-2xl border border-amber-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <ShieldCheck size={20} className="text-amber-400" />
                    <span className="text-xs text-slate-400 font-bold uppercase">Admins</span>
                  </div>
                  <div className="text-2xl font-black text-amber-400">{userStats.admins}</div>
                </div>
                <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/10 p-5 rounded-2xl border border-emerald-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp size={20} className="text-emerald-400" />
                    <span className="text-xs text-slate-400 font-bold uppercase">Ce mois</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-400">+{userStats.thisMonth}</div>
                </div>
              </div>

              {/* Search */}
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={e => setUserSearchQuery(e.target.value)}
                    placeholder="Rechercher par nom, téléphone, ID..."
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl pl-12 pr-6 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-[#00ADEF] transition-all"
                  />
                </div>
                <div className="text-sm text-slate-400">
                  <span className="text-white font-bold">{filteredUsers.length}</span> utilisateur(s) trouvé(s)
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-800/50">
                      <tr>
                        <th className="text-left p-5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Utilisateur</th>
                        <th className="text-left p-5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Contact</th>
                        <th className="text-left p-5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Inscription</th>
                        <th className="text-center p-5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Rôle</th>
                        <th className="text-right p-5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Commandes</th>
                        <th className="text-right p-5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Dépensé</th>
                        <th className="text-right p-5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length > 0 ? filteredUsers.map(user => {
                        const userOrders = orders.filter(o => o.user_id === user.id);
                        const totalSpent = userOrders.reduce((sum, o) => sum + o.total, 0);
                        return (
                          <tr key={user.id} className="border-b border-slate-800/30 hover:bg-white/5 transition-colors">
                            <td className="p-5">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                                  user.role === 'admin' 
                                    ? 'bg-gradient-to-br from-purple-500/30 to-indigo-500/30 text-purple-300' 
                                    : 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-400'
                                }`}>
                                  {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div>
                                  <div className="font-bold text-white">{user.full_name || 'Sans nom'}</div>
                                  <div className="text-[10px] text-slate-500 font-mono">#{user.id.substring(0, 8).toUpperCase()}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-5">
                              <div className="flex items-center gap-2 text-sm text-slate-300">
                                <Phone size={14} className="text-slate-500" />
                                {user.phone || 'N/A'}
                              </div>
                            </td>
                            <td className="p-5">
                              <div className="text-sm text-slate-400">
                                {new Date(user.created_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                              </div>
                            </td>
                            <td className="p-5 text-center">
                              {user.role === 'admin' ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold uppercase">
                                  <ShieldCheck size={12} /> Admin
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-700/30 text-slate-400 border border-slate-700/50 text-[10px] font-bold uppercase">
                                  <Users size={12} /> Client
                                </span>
                              )}
                            </td>
                            <td className="p-5 text-right">
                              <div className="text-lg font-bold text-white">{userOrders.length}</div>
                            </td>
                            <td className="p-5 text-right">
                              <div className="text-lg font-bold text-emerald-400">{totalSpent.toLocaleString()} F</div>
                            </td>
                            <td className="p-5 text-right">
                              <button
                                onClick={() => handleToggleRole(user)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                  user.role === 'admin'
                                    ? 'bg-slate-800 text-slate-400 hover:bg-red-500/20 hover:text-red-400 border border-slate-700'
                                    : 'bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-white border border-purple-500/20'
                                }`}
                              >
                                {user.role === 'admin' ? 'Rétrograder' : 'Promouvoir'}
                              </button>
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr>
                          <td colSpan={7} className="p-12 text-center text-slate-500">
                            <Users size={48} className="mx-auto mb-4 opacity-30" />
                            <p className="font-bold">Aucun utilisateur trouvé</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ===== MY ACCOUNT TAB ===== */}
          {activeTab === 'my-account' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <UserCog className="text-[#00ADEF]" /> Mon Compte
              </h2>

              {/* Message de feedback */}
              {adminProfileMessage && (
                <div className={`p-4 rounded-2xl font-bold ${
                  adminProfileMessage.type === 'success' 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {adminProfileMessage.text}
                </div>
              )}

              {/* Informations du profil */}
              <div className="bg-slate-800/50 rounded-3xl border border-slate-700 p-6 space-y-6">
                <h3 className="text-lg font-black flex items-center gap-2">
                  <Users size={18} className="text-cyan-400" /> Informations personnelles
                </h3>

                {/* Email (non modifiable) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Mail size={14} /> Email
                  </label>
                  <div className="bg-slate-900/50 border border-slate-700 rounded-2xl px-5 py-4 text-slate-400 font-medium">
                    {currentProfile?.email || 'Non défini'}
                  </div>
                </div>

                {/* Nom */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nom complet</label>
                  {isEditingAdminProfile ? (
                    <input
                      type="text"
                      value={adminProfileForm.full_name}
                      onChange={(e) => setAdminProfileForm({ ...adminProfileForm, full_name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-600 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-[#00ADEF]"
                      placeholder="Votre nom"
                    />
                  ) : (
                    <div className="bg-slate-900/50 border border-slate-700 rounded-2xl px-5 py-4 text-white font-medium">
                      {currentProfile?.full_name || 'Non défini'}
                    </div>
                  )}
                </div>

                {/* Téléphone */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Phone size={14} /> Téléphone
                  </label>
                  {isEditingAdminProfile ? (
                    <input
                      type="tel"
                      value={adminProfileForm.phone}
                      onChange={(e) => setAdminProfileForm({ ...adminProfileForm, phone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-600 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-[#00ADEF]"
                      placeholder="Ex: 90 12 34 56"
                    />
                  ) : (
                    <div className="bg-slate-900/50 border border-slate-700 rounded-2xl px-5 py-4 text-white font-medium">
                      {currentProfile?.phone || 'Non défini'}
                    </div>
                  )}
                </div>

                {/* Boutons */}
                <div className="flex gap-3 pt-4">
                  {isEditingAdminProfile ? (
                    <>
                      <button
                        onClick={() => { setIsEditingAdminProfile(false); setAdminProfileMessage(null); }}
                        className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleSaveAdminProfile}
                        disabled={isSavingAdminProfile}
                        className="flex-1 px-6 py-3 bg-[#00ADEF] hover:bg-blue-600 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                      >
                        {isSavingAdminProfile ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Enregistrer
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditingAdminProfile(true)}
                      className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold flex items-center gap-2 transition-colors"
                    >
                      <Edit2 size={18} /> Modifier
                    </button>
                  )}
                </div>
              </div>

              {/* Changement de mot de passe */}
              <div className="bg-slate-800/50 rounded-3xl border border-slate-700 p-6 space-y-6">
                <h3 className="text-lg font-black flex items-center gap-2">
                  <Lock size={18} className="text-purple-400" /> Changer le mot de passe
                </h3>

                {isChangingAdminPassword ? (
                  <div className="space-y-4">
                    {/* Nouveau mot de passe */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nouveau mot de passe</label>
                      <div className="relative">
                        <input
                          type={showAdminPasswords.new ? 'text' : 'password'}
                          value={adminPasswordForm.newPassword}
                          onChange={(e) => setAdminPasswordForm({ ...adminPasswordForm, newPassword: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-600 rounded-2xl px-5 py-4 pr-12 text-white font-bold outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Minimum 6 caractères"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAdminPasswords({ ...showAdminPasswords, new: !showAdminPasswords.new })}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                        >
                          {showAdminPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirmer */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirmer le mot de passe</label>
                      <div className="relative">
                        <input
                          type={showAdminPasswords.confirm ? 'text' : 'password'}
                          value={adminPasswordForm.confirmPassword}
                          onChange={(e) => setAdminPasswordForm({ ...adminPasswordForm, confirmPassword: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-600 rounded-2xl px-5 py-4 pr-12 text-white font-bold outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Répéter le mot de passe"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAdminPasswords({ ...showAdminPasswords, confirm: !showAdminPasswords.confirm })}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                        >
                          {showAdminPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Boutons */}
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => { 
                          setIsChangingAdminPassword(false); 
                          setAdminPasswordForm({ newPassword: '', confirmPassword: '' });
                          setAdminProfileMessage(null);
                        }}
                        className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleChangeAdminPassword}
                        disabled={isSavingAdminProfile || !adminPasswordForm.newPassword || !adminPasswordForm.confirmPassword}
                        className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                      >
                        {isSavingAdminProfile ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
                        Changer
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsChangingAdminPassword(true)}
                    className="px-6 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-xl font-bold flex items-center gap-2 transition-colors border border-purple-500/30"
                  >
                    <Lock size={18} /> Changer le mot de passe
                  </button>
                )}
              </div>

              {/* Rôle */}
              <div className="bg-slate-800/50 rounded-3xl border border-slate-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black flex items-center gap-2 mb-1">
                      <ShieldCheck size={18} className="text-amber-400" /> Rôle
                    </h3>
                    <p className="text-sm text-slate-500">Votre niveau d&apos;accès dans l&apos;application</p>
                  </div>
                  <span className="px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 rounded-full font-black text-sm border border-amber-500/30">
                    Administrateur
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ===== ORDER DETAILS MODAL ===== */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-fade-in">
          <div className="bg-[#1e293b] p-8 lg:p-12 rounded-[3.5rem] w-full max-w-4xl border border-slate-700 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-3xl font-black text-white">
                Commande <span className="text-[#00ADEF]">#{selectedOrder.id.substring(0, 8).toUpperCase()}</span>
              </h3>
              <button onClick={() => setSelectedOrder(null)} className="p-4 bg-slate-800 rounded-2xl text-slate-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 mb-12">
              <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-700/50">
                <h4 className="text-[10px] font-black text-[#00ADEF] uppercase mb-4">Infos Client</h4>
                <div className="text-2xl font-black mb-4">{selectedOrder.full_name}</div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-slate-300 font-bold">
                    <Phone size={16} className="text-[#00ADEF]" /> {selectedOrder.phone}
                  </div>
                  <div className="flex items-center gap-3 text-slate-300 font-bold">
                    <MapPin size={16} className="text-[#00ADEF]" /> {selectedOrder.neighborhood}
                  </div>
                  <p className="text-sm text-slate-500 italic bg-black/20 p-5 rounded-2xl">{selectedOrder.address}</p>
                </div>
              </div>
              <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-700/50">
                <h4 className="text-[10px] font-black text-[#00ADEF] uppercase mb-4">Articles</h4>
                <div className="space-y-4 max-h-48 overflow-y-auto pr-2 mb-6">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-800/30 text-sm font-bold">
                      <span className="text-slate-300">{item.quantity}x {item.name}</span>
                      <span className="text-white">{(item.price * item.quantity).toLocaleString()} F</span>
                    </div>
                  ))}
                </div>
                <div className="pt-6 border-t border-slate-700 flex justify-between items-end">
                  <div className="text-xs font-black text-slate-600 uppercase">Total</div>
                  <div className="text-3xl font-black text-emerald-400">{selectedOrder.total.toLocaleString()} F</div>
                </div>
              </div>
            </div>

            {selectedOrder.status === 'En attente' && (
              <div className="mb-10">
                <h4 className="text-[10px] font-black text-[#00ADEF] uppercase mb-4">Assigner Livreur</h4>
                <select
                  value={selectedDriverId}
                  onChange={e => setSelectedDriverId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-5 text-sm font-bold text-white outline-none"
                >
                  <option value="">-- Choisir un livreur --</option>
                  {drivers.filter(d => d.status === 'Disponible').map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => setSelectedOrder(null)} className="flex-1 bg-slate-800 py-5 rounded-2xl font-black uppercase text-xs hover:bg-slate-700 transition-colors">
                Fermer
              </button>
              {selectedOrder.status === 'En attente' && (
                <button
                  disabled={!selectedDriverId || processingId === selectedOrder.id}
                  onClick={async () => {
                    await handleUpdateStatus(selectedOrder.id, 'Livraison en cours', selectedDriverId);
                    setSelectedOrder(null);
                  }}
                  className="flex-[2] bg-[#00ADEF] text-white py-5 rounded-2xl font-black uppercase text-xs disabled:opacity-50 hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  {processingId === selectedOrder.id && <Loader2 className="animate-spin" size={16} />}
                  Expédier
                </button>
              )}
              {selectedOrder.status === 'Livraison en cours' && (
                <button
                  disabled={processingId === selectedOrder.id}
                  onClick={async () => {
                    await handleUpdateStatus(selectedOrder.id, 'En attente de confirmation', selectedOrder.driver_id);
                    setSelectedOrder(null);
                  }}
                  className="flex-[2] bg-cyan-500 text-white py-5 rounded-2xl font-black uppercase text-xs disabled:opacity-50 hover:bg-cyan-600 transition-colors flex items-center justify-center gap-2"
                >
                  {processingId === selectedOrder.id && <Loader2 className="animate-spin" size={16} />}
                  Livreur Arrivé
                </button>
              )}
              {selectedOrder.status === 'En attente de confirmation' && (
                <button
                  disabled={processingId === selectedOrder.id}
                  onClick={async () => {
                    await handleUpdateStatus(selectedOrder.id, 'Livré', selectedOrder.driver_id);
                    setSelectedOrder(null);
                  }}
                  className="flex-[2] bg-emerald-500 text-white py-5 rounded-2xl font-black uppercase text-xs disabled:opacity-50 hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                >
                  {processingId === selectedOrder.id && <Loader2 className="animate-spin" size={16} />}
                  Confirmer Livraison (Admin)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== PRODUCT FORM MODAL ===== */}
      {(isAddingProduct || editingProduct) && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-fade-in overflow-y-auto">
          <div className="bg-[#1e293b] rounded-[3rem] w-full max-w-5xl border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 rounded-t-[3rem]">
              <div>
                <h3 className="text-3xl font-black text-white">{editingProduct ? 'Modifier le Produit' : 'Nouveau Produit'}</h3>
                <p className="text-slate-500 text-sm">Gérez les détails, le stock et l&apos;affichage.</p>
              </div>
              <button onClick={() => { setEditingProduct(null); setIsAddingProduct(false); }} className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-2xl transition-all">
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 lg:p-12">
              <div className="grid lg:grid-cols-12 gap-12">
                {/* Left: Image */}
                <div className="lg:col-span-4 space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <ImageIcon size={14} /> Aperçu Image
                    </label>
                    <div className="w-full aspect-square rounded-[2rem] bg-slate-900 border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden relative group shadow-inner">
                      {productFormData.imageUrl ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={productFormData.imageUrl} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="bg-white text-black px-3 py-1 rounded-full text-xs font-bold">Aperçu</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center text-slate-600 p-6">
                          <ImageIcon className="mx-auto mb-2 opacity-50" size={48} />
                          <span className="text-xs font-bold">Aucune image</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">URL de l&apos;image</label>
                    <div className="relative">
                      <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                      <input
                        type="text"
                        value={productFormData.imageUrl}
                        onChange={e => setProductFormData({ ...productFormData, imageUrl: e.target.value })}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl pl-12 pr-4 py-4 text-white text-sm font-medium outline-none focus:ring-2 focus:ring-[#00ADEF] transition-all"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  {/* Toggle */}
                  <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white mb-1">Disponibilité</div>
                      <div className="text-xs text-slate-500">Afficher sur la boutique</div>
                    </div>
                    <button
                      onClick={() => setProductFormData({ ...productFormData, inStock: !productFormData.inStock })}
                      className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 relative ${productFormData.inStock ? 'bg-emerald-500' : 'bg-slate-700'}`}
                    >
                      <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${productFormData.inStock ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>

                {/* Right: Form Fields */}
                <div className="lg:col-span-8 space-y-8">
                  <div className="space-y-6">
                    <h4 className="text-[#00ADEF] text-xs font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2 border-b border-slate-800 pb-2">
                      <AlignLeft size={16} /> Informations
                    </h4>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Nom du produit</label>
                        <input
                          type="text"
                          value={productFormData.name}
                          onChange={e => setProductFormData({ ...productFormData, name: e.target.value })}
                          className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-[#00ADEF]"
                          placeholder="Ex: Glaçons Premium"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Catégorie</label>
                        <div className="relative">
                          <select
                            value={productFormData.category}
                            onChange={e => setProductFormData({ ...productFormData, category: e.target.value })}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-[#00ADEF] appearance-none"
                          >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Description</label>
                      <textarea
                        rows={3}
                        value={productFormData.description}
                        onChange={e => setProductFormData({ ...productFormData, description: e.target.value })}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-5 py-4 text-white text-sm font-medium outline-none focus:ring-2 focus:ring-[#00ADEF] resize-none"
                        placeholder="Détails du produit..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-2">
                        <Tag size={12} /> Badge (Optionnel)
                      </label>
                      <input
                        type="text"
                        value={productFormData.tag || ''}
                        onChange={e => setProductFormData({ ...productFormData, tag: e.target.value })}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-[#00ADEF]"
                        placeholder="Ex: Populaire, Promo, Nouveau..."
                      />
                    </div>
                  </div>

                  <div className="space-y-6 pt-6">
                    <h4 className="text-[#00ADEF] text-xs font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2 border-b border-slate-800 pb-2">
                      <Scale size={16} /> Tarification & Stock
                    </h4>

                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Prix (FCFA)</label>
                        <div className="relative">
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">F</span>
                          <input
                            type="number"
                            value={productFormData.price}
                            onChange={e => setProductFormData({ ...productFormData, price: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl pl-10 pr-4 py-4 text-emerald-400 font-black text-lg outline-none focus:ring-2 focus:ring-[#00ADEF]"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Unité</label>
                        <div className="relative">
                          <select
                            value={productFormData.unit}
                            onChange={e => setProductFormData({ ...productFormData, unit: e.target.value })}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-[#00ADEF] appearance-none"
                          >
                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Quantité Stock</label>
                        <div className="relative">
                          <PackagesIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                          <input
                            type="number"
                            value={productFormData.stock_quantity}
                            onChange={e => setProductFormData({ ...productFormData, stock_quantity: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl pl-12 pr-4 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-[#00ADEF]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-slate-800 bg-slate-900/50 rounded-b-[3rem] flex items-center justify-end gap-4">
              <button
                onClick={() => { setEditingProduct(null); setIsAddingProduct(false); }}
                className="px-8 py-4 rounded-2xl text-slate-400 font-bold hover:bg-slate-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveProduct}
                className="bg-[#00ADEF] hover:bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-lg flex items-center gap-3 shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <Save size={20} />
                {editingProduct ? 'Mettre à jour' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== ADD DRIVER MODAL ===== */}
      {isAddingDriver && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
          <div className="bg-[#1e293b] p-8 rounded-[3rem] w-full max-w-md border border-slate-700 shadow-2xl">
            <h3 className="text-2xl font-black text-white mb-8">Nouveau Livreur</h3>
            <div className="space-y-6 mb-10">
              <input
                type="text"
                value={newDriver.name}
                onChange={e => setNewDriver({ ...newDriver, name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-[#00ADEF]"
                placeholder="Nom du livreur"
              />
              <input
                type="tel"
                value={newDriver.phone}
                onChange={e => setNewDriver({ ...newDriver, phone: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-[#00ADEF]"
                placeholder="Téléphone"
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setIsAddingDriver(false)}
                disabled={isSavingDriver}
                className="flex-1 text-slate-400 font-bold uppercase text-[10px] hover:text-white transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleAddDriver}
                disabled={isSavingDriver}
                className="flex-[2] bg-[#00ADEF] text-white py-4 rounded-2xl font-black text-sm uppercase hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSavingDriver ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Enregistrement...
                  </>
                ) : (
                  'Valider'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== EDIT DRIVER MODAL ===== */}
      {editingDriver && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
          <div className="bg-[#1e293b] p-8 rounded-[3rem] w-full max-w-md border border-slate-700 shadow-2xl">
            <h3 className="text-2xl font-black text-white mb-8">Modifier le Livreur</h3>
            <div className="space-y-6 mb-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Nom</label>
                <input
                  type="text"
                  value={newDriver.name}
                  onChange={e => setNewDriver({ ...newDriver, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-[#00ADEF]"
                  placeholder="Nom du livreur"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Téléphone</label>
                <input
                  type="tel"
                  value={newDriver.phone}
                  onChange={e => setNewDriver({ ...newDriver, phone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-[#00ADEF]"
                  placeholder="Téléphone"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => { setEditingDriver(null); setNewDriver({ name: '', phone: '' }); }}
                className="flex-1 px-4 py-3 bg-slate-800 text-slate-400 font-bold rounded-xl hover:text-white transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveDriver}
                className="flex-[2] bg-[#00ADEF] text-white py-4 rounded-2xl font-black text-sm uppercase hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <Save size={16} /> Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 px-2 py-2 safe-area-inset-bottom">
        <div className="flex items-center justify-around">
          {[
            { id: 'overview', icon: <Home size={20} />, label: 'Accueil' },
            { id: 'orders', icon: <ShoppingBag size={20} />, label: 'Commandes', badge: pendingCount },
            { id: 'map', icon: <Map size={20} />, label: 'Carte' },
            { id: 'products', icon: <Package size={20} />, label: 'Produits', badge: lowStockProducts.length },
            { id: 'drivers', icon: <Truck size={20} />, label: 'Livreurs' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={`relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all min-w-[60px] ${
                activeTab === item.id 
                  ? 'text-[#00ADEF] bg-[#00ADEF]/10' 
                  : 'text-slate-500'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-bold">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1 right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
