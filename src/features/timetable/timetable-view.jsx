import React from 'react';
import { DAYS_LIST } from './timetable-generator';

export function TimetableView({
  mainViewTab, setMainViewTab,
  classes, teachers, subjects,
  activeViewClass, setActiveViewClass,
  activeViewTeacher, setActiveViewTeacher,
  classTimetables, teacherTimetables,
  periodsPerDay,
  getClassSubjectCounts, getTeacherClassAssignmentCounts,
  teacherAssignedSubjectsMap, handleDownloadPDF,
  editingSlot, setEditingSlot,
  rearrangeSubject, setRearrangeSubject,
  rearrangeTeacher, setRearrangeTeacher,
  handleSaveRearrange, onModify, styles
}) {
  return (
    <div>
      <div style={styles.stepIndicator}>Page 3 of 3: Generated Timetable Output Results</div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '15px 0', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setMainViewTab('class')}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: mainViewTab === 'class' ? '#4f46e5' : '#f1f5f9',
              color: mainViewTab === 'class' ? '#ffffff' : '#475569',
            }}
          >
            🏫 Class-wise Timetable View
          </button>
          <button
            type="button"
            onClick={() => setMainViewTab('teacher')}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: mainViewTab === 'teacher' ? '#4f46e5' : '#f1f5f9',
              color: mainViewTab === 'teacher' ? '#ffffff' : '#475569',
            }}
          >
            👨‍🏫 Teacher-wise Timetable View
          </button>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" onClick={handleDownloadPDF} style={styles.pdfButton}>📥 Print / PDF</button>
          <button type="button" onClick={onModify} style={styles.secondaryButton}>⚙️ Modify Assignments</button>
        </div>
      </div>

      {mainViewTab === 'class' ? (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
          {classes.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setActiveViewClass(c)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                backgroundColor: activeViewClass === c ? '#059669' : '#f1f5f9',
                color: activeViewClass === c ? '#ffffff' : '#475569',
              }}
            >
              🏫 Class {c}
            </button>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
          {teachers.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setActiveViewTeacher(t)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                backgroundColor: activeViewTeacher === t ? '#059669' : '#f1f5f9',
                color: activeViewTeacher === t ? '#ffffff' : '#475569',
              }}
            >
              👨‍🏫 {t}
            </button>
          ))}
        </div>
      )}

      {mainViewTab === 'class' ? (
        <div style={styles.summaryTopBar}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>📊 Weekly Subject Frequencies (Class {activeViewClass}):</span>
            <span style={{ fontSize: '11px', color: '#4f46e5', fontStyle: 'italic' }}>💡 Tip: Click any slot below to rearrange/edit it.</span>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
            {Object.entries(getClassSubjectCounts(activeViewClass)).map(([sub, count]) => (
              <span key={sub} style={styles.summaryBadge}>
                <strong>{sub}:</strong> {count} periods
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div style={styles.summaryTopBar}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>📊 Weekly Class Assignment Counts ({activeViewTeacher}):</span>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
            {Object.entries(getTeacherClassAssignmentCounts(activeViewTeacher)).length > 0 ? (
              Object.entries(getTeacherClassAssignmentCounts(activeViewTeacher)).map(([combo, count]) => (
                <span key={combo} style={styles.summaryBadgeTeacher}>
                  <strong>{combo}:</strong> {count} periods
                </span>
              ))
            ) : (
              <span style={{ fontSize: '12px', color: '#64748b' }}>No assigned classes scheduled this week.</span>
            )}
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Day / Period</th>
              {Array.from({ length: periodsPerDay }).map((_, pIdx) => (
                <th key={pIdx} style={styles.th}>Period {pIdx + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mainViewTab === 'class' ? (
              DAYS_LIST.map(dayName => {
                let dayPeriods = classTimetables[activeViewClass]?.[dayName] || [];
                return (
                  <tr key={dayName}>
                    <td style={styles.tdDay}>{dayName}</td>
                    {dayPeriods.map((slot, pIdx) => (
                      <td key={pIdx} style={styles.tdCell}>
                        {slot ? (
                          <div 
                            onClick={() => {
                              setEditingSlot({ className: activeViewClass, day: dayName, periodIndex: pIdx, currentSlot: slot });
                              setRearrangeSubject(slot.subject);
                              setRearrangeTeacher(slot.teacher);
                            }}
                            style={{ ...styles.classSlotBox, cursor: 'pointer' }}
                            title="Click to rearrange slot"
                          >
                            <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '12px' }}>{slot.subject}</span>
                            <span style={{ fontSize: '10px', color: '#4f46e5', marginTop: '2px' }}>👤 {slot.teacher}</span>
                          </div>
                        ) : (
                          <button 
                            type="button"
                            onClick={() => {
                              setEditingSlot({ className: activeViewClass, day: dayName, periodIndex: pIdx, currentSlot: null });
                              setRearrangeSubject(subjects[0] || '');
                              setRearrangeTeacher(teachers[0] || '');
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', fontSize: '11px', width: '100%', padding: '10px' }}
                          >
                            + Add
                          </button>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })
            ) : (
              DAYS_LIST.map(dayName => {
                let dayPeriods = teacherTimetables[activeViewTeacher]?.[dayName] || [];
                let allowedSubs = teacherAssignedSubjectsMap(activeViewTeacher);
                return (
                  <tr key={dayName}>
                    <td style={styles.tdDay}>{dayName}</td>
                    {dayPeriods.map((slot, pIdx) => {
                      let isAssignedSubject = slot && slot.subject && allowedSubs.has(slot.subject);
                      return (
                        <td key={pIdx} style={styles.tdCell}>
                          {isAssignedSubject ? (
                            <div style={styles.teacherSlotBox}>
                              <span style={{ fontWeight: 600, color: '#065f46', fontSize: '12px' }}>{slot.subject}</span>
                              <span style={{ fontSize: '10px', color: '#047857', marginTop: '2px' }}>🏫 Class {slot.class}</span>
                            </div>
                          ) : (
                            <div style={styles.freeSlotBox}>
                              <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 500 }}>Prep/Free</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {editingSlot && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#1e293b' }}>
              ✏️ Rearrange Slot: Class {editingSlot.className} ({editingSlot.day} - Period {editingSlot.periodIndex + 1})
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '15px' }}>
              Select a new subject and teacher for this slot.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={styles.label}>Select Subject:</label>
                <select 
                  value={rearrangeSubject} 
                  onChange={(e) => setRearrangeSubject(e.target.value)}
                  style={styles.selectInput}
                >
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={styles.label}>Select Teacher:</label>
                <select 
                  value={rearrangeTeacher} 
                  onChange={(e) => setRearrangeTeacher(e.target.value)}
                  style={styles.selectInput}
                >
                  {teachers.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button" 
                onClick={() => setEditingSlot(null)}
                style={styles.secondaryButton}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleSaveRearrange}
                style={styles.generateButton}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}