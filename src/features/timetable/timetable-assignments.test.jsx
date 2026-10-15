import { render, screen, fireEvent } from '@testing-library/react';
import { TimetableAssignments } from './timetable-assignments';

describe('TimetableAssignments Component', () => {
  const mockProps = {
    teachers: ['Teacher A', 'Teacher B'],
    classes: ['10', '11'],
    subjects: ['Maths', 'Science'],
    activeTeacher: 'Teacher A',
    setActiveTeacher: vi.fn(),
    assignments: {
      'Teacher A': { '10': ['Maths'] }
    },
    handleToggleSubjectAssignment: vi.fn(),
    getAssignedTeacherForClassSubject: vi.fn().mockReturnValue(null),
    showHelpBoxPopup: false,
    setShowHelpBoxPopup: vi.fn(),
    helpPeriodsPerDay: 6,
    setHelpPeriodsPerDay: vi.fn(),
    helpFreePeriodCount: 1,
    setHelpFreePeriodCount: vi.fn(),
    helpAssignedClassesCount: 2,
    setHelpAssignedClassesCount: vi.fn(),
    onBack: vi.fn(),
    onGenerate: vi.fn(),
    styles: {
      stepIndicator: {},
      helpBoxButton: {},
      rightSideBoxPopup: {},
      textInput: {},
      selectInput: {},
      assignmentBox: {},
      classAssignmentRow: {},
      secondaryButton: {},
      generateButton: {}
    }
  };

  test('renders step indicator and teachers correctly', () => {
    render(<TimetableAssignments {...mockProps} />);
    
    expect(screen.getByText(/Page 2 of 3: Teacher Subject Assignment Matrix/i)).toBeInTheDocument();
    expect(screen.getByText('👨‍🏫 Teacher A')).toBeInTheDocument();
    expect(screen.getByText('👨‍🏫 Teacher B')).toBeInTheDocument();
  });

  test('calls setActiveTeacher when another teacher button is clicked', () => {
    render(<TimetableAssignments {...mockProps} />);
    
    fireEvent.click(screen.getByText('👨‍🏫 Teacher B'));
    expect(mockProps.setActiveTeacher).toHaveBeenCalledWith('Teacher B');
  });
test('toggles help box popup when help button is clicked', () => {
    render(<TimetableAssignments {...mockProps} />);
    
    // Title attribute-ah use panni exact help button-ah click panrom
    const helpButton = screen.getByTitle('Click for Workload & Per-Class Availability Calculation');
    fireEvent.click(helpButton);
    
    expect(mockProps.setShowHelpBoxPopup).toHaveBeenCalledWith(true);
  });  
});
