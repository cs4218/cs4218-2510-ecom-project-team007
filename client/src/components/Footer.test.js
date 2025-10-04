import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import '@testing-library/jest-dom';
import Footer from "./Footer";

const renderWithRouter = (ui, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route);
  return render(ui, { wrapper: Router });
};

describe('Footer', () => {
  //   test('it renders the footer component successfully', () => {
  //     renderWithRouter(<Footer />);
  //     const footerElement = screen.getByRole('contentinfo');
  //     expect(footerElement).toBeInTheDocument();
  //   });

  test('it displays the correct copyright text', () => {
    renderWithRouter(<Footer />);
    const copyrightText = screen.getByText(/All Rights Reserved © TestingComp/i);
    expect(copyrightText).toBeInTheDocument();
  });

  test('it has a link to the About page', () => {
    renderWithRouter(<Footer />);
    const aboutLink = screen.getByRole('link', { name: /about/i });
    expect(aboutLink).toBeInTheDocument();
    expect(aboutLink).toHaveAttribute('href', '/about');
  });

  test('it has a link to the Contact page', () => {
    renderWithRouter(<Footer />);
    const contactLink = screen.getByRole('link', { name: /contact/i });
    expect(contactLink).toBeInTheDocument();
    expect(contactLink).toHaveAttribute('href', '/contact');
  });

  test('it has a link to the Privacy Policy page', () => {
    renderWithRouter(<Footer />);
    const policyLink = screen.getByRole('link', { name: /privacy policy/i });
    expect(policyLink).toBeInTheDocument();
    expect(policyLink).toHaveAttribute('href', '/policy');
  });
});
