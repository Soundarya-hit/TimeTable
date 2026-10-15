import { render, screen, fireEvent } from '@testing-library/react';
import TimetableDashboard from './timetable-dashboard';

describe('TimetableDashboard Component', () => {
  test('renders dashboard title and master data step initially', () => {
    render(<TimetableDashboard />);
    
    // Check main header
    expect(screen.getByText(/Advanced Timetable Generator System/i)).toBeInTheDocument();
    
    // Check if Page 1 (Master Data inputs) is rendered by default
    expect(screen.getByDisplayValue(/Teacher A, Teacher B/i)).toBeInTheDocument();
  });

  test('validates and shows error if inputs are cleared when proceeding to page 2', () => {
    render(<TimetableDashboard />);
    
    // Clear teachers input field
    const teachersInput = screen.getByDisplayValue(/Teacher A, Teacher B/i);
    fireEvent.change(teachersInput, { target: { value: '' } });
    
    // Click proceed button using its exact name
    const proceedButton = screen.getByRole('button', { name: /Next: Teacher Subject Assignments/i });
    fireEvent.click(proceedButton);
    
    // Check validation error message
    expect(screen.getByText(/Please provide valid comma-separated lists/i)).toBeInTheDocument();
  });
});