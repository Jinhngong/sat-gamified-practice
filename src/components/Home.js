import React from 'react';
import { Link } from 'react-router-dom';

const Home = ({ userProgress }) => {
  const skillStats = userProgress?.skill_stats || {};
  const totalQuestions = Object.values(skillStats).reduce((sum, skill) => sum + (skill.attempts || 0), 0);
  const totalCorrect = Object.values(skillStats).reduce((sum, skill) => sum + (skill.correct || 0), 0);
  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const features = [
    {
      icon: '🎯',
      title: 'Adaptive Practice',
      description: 'Smart question selection that adapts to your skill level and focuses on areas needing improvement.',
      color: 'blue'
    },
    {
      icon: '📊',
      title: 'Detailed Analytics',
      description: 'Track your progress with comprehensive statistics and performance insights across all topics.',
      color: 'green'
    },
    {
      icon: '🏆',
      title: 'Official Questions',
      description: 'Practice with authentic questions from the CollegeBoard question bank for the most realistic prep.',
      color: 'purple'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Free SAT Practice Platform
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-4">
            Level up your digital SAT® prep with thousands of practice questions
          </p>
          <p className="text-lg text-gray-500 mb-8">
            Originally from CollegeBoard questionbank at your fingertips
          </p>
          
          {/* User Stats */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 mb-12 max-w-2xl mx-auto shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalQuestions}</div>
                <div className="text-sm text-gray-600">Questions Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{accuracy}%</div>
                <div className="text-sm text-gray-600">Accuracy Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{userProgress?.streak || 0}</div>
                <div className="text-sm text-gray-600">Current Streak</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              to="/practice"
              className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <span>▶️</span>
              Start Practice
            </Link>
            <Link
              to="/exam"
              className="bg-green-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <span>⏰</span>
              Take Practice Test
            </Link>
            <Link
              to="/dashboard"
              className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white hover:border-gray-400 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <span>📈</span>
              View Progress
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-2xl ${getColorClasses(feature.color)}`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Skills Overview */}
        {Object.keys(skillStats).length > 0 && (
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Your Progress by Skill</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(skillStats).map(([skill, stats]) => {
                const skillAccuracy = stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 100) : 0;
                return (
                  <div key={skill} className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 capitalize">{skill}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Questions:</span>
                        <span className="font-medium">{stats.attempts || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Correct:</span>
                        <span className="font-medium text-green-600">{stats.correct || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Accuracy:</span>
                        <span className={`font-medium ${skillAccuracy >= 70 ? 'text-green-600' : skillAccuracy >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {skillAccuracy}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${skillAccuracy >= 70 ? 'bg-green-500' : skillAccuracy >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${skillAccuracy}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to boost your SAT score?</h2>
            <p className="text-xl mb-6 opacity-90">
              Join thousands of students who have improved their scores with our platform
            </p>
            <Link
              to="/practice"
              className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
            >
              Get Started Now
              <span className="ml-2">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;