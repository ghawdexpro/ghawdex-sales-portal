'use client';

/**
 * Guarantee Section
 *
 * Displays risk-reversal guarantees to build trust.
 * Can be shown in compact (icons only) or full (with descriptions) mode.
 */

interface GuaranteeSectionProps {
  /** Show compact version (icons + titles only) */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

interface Guarantee {
  id: string;
  icon: string;
  title: string;
  description: string;
  highlight?: string;
}

const GUARANTEES: Guarantee[] = [
  {
    id: 'grant',
    icon: '🏆',
    title: 'Grant Approval Guarantee',
    description: 'If your REWS grant is not approved, we cover the difference. No extra cost to you.',
    highlight: 'We cover the difference',
  },
  {
    id: 'installation',
    icon: '⚡',
    title: '14-Day Installation',
    description: 'Professional installation within 14 days of contract signing, or EUR 50/day credit.',
    highlight: 'EUR 50/day if delayed',
  },
  {
    id: 'performance',
    icon: '📊',
    title: 'Performance Guarantee',
    description: 'If your system produces less than our estimate in year 1, we pay you the difference.',
    highlight: 'Up to 10% covered',
  },
  {
    id: 'warranty',
    icon: '🛡️',
    title: '25-Year Warranty',
    description: 'Comprehensive warranty on panels, inverter, and workmanship. Peace of mind for decades.',
    highlight: '25 years coverage',
  },
  {
    id: 'price',
    icon: '💰',
    title: 'Price Match Promise',
    description: 'Found a lower quote from a licensed installer? We\'ll match it or beat it by 5%.',
    highlight: 'Beat by 5%',
  },
];

export default function GuaranteeSection({
  compact = false,
  className = '',
}: GuaranteeSectionProps) {
  if (compact) {
    return (
      <div className={`flex flex-wrap justify-center gap-2 sm:gap-4 ${className}`}>
        {GUARANTEES.slice(0, 4).map((guarantee) => (
          <div
            key={guarantee.id}
            className="flex items-center gap-1 text-xs sm:text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded-full"
          >
            <span>{guarantee.icon}</span>
            <span className="hidden sm:inline">{guarantee.title.split(' ')[0]}</span>
            <span className="sm:hidden">{guarantee.icon}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Our Guarantees
        </h2>
        <p className="text-gray-600">
          We stand behind every installation with industry-leading guarantees
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {GUARANTEES.map((guarantee) => (
          <div
            key={guarantee.id}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className="text-3xl">{guarantee.icon}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {guarantee.title}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {guarantee.description}
                </p>
                {guarantee.highlight && (
                  <span className="inline-block text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                    {guarantee.highlight}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Compact guarantee badges for Step 6 summary
 */
export function GuaranteeBadges({ className = '' }: { className?: string }) {
  const badges = [
    { icon: '✓', text: '25-Year Warranty', color: 'green' },
    { icon: '✓', text: '14-Day Installation', color: 'green' },
    { icon: '✓', text: 'Grant Approved', color: 'green' },
    { icon: '✓', text: 'MRA Licensed', color: 'green' },
  ];

  return (
    <div className={`flex flex-wrap justify-center gap-2 ${className}`}>
      {badges.map((badge, i) => (
        <span
          key={i}
          className={`inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full ${
            badge.color === 'green'
              ? 'text-green-700 bg-green-100'
              : 'text-gray-700 bg-gray-100'
          }`}
        >
          {badge.icon} {badge.text}
        </span>
      ))}
    </div>
  );
}
