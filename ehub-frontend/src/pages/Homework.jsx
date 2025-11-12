import React, { useState, useEffect } from 'react';
import { homeworkApi } from '../api/homeworkApi';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Homework = () => {
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadHomework = async () => {
      try {
        const response = await homeworkApi.getHomework();
        let homeworkData = response.data || [];
        
        // Filter homework based on student's level and language if user data is available
        if (user && user.level && user.language) {
          homeworkData = homeworkData.filter(hw => 
            (hw.level === user.level || !hw.level) && 
            (hw.language === user.language || !hw.language)
          );
        }
        
        setHomework(homeworkData);
      } catch (error) {
        console.error('Error loading homework:', error);
        // Fallback to mock data if backend is not available
        let mockHomework = [
          {
            id: 1,
            title: 'Interactive Learning Activities',
            subject: 'General',
            dueDate: '2023-05-20',
            assignedDate: '2023-05-15',
            description: 'Complete these fun interactive activities to learn and practice new skills!',
            type: 'interactive',
            maxPoints: 100,
            submitted: false,
            level: 'p1',
            language: 'english',
            interactiveElements: [
              {
                id: 1,
                type: 'quiz',
                question: 'What color is the sky?',
                options: ['Red', 'Blue', 'Green', 'Yellow'],
                correctAnswer: 'Blue',
                points: 10
              },
              {
                id: 2,
                type: 'dragDrop',
                question: 'Match the animals to their homes',
                items: ['Bird', 'Fish', 'Bear'],
                targets: ['Nest', 'Ocean', 'Forest'],
                points: 15
              },
              {
                id: 3,
                type: 'coloring',
                question: 'Color the butterfly',
                imageUrl: '/butterfly-outline.png',
                points: 10
              }
            ]
          },
          {
            id: 2,
            title: 'Science Experiment Report',
            subject: 'Science',
            dueDate: '2023-05-25',
            assignedDate: '2023-05-15',
            description: 'Write a report on your recent science experiment following the scientific method.',
            type: 'file',
            maxPoints: 50,
            submitted: true,
            submissionDate: '2023-05-18',
            grade: 'A',
            feedback: 'Excellent work! Your hypothesis was well-formulated and your conclusions were supported by evidence.',
            level: 'p2',
            language: 'english'
          }
        ];
        
        // Filter mock homework based on student's level and language
        if (user && user.level && user.language) {
          mockHomework = mockHomework.filter(hw => 
            (hw.level === user.level || !hw.level) && 
            (hw.language === user.language || !hw.language)
          );
        }
        
        setHomework(mockHomework);
      } finally {
        setLoading(false);
      }
    };

    loadHomework();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 to-blue-100">
        <div className="text-center">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-bounce flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📝</span>
            </div>
            <div className="animate-pulse text-xl font-bold text-gray-700">Loading your homework...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            My Homework 📝
          </h1>
          <p className="text-gray-600 text-lg">Complete your assignments and track your progress</p>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg max-w-2xl mx-auto">
            <p className="text-blue-800">
              <span className="font-bold">Need help with homework?</span> Upload your work to get assistance from teachers and classmates!
            </p>
            <Link 
              to="/homework/help/request" 
              className="inline-block mt-3 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full text-sm transition-all duration-300"
            >
              Get Homework Help
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          {homework.map((hw, index) => (
            <div 
              key={hw.id} 
              className="bg-white rounded-3xl shadow-2xl p-6 hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6">
                <div className={`px-4 py-2 rounded-full text-lg font-bold ${
                  hw.submitted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {hw.submitted ? 'Completed ✓' : 'Pending'}
                </div>
                <div className="text-gray-500 flex items-center">
                  <span className="text-2xl mr-2">📅</span>
                  Due: {new Date(hw.dueDate).toLocaleDateString()}
                </div>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-3">{hw.title}</h3>
              <p className="text-gray-700 text-lg mb-6">{hw.description}</p>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center text-gray-700">
                  <span className="text-2xl mr-2">📚</span>
                  <strong>Subject:</strong> <span className="ml-2 text-lg">{hw.subject}</span>
                </div>
                
                {!hw.submitted && (
                  <Link 
                    to={`/homework/${hw.id}`} 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-110"
                  >
                    Start Homework
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {homework.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl shadow-2xl">
            <div className="text-7xl mb-6 animate-bounce">🎉</div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">No homework assigned</h3>
            <p className="text-gray-600 text-xl">Great job! You&#39;re all caught up. 🎓</p>
            <div className="mt-8">
              <Link 
                to="/homework/help/request" 
                className="inline-block bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-full text-lg transition-all duration-300"
              >
                Need Help with Something Else?
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Homework;