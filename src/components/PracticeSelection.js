import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const PracticeSelection = ({ onStartPractice, questionBank = [], userProgress = {} }) => {
  const { colors, classes } = useTheme();
  
  const [preferences, setPreferences] = useState({
    testType: 'SAT', // SAT or PSAT
    subject: 'Math', // Math or English
    difficulty: 'Mixed', // Easy, Medium, Hard, Mixed
    sameDomain: false, // Keep questions within same domain
    specificSkills: [], // Array of specific skills to focus on
    questionCount: 20, // Number of questions for practice session
    timeLimit: false, // Whether to use time limit
    timeLimitMinutes: 25, // Time limit in minutes
  });

  const [availableSkills, setAvailableSkills] = useState([]);
  const [skillStats, setSkillStats] = useState({});
  
  useEffect(() => {
    // Extract unique skills from question bank based on selected subject and test type
    if (questionBank.length > 0) {
      const filteredQuestions = questionBank.filter(q => {
        const matchesSubject = q.subject?.toLowerCase() === preferences.subject.toLowerCase() || 
                               (preferences.subject === 'English' && (q.subject === 'Reading' || q.subject === 'Writing'));
        const matchesTestType = !q.testType || q.testType === preferences.testType;
        return matchesSubject && matchesTestType;
      });

      const skills = [...new Set(
        filteredQuestions
          .map(q => q.skill || q.category || q.domain)
          .filter(Boolean)
      )].sort();
      
      setAvailableSkills(skills);

      // Calculate skill statistics from user progress
      const stats = {};
      skills.forEach(skill => {
        const skillData = userProgress.skill_stats?.[skill];
        if (skillData) {
          stats[skill] = {
            accuracy: skillData.attempts > 0 ? (skillData.correct / skillData.attempts * 100) : 0,
            attempts: skillData.attempts || 0,
            correct: skillData.correct || 0
          };
        } else {
          stats[skill] = { accuracy: 0, attempts: 0, correct: 0 };
        }
      });
      setSkillStats(stats);
    }
  }, [questionBank, preferences.subject, preferences.testType, userProgress]);

  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
      // Reset specific skills when subject changes
      ...(key === 'subject' && { specificSkills: [] })
    }));
  };

  const handleSkillToggle = (skill) => {
    setPreferences(prev => ({
      ...prev,
      specificSkills: prev.specificSkills.includes(skill)
        ? prev.specificSkills.filter(s => s !== skill)
        : [...prev.specificSkills, skill]
    }));
  };

  const handleStartPractice = () => {
    const filteredQuestions = getFilteredQuestions();
    if (filteredQuestions.length === 0) {
      alert('No questions match your current filters. Please adjust your preferences.');
      return;
    }
    onStartPractice({
      ...preferences,
      availableQuestions: filteredQuestions
    });
  };

  const getFilteredQuestions = () => {
    return questionBank.filter(q => {
      // Filter by subject
      const matchesSubject = q.subject?.toLowerCase() === preferences.subject.toLowerCase() || 
                             (preferences.subject === 'English' && (q.subject === 'Reading' || q.subject === 'Writing'));
      
      // Filter by test type
      const matchesTestType = !q.testType || q.testType === preferences.testType;
      
      // Filter by difficulty
      const matchesDifficulty = preferences.difficulty === 'Mixed' || 
                                q.difficulty === preferences.difficulty;
      
      // Filter by specific skills if selected
      const matchesSkills = preferences.specificSkills.length === 0 || 
                            preferences.specificSkills.includes(q.skill || q.category || q.domain);
      
      return matchesSubject && matchesTestType && matchesDifficulty && matchesSkills;
    });
  };

  const difficultyOptions = [
    { 
      value: 'Mixed', 
      label: 'Mixed Difficulty', 
      description: 'Questions of all difficulty levels',
      icon: '🎯'
    },
    { 
      value: 'Easy', 
      label: 'Easy', 
      description: 'Foundational concepts and basic problems',
      icon: '🟢'
    },
    { 
      value: 'Medium', 
      label: 'Medium', 
      description: 'Intermediate level challenges',
      icon: '🟡'
    },
    { 
      value: 'Hard', 
      label: 'Hard', 
      description: 'Advanced and complex problems',
      icon: '🔴'
    }
  ];

  const questionCountOptions = [10, 15, 20, 25, 30, 50];
  const timeLimitOptions = [15, 20, 25, 30, 45, 60];
  
  const filteredQuestions = getFilteredQuestions();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div 
        className={`${classes.card} p-6`}
        style={{ 
          backgroundColor: colors.surface,
          borderColor: colors.border,
          color: colors.text 
        }}
      >
        <h2 className="text-3xl font-bold text-center mb-2">
          Customize Your Practice Session
        </h2>
        <p className="text-center opacity-75" style={{ color: colors['text-secondary'] }}>
          Tailor your study experience with personalized settings
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Test Type & Subject Selection */}
          <div 
            className={`${classes.card} p-6`}
            style={{ 
              backgroundColor: colors.surface,
              borderColor: colors.border 
            }}
          >
            <h3 className="text-xl font-semibold mb-4" style={{ color: colors.text }}>
              Test Format
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors['text-secondary'] }}>
                  Test Type
                </label>
                <div className="space-y-2">
                  {['SAT', 'PSAT'].map((type) => (
                    <button
                      key={type}
                      onClick={() => handlePreferenceChange('testType', type)}
                      className={`
                        w-full p-3 rounded-lg border-2 transition-all duration-200 text-left
                        ${preferences.testType === type ? 'ring-2' : 'hover:scale-[1.02]'}
                      `}
                      style={{
                        backgroundColor: preferences.testType === type ? colors['primary-light'] : colors.background,
                        borderColor: preferences.testType === type ? colors.primary : colors.border,
                        color: colors.text,
                        ringColor: colors.primary + '40'
                      }}
                    >
                      <div className="font-semibold">{type}</div>
                      <div className="text-sm opacity-75">
                        {type === 'SAT' ? 'College entrance exam' : 'Preliminary SAT/NMSQT'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors['text-secondary'] }}>
                  Subject
                </label>
                <div className="space-y-2">
                  {['Math', 'English'].map((subject) => (
                    <button
                      key={subject}
                      onClick={() => handlePreferenceChange('subject', subject)}
                      className={`
                        w-full p-3 rounded-lg border-2 transition-all duration-200 text-left
                        ${preferences.subject === subject ? 'ring-2' : 'hover:scale-[1.02]'}
                      `}
                      style={{
                        backgroundColor: preferences.subject === subject ? colors['accent-light'] : colors.background,
                        borderColor: preferences.subject === subject ? colors.accent : colors.border,
                        color: colors.text,
                        ringColor: colors.accent + '40'
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">
                          {subject === 'Math' ? '🔢' : '📚'}
                        </span>
                        <div>
                          <div className="font-semibold">{subject}</div>
                          <div className="text-sm opacity-75">
                            {subject === 'Math' ? 'Algebra, Geometry, Statistics' : 'Reading & Writing'}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Difficulty & Session Settings */}
          <div 
            className={`${classes.card} p-6`}
            style={{ 
              backgroundColor: colors.surface,
              borderColor: colors.border 
            }}
          >
            <h3 className="text-xl font-semibold mb-4" style={{ color: colors.text }}>
              Session Settings
            </h3>
            
            {/* Difficulty */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3" style={{ color: colors['text-secondary'] }}>
                Difficulty Preference
              </label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {difficultyOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handlePreferenceChange('difficulty', option.value)}
                    className={`
                      p-3 rounded-lg border-2 transition-all duration-200 text-center
                      ${preferences.difficulty === option.value ? 'ring-2' : 'hover:scale-[1.02]'}
                    `}
                    style={{
                      backgroundColor: preferences.difficulty === option.value ? colors['warning-light'] : colors.background,
                      borderColor: preferences.difficulty === option.value ? colors.warning : colors.border,
                      color: colors.text,
                      ringColor: colors.warning + '40'
                    }}
                  >
                    <div className="text-lg mb-1">{option.icon}</div>
                    <div className="font-medium text-sm">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Question Count & Time Limit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors['text-secondary'] }}>
                  Question Count
                </label>
                <select
                  value={preferences.questionCount}
                  onChange={(e) => handlePreferenceChange('questionCount', parseInt(e.target.value))}
                  className={`${classes.input} w-full`}
                  style={{
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text
                  }}
                >
                  {questionCountOptions.map(count => (
                    <option key={count} value={count}>{count} questions</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center space-x-2 mb-2">
                  <input
                    type="checkbox"
                    checked={preferences.timeLimit}
                    onChange={(e) => handlePreferenceChange('timeLimit', e.target.checked)}
                    style={{ accentColor: colors.primary }}
                  />
                  <span className="text-sm font-medium" style={{ color: colors['text-secondary'] }}>
                    Time Limit
                  </span>
                </label>
                <select
                  value={preferences.timeLimitMinutes}
                  onChange={(e) => handlePreferenceChange('timeLimitMinutes', parseInt(e.target.value))}
                  disabled={!preferences.timeLimit}
                  className={`${classes.input} w-full`}
                  style={{
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                    opacity: preferences.timeLimit ? 1 : 0.5
                  }}
                >
                  {timeLimitOptions.map(minutes => (
                    <option key={minutes} value={minutes}>{minutes} minutes</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Advanced Options */}
          <div 
            className={`${classes.card} p-6`}
            style={{ 
              backgroundColor: colors.surface,
              borderColor: colors.border 
            }}
          >
            <h3 className="text-xl font-semibold mb-4" style={{ color: colors.text }}>
              Advanced Options
            </h3>
            
            {/* Same Domain Toggle */}
            <label className="flex items-start space-x-3 cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={preferences.sameDomain}
                onChange={(e) => handlePreferenceChange('sameDomain', e.target.checked)}
                className="mt-1"
                style={{ accentColor: colors.primary }}
              />
              <div>
                <span className="font-medium" style={{ color: colors.text }}>
                  Keep questions within same domain
                </span>
                <p className="text-sm opacity-75" style={{ color: colors['text-secondary'] }}>
                  Focus practice session on one specific skill area for targeted improvement
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Sidebar - Skills & Stats */}
        <div className="space-y-6">
          
          {/* Skill Focus */}
          {availableSkills.length > 0 && (
            <div 
              className={`${classes.card} p-6`}
              style={{ 
                backgroundColor: colors.surface,
                borderColor: colors.border 
              }}
            >
              <h3 className="text-lg font-semibold mb-3" style={{ color: colors.text }}>
                Focus Skills
              </h3>
              <p className="text-sm mb-4 opacity-75" style={{ color: colors['text-secondary'] }}>
                Select specific skills to practice (optional)
              </p>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableSkills.map((skill) => {
                  const stats = skillStats[skill];
                  const isSelected = preferences.specificSkills.includes(skill);
                  
                  return (
                    <button
                      key={skill}
                      onClick={() => handleSkillToggle(skill)}
                      className={`
                        w-full p-3 rounded border text-left transition-all duration-200 hover:scale-[1.01]
                        ${isSelected ? 'ring-1' : ''}
                      `}
                      style={{
                        backgroundColor: isSelected ? colors['success-light'] : colors['surface-secondary'],
                        borderColor: isSelected ? colors.success : colors.border,
                        color: colors.text,
                        ringColor: colors.success
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{skill}</div>
                          {stats && stats.attempts > 0 && (
                            <div className="text-xs mt-1 opacity-75">
                              {stats.accuracy.toFixed(0)}% accuracy ({stats.attempts} attempts)
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <span className="text-green-500 ml-2">✓</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {preferences.specificSkills.length > 0 && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: colors.border }}>
                  <p className="text-sm" style={{ color: colors['text-secondary'] }}>
                    <strong>{preferences.specificSkills.length}</strong> skill{preferences.specificSkills.length !== 1 ? 's' : ''} selected
                  </p>
                  <button
                    onClick={() => handlePreferenceChange('specificSkills', [])}
                    className="text-xs underline mt-1 opacity-75 hover:opacity-100"
                    style={{ color: colors['text-secondary'] }}
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Session Summary */}
          <div 
            className={`${classes.card} p-6`}
            style={{ 
              backgroundColor: colors['surface-secondary'],
              borderColor: colors.border 
            }}
          >
            <h3 className="text-lg font-semibold mb-3" style={{ color: colors.text }}>
              Session Summary
            </h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: colors['text-secondary'] }}>Format:</span>
                <span style={{ color: colors.text }}>{preferences.testType} {preferences.subject}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: colors['text-secondary'] }}>Difficulty:</span>
                <span style={{ color: colors.text }}>{preferences.difficulty}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: colors['text-secondary'] }}>Questions:</span>
                <span style={{ color: colors.text }}>{preferences.questionCount}</span>
              </div>
              {preferences.timeLimit && (
                <div className="flex justify-between">
                  <span style={{ color: colors['text-secondary'] }}>Time Limit:</span>
                  <span style={{ color: colors.text }}>{preferences.timeLimitMinutes} min</span>
                </div>
              )}
              <div className="flex justify-between">
                <span style={{ color: colors['text-secondary'] }}>Available:</span>
                <span style={{ color: colors.text }}>{filteredQuestions.length} questions</span>
              </div>
            </div>

            {/* Warning if too few questions */}
            {filteredQuestions.length < preferences.questionCount && (
              <div 
                className="mt-3 p-2 rounded text-xs"
                style={{ backgroundColor: colors['warning-light'], color: colors.text }}
              >
                ⚠️ Only {filteredQuestions.length} questions available with current filters
              </div>
            )}
          </div>

          {/* Start Button */}
          <button
            onClick={handleStartPractice}
            disabled={filteredQuestions.length === 0}
            className={`
              w-full py-4 rounded-lg font-bold text-lg transition-all duration-200 
              hover:scale-105 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed
            `}
            style={{
              backgroundColor: filteredQuestions.length > 0 ? colors.primary : colors.secondary,
              color: 'white',
              focusRingColor: colors.primary + '40'
            }}
          >
            {filteredQuestions.length > 0 ? (
              <>
                🚀 Start Practice Session
                {preferences.subject === 'Math' && (
                  <div className="text-sm font-normal opacity-90 mt-1">
                    Calculator included
                  </div>
                )}
              </>
            ) : (
              'No Questions Available'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PracticeSelection;
