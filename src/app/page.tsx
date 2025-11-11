import Hero from '@/components/landing/Hero';
import CategoryWall from '@/components/landing/CategoryWall';
import HowItWorks from '@/components/landing/HowItWorks';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <CategoryWall />
      <HowItWorks />
    </main>
  );
}
