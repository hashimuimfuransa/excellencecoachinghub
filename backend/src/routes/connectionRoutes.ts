import { Router, Request, Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import { Connection, User } from '../models';
import { IPopulatedConnectionDocument } from '../models/Connection';
import { asyncHandler } from '../middleware/asyncHandler';
import { notificationService } from '../services/notificationService';

const router = Router();

// @desc    Send connection request
// @route   POST /api/connections/request/:userId
// @access  Private
router.post('/request/:userId', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { connectionType = 'connect' } = req.body;
  const recipientId = req.params.userId;
  const requesterId = req.user!._id.toString();

  // Check if trying to connect to self
  if (recipientId === requesterId) {
    res.status(400).json({
      success: false,
      error: 'Cannot send connection request to yourself'
    });
    return;
  }

  // Check if recipient exists
  const recipient = await User.findById(recipientId);
  if (!recipient) {
    res.status(404).json({
      success: false,
      error: 'User not found'
    });
    return;
  }

  // Check if connection already exists
  const existingConnection = await Connection.findOne({
    $or: [
      { requester: requesterId, recipient: recipientId },
      { requester: recipientId, recipient: requesterId }
    ]
  });

  if (existingConnection) {
    res.status(400).json({
      success: false,
      error: `Connection request already ${existingConnection.status}`,
      data: { status: existingConnection.status }
    });
    return;
  }

  const connection = await Connection.create({
    requester: requesterId,
    recipient: recipientId,
    connectionType,
    status: 'pending'
  });

  await connection.populate('recipient', 'firstName lastName profilePicture company jobTitle');

  // Get requester info for notifications
  const requester = await User.findById(requesterId).select('firstName lastName profilePicture');
  const requesterName = requester ? `${requester.firstName} ${requester.lastName}` : 'Someone';

  // Send real-time notification for connection request
  try {
    await notificationService.sendConnectionRequestNotification(
      recipientId,
      requesterName,
      requesterId,
      requester?.profilePicture
    );
    console.log(`🤝 Connection request notification sent from ${requesterName} to ${recipient.firstName} ${recipient.lastName}`);
  } catch (notificationError) {
    console.error('Error sending connection request notification:', notificationError);
    // Don't fail the request if notification fails
  }

  res.status(201).json({
    success: true,
    data: connection,
    message: 'Connection request sent successfully'
  });
}));

// @desc    Accept connection request
// @route   POST /api/connections/accept/:userId
// @access  Private
router.post('/accept/:userId', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const requesterId = req.params.userId;
  const recipientId = req.user!._id.toString();

  const connection = await Connection.findOne({
    requester: requesterId,
    recipient: recipientId,
    status: 'pending'
  });

  if (!connection) {
    res.status(404).json({
      success: false,
      error: 'Connection request not found'
    });
    return;
  }

  connection.status = 'accepted';
  await connection.save();

  await connection.populate('requester', 'firstName lastName profilePicture company jobTitle');

  // Get recipient user info for notification
  const recipient = req.user!;
  const accepterName = `${recipient.firstName} ${recipient.lastName}`;
  
  // Send real-time notification for connection acceptance
  try {
    await notificationService.sendConnectionAcceptedNotification(
      requesterId,
      accepterName,
      recipientId,
      recipient.profilePicture
    );
    console.log(`✅ Connection accepted notification sent from ${accepterName} to requester ${requesterId}`);
  } catch (notificationError) {
    console.error('Error sending connection acceptance notification:', notificationError);
    // Don't fail the request if notification fails
  }

  res.status(200).json({
    success: true,
    data: connection,
    message: 'Connection request accepted'
  });
}));

// @desc    Reject connection request
// @route   POST /api/connections/reject/:userId
// @access  Private
router.post('/reject/:userId', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const requesterId = req.params.userId;
  const recipientId = req.user!._id.toString();

  const connection = await Connection.findOne({
    requester: requesterId,
    recipient: recipientId,
    status: 'pending'
  });

  if (!connection) {
    res.status(404).json({
      success: false,
      error: 'Connection request not found'
    });
    return;
  }

  connection.status = 'rejected';
  await connection.save();

  res.status(200).json({
    success: true,
    message: 'Connection request rejected'
  });
}));

// @desc    Cancel/withdraw sent connection request
// @route   POST /api/connections/cancel/:userId
// @access  Private
router.post('/cancel/:userId', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const recipientId = req.params.userId;
  const requesterId = req.user!._id.toString();

  const connection = await Connection.findOne({
    requester: requesterId,
    recipient: recipientId,
    status: 'pending'
  });

  if (!connection) {
    res.status(404).json({
      success: false,
      error: 'Connection request not found'
    });
    return;
  }

  // Delete the request instead of marking as cancelled
  await connection.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Connection request cancelled successfully'
  });
}));

// @desc    Get user's connections
// @route   GET /api/connections
// @access  Private
router.get('/', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = (req.user as any)._id.toString();
  const connections = await Connection.findConnections(userId);

  const formattedConnections = connections.map((conn: IPopulatedConnectionDocument) => {
    const isRequester = (conn.requester as any)._id.toString() === userId;
    const otherUser = isRequester ? conn.recipient : conn.requester;
    
    return {
      _id: conn._id,
      user: otherUser,
      connectionType: conn.connectionType,
      connectedAt: conn.updatedAt
    };
  });

  res.status(200).json({
    success: true,
    data: formattedConnections
  });
}));

// @desc    Get pending connection requests (received)
// @route   GET /api/connections/pending
// @access  Private
router.get('/pending', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = (req.user as any)._id.toString();
  const pendingRequests = await Connection.findPendingRequests(userId);

  res.status(200).json({
    success: true,
    data: pendingRequests
  });
}));

// @desc    Get sent connection requests (outgoing)
// @route   GET /api/connections/sent
// @access  Private
router.get('/sent', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = (req.user as any)._id.toString();
  const sentRequests = await Connection.findSentRequests(userId);

  res.status(200).json({
    success: true,
    data: sentRequests
  });
}));

// @desc    Get connection suggestions
// @route   GET /api/connections/suggestions
// @access  Private
router.get('/suggestions', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const userId = req.user!._id.toString();

  // Get users that are already connected or have pending requests
  const existingConnections = await Connection.find({
    $or: [
      { requester: userId },
      { recipient: userId }
    ]
  }).select('requester recipient status');

  const connectedUserIds = existingConnections.reduce((acc: string[], conn) => {
    if (conn.requester.toString() !== userId) {
      acc.push(conn.requester.toString());
    }
    if (conn.recipient.toString() !== userId) {
      acc.push(conn.recipient.toString());
    }
    return acc;
  }, []);

  // Remove duplicates and self
  const excludeIds = [...new Set([...connectedUserIds, userId])];

  // Helper function to calculate profile completion percentage
  const calculateProfileCompletion = (user: any): number => {
    const role = (user.role || user.userType || '').toLowerCase();
    let totalFields = 0;
    let completedFields = 0;
    
    console.log(`Calculating completion for user: ${user.firstName} ${user.lastName}, role: ${role}`);
    
    if (role === 'jobseeker' || role === 'job_seeker' || role.includes('job')) {
      // Job seeker profile completion criteria (8 total fields - more lenient)
      totalFields = 8;
      
      // Basic info (3 fields)
      if (user.firstName && user.firstName.trim()) completedFields++;
      if (user.lastName && user.lastName.trim()) completedFields++;
      if (user.email && user.email.trim()) completedFields++;
      
      // Profile details (2 fields - reduced requirements)
      if (user.bio && user.bio.trim().length > 10) completedFields++; // Reduced from 20 to 10
      if (user.location && user.location.trim()) completedFields++;
      
      // Skills (1 field - reduced requirement)
      if (user.skills && user.skills.length >= 1) completedFields++; // Reduced from 3 to 1
      
      // Experience OR Education (1 field)
      if ((user.experience && user.experience.length > 0) || (user.education && user.education.length > 0)) completedFields++;
      
      // Profile picture (1 field)
      if (user.profilePicture) completedFields++;
      
    } else if (role === 'student' || role.includes('student')) {
      // Student profile completion criteria (7 total fields - more lenient)
      totalFields = 7;
      
      // Basic info (3 fields)
      if (user.firstName && user.firstName.trim()) completedFields++;
      if (user.lastName && user.lastName.trim()) completedFields++;
      if (user.email && user.email.trim()) completedFields++;
      
      // Profile details (2 fields)
      if (user.bio && user.bio.trim().length > 10) completedFields++;
      if (user.location && user.location.trim()) completedFields++;
      
      // Academic info (1 field)
      if (user.education && user.education.length > 0) completedFields++;
      
      // Skills (1 field)
      if (user.skills && user.skills.length >= 1) completedFields++;
      
    } else if (role === 'employer' || role.includes('employer')) {
      // Employer profile completion criteria (6 total fields - more lenient)
      totalFields = 6;
      
      // Basic info (3 fields)
      if (user.firstName && user.firstName.trim()) completedFields++;
      if (user.lastName && user.lastName.trim()) completedFields++;
      if (user.email && user.email.trim()) completedFields++;
      
      // Company info (2 fields - reduced requirement)
      if (user.company && user.company.trim()) completedFields++;
      if (user.jobTitle && user.jobTitle.trim()) completedFields++;
      
      // Additional info (1 field)
      if (user.location && user.location.trim()) completedFields++;
      
    } else {
      // Default for any other role - very basic requirements
      totalFields = 4;
      
      if (user.firstName && user.firstName.trim()) completedFields++;
      if (user.lastName && user.lastName.trim()) completedFields++;
      if (user.email && user.email.trim()) completedFields++;
      if (user.bio && user.bio.trim().length > 5) completedFields++;
    }
    
    const percentage = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
    console.log(`User ${user.firstName}: ${completedFields}/${totalFields} fields completed = ${percentage}%`);
    
    return percentage;
  };

  // Helper function to check if profile meets minimum completion requirement
  const meetsProfileRequirement = (user: any): boolean => {
    const completionPercentage = calculateProfileCompletion(user);
    return completionPercentage >= 50; // Temporarily lowered to 50% to debug
  };

  // Find all eligible users (excluding admins and connected users)
  const eligibleUsers = await User.find({
    _id: { $nin: excludeIds },
    $and: [
      {
        $or: [
          { isActive: true },
          { isActive: { $exists: false } } // Include users without isActive field
        ]
      },
      {
        // Exclude admins and super admins
        $and: [
          { role: { $ne: 'admin' } },
          { role: { $ne: 'super_admin' } },
          { userType: { $ne: 'admin' } },
          { userType: { $ne: 'super_admin' } }
        ]
      }
    ]
  })
  .select('firstName lastName profilePicture company jobTitle industry location skills role userType bio phone experience education email')
  .limit(limit * 5); // Get more to filter and have variety

  console.log(`Found ${eligibleUsers.length} eligible users before profile filtering`);

  // Filter by profile completion (80% minimum) and prioritize
  const completedProfileUsers = eligibleUsers.filter(user => {
    const completion = calculateProfileCompletion(user);
    const meets = meetsProfileRequirement(user);
    console.log(`User ${user.firstName} ${user.lastName} (${user.role || user.userType}): ${completion}% completion, meets requirement: ${meets}`);
    return meets;
  });
  
  console.log(`${completedProfileUsers.length} users passed the 50% completion filter`);
  
  // If no users meet the completion requirement, show top users anyway but with lower completion
  let usersToShow = completedProfileUsers;
  if (usersToShow.length === 0) {
    console.log('No users met completion requirement, showing all eligible users');
    usersToShow = eligibleUsers.slice(0, limit);
  }
  
  const prioritizedSuggestions = usersToShow
    .sort((a, b) => {
      const roleOrder = ['jobseeker', 'job_seeker', 'student', 'employer'];
      const aRole = a.role || a.userType || '';
      const bRole = b.role || b.userType || '';
      const aIndex = roleOrder.indexOf(aRole);
      const bIndex = roleOrder.indexOf(bRole);
      
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      
      return aIndex - bIndex;
    })
    .slice(0, limit)
    .map(user => ({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePicture: user.profilePicture,
      company: user.company,
      jobTitle: user.jobTitle,
      industry: user.industry,
      location: user.location,
      skills: user.skills,
      role: user.role,
      userType: user.userType,
      bio: user.bio,
      profileCompletion: calculateProfileCompletion(user)
    }));

  res.status(200).json({
    success: true,
    data: prioritizedSuggestions
  });
}));

// @desc    Remove connection
// @route   DELETE /api/connections/:userId
// @access  Private
router.delete('/:userId', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const otherUserId = req.params.userId;
  const currentUserId = req.user!._id.toString();

  const connection = await Connection.findOne({
    $or: [
      { requester: currentUserId, recipient: otherUserId },
      { requester: otherUserId, recipient: currentUserId }
    ],
    status: 'accepted'
  });

  if (!connection) {
    res.status(404).json({
      success: false,
      error: 'Connection not found'
    });
    return;
  }

  await connection.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Connection removed successfully'
  });
}));

// @desc    Check connection status between two users
// @route   GET /api/connections/status/:userId
// @access  Private
router.get('/status/:userId', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const otherUserId = req.params.userId;
  const currentUserId = req.user!._id.toString();

  if (otherUserId === currentUserId) {
    res.status(200).json({
      success: true,
      data: { status: 'self' }
    });
    return;
  }

  const connection = await Connection.findOne({
    $or: [
      { requester: currentUserId, recipient: otherUserId },
      { requester: otherUserId, recipient: currentUserId }
    ]
  });

  if (!connection) {
    res.status(200).json({
      success: true,
      data: { status: 'none' }
    });
    return;
  }

  const isRequester = connection.requester.toString() === currentUserId;

  res.status(200).json({
    success: true,
    data: {
      status: connection.status,
      isRequester,
      connectionType: connection.connectionType
    }
  });
}));

export default router;