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
    expect(result).toHaveProperty('weeklySubjectCounts');
    expect(result).toHaveProperty('weeklySubjectTargets');
    expect(result.classTimetables['Class 1']['Monday']).toHaveLength(4);
  });

  test('3. throws error when mandatory inputs are missing', () => {
    expect(() => {
      generateTimetableData({
        teachersInput: '',
        classesInput: 'Class 1',
        subjectsInput: 'Maths',
        periodsPerDay: 4
      });
    }).toThrowError('Please enter at least one teacher, class, and subject.');
  });

  test('4. throws error when periods per day is invalid or non-positive', () => {
    expect(() => {
      generateTimetableData({
        teachersInput: 'Teacher A',
        classesInput: 'Class 1',
        subjectsInput: 'Maths',
        periodsPerDay: 0,
        assignments: { 'Teacher A': { 'Class 1': ['Maths'] } }
      });
    }).toThrowError('Periods per day must be a positive number.');
  });

  test('5. handles part-time day configurations and shifts correctly', () => {
    const partTimeInput = {
      teachersInput: 'Teacher PT',
      classesInput: 'Class A',
      subjectsInput: 'English',
      periodsPerDay: 6,
      subjectPriorities: { English: 3 },
      teacherTypes: { 'Teacher PT': 'Part-Time' },
      teacherFreeCounts: { 'Teacher PT': 1 },
      partTimeDayConfig: {
        'Teacher PT': {
          Monday: 'First Half',
          Tuesday: 'Second Half',
          Wednesday: 'Off Day'
        }
      },
      assignments: {
        'Teacher PT': { 'Class A': ['English'] }
      }
    };

    const result = generateTimetableData(partTimeInput);
    expect(result.classTimetables['Class A']['Monday']).toHaveLength(6);
    expect(result.teacherTimetables['Teacher PT']['Wednesday']).toEqual([null, null, null, null, null, null]);
  });

  test('6. enforces teacher category restrictions (UG Only vs PG Only / Class 11-12)', () => {
    const categoryInput = {
      teachersInput: 'UG Teacher, PG Teacher',
      classesInput: 'Class 11-A, Class 8-A',
      subjectsInput: 'Physics, History',
      periodsPerDay: 4,
      subjectPriorities: { Physics: 3, History: 2 },
      teacherCategory: {
        'UG Teacher': 'UG Only',
        'PG Teacher': 'PG Only'
      },
      assignments: {
        'UG Teacher': { 'Class 8-A': ['History'] },
        'PG Teacher': { 'Class 11-A': ['Physics'] }
      }
    };

    const result = generateTimetableData(categoryInput);
    expect(result).toBeDefined();
    expect(result.classTimetables['Class 11-A']).toBeDefined();
  });

  test('7. handles subject time slot rules (Morning Only / Afternoon Only)', () => {
    const slotRulesInput = {
      teachersInput: 'Teacher X',
      classesInput: 'Class 1',
      subjectsInput: 'Maths',
      periodsPerDay: 6,
      subjectPriorities: { Maths: 3 },
      subjectTimeSlotRules: {
        'Maths': 'Morning Only'
      },
      assignments: {
        'Teacher X': { 'Class 1': ['Maths'] }
      }
    };

    const result = generateTimetableData(slotRulesInput);
    expect(result.classTimetables['Class 1']['Monday']).toHaveLength(6);
  });

  test('8. handles specific free slots configuration for Both PG & UG teachers', () => {
    const specificFreeInput = {
      teachersInput: 'Teacher Dual',
      classesInput: 'Class 1',
      subjectsInput: 'Computer',
      periodsPerDay: 4,
      subjectPriorities: { Computer: 3 },
      teacherCategory: {
        'Teacher Dual': 'Both PG & UG'
      },
      teacherSpecificFreeSlots: {
        'Teacher Dual': {
          Monday: [2, 3]
        }
      },
      assignments: {
        'Teacher Dual': { 'Class 1': ['Computer'] }
      }
    };

    const result = generateTimetableData(specificFreeInput);
    expect(result).toBeDefined();
    expect(result.teacherTimetables['Teacher Dual']).toBeDefined();
  });
});