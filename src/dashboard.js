import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard = ({ user, userProgress }) => {
  const skillStats = userProgress?.skill_stats || {};
  const totalQuestions = Object.values(skillStats).reduce((sum, skill) => sum + (skill.attempts || 0), 0);
  const totalCorrect = Object.values(skillStats).reduce((sum, skill) => sum + (skill.correct || 0), 0);
  const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 80) return 'text-green-600';
    if (accuracy >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (accuracy) => {
    if (accuracy >= 80) return 'bg-green-500';
    if (accuracy >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const statCards = [
    {
      title: 'Total Questions',
      value: totalQuestions,
      icon: '📚',
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Overall Accuracy',
      value: `${overallAccuracy}%`,
      icon: '🎯',
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Current Streak',
      value: userProgress?.streak || 0,
      icon: '🔥',
      color: 'orange',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    },
    {
      title: 'Total Points',
      value: userProgress?.points || 0,
      icon: '⭐',
      color: 'purple',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-xl text-gray-600">Track your SAT prep progress</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                  <p className={`text-3xl font-bold ${card.textColor}`}>{card.value}</p>
                </div>
                <div className={`w-12 h-12 ${card.bgColor} rounded-xl flex items-center justify-center text-2xl`}>
                  {card.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Skills Breakdown */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          
          {/* Skills Performance */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Performance by Skill</h2>
            
            {Object.keys(skillStats).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(skillStats).map(([skill, stats]) => {
                  const accuracy = stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 100) : 0;
                  return (
                    <div key={skill} className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 capitalize">{skill}</h3>
                        <span className={`text-2xl font-bold ${getAccuracyColor(accuracy)}`}>
                          {accuracy}%
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                        <div className="text-center">
                          <div className="font-semibold text-gray-900">{stats.attempts || 0}</div>
                          <div className="text-gray-600">Total</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-green-600">{stats.correct || 0}</div>
                          <div className="text-gray-600">Correct</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-red-600">{(stats.attempts || 0) - (stats.correct || 0)}</div>
                          <div className="text-gray-600">Incorrect</div>
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-700 ${getProgressBarColor(accuracy)}`}
                          style={{ width: `${accuracy}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Yet</h3>
                <p className="text-gray-600 mb-6">Start practicing to see your performance breakdown</p>
                <Link
                  to="/practice"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Practice
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            
            {/* Continue Learning */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Continue Learning</h3>
              <div className="space-y-3">
                <Link
                  to="/practice"
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <span>📚</span>
                  Practice Mode
                </Link>
                <Link
                  to="/exam"
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <span>⏰</span>
                  Practice Test
                </Link>
              </div>
            </div>

            {/* Achievement Badges */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Achievements</h3>
              <div className="grid grid-cols-2 gap-3">
                
                {/* First Question Badge */}
                <div className={`p-3 rounded-lg text-center ${totalQuestions >= 1 ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <div className="text-2xl mb-1">🎯</div>
                  <div className="text-xs font-medium">First Question</div>
                </div>

                {/* 10 Questions Badge */}
                <div className={`p-3 rounded-lg text-center ${totalQuestions >= 10 ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <div className="text-2xl mb-1">📚</div>
                  <div className="text-xs font-medium">10 Questions</div>
                </div>

                {/* 5 Streak Badge */}
                <div className={`p-3 rounded-lg text-center ${(userProgress?.streak || 0) >= 5 ? 'bg-orange-100' : 'bg-gray-100'}`}>
                  <div className="text-2xl mb-1">🔥</div>
                  <div className="text-xs font-medium">5 Streak</div>
                </div>

                {/* High Accuracy Badge */}
                <div className={`p-3 rounded-lg text-center ${overallAccuracy >= 80 ? 'bg-purple-100' : 'bg-gray-100'}`}>
                  <div className="text-2xl mb-1">⭐</div>
                  <div className="text-xs font-medium">80% Accuracy</div>
                </div>
              </div>
            </div>

            {/* Study Tip */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
              <h3 className="text-lg font-bold mb-2">💡 Study Tip</h3>
              <p className="text-sm opacity-90">
                Focus on your weakest skills for the biggest score improvements. Our adaptive system will help you target problem areas.
              </p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Progress Journey</h2>
          
          {totalQuestions > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    📈
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Overall Progress</h4>
                    <p className="text-sm text-gray-600">{totalQuestions} questions completed</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{overallAccuracy}%</div>
                  <div className="text-sm text-gray-600">accuracy</div>
                </div>
              </div>

              {Object.entries(skillStats).slice(0, 3).map(([skill, stats], index) => {
                const accuracy = stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 100) : 0;
                return (
                  <div key={skill} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        📚
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 capitalize">{skill}</h4>
                        <p className="text-sm text-gray-600">{stats.attempts} questions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getAccuracyColor(accuracy)}`}>{accuracy}%</div>
                      <div className="text-sm text-gray-600">{stats.correct} correct</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Start?</h3>
              <p className="text-gray-600 mb-6">Begin your SAT prep journey and track your progress here</p>
              <Link
                to="/practice"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg"
              >
                Start Your First Practice Session
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
