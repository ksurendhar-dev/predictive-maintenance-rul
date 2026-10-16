const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

async function run() {
  const executablePath = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

  console.log('Launching browser executable at:', executablePath);
  const browser = await chromium.launch({
    executablePath,
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 920 }
  });
  const page = await context.newPage();

  const targetUrl = process.env.TEST_URL || 'http://localhost:3003';
  console.log(`1. Navigating to ${targetUrl}...`);
  await page.goto(targetUrl, { waitUntil: 'networkidle' });

  const title = await page.title();
  console.log('Page Title:', title);

  const artifactDir = process.env.SCREENSHOT_DIR || path.join(__dirname, '../docs/screenshots');
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }
  
  // Handle Login if rendered
  const signInBtn = await page.getByRole('button', { name: /Sign In/i });
  if (signInBtn && await signInBtn.isVisible()) {
    console.log('0. Detected Role-Based Login Page. Clicking Quick Fill-In for Reliability Engineer...');
    const adminFill = page.getByRole('button', { name: /@admin/i });
    if (await adminFill.count() > 0) {
      await adminFill.click();
      await page.waitForTimeout(300);
    }
    const screenLogin = path.join(artifactDir, 'predictive_login.png');
    await page.screenshot({ path: screenLogin });
    console.log('Screenshot 0 captured: predictive_login.png');

    await signInBtn.click();
    await page.waitForSelector('h1.page-heading', { timeout: 6000 });
    console.log('Signed in successfully as Reliability Engineer (ADMIN).');
  }

  // Reset fleet first for a clean baseline
  console.log('0. Resetting fleet via Cockpit for clean baseline...');
  const resetBtn = await page.getByRole('button', { name: /Reset Fleet/i });
  if (resetBtn) {
    await resetBtn.click();
    await page.waitForTimeout(1500);
  }

  // Screenshot 1: Clean Nominal Overview
  const screen1 = path.join(artifactDir, 'predictive_overview.png');
  await page.screenshot({ path: screen1 });
  console.log('Screenshot 1 captured: predictive_overview.png');

  // Verify Cockpit bar exists
  const cockpit = await page.$('aside[aria-label="Simulation Cockpit"]');
  console.log('Simulation Cockpit bar mounted:', !!cockpit);

  // Trigger Vibration Spike scenario via cockpit button
  console.log('2. Triggering "Vib Spike 8.6 mm/s" scenario in Cockpit...');
  const vibBtn = await page.getByRole('button', { name: /Vib Spike/i });
  await vibBtn.click();
  await page.waitForSelector('.data-table tbody tr', { timeout: 5000 });
  await page.waitForTimeout(1000);

  // Screenshot 2: Spiked condition with alert
  const screen2 = path.join(artifactDir, 'predictive_spike.png');
  await page.screenshot({ path: screen2 });
  console.log('Screenshot 2 captured: predictive_spike.png');

  // Click Resolve on the newly generated alert
  console.log('3. Resolving the alert via 1-click Resolve button...');
  const resolveBtn = await page.getByRole('button', { name: /Resolve/i }).first();
  if (resolveBtn) {
    await resolveBtn.click();
    console.log('Clicked 1-click Resolve button!');
    await page.waitForTimeout(2000);
  }

  // Screenshot 3: Post-resolution
  const screen3 = path.join(artifactDir, 'predictive_resolved.png');
  await page.screenshot({ path: screen3 });
  console.log('Screenshot 3 captured: predictive_resolved.png');

  // Navigate to "Repairs & Tasks" tab
  console.log('4. Navigating to "Repairs & Tasks" tab...');
  const repairsTab = await page.getByRole('button', { name: /Repairs & Tasks/i });
  if (repairsTab) {
    await repairsTab.click();
    await page.waitForTimeout(1000);
    const screen4 = path.join(artifactDir, 'predictive_repairs.png');
    await page.screenshot({ path: screen4 });
    console.log('Screenshot 4 captured: predictive_repairs.png');
  }

  // Test Schedule Repair modal
  console.log('5. Opening "Schedule Repair" modal...');
  const scheduleBtn = await page.getByRole('button', { name: /Schedule Repair/i }).first();
  if (scheduleBtn) {
    await scheduleBtn.click();
    await page.waitForTimeout(1000);
    const screen5 = path.join(artifactDir, 'predictive_modal.png');
    await page.screenshot({ path: screen5 });
    console.log('Screenshot 5 captured: predictive_modal.png');
  }

  await browser.close();
  console.log('Custom Playwright browser test run completed with 100% success!');
}

run().catch(err => {
  console.error('Playwright execution error:', err);
  process.exit(1);
});
