import React, { useState, useEffect } from 'react';

const Practice = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [userProgress, setUserProgress] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  // OpenSAT API endpoint (same as your exam component)
  const OPENSAT_API_URL = 'https://api.jsonsilo.com/public/942c3c3b-3a0c-4be3-81c2-12029def19f5';

  useEffect(() => {
    initializePractice();
  }, []);

  const initializePractice = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load user progress from localStorage (same as exam page)
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        const progressKey = `sat_progress_${currentUser}`;
        const savedProgress = localStorage.getItem(progressKey);
        if (savedProgress) {
          setUserProgress(JSON.parse(savedProgress));
        }
      }

      // Fetch questions from OpenSAT API (same as exam component)
      const response = await fetch(OPENSAT_API_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch questions: ${response.status}`);
      }
      
      const apiData = await response.json();
      
      // Process the API response - the data has a "math" array with questions
      let processedQuestions = [];
      if (apiData.math && Array.isArray(apiData.math)) {
        processedQuestions = apiData.math.map(q => processOpenSATQuestion(q));
      } else {
        throw new Error('Invalid API response format - expected math array');
      }

      if (processedQuestions.length === 0) {
        throw new Error('No questions found in API response');
      }

      // Shuffle questions for variety
      const shuffledQuestions = processedQuestions.sort(() => Math.random() - 0.5);
      setQuestions(shuffledQuestions);
      
      // Select first question using adaptive logic
      const firstQuestion = selectNextQuestion(shuffledQuestions, userProgress);
      setCurrentQuestion(firstQuestion);
      setLoading(false);

    } catch (err) {
      console.error('Error fetching questions from OpenSAT API:', err);
      setError(`Failed to load questions: ${err.message}`);
      setLoading(false);
    }
  };

  // Process OpenSAT question format to match your app's format
  const processOpenSATQuestion = (apiQuestion) => {
    const choices = apiQuestion.question?.choices || {};
    const choicesArray = Object.values(choices);
    const correctAnswerKey = apiQuestion.question?.correct_answer;
    const correctIndex = Object.keys(choices).indexOf(correctAnswerKey);

    return {
      id: apiQuestion.id || Math.random().toString(),
      skill: apiQuestion.domain || 'general',
      question: apiQuestion.question?.question || apiQuestion.question?.paragraph || 'Question text unavailable',
      choices: choicesArray,
      correct: correctIndex >= 0 ? correctIndex : 0,
      explanation: apiQuestion.question?.explanation || 'No explanation available.',
      difficulty: apiQuestion.difficulty || 'Medium'
    };
  };

  // Adaptive question selection logic (same as exam component)
  const selectNextQuestion = (questionsList, progress) => {
    if (!progress || !progress.skillStats) {
      return questionsList[Math.floor(Math.random() * questionsList.length)];
    }

    // Calculate accuracy per skill
    const skillAccuracy = {};
    Object.keys(progress.skillStats).forEach(skill => {
      const stats = progress.skillStats[skill];
      skillAccuracy[skill] = stats.attempts > 0 ? stats.correct / stats.attempts : 0;
    });

    // Weight questions by inverse accuracy (focus on weaker skills)
    const weightedQuestions = questionsList.map(q => {
      const accuracy = skillAccuracy[q.skill] || 0;
      const weight = accuracy < 0.1 ? 10 : Math.max(1, 1 / (accuracy + 0.1));
      return { question: q, weight };
    });

    // Select weighted random question
    const totalWeight = weightedQuestions.reduce((sum, wq) => sum + wq.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const wq of weightedQuestions) {
      random -= wq.weight;
      if (random <= 0) {
        return wq.question;
      }
    }

    return questionsList[0]; // Fallback
  };

  const handleAnswerSelect = (answerIndex) => {
    if (selectedAnswer !== null) return; // Already answered
    
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);
    
    // Update score
    const isCorrect = answerIndex === currentQuestion.correct;
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));

    // Update user progress
    updateUserProgress(currentQuestion.skill, isCorrect);
  };

  const updateUserProgress = (skill, isCorrect) => {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return;

    const progressKey = `sat_progress_${currentUser}`;
    const savedProgress = JSON.parse(localStorage.getItem(progressKey) || '{}');
    
    // Initialize progress structure
    if (!savedProgress.skillStats) savedProgress.skillStats = {};
    if (!savedProgress.skillStats[skill]) {
      savedProgress.skillStats[skill] = { correct: 0, attempts: 0 };
    }

    // Update skill stats
    savedProgress.skillStats[skill].attempts += 1;
    if (isCorrect) {
      savedProgress.skillStats[skill].correct += 1;
      savedProgress.points = (savedProgress.points || 0) + 10;
    }

    // Update streak
    if (isCorrect) {
      savedProgress.streak = (savedProgress.streak || 0) + 1;
    } else {
      savedProgress.streak = 0;
    }

    // Save progress
    localStorage.setItem(progressKey, JSON.stringify(savedProgress));
    setUserProgress(savedProgress);
  };

  const nextQuestion = () => {
    // Reset state
    setSelectedAnswer(null);
    setShowExplanation(false);
    
    // Select next question using adaptive logic
    const nextQ = selectNextQuestion(questions, userProgress);
    setCurrentQuestion(nextQ);
    setCurrentQuestionIndex(prev => prev + 1);
  };

  const getChoiceStyle = (choiceIndex) => {
    const baseStyle = {
      padding: '15px 20px',
      textAlign: 'left',
      border: '2px solid #e0e0e0',
      borderRadius: '8px',
      fontSize: '14px',
      transition: 'all 0.2s ease',
      cursor: selectedAnswer === null ? 'pointer' : 'default',
      width: '100%',
      backgroundColor: 'white'
    };

    if (selectedAnswer === null) {
      return {
        ...baseStyle,
        ':hover': {
          backgroundColor: '#f8f9fa',
          borderColor: '#007bff'
        }
      };
    }

    if (choiceIndex === currentQuestion.correct) {
      return {
        ...baseStyle,
        backgroundColor: '#d4edda',
        borderColor: '#28a745',
        color: '#155724'
      };
    } else if (choiceIndex === selectedAnswer && choiceIndex !== currentQuestion.correct) {
      return {
        ...baseStyle,
        backgroundColor: '#f8d7da',
        borderColor: '#dc3545',
        color: '#721c24'
      };
    } else {
      return {
        ...baseStyle,
        backgroundColor: '#f8f9fa',
        borderColor: '#e0e0e0',
        color: '#6c757d'
      };
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty?.toLowerCase()) {
      case 'easy': return '#28a745';
      case 'medium': return '#ffc107';
      case 'hard': return '#dc3545';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ fontSize: '24px' }}>⏳</div>
        <h2 style={{ margin: 0, color: '#007bff' }}>Loading Practice Questions...</h2>
        <p style={{ margin: 0, color: '#6c757d' }}>Fetching questions from OpenSAT API...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        maxWidth: '600px', 
        margin: '50px auto', 
        padding: '30px',
        textAlign: 'center',
        backgroundColor: '#fee',
        borderRadius: '12px',
        border: '1px solid #fcc'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
        <h2 style={{ color: '#dc3545', marginBottom: '15px' }}>Error Loading Questions</h2>
        <p style={{ color: '#721c24', marginBottom: '25px' }}>{error}</p>
        <button 
          onClick={initializePractice}
          style={{ 
            padding: '12px 24px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div style={{ 
        maxWidth: '600px', 
        margin: '50px auto', 
        padding: '30px',
        textAlign: 'center'
      }}>
        <h2>No Questions Available</h2>
        <p>Unable to load questions from the API.</p>
        <button 
          onClick={initializePractice}
          style={{ 
            padding: '12px 24px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '900px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{ 
        marginBottom: '30px',
        textAlign: 'center',
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ 
          margin: '0 0 15px 0', 
          color: '#007bff',
          fontSize: '28px',
          fontWeight: '600'
        }}>
          🎯 SAT Practice Mode
        </h1>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '30px',
          flexWrap: 'wrap',
          fontSize: '16px',
          color: '#495057'
        }}>
          <span><strong>Question:</strong> {currentQuestionIndex + 1}</span>
          <span><strong>Score:</strong> {score.correct}/{score.total}</span>
          <span><strong>Accuracy:</strong> {score.total > 0 ? Math.round((score.correct/score.total)*100) : 0}%</span>
          {userProgress && (
            <span><strong>Streak:</strong> {userProgress.streak || 0}</span>
          )}
        </div>
      </div>

      {/* Question Card */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '35px', 
        borderRadius: '16px', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        marginBottom: '25px'
      }}>
        {/* Question Meta Info */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '20px',
          alignItems: 'center'
        }}>
          <span style={{ 
            backgroundColor: '#e3f2fd', 
            color: '#1976d2', 
            padding: '6px 14px', 
            borderRadius: '20px', 
            fontSize: '13px',
            fontWeight: '500'
          }}>
            {currentQuestion.skill}
          </span>
          <span style={{ 
            backgroundColor: getDifficultyColor(currentQuestion.difficulty), 
            color: 'white', 
            padding: '6px 14px', 
            borderRadius: '20px', 
            fontSize: '13px',
            fontWeight: '500'
          }}>
            {currentQuestion.difficulty}
          </span>
        </div>
        
        {/* Question Text */}
        <div style={{ 
          fontSize: '18px', 
          lineHeight: '1.7', 
          marginBottom: '30px',
          fontWeight: '500',
          color: '#212529'
        }}>
          {currentQuestion.question}
        </div>
        
        {/* Answer Choices */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px' 
        }}>
          {currentQuestion.choices.map((choice, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              disabled={selectedAnswer !== null}
              style={getChoiceStyle(index)}
            >
              <strong>{String.fromCharCode(65 + index)}.</strong> {choice}
            </button>
          ))}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div style={{ 
            marginTop: '30px', 
            padding: '25px', 
            backgroundColor: selectedAnswer === currentQuestion.correct ? '#d4edda' : '#fff3cd', 
            borderRadius: '12px',
            borderLeft: `5px solid ${selectedAnswer === currentQuestion.correct ? '#28a745' : '#ffc107'}`
          }}>
            <h4 style={{ 
              marginBottom: '12px', 
              color: selectedAnswer === currentQuestion.correct ? '#155724' : '#856404',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              {selectedAnswer === currentQuestion.correct ? '✅ Correct!' : '❌ Incorrect'}
              {selectedAnswer !== currentQuestion.correct && (
                <span style={{ fontSize: '14px', fontWeight: 'normal' }}>
                  {' '}(Correct answer: {String.fromCharCode(65 + currentQuestion.correct)})
                </span>
              )}
            </h4>
            <p style={{ 
              margin: 0, 
              lineHeight: '1.6',
              color: selectedAnswer === currentQuestion.correct ? '#155724' : '#856404'
            }}>
              {currentQuestion.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Next Question Button */}
      {showExplanation && (
        <div style={{ textAlign: 'center' }}>
          <button 
            onClick={nextQuestion}
            style={{
              padding: '14px 32px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: '600',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
          >
            Next Question →
          </button>
        </div>
      )}
    </div>
  );
};

export default Practice;
