const prisma = require('../utils/prisma');

const getTasks = async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        assignee: {
          select: {
            id: true,
            username: true,
            avatar: true,
            color: true
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { order: 'asc' }
      ]
    });
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Server error retrieving tasks' });
  }
};

const createTask = async (req, res) => {
  const { title, description, status, assigneeId } = req.body;
  const userId = req.user.id;

  if (!title) {
    return res.status(400).json({ error: 'Task title is required' });
  }

  try {
    // Get count to determine order
    const taskCount = await prisma.task.count({
      where: { status: status || 'TODO' }
    });

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'TODO',
        order: taskCount,
        assigneeId: assigneeId || null
      },
      include: {
        assignee: {
          select: {
            id: true,
            username: true,
            avatar: true,
            color: true
          }
        }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'CREATE_TASK',
        details: `${req.user.username} created task "${title}"`
      }
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Server error creating task' });
  }
};

const updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, description, status, order, assigneeId } = req.body;
  const userId = req.user.id;

  try {
    const existingTask = await prisma.task.findUnique({
      where: { id }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existingTask.title,
        description: description !== undefined ? description : existingTask.description,
        status: status !== undefined ? status : existingTask.status,
        order: order !== undefined ? order : existingTask.order,
        assigneeId: assigneeId !== undefined ? assigneeId : existingTask.assigneeId
      },
      include: {
        assignee: {
          select: {
            id: true,
            username: true,
            avatar: true,
            color: true
          }
        }
      }
    });

    // Log activity if status changed
    if (status && status !== existingTask.status) {
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'MOVE_TASK',
          details: `${req.user.username} moved task "${task.title}" to ${status}`
        }
      });
    } else {
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'UPDATE_TASK',
          details: `${req.user.username} updated task "${task.title}"`
        }
      });
    }

    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Server error updating task' });
  }
};

const deleteTask = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const task = await prisma.task.findUnique({
      where: { id }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await prisma.task.delete({
      where: { id }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'DELETE_TASK',
        details: `${req.user.username} deleted task "${task.title}"`
      }
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Server error deleting task' });
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask
};
