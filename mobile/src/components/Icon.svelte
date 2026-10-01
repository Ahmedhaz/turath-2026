<script>
  // One stroke icon set, drawn for this app at 24px on a 1.8 stroke, so every glyph sits on the same weight.
  let { name, size = 24, fill = false } = $props();
  const P = {
    today: 'M12 3v2M12 19v2M5 12H3M21 12h-2M6.3 6.3 4.9 4.9M19.1 19.1l-1.4-1.4M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
    library: 'M4 19V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v14M9 19V8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v11M15.3 7.6l2.9-.8a1 1 0 0 1 1.2.7l3 11.2M3 20h18',
    guide: 'M12 21s-7-4.4-7-11a7 7 0 0 1 14 0c0 6.6-7 11-7 11ZM12 7v6M9 10h6',
    search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM20 20l-3.5-3.5',
    saved: 'M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1Z',
    back: 'M9 5l7 7-7 7',
    close: 'M6 6l12 12M18 6 6 18',
    chevron: 'M15 6l-6 6 6 6',
    more: 'M5 12h.01M12 12h.01M19 12h.01',
    toc: 'M4 6h16M4 12h10M4 18h13',
    type: 'M4 18 9 6l5 12M5.7 14h6.6M15 18l3-7 3 7M15.8 16h4.4',
    share: 'M12 15V3M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7',
    bookmark: 'M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1Z',
    heart: 'M12 20s-7.5-4.6-9.2-9.3C1.7 7.5 3.9 4 7.4 4c2 0 3.6 1.1 4.6 2.6C13 5.1 14.6 4 16.6 4c3.5 0 5.7 3.5 4.6 6.7C19.5 15.4 12 20 12 20Z',
    check: 'M5 12.5l4.5 4.5L19 7.5',
    play: 'M8 5v14l11-7L8 5Z',
    clock: 'M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z',
    flame: 'M12 3s5 4.5 5 9.5A5 5 0 0 1 7 12.5C7 10 9 8.5 9 8.5s0 2.5 2 3.5c0-4 1-9 1-9Z',
    highlight: 'M15 4l5 5-9 9H6v-5l9-9ZM4 21h16',
    copy: 'M9 9h10v10H9zM5 15V5h10',
    trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
    settings: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM19.4 13a7.6 7.6 0 0 0 0-2l2-1.6-2-3.4-2.4 1a7.4 7.4 0 0 0-1.7-1L15 3.5h-4L10.6 6a7.4 7.4 0 0 0-1.7 1l-2.4-1-2 3.4L6.6 11a7.6 7.6 0 0 0 0 2l-2 1.6 2 3.4 2.4-1c.5.4 1.1.7 1.7 1l.4 2.5h4l.4-2.5c.6-.3 1.2-.6 1.7-1l2.4 1 2-3.4-2-1.6Z',
    sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3ZM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z',
    refresh: 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7',
    arrowUp: 'M12 19V5M6 11l6-6 6 6',
  };
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke="currentColor"
  stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d={P[name]} />
</svg>
