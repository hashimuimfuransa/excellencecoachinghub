import express, { Request, Response } from 'express';
import { Chat, ChatMessage } from '@/models/Chat';
import { User } from '@/models/User';
import { auth } from '@/middleware/auth';
import { validateRequest } from '@/middleware/validateRequest';
import { body, param, query } from 'express-validator';
import mongoose from 'mongoose';
import { io } from '@/services/socketService';

const router = express.Router();

// Validation schemas
const createChatValidation = [
  body('participantIds')
    .isArray({ min: 1 })
    .withMessage('At least one participant is required'),
  body('isGroup')
    .optional()
    .isBoolean()
    .withMessage('isGroup must be a boolean'),
  body('groupName')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Group name must be between 1 and 100 characters'),
  body('initialMessage')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Initial message cannot be empty'),
];

const sendMessageValidation = [
  param('chatId')
    .isMongoId()
    .withMessage('Invalid chat ID'),
  body('content')
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Message content cannot be empty'),
  body('messageType')
    .optional()
    .isIn(['text', 'file', 'image'])
    .withMessage('Invalid message type'),
];

// Get all conversations for current user
router.get('/conversations', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const chats = await Chat.find({
      participants: userId,
    })
    .populate('participants', 'firstName lastName email profilePicture role isOnline lastSeen company')
    .populate('lastMessage')
    .populate({
      path: 'lastMessage',
      populate: {
        path: 'sender',
        select: 'firstName lastName'
      }
    })
    .sort({ updatedAt: -1 });

    // Get unread counts for each chat
    const chatsWithUnreadCount = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await chat.getUnreadCount(userId);
        const chatObj = chat.toObject();
        return {
          ...chatObj,
          unreadCount,
        };
      })
    );

    res.json({
      success: true,
      data: chatsWithUnreadCount,
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

// Get messages for a specific chat
router.get('/:chatId/messages', auth, param('chatId').isMongoId(), validateRequest, async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const userId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    // Check if user is participant in this chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId,
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found or access denied',
      });
    }

    // Get messages with pagination
    const messages = await ChatMessage.find({ chat: chatId })
      .populate('sender', 'firstName lastName profilePicture')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    // Get total count for pagination
    const total = await ChatMessage.countDocuments({ chat: chatId });
    const hasMore = skip + messages.length < total;

    // Reverse messages to show oldest first
    messages.reverse();

    res.json({
      success: true,
      data: messages,
      pagination: {
        page,
        limit,
        total,
        hasMore,
      },
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

// Create new chat or get existing one
router.post('/create', auth, createChatValidation, validateRequest, async (req: Request, res: Response) => {
  try {
    const { participantIds, isGroup = false, groupName, initialMessage } = req.body;
    const userId = req.user?.id;

    // Add current user to participants
    const allParticipants = [...new Set([userId, ...participantIds])];

    // For direct chats (not group), check if chat already exists
    let chat;
    if (!isGroup && allParticipants.length === 2) {
      chat = await Chat.findOne({
        participants: { $all: allParticipants, $size: 2 },
        isGroup: false,
      }).populate('participants', 'firstName lastName email profilePicture role isOnline lastSeen company');
    }

    // Create new chat if doesn't exist
    if (!chat) {
      chat = new Chat({
        participants: allParticipants,
        isGroup,
        groupName: isGroup ? groupName : undefined,
        createdBy: userId,
      });

      await chat.save();
      await chat.populate('participants', 'firstName lastName email profilePicture role isOnline lastSeen company');
    }

    // Send initial message if provided
    if (initialMessage) {
      const message = new ChatMessage({
        chat: chat._id,
        sender: userId,
        content: initialMessage,
        messageType: 'text',
      });

      await message.save();
      await message.populate('sender', 'firstName lastName profilePicture');

      // Update chat's last message
      chat.lastMessage = message._id as any;
      await chat.save();

      // Emit new message to participants
      if (io) {
        chat.participants.forEach((participant: any) => {
          if (participant._id.toString() !== userId) {
            io.to(`user_${participant._id}`).emit('new-message', {
              chatId: chat._id,
              message: message,
            });
          }
        });
      }
    }

    // Get unread count
    const unreadCount = await chat.getUnreadCount(userId);

    res.status(201).json({
      success: true,
      data: {
        ...chat.toObject(),
        unreadCount,
      },
    });
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create chat',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

// Send message
router.post('/:chatId/message', auth, sendMessageValidation, validateRequest, async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const { content, messageType = 'text', fileUrl, fileName } = req.body;
    const userId = req.user?.id;

    // Check if user is participant in this chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId,
    }).populate('participants', 'firstName lastName email profilePicture role');

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found or access denied',
      });
    }

    // Create new message
    const message = new ChatMessage({
      chat: chatId,
      sender: userId,
      content,
      messageType,
      fileUrl,
      fileName,
    });

    await message.save();
    await message.populate('sender', 'firstName lastName profilePicture');

    // Update chat's last message and timestamp
    chat.lastMessage = message._id as any;
    await chat.save();

    // Emit new message to all participants except sender
    if (io) {
      chat.participants.forEach((participant: any) => {
        if (participant._id.toString() !== userId) {
          io.to(`user_${participant._id}`).emit('new-message', {
            chatId: chat._id,
            message: message,
          });
        }
      });
    }

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

// Mark messages as read
router.put('/:chatId/read', auth, param('chatId').isMongoId(), validateRequest, async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const userId = req.user?.id;

    // Check if user is participant in this chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId,
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found or access denied',
      });
    }

    // Mark all unread messages as read for this user
    await ChatMessage.updateMany(
      {
        chat: chatId,
        readBy: { $ne: userId },
      },
      {
        $addToSet: { readBy: userId },
      }
    );

    // Emit read status to other participants
    if (io) {
      chat.participants.forEach((participantId: any) => {
        if (participantId.toString() !== userId) {
          io.to(`user_${participantId}`).emit('messages-read', {
            chatId: chat._id,
            readBy: userId,
          });
        }
      });
    }

    res.json({
      success: true,
      message: 'Messages marked as read',
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

// Search users to start chat with
router.get('/users/search', auth, async (req: Request, res: Response) => {
  try {
    const { query: searchQuery, type = 'all', excludeCurrentUser = true } = req.query;
    const userId = req.user?.id;

    let searchFilter: any = {};

    // Add search query filter
    if (searchQuery) {
      searchFilter.$or = [
        { firstName: { $regex: searchQuery, $options: 'i' } },
        { lastName: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } },
        { company: { $regex: searchQuery, $options: 'i' } },
      ];
    }

    // Add user type filter
    if (type !== 'all') {
      if (type === 'job_seekers') {
        searchFilter.role = 'job_seeker';
      } else if (type === 'employers') {
        searchFilter.role = 'employer';
      }
    }

    // Exclude current user
    if (excludeCurrentUser) {
      searchFilter._id = { $ne: userId };
    }

    const users = await User.find(searchFilter)
      .select('firstName lastName email profilePicture role isOnline lastSeen company')
      .limit(20)
      .sort({ firstName: 1, lastName: 1 });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search users',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

// Get online users
router.get('/online-users', auth, async (req: Request, res: Response) => {
  try {
    const onlineUsers = await User.find({
      isOnline: true,
      _id: { $ne: req.user?.id },
    })
    .select('firstName lastName email profilePicture role company')
    .limit(50)
    .sort({ firstName: 1, lastName: 1 });

    res.json({
      success: true,
      data: onlineUsers,
    });
  } catch (error) {
    console.error('Error fetching online users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch online users',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

export default router;