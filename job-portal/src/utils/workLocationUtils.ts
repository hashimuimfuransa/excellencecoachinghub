/**
 * Utility functions for detecting work location types from job location strings
 */

export interface WorkLocationClassification {
  isRemote: boolean;
  isHybrid: boolean;
  isOnSite: boolean;
}

/**
 * Classifies a job location string into work location types
 */
export const classifyWorkLocation = (location: string): WorkLocationClassification => {
  const locationLower = location?.toLowerCase() || '';
  
  const isRemote = locationLower.includes('remote') || 
                  locationLower.includes('anywhere') || 
                  locationLower.includes('worldwide') ||
                  locationLower.includes('work from home') ||
                  locationLower.includes('wfh') ||
                  locationLower === 'global';
  
  const isHybrid = locationLower.includes('hybrid') || 
                  locationLower.includes('flexible') ||
                  (locationLower.includes('remote') && locationLower.includes('office'));
  
  const isOnSite = !isRemote && !isHybrid;
  
  return { isRemote, isHybrid, isOnSite };
};

/**
 * Checks if a job matches the selected work location filters
 */
export const matchesWorkLocationFilter = (
  jobLocation: string, 
  selectedWorkLocations: string[]
): boolean => {
  if (selectedWorkLocations.length === 0) return true;
  
  const { isRemote, isHybrid, isOnSite } = classifyWorkLocation(jobLocation);
  
  return selectedWorkLocations.some(filter => {
    switch (filter) {
      case 'remote':
        return isRemote;
      case 'hybrid':
        return isHybrid;
      case 'on-site':
        return isOnSite;
      default:
        return false;
    }
  });
};

/**
 * Sample test cases for work location classification
 */
export const testWorkLocationClassification = () => {
  const testCases = [
    { location: 'Remote', expected: { remote: true, hybrid: false, onSite: false } },
    { location: 'New York, NY', expected: { remote: false, hybrid: false, onSite: true } },
    { location: 'San Francisco (Remote)', expected: { remote: true, hybrid: false, onSite: false } },
    { location: 'Hybrid - London/Remote', expected: { remote: false, hybrid: true, onSite: false } },
    { location: 'Work from Home', expected: { remote: true, hybrid: false, onSite: false } },
    { location: 'Anywhere', expected: { remote: true, hybrid: false, onSite: false } },
    { location: 'Global', expected: { remote: true, hybrid: false, onSite: false } },
    { location: 'Flexible - Office/Remote', expected: { remote: false, hybrid: true, onSite: false } },
  ];
  
  console.log('Work Location Classification Tests:');
  testCases.forEach(({ location, expected }) => {
    const result = classifyWorkLocation(location);
    const passed = result.isRemote === expected.remote && 
                   result.isHybrid === expected.hybrid && 
                   result.isOnSite === expected.onSite;
    
    console.log(`${passed ? '✅' : '❌'} "${location}" -> Remote: ${result.isRemote}, Hybrid: ${result.isHybrid}, OnSite: ${result.isOnSite}`);
  });
};

export default {
  classifyWorkLocation,
  matchesWorkLocationFilter,
  testWorkLocationClassification
};