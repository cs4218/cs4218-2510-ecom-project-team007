import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { act } from 'react-dom/test-utils';
import axios from 'axios';
import toast from 'react-hot-toast';
import Register from './Register';

// Mock dependencies
jest.mock('axios');
jest.mock('react-hot-toast');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Helper function to render component with router
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('User Registration - Integration Tests (Top-Down Approach)', () => {
  
  let mockNavigate;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock navigate function
    const mockedNavigate = require('react-router-dom');
    mockNavigate = jest.fn();
    mockedNavigate.useNavigate = () => mockNavigate;
    
    // Mock toast methods
    toast.success = jest.fn();
    toast.error = jest.fn();
  });

  // ============================================
  // LEVEL 1: HIGH-LEVEL FLOW - SUCCESSFUL REGISTRATION
  // ============================================
  
  describe('Level 1: Successful Registration Flow (Happy Path)', () => {
    test('should successfully register a new user with valid data', async () => {
      // Mock successful API response
      axios.post.mockResolvedValueOnce({
        data: {
          success: true,
          message: 'User registered successfully'
        }
      });

      renderWithRouter(<Register />);

      // Fill in all form fields
      fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), {
        target: { value: 'John Doe' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), {
        target: { value: 'john@example.com' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), {
        target: { value: 'password123' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), {
        target: { value: '12345678' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Address'), {
        target: { value: '123 Main Street' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your DOB'), {
        target: { value: '2000-01-01' }
      });
      fireEvent.change(screen.getByPlaceholderText('What is Your Favorite sports'), {
        target: { value: 'Football' }
      });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /REGISTER/i });
      
      await act(async () => {
        fireEvent.click(submitButton);
      });

      // Verify API was called with correct data
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith('/api/v1/auth/register', {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          phone: '12345678',
          address: '123 Main Street',
          DOB: '2000-01-01',
          answer: 'Football'
        });
      });

      // Verify success toast was shown
      expect(toast.success).toHaveBeenCalledWith('Register Successfully, please login');

      // Verify navigation to login page
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  // ============================================
  // LEVEL 2: FORM VALIDATION TESTS
  // ============================================
  
  describe('Level 2: Client-Side Validation', () => {
    
    test('should show error when phone contains non-numeric characters', async () => {
      renderWithRouter(<Register />);

      // Fill form with invalid phone number
      fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), {
        target: { value: 'John Doe' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), {
        target: { value: 'abc12345' } // Invalid phone
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), {
        target: { value: 'john@example.com' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), {
        target: { value: 'password123' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Address'), {
        target: { value: '123 Main Street' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your DOB'), {
        target: { value: '2000-01-01' }
      });
      fireEvent.change(screen.getByPlaceholderText('What is Your Favorite sports'), {
        target: { value: 'Football' }
      });

      // Submit form
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /REGISTER/i }));
      });

      // Verify error toast was shown
      expect(toast.error).toHaveBeenCalledWith('Phone must contain only numbers');

      // Verify API was NOT called
      expect(axios.post).not.toHaveBeenCalled();
    });

    test('should show error when DOB is in the future', async () => {
      renderWithRouter(<Register />);

      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateString = futureDate.toISOString().split('T')[0];

      // Fill form with future DOB
      fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), {
        target: { value: 'John Doe' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), {
        target: { value: 'john@example.com' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), {
        target: { value: 'password123' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), {
        target: { value: '12345678' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Address'), {
        target: { value: '123 Main Street' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your DOB'), {
        target: { value: futureDateString } // Future date
      });
      fireEvent.change(screen.getByPlaceholderText('What is Your Favorite sports'), {
        target: { value: 'Football' }
      });

      // Submit form
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /REGISTER/i }));
      });

      // Verify error toast was shown
      expect(toast.error).toHaveBeenCalledWith('DOB cannot be in the future');

      // Verify API was NOT called
      expect(axios.post).not.toHaveBeenCalled();
    });

    test('should validate all required fields are present', () => {
      renderWithRouter(<Register />);

      // Verify all required fields exist
      expect(screen.getByPlaceholderText('Enter Your Name')).toBeRequired();
      expect(screen.getByPlaceholderText('Enter Your Email')).toBeRequired();
      expect(screen.getByPlaceholderText('Enter Your Password')).toBeRequired();
      expect(screen.getByPlaceholderText('Enter Your Phone')).toBeRequired();
      expect(screen.getByPlaceholderText('Enter Your Address')).toBeRequired();
      expect(screen.getByPlaceholderText('Enter Your DOB')).toBeRequired();
      expect(screen.getByPlaceholderText('What is Your Favorite sports')).toBeRequired();
    });

    test('should have email field with correct type', () => {
      renderWithRouter(<Register />);

      const emailInput = screen.getByPlaceholderText('Enter Your Email');
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    test('should have password field with correct type', () => {
      renderWithRouter(<Register />);

      const passwordInput = screen.getByPlaceholderText('Enter Your Password');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  // ============================================
  // LEVEL 3: BUSINESS LOGIC - DUPLICATE USER
  // ============================================
  
  describe('Level 3: Business Logic - Duplicate User Handling', () => {
    
    test('should show error when registering with existing email', async () => {
      // Mock API response for duplicate email
      axios.post.mockResolvedValueOnce({
        data: {
          success: false,
          message: 'Email already registered'
        }
      });

      renderWithRouter(<Register />);

      // Fill form with existing email
      fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), {
        target: { value: 'John Doe' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), {
        target: { value: 'existing@example.com' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), {
        target: { value: 'password123' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), {
        target: { value: '12345678' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Address'), {
        target: { value: '123 Main Street' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your DOB'), {
        target: { value: '2000-01-01' }
      });
      fireEvent.change(screen.getByPlaceholderText('What is Your Favorite sports'), {
        target: { value: 'Football' }
      });

      // Submit form
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /REGISTER/i }));
      });

      // Verify error toast was shown
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Email already registered');
      });

      // Verify navigation did NOT occur
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // LEVEL 4: COMPONENT BEHAVIOR
  // ============================================
  
  describe('Level 4: Component Behavior and Interactions', () => {
    
    test('should update state when user types in input fields', () => {
      renderWithRouter(<Register />);

      const nameInput = screen.getByPlaceholderText('Enter Your Name');
      const emailInput = screen.getByPlaceholderText('Enter Your Email');
      const phoneInput = screen.getByPlaceholderText('Enter Your Phone');

      // Type in fields
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(phoneInput, { target: { value: '12345678' } });

      // Verify values are updated
      expect(nameInput).toHaveValue('John Doe');
      expect(emailInput).toHaveValue('john@example.com');
      expect(phoneInput).toHaveValue('12345678');
    });

    test('should have autofocus on name field', () => {
      renderWithRouter(<Register />);

      const nameInput = screen.getByPlaceholderText('Enter Your Name');
      expect(nameInput).toHaveAttribute('autoFocus');
    });

    test('should set max date constraint for DOB field', () => {
      renderWithRouter(<Register />);

      const dobInput = screen.getByPlaceholderText('Enter Your DOB');
      const today = new Date().toISOString().split('T')[0];

      expect(dobInput).toHaveAttribute('max', today);
    });

    test('should display correct form title', () => {
      renderWithRouter(<Register />);

      expect(screen.getByRole('heading', { name: /REGISTER FORM/i })).toBeInTheDocument();
    });
  });

  // ============================================
  // LEVEL 5: ERROR HANDLING
  // ============================================
  
  describe('Level 5: API Error Handling', () => {
    
    test('should handle network errors gracefully', async () => {
      // Mock network error
      axios.post.mockRejectedValueOnce(new Error('Network Error'));

      renderWithRouter(<Register />);

      // Fill form
      fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), {
        target: { value: 'John Doe' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), {
        target: { value: 'john@example.com' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), {
        target: { value: 'password123' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), {
        target: { value: '12345678' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Address'), {
        target: { value: '123 Main Street' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your DOB'), {
        target: { value: '2000-01-01' }
      });
      fireEvent.change(screen.getByPlaceholderText('What is Your Favorite sports'), {
        target: { value: 'Football' }
      });

      // Submit form
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /REGISTER/i }));
      });

      // Verify error toast was shown
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Something went wrong');
      });
    });

    test('should handle server errors (500) gracefully', async () => {
      // Mock server error
      axios.post.mockRejectedValueOnce({
        response: { status: 500, data: { message: 'Internal Server Error' } }
      });

      renderWithRouter(<Register />);

      // Fill and submit form
      fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), {
        target: { value: 'John Doe' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), {
        target: { value: 'john@example.com' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), {
        target: { value: 'password123' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), {
        target: { value: '12345678' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Address'), {
        target: { value: '123 Main Street' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your DOB'), {
        target: { value: '2000-01-01' }
      });
      fireEvent.change(screen.getByPlaceholderText('What is Your Favorite sports'), {
        target: { value: 'Football' }
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /REGISTER/i }));
      });

      // Verify error handling
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Something went wrong');
      });
    });
  });

  // ============================================
  // LEVEL 6: EDGE CASES
  // ============================================
  
  describe('Level 6: Edge Cases and Boundary Conditions', () => {
    
    test('should handle special characters in name field', async () => {
      axios.post.mockResolvedValueOnce({
        data: { success: true }
      });

      renderWithRouter(<Register />);

      fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), {
        target: { value: "John O'Brien-Smith" }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), {
        target: { value: 'john@example.com' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), {
        target: { value: 'password123' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), {
        target: { value: '12345678' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Address'), {
        target: { value: '123 Main Street' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your DOB'), {
        target: { value: '2000-01-01' }
      });
      fireEvent.change(screen.getByPlaceholderText('What is Your Favorite sports'), {
        target: { value: 'Football' }
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /REGISTER/i }));
      });

      // Should successfully submit
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalled();
      });
    });

    test('should handle phone number with only zeros', async () => {
      renderWithRouter(<Register />);

      fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), {
        target: { value: '00000000' }
      });

      const phoneInput = screen.getByPlaceholderText('Enter Your Phone');
      expect(phoneInput).toHaveValue('00000000');
    });

    test('should handle minimum age (DOB is today)', async () => {
      axios.post.mockResolvedValueOnce({
        data: { success: true }
      });

      renderWithRouter(<Register />);

      const today = new Date().toISOString().split('T')[0];

      fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), {
        target: { value: 'John Doe' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), {
        target: { value: 'john@example.com' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), {
        target: { value: 'password123' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), {
        target: { value: '12345678' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your Address'), {
        target: { value: '123 Main Street' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter Your DOB'), {
        target: { value: today } // Today's date
      });
      fireEvent.change(screen.getByPlaceholderText('What is Your Favorite sports'), {
        target: { value: 'Football' }
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /REGISTER/i }));
      });

      // Should successfully submit (no error for DOB = today)
      await waitFor(() => {
        expect(toast.error).not.toHaveBeenCalledWith('DOB cannot be in the future');
      });
    });

    test('should handle very long input strings', () => {
      renderWithRouter(<Register />);

      const longString = 'a'.repeat(500);
      
      fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), {
        target: { value: longString }
      });

      expect(screen.getByPlaceholderText('Enter Your Name')).toHaveValue(longString);
    });

    test('should handle email with plus sign (valid email format)', () => {
      renderWithRouter(<Register />);

      fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), {
        target: { value: 'john+test@example.com' }
      });

      expect(screen.getByPlaceholderText('Enter Your Email')).toHaveValue('john+test@example.com');
    });
  });

  describe('Integration with Layout Component', () => {
    
    test('should render within Layout component', () => {
      renderWithRouter(<Register />);

      // Verify form is rendered
      expect(screen.getByRole('heading', { name: /REGISTER FORM/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /REGISTER/i })).toBeInTheDocument();
    });

    test('should apply correct CSS classes', () => {
      const { container } = renderWithRouter(<Register />);

      expect(container.querySelector('.form-container')).toBeInTheDocument();
      expect(container.querySelector('.title')).toBeInTheDocument();
    });
  });
});