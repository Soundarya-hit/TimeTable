import { render, screen, fireEvent } from '@testing-library/react';
import { TimetableView } from './timetable-view';

describe('TimetableView Component', () => {
  const mockProps = {
    mainViewTab: 'class',
    setMainViewTab: vi.fn(),
    classes: ['1', '2'],
    teachers: ['Teacher A', 'Teacher B'],
    subjects: ['Maths', 'Science'],
    activeViewClass: '1',
    setActiveViewClass: vi.fn(),
    activeViewTeacher: 'Teacher A',
    setActiveViewTeacher: vi.fn(),
    classTimetables: {
      '1': {
        'Monday': [{ subject: 'Maths', teacher: 'Teacher A' }, null, null, null],
        'Tuesday': [null, null, null, null],
        'Wednesday': [null, null, null, null],
        'Thursday': [null, null, null, null],
        'Friday': [null, null, null, null]
      }
    },
    teacherTimetables: {
      'Teacher A': {
        'Monday': [{ subject: 'Maths', class: '1' }, null, null, null],
        'Tuesday': [null, null, null, null],
        'Wednesday': [null, null, null, null],
        'Thursday': [null, null, null, null],
        'Friday': [null, null, null, null]
      }
    },
    periodsPerDay: 4,
    getClassSubjectCounts: () => ({ Maths: 1 }),
    getTeacherClassAssignmentCounts: () => ({ '1 (Maths)': 1 }),
    teacherAssignedSubjectsMap: () => new Set(['Maths']),
    handleDownloadPDF: vi.fn(),
    editingSlot: null,
    setEditingSlot: vi.fn(),
    rearrangeSubject: 'Maths',
    setRearrangeSubject: vi.fn(),
    rearrangeTeacher: 'Teacher A',
    setRearrangeTeacher: vi.fn(),
    handleSaveRearrange: vi.fn(),
    onModify: vi.fn(),
    styles: {
      stepIndicator: {},
      summaryTopBar: {},
      summaryBadge: {},
      summaryBadgeTeacher: {},
      table: {},
      th: {},
      tdDay: {},
      tdCell: {},
      classSlotBox: {},
      teacherSlotBox: {},
      freeSlotBox: {},
      selectInput: {},
      label: {},
      secondaryButton: {},
      generateButton: {},
      pdfButton: {},
      modalOverlay: {},
      modalContent: {}
    }
  };

  test('renders class-wise view tab and timetable grid correctly', () => {
    render(<TimetableView {...mockProps} />);
    
    expect(screen.getByText(/Page 3 of 3: Generated Timetable Output Results/i)).toBeInTheDocument();
    expect(screen.getByText(/Class-wise Timetable View/i)).toBeInTheDocument();
    expect(screen.getByText(/Teacher-wise Timetable View/i)).toBeInTheDocument();
    expect(screen.getByText('Maths')).toBeInTheDocument();
    // Use function matcher for text split across element nodes (icon + name)
    expect(screen.getByText((content) => content.includes('Teacher A'))).toBeInTheDocument();
  });

  test('switches tabs when teacher-wise view button is clicked', () => {
    render(<TimetableView {...mockProps} />);
    
    const teacherTabButton = screen.getByText(/Teacher-wise Timetable View/i);
    fireEvent.click(teacherTabButton);
    
    expect(mockProps.setMainViewTab).toHaveBeenCalledWith('teacher');
  });

  test('triggers PDF download and modify actions', () => {
    render(<TimetableView {...mockProps} />);
    
    const pdfButton = screen.getByText(/Print \/ PDF/i);
    fireEvent.click(pdfButton);
    expect(mockProps.handleDownloadPDF).toHaveBeenCalled();

    const modifyButton = screen.getByText(/Modify Assignments/i);
    fireEvent.click(modifyButton);
    expect(mockProps.onModify).toHaveBeenCalled();
  });
});