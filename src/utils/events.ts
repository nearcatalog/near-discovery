import { googleCalendarApiKey, lumaApiUrl } from './config';
import type { FormatedEvent, GoogleEventItem, GoogleEventsListData, LumaEventItem, LumaEventsListData } from './types';

export const fetchLumaEvents = async (
  calendarApiId: string,
  limit: number,
  offset: number,
): Promise<LumaEventsListData> => {
  const queryFrom = `period=future`;
  const queryLimit = `pagination_limit=${limit ?? 10}`;
  const queryOffset = offset ? `pagination_offset=${offset}` : '';
  const queryParams = [queryFrom, queryLimit, queryOffset].filter(Boolean).join('&');

  const res = await fetch(`${lumaApiUrl}/calendar/get-items?calendar_api_id=${calendarApiId}&${queryParams}`, {
    method: 'GET',
    headers: {
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch Luma Calendar Data');
  }

  const data = (await res.json()) as {
    entries: LumaEventItem[];
    has_more: boolean;
  };

  return { entries: data.entries, hasMore: data.has_more };
};

export const fetchGoogleCalendarEvents = async (
  calendarId: string,
  startFrom: string,
  limit: number,
  pageToken: string,
): Promise<GoogleEventsListData> => {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${googleCalendarApiKey}&maxResults=${limit}&timeMin=${startFrom}&singleEvents=true&orderBy=startTime&pageToken=${pageToken}`,
    {},
  );

  if (!res.ok) {
    throw new Error('Failed to fetch Google Calendar Data');
  }

  const data = (await res.json()) as {
    items: GoogleEventItem[];
    nextPageToken: string;
  };

  return { items: data.items, nextPageToken: data.nextPageToken };
};

export const formatEventDateTime = (dateString: string) => {
  // eg. Thu, 15 August 4:00 PM UTC
  const date = new Date(dateString);

  const formattedDate = date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
  });

  let hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12 || 12;

  const formattedTime = `${hours}:${minutes.toString().padStart(2, '0')} ${period}`;

  return `${formattedDate} ${formattedTime} UTC`;
};

export const sortEventsByDate = (events: FormatedEvent[]) => {
  return events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
};

export const formatEvents = (events: FormatedEvent[]) => {
  return events.map((event) => {
    return { ...event, start: formatEventDateTime(event.start) };
  });
};
