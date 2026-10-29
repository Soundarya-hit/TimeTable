import React, { useState, useEffect } from 'react';
import { generateTimetableData, DAYS_LIST } from './timetable-generator';
import { generatePeriodTimetableData } from './timetable-generator-period';
import { TimetableMasterData } from './timetable-master-data';
import { TimetableAssignments } from './timetable-assignments';
import { TimetableView } from './timetable-view';

export default function TimetableDashboard({ onBack }) {
  const [step, setStep] = useState('page1');
  const [mainViewTab, setMainViewTab] = useState('class');
  const [errorMessage, setErrorMessage] = useState('');
  const [optimizationNotice, setOptimizationNotice] = useState(null);
  
  // New State for Timetable Mode Selection
  const [generationMode, setGenerationMode] = useState('priority'); // 'priority' or 'period'
  
  const [teachersInput, setTeachersInput] = useState('Teacher A, Teacher B, Teacher C, Teacher D, Teacher E, Teacher F');
  const [classesInput, setClassesInput] = useState('Class 1, Class 2, Class 3, Class 4, Class 5');
  const [subjectsInput, setSubjectsInput] = useState('Maths, Science, English, Tamil, Social');
  const [periodsPerDay, setPeriodsPerDay] = useState(8);
  
  const [subjectPriorities, setSubjectPriorities] = useState({
    Maths: 3, Science: 3, English: 2, Tamil: 2, Social: 1
  });

  // New State for Period Counts per Week (Used in Period-Based Mode)
  const [subjectPeriodCounts, setSubjectPeriodCounts] = useState({
    Maths: 5, Science: 5, English: 4, Tamil: 4, Social: 3
  });
  
  const [teacherTypes, setTeacherTypes] = useState({});
  const [teacherFreeCounts, setTeacherFreeCounts] = useState({});
  const [teacherAvailability, setTeacherAvailability] = useState({});
  const [assignments, setAssignments] = useState({});
  const [activeTeacher, setActiveTeacher] = useState('');
  
  const [activeViewClass, setActiveViewClass] = useState('');
  const [activeViewTeacher, setActiveViewTeacher] = useState('');
  const [classTimetables, setClassTimetables] = useState(null);
  const [teacherTimetables, setTeacherTimetables] = useState(null);

  const [editingSlot, setEditingSlot] = useState(null);
  const [rearrangeSubject, setRearrangeSubject] = useState('');
  const [rearrangeTeacher, setRearrangeTeacher] = useState('');

  const [showHelpBoxPopup, setShowHelpBoxPopup] = useState(false);
  const [helpPeriodsPerDay, setHelpPeriodsPerDay] = useState(8);
  const [helpFreePeriodCount, setHelpFreePeriodCount] = useState(1);
  const [helpAssignedClassesCount, setHelpAssignedClassesCount] = useState(2);

  const classes = classesInput.split(',').map(c => c.trim()).filter(Boolean);
  const teachers = teachersInput.split(',').map(t => t.trim()).filter(Boolean);
  const subjects = subjectsInput.split(',').map(s => s.trim()).filter(Boolean);

  useEffect(() => {
    const tList = teachersInput.split(',').map(t => t.trim()).filter(Boolean);
    const cList = classesInput.split(',').map(c => c.trim()).filter(Boolean);
    const sList = subjectsInput.split(',').map(s => s.trim()).filter(Boolean);
    
    if (tList.length > 0 && !activeTeacher) setActiveTeacher(tList[0]);
    if (cList.length > 0 && !activeViewClass) setActiveViewClass(cList[0]);
    if (tList.length > 0 && !activeViewTeacher) setActiveViewTeacher(tList[0]);
    
    const newPriorities = { ...subjectPriorities };
    const newPeriodCounts = { ...subjectPeriodCounts };
    sList.forEach(sub => {
      if (newPriorities[sub] === undefined) newPriorities[sub] = 2;
      if (newPeriodCounts[sub] === undefined) newPeriodCounts[sub] = 5;
    });
    setSubjectPriorities(newPriorities);
    setSubjectPeriodCounts(newPeriodCounts);

    const updatedTypes = { ...teacherTypes };
    const updatedFreeCounts = { ...teacherFreeCounts };
    tList.forEach(t => {
      if (!updatedTypes[t]) updatedTypes[t] = 'Full-Time';
      if (updatedFreeCounts[t] === undefined) updatedFreeCounts[t] = 1;
    });
    setTeacherTypes(updatedTypes);
    setTeacherFreeCounts(updatedFreeCounts);
  }, [teachersInput, classesInput, subjectsInput]);

  const handleProceedToPage2 = (e) => {
    e.preventDefault();
    const tList = teachersInput.split(',').map(t => t.trim()).filter(Boolean);
    const cList = classesInput.split(',').map(c => c.trim()).filter(Boolean);
    const sList = subjectsInput.split(',').map(s => s.trim()).filter(Boolean);
    if (tList.length === 0 || cList.length === 0 || sList.length === 0) {
      setErrorMessage('Please provide valid comma-separated lists for Teachers, Classes, and Subjects.');
      return;
    }
    setErrorMessage('');
    setStep('page2');
  };

  const handleToggleSubjectAssignment = (teacher, className, subject) => {
    const currentTeacherMap = assignments[teacher] || {};
    const classSubjects = currentTeacherMap[className] || [];
    
    let updatedClassSubjects;
    if (classSubjects.includes(subject)) {
      updatedClassSubjects = classSubjects.filter(s => s !== subject);
    } else {
      updatedClassSubjects = [...classSubjects, subject];
    }
    setAssignments({
      ...assignments,
      [teacher]: {
        ...currentTeacherMap,
        [className]: updatedClassSubjects
      }
    });
  };

  const getAssignedTeacherForClassSubject = (className, subject) => {
    for (const [tName, classMap] of Object.entries(assignments)) {
      if (classMap[className] && classMap[className].includes(subject)) {
        return tName;
      }
    }
    return null;
  };

  const teacherAssignedSubjectsMap = (teacherName) => {
    const classMap = assignments[teacherName] || {};
    const subSet = new Set();
    Object.values(classMap).forEach(subs => subs.forEach(s => subSet.add(s)));
    return subSet;
  };

  const handleProceedToPage3 = () => {
    setErrorMessage('');
    setOptimizationNotice(null);
    
    let totalAssignmentsCount = 0;
    Object.values(assignments).forEach(cMap => {
      Object.values(cMap).forEach(subs => {
        totalAssignmentsCount += subs.length;
      });
    });

    if (totalAssignmentsCount === 0) {
      setErrorMessage('Please assign at least one subject to teachers for the classes before generating.');
      return;
    }

    let cData, tData, unassignedSlotsCount;

    // Check Generation Mode and call respective generator algorithm
    if (generationMode === 'period') {
      const result = generatePeriodTimetableData({
        teachersInput, classesInput, subjectsInput, periodsPerDay,
        subjectPeriodCounts, teacherTypes, teacherFreeCounts,
        teacherAvailability, assignments
      });
      cData = result.classTimetables;
      tData = result.teacherTimetables;
      unassignedSlotsCount = result.unassignedSlotsCount;
    } else {
      const result = generateTimetableData({
        teachersInput, classesInput, subjectsInput, periodsPerDay,
        subjectPriorities, teacherTypes, teacherFreeCounts,
        teacherAvailability, assignments
      });
      cData = result.classTimetables;
      tData = result.teacherTimetables;
      unassignedSlotsCount = result.unassignedSlotsCount;
    }

    setClassTimetables(cData);
    setTeacherTimetables(tData);

    if (unassignedSlotsCount > 0) {
      setOptimizationNotice({
        type: 'warning',
        message: `Timetable generated successfully using ${generationMode.toUpperCase()} mode. Note: ${unassignedSlotsCount} slots required fallback allocation due to constraints.`
      });
    }

    setStep('page3');
  };

  const handleSaveRearrange = (e) => {
    e.preventDefault();
    if (!editingSlot) return;
    const { className, day, periodIndex } = editingSlot;

    const newClassTimetables = JSON.parse(JSON.stringify(classTimetables));
    const newTeacherTimetables = JSON.parse(JSON.stringify(teacherTimetables));

    const oldSlot = newClassTimetables[className][day][periodIndex];
    if (oldSlot && oldSlot.teacher) {
      if (newTeacherTimetables[oldSlot.teacher]?.[day]?.[periodIndex]) {
        newTeacherTimetables[oldSlot.teacher][day][periodIndex] = null;
      }
    }

    if (rearrangeSubject && rearrangeTeacher) {
      newClassTimetables[className][day][periodIndex] = { subject: rearrangeSubject, teacher: rearrangeTeacher };
      if (!newTeacherTimetables[rearrangeTeacher]) {
        newTeacherTimetables[rearrangeTeacher] = {};
      }
      if (!newTeacherTimetables[rearrangeTeacher][day]) {
        newTeacherTimetables[rearrangeTeacher][day] = Array(periodsPerDay).fill(null);
      }
      newTeacherTimetables[rearrangeTeacher][day][periodIndex] = { subject: rearrangeSubject, class: className };
    } else {
      newClassTimetables[className][day][periodIndex] = null;
    }

    setClassTimetables(newClassTimetables);
    setTeacherTimetables(newTeacherTimetables);
    setEditingSlot(null);
  };

  const getClassSubjectCounts = (className) => {
    if (!classTimetables || !classTimetables[className]) return {};
    const counts = {};
    DAYS_LIST.forEach(day => {
      classTimetables[className][day].forEach(slot => {
        if (slot && slot.subject) {
          counts[slot.subject] = (counts[slot.subject] || 0) + 1;
        }
      });
    });
    return counts;
  };

  const getTeacherClassAssignmentCounts = (teacherName) => {
    if (!teacherTimetables || !teacherTimetables[teacherName]) return {};
    const counts = {};
    DAYS_LIST.forEach(day => {
      teacherTimetables[teacherName][day].forEach(slot => {
        if (slot && slot.class) {
          const combo = `Class ${slot.class} (${slot.subject})`;
          counts[combo] = (counts[combo] || 0) + 1;
        }
      });
    });
    return counts;
  };

  const handleDownloadPDF = () => { window.print(); };

  return (
    <div style={styles.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ ...styles.cardTitle, margin: 0 }}>⚡ Advanced Timetable Generator System</h2>
        {onBack && (
          <button type="button" onClick={onBack} style={styles.secondaryButton}>
            ← Back to Dashboard
          </button>
        )}
      </div>

      {/* Mode Selection UI Header */}
      <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '15px', marginBottom: '20px' }}>
        <label style={{ ...styles.label, marginBottom: '8px', color: '#1e293b', fontWeight: 'bold' }}>
          Select Generation Algorithm Mode:
        </label>
        <div style={{ display: 'flex', gap: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
            <input 
              type="radio" 
              name="generationMode" 
              value="priority" 
              checked={generationMode === 'priority'} 
              onChange={() => setGenerationMode('priority')} 
            />
            Priority Base Mode 
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
            <input 
              type="radio" 
              name="generationMode" 
              value="period" 
              checked={generationMode === 'period'} 
              onChange={() => setGenerationMode('period')} 
            />
            Period Base Mode 
          </label>
        </div>
      </div>

      {errorMessage && (
        <div style={styles.errorBanner}>
          ⚠️ <strong>Validation Error:</strong> {errorMessage}
        </div>
      )}

      {optimizationNotice && (
        <div style={styles.noticeBanner}>
          ℹ️ <strong>System Notification:</strong> {optimizationNotice.message}
        </div>
      )}

      {step === 'page1' && (
        <TimetableMasterData
          teachersInput={teachersInput} setTeachersInput={setTeachersInput}
          classesInput={classesInput} setClassesInput={setClassesInput}
          subjectsInput={subjectsInput} setSubjectsInput={setSubjectsInput}
          periodsPerDay={periodsPerDay} setPeriodsPerDay={setPeriodsPerDay}
          teachers={teachers} subjects={subjects}
          teacherTypes={teacherTypes} setTeacherTypes={setTeacherTypes}
          teacherFreeCounts={teacherFreeCounts} setTeacherFreeCounts={setTeacherFreeCounts}
          subjectPriorities={subjectPriorities} setSubjectPriorities={setSubjectPriorities}
          generationMode={generationMode}
          subjectPeriodCounts={subjectPeriodCounts} setSubjectPeriodCounts={setSubjectPeriodCounts}
          onProceed={handleProceedToPage2}
          styles={styles}
        />
      )}

      {step === 'page2' && (
        <TimetableAssignments
          teachers={teachers} classes={classes} subjects={subjects}
          activeTeacher={activeTeacher} setActiveTeacher={setActiveTeacher}
          assignments={assignments} handleToggleSubjectAssignment={handleToggleSubjectAssignment}
          getAssignedTeacherForClassSubject={getAssignedTeacherForClassSubject}
          showHelpBoxPopup={showHelpBoxPopup} setShowHelpBoxPopup={setShowHelpBoxPopup}
          helpPeriodsPerDay={helpPeriodsPerDay} setHelpPeriodsPerDay={setHelpPeriodsPerDay}
          helpFreePeriodCount={helpFreePeriodCount} setHelpFreePeriodCount={setHelpFreePeriodCount}
          helpAssignedClassesCount={helpAssignedClassesCount} setHelpAssignedClassesCount={setHelpAssignedClassesCount}
          onBack={() => setStep('page1')}
          onGenerate={handleProceedToPage3}
          styles={styles}
        />
      )}

      {step === 'page3' && classTimetables && teacherTimetables && (
        <TimetableView
          mainViewTab={mainViewTab} setMainViewTab={setMainViewTab}
          classes={classes} teachers={teachers} subjects={subjects}
          activeViewClass={activeViewClass} setActiveViewClass={setActiveViewClass}
          activeViewTeacher={activeViewTeacher} setActiveViewTeacher={setActiveViewTeacher}
          classTimetables={classTimetables} teacherTimetables={teacherTimetables}
          periodsPerDay={periodsPerDay}
          getClassSubjectCounts={getClassSubjectCounts}
          getTeacherClassAssignmentCounts={getTeacherClassAssignmentCounts}
          teacherAssignedSubjectsMap={teacherAssignedSubjectsMap}
          handleDownloadPDF={handleDownloadPDF}
          editingSlot={editingSlot} setEditingSlot={setEditingSlot}
          rearrangeSubject={rearrangeSubject} setRearrangeSubject={setRearrangeSubject}
          rearrangeTeacher={rearrangeTeacher} setRearrangeTeacher={setRearrangeTeacher}
          handleSaveRearrange={handleSaveRearrange}
          onModify={() => setStep('page2')}
          styles={styles}
        />
      )}
    </div>
  );
}

const styles = {
  card: { backgroundColor: '#ffffff', padding: '25px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' },
  cardTitle: { fontSize: '16px', fontWeight: 'bold', color: '#1e293b' },
  stepIndicator: { fontSize: '12px', fontWeight: 600, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' },
  label: { display: 'block', fontSize: '13px', fontWeight: 500, color: '#475569', marginBottom: '6px' },
  textInput: { width: '100%', padding: '10px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' },
  selectInput: { width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', backgroundColor: '#ffffff', boxSizing: 'border-box' },
  primaryButton: { backgroundColor: '#4f46e5', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginLeft: 'auto', display: 'block' },
  secondaryButton: { backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' },
  generateButton: { backgroundColor: '#059669', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' },
  pdfButton: { backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' },
  helpBoxButton: { backgroundColor: '#4f46e5', color: '#ffffff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  rightSideBoxPopup: { position: 'absolute', top: '45px', right: '0px', zIndex: 100, backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', width: '260px', padding: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', boxSizing: 'border-box' },
  assignmentBox: { border: '1px solid #e2e8f0', borderRadius: '10px', padding: '15px', backgroundColor: '#f8fafc', marginBottom: '15px' },
  classAssignmentRow: { backgroundColor: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' },
  errorBanner: { backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '15px' },
  noticeBanner: { backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '15px' },
  summaryTopBar: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', marginBottom: '15px' },
  summaryBadge: { backgroundColor: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', color: '#3730a3' },
  summaryBadgeTeacher: { backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', color: '#065f46' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '12px' },
  th: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px', color: '#334155', fontWeight: 600, textAlign: 'center' },
  tdDay: { border: '1px solid #e2e8f0', padding: '10px', fontWeight: 600, backgroundColor: '#fafafa', color: '#1e293b', textAlign: 'center', width: '100px' },
  tdCell: { border: '1px solid #e2e8f0', padding: '8px', textAlign: 'center', minWidth: '120px' },
  classSlotBox: { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '6px', display: 'flex', flexDirection: 'column' },
  teacherSlotBox: { backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px', padding: '6px', display: 'flex', flexDirection: 'column' },
  freeSlotBox: { backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '6px', padding: '8px', display: 'flex', justifyContent: 'center' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#faf5f5', padding: '20px', borderRadius: '10px', width: '350px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }
};