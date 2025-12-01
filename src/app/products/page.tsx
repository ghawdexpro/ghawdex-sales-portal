'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

// Product types
type Category = 'solar' | 'battery' | 'bundle' | 'addon';
type HomeSize = 'apartment' | 'small' | 'medium' | 'large' | 'villa';

interface Product {
  id: string;
  name: string;
  category: Category;
  price: number;
  description: string;
  specs: Record<string, string>;
  bestFor: string[];
  homeSize?: HomeSize[];
  annualProduction?: number;
  annualIncome?: number;
  savings?: string;
  popular?: boolean;
}

// Product data - 4 standard packages (custom quotes for other sizes)
const PRODUCTS: Product[] = [
  // Solar Systems - 4 Standard Options
  {
    id: 'solar-3kw',
    name: '3 kWp Solar System',
    category: 'solar',
    price: 3500,
    description: 'Perfect for apartments and small homes with low consumption',
    specs: {
      'System Size': '3 kWp',
      'Panels': '7 panels (430W)',
      'Roof Area': '~14 m²',
      'Phase': 'Single-phase',
    },
    annualProduction: 4500,
    annualIncome: 675,
    bestFor: ['Apartments', 'Small homes', 'Low consumption'],
    homeSize: ['apartment', 'small'],
  },
  {
    id: 'solar-5kw',
    name: '5 kWp Solar System',
    category: 'solar',
    price: 5500,
    description: 'Most popular single-phase system for average homes',
    specs: {
      'System Size': '5 kWp',
      'Panels': '11 panels (455W)',
      'Roof Area': '~22 m²',
      'Phase': 'Single-phase',
    },
    annualProduction: 7500,
    annualIncome: 1125,
    bestFor: ['Average homes', 'Single-phase', 'Best value'],
    homeSize: ['small', 'medium'],
    popular: true,
  },
  {
    id: 'solar-10kw',
    name: '10 kWp Solar System',
    category: 'solar',
    price: 9500,
    description: 'Popular three-phase system for large homes',
    specs: {
      'System Size': '10 kWp',
      'Panels': '22 panels (455W)',
      'Roof Area': '~44 m²',
      'Phase': 'Three-phase',
    },
    annualProduction: 15000,
    annualIncome: 2250,
    bestFor: ['Large homes', 'High consumption', 'Three-phase'],
    homeSize: ['large'],
    popular: true,
  },
  {
    id: 'solar-15kw',
    name: '15 kWp Solar System',
    category: 'solar',
    price: 13500,
    description: 'Premium system for villas and farmhouses',
    specs: {
      'System Size': '15 kWp',
      'Panels': '33 panels (455W)',
      'Roof Area': '~66 m²',
      'Phase': 'Three-phase',
    },
    annualProduction: 22500,
    annualIncome: 3375,
    bestFor: ['Villas', 'Farmhouses', 'Multiple A/C'],
    homeSize: ['large', 'villa'],
  },
  // Batteries
  {
    id: 'battery-5kwh',
    name: '5 kWh Battery',
    category: 'battery',
    price: 5000,
    description: 'Entry-level storage for small systems',
    specs: {
      'Capacity': '5 kWh',
      'Technology': 'LFP (Safest)',
      'Cycles': '6,000+',
      'Warranty': '10 years',
    },
    savings: '+20-30% self-consumption',
    bestFor: ['5-6 kWp systems', 'Basic backup'],
  },
  {
    id: 'battery-10kwh',
    name: '10 kWh Battery',
    category: 'battery',
    price: 10000,
    description: 'Most popular choice for average homes',
    specs: {
      'Capacity': '10 kWh',
      'Technology': 'LFP (Safest)',
      'Cycles': '6,000+',
      'Warranty': '10 years',
    },
    savings: '+35-45% self-consumption',
    bestFor: ['8-12 kWp systems', 'Evening coverage'],
    popular: true,
  },
  {
    id: 'battery-15kwh',
    name: '15 kWh Battery',
    category: 'battery',
    price: 15000,
    description: 'High capacity for large systems',
    specs: {
      'Capacity': '15 kWh',
      'Technology': 'LFP (Safest)',
      'Cycles': '6,000+',
      'Warranty': '10 years',
    },
    savings: '+45-55% self-consumption',
    bestFor: ['12-15 kWp systems', 'High independence'],
  },
  {
    id: 'battery-20kwh',
    name: '20 kWh Battery',
    category: 'battery',
    price: 20000,
    description: 'Premium storage for energy independence',
    specs: {
      'Capacity': '20 kWh',
      'Technology': 'LFP (Safest)',
      'Cycles': '6,000+',
      'Warranty': '10 years',
    },
    savings: '+55-65% self-consumption',
    bestFor: ['15-20 kWp systems', 'Near independence'],
  },
  {
    id: 'battery-30kwh',
    name: '30 kWh Battery',
    category: 'battery',
    price: 30000,
    description: 'Maximum storage for complete independence',
    specs: {
      'Capacity': '30 kWh',
      'Technology': 'LFP (Safest)',
      'Cycles': '6,000+',
      'Warranty': '10 years',
    },
    savings: '+70-80% self-consumption',
    bestFor: ['20 kWp systems', 'Complete independence'],
  },
  // Bundles - matching standard packages
  {
    id: 'bundle-starter',
    name: 'Home Starter Bundle',
    category: 'bundle',
    price: 9000,
    description: '5 kWp + 5 kWh battery + EMS - Save €1,500',
    specs: {
      'PV System': '5 kWp',
      'Battery': '5 kWh',
      'EMS': 'Standard',
      'You Save': '€1,500',
    },
    annualProduction: 7500,
    savings: '~70% self-consumption',
    bestFor: ['Single-phase homes', 'Best value'],
    homeSize: ['apartment', 'small', 'medium'],
    popular: true,
  },
  {
    id: 'bundle-standard',
    name: 'Home Standard Bundle',
    category: 'bundle',
    price: 18000,
    description: '10 kWp + 10 kWh battery + EMS - Save €2,500',
    specs: {
      'PV System': '10 kWp',
      'Battery': '10 kWh',
      'EMS': 'Standard',
      'You Save': '€2,500',
    },
    annualProduction: 15000,
    savings: '~75% self-consumption',
    bestFor: ['Large homes', 'High consumption'],
    homeSize: ['large'],
    popular: true,
  },
  {
    id: 'bundle-premium',
    name: 'Home Premium Bundle',
    category: 'bundle',
    price: 26000,
    description: '15 kWp + 15 kWh battery + Premium EMS - Save €3,500',
    specs: {
      'PV System': '15 kWp',
      'Battery': '15 kWh',
      'EMS': 'Premium',
      'You Save': '€3,500',
    },
    annualProduction: 22500,
    savings: '~80% self-consumption',
    bestFor: ['Villas', 'Energy independence'],
    homeSize: ['large', 'villa'],
  },
  // Add-ons
  {
    id: 'ems-standard',
    name: 'Standard EMS',
    category: 'addon',
    price: 1000,
    description: 'Energy Management System - Monitoring + basic optimization',
    specs: {
      'Features': 'Real-time monitoring',
      'Optimization': 'Basic',
      'App Control': 'Yes',
      'Savings Impact': 'Up to 20%',
    },
    bestFor: ['All systems', 'Basic monitoring'],
  },
  {
    id: 'ems-premium',
    name: 'Premium EMS',
    category: 'addon',
    price: 2000,
    description: 'Full optimization + smart home integration',
    specs: {
      'Features': 'Full monitoring suite',
      'Optimization': 'Advanced AI',
      'Smart Home': 'Full integration',
      'Savings Impact': 'Up to 30%',
    },
    bestFor: ['Large systems', 'Smart home owners'],
    popular: true,
  },
  {
    id: 'custom-frame',
    name: 'Custom Roof Frame',
    category: 'addon',
    price: 750,
    description: 'Reinforced mounting for weak or old roofs',
    specs: {
      'Type': 'Custom structure',
      'Material': 'Marine-grade aluminum',
      'Warranty': '25 years',
    },
    bestFor: ['Old buildings', 'Weak roofs'],
  },
  {
    id: 'ballasted',
    name: 'Ballasted Installation',
    category: 'addon',
    price: 750,
    description: 'No-drill mounting for flat roofs',
    specs: {
      'Type': 'Weighted blocks',
      'Penetration': 'None',
      'Suitable For': 'Flat roofs',
    },
    bestFor: ['Flat roofs', 'No waterproofing concerns'],
  },
];

const CATEGORIES: { value: Category | 'all'; label: string; icon: string }[] = [
  { value: 'all', label: 'All Products', icon: '🏠' },
  { value: 'solar', label: 'Solar Systems', icon: '☀️' },
  { value: 'battery', label: 'Batteries', icon: '🔋' },
  { value: 'bundle', label: 'Bundles', icon: '📦' },
  { value: 'addon', label: 'Add-ons', icon: '⚡' },
];

const HOME_SIZES: { value: HomeSize | 'all'; label: string; description: string }[] = [
  { value: 'all', label: 'Any Size', description: 'Show all' },
  { value: 'apartment', label: 'Apartment', description: 'Small space' },
  { value: 'small', label: 'Small Home', description: '1-2 bedrooms' },
  { value: 'medium', label: 'Medium Home', description: '3 bedrooms' },
  { value: 'large', label: 'Large Home', description: '4+ bedrooms' },
  { value: 'villa', label: 'Villa', description: 'Large property' },
];

const BUDGET_RANGES = [
  { value: 'all', label: 'Any Budget', min: 0, max: Infinity },
  { value: 'under-5k', label: 'Under €5,000', min: 0, max: 5000 },
  { value: '5k-10k', label: '€5,000 - €10,000', min: 5000, max: 10000 },
  { value: '10k-20k', label: '€10,000 - €20,000', min: 10000, max: 20000 },
  { value: 'over-20k', label: 'Over €20,000', min: 20000, max: Infinity },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-MT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function ProductCard({ product }: { product: Product }) {
  return (
    <div className={`bg-white/5 border rounded-2xl p-5 transition-all hover:border-amber-500/50 hover:bg-white/10 ${
      product.popular ? 'border-amber-500/30 ring-1 ring-amber-500/20' : 'border-white/10'
    }`}>
      {product.popular && (
        <div className="inline-block bg-amber-500 text-black text-xs font-semibold px-2 py-1 rounded-full mb-3">
          Popular
        </div>
      )}

      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-white font-semibold text-lg">{product.name}</h3>
        <div className="text-amber-400 font-bold text-lg whitespace-nowrap">
          {formatCurrency(product.price)}
        </div>
      </div>

      <p className="text-gray-400 text-sm mb-4">{product.description}</p>

      {/* Key specs */}
      <div className="space-y-2 mb-4">
        {Object.entries(product.specs).slice(0, 3).map(([key, value]) => (
          <div key={key} className="flex justify-between text-sm">
            <span className="text-gray-500">{key}</span>
            <span className="text-white">{value}</span>
          </div>
        ))}
      </div>

      {/* Highlights */}
      {(product.annualIncome || product.savings) && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-4">
          {product.annualIncome && (
            <div className="flex justify-between text-sm">
              <span className="text-green-400">Annual Income</span>
              <span className="text-green-400 font-semibold">{formatCurrency(product.annualIncome)}</span>
            </div>
          )}
          {product.savings && (
            <div className="text-green-400 text-sm">{product.savings}</div>
          )}
        </div>
      )}

      {/* Best for tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {product.bestFor.slice(0, 3).map((tag) => (
          <span key={tag} className="bg-white/10 text-gray-300 text-xs px-2 py-1 rounded-full">
            {tag}
          </span>
        ))}
      </div>

      <Link
        href="/"
        className="block w-full text-center bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold py-3 rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all"
      >
        Get Quote
      </Link>
    </div>
  );
}

export default function ProductsPage() {
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [homeSize, setHomeSize] = useState<HomeSize | 'all'>('all');
  const [budget, setBudget] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((product) => {
      // Category filter
      if (category !== 'all' && product.category !== category) return false;

      // Home size filter
      if (homeSize !== 'all') {
        if (!product.homeSize || !product.homeSize.includes(homeSize)) return false;
      }

      // Budget filter
      const budgetRange = BUDGET_RANGES.find((b) => b.value === budget);
      if (budgetRange && budget !== 'all') {
        if (product.price < budgetRange.min || product.price > budgetRange.max) return false;
      }

      return true;
    });
  }, [category, homeSize, budget]);

  const activeFiltersCount = [
    category !== 'all',
    homeSize !== 'all',
    budget !== 'all',
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#1a1a2e]">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">GhawdeX</span>
          </Link>

          <Link
            href="/"
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold px-4 py-2 rounded-full text-sm hover:shadow-lg hover:shadow-amber-500/25 transition-all"
          >
            Get Free Quote
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Page title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Our Products
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Explore our complete range of solar systems, batteries, and energy solutions.
            All products include professional installation and 10-year warranty.
          </p>
        </div>

        {/* Category tabs - always visible */}
        <div className="flex overflow-x-auto gap-2 pb-4 mb-4 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all ${
                category === cat.value
                  ? 'bg-amber-500 text-black font-semibold'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Filter toggle for mobile */}
        <div className="sm:hidden mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3"
          >
            <span className="text-white font-medium">
              Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </span>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${showFilters ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className={`grid sm:grid-cols-2 gap-4 mb-6 ${showFilters ? 'block' : 'hidden sm:grid'}`}>
          {/* Home size filter */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <label className="block text-sm font-medium text-gray-300 mb-3">Home Size</label>
            <div className="flex flex-wrap gap-2">
              {HOME_SIZES.map((size) => (
                <button
                  key={size.value}
                  onClick={() => setHomeSize(size.value)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    homeSize === size.value
                      ? 'bg-amber-500/20 border border-amber-500 text-amber-400'
                      : 'bg-white/5 border border-white/10 text-gray-400 hover:border-white/30'
                  }`}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>

          {/* Budget filter */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <label className="block text-sm font-medium text-gray-300 mb-3">Budget</label>
            <div className="flex flex-wrap gap-2">
              {BUDGET_RANGES.map((range) => (
                <button
                  key={range.value}
                  onClick={() => setBudget(range.value)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    budget === range.value
                      ? 'bg-amber-500/20 border border-amber-500 text-amber-400'
                      : 'bg-white/5 border border-white/10 text-gray-400 hover:border-white/30'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Clear filters */}
        {activeFiltersCount > 0 && (
          <button
            onClick={() => {
              setCategory('all');
              setHomeSize('all');
              setBudget('all');
            }}
            className="text-amber-400 text-sm mb-6 hover:underline"
          >
            Clear all filters
          </button>
        )}

        {/* Results count */}
        <div className="text-gray-400 text-sm mb-4">
          Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
        </div>

        {/* Product grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-white text-xl font-semibold mb-2">No products found</h3>
            <p className="text-gray-400 mb-4">Try adjusting your filters</p>
            <button
              onClick={() => {
                setCategory('all');
                setHomeSize('all');
                setBudget('all');
              }}
              className="text-amber-400 hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            Not sure which system is right for you?
          </h2>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto">
            Get a personalized recommendation based on your roof, consumption, and goals.
            Our AI-powered wizard will find the perfect solution for you.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold px-6 py-3 rounded-full hover:shadow-lg hover:shadow-amber-500/25 transition-all"
          >
            <span>Get Personalized Quote</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-16 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>GhawdeX Engineering - Malta&apos;s Solar Experts</p>
          <p className="mt-2">All prices in EUR. Prices valid for 30 days. Actual pricing may vary based on site assessment.</p>
        </div>
      </footer>
    </div>
  );
}
