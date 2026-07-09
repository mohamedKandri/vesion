import { Navbar } from '@/components/marketing/navbar';
import { Footer } from '@/components/marketing/footer';
import { ChatWidget } from '@/components/chat/chat-widget';
import { SmoothScroll } from '@/components/marketing/smooth-scroll';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScroll>
      <div className="flex min-h-screen flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to main content
        </a>
        <Navbar />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
        <ChatWidget />
      </div>
    </SmoothScroll>
  );
}
