// Timetable generation logic.
// All class and teacher timetables are written together so that they can never
// disagree about a teacher's assignment to a period.

export const DAYS_LIST = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday'
];

export const generateTimetableData = ({
  teachersInput = '',
  classesInput = '',
  subjectsInput = '',
  periodsPerDay,
  subjectPriorities = {},
  teacherTypes = {},
  teacherFreeCounts = {},
  teacherAvailability = {},
  assignments = {},
  teacherCategory = {},
  teacherSpecificFreeSlots = {},
  partTimeDayConfig = {},
  subjectTimeSlotRules = {}
}) => {

  const tList = splitInput(teachersInput);
  const cList = splitInput(classesInput);
  const sList = splitInput(subjectsInput);
  const periodCount = Math.floor(Number(periodsPerDay));

  if (!tList.length || !cList.length || !sList.length) {
    throw new Error(
      'Please enter at least one teacher, class, and subject.'
    );
  }

  if (!Number.isFinite(periodCount) || periodCount < 1) {
    throw new Error('Periods per day must be a positive number.');
  }

  // --------------------------------------------------
  // 1. INITIALIZE CLASS TIMETABLES
  // --------------------------------------------------

  const cTimetables = Object.fromEntries(
    cList.map(c => [
      c,
      Object.fromEntries(
        DAYS_LIST.map(d => [d, Array(periodCount).fill(null)])
      )
    ])
  );

  // --------------------------------------------------
  // 2. INITIALIZE TEACHER TIMETABLES
  // --------------------------------------------------

  const tTimetables = Object.fromEntries(
    tList.map(t => [
      t,
      Object.fromEntries(
        DAYS_LIST.map(d => [d, Array(periodCount).fill(null)])
      )
    ])
  );

  const halfLimit = Math.floor(periodCount / 2);
  const teacherOffSlots = {};

  // --------------------------------------------------
  // 3. TEACHER FREE SLOT GENERATION
  // --------------------------------------------------

  tList.forEach((teacher, tIdx) => {

    teacherOffSlots[teacher] = {};

    const tType = teacherTypes[teacher] || 'Full-Time';

    const freeCountValue = Number(teacherFreeCounts[teacher]);

    const userFreeCount = Number.isFinite(freeCountValue)
      ? Math.max(0, Math.floor(freeCountValue))
      : 1;

    const tCat = teacherCategory[teacher] || 'UG Only';

    DAYS_LIST.forEach((day, dIdx) => {

      const unavailable = new Set();

      const dayShift = partTimeDayConfig[teacher]?.[day];

      // Part-Time / First Half / Second Half / Off Day

      if (
        dayShift === 'First Half' ||
        (tType === 'Part-Time' && !dayShift)
      ) {
        for (let p = halfLimit; p < periodCount; p++) {
          unavailable.add(p);
        }

      } else if (dayShift === 'Second Half') {

        for (let p = 0; p < halfLimit; p++) {
          unavailable.add(p);
        }

      } else if (dayShift === 'Off Day') {

        for (let p = 0; p < periodCount; p++) {
          unavailable.add(p);
        }
      }

      // Specific free slots for Both PG & UG teachers

      const specificFree = (
        teacherSpecificFreeSlots[teacher]?.[day] || []
      )
        .map(Number)
        .filter(
          p =>
            Number.isInteger(p) &&
            p >= 0 &&
            p < periodCount
        );

      if (
        tCat === 'Both PG & UG' &&
        specificFree.length > 0
      ) {
        for (let p = 0; p < periodCount; p++) {
          if (!specificFree.includes(p)) {
            unavailable.add(p);
          }
        }
      }

      const availableWindow = [];

      for (let p = 0; p < periodCount; p++) {
        if (!unavailable.has(p)) {
          availableWindow.push(p);
        }
      }

      // Free-period distribution

      const selectedFree = [];

      const effectiveFreeCount =
        tCat === 'Both PG & UG' && specificFree.length > 0
          ? 0
          : userFreeCount;

      for (
        let i = 0;
        i < effectiveFreeCount &&
        selectedFree.length < availableWindow.length;
        i++
      ) {

        if (availableWindow.length === 0) break;

        const chosenIndex =
          (tIdx * 5 + dIdx * 3 + i * 7) %
          availableWindow.length;

        const slot = availableWindow[chosenIndex];

        if (!selectedFree.includes(slot)) {
          selectedFree.push(slot);
        }
      }

      teacherOffSlots[teacher][day] = new Set([
        ...unavailable,
        ...selectedFree
      ]);

    });
  });

  // --------------------------------------------------
  // 4. TEACHER AVAILABILITY CHECK
  // --------------------------------------------------

  const isTeacherAvailable = (
    teacher,
    day,
    periodIndex
  ) => {

    const availability = teacherAvailability[teacher] || {
      type: 'Full-Time',
      days: {},
      timeSlot: 'Full-Day'
    };

    if (
      availability.days &&
      availability.days[day] === false
    ) {
      return false;
    }

    if (availability.type === 'Part-Time') {

      if (
        availability.timeSlot === 'Forenoon' &&
        periodIndex >= halfLimit
      ) {
        return false;
      }

      if (
        availability.timeSlot === 'Afternoon' &&
        periodIndex < halfLimit
      ) {
        return false;
      }
    }

    return true;
  };

  // --------------------------------------------------
  // 5. CLASS CATEGORY CHECK
  // --------------------------------------------------

  const isHigherSecondaryClass = className => {

    const normalized = String(className).toLowerCase();

    return /(^|\D)(11|12)(\D|$)/.test(normalized);
  };

  const teacherCanTeachClass = (
    teacher,
    className
  ) => {

    const category = teacherCategory[teacher] || 'UG Only';

    if (
      category === 'PG Only' &&
      !isHigherSecondaryClass(className)
    ) {
      return false;
    }

    if (
      category === 'UG Only' &&
      isHigherSecondaryClass(className)
    ) {
      return false;
    }

    return true;
  };

  // --------------------------------------------------
  // 6. SUBJECT TIME SLOT RULES
  // --------------------------------------------------

  const subjectAllowedAtPeriod = (
    subject,
    periodIndex
  ) => {

    const rule = subjectTimeSlotRules[subject] || 'Any Time';

    if (
      rule === 'Morning Only' &&
      periodIndex >= halfLimit
    ) {
      return false;
    }

    if (
      rule === 'Afternoon Only' &&
      periodIndex < halfLimit
    ) {
      return false;
    }

    return true;
  };

  // --------------------------------------------------
  // 7. GET ASSIGNED TEACHERS FOR EACH SUBJECT
  // --------------------------------------------------

  const getTeachersForClassSubject = (
    className,
    subject
  ) => {

    return tList.filter(teacher =>
      Array.isArray(assignments[teacher]?.[className]) &&
      assignments[teacher][className].includes(subject)
    );
  };

  // --------------------------------------------------
  // 8. IDENTIFY ALL ACTIVE SUBJECTS FOR EACH CLASS
  // --------------------------------------------------

  const activeSubjectsByClass = {};

  cList.forEach(className => {

    activeSubjectsByClass[className] = sList.filter(
      subject =>
        getTeachersForClassSubject(
          className,
          subject
        ).length > 0
    );

  });

  // --------------------------------------------------
  // 9. INITIALIZE WEEKLY AND DAILY COUNTS
  // --------------------------------------------------

  const weeklyCounts = {};
  const dailyCounts = {};
  const dailyLoads = {};
  const targets = {};

  cList.forEach(className => {

    weeklyCounts[className] = Object.fromEntries(
      sList.map(s => [s, 0])
    );

    dailyCounts[className] = Object.fromEntries(
      DAYS_LIST.map(day => [
        day,
        Object.fromEntries(
          sList.map(s => [s, 0])
        )
      ])
    );

    targets[className] = calculateTargets(
      activeSubjectsByClass[className],
      periodCount * DAYS_LIST.length,
      subjectPriorities
    );

  });

  tList.forEach(teacher => {

    dailyLoads[teacher] = Object.fromEntries(
      DAYS_LIST.map(day => [day, 0])
    );

  });

  // --------------------------------------------------
  // 10. VALID CANDIDATE GENERATION
  // --------------------------------------------------

  const getCandidates = (
    className,
    subject,
    day,
    period
  ) => {

    if (
      cTimetables[className][day][period] !== null
    ) {
      return [];
    }

    if (
      !subjectAllowedAtPeriod(subject, period)
    ) {
      return [];
    }

    return getTeachersForClassSubject(
      className,
      subject
    ).filter(teacher =>

      isTeacherAvailable(teacher, day, period) &&

      !teacherOffSlots[teacher][day].has(period) &&

      tTimetables[teacher][day][period] === null &&

      teacherCanTeachClass(teacher, className)

    );
  };

  // --------------------------------------------------
  // 11. PLACE LESSON IN BOTH TIMETABLES
  // --------------------------------------------------

  const placeLesson = (
    className,
    subject,
    teacher,
    day,
    period
  ) => {

    // Update class timetable

    cTimetables[className][day][period] = {
      subject,
      teacher
    };

    // Update teacher timetable simultaneously

    tTimetables[teacher][day][period] = {
      subject,
      class: className
    };

    weeklyCounts[className][subject] += 1;

    dailyCounts[className][day][subject] += 1;

    dailyLoads[teacher][day] += 1;
  };

  // --------------------------------------------------
  // 12. REQUIRED SUBJECT COVERAGE
  // --------------------------------------------------

  const requiredPairs = [];

  cList.forEach(className => {

    activeSubjectsByClass[className].forEach(subject => {

      requiredPairs.push({
        className,
        subject
      });

    });

  });

  // --------------------------------------------------
  // 13. UNDO LESSON FOR BACKTRACKING
  // --------------------------------------------------

  const undoLesson = (
    className,
    subject,
    teacher,
    day,
    period
  ) => {

    cTimetables[className][day][period] = null;

    tTimetables[teacher][day][period] = null;

    weeklyCounts[className][subject] -= 1;

    dailyCounts[className][day][subject] -= 1;

    dailyLoads[teacher][day] -= 1;
  };

  // --------------------------------------------------
  // 14. BACKTRACKING SCHEDULING
  // --------------------------------------------------

  let coverageSearchNodes = 0;

  const MAX_COVERAGE_SEARCH_NODES = 50000;

  const scheduleCoverage = remainingPairs => {

    if (remainingPairs.length === 0) {
      return true;
    }

    if (
      ++coverageSearchNodes >
      MAX_COVERAGE_SEARCH_NODES
    ) {
      return false;
    }

    // Minimum Remaining Values:
    // Schedule the most difficult subject first.

    let selectedIndex = -1;
    let selectedOptions = null;

    remainingPairs.forEach((pair, index) => {

      const options = [];

      DAYS_LIST.forEach((day, dayIndex) => {

        for (
          let period = 0;
          period < periodCount;
          period++
        ) {

          getCandidates(
            pair.className,
            pair.subject,
            day,
            period
          ).forEach(teacher => {

            options.push({
              teacher,
              day,
              dayIndex,
              period
            });

          });

        }

      });

      if (
        selectedOptions === null ||
        options.length < selectedOptions.length
      ) {

        selectedIndex = index;
        selectedOptions = options;

      }

    });

    if (
      !selectedOptions ||
      selectedOptions.length === 0
    ) {
      return false;
    }

    const pair = remainingPairs[selectedIndex];

    const nextPairs = remainingPairs.filter(
      (_, index) => index !== selectedIndex
    );

    // Prefer teachers with lower daily workload.

    selectedOptions.sort((a, b) =>

      dailyLoads[a.teacher][a.day] -
      dailyLoads[b.teacher][b.day] ||

      a.dayIndex - b.dayIndex ||

      a.period - b.period ||

      tList.indexOf(a.teacher) -
      tList.indexOf(b.teacher)

    );

    for (const option of selectedOptions) {

      placeLesson(
        pair.className,
        pair.subject,
        option.teacher,
        option.day,
        option.period
      );

      if (scheduleCoverage(nextPairs)) {
        return true;
      }

      undoLesson(
        pair.className,
        pair.subject,
        option.teacher,
        option.day,
        option.period
      );

      if (
        coverageSearchNodes >
        MAX_COVERAGE_SEARCH_NODES
      ) {
        break;
      }

    }

    return false;
  };

  // Run coverage scheduling.

  const allSubjectsCovered =
    scheduleCoverage(requiredPairs);

  // --------------------------------------------------
  // 15. BEST EFFORT COVERAGE FALLBACK
  // --------------------------------------------------

  // If the search budget is reached or no complete
  // solution exists, try scheduling remaining subjects.
  // All hard constraints are still respected.

  if (!allSubjectsCovered) {

    const remaining = requiredPairs.filter(pair =>

      weeklyCounts[pair.className][pair.subject] === 0

    );

    while (remaining.length) {

      let bestPairIndex = -1;
      let bestOptions = null;

      remaining.forEach((pair, pairIndex) => {

        const options = [];

        DAYS_LIST.forEach((day, dayIndex) => {

          for (
            let period = 0;
            period < periodCount;
            period++
          ) {

            getCandidates(
              pair.className,
              pair.subject,
              day,
              period
            ).forEach(teacher => {

              options.push({
                teacher,
                day,
                dayIndex,
                period
              });

            });

          }

        });

        if (
          bestOptions === null ||
          options.length < bestOptions.length
        ) {

          bestOptions = options;
          bestPairIndex = pairIndex;

        }

      });

      const pair = remaining.splice(
        bestPairIndex,
        1
      )[0];

      if (
        !bestOptions ||
        bestOptions.length === 0
      ) {
        continue;
      }

      bestOptions.sort((a, b) =>

        dailyLoads[a.teacher][a.day] -
        dailyLoads[b.teacher][b.day] ||

        a.dayIndex - b.dayIndex ||

        a.period - b.period

      );

      const chosen = bestOptions[0];

      placeLesson(
        pair.className,
        pair.subject,
        chosen.teacher,
        chosen.day,
        chosen.period
      );

    }

  }

  // --------------------------------------------------
  // 16. FILL REMAINING CLASS PERIODS
  // --------------------------------------------------

  DAYS_LIST.forEach(day => {

    for (
      let period = 0;
      period < periodCount;
      period++
    ) {

      const rotation =
        (DAYS_LIST.indexOf(day) + period) %
        cList.length;

      const rotatedClasses = [
        ...cList.slice(rotation),
        ...cList.slice(0, rotation)
      ];

      rotatedClasses.forEach(className => {

        if (
          cTimetables[className][day][period] !== null
        ) {
          return;
        }

        const candidates = [];

        activeSubjectsByClass[className].forEach(subject => {

          const dailyCount =
            dailyCounts[className][day][subject] || 0;

          // Maximum 3 periods of the same subject per day.

          if (dailyCount >= 3) {
            return;
          }

          if (
            weeklyCounts[className][subject] >=
            (targets[className][subject] || 0)
          ) {
            return;
          }

          getCandidates(
            className,
            subject,
            day,
            period
          ).forEach(teacher => {

            const priority = positivePriority(
              subjectPriorities[subject]
            );

            const target =
              targets[className][subject] || 0;

            const count =
              weeklyCounts[className][subject] || 0;

            const deficit = Math.max(
              0,
              target - count
            );

            const score =
              priority * 150 +
              deficit * 800 -
              count * 50 -
              dailyCount * 30 -
              dailyLoads[teacher][day] * 5;

            candidates.push({
              teacher,
              subject,
              score
            });

          });

        });

        if (!candidates.length) {
          return;
        }

        candidates.sort((a, b) =>

          b.score - a.score ||

          tList.indexOf(a.teacher) -
          tList.indexOf(b.teacher)

        );

        const best = candidates[0];

        placeLesson(
          className,
          best.subject,
          best.teacher,
          day,
          period
        );

      });

    }

  });

// --------------------------------------------------
// 16B. FILL REMAINING EMPTY SLOTS
// --------------------------------------------------

// Weekly targets are preferences, not hard restrictions.
// All other teacher, subject, and daily constraints remain active.

DAYS_LIST.forEach(day => {

  for (let period = 0; period < periodCount; period++) {

    const rotation =
      (DAYS_LIST.indexOf(day) + period) % cList.length;

    const rotatedClasses = [
      ...cList.slice(rotation),
      ...cList.slice(0, rotation)
    ];

    rotatedClasses.forEach(className => {

      // Skip already filled slots
      if (cTimetables[className][day][period] !== null) {
        return;
      }

      let fallbackCandidates = [];

      // Consider every assigned subject, even if its
      // weekly target has already been reached.
      activeSubjectsByClass[className].forEach(subject => {

        const dailyCount =
          dailyCounts[className][day][subject] || 0;

        // Preserve the existing maximum daily limit.
        if (dailyCount >= 3) {
          return;
        }

        const teachers = getCandidates(
          className,
          subject,
          day,
          period
        );

        teachers.forEach(teacher => {

          const priority = positivePriority(
            subjectPriorities[subject]
          );

          const weeklyCount =
            weeklyCounts[className][subject] || 0;

          const score =
            priority * 150 -
            weeklyCount * 50 -
            dailyCount * 30 -
            dailyLoads[teacher][day] * 5;

          fallbackCandidates.push({
            teacher,
            subject,
            score
          });

        });

      });

      // No valid teacher available: keep the slot empty.
      if (fallbackCandidates.length === 0) {
        return;
      }

      fallbackCandidates.sort(
        (a, b) => b.score - a.score
      );

      const best = fallbackCandidates[0];

      // Update both timetables simultaneously.
      placeLesson(
        className,
        best.subject,
        best.teacher,
        day,
        period
      );

    });

  }

});


  // --------------------------------------------------
  // 17. CHECK MISSING SUBJECTS
  // --------------------------------------------------

  const missingSubjectsByClass = {};

  cList.forEach(className => {

    missingSubjectsByClass[className] =
      activeSubjectsByClass[className].filter(
        subject =>
          weeklyCounts[className][subject] === 0
      );

  });

  // --------------------------------------------------
  // 18. CHECK UNASSIGNED SLOTS
  // --------------------------------------------------

  const unassignedSlots = [];

  cList.forEach(className => {

    DAYS_LIST.forEach(day => {

      cTimetables[className][day].forEach(
        (lesson, period) => {

          if (lesson === null) {

            unassignedSlots.push({
              class: className,
              day,
              period: period + 1
            });

          }

        }
      );

    });

  });

  const unassignedSlotsCount =
    unassignedSlots.length;

  // --------------------------------------------------
  // 19. RETURN FINAL TIMETABLE DATA
  // --------------------------------------------------

  return {

    classTimetables: cTimetables,

    teacherTimetables: tTimetables,

    unassignedSlotsCount,

    missingSubjectsByClass,

    unassignedSlots,

    weeklySubjectCounts: weeklyCounts,

    weeklySubjectTargets: targets,

    coverageSearchCompleted: allSubjectsCovered,

    classesWithoutSubjectAssignments: cList.filter(
      className =>
        activeSubjectsByClass[className].length === 0
    )

  };

};

// --------------------------------------------------
// HELPER FUNCTIONS
// --------------------------------------------------

function splitInput(value) {

  return String(value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);

}

// --------------------------------------------------
// SUBJECT PRIORITY
// --------------------------------------------------

function positivePriority(value) {

  const number = Number(value);

  return Number.isFinite(number) && number > 0
    ? number
    : 2;

}

// --------------------------------------------------
// WEEKLY SUBJECT TARGET CALCULATION
// --------------------------------------------------

function calculateTargets(
  subjects,
  totalSlots,
  priorities
) {

  const result = {};

  if (
    !subjects.length ||
    totalSlots <= 0
  ) {
    return result;
  }

  // Guarantee at least one target slot
  // for every assigned subject.

  subjects.forEach(subject => {

    result[subject] = 1;

  });

  // Distribute remaining periods according to priority.

  let remaining = Math.max(
    0,
    totalSlots - subjects.length
  );

  const totalWeight = subjects.reduce(
    (sum, subject) =>
      sum + positivePriority(priorities[subject]),
    0
  );

  const fractions = subjects.map(subject => {

    const exact =
      remaining *
      positivePriority(priorities[subject]) /
      totalWeight;

    const whole = Math.floor(exact);

    result[subject] += whole;

    return {
      subject,
      remainder: exact - whole
    };

  });

  let allocated = fractions.reduce(
    (sum, item) => {

      const exact =
        remaining *
        positivePriority(priorities[item.subject]) /
        totalWeight;

      return sum + Math.floor(exact);

    },
    0
  );

  // Largest remainder allocation.

  fractions.sort(
    (a, b) => b.remainder - a.remainder
  );

  for (
    let i = 0;
    i < remaining - allocated;
    i++
  ) {

    result[
      fractions[i % fractions.length].subject
    ] += 1;

  }

  return result;

}