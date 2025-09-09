import React, { useState, useEffect } from 'react';
import { 
  ArrowForward, 
  CheckCircle, 
  Warning, 
  Storage,
  Delete,
  Refresh,
  AudioFile
} from '@mui/icons-material';
import { CircularProgress } from '@mui/material';
import { recordingMigrationService } from '../services/recordingMigrationService';

interface MigrationStatus {
  needsMigration: boolean;
  oldRecordings: number;
  newRecordings: number;
  oldAudioBlobs: number;
}

export const RecordingMigrationTool: React.FC = () => {
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const migrationStatus = await recordingMigrationService.getMigrationStatus();
      setStatus(migrationStatus);
    } catch (error: any) {
      setError(error.message || 'Failed to check migration status');
    } finally {
      setIsLoading(false);
    }
  };

  const performMigration = async () => {
    try {
      setIsMigrating(true);
      setError(null);
      
      const result = await recordingMigrationService.migrate();
      setMigrationResult(result);
      
      // Refresh status after migration
      await checkStatus();
      
    } catch (error: any) {
      setError(error.message || 'Migration failed');
    } finally {
      setIsMigrating(false);
    }
  };

  const cleanupOldData = async () => {
    if (!window.confirm('Are you sure you want to delete the old recording data? This action cannot be undone.')) {
      return;
    }

    try {
      setIsCleaningUp(true);
      recordingMigrationService.cleanupOldData();
      await checkStatus();
    } catch (error: any) {
      setError(error.message || 'Cleanup failed');
    } finally {
      setIsCleaningUp(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <CircularProgress className="h-8 w-8 mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">Checking migration status...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center py-8">
          <Warning className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Failed to check migration status</p>
          <button
            onClick={checkStatus}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          🔄 Recording System Migration
        </h2>
        <p className="text-gray-600 text-sm">
          Migrate your interview recordings to the new improved system with better reliability and performance.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center gap-2 text-red-700">
            <Warning className="h-4 w-4" />
            <span className="text-sm font-medium">Error</span>
          </div>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Migration Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Old System (localStorage)</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Recordings:</span>
              <span className="font-medium">{status.oldRecordings}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Audio Blobs:</span>
              <span className="font-medium">{status.oldAudioBlobs}</span>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">New System (IndexedDB)</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Recordings:</span>
              <span className="font-medium">{status.newRecordings}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium text-green-600">
                {status.newRecordings > 0 ? 'Active' : 'Ready'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Migration Actions */}
      <div className="space-y-4">
        {status.needsMigration ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Storage className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 mb-1">Migration Required</h4>
                <p className="text-blue-700 text-sm mb-3">
                  You have {status.oldRecordings} recordings that can be migrated to the new system.
                  This will improve reliability and fix audio playback issues.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={performMigration}
                    disabled={isMigrating}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
                  >
                    {isMigrating ? (
                      <CircularProgress className="h-4 w-4" />
                    ) : (
                      <ArrowForward className="h-4 w-4" />
                    )}
                    {isMigrating ? 'Migrating...' : 'Start Migration'}
                  </button>
                  <button
                    onClick={checkStatus}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    <Refresh className="h-4 w-4" />
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-green-900 mb-1">
                  {status.newRecordings > 0 ? 'Migration Complete' : 'No Migration Needed'}
                </h4>
                <p className="text-green-700 text-sm">
                  {status.newRecordings > 0 
                    ? `Your recordings are now using the new improved system.`
                    : 'You\'re already using the new recording system or have no recordings to migrate.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Migration Results */}
        {migrationResult && (
          <div className={`border rounded-lg p-4 ${
            migrationResult.success ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
          }`}>
            <h4 className={`font-medium mb-2 ${
              migrationResult.success ? 'text-green-900' : 'text-yellow-900'
            }`}>
              Migration Results
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
              <div>
                <span className="text-gray-600">Successfully migrated:</span>
                <span className="font-medium ml-2">{migrationResult.migrated}</span>
              </div>
              <div>
                <span className="text-gray-600">Failed:</span>
                <span className="font-medium ml-2">{migrationResult.failed}</span>
              </div>
            </div>
            {migrationResult.errors.length > 0 && (
              <div className="mt-3">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Errors:</h5>
                <ul className="text-xs text-gray-600 space-y-1">
                  {migrationResult.errors.map((error: string, index: number) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Cleanup Option */}
        {status.oldRecordings > 0 && status.newRecordings > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Delete className="h-5 w-5 text-gray-500 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">Clean Up Old Data</h4>
                <p className="text-gray-600 text-sm mb-3">
                  After successful migration, you can safely remove the old recording data 
                  to free up localStorage space.
                </p>
                <button
                  onClick={cleanupOldData}
                  disabled={isCleaningUp}
                  className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 disabled:bg-red-50"
                >
                  {isCleaningUp ? (
                    <CircularProgress className="h-4 w-4" />
                  ) : (
                    <Delete className="h-4 w-4" />
                  )}
                  {isCleaningUp ? 'Cleaning...' : 'Clean Up Old Data'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">🚀 New System Benefits</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Better reliability - No more audio blob mismatches</li>
          <li>• Improved performance - Uses IndexedDB instead of localStorage</li>
          <li>• Larger storage capacity - Handle bigger recordings</li>
          <li>• Atomic operations - Recordings are saved completely or not at all</li>
          <li>• Better error handling and recovery</li>
        </ul>
      </div>
    </div>
  );
};

export default RecordingMigrationTool;