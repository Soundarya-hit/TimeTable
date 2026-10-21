import { render, screen, fireEvent } from '@testing-library/react';
import { TimetableMasterData } from './timetable-master-data';

describe('TimetableMasterData Component', () => {
  const mockProps = {
    teachersInput: 'Teacher A, Teacher B',
    setTeachersInput: vi.fn(),
    classesInput: 'Class 1, Class 2',
    setClassesInput: vi.fn(),
    subjectsInput: 'Maths, Science',
    setSubjectsInput: vi.fn(),
    periodsPerDay: 8,
    setPeriodsPerDay: vi.fn(),
    teachers: ['Teacher A', 'Teacher B'],
    subjects: ['Maths', 'Science'],
    teacherTypes: { 'Teacher A': 'Full-Time' },
    setTeacherTypes: vi.fn(),
    teacherFreeCounts: { 'Teacher A': 1 },
    setTeacherFreeCounts: vi.fn(),
    subjectPriorities: { 'Maths': 3 },
    setSubjectPriorities: vi.fn(),
    onProceed: vi.fn((e) => e.preventDefault()),
    styles: {
      stepIndicator: {},
      label: {},
      textInput: {},
      assignmentBox: {},
      selectInput: {},
      primaryButton: {}
    }
  };

  test('renders master data input fields and options correctly', () => {
    render(<TimetableMasterData {...mockProps} />);

    // 1. Title Text - Corrected Text Matching
    expect(
      screen.getByText(/Page 1 of 3: Master Data, Configurations & Priorities/i)
    ).toBeInTheDocument();

    // 2. Default Input Values
    expect(screen.getByDisplayValue('Teacher A, Teacher B')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Class 1, Class 2')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Maths, Science')).toBeInTheDocument();
  });

  test('calls onProceed when form is submitted', () => {
    render(<TimetableMasterData {...mockProps} />);
    
    const submitButton = screen.getByRole('button', { name: /Next: Teacher Subject Assignments/i });
    fireEvent.click(submitButton);
    
    expect(mockProps.onProceed).toHaveBeenCalled();
  });
});