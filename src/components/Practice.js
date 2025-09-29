import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// LaTeX rendering function
const renderLatex = (text) => {
  if (!text || typeof text !== 'string') return text;

  const rendered = text
    // Fractions
    .replace(/\\frac{([^}]+)}{([^}]+)}/g, '($1)/($2)')
    // Square roots
    .replace(/\\sqrt{([^}]+)}/g, '√($1)')
    // Superscripts
    .replace(/\^{([^}]+)}/g, '^($1)')
    .replace(/\^([a-zA-Z0-9])/g, '^$1')
    // Subscripts
    .replace(/_{([^}]+)}/g, '_($1)')
    .replace(/_([a-zA-Z0-9])/g, '_$1')
    // Greek letters
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\delta/g, 'δ')
    .replace(/\\theta/g, 'θ')
    .replace(/\\pi/g, 'π')
    .replace(/\\sigma/g, 'σ')
    // Math symbols
    .replace(/\\cdot/g, '·')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\pm/g, '±')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\approx/g, '≈')
    .replace(/\\infty/g, '∞')
    // Remove remaining LaTeX commands
    .replace(/\\[a-zA-Z]+{([^}]*)}/g, '$1')
    .replace(/\\[a-zA-Z]+/g, '')
    // Clean up extra spaces
    .replace(/\s+/g, ' ')
    .trim();

  return rendered;
};

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
  }, [selectedAssessment, selectedTestType, selectedDomains, selectedDifficulties, showFilters]);

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
              ? renderLatex(q.question?.question || q.question?.paragraph || 'Question unavailable')
              : q.question?.question || q.question?.paragraph || 'Question unavailable',
          choices:
            selectedTestType === 'math'
              ? Object.values(q.question?.choices || {}).map((choice) => renderLatex(choice))
              : Object.values(q.question?.choices || {}),
          correct: Object.keys(q.question?.choices || {}).indexOf(q.question?.correct_answer),
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
          const assessmentMatch = q.assessment === selectedAssessment || selectedAssessment === 'SAT';

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
      skillAccuracy[skill] = stats.attempts > 0 ? stats.correct / stats.attempts : 0;
    });

    const weightedQuestions = questionsList.map((q) => {
      const accuracy = skillAccuracy[q.skill] || skillAccuracy[q.domain] || 0;
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

  // --- UI RENDERING ---

  // Filter screen
  if (showFilters) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Practice Settings</h1>
              <Link
                to="/"
                className="text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-2"
              >
                ← Back to Home
              </Link>
            </div>
            {/* Assessment Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Assessment</h3>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Test Type</h3>
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
                Select {selectedTestType === 'math' ? 'Math' : 'Reading and Writing'} Domains
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Difficulty Levels</h3>
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Loading Practice Questions</h2>
          <p className="text-gray-600">Fetching questions from OpenSAT API…</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-white rounded-2xl p-8 shadow-lg">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Questions</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadQuestions}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  // No questions state
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-white rounded-2xl p-8 shadow-lg">
          <div className="text-6xl mb-4">📭</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Questions Found</h2>
          <p className="text-gray-600 mb-6">
            Try adjusting your filter settings to find more practice questions.
          </p>
          <button
            onClick={() => setShowFilters(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Adjust Filters
          </button>
        </div>
      </div>
    );
  }

  // Main practice screen
  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with progress */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Practice Session</h1>
            <p className="text-gray-600">
              {selectedAssessment} • {selectedTestType === 'math' ? 'Math' : 'Reading and Writing'}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-4">
            <div className="bg-white rounded-xl px-4 py-2 shadow-sm">
              <span className="font-bold text-gray-900">{sessionStats.correct}</span>
              <span className="text-gray-600"> / {sessionStats.total} Correct</span>
            </div>
            <button
              onClick={() => setShowFilters(true)}
              className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Adjust Filters
            </button>
          </div>
        </div>
        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
          {/* Question header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-3 sm:mb-0">
              <span className="text-sm font-medium px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                {currentQuestion.domain}
              </span>
              <span
                className={`text-sm font-medium px-3 py-1 rounded-full ${getDifficultyColor(
                  currentQuestion.difficulty
                )}`}
              >
                {getDifficultyLabel(currentQuestion.difficulty)}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Question {questionIndex + 1} of {filteredQuestions.length}
            </div>
          </div>
          {/* Question text */}
          <div className="mb-6">
            <p className="text-lg text-gray-900 whitespace-pre-line leading-relaxed">
              {currentQuestion.question}
            </p>
          </div>
          {/* Answer choices */}
          <div className="space-y-4 mb-6">
            {currentQuestion.choices.map((choice, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={getChoiceStyle(index)}
              >
                <span className="font-bold mr-3">{String.fromCharCode(65 + index)}.</span>
                <span>{choice}</span>
              </button>
            ))}
          </div>
          {/* Explanation */}
          {showExplanation && (
            <div className="mt-6 bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-3">Explanation</h3>
              <p className="text-gray-700 whitespace-pre-line">{currentQuestion.explanation}</p>
            </div>
          )}
          {/* Next question button */}
          {selectedAnswer !== null && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={nextQuestion}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Next Question →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Practice;