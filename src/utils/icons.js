/**
 * AgroTrack - Unified Inline SVG Iconography
 * Uniform 24x24 grid, stroke-width 2, aria-hidden="true".
 */

function svg(pathMarkup, cls = 'w-4 h-4 shrink-0') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${cls}" aria-hidden="true">${pathMarkup}</svg>`;
}

export const Icons = {
  tractor(cls = 'w-5 h-5 shrink-0') {
    return svg(
      '<path d="m10 11 11 .9c.6 0 .9.5.8 1.1l-.8 5h-1"/><path d="M16 18h-5"/><path d="M18 5a1 1 0 0 0-1 1v5.573"/><path d="M3 4h9l1 7.246"/><path d="M4 11V4"/><path d="M7 15h.01"/><path d="M8 10.1V4"/><circle cx="18" cy="18" r="2"/><circle cx="7" cy="15" r="5"/>',
      cls
    );
  },
  dashboard(cls = 'w-4 h-4 shrink-0') {
    return svg('<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>', cls);
  },
  clipboard(cls = 'w-4 h-4 shrink-0') {
    return svg('<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>', cls);
  },
  cloudSun(cls = 'w-4 h-4 shrink-0') {
    return svg('<path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"/><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"/>', cls);
  },
  sprout(cls = 'w-4 h-4 shrink-0') {
    return svg('<path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>', cls);
  },
  wrench(cls = 'w-4 h-4 shrink-0') {
    return svg('<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>', cls);
  },
  receipt(cls = 'w-4 h-4 shrink-0') {
    return svg('<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>', cls);
  },
  moon(cls = 'w-4 h-4 shrink-0') {
    return svg('<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>', cls);
  },
  sun(cls = 'w-4 h-4 shrink-0') {
    return svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>', cls);
  },
  lock(cls = 'w-3.5 h-3.5 shrink-0') {
    return svg('<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>', cls);
  },
  pen(cls = 'w-4 h-4 shrink-0') {
    return svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>', cls);
  },
  download(cls = 'w-4 h-4 shrink-0') {
    return svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>', cls);
  },
  message(cls = 'w-4 h-4 shrink-0') {
    return svg('<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>', cls);
  },
  gauge(cls = 'w-4 h-4 shrink-0') {
    return svg('<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>', cls);
  },
  checkCircle(cls = 'w-4 h-4 shrink-0') {
    return svg('<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>', cls);
  },
  alertTriangle(cls = 'w-4 h-4 shrink-0') {
    return svg('<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>', cls);
  },
  octagonAlert(cls = 'w-4 h-4 shrink-0') {
    return svg('<polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>', cls);
  },
  droplet(cls = 'w-4 h-4 shrink-0') {
    return svg('<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>', cls);
  },
  plus(cls = 'w-4 h-4 shrink-0') {
    return svg('<path d="M5 12h14"/><path d="M12 5v14"/>', cls);
  },
  trash(cls = 'w-4 h-4 shrink-0') {
    return svg('<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>', cls);
  },
  x(cls = 'w-5 h-5 shrink-0') {
    return svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', cls);
  }
};
