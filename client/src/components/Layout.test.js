import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Layout from './Layout';

jest.mock('./Header', () => () => <div data-testid="header">Header</div>);
jest.mock('./Footer', () => () => <div data-testid="footer">Footer</div>);
// jest.mock('react-hot-toast', () => ({
//     Toaster: () => <div data-testid="toaster">Toaster</div>,
// }));

describe('Layout', () => {
    afterEach(() => {
        document.head.innerHTML = ''; // clean up to prevent side-effects
    });

    test('it renders children passed to it', () => {
        render(
            <Layout>
                <div data-testid="child-element">Child</div>
            </Layout>
        );
        expect(screen.getByTestId('child-element')).toBeInTheDocument();
        expect(screen.getByText('Child')).toBeInTheDocument();
    });

    test('it renders the Header component', () => {
        render(<Layout />);
        expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    test('it renders the Footer component', () => {
        render(<Layout />);
        expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    // test('it renders the Toaster component', () => {
    //     render(<Layout />);
    //     expect(screen.getByTestId('toaster')).toBeInTheDocument();
    // });

    test('it sets the document title from props', async () => {
        const testTitle = 'Test Title';
        render(<Layout title={testTitle} />);
        await waitFor(() => {
            expect(document.title).toBe(testTitle);
        })
    });

    test('it sets the meta description from props', async () => {
        const testDescription = 'Test description with some test content.';
        render(<Layout description={testDescription} />);
        await waitFor(() => {
            const descriptionMetaTag = document.querySelector('meta[name="description"]');
            const description = descriptionMetaTag.getAttribute('content')
            expect(description).toBe(testDescription);
        });
    });

    test('it sets the meta keywords from props', async () => {
        const testKeywords = 'test, keywords, for, layout';
        render(<Layout keywords={testKeywords} />);
        await waitFor(() => {
            const keywordsMetaTag = document.querySelector('meta[name="keywords"]');
            const keywords = keywordsMetaTag.getAttribute('content')
            expect(keywords).toBe(testKeywords);
        });
    });

    test('it sets the meta author from props', async () => {
        const testAuthor = 'Test Author';
        render(<Layout author={testAuthor} />);
        await waitFor(() => {
            const authorMetaTag = document.querySelector('meta[name="author"]');
            const author = authorMetaTag.getAttribute('content')
            expect(author).toBe(testAuthor);
        });
    });
});