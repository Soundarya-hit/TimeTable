import { render, screen, fireEvent } from '@testing-library/react';
import { TimetableAdvancedConstraints } from './timetable-advanced-constraints';

describe('TimetableAdvancedConstraints Component', () => {
  const mockProps = {
    teachers: ['Teacher A', 'Teacher PT'],
    classes: ['Class 1', 'Class 2'],
    subjects: ['Maths', 'Science'],
    periodsPerDay: 4,
    subjectPriorities: { Maths: 3, Science: 2 },
    subjectPeriodCounts: { Maths: 5, Science: 5 },
    generationMode: 'priority',
    teacherCategory: { 'Teacher A': 'UG Only' },
    setTeacherCategory: vi.fn(),
    teacherSpecificFreeSlots: {},
    setTeacherSpecificFreeSlots: vi.fn(),
    partTimeDayConfig: {},
    setPartTimeDayConfig: vi.fn(),
    subjectTimeSlotRules: {},
    setSubjectTimeSlotRules: vi.fn(),
    teacherTypes: { 'Teacher A': 'Full-Time', 'Teacher PT': 'Part-Time' },
    onBack: vi.fn(),
    onProceed: vi.fn(),
    styles: {
      stepIndicator: {},
      assignmentBox: {},
      selectInput: {},
      primaryButton: {},
      secondaryButton: {}
    }
  };

  test('1. renders advanced constraints header and navigation sub-tabs correctly', () => {
    render(<TimetableAdvancedConstraints {...mockProps} />);

    // Check main title indicator
    expect(screen.getByText(/Page 1.5 of 3: Advanced Teacher & Subject Scheduling Rules/i)).toBeInTheDocument();

    // Check sub-tabs
    expect(screen.getByRole('button', { name: /Teacher PG\/UG & Specific Free Slots/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Part-Time Specific Day Shifts/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Subject Time Restrictions/i })).toBeInTheDocument();
  });

  test('2. switches between tabs and renders content properly', () => {
    render(<TimetableAdvancedConstraints {...mockProps} />);

    // Default tab is Teacher Category
    expect(screen.getByText(/Teacher Designation & Free Period Selection/i)).toBeInTheDocument();

    // Switch to Part-Time Days tab
    const partTimeTabButton = screen.getByRole('button', { name: /Part-Time Specific Day Shifts/i });
    fireEvent.click(partTimeTabButton);
    expect(screen.getByText(/Specific Day Shift Matrix for Part-Time Teachers/i)).toBeInTheDocument();

    // Switch to Subject Rules tab
    const subjectRulesTabButton = screen.getByRole('button', { name: /Subject Time Restrictions/i });
    fireEvent.click(subjectRulesTabButton);
    expect(screen.getByText(/Subject Morning \/ Afternoon Session Rules/i)).toBeInTheDocument();
  });

  test('3. triggers onBack and onProceed navigation callbacks correctly', () => {
    render(<TimetableAdvancedConstraints {...mockProps} />);

    // Click Back button
    const backButton = screen.getByRole('button', { name: /Back to Master Data/i });
    fireEvent.click(backButton);
    expect(mockProps.onBack).toHaveBeenCalled();

    // Click Proceed button
    const proceedButton = screen.getByRole('button', { name: /Next: Teacher Subject Assignments/i });
    fireEvent.click(proceedButton);
    expect(mockProps.onProceed).toHaveBeenCalled();
  });

  test('4. allows changing teacher category and toggling specific free slots', () => {
    // Render with Teacher A configured as 'Both PG & UG' to render the free slot buttons grid
    const customProps = {
      ...mockProps,
      teacherCategory: { 'Teacher A': 'Both PG & UG' }
    };
    render(<TimetableAdvancedConstraints {...customProps} />);

    // Use getAllByDisplayValue to handle multiple matching select elements securely
    const categorySelects = screen.getAllByDisplayValue(/Both PG & UG/i);
    fireEvent.change(categorySelects[0], { target: { value: 'UG Only' } });
    expect(mockProps.setTeacherCategory).toHaveBeenCalled();

    // Test toggling specific free slots for Teacher A (Monday, Period 1 button)
    const freeSlotButton = screen.getAllByRole('button', { name: /P1 ✅/i })[0];
    fireEvent.click(freeSlotButton);
    expect(mockProps.setTeacherSpecificFreeSlots).toHaveBeenCalled();
  });

  test('5. allows updating subject time slot rules', () => {
    render(<TimetableAdvancedConstraints {...mockProps} />);

    // Switch to Subject Rules tab
    const subjectRulesTabButton = screen.getByRole('button', { name: /Subject Time Restrictions/i });
    fireEvent.click(subjectRulesTabButton);

    // Change rule for Maths
    const subjectRuleSelect = screen.getAllByDisplayValue(/Any Time/i)[0];
    fireEvent.change(subjectRuleSelect, { target: { value: 'Morning Only' } });
    expect(mockProps.setSubjectTimeSlotRules).toHaveBeenCalled();
  });
});