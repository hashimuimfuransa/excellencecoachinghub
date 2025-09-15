import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { EmailEvent } from '@/models/EmailEvent';
import { getSocketIO } from '@/services/notificationService';

const router = express.Router();

/**
 * Verify SendGrid webhook signature
 * This ensures the webhook is coming from SendGrid and not an attacker
 */
const verifySendGridSignature = (req: Request): boolean => {
  const signature = req.headers['x-twilio-email-event-webhook-signature'] as string;
  const timestamp = req.headers['x-twilio-email-event-webhook-timestamp'] as string;
  
  if (!signature || !timestamp) {
    console.log('❌ Missing SendGrid webhook signature or timestamp');
    return false;
  }

  const publicKey = process.env.SENDGRID_WEBHOOK_PUBLIC_KEY;
  if (!publicKey) {
    console.log('⚠️ SENDGRID_WEBHOOK_PUBLIC_KEY not configured, skipping verification');
    return true; // Allow in development if key not set
  }

  try {
    // Use raw body if available, otherwise stringify the parsed body
    const payload = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);
    const data = timestamp + payload;
    
    // Create signature using ECDSA with SHA256
    const verify = crypto.createVerify('SHA256');
    verify.update(data);
    
    // Convert public key to proper format
    const publicKeyFormatted = `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`;
    
    const isValid = verify.verify(publicKeyFormatted, signature, 'base64');
    
    if (!isValid) {
      console.log('❌ Invalid SendGrid webhook signature');
    }
    
    return isValid;
  } catch (error) {
    console.error('❌ Error verifying SendGrid webhook signature:', error);
    return false;
  }
};

/**
 * SendGrid Event Webhook Endpoint
 * Receives real-time email events from SendGrid
 */
router.post('/events', async (req: Request, res: Response) => {
  try {
    console.log('📧 Received SendGrid webhook event');
    
    // Verify the webhook signature (optional but recommended for production)
    if (process.env.NODE_ENV === 'production' && !verifySendGridSignature(req)) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid webhook signature' 
      });
    }

    const events = req.body;
    
    if (!Array.isArray(events)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid payload format - expected array of events' 
      });
    }

    console.log(`📬 Processing ${events.length} SendGrid events`);

    // Process each event
    const processedEvents = [];
    
    for (const event of events) {
      try {
        // Create email event record
        const emailEvent = new EmailEvent({
          email: event.email,
          event: event.event,
          timestamp: event.timestamp,
          sgEventId: event.sg_event_id,
          sgMessageId: event.sg_message_id,
          reason: event.reason,
          url: event.url,
          userAgent: event.useragent || event.user_agent,
          ip: event.ip,
          attempt: event.attempt,
          response: event.response,
          status: event.status,
          tls: event.tls,
          cert_err: event.cert_err,
          type: event.type,
          category: event.category,
          uniqueArgs: event.unique_args,
          marketingCampaignId: event.marketing_campaign_id,
          marketingCampaignName: event.marketing_campaign_name
        });

        const savedEvent = await emailEvent.save();
        processedEvents.push(savedEvent);

        console.log(`✅ Saved email event: ${event.event} for ${event.email}`);

        // Emit real-time update to super admin dashboard
        const io = getSocketIO();
        if (io) {
          io.emit('emailEvent', {
            id: savedEvent._id,
            email: savedEvent.email,
            event: savedEvent.event,
            timestamp: savedEvent.timestamp,
            createdAt: savedEvent.createdAt,
            reason: savedEvent.reason,
            url: savedEvent.url,
            userAgent: savedEvent.userAgent,
            ip: savedEvent.ip
          });
        }

      } catch (eventError) {
        console.error(`❌ Error processing event for ${event.email}:`, eventError);
        // Continue processing other events even if one fails
      }
    }

    // Log summary
    console.log(`📊 SendGrid Events Summary:`);
    console.log(`  - Total Events: ${events.length}`);
    console.log(`  - Successfully Processed: ${processedEvents.length}`);
    console.log(`  - Failed: ${events.length - processedEvents.length}`);

    // Group events by type for logging
    const eventSummary = events.reduce((acc: any, event: any) => {
      acc[event.event] = (acc[event.event] || 0) + 1;
      return acc;
    }, {});
    
    console.log(`  - Event Types:`, eventSummary);

    res.status(200).json({ 
      success: true, 
      message: `Processed ${processedEvents.length}/${events.length} events`,
      processed: processedEvents.length,
      failed: events.length - processedEvents.length
    });

  } catch (error: any) {
    console.error('❌ SendGrid webhook error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error processing webhook',
      error: error.message 
    });
  }
});

/**
 * Get email events for admin dashboard
 * Returns paginated list of email events
 */
router.get('/events', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const eventType = req.query.event as string;
    const email = req.query.email as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    
    if (eventType) {
      query.event = eventType;
    }
    
    if (email) {
      query.email = { $regex: email, $options: 'i' };
    }
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate).getTime() / 1000;
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate).getTime() / 1000;
      }
    }

    // Get events with pagination
    const [events, totalCount] = await Promise.all([
      EmailEvent.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      EmailEvent.countDocuments(query)
    ]);

    // Get event statistics
    const eventStats = await EmailEvent.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$event',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        events,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        },
        stats: eventStats.reduce((acc: any, stat: any) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching email events:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching email events',
      error: error.message 
    });
  }
});

/**
 * Get email event statistics
 * Returns aggregated statistics for dashboard charts
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startTimestamp = Math.floor((Date.now() - (days * 24 * 60 * 60 * 1000)) / 1000);

    // Get daily event counts
    const dailyStats = await EmailEvent.aggregate([
      {
        $match: {
          timestamp: { $gte: startTimestamp }
        }
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: { $dateFromString: { dateString: { $toString: { $multiply: ['$timestamp', 1000] } } } }
              }
            },
            event: '$event'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          events: {
            $push: {
              type: '$_id.event',
              count: '$count'
            }
          },
          total: { $sum: '$count' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get overall event type distribution
    const eventDistribution = await EmailEvent.aggregate([
      {
        $match: {
          timestamp: { $gte: startTimestamp }
        }
      },
      {
        $group: {
          _id: '$event',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get top email domains
    const topDomains = await EmailEvent.aggregate([
      {
        $match: {
          timestamp: { $gte: startTimestamp }
        }
      },
      {
        $project: {
          domain: {
            $arrayElemAt: [
              { $split: ['$email', '@'] },
              1
            ]
          },
          event: 1
        }
      },
      {
        $group: {
          _id: '$domain',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        dailyStats,
        eventDistribution,
        topDomains,
        period: {
          days,
          startTimestamp,
          endTimestamp: Math.floor(Date.now() / 1000)
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching email statistics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching email statistics',
      error: error.message 
    });
  }
});

/**
 * Test endpoint - Create sample email events for testing
 * DELETE THIS IN PRODUCTION!
 */
router.post('/test-events', async (req: Request, res: Response) => {
  try {
    console.log('🧪 Creating test email events for dashboard testing');
    
    const testEvents = [
      {
        email: 'test@example.com',
        event: 'delivered',
        timestamp: Math.floor(Date.now() / 1000),
        sgEventId: 'test-delivered-1',
        sgMessageId: 'test-msg-1'
      },
      {
        email: 'user@gmail.com',
        event: 'open',
        timestamp: Math.floor(Date.now() / 1000) - 300,
        sgEventId: 'test-open-1',
        sgMessageId: 'test-msg-2',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ip: '192.168.1.100'
      },
      {
        email: 'johndoe@example.com',
        event: 'click',
        timestamp: Math.floor(Date.now() / 1000) - 600,
        sgEventId: 'test-click-1',
        sgMessageId: 'test-msg-3',
        url: 'https://excellencecoachinghub.com/jobs/software-engineer',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)',
        ip: '10.0.0.50'
      },
      {
        email: 'bounce@invalid.domain',
        event: 'bounce',
        timestamp: Math.floor(Date.now() / 1000) - 900,
        sgEventId: 'test-bounce-1',
        sgMessageId: 'test-msg-4',
        reason: 'Invalid email address'
      },
      {
        email: 'spammer@example.com',
        event: 'spam_report',
        timestamp: Math.floor(Date.now() / 1000) - 1200,
        sgEventId: 'test-spam-1',
        sgMessageId: 'test-msg-5'
      }
    ];

    const savedEvents = [];
    
    for (const eventData of testEvents) {
      const emailEvent = new EmailEvent(eventData);
      const savedEvent = await emailEvent.save();
      savedEvents.push(savedEvent);
      
      // Emit real-time update to dashboard
      const io = getSocketIO();
      if (io) {
        io.emit('emailEvent', {
          _id: savedEvent._id,
          email: savedEvent.email,
          event: savedEvent.event,
          timestamp: savedEvent.timestamp,
          createdAt: savedEvent.createdAt,
          reason: savedEvent.reason,
          url: savedEvent.url,
          userAgent: savedEvent.userAgent,
          ip: savedEvent.ip
        });
      }
    }

    console.log(`✅ Created ${savedEvents.length} test email events`);

    res.status(200).json({
      success: true,
      message: `Created ${savedEvents.length} test email events`,
      events: savedEvents.map(e => ({
        id: e._id,
        email: e.email,
        event: e.event,
        timestamp: e.timestamp
      }))
    });

  } catch (error: any) {
    console.error('❌ Error creating test email events:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating test email events',
      error: error.message
    });
  }
});

export default router;