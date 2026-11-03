import React, { useState } from 'react';
import { DAYS_LIST } from './timetable-generator';

export function TimetableAdvancedConstraints({
  teachers,
  classes,
  subjects,
  periodsPerDay,
  subjectPriorities,
  subjectPeriodCounts,
  generationMode,
  teacherCategory,
  setTeacherCategory,
  teacherSpecificFreeSlots,
  setTeacherSpecificFreeSlots,
  partTimeDayConfig,
  setPartTimeDayConfig,
  subjectTimeSlotRules,
  setSubjectTimeSlotRules,
  teacherTypes, // Added teacherTypes to filter part-time teachers
  onBack,
  onProceed,
  styles
}) {
  const [activeTab, setActiveTab] = useState('teacherCategory');

  // Handle Teacher Category Change (PG / UG / Both)
  const handleCategoryChange = (teacher, category) => {
    setTeacherCategory(prev => ({
      ...prev,
      [teacher]: category
    }));
  };

  // Toggle Specific Free Slots for 'Both PG & UG' teachers
  const handleToggleFreeSlot = (teacher, day, periodIndex) => {
    setTeacherSpecificFreeSlots(prev => {
      const teacherSlots = prev[teacher] || {};
      const daySlots = teacherSlots[day] || [];
      const updatedDaySlots = daySlots.includes(periodIndex)
        ? daySlots.filter(p => p !== periodIndex)
        : [...daySlots, periodIndex];

      return {
        ...prev,
        [teacher]: {
          ...teacherSlots,
          [day]: updatedDaySlots
        }
      };
    });
  };

  // Handle Part-Time Teacher Config per Day
  const handlePartTimeConfigChange = (teacher, day, shiftType) => {
    setPartTimeDayConfig(prev => ({
      ...prev,
      [teacher]: {
        ...(prev[teacher] || {}),
        [day]: shiftType // 'First Half', 'Second Half', 'Full Day', 'Off'
      }
    }));
  };

  // Handle Subject Time Slot Preference Rule Change
  const handleSubjectTimeRuleChange = (subject, rule) => {
    setSubjectTimeSlotRules(prev => ({
      ...prev,
      [subject]: rule // 'Morning Only', 'Afternoon Only', 'Any Time'
    }));
  };

  // Filter only part-time teachers for Tab 2
  const partTimeTeachers = teachers.filter(t => {
    const tType = teacherTypes?.[t] || '';
    return tType === 'Part-Time' || tType.toLowerCase().includes('part');
  });

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <div style={styles.stepIndicator}>
          Page 1.5 of 3: Advanced Teacher & Subject Scheduling Rules
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #cbd5e1', paddingBottom: '10px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('teacherCategory')}
          style={{
            padding: '8px 14px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            backgroundColor: activeTab === 'teacherCategory' ? '#2563eb' : '#f1f5f9',
            color: activeTab === 'teacherCategory' ? '#ffffff' : '#475569',
          }}
        >
          👨‍🏫 Teacher PG/UG & Specific Free Slots
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('partTimeDays')}
          style={{
            padding: '8px 14px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            backgroundColor: activeTab === 'partTimeDays' ? '#2563eb' : '#f1f5f9',
            color: activeTab === 'partTimeDays' ? '#ffffff' : '#475569',
          }}
        >
          🗓️ Part-Time Specific Day Shifts
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('subjectRules')}
          style={{
            padding: '8px 14px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            backgroundColor: activeTab === 'subjectRules' ? '#2563eb' : '#f1f5f9',
            color: activeTab === 'subjectRules' ? '#ffffff' : '#475569',
          }}
        >
          📚 Subject Time Restrictions (Morning/Afternoon)
        </button>
      </div>

      {/* TAB 1: Teacher Category & Specific Free Slot Allocation */}
      {activeTab === 'teacherCategory' && (
        <div style={styles.assignmentBox}>
          <h3 style={{ fontSize: '14px', color: '#1e293b', margin: '0 0 10px 0' }}>
            🎓 Teacher Designation & Free Period Selection
          </h3>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '15px' }}>
            PG Only teachers will be restricted for high school classes. For <strong>Both PG & UG</strong> teachers, select the exact periods they are free across all days.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {teachers.map(t => {
              const currentCat = teacherCategory[t] || 'UG Only';
              return (
                <div key={t} style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>👨‍🏫 {t}</span>
                    <select
                      value={currentCat}
                      onChange={(e) => handleCategoryChange(t, e.target.value)}
                      style={{ ...styles.selectInput, width: '180px', fontSize: '12px', fontWeight: 600 }}
                    >
                      <option value="UG Only">UG Only (Class 6-10)</option>
                      <option value="PG Only">PG Only (Class 11-12)</option>
                      <option value="Both PG & UG">Both PG & UG</option>
                    </select>
                  </div>

                  {/* If Both PG & UG is selected, show daily period grid to select explicit free periods */}
                  {currentCat === 'Both PG & UG' && (
                    <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#0369a1', display: 'block', marginBottom: '6px' }}>
                        📌 Click periods where {t} is FREE (e.g. teaching Higher Secondary or unavailable):
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {DAYS_LIST.map(day => (
                          <div key={day} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '11px', width: '80px', fontWeight: 600, color: '#475569' }}>{day}:</span>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {Array.from({ length: periodsPerDay }).map((_, pIdx) => {
                                const isFree = (teacherSpecificFreeSlots[t]?.[day] || []).includes(pIdx);
                                return (
                                  <button
                                    key={pIdx}
                                    type="button"
                                    onClick={() => handleToggleFreeSlot(t, day, pIdx)}
                                    style={{
                                      padding: '4px 8px',
                                      fontSize: '10px',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      border: isFree ? '1px solid #dc2626' : '1px solid #cbd5e1',
                                      backgroundColor: isFree ? '#fef2f2' : '#ffffff',
                                      color: isFree ? '#dc2626' : '#334155',
                                      fontWeight: isFree ? 700 : 400
                                    }}
                                  >
                                    P{pIdx + 1} {isFree ? '🚫 Free' : '✅'}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Specific Day Shift Configurations for Part-Time Teachers Only */}
      {activeTab === 'partTimeDays' && (
        <div style={styles.assignmentBox}>
          <h3 style={{ fontSize: '14px', color: '#1e293b', margin: '0 0 10px 0' }}>
            🗓️ Specific Day Shift Matrix for Part-Time Teachers
          </h3>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '15px' }}>
            Master Data-vil Part-Time-ah select seyyappatta teachers-ku mattum inge ovvoru naallum Morning (First Half) varuvangala alladhu Afternoon (Second Half) varuvangala endru customise seyyalaam.
          </p>

          {partTimeTeachers.length === 0 ? (
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
              ℹ️ No Part-Time teachers configured in Master Data. (Full-Time teachers are automatically excluded).
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {partTimeTeachers.map(t => (
                <div key={t} style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '8px' }}>👨‍🏫 {t} ({teacherTypes[t]})</span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
                    {DAYS_LIST.map(day => {
                      const currentShift = partTimeDayConfig[t]?.[day] || 'Full Day';
                      return (
                        <div key={day} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>{day}</span>
                          <select
                            value={currentShift}
                            onChange={(e) => handlePartTimeConfigChange(t, day, e.target.value)}
                            style={{ ...styles.selectInput, fontSize: '10px', padding: '2px 4px' }}
                          >
                            <option value="Full Day">Full Day</option>
                            <option value="First Half">First Half (Morning)</option>
                            <option value="Second Half">Second Half (Afternoon)</option>
                            <option value="Off Day">Off Day (No Classes)</option>
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Subject Session Time Slot Rules */}
      {activeTab === 'subjectRules' && (
        <div style={styles.assignmentBox}>
          <h3 style={{ fontSize: '14px', color: '#1e293b', margin: '0 0 10px 0' }}>
            📚 Subject Morning / Afternoon Session Rules
          </h3>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '15px' }}>
            Library athavathu Morning mattum thaan varanumaa, Craft/PE/Lab sela subjects Afternoon mattum thaan varanumaa endru rules configure pannungol.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
            {subjects.map(sub => {
              const currentRule = subjectTimeSlotRules[sub] || 'Any Time';
              return (
                <div key={sub} style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>{sub}</span>
                  <select
                    value={currentRule}
                    onChange={(e) => handleSubjectTimeRuleChange(sub, e.target.value)}
                    style={{ ...styles.selectInput, width: '130px', fontSize: '11px', padding: '4px 6px' }}
                  >
                    <option value="Any Time">Any Time</option>
                    <option value="Morning Only">☀️ Morning Only</option>
                    <option value="Afternoon Only">🌤️ Afternoon Only</option>
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
        <button type="button" onClick={onBack} style={styles.secondaryButton}>
          ← Back to Master Data
        </button>
        <button type="button" onClick={onProceed} style={styles.primaryButton}>
          Next: Teacher Subject Assignments ➔
        </button>
      </div>
    </div>
  );
}