import React, { useState, useEffect } from 'react';
import { useOfflineCache } from '../hooks/useOfflineCache';

const OfflineResources = () => {
  const [resources, setResources] = useState([]);
  const [filter, setFilter] = useState('all');
  const { data: cachedVideos, saveData: saveVideo } = useOfflineCache('videos');
  const { data: cachedHomework, saveData: saveHomework } = useOfflineCache('homework');

  useEffect(() => {
    const loadResources = async () => {
      try {
        // TODO: Replace with actual API call when offline resources endpoint is implemented
        // const response = await offlineApi.getResources();
        // setResources(response.data || []);

        // Mock data for now - in real app, this would come from API
        const mockResources = [
          {
            id: 1,
            type: 'video',
            title: 'Mathematics - Addition Basics',
            subject: 'Math',
            size: '45 MB',
            downloaded: true,
            lastAccessed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
          {
            id: 2,
            type: 'video',
            title: 'Science - Solar System',
            subject: 'Science',
            size: '67 MB',
            downloaded: true,
            lastAccessed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          },
          {
            id: 3,
            type: 'homework',
            title: 'English Vocabulary Quiz',
            subject: 'English',
            size: '2 MB',
            downloaded: false,
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          },
          {
            id: 4,
            type: 'video',
            title: 'History - Ancient Civilizations',
            subject: 'History',
            size: '52 MB',
            downloaded: false,
            lastAccessed: null,
          },
        ];

        setResources(mockResources);
      } catch (error) {
        console.error('Error loading offline resources:', error);
        setResources([]);
      }
    };

    loadResources();
  }, []);

  const filteredResources = resources.filter(resource => {
    if (filter === 'all') return true;
    if (filter === 'downloaded') return resource.downloaded;
    if (filter === 'available') return !resource.downloaded;
    return resource.type === filter;
  });

  const handleDownload = async (resource) => {
    // Simulate download
    setResources(prev => prev.map(r =>
      r.id === resource.id ? { ...r, downloaded: true } : r
    ));

    // Save to cache
    if (resource.type === 'video') {
      await saveVideo([...(cachedVideos || []), resource]);
    } else {
      await saveHomework([...(cachedHomework || []), resource]);
    }
  };

  const handleDelete = async (resource) => {
    setResources(prev => prev.map(r =>
      r.id === resource.id ? { ...r, downloaded: false } : r
    ));

    // Remove from cache
    if (resource.type === 'video' && cachedVideos) {
      const updated = cachedVideos.filter(v => v.id !== resource.id);
      await saveVideo(updated);
    } else if (resource.type === 'homework' && cachedHomework) {
      const updated = cachedHomework.filter(h => h.id !== resource.id);
      await saveHomework(updated);
    }
  };

  const getStorageInfo = () => {
    const downloadedResources = resources.filter(r => r.downloaded);
    const totalSize = downloadedResources.reduce((sum, r) => {
      const size = parseFloat(r.size);
      return sum + size;
    }, 0);

    return {
      used: totalSize,
      total: 1024, // 1GB in MB
      percentage: (totalSize / 1024) * 100,
    };
  };

  const storage = getStorageInfo();

  return (
    <div className="min-h-screen bg-educational-light p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Offline Resources 📱</h1>
          <p className="text-gray-600">Download content to access when you&apos;re offline</p>
        </div>

        {/* Storage Info */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Storage Usage</h3>
            <span className="text-sm text-gray-600">
              {storage.used.toFixed(1)} MB of {storage.total} MB used
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-primary-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(storage.percentage, 100)}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {storage.percentage.toFixed(1)}% used
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'All Resources' },
              { value: 'downloaded', label: 'Downloaded' },
              { value: 'available', label: 'Available' },
              { value: 'video', label: 'Videos' },
              { value: 'homework', label: 'Homework' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === option.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Resources List */}
        <div className="space-y-4">
          {filteredResources.map((resource) => (
            <div key={resource.id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-3xl">
                    {resource.type === 'video' ? '🎥' : '📝'}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{resource.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{resource.subject}</span>
                      <span>{resource.size}</span>
                      {resource.downloaded && resource.lastAccessed && (
                        <span>Last accessed: {resource.lastAccessed.toLocaleDateString()}</span>
                      )}
                      {resource.dueDate && (
                        <span className="text-red-600">
                          Due: {resource.dueDate.toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {resource.downloaded ? (
                    <>
                      <div className="flex items-center text-green-600">
                        <span className="mr-1">✓</span>
                        <span className="text-sm">Downloaded</span>
                      </div>
                      <button
                        onClick={() => handleDelete(resource)}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleDownload(resource)}
                      className="btn-primary"
                    >
                      Download
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredResources.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No resources found</h3>
            <p className="text-gray-600">Try adjusting your filters or check back later</p>
          </div>
        )}

        {/* Offline Tips */}
        <div className="mt-12 card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Offline Learning Tips 💡</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">📱 Mobile Access</h4>
              <p className="text-sm text-gray-600">
                Download videos and homework on your mobile device for offline access during commutes or when internet is unavailable.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">💾 Storage Management</h4>
              <p className="text-sm text-gray-600">
                Regularly review and delete old downloads to free up space for new content. Prioritize current assignments.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">🔄 Sync When Online</h4>
              <p className="text-sm text-gray-600">
                Your progress and completed work will automatically sync when you reconnect to the internet.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">🎯 Offline Activities</h4>
              <p className="text-sm text-gray-600">
                Complete homework assignments offline and submit them when you regain internet connection.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflineResources;