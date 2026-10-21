import React from 'react';

export function TimetableMasterData({
  teachersInput, setTeachersInput,
  classesInput, setClassesInput,
  subjectsInput, setSubjectsInput,
  periodsPerDay, setPeriodsPerDay,
  teachers, subjects,
  teacherTypes, setTeacherTypes,
  teacherFreeCounts, setTeacherFreeCounts,
  subjectPriorities, setSubjectPriorities,
  generationMode,
  subjectPeriodCounts, setSubjectPeriodCounts,
  onProceed, styles
}) {
  return (
    <form onSubmit={onProceed} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={styles.stepIndicator}>Page 1 of 3: Master Data, Configurations & {generationMode === 'period' ? 'Period Counts' : 'Priorities'}</div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
        <div>
          <label style={styles.label}>Teacher List (comma-separated):</label>
          <input type="text" value={teachersInput} onChange={(e) => setTeachersInput(e.target.value)} style={styles.textInput} />
        </div>
        <div>
          <label style={styles.label}>Class List (comma-separated):</label>
          <input type="text" value={classesInput} onChange={(e) => setClassesInput(e.target.value)} style={styles.textInput} />
        </div>
        <div>
          <label style={styles.label}>Subject List (comma-separated):</label>
          <input type="text" value={subjectsInput} onChange={(e) => setSubjectsInput(e.target.value)} style={styles.textInput} />
        </div>
        <div>
          <label style={styles.label}>Periods Per Day (e.g., 4, 5, 6, 7, 8):</label>
          <input 
            type="number" 
            min="4" 
            max="10" 
            value={periodsPerDay} 
            onChange={(e) => setPeriodsPerDay(Number(e.target.value))} 
            style={styles.textInput} 
          />
        </div>
      </div>

      <div style={styles.assignmentBox}>
        <h3 style={{ fontSize: '14px', color: '#1e293b', margin: '0 0 10px 0' }}>👩‍🏫 Teacher Availability & Free Period Requirements</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {teachers.map(t => (
            <div key={t} style={{ background: '#fff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>{t}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={teacherTypes[t] || 'Full-Time'}
                  onChange={(e) => setTeacherTypes({ ...teacherTypes, [t]: e.target.value })}
                  style={{ ...styles.selectInput, fontSize: '12px', flex: 1 }}
                >
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time First Half">Part-Time First Half</option>
                  <option value="Part-Time Second Half">Part-Time Second Half</option>
                </select>
                <select
                  value={teacherFreeCounts[t] !== undefined ? teacherFreeCounts[t] : 1}
                  onChange={(e) => setTeacherFreeCounts({ ...teacherFreeCounts, [t]: Number(e.target.value) })}
                  style={{ ...styles.selectInput, fontSize: '12px', width: '110px' }}
                >
                  <option value={0}>0 Free Period</option>
                  <option value={1}>1 Free Period</option>
                  <option value={2}>2 Free Periods</option>
                  <option value={3}>3 Free Periods</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conditionally render Priorities UI or Period Count Target UI based on selected Mode */}
      {generationMode === 'period' ? (
        <div style={styles.assignmentBox}>
          <h3 style={{ fontSize: '14px', color: '#1e293b', margin: '0 0 5px 0' }}>📅 Weekly Period Counts (Strict Count per Class)</h3>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 10px 0' }}>Specify how many times each subject should appear per week for every class.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
            {subjects.map(sub => (
              <div key={sub} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>{sub}</span>
                <input
                  type="number"
                  min="1"
                  max="15"
                  value={subjectPeriodCounts[sub] !== undefined ? subjectPeriodCounts[sub] : 5}
                  onChange={(e) => setSubjectPeriodCounts({ ...subjectPeriodCounts, [sub]: Number(e.target.value) })}
                  style={{ ...styles.textInput, width: '70px', padding: '4px 8px', textAlign: 'center', fontSize: '12px' }}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={styles.assignmentBox}>
          <h3 style={{ fontSize: '14px', color: '#1e293b', margin: '0 0 10px 0' }}>📚 Subject Priorities (High / Medium / Low)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
            {subjects.map(sub => (
              <div key={sub} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>{sub}</span>
                <select
                  value={subjectPriorities[sub] !== undefined ? subjectPriorities[sub] : 2}
                  onChange={(e) => setSubjectPriorities({ ...subjectPriorities, [sub]: Number(e.target.value) })}
                  style={{ ...styles.selectInput, fontSize: '12px', padding: '4px 8px' }}
                >
                  <option value={3}>High Priority</option>
                  <option value={2}>Medium Priority</option>
                  <option value5={1}>Low Priority</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      <button type="submit" style={styles.primaryButton}>Next: Teacher Subject Assignments ➔</button>
    </form>
  );
}