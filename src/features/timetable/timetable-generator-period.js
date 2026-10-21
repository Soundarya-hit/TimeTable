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

  // Initialize Teacher Timetables: Teacher -> Day -> Array of periods (Shared globally to avoid teacher double booking)
  const teacherTimetables = {};
  teachers.forEach(tName => {
    teacherTimetables[tName] = {};
    DAYS_LIST.forEach(day => {
      teacherTimetables[tName][day] = Array(periodsPerDay).fill(null);
    });
  });

  let unassignedSlotsCount = 0;

  const isTeacherAvailable = (tName, dayName, periodIndex) => {
    // 1. Check if teacher is already busy at this specific period slot
    if (teacherTimetables[tName]?.[dayName]?.[periodIndex] !== null) return false;

    // 2. Check Part-Time constraints
    const tType = teacherTypes[tName] || 'Full-Time';
    const halfPeriods = Math.ceil(periodsPerDay / 2);
    if (tType === 'Part-Time First Half' && periodIndex >= halfPeriods) return false;
    if (tType === 'Part-Time Second Half' && periodIndex < halfPeriods) return false;

    // 3. Strict Teacher Free Periods (`teacherFreeCounts`) check per day
    const freeCount = teacherFreeCounts[tName] !== undefined ? Number(teacherFreeCounts[tName]) : 1;
    const maxTeachingPeriods = periodsPerDay - freeCount;

    let currentTeachingCount = 0;
    for (let p = 0; p < periodsPerDay; p++) {
      if (teacherTimetables[tName][dayName][p] !== null) {
        currentTeachingCount++;
      }
    }
    
    // STRICT CHECK: If teacher has already reached max teaching limit for this day, do not allow more classes
    if (currentTeachingCount >= maxTeachingPeriods) {
      return false;
    }

    return true;
  };

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

  // Process each class independently and accurately
  classes.forEach(className => {
    let lastLabDayIdx = -2; // Track lab day spacing

    DAYS_LIST.forEach((dayName, dayIdx) => {
      let getWeeklyAllocated = (sub) => {
        let count = 0;
        DAYS_LIST.forEach(d => {
          classTimetables[className][d].forEach(slot => {
            if (slot && slot.subject === sub) count++;
          });
        });
        return count;
      };

      let getDailyAllocated = (sub) => {
        let count = 0;
        classTimetables[className][dayName].forEach(slot => {
          if (slot && slot.subject === sub) count++;
        });
        return count;
      };

      // 1. Handle Labs: If allowed (not on consecutive days i.e., dayIdx !== lastLabDayIdx + 1)
      let labSubjects = subjects.filter(sub => sub.toLowerCase().includes('lab'));
      labSubjects.forEach(labSub => {
        let targetLab = subjectPeriodCounts[labSub] !== undefined ? subjectPeriodCounts[labSub] : 0;
        if (targetLab > 0 && getWeeklyAllocated(labSub) < targetLab && getDailyAllocated(labSub) === 0) {
          if (dayIdx !== lastLabDayIdx + 1) {
            for (let p = 0; p < periodsPerDay - 1; p++) {
              if (classTimetables[className][dayName][p] === null && classTimetables[className][dayName][p + 1] === null) {
                let t1 = getAvailableTeacher(className, labSub, dayName, p);
                let t2 = getAvailableTeacher(className, labSub, dayName, p + 1);
                if (t1 && t2) {
                  classTimetables[className][dayName][p] = { subject: labSub, teacher: t1 };
                  teacherTimetables[t1][dayName][p] = { subject: labSub, class: className };

                  classTimetables[className][dayName][p + 1] = { subject: labSub, teacher: t2 };
                  teacherTimetables[t2][dayName][p + 1] = { subject: labSub, class: className };
                  lastLabDayIdx = dayIdx;
                  break;
                }
              }
            }
          }
        }
      });

      // 2. High frequency subjects (target >= 5) should appear at least once today if target not met
      let highFreqSubjects = subjects.filter(sub => {
        let target = subjectPeriodCounts[sub] !== undefined ? subjectPeriodCounts[sub] : 5;
        return target >= 5 && !sub.toLowerCase().includes('lab') && getWeeklyAllocated(sub) < target && getDailyAllocated(sub) === 0;
      });

      for (let pIdx = 0; pIdx < periodsPerDay; pIdx++) {
        if (classTimetables[className][dayName][pIdx] !== null) continue;

        let chosenSubject = null;

        if (highFreqSubjects.length > 0) {
          let candidate = highFreqSubjects[0];
          let t = getAvailableTeacher(className, candidate, dayName, pIdx);
          if (t) {
            chosenSubject = highFreqSubjects.shift();
          } else {
            let availableHighFreq = highFreqSubjects.find(sub => getAvailableTeacher(className, sub, dayName, pIdx) !== null);
            if (availableHighFreq) {
              highFreqSubjects = highFreqSubjects.filter(s => s !== availableHighFreq);
              chosenSubject = availableHighFreq;
            }
          }
        }

        if (!chosenSubject) {
          let pendingSubjects = subjects.filter(sub => {
            if (sub.toLowerCase().includes('lab')) return false;
            let target = subjectPeriodCounts[sub] !== undefined ? subjectPeriodCounts[sub] : 5;
            let weeklyCount = getWeeklyAllocated(sub);
            let dailyCount = getDailyAllocated(sub);

            if (weeklyCount >= target) return false;
            if (target < 5 && dailyCount >= 1) return false;
            if (target >= 5 && dailyCount >= 2) return false;

            // Avoid consecutive same subject for low count subjects (< 5)
            if (target < 5 && pIdx > 0) {
              let prevSlot = classTimetables[className][dayName][pIdx - 1];
              if (prevSlot && prevSlot.subject === sub) return false;
            }

            return true;
          });

          if (pendingSubjects.length === 0) {
            pendingSubjects = subjects.filter(sub => {
              let target = subjectPeriodCounts[sub] !== undefined ? subjectPeriodCounts[sub] : 5;
              let dailyCount = getDailyAllocated(sub);
              return getWeeklyAllocated(sub) < target && (target >= 5 ? dailyCount < 2 : dailyCount < 1) && !sub.toLowerCase().includes('lab');
            });
          }

          if (pendingSubjects.length === 0) continue;

          let validSub = pendingSubjects.find(sub => getAvailableTeacher(className, sub, dayName, pIdx) !== null);
          chosenSubject = validSub || pendingSubjects[0];
        }

        // Final consecutive check for target < 5
        let targetChosen = subjectPeriodCounts[chosenSubject] !== undefined ? subjectPeriodCounts[chosenSubject] : 5;
        if (targetChosen < 5 && pIdx > 0) {
          let prevSlot = classTimetables[className][dayName][pIdx - 1];
          if (prevSlot && prevSlot.subject === chosenSubject) {
            let altSubjects = subjects.filter(sub => {
              let t = subjectPeriodCounts[sub] !== undefined ? subjectPeriodCounts[sub] : 5;
              return t >= 5 && getWeeklyAllocated(sub) < t && getDailyAllocated(sub) < 2 && getAvailableTeacher(className, sub, dayName, pIdx) !== null;
            });
            if (altSubjects.length > 0) {
              chosenSubject = altSubjects[0];
            }
          }
        }

        let teacher = getAvailableTeacher(className, chosenSubject, dayName, pIdx);
        if (teacher) {
          classTimetables[className][dayName][pIdx] = { subject: chosenSubject, teacher };
          teacherTimetables[teacher][dayName][pIdx] = { subject: chosenSubject, class: className };

          // Try subject-to-lab consecutive pairing if applicable
          let labEquivalent = chosenSubject + ' Lab';
          if (subjects.includes(labEquivalent) && pIdx + 1 < periodsPerDay && classTimetables[className][dayName][pIdx + 1] === null) {
            let targetLab = subjectPeriodCounts[labEquivalent] || 0;
            if (getWeeklyAllocated(labEquivalent) < targetLab && getDailyAllocated(labEquivalent) < 2 && dayIdx !== lastLabDayIdx + 1) {
              let teacherLab = getAvailableTeacher(className, labEquivalent, dayName, pIdx + 1);
              if (teacherLab) {
                classTimetables[className][dayName][pIdx + 1] = { subject: labEquivalent, teacher: teacherLab };
                teacherTimetables[teacherLab][dayName][pIdx + 1] = { subject: labEquivalent, class: className };
                lastLabDayIdx = dayIdx;
                pIdx++;
              }
            }
          }
        } else {
          unassignedSlotsCount++;
        }
      }
    });
  });

  return {
    classTimetables,
    teacherTimetables,
    unassignedSlotsCount
  };
}