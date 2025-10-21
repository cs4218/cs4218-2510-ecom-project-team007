// tests/e2e/layout.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Layout Component Integration Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Start from home page before each test
        await page.goto('http://localhost:3000');
    });

    test.describe('Layout Component Flow', () => {
        test('should render Header, children content, and Footer together', async ({ page }) => {
            // Verify header is present
            const header = page.locator('header, nav').first();
            await expect(header).toBeVisible();
            // Verify main content area is present
            const mainContent = page.locator('main');
            await expect(mainContent).toBeVisible();
            // Verify footer is present
            const footer = page.locator('footer');
            await expect(footer).toBeVisible();
            // Verify they appear in correct order
            const layoutStructure = await page.evaluate(() => {
                const elements = Array.from(document.querySelectorAll('header, nav, main, footer'));
                return elements.map(el => el.tagName.toLowerCase());
            });
            const mainIndex = layoutStructure.indexOf('main');
            const footerIndex = layoutStructure.lastIndexOf('footer');
            expect(mainIndex).toBeLessThan(footerIndex);
        });

        test('should display correct Helmet meta tags for different pages', async ({ page }) => {
            const homeTitle = await page.title();
            expect(homeTitle).toBeTruthy();
            await page.goto('http://localhost:3000/about');
            const aboutTitle = await page.title();
            expect(aboutTitle).toBeTruthy();
        });

        test('should show Spinner during loading states', async ({ page }) => {
            // Intercept API calls to simulate loading
            await page.route('**/api/**', route => {
                // Delay the response to see spinner
                setTimeout(() => route.continue(), 1000);
            });
            // Navigate to a page that loads auth logic
            await page.goto('http://localhost:3000/dashboard/admin');
            const spinner = page.locator('.spinner, [role="status"], .loading, .loader').first();
            const isSpinnerVisible = await spinner.isVisible().catch(() => false);
            expect(isSpinnerVisible).toBeTruthy();
            await page.waitForLoadState('networkidle');
            const isSpinnerGone = await spinner.isHidden().catch(() => true);
            expect(isSpinnerGone).toBeTruthy();
        });

        test('should maintain Layout structure across page transitions', async ({ page }) => {
            const pages = [
                'http://localhost:3000',
                'http://localhost:3000/about',
                'http://localhost:3000/contact',
                'http://localhost:3000/categories'
            ];

            for (const url of pages) {
                await page.goto(url);

                // Verify Layout structure is consistent
                const header = page.locator('header, nav').first();
                const main = page.locator('main');
                const footer = page.locator('footer').last();

                await expect(header).toBeVisible();
                await expect(main).toBeVisible();
                await expect(footer).toBeVisible();
            }
        });
    });

    test.describe('Navigation Integration - Header Links', () => {
        test('should navigate to Home when clicking Home link in Header', async ({ page }) => {
            const homeLink = '.nav-link:text("Home")';
            await page.click(homeLink);
            await expect(page).toHaveURL('http://localhost:3000/');
        });

        test('should navigate to all categories link when clicking in Categories dropdown', async ({ page }) => {
            const categoriesToggle = 'a:text("Categories")';
            await page.click(categoriesToggle)
            const electronicsLink = page.locator('a:text("All Categories")');
            await electronicsLink.waitFor({ state: 'visible' });
            await electronicsLink.click();
            await expect(page).toHaveURL('http://localhost:3000/categories');
        });

        test('should navigate to a category link when clicking it in Categories dropdown', async ({ page }) => {
            const categoriesToggle = 'a:text("Categories")';
            await page.click(categoriesToggle)
            const electronicsLink = page.locator('a:text("Electronics")');
            await electronicsLink.waitFor({ state: 'visible' });
            await electronicsLink.click();
            await expect(page).toHaveURL('http://localhost:3000/category/electronics');
        });

        test('should maintain active link highlighting in Header', async ({ page }) => {
            await page.goto('http://localhost:3000/about');
            const aboutLink = page.locator('a[href="/about"]').first();
            const classes = await aboutLink.getAttribute('class');
            const hasActiveClass = classes && (
                classes.includes('active')
            );
            const ariaCurrent = await aboutLink.getAttribute('aria-current');
            expect(hasActiveClass || ariaCurrent === 'page').toBeTruthy();
        });
    });

    test.describe('Navigation Integration - Footer Links', () => {
        test('should navigate to About page when clicking About link', async ({ page }) => {
            const aboutLink = 'a:text("About")';
            await page.click(aboutLink);
            await expect(page).toHaveURL(/.*about/);
        });

        test('should navigate to Contact page when clicking Contact link', async ({ page }) => {
            const contactLink = 'a:text("Contact")';
            await page.click(contactLink);
            await expect(page).toHaveURL(/.*contact/);
        });

        test('should navigate to Policy page from Footer', async ({ page }) => {
            const contactLink = 'a:text("Policy")';
            await page.click(contactLink);
            await expect(page).toHaveURL(/.*policy/);

        });

        test('should verify all Footer links are clickable', async ({ page }) => {
            const footer = page.locator('footer');
            const footerLinks = await footer.locator('a').all();

            expect(footerLinks.length).toBeGreaterThan(0);

            for (const link of footerLinks) {
                const isVisible = await link.isVisible();
                const isEnabled = await link.isEnabled();
                expect(isVisible && isEnabled).toBeTruthy();
            }
        });
    });

    test.describe('Page Transitions', () => {
        test('should transition smoothly between About and Pagenotfound', async ({ page }) => {
            const aboutPageUrl = 'http://localhost:3000/about';
            const notExistPageUrl = 'http://localhost:3000/this-page-does-not-exist';

            await page.goto(aboutPageUrl);
            await expect(page).toHaveURL(/.*about/);

            await page.goto(notExistPageUrl);
            const pageContent = await page.textContent('body');

            expect(
                pageContent.includes('404') ||
                pageContent.includes('not found')
            ).toBeTruthy();

            // Layout should still be similar/same
            await expect(page.locator('header, nav').first()).toBeVisible();
            await expect(page.locator('footer').last()).toBeVisible();
        });

        test('should transition successfully from Home page to About page', async ({ page }) => {
            const homePageUrl = 'http://localhost:3000/';
            const aboutLinkLocator = 'text=About';
            const fallbackAboutLink = 'a[href="/about"]'; // For robustness
            await page.goto(homePageUrl);
            await expect(page).toHaveURL(homePageUrl);
            await page.click(aboutLinkLocator).catch(() => page.click(fallbackAboutLink));
            await expect(page).toHaveURL(/.*about/);
        });

        test('should transition successfully from About page to Policy page', async ({ page }) => {
            const aboutPageUrl = 'http://localhost:3000/about';
            const policyLinkLocator = 'text=Policy';
            const fallbackPolicyLink = 'a[href="/policy"]'; // For robustness
            await page.goto(aboutPageUrl);
            await expect(page).toHaveURL(/.*about/); // Ensure we landed on About
            await page.click(policyLinkLocator).catch(() => page.click(fallbackPolicyLink));
            await expect(page).toHaveURL(/.*policy/);
        });

        test('should ensure basic structural elements (header, main, footer) are visible on the Home page', async ({ page }) => {
            await expect(page.locator('header, nav').first()).toBeVisible();
            await expect(page.locator('main')).toBeVisible();
            await expect(page.locator('footer').last()).toBeVisible();
        });

        test('should handle browser back/forward navigation correctly and render content', async ({ page }) => {
            await page.goto('http://localhost:3000');
            await page.locator('a[href="/about"]').click();
            await expect(page).toHaveURL(/.*about/);

            await page.locator('a[href="/contact"]').click();
            await expect(page).toHaveURL(/.*contact/);

            await page.goBack();
            await expect(page).toHaveURL(/.*about/);

            await page.goBack();
            await expect(page).toHaveURL('http://localhost:3000/');

            await page.goForward();
            await expect(page).toHaveURL(/.*about/);

            await expect(page.locator('header, nav').first()).toBeVisible();
            await expect(page.locator('footer').last()).toBeVisible();
        });

        test('should display 404 for invalid routes', async ({ page }) => {
            const invalidRoutes = [
                '/invaliddasdgfjksj',
                '/random-test-route',
                '/some-nonexistent-page'
            ];

            for (const route of invalidRoutes) {
                await page.goto(`http://localhost:3000${route}`);

                const bodyText = await page.textContent('body');
                const has404Content = bodyText.includes('404')

                expect(has404Content).toBeTruthy();

                await expect(page.locator('header, nav').first()).toBeVisible();
                await expect(page.locator('footer').last()).toBeVisible();
            }
        });
    });

    test.describe('Breadcrumb and Active Link Tests', () => {
        test('should highlight active navigation link based on current route', async ({ page }) => {
            const routes = [
                { path: '/about', linkText: 'About' },
                { path: '/contact', linkText: 'Contact' },
                { path: '/policy', linkText: 'policy' }
            ];

            for (const { path } of routes) {
                await page.goto(`http://localhost:3000${path}`);
                const navLink = page.locator(`a[href="${path}"]`).first();
                const classes = await navLink.getAttribute('class') || '';
                const hasActiveClass = classes && (classes.includes('active'));
                const ariaCurrent = await navLink.getAttribute('aria-current');
                const isActive = hasActiveClass || ariaCurrent === 'page';
                expect(isActive).toBeTruthy();
            }
        });

        test('should only have one active link at a time in Header', async ({ page }) => {
            await page.goto('http://localhost:3000/about');
            const activeLinks = await page.locator('nav a.active, nav a[aria-current="page"]').count();
            expect(activeLinks).toBeLessThanOrEqual(1);
        });
    });
});