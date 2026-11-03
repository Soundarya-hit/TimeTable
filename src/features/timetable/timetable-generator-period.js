// Days list for the timetable week
export const DAYS_LIST = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export function generatePeriodTimetableData({
  teachersInput,
  classesInput,
  subjectsInput,
  periodsPerDay,
  subjectPeriodCounts,
  teacherTypes,
  teacherFreeCounts,
  teacherAvailability,
  assignments,
  // Advanced Constraints Parameters
  teacherCategory = {},
  teacherSpecificFreeSlots = {},
  partTimeDayConfig = {},
  subjectTimeSlotRules = {}
}) {
  const classes = classesInput.split(',').map(c => c.trim()).filter(Boolean);
  const teachers = teachersInput.split(',').map(t => t.trim()).filter(Boolean);
  const subjects = subjectsInput.split(',').map(s => s.trim()).filter(Boolean);

  const halfPeriods = Math.ceil(periodsPerDay / 2);

  // Initialize Class Timetables
  const classTimetables = {};
  classes.forEach(cName => {
    classTimetables[cName] = {};
    DAYS_LIST.forEach(day => {
      classTimetables[cName][day] = Array(periodsPerDay).fill(null);
    });
  });

  // Initialize Teacher Timetables
  const teacherTimetables = {};
  teachers.forEach(tName => {
    teacherTimetables[tName] = {};
    DAYS_LIST.forEach(day => {
      teacherTimetables[tName][day] = Array(periodsPerDay).fill(null);
    });
  });

  // Helper: Check if a class is Higher Secondary (PG: 11, 12) or Middle/High School (UG: 6-10)
  const isHigherSecondaryClass = (cName) => {
    const match = cName.match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      return num >= 11;
    }
    const lower = cName.toLowerCase();
    return lower.includes('11') || lower.includes('12') || lower.includes('pg') || lower.includes('higher');
  };

  // Helper: Teacher Eligibility by Designation
  const isTeacherEligibleForClass = (tName, className) => {
    const cat = teacherCategory[tName] || 'UG Only';
    const isHigher = isHigherSecondaryClass(className);

    if (cat === 'UG Only' && isHigher) return false;
    if (cat === 'PG Only' && !isHigher) return false;
    return true;
  };

  // Helper: Teacher Availability & Free Slot Logic Check
  const isTeacherAvailable = (tName, dayName, periodIndex, subjectName) => {
    // 1. Double booking check across classes
    if (teacherTimetables[tName]?.[dayName]?.[periodIndex] !== null) return false;

    // 2. Subject Time Slot Rules Check (Morning Only / Afternoon Only)
    const subRule = subjectTimeSlotRules[subjectName] || 'Any Time';
    if (subRule === 'Morning Only' && periodIndex >= halfPeriods) return false;
    if (subRule === 'Afternoon Only' && periodIndex < halfPeriods) return false;

    // 3. Both PG & UG vs Specific Free Slot Handling
    const cat = teacherCategory[tName] || 'UG Only';
    const specificFreeDays = teacherSpecificFreeSlots[tName] || {};
    const configuredSlotsOnDay = specificFreeDays[dayName] || [];

    if (cat === 'Both PG & UG') {
      // RULE: Both PG & UG teachers MUST ONLY be assigned in the periods marked as FREE by user
      if (!configuredSlotsOnDay.includes(periodIndex)) {
        return false;
      }
    } else {
      // For standard UG Only or PG Only, marked slots are restricted free periods
      if (configuredSlotsOnDay.includes(periodIndex)) {
        return false;
      }
    }

    // 4. Part-Time Specific Day Shift Config Check
    const ptConfig = partTimeDayConfig[tName] || {};
    const dayShift = ptConfig[dayName] || 'Full Day';

    if (dayShift === 'Off Day') return false;
    if (dayShift === 'First Half' && periodIndex >= halfPeriods) return false;
    if (dayShift === 'Second Half' && periodIndex < halfPeriods) return false;

    // Fallback to standard teacher type if no specific day config is set
    const tType = teacherTypes[tName] || 'Full-Time';
    if (dayShift === 'Full Day') {
      if (tType === 'Part-Time First Half' && periodIndex >= halfPeriods) return false;
      if (tType === 'Part-Time Second Half' && periodIndex < halfPeriods) return false;
    }

    // 5. Strict Teacher Free Periods per day limit (skip for 'Both PG & UG' as their free slots are explicitly fixed)
    if (cat !== 'Both PG & UG') {
      const freeCount = teacherFreeCounts[tName] !== undefined ? Number(teacherFreeCounts[tName]) : 1;
      const maxTeachingPeriods = periodsPerDay - freeCount;

      let currentTeachingCount = 0;
      for (let p = 0; p < periodsPerDay; p++) {
        if (teacherTimetables[tName][dayName][p] !== null) {
          currentTeachingCount++;
        }
      }

      if (currentTeachingCount >= maxTeachingPeriods) return false;
    }

    return true;
  };

  // Helper: Get Available Teacher sorted by priority (Priority given to 'Both PG & UG' teachers on their designated free slots)
  const getAvailableTeacher = (className, subject, dayName, periodIndex) => {
    let eligibleTeachers = teachers.filter(tName => {
      const classMap = assignments[tName] || {};
      const teachesSubject = (classMap[className] || []).includes(subject);
      return teachesSubject && isTeacherEligibleForClass(tName, className);
    });

    // Sort to prioritize 'Both PG & UG' teachers who have explicit limited window available
    eligibleTeachers.sort((a, b) => {
      const catA = teacherCategory[a] || 'UG Only';
      const catB = teacherCategory[b] || 'UG Only';
      if (catA === 'Both PG & UG' && catB !== 'Both PG & UG') return -1;
      if (catA !== 'Both PG & UG' && catB === 'Both PG & UG') return 1;
      return 0;
    });

    for (const tName of eligibleTeachers) {
      if (isTeacherAvailable(tName, dayName, periodIndex, subject)) return tName;
    }
    return null;
  };

  // Helper: Lab Matching
  const getCorrespondingSubjectForLab = (labSubject) => {
    const cleanLabName = labSubject.toLowerCase().replace('lab', '').trim();
    return subjects.find(s => s.toLowerCase().trim() === cleanLabName) || null;
  };

  // Process Class-by-Class Allocation
  classes.forEach(className => {
    const getWeeklyAllocated = (sub) => {
      let count = 0;
      DAYS_LIST.forEach(d => {
        classTimetables[className][d].forEach(slot => {
          if (slot && slot.subject === sub) count++;
        });
      });
      return count;
    };

    const getDailyAllocated = (sub, dayName) => {
      let count = 0;
      classTimetables[className][dayName].forEach(slot => {
        if (slot && slot.subject === sub) count++;
      });
      return count;
    };

    // -------------------------------------------------------------
    // PHASE 1: LAB PERIODS CONTINUOUS ALLOCATION
    // -------------------------------------------------------------
    const labSubjects = subjects.filter(sub => sub.toLowerCase().includes('lab'));

    labSubjects.forEach(labSub => {
      const targetLab = subjectPeriodCounts[labSub] !== undefined ? Number(subjectPeriodCounts[labSub]) : 0;
      let remainingLabPeriods = targetLab - getWeeklyAllocated(labSub);

      for (let dayIdx = 0; dayIdx < DAYS_LIST.length && remainingLabPeriods > 0; dayIdx++) {
        const dayName = DAYS_LIST[dayIdx];
        if (getDailyAllocated(labSub, dayName) > 0) continue;

        if (remainingLabPeriods >= 2) {
          let allocatedBlock = false;
          for (let p = 0; p < periodsPerDay - 1; p++) {
            if (
              classTimetables[className][dayName][p] === null &&
              classTimetables[className][dayName][p + 1] === null
            ) {
              const t1 = getAvailableTeacher(className, labSub, dayName, p);
              const t2 = getAvailableTeacher(className, labSub, dayName, p + 1);

              if (t1 && t2) {
                classTimetables[className][dayName][p] = { subject: labSub, teacher: t1 };
                teacherTimetables[t1][dayName][p] = { subject: labSub, class: className };

                classTimetables[className][dayName][p + 1] = { subject: labSub, teacher: t2 };
                teacherTimetables[t2][dayName][p + 1] = { subject: labSub, class: className };

                remainingLabPeriods -= 2;
                allocatedBlock = true;

                // Pair with corresponding theory subject if available
                const mainSubject = getCorrespondingSubjectForLab(labSub);
                if (mainSubject) {
                  const targetMain = subjectPeriodCounts[mainSubject] || 5;
                  if (getWeeklyAllocated(mainSubject) < targetMain) {
                    let mainSlotIdx = -1;
                    if (p > 0 && classTimetables[className][dayName][p - 1] === null) {
                      mainSlotIdx = p - 1;
                    } else if (p + 2 < periodsPerDay && classTimetables[className][dayName][p + 2] === null) {
                      mainSlotIdx = p + 2;
                    }

                    if (mainSlotIdx !== -1) {
                      const tMain = getAvailableTeacher(className, mainSubject, dayName, mainSlotIdx);
                      if (tMain) {
                        classTimetables[className][dayName][mainSlotIdx] = { subject: mainSubject, teacher: tMain };
                        teacherTimetables[tMain][dayName][mainSlotIdx] = { subject: mainSubject, class: className };
                      }
                    }
                  }
                }
                break;
              }
            }
          }
          if (allocatedBlock) continue;
        }

        // Single Lab Period Fallback
        if (remainingLabPeriods > 0) {
          for (let p = 0; p < periodsPerDay; p++) {
            if (classTimetables[className][dayName][p] === null) {
              const t = getAvailableTeacher(className, labSub, dayName, p);
              if (t) {
                classTimetables[className][dayName][p] = { subject: labSub, teacher: t };
                teacherTimetables[t][dayName][p] = { subject: labSub, class: className };
                remainingLabPeriods--;
                break;
              }
            }
          }
        }
      }
    });

    // -------------------------------------------------------------
    // PHASE 2: REGULAR SUBJECT ALLOCATION (Strict Subject-Centric Enforcement)
    // -------------------------------------------------------------
    const regularSubjects = subjects.filter(sub => !sub.toLowerCase().includes('lab'));

    regularSubjects.forEach(sub => {
      const target = subjectPeriodCounts[sub] !== undefined ? Number(subjectPeriodCounts[sub]) : 5;
      let allocated = getWeeklyAllocated(sub);

      // Pass 1: Allocate trying to respect daily spacing and consecutive checks
      for (let dayIdx = 0; dayIdx < DAYS_LIST.length && allocated < target; dayIdx++) {
        const dayName = DAYS_LIST[dayIdx];
        const dailyCount = getDailyAllocated(sub, dayName);

        if (target < 5 && dailyCount >= 1) continue;
        if (target >= 5 && dailyCount >= 2) continue;

        for (let pIdx = 0; pIdx < periodsPerDay && allocated < target; pIdx++) {
          if (classTimetables[className][dayName][pIdx] === null) {
            if (pIdx > 0) {
              const prevSlot = classTimetables[className][dayName][pIdx - 1];
              if (prevSlot && prevSlot.subject === sub) continue;
            }

            const t = getAvailableTeacher(className, sub, dayName, pIdx);
            if (t) {
              classTimetables[className][dayName][pIdx] = { subject: sub, teacher: t };
              teacherTimetables[t][dayName][pIdx] = { subject: sub, class: className };
              allocated++;
              break;
            }
          }
        }
      }

      // Pass 2: Fallback to fill remaining target periods without strict daily/consecutive restrictions if needed
      if (allocated < target) {
        for (let dayIdx = 0; dayIdx < DAYS_LIST.length && allocated < target; dayIdx++) {
          const dayName = DAYS_LIST[dayIdx];
          for (let pIdx = 0; pIdx < periodsPerDay && allocated < target; pIdx++) {
            if (classTimetables[className][dayName][pIdx] === null) {
              const t = getAvailableTeacher(className, sub, dayName, pIdx);
              if (t) {
                classTimetables[className][dayName][pIdx] = { subject: sub, teacher: t };
                teacherTimetables[t][dayName][pIdx] = { subject: sub, class: className };
                allocated++;
              }
            }
          }
        }
      }
    });
  });

  let unassignedSlotsCount = 0;
  classes.forEach(cName => {
    DAYS_LIST.forEach(d => {
      classTimetables[cName][d].forEach(slot => {
        if (slot === null) unassignedSlotsCount++;
      });
    });
  });

  return {
    classTimetables,
    teacherTimetables,
    unassignedSlotsCount
  };
}