export const DAYS_LIST = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const generateTimetableDataUpload = ({
  teachersInput, classesInput, subjectsInput, periodsPerDay,
  uploadCategoryPeriods, categorySubjectMap, teacherTypes, teacherFreeCounts, teacherAvailability, assignments
}) => {
  const tList = teachersInput.split(',').map(t => t.trim()).filter(Boolean);
  const cList = classesInput.split(',').map(c => c.trim()).filter(Boolean);
  const sList = subjectsInput.split(',').map(s => s.trim()).filter(Boolean);

  const cTimetables = {};
  cList.forEach(c => {
    cTimetables[c] = {};
    DAYS_LIST.forEach(d => { cTimetables[c][d] = Array(periodsPerDay).fill(null); });
  });

  const tTimetables = {};
  tList.forEach(t => {
    tTimetables[t] = {};
    DAYS_LIST.forEach(d => { tTimetables[t][d] = Array(periodsPerDay).fill(null); });
  });

  // Teacher off-slots calculation (Common logic)
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
        for (let p = halfLimit; p < periodsPerDay; p++) unavailableSet.add(p);
      } else if (tType === 'Part-Time Second Half') {
        for (let p = 0; p < halfLimit; p++) unavailableSet.add(p);
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

  // Upload Category Based Weekly Targets Allocation
  const classSubjectWeeklyTargets = {};
  const mappedTargets = {};
  if (categorySubjectMap && uploadCategoryPeriods) {
    Object.entries(categorySubjectMap).forEach(([catName, subString]) => {
      const catPeriods = Number(uploadCategoryPeriods[catName]) || 4;
      const subsInCat = String(subString).split(',').map(s => s.trim()).filter(Boolean);
      subsInCat.forEach(sub => {
        mappedTargets[sub] = catPeriods;
      });
    });
  }

  cList.forEach(className => {
    classSubjectWeeklyTargets[className] = {};
    sList.forEach(sub => {
      classSubjectWeeklyTargets[className][sub] = mappedTargets[sub] !== undefined ? mappedTargets[sub] : 4;
    });
  });

  const classSubjectWeeklyCounts = {};
  const classSubjectDailyCounts = {};
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
            const weeklyTarget = classSubjectWeeklyTargets[className][sub] || 4;
            const weeklyCount = classSubjectWeeklyCounts[className][sub] || 0;
            const dailyCount = classSubjectDailyCounts[className][dayName][sub] || 0;

            const lastSubInfo = lastAssignedSubjectPerClass[className];
            if (lastSubInfo.subject === sub && lastSubInfo.count >= 2) return;
            if (weeklyCount >= weeklyTarget) return;
            if (dailyCount >= 2) return;

            let score = (weeklyTarget - weeklyCount) * 100 - dailyCount * 50 + Math.random() * 10;
            possibleMatches.push({ teacher, subject: sub, score });
          });
        });

        if (possibleMatches.length > 0) {
          possibleMatches.sort((a, b) => b.score - a.score);
          const best = possibleMatches[0];
          
          cTimetables[className][dayName][p] = { subject: best.subject, teacher: best.teacher };
          tTimetables[best.teacher][dayName][p] = { subject: best.subject, class: className };
          
          classSubjectWeeklyCounts[className][best.subject] = (classSubjectWeeklyCounts[className][best.subject] || 0) + 1;
          classSubjectDailyCounts[className][dayName][best.subject] = (classSubjectDailyCounts[className][dayName][best.subject] || 0) + 1;

          if (lastAssignedSubjectPerClass[className].subject === best.subject) {
            lastAssignedSubjectPerClass[className].count += 1;
          } else {
            lastAssignedSubjectPerClass[className] = { subject: best.subject, count: 1 };
          }
        } else {
          unassignedSlotsCount++;
        }
      });
    }
  });

  return { classTimetables: cTimetables, teacherTimetables: tTimetables, unassignedSlotsCount };
};