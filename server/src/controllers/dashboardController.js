const prisma = require('../utils/prisma');

const getDashboardStats = async (req, res) => {
  try {
    const totalDocs = await prisma.document.count();
    const totalTasks = await prisma.task.count();
    const todoTasks = await prisma.task.count({ where: { status: 'TODO' } });
    const inProgressTasks = await prisma.task.count({ where: { status: 'IN_PROGRESS' } });
    const doneTasks = await prisma.task.count({ where: { status: 'DONE' } });
    
    const recentActivities = await prisma.activityLog.findMany({
      include: {
        user: {
          select: {
            username: true,
            avatar: true,
            color: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 15
    });

    const recentDocs = await prisma.document.findMany({
      include: {
        owner: {
          select: {
            username: true,
            avatar: true,
            color: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 5
    });

    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        avatar: true,
        color: true
      }
    });

    res.json({
      stats: {
        totalDocs,
        totalTasks,
        todoTasks,
        inProgressTasks,
        doneTasks
      },
      recentActivities,
      recentDocs,
      users: allUsers
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Server error retrieving dashboard statistics' });
  }
};

module.exports = {
  getDashboardStats
};
