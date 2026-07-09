import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { getApiUrl } from '../utils/api';

export const useSocket = (roomId, user, onEvents = {}) => {
  const socketRef = useRef(null);
  const onEventsRef = useRef(onEvents);

  // Keep event listeners up-to-date
  useEffect(() => {
    onEventsRef.current = onEvents;
  }, [onEvents]);

  useEffect(() => {
    if (!roomId || !user) return;

    const socketUrl = getApiUrl() || 'http://localhost:5000';
    
    // Connect to Socket.io server
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to collaboration server:', socket.id);
      socket.emit('join-workspace', { roomId, user });
    });

    // Dynamically register callbacks
    const registeredEvents = [];
    Object.entries(onEventsRef.current).forEach(([eventName, callback]) => {
      const handler = (...args) => {
        if (onEventsRef.current[eventName]) {
          onEventsRef.current[eventName](...args);
        }
      };
      socket.on(eventName, handler);
      registeredEvents.push({ eventName, handler });
    });

    return () => {
      console.log('Cleaning up socket connection...');
      registeredEvents.forEach(({ eventName, handler }) => {
        socket.off(eventName, handler);
      });
      socket.disconnect();
    };
  }, [roomId, user?.id]); // Reconnect if room or user ID changes

  return socketRef.current;
};
