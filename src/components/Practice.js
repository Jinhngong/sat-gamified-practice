// Practice.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import renderLatex from './renderLatex'; // ✅ using the new helper in the same folder

const Practice = ({ user, userProgress, updateProgress }) => {
  // State variables
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });
  const [questionIndex, setQuestionIndex] = useState(0);

  // Filter states
  const [selectedAssessment, setSelectedAssessment] = useState('SAT');
  const [selectedTestType, setSelectedTestType] = useState('math');
  const [selectedDomains, setSelectedDomains] = useState({
    Algebra: true,
    'Advanced Math': true,
    'Problem-Solving and Data Analysis': true,
    'Geometry and Trigonometry': true,
    'Information and Ideas': true,
    'Craft and Structure': true,
    'Expression of Ideas': true,
    'Standard English Conventions': true,
  });
  const [selectedDifficulties, setSelectedDifficulties] = useState({
    1: true,
    2: true,
    3: true,
  });
  const [showFilters, setShowFilters] = useState(true);
  const [filteredQuestions, setFilteredQuestions] = useState([]);

  // Constants
  const OPENSAT_API_URL =
    'https://api.jsonsilo.com/public/942c3c3b-3a0c-4be3-81c2-12029def19f5';

  const assessmentOptions = [
    { value: 'PSAT/NMSQT & PSAT 10', label: 'PSAT/NMSQT & PSAT 10' },
    { value: 'SAT', label: 'SAT' },
    { value: 'PSAT 8/9', label: 'PSAT 8/9' },
  ];

  const testTypeOptions = [
    { value: 'math', label: 'Math' },
    { value: 'english', label: 'Reading and Writing' },
  ];

  const domainsByTestType = {
    math: [
      'Algebra',
      'Advanced Math',
      'Problem-Solving and Data Analysis',
      'Geometry and Trigonometry',
    ],
    english: [
      'Information and Ideas',
      'Craft and Structure',
      'Expression of Ideas',
      'Standard English Conventions',
    ],
  };

  // Load questions when filters change
  useEffect(() => {
    if (!showFilters) {
      loadQuestions();
    }
  }, [
    selectedAssessment,
    selectedTestType,
    selectedDomains,
    selectedDifficulties,
    showFilters,
  ]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(OPENSAT_API_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch questions: ${response.status}`);
      }

      const apiData = await response.json();

      // Process questions from the selected test type
      let rawQuestions = [];
      if (selectedTestType === 'math' && apiData.math) {
        rawQuestions = apiData.math;
      } else if (selectedTestType === 'english' && apiData.english) {
        rawQuestions = apiData.english;
      }

      if (Array.isArray(rawQuestions)) {
        const processedQuestions = rawQuestions.map((q) => ({
          id: q.id,
          skill: q.skill || q.domain || 'Unknown',
          domain: q.domain || q.skill || 'Unknown',
          question:
            selectedTestType === 'math'
              ? renderLatex(
                  q.question?.question ||
                    q.question?.paragraph ||
                    'Question unavailable'
                )
              : q.question?.question ||
                q.question?.paragraph ||
                'Question unavailable',
          choices:
            selectedTestType === 'math'
              ? Object.values(q.question?.choices || {}).map((choice) =>
                  renderLatex(choice)
                )
              : Object.values(q.question?.choices || {}),
          correct: Object.keys(q.question?.choices || {}).indexOf(
            q.question?.correct_answer
          ),
          explanation:
            selectedTestType === 'math'
              ? renderLatex(q.question?.explanation || 'No explanation available')
              : q.question?.explanation || 'No explanation available',
          difficulty: parseInt(q.difficulty) || 2,
          assessment: q.assessment || selectedAssessment,
          serialNumber: q.serial_number || q.id,
        }));

        // Apply filters
        const filtered = processedQuestions.filter((q) => {
          const domainMatch = selectedDomains[q.domain] || selectedDomains[q.skill];
          const difficultyMatch = selectedDifficulties[q.difficulty];
          const assessmentMatch =
            q.assessment === selectedAssessment || selectedAssessment === 'SAT';

          return domainMatch && difficultyMatch && assessmentMatch;
        });

        setQuestions(filtered);
        setFilteredQuestions(filtered);

        if (filtered.length > 0) {
          const firstQuestion = selectAdaptiveQuestion(filtered, userProgress);
          setCurrentQuestion(firstQuestion);
        } else {
          setCurrentQuestion(null);
        }

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
    if (!progress?.skill_stats || questionsList.length === 0) {
      return questionsList[Math.floor(Math.random() * questionsList.length)];
    }

    const skillStats = progress.skill_stats;
    const skillAccuracy = {};

    Object.keys(skillStats).forEach((skill) => {
      const stats = skillStats[skill];
      skillAccuracy[skill] =
        stats.attempts > 0 ? stats.correct / stats.attempts : 0;
    });

    const weightedQuestions = questionsList.map((q) => {
      const accuracy = skillAccuracy[q.skill] || skillAccuracy[q.domain] || 0;
      const weight =
        accuracy < 0.1 ? 10 : Math.max(1, 1 / (accuracy + 0.1));
      return { question: q, weight };
    });

    const totalWeight = weightedQuestions.reduce(
      (sum, wq) => sum + wq.weight,
      0
    );
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
    setSessionStats((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));

    // Update progress in Supabase
    if (userProgress) {
      const skill = currentQuestion.skill || currentQuestion.domain;
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
        updated_at: new Date().toISOString(),
      };

      await updateProgress(updatedProgress);
    }
  };

  const nextQuestion = () => {
    const nextQ = selectAdaptiveQuestion(filteredQuestions, userProgress);
    setCurrentQuestion(nextQ);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setQuestionIndex((prev) => prev + 1);
  };

  const handleDomainChange = (domain) => {
    setSelectedDomains((prev) => ({
      ...prev,
      [domain]: !prev[domain],
    }));
  };

  const handleDifficultyChange = (difficulty) => {
    setSelectedDifficulties((prev) => ({
      ...prev,
      [difficulty]: !prev[difficulty],
    }));
  };

  const resetFilters = () => {
    setSelectedAssessment('SAT');
    setSelectedTestType('math');
    setSelectedDomains({
      Algebra: true,
      'Advanced Math': true,
      'Problem-Solving and Data Analysis': true,
      'Geometry and Trigonometry': true,
      'Information and Ideas': true,
      'Craft and Structure': true,
      'Expression of Ideas': true,
      'Standard English Conventions': true,
    });
    setSelectedDifficulties({ 1: true, 2: true, 3: true });
  };

  const getChoiceStyle = (choiceIndex) => {
    const baseClasses =
      'w-full p-4 text-left border-2 rounded-xl transition-all duration-200 font-medium';

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
    switch (difficulty) {
      case 1:
        return 'bg-green-100 text-green-800';
      case 3:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getDifficultyLabel = (difficulty) => {
    switch (difficulty) {
      case 1:
        return 'Easy';
      case 3:
        return 'Hard';
      default:
        return 'Medium';
    }
  };

  // --------------------------
  // Render filter selection screen
  // --------------------------
  if (showFilters) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Practice Settings
              </h1>
              <Link
                to="/"
                className="text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-2"
              >
                ← Back to Home
              </Link>
            </div>

            {/* Assessment Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Select Assessment
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {assessmentOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedAssessment(option.value)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedAssessment === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Test Type Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Select Test Type
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {testTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedTestType(option.value)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedTestType === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Domain Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Select{' '}
                {selectedTestType === 'math' ? 'Math' : 'Reading and Writing'}{' '}
                Domains
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {domainsByTestType[selectedTestType].map((domain) => (
                  <label key={domain} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedDomains[domain] || false}
                      onChange={() => handleDomainChange(domain)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{domain}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Difficulty Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Select Difficulty Levels
              </h3>
              <div className="flex gap-4">
                {[1, 2, 3].map((difficulty) => (
                  <label key={difficulty} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedDifficulties[difficulty] || false}
                      onChange={() => handleDifficultyChange(difficulty)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(
                        difficulty
                      )}`}
                    >
                      {getDifficultyLabel(difficulty)} (Level {difficulty})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setShowFilters(false)}
                className="flex-1 bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Start Practice Session
              </button>
              <button
                onClick={resetFilters}
                className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------
  // Loading state
  // --------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Loading Practice Questions
          </h2>
          <p className="text-gray-600">Fetching questions from OpenSAT API…</p>
        </div>
      </div>
    );
  }

  // --------------------------
  // Error state
  // --------------------------
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-white rounded-2xl p-8 shadow-lg">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Error Loading Questions
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={loadQuestions}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => setShowFilters(true)}
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Back to Settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------
  // No questions available state
  // --------------------------
  if (!currentQuestion || filteredQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-white rounded-2xl p-8 shadow-lg">
          <div className="text-6xl mb-4">🤔</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            No Questions Available
          </h2>
          <p className="text-gray-600 mb-6">
            No questions found matching your selected criteria. Try adjusting
            your filters.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => setShowFilters(true)}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Change Settings
            </button>
            <button
              onClick={() => {
                resetFilters();
                setShowFilters(false);
              }}
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Reset and Start Over
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------
  // Main practice UI
  // --------------------------
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-600">
              Question {questionIndex + 1} of {filteredQuestions.length}
            </h2>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(
                currentQuestion.difficulty
              )}`}
            >
              {getDifficultyLabel(currentQuestion.difficulty)}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {currentQuestion.question}
          </h1>

          <div className="space-y-4">
            {currentQuestion.choices.map((choice, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswerSelect(idx)}
                className={getChoiceStyle(idx)}
                disabled={selectedAnswer !== null}
              >
                {choice}
              </button>
            ))}
          </div>

          {showExplanation && (
            <div className="mt-6 p-4 bg-gray-50 border-l-4 border-blue-500 rounded">
              <h3 className="font-semibold text-gray-900 mb-2">Explanation:</h3>
              <p className="text-gray-700">{currentQuestion.explanation}</p>
            </div>
          )}

          <div className="mt-8 flex justify-between items-center">
            <button
              onClick={() => setShowFilters(true)}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Change Settings
            </button>
            <button
              onClick={nextQuestion}
              className="bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Next Question →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Practice;