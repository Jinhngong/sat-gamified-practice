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
      
      const questionsData = await response.json();
      
      // Handle the API response format
      let processedQuestions = [];
      if (Array.isArray(questionsData)) {
        processedQuestions = questionsData.map(q => processOpenSATQuestion(q));
      } else if (questionsData.questions) {
        processedQuestions = questionsData.questions.map(q => processOpenSATQuestion(q));
      } else {
        throw new Error('Invalid question data format');
      }

      if (processedQuestions.length === 0) {
        throw new Error('No questions found in API response');
      }

      setQuestions(processedQuestions);
      
      // Select first question using adaptive logic
      const firstQuestion = selectNextQuestion(processedQuestions, userProgress);
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
      explanation: apiQuestion.question?.explanation || 'No explanation available.'
    };
  };

  // Adaptive question selection logic
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
    if (selectedAnswer === null) return 'choice-button';
    
    if (choiceIndex === currentQuestion.correct) {
      return 'choice-button correct';
    } else if (choiceIndex === selectedAnswer && choiceIndex !== currentQuestion.correct) {
      return 'choice-button incorrect';
    } else {
      return 'choice-button disabled';
    }
  };

  if (loading) {
    return (
      <div className="practice-container" style={{ padding: '20px', textAlign: 'center' }}>
        <div className="loading">
          <h2>Loading Practice Questions...</h2>
          <p>Fetching questions from OpenSAT API...</p>
          <div style={{ margin: '20px 0' }}>⏳</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="practice-container" style={{ padding: '20px', textAlign: 'center' }}>
        <div className="error" style={{ backgroundColor: '#fee', padding: '20px', borderRadius: '8px', border: '1px solid #fcc' }}>
          <h2>❌ Error Loading Questions</h2>
          <p>{error}</p>
          <button 
            onClick={initializePractice}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="practice-container" style={{ padding: '20px', textAlign: 'center' }}>
        <h2>No Questions Available</h2>
        <p>Unable to load questions from the API.</p>
        <button onClick={initializePractice}>Retry</button>
      </div>
    );
  }

  return (
    <div className="practice-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div className="practice-header" style={{ marginBottom: '20px' }}>
        <h2>🎯 SAT Practice Mode</h2>
        <div className="score-info" style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
          <span>Question {currentQuestionIndex + 1}</span>
          <span>Score: {score.correct}/{score.total}</span>
          {userProgress && (
            <span>Streak: {userProgress.streak || 0}</span>
          )}
        </div>
      </div>

      <div className="question-card" style={{ 
        backgroundColor: 'white', 
        padding: '30px', 
        borderRadius: '12px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <div className="skill-tag" style={{ 
          display: 'inline-block', 
          backgroundColor: '#e3f2fd', 
          color: '#1976d2', 
          padding: '4px 12px', 
          borderRadius: '16px', 
          fontSize: '12px',
          marginBottom: '15px'
        }}>
          {currentQuestion.skill}
        </div>
        
        <div className="question-text" style={{ 
          fontSize: '16px', 
          lineHeight: '1.6', 
          marginBottom: '25px',
          fontWeight: '500'
        }}>
          {currentQuestion.question}
        </div>
        
        <div className="choices" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {currentQuestion.choices.map((choice, index) => (
            <button
              key={index}
              className={getChoiceStyle(index)}
              onClick={() => handleAnswerSelect(index)}
              disabled={selectedAnswer !== null}
              style={{
                padding: '15px 20px',
                textAlign: 'left',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                backgroundColor: selectedAnswer === null ? 'white' : 
                  index === currentQuestion.correct ? '#d4edda' :
                  index === selectedAnswer ? '#f8d7da' : '#f8f9fa',
                borderColor: selectedAnswer === null ? '#e0e0e0' :
                  index === currentQuestion.correct ? '#28a745' :
                  index === selectedAnswer && index !== currentQuestion.correct ? '#dc3545' : '#e0e0e0',
                cursor: selectedAnswer === null ? 'pointer' : 'default',
                fontSize: '14px',
                transition: 'all 0.2s ease'
              }}
            >
              <strong>{String.fromCharCode(65 + index)}.</strong> {choice}
            </button>
          ))}
        </div>

        {showExplanation && (
          <div className="explanation" style={{ 
            marginTop: '25px', 
            padding: '20px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px',
            borderLeft: '4px solid #007bff'
          }}>
            <h4 style={{ marginBottom: '10px', color: '#007bff' }}>
              {selectedAnswer === currentQuestion.correct ? '✅ Correct!' : '❌ Incorrect'}
            </h4>
            <p style={{ margin: 0, lineHeight: '1.5' }}>{currentQuestion.explanation}</p>
          </div>
        )}
      </div>

      {showExplanation && (
        <div style={{ textAlign: 'center' }}>
          <button 
            onClick={nextQuestion}
            style={{
              padding: '12px 30px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Next Question →
          </button>
        </div>
      )}
    </div>
  );
};

export default Practice;
