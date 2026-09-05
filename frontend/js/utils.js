import { icon } from './icons.js';

export function toast(msg, kind) {
  const el = document.createElement('div');
  el.className = 'toast';
  const color = kind === 'warn' ? 'var(--red)' : kind === 'ok' ? 'var(--green)' : 'var(--teal)';
  el.innerHTML = `<span style="color:${color}">${icon(kind === 'warn' ? 'warn' : kind === 'ok' ? 'check' : 'bolt')}</span><span>${msg}</span>`;
  const container = document.getElementById('toast-container');
  if (container) {
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transition = 'opacity .3s';
      setTimeout(() => el.remove(), 300);
    }, 3600);
  }
}

export function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function randomCoordNearIndore() {
  const base = { lat: 22.7196, lng: 75.8577 };
  return {
    lat: base.lat + (Math.random() - 0.5) * 0.09,
    lng: base.lng + (Math.random() - 0.5) * 0.09
  };
}

export function compressImage(file, maxDim = 1024, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = e => { img.src = e.target.result; };
    reader.onerror = reject;
    img.onload = () => {
      let { width, height } = img;
      if (width > height && width > maxDim) {
        height = Math.round(height * maxDim / width);
        width = maxDim;
      } else if (height > maxDim) {
        width = Math.round(width * maxDim / height);
        height = maxDim;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve({
        dataUrl,
        base64: dataUrl.split(',')[1],
        mediaType: 'image/jpeg',
        previewUrl: dataUrl
      });
    };
    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}
