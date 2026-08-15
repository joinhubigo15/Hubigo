"use client";

import Link from "next/link";

export default function DirectoryFooterSection() {
  return (
    <footer className="bg-white border-t border-slate-200/80 mt-8 shrink-0">
      {/* Directory Links */}
      <div className="px-4 lg:px-8 py-10 max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8 max-w-4xl mx-auto text-center lg:text-left">
          {/* Company & Legal */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Company & Legal
            </h3>
            <ul className="space-y-2 text-xs font-semibold text-slate-500 flex flex-col lg:flex-row gap-2 lg:gap-6">
              <li>
                <Link href="/about" className="hover:text-purple-600 transition-colors">
                  About Hubigo
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-purple-600 transition-colors">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link href="/terms#lead-sharing" className="hover:text-purple-600 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-purple-600 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Media Links */}
          <div className="space-y-3 pt-2 lg:pt-0">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Follow Us
            </h3>
            <div className="flex items-center justify-center lg:justify-start gap-2">
              {[
                {
                  name: "Facebook",
                  href: "https://www.facebook.com/share/1Eh2JNCF6F/?mibextid=wwXIfr",
                  path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
                  stroke: false,
                },
                {
                  name: "X",
                  href: "https://x.com/hubigobiz?s=11",
                  path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
                  stroke: false,
                },
                {
                  name: "LinkedIn",
                  href: "https://www.linkedin.com/in/hubigo-biz-9a6aa0428?utm_source=share_via&utm_content=profile&utm_medium=member_ios",
                  path: "M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z",
                  stroke: false,
                },
                {
                  name: "Instagram",
                  href: "https://www.instagram.com/hubigobiz?igsh=eTJmZTUzdnQ5OTJ1&utm_source=qr",
                  path: "M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zM6.5 2h11A4.5 4.5 0 0122 6.5v11a4.5 4.5 0 01-4.5 4.5h-11A4.5 4.5 0 012 17.5v-11A4.5 4.5 0 016.5 2z",
                  stroke: true,
                },
              ].map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 hover:text-purple-600 hover:bg-purple-50 flex items-center justify-center transition-colors shadow-xs"
                >
                  <svg
                    className={s.stroke ? "w-4 h-4 fill-none stroke-current" : "w-4 h-4 fill-current"}
                    strokeWidth={s.stroke ? 2 : undefined}
                    viewBox="0 0 24 24"
                  >
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="border-t border-slate-100 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-semibold gap-2">
          <span>© 2026 HUBIGO Inc. All rights reserved.</span>
          <span>Made with ❤️ for Local Businesses in India</span>
        </div>
      </div>
    </footer>
  );
}
