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
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semib
