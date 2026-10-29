// Pure JS logic for Timetable Generation Algorithms & Helpers

export const DAYS_LIST = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const generateTimetableData = ({
  teachersInput,
  classesInput,
  subjectsInput,
  periodsPerDay,
  subjectPriorities,
  teacherTypes,
  teacherFreeCounts,
  teacherAvailability,
  assignments
}) => {
  const tList = teachersInput.split(',').map(t => t.trim()).filter(Boolean);
  const cList = classesInput.split(',').map(c => c.trim()).filter(Boolean);
  const sList = subjectsInput.split(',').map(s => s.trim()).filter(Boolean);

  const cTimetables = {};
  cList.forEach(c => {
    cTimetables[c] = {};
    DAYS_LIST.forEach(d => {
      cTimetables[c][d] = Array(periodsPerDay).fill(null);
    });
  });

  const tTimetables = {};
  tList.forEach(t => {
    tTimetables[t] = {};
    DAYS_LIST.forEach(d => {
      tTimetables[t][d] = Array(periodsPerDay).fill(null);
    });
  });

  const teacherOffSlots = {};
  const halfLimit = Math.floor(periodsPerDay / 2);

  tList.forEach((teacher, tIdx) => {
    teacherOffSlots[teacher] = {};
    const tType = teacherTypes[teacher] || 'Full-Time';
    const userFreeCount = teacherFreeCounts[teacher] !== undefined ? Number(teacherFreeCounts[teacher]) : 1;

    DAYS_LIST.forEach((dayName, dIdx) => {
      teacherOffSlots[teacher][dayName] = new Set();
      let unavailableSet = new Set();

      if (tType === 'Part-Time First Half') {
        for (let p = halfLimit; p < periodsPerDay; p++) {
          unavailableSet.add(p);
        }
      } else if (tType === 'Part-Time Second Half') {
        for (let p = 0; p < halfLimit; p++) {
          unavailableSet.add(p);
        }
      }

      let availableWindow = [];
      for (let p = 0; p < periodsPerDay; p++) {
        if (!unavailableSet.has(p)) availableWindow.push(p);
      }

      let selectedFree = [];
      for (let i = 0; i < userFreeCount && availableWindow.length > 0; i++) {
        let chosenIndex = (tIdx * 5 + dIdx * 3 + i * 7) % availableWindow.length;
        let slot = availableWindow[chosenIndex];
        while (selectedFree.includes(slot)) {
          chosenIndex = (chosenIndex + 1) % availableWindow.length;
          slot = availableWindow[chosenIndex];
        }
        selectedFree.push(slot);
      }

      unavailableSet.forEach(s => teacherOffSlots[teacher][dayName].add(s));
      selectedFree.forEach(s => teacherOffSlots[teacher][dayName].add(s));
    });
  });

  const isTeacherAvailable = (teacher, day, periodIndex) => {
    const avail = teacherAvailability[teacher] || { type: 'Full-Time', days: {}, timeSlot: 'Full-Day' };
    if (avail.type === 'Part-Time') {
      if (avail.days && avail.days[day] === false) return false;
      if (avail.timeSlot === 'Forenoon' && periodIndex >= 4) return false;
      if (avail.timeSlot === 'Afternoon' && periodIndex < 4) return false;
    }
    return true;
  };

  const getAssignedTeacherForClassSubject = (className, subject) => {
    for (const [tName, classMap] of Object.entries(assignments)) {
      if (classMap[className] && classMap[className].includes(subject)) {
        return tName;
      }
    }
    return null;
  };

  const totalClassSlots = DAYS_LIST.length * periodsPerDay;
  const classSubjectWeeklyTargets = {};

  cList.forEach(className => {
    classSubjectWeeklyTargets[className] = {};
    let activeClassSubjects = [];

    sList.forEach(sub => {
      const t = getAssignedTeacherForClassSubject(className, sub);
      if (t) {
        const userPriority = Number(subjectPriorities[sub]) || 2;
        activeClassSubjects.push({ subject: sub, priority: userPriority });
      }
    });

    if (activeClassSubjects.length === 0) {
      activeClassSubjects = sList.map(sub => ({ subject: sub, priority: Number(subjectPriorities[sub]) || 2 }));
    }

    const totalPriorityWeight = activeClassSubjects.reduce((sum, item) => sum + item.priority, 0);
    let allocatedSum = 0;
    let subjectTargets = [];

    activeClassSubjects.forEach((item) => {
      let exactTarget = (item.priority / totalPriorityWeight) * totalClassSlots;
      let baseTarget = Math.max(1, Math.floor(exactTarget));
      subjectTargets.push({
        subject: item.subject,
        baseTarget,
        remainder: exactTarget - Math.floor(exactTarget)
      });
      allocatedSum += baseTarget;
    });

    let diff = totalClassSlots - allocatedSum;
    if (diff > 0) {
      subjectTargets.sort((a, b) => b.remainder - a.remainder);
      for (let i = 0; i < diff; i++) {
        subjectTargets[i % subjectTargets.length].baseTarget += 1;
      }
    } else if (diff < 0) {
      subjectTargets.sort((a, b) => a.baseTarget - b.baseTarget);
      for (let i = 0; i < Math.abs(diff); i++) {
        if (subjectTargets[i].baseTarget > 1) {
          subjectTargets[i].baseTarget -= 1;
        }
      }
    }

    subjectTargets.forEach(st => {
      classSubjectWeeklyTargets[className][st.subject] = st.baseTarget;
    });
  });

  const classSubjectWeeklyCounts = {};
  const classSubjectDailyCounts = {};
  const teacherDailyLoad = {};
  const lastAssignedSubjectPerClass = {};

  cList.forEach(c => {
    classSubjectWeeklyCounts[c] = {};
    classSubjectDailyCounts[c] = {};
    lastAssignedSubjectPerClass[c] = { subject: null, count: 0 };
    DAYS_LIST.forEach(d => {
      classSubjectDailyCounts[c][d] = {};
      sList.forEach(s => { 
        classSubjectWeeklyCounts[c][s] = 0; 
        classSubjectDailyCounts[c][d][s] = 0; 
      });
    });
  });

  tList.forEach(t => {
    teacherDailyLoad[t] = {};
    DAYS_LIST.forEach(d => { teacherDailyLoad[t][d] = 0; });
  });

  let unassignedSlotsCount = 0;

  DAYS_LIST.forEach((dayName, dIdx) => {
    for (let p = 0; p < periodsPerDay; p++) {
      const rotatedClasses = [...cList.slice((dIdx + p) % cList.length), ...cList.slice(0, (dIdx + p) % cList.length)];

      rotatedClasses.forEach(className => {
        if (cTimetables[className][dayName][p] !== null) return;

        let possibleMatches = [];
        tList.forEach(teacher => {
          if (!isTeacherAvailable(teacher, dayName, p)) return;
          if (tTimetables[teacher][dayName][p] !== null) return;
          if (teacherOffSlots[teacher][dayName].has(p)) return;

          const classSubs = (assignments[teacher] && assignments[teacher][className]) || [];
          classSubs.forEach(sub => {
            const priority = subjectPriorities[sub] || 2;
            const weeklyTarget = classSubjectWeeklyTargets[className][sub] || 5;
            const weeklyCount = classSubjectWeeklyCounts[className][sub] || 0;
            const dailyCount = classSubjectDailyCounts[className][dayName][sub] || 0;

            const lastSubInfo = lastAssignedSubjectPerClass[className];
            if (lastSubInfo.subject === sub && lastSubInfo.count >= 2) return;
            if (weeklyCount >= weeklyTarget) return;
            if (dailyCount >= 2) return;

            let fairnessPenalty = weeklyCount * 100;
            let priorityWeight = priority * 200;
            let dailyPenalty = dailyCount * 50;
            let score = priorityWeight - fairnessPenalty - dailyPenalty + Math.random() * 10;

            possibleMatches.push({ teacher, subject: sub, priority, score });
          });
        });

        if (possibleMatches.length > 0) {
          possibleMatches.sort((a, b) => b.score - a.score);
          const best = possibleMatches[0];
          
          cTimetables[className][dayName][p] = { subject: best.subject, teacher: best.teacher };
          tTimetables[best.teacher][dayName][p] = { subject: best.subject, class: className };
          
          classSubjectWeeklyCounts[className][best.subject] = (classSubjectWeeklyCounts[className][best.subject] || 0) + 1;
          classSubjectDailyCounts[className][dayName][best.subject] = (classSubjectDailyCounts[className][dayName][best.subject] || 0) + 1;
          teacherDailyLoad[best.teacher][dayName] = (teacherDailyLoad[best.teacher][dayName] || 0) + 1;

          if (lastAssignedSubjectPerClass[className].subject === best.subject) {
            lastAssignedSubjectPerClass[className].count += 1;
          } else {
            lastAssignedSubjectPerClass[className] = { subject: best.subject, count: 1 };
          }
        } else {
          let fallbackMatches = [];
          tList.forEach(teacher => {
            if (!isTeacherAvailable(teacher, dayName, p)) return;
            if (tTimetables[teacher][dayName][p] !== null) return;
            if (teacherOffSlots[teacher][dayName].has(p)) return;
            const classSubs = (assignments[teacher] && assignments[teacher][className]) || [];
            classSubs.forEach(sub => {
              const priority = subjectPriorities[sub] || 2;
              const weeklyCount = classSubjectWeeklyCounts[className][sub] || 0;
              const weeklyTarget = classSubjectWeeklyTargets[className][sub] || 5;
              fallbackMatches.push({ teacher, subject: sub, priority, weeklyCount, weeklyTarget });
            });
          });

          if (fallbackMatches.length > 0) {
            fallbackMatches.sort((a, b) => {
              if (b.priority !== a.priority) return b.priority - a.priority;
              return (a.weeklyCount - a.weeklyTarget) - (b.weeklyCount - b.weeklyTarget);
            });
            const bestFB = fallbackMatches[0];
            cTimetables[className][dayName][p] = { subject: bestFB.subject, teacher: bestFB.teacher };
            tTimetables[bestFB.teacher][dayName][p] = { subject: bestFB.subject, class: className };
            classSubjectWeeklyCounts[className][bestFB.subject] = (classSubjectWeeklyCounts[className][bestFB.subject] || 0) + 1;
            classSubjectDailyCounts[className][dayName][bestFB.subject] = (classSubjectDailyCounts[className][dayName][bestFB.subject] || 0) + 1;
            teacherDailyLoad[bestFB.teacher][dayName] = (teacherDailyLoad[bestFB.teacher][dayName] || 0) + 1;
            lastAssignedSubjectPerClass[className] = { subject: bestFB.subject, count: 1 };
          } else {
            unassignedSlotsCount++;
          }
        }
      });
    }
  });

  // End of generateTimetableData function-ku munnadi, return statement eppadi irukanum:
  return {
    classTimetables: cTimetables,
    teacherTimetables: tTimetables,
    unassignedSlotsCount
  };
};