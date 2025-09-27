import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Practice = ({ user, userProgress, updateProgress }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });
  const [questionIndex, setQuestionIndex] = useState(0);

  const OPENSAT_API_URL = 'https://api.jsonsilo.com/public/942c3c3b-3a0c-4be3-81c2-12029def19f5';

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(OPENSAT_API_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch questions: ${response.status}`);
      }
      
      const apiData = await response.json();
      
      if (apiData.math && Array.isArray(apiData.math)) {
        const processedQuestions = apiData.math.map(q => ({
          id: q.id,
          skill: q.domain || 'Math',
          question: q.question?.question || q.question?.paragraph || 'Question unavailable',
          choices: Object.values(q.question?.choices || {}),
          correct: Object.keys(q.question?.choices || {}).indexOf(q.question?.correct_answer),
          explanation: q.question?.explanation || 'No explanation available',
          difficulty: q.difficulty || 'Medium'
        }));
        
        const shuffledQuestions = processedQuestions.sort(() => Math.random() - 0.5);
        setQuestions(shuffledQuestions);
        
        const firstQuestion = selectAdaptiveQuestion(shuffledQuestions, userProgress);
        setCurrentQuestion(firstQuestion);
        setLoading(false);
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (err) {
      console.error('Error loading questions:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const selectAdaptiveQuestion = (questionsList, progress) => {
    if (!progress?.skill_stats) {
      return questionsList[Math.floor(Math.random() * questionsList.length)];
    }

    const skillStats = progress.skill_stats;
    const skillAccuracy = {};
    
    Object.keys(skillStats).forEach(skill => {
      const stats = skillStats[skill];
      skillAccuracy[skill] = stats.attempts > 0 ? stats.correct / stats.attempts : 0;
    });

    const weightedQuestions = questionsList.map(q => {
      const accuracy = skillAccuracy[q.skill] || 0;
      const weight = accuracy < 0.1 ? 10 : Math.max(1, 1 / (accuracy + 0.1));
      return { question: q, weight };
    });

    const totalWeight = weightedQuestions.reduce((sum, wq) => sum + wq.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const wq of weightedQuestions) {
      random -= wq.weight;
      if (random <= 0) {
        return wq.question;
      }
    }

    return questionsList[0];
  };

  const handleAnswerSelect = async (answerIndex) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);
    
    const isCorrect = answerIndex === currentQuestion.correct;
    setSessionStats(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));

    // Update progress in Supabase
    if (userProgress) {
      const skill = currentQuestion.skill;
      const skillStats = { ...userProgress.skill_stats };
      
      if (!skillStats[skill]) {
        skillStats[skill] = { correct: 0, attempts: 0 };
      }
      
      skillStats[skill].attempts += 1;
      if (isCorrect) {
        skillStats[skill].correct += 1;
      }

      const updatedProgress = {
        points: (userProgress.points || 0) + (isCorrect ? 10 : 0),
        streak: isCorrect ? (userProgress.streak || 0) + 1 : 0,
        skill_stats: skillStats,
        updated_at: new Date().toISOString()
      };

      await updateProgress(updatedProgress);
    }
  };

  const nextQuestion = () => {
    const nextQ = selectAdaptiveQuestion(questions, userProgress);
    setCurrentQuestion(nextQ);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setQuestionIndex(prev => prev + 1);
  };

  const getChoiceStyle = (choiceIndex) => {
    const baseClasses = "w-full p-4 text-left border-2 rounded-xl transition-all duration-200 font-medium";
    
    if (selectedAnswer === null) {
      return `${baseClasses} border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md`;
    }
    
    if (choiceIndex === currentQuestion.correct) {
      return `${baseClasses} border-green-500 bg-green-50 text-green-900 shadow-lg`;
    } else if (choiceIndex === selectedAnswer) {
      return `${baseClasses} border-red-500 bg-red-50 text-red-900 shadow-lg`;
    } else {
      return `${baseClasses} border-gray-200 bg-gray-50 text-gray-500`;
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Loading Practice Questions</h2>
          <p className="text-gray-600">Fetching questions from OpenSAT API...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-white rounded-2xl p-8 shadow-lg">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Questions</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={loadQuestions}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <Link
              to="/"
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-colors block text-center"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">No Questions Available</h2>
          <button
            onClick={loadQuestions}
            className="bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 mb-8 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-2"
              >
                ← Back to Home
              </Link>
              <div className="text-sm text-gray-600">
                Question {questionIndex + 1} • Session Score: {sessionStats.correct}/{sessionStats.total}
                {sessionStats.total > 0 && (
                  <span className="ml-2 text-blue-600 font-medium">
                    ({Math.round((sessionStats.correct/sessionStats.total)*100)}%)
                  </span>
                )}
              </div>
            </div>
            
            {userProgress && (
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <span className="text-gray-500">Points:</span>
                  <span className="font-semibold text-blue-600">{userProgress.points || 0}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-gray-500">Streak:</span>
                  <span className="font-semibold text-green-600">{userProgress.streak || 0}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-6">
          {/* Question metadata */}
          <div className="flex items-center space-x-3 mb-6">
            <span className="px-4 py-2 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
              {currentQuestion.skill}
            </span>
            <span className={`px-4 py-2 text-sm font-medium rounded-full ${getDifficultyColor(currentQuestion.difficulty)}`}>
              {currentQuestion.difficulty}
            </span>
          </div>

          {/* Question text */}
          <div className="text-lg leading-relaxed text-gray-900 mb-8 font-medium">
            {currentQuestion.question}
          </div>

          {/* Answer choices */}
          <div className="space-y-3 mb-8">
            {currentQuestion.choices.map((choice, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={selectedAnswer !== null}
                className={getChoiceStyle(index)}
              >
                <span className="font-bold text-lg mr-3">{String.fromCharCode(65 + index)}.</span>
                {choice}
              </button>
            ))}
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div className={`p-6 rounded-xl mb-6 border-l-4 ${
              selectedAnswer === currentQuestion.correct
                ? 'bg-green-50 border-green-400'
                : 'bg-red-50 border-red-400'
            }`}>
              <div className="flex items-center mb-3">
                <span className="text-2xl mr-2">
                  {selectedAnswer === currentQuestion.correct ? '✅' : '❌'}
                </span>
                <h4 className="text-lg font-bold">
                  {selectedAnswer === currentQuestion.correct ? 'Correct!' : 'Incorrect'}
                  {selectedAnswer !== currentQuestion.correct && (
                    <span className="text-base font-normal text-gray-600 ml-2">
                      (Correct answer: {String.fromCharCode(65 + currentQuestion.correct)})
                    </span>
                  )}
                </h4>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {currentQuestion.explanation}
              </p>
            </div>
          )}

          {/* Next button */}
          {showExplanation && (
            <div className="text-center">
              <button
                onClick={nextQuestion}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 mx-auto shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Next Question
                <span>→</span>
              </button>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Progress</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{sessionStats.total}</div>
              <div className="text-sm text-gray-600">Questions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{sessionStats.correct}</div>
              <div className="text-sm text-gray-600">Correct</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{sessionStats.total - sessionStats.correct}</div>
              <div className="text-sm text-gray-600">Incorrect</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {sessionStats.total > 0 ? Math.round((sessionStats.correct/sessionStats.total)*100) : 0}%
              </div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Practice;