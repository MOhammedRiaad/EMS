import {
  Controller,
  Get,
  Post,
  Param,
  Res,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CalendarService } from './calendar.service';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';

@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('feed/:userId/:token.ics')
  async getFeed(
    @Param('userId') userId: string,
    @Param('token') token: string,
    @Res() res: Response,
  ) {
    const ics = await this.calendarService.getFeedForUser(userId, token);
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="ems-sessions.ics"',
    );
    res.send(ics);
  }

  @Get('session/:id.ics')
  async getSessionIcs(@Param('id') id: string, @Res() res: Response) {
    const ics = await this.calendarService.generateSessionIcs(id);
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="session.ics"');
    res.send(ics);
  }

  @Post('token')
  @UseGuards(AuthGuard('jwt'))
  async generateToken(@Req() req: any) {
    const token = await this.calendarService.generateCalendarToken(req.user.id);
    return { token };
  }

  @Get('token')
  @UseGuards(AuthGuard('jwt'))
  async getToken(@Req() req: any) {
    const token = await this.calendarService.getToken(req.user.id);
    return { token };
  }
}
