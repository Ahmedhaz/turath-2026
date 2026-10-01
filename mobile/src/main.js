import './app.css';
import { mount } from 'svelte';
import { SplashScreen } from '@capacitor/splash-screen';
import App from './App.svelte';

mount(App, { target: document.getElementById('app') });

// The app hides the splash once the catalog has loaded; this is the safety net if that never happens.
setTimeout(() => SplashScreen.hide().catch(() => {}), 3000);
