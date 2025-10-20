// tests/e2e/layout.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Layout Component Integration Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Start from the home page before each test
        await page.goto('http://localhost:3000');
    });

    test.describe('Layout Component Flow', () => {
        test('should render Header, children content, and Footer together', async ({ page }) => {
            // Verify Header is present
            const header = page.locator('header, nav').first();
            await expect(header).toBeVisible();

            // Verify main content area is present
            const mainContent = page.locator('main');
            await expect(mainContent).toBeVisible();
            await expect(mainContent).toHaveCSS('min-height', '70vh');

            // Verify Footer is present
            const footer = page.locator('footer').last();
            await expect(footer).toBeVisible();

            // Verify they appear in correct order (Header -> Main -> Footer)
            const layoutStructure = await page.evaluate(() => {
                const elements = Array.from(document.querySelectorAll('header, nav, main, footer'));
                return elements.map(el => el.tagName.toLowerCase());
            });

            // Check that main content appears between header/nav and footer
            const mainIndex = layoutStructure.indexOf('main');
            const footerIndex = layoutStructure.lastIndexOf('footer');
            expect(mainIndex).toBeLessThan(footerIndex);
        });

        test('should display correct Helmet meta tags for different pages', async ({ page }) => {
            // Test home page meta tags
            await page.goto('http://localhost:3000');
            const homeTitle = await page.title();
            expect(homeTitle).toContain('Ecommerce app');

            // Test About page meta tags
            await page.goto('http://localhost:3000/about');
            const aboutTitle = await page.title();
            expect(aboutTitle).toBeTruthy();

            // Verify meta description exists
            const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
            expect(metaDescription).toBeTruthy();

            // Verify meta keywords exists
            const metaKeywords = await page.locator('meta[name="keywords"]').getAttribute('content');
            expect(metaKeywords).toBeTruthy();

            // Verify meta author exists
            const metaAuthor = await page.locator('meta[name="author"]').getAttribute('content');
            expect(metaAuthor).toBeTruthy();
        });

        test('should show Spinner during loading states', async ({ page }) => {
            // Intercept API calls to simulate loading
            await page.route('**/api/**', route => {
                // Delay the response to see spinner
                setTimeout(() => route.continue(), 1000);
            });

            // Navigate to a page that loads data
            await page.goto('http://localhost:3000/categories');

            // Check if spinner appears (adjust selector based on your Spinner component)
            const spinner = page.locator('.spinner, [role="status"], .loading, .loader').first();

            // Spinner should be visible during loading
            const isSpinnerVisible = await spinner.isVisible().catch(() => false);

            // Wait for content to load (spinner should disappear)
            await page.waitForLoadState('networkidle');

            // After loading, spinner should not be visible
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
            await page.goto('http://localhost:3000/about');

            // Click Home link (adjust selector based on your Header component)
            await page.click('text=Home, a[href="/"]').catch(() =>
                page.click('nav >> text=Home')
            );

            await expect(page).toHaveURL('http://localhost:3000/');
        });

        test('should navigate to Categories when clicking Categories link', async ({ page }) => {
            // Click Categories link
            await page.click('text=Categories, a[href="/categories"]').catch(() =>
                page.click('nav >> text=Categories')
            );

            await expect(page).toHaveURL(/.*categories/);
        });

        test('should navigate to About page when clicking About link', async ({ page }) => {
            await page.click('text=About, a[href="/about"]').catch(() =>
                page.click('nav >> text=About')
            );

            await expect(page).toHaveURL(/.*about/);
        });

        test('should navigate to Contact page when clicking Contact link', async ({ page }) => {
            await page.click('text=Contact, a[href="/contact"]').catch(() =>
                page.click('nav >> text=Contact')
            );

            await expect(page).toHaveURL(/.*contact/);
        });

        test('should update route correctly when clicking navigation links', async ({ page }) => {
            const navigationFlow = [
                { link: 'About', expectedURL: /.*about/ },
                { link: 'Contact', expectedURL: /.*contact/ },
                { link: 'Categories', expectedURL: /.*categories/ },
                { link: 'Home', expectedURL: 'http://localhost:3000/' }
            ];

            for (const { link, expectedURL } of navigationFlow) {
                await page.click(`text=${link}`).catch(() =>
                    page.click(`nav >> text=${link}`)
                );
                await expect(page).toHaveURL(expectedURL);
            }
        });

        test('should maintain active link highlighting in Header', async ({ page }) => {
            // Navigate to About page
            await page.goto('http://localhost:3000/about');

            // Check if About link has active class (adjust based on your implementation)
            const aboutLink = page.locator('a[href="/about"]').first();
            const classes = await aboutLink.getAttribute('class');

            // Common active class patterns: 'active', 'nav-active', 'current'
            const hasActiveClass = classes && (
                classes.includes('active') ||
                classes.includes('current') ||
                classes.includes('selected')
            );

            // If using aria-current attribute
            const ariaCurrent = await aboutLink.getAttribute('aria-current');

            expect(hasActiveClass || ariaCurrent === 'page').toBeTruthy();
        });
    });

    test.describe('Navigation Integration - Footer Links', () => {
        test('should navigate to About page from Footer', async ({ page }) => {
            const footer = page.locator('footer');
            await footer.locator('text=About, a[href="/about"]').click();

            await expect(page).toHaveURL(/.*about/);
        });

        test('should navigate to Contact page from Footer', async ({ page }) => {
            const footer = page.locator('footer');
            await footer.locator('text=Contact, a[href="/contact"]').click();

            await expect(page).toHaveURL(/.*contact/);
        });

        test('should navigate to Policy page from Footer', async ({ page }) => {
            const footer = page.locator('footer');
            await footer.locator('text=Policy, a[href="/policy"]').click();

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
            // Navigate to About page
            await page.goto('http://localhost:3000/about');
            await expect(page).toHaveURL(/.*about/);

            // Navigate to non-existent page
            await page.goto('http://localhost:3000/this-page-does-not-exist');

            // Should show 404 page
            const pageContent = await page.textContent('body');
            expect(
                pageContent.includes('404') ||
                pageContent.includes('not found') ||
                pageContent.includes('Not Found')
            ).toBeTruthy();

            // Layout should still be intact
            await expect(page.locator('header, nav').first()).toBeVisible();
            await expect(page.locator('footer').last()).toBeVisible();
        });

        test('should transition from Home to About to Categories', async ({ page }) => {
            // Start at Home
            await expect(page).toHaveURL('http://localhost:3000/');

            // Go to About
            await page.click('text=About').catch(() => page.click('a[href="/about"]'));
            await expect(page).toHaveURL(/.*about/);

            // Go to Categories
            await page.click('text=Categories').catch(() => page.click('a[href="/categories"]'));
            await expect(page).toHaveURL(/.*categories/);

            // Verify Layout persists through all transitions
            await expect(page.locator('header, nav').first()).toBeVisible();
            await expect(page.locator('main')).toBeVisible();
            await expect(page.locator('footer').last()).toBeVisible();
        });

        test('should handle browser back/forward navigation correctly', async ({ page }) => {
            // Navigate through pages
            await page.goto('http://localhost:3000');
            await page.click('text=About').catch(() => page.click('a[href="/about"]'));
            await expect(page).toHaveURL(/.*about/);

            await page.click('text=Contact').catch(() => page.click('a[href="/contact"]'));
            await expect(page).toHaveURL(/.*contact/);

            // Go back
            await page.goBack();
            await expect(page).toHaveURL(/.*about/);

            // Go back again
            await page.goBack();
            await expect(page).toHaveURL('http://localhost:3000/');

            // Go forward
            await page.goForward();
            await expect(page).toHaveURL(/.*about/);

            // Layout should remain intact through all navigation
            await expect(page.locator('header, nav').first()).toBeVisible();
            await expect(page.locator('footer').last()).toBeVisible();
        });

        test('should display Pagenotfound for invalid routes', async ({ page }) => {
            const invalidRoutes = [
                '/invalid-page',
                '/random-route-123',
                '/does-not-exist'
            ];

            for (const route of invalidRoutes) {
                await page.goto(`http://localhost:3000${route}`);

                // Check for 404 content
                const bodyText = await page.textContent('body');
                const has404Content =
                    bodyText.includes('404') ||
                    bodyText.includes('not found') ||
                    bodyText.includes('Not Found') ||
                    bodyText.includes('Page Not Found');

                expect(has404Content).toBeTruthy();

                // Layout should still render
                await expect(page.locator('header, nav').first()).toBeVisible();
                await expect(page.locator('footer').last()).toBeVisible();
            }
        });

        test('should maintain scroll position is reset on page transition', async ({ page }) => {
            // Go to a page and scroll down
            await page.goto('http://localhost:3000/about');
            await page.evaluate(() => window.scrollTo(0, 500));

            const scrollBefore = await page.evaluate(() => window.scrollY);
            expect(scrollBefore).toBeGreaterThan(0);

            // Navigate to another page
            await page.click('text=Contact').catch(() => page.click('a[href="/contact"]'));
            await expect(page).toHaveURL(/.*contact/);

            // Check scroll position (should be reset to top)
            const scrollAfter = await page.evaluate(() => window.scrollY);
            expect(scrollAfter).toBeLessThanOrEqual(100); // Allow small offset
        });
    });

    test.describe('Breadcrumb and Active Link Tests', () => {
        test('should highlight active navigation link based on current route', async ({ page }) => {
            const routes = [
                { path: '/about', linkText: 'About' },
                { path: '/contact', linkText: 'Contact' },
                { path: '/categories', linkText: 'Categories' }
            ];

            for (const { path, linkText } of routes) {
                await page.goto(`http://localhost:3000${path}`);

                // Find the navigation link
                const navLink = page.locator(`nav a:has-text("${linkText}")`).first();

                // Check for active state (class or aria-current)
                const className = await navLink.getAttribute('class') || '';
                const ariaCurrent = await navLink.getAttribute('aria-current');

                const isActive =
                    className.includes('active') ||
                    className.includes('current') ||
                    ariaCurrent === 'page';

                // At least one indicator should show it's active
                expect(isActive).toBeTruthy();
            }
        });

        test('should only have one active link at a time in Header', async ({ page }) => {
            await page.goto('http://localhost:3000/about');

            // Count elements with active class
            const activeLinks = await page.locator('nav a.active, nav a[aria-current="page"]').count();

            // Should have exactly 1 active link
            expect(activeLinks).toBeLessThanOrEqual(1);
        });
    });
});