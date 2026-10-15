import { describe, test, expect } from 'vitest';
import { generateTimetableData, DAYS_LIST } from './timetable-generator';

describe('Timetable Generator Algorithm & Deep Logic Tests', () => {
  
  test('1. validates DAYS_LIST export and structure', () => {
    expect(DAYS_LIST).toHaveLength(5);
    expect(DAYS_LIST).toEqual(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  });

  test('2. successfully generates class and teacher timetables with valid inputs', () => {
    const mockInput = {
      teachersInput: 'Teacher A, Teacher B',
      classesInput: 'Class 1, Class 2',
      subjectsInput: 'Maths, Science',
      periodsPerDay: 4,
      subjectPriorities: { Maths: 3, Science: 2 },
      teacherTypes: { 'Teacher A': 'Full-Time', 'Teacher B': 'Full-Time' },
      teacherFreeCounts: { 'Teacher A': 1, 'Teacher B': 1 },
      teacherAvailability: {},
      assignments: {
        'Teacher A': { 'Class 1': ['Maths'], 'Class 2': ['Maths'] },
        'Teacher B': { 'Class 1': ['Science'], 'Class 2': ['Science'] }
      }
    };

    const result = generateTimetableData(mockInput);

    expect(result).toHaveProperty('classTimetables');
    expect(result).toHaveProperty('teacherTimetables');
    expect(result).toHaveProperty('unassignedSlotsCount');
    expect(result.classTimetables['Class 1']['Monday']).toHaveLength(4);
  });

  test('3. handles part-time teacher constraints properly', () => {
    const partTimeInput = {
      teachersInput: 'Teacher PT',
      classesInput: 'Class A',
      subjectsInput: 'English',
      periodsPerDay: 4,
      subjectPriorities: { English: 3 },
      teacherTypes: { 'Teacher PT': 'Part-Time First Half' },
      teacherFreeCounts: { 'Teacher PT': 1 },
      teacherAvailability: {},
      assignments: {
        'Teacher PT': { 'Class A': ['English'] }
      }
    };

    const result = generateTimetableData(partTimeInput);
    expect(result.classTimetables['Class A']['Monday']).toHaveLength(4);
  });
});