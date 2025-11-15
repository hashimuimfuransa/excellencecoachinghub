import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { parentApi } from '../../api/parentApi';
import { useTranslation } from 'react-i18next';
import AddChildForm from './AddChildForm';
import BottomNavbar from '../ui/BottomNavbar';

const ParentDashboard = () => {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childProgress, setChildProgress] = useState(null);
  const [childHomework, setChildHomework] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddChildForm, setShowAddChildForm] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const loadData = async () => {
      try {
        const childrenResponse = await parentApi.getChildren();
        const childrenData = Array.isArray(childrenResponse.data) ? childrenResponse.data : [];
        setChildren(childrenData);
        
        // If no children, show add child form
        if (childrenData.length === 0) {
          setShowAddChildForm(true);
        } else {
          setSelectedChild(childrenData[0]);
          try {
            const progressResponse = await parentApi.getChildProgress(childrenData[0].id);
            setChildProgress(progressResponse.data || null);
            
            // Load child's homework
            const homeworkResponse = await parentApi.getChildHomework(childrenData[0].id);
            setChildHomework(Array.isArray(homeworkResponse.data) ? homeworkResponse.data : []);
          } catch (progressError) {
            console.error('Error loading child progress:', progressError);
            setChildProgress(null);
            setChildHomework([]);
          }
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setChildren([]);
        setChildProgress(null);
        setChildHomework([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleChildAdded = (newChild) => {
    // Add the new child to the list
    const updatedChildren = [...children, { ...newChild, name: newChild.name || newChild.firstName }];
    setChildren(updatedChildren);
    setSelectedChild({ ...newChild, name: newChild.name || newChild.firstName });
    setShowAddChildForm(false);
    
    // Load progress and homework for the new child
    loadChildData(newChild.id);
  };

  const loadChildData = async (childId) => {
    try {
      const progressResponse = await parentApi.getChildProgress(childId);
      setChildProgress(progressResponse.data || null);
      
      // Load child's homework
      const homeworkResponse = await parentApi.getChildHomework(childId);
      setChildHomework(Array.isArray(homeworkResponse.data) ? homeworkResponse.data : []);
    } catch (error) {
      console.error('Error loading child data:', error);
      setChildProgress(null);
      setChildHomework([]);
    }
  };

  const handleChildSelect = async (child) => {
    setSelectedChild(child);
    try {
      const progressResponse = await parentApi.getChildProgress(child.id);
      setChildProgress(progressResponse.data || null);
      
      // Load child's homework
      const homeworkResponse = await parentApi.getChildHomework(child.id);
      setChildHomework(Array.isArray(homeworkResponse.data) ? homeworkResponse.data : []);
    } catch (error) {
      console.error('Error loading child progress:', error);
      setChildProgress(null);
      setChildHomework([]);
    }
  };

  const handleAddAnotherChild = () => {
    setShowAddChildForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 to-blue-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Show add child form if needed
  if (showAddChildForm) {
    return <AddChildForm onChildAdded={handleChildAdded} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-yellow-50 p-4 sm:p-6 pb-20 md:pb-6 pt-16">
      <div className="max-w-4xl mx-auto">
        {/* Welcome Section - Reduced size and improved mobile responsiveness */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-red-600 bg-clip-text text-transparent mb-2">
            👋 {t('welcome_back_parent')}
          </h1>
          <p className="text-gray-700 text-sm sm:text-base">
            {t('support_your_child_learning_journey')}
          </p>
        </div>

        {/* Child Selector - More mobile responsive */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">{t('select_your_child')}</h2>
            <button 
              onClick={handleAddAnotherChild}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded-lg text-xs"
            >
              + {t('add_child')}
            </button>
          </div>
          
          {children.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => handleChildSelect(child)}
                  className={`px-3 py-1 rounded-full font-medium text-sm transition-all ${
                    selectedChild?.id === child.id
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {child.firstName || child.name}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-600 text-sm">{t('no_children_added_yet')}</p>
            </div>
          )}
        </div>

        {selectedChild && childProgress ? (
          <>
            {/* Progress Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl">📊</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{childProgress.overallGrade || 0}%</p>
                <p className="text-gray-600 text-sm">{t('overall_grade')}</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl">📚</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{childProgress.completedLessons || 0}</p>
                <p className="text-gray-600 text-sm">{t('lessons_completed')}</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl">🏆</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{childProgress.points || 0}</p>
                <p className="text-gray-600 text-sm">{t('points_earned')}</p>
              </div>
            </div>

            {/* Main Action Buttons - More mobile responsive */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {/* Homework Button */}
              <Link 
                to="/homework" 
                className="bg-blue-500 rounded-xl p-3 text-white text-center shadow hover:shadow-md transition-all"
              >
                <div className="text-2xl mb-1">📝</div>
                <h3 className="text-xs font-bold">{t('view_homework')}</h3>
              </Link>

              {/* Leaderboard Button */}
              <Link 
                to="/leaderboard" 
                className="bg-purple-500 rounded-xl p-3 text-white text-center shadow hover:shadow-md transition-all"
              >
                <div className="text-2xl mb-1">🏆</div>
                <h3 className="text-xs font-bold">{t('view_leaderboard')}</h3>
              </Link>

              {/* Help Button */}
              <button 
                onClick={() => navigate('/homework/help')}
                className="bg-red-500 rounded-xl p-3 text-white text-center shadow hover:shadow-md transition-all"
              >
                <div className="text-2xl mb-1">🆘</div>
                <h3 className="text-xs font-bold">{t('get_help')}</h3>
              </button>
            </div>

            {/* Child's Homework */}
            <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">{t('your_child_homework')}</h2>
                <Link to="/homework" className="text-primary-600 hover:text-primary-800 text-sm font-medium">
                  {t('view_all')}
                </Link>
              </div>
              
              {childHomework.length > 0 ? (
                <div className="space-y-3">
                  {childHomework.slice(0, 3).map((hw) => (
                    <div key={hw._id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{hw.title}</h3>
                          <p className="text-gray-600 text-sm">{hw.subject}</p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          hw.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : hw.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-blue-100 text-blue-800'
                        }`}>
                          {hw.status === 'completed' ? t('completed') : 
                           hw.status === 'pending' ? t('pending') : t('assigned')}
                        </span>
                      </div>
                      <div className="mt-2 flex justify-between items-center">
                        <p className="text-gray-500 text-xs">
                          {t('due')}: {new Date(hw.dueDate).toLocaleDateString()}
                        </p>
                        <button 
                          onClick={() => navigate(`/homework/${hw._id}`)}
                          className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-1 px-3 rounded-full text-xs transition-colors"
                        >
                          {hw.status === 'completed' ? t('review') : t('start')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="text-4xl mb-2">📚</div>
                  <p className="text-gray-600 text-sm">{t('no_homework_assigned')}</p>
                  <button 
                    onClick={() => navigate('/homework/help')}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full text-sm mt-3"
                  >
                    {t('request_help_for_child')}
                  </button>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">{t('quick_actions')}</h2>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => navigate('/homework/help')}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full text-sm"
                >
                  {t('request_help_for_child')}
                </button>
                <button 
                  onClick={() => window.open('mailto:support@excellencecoachinghub.com', '_blank')}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full text-sm"
                >
                  {t('contact_teacher')}
                </button>
              </div>
            </div>
          </>
        ) : children.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-lg text-center py-8">
            <div className="text-4xl mb-3">👨‍👩‍👧</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('select_child_to_view_progress')}</h3>
            <p className="text-gray-600 text-sm mb-4">{t('choose_child_above')}</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg text-center py-12">
            <div className="text-6xl mb-4">👨‍👩‍👧</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('no_children_added')}</h3>
            <p className="text-gray-600 mb-4">{t('contact_school_admin')}</p>
          </div>
        )}
      </div>
      <BottomNavbar />
    </div>
  );
};

export default ParentDashboard;