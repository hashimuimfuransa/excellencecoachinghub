import { Request, Response } from 'express';
import { TeacherAttendance, ITeacherAttendanceDocument } from '../models/TeacherAttendance';

// Get all teacher attendance records
export const getAttendanceRecords = async (req: Request, res: Response) => {
  try {
    const records = await TeacherAttendance.find().sort({ date: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendance records', error });
  }
};

// Get attendance records for a specific teacher
export const getTeacherAttendance = async (req: Request, res: Response) => {
  try {
    const { teacherName } = req.params;
    if (!teacherName) {
      return res.status(400).json({ message: 'Teacher name is required' });
    }
    const records = await TeacherAttendance.findByTeacherName(teacherName);
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teacher attendance records', error });
  }
};

// Mark attendance for a teacher
export const markAttendance = async (req: Request, res: Response) => {
  try {
    const { teacherName, status, date, time } = req.body;
    
    // Validate input
    if (!teacherName || !status || !date || !time) {
      return res.status(400).json({ message: 'Missing required fields: teacherName, status, date, time' });
    }
    
    // Parse date and time
    const attendanceDate = new Date(date);
    const [hours, minutes, seconds] = time.split(':').map(Number);
    attendanceDate.setHours(hours, minutes, seconds || 0, 0);
    
    // Get today's record for this teacher
    let record = await TeacherAttendance.getTodaysRecord(teacherName);
    
    if (record) {
      // Update existing record
      if (status === 'start') {
        record.startTime = attendanceDate;
        record.status = 'in-progress';
      } else if (status === 'end') {
        record.endTime = attendanceDate;
        record.status = 'completed';
      }
      await record.save();
    } else {
      // Create new record
      const newRecord = new TeacherAttendance({
        teacherName,
        date: new Date(date),
        startTime: status === 'start' ? attendanceDate : undefined,
        endTime: status === 'end' ? attendanceDate : undefined,
        status: status === 'start' ? 'in-progress' : 'completed'
      });
      record = await newRecord.save();
    }
    
    res.json({ success: true, record });
  } catch (error) {
    res.status(500).json({ message: 'Error marking attendance', error });
  }
};

// Get teacher statistics
export const getTeacherStats = async (req: Request, res: Response) => {
  try {
    const { teacherName } = req.params;
    if (!teacherName) {
      return res.status(400).json({ message: 'Teacher name is required' });
    }
    const stats = await TeacherAttendance.getTeacherStats(teacherName);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teacher statistics', error });
  }
};

// Get attendance records by date range
export const getAttendanceByDateRange = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Missing required query parameters: startDate, endDate' });
    }
    
    const records = await TeacherAttendance.findByDateRange(
      new Date(startDate as string),
      new Date(endDate as string)
    );
    
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendance records by date range', error });
  }
};