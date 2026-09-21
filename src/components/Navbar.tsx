import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import BrandLogo from './BrandLogo';
import SmartLink from './SmartLink';
import { useSiteContent } from '../hooks/useSiteContent';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { content } = useSiteContent();

  // Items without a label or link are hidden; the admin can fill them in later.
  const menu = content.nav.menu.filter((item) => item.label && item.url);

  const showMemberButton = Boolean(content.nav.memberLabel && content.nav.memberUrl);

  const isActive = (url: string) => {
    if (/^(https?:\/\/|mailto:|tel:)/i.test(url)) return false;
    const [path, hash] = url.split('#');
    const targetPath = path || '/';
    if (hash) return targetPath === location.pathname && location.hash === `#${hash}`;
    return targetPath === location.pathname && !location.hash;
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center group transition-transform hover:opacity-90 active:scale-98">
              <BrandLogo iconSize={56} textColor="text-slate-900" showTagline />
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center space-x-1 xl:space-x-2">
            {menu.map((item) => (
              <SmartLink
                key={item.label + item.url}
                to={item.url}
                className={`px-4 py-2 rounded-xl text-base font-bold transition-colors ${
                  isActive(item.url)
                    ? 'text-amber-600 bg-amber-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </SmartLink>
            ))}
            {showMemberButton && (
              <div className="pl-4">
                <SmartLink
                  to={content.nav.memberUrl}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-md shadow-orange-500/20 transition-all hover:shadow-lg active:scale-95"
                >
                  {content.nav.memberLabel}
                </SmartLink>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="lg:hidden border-b border-slate-100 bg-white px-4 pt-2 pb-6 space-y-2">
          {menu.map((item) => (
            <SmartLink
              key={item.label + item.url}
              to={item.url}
              onClick={() => setIsOpen(false)}
              className={`block px-4 py-3 rounded-xl text-base font-bold ${
                isActive(item.url) ? 'text-amber-600 bg-amber-50' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </SmartLink>
          ))}
          {showMemberButton && (
            <div className="pt-2">
              <SmartLink
                to={content.nav.memberUrl}
                onClick={() => setIsOpen(false)}
                className="block text-center w-full px-5 py-3 rounded-xl text-base font-bold text-white bg-linear-to-r from-amber-500 to-orange-500 shadow-md shadow-orange-500/20"
              >
                {content.nav.memberLabel}
              </SmartLink>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
