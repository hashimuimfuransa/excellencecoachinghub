import { Request, Response } from 'express';
import { Job, JobStatus, User } from '../models';
import { AuthRequest } from '../middleware/auth';

// Enhanced AI-powered job matching for users based on profile data
export const getAIMatchedJobsSimple = async (req: AuthRequest, res: Response) => {
  console.log('🤖 Enhanced AI-matched jobs endpoint called');
  
  try {
    const userId = req.user?.id;
    console.log('🔍 User ID from request:', userId);
    
    if (!userId) {
      console.error('❌ User not authenticated');
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    console.log('🤖 Starting enhanced job matching for user:', userId);
    
    // First, delete any expired jobs
    await Job.deleteExpiredJobs();
    
    // Fetch user profile data
    console.log('👤 Fetching user profile...');
    const user = await User.findById(userId).lean();
    
    if (!user) {
      console.error('❌ User not found');
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Extract user skills and experience
    const userSkills = (user.skills || []).map(skill => skill.toLowerCase());
    const experienceSkills = (user.experience || [])
      .flatMap(exp => (exp.technologies || []).map(tech => tech.toLowerCase()));
    const allUserSkills = [...new Set([...userSkills, ...experienceSkills])];
    
    const userEducation = user.education || [];
    const userExperience = user.experience || [];
    const userLocation = user.location?.toLowerCase() || '';
    
    console.log('📊 User profile analysis:', {
      skillsCount: allUserSkills.length,
      educationEntries: userEducation.length,
      experienceEntries: userExperience.length,
      location: userLocation || 'Not specified'
    });

    // Fetch active jobs
    console.log('🔍 Fetching active jobs...');
    const activeJobs = await Job.find({ 
      status: JobStatus.ACTIVE
    })
    .populate('employer', 'firstName lastName company email')
    .lean();

    console.log(`📊 Found ${activeJobs.length} active jobs to evaluate`);

    if (activeJobs.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        meta: {
          totalJobsEvaluated: 0,
          matchesFound: 0,
          userSkillsCount: allUserSkills.length,
          averageMatchPercentage: 0
        }
      });
    }

    // Enhanced matching algorithm
    const jobMatches = activeJobs.map((job: any) => {
      let matchScore = 0;
      let maxPossibleScore = 0;
      const matchingSkills: string[] = [];
      const matchReasons: string[] = [];

      // Enhanced Skills matching (40% weight)
      const jobSkills = (job.skills || []).map(skill => skill.toLowerCase());
      if (jobSkills.length > 0 || allUserSkills.length > 0) {
        maxPossibleScore += 40;
        
        if (jobSkills.length > 0 && allUserSkills.length > 0) {
          // Exact and partial skill matches
          const exactMatches = jobSkills.filter(jobSkill => 
            allUserSkills.some(userSkill => 
              userSkill === jobSkill || userSkill.includes(jobSkill) || jobSkill.includes(userSkill)
            )
          );
          
          // Fuzzy matching for related skills
          const relatedMatches = jobSkills.filter(jobSkill => {
            if (exactMatches.includes(jobSkill)) return false; // Don't double count
            return allUserSkills.some(userSkill => {
              // Check for common programming language patterns
              const programmingPatterns = [
                ['javascript', 'js', 'node', 'react', 'vue', 'angular'],
                ['python', 'django', 'flask', 'fastapi'],
                ['java', 'spring', 'springboot'],
                ['php', 'laravel', 'symfony'],
                ['csharp', 'c#', '.net', 'dotnet'],
                ['sql', 'mysql', 'postgresql', 'database'],
                ['html', 'css', 'frontend', 'web'],
                ['aws', 'cloud', 'azure', 'gcp'],
                ['docker', 'kubernetes', 'devops']
              ];
              
              for (const pattern of programmingPatterns) {
                if (pattern.some(p => jobSkill.includes(p)) && pattern.some(p => userSkill.includes(p))) {
                  return true;
                }
              }
              return false;
            });
          });
          
          const allMatches = [...exactMatches, ...relatedMatches];
          if (allMatches.length > 0) {
            const skillMatchRatio = Math.min(allMatches.length / Math.max(jobSkills.length, 1), 1);
            const skillScore = skillMatchRatio * 40;
            matchScore += skillScore;
            matchingSkills.push(...allMatches);
            matchReasons.push(`${allMatches.length}/${jobSkills.length} skills match (${exactMatches.length} exact, ${relatedMatches.length} related)`);
          }
        } else if (allUserSkills.length > 0 && jobSkills.length === 0) {
          // Give partial credit if user has skills but job doesn't specify
          matchScore += 15;
          matchReasons.push('Profile has relevant skills');
        } else if (jobSkills.length > 0 && allUserSkills.length === 0) {
          // Small penalty for missing skills but don't make it zero
          matchScore += 5;
          matchReasons.push('Job requires skills - add skills to your profile');
        }
      }

      // Education level matching (20% weight)
      if (job.educationLevel || userEducation.length > 0) {
        maxPossibleScore += 20;
        
        if (job.educationLevel && userEducation.length > 0) {
          const userDegrees = userEducation.map(edu => edu.degree?.toLowerCase() || '');
          const jobEducationLevel = job.educationLevel.toLowerCase();
          
          // Enhanced education level matching
          const educationMatch = userDegrees.some(degree => {
            if (jobEducationLevel.includes('bachelor') && (degree.includes('bachelor') || degree.includes('master') || degree.includes('phd'))) return true;
            if (jobEducationLevel.includes('master') && (degree.includes('master') || degree.includes('phd'))) return true;
            if (jobEducationLevel.includes('high_school') || jobEducationLevel.includes('diploma')) return true;
            if (jobEducationLevel.includes('certificate') || jobEducationLevel.includes('certification')) return true;
            return degree.includes(jobEducationLevel) || jobEducationLevel.includes(degree);
          });
          
          if (educationMatch) {
            matchScore += 20;
            matchReasons.push('Education level matches');
          } else {
            // Give partial credit for having some education
            matchScore += 8;
            matchReasons.push('Has education background');
          }
        } else if (userEducation.length > 0 && !job.educationLevel) {
          // Give credit if user has education but job doesn't specify
          matchScore += 15;
          matchReasons.push('Education background present');
        } else if (!userEducation.length && job.educationLevel) {
          // Small credit for jobs that don't require high education levels
          if (job.educationLevel.toLowerCase().includes('high_school') || 
              job.educationLevel.toLowerCase().includes('no') ||
              job.educationLevel.toLowerCase().includes('any')) {
            matchScore += 10;
            matchReasons.push('Entry level education requirement');
          } else {
            matchScore += 3;
            matchReasons.push('Add education to improve match');
          }
        }
      }

      // Experience level matching (20% weight)  
      if (job.experienceLevel || userExperience.length > 0) {
        maxPossibleScore += 20;
        
        if (job.experienceLevel && userExperience.length > 0) {
          const totalExperienceYears = userExperience.reduce((total, exp) => {
            const startYear = new Date(exp.startDate).getFullYear();
            const endYear = exp.current ? new Date().getFullYear() : new Date(exp.endDate || Date.now()).getFullYear();
            return total + Math.max(endYear - startYear, 0);
          }, 0);
          
          const jobExperienceLevel = job.experienceLevel.toLowerCase();
          let experienceScore = 0;
          
          if (jobExperienceLevel.includes('entry') || jobExperienceLevel.includes('junior')) {
            if (totalExperienceYears <= 2) experienceScore = 20;
            else if (totalExperienceYears <= 5) experienceScore = 15; // Overqualified but still good
            else experienceScore = 10; // Very overqualified
          } else if (jobExperienceLevel.includes('mid') || jobExperienceLevel.includes('intermediate')) {
            if (totalExperienceYears >= 2 && totalExperienceYears <= 5) experienceScore = 20;
            else if (totalExperienceYears < 2) experienceScore = 12; // Underqualified
            else experienceScore = 15; // Overqualified
          } else if (jobExperienceLevel.includes('senior') || jobExperienceLevel.includes('lead')) {
            if (totalExperienceYears >= 5) experienceScore = 20;
            else if (totalExperienceYears >= 3) experienceScore = 12; // Close
            else experienceScore = 8; // Underqualified
          } else {
            // Unspecified level - give credit for any experience
            experienceScore = Math.min(totalExperienceYears * 3, 15);
          }
          
          matchScore += experienceScore;
          matchReasons.push(`${totalExperienceYears} years experience (${experienceScore > 15 ? 'good match' : experienceScore > 10 ? 'partial match' : 'entry level'})`);
        } else if (userExperience.length > 0 && !job.experienceLevel) {
          // Give credit if user has experience but job doesn't specify
          matchScore += 15;
          matchReasons.push('Work experience present');
        } else if (!userExperience.length && job.experienceLevel) {
          // Handle entry level or no experience required
          const jobExperienceLevel = job.experienceLevel.toLowerCase();
          if (jobExperienceLevel.includes('entry') || jobExperienceLevel.includes('junior') || 
              jobExperienceLevel.includes('no experience') || jobExperienceLevel.includes('0')) {
            matchScore += 15;
            matchReasons.push('Entry level position suitable');
          } else {
            matchScore += 5;
            matchReasons.push('Add experience to improve match');
          }
        }
      }

      // Location matching (10% weight)
      if (job.location || userLocation) {
        maxPossibleScore += 10;
        
        if (job.location && userLocation) {
          const jobLocation = job.location.toLowerCase();
          if (jobLocation.includes(userLocation) || userLocation.includes(jobLocation)) {
            matchScore += 10;
            matchReasons.push('Location matches');
          } else if (jobLocation.includes('remote') || jobLocation.includes('anywhere') || jobLocation.includes('worldwide')) {
            matchScore += 8;
            matchReasons.push('Remote work available');
          } else {
            matchScore += 3;
            matchReasons.push('Different location');
          }
        } else if (job.location && !userLocation) {
          const jobLocation = job.location.toLowerCase();
          if (jobLocation.includes('remote') || jobLocation.includes('anywhere')) {
            matchScore += 8;
            matchReasons.push('Remote position available');
          } else {
            matchScore += 5;
            matchReasons.push('Add location preference');
          }
        } else if (userLocation && !job.location) {
          matchScore += 7;
          matchReasons.push('Job location not specified');
        }
      }

      // Job type preference matching (10% weight)
      if (user.jobPreferences?.preferredJobTypes?.length > 0) {
        maxPossibleScore += 10;
        const preferredTypes = user.jobPreferences.preferredJobTypes.map(type => type.toLowerCase());
        const jobType = job.jobType?.toLowerCase() || '';
        if (preferredTypes.includes(jobType)) {
          matchScore += 10;
          matchReasons.push('Job type preference matches');
        }
      }

      // Calculate final match percentage
      const matchPercentage = maxPossibleScore > 0 ? Math.round((matchScore / maxPossibleScore) * 100) : 0;
      
      // Add base score if there's any profile data to ensure some matches
      let finalMatchPercentage = matchPercentage;
      
      // Boost score based on user profile completeness
      if (userSkills.length > 0 || userEducation.length > 0 || userExperience.length > 0) {
        finalMatchPercentage = Math.max(matchPercentage, 25);
      }
      
      // Additional small boost for location or job type preferences
      if (userLocation && job.location?.toLowerCase().includes(userLocation)) {
        finalMatchPercentage += 5;
      }
      
      if (job.jobType && job.jobType.toLowerCase().includes('full-time')) {
        finalMatchPercentage += 3;
      }

      return {
        ...job,
        matchPercentage: finalMatchPercentage,
        matchingSkills: [...new Set(matchingSkills)],
        aiExplanation: matchReasons.length > 0 ? matchReasons.join(', ') : 'Basic profile compatibility',
        recommendationReason: matchReasons.length > 0 ? 
          `This job matches your profile: ${matchReasons.join(', ')}` : 
          'This job might be suitable based on your background',
        matchScore: matchScore,
        maxPossibleScore: maxPossibleScore
      };
    });

    // Sort by match percentage and take top matches
    const sortedMatches = jobMatches
      .sort((a, b) => b.matchPercentage - a.matchPercentage)
      .slice(0, 15); // Return top 15 matches

    // Filter for different match levels with more inclusive thresholds
    const highMatches = sortedMatches.filter(job => job.matchPercentage >= 60);
    const goodMatches = sortedMatches.filter(job => job.matchPercentage >= 40 && job.matchPercentage < 60);
    const fairMatches = sortedMatches.filter(job => job.matchPercentage >= 25 && job.matchPercentage < 40);
    const basicMatches = sortedMatches.filter(job => job.matchPercentage >= 15 && job.matchPercentage < 25);
    
    // Always try to return at least 3-8 matches
    let finalMatches: any[] = [];
    
    // Add matches in priority order
    finalMatches = [...finalMatches, ...highMatches];
    if (finalMatches.length < 8) {
      finalMatches = [...finalMatches, ...goodMatches.slice(0, 8 - finalMatches.length)];
    }
    if (finalMatches.length < 8) {
      finalMatches = [...finalMatches, ...fairMatches.slice(0, 8 - finalMatches.length)];
    }
    if (finalMatches.length < 5) {
      finalMatches = [...finalMatches, ...basicMatches.slice(0, 5 - finalMatches.length)];
    }
    
    // If still no matches, take the top scoring jobs anyway
    if (finalMatches.length === 0 && sortedMatches.length > 0) {
      console.log('🔧 No matches found with minimum threshold, taking top jobs anyway');
      finalMatches = sortedMatches.slice(0, 3);
      // Boost their scores to at least 20%
      finalMatches = finalMatches.map(job => ({
        ...job,
        matchPercentage: Math.max(job.matchPercentage, 20),
        aiExplanation: job.aiExplanation + ' (Basic compatibility)'
      }));
    }
    
    console.log('🔧 Final matches before response:', {
      finalMatchesLength: finalMatches.length,
      firstJob: finalMatches[0] ? {
        id: finalMatches[0]._id,
        title: finalMatches[0].title,
        matchPercentage: finalMatches[0].matchPercentage
      } : null
    });
    
    const meaningfulMatches = [...highMatches, ...goodMatches];

    const averageMatchPercentage = finalMatches.length > 0 ? 
      Math.round(finalMatches.reduce((sum, job) => sum + job.matchPercentage, 0) / finalMatches.length) : 0;

    console.log('✅ Enhanced job matching completed:', {
      totalEvaluated: activeJobs.length,
      highMatches: highMatches.length,
      goodMatches: goodMatches.length,  
      fairMatches: fairMatches.length,
      basicMatches: basicMatches.length,
      meaningfulMatches: meaningfulMatches.length,
      finalMatches: finalMatches.length,
      averageMatch: averageMatchPercentage,
      topMatchPercentages: finalMatches.slice(0, 3).map(job => job.matchPercentage)
    });

    // Prevent caching to ensure fresh AI matches
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    return res.status(200).json({
      success: true,
      data: finalMatches,
      meta: {
        totalJobsEvaluated: activeJobs.length,
        matchesFound: finalMatches.length,
        userSkillsCount: allUserSkills.length,
        averageMatchPercentage: averageMatchPercentage,
        userProfileSummary: {
          skills: allUserSkills.length,
          education: userEducation.length,
          experience: userExperience.length,
          location: userLocation || 'Not specified'
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Enhanced job matching failed:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return res.status(500).json({
      success: false,
      error: 'Failed to match jobs',
      message: error.message || 'Unknown error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};