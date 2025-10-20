class NavigationHelper {
    constructor(page) {
        this.page = page;
    }

    /**
     * Navigate to a page and verify URL
     */
    async navigateTo(path, expectedUrlPattern) {
        await this.page.goto(`http://localhost:3000${path}`);
        await this.page.waitForLoadState('networkidle');

        if (expectedUrlPattern) {
            await this.page.waitForURL(expectedUrlPattern);
        }
    }

    /**
     * Click navigation link by text
     */
    async clickNavLink(linkText) {
        await this.page.click(`text=${linkText}`).catch(() =>
            this.page.click(`nav >> text=${linkText}`)
        );
        await this.page.waitForLoadState('networkidle');
    }

    /**
     * Verify Layout structure is present
     */
    async verifyLayoutStructure() {
        const header = this.page.locator('header, nav').first();
        const main = this.page.locator('main');
        const footer = this.page.locator('footer').last();

        await header.waitFor({ state: 'visible' });
        await main.waitFor({ state: 'visible' });
        await footer.waitFor({ state: 'visible' });

        return {
            header: await header.isVisible(),
            main: await main.isVisible(),
            footer: await footer.isVisible()
        };
    }

    /**
     * Check if a link is active
     */
    async isLinkActive(linkSelector) {
        const link = this.page.locator(linkSelector).first();
        const className = await link.getAttribute('class') || '';
        const ariaCurrent = await link.getAttribute('aria-current');

        return (
            className.includes('active') ||
            className.includes('current') ||
            ariaCurrent === 'page'
        );
    }

    /**
     * Get all navigation links
     */
    async getAllNavLinks() {
        return await this.page.locator('nav a').all();
    }

    /**
     * Verify meta tags
     */
    async verifyMetaTags() {
        const title = await this.page.title();
        const description = await this.page.locator('meta[name="description"]').getAttribute('content');
        const keywords = await this.page.locator('meta[name="keywords"]').getAttribute('content');
        const author = await this.page.locator('meta[name="author"]').getAttribute('content');

        return { title, description, keywords, author };
    }
}

module.exports = { NavigationHelper };

