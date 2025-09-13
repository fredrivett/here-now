import { Request, Response } from 'express';
import { ALLOWED_DOMAINS, ACTIVITY_THRESHOLD_MS, getDomainCheckJS } from '@/lib/constants';

export const widgetController = async (req: Request, res: Response) => {
  // Get API base URL from environment or request
  const apiBaseUrl = process.env.API_BASE_URL || `${req.protocol}://${req.get('host')}`;

  const widgetScript = `
(function() {
  'use strict';
  
  // Check if we're in a browser environment (not SSR)
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  
  // Configuration
  const DEBUG = document.documentElement.hasAttribute('data-herenow-debug');
  const NAVIGATION_TIMEOUT = 100; // ms delay for SPA navigation handling
  
  // Track in-flight initializations to prevent race conditions
  // Using WeakSet because it automatically cleans up when DOM elements 
  // are removed during SPA navigation (no memory leaks)
  const initializingElements = new WeakSet();
  
  // Shared logging function with DRY prefix
  const PREFIX = '[herenow]';
  
  function log(message, ...args) {
    if (DEBUG) {
      console.log(PREFIX, message, ...args);
    }
  }
  
  function warn(message, ...args) {
    console.warn(PREFIX, message, ...args);
  }
  
  function error(message, ...args) {
    console.error(PREFIX, message, ...args);
  }
  
  log('Debug mode enabled');
  const HERENOW_API = '${apiBaseUrl}';
  
  ${getDomainCheckJS()}
  
  // Check if we're on the allowed domain
  if (!isDomainAllowed(window.location.hostname)) {
    warn('Domain not allowed:', window.location.hostname);
    return;
  }
  
  log('Widget loading on domain:', window.location.hostname);
  
  const DOMAIN = window.location.hostname === 'localhost' ? 'localhost' : 
    window.location.hostname.includes('vercel.app') ? 'herenow.fyi' : 
    window.location.hostname;
  
  // Detect dark mode from multiple sources
  function isDarkMode() {
    // 1. Check for Tailwind's dark class on html
    if (document.documentElement.classList.contains('dark')) {
      return true;
    }
    
    // 2. Check for light class (explicit light mode)
    if (document.documentElement.classList.contains('light')) {
      return false;
    }
    
    // 3. Check for data-theme attribute
    const theme = document.documentElement.getAttribute('data-theme');
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    
    // 4. Fallback to system preference
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  
  // Generate or get user ID (UUID in localStorage)
  function getUserId() {
    let userId = localStorage.getItem('herenow_user_id');
    if (!userId) {
      // Generate a simple UUID-like string
      userId = 'user_' + Math.random().toString(36).substring(2) + '_' + Date.now().toString(36);
      localStorage.setItem('herenow_user_id', userId);
      log('Generated new user ID:', userId);
    }
    return userId;
  }
  
  // Generate or get session ID  
  function getSessionId() {
    let sessionId = sessionStorage.getItem('herenow_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('herenow_session_id', sessionId);
    }
    return sessionId;
  }
  
  // Activity tracking
  let lastActivity = 0;
  const ACTIVITY_THRESHOLD = ${ACTIVITY_THRESHOLD_MS};

  // Track page visit
  async function trackVisit() {
    log('Tracking visit for path:', window.location.pathname);
    try {
      const response = await fetch(HERENOW_API + '/api/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain: DOMAIN,
          path: window.location.pathname,
          user_id: getUserId(),
          session_id: getSessionId(),
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        error('Tracking failed with status:', response.status, errorData);
      } else {
        const result = await response.json();
        log('Visit tracked successfully:', result);
        lastActivity = Date.now();
      }
    } catch (err) {
      error('Tracking failed:', err);
    }
  }

  // Send activity update only if user is visible
  async function sendActivityUpdate() {
    if (document.hidden) {
      log('User not visible, skipping activity update');
      return;
    }
    
    log('Sending activity update for continued presence');
    await trackVisit();
    
    // Refresh stats immediately to show updated count
    try {
      const updatedStats = await fetchStats();
      updateWidgetNumbers(updatedStats);
      log('Updated stats after activity update:', updatedStats);
    } catch (err) {
      error('Failed to refresh stats after activity update:', err);
    }
  }

  // Handle visibility changes
  function handleVisibilityChange() {
    if (!document.hidden) {
      const timeSinceLastActivity = Date.now() - lastActivity;
      if (timeSinceLastActivity >= ACTIVITY_THRESHOLD) {
        log('User returned to tab after', Math.round(timeSinceLastActivity / 1000 / 60), 'minutes');
        sendActivityUpdate();
      } else {
        log('User returned to tab, but recent activity exists - skipping');
      }
    }
  }
  
  // Fetch stats
  async function fetchStats() {
    const currentPath = window.location.pathname;
    try {
      const response = await fetch(HERENOW_API + '/api/stats?domain=' + DOMAIN + '&path=' + encodeURIComponent(currentPath));
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      error('Stats failed:', error);
    }
    return { here: 0, now: 0, domain: DOMAIN, path: currentPath };
  }
  
  // Create skeleton widget HTML with placeholder dashes
  function createSkeletonWidget() {
    const dark = isDarkMode();
    const colors = dark ? {
      bg: '#000',
      border: '#fff',
      numberText: '#fff',
      labelText: '#a1a1aa',
      pulse: '#fff',
      hoverBg: '#fff',
      hoverText: '#000'
    } : {
      bg: '#fff',
      border: '#000',
      numberText: '#000',
      labelText: '#374151',
      pulse: '#000',
      hoverBg: '#000',
      hoverText: '#fff'
    };
    
    const widget = document.createElement('div');
    widget.id = 'herenow-widget';
    widget.style.cssText = \`
      display: inline-flex;
      align-items: stretch;
      font-family: 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
      font-size: 14px;
      border: 1px solid \${colors.border};
      background: \${colors.bg};
    \`;
    
    widget.innerHTML = \`
      <div style="display: flex; align-items: center; gap: 4px; padding: 4px 8px;">
        <span class="herenow-here-count" style="font-weight: 600; font-size: 16px; color: \${colors.numberText};">—</span>
        <span style="color: \${colors.labelText};">here</span>
      </div>
      
      <div style="display: flex; align-items: center; gap: 4px; padding: 4px 8px; border-left: 1px solid \${colors.border};">
        <div style="display: flex; align-items: center; gap: 4px;">
          <div style="width: 10px; height: 10px; background-color: \${colors.pulse}; animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>
          <span class="herenow-now-count" style="font-weight: 600; font-size: 16px; color: \${colors.numberText};">—</span>
        </div>
        <span style="color: \${colors.labelText};">now</span>
      </div>
      
      <a href="https://herenow.fyi" target="_blank"
         style="display: flex; align-items: center; gap: 4px; padding: 4px 8px; border-left: 1px solid \${colors.border}; color: \${colors.labelText}; text-decoration: none; transition: all 0.2s;"
         onmouseover="this.style.backgroundColor='\${colors.hoverBg}'; this.style.color='\${colors.hoverText}';"
         onmouseout="this.style.backgroundColor='\${colors.bg}'; this.style.color='\${colors.labelText}';">
        fyi
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15,3 21,3 21,9"/>
          <line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
      </a>
    \`;
    
    return widget;
  }

  // Update skeleton widget with real numbers  
  function updateWidgetNumbers(stats) {
    const hereSpan = document.querySelector('.herenow-here-count');
    const nowSpan = document.querySelector('.herenow-now-count');
    
    if (hereSpan) {
      hereSpan.textContent = stats.here;
      log('Updated here count:', stats.here);
    }
    if (nowSpan) {
      nowSpan.textContent = stats.now; 
      log('Updated now count:', stats.now);
    }
  }
  
  // Update widget appearance
  function updateWidget(stats) {
    const existingWidget = document.getElementById('herenow-widget');
    if (existingWidget) {
      const newWidget = createSkeletonWidget();
      existingWidget.replaceWith(newWidget);
      // Update numbers after replacement
      updateWidgetNumbers(stats);
    }
  }
  
  // Initialize widget
  async function init() {
    // Find target element
    const target = document.querySelector('[data-herenow]');
    if (!target) {
      warn('No element with data-herenow attribute found');
      return;
    }
    
    log('Found data-herenow element on initial page load');
    
    // Use unified initialization function (handles tracking + widget creation)
    let currentStats = await initializeElement(target);
    if (!currentStats) return;
    
    // Watch for theme changes on document.documentElement
    const themeObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'class' || mutation.attributeName === 'data-theme')) {
          updateWidget(currentStats);
        }
      });
    });
    
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme']
    });
    
    // Initialize individual element - unified function for both tracking and widget creation
    async function initializeElement(element) {
      if (!element || element.hasAttribute('data-herenow-initialized')) {
        log('Element already initialized or invalid, skipping');
        return;
      }
      
      if (initializingElements.has(element)) {
        log('Element already being initialized, skipping');
        return;
      }
      
      initializingElements.add(element);
      log('Initializing widget for element:', element);
      
      try {
        // Show skeleton immediately (replace any existing content)
        element.innerHTML = '';
        const skeletonWidget = createSkeletonWidget();
        element.appendChild(skeletonWidget);
        log('Skeleton widget shown, loading data...');
        
        // Track the visit first (for both initial load and SPA navigation)
        await trackVisit();
        
        // Get stats and update skeleton
        const currentStats = await fetchStats();
        log('Got stats for element:', currentStats);
        updateWidgetNumbers(currentStats);
        
        // Only mark as initialized if everything succeeded
        element.setAttribute('data-herenow-initialized', 'true');
        log('Widget initialized successfully');
        
        return currentStats; // Return for potential theme setup
      } catch (err) {
        error('Failed to initialize widget:', err);
        // Don't mark as initialized so it can be retried
      } finally {
        // Remove from in-flight tracking (success or failure)
        initializingElements.delete(element);
      }
    }
    
    // Handle SPA navigation efficiently
    function reinitializeWidgets() {
      log('SPA navigation detected, scanning for new widgets');
      // Find any new [data-herenow] elements that haven't been initialized
      const newElements = document.querySelectorAll('[data-herenow]:not([data-herenow-initialized])');
      log('Found', newElements.length, 'new elements to initialize');
      newElements.forEach(element => {
        initializeElement(element);
      });
    }
    
    // Listen for browser back/forward navigation
    window.addEventListener('popstate', () => {
      log('popstate event detected');
      reinitializeWidgets();
    });
    
    // Intercept pushState and replaceState (used by most SPA frameworks)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function() {
      log('pushState intercepted, args:', arguments);
      originalPushState.apply(this, arguments);
      setTimeout(() => {
        log('pushState timeout triggered');
        reinitializeWidgets();
      }, NAVIGATION_TIMEOUT);
    };
    
    history.replaceState = function() {
      log('replaceState intercepted, args:', arguments);
      originalReplaceState.apply(this, arguments);
      setTimeout(() => {
        log('replaceState timeout triggered');
        reinitializeWidgets();
      }, NAVIGATION_TIMEOUT);
    };
    
    // Listen for custom rescan events (gives users control)
    document.addEventListener('herenow-rescan', () => {
      log('Custom rescan event received');
      reinitializeWidgets();
    });
    
    // Framework-specific hooks (if available)
    if (window.next?.router?.events?.on) {
      log('Next.js router detected, adding event listener');
      window.next.router.events.on('routeChangeComplete', () => {
        log('Next.js routeChangeComplete event');
        reinitializeWidgets();
      });
    }
    
    // Set up activity tracking
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Send heartbeat every 5 minutes (only if user is visible)
    setInterval(() => {
      sendActivityUpdate();
    }, ACTIVITY_THRESHOLD);

    // Update stats every 30 seconds
    setInterval(async () => {
      currentStats = await fetchStats();
      updateWidget(currentStats);
    }, 30000);
  }
  
  // Add pulse animation CSS if not already added
  if (!document.getElementById('herenow-styles')) {
    const style = document.createElement('style');
    style.id = 'herenow-styles';
    style.textContent = \`
      @keyframes pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: .5;
        }
      }
    \`;
    document.head.appendChild(style);
  }
  
  // Initialize with hydration safety
  function safeInit() {
    // Wait a frame to ensure React hydration is complete
    requestAnimationFrame(() => {
      init();
    });
  }
  
  // Handle different loading states with React hydration consideration
  const HYDRATION_DELAY = 500; // Give React time to hydrate before widget initialization
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(safeInit, HYDRATION_DELAY));
  } else if (document.readyState === 'interactive') {
    // DOM loaded but resources still loading - wait for hydration
    setTimeout(safeInit, HYDRATION_DELAY);
  } else {
    // DOM fully loaded - still wait for potential hydration
    setTimeout(safeInit, HYDRATION_DELAY);
  }
})();
`;

  res.set({
    'Content-Type': 'application/javascript',
    'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
  });

  res.send(widgetScript);
};
