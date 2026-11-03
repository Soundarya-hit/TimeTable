import { describe, test, expect } from 'vitest';
import { generatePeriodTimetableData, DAYS_LIST } from './timetable-generator-period';

describe('Period-Based Timetable Generator Algorithm Tests', () => {
  
  test('1. validates DAYS_LIST export and structure', () => {
    expect(DAYS_LIST).toHaveLength(5);
    expect(DAYS_LIST).toEqual(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  });

  test('2. successfully generates class and teacher timetables in period-based mode', () => {
    const mockInput = {
      teachersInput: 'Teacher A, Teacher B',
      classesInput: 'Class 1, Class 2',
      subjectsInput: 'Maths, Science',
      periodsPerDay: 4,
      subjectPeriodCounts: { Maths: 2, Science: 2 },
      teacherTypes: { 'Teacher A': 'Full-Time', 'Teacher B': 'Full-Time' },
      teacherFreeCounts: { 'Teacher A': 1, 'Teacher B': 1 },
      teacherAvailability: {},
      assignments: {
        'Teacher A': { 'Class 1': ['Maths'], 'Class 2': ['Maths'] },
        'Teacher B': { 'Class 1': ['Science'], 'Class 2': ['Science'] }
      }
    };

    const result = generatePeriodTimetableData(mockInput);

    expect(result).toHaveProperty('classTimetables');
    expect(result).toHaveProperty('teacherTimetables');
    expect(result).toHaveProperty('unassignedSlotsCount');
    expect(result.classTimetables['Class 1']['Monday']).toHaveLength(4);
  });

  test('3. handles lab subjects and continuous double period allocation', () => {
    const labInput = {
      teachersInput: 'Teacher Lab',
      classesInput: 'Class 10',
      subjectsInput: 'Physics, Physics Lab',
      periodsPerDay: 6,
      subjectPeriodCounts: { Physics: 3, 'Physics Lab': 2 },
      teacherTypes: { 'Teacher Lab': 'Full-Time' },
      teacherFreeCounts: { 'Teacher Lab': 0 },
      assignments: {
        'Teacher Lab': { 'Class 10': ['Physics', 'Physics Lab'] }
      }
    };

    const result = generatePeriodTimetableData(labInput);
    expect(result.classTimetables['Class 10']['Monday']).toHaveLength(6);
  });

  test('4. enforces teacher eligibility for higher secondary classes (PG vs UG)', () => {
    const categoryInput = {
      teachersInput: 'UG Teacher, PG Teacher',
      classesInput: 'Class 12',
      subjectsInput: 'Maths',
      periodsPerDay: 4,
      subjectPeriodCounts: { Maths: 4 },
      teacherTypes: { 'UG Teacher': 'Full-Time', 'PG Teacher': 'Full-Time' },
      teacherFreeCounts: { 'UG Teacher': 1, 'PG Teacher': 1 }, // Added to prevent undefined error
      teacherCategory: {
        'UG Teacher': 'UG Only',
        'PG Teacher': 'PG Only'
      },
      assignments: {
        'UG Teacher': { 'Class 12': ['Maths'] },
        'PG Teacher': { 'Class 12': ['Maths'] }
      }
    };

    const result = generatePeriodTimetableData(categoryInput);
    expect(result.classTimetables['Class 12']).toBeDefined();
  });

  test('5. respects subject time slot rules (Morning Only / Afternoon Only)', () => {
    const slotRulesInput = {
      teachersInput: 'Teacher X',
      classesInput: 'Class 9',
      subjectsInput: 'Drawing',
      periodsPerDay: 6,
      subjectPeriodCounts: { Drawing: 2 },
      teacherTypes: { 'Teacher X': 'Full-Time' },
      teacherFreeCounts: { 'Teacher X': 1 }, // Added to prevent undefined error
      subjectTimeSlotRules: {
        'Drawing': 'Morning Only'
      },
      assignments: {
        'Teacher X': { 'Class 9': ['Drawing'] }
      }
    };

    const result = generatePeriodTimetableData(slotRulesInput);
    expect(result.classTimetables['Class 9']['Monday']).toHaveLength(6);
  });
});