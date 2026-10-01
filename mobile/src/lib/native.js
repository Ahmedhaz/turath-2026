// Thin wrappers over the native plugins. Each one degrades to a web fallback, so the same build
// runs in a desktop browser during development.
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { StatusBar, Style } from '@capacitor/status-bar';

export const native = Capacitor.isNativePlatform();

export const tap = () => native && Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
export const thud = () => native && Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
export const success = () => native && Haptics.notification({ type: NotificationType.Success }).catch(() => {});
export const tick = () => native && Haptics.selectionChanged().catch(() => {});

export async function shareText(text, title) {
  try {
    if (native) return await Share.share({ text, title, dialogTitle: title });
    if (navigator.share) return await navigator.share({ text, title });
    await navigator.clipboard?.writeText(text);
  } catch {}
}

/** Shares a PNG data URL as a real image file, which is what Instagram and WhatsApp expect. */
export async function shareImage(dataUrl, text) {
  try {
    if (native) {
      const name = `turath-${Date.now()}.png`;
      const { uri } = await Filesystem.writeFile({ path: name, data: dataUrl.split(',')[1], directory: Directory.Cache });
      return await Share.share({ files: [uri], text });
    }
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], 'turath.png', { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) return await navigator.share({ files: [file], text });
    const a = document.createElement('a'); a.href = dataUrl; a.download = 'turath.png'; a.click();
  } catch {}
}

export function statusBar(theme) {
  if (!native) return;
  const dark = theme === 'night' || theme === 'black';
  StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }).catch(() => {});
  if (Capacitor.getPlatform() === 'android') {
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--paper').trim();
    StatusBar.setBackgroundColor({ color: bg }).catch(() => {});
  }
}
