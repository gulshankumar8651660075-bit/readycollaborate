const prisma = require('../utils/prisma');

// In-memory store for active workspaces: roomId -> { socketId: userInfo }
const activeWorkspaces = {};

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`New socket connection: ${socket.id}`);

    // Join workspace room
    socket.on('join-workspace', async ({ roomId, user }) => {
      if (!roomId || !user) return;

      socket.join(roomId);
      socket.roomId = roomId;
      socket.user = user; // { id, username, color, avatar }

      // Initialize room in memory if it doesn't exist
      if (!activeWorkspaces[roomId]) {
        activeWorkspaces[roomId] = {};
      }

      // Add user to room state
      activeWorkspaces[roomId][socket.id] = {
        userId: user.id,
        username: user.username,
        color: user.color,
        avatar: user.avatar,
        cursor: null // will be { x, y, selectionStart, selectionEnd }
      };

      console.log(`User ${user.username} (${socket.id}) joined workspace: ${roomId}`);

      // Broadcast list of active users in this workspace
      io.to(roomId).emit('workspace-users', Object.values(activeWorkspaces[roomId]));

      // Create activity log in DB
      try {
        await prisma.activityLog.create({
          data: {
            userId: user.id,
            action: 'JOIN_WORKSPACE',
            details: `${user.username} entered the workspace.`
          }
        });
      } catch (err) {
        console.error('Failed to log join workspace:', err);
      }
    });

    // Handle document text changes
    socket.on('document-change', async ({ roomId, text, version, username }) => {
      if (!roomId) return;

      // Broadcast to other users in the room immediately for high responsiveness
      socket.to(roomId).emit('document-update', { text, version, username });

      // Save document to DB (debounced/throttled on client, but we write to DB directly here)
      try {
        await prisma.document.update({
          where: { id: roomId },
          data: { content: text }
        });
      } catch (err) {
        console.error('Failed to auto-save document:', err);
      }
    });

    // Handle document title change
    socket.on('document-title-change', async ({ roomId, title, username }) => {
      if (!roomId || !title) return;

      socket.to(roomId).emit('document-title-update', { title, username });

      try {
        await prisma.document.update({
          where: { id: roomId },
          data: { title }
        });
      } catch (err) {
        console.error('Failed to update title:', err);
      }
    });

    // Handle cursor movement
    socket.on('cursor-move', ({ roomId, cursor }) => {
      if (!roomId || !socket.user) return;

      // Update in memory
      if (activeWorkspaces[roomId] && activeWorkspaces[roomId][socket.id]) {
        activeWorkspaces[roomId][socket.id].cursor = cursor;
      }

      // Broadcast cursor updates to other users
      socket.to(roomId).emit('cursor-update', {
        socketId: socket.id,
        user: socket.user,
        cursor
      });
    });

    // Handle Kanban Task Board operations
    // Task created
    socket.on('task-created', ({ roomId, task }) => {
      if (!roomId) return;
      socket.to(roomId).emit('task-created-update', task);
    });

    // Task moved (drag & drop)
    socket.on('task-moved', async ({ roomId, taskId, status, order, taskList }) => {
      if (!roomId || !taskId) return;

      // Broadcast the move event to all other clients to sync UI instantly
      socket.to(roomId).emit('task-moved-update', { taskId, status, order, taskList });

      // Persist the updates in DB
      try {
        if (taskList && Array.isArray(taskList)) {
          // Bulk update the orders of tasks in the affected columns
          const updatePromises = taskList.map((t) => 
            prisma.task.update({
              where: { id: t.id },
              data: { order: t.order, status: t.status }
            })
          );
          await Promise.all(updatePromises);
        } else {
          await prisma.task.update({
            where: { id: taskId },
            data: { status, order }
          });
        }
      } catch (err) {
        console.error('Failed to update moved task order:', err);
      }
    });

    // Task updated
    socket.on('task-updated', ({ roomId, task }) => {
      if (!roomId) return;
      socket.to(roomId).emit('task-updated-update', task);
    });

    // Task deleted
    socket.on('task-deleted', ({ roomId, taskId }) => {
      if (!roomId) return;
      socket.to(roomId).emit('task-deleted-update', taskId);
    });

    // Handle Whiteboard drawing events
    socket.on('draw-line', ({ roomId, line }) => {
      if (!roomId) return;
      socket.to(roomId).emit('draw-line-update', line);
    });

    socket.on('clear-whiteboard', ({ roomId }) => {
      if (!roomId) return;
      socket.to(roomId).emit('clear-whiteboard-update');
    });

    // Handle Workspace Chat message
    socket.on('send-message', async ({ roomId, text }) => {
      if (!roomId || !socket.user || !text) return;

      try {
        // Save to DB
        const message = await prisma.chatMessage.create({
          data: {
            documentId: roomId,
            userId: socket.user.id,
            text
          },
          include: {
            user: {
              select: {
                username: true,
                avatar: true,
                color: true
              }
            }
          }
        });

        // Broadcast message to everyone in the room (including sender)
        io.to(roomId).emit('receive-message', message);
      } catch (err) {
        console.error('Failed to save/send message:', err);
      }
    });

    // Handle user disconnect
    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${socket.id}`);
      const roomId = socket.roomId;
      const user = socket.user;

      if (roomId && activeWorkspaces[roomId] && activeWorkspaces[roomId][socket.id]) {
        delete activeWorkspaces[roomId][socket.id];

        // If the room is empty now, remove the room key
        if (Object.keys(activeWorkspaces[roomId]).length === 0) {
          delete activeWorkspaces[roomId];
        } else {
          // Broadcast updated user list to others
          io.to(roomId).emit('workspace-users', Object.values(activeWorkspaces[roomId]));
        }

        if (user) {
          // Log leave activity
          try {
            await prisma.activityLog.create({
              data: {
                userId: user.id,
                action: 'LEAVE_WORKSPACE',
                details: `${user.username} left the workspace.`
              }
            });
          } catch (err) {
            console.error('Failed to log leave workspace:', err);
          }
        }
      }
    });
  });
};
