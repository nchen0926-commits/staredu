import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import PhysicalCourses from './pages/PhysicalCourses';
import OnlineCourses from './pages/OnlineCourses';
import Admin from './pages/Admin';
import Success from './pages/Success';
import ContentPage from './pages/ContentPage';
import Articles from './pages/Articles';
import ArticleDetail from './pages/ArticleDetail';
import LeadCapturePopup from './components/LeadCapturePopup';
import Analytics from './components/Analytics';

function ScrollToHash() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const id = decodeURIComponent(hash.slice(1));
    let tries = 0;
    // The target may render only after site content has loaded, so retry briefly.
    const timer = setInterval(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        clearInterval(timer);
      } else if (++tries >= 30) {
        clearInterval(timer);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToHash />
      <Analytics />
      <div className="min-h-screen flex flex-col font-sans bg-slate-50">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/physical-courses" element={<PhysicalCourses />} />
            <Route path="/online-courses" element={<OnlineCourses />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/success" element={<Success />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/articles/:id" element={<ArticleDetail />} />
            <Route path="/terms" element={<ContentPage pageKey="terms" />} />
            <Route path="/privacy" element={<ContentPage pageKey="privacy" />} />
            <Route path="/faq" element={<ContentPage pageKey="faq" />} />
          </Routes>
        </main>
        <Footer />
        <LeadCapturePopup />
      </div>
    </BrowserRouter>
  );
}
