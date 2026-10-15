import React from 'react';

export function TimetableAssignments({
  teachers, classes, subjects,
  activeTeacher, setActiveTeacher,
  assignments, handleToggleSubjectAssignment,
  getAssignedTeacherForClassSubject,
  showHelpBoxPopup, setShowHelpBoxPopup,
  helpPeriodsPerDay, setHelpPeriodsPerDay,
  helpFreePeriodCount, setHelpFreePeriodCount,
  helpAssignedClassesCount, setHelpAssignedClassesCount,
  onBack, onGenerate, styles
}) {
  const maxAvailablePeriods = 5 * (helpPeriodsPerDay - helpFreePeriodCount);
  const periodsPerClassAllocated = helpAssignedClassesCount > 0 ? (maxAvailablePeriods / helpAssignedClassesCount).toFixed(1) : 0;

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={styles.stepIndicator}>Page 2 of 3: Teacher Subject Assignment Matrix</div>
        <button
          type="button"
          onClick={() => setShowHelpBoxPopup(!showHelpBoxPopup)}
          style={styles.helpBoxButton}
          title="Click for Workload & Per-Class Availability Calculation"
        >
          ? Help
        </button>
      </div>

      {showHelpBoxPopup && (
        <div style={styles.rightSideBoxPopup}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h4 style={{ margin: 0, fontSize: '13px', color: '#1e293b' }}>💡 Per-Class Availability Helper</h4>
            <button 
              type="button" 
              onClick={() => setShowHelpBoxPopup(false)}
              style={{ background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer', color: '#64748b' }}
            >
              ✕
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', marginBottom: '10px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 500, color: '#475569', marginBottom: '2px' }}>Periods Per Day:</label>
              <input 
                type="number" 
                min="4" 
                max="8" 
                value={helpPeriodsPerDay} 
                onChange={(e) => setHelpPeriodsPerDay(Number(e.target.value))} 
                style={{ ...styles.textInput, padding: '4px 6px', fontSize: '11px' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 500, color: '#475569', marginBottom: '2px' }}>Free Periods / Day:</label>
              <select 
                value={helpFreePeriodCount} 
                onChange={(e) => setHelpFreePeriodCount(Number(e.target.value))} 
                style={{ ...styles.selectInput, padding: '4px 6px', fontSize: '11px' }}
              >
                <option value={0}>0 Free (Full)</option>
                <option value={1}>1 Free Period</option>
                <option value={2}>2 Free Periods</option>
                <option value={3}>3 Free Periods</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 500, color: '#475569', marginBottom: '2px' }}>Assigned Classes Count:</label>
              <input 
                type="number" 
                min="1" 
                max="5" 
                value={helpAssignedClassesCount} 
                onChange={(e) => setHelpAssignedClassesCount(Number(e.target.value))} 
                style={{ ...styles.textInput, padding: '4px 6px', fontSize: '11px' }} 
              />
            </div>
          </div>

          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px', fontSize: '11px', lineHeight: '1.4' }}>
            <div>📊 Total Available: <strong style={{ color: '#059669' }}>{maxAvailablePeriods}h</strong></div>
            <div>🏫 Per Class Share: <strong style={{ color: '#4f46e5' }}>~{periodsPerClassAllocated} periods</strong> / week</div>
            <div style={{ marginTop: '4px', borderTop: '1px solid #e2e8f0', paddingTop: '4px' }}>
              {Number(periodsPerClassAllocated) >= 5 ? (
                <span style={{ color: '#059669', fontWeight: 600 }}>✅ Sufficient hours per class!</span>
              ) : (
                <span style={{ color: '#b91c1c', fontWeight: 600 }}>⚠️ Low hours per class ({periodsPerClassAllocated}). Reduce classes or free periods!</span>
              )}
            </div>
          </div>
        </div>
      )}

      <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '15px' }}>
        Select a teacher and configure which subjects they teach for each class. Click the top-right <strong style={{color: '#4f46e5'}}>? Help</strong> button for per-class availability calculation box.
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', flexWrap: 'wrap' }}>
        {teachers.map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setActiveTeacher(t)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: activeTeacher === t ? '#4f46e5' : '#f1f5f9',
              color: activeTeacher === t ? '#ffffff' : '#475569',
            }}
          >
            👨‍🏫 {t}
          </button>
        ))}
      </div>

      <div style={{ ...styles.assignmentBox, maxHeight: '320px', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#1e293b' }}>
          Assigning workload for: <span style={{ color: '#4f46e5' }}>{activeTeacher}</span>
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {classes.map(c => (
            <div key={c} style={styles.classAssignmentRow}>
              <span style={{ fontWeight: 600, fontSize: '13px', color: '#334155', display: 'block', marginBottom: '8px' }}>
                🏫 Class {c}
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {subjects.map(s => {
                  let isSelectedForThis = (assignments[activeTeacher]?.[c] || []).includes(s);
                  let assignedOtherTeacher = getAssignedTeacherForClassSubject(c, s);
                  let isTakenByOther = assignedOtherTeacher !== null;
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={isTakenByOther && !isSelectedForThis}
                      onClick={() => handleToggleSubjectAssignment(activeTeacher, c, s)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: isTakenByOther && !isSelectedForThis ? 'not-allowed' : 'pointer',
                        border: isSelectedForThis ? '1px solid #4f46e5' : (isTakenByOther ? '1px solid #f59e0b' : '1px solid #cbd5e1'),
                        backgroundColor: isSelectedForThis ? '#eef2ff' : (isTakenByOther ? '#fef3c7' : '#ffffff'),
                        color: isSelectedForThis ? '#4338ca' : (isTakenByOther ? '#b45309' : '#64748b'),
                        fontWeight: isSelectedForThis || isTakenByOther ? 600 : 400,
                        opacity: isTakenByOther && !isSelectedForThis ? 0.8 : 1,
                      }}
                    >
                      {isSelectedForThis ? '✓ ' : (isTakenByOther ? `📌 [${assignedOtherTeacher}] ` : '+ ')} {s}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
        <button type="button" onClick={onBack} style={styles.secondaryButton}>
          ← Back to Configurations
        </button>
        <button type="button" onClick={onGenerate} style={styles.generateButton}>
          ⚡ Generate Fully Optimized Timetable ➔
        </button>
      </div>
    </div>
  );
}