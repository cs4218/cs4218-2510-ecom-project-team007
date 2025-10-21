class LayoutHelper {
    constructor(page) {
        this.page = page;
    }

    /**
     * Wait for spinner to appear and disappear
     */
    async waitForSpinner() {
        const spinner = this.page.locator('.spinner, [role="status"], .loading, .loader').first();

        try {
            await spinner.waitFor({ state: 'visible', timeout: 2000 });
            await spinner.waitFor({ state: 'hidden', timeout: 10000 });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Check if spinner is currently visible
     */
    async isSpinnerVisible() {
        const spinner = this.page.locator('.spinner, [role="status"], .loading, .loader').first();
        return await spinner.isVisible().catch(() => false);
    }

    /**
     * Get main content area
     */
    getMainContent() {
        return this.page.locator('main');
    }

    /**
     * Get header element
     */
    getHeader() {
        return this.page.locator('header, nav').first();
    }

    /**
     * Get footer element
     */
    getFooter() {
        return this.page.locator('footer').last();
    }

    /**
     * Verify all Layout components are rendered
     */
    async verifyAllComponentsRendered() {
        const header = await this.getHeader().isVisible();
        const main = await this.getMainContent().isVisible();
        const footer = await this.getFooter().isVisible();

        return header && main && footer;
    }

    /**
     * Get current scroll position
     */
    async getScrollPosition() {
        return await this.page.evaluate(() => ({
            x: window.scrollX,
            y: window.scrollY
        }));
    }

    /**
     * Scroll to position
     */
    async scrollTo(x, y) {
        await this.page.evaluate(({ x, y }) => {
            window.scrollTo(x, y);
        }, { x, y });
    }
}

module.exports = { LayoutHelper };
