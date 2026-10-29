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
  assignments
}) {
  const classes = classesInput.split(',').map(c => c.trim()).filter(Boolean);
  const teachers = teachersInput.split(',').map(t => t.trim()).filter(Boolean);
  const subjects = subjectsInput.split(',').map(s => s.trim()).filter(Boolean);

  // Initialize Class Timetables: Class -> Day -> Array of periods (size periodsPerDay)
  const classTimetables = {};
  classes.forEach(cName => {
    classTimetables[cName] = {};
    DAYS_LIST.forEach(day => {
      classTimetables[cName][day] = Array(periodsPerDay).fill(null);
    });
  });

  // Initialize Teacher Timetables: Shared globally to prevent double-booking
  const teacherTimetables = {};
  teachers.forEach(tName => {
    teacherTimetables[tName] = {};
    DAYS_LIST.forEach(day => {
      teacherTimetables[tName][day] = Array(periodsPerDay).fill(null);
    });
  });

  // Helper: Check Teacher Availability (Rule 1)
  const isTeacherAvailable = (tName, dayName, periodIndex) => {
    // 1. Check if teacher is already assigned in another class for this period
    if (teacherTimetables[tName]?.[dayName]?.[periodIndex] !== null) return false;

    // 2. Check Part-Time constraints
    const tType = teacherTypes[tName] || 'Full-Time';
    const halfPeriods = Math.ceil(periodsPerDay / 2);
    if (tType === 'Part-Time First Half' && periodIndex >= halfPeriods) return false;
    if (tType === 'Part-Time Second Half' && periodIndex < halfPeriods) return false;

    // 3. Strict Teacher Free Periods per day
    const freeCount = teacherFreeCounts[tName] !== undefined ? Number(teacherFreeCounts[tName]) : 1;
    const maxTeachingPeriods = periodsPerDay - freeCount;

    let currentTeachingCount = 0;
    for (let p = 0; p < periodsPerDay; p++) {
      if (teacherTimetables[tName][dayName][p] !== null) {
        currentTeachingCount++;
      }
    }

    if (currentTeachingCount >= maxTeachingPeriods) {
      return false;
    }

    return true;
  };

  // Helper: Get Eligible & Available Teacher for a class-subject slot
  const getAvailableTeacher = (className, subject, dayName, periodIndex) => {
    let eligibleTeachers = teachers.filter(tName => {
      const classMap = assignments[tName] || {};
      return (classMap[className] || []).includes(subject);
    });
    for (const tName of eligibleTeachers) {
      if (isTeacherAvailable(tName, dayName, periodIndex)) return tName;
    }
    return null;
  };

  // Helper: Exact Lab Matching (Rule 8)
  const getCorrespondingSubjectForLab = (labSubject) => {
    const cleanLabName = labSubject.toLowerCase().replace('lab', '').trim();
    return subjects.find(s => s.toLowerCase().trim() === cleanLabName) || null;
  };

  // Process Class-by-Class with Backtracking / Strict Allocation
  classes.forEach(className => {

    // Helper functions for allocation tracking
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
    // PHASE 1: ALLOCATE LABS CONTINUOUSLY (Rules 6, 7 & 8)
    // -------------------------------------------------------------
    const labSubjects = subjects.filter(sub => sub.toLowerCase().includes('lab'));

    labSubjects.forEach(labSub => {
      const targetLab = subjectPeriodCounts[labSub] !== undefined ? Number(subjectPeriodCounts[labSub]) : 0;
      let remainingLabPeriods = targetLab - getWeeklyAllocated(labSub);

      for (let dayIdx = 0; dayIdx < DAYS_LIST.length && remainingLabPeriods > 0; dayIdx++) {
        const dayName = DAYS_LIST[dayIdx];

        if (getDailyAllocated(labSub, dayName) > 0) continue;

        // Try Block Allocation (2 continuous periods if remaining >= 2)
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
                // Assign 2 continuous lab periods
                classTimetables[className][dayName][p] = { subject: labSub, teacher: t1 };
                teacherTimetables[t1][dayName][p] = { subject: labSub, class: className };

                classTimetables[className][dayName][p + 1] = { subject: labSub, teacher: t2 };
                teacherTimetables[t2][dayName][p + 1] = { subject: labSub, class: className };

                remainingLabPeriods -= 2;
                allocatedBlock = true;

                // Try pairing with related theory subject in adjacent period (Rule 6)
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

        // Single Lab Period Allocation (if remaining == 1 or double slot failed)
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
    // PHASE 2: REGULAR SUBJECT ALLOCATION (Rules 2, 3, 4 & 5)
    // -------------------------------------------------------------
    DAYS_LIST.forEach(dayName => {
      for (let pIdx = 0; pIdx < periodsPerDay; pIdx++) {
        if (classTimetables[className][dayName][pIdx] !== null) continue;

        let selectedSubject = null;
        let selectedTeacher = null;

        // Rule 4: Priority for subjects with target >= 5 not yet placed today
        const highFreqPending = subjects.filter(sub => {
          if (sub.toLowerCase().includes('lab')) return false;
          const target = subjectPeriodCounts[sub] !== undefined ? Number(subjectPeriodCounts[sub]) : 5;
          return (
            target >= 5 &&
            getWeeklyAllocated(sub) < target &&
            getDailyAllocated(sub, dayName) === 0
          );
        });

        for (const sub of highFreqPending) {
          const t = getAvailableTeacher(className, sub, dayName, pIdx);
          if (t) {
            selectedSubject = sub;
            selectedTeacher = t;
            break;
          }
        }

        // General pending subjects evaluation
        if (!selectedSubject) {
          const generalPending = subjects.filter(sub => {
            if (sub.toLowerCase().includes('lab')) return false;
            const target = subjectPeriodCounts[sub] !== undefined ? Number(subjectPeriodCounts[sub]) : 5;
            const weeklyCount = getWeeklyAllocated(sub);
            const dailyCount = getDailyAllocated(sub, dayName);

            // Rule 2 & 3: Stop if weekly target reached
            if (weeklyCount >= target) return false;

            // Rule 5: Target < 5 cannot appear more than once a day
            if (target < 5 && dailyCount >= 1) return false;

            // Avoid consecutive repeat for non-lab subjects
            if (pIdx > 0) {
              const prevSlot = classTimetables[className][dayName][pIdx - 1];
              if (prevSlot && prevSlot.subject === sub) return false;
            }

            return true;
          });

          for (const sub of generalPending) {
            const t = getAvailableTeacher(className, sub, dayName, pIdx);
            if (t) {
              selectedSubject = sub;
              selectedTeacher = t;
              break;
            }
          }
        }

        // Fallback: Relax consecutive check if needed while maintaining daily limits
        if (!selectedSubject) {
          const fallbackPending = subjects.filter(sub => {
            if (sub.toLowerCase().includes('lab')) return false;
            const target = subjectPeriodCounts[sub] !== undefined ? Number(subjectPeriodCounts[sub]) : 5;
            const weeklyCount = getWeeklyAllocated(sub);
            const dailyCount = getDailyAllocated(sub, dayName);

            if (weeklyCount >= target) return false;
            if (target < 5 && dailyCount >= 1) return false;

            return true;
          });

          for (const sub of fallbackPending) {
            const t = getAvailableTeacher(className, sub, dayName, pIdx);
            if (t) {
              selectedSubject = sub;
              selectedTeacher = t;
              break;
            }
          }
        }

        // Assign chosen slot
        if (selectedSubject && selectedTeacher) {
          classTimetables[className][dayName][pIdx] = {
            subject: selectedSubject,
            teacher: selectedTeacher
          };
          teacherTimetables[selectedTeacher][dayName][pIdx] = {
            subject: selectedSubject,
            class: className
          };
        }
      }
    });
  });

  // Calculate total unassigned slots
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