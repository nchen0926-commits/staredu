import { Facebook, Instagram, Youtube, Mail, Phone, MapPin, MessageCircle } from 'lucide-react';
import BrandLogo from './BrandLogo';
import SmartLink from './SmartLink';
import { useSiteContent } from '../hooks/useSiteContent';
import { lineLink } from '../../lib/siteContent';

export default function Footer() {
  const { content } = useSiteContent();
  const { footer } = content;
  const menuLinks = content.nav.menu.filter((item) => item.label && item.url);

  const lineHref = lineLink(footer.lineId);
  const lineText = /^https?:\/\//i.test(footer.lineId) ? '官方 LINE' : footer.lineId;

  const socialLinks = [
    { url: lineHref, label: 'LINE', Icon: MessageCircle },
    { url: footer.facebookUrl, label: 'Facebook', Icon: Facebook },
    { url: footer.instagramUrl, label: 'Instagram', Icon: Instagram },
    { url: footer.youtubeUrl, label: 'YouTube', Icon: Youtube },
  ].filter((item) => item.url);

  // 服務條款 / 隱私權政策 / 常見問題 link automatically once their page has content;
  // any extra links added in the admin show only when a URL is filled in.
  const pageLinks = (['terms', 'privacy', 'faq'] as const)
    .filter((key) => content.pages[key].body)
    .map((key) => ({ label: content.pages[key].title, url: `/${key}` }));
  const legalLinks = [...pageLinks, ...footer.legalLinks.filter((item) => item.label && item.url)];

  return (
    <footer className="bg-slate-900 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4 md:col-span-2">
            <BrandLogo iconSize={50} textColor="text-white" />
            <p className="text-slate-400 max-w-md leading-relaxed">{footer.description}</p>
            {socialLinks.length > 0 && (
              <div className="flex space-x-4 pt-2">
                {socialLinks.map(({ url, label, Icon }) => (
                  <SmartLink
                    key={label}
                    to={url}
                    aria-label={label}
                    className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </SmartLink>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">快速連結</h4>
            <ul className="space-y-2.5 font-medium">
              {menuLinks.map((item) => (
                <li key={item.label + item.url}>
                  <SmartLink to={item.url} className="hover:text-amber-400 transition-colors">{item.label}</SmartLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">聯絡我們</h4>
            <ul className="space-y-2.5 font-medium">
              {footer.email && (
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{footer.email}</span>
                </li>
              )}
              {footer.phone && (
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{footer.phone}</span>
                </li>
              )}
              {lineHref && (
                <li className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <SmartLink to={lineHref} className="hover:text-amber-400 transition-colors">LINE：{lineText}</SmartLink>
                </li>
              )}
              {footer.address && (
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{footer.address}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {footer.companyName || content.brand.name}. All rights reserved.</p>
          {legalLinks.length > 0 && (
            <div className="flex gap-6">
              {legalLinks.map((item) => (
                <SmartLink key={item.url + item.label} to={item.url} className="hover:text-slate-400">
                  {item.label}
                </SmartLink>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
