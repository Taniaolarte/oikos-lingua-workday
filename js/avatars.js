/* ============================================================
   OIKOS LINGUA — badge photo options
   A blank staff photo by default, plus a few characters to pick from.
   ============================================================ */
const AVATARS = {
  blank: { label: 'No photo', bg: '#D8E6F0', svg: `
    <rect width="60" height="72" fill="#D8E6F0"/>
    <circle cx="30" cy="27" r="11" fill="#A9BFD1"/>
    <path d="M9 68c0-12 9.5-19 21-19s21 7 21 19v4H9z" fill="#A9BFD1"/>` },

  owl: { label: 'Owl', bg: '#E4EBF2', svg: `
    <rect width="60" height="72" fill="#E4EBF2"/>
    <path d="M30 20c9 0 16 5 18 12l-4 3 4 4-3 4 3 4c0 12-8 20-18 20s-18-8-18-20l3-4-3-4 4-4-4-3c2-7 9-12 18-12z" fill="#1F3A56"/>
    <circle cx="23" cy="36" r="6" fill="#FFFDF9"/><circle cx="37" cy="36" r="6" fill="#FFFDF9"/>
    <circle cx="23" cy="36" r="2.8" fill="#1F3A56"/><circle cx="37" cy="36" r="2.8" fill="#1F3A56"/>
    <path d="M30 41l-3.4 4.6h6.8z" fill="#EB9D4A"/>
    <path d="M14 22c3-5 7-7 10-8-3 3-4 6-4 9M46 22c-3-5-7-7-10-8 3 3 4 6 4 9" stroke="#EB9D4A" stroke-width="2" fill="none" stroke-linecap="round"/>` },

  fox: { label: 'Fox', bg: '#FBEADA', svg: `
    <rect width="60" height="72" fill="#FBEADA"/>
    <path d="M14 24l3-11 10 7zM46 24l-3-11-10 7z" fill="#C47B26"/>
    <path d="M30 20c11 0 19 8 19 19 0 12-8 21-19 21s-19-9-19-21c0-11 8-19 19-19z" fill="#EB9D4A"/>
    <path d="M30 34c7 0 12 5 12 12 0 8-5 14-12 14s-12-6-12-14c0-7 5-12 12-12z" fill="#FFF6EC"/>
    <circle cx="23" cy="35" r="2.6" fill="#1F3A56"/><circle cx="37" cy="35" r="2.6" fill="#1F3A56"/>
    <path d="M30 45l-3 3 3 3 3-3z" fill="#1F3A56"/>` },

  cat: { label: 'Cat', bg: '#E8E4F0', svg: `
    <rect width="60" height="72" fill="#E8E4F0"/>
    <path d="M15 26l1-12 11 7zM45 26l-1-12-11 7z" fill="#5B5478"/>
    <ellipse cx="30" cy="42" rx="19" ry="18" fill="#6E6690"/>
    <circle cx="23" cy="39" r="3.4" fill="#FFFDF9"/><circle cx="37" cy="39" r="3.4" fill="#FFFDF9"/>
    <circle cx="23" cy="39" r="1.6" fill="#22303D"/><circle cx="37" cy="39" r="1.6" fill="#22303D"/>
    <path d="M30 47l-2.5 2.5 2.5 2 2.5-2z" fill="#EB9D4A"/>
    <path d="M12 46h8M12 51h8M40 46h8M40 51h8" stroke="#FFFDF9" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>` },

  bear: { label: 'Bear', bg: '#EFE6DC', svg: `
    <rect width="60" height="72" fill="#EFE6DC"/>
    <circle cx="16" cy="28" r="8" fill="#8A6A4F"/><circle cx="44" cy="28" r="8" fill="#8A6A4F"/>
    <circle cx="16" cy="28" r="4" fill="#C49B74"/><circle cx="44" cy="28" r="4" fill="#C49B74"/>
    <circle cx="30" cy="43" r="19" fill="#8A6A4F"/>
    <ellipse cx="30" cy="50" rx="10" ry="8" fill="#E5D3BE"/>
    <circle cx="23" cy="39" r="2.6" fill="#22303D"/><circle cx="37" cy="39" r="2.6" fill="#22303D"/>
    <ellipse cx="30" cy="47" rx="3.4" ry="2.6" fill="#22303D"/>` },

  deer: { label: 'Deer', bg: '#E2EFE6', svg: `
    <rect width="60" height="72" fill="#E2EFE6"/>
    <path d="M18 24c-2-6-6-8-8-14 4 1 6 4 8 6M42 24c2-6 6-8 8-14-4 1-6 4-8 6" stroke="#8A6A4F" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M18 20c-3-2-6-2-9-1M42 20c3-2 6-2 9-1" stroke="#8A6A4F" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <ellipse cx="30" cy="44" rx="16" ry="19" fill="#B08658"/>
    <ellipse cx="30" cy="52" rx="8" ry="9" fill="#E7D6BF"/>
    <circle cx="24" cy="40" r="2.6" fill="#22303D"/><circle cx="36" cy="40" r="2.6" fill="#22303D"/>
    <ellipse cx="30" cy="51" rx="3" ry="2.4" fill="#22303D"/>` }
};

const avatarSVG = (key, w = '100%', h = '100%') =>
  `<svg viewBox="0 0 60 72" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
     ${(AVATARS[key] || AVATARS.blank).svg}</svg>`;
