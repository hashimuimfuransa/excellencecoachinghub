import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth';
import { Event, User } from '../models';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// @desc    Get upcoming events
// @route   GET /api/events/upcoming
// @access  Private
router.get('/upcoming', protect, asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const eventType = req.query.type as string;

  let query: any = {
    status: 'published',
    isPublic: true,
    date: { $gte: new Date() }
  };

  if (eventType) {
    query.eventType = eventType;
  }

  const events = await Event.find(query)
    .populate('organizer')
    .sort({ date: 1 })
    .limit(limit);

  res.status(200).json({
    success: true,
    data: events
  });
}));

// @desc    Get all events with pagination
// @route   GET /api/events
// @access  Private
router.get('/', protect, asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;
  const search = req.query.search as string;
  const eventType = req.query.type as string;
  const status = req.query.status as string || 'published';

  let query: any = { status, isPublic: true };

  if (search) {
    query.$text = { $search: search };
  }

  if (eventType) {
    query.eventType = eventType;
  }

  const events = await Event.find(query)
    .populate('organizer')
    .sort({ date: 1 })
    .skip(skip)
    .limit(limit);

  const totalEvents = await Event.countDocuments(query);

  res.status(200).json({
    success: true,
    data: events,
    pagination: {
      page,
      limit,
      total: totalEvents,
      pages: Math.ceil(totalEvents / limit)
    }
  });
}));

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Private
router.get('/:id', protect, asyncHandler(async (req: Request, res: Response) => {
  const event = await Event.findById(req.params.id)
    .populate('organizer');

  if (!event) {
    res.status(404).json({
      success: false,
      error: 'Event not found'
    });
    return;
  }

  // Check if user is registered for this event
  const isRegistered = event.attendees.includes(req.user!._id.toString());

  res.status(200).json({
    success: true,
    data: {
      ...event.toJSON(),
      isRegistered
    }
  });
}));

// @desc    Create new event
// @route   POST /api/events
// @access  Private
router.post('/', protect, asyncHandler(async (req: Request, res: Response) => {
  const {
    title,
    description,
    eventType,
    date,
    endDate,
    location,
    isOnline,
    meetingLink,
    capacity,
    price,
    currency,
    tags,
    banner,
    isPublic,
    registrationRequired,
    registrationDeadline
  } = req.body;

  // Validate required fields
  if (!title || !description || !eventType || !date || !location) {
    res.status(400).json({
      success: false,
      error: 'Title, description, event type, date, and location are required'
    });
    return;
  }

  // Validate date is in the future
  if (new Date(date) <= new Date()) {
    res.status(400).json({
      success: false,
      error: 'Event date must be in the future'
    });
    return;
  }

  // If online event, meeting link is required
  if (isOnline && !meetingLink) {
    res.status(400).json({
      success: false,
      error: 'Meeting link is required for online events'
    });
    return;
  }

  const event = await Event.create({
    title,
    description,
    organizer: req.user!._id,
    organizerType: 'User',
    eventType,
    date: new Date(date),
    endDate: endDate ? new Date(endDate) : undefined,
    location,
    isOnline: isOnline || false,
    meetingLink,
    capacity,
    price: price || 0,
    currency: currency || 'USD',
    tags: tags || [],
    banner,
    isPublic: isPublic !== false,
    registrationRequired: registrationRequired !== false,
    registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : undefined,
    status: 'published'
  });

  await event.populate('organizer');

  res.status(201).json({
    success: true,
    data: event,
    message: 'Event created successfully'
  });
}));

// @desc    Register for event
// @route   POST /api/events/:id/register
// @access  Private
router.post('/:id/register', protect, asyncHandler(async (req: Request, res: Response) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    res.status(404).json({
      success: false,
      error: 'Event not found'
    });
    return;
  }

  // Check if event is published and public
  if (event.status !== 'published' || !event.isPublic) {
    res.status(400).json({
      success: false,
      error: 'Event is not available for registration'
    });
    return;
  }

  // Check if registration deadline has passed
  if (event.registrationDeadline && new Date() > event.registrationDeadline) {
    res.status(400).json({
      success: false,
      error: 'Registration deadline has passed'
    });
    return;
  }

  // Check if event has reached capacity
  if (event.capacity && event.attendeesCount >= event.capacity) {
    res.status(400).json({
      success: false,
      error: 'Event has reached maximum capacity'
    });
    return;
  }

  const userId = req.user!._id.toString();

  // Check if already registered
  if (event.attendees.includes(userId)) {
    res.status(400).json({
      success: false,
      error: 'Already registered for this event'
    });
    return;
  }

  // Register user for event
  event.attendees.push(userId);
  event.attendeesCount += 1;
  await event.save();

  res.status(200).json({
    success: true,
    message: 'Successfully registered for event'
  });
}));

// @desc    Unregister from event
// @route   POST /api/events/:id/unregister
// @access  Private
router.post('/:id/unregister', protect, asyncHandler(async (req: Request, res: Response) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    res.status(404).json({
      success: false,
      error: 'Event not found'
    });
    return;
  }

  const userId = req.user!._id.toString();
  const attendeeIndex = event.attendees.indexOf(userId);

  if (attendeeIndex === -1) {
    res.status(400).json({
      success: false,
      error: 'Not registered for this event'
    });
    return;
  }

  // Unregister user from event
  event.attendees.splice(attendeeIndex, 1);
  event.attendeesCount = Math.max(0, event.attendeesCount - 1);
  await event.save();

  res.status(200).json({
    success: true,
    message: 'Successfully unregistered from event'
  });
}));

// @desc    Get events by type
// @route   GET /api/events/type/:type
// @access  Private
router.get('/type/:type', protect, asyncHandler(async (req: Request, res: Response) => {
  const events = await Event.findByType(req.params.type);

  res.status(200).json({
    success: true,
    data: events
  });
}));

// @desc    Get user's events (created by user)
// @route   GET /api/events/my-events
// @access  Private
router.get('/my-events', protect, asyncHandler(async (req: Request, res: Response) => {
  const events = await Event.findByOrganizer(req.user!._id.toString());

  res.status(200).json({
    success: true,
    data: events
  });
}));

// @desc    Get user's registered events
// @route   GET /api/events/registered
// @access  Private
router.get('/registered', protect, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id.toString();

  const events = await Event.find({
    attendees: userId,
    date: { $gte: new Date() }
  })
  .populate('organizer')
  .sort({ date: 1 });

  res.status(200).json({
    success: true,
    data: events
  });
}));

// @desc    Update event (only by organizer)
// @route   PUT /api/events/:id
// @access  Private
router.put('/:id', protect, asyncHandler(async (req: Request, res: Response) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    res.status(404).json({
      success: false,
      error: 'Event not found'
    });
    return;
  }

  // Check if user is the organizer
  if (event.organizer.toString() !== req.user!._id.toString()) {
    res.status(403).json({
      success: false,
      error: 'Not authorized to update this event'
    });
    return;
  }

  const updatedEvent = await Event.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('organizer');

  res.status(200).json({
    success: true,
    data: updatedEvent,
    message: 'Event updated successfully'
  });
}));

// @desc    Delete event (only by organizer)
// @route   DELETE /api/events/:id
// @access  Private
router.delete('/:id', protect, asyncHandler(async (req: Request, res: Response) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    res.status(404).json({
      success: false,
      error: 'Event not found'
    });
    return;
  }

  // Check if user is the organizer
  if (event.organizer.toString() !== req.user!._id.toString()) {
    res.status(403).json({
      success: false,
      error: 'Not authorized to delete this event'
    });
    return;
  }

  await event.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Event deleted successfully'
  });
}));

export default router;