// src/App.js
import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import PracticeSelection from './components/PracticeSelection';
import MathQuestion from './components/MathQuestion';
import EnglishQuestion from './components/EnglishQuestion'; // You'll need to create this
import Dashboard from './components/Dashboard';
import AuthScreen from './components/AuthScreen';
import './App.css';

// Enhanced App component with theme integration
function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('auth'); // auth, dashboard, practice-setup, practice
  const [practiceSession, setPracticeSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questionBank, setQuestionBank] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [sessionProgress, setSessionProgress] = useState({
    correct: 0,
    total: 0,
    answers: []
  });

  // Load question bank and user data on mount
  useEffect(() => {
    loadQuestionBank();
    checkAuthStatus();
  }, []);

  const loadQuestionBank = async () => {
    try {
      const response = await fetch('/questions.json');
      const data = await response.json();
      setQuestionBank(data);
    } catch (error) {
      console.error('Failed to load question bank:', error);
      // Fallback to sample data
      setQuestionBank(getSampleQuestions());
    }
  };

  const checkAuthStatus = () => {
    const savedUser = localStorage.getItem('sat_current_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setCurrentUser(userData);
      setCurrentScreen('dashboard');
      loadUserProgress(userData.id);
    }
  };

  const loadUserProgress = (userId) => {
    const progressKey = `sat_progress_${userId}`;
    const savedProgress = localStorage.getItem(progressKey);
    if (savedProgress) {
      setUserProgress(JSON.parse(savedProgress));
    } else {
      // Initialize empty progress
      const initialProgress = {
        points: 0,
        streak: 0,
        skill_stats: {},
        session_history: []
      };
      setUserProgress(initialProgress);
      localStorage.setItem(progressKey, JSON.stringify(initialProgress));
    }
  };

  const saveUserProgress = (newProgress) => {
    const progressKey = `sat_progress_${currentUser.id}`;
    localStorage.setItem(progressKey, JSON.stringify(newProgress));
    setUserProgress(newProgress);
  };

  const handleLogin = (userData) => {
    setCurrentUser(userData);
    setCurrentScreen('dashboard');
    localStorage.setItem('sat_current_user', JSON.stringify(userData));
    loadUserProgress(userData.id);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentScreen('auth');
    setPracticeSession(null);
    setCurrentQuestion(0);
    localStorage.removeItem('sat_current_user');
  };

  const handleStartPractice = (preferences) => {
    // Filter questions based on preferences
    let filteredQuestions = questionBank.filter(q => {
      const matchesSubject = q.subject?.toLowerCase() === preferences.subject.toLowerCase() || 
                             (preferences.subject === 'English' && (q.subject === 'Reading' || q.subject === 'Writing'));
      const matchesTestType = !q.testType || q.testType === preferences.testType;
      const matchesDifficulty = preferences.difficulty === 'Mixed' || q.difficulty === preferences.difficulty;
      const matchesSkills = preferences.specificSkills.length === 0 || 
                            preferences.specificSkills.includes(q.skill || q.category || q.domain);
      
      return matchesSubject && matchesTestType && matchesDifficulty && matchesSkills;
    });

    // Apply adaptive question selection if no specific skills selected
    if (preferences.specificSkills.length === 0) {
      filteredQuestions = applyAdaptiveSelection(filteredQuestions, userProgress);
    }

    // Shuffle questions
    filteredQuestions = shuffleArray(filteredQuestions);

    // Limit to requested number of questions
    filteredQuestions = filteredQuestions.slice(0, preferences.questionCount);

    const session = {
      preferences,
      questions: filteredQuestions,
      startTime: Date.now(),
      timeLimit: preferences.timeLimit ? preferences.timeLimitMinutes * 60 : null
    };

    setPracticeSession(session);
    setCurrentQuestion(0);
    setSessionProgress({ correct: 0, total: 0, answers: [] });
    setCurrentScreen('practice');
  };

  const handleQuestionAnswer = (answerData) => {
    const question = practiceSession.questions[currentQuestion];
    const isCorrect = checkAnswer(question, answerData);
    
    // Update session progress
    const newAnswer = {
      questionId: question.id,
      question: question,
      userAnswer: answerData,
      correct: isCorrect,
      timeSpent: answerData.timeSpent || 0
    };

    const newSessionProgress = {
      correct: sessionProgress.correct + (isCorrect ? 1 : 0),
      total: sessionProgress.total + 1,
      answers: [...sessionProgress.answers, newAnswer]
    };

    setSessionProgress(newSessionProgress);

    // Update user progress
    updateUserProgress(question, isCorrect);

    // Move to next question or finish session
    if (currentQuestion + 1 < practiceSession.questions.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      finishPracticeSession(newSessionProgress);
    }
  };

  const updateUserProgress = (question, isCorrect) => {
    const skill = question.skill || question.category || question.domain || 'General';
    
    const newProgress = { ...userProgress };
    
    // Update skill stats
    if (!newProgress.skill_stats[skill]) {
      newProgress.skill_stats[skill] = { correct: 0, attempts: 0 };
    }
    
    newProgress.skill_stats[skill].attempts += 1;
    if (isCorrect) {
      newProgress.skill_stats[skill].correct += 1;
      newProgress.points += 10;
    }

    // Update streak
    if (isCorrect) {
      newProgress.streak += 1;
    } else {
      newProgress.streak = 0;
    }

    saveUserProgress(newProgress);
  };

  const finishPracticeSession = (finalProgress) => {
    // Add session to history
    const sessionSummary = {
      date: new Date().toISOString(),
      preferences: practiceSession.preferences,
      results: finalProgress,
      duration: Date.now() - practiceSession.startTime
    };

    const newProgress = {
      ...userProgress,
      session_history: [...(userProgress.session_history || []), sessionSummary]
    };

    saveUserProgress(newProgress);
    
    // Show results screen
    setCurrentScreen('results');
  };

  const checkAnswer = (question, answerData) => {
    if (question.type === 'multiple-choice') {
      return answerData.selectedAnswer === question.correctAnswer;
    } else {
      // For student response, you might want more sophisticated checking
      const userAnswer = answerData.userAnswer.toLowerCase().trim();
      const correctAnswer = question.correctAnswer.toLowerCase().trim();
      return userAnswer === correctAnswer;
    }
  };

  const applyAdaptiveSelection = (questions, progress) => {
    // Weight questions based on user's skill performance
    const skillStats = progress.skill_stats || {};
    
    return questions.map(q => {
      const skill = q.skill || q.category || q.domain || 'General';
      const stats = skillStats[skill];
      
      let weight = 1;
      if (stats && stats.attempts > 0) {
        const accuracy = stats.correct / stats.attempts;
        // Lower accuracy = higher weight (more likely to be selected)
        weight = Math.max(0.1, 1 - accuracy);
      }
      
      return { ...q, weight };
    });
  };

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const getSampleQuestions = () => {
    // Sample questions for fallback
    return [
      {
        id: 1,
        subject: 'Math',
        testType: 'SAT',
        skill: 'Algebra',
        difficulty: 'Medium',
        type: 'multiple-choice',
        question: 'If $2x + 3 = 11$, what is the value of $x$?',
        options: [
          '$x = 2,
          '$x = 4, 
          '$x = 7,
          '$x = 8
        ],
        correctAnswer: 1
      },
      {
        id: 2,
        subject: 'Math',
        testType: 'SAT',
        skill: 'Geometry',
        difficulty: 'Hard',
        type: 'multiple-choice',
        question: 'A circle has center $(3, -2)$ and radius $5$. What is the equation of this circle?',
        options: [
          '$(x-3)^2 + (y+2)^2 = 25,
          '$(x+3)^2 + (y-2)^2 = 25,
          '$(x-3)^2 + (y+2)^2 = 5,
          '$(x+3)^2 + (y-2)^2 = 5
        ],
        correctAnswer: 0
      }
    ];
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'auth':
        return <AuthScreen onLogin={handleLogin} />;
      
      case 'dashboard':
        return (
          <Dashboard 
            user={currentUser}
            progress={userProgress}
            onStartPractice={() => setCurrentScreen('practice-setup')}
            onLogout={handleLogout}
          />
        );
      
      case 'practice-setup':
        return (
          <PracticeSelection
            questionBank={questionBank}
            userProgress={userProgress}
            onStartPractice={handleStartPractice}
            onBack={() => setCurrentScreen('dashboard')}
          />
        );
      
      case 'practice':
        if (!practiceSession || !practiceSession.questions[currentQuestion]) {
          return <div>Loading question...</div>;
        }

        const question = practiceSession.questions[currentQuestion];
        const timeRemaining = practiceSession.timeLimit ? 
          Math.max(0, practiceSession.timeLimit - Math.floor((Date.now() - practiceSession.startTime) / 1000)) : 
          undefined;

        // Render appropriate question component based on subject
        if (question.subject === 'Math' || practiceSession.preferences.subject === 'Math') {
          return (
            <MathQuestion
              question={question}
              onAnswer={handleQuestionAnswer}
              currentQuestionNumber={currentQuestion + 1}
              totalQuestions={practiceSession.questions.length}
              timeRemaining={timeRemaining}
              showCalculator={true}
            />
          );
        } else {
          return (
            <EnglishQuestion
              question={question}
              onAnswer={handleQuestionAnswer}
              currentQuestionNumber={currentQuestion + 1}
              totalQuestions={practiceSession.questions.length}
              timeRemaining={timeRemaining}
            />
          );
        }
      
      case 'results':
        return (
          <ResultsScreen
            sessionProgress={sessionProgress}
            practiceSession={practiceSession}
            onReturnToDashboard={() => setCurrentScreen('dashboard')}
            onRetrySession={() => handleStartPractice(practiceSession.preferences)}
          />
        );
      
      default:
        return <div>Unknown screen</div>;
    }
  };

  return (
    <ThemeProvider>
      <AppContent 
        currentScreen={currentScreen}
        renderCurrentScreen={renderCurrentScreen}
        currentUser={currentUser}
      />
    </ThemeProvider>
  );
}

// Separate component to use theme context
function AppContent({ currentScreen, renderCurrentScreen, currentUser }) {
  const { colors, classes } = useTheme();

  return (
    <div 
      className="min-h-screen transition-all duration-300"
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      {/* Header */}
      {currentUser && (
        <header 
          className={`${classes.border} border-b sticky top-0 z-40 backdrop-blur-sm`}
          style={{ 
            backgroundColor: colors.surface + 'F0',
            borderBottomColor: colors.border 
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-bold" style={{ color: colors.text }}>
                  🎯 SAT Practice
                </h1>
                {currentUser && (
                  <span className="text-sm" style={{ color: colors['text-secondary'] }}>
                    Welcome, {currentUser.username}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-4">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {renderCurrentScreen()}
      </main>

      {/* Global Styles */}
      <style jsx global>{`
        /* Custom LaTeX styling */
        .latex-content .MathJax {
          color: ${colors.text} !important;
        }
        
        .latex-content .MathJax_Display {
          margin: 1em 0 !important;
        }
        
        /* Scrollbar styling */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: ${colors['surface-secondary']};
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: ${colors.border};
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: ${colors.secondary};
        }

        /* Focus styles */
        *:focus {
          outline: 2px solid ${colors.primary};
          outline-offset: 2px;
        }

        /* Animation keyframes */
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}
      `}</style>
    </div>
  );
}

// Results Screen Component
function ResultsScreen({ sessionProgress, practiceSession, onReturnToDashboard, onRetrySession }) {
  const { colors, classes } = useTheme();
  
  const accuracy = sessionProgress.total > 0 ? 
    Math.round((sessionProgress.correct / sessionProgress.total) * 100) : 0;

  const getPerformanceMessage = (accuracy) => {
    if (accuracy >= 90) return { message: "Outstanding! 🏆", color: colors.success };
    if (accuracy >= 80) return { message: "Great work! 🎉", color: colors.success };
    if (accuracy >= 70) return { message: "Good job! 👍", color: colors.info };
    if (accuracy >= 60) return { message: "Keep practicing! 📚", color: colors.warning };
    return { message: "Don't give up! 💪", color: colors.error };
  };

  const performance = getPerformanceMessage(accuracy);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div 
        className={`${classes.card} p-8 text-center mb-6`}
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        <div className="text-6xl mb-4">🎯</div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
          Practice Session Complete!
        </h1>
        <p className="text-lg" style={{ color: performance.color }}>
          {performance.message}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div 
          className={`${classes.card} p-6 text-center`}
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        >
          <div className="text-3xl font-bold mb-2" style={{ color: colors.primary }}>
            {accuracy}%
          </div>
          <div style={{ color: colors['text-secondary'] }}>Accuracy</div>
        </div>

        <div 
          className={`${classes.card} p-6 text-center`}
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        >
          <div className="text-3xl font-bold mb-2" style={{ color: colors.accent }}>
            {sessionProgress.correct}/{sessionProgress.total}
          </div>
          <div style={{ color: colors['text-secondary'] }}>Correct</div>
        </div>

        <div 
          className={`${classes.card} p-6 text-center`}
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        >
          <div className="text-3xl font-bold mb-2" style={{ color: colors.secondary }}>
            {Math.round((Date.now() - practiceSession.startTime) / 60000)}
          </div>
          <div style={{ color: colors['text-secondary'] }}>Minutes</div>
        </div>
      </div>

      <div className="flex justify-center space-x-4">
        <button
          onClick={onReturnToDashboard}
          className={`${classes.button} px-6 py-3`}
          style={{ 
            backgroundColor: colors.secondary,
            color: 'white'
          }}
        >
          Return to Dashboard
        </button>
        
        <button
          onClick={onRetrySession}
          className={`${classes.button} px-6 py-3`}
          style={{ 
            backgroundColor: colors.primary,
            color: 'white'
          }}
        >
          Practice Again
        </button>
      </div>
    </div>
  );
}

export default App;
