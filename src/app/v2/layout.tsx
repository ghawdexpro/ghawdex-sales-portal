import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GhawdeX Solar V2 | New Quote Experience',
  description: 'Experience our new streamlined solar quote wizard. Get your personalized quote in just 2 minutes.',
};

export default function V2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
