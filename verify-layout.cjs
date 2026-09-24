const { chromium } = require('playwright');

const PROJECT_REF = 'huiehgawfgtmjyttpfmt';

function makeMockSession() {
  const now = Math.floor(Date.now() / 1000);
  return {
    created_at: new Date().toISOString(),
    expires_at: now + 3600,
    refresh_token: 'mock_refresh_token',
    access_token: 'mock_access_token',
    token_type: 'bearer',
    user: {
      id: 'user-1',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'test@example.com',
      email_confirmed_at: '2024-01-01T00:00:00Z',
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { full_name: 'Test User' },
      identities: [],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }
  };
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  // ---------- DESKTOP ----------
  const ctxD = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const pageD = await ctxD.newPage();

  const errors = [];
  pageD.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  pageD.on('pageerror', e => errors.push('pageerror: ' + e.message));

  // Seed Supabase localStorage
  await pageD.addInitScript((projectRef) => {
    const session = {
      created_at: new Date().toISOString(),
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: 'mock_refresh_token',
      access_token: 'mock_access_token',
      token_type: 'bearer',
      user: {
        id: 'user-1',
        aud: 'authenticated',
        role: 'authenticated',
        email: 'test@example.com',
        email_confirmed_at: '2024-01-01T00:00:00Z',
        app_metadata: { provider: 'email', providers: ['email'] },
        user_metadata: { full_name: 'Test User' },
        identities: [],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }
    };
    window.localStorage.setItem(`sb-${projectRef}-auth-token`, JSON.stringify(session));
  }, PROJECT_REF);

  // Mock ALL local fetch() calls to /api/*
  await pageD.route('http://localhost:5177/api/**', route => {
    const url = route.request().url();
    let body = '{}';
    if (url.includes('/api/profile')) {
      body = JSON.stringify({ id: 'user-1', email: 'test@example.com', full_name: 'Test User', currency: 'USD' });
    } else if (url.includes('/api/balances')) {
      body = JSON.stringify({ netBalance: 0, totalOwed: 0, totalOwe: 0, balances: [] });
    } else if (url.includes('/api/groups')) {
      body = JSON.stringify([]);
    } else if (url.includes('/api/activity')) {
      body = JSON.stringify([]);
    }
    route.fulfill({ status: 200, contentType: 'application/json', body });
  });

  await pageD.goto('http://localhost:5177/dashboard', { waitUntil: 'domcontentloaded', timeout: 20000 });
  // Wait for React to render after data loads
  await pageD.waitForTimeout(5000);

  console.log('Final URL (desktop):', pageD.url());

  // Look for heading text
  const bodyText = await pageD.$eval('body', el => el.innerText);
  console.log('Body text snippet:', bodyText.substring(0, 200));

  const heading = await pageD.$('h1');
  const headingText = heading ? await heading.textContent() : null;
  console.log('H1 text:', headingText);

  const sidebar = await pageD.$('aside');
  const main = await pageD.$('main');

  const sidebarBox = sidebar ? await sidebar.boundingBox() : null;
  const mainBox = main ? await main.boundingBox() : null;
  const headingBox = heading ? await heading.boundingBox() : null;

  console.log('\n--- DESKTOP 1280x800 ---');
  console.log('Sidebar bbox:', JSON.stringify(sidebarBox));
  console.log('Main bbox:   ', JSON.stringify(mainBox));
  console.log('H1 bbox:    ', JSON.stringify(headingBox));

  if (sidebarBox && mainBox) {
    console.log('1. Sidebar on LEFT?            ', sidebarBox.x < 5, '(x=' + sidebarBox.x + ')');
    console.log('2. Main beside sidebar (y~)?  ', Math.abs(sidebarBox.y - mainBox.y) < 5);
    console.log('3. Main NOT below sidebar?    ', mainBox.y < sidebarBox.y + sidebarBox.height);
    console.log('4. Main starts right of sb?   ', mainBox.x >= sidebarBox.x + sidebarBox.width - 1,
                '(main.x=' + mainBox.x + ', sb.right=' + (sidebarBox.x + sidebarBox.width) + ')');
  }
  if (headingBox && mainBox) {
    const topPad = headingBox.y - mainBox.y;
    console.log('5. H1 top offset from main:   ', topPad.toFixed(0) + 'px');
    console.log('6. No huge blank (>300px)?    ', topPad < 300);
    console.log('7. H1 near top (<100px)?      ', topPad < 100);
  }

  await pageD.screenshot({ path: 'dashboard-desktop.png', fullPage: false });
  console.log('Screenshot: dashboard-desktop.png');

  // ---------- MOBILE ----------
  const ctxM = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const pageM = await ctxM.newPage();

  const mobileErrors = [];
  pageM.on('console', m => { if (m.type() === 'error') mobileErrors.push(m.text()); });
  pageM.on('pageerror', e => mobileErrors.push('pageerror: ' + e.message));

  await pageM.addInitScript((projectRef) => {
    const session = {
      created_at: new Date().toISOString(),
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: 'mock_refresh_token',
      access_token: 'mock_access_token',
      token_type: 'bearer',
      user: {
        id: 'user-1', aud: 'authenticated', role: 'authenticated', email: 'test@example.com',
        email_confirmed_at: '2024-01-01T00:00:00Z',
        app_metadata: { provider: 'email', providers: ['email'] },
        user_metadata: { full_name: 'Test User' },
        identities: [], created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
      }
    };
    window.localStorage.setItem(`sb-${projectRef}-auth-token`, JSON.stringify(session));
  }, PROJECT_REF);

  await pageM.route('http://localhost:5177/api/**', route => {
    const url = route.request().url();
    let body = '{}';
    if (url.includes('/api/profile')) body = JSON.stringify({ id: 'user-1', email: 'test@example.com', full_name: 'Test User', currency: 'USD' });
    else if (url.includes('/api/balances')) body = JSON.stringify({ netBalance: 0, totalOwed: 0, totalOwe: 0, balances: [] });
    else if (url.includes('/api/groups')) body = JSON.stringify([]);
    else if (url.includes('/api/activity')) body = JSON.stringify([]);
    route.fulfill({ status: 200, contentType: 'application/json', body });
  });

  await pageM.goto('http://localhost:5177/dashboard', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await pageM.waitForTimeout(5000);

  console.log('\nFinal URL (mobile):', pageM.url());
  const mobileH1 = await pageM.$('h1');
  const mobileH1Text = mobileH1 ? await pageM.$eval('h1', el => el.textContent) : null;
  console.log('Mobile H1 text:', mobileH1Text);

  const mobileHeadingBox = mobileH1 ? await mobileH1.boundingBox() : null;
  const mobileMain = await pageM.$('main');
  const mobileMainBox = mobileMain ? await mobileMain.boundingBox() : null;
  console.log('Mobile main bbox:', JSON.stringify(mobileMainBox));
  console.log('Mobile H1 bbox:  ', JSON.stringify(mobileHeadingBox));

  if (mobileHeadingBox && mobileMainBox) {
    const topPad = mobileHeadingBox.y - mobileMainBox.y;
    console.log('Mobile H1 top offset from main:', topPad.toFixed(0) + 'px');
  }

  const mobileNav = await pageM.$('nav.fixed');
  const mobileNavBox = mobileNav ? await mobileNav.boundingBox() : null;
  console.log('Mobile bottom nav:', JSON.stringify(mobileNavBox));

  const mobileSidebar = await pageM.$('aside.hidden');
  const mobileSidebarBox = mobileSidebar ? await mobileSidebar.boundingBox() : null;
  console.log('Desktop sidebar hidden on mobile:', mobileSidebarBox === null);

  await pageM.screenshot({ path: 'dashboard-mobile.png', fullPage: false });
  console.log('Screenshot: dashboard-mobile.png');

  console.log('\n--- ERRORS (desktop) ---');
  if (errors.length === 0) console.log('(none)');
  else errors.forEach(e => console.log(e));

  console.log('\n--- ERRORS (mobile) ---');
  if (mobileErrors.length === 0) console.log('(none)');
  else mobileErrors.forEach(e => console.log(e));

  await browser.close();
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
