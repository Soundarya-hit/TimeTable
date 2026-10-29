import React, { useState } from 'react';

// Default mock database with classes and their associated teachers
const DEFAULT_CLASS_DATABASE = [
  {
    id: 'class_10a',
    className: 'Class 10-A',
    teachers: ['John Doe', 'Sarah Connor', 'Alan Turing', 'Marie Curie']
  },
  {
    id: 'class_10b',
    className: 'Class 10-B',
    teachers: ['John Doe', 'Grace Hopper', 'Richard Feynman', 'Ada Lovelace']
  },
  {
    id: 'class_12a',
    className: 'Class 12-A',
    teachers: ['Albert Einstein', 'Marie Curie', 'Nikola Tesla', 'Isaac Newton']
  },
  {
    id: 'class_12b',
    className: 'Class 12-B',
    teachers: ['Isaac Newton', 'Charles Babbage', 'Rosalind Franklin', 'Ada Lovelace']
  }
];

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
  const [showImportBox, setShowImportBox] = useState(false);
  const [classList, setClassList] = useState(DEFAULT_CLASS_DATABASE);
  const [selectedClassIds, setSelectedClassIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Future Database API connection support function
  const fetchClassesFromDatabase = async () => {
    setIsLoading(true);
    try {
      // Future API integration placeholder:
      // const response = await fetch('/api/classes');
      // const data = await response.json();
      // setClassList(data);

      setClassList(DEFAULT_CLASS_DATABASE);
    } catch (error) {
      console.error("Failed to fetch classes from database:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenImportBox = () => {
    fetchClassesFromDatabase();
    setShowImportBox(!showImportBox);
  };

  const handleToggleClassSelection = (classItem) => {
    if (selectedClassIds.includes(classItem.id)) {
      setSelectedClassIds(selectedClassIds.filter(id => id !== classItem.id));
    } else {
      setSelectedClassIds([...selectedClassIds, classItem.id]);
    }
  };

  const handleImportSelectedClasses = () => {
    if (selectedClassIds.length === 0) {
      setShowImportBox(false);
      return;
    }

    const existingClasses = classesInput ? classesInput.split(',').map(c => c.trim()).filter(Boolean) : [];
    const existingTeachers = teachersInput ? teachersInput.split(',').map(t => t.trim()).filter(Boolean) : [];

    selectedClassIds.forEach(id => {
      const classItem = classList.find(c => c.id === id);
      if (classItem) {
        // Add class if not already present
        if (!existingClasses.includes(classItem.className)) {
          existingClasses.push(classItem.className);
        }
        // Add associated teachers uniquely
        classItem.teachers.forEach(t => {
          if (!existingTeachers.includes(t)) {
            existingTeachers.push(t);
          }
        });
      }
    });

    setClassesInput(existingClasses.join(', '));
    setTeachersInput(existingTeachers.join(', '));
    // Subject list is kept untouched as requested

    setSelectedClassIds([]);
    setShowImportBox(false);
  };

  return (
    <form onSubmit={onProceed} style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
      
      {/* Top Header with Indicator & Import Class Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={styles.stepIndicator}>
          Page 1 of 3: Master Data, Configurations & {generationMode === 'period' ? 'Period Counts' : 'Priorities'}
        </div>
        
        {/* Top Right Import Class Button */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={handleOpenImportBox}
            style={{
              padding: '6px 14px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📥 Import Class
          </button>

          {/* Mini Square Box Popup for Multiple Class Selection */}
          {showImportBox && (
            <div
              style={{
                position: 'absolute',
                top: '38px',
                right: 0,
                width: '220px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                zIndex: 1000,
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>Select Classes</span>
                <button
                  type="button"
                  onClick={() => setShowImportBox(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#64748b' }}
                >
                  ✕
                </button>
              </div>

              {isLoading ? (
                <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', padding: '10px' }}>Loading...</div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                  {classList.map((item) => {
                    const isSelected = selectedClassIds.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleToggleClassSelection(item)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: isSelected ? '1px solid #2563eb' : '1px solid #e2e8f0',
                          backgroundColor: isSelected ? '#eff6ff' : '#f8fafc',
                          color: isSelected ? '#1d4ed8' : '#334155',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: 600,
                          transition: 'all 0.2s',
                          userSelect: 'none'
                        }}
                      >
                        {item.className} {isSelected ? '✓' : ''}
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                type="button"
                onClick={handleImportSelectedClasses}
                style={{
                  marginTop: '4px',
                  padding: '6px',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 600,
                  textAlign: 'center'
                }}
              >
                Apply Selected ({selectedClassIds.length})
              </button>
            </div>
          )}
        </div>
      </div>

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
        <h3 style={{ fontSize: '14px', color: '#1e293b', margin: '0 0 10px 0' }}>📅 Teacher Availability & Free Period Requirements</h3>
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
          <h3 style={{ fontSize: '14px', color: '#1e293b', margin: '0 0 5px 0' }}>🎯 Weekly Period Counts (Strict Count per Class)</h3>
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
          <h3 style={{ fontSize: '14px', color: '#1e293b', margin: '0 0 10px 0' }}>⭐ Subject Priorities (High / Medium / Low)</h3>
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
                  <option value={1}>Low Priority</option>
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